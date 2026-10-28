import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { BudapestGoClient, MobileWallet } from '../vendor/budapestgo-api/dist/mobile/index.js';

// No network, account credentials, or real tickets are used by this test.
globalThis.fetch = () => { throw new Error('Unexpected network request'); };
const unused = { purchaseId: 'coupon-1', ticketValidity: 'START_ON_VALIDATION', validToken: true,
  validationByUserAvailable: true, tokenId: 'test-token', purchaseGroupId: 'bundle', purchaseGroupItem: 1,
  validityInfo: { fixGroupValue: 10 } };
const client = new BudapestGoClient('test-installation', null, async () => {}, {});
let ticket = unused;
let mutations = [];
client.details = async () => ticket;
client.request = async (path, body) => { mutations.push({ path, body }); return { purchase: { ...ticket, ticketValidity: 'VALID' } }; };
const code = { kind: 'code', value: 'vehicle-code', title: 'Test' };
await assert.rejects(client.validate('coupon-1', code));
await assert.rejects(client.inspector('coupon-1'));
await assert.rejects(client.validate('coupon-1', { kind: 'metro', stationId: 'station' }, { allowActivation: true }));
assert.equal(mutations.length, 0);
await client.validate('coupon-1', code, { allowActivation: true });
assert.equal(mutations.length, 1);
assert.equal(mutations[0].body.validationType, 'QR');
assert.equal(mutations[0].body.purchaseId, 'coupon-1');
for (const status of ['INVALID', 'FUTURE_VALID', 'SUSPENDED']) {
  ticket = { ...unused, ticketValidity: status };
  await assert.rejects(client.validate('coupon-1', code, { allowActivation: true }));
}
for (const patch of [{validToken:false}, {validationByUserAvailable:false}, {storno:true}]) {
  ticket = {...unused, ...patch};
  await assert.rejects(client.validate('coupon-1', code, {allowActivation:true}));
}
assert.equal(mutations.length, 1);
ticket = {...unused, ticketValidity:'VALID'};
await client.validate('coupon-1', code);
assert.equal(mutations.length, 2);
const wallet = new MobileWallet({profile:{installation:{applicationId:'00000000-0000-4000-8000-000000000000'},session:{expiresAt:1,accessToken:'mock'}},crypto:{},persist:async()=>{},store:{read:async()=>null,write:async()=>{}},fonts:async()=>({regular:'mock',bold:'mock'})});
wallet.client.tickets = async()=>[unused,{...unused,purchaseId:'coupon-2',purchaseGroupItem:2}];
wallet.client.labels = async()=>({});
const coupons = await wallet.tickets();
assert.equal(coupons.length, 2);
assert(coupons.every(t=>t.canBoard && !t.canInspect && t.groupId==='bundle'));
assert.deepEqual(coupons.map(t=>t.groupItem),[1,2]);

const cache = new Map();
function load(name) {
  if(cache.has(name))return cache.get(name);
  const module={exports:{}};
  const source=fs.readFileSync(`src/lib/tickets/${name}.ts`,'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(code,{module,exports:module.exports,require:p=>load(p.replace('./','')),Set,JSON,Error});
  cache.set(name,module.exports);return module.exports;
}
const {presentBoardingTickets}=load('boarding-batch');
const owned = [1,2,3].map(n=>({id:String(n),accountId:'account',status:'START_ON_VALIDATION',bound:true,canBoard:true}));
const calls=[];const attempts=[];
const result=await presentBoardingTickets(owned,async t=>{calls.push(t.id);if(t.id==='2')throw new Error('timeout');return {html:'first-success'};},t=>attempts.push(t.id));
assert.deepEqual(calls,['1','2']);assert.deepEqual(attempts,['1','2']);
assert.equal(result.presentations.length,1);assert.equal(result.total,3);assert(result.error);
await assert.rejects(presentBoardingTickets([owned[0],owned[0]],()=>{throw new Error('must not run');},()=>{}));
const eligibility=load('eligibility');
assert(eligibility.isWalletTicketAvailable({status:'START_ON_VALIDATION'}));
assert(!eligibility.isWalletTicketAvailable({status:'INVALID'}));
assert(!eligibility.isBoardableTicket({...owned[0],bound:false}));
console.log('PASS: activation guard, server permissions, coupon identity, sequential execution, partial failure, duplicate prevention and wallet eligibility.');
