#!/usr/bin/env bash
# Copies one shop's existing images from tenants/<id>/ to <environment>/tenants/<id>/ in the R2 bucket.
# It never deletes anything: check the new folder, run migrate-image-urls.sql, then remove the old folder yourself.
#
# Usage:   scripts/migrate-images-to-environment-prefix.sh <dev|prod> <tenantId> [--apply]
# Needs:   the aws CLI and the R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET variables
#          of the environment being migrated. Without --apply it only lists what would be copied.
set -euo pipefail

environment="${1:?environment (dev or prod) required}"
tenant_id="${2:?tenant id required}"
apply="${3:-}"

[[ "$environment" =~ ^[a-z0-9-]+$ ]] || { echo "environment must be lowercase letters, digits or dashes" >&2; exit 1; }
[[ "$tenant_id" =~ ^[0-9]+$ ]] || { echo "tenant id must be a number" >&2; exit 1; }

export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID required}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY required}"
export AWS_DEFAULT_REGION=auto
endpoint="https://${R2_ACCOUNT_ID:?R2_ACCOUNT_ID required}.r2.cloudflarestorage.com"
bucket="${R2_BUCKET:?R2_BUCKET required}"
source_prefix="s3://${bucket}/tenants/${tenant_id}/"
target_prefix="s3://${bucket}/${environment}/tenants/${tenant_id}/"

echo "Source: ${source_prefix}"
aws s3 ls "$source_prefix" --endpoint-url "$endpoint"

if [[ "$apply" != "--apply" ]]; then
  echo "Dry run. Would copy to ${target_prefix}. Re-run with --apply to copy."
  exit 0
fi

aws s3 cp "$source_prefix" "$target_prefix" --recursive --endpoint-url "$endpoint" \
  --cache-control "public, max-age=31536000, immutable"

source_count=$(aws s3 ls "$source_prefix" --endpoint-url "$endpoint" | wc -l | tr -d ' ')
target_count=$(aws s3 ls "$target_prefix" --endpoint-url "$endpoint" | wc -l | tr -d ' ')
echo "Copied. Source files: ${source_count}, target files: ${target_count}"
[[ "$source_count" == "$target_count" ]] || { echo "Counts differ, do not continue." >&2; exit 1; }
echo "Next: psql -v base=<R2_PUBLIC_URL> -v environment=${environment} -v tenant_id=${tenant_id} -f scripts/migrate-image-urls.sql"
