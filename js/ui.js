/**
 * ChampionMaster — UI Renderer
 * Handles all DOM rendering and screen management
 */

class TacticsCanvas {
  constructor(canvas, parentEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.parent = parentEl;
    this.players = [];
    this.draggedPlayer = null;
    this.hoveredPlayer = null;
    this.isDragging = false;
    this.startX = 0; this.startY = 0;
    this.animId = null;
    this.resize();
    this.bindEvents();
    window.addEventListener('resize', this.resize.bind(this));
  }
  bindEvents() {
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.startX = x; this.startY = y;
      this.isDragging = false;
      for (let i = this.players.length - 1; i >= 0; i--) {
        const p = this.players[i];
        const px = (p.x / 100) * this.canvas.width;
        const py = (p.y / 100) * this.canvas.height;
        if (Math.hypot(px - x, py - y) < 25) {
          this.draggedPlayer = p;
          break;
        }
      }
    });
    this.canvas.addEventListener('pointermove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (this.draggedPlayer) {
        if (Math.abs(x - this.startX) > 5 || Math.abs(y - this.startY) > 5) this.isDragging = true;
        if (this.isDragging) {
          let newX = (x / this.canvas.width) * 100;
          let newY = (y / this.canvas.height) * 100;
          this.draggedPlayer.x = Math.max(0, Math.min(100, newX));
          this.draggedPlayer.y = Math.max(0, Math.min(100, newY));
        }
      } else {
        this.hoveredPlayer = null;
        for (let i = this.players.length - 1; i >= 0; i--) {
          const p = this.players[i];
          const px = (p.x / 100) * this.canvas.width;
          const py = (p.y / 100) * this.canvas.height;
          if (Math.hypot(px - x, py - y) < 25) {
            this.hoveredPlayer = p;
            this.canvas.style.cursor = 'pointer';
            return;
          }
        }
        this.canvas.style.cursor = 'default';
      }
    });
    this.canvas.addEventListener('pointerup', (e) => {
      e.preventDefault();
      if (this.draggedPlayer) {
        if (!this.isDragging) {
          UI.swapPlayer(this.draggedPlayer.index, this.draggedPlayer.slot);
        } else {
          const formation = CM.state.formation;
          if (!CM.state.customCoords) CM.state.customCoords = {};
          if (!CM.state.customCoords[formation]) {
            CM.state.customCoords[formation] = JSON.parse(JSON.stringify(UI.getFormationCoordsBase(formation)));
          }
          CM.state.customCoords[formation][this.draggedPlayer.index] = { x: this.draggedPlayer.x, y: this.draggedPlayer.y };
        }
        this.draggedPlayer = null;
        this.isDragging = false;
      }
    });
  }
  resize() {
    const rect = this.parent.getBoundingClientRect();
    if(rect.width === 0) return;
    this.canvas.width = rect.width;
    this.canvas.height = rect.width * 1.5;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
  }
  setPlayers(data) {
    this.players = data;
    if (this.animId) cancelAnimationFrame(this.animId);
    const loop = () => { this.draw(); this.animId = requestAnimationFrame(loop); };
    loop();
  }
  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    const time = Date.now();
    
    // 1. ANİMASYONLU SAHA ZEMİNİ
    ctx.save();
    
    // Temel zemin gradyanı (koyu gece mavisi/yeşili)
    const grassGrad = ctx.createLinearGradient(0, 0, 0, h);
    grassGrad.addColorStop(0, '#0a101d');
    grassGrad.addColorStop(1, '#0f1d16');
    ctx.fillStyle = grassGrad;
    ctx.fillRect(0, 0, w, h);
    
    // Çok yavaş hareket eden çim şeritleri
    const stripeHeight = h / 12;
    const offset = (time / 100) % (stripeHeight * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
    for(let y = -stripeHeight*2 + offset; y < h; y += stripeHeight * 2) {
      ctx.fillRect(0, y, w, stripeHeight);
    }
    
    // Parlayan saha çizgileri
    const lineGlow = Math.sin(time / 800) * 2 + 4;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.shadowColor = 'rgba(0, 200, 255, 0.5)';
    ctx.shadowBlur = lineGlow;
    ctx.lineWidth = 1.5;
    
    // Dış Saha Çizgisi
    ctx.strokeRect(15, 15, w - 30, h - 30);
    
    // Orta Saha Çizgisi ve Yuvarlağı
    ctx.beginPath();
    ctx.moveTo(15, h/2);
    ctx.lineTo(w-15, h/2);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(w/2, h/2, w * 0.15, 0, Math.PI * 2);
    ctx.stroke();
    
    // Ceza Sahaları
    const paW = w * 0.5;
    const paH = h * 0.16;
    ctx.strokeRect(w/2 - paW/2, 15, paW, paH);
    ctx.strokeRect(w/2 - paW/2, h - 15 - paH, paW, paH);
    
    // Altıpas (Kale Sahası)
    const gaW = w * 0.25;
    const gaH = h * 0.06;
    ctx.strokeRect(w/2 - gaW/2, 15, gaW, gaH);
    ctx.strokeRect(w/2 - gaW/2, h - 15 - gaH, gaW, gaH);
    
    // Orta saha noktası
    ctx.beginPath();
    ctx.arc(w/2, h/2, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();

    ctx.restore();

    // 2. OYUNCULARI ÇİZ (PREMIUM EFEKTLERLE)
    // Sürüklenen oyuncuyu en üste çizmek için sıralıyoruz
    const sortedPlayers = [...this.players].sort((a, b) => {
      if (this.draggedPlayer === a) return 1;
      if (this.draggedPlayer === b) return -1;
      return 0;
    });

    sortedPlayers.forEach(p => {
      const px = (p.x / 100) * w;
      const py = (p.y / 100) * h;
      const isHovered = this.hoveredPlayer === p || this.draggedPlayer === p;
      
      // Nefes alma (breathe) efekti
      const breathe = Math.sin(time / 250 + p.index) * 1.5;
      const radius = (isHovered ? 26 : 22) + (p.tier === 'gold' ? breathe : 0);
      
      ctx.save();
      
      // Tier'a göre stil belirleme
      if (p.tier === 'gold') {
        const glow = Math.sin(time / 150) * 15 + 25;
        ctx.shadowColor = '#FFDF00';
        ctx.shadowBlur = glow;
        
        // Dönen renkli gradyan (Hızlı dönüş)
        const angle = time / 800;
        const grad = ctx.createLinearGradient(
          px - Math.cos(angle)*radius, py - Math.sin(angle)*radius, 
          px + Math.cos(angle)*radius, py + Math.sin(angle)*radius
        );
        grad.addColorStop(0, '#FFDF00'); 
        grad.addColorStop(0.3, '#FFF'); 
        grad.addColorStop(0.7, '#DAA520');
        grad.addColorStop(1, '#FFDF00');
        
        ctx.fillStyle = grad; 
        ctx.strokeStyle = '#FFF'; 
        ctx.lineWidth = 3;
      } 
      else if (p.tier === 'silver') {
        const glow = Math.sin(time / 200) * 10 + 15;
        ctx.shadowColor = '#C0C0C0';
        ctx.shadowBlur = glow;
        
        const angle = -time / 1200;
        const grad = ctx.createLinearGradient(
          px - Math.cos(angle)*radius, py - Math.sin(angle)*radius, 
          px + Math.cos(angle)*radius, py + Math.sin(angle)*radius
        );
        grad.addColorStop(0, '#C0C0C0'); 
        grad.addColorStop(0.5, '#FFF'); 
        grad.addColorStop(1, '#708090');
        
        ctx.fillStyle = grad; 
        ctx.strokeStyle = '#FFF'; 
        ctx.lineWidth = 2.5;
      } 
      else if (p.tier === 'bronze') {
        ctx.shadowColor = 'rgba(205, 127, 50, 0.8)'; 
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#cd7f32'; 
        ctx.strokeStyle = '#FFF'; 
        ctx.lineWidth = 2;
      } 
      else {
        // Normal oyuncu
        ctx.shadowColor = 'rgba(0, 200, 255, 0.4)'; 
        ctx.shadowBlur = 8;
        ctx.fillStyle = 'rgba(10, 20, 40, 0.9)'; 
        ctx.strokeStyle = '#00c8ff'; 
        ctx.lineWidth = 2;
      }
      
      // Oyuncu Yuvarlağı (Hover ise biraz daha büyük ve belirgin)
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill(); 
      ctx.stroke();
      
      // Gölgeyi sıfırla ki yazılara bulaşmasın
      ctx.shadowBlur = 0;
      
      // Uyumluluk Rengi İndikatörü
      if (p.compColor) {
        ctx.beginPath();
        ctx.arc(px + 12, py - 12, 6, 0, Math.PI * 2);
        ctx.fillStyle = p.compColor;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      
      // Numara / Güç (Ortadaki Text)
      ctx.fillStyle = (p.tier === 'gold' || p.tier === 'silver') ? '#000' : '#FFF';
      ctx.font = '900 13px Orbitron, sans-serif';
      ctx.textAlign = 'center'; 
      ctx.textBaseline = 'middle';
      ctx.fillText(p.overall || p.slot, px, py + 1);
      
      // Oyuncu İsmi Kutusu (Aşağıda)
      ctx.font = '600 11px Inter, sans-serif';
      const nameWidth = ctx.measureText(p.name).width + 16;
      const nameY = py + radius + 12;
      
      // İsmin arka planı da tiere göre şekillensin
      if (p.tier === 'gold') {
        ctx.fillStyle = 'rgba(218, 165, 32, 0.95)';
        ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
        ctx.shadowBlur = 10;
      } else if (p.tier === 'silver') {
        ctx.fillStyle = 'rgba(112, 128, 144, 0.95)';
      } else {
        ctx.fillStyle = 'rgba(15, 22, 41, 0.9)';
      }
      
      // Modern kutu çizimi (roundRect kullanarak)
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(px - nameWidth/2, nameY - 8, nameWidth, 16, 4);
      } else {
        ctx.rect(px - nameWidth/2, nameY - 8, nameWidth, 16);
      }
      ctx.fill();
      
      ctx.shadowBlur = 0;
      ctx.fillStyle = (p.tier === 'gold') ? '#000' : '#FFF';
      ctx.fillText(p.name, px, nameY + 1);
      
      ctx.restore();
    });
  }
}

