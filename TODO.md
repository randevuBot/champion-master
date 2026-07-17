# Champion Master - Geliştirme Yol Haritası ve TODO Listesi

## 1. Mevcut Durum Analizi
Proje, **Vanilla JS** konseptinden başarıyla **Next.js 14, Zustand, TailwindCSS ve Framer Motion** tabanlı modern bir yapıya geçirilmiş. Maç motoru (`MatchEngine`) oldukça detaylı ve 2D Saha (`Pitch2D`) entegrasyonu harika bir görsel deneyim sunuyor. Yapay zeka destekli spiker ve maç sonu raporları oyuna inanılmaz bir derinlik katmış.

### 🔍 Tespit Edilen Eksikler ve Geliştirme Önerileri

**1. Kondisyon (Stamina) ve Yorgunluk Sistemi:**
Maç motorunda 90 dakika boyunca oyuncuların kondisyonunun erimesi ve yorulan oyuncuların hata yapma riskinin artması.

**2. Moral ve Form Sistemi:**
Galibiyet/mağlubiyet serilerinin oyuncu moralini etkilemesi ve bunun saha içi rating'ine (Overall) yansıması.

**3. Gelişmiş Transfer Pazarı (CPU Transfers):**
Diğer kulüplerin kendi aralarında transfer yapması ve kullanıcının başarılı oyuncularına teklif getirmesi.

**4. Kupa Fikstürü (Cup Bracket):**
Kupa maçlarının sadece rastgele bir maç olmak yerine gerçek bir turnuva ağacı (çeyrek final, yarı final vb.) şeklinde tasarlanması.

**5. Finans ve Gelirler (Stadyum & Sponsor):**
İç saha maçlarından elde edilen bilet gelirleri, haftalık sponsor ödemeleri ve yayın hakları gelirleri.

**6. Çöp Temizleme Aracı (Garbage Collector):**
LocalStorage (5MB) limitini korumak için 1 sezondan eski haberleri ve önemsiz logları silen sistem.

**7. Oyuncu Gelişimi ve Yaşlanma (Progression & Regression):**
Genç oyuncuların maç oynadıkça ve antrenmanla reyting (Overall) kazanması, 32+ yaşındaki oyuncuların ise yavaş yavaş özelliklerini kaybetmesi ve emeklilik mekaniği.

**8. Sakatlık ve Kart Cezası Döngüsü (Kritik Bug Fix):**
Hafta atlandığında (`advanceWeek`), sakat oyuncuların iyileşme süresinin ve kırmızı kart cezalarının 1 hafta düşürülmesi.

**9. Yönetim Güveni (Board Confidence):**
Kötü sonuçlar alındığında yönetimin güveninin düşmesi ve nihayetinde menajerin (kullanıcının) kovulabilmesi.

**10. Gerçekçi Maaş ve Sözleşmeler:**
Her hafta oyuncuların haftalık maaşlarının kasadan otomatik düşmesi. Sözleşme yılı biten oyuncuların "Serbest (Free Agent)" statüsüne geçmesi.

**11. Oyuncu Kondisyonu (Fitness) Yenilenmesi:**
Maçta yorulan (%60) oyuncunun hafta içinde dinlenerek bir sonraki maça %95-100 seviyesinde çıkabilmesi.

**12. Gözlemci Ağı (Scouting / Fog of War):**
Gerçekçi menajerlik oyunlarındaki gibi diğer takımların oyuncularının tam reytinglerini (Örn: 85) doğrudan görememe. Oyuncuyu ancak Scout (Gözlemci) gönderip rapor aldıktan sonra net özelliklerini görebilme.

**13. Tesis Geliştirmeleri (Facilities):**
Stadyum kapasitesini büyütme (daha çok bilet geliri), Antrenman tesislerini geliştirme (daha hızlı oyuncu gelişimi) ve Gençlik Akademisi seviyesi (daha yüksek potansiyelli Regen oyuncular çıkarma).

**14. Oyuncu Mutsuzluğu ve İsyan (Player Dynamics):**
Sürekli yedek kalan, maaşını az bulan veya büyük kulüplere gitmek isteyen oyuncuların mutsuz olup "Transfer İsteğinde" bulunması.

