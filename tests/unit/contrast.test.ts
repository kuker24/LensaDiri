import fs from "node:fs";
import path from "node:path";
import { describe, expect, test } from "vitest";

type Rgb = readonly [number, number, number];

function parseHex(hex: string): Rgb {
  const normalized = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/iu.test(normalized)) throw new Error(`Invalid hex color: ${hex}`);
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function luminance([red, green, blue]: Rgb): number {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  if (r === undefined || g === undefined || b === undefined) throw new Error("Invalid RGB color");
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const foregroundLuminance = luminance(parseHex(foreground));
  const backgroundLuminance = luminance(parseHex(background));
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
}

const css = fs.readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");

function token(name: string): string {
  const value = new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, "iu").exec(css)?.[1];
  if (!value) throw new Error(`Missing color token: ${name}`);
  return value;
}

describe("critical design token contrast", () => {
  test.each([
    ["ink on canvas", "ink", "canvas", 4.5],
    ["ink on surface", "ink", "surface", 4.5],
    ["muted ink on canvas", "ink-muted", "canvas", 4.5],
    ["muted ink on surface", "ink-muted", "surface", 4.5],
    // Paper theme: `lens` is a dark action fill, so its label is canvas-on-lens
    // (`bg-lens text-canvas`), not ink-on-lens as in the former dark theme.
    ["canvas label on lens fill", "canvas", "lens", 4.5],
    ["lens as link text on canvas", "lens", "canvas", 4.5],
    ["aperture focus on canvas", "aperture", "canvas", 3],
    ["danger on canvas", "danger", "canvas", 4.5],
    ["danger on its own soft fill", "danger", "danger-soft", 4.5],
    ["success on canvas", "success", "canvas", 4.5],
    ["warning on canvas", "warning", "canvas", 4.5],
    ["steel hairline text on canvas", "steel", "canvas", 3],
    ["ink on raised surface", "ink", "surface-raised", 4.5],
    // Each cluster stage is a light fill, so its label must be the matching
    // dark `-ink`. White on these stages measures 2.2-2.5:1 and is forbidden.
    ["SP label on coral stage", "coral-ink", "coral", 4.5],
    ["SJ label on sage stage", "sage-ink", "sage", 4.5],
    ["NF label on pink stage", "pink-ink", "pink", 4.5],
    ["NT label on sky stage", "sky-ink", "sky", 4.5],
  ])("%s meets its WCAG threshold", (_name, foreground, background, threshold) => {
    expect(contrast(token(foreground), token(background))).toBeGreaterThanOrEqual(threshold);
  });

  test.each([["coral"], ["sage"], ["pink"], ["sky"]])(
    "pure white is not legible body text on the %s stage",
    (stage) => {
      expect(contrast("#ffffff", token(stage))).toBeLessThan(3);
    },
  );
});
