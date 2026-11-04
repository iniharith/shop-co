const fs = require('node:fs');
const fsp = require('node:fs/promises');
const dns = require('node:dns/promises');
const { pipeline } = require('node:stream/promises');
const { Readable, Transform } = require('node:stream');
const MAX_BYTES = 1024 * 1024 * 1024;
function isPrivate(address) {
  const ip = address.toLowerCase();
  if (ip.includes(':')) return ip === '::1' || ip === '::' || ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80:') || ip.startsWith('::ffff:') || !/^[0-9a-f:]+$/.test(ip);
  const n = ip.split('.').map(Number);
  return n[0] === 0 || n[0] === 10 || n[0] === 127 || n[0] >= 224 || (n[0] === 169 && n[1] === 254) || (n[0] === 172 && n[1] >= 16 && n[1] <= 31) || (n[0] === 192 && n[1] === 168) || (n[0] === 100 && n[1] >= 64 && n[1] <= 127);
}
async function download(url, filename, expectedSize = 0) {
  let target = url;
  let response;
  for (let hop = 0; hop < 6; hop++) {
    const parsed = new URL(target);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || (parsed.port && parsed.port !== '443')) throw new Error('Unsafe download URL');
    const addresses = await dns.lookup(parsed.hostname, { all: true });
    if (!addresses.length || addresses.some(item => isPrivate(item.address))) throw new Error('Private network download blocked');
    response = await fetch(target, { redirect: 'manual', signal: AbortSignal.timeout(300000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) { await response.body?.cancel(); target = new URL(response.headers.get('location'), target).href; continue; }
    break;
  }
  if (!response?.ok || !response.body) throw new Error(`File download failed (${response?.status || 'no response'})`);
  if (/text\/html/i.test(response.headers.get('content-type') || '')) { await response.body.cancel(); throw new Error('File URL returned a webpage instead of a file'); }
  const size = Number(response.headers.get('content-length') || 0);
  if (size > MAX_BYTES || expectedSize > MAX_BYTES) { await response.body.cancel(); throw new Error('File exceeds the 1 GB workstation limit'); }
  const temporary = filename + '.partial';
  let received = 0;
  const limiter = new Transform({ transform(chunk, _encoding, done) { received += chunk.length; done(received > MAX_BYTES ? new Error('File exceeds 1 GB') : null, chunk); } });
  try {
    await pipeline(Readable.fromWeb(response.body), limiter, fs.createWriteStream(temporary));
    if (!received || (expectedSize > 0 && received !== expectedSize)) throw new Error('Incomplete file download');
    await fsp.rename(temporary, filename);
    return received;
  } catch (error) { await fsp.rm(temporary, { force: true }); throw error; }
}
module.exports = { download, isPrivate };
