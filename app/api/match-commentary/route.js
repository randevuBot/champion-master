import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (!applyRateLimit(ip, 15, 60000)) {
      return NextResponse.json({ error: "Hız sınırı aşıldı." }, { status: 429 });
    }

    const body = await req.json();
    const { type, homeClub, awayClub, stats, score, events, homeTactics } = body;

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY bulunamadı." }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    if (type === 'prematch') {
      const prompt = `
      Sen efsanevi, heyecanlı ve tarafsız bir futbol spikerisin (Ercan Taner veya Ertem Şener tarzı, ama profesyonel).
      Bugün ${homeClub.name} (Ev Sahibi) ile ${awayClub.name} (Deplasman) arasında bir maç oynanacak.
      Ev sahibi takımın taktiği: ${homeTactics?.style === 'attacking' ? 'Hücumcu' : homeTactics?.style === 'defensive' ? 'Defansif' : 'Dengeli'} ve ${homeTactics?.tempo === 'fast' ? 'Hızlı' : 'Yavaş'} tempoda.
      ÖNEMLİ: KESİNLİKLE VE SADECE TÜRKÇE YAZACAKSIN. İNGİLİZCE VEYA DİĞER HİÇBİR YABANCI DİLİ KULLANMAK KESİNLİKLE YASAKTIR. SADECE TÜRKÇE.
      
      Görevlerin:
      1. Maç başlamadan hemen önce okunacak 2 cümlelik çok heyecanlı bir "preview" (maç önü anonsu) yaz.
      2. Maç içinde gol olduğunda söylenecek 3 adet çok yaratıcı ve abartılı spiker tepkisi yaz (içinde [PLAYER] yazan yerler kodda oyuncu adıyla değişecek, o yüzden tam bu kelimeyi kullan. Örn: "Aman Allahım! [PLAYER] kaleciyi avladı!").
      3. İnanılmaz kurtarışlar için 2 adet spiker tepkisi yaz (içinde [PLAYER] kaleci adı, [SHOOTER] şutu çeken olsun).
      4. İnanılmaz kaçan goller için 2 adet tepki yaz (içinde [PLAYER] şutu kaçıran olsun).

      SADECE VE SADECE aşağıdaki JSON formatında cevap ver. Asla markdown (\`\`\`json) ekleme. Sadece saf JSON metni dön:
      {
        "preview": "Anons metni",
        "goalLines": ["Gol tepkisi 1", "Gol tepkisi 2", "Gol tepkisi 3"],
        "saveLines": ["Kurtarış 1", "Kurtarış 2"],
        "missLines": ["Kaçan gol 1", "Kaçan gol 2"]
      }
      `;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
      return NextResponse.json(result);
    } 
    else if (type === 'postmatch') {
      const prompt = `
      Sen usta bir spor yazarısın. Maç az önce bitti.
      Maç: ${homeClub.name} ${score?.home || 0} - ${score?.away || 0} ${awayClub.name}
      İstatistikler: Topla Oynama: %${stats.possession.home} - %${stats.possession.away}, Şutlar: ${stats.shots.home} - ${stats.shots.away}.
      Önemli Olaylar: ${events.filter(e => e.type === 'goal' || e.type === 'red_card').map(e => e.text).join(" | ")}

      Bana maç hakkında okuması çok keyifli, gazetede manşet olacak tarzda:
      1. Çarpıcı bir manşet (headline)
      2. 3-4 cümlelik destansı bir maç özeti / eleştirisi (report) yaz.
      
      ÖNEMLİ KURAL: YANITIN KESİNLİKLE TÜRKÇE OLMALIDIR. İNGİLİZCE VEYA DİĞER HİÇBİR YABANCI DİLİ KULLANMA. SADECE TÜRKÇE.

      SADECE VE SADECE JSON formatında dön:
      {
        "headline": "Manşet burada",
        "report": "Özet metni burada"
      }
      `;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
      return NextResponse.json(result);
    }
    else if (type === 'prematch_speech') {
      const prompt = `
      Sen tutkulu, hırslı ve biraz da iddialı bir Futbol Kulübü Başkanısın.
      Takımın (${homeClub.name}), az sonra ${awayClub.name} ile çok kritik bir maça çıkacak.
      
      Görevlerin:
      1. Menajere (oyuncuya) yönelik, maçı kazanmanın ne kadar önemli olduğunu anlatan 2-3 cümlelik çok motive edici, derbi atmosferine uygun bir konuşma metni yaz.
      2. Bu maç için takıma dağıtılacak prim miktarını belirle (500000 ile 3000000 arasında, Euro cinsinden bir sayı).

      ÖNEMLİ KURAL: KESİNLİKLE VE SADECE TÜRKÇE YAZACAKSIN. İNGİLİZCE VEYA DİĞER HİÇBİR YABANCI DİLİ KULLANMAK KESİNLİKLE YASAKTIR. SADECE TÜRKÇE.

      SADECE VE SADECE JSON formatında dön:
      {
        "speech": "Konuşma metni",
        "bonusAmount": 1500000
      }
      `;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
      return NextResponse.json(result);
    }
    else if (type === 'postmatch_interview') {
      const prompt = `
      Sen araştırmacı ve zaman zaman kışkırtıcı bir spor gazetecisisin. Maç az önce bitti.
      Sonuç: ${homeClub.name} ${score?.home || 0} - ${score?.away || 0} ${awayClub.name}.
      
      Sen menajere maçın sonucuyla ilgili 1 adet spesifik (sonuca göre tebrik eden veya hesap soran) soru soracaksın. 
      Ayrıca bu soruya menajerin verebileceği 3 adet cevap şıkkı oluşturacaksın:
      - positive: Takımı öven, destekleyici ve iyimser cevap.
      - negative: Agresif, oyuncuları veya hakemi sert eleştiren, sinirli cevap.
      - neutral: Politik, yuvarlak, kaçamak cevap.
      
      ÖNEMLİ KURAL: KESİNLİKLE VE SADECE TÜRKÇE YAZACAKSIN. İNGİLİZCE VEYA DİĞER HİÇBİR YABANCI DİLİ KULLANMAK KESİNLİKLE YASAKTIR. SADECE TÜRKÇE.
      
      SADECE VE SADECE JSON formatında dön:
      {
        "question": "Gazetecinin sorduğu 1-2 cümlelik soru",
        "options": [
          { "text": "Pozitif cevap", "type": "positive" },
          { "text": "Negatif cevap", "type": "negative" },
          { "text": "Nötr cevap", "type": "neutral" }
        ]
      }
      `;

      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.8,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0]?.message?.content || "{}");
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  } catch (error) {
    console.error("Match Commentary Error:", error);
    return NextResponse.json({ error: "API Hatası" }, { status: 500 });
  }
}
