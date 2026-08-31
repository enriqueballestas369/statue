/**
 * scripts/copy-pdfjs.js
 *
 * This project serves PDF.js as a same-origin static file instead of
 * loading it from a CDN. `pdfjs-dist` ships its build output as plain
 * files (not something a bundler needs to process), so instead of adding
 * a bundler to the whole project, this script just copies the two files
 * the app actually needs — the library and its worker — from
 * node_modules into /vendor/pdfjs, which is a normal folder in the repo
 * that Vercel serves as a static asset alongside everything else.
 *
 * Runs automatically on `npm install` (see package.json "postinstall").
 * The copied files are also committed to the repo, so the app works even
 * if postinstall doesn't run in a given environment — this script just
 * keeps them in sync with whatever version of pdfjs-dist is installed.
 */

const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "node_modules", "pdfjs-dist", "build");
const DEST_DIR = path.join(__dirname, "..", "vendor", "pdfjs");

const FILES = ["pdf.min.mjs", "pdf.worker.min.mjs"];

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error(
      `[copy-pdfjs] Could not find ${SRC_DIR}. Is pdfjs-dist installed? Run "npm install" first.`
    );
    process.exit(1);
  }

  fs.mkdirSync(DEST_DIR, { recursive: true });

  FILES.forEach((file) => {
    const src = path.join(SRC_DIR, file);
    const dest = path.join(DEST_DIR, file);
    if (!fs.existsSync(src)) {
      console.error(`[copy-pdfjs] Expected file missing: ${src}`);
      process.exit(1);
    }
    fs.copyFileSync(src, dest);
    console.log(`[copy-pdfjs] Copied ${file} -> vendor/pdfjs/${file}`);
  });

  const version = require(path.join(__dirname, "..", "node_modules", "pdfjs-dist", "package.json")).version;
  fs.writeFileSync(
    path.join(DEST_DIR, "VERSION.txt"),
    `pdfjs-dist ${version}\nCopied by scripts/copy-pdfjs.js on ${new Date().toISOString()}\n`
  );
  console.log(`[copy-pdfjs] Done (pdfjs-dist ${version}).`);
}

main();
