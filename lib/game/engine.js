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

  autoSelectLineup(players, formation, unavailableIds = []) {
    const slots = this.getFormationSlots(formation);
    const lineup = Array(11).fill(null);
    const used = new Set();

    const getBand = (slot) => {
      if (slot === 'GK') return 'GK';
      if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(slot)) return 'DEF';
      if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(slot)) return 'MID';
      return 'ATT';
    };

    // Helper for finding best player
    const findAndAssign = (idx, condition) => {
      if (lineup[idx]) return;
      const candidates = players.filter(p => !used.has(p.id) && !unavailableIds.includes(p.id) && condition(p)).sort((a, b) => b.overall - a.overall);
      if (candidates.length > 0) {
        lineup[idx] = candidates[0].id;
        used.add(candidates[0].id);
      }
    };

    // 1. Pass: Exact Match
    slots.forEach((pos, idx) => findAndAssign(idx, p => p.position === pos));

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

    // 4. Pass: Related Position (Cross-band, will incur penalty but is realistic)
    slots.forEach((pos, idx) => {
      const related = this.getRelatedPositions(pos);
      findAndAssign(idx, p => related.includes(p.position));
    });

    // 5. Pass: Absolute Fallback (Highest Overall available)
    slots.forEach((pos, idx) => findAndAssign(idx, () => true));

    return lineup.filter(id => id !== null);
  },

  generateFixtures(myClubId) {
    const myClub = ChampionMasterData.clubs.find(c => c.id === myClubId);
    if (!myClub) return [];
    const leagueClubs = ChampionMasterData.clubs.filter(c => c.leagueId === myClub.leagueId);
    const opponents = leagueClubs.filter(c => c.id !== myClubId);

    const fixtures = [];
    let week = 1;

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

    [3, 8, 15, 22, 29].forEach((cupWeek, i) => {
      if (opponents.length === 0) return;
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
