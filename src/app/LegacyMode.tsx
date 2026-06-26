/**
 * FOOTY MIND — Qatar 2022 Legacy Mode
 * Historical data architecture modelled after StatsBomb Open Data schema
 * Competition ID: 43 · Season ID: 106
 */

import { useState } from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";
import { ChevronRight, Trophy, X } from "lucide-react";

/* ─── Palette ────────────────────────────────────────────── */
const L = {
  maroon:    "#56042C",
  maroonDk:  "#3d0220",
  maroonLt:  "#7a0640",
  gold:      "#FEC310",
  goldLt:    "#FFD766",
  blue:      "#1077C3",
  lightBlue: "#49BCE3",
  white:     "#FFFFFF",
  charcoal:  "#17171A",
  bg:        "#FAFAF8",
  surface:   "#FFFFFF",
  warm:      "#F5EFE6",
  border:    "#E8E0D6",
  borderDk:  "#C8BDB0",
  muted:     "#888888",
  green:     "#16a34a",
  red:       "#dc2626",
};

/* ─── Font shorthand styles ──────────────────────────────── */
const CI: React.CSSProperties = { fontFamily: "'Cinzel', serif" };
const IN: React.CSSProperties = { fontFamily: "'Inter', sans-serif" };
const MO: React.CSSProperties = { fontFamily: "'DM Mono', monospace" };

/* ─── Types ──────────────────────────────────────────────── */
type LScreen = "groups" | "bracket" | "match" | "awards" | "tactical";

interface GroupTeam {
  flag: string; name: string;
  mp: number; w: number; d: number; l: number;
  gf: number; ga: number; gd: number; pts: number;
  q?: boolean; // qualified
}
interface GroupData { group: string; teams: GroupTeam[]; tag?: string; }
interface BMatchData {
  t1: { flag: string; code: string; score: number | string };
  t2: { flag: string; code: string; score: number | string };
  winner: 1 | 2;
  note?: string;
  upset?: boolean;
  upsetLabel?: string;
}

