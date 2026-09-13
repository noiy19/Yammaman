# Setup

Getting this repository running. Two paths: a machine with Node, and this one.

---

## Quick start (a normal machine)

```sh
pnpm install
pnpm run dev            # http://localhost:5173
```

`pnpm run dev` serves both surfaces at once:

| Surface | URL | Tenant id |
|---|---|---|
| YAMMA (brand) | http://localhost:5173/ | `yammaman-brand` |
| HARAPPA (mill) | http://localhost:5173/mill | `yammaman-textile-mill` |

Storybook, the visual contract:

```sh
pnpm run storybook      # http://localhost:6006
```

---

## This machine — read this first

Three constraints apply to the current development machine, and each one has a
concrete symptom if you don't know about it.

### 1. The workspace path contains a colon

```
/Users/noiyamasaki/Desktop/yammaman:website
```

`PATH` is colon-delimited, so **this path cannot be a `PATH` entry**. macOS
splits it into two nonexistent entries. Two things break as a result:

- `node` is not found, even after installing it;
- `node_modules/.bin` is not found, so every script fails with
  `sh: tsc: command not found` even though TypeScript is installed. pnpm prints a
  warning about this on every single command.

**The fix is `scripts/env.sh`.** Source it in every new shell:

```sh
source scripts/env.sh
```

Works in both **zsh** (the macOS default) and bash. It builds colon-free wrapper
scripts under `/tmp/yammaman-shim/` that delegate to the real binaries. Nothing in
the project moves, and the real `node_modules/.bin` is never touched.

> **If you see `yammaman env ready — node MISSING, pnpm MISSING`**, the script
> resolved the project root wrongly — almost always because it was sourced by a
> shell that does not set `BASH_SOURCE` and the older version silently used the
> parent of your current directory. Source it by full path instead:
>
> ```sh
> source "/Users/noiyamasaki/Desktop/yammaman:website/scripts/env.sh"
> ```
>
> The current version detects bash vs zsh and refuses to continue with a wrong
> root rather than printing a wall of `MISSING` that looks like a broken install.

> `/tmp` is cleared on reboot. Re-source `env.sh` after a restart. Sourcing it
> repeatedly is harmless.

### 2. There is no Node, npm, or pnpm installed

No Homebrew, no Xcode command line tools, no system Node. So the toolchain lives
**inside the workspace** at `.toolchain/` — nothing global, nothing outside the
project:

```sh
./scripts/bootstrap-toolchain.sh
source scripts/env.sh
```

The script reuses a system Node v20+ if it finds one and only installs pnpm;
otherwise it downloads a private Node. It is idempotent.

npm's cache and config are redirected into `.toolchain/` as well. npm's defaults
live in `~/.npm` and `~/.npmrc`, which the write sandbox denies — and a
half-written cache there produces the confusing
`Your cache folder contains root-owned files` error.

### 3. `git` is not usable

`/usr/bin/git` exists, but it is a stub that requires Xcode command line tools:

```
xcode-select: error: Unable to get active developer directory
```

So the repo cannot be initialised, committed, or pushed from this machine until
those tools are installed:

```sh
xcode-select --install
```

Until then, `node scripts/check-lane.mjs` cannot diff against a base ref and
**skips with a notice** rather than failing. That is deliberate for local runs;
CI passes `--strict`, where an unresolvable base is a hard failure. You can still
exercise it against an explicit file list:

```sh
node scripts/check-lane.mjs --files=site-content/yammaman-brand/home.json,src/blocks/Hero.tsx
```

---

## CLI tools (GitHub + Vercel)

Both are installed into `.toolchain/` — no Homebrew, nothing global:

```sh
./scripts/bootstrap-clis.sh      # idempotent
source scripts/env.sh

gh --version                     # 2.100.0
vercel --version                 # 59.x
```

### Authentication is interactive — you have to run it

Neither login can be scripted; both need a browser or a device code. Run them in
your own terminal:

```sh
cd "/Users/noiyamasaki/Desktop/yammaman:website"
source scripts/env.sh

gh auth login        # GitHub → HTTPS → "Login with a web browser"
vercel login         # Vercel → pick the scope you intend to deploy into
```

> **On the Vercel scope:** this account deploys into the **`yammaman` team**, which
> is where the project lives. Pick that scope. An earlier version of this file
> wrongly described the account as a free personal one and advised choosing the
> personal scope instead — see the Plan section below.

### Why these two are useful *before* git works

