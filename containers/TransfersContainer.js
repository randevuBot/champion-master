"use client";

import { useGameStore } from "@/store/gameStore";
import { useState } from "react";
import ChampionMasterData from "@/lib/game/data";
import { formatMoney } from "@/lib/game/utils";
import { motion, AnimatePresence } from "framer-motion";

export function TransfersContainer() {
  const { squad, finances, buyPlayer, myClubId } = useGameStore();
  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState(60);
  const [maxAge, setMaxAge] = useState(40);
  const [position, setPosition] = useState("ALL");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [offerAmount, setOfferAmount] = useState(0);

  if (!myClubId) return null;

  const getRatingColor = (overall) => {
    if (overall >= 85) return 'text-[#f5c842]';
    if (overall >= 75) return 'text-[#00e676]';
    if (overall >= 65) return 'text-[#00c8ff]';
    return 'text-[#8892b0]';
  };

  const marketPlayers = ChampionMasterData.players.filter(p => {
    if (squad.includes(p.id)) return false;
    if (search && !`${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())) return false;
    if (p.overall < minRating) return false;
    if (p.age > maxAge) return false;
    if (position !== "ALL" && p.position !== position) return false;
    return true;
  }).sort((a, b) => b.overall - a.overall).slice(0, 50); // Limit to top 50

  const handleSelect = (p) => {
    setSelectedPlayer(p);
    setOfferAmount(p.value * 1000000);
  };

  const handleOffer = () => {
    if (!selectedPlayer) return;
    const res = buyPlayer(selectedPlayer.id, offerAmount);
    if (res && !res.success) {
      alert(res.reason);
    } else {
      alert(`${selectedPlayer.lastName} transferi başarıyla tamamlandı!`);
      setSelectedPlayer(null);
    }
  };

  return (
    <div className="pb-10">
      <div className="mb-5 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-[32px] font-rajdhani font-bold tracking-wide text-white mb-1">Transfer Merkezi</h2>
          <p className="text-[#8892b0] text-sm sm:text-[15px]">Yeni yetenekler keşfet ve kadronu güçlendir</p>
        </div>
        
        <div className="bg-[#141b2d] border border-white/5 p-4 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="text-[32px] opacity-20">💰</div>
          <div>
            <div className="text-[10px] text-[#4a5568] tracking-[2px] uppercase">Transfer Bütçesi</div>
            <div className="font-orbitron font-bold text-2xl text-[#00e676] drop-shadow-[0_0_10px_rgba(0,230,118,0.3)]">
              {formatMoney(finances?.transferBudget || 0)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Left Side: Market List & Filters */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-2 font-bold">Oyuncu Ara</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4a5568]">🔍</span>
                  <input 
                    type="text" 
                    className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-[#00c8ff] text-sm"
                    placeholder="İsim girin..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-2 font-bold">Mevki</label>
                <select 
                  className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#00c8ff] text-sm cursor-pointer"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                >
                  <option value="ALL">Tümü</option>
                  <option value="GK">Kaleci (GK)</option>
                  <option value="CB">Stoper (CB)</option>
                  <option value="LB">Sol Bek (LB)</option>
                  <option value="RB">Sağ Bek (RB)</option>
                  <option value="CDM">Ön Libero (CDM)</option>
                  <option value="CM">Orta Saha (CM)</option>
                  <option value="CAM">Ofansif O.S. (CAM)</option>
                  <option value="RW">Sağ Kanat (RW)</option>
                  <option value="LW">Sol Kanat (LW)</option>
                  <option value="ST">Forvet (ST)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-2 font-bold">Min. Derece ({minRating})</label>
                <input 
                  type="range" 
                  min="60" max="95" 
                  className="w-full accent-[#00c8ff]"
                  value={minRating} 
                  onChange={e => setMinRating(parseInt(e.target.value))} 
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#8892b0] uppercase tracking-wider mb-2 font-bold">Maks. Yaş ({maxAge})</label>
                <input 
                  type="range" 
                  min="16" max="40" 
                  className="w-full accent-[#00c8ff]"
                  value={maxAge} 
                  onChange={e => setMaxAge(parseInt(e.target.value))} 
                />
              </div>
            </div>
          </div>

          <div className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden flex-1 flex flex-col min-h-[400px]">
            <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
              <span className="font-rajdhani font-bold text-lg tracking-wider text-[#e8eaf6] uppercase">Transfer Listesi ({marketPlayers.length})</span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <AnimatePresence>
                  {marketPlayers.map(p => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      key={p.id} 
                      className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedPlayer?.id === p.id ? 'bg-[#00c8ff]/10 border-[#00c8ff] shadow-[0_0_15px_rgba(0,200,255,0.2)]' : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'}`}
                      onClick={() => handleSelect(p)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#0a0e1a] border border-white/10 flex items-center justify-center text-lg shadow-inner">👤</div>
                        <div>
                          <div className="font-bold text-white text-sm">{p.lastName}</div>
                          <div className="text-[10px] text-[#8892b0] uppercase tracking-wider flex gap-2">
                            <span>{p.position}</span>
                            <span>•</span>
                            <span>{p.age} Yaş</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`font-orbitron font-bold text-lg ${getRatingColor(p.overall)}`}>{p.overall}</div>
                        <div className="text-[10px] text-[#00e676] font-bold tracking-widest uppercase">€{(p.value).toFixed(1)}M</div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {marketPlayers.length === 0 && (
                <div className="text-center py-20 text-[#8892b0]">
                  <div className="text-4xl mb-4 opacity-50">🔍</div>
                  Kriterlerinize uygun oyuncu bulunamadı.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Player Details & Offer */}
        <div>
          {selectedPlayer ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              key={selectedPlayer.id}
              className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-[#00c8ff]/30 shadow-[0_0_30px_rgba(0,200,255,0.1)] overflow-hidden sticky top-[96px]"
            >
              <div className="p-6 text-center border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00c8ff]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                
                <div className="w-24 h-24 mx-auto rounded-full bg-[#0a0e1a] border-2 border-[#00c8ff]/50 shadow-[0_0_20px_rgba(0,200,255,0.3)] flex items-center justify-center text-4xl mb-4 relative z-10">
                  👤
                  <div className="absolute -bottom-2 -right-2 bg-black border border-white/20 text-[#f5c842] text-xs font-bold px-2 py-1 rounded">
                    ★ {Math.floor(selectedPlayer.overall / 20)}
                  </div>
                </div>
                
                <h3 className="text-2xl font-rajdhani font-bold text-white mb-1 relative z-10">{selectedPlayer.firstName} {selectedPlayer.lastName}</h3>
                <div className="inline-block bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold tracking-[2px] uppercase text-[#00c8ff] mb-4 border border-white/10 relative z-10">
                  {selectedPlayer.position} • {selectedPlayer.age} Yaş
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[#0a0e1a] p-2 rounded-lg border border-white/5">
                    <div className="text-[9px] text-[#4a5568] uppercase tracking-wider mb-1">Derece</div>
                    <div className={`font-orbitron font-bold text-lg ${getRatingColor(selectedPlayer.overall)}`}>{selectedPlayer.overall}</div>
                  </div>
                  <div className="bg-[#0a0e1a] p-2 rounded-lg border border-white/5">
                    <div className="text-[9px] text-[#4a5568] uppercase tracking-wider mb-1">Piyasa Değeri</div>
                    <div className="font-orbitron font-bold text-[#00e676] text-sm mt-1">€{selectedPlayer.value}M</div>
                  </div>
                  <div className="bg-[#0a0e1a] p-2 rounded-lg border border-white/5">
                    <div className="text-[9px] text-[#4a5568] uppercase tracking-wider mb-1">Potansiyel</div>
                    <div className="font-orbitron font-bold text-[#f5c842] text-lg">{selectedPlayer.potential}</div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-black/20">
                <div className="grid grid-cols-2 gap-4 text-[11px] uppercase tracking-wider font-bold mb-6">
                  <div>
                    <span className="text-[#4a5568] block mb-1">Maaş Beklentisi</span>
                    <span className="text-[#e8eaf6]">€{selectedPlayer.wage}K / Haftalık</span>
                  </div>
                  <div>
                    <span className="text-[#4a5568] block mb-1">Sözleşme</span>
                    <span className="text-[#e8eaf6]">{selectedPlayer.contractEnd}'e kadar</span>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs text-[#8892b0] font-bold uppercase tracking-wider mb-2">Transfer Teklifi</label>
                  <div className="flex items-center gap-2 mb-2">
                    <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold" onClick={() => setOfferAmount(prev => Math.max(0, prev - 500000))}>-</button>
                    <div className="flex-1 bg-[#0a0e1a] border border-[#00c8ff]/30 rounded-xl text-center py-2 text-lg font-orbitron font-bold text-[#00c8ff] shadow-[inset_0_0_10px_rgba(0,200,255,0.1)]">
                      {formatMoney(offerAmount)}
                    </div>
                    <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold" onClick={() => setOfferAmount(prev => prev + 500000)}>+</button>
                  </div>
                  <div className="text-right text-[10px] text-[#4a5568] tracking-wider uppercase">
                    Kalan Bütçe: {formatMoney((finances?.transferBudget || 0) - offerAmount)}
                  </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-3.5 rounded-xl font-bold tracking-widest uppercase transition-all shadow-lg text-sm
                    ${offerAmount <= finances?.transferBudget 
                      ? 'bg-gradient-to-r from-[#00c8ff] to-[#0090b8] text-white shadow-[0_0_20px_rgba(0,200,255,0.3)] border border-white/20' 
                      : 'bg-red-500/20 text-red-400 border border-red-500/30 cursor-not-allowed'
                    }
                  `}
                  onClick={handleOffer}
                  disabled={offerAmount > finances?.transferBudget}
                >
                  {offerAmount > finances?.transferBudget ? 'Yetersiz Bütçe' : 'Teklif Yap 🤝'}
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-[#141b2d]/50 backdrop-blur-md rounded-2xl border border-white/5 border-dashed h-full min-h-[400px] flex flex-col items-center justify-center p-8 text-center text-[#8892b0]">
              <div className="text-5xl mb-4 opacity-50 grayscale">🤝</div>
              <h3 className="font-rajdhani font-bold text-xl text-white mb-2">Oyuncu Seçimi</h3>
              <p className="text-sm">Transfer teklifi yapmak ve detayları görmek için listeden bir oyuncu seçin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
