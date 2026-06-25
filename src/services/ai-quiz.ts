import { db, mockStorage } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const FALLBACK_QUIZ: QuizQuestion[] = [
  { question:"Which nation has appeared in the most FIFA World Cup finals?", options:["Brazil","Germany","Italy","Argentina"], correct:1, explanation:"Germany has appeared in 8 finals." },
  { question:"Who holds the all-time record for most goals across all World Cups?", options:["Ronaldo","Pelé","Miroslav Klose","Gerd Müller"], correct:2, explanation:"Miroslav Klose scored 16 goals." },
  { question:"How many nations will compete in the 2026 World Cup?", options:["32","40","48","64"], correct:2, explanation:"The 2026 World Cup expands to 48 teams." },
  { question:"Which country hosted and won the inaugural World Cup in 1930?", options:["Brazil","Argentina","Uruguay","Italy"], correct:2, explanation:"Uruguay hosted and won the first World Cup." },
  { question:"Which player won the Golden Ball at the 2022 World Cup?", options:["Mbappé","Modrić","Messi","Martínez"], correct:2, explanation:"Lionel Messi won the Golden Ball in 2022." },
];

export async function generateDailyQuiz(recentHashes: string[]): Promise<QuizQuestion[] | null> {
  const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!groqApiKey || groqApiKey === "your_groq_api_key_here") {
    console.warn("No Groq API Key. Using fallback.");
    return null;
  }

  const dateStr = new Date("2026-06-23").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const excluded = recentHashes.length > 0 ? `Do NOT generate questions matching these recent question IDs/hashes: ${recentHashes.join(", ")}.` : "";

  const systemPrompt = `You are a football trivia master with LIVE web-search access. Today is ${dateStr}. 
Generate a 5-question multiple choice football quiz in strict JSON format. 
IMPORTANT: The questions MUST be strictly about the FIFA World Cup. Focus on verified factual World Cup trivia (e.g., historical stats, recent matches). 
${excluded}
You must return ONLY a JSON array of 5 objects. Each object must have:
- "question": string
- "options": array of 4 strings
- "correct": integer (0-3)
- "explanation": string`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192", // Base model. If compound is available, replace with "groq/compound"
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Execute live web search for unique World Cup facts and generate the quiz now." }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) throw new Error(`Groq API error: ${response.status}`);
    const data = await response.json();
    let content = data.choices[0].message.content;
    
    // Parse the JSON. Groq might wrap in an object if response_format is json_object
    const parsed = JSON.parse(content);
    const questions = Array.isArray(parsed) ? parsed : (parsed.questions || parsed.quiz || []);
    
    if (Array.isArray(questions) && questions.length >= 5) {
      return questions.slice(0, 5) as QuizQuestion[];
    }
    return null;
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return null;
  }
}

export async function getDailyQuiz(): Promise<QuizQuestion[]> {
  const dateStr = new Date().toISOString().split('T')[0];
  
  if (db) {
    const quizDoc = await getDoc(doc(db, "daily_quizzes", dateStr));
    if (quizDoc.exists()) {
      return quizDoc.data().questions;
    }
  } else if (mockStorage.quiz?.date === dateStr) {
    return mockStorage.quiz.questions;
  }

  // If not found in DB, we need recent hashes for uniqueness
  let recentHashes: string[] = [];
  if (db) {
    // We could fetch previous quizzes and hash their questions. For simplicity, mock it if not complex
    recentHashes = ["q1_hash", "q2_hash"]; 
  }

  // Generate via Groq
  let newQuiz = await generateDailyQuiz(recentHashes);
  
  if (!newQuiz) {
    newQuiz = FALLBACK_QUIZ; // Fallback
  }

  // Local deduplication validation check
  // (In a real app, we'd hash the new questions and check against db. For now, we trust the prompt constraints)

  // Save to DB so everyone gets the same daily quiz
  if (db) {
    await setDoc(doc(db, "daily_quizzes", dateStr), { questions: newQuiz });
  } else {
    mockStorage.quiz = { date: dateStr, questions: newQuiz };
  }

  return newQuiz;
}


export async function askChatbot(message: string): Promise<string> {
  // Use 127.0.0.1 instead of localhost to prevent IPv6 mapping issues on Windows
  const rawUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
  const baseUrl = rawUrl.replace(/\/+$/, '');

  try {
    const ibmApiKey = sessionStorage.getItem("ibmApiKey");
    const ibmProjectId = sessionStorage.getItem("ibmProjectId");

    const res = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        message, 
        ibm_api_key: ibmApiKey || null, 
        ibm_project_id: ibmProjectId || null 
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(()=>({}));
      return `Error from server: ${errData.detail || res.statusText}.`;
    }

    const data = await res.json();
    return data.response;
  } catch (error: any) {
    console.error("Chatbot API error:", error);
    return "Sorry, could not connect to the local Python backend. Make sure uvicorn is running!";
  }
}
