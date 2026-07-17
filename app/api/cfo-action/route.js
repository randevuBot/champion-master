import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { balance, clubName } = await req.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Groq API Key bulunamadı' }, { status: 500 });
    }

    const systemPrompt = `
Sen profesyonel ama biraz dengesiz bir futbol kulübü Finans Direktörüsün (CFO).
Kulübün adı: ${clubName}. Mevcut Bakiye: ${balance}€.
Senin görevin her hafta kulübün parasıyla bir yatırım yapmak, sponsor bulmak veya bir etkinlik düzenlemek.
Bazen inanılmaz zekice hamleler yapıp milyonlar kazandırırsın, bazen de saçma sapan yerlere (kripto para, iflas eden bankalar, lüks yatlar) yatırım yapıp milyonlar kaybettirirsin.
Sonuç her zaman sürpriz olmalıdır (iyi ya da kötü).

MUTLAKA AŞAĞIDAKİ FORMATTA GEÇERLİ BİR JSON DÖNDÜR:
{
  "title": "Haber Başlığı (Örn: CFO'dan Kripto Vurgunu!)",
  "description": "Yaptığın hamleyi ve sonucunu anlatan 1-2 cümlelik eğlenceli/dramatik açıklama.",
  "netProfit": 500000, // Eğer zarar ettiysen eksi değer yaz (Örn: -250000)
  "isSuccess": true // Kâr varsa true, zarar varsa false
}
Sadece bu JSON'ı döndür, başka hiçbir metin veya markdown ekleme.
`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Haftalık finansal hamleni yap. Sadece JSON döndür.` }
        ],
        temperature: 0.8,
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    if (data.choices && data.choices[0]) {
      const resultString = data.choices[0].message.content;
      try {
        const parsed = JSON.parse(resultString);
        return NextResponse.json(parsed);
      } catch (e) {
        return NextResponse.json({ 
          title: "CFO Kayıplara Karıştı", 
          description: "Finans Direktörü bu hafta bir işlem yapmadan ofisten ayrıldı.", 
          netProfit: 0, 
          isSuccess: true 
        });
      }
    }
    throw new Error('Groq failed');
  } catch (error) {
    console.error("CFO API Error:", error);
    return NextResponse.json({ 
      title: "CFO Hasta", 
      description: "Finans Direktörümüz bu hafta raporlu olduğu için işlem yapılamadı.", 
      netProfit: 0, 
      isSuccess: true 
    });
  }
}
