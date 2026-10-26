import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import {
  boardingPresentation,
  fullScreenPresentation,
  loadOwnerLogo,
  renderFullScreenDocument,
  renderInspectorSvg,
  type Ticket,
  type ValidationResponse,
} from 'budapestgo-api/mobile';
import { recordBoarding } from './boarding-history.native';
import type { TicketPresentation } from '../tickets/types';

let fontsRequest: Promise<{ regular: string; bold: string }> | null = null;
async function fonts() {
  fontsRequest ??= Promise.all(
    [
      require('../../../assets/budapestgo/barlow_regular.ttf'),
      require('../../../assets/budapestgo/barlow_bold.ttf'),
    ].map(async (module) => {
      const asset = await Asset.fromModule(module).downloadAsync();
      if (!asset.localUri) throw new Error('Font unavailable');
      return `data:font/ttf;base64,${await new File(asset.localUri).base64()}`;
    }),
  )
    .then(([regular, bold]) => ({ regular, bold }))
    .catch((error) => {
      fontsRequest = null;
      throw error;
    });
  return fontsRequest;
}
const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );
export async function boardingScreen(
  accountId: string,
  ticketId: string,
  response: ValidationResponse,
  receivedAt: number,
  code: string,
  labels: Record<string, string>,
  language: 'hu' | 'en',
): Promise<TicketPresentation> {
  const animation = boardingPresentation(response, { receivedAt });
  const shownTicket = await recordBoarding(accountId, ticketId, code, response.secret!.timestamp!);
  const screen = fullScreenPresentation(animation, response.purchase!, {
    labels: { labelDictionaries: { [language.toUpperCase()]: labels } },
    language: language === 'hu' ? 'HU' : 'EN',
    shownTicket,
    serverTime: response.secret!.timestamp!,
  });
  const [fontData, logo] = await Promise.all([
    fonts(),
    screen.ownerLogoUrl ? loadOwnerLogo(screen.ownerLogoUrl) : undefined,
  ]);
  const html = renderFullScreenDocument(screen, { fonts: fontData, ownerLogoDataUri: logo });
  return {
    accountId,
    title: screen.productName,
    embeddedClose: true,
    html,
    expiresAt: screen.expiresAt,
  };
}
export async function inspectorScreen(
  accountId: string,
  tokenId: string,
  ticket: Ticket,
  name: string,
  receivedAt: number,
  language: 'hu' | 'en',
): Promise<TicketPresentation> {
  const svg = await renderInspectorSvg(tokenId);
  const expiresAt = receivedAt + 600_000;
  const title = language === 'hu' ? 'Bemutatás az ellenőrnek' : 'Present to inspector';
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; base-uri 'none'"><style>*{box-sizing:border-box}html,body{height:100%;margin:0;background:#fff;color:#232139;font-family:system-ui,sans-serif}main{height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:24px}h1{font-size:22px;text-align:center}p{text-align:center;color:#666}.code{width:100%;max-width:460px;aspect-ratio:1}.code svg{width:100%;height:100%}time{font-variant-numeric:tabular-nums}</style></head><body><main><h1>${escape(name)}</h1><p>${title}</p><div class="code">${svg}</div><time></time><p>${escape(String(ticket.validityEnd ?? ''))}</p></main><script>const start=performance.now(),remaining=${expiresAt - Date.now()};function tick(){if(Date.now()>=${expiresAt}||performance.now()-start>=remaining){document.body.replaceChildren();return;}document.querySelector('time').textContent=new Date().toLocaleTimeString('${language === 'hu' ? 'hu-HU' : 'en-GB'}');}tick();setInterval(tick,250);</script></body></html>`;
  return { accountId, title, html, expiresAt };
}
