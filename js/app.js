/**
 * app.js
 * Screen navigation and the guided-reading experience. No automatic
 * summarization or search — every conclusion in this app is typed by the
 * user or drawn from a passage they explicitly marked as evidence.
 */

// ---------------------------------------------------------------------
// State
// ---------------------------------------------------------------------
const state = {
  userQuestion: "",         // "what are you trying to determine"
  docName: "",
  docSourceType: null,      // 'pdf' | 'pasted' | null
  pages: [],                // [{pageNum, text}]
  numPages: 0,
  currentPage: 1,
  mode: "guide",            // 'guide' | 'analyze'
  answeredUpTo: 0,
  answers: {},               // { questionKey: text }
  evidenceByQuestion: {},    // { questionKey: [{text, page}] }
  notes: [],                 // [{type:'Explanation'|'Definition', text, snippet}]
  questionsForLater: []      // [snippet]
};

const QUESTIONS = [
  {
    key: "reading",
    num: "1 of 5",
    q: "What am I reading?",
    hint: "Check the title, heading, first page, or caption for the type of document, who issued it, and the date."
  },
  {
    key: "about",
    num: "2 of 5",
    q: "What is this about?",
    hint: "Look for the parties or entities involved, the subject matter, and the specific question being addressed."
  },
  {
    key: "say",
    num: "3 of 5",
    q: "What does it say or do?",
    hint: "Watch for words like shall, must, may, except, unless, provided that — they signal rules, conditions, and exceptions. Separate what's discussed from what's actually decided or required."
  },
  {
    key: "mean",
    num: "4 of 5",
    q: "What does it mean here?",
    hint: "Think about what changed, what stayed the same, who is affected, and what facts could change the answer."
  },
  {
    key: "next",
    num: "5 of 5",
    q: "What happens next?",
    hint: "Look for effective dates, deadlines, appeal rights, or a required next action."
  }
];

// ---------------------------------------------------------------------
// Screen navigation
// ---------------------------------------------------------------------
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

// ---------------------------------------------------------------------
// Landing
// ---------------------------------------------------------------------
const fileInput = document.getElementById("fileInput");
const pastePanel = document.getElementById("pastePanel");

document.getElementById("uploadBtn").addEventListener("click", () => fileInput.click());
document.getElementById("emptyUploadBtn").addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.type !== "application/pdf") {
    alert("Please choose a PDF file.");
    return;
  }
  captureUserQuestion();
  await loadPdf(file);
  showScreen("reader");
});

document.getElementById("pasteBtn").addEventListener("click", () => {
  pastePanel.classList.add("show");
});
document.getElementById("pasteCancel").addEventListener("click", () => {
  pastePanel.classList.remove("show");
});
document.getElementById("pasteConfirm").addEventListener("click", () => {
  const text = document.getElementById("pasteArea").value.trim();
  if (!text) {
    alert("Paste some text first, or choose Cancel.");
    return;
  }
  captureUserQuestion();
  loadPastedText(text);
  showScreen("reader");
});

document.getElementById("continueBtn").addEventListener("click", () => {
  captureUserQuestion();
  resetDocument();
  showScreen("reader");
  renderEmptyState();
});

function captureUserQuestion() {
  state.userQuestion = document.getElementById("determineInput").value.trim();
}

// ---------------------------------------------------------------------
// Loading documents
// ---------------------------------------------------------------------
function resetDocument() {
  state.docName = "";
  state.docSourceType = null;
  state.pages = [];
  state.numPages = 0;
  state.currentPage = 1;
  state.answeredUpTo = 0;
  state.answers = {};
  state.evidenceByQuestion = {};
  state.notes = [];
  state.questionsForLater = [];
  state.mode = "guide";
}

async function loadPdf(file) {
  resetDocument();
  state.docName = file.name;
  state.docSourceType = "pdf";
  renderDocPlaceholderLoading();
  try {
    const { numPages, pages } = await extractPdfText(file);
    state.numPages = numPages;
    state.pages = pages.map((p) => ({
      pageNum: p.pageNum,
      paragraphs: reflowIntoParagraphs(p.text)
    }));
    renderDocument();
    renderGuide();
  } catch (err) {
    console.error(err);
    renderDocError(err.message || "Could not read this PDF.");
  }
}

function loadPastedText(text) {
  resetDocument();
  state.docName = "Pasted text";
  state.docSourceType = "pasted";
  state.numPages = 1;
  state.pages = [{ pageNum: 1, paragraphs: reflowIntoParagraphs(text) }];
  renderDocument();
  renderGuide();
}