Neither CLI depends on the git binary:

- **`gh`** has its own HTTP client, so it can make the repository **private**
  right now, with no commit and no Xcode command line tools:

  ```sh
  gh repo edit noiy19/Yammaman --visibility private --accept-visibility-change-consequences
  ```

- **`vercel`** uploads local files directly, so it can **deploy** with no commit
  and no Git integration:

  ```sh
  vercel deploy            # preview deployment
  vercel deploy --prod     # production deployment
  ```

That means you do not have to wait for the Xcode install to see the site live.
Git-connected deploys (a preview URL per pull request) still need the repository
pushed, which is the separate blocker below.

### Where the CLIs keep their state (and why it is redirected)

The write sandbox denies `~/Library` and `~/.config`, and both CLIs want to write
there. Their state is redirected into the workspace instead:

| CLI | Location | How |
|---|---|---|
| `gh` | `.toolchain/gh-config/` | `GH_CONFIG_DIR` — gh's documented override. Without it, `gh auth login` fails with `mkdir /Users/<you>/.config: operation not permitted` |
| `vercel` | `.toolchain/vercel-home/` | A wrapper in `.toolchain/cli/` that redirects `HOME` for that one process |

The Vercel CLI has no config-dir variable (it resolves paths through `env-paths`,
hard-coded to `~/Library` on macOS), so a wrapper is the only option. It redirects
`HOME` for the `vercel` process alone — exporting `HOME` globally would send git,
ssh and npm looking in the workspace too, which is a much larger change than the
problem warrants.

Both directories are inside `.toolchain/`, which is gitignored. **Your auth
tokens therefore live in the workspace, not in your home directory** — worth
knowing if you later delete `.toolchain` or share this folder.

---

## Everyday commands

```sh
source scripts/env.sh        # required, once per shell

pnpm run dev                 # dev server, both tenants
pnpm run build               # typecheck + production build to dist/
pnpm run preview             # serve the production build

pnpm run storybook           # component workshop
pnpm run build-storybook     # static Storybook to storybook-static/

pnpm run test                # unit tests (vitest)
pnpm run typecheck           # tsc -b
pnpm run lint                # eslint

pnpm run gate                # ALL gates — run this before opening a PR
```

### The gates, individually

| Command | Checks |
|---|---|
| `pnpm run gate:lane` | Client sandbox vs Muen lanes |
| `pnpm run gate:no-ad-hoc-values` | No raw hex / no arbitrary Tailwind values |
| `pnpm run gate:contrast` | WCAG AA across both themes |
| `pnpm run gate:storybook-contract` | Schema ↔ registry ↔ stories agree |
| `pnpm run content:validate` | Content JSON: shape + cross-document rules |
| `pnpm run tokens:build` | Regenerate `src/styles/eva.css` from vendored EVA JSON |

`pnpm run gate` runs everything except the lane check (which needs git history).

---

## Editing content

A page is a JSON document in `site-content/<tenantId>/`. To add one, drop in a
file — there is no route table to update:

```sh
site-content/yammaman-brand/lookbook.json
```

The nav, the route, and the SEO tags all follow from the document. `pageId`,
`path`, and `blocks` are required; the first block must be a `hero`, because the
hero owns the page's `<h1>`.

Validate before committing:

```sh
pnpm run content:validate
```

That gate also checks things a schema cannot: that the `tenantId` matches the
directory, that the path falls inside the tenant's `basePath`, that no two pages
claim a URL, and that **every internal link resolves to a real page**.

---

## Editing the design system

Tokens flow in one direction:

```
design-system/eva/*.json   vendored upstream EVA (do not edit by hand)
        │  pnpm run tokens:build
        ▼
src/styles/eva.css         GENERATED — Layer 1 statics + Layer 2 aliases
        │
src/styles/brand-kit.css   Yammaman re-points Layer 2 only
        │
src/styles/index.css       @theme publishes Tailwind utilities
        ▼
bg-surface  text-ink  border-line  text-accent   ← what components write
```

- To change **a brand colour**: edit `src/styles/brand-kit.css`, then
  `pnpm run gate:contrast`.
- To change **what a component looks like**: use a semantic utility. Never a
  hex, never a `--dsw-*` name, never an arbitrary value like `text-[13px]`.
- To add a **new token**: add it to the `@theme` block in `src/styles/index.css`
  and use the generated utility.

If a check complains, the fix is almost always a token, not an exception. The
allowlist in `scripts/check-no-ad-hoc-values.mjs` is five entries long and every
one has a written reason.

