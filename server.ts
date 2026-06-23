import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini client
let aiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY environment variable is not defined. AI functionality will fallback.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// REST route for prioritizing raw task input using Gemini
app.post("/api/prioritize", async (req, res) => {
  try {
    const { rawText, goals = [], existingTasks = [] } = req.body;
    if (!rawText) {
      return res.status(400).json({ error: "rawText is required" });
    }

    const ai = getGemini();

    if (!ai) {
      // Fallback response when GEMINI_API_KEY is not defined
      const mockResult = {
        title: rawText.substring(0, 50),
        project: "Personal Task",
        score: 75,
        duration: "45m",
        explanation: "This task was parsed locally. Add a GEMINI_API_KEY secret to enable precise AI prioritization counseling.",
        cognitiveLoad: "Medium Cognitive Load",
        nextStep: "Review requirements",
      };
      return res.json(mockResult);
    }

    const prompt = `Analyze this raw task or goal statement: "${rawText}".
    
    Match it against these user goals (if any): ${JSON.stringify(goals)}.
    Take into account existing tasks: ${JSON.stringify(existingTasks)}.

    Evaluate and return a structured JSON response:
    1. A clean, actionable task "title" (e.g. "Draft Q3 Report").
    2. A "project" or context label (e.g., "Management Essentials", "UX Audit", or "General").
    3. A priority "score" from 1 to 100 based on urgency, goal alignment, and value (higher means more immediate priority).
    4. An estimated "duration" string (such as "30m", "1h", "2h", "45m").
    5. A concise "explanation" of why this priority score and cognitive load was assigned.
    6. A specific "cognitiveLoad" categorization (choose from: "High Peak Cognitive Load", "Medium Cognitive Load", "Low Stress Restorative").
    7. A direct "nextStep" action for the user (e.g. "Archive Q2 files").`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Actionable concrete title" },
            project: { type: Type.STRING, description: "Category or Project alignment" },
            score: { type: Type.INTEGER, description: "Score between 1-100" },
            duration: { type: Type.STRING, description: "E.g. 30m, 1h, 2h" },
            explanation: { type: Type.STRING, description: "AI prioritization strategy explanation" },
            cognitiveLoad: { type: Type.STRING, description: "Cognitive load profile" },
            nextStep: { type: Type.STRING, description: "Immediate next step suggestion" },
          },
          required: ["title", "project", "score", "duration", "explanation", "cognitiveLoad", "nextStep"],
        },
      },
    });

    const resultText = response.text?.trim() || "{}";
    const parsed = JSON.parse(resultText);
    return res.json(parsed);
  } catch (error: any) {
    console.error("AI Prioritize Error:", error);
    return res.status(500).json({ error: error.message || "Priority processing failed" });
  }
});

// Assistant advice endpoint
app.post("/api/suggest-alignment", async (req, res) => {
  try {
    const { tasks = [], goals = [], timeOfDay = "morning" } = req.body;
    const ai = getGemini();

    if (!ai) {
      return res.json({
        suggestion: "AI suggests dedicating your next slot to Deep Work.",
        predictedLoad: "High Peak Cognitive Load",
        alignmentScore: 85,
      });
    }

    const prompt = `Based on these active tasks: ${JSON.stringify(tasks)}
    And these global goals: ${JSON.stringify(goals)}
    The current time of day/context is: "${timeOfDay}".

    Suggest a highly specific, personalized planning advice recommendation. 
    Format example: "AI suggests assigning 'Finalize Q3 Performance Review' to your 2:00 PM deep work block."
    Keep it encouraging, executive, professional, and matching the 'Active Calm' design language. 

    Provide:
    1. A single sentence "suggestion".
    2. "predictedLoad": e.g. "Low Stress Restorative", "Medium Cognitive Load", "High Peak Cognitive Load".
    3. "alignmentScore": 1-100 score of current capacity match.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestion: { type: Type.STRING, description: "Concise assistant recommendation" },
            predictedLoad: { type: Type.STRING, description: "Cognitive category" },
            alignmentScore: { type: Type.INTEGER, description: "Alignment index" },
          },
          required: ["suggestion", "predictedLoad", "alignmentScore"],
        },
      },
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("AI Advisor Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate AI advice" });
  }
});

// Setup Vite Dev server or production static serving
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      root: path.join(process.cwd(), "frontend"),
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "frontend", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Life Saver Server] Running on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start server", err);
});
