import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { playerName, overall, role } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `
    Sen efsanevi bir futbol menajerlik oyunusun.
    Takımın en önemli yıldızlarından biri olan "${playerName}" (Reyting: ${overall}/99), sürekli yedek bırakıldığı için menajere (kullanıcıya) isyan eden çok öfkeli bir WhatsApp/E-posta mesajı atıyor.
    
    Görev: Oyuncunun ağzından, yedek kalmaktan bıktığını ve takım uyumunu bozacağını belirten, transfer listesine konmayı talep edebilecek dramatik bir mesaj yaz.
    
    KURALLAR:
    - ÖNEMLİ: KESİNLİKLE VE SADECE TÜRKÇE YAZACAKSIN. İNGİLİZCE VEYA DİĞER HİÇBİR YABANCI DİLİ KULLANMAK KESİNLİKLE YASAKTIR. SADECE TÜRKÇE.
    - Metin çok uzun olmasın (max 3 cümle).
    - LÜTFEN SADECE AŞAĞIDAKİ JSON FORMATINDA YANIT VER:
    {
      "subject": "⚠️ OYUNCU İSYANI: ${playerName}",
      "sender": "${playerName}",
      "body": "Mesaj metni...",
      "type": "warning"
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
    console.error("Groq Rebellion API Error:", error);
    return NextResponse.json({ error: "Failed to generate rebellion" }, { status: 500 });
  }
}
