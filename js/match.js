/**
 * ChampionMaster — Match Engine
 * Handles full match simulation with realistic events
 */

class MatchEngine {
  constructor(homeTeam, awayTeam, homeSquad, awaySquad) {
    this.home = homeTeam;
    this.away = awayTeam;
    this.homeSquad = homeSquad; // array of player objects
    this.awaySquad = awaySquad;
    this.minute = 0;
    this.score = { home: 0, away: 0 };
    this.events = [];
    this.stats = {
      possession: { home: 50, away: 50 },
      shots: { home: 0, away: 0 },
      shotsOnTarget: { home: 0, away: 0 },
      corners: { home: 0, away: 0 },
      fouls: { home: 0, away: 0 },
      yellowCards: { home: 0, away: 0 },
      redCards: { home: 0, away: 0 },
      passes: { home: 0, away: 0 },
      tackles: { home: 0, away: 0 }
    };
    this.homeMomentum = 50; // 0-100, affects probabilities
    this.callbacks = {};
    this.paused = false;
    this.speed = 1; // 1=normal, 2=fast, 3=instant
    this.timerRef = null;
    this.isFinished = false;

    // Calculate team ratings
    this.homeRating = this._calcTeamRating(homeSquad);
    this.awayRating = this._calcTeamRating(awaySquad);
  }

  _calcTeamRating(squad) {
    if (!squad || squad.length === 0) return 70;
    const avg = squad.reduce((s, p) => s + (p.overall || 70), 0) / squad.length;
    return Math.round(avg);
  }

  on(event, cb) { this.callbacks[event] = cb; return this; }
  emit(event, data) { if (this.callbacks[event]) this.callbacks[event](data); }

  // ---- Main simulation tick ----
  simulate(onEvent, onFinish) {
    this.callbacks.event = onEvent;
    this.callbacks.finish = onFinish;
    this._tick();
  }

  _tick() {
    if (this.paused || this.isFinished) return;
    const interval = this.speed === 3 ? 0 : this.speed === 2 ? 120 : 400;

    if (this.minute >= 90) {
      // Check injury time
      const injuryTime = Math.floor(Math.random() * 5) + 1;
      if (this.minute < 90 + injuryTime) {
        this._simulateMinute();
        this.minute++;
      } else {
        this._finishMatch();
        return;
      }
    } else {
      this._simulateMinute();
      this.minute++;
      if (this.minute === 45) {
        this._addEvent('half_time', null, 45, '⏱️ İlk yarı bitti!', 'info');
      }
    }

    if (this.speed === 3) {
      if (this.minute <= 90) { this._tick(); }
      else { this._finishMatch(); }
    } else {
      this.timerRef = setTimeout(() => this._tick(), interval);
    }
  }

  _simulateMinute() {
    const ratingDiff = this.homeRating - this.awayRating;
    // Home advantage + rating diff
    const homeStrength = 52 + (ratingDiff * 0.4) + (this.homeMomentum - 50) * 0.1;
    const awayStrength = 100 - homeStrength;
    const homeAttacks = homeStrength / 100;

    // Random event roll
    const roll = Math.random();
    const isHomeAction = Math.random() < homeAttacks;

    // Update possession gradually
    this.stats.possession.home = Math.round(
      this.stats.possession.home * 0.95 + (isHomeAction ? 55 : 45) * 0.05
    );
    this.stats.possession.away = 100 - this.stats.possession.home;

    // Pass count
    if (Math.random() < 0.7) {
      if (isHomeAction) this.stats.passes.home++;
      else this.stats.passes.away++;
    }

    // Momentum shifts
    if (Math.random() < 0.05) {
      this.homeMomentum += isHomeAction ? 5 : -5;
      this.homeMomentum = Math.max(20, Math.min(80, this.homeMomentum));
    }

    // Event generation (Gerçekçi bir maç için çok daha fazla atak olmalı)
    // 90 dakikada ortalama 10-12 şut isabeti (iki takım toplam) olması için ihtimalleri artırıyoruz
    if (roll < 0.12) { this._tryShot(isHomeAction, true); }        // %12 şut isabeti (kaleyi bulan)
    else if (roll < 0.28) { this._tryShot(isHomeAction, false); }  // %16 şut auta çıktı
    else if (roll < 0.35) { this._tryCorner(isHomeAction); }       // %7 korner
    else if (roll < 0.45) { this._tryFoul(isHomeAction); }         // %10 faul
    else if (roll < 0.55) { this._tryDribble(isHomeAction); }      // %10 çalım/tehlikeli atak
    else if (roll < 0.65) { this._tryTackle(isHomeAction); }       // %10 başarılı müdahale
    else if (roll < 0.67) { this._tryInjury(isHomeAction); }       // %2 sakatlık ihtimali
  }

