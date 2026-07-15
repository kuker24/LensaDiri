import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const projectRoot = resolve(import.meta.dirname, "..");
const databaseContainer = "supabase_db_lensa-diri";
const supabaseConfigPath = resolve(projectRoot, "supabase/config.toml");
const seedPaths = [
  ...readFileSync(supabaseConfigPath, "utf8").matchAll(/"\.\/seed\/([^"\n]+\.sql)"/gu),
].map(([, path]) => `supabase/seed/${path}`);

if (seedPaths.length === 0) {
  throw new Error("Supabase config has no configured seed paths");
}

function fail(message) {
  console.error(`Seed replay gate failed: ${message}`);
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

function applySeed(relativePath) {
  const absolutePath = resolve(projectRoot, relativePath);
  if (!existsSync(absolutePath)) {
    fail(`configured seed is missing: ${relativePath}`);
  }

  runDocker(
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
    ],
    readFileSync(absolutePath, "utf8"),
  );
}

const snapshotSql = `
with counts as (
  select jsonb_build_object(
    'modules', (select count(*) from public.modules),
    'module_versions', (select count(*) from public.module_versions),
    'dimensions', (select count(*) from public.question_dimensions),
    'questions', (select count(*) from public.questions),
    'translations', (select count(*) from public.question_translations),
    'mappings', (select count(*) from public.question_dimension_mappings),
    'combo_presets', (select count(*) from public.combo_presets),
    'combo_mappings', (select count(*) from public.combo_preset_modules)
  ) as value
), duplicates as (
  select jsonb_build_object(
    'modules', (select count(*) from (select key from public.modules group by key having count(*) > 1) duplicates),
    'module_versions', (select count(*) from (select module_id, version from public.module_versions group by module_id, version having count(*) > 1) duplicates),
    'dimensions', (select count(*) from (select module_version_id, construct_key, facet_key from public.question_dimensions group by module_version_id, construct_key, facet_key having count(*) > 1) duplicates),
    'questions', (select count(*) from (select module_version_id, item_code from public.questions group by module_version_id, item_code having count(*) > 1) duplicates),
    'translations', (select count(*) from (select question_id, locale from public.question_translations group by question_id, locale having count(*) > 1) duplicates),
    'mappings', (select count(*) from (select question_id, dimension_id from public.question_dimension_mappings group by question_id, dimension_id having count(*) > 1) duplicates),
    'combo_presets', (select count(*) from (select key from public.combo_presets group by key having count(*) > 1) duplicates),
    'combo_mappings', (select count(*) from (select combo_preset_id, module_id from public.combo_preset_modules group by combo_preset_id, module_id having count(*) > 1) duplicates)
  ) as value
), canonical as (
  select jsonb_build_object(
    'modules', coalesce((select jsonb_agg(jsonb_build_object(
      'key', key, 'public_name', public_name, 'internal_name', internal_name,
      'description', description, 'evidence_tier', evidence_tier, 'status', status,
      'category', category, 'is_selectable', is_selectable,
      'is_experimental', is_experimental, 'minimum_age', minimum_age,
      'default_order', default_order, 'description_key', description_key
    ) order by key) from public.modules), '[]'::jsonb),
    'module_versions', coalesce((select jsonb_agg(jsonb_build_object(
      'module_key', modules.key, 'version', module_versions.version,
      'scoring_strategy', module_versions.scoring_strategy,
      'scoring_version', module_versions.scoring_version,
      'item_bank_version', module_versions.item_bank_version,
      'status', module_versions.status, 'config_json', module_versions.config_json,
      'composer_config_json', module_versions.composer_config_json,
      'report_template_version', module_versions.report_template_version
    ) order by modules.key, module_versions.version)
    from public.module_versions inner join public.modules on modules.id = module_versions.module_id), '[]'::jsonb),
    'dimensions', coalesce((select jsonb_agg(jsonb_build_object(
      'module_key', modules.key, 'version', module_versions.version,
      'construct_key', question_dimensions.construct_key,
      'facet_key', question_dimensions.facet_key, 'label', question_dimensions.label,
      'description', question_dimensions.description,
      'minimum_item_coverage', question_dimensions.minimum_item_coverage
    ) order by modules.key, module_versions.version, question_dimensions.construct_key, question_dimensions.facet_key)
    from public.question_dimensions
    inner join public.module_versions on module_versions.id = question_dimensions.module_version_id
    inner join public.modules on modules.id = module_versions.module_id), '[]'::jsonb),
    'questions', coalesce((select jsonb_agg(jsonb_build_object(
      'module_key', modules.key, 'version', module_versions.version,
      'item_code', questions.item_code, 'construct_key', question_dimensions.construct_key,
      'facet_key', question_dimensions.facet_key, 'public_text', questions.public_text,
      'internal_construct_note', questions.internal_construct_note,
      'response_scale', questions.response_scale, 'polarity', questions.polarity,
      'weight', questions.weight, 'quick_enabled', questions.quick_enabled,
      'mode_eligibility', questions.mode_eligibility,
      'information_priority', questions.information_priority,
      'clarifier_enabled', questions.clarifier_enabled,
      'exposure_group', questions.exposure_group,
      'sensitivity_level', questions.sensitivity_level,
      'review_status', questions.review_status, 'display_order', questions.display_order,
      'status', questions.status
    ) order by modules.key, module_versions.version, questions.item_code)
    from public.questions
    inner join public.module_versions on module_versions.id = questions.module_version_id
    inner join public.modules on modules.id = module_versions.module_id
    inner join public.question_dimensions on question_dimensions.id = questions.dimension_id), '[]'::jsonb),
    'translations', coalesce((select jsonb_agg(jsonb_build_object(
      'module_key', modules.key, 'version', module_versions.version,
      'item_code', questions.item_code, 'locale', question_translations.locale,
      'public_text', question_translations.public_text,
      'helper_text', question_translations.helper_text,
      'reading_level', question_translations.reading_level,
      'review_status', question_translations.review_status
    ) order by modules.key, module_versions.version, questions.item_code, question_translations.locale)
    from public.question_translations
    inner join public.questions on questions.id = question_translations.question_id
    inner join public.module_versions on module_versions.id = questions.module_version_id
    inner join public.modules on modules.id = module_versions.module_id), '[]'::jsonb),
    'mappings', coalesce((select jsonb_agg(jsonb_build_object(
      'module_key', modules.key, 'version', module_versions.version,
      'item_code', questions.item_code, 'construct_key', question_dimensions.construct_key,
      'facet_key', question_dimensions.facet_key,
      'scoring_role', question_dimension_mappings.scoring_role,
      'polarity', question_dimension_mappings.polarity,
      'weight', question_dimension_mappings.weight,
      'consistency_pair_key', question_dimension_mappings.consistency_pair_key
    ) order by modules.key, module_versions.version, questions.item_code, question_dimensions.construct_key, question_dimensions.facet_key)
    from public.question_dimension_mappings
    inner join public.questions on questions.id = question_dimension_mappings.question_id
    inner join public.module_versions on module_versions.id = questions.module_version_id
    inner join public.modules on modules.id = module_versions.module_id
    inner join public.question_dimensions on question_dimensions.id = question_dimension_mappings.dimension_id), '[]'::jsonb),
    'combo_presets', coalesce((select jsonb_agg(jsonb_build_object(
      'key', key, 'public_name', public_name, 'description', description,
      'status', status, 'recommended_mode', recommended_mode,
      'is_full_spectrum', is_full_spectrum, 'default_order', default_order,
      'compatibility_json', compatibility_json
    ) order by key) from public.combo_presets), '[]'::jsonb),
    'combo_mappings', coalesce((select jsonb_agg(jsonb_build_object(
      'preset_key', combo_presets.key, 'module_key', modules.key,
      'module_version', module_versions.version,
      'display_order', combo_preset_modules.display_order,
      'required', combo_preset_modules.required,
      'dependency_rule_json', combo_preset_modules.dependency_rule_json
    ) order by combo_presets.key, combo_preset_modules.display_order)
    from public.combo_preset_modules
    inner join public.combo_presets on combo_presets.id = combo_preset_modules.combo_preset_id
    inner join public.modules on modules.id = combo_preset_modules.module_id
    left join public.module_versions on module_versions.id = combo_preset_modules.module_version_id), '[]'::jsonb),
    'feature_flags', coalesce((select jsonb_agg(jsonb_build_object(
      'key', key, 'enabled', enabled, 'description', description,
      'configuration_json', configuration_json
    ) order by key) from public.feature_flags), '[]'::jsonb)
  ) as value
)
select jsonb_build_object(
  'counts', counts.value,
  'duplicates', duplicates.value,
  'canonical', canonical.value
)::text
from counts cross join duplicates cross join canonical;
`;

