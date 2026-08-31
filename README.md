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
  uploaded anywhere. PDF.js itself is installed via npm (`pdfjs-dist`)
  and served from this app's own `/vendor/pdfjs` folder, same-origin —
  it is **not** loaded from a CDN. See "How PDF.js is loaded" below.
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
├── index.html             All screens (landing, reader, worksheet) live here
├── css/
│   └── styles.css         All styling
├── js/
│   ├── app.js              Screen navigation + guided-reading logic (state lives here)
│   ├── pdf-reader.js        PDF.js wiring — loads a PDF, extracts text per page
│   ├── glossary.js          Static legal-term dictionary + text-scanning helper
│   ├── citations.js         Regex citation detector → links to public sources
│   └── api.js               Stub seam for a future server-side AI API (see below)
├── vendor/
│   └── pdfjs/               PDF.js, copied locally from node_modules — see below.
│       ├── pdf.min.mjs        Committed to the repo so the app works even before
│       ├── pdf.worker.min.mjs a fresh `npm install` runs.
│       └── VERSION.txt
├── scripts/
│   └── copy-pdfjs.js        Copies pdfjs-dist's build output into vendor/pdfjs
├── api/
│   └── README.md            Explains where a future serverless AI function would go
├── package.json            Declares pdfjs-dist as a dependency; no build step
├── .gitignore
└── README.md                This file
```

There is intentionally no `vercel.json`. This is a plain static site with
`index.html` at the project root, which Vercel serves with zero
configuration. If a server-side API is added later under `/api` (see
below), that also needs no extra config — Vercel auto-detects serverless
functions placed there.

### How PDF.js is loaded (no CDN)

1. `pdfjs-dist` is a real dependency in `package.json` and lives in
   `node_modules` after `npm install`, same as any npm package.
2. It ships its build output as plain files rather than something meant
   to be pulled through a bundler, so instead of adding a bundler to the
   whole project, `npm install` automatically runs
   `scripts/copy-pdfjs.js` (via the `postinstall` hook), which copies
   exactly two files — `pdf.min.mjs` and `pdf.worker.min.mjs` — from
   `node_modules/pdfjs-dist/build/` into `vendor/pdfjs/`, a normal folder
   in the repo.
3. `vendor/pdfjs/` is committed to git, so the app works immediately on a
   fresh clone or deployment even before anyone runs `npm install` again
   — `postinstall` just keeps those files in sync with whatever version
   of `pdfjs-dist` is installed when you do.
4. `js/pdf-reader.js` loads the library with a same-origin dynamic
   `import("/vendor/pdfjs/pdf.min.mjs")` — an absolute path, so it
   resolves the same way locally and once deployed. No `<script src="https://...">`
   tag for PDF.js exists anywhere in `index.html`.
5. The **worker** is configured immediately after that import:
   `pdfjsLib.GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs"`.
   PDF.js loads its worker as an ES module worker
   (`new Worker(workerSrc, { type: "module" })`) and requires it to be
   same-origin, which the local vendor path satisfies automatically.

No API keys, no network calls, no third-party origins involved in any of
this — everything above happens in the browser, from files this app
serves itself.

---

## Running it locally

PDF.js's module worker requires a real HTTP origin — opening `index.html`
directly as a `file://` URL will not work for PDF uploads (this is a
browser security restriction on module workers, unrelated to needing
internet access). Use a local static server:

```bash
npm install     # installs pdfjs-dist and vendors it into vendor/pdfjs
npm run dev
```

This runs `npx serve .` and prints a local URL (usually
`http://localhost:5173`) to open in your browser. If you skip
`npm install`, the app still works locally because `vendor/pdfjs/` is
already committed to the repo — `npm install` just keeps it current.

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
   - **Install Command:** leave as the default (`npm install`). Don't
     disable installs — that's what runs `postinstall` and vendors
     PDF.js from `pdfjs-dist` into `vendor/pdfjs`. (In practice this is
     a safety net rather than a hard requirement, since `vendor/pdfjs/`
     is already committed to the repo either way.)
5. Click **Deploy**.

No other Vercel settings need to change from before. There's still no
`vercel.json`, and nothing here depends on a serverless function.

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

## PDF error messages

`js/pdf-reader.js` distinguishes several failure modes instead of showing
one generic error, and none of them blame "your internet connection"
unless a network issue is actually possible:

| What happened | Message shown |
|---|---|
| `/vendor/pdfjs/pdf.min.mjs` didn't load (e.g. missing from the deployment) | "PDF.js didn't load from this app's own files… This isn't an internet connectivity issue — it usually means the vendor files weren't deployed." |
| The file isn't a valid PDF, or is corrupted | "This file doesn't look like a valid PDF." |
| The PDF requires a password | "This PDF is password-protected." |
| The PDF opened fine but has no text layer anywhere (e.g. a scanned image) | Shown as a page banner, not a blocking error — the document still loads, pages just show "no extractable text on this page." |
| Something else went wrong reading a valid PDF | "PDF.js loaded, but this file couldn't be read." |

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
