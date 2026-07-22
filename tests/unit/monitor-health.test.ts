import { spawnSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

const script = path.join(process.cwd(), "scripts/monitor-health.mjs");

function run(...args: string[]) {
  return spawnSync(process.execPath, [script, ...args], { encoding: "utf8" });
}

describe("health monitor CLI", () => {
  it("prints concise help", () => {
    const result = run("--help");

    expect(result.status).toBe(0);
    expect(result.stdout).toContain("usage: node scripts/monitor-health.mjs");
  });

  it("rejects unknown arguments", () => {
    const result = run("--unknown");

    expect(result.status).toBe(2);
    expect(result.stdout).toContain('error: unknown argument "--unknown"');
  });

  it("fails intentionally without a network request during an alert drill", () => {
    const result = run("--drill", "--url", "http://127.0.0.1:9");

    expect(result.status).toBe(1);
    expect(result.stdout).toContain("result: fail");
    expect(result.stdout).toContain("error_code: alert_drill");
  });
});
