import React, { useMemo } from 'react';

// Maskot (İkon) Yolları
// Maskot (İkon) Yolları ve Merkezleme Ayarları
const ICONS = {
  dragon: {
    path: "M352 124.5l-51.9-13c-6.5-1.6-11.3-7.1-12-13.8s2.8-13.1 8.7-16.1l40.8-20.4L294.4 28.8c-5.5-4.1-7.8-11.3-5.6-17.9S297.1 0 304 0L416 0l32 0 16 0c30.2 0 58.7 14.2 76.8 38.4l57.6 76.8c6.2 8.3 9.6 18.4 9.6 28.8c0 26.5-21.5 48-48 48l-21.5 0c-17 0-33.3-6.7-45.3-18.7L480 160l-32 0 0 21.5c0 24.8 12.8 47.9 33.8 61.1l106.6 66.6c32.1 20.1 51.6 55.2 51.6 93.1C640 462.9 590.9 512 530.2 512L496 512l-64 0L32.3 512c-3.3 0-6.6-.4-9.6-1.4C13.5 507.8 6 501 2.4 492.1C1 488.7 .2 485.2 0 481.4c-.2-3.7 .3-7.3 1.3-10.7c2.8-9.2 9.6-16.7 18.6-20.4c3-1.2 6.2-2 9.5-2.2L433.3 412c8.3-.7 14.7-7.7 14.7-16.1c0-4.3-1.7-8.4-4.7-11.4l-44.4-44.4c-30-30-46.9-70.7-46.9-113.1l0-45.5 0-57zM512 72.3c0-.1 0-.2 0-.3s0-.2 0-.3l0 .6zm-1.3 7.4L464.3 68.1c-.2 1.3-.3 2.6-.3 3.9c0 13.3 10.7 24 24 24c10.6 0 19.5-6.8 22.7-16.3zM130.9 116.5c16.3-14.5 40.4-16.2 58.5-4.1l130.6 87 0 27.5c0 32.8 8.4 64.8 24 93l-232 0c-6.7 0-12.7-4.2-15-10.4s-.5-13.3 4.6-17.7L171 232.3 18.4 255.8c-7 1.1-13.9-2.6-16.9-9s-1.5-14.1 3.8-18.8L130.9 116.5z",
    transform: "translate(22, 35) scale(0.09)"
  },
  knight: {
    path: "M96 48L82.7 61.3C70.7 73.3 64 89.5 64 106.5l0 132.4c0 10.7 5.3 20.7 14.2 26.6l10.6 7c14.3 9.6 32.7 10.7 48.1 3l3.2-1.6c2.6-1.3 5-2.8 7.3-4.5l49.4-37c6.6-5 15.7-5 22.3 0c10.2 7.7 9.9 23.1-.7 30.3L90.4 350C73.9 361.3 64 380 64 400l320 0 28.9-159c2.1-11.3 3.1-22.8 3.1-34.3l0-14.7C416 86 330 0 224 0L83.8 0C72.9 0 64 8.9 64 19.8c0 7.5 4.2 14.3 10.9 17.7L96 48zm24 68a20 20 0 1 1 40 0 20 20 0 1 1 -40 0zM22.6 473.4c-4.2 4.2-6.6 10-6.6 16C16 501.9 26.1 512 38.6 512l370.7 0c12.5 0 22.6-10.1 22.6-22.6c0-6-2.4-11.8-6.6-16L384 432 64 432 22.6 473.4z",
    transform: "translate(28, 30) scale(0.1)"
  },
  horse: {
    path: "M64 464l0-147.1c0-108.4 68.3-205.1 170.5-241.3L404.2 15.5C425.6 7.9 448 23.8 448 46.4c0 11-5.5 21.2-14.6 27.3L400 96c48.1 0 91.2 29.8 108.1 74.9l48.6 129.5c11.8 31.4 4.1 66.8-19.6 90.5c-16 16-37.8 25.1-60.5 25.1l-3.4 0c-26.1 0-50.9-11.6-67.6-31.7l-32.3-38.7c-11.7 4.1-24.2 6.4-37.3 6.4c0 0 0 0-.1 0c0 0 0 0 0 0c-6.3 0-12.5-.5-18.6-1.5c-3.6-.6-7.2-1.4-10.7-2.3c0 0 0 0 0 0c-28.9-7.8-53.1-26.8-67.8-52.2c-4.4-7.6-14.2-10.3-21.9-5.8s-10.3 14.2-5.8 21.9c24 41.5 68.3 70 119.3 71.9l47.2 70.8c4 6.1 6.2 13.2 6.2 20.4c0 20.3-16.5 36.8-36.8 36.8L112 512c-26.5 0-48-21.5-48-48zM392 224a24 24 0 1 0 0-48 24 24 0 1 0 0 48z",
    transform: "translate(28, 30) scale(0.1)"
  },
  shieldCat: {
    path: "M269.4 2.9C265.2 1 260.7 0 256 0s-9.2 1-13.4 2.9L54.3 82.8c-22 9.3-38.4 31-38.3 57.2c.5 99.2 41.3 280.7 213.6 363.2c16.7 8 36.1 8 52.8 0C454.7 420.7 495.5 239.2 496 140c.1-26.2-16.3-47.9-38.3-57.2L269.4 2.9zM160 154.4c0-5.8 4.7-10.4 10.4-10.4l.2 0c3.4 0 6.5 1.6 8.5 4.3l40 53.3c3 4 7.8 6.4 12.8 6.4l48 0c5 0 9.8-2.4 12.8-6.4l40-53.3c2-2.7 5.2-4.3 8.5-4.3l.2 0c5.8 0 10.4 4.7 10.4 10.4L352 272c0 53-43 96-96 96s-96-43-96-96l0-117.6zM216 288a16 16 0 1 0 0-32 16 16 0 1 0 0 32zm96-16a16 16 0 1 0 -32 0 16 16 0 1 0 32 0z",
    transform: "translate(25, 30) scale(0.1)"
  },
  crow: {
    path: "M456 0c-48.6 0-88 39.4-88 88l0 29.2L12.5 390.6c-14 10.8-16.6 30.9-5.9 44.9s30.9 16.6 44.9 5.9L126.1 384l133.1 0 46.6 113.1c5 12.3 19.1 18.1 31.3 13.1s18.1-19.1 13.1-31.3L311.1 384l40.9 0c1.1 0 2.1 0 3.2 0l46.6 113.2c5 12.3 19.1 18.1 31.3 13.1s18.1-19.1 13.1-31.3l-42-102C484.9 354.1 544 280 544 192l0-64 0-8 80.5-20.1c8.6-2.1 13.8-10.8 11.6-19.4C629 52 603.4 32 574 32l-50.1 0C507.7 12.5 483.3 0 456 0zm0 64a24 24 0 1 1 0 48 24 24 0 1 1 0-48z",
    transform: "translate(22, 35) scale(0.09)"
  },
  star: {
    path: "M50 25 L56 40 L72 40 L59 50 L64 65 L50 55 L36 65 L41 50 L28 40 L44 40 Z",
    transform: "translate(0, 5) scale(1.1)"
  },
  castle: {
    path: "M30 65 L30 35 L38 35 L38 45 L46 45 L46 35 L54 35 L54 45 L62 45 L62 35 L70 35 L70 65 Z",
    transform: "translate(0, 5) scale(1.1)"
  }
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
        <g transform={logoData.icon.transform || "translate(0, 15) scale(1.05)"} style={{ transformOrigin: '50px 50px' }}>
          {/* İkon Arkası Metalik Gölge */}
          <path d={logoData.icon.path || logoData.icon} fill="#000" opacity="0.7" transform="translate(0, 3)" />
          {/* Gerçek İkon */}
          <path d={logoData.icon.path || logoData.icon} fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
}
