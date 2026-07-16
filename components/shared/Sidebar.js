"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import ChampionMasterData from '@/lib/game/data';
import { formatMoney } from '@/lib/game/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

export function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { myClubId, season, week, finances, morale } = useGameStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (pathname === '/' || pathname === '/dashboard') {
      setIsCollapsed(false);
    } else {
      setIsCollapsed(true);
    }
  }, [pathname]);

  const [openMenus, setOpenMenus] = useState({ kulup: true, yonetim: false, lig: false });

  if (!myClubId) return null;

  const club = ChampionMasterData.clubs.find(c => c.id === myClubId);

  const toggleMenu = (key) => {
    if (!isCollapsed) {
      setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const NavItem = ({ href, icon, label, exact = false }) => {
    const isActive = exact ? pathname === href : pathname.startsWith(href);
    return (
      <Link href={href} className="block w-full" onClick={onClose} title={label}>
        <div className={`relative flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'text-[#e8eaf6]' : 'text-[#8892b0] hover:text-[#e8eaf6] hover:bg-white/5'}`}>
          {isActive && (
            <div className="absolute inset-0 bg-[#00c8ff]/10 border border-[#00c8ff]/30 rounded-xl z-0" />
          )}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-[#00c8ff] rounded-r-full z-0 shadow-[0_0_10px_#00c8ff]" />
          )}
          <span className="relative z-10 text-xl sm:text-2xl flex justify-center flex-shrink-0">{icon}</span>
          {!isCollapsed && <span className="relative z-10 font-medium text-[15px] truncate">{label}</span>}
        </div>
      </Link>
    );
  };

  const MenuHeader = ({ title, menuKey }) => {
    if (isCollapsed) return null;
    return (
      <button 
        onClick={() => toggleMenu(menuKey)}
        className="w-full flex items-center justify-between px-4 py-2 mb-1 group transition-colors rounded-lg hover:bg-white/5"
      >
        <div className="text-[10px] font-bold text-[#4a5568] group-hover:text-[#8892b0] tracking-[2px] uppercase transition-colors">{title}</div>
        <div className="text-[#4a5568] group-hover:text-[#8892b0] transition-colors">
          {openMenus[menuKey] ? '▼' : '▶'}
        </div>
      </button>
    );
  };

  return (
    <div className={`h-screen bg-[#0f1629]/95 backdrop-blur-xl border-r border-white/5 flex flex-col shrink-0 sticky top-0 shadow-2xl z-50 transition-all duration-300 relative ${isCollapsed ? 'w-[80px]' : 'w-[260px] sm:w-[280px]'}`}>
      
      {/* Collapse Toggle Button (Desktop Only) */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)} 
        className="absolute -right-3 top-8 bg-[#00c8ff] text-black rounded-full w-6 h-6 items-center justify-center z-50 shadow-lg hover:scale-110 hidden lg:flex border border-white/20"
        title={isCollapsed ? "Menüyü Genişlet" : "Menüyü Daralt"}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {isCollapsed ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path>}
        </svg>
      </button>

      {/* Logo */}
      <div className={`p-4 sm:p-6 flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} border-b border-white/5 bg-black/20 h-[80px]`}>
        <span className="text-3xl drop-shadow-[0_0_8px_rgba(0,200,255,0.5)] flex-shrink-0">⚽</span>
        {!isCollapsed && (
          <span className="font-orbitron font-black text-lg sm:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-[#00c8ff] truncate">
            CHAMPMASTER
          </span>
        )}
        {onClose && !isCollapsed && (
          <button onClick={onClose} className="ml-auto text-[#8892b0] hover:text-white transition-colors text-xl flex-shrink-0 lg:hidden">✕</button>
        )}
      </div>
      
      {/* Club Summary */}
      <div className={`p-4 sm:p-6 flex flex-col items-center border-b border-white/5 relative overflow-hidden transition-all ${isCollapsed ? 'py-4' : ''}`}>
        {!isCollapsed && <div className="absolute top-0 right-0 w-32 h-32 bg-[#00c8ff] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />}
        <div
          className={`${isCollapsed ? 'w-10 h-10 text-xs' : 'w-[60px] h-[60px] sm:w-[72px] sm:h-[72px] text-xl sm:text-2xl mb-3'} rounded-2xl flex items-center justify-center font-orbitron font-black text-white shadow-[0_8px_24px_rgba(0,0,0,0.5)] relative transition-all duration-300`}
          style={club ? { background: `linear-gradient(135deg, ${club.colors.primary}, ${club.colors.secondary})` } : {}}
          title={club?.name}
        >
          {club?.shortName.slice(0, 3)}
          <div className="absolute inset-0 rounded-2xl border border-white/20" />
        </div>
        {!isCollapsed && (
          <>
            <div className="font-rajdhani font-bold text-base sm:text-xl tracking-wide text-white text-center w-full truncate px-2">{club?.name}</div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-[#00c8ff] tracking-[2px] mt-1 bg-[#00c8ff]/10 px-3 py-1 rounded-full border border-[#00c8ff]/20 whitespace-nowrap">
              SEZON {season} • HAFTA {week}
            </div>
          </>
        )}
      </div>
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3">
        <div>
          <MenuHeader title="Kulüp" menuKey="kulup" />
          <AnimatePresence>
            {(openMenus.kulup || isCollapsed) && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1">
                <NavItem href="/" icon="🏠" label="Dashboard" exact={true} />
                <NavItem href="/squad" icon="👥" label="Kadro" />
                <NavItem href="/tactics" icon="📋" label="Taktik" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <MenuHeader title="Yönetim" menuKey="yonetim" />
          <AnimatePresence>
            {(openMenus.yonetim || isCollapsed) && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1">
                <NavItem href="/inbox" icon="📩" label="Mesajlar" />
                <NavItem href="/calendar" icon="📅" label="Takvim" />
                <NavItem href="/transfers" icon="🤝" label="Transferler" />
                <NavItem href="/finance" icon="💰" label="Finans" />
                <NavItem href="/academy" icon="🌱" label="Akademi" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <MenuHeader title="Lig" menuKey="lig" />
          <AnimatePresence>
            {(openMenus.lig || isCollapsed) && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1">
                <NavItem href="/stats" icon="📊" label="İstatistikler" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Bottom Quick Stats */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 border-t border-white/5 bg-black/20">
          <div className="mb-3">
            <div className="flex justify-between text-[10px] sm:text-[11px] font-semibold text-[#8892b0] uppercase tracking-wider mb-1.5">
              <span>Takım Morali</span>
              <span className="text-white">{morale || 100}%</span>
            </div>
            <div className="h-1.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${morale || 100}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className="h-full rounded-full"
                style={{
                  background: (morale || 100) > 60 ? '#00e676' : (morale || 100) > 30 ? '#f5c842' : '#ff1744',
                  boxShadow: (morale || 100) > 60 ? '0 0 10px rgba(0,230,118,0.5)' : 'none'
                }}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 bg-[#141b2d] p-3 rounded-xl border border-white/5">
            <div className="min-w-0">
              <div className="text-[#00e676] font-orbitron font-bold text-xs truncate">{formatMoney(finances?.balance || 0)}</div>
              <div className="text-[9px] sm:text-[10px] text-[#4a5568] uppercase tracking-wider mt-0.5">Bütçe</div>
            </div>
            <div className="min-w-0">
              <div className="text-[#8892b0] font-orbitron font-bold text-xs truncate">{formatMoney(finances?.weeklyWages || 0)}</div>
              <div className="text-[9px] sm:text-[10px] text-[#4a5568] uppercase tracking-wider mt-0.5">Maaş</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
