/**
 * IBM & Langflow Orchestration Layer
 * 100% Free Tier Strategy - Lightweight REST integrations
 */

/**
 * 1. IBM WatsonX / Granite (Serverless Utility)
 * Handles IAM token exchange and executes standard POST to WatsonX generation endpoints.
 */
export async function getIAMToken(apiKey: string): Promise<string> {
  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: apiKey,
    }),
  });

  if (!res.ok) throw new Error("Failed to authenticate with IBM Cloud IAM");
  const data = await res.json();
  return data.access_token;
}

export async function askGranite(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_IBM_CLOUD_IAM_APIKEY;
  const projectId = import.meta.env.VITE_WATSONX_PROJECT_ID;

  if (!apiKey || apiKey === "your_ibm_cloud_iam_apikey_here") {
    return "IBM Granite: Please configure VITE_IBM_CLOUD_IAM_APIKEY in your .env file.";
  }

  try {
    const token = await getIAMToken(apiKey);
    const url = "https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29";
    
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        input: `[INST] You are a football tactics expert. Answer the following query: ${prompt} [/INST]`,
        parameters: {
          decoding_method: "greedy",
          max_new_tokens: 500,
          stop_sequences: [],
          repetition_penalty: 1,
        },
        model_id: "ibm/granite-3-8b-instruct",
        project_id: projectId
      })
    });

    if (!res.ok) {
      console.error(await res.text());
      throw new Error(`WatsonX API error: ${res.status}`);
    }

    const data = await res.json();
    return data.results[0]?.generated_text || "No response generated.";
  } catch (error) {
    console.error("Granite Integration Error:", error);
    return "Sorry, IBM Granite is currently offline.";
  }
}

/**
 * 2. Docling MCP Proxy
 * Fetches structured Markdown text from an external Docling MCP server.
 */
export async function parseDocumentWithDocling(fileUrl: string): Promise<string> {
  const doclingEndpoint = import.meta.env.VITE_DOCLING_ENDPOINT || "http://localhost:5000/parse";
  
  try {
    const res = await fetch(doclingEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_url: fileUrl })
    });

    if (!res.ok) throw new Error("Docling parsing failed");
    const data = await res.json();
    return data.markdown_text || "";
  } catch (error) {
    console.error("Docling Error:", error);
    return "Error parsing document with Docling.";
  }
}

/**
 * 3. Langflow & IBM Context Forge Gateway
 * Invokes Langflow graph endpoint routed through Context Forge for RBAC & tokens.
 */
export async function runLangflowGraph(message: string): Promise<string> {
  const langflowUrl = import.meta.env.VITE_LANGFLOW_API_URL;
  const contextForgeUrl = import.meta.env.VITE_CONTEXTFORGE_GATEWAY_URL;
  const endpoint = contextForgeUrl || langflowUrl;
  
  if (!endpoint || endpoint === "your_langflow_api_url_here") {
    return "Langflow: Please configure your environment variables.";
  }

  try {
    const langflowToken = import.meta.env.VITE_LANGFLOW_APPLICATION_TOKEN;
    const contextForgeKey = import.meta.env.VITE_CONTEXTFORGE_API_KEY;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(contextForgeKey && { 'x-api-key': contextForgeKey }),
        ...(langflowToken && { 'Authorization': `Bearer ${langflowToken}` })
      },
      body: JSON.stringify({
        input_value: message,
        output_type: "chat",
        input_type: "chat",
        tweaks: {}
      })
    });

    if (!res.ok) throw new Error("Gateway Error");
    const data = await res.json();
    return data?.outputs?.[0]?.outputs?.[0]?.results?.message?.text || "No insights found.";
  } catch (error) {
    console.error("Langflow/Context Forge Error:", error);
    return "Failed to run Langflow graph.";
  }
}
