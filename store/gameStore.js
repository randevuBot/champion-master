import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import ChampionMasterData from '@/lib/game/data';
import { GameEngine } from '@/lib/game/engine';
import { MatchEngine } from '@/lib/game/match';

// Natively obfuscate data without external dependencies (Prevents DevTools editing)
function obfuscate(str) {
  return btoa(encodeURIComponent(str));
}

function deobfuscate(str) {
  return decodeURIComponent(atob(str));
}

const secureStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null;
    try {
      const str = window.localStorage.getItem(name);
      if (!str) return null;
      if (str.startsWith('{') || str.startsWith('[')) {
        return str; // Eski şifrelenmemiş (plain JSON) veriye destek
      }
      return deobfuscate(str);
    } catch (e) {
      console.error("Save file decryption failed", e);
      return null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, obfuscate(value));
    } catch (e) {
      console.error("Save file encryption failed", e);
    }
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch (e) {}
  },
};

const today = new Date();

const defaultState = {
  version: '1.0.0',
  myClubId: null,
  manager: { name: 'Mert', reputation: 50 },
  season: 1,
  week: 1,
  date: { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() },
  daysPassed: 0,
  finances: {
    balance: 0,
    transferBudget: 0,
    wageBudget: 0,
    weeklyWages: 0,
    seasonRevenue: 0,
    seasonExpenses: 0,
    history: []
  },
  squad: [],
  injured: [],
  suspensions: [],
  formation: '4-3-3',
  tactics: { style: 'balanced', press: 'medium', tempo: 'normal' },
  lineup: [],
  customPositions: {},
  seasonStats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, cleanSheets: 0 },
  leagueTable: [],
  fixtures: [],
  transferHistory: [],
  news: [],
  playerStats: {},
  morale: 70,
  isPlaying: false
};

