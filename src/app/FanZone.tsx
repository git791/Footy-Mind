/**
 * FanZone.tsx — Pitch IQ Mini-Game Hub
 * Three interactive games: Group Predictor · Penalty Shootout · Bobblehead Arena
 */

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, RotateCcw, Trophy, Zap } from "lucide-react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import playerStanding from "@/imports/magnific_playful-cartoon-illustrat_jSC8vBuLD0.png";
import playerRunning from "@/imports/magnific_vibrant-cartoon-caricatur_0pNwPNFTfW.png";
import { getStandings, StandingEntry } from '../services/api-football';
import { PenaltyShootout, BobbleheadArena, PongSoccer } from './MiniGames';

const TEKO:   React.CSSProperties = { fontFamily:"'Teko',sans-serif" };
const BARLOW: React.CSSProperties = { fontFamily:"'Barlow',sans-serif" };
const MONO:   React.CSSProperties = { fontFamily:"'DM Mono',monospace" };
const IN: React.CSSProperties = { fontFamily:"'Inter','Barlow',sans-serif" };

/* ─── 48 WC 2026 Nations & Groups ──────────────────────────── */
const WC48_GROUPS: Record<string, {id:string, name:string, flag:string}[]> = {
  "A": [ {id:"mex",name:"Mexico",flag:"MX"}, {id:"rsa",name:"South Africa",flag:"ZA"}, {id:"kor",name:"South Korea",flag:"KR"}, {id:"cze",name:"Czechia",flag:"CZ"} ],
  "B": [ {id:"can",name:"Canada",flag:"CA"}, {id:"bih",name:"Bosnia",flag:"BA"}, {id:"qat",name:"Qatar",flag:"QA"}, {id:"swi",name:"Switzerland",flag:"CH"} ],
  "C": [ {id:"bra",name:"Brazil",flag:"BR"}, {id:"mor",name:"Morocco",flag:"MA"}, {id:"hai",name:"Haiti",flag:"HT"}, {id:"sco",name:"Scotland",flag:"GB-SCT"} ],
  "D": [ {id:"usa",name:"USA",flag:"US"}, {id:"par",name:"Paraguay",flag:"PY"}, {id:"aus",name:"Australia",flag:"AU"}, {id:"tur",name:"Türkiye",flag:"TR"} ],
  "E": [ {id:"ger",name:"Germany",flag:"DE"}, {id:"cur",name:"Curaçao",flag:"CW"}, {id:"civ",name:"Ivory Coast",flag:"CI"}, {id:"ecu",name:"Ecuador",flag:"EC"} ],
  "F": [ {id:"ned",name:"Netherlands",flag:"NL"}, {id:"jpn",name:"Japan",flag:"JP"}, {id:"swe",name:"Sweden",flag:"SE"}, {id:"tun",name:"Tunisia",flag:"TN"} ],
  "G": [ {id:"bel",name:"Belgium",flag:"BE"}, {id:"egy",name:"Egypt",flag:"EG"}, {id:"iri",name:"Iran",flag:"IR"}, {id:"nzl",name:"New Zealand",flag:"NZ"} ],
  "H": [ {id:"esp",name:"Spain",flag:"ES"}, {id:"cpv",name:"Cabo Verde",flag:"CV"}, {id:"sau",name:"Saudi Arabia",flag:"SA"}, {id:"uru",name:"Uruguay",flag:"UY"} ],
  "I": [ {id:"fra",name:"France",flag:"FR"}, {id:"sen",name:"Senegal",flag:"SN"}, {id:"nor",name:"Norway",flag:"NO"}, {id:"irq",name:"Iraq",flag:"IQ"} ],
  "J": [ {id:"arg",name:"Argentina",flag:"AR"}, {id:"alg",name:"Algeria",flag:"DZ"}, {id:"aut",name:"Austria",flag:"AT"}, {id:"jor",name:"Jordan",flag:"JO"} ],
  "K": [ {id:"por",name:"Portugal",flag:"PT"}, {id:"uzb",name:"Uzbekistan",flag:"UZ"}, {id:"col",name:"Colombia",flag:"CO"}, {id:"drc",name:"DR Congo",flag:"CD"} ],
  "L": [ {id:"eng",name:"England",flag:"GB-ENG"}, {id:"cro",name:"Croatia",flag:"HR"}, {id:"gha",name:"Ghana",flag:"GH"}, {id:"pan",name:"Panama",flag:"PA"} ],
};

