"use client";

import { useGameStore } from "@/store/gameStore";
import ChampionMasterData from "@/lib/game/data";
import { TournamentEngine } from "@/lib/game/tournamentEngine";
import { motion } from "framer-motion";
import { useState } from "react";
import { ClubLogo } from "@/components/shared/ClubLogo";

export function CupContainer() {
  const { cupState, myClubId } = useGameStore();
  const [selectedRound, setSelectedRound] = useState(cupState?.currentRound || 1);

  if (!cupState) {
    return (
      <div className="pb-10 h-full flex items-center justify-center text-muted-foreground">
        Kupa verisi bulunamadı. Lütfen yeni sezon başlatın.
      </div>
    );
  }

  const rounds = Object.keys(TournamentEngine.ROUND_NAMES).map(Number);
  
  // Seçili turun maçlarını getir (Geçmiş veya Mevcut tur)
  let displayMatches = [];
  if (selectedRound === cupState.currentRound) {
    displayMatches = cupState.matches;
  } else if (selectedRound < cupState.currentRound) {
    displayMatches = cupState.history[selectedRound] || [];
  }

  const getTeamName = (id) => ChampionMasterData.clubs.find(c => c.id === id)?.name || "Bilinmiyor";
  const getTeamColors = (id) => ChampionMasterData.clubs.find(c => c.id === id)?.colors || { primary: "#000", secondary: "#333" };
  const getTeamShortName = (id) => ChampionMasterData.clubs.find(c => c.id === id)?.shortName.slice(0, 3) || "UNK";

  return (
    <div className="pb-10 h-full flex flex-col">
      <div className="mb-6 bg-card/80 p-6 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden flex items-center justify-between">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div>
          <h2 className="text-[32px] font-rajdhani font-bold tracking-wide text-white mb-1 flex items-center gap-3">
            <span className="text-4xl drop-shadow-[0_0_10px_rgba(0,230,118,0.5)]">🏆</span> Türkiye Kupası
          </h2>
          <p className="text-muted-foreground text-[15px]">Eleme usulü kupa heyecanı. Sadece kazananlar yola devam eder!</p>
        </div>
        
        {cupState.winner && (
          <div className="text-center">
            <div className="text-green text-[10px] font-bold tracking-[3px] uppercase mb-1">ŞAMPİYON</div>
            <div className="font-rajdhani font-bold text-2xl text-white">{getTeamName(cupState.winner)}</div>
          </div>
        )}
      </div>

      {/* Round Seçici */}
      <div className="flex overflow-x-auto gap-3 mb-6 pb-2 custom-scrollbar">
        {rounds.map(r => {
          const isCurrent = r === cupState.currentRound;
          const isFuture = r > cupState.currentRound;
          const isSelected = r === selectedRound;
          
          return (
            <button
              key={r}
              onClick={() => !isFuture && setSelectedRound(r)}
              disabled={isFuture}
              className={`px-6 py-3 rounded-xl font-bold tracking-wider uppercase text-sm whitespace-nowrap transition-all border ${
                isSelected ? 'bg-gradient-to-r from-primary to-primary-dark text-white border-transparent shadow-[0_0_15px_rgba(0,200,255,0.3)]' :
                isFuture ? 'bg-black/20 text-muted border-white/5 cursor-not-allowed' :
                'bg-card text-muted-foreground border-white/5 hover:bg-white/5 hover:text-white'
              }`}
            >
              {TournamentEngine.ROUND_NAMES[r]}
              {isCurrent && <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green shadow-[0_0_8px_rgba(0,230,118,0.8)] animate-pulse"></span>}
            </button>
          );
        })}
      </div>

      {/* Eşleşmeler Listesi */}
      <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg p-6">
        <h3 className="text-xl font-rajdhani font-bold text-white mb-6 uppercase tracking-wider text-center">
          {TournamentEngine.ROUND_NAMES[selectedRound]} EŞLEŞMELERİ
        </h3>

        {displayMatches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-4 opacity-30 grayscale">🤷‍♂️</div>
            Bu tura ait veri bulunamadı.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayMatches.map((m) => {
              const hColors = getTeamColors(m.homeClubId);
              const aColors = getTeamColors(m.awayClubId);
              const isMyMatch = m.homeClubId === myClubId || m.awayClubId === myClubId;
              
              return (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={m.id}
                  className={`bg-black/40 rounded-xl border p-4 relative overflow-hidden transition-all ${
                    isMyMatch ? 'border-primary/50 shadow-[0_0_15px_rgba(0,200,255,0.1)]' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  {isMyMatch && <div className="absolute inset-0 bg-primary/5 z-0 pointer-events-none"></div>}
                  
                  <div className="relative z-10 flex flex-col gap-3">
                    {/* Home Team */}
                    <div className={`flex items-center justify-between ${m.played && m.winnerId !== m.homeClubId ? 'opacity-50 grayscale' : ''}`}>
                      <div className="flex items-center gap-3">
                        <ClubLogo club={ChampionMasterData.clubs.find(c => c.id === m.homeClubId)} className="w-8 h-8" />
                        <span className={`font-rajdhani font-bold ${isMyMatch && m.homeClubId === myClubId ? 'text-primary' : 'text-white'}`}>{getTeamName(m.homeClubId)}</span>
                      </div>
                      {m.played && <span className="font-orbitron font-bold text-lg text-white">{m.score.home}</span>}
                    </div>

                    {/* Away Team */}
                    <div className={`flex items-center justify-between ${m.played && m.winnerId !== m.awayClubId ? 'opacity-50 grayscale' : ''}`}>
                      <div className="flex items-center gap-3">
                        <ClubLogo club={ChampionMasterData.clubs.find(c => c.id === m.awayClubId)} className="w-8 h-8" />
                        <span className={`font-rajdhani font-bold ${isMyMatch && m.awayClubId === myClubId ? 'text-primary' : 'text-white'}`}>{getTeamName(m.awayClubId)}</span>
                      </div>
                      {m.played && <span className="font-orbitron font-bold text-lg text-white">{m.score.away}</span>}
                    </div>
                  </div>

                  {!m.played && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold tracking-widest text-muted-foreground bg-card px-2 rounded-md border border-white/5">
                      VS
                    </div>
                  )}

                  {m.played && (
                    <div className="mt-3 text-center text-[10px] uppercase tracking-widest text-green bg-green/10 py-1 rounded border border-green/20">
                      MS
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
