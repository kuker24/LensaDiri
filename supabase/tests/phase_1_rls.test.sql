begin;

select plan(92);

-- Tables created by Phase 1 migration.
select ok(to_regclass('public.accounts') is not null, 'accounts table exists');
select ok(to_regclass('public.account_sessions') is not null, 'account_sessions table exists');
select ok(to_regclass('public.consents') is not null, 'consents table exists');
select ok(to_regclass('public.rate_limits') is not null, 'rate_limits table exists');
select ok(to_regclass('public.audit_logs') is not null, 'audit_logs table exists');

-- RLS must remain enabled and forced even for table owners.
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.accounts'::regclass), 'accounts has forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.account_sessions'::regclass), 'account_sessions has forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.consents'::regclass), 'consents has forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.rate_limits'::regclass), 'rate_limits has forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.audit_logs'::regclass), 'audit_logs has forced RLS');

-- Server APIs use a trusted database boundary. Browser roles get no policies.
select ok(not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'accounts'), 'accounts has no RLS policy');
select ok(not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'account_sessions'), 'account_sessions has no RLS policy');
select ok(not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'consents'), 'consents has no RLS policy');
select ok(not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'rate_limits'), 'rate_limits has no RLS policy');
select ok(not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'audit_logs'), 'audit_logs has no RLS policy');

-- No direct table operation for anon.
select ok(not has_table_privilege('anon', 'public.accounts', 'SELECT'), 'anon cannot select accounts');
select ok(not has_table_privilege('anon', 'public.accounts', 'INSERT'), 'anon cannot insert accounts');
select ok(not has_table_privilege('anon', 'public.accounts', 'UPDATE'), 'anon cannot update accounts');
select ok(not has_table_privilege('anon', 'public.accounts', 'DELETE'), 'anon cannot delete accounts');
select ok(not has_table_privilege('anon', 'public.account_sessions', 'SELECT'), 'anon cannot select account_sessions');
select ok(not has_table_privilege('anon', 'public.account_sessions', 'INSERT'), 'anon cannot insert account_sessions');
select ok(not has_table_privilege('anon', 'public.account_sessions', 'UPDATE'), 'anon cannot update account_sessions');
select ok(not has_table_privilege('anon', 'public.account_sessions', 'DELETE'), 'anon cannot delete account_sessions');
select ok(not has_table_privilege('anon', 'public.consents', 'SELECT'), 'anon cannot select consents');
select ok(not has_table_privilege('anon', 'public.consents', 'INSERT'), 'anon cannot insert consents');
select ok(not has_table_privilege('anon', 'public.consents', 'UPDATE'), 'anon cannot update consents');
select ok(not has_table_privilege('anon', 'public.consents', 'DELETE'), 'anon cannot delete consents');
select ok(not has_table_privilege('anon', 'public.rate_limits', 'SELECT'), 'anon cannot select rate_limits');
select ok(not has_table_privilege('anon', 'public.rate_limits', 'INSERT'), 'anon cannot insert rate_limits');
select ok(not has_table_privilege('anon', 'public.rate_limits', 'UPDATE'), 'anon cannot update rate_limits');
select ok(not has_table_privilege('anon', 'public.rate_limits', 'DELETE'), 'anon cannot delete rate_limits');
select ok(not has_table_privilege('anon', 'public.audit_logs', 'SELECT'), 'anon cannot select audit_logs');
select ok(not has_table_privilege('anon', 'public.audit_logs', 'INSERT'), 'anon cannot insert audit_logs');
select ok(not has_table_privilege('anon', 'public.audit_logs', 'UPDATE'), 'anon cannot update audit_logs');
select ok(not has_table_privilege('anon', 'public.audit_logs', 'DELETE'), 'anon cannot delete audit_logs');

