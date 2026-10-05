const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateImageAnnotations, canAccessFileAnnotations } = require('../dist/shared/utils/fileAnnotations');

const pin = { id: 'pin-1', kind: 'pin', color: '#ef4444', width: 3, x: .2, y: .7, text: 'Adjust here' };
test('image annotations preserve normalized coordinates and remove unapproved fields', () => {
  const input = [{ ...pin, editorId: 'forged-user', dangerous: '<script>' }, { id: 'stroke-1', kind: 'stroke', color: '#00aaFF', width: 2, points: [{ x: 0, y: 1 }, { x: .5, y: .5, extra: true }] }];
  const result = validateImageAnnotations(input);
  assert.deepEqual(result[0], pin);
  assert.deepEqual(result[1].points, [{ x: 0, y: 1 }, { x: .5, y: .5 }]);
  assert.equal(result[0].editorId, undefined);
  assert.deepEqual(validateImageAnnotations([]), []);
});
test('invalid, oversized and duplicate annotations are rejected', () => {
  for (const input of [null, {}, Array(201).fill(pin), [pin, pin], [{ ...pin, x: -1 }], [{ ...pin, y: 1.1 }], [{ ...pin, x: Infinity }], [{ ...pin, text: 'x'.repeat(2001) }], [{ ...pin, width: 0 }], [{ ...pin, kind: 'html' }], [{ ...pin, color: 'url(example)' }], [{ ...pin, id: '$set' }], [{ ...pin, kind: 'stroke', points: [] }], [{ ...pin, kind: 'stroke', points: [{ x: NaN, y: 0 }] }]]) {
    assert.throws(() => validateImageAnnotations(input));
  }
  assert.throws(() => validateImageAnnotations(Array.from({ length: 6 }, (_, i) => ({ ...pin, id: `stroke-${i}`, kind: 'stroke', points: Array(3000).fill({ x: .5, y: .5 }) }))));
});
test('customers can access their own files or orders; other customers cannot', () => {
  assert.equal(canAccessFileAnnotations({ userId: 'owner', role: 'client' }, { userId: 'owner' }), true);
  assert.equal(canAccessFileAnnotations({ userId: 'owner', role: 'client' }, { userId: 'staff' }, 'owner'), true);
  assert.equal(canAccessFileAnnotations({ userId: 'other', role: 'client' }, { userId: 'owner' }), false);
  assert.equal(canAccessFileAnnotations({ userId: 'other', role: 'unknown' }, { userId: 'owner' }), false);
  for (const role of ['admin', 'sysadmin', 'boss', 'designer', 'production', 'packaging', 'awapparel']) assert.equal(canAccessFileAnnotations({ userId: 'staff', role }, { userId: 'owner' }), true);
});

test('annotation API isolates editors and rejects stale saves without changing other layers', async () => {
  const express = require('express');
  const middlewarePath = require.resolve('../dist/presentation/middlewares/auth.middileware');
  const originalMiddleware = require.cache[middlewarePath];
  require.cache[middlewarePath] = { id: middlewarePath, filename: middlewarePath, loaded: true, exports: { __esModule: true, default: (req, _res, next) => {
    req.userId = req.headers['x-test-user'] || 'owner'; req.role = req.headers['x-test-role'] || 'client';
    req.user = { name: req.userId === 'owner' ? 'Customer' : 'Harith' }; next();
  } } };
  const { FileUpload } = require('../dist/domain/entities/FileUpload');
  const { FileAnnotation } = require('../dist/domain/entities/FileAnnotation');
  const originals = { file: FileUpload.findById, find: FileAnnotation.find, init: FileAnnotation.init, create: FileAnnotation.create, update: FileAnnotation.findOneAndUpdate };
  const fileId = '111111111111111111111111';
  const records = [];
  FileUpload.findById = () => ({ lean: async () => ({ _id: fileId, userId: 'owner', originalName: 'art.png', mimetype: 'image/png' }) });
  FileAnnotation.init = async () => {};
  FileAnnotation.find = query => ({ sort: () => ({ lean: async () => records.filter(record => record.fileId === query.fileId) }) });
  FileAnnotation.create = async record => {
    if (records.some(other => other.fileId === record.fileId && other.editorId === record.editorId)) throw Object.assign(new Error('duplicate'), { code: 11000 });
    records.push(record); return record;
  };
  FileAnnotation.findOneAndUpdate = async (query, change) => {
    const record = records.find(record => record.fileId === query.fileId && record.editorId === query.editorId && record.revision === query.revision);
    if (!record) return null;
    Object.assign(record, change.$set); record.revision++; return record;
  };
  const routerPath = require.resolve('../dist/presentation/routes/fileAnnotationRoutes');
  delete require.cache[routerPath];
  const app = express(); app.use(express.json()); app.use('/annotations', require(routerPath).default);
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}/annotations/${fileId}`;
  const send = (body, user = 'owner', role = 'client') => fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-test-user': user, 'x-test-role': role }, body: JSON.stringify(body) });
  try {
    let response = await send({ revision: 0, items: [pin], editorId: 'forged', editorName: 'Forged' });
    assert.equal(response.status, 200);
    let saved = (await response.json()).data;
    assert.equal(saved.editorId, 'owner'); assert.equal(saved.editorName, 'Customer');
    response = await send({ revision: 0, items: [{ ...pin, text: 'Staff layer' }] }, 'staff', 'admin');
    assert.equal(response.status, 200); assert.equal(records.length, 2);
    response = await send({ revision: 1, items: [{ ...pin, text: 'Customer change' }] });
    assert.equal(response.status, 200);
    response = await send({ revision: 1, items: [{ ...pin, text: 'Stale overwrite' }] });
    assert.equal(response.status, 409);
    assert.equal(records[0].items[0].text, 'Customer change'); assert.equal(records[1].items[0].text, 'Staff layer');
    response = await send({ revision: 0, items: [pin] }, 'stranger'); assert.equal(response.status, 403);
    response = await fetch(url, { headers: { 'x-test-user': 'stranger' } }); assert.equal(response.status, 403);
    response = await fetch(url); assert.equal(response.status, 200); assert.equal((await response.json()).data.length, 2);
    response = await send({ revision: 2, items: [] }); assert.equal(response.status, 200); assert.deepEqual(records[0].items, []);
    assert.equal(records[1].items[0].text, 'Staff layer');
  } finally {
    await new Promise(resolve => server.close(resolve));
    FileUpload.findById = originals.file; FileAnnotation.find = originals.find; FileAnnotation.init = originals.init;
    FileAnnotation.create = originals.create; FileAnnotation.findOneAndUpdate = originals.update;
    delete require.cache[routerPath];
    if (originalMiddleware) require.cache[middlewarePath] = originalMiddleware; else delete require.cache[middlewarePath];
  }
});
