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
