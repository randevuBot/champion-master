"use client";

import { useGameStore } from "@/store/gameStore";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ChampionMasterData from "@/lib/game/data";
import { GameEngine } from "@/lib/game/engine";
import { motion, AnimatePresence } from "framer-motion";

const getBand = (slot) => {
  if (slot === 'GK') return 'GK';
  if (['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(slot)) return 'DEF';
  if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(slot)) return 'MID';
  return 'ATT';
};

const getDynamicBand = (y) => {
  if (y > 82) return 'GK';
  if (y > 60) return 'DEF';
  if (y > 35) return 'MID';
  return 'ATT';
};

const getPositionPenalty = (player, y) => {
  if (!player) return 0;
  const currentBand = getDynamicBand(y);
  
  // 1. Ana mevkisine uygun mu?
  if (getBand(player.position) === currentBand) return 0;
  
  // 2. İkinci veya üçüncü mevkisine uygun mu?
  if (player.alternatePositions && player.alternatePositions.length > 0) {
    const hasAltBandMatch = player.alternatePositions.some(altPos => getBand(altPos) === currentBand);
    if (hasAltBandMatch) return 3; // Yan mevkisinde oynuyorsa çok az düşüş (-3)
  }
  
  // Hiçbir mevkisine uymuyor
  return 15; // Tamamen yabancı bölge (-15)
};

export function TacticsContainer() {
  const router = useRouter();
  const { myClubId, squad, lineup, setLineup, formation, setFormation, customPositions, setCustomPositions, tactics, setTactics } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(null);
  const [selectedReserveId, setSelectedReserveId] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const pitchRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    if (mounted && !myClubId) router.push("/");
  }, [myClubId, router, mounted]);

  if (!mounted || !myClubId) return <div className="min-h-screen w-full"></div>;

  const clubPlayers = ChampionMasterData.players.filter(p => squad.includes(p.id));
  const slots = GameEngine.getFormationSlots(formation);
  
  let currentLineup = [...lineup];
  while(currentLineup.length < 11) currentLineup.push(null);

  const reserves = clubPlayers.filter(p => !currentLineup.includes(p.id));

  // Auto-spacing calculation for default coordinates
  const bandY = { GK: 90, DEF: 75, MID: 45, ATT: 20 };
  const bands = { GK: [], DEF: [], MID: [], ATT: [] };
  slots.forEach((s, idx) => bands[getBand(s)].push(idx));
  
  const defaultCoords = [];
  slots.forEach((s, idx) => {
    const b = getBand(s);
    const bandMembers = bands[b];
    const posInBand = bandMembers.indexOf(idx);
    const xSpacing = 100 / (bandMembers.length + 1);
    defaultCoords[idx] = { x: xSpacing * (posInBand + 1), y: bandY[b] };
  });

  // Calculate actual position (custom or default)
  const getPlayerPosition = (playerId, idx) => {
    const safeCustomPositions = customPositions || {};
    if (playerId && safeCustomPositions[playerId]) {
      return safeCustomPositions[playerId];
    }
    return defaultCoords[idx] || { x: 50, y: 50 }; // Fallback
  };

  const handleTacticChange = (style) => {
    setTactics({ style });
    
    // Apply tactical shifts to positions
    const newPositions = {};
    const safeCustomPositions = customPositions || {};
    
    slots.forEach((s, idx) => {
      const playerId = currentLineup[idx];
      if (!playerId) return;
      
      let basePos = defaultCoords[idx];
      
      // If they had a custom position, use it as base for X, but we'll recalculate Y based on tactic
      if (safeCustomPositions[playerId]) {
        basePos = { ...safeCustomPositions[playerId] };
      } else {
        basePos = { ...defaultCoords[idx] };
      }
      
      const band = getBand(s);
      
      if (style === 'park') {
        // Kapalı Savunma: Herkes geriye çekilir
        if (band === 'DEF') basePos.y = Math.min(95, basePos.y + 10);
        if (band === 'MID') basePos.y = Math.min(80, basePos.y + 15);
        if (band === 'ATT') basePos.y = Math.min(60, basePos.y + 20);
      } else if (style === 'counter') {
        // Kontra Atak: Savunma geride, forvetler ileride
        if (band === 'DEF') basePos.y = Math.min(90, basePos.y + 5);
        if (band === 'MID') basePos.y = Math.min(70, basePos.y + 5);
        if (band === 'ATT') basePos.y = Math.max(10, basePos.y - 15);
      } else if (style === 'press') {
        // Önde Baskı: Herkes ileri çıkar
        if (band === 'DEF') basePos.y = Math.max(45, basePos.y - 15);
        if (band === 'MID') basePos.y = Math.max(25, basePos.y - 15);
        if (band === 'ATT') basePos.y = Math.max(5, basePos.y - 10);
      } else if (style === 'possession') {
        // Topa Sahip Olma: Takım boyu kısalır
        if (band === 'DEF') basePos.y = Math.max(60, basePos.y - 10);
        if (band === 'ATT') basePos.y = Math.min(30, basePos.y + 5);
      } else if (style === 'longball') {
        // Uzun Top: Forvetler ileride, defans geride
        if (band === 'DEF') basePos.y = Math.min(90, basePos.y + 5);
        if (band === 'ATT') basePos.y = Math.max(5, basePos.y - 10);
      } else {
        // Dengeli: Orijinal dizilim Y koordinatlarına dön
        basePos.y = defaultCoords[idx].y;
      }
      
      newPositions[playerId] = basePos;
    });
    
    setCustomPositions(newPositions);
  };

  // Live Team Strength Calculation
  const calculateStrength = () => {
    let total = 0;
    let count = 0;
    currentLineup.forEach((pId, idx) => {
      const p = clubPlayers.find(x => x.id === pId);
      if (p) {
        const pos = getPlayerPosition(pId, idx);
        let val = p.overall;
        val -= getPositionPenalty(p, pos.y);
        total += val;
        count++;
      }
    });
    return count > 0 ? Math.round(total / count) : 0;
  };

  const teamStrength = calculateStrength();

  const handleAskAI = async () => {
    setIsLoadingAi(true);
    setAiAnalysis(null);
    try {
      const playersData = currentLineup.map((pId, idx) => {
        const p = clubPlayers.find(x => x.id === pId);
        if (!p) return null;
        const pos = getPlayerPosition(pId, idx);
        return { name: p.lastName, naturalPos: p.position, x: pos.x, y: pos.y };
      }).filter(Boolean);

      const res = await fetch("/api/analyze-tactics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: playersData, teamStrength })
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else setAiAnalysis(data.analysis);
    } catch (err) {
      alert("Yapay zeka ile bağlantı kurulamadı.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleDragEnd = (event, info, playerId) => {
    if (!pitchRef.current) return;
    const rect = pitchRef.current.getBoundingClientRect();
    
    // info.point is the absolute pointer coordinate relative to the viewport
    const clientX = info.point.x;
    const clientY = info.point.y;
    
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    
    let newPx = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));
    let newPy = Math.max(0, Math.min(100, (relativeY / rect.height) * 100));
    
    const safeCustomPositions = customPositions || {};
    setCustomPositions({ ...safeCustomPositions, [playerId]: { x: newPx, y: newPy } });
  };

  const handleReserveClick = (playerId) => {
    if (selectedSlotIndex !== null) {
      const newLineup = [...currentLineup];
      newLineup[selectedSlotIndex] = playerId;
      setLineup(newLineup.filter(id => id !== null));
      setSelectedSlotIndex(null);
      return;
    }
    if (selectedReserveId === playerId) setSelectedReserveId(null);
    else setSelectedReserveId(playerId);
  };

  const handleSlotClick = (index) => {
    if (selectedReserveId !== null) {
      const newLineup = [...currentLineup];
      newLineup[index] = selectedReserveId;
      setLineup(newLineup.filter(id => id !== null));
      setSelectedReserveId(null);
      return;
    }

    if (selectedSlotIndex !== null) {
      if (selectedSlotIndex === index) {
        setSelectedSlotIndex(null);
      } else {
        const newLineup = [...currentLineup];
        const p1Id = newLineup[index];
        const p2Id = newLineup[selectedSlotIndex];
        
        // Swap in lineup
        newLineup[index] = p2Id;
        newLineup[selectedSlotIndex] = p1Id;
        setLineup(newLineup.filter(id => id !== null));
        
        // Swap custom positions so they physically trade places on the pitch
        const safeCustomPositions = customPositions || {};
        const newCustomPos = { ...safeCustomPositions };
        const p1Pos = safeCustomPositions[p1Id];
        const p2Pos = safeCustomPositions[p2Id];
        
        if (p2Pos) newCustomPos[p1Id] = p2Pos;
        else delete newCustomPos[p1Id];
        
        if (p1Pos) newCustomPos[p2Id] = p1Pos;
        else delete newCustomPos[p2Id];
        
        setCustomPositions(newCustomPos);
        setSelectedSlotIndex(null);
      }
    } else {
      setSelectedSlotIndex(index);
    }
  };

  const autoFillLineup = () => {
    const style = tactics?.style || 'balanced';
    const newLineup = GameEngine.autoSelectLineup(clubPlayers, formation, [], style);
    setLineup(newLineup);
    setCustomPositions({});
    setSelectedSlotIndex(null);
    setSelectedReserveId(null);
  };

  const getRatingColor = (overall) => {
    if (overall >= 85) return 'text-gold';
    if (overall >= 75) return 'text-green';
    if (overall >= 65) return 'text-primary';
    return 'text-muted-foreground';
  };

  return (
    <div className="pb-10">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-[32px] font-rajdhani font-bold tracking-wide text-white mb-1">Taktik ve Formasyon</h2>
          <p className="text-muted-foreground text-[15px]">Oyuncuları sahada dilediğiniz yere sürükleyerek kendi sisteminizi yaratın</p>
        </div>

        <div className="bg-card border border-white/5 p-4 rounded-2xl shadow-lg flex items-center gap-6">
          <div>
            <div className="text-[10px] text-muted tracking-[2px] uppercase mb-1">Takım Gücü</div>
            <div className={`font-orbitron font-bold text-3xl flex items-center gap-2 ${teamStrength >= 80 ? 'text-green' : teamStrength >= 70 ? 'text-gold' : 'text-destructive'}`}>
              {teamStrength}
              {teamStrength < 70 && <span className="text-sm bg-destructive/20 px-2 py-0.5 rounded text-destructive">⚠️ Zayıf</span>}
            </div>
          </div>
          <div className="w-[1px] h-10 bg-white/5"></div>
          <div>
            <div className="text-[10px] text-muted tracking-[2px] uppercase mb-1">Takım Uyumu</div>
            <div className={`font-orbitron font-bold text-3xl flex items-center gap-2 ${(useGameStore.getState().chemistry || 85) >= 80 ? 'text-primary' : (useGameStore.getState().chemistry || 85) >= 60 ? 'text-gold' : 'text-destructive'}`}>
              {(useGameStore.getState().chemistry || 85)}%
            </div>
          </div>
          <div className="w-[1px] h-10 bg-white/5"></div>
          <div>
            <div className="text-[10px] text-muted tracking-[2px] uppercase mb-1">Diziliş</div>
            <div className="font-orbitron font-bold text-xl text-white">{formation}</div>
          </div>
        </div>
      </div>

      {aiAnalysis && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background/90 backdrop-blur-md rounded-2xl border border-primary/30 shadow-[0_0_20px_rgba(0,200,255,0.2)] p-6 mb-6 relative"
        >
          <button onClick={() => setAiAnalysis(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-white">✕</button>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-[#7c3aed] flex items-center justify-center text-xl shadow-[0_0_15px_rgba(0,200,255,0.4)]">🤖</div>
            <h3 className="font-rajdhani font-bold text-xl text-white">Yapay Zeka Yardımcı Antrenör</h3>
          </div>
          <div className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {aiAnalysis}
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Pitch */}
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 bg-card p-4 rounded-2xl border border-white/5 shadow-lg">
            <select 
              className="bg-background border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary font-bold tracking-wide cursor-pointer w-full sm:w-auto"
              value={formation}
              onChange={(e) => {
                setFormation(e.target.value);
                setCustomPositions({});
                setSelectedSlotIndex(null);
                setSelectedReserveId(null);
              }}
            >
              <option value="4-3-3">4-3-3 (Ofansif)</option>
              <option value="4-4-2">4-4-2 (Klasik)</option>
              <option value="4-2-3-1">4-2-3-1 (Dengeli)</option>
              <option value="3-5-2">3-5-2 (Kanat Atak)</option>
              <option value="3-4-3">3-4-3 (Ultra Ofansif)</option>
            </select>
            
            <select 
              className="bg-background border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#7c3aed] font-bold tracking-wide cursor-pointer w-full sm:w-auto"
              value={tactics?.style || 'balanced'}
              onChange={(e) => handleTacticChange(e.target.value)}
            >
              <option value="balanced">Dengeli</option>
              <option value="counter">Kontra Atak</option>
              <option value="park">Kapalı Savunma</option>
              <option value="press">Önde Baskı</option>
              <option value="possession">Topa Sahip Olma</option>
              <option value="longball">Uzun Top</option>
            </select>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={handleAskAI}
                disabled={isLoadingAi}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-primary/50 bg-gradient-to-r from-primary/20 to-primary-dark/20 text-primary hover:bg-primary/30 font-bold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(0,200,255,0.1)] transition-colors flex items-center justify-center gap-2"
              >
                {isLoadingAi ? 'Analiz Ediliyor...' : '🤖 YZ Yorumu Al'}
              </button>
              <button 
                onClick={autoFillLineup}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl border border-[#7c3aed]/50 bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] text-white font-bold text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:scale-105 transition-transform flex items-center justify-center gap-2"
              >
                <span>⚡</span> Otomatik Kur
              </button>
            </div>
          </div>

          {/* Interactive Drag & Drop Pitch */}
          <div 
            ref={pitchRef}
            className="relative w-full aspect-[2/3] max-h-[800px] bg-gradient-to-b from-[#1c4d2c] to-[#12361d] rounded-2xl border-4 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Pitch Lines SVG */}
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <svg viewBox="0 0 100 150" className="w-full h-full">
                <rect x="0" y="0" width="100" height="150" fill="none" stroke="white" strokeWidth="0.5"/>
                <rect x="20" y="0" width="60" height="25" fill="none" stroke="white" strokeWidth="0.5"/>
                <rect x="35" y="0" width="30" height="8" fill="none" stroke="white" strokeWidth="0.5"/>
                <path d="M 35 25 A 15 15 0 0 0 65 25" fill="none" stroke="white" strokeWidth="0.5"/>
                <rect x="20" y="125" width="60" height="25" fill="none" stroke="white" strokeWidth="0.5"/>
                <rect x="35" y="142" width="30" height="8" fill="none" stroke="white" strokeWidth="0.5"/>
                <path d="M 65 125 A 15 15 0 0 0 35 125" fill="none" stroke="white" strokeWidth="0.5"/>
                <line x1="0" y1="75" x2="100" y2="75" stroke="white" strokeWidth="0.5"/>
                <circle cx="50" cy="75" r="15" fill="none" stroke="white" strokeWidth="0.5"/>
              </svg>
            </div>

            {/* Draggable Players */}
            {currentLineup.map((playerId, idx) => {
              const player = clubPlayers.find(p => p.id === playerId);
              const pos = getPlayerPosition(playerId, idx);
              const isSelected = selectedSlotIndex === idx;
              const penalty = getPositionPenalty(player, pos.y);
              const isWrongPos = penalty === 15;
              const isAltPos = penalty > 0 && penalty < 15;
              // Critical Fix: Bind key to coordinate so Framer Motion forgets drag transforms
              const uniqueKey = playerId ? `player-${playerId}-${pos.x}-${pos.y}` : `empty-${idx}`;

              return (
                <div 
                  key={uniqueKey}
                  className="absolute z-10 touch-none select-none"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <motion.div
                    drag
                    dragMomentum={false}
                    dragConstraints={pitchRef}
                    dragElastic={0}
                    onDragEnd={(e, info) => {
                      if (playerId) handleDragEnd(e, info, playerId);
                    }}
                    onTap={() => handleSlotClick(idx)}
                    className="flex flex-col items-center group cursor-grab active:cursor-grabbing relative touch-none select-none"
                  >
                    <div className={`w-10 h-10 md:w-12 md:h-12 bg-card rounded-full flex items-center justify-center font-orbitron font-bold transition-all shadow-[0_4px_15px_rgba(0,0,0,0.5)] z-10
                      ${isSelected ? 'ring-4 ring-[#f5c842] scale-110 shadow-[0_0_20px_rgba(245,200,66,0.6)]' : 'border border-primary/50 hover:scale-110 hover:border-primary'}
                      ${isWrongPos ? 'bg-destructive/20 border-destructive' : isAltPos ? 'bg-yellow-500/20 border-yellow-500' : ''}
                    `}>
                      {player ? (
                        <span className={getRatingColor(player.overall)}>{player.overall}</span>
                      ) : (
                        <span className="text-white/20 text-xs">{slots[idx]}</span>
                      )}
                    </div>
                    {isWrongPos && (
                      <div className="absolute -top-2 -right-2 bg-destructive text-white text-[8px] font-bold px-1 rounded-sm z-20 shadow-lg">⚠️</div>
                    )}
                    {isAltPos && (
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-[8px] font-bold px-1 rounded-sm z-20 shadow-lg">⚠️</div>
                    )}
                    {player && (
                      <>
                        <div className="mt-1 bg-black/80 backdrop-blur-sm border border-white/10 px-2 py-0.5 rounded text-[10px] font-bold text-white tracking-widest uppercase truncate max-w-[70px] pointer-events-none">
                          {player.lastName}
                        </div>
                        <div className="text-[9px] text-primary font-bold tracking-widest mt-0.5 bg-primary/10 px-1 rounded flex gap-1 pointer-events-none">
                          <span className="opacity-50">{getDynamicBand(pos.y)}</span>
                          <span>{player.position}</span>
                        </div>
                      </>
                    )}
                  </motion.div>
                </div>
              );
            })}

            {/* Selection Instruction Overlay */}
            <AnimatePresence>
              {(selectedSlotIndex !== null || selectedReserveId !== null) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-gold shadow-[0_0_20px_rgba(245,200,66,0.3)] z-30 pointer-events-none"
                >
                  <span className="text-gold font-bold text-sm tracking-wide">Değiştirmek için başka bir oyuncuya tıklayın</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Reserves */}
        <div className="flex flex-col gap-6">
          <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg flex-1 overflow-hidden flex flex-col max-h-[800px]">
            <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
              <span className="font-rajdhani font-bold text-lg tracking-wider text-foreground uppercase">Yedekler ({reserves.length})</span>
            </div>
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
              <AnimatePresence>
                {reserves.sort((a, b) => b.overall - a.overall).map(p => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={p.id} 
                    onClick={() => handleReserveClick(p.id)}
                    className={`flex justify-between items-center p-3 rounded-xl border cursor-pointer transition-all ${selectedReserveId === p.id ? 'bg-gold/10 border-gold shadow-[0_0_15px_rgba(245,200,66,0.2)] scale-[1.02]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs border border-white/10 shadow-inner">👤</div>
                      <div>
                        <div className="text-sm font-bold text-white leading-tight">{p.lastName}</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="text-[10px] text-primary font-bold tracking-widest bg-primary/10 px-1.5 py-0.5 rounded inline-block">{p.position}</div>
                          {p.alternatePositions && p.alternatePositions.length > 0 && (
                            <div className="text-[9px] text-muted-foreground bg-white/5 border border-white/10 px-1.5 py-0.5 rounded inline-block truncate max-w-[60px]">
                              {p.alternatePositions.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="font-orbitron font-bold text-gold text-lg">{p.overall}</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
