import Groq from "groq-sdk";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { playerFullName, playerValue, bidderClubName } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "API Key missing" }, { status: 500 });
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Teklif miktarını arka planda matematiksel olarak belirleyelim
    // Böylece yapay zeka saçma (1 Milyar Euro vb) rakamlar üretmez
    const baseValue = playerValue * 1000000;
    const offerAmount = Math.floor(baseValue * (0.9 + Math.random() * 0.6));
    
    // Rakamı güzel gösterelim
    const formatMoney = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
    const offerString = formatMoney(offerAmount);

    const prompt = `
    Sen efsanevi bir futbol menajerlik oyunu motorusun.
    Birazdan menajerin takımındaki bir yıldıza başka bir kulüpten transfer teklifi gelecek.
    Bunu sıradan bir "Teklif geldi" mesajı yerine, arkasında bir hikaye olan, çok çarpıcı ve gerçekçi bir e-postaya dönüştürmelisin.
    
    Oyuncu: ${playerFullName}
    İsteyen Kulüp: ${bidderClubName}
    Teklif Edilen Net Para: ${offerString}
    
    KURALLAR:
    - ÖNEMLİ: KESİNLİKLE VE SADECE TÜRKÇE YAZACAKSIN. İNGİLİZCE KELİMELER KULLANMA.
    - Olayın arkasına bir hikaye uydur (Örn: "Forvetleri sakatlandı acil arıyorlar", "Arap şeyhleri takımı satın aldı parayı saçıyorlar", "Teknik direktörleri bu oyuncuya aşık" vb.)
    - LÜTFEN SADECE AŞAĞIDAKİ JSON FORMATINDA YANIT VER (Asla markdown veya fazladan açıklama kullanma, doğrudan JSON objesi dön):
    {
      "subject": "Teklifin Başlığı (Uygun emoji ekle)",
      "sender": "${bidderClubName} Sportif Direktörü",
      "body": "Teklifin arkasındaki hikaye ve cazip anlatım. Metin içinde '${offerString}' miktarını mutlaka belirt.",
      "type": "decision",
      "actions": [
        {
          "label": "Kabul Et (${offerString})",
          "value": "accept_transfer",
          "systemAction": { "type": "SELL_PLAYER", "playerId": "BURASI_KODDA_DEGISECEK", "amount": ${offerAmount} },
          "effect": {
            "money": 0, 
            "reputation": -2, 
            "morale": -5,
            "aiPrompt": "Menajer takımın yıldızı ${playerFullName}'i ${offerString} bedelle ${bidderClubName} kulübüne sattı. Taraftar üzgün ama kasaya dev bir para girdi."
          }
        },
        {
          "label": "Kapıyı Göster (Reddet)",
          "value": "reject_transfer",
          "effect": {
            "money": 0, 
            "reputation": 5, 
            "morale": 5,
            "aiPrompt": "Menajer, ${bidderClubName} kulübünün ${playerFullName} için yaptığı devasa teklifi elinin tersiyle itti! 'Oyuncum satılık değil' dedi."
          }
        }
      ]
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
    console.error("Groq CPU Transfer API Error:", error);
    return NextResponse.json({ error: "Failed to generate transfer offer" }, { status: 500 });
  }
}
