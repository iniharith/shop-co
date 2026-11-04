'use strict';
// Run on the Windows workstation. It makes outbound requests only; Ollama is
// kept bound to loopback. Do not expose its port on the public network.
const cloud=process.env.MODEL_BRIDGE_URL,secret=process.env.MODEL_BRIDGE_SECRET;
if(!cloud||!secret||secret.length<32){console.error('Set MODEL_BRIDGE_URL and MODEL_BRIDGE_SECRET.');process.exit(1)}
const base=new URL(cloud);if(base.protocol!=='https:'&&!(base.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(base.hostname))){console.error('Bridge must use HTTPS.');process.exit(1)}
if(base.username||base.password||base.search||base.hash){console.error('Invalid bridge URL.');process.exit(1)}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function bridge(path,options={}){const r=await fetch(new URL(path,base),{...options,headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error(`Bridge returned ${r.status}`);return r.json()}
async function main(){for(;;){try{const data=await bridge('/work');if(!data.job){await sleep(2000);continue}let result;try{const r=await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data.job.request),signal:AbortSignal.timeout(165000)});if(!r.ok)throw new Error('Model request failed');result={id:data.job.id,response:await r.json()}}catch{result={id:data.job.id,error:'Model request failed'}}await bridge('/result',{method:'POST',body:JSON.stringify(result)});}catch{console.error('Model bridge unavailable; retrying.');await sleep(5000)}}}
main().catch(()=>{console.error('Model worker stopped.');process.exit(1)});
