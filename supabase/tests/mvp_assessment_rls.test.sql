begin;

select plan(48);

select ok(to_regclass('public.modules') is not null, 'modules exists');
select ok(to_regclass('public.module_versions') is not null, 'module_versions exists');
select ok(to_regclass('public.question_dimensions') is not null, 'question_dimensions exists');
select ok(to_regclass('public.questions') is not null, 'questions exists');
select ok(to_regclass('public.test_sessions') is not null, 'test_sessions exists');
select ok(to_regclass('public.user_answers') is not null, 'user_answers exists');
select ok(to_regclass('public.personality_results') is not null, 'personality_results exists');
select ok(to_regclass('public.dimension_scores') is not null, 'dimension_scores exists');
select ok(to_regclass('public.result_share_tokens') is not null, 'result_share_tokens exists');
select ok(to_regclass('public.feedback') is not null, 'feedback exists');

select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.modules'::regclass), 'modules forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.module_versions'::regclass), 'module_versions forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.question_dimensions'::regclass), 'dimensions forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.questions'::regclass), 'questions forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.test_sessions'::regclass), 'sessions forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.user_answers'::regclass), 'answers forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.personality_results'::regclass), 'results forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.dimension_scores'::regclass), 'scores forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.result_share_tokens'::regclass), 'shares forced RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.feedback'::regclass), 'feedback forced RLS');

select ok(not exists (select 1 from pg_policies where schemaname = 'public' and tablename in ('modules','module_versions','question_dimensions','questions','test_sessions','user_answers','personality_results','dimension_scores','result_share_tokens','feedback')), 'assessment tables have no browser policies');

select ok(not has_table_privilege('anon', 'public.modules', 'SELECT'), 'anon cannot select modules');
select ok(not has_table_privilege('anon', 'public.questions', 'SELECT'), 'anon cannot select questions');
select ok(not has_table_privilege('anon', 'public.test_sessions', 'SELECT'), 'anon cannot select sessions');
select ok(not has_table_privilege('anon', 'public.user_answers', 'SELECT'), 'anon cannot select answers');
select ok(not has_table_privilege('anon', 'public.personality_results', 'SELECT'), 'anon cannot select results');
select ok(not has_table_privilege('anon', 'public.result_share_tokens', 'SELECT'), 'anon cannot select shares');
select ok(not has_table_privilege('anon', 'public.feedback', 'INSERT'), 'anon cannot insert feedback');
select ok(not has_table_privilege('authenticated', 'public.modules', 'SELECT'), 'authenticated cannot select modules');
select ok(not has_table_privilege('authenticated', 'public.questions', 'SELECT'), 'authenticated cannot select questions');
select ok(not has_table_privilege('authenticated', 'public.test_sessions', 'SELECT'), 'authenticated cannot select sessions');
select ok(not has_table_privilege('authenticated', 'public.user_answers', 'SELECT'), 'authenticated cannot select answers');
select ok(not has_table_privilege('authenticated', 'public.personality_results', 'SELECT'), 'authenticated cannot select results');
select ok(not has_table_privilege('authenticated', 'public.result_share_tokens', 'SELECT'), 'authenticated cannot select shares');
select ok(not has_table_privilege('authenticated', 'public.feedback', 'INSERT'), 'authenticated cannot insert feedback');

select ok(exists (select 1 from pg_constraint where conname = 'test_sessions_token_hash_hex'), 'session token hash constrained');
select ok(exists (select 1 from pg_constraint where conname = 'user_answers_session_question_unique'), 'one answer per session question');
select ok(exists (select 1 from pg_constraint where conname = 'user_answers_idempotency_unique'), 'answer idempotency unique');
select ok(exists (select 1 from pg_constraint where conname = 'user_answers_raw_value'), 'Likert values constrained');
select ok(exists (select 1 from pg_constraint where conname = 'personality_results_token_hash_hex'), 'result token hash constrained');
select ok(exists (select 1 from pg_constraint where conname = 'result_share_tokens_hash_hex'), 'share token hash constrained');
select ok(exists (select 1 from pg_constraint where conname = 'feedback_rating_range'), 'feedback rating constrained');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.test_sessions'::regclass and conname = 'test_sessions_account_id_fkey' and confdeltype = 'c'), 'account deletion cascades sessions');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.user_answers'::regclass and conname = 'user_answers_session_id_fkey' and confdeltype = 'c'), 'session deletion cascades answers');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.personality_results'::regclass and conname = 'personality_results_session_id_fkey' and confdeltype = 'c'), 'session deletion cascades results');
select ok(exists (select 1 from pg_constraint where conrelid = 'public.result_share_tokens'::regclass and conname = 'result_share_tokens_result_id_fkey' and confdeltype = 'c'), 'result deletion cascades shares');
select is((select count(*)::integer from public.questions), 60, 'seed has 60 original questions');
select is((select count(*)::integer from public.questions where quick_enabled), 40, 'quick mode has 40 questions');

select * from finish();
rollback;
