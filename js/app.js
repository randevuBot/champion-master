/**
 * ChampionMaster — Main App Initializer
 */

// ===================================================
//   ANTI-CHEAT SECURITY
// ===================================================
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('keydown', e => {
  if (e.key === 'F12' || 
     (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
     (e.ctrlKey && e.key === 'U')) {
    e.preventDefault();
  }
});


// Global state for new game setup
window._setupData = { managerName: '', difficulty: 'easy', clubId: null };

document.addEventListener('DOMContentLoaded', () => {
  const bar = document.getElementById('splash-progress-fill');
  const text = document.getElementById('splash-text');

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 18;
    if (progress > 100) progress = 100;
    if (bar) bar.style.width = progress + '%';
    if (progress < 30) text.textContent = 'Oyuncu verileri yükleniyor...';
    else if (progress < 70) text.textContent = 'Ligler oluşturuluyor...';
    else if (progress < 90) text.textContent = 'Grafikler hazırlanıyor...';
    else text.textContent = 'Hazır!';

    if (progress === 100) {
      clearInterval(interval);
      setTimeout(() => initApp(), 500);
    }
  }, 180);
});

function initApp() {
  // Buton durumu
  const continueBtn = document.getElementById('btn-continue');
  if (continueBtn) {
    continueBtn.disabled = !CM.hasSave();
    continueBtn.style.opacity = CM.hasSave() ? '1' : '0.4';
  }
  UI.showScreen('menu');

  // ── AI Sistemini Başlat ────────────────────────────────────────────────────
  if (typeof AISystem !== 'undefined') {
    // Oyun ekranı yüklendikten sonra sidebar'a buton eklenmesi için kısa gecikme
    setTimeout(() => AISystem.init(), 800);
  }
}

// Yeni oyun - önce menajer profili
window.startNewGame = function() {
  UI.showScreen('manager-setup');
};

// Menajer profili tamamlandı - kulüp seçimine geç
window.goToClubSelect = function() {
  const nameInput = document.getElementById('input-manager-name');
  const name = (nameInput?.value || '').trim();
  if (!name) {
    UI.shakeElement(nameInput);
    UI.toast('warning', 'Lütfen menajer adını gir!');
    return;
  }
  window._setupData.managerName = name;
  UI.showScreen('club-select');

  const tabsContainer = document.getElementById('league-tabs');
  tabsContainer.innerHTML = ChampionMasterData.leagues.map((l, i) =>
    `<div class="league-tab ${i===0?'active':''}" onclick="selectLeagueTab('${l.id}', this)">${l.name}</div>`
  ).join('');
  if (ChampionMasterData.leagues.length > 0) {
    UI.renderClubSelect(ChampionMasterData.leagues[0].id);
  }
};

// Kulüp onaylama - oyunu başlat
window.confirmClubSelection = function() {
  if (!UI.selectedClubId) {
    UI.toast('warning', 'Lütfen bir kulüp seçin');
    return;
  }
  window._setupData.clubId = UI.selectedClubId;
  CM.newGame(UI.selectedClubId, window._setupData.managerName);
  CM.state.settings.difficulty = window._setupData.difficulty || 'easy';
  CM.save();

  UI.toast('success', '⚽ Kariyer Başladı!', 'Yeni kulübünüze hoş geldiniz.');
  UI.updateSidebar();
  UI.showScreen('game');
  UI.showPage('dashboard');
  if (typeof AISystem !== 'undefined') setTimeout(() => AISystem.init(), 300);
};

// Kayıtlı oyuna devam
window.continueGame = function() {
  if (!CM.hasSave()) {
    UI.toast('error', 'Kayıtlı oyun bulunamadı.');
    return;
  }
  CM.load();
  // Scout sistemi: kayıtlı oyunda kendi kadroyu keşfedilmiş say (eski kayıtlar için)
  if (typeof ScoutSystem !== 'undefined') {
    ScoutSystem.initMySquad();
  }
  UI.updateSidebar();
  UI.showScreen('game');
  UI.showPage('dashboard');
  if (typeof AISystem !== 'undefined') setTimeout(() => AISystem.init(), 300);
};

// Lig sekmesi seçimi
window.selectLeagueTab = function(leagueId, el) {
  document.querySelectorAll('.league-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  UI.renderClubSelect(leagueId);
};