// ---------------------------------------------------------------------
// Document pane rendering
// ---------------------------------------------------------------------
const docPane = document.getElementById("docPane");
const emptyState = document.getElementById("emptyState");
const docContent = document.getElementById("docContent");
const docNameWrap = document.getElementById("docNameWrap");
const docNameLabel = document.getElementById("docNameLabel");
const pageNav = document.getElementById("pageNav");
const pageIndicator = document.getElementById("pageIndicator");

function renderEmptyState() {
  emptyState.style.display = "block";
  docContent.style.display = "none";
  docNameWrap.style.display = "none";
  pageNav.style.display = "none";
  renderGuide();
}

function renderDocPlaceholderLoading() {
  emptyState.style.display = "none";
  docContent.style.display = "block";
  docContent.innerHTML = `<div class="doc-kicker">Reading your PDF…</div>`;
}

function renderDocError(msg) {
  docContent.innerHTML = `<div class="doc-kicker">Could not load document</div>
    <p style="font-family:var(--sans); color:var(--danger); font-size:14px;">${escapeHtml(msg)}</p>`;
}

function renderDocument() {
  emptyState.style.display = "none";
  docContent.style.display = "block";
  docNameWrap.style.display = "flex";
  docNameLabel.textContent = state.docName;

  let html = `<div class="doc-kicker">${state.docSourceType === "pdf" ? "Uploaded PDF" : "Pasted text"} · ${state.numPages} page${state.numPages === 1 ? "" : "s"} · text extracted in your browser</div>`;
  html += `<div class="doc-title">${escapeHtml(state.docName)}</div>`;
  html += `<div class="doc-body">`;
  state.pages.forEach((p) => {
    html += `<div class="doc-page" id="page-${p.pageNum}" data-page="${p.pageNum}">`;
    html += `<div class="doc-page-label">Page ${p.pageNum}</div>`;
    if (p.paragraphs.length === 0) {
      html += `<div class="doc-page-empty">No extractable text on this page — it may be a scanned image. (OCR isn't included in this MVP.)</div>`;
    } else {
      p.paragraphs.forEach((para) => {
        html += `<p>${escapeHtml(para)}</p>`;
      });
    }
    html += `</div>`;
  });
  html += `</div>`;
  docContent.innerHTML = html;

  applyGlossary(docContent);
  applyCitations(docContent);
  wireGlossaryClicks(docContent);

  if (state.numPages > 1) {
    pageNav.style.display = "flex";
    setupPageNav();
  } else {
    pageNav.style.display = "none";
  }
}

function setupPageNav() {
  updatePageIndicator();
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  prevBtn.onclick = () => goToPage(state.currentPage - 1);
  nextBtn.onclick = () => goToPage(state.currentPage + 1);

  const pageEls = docContent.querySelectorAll(".doc-page");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          state.currentPage = parseInt(entry.target.dataset.page, 10);
          updatePageIndicator();
        }
      });
    },
    { root: docPane, threshold: 0.4 }
  );
  pageEls.forEach((el) => observer.observe(el));
}

