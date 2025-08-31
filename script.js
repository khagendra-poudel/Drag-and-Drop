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
    bank: ["Hertz", "MegaHertz", "beats per second", "KiloHertz"],
  },
];

const quizEl = document.getElementById("quiz");
const feedbackEl = document.getElementById("feedback");
const state = { placement: {}, grabbed: null, placedButton: {} };

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

function checkAll() {
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
  // save to leaderboard
  saveScoreToLeaderboard(correctCount, quizData.length);
  renderLeaderboard();
}

function resetAll() {
  state.placement = {};
  state.grabbed = null;
  feedbackEl.innerHTML = "";
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
    const entry = { name: getPlayerName(), score: score, total: total, ts: Date.now() };
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
        <div class="name">${escapeHtml(r.name || 'Anonymous')}</div>
        <div class="score">${r.score}/${r.total}</div>
      </div>
    `).join('');
    el.innerHTML = rows;
  } catch (e) {
    el.innerHTML = '';
  }
}

function escapeHtml(str){
  return String(str).replace(/[&<>\"']/g, function (s) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]; });
}

// render leaderboard once on load
renderLeaderboard();

// debugging: expose state
window._quiz = { quizData, state };
