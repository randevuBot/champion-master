import React, { useMemo } from 'react';

// Maskot (İkon) Yolları
const ICONS = {
  lion: "M43 35 C43 30 47 26 52 26 C57 26 61 30 61 35 C61 38 59 40 57 41 C60 43 62 46 62 50 C62 55 57 59 52 59 C47 59 42 55 42 50 C42 46 44 43 47 41 C45 40 43 38 43 35 Z M52 32 C54 32 55 33 55 35 C55 37 54 38 52 38 C50 38 49 37 49 35 C49 33 50 32 52 32 Z",
  eagle: "M50 25 C65 25 75 35 80 40 C75 45 65 40 50 50 C35 40 25 45 20 40 C25 35 35 25 50 25 Z M50 50 L60 70 L50 65 L40 70 Z",
  star: "M50 25 L56 40 L72 40 L59 50 L64 65 L50 55 L36 65 L41 50 L28 40 L44 40 Z",
  castle: "M30 65 L30 35 L38 35 L38 45 L46 45 L46 35 L54 35 L54 45 L62 45 L62 35 L70 35 L70 65 Z",
  anchor: "M48 25 L52 25 L52 60 L48 60 Z M40 30 L60 30 L60 34 L40 34 Z M50 20 C53 20 55 22 55 25 C55 28 53 30 50 30 C47 30 45 28 45 25 C45 22 47 20 50 20 Z M30 50 C30 61 39 70 50 70 C61 70 70 61 70 50 L65 50 C65 58 58 65 50 65 C42 65 35 58 35 50 Z",
  crown: "M25 35 L35 48 L50 25 L65 48 L75 35 L70 65 L30 65 Z"
};

// Dış Şekiller (Base Shapes)
const SHAPES = {
  shield: "M50 5 L90 20 L90 60 C90 90, 50 115, 50 115 C50 115, 10 90, 10 60 L10 20 Z",
  circle: "M50 5 A45 45 0 1 0 50 95 A45 45 0 1 0 50 5 Z",
  hexagon: "M50 5 L93 25 L93 75 L50 95 L7 75 L7 25 Z"
};

export function ClubLogo({ club, className = "w-12 h-12" }) {
  const logoData = useMemo(() => {
    if (!club) return null;
    
    // Rastgele ama tutarlı seçimler yapmak için ismin ASCII değerlerini kullan
    const nameStr = club.name || "UNK";
    let hash1 = 0, hash2 = 0, hash3 = 0;
    for (let i = 0; i < nameStr.length; i++) {
      if (i % 3 === 0) hash1 += nameStr.charCodeAt(i);
      if (i % 3 === 1) hash2 += nameStr.charCodeAt(i);
      if (i % 3 === 2) hash3 += nameStr.charCodeAt(i);
    }

    const shapeKeys = Object.keys(SHAPES);
    const iconKeys = Object.keys(ICONS);
    const patternTypes = ['solid', 'halves', 'stripes', 'quarters'];

    return {
      shape: SHAPES[shapeKeys[hash1 % shapeKeys.length]],
      icon: ICONS[iconKeys[hash2 % iconKeys.length]],
      pattern: patternTypes[hash3 % patternTypes.length],
      color1: club.colors?.primary || "#1e293b",
      color2: club.colors?.secondary || "#0f172a",
      shortName: club.shortName ? club.shortName.substring(0, 3) : "UNK"
    };
  }, [club]);

  if (!club || !logoData) return null;

  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      {/* Kalkanın dış parlaması */}
      <div 
        className="absolute inset-0 blur-md opacity-40 rounded-full scale-90"
        style={{ background: `linear-gradient(135deg, ${logoData.color1}, ${logoData.color2})` }}
      ></div>
      
      {/* SVG Ana Çizim Yüzeyi */}
      <svg viewBox="0 0 100 120" className="w-full h-full drop-shadow-xl z-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`grad1-${club.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={logoData.color1} />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>
          
          <linearGradient id={`gold-border-${club.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>

          {/* İç Desenler İçin Maske */}
          <clipPath id={`clipShape-${club.id}`}>
            <path d={logoData.shape} />
          </clipPath>
        </defs>

        {/* 1. Katman: Ana Renk Arka Plan */}
        <path d={logoData.shape} fill={logoData.color1} />

        {/* 2. Katman: İç Desen (Pattern) */}
        <g clipPath={`url(#clipShape-${club.id})`}>
          {logoData.pattern === 'halves' && (
            <rect x="50" y="0" width="50" height="120" fill={logoData.color2} />
          )}
          {logoData.pattern === 'stripes' && (
            <>
              <rect x="20" y="0" width="15" height="120" fill={logoData.color2} />
              <rect x="50" y="0" width="15" height="120" fill={logoData.color2} />
              <rect x="80" y="0" width="15" height="120" fill={logoData.color2} />
            </>
          )}
          {logoData.pattern === 'quarters' && (
            <>
              <rect x="50" y="0" width="50" height="60" fill={logoData.color2} />
              <rect x="0" y="60" width="50" height="60" fill={logoData.color2} />
            </>
          )}
        </g>

        {/* 3. Katman: Gölgelendirme (3D Etkisi) */}
        <path d={logoData.shape} fill="url(#grad1-null)" opacity="0.4" style={{ mixBlendMode: 'overlay' }} />

        {/* 4. Katman: Dış Metalik Çerçeve */}
        <path 
          d={logoData.shape} 
          fill="none"
          stroke={`url(#gold-border-${club.id})`}
          strokeWidth="3"
        />

        {/* 5. Katman: Merkez İkon (Maskot) */}
        <g transform="translate(0, 10)">
          {/* İkon Arkası Parlama */}
          <path d={logoData.icon} fill="#000" opacity="0.6" transform="translate(0, 2)" />
          {/* Gerçek İkon */}
          <path d={logoData.icon} fill="#ffffff" />
        </g>

        {/* 6. Katman: Tipografi (Alt Kısmı Saran Kuruluş Yılı vs.) */}
        <text 
          x="50" 
          y="95" 
          fontFamily="Orbitron, sans-serif" 
          fontSize="10" 
          fontWeight="bold" 
          fill="#fef08a" 
          textAnchor="middle" 
          style={{ textShadow: "0px 1px 2px rgba(0,0,0,0.9)" }}
          letterSpacing="2"
        >
          {logoData.shortName}
        </text>
      </svg>
    </div>
  );
}
