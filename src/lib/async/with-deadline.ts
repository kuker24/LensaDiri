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
 * Notes:
 * - The underlying operation is NOT cancelled (zombie prevention
 *   requires DB-side statement_timeout, handled separately).
 * - The caller's response path is unblocked immediately.
 * - Suitable for wrapping a single operation or a composed async
 *   scope (e.g. an async IIFE that runs several sequential/parallel
 *   queries).
 */
export function withDeadline<T>(operation: Promise<T>, deadlineMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
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
