(() => {
  const STARTERS = {
    ISSUE: ["The issue before the court is whether…", "The dispute centers on whether…", "The court must determine whether…"],
    RULE: ["The governing rule provides that…", "Under the applicable legal standard,…", "The court applies the rule that…"],
    HOLDING: ["The court held that…", "The court concluded that…", "The court determined that…"],
    REASONING: ["The court reasoned that…", "The court reached this conclusion because…", "In applying the rule, the court explained that…"],
    REMEDY: ["As a result, the court ordered…", "For the remedy, the court…", "The court therefore directed…"],
    LIMITS: ["The court did not decide…", "The decision leaves unresolved…", "The court limited its decision by…"],
    NEXT: ["The next procedural step is…", "The court directed the parties to…", "After this decision,…"]
  };

  function ensureStyles() {
    if (document.getElementById("statuteWritingCoachStyles")) return;
    const style = document.createElement("style");
    style.id = "statuteWritingCoachStyles";
    style.textContent = `
      .writing-help{margin-top:8px;border-top:1px solid var(--border,#ddd);padding-top:8px}
      .writing-help-toggle{font:500 12px/1.3 system-ui,sans-serif;background:transparent;border:0;padding:3px 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px;color:var(--muted,#666)}
      .writing-help-panel{margin-top:7px;padding:9px 10px;border:1px solid var(--border,#ddd);border-radius:7px;background:rgba(120,120,120,.035);font:12px/1.45 system-ui,sans-serif}
      .writing-help-panel[hidden]{display:none}
      .writing-help-panel p{margin:0 0 7px}
      .starter-list{display:flex;flex-wrap:wrap;gap:6px}
      .starter-btn{font:500 12px/1.3 system-ui,sans-serif;text-align:left;border:1px solid var(--border,#ccc);background:var(--panel,#fff);border-radius:6px;padding:6px 8px;cursor:pointer;color:inherit}
      .starter-btn:hover,.starter-btn:focus-visible{border-color:currentColor;outline:none}
      .starter-note{margin-top:7px!important;color:var(--muted,#666);font-size:11px}
    `;
    document.head.appendChild(style);
  }

  function enhanceWriting() {
    const guide = document.getElementById("guidePane");
    if (!guide) return;
    guide.querySelectorAll(".analysis-step").forEach(step => {
      if (step.dataset.writingHelp) return;
      const label = step.querySelector("summary small")?.textContent.trim().toUpperCase();
      const textarea = step.querySelector("textarea");
      const starters = STARTERS[label];
      if (!textarea || !starters) return;
      step.dataset.writingHelp = "true";

      const wrap = document.createElement("div");
      wrap.className = "writing-help";
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "writing-help-toggle";
      toggle.textContent = "Writing help · I don't know how to start";
      toggle.setAttribute("aria-expanded", "false");

      const panel = document.createElement("div");
      panel.className = "writing-help-panel";
      panel.hidden = true;
      panel.innerHTML = `<p><strong>Choose only a starting pattern.</strong> Statute will not complete the legal conclusion for you.</p><div class="starter-list"></div><p class="starter-note">Use the opening if it fits what you actually found in the source. You can change or delete it.</p>`;
      const list = panel.querySelector(".starter-list");
      starters.forEach(text => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "starter-btn";
        btn.textContent = text;
        btn.addEventListener("click", () => {
          if (!textarea.value.trim()) textarea.value = text;
          else textarea.value += `${textarea.value.endsWith(" ") ? "" : " "}${text}`;
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
          panel.hidden = true;
          toggle.setAttribute("aria-expanded", "false");
          toggle.textContent = "Writing help";
        });
        list.appendChild(btn);
      });

      toggle.addEventListener("click", () => {
        panel.hidden = !panel.hidden;
        toggle.setAttribute("aria-expanded", String(!panel.hidden));
      });
      wrap.append(toggle, panel);
      textarea.insertAdjacentElement("afterend", wrap);
    });
  }

  function wire() {
    ensureStyles();
    const analyze = document.getElementById("modeAnalyze");
    if (analyze && !analyze.dataset.writingCoachWired) {
      analyze.dataset.writingCoachWired = "true";
      analyze.addEventListener("click", () => setTimeout(enhanceWriting, 20));
    }
    document.getElementById("tabGuide")?.addEventListener("click", () => setTimeout(enhanceWriting, 0));
  }

  document.addEventListener("DOMContentLoaded", wire);
})();