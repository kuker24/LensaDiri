#!/usr/bin/env python3
"""Validate and synchronize the 22 transparent figurine assets.

The canonical files already contain real transparency. This pipeline therefore
never attempts colour-keying, flood filling, feathering, or background removal:
those operations cannot distinguish pale clothing and shoes from a pale studio
backdrop and previously damaged the artwork.

Validated files are copied byte-for-byte so their RGB and alpha channels remain
unchanged.

The base pair and the ``*-plain.png`` podium assets used to sit outside this
pipeline, and that gap hid real damage: both base figurines carried studio floor
residue and had transparent gashes eaten through the torso and one arm. They were
rebuilt from the raw pair render and every asset the site serves is now covered
here, so the same class of defect cannot return unnoticed.
"""

import hashlib
import os
import shutil
import sys
from collections import deque
from pathlib import Path

from PIL import Image, UnidentifiedImageError

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "NewDesign_V1" / "karakternya"
OUTPUT = Path(os.environ.get("CUTOUT_OUT", ROOT / "public" / "figurines"))
TYPES = (
    "ENFJ",
    "ENFP",
    "ENTJ",
    "ENTP",
    "ESFJ",
    "ESFP",
    "ESTJ",
    "ESTP",
    "INFJ",
    "INFP",
    "INTJ",
    "INTP",
    "ISFJ",
    "ISFP",
    "ISTJ",
    "ISTP",
)

# Gender-neutral base bodies plus the four podium variants. Same contract as the
# MBTI set: validated, then published byte-for-byte.
EXTRA = (
    "base-female",
    "base-male",
    "ENFP-plain",
    "ESTP-plain",
    "INTJ-plain",
    "ISFJ-plain",
)
ASSETS = TYPES + EXTRA

# Defect budgets measured against the audited rebuild. A pale studio floor that
# survives colour-keying shows up as bright semi-transparent pixels near the
# feet, and an over-aggressive key punches transparent holes through clothing
# and soles. Both were previously invisible to this pipeline.
MAX_INTERIOR_HOLE = 2000

# There is deliberately no luminance-based backdrop check here. Measured against
# both damaged archives, no alpha window or luminance floor separated a pale
# studio floor from pale sneakers, hair, or clothing: the repaired assets scored
# higher than the damaged ones. That is the same limitation this pipeline cites
# for never colour-keying. The earlier threshold only appeared to work because
# premultiplied colour is capped by alpha, which darkened every soft edge and
# made real artwork look like backdrop residue. Structural checks below plus the
# premultiply fence carry the load instead.

# Browsers composite PNG as straight alpha. A premultiplied file therefore draws
# every soft edge darkened toward black and lets the page background bleed
# through soft interior matting such as eyes. The signature is exact: colour is
# scaled by coverage, so max(R,G,B) never exceeds alpha. Real straight-alpha
# artwork breaks that bound constantly, because a pale edge pixel keeps its
# bright colour at low coverage. Anything above the tolerance is a genuine
# straight-alpha asset; at or below it, treat the file as premultiplied.
PREMULTIPLIED_SAMPLE_FLOOR = 64
PREMULTIPLIED_VIOLATION_RATIO = 0.02

# Semi-transparency far inside the silhouette is matting residue, not edge
# softness, and it lets the page background tint the artwork: a blue speck showed
# up inside one eye on the live hero, magnified because the asset is upscaled.
# Measured across all 16 assets, genuine antialiasing spans 1 to 2 pixels from
# the nearest transparent pixel (67k and 42k pixels), then collapses (2.4k at 5,
# 85 at 8). Distance is measured from real transparency, so the antialiased rim
# around a genuine opening such as the gap between INFP's legs stays close to it
# and is never flagged.
INTERIOR_DISTANCE = 4
INTERIOR_OPAQUE_FLOOR = 250
MAX_INTERIOR_SOFT = 0


