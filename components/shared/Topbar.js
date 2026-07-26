"use client";

import { useGameStore } from '@/store/gameStore';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

import { useEffect } from 'react';

export function Topbar({ onMenuClick }) {
  const router = useRouter();
  const pathname = usePathname();
  const { week, season, myClubId, fixtures, advanceWeek, advanceTime, date } = useGameStore();

  useEffect(() => {
    if (!myClubId || pathname === '/match') return;
    
    // Kullanıcının maçı varsa zaman akmaz, maçı oynamasını bekleriz
    const hasMatch = fixtures.some(f => !f.played && f.week === week && (f.homeClubId === myClubId || f.awayClubId === myClubId));
    if (hasMatch) return;

    const timer = setInterval(() => {
      advanceTime();
    }, 5000); // 5 saniyede 1 gün otomatik atlar
    
    return () => clearInterval(timer);
  }, [pathname, week, fixtures, myClubId, advanceTime]);

  if (!myClubId) return null;

  const handleNext = () => {
    const hasMatch = fixtures.find(f => !f.played && f.week === week && (f.homeClubId === myClubId || f.awayClubId === myClubId));
    if (hasMatch) router.push("/match");
    else advanceTime();
  };

  const dateStr = date
    ? `${String(date.day).padStart(2, '0')}.${String(date.month).padStart(2, '0')}.${date.year}`
    : '';

  const titleMap = {
    "/": "Dashboard",
    "/squad": "Kadro",
    "/tactics": "Taktik",
    "/inbox": "Gelen Kutusu",
    "/calendar": "Takvim",
    "/transfers": "Transferler",
    "/finance": "Finans",
    "/academy": "Akademi",
    "/stats": "İstatistikler",
    "/match": "Canlı Maç",
  };
  const pageTitle = titleMap[pathname] || "Dashboard";
  const hasMatch = fixtures.some(f => !f.played && f.week === week && (f.homeClubId === myClubId || f.awayClubId === myClubId));

  return (
    <div className="h-[60px] sm:h-[72px] shrink-0 border-b border-white/5 bg-secondary/80 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6 gap-2">
      
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Hamburger — only on mobile (hidden on lg+) */}
        <button
          onClick={onMenuClick}
          className="lg:hidden flex-shrink-0 w-9 h-9 flex flex-col justify-center items-center gap-1.5 text-muted-foreground hover:text-white transition-colors"
          aria-label="Menüyü aç"
        >
          <span className="w-5 h-0.5 bg-current rounded-full" />
          <span className="w-4 h-0.5 bg-current rounded-full self-start" />
          <span className="w-5 h-0.5 bg-current rounded-full" />
        </button>

        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          key={pageTitle}
          className="text-lg sm:text-2xl font-rajdhani font-bold tracking-wide text-white truncate"
        >
          {pageTitle}
        </motion.div>
      </div>

      {/* Right: date + action button */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Date — hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-lg">📅</span>
          <span className="font-orbitron font-bold text-foreground tracking-wider text-xs sm:text-sm whitespace-nowrap">{dateStr}</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg flex items-center gap-1 sm:gap-2 whitespace-nowrap
            ${hasMatch
              ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-[0_0_15px_rgba(0,200,255,0.4)] border border-white/20'
              : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
            }
          `}
          onClick={handleNext}
        >
          {/* Short label on mobile, full label on sm+ */}
          <span className="sm:hidden">{hasMatch ? "⚽ Maç" : "➔ İlerle"}</span>
          <span className="hidden sm:inline">{hasMatch ? "Maça Çık ⚽" : "Haftayı İlerle ➔"}</span>
        </motion.button>
      </div>
    </div>
  );
}
