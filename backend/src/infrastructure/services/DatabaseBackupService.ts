import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';

const DATABASE_NAME = 'shop-co';
const BACKUP_TIMEOUT_MS = 9 * 60 * 1000;
const TERMINATION_GRACE_MS = 5_000;

let backupInProgress = false;

export class DatabaseBackupBusyError extends Error {
  constructor() {
    super('A database backup is already in progress');
    this.name = 'DatabaseBackupBusyError';
  }
}

export class DatabaseBackupUnavailableError extends Error {
  constructor() {
    super('The database backup tool is unavailable on the server');
    this.name = 'DatabaseBackupUnavailableError';
  }
}

export type RunningDatabaseBackup = {
  stream: Readable;
  completion: Promise<void>;
  cancel: () => void;
};

export const createDatabaseBackupFilename = (date = new Date()) =>
  `shop-co-backup-${date.toISOString().replace(/[:.]/g, '-')}.archive.gz`;

export const createMongoDumpArgs = (configPath: string) => [
  '--config', configPath,
  '--db', DATABASE_NAME,
  '--archive',
  '--gzip',
  '--readPreference', 'secondaryPreferred',
  '--numParallelCollections', '1',
];

export const startDatabaseBackup = async (mongoUri: string): Promise<RunningDatabaseBackup> => {
  if (backupInProgress) throw new DatabaseBackupBusyError();
  if (!mongoUri) throw new Error('MONGO_URI is not configured');

  backupInProgress = true;
  let temporaryDirectory = '';

  try {
    temporaryDirectory = await fs.mkdtemp(join(tmpdir(), 'shop-co-backup-'));
    const configPath = join(temporaryDirectory, 'mongodump.yml');
    // Keep credentials out of process arguments and remove this file after the dump exits.
    await fs.writeFile(configPath, `uri: ${JSON.stringify(mongoUri)}\n`, { mode: 0o600 });
    const child = spawn('mongodump', createMongoDumpArgs(configPath), {
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    await new Promise<void>((resolve, reject) => {
      child.once('spawn', resolve);
      child.once('error', error => {
        const spawnError = error as NodeJS.ErrnoException;
        reject(spawnError.code === 'ENOENT' ? new DatabaseBackupUnavailableError() : error);
      });
    });

    // Drain diagnostics without retaining them; MongoDB errors may contain URI credentials.
    child.stderr.resume();

    let timedOut = false;
    let forceTerminationTimer: NodeJS.Timeout | undefined;
    const terminate = () => {
      if (child.exitCode !== null || child.signalCode !== null) return;
      child.kill('SIGTERM');
      forceTerminationTimer ??= setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
      }, TERMINATION_GRACE_MS);
    };
    const timeout = setTimeout(() => {
      timedOut = true;
      terminate();
    }, BACKUP_TIMEOUT_MS);

    const completion = new Promise<void>((resolve, reject) => {
      child.once('error', reject);
      child.once('close', code => {
        clearTimeout(timeout);
        if (forceTerminationTimer) clearTimeout(forceTerminationTimer);
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(timedOut ? 'mongodump timed out' : `mongodump exited with code ${code}`));
      });
    }).finally(async () => {
      backupInProgress = false;
      await fs.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {});
    });

    return {
      stream: child.stdout,
      completion,
      cancel: terminate,
    };
  } catch (error) {
    backupInProgress = false;
    if (temporaryDirectory) {
      await fs.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {});
    }
    throw error;
  }
};
