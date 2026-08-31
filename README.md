# Statute — a legal-reading tutor

A small web app for reading legal documents with a five-question guide,
instead of having them summarized for you. Upload a PDF (or paste text),
and it stays visible on screen the whole time — nothing about the
document is sent to a server or searched automatically.

This is a plain HTML/CSS/JavaScript app. No build step, no framework,
no database, no login. It deploys as a static site.

---

## What's actually functional right now

- **Upload a PDF** and it's read entirely in your browser with
  [PDF.js](https://mozilla.github.io/pdf.js/) — the file is never
  uploaded anywhere.
- **Text is extracted per page** and shown in the reading pane, with page
  navigation (Prev / Next, and the page indicator tracks your scroll
  position).
- **Paste text** directly if you don't have a PDF.
- **A static legal-term glossary** (`js/glossary.js`) underlines common
  terms (motion, jurisdiction, vacatur, etc.) with a definition on click —
  this is a fixed dictionary lookup, not AI interpretation of your
  document.
- **Citation detection** (`js/citations.js`) turns patterns like
  `8 U.S.C. § 1188` or `20 C.F.R. § 655.122` into links to public lookup
  sites (Cornell LII, eCFR). This builds a URL from the text you're
  already reading — it does not perform a search on your behalf.
- **Guide me mode**: walks through five questions (What am I reading? /
  What is this about? / What does it say or do? / What does it mean
  here? / What happens next?) with a generic hint per question. You type
  your own answers. You can select any passage in the document and
  "Attach as evidence" to link it to the question you're on.
- **Analyze for me mode**: present in the UI, but honestly labeled
  "not connected yet" — there's no AI backend in this build, so it
  doesn't fabricate an analysis. See "Adding AI later" below.
- **Understanding worksheet**: a blank worksheet you fill in yourself
  from your own reading, pre-populated with whatever evidence you marked
  along the way. You can download it as a `.txt` file.
- **Clean empty state**: if no document is loaded, the reading pane says
  so plainly instead of showing placeholder or sample content.

---

## Project structure

```
statute/
├── index.html            All screens (landing, reader, worksheet) live here
├── css/
│   └── styles.css        All styling
├── js/
│   ├── app.js             Screen navigation + guided-reading logic (state lives here)
│   ├── pdf-reader.js       PDF.js wiring — loads a PDF, extracts text per page
│   ├── glossary.js         Static legal-term dictionary + text-scanning helper
│   ├── citations.js        Regex citation detector → links to public sources
│   └── api.js              Stub seam for a future server-side AI API (see below)
├── api/
│   └── README.md           Explains where a future serverless AI function would go
├── package.json           Metadata only — no build step, no dependencies
├── .gitignore
└── README.md               This file
```

There is intentionally no `vercel.json`. This is a plain static site with
`index.html` at the project root, which Vercel serves with zero
configuration. If a server-side API is added later under `/api` (see
below), that also needs no extra config — Vercel auto-detects serverless
functions placed there.

---

## Running it locally

You can just open `index.html` directly in a browser, but PDF.js and some
browsers are happier with a real local server (avoids file:// restrictions
on worker scripts). Easiest option, if you have Node installed:

```bash
npm run dev
```

This runs `npx serve .` and prints a local URL (usually
`http://localhost:5173`) to open in your browser. Node/npm isn't required
for deployment — it's just a convenience for local testing.

---

## 1. Put the project in a GitHub repository

1. Create a new, empty repository on GitHub (no README/license/gitignore
   template — this project already has its own).
2. From inside the `statute/` project folder on your machine:

   ```bash
   git init
   git add .
   git commit -m "Initial commit — Statute MVP"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```

   Replace `<your-username>/<your-repo-name>` with your actual GitHub
   path. If you created the repo with a README already, either delete it
   first or `git pull origin main --allow-unrelated-histories` before
   pushing.

---

## 2. Connect the repository to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub sign-in is
   simplest).
2. Click **Add New… → Project**.
3. Choose **Import Git Repository** and select the repo you just pushed.
4. Vercel will detect it as a static project. You shouldn't need to
   change anything:
   - **Framework Preset:** Other (or "None")
   - **Build Command:** leave blank
   - **Output Directory:** leave blank (defaults to the project root)
5. Click **Deploy**.

---

## 3. Deploy as a working web app

That's it — step 2's Deploy click is the deployment. Vercel gives you a
live URL like `https://your-repo-name.vercel.app` once the build
finishes (it should take seconds, since there's nothing to build).

---

## 4. Keep updating through GitHub → auto-redeploy on Vercel

Once the project is connected, Vercel watches the repository:

```bash
# make changes to any file
git add .
git commit -m "Describe what changed"
git push
```

Every push to your default branch (`main`) triggers a new deployment
automatically — no need to touch the Vercel dashboard again. Pushes to
other branches or pull requests get their own **preview URLs**, so you
can check changes before merging them into `main`.

---

## Adding AI later (without a front-end rewrite)

The front end never calls an AI service directly. Every place that would
eventually need AI assistance goes through `js/api.js`, which currently
returns "not connected" for everything.

To add real AI analysis later:

1. Add a serverless function, e.g. `api/explain.js`, that calls the
   Anthropic API server-side (keeping your API key off the client).
2. In `js/api.js`, flip `isConnected()` to `true` and uncomment the
   `fetch('/api/explain', …)` calls already sketched in that file.
3. Push to GitHub — Vercel redeploys both the static front end and the
   new serverless function together, with no other configuration.

`js/app.js`, `js/pdf-reader.js`, `js/glossary.js`, and `js/citations.js`
don't need to change at all for this.

---

## What's deliberately not in this MVP

No login/accounts, no database, no payments, no user profiles, no
automatic internet search for legal sources, and no fabricated analysis
of whatever you upload. If a feature would require guessing at what a
document says without either the user or a real AI backend actually
reading it, it's left as an honest placeholder instead.
