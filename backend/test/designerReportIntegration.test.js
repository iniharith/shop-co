const test = require('node:test');
const assert = require('node:assert/strict');
const { MongoMemoryServer } = require('mongodb-memory-server-core');
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
process.env.JWT_ACCESS_SECRET = 'designer-report-isolated-test';
process.env.JWT_REFRESH_SECRET = 'designer-report-refresh-isolated-test';
process.env.JWT_TOKEN = 'designer-report-token-isolated-test';
const router = require('../dist/presentation/routes/designerReports.route').default;

test('designer HTTP routes deduplicate upload tasks by Malaysia day and enforce staff access', async () => {
  const mongo = await MongoMemoryServer.create();
  let server;
  try {
    await mongoose.connect(mongo.getUri(), { dbName: 'designer-isolated', autoIndex: false, autoCreate: false });
    const db = mongoose.connection.db;
    const owner = new mongoose.Types.ObjectId();
    const admin = new mongoose.Types.ObjectId();
    const client = new mongoose.Types.ObjectId();
    const task = new mongoose.Types.ObjectId();
    await db.collection('users').insertMany([
      { _id: owner, name: 'Designer', role: 'designer' },
      { _id: admin, name: 'Manager', role: 'admin' },
      { _id: client, name: 'Customer', role: 'client' },
    ]);
    await db.collection('tasks').insertOne({ _id: task, title: 'KC Artwork Customer', category: 'FRAME' });
    await db.collection('fileuploads').insertOne({ taskId: String(task), tag: 'draft', originalName: 'DRAFT CUSTOMER.jpg' });
    const record = { actorId: String(owner), action: 'file_add', route: `/api/tasks/${task}/files` };
    await db.collection('auditlogs').insertMany([
      { ...record, createdAt: new Date('2026-11-08T15:59:59Z') },
      { ...record, createdAt: new Date('2026-11-08T16:00:00Z') },
      { ...record, createdAt: new Date('2026-11-09T01:00:00Z') },
      { ...record, createdAt: new Date('2026-11-09T16:00:00Z') },
      { ...record, createdAt: new Date('2026-11-10T16:00:00Z') },
      { ...record, actorId: String(admin), createdAt: new Date('2026-11-09T01:00:00Z') },
      { ...record, route: '/api/files/presigned-url', createdAt: new Date('2026-11-09T01:00:00Z') },
    ]);
    const app = express();
    app.use('/designer', router);
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    const base = `http://127.0.0.1:${server.address().port}/designer`;
    const request = (path, id) => fetch(base + path, { headers: id ? { Authorization: `Bearer ${jwt.sign({ userId: String(id) }, process.env.JWT_ACCESS_SECRET)}` } : {} });
    assert.equal((await request('?from=2026-11-09&to=2026-11-10')).status, 401);
    assert.equal((await request('?from=2026-11-09&to=2026-11-10', client)).status, 401);
    assert.equal((await request(`?userId=${admin}&from=2026-11-09&to=2026-11-10`, owner)).status, 403);
    assert.equal((await request('?from=2026-02-30&to=2026-11-10', owner)).status, 400);
    const response = await request(`?userId=${owner}&from=2026-11-09&to=2026-11-10`, admin);
    assert.equal(response.status, 200);
    const { report } = await response.json();
    assert.equal(report.uniqueTasks, 1);
    assert.equal(report.taskEntries, 2);
    assert.deepEqual(report.days.map(day => [day.date, day.tasks.length]), [['2026-11-09', 1], ['2026-11-10', 1]]);
    assert.equal(report.days[0].tasks[0].name, 'CUSTOMER');
    const pdf = await request('/pdf?from=2026-11-09&to=2026-11-10', owner);
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers.get('content-type'), 'application/pdf');
    assert.ok(pdf.headers.get('content-disposition').includes('designer-report-2026-11-09-2026-11-10.pdf'));
    assert.ok(Buffer.from(await pdf.arrayBuffer()).subarray(0, 5).equals(Buffer.from('%PDF-')));
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    await mongo.stop();
  }
});