---

## Adding a block type

This is a **Muen** change (it is functionality, not content), and it spans lanes
on purpose — which is what the lane override exists for.

1. `content/schema/page.schema.json` — add the variant and a `type.const`
2. `src/content/types.ts` — mirror it as a TypeScript type, add to the `Block` union
3. `src/blocks/<Name>.tsx` — the component
4. `src/blocks/registry.ts` — register it
5. `src/blocks/<Name>.stories.tsx` — `title: 'Blocks/<type>'`
6. `src/blocks/__fixtures__/storyFixtures.ts` — sample props

Then `pnpm run gate`. The Storybook contract gate fails until all three lists
agree, which is the point — it is a checklist that runs itself.

---

## Deploying

Two environments, per `tech-stack.md`: **staging** and **production**.

- **Staging** — Vercel preview, auto-deploys on merged PRs. This is the client
  review environment.
- **Production** — deployed by Muen Collective **only after Nana's sign-off**.

### Deploying from CI (the workflow that is in this repo)

Deployment runs through `.github/workflows/deploy.yml`, **not** Vercel's Git
integration. Two reasons, and the second is the durable one:

> Vercel verifies that a commit's author has access to the project before
> deploying. Vercel names a **mismatched Git email** and the *"Hobby
> collaboration limit"* as causes of *silently* blocked deploys — no error, no
> bot comment, no deployment.
> — [Vercel KB](https://vercel.com/kb/guide/why-aren-t-commits-triggering-deployments-on-vercel)

The Hobby limit does not apply here (this account is a team — see the Plan
section). But the **git-author check applies on every plan**, and a contributor
whose Git email does not match their Vercel identity will still be blocked
silently. A CLI deploy is not a *Git* deployment request, so it sidesteps the
check entirely — which makes the pipeline independent of who pushed.

It also keeps the token in repository secrets rather than in a person's
possession: Vercel personal-account tokens are full-access, with no fine-grained
scoping. And a contributor needs **no Vercel seat at all** to get a preview.

| Trigger | Result |
|---|---|
| Pull request | Preview deployment; the URL is posted as a single comment that is **updated** on each push, not appended |
| Push to `main` | Production deployment |
| Manual (`workflow_dispatch`) | Same as a push to `main` |

**Setup — three repository secrets** (Settings → Secrets and variables → Actions):

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` after `vercel link` |

```sh
vercel login
vercel link          # writes .vercel/project.json, which is gitignored
cat .vercel/project.json
```

> **Until `VERCEL_TOKEN` is set, both jobs SKIP with a notice rather than
> failing.** A workflow that turns every pull request red before it has been
> configured teaches people to ignore red, which is worse than not having it.

> **⚠ Production is not the public site yet.** Until the domain cutover
> (PRD D1 / M12) the domain still serves WordPress, so Vercel's production
> deployment is reachable only on its `vercel.app` URL. When the domain is
> attached, revisit this workflow: auto-deploying `main` to a live public domain
> would bypass Nana's sign-off, which FR-10 requires.

### Importing into Vercel

**The repository must have at least one commit first.** Vercel cannot import an
empty repository — the import page will not let you continue, and the only
symptom is a page that will not advance. Check with:

```sh
curl -s https://api.github.com/repos/noiy19/Yammaman/commits
# 409 "Git Repository is empty." → push something first (scripts/publish-to-github.sh)
```

Then, on the import screen:

| Setting | Value |
|---|---|
| Git repository | `noiy19/Yammaman` |
| Framework preset | **Vite** |
| Root directory | `.` (repository root — the app is not in a subdirectory) |
| Build command | `pnpm run build` |
| Output directory | `dist` |
| Install command | `pnpm install --frozen-lockfile` |
| Node.js version | **24.x** (from `.nvmrc`) |

Most of that is **already declared in `vercel.json`**, so once the repository has
content Vercel reads the build command, install command, output directory and
framework preset from it. If the import form shows "Other" as the framework, the
file is not in the repo yet.

> **Do not add unknown keys to `vercel.json`.** Vercel validates it against a
> schema and rejects the whole file with "Invalid vercel.json" — including
> comment-style keys, because JSON has no comments. The reasoning behind each
> header and rewrite is documented here instead.

### What `vercel.json` does

- **SPA rewrite** — every path resolves to `index.html`, so `/mill` and any
  content path work on a hard refresh. Vercel serves real files from `dist/`
  before applying rewrites, so hashed assets are unaffected.
- **`/assets/*` cached immutably** — filenames are content-hashed, so a new
  build produces new names. This is the one case where `immutable` is safe.
- **`index.html` explicitly `no-store`** — it is the file that references the
  hashed assets. A stale `index.html` pins a visitor to a previous deploy, and
  since the old asset filenames are still valid they see no error, just old code,
  with no way for you to ship them a fix.
- **Baseline security headers** — `nosniff`, `Referrer-Policy`,
  `X-Frame-Options: DENY`, and a restrictive `Permissions-Policy`.

### The docs in this repository are the source of truth

They sit beside the code and change in the same commits, so **pull before you
start** — `git pull` on `main`. A local copy is stale the moment anyone pushes,
and if a document and the site disagree, the document is wrong. That is a bug
worth reporting rather than working around.

### Node version

`.nvmrc` pins **24**, which is what CI uses and what Vercel is told to use. Node
20 is [being deprecated on Vercel on 1 October 2026](https://vercel.com/changelog/node-js-20-is-being-deprecated),
so 24 (current LTS) is the right target rather than the safe-looking older one.

### Plan — the account is a TEAM, and it is on HOBBY. Pro is required.

> **Corrected twice, so read this version.** The first said "stay on Hobby
> (free)". The second said "it is a team, not Hobby, so no upgrade is pending".
> Both were wrong, because both confused *workspace type* with *plan*: a team can
> exist on the Hobby plan, and the plan is what carries the restriction.

**The team exists**, observed via the CLI:

```
id        Team name   Members
yammaman  Yammaman    noiy19 (OWNER)

Projects under yammaman:
  yammaman       prj_LsNimeoSd70iboGbnaDtQMNRbsDM
  hello-world    (deploy-pipeline test)
```

So **the project already exists** there — importing the repo again would create a
second one. A team also supports member invitations, which is how Thuy gets
access, and that part is unchanged.

**But the plan is Hobby, and Hobby is licensed for personal, non-commercial use.**
This is a shop, so the site cannot legitimately live on it. Verified from the API
for the two scopes visible to this machine (`muen-collective` and the personal
one): both report `plan: "hobby"`. A team workspace does **not** exempt you — the
restriction follows the plan, not the workspace shape.

**Upgrading is therefore required, not optional**, and it is Yammaman's account
and card, not Muen's. `docs/noi-vercel-setup.md` is the runbook for it.

#### Adding a collaborator

```sh
vercel teams invite thuy@example.com
vercel teams members      # verify
```

GitHub collaborator access does **not** carry over — they are separate systems.

#### Deployment protection on this team

Observed: deployment-specific URLs (`*.vercel.app` with the deployment hash)
**302 to Vercel SSO**, while the stable alias is publicly reachable. So Vercel
Authentication is already on for deployments. That matters for the client review
loop:

- **Stable aliases** are viewable by anyone with the link — which is what makes
  a review URL shareable with Nana.
- **Per-deployment URLs** require a Vercel login **with access to the project**,
  so a collaborator must be invited before they can open one.

Password Protection remains a Pro-tier add-on rather than a default
([Vercel KB](https://vercel.com/kb/guide/how-do-i-add-password-protection-to-my-vercel-deployment)).

#### Upgrade triggers

Upgrade when any of these becomes true — not before:

1. ~~**Another author's commits need to produce deployments.**~~ ✅ **Resolved —
   this no longer applies.** It was written when the account was believed to be
   Hobby. It is a team workspace, so collaborators can be invited and the
   "Hobby collaboration limit" does not bind. See the Plan section above:
   `vercel teams invite thuy@example.com`.

   The underlying behaviour is still worth knowing, because it is the reason the
   deploy workflow exists in the form it does. Vercel verifies that a commit's
   author has access to the project before deploying, and names the *"Hobby
   collaboration limit"* as a cause of **silently** blocked deploys
   ([Vercel KB](https://vercel.com/kb/guide/why-aren-t-commits-triggering-deployments-on-vercel)):

   > "Vercel verifies the commit author has project access before deploying, so a
   > mismatched Git email or a Hobby collaboration limit blocks deploys at the
   > identity layer."

   Two consequences still hold regardless of plan:

   - On any plan, a contributor whose **Git email does not match** their Vercel
     identity can have deploys blocked. Worth checking if a preview mysteriously
     never appears.
   - Deploying from CI with a token is unaffected by the author check, which is
     why `.github/workflows/deploy.yml` does it that way and keeps the token in
     repository secrets rather than in a person's possession.
2. **Preview deployments must be private *and* shareable** — for a **client**
   outside the Vercel team. Standard Protection covers team members; giving Nana
   or Noi access without a seat is the open question, not capacity. See the
   deployment-protection note above.
3. **Production goes live commercially — THIS ONE IS LIVE.** Vercel's
   [Hobby terms](https://vercel.com/docs/plans/hobby) restrict the Hobby plan to
   personal, non-commercial use. This is a commercial storefront, so the upgrade
   is required regardless of traffic — see the Plan section above. Do not read a
   team workspace as an exemption: it is not.
4. **Usage limits.** Check the project's Usage tab against
   [Vercel's limits](https://vercel.com/docs/limits) rather than guessing — a
   storefront with product imagery is most likely to run into bandwidth first. I
   did not assert specific numbers here because Vercel's limits page is
   client-rendered and I could not read the current figures; the dashboard is
   authoritative.

None of these block development. Nothing in this repository is Pro-specific —
`vercel.json` uses only features available on every plan, so upgrading later is a
billing change, not a migration.

Environment variables: see `docs/environment.md`. The short version — **anything
prefixed `VITE_` is public**.

---

## Handing the scaffold to someone else

When a contributor needs the project before it is on GitHub — or needs it without
repo access — produce a portable archive:

```sh
./scripts/make-handoff-bundle.sh          # .zip
./scripts/make-handoff-bundle.sh --tar    # .tar.gz
```

It writes `.tmp/yammaman-scaffold-<date>.zip` (gitignored) and **verifies its own
output**: it lists the archive back and refuses to finish if `.env`,
`node_modules`, build output or `.git` got in. It also scans the bundled tree for
credential-shaped strings and asserts that `.env.production` holds only public
values.

Excluded, and why: `.toolchain/` (~500 MB of machine-local toolchain and your
auth tokens), `node_modules/`, `dist/`, `storybook-static/`, `.git/`, and `.env`.
The recipient needs Node 20+ and pnpm, nothing else — not the toolchain
bootstrap, which exists only to work around this machine's missing Node.

There is a worked example of the accompanying brief, but it is **not in this
repository** — it holds commercial detail and named people and was removed from
history. It is held locally, and is named here only so its absence is not mistaken
for a broken checkout. Send the brief in the message as well as in the archive, so
it is read before the work starts.

> **The one thing to tell them:** make sure their working directory has no colon
> in its path. A colon breaks `PATH`, which makes `node_modules/.bin` unreachable
> and every script fail with `sh: tsc: command not found` even though nothing is
> missing. Renaming the folder is a five-second fix before any work is done, and
> a painful one afterwards.

---

## Troubleshooting

**`sh: tsc: command not found` / `node: command not found`**
`source scripts/env.sh`. This is the colon problem, not a missing dependency.

**`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`**
pnpm wants to purge `node_modules` and has no terminal to ask. Prefix with
`CI=true`.

**`Your cache folder contains root-owned files`**
npm is writing to `~/.npm`, which is denied. Use the toolchain's npm config:
`source scripts/env.sh` sets `npm_config_cache` into `.toolchain/`.

**`Cannot find module '/tmp/yammaman-shim/typescript/bin/tsc'`**
An old version of `env.sh` symlinked the shim `bin` directory at the real
`node_modules/.bin`, which breaks pnpm's relative shims (and, worse, made
`rm -f "$shim"/*` delete the real ones). Current `env.sh` generates wrappers
instead and defends against the stale symlink. Re-source it; if
`node_modules/.bin` is empty, run `CI=true pnpm install`.

**Storybook prints `EPERM: mkdir '/Users/<you>/.storybook'`**
Harmless. Storybook tries to persist its UI preferences (panel sizes, last-used
globals) to `~/.storybook/settings.json`, and the write sandbox denies it.
Storybook starts and serves normally; only the preference file is skipped.

**Storybook's dev server returns 403 on every request**
Same colon guard as the Vite dev server, and it is not configurable from
`.storybook/` — the fix is the `server.fs.strict` branch in `vite.config.ts`,
which Storybook inherits. If you see this, that branch has been removed.

**A page is blank**
Check the console: `loadContent.ts` throws loudly on a `tenantId` that disagrees
with its directory, or on two pages claiming one path. Run
`pnpm run content:validate` for a readable version of the same error.
