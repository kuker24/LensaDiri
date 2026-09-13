import postgres from "postgres";

export default async function globalSetup() {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl) throw new Error("TEST_DATABASE_URL is required for Playwright setup.");

  const sql = postgres(databaseUrl, { max: 1 });
  try {
    // The single combined run is a Complex (deep) session across five journey
    // lenses, so `FEATURE_COMPLEX_MODE` gates whether the mode is selectable at
    // all and `FEATURE_PROVISIONAL_PRECISION` gates the coverage it needs.
    // `FEATURE_AI_NARRATIVE` stays off: browser flows must never depend on it.
    await sql`
      update public.feature_flags
      set enabled = true
      where key in (
        'FEATURE_MODULAR_COMPOSER',
        'FEATURE_COMPLEX_MODE',
        'FEATURE_PROVISIONAL_PRECISION'
      )
    `;
  } finally {
    await sql.end();
  }
}
