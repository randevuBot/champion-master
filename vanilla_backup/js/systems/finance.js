/**
 * ChampionMaster — FinanceSystem
 * Kapsamlı Ekonomi & Finans Motoru
 *
 * Özellikler:
 *  - Haftalık maaş ödemeleri
 *  - Maç günü bilet gelirleri (ev / deplasman)
 *  - Stadyum bakım gideri (haftalık sabit)
 *  - Sponsor gelirleri (haftalık)
 *  - Finans geçmişi (son 10 hafta işlemleri)
 *  - Aylık tahmini gelir/gider projeksiyonu
 *  - UI: page-finance tam ekran finans merkezi
 */

const FinanceSystem = (() => {

  const DEFAULTS = {
    stadiumCapacity : 40000,
    ticketPrice     : 35,
    occupancyRate   : 0.78,
    sponsorIncome   : 250000,
    maintenanceCost : 120000,
    maxHistory      : 52
  };

  const TX_TYPES = {
    WAGE         : { label: 'Haftalık Maaşlar',   icon: '👔', color: 'var(--red)',   sign: -1 },
    TICKET       : { label: 'Bilet Geliri',        icon: '🎟️', color: 'var(--green)', sign: +1 },
    SPONSOR      : { label: 'Sponsor Geliri',      icon: '🤝', color: 'var(--green)', sign: +1 },
    MAINTENANCE  : { label: 'Stadyum Bakım',       icon: '🏟️', color: 'var(--red)',   sign: -1 },
    TRANSFER_IN  : { label: 'Transfer Alımı',      icon: '⬇️', color: 'var(--red)',   sign: -1 },
    TRANSFER_OUT : { label: 'Transfer Satışı',     icon: '⬆️', color: 'var(--green)', sign: +1 },
    PRIZE        : { label: 'Lig/Kupa Ödülü',     icon: '🏆', color: 'var(--gold)',  sign: +1 },
    BONUS        : { label: 'Bonus Gelir',         icon: '💫', color: 'var(--green)', sign: +1 }
  };

  function _ensureFinances() {
    if (!CM.state) return;
    const f = CM.state.finances;
    if (!f.stadiumCapacity) f.stadiumCapacity = DEFAULTS.stadiumCapacity;
    if (!f.ticketPrice)     f.ticketPrice     = DEFAULTS.ticketPrice;
    if (!f.sponsorIncome)   f.sponsorIncome   = DEFAULTS.sponsorIncome;
    if (!f.maintenanceCost) f.maintenanceCost = DEFAULTS.maintenanceCost;
    if (!f.occupancyRate)   f.occupancyRate   = DEFAULTS.occupancyRate;
    if (!Array.isArray(f.transactions)) f.transactions = [];
    if (!f.weeklyBalance)   f.weeklyBalance   = 0;
    if (!f.totalRevenue)    f.totalRevenue    = 0;
    if (!f.totalExpenses)   f.totalExpenses   = 0;
  }

  function _record(type, amount, note) {
    _ensureFinances();
    note = note || '';
    const meta   = TX_TYPES[type] || TX_TYPES.BONUS;
    const signed = meta.sign * Math.abs(amount);
    CM.state.finances.balance        += signed;
    CM.state.finances.weeklyBalance  += signed;
    if (signed > 0) {
      CM.state.finances.seasonRevenue  = (CM.state.finances.seasonRevenue  || 0) + signed;
      CM.state.finances.totalRevenue   = (CM.state.finances.totalRevenue   || 0) + signed;
    } else {
      CM.state.finances.seasonExpenses = (CM.state.finances.seasonExpenses || 0) + Math.abs(signed);
      CM.state.finances.totalExpenses  = (CM.state.finances.totalExpenses  || 0) + Math.abs(signed);
    }
    CM.state.finances.transactions.unshift({
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).slice(2,6),
      type, label: meta.label, icon: meta.icon, color: meta.color,
      amount: signed, absAmount: Math.abs(amount), note,
      week: CM.state.week, season: CM.state.season,
      date: CM.state.date ? Object.assign({}, CM.state.date) : null
    });
    if (CM.state.finances.transactions.length > 500)
      CM.state.finances.transactions = CM.state.finances.transactions.slice(0, 500);
  }

  /* PUBLIC */

  function tick(weekResult) {
    weekResult = weekResult || {};
    if (!CM.state) return;
    _ensureFinances();
    const f = CM.state.finances;
    f.weeklyBalance = 0;

    const wages = getWeeklyWageBill();
    if (wages > 0) _record('WAGE', wages, (CM.state.squad ? CM.state.squad.length : 0) + ' oyuncu maaşı');
    _record('MAINTENANCE', f.maintenanceCost, 'Haftalık tesis bakımı');
    _record('SPONSOR', f.sponsorIncome, 'Ana sponsor anlaşması');

    if (weekResult.hasMatch !== false) {
      if (weekResult.isHome !== false) {
        const occ = weekResult.attendance
          || Math.floor(f.stadiumCapacity * ((f.occupancyRate || 0.78) + Math.random() * 0.1 - 0.05));
        _record('TICKET', Math.max(0, occ) * f.ticketPrice, occ.toLocaleString('tr-TR') + ' seyirci');
      }
    }
    CM.save();
    return f.weeklyBalance;
  }

  function getWeeklyWageBill() {
    if (!CM.state || !CM.state.squad) return 0;
    return ChampionMasterData.players
      .filter(p => CM.state.squad.indexOf(p.id) !== -1)
      .reduce((s, p) => s + (p.wage || 20) * 1000, 0);
  }

  function getProjectedMonthly() {
    if (!CM.state) return { revenue: 0, expenses: 0, net: 0 };
    _ensureFinances();
    const f   = CM.state.finances;
    const avg = f.stadiumCapacity * (f.occupancyRate || 0.78) * f.ticketPrice;
    const wr  = f.sponsorIncome + avg / 2;
    const we  = getWeeklyWageBill() + f.maintenanceCost;
    return { revenue: Math.round(wr * 4), expenses: Math.round(we * 4), net: Math.round((wr - we) * 4) };
  }

  function getFinanceReport() {
    if (!CM.state) return [];
    _ensureFinances();
    const byWeek = {};
    (CM.state.finances.transactions || []).forEach(tx => {
      const k = tx.season + '_' + tx.week;
      if (!byWeek[k]) byWeek[k] = { season: tx.season, week: tx.week, income: 0, expense: 0 };
      if (tx.amount > 0) byWeek[k].income  += tx.amount;
      else               byWeek[k].expense += Math.abs(tx.amount);
    });
    return Object.values(byWeek)
      .sort((a, b) => b.season !== a.season ? b.season - a.season : b.week - a.week)
      .slice(0, 10)
      .map(r => Object.assign({}, r, { net: r.income - r.expense }));
  }

  function recordTransfer(type, amount, playerName) {
    _record(type === 'buy' ? 'TRANSFER_IN' : 'TRANSFER_OUT', amount, playerName || '');
  }

  function addPrizeMoney(amount, label) {
    _record('PRIZE', amount, label || 'Turnuva ödülü');
    CM.save();
  }

  function updateSettings(s) {
    if (!CM.state) return;
    _ensureFinances();
    s = s || {};
    const f = CM.state.finances;
    if (s.ticketPrice     !== undefined) f.ticketPrice     = Math.max(5,    Math.min(500,    s.ticketPrice));
    if (s.stadiumCapacity !== undefined) f.stadiumCapacity = Math.max(1000, Math.min(150000, s.stadiumCapacity));
    if (s.sponsorIncome   !== undefined) f.sponsorIncome   = Math.max(0,    s.sponsorIncome);
    CM.save();
  }

  /* UI */

  function _kpi(label, val, color, icon, sub) {
    return '<div class="finance-kpi-card">'
      + '<div class="kpi-icon">' + icon + '</div>'
      + '<div class="kpi-body">'
      + '<div class="kpi-label">' + label + '</div>'
      + '<div class="kpi-value" style="color:' + color + '">' + val + '</div>'
      + '<div class="kpi-sub">' + sub + '</div>'
      + '</div></div>';
  }

  function renderFinancePage() {
    if (!CM.state) return;
    _ensureFinances();
    const f     = CM.state.finances;
    const proj  = getProjectedMonthly();
    const rep   = getFinanceReport();
    const txs   = (f.transactions || []).slice(0, 20);
    const wages = getWeeklyWageBill();
    const el    = document.getElementById('page-finance');
    if (!el) return;

    const bColor  = f.balance >= 0 ? 'var(--green)' : 'var(--red)';
    const nColor  = proj.net  >= 0 ? 'var(--green)' : 'var(--red)';
    const snColor = (f.seasonRevenue||0) >= (f.seasonExpenses||0) ? 'var(--green)' : 'var(--red)';
    const occ     = Math.round((f.occupancyRate || 0.78) * 100);
    const sqCount = CM.state.squad ? CM.state.squad.length : 0;
    const estInc  = Math.round(f.stadiumCapacity * (f.occupancyRate || 0.78) * f.ticketPrice);

    let ratioBar = '';
    const tot = proj.revenue + proj.expenses;
    if (tot > 0) {
      const ip = Math.round((proj.revenue / tot) * 100);
      ratioBar = '<div style="margin-top:20px"><div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-muted);margin-bottom:6px">'
        + '<span>Gelir %' + ip + '</span><span>Gider %' + (100 - ip) + '</span></div>'
        + '<div class="fin-ratio-bar"><div class="fin-ratio-income" style="width:' + ip + '%"></div>'
        + '<div class="fin-ratio-expense" style="width:' + (100 - ip) + '%"></div></div></div>';
    }

    let repHTML = '<div class="fin-empty">Henüz yeterli veri yok. Hafta ilerledikçe rapor oluşur.</div>';
    if (rep.length > 0) {
      repHTML = '<div style="overflow-x:auto"><table class="fin-report-table"><thead><tr>'
        + '<th>Sezon</th><th>Hafta</th><th style="color:var(--green)">Gelir</th>'
        + '<th style="color:var(--red)">Gider</th><th>Net</th><th>Durum</th>'
        + '</tr></thead><tbody>'
        + rep.map(r => {
          const rc = r.net >= 0 ? 'var(--green)' : 'var(--red)';
          const bd = r.net >= 0 ? '<span class="fin-badge fin-badge-green">✅ Kâr</span>' : '<span class="fin-badge fin-badge-red">⚠️ Zarar</span>';
          return '<tr><td>' + r.season + '</td><td>H' + r.week + '</td>'
            + '<td style="color:var(--green)">' + CM.formatMoney(r.income) + '</td>'
            + '<td style="color:var(--red)">' + CM.formatMoney(r.expense) + '</td>'
            + '<td style="color:' + rc + ';font-weight:700">' + (r.net >= 0 ? '+' : '') + CM.formatMoney(r.net) + '</td>'
            + '<td>' + bd + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }

    let txHTML = '<div class="fin-empty">İşlem bulunamadı. Bir hafta ilerleyin.</div>';
    if (txs.length > 0) {
      txHTML = '<div class="fin-tx-list">'
        + txs.map(tx => '<div class="fin-tx-row">'
          + '<div class="fin-tx-icon">' + tx.icon + '</div>'
          + '<div class="fin-tx-info"><div class="fin-tx-label">' + tx.label + '</div>'
          + '<div class="fin-tx-note">' + (tx.note || '') + ' • S' + tx.season + ' H' + tx.week + '</div></div>'
          + '<div class="fin-tx-amount" style="color:' + tx.color + '">'
          + (tx.amount >= 0 ? '+' : '') + CM.formatMoney(Math.abs(tx.amount)) + '</div>'
          + '</div>').join('') + '</div>';
    }

    el.innerHTML =
      '<div class="finance-page-inner">'

      + '<div class="finance-header">'
      + '<div><h2 class="page-title" style="margin-bottom:4px">💰 Finans Merkezi</h2>'
      + '<div class="page-subtitle">Gelir, gider ve bütçe yönetimi</div></div>'
      + '<div><button class="btn btn-ghost btn-sm" onclick="FinanceSystem._showSettingsModal()">⚙️ Finans Ayarları</button></div>'
      + '</div>'

      + '<div class="finance-kpi-row">'
      + _kpi('Güncel Bakiye',      CM.formatMoney(f.balance),             bColor,          '💵', 'Toplam nakit varlığı')
      + _kpi('Haftalık Maaş',      CM.formatMoney(wages),                 'var(--red)',     '👔', sqCount + ' oyuncu')
      + _kpi('Sponsor (Haftalık)', CM.formatMoney(f.sponsorIncome),       'var(--gold)',    '🤝', 'Ana sponsor anlaşması')
      + _kpi('Transfer Bütçesi',   CM.formatMoney(f.transferBudget || 0), 'var(--accent)',  '🔄', 'Kullanılabilir fon')
      + '</div>'

      + '<div class="finance-mid-row">'

        + '<div class="finance-glass-card finance-projection">'
        + '<div class="fcard-title">📈 Aylık Projeksiyon</div>'
        + '<div class="proj-grid">'
        + '<div class="proj-item"><div class="proj-label">Tahmini Gelir</div>'
        + '<div class="proj-amount" style="color:var(--green)">' + CM.formatMoney(proj.revenue) + '</div>'
        + '<div class="proj-sub">/ 4 hafta</div></div>'
        + '<div class="proj-divider"></div>'
        + '<div class="proj-item"><div class="proj-label">Tahmini Gider</div>'
        + '<div class="proj-amount" style="color:var(--red)">' + CM.formatMoney(proj.expenses) + '</div>'
        + '<div class="proj-sub">/ 4 hafta</div></div>'
        + '<div class="proj-divider"></div>'
        + '<div class="proj-item"><div class="proj-label">Net Akış</div>'
        + '<div class="proj-amount" style="color:' + nColor + '">' + (proj.net >= 0 ? '+' : '') + CM.formatMoney(proj.net) + '</div>'
        + '<div class="proj-sub">' + (proj.net >= 0 ? '✅ Kârlı' : '⚠️ Zararlı') + '</div></div>'
        + '</div>' + ratioBar + '</div>'

        + '<div class="finance-glass-card finance-stadium">'
        + '<div class="fcard-title">🏟️ Stadyum & Bilet</div>'
        + '<div class="stadium-stats">'
        + '<div class="st-row"><span class="st-label">Kapasite</span><span class="st-value">' + f.stadiumCapacity.toLocaleString('tr-TR') + '</span></div>'
        + '<div class="st-row"><span class="st-label">Bilet Fiyatı</span><span class="st-value">€' + f.ticketPrice + '</span></div>'
        + '<div class="st-row"><span class="st-label">Doluluk Oranı</span><span class="st-value">' + occ + '%</span></div>'
        + '<div class="st-row"><span class="st-label">Tahmini Ev Maçı Geliri</span><span class="st-value" style="color:var(--green)">' + CM.formatMoney(estInc) + '</span></div>'
        + '<div class="st-row"><span class="st-label">Bakım Gideri / Hafta</span><span class="st-value" style="color:var(--red)">' + CM.formatMoney(f.maintenanceCost) + '</span></div>'
        + '</div>'
        + '<div style="margin-top:16px"><div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">Stadyum Doluluk</div>'
        + '<div class="fin-progress-bg"><div class="fin-progress-fill" style="width:' + occ + '%;background:var(--green)"></div></div>'
        + '</div></div>'

        + '<div class="finance-glass-card finance-season-summary">'
        + '<div class="fcard-title">📊 Sezon Özeti</div>'
        + '<div class="season-fin-grid">'
        + '<div class="sfin-item"><div class="sfin-label">Toplam Gelir</div><div class="sfin-value" style="color:var(--green)">' + CM.formatMoney(f.seasonRevenue || 0) + '</div></div>'
        + '<div class="sfin-item"><div class="sfin-label">Toplam Gider</div><div class="sfin-value" style="color:var(--red)">' + CM.formatMoney(f.seasonExpenses || 0) + '</div></div>'
        + '<div class="sfin-item"><div class="sfin-label">Net Kâr/Zarar</div><div class="sfin-value" style="color:' + snColor + '">' + CM.formatMoney((f.seasonRevenue || 0) - (f.seasonExpenses || 0)) + '</div></div>'
        + '<div class="sfin-item"><div class="sfin-label">Haftalık Maaş</div><div class="sfin-value">' + CM.formatMoney(wages) + '</div></div>'
        + '</div></div>'

      + '</div>'

      + '<div class="finance-glass-card" style="margin-bottom:24px"><div class="fcard-title">📅 Haftalık Rapor (Son 10 Hafta)</div>' + repHTML + '</div>'
      + '<div class="finance-glass-card"><div class="fcard-title">🧾 Son İşlemler</div>' + txHTML + '</div>'

      + '</div>'

      + '<div id="finance-settings-overlay" class="modal-overlay" style="display:none" onclick="FinanceSystem._closeSettingsModal(event)">'
      + '<div class="modal modal-sm" onclick="event.stopPropagation()">'
      + '<div class="modal-header"><h3 style="font-family:\'Rajdhani\',sans-serif;font-size:22px;font-weight:700">⚙️ Finans Ayarları</h3>'
      + '<button class="btn btn-icon btn-ghost" onclick="FinanceSystem._closeSettingsModal()">✕</button></div>'
      + '<div class="modal-body" style="display:flex;flex-direction:column;gap:18px">'
      + '<div class="form-group"><label class="form-label">🎟️ Bilet Fiyatı (€)</label>'
      + '<input type="number" id="fin-ticket-price" class="form-input" min="5" max="500" value="' + f.ticketPrice + '"></div>'
      + '<div class="form-group"><label class="form-label">🏟️ Stadyum Kapasitesi</label>'
      + '<input type="number" id="fin-capacity" class="form-input" min="1000" max="150000" value="' + f.stadiumCapacity + '"></div>'
      + '<div class="form-group"><label class="form-label">🤝 Haftalık Sponsor Geliri (€)</label>'
      + '<input type="number" id="fin-sponsor" class="form-input" min="0" value="' + f.sponsorIncome + '"></div>'
      + '<div style="display:flex;gap:12px;justify-content:flex-end">'
      + '<button class="btn btn-ghost" onclick="FinanceSystem._closeSettingsModal()">İptal</button>'
      + '<button class="btn btn-primary" onclick="FinanceSystem._saveSettings()">💾 Kaydet</button>'
      + '</div></div></div></div>';
  }

  function _showSettingsModal() {
    const o = document.getElementById('finance-settings-overlay');
    if (o) o.style.display = 'flex';
  }

  function _closeSettingsModal(e) {
    if (e && e.target !== document.getElementById('finance-settings-overlay')) return;
    const o = document.getElementById('finance-settings-overlay');
    if (o) o.style.display = 'none';
  }

  function _saveSettings() {
    const tp  = parseFloat((document.getElementById('fin-ticket-price') || {}).value);
    const cap = parseInt((document.getElementById('fin-capacity') || {}).value);
    const sp  = parseFloat((document.getElementById('fin-sponsor') || {}).value);
    updateSettings({
      ticketPrice     : isNaN(tp)  ? undefined : tp,
      stadiumCapacity : isNaN(cap) ? undefined : cap,
      sponsorIncome   : isNaN(sp)  ? undefined : sp
    });
    _closeSettingsModal();
    renderFinancePage();
    if (typeof UI !== 'undefined' && UI.showToast) UI.showToast('✅ Finans ayarları kaydedildi!', 'success');
  }

  return { tick, getWeeklyWageBill, getProjectedMonthly, getFinanceReport,
           recordTransfer, addPrizeMoney, updateSettings, renderFinancePage,
           DEFAULTS, TX_TYPES, _showSettingsModal, _closeSettingsModal, _saveSettings };

})();

/* Patch CM.advanceWeek */
(function() {
  const _orig = CM.advanceWeek.bind(CM);
  CM.advanceWeek = function() {
    if (!CM.state) return _orig();
    const fix    = (CM.state.fixtures || []).filter(f => !f.played && f.week === CM.state.week)[0];
    const isHome = fix ? fix.homeClubId === CM.state.myClubId : true;
    FinanceSystem.tick({ isHome, hasMatch: !!fix });
    return _orig();
  };
})();

/* Patch UI.renderPage */
(function() {
  function _patch() {
    if (typeof UI === 'undefined' || !UI.renderPage) return;
    const _orig = UI.renderPage.bind(UI);
    UI.renderPage = function(page) {
      if (page === 'finance') { FinanceSystem.renderFinancePage(); return; }
      return _orig(page);
    };
  }
  if (typeof UI !== 'undefined') _patch();
  else window.addEventListener('load', _patch);
})();