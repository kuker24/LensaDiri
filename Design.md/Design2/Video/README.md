# Design2 Video prompts

Prompt pack untuk Grok (atau generator video setara). Arah: **game-portal gallery** (Design2 MekaVerse) — full-bleed diorama, UI mono di web nanti.

## Alur

1. Buka `prompt1.txt` … `prompt5.txt`
2. Copy blok di bawah `===== COPY PROMPT DI BAWAH INI =====`
3. Paste ke Grok video: **720p · 16:9 · ~15s**
4. Simpan ke `assets/` dengan nama di header file
5. Kalau nama UUID: rename pakai `assets/ORDER.txt` (by mtime)
6. Opsional normalize: `EXPORT.md`
7. Beri path ke agent untuk wire ke landing

## File

| File | Fungsi |
|------|--------|
| `prompt1.txt`–`prompt5.txt` | Paste-ready prompts |
| `PROMPT.md` | Index + web map |
| `EXPORT.md` | ffmpeg + checklist |
| `assets/` | Drop hasil generate |
