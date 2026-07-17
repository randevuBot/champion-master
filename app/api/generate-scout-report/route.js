import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { playerName, age, position, overall, potential, value } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `
    Sen efsanevi bir futbol menajerlik oyunu motorusun.
    Menajer takımın "Şef Gözlemcisine (Scout)" bir oyuncuyu izlemesi için talimat verdi.
    
    Oyuncu Bilgileri:
    İsim: ${playerName}
    Yaş: ${age}
    Mevki: ${position}
    Derece (Overall): ${overall}/99
    Potansiyel: ${potential}/99
    
    Görev: Şef Gözlemcinin ağzından yazılmış sürükleyici ve detaylı bir Gözlemci Raporu e-postası hazırla.
    
    KURALLAR:
    - ÖNEMLİ: KESİNLİKLE VE SADECE TÜRKÇE YAZACAKSIN. İNGİLİZCE KULLANMAK YASAKTIR.
    - Oyuncunun güçlü ve zayıf yanlarını reytinglerine (${overall} ve ${potential}) dayanarak gerçekçi bir şekilde analiz et.
    - Karakterine dair ufak bir dedikodu veya detay ekle (Örn: "Çok profesyonel", "Gece hayatına düşkün", "Soyunma odasında lider" vb.).
    - LÜTFEN SADECE AŞAĞIDAKİ JSON FORMATINDA YANIT VER (Asla markdown veya fazladan açıklama kullanma, doğrudan JSON objesi dön):
    {
      "subject": "🕵️‍♂️ Gözlem Raporu: ${playerName}",
      "sender": "Şef Gözlemci",
      "body": "Raporun metni (Karakter, teknik analiz, alınmalı mı alınmamalı mı tavsiyesi içerir)...",
      "type": "info"
    }
    `;

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
    console.error("Groq Scout Report API Error:", error);
    return NextResponse.json({ error: "Failed to generate scout report" }, { status: 500 });
  }
}