/* ─── Group Stage Data ───────────────────────────────────── */
const GROUPS: GroupData[] = [
  { group:"A", tag:"Qatar — first host eliminated in the group stage", teams:[
    {flag:"🇳🇱",name:"Netherlands",  mp:3,w:2,d:1,l:0,gf:5, ga:1, gd:4,  pts:7,q:true},
    {flag:"🇸🇳",name:"Senegal",       mp:3,w:2,d:0,l:1,gf:5, ga:4, gd:1,  pts:6,q:true},
    {flag:"🇪🇨",name:"Ecuador",       mp:3,w:1,d:1,l:1,gf:4, ga:3, gd:1,  pts:4},
    {flag:"🇶🇦",name:"Qatar",         mp:3,w:0,d:0,l:3,gf:1, ga:7, gd:-6, pts:0},
  ]},
  { group:"B", teams:[
    {flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",name:"England",     mp:3,w:2,d:1,l:0,gf:9, ga:2, gd:7,  pts:7,q:true},
    {flag:"🇺🇸",name:"USA",           mp:3,w:1,d:2,l:0,gf:2, ga:1, gd:1,  pts:5,q:true},
    {flag:"🇮🇷",name:"Iran",          mp:3,w:1,d:0,l:2,gf:4, ga:7, gd:-3, pts:3},
    {flag:"🏴󠁧󠁢󠁷󠁬󠁳󠁿",name:"Wales",         mp:3,w:0,d:1,l:2,gf:1, ga:6, gd:-5, pts:1},
  ]},
  { group:"C", tag:"Saudi Arabia 2-1 Argentina — biggest upset in World Cup history", teams:[
    {flag:"🇦🇷",name:"Argentina",    mp:3,w:2,d:0,l:1,gf:5, ga:2, gd:3,  pts:6,q:true},
    {flag:"🇵🇱",name:"Poland",       mp:3,w:1,d:1,l:1,gf:2, ga:2, gd:0,  pts:4,q:true},
    {flag:"🇲🇽",name:"Mexico",       mp:3,w:1,d:1,l:1,gf:2, ga:3, gd:-1, pts:4},
    {flag:"🇸🇦",name:"Saudi Arabia", mp:3,w:1,d:0,l:2,gf:3, ga:5, gd:-2, pts:3},
  ]},
  { group:"D", tag:"Australia qualify from Group D for second straight World Cup", teams:[
    {flag:"🇫🇷",name:"France",       mp:3,w:2,d:0,l:1,gf:6, ga:2, gd:4,  pts:6,q:true},
    {flag:"🇦🇺",name:"Australia",    mp:3,w:2,d:0,l:1,gf:3, ga:4, gd:-1, pts:6,q:true},
    {flag:"🇹🇳",name:"Tunisia",      mp:3,w:1,d:0,l:2,gf:1, ga:2, gd:-1, pts:3},
    {flag:"🇩🇰",name:"Denmark",      mp:3,w:0,d:1,l:2,gf:1, ga:3, gd:-2, pts:1},
  ]},
  { group:"E", tag:"Germany exit in group stage for the second consecutive World Cup", teams:[
    {flag:"🇯🇵",name:"Japan",        mp:3,w:2,d:0,l:1,gf:4, ga:3, gd:1,  pts:6,q:true},
    {flag:"🇪🇸",name:"Spain",        mp:3,w:1,d:1,l:1,gf:9, ga:3, gd:6,  pts:4,q:true},
    {flag:"🇩🇪",name:"Germany",      mp:3,w:1,d:1,l:1,gf:6, ga:5, gd:1,  pts:4},
    {flag:"🇨🇷",name:"Costa Rica",   mp:3,w:1,d:0,l:2,gf:3, ga:11,gd:-8, pts:3},
  ]},
  { group:"F", tag:"Belgium's golden generation bows out — Morocco top the group", teams:[
    {flag:"🇲🇦",name:"Morocco",      mp:3,w:2,d:1,l:0,gf:4, ga:1, gd:3,  pts:7,q:true},
    {flag:"🇭🇷",name:"Croatia",      mp:3,w:1,d:2,l:0,gf:4, ga:1, gd:3,  pts:5,q:true},
    {flag:"🇧🇪",name:"Belgium",      mp:3,w:1,d:1,l:1,gf:1, ga:2, gd:-1, pts:4},
    {flag:"🇨🇦",name:"Canada",       mp:3,w:0,d:0,l:3,gf:2, ga:6, gd:-4, pts:0},
  ]},
  { group:"G", tag:"Brazil top the group despite a Cameroon defeat in the final game", teams:[
    {flag:"🇧🇷",name:"Brazil",       mp:3,w:2,d:0,l:1,gf:3, ga:1, gd:2,  pts:6,q:true},
    {flag:"🇨🇭",name:"Switzerland",  mp:3,w:2,d:0,l:1,gf:4, ga:3, gd:1,  pts:6,q:true},
    {flag:"🇨🇲",name:"Cameroon",     mp:3,w:1,d:1,l:1,gf:4, ga:4, gd:0,  pts:4},
    {flag:"🇷🇸",name:"Serbia",       mp:3,w:0,d:1,l:2,gf:5, ga:8, gd:-3, pts:1},
  ]},
  { group:"H", tag:"South Korea qualify on goals scored on a dramatic final night", teams:[
    {flag:"🇵🇹",name:"Portugal",     mp:3,w:2,d:0,l:1,gf:6, ga:4, gd:2,  pts:6,q:true},
    {flag:"🇰🇷",name:"South Korea",  mp:3,w:1,d:1,l:1,gf:4, ga:4, gd:0,  pts:4,q:true},
    {flag:"🇺🇾",name:"Uruguay",      mp:3,w:1,d:1,l:1,gf:2, ga:2, gd:0,  pts:4},
    {flag:"🇬🇭",name:"Ghana",        mp:3,w:1,d:0,l:2,gf:5, ga:7, gd:-2, pts:3},
  ]},
];

/* ─── Bracket Data ───────────────────────────────────────── */
const R16: BMatchData[] = [
  {t1:{flag:"🇳🇱",code:"NED",score:3},    t2:{flag:"🇺🇸",code:"USA",score:1},    winner:1},
  {t1:{flag:"🇦🇷",code:"ARG",score:2},    t2:{flag:"🇦🇺",code:"AUS",score:1},    winner:1, note:"AET"},
  {t1:{flag:"🇯🇵",code:"JPN",score:1},    t2:{flag:"🇭🇷",code:"CRO",score:1},    winner:2, note:"CRO pen 3-1"},
  {t1:{flag:"🇧🇷",code:"BRA",score:4},    t2:{flag:"🇰🇷",code:"KOR",score:1},    winner:1},
  {t1:{flag:"🇫🇷",code:"FRA",score:3},    t2:{flag:"🇵🇱",code:"POL",score:1},    winner:1},
  {t1:{flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",code:"ENG",score:3},    t2:{flag:"🇸🇳",code:"SEN",score:0},    winner:1},
  {t1:{flag:"🇲🇦",code:"MAR",score:"0(3)"},t2:{flag:"🇪🇸",code:"ESP",score:"0(0)"},winner:1, note:"Morocco pen 3-0", upset:true, upsetLabel:"GIANT-KILL"},
  {t1:{flag:"🇵🇹",code:"POR",score:6},    t2:{flag:"🇨🇭",code:"SUI",score:1},    winner:1},
];
const QF: BMatchData[] = [
  {t1:{flag:"🇦🇷",code:"ARG",score:"2(4)"},t2:{flag:"🇳🇱",code:"NED",score:"2(3)"},winner:1, note:"pen 4-3"},
  {t1:{flag:"🇭🇷",code:"CRO",score:"1(4)"},t2:{flag:"🇧🇷",code:"BRA",score:"1(2)"},winner:1, note:"pen 4-2", upset:true, upsetLabel:"SHOCK"},
  {t1:{flag:"🇫🇷",code:"FRA",score:2},    t2:{flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",code:"ENG",score:1},    winner:1},
  {t1:{flag:"🇲🇦",code:"MAR",score:1},    t2:{flag:"🇵🇹",code:"POR",score:0},    winner:1, upset:true, upsetLabel:"HISTORY"},
];
const SF: BMatchData[] = [
  {t1:{flag:"🇦🇷",code:"ARG",score:3},t2:{flag:"🇭🇷",code:"CRO",score:0},winner:1},
  {t1:{flag:"🇫🇷",code:"FRA",score:2},t2:{flag:"🇲🇦",code:"MAR",score:0},winner:1},
];
const FINAL_MATCH: BMatchData = {
  t1:{flag:"🇦🇷",code:"ARG",score:"3(4)"},
  t2:{flag:"🇫🇷",code:"FRA",score:"3(2)"},
  winner:1, note:"pen 4-2",
};

/* ─── Final Match data ───────────────────────────────────── */
const TIMELINE = [
  {min:23,  team:1, player:"Lionel Messi",   type:"Penalty",            score:"1-0",  isArg:true},
  {min:36,  team:1, player:"Ángel Di María", type:"Open Play",          score:"2-0",  isArg:true,  assist:"Messi"},
  {min:80,  team:2, player:"Kylian Mbappé",  type:"Penalty",            score:"2-1",  isArg:false},
  {min:81,  team:2, player:"Kylian Mbappé",  type:"Volley",             score:"2-2",  isArg:false, assist:"Thuram"},
  {min:108, team:1, player:"Lionel Messi",   type:"Open Play (AET)",    score:"3-2",  isArg:true},
  {min:118, team:2, player:"Kylian Mbappé",  type:"Penalty · Hat-trick",score:"3-3",  isArg:false},
];
const PENALTIES = {
  arg: [{p:"Messi",s:true},{p:"Dybala",s:true},{p:"Paredes",s:true},{p:"Montiel",s:true}],
  fra: [{p:"Coman",s:false},{p:"Tchouaméni",s:false},{p:"Zirkzee",s:true},{p:"Kolo Muani",s:true}],
};
const MSTAT = { shots:{a:16,f:20}, onTarget:{a:6,f:8}, blocked:{a:4,f:6}, offTarget:{a:6,f:6}, goals:{a:3,f:3}, xg:{a:0.98,f:2.06}, poss:{a:44,f:56}, passes:{a:379,f:547}, passAcc:{a:82,f:89} };
const ARG_XI = [{n:23,p:"GK",nm:"E. Martínez"},{n:26,p:"RB",nm:"Molina"},{n:13,p:"CB",nm:"Romero"},{n:19,p:"CB",nm:"Otamendi"},{n:3,p:"LB",nm:"Tagliafico"},{n:7,p:"CM",nm:"De Paul"},{n:5,p:"CM",nm:"Paredes"},{n:24,p:"CM",nm:"Enzo Fndz"},{n:11,p:"LW",nm:"Di María"},{n:9,p:"ST",nm:"J. Álvarez"},{n:10,p:"RW",nm:"Messi"}];
const FRA_XI = [{n:1,p:"GK",nm:"Lloris"},{n:5,p:"RB",nm:"Koundé"},{n:4,p:"CB",nm:"Varane"},{n:23,p:"CB",nm:"Upamecano"},{n:22,p:"LB",nm:"T. Hernandez"},{n:8,p:"CDM",nm:"Tchouaméni"},{n:14,p:"CDM",nm:"Rabiot"},{n:11,p:"RW",nm:"Dembélé"},{n:7,p:"CAM",nm:"Griezmann"},{n:10,p:"LW",nm:"Mbappé"},{n:9,p:"ST",nm:"Giroud"}];

/* ─── Awards data ────────────────────────────────────────── */
const MBAPPE_XG = [
  {m:"AUS",g:2,xg:1.1},{m:"DEN",g:1,xg:0.7},{m:"TUN",g:0,xg:0.2},
  {m:"POL",g:1,xg:0.6},{m:"ENG",g:1,xg:0.5},{m:"MAR",g:0,xg:0.3},{m:"ARG",g:3,xg:1.8},
];

/* ═══════════════════════════════════════════════════════════
   COMPONENTS
══════════════════════════════════════════════════════════ */

/* ─── Tournament Switcher (2022 → 2026) ─────────────────── */
function SwitcherBtn({ onSwitch }: { onSwitch: () => void }) {
  return (
    <button
      onClick={onSwitch}
      style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px", borderRadius:20, background:`${L.gold}18`, border:`1px solid ${L.gold}55`, cursor:"pointer", transition:"opacity .2s" }}
      onMouseEnter={e=>(e.currentTarget.style.opacity=".75")}
      onMouseLeave={e=>(e.currentTarget.style.opacity="1")}
    >
      <span style={{fontSize:"1rem"}}>🌎</span>
      <span style={{color:L.gold, fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.08em", ...CI}}>2026 LIVE MODE</span>
    </button>
  );
}

/* ─── Legacy Nav ─────────────────────────────────────────── */
function LegacyNav({ screen, onScreen, onSwitch, onNavigateFanZone }:{
  screen: LScreen; onScreen:(s:LScreen)=>void; onSwitch:()=>void; onNavigateFanZone:()=>void;
}) {
  const tabs: {key:LScreen; label:string}[] = [
    {key:"groups",   label:"Group Stage"},
    {key:"bracket",  label:"Bracket"},
    {key:"match",    label:"ARG vs FRA Final"},
    {key:"awards",   label:"Awards"},
    {key:"tactical", label:"Tactical Field"},
  ];
  return (
    <header style={{background:L.maroon, borderBottom:`3px solid ${L.gold}`}}>
      <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 20px"}}>
        {/* Brand */}
        <div>
          <div style={{color:L.gold, fontSize:"1.35rem", fontWeight:700, letterSpacing:"0.08em", lineHeight:1, ...CI}}>FOOTY MIND</div>
          <div style={{color:`${L.gold}60`, fontSize:"0.58rem", letterSpacing:"0.28em", marginTop:2, ...MO}}>QATAR 2022 · LEGACY MODE</div>
        </div>
        {/* Desktop tabs */}
        <nav style={{display:"flex", gap:4}}>
          {tabs.map(t=>(
            <button key={t.key} onClick={()=>onScreen(t.key)}
              style={{
                padding:"7px 14px", borderRadius:8, cursor:"pointer", transition:"all .15s",
                background: screen===t.key ? L.gold : "transparent",
                color: screen===t.key ? L.maroon : `${L.gold}80`,
                fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.08em", border:"none",
                ...CI,
              }}
            >{t.label.toUpperCase()}</button>
          ))}
        </nav>
        <div style={{display:"flex", alignItems:"center", gap: 10}}>
          <button onClick={onNavigateFanZone} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 12px", borderRadius:16, background:`${L.gold}22`, border:`1px solid ${L.gold}`, color:L.gold, cursor:"pointer", fontWeight:700, fontSize:"0.65rem", letterSpacing:"0.08em", ...CI }}>
            <span>⚡ FAN ZONE</span>
          </button>
          <SwitcherBtn onSwitch={onSwitch}/>
        </div>
      </div>
      {/* Mobile tabs */}
      <div style={{display:"flex", overflowX:"auto", scrollbarWidth:"none", borderTop:`1px solid ${L.gold}22`}}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>onScreen(t.key)}
            style={{
              flexShrink:0, padding:"9px 16px", cursor:"pointer", whiteSpace:"nowrap",
              background:"transparent", border:"none",
              color: screen===t.key ? L.gold : `${L.gold}55`,
              fontSize:"0.66rem", fontWeight:700, letterSpacing:"0.07em",
              borderBottom: screen===t.key ? `2px solid ${L.gold}` : "2px solid transparent",
              ...CI,
            }}
          >{t.label.toUpperCase()}</button>
        ))}
      </div>
    </header>
  );
}

/* ─── Group Card ─────────────────────────────────────────── */
function GroupCard({data}:{data:GroupData}) {
  return (
    <div style={{background:L.surface, borderRadius:10, overflow:"hidden", border:`1px solid ${L.border}`, boxShadow:"0 2px 14px rgba(86,4,44,0.07)"}}>
      <div style={{background:L.maroon, padding:"10px 14px"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
          <span style={{color:L.gold, fontWeight:700, fontSize:"0.88rem", letterSpacing:"0.14em", ...CI}}>GROUP {data.group}</span>
        </div>
        {data.tag && <p style={{color:`${L.gold}70`, fontSize:"0.6rem", marginTop:4, lineHeight:1.35, letterSpacing:"0.03em", ...IN}}>{data.tag}</p>}
      </div>
      <table style={{width:"100%", borderCollapse:"collapse"}}>
        <thead>
          <tr style={{background:L.warm}}>
            <th style={{padding:"5px 10px", textAlign:"left", fontSize:"0.6rem", letterSpacing:"0.08em", color:L.muted, fontWeight:600, ...IN}}>TEAM</th>
            {["MP","W","D","L","GD","Pts"].map(h=>(
              <th key={h} style={{padding:"5px 6px", fontSize:"0.6rem", letterSpacing:"0.06em", color:L.muted, fontWeight:600, textAlign:"center", ...IN}}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.teams.map((t,i)=>(
            <tr key={i} style={{borderTop:`1px solid ${L.border}`}}>
              <td style={{padding:"7px 10px"}}>
                <div style={{display:"flex", alignItems:"center", gap:7}}>
                  <div style={{width:3, height:22, borderRadius:2, background:t.q ? (i===0?L.gold:L.lightBlue) : "transparent", flexShrink:0}}/>
                  <span style={{fontSize:"1rem"}}>{t.flag}</span>
                  <span style={{fontSize:"0.78rem", fontWeight:t.q?600:400, color:t.q?L.charcoal:"#888", ...IN}}>{t.name}</span>
                </div>
              </td>
              {[t.mp,t.w,t.d,t.l, t.gd>0?`+${t.gd}`:String(t.gd), t.pts].map((v,vi)=>(
                <td key={vi} style={{padding:"7px 5px", textAlign:"center", fontSize:"0.78rem",
                  fontWeight:vi===5?700:400, color:vi===5?L.maroon:L.charcoal,
                  fontFamily: vi>=4?"'DM Mono',monospace":"'Inter',sans-serif"
                }}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Group Stage Screen ─────────────────────────────────── */
function GroupStageView() {
  return (
    <div style={{background:L.bg, minHeight:"100vh", padding:"32px 24px"}}>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:"0.6rem", letterSpacing:"0.3em", color:L.muted, ...MO, marginBottom:6}}>COMPETITION ID: 43 · SEASON ID: 106 · FIFA WORLD CUP QATAR 2022</div>
        <h1 style={{fontSize:"clamp(1.8rem,4vw,2.8rem)", color:L.maroon, fontWeight:700, ...CI, lineHeight:1}}>Group Stage</h1>
        <p style={{color:L.muted, fontSize:"0.85rem", marginTop:6, ...IN}}>8 groups · 32 nations · 48 matches · November 20 – December 2, 2022</p>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(310px,1fr))", gap:18}}>
        {GROUPS.map(g=><GroupCard key={g.group} data={g}/>)}
      </div>
      <div style={{display:"flex", gap:24, marginTop:20, flexWrap:"wrap"}}>
        {[{c:L.gold,l:"Group Winner — advances to Round of 16"},{c:L.lightBlue,l:"Runner-up — advances to Round of 16"}].map(x=>(
          <div key={x.l} style={{display:"flex", alignItems:"center", gap:8}}>
            <div style={{width:12, height:12, background:x.c, borderRadius:2}}/>
            <span style={{fontSize:"0.72rem", color:L.muted, ...IN}}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Bracket Match Card ─────────────────────────────────── */
function BCard({m}:{m:BMatchData}) {
  return (
    <div style={{background:L.surface, border:`1px solid ${L.border}`, borderRadius:8, overflow:"hidden", minWidth:172, boxShadow:"0 1px 6px rgba(86,4,44,0.06)"}}>
      {m.upset && (
        <div style={{background:L.gold, padding:"2px 8px", textAlign:"center"}}>
          <span style={{fontSize:"0.54rem", fontWeight:700, color:L.maroon, letterSpacing:"0.14em", ...CI}}>{m.upsetLabel}</span>
        </div>
      )}
      {[{t:m.t1,w:m.winner===1},{t:m.t2,w:m.winner===2}].map((row,i)=>(
        <div key={i} style={{display:"flex", justifyContent:"space-between", alignItems:"center",
          padding:"8px 11px", background:row.w?`${L.maroon}07`:"transparent",
          borderBottom:i===0?`1px solid ${L.border}`:"none"
        }}>
          <div style={{display:"flex", alignItems:"center", gap:6}}>
            <span style={{fontSize:"0.95rem"}}>{row.t.flag}</span>
            <span style={{fontSize:"0.78rem", fontWeight:row.w?700:400, color:row.w?L.maroon:"#999", ...IN}}>{row.t.code}</span>
          </div>
          <span style={{fontSize:"0.82rem", fontWeight:700, color:row.w?L.maroon:"#aaa", ...MO}}>{row.t.score}</span>
        </div>
      ))}
      {m.note && (
        <div style={{padding:"3px 11px", background:L.warm, borderTop:`1px solid ${L.border}`}}>
          <span style={{fontSize:"0.6rem", color:L.blue, ...MO}}>{m.note}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Bracket View ───────────────────────────────────────── */
function BracketView() {
  const sp = (h:number) => <div style={{height:h}}/>;
  const arr = () => (
    <div style={{display:"flex", alignItems:"center", justifyContent:"center", width:26, flexShrink:0, paddingTop:78}}>
      <ChevronRight size={16} style={{color:L.maroon, opacity:0.35}}/>
    </div>
  );

  return (
    <div style={{background:L.bg, minHeight:"100vh", padding:"32px 24px"}}>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:"0.6rem", letterSpacing:"0.3em", color:L.muted, ...MO, marginBottom:6}}>KNOCKOUT STAGE · DECEMBER 3–18, 2022</div>
        <h1 style={{fontSize:"clamp(1.8rem,4vw,2.8rem)", color:L.maroon, fontWeight:700, ...CI, lineHeight:1}}>Tournament Bracket</h1>
        <p style={{color:L.muted, fontSize:"0.85rem", marginTop:6, ...IN}}>Round of 16 · Quarter-finals · Semi-finals · Final · Champion</p>
      </div>

      {/* Scrollable bracket */}
      <div style={{overflowX:"auto", paddingBottom:24}}>
        <div style={{display:"flex", gap:0, minWidth:960, alignItems:"flex-start"}}>

          {/* R16 */}
          <div style={{flexShrink:0}}>
            <div style={{fontSize:"0.56rem", letterSpacing:"0.15em", color:L.muted, ...MO, marginBottom:8, textAlign:"center", paddingLeft:8}}>ROUND OF 16</div>
            <div style={{display:"flex", flexDirection:"column"}}>
              <BCard m={R16[0]}/>{sp(6)}<BCard m={R16[1]}/>{sp(30)}
              <BCard m={R16[2]}/>{sp(6)}<BCard m={R16[3]}/>{sp(52)}
              <BCard m={R16[4]}/>{sp(6)}<BCard m={R16[5]}/>{sp(30)}
              <BCard m={R16[6]}/>{sp(6)}<BCard m={R16[7]}/>
            </div>
          </div>
          {arr()}

          {/* QF */}
          <div style={{flexShrink:0}}>
            <div style={{fontSize:"0.56rem", letterSpacing:"0.15em", color:L.muted, ...MO, marginBottom:8, textAlign:"center"}}>QUARTER-FINALS</div>
            <div style={{display:"flex", flexDirection:"column", paddingTop:38}}>
              <BCard m={QF[0]}/>{sp(78)}<BCard m={QF[1]}/>{sp(126)}
              <BCard m={QF[2]}/>{sp(78)}<BCard m={QF[3]}/>
            </div>
          </div>
          {arr()}

          {/* SF */}
          <div style={{flexShrink:0}}>
            <div style={{fontSize:"0.56rem", letterSpacing:"0.15em", color:L.muted, ...MO, marginBottom:8, textAlign:"center"}}>SEMI-FINALS</div>
            <div style={{display:"flex", flexDirection:"column", paddingTop:112}}>
              <BCard m={SF[0]}/>{sp(294)}<BCard m={SF[1]}/>
            </div>
          </div>
          {arr()}

          {/* Final */}
          <div style={{flexShrink:0}}>
            <div style={{fontSize:"0.56rem", letterSpacing:"0.15em", color:L.muted, ...MO, marginBottom:8, textAlign:"center"}}>THE FINAL</div>
            <div style={{display:"flex", flexDirection:"column", paddingTop:290}}>
              <BCard m={FINAL_MATCH}/>
            </div>
          </div>

          {/* Champion callout */}
          <div style={{flexShrink:0, paddingTop:290, marginLeft:16}}>
            <div style={{background:`linear-gradient(135deg,${L.maroon},${L.maroonDk})`, borderRadius:12, padding:"14px 20px", textAlign:"center", border:`2px solid ${L.gold}`, boxShadow:`0 0 32px ${L.gold}30`}}>
              <Trophy size={24} style={{color:L.gold, marginBottom:6}}/>
              <div style={{color:L.gold, fontWeight:700, fontSize:"0.72rem", letterSpacing:"0.12em", ...CI}}>WORLD CHAMPION</div>
              <div style={{color:L.white, fontSize:"1.3rem", fontWeight:700, ...CI, marginTop:4}}>🇦🇷 ARGENTINA</div>
              <div style={{color:`${L.gold}70`, fontSize:"0.58rem", letterSpacing:"0.12em", ...MO, marginTop:5}}>36 YEARS · 3RD TITLE</div>
              <div style={{color:`${L.white}60`, fontSize:"0.6rem", ...IN, marginTop:3}}>Lusail Iconic Stadium</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key results strip */}
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:14, marginTop:28}}>
        {[
          {stage:"QF Upset",score:"Croatia 4-2 Brazil (pen)",note:"Neymar's last World Cup ended in Lusail. Courtois — no wait, it was Livaković — made 11 saves."},
          {stage:"QF — Historic",score:"Morocco 1-0 Portugal",note:"First African nation to reach a World Cup semi-final. Youssef En-Nesyri's header sealed it."},
          {stage:"The Final",score:"Argentina 3-3 France (4-2p)",note:"Mbappé's hat-trick couldn't deny Messi his long-awaited world title on the grandest stage."},
        ].map(c=>(
          <div key={c.stage} style={{background:L.surface, border:`1px solid ${L.border}`, borderLeft:`4px solid ${L.gold}`, borderRadius:"0 8px 8px 0", padding:"12px 14px"}}>
            <div style={{fontSize:"0.58rem", letterSpacing:"0.15em", color:L.muted, ...MO, marginBottom:4}}>{c.stage.toUpperCase()}</div>
            <div style={{fontSize:"0.88rem", fontWeight:700, color:L.maroon, ...CI, marginBottom:5}}>{c.score}</div>
            <p style={{fontSize:"0.73rem", color:"#666", margin:0, lineHeight:1.55, ...IN}}>{c.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Match Detail Screen ────────────────────────────────── */
function MatchDetailView() {
  return (
    <div style={{background:L.bg, minHeight:"100vh"}}>
      {/* Cinematic hero */}
      <div style={{background:`linear-gradient(160deg,${L.maroon} 0%,${L.maroonDk} 100%)`, padding:"40px 24px 32px"}}>
        <div style={{maxWidth:900, margin:"0 auto"}}>
          <div style={{fontSize:"0.58rem", letterSpacing:"0.3em", color:`${L.gold}70`, ...MO, marginBottom:10}}>
            FIFA WORLD CUP 2022 · THE FINAL · LUSAIL ICONIC STADIUM · 18 DECEMBER 2022 · 88,966 ATT.
          </div>
          <h1 style={{color:L.white, fontWeight:700, lineHeight:1.0, ...CI, fontSize:"clamp(1.8rem,5vw,3.2rem)"}}>
            ARGENTINA <span style={{color:L.gold}}>3–3</span> FRANCE
          </h1>
          <p style={{color:`${L.gold}80`, fontSize:"0.9rem", marginTop:6, ...CI, letterSpacing:"0.07em"}}>
            Argentina win 4-2 on penalties · After Extra Time
          </p>
          <p style={{color:"rgba(255,255,255,0.45)", fontSize:"0.78rem", marginTop:10, maxWidth:540, lineHeight:1.65, ...IN}}>
            The greatest World Cup final in history. Argentina led 2-0 before Mbappé's stunning brace levelled within two minutes. Messi restored the lead in extra time, but Mbappé completed his hat-trick from the spot to force penalties — where Argentina prevailed 4-2.
          </p>
        </div>
      </div>

      <div style={{maxWidth:900, margin:"0 auto", padding:"24px"}}>
        {/* StatsBomb Advanced Panel */}
        <div style={{background:L.surface, borderRadius:12, border:`1px solid ${L.border}`, overflow:"hidden", marginBottom:20}}>
          <div style={{background:L.warm, padding:"9px 16px", borderBottom:`1px solid ${L.border}`}}>
            <span style={{fontSize:"0.58rem", letterSpacing:"0.22em", color:L.muted, ...MO}}>STATSBOMB OPEN DATA · ADVANCED ANALYTICS PANEL · COMPETITION 43 · MATCH 3869685</span>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))"}}>

            {/* Shot breakdown */}
            <div style={{padding:"16px", borderRight:`1px solid ${L.border}`}}>
              <div style={{fontSize:"0.58rem", letterSpacing:"0.16em", color:L.muted, ...MO, marginBottom:14}}>SHOTS BREAKDOWN</div>
              {([
                ["Total Shots",    MSTAT.shots.a,    MSTAT.shots.f],
                ["On Target",      MSTAT.onTarget.a, MSTAT.onTarget.f],
                ["Blocked",        MSTAT.blocked.a,  MSTAT.blocked.f],
                ["Off Target",     MSTAT.offTarget.a,MSTAT.offTarget.f],
                ["Goals Scored",   MSTAT.goals.a,    MSTAT.goals.f],
              ] as [string,number,number][]).map(([label,a,f])=>{
                const tot = a+f; const aPct = (a/tot)*100;
                return (
                  <div key={label} style={{marginBottom:11}}>
                    <div style={{display:"flex", justifyContent:"space-between", marginBottom:4}}>
                      <span style={{fontSize:"0.8rem", fontWeight:700, color:L.maroon, ...MO}}>{a}</span>
                      <span style={{fontSize:"0.7rem", color:L.muted, ...IN}}>{label}</span>
                      <span style={{fontSize:"0.8rem", fontWeight:700, color:L.blue, ...MO}}>{f}</span>
                    </div>
                    <div style={{height:5, background:`${L.blue}22`, borderRadius:3, overflow:"hidden"}}>
                      <div style={{height:"100%", width:`${aPct}%`, background:L.maroon, borderRadius:3}}/>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* xG Model */}
            <div style={{padding:"16px", borderRight:`1px solid ${L.border}`}}>
              <div style={{fontSize:"0.58rem", letterSpacing:"0.16em", color:L.muted, ...MO, marginBottom:14}}>xG MODEL — EXPECTED GOALS</div>
              {([
                {name:"🇦🇷 Argentina", xg:MSTAT.xg.a, g:MSTAT.goals.a, color:L.maroon},
                {name:"🇫🇷 France",    xg:MSTAT.xg.f, g:MSTAT.goals.f, color:L.blue},
              ] as {name:string;xg:number;g:number;color:string}[]).map(t=>(
                <div key={t.name} style={{marginBottom:18}}>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
                    <span style={{fontSize:"0.8rem", fontWeight:600, color:L.charcoal, ...IN}}>{t.name}</span>
                    <span style={{fontSize:"0.72rem", color:L.muted, ...MO}}>xG: {t.xg}</span>
                  </div>
                  <div style={{position:"relative", height:26, background:`${L.lightBlue}18`, borderRadius:4, overflow:"hidden"}}>
                    <div style={{position:"absolute", left:0, top:0, height:"100%", width:`${(t.xg/2.5)*100}%`, background:`${t.color}22`, borderRight:`2px solid ${t.color}`}}/>
                    <div style={{position:"absolute", left:0, top:0, height:"100%", width:`${(t.g/2.5)*100}%`, background:`${t.color}10`, borderRight:`2px dashed ${t.color}`}}/>
                    <span style={{position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", fontSize:"0.7rem", ...MO, color:t.color}}>
                      {t.g}G / {t.xg}xG
                    </span>
                  </div>
                  <div style={{fontSize:"0.6rem", color:L.muted, ...IN, marginTop:3}}>
                    Outperformed xG by +{(t.g-t.xg).toFixed(2)}
                  </div>
                </div>
              ))}
              <div style={{paddingTop:12, borderTop:`1px solid ${L.border}`}}>
                {([["Possession",`${MSTAT.poss.a}%`,`${MSTAT.poss.f}%`],["Passes",MSTAT.passes.a,MSTAT.passes.f],["Pass Accuracy",`${MSTAT.passAcc.a}%`,`${MSTAT.passAcc.f}%`]] as [string,string|number,string|number][]).map(([l,a,f])=>(
                  <div key={l} style={{display:"flex", justifyContent:"space-between", marginBottom:6}}>
                    <span style={{fontSize:"0.72rem", color:L.muted, ...IN}}>{l}</span>
                    <span style={{fontSize:"0.72rem", color:L.charcoal, ...MO}}>🇦🇷 {a} · 🇫🇷 {f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lineups */}
            <div style={{padding:"16px"}}>
              <div style={{fontSize:"0.58rem", letterSpacing:"0.16em", color:L.muted, ...MO, marginBottom:12}}>STARTING LINEUPS · 4-3-3</div>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8}}>
                {[{flag:"🇦🇷",name:"ARGENTINA",xi:ARG_XI,color:L.maroon},{flag:"🇫🇷",name:"FRANCE",xi:FRA_XI,color:L.blue}].map(team=>(
                  <div key={team.name}>
                    <div style={{fontSize:"0.62rem", fontWeight:700, color:team.color, marginBottom:6, letterSpacing:"0.07em", ...CI}}>{team.flag} {team.name}</div>
                    {team.xi.map(pl=>(
                      <div key={pl.n} style={{display:"flex", alignItems:"center", gap:5, marginBottom:3}}>
                        <div style={{width:17,height:17, borderRadius:"50%", background:`${team.color}12`, border:`1px solid ${team.color}35`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0}}>
                          <span style={{fontSize:"0.5rem", fontWeight:700, color:team.color, ...MO}}>{pl.n}</span>
                        </div>
                        <span style={{fontSize:"0.68rem", color:L.charcoal, flex:1, ...IN}}>{pl.nm}</span>
                        <span style={{fontSize:"0.57rem", color:L.muted, ...MO}}>{pl.p}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Timeline + Penalties */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:18}}>

          {/* Timeline */}
          <div style={{background:L.surface, borderRadius:12, border:`1px solid ${L.border}`, overflow:"hidden"}}>
            <div style={{background:L.warm, padding:"9px 16px", borderBottom:`1px solid ${L.border}`}}>
              <span style={{fontSize:"0.58rem", letterSpacing:"0.2em", color:L.muted, ...MO}}>LINEAR MATCH EVENT TIMELINE</span>
            </div>
            <div style={{padding:"16px", position:"relative"}}>
              {/* Axis line */}
              <div style={{position:"absolute", left:42, top:16, bottom:16, width:2, background:L.border, borderRadius:1}}/>
              {TIMELINE.map((e,i)=>(
                <div key={i} style={{display:"flex", alignItems:"flex-start", gap:9, marginBottom:14, position:"relative", zIndex:1}}>
                  <div style={{width:34, textAlign:"right", paddingTop:3}}>
                    <span style={{fontSize:"0.82rem", fontWeight:700, color:e.isArg?L.maroon:L.blue, ...MO}}>{e.min}'</span>
                  </div>
                  <div style={{width:10, height:10, borderRadius:"50%", background:e.isArg?L.gold:L.lightBlue, border:`2px solid ${e.isArg?L.maroon:L.blue}`, flexShrink:0, marginTop:3}}/>
                  <div style={{flex:1, background:e.isArg?`${L.maroon}06`:`${L.blue}06`, borderRadius:7, padding:"6px 10px", border:`1px solid ${e.isArg?L.maroon:L.blue}1a`}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                      <div>
                        <div style={{fontSize:"0.78rem", fontWeight:700, color:e.isArg?L.maroon:L.blue, ...IN}}>{e.player}</div>
                        <div style={{fontSize:"0.62rem", color:L.muted, ...MO, marginTop:1}}>{e.type}</div>
                        {"assist" in e && e.assist && <div style={{fontSize:"0.6rem", color:"#aaa", ...IN}}>Ast: {e.assist}</div>}
                      </div>
                      <span style={{fontSize:"0.72rem", fontWeight:700, color:L.charcoal, ...MO}}>{e.score}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Penalty Shootout */}
          <div style={{background:L.surface, borderRadius:12, border:`1px solid ${L.border}`, overflow:"hidden"}}>
            <div style={{background:L.warm, padding:"9px 16px", borderBottom:`1px solid ${L.border}`}}>
              <span style={{fontSize:"0.58rem", letterSpacing:"0.2em", color:L.muted, ...MO}}>PENALTY SHOOTOUT · ARGENTINA WIN 4-2</span>
            </div>
            <div style={{padding:"20px 16px"}}>
              {[
                {flag:"🇦🇷",name:"ARGENTINA",pens:PENALTIES.arg,color:L.maroon,won:true},
                {flag:"🇫🇷",name:"FRANCE",   pens:PENALTIES.fra,color:L.blue,  won:false},
              ].map(team=>(
                <div key={team.name} style={{marginBottom:24}}>
                  <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:10}}>
                    <span style={{fontSize:"1.1rem"}}>{team.flag}</span>
                    <span style={{fontSize:"0.78rem", fontWeight:700, color:team.color, letterSpacing:"0.08em", ...CI}}>{team.name}</span>
                    {team.won && <div style={{marginLeft:"auto", background:L.gold, color:L.maroon, padding:"2px 10px", borderRadius:20, fontSize:"0.6rem", fontWeight:700, ...CI}}>WINNERS</div>}
                  </div>
                  <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
                    {team.pens.map((pen,i)=>(
                      <div key={i} style={{textAlign:"center"}}>
                        <div style={{width:46, height:46, borderRadius:"50%", background:pen.s?`${L.green}12`:`${L.red}12`, border:`2px solid ${pen.s?L.green:L.red}`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:4}}>
                          <span style={{fontSize:"1.2rem"}}>{pen.s?"✓":"✗"}</span>
                        </div>
                        <div style={{fontSize:"0.58rem", color:L.muted, ...IN, maxWidth:46, lineHeight:1.2}}>{pen.p}</div>
                      </div>
                    ))}
                    <div style={{display:"flex", alignItems:"center", marginLeft:6}}>
                      <div style={{background:team.won?L.maroon:"#ddd", color:team.won?"white":L.muted, padding:"6px 12px", borderRadius:8, fontSize:"1.5rem", fontWeight:700, ...CI}}>
                        {team.pens.filter(p=>p.s).length}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Awards View ────────────────────────────────────────── */
function AwardsView() {
  const saveDots = [{cx:28,cy:22},{cx:72,cy:18},{cx:50,cy:14},{cx:18,cy:44},{cx:80,cy:40},{cx:62,cy:54}];
  const penSaves = [{cx:28,cy:22},{cx:72,cy:18}];
  return (
    <div style={{background:L.bg, minHeight:"100vh", padding:"32px 24px"}}>
      <div style={{marginBottom:28}}>
        <div style={{fontSize:"0.6rem", letterSpacing:"0.3em", color:L.muted, ...MO, marginBottom:6}}>FIFA INDIVIDUAL AWARDS · QATAR 2022</div>
        <h1 style={{fontSize:"clamp(1.8rem,4vw,2.8rem)", color:L.maroon, fontWeight:700, ...CI, lineHeight:1}}>Individual Honours</h1>
        <p style={{color:L.muted, fontSize:"0.85rem", marginTop:6, ...IN}}>Golden Boot · Golden Ball · Golden Glove — Official FIFA awards</p>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:22}}>

        {/* ── Golden Boot — Mbappé ── */}
        <div style={{background:L.surface, borderRadius:16, border:`1px solid ${L.border}`, overflow:"hidden", boxShadow:"0 4px 22px rgba(86,4,44,0.1)"}}>
          <div style={{background:`linear-gradient(135deg,${L.maroon},${L.maroonDk})`, padding:"20px"}}>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:12}}>
              <div style={{width:34,height:34, background:L.gold, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <span style={{fontSize:"1rem"}}>👟</span>
              </div>
              <div>
                <div style={{fontSize:"0.57rem", letterSpacing:"0.2em", color:`${L.gold}70`, ...MO}}>FIFA AWARD</div>
                <div style={{color:L.gold, fontWeight:700, fontSize:"0.95rem", letterSpacing:"0.1em", ...CI}}>GOLDEN BOOT</div>
              </div>
            </div>
            <div style={{display:"flex", alignItems:"flex-end", gap:10}}>
              <div>
                <div style={{color:L.white, fontWeight:700, fontSize:"1.45rem", ...CI, lineHeight:1}}>Kylian Mbappé</div>
                <div style={{color:`${L.white}60`, fontSize:"0.7rem", ...IN, marginTop:3}}>🇫🇷 France · Paris Saint-Germain</div>
              </div>
              <div style={{marginLeft:"auto", textAlign:"right"}}>
                <div style={{color:L.gold, fontSize:"3rem", fontWeight:900, ...CI, lineHeight:1}}>8</div>
                <div style={{color:`${L.gold}70`, fontSize:"0.58rem", ...MO}}>GOALS</div>
              </div>
            </div>
          </div>
          <div style={{padding:"16px 18px"}}>
            <div style={{display:"flex", gap:14, marginBottom:14}}>
              {[{l:"Assists",v:2},{l:"xG",v:"5.2"},{l:"xG/shot",v:"0.19"},{l:"Conv.",v:"54%"}].map(s=>(
                <div key={s.l} style={{textAlign:"center"}}>
                  <div style={{fontSize:"1.1rem", fontWeight:700, color:L.maroon, ...CI}}>{s.v}</div>
                  <div style={{fontSize:"0.58rem", color:L.muted, ...MO, letterSpacing:"0.05em"}}>{s.l}</div>
                </div>
              ))}
            </div>
            <div style={{fontSize:"0.58rem", letterSpacing:"0.14em", color:L.muted, ...MO, marginBottom:8}}>GOALS vs xG PER MATCH</div>
            <ResponsiveContainer width="100%" height={148}>
              <ComposedChart data={MBAPPE_XG} margin={{top:4,right:4,left:-24,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={L.border}/>
                <XAxis dataKey="m" tick={{fontSize:9, fill:L.muted, fontFamily:"'DM Mono',monospace"}}/>
                <YAxis tick={{fontSize:9, fill:L.muted}}/>
                <Tooltip contentStyle={{background:L.maroon, border:"none", borderRadius:6, fontSize:11, color:"white"}} labelStyle={{color:L.gold}}/>
                <Bar key="chart-goals" dataKey="g" fill={L.maroon} name="Goals" radius={[3,3,0,0]} maxBarSize={22} isAnimationActive={false}/>
                <Line key="chart-xg" type="monotone" dataKey="xg" stroke={L.lightBlue} strokeWidth={2} dot={{fill:L.lightBlue,r:3}} name="xG" isAnimationActive={false}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Golden Ball — Messi ── */}
        <div style={{background:L.surface, borderRadius:16, border:`1px solid ${L.border}`, overflow:"hidden", boxShadow:"0 4px 22px rgba(86,4,44,0.1)"}}>
          <div style={{background:`linear-gradient(135deg,${L.gold},#c98f00)`, padding:"20px"}}>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:12}}>
              <div style={{width:34,height:34, background:L.maroon, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <span style={{fontSize:"1rem"}}>⚽</span>
              </div>
              <div>
                <div style={{fontSize:"0.57rem", letterSpacing:"0.2em", color:`${L.maroon}70`, ...MO}}>FIFA AWARD</div>
                <div style={{color:L.maroon, fontWeight:700, fontSize:"0.95rem", letterSpacing:"0.1em", ...CI}}>GOLDEN BALL</div>
              </div>
            </div>
            <div style={{display:"flex", alignItems:"flex-end", gap:10}}>
              <div>
                <div style={{color:L.maroon, fontWeight:700, fontSize:"1.45rem", ...CI, lineHeight:1}}>Lionel Messi</div>
                <div style={{color:`${L.maroon}80`, fontSize:"0.7rem", ...IN, marginTop:3}}>🇦🇷 Argentina · PSG → Inter Miami</div>
              </div>
              <div style={{marginLeft:"auto", textAlign:"right"}}>
                <div style={{color:L.maroon, fontSize:"2.4rem", fontWeight:900, ...CI, lineHeight:1}}>7+3</div>
                <div style={{color:`${L.maroon}70`, fontSize:"0.58rem", ...MO}}>GOALS+ASST</div>
              </div>
            </div>
          </div>
          <div style={{padding:"16px 18px"}}>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:14}}>
              {[{l:"Goals",v:"7",s:"3.4 xG"},{l:"Assists",v:"3",s:"2 key passes/game"},{l:"Prog. Passes",v:"43",s:"per 90 adjusted"},{l:"Dribbles",v:"26",s:"76% success rate"},{l:"Matches",v:"7",s:"all games played"},{l:"xG+xA",v:"5.1",s:"overperformed +4.9"}].map(s=>(
                <div key={s.l} style={{background:L.warm, borderRadius:7, padding:"9px 11px", border:`1px solid ${L.border}`}}>
                  <div style={{fontSize:"1.1rem", fontWeight:700, color:L.maroon, ...CI}}>{s.v}</div>
                  <div style={{fontSize:"0.65rem", fontWeight:600, color:L.charcoal, ...IN, marginTop:1}}>{s.l}</div>
                  <div style={{fontSize:"0.58rem", color:L.muted, ...MO, marginTop:1}}>{s.s}</div>
                </div>
              ))}
            </div>
            <div style={{background:`${L.maroon}06`, borderRadius:8, padding:"10px 12px", border:`1px solid ${L.maroon}1a`}}>
              <p style={{fontSize:"0.72rem", color:L.charcoal, ...IN, lineHeight:1.65, margin:0}}>
                "The most statistically complete performance by any player in a single World Cup tournament. Messi's progressive passing, clutch goal contributions, and sustained brilliance across every knockout game places Qatar 2022 above any previous individual achievement in international football."
              </p>
              <div style={{fontSize:"0.58rem", color:L.muted, ...MO, marginTop:6}}>— StatsBomb post-tournament analysis</div>
            </div>
          </div>
        </div>

        {/* ── Golden Glove — Martínez ── */}
        <div style={{background:L.surface, borderRadius:16, border:`1px solid ${L.border}`, overflow:"hidden", boxShadow:"0 4px 22px rgba(86,4,44,0.1)"}}>
          <div style={{background:`linear-gradient(135deg,${L.blue},#0a5a9c)`, padding:"20px"}}>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:12}}>
              <div style={{width:34,height:34, background:"white", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center"}}>
                <span style={{fontSize:"1rem"}}>🧤</span>
              </div>
              <div>
                <div style={{fontSize:"0.57rem", letterSpacing:"0.2em", color:"rgba(255,255,255,0.5)", ...MO}}>FIFA AWARD</div>
                <div style={{color:L.white, fontWeight:700, fontSize:"0.95rem", letterSpacing:"0.1em", ...CI}}>GOLDEN GLOVE</div>
              </div>
            </div>
            <div>
              <div style={{color:L.white, fontWeight:700, fontSize:"1.45rem", ...CI, lineHeight:1}}>E. Martínez</div>
              <div style={{color:"rgba(255,255,255,0.55)", fontSize:"0.7rem", ...IN, marginTop:3}}>🇦🇷 Emiliano Martínez · Aston Villa</div>
            </div>
          </div>
          <div style={{padding:"16px 18px"}}>
            <div style={{display:"flex", gap:14, marginBottom:14}}>
              {[{l:"Saves",v:23},{l:"Save %",v:"76%"},{l:"PSxG-GA",v:"-1.8"},{l:"Pen Saves",v:2}].map(s=>(
                <div key={s.l} style={{textAlign:"center"}}>
                  <div style={{fontSize:"1.15rem", fontWeight:700, color:L.blue, ...CI}}>{s.v}</div>
                  <div style={{fontSize:"0.58rem", color:L.muted, ...MO, letterSpacing:"0.05em"}}>{s.l}</div>
                </div>
              ))}
            </div>
            {/* Save map SVG */}
            <div style={{fontSize:"0.58rem", letterSpacing:"0.14em", color:L.muted, ...MO, marginBottom:10}}>SHOT STOP LOCATION MAP</div>
            <div style={{display:"flex", justifyContent:"center", marginBottom:12}}>
              <svg viewBox="0 0 100 72" style={{width:"100%", maxWidth:230, height:"auto"}}>
                <rect x={5} y={4} width={90} height={62} fill={`${L.lightBlue}08`} stroke={L.border} strokeWidth={1.8} rx={2}/>
                <line x1={5} y1={66} x2={95} y2={66} stroke={L.borderDk} strokeWidth={1.5}/>
                <line x1={5} y1={35} x2={95} y2={35} stroke={L.border} strokeWidth={0.8} strokeDasharray="3 2"/>
                <line x1={36} y1={4} x2={36} y2={66} stroke={L.border} strokeWidth={0.8} strokeDasharray="3 2"/>
                <line x1={64} y1={4} x2={64} y2={66} stroke={L.border} strokeWidth={0.8} strokeDasharray="3 2"/>
                {[{x:20,y:22,t:"TL"},{x:50,y:16,t:"TC"},{x:80,y:22,t:"TR"},{x:20,y:52,t:"BL"},{x:50,y:52,t:"BC"},{x:80,y:52,t:"BR"}].map(z=>(
                  <text key={z.t} x={z.x} y={z.y} textAnchor="middle" fontSize={5} fill={L.muted} fontFamily="'DM Mono',monospace" opacity={0.35}>{z.t}</text>
                ))}
                {/* Regular saves */}
                {saveDots.map((d,i)=>(
                  <g key={i}>
                    <circle cx={d.cx} cy={d.cy} r={5.5} fill={`${L.lightBlue}30`} stroke={L.blue} strokeWidth={1.2}/>
                    <circle cx={d.cx} cy={d.cy} r={2.2} fill={L.blue}/>
                  </g>
                ))}
                {/* Penalty saves highlighted */}
                {penSaves.map((d,i)=>(
                  <g key={`pen${i}`}>
                    <circle cx={d.cx} cy={d.cy} r={7} fill={`${L.gold}25`} stroke={L.gold} strokeWidth={1.8}/>
                    <circle cx={d.cx} cy={d.cy} r={3} fill={L.gold}/>
                    <text x={d.cx} y={d.cy-9} textAnchor="middle" fontSize={4.5} fill={L.gold} fontFamily="'DM Mono',monospace" fontWeight="bold">PEN</text>
                  </g>
                ))}
              </svg>
            </div>
            <div style={{display:"flex", gap:16, flexWrap:"wrap"}}>
              {[{c:L.blue,l:"Regular saves — 21 tournament total"},{c:L.gold,l:"Penalty saves — final shootout (2)"}].map(x=>(
                <div key={x.l} style={{display:"flex", alignItems:"center", gap:6}}>
                  <div style={{width:10,height:10, borderRadius:"50%", background:x.c, flexShrink:0}}/>
                  <span style={{fontSize:"0.65rem", color:L.muted, ...IN}}>{x.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   TACTICAL FIELD VIEW
   22-player pitch · 64-match selector · StatsBomb analytics
══════════════════════════════════════════════════════════ */

/* ── 64-match Qatar 2022 dataset ── */
const M22 = [
  // GROUP STAGE
  {id:1,  s:"Group A",  h:{f:"🇶🇦",n:"Qatar"},        a:{f:"🇪🇨",n:"Ecuador"},      sc:"0-2"},
  {id:2,  s:"Group A",  h:{f:"🇳🇱",n:"Netherlands"},   a:{f:"🇸🇳",n:"Senegal"},      sc:"2-0"},
  {id:3,  s:"Group A",  h:{f:"🇶🇦",n:"Qatar"},        a:{f:"🇸🇳",n:"Senegal"},      sc:"1-3"},
  {id:4,  s:"Group A",  h:{f:"🇳🇱",n:"Netherlands"},   a:{f:"🇪🇨",n:"Ecuador"},      sc:"1-1"},
  {id:5,  s:"Group A",  h:{f:"🇳🇱",n:"Netherlands"},   a:{f:"🇶🇦",n:"Qatar"},        sc:"2-0"},
  {id:6,  s:"Group A",  h:{f:"🇪🇨",n:"Ecuador"},      a:{f:"🇸🇳",n:"Senegal"},      sc:"1-2"},
  {id:7,  s:"Group B",  h:{f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",n:"England"},      a:{f:"🇮🇷",n:"Iran"},         sc:"6-2"},
  {id:8,  s:"Group B",  h:{f:"🇺🇸",n:"USA"},          a:{f:"🏴󠁧󠁢󠁷󠁬󠁳󠁿",n:"Wales"},         sc:"1-1"},
  {id:9,  s:"Group B",  h:{f:"🏴󠁧󠁢󠁷󠁬󠁳󠁿",n:"Wales"},         a:{f:"🇮🇷",n:"Iran"},         sc:"0-2"},
  {id:10, s:"Group B",  h:{f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",n:"England"},      a:{f:"🇺🇸",n:"USA"},          sc:"0-0"},
  {id:11, s:"Group B",  h:{f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",n:"England"},      a:{f:"🏴󠁧󠁢󠁷󠁬󠁳󠁿",n:"Wales"},         sc:"3-0"},
  {id:12, s:"Group B",  h:{f:"🇮🇷",n:"Iran"},         a:{f:"🇺🇸",n:"USA"},          sc:"0-1"},
  {id:13, s:"Group C ⚡",h:{f:"🇦🇷",n:"Argentina"},   a:{f:"🇸🇦",n:"Saudi Arabia"}, sc:"1-2"},
  {id:14, s:"Group C",  h:{f:"🇲🇽",n:"Mexico"},       a:{f:"🇵🇱",n:"Poland"},       sc:"0-0"},
  {id:15, s:"Group C",  h:{f:"🇦🇷",n:"Argentina"},   a:{f:"🇲🇽",n:"Mexico"},       sc:"2-0"},
  {id:16, s:"Group C",  h:{f:"🇵🇱",n:"Poland"},       a:{f:"🇸🇦",n:"Saudi Arabia"}, sc:"2-0"},
  {id:17, s:"Group C",  h:{f:"🇦🇷",n:"Argentina"},   a:{f:"🇵🇱",n:"Poland"},       sc:"2-0"},
  {id:18, s:"Group C",  h:{f:"🇸🇦",n:"Saudi Arabia"}, a:{f:"🇲🇽",n:"Mexico"},       sc:"1-2"},
  {id:19, s:"Group D",  h:{f:"🇩🇰",n:"Denmark"},      a:{f:"🇹🇳",n:"Tunisia"},      sc:"0-0"},
  {id:20, s:"Group D",  h:{f:"🇫🇷",n:"France"},       a:{f:"🇦🇺",n:"Australia"},    sc:"4-1"},
  {id:21, s:"Group D",  h:{f:"🇹🇳",n:"Tunisia"},      a:{f:"🇦🇺",n:"Australia"},    sc:"0-1"},
  {id:22, s:"Group D",  h:{f:"🇫🇷",n:"France"},       a:{f:"🇩🇰",n:"Denmark"},      sc:"2-1"},
  {id:23, s:"Group D",  h:{f:"🇦🇺",n:"Australia"},    a:{f:"🇩🇰",n:"Denmark"},      sc:"1-0"},
  {id:24, s:"Group D",  h:{f:"🇹🇳",n:"Tunisia"},      a:{f:"🇫🇷",n:"France"},       sc:"1-0"},
  {id:25, s:"Group E ⚡",h:{f:"🇩🇪",n:"Germany"},     a:{f:"🇯🇵",n:"Japan"},        sc:"1-2"},
  {id:26, s:"Group E",  h:{f:"🇪🇸",n:"Spain"},        a:{f:"🇨🇷",n:"Costa Rica"},   sc:"7-0"},
  {id:27, s:"Group E",  h:{f:"🇯🇵",n:"Japan"},        a:{f:"🇨🇷",n:"Costa Rica"},   sc:"0-1"},
  {id:28, s:"Group E",  h:{f:"🇪🇸",n:"Spain"},        a:{f:"🇩🇪",n:"Germany"},      sc:"1-1"},
  {id:29, s:"Group E ⚡",h:{f:"🇯🇵",n:"Japan"},       a:{f:"🇪🇸",n:"Spain"},        sc:"2-1"},
  {id:30, s:"Group E",  h:{f:"🇩🇪",n:"Germany"},      a:{f:"🇨🇷",n:"Costa Rica"},   sc:"4-2"},
  {id:31, s:"Group F",  h:{f:"🇲🇦",n:"Morocco"},      a:{f:"🇭🇷",n:"Croatia"},      sc:"0-0"},
  {id:32, s:"Group F",  h:{f:"🇧🇪",n:"Belgium"},      a:{f:"🇨🇦",n:"Canada"},       sc:"1-0"},
  {id:33, s:"Group F",  h:{f:"🇲🇦",n:"Morocco"},      a:{f:"🇧🇪",n:"Belgium"},      sc:"2-0"},
  {id:34, s:"Group F",  h:{f:"🇭🇷",n:"Croatia"},      a:{f:"🇨🇦",n:"Canada"},       sc:"4-1"},
  {id:35, s:"Group F",  h:{f:"🇭🇷",n:"Croatia"},      a:{f:"🇧🇪",n:"Belgium"},      sc:"0-0"},
  {id:36, s:"Group F",  h:{f:"🇲🇦",n:"Morocco"},      a:{f:"🇨🇦",n:"Canada"},       sc:"2-1"},
  {id:37, s:"Group G",  h:{f:"🇨🇭",n:"Switzerland"},  a:{f:"🇨🇲",n:"Cameroon"},     sc:"1-0"},
  {id:38, s:"Group G",  h:{f:"🇧🇷",n:"Brazil"},       a:{f:"🇷🇸",n:"Serbia"},       sc:"2-0"},
  {id:39, s:"Group G",  h:{f:"🇨🇲",n:"Cameroon"},     a:{f:"🇷🇸",n:"Serbia"},       sc:"3-3"},
  {id:40, s:"Group G",  h:{f:"🇧🇷",n:"Brazil"},       a:{f:"🇨🇭",n:"Switzerland"},  sc:"1-0"},
  {id:41, s:"Group G ⚡",h:{f:"🇨🇲",n:"Cameroon"},    a:{f:"🇧🇷",n:"Brazil"},       sc:"1-0"},
  {id:42, s:"Group G",  h:{f:"🇷🇸",n:"Serbia"},       a:{f:"🇨🇭",n:"Switzerland"},  sc:"2-3"},
  {id:43, s:"Group H",  h:{f:"🇺🇾",n:"Uruguay"},      a:{f:"🇰🇷",n:"South Korea"},  sc:"0-0"},
  {id:44, s:"Group H",  h:{f:"🇵🇹",n:"Portugal"},     a:{f:"🇬🇭",n:"Ghana"},        sc:"3-2"},
  {id:45, s:"Group H",  h:{f:"🇰🇷",n:"South Korea"},  a:{f:"🇬🇭",n:"Ghana"},        sc:"2-3"},
  {id:46, s:"Group H",  h:{f:"🇵🇹",n:"Portugal"},     a:{f:"🇺🇾",n:"Uruguay"},      sc:"2-0"},
  {id:47, s:"Group H",  h:{f:"🇰🇷",n:"South Korea"},  a:{f:"🇵🇹",n:"Portugal"},     sc:"2-1"},
  {id:48, s:"Group H",  h:{f:"🇬🇭",n:"Ghana"},        a:{f:"🇺🇾",n:"Uruguay"},      sc:"0-2"},
  // ROUND OF 16
  {id:49, s:"Round of 16",h:{f:"🇳🇱",n:"Netherlands"},a:{f:"🇺🇸",n:"USA"},          sc:"3-1"},
  {id:50, s:"Round of 16",h:{f:"🇦🇷",n:"Argentina"},  a:{f:"🇦🇺",n:"Australia"},    sc:"2-1 (AET)"},
  {id:51, s:"Round of 16",h:{f:"🇫🇷",n:"France"},     a:{f:"🇵🇱",n:"Poland"},       sc:"3-1"},
  {id:52, s:"Round of 16",h:{f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",n:"England"},    a:{f:"🇸🇳",n:"Senegal"},      sc:"3-0"},
  {id:53, s:"Round of 16",h:{f:"🇯🇵",n:"Japan"},      a:{f:"🇭🇷",n:"Croatia"},      sc:"1-1 (CRO pen 3-1)"},
  {id:54, s:"Round of 16",h:{f:"🇧🇷",n:"Brazil"},     a:{f:"🇰🇷",n:"South Korea"},  sc:"4-1"},
  {id:55, s:"Round of 16 ⚡",h:{f:"🇲🇦",n:"Morocco"}, a:{f:"🇪🇸",n:"Spain"},        sc:"0-0 (MAR pen 3-0)"},
  {id:56, s:"Round of 16",h:{f:"🇵🇹",n:"Portugal"},   a:{f:"🇨🇭",n:"Switzerland"},  sc:"6-1"},
  // QUARTER-FINALS
  {id:57, s:"Quarter-final ⚡",h:{f:"🇭🇷",n:"Croatia"}, a:{f:"🇧🇷",n:"Brazil"},     sc:"1-1 (CRO pen 4-2)"},
  {id:58, s:"Quarter-final",h:{f:"🇳🇱",n:"Netherlands"},a:{f:"🇦🇷",n:"Argentina"},  sc:"2-2 (ARG pen 4-3)"},
  {id:59, s:"Quarter-final ⚡",h:{f:"🇲🇦",n:"Morocco"}, a:{f:"🇵🇹",n:"Portugal"},   sc:"1-0"},
  {id:60, s:"Quarter-final",h:{f:"🇫🇷",n:"France"},    a:{f:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",n:"England"},    sc:"2-1"},
  // SEMI-FINALS
  {id:61, s:"Semi-final",   h:{f:"🇦🇷",n:"Argentina"}, a:{f:"🇭🇷",n:"Croatia"},      sc:"3-0"},
  {id:62, s:"Semi-final",   h:{f:"🇫🇷",n:"France"},    a:{f:"🇲🇦",n:"Morocco"},      sc:"2-0"},
  // THIRD PLACE + FINAL
  {id:63, s:"3rd Place",    h:{f:"🇭🇷",n:"Croatia"},   a:{f:"🇲🇦",n:"Morocco"},      sc:"2-1"},
  {id:64, s:"🏆 THE FINAL", h:{f:"🇦🇷",n:"Argentina"}, a:{f:"🇫🇷",n:"France"},       sc:"3-3 (ARG 4-2p)"},
];

/* ── Player data for ARG vs FRA Final (match 64) ── */
const RADAR_KEYS = ["Passing","Pressing","Shooting","Defending","Dribbling","Aerial"];

import wcStatsData from "@/data/wc2022_stats.json";

const FLAGS: Record<string,string> = {
  "USA":"🇺🇸", "United States":"🇺🇸", "Mexico":"🇲🇽", "Canada":"🇨🇦", "Brazil":"🇧🇷",
  "Argentina":"🇦🇷", "France":"🇫🇷", "Spain":"🇪🇸", "Germany":"🇩🇪", "England":"🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Portugal":"🇵🇹", "Netherlands":"🇳🇱", "Morocco":"🇲🇦", "Japan":"🇯🇵", "S. Korea":"🇰🇷", "South Korea":"🇰🇷",
  "Australia":"🇦🇺", "Senegal":"🇸🇳", "Ivory Coast":"🇨🇮", "Nigeria":"🇳🇬", "Iran":"🇮🇷",
  "Saudi Arabia":"🇸🇦", "Uruguay":"🇺🇾", "Colombia":"🇨🇴", "Croatia":"🇭🇷", "Switzerland":"🇨🇭",
  "Belgium":"🇧🇪", "Poland":"🇵🇱", "Denmark":"🇩🇰", "Ecuador":"🇪🇨", "Egypt":"🇪🇬",
  "Cameroon":"🇨🇲", "Ghana":"🇬🇭", "Tunisia":"🇹🇳", "Qatar":"🇶🇦", "Wales":"🏴󠁧󠁢󠁷󠁬󠁳󠁿", "Serbia":"🇷🇸",
  "Costa Rica":"🇨🇷"
};

function TacticalFieldView() {
  const [selMatchId, setSelMatchId] = useState(wcStatsData[0].matchId);
  const [openPlayer, setOpenPlayer] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const selMatch = wcStatsData.find(m => m.matchId === selMatchId)!;
  
  const homeColor = L.maroon;
  const awayColor = "#1077C3";
  const lineColor = "rgba(255,255,255,0.8)";
  const lw = 0.55;

  const radarData = openPlayer
    ? RADAR_KEYS.map((k, i) => ({ subject: k, value: openPlayer.radar[i] }))
    : [];

  const byStage: Record<string, typeof wcStatsData> = {};
  wcStatsData.forEach(m => { if (!byStage[m.stage]) byStage[m.stage] = []; byStage[m.stage].push(m); });

  const homePlayers = selMatch.players.filter(p => p.team === selMatch.homeTeam);
  const awayPlayers = selMatch.players.filter(p => p.team === selMatch.awayTeam);
  
  const homePos = [{x:50,y:133},{x:85,y:112},{x:64,y:108},{x:36,y:108},{x:15,y:112},{x:75,y:83},{x:50,y:80},{x:25,y:83},{x:82,y:45},{x:50,y:40},{x:18,y:45}];
  const awayPos = [{x:50,y:11},{x:15,y:32},{x:36,y:36},{x:64,y:36},{x:85,y:32},{x:25,y:61},{x:50,y:64},{x:75,y:61},{x:18,y:99},{x:50,y:104},{x:82,y:99}];

  const renderedPlayers = [
    ...homePlayers.map((p, i) => ({ ...p, isHome: true, px: homePos[i % 11].x, py: homePos[i % 11].y })),
    ...awayPlayers.map((p, i) => ({ ...p, isHome: false, px: awayPos[i % 11].x, py: awayPos[i % 11].y }))
  ];

  return (
    <div style={{ background: L.bg, minHeight:"100vh", padding:"24px" }}>
      <div style={{ marginBottom:20 }}>
        <div style={{ fontSize:"0.6rem", letterSpacing:"0.3em", color:L.muted, ...MO, marginBottom:6 }}>
          STATSBOMB OPEN DATA · COMPETITION 43 · SEASON 106 · 22-PLAYER TACTICAL VIEWPORT
        </div>
        <h1 style={{ fontSize:"clamp(1.6rem,3.5vw,2.4rem)", color:L.maroon, fontWeight:700, ...CI, lineHeight:1, marginBottom:6 }}>
          Tactical Field
        </h1>
        <p style={{ color:L.muted, fontSize:"0.8rem", ...IN }}>
          Select any match to view lineups · Click a player node for StatsBomb analytics
        </p>
      </div>

      <div style={{ position:"relative", marginBottom:20, maxWidth:480 }}>
        <button onClick={() => setShowDropdown(v => !v)}
          style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
            padding:"12px 16px", borderRadius:10, cursor:"pointer",
            background:L.surface, border:`2px solid ${showDropdown ? L.maroon : L.border}`,
            transition:"border-color .15s" }}>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontSize:"0.6rem", color:L.muted, letterSpacing:"0.2em", ...MO, marginBottom:2 }}>
              {selMatch.stage.toUpperCase()}
            </div>
            <div style={{ fontWeight:700, color:L.charcoal, ...CI, fontSize:"0.92rem" }}>
              {FLAGS[selMatch.homeTeam] || "🏳️"} {selMatch.homeTeam}  vs  {FLAGS[selMatch.awayTeam] || "🏳️"} {selMatch.awayTeam}
            </div>
            <div style={{ fontSize:"0.72rem", color:L.maroon, fontWeight:700, ...MO, marginTop:1 }}>
              {selMatch.homeScore} - {selMatch.awayScore}
            </div>
          </div>
          <span style={{ color:L.maroon, fontSize:"1.2rem", transform:showDropdown?"rotate(180deg)":"", transition:"transform .2s" }}>▾</span>
        </button>

        {showDropdown && (
          <div style={{ position:"absolute", top:"calc(100% + 4px)", left:0, right:0, zIndex:50,
            background:L.surface, border:`1px solid ${L.border}`, borderRadius:10,
            boxShadow:"0 8px 32px rgba(86,4,44,0.15)", maxHeight:320, overflowY:"auto", scrollbarWidth:"none" }}>
            {Object.entries(byStage).map(([stage, matches]) => (
              <div key={stage}>
                <div style={{ padding:"7px 14px", background:L.warm, fontSize:"0.58rem", color:L.muted, letterSpacing:"0.18em", ...MO, position:"sticky", top:0 }}>
                  {stage.toUpperCase()}
                </div>
                {matches.map(m => (
                  <button key={m.matchId} onClick={() => { setSelMatchId(m.matchId); setShowDropdown(false); setOpenPlayer(null); }}
                    style={{ width:"100%", display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"8px 14px", border:"none", cursor:"pointer", textAlign:"left",
                      background: m.matchId===selMatchId ? `${L.maroon}10` : "transparent",
                      borderLeft: m.matchId===selMatchId ? `3px solid ${L.maroon}` : "3px solid transparent",
                      transition:"all .1s" }}>
                    <span style={{ fontSize:"0.8rem", color:L.charcoal, ...IN }}>
                      {FLAGS[m.homeTeam]} {m.homeTeam} vs {FLAGS[m.awayTeam]} {m.awayTeam}
                    </span>
                    <span style={{ fontSize:"0.72rem", fontWeight:700, color:L.maroon, ...MO }}>{m.homeScore} - {m.awayScore}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display:"flex", gap:16, marginBottom:16, flexWrap:"wrap" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", background:L.surface, borderRadius:8, border:`1px solid ${L.border}` }}>
          <div style={{ width:12,height:12,borderRadius:"50%",background:homeColor,flexShrink:0 }}/>
          <span style={{ fontSize:"0.75rem", color:L.charcoal, fontWeight:600, ...IN }}>{FLAGS[selMatch.homeTeam]} {selMatch.homeTeam} (Home)</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", background:L.surface, borderRadius:8, border:`1px solid ${L.border}` }}>
          <div style={{ width:12,height:12,borderRadius:"50%",background:awayColor,flexShrink:0 }}/>
          <span style={{ fontSize:"0.75rem", color:L.charcoal, fontWeight:600, ...IN }}>{FLAGS[selMatch.awayTeam]} {selMatch.awayTeam} (Away)</span>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)", gap:24, alignItems:"start" }}>
        <div style={{ background:"#1a6b1a", borderRadius:16, overflow:"hidden", border:"1px solid rgba(255,255,255,0.15)", boxShadow:"0 8px 32px rgba(0,0,0,0.4)", maxWidth:440 }}>
          <svg viewBox="0 0 100 144" style={{ width:"100%", display:"block" }} preserveAspectRatio="xMidYMid meet">
            {Array.from({length:9},(_,i)=><rect key={i} x={3} y={3+i*(138/9)} width={94} height={138/9} fill={i%2===0?"#2d8c2d":"#278027"}/>)}
            <rect x={3} y={3} width={94} height={138} fill="none" stroke={lineColor} strokeWidth={0.7}/>
            <rect x={22} y={3} width={56} height={20} fill="none" stroke={lineColor} strokeWidth={lw}/>
            <rect x={37} y={3} width={26} height={7} fill="none" stroke={lineColor} strokeWidth={lw}/>
            <rect x={44} y={0.5} width={12} height={2.5} fill="rgba(255,255,255,0.12)" stroke={lineColor} strokeWidth={0.65}/>
            <circle cx={50} cy={18} r={0.75} fill={lineColor}/>
            <path d="M 43.13 23 A 8.5 8.5 0 0 1 56.87 23" fill="none" stroke={lineColor} strokeWidth={lw}/>
            <line x1={3} y1={72} x2={97} y2={72} stroke={lineColor} strokeWidth={lw}/>
            <circle cx={50} cy={72} r={9} fill="none" stroke={lineColor} strokeWidth={lw}/>
            <circle cx={50} cy={72} r={0.8} fill={lineColor}/>
            <rect x={22} y={121} width={56} height={20} fill="none" stroke={lineColor} strokeWidth={lw}/>
            <rect x={37} y={134} width={26} height={7} fill="none" stroke={lineColor} strokeWidth={lw}/>
            <rect x={44} y={141} width={12} height={2.5} fill="rgba(255,255,255,0.12)" stroke={lineColor} strokeWidth={0.65}/>
            <circle cx={50} cy={126} r={0.75} fill={lineColor}/>
            <path d="M 43.13 121 A 8.5 8.5 0 0 0 56.87 121" fill="none" stroke={lineColor} strokeWidth={lw}/>
            <path d="M 3 5 A 2 2 0 0 0 5 3" fill="none" stroke={lineColor} strokeWidth={lw}/>
            <path d="M 95 3 A 2 2 0 0 0 97 5" fill="none" stroke={lineColor} strokeWidth={lw}/>
            <path d="M 3 139 A 2 2 0 0 1 5 141" fill="none" stroke={lineColor} strokeWidth={lw}/>
            <path d="M 95 141 A 2 2 0 0 1 97 139" fill="none" stroke={lineColor} strokeWidth={lw}/>
            <text x={50} y={140} textAnchor="middle" fontSize={3} fill="rgba(255,255,255,0.35)" fontFamily="system-ui">{selMatch.homeTeam.toUpperCase()}</text>
            <text x={50} y={7} textAnchor="middle" fontSize={3} fill="rgba(255,255,255,0.35)" fontFamily="system-ui">{selMatch.awayTeam.toUpperCase()}</text>

            {renderedPlayers.map(p => {
              const isSelected = openPlayer?.id === p.id;
              const color = p.isHome ? homeColor : awayColor;
              return (
                <g key={p.id} onClick={() => setOpenPlayer(prev => prev?.id===p.id ? null : p)} style={{cursor:"pointer"}}>
                  {isSelected && <circle cx={p.px} cy={p.py} r={7} fill={`${color}30`}/>}
                  <circle cx={p.px} cy={p.py} r={4.5} fill={color} stroke="rgba(255,255,255,0.4)" strokeWidth={0.5}/>
                  <text x={p.px} y={p.py} textAnchor="middle" dominantBaseline="central" fontSize={2.6} fill="white" fontWeight="700" fontFamily="system-ui">{p.number}</text>
                  <text x={p.px} y={p.isHome ? p.py+7 : p.py-6} textAnchor="middle" fontSize={1.9} fill="rgba(255,255,255,0.7)" fontFamily="system-ui">{p.name.split(' ').pop()}</text>
                </g>
              );
            })}
          </svg>
        </div>

        {openPlayer && (
          <div style={{ background:L.surface, borderRadius:14, border:`1px solid ${L.border}`, overflow:"hidden", boxShadow:"0 4px 20px rgba(86,4,44,0.12)" }}>
            <div style={{ background:openPlayer.isHome ? `linear-gradient(135deg,${homeColor},${L.maroonDk})` : `linear-gradient(135deg,${awayColor},#0a5a9c)`, padding:"14px 16px", position:"relative" }}>
              <button onClick={() => setOpenPlayer(null)}
                style={{ position:"absolute", top:10,right:10, width:24,height:24,borderRadius:"50%",background:"rgba(255,255,255,0.15)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center" }}>
                <X size={12} style={{color:"white"}}/>
              </button>
              <div style={{ display:"flex", alignItems:"flex-end", gap:12 }}>
                <div style={{ width:44,height:44,borderRadius:"50%",background:"rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid rgba(255,255,255,0.3)" }}>
                  <span style={{color:"white",fontSize:"1.1rem",fontWeight:700,...CI}}>#{openPlayer.number}</span>
                </div>
                <div>
                  <div style={{color:"white",fontSize:"1.1rem",fontWeight:700,...CI,lineHeight:1}}>{openPlayer.name}</div>
                  <div style={{color:"rgba(255,255,255,0.6)",fontSize:"0.62rem",...MO,marginTop:2}}>
                    {openPlayer.team} · {openPlayer.position}
                  </div>
                </div>
              </div>
            </div>

            {/* xG / xA / Dribbles / Turnovers */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:0, borderBottom:`1px solid ${L.border}` }}>
              {[
                {l:"Expected Goals (xG)",v:openPlayer.stats.xg.toFixed(2),c:L.maroon},
                {l:"Expected Assists (xA)",v:openPlayer.stats.xa.toFixed(2),c:"#1077C3"},
                {l:"Successful Dribbles",v:openPlayer.stats.dribbles,c:"#16a34a"},
                {l:"Turnovers",v:openPlayer.stats.turnovers,c:"#dc2626"},
              ].map((s,i)=>(
                <div key={s.l} style={{ padding:"10px 14px", borderRight:i%2===0?`1px solid ${L.border}`:"none", borderTop:i>=2?`1px solid ${L.border}`:"none" }}>
                  <div style={{fontSize:"1.3rem",fontWeight:900,color:s.c,...CI,lineHeight:1}}>{s.v}</div>
                  <div style={{fontSize:"0.58rem",color:L.muted,...MO,marginTop:2,lineHeight:1.3}}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Radar chart */}
            <div style={{ padding:"12px 14px" }}>
              <div style={{fontSize:"0.58rem",letterSpacing:"0.18em",color:L.muted,...MO,marginBottom:8}}>PERFORMANCE RADAR</div>
              <ResponsiveContainer width="100%" height={180}>
                <RadarChart data={radarData} margin={{top:0,right:10,bottom:0,left:10}}>
                  <PolarGrid stroke={L.border}/>
                  <PolarAngleAxis dataKey="subject" tick={{fontSize:9,fill:L.muted,fontFamily:"'DM Mono',monospace"}}/>
                  <Radar key="player-radar" name="stats" dataKey="value" stroke={openPlayer.isHome?homeColor:awayColor}
                    fill={openPlayer.isHome?homeColor:awayColor} fillOpacity={0.25}
                    isAnimationActive={false}/>
                </RadarChart>
              </ResponsiveContainer>
            </div>


          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Legacy Mode (default export) ──────────────────────── */
export default function LegacyMode({ onSwitch, onNavigateFanZone }: { onSwitch: () => void, onNavigateFanZone: () => void }) {
  const [screen, setScreen] = useState<LScreen>("groups");
  return (
    <div style={{ background: L.bg, minHeight:"100vh", fontFamily:"'Inter',sans-serif" }}>
      <LegacyNav screen={screen} onScreen={setScreen} onSwitch={onSwitch} onNavigateFanZone={onNavigateFanZone}/>
      {screen==="groups"   && <GroupStageView/>}
      {screen==="bracket"  && <BracketView/>}
      {screen==="match"    && <MatchDetailView/>}
      {screen==="awards"   && <AwardsView/>}
      {screen==="tactical" && <TacticalFieldView/>}
    </div>
  );
}