function FlagImage({ code, size = "w40" }: { code: string; size?: string }) {
  const c = code.toLowerCase().replace("gb-eng","gb-eng").replace("gb-sct","gb-sct");
  return <img src={`https://flagcdn.com/${size}/${c}.png`} alt={code} style={{ width:20, borderRadius:2, objectFit:"cover" }} />;
}

/* ═══════════════════════════════════════════════════════════
   GAME 1: GROUP BRACKET PREDICTOR
══════════════════════════════════════════════════════════ */
function GroupPredictor({ C }: { C: any }) {
  const [predictions, setPredictions] = useState<Record<string, Record<string, number>>>({});
  const [showBracket, setShowBracket] = useState(false);
  const [bracketState, setBracketState] = useState<Record<string, any>>({});

  const handlePositionClick = (group: string, nationId: string, pos: number) => {
    setPredictions(prev => {
      const g = { ...(prev[group] || {}) };
      Object.keys(g).forEach(id => { if (g[id] === pos) delete g[id]; });
      g[nationId] = pos;
      return { ...prev, [group]: g };
    });
  };

  const isComplete = Object.keys(WC48_GROUPS).every(gk => {
    const p = predictions[gk] || {};
    return p && Object.values(p).includes(1) && Object.values(p).includes(2) && Object.values(p).includes(3);
  });

  const generateBracket = () => {
    if (!isComplete) return;
    const advancing: any[] = [];
    Object.keys(WC48_GROUPS).forEach(gk => {
      const p = predictions[gk] || {};
      const t1 = Object.keys(p).find(id => p[id] === 1);
      const t2 = Object.keys(p).find(id => p[id] === 2);
      const t3 = Object.keys(p).find(id => p[id] === 3);
      if(t1) advancing.push({...WC48_GROUPS[gk].find(t=>t.id===t1), pos:1, group:gk});
      if(t2) advancing.push({...WC48_GROUPS[gk].find(t=>t.id===t2), pos:2, group:gk});
      if(t3) advancing.push({...WC48_GROUPS[gk].find(t=>t.id===t3), pos:3, group:gk});
    });

    const top32 = advancing.filter(t => t.pos === 1 || t.pos === 2).concat(advancing.filter(t => t.pos === 3).slice(0, 8));
    
    // Initialize R32
    const initBracket: any = { r32: [], r16: Array(8).fill(null), qf: Array(4).fill(null), sf: Array(2).fill(null), final: Array(1).fill(null), winner: null };
    for(let i=0; i<16; i++) initBracket.r32.push([top32[i*2], top32[i*2+1]]);
    
    setBracketState(initBracket);
    setShowBracket(true);
  };

  const advanceTeam = (round: string, matchIdx: number, team: any) => {
    if(!team) return;
    setBracketState(prev => {
      const next = { ...prev };
      // Deep copy the arrays we are going to mutate
      if (next.r16) next.r16 = next.r16.map((m: any) => (m ? [...m] : [null, null]));
      if (next.qf) next.qf = next.qf.map((m: any) => (m ? [...m] : [null, null]));
      if (next.sf) next.sf = next.sf.map((m: any) => (m ? [...m] : [null, null]));
      if (next.final) next.final = next.final.map((m: any) => (m ? [...m] : [null, null]));

      if (round === 'r32') {
        if (!next.r16[Math.floor(matchIdx / 2)]) next.r16[Math.floor(matchIdx / 2)] = [null, null];
        next.r16[Math.floor(matchIdx / 2)][matchIdx % 2] = team;
      } else if (round === 'r16') {
        if (!next.qf[Math.floor(matchIdx / 2)]) next.qf[Math.floor(matchIdx / 2)] = [null, null];
        next.qf[Math.floor(matchIdx / 2)][matchIdx % 2] = team;
      } else if (round === 'qf') {
        if (!next.sf[Math.floor(matchIdx / 2)]) next.sf[Math.floor(matchIdx / 2)] = [null, null];
        next.sf[Math.floor(matchIdx / 2)][matchIdx % 2] = team;
      } else if (round === 'sf') {
        if (!next.final[0]) next.final[0] = [null, null];
        next.final[0][matchIdx] = team;
      } else if (round === 'final') {
        next.winner = team;
      }
      return next;
    });
  };

  const MatchBlock = ({ match, round, idx }: { match:any, round:string, idx:number }) => {
    if(!match) return <div style={{ height:64, background:C.sapphireSm, border:`1px dashed ${C.borderSub}`, borderRadius:6 }}/>;
    return (
      <div style={{ background:C.sapphireDk, border:`1px solid ${C.borderSub}`, borderRadius:6, padding:"8px", display:"flex", flexDirection:"column", gap:4, zIndex:2, position:"relative" }}>
        <button onClick={()=>advanceTeam(round, idx, match[0])} style={{ display:"flex", alignItems:"center", gap:8, background: "none", border: "none", cursor: match[0] ? "pointer" : "default", textAlign:"left" }}>
          {match[0] ? <><FlagImage code={match[0].flag} /> <span style={{ color:C.white, fontSize:"0.8rem", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{match[0].name}</span></> : <span style={{ color:C.gray, fontSize:"0.8rem" }}>TBD</span>}
        </button>
        <div style={{ height:1, background:C.borderSub, width:"100%" }}/>
        <button onClick={()=>advanceTeam(round, idx, match[1])} style={{ display:"flex", alignItems:"center", gap:8, background: "none", border: "none", cursor: match[1] ? "pointer" : "default", textAlign:"left" }}>
          {match[1] ? <><FlagImage code={match[1].flag} /> <span style={{ color:C.white, fontSize:"0.8rem", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{match[1].name}</span></> : <span style={{ color:C.gray, fontSize:"0.8rem" }}>TBD</span>}
        </button>
      </div>
    );
  };

  if (showBracket && bracketState.r32) {
    return (
      <div style={{ ...BARLOW, paddingBottom: 40, width:"100%", overflowX:"auto" }}>
        <div className="flex items-center justify-between mb-6 sticky left-0">
          <h2 style={{ color:C.white, fontSize:"1.6rem", fontWeight:600, ...TEKO }}>Knockout Predictor</h2>
          <button onClick={() => setShowBracket(false)} style={{ background:C.sapphireSm, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", color:C.gray, cursor:"pointer" }}>
            <ChevronLeft size={14} style={{ display:"inline", marginRight:4 }}/> Back
          </button>
        </div>
        
        <div style={{ display:"flex", gap:30, minWidth:1000, paddingTop:10, alignItems:"center" }}>
          {/* R32 */}
          <div style={{ display:"flex", flexDirection:"column", gap:16, width:160, flexShrink:0 }}>
            {bracketState.r32.map((m:any, i:number) => <MatchBlock key={i} match={m} round="r32" idx={i} />)}
          </div>
          {/* R16 */}
          <div style={{ display:"flex", flexDirection:"column", gap:108, width:160, flexShrink:0 }}>
            {bracketState.r16.map((m:any, i:number) => <MatchBlock key={i} match={m} round="r16" idx={i} />)}
          </div>
          {/* QF */}
          <div style={{ display:"flex", flexDirection:"column", gap:292, width:160, flexShrink:0 }}>
            {bracketState.qf.map((m:any, i:number) => <MatchBlock key={i} match={m} round="qf" idx={i} />)}
          </div>
          {/* SF */}
          <div style={{ display:"flex", flexDirection:"column", gap:660, width:160, flexShrink:0 }}>
            {bracketState.sf.map((m:any, i:number) => <MatchBlock key={i} match={m} round="sf" idx={i} />)}
          </div>
          {/* Final */}
          <div style={{ display:"flex", flexDirection:"column", gap:16, width:160, flexShrink:0 }}>
            <MatchBlock match={bracketState.final[0]} round="final" idx={0} />
            {bracketState.winner && (
              <div style={{ background:C.red, border:`1px solid ${C.border}`, borderRadius:6, padding:"12px", display:"flex", flexDirection:"column", alignItems:"center", gap:8, marginTop:40 }}>
                <Trophy size={32} color={C.white} />
                <span style={{ color:C.white, fontWeight:700, fontSize:"1.2rem", ...TEKO }}>WINNER</span>
                <FlagImage code={bracketState.winner.flag} size="w80" />
                <span style={{ color:C.white, fontSize:"1rem" }}>{bracketState.winner.name}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...BARLOW }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ color:C.white, fontSize:"1.4rem", fontWeight:600, ...TEKO }}>Group Bracket Predictor</h2>
          <p style={{ color:C.gray, fontSize:"0.78rem" }}>Select 1st, 2nd, and 3rd place for all 12 groups to unlock.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPredictions({})} style={{ background:C.sapphireSm, border:`1px solid ${C.border}`, borderRadius:8, padding:"6px 12px", color:C.gray, cursor:"pointer" }}>
            <RotateCcw size={14} style={{ display:"inline", marginRight:4 }}/>Reset
          </button>
          <button onClick={generateBracket} disabled={!isComplete} style={{ background:isComplete ? C.red : C.sapphireSm, border:`1px solid ${isComplete ? C.red : C.border}`, borderRadius:8, padding:"6px 12px", color:isComplete ? C.white : C.gray, cursor:isComplete ? "pointer" : "not-allowed", transition:"all 0.2s" }}>
            Generate R32
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
        {Object.entries(WC48_GROUPS).map(([gk, teams]) => {
          const p = predictions[gk] || {};
          return (
            <div key={gk} style={{ background:C.sapphireDk, border:`1px solid ${C.borderSub}`, borderRadius:10, overflow:"hidden" }}>
              <div style={{ background:C.sapphire, padding:"6px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${C.borderSub}` }}>
                <span style={{ color:C.white, fontWeight:700, fontSize:"0.82rem", letterSpacing:"0.1em", ...TEKO }}>GROUP {gk}</span>
              </div>
              <div style={{ padding:"8px 10px" }}>
                {teams.map(t => {
                  const myPos = p[t.id];
                  return (
                    <div key={t.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"5px 0", borderBottom:`1px solid ${C.border}33` }}>
                      <span style={{ display:"flex", alignItems:"center", gap:6, fontSize:"0.85rem", color:C.white, ...BARLOW }}>
                        <FlagImage code={t.flag} /><span>{t.name}</span>
                      </span>
                      <div style={{ display:"flex", gap:4 }}>
                        {[1, 2, 3].map(pos => (
                          <button key={pos} onClick={() => handlePositionClick(gk, t.id, pos)}
                            style={{ 
                              width:24, height:24, borderRadius:4, border:`1px solid ${myPos === pos ? C.red : C.borderSub}`,
                              background: myPos === pos ? `${C.red}33` : "transparent", color: myPos === pos ? C.white : C.gray,
                              fontSize:"0.7rem", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", transition:"all 0.1s"
                            }}>
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
/* ═══════════════════════════════════════════════════════════
   FAN ZONE SCREEN
══════════════════════════════════════════════════════════ */

const GAMES = [
  { id:0, icon:"🏆", label:"Group Predictor",  tagline:"Build your 2026 bracket" },
  { id:1, icon:"⚽", label:"Penalty Shootout",  tagline:"Beat the keeper · 5 kicks" },
  { id:2, icon:"🎮", label:"Bobblehead Arena",  tagline:"Arcade head-to-head" },
  { id:3, icon:'🕹️', label:'Pong Soccer',  tagline:'Classic paddle action' },
  
];

export default function FanZoneScreen({ onBack, theme, onAddXP }: { onBack: () => void, theme: { mode: "2026"|"2022", C: any }, onAddXP?: (amt:number)=>void }) {
  const [activeGame, setActiveGame] = useState(0);
  const C = theme.C;
  const is2022 = theme.mode === "2022";

  return (
    <div className="min-h-screen" style={{ background:C.bg, ...BARLOW }}>
      <header style={{ background:`rgba(13,16,51,0.96)`, backdropFilter:"blur(12px)", borderBottom:`1px solid ${C.borderSub}`, padding:"12px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <button onClick={onBack} style={{ width:32,height:32,borderRadius:"50%",background:"none",border:`1px solid ${C.border}`,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
            <ChevronLeft size={15} style={{ color:C.gray }}/>
          </button>
          <div>
            <div style={{ color:C.white, fontSize:"1.35rem", fontWeight:600, ...TEKO, lineHeight:1 }}>Fan Zone</div>
            <div style={{ color:C.gray, fontSize:"0.6rem", letterSpacing:"0.2em", ...MONO }}>
              {is2022 ? "QATAR 2022 LEGACY MINI-GAMES" : "PITCH IQ MINI-GAMES"}
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <Zap size={13} style={{ color:C.red }}/>
          <span style={{ color:C.red, fontSize:"0.68rem", fontWeight:700, ...MONO, letterSpacing:"0.1em" }}>4 GAMES</span>
        </div>
      </header>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, padding:"16px 16px 0" }}>
        {GAMES.map(g => (
          <button key={g.id} onClick={() => setActiveGame(g.id)}
            style={{ padding:"12px 8px", borderRadius:12, border:`1px solid ${activeGame===g.id ? C.red : C.borderSub}`,
              background:activeGame===g.id ? `${C.red}18` : C.sapphireDk,
              cursor:"pointer", textAlign:"center", transition:"all .15s" }}>
            <div style={{ fontSize:"1.6rem", marginBottom:4 }}>{g.icon}</div>
            <div style={{ color:activeGame===g.id ? C.white : C.gray, fontSize:"0.75rem", fontWeight:600, ...TEKO, letterSpacing:"0.04em", lineHeight:1.2 }}>{g.label}</div>
            <div style={{ color:`${C.gray}70`, fontSize:"0.6rem", marginTop:3, ...IN }}>{g.tagline}</div>
            {activeGame===g.id && (
              <div style={{ width:20,height:2,background:C.red,borderRadius:1,margin:"6px auto 0" }}/>
            )}
          </button>
        ))}
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"16px 16px 0" }}>
        <div style={{ flex:1, height:1, background:C.borderSub }}/>
        <span style={{ color:C.gray, fontSize:"0.6rem", letterSpacing:"0.2em", ...MONO }}>{GAMES[activeGame].label.toUpperCase()}</span>
        <div style={{ flex:1, height:1, background:C.borderSub }}/>
      </div>

      <main style={{ padding:16, paddingBottom:32 }}>
        {activeGame === 0 && <GroupPredictor C={C} />}
        {activeGame === 1 && <PenaltyShootout C={C} />}
        {activeGame === 2 && <BobbleheadArena C={C} />}
        {activeGame === 3 && <PongSoccer C={C} onAddXP={onAddXP} />}
        
      </main>
    </div>
  );
}

