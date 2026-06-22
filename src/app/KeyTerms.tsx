import React, { useState } from 'react';
import { ArrowLeft, Flag, ShieldAlert, Scale, Square, Activity, Clock, Shield, Star, Zap, CornerUpLeft, PlayCircle } from 'lucide-react';
import { Pitch3D } from './components/Pitch3D';
import tacticsData from '../data/tactics.json';

// Common visual tokens
const C = {
  bg: "#040613",
  sapphireDk: "#0d1033",
  sapphireSm: "#1b2152",
  sapphire: "#28327a",
  borderSub: "rgba(255,255,255,0.06)",
  white: "#f8f9fa",
  gray: "#8899bb",
  red: "#ef4444",
  yellow: "#facc15"
};

const TEKO = { fontFamily: "'Teko', sans-serif" };
const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const BARLOW = { fontFamily: "'Barlow', sans-serif" };

const TERMS = [
  {
    id: "offside",
    title: "Offside Rule",
    icon: <Flag size={20} color={C.white} />,
    color: "#3b82f6",
    summary: "A player is offside if they are nearer to the opponents' goal line than both the ball and the second-last opponent when the ball is played to them.",
    explanation: "The offside rule prevents players from 'cherry-picking' near the opponent's goal. It is judged at the exact moment a teammate plays the ball. If any part of the attacking player's head, body, or feet is nearer to the opponents' goal line than both the ball and the second-last opponent (usually the last defender, as the goalkeeper is typically the last), they are in an offside position.",
    pitchConfig: {
      players: [
        { id: "p1", position: [40, 50] as [number, number], team: 'home' as const, number: "8", name: "Passer" },
        { id: "p2", position: [80, 70] as [number, number], team: 'home' as const, number: "9", name: "Offside" },
        { id: "d1", position: [70, 50] as [number, number], team: 'away' as const, number: "4", name: "Def" },
        { id: "d2", position: [75, 80] as [number, number], team: 'away' as const, number: "5", name: "Def" },
        { id: "gk", position: [98, 50] as [number, number], team: 'away' as const, number: "1", name: "GK" }
      ],
      showBall: true,
      ballPosition: [42, 50] as [number, number],
      lines: [
        { start: [70, 0] as [number, number], end: [70, 100] as [number, number], color: "#ef4444", dashed: true },
        { start: [42, 50] as [number, number], end: [80, 70] as [number, number], color: "#ffffff", dashed: true }
      ]
    }
  },
  {
    id: "penalty",
    title: "Penalty Kick",
    icon: <ShieldAlert size={20} color={C.white} />,
    color: "#f97316",
    summary: "Awarded if a player commits a direct free kick offence inside their penalty area.",
    explanation: "A penalty kick is awarded when a defending player commits a foul inside their own penalty box. The ball is placed on the penalty mark (12 yards from the goal). All players except the kicker and the opposing goalkeeper must remain outside the penalty area and the penalty arc until the ball is kicked.",
    pitchConfig: {
      players: [
        { id: "p1", position: [88.5, 50] as [number, number], team: 'home' as const, number: "10", name: "Kicker" },
        { id: "gk", position: [98, 50] as [number, number], team: 'away' as const, number: "1", name: "GK" },
        { id: "p2", position: [75, 30] as [number, number], team: 'home' as const, number: "8" },
        { id: "p3", position: [75, 70] as [number, number], team: 'home' as const, number: "9" },
        { id: "d1", position: [75, 40] as [number, number], team: 'away' as const, number: "4" },
        { id: "d2", position: [75, 60] as [number, number], team: 'away' as const, number: "5" }
      ],
      showBall: true,
      ballPosition: [88.5, 52] as [number, number],
      lines: []
    }
  },
  {
    id: "var",
    title: "V.A.R. (Video Assistant)",
    icon: <Scale size={20} color={C.white} />,
    color: "#8b5cf6",
    summary: "A match official who reviews decisions made by the head referee using video footage.",
    explanation: "VAR is used for four types of game-changing incidents: Goals, Penalty decisions, Direct red cards, and Mistaken identity. The VAR constantly monitors the match but only intervenes if there is a 'clear and obvious error'.",
    pitchConfig: {
      players: [
        { id: "ref", position: [50, 20] as [number, number], team: 'away' as const, number: "Ref", name: "Reviewing" },
        { id: "p1", position: [55, 30] as [number, number], team: 'home' as const, number: "10" },
        { id: "p2", position: [45, 30] as [number, number], team: 'home' as const, number: "8" }
      ],
      showBall: false,
      lines: []
    }
  },
  {
    id: "cards",
    title: "Yellow & Red Cards",
    icon: <Square size={20} color={C.white} />,
    color: "#eab308",
    summary: "Disciplinary sanctions: Yellow for a caution, Red for a dismissal.",
    explanation: "A yellow card is a caution given for offenses like unsporting behavior, dissent, or delaying the restart of play. Two yellow cards result in a red card. A straight red card is given for serious foul play, violent conduct, or denying an obvious goal-scoring opportunity (DOGSO).",
    pitchConfig: {
      players: [
        { id: "ref", position: [50, 50] as [number, number], team: 'away' as const, number: "Ref", name: "Booking" },
        { id: "p1", position: [47, 50] as [number, number], team: 'home' as const, number: "4", name: "Fouler" },
        { id: "p2", position: [53, 50] as [number, number], team: 'away' as const, number: "9", name: "Fouled" }
      ],
      showBall: false,
      lines: []
    }
  },
  {
    id: "freekick",
    title: "Free Kick",
    icon: <Activity size={20} color={C.white} />,
    color: "#0ea5e9",
    summary: "A method of restarting play following a foul.",
    explanation: "There are two types: Direct (a goal can be scored directly against the opposing team) and Indirect (the ball must touch another player before a goal can be scored). The opposing team must form a wall at least 10 yards (9.15m) away.",
    pitchConfig: {
      players: [
        { id: "p1", position: [75, 45] as [number, number], team: 'home' as const, number: "7", name: "Kicker" },
        { id: "w1", position: [85, 42] as [number, number], team: 'away' as const, number: "4", name: "Wall" },
        { id: "w2", position: [85, 45] as [number, number], team: 'away' as const, number: "5", name: "Wall" },
        { id: "w3", position: [85, 48] as [number, number], team: 'away' as const, number: "6", name: "Wall" },
        { id: "gk", position: [98, 50] as [number, number], team: 'away' as const, number: "1", name: "GK" }
      ],
      showBall: true,
      ballPosition: [76, 45] as [number, number],
      lines: [
        { start: [75, 45] as [number, number], end: [98, 48] as [number, number], color: "#ffffff", dashed: true }
      ]
    }
  },
  {
    id: "corner",
    title: "Corner Kick",
    icon: <CornerUpLeft size={20} color={C.white} />,
    color: "#22c55e",
    summary: "Awarded when the whole of the ball passes over the goal line, having last touched a defending player.",
    explanation: "The attacking team restarts play by kicking the ball from the corner arc nearest to where it crossed the goal line. A goal may be scored directly from a corner kick.",
    pitchConfig: {
      players: [
        { id: "kicker", position: [100, 0] as [number, number], team: 'home' as const, number: "11", name: "Kicker" },
        { id: "box1", position: [92, 45] as [number, number], team: 'home' as const, number: "9" },
        { id: "box2", position: [94, 50] as [number, number], team: 'away' as const, number: "4" },
        { id: "gk", position: [98, 50] as [number, number], team: 'away' as const, number: "1", name: "GK" }
      ],
      showBall: true,
      ballPosition: [99, 1] as [number, number],
      lines: [
        { start: [100, 0] as [number, number], end: [92, 45] as [number, number], color: "#ffffff", dashed: true }
      ]
    }
  },
  {
    id: "throwin",
    title: "Throw-in",
    icon: <PlayCircle size={20} color={C.white} />,
    color: "#ec4899",
    summary: "A method of restarting play when the ball goes out over the touchline.",
    explanation: "Awarded to the opponents of the player who last touched the ball. The thrower must face the field, have part of each foot on or behind the touchline, and use both hands to throw the ball from behind and over the head.",
    pitchConfig: {
      players: [
        { id: "t", position: [50, 0] as [number, number], team: 'home' as const, number: "2", name: "Thrower" },
        { id: "r", position: [50, 15] as [number, number], team: 'home' as const, number: "8", name: "Receiver" },
        { id: "d", position: [48, 15] as [number, number], team: 'away' as const, number: "6" }
      ],
      showBall: true,
      ballPosition: [50, 2] as [number, number],
      lines: [
        { start: [50, 0] as [number, number], end: [50, 15] as [number, number], color: "#ffffff", dashed: true }
      ]
    }
  },
  {
    id: "advantage",
    title: "Advantage Rule",
    icon: <Zap size={20} color={C.white} />,
    color: "#14b8a6",
    summary: "The referee allows play to continue when the team against which an offense has been committed will benefit.",
    explanation: "If stopping play for a foul would hurt the attacking team more than helping them (e.g., they are still in a great position to score), the referee will signal 'advantage' with both arms extended and let the game flow.",
    pitchConfig: {
      players: [
        { id: "ref", position: [40, 50] as [number, number], team: 'away' as const, number: "Ref", name: "Signal" },
        { id: "att", position: [60, 50] as [number, number], team: 'home' as const, number: "9", name: "Attacker" },
        { id: "def", position: [58, 48] as [number, number], team: 'away' as const, number: "4", name: "Foul" }
      ],
      showBall: true,
      ballPosition: [62, 50] as [number, number],
      lines: [
        { start: [62, 50] as [number, number], end: [80, 50] as [number, number], color: "#14b8a6", dashed: true }
      ]
    }
  },
  {
    id: "extratime",
    title: "Stoppage vs Extra Time",
    icon: <Clock size={20} color={C.white} />,
    color: "#f43f5e",
    summary: "Additional time added to the game.",
    explanation: "Stoppage Time (Injury Time) is added at the end of each 45-minute half to compensate for time lost to injuries, substitutions, or VAR. Extra Time is an additional 30 minutes (two 15-minute halves) played in knockout matches if the score is tied after 90 minutes.",
    pitchConfig: {
      players: [
        { id: "ref", position: [50, 0] as [number, number], team: 'away' as const, number: "4th", name: "Board: +5" }
      ],
      showBall: false,
      lines: []
    }
  },
  {
    id: "cleansheet",
    title: "Clean Sheet",
    icon: <Shield size={20} color={C.white} />,
    color: "#84cc16",
    summary: "When a team or goalkeeper prevents the opponents from scoring any goals.",
    explanation: "Derived from the era when scorekeepers used physical sheets of paper; if a team conceded no goals, their opponent's section of the sheet remained clean. It is a major metric for defending quality.",
    pitchConfig: {
      players: [
        { id: "gk", position: [98, 50] as [number, number], team: 'home' as const, number: "1", name: "Hero" },
        { id: "def1", position: [85, 40] as [number, number], team: 'home' as const, number: "4" },
        { id: "def2", position: [85, 60] as [number, number], team: 'home' as const, number: "5" }
      ],
      showBall: false,
      lines: []
    }
  },
  {
    id: "hattrick",
    title: "Hat-trick",
    icon: <Star size={20} color={C.white} />,
    color: "#eab308",
    summary: "When a single player scores three goals in a single match.",
    explanation: "A 'perfect hat-trick' is a subset where the player scores one goal with their right foot, one with their left foot, and one with a header.",
    pitchConfig: {
      players: [
        { id: "striker", position: [80, 50] as [number, number], team: 'home' as const, number: "9", name: "3 Goals!" }
      ],
      showBall: true,
      ballPosition: [98, 50] as [number, number],
      lines: [
        { start: [80, 50] as [number, number], end: [98, 50] as [number, number], color: "#eab308", dashed: true }
      ]
    }
  }
];

