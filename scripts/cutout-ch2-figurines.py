#!/usr/bin/env python3
"""Cut out the 32 Ch2 chibi renders into straight-alpha RGBA canonical sources.

Global luminance keying is not used: it cannot tell a pale studio backdrop from
pale hair, a white shirt, or cream shoes, and it damaged this artwork before.

Four structural facts do the separating instead:

1. Background is border-connected. Pale artwork enclosed by the silhouette is
   not, so a flood fill seeded from the canvas edge with a tight tolerance
   leaves interior artwork untouched.
2. The soft contact shadow only ever appears directly under the feet. Measured
   across all 32 renders, residual near-neutral pixels cluster in the head band
   for pastel hair (infp_1: 21728), the torso band for pale clothing
   (esfj_1: 6564), and the feet band for shadow (entj_1: 11280). Shadow
   absorption is therefore restricted to the feet band, so hair and clothing are
   protected by position, not by a colour guess.
3. Partial alpha is only legitimate on the antialiased rim. Ramping alpha by
   luminance across the whole frame put semi-transparent pixels deep inside pale
   clothing and hair, and the repository validator rejected 30 of 32 files for
   exactly that. Softening is restricted to within RIM_DISTANCE of real
   transparency; everything deeper stays fully opaque.
4. Speckles are not artwork. Component census across all 32 outputs: every
   largest component is 169931-295635px while every other component is at most
   45px. Dropping components at or below STRAY_MAX_PIXELS therefore cannot erase
   real artwork, and it clears the gradient-backdrop residue in istj_1, whose
   photographic studio floor is not flat enough to flood fill.

Output names follow the site contract: ``{TYPE}-{laki|perempuan}.png``, from an
explicit reviewed table. The ``_1``/``_2`` suffix in the source folders is not a
gender marker (istp_1 is male, intj_1 is female), so the mapping cannot be
derived from filenames and is listed by hand below.
"""

import sys
from collections import deque
from pathlib import Path

from PIL import Image

SRC = Path("NewDesign_V1/Ch2/stitch_personality_3d_chibi_figurines")
PREFIX = "pop_mart_style_cute_3d_chibi_vinyl_toy_collectible_figurine_representing_"
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else "NewDesign_V1/karakternya")

# Reviewed gender of each source render. Read from the rendered artwork, not the
# filename suffix. Outfit and palette are shared within each type, so the type
# stays readable across both genders.
GENDER = {
    "enfj_1": "perempuan", "enfj_2": "laki",
    "enfp_1": "perempuan", "enfp_2": "laki",
    "entj_1": "perempuan", "entj_2": "laki",
    "entp_1": "perempuan", "entp_2": "laki",
    "esfj_1": "laki", "esfj_2": "perempuan",
    "esfp_1": "laki", "esfp_2": "perempuan",
    "estj_1": "laki", "estj_2": "perempuan",
    "estp_1": "laki", "estp_2": "perempuan",
    "infj_1": "perempuan", "infj_2": "laki",
    "infp_1": "perempuan", "infp_2": "laki",
    "intj_1": "perempuan", "intj_2": "laki",
    "intp_1": "laki", "intp_2": "perempuan",
    "isfj_1": "laki", "isfj_2": "perempuan",
    "isfp_1": "laki", "isfp_2": "perempuan",
    "istj_1": "laki", "istj_2": "perempuan",
    "istp_1": "laki", "istp_2": "perempuan",
}

FILL_LUM_TOLERANCE = 8
FILL_SAT_TOLERANCE = 14

SHADOW_LUM_DEPTH = 42
SHADOW_SAT_TOLERANCE = 18
FEET_BAND_START = 0.86

