import { describe, expect, test } from "vitest";

import { getRouteFamily } from "@/lib/route-family";

describe("getRouteFamily", () => {
  test.each([
    ["/", "public"],
    ["/modules/trait_profile", "public"],
    // The sign-in pages were removed, so these no longer resolve to their own
    // chrome family. They fall through to `public` and render as 404.
    ["/login", "public"],
    ["/forgot-password", "public"],
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
