# Backlog

## The board

Epics are chunks of user value. Tasks are one screen or one behaviour. **Every task
carries its acceptance — written before the work, not after** — and acceptance is
a statement you can check, not a description of effort.

| Epic | Task | Status |
|---|---|---|
| **E1** Landing | T1 clone · T2.0 assets · T2.0b foundation · T2.1 header · T2.1b mobile nav · T2.2 hero · T2.3 marquee · T2.4 row · T2.5 grid | ✅ built (see below) |
| **E2** Commerce front end | **E2.1** PLP→PDP · **E2.2** getProduct · **E2.3** PDP route · **E2.4** fabric + size · **E2.5** cart · **E2.6** cart surface · **E2.7** checkout handoff | ⬜ next |
| **E3** Brand OS plugin | **E3.1** package the surfaces for Mitsumeru | ⬜ later |

> **How to use this.** Written for whoever picks it up, designer included — the
> method is explained with worked examples in `docs/noi-handover.md`, under *How we
> work*. In short: pick the top unstarted task, read its acceptance, do it, then
> tick each sentence. The line you cannot tick is the next thing to fix.
>
> Use the short form: pick the top unstarted task. Read its acceptance. Do the
> work. Then check the acceptance line by line — not "does it look right", but
> *can I tick each sentence*. If you cannot, it is not done, and the gap is the
> next thing to fix.
>
> E1's tasks keep their original numbers because the commit history refers to them.
> E2 onward are numbered by epic, so a task's number always names its epic.

---

---

## The loop

1. **Acceptance criteria are written first** — before any code.
2. The client/product owner **approves or amends** them.
3. The task is built. **Only that task** — no adjacent fixes, no "while I'm here".
4. It comes back with **evidence**: a screenshot plus measured numbers against the
   captured reference, using `.toolchain/compare-scale.mjs`, `ab-compare.mjs`,
   `measure-speed.mjs`, `t21-evidence.mjs`.
5. The owner **accepts or rejects**. Nothing is committed until accepted.

Two rules that came out of getting this wrong:

- **Batching breaks the lane gate.** A change set touching `src/` *and*
  `site-content/` spans the client sandbox and the Muen lanes, and CI fails it.
  One small task at a time keeps each change set inside a single lane for free.
- **"Matches the reference" is a number, not an opinion.**

---

---

## E1 — Landing rebuilt from the reference

### Target: the REDESIGN, with the reference as the source of geometry

**Superseding note.** The de-Framer port method below (Epic 09) was applied, and
T2.1 was built that way. The client then confirmed the actual target for the
landing is **the redesign mockup (`hero.png`)** — deliberately different from the
template in three ways:

| | Reference (template) | Redesign (target) |
|---|---|---|
| Header | wordmark in the nav at 260px + pills right | **nav only** — pills top-left |
| Hero | paragraph + image strip | **logo + tagline** (+ description) |
| Marquee tiles | 616px (≈2 across) | **~256px (≈5–6 across)** |

So the reference remains the source of truth for **type, palette, geometry
details and motion** (the measured 12px nav pill, the 309 px/s drift, Inter's
metrics), while the **composition** follows the mockup. Where the two disagree,
the mockup wins and the difference is recorded here.

### Method: a CLEAN PORT, not a redesign

Taken from **`~/.kun/hand-me-up/product/epics/09-hand-me-up-deframer-epic.md`** —
the proven de-Framer from pilot #1, which this project should have followed from
the start:

> **Out of scope:** rebuilding the site from scratch (**this is a clean port, not
> a redesign**) … strip Framer classes + runtime — **keep the DOM structure and
> visual output identical** … **Visual regression** at phone/tablet/desktop, **no
> visual drift**. **This is the acceptance bar.**

**What that means concretely, and what I got wrong.** The first pass reinterpreted
the template through the PRD and the brand kit — different default theme,
different type, different layout — and produced a different site. That is a
redesign, and it fails the bar above. Every task in E1 is now a *port*: same
structure, same geometry, same type scale, same motion, populated with Yammaman
content. Where we deliberately differ, it is written down as a decision with its
consequence (see the display face below).

**Acceptance evidence** for every task is a side-by-side against the reference at
**390 / 768 / 1440**, plus measured geometry — `.toolchain/ab-compare.mjs`,
`compare-scale.mjs`, `measure-speed.mjs`.

### Known drift, accepted

