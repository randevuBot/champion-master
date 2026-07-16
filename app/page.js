"use client";

import { HomeContainer } from "@/containers/HomeContainer";
import { DashboardContainer } from "@/containers/DashboardContainer";
import { useGameStore } from "@/store/gameStore";

export default function Home() {
  const { isPlaying, myClubId } = useGameStore();

  return (
    <div className="w-full h-full">
      {isPlaying && myClubId ? <DashboardContainer /> : <HomeContainer />}
    </div>
  );
}
