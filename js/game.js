/**
 * ChampionMaster — Game State & Core Logic
 * Manages all game data, seasons, transfers, save/load
 */

const CM = {
  version: '1.0.0',
  state: null,

  // ---- Default new game state ----
  defaultState() {
    return {
      version: CM.version,
      savedAt: null,
      manager: { name: 'Mert', reputation: 50 },
      myClubId: null,
      season: 1,
      week: 1,
      date: { day: 1, month: 8, year: 2025 },
      finances: {
        balance: 0,
        transferBudget: 0,
        wageBudget: 0,
        weeklyWages: 0,
        seasonRevenue: 0,
        seasonExpenses: 0,
        history: []
      },
      squad: [],             // player ids of my squad
      injured: [],           // { playerId, weeksLeft }
      suspensions: [],       // { playerId, matchesLeft }
      onLoan: [],            // players on loan (out)
      loanedIn: [],          // players on loan (in)
      formation: '4-3-3',
      tactics: { style: 'balanced', press: 'medium', tempo: 'normal' },
      lineup: [],            // 11 player ids in order
      seasonStats: {
        played: 0, won: 0, drawn: 0, lost: 0,
        goalsFor: 0, goalsAgainst: 0, points: 0,
        cleanSheets: 0, topScorer: null
      },
      leagueTable: [],
      fixtures: [],
      results: [],
      transferHistory: [],
      academy: [],           // youth player ids
      notifications: [],
      achievements: [],
      playerStats: {},       // { playerId: { goals, assists, appearances, ... } }
      morale: 70,
      facilityLevel: 3,      // 1-5
      stadiumUpgrade: 0,
      scoutingReports: [],
      settings: { matchSpeed: 2, autoSave: true, difficulty: 'normal' }
    };
  },

  // ---- Init new game ----
  newGame(clubId, managerName) {
    const club = ChampionMasterData.clubs.find(c => c.id === clubId);
    if (!club) throw new Error('Club not found: ' + clubId);

    const state = CM.defaultState();
    state.myClubId = clubId;
    state.manager.name = managerName || 'Mert';
    state.finances.balance = club.budget;
    state.finances.transferBudget = Math.round(club.budget * 0.4);
    state.finances.wageBudget = Math.round(club.budget * 0.1);

    // Assign club players
    const clubPlayers = ChampionMasterData.players.filter(p => p.clubId === clubId);
    state.squad = clubPlayers.map(p => p.id);

    // Default formation & lineup
    state.formation = '4-3-3';
    state.lineup = CM.autoSelectLineup(clubPlayers, '4-3-3');

    // Init player stats
    clubPlayers.forEach(p => {
      state.playerStats[p.id] = {
        goals: 0, assists: 0, appearances: 0,
        yellowCards: 0, redCards: 0, cleanSheets: 0,
        rating: p.overall
      };
    });

    // Academy players
    const academyPlayers = ChampionMasterData.players.filter(
      p => p.clubId === clubId && p.isYouth
    );
    state.academy = academyPlayers.map(p => p.id);

    // Generate full season fixtures
    state.fixtures = CM.generateFixtures(clubId);

    // Init league table
    state.leagueTable = CM.generateLeagueTable(club.leagueId);

    CM.state = state;
    CM.save();

    // Scout sistemi: kendi kadromuzu baştan keşfedilmiş say
    if (typeof ScoutSystem !== 'undefined') {
      ScoutSystem.initMySquad();
    }

    return state;
  },

  // ---- Auto select best lineup ----
  autoSelectLineup(players, formation) {
    const slots = CM.getFormationSlots(formation);
    const lineup = [];
    const used = new Set();

    slots.forEach(pos => {
      const related = CM.getRelatedPositions(pos);
      const candidates = players
        .filter(p => related.includes(p.position) && !used.has(p.id))
        .sort((a, b) => b.overall - a.overall);
      if (candidates.length > 0) {
        lineup.push(candidates[0].id);
        used.add(candidates[0].id);
      } else {
        // Fallback: best available
        const fallback = players.filter(p => !used.has(p.id))
          .sort((a, b) => b.overall - a.overall)[0];
        if (fallback) {
          lineup.push(fallback.id);
          used.add(fallback.id);
        }
      }
    });
    return lineup;
  },

  getPlayersByClub(id) {
    return ChampionMasterData.players.filter(p => p.clubId === id);
  },

  getRelatedPositions(slot) {
    const map = {
      'GK': ['GK'],
      'CB': ['CB', 'CDM'],
      'LB': ['LB', 'LW'],
      'RB': ['RB', 'RW'],
      'CDM': ['CDM', 'CM', 'CB'],
      'CM': ['CM', 'CDM', 'CAM'],
      'CAM': ['CAM', 'CM', 'LW', 'RW'],
      'LW': ['LW', 'LM', 'CAM', 'ST'],
      'RW': ['RW', 'RM', 'CAM', 'ST'],
      'ST': ['ST', 'CF', 'LW', 'RW'],
      'CF': ['CF', 'ST', 'CAM']
    };
    return map[slot] || [slot];
  },

  getFormationSlots(formation) {
    const formations = {
      '4-3-3': ['GK', 'RB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'RW', 'ST', 'LW'],
      '4-4-2': ['GK', 'RB', 'CB', 'CB', 'LB', 'RM', 'CM', 'CM', 'LM', 'ST', 'ST'],
      '4-2-3-1': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CDM', 'CAM', 'RW', 'LW', 'ST'],
      '3-5-2': ['GK', 'CB', 'CB', 'CB', 'RB', 'CM', 'CDM', 'CM', 'LB', 'ST', 'ST'],
      '5-3-2': ['GK', 'RB', 'CB', 'CB', 'CB', 'LB', 'CM', 'CM', 'CM', 'ST', 'ST'],
      '4-1-2-1-2': ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CM', 'CAM', 'ST', 'ST'],
      '3-4-3': ['GK', 'CB', 'CB', 'CB', 'RM', 'CM', 'CM', 'LM', 'RW', 'ST', 'LW']
    };
    return formations[formation] || formations['4-3-3'];
  },

  // ---- Generate season fixtures ----
  generateFixtures(myClubId) {
    const myClub = ChampionMasterData.clubs.find(c => c.id === myClubId);
    const leagueClubs = ChampionMasterData.clubs.filter(c => c.leagueId === myClub.leagueId);
    const opponents = leagueClubs.filter(c => c.id !== myClubId);

    const fixtures = [];
    let week = 1;

    // Home and away against every opponent
    opponents.forEach((opp, i) => {
      fixtures.push({
        id: `fix_${myClubId}_${opp.id}_h`,
        week: week,
        competition: 'league',
        homeClubId: myClubId,
        awayClubId: opp.id,
        played: false,
        result: null
      });
      week++;
      fixtures.push({
        id: `fix_${opp.id}_${myClubId}_a`,
        week: week + opponents.length,
        competition: 'league',
        homeClubId: opp.id,
        awayClubId: myClubId,
        played: false,
        result: null
      });
    });

    // Cup fixtures (simplified)
    [3, 8, 15, 22, 29].forEach((cupWeek, i) => {
      const randomOpp = opponents[Math.floor(Math.random() * opponents.length)];
      fixtures.push({
        id: `cup_${cupWeek}`,
        week: cupWeek,
        competition: i < 3 ? 'domestic_cup' : 'europe',
        homeClubId: Math.random() > 0.5 ? myClubId : randomOpp.id,
        awayClubId: Math.random() > 0.5 ? randomOpp.id : myClubId,
        played: false,
        result: null
      });
    });

    return fixtures.sort((a, b) => a.week - b.week);
  },

  // ---- Generate league table ----
  generateLeagueTable(leagueId) {
    const clubs = ChampionMasterData.clubs.filter(c => c.leagueId === leagueId);
    return clubs.map(c => ({
      clubId: c.id,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0,
      form: []
    })).sort(() => Math.random() - 0.5);
  },

  // ---- Advance week (simulate CPU matches) ----
  advanceWeek() {
    if (!CM.state) return;
    const { state } = CM;

    // Simulate all CPU league matches this week
    const leagueFixtures = ChampionMasterData.fixtures?.filter(
      f => !f.myMatch && f.week === state.week
    ) || [];

    leagueFixtures.forEach(fix => {
      const homeClub = ChampionMasterData.clubs.find(c => c.id === fix.homeClubId);
      const awayClub = ChampionMasterData.clubs.find(c => c.id === fix.awayClubId);
      if (!homeClub || !awayClub) return;

      const homeSquad = ChampionMasterData.players.filter(p => p.clubId === homeClub.id);
      const awaySquad = ChampionMasterData.players.filter(p => p.clubId === awayClub.id);

      const engine = new MatchEngine(homeClub, awayClub, homeSquad, awaySquad);
      const result = engine.simulateInstant();

      // Update league table
      CM.updateTable(fix.homeClubId, fix.awayClubId, result.score.home, result.score.away);
      
      // Update CPU match player stats
      CM.updatePlayerStatsFromEvents(result.events);
    });

    // Recover injured players
    state.injured = state.injured
      .map(i => ({ ...i, weeksLeft: i.weeksLeft - 1 }))
      .filter(i => i.weeksLeft > 0);

    // Reduce suspensions
    state.suspensions = state.suspensions
      .map(s => ({ ...s, matchesLeft: s.matchesLeft - 1 }))
      .filter(s => s.matchesLeft > 0);

    // Transfer window (week 1-6 = summer, week 19-22 = winter)
    const isTransferWindow = (state.week >= 1 && state.week <= 6) ||
                              (state.week >= 19 && state.week <= 22);
    if (isTransferWindow && Math.random() < 0.3) {
      CM.generateTransferRumor();
    }

    // Weekly wage deduction
    state.finances.balance -= state.finances.weeklyWages;
    state.finances.weeklyWages = CM.calcWeeklyWages();
    state.finances.seasonExpenses += state.finances.weeklyWages;

    // Weekly revenue
    const matchdayRevenue = Math.floor(Math.random() * 200000) + 50000;
    state.finances.balance += matchdayRevenue;
    state.finances.seasonRevenue += matchdayRevenue;

    // Morale drift
    state.morale = Math.max(10, Math.min(100,
      state.morale + (state.seasonStats.won > state.seasonStats.lost ? 1 : -1)
    ));

    // Scout sistemi: haftalık tick
    if (typeof ScoutSystem !== 'undefined') {
      ScoutSystem.tick();
    }

    state.week++;

    // Advance calendar by 7 days
    if (typeof TimeEngine !== 'undefined' && TimeEngine.advanceDay) {
       for(let i=0; i<7; i++) TimeEngine.advanceDay();
    } else {
       const nextDate = new Date(state.date.year, state.date.month - 1, state.date.day + 7);
       state.date.day = nextDate.getDate();
       state.date.month = nextDate.getMonth() + 1;
       state.date.year = nextDate.getFullYear();
    }

    if (typeof FinanceSystem !== 'undefined') {
      FinanceSystem.tick();
    }

    if (state.week > 38) {
      CM.endSeason();
    }

    CM.save();
    return state;
  },

  updateTable(homeId, awayId, homeGoals, awayGoals) {
    const { leagueTable } = CM.state;
    const homeRow = leagueTable.find(r => r.clubId === homeId);
    const awayRow = leagueTable.find(r => r.clubId === awayId);
    if (!homeRow || !awayRow) return;

    homeRow.played++; awayRow.played++;
    homeRow.gf += homeGoals; homeRow.ga += awayGoals;
    awayRow.gf += awayGoals; awayRow.ga += homeGoals;
    homeRow.gd = homeRow.gf - homeRow.ga;
    awayRow.gd = awayRow.gf - awayRow.ga;

    if (homeGoals > awayGoals) {
      homeRow.won++; homeRow.points += 3; homeRow.form.push('W');
      awayRow.lost++; awayRow.form.push('L');
    } else if (homeGoals === awayGoals) {
      homeRow.drawn++; homeRow.points += 1; homeRow.form.push('D');
      awayRow.drawn++; awayRow.points += 1; awayRow.form.push('D');
    } else {
      awayRow.won++; awayRow.points += 3; awayRow.form.push('W');
      homeRow.lost++; homeRow.form.push('L');
    }

    // Keep form to last 5
    if (homeRow.form.length > 5) homeRow.form = homeRow.form.slice(-5);
    if (awayRow.form.length > 5) awayRow.form = awayRow.form.slice(-5);

    // Sort table
    CM.state.leagueTable.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  },

  updatePlayerStatsFromEvents(events) {
    if (!events) return;
    events.forEach(e => {
      const initStats = (pid) => {
        if (!CM.state.playerStats[pid]) {
           CM.state.playerStats[pid] = { goals: 0, assists: 0, appearances: 0, yellowCards: 0, redCards: 0, cleanSheets: 0 };
        }
      };

      if (e.type === 'goal' && e.playerId) {
        initStats(e.playerId);
        CM.state.playerStats[e.playerId].goals++;
      }
      if (e.type === 'goal' && e.assisterId) {
        initStats(e.assisterId);
        CM.state.playerStats[e.assisterId].assists++;
      }
      if (e.type === 'yellow_card' && e.playerId) {
        initStats(e.playerId);
        CM.state.playerStats[e.playerId].yellowCards++;
      }
      if (e.type === 'red_card' && e.playerId) {
        initStats(e.playerId);
        CM.state.playerStats[e.playerId].redCards++;
      }
    });
  },

  updateMyMatchResult(homeGoals, awayGoals, wasHome, events = []) {
    const myGoals = wasHome ? homeGoals : awayGoals;
    const oppGoals = wasHome ? awayGoals : homeGoals;
    const { seasonStats, myClubId } = CM.state;

    seasonStats.played++;
    seasonStats.goalsFor += myGoals;
    seasonStats.goalsAgainst += oppGoals;

    let result;
    if (myGoals > oppGoals) { seasonStats.won++; seasonStats.points += 3; result = 'W'; }
    else if (myGoals === oppGoals) { seasonStats.drawn++; seasonStats.points += 1; result = 'D'; }
    else { seasonStats.lost++; result = 'L'; }

    if (oppGoals === 0) seasonStats.cleanSheets++;

    // Update table
    const fixture = CM.state.fixtures.find(f => !f.played && f.week === CM.state.week);
    if (fixture) {
      fixture.played = true;
      fixture.result = { home: homeGoals, away: awayGoals };
      CM.updateTable(fixture.homeClubId, fixture.awayClubId, homeGoals, awayGoals);
    }

    // Morale change
    if (result === 'W') CM.state.morale = Math.min(100, CM.state.morale + 8);
    else if (result === 'D') CM.state.morale = Math.min(100, CM.state.morale + 1);
    else CM.state.morale = Math.max(10, CM.state.morale - 10);

    CM.addNotification(
      result === 'W' ? 'success' : result === 'D' ? 'info' : 'error',
      result === 'W' ? '🏆 Kazandınız!' : result === 'D' ? '🤝 Beraberlik' : '😔 Kaybettiniz',
      `Maç sonucu: ${homeGoals} - ${awayGoals}`
    );

    // Update player stats including appearances for my lineup
    CM.updatePlayerStatsFromEvents(events);
    CM.state.lineup.forEach(pid => {
      if (!CM.state.playerStats[pid]) CM.state.playerStats[pid] = { goals: 0, assists: 0, appearances: 0, yellowCards: 0, redCards: 0, cleanSheets: 0 };
      CM.state.playerStats[pid].appearances++;
      if (oppGoals === 0) CM.state.playerStats[pid].cleanSheets++;
    });

    if (typeof TacticsSystem !== 'undefined') {
      TacticsSystem.processPostMatch(CM.state.myClubId, CM.state.lineup, CM.getFormationSlots(CM.state.formation));
    }

    CM.save();
    return result;
  },

  // ---- Transfer system ----
  buyPlayer(playerId, offerAmount) {
    const player = ChampionMasterData.players.find(p => p.id === playerId);
    if (!player) return { success: false, reason: 'Oyuncu bulunamadı.' };
    if (player.clubId === CM.state.myClubId) return { success: false, reason: 'Zaten kadronuzda.' };

    const budget = CM.state.finances.transferBudget;
    const value = player.value * 1000000;

    if (offerAmount < value * 0.8) return { success: false, reason: 'Teklif çok düşük.' };
    if (offerAmount > budget) return { success: false, reason: 'Yetersiz transfer bütçesi.' };

    // Acceptance probability
    const acceptChance = offerAmount >= value ? 0.9 : 0.5 + (offerAmount - value * 0.8) / (value * 0.4);
    if (Math.random() > acceptChance) return { success: false, reason: 'Kulüp teklifi reddetti.' };

    // Execute transfer
    player.clubId = CM.state.myClubId;
    CM.state.squad.push(playerId);
    CM.state.finances.transferBudget -= offerAmount;
    CM.state.finances.balance -= offerAmount;
    CM.state.finances.seasonExpenses += offerAmount;
    CM.state.transferHistory.push({
      type: 'buy', playerId, amount: offerAmount, week: CM.state.week
    });

    // Init player stats
    CM.state.playerStats[playerId] = { goals: 0, assists: 0, appearances: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, rating: player.overall };

    CM.addNotification('success', '✅ Transfer tamamlandı!', `${player.firstName} ${player.lastName} takımınıza katıldı!`);
    CM.save();
    return { success: true };
  },

  sellPlayer(playerId, offerAmount) {
    const player = ChampionMasterData.players.find(p => p.id === playerId);
    if (!player) return { success: false, reason: 'Oyuncu bulunamadı.' };

    const idx = CM.state.squad.indexOf(playerId);
    if (idx === -1) return { success: false, reason: 'Kadronuzda değil.' };

    // Remove from squad and lineup
    CM.state.squad.splice(idx, 1);
    CM.state.lineup = CM.state.lineup.filter(id => id !== playerId);

    // Update finances
    player.clubId = null; // Free agent temporarily
    CM.state.finances.transferBudget += offerAmount;
    CM.state.finances.balance += offerAmount;
    CM.state.finances.seasonRevenue += offerAmount;

    CM.state.transferHistory.push({
      type: 'sell', playerId, amount: offerAmount, week: CM.state.week
    });

    CM.addNotification('info', '💰 Oyuncu satıldı', `${player.firstName} ${player.lastName} ${CM.formatMoney(offerAmount)} karşılığında satıldı.`);
    CM.save();
    return { success: true };
  },

  generateTransferRumor() {
    const myClub = ChampionMasterData.clubs.find(c => c.id === CM.state.myClubId);
    const otherPlayers = ChampionMasterData.players
      .filter(p => p.clubId !== CM.state.myClubId && p.overall > 72)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    otherPlayers.forEach(p => {
      CM.addNotification('info', '📰 Transfer söylentisi',
        `${p.firstName} ${p.lastName} takımınıza ilgi duyuyor olabilir!`);
    });
  },

  // ---- Academy ----
  developAcademy() {
    CM.state.academy.forEach(playerId => {
      const player = ChampionMasterData.players.find(p => p.id === playerId);
      if (!player || player.age >= 20) return;

      const growthChance = (player.potential - player.overall) / 100;
      if (Math.random() < growthChance * 0.3) {
        player.overall = Math.min(player.potential, player.overall + 1);
        const stat = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'][Math.floor(Math.random() * 6)];
        if (player.stats[stat]) player.stats[stat] = Math.min(99, player.stats[stat] + 1);
      }
      player.age++;
    });
  },

  promoteFromAcademy(playerId) {
    const idx = CM.state.academy.indexOf(playerId);
    if (idx === -1) return;
    CM.state.academy.splice(idx, 1);
    CM.state.squad.push(playerId);
    const player = ChampionMasterData.players.find(p => p.id === playerId);
    if (player) {
      player.clubId = CM.state.myClubId;
      CM.addNotification('success', '🌟 Akademiden yükseldi!', `${player.firstName} ${player.lastName} A takıma çekildi!`);
    }
    CM.save();
  },

  // ---- Season end ----
  endSeason() {
    const { state } = CM;
    const table = state.leagueTable;
    const myPos = table.findIndex(r => r.clubId === state.myClubId) + 1;

    // Reputation change
    if (myPos === 1) { state.manager.reputation = Math.min(100, state.manager.reputation + 15); }
    else if (myPos <= 3) { state.manager.reputation = Math.min(100, state.manager.reputation + 7); }
    else if (myPos > table.length - 3) { state.manager.reputation = Math.max(0, state.manager.reputation - 10); }

    CM.addNotification(
      myPos === 1 ? 'success' : myPos <= 3 ? 'info' : 'warning',
      `🏆 Sezon ${state.season} Bitti!`,
      `${myPos}. sıradan sezonu tamamladınız. ${state.seasonStats.points} puan.`
    );

    // New season
    state.season++;
    state.week = 1;
    state.date = { day: 1, month: 8, year: 2025 + state.season - 1 };
    state.seasonStats = { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, cleanSheets: 0 };
    state.leagueTable = CM.generateLeagueTable(
      ChampionMasterData.clubs.find(c => c.id === state.myClubId)?.leagueId
    );
    state.fixtures = CM.generateFixtures(state.myClubId);

    // Develop academy
    CM.developAcademy();

    // Renew player contracts
    ChampionMasterData.players.forEach(p => {
      if (p.contractEnd <= 2025 + state.season - 1) {
        p.contractEnd = 2025 + state.season + Math.floor(Math.random() * 3);
      }
      // Age players
      p.age++;
      // Decay for old players
      if (p.age > 30) {
        const decay = Math.random() < 0.4 ? 1 : 0;
        p.overall = Math.max(40, p.overall - decay);
      }
    });

    CM.save();
  },

  // ---- Notifications ----
  addNotification(type, title, body) {
    CM.state.notifications.unshift({
      id: Date.now(),
      type, title, body,
      read: false,
      timestamp: new Date().toISOString()
    });
    if (CM.state.notifications.length > 50) {
      CM.state.notifications = CM.state.notifications.slice(0, 50);
    }
  },

  calcWeeklyWages() {
    const myPlayers = ChampionMasterData.players.filter(
      p => CM.state.squad.includes(p.id)
    );
    return myPlayers.reduce((s, p) => s + (p.wage || 20) * 1000, 0);
  },

  // ---- Utils ----
  getPlayer(id) { return ChampionMasterData.players.find(p => p.id === id); },
  getClub(id) { return ChampionMasterData.clubs.find(c => c.id === id); },
  getLeague(id) { return ChampionMasterData.leagues.find(l => l.id === id); },

  getMyClub() { return CM.getClub(CM.state?.myClubId); },
  getMyPlayers() {
    if (!CM.state) return [];
    return CM.state.squad.map(id => CM.getPlayer(id)).filter(Boolean);
  },
  getAcademyPlayers() {
    if (!CM.state) return [];
    return CM.state.academy.map(id => CM.getPlayer(id)).filter(Boolean);
  },

  getNextFixture() {
    if (!CM.state) return null;
    return CM.state.fixtures.find(f => !f.played);
  },

  getCardTier(overall) {
    if (overall >= 88) return 'gold';
    if (overall >= 75) return 'silver';
    if (overall >= 65) return 'bronze';
    return 'basic';
  },

  getPositionEmoji(pos) {
    const map = { GK: '🧤', CB: '🛡️', LB: '⬅️', RB: '➡️', CDM: '⚓', CM: '⚙️', CAM: '🎯', LW: '💨', RW: '🌪️', ST: '⚽', CF: '🔥' };
    return map[pos] || '👟';
  },

  getNationalityFlag(nationality) {
    const flags = {
      'Türk': '🇹🇷', 'İngiliz': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'İspanyol': '🇪🇸',
      'Alman': '🇩🇪', 'Fransız': '🇫🇷', 'Brezilyalı': '🇧🇷',
      'Arjantinli': '🇦🇷', 'Portekizli': '🇵🇹', 'İtalyan': '🇮🇹',
      'Hollandalı': '🇳🇱', 'Belçikalı': '🇧🇪', 'Senegalli': '🇸🇳',
      'Nijeryalı': '🇳🇬', 'Ganalı': '🇬🇭', 'Norveçli': '🇳🇴',
      'Danimarkalı': '🇩🇰', 'Polonyalı': '🇵🇱', 'Hırvat': '🇭🇷',
      'Uruguaylı': '🇺🇾', 'Kolombiyalı': '🇨🇴', 'Meksikalı': '🇲🇽',
      'Amerikalı': '🇺🇸', 'Japon': '🇯🇵', 'Koreli': '🇰🇷',
      'Avustralyalı': '🇦🇺', 'İsveçli': '🇸🇪', 'İskoç': '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
      'Galli': '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 'İrlandalı': '🇮🇪', 'Macar': '🇭🇺',
      'Çek': '🇨🇿', 'Sloven': '🇸🇮', 'Sırp': '🇷🇸', 'Romenyalı': '🇷🇴',
      'Rus': '🇷🇺', 'Ukraynalı': '🇺🇦', 'Faslı': '🇲🇦',
      'Mısırlı': '🇪🇬', 'Kamerunlu': '🇨🇲', 'İvorlu': '🇨🇮',
      'Güney Afrikalı': '🇿🇦', 'Tunuslu': '🇹🇳', 'Cezayirli': '🇩🇿'
    };
    return flags[nationality] || '🌍';
  },

  formatMoney(amount) {
    if (amount >= 1000000) return `€${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `€${(amount / 1000).toFixed(0)}K`;
    return `€${amount}`;
  },

  formatDate(state) {
    if (typeof state.date === 'string') {
      const parts = state.date.split('.');
      if (parts.length === 3) {
        state.date = { day: Number(parts[0]), month: Number(parts[1]), year: Number(parts[2]) };
      } else {
        return state.date;
      }
    }
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
                    'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${state.date.day} ${months[state.date.month - 1] || ''} ${state.date.year}`;
  },

  // ---- Save / Load ----
  save() {
    if (!CM.state) return;
    try {
      CM.state.savedAt = new Date().toISOString();
      const data = JSON.stringify(CM.state);
      // Anti-Cheat: Basit Obfuscation (Base64)
      const encoded = btoa(encodeURIComponent(data));
      localStorage.setItem('cm_save_1', encoded);
    } catch (e) {
      console.warn('Save failed:', e);
    }
  },

  load() {
    try {
      const encoded = localStorage.getItem('cm_save_1');
      if (!encoded) return null;
      // Anti-Cheat: Decode (Base64)
      const data = decodeURIComponent(atob(encoded));
      CM.state = JSON.parse(data);
      return CM.state;
    } catch (e) {
      console.warn('Load failed:', e);
      return null;
    }
  },

  hasSave() {
    return !!localStorage.getItem('cm_save_1');
  },

  deleteSave() {
    localStorage.removeItem('cm_save_1');
    CM.state = null;
  },

  exportSave() {
    const encoded = localStorage.getItem('cm_save_1');
    if (!encoded) return;
    const blob = new Blob([encoded], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `champion_master_save_${Date.now()}.cmx`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importSave(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const encoded = e.target.result;
          const data = decodeURIComponent(atob(encoded));
          const state = JSON.parse(data);
          CM.state = state;
          localStorage.setItem('cm_save_1', encoded);
          resolve(state);
        } catch (err) { reject(err); }
      };
      reader.readAsText(file);
    });
  },

  _getDB() { return localStorage; }
};
