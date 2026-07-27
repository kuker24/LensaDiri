# Frontend MCP setup — LensaDiri

**Tanggal:** 2026-07-27  
**Skill:** `frontend-mcp-setup`  
**Prinsip:** stack **minimal + relevan** (bukan pasang semua MCP)

---

## Profil project (kenapa stack ini)

| Sinyal LensaDiri | Implikasi MCP |
|------------------|---------------|
| Landing cinematic monokrom + Soft Product | Perlu polish visual, **bukan** WebGL/efek kasual berlebihan |
| Flow asesmen, form, result, dashboard | Butuh motion state & komponen UI terkurasi |
| UI custom Design2 (bukan full shadcn default) | shadcn MCP + registry; **jangan** rewrite brand tokens sembarangan |
| Playwright e2e sudah ada | Playwright MCP berguna untuk QA visual agent |
| Backend/AI narrative frozen | **Tidak** butuh Higgsfield / media AI MCP |
| Bukan Kanban/Gantt/editor-heavy SaaS | **Skip** Kibo UI |
| Tidak ada API key 21st.dev | **Skip** 21st.dev Magic MCP |

---

## Stack terpilih (terbaik untuk LensaDiri)

### Wajib / dipasang

| Item | Jenis | Alasan |
|------|--------|--------|
| **shadcn MCP** | MCP server | Fondasi: search/add komponen; gateway registry Animate + Aceternity |
| **Animate UI** | Registry `@animate-ui` | Transisi state halus (dialog, tabs, form feedback) cocok task UI |
| **Aceternity UI** | Registry `@aceternity` | Hero/section landing premium; pakai **selektif** (tetap monokrom Soft Product) |
| **Magic UI MCP** | MCP server | Animasi landing ringan (marquee, blur fade, text) tanpa setup registry ekstra |
| **Playwright MCP** | MCP server | Screenshot, flow browser, a11y check selaras suite e2e |

### Tidak dipasang (sengaja)

| Item | Alasan |
|------|--------|
| Kibo UI | Komponen app-kompleks tidak dibutuhkan sekarang |
| React Bits | WebGL/cursor experimental — bentrok rasa calm Design2 |
| 21st.dev Magic | Butuh API key; overlap Magic UI + shadcn |
| Higgsfield AI | Eksperimental komunitas; media AI di luar scope produk |

---

## File yang dipasang di repo

| Path | Isi |
|------|-----|
| `components.json` | Alias + registry `@animate-ui` + `@aceternity` |
| `src/lib/utils.ts` | Bridge `cn` untuk CLI shadcn |
| `.grok/config.toml` | MCP project-scoped (Grok Build) |
| `.mcp.json` | Lokal (gitignored) — Claude/Cursor-compatible |
| `.mcp.example.json` | Template tim tanpa secret |
| `.pi/FRONTEND_MCP_SETUP_2026-07-27.md` | Dokumen ini |

---

## Cara memakai

### Grok Build

1. Buka project LensaDiri (config project `.grok/config.toml` ter-load).
2. **Folder trust (ketat — sudah di-setup 2026-07-27):**
   - `~/.grok/config.toml` → `[folder_trust] enabled = true`
   - `~/.grok/trusted_folders.toml` → path absolut LensaDiri dengan `trusted = true`
   - Verifikasi: `grok mcp doctor` harus **3 healthy**
   - Kalau pindah path/clone baru: `/hooks-trust` atau `grok --trust`, atau tambah entri map di `trusted_folders.toml`
3. Server juga ada di **user scope** (fallback).
4. `/mcps` → pastikan `shadcn`, `magicui`, `playwright` enabled; refresh `r` bila perlu.
5. Contoh prompt: “cari komponen marquee dari Magic UI” / “list card @aceternity” / “screenshot /start via Playwright MCP”.

### CLI shadcn (setelah MCP atau manual)

```bash
# Cari / list registry
npx shadcn@latest search @animate-ui -q "button"
npx shadcn@latest list @aceternity

# Tambah selektif (adapt ke token Soft Product setelah generate)
npx shadcn@latest add @animate-ui/<name>
npx shadcn@latest add @aceternity/<name>
```

### Guardrails produk

- Pertahankan monokrom Soft Product (void/bone/charcoal/frost/ash).
- Jangan ganti scoring, API, privacy DTO, atau AI narrative.
- Komponen registry sering bawa Framer Motion / warna default — **re-theme** sebelum merge.
- Jangan overwrite `src/components/ui/button.tsx` dsb tanpa diff sadar (file UI produk sudah custom).

---

## Browser untuk Playwright MCP

Google Chrome system (`/opt/google/chrome`) **tidak** terpasang (butuh root). Solusi user-local:

```bash
# Playwright Chromium (Chrome for Testing) — sudah di-cache
npx playwright install chromium

# Symlink stabil
ln -sfn "$(find ~/.cache/ms-playwright -path '*/chrome-linux64/chrome' | sort -V | tail -1)" \
  ~/.local/bin/playwright-chrome

# MCP args (project + user config):
# npx -y @playwright/mcp@latest --executable-path ~/.local/bin/playwright-chrome --headless
```

Screenshot evidence polish: `.pi/screenshots/` (home/start/login/modules).

## Verifikasi instalasi

```bash
# Trust ON + folder trusted
grep -A1 '\[folder_trust\]' ~/.grok/config.toml   # enabled = true
cat ~/.grok/trusted_folders.toml                   # path LensaDiri trusted = true

~/.local/bin/playwright-chrome --version           # Google Chrome for Testing …

grok mcp list
# expect: shadcn, magicui, playwright (project)

grok mcp doctor
# expect: Found 3 healthy, 0 failing

test -f components.json && test -f .grok/config.toml && echo ok
```

### Format `trusted_folders.toml` (referensi)

```toml
[folders]
"/absolute/path/to/LensaDiri" = { decided_at = 1785152865, trusted = true }
```

`decided_at` = unix timestamp (detik). Jangan pakai array `[[folders]]` — Grok mengharapkan **map**.