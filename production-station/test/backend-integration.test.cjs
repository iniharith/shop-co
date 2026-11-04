const test = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server');
const backend = require('node:module').createRequire(require('node:path').resolve(__dirname, '../../backend/package.json'));
process.env.JWT_ACCESS_SECRET = 'production-station-isolated-test-access';
process.env.JWT_REFRESH_SECRET = 'production-station-isolated-test-refresh';
process.env.JWT_TOKEN = 'production-station-isolated-test-token';
const mongoose = backend('mongoose');
const express = backend('express');
const User = backend('./dist/infrastructure/db/models/user.model.js').default;
const { Task } = backend('./dist/domain/entities/Task.js');
const { FileUpload } = backend('./dist/domain/entities/FileUpload.js');
const { ProductionStation, ProductionScan } = backend('./dist/domain/entities/ProductionStation.js');
const { productionManifest } = backend('./dist/shared/utils/productionManifest.js');
const routes = backend('./dist/presentation/routes/productionRoutes.js').default;
const JwtService = backend('./dist/shared/utils/jwt.js').default;

test('isolated backend: staff auth, pairing approval, scan acknowledgement and authoritative manifest', { timeout: 180000 }, async () => {
  let mongo, server;
  try {
    mongo = await MongoMemoryServer.create({ instance: { dbName: 'kc_production_isolated_test' } });
    const uri = mongo.getUri(); assert.match(uri, /^mongodb:\/\/127\.0\.0\.1:/);
    await mongoose.connect(uri);
    await Promise.all([ProductionStation.init(), ProductionScan.init(), Task.init(), User.init()]);
    const owner = await User.create({ name: 'Test production', email: 'production@test.invalid', password: 'isolated-test', role: 'production' });
    const other = await User.create({ name: 'Other PC', email: 'other@test.invalid', password: 'isolated-test', role: 'production' });
    const customer = await User.create({ name: 'Customer', email: 'customer@test.invalid', password: 'isolated-test', role: 'client' });
    const jwt = new JwtService();
    const ownerToken = jwt.generateAccessToken({ userId: String(owner._id) }); const otherToken = jwt.generateAccessToken({ userId: String(other._id) }); const customerToken = jwt.generateAccessToken({ userId: String(customer._id) });
    const app = express(); app.use(express.json()); app.use('/api/production', routes); app.use((error, _req, res, _next) => res.status(500).json({ message: error.message }));
    server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve)); const base = `http://127.0.0.1:${server.address().port}/api/production`;
    async function request(endpoint, { token = ownerToken, body, headers = {}, method = body === undefined ? 'GET' : 'POST' } = {}) {
      const response = await fetch(base + endpoint, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });
      return { status: response.status, body: await response.json().catch(() => ({})) };
    }
    assert.equal((await request('/stations', { token: null, body: {} })).status, 401);
    assert.equal((await request('/stations', { token: customerToken, body: {} })).status, 401);
    const station = await request('/stations', { body: { name: 'Printing PC' } }); assert.equal(station.status, 200); const id = station.body.id;
    assert.equal((await request(`/stations/${id}`, { token: otherToken })).status, 404);
    const pairing = await request(`/stations/${id}/pairing`, { body: {} });
    const device = await request('/pair', { token: null, body: { stationId: id, secret: pairing.body.secret, phoneName: 'Android test' } }); assert.equal(device.status, 200);
    assert.equal((await request('/pair', { token: null, body: { stationId: id, secret: pairing.body.secret } })).status, 410);
    const phoneHeaders = { 'X-Station-ID': id, 'X-Phone-Key': device.body.deviceSecret };
    const code = 'ab'.repeat(24), event = { code, requestId: 'request-0000000001' };
    assert.equal((await request('/scan', { token: null, headers: phoneHeaders, body: event })).status, 403);
    assert.equal((await request(`/stations/${id}/approve`, { body: {} })).status, 200);
    const status = await request('/phone-status', { token: null, headers: phoneHeaders }); assert.equal(status.body.approved, true); assert.equal(status.body.pcOnline, true);
    const duplicate = await Promise.all([request('/scan', { token: null, headers: phoneHeaders, body: event }), request('/scan', { token: null, headers: phoneHeaders, body: event })]);
    assert.ok(duplicate.every(item => item.status === 200)); assert.equal(duplicate[0].body.id, duplicate[1].body.id); assert.equal(await ProductionScan.countDocuments({ stationId: id }), 1);
    assert.equal((await request(`/stations/${id}/scans`)).body.scans.length, 1);
    await request(`/stations/${id}/scans/${duplicate[0].body.id}/ack`, { body: { status: 'received', message: 'PC received job' } });
    assert.equal((await request(`/stations/${id}/scans`)).body.scans.length, 0);
    await request(`/stations/${id}/scans/${duplicate[0].body.id}/ack`, { body: { status: 'ready', message: 'Files downloaded' } });
    assert.equal((await request(`/scan/${duplicate[0].body.id}`, { token: null, headers: phoneHeaders })).body.status, 'ready');
    await request(`/stations/${id}/phone`, { method: 'DELETE' });
    assert.equal((await request('/phone-status', { token: null, headers: phoneHeaders })).status, 401);
    const task = await Task.create({ title: 'Manual draft job', qrToken: code, files: [{ name: 'Stale name', url: 'https://example.com/current.pdf', tag: 'for_print' }], lineItems: [], status: 'IN_PRODUCTION' });
    await FileUpload.collection.insertMany([
      { taskId: String(task._id), userId: String(owner._id), path: 'https://example.com/current.pdf', filename: 'Draft.pdf', originalName: 'Authoritative draft.pdf', tag: 'draft', size: 42, updatedAt: new Date() },
      { taskId: String(task._id), userId: String(owner._id), path: 'https://example.com/print.pdf', filename: 'Print.pdf', originalName: 'Print.pdf', tag: 'for_print', size: 50, updatedAt: new Date() },
    ]);
    const manifest = await productionManifest(code); assert.equal(manifest.task.orderId, null); assert.equal(manifest.files.length, 2); assert.equal(manifest.files.find(file => file.tag === 'draft').name, 'Authoritative draft.pdf'); assert.equal(manifest.labels.length, 0);
    const endpoint = await request('/manifest/' + code); assert.equal(endpoint.status, 200); assert.ok(endpoint.body.warnings.some(warning => warning.includes('AWB unavailable')));
    assert.equal((await request('/manifest/' + code, { token: customerToken })).status, 401);
    await Task.updateOne({ _id: task._id }, { $set: { isDeleted: true } }); assert.equal((await request('/manifest/' + code)).status, 404);
    const expired = await request(`/stations/${id}/pairing`, { body: {} }); await ProductionStation.updateOne({ _id: id }, { $set: { pairingExpiresAt: new Date(Date.now() - 1000) } });
    assert.equal((await request('/pair', { token: null, body: { stationId: id, secret: expired.body.secret } })).status, 410);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect(); if (mongo) await mongo.stop();
  }
});
