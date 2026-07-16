// ===================================================
//   TIME ENGINE & LIVING WORLD
// ===================================================

const TimeEngine = {
  // Günlük olay döngüsünü tetikler
  advanceDay() {
    if (!CM.state) return;
    
    // Tarih kontrolü (Eski kayıtlarda string "01.08.2025" olabilir)
    let day, month, year;
    if (typeof CM.state.date === 'string') {
      [day, month, year] = CM.state.date.split('.').map(Number);
    } else {
      day = CM.state.date.day;
      month = CM.state.date.month;
      year = CM.state.date.year;
    }
    
    // Tarihi 1 gün ileri al
    day++;
    
    // Basit bir ay sonu kontrolü (gerçek hayatta aylar 28,30,31 çeker ama şimdilik standart 30 diyelim veya gerçekçi yapalım)
    const daysInMonth = [31, (year%4===0?29:28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (day > daysInMonth[month - 1]) { 
      day = 1; 
      month++; 
    }
    if (month > 12) { 
      month = 1; 
      year++; 
    }
    
    CM.state.date = { day, month, year };
    
    // Gelen Kutusu Mesajlarını Temizle (Eski mesajları silme, yenilerini ekleyeceğiz)
    if (!CM.state.inbox) CM.state.inbox = [];
    
    this.processAITransfers();
    this.processInjuries();
    this.processMediaNews();
    this.processMorale();
    
    // Tüm liglerde o gün maç varsa simüle et
    this.processMatchesForToday();

    CM.save();
  },

  // AI takımları kendi aralarında transfer veya oyuncu listeleme yapar
  processAITransfers() {
    // Yüzde 25 ihtimalle bir oyuncu transfer listesine konur veya teklif alır
    if (Math.random() < 0.25) {
      const allPlayers = ChampionMasterData.players.filter(p => p.clubId !== CM.state.myClubId);
      if (allPlayers.length > 0) {
        const p = allPlayers[Math.floor(Math.random() * allPlayers.length)];
        const clubs = ChampionMasterData.clubs.filter(c => c.id !== p.clubId && c.id !== CM.state.myClubId);
        if (clubs.length > 0) {
          const buyer = clubs[Math.floor(Math.random() * clubs.length)];
          const fee = Math.floor(p.value * 1000000 * (0.8 + Math.random() * 0.5));
          
          if (buyer.budget * 1000000 > fee) {
            // Transfer Gerçekleşti!
            p.clubId = buyer.id;
            
            // Inbox'a veya Haberlere Ekle
            this.sendNews(`Transfer Söylentisi: ${p.firstName} ${p.lastName}, ${CM.formatMoney(fee)} karşılığında yeni takımına katıldı.`, 'Transfer', 'info');
          }
        }
      }
    }
  },

  // Antrenman veya günlük yaşantıda sakatlıklar
  processInjuries() {
    // Sadece senin takımın için şimdilik (%8 ihtimal)
    if (Math.random() < 0.08) {
      const mySquad = CM.getMyPlayers();
      if (mySquad.length > 0) {
        const p = mySquad[Math.floor(Math.random() * mySquad.length)];
        const weeks = Math.floor(Math.random() * 3) + 1; // 1-3 hafta sakatlık
        
        this.addInjury(p.id, weeks);
        this.sendInbox(`Sağlık Ekibi Raporu`, `Kötü haber patron. Antrenmanda ${p.firstName} ${p.lastName} sakatlandı. Tahmini sahalardan uzak kalma süresi: ${weeks} hafta.`, 'Physio');
      }
    }
  },

  addInjury(playerId, weeks) {
    if (!CM.state.injured) CM.state.injured = [];
    const existing = CM.state.injured.find(i => i.playerId === playerId);
    if (existing) {
      existing.weeksLeft += weeks;
    } else {
      CM.state.injured.push({ playerId, weeksLeft: weeks });
    }
  },

  processMediaNews() {
    if (Math.random() < 0.40) {
      const newsEvents = [
        "Taraftarlar son haftalardaki futboldan oldukça memnun.",
        "Yönetim kurulu finansal hedeflerin gerisinde kalındığını düşünüyor.",
        "Basında çıkan dedikodulara göre yıldız oyuncunuzun aklı başka takımda.",
        "Yerel medya taktiğinizin çok defansif olduğunu yazdı."
      ];
      const msg = newsEvents[Math.floor(Math.random() * newsEvents.length)];
      this.sendNews(msg, 'Medya', 'warning');
    }
  },

  processMorale() {
    // Oyuncuların morali her gün %1 kendi doğal seviyesine (50) yaklaşır
    CM.getMyPlayers().forEach(p => {
      if (p.morale > 50) p.morale -= 1;
      else if (p.morale < 50) p.morale += 1;
    });
  },

  processMatchesForToday() {
    // Şu anki fikstür haftasında maç var mı kontrolü
    // İleride güncel tarihe göre maçlar oynanacak
  },

  sendInbox(title, message, sender = 'Sistem') {
    if (!CM.state.inbox) CM.state.inbox = [];
    CM.state.inbox.unshift({
      id: Date.now() + Math.random().toString(),
      date: CM.formatDate(CM.state),
      title,
      message,
      sender,
      read: false
    });
    // Maksimum 50 mesaj tut
    if (CM.state.inbox.length > 50) CM.state.inbox.pop();
    
    // Bildirim ikonu göster
    UI.updateInboxBadge();
  },

  sendNews(message, category = 'Genel', type = 'info') {
    if (!CM.state.news) CM.state.news = [];
    CM.state.news.unshift({
      date: CM.formatDate(CM.state),
      message,
      category,
      type
    });
    if (CM.state.news.length > 20) CM.state.news.pop();
  }
};
