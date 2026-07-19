import React from 'react';

export function ClubLogo({ club, className = "w-12 h-12" }) {
  if (!club) return null;

  const color1 = club.colors?.primary || "#1e293b";
  const color2 = club.colors?.secondary || "#0f172a";
  const shortName = club.shortName ? club.shortName.substring(0, 3) : "UNK";

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* Glow / Shadow behind the logo */}
      <div 
        className="absolute inset-0 blur-md opacity-40 rounded-full"
        style={{ background: `linear-gradient(135deg, ${color1}, ${color2})` }}
      ></div>
      
      {/* Shield SVG shape */}
      <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`grad-${club.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={color1} />
            <stop offset="100%" stopColor={color2} />
          </linearGradient>
          <linearGradient id={`gold-border-${club.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>
        </defs>
        
        {/* Main Shield Path */}
        <path 
          d="M50 5 L90 20 L90 60 C90 90, 50 115, 50 115 C50 115, 10 90, 10 60 L10 20 Z" 
          fill={`url(#grad-${club.id})`}
          stroke={`url(#gold-border-${club.id})`}
          strokeWidth="3"
        />
        
        {/* Inner glow / accent */}
        <path 
          d="M50 10 L85 24 L85 59 C85 85, 50 107, 50 107 C50 107, 15 85, 15 59 L15 24 Z" 
          fill="rgba(255,255,255,0.05)"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />

        {/* Text */}
        <text 
          x="50" 
          y="65" 
          fontFamily="Orbitron, sans-serif" 
          fontSize="24" 
          fontWeight="bold" 
          fill="#ffffff" 
          textAnchor="middle" 
          style={{ textShadow: "0px 2px 4px rgba(0,0,0,0.8)" }}
        >
          {shortName}
        </text>
      </svg>
    </div>
  );
}
