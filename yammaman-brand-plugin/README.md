# @muen/dsh-brand-yammaman

Yammaman brand package for the Mitsumeru fork of DSH. Replaces the Mitsumeru
wordmark + cyan dot with the Yammaman logo in all three DSH brand seats.

## Why a separate package instead of editing Mitsumeru

The brand seats are **exclusive** — the fork's patch says two occupants cannot
share either seat. So a brand is a *configuration choice*, not a patch: exactly
one brand package appears in a profile's `dsh.profile.bundles` list.

Keeping this as its own package means:

- the read-only DMG's `@muen/dsh-brand-mitsumeru` is never touched;
- reverting is a one-line change to the bundles list;
- the next client brand is a copy of this directory.

## Seats filled

| Seat | Component | Rendering |
|---|---|---|
| `sidebar.brand.name` | `BrandName` | full lockup, `max-height: 26px`, width auto |
| `sidebar.brand.mark` | `BrandMark` | full lockup, contained in a 24×24 box |
| `conversation.hero.brand.mark` | `HeroMark` | full lockup, contained in a 34×34 box |

## Theme switch

The logo is a single flat colour, so a dark-theme variant is required or it
vanishes against the dark sidebar:

| Theme | File | Fill |
|---|---|---|
| light | `src/yammaman-logo-light.svg` | `#140000` (ink) |
| dark | `src/yammaman-logo-dark.svg` | `#FFFFFF` (white) |

Switching is driven by `body[data-ds-dark-theme]` — the **active theme**, not the
OS appearance — matching how Mitsumeru does it.

> **Gotcha handled here:** the first `<polygon>` in the source SVG carries no
> `fill` and no class, so it silently defaults to *black* regardless of the
> `.cls-1` rule. Both generated variants add an explicit `fill` to it. Recolor
> the source without that and one glyph stays black on the dark theme.

## The logo is a wordmark, not a monogram

Geometry from `yammamanlogo.svg` (`viewBox="0 0 1745.24 1296"`): eight glyphs
spelling **YAMMAMAN**, laid out from x≈78 to x≈1745. The first glyph ("Y",
x 78–468) **overlaps the first "A"** (x≈312–637), so cropping a clean square
monogram out of this file is not safe.

Consequence: the compressed mark seats letterbox the *whole* lockup. At 24×24 it
renders ≈24×17.8px, which is tight for eight letters. If the collapsed sidebar
looks mushy, export a dedicated square monogram from `YAMMAMAN LOGO-5.ai` and
swap it into `BrandMark` only.

## Install into a profile

```sh
P="$HOME/Library/Application Support/Mitsumeru/mitsu-dsh/profiles/mitsu"
cp -R yammaman-brand-plugin "$P/node_modules/@muen/dsh-brand-yammaman"
```

Then swap the entry in `$P/package.json`:

```diff
   "bundles": [
     "@deepseek-ai/dsh-base",
     "@deepseek-ai/dsh-web-app",
-    "@muen/dsh-brand-mitsumeru",
+    "@muen/dsh-brand-yammaman",
     "@muen/dsh-eva-theme"
   ],
```

Leave the `dsh-brand-mitsumeru` symlink in `node_modules/@muen/` in place — with
the package out of `bundles` its patch never mounts, and keeping it makes the
revert a one-line edit back.

Restart the app. Client-plugin changes are only picked up on a rebuild; the HMR
receiver requires `pnpm run dev:web` running against the same checkout, which a
packaged install does not have.

## Regenerate the embedded base64

`lib/client.js` embeds both SVGs as base64 data URIs. After editing either SVG,
regenerate rather than hand-editing the blobs:

```sh
cd yammaman-brand-plugin
LIGHT_B64=$(base64 -i src/yammaman-logo-light.svg | tr -d '\n')
DARK_B64=$(base64 -i src/yammaman-logo-dark.svg | tr -d '\n')
# then substitute both back into lib/client.js
```

Verify the dark variant contains no stray black:

```sh
grep -o 'fill="[^"]*"' src/yammaman-logo-dark.svg | sort -u   # expect #FFFFFF only
```

## Provenance

- Source: `yammamanlogo.svg` (Noi Yamasaki / Yammaman)
- Structure copied from `@muen/dsh-brand-mitsumeru` v0.0.1
- Targets `@deepseek-ai/dsh@0.1.5-rc.1`, Mitsumeru `0.1.8-dev`
