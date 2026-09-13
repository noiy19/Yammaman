# Vercel setup — runbook

**For Noi, and for any assistant helping her.** Six steps, about fifteen minutes,
no code. Each step ends with a check, so you know it worked before moving on.

The goal: the Yammaman site deploys itself from the GitHub repo, it is protected
from public view while it is pre-launch, and Thuy can deploy alongside you.

> Context for an assistant: this is a runbook, not a tutorial. Follow the order.
> Steps 1, 2 and 6 need a human at a browser — a payment, a GitHub permission
> grant, and a security setting. Do not attempt those on her behalf; prompt her
> and wait. Everything else can be walked through.

---

## Before you start

- The **Yammaman Vercel account** exists. Sign in to *that* one, not a personal
  account — the plan and the billing belong to Yammaman.
- You are signed in to GitHub as **noiy19**, who owns the repository
  `noiy19/Yammaman`. Steps 2 and 3 fail without that.

---

## Step 1 — Upgrade to Pro

**Vercel → the Yammaman account → Settings → Plans → Upgrade to Pro.**

Why it is required, not optional: Vercel's free Hobby plan is licensed for
**personal, non-commercial use**. This is a shop, so Hobby breaks their terms
regardless of traffic. Pro is also what unlocks the two things the next steps
need — team members and deployment protection.

- [ ] The account shows **Pro** in the sidebar.
- [ ] Billing is on Yammaman's card, not a personal one.

---

## Step 2 — Install the Vercel GitHub App

This is what lets Vercel deploy from the repo. It is a **GitHub App installation
on your repository**, not a collaborator change — nobody needs to grant you
anything, and you do not need to add anyone.

1. Go to **vercel.com/new** (signed in to the Yammaman account).
2. Choose **Import Git Repository**. GitHub will ask you to install the Vercel app.
3. **Grant access to `noiy19/Yammaman` only.** Not "all repositories" — the
   narrowest grant that works is the right one.
4. The repo now appears in the import list.

- [ ] `noiy19/Yammaman` is listed as importable.
- [ ] On GitHub, **Settings → Applications → Vercel** shows the repository selected.

---

## Step 3 — Connect the repo, and deploy

> **A `yammaman` project already exists in this account** — created during an
> earlier pipeline test, alongside a `hello-world` one. If you see it, connect the
> repository to THAT project rather than importing a new one. Two projects
> deploying the same repo is a mess nobody enjoys untangling.

1. Import `noiy19/Yammaman`, or open the existing `yammaman` project and connect
   the repository to it under **Settings → Git**.
2. Vercel detects **Vite** and fills in the build settings. **Change nothing** —
   `vercel.json` in the repo already sets the framework, the build command, the
   output directory, the SPA rewrite and the security headers, and it overrides
   the UI. Editing them in the dashboard is how a working deploy breaks.
3. Leave the environment variables empty for now. The site builds without them;
   they are listed in `.env.example` for when Clerk is wired.
4. **Deploy.**

- [ ] The first deployment succeeds.
- [ ] Visit the URL and confirm the homepage renders.
- [ ] Append `/collection` to the URL and confirm it loads the collection page.
      If that 404s, the catch-all rewrite is missing — check that `vercel.json` is
      present in the repo and unchanged.

---

## Step 4 — Confirm it deploys itself

Push any change to `main` — or use **Redeploy** in the dashboard if you would
rather not touch the repo yet.

- [ ] A new deployment appears within a few seconds of the push, without you
      clicking anything.

From here on, **every push to `main` deploys the live site**, and every pull
request gets its own preview URL. That is the whole workflow: edit, push, look.

---

## Step 5 — Add Thuy as a team member

She builds the code, so she needs to see deployments and logs. Nothing about
*pushing* depends on this — the Git integration deploys whoever pushed — but
without it she is working blind.

**Settings → Members → Invite**, and give her the role that matches what she does:
a member who can deploy, not a viewer.

- [ ] She accepts the invitation and can see the `yammaman` project.
- [ ] She can trigger a deployment.

*(Use the address you already have for her. Do not paste it into this file — the
repository is public.)*

---

## Step 6 — Protect the pre-launch site

Right now anyone with the link can see the site, and it has not had Nana's
sign-off. This is the step that closes that.

**Project → Settings → Deployment Protection**, and choose **Vercel
Authentication** (only signed-in Vercel users on the team can view) or a
**password**, whichever suits how you want to share it.

- [ ] Opening the production URL in a private window now asks for access.
- [ ] You can still view it yourself.

---

## Done — what the setup now is

| | |
|---|---|
| Code | `noiy19/Yammaman`, owned by you |
| Deploys | On push to `main`, and a preview URL per pull request |
| Editing content | `site-content/yammaman-brand/*.json` — see `docs/noi-handover.md` |
| Editing design | `src/styles/`, `src/blocks/` — same document |
| Protection | On, until launch |

---

## If something goes wrong

**The deployment succeeds but the site is blank.** Open the browser console. A
content mistake usually appears there as a validation error naming the block. Run
`pnpm run gate` locally and it will name the file and field.

**Every page except the homepage 404s.** The catch-all rewrite is missing.
`vercel.json` must be present and unmodified.

**Vercel asks for payment when inviting a member.** The account is still on
Hobby — step 1 did not complete.

**A push does not deploy.** Check the Git connection: **Settings → Git** should
show `noiy19/Yammaman` connected. If it does not, repeat step 2.

**A push does not deploy, and the repo IS connected.** Check for two projects
deploying this repo — an earlier `yammaman` project may exist from a pipeline
test. Delete the one you are not using.

**Anything else.** Thuy, with the deployment URL and what you expected to happen.

---

**On the documents themselves:** they live in this repository, next to the code,
and change in the same commits. Run `git pull` before you start, every time. If a
document and the site disagree, the document is wrong — say so rather than working
around it.
