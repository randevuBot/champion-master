// ===================================================
//   SCOUT SİSTEMİ — ChampionMaster
//   Oyuncu keşfi, sis (fog-of-war) ve raporlama
// ===================================================

const ScoutSystem = {

  // ---- Scout kalite seçenekleri ----
  qualities: {
    low: {
      label: 'Düşük Kalite',
      icon: '🔍',
      weeks: 4,           // tamamlanma süresi (hafta)
      costPerWeek: 10000, // haftalık maliyet (€)
      accuracy: 0.70,     // istatistik doğruluk oranı
      color: '#607d8b'
    },
    medium: {
      label: 'Orta Kalite',
      icon: '🧭',
      weeks: 2,
      costPerWeek: 25000,
      accuracy: 0.85,
      color: '#f5c842'
    },
    high: {
      label: 'Yüksek Kalite',
      icon: '🎯',
      weeks: 1,
      costPerWeek: 60000,
      accuracy: 1.00,
      color: '#00c8ff'
    }
  },

  // ---- Aktif görevleri döner ----
  getActiveScouts() {
    if (!CM.state) return [];
    if (!CM.state.activeScouts) CM.state.activeScouts = [];
    return CM.state.activeScouts;
  },

  // ---- Oyuncu scouted mı? ----
  isScouted(playerId) {
    if (!CM.state) return false;
    // Kendi kulübünün oyuncuları her zaman scouted
    if (CM.state.squad && CM.state.squad.includes(playerId)) return true;
    if (!CM.state.scoutedPlayers) CM.state.scoutedPlayers = {};
    return !!CM.state.scoutedPlayers[playerId];
  },

  // ---- O oyuncu için aktif görev var mı? ----
  hasActiveScout(playerId) {
    return this.getActiveScouts().some(s => s.playerId === playerId);
  },

  // ---- Scout görevi başlat ----
  sendScout(playerId, quality = 'medium') {
    if (!CM.state) return { success: false, reason: 'Oyun başlatılmamış.' };
    const q = this.qualities[quality];
    if (!q) return { success: false, reason: 'Geçersiz scout kalitesi.' };
    if (this.isScouted(playerId)) return { success: false, reason: 'Bu oyuncu zaten keşfedildi.' };
    if (this.hasActiveScout(playerId)) return { success: false, reason: 'Bu oyuncu için zaten aktif bir scout görevi var.' };
    const player = CM.getPlayer ? CM.getPlayer(playerId) : null;
    if (!player) return { success: false, reason: 'Oyuncu bulunamadı.' };
    if (CM.state.finances.balance < q.costPerWeek) {
      return { success: false, reason: 'Yetersiz bütçe! İlk hafta için ' + CM.formatMoney(q.costPerWeek) + ' gerekli.' };
    }
    CM.state.finances.balance -= q.costPerWeek;
    CM.state.finances.seasonExpenses = (CM.state.finances.seasonExpenses || 0) + q.costPerWeek;
    if (!CM.state.activeScouts) CM.state.activeScouts = [];
    CM.state.activeScouts.push({
      id: 'scout_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      playerId,
      playerName: player.firstName + ' ' + player.lastName,
      quality,
      weeksLeft: q.weeks,
      totalWeeks: q.weeks,
      costPerWeek: q.costPerWeek,
      startedWeek: CM.state.week || 1
    });
    CM.save();
    return { success: true };
  },

  // ---- Scout görevini iptal et ----
  cancelScout(scoutId) {
    if (!CM.state || !CM.state.activeScouts) return;
    CM.state.activeScouts = CM.state.activeScouts.filter(s => s.id !== scoutId);
    CM.save();
    if (typeof UI !== 'undefined') UI.updateSidebar();
  },

  // ---- Her hafta çağrılır (CM.advanceWeek veya TimeEngine'den tetiklenir) ----
  tick() {
    if (!CM.state) return;
    if (!CM.state.activeScouts) CM.state.activeScouts = [];
    if (!CM.state.scoutedPlayers) CM.state.scoutedPlayers = {};
    const toRemove = [];
    CM.state.activeScouts.forEach(task => {
      // İlk hafta dışındaki haftalarda maliyet kes
      if (task.weeksLeft < task.totalWeeks) {
        const cost = task.costPerWeek;
        if (CM.state.finances.balance >= cost) {
          CM.state.finances.balance -= cost;
          CM.state.finances.seasonExpenses = (CM.state.finances.seasonExpenses || 0) + cost;
        }
      }
      task.weeksLeft--;
      if (task.weeksLeft <= 0) {
        this._completeScout(task);
        toRemove.push(task.id);
      }
    });
    CM.state.activeScouts = CM.state.activeScouts.filter(s => !toRemove.includes(s.id));
    CM.save();
  },

  // ---- Görev tamamlandığında rapor üret ----
  _completeScout(task) {
    if (!CM.state.scoutedPlayers) CM.state.scoutedPlayers = {};
    const player = CM.getPlayer ? CM.getPlayer(task.playerId) : null;
    const q = this.qualities[task.quality];
    const accuracy = q ? q.accuracy : 0.8;

    CM.state.scoutedPlayers[task.playerId] = {
      scoutedAt: CM.formatDate ? CM.formatDate(CM.state) : new Date().toLocaleDateString('tr-TR'),
      quality: task.quality,
      accuracy
    };
    if (player) {
      if (!player.scouting) player.scouting = {};
      player.scouting.isScouted = true;
      player.scouting.quality = task.quality;
      player.scouting.accuracy = accuracy;
    }
    if (typeof TimeEngine !== 'undefined' && TimeEngine.sendInbox) {
      const qLabel = q ? q.label : 'Orta Kalite';
      const pName = player ? (player.firstName + ' ' + player.lastName) : task.playerName;
      TimeEngine.sendInbox(
        'Scout Raporu: ' + pName,
        'Gözlemcimiz ' + pName + ' hakkında raporunu tamamladı.\\n' +
        'Mevki: ' + (player ? player.position : '?') + '\\n' +
        'Yaş: ' + (player ? player.age : '?') + '\\n' +
        'Genel: ' + (player ? player.overall : '?') + '\\n' +
        'Potansiyel: ' + (player ? player.potential : '?') + '\\n' +
        'Piyasa Değeri: ' + ((player && CM.formatMoney) ? CM.formatMoney(player.value * 1000000) : '?') + '\\n' +
        'Scout Kalitesi: ' + qLabel + '\\n' +
        'Oyuncu profili artık tam görünür.',
        '🔍 Scout Ofisi'
      );
    }
  },

  // ---- Görünen istatistikler (sis sistemi) ----
  // Scouted değilse stats '??' döner, scouted ise gerçek stats
  getVisibleStats(player) {
    if (!player || !CM.state) return null;
    const scouted = this.isScouted(player.id);
    if (scouted) {
      return {
        scouted: true,
        overall: player.overall,
        potential: player.potential,
        stats: player.stats,
        subStats: player.subStats,
        value: player.value,
        wage: player.wage,
        contractEnd: player.contractEnd
      };
    }
    // Sis modunda tahmini overall (±5 hata payı)
    const noise = Math.floor((Math.random() - 0.5) * 10);
    const est = Math.max(40, Math.min(99, player.overall + noise));
    return {
      scouted: false,
      overall: '??',
      estimatedOverall: est,
      potential: '??',
      stats: { pac: '??', sho: '??', pas: '??', dri: '??', def: '??', phy: '??' },
      subStats: null,
      value: '??',
      wage: '??',
      contractEnd: '??'
    };
  },

  // ---- Kendi takım oyuncularını baştan scouted yap ----
  initMySquad() {
    if (!CM.state) return;
    if (!CM.state.scoutedPlayers) CM.state.scoutedPlayers = {};
    (CM.state.squad || []).forEach(pid => {
      if (!CM.state.scoutedPlayers[pid]) {
        CM.state.scoutedPlayers[pid] = { scoutedAt: 'Başlangıç', quality: 'high', accuracy: 1.0 };
      }
      const p = CM.getPlayer ? CM.getPlayer(pid) : null;
      if (p) {
        if (!p.scouting) p.scouting = {};
        p.scouting.isScouted = true;
        p.scouting.quality = 'high';
        p.scouting.accuracy = 1.0;
      }
    });
  },

  // ---- Oyuncu detay modalı için scout paneli ----
  renderScoutPanel(playerId) {
    const player = CM.getPlayer ? CM.getPlayer(playerId) : null;
    if (!player) return '';
    const isMyPlayer = CM.state && CM.state.squad && CM.state.squad.includes(playerId);
    if (isMyPlayer) return ''; // Kendi oyuncularına scout gönderilmez

    const scouted = this.isScouted(playerId);
    const hasActive = this.hasActiveScout(playerId);
    const activeTask = hasActive ? this.getActiveScouts().find(s => s.playerId === playerId) : null;

    // Keşfedilmiş oyuncu
    if (scouted) {
      const info = CM.state.scoutedPlayers[playerId] || {};
      const qD = this.qualities[info.quality] || this.qualities.medium;
      return `
        <div style="margin-top:16px;padding:14px;background:rgba(0,200,100,0.07);
                    border:1px solid rgba(0,200,100,0.25);border-radius:12px;
                    display:flex;align-items:center;gap:12px">
          <span style="font-size:22px">✅</span>
          <div>
            <div style="color:#00c864;font-weight:700;font-size:13px">Oyuncu Keşfedildi</div>
            <div style="color:#8892a4;font-size:11px;margin-top:2px">${qD.icon} ${qD.label} scout • ${info.scoutedAt || ''}</div>
          </div>
        </div>`;
    }

    // Aktif görev var
    if (hasActive && activeTask) {
      const qD = this.qualities[activeTask.quality] || this.qualities.medium;
      const prog = Math.round(((activeTask.totalWeeks - activeTask.weeksLeft) / activeTask.totalWeeks) * 100);
      return `
        <div style="margin-top:16px;padding:14px;background:rgba(245,200,66,0.06);
                    border:1px solid rgba(245,200,66,0.3);border-radius:12px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:18px">${qD.icon}</span>
              <div>
                <div style="color:#f5c842;font-weight:700;font-size:13px">Scout Devam Ediyor</div>
                <div style="color:#8892a4;font-size:11px">${qD.label} • ${activeTask.weeksLeft} hafta kaldı</div>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm"
              onclick="ScoutSystem.cancelScout('${activeTask.id}'); UI.showPlayerDetail('${playerId}');"
              style="font-size:11px;padding:4px 10px">✕ İptal</button>
          </div>
          <div style="height:6px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${prog}%;background:linear-gradient(90deg,#f5c842,#ffe980);border-radius:4px"></div>
          </div>
          <div style="text-align:right;font-size:11px;color:#8892a4;margin-top:4px">${prog}% tamamlandı</div>
        </div>`;
    }

    // Scout gönder formu
    const balance = CM.state ? CM.state.finances.balance : 0;
    const btnRows = Object.entries(this.qualities).map(([key, q]) => {
      const totalCost = q.costPerWeek * q.weeks;
      const canAfford = balance >= q.costPerWeek;
      return `
        <button ${canAfford ? '' : 'disabled'}
          onclick="ScoutSystem._sendScoutFromUI('${playerId}','${key}')"
          style="display:flex;align-items:center;justify-content:space-between;
                 width:100%;padding:11px 14px;margin-bottom:8px;
                 background:${canAfford ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)'};
                 border:1px solid ${canAfford ? q.color + '44' : 'rgba(255,255,255,0.06)'};
                 border-radius:8px;cursor:${canAfford ? 'pointer' : 'not-allowed'};
                 color:${canAfford ? '#e4e9f0' : '#8892a4'};font-size:13px;text-align:left">
          <span>${q.icon} <strong>${q.label}</strong></span>
          <span style="display:flex;flex-direction:column;align-items:flex-end;gap:2px">
            <span style="color:${q.color};font-size:12px;font-weight:700">${q.weeks} hafta</span>
            <span style="font-size:11px;color:#8892a4">${CM.formatMoney(q.costPerWeek)}/h • toplam ${CM.formatMoney(totalCost)}</span>
          </span>
        </button>`;
    }).join('');

    return `
      <div style="margin-top:16px;padding:14px;background:rgba(0,200,255,0.05);
                  border:1px solid rgba(0,200,255,0.2);border-radius:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:20px">🕵️</span>
          <div>
            <div style="font-weight:700;font-size:13px;color:#00c8ff">Scout Gönder</div>
            <div style="font-size:11px;color:#8892a4">Mevcut Bütçe: <strong style="color:#e4e9f0">${CM.formatMoney(balance)}</strong></div>
          </div>
        </div>
        ${btnRows}
        <div style="font-size:11px;color:#8892a4;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06)">
          ⚠️ Scout görevi başladıktan sonra her hafta otomatik ücret kesilir.
        </div>
      </div>`;
  },

  // ---- UI butonundan tetiklenir ----
  _sendScoutFromUI(playerId, quality) {
    const result = ScoutSystem.sendScout(playerId, quality);
    if (result.success) {
      const q = ScoutSystem.qualities[quality];
      UI.toast('success', q.icon + ' Scout Gönderildi', q.label + ' scout görevi başlatıldı.');
      UI.updateSidebar();
      UI.showPlayerDetail(playerId); // Modal'ı yenile
    } else {
      UI.toast('error', 'Scout gönderilemedi', result.reason);
    }
  }
};