function goToPage(n) {
  if (n < 1 || n > state.numPages) return;
  const el = document.getElementById(`page-${n}`);
  if (el) {
    if (window.innerWidth <= 860) tabDoc.click();
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  state.currentPage = n;
  updatePageIndicator();
}

function updatePageIndicator() {
  pageIndicator.textContent = `Page ${state.currentPage} / ${state.numPages}`;
  document.getElementById("prevPageBtn").disabled = state.currentPage <= 1;
  document.getElementById("nextPageBtn").disabled = state.currentPage >= state.numPages;
}

// ---------------------------------------------------------------------
// Reader header / navigation
// ---------------------------------------------------------------------
document.getElementById("backHome").addEventListener("click", () => {
  document.getElementById("mainInput").value = "";
  document.getElementById("determineInput").value = "";
  pastePanel.classList.remove("show");
  showScreen("landing");
});

// ---------------------------------------------------------------------
// Mode toggle
// ---------------------------------------------------------------------
const modeGuideBtn = document.getElementById("modeGuide");
const modeAnalyzeBtn = document.getElementById("modeAnalyze");
modeGuideBtn.addEventListener("click", () => {
  state.mode = "guide";
  modeGuideBtn.classList.add("active");
  modeAnalyzeBtn.classList.remove("active");
  renderGuide();
});
modeAnalyzeBtn.addEventListener("click", () => {
  state.mode = "analyze";
  modeAnalyzeBtn.classList.add("active");
  modeGuideBtn.classList.remove("active");
  renderGuide();
});

// ---------------------------------------------------------------------
// Mobile tabs
// ---------------------------------------------------------------------
const tabDoc = document.getElementById("tabDoc");
const tabGuide = document.getElementById("tabGuide");
const guidePane = document.getElementById("guidePane");
tabDoc.addEventListener("click", () => {
  tabDoc.classList.add("active");
  tabGuide.classList.remove("active");
  docPane.classList.add("show");
  guidePane.classList.remove("show");
});
tabGuide.addEventListener("click", () => {
  tabGuide.classList.add("active");
  tabDoc.classList.remove("active");
  guidePane.classList.add("show");
  docPane.classList.remove("show");
});

// ---------------------------------------------------------------------
// Guide pane
// ---------------------------------------------------------------------
function renderGuide() {
  if (state.pages.length === 0) {
    guidePane.innerHTML = `<div class="guide-title">Guide</div>
      <div class="guide-empty">Upload a PDF or paste text to start the five-question reading guide.</div>`;
    return;
  }

  if (state.mode === "analyze") {
    renderAnalyzePlaceholder();
    return;
  }

  renderGuideMe();
}

function relevanceNoteHtml() {
  if (!state.userQuestion) return "";
  return `<div class="relevance-note">Your focus: <strong>${escapeHtml(state.userQuestion)}</strong></div>`;
}

function renderGuideMe() {
  let html = `<div class="guide-title">Guide me — five core questions</div>`;
  html += relevanceNoteHtml();

  QUESTIONS.forEach((q, i) => {
    if (i < state.answeredUpTo) {
      html += `<div class="q-answered" data-idx="${i}">
        <div class="qa-num">${q.num}</div>
        <div class="qa-q">${q.q}</div>
      </div>`;
    }
  });

  if (state.answeredUpTo < QUESTIONS.length) {
    const q = QUESTIONS[state.answeredUpTo];
    const savedAnswer = state.answers[q.key] || "";
    const evidence = state.evidenceByQuestion[q.key] || [];
    html += `<div class="q-active">
      <div class="qa-num">QUESTION ${q.num}</div>
      <h4>${q.q}</h4>
      <textarea class="q-answer-box" id="qInput" placeholder="Type what you find in the document…">${escapeHtml(savedAnswer)}</textarea>
      <div class="q-btn-row">
        <button class="btn small secondary" id="hintBtn">Hint</button>
        <button class="btn small" id="saveNextBtn">Save &amp; next question →</button>
      </div>
      <div id="feedbackArea"></div>
      <div class="q-evidence-list" id="evidenceList">
        ${evidence
          .map(
            (ev, idx) =>
              `<div class="q-evidence-item"><span>“${escapeHtml(ev.text)}” <em>(p. ${ev.page})</em></span><button data-remove="${idx}">Remove</button></div>`
          )
          .join("")}
      </div>
      <div style="font-size:11.5px; color:var(--ink-faint); margin-top:${evidence.length ? "4px" : "10px"};">
        Select a passage in the document and choose “Attach as evidence” to link it here.
      </div>
    </div>`;
  } else {
    html += `<button class="see-card-cta" id="seeCardBtn">See understanding worksheet →</button>`;
  }

  html += sideListsHtml();
  guidePane.innerHTML = html;
  wireGuideEvents();
}

function renderAnalyzePlaceholder() {
  let html = `<div class="guide-title">Analyze for me</div>`;
  html += relevanceNoteHtml();
  html += `<div class="analyze-placeholder">
    <h4>Not connected yet</h4>
    <p>This mode is designed to show evidence-linked answers generated by an AI backend, but no backend is connected in this build. Nothing here is auto-generated or guessed. Switch to <strong>Guide me</strong> to work through the document yourself, or check back once AI analysis is added.</p>
  </div>`;
  html += sideListsHtml();
  guidePane.innerHTML = html;
  const seeCard = document.createElement("button");
  guidePane.querySelectorAll(".q-answered").length; // no-op, keep linter quiet
  if (state.answeredUpTo >= QUESTIONS.length) {
    guidePane.insertAdjacentHTML("beforeend", `<button class="see-card-cta" id="seeCardBtn">See understanding worksheet →</button>`);
  }
  wireGuideEvents();
}

function sideListsHtml() {
  let html = `<div class="side-list">
    <div class="side-list-title">My notes</div>`;
  if (state.notes.length === 0) {
    html += `<div class="side-list-empty">Nothing yet. Select text and choose Explain or Define to jot your own note here.</div>`;
  } else {
    html += state.notes
      .map((n) => `<div class="side-list-item"><strong>${escapeHtml(n.type)}:</strong> ${escapeHtml(n.text)}<br><em style="color:var(--ink-faint); font-size:11.5px;">“${escapeHtml(n.snippet)}”</em></div>`)
      .join("");
  }
  html += `</div><div class="side-list">
    <div class="side-list-title">Questions for later</div>`;
  if (state.questionsForLater.length === 0) {
    html += `<div class="side-list-empty">Select text and choose “Ask about this” to save a question to research or bring to counsel.</div>`;
  } else {
    html += state.questionsForLater.map((q) => `<div class="side-list-item">${escapeHtml(q)}</div>`).join("");
  }
  html += `</div>`;
  return html;
}

function wireGuideEvents() {
  guidePane.querySelectorAll(".q-answered").forEach((el) => {
    el.addEventListener("click", () => {
      const idx = parseInt(el.dataset.idx, 10);
      const q = QUESTIONS[idx];
      const answer = state.answers[q.key] || "(no answer saved)";
      const evidence = state.evidenceByQuestion[q.key] || [];
      const evText = evidence.map((e) => `p.${e.page}: "${e.text}"`).join("\n") || "none";
      alert(`${q.q}\n\nYour answer:\n${answer}\n\nEvidence attached:\n${evText}`);
    });
  });

  const hintBtn = document.getElementById("hintBtn");
  const saveNextBtn = document.getElementById("saveNextBtn");
  const feedbackArea = document.getElementById("feedbackArea");
  const qInput = document.getElementById("qInput");

  if (hintBtn) {
    hintBtn.addEventListener("click", () => {
      const q = QUESTIONS[state.answeredUpTo];
      feedbackArea.innerHTML = `<div class="q-feedback hint"><strong>Hint —</strong> ${escapeHtml(q.hint)}</div>`;
    });
  }

  if (saveNextBtn) {
    saveNextBtn.addEventListener("click", () => {
      const q = QUESTIONS[state.answeredUpTo];
      state.answers[q.key] = qInput.value.trim();
      state.answeredUpTo++;
      renderGuide();
    });
  }

  guidePane.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = QUESTIONS[state.answeredUpTo];
      const idx = parseInt(btn.dataset.remove, 10);
      state.evidenceByQuestion[q.key].splice(idx, 1);
      renderGuide();
    });
  });

  const seeCardBtn = document.getElementById("seeCardBtn");
  if (seeCardBtn) {
    seeCardBtn.addEventListener("click", () => {
      renderUnderstandingCard();
      showScreen("cardScreen");
    });
  }
}

