import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { getActiveUser } from '@/lib/auth';
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

let activeSlotId = 1;

export const setActiveSlot = (slot) => {
  activeSlotId = slot;
};

export const getActiveSlot = () => activeSlotId;

const getStorageKey = async (name, slotId = activeSlotId) => {
  const user = await getActiveUser();
  const userSuffix = user ? `-${user.id}` : '';
  return `${name}-slot-${slotId}${userSuffix}`;
};

export const getSlotSummaries = async () => {
  const summaries = [];
  for (let i = 1; i <= 3; i++) {
    const key = await getStorageKey('champion-master-save', i);
    let str = await idbGet(key);
    
    // Migration check for slot 1
    if (!str && i === 1) {
      str = await idbGet('champion-master-save-slot-1'); // Eski slot 1
      if (!str) str = await idbGet('champion-master-save'); // Daha eski düz kayıt
      if (!str && typeof window !== 'undefined') {
        str = window.localStorage.getItem('champion-master-save'); // En eski localStorage
      }
    }

    if (str) {
      try {
        const parsed = JSON.parse(str.startsWith('{') || str.startsWith('[') ? str : deobfuscate(str));
        const state = parsed.state || {};
        if (state.myClubId) {
          summaries.push({
            slot: i,
            clubId: state.myClubId,
            managerName: state.manager?.name || "Menajer",
            season: state.season || 1,
            week: state.week || 1,
            isEmpty: false,
            balance: state.finances?.balance || 0
          });
        } else {
          summaries.push({ slot: i, isEmpty: true });
        }
      } catch (e) {
        summaries.push({ slot: i, isEmpty: true });
      }
    } else {
      summaries.push({ slot: i, isEmpty: true });
    }
  }
  return summaries;
};

