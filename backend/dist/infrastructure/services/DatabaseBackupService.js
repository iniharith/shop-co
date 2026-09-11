"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startDatabaseBackup = exports.createMongoDumpArgs = exports.createDatabaseBackupFilename = exports.DatabaseBackupUnavailableError = exports.DatabaseBackupBusyError = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const os_1 = require("os");
const path_1 = require("path");
const DATABASE_NAME = 'shop-co';
const BACKUP_TIMEOUT_MS = 9 * 60 * 1000;
const TERMINATION_GRACE_MS = 5000;
let backupInProgress = false;
class DatabaseBackupBusyError extends Error {
    constructor() {
        super('A database backup is already in progress');
        this.name = 'DatabaseBackupBusyError';
    }
}
exports.DatabaseBackupBusyError = DatabaseBackupBusyError;
class DatabaseBackupUnavailableError extends Error {
    constructor() {
        super('The database backup tool is unavailable on the server');
        this.name = 'DatabaseBackupUnavailableError';
    }
}
exports.DatabaseBackupUnavailableError = DatabaseBackupUnavailableError;
const createDatabaseBackupFilename = (date = new Date()) => `shop-co-backup-${date.toISOString().replace(/[:.]/g, '-')}.archive.gz`;
exports.createDatabaseBackupFilename = createDatabaseBackupFilename;
const createMongoDumpArgs = (configPath) => [
    '--config', configPath,
    '--db', DATABASE_NAME,
    '--archive',
    '--gzip',
    '--readPreference', 'secondaryPreferred',
    '--numParallelCollections', '1',
];
exports.createMongoDumpArgs = createMongoDumpArgs;
const startDatabaseBackup = (mongoUri) => __awaiter(void 0, void 0, void 0, function* () {
    if (backupInProgress)
        throw new DatabaseBackupBusyError();
    if (!mongoUri)
        throw new Error('MONGO_URI is not configured');
    backupInProgress = true;
    let temporaryDirectory = '';
    try {
        temporaryDirectory = yield fs_1.promises.mkdtemp((0, path_1.join)((0, os_1.tmpdir)(), 'shop-co-backup-'));
        const configPath = (0, path_1.join)(temporaryDirectory, 'mongodump.yml');
        // Keep credentials out of process arguments and remove this file after the dump exits.
        yield fs_1.promises.writeFile(configPath, `uri: ${JSON.stringify(mongoUri)}\n`, { mode: 0o600 });
        const child = (0, child_process_1.spawn)('mongodump', (0, exports.createMongoDumpArgs)(configPath), {
            shell: false,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        yield new Promise((resolve, reject) => {
            child.once('spawn', resolve);
            child.once('error', error => {
                const spawnError = error;
                reject(spawnError.code === 'ENOENT' ? new DatabaseBackupUnavailableError() : error);
            });
        });
        // Drain diagnostics without retaining them; MongoDB errors may contain URI credentials.
        child.stderr.resume();
        let timedOut = false;
        let forceTerminationTimer;
        const terminate = () => {
            if (child.exitCode !== null || child.signalCode !== null)
                return;
            child.kill('SIGTERM');
            forceTerminationTimer !== null && forceTerminationTimer !== void 0 ? forceTerminationTimer : (forceTerminationTimer = setTimeout(() => {
                if (child.exitCode === null && child.signalCode === null)
                    child.kill('SIGKILL');
            }, TERMINATION_GRACE_MS));
        };
        const timeout = setTimeout(() => {
            timedOut = true;
            terminate();
        }, BACKUP_TIMEOUT_MS);
        const completion = new Promise((resolve, reject) => {
            child.once('error', reject);
            child.once('close', code => {
                clearTimeout(timeout);
                if (forceTerminationTimer)
                    clearTimeout(forceTerminationTimer);
                if (code === 0) {
                    resolve();
                    return;
                }
                reject(new Error(timedOut ? 'mongodump timed out' : `mongodump exited with code ${code}`));
            });
        }).finally(() => __awaiter(void 0, void 0, void 0, function* () {
            backupInProgress = false;
            yield fs_1.promises.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => { });
        }));
        return {
            stream: child.stdout,
            completion,
            cancel: terminate,
        };
    }
    catch (error) {
        backupInProgress = false;
        if (temporaryDirectory) {
            yield fs_1.promises.rm(temporaryDirectory, { recursive: true, force: true }).catch(() => { });
        }
        throw error;
    }
});
exports.startDatabaseBackup = startDatabaseBackup;
