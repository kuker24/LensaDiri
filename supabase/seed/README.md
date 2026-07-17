# Supabase seed files

Seed data stays separate from production migrations. Phase 1 has no seed data.

Rules:

- Do not place module items, accounts, credentials, session tokens, or test fixtures in migrations.
- Add development-only SQL seed files here when Phase 2 module registry exists.
- Never commit real user data, raw tokens, password hashes, or production exports.
- Run seed files only against explicitly selected local or disposable development databases.
