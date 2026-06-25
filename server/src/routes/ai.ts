import { Router, Response } from "express";
import { authenticateJWT, AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// Initialize Groq API Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

if (!GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not defined in the environment. Falling back to local heuristic engines.");
}

/**
 * Helper function to query Groq Chat Completions API with automatic model fallback.
 */
async function generateGroqContent(systemPrompt: string, userPrompt: string): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API client is not initialized due to missing GROQ_API_KEY.");
  }

  // List of active Groq models to try in order of preference
  const modelsToTry = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768"
  ];
  let lastError: any = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[Groq] Attempting content generation with model: ${modelName}`);
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error (status ${response.status}): ${errorText}`);
      }

      const data = await response.json() as any;
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        console.log(`[Groq] Success using model: ${modelName}`);
        return text;
      }
    } catch (err: any) {
      console.warn(`[Groq] Model ${modelName} failed (could be rate-limited, deprecated or unauthorized):`, err.message || err);
      lastError = err;
    }
  }

  throw lastError || new Error("Failed to generate content with all attempted models.");
}

/**
 * Clean up markdown fences from response and parse JSON safely
 */
function cleanAndParseJSON(text: string): any {
  let cleanText = text.trim();
  if (cleanText.startsWith("```")) {
    const firstNewline = cleanText.indexOf("\n");
    if (firstNewline !== -1) {
      cleanText = cleanText.substring(firstNewline + 1);
    } else {
      cleanText = cleanText.replace(/^```[a-zA-Z]*/, "");
    }
    cleanText = cleanText.replace(/```$/, "").trim();
  }
  return JSON.parse(cleanText);
}


// 1. Post Suggest-Alignment
router.post("/suggest-alignment", authenticateJWT as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tasks, goals, timeOfDay } = req.body;

    if (!tasks || !goals) {
      return res.status(400).json({ error: "Tasks and goals are required" });
    }

    if (GROQ_API_KEY) {
      try {
        const systemPrompt = `You are an AI Productivity Counselor for the "Life Saver" task manager.
Analyze the user's workload and suggest the single best task alignment strategy.
You MUST output your response in strict JSON format matching this schema:
{
  "suggestion": "A clear 1-2 sentence recommendation for the user. e.g., 'Since it is afternoon, focus on completing [Task Name] to align with your [Goal Name] goal before energy levels dip.'",
  "predictedLoad": "High Peak Cognitive Load" | "Medium Cognitive Load" | "Low Rest State",
  "alignmentScore": <number between 0 and 100 representing how well current tasks align to active goals>
}`;

        const userPrompt = `Inputs:
- Current time of day: ${timeOfDay || "day"}
- Uncompleted Tasks: ${JSON.stringify(tasks)}
- Active Goals: ${JSON.stringify(goals)}`;

        const text = await generateGroqContent(systemPrompt, userPrompt);
        const parsed = cleanAndParseJSON(text);
        return res.json(parsed);
      } catch (err: any) {
        console.error("Groq API suggestion call failed, executing fallback:", err);
      }
    }

    // Heuristic Fallback
    const activeTasks = tasks || [];
    const activeGoals = goals || [];
    let suggestion = "AI suggests drafting your high-priority goals to set proper milestone targets.";
    let predictedLoad = "Low Rest State";
    let alignmentScore = 75;

    if (activeTasks.length > 0) {
      const topTask = activeTasks[0];
      const matchGoal = activeGoals.find((g: any) => {
        const goalName = g.name || g.title || "";
        return goalName.toLowerCase().includes((topTask.project || "").toLowerCase());
      });

      if (matchGoal) {
        const goalName = matchGoal.name || matchGoal.title || "";
        suggestion = `AI suggests scheduling "${topTask.title}" next to make progress towards your "${goalName}" goal.`;
        alignmentScore = 90;
      } else {
        suggestion = `AI suggests finishing "${topTask.title}" to reduce your current task queue and keep cognitive load manageable.`;
        alignmentScore = 80;
      }

      if (activeTasks.length >= 5) {
        predictedLoad = "High Peak Cognitive Load";
      } else if (activeTasks.length >= 2) {
        predictedLoad = "Medium Cognitive Load";
      } else {
        predictedLoad = "Low Rest State";
      }
    }

    return res.json({
      suggestion,
      predictedLoad,
      alignmentScore
    });
  } catch (error: any) {
    console.error("Suggest alignment endpoint error:", error);
    return res.status(500).json({ error: "Failed to generate alignment suggestions" });
  }
});

