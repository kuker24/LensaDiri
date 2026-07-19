import type { PostgresError } from "postgres";

export type DatabaseErrorKind = "conflict" | "foreign_key" | "unavailable" | "unknown";

export class DatabaseError extends Error {
  readonly kind: DatabaseErrorKind;

  constructor(kind: DatabaseErrorKind) {
    super("Database operation failed.");
    this.name = "DatabaseError";
    this.kind = kind;
  }
}

export function mapDatabaseError(error: unknown): DatabaseError {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? (error as PostgresError).code
      : undefined;

  if (code === "23505") {
    return new DatabaseError("conflict");
  }
  if (code === "23503") {
    return new DatabaseError("foreign_key");
  }
  if (code?.startsWith("08") || code === "57P01" || code === "57014" || code === "55P03") {
    return new DatabaseError("unavailable");
  }

  return new DatabaseError("unknown");
}