const secureStorage = {
  getItem: async (name) => {
    if (typeof window === 'undefined') return null;
    const key = await getStorageKey(name);
    try {
      let str = await idbGet(key);
      
      // Fallback migration for Slot 1
      if (!str && activeSlotId === 1) {
        let oldStr = await idbGet('champion-master-save-slot-1');
        if (!oldStr) oldStr = await idbGet(name);
        if (!oldStr) oldStr = window.localStorage.getItem(name);
        
        if (oldStr) {
          str = oldStr;
          await idbSet(key, oldStr);
          // Çakışmayı önlemek için eski veriyi sil ki yeni kayıt açanlar bunu miras almasın
          await idbDel('champion-master-save-slot-1');
          await idbDel(name);
          window.localStorage.removeItem(name);
        }
      }

      if (!str) return null;
      if (str.startsWith('{') || str.startsWith('[')) {
        return str;
      }
      return deobfuscate(str);
    } catch (e) {
      console.error("Save file decryption failed", e);
      return null;
    }
  },
  setItem: async (name, value) => {
    if (typeof window === 'undefined') return;
    try {
      const key = await getStorageKey(name);
      await idbSet(key, obfuscate(value));
    } catch (e) {
      console.error("Save file encryption failed", e);
    }
  },
  removeItem: async (name) => {
    if (typeof window === 'undefined') return;
    try {
      const key = await getStorageKey(name);
      await idbDel(key);
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
    history: [],
    sponsors: {
      shirt: null,
      stadium: null,
      offers: []
    },
    facilities: {
      stadium: 1,
      training: 1,
      youth: 1,
      store: 1
    },
    lastEventWeek: 0,
    cfoHired: false
  },
  squad: [],
  injured: [],
  suspensions: [],
  formation: '4-3-3',
  tactics: { style: 'balanced', press: 'medium', tempo: 'normal' },
  lineup: [],
  squadFitness: {},
  customPositions: {},
  seasonStats: { played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 0, cleanSheets: 0 },
  leagueTable: [],
  fixtures: [],
  transferHistory: [],
  scoutedPlayers: [],
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
        const squadFitness = {};
        clubPlayers.forEach(p => {
          playerStats[p.id] = { goals: 0, assists: 0, appearances: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, rating: p.overall };
          squadFitness[p.id] = 100;
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
          squadFitness,
          playerStats,
          fixtures,
          leagueTable,
          date: { day: today.getDate(), month: today.getMonth() + 1, year: today.getFullYear() },
          daysPassed: 0,
          isPlaying: true
        });
      },
      
      setFormation: (formation) => {
        const { squad, injured, suspensions } = get();
        const clubPlayers = ChampionMasterData.players.filter(p => squad.includes(p.id));
        const unavailableIds = [...injured.map(i => i.playerId), ...suspensions.map(s => s.playerId)];
        const lineup = GameEngine.autoSelectLineup(clubPlayers, formation, unavailableIds);
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
          squadFitness: { ...s.squadFitness, [playerId]: 100 },
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

      scoutPlayer: (playerId, cost = 25000) => {
        const state = get();
        if (state.scoutedPlayers.includes(playerId)) return { success: false, reason: 'Zaten gözlemlendi.' };
        if (state.finances.balance < cost) return { success: false, reason: 'Yetersiz bütçe.' };

        const player = ChampionMasterData.players.find(p => p.id === playerId);
        if (!player) return { success: false, reason: 'Oyuncu bulunamadı.' };

        set((s) => ({
          scoutedPlayers: [...s.scoutedPlayers, playerId],
          finances: {
            ...s.finances,
            balance: s.finances.balance - cost,
            seasonExpenses: s.finances.seasonExpenses + cost
          }
        }));
        
        // Yapay Zeka Destekli Scout Raporunu Asenkron Olarak İste
        fetch('/api/generate-scout-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerName: `${player.firstName} ${player.lastName}`,
            age: player.age + (state.season - 1),
            position: player.position,
            overall: player.overall, // Veya state.playerStats[playerId]?.rating || player.overall
            potential: player.potential,
            value: player.value
          })
        }).then(r => r.json()).then(data => {
          if (data && data.subject) {
            get().addNews(data);
          } else {
            get().addNews({ title: 'Gözlem Raporu', body: `${player.lastName} için gözlem tamamlandı.`, type: 'info' });
          }
        }).catch(err => {
          console.error("AI Scout Error:", err);
          get().addNews({ title: 'Gözlem Raporu', body: `${player.lastName} için gözlem tamamlandı. (Sistem hatası)`, type: 'info' });
        });

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

          // Process Injuries & Red Cards
          let newInjured = [...state.injured];
          let newSuspensions = [...state.suspensions];
          
          if (result.events && result.events.length > 0) {
            result.events.forEach(e => {
              if (e.type === 'injury' && e.playerId) {
                 const weeks = (e.extraData && e.extraData.weeks) ? e.extraData.weeks : 2;
                 const existing = newInjured.find(i => i.playerId === e.playerId);
                 if (existing) existing.weeks += weeks;
                 else newInjured.push({ playerId: e.playerId, weeks });
              }
              if (e.type === 'red_card' && e.playerId) {
                 const existing = newSuspensions.find(s => s.playerId === e.playerId);
                 if (existing) existing.weeks += 1;
                 else newSuspensions.push({ playerId: e.playerId, weeks: 1 });
              }
            });
          }

          // Gerçekçi yorgunluk ataması (Görev 3 & Mevkiye göre)
          const newFitness = { ...state.squadFitness };
          let newMorale = state.morale || 70;

          if (isMyMatch) {
            const isHome = result.homeClubId === state.myClubId;
            const mySquad = isHome ? result.homeSquad : result.awaySquad;
            
            if (mySquad) {
              mySquad.forEach(p => {
                newFitness[p.id] = Math.round(p.matchFitness);
              });
            } else {
              // Fallback
              state.lineup.forEach(id => {
                newFitness[id] = Math.max(10, (newFitness[id] || 100) - 30);
              });
            }

            // Görev 4: Maç sonucunun morale etkisi
            const myGoals = isHome ? result.score.home : result.score.away;
            const oppGoals = isHome ? result.score.away : result.score.home;
            
            if (myGoals > oppGoals) {
              newMorale = Math.min(100, newMorale + 5); // Galibiyet: +5 Moral
            } else if (myGoals < oppGoals) {
              newMorale = Math.max(0, newMorale - 8); // Mağlubiyet: -8 Moral
            } else {
              newMorale = Math.max(0, newMorale - 2); // Beraberlik: -2 Moral
            }
          }

          return { 
            leagueTable: updatedTable, 
            fixtures: updatedFixtures,
            injured: newInjured,
            suspensions: newSuspensions,
            squadFitness: newFitness,
            morale: newMorale
          };
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
            
            // CPU takımları için en iyi 11'leri otomatik seç (Sakat ve Cezalılar Hariç)
            const unavailableIds = [...state.injured.map(i => i.playerId), ...state.suspensions.map(s => s.playerId)];
            const homeLineupIds = GameEngine.autoSelectLineup(homePlayers, '4-3-3', unavailableIds);
            const awayLineupIds = GameEngine.autoSelectLineup(awayPlayers, '4-3-3', unavailableIds);
            
            const homeSquad = homePlayers.filter(p => homeLineupIds.includes(p.id)).map(p => ({
              ...p,
              fitness: false ? (state.squadFitness[p.id] || 100) : (80 + Math.random() * 20),
              morale: false ? state.morale : (65 + Math.random() * 25)
            }));
            
            const awaySquad = awayPlayers.filter(p => awayLineupIds.includes(p.id)).map(p => ({
              ...p,
              fitness: false ? (state.squadFitness[p.id] || 100) : (80 + Math.random() * 20),
              morale: false ? state.morale : (65 + Math.random() * 25)
            }));
            
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
        const newInjured = state.injured.map(i => ({ ...i, weeks: i.weeks - 1 })).filter(i => i.weeks > 0);
        const newSuspensions = state.suspensions.map(s => ({ ...s, weeks: s.weeks - 1 })).filter(s => s.weeks > 0);

        // Fitness Recovery & Wage Deduction
        const myPlayers = ChampionMasterData.players.filter(p => state.squad.includes(p.id));
        const totalWage = myPlayers.reduce((sum, p) => sum + ((p.wage || 10) * 1000), 0);
        
        const newFitness = { ...state.squadFitness };
        Object.keys(newFitness).forEach(id => {
          newFitness[id] = Math.min(100, (newFitness[id] || 100) + 30);
        });

        // Tesis ve Sponsor Gelirleri Hesaplama
        const storeIncome = 50000 * (state.finances?.facilities?.store || 1);
        const shirtSponsor = state.finances?.sponsors?.shirt;
        const stadiumSponsor = state.finances?.sponsors?.stadium;
        
        let sponsorIncome = 0;
        let newShirtSponsor = shirtSponsor;
        let newStadiumSponsor = stadiumSponsor;

        if (shirtSponsor) {
          sponsorIncome += shirtSponsor.valuePerWeek;
          newShirtSponsor = { ...shirtSponsor, duration: shirtSponsor.duration - 1 };
          if (newShirtSponsor.duration <= 0) newShirtSponsor = null;
        }
        if (stadiumSponsor) {
          sponsorIncome += stadiumSponsor.valuePerWeek;
          newStadiumSponsor = { ...stadiumSponsor, duration: stadiumSponsor.duration - 1 };
          if (newStadiumSponsor.duration <= 0) newStadiumSponsor = null;
        }

        const tvRights = 1000000; // Haftalık TV geliri
        const totalIncome = storeIncome + sponsorIncome + tvRights;

        // Bilet geliri (eğer bu hafta evimizde oynadıysak)
        // (Bunu match bitiminde eklemek daha doğru ama şimdilik burada kalsın veya match resultta eklensin.
        // Basitlik adına burada sabit ev sahibi tahmini eklemiyoruz, match resultta ekleyeceğiz).

        const newFinances = {
          ...state.finances,
          balance: state.finances.balance - totalWage + totalIncome,
          seasonExpenses: state.finances.seasonExpenses + totalWage,
          seasonRevenue: state.finances.seasonRevenue + totalIncome,
          sponsors: {
            ...state.finances.sponsors,
            shirt: newShirtSponsor,
            stadium: newStadiumSponsor,
            offers: state.finances.sponsors?.offers || []
          },
          history: [
            { type: 'income', amount: totalIncome, reason: 'Haftalık Gelirler (Sponsor, TV, Mağaza)', week: state.week },
            { type: 'expense', amount: totalWage, reason: 'Maaş Ödemeleri', week: state.week },
            ...state.finances.history
          ]
        };

        set((s) => ({ 
          week: s.week + 1,
          injured: newInjured,
          suspensions: newSuspensions,
          squadFitness: newFitness,
          finances: newFinances
        }));

        if (Math.random() > 0.7) {
          get().generateSponsorOffers();
        }

        const myClub = ChampionMasterData.clubs.find(c => c.id === state.myClubId);

        // Eğer CFO (Yapay Zeka) aktifse arkaplanda hamlesini yapsın
        if (state.finances?.cfoHired && myClub) {
          fetch('/api/cfo-action', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ balance: state.finances.balance, clubName: myClub.name })
          })
            .then(res => res.json())
            .then(data => {
              if (data && data.title) {
                get().applyCfoAction(data);
              }
            })
            .catch(() => {});
        }

        get().addNews({ title: 'Yeni Hafta', body: `${state.week + 1}. haftaya girildi.`, type: 'info' });

        // YZ Haber / Dedikodu Çekimi (Asenkron - Arayüzü bloklamaz)
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

        // Transfer Teklifi (Haftalık %40 ihtimal)
        if (Math.random() > 0.6) {
          get().generateTransferOffers();
        }

        // Oyuncu Gelişimi, Yaşlanma ve Emeklilik (Her 4 haftada bir raporlanır)
        if (state.week % 4 === 0 && myPlayers.length > 0) {
           let reportPlayer = null;
           let reportType = "";
           let oldRating = 0;
           let newRating = 0;
           
           const newPlayerStats = { ...state.playerStats };
           const newSquad = [...state.squad];
           
           myPlayers.forEach(p => {
              const pStats = newPlayerStats[p.id];
              if (!pStats) return;
              
              const age = p.age + state.season - 1;
              
              // Emeklilik Kontrolü (34 yaş üstü her ay %5 ihtimalle emekli olabilir)
              if (age >= 34 && Math.random() < 0.05) {
                 // Emekli et
                 const index = newSquad.indexOf(p.id);
                 if (index > -1) newSquad.splice(index, 1);
                 
                 // Emeklilik Haberi (AI Veda Mektubu)
                 fetch('/api/generate-player-report', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ playerName: `${p.firstName} ${p.lastName}`, age, type: 'retirement' })
                 }).then(r => r.json()).then(data => {
                   if (data && data.subject) get().addNews(data);
                 }).catch(() => {});
                 
                 return; // Bu oyuncu için gelişimi atla
              }
              
              let ratingChange = 0;
              
              if (age <= 23) {
                 if (Math.random() > 0.6) ratingChange = 1; // Genç oyuncu gelişimi
              } else if (age >= 32) {
                 if (Math.random() > 0.7) ratingChange = -1; // Yaşlı oyuncu düşüşü
              }
              
              if (ratingChange !== 0) {
                 const prev = pStats.rating || p.overall;
                 const next = Math.min(99, Math.max(40, prev + ratingChange));
                 if (prev !== next) {
                    pStats.rating = next;
                    // Sadece bir oyuncu için AI Raporu oluştur (Inbox dolmasın)
                    if (!reportPlayer) {
                       reportPlayer = p;
                       oldRating = prev;
                       newRating = next;
                       reportType = ratingChange > 0 ? 'progression' : 'regression';
                    }
                 }
              }
           });
           
           if (reportPlayer) {
              fetch('/api/generate-player-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                   playerName: `${reportPlayer.firstName} ${reportPlayer.lastName}`,
                   age: reportPlayer.age + state.season - 1,
                   oldRating,
                   newRating,
                   type: reportType
                })
              }).then(r => r.json()).then(data => {
                if (data && data.subject) get().addNews(data);
              }).catch(() => {});
           }
           
           // State'i güncelle
           set({ playerStats: newPlayerStats, squad: newSquad });
        }

        // RPG Etkinlik Fırlatma (Haftalık %50 ihtimal) - Tamamen Dinamik Yapay Zeka Üretimi
        if (Math.random() > 0.5 && myClub && newSquad && newSquad.length > 0) {
          fetch('/api/generate-rpg-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clubName: myClub.name,
              week: state.week + 1,
              players: myPlayers
            })
          }).then(r => r.json()).then(data => {
            if (data && data.type === 'decision' && data.actions && data.actions.length > 0) {
              get().addNews(data);
            } else if (data && !data.error) {
              // Eğer decision dönmezse bile normal haber olarak ekle
              get().addNews({ ...data, type: 'warning' });
            }
          }).catch(err => console.error("YZ RPG Olay Üretim Hatası:", err));
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
      
      acceptSponsorOffer: (offerId) => {
        const state = get();
        const offer = state.finances.sponsors.offers.find(o => o.id === offerId);
        if (!offer) return;
        
        const newSponsors = { ...state.finances.sponsors };
        if (offer.type === 'shirt') newSponsors.shirt = offer;
        else if (offer.type === 'stadium') newSponsors.stadium = offer;
        
        newSponsors.offers = newSponsors.offers.filter(o => o.id !== offerId);
        
        set({
          finances: {
            ...state.finances,
            balance: state.finances.balance + offer.bonus, // İmza parası
            seasonRevenue: state.finances.seasonRevenue + offer.bonus,
            sponsors: newSponsors,
            history: [
              { type: 'income', amount: offer.bonus, reason: `${offer.name} Sponsorluk İmza Bedeli`, week: state.week },
              ...state.finances.history
            ]
          }
        });
      },
      
      generateSponsorOffers: () => {
        const state = get();
        // Sadece maksimum 3 teklif biriksin
        if (state.finances.sponsors.offers.length >= 3) return;
        
        const types = ['shirt', 'stadium'];
        const type = types[Math.floor(Math.random() * types.length)];
        const companies = ['Beko', 'Turkish Airlines', 'Vodafone', 'Puma', 'Nike', 'Adidas', 'Papara', 'Emirates', 'Qatar Airways'];
        const name = companies[Math.floor(Math.random() * companies.length)];
        
        const newOffer = {
          id: Date.now().toString(),
          name,
          type,
          valuePerWeek: Math.floor(Math.random() * 500000) + 100000,
          duration: Math.floor(Math.random() * 20) + 10,
          bonus: Math.floor(Math.random() * 2000000) + 500000
        };
        
        set({
          finances: {
            ...state.finances,
            sponsors: {
              ...state.finances.sponsors,
              offers: [...state.finances.sponsors.offers, newOffer]
            }
          }
        });
      },

      upgradeFacility: (type, cost) => {
        const state = get();
        if (state.finances.balance < cost) return false;
        
        const currentLevel = state.finances.facilities[type] || 1;
        if (currentLevel >= 5) return false;
        
        set({
          finances: {
            ...state.finances,
            balance: state.finances.balance - cost,
            seasonExpenses: state.finances.seasonExpenses + cost,
            facilities: {
              ...state.finances.facilities,
              [type]: currentLevel + 1
            },
            history: [
              { type: 'expense', amount: cost, reason: `${type.toUpperCase()} Tesis Geliştirmesi (Seviye ${currentLevel + 1})`, week: state.week },
              ...state.finances.history
            ]
          }
        });
        return true;
      },

      organizeEvent: (cost, expectedIncome, description) => {
        const state = get();
        if (state.finances.balance < cost || state.finances.lastEventWeek === state.week) return false;
        
        const success = Math.random() > 0.3; // %70 başarı ihtimali
        const finalIncome = success ? expectedIncome : expectedIncome * 0.4;
        const profit = finalIncome - cost;

        set({
          finances: {
            ...state.finances,
            balance: state.finances.balance + profit,
            seasonRevenue: state.finances.seasonRevenue + finalIncome,
            seasonExpenses: state.finances.seasonExpenses + cost,
            lastEventWeek: state.week,
            history: [
              { type: profit >= 0 ? 'income' : 'expense', amount: Math.abs(profit), reason: `Etkinlik: ${description}`, week: state.week },
              ...state.finances.history
            ]
          }
        });
        return true;
      },
      
      toggleCfo: () => set((state) => ({
        finances: { ...state.finances, cfoHired: !state.finances.cfoHired }
      })),

      applyCfoAction: (cfoResult) => {
        const state = get();
        set({
          finances: {
            ...state.finances,
            balance: state.finances.balance + cfoResult.netProfit,
            seasonRevenue: cfoResult.netProfit > 0 ? state.finances.seasonRevenue + cfoResult.netProfit : state.finances.seasonRevenue,
            seasonExpenses: cfoResult.netProfit < 0 ? state.finances.seasonExpenses + Math.abs(cfoResult.netProfit) : state.finances.seasonExpenses,
            history: [
              { type: cfoResult.netProfit >= 0 ? 'income' : 'expense', amount: Math.abs(cfoResult.netProfit), reason: `CFO: ${cfoResult.title}`, week: state.week },
              ...state.finances.history
            ]
          }
        });
        get().addNews({ title: cfoResult.title, body: cfoResult.description, type: cfoResult.netProfit >= 0 ? 'success' : 'error' });
      },
      
      addBalance: (amount) => set((state) => ({ 

        finances: { ...state.finances, balance: state.finances.balance + amount }
      })),
      
      addNews: (newsItem) => set((state) => ({ 
        news: [{ ...newsItem, id: Date.now() + Math.random(), week: state.week }, ...state.news].slice(0, 150) 
      })),

      handleInboxAction: (messageId, actionValue) => {
        set((state) => {
          const msgIndex = state.news.findIndex(m => m.id === messageId);
          if (msgIndex === -1) return state;
          
          const msg = state.news[msgIndex];
          const action = msg.actions?.find(a => a.value === actionValue);
          if (!action || msg.handled) return state;

          // Özel sistem aksiyonları (Transfer vs)
          if (action.systemAction?.type === 'SELL_PLAYER') {
            get().sellPlayer(action.systemAction.playerId, action.systemAction.amount);
            // Satış haberini ezelim ki üst üste mesaj gelmesin, sellPlayer zaten mesaj atıyor ama biz burada sessiz satabiliriz
            // ya da sellPlayer içindeki addNews kalabilir.
          }

          const effect = action.effect || {};
          let newBalance = state.finances.balance;
          let newReputation = state.manager.reputation;
          let newMorale = state.morale;

          if (effect.money) newBalance += effect.money;
          if (effect.reputation) newReputation = Math.min(100, Math.max(0, newReputation + effect.reputation));
          if (effect.morale) newMorale = Math.min(100, Math.max(0, newMorale + effect.morale));

          const myClub = ChampionMasterData.clubs.find(c => c.id === state.myClubId);

          // Asenkron RPG Haberi Üret
          if (myClub && effect.aiPrompt) {
            fetch('/api/generate-rpg-news', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                clubName: myClub.name,
                eventPrompt: effect.aiPrompt, 
                reputation: newReputation,
                actionTaken: action.label
              })
            }).then(r => r.json()).then(data => {
              if (data && data.title) {
                useGameStore.getState().addNews({ title: '🔥 MANŞET: ' + data.title, body: data.body, type: data.type || 'warning' });
              }
            }).catch(() => {});
          }

          const newNews = [...state.news];
          newNews[msgIndex] = { ...msg, handled: true, handledActionLabel: action.label };

          return {
            finances: { ...state.finances, balance: newBalance },
            manager: { ...state.manager, reputation: newReputation },
            morale: newMorale,
            news: newNews
          };
        });
      },

      addInjury: (playerId, weeks) => set((s) => {
        const existing = s.injured.find(i => i.playerId === playerId);
        if (existing) {
          return { injured: s.injured.map(i => i.playerId === playerId ? { ...i, weeks: i.weeks + weeks } : i) };
        }
        return { injured: [...s.injured, { playerId, weeks }] };
      }),
      
      addSuspension: (playerId, weeks) => set((s) => {
        const existing = s.suspensions.find(sup => sup.playerId === playerId);
        if (existing) {
          return { suspensions: s.suspensions.map(sup => sup.playerId === playerId ? { ...sup, weeks: sup.weeks + weeks } : sup) };
        }
        return { suspensions: [...s.suspensions, { playerId, weeks }] };
      }),
      
      generateTransferOffers: () => {
        const state = get();
        if (!state.squad || state.squad.length === 0) return;
        
        // Takımdan rastgele iyi bir oyuncu seç (özellikle reytingi yüksek olanlar hedeflenir)
        const myPlayers = ChampionMasterData.players.filter(p => state.squad.includes(p.id));
        if (myPlayers.length === 0) return;
        
        // En iyi oyunculardan birini seçme ihtimali daha yüksek
        myPlayers.sort((a, b) => b.overall - a.overall);
        // İlk 5 oyuncudan birine %70 ihtimalle teklif gelir
        const targetIndex = Math.random() > 0.3 ? Math.floor(Math.random() * Math.min(5, myPlayers.length)) : Math.floor(Math.random() * myPlayers.length);
        const targetPlayer = myPlayers[targetIndex];
        
        // Tüm kulüplerden rastgele bir teklifçi seç (kendi kulübümüz hariç)
        const otherClubs = ChampionMasterData.clubs.filter(c => c.id !== state.myClubId);
        if (otherClubs.length === 0) return;
        const bidderClub = otherClubs[Math.floor(Math.random() * otherClubs.length)];
        
        fetch('/api/generate-transfer-offer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerFullName: `${targetPlayer.firstName} ${targetPlayer.lastName}`,
            playerValue: targetPlayer.value,
            bidderClubName: bidderClub.name
          })
        }).then(r => r.json()).then(data => {
          if (data && data.type === 'decision' && data.actions && data.actions.length > 0) {
            // Güvenlik için playerId'yi kod üzerinden zorla enjekte et (AI yanlış id üretmesin)
            if (data.actions[0].systemAction) {
               data.actions[0].systemAction.playerId = targetPlayer.id;
            }
            get().addNews(data);
          }
        }).catch(err => console.error("YZ CPU Transfer Hatası:", err));
      },
      
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
