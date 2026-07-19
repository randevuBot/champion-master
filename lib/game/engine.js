import ChampionMasterData from './data';

export const GameEngine = {
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

  autoSelectLineup(players, formation, unavailableIds = [], style = 'balanced') {
    const slots = this.getFormationSlots(formation);
    const lineup = Array(11).fill(null);
    const used = new Set();

    const getBand = (slot) => {
      if (slot === 'GK') return 'GK';
      if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(slot)) return 'DEF';
      if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(slot)) return 'MID';
      return 'ATT';
    };

    const getPlayerScore = (p, slot) => {
      const band = getBand(slot);
      let score = p.overall; // Temel puan
      
      // Taktiksel ek puanlar
      if (style === 'counter') {
        if (band === 'ATT' || band === 'MID') score += (p.pac * 0.5 + p.sho * 0.2);
        if (band === 'DEF') score += (p.def * 0.5 + p.pac * 0.3);
      } else if (style === 'park') {
        if (band === 'DEF' || band === 'MID') score += (p.def * 0.6 + p.phy * 0.4);
      } else if (style === 'press') {
        score += (p.phy * 0.5 + p.pac * 0.5); // Herkes koşabilmeli ve güçlü olmalı
      } else if (style === 'possession') {
        score += (p.pas * 0.6 + p.dri * 0.4); // Pas ve dribbling yeteneği
      } else if (style === 'longball') {
        if (band === 'DEF') score += (p.pas * 0.5 + p.phy * 0.2);
        if (band === 'ATT') score += (p.phy * 0.5 + p.pac * 0.3); // Hedef santraforlar ve koşan kanatlar
      }
      return score;
    };

    // Helper for finding best player
    const findAndAssign = (idx, condition) => {
      if (lineup[idx]) return;
      const targetSlot = slots[idx];
      const candidates = players.filter(p => !used.has(p.id) && !unavailableIds.includes(p.id) && condition(p))
        .sort((a, b) => getPlayerScore(b, targetSlot) - getPlayerScore(a, targetSlot));
      
      if (candidates.length > 0) {
        lineup[idx] = candidates[0].id;
        used.add(candidates[0].id);
      }
    };

    // 1. Pass: Exact Match
    slots.forEach((pos, idx) => findAndAssign(idx, p => p.position === pos));

    // 1.5. Pass: Alternate Position Match (Yeni eklenen 2. ve 3. mevkiler)
    slots.forEach((pos, idx) => {
      findAndAssign(idx, p => p.alternatePositions && p.alternatePositions.includes(pos));
    });

    // 2. Pass: Related Position AND Same Band (no penalty)
    slots.forEach((pos, idx) => {
      const related = this.getRelatedPositions(pos);
      const band = getBand(pos);
      findAndAssign(idx, p => related.includes(p.position) && getBand(p.position) === band);
    });

    // 3. Pass: Same Band (Any player in the same area, no penalty)
    slots.forEach((pos, idx) => {
      const band = getBand(pos);
      findAndAssign(idx, p => getBand(p.position) === band);
    });

    // 4. Pass: Related Position (Cross-band)
    slots.forEach((pos, idx) => {
      const related = this.getRelatedPositions(pos);
      findAndAssign(idx, p => related.includes(p.position));
    });

    // 5. Pass: Absolute Fallback (Highest Score available)
    slots.forEach((pos, idx) => findAndAssign(idx, () => true));

    return lineup.filter(id => id !== null);
  },

  generateFixtures(leagueId) {
    const clubs = ChampionMasterData.clubs.filter(c => c.leagueId === leagueId);
    if (clubs.length < 2) return [];

    const fixtures = [];
    const numTeams = clubs.length;
    const numWeeks = numTeams - 1;

    // Takımları eşleştirme için array
    const teamIds = clubs.map(c => c.id);
    if (numTeams % 2 !== 0) teamIds.push(null); // Bay geçme (odd teams)

    const half = teamIds.length / 2;

    for (let week = 0; week < numWeeks; week++) {
      for (let i = 0; i < half; i++) {
        const home = teamIds[i];
        const away = teamIds[teamIds.length - 1 - i];

        if (home !== null && away !== null) {
          // İlk yarı (Home vs Away)
          fixtures.push({
            id: `fix_${leagueId}_w${week+1}_${home}_${away}`,
            week: week + 1,
            competition: 'league',
            homeClubId: home,
            awayClubId: away,
            played: false,
            result: null
          });
          
          // İkinci yarı (Away vs Home)
          fixtures.push({
            id: `fix_${leagueId}_w${week + 1 + numWeeks}_${away}_${home}`,
            week: week + 1 + numWeeks,
            competition: 'league',
            homeClubId: away,
            awayClubId: home,
            played: false,
            result: null
          });
        }
      }

      // Round-robin kaydırması
      const last = teamIds.pop();
      teamIds.splice(1, 0, last);
    }

    return fixtures.sort((a, b) => a.week - b.week);
  },

  generateFixturesDynamic(leagueId, clubLeagues) {
    const clubs = ChampionMasterData.clubs.filter(c => clubLeagues[c.id] === leagueId);
    if (clubs.length < 2) return [];

    const fixtures = [];
    const numTeams = clubs.length;
    const numWeeks = numTeams - 1;

    const teamIds = clubs.map(c => c.id);
    if (numTeams % 2 !== 0) teamIds.push(null);

    const half = teamIds.length / 2;

    for (let week = 0; week < numWeeks; week++) {
      for (let i = 0; i < half; i++) {
        const home = teamIds[i];
        const away = teamIds[teamIds.length - 1 - i];

        if (home !== null && away !== null) {
          fixtures.push({
            id: `fix_${leagueId}_w${week+1}_${home}_${away}`,
            week: week + 1,
            competition: 'league',
            homeClubId: home,
            awayClubId: away,
            played: false,
            result: null
          });
          fixtures.push({
            id: `fix_${leagueId}_w${week + 1 + numWeeks}_${away}_${home}`,
            week: week + 1 + numWeeks,
            competition: 'league',
            homeClubId: away,
            awayClubId: home,
            played: false,
            result: null
          });
        }
      }

      const last = teamIds.pop();
      teamIds.splice(1, 0, last);
    }

    return fixtures.sort((a, b) => a.week - b.week);
  },

  generateLeagueTable(leagueId) {
    const clubs = ChampionMasterData.clubs.filter(c => c.leagueId === leagueId);
    return clubs.map(c => ({
      clubId: c.id,
      played: 0, won: 0, drawn: 0, lost: 0,
      gf: 0, ga: 0, gd: 0, points: 0,
      form: []
    })).sort(() => Math.random() - 0.5);
  }
};
