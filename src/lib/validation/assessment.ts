import { z } from "zod";

import { assessmentModes, assessmentSelectionTypes } from "@/lib/assessment/catalog";

const opaqueTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43,128}$/u);
const uuidSchema = z.uuid();
const moduleKeySchema = z.string().regex(/^[a-z0-9_]{2,40}$/u);
const presetKeySchema = z.string().regex(/^[a-z][a-z0-9_]{1,49}$/u);

const legacyStartAssessmentSchema = z
  .object({
    consent: z.literal(true),
    mode: z.enum(["quick", "standard"]),
  })
  .strict();

const modularStartAssessmentSchema = z
  .object({
    age: z.number().int().min(13).max(99).nullable().default(null),
    consent: z.literal(true),
    experimentalAcknowledged: z.boolean().default(false),
    locale: z.enum(["id", "en"]).default("id"),
    mode: z.enum(assessmentModes),
    moduleKeys: z.array(moduleKeySchema).min(1).max(10),
    presetKey: presetKeySchema.nullable().default(null),
    selectionType: z.enum(assessmentSelectionTypes).exclude(["legacy"]),
  })
  .strict();

export const startAssessmentSchema = z.union([
  legacyStartAssessmentSchema,
  modularStartAssessmentSchema,
]);

export const estimateAssessmentSchema = z
  .object({
    age: z.number().int().min(13).max(99).nullable().default(null),
    experimentalAcknowledged: z.boolean().default(false),
    mode: z.enum(assessmentModes),
    moduleKeys: z.array(moduleKeySchema).min(1).max(10),
    presetKey: presetKeySchema.nullable().default(null),
    selectionType: z.enum(assessmentSelectionTypes).exclude(["legacy"]),
  })
  .strict();

export const answerAssessmentSchema = z
  .object({
    idempotencyKey: uuidSchema,
    questionId: uuidSchema,
    responseTimeMs: z.number().int().min(0).max(3_600_000).nullable().optional(),
    token: opaqueTokenSchema,
    value: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  })
  .strict();

export const tokenRequestSchema = z
  .object({
    token: opaqueTokenSchema,
  })
  .strict();

export const completeAssessmentSchema = tokenRequestSchema;
export const resultMutationSchema = tokenRequestSchema;
export const resultFeedbackSchema = z
  .object({
    message: z.string().trim().max(1000).optional(),
    rating: z.number().int().min(1).max(5),
    token: opaqueTokenSchema,
  })
  .strict();

export { opaqueTokenSchema };
