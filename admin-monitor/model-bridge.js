'use strict';
const http=require('node:http');const crypto=require('node:crypto');
const MAX_BODY=16*1024*1024;
function createModelBridge({secret,timeoutMs=180000,maxPending=4}){
  if(typeof secret!=='string'||secret.length<32)throw new Error('Model bridge secret must be at least 32 characters');
  const pending=new Map();let lastWorkerAt=0;
  function authorized(value){const expected=Buffer.from(`Bearer ${secret}`),actual=Buffer.from(value||'');return expected.length===actual.length&&crypto.timingSafeEqual(expected,actual);}
  async function body(req){let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>MAX_BODY)throw new Error('Body too large');chunks.push(chunk)}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
  function send(res,status,data){const out=JSON.stringify(data);res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(out);}
  const server=http.createServer(async(req,res)=>{
    if(!authorized(req.headers.authorization))return send(res,401,{error:'Unauthorized'});
    try {
      if(req.method==='GET'&&req.url==='/work'){
        lastWorkerAt=Date.now();const entry=[...pending.values()].find(x=>!x.claimed);
        if(!entry)return send(res,200,{job:null});entry.claimed=true;return send(res,200,{job:{id:entry.id,request:entry.request}});
      }
      if(req.method==='POST'&&req.url==='/result'){
        const result=await body(req);const entry=pending.get(result.id);
        if(!entry||!entry.claimed)return send(res,404,{error:'Job expired'});
        pending.delete(result.id);clearTimeout(entry.timer);
        if(result.error)entry.reject(new Error('Local model worker failed'));else if(!result.response||typeof result.response!=='object')entry.reject(new Error('Invalid local model response'));else entry.resolve(result.response);
        return send(res,200,{ok:true});
      }
      return send(res,404,{error:'Not found'});
    }catch{return send(res,400,{error:'Invalid request'});}
  });
  function infer(request){
    if(!lastWorkerAt||Date.now()-lastWorkerAt>30000)throw new Error('Local model worker is offline');
    if(pending.size>=maxPending)throw new Error('Local model queue is busy');
    if(Buffer.byteLength(JSON.stringify(request))>MAX_BODY)throw new Error('Model request too large');
    const id=crypto.randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(new Error('Local model timed out'));},timeoutMs);pending.set(id,{id,request,resolve,reject,timer,claimed:false});});
  }
  function close(){for(const entry of pending.values()){clearTimeout(entry.timer);entry.reject(new Error('Model bridge stopped'));}pending.clear();return new Promise(resolve=>server.close(resolve));}
  return {server,infer,close};
}
module.exports={createModelBridge};
