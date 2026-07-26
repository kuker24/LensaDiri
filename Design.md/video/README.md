# Hero ambient video — LensaDiri

Brief + masters + export notes. Web-shipped asset: `public/media/`.

Canonical product rules: root `DESIGN.md` § Media.

## Spec generate (masters)

| Item | Nilai |
|------|--------|
| Durasi | 15s per take |
| Aspect | 16:9 |
| Resolusi | 720p |
| Audio master | ambient (no vocal) |
| Takes | 3 → `assets/hero-01..03` |

## Spec web (shipped)

| Item | Nilai |
|------|--------|
| File | `public/media/hero-ambient.mp4` |
| Source take | Prompt 1 bloom (muted re-encode) |
| Size | ~302 KB |
| Poster | `public/media/hero-poster.jpg` |
| Playback | muted · loop · autoplay · playsInline |
| Reduced motion | poster only (`globals.css`) |
| Component | `src/components/hero-ambient.tsx` |

## File map

| Path | Role |
|------|------|
| `prompt1.txt` … `prompt3.txt` | copy-paste generate |
| `PROMPT.md` / `REFERENCES.md` / `EXPORT.md` | brief |
| `assets/hero-01-bloom.mp4` | master + audio |
| `assets/hero-02-particles.mp4` | master + audio |
| `assets/hero-03-glass.mp4` | master + audio |
| `assets/ORDER.txt` | mtime → prompt mapping |
| `../../public/media/*` | production hero |

## Status

- [x] Prompt 1 / 2 / 3
- [x] Generate 3 masters
- [x] Export muted web MP4 + poster
- [x] Wire landing hero
- [x] Lint + typecheck clean
