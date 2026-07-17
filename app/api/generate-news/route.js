import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = applyRateLimit(ip, 15, 60000); // 15 istek / 1 dakika (İleri sarma hızlı olabilir diye biraz daha yüksek)
    
    if (!isAllowed) {
      return NextResponse.json(
        { title: "Sessiz Bir Hafta", body: "Basın mensupları bu hafta çok yoğun. (Hız sınırı aşıldı)", type: "info" },
        { status: 200 } // UI'ı kırmamak için 200 dönüyoruz ama fake haber veriyoruz
      );
    }

    const { clubName, week, players } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Pick 2 random players to create a rumor about
    const randomPlayers = players.sort(() => 0.5 - Math.random()).slice(0, 2);
    const pNames = randomPlayers.map(p => p.lastName).join(" ve ");

    const prompt = `
    Sen kurgusal bir futbol evreninde dedikodu üreten, provokatif bir spor muhabirisin (Fotomaç / Fanatik tarzı).
    Takım: ${clubName}
    Hafta: ${week}
    Oyuncular: ${pNames}
    
    Görev:
    Bu oyuncular(dan biri veya ikisi) hakkında takım içi bir haber, dedikodu, idman kavgası, transfer söylentisi veya eğlenceli bir magazinsel olay uydur.
    
    KURALLAR:
    - ÖNEMLİ: KESİNLİKLE VE SADECE TÜRKÇE YAZACAKSIN. İNGİLİZCE KULLANMAK YASAKTIR.
    - Mutlaka çok kısa olsun (Maksimum 2-3 cümle).
    - JSON formatında dön! Asla markdown ('json' vb.) kullanma, sadece saf JSON metni dön.
    - JSON Objesi şu formatta olmalı:
    {
      "title": "Çarpıcı bir manşet",
      "body": "Haberin detayı",
      "type": "warning" // veya "info", "error", "success"
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
    console.error("Groq News API Error:", error);
    return NextResponse.json(
      { title: "Sessiz Bir Hafta", body: "Medyada takımınızla ilgili kayda değer bir haber yok.", type: "info" },
      { status: 200 }
    );
  }
}
