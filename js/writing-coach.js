(() => {
  const COACH = {
    ISSUE: {
      starters: ["The issue before the court is whether…", "The dispute centers on whether…", "The court must determine whether…"],
      pieces: [["ACTOR", "Who took the action being challenged?"], ["ACTION", "What exactly did that person or agency do?"], ["CHALLENGE", "What does the challenging party say was legally wrong?"], ["AUTHORITY", "What law or legal standard governs the challenge?"], ["QUESTION", "Can you turn those pieces into a ‘whether’ question?"]]
    },
    RULE: {
      starters: ["The governing rule provides that…", "Under the applicable legal standard,…", "The court applies the rule that…"],
      pieces: [["AUTHORITY", "What statute, regulation, or case supplies the rule?"], ["STANDARD", "What legal test or standard does it state?"], ["REQUIREMENT", "What must, may, or may not happen under that rule?"]]
    },
    HOLDING: {
      starters: ["The court held that…", "The court concluded that…", "The court determined that…"],
      pieces: [["DECISION-MAKER", "Who is making the legal decision?"], ["DECISION", "What did the court actually decide?"], ["SCOPE", "How broad or narrow is that decision?"], ["LIMIT", "What should you avoid claiming the court decided?"]]
    },
    REASONING: {
      starters: ["The court reasoned that…", "The court reached this conclusion because…", "In applying the rule, the court explained that…"],
      pieces: [["RULE", "What legal rule is the court applying here?"], ["APPLICATION", "What fact, action, or explanation is the court evaluating?"], ["WHY", "Why does the court think it satisfies or fails the rule?"], ["CONCLUSION", "What conclusion follows from that reasoning?"]]
    },
    REMEDY: {
      starters: ["As a result, the court ordered…", "For the remedy, the court…", "The court therefore directed…"],
      pieces: [["COURT ACTION", "What did the court order, vacate, remand, enjoin, deny, or preserve?"], ["EFFECT", "What changes because of that order?"], ["REMAINS", "What is still unresolved or must happen next?"]]
    },
    LIMITS: {
      starters: ["The court did not decide…", "The decision leaves unresolved…", "The court limited its decision by…"],
      pieces: [["NOT DECIDED", "What issue did the court expressly leave open?"], ["BOUNDARY", "What would go beyond the court’s actual decision?"]]
    },
    NEXT: {
      starters: ["The next procedural step is…", "The court directed the parties to…", "After this decision,…"],
      pieces: [["WHO", "Who must act next?"], ["ACTION", "What must happen?"], ["WHEN", "Is there a deadline or triggering event?"]]
    }
  };

  function ensureStyles() {
    if (document.getElementById("statuteWritingCoachStyles")) return;
    const style = document.createElement("style");
    style.id = "statuteWritingCoachStyles";
    style.textContent = `
      .writing-help{margin-top:8px;border-top:1px solid var(--border,#ddd);padding-top:8px;font:12px/1.45 system-ui,sans-serif}
      .writing-tools{display:flex;flex-wrap:wrap;gap:5px}
      .writing-help-toggle{font:500 12px/1.3 system-ui,sans-serif;background:transparent;border:0;padding:4px 5px;cursor:pointer;border-radius:5px;color:var(--muted,#666)}
      .writing-help-toggle:hover,.writing-help-toggle:focus-visible{background:rgba(100,100,100,.07);outline:none;color:inherit}
      .writing-help-panel{margin-top:7px;padding:10px;border:1px solid var(--border,#ddd);border-radius:7px;background:rgba(120,120,120,.035)}
      .writing-help-panel[hidden]{display:none}.writing-help-panel p{margin:0 0 7px}.writing-help-panel h4{margin:0 0 7px;font-size:12px}
      .starter-list{display:flex;flex-wrap:wrap;gap:6px}.starter-btn{font:500 12px/1.3 system-ui,sans-serif;text-align:left;border:1px solid var(--border,#ccc);background:var(--panel,#fff);border-radius:6px;padding:6px 8px;cursor:pointer;color:inherit}.starter-btn:hover,.starter-btn:focus-visible{border-color:currentColor;outline:none}
      .starter-note,.coach-note{margin-top:7px!important;color:var(--muted,#666);font-size:11px}
      .thought-pieces{display:grid;gap:7px}.thought-piece{display:grid;grid-template-columns:92px 1fr;gap:7px;align-items:start}.thought-piece label{font:600 10px/1.3 system-ui,sans-serif;letter-spacing:.04em;color:var(--muted,#666);padding-top:7px}.thought-piece input{width:100%;box-sizing:border-box;border:1px solid var(--border,#ccc);border-radius:5px;background:var(--panel,#fff);color:inherit;padding:6px 7px;font:12px/1.35 system-ui,sans-serif}
      .coach-action{margin-top:8px;border:1px solid var(--border,#ccc);background:transparent;color:inherit;border-radius:6px;padding:6px 8px;font:600 11px/1.2 system-ui,sans-serif;cursor:pointer}.coach-action:hover{border-color:currentColor}
      .writing-feedback{display:grid;gap:7px}.feedback-item{border-left:2px solid var(--border,#bbb);padding-left:8px}.feedback-item strong{display:block;font-size:11px}.feedback-item span{color:var(--muted,#666)}
      @media(max-width:700px){.thought-piece{grid-template-columns:1fr;gap:2px}.thought-piece label{padding-top:0}}
    `;
    document.head.appendChild(style);
  }

  function openPanel(wrap, kind) {
    wrap.querySelectorAll(".writing-help-panel").forEach(p => p.hidden = p.dataset.kind !== kind || !p.hidden === false);
    const target = wrap.querySelector(`.writing-help-panel[data-kind="${kind}"]`);
    if (!target) return;
    const wasHidden = target.hidden;
    wrap.querySelectorAll(".writing-help-panel").forEach(p => p.hidden = true);
    target.hidden = !wasHidden;
  }

  function starterPanel(config, textarea) {
    const panel = document.createElement("div"); panel.className = "writing-help-panel"; panel.dataset.kind = "start"; panel.hidden = true;
    panel.innerHTML = `<p><strong>Choose only a starting pattern.</strong> Statute will not complete the legal conclusion for you.</p><div class="starter-list"></div><p class="starter-note">Use it only if it fits what you found in the source.</p>`;
    config.starters.forEach(text => {
      const btn = document.createElement("button"); btn.type = "button"; btn.className = "starter-btn"; btn.textContent = text;
      btn.addEventListener("click", () => { textarea.value = textarea.value.trim() ? `${textarea.value.trim()} ${text}` : text; textarea.focus(); textarea.setSelectionRange(textarea.value.length, textarea.value.length); textarea.dispatchEvent(new Event("input", {bubbles:true})); panel.hidden = true; });
      panel.querySelector(".starter-list").appendChild(btn);
    });
    return panel;
  }

  function organizePanel(config, textarea) {
    const panel = document.createElement("div"); panel.className = "writing-help-panel"; panel.dataset.kind = "organize"; panel.hidden = true;
    panel.innerHTML = `<h4>Break your thought into legal pieces</h4><p>Short, imperfect notes are fine. This is thinking space — not your final answer.</p><div class="thought-pieces"></div><button type="button" class="coach-action">Return to my writing</button><p class="coach-note">Statute does not combine these into a finished sentence. Use the pieces to write it yourself above.</p>`;
    config.pieces.forEach(([name, question]) => { const row=document.createElement("div"); row.className="thought-piece"; row.innerHTML=`<label>${name}</label><input type="text" placeholder="${question.replace(/"/g,"&quot;")}">`; panel.querySelector(".thought-pieces").appendChild(row); });
    panel.querySelector(".coach-action").addEventListener("click",()=>{panel.hidden=true;textarea.focus();});
    return panel;
  }

  function feedbackFor(text, label) {
    const feedback=[]; const t=text.trim();
    if (!t) return [["Start here", "Write a rough version first. It does not need to be polished."]];
    if (t.split(/\s+/).length < 7) feedback.push(["Clarity", "This is very short. Check whether the reader can identify the actor, legal action, and point you are making."]);
    if (/\b(new law|put in place a law|did not take into account|they|it|things?|stuff)\b/i.test(t)) feedback.push(["Legal precision", "One phrase may be too broad or vague. Name the exact legal action, authority, actor, or document the source identifies."]);
    if (label === "ISSUE" && !/\bwhether\b/i.test(t)) feedback.push(["Structure", "Try testing whether your issue can be framed as a ‘whether’ question. Do not force it if another formulation is clearer."]);
    if (label === "HOLDING" && !/\b(court|held|holds|found|finds|concluded|concludes|determined|determines)\b/i.test(t)) feedback.push(["Structure", "Make sure the sentence identifies what the court actually decided, rather than only describing the dispute."]);
    if (label === "REASONING" && !/\b(because|reason|therefore|thus|since|explained|failed|satisfied)\b/i.test(t)) feedback.push(["Structure", "Your reasoning may need a clearer link between the rule, its application, and why the conclusion follows."]);
    if (label === "REMEDY" && !/\b(order|ordered|vacat|remand|enjoin|direct|compel|deny|retain)\b/i.test(t)) feedback.push(["Legal precision", "Check whether you have identified the specific action the court took as the remedy."]);
    if (!feedback.length) feedback.push(["Next check", "The structure looks workable. Compare every legal claim in your sentence against the source and make sure you are not stating more than it supports."]);
    return feedback;
  }

  function checkPanel(textarea, label) {
    const panel=document.createElement("div"); panel.className="writing-help-panel"; panel.dataset.kind="check"; panel.hidden=true; panel.innerHTML=`<h4>Check my writing</h4><div class="writing-feedback"></div><p class="coach-note">This checks writing cues, not whether your legal conclusion is correct. Verify it against the source.</p>`;
    panel.refresh=()=>{const box=panel.querySelector(".writing-feedback");box.innerHTML="";feedbackFor(textarea.value,label).forEach(([head,msg])=>{const el=document.createElement("div");el.className="feedback-item";el.innerHTML=`<strong>${head}</strong><span>${msg}</span>`;box.appendChild(el);});};
    return panel;
  }

  function enhanceWriting() {
    const guide=document.getElementById("guidePane"); if(!guide)return;
    guide.querySelectorAll(".analysis-step").forEach(step=>{
      if(step.dataset.writingHelp)return;
      const label=step.querySelector("summary small")?.textContent.trim().toUpperCase(); const textarea=step.querySelector("textarea"); const config=COACH[label]; if(!textarea||!config)return;
      step.dataset.writingHelp="true";
      const wrap=document.createElement("div"); wrap.className="writing-help";
      const tools=document.createElement("div"); tools.className="writing-tools";
      [["start","Help me start"],["organize","Organize my thought"],["check","Check my writing"]].forEach(([kind,text])=>{const b=document.createElement("button");b.type="button";b.className="writing-help-toggle";b.textContent=text;b.addEventListener("click",()=>{const target=wrap.querySelector(`.writing-help-panel[data-kind="${kind}"]`);const opening=target.hidden;wrap.querySelectorAll(".writing-help-panel").forEach(p=>p.hidden=true);target.hidden=!opening;if(kind==="check"&&opening)target.refresh();});tools.appendChild(b);});
      wrap.appendChild(tools); wrap.appendChild(starterPanel(config,textarea)); wrap.appendChild(organizePanel(config,textarea)); wrap.appendChild(checkPanel(textarea,label)); textarea.insertAdjacentElement("afterend",wrap);
    });
  }

  function wire(){ensureStyles();const analyze=document.getElementById("modeAnalyze");if(analyze&&!analyze.dataset.writingCoachWired){analyze.dataset.writingCoachWired="true";analyze.addEventListener("click",()=>setTimeout(enhanceWriting,20));}document.getElementById("tabGuide")?.addEventListener("click",()=>setTimeout(enhanceWriting,0));}
  document.addEventListener("DOMContentLoaded",wire);
})();