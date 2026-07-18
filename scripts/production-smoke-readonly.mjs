const PRODUCTION_URL = "https://lensadiri.vercel.app";
const REQUEST_TIMEOUT_MS = 30_000;

const publicRoutes = ["/", "/modules", "/combos", "/start", "/privacy", "/terms", "/disclaimer"];
const args = process.argv.slice(2);

if (args.length === 1 && args[0] === "--help") {
  console.log(
    "description: Verify public LensaDiri production routes without authentication or mutation",
  );
  console.log("usage: npm run smoke:production:readonly");
  console.log("checks: GET /api/health and HEAD public routes");
  process.exit(0);
}

if (args.length > 0) {
  console.log(`error: unknown argument ${JSON.stringify(args[0])}`);
  console.log("help: this command accepts no arguments; use --help for details");
  process.exit(2);
}

const checks = [];

async function request(method, path) {
  let response;

  try {
    response = await fetch(`${PRODUCTION_URL}${path}`, {
      method,
      redirect: "follow",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new Error(`${method} ${path} could not reach production within 30 seconds`);
  }

  if (new URL(response.url).origin !== PRODUCTION_URL) {
    throw new Error(`${method} ${path} redirected outside the production origin`);
  }

  if (response.status !== 200) {
    throw new Error(`${method} ${path} returned HTTP ${response.status}; expected 200`);
  }

  checks.push({ method, path, status: response.status });
  return response;
}

function printChecks() {
  console.log(`checks[${checks.length}]{method,path,status}:`);
  for (const check of checks) {
    console.log(`  ${check.method},${check.path},${check.status}`);
  }
}

async function runSmokeCheck() {
  const healthResponse = await request("GET", "/api/health");
  const healthData = await healthResponse.json();

  if (JSON.stringify(healthData) !== JSON.stringify({ status: "ok" })) {
    throw new Error("GET /api/health returned an unexpected liveness payload");
  }

  for (const route of publicRoutes) {
    await request("HEAD", route);
  }

  console.log("result: pass");
  console.log(`target: ${PRODUCTION_URL}`);
  printChecks();
}

runSmokeCheck().catch((error) => {
  console.log("result: fail");
  console.log(`target: ${PRODUCTION_URL}`);
  printChecks();
  console.log(`error: ${error instanceof Error ? error.message : "unknown smoke-check failure"}`);
  process.exit(1);
});
