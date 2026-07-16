"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/store/gameStore';
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();
  const { week, myClubId, fixtures, advanceWeek } = useGameStore();

  const handleNext = () => {
    if (!myClubId) return;
    
    // Check if we have a match this week
    const hasMatch = fixtures.find(f => !f.played && f.week === week && (f.homeClubId === myClubId || f.awayClubId === myClubId));
    
    if (hasMatch) {
      router.push("/match");
    } else {
      advanceWeek();
    }
  };

  return (
    <header className="flex h-16 items-center px-4 border-b bg-background">
      <div className="font-bold text-xl mr-8 text-primary">🏆 Champion Master</div>
      {myClubId && (
        <nav className="flex items-center space-x-2">
          <Link href="/">
            <Button variant="ghost">Ana Ekran</Button>
          </Link>
          <Link href="/tactics">
            <Button variant="ghost">Taktikler</Button>
          </Link>
          <Link href="/transfers">
            <Button variant="ghost">Transferler</Button>
          </Link>
        </nav>
      )}
      <div className="ml-auto flex items-center space-x-4">
        {myClubId && (
          <Button onClick={handleNext} variant="default">
            {fixtures.some(f => !f.played && f.week === week && (f.homeClubId === myClubId || f.awayClubId === myClubId)) 
              ? "Maça Çık ⚽" 
              : "Haftayı İlerle ⏭"}
          </Button>
        )}
      </div>
    </header>
  );
}
