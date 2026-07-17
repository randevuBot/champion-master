/**
 * ChampionMaster — Match Engine
 * Handles full match simulation with realistic events
 */

class MatchEngine {
  constructor(homeTeam, awayTeam, homeSquad, awaySquad, homeTactics = null, awayTactics = null, aiLines = null) {
    this.home = homeTeam;
    this.away = awayTeam;
    this.homeSquad = homeSquad; // array of player objects
    this.awaySquad = awaySquad;
    this.homeTactics = homeTactics || { style: 'balanced', press: 'medium', tempo: 'normal' };
    this.awayTactics = awayTactics || { style: 'balanced', press: 'medium', tempo: 'normal' };
    this.aiLines = aiLines;
    
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

    // Calculate base team ratings
    this.homeRating = this._calcTeamRating(homeSquad, this.homeTactics);
    this.awayRating = this._calcTeamRating(awaySquad, this.awayTactics);
  }

  _calcTeamRating(squad, tactics) {
    if (!squad || squad.length === 0) return 70;
    const avg = squad.reduce((s, p) => s + (p.overall || 70), 0) / squad.length;
    
    // Taktiksel güçlendirmeler
    let tacticalBonus = 0;
    if (tactics.style === 'press') tacticalBonus += 2; // Yüksek pres gücü artırır
    if (tactics.style === 'park') tacticalBonus -= 1; // Otobüs çekmek rating'i düşürür ama savunmayı artırır
    if (tactics.style === 'possession') tacticalBonus += 1;
    if (tactics.style === 'counter') tacticalBonus += 0.5;
    if (tactics.style === 'longball') tacticalBonus -= 0.5;
    if (tactics.press === 'high') tacticalBonus += 1.5;
    
    return Math.round(avg + tacticalBonus);
  }

  on(event, cb) { this.callbacks[event] = cb; return this; }
  emit(event, data) { if (this.callbacks[event]) this.callbacks[event](data); }

  // ---- Main simulation tick ----
  simulate(onEvent, onFinish) {
    this.callbacks.event = onEvent;
    this.callbacks.finish = onFinish;
    this._tick();
  }

  resume() {
    if (this.paused) {
      this.paused = false;
      this._tick();
    }
  }

  substitute(side, playerOutId, playerInObj) {
    if (side === 'home') {
      this.homeSquad = this.homeSquad.filter(p => p.id !== playerOutId);
      this.homeSquad.push(playerInObj);
      this.homeRating = this._calcTeamRating(this.homeSquad, this.homeTactics);
      this._addEvent('sub', 'home', this.minute, `🔄 Oyuncu Değişikliği (Ev): Çıkan ${playerOutId}, Giren ${playerInObj.name}`, 'info');
    } else {
      this.awaySquad = this.awaySquad.filter(p => p.id !== playerOutId);
      this.awaySquad.push(playerInObj);
      this.awayRating = this._calcTeamRating(this.awaySquad, this.awayTactics);
      this._addEvent('sub', 'away', this.minute, `🔄 Oyuncu Değişikliği (Dep): Çıkan ${playerOutId}, Giren ${playerInObj.name}`, 'info');
    }
  }

