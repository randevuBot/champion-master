import fs from 'fs';
import path from 'path';

// İsim Havuzları
const firstNames = ["Ahmet", "Mehmet", "Can", "Burak", "Emre", "Hakan", "Yasin", "Oğuzhan", "Kerem", "Arda", "Altay", "Uğurcan", "Ferdi", "Ozan", "Cengiz", "Çağlar", "Mert", "Enes", "Yusuf", "Semih", "Barış", "Kenan", "Kaan", "İrfan", "Salih", "Cenk", "Batuhan", "Efe", "Berkay", "Doruk", "Bora", "Onur", "Volkan", "Serdar", "Gökhan", "Selçuk", "Sabri", "Tuncay", "Nihat", "Emir"];
const lastNames = ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek", "Polat", "Öz", "Can", "Korkmaz", "Erdoğan", "Yavuz", "Turan", "Yalçın", "Güler", "Aksoy", "Köse", "Güneş", "Çoşkun", "Kılıçarslan", "Gündüz", "Bulut", "Kalkan", "Taş", "Tekin", "Gül"];
const foreignFirstNames = ["Alex", "John", "David", "Lucas", "Kevin", "Thomas", "Diego", "Luis", "Carlos", "Pablo", "Marco", "Roberto", "Victor", "Hugo", "Mario", "Ivan", "Igor", "Sergey", "Milan", "Luka", "Mateo", "Enzo", "Tiago", "João", "Pedro", "Felipe", "Arthur", "Gabriel"];
const foreignLastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez"];

const positions = ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST', 'GK', 'CB', 'CM', 'ST', 'LB', 'RB', 'RW', 'LW', 'CDM'];

function getRandomName(isForeign = false) {
  if (isForeign) {
    const f = foreignFirstNames[Math.floor(Math.random() * foreignFirstNames.length)];
    const l = foreignLastNames[Math.floor(Math.random() * foreignLastNames.length)];
    return { first: f, last: l };
  } else {
    const f = firstNames[Math.floor(Math.random() * firstNames.length)];
    const l = lastNames[Math.floor(Math.random() * lastNames.length)];
    return { first: f, last: l };
  }
}

// Lig Tanımları
const leagues = [
  { id: 'superlig', name: 'Süper Lig', country: 'Türkiye', level: 1, prestigeBase: 80 },
  { id: 'lig1', name: '1. Lig', country: 'Türkiye', level: 2, prestigeBase: 65 },
  { id: 'lig2', name: '2. Lig', country: 'Türkiye', level: 3, prestigeBase: 50 },
  { id: 'amator', name: 'Amatör Lig', country: 'Türkiye', level: 4, prestigeBase: 35 }
];

// Takım İsimleri Havuzu
const cities = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Konya", "Gaziantep", "Şanlıurfa", "Kocaeli", "Mersin", "Diyarbakır", "Hatay", "Kayseri", "Samsun", "Balıkesir", "Kahramanmaraş", "Van", "Aydın", "Tekirdağ", "Denizli", "Sakarya", "Muğla", "Eskişehir", "Mardin", "Trabzon", "Malatya", "Erzurum", "Ordu", "Afyon", "Sivas", "Batman", "Tokat", "Zonguldak", "Kütahya", "Osmaniye", "Çanakkale", "Şırnak", "Giresun", "Isparta"];
const suffixes = ["Spor", "İdman Yurdu", "Belediyespor", "Gücü", "Gençlik", "FK", "Demirspor", "Birlik"];

