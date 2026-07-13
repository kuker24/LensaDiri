import { z } from "zod";

const opaqueTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43,128}$/u);
const uuidSchema = z.uuid();

export const startAssessmentSchema = z
  .object({
    consent: z.literal(true),
    mode: z.enum(["quick", "standard"]),
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