export default function KeyTermsScreen({ onBack }: { onBack: () => void }) {
  const [activeTerm, setActiveTerm] = useState(TERMS[0]);
  const [dynamicPitch, setDynamicPitch] = useState(TERMS[0].pitchConfig);
  const [offsideText, setOffsideText] = useState("");

  // Animation Loop for Offside
  // Animation Loops for Key Terms
  React.useEffect(() => {
    const term = activeTerm.id;
    const animatedTerms = ['offside', 'penalty', 'freekick', 'corner', 'throwin'];
    if (!animatedTerms.includes(term)) {
      setDynamicPitch(activeTerm.pitchConfig);
      setOffsideText("");
      return;
    }
    
    let tick = 0;
    const baseConfig = activeTerm.pitchConfig;
    const interval = setInterval(() => {
      tick = (tick + 1) % 4; // 0, 1, 2, 3

      if (tick === 0) {
        // Reset
        setOffsideText("");
        setDynamicPitch(baseConfig);
      } else if (tick === 1) {
        // Action initiated
        if (term === 'offside') {
          setOffsideText("Pass played...");
          setDynamicPitch(prev => ({ ...prev, ballPosition: [60, 60] as [number, number] }));
        } else if (term === 'penalty') {
          setOffsideText("Run up...");
          setDynamicPitch(prev => ({ ...prev, 
            players: prev.players?.map(p => p.id === 'p1' ? { ...p, position: [88.5, 51] as [number, number] } : p)
          }));
        } else if (term === 'freekick') {
          setOffsideText("Ball struck...");
          setDynamicPitch(prev => ({ ...prev, ballPosition: [80, 47] as [number, number] })); // over wall
        } else if (term === 'corner') {
          setOffsideText("Cross delivered...");
          setDynamicPitch(prev => ({ ...prev, ballPosition: [96, 25] as [number, number] })); // mid air
        } else if (term === 'throwin') {
          setOffsideText("Ball thrown...");
          setDynamicPitch(prev => ({ ...prev, ballPosition: [50, 8] as [number, number] }));
        }
      } else if (tick === 2) {
        // Action received/finished
        if (term === 'offside') {
          setOffsideText("Offside! Player was ahead of the last defender.");
          setDynamicPitch(prev => ({ ...prev, ballPosition: [78, 70] as [number, number], lines: [...baseConfig.lines, { start: [80, 70] as [number, number], end: [70, 70] as [number, number], color: "#eab308", dashed: false }] }));
        } else if (term === 'penalty') {
          setOffsideText("Goal! Striker slots it in.");
          setDynamicPitch(prev => ({ ...prev, ballPosition: [98, 48] as [number, number],
            players: prev.players?.map(p => p.id === 'gk' ? { ...p, position: [98, 45] as [number, number] } : p) // gk dives
          }));
        } else if (term === 'freekick') {
          setOffsideText("Top corner! Perfect free kick.");
          setDynamicPitch(prev => ({ ...prev, ballPosition: [96, 52] as [number, number],
            players: prev.players?.map(p => p.id === 'gk' ? { ...p, position: [96, 48] as [number, number] } : p)
          }));
        } else if (term === 'corner') {
          setOffsideText("Header towards goal!");
          setDynamicPitch(prev => ({ ...prev, ballPosition: [94, 48] as [number, number],
            players: prev.players?.map(p => p.id === 'box1' ? { ...p, position: [94, 48] as [number, number] } : p)
          }));
        } else if (term === 'throwin') {
          setOffsideText("Received by teammate.");
          setDynamicPitch(prev => ({ ...prev, ballPosition: [50, 14] as [number, number] }));
        }
      } else if (tick === 3) {
        // Hold for reading
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeTerm]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg, ...BARLOW }}>
      <header className="sticky top-0 z-10 px-4 pt-4 pb-3 flex flex-col gap-3" style={{ background: `rgba(13,16,51,0.97)`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.borderSub}` }}>
        <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10" style={{ background: C.sapphireSm }}>
          <ArrowLeft size={16} color={C.white} />
        </button>
        <div>
          <h1 className="text-2xl text-white font-bold leading-none tracking-wide" style={{ ...TEKO }}>KEY TERMS</h1>
          <p className="text-[11px] mt-0.5" style={{ color: C.gray }}>Master the rules of the beautiful game</p>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row max-w-6xl mx-auto w-full p-4 gap-6">
        
        {/* Left Side: Term List & Details */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-2 max-h-[400px] lg:max-h-none overflow-y-auto pr-2" style={{scrollbarWidth:'thin'}}>
            {TERMS.map(term => {
              const isSel = term.id === activeTerm.id;
              return (
                <button 
                  key={term.id}
                  onClick={() => setActiveTerm(term)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl transition-all border text-center"
                  style={{
                    background: isSel ? `${term.color}22` : C.sapphireDk,
                    borderColor: isSel ? term.color : C.borderSub
                  }}
                >
                  <div className="mb-2 p-2 rounded-full" style={{ background: isSel ? term.color : C.sapphireSm }}>
                    {React.cloneElement(term.icon, { color: C.white, size: 16 })}
                  </div>
                  <span className="text-[11px] font-bold tracking-widest uppercase text-white" style={{ ...TEKO }}>{term.title}</span>
                </button>
              );
            })}
          </div>

          <div className="p-5 rounded-2xl border" style={{ background: C.sapphireDk, borderColor: C.borderSub }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl" style={{ background: activeTerm.color }}>
                {activeTerm.icon}
              </div>
              <h2 className="text-2xl font-bold text-white tracking-wide" style={{ ...TEKO }}>{activeTerm.title}</h2>
            </div>
            
            <p className="text-sm text-white mb-4 leading-relaxed font-medium">
              {activeTerm.summary}
            </p>
            
            <div className="h-[1px] w-full mb-4" style={{ background: C.borderSub }} />
            
            <p className="text-[13px] leading-relaxed" style={{ color: C.gray }}>
              {activeTerm.explanation}
            </p>
          </div>
        </div>

        {/* Right Side: 3D Visualization */}
        <div className="w-full lg:w-2/3 min-h-[400px] lg:min-h-0 rounded-2xl overflow-hidden border relative" style={{ background: '#0a1128', borderColor: C.borderSub }}>
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-widest text-white font-bold" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', ...TEKO }}>
            3D VISUALIZATION
          </div>
          <div className="absolute bottom-4 left-0 right-0 text-center z-10 text-[10px] text-white/50" style={MONO}>
            Drag to rotate • Scroll to zoom
          </div>
          {offsideText && (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl text-sm font-bold text-white text-center shadow-2xl transition-all" style={{ background: C.red, ...BARLOW, border: '2px solid white' }}>
              {offsideText}
            </div>
          )}
          <Pitch3D 
            key={activeTerm.id} // force remount when switching terms to reset camera
            players={dynamicPitch.players.map(p => ({ ...p, position: [p.position[1], p.position[0]] as [number, number] }))}
            showBall={dynamicPitch.showBall}
            ballPosition={dynamicPitch.ballPosition ? [dynamicPitch.ballPosition[1], dynamicPitch.ballPosition[0]] : undefined}
            lines={dynamicPitch.lines.map(l => ({ ...l, start: [l.start[1], l.start[0]] as [number, number], end: [l.end[1], l.end[0]] as [number, number] }))}
          />
        </div>

      </main>
    </div>
  );
}
