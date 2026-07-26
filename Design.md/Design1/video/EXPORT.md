# Export + review

## Target per file

| File | Spec |
|------|------|
| `assets/hero-01-bloom.mp4` | 720p · 15s · 16:9 · audio |
| `assets/hero-02-particles.mp4` | 720p · 15s · 16:9 · audio |
| `assets/hero-03-glass.mp4` | 720p · 15s · 16:9 · audio |

## Normalize (jika sumber beda)

```bash
ffmpeg -i raw.mp4 -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 -crf 23 -preset slow -c:a aac -b:a 128k -movflags +faststart \
  assets/hero-0X-name.mp4
```

## Poster (frame 0, opsional)

```bash
ffmpeg -ss 00:00:00 -i assets/hero-01-bloom.mp4 -frames:v 1 -q:v 2 assets/hero-poster.jpg
```

## Concat 3 take (opsional, ~45s)

```bash
# files.txt:
# file 'assets/hero-01-bloom.mp4'
# file 'assets/hero-02-particles.mp4'
# file 'assets/hero-03-glass.mp4'
ffmpeg -f concat -safe 0 -i files.txt -c copy assets/hero-ambient-full.mp4
```

Semua shot resolusi + fps sama sebelum `-c copy`.

## Integrasi web (nanti)

- Prefer muted autoplay di browser (policy); audio via user gesture jika perlu
- `playsInline` · poster · `preload="none"` · reduced-motion → poster
- CSS atmosphere di `page.tsx` tetap fallback

## Checklist review

- [ ] 720p · ~15s · 16:9
- [ ] Audio ambient (no vocal)
- [ ] No people / text / icons
- [ ] Mood match LensaDiri (dark + violet bloom)
- [ ] License/provenance: tool, akun, tanggal
