export class Pitch2D {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.canvas = null;
    this.ctx = null;
    this.width = 0;
    this.height = 0;
    
    this.ball = { x: 0.5, y: 0.5 };
    this.targetBall = { x: 0.5, y: 0.5 };
    
    this.animationRef = null;
    this.isAnimating = false;
  }

  init() {
    this.canvas = document.getElementById(this.canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    this.ball = { x: 0.5, y: 0.5 };
    this.targetBall = { x: 0.5, y: 0.5 };
    this.draw();
  }
  
  processEvent(event) {
    if (!this.ctx) return;
    
    const isHomeAttacking = event.side === 'home';
    
    switch(event.type) {
      case 'goal':
        this.targetBall = isHomeAttacking ? { x: 0.98, y: 0.5 } : { x: 0.02, y: 0.5 };
        break;
      case 'shot':
      case 'save':
        this.targetBall = isHomeAttacking ? { x: 0.95, y: 0.4 + Math.random()*0.2 } : { x: 0.05, y: 0.4 + Math.random()*0.2 };
        break;
      case 'corner':
        this.targetBall = isHomeAttacking ? { x: 1.0, y: (Math.random()>0.5 ? 0 : 1.0) } : { x: 0.0, y: (Math.random()>0.5 ? 0 : 1.0) };
        break;
      case 'foul':
      case 'yellow_card':
      case 'red_card':
      case 'injury':
      case 'tackle':
        const midX = isHomeAttacking ? (0.6 + Math.random()*0.2) : (0.2 + Math.random()*0.2);
        this.targetBall = { x: midX, y: 0.2 + Math.random()*0.6 };
        break;
      case 'dribble':
        this.targetBall = isHomeAttacking ? { x: 0.8, y: 0.3 + Math.random()*0.4 } : { x: 0.2, y: 0.3 + Math.random()*0.4 };
        break;
      default:
        this.targetBall = { x: 0.4 + Math.random()*0.2, y: 0.4 + Math.random()*0.2 };
        break;
    }
    
    if (!this.isAnimating) {
      this.isAnimating = true;
      this.animate();
    }
  }
  
  animate() {
    if (!this.ctx) return;
    
    this.ball.x += (this.targetBall.x - this.ball.x) * 0.1;
    this.ball.y += (this.targetBall.y - this.ball.y) * 0.1;
    
    this.draw();
    
    const dx = this.targetBall.x - this.ball.x;
    const dy = this.targetBall.y - this.ball.y;
    if (Math.abs(dx) > 0.005 || Math.abs(dy) > 0.005) {
      this.animationRef = requestAnimationFrame(() => this.animate());
    } else {
      this.isAnimating = false;
    }
  }
  
  draw() {
    if (!this.ctx) return;
    
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;

    // 1. Grass
    ctx.fillStyle = '#2e8b57';
    ctx.fillRect(0, 0, width, height);
    
    ctx.fillStyle = '#3cb371';
    for (let i = 0; i < width; i += 40) {
      ctx.fillRect(i, 0, 20, height);
    }
    
    // 2. Lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    
    ctx.strokeRect(5, 5, width - 10, height - 10);
    
    ctx.beginPath();
    ctx.moveTo(width / 2, 5);
    ctx.lineTo(width / 2, height - 5);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 40, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.strokeRect(5, height/2 - 60, 80, 120);
    ctx.strokeRect(5, height/2 - 25, 30, 50);
    
    ctx.strokeRect(width - 85, height/2 - 60, 80, 120);
    ctx.strokeRect(width - 35, height/2 - 25, 30, 50);
    
    // 3. Ball
    const pixelX = this.ball.x * width;
    const pixelY = this.ball.y * height;
    
    ctx.beginPath();
    ctx.arc(pixelX + 2, pixelY + 2, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(pixelX, pixelY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
  }
  
  reset() {
    this.ball = { x: 0.5, y: 0.5 };
    this.targetBall = { x: 0.5, y: 0.5 };
    this.draw();
  }
}
