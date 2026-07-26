# Export + review — Design2 video

## Target per file

| File | Spec |
|------|------|
| `assets/hero-01-island-bloom.mp4` | 720p · 15s · 16:9 · audio |
| `assets/hero-02-ice-chamber.mp4` | 720p · 15s · 16:9 · audio |
| `assets/hero-03-dune-glass.mp4` | 720p · 15s · 16:9 · audio |
| `assets/section-01-lens-field.mp4` | 720p · 15s · 16:9 · audio |
| `assets/section-02-mirror-garden.mp4` | 720p · 15s · 16:9 · audio |

## Normalize

```bash
ffmpeg -i raw.mp4 -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -crf 23 -preset slow -c:a aac -b:a 128k -movflags +faststart \
  assets/hero-01-island-bloom.mp4
```

## Poster dari hero-01

```bash
ffmpeg -ss 00:00:00 -i assets/hero-01-island-bloom.mp4 -frames:v 1 -q:v 2 assets/hero-poster.jpg
```

## Web ship notes

- Browser: muted autoplay + `playsInline` + poster + `preload="none"`
- Reduced-motion → static poster / still
- Prefer muted loop; audio master optional via user gesture later

## Checklist review

- [ ] 720p · ~15s · 16:9
- [ ] Ambient audio only (no vocal)
- [ ] No people / text / HUD / medical / neon casino
- [ ] One color family per take (not rainbow)
- [ ] Provenance: tool, account, date
