/**
 * ChampionMaster — AI System (BYOK: Bring Your Own Key)
 * =====================================================
 * Kullanıcı kendi Gemini veya OpenAI API anahtarını girer.
 * Anahtar localStorage'da saklanır.
 *
 * Özellikler:
 *  - AISystem.init()                          -> UI başlatır, sidebar'a "Yapay Zeka" butonu ekler
 *  - AISystem.generateMatchCommentary(data)   -> Türkçe dramatik maç anlatımı üretir
 *  - AISystem.generateNewsHeadline(event)     -> Türkçe haber başlığı üretir
 *  - AISystem.setApiKey(provider, key)        -> Anahtarı kaydeder
 *  - AISystem.getApiKey(provider)             -> Anahtarı getirir
 */

const AISystem = (() => {
  const STORAGE_KEY_GEMINI = 'cm_ai_gemini_key';
  const STORAGE_KEY_OPENAI = 'cm_ai_openai_key';
  const STORAGE_PROVIDER   = 'cm_ai_provider';

  const GEMINI_ENDPOINT = (key) =>
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + key;

  const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

  // Fallback Template'ler (10 adet dramatik Türkçe anlatım)
  const FALLBACK_TEMPLATES = [
    (d) => '🎙️ MUHTEŞEM BİR KARŞILAŞMA! ' + d.home + ' ile ' + d.away + ' arasındaki bu destansı müsabakada tarihe geçecek bir sonuç çıktı: ' + d.score + '. Sahada dökülen ter ve kırılan kalpler, futbolun büyüsünü bir kez daha gözler önüne serdi.',
    (d) => '🎙️ Düdük öttü, perde kapandı! ' + d.home + ' karşısında ' + d.away + ' ile oynanan çarpışmada final skoru ' + d.score + ' olarak tescillendi. ' + (d.goals > 0 ? d.goals + ' golün atıldığı' : 'Golsüz geçen') + ' bu karşılaşma tribünlerdeki taraftarları büyüledi.',
    (d) => '🎙️ İşte bu futbol! ' + d.home + ' vs ' + d.away + ' — Gerginlik doruk noktasına ulaştı, sonuç: ' + d.score + '. Her iki takım da sahaya her şeyini koydu; kazanan oldu ama futbol hiç kaybetmedi.',
    (d) => '🎙️ Tarihi bir gün! ' + d.home + ' ile ' + d.away + ' arasında oynanan bu müsabakada ' + d.score + ' sonucu çıktı. ' + (d.winner !== 'draw' ? d.winner + ' bugün rakibine gün yüzü göstermedi ve sahadan muzaffer ayrıldı.' : 'Beraberlik her iki takımın da mücadelesini yansıtıyor.'),
    (d) => '🎙️ Ve sahalar suskun kaldı! ' + d.home + ' — ' + d.away + ' derbisinde şaşırtıcı bir atmosfer yaşandı. Nihai sonuç ' + d.score + ' ile tarihe geçti. ' + d.shots + ' şutun atıldığı bu karşılaşma, kaliteli futbolun göstergesiydi.',
    (d) => '🎙️ Kalpler durdu, nefesler kesildi! ' + d.home + ' ile ' + d.away + ' arasındaki bu epik çatışma ' + d.score + ' skoruyla noktalandı. Saha, her dakikası ayrı bir drama barındıran bu karşılaşmaya ev sahipliği yaptı.',
    (d) => '🎙️ Futbol büyülemeye devam ediyor! ' + d.home + ' - ' + d.away + ' maçı ' + d.score + ' ile sona erdi. %' + d.possession + ' topla oynama oranıyla baskın olan taraf bile sonucu her zaman kendi lehine çeviremiyor; futbol böyle bir oyun!',
    (d) => '🎙️ SONUÇ: ' + d.score + '! ' + d.home + ' ile ' + d.away + ' arasında oynanan karşılaşmada ' + d.cards + ' kart çıktı, tribünler çılgına döndü. ' + (d.winner !== 'draw' ? d.winner + ' bugün rakibini mat etti.' : 'Beraberlik ise iki tarafı da memnun etmedi.'),
    (d) => '🎙️ Unutulmaz bir gece geride kaldı. ' + d.home + ' ile ' + d.away + ' arasındaki bu destansı mücadele ' + d.score + ' sonucuyla tamamlandı. Maçı izleyenler futbolun tüm güzelliklerini ve acımasızlığını bir arada yaşadı.',
    (d) => '🎙️ Perde indi! ' + d.home + ' - ' + d.away + ' maçı ' + d.score + ' skoruyla tarihe geçti. İstatistikler: ' + d.shots + ' şut, %' + d.possession + ' topla oynama. ' + (d.goals > 2 ? 'Gollerin şov yaptığı bu karşılaşma, herkesi büyüledi.' : 'Düşük skorlu ama yoğun tempolu bu maç sinir bozucu anlara sahne oldu.'),
  ];

  // Haber başlığı fallback'leri
  const NEWS_TEMPLATES = {
    win:      (e) => ['⭐ ' + e.team + ' Sahada Fırtına Estirdi: ' + e.score + ' ile Zafer!', '🏆 Muhteşem Galibiyet! ' + e.team + ' ' + e.score + ' ile Rakibini Devirdi!', '🔥 ' + e.team + "'dan Tarihi Zafer: " + e.score + '!'],
    loss:     (e) => ['😔 ' + e.team + ' Evinde Şok Mağlubiyet: ' + e.score, '📉 ' + e.team + ' Rakibine Boyun Eğdi: ' + e.score, '⚠️ Kötü Gün! ' + e.team + ' ' + e.score + ' Kaybetti'],
    draw:     (e) => ['🤝 Puanlar Paylaşıldı: ' + e.team + ' ' + e.score + ' Berabere Kaldı', '⚖️ Dengeli Karşılaşma! ' + e.team + ' ' + e.score + ' ile Beraberlik Aldı'],
    transfer: (e) => ['🤝 Bomba Transfer! ' + e.player + ' ' + e.team + " Formasını Giyiyor", '📝 ' + e.team + ' Kadrosuna ' + e.player + "'ı Kattı!", '💰 Büyük İmza: ' + e.player + ' ' + e.team + "'a Geldi"],
    injury:   (e) => ['🩹 Sakatlık Şoku! ' + e.player + ' Sahalardan Uzak', '😢 ' + e.team + "'da Kötü Haber: " + e.player + ' ' + e.weeks + ' Hafta Yok', '⚕️ ' + e.player + ' Sakatlandı, ' + e.team + ' Endişeli'],
    default:  (e) => ['📰 ' + (e.team || 'Kulüp') + "'dan Son Dakika Gelişmesi!"],
  };

  function _pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function _buildMatchData(matchData) {
    const home = matchData.home ? (matchData.home.shortName || matchData.home.name || 'Ev Sahibi') : 'Ev Sahibi';
    const away = matchData.away ? (matchData.away.shortName || matchData.away.name || 'Deplasman') : 'Deplasman';
    const sh = matchData.score ? (matchData.score.home || 0) : 0;
    const sa = matchData.score ? (matchData.score.away || 0) : 0;
    const score = sh + ' - ' + sa;
    const goals = sh + sa;
    const shots = matchData.stats && matchData.stats.shots
      ? (matchData.stats.shots.home || 0) + (matchData.stats.shots.away || 0) : 0;
    const cards = matchData.stats
      ? ((matchData.stats.yellowCards ? (matchData.stats.yellowCards.home||0)+(matchData.stats.yellowCards.away||0) : 0) +
         (matchData.stats.redCards ? (matchData.stats.redCards.home||0)+(matchData.stats.redCards.away||0) : 0)) : 0;
    const possession = matchData.stats && matchData.stats.possession ? (matchData.stats.possession.home || 50) : 50;
    const winner = sh > sa ? home : (sa > sh ? away : 'draw');
    return { home, away, score, goals, shots, cards, possession, winner };
  }

  function setApiKey(provider, key) {
    localStorage.setItem(provider === 'openai' ? STORAGE_KEY_OPENAI : STORAGE_KEY_GEMINI, key.trim());
    localStorage.setItem(STORAGE_PROVIDER, provider);
  }

  function getApiKey(provider) {
    let key = localStorage.getItem(provider === 'openai' ? STORAGE_KEY_OPENAI : STORAGE_KEY_GEMINI);
    if (!key && provider === 'gemini') {
      key = prompt("Lütfen Gemini API anahtarınızı girin (Güvenlik nedeniyle Github izin vermediği için koda gömülemez):");
      if (key) localStorage.setItem(STORAGE_KEY_GEMINI, key);
    }
    return key || '';
  }

  function getActiveProvider() { return localStorage.getItem(STORAGE_PROVIDER) || 'gemini'; }

  function hasApiKey() { return !!getApiKey(getActiveProvider()); }

  async function _callGemini(prompt) {
    const key = getApiKey('gemini');
    if (!key) throw new Error('Gemini API anahtarı bulunamadı.');
    const response = await fetch(GEMINI_ENDPOINT(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 350, topP: 0.95 }
      })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err && err.error && err.error.message) || 'HTTP ' + response.status);
    }
    const data = await response.json();
    return ((data.candidates||[])[0]||{content:{parts:[{text:''}]}}).content.parts[0].text.trim();
  }

  async function _callOpenAI(prompt) {
    const key = getApiKey('openai');
    if (!key) throw new Error('OpenAI API anahtarı bulunamadı.');
    const response = await fetch(OPENAI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], max_tokens: 350, temperature: 0.9 })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err && err.error && err.error.message) || 'HTTP ' + response.status);
    }
    const data = await response.json();
    return ((data.choices||[])[0]||{message:{content:''}}).message.content.trim();
  }

  async function _callLLM(prompt) {
    return getActiveProvider() === 'openai' ? _callOpenAI(prompt) : _callGemini(prompt);
  }

  // Maç bitince çağrılır; LLM ile dramatik Türkçe anlatım üretir (yoksa fallback)
  async function generateMatchCommentary(matchData) {
    const d = _buildMatchData(matchData);
    if (hasApiKey()) {
      const keyEvents = (matchData.events || [])
        .filter(e => ['goal', 'red_card', 'injury'].includes(e.type))
        .slice(-6)
        .map(e => '[' + e.minute + "'] " + (e.type==='goal'?'GOL':e.type==='red_card'?'KIRMIZI KART':'SAKLIK') + ': ' + (e.text||'').replace(/<[^>]+>/g,''))
        .join('\n');
      const prompt = 'Sen ChampionMaster futbol yönetim oyununun Türkçe spiker anlatıcısısın.\n' +
        'Aşağıdaki maç verilerine göre kısa (3-4 cümle), dramatik, heyecanlı ve özgün bir TÜRKÇE maç sonu anlatımı yaz.\n' +
        'Emojiler kullan. Tarafsız ve profesyonel bir spiker gibi konuş.\n\n' +
        'MAÇ BİLGİSİ:\n' +
        'Ev Sahibi: ' + d.home + '\n' +
        'Deplasman: ' + d.away + '\n' +
        'Skor: ' + d.score + '\n' +
        'Toplam Şut: ' + d.shots + '\n' +
        'Topla Oynama (Ev): %' + d.possession + '\n' +
        'Toplam Kart: ' + d.cards + '\n' +
        (keyEvents ? '\nÖnemli Olaylar:\n' + keyEvents : '') +
        '\n\nSadece anlatım metnini yaz, başka hiçbir şey ekleme.';
      try {
        const text = await _callLLM(prompt);
        if (text && text.length > 20) return text;
      } catch (err) {
        console.warn('[AISystem] LLM hatası, fallback kullanılıyor:', err.message);
      }
    }
    return _pick(FALLBACK_TEMPLATES)(d);
  }

  // Galibiyet/transfer/yaralanma gibi olaylara Türkçe haber başlığı üretir
  async function generateNewsHeadline(event) {
    const type = event.type || 'default';
    if (hasApiKey()) {
      const prompts = {
        win:      '"' + event.team + '" futbol takımı "' + event.score + '" ile maçı kazandı. Bunu çok kısa (max 12 kelime), heyecanlı, emoji kullanan bir TÜRKÇE haber başlığına dönüştür. Sadece başlığı yaz.',
        loss:     '"' + event.team + '" futbol takımı "' + event.score + '" ile maçı kaybetti. Bunu çok kısa (max 12 kelime), üzücü, emoji kullanan bir TÜRKÇE haber başlığına dönüştür. Sadece başlığı yaz.',
        draw:     '"' + event.team + '" futbol takımı "' + event.score + '" beraberlik aldı. Bunu çok kısa (max 12 kelime), nötr, emoji kullanan bir TÜRKÇE haber başlığına dönüştür. Sadece başlığı yaz.',
        transfer: '"' + event.player + '" isimli oyuncu "' + event.team + '" takımına transfer oldu. Bunu çok kısa (max 12 kelime), heyecanlı, emoji kullanan bir TÜRKÇE haber başlığına dönüştür. Sadece başlığı yaz.',
        injury:   '"' + event.player + '" isimli oyuncu sakatlık nedeniyle "' + event.weeks + '" hafta sahalardan uzak kalacak. Bunu çok kısa (max 12 kelime), endişeli bir Türkçe haber başlığına dönüştür. Sadece başlığı yaz.',
      };
      const prompt = prompts[type] || '"' + (event.team||'Takım') + '" futbol takımından son dakika haberi. Kısa bir Türkçe haber başlığı yaz.';
      try {
        const text = await _callLLM(prompt);
        if (text && text.length > 5) return text.split('\n')[0];
      } catch (err) {
        console.warn('[AISystem] Haber başlığı LLM hatası:', err.message);
      }
    }
    const templates = NEWS_TEMPLATES[type] || NEWS_TEMPLATES.default;
    return _pick(templates(event));
  }

  // Taktik tavsiyesi (LLM üzerinden)
  async function generateTacticalAdvice(myTeamName, mySquadInfo, oppTeamName, oppInfo, currentTactic) {
    if (!hasApiKey()) return 'Yapay zeka asistanını kullanmak için sol menüden API anahtarı eklemelisin.';
    
    const prompt = `Sen ChampionMaster oyununda uzman bir teknik direktör asistanısın.
Kendi takımımız: ${myTeamName}
Rakip takım: ${oppTeamName}
Şu anki taktiğimiz: ${currentTactic}
En iyi oyuncularımız: ${mySquadInfo}
Rakip analizi: ${oppInfo}

Lütfen bize çok kısa (maksimum 3-4 cümle), doğrudan ve akıllıca bir taktik tavsiyesi ver. Karşındaki teknik direktöre (bana) saygılı ve destekleyici konuş. Emojiler kullan. Sadece tavsiyeyi yaz.`;
    
    try {
      const text = await _callLLM(prompt);
      return text;
    } catch (err) {
      return 'Asistan şu an bağlanamıyor: ' + err.message;
    }
  }

  function _injectStyles() {
    if (document.getElementById('ai-system-styles')) return;
    const style = document.createElement('style');
    style.id = 'ai-system-styles';
    style.textContent = `
      #ai-settings-overlay {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.65);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        z-index: 9000; display: flex; align-items: center; justify-content: center;
        opacity: 0; pointer-events: none; transition: opacity 0.3s ease;
      }
      #ai-settings-overlay.visible { opacity: 1; pointer-events: all; }
      #ai-settings-panel {
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.15); border-radius: 20px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.1);
        backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        padding: 36px; width: min(480px,92vw); position: relative;
        animation: aiSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1);
      }
      @keyframes aiSlideIn { from{transform:translateY(30px) scale(0.96);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
      .ai-panel-header { display:flex; align-items:center; gap:12px; margin-bottom:28px; }
      .ai-panel-icon {
        width:48px; height:48px; background:linear-gradient(135deg,#7c3aed,#a78bfa);
        border-radius:14px; display:flex; align-items:center; justify-content:center;
        font-size:24px; box-shadow:0 4px 15px rgba(124,58,237,0.4);
        flex-shrink: 0;
      }
      .ai-panel-title { font-family:'Rajdhani',sans-serif; font-size:22px; font-weight:700; color:#fff; margin:0; }
      .ai-panel-subtitle { font-size:12px; color:rgba(255,255,255,0.5); margin:2px 0 0; }
      .ai-close-btn {
        position:absolute; top:16px; right:16px;
        background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12);
        color:rgba(255,255,255,0.6); border-radius:8px; width:32px; height:32px;
        cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center;
        transition:all 0.2s;
      }
      .ai-close-btn:hover { background:rgba(255,255,255,0.15); color:#fff; }
      .ai-provider-tabs { display:flex; gap:8px; margin-bottom:20px; }
      .ai-provider-tab {
        flex:1; padding:10px; border-radius:10px;
        border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.05);
        color:rgba(255,255,255,0.5); cursor:pointer; text-align:center;
        font-size:13px; font-weight:600; transition:all 0.2s; user-select:none;
      }
      .ai-provider-tab.active {
        background:linear-gradient(135deg,rgba(124,58,237,0.4),rgba(167,139,250,0.2));
        border-color:rgba(167,139,250,0.5); color:#a78bfa;
      }
      .ai-provider-tab:hover:not(.active) { background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.7); }
      .ai-status-badge {
        display:inline-flex; align-items:center; gap:6px;
        padding:5px 12px; border-radius:20px; font-size:12px; font-weight:600; margin-bottom:16px;
      }
      .ai-status-badge.active { background:rgba(34,197,94,0.15); border:1px solid rgba(34,197,94,0.3); color:#4ade80; }
      .ai-status-badge.inactive { background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.25); color:#f87171; }
      .ai-status-dot { width:7px; height:7px; border-radius:50%; background:currentColor; animation:aiPulse 2s infinite; }
      @keyframes aiPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      .ai-key-group { margin-bottom:20px; }
      .ai-key-label { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:rgba(255,255,255,0.5); margin-bottom:8px; display:block; }
      .ai-key-input-wrap { position:relative; }
      .ai-key-input {
        width:100%; padding:12px 44px 12px 16px;
        background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.15);
        border-radius:10px; color:#fff; font-size:13px; font-family:'Courier New',monospace;
        outline:none; box-sizing:border-box; transition:border-color 0.2s,box-shadow 0.2s;
      }
      .ai-key-input:focus { border-color:rgba(167,139,250,0.6); box-shadow:0 0 0 3px rgba(124,58,237,0.15); }
      .ai-key-input::placeholder { color:rgba(255,255,255,0.25); }
      .ai-key-toggle {
        position:absolute; right:12px; top:50%; transform:translateY(-50%);
        background:none; border:none; color:rgba(255,255,255,0.4); cursor:pointer; font-size:16px; padding:0;
      }
      .ai-key-toggle:hover { color:rgba(255,255,255,0.8); }
      .ai-btn-row { display:flex; gap:10px; margin-top:8px; }
      .ai-save-btn {
        flex:1; padding:12px; border-radius:10px; border:none;
        background:linear-gradient(135deg,#7c3aed,#a78bfa); color:#fff;
        font-size:14px; font-weight:700; cursor:pointer; transition:opacity 0.2s,transform 0.15s;
        box-shadow:0 4px 15px rgba(124,58,237,0.35);
      }
      .ai-save-btn:hover { opacity:0.9; transform:translateY(-1px); }
      .ai-save-btn:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
      .ai-clear-btn {
        padding:12px 18px; border-radius:10px;
        border:1px solid rgba(239,68,68,0.3); background:rgba(239,68,68,0.1);
        color:#f87171; font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s;
      }
      .ai-clear-btn:hover { background:rgba(239,68,68,0.2); }
      .ai-test-result {
        margin-top:16px; padding:12px 16px; border-radius:10px; font-size:13px;
        line-height:1.6; display:none; background:rgba(255,255,255,0.05);
        border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.8);
      }
      .ai-test-result.show { display:block; }
      .ai-spinner {
        display:inline-block; width:13px; height:13px;
        border:2px solid rgba(255,255,255,0.3); border-top-color:#fff;
        border-radius:50%; animation:aiSpin 0.7s linear infinite; vertical-align:middle; margin-right:6px;
      }
      @keyframes aiSpin { to{transform:rotate(360deg)} }
      .ai-commentary-box {
        margin-top:20px; padding:20px 22px;
        background:linear-gradient(135deg,rgba(124,58,237,0.1),rgba(167,139,250,0.05));
        border:1px solid rgba(167,139,250,0.25); border-radius:14px;
        font-size:14px; line-height:1.75; color:rgba(255,255,255,0.85); position:relative;
      }
      .ai-commentary-label {
        position:absolute; top:-10px; left:16px;
        background:linear-gradient(135deg,#7c3aed,#a78bfa); color:#fff;
        font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase;
        padding:2px 10px; border-radius:20px;
      }
      .ai-commentary-text { margin-top:6px; }
      .nav-item.ai-nav-btn { border-top:1px solid rgba(255,255,255,0.06); margin-top:4px; padding-top:12px; }
      .nav-item[data-page="ai-settings"] .nav-icon { color:#a78bfa; }
    `;
    document.head.appendChild(style);
  }

  function _buildPanel() {
    var existing = document.getElementById('ai-settings-overlay');
    if (existing) existing.remove();
    const provider = getActiveProvider();
    const geminiKey = getApiKey('gemini');
    const openaiKey = getApiKey('openai');
    const isActive = hasApiKey();
    const overlay = document.createElement('div');
    overlay.id = 'ai-settings-overlay';
    overlay.innerHTML = '<div id="ai-settings-panel">' +
      '<button class="ai-close-btn" id="ai-close-btn">&#x2715;</button>' +
      '<div class="ai-panel-header">' +
        '<div class="ai-panel-icon">&#x1F916;</div>' +
        '<div><div class="ai-panel-title">Yapay Zeka Motoru</div>' +
        '<div class="ai-panel-subtitle">BYOK &mdash; Kendi API anahtarını getir</div></div>' +
      '</div>' +
      '<div id="ai-status-badge" class="ai-status-badge ' + (isActive?'active':'inactive') + '">' +
        '<span class="ai-status-dot"></span>' + (isActive ? '🟢 Yapay Zeka Aktif' : '🔴 API Anahtarı Yok') +
      '</div>' +
      '<div class="ai-provider-tabs">' +
        '<div class="ai-provider-tab ' + (provider==='gemini'?'active':'') + '" data-provider="gemini">✨ Google Gemini</div>' +
        '<div class="ai-provider-tab ' + (provider==='openai'?'active':'') + '" data-provider="openai">🧠 OpenAI</div>' +
      '</div>' +
      '<div class="ai-key-group" id="gemini-group" style="' + (provider!=='gemini'?'display:none':'') + '">' +
        '<label class="ai-key-label">Gemini API Anahtarı</label>' +
        '<div class="ai-key-input-wrap">' +
          '<input type="password" id="ai-gemini-input" class="ai-key-input" placeholder="AIzaSy... anahtarını buraya yapıştır" value="">' +
          '<button class="ai-key-toggle" id="gemini-toggle">&#x1F441;</button>' +
        '</div>' +
      '</div>' +
      '<div class="ai-key-group" id="openai-group" style="' + (provider!=='openai'?'display:none':'') + '">' +
        '<label class="ai-key-label">OpenAI API Anahtarı</label>' +
        '<div class="ai-key-input-wrap">' +
          '<input type="password" id="ai-openai-input" class="ai-key-input" placeholder="sk-... anahtarını buraya yapıştır" value="">' +
          '<button class="ai-key-toggle" id="openai-toggle">&#x1F441;</button>' +
        '</div>' +
      '</div>' +
      '<div class="ai-btn-row">' +
        '<button class="ai-save-btn" id="ai-save-btn">💾 Kaydet ve Etkinleştir</button>' +
        '<button class="ai-clear-btn" id="ai-clear-btn">🗑 Sil</button>' +
      '</div>' +
      '<div id="ai-test-result" class="ai-test-result"></div>' +
      '<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.07)">' +
        '<div style="font-size:11px;color:rgba(255,255,255,0.35);line-height:1.6">' +
          '🔒 API anahtarın yalnızca tarayıcının localStorage\'ında saklanır. Hiçbir sunucuya gönderilmez.' +
        '</div>' +
      '</div>' +
    '</div>';
    document.body.appendChild(overlay);

    var _cp = provider;
    var tabs = overlay.querySelectorAll('.ai-provider-tab');
    for (var i = 0; i < tabs.length; i++) {
      (function(tab) {
        tab.addEventListener('click', function() {
          _cp = tab.getAttribute('data-provider');
          for (var j = 0; j < tabs.length; j++) tabs[j].classList.remove('active');
          tab.classList.add('active');
          document.getElementById('gemini-group').style.display = _cp === 'gemini' ? '' : 'none';
          document.getElementById('openai-group').style.display = _cp === 'openai' ? '' : 'none';
        });
      })(tabs[i]);
    }

    document.getElementById('gemini-toggle').addEventListener('click', function() {
      var inp = document.getElementById('ai-gemini-input');
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });
    document.getElementById('openai-toggle').addEventListener('click', function() {
      var inp = document.getElementById('ai-openai-input');
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });

    document.getElementById('ai-save-btn').addEventListener('click', async function() {
      var inputId = _cp === 'gemini' ? 'ai-gemini-input' : 'ai-openai-input';
      var rawValue = document.getElementById(inputId).value.trim();
      if (!rawValue) { _showTestResult('⚠️ Lütfen geçerli bir API anahtarı girin.', false); return; }
      setApiKey(_cp, rawValue);
      var btn = document.getElementById('ai-save-btn');
      btn.innerHTML = '<span class="ai-spinner"></span> Test ediliyor...';
      btn.disabled = true;
      try {
        var testText = await _callLLM('Merhaba! Sadece "Bağlantı başarılı" yaz.');
        _showTestResult('✅ Bağlantı başarılı! "' + testText.slice(0,60) + '"', true);
        _updateStatusBadge(true);
      } catch (err) {
        _showTestResult('❌ Hata: ' + err.message, false);
        _updateStatusBadge(false);
      } finally {
        btn.innerHTML = '💾 Kaydet ve Etkinleştir';
        btn.disabled = false;
      }
    });

    document.getElementById('ai-clear-btn').addEventListener('click', function() {
      localStorage.removeItem(STORAGE_KEY_GEMINI);
      localStorage.removeItem(STORAGE_KEY_OPENAI);
      document.getElementById('ai-gemini-input').value = '';
      document.getElementById('ai-openai-input').value = '';
      _showTestResult('🗑️ API anahtarı silindi. Fallback template\'ler kullanılacak.', false);
      _updateStatusBadge(false);
    });

    document.getElementById('ai-close-btn').addEventListener('click', closePanel);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closePanel(); });
  }

  function _showTestResult(msg, success) {
    var el = document.getElementById('ai-test-result');
    if (!el) return;
    el.textContent = msg;
    el.style.borderColor = success ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.25)';
    el.style.color = success ? '#4ade80' : '#f87171';
    el.classList.add('show');
  }

  function _updateStatusBadge(active) {
    var el = document.getElementById('ai-status-badge');
    if (!el) return;
    el.className = 'ai-status-badge ' + (active ? 'active' : 'inactive');
    el.innerHTML = '<span class="ai-status-dot"></span>' + (active ? '🟢 Yapay Zeka Aktif' : '🔴 API Anahtarı Yok');
  }

  function openPanel() {
    _buildPanel();
    requestAnimationFrame(function() {
      var overlay = document.getElementById('ai-settings-overlay');
      if (overlay) overlay.classList.add('visible');
    });
  }

  function closePanel() {
    var overlay = document.getElementById('ai-settings-overlay');
    if (overlay) overlay.classList.remove('visible');
  }

  function injectCommentaryToResultScreen(text) {
    if (!text) return;
    var box = document.getElementById('ai-commentary-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'ai-commentary-box';
      box.className = 'ai-commentary-box';
      box.innerHTML = '<span class="ai-commentary-label">🤖 AI Spiker</span><div class="ai-commentary-text" id="ai-commentary-text"></div>';
      var resultEvents = document.getElementById('result-events-list');
      if (resultEvents && resultEvents.parentNode) {
        resultEvents.parentNode.insertBefore(box, resultEvents.nextSibling);
      } else {
        var card = document.querySelector('.result-card');
        if (card) card.appendChild(box);
      }
    }
    var textEl = document.getElementById('ai-commentary-text');
    if (textEl) textEl.textContent = text;
  }

  function init() {
    _injectStyles();

    // Sidebar'a 🤖 nav butonu ekle
    var sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav && !document.querySelector('.nav-item[data-page="ai-settings"]')) {
      var aiNavItem = document.createElement('div');
      aiNavItem.className = 'nav-item ai-nav-btn';
      aiNavItem.setAttribute('data-page', 'ai-settings');
      aiNavItem.innerHTML = '<span class="nav-icon">🤖</span><span>Yapay Zeka</span>';
      if (hasApiKey()) {
        var dot = document.createElement('span');
        dot.style.cssText = 'width:7px;height:7px;border-radius:50%;background:#4ade80;margin-left:auto;flex-shrink:0;animation:aiPulse 2s infinite;';
        aiNavItem.appendChild(dot);
      }
      aiNavItem.addEventListener('click', openPanel);
      sidebarNav.appendChild(aiNavItem);
    }

    console.log('[AISystem] Başlatıldı. API anahtarı:', hasApiKey() ? 'Mevcut ✓' : 'Yok (fallback aktif)');
  }

  return {
    init,
    generateMatchCommentary,
    generateNewsHeadline,
    generateTacticalAdvice,
    injectCommentaryToResultScreen,
    setApiKey,
    getApiKey,
    getActiveProvider,
    hasApiKey,
    openPanel,
    closePanel,
  };
})();