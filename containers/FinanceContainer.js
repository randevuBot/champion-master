"use client";

import { useGameStore } from "@/store/gameStore";
import { formatMoney } from "@/lib/game/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export function FinanceContainer() {
  const { finances, myClubId, acceptSponsorOffer, upgradeFacility, organizeEvent } = useGameStore();
  const [activeTab, setActiveTab] = useState('overview');

  if (!myClubId) return null;

  const tabs = [
    { id: 'overview', label: 'Finansal Özet', icon: '🏦' },
    { id: 'sponsors', label: 'Sponsorluklar', icon: '🤝' },
    { id: 'facilities', label: 'Tesisler', icon: '🏢' },
    { id: 'events', label: 'Etkinlikler', icon: '🎟️' }
  ];

  return (
    <div className="pb-10 min-h-screen">
      <div className="mb-5 sm:mb-6">
        <h2 className="text-2xl sm:text-[32px] font-rajdhani font-bold tracking-wide text-white mb-1">Kulüp Merkezi</h2>
        <p className="text-muted-foreground text-sm sm:text-[15px]">Finans, Sponsorluk ve Tesis Yönetimi</p>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto custom-scrollbar gap-2 mb-6 pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-all whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-primary text-black shadow-[0_0_15px_rgba(0,200,255,0.4)] scale-105' 
                : 'bg-white/5 text-muted-foreground hover:bg-white/10'}`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Total Balance Card */}
              <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-green/30 shadow-[0_10px_30px_rgba(0,230,118,0.1)] p-6 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-[100px] opacity-[0.03] font-orbitron font-black text-green pointer-events-none">€</div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-green/10 flex items-center justify-center text-green text-xl border border-green/20">💰</div>
                  <h3 className="font-rajdhani font-bold text-lg text-white">Genel Bakiye</h3>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-[2px] mb-4">Mevcut Kasa</div>
                <div className="font-orbitron font-bold text-4xl text-green drop-shadow-[0_0_15px_rgba(0,230,118,0.4)]">
                  {formatMoney(finances?.balance || 0)}
                </div>
              </div>

              {/* Transfer Budget Card */}
              <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-primary/30 shadow-[0_10px_30px_rgba(0,200,255,0.1)] p-6 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-[100px] opacity-[0.03] font-orbitron font-black text-primary pointer-events-none">🤝</div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl border border-primary/20">🤝</div>
                  <h3 className="font-rajdhani font-bold text-lg text-white">Transfer Bütçesi</h3>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-[2px] mb-4">Yeni Oyuncular İçin</div>
                <div className="font-orbitron font-bold text-4xl text-primary drop-shadow-[0_0_15px_rgba(0,200,255,0.4)]">
                  {formatMoney(finances?.transferBudget || 0)}
                </div>
              </div>

              {/* Wage Budget Card */}
              <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-gold/30 shadow-[0_10px_30px_rgba(245,200,66,0.1)] p-6 relative overflow-hidden">
                <div className="absolute -right-4 -bottom-4 text-[100px] opacity-[0.03] font-orbitron font-black text-gold pointer-events-none">💳</div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold text-xl border border-gold/20">💳</div>
                  <h3 className="font-rajdhani font-bold text-lg text-white">Maaş Bütçesi</h3>
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-[2px] mb-4">Haftalık Limit</div>
                <div className="font-orbitron font-bold text-3xl sm:text-4xl text-gold drop-shadow-[0_0_15px_rgba(245,200,66,0.4)] mb-2">
                  {formatMoney(finances?.wageBudget || 0)}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Kullanılan:</span>
                  <span className="text-white font-bold">{formatMoney(finances?.weeklyWages || 0)}</span>
                </div>
                
                <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden mt-2 border border-white/5">
                  <div 
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, ((finances?.weeklyWages || 0) / (finances?.wageBudget || 1)) * 100)}%`,
                      background: ((finances?.weeklyWages || 0) / (finances?.wageBudget || 1)) > 0.9 ? '#ff1744' : '#f5c842',
                      boxShadow: '0 0 10px rgba(245,200,66,0.5)'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Income/Expense Breakdown */}
            <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                <span className="font-rajdhani font-bold text-lg tracking-wider text-foreground uppercase">Sezonluk Bilanço & Akış</span>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-background rounded-xl p-5 border border-green/20 relative overflow-hidden">
                    <div className="text-[10px] text-muted uppercase tracking-wider mb-2 font-bold">Toplam Gelir</div>
                    <div className="font-orbitron font-bold text-2xl text-green">{formatMoney(finances?.seasonRevenue || 0)}</div>
                  </div>
                  <div className="bg-background rounded-xl p-5 border border-destructive/20 relative overflow-hidden">
                    <div className="text-[10px] text-muted uppercase tracking-wider mb-2 font-bold">Toplam Gider</div>
                    <div className="font-orbitron font-bold text-2xl text-destructive">{formatMoney(finances?.seasonExpenses || 0)}</div>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-muted-foreground font-bold text-sm uppercase tracking-wider mb-4">Son Finansal İşlemler</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                    {(finances?.history || []).slice(0, 10).map((h, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] bg-black/50 px-2 py-1 rounded text-white/50">{h.week}. Hafta</span>
                          <span className="text-sm font-rajdhani font-bold text-white">{h.reason}</span>
                        </div>
                        <span className={`font-orbitron font-bold text-sm ${h.type === 'income' ? 'text-green' : 'text-destructive'}`}>
                          {h.type === 'income' ? '+' : '-'}{formatMoney(h.amount)}
                        </span>
                      </div>
                    ))}
                    {(!finances?.history || finances.history.length === 0) && (
                      <div className="text-center text-white/30 text-sm py-4">Henüz finansal hareket yok.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: SPONSORLAR */}
        {activeTab === 'sponsors' && (
          <motion.div 
            key="sponsors"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Mevcut Sponsorlar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Forma Sponsoru */}
              <div className="bg-card/80 rounded-2xl border border-white/5 p-6">
                <h3 className="font-rajdhani font-bold text-lg text-white mb-4 flex items-center gap-2">👕 Forma Sponsoru</h3>
                {finances?.sponsors?.shirt ? (
                  <div className="bg-gradient-to-r from-blue-900/40 to-black/40 p-5 rounded-xl border border-blue-500/30 text-center relative overflow-hidden">
                    <div className="font-rajdhani font-black text-2xl sm:text-3xl text-white mb-2 relative z-10 truncate px-2">{finances.sponsors.shirt.name}</div>
                    <div className="flex justify-center gap-6 mt-4 relative z-10">
                      <div>
                        <div className="text-[10px] text-white/50 uppercase tracking-wider">Haftalık Gelir</div>
                        <div className="text-green font-bold text-lg">+{formatMoney(finances.sponsors.shirt.valuePerWeek)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/50 uppercase tracking-wider">Kalan Süre</div>
                        <div className="text-white font-bold text-lg">{finances.sponsors.shirt.duration} Hafta</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/30 p-8 rounded-xl border border-white/5 text-center text-white/40 flex flex-col items-center justify-center h-[160px]">
                    <div className="text-3xl mb-2">🏢</div>
                    <p className="text-sm font-bold">Şu an forma sponsorunuz yok.</p>
                  </div>
                )}
              </div>

              {/* Stadyum Sponsoru */}
              <div className="bg-card/80 rounded-2xl border border-white/5 p-6">
                <h3 className="font-rajdhani font-bold text-lg text-white mb-4 flex items-center gap-2">🏟️ Stadyum Sponsoru</h3>
                {finances?.sponsors?.stadium ? (
                  <div className="bg-gradient-to-r from-red-900/40 to-black/40 p-5 rounded-xl border border-red-500/30 text-center relative overflow-hidden">
                    <div className="font-rajdhani font-black text-2xl sm:text-3xl text-white mb-2 relative z-10 truncate px-2">{finances.sponsors.stadium.name}</div>
                    <div className="flex justify-center gap-6 mt-4 relative z-10">
                      <div>
                        <div className="text-[10px] text-white/50 uppercase tracking-wider">Haftalık Gelir</div>
                        <div className="text-green font-bold text-lg">+{formatMoney(finances.sponsors.stadium.valuePerWeek)}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-white/50 uppercase tracking-wider">Kalan Süre</div>
                        <div className="text-white font-bold text-lg">{finances.sponsors.stadium.duration} Hafta</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-black/30 p-8 rounded-xl border border-white/5 text-center text-white/40 flex flex-col items-center justify-center h-[160px]">
                    <div className="text-3xl mb-2">🏢</div>
                    <p className="text-sm font-bold">Şu an stadyum isim sponsorunuz yok.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Gelen Teklifler */}
            <div className="bg-card/80 rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
                <span className="font-rajdhani font-bold text-lg tracking-wider text-foreground uppercase flex items-center gap-2">📩 Gelen Sponsor Teklifleri</span>
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-lg text-xs font-bold">{finances?.sponsors?.offers?.length || 0} Teklif</span>
              </div>
              <div className="p-6">
                {(!finances?.sponsors?.offers || finances.sponsors.offers.length === 0) ? (
                  <div className="text-center text-white/40 py-8">
                    <div className="text-4xl mb-3">📭</div>
                    <p>Masanızda bekleyen teklif bulunmuyor. Hafta geçtikçe şirketler kapınızı çalacaktır.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {finances.sponsors.offers.map(offer => (
                      <div key={offer.id} className="bg-black/40 border border-gold/30 p-5 rounded-xl hover:border-gold transition-colors relative">
                        <div className="absolute top-3 right-3 text-[10px] bg-gold/20 text-gold px-2 py-1 rounded uppercase font-bold">
                          {offer.type === 'shirt' ? 'Forma' : 'Stadyum'}
                        </div>
                        <h4 className="font-rajdhani font-bold text-xl text-white mb-1 truncate">{offer.name}</h4>
                        <div className="text-sm text-muted-foreground mb-4">Yeni sponsorluk teklifi gönderdi.</div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-5">
                          <div className="bg-white/5 rounded p-2 text-center">
                            <div className="text-[10px] text-white/50 uppercase">İmza Parası</div>
                            <div className="font-bold text-green">{formatMoney(offer.bonus)}</div>
                          </div>
                          <div className="bg-white/5 rounded p-2 text-center">
                            <div className="text-[10px] text-white/50 uppercase">Haftalık Ücret</div>
                            <div className="font-bold text-primary">{formatMoney(offer.valuePerWeek)}</div>
                          </div>
                          <div className="bg-white/5 rounded p-2 text-center col-span-2">
                            <div className="text-[10px] text-white/50 uppercase">Sözleşme Süresi</div>
                            <div className="font-bold text-white">{offer.duration} Hafta</div>
                          </div>
                        </div>

                        <button 
                          onClick={() => acceptSponsorOffer(offer.id)}
                          className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-2 rounded-lg font-bold text-sm tracking-widest uppercase hover:scale-[1.02] transition-transform"
                        >
                          Teklifi Kabul Et
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 3: TESİSLER */}
        {activeTab === 'facilities' && (
          <motion.div 
            key="facilities"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {[
              { id: 'stadium', name: 'Stadyum', desc: 'Maç günü bilet ve loca gelirlerinizi artırır.', baseCost: 10000000, icon: '🏟️' },
              { id: 'training', name: 'Antrenman Tesisleri', desc: 'Oyuncuların form grafiğini ve maç kondisyonunu olumlu etkiler.', baseCost: 5000000, icon: '🏋️‍♂️' },
              { id: 'youth', name: 'Altyapı Tesisleri', desc: 'Daha potansiyelli ve kaliteli genç oyuncuların çıkmasını sağlar.', baseCost: 4000000, icon: '👶' },
              { id: 'store', name: 'Kulüp Mağazası', desc: 'Haftalık forma ve ürün satış (Merchandise) gelirlerini katlar.', baseCost: 2500000, icon: '🛍️' }
            ].map(fac => {
              const currentLevel = finances?.facilities?.[fac.id] || 1;
              const cost = fac.baseCost * currentLevel * 1.5;
              const canAfford = (finances?.balance || 0) >= cost;

              return (
                <div key={fac.id} className="bg-card/80 rounded-2xl border border-white/5 p-6 flex flex-col relative overflow-hidden">
                  <div className="absolute -right-4 -bottom-4 text-[120px] opacity-[0.03] pointer-events-none">{fac.icon}</div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-2xl border border-white/10">{fac.icon}</div>
                      <div>
                        <h3 className="font-rajdhani font-bold text-xl text-white">{fac.name}</h3>
                        <div className="text-xs font-bold text-primary uppercase tracking-wider">Seviye {currentLevel} / 5</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 flex-1">{fac.desc}</p>
                  
                  {currentLevel >= 5 ? (
                    <div className="bg-green/10 text-green border border-green/20 p-3 rounded-xl text-center font-bold text-sm">
                      Maksimum Seviyeye Ulaştı
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-black/40 border border-white/5 p-3 rounded-xl">
                        <div className="text-[10px] text-white/50 uppercase mb-1">Geliştirme Maliyeti</div>
                        <div className={`font-bold font-orbitron ${canAfford ? 'text-white' : 'text-red-400'}`}>
                          {formatMoney(cost)}
                        </div>
                      </div>
                      <button 
                        disabled={!canAfford}
                        onClick={() => {
                          if (upgradeFacility(fac.id, cost)) {
                            alert(`${fac.name} Seviye ${currentLevel + 1}'e yükseltildi!`);
                          }
                        }}
                        className="bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:hover:bg-white/10 border border-white/10 px-6 py-3 rounded-xl font-bold uppercase text-sm transition-colors"
                      >
                        Geliştir
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        )}

        {/* TAB 4: ETKİNLİKLER & CFO */}
        {activeTab === 'events' && (
          <motion.div 
            key="events"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* YAPAY ZEKA CFO KARTI */}
            <div className={`rounded-2xl border p-6 sm:p-8 transition-colors ${finances?.cfoHired ? 'bg-primary/10 border-primary/50' : 'bg-card/80 border-white/5'}`}>
              <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border ${finances?.cfoHired ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-white/50'}`}>
                    🤖
                  </div>
                  <div>
                    <h3 className={`font-rajdhani font-bold text-xl sm:text-2xl mb-1 ${finances?.cfoHired ? 'text-primary' : 'text-white'}`}>
                      Yapay Zeka CFO (Finans Uzmanı)
                    </h3>
                    <p className="text-muted-foreground text-sm max-w-xl">
                      Finans Direktörü (Yapay Zeka) her hafta arkaplanda otomatik yatırım kararları alır, etkinlikler düzenler ve riskli işlere girebilir. Milyonlar da kazandırabilir, kulübü de batırabilir! 
                      (Haftalık Maliyeti: 50.000€)
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => useGameStore.getState().toggleCfo()}
                  className={`px-4 sm:px-8 py-3 sm:py-4 rounded-xl font-bold uppercase tracking-widest transition-all whitespace-normal sm:whitespace-nowrap text-xs sm:text-sm text-center
                    ${finances?.cfoHired 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30' 
                      : 'bg-gradient-to-r from-primary to-primary-dark text-white hover:scale-105 shadow-[0_0_15px_rgba(0,200,255,0.4)]'}`}
                >
                  {finances?.cfoHired ? 'CFO\'yu Kov' : 'CFO İşe Al'}
                </button>
              </div>
            </div>

            {/* MANUEL ETKİNLİKLER */}
            {!finances?.cfoHired && (
              <div className="bg-card/80 rounded-2xl border border-white/5 p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between mb-8 pb-8 border-b border-white/5">
                  <div>
                    <h3 className="font-rajdhani font-bold text-xl sm:text-2xl text-white mb-2">Halkla İlişkiler & Etkinlikler</h3>
                    <p className="text-muted-foreground text-sm max-w-xl">
                      Her hafta 1 adet etkinlik düzenleyerek kulüp kasasına sıcak para girişi sağlayabilirsiniz. Ancak unutmayın, bazı etkinlikler beklenen ilgiyi görmezse zarar da edebilirsiniz!
                    </p>
                  </div>
                  <div className="bg-black/50 border border-gold/30 px-6 py-4 rounded-xl text-center">
                    <div className="text-[10px] text-gold uppercase font-bold tracking-widest mb-1">Haftalık Hak</div>
                    <div className="text-2xl font-black text-white">
                      {finances?.lastEventWeek === useGameStore.getState().week ? '0 / 1' : '1 / 1'}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {[
                    { id: 'tour', name: 'Tesis Turu Düzenle', cost: 50000, expected: 150000, risk: 'Düşük Risk', icon: '🚌' },
                    { id: 'fan_meet', name: 'Taraftar Buluşması', cost: 150000, expected: 400000, risk: 'Orta Risk', icon: '🤝' },
                    { id: 'global_pr', name: 'Global PR Kampanyası', cost: 500000, expected: 1500000, risk: 'Yüksek Risk', icon: '🌍' },
                  ].map(ev => {
                    const hasRights = finances?.lastEventWeek !== useGameStore.getState().week;
                    const canAfford = (finances?.balance || 0) >= ev.cost;
                    const disabled = !hasRights || !canAfford;

                    return (
                      <div key={ev.id} className="bg-black/30 border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors flex flex-col">
                        <div className="text-4xl mb-4">{ev.icon}</div>
                        <h4 className="font-bold text-lg text-white mb-1">{ev.name}</h4>
                        <div className="text-[10px] text-muted-foreground uppercase font-bold mb-4 bg-white/5 inline-block px-2 py-1 rounded w-max">{ev.risk}</div>
                        
                        <div className="space-y-2 mb-6 flex-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-white/50">Maliyet:</span>
                            <span className="text-white font-bold">{formatMoney(ev.cost)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-white/50">Beklenen Gelir:</span>
                            <span className="text-green font-bold">~ {formatMoney(ev.expected)}</span>
                          </div>
                        </div>

                        <button 
                          disabled={disabled}
                          onClick={() => {
                            if (useGameStore.getState().organizeEvent(ev.cost, ev.expected, ev.name)) {
                              alert("Etkinlik tamamlandı! Bilanço geçmişinden kar/zarar durumuna bakabilirsiniz.");
                            }
                          }}
                          className={`w-full py-3 px-2 rounded-xl font-rajdhani font-bold text-[10px] sm:text-sm tracking-widest uppercase transition-all whitespace-normal text-center break-words
                            ${disabled ? 'bg-white/5 text-white/30 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'}
                          `}
                        >
                          Organize Et
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
