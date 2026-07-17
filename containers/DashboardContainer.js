"use client";

import { useGameStore } from "@/store/gameStore";
import ChampionMasterData from "@/lib/game/data";
import { formatMoney } from "@/lib/game/utils";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export function DashboardContainer() {
  const router = useRouter();
  const { myClubId, week, fixtures, seasonStats, leagueTable, finances, manager, news, morale, chemistry } = useGameStore();
  const [openSection, setOpenSection] = useState("club"); // Default open section

  if (!myClubId) return null;

  const club = ChampionMasterData.clubs.find(c => c.id === myClubId);
  const nextMatch = fixtures.find(f => !f.played && f.week === week && (f.homeClubId === myClubId || f.awayClubId === myClubId));
  
  let homeTeam, awayTeam;
  if (nextMatch) {
    homeTeam = ChampionMasterData.clubs.find(c => c.id === nextMatch.homeClubId);
    awayTeam = ChampionMasterData.clubs.find(c => c.id === nextMatch.awayClubId);
  }

  const myRankIndex = leagueTable.findIndex(row => row.clubId === myClubId);
  const tableSliceStart = Math.max(0, myRankIndex - 2);
  const miniTable = leagueTable.slice(tableSliceStart, tableSliceStart + 5);

  const gossips = news.filter(n => n.type === 'warning');

  const AccordionHeader = ({ title, id, icon }) => (
    <button 
      onClick={() => setOpenSection(openSection === id ? null : id)} 
      className="w-full flex justify-between items-center bg-[#141b2d] p-4 sm:p-5 rounded-2xl border border-white/5 mb-2 hover:bg-[#1a2340] hover:border-[#00c8ff]/30 transition-all shadow-lg"
    >
      <div className="flex items-center gap-4">
        <span className="text-2xl">{icon}</span>
        <span className="font-rajdhani font-bold text-lg sm:text-xl text-white tracking-wider uppercase">{title}</span>
      </div>
      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[#00c8ff]">
        {openSection === id ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path></svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        )}
      </div>
    </button>
  );

  return (
    <div className="pb-10 max-w-6xl mx-auto">
      <div className="mb-6 sm:mb-8 bg-[#141b2d]/80 p-6 rounded-2xl border border-white/5 flex items-center gap-6 shadow-xl">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl font-orbitron font-black text-white border-4 border-[#00c8ff]/30 shadow-[0_0_30px_rgba(0,200,255,0.2)] shrink-0" style={{ background: `linear-gradient(135deg, ${club?.colors?.primary}, ${club?.colors?.secondary})` }}>
          {club?.shortName.slice(0,3)}
        </div>
        <div className="flex-1">
          <h2 className="text-3xl sm:text-4xl font-rajdhani font-bold tracking-wide text-white mb-2">Hoş Geldin, <span className="text-[#00c8ff]">{manager?.name || "Menajer"}</span>!</h2>
          <p className="text-[#8892b0] text-sm sm:text-base mb-3">Kariyerinde <span className="text-white font-bold">{week}. Hafta</span>. Takımını başarıya taşı!</p>
          
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-3 bg-black/40 inline-flex px-4 py-2 rounded-xl border border-white/5">
              <span className="text-xl">{morale >= 80 ? '🔥' : morale >= 60 ? '👍' : morale >= 40 ? '😐' : '😡'}</span>
              <div>
                <div className="text-[10px] text-[#8892b0] uppercase tracking-widest font-bold">Takım Morali</div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-black rounded-full overflow-hidden">
                    <div className={`h-full ${morale >= 80 ? 'bg-[#00e676]' : morale >= 60 ? 'bg-[#00c8ff]' : morale >= 40 ? 'bg-[#f5c842]' : 'bg-[#ff1744]'}`} style={{ width: `${morale || 70}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-white">{morale || 70}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-black/40 inline-flex px-4 py-2 rounded-xl border border-white/5">
              <span className="text-xl">{chemistry >= 85 ? '🤝' : chemistry >= 60 ? '🤔' : chemistry >= 40 ? '⚠️' : '💣'}</span>
              <div>
                <div className="text-[10px] text-[#8892b0] uppercase tracking-widest font-bold">Takım Uyumu</div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-black rounded-full overflow-hidden">
                    <div className={`h-full ${chemistry >= 85 ? 'bg-[#00e676]' : chemistry >= 60 ? 'bg-[#00c8ff]' : chemistry >= 40 ? 'bg-[#f5c842]' : 'bg-[#ff1744]'}`} style={{ width: `${chemistry || 85}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-white">{chemistry || 85}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        
        {/* KULÜP SECTION */}
        <div>
          <AccordionHeader title="Kulüp Durumu" id="club" icon="🏟️" />
          <AnimatePresence>
            {openSection === 'club' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2 pb-6">
                  {/* Next Match Card */}
                  <div className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-[0_16px_48px_rgba(0,0,0,0.4)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                      <span className="font-rajdhani font-bold text-lg tracking-wider text-[#e8eaf6] uppercase">Sıradaki Maç</span>
                      <span className="bg-[#f5c842]/10 text-[#f5c842] border border-[#f5c842]/30 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(245,200,66,0.15)]">LİG MAÇI</span>
                    </div>
                    <div className="p-4 sm:p-8">
                      {nextMatch ? (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
                          <div className="flex-1 flex flex-col items-center">
                            <div className="w-16 h-16 sm:w-[88px] sm:h-[88px] rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-center text-xl sm:text-3xl font-orbitron font-black text-white mb-2 sm:mb-4 relative" style={{ background: `linear-gradient(135deg, ${homeTeam?.colors?.primary}, ${homeTeam?.colors?.secondary})` }}>
                              {homeTeam?.shortName.slice(0,3)}
                              <div className="absolute inset-0 rounded-full border border-white/20"></div>
                            </div>
                            <div className="font-rajdhani font-bold text-base sm:text-xl text-center truncate max-w-[120px]">{homeTeam?.name}</div>
                          </div>
                          
                          <div className="flex-1 flex flex-col items-center px-2 sm:px-4">
                            <div className="font-orbitron text-2xl sm:text-4xl font-black text-white/20 tracking-widest mb-2 sm:mb-3">VS</div>
                            <div className="text-[10px] sm:text-[11px] text-[#8892b0] tracking-[2px] uppercase mb-3 sm:mb-6 flex items-center gap-1 text-center">
                              <span>📍</span> <span className="truncate max-w-[100px]">{homeTeam?.stadium}</span>
                            </div>
                            <button 
                              className="bg-gradient-to-r from-[#00c8ff] to-[#0090b8] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(0,200,255,0.3)] border border-white/20 text-sm sm:text-base hover:scale-105 transition-transform"
                              onClick={() => router.push("/match")}
                            >
                              Maça Git
                            </button>
                          </div>
                          
                          <div className="flex-1 flex flex-col items-center">
                            <div className="w-16 h-16 sm:w-[88px] sm:h-[88px] rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.5)] flex items-center justify-center text-xl sm:text-3xl font-orbitron font-black text-white mb-2 sm:mb-4 relative" style={{ background: `linear-gradient(135deg, ${awayTeam?.colors?.primary}, ${awayTeam?.colors?.secondary})` }}>
                              {awayTeam?.shortName.slice(0,3)}
                              <div className="absolute inset-0 rounded-full border border-white/20"></div>
                            </div>
                            <div className="font-rajdhani font-bold text-base sm:text-xl text-center truncate max-w-[120px]">{awayTeam?.name}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-12 text-[#8892b0] text-center w-full text-lg">Bu hafta maçınız yok.</div>
                      )}
                    </div>
                  </div>

                  {/* League Table Card */}
                  <div className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-[0_16px_48px_rgba(0,0,0,0.4)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                      <span className="font-rajdhani font-bold text-lg tracking-wider text-[#e8eaf6] uppercase">Puan Durumu</span>
                      <button className="text-[#00c8ff] text-xs font-bold tracking-widest uppercase hover:text-white transition-colors" onClick={() => router.push("/stats")}>Tümünü Gör</button>
                    </div>
                    <div className="p-0 overflow-x-auto table-scroll">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-black/20 border-b border-white/5">
                            <th className="px-6 py-4 text-[11px] text-[#8892b0] uppercase tracking-wider font-semibold">Sıra</th>
                            <th className="px-6 py-4 text-[11px] text-[#8892b0] uppercase tracking-wider font-semibold w-full">Takım</th>
                            <th className="px-4 py-4 text-[11px] text-[#8892b0] uppercase tracking-wider font-semibold text-center">O</th>
                            <th className="px-4 py-4 text-[11px] text-[#f5c842] uppercase tracking-wider font-bold text-center">P</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {miniTable.map((row) => {
                            const team = ChampionMasterData.clubs.find(c => c.id === row.clubId);
                            const isMyClub = row.clubId === myClubId;
                            const actualRank = leagueTable.findIndex(r => r.clubId === row.clubId) + 1;
                            return (
                              <tr key={row.clubId} className={`transition-colors hover:bg-white/5 ${isMyClub ? 'bg-[#00c8ff]/10' : ''}`}>
                                <td className={`px-6 py-4 font-bold relative ${actualRank <= 4 ? 'text-[#00e676]' : actualRank >= 18 ? 'text-[#ff1744]' : 'text-[#8892b0]'}`}>
                                  {isMyClub && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00c8ff] shadow-[0_0_10px_#00c8ff]"></div>}
                                  {actualRank}
                                </td>
                                <td className={`px-6 py-4 font-semibold ${isMyClub ? 'text-white font-bold' : 'text-[#e8eaf6]'}`}>
                                  <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-orbitron font-bold text-white border border-white/20" style={{ background: `linear-gradient(135deg, ${team?.colors?.primary}, ${team?.colors?.secondary})` }}>
                                      {team?.shortName.slice(0,3)}
                                    </div>
                                    <span className="truncate max-w-[150px]">{team?.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-center text-[#8892b0]">{row.played}</td>
                                <td className="px-6 py-4 text-center font-bold text-[#f5c842]">{row.points}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FINANS & İSTATİSTİKLER SECTION */}
        <div>
          <AccordionHeader title="Finans & İstatistikler" id="finance" icon="📊" />
          <AnimatePresence>
            {openSection === 'finance' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pt-2 pb-6">
                  
                  <div className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-[0_16px_48px_rgba(0,0,0,0.4)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 bg-black/20">
                      <span className="font-rajdhani font-bold text-lg tracking-wider text-[#e8eaf6] uppercase">Sezon Özeti</span>
                    </div>
                    <div className="p-6 grid grid-cols-2 gap-4">
                      <div className="bg-[#1a2340] rounded-xl p-4 border border-white/5 text-center shadow-inner">
                        <div className="font-orbitron font-bold text-[28px] text-white">{seasonStats?.played || 0}</div>
                        <div className="text-[10px] text-[#8892b0] tracking-[2px] uppercase mt-1">Oynanan</div>
                      </div>
                      <div className="bg-[#1a2340] rounded-xl p-4 border border-white/5 text-center shadow-inner">
                        <div className="font-orbitron font-bold text-[28px] text-[#f5c842]">{seasonStats?.points || 0}</div>
                        <div className="text-[10px] text-[#8892b0] tracking-[2px] uppercase mt-1">Puan</div>
                      </div>
                      <div className="bg-[#1a2340] rounded-xl p-4 border border-white/5 text-center shadow-inner">
                        <div className="font-orbitron font-bold text-[28px] text-[#00e676]">{seasonStats?.goalsFor || 0}</div>
                        <div className="text-[10px] text-[#8892b0] tracking-[2px] uppercase mt-1">Atılan</div>
                      </div>
                      <div className="bg-[#1a2340] rounded-xl p-4 border border-white/5 text-center shadow-inner">
                        <div className="font-orbitron font-bold text-[28px] text-[#ff1744]">{seasonStats?.goalsAgainst || 0}</div>
                        <div className="text-[10px] text-[#8892b0] tracking-[2px] uppercase mt-1">Yenilen</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-[0_16px_48px_rgba(0,0,0,0.4)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 bg-black/20">
                      <span className="font-rajdhani font-bold text-lg tracking-wider text-[#e8eaf6] uppercase">Finans Özeti</span>
                    </div>
                    <div className="p-6 flex flex-col h-[calc(100%-60px)]">
                      <div className="mb-4 bg-[#1a2340] p-4 rounded-xl border border-white/5 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 text-[60px] opacity-[0.03] font-orbitron font-black">€</div>
                        <div className="text-[11px] text-[#8892b0] uppercase tracking-[2px] mb-1">Kulüp Bütçesi</div>
                        <div className="font-orbitron text-2xl font-bold text-[#00e676]">{formatMoney(finances?.balance || 0)}</div>
                      </div>
                      <div className="mb-4 bg-[#1a2340] p-4 rounded-xl border border-white/5 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 text-[60px] opacity-[0.03] font-orbitron font-black">€</div>
                        <div className="text-[11px] text-[#8892b0] uppercase tracking-[2px] mb-1">Transfer Bütçesi</div>
                        <div className="font-orbitron text-2xl font-bold text-[#00c8ff]">{formatMoney(finances?.transferBudget || 0)}</div>
                      </div>
                      <button 
                        className="mt-auto w-full bg-white/5 border border-white/10 text-white rounded-xl py-3 font-bold hover:bg-white/10 transition-colors"
                        onClick={() => router.push("/finance")}
                      >
                        Finans Detayları
                      </button>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* MAGAZİN & SÖYLENTİLER SECTION */}
        <div>
          <AccordionHeader title="Magazin & Söylentiler" id="magazine" icon="📸" />
          <AnimatePresence>
            {openSection === 'magazine' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="pt-2 pb-6">
                  <div className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-[0_16px_48px_rgba(0,0,0,0.4)] p-6">
                    {gossips.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="text-4xl mb-4 opacity-50">📰</div>
                        <h3 className="text-xl font-rajdhani font-bold text-white mb-2">Şu anlık ortalık sakin</h3>
                        <p className="text-[#8892b0]">Kulüpte veya basında henüz bir dedikodu dolaşmıyor. İlerleyen haftalarda magazin basını peşinize düşecektir.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {gossips.map(gossip => (
                          <div key={gossip.id} className="bg-gradient-to-r from-red-900/20 to-[#1a2340] border-l-4 border-red-500 p-4 rounded-r-xl relative overflow-hidden group hover:from-red-900/30 transition-all">
                            <div className="absolute right-0 top-0 text-[100px] opacity-[0.02] -rotate-12 group-hover:scale-110 transition-transform">🔥</div>
                            <div className="text-xs text-red-400 font-bold tracking-widest uppercase mb-2">Hafta {gossip.week}</div>
                            <h4 className="text-lg font-rajdhani font-bold text-white mb-1 drop-shadow-md">{gossip.title}</h4>
                            <p className="text-[#8892b0] text-sm leading-relaxed">{gossip.body}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
