-- Read-only identity audit. Run with psql before and after the identity migration and compare the output.
-- It uses only the old subject columns and the accounts table, so it works at every stage.
-- Run:  psql "$DATABASE_URL" -f scripts/identity-audit.sql
DO $audit$
DECLARE
    tenant_row RECORD;
    appointment_total BIGINT;
    appointment_mapped BIGINT;
    review_total BIGINT;
    review_mapped BIGINT;
BEGIN
    RAISE NOTICE 'accounts: %', (SELECT COUNT(*) FROM public.accounts);
    RAISE NOTICE 'tenants: %, tenants whose owner subject matches an account: %',
        (SELECT COUNT(*) FROM public.tenants),
        (SELECT COUNT(*) FROM public.tenants t
            WHERE EXISTS (SELECT 1 FROM public.accounts a WHERE 'local|' || a.id = t.owner_auth0_id));

    FOR tenant_row IN SELECT id, slug, schema_name, owner_auth0_id FROM public.tenants ORDER BY id LOOP
        IF NOT EXISTS (SELECT 1 FROM public.accounts a WHERE 'local|' || a.id = tenant_row.owner_auth0_id) THEN
            RAISE NOTICE 'UNMAPPED OWNER: tenant % (%) owner subject %', tenant_row.id, tenant_row.slug, tenant_row.owner_auth0_id;
        END IF;

        EXECUTE format('SELECT COUNT(*), COUNT(a.id) FROM %I.appointments p LEFT JOIN public.accounts a ON ''local|'' || a.id = p.client_auth0_sub WHERE p.client_auth0_sub IS NOT NULL', tenant_row.schema_name)
            INTO appointment_total, appointment_mapped;
        EXECUTE format('SELECT COUNT(*), COUNT(a.id) FROM %I.reviews r LEFT JOIN public.accounts a ON ''local|'' || a.id = r.author_auth0_sub WHERE r.author_auth0_sub IS NOT NULL', tenant_row.schema_name)
            INTO review_total, review_mapped;

        RAISE NOTICE 'tenant % (%): appointments with a subject % (mapped %), reviews with a subject % (mapped %)',
            tenant_row.id, tenant_row.slug, appointment_total, appointment_mapped, review_total, review_mapped;
        IF appointment_total <> appointment_mapped OR review_total <> review_mapped THEN
            RAISE NOTICE 'UNMAPPED ROWS in tenant % (%)', tenant_row.id, tenant_row.slug;
        END IF;
    END LOOP;
END
$audit$;
