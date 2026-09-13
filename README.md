# Yammaman — website

The YAMMA + HARAPPA storefront. React on the EVA design system with the Yammaman
brand kit, content-as-data, two isolated tenant surfaces.

**Status:** scaffold. The structure, the token layer, the content model and the
gates are real and runnable. Copy is placeholder, the commerce engine is a
fixture, and the vendor choices in `tech-stack.md` are still **tentative pending
the dev-team audit**.

→ **New here? Read [`SETUP.md`](SETUP.md).** On this machine, source
`scripts/env.sh` before anything else.

```sh
source scripts/env.sh
pnpm run dev        # /      → YAMMA     /mill → HARAPPA
pnpm run storybook  # the visual contract
pnpm run gate       # every check, before a PR
```

---

## The stack, as built

Mapped against `tech-stack.md`'s function list. "Decided at" is where each
unresolved choice gets made.

| Function | In this repo | Status |
|---|---|---|
| Client runtime | **Mitsumeru fork** — `yammaman-brand-plugin/` | Built; see the note below |
| Storefront / UI | React 19 + Vite 7 + TypeScript, Tailwind v4 | Done |
| Design system | EVA, vendored and generated into CSS | Done |
| Brand kit | `src/styles/brand-kit.css` | Done |
| Visual contract | Storybook 9, 10 block types, 20 stories | Done |
| Content | `site-content/*.json` + JSON Schema + gates | Done |
| Multitenancy | `tenants/tenants.json`, 2 surfaces, isolated | Done |
| Code / review / CI | GitHub Actions, 5 custom gates | Done |
| Hosting | `vercel.json` (staging + production) | Config ready; **Vercel not connected**. Staying on the free **Hobby** tier — see `SETUP.md` for the scope caveat and the upgrade triggers |
| Database | Prisma schema for operational data | Schema done; **Neon not provisioned** |
| Image hosting | `src/media/cloudinary.ts` + `<Media>` | **Delivery wired** (cloud `yqalfmuf`), no SDK, presets in code. **Upload not built** — server-only |
| Commerce engine | `src/commerce/` interface + fixture | **Blocked on Pratap's API rundown** |
| Payments · shipping · email · notifications · diffusion · AI LLM | — | **Not started** — see `docs/environment.md` |

### What is NOT wired, and why

Nothing here is stubbed to look finished. The deliberate gaps:

- **Commerce engine** — `src/commerce/client.ts` defines the interface and
  `fixture.ts` satisfies it. Endpoint shapes and the CMS-vs-OMS auth split are
  open items, so writing `fetch` calls against guessed endpoints would produce
  code that looks done and is wrong. Swapping in the real client is one file.
- **Contact form** — renders, but the submit button is **disabled** with a
  visible explanation. A form that appears to accept a message it cannot deliver
  is the worst failure mode on a storefront.
- **Payments, shipping labels, email, image hosting, chat notifications,
  diffusion** — not started. Each is an integration behind a `tech-stack.md`
  function that is decided at Meeting 02 or the Meeting 04 spike.

---

## Layout

```
site-content/            the CLIENT's half — JSON documents, one dir per tenant
  yammaman-brand/
  yammaman-textile-mill/
content/schema/          JSON Schemas: what content may say
tenants/tenants.json     the tenant registry: surfaces, paths, content dirs

src/
  content/               loader + types (content-as-data at runtime)
  tenant/                registry access + path→tenant resolution
  blocks/                the pattern library: 10 block components + registry
  components/            shared chrome (header, footer, section, container)
  styles/                eva.css (generated) · brand-kit.css · index.css
  commerce/              the engine seam: interface + fixture
  theme/                 active-theme attribute + no-flash script
  pages/                 the one component that renders any page

scripts/                 gates + env.sh + bootstrap-toolchain.sh
design-system/eva/       vendored upstream EVA tokens (MIT)
prisma/schema.prisma     operational data
docs/                    environment & secrets

.github/workflows/ci.yml the gate pipeline
```

---

## The five gates

Every one of these is a script in `scripts/`, and every one has been verified to
**fail** on the thing it is meant to catch. A gate that cannot fail is
decoration.

### 1. Lane gate — the client sandbox

`check-lane.mjs` classifies every changed file as **client content** or **Muen**
(design / functionality / infra). A change set spanning both fails: `tech-stack.md`
promises client accounts are sandboxed to content changes, and a promise enforced
only by convention is not enforced.

Spans are sometimes legitimate — adding a block type touches the schema, the
component, the story and the content. That needs Muen review, so it needs the
`lane:muen-approved` label, applied by a **reviewer**, not the author.

### 2. Tokens-only

`check-no-ad-hoc-values.mjs` forbids raw colour literals and arbitrary Tailwind
values (`text-[13px]`, `bg-[#fff]`) outside the token layer. Both rules are
needed: the second alone misses inline styles and SVG attributes.

Raw values have to live *somewhere*, so there is an allowlist — five entries,
each with a written reason. A component quietly acquiring a hex is what this
prevents.

### 3. Contrast

