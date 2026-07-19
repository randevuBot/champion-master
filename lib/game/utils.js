export function formatMoney(amount) {
  if (amount >= 1000000) return `€${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `€${(amount / 1000).toFixed(0)}K`;
  return `€${amount}`;
}

export function getFlag(nationality) {
  const flags = {
    'Türk': '🇹🇷', 'İngiliz': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'İspanyol': '🇪🇸', 'Alman': '🇩🇪',
    'İtalyan': '🇮🇹', 'Fransız': '🇫🇷', 'Portekizli': '🇵🇹', 'Hollandalı': '🇳🇱',
    'Belçikalı': '🇧🇪', 'Brezilyalı': '🇧🇷', 'Arjantinli': '🇦🇷', 'Uruguaylı': '🇺🇾',
    'Kolombiyalı': '🇨🇴', 'Senegalli': '🇸🇳', 'Faslı': '🇲🇦', 'Mısırlı': '🇪🇬',
    'Kamerunlu': '🇨🇲', 'İvorlu': '🇨🇮', 'Güney Afrikalı': '🇿🇦', 'Tunuslu': '🇹🇳',
    'Cezayirli': '🇩🇿'
  };
  return flags[nationality] || '🌍';
}

const FIRST_NAMES = ["Ahmet", "Mehmet", "Can", "Burak", "Emre", "Carlos", "Luis", "Jürgen", "Antonio", "Paolo", "Pep", "Jose", "Diego", "Fatih", "Sergen"];
const LAST_NAMES = ["Yılmaz", "Öz", "Kaya", "Şahin", "Demir", "Santos", "Garcia", "Meyer", "Pintus", "Rossi", "Guardiola", "Mourinho", "Simeone", "Terim", "Yalçın"];
const CLUBS = ["Real Madrid", "Barcelona", "Bayern Münih", "Manchester City", "Liverpool", "Juventus", "PSG", "Ajax", "Boca Juniors", "Galatasaray", "Fenerbahçe", "Beşiktaş", "Trabzonspor", "Porto", "Benfica"];

export function generateStaffMarket() {
  const roles = ['assistant', 'coach', 'gkCoach', 'fitnessCoach'];
  const market = { assistant: [], coach: [], gkCoach: [], fitnessCoach: [] };

  roles.forEach(role => {
    // Her rol için 3-5 arası rastgele aday üret
    const count = Math.floor(Math.random() * 3) + 3; 
    for (let i = 0; i < count; i++) {
      const name = `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`;
      const isPremium = Math.random() > 0.8; // %20 ihtimalle premium
      const rating = isPremium ? Math.floor(Math.random() * 10) + 90 : Math.floor(Math.random() * 25) + 65; // Premium: 90-99, Normal: 65-89
      const salary = (rating * 500) + Math.floor(Math.random() * 5000);
      const fee = salary * 5;
      
      const championships = isPremium ? Math.floor(Math.random() * 10) + 2 : Math.floor(Math.random() * 3);
      
      const historyCount = Math.floor(Math.random() * 3) + 1;
      const history = [];
      let currentYear = 2024;
      for (let j = 0; j < historyCount; j++) {
        const startYear = currentYear - Math.floor(Math.random() * 4) - 1;
        history.push(`${CLUBS[Math.floor(Math.random() * CLUBS.length)]} (${startYear}-${currentYear})`);
        currentYear = startYear;
      }

      market[role].push({
        id: `${role}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        rating,
        salary,
        fee,
        championships,
        history,
        isPremium
      });
    }
  });

  return market;
}
