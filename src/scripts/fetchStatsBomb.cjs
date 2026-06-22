const fs = require('fs');
const path = require('path');

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status} from ${url}`);
  }
  return response.json();
}

async function main() {
  const matchesUrl = 'https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches/43/106.json';
  console.log('Fetching matches...');
  const matches = await fetchJson(matchesUrl);
  
  const finalOutput = [];

  for (const match of matches) {
    const matchId = match.match_id;
    const stage = match.competition_stage.name;
    const homeTeam = match.home_team.home_team_name;
    const awayTeam = match.away_team.away_team_name;
    const homeScore = match.home_score;
    const awayScore = match.away_score;

    console.log(`Processing match ${matchId}: ${homeTeam} vs ${awayTeam}`);

    const eventsUrl = `https://raw.githubusercontent.com/statsbomb/open-data/master/data/events/${matchId}.json`;
    let events;
    try {
      events = await fetchJson(eventsUrl);
    } catch (e) {
      console.error(`Failed to fetch events for match ${matchId}`, e);
      continue;
    }

    // Get starting XI
    const starters = new Map();
    const startingXiEvents = events.filter(e => e.type.name === 'Starting XI');
    
    for (const xi of startingXiEvents) {
      const teamName = xi.team.name;
      const tactics = xi.tactics;
      if (tactics && tactics.lineup) {
        for (const player of tactics.lineup) {
          starters.set(player.player.id, {
            id: player.player.id,
            name: player.player.name,
            team: teamName,
            jersey_number: player.jersey_number,
            position: player.position.name,
            x: 50,
            y: 50,
            stats: {
              xg: 0,
              xa: 0,
              dribbles: 0,
              turnovers: 0,
              pass_count: 0,
              pressure_count: 0,
              shot_count: 0,
              def_actions: 0,
              dribble_complete: 0,
              aerial_won: 0
            }
          });
        }
      }
    }

    // Process events to calculate stats
    for (const event of events) {
      if (!event.player || !starters.has(event.player.id)) continue;
      
      const p = starters.get(event.player.id);
      
      // xG
      if (event.type.name === 'Shot' && event.shot && event.shot.statsbomb_xg) {
        p.stats.xg += event.shot.statsbomb_xg;
        p.stats.shot_count += 1;
      }
      
      // xA / Shot assists
      if (event.type.name === 'Pass' && event.pass) {
        p.stats.pass_count += 1;
        if (event.pass.shot_assist) {
          p.stats.xa += 0.1; // simplified heuristic for xA
        }
      }
      
      // Dribbles
      if (event.type.name === 'Dribble') {
        if (event.dribble && event.dribble.outcome && event.dribble.outcome.name === 'Complete') {
          p.stats.dribbles += 1;
          p.stats.dribble_complete += 1;
        }
      }
      
      // Turnovers
      if (event.type.name === 'Dispossessed' || event.type.name === 'Miscontrol') {
        p.stats.turnovers += 1;
      }
      
      // Pressing
      if (event.type.name === 'Pressure') {
        p.stats.pressure_count += 1;
      }
      
      // Defending actions
      if (['Interception', 'Tackle', 'Clearance', 'Block'].includes(event.type.name)) {
        p.stats.def_actions += 1;
      }
      
      // Aerial
      if (event.type.name === 'Duel' && event.duel && event.duel.type && event.duel.type.name === 'Aerial Lost' === false) {
          p.stats.aerial_won += 1;
      }
    }

    const matchPlayers = [];
    for (const p of starters.values()) {
      const s = p.stats;
      const passing = Math.min(10, s.pass_count / 10);
      const pressing = Math.min(10, s.pressure_count / 5);
      const shooting = Math.min(10, s.shot_count * 2);
      const defending = Math.min(10, s.def_actions / 2);
      const dribbling = Math.min(10, s.dribble_complete * 2);
      const aerial = Math.min(10, s.aerial_won * 2);

      matchPlayers.push({
        id: p.id.toString(),
        name: p.name,
        team: p.team,
        position: p.position,
        number: p.jersey_number,
        x: p.x,
        y: p.y,
        stats: {
          xg: Number(s.xg.toFixed(2)),
          xa: Number(s.xa.toFixed(2)),
          dribbles: s.dribbles,
          turnovers: s.turnovers
        },
        radar: [
          Number(passing.toFixed(1)),
          Number(pressing.toFixed(1)),
          Number(shooting.toFixed(1)),
          Number(defending.toFixed(1)),
          Number(dribbling.toFixed(1)),
          Number(aerial.toFixed(1))
        ]
      });
    }

    finalOutput.push({
      matchId: matchId.toString(),
      stage,
      homeTeam,
      awayTeam,
      homeScore,
      awayScore,
      players: matchPlayers
    });
  }

  const outputDir = path.join(__dirname, '../data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const outputPath = path.join(outputDir, 'wc2022_stats.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2));
  console.log(`Saved output to ${outputPath}`);
}

main().catch(console.error);
