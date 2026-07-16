import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_KEY = process.env.API_FOOTBALL_KEY || '127f1df2e9a69fcb8d3ef8354e18b7da';
const BASE_URL = 'https://v3.football.api-sports.io';

const headers = {
  'x-apisports-key': API_KEY
};

// GS: 645, FB: 611, BJK: 549, TS: 998
const TARGET_TEAMS = [645, 611, 549, 998];

const mapPosition = (apiPos) => {
  const map = {
    'Goalkeeper': 'GK',
    'Defender': 'CB',
    'Midfielder': 'CM',
    'Attacker': 'ST'
  };
  return map[apiPos] || 'CM';
};

const generateRandomStats = (pos) => {
  const base = 70 + Math.floor(Math.random() * 15);
  return {
    pac: base + Math.floor(Math.random() * 10 - 5),
    sho: pos === 'ST' ? base + 10 : base - 10,
    pas: base + Math.floor(Math.random() * 10 - 5),
    dri: base + Math.floor(Math.random() * 10 - 5),
    def: pos === 'CB' ? base + 15 : base - 15,
    phy: base + Math.floor(Math.random() * 10 - 5),
    overall: base
  };
};

async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { headers });
      const data = await res.json();
      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error("API Hatası:", data.errors);
        throw new Error("API Hatası");
      }
      return data.response;
    } catch (e) {
      console.log(`Hata oluştu, tekrar deneniyor... (${i+1}/${retries})`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return null;
}

async function syncData() {
  console.log("Veriler API-Football'dan SQLite veritabanına çekiliyor...");

  for (const teamId of TARGET_TEAMS) {
    console.log(`Takım ID ${teamId} bilgileri alınıyor...`);
    const teamData = await fetchWithRetry(`${BASE_URL}/teams?id=${teamId}`);
    if (!teamData || teamData.length === 0) continue;

    const t = teamData[0].team;
    const v = teamData[0].venue;
    const clubIdString = t.id.toString();

    await prisma.club.upsert({
      where: { id: clubIdString },
      update: {
        name: t.name,
        shortName: t.code || t.name.substring(0,3).toUpperCase(),
        city: v.city,
        stadium: v.name,
        capacity: v.capacity,
        logo: t.logo
      },
      create: {
        id: clubIdString,
        name: t.name,
        shortName: t.code || t.name.substring(0,3).toUpperCase(),
        leagueId: 'superlig',
        city: v.city,
        stadium: v.name,
        capacity: v.capacity,
        prestige: 8,
        budget: 50,
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        founded: t.founded,
        logo: t.logo
      }
    });

    console.log(`${t.name} kadrosu alınıyor...`);
    const squadData = await fetchWithRetry(`${BASE_URL}/players/squads?team=${teamId}`);
    
    // Rate limit koruması
    await new Promise(r => setTimeout(r, 2000));
    
    if (squadData && squadData.length > 0) {
      const squad = squadData[0].players;
      for (const p of squad) {
        const mappedPos = mapPosition(p.position);
        
        const parts = p.name.split(' ');
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ') || parts[0];
        const stats = generateRandomStats(mappedPos);
        
        await prisma.player.upsert({
          where: { apiId: p.id },
          update: {
            clubId: clubIdString,
            age: p.age || 25,
            photo: p.photo
          },
          create: {
            apiId: p.id,
            firstName: firstName,
            lastName: lastName,
            age: p.age || 25,
            nationality: 'Bilinmiyor',
            clubId: clubIdString,
            position: mappedPos,
            overall: stats.overall,
            pac: stats.pac,
            sho: stats.sho,
            pas: stats.pas,
            dri: stats.dri,
            def: stats.def,
            phy: stats.phy,
            value: Math.floor(Math.random() * 15) + 1,
            wage: Math.floor(Math.random() * 50) + 10,
            contractEnd: 2025 + Math.floor(Math.random() * 3),
            height: 180,
            weight: 75,
            potential: stats.overall + Math.floor(Math.random() * 5),
            photo: p.photo
          }
        });
      }
    }
  }

  console.log("Arayüz için data.js dosyası güncelleniyor (1:1 yapıyı korumak için)...");
  
  const { execSync } = await import('child_process');
  execSync('node scripts/exportToData.mjs', { stdio: 'inherit' });
  
  await prisma.$disconnect();
}

syncData().catch(e => {
  console.error(e);
  prisma.$disconnect();
});
