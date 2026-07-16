const ChampionMasterData = {
  leagues: [
    { id: 'superlig', name: 'Trendyol Süper Lig', country: 'Türkiye' },
    { id: 'premier', name: 'Premier League', country: 'İngiltere' },
    { id: 'laliga', name: 'La Liga', country: 'İspanya' }
  ],
  clubs: [
    // Süper Lig
    { id: 'gs', name: 'Galatasaray', shortName: 'GS', leagueId: 'superlig', city: 'İstanbul', stadium: 'Rams Park', capacity: 52280, prestige: 8, budget: 35, colors: { primary: '#a90432', secondary: '#fdb912' }, founded: 1905 },
    { id: 'fb', name: 'Fenerbahçe', shortName: 'FB', leagueId: 'superlig', city: 'İstanbul', stadium: 'Ülker Stadyumu', capacity: 47834, prestige: 8, budget: 35, colors: { primary: '#002d72', secondary: '#ed1c24' }, founded: 1907 },
    { id: 'bjk', name: 'Beşiktaş', shortName: 'BJK', leagueId: 'superlig', city: 'İstanbul', stadium: 'Tüpraş Stadyumu', capacity: 42590, prestige: 8, budget: 30, colors: { primary: '#000000', secondary: '#ffffff' }, founded: 1903 },
    { id: 'ts', name: 'Trabzonspor', shortName: 'TS', leagueId: 'superlig', city: 'Trabzon', stadium: 'Papara Park', capacity: 40782, prestige: 7, budget: 20, colors: { primary: '#a61c31', secondary: '#248b9f' }, founded: 1967 },
    
    // Premier League
    { id: 'mci', name: 'Manchester City', shortName: 'MCI', leagueId: 'premier', city: 'Manchester', stadium: 'Etihad Stadium', capacity: 53400, prestige: 10, budget: 150, colors: { primary: '#6CABDD', secondary: '#1C2C5B' }, founded: 1880 },
    { id: 'ars', name: 'Arsenal', shortName: 'ARS', leagueId: 'premier', city: 'Londra', stadium: 'Emirates Stadium', capacity: 60704, prestige: 9, budget: 100, colors: { primary: '#EF0107', secondary: '#FFFFFF' }, founded: 1886 },
    { id: 'liv', name: 'Liverpool', shortName: 'LIV', leagueId: 'premier', city: 'Liverpool', stadium: 'Anfield', capacity: 61276, prestige: 10, budget: 120, colors: { primary: '#C8102E', secondary: '#F6EB61' }, founded: 1892 },

    // La Liga
    { id: 'rma', name: 'Real Madrid', shortName: 'RMA', leagueId: 'laliga', city: 'Madrid', stadium: 'Santiago Bernabeu', capacity: 83186, prestige: 10, budget: 180, colors: { primary: '#FFFFFF', secondary: '#00529F' }, founded: 1902 },
    { id: 'bar', name: 'Barcelona', shortName: 'BAR', leagueId: 'laliga', city: 'Barselona', stadium: 'Camp Nou', capacity: 99354, prestige: 10, budget: 110, colors: { primary: '#004D98', secondary: '#A50044' }, founded: 1899 },
    { id: 'atm', name: 'Atletico Madrid', shortName: 'ATM', leagueId: 'laliga', city: 'Madrid', stadium: 'Wanda Metropolitano', capacity: 70460, prestige: 9, budget: 80, colors: { primary: '#CB3524', secondary: '#FFFFFF' }, founded: 1903 }
  ],
  players: [
    // Galatasaray
    { id: 'p1', firstName: 'Fernando', lastName: 'Muslera', age: 37, nationality: 'Uruguaylı', clubId: 'gs', position: 'GK', overall: 82, stats: { pac: 80, sho: 50, pas: 65, dri: 78, def: 84, phy: 75 }, value: 2.5, wage: 45, contractEnd: 2025, height: 190, weight: 84, potential: 82, traits: ['Lider'] },
    { id: 'p2', firstName: 'Mauro', lastName: 'Icardi', age: 31, nationality: 'Arjantinli', clubId: 'gs', position: 'ST', overall: 85, stats: { pac: 76, sho: 88, pas: 72, dri: 82, def: 40, phy: 78 }, value: 18, wage: 80, contractEnd: 2026, height: 181, weight: 75, potential: 85, traits: ['Clinical Finisher'] },
    { id: 'p3', firstName: 'Dries', lastName: 'Mertens', age: 36, nationality: 'Belçikalı', clubId: 'gs', position: 'CAM', overall: 83, stats: { pac: 72, sho: 81, pas: 84, dri: 85, def: 35, phy: 55 }, value: 4, wage: 55, contractEnd: 2025, height: 169, weight: 61, potential: 83, traits: ['Uzaktan Şut'] },
    { id: 'p4', firstName: 'Lucas', lastName: 'Torreira', age: 28, nationality: 'Uruguaylı', clubId: 'gs', position: 'CDM', overall: 84, stats: { pac: 75, sho: 65, pas: 78, dri: 79, def: 83, phy: 80 }, value: 20, wage: 60, contractEnd: 2027, height: 166, weight: 65, potential: 85, traits: ['Savaşçı'] },
    { id: 'p5', firstName: 'Victor', lastName: 'Nelsson', age: 25, nationality: 'Danimarkalı', clubId: 'gs', position: 'CB', overall: 81, stats: { pac: 68, sho: 30, pas: 55, dri: 50, def: 82, phy: 84 }, value: 15, wage: 40, contractEnd: 2027, height: 185, weight: 78, potential: 84, traits: ['Hava Topu'] },
    
    // Fenerbahçe
    { id: 'p6', firstName: 'Edin', lastName: 'Dzeko', age: 38, nationality: 'Bosnalı', clubId: 'fb', position: 'ST', overall: 84, stats: { pac: 60, sho: 86, pas: 75, dri: 78, def: 45, phy: 82 }, value: 3, wage: 65, contractEnd: 2025, height: 193, weight: 80, potential: 84, traits: ['Pivot'] },
    { id: 'p7', firstName: 'Dusan', lastName: 'Tadic', age: 35, nationality: 'Sırp', clubId: 'fb', position: 'LW', overall: 84, stats: { pac: 68, sho: 80, pas: 86, dri: 83, def: 42, phy: 70 }, value: 5, wage: 60, contractEnd: 2025, height: 181, weight: 76, potential: 84, traits: ['Oyun Kurucu'] },
    { id: 'p8', firstName: 'Fred', lastName: 'Rodrigues', age: 31, nationality: 'Brezilyalı', clubId: 'fb', position: 'CM', overall: 83, stats: { pac: 78, sho: 70, pas: 80, dri: 82, def: 76, phy: 74 }, value: 12, wage: 55, contractEnd: 2027, height: 169, weight: 64, potential: 83, traits: ['Motor'] },
    { id: 'p9', firstName: 'Dominik', lastName: 'Livakovic', age: 29, nationality: 'Hırvat', clubId: 'fb', position: 'GK', overall: 82, stats: { pac: 83, sho: 50, pas: 60, dri: 85, def: 81, phy: 72 }, value: 11, wage: 45, contractEnd: 2028, height: 188, weight: 79, potential: 83, traits: ['Refleks'] },
    { id: 'p10', firstName: 'Ferdi', lastName: 'Kadıoğlu', age: 24, nationality: 'Türk', clubId: 'fb', position: 'LB', overall: 80, stats: { pac: 85, sho: 65, pas: 76, dri: 81, def: 74, phy: 70 }, value: 20, wage: 40, contractEnd: 2027, height: 174, weight: 68, potential: 85, traits: ['Hız'] },

    // Beşiktaş
    { id: 'p11', firstName: 'Vincent', lastName: 'Aboubakar', age: 32, nationality: 'Kamerunlu', clubId: 'bjk', position: 'ST', overall: 82, stats: { pac: 76, sho: 83, pas: 68, dri: 81, def: 35, phy: 80 }, value: 6, wage: 50, contractEnd: 2025, height: 184, weight: 78, potential: 82, traits: ['Güçlü Şut'] },
    { id: 'p12', firstName: 'Gedson', lastName: 'Fernandes', age: 25, nationality: 'Portekizli', clubId: 'bjk', position: 'CM', overall: 80, stats: { pac: 82, sho: 68, pas: 77, dri: 82, def: 72, phy: 75 }, value: 14, wage: 40, contractEnd: 2027, height: 181, weight: 71, potential: 84, traits: ['Dripling'] },
    { id: 'p13', firstName: 'Mert', lastName: 'Günok', age: 35, nationality: 'Türk', clubId: 'bjk', position: 'GK', overall: 79, stats: { pac: 78, sho: 40, pas: 65, dri: 79, def: 80, phy: 75 }, value: 1.5, wage: 25, contractEnd: 2025, height: 196, weight: 92, potential: 79, traits: ['Lider'] },
    { id: 'p14', firstName: 'Milot', lastName: 'Rashica', age: 27, nationality: 'Kosovalı', clubId: 'bjk', position: 'RW', overall: 78, stats: { pac: 86, sho: 72, pas: 73, dri: 79, def: 45, phy: 68 }, value: 8, wage: 35, contractEnd: 2027, height: 177, weight: 73, potential: 79, traits: ['Hız'] },

    // Trabzonspor
    { id: 'p15', firstName: 'Uğurcan', lastName: 'Çakır', age: 28, nationality: 'Türk', clubId: 'ts', position: 'GK', overall: 80, stats: { pac: 80, sho: 45, pas: 62, dri: 82, def: 81, phy: 78 }, value: 10, wage: 30, contractEnd: 2027, height: 191, weight: 78, potential: 82, traits: ['Kaptan'] },
    { id: 'p16', firstName: 'Edin', lastName: 'Visca', age: 34, nationality: 'Bosnalı', clubId: 'ts', position: 'RW', overall: 79, stats: { pac: 81, sho: 76, pas: 78, dri: 80, def: 40, phy: 60 }, value: 2, wage: 35, contractEnd: 2025, height: 172, weight: 63, potential: 79, traits: ['Orta'] },

    // Manchester City
    { id: 'p17', firstName: 'Erling', lastName: 'Haaland', age: 23, nationality: 'Norveçli', clubId: 'mci', position: 'ST', overall: 91, stats: { pac: 89, sho: 93, pas: 66, dri: 80, def: 45, phy: 88 }, value: 180, wage: 350, contractEnd: 2027, height: 195, weight: 94, potential: 95, traits: ['Clinical Finisher'] },
    { id: 'p18', firstName: 'Kevin', lastName: 'De Bruyne', age: 32, nationality: 'Belçikalı', clubId: 'mci', position: 'CM', overall: 91, stats: { pac: 72, sho: 85, pas: 94, dri: 87, def: 65, phy: 78 }, value: 90, wage: 380, contractEnd: 2025, height: 181, weight: 70, potential: 91, traits: ['Oyun Kurucu'] },
    { id: 'p19', firstName: 'Rodri', lastName: 'Hernandez', age: 27, nationality: 'İspanyol', clubId: 'mci', position: 'CDM', overall: 90, stats: { pac: 58, sho: 73, pas: 86, dri: 79, def: 85, phy: 84 }, value: 100, wage: 250, contractEnd: 2027, height: 191, weight: 82, potential: 91, traits: ['Sert Şut'] },

    // Arsenal
    { id: 'p20', firstName: 'Martin', lastName: 'Odegaard', age: 25, nationality: 'Norveçli', clubId: 'ars', position: 'CAM', overall: 88, stats: { pac: 75, sho: 79, pas: 89, dri: 88, def: 58, phy: 68 }, value: 85, wage: 200, contractEnd: 2028, height: 178, weight: 68, potential: 90, traits: ['Oyun Kurucu'] },
    { id: 'p21', firstName: 'Bukayo', lastName: 'Saka', age: 22, nationality: 'İngiliz', clubId: 'ars', position: 'RW', overall: 87, stats: { pac: 85, sho: 82, pas: 83, dri: 88, def: 65, phy: 73 }, value: 100, wage: 180, contractEnd: 2027, height: 178, weight: 65, potential: 91, traits: ['Dripling'] },

    // Real Madrid
    { id: 'p22', firstName: 'Vinicius', lastName: 'Junior', age: 23, nationality: 'Brezilyalı', clubId: 'rma', position: 'LW', overall: 90, stats: { pac: 95, sho: 83, pas: 81, dri: 92, def: 29, phy: 68 }, value: 150, wage: 300, contractEnd: 2027, height: 176, weight: 73, potential: 94, traits: ['Hız', 'Çalım'] },
    { id: 'p23', firstName: 'Jude', lastName: 'Bellingham', age: 20, nationality: 'İngiliz', clubId: 'rma', position: 'CAM', overall: 89, stats: { pac: 82, sho: 84, pas: 85, dri: 88, def: 78, phy: 82 }, value: 130, wage: 220, contractEnd: 2029, height: 186, weight: 75, potential: 95, traits: ['Motor'] },
    
    // Add generic players to fill out teams
  ],
  formations: [
    '4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2', '4-1-2-1-2', '3-4-3'
  ]
};