export const useGameStore = create(
  persist(
    (set, get) => ({
      ...defaultState,
      
      setPlaying: (playing) => set({ isPlaying: playing }),

      initGame: (clubId, managerName = 'Mert') => {
        const club = ChampionMasterData.clubs.find(c => c.id === clubId);
        if (!club) return;
        
        const clubPlayers = ChampionMasterData.players.filter(p => p.clubId === clubId);
        const squad = clubPlayers.map(p => p.id);
        const lineup = GameEngine.autoSelectLineup(clubPlayers, '4-3-3');
        
        const playerStats = {};
        clubPlayers.forEach(p => {
          playerStats[p.id] = { goals: 0, assists: 0, appearances: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, rating: p.overall };
        });

        const fixtures = GameEngine.generateFixtures(clubId);
        const leagueTable = GameEngine.generateLeagueTable(club.leagueId);
        
        set({
          ...defaultState,
          myClubId: clubId,
          manager: { name: managerName, reputation: 50 },
          finances: {
            ...defaultState.finances,
            balance: club.budget * 1000000,
            transferBudget: Math.round(club.budget * 0.4) * 1000000,
            wageBudget: Math.round(club.budget * 0.1) * 1000000,
          },
          squad,
          lineup,
          playerStats,
          fixtures,
          leagueTable,
          date: { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() },
          daysPassed: 0,
          isPlaying: true
        });
      },
      
      setFormation: (formation) => {
        const { squad } = get();
        const clubPlayers = ChampionMasterData.players.filter(p => squad.includes(p.id));
        const lineup = GameEngine.autoSelectLineup(clubPlayers, formation);
        set({ formation, lineup, customPositions: {} });
      },

      setCustomPositions: (positions) => set({ customPositions: positions }),

      setLineup: (lineup) => set({ lineup }),

      buyPlayer: (playerId, offerAmount) => {
        const state = get();
        const player = ChampionMasterData.players.find(p => p.id === playerId);
        if (!player) return { success: false, reason: 'Oyuncu bulunamadı.' };
        if (state.squad.includes(playerId)) return { success: false, reason: 'Zaten kadronuzda.' };

        const budget = state.finances.transferBudget;
        const value = player.value * 1000000;

        if (offerAmount < value * 0.8) return { success: false, reason: 'Teklif çok düşük.' };
        if (offerAmount > budget) return { success: false, reason: 'Yetersiz transfer bütçesi.' };

        // Acceptance probability
        const acceptChance = offerAmount >= value ? 0.9 : 0.5 + (offerAmount - value * 0.8) / (value * 0.4);
        if (Math.random() > acceptChance) return { success: false, reason: 'Kulüp teklifi reddetti.' };

        set((s) => ({
          squad: [...s.squad, playerId],
          finances: {
            ...s.finances,
            transferBudget: s.finances.transferBudget - offerAmount,
            balance: s.finances.balance - offerAmount,
            seasonExpenses: s.finances.seasonExpenses + offerAmount
          },
          transferHistory: [
            ...s.transferHistory,
            { type: 'buy', playerId, amount: offerAmount, week: s.week }
          ],
          playerStats: {
            ...s.playerStats,
            [playerId]: { goals: 0, assists: 0, appearances: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, rating: player.overall }
          }
        }));

        get().addNews({ title: 'Transfer Başarılı', body: `${player.firstName} ${player.lastName} takıma katıldı!`, type: 'success' });
        return { success: true };
      },

      sellPlayer: (playerId, offerAmount) => {
        const state = get();
        const player = ChampionMasterData.players.find(p => p.id === playerId);
        if (!state.squad.includes(playerId)) return { success: false, reason: 'Oyuncu kadronuzda değil.' };

        set((s) => ({
          squad: s.squad.filter(id => id !== playerId),
          lineup: s.lineup.filter(id => id !== playerId),
          finances: {
            ...s.finances,
            transferBudget: s.finances.transferBudget + offerAmount,
            balance: s.finances.balance + offerAmount,
            seasonRevenue: s.finances.seasonRevenue + offerAmount
          },
          transferHistory: [
            ...s.transferHistory,
            { type: 'sell', playerId, amount: offerAmount, week: s.week }
          ]
        }));

        get().addNews({ title: 'Oyuncu Satıldı', body: `${player.firstName} ${player.lastName} takımdan ayrıldı.`, type: 'info' });
        return { success: true };
      },
      
      processMatchResult: (result, isMyMatch = true) => {
        set((state) => {
          const { home, away, score } = result;
          
          // Update League Table
          const updatedTable = state.leagueTable.map(row => {
            if (row.clubId === home.id) {
              const won = score.home > score.away ? 1 : 0;
              const drawn = score.home === score.away ? 1 : 0;
              const lost = score.home < score.away ? 1 : 0;
              return {
                ...row,
                played: row.played + 1,
                won: row.won + won,
                drawn: row.drawn + drawn,
                lost: row.lost + lost,
                gf: row.gf + score.home,
                ga: row.ga + score.away,
                gd: row.gd + (score.home - score.away),
                points: row.points + (won * 3) + drawn
              };
            }
            if (row.clubId === away.id) {
              const won = score.away > score.home ? 1 : 0;
              const drawn = score.away === score.home ? 1 : 0;
              const lost = score.away < score.home ? 1 : 0;
              return {
                ...row,
                played: row.played + 1,
                won: row.won + won,
                drawn: row.drawn + drawn,
                lost: row.lost + lost,
                gf: row.gf + score.away,
                ga: row.ga + score.home,
                gd: row.gd + (score.away - score.home),
                points: row.points + (won * 3) + drawn
              };
            }
            return row;
          });

          // Sort table
          updatedTable.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

          // Update Fixture
          const updatedFixtures = state.fixtures.map(f => {
            if (f.week === state.week && f.homeClubId === home.id && f.awayClubId === away.id) {
              return { ...f, played: true, result: score };
            }
            return f;
          });

          return { leagueTable: updatedTable, fixtures: updatedFixtures };
        });
      },
      
      advanceWeek: () => {
        const state = get();
        const currentWeekFixtures = state.fixtures.filter(f => f.week === state.week && !f.played);
        
        // Simulate remaining CPU matches realistically using MatchEngine
        currentWeekFixtures.forEach(fix => {
          if (fix.homeClubId === state.myClubId || fix.awayClubId === state.myClubId) return; // Kullanıcının maçı ayrı oynanır
          
          const homeClub = ChampionMasterData.clubs.find(c => c.id === fix.homeClubId);
          const awayClub = ChampionMasterData.clubs.find(c => c.id === fix.awayClubId);
          
          if (homeClub && awayClub) {
            const homePlayers = ChampionMasterData.players.filter(p => p.clubId === homeClub.id);
            const awayPlayers = ChampionMasterData.players.filter(p => p.clubId === awayClub.id);
            
            // CPU takımları için en iyi 11'leri otomatik seç
            const homeLineupIds = GameEngine.autoSelectLineup(homePlayers, '4-3-3');
            const awayLineupIds = GameEngine.autoSelectLineup(awayPlayers, '4-3-3');
            
            const homeSquad = homePlayers.filter(p => homeLineupIds.includes(p.id));
            const awaySquad = awayPlayers.filter(p => awayLineupIds.includes(p.id));
            
            // Maçı anında simüle et
            const me = new MatchEngine(homeClub, awayClub, homeSquad, awaySquad);
            me.speed = 3; // 3 = Instant simulation
            me.simulate(
              () => {}, // CPU maçlarında spiker event'lerine gerek yok
              (result) => {
                get().processMatchResult(result, false);
              }
            );
          }
        });

        // Weekly events
        set((s) => ({ week: s.week + 1 }));
        get().addNews({ title: 'Yeni Hafta', body: `${state.week + 1}. haftaya girildi.`, type: 'info' });

        // YZ Haber / Dedikodu Çekimi (Asenkron - Arayüzü bloklamaz)
        const myClub = ChampionMasterData.clubs.find(c => c.id === state.myClubId);
        if (myClub && state.squad && state.squad.length > 0) {
          fetch('/api/generate-news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clubName: myClub.name,
              week: state.week + 1,
              players: state.squad
            })
          }).then(r => r.json()).then(data => {
            if (data && data.title && data.body) {
              get().addNews({ title: '🔥 ' + data.title, body: data.body, type: data.type || 'warning' });
            }
          }).catch(err => console.error("YZ Haber Hatası:", err));
        }
      },

      advanceTime: () => {
        const state = get();
        const d = new Date(state.date.year, state.date.month - 1, state.date.day);
        d.setDate(d.getDate() + 1);
        const newDate = { day: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear() };
        
        let newDaysPassed = (state.daysPassed || 0) + 1;
        set({ date: newDate, daysPassed: newDaysPassed });
        
        // Her 7 günde bir hafta atlar
        if (newDaysPassed % 7 === 0) {
          get().advanceWeek();
        }
      },
      
      updateBalance: (amount) => set((state) => ({
        finances: { ...state.finances, balance: state.finances.balance + amount }
      })),
      
      addNews: (newsItem) => set((state) => ({ 
        news: [{ ...newsItem, id: Date.now(), week: state.week }, ...state.news] 
      })),
      
      resetGame: () => set(defaultState),
    }),
    {
      name: 'champion-master-save',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => {
        const { isPlaying, ...rest } = state;
        return rest;
      }
    }
  )
);