  _getAttr(player, category, statName) {
    if (!player) return 60;
    if (player.attributes && player.attributes[category] && player.attributes[category][statName]) {
      return player.attributes[category][statName];
    }
    return player.overall || 65;
  }

  _tryShot(isHome, onTarget) {
    const attackers = this._getPlayersByRole(isHome ? this.homeSquad : this.awaySquad, 'attack');
    const defenders = this._getPlayersByRole(isHome ? this.awaySquad : this.homeSquad, 'defend');
    const gk = this._getGK(isHome ? this.awaySquad : this.homeSquad);

    const shooter = this._pickRandom(attackers) || this._pickRandom(isHome ? this.homeSquad : this.awaySquad);
    if (!shooter) return;

    const shooterFinishing = this._getAttr(shooter, 'technical', 'finishing');
    const shooterComposure = this._getAttr(shooter, 'mental', 'composure');
    const defStrength = defenders.reduce((s, d) => s + this._getAttr(d, 'defending', 'tackling'), 0) / Math.max(defenders.length, 1);
    const gkStrength = gk ? (this._getAttr(gk, 'goalkeeping', 'reflexes') * 0.6 + this._getAttr(gk, 'goalkeeping', 'positioning') * 0.4) : 70;

    // Hedefi bulma şansı arttırıldı
    const baseChance = ((shooterFinishing + shooterComposure)/2 - gkStrength * 0.7 - defStrength * 0.3);
    // Base chance genelde -10 ile +20 arasıdır. Normalize ediyoruz. 
    // Daha çok gol olması için base chance çarpanını artırdım
    const goalChance = Math.max(0.15, Math.min(0.95, (baseChance + 40) / 100));
    const isGoal = onTarget && Math.random() < goalChance;

    if (isHome) {
      this.stats.shots.home++;
      if (onTarget) this.stats.shotsOnTarget.home++;
    } else {
      this.stats.shots.away++;
      if (onTarget) this.stats.shotsOnTarget.away++;
    }

    if (isGoal) {
      if (isHome) this.score.home++;
      else this.score.away++;
      this.homeMomentum = isHome ? Math.min(90, this.homeMomentum + 25) : Math.max(10, this.homeMomentum - 25);

      const assists = this._getPlayersByRole(isHome ? this.homeSquad : this.awaySquad, 'mid');
      const assister = Math.random() < 0.6 ? this._pickRandom(assists) : null;
      
      const goalComments = [
        `⚽ <strong>MÜKEMMEL BİR GOL!</strong> <strong>${shooter.lastName}</strong> ceza sahası dışından jeneriklik bir vuruşla ağları sarsıyor!`,
        `⚽ <strong>GOL GOL GOL!</strong> Kaleci çaresiz! <strong>${shooter.lastName}</strong> altı pas içinde topa dokunuyor ve gol!`,
        `⚽ <strong>GOOOOOOL!</strong> <strong>${shooter.lastName}</strong> savunmanın hatasını affetmedi ve topu köşeye bıraktı!`,
        `⚽ <strong>İnanamıyorum!</strong> <strong>${shooter.lastName}</strong> dar açıdan imkansızı başarıyor!`,
      ];
      let msg = this._pickRandom(goalComments);
      if (assister && assister.id !== shooter.id) {
        msg += ` Asisti yapan isim <strong>${assister.lastName}</strong>. Harika bir vizyon.`;
      }
      msg += ` Skor şimdi ${this.score.home}-${this.score.away}.`;

      this._addEvent('goal', isHome ? 'home' : 'away', this.minute, msg, 'goal', shooter.id, (assister && assister.id !== shooter.id) ? assister.id : null);
    } else if (onTarget) {
      const savedBy = gk ? `<strong>${gk.lastName}</strong>` : 'kaleci';
      const saveComments = [
        `🧤 <strong>MÜTHİŞ KURTARIŞ!</strong> <strong>${shooter.lastName}</strong> çok sert vurdu ama ${savedBy} parmaklarının ucuyla kornere çeliyor!`,
        `🧤 <strong>${shooter.lastName}</strong> gole çok yaklaştı! ${savedBy} kalesinde adeta devleşti.`,
        `🧤 Kaleciyle karşı karşıya! <strong>${shooter.lastName}</strong> vuruyor, ${savedBy} ayaklarıyla çıkarıyor!`
      ];
      this._addEvent('save', isHome ? 'home' : 'away', this.minute, this._pickRandom(saveComments), 'info');
    } else {
      if (Math.random() < 0.4) {
        const missComments = [
          `👟 <strong>${shooter.lastName}</strong> ceza sahası yayından vurdu, top direği yalayarak dışarı çıkıyor!`,
          `👟 Müsait pozisyon! <strong>${shooter.lastName}</strong> topu dağlara taşlara vuruyor, taraftarlar saç baş yoldu.`,
          `👟 <strong>${shooter.lastName}</strong> zoru başarıp topu direğin dibinden auta gönderdi!`
        ];
        this._addEvent('shot', isHome ? 'home' : 'away', this.minute, this._pickRandom(missComments), 'neutral');
      }
    }
  }

