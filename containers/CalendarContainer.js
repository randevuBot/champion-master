"use client";

import { useGameStore } from "@/store/gameStore";
import ChampionMasterData from "@/lib/game/data";
import { motion, AnimatePresence } from "framer-motion";
import { ClubLogo } from "@/components/shared/ClubLogo";

export function CalendarContainer() {
  const { fixtures, myClubId } = useGameStore();

  if (!myClubId) return null;

  const myMatches = fixtures.filter(f => f.homeClubId === myClubId || f.awayClubId === myClubId).sort((a, b) => a.week - b.week);

  return (
    <div className="pb-10">
      <div className="mb-5 sm:mb-6">
        <h2 className="text-2xl sm:text-[32px] font-rajdhani font-bold tracking-wide text-white mb-1">Takvim & Fikstür</h2>
        <p className="text-muted-foreground text-sm sm:text-[15px]">Tüm sezon maç programınız ve sonuçlar</p>
      </div>

      <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden w-full max-w-4xl">
        <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
          <span className="font-rajdhani font-bold text-lg tracking-wider text-foreground uppercase">Sezon Fikstürü</span>
        </div>
        
        <div className="divide-y divide-white/5">
          <AnimatePresence>
            {myMatches.map((match, idx) => {
              const home = ChampionMasterData.clubs.find(c => c.id === match.homeClubId);
              const away = ChampionMasterData.clubs.find(c => c.id === match.awayClubId);
              
              const isPlayed = match.played;
              let resultColor = 'text-muted-foreground';
              let resultText = '';
              
              if (isPlayed) {
                const isHome = match.homeClubId === myClubId;
                const myGoals = isHome ? match.homeScore : match.awayScore;
                const opponentGoals = isHome ? match.awayScore : match.homeScore;
                
                if (myGoals > opponentGoals) {
                  resultColor = 'text-green bg-green/10 border-green/30';
                  resultText = 'G';
                } else if (myGoals < opponentGoals) {
                  resultColor = 'text-destructive bg-destructive/10 border-destructive/30';
                  resultText = 'M';
                } else {
                  resultColor = 'text-gold bg-gold/10 border-gold/30';
                  resultText = 'B';
                }
              }

              return (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={idx} 
                  className={`flex flex-col sm:flex-row items-center justify-between p-4 sm:px-6 transition-colors hover:bg-white/5 ${!isPlayed ? 'opacity-80' : ''}`}
                >
                  <div className="flex items-center w-full sm:w-1/4 mb-4 sm:mb-0">
                    <div className="bg-black/40 text-primary text-[10px] font-bold tracking-[2px] px-3 py-1.5 rounded-lg border border-primary/20">
                      HAFTA {match.week}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center w-full sm:w-1/2 gap-4">
                    <div className="flex-1 flex items-center justify-end gap-3 text-right">
                      <span className={`font-rajdhani font-bold text-lg ${match.homeClubId === myClubId ? 'text-white' : 'text-muted-foreground'}`}>{home?.name}</span>
                      <ClubLogo club={home} className="w-8 h-8" />
                    </div>
                    
                    <div className="w-20 text-center shrink-0">
                      {isPlayed ? (
                        <div className="font-orbitron font-black text-2xl text-white tracking-widest bg-black/40 px-3 py-1 rounded-xl border border-white/10">
                          {match.homeScore} - {match.awayScore}
                        </div>
                      ) : (
                        <div className="font-orbitron font-bold text-muted-foreground bg-black/40 px-3 py-2 rounded-xl border border-white/5 text-xs tracking-widest uppercase">
                          VS
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 flex items-center justify-start gap-3 text-left">
                      <ClubLogo club={away} className="w-8 h-8" />
                      <span className={`font-rajdhani font-bold text-lg ${match.awayClubId === myClubId ? 'text-white' : 'text-muted-foreground'}`}>{away?.name}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end w-full sm:w-1/4 mt-4 sm:mt-0">
                    {isPlayed ? (
                      <div className={`w-8 h-8 flex items-center justify-center rounded font-bold border ${resultColor}`}>
                        {resultText}
                      </div>
                    ) : (
                      <div className="text-[10px] text-muted uppercase tracking-wider font-bold">Oynanmadı</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {myMatches.length === 0 && (
            <div className="p-10 text-center text-muted-foreground">Henüz fikstür oluşturulmadı.</div>
          )}
        </div>
      </div>
    </div>
  );
}
