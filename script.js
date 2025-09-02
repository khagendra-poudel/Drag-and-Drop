// quiz data and app logic
const quizData = [
  {
    text: "A computer is an {1} device that processes data.",
    answers: ["electronic"],
    bank: ["electronic", "digital", "electric", "mechanical"],
  },
  {
    text: "The physical parts of a computer are called {1}.",
    answers: ["hardware"],
    bank: ["hardware", "software", "peripherals", "components"],
  },
  {
    text: "The programs and instructions used by a computer are called {1}.",
    answers: ["software", "applications"],
    bank: ["software", "programs", "applications", "drivers"],
  },
  {
    text: "The main part of a computer that processes data is called the {1}.",
    answers: [
      "cpu",
      "cpu (central processing unit)",
      "central processing unit",
      "central processing unit (cpu)",
    ],
    bank: ["CPU", "GPU", "motherboard", "RAM"],
  },
  {
    text: "A computer follows the {1} cycle.",
    answers: [
      "ipo",
      "input-process-output",
      "input process output",
      "ipo (input-process-output)",
    ],
    bank: ["IPO", "PIO", "IO", "IOPS"],
  },
  {
    text: "Devices like keyboard and mouse are called {1} devices.",
    answers: ["input"],
    bank: ["input", "output", "storage", "processing"],
  },
  {
    text: "Devices like monitor and printer are called {1} devices.",
    answers: ["output"],
    bank: ["output", "input", "peripheral", "display"],
  },
  {
    text: "The temporary memory of a computer is called {1}.",
    answers: [
      "ram",
      "ram (random access memory)",
      "random access memory",
    ],
    bank: ["RAM", "ROM", "Cache", "Hard disk"],
  },
  {
    text: "Hard disk, pen drive, and CD are examples of {1} devices.",
    answers: ["storage"],
    bank: ["storage", "memory", "input", "output"],
  },
  {
    text: "A computer can only understand {1} language.",
    answers: ["machine", "binary"],
    bank: ["machine", "assembly", "high-level", "binary"],
  },
 
];

const quizEl = document.getElementById("quiz");
const feedbackEl = document.getElementById("feedback");
const state = { placement: {}, grabbed: null, placedButton: {}, checkedThisRound: false };

