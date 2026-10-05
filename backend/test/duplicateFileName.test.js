const { test } = require('node:test');
const assert = require('node:assert/strict');
const { nextFileName } = require('../dist/shared/utils/duplicateFileName');

test('keeps unique names and preserves extensions, spaces, unicode and dotfiles', () => {
  assert.equal(nextFileName('Artwork.pdf', []), 'Artwork.pdf');
  assert.equal(nextFileName('My artwork.pdf', ['My artwork.pdf']), 'My artwork-2.pdf');
  assert.equal(nextFileName('设计.png', ['设计.png']), '设计-2.png');
  assert.equal(nextFileName('.env', ['.env']), '.env-2');
  assert.equal(nextFileName('README', ['README']), 'README-2');
});
test('uses next number after existing copies and matches case-insensitively', () => {
  assert.equal(nextFileName('art.pdf', ['ART.PDF', 'art-2.pdf', 'art-4.pdf']), 'art-5.pdf');
  assert.equal(nextFileName('art-2.pdf', ['art.pdf', 'art-2.pdf', 'art-3.pdf']), 'art-4.pdf');
  assert.equal(nextFileName('art.pdf', ['art.pdf', 'art-20.png']), 'art-2.pdf');
});

test('warns before reserving; concurrent confirmed uploads get distinct numbers', async () => {
  const { FileUpload } = require('../dist/domain/entities/FileUpload');
  const { Task } = require('../dist/domain/entities/Task');
  const { UploadNameReservation: Reservation } = require('../dist/domain/entities/UploadNameReservation');
  const { reserveUploadName } = require('../dist/shared/utils/reserveUploadName');
  const originals = { find: FileUpload.find, task: Task.findById, init: Reservation.init, deleteMany: Reservation.deleteMany, reservations: Reservation.find, create: Reservation.create };
  const reserved = new Set();
  const query = result => ({ select: () => ({ lean: async () => result }), lean: async () => result });
  FileUpload.find = () => query([{ originalName: 'art.pdf' }]);
  Task.findById = () => query({ files: [{ name: 'art-2.pdf' }] });
  Reservation.init = async () => {};
  Reservation.deleteMany = async () => {};
  Reservation.find = () => query([...reserved].map(name => ({ name })));
  Reservation.create = async record => {
    if (reserved.has(record.name)) throw Object.assign(new Error('duplicate'), { code: 11000 });
    reserved.add(record.name);
  };
  try {
    let warning;
    const response = { json: value => { warning = value; }, status: () => response };
    assert.equal(await reserveUploadName({ body: { filename: 'art.pdf' } }, response, { taskId: 'task' }), null);
    assert.equal(warning.code, 'DUPLICATE_FILE');
    assert.equal(warning.suggestedName, 'art-3.pdf');
    assert.equal(reserved.size, 0);
    const names = await Promise.all(Array.from({ length: 3 }, () => reserveUploadName({ body: { filename: 'art.pdf', duplicateAction: 'rename' } }, response, { taskId: 'task' })));
    assert.deepEqual(names.sort(), ['art-3.pdf', 'art-4.pdf', 'art-5.pdf']);
  } finally {
    FileUpload.find = originals.find; Task.findById = originals.task;
    Reservation.init = originals.init; Reservation.deleteMany = originals.deleteMany;
    Reservation.find = originals.reservations; Reservation.create = originals.create;
  }
});

test('completed uploads and deletions release filename locks for immediate reuse', async () => {
  const { FileUpload } = require('../dist/domain/entities/FileUpload');
  const { UploadNameReservation: Reservation } = require('../dist/domain/entities/UploadNameReservation');
  const original = Reservation.deleteMany;
  const released = [];
  Reservation.deleteMany = async filter => { released.push(filter); };
  const file = { taskId: 'task', orderId: 'order', userId: 'user', originalName: 'Art.PDF' };
  const hooks = FileUpload.schema.s.hooks;
  const post = (name, docs) => new Promise((resolve, reject) => hooks.execPost(name, new FileUpload(file), [docs], {}, error => error ? reject(error) : resolve()));
  const pre = (name, query) => new Promise((resolve, reject) => hooks.execPre(name, query, [], error => error ? reject(error) : resolve()));
  try {
    await post('save', file);
    await post('insertMany', [file]);
    const query = {
      getFilter: () => ({ taskId: 'task' }),
      model: { findOne: () => ({ lean: async () => file }), find: () => ({ lean: async () => [file] }) },
    };
    await pre('findOneAndDelete', query);
    await pre('deleteMany', query);
    assert.equal(released.length, 4);
    for (const filter of released) assert.deepEqual(filter.$or, [
      { scope: JSON.stringify({ taskId: 'task' }), name: 'art.pdf' },
    ]);
    assert.equal(nextFileName('Art.PDF', []), 'Art.PDF');
  } finally { Reservation.deleteMany = original; }
});
