const test = require('node:test');
const assert = require('node:assert/strict');
const {
  isTaskAwbToken, taskAwbManifest, taskAwbDownloadUrl, TASK_AWB_URL_TTL_SECONDS,
} = require('../dist/shared/utils/taskAwbManifest');

const token = 'a1'.repeat(24);
const stored = name => `https://kampungcetak-storage.s3.ap-southeast-5.amazonaws.com/labels/${name}`;
function fixture(overrides = {}) {
  const calls = { tasks: [], files: [], parcels: [], orders: [], signed: [] };
  const deps = {
    bucket: 'kampungcetak-storage',
    findTask: async value => {
      calls.tasks.push(value);
      return { _id: 'task-1', title: 'Production task', files: [], customerUsername: 'private-customer', dueDate: 'private-date' };
    },
    findFiles: async value => { calls.files.push(value); return []; },
    findParcels: async value => { calls.parcels.push(value); return []; },
    findOrder: async value => { calls.orders.push(value); return null; },
    signS3: async (key, expiresIn) => {
      calls.signed.push({ key, expiresIn });
      return `https://signed.example/${key}?expires=${expiresIn}`;
    },
    ...overrides,
  };
  return { deps, calls };
}

test('QR AWB capability rejects malformed tokens before any database lookup', async () => {
  const { deps, calls } = fixture();
  for (const value of [undefined, null, {}, '', 'f'.repeat(47), 'f'.repeat(49), 'z'.repeat(48), ` ${token}`, `https://admin.kampungcetak.com/task-access/${token}`]) {
    assert.equal(isTaskAwbToken(value), false);
    assert.equal(await taskAwbManifest(value, deps), null);
  }
  assert.deepEqual(calls.tasks, []);
  assert.equal(isTaskAwbToken(token.toUpperCase()), true);
  await taskAwbManifest(token.toUpperCase(), deps);
  assert.deepEqual(calls.tasks, [token]);
});

test('missing or deleted tasks disclose no labels and do not query their files', async () => {
  for (const task of [null, { _id: 'deleted', isDeleted: true }]) {
    const { deps, calls } = fixture({ findTask: async () => task });
    assert.equal(await taskAwbManifest(token, deps), null);
    assert.deepEqual(calls.files, []);
    assert.deepEqual(calls.parcels, []);
    assert.deepEqual(calls.signed, []);
  }
});

test('only AWB files are exposed and authoritative tags override stale embedded tags', async () => {
  const { deps, calls } = fixture({
    findTask: async () => ({
      _id: 'task-1', title: 'Ready to ship', customerUsername: 'private-customer',
      files: [
        { url: stored('stale.pdf'), name: 'Stale AWB.pdf', tag: 'awb' },
        { url: stored('retagged.pdf'), name: 'Was a draft.pdf', tag: 'draft' },
        { url: stored('legacy.pdf'), name: 'Legacy AWB.pdf', tag: 'awb' },
        { url: stored('private.pdf'), name: 'Draft.pdf', tag: 'draft' },
      ],
    }),
    findFiles: async () => [
      { path: stored('stale.pdf'), originalName: 'Now a draft.pdf', tag: 'draft' },
      { path: stored('retagged.pdf'), originalName: 'Current AWB.pdf', tag: 'awb', mimetype: 'application/pdf' },
      { path: stored('private.pdf'), originalName: 'Draft.pdf', tag: 'draft' },
      { path: stored('print.pdf'), tag: 'for_print' },
      { path: stored('attached.png'), originalName: 'Separate AWB.png', tag: 'awb', mimetype: 'image/png' },
    ],
  });
  const result = await taskAwbManifest(token, deps);
  assert.deepEqual(result.task, { title: 'Ready to ship' });
  assert.deepEqual(Object.keys(result).sort(), ['labels', 'task']);
  assert.deepEqual(result.labels.map(label => label.name), ['Current AWB.pdf', 'Legacy AWB.pdf', 'Separate AWB.png']);
  assert.deepEqual(calls.signed.map(call => call.key), ['labels/retagged.pdf', 'labels/legacy.pdf', 'labels/attached.png']);
  assert.ok(result.labels.every(label => /^[a-f\d]{64}$/.test(label.id) && /^[a-f\d]{64}$/.test(label.version)));
});

