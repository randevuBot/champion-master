import Groq from "groq-sdk";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";

export async function POST(req) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const isAllowed = applyRateLimit(ip, 5, 60000); // 5 istek / 1 dakika
    
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Çok fazla taktik analizi istediniz. Lütfen 1 dakika bekleyin." },
        { status: 429 }
      );
    }

    const { players, teamStrength } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY bulunamadı. Lütfen .env.local dosyanızı kontrol edin." },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `
    Sen efsanevi, tecrübeli ve biraz da huysuz bir teknik direktörsün. Kullanıcı kendi taktiğini oyuncuları sahada serbestçe sürükleyerek oluşturdu.
    
    Takımın Genel Gücü: ${teamStrength}/100
    
    Sahadaki Oyuncuların Koordinatları (Y=0 en ilerisi/hücum, Y=100 en gerisi/kaleci):
    ${players.map(p => `- ${p.name} (${p.naturalPos}): X=${Math.round(p.x)}%, Y=${Math.round(p.y)}%`).join("\n")}
    
    Görevlerin:
    1. Bu formasyonu ve oyuncuların dizilişini yorumla. (Örn: "Sağ kanadı tamamen boş bırakıp sol tarafa yığılmış asimetrik bir 3-1-6 oynamaya çalışıyorsun...")
    2. Takımın güçlü ve zayıf yanlarını söyle.
    3. Taktiksel bir tavsiye ver.
    
    Lütfen futbol jargonu kullanarak (türkçe) kısa, sert ama eğlenceli ve eleştirel/övgü dolu bir yorum yaz.
    Maksimum 3-4 paragraf olsun. Oyuncuların isimlerini doğrudan kullan.
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      max_tokens: 1024,
    });

    const text = chatCompletion.choices[0]?.message?.content || "";

    return NextResponse.json({ analysis: text });
  } catch (error) {
    console.error("Groq API Error:", error);
    const errorMsg = error.message || "Taktik analizi oluşturulurken bir hata oluştu.";
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
