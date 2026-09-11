const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DatabaseBackupUnavailableError,
  createDatabaseBackupFilename,
  createMongoDumpArgs,
} = require('../dist/infrastructure/services/DatabaseBackupService.js');

test('missing backup tool error is safe to show to an administrator', () => {
  const error = new DatabaseBackupUnavailableError();
  assert.equal(error.message, 'The database backup tool is unavailable on the server');
});

test('database backup filename is timestamped and filesystem safe', () => {
  const filename = createDatabaseBackupFilename(new Date('2026-09-10T04:05:06.789Z'));
  assert.equal(filename, 'shop-co-backup-2026-09-10T04-05-06-789Z.archive.gz');
});

test('mongodump creates a compressed shop-co archive with one collection worker', () => {
  assert.deepEqual(createMongoDumpArgs('/tmp/private.yml'), [
    '--config', '/tmp/private.yml',
    '--db', 'shop-co',
    '--archive',
    '--gzip',
    '--readPreference', 'secondaryPreferred',
    '--numParallelCollections', '1',
  ]);
});
