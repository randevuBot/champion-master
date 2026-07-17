import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = applyRateLimit(ip, 15, 60000);
    
    if (!isAllowed) {
      return NextResponse.json(
        { title: "Medya Sessiz", body: "Gazeteciler şu an çok meşgul.", type: "info" },
        { status: 200 }
      );
    }

    const { clubName, eventPrompt, actionTaken, reputation } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `
    Sen kurgusal bir futbol evreninde (ChampionMaster) keskin dilli, acımasız bir spor muhabirisin.
    Takım: ${clubName}
    Menajerin İtibarı: ${reputation}/100
    Gelişen Olay: ${eventPrompt}
    Menajerin Verdiği Karar (Buton): ${actionTaken}
    
    Görev:
    Menajerin bu kararına göre medyaya yansıyan sonuçları flaş bir haber olarak yaz. 
    Karar şaibeli veya kötüyse menajeri ağır eleştir (skandal vb.). Karar dürüst veya zekiceyse onu öv (taraftar arkasında vb.).
    
    KURALLAR:
    - ÖNEMLİ KURAL: KESİNLİKLE VE SADECE TÜRKÇE YAZACAKSIN. İNGİLİZCE KELİMELER KULLANMA.
    - Mutlaka çok kısa olsun (Maksimum 2-3 cümle).
    - JSON formatında dön! Asla markdown ('json' vb.) kullanma, sadece saf JSON metni dön.
    - Format:
    {
      "title": "Çarpıcı bir manşet",
      "body": "Haberin detayı",
      "type": "error" // veya "success", "info" (olayın iyi/kötü etkisine göre)
    }
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
    console.error("Groq RPG News API Error:", error);
    return NextResponse.json(
      { title: "Medya Sessiz", body: "Menajerin son hamlesi medyada pek yankı uyandırmadı.", type: "info" },
      { status: 200 }
    );
  }
}
