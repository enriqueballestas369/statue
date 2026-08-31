/**
 * glossary.js
 * Static legal-term definitions and acronym expansions for document reading.
 * This is deterministic pattern matching against fixed lists — not AI analysis.
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

// Common acronyms encountered in federal legal, administrative, immigration,
// employment, and H-2A materials. Hovering shows the full name so the reader
// does not have to mentally decode initials while following the source.
const LEGAL_ACRONYMS = [
  { term: "IFR", def: "Interim Final Rule" },
  { term: "NPRM", def: "Notice of Proposed Rulemaking" },
  { term: "FR", def: "Federal Register" },
  { term: "USC", def: "United States Code" },
  { term: "U.S.C.", def: "United States Code" },
  { term: "CFR", def: "Code of Federal Regulations" },
  { term: "C.F.R.", def: "Code of Federal Regulations" },
  { term: "DOL", def: "United States Department of Labor" },
  { term: "USCIS", def: "United States Citizenship and Immigration Services" },
  { term: "DHS", def: "United States Department of Homeland Security" },
  { term: "DOJ", def: "United States Department of Justice" },
  { term: "USDA", def: "United States Department of Agriculture" },
  { term: "ETA", def: "Employment and Training Administration" },
  { term: "OFLC", def: "Office of Foreign Labor Certification" },
  { term: "WHD", def: "Wage and Hour Division" },
  { term: "SWA", def: "State Workforce Agency" },
  { term: "AEWR", def: "Adverse Effect Wage Rate" },
  { term: "H-2A", def: "H-2A Temporary Agricultural Worker Program" },
  { term: "APA", def: "Administrative Procedure Act" },
  { term: "INA", def: "Immigration and Nationality Act" },
  { term: "FLSA", def: "Fair Labor Standards Act" },
  { term: "MSPA", def: "Migrant and Seasonal Agricultural Worker Protection Act" },
  { term: "OSHA", def: "Occupational Safety and Health Administration" },
  { term: "EEOC", def: "Equal Employment Opportunity Commission" },
  { term: "ALJ", def: "Administrative Law Judge" },
  { term: "SOP", def: "Standard Operating Procedure" }
];

/**
 * Wraps exact matches of glossary terms and acronyms in a tooltip span.
 * Longer phrases are matched before shorter ones.
 * Acronyms are case-sensitive to avoid highlighting ordinary words such as
 * "may" or short letter combinations unintentionally.
 */
function applyGlossary(containerEl) {
  const entries = [
    ...LEGAL_GLOSSARY.map((entry) => ({ ...entry, acronym: false })),
    ...LEGAL_ACRONYMS.map((entry) => ({ ...entry, acronym: true }))
  ].sort((a, b) => b.term.length - a.term.length);

  const walker = document.createTreeWalker(containerEl, NodeFilter.SHOW_TEXT, null);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.trim().length) textNodes.push(node);
  }

  textNodes.forEach((textNode) => {
    let html = escapeHtml(textNode.nodeValue);
    let matchedAny = false;

    entries.forEach(({ term, def, acronym }) => {
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const flags = acronym ? "g" : "gi";
      const re = new RegExp(`(?<![A-Za-z0-9])(${escapedTerm})(?![A-Za-z0-9])`, flags);

      if (re.test(html)) {
        matchedAny = true;
        html = html.replace(
          re,
          (m) =>
            `<span class="term${acronym ? " acronym" : ""}" data-term="${escapeHtml(term)}" tabindex="0">${m}<span class="term-def">${acronym ? `<strong>${escapeHtml(term)}</strong> — ` : ""}${escapeHtml(def)}</span></span>`
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
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wireGlossaryClicks(containerEl) {
  containerEl.querySelectorAll(".term").forEach((t) => {
    t.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = t.classList.contains("show-def");
      containerEl.querySelectorAll(".term").forEach((x) => x.classList.remove("show-def"));
      if (!isOpen) t.classList.add("show-def");
    });

    t.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        t.click();
      }
    });
  });
}
