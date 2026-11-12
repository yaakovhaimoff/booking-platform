-- Points one shop's saved image addresses at the new <environment>/tenants/<id>/ folder.
-- Run after migrate-images-to-environment-prefix.sh --apply, against the database of that environment:
--   psql "$DATABASE_URL" -v base=https://img.example.com -v environment=prod -v tenant_id=16 -f scripts/migrate-image-urls.sql
-- base is the R2_PUBLIC_URL with no trailing slash. Safe to run twice: addresses already moved do not match.
BEGIN;

UPDATE public.tenants
SET logo_url = replace(logo_url, :'base' || '/tenants/' || :tenant_id || '/', :'base' || '/' || :'environment' || '/tenants/' || :tenant_id || '/'),
    cover_url = replace(cover_url, :'base' || '/tenants/' || :tenant_id || '/', :'base' || '/' || :'environment' || '/tenants/' || :tenant_id || '/'),
    gallery_urls = replace(gallery_urls, :'base' || '/tenants/' || :tenant_id || '/', :'base' || '/' || :'environment' || '/tenants/' || :tenant_id || '/')
WHERE id = :tenant_id;

SELECT id, logo_url, cover_url, gallery_urls FROM public.tenants WHERE id = :tenant_id;

COMMIT;
