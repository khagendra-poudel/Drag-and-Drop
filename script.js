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
    answers: ["software"],
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
    text: "The permanent memory of a computer is called {1}.",
    answers: [
      "rom",
      "read only memory",

    ],
    bank: ["ROM", "RAM", "SSD", "HDD"],
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
    text: "A computer works with the help of {1} and software.",
    answers: ["hardware"],
    bank: ["hardware", "software", "firmware", "peripherals"],
  },
  {
    text: "The brain of the computer is the {1}.",
    answers: ["cpu", "central processing unit"],
    bank: ["CPU", "GPU", "ALU", "Motherboard"],
  },
  {
    text: "Hard disk, pen drive, and CD are examples of {1} devices.",
    answers: ["storage"],
    bank: ["storage", "memory", "input", "output"],
  },
  {
    text: "A monitor is also known as a {1}.",
    answers: [
      "vdu",
      "vdu (visual display unit)",
      "visual display unit",
     
    ],
    bank: ["VDU", "monitor", "display", "screen"],
  },
  {
    text: "A computer can only understand {1} language.",
    answers: ["machine", "machine language"],
    bank: ["machine", "assembly", "high-level", "binary"],
  },
  {
    text: "The speed of a computer is measured in {1}.",
    answers: ["hz", "Hertz", "hz (hertz)"],
    bank: ["Hertz", "MegaHertz", "beats/second", "KiloHertz"],
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
      btn.draggable = true;
  btn.setAttribute("data-word", w);
  // color variant for playful look
  btn.classList.add(`color-${bankIdx % 4}`);
      // tag button with its question index and bank index so we can restore it later
      btn.setAttribute("data-q", idx);
      btn.setAttribute("data-bank-idx", bankIdx);
      btn.textContent = w;
      btn.addEventListener("dragstart", (ev) => {
        ev.dataTransfer.setData("text/plain", w);
        ev.dataTransfer.effectAllowed = "move";
        state.grabbed = w;
        btn.setAttribute("aria-grabbed", "true");
  // start timer when user begins moving a word (desktop drag)
  if (!state.checkedThisRound && !timerInterval) startTimer();
      });
      btn.addEventListener("dragend", (ev) => {
        btn.setAttribute("aria-grabbed", "false");
        state.grabbed = null;
      });
      btn.addEventListener("click", () => {
  if (btn.disabled) return;
  state.grabbed = state.grabbed === w ? null : w;
  updateBankState();
      });
      btn.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          btn.click();
        }
      });
      // touch handlers for mobile drag gestures
      (function () {
        let touchState = null; // { startX, startY, moved, ghost }

        function makeGhost(el, x, y) {
          const g = el.cloneNode(true);
          g.style.position = 'fixed';
          g.style.left = (x - el.offsetWidth / 2) + 'px';
          g.style.top = (y - el.offsetHeight / 2) + 'px';
          g.style.width = el.offsetWidth + 'px';
          g.style.pointerEvents = 'none';
          g.style.zIndex = 9999;
          g.style.opacity = '0.95';
          g.style.transform = 'translateZ(0) scale(1.02)';
          g.classList.add('touch-ghost');
          document.body.appendChild(g);
          return g;
        }

        btn.addEventListener('touchstart', function (ev) {
          if (btn.disabled) return;
          const t = ev.changedTouches[0];
          // don't create the ghost immediately — wait for a short hold or meaningful move
          const HOLD_DELAY = 180; // ms
          const MOVE_THRESHOLD = 10; // px
          if (touchState && touchState.timer) clearTimeout(touchState.timer);
          touchState = {
            startX: t.clientX,
            startY: t.clientY,
            moved: false,
            ghost: null,
            timer: setTimeout(() => {
              // create ghost after hold
              if (touchState && !touchState.ghost) {
                touchState.ghost = makeGhost(btn, t.clientX, t.clientY);
                // mark grabbed once drag begins
                state.grabbed = w;
                updateBankState();
                // start timer when touch drag begins
                if (!state.checkedThisRound && !timerInterval) startTimer();
              }
            }, HOLD_DELAY),
          };
          // don't preventDefault yet; allow scrolling unless we decide it's a drag
        }, { passive: false });

        btn.addEventListener('touchmove', function (ev) {
          if (!touchState) return;
          const t = ev.changedTouches[0];
          const dx = t.clientX - touchState.startX;
          const dy = t.clientY - touchState.startY;
          const dist = Math.hypot(dx, dy);
          if (dist > MOVE_THRESHOLD) touchState.moved = true;
          // if user moved enough and we don't yet have a ghost, start dragging
          if (touchState.moved && !touchState.ghost) {
            if (touchState.timer) { clearTimeout(touchState.timer); touchState.timer = null; }
            touchState.ghost = makeGhost(btn, t.clientX, t.clientY);
            state.grabbed = w;
            updateBankState();
            // start timer once the user has initiated a touch-drag
            if (!state.checkedThisRound && !timerInterval) startTimer();
            // once ghost exists, prevent scrolling
            ev.preventDefault();
          }
          if (touchState.ghost) {
            touchState.ghost.style.left = (t.clientX - btn.offsetWidth / 2) + 'px';
            touchState.ghost.style.top = (t.clientY - btn.offsetHeight / 2) + 'px';
            ev.preventDefault();
          }
        }, { passive: false });

        btn.addEventListener('touchend', function (ev) {
          if (!touchState) return;
          const t = ev.changedTouches[0];
          const ghost = touchState.ghost;
          // clear any pending timer
          if (touchState.timer) { clearTimeout(touchState.timer); touchState.timer = null; }
          // if it was a tap (no meaningful move and no ghost created), toggle selection
          if (!touchState.moved && !ghost) {
            state.grabbed = state.grabbed === w ? null : w;
            updateBankState();
            touchState = null;
            ev.preventDefault();
            return;
          }
          // if we had a ghost, detect drop target
          if (ghost) {
            const target = document.elementFromPoint(t.clientX, t.clientY);
            let slot = target && target.closest && target.closest('.blank');
            if (slot) {
              const slotKey = slot.getAttribute('data-slot');
              if (slotKey) {
                const parts = slotKey.split('-');
                const qIdx = parseInt(parts[0], 10);
                const slotNum = parts[1];
                placeWord(qIdx, slotNum, w);
              }
            }
            if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
          }
          touchState = null;
          state.grabbed = null;
          updateBankState();
          ev.preventDefault();
        }, { passive: false });

        btn.addEventListener('touchcancel', function (ev) {
          if (!touchState) return;
          if (touchState.timer) { clearTimeout(touchState.timer); touchState.timer = null; }
          if (touchState.ghost && touchState.ghost.parentNode) touchState.ghost.parentNode.removeChild(touchState.ghost);
          touchState = null;
          state.grabbed = null;
          updateBankState();
        });
      })();
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

