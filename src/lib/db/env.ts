import "server-only";

import { parseServerEnvironment, type ServerEnvironment } from "@/lib/db/env-schema";

export function getServerEnvironment(): ServerEnvironment {
  return parseServerEnvironment(process.env, process.env.NODE_ENV);
}
