# Full description history and automatic database backups

Task modal > Description history stores complete HTML and readable text for each new description edit, including actor and Malaysia-local timestamp. Changes and revisions commit in the same MongoDB transaction. History is separate from Task/Trash documents and survives permanent task deletion. TXT and JSON exports include all saved versions. Legacy 80-character activities are labelled partial; missing historical text cannot be reconstructed.

Existing task descriptions receive an idempotent baseline snapshot before the first automatic backup. Baselines are current snapshots, not recovered old versions.

## Configuration and operation

Backend Railway variables:
- AUTO_DATABASE_BACKUPS_ENABLED=true
- DATABASE_BACKUP_ENCRYPTION_KEY: base64 encoding of a randomly generated 32-byte key. Keep a separate offline recovery copy. Do not rotate or lose this key while archives still depend on it.
- Existing MONGO_URI, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY and AWS region/bucket configuration.
- DATABASE_BACKUP_BUCKET optionally selects a separate backup bucket.

Tools > Automatic database backups lists downloadable archives and supports Back up now. Only admin, sysadmin and boss can list or download database backups. Daily backups run at 03:00 Asia/Kuala_Lumpur, catch up after restart, and retry failures. A cross-instance expiring lease prevents overlapping jobs. Interrupted jobs become failed when their lease expires. No automatic deletion is enabled; monitor storage costs and set an intentional retention policy later.

Archives are gzip-compressed MongoDB archives of the shop-co database. This includes description revisions and artwork metadata/references, but not artwork binary objects. The existing mongodump command limits concurrency and has a nine-minute timeout. A live database dump is not a point-in-time snapshot across all collections; Atlas continuous backup is recommended for recovery between daily runs and stronger consistency.

Storage uses AES-256-GCM client-side encryption plus S3 server-side encryption. S3 receives ciphertext only, even if an artwork bucket has public-read policies. Downloads require staff authorisation and decrypt to normal .archive.gz files. Each backup has a SHA-256 checksum of the downloadable archive. A sidecar .json object next to each encrypted archive preserves its IV, authentication tag, checksum and filename outside MongoDB so a lost database does not destroy recovery metadata. The secret key is never stored in MongoDB or S3.

## Recovery

Prefer a downloaded .archive.gz plus verified SHA-256. Use mongorestore --archive=<file> --gzip against a separate empty test database/server first. Never point a test restore at production. Preserve the original archive. Validate task, revision and file-metadata counts and sample records before planning a production restore.

If only encrypted S3 objects survive, use the matching .json sidecar and separately secured recovery key to decrypt with AES-256-GCM (base64 IV/authTag). Verify authentication and the archive SHA-256 before attempting a restore. Losing the encryption key makes those encrypted archives unrecoverable. Downloaded decrypted backups must be stored in a private location.

Recommended operational checks: download a copy to a second device/location, test restoration monthly, enable independent storage/bucket versioning and Atlas continuous backups, and add separate artwork-object backup coverage.
