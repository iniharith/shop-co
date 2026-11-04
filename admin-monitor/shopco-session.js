'use strict';
// Separate staff account recommended. Password is read only from process secrets.
function createSession({baseUrl,email,password,fetchImpl=fetch}) {
  const base=new URL(baseUrl); if(base.protocol!=='https:') throw new Error('Shop-Co URL must use HTTPS');
  let accessToken=null,refreshToken=null,pending=null;
  async function auth(endpoint,body){
    const res=await fetchImpl(new URL(endpoint,base),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)});
    const data=await res.json().catch(()=>({}));
    if(!res.ok || !data.accessToken || !data.refreshToken) throw new Error('Shop-Co sign-in failed');
    accessToken=data.accessToken; refreshToken=data.refreshToken; return accessToken;
  }
  async function login(){if(!email||!password)throw new Error('Shop-Co staff account is not configured');return auth('/api/auth/login',{email,password});}
  function single(fn){if(!pending)pending=fn().finally(()=>{pending=null});return pending;}
  return {getAccessToken:()=>accessToken ? Promise.resolve(accessToken) : single(login),refreshAccessToken:()=>single(async()=>{if(refreshToken){try{return await auth('/api/auth/refresh',{refreshToken})}catch{accessToken=null;refreshToken=null}}return login()})};
}
module.exports={createSession};
