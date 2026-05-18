import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

// Robust mock answers in case Gemini API Key is missing or rate limited
const MOCK_AI_RESPONSES = [
  "Based on my strategic analysis, India is in a strong position, but they need to watch out for Starc's lethal reverse-swing yorkers in these death overs. Kohli needs to rotate strike and let Hardik take the boundary risks.",
  "Analyzing the bowler match-up: Mitchell Starc has historically conceded more runs on the leg-side during death overs. Hardik Pandya's strike rate increases to 178% against full-length deliveries. Bowling short at his hips would be Australia's best containment plan.",
  "Current Win Probability: India has a 64% chance of winning, but a single wicket right now could swing it 15% in Australia's favor. The next 3 balls are absolutely critical!",
  "A tactical suggestion for Australia: Pat Cummins should bring in Zampa to choke the run rate, but Virat Kohli has a solid defense against leg-spin. Mitchell Marsh needs to keep a deep mid-wicket and long-on immediately.",
  "Hardik Pandya is looking dangerous! He is batting at a strike rate of 171.4% in this match. Aussie bowlers need to feed him wide yorkers to keep him quiet.",
];

export async function POST(request: Request) {
  try {
    const { message, matchState, history } = await request.json();

    const currentScore = `${matchState.battingTeam} ${matchState.score}/${matchState.wickets} in ${matchState.overs} overs`;
    const bats1 = `${matchState.batsman1.name} (${matchState.batsman1.runs} runs off ${matchState.batsman1.balls} balls)`;
    const bats2 = `${matchState.batsman2.name} (${matchState.batsman2.runs} runs off ${matchState.batsman2.balls} balls)`;
    const bowler = `${matchState.bowler.name} (${matchState.bowler.overs} overs, ${matchState.bowler.runsConceded} runs, ${matchState.bowler.wickets} wickets)`;
    const recentComm = matchState.commentary?.slice(0, 3).map((c: any) => `[${c.ball}] ${c.text}`).join("\n") || "No commentary yet.";

    const systemPrompt = `You are "CricAI Analyst", an expert, witty, and highly strategic cricket commentator and data analyst.
You are helping a fan engage with a live second-screen cricket application.
Analyze the live match situation details below and reply to the fan's message:

[LIVE MATCH CONTEXT]
- Match: ${matchState.battingTeam} vs ${matchState.bowlingTeam}
- Current Score: ${currentScore}
- Batsman 1 (On Strike: ${matchState.batsman1.onStrike}): ${bats1}
- Batsman 2 (On Strike: ${matchState.batsman2.onStrike}): ${bats2}
- Current Bowler: ${bowler}
- Target: ${matchState.target || "N/A"}
- Recent Commentary:
${recentComm}

Provide an insightful, strategic, and engaging cricket analyst response. Keep it concise (under 4-5 sentences), full of energy, and use professional cricket terminology (e.g. "death overs", "strike rotation", "slower balls", "win probability"). Mention specific player names and current scores in your analysis.`;

    if (!GEMINI_API_KEY) {
      // Return a smart mock response if API Key is not configured
      const randomIndex = Math.floor(Math.random() * MOCK_AI_RESPONSES.length);
      // Wait for a simulated delay to feel real
      await new Promise((resolve) => setTimeout(resolve, 800));
      return NextResponse.json({
        response: `⚠️ [Demo Fallback Mode] ${MOCK_AI_RESPONSES[randomIndex]} \n\n(Add a GEMINI_API_KEY in your .env.local to activate live Google Gemini analysis!)`,
        success: true
      });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Combine history for a chat interface if present
    const chatSession = model.startChat({
      history: history?.map((h: any) => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.content }]
      })) || [],
      generationConfig: {
        maxOutputTokens: 250,
        temperature: 0.7,
      }
    });

    const result = await chatSession.sendMessage(
      `${systemPrompt}\n\nFan Question: ${message}`
    );
    const responseText = result.response.text();

    return NextResponse.json({
      response: responseText,
      success: true
    });

  } catch (error: any) {
    console.error("Gemini API error:", error.message);
    const randomIndex = Math.floor(Math.random() * MOCK_AI_RESPONSES.length);
    return NextResponse.json({
      response: `[Error / Fallback Mode] ${MOCK_AI_RESPONSES[randomIndex]}`,
      success: false,
      error: error.message
    });
  }
}
