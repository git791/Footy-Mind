import React, { useEffect, useRef, useState } from 'react';

const BARLOW = { fontFamily: "'Barlow', sans-serif" };
const TEKO = { fontFamily: "'Teko', sans-serif" };

interface PlayerState {
  x: number; y: number; vx: number; vy: number; radius: number;
  color: string; isJumping: boolean; score: number;
}

interface BallState {
  x: number; y: number; vx: number; vy: number; radius: number;
}

export default function BobbleheadGame({ onAddXP }: { onAddXP?: (xp: number) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scores, setScores] = useState({ p1: 0, p2: 0 });
  const [gameOver, setGameOver] = useState(false);
  
  // Game constants
  const GRAVITY = 0.6;
  const JUMP_POWER = -12;
  const SPEED = 5;
  const GROUND_Y = 350; // out of 400 height
  const GOAL_WIDTH = 60;
  const GOAL_HEIGHT = 150;
  
  const keys = useRef<{ [key: string]: boolean }>({});

  // Game state refs (to avoid closure issues in loop)
  const gameState = useRef({
    p1: { x: 150, y: GROUND_Y, vx: 0, vy: 0, radius: 35, color: '#ef4444', isJumping: false, score: 0 },
    p2: { x: 650, y: GROUND_Y, vx: 0, vy: 0, radius: 35, color: '#3b82f6', isJumping: false, score: 0 },
    ball: { x: 400, y: 100, vx: 0, vy: 0, radius: 15 }
  });

  const resetPositions = () => {
    gameState.current.p1.x = 150; gameState.current.p1.y = GROUND_Y; gameState.current.p1.vx = 0; gameState.current.p1.vy = 0;
    gameState.current.p2.x = 650; gameState.current.p2.y = GROUND_Y; gameState.current.p2.vx = 0; gameState.current.p2.vy = 0;
    gameState.current.ball.x = 400; gameState.current.ball.y = 100; gameState.current.ball.vx = 0; gameState.current.ball.vy = 0;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const updatePhysics = () => {
      if (gameOver) return;
      const state = gameState.current;

      // P1 Controls (W A D)
      if (keys.current['a']) state.p1.vx = -SPEED;
      else if (keys.current['d']) state.p1.vx = SPEED;
      else state.p1.vx = 0;
      if (keys.current['w'] && !state.p1.isJumping) {
        state.p1.vy = JUMP_POWER;
        state.p1.isJumping = true;
      }

      // P2 Controls (Arrow Keys) - AI for now, or Local Multiplayer
      // Let's make P2 a simple AI
      if (state.ball.x > 400) {
        if (state.p2.x > state.ball.x + 20) state.p2.vx = -SPEED * 0.8;
        else if (state.p2.x < state.ball.x - 20) state.p2.vx = SPEED * 0.8;
        else state.p2.vx = 0;
        
        if (state.ball.y < state.p2.y - 50 && !state.p2.isJumping && Math.random() < 0.05) {
          state.p2.vy = JUMP_POWER;
          state.p2.isJumping = true;
        }
      } else {
        // Return to base
        if (state.p2.x > 650) state.p2.vx = -SPEED * 0.8;
        else if (state.p2.x < 650) state.p2.vx = SPEED * 0.8;
        else state.p2.vx = 0;
      }

      // Apply Physics
      [state.p1, state.p2].forEach(p => {
        p.vy += GRAVITY;
        p.x += p.vx;
        p.y += p.vy;

        // Ground constraint
        if (p.y >= GROUND_Y) {
          p.y = GROUND_Y;
          p.vy = 0;
          p.isJumping = false;
        }
        // Wall constraint
        if (p.x < p.radius) p.x = p.radius;
        if (p.x > 800 - p.radius) p.x = 800 - p.radius;
        
        // Net constraint
        if (p === state.p1 && p.x > 400 - p.radius) p.x = 400 - p.radius;
        if (p === state.p2 && p.x < 400 + p.radius) p.x = 400 + p.radius;
      });

      // Ball Physics
      state.ball.vy += GRAVITY;
      state.ball.x += state.ball.vx;
      state.ball.y += state.ball.vy;

      // Ball Ground Bounce
      if (state.ball.y > GROUND_Y + 35 - state.ball.radius) {
        state.ball.y = GROUND_Y + 35 - state.ball.radius;
        state.ball.vy = -state.ball.vy * 0.7; // bounce damping
        state.ball.vx *= 0.98; // friction
      }

      // Ball Wall/Goal Bounce
      if (state.ball.x < GOAL_WIDTH && state.ball.y > 400 - GOAL_HEIGHT) {
        // P2 scores
        state.p2.score++;
        setScores({ p1: state.p1.score, p2: state.p2.score });
        resetPositions();
      } else if (state.ball.x > 800 - GOAL_WIDTH && state.ball.y > 400 - GOAL_HEIGHT) {
        // P1 scores
        state.p1.score++;
        setScores({ p1: state.p1.score, p2: state.p2.score });
        resetPositions();
      } else {
        // Normal wall bounce
        if (state.ball.x < state.ball.radius) {
          state.ball.x = state.ball.radius;
          state.ball.vx = -state.ball.vx * 0.8;
        }
        if (state.ball.x > 800 - state.ball.radius) {
          state.ball.x = 800 - state.ball.radius;
          state.ball.vx = -state.ball.vx * 0.8;
        }
      }

      // Ball Net Bounce
      if (state.ball.y > 250 && state.ball.x > 390 && state.ball.x < 410) {
        state.ball.vx = -state.ball.vx * 0.8;
      }

      // Player-Ball Collision
      [state.p1, state.p2].forEach(p => {
        const dx = state.ball.x - p.x;
        const dy = state.ball.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < p.radius + state.ball.radius) {
          // Resolve collision (elastic)
          const angle = Math.atan2(dy, dx);
          const force = 10; // kick power
          
          state.ball.vx = Math.cos(angle) * force + p.vx * 0.5;
          state.ball.vy = Math.sin(angle) * force + p.vy * 0.5;
          
          // push ball out of player
          state.ball.x = p.x + Math.cos(angle) * (p.radius + state.ball.radius + 1);
          state.ball.y = p.y + Math.sin(angle) * (p.radius + state.ball.radius + 1);
        }
      });
      
      // Check Win
      if (state.p1.score >= 5 || state.p2.score >= 5) {
        if (state.p1.score >= 5 && onAddXP) {
          const today = new Date().toDateString();
          const limitKey = `bobblehead_xp_limit_${today}`;
          const currentDailyXP = parseInt(localStorage.getItem(limitKey) || '0');
          if (currentDailyXP < 1000) {
            const xpToGive = Math.min(100, 1000 - currentDailyXP);
            localStorage.setItem(limitKey, (currentDailyXP + xpToGive).toString());
            onAddXP(xpToGive);
          }
        }
        setGameOver(true);
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, 800, 400);
      const state = gameState.current;

      // Draw Sky/Bg
      ctx.fillStyle = '#0a1128';
      ctx.fillRect(0, 0, 800, 400);

      // Draw Ground
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(0, GROUND_Y + 35, 800, 400 - (GROUND_Y + 35));

      // Draw Net
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(395, 250, 10, 150);

      // Draw Goals
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(0, 400 - GOAL_HEIGHT, GOAL_WIDTH, GOAL_HEIGHT); // Left Goal
      ctx.fillRect(800 - GOAL_WIDTH, 400 - GOAL_HEIGHT, GOAL_WIDTH, GOAL_HEIGHT); // Right Goal
      
      // Draw Goal posts
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(GOAL_WIDTH, 400 - GOAL_HEIGHT); ctx.lineTo(GOAL_WIDTH, 400); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(800 - GOAL_WIDTH, 400 - GOAL_HEIGHT); ctx.lineTo(800 - GOAL_WIDTH, 400); ctx.stroke();

      // Draw Players (Semi-circles)
      [state.p1, state.p2].forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, Math.PI, 0); // Semi-circle top half
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();
        // Flat bottom
        ctx.fillRect(p.x - p.radius, p.y, p.radius * 2, 5);
        
        // Eyes
        ctx.fillStyle = 'white';
        const eyeXOffset = p === state.p1 ? 15 : -15;
        ctx.beginPath(); ctx.arc(p.x + eyeXOffset, p.y - 15, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(p.x + eyeXOffset + (state.ball.x > p.x ? 3 : -3), p.y - 15, 3, 0, Math.PI*2); ctx.fill();
      });

      // Draw Ball
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      // Ball pattern
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(state.ball.x - 10, state.ball.y); ctx.lineTo(state.ball.x + 10, state.ball.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(state.ball.x, state.ball.y - 10); ctx.lineTo(state.ball.x, state.ball.y + 10); ctx.stroke();
    };

    const loop = () => {
      updatePhysics();
      draw();
      animationId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animationId);
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="flex justify-between w-full max-w-[800px] mb-4 text-white font-bold text-3xl" style={TEKO}>
        <div className="text-red-500">P1 SCORE: {scores.p1}</div>
        <div>BOBBLEHEAD LEGENDS</div>
        <div className="text-blue-500">AI SCORE: {scores.p2}</div>
      </div>
      
      <div className="relative border-4 border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <canvas ref={canvasRef} width={800} height={400} className="block" />
        
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center">
            <h2 className="text-6xl text-white font-bold mb-2" style={TEKO}>
              {scores.p1 >= 5 ? "YOU WIN!" : "AI WINS!"}
            </h2>
            {scores.p1 >= 5 && (
              <div className="text-green-400 font-bold mb-6 flex items-center gap-2" style={BARLOW}>
                <span className="text-2xl">+100 XP</span>
                <span className="text-sm opacity-70">(Daily limit: 1000 XP)</span>
              </div>
            )}
            <button 
              onClick={() => {
                gameState.current.p1.score = 0;
                gameState.current.p2.score = 0;
                setScores({p1: 0, p2: 0});
                setGameOver(false);
                resetPositions();
              }}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-full font-bold transition-all"
            >
              PLAY AGAIN
            </button>
          </div>
        )}
      </div>

      <div className="mt-6 text-gray-400 flex gap-8 text-sm" style={BARLOW}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-white/10 rounded text-white">W</span>
          <span className="px-2 py-1 bg-white/10 rounded text-white">A</span>
          <span className="px-2 py-1 bg-white/10 rounded text-white">D</span>
          <span>to Move & Jump</span>
        </div>
        <div>First to 5 Goals wins!</div>
      </div>
    </div>
  );
}
