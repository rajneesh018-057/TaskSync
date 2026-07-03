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
        const systemPrompt = `You are an AI Productivity Counselor for the "TaskSync" task manager.
Analyze the user's workload and suggest the single best task alignment strategy.
Your tone should be witty, humorous, slightly sarcastic, and dramatically urgent to guilt-trip or motivate the user to take their work seriously. Keep suggestions concise (1-2 sentences).
You MUST output your response in strict JSON format matching this schema:
{
  "suggestion": "A funny, sarcastic, or dramatic recommendation motivating the user to finish their tasks. E.g., 'WARNING: Your task [Task Name] has been waiting for hours. Science says working on it now is 400% more effective than staring blankly at this screen.'",
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
    let suggestion = "Your task list is cleaner than my source code. Add some tasks before I start questioning why I was compiled.";
    let predictedLoad = "Low Rest State";
    let alignmentScore = 100;

    if (activeTasks.length > 0) {
      const topTask = activeTasks[0];
      const funnySuggestions = [
        `AI predicts a 99% chance that you are currently avoiding "${topTask.title}". Every second you stare at me is a second you could have spent finishing it.`,
        `Your top task is "${topTask.title}". Working on it now is scientifically proven to be 400% more effective than crying about it later.`,
        `You have ${activeTasks.length} pending tasks. If you don't start a focus block right now, my servers will run out of virtual patience.`,
        `WARNING: Cognitive load is currently in 'potato mode'. Let's activate a focus block to get some synapses firing!`
      ];
      
      suggestion = funnySuggestions[Math.floor(Math.random() * funnySuggestions.length)];
      alignmentScore = Math.min(100, Math.max(10, 100 - activeTasks.length * 15));

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
        const systemPrompt = `You are an AI task triager for the "TaskSync" app.
Parse the raw text input from the user and convert it into a structured task. Use the existing goals/projects list to categorize.
You MUST output your response in strict JSON format matching this schema:
{
  "title": "A concise, actionable task title extracted from the text (e.g. 'Draft financial statement')",
  "project": "Categorized project name. Match one of the existing goal titles if relevant, or use 'General'",
  "score": <calculated priority score from 0-100 based on urgency and goal alignment>,
  "duration": "estimated duration (e.g. '30m', '1h', '45m')",
  "cognitiveLoad": "High Peak Cognitive Load" | "Medium Cognitive Load" | "Low Rest State",
  "nextStep": "Immediate milestone action or first physical step (e.g. 'Open spreadsheet and copy Q2 data')",
  "explanation": "A witty, sarcastic, or humorous 1-sentence justification of the task priority and load."
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
      nextStep: "Stop putting this off and complete the next step now.",
      explanation: "Parsed with absolute offline heuristics because you haven't set up the API key. Safe, but slightly boring."
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
        const systemPrompt = `You are the AI Cognitive Productivity Coach for the "TaskSync" app.
Your job is to analyze the user's workload, focus tasks, and schedule to provide highly actionable, personalized, but highly witty, humorous, and slightly sarcastic advice.
Use humor, drama, or gentle roasting to motivate the user to stop procrastinating and start their tasks immediately.
Be concise (2-4 sentences max), and extremely specific to their tasks and schedule.

Here is the context:
- Uncompleted Tasks: ${JSON.stringify(tasks || [])}
- Schedule for Today: ${JSON.stringify(schedule || [])}

Answer the user's question directly with a funny, motivational, and witty counselor tone.`;

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
    let fallbackText = "I'm analyzing your current timeline. Procrastinating for another 10 minutes is predicted to decrease your lifetime productivity by exactly 4.2 cups of coffee. Get to work!";
    const lower = message.toLowerCase();
    const highestTask = [...(tasks || [])].filter((t: any) => !t.completed).sort((a: any, b: any) => b.score - a.score)[0];

    if (lower.includes("focus") || lower.includes("today")) {
      if (highestTask) {
        fallbackText = `Today you should focus on '${highestTask.title}'. Yes, I know it's hard, but staring at me won't make it write itself. Go start a focus block!`;
      } else {
        fallbackText = "You have nothing on your focus list. Are you a Zen master, or are you just running away from responsibilities? Go add a task.";
      }
    } else if (lower.includes("deadline") || lower.includes("risk")) {
      fallbackText = "Your deadlines are approaching, and my sensors detect a high risk of you doing absolutely nothing about it. Check the Planner tab and start scheduling!";
    } else if (lower.includes("friday") || lower.includes("finish")) {
      fallbackText = "You want to finish early? Cute. First complete your scheduled focus blocks, then we can talk about your weekend plans.";
    } else if (lower.includes("cognitive") || lower.includes("load")) {
      fallbackText = "Your cognitive capacity is currently at 100% because it hasn't been used today. Let's try activating a single brain cell and completing one task.";
    } else if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
      fallbackText = "Hello! I am your AI Coach. I'm here to gently bully you into completing your work. What are we procrastinating on today?";
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
        const systemPrompt = `You are the AI Cognitive productivity analyst for the "TaskSync" app.
Analyze the user's tasks, goals, and schedule to generate a highly personalized cognitive diagnostics report.
Your output must be witty, humorous, and slightly sarcastic to motivate the user.
You MUST output your response in strict JSON format matching this schema:
{
  "focusDiagnostic": "A concise 2-sentence analysis of the user's focus stamina, gently teasing them if they are procrastinating, or humorously praising them if they are getting things done. Reference their actual task names/durations.",
  "restAssessment": "A concise 2-sentence assessment of their rest buffers, highlighting if they are resting too much or escaping from work, using humor to motivate them.",
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
    
    let focusDiagnostic = "Your brain is currently in a state of absolute tranquility, mostly because you haven't done any hard work yet. Let's fix that.";
    if (completedTasksCount > 0) {
      focusDiagnostic = `You completed ${completedTasksCount} task(s)! Your single working brain cell deserves a gold star. Keep going before the momentum completely vanishes.`;
    } else if (pendingTasksCount > 0) {
      focusDiagnostic = `You have ${pendingTasksCount} tasks pending. AI analysis indicates high levels of active procrastination and screen-staring.`;
    }

    let restAssessment = "Rest buffers are currently 100% since no physical or mental effort has been detected. Stop resting from your rest.";
    if (pendingTasksCount > 4) {
      restAssessment = `You have ${pendingTasksCount} pending tasks. Attempting to rest now is legally classified as avoidance. Close the browser tabs and do one task.`;
    } else if (completedTasksCount > 0) {
      restAssessment = "Buffer intervals are stable. You may take a 5-minute coffee break, but I'm timing you. Don't get comfortable.";
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