// 2. Post Prioritize Triage Parser
router.post("/prioritize", authenticateJWT as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { rawText, goals, existingTasks } = req.body;

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: "Raw text input is required" });
    }

    if (GROQ_API_KEY) {
      try {
        const systemPrompt = `You are an AI task triager for the "Life Saver" app.
Parse the raw text input from the user and convert it into a structured task. Use the existing goals/projects list to categorize.
You MUST output your response in strict JSON format matching this schema:
{
  "title": "A concise, actionable task title extracted from the text (e.g. 'Draft financial statement')",
  "project": "Categorized project name. Match one of the existing goal titles if relevant, or use 'General'",
  "score": <calculated priority score from 0-100 based on urgency and goal alignment>,
  "duration": "estimated duration (e.g. '30m', '1h', '45m')",
  "cognitiveLoad": "High Peak Cognitive Load" | "Medium Cognitive Load" | "Low Rest State",
  "nextStep": "Immediate milestone action or first physical step (e.g. 'Open spreadsheet and copy Q2 data')",
  "explanation": "A short 1-sentence explanation of why it was categorized and scored this way"
}`;

        const userPrompt = `Inputs:
- Raw text: "${rawText}"
- Existing goals/projects: ${JSON.stringify(goals || [])}
- Existing tasks: ${JSON.stringify(existingTasks || [])}`;

        const text = await generateGroqContent(systemPrompt, userPrompt);
        const parsed = cleanAndParseJSON(text);
        return res.json(parsed);
      } catch (err: any) {
        console.error("Groq API prioritizer call failed, executing fallback:", err);
      }
    }

    // Heuristic Fallback
    const cleanText = rawText.trim();
    const title = cleanText.length > 50 ? cleanText.substring(0, 47) + "..." : cleanText;

    // Check if any goal title matches words in the text
    let matchedProject = "General";
    if (goals && Array.isArray(goals)) {
      for (const g of goals) {
        const goalName = g.name || g.title || "";
        if (goalName && cleanText.toLowerCase().includes(goalName.toLowerCase())) {
          matchedProject = goalName;
          break;
        }
      }
    }

    return res.json({
      title,
      project: matchedProject,
      score: 65,
      duration: "45m",
      cognitiveLoad: "Medium Cognitive Load",
      nextStep: "Identify immediate milestone action manually",
      explanation: "Categorized with local offline heuristics. Enable Gemini API Key for smart prioritization."
    });
  } catch (error: any) {
    console.error("Prioritize endpoint error:", error);
    return res.status(500).json({ error: "Failed to prioritize text" });
  }
});

