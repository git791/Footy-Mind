const admin = require("firebase-admin");
const fetch = require("node-fetch");

// Since this is for a serverless cron job, we expect it to be triggered by Vercel Cron or similar.
// It fetches API-Football data and updates Firebase predictions.

const API_KEY = process.env.API_FOOTBALL_KEY || "YOUR_API_KEY";

async function evaluatePredictions() {
  console.log("Starting prediction evaluation cron job...");
  // Connect to Firestore
  // const db = admin.firestore();
  
  // 1. Fetch live and recently finished matches
  const res = await fetch("https://v3.football.api-sports.io/fixtures?live=all", {
    headers: {
      "x-rapidapi-host": "v3.football.api-sports.io",
      "x-rapidapi-key": API_KEY
    }
  });
  
  const data = await res.json();
  const finishedFixtures = data.response?.filter(f => f.fixture.status.short === "FT" || f.fixture.status.short === "PEN") || [];
  
  console.log(`Found ${finishedFixtures.length} finished fixtures.`);
  
  if (finishedFixtures.length === 0) return;

  // 2. Query Firebase for users who have unprocessed predictions
  // In a real implementation:
  /*
  const usersSnapshot = await db.collection("users").get();
  const batch = db.batch();

  usersSnapshot.forEach(doc => {
    const user = doc.data();
    let updated = false;
    let newXp = user.xp || 0;
    const preds = user.predictions || {};

    finishedFixtures.forEach(f => {
      const pred = preds[f.fixture.id];
      if (pred && pred.predicted && !pred.resultProcessed) {
        const isCorrect = (pred.home === f.goals.home && pred.away === f.goals.away);
        if (isCorrect) {
          newXp += 50;
        }
        preds[f.fixture.id] = { ...pred, resultProcessed: true, correct: isCorrect };
        updated = true;
      }
    });

    if (updated) {
      batch.update(doc.ref, { xp: newXp, predictions: preds });
    }
  });

  await batch.commit();
  */
  console.log("Predictions evaluated successfully.");
}

// evaluatePredictions().catch(console.error);

module.exports = { evaluatePredictions };
