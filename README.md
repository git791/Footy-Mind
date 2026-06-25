# 🧠 Footy Mind: The Ultimate AI Tactical Assistant

Welcome to **Footy Mind**! Built for the **IBM SkillsBuild Hackathon**, this project is an interactive, fully-fledged 3D tactical football dashboard supercharged by cutting-edge Generative AI. 

Standard AI chatbots fall short when dealing with highly specific domain knowledge—like the 200-page FIFA Laws of the Game, or complex UEFA tactical analyses. They guess, hallucinate, or give outdated information.

Footy Mind solves this by merging **IBM Docling**, **ContextForge** principles, **Llama 70B**, and dynamic **Agentic Web Search** into a single, cohesive experience.

---

## 🌟 The Core Architecture: IBM Docling & ContextForge

Our AI Assistant doesn't just guess; it reads the official rulebooks. We achieved this using a powerful **RAG (Retrieval-Augmented Generation)** pipeline inspired by the IBM ecosystem.

### 1. IBM Docling (The Eyes)
Traditional PDF parsers ruin the formatting of complex documents like tactical reports. They scramble tables and misinterpret columns. 
**IBM Docling** is an advanced AI parser that perfectly ingests these complex documents. When you upload a PDF via our Chatbot UI, Docling intelligently extracts the layout, tables, and paragraphs into pristine, structured text.

### 2. ContextForge (The Brain)
Once Docling parses the PDF, we need to feed it to the AI. But you can't just copy-paste 200 pages into a prompt!
This is where **ContextForge** comes in. Acting as a Knowledge Graph and Vector Database manager, it breaks the massive document down into bite-sized chunks. When you ask a question, ContextForge instantly retrieves *only* the most relevant paragraphs and injects them into the AI's memory. This ensures the AI is grounded in verified facts and never hallucinates.

---

## ✨ Features & Mini-Games

Footy Mind is packed with interactive tools to visualize and play with football data:

### 1. The 3D Tactical Pitch
Powered by `React Three Fiber`, this fully interactive 3D pitch allows you to visually explore tactical formations, view player positioning, and study football philosophies.
- **Drag & Drop:** Move players around the pitch.
- **Player Stats:** Click on any player (pitch or bench) to view their detailed tactical roles, heatmaps, and stats.

### 2. Agentic Web Search
If you ask the Chatbot about future events (like the "2026 World Cup format"), it autonomously decides to use **DuckDuckGo** to search the live web. It reads the search results, synthesizes the facts, and replies with up-to-date information.

### 3. Fan Zone & Mini-Games
- **Live Match Data:** View simulated live fixtures and make score predictions.
- **Bobblehead Game:** A fun, physics-based 2D canvas mini-game.
- **Football Dictionary & Philosophies:** Explore the history of football tactics from *Gegenpressing* to *Tiki-Taka*.

### 4. Bring Your Own Key (BYOK)
Footy Mind is designed for flexibility. Click the **Settings (Gear) Icon** in the Chatbot to securely input your **IBM WatsonX API Keys**. If you don't have WatsonX keys (or if they expire), the backend seamlessly falls back to our lightning-fast Groq Llama 3 70B model!

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 (Vite)
- Tailwind CSS (Glassmorphism styling)
- Three.js / React Three Fiber / Drei
- Lucide React

**Backend:**
- Python FastAPI
- IBM Docling (Advanced PDF Ingestion)
- LangChain Core & LangChain IBM (WatsonX integration)
- DuckDuckGo Search Tools
- Groq API (Fallback Inference)

---

## 💻 How to Run Locally

### 1. Start the Python Backend
The backend powers the Chatbot, Web Search, WatsonX integration, and IBM Docling PDF parsing.

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate  # On Windows
# source venv/bin/activate # On Mac/Linux

# Install requirements
pip install -r requirements.txt
pip install langchain-ibm # For WatsonX BYOK support

# Run the FastAPI server (runs on port 8000)
uvicorn main:app --reload
```

### 2. Start the Frontend UI
The frontend powers the 3D pitch and beautiful UI.

```bash
# In a new terminal, from the project root
npm install

# Start the Vite development server
npm run dev
```

### 3. Environment Variables
Create a `.env` file in the `backend` folder to enable the fallback LLM:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

---

## 🚀 Deployment Recommendations

To deploy this project so judges can test it live, split it into two simple services:

1. **Frontend (Vercel):** 
   Connect your GitHub repo to Vercel. It automatically detects Vite and deploys your React app for free.
2. **Backend (Render):**
   Connect your GitHub repo to Render as a "Web Service". Set the Start Command to `uvicorn main:app --host 0.0.0.0 --port $PORT`. Update the `VITE_API_BASE_URL` in your frontend environment variables to point to your new Render URL!

---

## 🤖 Acknowledgements

A special shoutout to **IBM Bob** (our nickname for the DeepMind AI assistant that worked tirelessly as our co-developer). While we guided the vision, architecture, and design, Bob helped us write the code, squash the bugs, and seamlessly integrate the IBM Docling ecosystem. Thanks, Bob! 

---

*Built for the IBM SkillsBuild Hackathon. Good luck!*