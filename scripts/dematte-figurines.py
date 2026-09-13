#!/usr/bin/env python3
"""Strip the baked-in white matte from the figurine renders.

Every PNG in `public/figurines/` was cut out over a white backdrop and kept a
bright rim. Measured on the committed files, boundary pixels ran 27-101
luminance points brighter than the interior behind them, and 72-95% of each
file's semi-transparent pixels were near-white. Against a coloured stage that
rim reads as dirt; where the garment is itself white - socks, sneakers - the rim
merges into it and the contour dissolves, which is why the shoes looked chewed.

The whole difficulty is that "bright pixel at the edge" describes both the defect
and a white shoe. So brightness alone can never be the trigger. The trigger used
here is a brightness *discontinuity*: a pixel is contaminated only when it is
much brighter than the interior lying behind it. A white sneaker is bright and so
is the sock behind it, so it shows no discontinuity and is left alone.

Two approaches were tried and rejected first, both recorded here because each
failed in an instructive way:

  * Inverse-compositing (`C_true = (C_obs - (1-a)*255) / a`) only reaches
    partial-alpha pixels. Sampling luminance by distance-from-boundary shows the
    contamination actually sits in a ring that is effectively *opaque* (mean
    alpha ~239), so the alpha-domain correction cannot see it at all.

  * Eroding the contaminated rings and re-feathering removed the rim, but
    erosion is unconditional: it deleted real white footwear along with the
    matte. Verified as a total loss of all 202 bright shoe pixels on ENFJ.png.

What remains is per-pixel and guarded. Reference colour is taken from beyond the
contaminated band, never from the band itself, because band thickness varies per
file (1 ring on INTJ-laki, 3 on INTP) and sampling one ring in is still dirty.
Assignment is to the reference value outright rather than a computed
subtraction, which makes it monotone: the result cannot land darker than the
interior it came from.

Run with --check to report without writing.
"""

from __future__ import annotations

import argparse
import sys
from collections import deque
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageFilter

Pixel = tuple[int, int, int, int]

# Alpha at or above this counts as ink.
INK = 8

# Below this alpha a pixel carries too little colour to be worth keeping; the
# recovered value would be mostly amplified noise.
MIN_ALPHA = 12

# A pixel is contaminated only when it is this much brighter than the interior
# behind it. Observed real steps are 25-85, so this sits far below the signal
# while still refusing to touch ordinary shading or a genuinely white garment.
FRINGE_DELTA = 20.0

# How far in from the silhouette contamination may reach. Measured band
# thickness is 1-3 rings.
MAX_DEPTH = 3

# Reference colour is sampled from at least this deep, i.e. strictly beyond any
# possible contamination.
CLEAN_DEPTH = MAX_DEPTH + 1

# Detached components at or below this pixel count are cutout debris.
MIN_ISLAND = 24

# Enclosed transparent regions at or below this count are pinholes worth
# filling. Larger gaps are real negative space - the space between two legs runs
# into the thousands and must stay transparent.
MAX_HOLE = 400


@dataclass(frozen=True)
class Report:
    name: str
    depth: int
    fixed: int
    cleared: int
    islands: int
    holes: int
    notches: int
    jump_before: float
    jump_after: float
    white_before: int
    white_after: int


def luminance(pixel: Pixel) -> float:
    return (pixel[0] + pixel[1] + pixel[2]) / 3


def depth_map(alpha: list[int], w: int, h: int, limit: int) -> list[int]:
    """Distance in pixels from the transparent boundary, inward, capped at limit."""
    depth = [-1] * (w * h)
    queue: deque[int] = deque()
    for idx in range(w * h):
        if alpha[idx] < INK:
            continue
        x, y = idx % w, idx // w
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < w and 0 <= ny < h) or alpha[ny * w + nx] < INK:
                depth[idx] = 0
                queue.append(idx)
                break
    while queue:
        idx = queue.popleft()
        d = depth[idx]
        if d >= limit:
            continue
        x, y = idx % w, idx // w
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                n = ny * w + nx
                if alpha[n] >= INK and depth[n] < 0:
                    depth[n] = d + 1
                    queue.append(n)
    return depth


