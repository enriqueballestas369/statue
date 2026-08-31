/**
 * api.js
 * This is the single place the rest of the app calls out for anything that
 * would eventually be AI-assisted. Right now every function here is a
 * "not connected yet" stub — no network calls, no fabricated answers.
 *
 * When a server-side AI API is added (e.g. a Vercel serverless function
 * under /api/analyze.js calling the Anthropic API), only the bodies of
 * these functions need to change to `fetch('/api/...')` calls. Nothing
 * in app.js, pdf-reader.js, glossary.js, or citations.js needs to change,
 * because they only ever talk to this module.
 */

const StatuteAPI = {
  /**
   * Whether a live AI backend is currently connected. The UI uses this to
   * decide whether to show "Analyze for me" as a working feature or as a
   * clearly-labeled placeholder.
   */
  isConnected() {
    return false;
  },

  /**
   * Future: ask the backend to explain a selected passage in plain English,
   * grounded in the passage itself.
   * Today: returns null so the UI falls back to a manual note field.
   */
  async explainPassage(selectedText, documentContext) {
    if (!this.isConnected()) return null;
    // const res = await fetch('/api/explain', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ selectedText, documentContext })
    // });
    // return res.json();
  },

  /**
   * Future: ask the backend to define a selected term in this document's context.
   */
  async definePassage(selectedText, documentContext) {
    if (!this.isConnected()) return null;
  },

  /**
   * Future: run the full "Analyze for me" pass — five questions, each answer
   * tied to evidence spans validated against the actual document text.
   */
  async analyzeDocument(documentText, userQuestion) {
    if (!this.isConnected()) return null;
  }
};