// Fisher-Yates shuffle (in-place) — returns the same array for convenience
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function render() {
  quizEl.innerHTML = "";
  quizData.forEach((q, idx) => {
    const qWrap = document.createElement("div");
    qWrap.className = "question";
    const parts = q.text.split(/(\{\d+\})/g);
    parts.forEach((part) => {
      const m = part.match(/^\{(\d+)\}$/);
      if (m) {
        const slot = document.createElement("span");
        slot.className = "blank empty";
        slot.setAttribute("data-slot", idx + "-" + m[1]);
        slot.setAttribute("tabindex", "0");
        slot.setAttribute("role", "button");
        slot.setAttribute("aria-label", `Blank ${idx + 1}`);
        slot.textContent = "—";
        slot.addEventListener("dragover", (ev) => ev.preventDefault());
        slot.addEventListener("dragenter", (ev) => {
          ev.preventDefault();
          slot.classList.add("drop-over");
        });
        slot.addEventListener("dragleave", (ev) => {
          slot.classList.remove("drop-over");
        });
        slot.addEventListener("drop", (ev) => {
          ev.preventDefault();
          slot.classList.remove("drop-over");
          const w = ev.dataTransfer.getData("text/plain");
          placeWord(idx, m[1], w);
        });
        slot.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
            if (state.grabbed) {
              placeWord(idx, m[1], state.grabbed);
              state.grabbed = null;
              updateBankState();
            }
          } else if (
            ev.key === "Backspace" ||
            ev.key === "Delete" ||
            ev.key === " "
          ) {
            removeWord(idx, m[1]);
          } else if (ev.key === "Escape") {
            state.grabbed = null;
            updateBankState();
          }
        });
        qWrap.appendChild(slot);
      } else {
        qWrap.appendChild(document.createTextNode(part));
      }
    });

    const bankTitle = document.createElement("div");
    bankTitle.className = "bank-title";
    bankTitle.textContent = "Word bank:";
  const bank = document.createElement("div");
  bank.className = "word-bank";
  // shuffle a copy of the bank so the correct (original first) option isn't always first
  const bankItems = shuffle(q.bank.slice());
  bankItems.forEach((w, bankIdx) => {
      const btn = document.createElement("button");
      btn.className = "word";
  btn.type = "button";
  // draggable removed: options are clickable only
  btn.draggable = false;
  btn.setAttribute("data-word", w);
      // color variant for playful look
      btn.classList.add(`color-${bankIdx % 4}`);
      // tag button with its question index and bank index so we can restore it later
      btn.setAttribute("data-q", idx);
      btn.setAttribute("data-bank-idx", bankIdx);
      btn.textContent = w;
  // drag handlers removed — click-only interaction is used instead
      btn.addEventListener("click", () => {
        // If this button is currently marked as placed (disabled), treat click as remove
        if (btn.disabled) {
          // find which slot this button is occupying
          const placedKeys = Object.keys(state.placedButton);
          for (const key of placedKeys) {
            if (state.placedButton[key] === btn) {
              const parts = key.split('-');
              removeWord(parseInt(parts[0], 10), parts[1]);
              return;
            }
          }
          return;
        }

        // try to place into the first empty blank for this question
        const qAttr = btn.getAttribute('data-q');
        const qIdx = qAttr ? parseInt(qAttr, 10) : null;
        let placed = false;
        if (qIdx !== null) {
          // find blanks belonging to this question (data-slot starts with "qIdx-")
          const slots = quizEl.querySelectorAll(`.blank[data-slot^="${qIdx}-"]`);
          // prefer the first empty slot
          let firstSlot = null;
          for (const s of slots) {
            if (!firstSlot) firstSlot = s;
            const isEmpty = s.classList.contains('empty') || s.textContent.trim() === '—';
            if (isEmpty) {
              const parts = s.getAttribute('data-slot').split('-');
              placeWord(parseInt(parts[0], 10), parts[1], w);
              placed = true;
              break;
            }
          }
          // if no empty slot found, replace the first slot (so user can change answer)
          if (!placed && firstSlot) {
            const parts = firstSlot.getAttribute('data-slot').split('-');
            placeWord(parseInt(parts[0], 10), parts[1], w);
            placed = true;
          }
        }
        if (placed) {
          // user placed an answer — do not start an automatic timer (timer removed)
          // keep existing behavior that will trigger reset on manual submit
        } else {
          // fallback: toggle selection for keyboard placement
          state.grabbed = state.grabbed === w ? null : w;
          updateBankState();
        }
      });
      btn.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          btn.click();
        }
      });
  // touch/pointer handlers removed — taps still trigger click handler
      // append the built button into the bank
      bank.appendChild(btn);
    });

    qWrap.appendChild(bankTitle);
    qWrap.appendChild(bank);
    quizEl.appendChild(qWrap);
  });
}

function placeWord(qIdx, slotNum, word) {
  const slotKey = `${qIdx}-${slotNum}`;
  // if there's already a word placed here, restore its bank button
  if (state.placedButton[slotKey]) {
    const prevBtn = state.placedButton[slotKey];
    prevBtn.disabled = false;
    prevBtn.classList.remove("placed");
    delete state.placedButton[slotKey];
  }

  // find the bank button for the new word within this question and hide/disable it
  const bankBtn = quizEl.querySelector(`.word[data-word="${CSS.escape(word)}"][data-q="${qIdx}"]`);
  if (bankBtn) {
    bankBtn.disabled = true;
    bankBtn.classList.add("placed");
    state.placedButton[slotKey] = bankBtn;
  }

  state.placement[slotKey] = word;
  const slotEl = quizEl.querySelector(`[data-slot='${slotKey}']`);
  if (slotEl) {
    slotEl.textContent = word;
    slotEl.classList.remove("empty", "incorrect", "correct");
    // small pulse animation
    slotEl.classList.add("pulse", "placed-in");
    // remove placed-in after animation
    setTimeout(() => slotEl.classList.remove("placed-in"), 300);
    setTimeout(() => slotEl.classList.remove("pulse"), 220);
  }
  updateBankState();
}