// Generate missing players for teams to ensure minimum 11 players per team
(function generateGenericPlayers() {
  const genericNames = [
    'Silva', 'Garcia', 'Smith', 'Müller', 'Rossi', 'Martin', 'Yılmaz', 'Kaya', 'Demir', 'Çelik', 
    'Gomez', 'Lopez', 'Taylor', 'Brown', 'Williams', 'Jones', 'Davis', 'Wilson', 'Moore', 'Taylor'
  ];
  const positions = ['GK', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST'];
  const nat = ['Türk', 'İngiliz', 'İspanyol', 'Alman', 'İtalyan', 'Brezilyalı'];

  ChampionMasterData.clubs.forEach(club => {
    const clubPlayersCount = ChampionMasterData.players.filter(p => p.clubId === club.id).length;
    let needed = 16 - clubPlayersCount;
    if (needed > 0) {
      for (let i = 0; i < needed; i++) {
        let overall = Math.max(60, club.prestige * 8 + Math.floor(Math.random() * 10) - 5);
        let pos = positions[Math.floor(Math.random() * positions.length)];
        ChampionMasterData.players.push({
          id: `gen_${club.id}_${i}`,
          firstName: 'Player',
          lastName: genericNames[Math.floor(Math.random() * genericNames.length)],
          age: 18 + Math.floor(Math.random() * 15),
          nationality: nat[Math.floor(Math.random() * nat.length)],
          clubId: club.id,
          position: pos,
          overall: overall,
          stats: {
            pac: overall - 5 + Math.floor(Math.random() * 10),
            sho: overall - 10 + Math.floor(Math.random() * 15),
            pas: overall - 5 + Math.floor(Math.random() * 10),
            dri: overall - 5 + Math.floor(Math.random() * 10),
            def: overall - 15 + Math.floor(Math.random() * 20),
            phy: overall - 5 + Math.floor(Math.random() * 10)
          },
          value: Math.max(0.5, (overall - 60) * 0.5),
          wage: Math.max(5, (overall - 60) * 2),
          contractEnd: 2025 + Math.floor(Math.random() * 4),
          height: 170 + Math.floor(Math.random() * 25),
          weight: 65 + Math.floor(Math.random() * 25),
          potential: overall + Math.floor(Math.random() * 10),
          traits: []
        });
      }
    }
  });
})();

// Expand players to have 120+ FM-style attributes
(function expandPlayerAttributes() {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  ChampionMasterData.players.forEach(p => {
    const o = p.overall || 70;
    const isGK = p.position === 'GK';
    const isDEF = p.position === 'CB' || p.position === 'LB' || p.position === 'RB';
    const isMID = p.position === 'CDM' || p.position === 'CM' || p.position === 'CAM';
    const isATT = p.position === 'LW' || p.position === 'RW' || p.position === 'ST';

    // Base multipliers
    const gkm = isGK ? 1.2 : 0.2;
    const defm = isDEF ? 1.1 : (isGK ? 0.3 : 0.7);
    const midm = isMID ? 1.1 : (isGK ? 0.3 : 0.8);
    const attm = isATT ? 1.1 : (isGK ? 0.2 : 0.7);

    // Generate stats based on overall to keep them realistic
    const gen = (multiplier, baseLimit = 99) => {
      const val = Math.round(o * multiplier + rand(-5, 5));
      return Math.min(Math.max(val, 1), baseLimit);
    };
    const gen20 = (multiplier) => {
      const val = Math.round((o / 5) * multiplier + rand(-2, 2));
      return Math.min(Math.max(val, 1), 20);
    };

    p.mental = {
      leadership: gen20(1.0), pressure: gen20(1.0), loyalty: gen20(1.0),
      professionalism: gen20(1.0), ambition: gen20(1.0), controversy: rand(1, 15),
      adaptability: gen20(1.0), consistency: gen20(1.0), dirtiness: rand(1, 15),
      importantMatches: gen20(1.0)
    };

    p.physical = {
      acceleration: gen(isGK ? 0.5 : 1.0), pace: gen(isGK ? 0.5 : 1.0),
      stamina: gen(isGK ? 0.6 : 1.0), strength: gen(isDEF ? 1.1 : 0.9),
      balance: gen(1.0), jumping: gen(isDEF ? 1.1 : 0.9),
      agility: gen(isATT ? 1.1 : 0.9), naturalFitness: gen(1.0)
    };

    p.technical = {
      finishing: gen(attm), passing: gen(midm), tackling: gen(defm),
      dribbling: gen(isATT || isMID ? 1.1 : 0.5), crossing: gen(isATT || p.position === 'LB' || p.position === 'RB' ? 1.1 : 0.5),
      heading: gen(isDEF || p.position === 'ST' ? 1.1 : 0.6), longShots: gen(midm),
      marking: gen(defm), firstTouch: gen(midm), freeKicks: gen(midm), penalties: gen(attm)
    };

    p.hidden = {
      injuryProneness: rand(1, 15),
      form: rand(10, 20),
      morale: p.mental.professionalism * 5 // 1-100 scale initial
    };

    p.scouting = {
      isScouted: p.clubId === window._setupData?.clubId, // Own club players are scouted by default
      scoutLevel: p.clubId === window._setupData?.clubId ? 100 : 0, // 0-100%
      scoutReport: null
    };
  });
})();

// Expand players to have tactical & positional stats
(function expandTacticalAttributes() {
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  
  ChampionMasterData.players.forEach(p => {
    p.tactical = {
      press: rand(50, 95),
      passingGame: rand(50, 95),
      counter: rand(50, 95),
      positions: {},
      matchesPlayedInPosition: {}
    };
    
    const groups = {
      GK: ['GK'],
      DEF: ['CB', 'LB', 'RB'],
      MID: ['CDM', 'CM', 'CAM', 'RM', 'LM'],
      ATT: ['RW', 'LW', 'ST', 'CF']
    };
    
    const allPos = ['GK','CB','LB','RB','CDM','CM','CAM','RM','LM','RW','LW','ST','CF'];
    
    // Yıldıza göre rating
    // 5: %100, 4: %95, 3: %85, 2: %70, 1: %50, 0: %20
    allPos.forEach(pos => {
      if (pos === p.position) {
        p.tactical.positions[pos] = 5;
      } else if (groups.DEF.includes(p.position) && groups.DEF.includes(pos)) {
        p.tactical.positions[pos] = 3;
      } else if (groups.MID.includes(p.position) && groups.MID.includes(pos)) {
        p.tactical.positions[pos] = 3;
      } else if (groups.ATT.includes(p.position) && groups.ATT.includes(pos)) {
        p.tactical.positions[pos] = 3;
      } else if (
        (groups.MID.includes(p.position) && groups.ATT.includes(pos)) || 
        (groups.ATT.includes(p.position) && groups.MID.includes(pos))
      ) {
        p.tactical.positions[pos] = 2;
      } else if (
        (groups.DEF.includes(p.position) && groups.MID.includes(pos)) || 
        (groups.MID.includes(p.position) && groups.DEF.includes(pos))
      ) {
        p.tactical.positions[pos] = 1;
      } else {
        p.tactical.positions[pos] = 0;
      }
    });
    
    // Sağ / Sol ayak belirleme
    if (!p.preferredFoot) {
      if (p.position === 'LB' || p.position === 'LW' || p.position === 'LM') {
        p.preferredFoot = 'Left';
      } else if (p.position === 'RB' || p.position === 'RW' || p.position === 'RM') {
        p.preferredFoot = 'Right';
      } else {
        p.preferredFoot = Math.random() > 0.3 ? 'Right' : 'Left';
      }
    }
  });
})();
