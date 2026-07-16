import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const allClubs = await prisma.club.findMany();
  const allPlayers = await prisma.player.findMany();

  // Telif (Copyright) koruması için isimleri ve logoları sahteleştirme
  const fictionalizeLastName = (lastName) => {
    if (!lastName || lastName.length < 3) return lastName;
    return lastName.replace(/[aeiouıioöuü]([^aeiouıioöuü]*)$/i, (match, p1) => {
      const char = match.charAt(0).toLowerCase();
      const replacements = { 'a': 'o', 'e': 'a', 'i': 'e', 'ı': 'a', 'o': 'u', 'ö': 'o', 'u': 'a', 'ü': 'u' };
      const newChar = replacements[char] || 'o';
      const isUpper = match.charAt(0) === match.charAt(0).toUpperCase();
      return (isUpper ? newChar.toUpperCase() : newChar) + p1;
    });
  };

  const clubNameMap = {
    '645': { name: 'İstanbul Aslanları', shortName: 'İST', logo: null }, // Galatasaray
    '611': { name: 'Kadıköy Kanaryaları', shortName: 'KAD', logo: null }, // Fenerbahçe
    '549': { name: 'Boğaziçi Kartalları', shortName: 'BOĞ', logo: null }, // Beşiktaş
    '998': { name: 'Karadeniz Fırtınası', shortName: 'KAR', logo: null }  // Trabzonspor
  };

  const formattedClubs = allClubs.map(c => {
    const { primaryColor, secondaryColor, ...rest } = c;
    const safeInfo = clubNameMap[c.id] || { name: c.name + ' FC', shortName: c.shortName, logo: null };
    
    return {
      ...rest,
      name: safeInfo.name,
      shortName: safeInfo.shortName,
      logo: safeInfo.logo,
      colors: {
        primary: primaryColor || '#000000',
        secondary: secondaryColor || '#ffffff'
      }
    };
  });

  const formattedPlayers = allPlayers.map(p => {
    // "Mauro Icardi" -> "M. Icardo"
    const firstInitial = p.firstName ? p.firstName.charAt(0) + '.' : '';
    const fakeLastName = fictionalizeLastName(p.lastName);
    
    return {
      ...p,
      firstName: firstInitial,
      lastName: fakeLastName,
      photo: null // Telif yememek için gerçek fotoğrafları siliyoruz
    };
  });

  const fileContent = `// BU DOSYA SQLITE VERİTABANINDAN OTOMATİK OLUŞTURULMUŞTUR
export const leagues = [
  { id: 'superlig', name: 'Türkiye Elit Ligi', country: 'Türkiye' }
];

export const clubs = ${JSON.stringify(formattedClubs, null, 2)};

export const players = ${JSON.stringify(formattedPlayers, null, 2)};

const ChampionMasterData = {
  leagues,
  clubs,
  players
};
export default ChampionMasterData;
`;

  const dataPath = path.join(__dirname, '../lib/game/data.js');
  fs.writeFileSync(dataPath, fileContent);
  console.log("data.js başarıyla SQLite verilerinden oluşturuldu ve renk hatası düzeltildi.");
  await prisma.$disconnect();
}

main();
