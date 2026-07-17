"use client";

import { useGameStore } from "@/store/gameStore";
import { useState, useEffect } from "react";
import ChampionMasterData from "@/lib/game/data";
import { formatMoney } from "@/lib/game/utils";
import { motion, AnimatePresence } from "framer-motion";
import { GameEngine } from "@/lib/game/engine";

export function SquadContainer() {
  const { squad, lineup, setLineup, myClubId, formation, setCustomPositions, squadFitness, injured, suspensions, playerStats, season, tactics } = useGameStore();
  const [filter, setFilter] = useState("all");

  const myPlayers = ChampionMasterData.players
    .filter(p => squad.includes(p.id))
    .map(p => {
      // Dinamik rating ve yaş bilgisi
      const dynRating = playerStats[p.id]?.rating || p.overall;
      const dynAge = (p.age || 22) + (season - 1);
      return { ...p, overall: dynRating, age: dynAge };
    });

  const filteredPlayers = myPlayers.filter(p => {
    if (filter === "all") return true;
    if (filter === "GK") return p.position === "GK";
    if (filter === "DEF") return ["CB", "LB", "RB"].includes(p.position);
    if (filter === "MID") return ["CDM", "CM", "CAM", "LM", "RM"].includes(p.position);
    if (filter === "ATT") return ["ST", "CF", "LW", "RW"].includes(p.position);
    return true;
  }).sort((a, b) => {
    // Sort by starting 11 first, then by overall
    const aInLineup = lineup.includes(a.id);
    const bInLineup = lineup.includes(b.id);
    if (aInLineup && !bInLineup) return -1;
    if (!aInLineup && bInLineup) return 1;
    return b.overall - a.overall;
  });

  const toggleLineup = (id) => {
    if (lineup.includes(id)) {
      setLineup(lineup.filter(pid => pid !== id));
    } else {
      if (lineup.length < 11) {
        setLineup([...lineup, id]);
      }
    }
  };

  const autoFillLineup = () => {
    const clubPlayers = ChampionMasterData.players.filter(p => squad.includes(p.id));
    const unavailableIds = [...injured, ...suspensions];
    const style = tactics?.style || 'balanced';
    const newLineup = GameEngine.autoSelectLineup(clubPlayers, formation || '4-3-3', unavailableIds, style);
    setLineup(newLineup);
    setCustomPositions({});
  };

  const getRatingColor = (overall) => {
    if (overall >= 85) return 'text-[#f5c842] drop-shadow-[0_0_8px_rgba(245,200,66,0.5)]';
    if (overall >= 75) return 'text-[#00e676] drop-shadow-[0_0_8px_rgba(0,230,118,0.5)]';
    if (overall >= 65) return 'text-[#00c8ff] drop-shadow-[0_0_8px_rgba(0,200,255,0.5)]';
    return 'text-[#8892b0]';
  };

  const tabs = [
    { id: "all", label: "Tümü" },
    { id: "GK", label: "Kaleci" },
    { id: "DEF", label: "Defans" },
    { id: "MID", label: "Orta Saha" },
    { id: "ATT", label: "Forvet" }
  ];

  return (
    <div className="pb-10">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] font-rajdhani font-bold tracking-wide text-white mb-1">Kadro Yönetimi</h2>
          <p className="text-[#8892b0] text-[15px]">Maç kadrosunu belirle ve oyuncularını analiz et</p>
        </div>
        
        <div className="flex items-center gap-4 bg-[#141b2d] border border-white/5 p-4 rounded-2xl shadow-lg">
          <div className="text-center">
            <div className="text-[10px] text-[#4a5568] tracking-[2px] uppercase">Seçili</div>
            <div className="font-orbitron font-bold text-2xl text-white">
              <span className={lineup.length === 11 ? "text-[#00e676]" : "text-[#00c8ff]"}>{lineup.length}</span><span className="text-[#4a5568]">/11</span>
            </div>
          </div>
          <div className="w-[1px] h-10 bg-white/5"></div>
          <div className="text-center">
            <div className="text-[10px] text-[#4a5568] tracking-[2px] uppercase">Kadro</div>
            <div className="font-orbitron font-bold text-2xl text-white">{myPlayers.length}</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-2 w-full">
          {tabs.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`relative px-4 sm:px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold tracking-wider uppercase transition-colors z-10 flex-1 sm:flex-none text-center ${filter === tab.id ? 'text-white' : 'text-[#8892b0] hover:text-[#e8eaf6] bg-[#141b2d] border border-white/5'}`}
            >
              {filter === tab.id && (
                <motion.div
                  layoutId="squad-tab-active"
                  className="absolute inset-0 bg-gradient-to-r from-[#00c8ff] to-[#0090b8] rounded-full -z-10 shadow-[0_0_15px_rgba(0,200,255,0.4)]"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>
        
        <button 
          onClick={autoFillLineup}
          className="shrink-0 px-6 py-2.5 rounded-xl border border-[#f5c842]/50 bg-gradient-to-r from-[#f5c842]/20 to-[#d4a017]/20 text-[#f5c842] hover:bg-[#f5c842]/30 font-bold text-sm tracking-wide shadow-[0_0_15px_rgba(245,200,66,0.1)] transition-colors flex items-center justify-center gap-2"
        >
          <span>⚡</span> Otomatik Kur
        </button>
      </div>

      <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        <AnimatePresence>
          {filteredPlayers.map(p => {
            const isStarting = lineup.includes(p.id);
            return (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                key={p.id} 
                className={`relative bg-[#141b2d]/80 backdrop-blur-md rounded-2xl p-4 cursor-pointer overflow-hidden transition-all duration-300 ${isStarting ? 'border border-[#00c8ff] shadow-[0_0_20px_rgba(0,200,255,0.2)] ring-1 ring-[#00c8ff]/50' : 'border border-white/5 hover:border-white/20 hover:-translate-y-1'}`}
                onClick={() => toggleLineup(p.id)}
              >
                {/* Glow Background if selected */}
                {isStarting && <div className="absolute inset-0 bg-[#00c8ff]/5"></div>}
                
                {/* Starting 11 Badge */}
                {isStarting && (
                  <div className="absolute top-0 right-0 bg-[#00c8ff] text-black font-bold text-[9px] px-3 py-1 rounded-bl-lg tracking-widest shadow-[0_0_10px_rgba(0,200,255,0.5)] z-10">
                    İLK 11
                  </div>
                )}

                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className={`font-orbitron font-black text-3xl ${getRatingColor(p.overall)}`}>
                    {p.overall}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="font-bold text-xs bg-black/40 text-white border border-white/10 px-2 py-1 rounded shadow-sm">
                      {p.position}
                    </div>
                    {p.alternatePositions && p.alternatePositions.length > 0 && (
                      <div className="flex gap-1">
                        {p.alternatePositions.map((alt, i) => (
                          <div key={i} className="text-[9px] bg-white/5 border border-white/10 text-[#8892b0] px-1.5 py-0.5 rounded shadow-sm">
                            {alt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center mb-4 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-[#0a0e1a] border border-white/10 flex items-center justify-center text-3xl shadow-inner">
                    👤
                  </div>
                </div>

                <div className="text-center relative z-10">
                  <div className="font-rajdhani font-bold text-lg text-white leading-tight mb-1 truncate">{p.lastName}</div>
                  <div className="text-[10px] text-[#8892b0] tracking-[1px] uppercase mb-3 truncate">{p.firstName}</div>
                  
                  <div className="grid grid-cols-2 gap-1 border-t border-white/5 pt-3 mb-3">
                    <div>
                      <div className="text-[9px] text-[#4a5568] uppercase tracking-wider">Yaş</div>
                      <div className="font-bold text-[#e8eaf6] text-xs">{p.age}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-[#4a5568] uppercase tracking-wider">Değer</div>
                      <div className="font-bold text-[#e8eaf6] text-xs">€{(p.value / 1000000).toFixed(1)}M</div>
                    </div>
                  </div>
                  
                  {/* Fitness Bar */}
                  <div className="border-t border-white/5 pt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[9px] text-[#4a5568] uppercase tracking-wider">Kondisyon</span>
                      <span className={`text-[9px] font-bold ${(!squadFitness[p.id] || squadFitness[p.id] >= 80) ? 'text-[#00e676]' : squadFitness[p.id] >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {squadFitness[p.id] || 100}%
                      </span>
                    </div>
                    <div className="h-1 w-full bg-black/50 rounded-full overflow-hidden">
                      <div className={`h-full ${(!squadFitness[p.id] || squadFitness[p.id] >= 80) ? 'bg-gradient-to-r from-[#00e676] to-[#00b25c]' : squadFitness[p.id] >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${squadFitness[p.id] || 100}%` }}></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
      
      {filteredPlayers.length === 0 && (
        <div className="text-center py-20 text-[#8892b0] border border-white/5 border-dashed rounded-2xl bg-[#141b2d]/30">
          Bu filtreye uygun oyuncu bulunamadı.
        </div>
      )}
    </div>
  );
}
