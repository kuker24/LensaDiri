import { createDatabaseTimeoutReset } from "@/lib/db/client";

/**
 * Shared deadline and timeout primitives for database operations.
 *
 * Provides a fail-fast boundary around any async operation. When the
 * deadline fires, the caller receives a typed error instead of hanging
 * indefinitely on a slow or lost database connection.
 */

/**
 * Error raised when a database-bound async operation exceeds its
 * configured deadline. Distinguished from generic DatabaseError so
 * that route handlers can return a specific safe response (503 with
 * a user-facing retry message) instead of a generic failure.
 */
export class DatabaseTimeoutError extends Error {
  constructor(message = "Operation timed out.") {
    super(message);
    this.name = "DatabaseTimeoutError";
  }
}

/**
 * Races `operation` against a wall-clock deadline. If the operation
 * does not settle within `deadlineMs` the promise rejects with
 * `DatabaseTimeoutError`.
 *
 * Cancellation notes:
 * - The timed-out pool is terminated so queued work cannot poison the
 *   next request in the same warm serverless instance.
 * - Database-side `statement_timeout`, `lock_timeout`, and
 *   `connect_timeout` remain the authoritative query safeguards.
 * - The postgres.js `.cancel()` method is deliberately not used by this
 *   generic helper. The driver documents that cancellation opens a new
 *   connection and is not guaranteed because of protocol-level races.
 *   Connection and database timeouts remain the deterministic boundary.
 * - The caller's response path is unblocked immediately when the
 *   deadline fires.
 *
 * Late settlement protection:
 * - The operation always has fulfillment and rejection handlers attached,
 *   so a rejection after the deadline cannot become unhandled.
 * - The timer is cleared when the operation settles before the deadline.
 *
 * Suitable for wrapping a single operation or a composed async
 * scope (e.g., an async IIFE that runs several sequential/parallel
 * queries).
 */
export function withDeadline<T>(operation: Promise<T>, deadlineMs: number): Promise<T> {
  const resetDatabase = createDatabaseTimeoutReset();
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      resetDatabase();
      reject(new DatabaseTimeoutError());
    }, deadlineMs);

    operation.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