const UI = {
  currentScreen: 'splash',
  currentPage: 'dashboard',
  matchEngine: null,
  _matchPaused: false,
  _currentFixture: null,
  _currentFixtureIsHome: false,
  _selectedDifficulty: 'easy',
  _transferPlayerId: null,
  _transferType: null, // 'buy' | 'sell'

  // ---- Screen navigation ----
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById('screen-' + id);
    if (screen) screen.classList.add('active');
    UI.currentScreen = id;
  },

  selectDifficulty(el, diff) {
    document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    UI._selectedDifficulty = diff;
    if (window._setupData) {
      window._setupData.difficulty = diff;
    }
    document.documentElement.setAttribute('data-theme', diff);
  },

  showPage(page) {
    document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.remove('hidden');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const navItem = document.querySelector(`[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');

    const titles = {
      dashboard: 'Dashboard', squad: 'Kadro Yönetimi',
      inbox: 'Gelen Kutusu',
      transfers: 'Transfer Merkezi', tactics: 'Taktikler & Formasyon',
      calendar: 'Maç Takvimi', finance: 'Finanslar',
      academy: 'Gençlik Akademisi', stats: 'İstatistikler', settings: 'Ayarlar'
    };
    document.getElementById('topbar-title').textContent = titles[page] || page;

    UI.currentPage = page;
    UI.renderPage(page);
  },

  renderPage(page) {
    switch (page) {
      case 'dashboard': UI.renderDashboard(); break;
      case 'inbox': UI.renderInbox(); break;
      case 'squad': UI.renderSquad(); break;
      case 'transfers': UI.renderTransfers(); break;
      case 'tactics': UI.renderTactics(); break;
      case 'calendar': UI.renderCalendar(); break;
      case 'finance': UI.renderFinance(); break;
      case 'academy': UI.renderAcademy(); break;
      case 'stats': UI.renderStats(); break;
    }
  },

  // ---- Sidebar update ----
  updateSidebar() {
    if (!CM.state) return;
    const club = CM.getMyClub();
    const { state } = CM;

    const badgeEl = document.getElementById('sidebar-club-badge');
    if (badgeEl && club) {
      badgeEl.textContent = club.shortName.slice(0, 3);
      badgeEl.style.background = `linear-gradient(135deg, ${club.colors.primary}, ${club.colors.secondary})`;
    }

    const nameEl = document.getElementById('sidebar-club-name');
    if (nameEl && club) nameEl.textContent = club.name;

    const seasonEl = document.getElementById('sidebar-season');
    if (seasonEl) seasonEl.textContent = `Sezon ${state.season} • Hafta ${state.week}`;

    const moraleEl = document.getElementById('sidebar-morale-fill');
    if (moraleEl) moraleEl.style.width = state.morale + '%';

    const balanceEl = document.getElementById('sidebar-balance');
    if (balanceEl) balanceEl.textContent = CM.formatMoney(state.finances.balance);

    const wageEl = document.getElementById('sidebar-wages');
    if (wageEl) wageEl.textContent = CM.formatMoney(state.finances.weeklyWages) + '/h';

    const notifCount = state.notifications.filter(n => !n.read).length;
    const notifBadge = document.getElementById('notif-badge');
    if (notifBadge) {
      notifBadge.textContent = notifCount;
      notifBadge.style.display = notifCount > 0 ? 'inline' : 'none';
    }

    const dateEl = document.getElementById('topbar-date');
    if (dateEl) dateEl.textContent = `📅 ${CM.formatDate(state)}`;
    
    UI.updateInboxBadge();
  },

  updateInboxBadge() {
    if (!CM.state || !CM.state.inbox) return;
    const unread = CM.state.inbox.filter(m => !m.read).length;
    const badge = document.getElementById('inbox-badge');
    if (badge) {
      badge.textContent = unread;
      badge.style.display = unread > 0 ? 'inline-block' : 'none';
      if (unread > 0) badge.classList.add('pulse');
    }
  },

  // ---- Inbox ----
  renderInbox() {
    if (!CM.state.inbox) CM.state.inbox = [];
    const listEl = document.getElementById('inbox-list');
    const detailEl = document.getElementById('inbox-detail');
    if (!listEl) return;

    if (CM.state.inbox.length === 0) {
      listEl.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted)">Gelen kutusu boş.</div>';
      return;
    }

    listEl.innerHTML = CM.state.inbox.map(msg => `
      <div class="inbox-item ${msg.read ? 'read' : 'unread'}" style="padding:16px; border-bottom:1px solid var(--border); cursor:pointer; transition:var(--transition);" onclick="UI.showInboxMessage('${msg.id}')">
        <div style="display:flex; justify-content:space-between; margin-bottom:8px">
          <span style="font-size:11px; color:var(--accent); font-weight:700">${msg.sender}</span>
          <span style="font-size:11px; color:var(--text-muted)">${msg.date}</span>
        </div>
        <div style="font-weight:${msg.read ? '400' : '700'}; font-size:14px; color:${msg.read ? 'var(--text-secondary)' : 'var(--text-primary)'}">${msg.title}</div>
      </div>
    `).join('');
  },

  showInboxMessage(msgId) {
    const msg = CM.state.inbox.find(m => m.id === msgId);
    if (!msg) return;
    msg.read = true;
    UI.updateInboxBadge();
    UI.renderInbox(); // listeyi güncelle (okundu yapmak için)

    const detailEl = document.getElementById('inbox-detail');
    if (detailEl) {
      detailEl.innerHTML = `
        <div style="font-size:12px; color:var(--accent); font-weight:700; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px">${msg.sender}</div>
        <h3 style="font-size:24px; font-family:'Rajdhani',sans-serif; font-weight:700; margin-bottom:16px">${msg.title}</h3>
        <div style="font-size:12px; color:var(--text-muted); margin-bottom:24px; border-bottom:1px solid var(--border); padding-bottom:16px">${msg.date}</div>
        <div style="font-size:14px; line-height:1.6; color:var(--text-secondary)">
          ${msg.message.replace(/\\n/g, '<br>')}
        </div>
        <div style="margin-top:32px; padding-top:16px; border-top:1px dashed var(--border); display:flex; gap:12px">
          <button class="btn btn-ghost btn-sm" onclick="UI.deleteInboxMessage('${msg.id}')">🗑️ Sil</button>
        </div>
      `;
    }
  },

  deleteInboxMessage(msgId) {
    CM.state.inbox = CM.state.inbox.filter(m => m.id !== msgId);
    CM.save();
    UI.renderInbox();
    const detailEl = document.getElementById('inbox-detail');
    if (detailEl) detailEl.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding-top:100px">Görüntülemek için bir mesaj seçin.</div>';
    UI.updateInboxBadge();
  },

  // ---- Dashboard ----
  renderDashboard() {
    if (!CM.state) return;
    const { state } = CM;
    const club = CM.getMyClub();

    // Next fixture
    const next = CM.getNextFixture();
    if (next) {
      const homeClub = CM.getClub(next.homeClubId);
      const awayClub = CM.getClub(next.awayClubId);
      const isHome = next.homeClubId === state.myClubId;

      document.getElementById('dash-home-name').textContent = homeClub?.name || '';
      document.getElementById('dash-away-name').textContent = awayClub?.name || '';
      document.getElementById('dash-home-badge').textContent = homeClub?.shortName?.slice(0,3) || '';
      document.getElementById('dash-away-badge').textContent = awayClub?.shortName?.slice(0,3) || '';
      if (homeClub) document.getElementById('dash-home-badge').style.background = `linear-gradient(135deg, ${homeClub.colors.primary}, ${homeClub.colors.secondary})`;
      if (awayClub) document.getElementById('dash-away-badge').style.background = `linear-gradient(135deg, ${awayClub.colors.primary}, ${awayClub.colors.secondary})`;

      const compLabels = { league: 'LİG MAÇI', domestic_cup: 'KUPA', europe: 'AVRUPA' };
      document.getElementById('dash-competition').textContent = compLabels[next.competition] || 'MAÇ';
      document.getElementById('dash-venue').textContent = isHome ? `🏟️ ${club?.stadium || 'Ev'}` : '✈️ Deplasman';
    }

    // Season stats
    const { seasonStats } = state;
    document.getElementById('dash-played').textContent = seasonStats.played;
    document.getElementById('dash-points').textContent = seasonStats.points;
    document.getElementById('dash-goals-for').textContent = seasonStats.goalsFor;
    document.getElementById('dash-goals-against').textContent = seasonStats.goalsAgainst;

    // League position
    const pos = state.leagueTable.findIndex(r => r.clubId === state.myClubId) + 1;
    document.getElementById('dash-position').textContent = pos || '-';

    // League table (top 8)
    UI.renderMiniTable();

    // Budget
    document.getElementById('dash-budget').textContent = CM.formatMoney(state.finances.balance);
    document.getElementById('dash-transfer-budget').textContent = CM.formatMoney(state.finances.transferBudget);
  },

  renderMiniTable() {
    const { leagueTable } = CM.state;
    const tbody = document.getElementById('mini-table-body');
    if (!tbody) return;

    const topRows = leagueTable.slice(0, 8);
    tbody.innerHTML = topRows.map((row, i) => {
      const club = CM.getClub(row.clubId);
      const isMe = row.clubId === CM.state.myClubId;
      const posClass = i === 0 ? 'champions' : i < 3 ? 'europa' : i >= leagueTable.length - 3 ? 'relegation' : '';

      return `
        <tr class="${isMe ? 'my-team' : ''}">
          <td><span class="pos ${posClass}">${i + 1}</span></td>
          <td>
            <div class="team-row-info">
              <div class="team-mini-badge" style="background: linear-gradient(135deg, ${club?.colors?.primary || '#333'}, ${club?.colors?.secondary || '#555'}); font-size:10px; font-weight:900; color:#fff;">
                ${club?.shortName?.slice(0,3) || '???'}
              </div>
              <span style="font-weight: ${isMe ? '700' : '400'}; font-size: 13px;">${club?.name || 'Bilinmiyor'}</span>
            </div>
          </td>
          <td>${row.played}</td>
          <td style="color: var(--green)">${row.won}</td>
          <td style="color: var(--text-muted)">${row.drawn}</td>
          <td style="color: var(--red)">${row.lost}</td>
          <td>${row.gf}:${row.ga}</td>
          <td class="pts-cell">${row.points}</td>
        </tr>`;
    }).join('');
  },

  // ---- Squad ----
  filterSquad(btn, filter) {
    btn.closest('.squad-filters').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    UI.renderSquad(filter);
  },

  renderSquad(filter = 'all') {
    const players = CM.getMyPlayers();
    const grid = document.getElementById('players-grid');
    if (!grid) return;

    const filtered = filter === 'all' ? players :
      filter === 'GK' ? players.filter(p => p.position === 'GK') :
      filter === 'DEF' ? players.filter(p => ['CB','LB','RB'].includes(p.position)) :
      filter === 'MID' ? players.filter(p => ['CDM','CM','CAM'].includes(p.position)) :
      players.filter(p => ['LW','RW','ST','CF'].includes(p.position));

    filtered.sort((a, b) => b.overall - a.overall);
    grid.innerHTML = filtered.map(p => UI.renderPlayerCard(p)).join('');
    grid.querySelectorAll('.player-card').forEach(card => {
      card.addEventListener('click', () => UI.showPlayerDetail(card.dataset.playerId));
    });
  },

  renderPlayerCard(player) {
    const tier = CM.getCardTier(player.overall);
    const flag = CM.getNationalityFlag(player.nationality);
    const { pac, sho, pas, dri, def, phy } = player.stats || {};

    const avatarContent = player.avatar
      ? `<img src="${player.avatar}" alt="${player.lastName}">`
      : `<span style="font-size: 42px">${UI.getPositionIcon(player.position)}</span>`;

    return `
      <div class="player-card ${tier}" data-player-id="${player.id}">
        <div class="card-shine"></div>
        <div class="card-top">
          <span class="card-rating">${player.overall}</span>
          <span class="card-position">${player.position}</span>
          <span class="card-flag">${flag}</span>
        </div>
        <div class="card-avatar" style="top: 20px;">
          <div class="avatar-circle">${avatarContent}</div>
        </div>
        <div class="card-bottom">
          <div class="card-name">${player.lastName.toUpperCase()}</div>
          <div class="card-stats-row">
            <div class="card-stat-item">
              <div class="s-val">${pac || '—'}</div>
              <div class="s-lbl">PAC</div>
            </div>
            <div class="card-stat-item">
              <div class="s-val">${sho || '—'}</div>
              <div class="s-lbl">SHO</div>
            </div>
            <div class="card-stat-item">
              <div class="s-val">${pas || '—'}</div>
              <div class="s-lbl">PAS</div>
            </div>
            <div class="card-stat-item">
              <div class="s-val">${dri || '—'}</div>
              <div class="s-lbl">DRI</div>
            </div>
            <div class="card-stat-item">
              <div class="s-val">${def || '—'}</div>
              <div class="s-lbl">DEF</div>
            </div>
            <div class="card-stat-item">
              <div class="s-val">${phy || '—'}</div>
              <div class="s-lbl">PHY</div>
            </div>
          </div>
        </div>
      </div>`;
  },

  getPositionIcon(pos) {
    const icons = { GK: '🧤', CB: '🛡️', LB: '⬅️', RB: '➡️', CDM: '⚓', CM: '⚙️', CAM: '🎯', LW: '💨', RW: '🌪️', ST: '⚽', CF: '🔥' };
    return icons[pos] || '👟';
  },

  // ---- Player Detail Modal ----
  showPlayerDetail(playerId) {
    const player = CM.getPlayer(playerId);
    if (!player) return;

    // ---- Scout sistemi: sis kontrolü ----
    const isMyPlayer = CM.state && CM.state.squad && CM.state.squad.includes(playerId);
    const scouted = (typeof ScoutSystem !== 'undefined') ? ScoutSystem.isScouted(playerId) : true;
    const visStats = (typeof ScoutSystem !== 'undefined') ? ScoutSystem.getVisibleStats(player) : null;
    const showFog = !isMyPlayer && !scouted; // Rakip + keşfedilmemiş → sis

    const tier = CM.getCardTier(player.overall);
    const flag = CM.getNationalityFlag(player.nationality);
    const club = CM.getClub(player.clubId);
    const pStats = CM.state.playerStats[playerId] || {};
    const isInjured = CM.state.injured.some(i => i.playerId === playerId);
    const isSuspended = CM.state.suspensions.some(s => s.playerId === playerId);

    // İstatistikler — sisli ise '??'
    const displayStats = showFog && visStats ? visStats.stats : (player.stats || {});
    const { pac, sho, pas, dri, def, phy } = displayStats;
    const ss = (showFog ? {} : (player.subStats || {})); // Sisli ise sub-stat gizle
    const displayOverall = showFog ? ('~' + (visStats ? visStats.estimatedOverall : '??')) : player.overall;
    const displayPotential = showFog ? '??' : player.potential;
    const displayValue = showFog ? '??' : CM.formatMoney(player.value * 1000000);
    const displayWage = showFog ? '??/h' : (CM.formatMoney(player.wage * 1000) + '/h');
    const displayContract = showFog ? '??' : player.contractEnd;

    // Scout panel HTML (rakip oyuncular için)
    const scoutPanelHtml = (typeof ScoutSystem !== 'undefined' && !isMyPlayer)
      ? ScoutSystem.renderScoutPanel(playerId)
      : '';

    const fogWarning = showFog ? `
      <div style="margin-bottom:12px;padding:10px 14px;background:rgba(255,200,0,0.08);
                  border:1px solid rgba(255,200,0,0.2);border-radius:8px;
                  font-size:12px;color:#f5c842;display:flex;align-items:center;gap:8px">
        <span style="font-size:16px">🌫️</span>
        <span>Bu oyuncu henüz keşfedilmedi. Tam istatistikler için scout gönder.</span>
      </div>` : '';

    document.getElementById('player-modal-body').innerHTML = `
      ${fogWarning}
      <div class="player-detail-top">
        <div class="player-detail-card-wrap" style="${showFog ? 'filter:blur(0px);opacity:0.85' : ''}">
          ${UI.renderPlayerCard(player)}
          ${showFog ? `<div style="position:absolute;inset:0;border-radius:inherit;
            background:linear-gradient(135deg,rgba(10,12,20,0.6),rgba(10,12,20,0.3));
            display:flex;align-items:center;justify-content:center;
            font-size:32px;letter-spacing:2px;color:rgba(255,255,255,0.5);
            font-weight:900;font-family:'Orbitron',sans-serif">~${visStats ? visStats.estimatedOverall : '??'}</div>` : ''}
        </div>
        <div class="player-detail-info">
          <div class="player-full-name">${player.firstName} ${player.lastName}</div>
          <div class="player-detail-meta">
            <span class="meta-tag">${flag} ${player.nationality}</span>
            <span class="meta-tag">📅 ${player.age} yaş</span>
            <span class="meta-tag">⬆️ ${player.height} cm</span>
            <span class="meta-tag">⚖️ ${player.weight} kg</span>
            <span class="meta-tag">👟 ${player.preferredFoot === 'Left' ? 'Sol' : 'Sağ'} ayak</span>
            ${!showFog ? `<span class="meta-tag">⭐ Teknik: ${'★'.repeat(player.skillMoves)}</span>` : ''}
            <span class="meta-tag">🎯 Potansiyel: <strong>${displayPotential}</strong></span>
            ${club ? `<span class="meta-tag">🏟️ ${club.name}</span>` : ''}
            ${isInjured ? '<span class="meta-tag" style="border-color:var(--red);color:var(--red)">🩹 Sakat</span>' : ''}
            ${isSuspended ? '<span class="meta-tag" style="border-color:var(--gold);color:var(--gold)">🟥 Cezalı</span>' : ''}
          </div>
          <div class="stat-hexagon" style="${showFog ? 'filter:blur(2px);opacity:0.4;pointer-events:none;user-select:none' : ''}">
            <div class="hex-stat pac"><div class="hex-val">${pac}</div><div class="hex-lbl">PAC</div></div>
            <div class="hex-stat sho"><div class="hex-val">${sho}</div><div class="hex-lbl">SHO</div></div>
            <div class="hex-stat pas"><div class="hex-val">${pas}</div><div class="hex-lbl">PAS</div></div>
            <div class="hex-stat dri"><div class="hex-val">${dri}</div><div class="hex-lbl">DRI</div></div>
            <div class="hex-stat def"><div class="hex-val">${def}</div><div class="hex-lbl">DEF</div></div>
            <div class="hex-stat phy"><div class="hex-val">${phy}</div><div class="hex-lbl">PHY</div></div>
          </div>
          ${!showFog ? `
          <div class="traits-section">
            <h4>Özellikler</h4>
            <div class="traits-list">
              ${(player.traits || []).map(t => `<span class="trait-badge">⚡ ${t}</span>`).join('')}
            </div>
          </div>` : ''}
          <div class="divider"></div>
          <div style="display:flex; gap:20px; font-size:13px;">
            <div>💰 Değer: <strong style="color:var(--green)">${displayValue}</strong></div>
            <div>💵 Maaş: <strong>${displayWage}</strong></div>
            <div>📋 Kontrat: <strong>${displayContract}</strong></div>
          </div>
          ${!showFog ? `
          <div style="display:flex; gap:20px; font-size:13px; margin-top:12px; color:var(--text-secondary)">
            <div>⚽ Gol: <strong style="color:var(--text-primary)">${pStats.goals || 0}</strong></div>
            <div>🎯 Asist: <strong style="color:var(--text-primary)">${pStats.assists || 0}</strong></div>
            <div>🎽 Maç: <strong style="color:var(--text-primary)">${pStats.appearances || 0}</strong></div>
            <div>🟨 Kart: <strong style="color:var(--gold)">${pStats.yellowCards || 0}</strong></div>
          </div>` : ''}
          ${scoutPanelHtml}
        </div>
      </div>
      ${!showFog ? `
      <div class="divider"></div>
      <h4 style="font-size:11px;letter-spacing:2px;color:var(--text-muted);text-transform:uppercase;margin-bottom:16px;">Detaylı İstatistikler</h4>
      <div class="sub-stats-grid">
        ${Object.entries(ss).map(([key, val]) => {
          const label = UI.getSubStatLabel(key);
          const cls = val >= 80 ? 'high' : val >= 60 ? 'med' : 'low';
          return `
            <div class="sub-stat-row">
              <span class="sub-stat-name">${label}</span>
              <div class="sub-stat-bar">
                <div class="sub-stat-bar-fill ${cls}" style="width:${val}%"></div>
              </div>
              <span class="sub-stat-val" style="color: ${val>=80?'var(--green)':val>=60?'var(--gold)':'var(--red)'}">${val}</span>
            </div>`;
        }).join('')}
      </div>` : ''}
      <div class="divider"></div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        ${isMyPlayer ? `
          <button class="btn btn-primary btn-sm" onclick="UI.renewContractDialog('${player.id}')">✍️ Kontrat Yenile</button>
          <button class="btn btn-danger btn-sm" onclick="UI.sellPlayerDialog('${player.id}')">💰 Sat</button>
          <button class="btn btn-secondary btn-sm" onclick="UI.loanOutDialog('${player.id}')">📤 Kirala</button>
        ` : `
          <button class="btn btn-gold btn-sm" onclick="UI.buyPlayerDialog('${player.id}')">🛒 Teklif Ver</button>
          <button class="btn btn-secondary btn-sm" onclick="UI.loanInDialog('${player.id}')">📥 Kiralık Al</button>
        `}
        <button class="btn btn-ghost btn-sm" onclick="UI.closeModal()">✕ Kapat</button>
      </div>`;

    document.getElementById('player-modal-overlay').classList.add('open');
  },

  getSubStatLabel(key) {
    const labels = {
      acceleration: 'İvme', sprintSpeed: 'Sprint Hızı',
      finishing: 'Bitiricilik', shotPower: 'Şut Gücü', longShots: 'Uzak Şut',
      penalties: 'Penaltı', volleys: 'Vole',
      vision: 'Vizyon', crossing: 'Orta', fkAccuracy: 'Serbest Atış',
      shortPassing: 'Kısa Pas', longPassing: 'Uzun Pas', curve: 'Kavis',
      agility: 'Çeviklik', balance: 'Denge', reactions: 'Refleks',
      ballControl: 'Top Kontrolü', dribbling: 'Çalım', composure: 'Soğukkanlılık',
      interceptions: 'Top Kapma', headingAccuracy: 'Kafa Topu',
      defAwareness: 'Def Farkındalık', standingTackle: 'Müdahale',
      slidingTackle: 'Kayarak Müdahale',
      jumping: 'Sıçrama', stamina: 'Kondisyon', strength: 'Güç', aggression: 'Agresiflik'
    };
    return labels[key] || key;
  },

  closeModal() {
    document.getElementById('player-modal-overlay').classList.remove('open');
  },

  closeTransferModal() {
    document.getElementById('transfer-modal-overlay').classList.remove('open');
  },

  // ---- Transfer Modals (in-game, popup yok) ----
  buyPlayerDialog(playerId) {
    const player = CM.getPlayer(playerId);
    if (!player) return;
    UI._transferPlayerId = playerId;
    UI._transferType = 'buy';
    const suggested = Math.round(player.value * 1000000 * 1.05);
    const club = CM.getClub(player.clubId);
    const tier = CM.getCardTier(player.overall);
    document.getElementById('transfer-modal-title').textContent = '🛒 Transfer Teklifi Ver';
    document.getElementById('transfer-modal-body').innerHTML = `
      <div class="transfer-offer-layout">
        <div class="transfer-player-info">
          <div class="tp-card-preview">${UI.renderPlayerCard(player)}</div>
          <div class="tp-meta">
            <div class="tp-name">${player.firstName} ${player.lastName}</div>
            <div class="tp-sub">${player.position} • ${player.age} yaş • ${CM.getNationalityFlag(player.nationality)}</div>
            ${club ? `<div class="tp-club">${club.name}</div>` : ''}
          </div>
        </div>
        <div class="divider"></div>
        <div class="transfer-details">
          <div class="td-row">
            <span class="td-label">Piyasa Değeri</span>
            <span class="td-value" style="color:var(--green)">${CM.formatMoney(player.value * 1000000)}</span>
          </div>
          <div class="td-row">
            <span class="td-label">Haftalık Maaş</span>
            <span class="td-value">${CM.formatMoney(player.wage * 1000)}</span>
          </div>
          <div class="td-row">
            <span class="td-label">Kontrat Bitiş</span>
            <span class="td-value">${player.contractEnd}</span>
          </div>
          <div class="td-row">
            <span class="td-label">Senin Bütçen</span>
            <span class="td-value" style="color:var(--accent)">${CM.formatMoney(CM.state.finances.transferBudget)}</span>
          </div>
        </div>
        <div class="divider"></div>
        <div class="form-group">
          <label class="form-label">Teklif Tutarı (€)</label>
          <input type="number" id="offer-amount" class="form-input" value="${suggested}" min="1" step="100000">
          <div class="offer-hint">Öneri: <strong style="color:var(--gold)">${CM.formatMoney(suggested)}</strong></div>
        </div>
        <div style="display:flex;gap:12px;margin-top:20px">
          <button class="btn btn-ghost" onclick="UI.closeTransferModal()">İptal</button>
          <button class="btn btn-gold" style="flex:1" onclick="UI.submitBuyOffer()">✅ Teklif Gönder</button>
        </div>
      </div>`;
    document.getElementById('transfer-modal-overlay').classList.add('open');
  },

  submitBuyOffer() {
    const amount = parseFloat(document.getElementById('offer-amount')?.value);
    if (isNaN(amount) || amount <= 0) { UI.toast('error', 'Geçersiz miktar'); return; }
    const result = CM.buyPlayer(UI._transferPlayerId, amount);
    UI.closeTransferModal();
    UI.closeModal();
    if (result.success) {
      UI.updateSidebar();
      UI.toast('success', '✅ Transfer tamamlandı!');
    } else {
      UI.toast('error', result.reason);
    }
  },

  sellPlayerDialog(playerId) {
    const player = CM.getPlayer(playerId);
    if (!player) return;
    UI._transferPlayerId = playerId;
    UI._transferType = 'sell';
    const suggested = Math.round(player.value * 1000000);
    document.getElementById('transfer-modal-title').textContent = '💰 Oyuncu Sat';
    document.getElementById('transfer-modal-body').innerHTML = `
      <div class="transfer-offer-layout">
        <div class="transfer-player-info">
          <div class="tp-card-preview">${UI.renderPlayerCard(player)}</div>
          <div class="tp-meta">
            <div class="tp-name">${player.firstName} ${player.lastName}</div>
            <div class="tp-sub">${player.position} • ${player.age} yaş</div>
          </div>
        </div>
        <div class="divider"></div>
        <div class="transfer-details">
          <div class="td-row"><span class="td-label">Piyasa Değeri</span><span class="td-value" style="color:var(--green)">${CM.formatMoney(player.value * 1000000)}</span></div>
          <div class="td-row"><span class="td-label">Haftalık Maaş</span><span class="td-value">${CM.formatMoney(player.wage * 1000)}</span></div>
        </div>
        <div class="divider"></div>
        <div class="form-group">
          <label class="form-label">Satış Fiyatı (€)</label>
          <input type="number" id="sell-amount" class="form-input" value="${suggested}" min="1" step="100000">
        </div>
        <div class="warning-box" style="margin-top:12px;padding:12px;background:rgba(255,23,68,0.08);border:1px solid rgba(255,23,68,0.2);border-radius:var(--radius-sm);font-size:13px;color:var(--red)">
          ⚠️ Bu işlem geri alınamaz. Oyuncu takımınızdan ayrılacak.
        </div>
        <div style="display:flex;gap:12px;margin-top:20px">
          <button class="btn btn-ghost" onclick="UI.closeTransferModal()">İptal</button>
          <button class="btn btn-danger" style="flex:1" onclick="UI.submitSell()">💰 Sat</button>
        </div>
      </div>`;
    document.getElementById('transfer-modal-overlay').classList.add('open');
  },

  submitSell() {
    const amount = parseFloat(document.getElementById('sell-amount')?.value);
    if (isNaN(amount) || amount <= 0) { UI.toast('error', 'Geçersiz miktar'); return; }
    const result = CM.sellPlayer(UI._transferPlayerId, amount);
    UI.closeTransferModal();
    UI.closeModal();
    if (result.success) {
      UI.renderSquad();
      UI.updateSidebar();
      UI.toast('success', '💰 Oyuncu satıldı!');
    } else {
      UI.toast('error', result.reason);
    }
  },

  loanOutDialog(playerId) {
    const player = CM.getPlayer(playerId);
    UI.toast('info', '📤 Kiralık', `${player.firstName} ${player.lastName} kiralık piyasasına çıkarıldı.`);
    UI.closeModal();
  },

  loanInDialog(playerId) {
    const player = CM.getPlayer(playerId);
    const loanFee = Math.round(player.value * 100000);
    UI.toast('info', '📥 Kiralık Alındı', `${player.firstName} ${player.lastName} ${CM.formatMoney(loanFee)} kiralık ücreti ile takımınıza katıldı.`);
    UI.closeModal();
  },

  // ---- Transfer Filters ----
  applyTransferFilters() {
    const search = document.getElementById('tr-search')?.value || '';
    const pos = document.getElementById('tr-pos')?.value || 'all';
    const league = document.getElementById('tr-league')?.value || 'all';
    const sort = document.getElementById('tr-sort')?.value || 'overall';
    UI.renderTransfers(search, pos, league, sort);
  },

  // ---- Transfers Page ----
  renderTransfers(searchQuery = '', posFilter = 'all', leagueFilter = 'all', sortBy = 'overall') {
    let players = ChampionMasterData.players.filter(p => p.clubId !== CM.state.myClubId);

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      players = players.filter(p =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.nationality.toLowerCase().includes(q)
      );
    }
    if (posFilter !== 'all') {
      const posGroups = {
        GK: ['GK'], DEF: ['CB','LB','RB'], MID: ['CDM','CM','CAM'],
        ATT: ['LW','RW','ST','CF']
      };
      players = players.filter(p => (posGroups[posFilter] || [posFilter]).includes(p.position));
    }
    if (leagueFilter !== 'all') {
      const clubsInLeague = ChampionMasterData.clubs
        .filter(c => c.leagueId === leagueFilter)
        .map(c => c.id);
      players = players.filter(p => clubsInLeague.includes(p.clubId));
    }

    players.sort((a, b) => {
      if (sortBy === 'overall') return b.overall - a.overall;
      if (sortBy === 'value') return b.value - a.value;
      if (sortBy === 'age') return a.age - b.age;
      if (sortBy === 'potential') return b.potential - a.potential;
      return 0;
    });

    const tbody = document.getElementById('transfer-table-body');
    if (!tbody) return;

    tbody.innerHTML = players.slice(0, 100).map(p => {
      const club = CM.getClub(p.clubId);
      const tier = CM.getCardTier(p.overall);
      const tierColors = { gold: '#f5c842', silver: '#c8d8e0', bronze: '#cd7f32', basic: '#607d8b' };

      return `
        <tr onclick="UI.showPlayerDetail('${p.id}')" style="cursor:pointer">
          <td>
            <div class="player-table-info">
              <div class="player-table-avatar" style="background: linear-gradient(135deg, ${club?.colors?.primary || '#333'}, ${club?.colors?.secondary || '#555'}); font-weight:900; color:#fff;">
                ${CM.getPositionEmoji(p.position)}
              </div>
              <div>
                <div style="font-weight:600; font-size:13px">${p.firstName} ${p.lastName}</div>
                <div style="font-size:11px; color:var(--text-muted)">${CM.getNationalityFlag(p.nationality)} ${p.nationality}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:6px">
              <div style="width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,${club?.colors?.primary||'#333'},${club?.colors?.secondary||'#555'});display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:900;color:#fff">
                ${club?.shortName?.slice(0,2)||'?'}
              </div>
              <span style="font-size:12px;color:var(--text-secondary)">${club?.name || 'Serbest'}</span>
            </div>
          </td>
          <td><span class="badge" style="font-size:11px;color:var(--text-muted)">${p.age}</span></td>
          <td><span class="badge" style="background:transparent;color:var(--text-secondary)">${p.position}</span></td>
          <td>
            <span class="overall-pill" style="background: rgba(${tier==='gold'?'245,200,66':tier==='silver'?'192,192,192':'205,127,50'},0.15); color: ${tierColors[tier]}">
              ${p.overall}
            </span>
          </td>
          <td style="color:var(--accent);font-size:11px">${p.potential}</td>
          <td class="value-cell">${CM.formatMoney(p.value * 1000000)}</td>
          <td class="wage-cell">${CM.formatMoney(p.wage * 1000)}/h</td>
          <td><span style="font-size:11px;color:var(--text-muted)">${p.contractEnd}</span></td>
        </tr>`;
    }).join('');
  },

  // ---- Tactics ----
  renderTactics() {
    if (!CM.state) return;
    const { formation, lineup } = CM.state;
    const slots = CM.getFormationSlots(formation);
    const pitchEl = document.getElementById('pitch-players');
    if (!pitchEl) return;
    
    // Yeni Taktik Sistemi Kullanımı
    const tacScores = TacticsSystem.getTacticalSubScores(lineup, slots);
    const chemScore = TacticsSystem.getTeamCompatibility(lineup, slots);
    const analysisMsgs = TacticsSystem.generateAnalysis(lineup, slots);
    
    let analysisEl = document.getElementById('tactics-analysis');
    if (!analysisEl) {
      analysisEl = document.createElement('div');
      analysisEl.id = 'tactics-analysis';
      analysisEl.style.marginTop = '24px';
      analysisEl.style.padding = '24px';
      analysisEl.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))';
      analysisEl.style.borderRadius = 'var(--radius-lg)';
      analysisEl.style.border = '1px solid rgba(255,255,255,0.08)';
      analysisEl.style.backdropFilter = 'blur(10px)';
    }
    if (analysisEl.parentElement !== pitchEl.closest('.pitch-container')) {
      pitchEl.closest('.pitch-container').appendChild(analysisEl);
    }
    
    analysisEl.innerHTML = `
      <div style="font-size:12px;color:var(--gold);margin-bottom:16px;text-transform:uppercase;letter-spacing:2px;font-weight:700;display:flex;align-items:center;gap:8px">
        <span style="font-size:16px">⚡</span> TAKTİK ANALİZİ & UYUM
      </div>
      
      <div style="display:flex; gap:32px; align-items:center; margin-bottom: 24px; padding-bottom:24px; border-bottom: 1px solid rgba(255,255,255,0.1)">
        <div style="text-align:center;">
          <div style="font-size:10px;color:var(--text-muted);letter-spacing:1px;margin-bottom:8px">TAKIM KİMYASI</div>
          <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(76, 175, 80, 0.02));border:3px solid ${chemScore > 80 ? '#4caf50' : chemScore > 50 ? '#ffeb3b' : '#f44336'};display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;color:#fff;box-shadow:0 0 20px rgba(76, 175, 80, 0.2)">
            ${chemScore}
          </div>
        </div>
        
        <div style="flex:1; display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:11px;color:var(--text-secondary)">Hücum</span><span style="font-size:13px;font-weight:700">${tacScores.attack}</span></div>
            <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px"><div style="height:100%;width:${tacScores.attack}%;background:var(--accent);border-radius:2px"></div></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:11px;color:var(--text-secondary)">Orta Saha (Pas)</span><span style="font-size:13px;font-weight:700">${tacScores.midfield}</span></div>
            <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px"><div style="height:100%;width:${tacScores.midfield}%;background:var(--gold);border-radius:2px"></div></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:11px;color:var(--text-secondary)">Savunma</span><span style="font-size:13px;font-weight:700">${tacScores.defense}</span></div>
            <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px"><div style="height:100%;width:${tacScores.defense}%;background:var(--green);border-radius:2px"></div></div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:11px;color:var(--text-secondary)">Pres Gücü</span><span style="font-size:13px;font-weight:700">${tacScores.pressing}</span></div>
            <div style="height:4px;background:rgba(255,255,255,0.1);border-radius:2px"><div style="height:100%;width:${tacScores.pressing}%;background:#00c8ff;border-radius:2px"></div></div>
          </div>
        </div>
      </div>
      
      <div style="font-size:12px; color:var(--text-secondary); line-height:1.6">
        ${analysisMsgs.map(m => `<div>${m}</div>`).join('')}
      </div>
    `;

    const positions = UI.getFormationCoords(formation);
    pitchEl.innerHTML = '<canvas id="tactics-canvas" style="position:absolute; top:0; left:0; width:100%; height:100%; touch-action:none;"></canvas>';
    const canvasEl = document.getElementById('tactics-canvas');
    
    if (UI._tacticsCanvas) {
      if (UI._tacticsCanvas.animId) cancelAnimationFrame(UI._tacticsCanvas.animId);
    }
    UI._tacticsCanvas = new TacticsCanvas(canvasEl, pitchEl.closest('.pitch'));

    const playerData = positions.map((pos, i) => {
      const playerId = lineup[i];
      const player = playerId ? CM.getPlayer(playerId) : null;
      let effectiveOverall = 0;
      let compColor = '#fff';
      
      if (player) {
        effectiveOverall = TacticsSystem.getEffectiveOverall(player, slots[i]);
        compColor = TacticsSystem.getCompatibilityColor(player.overall, effectiveOverall);
      }
      
      return {
        x: pos.x,
        y: pos.y,
        overall: player ? effectiveOverall : slots[i],
        baseOverall: player ? player.overall : 0,
        name: player ? player.lastName.slice(0, 8) : '—',
        tier: player ? CM.getCardTier(player.overall) : '',
        index: i,
        slot: slots[i],
        compColor: compColor
      };
    });

    UI._tacticsCanvas.setPlayers(playerData);

    // Bench
    const benchEl = document.getElementById('bench-list');
    if (benchEl) {
      const benchPlayers = CM.getMyPlayers().filter(p => !lineup.includes(p.id));
      benchEl.innerHTML = benchPlayers.slice(0, 7).map(p => `
        <div class="player-list-row" onclick="UI.showPlayerDetail('${p.id}')">
          <div class="mini-avatar" style="background: linear-gradient(135deg, #1a2340, #2a3560); font-size:18px">
            ${UI.getPositionIcon(p.position)}
          </div>
          <div class="player-info">
            <div class="player-name-text">${p.lastName}</div>
            <div class="player-meta">${p.position} • ${CM.getNationalityFlag(p.nationality)}</div>
          </div>
          <div class="overall-badge ${CM.getCardTier(p.overall) === 'gold' ? 'elite' : CM.getCardTier(p.overall) === 'silver' ? 'good' : 'avg'}">
            ${p.overall}
          </div>
        </div>`).join('');
      }
  },

  swapPlayer(slotIndex, slot) {
    // Tıklanan bölgeye uygun yedek oyuncuları bul
    const current = CM.state.lineup[slotIndex];
    const availablePlayers = CM.getMyPlayers()
      .filter(p => !CM.state.lineup.includes(p.id)) // İlk 11'de olmayanlar
      .sort((a, b) => {
        // İdeal pozisyondakileri en üste al
        const aIdeal = CM.getRelatedPositions(slot).includes(a.position) ? 1 : 0;
        const bIdeal = CM.getRelatedPositions(slot).includes(b.position) ? 1 : 0;
        if (aIdeal !== bIdeal) return bIdeal - aIdeal;
        return b.overall - a.overall;
      });
      
    // Modal HTML'i oluştur
    let html = `<div style="margin-bottom:16px;color:var(--text-secondary);font-size:14px">Sahadaki oyuncuyla değiştirmek istediğiniz yedeği seçin:</div>`;
    
    if (availablePlayers.length === 0) {
      html += `<div style="padding:16px;background:rgba(255,255,255,0.05);border-radius:8px;text-align:center">Yedek oyuncu kalmadı.</div>`;
    } else {
      html += `<div style="display:flex;flex-direction:column;gap:8px;max-height:400px;overflow-y:auto;padding-right:8px">`;
      let premiumFound = false;
      
      availablePlayers.forEach(p => {
        const isIdealPos = CM.getRelatedPositions(slot).includes(p.position);
        const healthStatus = p.isInjured ? `<span style="color:var(--red);margin-left:8px;font-size:11px">🚑 Sakat (${p.injuryDays || '?'} gün)</span>` : '';
        
        let rowStyle = `cursor:pointer; border:1px solid ${isIdealPos ? 'var(--accent)' : 'transparent'}; opacity: ${p.isInjured ? '0.5' : '1'}; pointer-events: ${p.isInjured ? 'none' : 'auto'}`;
        let premiumBadge = isIdealPos ? '<span style="color:var(--accent);margin-left:8px;font-size:10px">⭐ İdeal Mevki</span>' : '';
        
        // En iyi uygun oyuncuyu (Premium) vurgula
        if (isIdealPos && !premiumFound && !p.isInjured) {
          premiumFound = true;
          rowStyle = `cursor:pointer; border:2px solid var(--gold); background: linear-gradient(135deg, rgba(245,200,66,0.1), transparent); box-shadow: 0 0 15px rgba(245,200,66,0.15);`;
          premiumBadge = '<span style="color:var(--gold);margin-left:8px;font-size:11px;font-weight:700;letter-spacing:1px">👑 EN İYİ SEÇENEK</span>';
        }
        
        html += `
          <div class="player-list-row" style="${rowStyle}" onclick="UI.confirmSwap(${slotIndex}, '${p.id}')">
            <div class="mini-avatar" style="background: linear-gradient(135deg, #1a2340, #2a3560); font-size:18px; ${premiumFound && isIdealPos && premiumBadge.includes('👑') ? 'border:1px solid var(--gold)' : ''}">
              ${UI.getPositionIcon(p.position)}
            </div>
            <div class="player-info">
              <div class="player-name-text">${p.firstName} ${p.lastName} ${healthStatus}</div>
              <div class="player-meta">${p.position} • Yaş: ${p.age} ${premiumBadge}</div>
            </div>
            <div class="overall-badge ${CM.getCardTier(p.overall) === 'gold' ? 'elite' : CM.getCardTier(p.overall) === 'silver' ? 'good' : 'avg'}">
              ${p.overall}
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }
    
    document.getElementById('player-modal-body').innerHTML = html;
    document.getElementById('player-modal-overlay').querySelector('.modal-header h3').textContent = 'Oyuncu Değiştir (' + slot + ')';
    document.getElementById('player-modal-overlay').classList.add('open');
  },

  confirmSwap(slotIndex, newPlayerId) {
    const newPlayer = CM.getPlayer(newPlayerId);
    if (!newPlayer) return;
    
    CM.state.lineup[slotIndex] = newPlayer.id;
    CM.save();
    UI.closeModal();
    UI.renderTactics();
    UI.toast('info', '🔄 Taktiksel Değişiklik', `${newPlayer.firstName} ${newPlayer.lastName} sahaya sürüldü.`);
  },

  getFormationCoordsBase(formation) {
    const coords = {
      '4-3-3': [
        { x: 50, y: 90 }, // GK
        { x: 80, y: 72 }, { x: 62, y: 70 }, { x: 38, y: 70 }, { x: 20, y: 72 }, // DEF
        { x: 72, y: 50 }, { x: 50, y: 48 }, { x: 28, y: 50 }, // MID
        { x: 80, y: 28 }, { x: 50, y: 22 }, { x: 20, y: 28 }  // ATT
      ],
      '4-4-2': [
        { x: 50, y: 90 },
        { x: 80, y: 72 }, { x: 62, y: 70 }, { x: 38, y: 70 }, { x: 20, y: 72 },
        { x: 80, y: 50 }, { x: 60, y: 48 }, { x: 40, y: 48 }, { x: 20, y: 50 },
        { x: 65, y: 25 }, { x: 35, y: 25 }
      ],
      '4-2-3-1': [
        { x: 50, y: 90 },
        { x: 80, y: 72 }, { x: 62, y: 70 }, { x: 38, y: 70 }, { x: 20, y: 72 },
        { x: 65, y: 55 }, { x: 35, y: 55 },
        { x: 80, y: 35 }, { x: 50, y: 33 }, { x: 20, y: 35 },
        { x: 50, y: 15 }
      ],
      '3-5-2': [
        { x: 50, y: 90 },
        { x: 65, y: 73 }, { x: 50, y: 72 }, { x: 35, y: 73 },
        { x: 85, y: 55 }, { x: 68, y: 50 }, { x: 50, y: 48 }, { x: 32, y: 50 }, { x: 15, y: 55 },
        { x: 65, y: 22 }, { x: 35, y: 22 }
      ],
      '3-4-3': [
        { x: 50, y: 90 },
        { x: 65, y: 73 }, { x: 50, y: 72 }, { x: 35, y: 73 },
        { x: 80, y: 52 }, { x: 60, y: 50 }, { x: 40, y: 50 }, { x: 20, y: 52 },
        { x: 75, y: 25 }, { x: 50, y: 20 }, { x: 25, y: 25 }
      ]
    };
    return coords[formation] || coords['4-3-3'];
  },

  getFormationCoords(formation) {
    if (CM.state && CM.state.customCoords && CM.state.customCoords[formation]) {
      let coords = CM.state.customCoords[formation];
      if (Array.isArray(coords)) return coords;
      // Object ise Array'e dönüştürmeyi dene
      if (typeof coords === 'object') {
        let arr = [];
        for (let i = 0; i < 11; i++) arr.push(coords[i] || UI.getFormationCoordsBase(formation)[i]);
        return arr;
      }
    }
    return UI.getFormationCoordsBase(formation);
  },
  
  async askAIAssistant() {
    if (typeof AISystem === 'undefined') return;
    const btn = document.getElementById('btn-ai-tactic');
    if (!btn) return;
    const oldText = btn.innerHTML;
    btn.innerHTML = '<span class="ai-spinner"></span> Düşünüyor...';
    btn.disabled = true;

    try {
      const myClub = CM.getMyClub();
      const nextFix = CM.getNextFixture();
      let oppClubName = 'Bilinmiyor';
      let oppInfo = 'Veri yok';
      
      if (nextFix) {
        const oppId = nextFix.homeClubId === myClub.id ? nextFix.awayClubId : nextFix.homeClubId;
        const oppClub = CM.getClub(oppId);
        if (oppClub) {
          oppClubName = oppClub.name;
          const oppSquad = CM.getPlayersByClub(oppId).sort((a,b)=>b.overall - a.overall);
          const topPlayers = oppSquad.slice(0,2).map(p => p.lastName).join(', ');
          oppInfo = `Yıldızları: ${topPlayers}`;
        }
      }

      const myPlayers = CM.state.lineup.map(id => CM.getPlayer(id)).filter(Boolean);
      const myInfo = myPlayers.slice(0,3).map(p => `${p.lastName} (${p.overall})`).join(', ');

      const advice = await AISystem.generateTacticalAdvice(
        myClub.name, 
        myInfo, 
        oppClubName, 
        oppInfo, 
        `${CM.state.formation} (${CM.state.tactics.style})`
      );
      
      // Modal ile göster
      const body = document.getElementById('player-modal-body');
      if (body) {
        body.innerHTML = `
          <div style="text-align:center; margin-bottom: 20px;">
            <div style="font-size: 48px; margin-bottom:10px;">🤖</div>
            <h3 style="color:#a78bfa">Gemini Taktik Asistanı</h3>
          </div>
          <div style="background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.3); padding: 20px; border-radius: 12px; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.9);">
            ${advice.replace(/\n/g, '<br>')}
          </div>
        `;
        const header = document.querySelector('#player-modal-overlay .modal-header h3');
        if (header) header.textContent = 'Taktik Tavsiyesi';
        document.getElementById('player-modal-overlay').classList.add('open');
      }
    } catch (e) {
      UI.toast('error', 'Hata', 'Asistan yanıt veremedi.');
    } finally {
      btn.innerHTML = oldText;
      btn.disabled = false;
    }
  },

  saveTactics() {
    CM.save();
    UI.toast('success', '✅ Taktik Kaydedildi', 'Özelleştirilmiş dizilişiniz ve ilk 11 başarıyla kaydedildi.');
  },

  resetTactics() {
    if (CM.state.customCoords && CM.state.customCoords[CM.state.formation]) {
      delete CM.state.customCoords[CM.state.formation];
      CM.save();
      UI.renderTactics();
      UI.toast('info', '🔄 Diziliş Sıfırlandı', 'Oyuncular varsayılan yerlerine döndü.');
    }
  },

  // ---- Calendar ----
  renderCalendar() {
    if (!CM.state) return;
    const { fixtures, results } = CM.state;
    const calEl = document.getElementById('calendar-list');
    if (!calEl) return;

    const allFixtures = fixtures.slice(0, 20);
    calEl.innerHTML = allFixtures.map(fix => {
      const homeClub = CM.getClub(fix.homeClubId);
      const awayClub = CM.getClub(fix.awayClubId);
      const isMe = fix.homeClubId === CM.state.myClubId || fix.awayClubId === CM.state.myClubId;
      const compColors = { league: 'var(--accent)', domestic_cup: 'var(--gold)', europe: 'var(--green)' };
      const compLabels = { league: 'Lig', domestic_cup: 'Kupa', europe: 'Avrupa' };

      return `
        <div class="dash-card" style="${isMe ? 'border-color: rgba(0,200,255,0.3)' : ''}" onclick="${isMe && !fix.played ? `UI.startMatch('${fix.id}')` : ''}">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:10px;font-weight:700;letter-spacing:1px;color:${compColors[fix.competition]}">${compLabels[fix.competition]}</span>
              <span style="font-size:11px;color:var(--text-muted)">• Hafta ${fix.week}</span>
            </div>
            ${isMe ? '<span class="badge badge-blue">Maçınız</span>' : ''}
            ${fix.played ? '<span class="badge badge-gray">Oynandı</span>' : ''}
          </div>
          <div class="next-match" style="margin-top:16px">
            <div class="match-team" style="flex:1">
              <div class="team-badge" style="background:linear-gradient(135deg,${homeClub?.colors?.primary||'#333'},${homeClub?.colors?.secondary||'#555'});font-size:20px;font-weight:900;color:#fff;width:52px;height:52px;margin:0 auto 8px">
                ${homeClub?.shortName?.slice(0,3)||'???'}
              </div>
              <div style="font-size:13px;font-weight:600">${homeClub?.name||'?'}</div>
            </div>
            <div style="text-align:center;min-width:80px">
              ${fix.played && fix.result
                ? `<div style="font-family:'Orbitron',sans-serif;font-size:24px;font-weight:900">${fix.result.home}-${fix.result.away}</div>`
                : `<div style="font-size:18px;color:var(--text-muted);font-weight:700">VS</div>`
              }
              ${isMe && !fix.played ? `<button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="event.stopPropagation();UI.startMatch('${fix.id}')">▶ Oyna</button>` : ''}
            </div>
            <div class="match-team" style="flex:1">
              <div class="team-badge" style="background:linear-gradient(135deg,${awayClub?.colors?.primary||'#333'},${awayClub?.colors?.secondary||'#555'});font-size:20px;font-weight:900;color:#fff;width:52px;height:52px;margin:0 auto 8px">
                ${awayClub?.shortName?.slice(0,3)||'???'}
              </div>
              <div style="font-size:13px;font-weight:600">${awayClub?.name||'?'}</div>
            </div>
          </div>
        </div>`;
    }).join('');
  },

  // ---- Start Match ----
  startMatch(fixtureId) {
    const fix = CM.state.fixtures.find(f => f.id === fixtureId);
    if (!fix) return;

    UI._currentFixture = fix;
    const homeClub = CM.getClub(fix.homeClubId);
    const awayClub = CM.getClub(fix.awayClubId);
    const isHome = fix.homeClubId === CM.state.myClubId;
    UI._currentFixtureIsHome = isHome;
    const mySquad = CM.getMyPlayers().filter(p => CM.state.lineup.includes(p.id));
    const oppClubId = isHome ? fix.awayClubId : fix.homeClubId;
    const oppSquad = ChampionMasterData.players.filter(p => p.clubId === oppClubId);

    document.getElementById('sb-home-name').textContent = homeClub?.name || '';
    document.getElementById('sb-away-name').textContent = awayClub?.name || '';
    document.getElementById('sb-home-badge').textContent = homeClub?.shortName?.slice(0,3) || '';
    document.getElementById('sb-away-badge').textContent = awayClub?.shortName?.slice(0,3) || '';
    if (homeClub) {
      document.getElementById('sb-home-badge').style.background = `linear-gradient(135deg, ${homeClub.colors.primary}, ${homeClub.colors.secondary})`;
      document.getElementById('sb-away-badge').style.background = `linear-gradient(135deg, ${awayClub.colors.primary}, ${awayClub.colors.secondary})`;
    }
    document.getElementById('sb-score').innerHTML = '<span>0</span><span class="score-sep">-</span><span>0</span>';
    document.getElementById('match-events-list').innerHTML = '';
    document.getElementById('match-minute-display').textContent = "0'";
    document.getElementById('match-progress-fill').style.width = '0%';
    UI._matchPaused = false;
    const pauseBtn = document.getElementById('btn-pause-match');
    if (pauseBtn) pauseBtn.textContent = '⏸ Duraklat';

    UI.showScreen('match');

    const homeSquad = isHome ? mySquad : oppSquad;
    const awaySquad = isHome ? oppSquad : mySquad;

    UI.matchEngine = new MatchEngine(homeClub, awayClub, homeSquad, awaySquad);
    UI.matchEngine.setSpeed(CM.state.settings.matchSpeed || 2);
    UI.matchEngine.on('playerInjured', (data) => UI.onPlayerInjured(data));
    if (typeof Pitch2D !== 'undefined') Pitch2D.init('pitch-canvas');
    UI.matchEngine.simulate(data => UI.onMatchEvent(data), result => UI.onMatchFinish(result, fix, isHome));
  },

  onPlayerInjured(data) {
    if (typeof TimeEngine !== 'undefined') {
      TimeEngine.addInjury(data.player.id, data.weeks);
      UI.toast('error', 'Sakatlık!', `${data.player.firstName} ${data.player.lastName} sakatlandı (${data.weeks} hafta).`);
    }
  },

  toggleMatchPause() {
    const btn = document.getElementById('btn-pause-match');
    if (UI._matchPaused) {
      UI.matchEngine.resume();
      UI._matchPaused = false;
      if (btn) btn.textContent = '⏸ Duraklat';
    } else {
      UI.matchEngine.pause();
      UI._matchPaused = true;
      if (btn) btn.textContent = '▶ Devam';
    }
  },

  skipMatch() {
    if (!UI.matchEngine) return;
    UI.matchEngine.setSpeed(3);
    if (UI._matchPaused) {
      UI.matchEngine.resume();
      UI._matchPaused = false;
    }
  },

  onMatchEvent(data) {
    const { event, score, stats, minute } = data;
    const scoreEl = document.getElementById('sb-score');
    if (scoreEl) scoreEl.innerHTML = `<span>${score.home}</span><span class="score-sep">-</span><span>${score.away}</span>`;

    const pct = Math.min((minute / 90) * 100, 100);
    const progEl = document.getElementById('match-progress-fill');
    if (progEl) progEl.style.width = pct + '%';
    const minEl = document.getElementById('match-minute-display');
    if (minEl) minEl.textContent = minute + "'";

    // Live stats update
    if (stats) {
      const s = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      s('mstat-poss-home', stats.possession.home + '%');
      s('mstat-poss-away', stats.possession.away + '%');
      s('mstat-shots-home', stats.shots.home);
      s('mstat-shots-away', stats.shots.away);
      s('mstat-sot-home', stats.shotsOnTarget.home);
      s('mstat-sot-away', stats.shotsOnTarget.away);
      s('mstat-corners-home', stats.corners.home);
      s('mstat-corners-away', stats.corners.away);
      s('mstat-yellow-home', stats.yellowCards.home);
      s('mstat-yellow-away', stats.yellowCards.away);
      s('mstat-fouls-home', stats.fouls.home);
      s('mstat-fouls-away', stats.fouls.away);
    }

    if (event) {
      const eventList = document.getElementById('match-events-list');
      const el = document.createElement('div');
      el.className = `match-event ${event.cssClass || ''}`;
      const icon = event.cssClass === 'goal' ? '⚽' : event.cssClass === 'yellow-card' ? '🟨' : event.cssClass === 'red-card' ? '🟥' : event.cssClass === 'danger' ? '🩹' : event.cssClass === 'info' ? 'ℹ️' : '📢';
      el.innerHTML = `<span class="ev-min">${event.minute}'</span><span class="ev-icon">${icon}</span><span class="ev-text">${event.text}</span>`;
      eventList.insertBefore(el, eventList.firstChild);

      if (event.cssClass === 'goal') {
        const sc = document.getElementById('sb-score');
        sc.classList.add('goal-flash');
        setTimeout(() => sc.classList.remove('goal-flash'), 600);
      }
      
      if (typeof Pitch2D !== 'undefined') Pitch2D.processEvent(event);
    }
  },

  onMatchFinish(result, fix, isHome) {
    const myResult = CM.updateMyMatchResult(result.score.home, result.score.away, isHome, result.events);
    fix.played = true;
    fix.result = result.score;
    CM.save();

    // Maç sonuç ekranını göster (popup yok!)
    setTimeout(() => UI.showMatchResult(result, fix, myResult), 800);
  },

  showMatchResult(result, fix, myResult) {
    const homeClub = CM.getClub(fix.homeClubId);
    const awayClub = CM.getClub(fix.awayClubId);
    const { stats, events } = result;

    // Başlık
    const headerEl = document.getElementById('result-header');
    const headerMap = {
      W: { emoji: '🏆', text: 'GALİBİYET!', cls: 'win' },
      D: { emoji: '🤝', text: 'BERABERLİK', cls: 'draw' },
      L: { emoji: '😔', text: 'MAĞLUBIYET', cls: 'loss' }
    };
    const h = headerMap[myResult];
    headerEl.className = `result-header result-${h.cls}`;
    headerEl.innerHTML = `<span class="result-emoji">${h.emoji}</span><span class="result-title">${h.text}</span>`;

    // Skor
    document.getElementById('result-score').textContent = `${result.score.home} - ${result.score.away}`;
    document.getElementById('result-score').className = `result-score result-score-${h.cls}`;
    const compLabels = { league: 'Lig Maçı', domestic_cup: 'Kupa', europe: 'Avrupa' };
    document.getElementById('result-competition').textContent = compLabels[fix.competition] || 'Maç';

    // Takım rozetleri
    const hb = document.getElementById('result-home-badge');
    const ab = document.getElementById('result-away-badge');
    hb.textContent = homeClub?.shortName?.slice(0,3) || '???';
    ab.textContent = awayClub?.shortName?.slice(0,3) || '???';
    if (homeClub) hb.style.background = `linear-gradient(135deg, ${homeClub.colors.primary}, ${homeClub.colors.secondary})`;
    if (awayClub) ab.style.background = `linear-gradient(135deg, ${awayClub.colors.primary}, ${awayClub.colors.secondary})`;
    document.getElementById('result-home-name').textContent = homeClub?.name || '';
    document.getElementById('result-away-name').textContent = awayClub?.name || '';

    // İstatistikler
    document.getElementById('result-stats-grid').innerHTML = [
      ['Topla Oynama', stats.possession.home + '%', stats.possession.away + '%'],
      ['Şut', stats.shots.home, stats.shots.away],
      ['İsabetli Şut', stats.shotsOnTarget.home, stats.shotsOnTarget.away],
      ['Korner', stats.corners.home, stats.corners.away],
      ['Sarı Kart', stats.yellowCards.home, stats.yellowCards.away],
      ['Faul', stats.fouls.home, stats.fouls.away],
    ].map(([name, h, a]) => `
      <div class="rs-row">
        <span class="rs-home">${h}</span>
        <span class="rs-name">${name}</span>
        <span class="rs-away">${a}</span>
      </div>`).join('');

    // Önemli olaylar
    const goalEvents = events.filter(e => e.type === 'goal' || e.type === 'red_card' || e.type === 'half_time' || e.type === 'full_time');
    const icons = { goal: '⚽', red_card: '🟥', half_time: '⏱️', full_time: '🏁' };
    document.getElementById('result-events-list').innerHTML = goalEvents.map(e =>
      `<div class="re-row"><span class="re-min">${e.minute}'</span><span class="re-icon">${icons[e.type] || '📢'}</span><span class="re-text">${e.text}</span></div>`
    ).join('');

    UI.showScreen('match-result');
  },

  afterMatchContinue() {
    CM.advanceWeek();
    UI.showScreen('game');
    UI.showPage('dashboard');
    UI.updateSidebar();
  },

  showMatchReplay() {
    // Tekrar izleme: sadece maç ekranına dön
    UI.showScreen('match');
  },

  // ---- Finance ----
  renderFinance() {
    if (!CM.state) return;
    const { finances } = CM.state;
    const balEl = document.getElementById('finance-balance');
    if (balEl) balEl.textContent = CM.formatMoney(finances.balance);
    const tbEl = document.getElementById('finance-transfer-budget');
    if (tbEl) tbEl.textContent = CM.formatMoney(finances.transferBudget);
    const revEl = document.getElementById('finance-revenue');
    if (revEl) revEl.textContent = CM.formatMoney(finances.seasonRevenue);
    const expEl = document.getElementById('finance-expenses');
    if (expEl) expEl.textContent = CM.formatMoney(finances.seasonExpenses);
  },

  // ---- Academy ----
  renderAcademy() {
    const players = CM.getAcademyPlayers();
    const grid = document.getElementById('academy-grid');
    if (!grid) return;
    grid.innerHTML = players.length === 0
      ? '<div style="color:var(--text-muted);grid-column:1/-1;text-align:center;padding:40px">Akademide henüz oyuncu yok.</div>'
      : players.map(p => {
          const currentPct = (p.overall / 99) * 100;
          const potPct = (p.potential / 99) * 100;
          const diff = p.potential - p.overall;
          const devClass = diff > 10 ? 'rising' : diff > 3 ? 'stable' : 'struggling';
          const devLabel = diff > 10 ? '📈 Yükselen' : diff > 3 ? '➡️ Stabil' : '📉 Yavaş';

          return `
            <div class="academy-player-card">
              <div class="ap-header">
                <div class="mini-avatar" style="background:linear-gradient(135deg,#1a2340,#2a3560);font-size:22px;width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center">
                  ${UI.getPositionIcon(p.position)}
                </div>
                <div>
                  <div style="font-weight:700;font-size:15px">${p.firstName} ${p.lastName}</div>
                  <div style="font-size:11px;color:var(--text-muted)">${p.position} • ${p.age} yaş • ${CM.getNationalityFlag(p.nationality)}</div>
                </div>
                <div style="margin-left:auto;text-align:center">
                  <div style="font-family:'Orbitron',sans-serif;font-size:22px;font-weight:700;color:var(--accent)">${p.overall}</div>
                  <div style="font-size:10px;color:var(--text-muted)">GENEL</div>
                </div>
              </div>
              <div class="potential-bar">
                <div class="pot-label">
                  <span>Mevcut: ${p.overall}</span>
                  <span style="color:var(--gold)">Potansiyel: ${p.potential}</span>
                </div>
                <div class="pot-track">
                  <div class="pot-potential" style="width:${potPct}%"></div>
                  <div class="pot-current" style="width:${currentPct}%"></div>
                </div>
              </div>
              <div class="development-indicator ${devClass}">${devLabel}</div>
              <button class="btn btn-secondary btn-sm btn-full" style="margin-top:12px" onclick="CM.promoteFromAcademy('${p.id}'); UI.renderAcademy(); UI.renderSquad();">
                ⬆️ A Takıma Çek
              </button>
            </div>`;
        }).join('');
  },

  // ---- Stats ----
  renderStats() {
    if (!CM.state) return;
    const { seasonStats } = CM.state;
    const statsEl = document.getElementById('stats-content');
    if (!statsEl) return;

    const wr = seasonStats.played > 0 ? Math.round((seasonStats.won / seasonStats.played) * 100) : 0;
    statsEl.innerHTML = `
      <div class="stats-row">
        <div class="stat-box"><div class="value">${seasonStats.played}</div><div class="label">Maç</div></div>
        <div class="stat-box"><div class="value" style="color:var(--green)">${seasonStats.won}</div><div class="label">Galibiyet</div></div>
        <div class="stat-box"><div class="value" style="color:var(--gold)">${seasonStats.drawn}</div><div class="label">Beraberlik</div></div>
        <div class="stat-box"><div class="value" style="color:var(--red)">${seasonStats.lost}</div><div class="label">Mağlubiyet</div></div>
      </div>
      <div class="stats-row" style="margin-top:16px">
        <div class="stat-box"><div class="value">${seasonStats.points}</div><div class="label">Puan</div></div>
        <div class="stat-box"><div class="value">${seasonStats.goalsFor}</div><div class="label">Atılan Gol</div></div>
        <div class="stat-box"><div class="value">${seasonStats.goalsAgainst}</div><div class="label">Yenilen Gol</div></div>
        <div class="stat-box"><div class="value">${seasonStats.cleanSheets}</div><div class="label">Gol Yemeden</div></div>
      </div>
      <div style="margin-top:24px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px">
        <h3 style="font-size:12px;letter-spacing:2px;color:var(--text-muted);text-transform:uppercase;margin-bottom:20px">Sezon Özeti</h3>
        <div style="display:flex;gap:40px">
          <div>
            <div style="font-size:12px;color:var(--text-muted)">Galibiyet Oranı</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:36px;color:var(--green);font-weight:700">%${wr}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--text-muted)">Gol Farkı</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:36px;color:var(--accent);font-weight:700">+${seasonStats.goalsFor - seasonStats.goalsAgainst}</div>
          </div>
          <div>
            <div style="font-size:12px;color:var(--text-muted)">Menajer İtibarı</div>
            <div style="font-family:'Orbitron',sans-serif;font-size:36px;color:var(--gold);font-weight:700">${CM.state.manager.reputation}</div>
          </div>
        </div>
      </div>`;
  },

  // ---- Club Selection ----
  renderClubSelect(leagueId) {
    const clubs = ChampionMasterData.clubs.filter(c => c.leagueId === leagueId);
    const grid = document.getElementById('clubs-grid');
    if (!grid) return;

    grid.innerHTML = clubs.map(club => {
      const stars = Array.from({length: 5}, (_, i) =>
        `<span class="star ${i < club.prestige ? '' : 'empty'}">${i < club.prestige ? '★' : '☆'}</span>`
      ).join('');

      return `
        <div class="club-card" data-club-id="${club.id}" onclick="UI.selectClub('${club.id}')">
          <div class="club-badge" style="background: linear-gradient(135deg, ${club.colors.primary}, ${club.colors.secondary}); color: #fff; font-size: 22px; font-weight: 900; font-family: 'Orbitron', sans-serif">
            ${club.shortName.slice(0,3)}
          </div>
          <div class="club-name">${club.name}</div>
          <div class="club-city">📍 ${club.city}</div>
          <div class="club-prestige">${stars}</div>
          <div class="club-info-row">
            <div class="club-info-item">
              <strong>${CM.formatMoney(club.budget * 1000000)}</strong>
              Bütçe
            </div>
            <div class="club-info-item">
              <strong>${club.stadium}</strong>
              Stad
            </div>
          </div>
        </div>`;
    }).join('');
  },

  selectedClubId: null,

  selectClub(clubId) {
    document.querySelectorAll('.club-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`[data-club-id="${clubId}"]`)?.classList.add('selected');
    UI.selectedClubId = clubId;
    document.getElementById('btn-confirm-club').disabled = false;

    // Show club preview
    const club = CM.getClub(clubId);
    const preview = document.getElementById('club-preview');
    if (preview && club) {
      const players = ChampionMasterData.players.filter(p => p.clubId === clubId);
      const avgRating = players.length > 0
        ? Math.round(players.reduce((s, p) => s + p.overall, 0) / players.length)
        : 0;
      preview.innerHTML = `
        <div style="text-align:center;padding:32px 24px">
          <div style="width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,${club.colors.primary},${club.colors.secondary});margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:900;color:#fff;font-family:'Orbitron',sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.5)">
            ${club.shortName.slice(0,3)}
          </div>
          <div style="font-size:26px;font-weight:800;font-family:'Rajdhani',sans-serif;margin-bottom:4px;letter-spacing:1px">${club.name}</div>
          <div style="font-size:13px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px">📍 ${club.city} • EST. ${club.founded}</div>
          
          <div style="height:1px;background:var(--border);margin:24px 0"></div>
          
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;text-align:left">
            <div style="background:var(--bg-card);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--border)">
              <div style="font-size:18px;font-weight:700;color:var(--accent);font-family:'Orbitron',sans-serif">${CM.formatMoney(club.budget * 1000000)}</div>
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px">Bütçe</div>
            </div>
            <div style="background:var(--bg-card);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--border)">
              <div style="font-size:18px;font-weight:700;color:var(--gold);font-family:'Orbitron',sans-serif">${avgRating}</div>
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px">Ort. Yetenek</div>
            </div>
            <div style="background:var(--bg-card);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--border)">
              <div style="font-size:18px;font-weight:700;color:var(--text-primary);font-family:'Orbitron',sans-serif">${players.length}</div>
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px">Kadro Boyutu</div>
            </div>
            <div style="background:var(--bg-card);padding:16px;border-radius:var(--radius-sm);border:1px solid var(--border)">
              <div style="font-size:14px;color:var(--gold);letter-spacing:2px">${'★'.repeat(Math.min(5, club.prestige))}${club.prestige > 5 ? `<span style="font-size:10px">+${club.prestige - 5}</span>` : ''}</div>
              <div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:1px;margin-top:4px">Prestij</div>
            </div>
          </div>
          
          <div style="margin-top:24px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:var(--radius-sm);padding:16px;display:flex;align-items:center;gap:16px">
            <div style="font-size:24px">🏟️</div>
            <div style="text-align:left">
              <div style="font-size:14px;font-weight:700;color:var(--text-primary)">${club.stadium}</div>
              <div style="font-size:11px;color:var(--text-muted)">${club.capacity.toLocaleString()} Kapasite</div>
            </div>
          </div>
        </div>`;
    }
  },

  // ---- Toast notifications ----
  toast(type, title, body = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
      <div class="toast-text"><strong>${title}</strong>${body ? '<br><span style="color:var(--text-secondary);font-size:12px">'+body+'</span>' : ''}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};