// ---------------------------------------------------------------------
// Text selection toolbar
// ---------------------------------------------------------------------
const toolbar = document.getElementById("selToolbar");

document.addEventListener("mouseup", (e) => {
  const sel = window.getSelection();
  const text = sel.toString().trim();
  if (text.length > 2 && docContent.contains(sel.anchorNode)) {
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    toolbar.style.top = window.scrollY + rect.top - 46 + "px";
    toolbar.style.left = window.scrollX + rect.left + "px";
    toolbar.classList.add("show");
    toolbar.dataset.selected = text;
    const pageEl = sel.anchorNode.parentElement && sel.anchorNode.parentElement.closest(".doc-page");
    toolbar.dataset.page = pageEl ? pageEl.dataset.page : state.currentPage;
  } else if (!toolbar.contains(e.target)) {
    toolbar.classList.remove("show");
  }
});

toolbar.querySelectorAll("button").forEach((b) => {
  b.addEventListener("click", () => {
    const text = toolbar.dataset.selected || "";
    const page = parseInt(toolbar.dataset.page, 10) || 1;
    const short = text.length > 140 ? text.slice(0, 140) + "…" : text;

    if (b.dataset.act === "evidence") {
      if (state.mode !== "guide" || state.answeredUpTo >= QUESTIONS.length) {
        alert("Switch to Guide me and have an active question open to attach evidence to it.");
      } else {
        const q = QUESTIONS[state.answeredUpTo];
        if (!state.evidenceByQuestion[q.key]) state.evidenceByQuestion[q.key] = [];
        state.evidenceByQuestion[q.key].push({ text: short, page });
        renderGuide();
      }
    }

    if (b.dataset.act === "explain") {
      const note = prompt(`Explain in your own words:\n"${short}"`);
      if (note) {
        state.notes.push({ type: "Explanation", text: note, snippet: short });
        renderGuide();
      }
    }

    if (b.dataset.act === "define") {
      const note = prompt(`Define this term or phrase:\n"${short}"`);
      if (note) {
        state.notes.push({ type: "Definition", text: note, snippet: short });
        renderGuide();
      }
    }

    if (b.dataset.act === "ask") {
      const note = prompt(`What do you want to ask about this passage?\n"${short}"`, "");
      if (note) {
        state.questionsForLater.push(`${note} — re: "${short}"`);
        renderGuide();
      }
    }

    toolbar.classList.remove("show");
    window.getSelection().removeAllRanges();
  });
});

