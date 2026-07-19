import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { clubName, week, players } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Rastgele bir oyuncu ismi seçelim ki olaylar daha gerçekçi olsun (zorunlu değil ama güzel olur)
    let randomPlayerName = "";
    if (players && players.length > 0) {
        const randomPlayer = players[Math.floor(Math.random() * players.length)];
        randomPlayerName = `${randomPlayer.firstName} ${randomPlayer.lastName}`;
    }

    const prompt = `
    Sen yaratıcı bir futbol simülasyonu oyun motorusun (Football Manager x RPG tarzı).
    Bana tamamen rastgele, futbol dünyasında menajerin karşısına çıkabilecek zorlu bir karar (RPG senaryosu) üret.
    Olaylar şunlardan biri veya tamamen senin hayal gücün olabilir: Oyuncu kaprisi, magazin skandalı, taraftar baskısı, şike teklifi, tuhaf sponsor istekleri, tesis yangını, mafya müdahalesi vb.
    Her seferinde ÇOK FARKLI, sıra dışı ve sürpriz bir senaryo üret. Sıradan antrenman raporları üretme, dram ve aksiyon olsun!
    
    Takım: ${clubName}
    Hafta: ${week}
    Oyuncu (Gerekirse bu ismi kullan): ${randomPlayerName}

    ÇOK ÖNEMLİ VE KESİN KURAL: CEVABININ TAMAMI, HER BİR KELİMESİ KESİNLİKLE VE SADECE **TÜRKÇE** OLMALIDIR.
    ARAPÇA, İNGİLİZCE VEYA HERHANGİ BİR BAŞKA DİLDE TEK BİR KELİME BİLE YAZMAK KESİNLİKLE YASAKTIR. BÜTÜN JSON DEĞERLERİ %100 TÜRKÇE OLMALIDIR.

    LÜTFEN SADECE AŞAĞIDAKİ JSON FORMATINDA VE KESİNLİKLE TÜRKÇE DİLİNDE YANIT VER (Asla markdown kullanma, doğrudan JSON objesi dön):
    {
      "subject": "Olayın Başlığı (Uygun emoji ekle)",
      "sender": "Maili Gönderen (Örn: Kulüp Başkanı, Gizli Numara, Gazeteci, Avukat vb.)",
      "body": "Olayın sürükleyici açıklaması. Ne oldu ve takımın menajerinden tam olarak ne isteniyor?",
      "type": "decision",
      "actions": [
        {
          "label": "1. Seçenek (Örn: Rüşvet Ver, Örtbas Et vs)",
          "value": "action_1",
          "effect": {
            "money": -50000, 
            "reputation": -5, 
            "morale": 5,
            "aiPrompt": "Eğer menajer bu seçeneği seçerse, bunun medyaya ve takıma yansıması nasıl olur? Kısa açıklama."
          }
        },
        {
          "label": "2. Seçenek (Zıt bir aksiyon)",
          "value": "action_2",
          "effect": {
            "money": 0, 
            "reputation": 10, 
            "morale": -15,
            "aiPrompt": "Eğer menajer bu seçeneği seçerse, sonuç ne olur?"
          }
        }
      ]
    }
    Not: 'actions' dizisinde en az 2, en fazla 3 mantıklı/zorlayıcı seçenek olsun. Etkiler (-/+) dengeli dağılsın.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.9,
      response_format: { type: "json_object" }
    });

    const text = chatCompletion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Groq Generate RPG Event API Error:", error);
    return NextResponse.json({ error: "Failed to generate event" }, { status: 500 });
  }
}