# Shadow absorption used to be an unbounded flood, and that is what chewed the
# footwear. Restricting it to the feet band bounds *where* it may start but not
# how far it may travel, and pale sneakers, white rubber soles, and white socks
# satisfy the same neutrality-and-depth window as the floor shadow. Simulating
# the old flood shows it walking 90-114 rows upward into shoe material:
#
#     estp_1  2,615 px absorbed, 1,829 clearly material, deepest row 1041
#     estp_2  4,938 px absorbed, 3,003 clearly material, deepest row 1057
#     esfj_1  6,331 px absorbed, 3,538 clearly material, deepest row  995
#     entj_1 11,309 px absorbed, 3,084 clearly material, deepest row 1038
#
# Four colour-based discriminators were measured and rejected before settling on
# reach: un-compositing (error rose 17->86), neighbourhood support (footwear and
# a known-good control band overlap, 37% vs 16-47%), column geometry, and
# monotone luminance descent. That matches this file's own premise - brightness
# cannot separate a pale floor from a pale shoe - so the fix constrains geometry
# instead of guessing material.
#
# A cast shadow is contiguous with the backdrop it sits on, so it is reachable in
# a few steps. Shoe material is not: it lies behind the sole edge. Two bounds
# encode that. Absorption may travel at most this many steps from genuine
# backdrop, and it may not cross a luminance step edge. Measured together over
# the eight worst renders these spare all but 4 px of clearly-material pixels,
# where the unbounded flood destroyed 14,000.
SHADOW_MAX_DISTANCE = 3
SHADOW_EDGE_BARRIER = 9.0

# Leftover floor is then classified per region rather than per pixel. A region
# whose border opens mostly onto transparency is a patch of plane; one enclosed
# by artwork is footwear. Measured separation is 36-47% against a flat 100%, so
# the midpoint is far from both populations. The size floor keeps this away from
# small debris, which the speckle and pocket passes already own.
FLOOR_MIN_REGION = 40
FLOOR_ART_FRACTION = 0.50

# Regions are grown under a luminance-continuity limit. Without it the floor
# patch merges with the ramp pixels hugging a shoe, and the merged region's
# border statistic lands near the cut - 53% on entj_1 and 51% on intj_1 - so the
# slab survived there while the same code cleared istj_1. A borderline number is
# the signal that two things were merged, not that the threshold needs nudging.
#
# Tightening continuity breaks the merge instead of moving the line, but it can
# be tightened too far: at 1.5 the floor stops being one region and shatters into
# crumbs below FLOOR_MIN_REGION, which then survive as detached islands and trip
# the speckle guard (entj_1 raised a 125px stray at x540-555, y1025-1038). That
# guard is doing its job - the fragments are real leftovers - so the value has to
# keep the plane connected. At 2.5 all four problem renders pass, and no region
# lands between 40% and 62%: floor reads 0-39%, material reads 100%.
FLOOR_CONTINUITY = 2.5

RIM_DISTANCE = 2
RAMP = 26

STRAY_MAX_PIXELS = 64

# Backdrop trapped inside the silhouette — between the legs, under an armpit, in
# the loop of a raised hand — is not border-connected, so the flood fill cannot
# reach it and it stays as an opaque white blob on the coloured podium stage.
#
# Neither brightness nor flatness alone separates those pockets from genuinely
# white artwork: across the 27 measured pockets, mean luminance spans 242-254 and
# standard deviation 1.35-3.25 in *both* classes, which is the same ambiguity this
# pipeline cites for never colour-keying. Three conditions together do separate
# them, verified against a region-by-region visual review of all 32 outputs:
# backdrop sits within POCKET_BG_DELTA of the measured backdrop luminance, is
# almost perfectly neutral, and is large. Pale clothing is either dimmer
# (ESFJ sleeve 243.5, ESTJ collar 246.3, ISTJ vest 242.6) or measurably tinted
# (ISTJ shoe 7.7, ESTP trouser 7.4, INFP sole 5.0). On that review the rule
# cleared 9 of 9 backdrop pockets and 0 of 11 artwork regions.
#
# Pockets below the size floor stay opaque on purpose: they are armpit and finger
# gaps of a few hundred pixels on a 896x1200 canvas, and a wrong call there would
# punch a hole in a hand.
POCKET_BG_DELTA = 4.0
POCKET_MAX_SATURATION = 3.5
POCKET_MIN_PIXELS = 400

# The figure must not touch the canvas edge, so keep a guaranteed margin.
EDGE_MARGIN = 2


def luminance(pixel):
    return 0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2]


def saturation(pixel):
    return max(pixel) - min(pixel)


