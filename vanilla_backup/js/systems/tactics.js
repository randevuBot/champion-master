/**
 * ChampionMaster — Tactics & Position Compatibility System
 */

const TacticsSystem = {
  // Calculates the effective overall of a player when played in a specific slot
  getEffectiveOverall: function(player, slot) {
    if (!player || !player.tactical) return player ? player.overall : 0;
    
    const baseOverall = player.overall;
    let stars = player.tactical.positions[slot];
    
    // Default fallback if slot is missing in tactical
    if (stars === undefined) {
      if (player.position === slot) stars = 5;
      else stars = 1;
    }
    
    let penalty = 0;
    switch (stars) {
      case 5: penalty = 0; break;
      case 4: penalty = 2; break;
      case 3: penalty = 5; break;
      case 2: penalty = 10; break;
      case 1: penalty = 18; break;
      case 0: penalty = 30; break;
      default: penalty = 30; break;
    }

    // Foot penalty
    if (slot === 'LB' || slot === 'LM' || slot === 'LW') {
      if (player.preferredFoot !== 'Left') penalty += 3;
    }
    if (slot === 'RB' || slot === 'RM' || slot === 'RW') {
      if (player.preferredFoot !== 'Right') penalty += 3;
    }
    
    return Math.max(1, baseOverall - penalty);
  },

  // Color coding for effective overall vs base overall
  getCompatibilityColor: function(base, effective) {
    const diff = base - effective;
    if (diff <= 0) return '#4caf50'; // Green (5 stars)
    if (diff <= 3) return '#cddc39'; // Light green (4 stars)
    if (diff <= 7) return '#ffeb3b'; // Yellow (3 stars)
    if (diff <= 15) return '#ff9800'; // Orange (2 stars)
    return '#f44336'; // Red (1-0 stars)
  },

  // Calculate team compatibility/chemistry (0-100)
  getTeamCompatibility: function(lineup, formationSlots) {
    let totalScore = 0;
    let validPlayers = 0;
    
    lineup.forEach((pId, i) => {
      if (!pId) return;
      const player = CM.getPlayer(pId);
      if (!player) return;
      
      const slot = formationSlots[i];
      let stars = player.tactical?.positions[slot] || 1;
      if (stars === 5) totalScore += 100;
      else if (stars === 4) totalScore += 90;
      else if (stars === 3) totalScore += 70;
      else if (stars === 2) totalScore += 40;
      else if (stars === 1) totalScore += 10;
      
      validPlayers++;
    });
    
    if (validPlayers === 0) return 0;
    return Math.round(totalScore / validPlayers);
  },
  
  // Tactical sub-scores based on squad attributes
  getTacticalSubScores: function(lineup, formationSlots) {
    let att = 0, def = 0, press = 0, pass = 0, cnt = 0;
    let attCount = 0, defCount = 0, midCount = 0;
    
    lineup.forEach((pId, i) => {
      if (!pId) return;
      const player = CM.getPlayer(pId);
      if (!player) return;
      
      const eff = this.getEffectiveOverall(player, formationSlots[i]);
      const isAtt = ['ST','CF','LW','RW'].includes(formationSlots[i]);
      const isMid = ['CAM','CM','CDM','RM','LM'].includes(formationSlots[i]);
      const isDef = ['CB','LB','RB'].includes(formationSlots[i]);
      
      if (isAtt) { att += eff; attCount++; }
      if (isMid) { pass += player.tactical?.passingGame || 70; midCount++; }
      if (isDef) { def += eff; defCount++; }
      
      press += player.tactical?.press || 60;
      cnt += player.tactical?.counter || 60;
    });
    
    const count = lineup.filter(id => id).length || 1;
    
    return {
      attack: attCount > 0 ? Math.round(att / attCount) : 0,
      defense: defCount > 0 ? Math.round(def / defCount) : 0,
      midfield: midCount > 0 ? Math.round(pass / midCount) : 0,
      pressing: Math.round(press / count),
      counter: Math.round(cnt / count)
    };
  },

  // Generates AI analysis text
  generateAnalysis: function(lineup, formationSlots) {
    const scores = this.getTacticalSubScores(lineup, formationSlots);
    const chem = this.getTeamCompatibility(lineup, formationSlots);
    
    let report = [];
    
    if (chem < 70) {
      report.push('🚨 Çoğu oyuncu alışık olmadığı mevkilerde. Pas hataları artabilir.');
    } else if (chem > 90) {
      report.push('✨ Takım kimyası mükemmel. Oyuncular birbirini ezbere tanıyor.');
    }
    
    if (scores.attack < 75) report.push('⚠️ İleride çoğalmakta zorluk çekebiliriz, yaratıcılık düşük.');
    else if (scores.attack > 88) report.push('🔥 Hücum hattı alev alev, bitiricilik üst düzeyde.');
    
    if (scores.midfield > 85) report.push('🧠 Orta saha pasörleri oyunu domine edebilir.');
    
    if (scores.defense < 75) report.push('🧱 Savunmada ciddi boşluklar var, beklerin kademesine dikkat.');
    
    if (scores.pressing > 85) report.push('🏃‍♂️ Yüksek yoğunluklu pres takımı yorabilir, 60. dakikadan sonra değişiklik şart olabilir.');
    
    if (report.length === 0) report.push('📋 Takım dengeli görünüyor, özel bir zafiyet veya üstünlük yok.');
    
    return report;
  },

  // After match learning and morale update
  processPostMatch: function(clubId, lineup, formationSlots) {
    const players = CM.getPlayersByClub(clubId);
    
    lineup.forEach((pId, i) => {
      if (!pId) return;
      const player = players.find(p => p.id === pId);
      if (!player || !player.tactical) return;
      
      const slot = formationSlots[i];
      let stars = player.tactical.positions[slot] || 0;
      
      // Morale penalty if out of position
      if (stars < 3) {
        if (!player.hidden) player.hidden = { morale: 80 };
        player.hidden.morale -= (3 - stars) * 2; // -2 to -6 morale drop
        if (player.hidden.morale < 10) player.hidden.morale = 10;
      }
      
      // Learning
      if (stars < 5) {
        if (!player.tactical.matchesPlayedInPosition[slot]) {
          player.tactical.matchesPlayedInPosition[slot] = 0;
        }
        player.tactical.matchesPlayedInPosition[slot]++;
        
        const played = player.tactical.matchesPlayedInPosition[slot];
        if (played >= 60) player.tactical.positions[slot] = 5;
        else if (played >= 25 && stars < 4) player.tactical.positions[slot] = 4;
        else if (played >= 10 && stars < 3) player.tactical.positions[slot] = 3;
        else if (played >= 3 && stars < 2) player.tactical.positions[slot] = 2;
        else if (played >= 1 && stars < 1) player.tactical.positions[slot] = 1;
      }
    });
  }
};