**15. Taktiksel Uyum (Chemistry / Familiarity):**
Yeni transfer edilen bir oyuncunun hemen %100 performans verememesi veya takımın yeni bir taktiğe alışmasının birkaç hafta sürmesi.

**16. Teknik Ekip (Staff Management):**
Asistan Menajer, Antrenör, Kondisyoner ve Gözlemci (Scout) işe alabilme. Bu personellerin kalitesinin takıma pasif bonuslar sağlaması.

---

## 2. Geliştirme Görevleri (Action Plan)

Yukarıdaki analiz ışığında uygulanabilir adım adım planımız:

- [x] **Görev 1:** Sakatlık ve Kart Cezası düşüş mantığını `advanceWeek` içine ekle. (Acil Bug Fix)
- [x] **Görev 2:** Haftalık maaşların kasadan düşmesi ve kondisyon yenilenmesi.
- [x] **Görev 3:** Maç motoruna kondisyon (yorgunluk) sistemi eklenmesi.
- [x] **Görev 4:** Moral sistemi ve maç sonuçlarının oyunculara etkisi.
- [x] **Görev 5:** Oyuncu yaşlanması, gelişimi (Progression) ve emeklilik.
- [x] **Görev 6:** CPU transfer zekasının yazılması (Dışarıdan teklif gelmesi).
- [x] **Görev 7:** Save Dosyası Temizleyici (Garbage Collector).
- [x] **Görev 8:** Stadyum, Sponsor ve Tesis (Facilities) geliştirme ekranı.
- [x] **Görev 9:** Gözlemci Sistemi (Scouting - Fog of War).
- [ ] **Görev 10:** Takım Uyumu (Chemistry) ve Oyuncu Mutsuzluğu.
- [ ] **Görev 11:** Teknik ekip işe alım sistemi.
- [ ] **Görev 12:** Kupa fikstürü turnuva ağacı oluşturma.
- [ ] **Görev 13:** Groq API: Yapay Zeka Odaklı Transfer Görüşmeleri (AI Negotiations).
- [ ] **Görev 14:** Groq API: Gerçekçi Oyuncu İsyanları ve Etkileşimleri (WhatsApp tarzı mesajlar).
- [ ] **Görev 15:** Groq API: Dinamik Basın Toplantıları (Kararların morale etkisi).
- [ ] **Görev 16:** Groq API: Yönetim (Board) Beklentileri ve Ultimatomlar.
- [ ] **Görev 17:** Sezon Sonu Geçişi (Şampiyonluk Kutlamaları, Küme Düşme ve Çıkma - Relegation/Promotion).
- [ ] **Görev 18:** Ödüller ve Tarihçe (Gol Kralı, Yılın Futbolcusu, Geçmiş sezonların kaydedilmesi).
- [x] **Görev 19:** Çoklu Kayıt Sistemi (Farklı Slotlarda Save/Load yapabilme menüsü).
- [ ] **Görev 20:** Emeklilik ve Regen Sistemi (Eksilen oyuncuların yerine 16-17 yaşında yeni yeteneklerin veritabanına eklenmesi).
- [ ] **Görev 21:** Menajer Yetenek Ağacı (Kazanılan XP'ler ile transfer, taktik vb. özellikler açma).
- [ ] **Görev 22:** Dinamik Hava Durumu ve Zemin (Yağmurlu/Karlı havada maç motorundaki istatistiklerin değişmesi).
- [ ] **Görev 23:** Oyuncu Karakteristikleri (PlayStyles / Traits) (Örn: Uzaktan şut atar, Agresif oynar).
- [ ] **Görev 24:** Milli Takımlar ve Uluslararası Turnuvalar (Menajere milli takım teklifleri gelmesi).
- [ ] **Görev 25:** Küresel Liderlik Tablosu (Veritabanı üzerinden diğer gerçek oyuncularla XP / Başarı kıyaslaması).
- [ ] **Görev 26:** Sosyal Medya Girişi (Google ve Facebook ile giriş / kayıt entegrasyonu).
- [ ] **Görev 27:** Premium Maç Sonucu Paylaşım Şablonu (Kullanıcıların maç sonuçlarını estetik bir kart tasarımı ile Twitter/Instagram'da paylaşabilmesi).
- [ ] **Görev 28:** FC2026 Tarzı Yıldız Oyuncu Animasyonu (Yüksek reytingli bir oyuncu transfer edildiğinde ekranda kart/yürüme tarzı havalı bir kutlama animasyonunun girmesi).
- [ ] **Görev 29:** Dinamik Oyuncu Yüzleri (Avatarlar) (DiceBear API veya benzeri bir yöntemle her oyuncuya ID'sine/ismine özel, düşük boyutlu ve premium görünen rastgele bir yüz atanması).
- [ ] **Görev 30:** Gerçek Takım/Oyuncu Veritabanı ve Cron Mimarisi (API-Football vb. bir API'den saat başı 10 takım ve oyuncularının çekilerek Vercel Cron Jobs ile Prisma veritabanına kaydedilmesi. Günlük 100 API istek limitini aşmamak için "Kuyruk (Queue)" mantığı kullanılması).
- [ ] **Görev 31:** Groq API: Menajer Özel Hayatı ve Skandallar (RPG Sistemi). Menajerin kişisel maaşıyla lüks tüketim (yat, kat, araba) yapabilmesi, kumar/gece hayatı gibi aksiyonlara girmesi ve Groq yapay zekasının bu eylemlere göre asılsız veya gerçek skandal haberleri, rüşvet / hapis gibi sonuçlar üretip takım moralini etkilemesi.
- [x] **Görev 32:** Gelişmiş Gelen Kutusu (Inbox) Tasarımı ve Kategorizasyonu. Sadece genel haberlerin aktığı bir ekran yerine; "Transfer Teklifleri", "Sağlık Ekibi Raporları (Sakatlık/İyileşme)", "Yönetim (Board) Kararları" ve "Kişisel Özel Hayat Mesajları" şeklinde kategorilere ayrılmış profesyonel bir e-posta / mesajlaşma arayüzü.
- [x] **Görev 33:** Performans Optimizasyonu (IndexedDB Geçişi). Zustand `localStorage` üzerinde çalışıyor, veri (oyuncu/haber sayısı) çok büyüdüğünde tarayıcıyı dondurmaması için kayıt sisteminin asenkron `IndexedDB` altyapısına geçirilmesi.
- [x] **Görev 34:** Framer Motion ile Pürüzsüz Sayfa Geçişleri (Page Transitions). Menüler arası (Kadro, Taktik, Transfer) geçiş yaparken ekranın küt diye değişmesi yerine sağdan kayarak/yumuşakça gelmesi (`AnimatePresence` entegrasyonu).
- [x] **Görev 35:** Maç Motoru Hızlandırma Seçenekleri (2x, 4x, Anında Bitir). Oyuncunun 2D maç ekranını beklemek istemediği durumlar için simülasyon hızını artırma veya maçı direkt sonuçlandırma (Simulate to End) butonu.
- [ ] **Görev 36:** Premium Arayüz Sesleri (UI Sound Design). Sadece maç içinde değil, menüde butonlara tıklarken, transfer kabul edildiğinde veya paket (oyuncu) açarken hafif ve tatmin edici ses efektlerinin çalması.
- [x] **Görev 38:** İnteraktif Gelen Kutusu (Seçim Tabanlı Gelen Mailler). Rakip takım ajanları, şaibeli sponsorlar ve medyadan gelen karara dayalı (Evet/Hayır/Reddet) mailler.
- [x] **Görev 39:** Menajer İtibarı (Reputation) ve Popülarite Sistemi. Kullanıcının Gelen Kutusunda verdiği kararların ve maç sonuçlarının birleşerek itibar puanını etkilemesi (Etkiler: Transfer başarısı, yönetim güveni).
- [x] **Görev 40:** Groq API: Dinamik Kulüp Olayları ve RPG Derinliği. Oyuncu kaprisleri (Örn: Gece kulübü baskını), kulüp başkanının torpil istekleri ve menajer (temsilci) oyunlarının yapay zeka tarafından haber/skandal olarak yaratılması.
- [ ] **Görev 41:** Bulut Kayıt (Cloud Save) Sistemi: Yerel IndexedDB veritabanı yerine, hesapların ve kariyer slotlarının PostgreSQL, Supabase veya Firebase gibi gerçek bir Backend DB'ye taşınması (Çapraz Cihaz Desteği için).
