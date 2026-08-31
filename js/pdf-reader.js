/**
 * pdf-reader.js
 * Loads a PDF entirely in the browser with PDF.js, extracts each page's
 * text layer, and hands back plain page objects for app.js to render.
 * The file never leaves the browser — there is no upload endpoint.
 */

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js";
}

/**
 * @param {File} file
 * @returns {Promise<{numPages: number, pages: {pageNum:number, text:string}[]}>}
 */
async function extractPdfText(file) {
  if (!window.pdfjsLib) {
    throw new Error("PDF.js failed to load. Check your internet connection and try again.");
  }
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // Join text items with a space; PDF.js does not preserve line breaks
    // reliably across all PDFs, so we reflow into paragraphs on the fly.
    const rawText = content.items.map((item) => item.str).join(" ").replace(/\s+/g, " ").trim();
    pages.push({ pageNum: i, text: rawText });
  }

  return { numPages: pdf.numPages, pages };
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
