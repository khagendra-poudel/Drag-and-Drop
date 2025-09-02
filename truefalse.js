// Simple data-driven true/false quiz
const tfData = [
  { stmt: 'A CPU stands for Central Processing Unit.', ans: true },
  { stmt: 'RAM is permanent storage like a hard disk.', ans: false },
  { stmt: 'Output devices display or present information.', ans: true },
  { stmt: 'Software refers to physical components.', ans: false },
  { stmt: 'IPO stands for Input-Processing-Output.', ans: true },
];

const tfEl = document.getElementById('tf-quiz');
const tfFeedback = document.getElementById('tf-feedback');
const lbKey = 'tf-leaderboard';

function renderTF() {
  tfEl.innerHTML = '';
  tfData.forEach((q, i) => {
    const card = document.createElement('div');
    card.className = 'tf-card';
    card.setAttribute('data-idx', i);
    const p = document.createElement('div');
    p.className = 'tf-stmt';
    p.textContent = `${i + 1}. ${q.stmt}`;
    card.appendChild(p);

    const controls = document.createElement('div');
    controls.className = 'tf-controls';
    ['True', 'False'].forEach((label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'tf-button';
      b.textContent = label;
      b.setAttribute('data-val', label.toLowerCase());
      b.addEventListener('click', () => {
        // mark selection
        controls.querySelectorAll('.tf-button').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
      });
      b.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); b.click(); }
      });
      controls.appendChild(b);
    });
    card.appendChild(controls);
    tfEl.appendChild(card);
  });
}

function collectAnswers() {
  const answers = tfData.map((q, i) => {
    const card = tfEl.querySelector(`.tf-card[data-idx="${i}"]`);
    if (!card) return null;
    const sel = card.querySelector('.tf-button.selected');
    return sel ? (sel.getAttribute('data-val') === 'true') : null;
  });
  return answers;
}

function checkTF() {
  const answers = collectAnswers();
  let correct = 0;
  answers.forEach((val, i) => {
    const card = tfEl.querySelector(`.tf-card[data-idx="${i}"]`);
    card.classList.remove('correct','incorrect');
    if (val === null) {
      card.classList.add('incorrect');
    } else if (val === tfData[i].ans) {
      correct++;
      card.classList.add('correct');
    } else {
      card.classList.add('incorrect');
    }
  });
  tfFeedback.innerHTML = `<div style="font-weight:600">Score: ${correct} / ${tfData.length}</div>`;
  saveScoreToLeaderboard(correct, tfData.length);
  renderLeaderboardTF();
}

function resetTF() {
  renderTF();
  tfFeedback.innerHTML = '';
}

function saveScoreToLeaderboard(score, total) {
  try {
    const raw = localStorage.getItem(lbKey) || '[]';
    const list = JSON.parse(raw);
    const placedAnswers = collectAnswers();
    const wrong = [];
    tfData.forEach((q, idx) => {
      const placed = placedAnswers[idx];
      if (!(placed !== null && placed === q.ans)) wrong.push({ q: idx, placed: placed === null ? null : String(placed) });
    });
    const entry = { name: (localStorage.getItem('player-name')||'Anonymous'), score, total, ts: Date.now(), wrong, placedAnswers };
    list.push(entry);
    list.sort((a,b) => b.score - a.score || b.ts - a.ts);
    localStorage.setItem(lbKey, JSON.stringify(list.slice(0,50)));
  } catch (e) { console.error('save leaderboard failed', e); }
}

function renderLeaderboardTF() {
  const el = document.getElementById('tfLeaderboardList');
  if (!el) return;
  try {
    const raw = localStorage.getItem(lbKey) || '[]';
    const list = JSON.parse(raw);
    if (!list.length) { el.innerHTML = '<div style="color:rgba(6,26,41,0.7)">No scores yet.</div>'; return; }
    el.innerHTML = list.slice(0,5).map((r,i) => `<div style="display:flex; justify-content:space-between; padding:0.25rem 0; border-bottom:1px dashed rgba(0,0,0,0.04)">${i+1}. <strong>${escapeHtml(r.name||'Anonymous')}</strong> <span style="color:#666">${r.score}/${r.total}</span></div>`).join('');
  } catch (e) { el.innerHTML = ''; }
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(ch){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[ch]; }); }

// initialize immediately (script is loaded with defer) and guard against missing elements
(function initTF(){
  try {
    if (!tfEl) {
      console.warn('truefalse: #tf-quiz not found — aborting init');
      return;
    }
    renderTF();
    renderLeaderboardTF();
    const checkBtn = document.getElementById('tfCheck');
    const resetBtn = document.getElementById('tfReset');
    if (checkBtn) checkBtn.addEventListener('click', checkTF);
    else console.warn('truefalse: #tfCheck not found');
    if (resetBtn) resetBtn.addEventListener('click', resetTF);
    else console.warn('truefalse: #tfReset not found');
    const resetLb = document.getElementById('tfResetLeaderboard');
    if (resetLb) {
      resetLb.addEventListener('click', () => {
        if (!confirm('Clear the True/False leaderboard? This cannot be undone.')) return;
        localStorage.removeItem(lbKey);
        renderLeaderboardTF();
      });
    }
  } catch (err) {
    console.error('truefalse init failed', err);
  }
})();
