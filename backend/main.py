from fastapi import FastAPI, HTTPException, Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from langchain_groq import ChatGroq
from langchain_community.tools import DuckDuckGoSearchRun
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import uvicorn
import tempfile
from docling.document_converter import DocumentConverter

# Load variables from the .env file in the root folder
dotenv_path = os.path.join(os.path.dirname(__file__), "../.env")
load_dotenv(dotenv_path=dotenv_path)

app = FastAPI(title="Footy Mind - BYOK Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import Optional

class ChatRequest(BaseModel):
    message: str
    ibm_api_key: Optional[str] = None
    ibm_project_id: Optional[str] = None

# Global variable to simulate ContextForge Vector DB (in-memory)
document_context = ""

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    global document_context
    try:
        # Save uploaded file to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name
            
        # Parse with IBM Docling (Disable OCR to prevent PyTorch/RapidOCR missing model errors)
        from docling.datamodel.base_models import InputFormat
        from docling.datamodel.pipeline_options import PdfPipelineOptions
        from docling.document_converter import DocumentConverter, PdfFormatOption
        
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = False
        pipeline_options.do_table_structure = True
        
        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)
            }
        )
        result = converter.convert(tmp_path)
        markdown_text = result.document.export_to_markdown()
        
        # Save to our "ContextForge" memory store (limited to avoid token limits)
        document_context = markdown_text[:15000] 
        
        os.unlink(tmp_path)
        return {"message": "Document successfully parsed and added to Knowledge Graph!", "length": len(markdown_text)}
    except Exception as e:
        print(f"Docling Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_endpoint(body: ChatRequest):
    # Try to get Granite key from environment (fallback to Groq)
    granite_api_key = os.getenv("VITE_GRANITE_API_KEY") or os.getenv("VITE_GROQ_API_KEY")

    try:
        llm = None
        
        # 1. Try IBM WatsonX if keys are provided
        if body.ibm_api_key and body.ibm_project_id:
            try:
                from langchain_ibm import ChatWatsonx
                llm = ChatWatsonx(
                    model_id="meta-llama/llama-3-70b-instruct",
                    url="https://us-south.ml.cloud.ibm.com",
                    project_id=body.ibm_project_id,
                    params={
                        "decoding_method": "greedy",
                        "max_new_tokens": 1000,
                        "min_new_tokens": 1
                    },
                    watsonx_api_key=body.ibm_api_key
                )
                # Test the connection quickly
                llm.invoke("test")
                print("Successfully initialized IBM WatsonX!")
            except Exception as e:
                print(f"Failed to use WatsonX (falling back to Granite): {str(e)}")
                llm = None
                
        # 2. Fallback to Granite if WatsonX failed or no keys provided
        if not llm:
            if not granite_api_key or granite_api_key == "your_granite_api_key_here" or granite_api_key == "your_groq_api_key_here":
                raise HTTPException(status_code=401, detail="IBM Keys failed and Granite API Key is missing! Please check your .env file.")
                
            from langchain_groq import ChatGroq
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                api_key=granite_api_key,
                temperature=0.2,
                max_tokens=1000
            )
            print("Successfully initialized Granite fallback model!")
        
        system_prompt = f"""You are the Footy Mind AI assistant, an expert in football (soccer). 
CRITICAL RULES:
1. You MUST ONLY answer questions related to football. If a user asks about anything else, firmly decline.
2. You have a web search tool. YOU MUST USE IT whenever a user asks about the "2026 World Cup" or any recent/future events. 
3. If your search tool returns an error or no results, explicitly say "My search tool failed" so we know what happened. Do not just apologize.
4. If you don't know the answer, use your search tool.

DOCUMENT KNOWLEDGE GRAPH (Parsed by Docling):
{document_context}

Be concise and engaging."""
        
        search = DuckDuckGoSearchRun()
        llm_with_tools = llm.bind_tools([search])
        
        messages = [
            ("system", system_prompt),
            ("user", body.message)
        ]
        
        # 1. Ask LLM if it wants to use the tool or answer directly
        ai_msg = llm_with_tools.invoke(messages)
        
        # 2. Check if the LLM decided to use the DuckDuckGo search tool
        if ai_msg.tool_calls:
            messages.append(ai_msg)
            
            for tool_call in ai_msg.tool_calls:
                # If the tool call syntax is slightly malformed by Llama, fallback gracefully
                try:
                    query = tool_call["args"].get("query", body.message)
                    tool_output = search.invoke(query)
                except Exception as e:
                    tool_output = f"Search failed: {str(e)}"
                    
                # Append the search results back to the chat history
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "name": tool_call["name"],
                    "content": str(tool_output)
                })
            
            # 3. Ask the LLM to read the search results and give the final answer
            final_ai_msg = llm_with_tools.invoke(messages)
            return {"response": final_ai_msg.content.strip()}
            
        # If it didn't use a tool, just return its normal answer
        return {"response": ai_msg.content.strip()}
        
    except Exception as e:
        print(f"Error calling Granite model: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
