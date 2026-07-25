import "server-only";

import { getDatabase } from "@/lib/db/client";
import { independentScoringVersions } from "@/lib/scoring/modules/registry";
import { runDatabaseOperation } from "@/server/database";

export const ADMIN_LIST_LIMIT = 50;

export type AdminModuleRow = {
  key: string;
  publicName: string;
  status: string;
  releaseDisposition: string;
  isSelectable: boolean;
  evidenceTier: string;
  latestVersion: string | null;
};

export type AdminModuleVersionRow = {
  key: string;
  publicName: string;
  version: string;
  status: string;
  scoringVersion: string;
  itemBankVersion: string;
  questionCount: number;
};

export type AdminQuestionCountRow = {
  key: string;
  publicName: string;
  version: string;
  status: string;
  questionCount: number;
};

export type AdminComboPresetRow = {
  key: string;
  publicName: string;
  status: string;
  recommendedMode: string;
  isFullSpectrum: boolean;
  moduleKeys: readonly string[];
};

export type AdminScoringRegistryRow = {
  moduleKey: string;
  scoringVersion: string;
};

export type AdminBlueprintInventoryRow = {
  mode: string;
  blueprintCount: number;
};

export type AdminFeatureFlagRow = {
  key: string;
  enabled: boolean;
};

export type AdminFeedbackRow = {
  createdAt: string;
  messagePreview: string | null;
  rating: number;
  source: string;
};

export type AdminAuditLogRow = {
  action: string;
  actorAccountId: string | null;
  createdAt: string;
  entityType: string;
  metadata: Readonly<Record<string, string>>;
};

const AUDIT_METADATA_ALLOWLIST = new Set(["outcome", "source", "reason"]);
const MESSAGE_PREVIEW_MAX = 120;

function clampLimit(limit: number | undefined): number {
  if (limit === undefined) return ADMIN_LIST_LIMIT;
  return Math.min(Math.max(1, Math.floor(limit)), ADMIN_LIST_LIMIT);
}

function truncateMessage(message: string | null): string | null {
  if (!message) return null;
  const trimmed = message.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  return trimmed.length > MESSAGE_PREVIEW_MAX
    ? `${trimmed.slice(0, MESSAGE_PREVIEW_MAX)}…`
    : trimmed;
}

/** Allowlist-only audit metadata. Drops unknown keys and non-string values. */
export function toAdminAuditMetadata(raw: unknown): Readonly<Record<string, string>> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (
      AUDIT_METADATA_ALLOWLIST.has(key) &&
      typeof value === "string" &&
      value.length > 0 &&
      value.length <= 200
    ) {
      out[key] = value;
    }
  }
  return out;
}

export function listAdminScoringRegistry(): readonly AdminScoringRegistryRow[] {
  return Object.entries(independentScoringVersions)
    .map(([moduleKey, scoringVersion]) => ({ moduleKey, scoringVersion }))
    .sort((a, b) => a.moduleKey.localeCompare(b.moduleKey));
}

export async function listAdminModules(): Promise<readonly AdminModuleRow[]> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<
      {
        evidence_tier: string;
        is_selectable: boolean;
        key: string;
        latest_version: string | null;
        public_name: string;
        release_disposition: string;
        status: string;
      }[]
    >`
      select
        modules.key,
        modules.public_name,
        modules.status::text as status,
        modules.release_disposition::text as release_disposition,
        modules.is_selectable,
        modules.evidence_tier::text as evidence_tier,
        module_versions.version as latest_version
      from public.modules
      left join lateral (
        select version
        from public.module_versions
        where module_versions.module_id = modules.id
        order by module_versions.published_at desc nulls last, module_versions.created_at desc
        limit 1
      ) as module_versions on true
      order by modules.default_order, modules.key
    `;
    return rows.map((row) => ({
      evidenceTier: row.evidence_tier,
      isSelectable: row.is_selectable,
      key: row.key,
      latestVersion: row.latest_version,
      publicName: row.public_name,
      releaseDisposition: row.release_disposition,
      status: row.status,
    }));
  });
}

