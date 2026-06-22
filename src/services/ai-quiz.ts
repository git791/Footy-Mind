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

export async function generateLangflowQuiz(): Promise<QuizQuestion[] | null> {
  const langflowUrl = import.meta.env.VITE_LANGFLOW_API_URL;
  const langflowToken = import.meta.env.VITE_LANGFLOW_APPLICATION_TOKEN;
  const contextForgeUrl = import.meta.env.VITE_CONTEXTFORGE_ENDPOINT;
  const contextForgeKey = import.meta.env.VITE_CONTEXTFORGE_API_KEY;

  // Use ContextForge Proxy if available, otherwise direct Langflow URL
  const endpoint = contextForgeUrl || langflowUrl;
  
  if (!endpoint || endpoint === "your_langflow_api_url_here" || endpoint === "your_contextforge_endpoint_here") {
    console.warn("No Langflow/ContextForge endpoint configured. Using fallback quiz.");
    return null;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // If using ContextForge API gateway
        ...(contextForgeKey && contextForgeKey !== "your_contextforge_key_here" ? { 'x-api-key': contextForgeKey } : {}),
        // If using direct Langflow AST/Token
        ...(langflowToken && langflowToken !== "your_langflow_application_token_here" ? { 'Authorization': `Bearer ${langflowToken}` } : {})
      },
      body: JSON.stringify({
        input_value: "Generate a 5-question multiple choice football quiz in strict JSON format. It must have 'question', 'options' (array of 4 strings), 'correct' (index 0-3), and 'explanation'.",
        output_type: "chat",
        input_type: "chat",
        tweaks: {}
      })
    });

    if (!response.ok) {
      throw new Error(`AI API responded with ${response.status}`);
    }

    const data = await response.json();
    // Parse the Langflow output. Langflow usually returns nested JSON
    // e.g. data.outputs[0].outputs[0].results.message.text
    const textOutput = data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text;
    
    if (textOutput) {
      // Find JSON block in the text
      const jsonMatch = textOutput.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length >= 5) {
          return parsed as QuizQuestion[];
        }
      }
    }
    console.warn("Failed to parse Langflow quiz response, using fallback.");
    return null;
  } catch (error) {
    console.error("Langflow Quiz Generation Error:", error);
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

  // If not found in DB, generate via Langflow/ContextForge
  let newQuiz = await generateLangflowQuiz();
  
  if (!newQuiz) {
    newQuiz = FALLBACK_QUIZ; // Fallback
  }

  // Save to DB so everyone gets the same daily quiz
  if (db) {
    await setDoc(doc(db, "daily_quizzes", dateStr), { questions: newQuiz });
  } else {
    mockStorage.quiz = { date: dateStr, questions: newQuiz };
  }

  return newQuiz;
}

export async function askChatbot(message: string): Promise<string> {
  const langflowUrl = import.meta.env.VITE_LANGFLOW_API_URL;
  const contextForgeUrl = import.meta.env.VITE_CONTEXTFORGE_ENDPOINT;
  const endpoint = contextForgeUrl || langflowUrl;
  
  if (!endpoint || endpoint === "your_langflow_api_url_here" || endpoint === "your_contextforge_endpoint_here") {
    // Mock response if no keys
    await new Promise(r => setTimeout(r, 1000));
    return "I am the Pitch IQ assistant! I'm currently running in offline mode. Once you add your Langflow API keys, I can tap into my full tactical knowledge base.";
  }

  try {
    const langflowToken = import.meta.env.VITE_LANGFLOW_APPLICATION_TOKEN;
    const contextForgeKey = import.meta.env.VITE_CONTEXTFORGE_API_KEY;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(contextForgeKey && contextForgeKey !== "your_contextforge_key_here" ? { 'x-api-key': contextForgeKey } : {}),
        ...(langflowToken && langflowToken !== "your_langflow_application_token_here" ? { 'Authorization': `Bearer ${langflowToken}` } : {})
      },
      body: JSON.stringify({
        input_value: `System: You must call web search to answer this prompt. Only respond if the query is about football. \n\nUser query: ${message}`,
        output_type: "chat",
        input_type: "chat",
        tweaks: {}
      })
    });

    if (!response.ok) throw new Error("API Error");

    const data = await response.json();
    const textOutput = data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text;
    if (textOutput) return textOutput;
    
    return "Sorry, I couldn't process that tactical data.";
  } catch (error) {
    console.error("Chatbot Error:", error);
    return "Sorry, I'm having trouble connecting to the sidelines right now.";
  }
}
