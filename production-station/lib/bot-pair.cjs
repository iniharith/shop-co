'use strict';

// This registers one scan-only device. The server still requires approval on
// the station, and existing phone pairings must never be replaced silently.
async function pairBot({stationId, api, register, persist, ownerId}) {
  if (!/^[a-f\d]{24}$/i.test(stationId || '')) throw new Error('Create a station before pairing the bot');
  const current = await api(`/api/production/stations/${stationId}`);
  if (current.supportsSeparateBot !== true) throw new Error('Shop-Co must be updated before pairing a separate Telegram bot.');
  if (current.botPaired) throw new Error('A Telegram bot is already paired. Unpair it explicitly before pairing another bot.');
  const pairing = await api(`/api/production/stations/${stationId}/pairing`, 'POST');
  if (!/^[a-f\d]{64}$/i.test(pairing.secret || '')) throw new Error('Invalid pairing response');
  const device = await register({stationId, secret:pairing.secret, phoneName:'Telegram bot'});
  if (device.stationId !== stationId || !/^[a-f\d]{64}$/i.test(device.deviceSecret || '')) throw new Error('Invalid bot pairing response');
  await persist({stationId, ownerId, deviceSecret:device.deviceSecret});
  return {stationId, approved:false};
}
module.exports = { pairBot };
