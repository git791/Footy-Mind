# Footy Mind API & Architecture Setup Instructions

## 1. Local AI Orchestration
To ensure privacy and free access, Footy Mind relies on local models and orchestration tools.

### Ollama & Granite (The Brain)
We use IBM's Granite models running via Ollama.
1. Download [Ollama](https://ollama.com/) and install it.
2. Open your terminal and pull the Granite model: `ollama run granite3-dense`
3. Ollama runs automatically on `http://127.0.0.1:11434`. Footy Mind is pre-configured to query this endpoint for the daily quizzes!

### Langflow (The Orchestrator)
Currently, Footy Mind queries Ollama directly. In the next phase, we will route requests through **Langflow**.
- Langflow is a visual UI for building multi-agent AI pipelines.
- **Where it fits:** You can build a flow in Langflow that receives the quiz request, queries a database for context, and sends an optimized prompt to Ollama. The React app will then call the Langflow endpoint instead of Ollama.

### ContextForge & Docling (Data Ingestion)
To prevent hallucinations, the Granite model needs pure context.
- **Docling:** An IBM tool that parses complex documents (PDFs, reports, unstructured web data). You can use Docling to ingest historical FIFA World Cup reports, rulebooks, and player bios.
- **ContextForge:** You use ContextForge to structure the Docling output and live Sportmonks data into a pristine Vector DB/Knowledge Graph.
- **Integration:** Langflow will query the database built by ContextForge to ground the Granite model's responses.

## 2. Firebase (Auth & XP Persistence)
1. Go to [Firebase Console](https://console.firebase.google.com/) and create a project.
2. Enable **Firestore Database** (start in test mode) and **Authentication** (enable Anonymous login).
3. Go to Project Settings -> General -> Add Web App.
4. Copy the `firebaseConfig` keys and paste them into your local `.env` file.

## 3. API-Football (Future Phase Live Data)
1. Go to [API-Football / API-Sports](https://v3.football.api-sports.io/) and ensure your account is active.
2. Ensure you have your API Key.
3. Add it to your `.env` as `VITE_FOOTBALL_API_KEY`. (When we implement the live fetch, it will indeed point to `https://v3.football.api-sports.io/`)