const colors = ["#e63946", "#1d3557", "#457b9d", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51", "#000000", "#ffffff", "#8d99ae", "#ef233c", "#d90429", "#8338ec", "#3a86ff"];

const clubs = [];
let clubIdCounter = 1;

leagues.forEach(league => {
  for (let i = 0; i < 10; i++) { // Her ligde 10 takım
    const city = cities.pop() || "Bilinmeyen Şehir";
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const name = `${city} ${suffix}`;
    
    // Süper lig takımları için daha zengin bütçe
    let budget = 0;
    if (league.level === 1) budget = 50 + Math.floor(Math.random() * 50); // 50-100M
    else if (league.level === 2) budget = 10 + Math.floor(Math.random() * 20); // 10-30M
    else if (league.level === 3) budget = 2 + Math.floor(Math.random() * 5); // 2-7M
    else budget = Math.floor(Math.random() * 2); // 0-1M

    clubs.push({
      id: clubIdCounter.toString(),
      name,
      shortName: city.substring(0, 3).toUpperCase(),
      leagueId: league.id,
      city,
      stadium: `${city} Atatürk Stadyumu`,
      capacity: Math.floor(league.prestigeBase * 500) + Math.floor(Math.random() * 5000),
      prestige: Math.floor(league.prestigeBase / 10),
      budget,
      founded: 1900 + Math.floor(Math.random() * 100),
      logo: null,
      colors: {
        primary: colors[Math.floor(Math.random() * colors.length)],
        secondary: colors[Math.floor(Math.random() * colors.length)]
      }
    });
    clubIdCounter++;
  }
});

const players = [];
let playerIdCounter = 1;

clubs.forEach(club => {
  const league = leagues.find(l => l.id === club.leagueId);
  const baseOverall = league.prestigeBase; // 80, 65, 50, 35
  
  positions.forEach(pos => {
    // Rastgele overall
    const overall = baseOverall - 5 + Math.floor(Math.random() * 15); // Örn: 80 için 75-90 arası
    
    // Genç mi yaşlı mı?
    const age = 17 + Math.floor(Math.random() * 18); // 17-34 arası
    const potential = age < 24 ? overall + Math.floor(Math.random() * 15) : overall;
    
    // Süper ligde yabancı oyuncu şansı yüksek
    const isForeign = league.level === 1 ? Math.random() > 0.4 : (league.level === 2 ? Math.random() > 0.7 : Math.random() > 0.95);
    const nameObj = getRandomName(isForeign);
    
    players.push({
      id: `p_${playerIdCounter}`,
      firstName: nameObj.first,
      lastName: nameObj.last,
      age,
      nationality: isForeign ? "Yabancı" : "Türkiye",
      clubId: club.id,
      position: pos,
      overall: Math.min(99, overall),
      pac: Math.min(99, overall - 10 + Math.floor(Math.random() * 20)),
      sho: Math.min(99, overall - 10 + Math.floor(Math.random() * 20)),
      pas: Math.min(99, overall - 10 + Math.floor(Math.random() * 20)),
      dri: Math.min(99, overall - 10 + Math.floor(Math.random() * 20)),
      def: Math.min(99, pos === 'CB' || pos === 'CDM' ? overall + 5 : overall - 20),
      phy: Math.min(99, overall - 10 + Math.floor(Math.random() * 20)),
      value: Math.floor((Math.pow(overall / 10, 3)) / 10), // Basit değer hesabı
      wage: Math.floor(overall / 10),
      contractEnd: 2026 + Math.floor(Math.random() * 4),
      height: 170 + Math.floor(Math.random() * 25),
      weight: 65 + Math.floor(Math.random() * 25),
      potential: Math.min(99, potential),
      photo: null
    });
    playerIdCounter++;
  });
});

const output = `// BU DOSYA GENERATE_LEAGUES_DB SCRIPT TARAFINDAN OLUŞTURULMUŞTUR

export const leagues = ${JSON.stringify(leagues, null, 2)};

export const clubs = ${JSON.stringify(clubs, null, 2)};

export const players = ${JSON.stringify(players, null, 2)};

const ChampionMasterData = { leagues, clubs, players };
export default ChampionMasterData;
`;

fs.writeFileSync(path.join(process.cwd(), 'lib/game/data.js'), output);
console.log("Başarıyla " + leagues.length + " lig, " + clubs.length + " takım ve " + players.length + " oyuncu oluşturuldu.");
