const test=require('node:test'),assert=require('node:assert/strict');
const{createSharedChat}=require('../shared-chat');
test('shared relay retries delivery failures without acknowledging and uses stable request IDs',async()=>{
 const requests=[],sent=[];let fail=true;
 const client=createSharedChat({baseUrl:'https://example.invalid',secret:'private',send:async text=>{if(fail)throw Error('offline');sent.push(text);},fetchImpl:async(url,options)=>{requests.push({path:url.pathname,body:options.body&&JSON.parse(options.body)});return new Response(JSON.stringify(url.pathname.endsWith('/relay')?{messages:[{_id:'0123456789abcdef01234567',role:'assistant',text:'Hello'}]}:{ok:true}),{status:200});}});
 await assert.rejects(client.relay());assert.ok(!requests.some(r=>r.path.endsWith('/delivered')));
 fail=false;await client.relay();assert.equal(sent.length,1);assert.ok(requests.some(r=>r.path.endsWith('/delivered')));
 await client.submit('Hello','123',22);await client.submit('Hello','123',22);
 assert.equal(requests.at(-1).body.clientId,requests.at(-2).body.clientId);
});
test('shared relay keeps overlapping ticks serialized and does not send decided approvals',async()=>{
 let release,count=0;const wait=new Promise(r=>{release=r;});
 const client=createSharedChat({baseUrl:'https://example.invalid',secret:'private',send:async()=>{throw Error('must not send');},fetchImpl:async(url)=>{count++;await wait;return new Response(JSON.stringify(url.pathname.endsWith('/relay')?{messages:[{_id:'0123456789abcdef01234567',role:'system',text:'Run command',approval:{id:'a',decision:'decline'}}]}:{ok:true}));}});
 const first=client.relay();await client.relay();assert.equal(count,1);release();await first;assert.equal(count,2);
 assert.throws(()=>createSharedChat({baseUrl:'http://example.invalid',secret:'private',send:async()=>{}}));
});
