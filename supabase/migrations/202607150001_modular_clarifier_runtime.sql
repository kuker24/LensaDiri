-- Supplemental clarifier runtime for PRD v2 modular assessments.
-- Additive only. Existing sessions and results remain readable.

create table public.result_clarifier_items (
  id uuid primary key default extensions.gen_random_uuid(),
  clarifier_id uuid not null references public.result_clarifiers(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  dimension_id uuid not null references public.question_dimensions(id) on delete restrict,
  display_order smallint not null,
  created_at timestamptz not null default now(),
  constraint result_clarifier_items_question_unique unique (clarifier_id, question_id),
  constraint result_clarifier_items_order_unique unique (clarifier_id, display_order),
  constraint result_clarifier_items_order_positive check (display_order > 0)
);

create index result_clarifier_items_clarifier_idx
  on public.result_clarifier_items (clarifier_id, display_order);

create table public.result_clarifier_answers (
  id uuid primary key default extensions.gen_random_uuid(),
  clarifier_item_id uuid not null unique references public.result_clarifier_items(id) on delete cascade,
  raw_value smallint not null,
  response_time_ms integer,
  answered_at timestamptz not null default now(),
  answer_revision integer not null default 1,
  constraint result_clarifier_answers_raw_value check (raw_value between 1 and 5),
  constraint result_clarifier_answers_response_time check (
    response_time_ms is null or response_time_ms between 0 and 3600000
  ),
  constraint result_clarifier_answers_revision_positive check (answer_revision > 0)
);

alter table public.result_clarifier_items enable row level security;
alter table public.result_clarifier_items force row level security;
alter table public.result_clarifier_answers enable row level security;
alter table public.result_clarifier_answers force row level security;

revoke all privileges on table public.result_clarifier_items
  from public, anon, authenticated;
revoke all privileges on table public.result_clarifier_answers
  from public, anon, authenticated;

comment on table public.result_clarifier_items is
  'Immutable ordered supplemental item selection for one modular clarifier.';
comment on table public.result_clarifier_answers is
  'Server-only supplemental clarifier responses; raw values never exposed in result DTOs.';