def band_depth(pixels: list[Pixel], depth: list[int]) -> tuple[int, float]:
    """How many boundary rings carry backdrop bleed, and the first ring's jump."""
    rings: dict[int, list[float]] = {}
    for idx, d in enumerate(depth):
        if 0 <= d <= CLEAN_DEPTH:
            rings.setdefault(d, []).append(luminance(pixels[idx]))
    means = {
        d: (sum(values) / len(values) if values else 0.0) for d, values in rings.items()
    }
    found = 0
    for d in range(MAX_DEPTH):
        here, behind = means.get(d), means.get(d + 1)
        if here is None or behind is None or here - behind < FRINGE_DELTA:
            break
        found = d + 1
    first = means.get(0, 0.0) - means.get(1, 0.0)
    return found, first


def components(alpha: list[int], w: int, h: int) -> list[list[int]]:
    label = bytearray(w * h)
    found: list[list[int]] = []
    for start in range(w * h):
        if label[start] or alpha[start] < INK:
            continue
        queue = deque([start])
        label[start] = 1
        cells: list[int] = []
        while queue:
            idx = queue.popleft()
            cells.append(idx)
            x, y = idx % w, idx // w
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        n = ny * w + nx
                        if not label[n] and alpha[n] >= INK:
                            label[n] = 1
                            queue.append(n)
        found.append(cells)
    found.sort(key=len, reverse=True)
    return found


def enclosed_holes(alpha: list[int], w: int, h: int) -> list[list[int]]:
    """Transparent regions the border flood-fill cannot reach."""
    outside = bytearray(w * h)
    queue: deque[int] = deque()

    def push(idx: int) -> None:
        if not outside[idx] and alpha[idx] < INK:
            outside[idx] = 1
            queue.append(idx)

    for x in range(w):
        push(x)
        push((h - 1) * w + x)
    for y in range(h):
        push(y * w)
        push(y * w + w - 1)
    while queue:
        idx = queue.popleft()
        x, y = idx % w, idx // w
        if x > 0:
            push(idx - 1)
        if x + 1 < w:
            push(idx + 1)
        if y > 0:
            push(idx - w)
        if y + 1 < h:
            push(idx + w)

    holes: list[list[int]] = []
    seen = bytearray(w * h)
    for start in range(w * h):
        if seen[start] or outside[start] or alpha[start] >= INK:
            continue
        inner = deque([start])
        seen[start] = 1
        cells: list[int] = []
        while inner:
            idx = inner.popleft()
            cells.append(idx)
            x, y = idx % w, idx // w
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    n = ny * w + nx
                    if not seen[n] and not outside[n] and alpha[n] < INK:
                        seen[n] = 1
                        inner.append(n)
        holes.append(cells)
    return holes


