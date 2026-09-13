# Design

How the Yammaman surface is built and what may be changed without a design
review. Written for whoever picks this up next — including a future client
account, which is why the rules below are stated as rules rather than taste.

## Where design lives

| Layer | File | Who owns it |
|---|---|---|
| Brand primitives | `src/styles/brand-kit.css` | Muen — `--yy-*` values only |
| EVA aliases | `src/styles/eva.css` | Upstream, do not edit |
| Semantic tokens | `src/styles/index.css` `@theme` | Muen — `--color-*`, `--text-*`, `--spacing-*` |
| Utilities / variants | `src/styles/index.css` | Muen |

**Components never hold raw values.** Every colour, size, space and ratio comes
from a token. `npm run gate:no-ad-hoc-values` enforces it, and it scans comments
too — writing an example of a banned pattern in a comment trips it.

## Button & link variants

| Variant | Used by | Treatment |
|---|---|---|
| `link/underline-sweep` | hero CTA, header Sign in | Accent text, **no background**, rule sweeps in on hover |
| `pill/nav` | header nav | Hairline border, full radius, 20px tall, active state filled text |
| `link/text` | header yamma.jp / harappaaizu.com | Accent at 11px, `text-decoration` underline on hover |

### `link/underline-sweep`

The CTA variant. **A label in the display face with a rule that sweeps in from
the left.** No background, at rest or on hover.

```html
<a class="link-sweep display-lockup text-accent inline-flex">Shop Yammaman</a>
```

| | |
|---|---|
| Face | `display-lockup` — Bebas Neue, uppercase, tight leading |
| Colour | `--color-accent` (indigo-600). Set by the caller, not the variant |
| Rule | 2px, `currentColor`, `inset-inline: 0`, `bottom: -2px` |
| Rule motion | `transform: scaleX(0 → 1)`, `transform-origin: left`, 0.35s `--ease-fold` |
| States | rest: no rule · hover **and `:focus-visible`**: rule drawn |
| Reduced motion | rule appears with no travel (`transition: none`) |

**Why no background fill.** An earlier version wiped a filled block in on hover,
which forced the brand blue to be lightened from `indigo-600` to `indigo-500`
because a fill covering the whole label reads as a slab. That was a symptom: the
fill was spending contrast budget it did not need. A rule signals the same
"interactive here" and leaves the accent at full strength.

**`display` is not in the variant.** Callers supply `inline-flex`. Sign in needs
`hidden sm:inline-flex` for responsive visibility, and a hard `display` in the
utility would fight it.

**Focus is not a weaker state.** `:focus-visible` gets the same rule as hover. A
keyboard user should not receive a quieter affordance than a mouse user.

**Do not** add a background, a border, or a colour change on hover to this
variant. If a stronger button is needed, it is a new variant with its own entry
here — not this one modified, because both the hero CTA and Sign in inherit the
change.

## Type

Display face is **Bebas Neue**, substituting Druk Cond LCG Super (licensed). It
is the one accepted drift from the reference. Text face is **Inter**, which is
the reference's own face and is metrically exact.

The ladder is `--text-2xs` 11px → `--text-micro` 14px → `--text-body` 16px →
`--text-heading` 32px → `--text-display` 120px / `-lg` 180px / `-xl` 260px.
Off-ladder sizes are added as tokens, never inlined.

Mixing the display face with a text face at small sizes: **Bebas at 12px does not
read as 12px next to Inter at 12px.** It is condensed, so its caps are taller but
much narrower. Size the two for optical match, not numeric match.

## Motion

| Token | Value | Used by |
|---|---|---|
| `--ease-entrance` | `cubic-bezier(0.22, 1, 0.36, 1)` | calm ease-out, appear |
| `--ease-fold` | `cubic-bezier(0.65, 0, 0.35, 1)` | symmetrical, block reveals and sweeps |
| `--ease-marquee` | `cubic-bezier(0.75, 0, 0.25, 1)` | the strip's swipe |
| `--duration-fold` | `0.9s` | block entrance |

Every animation settles under `prefers-reduced-motion: reduce` **in CSS**, not in
a script. Clamping a duration is not enough: an element that starts hidden still
starts hidden, and only becomes visible when JS runs.

## Colour

**Indigo is the accent, and it is not decoration.** Aizu Momen is an indigo-dyed
cotton — `brand-kit.css` says so — so the accent is the product.

| Token | Value | Use |
|---|---|---|
| `--color-accent` | `--yy-indigo-600` | links, CTA label |
| `--color-ink` | `--yy-ink-900` | primary text |
| `--color-line-mid` | `--dsw-alias-border-l2` | the doubled hairline (ink 22%) |
| `--color-line-strong` | `--dsw-alias-border-l3` | control borders |

Both themes must clear WCAG AA. `npm run gate:contrast` checks every pair in
both. **Do not add a colour to one theme only** — the alias layer is re-pointed
once under a selector matching both, so a primitive that flips is enough; a
genuinely different dark value needs its own documented line.

## Spacing and geometry

`--spacing-section` 50px / `-lg` 100px, `--spacing-frame` 378px (the marquee
pitch: 362 frame + 16 gap), `--container-page` 85.75rem. The page margin is
`page-gutter`, 24px rising to 40px at 64rem.

## Before changing anything here

```sh
source .toolchain/local-env.sh
npx --yes pnpm@10.34.5 run gate     # tokens, contrast, schema, stories, types
npx --yes pnpm@10.34.5 run test
```

A change that alters a variant's states or adds one should update this file in
the same commit. The doc is only useful if it is true.
