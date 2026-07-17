import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { playerName, age, oldRating, newRating, type } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    let prompt = "";
    
    if (type === "progression") {
      prompt = `
      Sen efsanevi bir futbol menajerlik oyunu motorusun. Menajere (oyuncuya) takımın antrenörlerinden biri tarafından gönderilen bir "Aylık Gelişim Raporu" yaz.
      Oyuncu: ${playerName}
      Yaş: ${age}
      Gelişim: Reytingi ${oldRating}'den ${newRating}'e YÜKSELDİ!
      
      KURALLAR:
      - KESİNLİKLE VE SADECE TÜRKÇE YAZ.
      - Antrenör diliyle yaz. Oyuncunun idmanlardaki hırsından, genç yaşına rağmen gösterdiği olgunluktan vb. bahset.
      - LÜTFEN SADECE AŞAĞIDAKİ JSON FORMATINDA YANIT VER (Başka metin ekleme):
      {
        "subject": "📈 Gelişim Raporu: ${playerName}",
        "sender": "Baş Antrenör",
        "body": "Raporun metni...",
        "type": "success"
      }
      `;
    } else if (type === "regression") {
      prompt = `
      Sen efsanevi bir futbol menajerlik oyunu motorusun. Menajere (oyuncuya) takımın kondisyoneri tarafından gönderilen bir "Fiziksel Düşüş Raporu" yaz.
      Oyuncu: ${playerName}
      Yaş: ${age} (Artık yaşlanıyor)
      Düşüş: Reytingi ${oldRating}'den ${newRating}'e DÜŞTÜ.
      
      KURALLAR:
      - KESİNLİKLE VE SADECE TÜRKÇE YAZ.
      - Kondisyoner diliyle yaz. Oyuncunun artık eskisi gibi hızlı koşamadığından, yaşının getirdiği zorluklardan vb. bahset ama oyuncuya da saygısızlık etme (efsane vs de).
      - LÜTFEN SADECE AŞAĞIDAKİ JSON FORMATINDA YANIT VER:
      {
        "subject": "📉 Fiziksel Düşüş: ${playerName}",
        "sender": "Kondisyoner",
        "body": "Raporun metni...",
        "type": "warning"
      }
      `;
    } else if (type === "retirement") {
        prompt = `
        Sen efsanevi bir futbol oyunu motorusun.
        Oyuncu: ${playerName}
        Yaş: ${age}
        
        Oyuncu yaşından dolayı profesyonel futbolu bırakma (emeklilik) kararı aldı.
        Menajere gönderilen veda mektubunu yaz.
        
        KURALLAR:
        - KESİNLİKLE VE SADECE TÜRKÇE YAZ.
        - Oyuncunun ağzından duygusal bir veda mektubu olsun.
        - LÜTFEN SADECE AŞAĞIDAKİ JSON FORMATINDA YANIT VER:
        {
          "subject": "👋 Veda Vakti: ${playerName}",
          "sender": "${playerName}",
          "body": "Veda metni...",
          "type": "info"
        }
        `;
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      response_format: { type: "json_object" }
    });

    const text = chatCompletion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Groq Player Report API Error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
