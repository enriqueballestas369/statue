(() => {
  const KEY = "statute-reading-session-v2";
  let root = null;
  let stages = [];
  let currentStage = 0;
  let currentPage = 0;
  let saveTimer = null;
  let positionTimer = null;

  const COURT_MISSIONS = [
    ["Orient yourself", "Who is involved, what action is being challenged, and what is the court being asked to decide?"],
    ["Build the context", "Move through the background without treating every detail as equally important. Notice what you may need later."],
    ["Find the governing law", "Look for the statutes, regulations, APA standard, or other legal rules the court will apply."],
    ["Follow the analysis", "Slow down where the court applies the law, evaluates arguments, and explains why something succeeds or fails."],
    ["Check decision and remedy", "Separate what the court decided from what it actually ordered, remanded, vacated, preserved, or left in place."],
    ["Confirm limits and next steps", "Before finishing, check what remains unresolved, what happens next, and whether later action could change the practical result."]
  ];

  const GENERAL_MISSIONS = [
    ["Orient yourself", "Identify the document, its purpose, and the question you are trying to answer."],
    ["Build the context", "Move through background and definitions without treating every detail as equally important."],
    ["Find the controlling material", "Look for the operative rule, authority, standard, or decision."],
    ["Follow the explanation", "Slow down where the document applies, interprets, or explains the controlling material."],
    ["Check the effect", "Identify what changes, who is affected, and what the document actually requires or decides."],
    ["Confirm limits and next steps", "Check exceptions, unresolved points, deadlines, implementation, or later proceedings."]
  ];

  function css() {
    if (document.getElementById("readingMomentumStyles")) return;
    const s = document.createElement("style");
    s.id = "readingMomentumStyles";
    s.textContent = `
      .reading-momentum{position:sticky;top:0;z-index:5;margin:0 0 14px;padding:10px 12px;border:1px solid var(--border,#ddd);border-radius:8px;background:color-mix(in srgb,var(--panel,#fff) 97%,transparent);backdrop-filter:blur(5px);font:12px/1.4 system-ui,sans-serif}
      .momentum-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.momentum-kicker{font-size:10px;font-weight:700;letter-spacing:.06em;color:var(--muted,#666)}.momentum-stage{font-weight:700;margin-top:1px}.momentum-progress{color:var(--muted,#666);white-space:nowrap;font-size:11px}.momentum-track{height:3px;background:rgba(120,120,120,.12);border-radius:3px;margin:7px 0;overflow:hidden}.momentum-fill{height:100%;background:currentColor;opacity:.45;transition:width .2s}.momentum-task{color:var(--muted,#666);max-width:780px}
      .momentum-actions{display:flex;gap:10px;margin-top:7px;flex-wrap:wrap}.momentum-btn{border:0;background:transparent;color:inherit;font:600 11px/1.2 system-ui,sans-serif;padding:3px 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}.momentum-resume{margin-top:8px;padding-top:8px;border-top:1px solid var(--border,#ddd)}.momentum-resume[hidden]{display:none}.momentum-resume textarea{width:100%;box-sizing:border-box;min-height:58px;margin-top:5px;padding:7px;border:1px solid var(--border,#ccc);border-radius:6px;background:var(--panel,#fff);color:inherit;font:12px/1.4 system-ui,sans-serif}.momentum-resume strong{font-size:11px}.momentum-saved{font-size:10px;color:var(--muted,#666);align-self:center}
      body.reading-focus #docContent .doc-page{opacity:.26;transition:opacity .15s}body.reading-focus #docContent .doc-page.momentum-current-page{opacity:1}body.reading-focus #docContent .learning-map{opacity:1}
      .momentum-range{font-size:10px;color:var(--muted,#777);margin-top:2px}
      @media(max-width:700px){.reading-momentum{position:relative}.momentum-top{gap:6px}.momentum-progress{font-size:10px}}
    `;
    document.head.appendChild(s);
  }

  function getSession(){ try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } }
  function setSession(patch){ const old = getSession() || {}; localStorage.setItem(KEY, JSON.stringify({...old, ...patch, updatedAt: Date.now()})); markSaved(); }
  function markSaved(){ const el=document.querySelector(".momentum-saved"); if(!el)return; el.textContent="Saved"; clearTimeout(saveTimer); saveTimer=setTimeout(()=>el.textContent="",1400); }
  function docKey(){ return document.getElementById("docNameLabel")?.textContent?.trim() || root?.innerText.slice(0,80) || "document"; }
  function noteValue(){ return document.querySelector(".momentum-resume textarea")?.value || ""; }
  function focusOn(){ return document.body.classList.contains("reading-focus"); }
  function savePosition(){ setSession({docKey:docKey(),stage:currentStage,page:currentPage,note:noteValue(),focus:focusOn()}); }

  function buildMissionStages(){
    const pages = [...root.querySelectorAll(".doc-page")];
    if (!pages.length) return [];
    const type = root.dataset.docType || "general";
    const missions = type === "court" ? COURT_MISSIONS : GENERAL_MISSIONS;
    const count = Math.min(missions.length, Math.max(3, Math.ceil(pages.length / 4)));
    return missions.slice(0,count).map((mission,i)=>{
      const start=Math.floor(i*pages.length/count);
      const end=Math.max(start,Math.floor((i+1)*pages.length/count)-1);
      return {label:mission[0],task:mission[1],start,end,el:pages[start]};
    });
  }

  function buildStages(){
    const structural=[];
    root.querySelectorAll("p").forEach(p=>{
      const label=p.querySelector(":scope > .learning-label")?.textContent.trim();
      if(!label||label==="DOCUMENT SECTION")return;
      structural.push({label,el:p});
    });
    if(structural.length<3){stages=buildMissionStages();return;}
    const pages=[...root.querySelectorAll(".doc-page")];
    stages=structural.map((item,i)=>{
      const startPage=Math.max(0,pages.indexOf(item.el.closest(".doc-page")));
      const nextPage=i+1<structural.length?pages.indexOf(structural[i+1].el.closest(".doc-page")):pages.length;
      const endPage=Math.max(startPage,(nextPage>startPage?nextPage:startPage+1)-1);
      return {label:item.label,task:item.label==="BACKGROUND / FACTS"?"Understand the setting without treating every detail as equally important.":item.label==="RULE / LEGAL STANDARD"?"Identify the governing law or standard.":item.label==="REASONING / ANALYSIS"?"Slow down and follow how the court applies the law.":item.label.includes("REMEDY")?"Separate the legal decision from the action the court orders.":"Read this section for the job it performs in the document.",start:startPage,end:endPage,el:item.el};
    });
  }

  function render(){
    document.querySelector(".reading-momentum")?.remove();
    const map=document.querySelector(".learning-map"); if(!map||!root||!stages.length)return;
    const bar=document.createElement("div"); bar.className="reading-momentum";
    bar.innerHTML=`<div class="momentum-top"><div><div class="momentum-kicker">RIGHT NOW</div><div class="momentum-stage"></div><div class="momentum-range"></div></div><div class="momentum-progress"></div></div><div class="momentum-track"><div class="momentum-fill"></div></div><div class="momentum-task"></div><div class="momentum-actions"><button class="momentum-btn" data-act="resume">Save / restore train of thought</button><button class="momentum-btn" data-act="focus">Focus on this mission</button><span class="momentum-saved"></span></div><div class="momentum-resume" hidden><strong>Capture the thread, not a summary.</strong><textarea placeholder="What do I understand so far? What am I looking for next?"></textarea><button class="momentum-btn" data-act="save">Save thought</button></div>`;
    map.insertAdjacentElement("afterend",bar);
    const saved=getSession();
    if(saved?.docKey===docKey()&&saved.note)bar.querySelector("textarea").value=saved.note;
    if(saved?.docKey===docKey()&&saved.focus){document.body.classList.add("reading-focus");bar.querySelector('[data-act="focus"]').textContent="Show full document";}else{document.body.classList.remove("reading-focus");}
    bar.querySelector("textarea").addEventListener("input",()=>{clearTimeout(positionTimer);positionTimer=setTimeout(savePosition,350);});
    bar.addEventListener("click",e=>{
      const b=e.target.closest("[data-act]");if(!b)return;
      if(b.dataset.act==="resume"){const p=bar.querySelector(".momentum-resume");p.hidden=!p.hidden;if(!p.hidden)p.querySelector("textarea").focus();}
      if(b.dataset.act==="save"){savePosition();bar.querySelector(".momentum-resume").hidden=true;}
      if(b.dataset.act==="focus"){document.body.classList.toggle("reading-focus");b.textContent=focusOn()?"Show full document":"Focus on this mission";markCurrentPages();savePosition();}
    });
    updateBar();
  }

  function markCurrentPages(){
    const pages=[...root.querySelectorAll(".doc-page")];pages.forEach(p=>p.classList.remove("momentum-current-page"));
    const s=stages[currentStage];if(!s)return;for(let i=s.start;i<=s.end;i++)pages[i]?.classList.add("momentum-current-page");
  }

  function updateBar(){
    const bar=document.querySelector(".reading-momentum");if(!bar||!stages.length)return;const s=stages[currentStage];
    bar.querySelector(".momentum-stage").textContent=s.label;bar.querySelector(".momentum-task").textContent=s.task;bar.querySelector(".momentum-progress").textContent=`Mission ${currentStage+1} of ${stages.length}`;bar.querySelector(".momentum-fill").style.width=`${((currentStage+1)/stages.length)*100}%`;
    const pages=[...root.querySelectorAll(".doc-page")];bar.querySelector(".momentum-range").textContent=pages.length>1?`Current reading area: pages ${s.start+1}${s.end>s.start?`–${s.end+1}`:""}`:"";markCurrentPages();
  }

  function observeReading(){
    const pane=document.getElementById("docPane");if(!pane||pane.dataset.momentumScroll)return;pane.dataset.momentumScroll="true";
    pane.addEventListener("scroll",()=>{
      const pages=[...root.querySelectorAll(".doc-page")];if(!pages.length||!stages.length)return;const line=pane.getBoundingClientRect().top+150;let pageIndex=0;
      for(let i=0;i<pages.length;i++){if(pages[i].getBoundingClientRect().top<=line)pageIndex=i;else break;}
      currentPage=pageIndex;const next=stages.findIndex(s=>pageIndex>=s.start&&pageIndex<=s.end);if(next>=0&&next!==currentStage){currentStage=next;updateBar();}
      clearTimeout(positionTimer);positionTimer=setTimeout(savePosition,220);
    },{passive:true});
  }

  function init(){
    css();root=document.querySelector("#docContent .doc-body");if(!root||!root.innerText.trim())return false;if(root.dataset.momentumReady)return true;if(!document.querySelector(".learning-map"))return false;
    root.dataset.momentumReady="true";buildStages();const saved=getSession();const pages=[...root.querySelectorAll(".doc-page")];
    if(saved?.docKey===docKey()){
      if(Number.isInteger(saved.stage))currentStage=Math.max(0,Math.min(saved.stage,stages.length-1));
      if(Number.isInteger(saved.page))currentPage=Math.max(0,Math.min(saved.page,pages.length-1));else currentPage=stages[currentStage]?.start||0;
    }else{currentStage=0;currentPage=0;}
    render();observeReading();
    if(saved?.docKey===docKey()&&(saved.page>0||saved.stage>0))setTimeout(()=>{(pages[currentPage]||stages[currentStage]?.el)?.scrollIntoView({block:"start"});updateBar();},100);
    return true;
  }

  window.addEventListener("pagehide",()=>{if(root)savePosition();});
  document.addEventListener("DOMContentLoaded",()=>{let tries=0;const timer=setInterval(()=>{tries++;if(init()||tries>80)clearInterval(timer);},100);});
})();