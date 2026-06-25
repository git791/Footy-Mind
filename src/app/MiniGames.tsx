import React, { useState, useEffect, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import playerStanding from "../imports/magnific_playful-cartoon-illustrat_jSC8vBuLD0.png";
import playerRunning from "../imports/magnific_vibrant-cartoon-caricatur_0pNwPNFTfW.png";
import BobbleheadGame from "./BobbleheadGame";
import { addUserXP } from "../services/firebase";
import { getAuth } from "firebase/auth";

const TEKO: React.CSSProperties = { fontFamily: "'Teko', sans-serif" };
const BARLOW: React.CSSProperties = { fontFamily: "'Barlow', sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

const handleGameWin = async (gameName: string) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const key = `daily_wins_${today}_${gameName}`;
    const winsStr = localStorage.getItem(key) || "0";
    const wins = parseInt(winsStr, 10);
    if (wins < 3) {
      localStorage.setItem(key, (wins + 1).toString());
      await addUserXP(user.uid, 50);
      alert(`You won ${gameName}! +50 XP (Win ${wins + 1}/3 today)`);
    } else {
      alert(`You won ${gameName}! (Casual win, daily limit reached)`);
    }
  } catch (err) {
    console.error("Failed to add XP", err);
  }
};

export function PenaltyShootout({ C }: { C: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ scored: 0, saved: 0 });
  const [kick, setKick] = useState(1);
  const [done, setDone] = useState(false);
  const [power, setPower] = useState(0);
  const [aiming, setAiming] = useState(false);
  
  const stateRef = useRef({
    phase: "idle" as "idle" | "aiming" | "kicking" | "result",
    power: 0,
    powerDir: 1,
    target: { x: 0, y: 0 },
    ball: { x: 400, y: 350, z: 1 },
    gk: { x: 400, y: 200, targetX: 400, targetY: 200 },
    result: null as "goal" | "saved" | "miss" | null
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let animationId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      const s = stateRef.current;

      // Logic
      if (s.phase === "aiming") {
        s.power += s.powerDir * 150 * dt;
        if (s.power > 100) { s.power = 100; s.powerDir = -1; }
        if (s.power < 0) { s.power = 0; s.powerDir = 1; }
        setPower(s.power);
      } else if (s.phase === "kicking") {
        // Move ball towards target
        const dx = s.target.x - s.ball.x;
        const dy = s.target.y - s.ball.y;
        const speed = 600 * (0.5 + s.power/200) * dt;
        
        // Z axis for depth (scale)
        s.ball.z -= 1.5 * dt;

        if (s.ball.z <= 0.3) {
          s.ball.z = 0.3;
          s.phase = "result";
          
          // Check collision
          const goalLeft = 150;
          const goalRight = 650;
          const goalTop = 80;
          const goalBottom = 280;
          
          let isGoal = false;
          if (s.ball.x > goalLeft && s.ball.x < goalRight && s.ball.y > goalTop && s.ball.y < goalBottom) {
            // Target is in goal, check GK
            const gkDist = Math.hypot(s.ball.x - s.gk.x, s.ball.y - s.gk.y);
            if (gkDist < 80) {
              s.result = "saved";
            } else {
              isGoal = true;
              s.result = "goal";
            }
          } else {
            s.result = "miss";
          }
          
          setScore(prev => {
            const nextScore = isGoal ? {...prev, scored: prev.scored + 1} : {...prev, saved: prev.saved + 1};
            
            setTimeout(() => {
              setKick(k => {
                if (k >= 5) { 
                  setDone(true); 
                  // Penalty condition: 4 or more goals
                  if (nextScore.scored >= 4) {
                     handleGameWin("Penalty");
                  }
                  return k; 
                }
                return k + 1;
              });
              s.phase = "idle";
              s.ball = { x: 400, y: 350, z: 1 };
              s.gk = { x: 400, y: 200, targetX: 400, targetY: 200 };
              s.result = null;
              s.power = 0;
              setPower(0);
            }, 2000);
            
            return nextScore;
          });
        } else {
          s.ball.x += dx * 3 * dt;
          s.ball.y += dy * 3 * dt;
          
          // Move GK
          s.gk.x += (s.gk.targetX - s.gk.x) * 5 * dt;
          s.gk.y += (s.gk.targetY - s.gk.y) * 5 * dt;
        }
      }

      // Draw
      ctx.clearRect(0, 0, 800, 400);
      
      // Pitch
      ctx.fillStyle = "#1a6b1a";
      ctx.fillRect(0, 0, 800, 400);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(100, 280); ctx.lineTo(700, 280);
      ctx.stroke();

      // Goal
      ctx.strokeStyle = "white";
      ctx.lineWidth = 8;
      ctx.strokeRect(150, 80, 500, 200);

      // GK
      ctx.save();
      ctx.translate(s.gk.x, s.gk.y);
      // Goalkeeper Body / Jersey
      ctx.fillStyle = '#1077C3';
      ctx.fillRect(-15, -20, 30, 40); // Torso

      // Oversized Bobble Head (Procedural Avatar style)
      ctx.beginPath();
      ctx.arc(0, -35, 18, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD1A4'; // Skin tone
      ctx.fill();
      ctx.closePath();

      // Goalkeeper Gloves
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-25, -10, 8, 12); // Left glove
      ctx.fillRect(17, -10, 8, 12);  // Right glove
      ctx.restore();

      // Ball
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(s.ball.x, s.ball.y, 15 * s.ball.z, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 2 * s.ball.z;
      ctx.stroke();

      // Aiming cursor
      if (s.phase === "aiming") {
        ctx.strokeStyle = "rgba(255,0,0,0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(s.target.x, s.target.y, 20, 0, Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s.target.x-25, s.target.y); ctx.lineTo(s.target.x+25, s.target.y);
        ctx.moveTo(s.target.x, s.target.y-25); ctx.lineTo(s.target.x, s.target.y+25);
        ctx.stroke();
      }

      // Result Text
      if (s.result) {
        ctx.fillStyle = s.result === "goal" ? "#22c55e" : "#ef4444";
        ctx.font = "bold 64px Teko";
        ctx.textAlign = "center";
        ctx.fillText(s.result.toUpperCase() + "!", 400, 200);
      }

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (stateRef.current.phase !== "idle") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    
    stateRef.current.phase = "aiming";
    stateRef.current.target = { x, y };
    setAiming(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (stateRef.current.phase !== "aiming") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    stateRef.current.target.x = ((e.clientX - rect.left) / rect.width) * 800;
    stateRef.current.target.y = ((e.clientY - rect.top) / rect.height) * 400;
  };

  const handlePointerUp = () => {
    if (stateRef.current.phase !== "aiming") return;
    stateRef.current.phase = "kicking";
    setAiming(false);
    
    // GK guesses
    stateRef.current.gk.targetX = 150 + Math.random() * 500;
    stateRef.current.gk.targetY = 80 + Math.random() * 200;
  };

  if (done) return (
    <div style={{ textAlign:"center", padding:"40px 24px", ...BARLOW }}>
      <div style={{ fontSize:"3rem", marginBottom:12 }}>{score.scored >= 4 ? "🏆" : score.scored >= 3 ? "⚽" : "🧤"}</div>
      <h2 style={{ color:C.white, fontSize:"2rem", fontWeight:700, ...TEKO, marginBottom:6 }}>Penalty Round Complete</h2>
      <div style={{ display:"flex", gap:20, justifyContent:"center", marginBottom:20 }}>
        <div style={{ background:`${C.green}22`, border:`1px solid ${C.green}`, borderRadius:12, padding:"12px 24px", textAlign:"center" }}>
          <div style={{ fontSize:"2.5rem", fontWeight:900, color:C.green, ...TEKO }}>{score.scored}</div>
          <div style={{ fontSize:"0.7rem", color:C.gray, ...MONO }}>GOALS</div>
        </div>
        <div style={{ background:`${C.red}22`, border:`1px solid ${C.red}`, borderRadius:12, padding:"12px 24px", textAlign:"center" }}>
          <div style={{ fontSize:"2.5rem", fontWeight:900, color:C.red, ...TEKO }}>{score.saved}</div>
          <div style={{ fontSize:"0.7rem", color:C.gray, ...MONO }}>SAVED/MISS</div>
        </div>
      </div>
      <button onClick={() => { setScore({scored:0,saved:0}); setKick(1); setDone(false); }} style={{ background:`linear-gradient(135deg,${C.red},${C.redDk})`, border:"none", borderRadius:10, padding:"10px 24px", color:C.white, cursor:"pointer", fontWeight:700, fontSize:"1rem", ...TEKO }}>Try Again</button>
    </div>
  );

  return (
    <div style={{ ...BARLOW }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div>
          <h2 style={{ color:C.white, fontSize:"1.4rem", fontWeight:600, ...TEKO, lineHeight:1 }}>Penalty Shootout</h2>
          <p style={{ color:C.gray, fontSize:"0.75rem" }}>Kick {kick} of 5 · Mouse Aim (Hold to charge power)</p>
        </div>
      </div>
      
      <div style={{ width: "100%", maxWidth: 800, margin: "0 auto", position: "relative", touchAction:"none" }}>
        <canvas 
          ref={canvasRef} 
          width={800} height={400} 
          style={{ width: "100%", height: "auto", borderRadius: 12, border: `2px solid ${C.border}`, cursor: "crosshair" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </div>

      <div style={{ marginTop:14 }}>
        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
          <span style={{ fontSize:"0.6rem", color:C.gray, ...MONO, letterSpacing:"0.2em" }}>SHOT POWER</span>
          <span style={{ fontSize:"0.72rem", fontWeight:700, color:power<35?"#22c55e":power<70?"#f59e0b":C.red, ...MONO }}>{Math.round(power)}%</span>
        </div>
        <div style={{ height:12, background:C.sapphireSm, borderRadius:6, overflow:"hidden", border:`1px solid ${C.border}` }}>
          <div style={{ height:"100%", width:`${power}%`, background:`linear-gradient(90deg, #22c55e, ${power<35?"#22c55e":power<70?"#f59e0b":C.red})`, borderRadius:6 }}/>
        </div>
      </div>
    </div>
  );
}


export function useGameLoop(updateFn: (dt: number) => void, drawFn: () => void, isRunning: boolean) {
  const requestRef = React.useRef<number>();
  const previousTimeRef = React.useRef<number>();

  React.useEffect(() => {
    if (!isRunning) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }
    const loop = (time: number) => {
      if (previousTimeRef.current != undefined) {
        let deltaTime = (time - previousTimeRef.current) / 1000;
        if (deltaTime > 0.1) deltaTime = 0.1; // cap
        updateFn(deltaTime);
        drawFn();
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(loop);
    };
    
    requestRef.current = requestAnimationFrame(loop);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [isRunning, updateFn, drawFn]);
}

export function BobbleheadArena({ C }: { C: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState({ left: 0, right: 0 });
  const [running, setRunning] = useState(false);
  const [goalMsg, setGoalMsg] = useState<{msg:string;side:"left"|"right"}|null>(null);
  
  const GRAVITY = 980;
  const FRICTION = 0.9;
  const JUMP_FORCE = -400;
  const GROUND_Y = 350;

  const gameState = useRef({
    player: { x: 100, y: GROUND_Y, vx: 0, vy: 0, radius: 30, isKicking: false, jumpTimer: 0 },
    ai: { x: 700, y: GROUND_Y, vx: 0, vy: 0, radius: 30, isKicking: false },
    ball: { x: 400, y: 150, vx: 0, vy: 0, radius: 15 }
  });

  const keys = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const onKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const resolveCollision = (entity: any, ball: any) => {
    const dx = ball.x - entity.x;
    const dy = ball.y - entity.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = entity.radius + ball.radius;

    if (distance < minDistance) {
      const nx = dx / distance;
      const ny = dy / distance;

      const overlap = minDistance - distance;
      ball.x += nx * overlap;
      ball.y += ny * overlap;

      const rvx = ball.vx - entity.vx;
      const rvy = ball.vy - entity.vy;
      
      const velAlongNormal = rvx * nx + rvy * ny;
      if (velAlongNormal > 0) return;

      const e = 0.8; 
      const j = -(1 + e) * velAlongNormal;

      ball.vx += nx * j;
      ball.vy += ny * j;
      
      if (entity.isKicking) {
         ball.vx += nx * 400; 
         ball.vy -= 300;      
      }
    }
  };

  const updateAI = (ai: any, ball: any) => {
    const diffX = ball.x - ai.x;
    
    if (Math.abs(diffX) > 20) {
      ai.vx = diffX > 0 ? 250 : -250; 
    } else {
      ai.vx = 0;
    }

    if (ball.y < ai.y - 50 && Math.abs(diffX) < 80 && ai.y >= GROUND_Y - ai.radius) {
      ai.vy = JUMP_FORCE;
    }
    
    ai.isKicking = (diffX < 70 && diffX > 0 && ball.y > ai.y - 20);
  };

  const updatePhysics = (dt: number) => {
    const { player, ai, ball } = gameState.current;

    player.vx = 0;
    if (keys.current['ArrowLeft'] || keys.current['a']) player.vx = -300;
    if (keys.current['ArrowRight'] || keys.current['d']) player.vx = 300;
    if ((keys.current['ArrowUp'] || keys.current['w']) && player.y >= GROUND_Y - player.radius) {
      player.vy = JUMP_FORCE;
    }
    player.isKicking = !!(keys.current[' ']);

    player.vy += GRAVITY * dt;
    ai.vy += GRAVITY * dt;
    ball.vy += GRAVITY * dt;

    player.x += player.vx * dt;
    player.y += player.vy * dt;
    ai.x += ai.vx * dt;
    ai.y += ai.vy * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    
    [player, ai].forEach(entity => {
      if (entity.y + entity.radius >= GROUND_Y) {
        entity.y = GROUND_Y - entity.radius;
        entity.vy = 0;
      }
      if (entity.x - entity.radius < 0) entity.x = entity.radius;
      if (entity.x + entity.radius > 800) entity.x = 800 - entity.radius;
    });

    if (ball.y + ball.radius >= GROUND_Y) {
      ball.y = GROUND_Y - ball.radius;
      ball.vy *= -0.7; 
      ball.vx *= FRICTION; 
    }
    if (ball.x - ball.radius < 0) { ball.x = ball.radius; ball.vx *= -0.7; }
    if (ball.x + ball.radius > 800) { ball.x = 800 - ball.radius; ball.vx *= -0.7; }
    if (ball.y - ball.radius < 0) { ball.y = ball.radius; ball.vy *= -0.7; }

    resolveCollision(player, ball);
    resolveCollision(ai, ball);
    updateAI(ai, ball);

    // Goal conditions
    if (ball.y > GROUND_Y - 100) {
      if (ball.x < 30) {
        handleGoal("right");
      } else if (ball.x > 770) {
        handleGoal("left");
      }
    }
  };

  const handleGoal = (side: "left" | "right") => {
    setRunning(false);
    setGoalMsg({ msg: `GOAL! ${side.toUpperCase()} SCORES!`, side });
    setScore(s => {
      const newScore = { ...s, [side]: s[side] + 1 };
      if (newScore.left >= 5 || newScore.right >= 5) {
        if (newScore.left >= 5) handleGameWin("Bobblehead");
        else alert("AI Won Bobblehead!");
      } else {
        setTimeout(() => {
          resetPositions();
          setGoalMsg(null);
          setRunning(true);
        }, 1500);
      }
      return newScore;
    });
  };

  const resetPositions = () => {
    gameState.current = {
      player: { x: 100, y: GROUND_Y, vx: 0, vy: 0, radius: 30, isKicking: false, jumpTimer: 0 },
      ai: { x: 700, y: GROUND_Y, vx: 0, vy: 0, radius: 30, isKicking: false },
      ball: { x: 400, y: 150, vx: 0, vy: 0, radius: 15 }
    };
  };

  const draw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, 800, 400);
    
    // Draw pitch background
    ctx.fillStyle = '#267026';
    ctx.fillRect(0, 0, 800, 400);
    ctx.fillStyle = '#2d8c2d';
    for (let i=0; i<800; i+=80) ctx.fillRect(i, 0, 40, 400);

    // Goals
    ctx.fillStyle = 'rgba(30,80,200,0.5)';
    ctx.fillRect(0, GROUND_Y - 120, 30, 120);
    ctx.fillStyle = 'rgba(200,30,30,0.5)';
    ctx.fillRect(770, GROUND_Y - 120, 30, 120);

    const { player, ai, ball } = gameState.current;

    // Player
    ctx.beginPath(); ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = player.isKicking ? '#3b82f6' : '#1d4ed8'; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

    // AI
    ctx.beginPath(); ctx.arc(ai.x, ai.y, ai.radius, 0, Math.PI * 2);
    ctx.fillStyle = ai.isKicking ? '#ef4444' : '#b91c1c'; ctx.fill();
    ctx.stroke();

    // Ball
    ctx.beginPath(); ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();
    
    // Ground line
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(800, GROUND_Y);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke();
  };

  useGameLoop(updatePhysics, draw, running);

  // Initial draw
  useEffect(() => { draw(); }, []);

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
        <div>
          <h2 style={{ color:C.white, fontSize:"1.4rem", fontWeight:600, fontFamily:"'Teko', sans-serif", lineHeight:1 }}>Bobblehead Arena</h2>
          <p style={{ color:C.gray, fontSize:"0.75rem" }}>WASD to move, Space to kick</p>
        </div>
        <button onClick={() => {
          resetPositions();
          setScore({left:0, right:0});
          setGoalMsg(null);
          setRunning(true);
        }} style={{ background:C.sapphireSm, border:`1px solid ${C.border}`, borderRadius:8, padding:"5px 10px", color:C.gray, cursor:"pointer", fontSize:"0.75rem", display:'flex', alignItems:'center', gap:4 }}>
          <RotateCcw size={13}/>{running ? "Reset" : "Start"}
        </button>
      </div>

      <div style={{ display:"flex", justifyContent:"center", gap:20, marginBottom:12 }}>
        <div style={{ textAlign:"center" }}><div style={{ fontSize:"2.5rem", fontWeight:900, color:C.sapphire, fontFamily:"'Teko', sans-serif", lineHeight:1 }}>{score.left}</div><div style={{ fontSize:"0.6rem", color:C.gray, fontFamily:"monospace" }}>YOU</div></div>
        <div style={{ color:C.gray, fontSize:"1.5rem", display:"flex", alignItems:"center" }}>–</div>
        <div style={{ textAlign:"center" }}><div style={{ fontSize:"2.5rem", fontWeight:900, color:C.red, fontFamily:"'Teko', sans-serif", lineHeight:1 }}>{score.right}</div><div style={{ fontSize:"0.6rem", color:C.gray, fontFamily:"monospace" }}>AI</div></div>
      </div>

      <div style={{ position:"relative", width:"100%", borderRadius:12, overflow:"hidden", border:`2px solid #2d8c2d` }}>
        <canvas ref={canvasRef} width={800} height={400} style={{ width:"100%", display:"block" }} />
        {goalMsg && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.7)" }}>
            <div style={{ fontSize:"4rem", color: goalMsg.side==="left" ? C.sapphire : C.red, fontFamily:"'Teko', sans-serif", fontWeight:"bold" }}>
              {goalMsg.msg}
            </div>
          </div>
        )}
        {!running && !goalMsg && (
          <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.5)" }}>
            <div style={{ fontSize:"2rem", color:"white", fontFamily:"'Teko', sans-serif" }}>Press Start to Play</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function PongSoccer({ C, onAddXP }: { C: any, onAddXP?: (amt:number)=>void }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = React.useState(false);
  const [score, setScore] = React.useState({ p1: 0, p2: 0 });
  const [mode, setMode] = React.useState<"single"|"double">("single");

  const sRef = React.useRef({
    ball: { x: 400, y: 200, vx: 300, vy: 300 },
    p1: { y: 150 },
    p2: { y: 150 },
    keys: { w: false, s: false, up: false, down: false }
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w') sRef.current.keys.w = true;
      if (k === 's') sRef.current.keys.s = true;
      if (e.key === 'ArrowUp') sRef.current.keys.up = true;
      if (e.key === 'ArrowDown') sRef.current.keys.down = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w') sRef.current.keys.w = false;
      if (k === 's') sRef.current.keys.s = false;
      if (e.key === 'ArrowUp') sRef.current.keys.up = false;
      if (e.key === 'ArrowDown') sRef.current.keys.down = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !running) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      const s = sRef.current;

      if (mode === "double") {
        if (s.keys.w) s.p1.y = Math.max(0, s.p1.y - 400 * dt);
        if (s.keys.s) s.p1.y = Math.min(300, s.p1.y + 400 * dt);
        if (s.keys.up) s.p2.y = Math.max(0, s.p2.y - 400 * dt);
        if (s.keys.down) s.p2.y = Math.min(300, s.p2.y + 400 * dt);
      }

      // Physics
      s.ball.x += s.ball.vx * dt;
      s.ball.y += s.ball.vy * dt;

      // Bounce top/bottom
      if (s.ball.y <= 10 || s.ball.y >= 390) {
        s.ball.vy *= -1;
      }

      // Goal
      if (s.ball.x < 0) {
        setScore(sc => {
          const newP2 = sc.p2 + 1;
          if (newP2 >= 10) setRunning(false);
          return { ...sc, p2: newP2 };
        });
        s.ball = { x: 400, y: 200, vx: 300, vy: (Math.random() - 0.5) * 400 };
      } else if (s.ball.x > 800) {
        setScore(sc => {
          const newP1 = sc.p1 + 1;
          if (newP1 >= 10) {
            setRunning(false);
            if (onAddXP) {
              const today = new Date().toDateString();
              const limitKey = `pong_xp_limit_${today}`;
              const currentDailyXP = parseInt(localStorage.getItem(limitKey) || '0');
              if (currentDailyXP < 1000) {
                const xpToGive = Math.min(100, 1000 - currentDailyXP);
                localStorage.setItem(limitKey, (currentDailyXP + xpToGive).toString());
                onAddXP(xpToGive);
              }
            }
          }
          return { ...sc, p1: newP1 };
        });
        s.ball = { x: 400, y: 200, vx: -300, vy: (Math.random() - 0.5) * 400 };
      }

      // Paddles
      const p1Rect = { x: 20, y: s.p1.y, w: 15, h: 100 };
      const p2Rect = { x: 765, y: s.p2.y, w: 15, h: 100 };

      if (s.ball.x - 10 < p1Rect.x + p1Rect.w && s.ball.x + 10 > p1Rect.x && s.ball.y > p1Rect.y && s.ball.y < p1Rect.y + p1Rect.h) {
        s.ball.vx = Math.abs(s.ball.vx) * 1.05;
        s.ball.x = p1Rect.x + p1Rect.w + 10;
        s.ball.vy += (s.ball.y - (p1Rect.y + p1Rect.h/2)) * 4;
      }
      
      if (s.ball.x + 10 > p2Rect.x && s.ball.x - 10 < p2Rect.x + p2Rect.w && s.ball.y > p2Rect.y && s.ball.y < p2Rect.y + p2Rect.h) {
        s.ball.vx = -Math.abs(s.ball.vx) * 1.05;
        s.ball.x = p2Rect.x - 10;
        s.ball.vy += (s.ball.y - (p2Rect.y + p2Rect.h/2)) * 4;
      }

      // AI
      if (mode === "single") {
        if (s.ball.y > s.p2.y + 50) s.p2.y += 250 * dt;
        if (s.ball.y < s.p2.y + 50) s.p2.y -= 250 * dt;
        s.p2.y = Math.max(0, Math.min(300, s.p2.y));
      }

      // Draw
      ctx.fillStyle = "#101726";
      ctx.fillRect(0, 0, 800, 400);

      ctx.strokeStyle = "rgba(255,255,255,0.1)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(400, 0); ctx.lineTo(400, 400); ctx.stroke();
      ctx.beginPath(); ctx.arc(400, 200, 50, 0, Math.PI*2); ctx.stroke();

      ctx.fillStyle = C.red;
      ctx.fillRect(p1Rect.x, p1Rect.y, p1Rect.w, p1Rect.h);
      ctx.fillStyle = C.green;
      ctx.fillRect(p2Rect.x, p2Rect.y, p2Rect.w, p2Rect.h);

      ctx.fillStyle = "white";
      ctx.beginPath(); ctx.arc(s.ball.x, s.ball.y, 10, 0, Math.PI*2); ctx.fill();

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationId);
  }, [running, mode]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (mode === "double") return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const y = ((e.clientY - rect.top) / rect.height) * 400;
    const x = ((e.clientX - rect.left) / rect.width) * 800;
    sRef.current.p1.y = Math.min(300, Math.max(0, y - 50));
  };

  const TEKO: React.CSSProperties = { fontFamily: "'Teko', sans-serif" };
  const MONO: React.CSSProperties = { fontFamily: "'Space Mono', monospace" };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-full flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h2 style={{ color:C.white, fontSize:"1.4rem", fontWeight:600, ...TEKO, lineHeight:1 }}>Pong Soccer</h2>
          <div className="flex items-center gap-1 bg-black/30 rounded-full p-1">
            <button onClick={() => setMode("single")} className="px-2 py-0.5 rounded-full text-[10px] uppercase transition-colors" style={{ ...MONO, background: mode==="single"?C.red:"transparent", color: mode==="single"?C.white:C.gray }}>1P</button>
            <button onClick={() => setMode("double")} className="px-2 py-0.5 rounded-full text-[10px] uppercase transition-colors" style={{ ...MONO, background: mode==="double"?C.red:"transparent", color: mode==="double"?C.white:C.gray }}>2P</button>
          </div>
        </div>
        <div className="flex items-center gap-4" style={{ ...TEKO, fontSize: "1.8rem", fontWeight: 600, color: C.white }}>
          <span style={{ color: C.red }}>{score.p1}</span>
          <span style={{ color: C.gray }}>-</span>
          <span style={{ color: C.green }}>{score.p2}</span>
        </div>
      </div>
      
      <div className="relative rounded-xl overflow-hidden shadow-2xl" style={{ border: `1px solid ${C.borderSub}` }}>
        <canvas 
          ref={canvasRef} 
          width={800} height={400} 
          onPointerMove={handlePointerMove}
          style={{ width: "100%", maxWidth: 800, aspectRatio: "2/1", touchAction: "none", cursor: mode==="single"?"crosshair":"default" }} 
        />
        {!running && (score.p1 >= 10 || score.p2 >= 10) ? (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center backdrop-blur-md">
            <div style={{ fontSize:"4rem", color:"white", ...TEKO, fontWeight:"bold" }}>
              {score.p1 >= 10 ? "YOU WIN!" : "AI WINS!"}
            </div>
            {score.p1 >= 10 && (
              <div className="text-green-400 font-bold mb-6 flex items-center gap-2" style={BARLOW}>
                <span className="text-2xl">+100 XP</span>
                <span className="text-sm opacity-70">(Daily limit: 1000 XP)</span>
              </div>
            )}
            <button 
              onClick={() => {
                setScore({ p1:0, p2:0 });
                setRunning(true);
              }}
              className="px-6 py-3 rounded-full text-white font-bold tracking-wider transition-transform hover:scale-105 active:scale-95 shadow-lg mt-4"
              style={{ background: C.red, ...TEKO, fontSize: "1.5rem" }}
            >
              PLAY AGAIN
            </button>
          </div>
        ) : !running ? (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
            <button 
              onClick={() => setRunning(true)}
              className="px-6 py-3 rounded-full text-white font-bold tracking-wider transition-transform hover:scale-105 active:scale-95 shadow-lg"
              style={{ background: C.red, ...TEKO, fontSize: "1.5rem" }}
            >
              START MATCH
            </button>
          </div>
        ) : null}
      </div>
      {mode === "double" && (
        <div className="text-[10px] text-center opacity-60" style={{ ...MONO, color: C.gray }}>
          <span className="text-red-400">P1 (Left):</span> W/S keys &nbsp;|&nbsp; <span className="text-green-400">P2 (Right):</span> Up/Down arrows
        </div>
      )}
    </div>
  );
}