function removeWord(qIdx, slotNum) {
  const key = `${qIdx}-${slotNum}`;
  // restore bank button state if we had marked one as placed
  if (state.placedButton[key]) {
    const b = state.placedButton[key];
    b.disabled = false;
    b.classList.remove("placed");
    delete state.placedButton[key];
  }
  delete state.placement[key];
  const slotEl = quizEl.querySelector(`[data-slot='${key}']`);
  if (slotEl) {
    slotEl.textContent = "—";
    slotEl.classList.add("empty");
    slotEl.classList.remove("correct", "incorrect");
    // trigger removed animation
    slotEl.classList.add("removed");
    setTimeout(() => slotEl.classList.remove("removed"), 220);
  }
}

function updateBankState() {
  const buttons = quizEl.querySelectorAll(".word");
  buttons.forEach((b) => {
    const w = b.getAttribute("data-word");
    b.setAttribute("aria-pressed", state.grabbed === w ? "true" : "false");
  });
}

function checkAll(manual = false) {
  // prevent double-checking the same round
  if (state.checkedThisRound) return;
  if (manual) {
    // stop the running timer when user manually checks
    stopTimer();
    // disable manual checking button until reset
    const chkBtn = document.getElementById('checkAll');
    if (chkBtn) chkBtn.disabled = true;
  }
  let correctCount = 0;
  quizData.forEach((q, idx) => {
    const slotKey = `${idx}-1`;
    const placed = (state.placement[slotKey] || "").toLowerCase().trim();
    const acceptable = q.answers.map((a) => a.toLowerCase());
    const slotEl = quizEl.querySelector(`[data-slot='${slotKey}']`);
    if (placed && acceptable.includes(placed)) {
      correctCount++;
      if (slotEl) {
        slotEl.classList.add("correct");
        slotEl.classList.remove("incorrect");
      }
    } else {
      if (slotEl) {
        slotEl.classList.add("incorrect");
        slotEl.classList.remove("correct");
      }
    }
  });
  feedbackEl.innerHTML = `<div style="font-weight:600">Score: ${correctCount} / ${quizData.length}</div>`;
  // save to leaderboard (only once per round)
  saveScoreToLeaderboard(correctCount, quizData.length);
  renderLeaderboard();
  state.checkedThisRound = true;
  // if this was a manual check, schedule an automatic reset (mirrors timer expiry behavior)
  if (manual) {
    setTimeout(() => {
      resetAll();
    }, 1200);
  }
}

function resetAll() {
  // clear placements and prepare for a new round
  state.placement = {};
  state.grabbed = null;
  feedbackEl.innerHTML = "";
  // clear checked flag and re-enable check button
  state.checkedThisRound = false;
  const chkBtn = document.getElementById('checkAll');
  if (chkBtn) chkBtn.disabled = false;
  render();
}

// wire up buttons
document.getElementById("checkAll").addEventListener("click", checkAll);
document.getElementById("resetAll").addEventListener("click", resetAll);

// font-size controls: persist in localStorage
const baseKey = "quiz-base-size";
const saved = localStorage.getItem(baseKey);
if (saved) document.documentElement.style.setProperty("--base-size", saved);
function setBaseSize(px) {
  document.documentElement.style.setProperty("--base-size", px + "px");
  localStorage.setItem(baseKey, px + "px");
}
function adjustBase(delta) {
  const cur =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--base-size")) || 16;
  const next = Math.min(28, Math.max(12, Math.round(cur + delta)));
  setBaseSize(next);
}
document.getElementById("fontInc").addEventListener("click", () => adjustBase(1));
document.getElementById("fontDec").addEventListener("click", () => adjustBase(-1));

