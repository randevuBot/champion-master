"use client";

import { useGameStore } from "@/store/gameStore";
import { formatMoney } from "@/lib/game/utils";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STAFF_ROLES = [
  { id: 'assistant', title: 'Asistan Menajer', icon: '👔', desc: 'Taktiksel zekayı artırır ve takım uyumuna +1.5 bonus sağlar.' },
  { id: 'coach', title: 'Antrenör', icon: '⚽', desc: 'Takımın hücum ve savunma antrenmanlarını yönetir. Takım reytingine +2 bonus sağlar.' },
  { id: 'gkCoach', title: 'Kaleci Antrenörü', icon: '🧤', desc: 'Kalecilerin reflekslerini geliştirir. Takım reytingine +1 bonus sağlar.' },
  { id: 'fitnessCoach', title: 'Kondisyoner', icon: '🏃‍♂️', desc: 'Maç içi yorulmaları yavaşlatır. Takım reytingine +0.5 bonus sağlar.' },
];

export function StaffContainer() {
  const { myClubId, staff, finances, hireStaff, fireStaff, availableStaff } = useGameStore();
  const [activeTab, setActiveTab] = useState('assistant');
  const [selectedStaffInfo, setSelectedStaffInfo] = useState(null);

  if (!myClubId) return null;

  const handleHire = (role, candidate) => {
    if (finances.balance >= candidate.fee) {
      if (confirm(`${candidate.name} ile anlaşılsın mı? (İmza Parası: ${formatMoney(candidate.fee)})`)) {
        hireStaff(role, candidate);
      }
    } else {
      alert("Bu personel için yeterli bütçeniz bulunmuyor.");
    }
  };

  const handleFire = (role) => {
    if (confirm("Bu personelin işine son verilecek. Emin misiniz?")) {
      fireStaff(role);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6 bg-card/80 p-6 sm:p-8 rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary opacity-[0.03] blur-[80px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">👔</span>
            <h1 className="text-3xl sm:text-4xl font-rajdhani font-bold text-white uppercase tracking-wider">Teknik Ekip</h1>
          </div>
          <p className="text-muted-foreground text-sm">Takımınızın potansiyelini maksimize etmek için uzman personeller işe alın.</p>
        </div>
        <div className="bg-background px-6 py-4 rounded-xl border border-white/10 flex flex-col shrink-0">
          <span className="text-[10px] text-muted-foreground tracking-[2px] uppercase mb-1">Mevcut Bütçe</span>
          <span className="font-orbitron font-bold text-2xl text-green">{formatMoney(finances.balance)}</span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sol Menü: Roller */}
        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2">
          {STAFF_ROLES.map(role => (
            <button
              key={role.id}
              onClick={() => setActiveTab(role.id)}
              className={`p-4 rounded-xl border transition-all text-left flex items-center gap-3 ${activeTab === role.id ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(0,200,255,0.1)]' : 'bg-card border-white/5 hover:bg-white/5 hover:border-white/10'}`}
            >
              <span className="text-2xl">{role.icon}</span>
              <div>
                <div className={`font-bold ${activeTab === role.id ? 'text-primary' : 'text-white'}`}>{role.title}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
                  {staff[role.id] ? staff[role.id].name : 'Boş Pozisyon'}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Sağ Panel: Aktif Rol Detayı ve Adaylar */}
        <div className="flex-1 bg-card rounded-2xl border border-white/5 p-6 relative overflow-hidden">
          <AnimatePresence mode="wait">
            {STAFF_ROLES.map((role) => activeTab === role.id && (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
                  <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-3xl shrink-0 shadow-inner">
                    {role.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-rajdhani font-bold text-white uppercase">{role.title}</h2>
                    <p className="text-muted-foreground text-sm mt-1 leading-relaxed max-w-xl">{role.desc}</p>
                  </div>
                </div>

                {/* Mevcut Personel */}
                <div className="mb-8">
                  <div className="text-[11px] font-bold text-muted tracking-[3px] uppercase mb-4">Mevcut Personel</div>
                  {staff[role.id] ? (
                    <div className={`p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg relative overflow-hidden ${staff[role.id].isPremium ? 'bg-gradient-to-r from-[#1a1600] to-[#2a2400] border-gold/50' : 'bg-gradient-to-r from-[#0a0e1a] to-[#141b2d] border-primary/20'}`}>
                      <div className={`absolute top-0 right-0 bottom-0 w-1 ${staff[role.id].isPremium ? 'bg-gold shadow-[0_0_15px_var(--color-gold)]' : 'bg-primary shadow-[0_0_10px_var(--color-primary)]'}`}></div>
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-orbitron font-bold border ${staff[role.id].isPremium ? 'bg-gold/20 text-gold border-gold/50 shadow-[0_0_10px_rgba(245,200,66,0.3)]' : 'bg-primary/10 text-primary border-primary/30'}`}>
                          {staff[role.id].rating}
                        </div>
                        <div>
                          <div className="font-bold text-white text-lg flex items-center gap-2">
                            {staff[role.id].name}
                            {staff[role.id].isPremium && <span className="text-xs bg-gold/20 text-gold border border-gold/30 px-2 py-0.5 rounded uppercase font-bold tracking-widest shadow-[0_0_8px_rgba(245,200,66,0.2)]">Elit</span>}
                            <button 
                              onClick={() => setSelectedStaffInfo(staff[role.id])}
                              className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white hover:bg-primary transition-colors ml-1"
                              title="Bilgi"
                            >
                              i
                            </button>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">Maaş: <span className="text-white">{formatMoney(staff[role.id].salary)}</span> / Hafta</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleFire(role.id)}
                        className="px-6 py-2.5 rounded-xl border border-red-500/30 text-red-400 font-bold text-sm tracking-wider hover:bg-red-500 hover:text-white transition-colors"
                      >
                        Sözleşmeyi Feshet
                      </button>
                    </div>
                  ) : (
                    <div className="bg-background p-6 rounded-xl border border-dashed border-white/10 text-center flex flex-col items-center justify-center h-24">
                      <span className="text-muted-foreground text-sm">Bu pozisyon şu an boş. Aşağıdaki adaylardan birini işe alabilirsiniz.</span>
                    </div>
                  )}
                </div>

                {/* Aday Listesi */}
                <div>
                  <div className="text-[11px] font-bold text-muted tracking-[3px] uppercase mb-4">Piyasadaki Adaylar (Aylık Yenilenir)</div>
                  <div className="space-y-3">
                    {availableStaff && availableStaff[role.id] && availableStaff[role.id].filter(c => staff[role.id]?.id !== c.id).map(candidate => (
                      <div key={candidate.id} className={`p-4 rounded-xl border transition-colors flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden ${candidate.isPremium ? 'bg-[#1a1600] border-gold/40 hover:bg-[#2a2400] hover:border-gold/60 shadow-[0_0_15px_rgba(245,200,66,0.05)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/20'}`}>
                        {candidate.isPremium && <div className="absolute -right-4 -top-4 w-16 h-16 bg-gold opacity-[0.05] blur-xl rounded-full"></div>}
                        
                        <div className="flex items-center gap-4 w-full sm:w-auto z-10">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-orbitron font-bold border ${candidate.isPremium ? 'bg-gold/20 text-gold border-gold/50 shadow-[0_0_10px_rgba(245,200,66,0.3)]' : 'bg-white/10 text-white border-white/20'}`}>
                            {candidate.rating}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              {candidate.name}
                              {candidate.isPremium && <span className="text-[9px] bg-gold text-black px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Premium</span>}
                              <button 
                                onClick={() => setSelectedStaffInfo(candidate)}
                                className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white hover:bg-primary transition-colors ml-1"
                                title="Bilgi"
                              >
                                i
                              </button>
                            </div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                              İmza: <span className="text-gold">{formatMoney(candidate.fee)}</span> • Maaş: <span className="text-primary">{formatMoney(candidate.salary)}</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleHire(role.id, candidate)}
                          disabled={staff[role.id] !== null || finances.balance < candidate.fee}
                          className={`w-full sm:w-auto px-6 py-2 rounded-lg font-bold text-sm tracking-widest uppercase transition-all z-10 ${staff[role.id] !== null ? 'bg-white/5 text-white/30 cursor-not-allowed' : finances.balance < candidate.fee ? 'bg-red-500/10 text-red-500 cursor-not-allowed border border-red-500/20' : (candidate.isPremium ? 'bg-gradient-to-r from-gold to-[#d4af37] text-black shadow-[0_0_15px_rgba(245,200,66,0.3)] hover:scale-105' : 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-[0_0_15px_rgba(0,200,255,0.2)] hover:scale-105')}`}
                        >
                          İşe Al
                        </button>
                      </div>
                    ))}
                    {(!availableStaff || !availableStaff[role.id] || availableStaff[role.id].length === 0) && (
                      <div className="text-center py-6 text-muted-foreground text-sm italic">Şu an piyasada uygun aday bulunmuyor. Gelecek ayı bekleyin.</div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Personel Detay Modalı */}
      <AnimatePresence>
        {selectedStaffInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedStaffInfo(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-secondary border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-primary/20 to-transparent p-6 border-b border-white/5 relative">
                <button 
                  onClick={() => setSelectedStaffInfo(null)}
                  className="absolute top-4 right-4 text-muted-foreground hover:text-white"
                >
                  ✕
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-background border-2 border-primary flex items-center justify-center text-2xl font-orbitron font-black text-white shadow-[0_0_15px_rgba(0,200,255,0.3)]">
                    {selectedStaffInfo.rating}
                  </div>
                  <div>
                    <h3 className="text-2xl font-rajdhani font-bold text-white">{selectedStaffInfo.name}</h3>
                    <div className="text-xs text-primary font-bold tracking-widest uppercase mt-1">Teknik Ekip Profili</div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-background p-4 rounded-xl border border-white/5 text-center">
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="font-orbitron font-bold text-2xl text-gold">{selectedStaffInfo.championships}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Şampiyonluk</div>
                  </div>
                  <div className="bg-background p-4 rounded-xl border border-white/5 text-center">
                    <div className="text-3xl mb-2">⭐</div>
                    <div className="font-orbitron font-bold text-2xl text-white">{selectedStaffInfo.rating}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Yetenek Puanı</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-muted-foreground tracking-[2px] uppercase mb-3 border-b border-white/5 pb-2">Kariyer Geçmişi</div>
                  <ul className="space-y-2">
                    {selectedStaffInfo.history && selectedStaffInfo.history.length > 0 ? (
                      selectedStaffInfo.history.map((h, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          <span className="text-white text-sm">{h}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-muted-foreground italic">Geçmiş kariyer bilgisi bulunmuyor.</li>
                    )}
                  </ul>
                </div>
              </div>
              
              <div className="p-4 bg-black/20 border-t border-white/5">
                <button 
                  onClick={() => setSelectedStaffInfo(null)}
                  className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-sm tracking-wider uppercase transition-colors"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
