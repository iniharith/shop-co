'use strict';
const { randomUUID }=require('node:crypto');
function createStationClient({baseUrl,stationId,deviceKey,fetchImpl=fetch}) {
  const base=new URL(baseUrl);
  if(base.protocol!=='https:')throw new Error('Station endpoint must use HTTPS');
  const configured=/^[a-f\d]{24}$/i.test(stationId||'')&&/^[a-f\d]{64}$/i.test(deviceKey||'');
  async function request(endpoint,options={}) {
    if(!configured)throw new Error('Production Station pairing is not configured');
    const response=await fetchImpl(new URL(endpoint,base),{...options,headers:{'Content-Type':'application/json','X-Station-ID':stationId,'X-Phone-Key':deviceKey},signal:AbortSignal.timeout(15000)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(`Station request failed (${response.status})`);
    return data;
  }
  return {
    async submitBatch(tokens, folder, requestId) {
      const status = await request('/api/production/phone-status');
      if (!status.approved || !status.pcOnline) throw new Error('Production Station is offline or awaiting approval');
      const result = await request('/api/production/scan', {
        method: 'POST',
        body: JSON.stringify({ requestId, batch: { tokens, folder } }),
      });
      if (!/^[a-f\d]{24}$/i.test(result.id || '')) throw new Error('Invalid station response');
      return result;
    },
    async submit(token,requestId=randomUUID()) {
      if(!/^[a-f\d]{48}$/i.test(token||''))throw new Error('Invalid task QR token');
      if(!/^[a-z\d-]{10,80}$/i.test(requestId))throw new Error('Invalid request ID');
      const status=await request('/api/production/phone-status');
      if(!status.approved||!status.pcOnline)throw new Error('Station is offline or the bot is not paired and approved');
      // The request ID is stable during this attempt. Do not auto-retry an
      // ambiguous failure: doing so with a new ID could duplicate a print.
      try { const result=await request('/api/production/scan',{method:'POST',body:JSON.stringify({code:token,requestId})});if(!/^[a-f\d]{24}$/i.test(result.id||''))throw new Error('Invalid station response');return {...result,requestId}; }
      catch { throw new Error(`Station submission uncertain. Check station before retrying. Request ID: ${requestId}`); }
    },
    async status(id) { if(!/^[a-f\d]{24}$/i.test(id||''))throw new Error('Invalid station job ID');return request(`/api/production/scan/${id}`); }
  };
}
module.exports={createStationClient};
