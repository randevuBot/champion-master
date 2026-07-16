/**
 * ChampionMaster — CPU Manager System (System AI)
 * Handles algorithmic decision making for CPU teams (Transfers, Tactics, Rotations)
 * and dynamic player development based on match form.
 */

const CpuSystem = (() => {

  // 1. CPU Takımları için Transfer Mantığı (Haftalık kontrol edilir)
  function processWeeklyTransfers() {
    if (!CM || !CM.state) return;
    
    // Transfer dönemi değilse işlem yapma (Hafta 1-6 ve 19-22)
    const week = CM.state.week;
    const isTransferWindow = (week >= 1 && week <= 6) || (week >= 19 && week <= 22);
    if (!isTransferWindow) return;

    const allClubs = ChampionMasterData.clubs;
    const allPlayers = ChampionMasterData.players;

    // Her kulüp için eksik mevkileri belirle ve transfer dene
    allClubs.forEach(club => {
      // Kendi kulübümüzü atla
      if (club.id === CM.state.myClubId) return;

      const squad = allPlayers.filter(p => p.clubId === club.id);
      if (squad.length < 15) return; // Çok az oyuncusu varsa çökmesin

      // Basit bir analiz: Hangi mevkide eksik var?
      const posCounts = { 'GK': 0, 'DEF': 0, 'MID': 0, 'ATT': 0 };
      squad.forEach(p => {
        if (p.position === 'GK') posCounts['GK']++;
        else if (['CB','LB','RB'].includes(p.position)) posCounts['DEF']++;
        else if (['CDM','CM','CAM','RM','LM'].includes(p.position)) posCounts['MID']++;
        else posCounts['ATT']++;
      });

      // Kritik eksik mevkiler
      let targetPos = null;
      if (posCounts['GK'] < 2) targetPos = 'GK';
      else if (posCounts['DEF'] < 6) targetPos = 'DEF';
      else if (posCounts['MID'] < 6) targetPos = 'MID';
      else if (posCounts['ATT'] < 4) targetPos = 'ATT';

      // Eğer kritik eksik varsa ve %15 ihtimal tutarsa transfer yapsın
      if (targetPos && Math.random() < 0.15) {
        // Hedef mevkide oyuncu ara (Başka kulüplerden, bizim kulüp hariç)
        const targets = allPlayers.filter(p => 
          p.clubId !== club.id && 
          p.clubId !== CM.state.myClubId && 
          _getCategory(p.position) === targetPos &&
          p.overall >= club.reputation * 0.7 // Kulüp itibarına uygun
        );

        if (targets.length > 0) {
          // Rastgele bir hedef seç
          const target = targets[Math.floor(Math.random() * targets.length)];
          const estimatedValue = target.value * 1000000;
          
          // CPU bütçe kontrolü (Basit simülasyon)
          if (club.budget > estimatedValue * 1.5) {
            // Transferi gerçekleştir
            club.budget -= estimatedValue;
            
            // Satıcı kulübe para ekle
            const sellerClub = allClubs.find(c => c.id === target.clubId);
            if (sellerClub) sellerClub.budget += estimatedValue;

            target.clubId = club.id;
            
            // Habere düşsün
            CM.state.transferHistory.push({
              type: 'cpu_transfer',
              playerId: target.id,
              fromClubId: sellerClub ? sellerClub.id : null,
              toClubId: club.id,
              amount: estimatedValue,
              week: week
            });

            // Gelen kutusuna ve haberlere bildirim düşebilir
            if (typeof AISystem !== 'undefined') {
              AISystem.generateNewsHeadline({
                type: 'transfer',
                team: club.name,
                player: `${target.firstName} ${target.lastName}`
              }).then(headline => {
                if (headline) CM.addNotification('info', 'Haberler: Transfer', headline);
              });
            } else {
              CM.addNotification('info', 'Transfer Haberi', `${target.firstName} ${target.lastName}, ${club.name} takımına transfer oldu.`);
            }
          }
        }
      }
    });
  }

  // 2. Dinamik Oyuncu Gelişimi (Haftalık kontrol)
  function processPlayerDevelopment() {
    if (!CM || !CM.state) return;
    const allPlayers = ChampionMasterData.players;

    // Tüm oyuncuların formunu ve gelişimini güncelle
    allPlayers.forEach(p => {
      // Sadece oynamış oyuncularda form değişikliği daha belirgin olsun
      const stats = CM.state.playerStats[p.id];
      const apps = stats ? stats.appearances : 0;
      
      // Genç oyuncular oynadıkça daha hızlı gelişir
      if (p.age < 23 && p.overall < p.potential) {
        // Haftalık gelişim ihtimali
        let growthChance = 0.01;
        if (apps > 0) growthChance += 0.02; // Oynuyorsa şansı artar
        
        if (Math.random() < growthChance) {
          p.overall += 1;
          // Kendi takımımızdaysa bildirim yolla
          if (p.clubId === CM.state.myClubId) {
            CM.addNotification('success', 'Oyuncu Gelişimi', `${p.firstName} ${p.lastName} antrenmanlarda yeteneğini geliştirdi! (Genel: ${p.overall})`);
          }
        }
      }

      // Yaşlı oyuncular oynamadıkça formdan düşer
      if (p.age > 32) {
        let decayChance = 0.01;
        if (apps === 0) decayChance += 0.03;
        
        if (Math.random() < decayChance && p.overall > 40) {
          p.overall -= 1;
          if (p.clubId === CM.state.myClubId) {
            CM.addNotification('warning', 'Performans Düşüşü', `${p.firstName} ${p.lastName} yaşın etkisiyle formdan düşüyor. (Genel: ${p.overall})`);
          }
        }
      }
    });
  }

  // 3. Maç İçi Rakip Menajer Zekası (CPU Substitutions & Tactics)
  function decideMatchAction(matchEngine, isHome) {
    // Bu fonksiyon MatchEngine içinde her dakika çağrılabilir veya belirli aralıklarla
    const minute = matchEngine.minute;
    if (minute !== 60 && minute !== 75) return; // Sadece 60 ve 75. dakikalarda karar alsın

    const squad = isHome ? matchEngine.homeSquad : matchEngine.awaySquad;
    const scoreMy = isHome ? matchEngine.score.home : matchEngine.score.away;
    const scoreOpp = isHome ? matchEngine.score.away : matchEngine.score.home;
    const teamName = isHome ? matchEngine.home.shortName : matchEngine.away.shortName;

    // Basit bir değişiklik: Eğer yeniliyorsak ve ofansif biri yorulmuşsa değiştir
    if (scoreMy < scoreOpp) {
      if (Math.random() < 0.5) { // %50 ihtimalle taktiksel hamle
        matchEngine._addEvent('tactic', isHome ? 'home' : 'away', minute, `👔 ${teamName} menajeri kenardan takımı daha ofansif oynaması için uyarıyor!`, 'info');
        // Momentum artışı
        if (isHome) matchEngine.homeMomentum = Math.min(100, matchEngine.homeMomentum + 10);
        else matchEngine.homeMomentum = Math.max(0, matchEngine.homeMomentum - 10);
      }
    }
  }

  // Yardımcı
  function _getCategory(pos) {
    if (pos === 'GK') return 'GK';
    if (['CB','LB','RB'].includes(pos)) return 'DEF';
    if (['CDM','CM','CAM','RM','LM'].includes(pos)) return 'MID';
    return 'ATT';
  }

  // Ana tick fonksiyonu (game.js içinde advanceWeek'te çağrılacak)
  function tick() {
    processWeeklyTransfers();
    processPlayerDevelopment();
  }

  return {
    tick,
    decideMatchAction
  };
})();

if (typeof module !== 'undefined') module.exports = CpuSystem;
