alter table public.accounts
  alter column password_hash drop not null;

alter table public.accounts drop constraint accounts_password_hash_argon2id_phc;
alter table public.accounts
  add constraint accounts_password_hash_argon2id_phc check (
    password_hash is null
    or password_hash ~ '^\$argon2id\$v=19\$m=[0-9]+,t=[0-9]+,p=[0-9]+\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$'
  );

comment on column public.accounts.password_hash is
  'Argon2id PHC for password accounts; null only for provider-created accounts.';