def digest(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def measure_interior_soft(image: Image.Image) -> int:
    """Count semi-transparent pixels lying deep inside the silhouette.

    Distance to the nearest transparent pixel is computed with a two-pass
    chamfer transform, which is exact enough at this threshold and keeps the
    pipeline free of extra dependencies. Nothing is modified; this only reports.
    """
    width, height = image.size
    alpha = image.getchannel("A").tobytes()

    # Weighted 3-4 chamfer: an orthogonal step costs 3 and a diagonal step 4, so
    # the result approximates true Euclidean distance times 3 to within a few
    # percent. Plain city-block distance would not do, since it overestimates
    # diagonals badly enough to flag ordinary antialiasing as interior residue.
    limit = INTERIOR_DISTANCE * 3
    far = limit + 4
    distance = [0 if value == 0 else far for value in alpha]

    for y in range(height):
        row = y * width
        for x in range(width):
            index = row + x
            best = distance[index]
            if best == 0:
                continue
            if x > 0:
                best = min(best, distance[index - 1] + 3)
            if y > 0:
                above = index - width
                best = min(best, distance[above] + 3)
                if x > 0:
                    best = min(best, distance[above - 1] + 4)
                if x < width - 1:
                    best = min(best, distance[above + 1] + 4)
            distance[index] = best
    for y in range(height - 1, -1, -1):
        row = y * width
        for x in range(width - 1, -1, -1):
            index = row + x
            best = distance[index]
            if best == 0:
                continue
            if x < width - 1:
                best = min(best, distance[index + 1] + 3)
            if y < height - 1:
                below = index + width
                best = min(best, distance[below] + 3)
                if x > 0:
                    best = min(best, distance[below - 1] + 4)
                if x < width - 1:
                    best = min(best, distance[below + 1] + 4)
            distance[index] = best

    return sum(
        1
        for index, value in enumerate(alpha)
        if 0 < value < INTERIOR_OPAQUE_FLOOR and distance[index] >= limit
    )


def measure_premultiplied(image: Image.Image) -> tuple[int, int]:
    """Count semi-transparent pixels and how many exceed the premultiply bound.

    Returns ``(samples, violations)`` where a violation is a pixel whose
    brightest colour channel is greater than its alpha. Nothing is modified.
    """
    red, green, blue, alpha = (channel.tobytes() for channel in image.split())
    samples = 0
    violations = 0
    for index, coverage in enumerate(alpha):
        if coverage == 0 or coverage == 255:
            continue
        samples += 1
        if max(red[index], green[index], blue[index]) > coverage:
            violations += 1
    return samples, violations


def inspect_defects(image: Image.Image) -> int:
    """Measure the largest transparent hole punched through the figure.

    An over-aggressive background key eats through pale soles and clothing and
    leaves enclosed transparent regions behind. Nothing is modified; this only
    reports.
    """
    width, height = image.size
    count = width * height
    alpha = image.getchannel("A").tobytes()

    # Flood the fully transparent border region, then any remaining transparent
    # pixel is enclosed by the silhouette: a hole in clothing, a sole, or a real
    # gap between the legs.
    outside = bytearray(count)
    queue: deque[int] = deque()

    def seed(index: int) -> None:
        if alpha[index] == 0 and not outside[index]:
            outside[index] = 1
            queue.append(index)

    for x in range(width):
        seed(x)
        seed((height - 1) * width + x)
    for y in range(height):
        seed(y * width)
        seed(y * width + width - 1)
    while queue:
        index = queue.popleft()
        y, x = divmod(index, width)
        for neighbour in (
            index - 1 if x > 0 else -1,
            index + 1 if x < width - 1 else -1,
            index - width if y > 0 else -1,
            index + width if y < height - 1 else -1,
        ):
            if neighbour >= 0 and alpha[neighbour] == 0 and not outside[neighbour]:
                outside[neighbour] = 1
                queue.append(neighbour)

    seen = bytearray(count)
    largest_hole = 0
    for index in range(count):
        if alpha[index] != 0 or outside[index] or seen[index]:
            continue
        seen[index] = 1
        queue.append(index)
        size = 0
        while queue:
            current = queue.popleft()
            size += 1
            y, x = divmod(current, width)
            for neighbour in (
                current - 1 if x > 0 else -1,
                current + 1 if x < width - 1 else -1,
                current - width if y > 0 else -1,
                current + width if y < height - 1 else -1,
            ):
                if (
                    neighbour >= 0
                    and alpha[neighbour] == 0
                    and not outside[neighbour]
                    and not seen[neighbour]
                ):
                    seen[neighbour] = 1
                    queue.append(neighbour)
        largest_hole = max(largest_hole, size)

    return largest_hole


def validate(path: Path, label: str) -> int:
    """Validate genuine RGBA transparency without modifying the image."""
    try:
        with Image.open(path) as image:
            image.verify()
        with Image.open(path) as image:
            if image.format != "PNG":
                raise ValueError(f"expected PNG, got {image.format or 'unknown'}")
            if image.mode != "RGBA":
                raise ValueError(f"expected RGBA, got {image.mode}")

            width, height = image.size
            if width < 64 or height < 64:
                raise ValueError(f"image is unexpectedly small: {width}x{height}")

            alpha = image.getchannel("A")
            low, high = alpha.getextrema()
            if low != 0 or high != 255:
                raise ValueError(f"alpha must contain 0 and 255, got ({low},{high})")

            corners = (
                alpha.getpixel((0, 0)),
                alpha.getpixel((width - 1, 0)),
                alpha.getpixel((0, height - 1)),
                alpha.getpixel((width - 1, height - 1)),
            )
            if any(corners):
                raise ValueError(f"canvas corners must be transparent, got {corners}")

            values = alpha.histogram()
            transparent = values[0]
            opaque = values[255]
            if transparent < width * height * 0.05:
                raise ValueError("transparent area is below 5% of the canvas")
            if opaque < width * height * 0.05:
                raise ValueError("opaque figure area is below 5% of the canvas")

            silhouette = alpha.getbbox()
            if silhouette is None:
                raise ValueError("alpha channel has no figure")
            if silhouette[0] == 0 or silhouette[1] == 0:
                raise ValueError(f"figure touches the canvas edge: {silhouette}")
            if silhouette[2] >= width or silhouette[3] >= height:
                raise ValueError(f"figure touches the canvas edge: {silhouette}")

            rgba = image.convert("RGBA")

            samples, violations = measure_premultiplied(rgba)
            if samples >= PREMULTIPLIED_SAMPLE_FLOOR:
                ratio = violations / samples
                if ratio <= PREMULTIPLIED_VIOLATION_RATIO:
                    raise ValueError(
                        "colour looks premultiplied by alpha: only "
                        f"{violations}/{samples} soft pixels exceed their alpha "
                        f"({ratio:.2%}); browsers composite straight alpha, so "
                        "edges would render darkened and eyes would show the "
                        "page background"
                    )

            interior = measure_interior_soft(rgba)
            if interior > MAX_INTERIOR_SOFT:
                raise ValueError(
                    f"{interior} semi-transparent pixels sit at least "
                    f"{INTERIOR_DISTANCE}px inside the silhouette, so the page "
                    "background would tint the artwork"
                )

            hole = inspect_defects(rgba)
            if hole > MAX_INTERIOR_HOLE:
                raise ValueError(
                    f"transparent hole inside the figure {hole}px "
                    f"exceeds {MAX_INTERIOR_HOLE}px"
                )
            return hole
    except (OSError, UnidentifiedImageError) as error:
        raise ValueError(f"invalid image: {error}") from error


def publish(source: Path, destination: Path) -> None:
    """Atomically copy one asset and prove the output is byte-identical."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    temporary = destination.with_name(f".{destination.name}.tmp")
    try:
        shutil.copyfile(source, temporary)
        if digest(source) != digest(temporary):
            raise RuntimeError("copy hash mismatch")
        os.replace(temporary, destination)
    finally:
        temporary.unlink(missing_ok=True)


def main() -> int:
    failures: list[str] = []
    OUTPUT.mkdir(parents=True, exist_ok=True)
    print(f"Validating transparent figurine assets: {SOURCE}")
    print(f"Publishing byte-identical files to: {OUTPUT}")

    for label in ASSETS:
        source = SOURCE / f"{label}.png"
        destination = OUTPUT / source.name
        if not source.is_file():
            print(f"  FAIL {label}: missing {source}")
            failures.append(label)
            continue
        try:
            hole = validate(source, label)
            publish(source, destination)
            validate(destination, label)
            if digest(source) != digest(destination):
                raise RuntimeError("published file differs from canonical source")
            print(f"  OK   {label} hole={hole}")
        except (ValueError, RuntimeError) as error:
            print(f"  FAIL {label}: {error}")
            failures.append(label)

    if failures:
        print(f"\nFAILED: {', '.join(failures)}")
        return 1
    print(
        f"\nPublished and verified {len(ASSETS)}/{len(ASSETS)} transparent "
        "figurine assets."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