def estimate_background(pixels, width, height):
    samples = []
    for x in range(0, width, 3):
        samples.append(luminance(pixels[x, 0]))
        samples.append(luminance(pixels[x, height - 1]))
    for y in range(0, height, 3):
        samples.append(luminance(pixels[0, y]))
        samples.append(luminance(pixels[width - 1, y]))
    samples.sort()
    return samples[len(samples) // 2]


def cut(name):
    image = Image.open(SRC / (PREFIX + name) / "screen.png").convert("RGB")
    width, height = image.size
    pixels = image.load()
    background = estimate_background(pixels, width, height)

    def tight(pixel):
        return (
            background - luminance(pixel) <= FILL_LUM_TOLERANCE
            and saturation(pixel) <= FILL_SAT_TOLERANCE
        )

    mask = bytearray(width * height)
    queue = deque()

    def push(x, y, accept):
        index = y * width + x
        if mask[index] or not accept(x, y):
            return
        mask[index] = 1
        queue.append((x, y))

    def spread(accept):
        while queue:
            x, y = queue.popleft()
            if x > 0:
                push(x - 1, y, accept)
            if x < width - 1:
                push(x + 1, y, accept)
            if y > 0:
                push(x, y - 1, accept)
            if y < height - 1:
                push(x, y + 1, accept)

    def accept_tight(x, y):
        return tight(pixels[x, y])

    for x in range(width):
        push(x, 0, accept_tight)
        push(x, height - 1, accept_tight)
    for y in range(height):
        push(0, y, accept_tight)
        push(width - 1, y, accept_tight)
    spread(accept_tight)

    top, bottom = height, 0
    for y in range(height):
        row = y * width
        for x in range(width):
            if not mask[row + x]:
                top = min(top, y)
                bottom = max(bottom, y)
                break
    feet_line = top + max(1, bottom - top) * FEET_BAND_START

    def step_edge(x, y):
        """Largest local luminance step across this pixel.

        A cast shadow is a smooth ramp painted on the plane, so its interior
        gradients are small. The boundary of a shoe is a step. Refusing to cross
        a step keeps absorption on the floor side of the sole.
        """
        left = pixels[max(x - 1, 0), y]
        right = pixels[min(x + 1, width - 1), y]
        above = pixels[x, max(y - 1, 0)]
        below = pixels[x, min(y + 1, height - 1)]
        return max(
            abs(luminance(right) - luminance(left)),
            abs(luminance(below) - luminance(above)),
        )

    def absorbable_shadow(x, y):
        pixel = pixels[x, y]
        if tight(pixel):
            return True
        if y < feet_line:
            return False
        return (
            saturation(pixel) <= SHADOW_SAT_TOLERANCE
            and background - luminance(pixel) <= SHADOW_LUM_DEPTH
            and step_edge(x, y) <= SHADOW_EDGE_BARRIER
        )

    # Bounded shadow spread. Genuine backdrop re-seeds at distance 0, so a pixel
    # is only absorbed while it is within SHADOW_MAX_DISTANCE steps of real
    # backdrop; the walk cannot ratchet its way up into the figure.
    shadow_queue = deque()
    for y in range(height):
        row = y * width
        for x in range(width):
            if mask[row + x]:
                shadow_queue.append((x, y, 0))
    while shadow_queue:
        x, y, distance = shadow_queue.popleft()
        if distance >= SHADOW_MAX_DISTANCE:
            continue
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if not (0 <= nx < width and 0 <= ny < height):
                continue
            index = ny * width + nx
            if mask[index] or not absorbable_shadow(nx, ny):
                continue
            mask[index] = 1
            reached = 0 if tight(pixels[nx, ny]) else distance + 1
            shadow_queue.append((nx, ny, reached))

    # Bounding the walk above leaves behind plain backdrop that used to be
    # reached *through* the shadow ramp: measured over the 32 renders the bound
    # saved every one of the 370 eaten footwear pixels but left 3,634 more
    # backdrop pixels opaque, which reads as a grey slab under the feet.
    #
    # Those pixels are not ambiguous. They satisfy tight(), the script's own
    # definition of backdrop, which by construction excludes artwork. So they can
    # be swept without any distance bound - the bound exists to protect material
    # the neutrality window cannot distinguish, and tight() pixels are not that.
    for x in range(width):
        push(x, 0, accept_tight)
        push(x, height - 1, accept_tight)
    for y in range(height):
        push(0, y, accept_tight)
        push(width - 1, y, accept_tight)
    for y in range(height):
        row = y * width
        for x in range(width):
            if mask[row + x]:
                queue.append((x, y))
    spread(accept_tight)

    # The bounded walk plus the tight sweep still leave a slab of floor under the
    # feet: pixels that are neither tight() backdrop nor definite artwork, sitting
    # in the neutrality window this file says colour cannot resolve. Per pixel
    # they are genuinely ambiguous, and every per-pixel discriminator measured
    # here failed on them - un-compositing, neighbourhood support, column
    # geometry, monotone descent, and the gradient barrier alone.
    #
    # As regions they are not ambiguous. A cast shadow is a patch of plane, so
    # most of its border opens onto transparency. Footwear is enclosed by the
    # figure, so most of its border touches definite artwork. Measured on the
    # regenerated renders the two populations separate without overlap:
    #
    #     istj_1  slab 3,679px   artFraction 36%      shoe 3,197px  100%
    #     entj_1  slab 9,285px   artFraction 36%      shoe   467px  100%
    #     estp_2  slab 2,115px   artFraction 47%      shoe 2,014px  100%
    #
    # So classify by enclosure, not by colour. Regions below the size floor are
    # left alone: at that scale the border statistic is noise, and the speckle
    # and pocket passes below already own small detached debris.
    #
    # This is confined to the feet band for the same reason the shadow pass is:
    # position, not colour, is what protects pale artwork. Without that fence the
    # floor under intj_1 grew up into the pale coat at y828 and the merged region
    # scored 63%, so the slab was kept; pale clothing elsewhere would have been
    # the mirror failure. Only a contact shadow can be in this band.
    region_seen = bytearray(width * height)

    def ambiguous(index):
        y, x = divmod(index, width)
        if y < feet_line:
            return False
        pixel = pixels[x, y]
        return (
            not mask[index]
            and saturation(pixel) <= SHADOW_SAT_TOLERANCE
            and background - luminance(pixel) <= SHADOW_LUM_DEPTH
        )

    floor_pixels = 0
    for start in range(width * height):
        if region_seen[start] or not ambiguous(start):
            continue
        region_seen[start] = 1
        work = deque([start])
        members = []
        touches_art = 0
        touches_void = 0
        while work:
            index = work.popleft()
            members.append(index)
            y, x = divmod(index, width)
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if not (0 <= nx < width and 0 <= ny < height):
                    continue
                neighbour = ny * width + nx
                if mask[neighbour]:
                    touches_void += 1
                elif not ambiguous(neighbour):
                    touches_art += 1
                elif not region_seen[neighbour] and (
                    abs(luminance(pixels[nx, ny]) - luminance(pixels[x, y]))
                    <= FLOOR_CONTINUITY
                ):
                    region_seen[neighbour] = 1
                    work.append(neighbour)
        border = touches_art + touches_void
        if len(members) < FLOOR_MIN_REGION or not border:
            continue
        if touches_art / border >= FLOOR_ART_FRACTION:
            continue
        for index in members:
            mask[index] = 1
        floor_pixels += len(members)

    # Drop speckles: keep only the largest opaque component.
    seen = bytearray(width * height)
    components = []
    for start in range(width * height):
        if mask[start] or seen[start]:
            continue
        seen[start] = 1
        work = deque([start])
        members = []
        while work:
            index = work.popleft()
            members.append(index)
            y, x = divmod(index, width)
            for neighbour in (
                index - 1 if x > 0 else -1,
                index + 1 if x < width - 1 else -1,
                index - width if y > 0 else -1,
                index + width if y < height - 1 else -1,
            ):
                if neighbour >= 0 and not mask[neighbour] and not seen[neighbour]:
                    seen[neighbour] = 1
                    work.append(neighbour)
        components.append(members)
    components.sort(key=len, reverse=True)
    dropped = 0
    for members in components[1:]:
        if len(members) > STRAY_MAX_PIXELS:
            raise ValueError(
                f"{name}: detached component of {len(members)}px exceeds the "
                f"{STRAY_MAX_PIXELS}px speckle budget; refusing to erase it"
            )
        for index in members:
            mask[index] = 1
        dropped += len(members)

    # Clear backdrop trapped inside the silhouette. See POCKET_* above for why
    # brightness, neutrality, and size are all required.
    seen = bytearray(width * height)
    pockets = 0

    def backdrop_like(index):
        y, x = divmod(index, width)
        pixel = pixels[x, y]
        # Widening this window to the shadow window in the feet band was measured
        # and rejected. It does clear the floor visible between the legs, which
        # the enclosure test cannot reach (that patch is surrounded by shoe and
        # trouser, so it scores 100% art and is kept). But the same window names
        # white sneaker material: on estp_1 and estp_2 the widened pocket chewed
        # visible bites out of both white shoes. That is this file's founding
        # warning - a pale floor and a pale shoe are the same colour - so the
        # narrow neutrality window stays, and the remaining between-the-legs floor
        # is left rather than risk the artwork.
        return (
            abs(background - luminance(pixel)) <= POCKET_BG_DELTA
            and saturation(pixel) <= POCKET_MAX_SATURATION
        )

    for start in range(width * height):
        if mask[start] or seen[start] or not backdrop_like(start):
            continue
        seen[start] = 1
        work = deque([start])
        members = []
        touches_border = False
        while work:
            index = work.popleft()
            members.append(index)
            y, x = divmod(index, width)
            if x == 0 or y == 0 or x == width - 1 or y == height - 1:
                touches_border = True
            for neighbour, nx, ny in (
                (index - 1, x - 1, y),
                (index + 1, x + 1, y),
                (index - width, x, y - 1),
                (index + width, x, y + 1),
            ):
                if 0 <= nx < width and 0 <= ny < height:
                    if not mask[neighbour] and not seen[neighbour] and backdrop_like(neighbour):
                        seen[neighbour] = 1
                        work.append(neighbour)
        if touches_border or len(members) < POCKET_MIN_PIXELS:
            continue
        for index in members:
            mask[index] = 1
        pockets += len(members)

    # Force a transparent margin so the figure cannot touch the canvas edge.
    for x in range(width):
        for y in range(EDGE_MARGIN):
            mask[y * width + x] = 1
            mask[(height - 1 - y) * width + x] = 1
    for y in range(height):
        row = y * width
        for x in range(EDGE_MARGIN):
            mask[row + x] = 1
            mask[row + width - 1 - x] = 1

    distance = [0 if mask[i] else -1 for i in range(width * height)]
    frontier = deque(i for i in range(width * height) if mask[i])
    while frontier:
        index = frontier.popleft()
        step = distance[index] + 1
        if step > RIM_DISTANCE:
            continue
        y, x = divmod(index, width)
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height:
                n = ny * width + nx
                if distance[n] == -1:
                    distance[n] = step
                    frontier.append(n)

    payload = []
    for y in range(height):
        row = y * width
        for x in range(width):
            index = row + x
            pixel = pixels[x, y]
            if mask[index]:
                payload.append((pixel[0], pixel[1], pixel[2], 0))
                continue
            delta = background - luminance(pixel)
            if (
                0 < distance[index] <= RIM_DISTANCE
                and delta < RAMP
                and saturation(pixel) <= FILL_SAT_TOLERANCE
            ):
                alpha = max(1, int(max(0.0, min(1.0, delta / RAMP)) * 255))
            else:
                alpha = 255
            payload.append((pixel[0], pixel[1], pixel[2], alpha))

    out = Image.new("RGBA", (width, height))
    out.putdata(payload)
    return out, dropped, pockets


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    names = sorted(d.name.replace(PREFIX, "") for d in SRC.iterdir() if d.is_dir())
    missing = sorted(set(names) - set(GENDER))
    if missing:
        print(f"FAIL: no reviewed gender for {', '.join(missing)}")
        return 1
    written = []
    for name in names:
        image, dropped, pockets = cut(name)
        label = f"{name[:4].upper()}-{GENDER[name]}"
        path = OUT / f"{label}.png"
        image.save(path)
        written.append(label)
        print(
            "  %-18s from %-9s speckles=%dpx pockets=%dpx"
            % (label, name, dropped, pockets)
        )
    print(f"\nWrote {len(written)} canonical sources to {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