export async function listAdminModuleVersions(): Promise<readonly AdminModuleVersionRow[]> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<
      {
        item_bank_version: string;
        key: string;
        public_name: string;
        question_count: number;
        scoring_version: string;
        status: string;
        version: string;
      }[]
    >`
      select
        modules.key,
        modules.public_name,
        module_versions.version,
        module_versions.status::text as status,
        module_versions.scoring_version,
        module_versions.item_bank_version,
        (
          select count(*)::int
          from public.questions
          where questions.module_version_id = module_versions.id
        ) as question_count
      from public.module_versions
      inner join public.modules on modules.id = module_versions.module_id
      order by modules.default_order, modules.key, module_versions.created_at desc
    `;
    return rows.map((row) => ({
      itemBankVersion: row.item_bank_version,
      key: row.key,
      publicName: row.public_name,
      questionCount: row.question_count,
      scoringVersion: row.scoring_version,
      status: row.status,
      version: row.version,
    }));
  });
}

export async function listAdminQuestionCounts(): Promise<readonly AdminQuestionCountRow[]> {
  const versions = await listAdminModuleVersions();
  return versions.map((row) => ({
    key: row.key,
    publicName: row.publicName,
    questionCount: row.questionCount,
    status: row.status,
    version: row.version,
  }));
}

export async function listAdminComboPresets(): Promise<readonly AdminComboPresetRow[]> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<
      {
        is_full_spectrum: boolean;
        key: string;
        module_keys: string[];
        public_name: string;
        recommended_mode: string;
        status: string;
      }[]
    >`
      select
        combo_presets.key,
        combo_presets.public_name,
        combo_presets.status::text as status,
        combo_presets.recommended_mode::text as recommended_mode,
        combo_presets.is_full_spectrum,
        coalesce(
          array_agg(modules.key order by combo_preset_modules.display_order)
            filter (where modules.key is not null),
          array[]::text[]
        ) as module_keys
      from public.combo_presets
      left join public.combo_preset_modules
        on combo_preset_modules.combo_preset_id = combo_presets.id
      left join public.modules on modules.id = combo_preset_modules.module_id
      group by combo_presets.id
      order by combo_presets.default_order, combo_presets.key
    `;
    return rows.map((row) => ({
      isFullSpectrum: row.is_full_spectrum,
      key: row.key,
      moduleKeys: row.module_keys,
      publicName: row.public_name,
      recommendedMode: row.recommended_mode,
      status: row.status,
    }));
  });
}

export async function listAdminBlueprintInventory(): Promise<
  readonly AdminBlueprintInventoryRow[]
> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<{ blueprint_count: number; mode: string }[]>`
      select mode::text as mode, count(*)::int as blueprint_count
      from public.assessment_blueprints
      group by mode
      order by mode
    `;
    return rows.map((row) => ({
      blueprintCount: row.blueprint_count,
      mode: row.mode,
    }));
  });
}

export async function listAdminFeatureFlags(): Promise<readonly AdminFeatureFlagRow[]> {
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<{ enabled: boolean; key: string }[]>`
      select key, enabled
      from public.feature_flags
      order by key
    `;
    return rows.map((row) => ({ enabled: row.enabled, key: row.key }));
  });
}

export async function listAdminFeedback(
  options: Readonly<{ limit?: number }> = {},
): Promise<readonly AdminFeedbackRow[]> {
  const limit = clampLimit(options.limit);
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<
      {
        created_at: Date;
        message: string | null;
        rating: number;
        source: string;
      }[]
    >`
      select rating, message, source, created_at
      from public.feedback
      order by created_at desc
      limit ${limit}
    `;
    return rows.map((row) => ({
      createdAt: row.created_at.toISOString(),
      messagePreview: truncateMessage(row.message),
      rating: row.rating,
      source: row.source,
    }));
  });
}

export async function listAdminAuditLogs(
  options: Readonly<{ limit?: number }> = {},
): Promise<readonly AdminAuditLogRow[]> {
  const limit = clampLimit(options.limit);
  return runDatabaseOperation(async () => {
    const sql = getDatabase();
    const rows = await sql<
      {
        action: string;
        actor_account_id: string | null;
        created_at: Date;
        entity_type: string;
        metadata_json: unknown;
      }[]
    >`
      select action, entity_type, actor_account_id, metadata_json, created_at
      from public.audit_logs
      order by created_at desc
      limit ${limit}
    `;
    return rows.map((row) => ({
      action: row.action,
      actorAccountId: row.actor_account_id,
      createdAt: row.created_at.toISOString(),
      entityType: row.entity_type,
      metadata: toAdminAuditMetadata(row.metadata_json),
    }));
  });
}

export function formatAdminListItem(
  label: string,
  value: string,
): { label: string; value: string } {
  return { label, value };
}
