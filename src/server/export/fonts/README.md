# PDF export fonts

Bundled **Plus Jakarta Sans** (Regular 400, Medium 500) for server-side `@react-pdf/renderer`.

- Family: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) (SIL Open Font License 1.1)
- Source: Google Fonts static TTF (latin)
- Post-process: OpenType `GSUB` / `GPOS` / `GDEF` stripped so `@react-pdf` does not substitute `fi`/`fl` ligatures that are missing from the subset (which would render as broken “ref l eksi” / “Prof il”).

Do not reintroduce subset files with active ligature GSUB unless ligature glyphs are fully present.
