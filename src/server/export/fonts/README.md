# PDF export fonts

Bundled **Poly** (Regular 400, Italic 400) for server-side `@react-pdf/renderer`.

- Family: [Poly](https://fonts.google.com/specimen/Poly) (SIL Open Font License 1.1)
- Source: Google Fonts static TTF (`fonts.gstatic.com/s/poly/v18`), latin + latin-ext
- Post-process: OpenType `GSUB` / `GPOS` / `GDEF` stripped so `@react-pdf` does not substitute `fi`/`fl` ligatures that are missing from the subset (which would render as broken “ref l eksi” / “Prof il”).

Poly ships **only weight 400**. There is no Medium/Bold face, so the PDF
stylesheet must not register or request `fontWeight: 500` or higher — emphasis
comes from size, colour, and letter spacing. This matches the web surface, which
uses the same single-weight family.

Do not reintroduce subset files with active ligature GSUB unless ligature glyphs
are fully present.
