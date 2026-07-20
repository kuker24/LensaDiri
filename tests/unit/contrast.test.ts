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
    ["aperture-on-dark on lens-strong", "aperture-on-dark", "lens-strong", 4.5],
    ["aperture-on-dark on ink", "aperture-on-dark", "ink", 4.5],
    ["canvas text on lens", "canvas", "lens", 4.5],
    ["canvas focus outline on lens-strong", "canvas", "lens-strong", 3],
    ["canvas focus outline on ink", "canvas", "ink", 3],
  ])("%s meets its WCAG threshold", (_name, foreground, background, threshold) => {
    expect(contrast(token(foreground), token(background))).toBeGreaterThanOrEqual(threshold);
  });
});
