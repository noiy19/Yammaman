# Working on the Yammaman site

For Noi. Everything you need to change the content or the design, run it locally,
and put it online — without needing anyone else.

If you only read one section, read **What you can change freely** and **Putting it
online**. The rest is reference.

---

## Getting it running

You need **Node 24** and **pnpm**. Then:

```sh
git clone https://github.com/noiy19/Yammaman.git
cd Yammaman
pnpm install
pnpm run dev
```

It opens on **http://localhost:5173**. `SETUP.md` in the repo root covers the
things that go wrong on a first run — a colon in your folder path breaks some
tooling, and there is a shim for it.

If you would rather not install anything yet: the current build is at
**https://yammaman-iota.vercel.app**.

---

## What you can change freely

Two folders are yours. You can change anything in them and nothing will stop you:

| Folder | What it holds |
|---|---|
| `site-content/yammaman-brand/` | All the words: page titles, headings, body copy, the FAQ, the CTA labels |
| `public/assets/` | Images and fonts — `brand/` is your photography, `reference/` is the template's |

Content is plain JSON. Open `site-content/yammaman-brand/home.json` and you will
recognise the page:

```json
{ "id": "home-made-in-japan", "type": "sectionHeading",
  "props": { "eyebrow": "Aizu, Fukushima", "heading": "Made in Japan" } }
```

Blocks appear on the page in the order they appear in the file. To reorder, move
them. To remove, delete. To change the words, edit the strings.

**Every block type is available in Storybook** — `pnpm run storybook`, then look
under *Blocks* — which is the fastest way to see what a block looks like and
which fields it takes before you write it.

**Images must have `alt` text.** The validator will refuse a page without it. It
is not a technicality: alt text is the only version of the image some people get.

### If a content change is rejected

Run this and read the message — it names the file and the field:

```sh
pnpm run content:validate
```

The usual causes are a typo in a block `type`, a missing required field, or an
image path that does not exist on disk.

---

## What needs a review

`src/` is the site's code — components, styles, the design tokens. You *can*
change it, but a change that touches both `src/` and `site-content/` in one go
will be stopped by a check called the **lane gate**, and the reason is the shared
repo: some changes ship straight to production, and this is the boundary that
keeps an accidental one from taking the whole design with it.

In practice:

- **Changing words or images** → goes through on its own.
- **Changing a colour, spacing, or a component** → also fine, but keep it separate
  from content edits so the two are reviewable apart.
- **Both at once** → the gate asks for a review. That is the signal, not a
  punishment.

---

## Changing the design

The design lives in three files, in this order of preference:

1. **`src/styles/brand-kit.css`** — the palette, as raw values (`--yy-*`).
   Indigo is the accent because Aizu Momen is indigo-dyed cotton.
2. **`src/styles/index.css`** — the semantic tokens (`--color-*`, `--text-*`,
   `--spacing-*`) and the shared utilities. Change a value here and it changes
   everywhere, which is usually what you want.
3. **`src/blocks/*.tsx`** — the sections themselves.

`docs/design.md` explains what each token is for and the rules that keep them
consistent. Read it before changing a colour — it will save you a red build.

**Never write a raw colour or a one-off size in a component.** Every colour and
size comes from a token, and there is a gate that fails the build if one does not.
If a value you need does not exist, add it as a token — that is a feature of the
system, not a hurdle. It is also how the next person finds out the value was a
decision rather than a typo.

---

## Before you push

```sh
pnpm run gate
```

Five checks, about ten seconds. They catch, in order:

- **content** — links that go nowhere, images that are not there, missing alt text
- **tokens** — a raw colour or one-off size that should have been a token
- **contrast** — any text/background pair below WCAG AA, in *both* themes
- **storybook** — every block type has a component and a story that agree
- **types** — TypeScript

Run it before every push. It is much faster than finding out from a broken
deployment, and none of it is busywork: each one has caught a real mistake.

---

## Putting it online

The site deploys to Vercel. Two ways:

**Automatic (recommended).** In your Vercel account (the Yammaman one), import
the GitHub repository `noiy19/Yammaman`. **`docs/noi-vercel-setup.md` walks
through this step by step** — the Pro upgrade, the GitHub App, the import, and how
to add Thuy so she can deploy alongside you. You own the repo, so you can install the
Vercel GitHub App on it yourself — no one needs to grant you anything. After
that, every push to `main` deploys, and pull requests get their own preview URL.

The build settings are already correct in `vercel.json` and should not be edited:
framework Vite, `pnpm run build`, output `dist`, and a catch-all rewrite to
`index.html` (without which every page except the homepage would 404).

**By hand**, if you want to deploy from your machine:

```sh
npx vercel login
npx vercel link          # choose the Yammaman account
npx vercel deploy --prod
```

Two things worth doing while you are in there:

- **Turn on Deployment Protection** (Settings → Deployment Protection). Right now
  anyone with the link can see the site, and it has not had Nana's sign-off yet.
- **Use a Pro plan.** Vercel's free Hobby plan is for non-commercial projects
  only, and this is a shop. It is also what unlocks protection.

---

## Where things are

| | |
|---|---|
| The landing page | `site-content/yammaman-brand/home.json` |
| The design system | `docs/design.md` |
| What is done, what is next | `docs/backlog.md` |
| Environment and secrets | `docs/environment.md` |
| The block types | `src/blocks/`, and Storybook under *Blocks* |

Three documents that earlier versions of the README mentioned — `yammaman-prd.md`,
`tech-stack.md` and a handoff note — are **not in the repo on purpose**. They hold
commercial detail and named people. If you want them, ask Thuy.

---

## When something breaks

`pnpm run gate` first — it names the file and the problem in most cases. If the
page is blank, open the browser console; a content mistake usually shows up there
as a validation error naming the block.

For anything else, Thuy.
