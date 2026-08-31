(() => {
  const DEFINITIONS = {
    "ISSUE": "The specific legal question or dispute the court or decision-maker must resolve.",
    "RULE": "The controlling legal standard used to decide the issue, such as a statute, regulation, or prior case.",
    "HOLDING": "What the court actually decided on the legal issue. This is different from background discussion or a party's argument.",
    "REASONING": "Why the court or agency reached its conclusion — how it applied the legal rule to the facts or arguments.",
    "REMEDY": "What the court does about the legal problem it found, such as vacating a rule, issuing an injunction, awarding relief, or sending an issue back to an agency.",
    "LIMITS": "What the decision does not resolve, including issues the court leaves open, reserves, or declines to reach.",
    "NEXT": "What happens procedurally after this document, such as further briefing, remand, appeal, implementation, or a deadline.",
    "BACKGROUND / FACTS": "The factual and procedural context needed to understand the dispute before the legal analysis begins.",
    "RULE / LEGAL STANDARD": "The law or test the court uses to evaluate the issue.",
    "REASONING / ANALYSIS": "The section where the court applies the governing law to the facts and arguments.",
    "HOLDING / REMEDY": "The part that identifies what the court decided and what it orders as a result.",
    "JURISDICTION": "The legal authority of a court or agency to hear a case or act on a particular matter.",
    "LEGAL AUTHORITY": "The statute, regulation, precedent, or delegated power that permits or controls the legal action.",
    "DEFINITIONS": "Terms the legal document gives a specific meaning. These definitions may differ from ordinary everyday usage.",
    "EXCEPTIONS / LIMITS": "Language that narrows the general rule or identifies situations where it does not apply fully.",
    "OPERATIVE RULE": "The part of the text that actually creates a duty, right, prohibition, permission, or requirement.",
    "ENFORCEMENT / CONSEQUENCE": "What can happen if the rule is violated or how the requirement can be enforced.",
    "WHEN IT APPLIES": "The effective date, triggering event, or other timing condition that determines when the rule becomes applicable.",
    "DOCUMENT SECTION": "An organizational heading from the original document. Statute adds a learning label only to help you recognize its function.",
    "AUTHORITY": "The legal source or delegated power that allows a court, agency, or official to act.",
    "SCOPE": "Who, what, or which situations the legal rule covers.",
    "TRIGGER": "The event or condition that makes a legal rule begin to apply.",
    "CONDITIONS": "Requirements that must be satisfied before the rule or legal consequence applies.",
    "EXCEPTIONS": "Situations carved out from a broader rule.",
    "DOCUMENTATION": "Records, notices, filings, or proof that the law requires someone to create, keep, or provide.",
    "EFFECT": "The legal or practical consequence once the rule applies.",
    "ENFORCEMENT": "The mechanism used to make a legal requirement effective, including penalties, agency action, or court remedies.",
    "PURPOSE": "Why the document or provision exists and the problem it is intended to address.",
    "INTERPRETATION": "How a court or agency explains the meaning of a legal rule or text.",
    "INSTRUCTIONS": "Practical steps the document tells the reader to follow.",
    "ACTION": "What the reader, agency, employer, party, or other actor is expected to do next.",
    "CONTEXT": "The surrounding facts, history, and legal setting needed to understand the document.",
    "RULE / DECISION": "The operative rule or the actual legal decision that matters most in the document.",
    "IMPACT": "Who is affected and what changes legally or practically.",
    "WHY": "The stated reason the agency, court, or drafter is taking the action.",
    "OLD RULE": "The legal rule or practice that existed before the change described in the document.",
    "NEW RULE": "The new legal requirement, standard, or practice created or adopted by the document.",
    "EFFECTIVE DATE": "The date the legal change actually begins to apply. It may differ from the publication date.",
    "WHO": "The person, employer, employee, agency, or other actor to whom the rule applies."
  };

  function normalize(text) {
    return String(text || "").replace(/\s+/g, " ").trim().toUpperCase();
  }

  function getDefinition(text) {
    const key = normalize(text);
    if (DEFINITIONS[key]) return DEFINITIONS[key];
    if (key.includes("HOLDING") && key.includes("REMEDY")) return DEFINITIONS["HOLDING / REMEDY"];
    if (key.includes("REASONING") || key.includes("ANALYSIS")) return DEFINITIONS["REASONING"];
    if (key.includes("LEGAL STANDARD")) return DEFINITIONS["RULE"];
    if (key.includes("REMEDY")) return DEFINITIONS["REMEDY"];
    if (key.includes("LIMIT")) return DEFINITIONS["LIMITS"];
    return null;
  }

  function decorate(el) {
    if (!el || el.dataset.definitionWired === "true") return;
    const def = getDefinition(el.textContent);
    if (!def) return;

    el.dataset.definitionWired = "true";
    el.classList.add("learning-help");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", `${el.textContent.trim()}: ${def}`);

    const tooltip = document.createElement("span");
    tooltip.className = "learning-help-tooltip";
    tooltip.textContent = def;
    el.appendChild(tooltip);

    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const wasOpen = el.classList.contains("show-learning-help");
      document.querySelectorAll(".show-learning-help").forEach(x => x.classList.remove("show-learning-help"));
      if (!wasOpen) el.classList.add("show-learning-help");
    });
  }

  function scan() {
    document.querySelectorAll(".learning-framework span, .learning-label, .analysis-step small").forEach(decorate);
  }

  function injectStyles() {
    if (document.getElementById("learningDefinitionStyles")) return;
    const style = document.createElement("style");
    style.id = "learningDefinitionStyles";
    style.textContent = `
      .learning-help{position:relative;cursor:help;outline:none;}
      .learning-help:hover,.learning-help:focus{ text-decoration:underline dotted; text-underline-offset:3px; }
      .learning-help-tooltip{
        display:none;position:absolute;left:50%;bottom:calc(100% + 9px);transform:translateX(-50%);
        width:270px;max-width:min(270px,80vw);padding:10px 12px;border-radius:6px;
        background:var(--ink,#211E19);color:#fff;font-family:var(--sans,Arial,sans-serif);
        font-size:12.5px;line-height:1.45;text-transform:none;letter-spacing:normal;font-weight:400;
        z-index:120;box-shadow:0 4px 14px rgba(0,0,0,.16);pointer-events:none;
      }
      .learning-help:hover > .learning-help-tooltip,
      .learning-help:focus > .learning-help-tooltip,
      .learning-help.show-learning-help > .learning-help-tooltip{display:block;}
      .learning-help-tooltip::after{
        content:"";position:absolute;top:100%;left:50%;transform:translateX(-50%);
        border:6px solid transparent;border-top-color:var(--ink,#211E19);
      }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener("click", () => {
    document.querySelectorAll(".show-learning-help").forEach(x => x.classList.remove("show-learning-help"));
  });

  document.addEventListener("DOMContentLoaded", () => {
    injectStyles();
    scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  });
})();
