'use strict';
function createSharedChat({baseUrl,secret,send,fetchImpl=fetch}){
 const base=new URL(baseUrl);if(base.protocol!=='https:')throw Error('Shared chat requires HTTPS');
 let relaying=false;
 async function request(endpoint,body){const response=await fetchImpl(new URL('/api/owner-chat'+endpoint,base),{method:body===undefined?'GET':'POST',headers:{Authorization:`Bearer ${secret}`,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error('Shared chat request failed ('+response.status+')');return response.json();}
 return {
  async submit(text,chatId,messageId){return request('/messages',{text,clientId:`${chatId}:${messageId}`});},
  async decide(id,decision){if(!/^[a-f\d]{24}$/i.test(id))throw Error('Invalid approval ID');return request('/approvals/'+id,{decision});},
  async relay(){
   if(relaying)return;relaying=true;
   try{const result=await request('/relay');for(const message of result.messages){
    let text=(message.role==='user'?'You · Website\n':message.role==='system'?'Approval required\n':'AI Assistant\n')+message.text;
    if(message.approval?.id){if(message.approval.decision){await request('/relay/'+message._id+'/delivered',{});continue;}text+=`\n\nApprove: /approve ${message._id}\nDecline: /decline ${message._id}`;}
    await send(text);await request('/relay/'+message._id+'/delivered',{});
   }}finally{relaying=false;}
  },
 };
}
module.exports={createSharedChat};
