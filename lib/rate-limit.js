// Basit bir In-Memory Hız Sınırlandırıcı (Rate Limiter)
// Sunucu yeniden başlatıldığında sıfırlanır. Prod ortamında ideal olarak Redis kullanılır.

const rateLimitMap = new Map();

export function applyRateLimit(ip, limit = 5, windowMs = 60000) {
  const now = Date.now();
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true; // İzin verildi
  }

  const record = rateLimitMap.get(ip);
  if (now > record.resetTime) {
    // Süre doldu, sıfırla
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true; 
  }

  if (record.count >= limit) {
    return false; // Sınır aşıldı (Rate Limited)
  }

  record.count += 1;
  return true;
}
