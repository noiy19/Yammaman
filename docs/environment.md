# Environment & secrets

Companion to `.env.example`. That file is valid dotenv so it can be copied
directly; this file explains the reasoning and keeps the template clean.

```sh
cp .env.example .env
```

`.env` is gitignored and must stay that way. `tech-stack.md` requires that
credentials and the live `TenantApiKey` stay out of this repo.

---

## The rule that matters: `VITE_` means PUBLIC

Anything prefixed `VITE_` is **inlined into the JavaScript bundle** by Vite and is
readable by anyone who opens devtools. It is not a secret store, and it is not a
reasonable place to "put it for now".

| Prefix | Visibility | Belongs there |
|---|---|---|
| `VITE_*` | **Public** — compiled into the browser bundle | Public identifiers only: publishable keys, cloud names, public API bases |
| no prefix | **Server-side only** — never reaches the browser | Everything secret, reached through a server function |

`src/vite-env.d.ts` declares the `VITE_*` surface. That declaration is the second
half of adding a variable: a `VITE_` var that is used but undeclared is a
TypeScript error, and that is deliberate — it forces the "is this really safe to
publish?" question at the moment the variable is added rather than at the moment
it leaks.

---

## Client-safe variables

| Variable | Function | Service | Decided at |
|---|---|---|---|
| `VITE_COMMERCE_API_BASE` | Commerce engine base URL, via server-side proxy | Pratap's OMS/CMS | **Open** — API rundown |
| `VITE_CLOUDINARY_CLOUD_NAME` | Image delivery | Cloudinary | ✅ **Set** (`yqalfmuf`) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Sign-in | Clerk | Meeting 02 |

## Server-side only

| Variable | Function | Service | Decided at |
|---|---|---|---|
| `DATABASE_URL` | Operational data | Neon via Vercel Marketplace | Meeting 02 |
| `COMMERCE_API_KEY` | Engine auth (the `TenantApiKey`) | Pratap's engine | **Open** |
| `CLOUDINARY_API_KEY` | Signed uploads | Cloudinary | **Not built yet** |
| `CLOUDINARY_API_SECRET` | Signed uploads | Cloudinary | **Not built yet** |
| `RESEND_API_KEY` / `TICKET_FROM_EMAIL` | Transactional email | Resend | Meeting 02 |
| `LINE_CHANNEL_ACCESS_TOKEN` | Worker notifications | Line API | Meeting 02 |
| `RUNNINGHUB_API_KEY` | Diffusion pipeline | RunningHub | Meeting 04 spike |
| `MIMO_API_KEY` | AI worker model | Mimo (**swappable**) | Client decision |
| `CLERK_SECRET_KEY` | Sign-in, server side | Clerk | Meeting 02 |
| `USPS_USER_ID` | Shipping labels | USPS Web Tools | Meeting 02 |

---

## Cloudinary: delivery vs upload, and why only half is built

Cloudinary is **two different problems** with two different security models, and
conflating them is how the secret ends up in the browser bundle.

### Delivery — built ✅

Serving an image needs **only the cloud name**, which is public: it is the host
segment of every URL
(`https://res.cloudinary.com/<cloud_name>/image/upload/...`). So it lives in
`VITE_` and ships to the browser, and that is correct rather than a leak.

URLs are built in `src/media/cloudinary.ts` **without the Cloudinary SDK**. A
delivery URL is string concatenation; the npm package is server-oriented and
would add its dependency tree to the browser bundle to do nothing useful.
Transformation parameters come from named presets in that file, never from
content — so a client editing `site-content/*.json` cannot produce a 6000px hero
and blow the bandwidth budget.

Content chooses an image in one of two ways:

```jsonc
// Optimised delivery. Use this for real imagery.
{ "publicId": "yammaman/fabrics/ai-001", "alt": "…", "aspect": "1/1" }

// A local path (served from public/) or an absolute URL. Bypasses Cloudinary —
// intended for placeholder art and third-party images.
{ "src": "/assets/mill-loom-placeholder.svg", "alt": "…", "aspect": "3/2" }
```

The two are **mutually exclusive** in the schema, not "both optional with a
precedence rule". Precedence rules produce content that renders differently
depending on which field an author happened to fill in, and nothing catches it.
`scripts/validate-content.mjs` also verifies that every local path resolves on
disk, so a missing asset fails CI instead of shipping as a broken image.

### Upload — not built ⛔

Uploading needs the **key and the secret**, which must never reach the browser.
It therefore requires a server endpoint that signs the request, and a `VITE_`
variable cannot hold it.

It is deliberately not built because the decisions it depends on are still open:
**who may upload** (Japan workers uploading fabric jpgs and Noi uploading content
images are different authorisation cases — PRD §3), and whether uploads go
through the harness or the storefront at all. Building it now would mean guessing
the auth model and rewriting it. The reasoning is recorded at the bottom of
`src/media/cloudinary.ts`.

When it is built, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` go in the
deployment platform's **server** environment. Note that together with the cloud
name they grant full account control, including deleting every asset.

---

## Where the public values actually live

`VITE_CLOUDINARY_CLOUD_NAME` is committed in **`.env.production`**, which Vite
loads for `vite build` and `storybook build`. That means CI and Vercel both get it
without it being duplicated into workflow YAML and a dashboard setting.

> **`.env.production` is a committed file, so every value in it is public.** A
> guard enforces this: `scripts/publish-to-github.sh` refuses to commit a `.env*`
> file (other than `.env.example`) containing any key that is not `VITE_`-prefixed.
> Before that guard existed, the file was a trap — it looks like a private env
> file, so the next person to add a Cloudinary secret has every reason to think it
> is safe.

Local development uses the gitignored `.env`. In CI, with no cloud name set, image
delivery degrades gracefully: `<Media>` renders an explicit "Image not configured"
message rather than a broken image or a silently wrong URL.

---

## Three things worth stating plainly

**The AI provider is not locked in.** `MIMO_API_KEY` is named after the
recommended default. `tech-stack.md` is explicit that provider settings make the
model swappable and that this needs no dev-team audit. The AI worker should read a
provider-agnostic variable so that swapping a model is a config change rather than
a code change.

**Two of these credentials are not ours to hold.** The commerce engine belongs to
Pratap; the USPS account is the client's existing one. We hold a reference or a
delegated credential, not a copy of their authority. In particular, the live
`TenantApiKey` belongs in a secrets manager, and the browser must never see it —
hence the server-side proxy in front of `VITE_COMMERCE_API_BASE`.

**Neon is not a separate vendor account.** It is provisioned through the Vercel
Marketplace integration, which injects `DATABASE_URL` into the Vercel project.
`tech-stack.md`'s DB note is explicit about this: there is no separate "database"
line on the Meeting 02 account list.

---

## Deliberately not listed yet

Listing a variable that no code reads is how an `.env.example` becomes fiction
that people copy and trust. These arrive with their integrations:

- Cloudinary upload **signature** endpoint — needs the server function first
- Clerk webhook signing secret — needs the webhook route first
- RunningHub **workflow id** — needs the Meeting 04 spike to choose a workflow
- Production analytics / logging keys — explicitly out of scope (PRD §4)

## What is not configured today

`VITE_COMMERCE_API_BASE` is unset, so `hasLiveCommerce` is false and the
storefront runs against the fixture client in `src/commerce/fixture.ts`. That is
the intended state until the engine API rundown lands; see
`src/commerce/client.ts` for why the interface exists before the endpoints do.
