# Free Plan Deployment Policy

## Scope

This policy keeps LensaDiri deployment workflows within Vercel Hobby and Supabase Free
quotas. The primary production target is `https://lensadiri.vercel.app`.

## Automatic Deployments

- `main` is the only production source branch.
- A push or merge to `main` triggers an automatic Vercel Production deployment.
- Non-`main` branches (feature branches, `agent/*` branches, PR source branches) do not
  create automatic Preview deployments. The `vercel.json` `deploymentEnabled` setting
  enforces this at the platform level.
- GitHub Actions still runs quality gates for all branches and PRs. Those jobs use
  disposable local Supabase and are not Vercel deployments.

## Manual Preview Policy

Create a Preview deployment only when final QA genuinely requires it. Use an explicit
Vercel Dashboard or CLI action rather than enabling automatic Preview deployments.

A manual Preview must have all of the following:

- an isolated non-production database;
- Preview-only `NEXT_PUBLIC_APP_URL`, `DATABASE_URL`, and application secrets;
- no Production Supabase URL, password, or secret;
- a clear owner and a short QA lifetime.

Do not create a Preview when the only available database is the Production Supabase
project. Running `vercel` without `--prod` creates a manual Preview. Do not run
`vercel --prod` as a routine release step. The normal Production path is a reviewed
merge to `main`.

## Database Release Boundary

A Vercel deployment never grants approval for a Production database change. Production
migrations and reviewed content seed publication remain separate, manually approved
procedures. Never run reset, integration, pgTAP, seed replay, or destructive browser
suites against Production.

## Old Deployment Cleanup

Vercel Hobby retention limits apply automatically. Additional manual cleanup:

1. Open Vercel Dashboard > LensaDiri > Deployments.
2. Filter for Preview deployments that are no longer needed.
3. Delete obsolete previews that have no active alias and are not needed for
   investigation or rollback.
4. Open Project Settings > Security > Deployment Retention Policy and set the shortest
   retention for Preview, canceled, and errored deployments.

Keep at least one recent healthy Production deployment for rollback. Vercel retention
exceptions preserve aliased deployments and the latest deployment of an active branch.

## Verification After Merge

After a reviewed merge to `main`:

- confirm the Vercel deployment belongs to the merged `main` commit;
- confirm `https://lensadiri.vercel.app/api/health` returns `{"status":"ok"}`;
- perform non-destructive page smoke checks;
- do not change Production environment variables, feature flags, migrations, or seed
  content during routine deployment verification.

## PR Caveat

This policy activates when `vercel.json` is present on `main`. The first PR that
introduces this file may still trigger a Preview deployment on its own commit, because
Vercel evaluates `deploymentEnabled` against the source branch config at the time of
push. After this PR is merged to `main`, all subsequent non-`main` branches and PRs
will skip automatic Preview.
