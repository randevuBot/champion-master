"use client";

import { useGameStore } from "@/store/gameStore";
import ChampionMasterData from "@/lib/game/data";
import { motion } from "framer-motion";

export function StatsContainer() {
  const { leagueTable, myClubId } = useGameStore();

  if (!myClubId) return null;

  // Placeholder for top scorers since engine doesn't track it globally yet
  const topScorers = [
    { name: "Mauro Icardi", club: "Galatasaray", goals: 12 },
    { name: "Edin Dzeko", club: "Fenerbahçe", goals: 10 },
    { name: "Vincent Aboubakar", club: "Beşiktaş", goals: 8 },
    { name: "Erling Haaland", club: "Man City", goals: 7 },
  ];

  return (
    <div className="pb-10">
      <div className="mb-5 sm:mb-6">
        <h2 className="text-2xl sm:text-[32px] font-rajdhani font-bold tracking-wide text-white mb-1">Lig İstatistikleri</h2>
        <p className="text-[#8892b0] text-sm sm:text-[15px]">Puan durumu ve gol kralığı</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* League Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <span className="font-rajdhani font-bold text-lg tracking-wider text-[#e8eaf6] uppercase">Puan Durumu</span>
          </div>
          
          <div className="overflow-x-auto table-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/20 border-b border-white/5">
                  <th className="px-6 py-4 text-[11px] text-[#8892b0] uppercase tracking-wider font-semibold">Sıra</th>
                  <th className="px-6 py-4 text-[11px] text-[#8892b0] uppercase tracking-wider font-semibold w-full">Takım</th>
                  <th className="px-4 py-4 text-[11px] text-[#8892b0] uppercase tracking-wider font-semibold text-center">O</th>
                  <th className="px-4 py-4 text-[11px] text-[#8892b0] uppercase tracking-wider font-semibold text-center">G</th>
                  <th className="px-4 py-4 text-[11px] text-[#8892b0] uppercase tracking-wider font-semibold text-center">B</th>
                  <th className="px-4 py-4 text-[11px] text-[#8892b0] uppercase tracking-wider font-semibold text-center">M</th>
                  <th className="px-4 py-4 text-[11px] text-[#8892b0] uppercase tracking-wider font-semibold text-center">Av</th>
                  <th className="px-6 py-4 text-[11px] text-[#f5c842] uppercase tracking-wider font-bold text-center">P</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leagueTable.map((row, index) => {
                  const team = ChampionMasterData.clubs.find(c => c.id === row.clubId);
                  const isMyClub = row.clubId === myClubId;
                  const rank = index + 1;
                  
                  return (
                    <tr key={row.clubId} className={`transition-colors hover:bg-white/5 ${isMyClub ? 'bg-[#00c8ff]/10' : ''}`}>
                      <td className={`px-6 py-4 font-bold relative ${rank <= 4 ? 'text-[#00e676]' : rank >= 18 ? 'text-[#ff1744]' : 'text-[#8892b0]'}`}>
                        {isMyClub && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00c8ff] shadow-[0_0_10px_#00c8ff]"></div>}
                        {rank}
                      </td>
                      
                      <td className={`px-6 py-4 font-semibold ${isMyClub ? 'text-white font-bold' : 'text-[#e8eaf6]'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-orbitron font-bold text-white border border-white/20" style={{ background: `linear-gradient(135deg, ${team?.colors?.primary}, ${team?.colors?.secondary})` }}>
                            {team?.shortName.slice(0,3)}
                          </div>
                          {team?.name}
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 text-center text-[#8892b0]">{row.played}</td>
                      <td className="px-4 py-4 text-center text-[#e8eaf6]">{row.won}</td>
                      <td className="px-4 py-4 text-center text-[#e8eaf6]">{row.drawn}</td>
                      <td className="px-4 py-4 text-center text-[#e8eaf6]">{row.lost}</td>
                      <td className="px-4 py-4 text-center text-[#8892b0]">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                      <td className="px-6 py-4 text-center font-bold text-[#f5c842]">{row.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Top Scorers */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <span className="font-rajdhani font-bold text-lg tracking-wider text-[#e8eaf6] uppercase">Gol Krallığı</span>
          </div>
          <div className="p-4 flex-1">
            <div className="space-y-4">
              {topScorers.map((scorer, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                  <div className="font-orbitron font-bold text-2xl text-[#8892b0] w-6">{idx + 1}</div>
                  <div className="w-10 h-10 rounded-full bg-[#0a0e1a] border border-white/10 flex items-center justify-center text-lg">👤</div>
                  <div className="flex-1">
                    <div className="font-bold text-white text-sm">{scorer.name}</div>
                    <div className="text-[10px] text-[#00c8ff] uppercase tracking-wider">{scorer.club}</div>
                  </div>
                  <div className="text-center">
                    <div className="font-orbitron font-bold text-xl text-[#00e676]">{scorer.goals}</div>
                    <div className="text-[9px] text-[#4a5568] uppercase tracking-wider">Gol</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
