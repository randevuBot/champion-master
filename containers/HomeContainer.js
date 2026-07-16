"use client";

import { useGameStore } from "@/store/gameStore";
import { useEffect, useState } from "react";
import ChampionMasterData from "@/lib/game/data";
import { formatMoney } from "@/lib/game/utils";
import { motion, AnimatePresence } from "framer-motion";

export function HomeContainer() {
  const { myClubId, initGame, resetGame, setPlaying } = useGameStore();
  
  const [screen, setScreen] = useState("splash"); 
  const [splashProgress, setSplashProgress] = useState(0);
  const [splashText, setSplashText] = useState("Yükleniyor...");
  
  const [managerName, setManagerName] = useState("");
  const [difficulty, setDifficulty] = useState("normal");
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [activeLeagueTab, setActiveLeagueTab] = useState("superlig");

  useEffect(() => {
    if (screen === "splash") {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 30) setSplashText("Veritabanı başlatılıyor...");
        if (progress > 60) setSplashText("Ligler kuruluyor...");
        if (progress > 85) setSplashText("Menajer profiliniz hazırlanıyor...");
        
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => setScreen("menu"), 500);
        }
        setSplashProgress(progress);
      }, 150);
      return () => clearInterval(interval);
    }
  }, [screen]);

  const handleContinue = () => {
    if (myClubId) {
      setPlaying(true);
    }
  };

  const handleStartNewGame = () => {
    resetGame();
    setScreen("setup");
  };

  const handleConfirmClub = () => {
    if (selectedClubId) {
      initGame(selectedClubId, managerName);
    }
  };

  const filteredClubs = ChampionMasterData.clubs.filter(c => c.leagueId === activeLeagueTab);
  const selectedClub = ChampionMasterData.clubs.find(c => c.id === selectedClubId);
  const selectedClubPlayers = selectedClubId ? ChampionMasterData.players.filter(p => p.clubId === selectedClubId) : [];
  const avgRating = selectedClubPlayers.length > 0
    ? Math.round(selectedClubPlayers.reduce((s, p) => s + p.overall, 0) / selectedClubPlayers.length)
    : 0;

  return (
    <div className="relative w-full h-screen min-h-screen overflow-hidden text-white bg-[#080c14] font-inter selection:bg-[#00c8ff]/30">
      <AnimatePresence mode="wait">
        
        {/* SPLASH SCREEN */}
        {screen === "splash" && (
          <motion.div 
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-[#0a0e1a]"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#00c8ff]/10 via-[#0a0e1a] to-[#0a0e1a]"></div>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="relative z-10 text-center"
            >
              <div className="text-[64px] drop-shadow-[0_0_15px_rgba(0,200,255,0.6)] mb-2 animate-pulse">⚽</div>
              <h1 className="text-4xl md:text-6xl font-orbitron font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00c8ff] mb-2 drop-shadow-[0_0_10px_rgba(0,200,255,0.3)]">
                CHAMPIONMASTER
              </h1>
              <div className="text-[#00c8ff] tracking-[4px] uppercase text-sm md:text-base font-semibold mb-12">Efsanevi Menajerlik Deneyimi</div>
              
              <div className="w-64 md:w-96 mx-auto">
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-3 shadow-[inset_0_1px_3px_rgba(0,0,0,0.5)] border border-white/5">
                  <div className="h-full bg-gradient-to-r from-[#00c8ff] to-white rounded-full shadow-[0_0_10px_#00c8ff]" style={{ width: `${splashProgress}%` }}></div>
                </div>
                <div className="text-xs text-[#8892b0] uppercase tracking-[2px]">{splashText}</div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MAIN MENU */}
        {screen === "menu" && (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="absolute inset-0 z-40 bg-[#0a0e1a]"
          >
            {/* Background Image Overlay equivalent */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1518605368461-1ee134d16851?q=80&w=2000')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e1a] via-[#0a0e1a]/90 to-transparent"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00c8ff]/10 blur-[100px] rounded-full mix-blend-screen"></div>

            <div className="relative z-10 w-full h-full max-w-7xl mx-auto flex items-center p-8 md:p-16">
              <div className="flex-1 max-w-2xl">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
                  <h1 className="text-6xl md:text-[80px] leading-none font-orbitron font-black tracking-tighter text-white mb-4 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                    CHAMPION<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c8ff] to-white">MASTER</span>
                  </h1>
                  <div className="inline-block bg-[#00c8ff]/20 border border-[#00c8ff]/40 text-[#00c8ff] px-4 py-1.5 rounded-full text-xs font-bold tracking-[3px] shadow-[0_0_15px_rgba(0,200,255,0.2)] mb-8">
                    SEZON 2025/26
                  </div>
                  <p className="text-[#8892b0] text-lg md:text-xl leading-relaxed mb-10 max-w-lg">
                    Takımını kur, taktiğini belirle, yıldızları transfer et ve dünyanın en iyi menajeri ol.
                  </p>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 mb-12">
                  <button 
                    disabled={!myClubId}
                    onClick={handleContinue}
                    className={`px-8 py-4 rounded-xl font-bold tracking-widest uppercase transition-all shadow-lg border ${
                      myClubId 
                        ? 'bg-[#0f1629]/80 border-[#00c8ff]/50 text-white hover:bg-[#00c8ff]/10 hover:border-[#00c8ff] shadow-[0_0_20px_rgba(0,200,255,0.15)]' 
                        : 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                    }`}
                  >
                    Kariyerine Devam Et
                  </button>
                  <button 
                    onClick={handleStartNewGame}
                    className="px-8 py-4 rounded-xl font-bold tracking-widest uppercase transition-all shadow-lg border border-transparent bg-gradient-to-r from-[#f5c842] to-[#c99a00] text-black hover:scale-105 hover:shadow-[0_0_25px_rgba(245,200,66,0.4)]"
                  >
                    ⚽ Yeni Kariyere Başla
                  </button>
                </motion.div>

                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="flex gap-8 border-t border-white/10 pt-8">
                  <div>
                    <div className="font-orbitron text-3xl font-bold text-white">450+</div>
                    <div className="text-[10px] text-[#8892b0] tracking-[2px] uppercase mt-1">Oyuncu</div>
                  </div>
                  <div>
                    <div className="font-orbitron text-3xl font-bold text-[#00c8ff]">10+</div>
                    <div className="text-[10px] text-[#8892b0] tracking-[2px] uppercase mt-1">Kulüp</div>
                  </div>
                  <div>
                    <div className="font-orbitron text-3xl font-bold text-[#f5c842]">3</div>
                    <div className="text-[10px] text-[#8892b0] tracking-[2px] uppercase mt-1">Lig</div>
                  </div>
                </motion.div>
              </div>

              <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="hidden lg:block flex-1 pl-16">
                <div className="text-[11px] font-bold text-[#4a5568] tracking-[3px] uppercase mb-4">Son Haberler & Güncellemeler</div>
                
                <div className="bg-[#141b2d]/60 backdrop-blur-xl p-6 rounded-2xl border border-white/5 mb-4 hover:bg-[#141b2d]/80 transition-colors cursor-pointer group">
                  <div className="bg-[#00c8ff]/20 text-[#00c8ff] text-[9px] font-bold px-2 py-1 rounded inline-block tracking-widest mb-3 border border-[#00c8ff]/30">GÜNCELLEME V1.0</div>
                  <div className="text-[#e8eaf6] text-lg font-rajdhani font-semibold leading-tight group-hover:text-[#00c8ff] transition-colors">Süper Lig, Premier League ve La Liga eklendi! Gerçekçi kart tasarımları ve canlı maç motoru devrede.</div>
                  <div className="text-xs text-[#4a5568] mt-3">Bugün</div>
                </div>

                <div className="bg-[#141b2d]/60 backdrop-blur-xl p-6 rounded-2xl border border-white/5 hover:bg-[#141b2d]/80 transition-colors cursor-pointer group">
                  <div className="bg-[#f5c842]/20 text-[#f5c842] text-[9px] font-bold px-2 py-1 rounded inline-block tracking-widest mb-3 border border-[#f5c842]/30">İPUCU</div>
                  <div className="text-[#e8eaf6] text-lg font-rajdhani font-semibold leading-tight group-hover:text-[#f5c842] transition-colors">Akademi oyuncularını A takıma almadan önce gelişimlerini takip et.</div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* SETUP SCREEN */}
        {screen === "setup" && (
          <motion.div 
            key="setup"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="absolute inset-0 z-40 bg-[#0a0e1a] flex items-center justify-center p-4"
          >
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#00c8ff]/10 to-transparent blur-3xl pointer-events-none"></div>
            
            <div className="w-full max-w-md bg-[#141b2d]/90 backdrop-blur-xl border border-white/10 rounded-[24px] shadow-[0_24px_64px_rgba(0,0,0,0.6)] relative z-10 overflow-hidden">
              <div className="p-8">
                <div className="text-center mb-8">
                  <span className="text-[10px] text-[#00c8ff] font-bold tracking-[3px] uppercase">Adım 1 / 2</span>
                  <h2 className="text-3xl font-rajdhani font-bold text-white mt-1">Menajer Profilin</h2>
                  <p className="text-[#8892b0] text-sm mt-1">Kariyerine başlamadan önce kendini tanıt</p>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-[#8892b0] uppercase tracking-wider mb-2">👤 Adın</label>
                    <input 
                      type="text" 
                      className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00c8ff] focus:ring-1 focus:ring-[#00c8ff]/50 transition-all"
                      placeholder="Menajer adını gir..." 
                      value={managerName} 
                      onChange={e => setManagerName(e.target.value)} 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-[#8892b0] uppercase tracking-wider mb-2">🌍 Uyruk</label>
                    <select className="w-full bg-[#0a0e1a] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#00c8ff] appearance-none cursor-pointer">
                      <option>🇹🇷 Türk</option>
                      <option>🏴󠁧󠁢󠁥󠁮󠁧󠁿 İngiliz</option>
                      <option>🇪🇸 İspanyol</option>
                      <option>🇩🇪 Alman</option>
                      <option>🇮🇹 İtalyan</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-[#8892b0] uppercase tracking-wider mb-2">🎯 Oyun Zorluğu</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${difficulty === 'easy' ? 'bg-[#00c8ff]/10 border-[#00c8ff] text-white shadow-[0_0_10px_rgba(0,200,255,0.2)]' : 'bg-[#0a0e1a] border-white/5 text-[#8892b0] hover:border-white/20'}`} onClick={() => setDifficulty('easy')}>
                        <span className="text-xl">😊</span><span className="text-[10px] font-bold uppercase tracking-wider">Kolay</span>
                      </button>
                      <button className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${difficulty === 'normal' ? 'bg-[#f5c842]/10 border-[#f5c842] text-white shadow-[0_0_10px_rgba(245,200,66,0.2)]' : 'bg-[#0a0e1a] border-white/5 text-[#8892b0] hover:border-white/20'}`} onClick={() => setDifficulty('normal')}>
                        <span className="text-xl">⚽</span><span className="text-[10px] font-bold uppercase tracking-wider">Normal</span>
                      </button>
                      <button className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all ${difficulty === 'hard' ? 'bg-[#ff1744]/10 border-[#ff1744] text-white shadow-[0_0_10px_rgba(255,23,68,0.2)]' : 'bg-[#0a0e1a] border-white/5 text-[#8892b0] hover:border-white/20'}`} onClick={() => setDifficulty('hard')}>
                        <span className="text-xl">🔥</span><span className="text-[10px] font-bold uppercase tracking-wider">Zor</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/20 p-6 border-t border-white/5 flex gap-3">
                <button className="px-6 py-3.5 rounded-xl text-[#8892b0] font-bold text-sm hover:text-white transition-colors" onClick={() => setScreen("menu")}>← Geri</button>
                <button 
                  className={`flex-1 py-3.5 rounded-xl font-bold text-sm tracking-wider uppercase transition-all shadow-lg ${managerName ? 'bg-gradient-to-r from-[#00c8ff] to-[#0090b8] text-white hover:scale-[1.02]' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                  disabled={!managerName} 
                  onClick={() => setScreen("club-select")}
                >
                  Kulüp Seç →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* CLUB SELECT SCREEN */}
        {screen === "club-select" && (
          <motion.div 
            key="club-select"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute inset-0 z-40 bg-[#0a0e1a] flex flex-col"
          >
            <div className="h-[90px] shrink-0 border-b border-white/5 bg-[#141b2d] flex items-center justify-between px-8">
              <div>
                <div className="text-[10px] text-[#00c8ff] font-bold tracking-[3px] uppercase">Adım 2 / 2</div>
                <h2 className="text-2xl font-rajdhani font-bold text-white">Kulübünü Seç</h2>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-[#8892b0] text-sm font-bold hover:text-white px-4" onClick={() => setScreen("setup")}>Geri Dön</button>
                <button 
                  className={`px-8 py-3 rounded-xl font-bold tracking-widest uppercase transition-all shadow-lg ${selectedClubId ? 'bg-gradient-to-r from-[#00c8ff] to-[#0090b8] text-white hover:scale-105 shadow-[0_0_20px_rgba(0,200,255,0.3)] border border-white/20' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
                  disabled={!selectedClubId} 
                  onClick={handleConfirmClub}
                >
                  Bu Kulüple Başla ➔
                </button>
              </div>
            </div>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Left Side: Grid */}
              <div className="flex-1 flex flex-col border-r border-white/5 bg-[#080c14]">
                <div className="flex p-4 gap-2 border-b border-white/5 overflow-x-auto">
                  <button className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wider whitespace-nowrap transition-colors ${activeLeagueTab === 'superlig' ? 'bg-[#00c8ff]/20 text-[#00c8ff] border border-[#00c8ff]/30' : 'bg-[#141b2d] text-[#8892b0] border border-white/5 hover:text-white'}`} onClick={() => setActiveLeagueTab('superlig')}>🇹🇷 Süper Lig</button>
                  <button className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wider whitespace-nowrap transition-colors ${activeLeagueTab === 'premier' ? 'bg-[#00c8ff]/20 text-[#00c8ff] border border-[#00c8ff]/30' : 'bg-[#141b2d] text-[#8892b0] border border-white/5 hover:text-white'}`} onClick={() => setActiveLeagueTab('premier')}>🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League</button>
                  <button className={`px-6 py-2.5 rounded-full text-sm font-bold tracking-wider whitespace-nowrap transition-colors ${activeLeagueTab === 'laliga' ? 'bg-[#00c8ff]/20 text-[#00c8ff] border border-[#00c8ff]/30' : 'bg-[#141b2d] text-[#8892b0] border border-white/5 hover:text-white'}`} onClick={() => setActiveLeagueTab('laliga')}>🇪🇸 La Liga</button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredClubs.map(club => {
                      const isSelected = selectedClubId === club.id;
                      return (
                        <motion.div 
                          whileHover={{ y: -4 }}
                          whileTap={{ scale: 0.98 }}
                          key={club.id} 
                          className={`bg-[#141b2d] border rounded-2xl p-5 cursor-pointer transition-all ${isSelected ? 'border-[#00c8ff] shadow-[0_0_20px_rgba(0,200,255,0.15)] ring-1 ring-[#00c8ff]' : 'border-white/5 hover:border-white/20'}`}
                          onClick={() => setSelectedClubId(club.id)}
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-orbitron font-black text-white shadow-lg shrink-0 border border-white/10" style={{ background: `linear-gradient(135deg, ${club.colors.primary}, ${club.colors.secondary})` }}>
                              {club.shortName.slice(0,3)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-rajdhani font-bold text-lg text-white truncate">{club.name}</div>
                              <div className="text-[11px] text-[#8892b0] tracking-wider uppercase truncate">📍 {club.city}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 mb-4">
                            {Array.from({length: 5}, (_, i) => (
                              <span key={i} className={`text-sm ${i < club.prestige ? 'text-[#f5c842]' : 'text-white/10'}`}>★</span>
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3">
                            <div>
                              <div className="text-[10px] text-[#4a5568] uppercase tracking-wider">Bütçe</div>
                              <div className="font-orbitron font-bold text-[#00e676] text-xs">{formatMoney(club.budget * 1000000)}</div>
                            </div>
                            <div>
                              <div className="text-[10px] text-[#4a5568] uppercase tracking-wider">Stadyum</div>
                              <div className="font-bold text-[#8892b0] text-xs truncate">{club.stadium}</div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Side: Preview */}
              <div className="w-[400px] shrink-0 bg-[#0f1629] relative overflow-y-auto custom-scrollbar">
                {selectedClub ? (
                  <motion.div 
                    key={selectedClub.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 text-center"
                  >
                    <div className="w-32 h-32 mx-auto rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center justify-center text-5xl font-orbitron font-black text-white mb-6 border-2 border-white/10" style={{ background: `linear-gradient(135deg, ${selectedClub.colors.primary}, ${selectedClub.colors.secondary})` }}>
                      {selectedClub.shortName.slice(0,3)}
                    </div>
                    
                    <h3 className="text-3xl font-rajdhani font-bold text-white mb-1">{selectedClub.name}</h3>
                    <div className="text-xs text-[#8892b0] tracking-[2px] uppercase mb-8">📍 {selectedClub.city} • EST. {selectedClub.founded}</div>
                    
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div className="bg-[#141b2d] p-4 rounded-xl border border-white/5 shadow-inner">
                        <div className="font-orbitron text-xl font-bold text-[#00c8ff]">{formatMoney(selectedClub.budget * 1000000)}</div>
                        <div className="text-[10px] text-[#8892b0] tracking-[2px] uppercase mt-1">Bütçe</div>
                      </div>
                      <div className="bg-[#141b2d] p-4 rounded-xl border border-white/5 shadow-inner">
                        <div className="font-orbitron text-xl font-bold text-[#f5c842]">{avgRating}</div>
                        <div className="text-[10px] text-[#8892b0] tracking-[2px] uppercase mt-1">Ort. Yetenek</div>
                      </div>
                      <div className="bg-[#141b2d] p-4 rounded-xl border border-white/5 shadow-inner">
                        <div className="font-orbitron text-xl font-bold text-white">{selectedClubPlayers.length}</div>
                        <div className="text-[10px] text-[#8892b0] tracking-[2px] uppercase mt-1">Kadro Boyutu</div>
                      </div>
                      <div className="bg-[#141b2d] p-4 rounded-xl border border-white/5 shadow-inner">
                        <div className="text-base text-[#f5c842] tracking-widest">
                          {'★'.repeat(Math.min(5, selectedClub.prestige))}
                          {selectedClub.prestige > 5 && <span className="text-xs ml-1">+{selectedClub.prestige - 5}</span>}
                        </div>
                        <div className="text-[10px] text-[#8892b0] tracking-[2px] uppercase mt-1">Prestij</div>
                      </div>
                    </div>
                    
                    <div className="mt-6 bg-[#141b2d]/50 border border-white/5 rounded-xl p-5 flex items-center gap-4 text-left">
                      <div className="text-3xl">🏟️</div>
                      <div>
                        <div className="font-bold text-white text-sm">{selectedClub.stadium}</div>
                        <div className="text-[#8892b0] text-[11px] mt-0.5">{selectedClub.capacity.toLocaleString()} Kapasite</div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                    <div className="text-[80px] mb-6 grayscale opacity-30">🏟️</div>
                    <p className="text-[#8892b0] text-lg font-rajdhani">Detayları görmek için sol taraftan<br/>bir kulüp seçin</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
