import { describe, expect, test } from "vitest";

import { getRouteFamily } from "@/lib/route-family";

describe("getRouteFamily", () => {
  test.each([
    ["/", "public"],
    ["/modules/trait_profile", "public"],
    ["/login", "auth"],
    ["/forgot-password", "auth"],
    ["/start/modules", "assessment"],
    ["/test/token", "assessment"],
    ["/result/token/share", "assessment"],
    ["/shared/token", "assessment"],
    ["/dashboard/privacy", "account"],
    ["/admin/questions", "operator"],
  ] as const)("maps %s to %s", (pathname, family) => {
    expect(getRouteFamily(pathname)).toBe(family);
  });
});