| Item | Reference | Ours | Consequence |
|---|---|---|---|
| Display face | **Druk Cond LCG Web Super** 900, licensed | **Bebas Neue** (OFL, self-hosted) — chosen by the client | the giant lockup is the one visibly different thing. Body (Inter) and the serif accent (Bitter) port **exactly** — both are OFL and already self-hosted from the capture, so only this one face drifts |

| Task | Scope | Lane | Status |
|---|---|---|---|
| **T1** | **Clone the site** — capture the reference | — | ✅ done |
| **T2** | **De-Framer to React — one block at a time** | code | in progress |
| T2.0 | Reference assets wired in (art direction) | content | ✅ done |
| T2.0b | **Fidelity foundation** — light-first default + self-hosted fonts | code | ✅ done |
| T2.1 | Header port | code | ✅ done — measured against the reference |
| T2.1b | Header — mobile nav (hamburger + fullscreen modal) | code | built, **held** pending T2.1 |
| T2.2 | Hero | code | not started |
| T2.3 | Marquee | code | not started |
| T2.4 | Section header row (`Gallery / ©2026 / See all`) | code | not started |
| T2.5 | Work grid (numbered, masonry) | code | not started |

#### T2.0b — Fidelity foundation ✅

**Done** 2026-09-13. The two divergences that made everything downstream read as
"a different site".

1. **Default theme is now light.** `theme.constants.ts` (the no-flash script) and
   `useTheme.ts` both default a first visit to light instead of following the OS.
   The reference is light-first — one flat light band the whole page — so
   deferring to a dark OS showed every first-time visitor a design that never
   existed. An explicit toggle still wins.
