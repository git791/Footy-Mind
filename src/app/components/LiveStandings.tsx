import { useState, useEffect } from "react";
import { getStandings, StandingEntry } from "../../services/api-football";

const BARLOW = { fontFamily: "'Barlow', sans-serif" };
const TEKO = { fontFamily: "'Teko', sans-serif" };

export function LiveStandings({ C }: { C: any }) {
  const [standings, setStandings] = useState<StandingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStandings().then(data => {
      setStandings(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={{ color: C.white, textAlign: "center", padding: 40, ...BARLOW }}>Loading Live Standings...</div>;
  }

  if (standings.length === 0) {
    return <div style={{ color: C.gray, textAlign: "center", padding: 40, ...BARLOW }}>No standings data available from API. Please ensure your API plan supports the requested season.</div>;
  }

  const groups = standings.reduce((acc, team) => {
    const g = team.group || "Group";
    if (!acc[g]) acc[g] = [];
    acc[g].push(team);
    return acc;
  }, {} as Record<string, StandingEntry[]>);

  return (
    <div style={{ ...BARLOW }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ color:C.white, fontSize:"1.4rem", fontWeight:600, ...TEKO }}>Live World Cup Standings</h2>
          <p style={{ color:C.gray, fontSize:"0.78rem" }}>Real-time 2026 Table from API-Football.</p>
        </div>
      </div>
      
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))", gap:16 }}>
        {Object.entries(groups).map(([gName, teams]) => (
          <div key={gName} style={{ background:C.sapphireDk, border:`1px solid ${C.borderSub}`, borderRadius:10, overflow:"hidden" }}>
            <div style={{ background:C.sapphire, padding:"8px 12px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:`1px solid ${C.borderSub}` }}>
              <span style={{ color:C.white, fontWeight:700, fontSize:"0.82rem", letterSpacing:"0.1em", ...TEKO }}>{gName.toUpperCase()}</span>
              <div style={{ display:"flex", gap:12, color:C.gray, fontSize:"0.7rem", fontWeight:700 }}>
                <span style={{ width:16, textAlign:"center" }}>P</span>
                <span style={{ width:16, textAlign:"center" }}>GD</span>
                <span style={{ width:20, textAlign:"center" }}>PTS</span>
              </div>
            </div>
            <div style={{ padding:"4px 0" }}>
              {teams.sort((a,b)=>a.rank - b.rank).map((t) => (
                <div key={t.team.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 12px", borderBottom:`1px solid ${C.border}22` }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ color:C.gray, fontSize:"0.8rem", width:12, fontWeight:600 }}>{t.rank}</span>
                    <img src={t.team.logo} alt={t.team.name} style={{ width:20, height:20, objectFit:"contain" }} />
                    <span style={{ color:C.white, fontSize:"0.85rem", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:120 }}>{t.team.name}</span>
                  </div>
                  <div style={{ display:"flex", gap:12, color:C.white, fontSize:"0.8rem" }}>
                    <span style={{ width:16, textAlign:"center" }}>{t.all?.played || 0}</span>
                    <span style={{ width:16, textAlign:"center" }}>{t.goalsDiff || 0}</span>
                    <span style={{ width:20, textAlign:"center", fontWeight:700, color:C.red }}>{t.points}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