// 3. Post Chat endpoint for AI Coach
router.post("/chat", authenticateJWT as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, history, tasks, schedule } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    if (GROQ_API_KEY) {
      try {
        const systemPrompt = `You are the AI Cognitive Productivity Coach for the "Life Saver" task manager.
Your job is to analyze the user's workload, focus tasks, and schedule to provide highly actionable, personalized, and analytical advice.
Be concise (2-4 sentences max), encouraging, and extremely specific to their tasks and schedule.

Here is the context:
- Uncompleted Tasks: ${JSON.stringify(tasks || [])}
- Schedule for Today: ${JSON.stringify(schedule || [])}

Answer the user's question directly. Maintain a supportive, focused, and professional counselor tone.`;

        // Format history for Groq completions
        const formattedMessages = [
          { role: "system", content: systemPrompt }
        ];

        if (history && Array.isArray(history)) {
          // Take the last 6 messages to keep context concise
          const lastMessages = history.slice(-6);
          for (const msg of lastMessages) {
            formattedMessages.push({
              role: msg.sender === "user" ? "user" : "assistant",
              content: msg.text
            });
          }
        }

        formattedMessages.push({ role: "user", content: message });

        // Query Groq API
        const modelsToTry = [
          "llama-3.3-70b-versatile",
          "llama-3.1-8b-instant",
          "mixtral-8x7b-32768"
        ];
        let lastError: any = null;

        for (const modelName of modelsToTry) {
          try {
            console.log(`[Groq Chat] Attempting completion with model: ${modelName}`);
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
              },
              body: JSON.stringify({
                model: modelName,
                messages: formattedMessages
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Groq API error (status ${response.status}): ${errorText}`);
            }

            const data = await response.json() as any;
            const text = data.choices?.[0]?.message?.content;
            if (text) {
              console.log(`[Groq Chat] Success using model: ${modelName}`);
              return res.json({ text });
            }
          } catch (err: any) {
            console.warn(`[Groq Chat] Model ${modelName} failed:`, err.message || err);
            lastError = err;
          }
        }
        throw lastError || new Error("Failed to generate chat response.");
      } catch (err: any) {
        console.error("Groq Chat API failed, executing fallback:", err);
      }
    }

    // Heuristic Chat Fallback in case of missing key or failure
    let fallbackText = "I'm analyzing your current timeline. Let's optimize your workload to minimize switches.";
    const lower = message.toLowerCase();
    const highestTask = [...(tasks || [])].filter((t: any) => !t.completed).sort((a: any, b: any) => b.score - a.score)[0];

    if (lower.includes("focus") || lower.includes("today")) {
      if (highestTask) {
        fallbackText = `Today you should focus on '${highestTask.title}'. It has a high priority score of ${highestTask.score} and aligns with your '${highestTask.project}' project. Start in your next deep work block.`;
      } else {
        fallbackText = "Today you should focus on defining your core goals and scheduling new tasks to build your productivity roadmap.";
      }
    } else if (lower.includes("deadline") || lower.includes("risk")) {
      fallbackText = "Your active targets are currently being monitored. Check the Planner tab to ensure you have dedicated focus blocks scheduled.";
    } else if (lower.includes("friday") || lower.includes("finish")) {
      fallbackText = "Yes, but you must resolve any overlapping schedule events tomorrow afternoon to stay on track.";
    } else if (lower.includes("cognitive") || lower.includes("load")) {
      fallbackText = "To reduce cognitive load, bundle minor admin tasks like 'Organize Workspace Files' into a single 20-minute slot at the end of the day.";
    }

    return res.json({ text: fallbackText });
  } catch (error: any) {
    console.error("Chat endpoint error:", error);
    return res.status(500).json({ error: "Failed to generate response" });
  }
});

// 4. Post Insights endpoint for cognitive telemetry
router.post("/insights", authenticateJWT as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { tasks, goals, schedule } = req.body;

    if (GROQ_API_KEY) {
      try {
        const systemPrompt = `You are the AI Cognitive productivity analyst for the "Life Saver" app.
Analyze the user's tasks, goals, and schedule to generate a highly personalized cognitive diagnostics report.
You MUST output your response in strict JSON format matching this schema:
{
  "focusDiagnostic": "A concise 2-sentence analysis of the user's task alignment and focus stamina (e.g., 'Your active cognitive alignment shows strong mid-week stamina, with 3 high-score tasks successfully tackled...'). Make it specific to the names/durations of their actual tasks.",
  "restAssessment": "A concise 2-sentence assessment of their restoration buffers and recommendations to avoid burnout (e.g., 'Restoration intervals are solid, but maintaining a 1:5 ratio of active rest to deep concentration is recommended to preserve reserve capacity.').",
  "cognitiveCapacity": <number between 0 and 100 representing their current estimated cognitive reserve based on workload load>
}`;

        const userPrompt = `Inputs:
- Active Tasks: ${JSON.stringify(tasks || [])}
- Goals: ${JSON.stringify(goals || [])}
- Schedule: ${JSON.stringify(schedule || [])}`;

        const text = await generateGroqContent(systemPrompt, userPrompt);
        const parsed = cleanAndParseJSON(text);
        return res.json(parsed);
      } catch (err: any) {
        console.error("Groq insights API failed, executing fallback:", err);
      }
    }

    // Heuristic Fallback
    const activeTasks = tasks || [];
    const completedTasksCount = activeTasks.filter((t: any) => t.completed).length;
    const pendingTasksCount = activeTasks.filter((t: any) => !t.completed).length;
    
    let focusDiagnostic = "Your active cognitive alignment indicates optimal deep focus stamina during morning blocks, matching steady task progression.";
    if (completedTasksCount > 0) {
      focusDiagnostic = `You have completed ${completedTasksCount} tasks successfully. Your active cognitive alignment indicates excellent mid-week stamina and focus progress.`;
    }

    let restAssessment = "Buffer intervals remained steady at 30 mins. Maintaining a 1:5 ratio of active rest to deep concentration is recommended to eliminate executive burnout.";
    if (pendingTasksCount > 5) {
      restAssessment = "You have a high queue of pending tasks. We strongly recommend scheduling 15-minute active rest buffers between deep work intervals to protect your reserve capacity.";
    }

    return res.json({
      focusDiagnostic,
      restAssessment,
      cognitiveCapacity: Math.max(30, 95 - pendingTasksCount * 8)
    });
  } catch (error: any) {
    console.error("Insights endpoint error:", error);
    return res.status(500).json({ error: "Failed to generate cognitive insights" });
  }
});

export default router;

