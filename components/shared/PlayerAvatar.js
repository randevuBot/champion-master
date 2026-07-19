import React from 'react';

export function PlayerAvatar({ player, className = "w-16 h-16" }) {
  if (!player) return null;

  const ovr = player.overall || 70;
  
  // Determine premium tier based on OVR
  let tierColors = {
    bgFrom: "#3e2723", bgTo: "#1b0000", border: "#cd7f32", shadow: "rgba(205, 127, 50, 0.4)", text: "#ffcc80" // Bronze
  };

  if (ovr >= 90) {
    // Diamond / Icon
    tierColors = { bgFrom: "#00102a", bgTo: "#000000", border: "#00f7ff", shadow: "rgba(0, 247, 255, 0.6)", text: "#b9f2ff" };
  } else if (ovr >= 80) {
    // Gold
    tierColors = { bgFrom: "#3a2a00", bgTo: "#140e00", border: "#ffd700", shadow: "rgba(255, 215, 0, 0.5)", text: "#fff8b0" };
  } else if (ovr >= 70) {
    // Silver
    tierColors = { bgFrom: "#202020", bgTo: "#000000", border: "#c0c0c0", shadow: "rgba(192, 192, 192, 0.4)", text: "#ffffff" };
  }

  const initials = player.lastName ? player.lastName.substring(0, 2).toUpperCase() : "PL";

  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-full ${className}`}>
      {/* Outer Glow */}
      <div 
        className="absolute inset-0 rounded-full blur-md opacity-60"
        style={{ backgroundColor: tierColors.border, boxShadow: `0 0 15px ${tierColors.shadow}` }}
      ></div>
      
      {/* Avatar Container */}
      <div 
        className="absolute inset-0.5 rounded-full overflow-hidden flex items-end justify-center border-[2px] z-10"
        style={{ 
          background: `linear-gradient(135deg, ${tierColors.bgFrom}, ${tierColors.bgTo})`,
          borderColor: tierColors.border,
          boxShadow: `inset 0 0 10px rgba(0,0,0,0.8)`
        }}
      >
        {/* Silhouette SVG */}
        <svg viewBox="0 0 100 100" className="w-[85%] h-[85%] opacity-80 mt-2" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M50 45 C60 45, 68 37, 68 27 C68 17, 60 9, 50 9 C40 9, 32 17, 32 27 C32 37, 40 45, 50 45 Z" 
            fill="url(#bodyGrad)" 
          />
          <path 
            d="M15 95 C15 70, 30 55, 50 55 C70 55, 85 70, 85 95 L15 95 Z" 
            fill="url(#bodyGrad)" 
          />
          <defs>
            <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Text Overlay for Initials */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span 
            className="font-rajdhani font-bold opacity-30 text-3xl"
            style={{ color: tierColors.text, textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
          >
            {initials}
          </span>
        </div>
      </div>

      {/* OVR Badge attached to Avatar */}
      <div 
        className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center font-orbitron font-bold text-[10px] z-20 border shadow-lg"
        style={{ 
          background: tierColors.border, 
          borderColor: '#000',
          color: '#000'
        }}
      >
        {ovr}
      </div>
    </div>
  );
}