  _tryCorner(isHome) {
    if (isHome) this.stats.corners.home++;
    else this.stats.corners.away++;
    if (Math.random() < 0.2) {
      const player = this._pickRandom(isHome ? this.homeSquad : this.awaySquad);
      if (player) {
        this._addEvent('corner', isHome ? 'home' : 'away', this.minute,
          `🚩 Korner. <strong>${player.lastName}</strong> atar.`,
          'neutral'
        );
      }
    }
  }

  _tryFoul(isHome) {
    if (isHome) this.stats.fouls.home++;
    else this.stats.fouls.away++;

    const fouler = this._pickRandom(isHome ? this.homeSquad : this.awaySquad);
    if (!fouler) return;

    const yellowChance = 0.25;
    const redChance = 0.03;
    const r = Math.random();

    if (r < redChance) {
      if (isHome) this.stats.redCards.home++;
      else this.stats.redCards.away++;
      this._addEvent('red_card', isHome ? 'home' : 'away', this.minute,
        `🟥 <strong>${fouler.lastName}</strong> kırmızı kart gördü ve sahayı terk ediyor!`,
        'red-card',
        fouler.id
      );
    } else if (r < yellowChance) {
      if (isHome) this.stats.yellowCards.home++;
      else this.stats.yellowCards.away++;
      this._addEvent('yellow_card', isHome ? 'home' : 'away', this.minute,
        `🟨 <strong>${fouler.lastName}</strong> sarı kart gördü.`,
        'yellow-card',
        fouler.id
      );
    } else {
      if (Math.random() < 0.15) {
        this._addEvent('foul', isHome ? 'home' : 'away', this.minute,
          `⚠️ <strong>${fouler.lastName}</strong> faul yaptı. Serbest vuruş.`,
          'neutral'
        );
      }
    }
  }

  _tryDribble(isHome) {
    const dribblers = this._getPlayersByRole(isHome ? this.homeSquad : this.awaySquad, 'mid');
    const player = this._pickRandom(dribblers);
    if (!player || Math.random() > 0.4) return;
    const dri = this._getAttr(player, 'technical', 'dribbling');
    if (dri > 70) {
      const comments = [
        `✨ <strong>${player.lastName}</strong> harika bir çalımla iki kişiyi oyundan düşürdü!`,
        `✨ Tribünler ayakta! <strong>${player.lastName}</strong> bileklerine çok hakim, rakibini bakkala gönderdi!`,
        `✨ <strong>${player.lastName}</strong> topla birlikte fırtına gibi ceza sahasına sokuluyor.`
      ];
      this._addEvent('dribble', isHome ? 'home' : 'away', this.minute, this._pickRandom(comments), 'neutral');
    }
  }

