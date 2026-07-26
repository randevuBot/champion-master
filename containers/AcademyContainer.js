"use client";

import { useGameStore } from "@/store/gameStore";
import { motion } from "framer-motion";

export function AcademyContainer() {
  const { myClubId } = useGameStore();

  if (!myClubId) return null;

  // Placeholder youth players
  const youthPlayers = [
    { id: 'y1', name: 'Ahmet Yılmaz', age: 16, pos: 'ST', potential: '80-92', current: 58 },
    { id: 'y2', name: 'Caner Demir', age: 17, pos: 'CM', potential: '75-88', current: 62 },
    { id: 'y3', name: 'Burak Kaya', age: 15, pos: 'CB', potential: '82-94', current: 55 },
  ];

  return (
    <div className="pb-10">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-[32px] font-rajdhani font-bold tracking-wide text-white mb-1">Gençlik Akademisi</h2>
          <p className="text-muted-foreground text-sm sm:text-[15px]">Geleceğin yıldızlarını keşfet ve A takıma kazandır</p>
        </div>
        
        <div className="flex gap-4">
          <button className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm tracking-wide hover:bg-white/10 transition-colors">Yetenek Avcısı Gönder</button>
          <button className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-sm tracking-wide shadow-[0_0_15px_rgba(0,200,255,0.3)] hover:scale-105 transition-transform">Altyapıyı Geliştir</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card/80 backdrop-blur-md rounded-2xl border border-primary/30 shadow-[0_10px_30px_rgba(0,200,255,0.1)] p-6 relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-[100px] opacity-[0.03] font-orbitron font-black text-primary pointer-events-none">🏢</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[2px] mb-1">Tesis Seviyesi</div>
          <div className="font-orbitron font-bold text-3xl text-white mb-2">Seviye 3</div>
          <div className="flex gap-1">
            <span className="text-primary">★</span>
            <span className="text-primary">★</span>
            <span className="text-primary">★</span>
            <span className="text-white/20">★</span>
            <span className="text-white/20">★</span>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card/80 backdrop-blur-md rounded-2xl border border-gold/30 shadow-[0_10px_30px_rgba(245,200,66,0.1)] p-6 relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-[100px] opacity-[0.03] font-orbitron font-black text-gold pointer-events-none">👨‍🏫</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[2px] mb-1">Antrenör Kalitesi</div>
          <div className="font-orbitron font-bold text-3xl text-gold mb-2">İyi</div>
          <p className="text-xs text-muted-foreground">Genç oyuncular %15 daha hızlı gelişiyor.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card/80 backdrop-blur-md rounded-2xl border border-green/30 shadow-[0_10px_30px_rgba(0,230,118,0.1)] p-6 relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 text-[100px] opacity-[0.03] font-orbitron font-black text-green pointer-events-none">🌱</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-[2px] mb-1">Akademi Bütçesi</div>
          <div className="font-orbitron font-bold text-3xl text-green mb-2">€500K</div>
          <p className="text-xs text-muted-foreground">Yıllık ayrılan altyapı fonu.</p>
        </motion.div>
      </div>

      <div className="bg-card/80 backdrop-blur-md rounded-2xl border border-white/5 shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 bg-black/20 flex justify-between items-center">
          <span className="font-rajdhani font-bold text-lg tracking-wider text-foreground uppercase">Genç Oyuncular</span>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {youthPlayers.map((player, idx) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + (idx * 0.1) }}
                key={player.id} 
                className="bg-black/30 rounded-xl p-5 border border-white/5 hover:border-primary/50 transition-colors group cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-rajdhani font-bold text-lg text-white group-hover:text-primary transition-colors">{player.name}</h4>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{player.age} Yaş • <span className="text-white font-bold">{player.pos}</span></div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30 text-lg">👦</div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1">
                      <span className="text-muted-foreground">Mevcut Yetenek</span>
                      <span className="text-white font-bold">{player.current}</span>
                    </div>
                    <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                      <div className="h-full bg-white/50 w-[58%] rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1">
                      <span className="text-muted-foreground">Potansiyel</span>
                      <span className="text-gold font-bold">{player.potential}</span>
                    </div>
                    <div className="h-1.5 w-full bg-black rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-gold to-[#ff9100] w-[90%] rounded-full shadow-[0_0_10px_var(--color-gold)]"></div>
                    </div>
                  </div>
                </div>
                
                <button className="w-full mt-5 py-2 rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary border border-transparent hover:border-primary/30 text-xs font-bold tracking-widest uppercase transition-all">
                  A Takıma Yükselt
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
