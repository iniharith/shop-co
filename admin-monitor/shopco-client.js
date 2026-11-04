'use strict';

// All writes go through Shop-Co's normal authenticated task route, preserving
// its activity history, status transition handling and conflict checks.
const TASK_ID = /^[a-f\d]{24}$/i;
const STATUSES = new Set(['PLACED','IN_PROGRESS','PENDING_ARTWORK','ARTWORK_REVIEWED','ARTWORK_REJECTED','IN_DESIGN','PEMBETULAN','DONE_DESIGN','IN_PRODUCTION','PRINT_AWB','DONE_PRINTING','PACKAGING','SHIPPED','IN_TRANSIT','DELIVERED','CANCELLED','FAILED','RETURN']);
const EDITABLE = new Set(['title','description','dueDate']);

function validateChanges(changes) {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) throw new Error('Invalid task changes');
  const entries = Object.entries(changes);
  if (!entries.length) throw new Error('No task changes supplied');
  for (const [key,value] of entries) {
    if (key === 'status') { if (!STATUSES.has(value)) throw new Error('Invalid task status'); continue; }
    if (!EDITABLE.has(key)) throw new Error(`Field is not supported: ${key}`);
    if (key === 'dueDate') { if (value !== null && (typeof value !== 'string' || !Number.isFinite(Date.parse(value)))) throw new Error('Invalid due date'); }
    else if (typeof value !== 'string' || !value.trim() || value.length > (key === 'title' ? 300 : 10000)) throw new Error(`Invalid ${key}`);
  }
  return Object.fromEntries(entries);
}

function createShopCoClient({ baseUrl, getAccessToken, refreshAccessToken, fetchImpl = fetch }) {
  const base = new URL(baseUrl);
  if (base.protocol !== 'https:') throw new Error('Shop-Co URL must use HTTPS');
  async function request(endpoint, options = {}, retry = true) {
    const token = await getAccessToken();
    if (!token) throw new Error('Shop-Co authentication is not configured');
    const response = await fetchImpl(new URL(endpoint,base), { ...options, headers:{...options.headers,Authorization:`Bearer ${token}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(30000) });
    if (response.status === 401 && retry && refreshAccessToken) { await refreshAccessToken(); return request(endpoint,options,false); }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { const error = new Error(response.status === 409 ? 'Task changed since it was read. Search again.' : `Shop-Co request failed (${response.status})`); error.status=response.status; throw error; }
    return body;
  }
  return {
    async getTask(id) { if (!TASK_ID.test(id)) throw new Error('Invalid task ID'); const data=await request(`/api/tasks/${id}`); if(!data.task || data.task.isDeleted) throw new Error('Task not found'); return data.task; },
    async getTaskQr(id) { if (!TASK_ID.test(id)) throw new Error('Invalid task ID'); const data=await request(`/api/tasks/${id}/qr`); if(!/^[a-f\d]{48}$/i.test(data.token || '')) throw new Error('Task QR is unavailable'); return data.token; },
    async updateTask(id, changes, expectedUpdatedAt) {
      if (!TASK_ID.test(id)) throw new Error('Invalid task ID');
      if (typeof expectedUpdatedAt !== 'string' || !Number.isFinite(Date.parse(expectedUpdatedAt))) throw new Error('Task version is required');
      const safe=validateChanges(changes);
      const data=await request(`/api/tasks/${id}`,{method:'PUT',body:JSON.stringify({...safe,expectedUpdatedAt})});
      if (!data.task) throw new Error('Task update response missing task');
      return data.task;
    }
  };
}
module.exports={createShopCoClient,validateChanges};
