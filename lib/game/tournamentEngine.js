import ChampionMasterData from './data.js';

export const TournamentEngine = {
  // Turnuvayı başlat: 72 takımın tamamını alır.
  // 1. Tur: En alt sıradaki 16 takım eşleşir (8 maç). Kalan 56 takım "Bay" geçer.
  // Sonraki Turlar: 64 -> 32 -> 16 -> 8 -> 4 -> 2 -> 1
  
  ROUND_NAMES: {
    1: '1. Tur (Ön Eleme)',
    2: '2. Tur (Son 64)',
    3: '3. Tur (Son 32)',
    4: '4. Tur (Son 16)',
    5: 'Çeyrek Final',
    6: 'Yarı Final',
    7: 'Final'
  },

  CUP_WEEKS: {
    1: 4,  // 1. Tur 4. haftada
    2: 8,  // 2. Tur 8. haftada
    3: 12, // 3. Tur 12. haftada
    4: 16, // 4. Tur 16. haftada
    5: 20, // Çeyrek Final 20. haftada
    6: 24, // Yarı Final 24. haftada
    7: 28  // Final 28. haftada
  },

  initCup: (clubs) => {
    // Tüm kulüpleri liglerine göre prestij sıralamasına diz (Güçlüler bay geçecek)
    const sortedClubs = [...clubs].sort((a, b) => b.prestige - a.prestige);
    
    // En düşük 16 takımı 1. Tur için seç
    const round1Teams = sortedClubs.slice(-16).map(c => c.id);
    const byeTeams = sortedClubs.slice(0, 56).map(c => c.id);

    return {
      currentRound: 1,
      activeTeams: round1Teams, // Bu turda oynayacaklar
      byeTeams: byeTeams,       // Bu turu maç yapmadan geçecekler
      matches: TournamentEngine.drawMatches(round1Teams),
      history: {}, // Geçmiş turların sonuçları
      winner: null
    };
  },

  drawMatches: (teamIds) => {
    const matches = [];
    // Rastgele eşleşme için karıştır
    const shuffled = [...teamIds].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffled.length; i += 2) {
      matches.push({
        id: `cup_${Date.now()}_${i}`,
        homeClubId: shuffled[i],
        awayClubId: shuffled[i + 1],
        played: false,
        score: { home: 0, away: 0 },
        winnerId: null
      });
    }
    return matches;
  },

  generateNextRound: (cupState) => {
    // Oynanan maçlardan kazananları topla
    const winners = cupState.matches.filter(m => m.played && m.winnerId).map(m => m.winnerId);
    
    // Bay geçen takımları da kazananlara ekle
    const nextRoundTeams = [...winners, ...(cupState.byeTeams || [])];

    if (nextRoundTeams.length === 1) {
      // Turnuva bitti
      return {
        ...cupState,
        matches: [],
        winner: nextRoundTeams[0]
      };
    }

    const nextRound = cupState.currentRound + 1;

    return {
      ...cupState,
      currentRound: nextRound,
      history: {
        ...cupState.history,
        [cupState.currentRound]: cupState.matches
      },
      activeTeams: nextRoundTeams,
      byeTeams: [], // Sadece 1. turda bay var
      matches: TournamentEngine.drawMatches(nextRoundTeams)
    };
  }
};
