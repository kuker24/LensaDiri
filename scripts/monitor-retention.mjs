const DEFAULT_URL = "https://lensadiri.vercel.app";
const DEFAULT_TIMEOUT_MS = 25_000;

function usage() {
  console.log("description: Verify the retention cleanup endpoint via read-only dry run");
  console.log(
    "usage: CRON_SECRET=<secret> node scripts/monitor-retention.mjs [--url <origin>] [--timeout-ms <ms>] [--drill]",
  );
}

function parseArguments(args) {
  const options = { drill: false, timeoutMs: DEFAULT_TIMEOUT_MS, url: DEFAULT_URL };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help") return { help: true, ...options };
    if (argument === "--drill") {
      options.drill = true;
      continue;
    }
    if (argument === "--url" || argument === "--timeout-ms") {
      const value = args[index + 1];
      if (!value) throw new Error(`${argument} requires a value`);
      if (argument === "--url") options.url = value;
      else options.timeoutMs = Number(value);
      index += 1;
      continue;
    }
    throw new Error(`unknown argument ${JSON.stringify(argument)}`);
  }

  const target = new URL(options.url);
  if (target.pathname !== "/" || target.search || target.hash) {
    throw new Error("--url must contain an origin only");
  }
  if (
    !Number.isInteger(options.timeoutMs) ||
    options.timeoutMs < 100 ||
    options.timeoutMs > 60_000
  ) {
    throw new Error("--timeout-ms must be an integer from 100 to 60000");
  }
  options.url = target.origin;
  return options;
}

async function main() {
  let options;
  try {
    options = parseArguments(process.argv.slice(2));
  } catch (error) {
    console.log(`error: ${error instanceof Error ? error.message : "invalid arguments"}`);
    usage();
    process.exitCode = 2;
    return;
  }

  if (options.help) {
    usage();
    return;
  }
  if (options.drill) {
    console.log("result: fail");
    console.log(`target: ${options.url}/api/cron/retention-cleanup`);
    console.log("error_code: alert_drill");
    process.exitCode = 1;
    return;
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.log("result: fail");
    console.log(`target: ${options.url}/api/cron/retention-cleanup`);
    console.log("error: CRON_SECRET is required");
    process.exitCode = 2;
    return;
  }

  try {
    const response = await fetch(`${options.url}/api/cron/retention-cleanup?dryRun=1`, {
      headers: {
        authorization: `Bearer ${cronSecret}`,
        "User-Agent": "LensaDiri-Retention-Monitor/1",
      },
      redirect: "error",
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    const payload = await response.json();
    if (response.status !== 200 || payload?.success !== true || payload?.data?.dryRun !== true) {
      throw new Error(`unexpected dry-run response (HTTP ${response.status})`);
    }

    // Aggregate counts are non-PII; surface them for operator context only.
    const counts = payload.data.counts ?? {};
    console.log("result: pass");
    console.log(`target: ${options.url}/api/cron/retention-cleanup`);
    console.log(`eligible: ${JSON.stringify(counts)}`);
  } catch (error) {
    console.log("result: fail");
    console.log(`target: ${options.url}/api/cron/retention-cleanup`);
    console.log(
      `error: ${error instanceof Error ? error.message : "unknown retention dry-run failure"}`,
    );
    process.exitCode = 1;
  }
}

await main();
