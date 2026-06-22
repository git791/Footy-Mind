export interface Fixture {
  fixture: {
    id: number;
    status: { short: string; elapsed: number };
  };
  league: { name: string; country: string };
  teams: {
    home: { name: string; logo: string };
    away: { name: string; logo: string };
  };
  goals: { home: number; away: number };
}

export async function getLiveFixtures(): Promise<Fixture[]> {
  const apiKey = import.meta.env.VITE_FOOTBALL_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    console.warn("No API-Football key found. Ensure VITE_FOOTBALL_API_KEY is set in .env");
    return [];
  }

  try {
    const res = await fetch("https://v3.football.api-sports.io/fixtures?live=all", {
      headers: {
        "x-apisports-key": apiKey
      }
    });

    if (!res.ok) {
      throw new Error(`API-Football error: ${res.status}`);
    }

    const data = await res.json();
    if (data.response && data.response.length > 0) {
      // Filter for World Cup matches and take the top 3
      const worldCupMatches = data.response.filter((f: Fixture) => 
        f.league.name.toLowerCase().includes("world cup") || 
        f.league.name.toLowerCase().includes("fifa")
      );
      
      return worldCupMatches.slice(0, 3) as Fixture[];
    }
    
    // If no live matches, just return empty so UI handles it
    return [];
  } catch (err) {
    console.error("Failed to fetch live matches:", err);
    return [];
  }
}

export interface StandingEntry {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  form: string;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

export async function getStandings(): Promise<StandingEntry[]> {
  const apiKey = import.meta.env.VITE_FOOTBALL_API_KEY;
  if (!apiKey || apiKey === "your_api_key_here") {
    // Return mock standings
    return [
      { rank: 1, team: { id: 1, name: "Brazil", logo: "https://media.api-sports.io/football/teams/6.png" }, points: 3, goalsDiff: 2, group: "Group G", form: "W", all: { played: 1, win: 1, draw: 0, lose: 0, goals: { for: 2, against: 0 } } },
      { rank: 2, team: { id: 2, name: "Switzerland", logo: "https://media.api-sports.io/football/teams/15.png" }, points: 3, goalsDiff: 1, group: "Group G", form: "W", all: { played: 1, win: 1, draw: 0, lose: 0, goals: { for: 1, against: 0 } } },
      { rank: 3, team: { id: 3, name: "Cameroon", logo: "https://media.api-sports.io/football/teams/19.png" }, points: 0, goalsDiff: -1, group: "Group G", form: "L", all: { played: 1, win: 0, draw: 0, lose: 1, goals: { for: 0, against: 1 } } },
      { rank: 4, team: { id: 4, name: "Serbia", logo: "https://media.api-sports.io/football/teams/14.png" }, points: 0, goalsDiff: -2, group: "Group G", form: "L", all: { played: 1, win: 0, draw: 0, lose: 1, goals: { for: 0, against: 2 } } }
    ];
  }
  
  try {
    const res = await fetch("https://v3.football.api-sports.io/standings?league=1&season=2022", {
      headers: { "x-apisports-key": apiKey }
    });
    if (!res.ok) throw new Error("API-Football error: ${res.status}");
    const data = await res.json();
    if (data.response && data.response.length > 0) {
      const allStandings = data.response[0].league.standings.flat();
      return allStandings as StandingEntry[];
    }
    return [];
  } catch(e) {
    console.error(e);
    return [];
  }
}
