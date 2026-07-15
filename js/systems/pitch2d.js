/**
 * ChampionMaster — 2D Pitch Engine
 * Maç olaylarını (event) alıp basit 2D HTML5 Canvas üzerinde gösterir.
 */

const Pitch2D = (() => {
  let canvas, ctx;
  let width, height;
  
  // Topun konumu (x, y) - 0.0 ile 1.0 arası oran
  let ball = { x: 0.5, y: 0.5 };
  // Topun gideceği hedef konum (animasyon için)
  let targetBall = { x: 0.5, y: 0.5 };
  
  let animationRef = null;
  let isAnimating = false;
  
  function init(canvasId) {
    canvas = document.getElementById(canvasId);
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    width = canvas.width;
    height = canvas.height;
    
    // Temiz saha ile başla
    ball = { x: 0.5, y: 0.5 };
    targetBall = { x: 0.5, y: 0.5 };
    draw();
  }
  
  // Her maç olayı geldiğinde topun yerini belirle
  function processEvent(event) {
    if (!ctx) return;
    
    // Ev sahibi her zaman sol (0.0), Deplasman sağ (1.0) hücum eder (Basitlik için)
    // isHome = event.side === 'home'
    const isHomeAttacking = event.side === 'home';
    
    // Event türüne göre hedefler belirle
    switch(event.type) {
      case 'goal':
        // Top kalenin içine gider (Ev sahibi atıyorsa sağ kaleye, deplasman atıyorsa sol kaleye)
        targetBall = isHomeAttacking ? { x: 0.98, y: 0.5 } : { x: 0.02, y: 0.5 };
        break;
      case 'shot':
      case 'save':
        // Top kaleye yakın bir yere (kaleciye veya dışarıya)
        targetBall = isHomeAttacking ? { x: 0.95, y: 0.4 + Math.random()*0.2 } : { x: 0.05, y: 0.4 + Math.random()*0.2 };
        break;
      case 'corner':
        // Köşelerden biri
        targetBall = isHomeAttacking ? { x: 1.0, y: (Math.random()>0.5 ? 0 : 1.0) } : { x: 0.0, y: (Math.random()>0.5 ? 0 : 1.0) };
        break;
      case 'foul':
      case 'yellow_card':
      case 'red_card':
      case 'injury':
      case 'tackle':
        // Saha ortalarında veya o anki tarafta rastgele bir yer
        const midX = isHomeAttacking ? (0.6 + Math.random()*0.2) : (0.2 + Math.random()*0.2);
        targetBall = { x: midX, y: 0.2 + Math.random()*0.6 };
        break;
      case 'dribble':
        // Ceza sahasına doğru yaklaşma
        targetBall = isHomeAttacking ? { x: 0.8, y: 0.3 + Math.random()*0.4 } : { x: 0.2, y: 0.3 + Math.random()*0.4 };
        break;
      default:
        // Top merkez etrafında dolanır (orta saha mücadelesi)
        targetBall = { x: 0.4 + Math.random()*0.2, y: 0.4 + Math.random()*0.2 };
        break;
    }
    
    // Hedef belirlendiyse animasyonu başlat
    if (!isAnimating) {
      isAnimating = true;
      animate();
    }
  }
  
  function animate() {
    if (!ctx) return;
    
    // Topu hedefe doğru yavaşça kaydır (Lerp - Linear Interpolation)
    ball.x += (targetBall.x - ball.x) * 0.1;
    ball.y += (targetBall.y - ball.y) * 0.1;
    
    draw();
    
    // Hedefe çok yaklaştıysa dur
    const dx = targetBall.x - ball.x;
    const dy = targetBall.y - ball.y;
    if (Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) {
      animationRef = requestAnimationFrame(animate);
    } else {
      isAnimating = false;
    }
  }
  
  function draw() {
    if (!ctx) return;
    
    // 1. Çim arkaplanı (Çizgili çim deseni)
    ctx.fillStyle = '#2e8b57'; // Koyu yeşil
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#3cb371'; // Açık yeşil
    for (let i = 0; i < width; i += 40) {
      ctx.fillRect(i, 0, 20, height);
    }
    
    // 2. Saha çizgileri
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    
    // Dış çizgiler
    ctx.strokeRect(5, 5, width - 10, height - 10);
    
    // Orta çizgi
    ctx.beginPath();
    ctx.moveTo(width / 2, 5);
    ctx.lineTo(width / 2, height - 5);
    ctx.stroke();
    
    // Orta yuvarlak
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 40, 0, Math.PI * 2);
    ctx.stroke();
    
    // Sol ceza sahası
    ctx.strokeRect(5, height/2 - 60, 80, 120);
    // Sol altı pas
    ctx.strokeRect(5, height/2 - 25, 30, 50);
    
    // Sağ ceza sahası
    ctx.strokeRect(width - 85, height/2 - 60, 80, 120);
    // Sağ altı pas
    ctx.strokeRect(width - 35, height/2 - 25, 30, 50);
    
    // 3. Topu Çiz
    const pixelX = ball.x * width;
    const pixelY = ball.y * height;
    
    // Top Gölgesi
    ctx.beginPath();
    ctx.arc(pixelX + 2, pixelY + 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    
    // Top
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
  }
  
  function reset() {
    ball = { x: 0.5, y: 0.5 };
    targetBall = { x: 0.5, y: 0.5 };
    draw();
  }

  return { init, processEvent, reset };
})();

if (typeof module !== 'undefined') module.exports = Pitch2D;
