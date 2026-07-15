# Champion Master — Proje Rehberi (AGENTS.md)

> Bu belge, **Champion Master** projesinin genel yapısını, kurallarını ve kullanılması gereken araçları açıklar. AI ajanları ve geliştiriciler için referans dokümanıdır.

---

## Proje Özeti
**Champion Master** — HTML, CSS ve Vanilla JavaScript (modüler) ile geliştirilmiş web tabanlı bir menajerlik oyunu.

- **Frontend:** Vanilla HTML, CSS
- **Programlama Dili:** JavaScript (ES6+ Modülleri)
- **Yapı:** Herhangi bir framework (React, Vue vb.) veya build aracı (Webpack, Vite) kullanılmamaktadır.
- **Stil Yönetimi:** Doğrudan CSS (`style.css` ve mobil uyumluluk için `mobile.css`).

---

## Dizin Yapısı ve Sorumluluklar

```
├── index.html            # Oyunun ana HTML giriş dosyası
├── css/                  
│   ├── style.css         # Temel stiller ve UI tasarımları
│   └── mobile.css        # Mobil uyumluluk (responsive) stilleri
├── js/                   
│   ├── app.js            # Uygulama başlatıcısı
│   ├── data.js           # Oyun içi statik veriler ve veri modelleri
│   ├── game.js           # Ana oyun döngüsü ve oyun state'i
│   ├── match.js          # Maç simülasyonu mantığı
│   ├── ui.js             # DOM manipülasyonu ve arayüz etkileşimleri
│   └── systems/          # Alt sistemler
│       ├── ai.js         # Rakip takım yapay zekası
│       ├── finance.js    # Bütçe ve finans yönetimi
│       ├── scout.js      # Yetenek avcısı ve transfer sistemi
│       ├── tactics.js    # Takım taktikleri yönetimi
│       └── time.js       # Oyun içi zaman / takvim sistemi
└── docs/                 # Proje belgeleri
```

---

## Kodlama ve Geliştirme Kuralları

1. **Vanilla JS Kullanımı:**
   - Framework veya kütüphane eklenmeyecektir. Tüm sistemler saf JavaScript ile yazılır.
   - Global namespace kirliliğini önlemek için modüler yapı (import/export) kullanılmalıdır.

2. **DOM Manipülasyonu:**
   - UI güncellemeleri yalnızca `ui.js` üzerinden yönetilmeli, core mantık dosyaları (örn: `game.js`, `match.js`) doğrudan DOM ile etkileşime girmemelidir.

3. **Stil (CSS) Kuralları:**
   - Yeni stiller eklenirken `style.css` içine, mobil görünümlerle ilgili değişiklikler `mobile.css` içine eklenmelidir.
   - Inline CSS kullanımından (HTML içi `style="..."`) kaçınılmalıdır.

4. **Sorumlulukların Ayrılığı (SOLID):**
   - Alt sistemler (`systems/` klasörü) kendi alanlarından sorumlu olmalıdır (örn. `finance.js` sadece parayı yönetir, taktikle ilgilenmez).
