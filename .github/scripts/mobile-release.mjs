import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const workflow = 'mobile-build.yml';
const title = (release, sha) => `Release ${release.tag_name} (${release.id}) at ${sha}`;

async function releaseCommit(github, repository, release) {
  try {
    const result = await github.rest.repos.getCommit({ ...repository, ref: release.tag_name });
    return result.data.sha;
  } catch (error) {
    if (error.status !== 404 && error.status !== 422) throw error;
  }
  const result = await github.rest.repos.getCommit({ ...repository, ref: release.target_commitish });
  return result.data.sha;
}

async function pinReleaseTag(github, repository, release, sha) {
  const ref = `tags/${release.tag_name}`;
  try {
    await github.rest.git.getRef({ ...repository, ref });
  } catch (error) {
    if (error.status !== 404) throw error;
    try {
      await github.rest.git.createRef({ ...repository, ref: `refs/${ref}`, sha });
    } catch (creationError) {
      if (creationError.status === 403 || creationError.status === 404)
        throw new Error(`Cannot create ${release.tag_name} at ${sha}. Create that tag in GitHub, then rerun this job.`, { cause: creationError });
      if (creationError.status !== 422) throw creationError;
    }
  }
  const { data: commit } = await github.rest.repos.getCommit({ ...repository, ref: `refs/${ref}` });
  if (commit.sha !== sha) throw new Error('The release tag does not match the build source');
}

export async function queueDrafts({ github, context, core }) {
  const repository = context.repo;
  const releases = await github.paginate(github.rest.repos.listReleases, {
    ...repository, per_page: 100,
  });
  const drafts = releases.filter((release) => release.draft && release.tag_name && !release.tag_name.startsWith('untagged-'))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  if (!drafts.length) {
    core.info('No draft releases are waiting for a build.');
    return;
  }
  const runs = await github.paginate(github.rest.actions.listWorkflowRuns, {
    ...repository, workflow_id: workflow, event: 'workflow_dispatch', per_page: 100,
  });
  for (const release of drafts) {
    const sha = await releaseCommit(github, repository, release);
    if (runs.some((run) => run.display_title === title(release, sha))) continue;
    await pinReleaseTag(github, repository, release, sha);
    await github.rest.repos.updateRelease({
      ...repository, release_id: release.id, tag_name: release.tag_name,
      target_commitish: context.payload.repository.default_branch,
    });
    await github.rest.actions.createWorkflowDispatch({
      ...repository,
      workflow_id: workflow,
      ref: context.payload.repository.default_branch,
      inputs: { sha, tag: release.tag_name, release_id: String(release.id) },
    });
    core.info(`Queued ${release.tag_name} at ${sha}.`);
    return;
  }
  core.info('Draft releases already have a build attempt. Failed builds can be rerun in Actions.');
}

export async function prepareBuild({ github, context, core }) {
  const repository = context.repo;
  const id = process.env.RELEASE_ID;
  const tag = process.env.RELEASE_TAG;
  const requested = process.env.SOURCE_SHA;
  let sha;
  if (id) {
    if (process.env.BUILD_PLATFORM !== 'all')
      throw new Error('Publishing a release requires both platforms');
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))
      throw new Error('Invalid release ID');
    const { data: release } = await github.rest.repos.getRelease({
      ...repository, release_id: Number(id),
    });
    if (!release.draft || release.tag_name !== tag)
      throw new Error('The selected release must be a matching draft');
    sha = await releaseCommit(github, repository, release);
    if (requested && requested !== sha) throw new Error('The release target has changed');
    await pinReleaseTag(github, repository, release, sha);
    await github.rest.repos.updateRelease({
      ...repository, release_id: release.id, tag_name: release.tag_name,
      target_commitish: context.payload.repository.default_branch,
    });
  } else {
    const result = await github.rest.repos.getCommit({
      ...repository, ref: requested || tag || context.sha,
    });
    sha = result.data.sha;
  }
  const version = /^v?(\d+\.\d+\.\d+)(?:[-+].*)?$/.exec(tag || '')?.[1] ?? '';
  core.setOutput('sha', sha);
  core.setOutput('version', version);
  core.setOutput('build_number', String(1000 + Number(process.env.GITHUB_RUN_NUMBER)));
  await core.summary.addHeading('Mobile build').addTable([
    [{ data: 'Source', header: true }, sha],
    [{ data: 'Release', header: true }, tag || 'Artifacts only'],
    [{ data: 'iOS', header: true }, 'Unsigned device IPA'],
    [{ data: 'Android', header: true }, 'Signed APK'],
  ]).write();
}

export async function publishRelease({ github, context, core }) {
  const repository = context.repo;
  const id = Number(process.env.RELEASE_ID);
  const sha = process.env.SOURCE_SHA;
  const { data: release } = await github.rest.repos.getRelease({
    ...repository, release_id: id,
  });
  if (!release.draft || release.tag_name !== process.env.RELEASE_TAG)
    throw new Error('The release is no longer the selected draft');
  if (await releaseCommit(github, repository, release) !== sha)
    throw new Error('The release target changed while the binaries were building');
  await pinReleaseTag(github, repository, release, sha);
  for (const name of ['Merre.apk', 'Merre-unsigned.ipa']) {
    const filename = path.join(process.env.GITHUB_WORKSPACE, 'artifacts', name);
    const file = await stat(filename);
    if (!file.isFile() || !file.size) throw new Error(`Missing artifact: ${name}`);
  }
  const assets = await github.paginate(github.rest.repos.listReleaseAssets, {
    ...repository, release_id: id, per_page: 100,
  });
  for (const name of ['Merre.apk', 'Merre-unsigned.ipa']) {
    for (const asset of assets.filter((asset) => asset.name === name))
      await github.rest.repos.deleteReleaseAsset({ ...repository, asset_id: asset.id });
    const data = await readFile(path.join(process.env.GITHUB_WORKSPACE, 'artifacts', name));
    await github.rest.repos.uploadReleaseAsset({
      ...repository, release_id: id, name, data,
      headers: { 'content-type': 'application/octet-stream', 'content-length': data.length },
    });
  }
  const { data: published } = await github.rest.repos.updateRelease({
    ...repository, release_id: id, tag_name: release.tag_name,
    target_commitish: context.payload.repository.default_branch, draft: false,
  });
  core.setOutput('url', published.html_url);
  await core.summary.addHeading('Release published').addLink(published.tag_name, published.html_url).write();
}