test('S3 signing uses only the configured bucket and a five minute lifetime', async () => {
  const { deps, calls } = fixture();
  assert.equal(TASK_AWB_URL_TTL_SECONDS, 300);
  const signed = await taskAwbDownloadUrl(`${stored('my%20label.pdf')}?old-signature=ignored`, deps);
  assert.match(signed, /expires=300$/);
  assert.deepEqual(calls.signed, [{ key: 'labels/my label.pdf', expiresIn: 300 }]);
  for (const url of [
    'https://other-bucket.s3.ap-southeast-5.amazonaws.com/private.pdf',
    'https://kampungcetak-storage.s3.ap-southeast-5.amazonaws.com.attacker.com/private.pdf',
    'https://kampungcetak-storage.s3.ap-southeast-5.amazonaws.com@attacker.com/private.pdf',
    'http://kampungcetak-storage.s3.ap-southeast-5.amazonaws.com/labels/a.pdf',
    'https://kampungcetak-storage.s3.ap-southeast-5.amazonaws.com/',
    'https://kampungcetak-storage.s3.ap-southeast-5.amazonaws.com/%ZZ',
    'https://kampungcetak-storage.s3.ap-southeast-5.amazonaws.com/a%00.pdf',
    'https://kampungcetak-storage.s3.ap-southeast-5.amazonaws.com:8443/a.pdf',
  ]) assert.equal(await taskAwbDownloadUrl(url, deps), null, url);
  assert.equal(calls.signed.length, 1);
});

test('courier downloads require public HTTPS hosts and never sign other buckets', async () => {
  const { deps, calls } = fixture();
  assert.equal(await taskAwbDownloadUrl('https://cdn.easyparcel.com/awb/A6.pdf', deps, true), 'https://cdn.easyparcel.com/awb/A6.pdf');
  for (const url of [
    'http://cdn.easyparcel.com/awb.pdf', 'file:///awb.pdf', 'https://127.0.0.1/awb.pdf',
    'https://192.168.0.2/awb.pdf', 'https://[::1]/awb.pdf', 'https://2130706433/awb.pdf',
    'https://localhost/awb.pdf', 'https://printer.local/awb.pdf', 'https://server.internal/awb.pdf',
    'https://server/awb.pdf', 'https://user:password@cdn.easyparcel.com/awb.pdf',
  ]) assert.equal(await taskAwbDownloadUrl(url, deps, true), null, url);
  assert.deepEqual(calls.signed, []);
});

test('active parcels use platform order numbers and prefer A6 over A4 or uploaded fallback', async () => {
  const { deps, calls } = fixture({
    findTask: async () => ({ _id: 'task-1', title: 'Parcel task', orderId: '585541340061730111', files: [] }),
    findParcels: async orderId => {
      calls.parcels.push(orderId);
      return [
        { status: 'cancelled', awbUrl: 'https://cdn.easyparcel.com/cancelled.pdf' },
        { status: 'delivered', awbUrl: 'https://cdn.easyparcel.com/delivered.pdf' },
        { status: 'pending', bookingStatus: 'failed', awbUrl: 'https://cdn.easyparcel.com/failed.pdf' },
        { status: 'pending', trackingNumber: 'TRACK-123', awbUrlsByFormat: { A6: 'https://cdn.easyparcel.com/A6.pdf', A4: 'https://cdn.easyparcel.com/A4.pdf' } },
      ];
    },
    findFiles: async () => [{ path: stored('fallback.pdf'), tag: 'awb' }],
  });
  const result = await taskAwbManifest(token, deps);
  assert.deepEqual(calls.parcels, ['585541340061730111']);
  assert.deepEqual(calls.orders, []);
  assert.deepEqual(calls.signed, []);
  assert.equal(result.labels.length, 1);
  assert.equal(result.labels[0].format, 'A6');
  assert.equal(result.labels[0].url, 'https://cdn.easyparcel.com/A6.pdf');
});

test('website order labels are fallback and cancelled/deleted orders cannot expose their AWB', async () => {
  for (const order of [
    { orderStatus: 'PLACED', awbUrl: 'https://cdn.easyparcel.com/order.pdf' },
    { orderStatus: 'CANCELLED', awbUrl: 'https://cdn.easyparcel.com/order.pdf' },
    { orderStatus: 'PLACED', isDeleted: true, awbUrl: 'https://cdn.easyparcel.com/order.pdf' },
  ]) {
    const { deps } = fixture({
      findTask: async () => ({ _id: 'task-1', title: 'Order task', orderId: 'a'.repeat(24), files: [] }),
      findOrder: async () => order,
    });
    const result = await taskAwbManifest(token, deps);
    assert.equal(result.labels.length, order.orderStatus === 'PLACED' && !order.isDeleted ? 1 : 0);
  }
});

test('duplicate AWB paths print once and an unavailable AWB returns an empty list', async () => {
  const file = { path: stored('one.pdf'), tag: 'awb', originalName: 'One.pdf' };
  const { deps, calls } = fixture({
    findTask: async () => ({ _id: 'task-1', title: 'Task', files: [{ url: file.path, tag: 'awb' }] }),
    findFiles: async () => [file, file],
  });
  assert.equal((await taskAwbManifest(token, deps)).labels.length, 1);
  assert.equal(calls.signed.length, 1);
  const empty = await taskAwbManifest(token, fixture().deps);
  assert.deepEqual(empty, { task: { title: 'Production task' }, labels: [] });
});
