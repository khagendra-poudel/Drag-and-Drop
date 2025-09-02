// persist player name and render a small leaderboard preview
(function () {
  const nameEl = document.getElementById("playerName");
  const startBtn = document.getElementById("startBtn");
  const preview = document.getElementById("lb-preview");
  const nameKey = "player-name";
  const lbKey = "quiz-leaderboard";

  function renderPreview() {
    if (!preview) return; // preview removed on this page
    const raw = localStorage.getItem(lbKey);
    if (!raw) {
      preview.innerHTML =
        '<div style="color:rgba(6,26,41,0.7)">No leaderboard yet — be the first!</div>';
      return;
    }
    try {
      const data = JSON.parse(raw);
      if (!data.length) {
        preview.innerHTML =
          '<div style="color:rgba(6,26,41,0.7)">No leaderboard yet — be the first!</div>';
        return;
      }
      const top = data.slice(0, 5);
      const rows = top
        .map(
          (r, i) => `
              <div style="display:flex; justify-content:space-between; padding:0.35rem 0; border-bottom:1px dashed rgba(6,26,41,0.04);">
                <div style="font-weight:700">${i + 1}. ${escapeHtml(
                  r.name
                )}</div>
                <div style="color:rgba(6,26,41,0.6)">${r.score}/${r.total}</div>
              </div>`
        )
        .join("");
      preview.innerHTML = `<div style="font-size:0.95rem; margin-bottom:0.35rem; color:rgba(6,26,41,0.7); font-weight:700">Leaderboard</div>${rows}`;
    } catch (e) {
      preview.innerHTML = "";
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>\"']/g, function (s) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[s];
    });
  }

  // populate saved name
  const saved = localStorage.getItem(nameKey);
  if (saved) nameEl.value = saved;

  startBtn.addEventListener("click", () => {
    const n = (nameEl.value || "").trim();
    if (n) localStorage.setItem(nameKey, n);
    else localStorage.removeItem(nameKey);
    // allow navigation to quiz.html (anchor)
  });

  // reset will be handled on quiz pages; render preview if present
  renderPreview();
})();
