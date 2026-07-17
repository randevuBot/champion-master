export const InteractiveEvents = [
  {
    id: "scandal_nightclub",
    subject: "🚨 Gece Kulübü Baskını",
    sender: "Asistan Menajer",
    body: "Hocam, yıldız oyuncumuz dün gece 03:00'te bir kulüpten çıkarken magazincilere yakalandı. Sabah kritik bir antrenmanımız var. Basın henüz olayı patlatmadı ama fotoğrafları sızdırmakla tehdit ediyorlar. Ne yapalım?",
    type: "decision",
    actions: [
      { label: "Örtbas Et (-50K €)", value: "bribe", effect: { money: -50000, reputation: -5, morale: 5, aiPrompt: "Menajer oyuncusunu korumak için basına rüşvet verdi ve haberi gizledi, ancak bazı gazeteciler durumu fark edip dedikodu yaymaya başladı." } },
      { label: "Kadro Dışı Bırak", value: "drop", effect: { money: 0, reputation: 10, morale: -10, aiPrompt: "Menajer yıldız oyuncusunu affetmedi ve anında kadro dışı bıraktı. Disiplin sağlandı ama takımın en iyi oyuncusu yok." } },
      { label: "Görmezden Gel", value: "ignore", effect: { money: 0, reputation: -10, morale: -5, aiPrompt: "Menajer olaya tepkisiz kaldı, oyuncu şımardı ve takım otoritesi sarsıldı." } }
    ]
  },
  {
    id: "rival_spy",
    subject: "🕵️ Gizli Anlaşma Teklifi",
    sender: "Bilinmeyen Numara",
    body: "Selam hoca. Hafta sonu oynayacağınız rakibinizin asistanıyım. Bana taktiğinizi ve ilk 11'inizi maçtan 1 gün önce sızdırırsan sana şahsi hesabına elden 100.000 Euro ateşlerim. Ne dersin?",
    type: "decision",
    actions: [
      { label: "Yanlış Taktik Ver", value: "fake", effect: { money: 0, reputation: 5, morale: 5, aiPrompt: "Menajer rakip takıma yanlış taktik sızdırarak onları kendi kazdıkları kuyuya düşürdü!" } },
      { label: "Sertçe Reddet", value: "reject", effect: { money: 0, reputation: 15, morale: 10, aiPrompt: "Menajer ahlaksız teklifi küfür ederek reddetti. Takım hocasının bu dürüstlüğünü duyunca kenetlendi." } },
      { label: "Kabul Et (+100K €)", value: "accept", effect: { money: 100000, reputation: -25, morale: -20, aiPrompt: "BÜYÜK SKANDAL! Menajer maçı satmak için rakiple anlaştı. Kulüp karıştı, taraftar ayaklandı!" } }
    ]
  },
  {
    id: "board_nepotism",
    subject: "👔 Özel Bir İstek",
    sender: "Kulüp Başkanı",
    body: "Hocam merhaba. Biliyorsun yeğenim PAF takımda forma giyiyor. Bu haftaki maçta onu sonradan da olsa oyuna almanı istiyorum. Arkadaşlarımın yanında havam olsun. Eğer bunu yaparsan sana ekstra 500.000 Euro transfer bütçesi çıkaracağım.",
    type: "decision",
    actions: [
      { label: "Kabul Et (+500K €)", value: "accept", effect: { money: 500000, reputation: -10, morale: -15, aiPrompt: "Menajer başkanın torpilli yeğenini oynattı. Bütçe arttı ancak soyunma odasında liyakat tartışmaları çıktı." } },
      { label: "Rest Çek", value: "reject", effect: { money: 0, reputation: 10, morale: 10, aiPrompt: "Menajer başkana rest çekerek 'Benim sahama kimse karışamaz' dedi. Yönetimle arası açıldı ama taraftar hocasına tapıyor." } }
    ]
  },
  {
    id: "sponsor_commercial",
    subject: "🎬 Reklam Çekimi Talebi",
    sender: "Ana Sponsor",
    body: "Sayın Menajer, yeni çıkardığımız erkek şampuanının reklam filmi için en iyi 3 oyuncunuzun yarınki antrenmanı iptal edip 10 saatlik çekime katılmasını talep ediyoruz. Karşılığında kulübe 200.000 Euro ödeme yapacağız.",
    type: "decision",
    actions: [
      { label: "Onayla (+200K €)", value: "accept", effect: { money: 200000, reputation: 0, morale: -5, aiPrompt: "Menajer parayı seçti ve oyuncuları reklam çekimine yolladı. Oyuncular yorgun düştü." } },
      { label: "Antrenman Daha Önemli", value: "reject", effect: { money: 0, reputation: 5, morale: 0, aiPrompt: "Menajer sponsorun teklifini reddetti, takımı antrenmana odakladı. Sponsor sinirlendi ama futbol aklı kazandı." } }
    ]
  }
];

export function getRandomEvent() {
  const randomIndex = Math.floor(Math.random() * InteractiveEvents.length);
  return { ...InteractiveEvents[randomIndex], id: Date.now() + "_" + InteractiveEvents[randomIndex].id };
}
