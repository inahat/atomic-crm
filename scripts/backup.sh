#!/usr/bin/env bash
set -euo pipefail

# Config (can be overridden via env)
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_COUNT="${RETENTION_COUNT:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BACKUP_NAME="${BACKUP_NAME:-backup-${TIMESTAMP}.dump}"
ENCRYPTED_NAME="${BACKUP_NAME}.enc"

# Required environment variables (provide via GitHub Secrets)
# DATABASE_URL or PGHOST PGPORT PGUSER PGPASSWORD PGDATABASE
# S3_ENDPOINT (e.g., https://<project-ref>.supabase.co)
# S3_BUCKET
# S3_ACCESS_KEY_ID
# S3_SECRET_ACCESS_KEY
# S3_REGION (use 'us-east-1' if unsure)
# BACKUP_PASSPHRASE

mkdir -p "${BACKUP_DIR}"
cd "${BACKUP_DIR}"

echo "Starting DB dump to ${BACKUP_NAME} (custom format)..."
if [[ -n "${DATABASE_URL:-}" ]]; then
  pg_dump -Fc --file="${BACKUP_NAME}" "${DATABASE_URL}"
else
  pg_dump -Fc --file="${BACKUP_NAME}" \
    --host="${PGHOST}" --port="${PGPORT}" --username="${PGUSER}" --dbname="${PGDATABASE}"
fi

echo "Encrypting dump to ${ENCRYPTED_NAME}..."
# Use AES-256-CBC symmetric encryption with passphrase.
export BACKUP_PASSPHRASE="${BACKUP_PASSPHRASE:?BACKUP_PASSPHRASE must be set}"
openssl enc -aes-256-cbc -salt -pbkdf2 -pass env:BACKUP_PASSPHRASE -in "${BACKUP_NAME}" -out "${ENCRYPTED_NAME}"

# Configure AWS CLI for S3-compatible endpoint using environment variables for one-off commands.
S3_ENDPOINT="${S3_ENDPOINT:?S3_ENDPOINT must be set (e.g., https://<project-ref>.supabase.co)}"
S3_BUCKET="${S3_BUCKET:?S3_BUCKET must be set}"
S3_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID:?S3_ACCESS_KEY_ID must be set}"
S3_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY:?S3_SECRET_ACCESS_KEY must be set}"
S3_REGION="${S3_REGION:-us-east-1}"

export AWS_ACCESS_KEY_ID="${S3_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${S3_SECRET_ACCESS_KEY}"
export AWS_DEFAULT_REGION="${S3_REGION}"

echo "Uploading ${ENCRYPTED_NAME} to ${S3_ENDPOINT}/${S3_BUCKET}..."
aws --endpoint-url "${S3_ENDPOINT}" s3 cp "${ENCRYPTED_NAME}" "s3://${S3_BUCKET}/${ENCRYPTED_NAME}" --no-progress

echo "Pruning old backups (keep ${RETENTION_COUNT})..."
objects_json="$(aws --endpoint-url "${S3_ENDPOINT}" s3api list-objects-v2 --bucket "${S3_BUCKET}" --query 'Contents[].[Key,LastModified]' --output json || echo '[]')"

to_delete=$(python3 - <<PY
import json,sys,os
retain = int(os.environ.get('RETENTION_COUNT', '14'))
try:
    objs=json.loads(sys.stdin.read())
except:
    objs=[]
# objs is list of [key, LastModified]
objs_sorted=sorted(objs, key=lambda x: x[1], reverse=True)
keys_to_delete=[o[0] for o in objs_sorted[retain:]] if len(objs_sorted) > retain else []
print("\n".join(keys_to_delete))
PY
<<<"$objects_json"
)

if [[ -n "${to_delete// }" ]]; then
  echo "Deleting ${to_delete//$'\n'/, }"
  delete_payload="$(python3 - <<PY
import sys, json
keys = [k for k in sys.stdin.read().splitlines() if k.strip()]
if not keys:
    print('')
    sys.exit(0)
payload = {"Objects": [{"Key": k} for k in keys]}
print(json.dumps(payload))
PY
<<<"$to_delete"
)"
  if [[ -n "${delete_payload}" ]]; then
    aws --endpoint-url "${S3_ENDPOINT}" s3api delete-objects --bucket "${S3_BUCKET}" --delete "${delete_payload}"
  fi
else
  echo "No old backups to delete."
fi

echo "Cleanup local (optionally) - keeping encrypted file for artifact upload."
rm -f "${BACKUP_NAME}"

echo "Backup completed: ${ENCRYPTED_NAME}"
echo "File located at: ${PWD}/${ENCRYPTED_NAME}"
