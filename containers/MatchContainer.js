"use client";

import { useGameStore } from "@/store/gameStore";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ChampionMasterData from "@/lib/game/data";
import { MatchEngine } from "@/lib/game/match";
import { Pitch2D } from "@/lib/game/pitch2d";
import { getAudioEngine } from "@/lib/game/audio";
import { motion, AnimatePresence } from "framer-motion";

export function MatchContainer() {
  const router = useRouter();
  const { myClubId, week, fixtures, squad, lineup, tactics } = useGameStore();
  const [mounted, setMounted] = useState(false);
  const [engine, setEngine] = useState(null);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ home: {}, away: {} });
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [minute, setMinute] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const scrollRef = useRef(null);
  const [pitch, setPitch] = useState(null);

  const [aiData, setAiData] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiPostMatchReport, setAiPostMatchReport] = useState(null);
  const [isAiPostMatchLoading, setIsAiPostMatchLoading] = useState(false);

  // Devre Arası ve Oyuncu Değişikliği State'leri
  const [isHalfTime, setIsHalfTime] = useState(false);
  const [injuryPause, setInjuryPause] = useState(null);
  const [currentLineup, setCurrentLineup] = useState([]);
  const [subsLeft, setSubsLeft] = useState(5);
  const [selectedSubOut, setSelectedSubOut] = useState(null);
  const [selectedSubIn, setSelectedSubIn] = useState(null);
  const [currentTactics, setCurrentTactics] = useState(tactics || { style: 'balanced', press: 'medium', tempo: 'normal' });
  const [isMatchPaused, setIsMatchPaused] = useState(false);
  const [isUserPaused, setIsUserPaused] = useState(false);

  const [showPreMatchEvent, setShowPreMatchEvent] = useState(false);
  const [preMatchBoostApplied, setPreMatchBoostApplied] = useState(false);
  const [showInterview, setShowInterview] = useState(false);
  const [interviewAnswered, setInterviewAnswered] = useState(false);
  
  const [preMatchAiData, setPreMatchAiData] = useState(null);
  const [isPreMatchAiLoading, setIsPreMatchAiLoading] = useState(false);
  const [postMatchAiData, setPostMatchAiData] = useState(null);
  const [isPostMatchAiLoading, setIsPostMatchAiLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (mounted && !myClubId) {
      router.push("/");
    } else {
      setTimeout(() => {
        const canvas = document.getElementById('pitch-canvas');
        if (canvas) {
          const p = new Pitch2D('pitch-canvas');
          p.init();
          setPitch(p);
        }
      }, 100);
    }
  }, [myClubId, router, isFinished]);

  const fixture = fixtures.find(f => f.week === week && (f.homeClubId === myClubId || f.awayClubId === myClubId));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [events]);

  useEffect(() => {
    if (!mounted || !fixture || engine || isFinished || aiData || isAiLoading) return;
    
    const fetchAiPrematch = async () => {
      setIsAiLoading(true);
      try {
        const hClub = ChampionMasterData.clubs.find(c => c.id === fixture.homeClubId);
        const aClub = ChampionMasterData.clubs.find(c => c.id === fixture.awayClubId);
        const myTactics = useGameStore.getState().tactics || { style: 'balanced', press: 'medium', tempo: 'normal' };
        const hTactics = (fixture.homeClubId === myClubId) ? myTactics : { style: 'balanced', press: 'medium', tempo: 'normal' };
        
        const res = await fetch('/api/match-commentary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'prematch', homeClub: hClub, awayClub: aClub, homeTactics: hTactics })
        });
        const data = await res.json();
        setAiData(data);
      } catch (e) {
        console.error("AI Error:", e);
      }
      setIsAiLoading(false);
    };
    fetchAiPrematch();
  }, [mounted, fixture, engine, isFinished, aiData, isAiLoading, myClubId]);

  if (!mounted || !myClubId) return <div className="min-h-screen w-full"></div>;
  
  if (!fixture || (fixture.played && !isFinished)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="text-[80px] mb-6 opacity-50 grayscale">📅</div>
        <h2 className="text-3xl font-rajdhani font-bold text-white mb-2">Bu Hafta Maçınız Yok</h2>
        <p className="text-[#8892b0] mb-8">Takımınız bu haftayı bay geçiyor veya fikstür tamamlandı.</p>
        <button 
          onClick={() => router.push("/")}
          className="bg-gradient-to-r from-[#00c8ff] to-[#0090b8] text-white px-8 py-3 rounded-xl font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(0,200,255,0.3)] hover:scale-105 transition-transform"
        >
          Ana Ekrana Dön
        </button>
      </div>
    );
  }

  const isHome = fixture?.homeClubId === myClubId;
  const oppClubId = isHome ? fixture.awayClubId : fixture.homeClubId;
  const oppClub = ChampionMasterData.clubs.find(c => c.id === oppClubId);
  const myClub = ChampionMasterData.clubs.find(c => c.id === myClubId);
  const homeTeam = isHome ? myClub : oppClub;
  const awayTeam = isHome ? oppClub : myClub;

  const getPosLabel = (pos) => pos;

  useEffect(() => {
    if (oppClub && oppClub.prestige >= 7 && !showPreMatchEvent && minute === 0 && !engine) {
      const fetchPreMatchSpeech = async () => {
        setIsPreMatchAiLoading(true);
        setShowPreMatchEvent(true);
        try {
          const res = await fetch('/api/match-commentary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'prematch_speech', homeClub: homeTeam, awayClub: awayTeam })
          });
          const data = await res.json();
          setPreMatchAiData(data);
        } catch (e) {
          console.error("AI PreMatch Speech Error:", e);
        } finally {
          setIsPreMatchAiLoading(false);
        }
      };
      fetchPreMatchSpeech();
    }
  }, [oppClub]);

  const handlePreMatchBoost = () => {
    const bonus = preMatchAiData?.bonusAmount || 1000000;
    const { addIncome } = useGameStore.getState();
    addIncome(-bonus); 
    setPreMatchBoostApplied(true);
    setShowPreMatchEvent(false);
  };

  const handlePostMatchContinue = async () => {
    if (!interviewAnswered && Math.random() > 0.3) { // %70 ihtimalle basın toplantısı
      setIsPostMatchAiLoading(true);
      setShowInterview(true);
      try {
        const res = await fetch('/api/match-commentary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'postmatch_interview', homeClub: homeTeam, awayClub: awayTeam, score })
        });
        const data = await res.json();
        setPostMatchAiData(data);
      } catch (e) {
        console.error("AI PostMatch Interview Error:", e);
      } finally {
        setIsPostMatchAiLoading(false);
      }
    } else {
      router.push("/");
    }
  };

  const answerInterview = (positive) => {
    if (positive !== null) {
      useGameStore.setState(state => {
        const currentRep = state.manager?.reputation || 50;
        const newRep = Math.min(100, Math.max(0, currentRep + (positive ? 2 : -2)));
        return { manager: { ...state.manager, reputation: newRep } };
      });
    }
    setInterviewAnswered(true);
    setShowInterview(false);
    router.push("/");
  };

  const skipPreMatch = () => {
    setShowPreMatchEvent(false);
  };

  const startMatch = () => {
    if (isAiLoading || !fixture || !myClub || !oppClub) return;
    const audio = getAudioEngine();
    if (audio) audio.playStartWhistle();

    const myTactics = { ...(useGameStore.getState().tactics || { style: 'balanced', press: 'medium', tempo: 'normal' }) };
    if (preMatchBoostApplied) {
      myTactics.preMatchBoost = true;
    }

    const homeTactics = isHome ? myTactics : { style: 'balanced', press: 'medium', tempo: 'normal' };
    const awayTactics = isHome ? { style: 'balanced', press: 'medium', tempo: 'normal' } : myTactics;

    const state = useGameStore.getState();
    const oppSquad = ChampionMasterData.players.filter(p => p.clubId === oppClubId).map(p => ({
      ...p,
      fitness: 80 + Math.random() * 20,
      morale: 65 + Math.random() * 25
    }));
    
    const myClubPlayers = ChampionMasterData.players.filter(p => lineup.includes(p.id)).map(p => ({
      ...p,
      fitness: state.squadFitness[p.id] || 100,
      morale: state.morale || 70
    }));
    
    // CPU için otomatik taktikler belirleyebiliriz, şimdilik dengeli olsun
    const cpuTactics = { style: 'balanced', press: 'medium', tempo: 'normal' };
    const myTactics = useGameStore.getState().tactics || cpuTactics;

    setCurrentLineup([...lineup]);
    setCurrentTactics({ ...myTactics });
    setSubsLeft(5);

    const homeSquad = isHome ? myClubPlayers : oppSquad;
    const awaySquad = isHome ? oppSquad : myClubPlayers;
    
    const homeTactics = isHome ? myTactics : cpuTactics;
    const awayTactics = isHome ? cpuTactics : myTactics;

    const me = new MatchEngine(homeTeam, awayTeam, homeSquad, awaySquad, homeTactics, awayTactics, aiData);
    
    me.callbacks.playerInjured = (data) => {
      const isMyTeam = data.team === (homeTeam.id === myClubId ? 'home' : 'away');
      if (isMyTeam) {
        me.paused = true;
        setInjuryPause(data.player);
        setSelectedSubOut(data.player.id);
      }
    };

    if (pitch) pitch.reset();

    me.simulate(
      (data) => {
        if (data.type === 'tick') {
          setMinute(data.minute);
          setStats({ ...data.stats }); // Fix React reactivity
          setIsMatchPaused(me.paused);
          return;
        }

        setEvents(prev => [...prev, data.event]);
        setScore({ ...data.score });
        setStats({ ...data.stats });
        setMinute(data.minute);
        if (pitch) pitch.processEvent(data.event);
        
        // Event Sesleri
        if (audio) {
          if (data.event.type === 'goal') audio.playGoalSound();
          if (data.event.type === 'half_time' || data.event.id === 'half_time') {
            audio.playHalfTimeWhistle();
            setIsHalfTime(true);
          }
        }
      },
      (result) => {
        setIsFinished(true);
        if (audio) audio.playFullTimeWhistle();

        const { processMatchResult } = useGameStore.getState();
        processMatchResult({
          ...result,
          homeClubId: homeTeam.id,
          awayClubId: awayTeam.id
        }, true);

        // Fetch Post-Match Report
        setIsAiPostMatchLoading(true);
        fetch('/api/match-commentary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'postmatch',
            homeClub: homeTeam,
            awayClub: awayTeam,
            stats: result.stats,
            score: result.score,
            events: me.events
          })
        })
        .then(r => r.json())
        .then(data => { setAiPostMatchReport(data); setIsAiPostMatchLoading(false); })
        .catch(() => setIsAiPostMatchLoading(false));
      }
    );
    setEngine(me);
  };

  const handleSubstitution = () => {
    if (!selectedSubOut || !selectedSubIn || subsLeft <= 0) return;
    setCurrentLineup(prev => prev.filter(id => id !== selectedSubOut).concat(selectedSubIn));
    setSubsLeft(prev => prev - 1);
    const state = useGameStore.getState();
    const inPlayerRaw = ChampionMasterData.players.find(p => p.id === selectedSubIn);
    const inPlayer = {
      ...inPlayerRaw,
      fitness: state.squadFitness[selectedSubIn] || 100,
      morale: state.morale || 70
    };
    engine.substitute(isHome ? 'home' : 'away', selectedSubOut, inPlayer);
    setSelectedSubOut(null);
    setSelectedSubIn(null);
  };

  const autoSubstitute = () => {
    if (subsLeft <= 0) return;
    const engineSquad = isHome ? engine?.homeSquad : engine?.awaySquad;
    if (!engineSquad) return;
    
    let currentSubsLeft = subsLeft;
    let newLineup = [...currentLineup];
    
    // En yorgun oyuncuları bul
    const tiredPlayers = [...engineSquad]
      .filter(p => newLineup.includes(p.id))
      .sort((a, b) => a.matchFitness - b.matchFitness);
      
    // Yedekleri bul
    const benchIds = squad.filter(id => !newLineup.includes(id));
    const state = useGameStore.getState();
    const usedBenchIds = [];
    
    for (const tired of tiredPlayers) {
      if (currentSubsLeft <= 0) break;
      if (tired.matchFitness > 88) continue; // İlk yarıda yorulmuş olanlar genelde 80-85 civarına düşer
      
      const tiredData = ChampionMasterData.players.find(x => x.id === tired.id);
      if (!tiredData) continue;
      
      const availableBench = benchIds
        .filter(id => !usedBenchIds.includes(id))
        .map(id => ChampionMasterData.players.find(x => x.id === id))
        .filter(Boolean)
        .sort((a, b) => b.overall - a.overall);
        
      let bestSub = availableBench.find(p => p.position === tiredData.position);
      if (!bestSub) {
         if (['CB', 'LB', 'RB'].includes(tiredData.position)) bestSub = availableBench.find(p => ['CB', 'LB', 'RB'].includes(p.position));
         else if (['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(tiredData.position)) bestSub = availableBench.find(p => ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(p.position));
         else if (['ST', 'CF', 'LW', 'RW'].includes(tiredData.position)) bestSub = availableBench.find(p => ['ST', 'CF', 'LW', 'RW'].includes(p.position));
      }
      if (tiredData.position === 'GK') bestSub = availableBench.find(p => p.position === 'GK');
      
      if (bestSub) {
        newLineup = newLineup.map(id => id === tired.id ? bestSub.id : id);
        usedBenchIds.push(bestSub.id);
        
        const inPlayer = {
          ...bestSub,
          fitness: state.squadFitness[bestSub.id] || 100,
          morale: state.morale || 70
        };
        engine.substitute(isHome ? 'home' : 'away', tired.id, inPlayer);
        currentSubsLeft--;
      }
    }
    
    setCurrentLineup(newLineup);
    setSubsLeft(currentSubsLeft);
    setSelectedSubOut(null);
    setSelectedSubIn(null);
  };

  const resumeMatch = () => {
    if (injuryPause) {
      if (currentLineup.includes(injuryPause.id)) {
        // Eğer hala sahadaysa ve hakkımız yoksa 10 kişi devam etmeli (Bunu engine desteklemediği için mecburi şimdilik uyaralım)
        if (subsLeft > 0) {
          alert("Sakatlanan oyuncuyu değiştirmek zorundasınız!");
          return;
        }
      }
      setInjuryPause(null);
    }
    setIsHalfTime(false);
    setIsUserPaused(false);
    setIsMatchPaused(false);
    engine.updateTactics(isHome ? 'home' : 'away', currentTactics);
    engine.resume();
    const audio = getAudioEngine();
    if (audio) audio.playStartWhistle();
  };

  const togglePause = () => {
    if (!engine) return;
    if (engine.paused) {
      engine.resume();
      setIsMatchPaused(false);
    } else {
      engine.paused = true;
      setIsMatchPaused(true);
    }
  };

  const openTacticsMenu = () => {
    if (!engine) return;
    engine.paused = true;
    setIsMatchPaused(true);
    setIsUserPaused(true);
  };

  const fastForward = () => {
    if (!engine) return;
    engine.speed = 3;
    engine.resume();
    setIsMatchPaused(false);
  };

  // --- POST-MATCH SCREEN ---
  if (isFinished) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto pb-10"
      >
        <div className="bg-[#141b2d]/90 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden">
          <div className="p-8 text-center bg-black/40 border-b border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-[#00c8ff]/10 to-transparent opacity-50"></div>
            <h2 className="text-[10px] text-[#00c8ff] font-bold tracking-[4px] uppercase mb-2 relative z-10">Maç Sonucu</h2>
            
            <div className="flex items-center justify-center gap-8 md:gap-16 relative z-10 mt-6">
              {/* Home Team */}
              <div className="flex flex-col items-center w-32">
                <div className="w-24 h-24 rounded-full border-2 border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center text-3xl font-orbitron font-black text-white mb-4" style={{ background: `linear-gradient(135deg, ${homeTeam.colors.primary}, ${homeTeam.colors.secondary})` }}>
                  {homeTeam.shortName.slice(0,3)}
                </div>
                <div className="font-rajdhani font-bold text-xl text-white text-center leading-tight">{homeTeam.name}</div>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center">
                <div className="font-orbitron font-black text-6xl tracking-widest text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] bg-black/40 px-6 py-2 rounded-2xl border border-white/10">
                  {score.home} - {score.away}
                </div>
                <div className="mt-4 bg-white/10 px-4 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-[#8892b0] border border-white/5">
                  Tamamlandı
                </div>
              </div>

              {/* Away Team */}
              <div className="flex flex-col items-center w-32">
                <div className="w-24 h-24 rounded-full border-2 border-white/20 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center text-3xl font-orbitron font-black text-white mb-4" style={{ background: `linear-gradient(135deg, ${awayTeam.colors.primary}, ${awayTeam.colors.secondary})` }}>
                  {awayTeam.shortName.slice(0,3)}
                </div>
                <div className="font-rajdhani font-bold text-xl text-white text-center leading-tight">{awayTeam.name}</div>
              </div>
            </div>

            {/* AI Report */}
            {isAiPostMatchLoading ? (
              <div className="mt-8 text-center bg-black/40 p-4 rounded-xl border border-[#00c8ff]/20">
                <div className="animate-pulse text-[#00c8ff] font-rajdhani font-bold text-lg flex items-center justify-center gap-3">
                  <div className="w-4 h-4 rounded-full border-2 border-t-transparent border-[#00c8ff] animate-spin"></div>
                  Maç Sonu Basın Toplantısı Hazırlanıyor... 🎙️
                </div>
              </div>
            ) : aiPostMatchReport ? (
              <div className="mt-8 bg-black/40 p-6 rounded-xl border border-[#00c8ff]/20 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📰</div>
                <h3 className="font-rajdhani font-black text-2xl sm:text-3xl text-[#00c8ff] mb-3 leading-tight">{aiPostMatchReport.headline}</h3>
                <p className="text-[#e8eaf6] text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: aiPostMatchReport.report }}></p>
              </div>
            ) : null}
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Stats */}
            <div>
              <h3 className="text-[11px] font-bold text-[#8892b0] uppercase tracking-wider mb-6 text-center border-b border-white/5 pb-2">Maç İstatistikleri</h3>
              <div className="space-y-5">
                {[
                  { label: "Topla Oynama", h: stats.possession?.home || 50, a: stats.possession?.away || 50, isPct: true },
                  { label: "Şut", h: stats.shots?.home || 0, a: stats.shots?.away || 0 },
                  { label: "İsabetli Şut", h: stats.shotsOnTarget?.home || 0, a: stats.shotsOnTarget?.away || 0 },
                  { label: "Pas İsabeti", h: stats.passAccuracy?.home || 85, a: stats.passAccuracy?.away || 85, isPct: true }
                ].map((stat, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-white">{stat.h}{stat.isPct ? '%' : ''}</span>
                      <span className="text-[#8892b0] uppercase tracking-wider text-[10px]">{stat.label}</span>
                      <span className="text-white">{stat.a}{stat.isPct ? '%' : ''}</span>
                    </div>
                    <div className="flex h-1.5 w-full bg-black rounded-full overflow-hidden">
                      <div className="h-full bg-[#00c8ff]" style={{ width: `${(stat.h / (stat.h + stat.a || 1)) * 100}%` }}></div>
                      <div className="h-full bg-[#ff1744]" style={{ width: `${(stat.a / (stat.h + stat.a || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div>
              <h3 className="text-[11px] font-bold text-[#8892b0] uppercase tracking-wider mb-4 text-center border-b border-white/5 pb-2">Önemli Anlar</h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
                {events.filter(e => e.type === 'goal' || e.type === 'red_card').map((e, idx) => (
                  <div key={idx} className="flex gap-3 items-center bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className={`font-orbitron font-bold text-sm ${e.type === 'goal' ? 'text-[#00e676]' : 'text-[#ff1744]'}`}>
                      {e.minute}'
                    </div>
                    <div className="text-sm text-white flex-1" dangerouslySetInnerHTML={{ __html: e.text }}></div>
                    <div className="ml-auto text-lg shrink-0">{e.type === 'goal' ? '⚽' : '🟥'}</div>
                  </div>
                ))}
                {events.filter(e => e.type === 'goal' || e.type === 'red_card').length === 0 && (
                  <div className="text-center py-8 text-[#4a5568] text-sm">Gole veya kırmızı karta rastlanmadı.</div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 bg-black/40 border-t border-white/5 flex flex-col sm:flex-row justify-center gap-4">
            <button 
              className="px-8 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold tracking-widest uppercase hover:bg-white/10 transition-colors"
              onClick={() => { setIsFinished(false); setMinute(0); setEvents([]); setScore({home:0,away:0}); }}
            >
              📹 Tekrar İzle
            </button>
            <button 
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00c8ff] to-[#0090b8] text-white font-bold tracking-widest uppercase shadow-[0_0_20px_rgba(0,200,255,0.3)] hover:scale-105 transition-transform"
              onClick={handlePostMatchContinue}
            >
              Devam Et ➔
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (showInterview) {
    const isWin = score.home > score.away && isHome || score.away > score.home && !isHome;
    const isDraw = score.home === score.away;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-[#141b2d] border border-[#00c8ff]/30 w-full max-w-2xl rounded-3xl shadow-[0_0_50px_rgba(0,200,255,0.15)] overflow-hidden">
          <div className="bg-gradient-to-r from-[#00c8ff]/20 to-transparent p-6 border-b border-white/5 text-center">
            <h2 className="text-2xl font-orbitron font-bold text-white mb-2">🎤 Maç Sonu Basın Toplantısı</h2>
            <p className="text-[#8892b0] text-sm">Medya mensupları maçın gidişatı hakkında sorular soruyor...</p>
          </div>
          <div className="p-8 text-center space-y-6">
            {isPostMatchAiLoading ? (
              <div className="py-12 text-white animate-pulse">Gazeteciler toplanıyor, soru hazırlanıyor...</div>
            ) : (
              <>
                <div className="bg-black/30 p-6 rounded-2xl border border-white/5">
                  <p className="text-lg text-white font-rajdhani">
                    "{postMatchAiData?.question || (isWin ? 'Sayın Menajer, harika bir galibiyet aldınız! Takımınızın bugünkü performansı hakkında ne düşünüyorsunuz?' : isDraw ? 'Beklenmedik bir beraberlik oldu. Sahada eksik olan şey neydi?' : 'Taraftar bu mağlubiyetten dolayı oldukça öfkeli. Sorumluluğu üzerinize alıyor musunuz?')}"
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {postMatchAiData?.options ? postMatchAiData.options.map((opt, i) => (
                    <button 
                      key={i}
                      onClick={() => answerInterview(opt.type === 'positive' ? true : opt.type === 'negative' ? false : null)}
                      className={`px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border text-left flex items-center gap-3 ${
                        opt.type === 'positive' ? 'border-[#00e676]/30' : opt.type === 'negative' ? 'border-[#ff1744]/30' : 'border-white/10 text-[#8892b0]'
                      }`}
                    >
                      <span className="text-xl">{opt.type === 'positive' ? '✅' : opt.type === 'negative' ? '🔥' : '🤐'}</span> {opt.text}
                    </button>
                  )) : (
                    <>
                      <button 
                        onClick={() => answerInterview(true)}
                        className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-[#00e676]/30 text-left flex items-center gap-3"
                      >
                        <span className="text-xl">✅</span> Takımı öv ve destekle (Moral +)
                      </button>
                      <button 
                        onClick={() => answerInterview(false)}
                        className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-[#ff1744]/30 text-left flex items-center gap-3"
                      >
                        <span className="text-xl">🔥</span> Takımı sert eleştir veya hakeme yüklen (Riskli)
                      </button>
                      <button 
                        onClick={() => answerInterview(null)}
                        className="px-6 py-4 bg-white/5 hover:bg-white/10 text-[#8892b0] font-bold rounded-xl transition-colors border border-white/10 text-left flex items-center gap-3"
                      >
                        <span className="text-xl">🤐</span> Yorum Yok (Nötr)
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // --- LIVE MATCH SCREEN ---
  return (
    <div className="pb-10 h-full flex flex-col">
      {/* Scoreboard Header */}
      <div className="bg-[#141b2d]/90 backdrop-blur-xl rounded-2xl border border-white/5 shadow-lg p-4 sm:p-6 mb-4 sm:mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-6">
          <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
            <div className="text-right min-w-0">
              <div className="font-rajdhani font-bold text-base sm:text-2xl text-white truncate max-w-[100px] sm:max-w-none">{homeTeam.name}</div>
              <div className="text-[9px] sm:text-[10px] text-[#8892b0] uppercase tracking-widest">Ev Sahibi</div>
            </div>
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full border-2 border-white/10 flex items-center justify-center text-sm sm:text-xl font-orbitron font-black text-white shadow-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${homeTeam.colors.primary}, ${homeTeam.colors.secondary})` }}>
              {homeTeam.shortName.slice(0,3)}
            </div>
          </div>

          <div className="flex flex-col items-center mx-1 sm:mx-4">
            <div className="font-orbitron font-black text-3xl sm:text-5xl tracking-widest text-white drop-shadow-[0_0_15px_rgba(0,200,255,0.5)]">
              {score.home} - {score.away}
            </div>
            <div className="text-[#00c8ff] font-orbitron font-bold text-base sm:text-xl mt-1 sm:mt-2 animate-pulse">
              {minute}'
            </div>
          </div>

          <div className="flex items-center gap-3 flex-1 justify-start min-w-0">
            <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full border-2 border-white/10 flex items-center justify-center text-sm sm:text-xl font-orbitron font-black text-white shadow-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${awayTeam.colors.primary}, ${awayTeam.colors.secondary})` }}>
              {awayTeam.shortName.slice(0,3)}
            </div>
            <div className="text-left min-w-0">
              <div className="font-rajdhani font-bold text-base sm:text-2xl text-white truncate max-w-[100px] sm:max-w-none">{awayTeam.name}</div>
              <div className="text-[9px] sm:text-[10px] text-[#8892b0] uppercase tracking-widest">Deplasman</div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-gradient-to-r from-[#00c8ff] to-[#00e676] transition-all duration-1000 ease-linear shadow-[0_0_10px_#00c8ff]" style={{ width: `${(minute / 90) * 100}%` }}></div>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-4 w-full">
          {!engine && !showPreMatchEvent && (
            <button 
              disabled={isAiLoading}
              className={`px-8 py-3 rounded-xl font-bold tracking-widest uppercase flex items-center gap-2 transition-transform ${isAiLoading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#00e676] to-[#00b25c] text-white shadow-[0_0_20px_rgba(0,230,118,0.3)] hover:scale-105'}`}
              onClick={startMatch}
            >
              {isAiLoading ? 'Spiker Bağlantısı Kuruluyor...' : '▶️ Maça Başla'}
            </button>
          )}
          
          {!engine && showPreMatchEvent && (
            <div className="bg-[#141b2d] p-6 rounded-2xl border border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)] text-center w-full max-w-2xl mx-auto animate-pulse-slow">
              <h3 className="text-xl font-orbitron font-bold text-yellow-500 mb-2">📢 Başkanın Mesajı</h3>
              {isPreMatchAiLoading ? (
                <p className="text-white text-sm mb-4">Başkan arıyor, bekleniyor...</p>
              ) : (
                <>
                  <p className="text-white text-sm mb-4">"{preMatchAiData?.speech || 'Bugün bizim için çok kritik bir maç, adeta bir derbi! Sahaya çıkıp onlara kim olduğumuzu gösterin. Gerekirse çocuklara galibiyet primi dağıt, ama bu maçı al!'}"</p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={handlePreMatchBoost} className="px-6 py-2.5 bg-gradient-to-r from-yellow-400 to-yellow-600 hover:scale-105 text-black font-bold rounded-xl transition-transform shadow-[0_0_15px_rgba(234,179,8,0.4)]">
                      💰 {preMatchAiData?.bonusAmount ? preMatchAiData.bonusAmount.toLocaleString('tr-TR') : '1.000.000'} € Prim Dağıt
                    </button>
                    <button onClick={skipPreMatch} className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors border border-white/10">
                      Normal Çık (Geç)
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {engine && (
            <>
              <button 
                onClick={openTacticsMenu}
                className="bg-gradient-to-r from-[#00c8ff]/20 to-[#0090b8]/20 text-[#00c8ff] hover:bg-[#00c8ff]/30 border border-[#00c8ff]/50 px-6 py-3 rounded-xl font-bold tracking-widest uppercase transition-colors shadow-[0_0_15px_rgba(0,200,255,0.15)]"
              >
                🛠 Taktik & Oyuncu Değiştir
              </button>
              <button 
                onClick={togglePause}
                className={`px-6 py-3 rounded-xl font-bold tracking-widest uppercase border transition-colors ${
                  isMatchPaused 
                    ? 'bg-[#00e676]/20 text-[#00e676] border-[#00e676]/50 hover:bg-[#00e676]/30' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
                }`}
              >
                {isMatchPaused ? '▶️ Devam Et' : '⏸ Duraklat'}
              </button>
              <button 
                onClick={fastForward}
                className="bg-[#ff1744]/20 hover:bg-[#ff1744]/40 text-[#ff1744] border border-[#ff1744]/30 px-6 py-3 rounded-xl font-bold tracking-widest uppercase transition-colors"
              >
                ⏩ Hızlı Bitir
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 flex-1 min-h-[400px] sm:min-h-[500px]">
        {/* Left Side: Pitch & Match Engine */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Pitch 2D */}
          <div className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg p-4 flex justify-center items-center relative overflow-hidden h-[300px]">
            <div className="absolute inset-0 bg-gradient-to-b from-[#1c4d2c] to-[#12361d] opacity-50 z-0"></div>
            <canvas id="pitch-canvas" width="600" height="300" className="w-full h-full max-w-[600px] object-contain relative z-10 opacity-90"></canvas>
            
            {/* If not started */}
            {!engine && minute === 0 && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="text-[#8892b0] font-rajdhani font-bold text-xl tracking-widest uppercase">Maç Bekleniyor...</div>
              </div>
            )}
          </div>

          {/* Live Commentary Feed */}
          <div className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg flex-1 flex flex-col min-h-[300px]">
            <div className="px-6 py-4 border-b border-white/5 bg-black/20">
              <span className="font-rajdhani font-bold text-lg tracking-wider text-[#e8eaf6] uppercase flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff1744] animate-pulse"></span>
                Canlı Anlatım
              </span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3" ref={scrollRef}>
              <AnimatePresence>
                {[...events].reverse().map((e, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={events.length - idx} 
                    className="flex gap-4 p-3 bg-black/20 rounded-xl border border-white/5 hover:border-[#00c8ff]/30 transition-colors"
                  >
                    <div className="font-orbitron font-bold text-[#00c8ff] w-8 shrink-0">{e.minute}'</div>
                    <div className="text-[#e8eaf6] text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: e.text }}></div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {events.length === 0 && !engine && (
                <div className="h-full flex items-center justify-center text-center p-4">
                  {isAiLoading ? (
                    <div className="text-[#00c8ff] text-sm animate-pulse flex flex-col items-center gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-[#00c8ff] animate-spin"></div>
                      Canlı Yayın Ekibi Hazırlanıyor... 📡
                    </div>
                  ) : aiData ? (
                    <div className="text-[#e8eaf6] text-sm italic bg-[#00c8ff]/10 p-4 rounded-xl border border-[#00c8ff]/20">
                      🎙️ "{aiData.preview}"
                    </div>
                  ) : (
                    <div className="text-[#4a5568] text-sm">Maç başladığında önemli anlar burada akacak.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Live Stats */}
        <div className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg flex flex-col">
          <div className="px-6 py-4 border-b border-white/5 bg-black/20">
            <span className="font-rajdhani font-bold text-lg tracking-wider text-[#e8eaf6] uppercase">Anlık İstatistikler</span>
          </div>
          <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            {[
              { label: "Topla Oynama", h: stats.possession?.home || 50, a: stats.possession?.away || 50, isPct: true },
              { label: "Şut", h: stats.shots?.home || 0, a: stats.shots?.away || 0 },
              { label: "İsabetli Şut", h: stats.shotsOnTarget?.home || 0, a: stats.shotsOnTarget?.away || 0 },
              { label: "Korner", h: stats.corners?.home || 0, a: stats.corners?.away || 0 },
              { label: "Sarı Kart", h: stats.yellowCards?.home || 0, a: stats.yellowCards?.away || 0 },
              { label: "Faul", h: stats.fouls?.home || 0, a: stats.fouls?.away || 0 }
            ].map((stat, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-white">{stat.h}{stat.isPct ? '%' : ''}</span>
                  <span className="text-[#8892b0] uppercase tracking-wider text-[10px]">{stat.label}</span>
                  <span className="text-white">{stat.a}{stat.isPct ? '%' : ''}</span>
                </div>
                <div className="flex h-2 w-full bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-white/20 to-white" style={{ width: `${(stat.h / (stat.h + stat.a || 1)) * 100}%` }}></div>
                  <div className="h-full bg-gradient-to-l from-white/20 to-white opacity-50" style={{ width: `${(stat.a / (stat.h + stat.a || 1)) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Devre Arası / Sakatlık / Taktik Modalı */}
      {(isHalfTime || injuryPause || isUserPaused) && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#0f1629] w-full max-w-[1200px] h-full max-h-[92vh] flex flex-col rounded-3xl border border-[#00c8ff]/30 shadow-[0_0_60px_rgba(0,200,255,0.15)] relative overflow-hidden">
            
            {/* Dekoratif Efekt */}
            <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${injuryPause ? 'from-red-500/20' : 'from-[#00c8ff]/10'} to-transparent pointer-events-none`}></div>

            {/* Header */}
            <div className="p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 bg-black/20 flex-shrink-0 relative z-10">
              <div>
                <h2 className={`text-2xl sm:text-4xl font-rajdhani font-black text-transparent bg-clip-text bg-gradient-to-r ${injuryPause ? 'from-red-500 to-red-300' : 'from-white to-[#00c8ff]'} uppercase tracking-widest leading-none`}>
                  {injuryPause ? "Zorunlu Değişiklik" : isHalfTime ? "Devre Arası" : "Taktik Molası"}
                </h2>
                {injuryPause && (
                  <p className="text-red-400 mt-1 font-bold text-sm sm:text-base">
                    🚨 {injuryPause.lastName} sakatlandı ve oyuna devam edemiyor!
                  </p>
                )}
                <div className="text-sm sm:text-xl font-rajdhani font-bold text-[#e8eaf6] mt-2 flex items-center gap-2">
                  <span>{homeTeam.name}</span>
                  <span className="bg-black/50 px-3 py-1 rounded-lg text-[#00c8ff] border border-white/10">{score.home} - {score.away}</span>
                  <span>{awayTeam.name}</span>
                </div>
              </div>
              <button 
                onClick={resumeMatch}
                className={`w-full sm:w-auto bg-gradient-to-r ${injuryPause ? 'from-red-500 to-red-400 shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'from-[#00e676] to-[#00b25c] shadow-[0_0_20px_rgba(0,230,118,0.3)]'} text-white px-4 sm:px-8 py-3 sm:py-4 rounded-xl text-xs sm:text-base font-rajdhani font-black uppercase tracking-wider hover:scale-105 transition-all whitespace-normal text-center break-words`}
              >
                ▶ {injuryPause ? "Maça Devam Et" : "İkinci Yarıya Başla"}
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden p-5 sm:p-8 gap-6 sm:gap-8 relative z-10 custom-scrollbar">
              
              {/* Sol Kolon - Sahadakiler */}
              <div className="flex-1 flex flex-col bg-black/30 rounded-2xl border border-white/5 overflow-hidden min-h-[400px] lg:min-h-0 flex-shrink-0 lg:flex-shrink">
                <div className="p-4 sm:p-5 bg-black/40 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                  <h3 className="text-[#00c8ff] font-rajdhani font-bold text-sm sm:text-base uppercase tracking-wider">Sahadakiler</h3>
                  <span className="text-[10px] sm:text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-md font-bold uppercase">Oyundan Çıkart</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                    {currentLineup.map(pid => {
                      const p = ChampionMasterData.players.find(x => x.id === pid);
                      if (!p) return null;
                      const isSelected = selectedSubOut === pid;
                      const engineSquad = isHome ? engine?.homeSquad : engine?.awaySquad;
                      const matchPlayer = engineSquad?.find(x => x.id === pid);
                      const fitness = matchPlayer?.matchFitness !== undefined ? Math.round(matchPlayer.matchFitness) : 100;
                      
                      return (
                        <div 
                          key={pid}
                          onClick={() => setSelectedSubOut(isSelected ? null : pid)}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-red-500/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                        >
                          <div className="flex flex-col justify-center items-center w-10 sm:w-14">
                            <div className="font-orbitron font-bold text-xs sm:text-sm text-[#8892b0]">{p.position}</div>
                            {p.alternatePositions && p.alternatePositions.length > 0 && (
                              <div className="text-[7px] sm:text-[8px] text-[#4a5568] uppercase tracking-tighter truncate w-full text-center mt-0.5">
                                {p.alternatePositions.join(',')}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 font-rajdhani font-bold text-sm sm:text-base text-white truncate">
                            {p.firstName} {p.lastName}
                          </div>
                          
                          {/* Kondisyon Barı */}
                          <div className="w-16 sm:w-20 flex flex-col gap-1 items-end">
                            <span className={`text-[9px] font-bold ${fitness < 60 ? 'text-red-400' : fitness < 80 ? 'text-yellow-400' : 'text-[#00e676]'}`}>
                              %{fitness}
                            </span>
                            <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
                              <div className={`h-full ${fitness < 60 ? 'bg-red-500' : fitness < 80 ? 'bg-yellow-500' : 'bg-[#00e676]'}`} style={{ width: `${fitness}%` }}></div>
                            </div>
                          </div>

                          <div className="text-[#00c8ff] font-bold text-sm w-6 text-right">{p.overall}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sağ Kolon - Yedekler & Taktikler */}
              <div className="flex-1 flex flex-col gap-6 sm:gap-8 lg:overflow-hidden flex-shrink-0 lg:flex-shrink">
                
                {/* Yedekler */}
                <div className="flex-1 flex flex-col bg-black/30 rounded-2xl border border-white/5 overflow-hidden min-h-[400px] lg:min-h-0">
                  <div className="p-4 sm:p-5 bg-black/40 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-[#00c8ff] font-rajdhani font-bold text-sm sm:text-base uppercase tracking-wider">Yedek Kulübesi</h3>
                    <span className="text-[10px] sm:text-xs bg-[#00e676]/20 text-[#00e676] px-3 py-1 rounded-md font-bold uppercase">Oyuna Al</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                      {squad.filter(id => !currentLineup.includes(id)).map(pid => {
                        const p = ChampionMasterData.players.find(x => x.id === pid);
                        if (!p) return null;
                        const isSelected = selectedSubIn === pid;
                        const state = useGameStore.getState();
                        const fitness = state.squadFitness[pid] || 100;

                        return (
                          <div 
                            key={pid}
                            onClick={() => setSelectedSubIn(isSelected ? null : pid)}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? 'bg-[#00e676]/20 border-[#00e676]/50 shadow-[0_0_15px_rgba(0,230,118,0.2)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                          >
                            <div className="flex flex-col justify-center items-center w-10 sm:w-14">
                              <div className="font-orbitron font-bold text-xs sm:text-sm text-[#8892b0]">{p.position}</div>
                              {p.alternatePositions && p.alternatePositions.length > 0 && (
                                <div className="text-[7px] sm:text-[8px] text-[#4a5568] uppercase tracking-tighter truncate w-full text-center mt-0.5">
                                  {p.alternatePositions.join(',')}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 font-rajdhani font-bold text-sm sm:text-base text-white truncate">
                              {p.firstName} {p.lastName}
                            </div>
                            
                            <div className="w-16 sm:w-20 flex flex-col gap-1 items-end">
                              <span className={`text-[9px] font-bold ${fitness < 60 ? 'text-red-400' : fitness < 80 ? 'text-yellow-400' : 'text-[#00e676]'}`}>%{fitness}</span>
                              <div className="w-full h-1 bg-black/50 rounded-full overflow-hidden">
                                <div className={`h-full ${fitness < 60 ? 'bg-red-500' : fitness < 80 ? 'bg-yellow-500' : 'bg-[#00e676]'}`} style={{ width: `${fitness}%` }}></div>
                              </div>
                            </div>

                            <div className="text-[#00c8ff] font-bold text-sm w-6 text-right">{p.overall}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Taktik Paneli */}
                <div className="bg-black/40 rounded-2xl border border-[#00c8ff]/20 p-5 sm:p-6 flex-shrink-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="text-sm text-[#8892b0] flex items-center gap-3">
                      Değişiklik Hakkı: <span className="bg-white/10 text-white px-3 py-1 rounded-lg font-bold text-lg">{subsLeft}</span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={autoSubstitute}
                        className="bg-gradient-to-r from-[#f5c842]/20 to-[#d4a017]/20 border border-[#f5c842]/50 text-[#f5c842] hover:bg-[#f5c842]/30 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex-1 sm:flex-none shadow-[0_0_15px_rgba(245,200,66,0.1)] transition-colors"
                      >
                        ⚡ Otomatik
                      </button>
                      <button 
                        disabled={!selectedSubOut || !selectedSubIn || subsLeft <= 0}
                        onClick={handleSubstitution}
                        className="bg-[#00c8ff] text-black px-4 sm:px-6 py-3 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white transition-all shadow-[0_0_15px_rgba(0,200,255,0.2)] flex-1 sm:flex-none"
                      >
                        Onayla
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <select 
                      value={currentTactics.style} 
                      onChange={e => setCurrentTactics({...currentTactics, style: e.target.value})}
                      className="bg-[#0f1629] text-white border border-white/10 rounded-xl p-3 text-sm font-rajdhani outline-none focus:border-[#00c8ff] transition-colors"
                    >
                      <option value="balanced">Dengeli</option>
                      <option value="counter">Kontra Atak</option>
                      <option value="park">Kapalı Savunma</option>
                      <option value="press">Önde Baskı</option>
                      <option value="possession">Topa Sahip Olma</option>
                      <option value="longball">Uzun Top</option>
                    </select>
                    <select 
                      value={currentTactics.press} 
                      onChange={e => setCurrentTactics({...currentTactics, press: e.target.value})}
                      className="bg-[#0f1629] text-white border border-white/10 rounded-xl p-3 text-sm font-rajdhani outline-none focus:border-[#00c8ff] transition-colors"
                    >
                      <option value="high">Baskı: Önde</option>
                      <option value="medium">Baskı: Orta</option>
                      <option value="low">Baskı: Geride</option>
                    </select>
                    <select 
                      value={currentTactics.tempo} 
                      onChange={e => setCurrentTactics({...currentTactics, tempo: e.target.value})}
                      className="bg-[#0f1629] text-white border border-white/10 rounded-xl p-3 text-sm font-rajdhani outline-none focus:border-[#00c8ff] transition-colors"
                    >
                      <option value="fast">Tempo: Hızlı</option>
                      <option value="normal">Tempo: Normal</option>
                      <option value="slow">Tempo: Yavaş</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