-- No direct table operation for authenticated.
select ok(not has_table_privilege('authenticated', 'public.accounts', 'SELECT'), 'authenticated cannot select accounts');
select ok(not has_table_privilege('authenticated', 'public.accounts', 'INSERT'), 'authenticated cannot insert accounts');
select ok(not has_table_privilege('authenticated', 'public.accounts', 'UPDATE'), 'authenticated cannot update accounts');
select ok(not has_table_privilege('authenticated', 'public.accounts', 'DELETE'), 'authenticated cannot delete accounts');
select ok(not has_table_privilege('authenticated', 'public.account_sessions', 'SELECT'), 'authenticated cannot select account_sessions');
select ok(not has_table_privilege('authenticated', 'public.account_sessions', 'INSERT'), 'authenticated cannot insert account_sessions');
select ok(not has_table_privilege('authenticated', 'public.account_sessions', 'UPDATE'), 'authenticated cannot update account_sessions');
select ok(not has_table_privilege('authenticated', 'public.account_sessions', 'DELETE'), 'authenticated cannot delete account_sessions');
select ok(not has_table_privilege('authenticated', 'public.consents', 'SELECT'), 'authenticated cannot select consents');
select ok(not has_table_privilege('authenticated', 'public.consents', 'INSERT'), 'authenticated cannot insert consents');
select ok(not has_table_privilege('authenticated', 'public.consents', 'UPDATE'), 'authenticated cannot update consents');
select ok(not has_table_privilege('authenticated', 'public.consents', 'DELETE'), 'authenticated cannot delete consents');
select ok(not has_table_privilege('authenticated', 'public.rate_limits', 'SELECT'), 'authenticated cannot select rate_limits');
select ok(not has_table_privilege('authenticated', 'public.rate_limits', 'INSERT'), 'authenticated cannot insert rate_limits');
select ok(not has_table_privilege('authenticated', 'public.rate_limits', 'UPDATE'), 'authenticated cannot update rate_limits');
select ok(not has_table_privilege('authenticated', 'public.rate_limits', 'DELETE'), 'authenticated cannot delete rate_limits');
select ok(not has_table_privilege('authenticated', 'public.audit_logs', 'SELECT'), 'authenticated cannot select audit_logs');
select ok(not has_table_privilege('authenticated', 'public.audit_logs', 'INSERT'), 'authenticated cannot insert audit_logs');
select ok(not has_table_privilege('authenticated', 'public.audit_logs', 'UPDATE'), 'authenticated cannot update audit_logs');
select ok(not has_table_privilege('authenticated', 'public.audit_logs', 'DELETE'), 'authenticated cannot delete audit_logs');

-- Required column sets must survive future migrations.
select ok((select count(*) = 10 from information_schema.columns where table_schema = 'public' and table_name = 'accounts' and column_name = any (array['id', 'email', 'email_normalized', 'password_hash', 'role', 'status', 'email_verified_at', 'created_at', 'updated_at', 'deleted_at'])), 'accounts has all required columns');
select ok((select count(*) = 9 from information_schema.columns where table_schema = 'public' and table_name = 'account_sessions' and column_name = any (array['id', 'account_id', 'session_token_hash', 'user_agent_hash', 'ip_hash', 'expires_at', 'revoked_at', 'last_seen_at', 'created_at'])), 'account_sessions has all required columns');
select ok((select count(*) = 9 from information_schema.columns where table_schema = 'public' and table_name = 'consents' and column_name = any (array['id', 'account_id', 'session_id', 'consent_type', 'version', 'accepted_at', 'rejected_at', 'revoked_at', 'created_at'])), 'consents has all required columns');
select ok((select count(*) = 6 from information_schema.columns where table_schema = 'public' and table_name = 'rate_limits' and column_name = any (array['id', 'key_hash', 'route_key', 'window_start', 'count', 'created_at'])), 'rate_limits has all required columns');
select ok((select count(*) = 7 from information_schema.columns where table_schema = 'public' and table_name = 'audit_logs' and column_name = any (array['id', 'actor_account_id', 'action', 'entity_type', 'entity_id', 'metadata_json', 'created_at'])), 'audit_logs has all required columns');