  _tryTackle(isHome) {
    const tacklers = this._getPlayersByRole(isHome ? this.awaySquad : this.homeSquad, 'defend');
    const player = this._pickRandom(tacklers);
    if (!player || Math.random() > 0.35) return;
    const def = this._getAttr(player, 'defending', 'tackling');
    if (def > 72) {
      const comments = [
        `🛡️ <strong>${player.lastName}</strong> kritik bir müdahaleyle olası bir gol tehlikesini önlüyor.`,
        `🛡️ Harika bir zamanlama! <strong>${player.lastName}</strong> topu tereyağından kıl çeker gibi aldı.`,
        `🛡️ Tehlike büyümeden <strong>${player.lastName}</strong> araya girdi ve tehlikeyi uzaklaştırdı.`
      ];
      this._addEvent('tackle', isHome ? 'away' : 'home', this.minute, this._pickRandom(comments), 'neutral');
    }
  }

  _tryInjury(isHome) {
    const player = this._pickRandom(isHome ? this.homeSquad : this.awaySquad);
    if (!player || Math.random() > 0.3) return;
    const injuryMin = Math.floor(Math.random() * 10) + 1;
    this._addEvent('injury', isHome ? 'home' : 'away', this.minute,
      `🩹 <strong>${player.lastName}</strong> sakatlandı! Tahminen <strong>${injuryMin} hafta</strong> sahalardan uzak kalacak.`,
      'danger'
    );
    // Add injury to player (handled by game state)
    this.emit('playerInjured', { player, weeks: injuryMin, team: isHome ? 'home' : 'away' });
  }

  _addEvent(type, side, minute, text, cssClass, playerId = null, assisterId = null) {
    const event = { type, side, minute, text, cssClass, playerId, assisterId };
    this.events.push(event);
    this.emit('event', { event, score: this.score, stats: this.stats, minute: this.minute });
  }

  _finishMatch() {
    this.isFinished = true;
    if (this.timerRef) clearTimeout(this.timerRef);
    this._addEvent('full_time', null, 90, `🏁 <strong>MAÇ BİTTİ!</strong> ${this.home.shortName} ${this.score.home} - ${this.score.away} ${this.away.shortName}`, 'info');

    const matchResult = {
      score:  this.score,
      stats:  this.stats,
      events: this.events,
      home:   this.home,
      away:   this.away
    };

    this.emit('finish', matchResult);

    // ── AI Maç Anlatımı (asenkron) ──────────────────────────────────────────
    if (typeof AISystem !== 'undefined') {
      AISystem.generateMatchCommentary(matchResult).then(function(commentary) {
        AISystem.injectCommentaryToResultScreen(commentary);
      }).catch(function(err) {
        console.warn('[AISystem] Maç anlatımı üretilemedi:', err);
      });
    }
  }

  _getPlayersByRole(squad, role) {
    if (!squad) return [];
    const posMap = {
      attack: ['ST', 'CF', 'LW', 'RW', 'CAM'],
      mid: ['CM', 'CDM', 'CAM', 'LM', 'RM'],
      defend: ['CB', 'LB', 'RB', 'CDM'],
      gk: ['GK']
    };
    return squad.filter(p => posMap[role]?.includes(p.position));
  }

  _getGK(squad) {
    if (!squad) return null;
    return squad.find(p => p.position === 'GK') || null;
  }

  _pickRandom(arr) {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  pause() { this.paused = true; if (this.timerRef) clearTimeout(this.timerRef); }
  resume() { this.paused = false; this._tick(); }
  setSpeed(s) { this.speed = s; }

  // Simulate full match instantly and return result
  simulateInstant() {
    while (this.minute <= 95 && !this.isFinished) {
      if (this.minute < 90) {
        this._simulateMinute();
      } else {
        const injT = Math.floor(Math.random() * 4) + 1;
        if (this.minute < 90 + injT) this._simulateMinute();
        else break;
      }
      this.minute++;
    }
    this.isFinished = true;
    return { score: this.score, stats: this.stats, events: this.events };
  }
}

// Export
if (typeof module !== 'undefined') module.exports = MatchEngine;