  updateTactics(side, newTactics) {
    if (side === 'home') {
      this.homeTactics = newTactics;
      this.homeRating = this._calcTeamRating(this.homeSquad, this.homeTactics);
    } else {
      this.awayTactics = newTactics;
      this.awayRating = this._calcTeamRating(this.awaySquad, this.awayTactics);
    }
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
        if (this.speed !== 3) {
          this.paused = true; // Wait for UI to resume
        }
      }
    }

    if (this.callbacks.event) {
      this.callbacks.event({ type: 'tick', minute: this.minute, score: this.score, stats: this.stats });
    }

    if (this.minute >= 90) {
      this._finishMatch();
      return;
    }

    if (this.speed === 3) {
      this._tick();
    } else {
      this.timerRef = setTimeout(() => this._tick(), interval);
    }
  }

  _getFatigueRate(position) {
    if (position === 'GK') return 0.05; // Kaleciler çok az yorulur
    if (['CB'].includes(position)) return 0.20; // Stoperler az yorulur
    if (['ST', 'CF'].includes(position)) return 0.25; // Forvetler orta yorulur
    if (['LW', 'RW', 'LM', 'RM', 'CAM'].includes(position)) return 0.35; // Kanatlar ve ofansif ortalar çok yorulur
    if (['CM', 'CDM'].includes(position)) return 0.38; // Merkez orta sahalar çok koşar
    if (['LB', 'RB', 'LWB', 'RWB'].includes(position)) return 0.42; // Bekler en çok koşar (git-gel)
    return 0.30;
  }

  _simulateMinute() {
    // Mevkiye göre dinamik yorgunluk (Fitness) düşüşü
    this.homeSquad.forEach(p => {
      const drop = this._getFatigueRate(p.position);
      p.matchFitness = Math.max(10, (p.matchFitness !== undefined ? p.matchFitness : (p.fitness || 100)) - drop);
    });
    this.awaySquad.forEach(p => {
      const drop = this._getFatigueRate(p.position);
      p.matchFitness = Math.max(10, (p.matchFitness !== undefined ? p.matchFitness : (p.fitness || 100)) - drop);
    });

    const ratingDiff = this.homeRating - this.awayRating;
    // Home advantage + rating diff
    let homeStrength = 52 + (ratingDiff * 0.4) + (this.homeMomentum - 50) * 0.1;
    
    // Taktiksel Çarpanlar (Stil ve Tempo)
    if (this.homeTactics.style === 'press') homeStrength += 5;
    if (this.homeTactics.style === 'park') homeStrength -= 4; // Defansif
    if (this.awayTactics.style === 'press') homeStrength -= 5;
    if (this.awayTactics.style === 'park') homeStrength += 4; // Rakip defansifse bizim baskımız artar
    if (this.homeTactics.style === 'counter') homeStrength -= 1; // Daha çok bekler
    if (this.awayTactics.style === 'counter') homeStrength += 1;

    // Tempo çarpanı
    let actionFrequency = 1.0;
    if (this.homeTactics.tempo === 'fast' || this.awayTactics.tempo === 'fast') actionFrequency += 0.2;
    if (this.homeTactics.tempo === 'slow' || this.awayTactics.tempo === 'slow') actionFrequency -= 0.15;

    homeStrength = Math.max(10, Math.min(90, homeStrength));
    const homeAttacks = homeStrength / 100;

    // Random event roll
    const roll = Math.random() / actionFrequency; // Tempo hızlıysa roll düşer, olay ihtimali artar
    const isHomeAction = Math.random() < homeAttacks;

    // Update possession gradually
    if (!this._internalPossession) this._internalPossession = 50.0;
    
    let possessionBonus = 0;
    if (this.homeTactics.style === 'possession') possessionBonus += 5;
    if (this.awayTactics.style === 'possession') possessionBonus -= 5;
    if (this.homeTactics.style === 'park') possessionBonus -= 8;
    if (this.awayTactics.style === 'park') possessionBonus += 8;

    let targetPossession = (isHomeAction ? 65 : 35) + possessionBonus;
    targetPossession = Math.max(20, Math.min(80, targetPossession));

    this._internalPossession = this._internalPossession * 0.90 + targetPossession * 0.10;
    
    this.stats.possession.home = Math.round(this._internalPossession);
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

    // CPU Manager AI (Taktik / Değişiklik)
    if (typeof CpuSystem !== 'undefined' && typeof CM !== 'undefined' && CM.state) {
      if (this.home.id !== CM.state.myClubId) CpuSystem.decideMatchAction(this, true);
      if (this.away.id !== CM.state.myClubId) CpuSystem.decideMatchAction(this, false);
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
    let base = 65;
    if (player.attributes && player.attributes[category] && player.attributes[category][statName]) {
      base = player.attributes[category][statName];
    } else if (player.overall) {
      base = player.overall;
    }

    // Kondisyon Etkisi
    const fitness = player.matchFitness !== undefined ? player.matchFitness : (player.fitness || 100);
    if (fitness < 90) {
      base -= (90 - fitness) * 0.25; // Kondisyon 50 ise stat 10 düşer.
    }

    // Moral Etkisi
    const morale = player.morale !== undefined ? player.morale : 70;
    const moraleDiff = morale - 70;
    base += (moraleDiff * 0.15); // Moral 100 ise +4.5, 30 ise -6 eklenir.

    return Math.max(10, Math.round(base));
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
      
      let msg = "";
      if (this.aiLines && this.aiLines.goalLines && this.aiLines.goalLines.length > 0) {
        msg = "⚽ " + this._pickRandom(this.aiLines.goalLines).replace('[PLAYER]', `<strong>${shooter.lastName}</strong>`);
      } else {
        const goalComments = [
          `⚽ <strong>MÜKEMMEL BİR GOL!</strong> <strong>${shooter.lastName}</strong> ceza sahası dışından jeneriklik bir vuruşla ağları sarsıyor!`,
          `⚽ <strong>GOL GOL GOL!</strong> Kaleci çaresiz! <strong>${shooter.lastName}</strong> altı pas içinde topa dokunuyor ve gol!`,
          `⚽ <strong>GOOOOOOL!</strong> <strong>${shooter.lastName}</strong> savunmanın hatasını affetmedi ve topu köşeye bıraktı!`,
          `⚽ <strong>İnanamıyorum!</strong> <strong>${shooter.lastName}</strong> dar açıdan imkansızı başarıyor!`,
        ];
        msg = this._pickRandom(goalComments);
      }

      if (assister && assister.id !== shooter.id) {
        msg += ` Asisti yapan isim <strong>${assister.lastName}</strong>.`;
      }
      msg += ` Skor şimdi ${this.score.home}-${this.score.away}.`;

      this._addEvent('goal', isHome ? 'home' : 'away', this.minute, msg, 'goal', shooter.id, (assister && assister.id !== shooter.id) ? assister.id : null);
    } else if (onTarget) {
      const savedBy = gk ? `<strong>${gk.lastName}</strong>` : 'kaleci';
      
      let msg = "";
      if (this.aiLines && this.aiLines.saveLines && this.aiLines.saveLines.length > 0) {
        msg = "🧤 " + this._pickRandom(this.aiLines.saveLines).replace('[PLAYER]', savedBy).replace('[SHOOTER]', `<strong>${shooter.lastName}</strong>`);
      } else {
        const saveComments = [
          `🧤 <strong>MÜTHİŞ KURTARIŞ!</strong> <strong>${shooter.lastName}</strong> çok sert vurdu ama ${savedBy} parmaklarının ucuyla kornere çeliyor!`,
          `🧤 <strong>${shooter.lastName}</strong> gole çok yaklaştı! ${savedBy} kalesinde adeta devleşti.`,
          `🧤 Kaleciyle karşı karşıya! <strong>${shooter.lastName}</strong> vuruyor, ${savedBy} ayaklarıyla çıkarıyor!`
        ];
        msg = this._pickRandom(saveComments);
      }
      this._addEvent('save', isHome ? 'home' : 'away', this.minute, msg, 'info');
    } else {
      if (Math.random() < 0.4) {
        let msg = "";
        if (this.aiLines && this.aiLines.missLines && this.aiLines.missLines.length > 0) {
          msg = "👟 " + this._pickRandom(this.aiLines.missLines).replace('[PLAYER]', `<strong>${shooter.lastName}</strong>`);
        } else {
          const missComments = [
            `👟 <strong>${shooter.lastName}</strong> ceza sahası yayından vurdu, top direği yalayarak dışarı çıkıyor!`,
            `👟 Müsait pozisyon! <strong>${shooter.lastName}</strong> topu dağlara taşlara vuruyor, taraftarlar saç baş yoldu.`,
            `👟 <strong>${shooter.lastName}</strong> zoru başarıp topu direğin dibinden auta gönderdi!`
          ];
          msg = this._pickRandom(missComments);
        }
        this._addEvent('shot', isHome ? 'home' : 'away', this.minute, msg, 'neutral');
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
      'danger',
      player.id,
      null,
      { weeks: injuryMin }
    );
    // Add injury to player (handled by game state)
    this.emit('playerInjured', { player, weeks: injuryMin, team: isHome ? 'home' : 'away' });
  }

  _addEvent(type, side, minute, text, cssClass, playerId = null, assisterId = null, extraData = null) {
    const event = { type, side, minute, text, cssClass, playerId, assisterId, extraData };
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
      away:   this.away,
      homeSquad: this.homeSquad,
      awaySquad: this.awaySquad
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
    this._finishMatch();
    return { score: this.score, stats: this.stats, events: this.events };
  }
}

// Export
export { MatchEngine };
