import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "..");
const databaseContainer = "supabase_db_lensa-diri";
const replayGatePath = resolve(projectRoot, "scripts/test-seed-replay.mjs");
const driftMarker = ".seed_replay_drift_probe";
const canonicalDescriptionKey = "module.trait_profile.description";

function fail(message) {
  console.error(`Seed replay drift gate failed: ${message}`);
  process.exit(1);
}

function runDocker(args, input) {
  const result = spawnSync("docker", args, {
    cwd: projectRoot,
    encoding: "utf8",
    input,
    stdio: input === undefined ? "pipe" : ["pipe", "pipe", "pipe"],
  });

  if (result.error) {
    fail(`cannot execute docker: ${result.error.message}`);
  }

  if (result.status !== 0) {
    fail(result.stderr.trim() || `docker ${args.join(" ")} exited ${result.status}`);
  }

  return result.stdout.trim();
}

function query(sql) {
  return runDocker(
    [
      "exec",
      "-i",
      databaseContainer,
      "psql",
      "-U",
      "postgres",
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-q",
      "-t",
      "-A",
    ],
    sql,
  );
}

function assertLocalSupabase() {
  const labels = JSON.parse(
    runDocker(["inspect", "--format", "{{json .Config.Labels}}", databaseContainer]),
  );
  const portBinding = runDocker(["port", databaseContainer, "5432/tcp"]);
  const databaseName = query("select current_database();");

  if (labels["com.supabase.cli.project"] !== "lensa-diri") {
    fail("refusing non-LensaDiri Supabase container");
  }

  if (!portBinding.split("\n").some((binding) => binding.endsWith(":54322"))) {
    fail("refusing database without local Supabase host port 54322");
  }

  if (databaseName !== "postgres") {
    fail("refusing database other than local postgres");
  }
}

function runReplayGate() {
  return spawnSync(process.execPath, [replayGatePath], {
    cwd: projectRoot,
    encoding: "utf8",
  });
}

function restoreCanonicalDescriptionKey() {
  const restored = query(`
    update public.modules
    set description_key = '${canonicalDescriptionKey}'
    where key = 'trait_profile'
      and description_key = '${canonicalDescriptionKey}${driftMarker}'
    returning key;
  `);

  if (restored !== "trait_profile") {
    fail("could not restore local drift probe");
  }
}

assertLocalSupabase();

const baseline = runReplayGate();
if (baseline.status !== 0) {
  fail("canonical replay gate must pass before drift probe");
}

let probeApplied = false;
let probeFailure = null;
try {
  const mutated = query(`
    update public.modules
    set description_key = '${canonicalDescriptionKey}${driftMarker}'
    where key = 'trait_profile'
      and description_key = '${canonicalDescriptionKey}'
    returning key;
  `);

  if (mutated !== "trait_profile") {
    throw new Error("could not apply local drift probe to canonical module metadata");
  }
  probeApplied = true;

  const drifted = runReplayGate();
  if (drifted.status === 0) {
    throw new Error("canonical replay gate accepted intentional local drift");
  }

  const output = `${drifted.stdout}\n${drifted.stderr}`;
  if (!output.includes("baseline canonical identity does not match reviewed seed identity")) {
    throw new Error("canonical replay gate failed for an unexpected reason");
  }
} catch (error) {
  probeFailure = error instanceof Error ? error.message : "drift probe failed";
} finally {
  if (probeApplied) {
    restoreCanonicalDescriptionKey();
  }
}

if (probeFailure !== null) {
  fail(probeFailure);
}

const restored = runReplayGate();
if (restored.status !== 0) {
  fail("canonical replay gate did not pass after local drift restoration");
}

console.log("Seed replay drift gate PASS canonical drift was rejected and restored");
