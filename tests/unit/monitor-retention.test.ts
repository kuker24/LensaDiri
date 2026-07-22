import { spawnSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

const script = path.join(process.cwd(), "scripts/monitor-retention.mjs");

function run(args: string[], env: Record<string, string> = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

describe("retention monitor CLI", () => {
  it("prints concise help", () => {
    const result = run(["--help"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("usage:");
  });

  it("rejects unknown arguments", () => {
    const result = run(["--nope"]);
    expect(result.status).toBe(2);
    expect(result.stdout).toContain('error: unknown argument "--nope"');
  });

  it("requires CRON_SECRET before making any request", () => {
    const result = run(["--url", "http://127.0.0.1:9"], { CRON_SECRET: "" });
    expect(result.status).toBe(2);
    expect(result.stdout).toContain("CRON_SECRET is required");
  });

  it("fails intentionally without a network request during an alert drill", () => {
    const result = run(["--drill", "--url", "http://127.0.0.1:9"], { CRON_SECRET: "x".repeat(16) });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain("result: fail");
    expect(result.stdout).toContain("error_code: alert_drill");
  });
});
