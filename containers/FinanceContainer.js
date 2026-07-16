"use client";

import { useGameStore } from "@/store/gameStore";
import { formatMoney } from "@/lib/game/utils";
import { motion } from "framer-motion";

export function FinanceContainer() {
  const { finances, myClubId } = useGameStore();

  if (!myClubId) return null;

  return (
    <div className="pb-10">
      <div className="mb-5 sm:mb-6">
        <h2 className="text-2xl sm:text-[32px] font-rajdhani font-bold tracking-wide text-white mb-1">Finans Merkezi</h2>
        <p className="text-[#8892b0] text-sm sm:text-[15px]">Kulübün ekonomik durumunu ve bütçeleri yönet</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        
        {/* Total Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-[#00e676]/30 shadow-[0_10px_30px_rgba(0,230,118,0.1)] p-6 relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-[100px] opacity-[0.03] font-orbitron font-black text-[#00e676] pointer-events-none">€</div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#00e676]/10 flex items-center justify-center text-[#00e676] text-xl border border-[#00e676]/20">💰</div>
            <h3 className="font-rajdhani font-bold text-lg text-white">Genel Bakiye</h3>
          </div>
          <div className="text-[10px] text-[#8892b0] uppercase tracking-[2px] mb-4">Mevcut Kasa</div>
          <div className="font-orbitron font-bold text-4xl text-[#00e676] drop-shadow-[0_0_15px_rgba(0,230,118,0.4)]">
            {formatMoney(finances?.balance || 0)}
          </div>
        </motion.div>

        {/* Transfer Budget Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-[#00c8ff]/30 shadow-[0_10px_30px_rgba(0,200,255,0.1)] p-6 relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-[100px] opacity-[0.03] font-orbitron font-black text-[#00c8ff] pointer-events-none">🤝</div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#00c8ff]/10 flex items-center justify-center text-[#00c8ff] text-xl border border-[#00c8ff]/20">🤝</div>
            <h3 className="font-rajdhani font-bold text-lg text-white">Transfer Bütçesi</h3>
          </div>
          <div className="text-[10px] text-[#8892b0] uppercase tracking-[2px] mb-4">Yeni Oyuncular İçin</div>
          <div className="font-orbitron font-bold text-4xl text-[#00c8ff] drop-shadow-[0_0_15px_rgba(0,200,255,0.4)]">
            {formatMoney(finances?.transferBudget || 0)}
          </div>
        </motion.div>

        {/* Wage Budget Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-[#f5c842]/30 shadow-[0_10px_30px_rgba(245,200,66,0.1)] p-6 relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-[100px] opacity-[0.03] font-orbitron font-black text-[#f5c842] pointer-events-none">💳</div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#f5c842]/10 flex items-center justify-center text-[#f5c842] text-xl border border-[#f5c842]/20">💳</div>
            <h3 className="font-rajdhani font-bold text-lg text-white">Maaş Bütçesi</h3>
          </div>
          <div className="text-[10px] text-[#8892b0] uppercase tracking-[2px] mb-4">Haftalık Limit</div>
          <div className="font-orbitron font-bold text-4xl text-[#f5c842] drop-shadow-[0_0_15px_rgba(245,200,66,0.4)] mb-2">
            {formatMoney(finances?.wageBudget || 0)}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8892b0]">Kullanılan:</span>
            <span className="text-white font-bold">{formatMoney(finances?.weeklyWages || 0)}</span>
          </div>
          
          {/* Progress bar for wages */}
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
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Income/Expense Breakdown */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
            <span className="font-rajdhani font-bold text-lg tracking-wider text-[#e8eaf6] uppercase">Sezonluk Akış</span>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="bg-[#0a0e1a] rounded-xl p-5 border border-[#00e676]/20 relative overflow-hidden">
                <div className="text-[10px] text-[#4a5568] uppercase tracking-wider mb-2 font-bold">Toplam Gelir</div>
                <div className="font-orbitron font-bold text-2xl text-[#00e676]">{formatMoney(finances?.seasonRevenue || 0)}</div>
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#00e676]/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
              </div>
              <div className="bg-[#0a0e1a] rounded-xl p-5 border border-[#ff1744]/20 relative overflow-hidden">
                <div className="text-[10px] text-[#4a5568] uppercase tracking-wider mb-2 font-bold">Toplam Gider</div>
                <div className="font-orbitron font-bold text-2xl text-[#ff1744]">{formatMoney(finances?.seasonExpenses || 0)}</div>
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#ff1744]/10 rounded-full blur-xl -translate-y-1/2 translate-x-1/2"></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-wider">
                  <span className="text-[#8892b0]">Yayın Gelirleri</span>
                  <span className="text-[#00e676]">+ {formatMoney((finances?.seasonRevenue || 0) * 0.4)}</span>
                </div>
                <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-[#00e676]/50 w-[40%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-wider">
                  <span className="text-[#8892b0]">Bilet Gelirleri</span>
                  <span className="text-[#00e676]">+ {formatMoney((finances?.seasonRevenue || 0) * 0.3)}</span>
                </div>
                <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-[#00e676]/50 w-[30%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-wider">
                  <span className="text-[#8892b0]">Sponsorluklar</span>
                  <span className="text-[#00e676]">+ {formatMoney((finances?.seasonRevenue || 0) * 0.3)}</span>
                </div>
                <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-[#00e676]/50 w-[30%] rounded-full"></div>
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-white/5">
                <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-wider">
                  <span className="text-[#8892b0]">Oyuncu Maaşları</span>
                  <span className="text-[#ff1744]">- {formatMoney((finances?.seasonExpenses || 0) * 0.8)}</span>
                </div>
                <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff1744]/50 w-[80%] rounded-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-wider">
                  <span className="text-[#8892b0]">Tesis Giderleri</span>
                  <span className="text-[#ff1744]">- {formatMoney((finances?.seasonExpenses || 0) * 0.2)}</span>
                </div>
                <div className="h-1 w-full bg-black rounded-full overflow-hidden">
                  <div className="h-full bg-[#ff1744]/50 w-[20%] rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-[#141b2d]/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden flex flex-col justify-center items-center p-8 text-center"
        >
          <div className="text-[64px] mb-6 opacity-80 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">🏦</div>
          <h3 className="font-rajdhani font-bold text-2xl text-white mb-2">Bütçe Ayarlaması</h3>
          <p className="text-[#8892b0] text-sm mb-8 max-w-sm">
            Yönetimden ekstra bütçe talep edebilir veya transfer ve maaş bütçeleri arasındaki dengeyi değiştirebilirsiniz.
          </p>
          
          <button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3.5 rounded-xl font-bold tracking-widest uppercase transition-colors mb-3">
            Bütçe Dengesini Ayarla
          </button>
          <button className="w-full bg-gradient-to-r from-[#f5c842] to-[#c99a00] hover:scale-105 transition-transform text-black py-3.5 rounded-xl font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(245,200,66,0.4)]">
            Yönetimden Bütçe İste
          </button>
        </motion.div>
      </div>
    </div>
  );
}