document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") {
    state.grabbed = null;
    updateBankState();
  }
});

// initial render with safety guard so runtime errors show on the page
try {
  render();
} catch (err) {
  console.error('Render failed', err);
  const q = document.getElementById('quiz');
  const f = document.getElementById('feedback');
  if (q) q.innerHTML = '<div style="color:crimson; padding:1rem; background:#fff6f6; border-radius:6px;">Failed to render quiz — open the console for details.</div>';
  if (f) f.innerHTML = `<div style="color:crimson">Error: ${String(err.message || err)}</div>`;
}

// global error capture to help debug disappearing UI
window.addEventListener('error', (ev) => {
  try {
    const msg = ev && ev.message ? ev.message : String(ev);
    const f = document.getElementById('feedback');
    const q = document.getElementById('quiz');
    if (f) f.innerHTML = `<div style="color:crimson">Runtime error: ${escapeHtml(msg)}</div>`;
    if (q && !q.innerHTML.trim()) q.innerHTML = `<div style="color:crimson; padding:0.6rem; background:#fff6f6;">Runtime error occurred — check console.</div>`;
  } catch (e) {
    /* ignore */
  }
});
// timer: 60s default
const TIMER_DURATION = 60; // seconds
let timerRemaining = TIMER_DURATION;
let timerInterval = null;

function updateTimerDisplay() {
  const tEl = document.getElementById('timer');
  if (!tEl) return;
  tEl.textContent = `Time: ${timerRemaining}s`;
}
  
// keep sticky timer in sync
function updateTimerDisplayAndSticky() {
  updateTimerDisplay();
  updateStickyTimer();
}

