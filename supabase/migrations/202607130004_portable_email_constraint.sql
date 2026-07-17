-- Use a portable literal-dot character class. The previous backslash escape was
-- interpreted differently between local and hosted PostgreSQL settings.

alter table public.accounts
  drop constraint accounts_email_not_blank;

alter table public.accounts
  add constraint accounts_email_not_blank check (
    email = btrim(email)
    and email_normalized ~ '^[^@[:space:]]+@[^@[:space:]]+[.][^@[:space:]]+$'
  );
