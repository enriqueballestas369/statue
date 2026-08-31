/**
 * glossary.js
 * A small, static dictionary of common legal terms and a function that
 * scans rendered document text and wraps exact matches with a definition
 * on click. This is deterministic pattern matching against a fixed list —
 * not AI-generated interpretation of the document.
 */

const LEGAL_GLOSSARY = [
  { term: "motion", def: "A formal request asking a court to take an action or make a ruling." },
  { term: "summary judgment", def: "A request asking the court to decide a claim without a trial because no material factual dispute requires one." },
  { term: "jurisdiction", def: "A court's or agency's legal authority to hear a case or regulate a subject." },
  { term: "standing", def: "A party's legal right to bring a claim, usually requiring a concrete, particular injury." },
  { term: "holding", def: "The court's actual decision on the legal issue presented — distinct from background discussion." },
  { term: "remand", def: "When a court sends an issue back to a lower court or agency for further action." },
  { term: "vacatur", def: "When a court sets aside or nullifies a rule, order, or decision." },
  { term: "vacate", def: "To set aside or nullify a legal rule, order, or decision." },
  { term: "injunction", def: "A court order requiring a party to do, or stop doing, a specific act." },
  { term: "petitioner", def: "The party who brings a petition asking a court or agency to act." },
  { term: "respondent", def: "The party responding to a petition or appeal." },
  { term: "plaintiff", def: "The party who initiates a lawsuit." },
  { term: "defendant", def: "The party being sued or accused in a legal proceeding." },
  { term: "promulgate", def: "To formally issue or publish a regulation." },
  { term: "arbitrary and capricious", def: "A legal standard describing agency action made without a rational basis or without properly considering the evidence." },
  { term: "statutory authority", def: "The specific power a statute gives to an agency or official to act." },
  { term: "final rule", def: "A regulation an agency has formally adopted after notice and public comment, as opposed to a proposal." },
  { term: "effective date", def: "The date a law, rule, or order actually begins to apply." },
  { term: "remedy", def: "What a court orders to address a violation — for example, an injunction, damages, or remand." },
  { term: "procedural posture", def: "The stage a case is at in the litigation process (e.g., motion to dismiss, summary judgment, appeal)." },
  { term: "notice and comment", def: "The rulemaking process where an agency proposes a rule publicly and considers public comments before finalizing it." },
  { term: "interlocutory appeal", def: "An appeal of a court order before the case has fully concluded, allowed only in limited circumstances." },
  { term: "de novo", def: "Reviewed fresh, without deference to a prior decision-maker's conclusion." },
  { term: "preponderance of the evidence", def: "The standard of proof in most civil cases: more likely than not." },
  { term: "shall", def: "In legal drafting, typically signals a mandatory requirement." },
  { term: "may", def: "In legal drafting, typically signals discretion or permission, not a requirement." },
  { term: "notwithstanding", def: "Despite — signals that the following text overrides something stated elsewhere." },
  { term: "provided that", def: "Introduces a condition or exception to what was just stated." }
];

/**
 * Wraps exact (case-insensitive, word-boundary) matches of glossary terms
 * inside a container element with a .term span carrying a hidden definition.
 * Longer phrases are matched before shorter ones so "summary judgment"
 * isn't partially swallowed by a shorter term.
 */
function applyGlossary(containerEl) {
  const sorted = [...LEGAL_GLOSSARY].sort((a, b) => b.term.length - a.term.length);
  const walker = document.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.trim().length) textNodes.push(node);
  }

  textNodes.forEach((textNode) => {
    let html = escapeHtml(textNode.nodeValue);
    let matchedAny = false;

    sorted.forEach(({ term, def }) => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b(${escapedTerm})\\b`, "gi");
      if (re.test(html)) {
        matchedAny = true;
        html = html.replace(
          re,
          (m) =>
            `<span class="term" data-term="${escapeHtml(term)}">${m}<span class="term-def">${escapeHtml(def)}</span></span>`
        );
      }
    });

    if (matchedAny) {
      const span = document.createElement("span");
      span.innerHTML = html;
      textNode.parentNode.replaceChild(span, textNode);
    }
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function wireGlossaryClicks(containerEl) {
  containerEl.querySelectorAll(".term").forEach((t) => {
    t.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = t.classList.contains("show-def");
      containerEl.querySelectorAll(".term").forEach((x) => x.classList.remove("show-def"));
      if (!isOpen) t.classList.add("show-def");
    });
  });
}