// ---------------------------------------------------------------------
// Understanding worksheet
// ---------------------------------------------------------------------
const FIELD_CONFIG = [
  { key: "answer", label: "Your answer", placeholder: "Based on your reading, what's the answer?" },
  { key: "changed", label: "What changed", placeholder: "What does the document change?" },
  { key: "notChanged", label: "What did not change", placeholder: "What stays the same?" },
  { key: "next", label: "What happens next", placeholder: "Deadlines, appeal rights, required actions…" },
  { key: "action", label: "Action today", placeholder: "What, if anything, should be done now?" },
  { key: "unresolved", label: "Unresolved", placeholder: "What's still unclear or open?" }
];
const worksheetData = {};

function renderUnderstandingCard() {
  const box = document.getElementById("cardBox");
  let html = `<div class="card-row">
    <div class="cr-label">Your question</div>
    <input id="wq-question" value="${escapeHtml(state.userQuestion)}" placeholder="What were you trying to determine?">
  </div>`;

  FIELD_CONFIG.forEach((f) => {
    html += `<div class="card-row">
      <div class="cr-label">${f.label}</div>
      <textarea id="wq-${f.key}" rows="2" placeholder="${escapeHtml(f.placeholder)}">${escapeHtml(worksheetData[f.key] || "")}</textarea>
    </div>`;
  });

  box.innerHTML = html;
  box.insertAdjacentHTML(
    "afterend",
    `<div class="card-evidence-refs" id="cardEvidenceRefs"></div>`
  );

  const refsWrap = document.getElementById("cardEvidenceRefs");
  const allEvidence = Object.entries(state.evidenceByQuestion).flatMap(([qkey, list]) =>
    list.map((ev) => ({ qkey, ...ev }))
  );
  if (allEvidence.length) {
    refsWrap.innerHTML =
      `<div class="side-list-title" style="margin-bottom:10px;">Evidence you marked while reading</div>` +
      allEvidence
        .map((ev) => `<div class="side-list-item">p. ${ev.page} — “${escapeHtml(ev.text)}”</div>`)
        .join("");
  }

  const actionsWrap = document.querySelector("#cardScreen .card-actions");
  if (!document.getElementById("downloadWorksheetBtn")) {
    actionsWrap.insertAdjacentHTML(
      "afterbegin",
      `<button class="btn secondary" id="downloadWorksheetBtn">Download worksheet (.txt)</button>`
    );
    document.getElementById("downloadWorksheetBtn").addEventListener("click", downloadWorksheet);
  }
}

function collectWorksheet() {
  state.userQuestion = document.getElementById("wq-question").value.trim();
  FIELD_CONFIG.forEach((f) => {
    const el = document.getElementById(`wq-${f.key}`);
    if (el) worksheetData[f.key] = el.value.trim();
  });
}

function downloadWorksheet() {
  collectWorksheet();
  let text = `STATUTE — UNDERSTANDING WORKSHEET\n`;
  text += `Document: ${state.docName}\n\n`;
  text += `Your question: ${state.userQuestion}\n\n`;
  FIELD_CONFIG.forEach((f) => {
    text += `${f.label}:\n${worksheetData[f.key] || ""}\n\n`;
  });
  text += `Evidence marked while reading:\n`;
  Object.values(state.evidenceByQuestion)
    .flat()
    .forEach((ev) => {
      text += `- p.${ev.page}: "${ev.text}"\n`;
    });
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "understanding-worksheet.txt";
  a.click();
  URL.revokeObjectURL(url);
}

document.getElementById("backToReaderBtn").addEventListener("click", () => {
  collectWorksheet();
  showScreen("reader");
});
document.getElementById("newQuestionBtn").addEventListener("click", () => {
  collectWorksheet();
  document.getElementById("mainInput").value = "";
  document.getElementById("determineInput").value = "";
  showScreen("landing");
});

// ---------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------
// escapeHtml() is defined once, in glossary.js, and reused here since all
// scripts share one global scope in this build.

// Start on empty reader state if user lands directly (not typically hit,
// landing is the entry screen, but keeps reader well-defined standalone).
renderGuide();