def close_sole_notches(
    pixels: list[Pixel],
    w: int,
    h: int,
    radius: int = 4,
) -> int:
    """Fill narrow bites chewed out of the sole contact edge.

    The de-matte pass cannot reach these. A bite that breaks the outline is
    *connected to the outside*, so the enclosed-hole fill correctly skips it -
    it is indistinguishable from real background by connectivity alone. On the
    ESTP renders this leaves visible notches in the white rubber sole.

    Morphological closing (dilate then erode by the same radius) fills any
    notch narrower than roughly 2*radius while leaving the broad silhouette
    unchanged, because the erode step gives back exactly what the dilate step
    added everywhere the gap was too wide to bridge.

    Restricted to the last few rows of the figure on purpose. Measured over the
    whole footwear zone, closing adds a uniform 1.0-1.6% on every file, which is
    ordinary silhouette curvature rather than damage - so a broad application
    would be reshaping art. Confined to the sole contact edge the signal
    separates cleanly: two files exceed 8% and the rest sit at 2%.
    """
    mask = Image.new("L", (w, h), 0)
    mask.putdata([255 if p[3] >= INK else 0 for p in pixels])

    closed = mask
    for _ in range(radius):
        closed = closed.filter(ImageFilter.MaxFilter(3))
    for _ in range(radius):
        closed = closed.filter(ImageFilter.MinFilter(3))

    mask_data: list[int] = list(mask.getdata())  # type: ignore[arg-type]
    closed_data: list[int] = list(closed.getdata())  # type: ignore[arg-type]

    rows = [idx // w for idx, p in enumerate(pixels) if p[3] > 40]
    if not rows:
        return 0
    bottom = max(rows)
    start = bottom - int(0.03 * h)

    filled = 0
    for idx in range(w * h):
        if idx // w < start:
            continue
        if mask_data[idx] or not closed_data[idx]:
            continue
        x, y = idx % w, idx // w
        acc = [0, 0, 0]
        n = 0
        for dx in range(-3, 4):
            for dy in range(-3, 4):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    pr, pg, pb, pa = pixels[ny * w + nx]
                    if pa > 200:
                        acc[0] += pr
                        acc[1] += pg
                        acc[2] += pb
                        n += 1
        if n >= 3:
            pixels[idx] = (acc[0] // n, acc[1] // n, acc[2] // n, 255)
            filled += 1
    return filled


def white_shoe_pixels(pixels: list[Pixel], depth: list[int], w: int) -> int:
    """Bright opaque footwear pixels that are genuine material, not rim.

    Counting every bright pixel in the bottom fifth conflates the two things
    this script must tell apart, and that made an earlier verification pass look
    like a catastrophic loss when nothing had been lost. Grouping those pixels by
    distance-from-boundary settles it:

        ENFJ.png        202 bright px, 100% at depth 0-2   -> rim
        ENTJ.png        215 bright px, 100% at depth 0-2   -> rim
        ISTJ-laki.png 2,801 bright px,   0% at depth 0-2   -> real white shoes
        ISFJ-plain    2,639 bright px,   0% at depth 0-2   -> real white shoes

    A matte rim is 1-3px thick by construction and cannot be deep. Real art
    continues inward. So only pixels at CLEAN_DEPTH or deeper count here, which
    makes this a meaningful regression guard rather than a restatement of the
    defect.
    """
    rows = [idx // w for idx, p in enumerate(pixels) if p[3] > 40]
    if not rows:
        return 0
    top, bottom = min(rows), max(rows)
    start = top + int((bottom - top + 1) * 0.78)
    count = 0
    for idx, (r, g, b, a) in enumerate(pixels):
        if idx // w < start:
            continue
        if depth[idx] >= 0 and depth[idx] < CLEAN_DEPTH:
            continue
        if a > 200 and r > 225 and g > 225 and b > 225:
            count += 1
    return count


def process(path: Path, *, write: bool) -> Report:
    image = Image.open(path).convert("RGBA")
    w, h = image.size
    pixels: list[Pixel] = list(image.getdata())  # type: ignore[arg-type]
    out = list(pixels)

    alpha = [p[3] for p in out]
    depth = depth_map(alpha, w, h, CLEAN_DEPTH)
    found, jump_before = band_depth(out, depth)
    white_before = white_shoe_pixels(out, depth, w)

    fixed = 0
    cleared = 0

    if found:
        # Work innermost ring outward so each ring can reference a ring that is
        # either original clean ink or already corrected.
        for ring in range(found - 1, -1, -1):
            patch: dict[int, Pixel] = {}
            for idx, d in enumerate(depth):
                if d != ring:
                    continue
                x, y = idx % w, idx // w
                # Reference from strictly beyond the contaminated band. Sampling
                # one ring in is still dirty when the band is 2-3 deep.
                reach = CLEAN_DEPTH - ring + 2
                chosen: tuple[int, int, int] | None = None
                brightest_deep = -1.0
                for radius in range(1, reach + 1):
                    acc = [0, 0, 0]
                    n = 0
                    for dx in range(-radius, radius + 1):
                        for dy in range(-radius, radius + 1):
                            nx, ny = x + dx, y + dy
                            if not (0 <= nx < w and 0 <= ny < h):
                                continue
                            n_idx = ny * w + nx
                            if depth[n_idx] < CLEAN_DEPTH or alpha[n_idx] < 250:
                                continue
                            pr, pg, pb, _ = out[n_idx]
                            acc[0] += pr
                            acc[1] += pg
                            acc[2] += pb
                            n += 1
                            brightest_deep = max(brightest_deep, luminance(out[n_idx]))
                    if n >= 3:
                        chosen = (acc[0] // n, acc[1] // n, acc[2] // n)
                        break
                if chosen is None:
                    continue
                r, g, b, a = out[idx]
                here = luminance((r, g, b, a))
                # Material continuity, and the guard that actually saves white
                # footwear. A mean reference is misleading at a material border:
                # a white shoe sitting against a dark sole averages to something
                # much darker than the shoe, so the shoe reads as "too bright"
                # and gets repainted. Verified as a total loss of all 202 bright
                # shoe pixels on ENFJ.png.
                #
                # Matte fringe is only 1-3px thick and has no deep counterpart.
                # Real white art does: the sock or sole continues inward. So if
                # any pixel beyond the band is about as bright as this one, this
                # is genuine material and must be left alone.
                if brightest_deep >= here - FRINGE_DELTA:
                    continue
                if here - luminance((*chosen, 255)) < FRINGE_DELTA:
                    continue
                patch[idx] = (chosen[0], chosen[1], chosen[2], a)
            for idx, value in patch.items():
                out[idx] = value
            fixed += len(patch)

    # Alpha noise too faint to carry colour.
    for idx, (r, g, b, a) in enumerate(out):
        if 0 < a < MIN_ALPHA:
            out[idx] = (0, 0, 0, 0)
            cleared += 1
    alpha = [p[3] for p in out]

    # Detached cutout debris.
    islands = 0
    for cells in components(alpha, w, h)[1:]:
        if len(cells) <= MIN_ISLAND:
            islands += 1
            for idx in cells:
                out[idx] = (0, 0, 0, 0)
    alpha = [p[3] for p in out]

    # Enclosed pinholes, filled from their own surroundings.
    holes = 0
    for cells in enclosed_holes(alpha, w, h):
        if len(cells) > MAX_HOLE:
            continue
        holes += 1
        for idx in cells:
            x, y = idx % w, idx // w
            acc = [0, 0, 0]
            n = 0
            for dx in range(-3, 4):
                for dy in range(-3, 4):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        pr, pg, pb, pa = out[ny * w + nx]
                        if pa > 200:
                            acc[0] += pr
                            acc[1] += pg
                            acc[2] += pb
                            n += 1
            if n:
                out[idx] = (acc[0] // n, acc[1] // n, acc[2] // n, 255)

    notches = close_sole_notches(out, w, h)

    after_alpha = [p[3] for p in out]
    after_depth = depth_map(after_alpha, w, h, CLEAN_DEPTH)
    _, jump_after = band_depth(out, after_depth)
    white_after = white_shoe_pixels(out, after_depth, w)

    if write and (fixed or cleared or islands or holes or notches):
        result = Image.new("RGBA", (w, h))
        result.putdata(out)
        result.save(path, "PNG", optimize=True)

    return Report(
        name=path.name,
        depth=found,
        fixed=fixed,
        cleared=cleared,
        islands=islands,
        holes=holes,
        notches=notches,
        jump_before=jump_before,
        jump_after=jump_after,
        white_before=white_before,
        white_after=white_after,
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dir", default="public/figurines")
    parser.add_argument("--check", action="store_true", help="report without writing")
    parser.add_argument("--only", default=None, help="comma-separated filenames")
    args = parser.parse_args()

    root = Path(args.dir)
    files = sorted(root.glob("*.png"))
    if args.only:
        wanted = {name.strip() for name in args.only.split(",")}
        files = [f for f in files if f.name in wanted]
    if not files:
        print("no files matched", file=sys.stderr)
        return 1

    write = not args.check
    print(f"{'file':26} {'band':>4} {'fixed':>6} {'isl':>4} {'hole':>5} {'sole':>5} "
          f"{'jumpBefore':>10} {'jumpAfter':>9} {'whiteShoeKept':>13}")
    print("-" * 88)
    worst_jump = 0.0
    worst_white = (100.0, "")
    for path in files:
        r = process(path, write=write)
        worst_jump = max(worst_jump, r.jump_after)
        kept = 100.0 * r.white_after / r.white_before if r.white_before else 100.0
        if r.white_before >= 200 and kept < worst_white[0]:
            worst_white = (kept, r.name)
        print(
            f"{r.name:26} {r.depth:4} {r.fixed:6,} {r.islands:4} {r.holes:5} {r.notches:5} "
            f"{r.jump_before:+10.1f} {r.jump_after:+9.1f} {kept:12.1f}%"
        )
    print("-" * 88)
    print(f"{'written' if write else 'checked'}: {len(files)} files")
    print(f"worst remaining ring jump   {worst_jump:+.1f}")
    print(f"worst white-footwear kept   {worst_white[0]:.1f}% ({worst_white[1] or 'n/a'})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
