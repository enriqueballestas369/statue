/**
 * pdf-reader.js
 * Loads a PDF entirely in the browser with PDF.js, extracts each page's
 * text layer, and hands back plain page objects for app.js to render.
 * The uploaded file never leaves the browser — there is no upload
 * endpoint and no server involved.
 *
 * PDF.js itself is served from this app's own /vendor/pdfjs folder (see
 * scripts/copy-pdfjs.js), not from a CDN. It's loaded with a dynamic
 * import() so this file can stay a plain classic script like the rest of
 * the app's JS, while still importing the ES module build pdfjs-dist
 * ships. Paths are absolute ("/vendor/...") so this resolves the same
 * way locally and once deployed, regardless of which page or folder
 * depth the calling script lives at.
 */

const PDFJS_LIB_PATH = "/vendor/pdfjs/pdf.min.mjs";
const PDFJS_WORKER_PATH = "/vendor/pdfjs/pdf.worker.min.mjs";

/**
 * A typed error so app.js can show a specific, accurate message instead
 * of a generic one. `code` is one of:
 *   LIB_INIT_FAILED    - the local PDF.js files didn't load at all
 *   INVALID_PDF        - the file isn't a readable/valid PDF
 *   PASSWORD_PROTECTED - the PDF requires a password PDF.js doesn't have
 *   NO_TEXT            - the PDF loaded fine but has no extractable text anywhere
 *   RENDER_FAILED      - PDF.js loaded and the file is valid, but something
 *                        else went wrong while reading its pages
 */
class PdfLoadError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PdfLoadError";
    this.code = code;
  }
}

let pdfjsLibPromise = null;

/**
 * Loads the local PDF.js module exactly once per page load and points it
 * at the local worker file. Never touches a CDN — if this import fails,
 * it's because /vendor/pdfjs/pdf.min.mjs isn't being served by this
 * deployment, not because of the user's network connection.
 */
function getPdfjsLib() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import(PDFJS_LIB_PATH)
      .then((mod) => {
        // pdfjs-dist's ESM build exports everything on the module namespace.
        mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_PATH;
        return mod;
      })
      .catch(() => {
        pdfjsLibPromise = null; // allow a retry on the next upload attempt
        throw new PdfLoadError(
          "LIB_INIT_FAILED",
          "PDF.js didn't load from this app's own files (/vendor/pdfjs). This isn't an internet connectivity issue — it usually means the vendor files weren't deployed. See the README's Vercel section."
        );
      });
  }
  return pdfjsLibPromise;
}

/**
 * @param {File} file
 * @returns {Promise<{numPages: number, pages: {pageNum:number, text:string}[], hasAnyText: boolean}>}
 */
async function extractPdfText(file) {
  const pdfjsLib = await getPdfjsLib();

  const arrayBuffer = await file.arrayBuffer();

  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  } catch (err) {
    if (err && err.name === "PasswordException") {
      throw new PdfLoadError(
        "PASSWORD_PROTECTED",
        "This PDF is password-protected. Remove the password (or export an unprotected copy) and upload it again."
      );
    }
    if (err && err.name === "InvalidPDFException") {
      throw new PdfLoadError(
        "INVALID_PDF",
        "This file doesn't look like a valid PDF. It may be corrupted, or not actually a PDF despite the file name."
      );
    }
    throw new PdfLoadError(
      "RENDER_FAILED",
      "PDF.js loaded, but this file couldn't be read. It may be damaged or use a feature this reader doesn't support."
    );
  }

  const pages = [];
  let hasAnyText = false;

  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const rawText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (rawText.length > 0) hasAnyText = true;
      pages.push({ pageNum: i, text: rawText });
    } catch (err) {
      // Best-effort: one bad page shouldn't take down the whole document.
      pages.push({ pageNum: i, text: "", pageError: true });
    }
  }

  if (!hasAnyText) {
    // Not necessarily an error the user needs to retry from — the PDF
    // loaded and rendered fine, it just has no text layer anywhere
    // (common for scanned documents). Surfaced as a distinct code so
    // app.js can explain this rather than call it a load failure.
    const noTextError = new PdfLoadError(
      "NO_TEXT",
      "This PDF loaded, but no page has extractable text — it's likely a scanned image without a text layer. OCR isn't included in this build."
    );
    noTextError.pages = pages;
    noTextError.numPages = pdf.numPages;
    throw noTextError;
  }

  return { numPages: pdf.numPages, pages, hasAnyText };
}

/**
 * Splits a page's flat text into rough paragraphs so long pages are
 * readable. This is a simple heuristic (sentence-run length), not a layout
 * reconstruction — good enough for reading, not a facsimile of the PDF.
 */
function reflowIntoParagraphs(text, targetLen = 500) {
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  const paragraphs = [];
  let current = "";
  sentences.forEach((s) => {
    current += s;
    if (current.length >= targetLen) {
      paragraphs.push(current.trim());
      current = "";
    }
  });
  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs;
}
