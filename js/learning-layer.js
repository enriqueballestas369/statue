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

  const TERM_DEFINITIONS = {
    "ISSUE": "The specific legal question or dispute the court or decision-maker must resolve.",
    "RULE": "The controlling legal standard used to decide the issue, such as a statute, regulation, or prior case.",
    "HOLDING": "What the court actually decided on the legal issue, not merely what it discussed or what a party argued.",
    "REASONING": "Why the court reached its conclusion — how it applied the legal rule to the facts and arguments.",
    "REMEDY": "What the court does as a result, such as vacating a rule, issuing an injunction, awarding relief, or sending the matter back.",
    "LIMITS": "What the decision does not resolve, including issues the court leaves open or declines to reach.",
    "NEXT": "What happens procedurally after this document, such as further briefing, remand, appeal, implementation, or a deadline.",
    "BACKGROUND / FACTS": "The factual and procedural context needed to understand the dispute before the legal analysis begins.",
    "RULE / LEGAL STANDARD": "The law or test the court uses to evaluate the issue.",
    "REASONING / ANALYSIS": "The part where the court applies the governing law to the facts and arguments.",
    "HOLDING / REMEDY": "What the court actually decided and what it orders as a result. The holding is the legal decision; the remedy is the action the court takes because of that decision.",
    "JURISDICTION": "The legal authority of a court or agency to hear a case or act on a matter.",
    "WHEN IT APPLIES": "The effective date, triggering event, or timing condition that determines when the rule applies.",
    "LEGAL AUTHORITY": "The statute, regulation, precedent, or delegated power that permits or controls the legal action.",
    "DEFINITIONS": "Terms the legal document gives a specific meaning, which may differ from everyday usage.",
    "EXCEPTIONS / LIMITS": "Language that narrows the general rule or identifies situations where it does not fully apply.",
    "OPERATIVE RULE": "The part of the text that actually creates a duty, right, prohibition, permission, or requirement.",
    "ENFORCEMENT / CONSEQUENCE": "What can happen if the rule is violated or how the requirement can be enforced.",
    "SCOPE": "Who, what, or which situations the legal rule covers.",
    "WHO": "The person, employer, employee, agency, or other actor to whom the rule applies.",
    "TRIGGER": "The event or condition that makes a legal rule begin to apply.",
    "CONDITIONS": "Requirements that must be satisfied before the rule or legal consequence applies.",
    "EXCEPTIONS": "Situations carved out from a broader rule.",
    "DOCUMENTATION": "Records, notices, filings, or proof the law requires someone to create, keep, or provide.",
    "EFFECT": "The legal or practical consequence once the rule applies.",
    "ENFORCEMENT": "The mechanism used to make a legal requirement effective, including penalties, agency action, or court remedies.",
    "AUTHORITY": "The legal source or delegated power that allows a court, agency, or official to act.",
    "PURPOSE": "Why the document or provision exists and the problem it is intended to address.",
    "INTERPRETATION": "How a court or agency explains the meaning of a legal rule or text.",
    "INSTRUCTIONS": "Practical steps the document tells the reader to follow.",
    "ACTION": "What the reader or other actor is expected to do next.",
    "CONTEXT": "The surrounding facts, history, and legal setting needed to understand the document.",
    "RULE / DECISION": "The operative rule or the actual legal decision that matters most in the document.",
    "IMPACT": "Who is affected and what changes legally or practically.",
    "WHY": "The stated reason the agency, court, or drafter is taking the action.",
    "OLD RULE": "The legal rule or practice that existed before the change.",
    "NEW RULE": "The new legal requirement, standard, or practice created or adopted by the document.",
    "EFFECTIVE DATE": "The date the legal change actually begins to apply. It may differ from the publication date.",
    "DOCUMENT SECTION": "A structural heading in the original document. Statute is not assigning a legal conclusion to it."
  };

  let supportLevel = localStorage.getItem("statute-reading-support") || "high";
  let lastAnnotatedRoot = null;

  function definitionFor(label) {
    return TERM_DEFINITIONS[String(label || "").trim().toUpperCase()] || "Legal-reading concept used to help identify the function of this part of the document.";
  }

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

  function normalizedStart(text) {
    return text.trim().replace(/\s+/g, " ").slice(0, 180);
  }

  function likelyHeading(text) {
    const clean = text.trim().replace(/\s+/g, " ");
    if (!clean || clean.length > 150) return false;
    return /^((?:[IVXLC]+|\d+|[A-Z])\.?\s+)?[A-Z][A-Za-z\s/&,'’\-()]{2,140}$/.test(clean);
  }

  function sectionFunction(text, type) {
    const start = normalizedStart(text);

    // Court labels must be based on structural headings at the START of a paragraph.
    // A citation, party argument, or ordinary use of words such as “order,” “remedy,”
    // “authority,” or “exception” is not enough to classify the passage.
    if (type === "court") {
      if (/^(?:I\.?\s+)?BACKGROUND\b|^(?:I\.?\s+)?FACTUAL BACKGROUND\b|^PROCEDURAL HISTORY\b/i.test(start)) return "BACKGROUND / FACTS";
      if (/^(?:II\.?\s+)?LEGAL STANDARD\b|^STANDARD OF REVIEW\b/i.test(start)) return "RULE / LEGAL STANDARD";
      if (/^(?:III\.?\s+)?(?:DISCUSSION|ANALYSIS)\b|^ARBITRARY AND CAPRICIOUS CHALLENGE\b|^(?:III|IV)\.?\s+[A-Z][A-Z ]{3,}/.test(start)) return "REASONING / ANALYSIS";
      if (/^(?:V|VI|VII|VIII|IX|X)\.?\s+REMED(?:Y|IES)\b|^REMED(?:Y|IES)\b/i.test(start)) return "REMEDY";
      if (/^(?:V|VI|VII|VIII|IX|X)\.?\s+(?:CONCLUSION(?: AND ORDER)?|ORDER)\b|^CONCLUSION(?: AND ORDER)?\b/i.test(start)) return "HOLDING / REMEDY";
      if (/^JURISDICTION\b/i.test(start)) return "JURISDICTION";
      return null;
    }

    // Other legal sources also use conservative heading-first classification.
    if (/^(?:[IVXLC]+\.?\s+)?(?:BACKGROUND|FACTS|PROCEDURAL HISTORY)\b/i.test(start)) return "BACKGROUND / FACTS";
    if (/^(?:[IVXLC]+\.?\s+)?(?:LEGAL STANDARD|STANDARD OF REVIEW)\b/i.test(start)) return "RULE / LEGAL STANDARD";
    if (/^(?:[IVXLC]+\.?\s+)?(?:DISCUSSION|ANALYSIS)\b/i.test(start)) return "REASONING / ANALYSIS";
    if (/^(?:[IVXLC]+\.?\s+)?(?:DEFINITIONS?)\b/i.test(start)) return "DEFINITIONS";
    if (/^(?:[IVXLC]+\.?\s+)?(?:EXCEPTIONS?|EXEMPTIONS?)\b/i.test(start)) return "EXCEPTIONS / LIMITS";
    if (/^(?:[IVXLC]+\.?\s+)?(?:ENFORCEMENT|PENALTIES)\b/i.test(start)) return "ENFORCEMENT / CONSEQUENCE";
    if (/^(?:[IVXLC]+\.?\s+)?(?:EFFECTIVE DATE)\b/i.test(start)) return "WHEN IT APPLIES";
    if (/^(?:[IVXLC]+\.?\s+)?(?:AUTHORITY|STATUTORY AUTHORITY)\b/i.test(start)) return "LEGAL AUTHORITY";
    if (/^(?:[IVXLC]+\.?\s+)?(?:REQUIREMENTS?|OBLIGATIONS?|DUTIES)\b/i.test(start)) return "OPERATIVE RULE";
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
      map.innerHTML = `<div class="learning-map-top"><span class="learning-type">Likely structure: ${escape(config.label)}</span><span class="learning-confidence">Reading aid — source text unchanged</span></div><div class="learning-framework">${config.framework.map(x => `<span title="${escape(definitionFor(x))}">${escape(x)}</span>`).join("<b>→</b>")}</div>`;
      docTitle.insertAdjacentElement("afterend", map);
    }

    root.querySelectorAll("p").forEach((p) => {
      const paragraphText = p.innerText.trim();
      if (!paragraphText || p.querySelector(":scope > .learning-label")) return;
      let label = sectionFunction(paragraphText, type);
      if (!label && likelyHeading(paragraphText)) {
        if (/^(i{1,10}|v?i{0,3}|x)\.?\s+/i.test(paragraphText) || /^\d+[.)]?\s+/.test(paragraphText)) label = "DOCUMENT SECTION";
      }
      if (label) {
        const tag = document.createElement("span");
        tag.className = "learning-label";
        tag.textContent = label;
        tag.title = definitionFor(label);
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
      html += `<details class="analysis-step" ${i === 0 ? "open" : ""}><summary><span>${i + 1}</span><div><small title="${escape(definitionFor(label))}">${escape(label)}</small>${escape(question)}</div></summary><div class="analysis-step-body"><p>${escape(hint)}</p><textarea placeholder="Write what you find in the document…"></textarea><button type="button" class="jump-source">Look back at source</button></div></details>`;
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