-- MVP result feedback. Trusted server remains sole access boundary.

alter table public.rate_limits
  drop constraint rate_limits_route_key;

alter table public.rate_limits
  add constraint rate_limits_route_key check (
    route_key in (
      'auth_register', 'auth_login', 'auth_session', 'auth_logout', 'account_delete',
      'assessment_start', 'assessment_answer', 'assessment_complete',
      'result_share', 'result_export', 'result_delete', 'result_feedback'
    )
  );

create table public.feedback (
  id uuid primary key default extensions.gen_random_uuid(),
  result_id uuid references public.personality_results(id) on delete cascade,
  rating smallint not null,
  message text,
  source text not null default 'result_page',
  created_at timestamptz not null default now(),
  constraint feedback_rating_range check (rating between 1 and 5),
  constraint feedback_message_length check (message is null or length(message) <= 1000),
  constraint feedback_source check (source = 'result_page')
);

create index feedback_result_created_idx on public.feedback (result_id, created_at desc)
  where result_id is not null;

alter table public.feedback enable row level security;
alter table public.feedback force row level security;
revoke all on table public.feedback from public, anon, authenticated;
