import React, { useState } from 'react';
import { ArrowLeft, LayoutTemplate, X, Crosshair, Shield, Activity } from 'lucide-react';
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

import philosophiesData from '../data/philosophies.json';

// We'll map icons dynamically if needed, but for now we can just use the colored box
// Or assign a default icon.
const getIcon = (id: string, color: string) => {
  if (id.includes('defend') || id.includes('park') || id.includes('catenaccio')) return <Shield size={20} color={C.white} />;
  if (id.includes('attack') || id.includes('gegen') || id.includes('tiki')) return <Activity size={20} color={C.white} />;
  return <Crosshair size={20} color={C.white} />;
};

const GLOBAL_TACTICS = philosophiesData.map(p => ({
  ...p,
  icon: getIcon(p.id, p.color)
}));

function generatePositions(title: string) {
  // Extract formation numbers like "4-3-3" from title e.g. "4-3-3 (Attacking)"
  const match = title.match(/^(\d(?:-\d)+)/);
  if (!match) return [];
  
  const layers = match[1].split('-').map(Number);
  const positions: {x: number, y: number}[] = [];
  
  // Goalkeeper
  positions.push({ x: 50, y: 90 });
  
  const totalLayers = layers.length;
  // Use y-range from 75 (defense) to 15 (attack)
  const ySpacing = totalLayers > 1 ? 60 / (totalLayers - 1) : 0;
  
  layers.forEach((count, layerIndex) => {
    const y = 75 - (layerIndex * ySpacing);
    const xSpacing = count > 1 ? 80 / (count - 1) : 0;
    const startX = count > 1 ? 10 : 50;
    
    for (let i = 0; i < count; i++) {
      const x = count === 1 ? 50 : startX + (i * xSpacing);
      positions.push({ x, y });
    }
  });
  
  return positions;
}

function Pitch2D({ title }: { title: string }) {
  const positions = generatePositions(title);
  
  return (
    <div className="relative w-full aspect-[2/3] max-h-48 rounded-xl overflow-hidden mt-4" style={{ background: "#0A2E16", border: `2px solid rgba(255,255,255,0.2)` }}>
      {/* Field markings */}
      <div className="absolute inset-x-0 top-1/2 h-0 border-t-2 border-white/20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full border-2 border-white/20" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[20%] border-2 border-b-0 border-white/20" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-[20%] border-2 border-t-0 border-white/20" />
      
      {/* Players */}
      {positions.map((pos, idx) => (
        <div key={idx} className="absolute w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)] -translate-x-1/2 -translate-y-1/2 transition-all duration-500" style={{ left: `${pos.x}%`, top: `${pos.y}%` }} />
      ))}
    </div>
  );
}

export default function FormationsScreen({ onBack }: { onBack: () => void }) {
  const [selectedTactic, setSelectedTactic] = useState<any | null>(null);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.bg, ...BARLOW }}>
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 flex flex-col gap-3" style={{ background: `rgba(13,16,51,0.97)`, backdropFilter: "blur(12px)", borderBottom: `1px solid ${C.borderSub}` }}>
        <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10" style={{ background: C.sapphireSm }}>
          <ArrowLeft size={16} color={C.white} />
        </button>
        <div>
          <h1 className="text-2xl text-white font-bold leading-none tracking-wide" style={{ ...TEKO }}>FORMATIONS & TACTICS</h1>
          <p className="text-[11px] mt-0.5" style={{ color: C.gray }}>Explore team shapes and strategic approaches</p>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 pb-20">
        <div className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: C.yellow, ...MONO }}>Formations</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {tacticsData.map((tactic) => (
            <div key={tactic.id} onClick={() => setSelectedTactic(tactic)} className="rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]" style={{ background: C.sapphireDk, border: `1px solid ${C.borderSub}` }}>
              <div className="h-1 w-full" style={{ background: tactic.color || C.yellow }} />
              <div className="p-4 flex flex-col h-full">
                <h2 className="text-lg font-bold text-white tracking-wide mb-1" style={{ ...TEKO }}>{tactic.title}</h2>
                <p className="text-[11px] font-medium mb-3" style={{ color: C.gray }}>{tactic.summary}</p>
                <div className="mt-auto">
                  <Pitch2D title={tactic.title} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[10px] tracking-[0.3em] uppercase mb-4" style={{ color: C.red, ...MONO }}>Global Tactics</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {GLOBAL_TACTICS.map((tactic) => (
            <div key={tactic.id} onClick={() => setSelectedTactic(tactic)} className="rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]" style={{ background: C.sapphireDk, border: `1px solid ${C.borderSub}` }}>
              <div className="h-1.5 w-full" style={{ background: tactic.color }} />
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg" style={{ background: `${tactic.color}33` }}>
                    {tactic.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white tracking-wide" style={{ ...TEKO }}>{tactic.title}</h3>
                </div>
                <p className="text-xs" style={{ color: C.gray }}>{tactic.summary}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Tactic Detail Modal */}
      {selectedTactic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-lg rounded-2xl overflow-hidden flex flex-col shadow-2xl relative" style={{ background: C.sapphireSm, border: `1px solid ${C.borderSub}` }}>
            <div className="h-2 w-full" style={{ background: selectedTactic.color || C.yellow }} />
            <button onClick={() => setSelectedTactic(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 text-white hover:bg-black/60 transition-colors z-10">
              <X size={16} />
            </button>
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="flex items-center gap-3 mb-4 pr-8">
                {selectedTactic.icon ? (
                  <div className="p-2.5 rounded-xl" style={{ background: `${selectedTactic.color}33` }}>
                    {selectedTactic.icon}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl" style={{ background: selectedTactic.color || C.yellow }}>
                    <LayoutTemplate size={20} color={C.bg} />
                  </div>
                )}
                <h2 className="text-3xl font-bold text-white tracking-wide" style={{ ...TEKO }}>{selectedTactic.title}</h2>
              </div>
              
              <div className="text-sm font-bold tracking-wider mb-6 pb-4 border-b border-white/10 uppercase" style={{ color: selectedTactic.color || C.yellow, ...MONO }}>
                {selectedTactic.summary}
              </div>
              
              <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">
                {selectedTactic.explanation}
              </p>

              {!selectedTactic.icon && (
                <div className="mt-6 border-t border-white/10 pt-6">
                  <h4 className="text-xs uppercase tracking-widest mb-4" style={{ color: C.gray, ...MONO }}>Visual Layout</h4>
                  <Pitch2D title={selectedTactic.title} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