// initial render
render();
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

  // wire export button to download this attempt as CSV
  const exportBtn = document.getElementById('modalExport');
  if (exportBtn) {
    // remove previous handler by cloning
    const newBtn = exportBtn.cloneNode(true);
    exportBtn.parentNode.replaceChild(newBtn, exportBtn);
    newBtn.addEventListener('click', () => {
      try {
        const rows = [];
        // header
        rows.push(['Question #', 'Question Text', 'Your Answer', 'Correct Answer(s)', 'Status']);
        quizData.forEach((q, idx) => {
          const placed = entry.placedAnswers && entry.placedAnswers[idx] ? entry.placedAnswers[idx] : '';
          const correct = q.answers ? q.answers.join(' / ') : '';
          const wrongObj = entry.wrong.find(w => w.q === idx);
          const status = wrongObj ? 'Incorrect' : 'Correct';
          rows.push([String(idx+1), q.text.replace(/\{\d+\}/g, '____'), placed, correct, status]);
        });
        // build CSV content with proper escaping
        const csv = rows.map(r => r.map(cell => '"' + String(cell).replace(/"/g, '""') + '"').join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const namePart = (entry.name || 'attempt').replace(/[^a-z0-9_\-]/gi, '_');
        const date = new Date(entry.ts || Date.now());
        const stamp = date.toISOString().replace(/[:.]/g, '-');
        a.href = url;
        a.download = `quiz_attempt_${namePart}_${stamp}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Export failed', err);
        alert('Failed to export CSV');
      }
    });
  }
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
window._quiz = { quizData, state };
