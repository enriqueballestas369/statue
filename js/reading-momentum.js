(() => {
  const KEY = "statute-reading-session-v1";
  let root = null;
  let type = "general";
  let stages = [];
  let currentStage = 0;
  let saveTimer = null;

  const STAGE_LABELS = {
    "BACKGROUND / FACTS": "Understand the setting",
    "RULE / LEGAL STANDARD": "Find the governing rule",
    "REASONING / ANALYSIS": "Follow the court's reasoning",
    "REMEDY": "Identify the remedy",
    "HOLDING / REMEDY": "Confirm decision and remedy",
    "JURISDICTION": "Check the court's authority",
    "DOCUMENT SECTION": "Read this section"
  };

  function css(){
    if(document.getElementById("readingMomentumStyles")) return;
    const s=document.createElement("style"); s.id="readingMomentumStyles"; s.textContent=`
      .reading-momentum{position:sticky;top:0;z-index:5;margin:0 0 14px;padding:9px 11px;border:1px solid var(--border,#ddd);border-radius:8px;background:color-mix(in srgb,var(--panel,#fff) 96%,transparent);backdrop-filter:blur(5px);font:12px/1.4 system-ui,sans-serif}
      .momentum-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.momentum-kicker{font-size:10px;font-weight:700;letter-spacing:.06em;color:var(--muted,#666)}.momentum-stage{font-weight:650}.momentum-progress{color:var(--muted,#666);white-space:nowrap}.momentum-track{height:3px;background:rgba(120,120,120,.12);border-radius:3px;margin:7px 0;overflow:hidden}.momentum-fill{height:100%;background:currentColor;opacity:.45;transition:width .2s}
      .momentum-task{color:var(--muted,#666)}.momentum-actions{display:flex;gap:6px;margin-top:7px;flex-wrap:wrap}.momentum-btn{border:0;background:transparent;color:inherit;font:600 11px/1.2 system-ui,sans-serif;padding:3px 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}.momentum-resume{margin-top:8px;padding-top:8px;border-top:1px solid var(--border,#ddd)}.momentum-resume[hidden]{display:none}.momentum-resume textarea{width:100%;box-sizing:border-box;min-height:54px;margin-top:5px;padding:6px;border:1px solid var(--border,#ccc);border-radius:6px;background:var(--panel,#fff);color:inherit;font:12px/1.4 system-ui,sans-serif}.momentum-resume strong{font-size:11px}.momentum-saved{font-size:10px;color:var(--muted,#666);margin-left:6px}
      body.reading-focus #docContent .doc-page{opacity:.38;transition:opacity .15s}body.reading-focus #docContent .doc-page.momentum-current-page{opacity:1}body.reading-focus #docContent .learning-map{opacity:1}
      @media(max-width:700px){.reading-momentum{position:relative}.momentum-top{align-items:flex-start}.momentum-progress{font-size:10px}}
    `; document.head.appendChild(s);
  }

  function getSession(){try{return JSON.parse(localStorage.getItem(KEY)||"null")}catch{return null}}
  function setSession(patch){const old=getSession()||{};localStorage.setItem(KEY,JSON.stringify({...old,...patch,updatedAt:Date.now()}));markSaved()}
  function markSaved(){const el=document.querySelector(".momentum-saved");if(el){el.textContent="Saved";clearTimeout(saveTimer);saveTimer=setTimeout(()=>el.textContent="",1500)}}
  function docKey(){return document.getElementById("docNameLabel")?.textContent?.trim() || root?.innerText.slice(0,80) || "document"}

  function buildStages(){
    const found=[];
    root.querySelectorAll("p").forEach(p=>{const label=p.querySelector(":scope > .learning-label")?.textContent.trim();if(!label)return;if(label==="DOCUMENT SECTION")return;found.push({label,el:p,task:STAGE_LABELS[label]||`Read: ${label.toLowerCase()}`});});
    if(!found.length){const pages=[...root.querySelectorAll(".doc-page")];const chunks=Math.min(5,Math.max(1,pages.length));for(let i=0;i<chunks;i++){const idx=Math.floor(i*pages.length/chunks);found.push({label:`Reading stage ${i+1}`,el:pages[idx],task:i===0?"Understand what this document is doing":"Continue the argument from the previous stage"});}}
    stages=found;
  }

  function render(){
    document.querySelector(".reading-momentum")?.remove();
    const map=document.querySelector(".learning-map"); if(!map||!root)return;
    const bar=document.createElement("div");bar.className="reading-momentum";
    bar.innerHTML=`<div class="momentum-top"><div><div class="momentum-kicker">RIGHT NOW</div><div class="momentum-stage"></div></div><div class="momentum-progress"></div></div><div class="momentum-track"><div class="momentum-fill"></div></div><div class="momentum-task"></div><div class="momentum-actions"><button class="momentum-btn" data-act="resume">Save / restore train of thought</button><button class="momentum-btn" data-act="focus">Focus on this stage</button><span class="momentum-saved"></span></div><div class="momentum-resume" hidden><strong>Before you leave, capture the thread — not a summary.</strong><textarea placeholder="What do I understand so far? What am I looking for next?"></textarea><button class="momentum-btn" data-act="save">Save thought</button></div>`;
    map.insertAdjacentElement("afterend",bar);
    const saved=getSession(); if(saved?.docKey===docKey()&&saved.note) bar.querySelector("textarea").value=saved.note;
    bar.addEventListener("click",e=>{const b=e.target.closest("[data-act]");if(!b)return;const act=b.dataset.act;if(act==="resume"){const p=bar.querySelector(".momentum-resume");p.hidden=!p.hidden;if(!p.hidden)p.querySelector("textarea").focus()}if(act==="save"){setSession({docKey:docKey(),stage:currentStage,note:bar.querySelector("textarea").value});bar.querySelector(".momentum-resume").hidden=true}if(act==="focus"){document.body.classList.toggle("reading-focus");b.textContent=document.body.classList.contains("reading-focus")?"Show full document":"Focus on this stage";markCurrentPage()}});
    updateBar();
  }

  function markCurrentPage(){document.querySelectorAll("#docContent .doc-page").forEach(p=>p.classList.remove("momentum-current-page"));const page=stages[currentStage]?.el.closest(".doc-page")||stages[currentStage]?.el;if(page?.classList.contains("doc-page"))page.classList.add("momentum-current-page")}
  function updateBar(){const bar=document.querySelector(".reading-momentum");if(!bar||!stages.length)return;const s=stages[currentStage];bar.querySelector(".momentum-stage").textContent=s.label;bar.querySelector(".momentum-task").textContent=s.task;bar.querySelector(".momentum-progress").textContent=`Stage ${currentStage+1} of ${stages.length}`;bar.querySelector(".momentum-fill").style.width=`${((currentStage+1)/stages.length)*100}%`;markCurrentPage()}

  function observeReading(){
    const pane=document.getElementById("docPane");if(!pane||pane.dataset.momentumScroll)return;pane.dataset.momentumScroll="true";
    pane.addEventListener("scroll",()=>{if(!stages.length)return;const paneTop=pane.getBoundingClientRect().top+120;let best=0;for(let i=0;i<stages.length;i++){if(stages[i].el.getBoundingClientRect().top<=paneTop)best=i;else break;}if(best!==currentStage){currentStage=best;updateBar();setSession({docKey:docKey(),stage:currentStage,note:document.querySelector(".momentum-resume textarea")?.value||""});}}, {passive:true});
  }

  function init(){
    css(); root=document.querySelector("#docContent .doc-body");if(!root||!root.innerText.trim())return false;if(root.dataset.momentumReady)return true;
    const map=document.querySelector(".learning-map");if(!map)return false;root.dataset.momentumReady="true";type=root.dataset.docType||"general";buildStages();const saved=getSession();if(saved?.docKey===docKey()&&Number.isInteger(saved.stage))currentStage=Math.min(saved.stage,stages.length-1);render();observeReading();
    if(saved?.docKey===docKey()&&saved.stage>0){setTimeout(()=>{stages[currentStage]?.el.scrollIntoView({block:"center"});updateBar();},80)}
    return true;
  }

  document.addEventListener("DOMContentLoaded",()=>{let tries=0;const timer=setInterval(()=>{tries++;if(init()||tries>80)clearInterval(timer)},100);});
})();