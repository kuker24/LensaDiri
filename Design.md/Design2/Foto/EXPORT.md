# Export + review — Design2 foto

## Target sizes

| File | Px | Ratio |
|------|-----|-------|
| `poster-hero-island.jpg` | 1920×1080 | 16:9 |
| `strip-ice-chamber.jpg` | 1920×1080 | 16:9 |
| `strip-dune-glass.jpg` | 1920×1080 | 16:9 |
| `strip-mirror-garden.jpg` | 1920×1080 | 16:9 |
| `panel-void-detail.jpg` | 1080×1350 | 4:5 |
| `og-share-world.jpg` | 1200×630 | ~1.91:1 |
| `mobile-hero-crop.jpg` | 1080×1920 | 9:16 |

## Web compress (opsional)

```bash
# example: high-quality JPEG
ffmpeg -i raw.png -q:v 2 assets/poster-hero-island.jpg
```

Or export WebP for production later (`quality 80–85`).

## Checklist

- [ ] Correct pixel size / ratio per role
- [ ] No people / text / HUD / medical / neon casino
- [ ] One color family per image
- [ ] Left/lower third not too busy (type overlay room)
- [ ] Provenance noted