2. **Fonts self-hosted** in `public/assets/fonts/` (14 woff2, 692 KB) with
   `src/styles/fonts.css`:

   | Family | Role | Drift |
   |---|---|---|
   | **Inter** 400/500/600/700 | body, nav, labels — the reference's own face | **none** (OFL, same upstream family) |
   | **Bitter** 600/900 | the reference's one serif quote | **none** (OFL) |
   | **Bebas Neue** 400 | display — substitutes **Druk Cond LCG Super 900** | **accepted** (client's choice; single weight, so the lockup is lighter than Druk) |

   Latin + latin-ext subsets only; no runtime dependency on fonts.googleapis.com,
   which would be the same lock-in this port exists to remove.

Evidence: `ab-compare.mjs 1440` — canvas light on both sides, content column
1340 = 1340. What remains different is **layout**, not foundation.

#### T2.1 — Header port ✅

**Done** 2026-09-13. Ported, not reinterpreted: the reference's structure with
Yammaman's content. Geometry taken from the live reference at 1440 and 1728.

| Measured | Reference @1440 | Ours | |
|---|---|---|---|
| wordmark x / y | 50 / 16 | 50 / 16 | ✅ |
| wordmark size | 260px | 260px | ✅ (Druk → Bebas Neue, the accepted drift) |
| wordmark box | 720×260 | 913×260 | height ✅, **width +27%** — Bebas Neue is wider than Druk at the same size |
| nav top | 209 | 209 | ✅ |
| nav right edge | 1390 | 1390 | ✅ |
| nav label size | 12px | 12px | ✅ |
| nav pill height | 27 | 28 | 1px |
| header band height | 276 | 276 | ✅ |

Two structural details worth keeping, because a centre-aligned row gets both
wrong: the pills sit in the wordmark's **lower third** (y=209 of a 16–276 band),
and our own controls (tenant switch, theme toggle, hamburger) go **under** the
pills rather than beside them — the reference leaves that band empty (its
"Hire me" does not appear until y=361), so adding them there displaces nothing
measured. Beside the pills, they would push every pill left by their width.

**Not ported, agreed with the client:** the "Available" status badge and the live
clock. Both are freelance-photographer chrome signalling availability.

Remaining drift below the header is **not** header drift — the hero, grids and
closing band are still ours, and are T2.2–T2.5.

### T1 — Clone the site ✅

**Done** 2026-09-13. `targets/gallary/` — the Sasha Grey template captured at
1728px by `clone-site` (settle → capture → build → measure → visual → strict →
report). Source of truth for every fidelity claim below.

Artifacts: `receipts.md` (gate table + hashes), `REPAIRS.md` (the two defects
found and fixed in the clone builder), `measure-live.json` (685 painted leaves),
`dom.html`, `live.png`.

Open items, recorded honestly rather than papered over:

- **The clone is only valid at its capture width.** It is a 1728px snapshot; its
  absolutely-positioned nav does not recompute at 390 the way the live page's JS
  does. Measuring the clone at 390 reports links at x=393–753 that exist only in
  the snapshot. This was an actual mistake made here — the first version of the
  `responsive-nav` skill claimed the reference had no mobile nav at all, based on
  clone measurements. **Responsive behaviour must be measured on the live url.**
- The reference **animates**, so the visual gate cannot reach zero: two captures
  of the live page 3s apart differ by **5.34%**, more than the gate's own 2%
  tolerance. The clone sits at ~1.1–1.6% and the number moves between runs.
- `strict` currently fails because it re-measures the **live** page fresh while
  the clone is frozen at one instant. That is a pipeline inconsistency for
  animated content, not a layout fault — every measured box matches.

### T2 — De-Framer to React, one block at a time

Rebuild the reference as owned React/Vite components on the project's tokens.
Per `reference-rebuild` (`~/.kun/mitsu/skills/`): **the clone is reference
material and is never shipped**; the rebuild is the deliverable, and the
zero-reference gate (no `framer-*`, no `framerusercontent`, no generated bundle)
applies to it.

#### T2.0 — Reference assets wired in ✅

**Done** 2026-09-13, at the client's direction: the rebuild uses the reference's
own photography so the **art direction is carried by the build** rather than
described in a document.

- 25 assets copied to `public/assets/reference/`, **renamed by ratio cluster**
  (`ref-4x5-01`, `ref-2x3-03`, …) because the ratio is the decision a replacement
  image has to match. `manifest.json` keeps the original → new mapping.
- The marquee now uses them (8 items). The strip crops portrait sources to a
  **5:4 landscape** tile, which is what the reference does.
- **Licensing: the client confirms these are licensed to them** (2026-09-13), so
  they are treated as ordinary imagery — no gitignore, no deploy guard. Recorded
  here and in the manifest because the opposite assumption would have been the
  safe default.

Art-direction facts measured from the set, kept here because the spec document
was deferred by choice:

| | |
|---|---|
| Ratios | **all portrait** — 4:5 ×7, 3:4 ×5, 2:3 ×5, 1:2 ×5, plus 3 odd |
| Crop — marquee | portrait source **cropped to 5:4 landscape** (`object-fit: cover`) |
| Crop — grid | **preserves source ratio** → variable card heights (masonry), not a uniform grid |
| Palette | photographic bands sat 0.31–0.35, hero band lightness 0.49; deep black fills ~19% of the hero band |
| Register | saturated subject against a neutral ground; colour lives in the images, never in the UI |

Still on the fixture, not on these assets: the **product grid** and **fabric
catalog** render data-URL colour swatches from `src/commerce/fixture.ts` (a
throwaway stand-in for the commerce engine). Pointing those at reference
photography is a separate call.

#### T2.1 — Header

**Built, awaiting acceptance.** Approved criteria as written:

| # | Criterion | Evidence |
|---|---|---|
| 1 | Nav items render as pills — 1px hairline, full radius — sized against the reference's 91×27px | **1px solid**, full radius ✅ · box **70×28px** vs 27px — **1px over**, see note |
| 2 | Labels read Home, Shop, About, Help, in that order | `Home · Shop · About · Help` ✅ (order via `navOrder` in `tenants/tenants.json`) |
| 3 | Header is not sticky | `position: static` ✅ |
| 4 | Theme and tenant controls remain reachable | HARAPPA link + theme toggle present ✅ |
| 5 | Evidence at 1728 and 390, light and dark; gates green | `.tmp/screens/t21-header-{1728,390}-{light,dark}.png` ✅ · content, tokens-only, contrast, storybook-contract, typecheck all green · 50 tests · build clean |

Note on criterion 1: the pill measures **28px**, one pixel over the reference's
27. Hitting 27 exactly needs a sub-4px vertical padding, which is not a standard
spacing step — so it needs either a named token or accepting the 1px. Flagged
rather than fudged. Width is not comparable: ours is measured on "Home" (4
characters), the reference's 91px is its "Gallery" (7).

Out of scope for T2.1, deliberately:

- **The wordmark.** The reference sets its 260px wordmark *inside the nav*; the
  annotated markup shows pills only with the mark in the hero. Undecided, so the
  scaffold's wordmark is untouched rather than guessed at.
- **Mobile nav.** The scaffold hides the nav below `md` with no replacement, so
  at 390 there is no navigation at all. Pre-existing, out of T2.1's scope, but it
  is a real gap and the 390 evidence shows it.

#### T2.1b — Header: mobile nav (hamburger + fullscreen modal)

**Built, awaiting acceptance.** Requested directly: the reference has no
small-screen nav pattern, so the header needs a hamburger opening a fullscreen
modal menu. Encoded as the craft skill `responsive-nav`.

| # | Criterion | Evidence |
|---|---|---|
| 1 | Trigger visible at phone width, labelled, announces state | `aria-label="Menu"`, `aria-expanded` false→true ✅ |
| 2 | Panel is a labelled modal | `role="dialog"`, `aria-modal="true"`, `aria-label` ✅ |
| 3 | Focus moves into the panel on open | ✅ |
| 4 | Tab is trapped inside the panel | 12 Tab presses, focus never escaped ✅ |
| 5 | Escape closes; focus returns to the trigger | ✅ |
| 6 | Document scroll locks while open, previous value restored | ✅ |
| 7 | Links are real links, and the inline nav shares the same breakpoint | `NavLink`, both governed by `md` ✅ |
| 8 | Tokens only; gates green | tokens-only, contrast, storybook-contract, typecheck ✅ · 50 tests · lint clean |
| 9 | Evidence at 390, closed and open | `.tmp/screens/t21b-mobile-{closed,open}.png` · **15/15 contract checks** (`.toolchain/t21b-mobile-evidence.mjs`) |

Craft skill: `~/.kun/mitsu/skills/responsive-nav` (+ the loaded copy in
`~/.agents/skills/`), with `scripts/audit-nav.mjs` to audit any reference for the
same gap.

#### T2.2 – T2.5

Not started. No criteria written yet.

---

## E2 — Commerce front end (PLP · PDP · cart · checkout)

Built against `CommerceClient`, with the fixture satisfying it. The engine contract
is `docs/engine-contract.md`; these tasks assume it and do not wait on it.

**Acceptance for the whole epic:** a visitor can browse a listing, open a product,
choose a fabric and size, put it in a cart, and hand off to checkout — and every
step works with the fixture, so the swap to the live engine touches one file.

#### E2.1 — PLP links to PDP
`ProductGrid` renders cards that link nowhere: the grid is a dead end. Each card
becomes a link to its product, with a visible focus state and the whole card as
the target.

**Acceptance:** clicking any card on `/collection` opens that product. Tab reaches
every card in order, Enter opens it, and Back returns to the same scroll position.

#### E2.2 — `getProduct` on the interface
**Acceptance:** the method exists on `CommerceClient`, the fixture implements it,
and an unknown id returns `undefined` rather than throwing — a bad URL is a 404,
not a crash.

#### E2.3 — PDP route and block
**Acceptance:** `/product/:productId` renders name, image, price and availability
from the client. A deep link works on first load, not only via client navigation.
An unknown id renders the 404 page.

#### E2.4 — Fabric and size selection
**Depends on engine decision 3.** Until it is answered, the selector renders from
the fixture's fabrics.

**Acceptance:** only valid combinations are selectable. An unavailable fabric shows
as made-to-order rather than as sold out (FR-2). The chosen combination is what
reaches the cart.

#### E2.5 — Cart provider
**Acceptance:** adding to the cart survives navigation and reload. Totals come from
the client, never computed in the component — a storefront that does arithmetic on
money will eventually disagree with the invoice.

#### E2.6 — Cart surface
**Acceptance:** quantities are editable, removal works, and an empty cart is a
state rather than a blank page.

#### E2.7 — Checkout handoff
**Depends on engine decision 1.** If checkout is hosted, this is a button and a
redirect; if embedded, it is a form.

**Acceptance:** the handoff passes a server-created session identifier. No card
data touches our code, and no total is computed on the client.

---

---

## E3 — Brand OS surfaces as a Mitsumeru plugin

Last, and deliberately so: it packages what E1–E2 produce rather than adding new
surface area.

**Acceptance:** the brand's surfaces install into Mitsumeru as a plugin
(`yammaman-brand-plugin/` is the scaffold for it), and the confidential-document
rule still holds — nothing client-confidential ships inside the package.

---

---

---