-- Named constraints and indexes encode Phase 1 security invariants.
select ok(exists (select 1 from pg_constraint where conname = 'accounts_email_normalized'), 'accounts normalize email');
select ok(exists (select 1 from pg_constraint where conname = 'accounts_password_hash_argon2id_phc'), 'accounts require Argon2id PHC');
select ok(exists (select 1 from pg_constraint where conname = 'accounts_deleted_status_consistent'), 'accounts enforce soft delete state');
select ok(to_regclass('public.accounts_live_email_normalized_key') is not null, 'accounts has live-email unique index');
select ok(exists (select 1 from pg_constraint where conname = 'account_sessions_token_hash_hex'), 'sessions require HMAC hash format');
select ok(exists (select 1 from pg_constraint where conname = 'account_sessions_user_agent_hash_hex'), 'sessions protect user-agent hash format');
select ok(exists (select 1 from pg_constraint where conname = 'account_sessions_ip_hash_hex'), 'sessions protect IP hash format');
select ok(exists (select 1 from pg_constraint where conname = 'account_sessions_expiry_after_creation'), 'sessions require future expiry');
select ok(exists (select 1 from pg_constraint where conname = 'account_sessions_last_seen_after_creation'), 'sessions validate last seen');
select ok(exists (select 1 from pg_constraint where conname = 'account_sessions_revocation_after_creation'), 'sessions validate revocation');
select ok(to_regclass('public.account_sessions_token_hash_key') is not null, 'sessions has unique token-hash index');
select ok(to_regclass('public.account_sessions_account_active_idx') is not null, 'sessions has active account index');
select ok(exists (select 1 from pg_constraint where conname = 'consents_subject_required'), 'consents require account or session subject');
select ok(exists (select 1 from pg_constraint where conname = 'consents_version_not_blank'), 'consents require version');
select ok(exists (select 1 from pg_constraint where conname = 'consents_decision_exactly_once'), 'consents require accepted or rejected decision');
select ok(exists (select 1 from pg_constraint where conname = 'consents_decision_at_or_after_creation'), 'consents validate decision timestamps');
select ok(exists (select 1 from pg_constraint where conname = 'consents_revocation_requires_acceptance'), 'consents allow revocation only after acceptance');
select ok(exists (select 1 from pg_constraint where conname = 'rate_limits_key_hash_hex'), 'rate limits require hashed key');
select ok(exists (select 1 from pg_constraint where conname = 'rate_limits_route_key'), 'rate limits constrain routes');
select ok(exists (select 1 from pg_constraint where conname = 'rate_limits_count_positive'), 'rate limits constrain count');
select ok(exists (select 1 from pg_constraint where conname = 'rate_limits_window_start_utc_minute'), 'rate limits constrain fixed windows');
select ok(to_regclass('public.rate_limits_bucket_key') is not null, 'rate limits has unique bucket index');
select ok(exists (select 1 from pg_constraint where conname = 'audit_logs_action_not_blank'), 'audit logs constrain action');
select ok(exists (select 1 from pg_constraint where conname = 'audit_logs_entity_type_not_blank'), 'audit logs constrain entity type');
select ok(exists (select 1 from pg_constraint where conname = 'audit_logs_metadata_object'), 'audit logs require object metadata');
select ok(exists (select 1 from pg_trigger where tgrelid = 'public.audit_logs'::regclass and tgname = 'audit_logs_append_only' and not tgisinternal), 'audit logs reject updates and deletes');

-- Account erasure function exists only for trusted server use.
select ok(to_regprocedure('public.hard_delete_account_by_session(text)') is not null, 'account hard-delete function exists');
select ok(not has_function_privilege('anon', 'public.hard_delete_account_by_session(text)', 'EXECUTE'), 'anon cannot execute account hard-delete');
select ok(not has_function_privilege('authenticated', 'public.hard_delete_account_by_session(text)', 'EXECUTE'), 'authenticated cannot execute account hard-delete');

-- FK delete behavior remains explicit for account-owned records and audit retention.
select ok(exists (select 1 from pg_constraint where conrelid = 'public.account_sessions'::regclass and conname = 'account_sessions_account_id_fkey' and confdeltype = 'c'), 'sessions cascade on account hard delete');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.consents'::regclass and conname = 'consents_account_id_fkey' and confdeltype = 'n'), 'consents retain record after account hard delete');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.audit_logs'::regclass and conname = 'audit_logs_actor_account_id_fkey' and confdeltype = 'n'), 'audit logs retain record after actor hard delete');

select * from finish();
rollback;
