import { GoogleGenAI, Type } from "@google/genai";
import { ResearchReport, SearchResult } from "../types";

// The model we want to use (mapped from gemini-2.5-flash-lite)
const MODEL_NAME = "gemini-flash-lite-latest";

// Helper to get the AI client, prioritizing user input then env var
const getClient = (apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) {
    throw new Error("API Key is missing. Please provide it in the input field.");
  }
  return new GoogleGenAI({ apiKey: key });
};

// --- 1. The Planner ---
export const planTopic = async (userQuery: string, apiKey?: string): Promise<string> => {
  try {
    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `You are a Research Lead. The user wants to know about: "${userQuery}".
      
      Define a specific angle for this research.
      Return ONLY the refined topic string. Do not add quotes or markdown.
      
      Example Input: "Cars"
      Example Output: The transition from combustion engines to electric vehicles in 2025`,
    });
    return response.text?.trim() || userQuery;
  } catch (error) {
    console.error("Planning failed:", error);
    throw new Error("Could not plan the research topic. Check your API Key.");
  }
};

// --- 2. The Search (Mock) ---
export const fetchMockSearch = async (refinedTopic: string): Promise<SearchResult[]> => {
  // Simulating network delay for UI effect
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return [
    {
      source: "Academic Paper",
      content: `Recent studies show ${refinedTopic} is accelerating due to GPU costs dropping by 40%.`,
    },
    {
      source: "Tech Blog",
      content: `Developers are complaining that ${refinedTopic} is hard to debug, leading to a 20% slowdown in production.`,
    },
    {
      source: "Market Report",
      content: `Investors have poured $5B into ${refinedTopic} related startups in Q4 2024.`,
    },
  ];
};

// --- 3. The Mapper ---
export const mapContent = async (documents: SearchResult[], apiKey?: string): Promise<string> => {
  try {
    const ai = getClient(apiKey);
    // We process these in parallel (batching)
    const promises = documents.map(async (doc) => {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Extract key facts from: ${doc.source}: ${doc.content}`,
      });
      return response.text || "";
    });

    const results = await Promise.all(promises);
    return results.join("\n");
  } catch (error) {
    console.error("Mapping failed:", error);
    throw new Error("Could not extract facts from sources.");
  }
};

// --- 4. The Writer ---
export const writeReport = async (rawNotes: string, apiKey?: string): Promise<ResearchReport> => {
  try {
    const ai = getClient(apiKey);
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `You are a Technical Writer.
      Synthesize the following raw notes into a structured report.
      
      RAW NOTES:
      ${rawNotes}
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "The title of the research report" },
            summary: { type: Type.STRING, description: "A brief summary" },
            key_points: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of 2-5 key bullet points",
            },
            verdict: { type: Type.STRING, description: "A Final analysis or Conclusion" },
          },
          required: ["title", "summary", "key_points", "verdict"],
        },
      },
    });

    if (!response.text) throw new Error("No response generated");
    
    // Parse the JSON string
    return JSON.parse(response.text) as ResearchReport;
  } catch (error) {
    console.error("Writing failed:", error);
    throw new Error("Could not write the final report.");
  }
};