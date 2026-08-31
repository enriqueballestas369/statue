/**
 * citations.js
 * Detects common legal citation patterns (U.S.C., C.F.R.) in rendered text
 * with a regex and turns them into links to public, official-ish lookup
 * tools the user opens themselves. This performs no automatic search or
 * network request on the user's behalf — it only builds a URL from the
 * citation text and lets the user choose to open it.
 */

const CITATION_PATTERNS = [
  {
    // e.g. "8 U.S.C. § 1188" or "8 U.S.C. 1188"
    re: /\b(\d+)\s*U\.?S\.?C\.?\s*§?\s*(\d+[a-zA-Z0-9\-.]*)/g,
    build: (m) => `https://www.law.cornell.edu/uscode/text/${m[1]}/${m[2]}`
  },
  {
    // e.g. "20 C.F.R. § 655.122" or "20 CFR 655.122"
    re: /\b(\d+)\s*C\.?F\.?R\.?\s*§?\s*(\d+(\.\d+)?)/g,
    build: (m) => `https://www.ecfr.gov/current/title-${m[1]}/section-${m[2]}`
  }
];

function escapeHtmlForCitations(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Scans a container's text and wraps citation-like matches in a clickable
 * link that opens the source in a new tab. Called once per rendered page,
 * after applyGlossary (glossary matching runs on plain text nodes first;
 * this runs second and rebuilds any node it touches as HTML).
 */
function applyCitations(containerEl) {
  const walker = document.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.trim().length) textNodes.push(node);
  }

  textNodes.forEach((textNode) => {
    let html = escapeHtmlForCitations(textNode.nodeValue);
    let matchedAny = false;

    CITATION_PATTERNS.forEach(({ re, build }) => {
      const fresh = new RegExp(re.source, re.flags);
      html = html.replace(fresh, (...args) => {
        matchedAny = true;
        const match = args.slice(0, -2); // strip offset & full string args
        const url = build(match);
        return `<a class="xref" target="_blank" rel="noopener" href="${url}" title="Open on an official/public lookup site">${match[0]}</a>`;
      });
    });

    if (matchedAny) {
      const span = document.createElement("span");
      span.innerHTML = html;
      textNode.parentNode.replaceChild(span, textNode);
    }
  });
}
