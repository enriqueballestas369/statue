(() => {
  const STRUCTURES = {
    court: {
      label: "Court opinion / order",
      framework: ["Issue", "Rule", "Holding", "Reasoning", "Remedy", "Limits", "Next"],
      prompts: [
        ["ISSUE", "What dispute or legal question is the court actually deciding?", "Look at the caption, introductory paragraphs, and the section where the court frames the parties’ arguments."],
        ["RULE", "What legal standard controls the decision?", "Look for statutes, regulations, precedent, or a section titled Legal Standard / Standard of Review."],
        ["HOLDING", "What did the court actually decide?", "Separate the court’s decision from background discussion and arguments by the parties."],
        ["REASONING", "Why did the court reach that result?", "Follow how the judge applies the rule to the facts and responds to each side’s arguments."],
        ["REMEDY", "What did the court order, vacate, enjoin, remand, deny, or preserve?", "The remedy is not always the same as the legal finding."],
        ["LIMITS", "What did the court not decide?", "Look for reserved issues, limited holdings, later briefing, jurisdiction retained, or claims not reached."],
        ["NEXT", "What happens procedurally after this document?", "Look for deadlines, further briefing, remand, appeal, retained jurisdiction, or implementation steps."]
      ]
    },
    federal_register: {
      label: "Federal Register rule / notice",
      framework: ["Why", "Authority", "Old rule", "New rule", "Effective date", "Impact", "Next"],
      prompts: [
        ["WHY", "Why is the agency issuing this document?", "Find the stated problem, purpose, or policy reason."],
        ["AUTHORITY", "What legal authority does the agency rely on?", "Look for statutory citations and delegations of authority."],
        ["OLD RULE", "What rule or practice existed before this document?", "Identify the baseline before deciding what changed."],
        ["NEW RULE", "What exactly changes?", "Focus on operative language, amended provisions, and mandatory versus discretionary terms."],
        ["EFFECTIVE DATE", "When does the change legally begin to apply?", "Publication date and effective date are often different."],
        ["IMPACT", "Who must change behavior, pay, documentation, or process?", "Identify the regulated parties and the specific consequence."],
        ["NEXT", "Is more rulemaking, comment, litigation, or implementation expected?", "Look for comment periods, future methodology, transition rules, or litigation references."]
      ]
    },
    regulation: {
      label: "Regulation",
      framework: ["Scope", "Who", "Rule", "Trigger", "Conditions", "Exceptions", "Documentation", "Effect"],
      prompts: [
        ["SCOPE", "What subject and situation does this provision govern?", "Start with the heading and surrounding section."],
        ["WHO", "Who is regulated or protected?", "Identify employer, employee, agency, applicant, petitioner, or other defined actor."],
        ["RULE", "What must, may, or may not happen?", "Pay special attention to shall, must, may, may not, and prohibited."],
        ["TRIGGER", "What event makes the rule apply?", "Look for if, when, upon, after, before, or whenever."],
        ["CONDITIONS", "What must be true for the rule to operate?", "Separate conditions from the main duty."],
        ["EXCEPTIONS", "What language limits or overrides the rule?", "Look for except, unless, notwithstanding, and provided that."],
        ["DOCUMENTATION", "What records, notices, filings, or proof are required?", "Identify both content and timing."],
        ["EFFECT", "What happens if the rule applies or is violated?", "Look for approval, denial, liability, enforcement, penalties, or required action."]
      ]
    },
    statute: {
      label: "Statute",
      framework: ["Scope", "Definitions", "Rule", "Conditions", "Exceptions", "Authority", "Enforcement"],
      prompts: [
        ["SCOPE", "What conduct, people, or subject does the statute cover?", "Use the section heading and surrounding provisions."],
        ["DEFINITIONS", "Which defined terms control the meaning?", "A statutory definition can change the ordinary meaning of a word."],
        ["RULE", "What right, duty, prohibition, or power does the statute create?", "Locate the operative verbs."],
        ["CONDITIONS", "What conditions or triggers must be satisfied?", "Track every if, when, before, after, and provided that."],
        ["EXCEPTIONS", "What is carved out?", "Exceptions can narrow an otherwise broad rule."],
        ["AUTHORITY", "What power does the statute give an agency, court, or official?", "Distinguish mandatory duties from delegated discretion."],
        ["ENFORCEMENT", "How is the provision enforced or remedied?", "Look for penalties, causes of action, agency enforcement, or judicial review."]
      ]
    },
    guidance: {
      label: "Agency guidance",
      framework: ["Purpose", "Authority", "Interpretation", "Instructions", "Limits", "Action"],
      prompts: [
        ["PURPOSE", "What question is the agency trying to clarify?", "Start with the title, introduction, and stated purpose."],
        ["AUTHORITY", "What statute or regulation is the guidance interpreting?", "Guidance should be tied back to controlling legal authority."],
        ["INTERPRETATION", "How does the agency read the underlying rule?", "Separate interpretation from the actual text of the statute or regulation."],
        ["INSTRUCTIONS", "What practical steps does the agency recommend or require?", "Check whether the wording is mandatory or advisory."],
        ["LIMITS", "What does this guidance not change?", "Look for disclaimers, nonbinding language, and references to controlling law."],
        ["ACTION", "What should the reader verify or do next?", "Return to the controlling source before treating guidance as the final legal rule."]
      ]
    },
    general: {
      label: "Legal document",
      framework: ["Context", "Authority", "Rule / decision", "Reasoning", "Effect", "Next"],
      prompts: [
        ["CONTEXT", "What kind of legal document is this and what is it trying to do?", "Use the title, issuer, date, caption, and opening paragraphs."],
        ["AUTHORITY", "What legal sources control it?", "Identify statutes, regulations, cases, or delegated authority."],
        ["RULE / DECISION", "What operative legal statement matters most?", "Separate operative language from explanation and background."],
        ["REASONING", "Why does the document reach that result or interpretation?", "Track the connection between authority and conclusion."],
        ["EFFECT", "What changes legally or practically?", "Identify who is affected, when, and how."],
        ["NEXT", "What remains unresolved or happens next?", "Look for deadlines, appeals, implementation, later proceedings, or open questions."]
      ]
    }
  };

  const SECTION_RULES = [
    [/\b(background|factual background|facts|procedural history)\b/i, "BACKGROUND / FACTS"],
    [/\b(legal standard|standard of review)\b/i, "RULE / LEGAL STANDARD"],
    [/\b(discussion|analysis)\b/i, "REASONING / ANALYSIS"],
    [/\b(conclusion and order|conclusion|order)\b/i, "HOLDING / REMEDY"],
    [/\b(remedy|relief)\b/i, "REMEDY"],
    [/\b(jurisdiction)\b/i, "JURISDICTION"],
    [/\b(effective date)\b/i, "WHEN IT APPLIES"],
    [/\b(authority|statutory authority)\b/i, "LEGAL AUTHORITY"],
    [/\b(definitions?)\b/i, "DEFINITIONS"],
    [/\b(exceptions?|exemptions?)\b/i, "EXCEPTIONS / LIMITS"],
    [/\b(requirements?|obligations?|duties)\b/i, "OPERATIVE RULE"],
    [/\b(enforcement|penalties|remedies)\b/i, "ENFORCEMENT / CONSEQUENCE"]
  ];

  let supportLevel = localStorage.getItem("statute-reading-support") || "high";
  let lastAnnotatedRoot = null;

  function getDocumentText() {
    const body = document.querySelector("#docContent .doc-body");
    return body ? body.innerText.replace(/\s+/g, " ").trim() : "";
  }

  function detectType(text) {
    const t = text.toLowerCase();
    if (/united states district court|court of appeals|plaintiff|defendant|summary judgment|memorandum opinion|order on/.test(t)) return "court";
    if (/federal register|interim final rule|final rule|proposed rule|comments must be received|effective date/.test(t)) return "federal_register";
    if (/code of federal regulations|\bc\.f\.r\.|\bcfr\b|§\s*\d+\.\d+/.test(t)) return "regulation";
    if (/united states code|\bu\.s\.c\.|\busc\b|public law|section \d+ of the act/.test(t)) return "statute";
    if (/guidance|frequently asked questions|fact sheet|field assistance bulletin|agency interpretation/.test(t)) return "guidance";
    return "general";
  }

  function likelyHeading(text) {
    const clean = text.trim().replace(/\s+/g, " ");
    if (!clean || clean.length > 150) return false;
    return /^((?:[IVXLC]+|\d+|[A-Z])\.?\s+)?[A-Z][A-Za-z\s/&,'’\-()]{2,140}$/.test(clean) ||
      /^(background|facts|legal standard|standard of review|discussion|analysis|conclusion|order|remedy|jurisdiction|authority|definitions?|exceptions?|requirements?|enforcement)$/i.test(clean);
  }

  function sectionFunction(text) {
    for (const [pattern, label] of SECTION_RULES) {
      if (pattern.test(text)) return label;
    }
    return null;
  }

  function annotateDocument() {
    const root = document.querySelector("#docContent .doc-body");
    if (!root || !root.innerText.trim()) return;
    if (lastAnnotatedRoot === root && root.dataset.learningAnnotated === "true") {
      applySupportLevel();
      return;
    }

    const text = getDocumentText();
    const type = detectType(text);
    root.dataset.docType = type;
    root.dataset.learningAnnotated = "true";

    const oldBanner = document.querySelector(".learning-map");
    if (oldBanner) oldBanner.remove();

    const docTitle = document.querySelector("#docContent .doc-title");
    if (docTitle) {
      const config = STRUCTURES[type];
      const map = document.createElement("div");
      map.className = "learning-map";
      map.innerHTML = `<div class="learning-map-top"><span class="learning-type">Likely structure: ${escape(config.label)}</span><span class="learning-confidence">Reading aid — source text unchanged</span></div><div class="learning-framework">${config.framework.map(x => `<span>${escape(x)}</span>`).join("<b>→</b>")}</div>`;
      docTitle.insertAdjacentElement("afterend", map);
    }

    root.querySelectorAll("p").forEach((p) => {
      const text = p.innerText.trim();
      if (!text || p.querySelector(":scope > .learning-label")) return;
      let label = sectionFunction(text);
      if (!label && likelyHeading(text)) {
        if (/^(i{1,4}|v?i{0,3}|x)\.?\s+/i.test(text) || /^\d+[.)]?\s+/.test(text)) label = "DOCUMENT SECTION";
      }
      if (label) {
        const tag = document.createElement("span");
        tag.className = "learning-label";
        tag.textContent = label;
        tag.title = "Learning label added by Statute. The document text itself has not been changed.";
        p.insertBefore(tag, p.firstChild);
      }
    });

    lastAnnotatedRoot = root;
    ensureSupportControl();
    applySupportLevel();
  }

  function ensureSupportControl() {
    if (document.getElementById("readingSupport")) return;
    const headerRight = document.querySelector(".header-right");
    if (!headerRight) return;
    const wrap = document.createElement("label");
    wrap.className = "support-control";
    wrap.innerHTML = `<span>Reading support</span><select id="readingSupport" aria-label="Reading support level"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option><option value="off">Off</option></select>`;
    headerRight.insertBefore(wrap, headerRight.firstChild);
    const select = wrap.querySelector("select");
    select.value = supportLevel;
    select.addEventListener("change", () => {
      supportLevel = select.value;
      localStorage.setItem("statute-reading-support", supportLevel);
      applySupportLevel();
    });
  }

  function applySupportLevel() {
    document.body.dataset.readingSupport = supportLevel;
  }

  function renderAnalyzeWithMe() {
    const guide = document.getElementById("guidePane");
    const root = document.querySelector("#docContent .doc-body");
    if (!guide || !root || !root.innerText.trim()) return;

    const type = root.dataset.docType || detectType(getDocumentText());
    const config = STRUCTURES[type] || STRUCTURES.general;
    const focus = document.getElementById("determineInput")?.value.trim();

    let html = `<div class="guide-title">Analyze with me — ${escape(config.label)}</div>`;
    if (focus) html += `<div class="relevance-note">Your focus: <strong>${escape(focus)}</strong></div>`;
    html += `<div class="analysis-intro"><strong>You still do the reading.</strong> This mode adapts the questions to the document and directs your attention. It does not replace the source with an AI answer.</div>`;
    html += `<div class="reading-path">`;
    config.prompts.forEach(([label, question, hint], i) => {
      html += `<details class="analysis-step" ${i === 0 ? "open" : ""}><summary><span>${i + 1}</span><div><small>${escape(label)}</small>${escape(question)}</div></summary><div class="analysis-step-body"><p>${escape(hint)}</p><textarea placeholder="Write what you find in the document…"></textarea><button type="button" class="jump-source">Look back at source</button></div></details>`;
    });
    html += `</div><div class="analysis-stuck"><strong>Stuck?</strong> Select a passage in the document and use <em>Explain</em> or <em>Define</em>. The goal is to get more help at the point of difficulty, not skip the reading.</div>`;
    guide.innerHTML = html;

    guide.querySelectorAll(".jump-source").forEach(btn => btn.addEventListener("click", () => {
      document.getElementById("tabDoc")?.click();
      document.getElementById("docPane")?.scrollTo({ top: 0, behavior: "smooth" });
    }));
  }

  function wireAnalyzeMode() {
    const btn = document.getElementById("modeAnalyze");
    if (!btn || btn.dataset.learningWired) return;
    btn.dataset.learningWired = "true";
    btn.textContent = "Analyze with me";
    btn.addEventListener("click", () => setTimeout(renderAnalyzeWithMe, 0));
  }

  function escape(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  const observer = new MutationObserver(() => {
    wireAnalyzeMode();
    annotateDocument();
    const analyze = document.getElementById("modeAnalyze");
    if (analyze?.classList.contains("active") && document.querySelector("#docContent .doc-body")) {
      const placeholder = document.querySelector("#guidePane .analyze-placeholder");
      if (placeholder) renderAnalyzeWithMe();
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    wireAnalyzeMode();
    annotateDocument();
    observer.observe(document.body, { childList: true, subtree: true });
  });
})();