function updateStickyTimer() {
  const s = document.getElementById('stickyTimer');
  if (!s) return;
  s.textContent = `Time: ${timerRemaining}s`;
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function startTimer(duration = TIMER_DURATION) {
  stopTimer();
  timerRemaining = duration;
  updateTimerDisplay();
  timerInterval = setInterval(() => {
    timerRemaining -= 1;
    if (timerRemaining <= 0) {
      stopTimer();
      updateTimerDisplayAndSticky();
      // if the user already manually checked this round, just reset; otherwise auto-check then reset
      if (state.checkedThisRound) {
        // only reset
        setTimeout(() => {
          resetAll();
        }, 200);
      } else {
        checkAll(false);
        // show results briefly then reset fields
        setTimeout(() => {
          resetAll();
        }, 1200);
      }
      return;
    }
    updateTimerDisplayAndSticky();
  }, 1000);
}

// timer is started only when user begins interaction (drag/touch)

// leaderboard utilities
const lbKey = 'quiz-leaderboard';
const nameKey = 'player-name';

function getPlayerName() {
  return (localStorage.getItem(nameKey) || 'Anonymous').trim();
}

function saveScoreToLeaderboard(score, total) {
  try {
    const raw = localStorage.getItem(lbKey) || '[]';
    const list = JSON.parse(raw);
    // also record which questions were wrong on this attempt
      const wrong = [];
      // snapshot of placed answers for every question (may be null)
      const placedAnswers = quizData.map((q, idx) => state.placement[`${idx}-1`] || null);
      quizData.forEach((q, idx) => {
        const slotKey = `${idx}-1`;
        const placed = (String(placedAnswers[idx] || "")).toLowerCase().trim();
        const acceptable = q.answers.map((a) => a.toLowerCase());
        if (!(placed && acceptable.includes(placed))) {
          wrong.push({ q: idx, placed: placedAnswers[idx] || null });
        }
      });
      const entry = { name: getPlayerName(), score: score, total: total, ts: Date.now(), wrong, placedAnswers };
    // push and sort by highest score, then recent
    list.push(entry);
    list.sort((a,b) => b.score - a.score || b.ts - a.ts);
    // keep top 50
    const trimmed = list.slice(0,50);
    localStorage.setItem(lbKey, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save leaderboard', e);
  }
}

function renderLeaderboard() {
  const el = document.getElementById('leaderboardList');
  if (!el) return;
  try {
    const raw = localStorage.getItem(lbKey) || '[]';
    const list = JSON.parse(raw);
    if (!list.length) {
      el.innerHTML = '<div class="leaderboard-empty">No scores yet. Play to be first!</div>';
      return;
    }
    const rows = list.slice(0,10).map((r, i) => `
      <div class="leaderboard-item">
        <div class="name"><a href="#" data-lb-index="${i}" class="lb-link">${escapeHtml(r.name || 'Anonymous')}</a></div>
        <div class="score">${r.score}/${r.total}</div>
      </div>
    `).join('');
    el.innerHTML = rows;
    // attach click handlers to links
    const links = el.querySelectorAll('.lb-link');
    links.forEach((lnk) => {
      lnk.addEventListener('click', (ev) => {
        ev.preventDefault();
        const idx = parseInt(lnk.getAttribute('data-lb-index'), 10);
        showHistoryFor(list[idx]);
      });
    });
  } catch (e) {
    el.innerHTML = '';
  }
}

function showHistoryFor(entry) {
  const modal = document.getElementById('historyModal');
  const body = document.getElementById('modalBody');
  const title = document.getElementById('modalTitle');
  if (!modal || !body || !title) return;
  title.textContent = `Attempt by ${escapeHtml(entry.name || 'Anonymous')} — ${entry.score}/${entry.total}`;
  // build a list of questions with status
  const items = quizData.map((q, idx) => {
    const wrong = entry.wrong.find(w => w.q === idx);
    const placed = entry.placedAnswers && entry.placedAnswers[idx] ? entry.placedAnswers[idx] : null;
    const placedDisplay = placed ? String(placed) : '—';
    const acceptable = q.answers && q.answers.length ? q.answers.join(' / ') : '';
    const ok = !wrong;
    return `<div style="padding:0.4rem 0; border-bottom:1px solid rgba(0,0,0,0.04);">
      <div style="font-weight:700">Q${idx+1}: ${escapeHtml(q.text.replace(/\{\d+\}/g, '____'))}</div>
      <div>${ok ? '<span class="ok">Correct</span>' : '<span class="miss">Incorrect</span>'} — Your answer: <strong>${escapeHtml(placedDisplay)}</strong></div>
      <div style="font-size:0.9rem; color:var(--muted, #666)">Correct answer(s): <strong>${escapeHtml(acceptable)}</strong></div>
    </div>`;
  }).join('');
  body.innerHTML = items;
  modal.setAttribute('aria-hidden','false');

  // CSV export removed — attempts are viewable in the modal but not downloadable
}

// modal close behavior
const modal = document.getElementById('historyModal');
if (modal) {
  const close = document.getElementById('modalClose');
  close && close.addEventListener('click', () => modal.setAttribute('aria-hidden','true'));
  modal.querySelector('.modal-backdrop') && modal.querySelector('.modal-backdrop').addEventListener('click', () => modal.setAttribute('aria-hidden','true'));
}

function escapeHtml(str){
  return String(str).replace(/[&<>\"']/g, function (s) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]; });
}

// render leaderboard once on load
renderLeaderboard();

// reset leaderboard button (on quiz page)
const resetLbBtn = document.getElementById('resetLeaderboard');
if (resetLbBtn) {
  resetLbBtn.addEventListener('click', () => {
    if (!confirm('Clear the leaderboard? This cannot be undone.')) return;
    localStorage.removeItem(lbKey);
    renderLeaderboard();
  });
}

// debugging: expose state
// expose helpers for debugging in the console
window._quiz = { quizData, state, render };