`check-contrast.mjs` resolves the **real token graph** for both themes —
`--dsw-alias-*` → `var(--yy-*)` → hex, including nested
`color-mix(in srgb, …)` — then checks 15 pairs at WCAG AA.

It is not a lint rule because contrast is a property of a *pair* of tokens after
the cascade, not of a file. A colour can pass on the page background and fail
badly on the inverted band.

**This gate found a real bug on first run:** the brand kit re-pointed
`--dsw-alias-brand-primary` for light but not for dark, so EVA's purple
(`#9a4fdb`) shipped as the Yammaman button colour in dark mode at 4.38:1. The fix
was structural — the aliases are now stated once under a selector list matching
both themes — so the whole class of "forgot to re-point in dark" bugs is gone
rather than that one instance.

### 4. Storybook contract

`check-storybook-contract.mjs` cross-checks three lists that must agree:

| List | File |
|---|---|
| what content may **say** | `content/schema/page.schema.json` |
| what code can **render** | `src/blocks/registry.ts` |
| what a human has **looked at** | `src/blocks/*.stories.tsx` |

Any two agreeing is not enough, and each pairwise failure is a different real
bug: a block the client can author but nobody has seen rendered; content that
validates then renders "Unknown block type" on production; a component that
content can never reach.

### 5. Content

`validate-content.mjs` does ajv schema validation **plus** the cross-document
rules a per-document schema cannot see: `tenantId` matches directory, path inside
the tenant's `basePath`, no two pages claiming a URL, unique block ids, **every
internal link resolves to a real page**, and the first block is a `hero` (so the
page has an `<h1>`).

---

## Two design decisions worth knowing

### The token layer has three tiers, and only one is editable

```
EVA static primitives  →  EVA alias semantics  →  brand kit re-points aliases
   (generated)                (generated)              (hand-written)
```

`eva.css` is **generated** from vendored upstream JSON by `scripts/gen-eva-tokens.mjs`.
Copying ~360 tokens by hand guarantees drift; CI runs
`gen-eva-tokens.mjs --check` and fails if the committed CSS is stale. Upgrading
EVA is: drop in the new JSON, re-run, review the diff.

A brand kit may only re-point *existing* alias names. Inventing a `--dsw-*` name
means a component is asking EVA for something EVA does not model.

### Tenant isolation is enforced at the seam, not by convention

`loadPage(tenant, pageId)` takes the tenant as a **required** argument and
refuses a cross-tenant read. Path→tenant resolution is longest-prefix, so the
brand surface owning `/` cannot swallow `/mill`.

`pageId` may repeat across tenants (both surfaces have a `story`) — that is why
the tenant is required rather than inferred. Paths, by contrast, are globally
unique, because routing is by path alone.

---

## Note on `yammaman-brand-plugin/`

This directory is **not part of the application build**. It is a DSH brand
package that runs inside the Mitsumeru fork: it has its own `package.json`,
declares its own `dsh` bundle patch, and uses browser globals from the harness
host. It is installed into a DSH profile by copying it into
`node_modules/@muen/dsh-brand-yammaman`, not by importing it from `src/`.

It is therefore excluded from ESLint, from `tsconfig.app.json`, and from the Vite
build. Its own contract is documented in `yammaman-brand-plugin/README.md`.

**Decision: it lives in this repository permanently**, as the home for both the
storefront and the Yammaman brand package. That is a deliberate deviation from
`tech-stack.md`, which scopes the fork and the plugin push to
`muen-collective/mitsumeru`. The practical consequence to keep in mind:

> `tech-stack.md` says the tenant's plugin set is pushed to local DSH installs
> from a YAML config (`tenant-plugins.yaml` — pinned versions + installs per
> tenant). If that push reads from the fork's repo, then this package being here
> means the push needs to reference this repo, or the package needs publishing to
> a registry the fork can resolve. Worth confirming with Pratap alongside the
> fork deliverable, since the push flow is his (`tenants/plugin-push-flow.md`).

The package is also versioned independently (`0.0.1`) and pins its target as
`@deepseek-ai/dsh@0.1.5-rc.1`, so a fork upgrade is a change to that package
rather than to the storefront.

---

## Source documents

- `docs/noi-handover.md` — **start here if you are the designer.** How to change
  content or design, run it locally, and deploy it
- `docs/noi-vercel-setup.md` — the deploy setup, as a runbook with a check per
  step: Pro, the GitHub App, the import, protection
- `docs/engine-contract.md` — what the storefront needs from the commerce engine
- `docs/design.md` — tokens, the button/link variants, and the rules that keep
  them consistent. Read this before changing anything visual.
- `docs/backlog.md` — where the work is, what is measured against the reference,
  and what is still open
- `docs/environment.md` — environment variables and the secrets rule
- `SETUP.md` — getting it running, the colon problem, troubleshooting
- `yammaman-brand-plugin/README.md` — the brand package's own contract

Two documents that earlier revisions of this README listed — `yammaman-prd.md`
and `tech-stack.md` — are client-confidential and are **not in this repository**.
They are held locally, excluded from git, and were removed from history. They are
named here only so their absence is not mistaken for a broken checkout.