function snapshot() {
  const raw = query(snapshotSql);
  let value;

  try {
    value = JSON.parse(raw);
  } catch {
    fail("canonical snapshot query returned invalid JSON");
  }

  if (Object.values(value.duplicates).some((count) => count !== 0)) {
    fail(`duplicate canonical keys: ${JSON.stringify(value.duplicates)}`);
  }

  const enabledFlags = value.canonical.feature_flags.filter((flag) => flag.enabled);
  if (enabledFlags.length > 0) {
    fail("seed replay requires all production feature flags to remain false");
  }

  return {
    counts: value.counts,
    hash: createHash("sha256").update(JSON.stringify(value.canonical)).digest("hex"),
  };
}

function verifySnapshot(reference, label) {
  const current = snapshot();
  if (JSON.stringify(current.counts) !== JSON.stringify(reference.counts)) {
    fail(`${label} changed canonical counts`);
  }
  if (current.hash !== reference.hash) {
    fail(`${label} changed canonical content hash`);
  }
  return current;
}

assertLocalSupabase();
const baseline = snapshot();

for (const seedPath of seedPaths) {
  applySeed(seedPath);
}
verifySnapshot(baseline, "first replay");

for (const seedPath of seedPaths) {
  applySeed(seedPath);
}
const verified = verifySnapshot(baseline, "second replay");

console.log(`Seed replay gate PASS counts=${JSON.stringify(verified.counts)}`);
console.log(`Seed replay gate PASS canonical_sha256=${verified.hash}`);
