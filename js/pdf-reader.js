/**
 * pdf-reader.js
 * Loads a PDF entirely in the browser with PDF.js and extracts text.
 * The uploaded file never leaves the browser.
 */

const PDFJS_LOCAL_LIB = "/vendor/pdfjs/pdf.min.mjs";
const PDFJS_LOCAL_WORKER = "/vendor/pdfjs/pdf.worker.min.mjs";
const PDFJS_CDN_LIB = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
const PDFJS_CDN_WORKER = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

class PdfLoadError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "PdfLoadError";
    this.code = code;
  }
}

let pdfjsLibPromise = null;

async function loadPdfjs() {
  if (pdfjsLibPromise) return pdfjsLibPromise;

  pdfjsLibPromise = (async () => {
    try {
      const mod = await import(PDFJS_LOCAL_LIB);
      mod.GlobalWorkerOptions.workerSrc = PDFJS_LOCAL_WORKER;
      console.info("[Statute] PDF.js loaded locally.");
      return mod;
    } catch (localError) {
      console.warn("[Statute] Local PDF.js unavailable; trying fallback.", localError);
      try {
        const mod = await import(PDFJS_CDN_LIB);
        mod.GlobalWorkerOptions.workerSrc = PDFJS_CDN_WORKER;
        console.info("[Statute] PDF.js loaded from fallback CDN.");
        return mod;
      } catch (cdnError) {
        console.error("[Statute] PDF.js initialization failed.", { localError, cdnError });
        pdfjsLibPromise = null;
        throw new PdfLoadError(
          "LIB_INIT_FAILED",
          "The PDF reader could not initialize. Please reload the page and try again."
        );
      }
    }
  })();

  return pdfjsLibPromise;
}

/**
 * @param {File} file
 * @returns {Promise<{numPages:number,pages:{pageNum:number,text:string}[],hasAnyText:boolean}>}
 */
async function extractPdfText(file) {
  if (!file) throw new PdfLoadError("INVALID_PDF", "No PDF file was selected.");
  if (file.type && file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new PdfLoadError("INVALID_PDF", "Please select a PDF file.");
  }

  const pdfjsLib = await loadPdfjs();
  const arrayBuffer = await file.arrayBuffer();

  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
  } catch (err) {
    console.error("[Statute] PDF open failed.", err);
    if (err?.name === "PasswordException") {
      throw new PdfLoadError("PASSWORD_PROTECTED", "This PDF is password-protected. Please upload an unprotected copy.");
    }
    if (err?.name === "InvalidPDFException" || err?.name === "MissingPDFException") {
      throw new PdfLoadError("INVALID_PDF", "This file could not be read as a valid PDF.");
    }
    throw new PdfLoadError("RENDER_FAILED", "The PDF reader loaded, but this document could not be read.");
  }

  const pages = [];
  let hasAnyText = false;

  for (let i = 1; i <= pdf.numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const text = content.items
        .map(item => (typeof item.str === "string" ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) hasAnyText = true;
      pages.push({ pageNum: i, text });
    } catch (err) {
      console.warn(`[Statute] Could not extract page ${i}.`, err);
      pages.push({ pageNum: i, text: "", pageError: true });
    }
  }

  if (!hasAnyText) {
    const err = new PdfLoadError(
      "NO_TEXT",
      "This PDF opened, but it has no extractable text. It may be a scanned document."
    );
    err.pages = pages;
    err.numPages = pdf.numPages;
    throw err;
  }

  return { numPages: pdf.numPages, pages, hasAnyText };
}

function reflowIntoParagraphs(text, targetLen = 500) {
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text];
  const paragraphs = [];
  let current = "";
  sentences.forEach(sentence => {
    current += sentence;
    if (current.length >= targetLen) {
      paragraphs.push(current.trim());
      current = "";
    }
  });
  if (current.trim()) paragraphs.push(current.trim());
  return paragraphs;
}
