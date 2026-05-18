import React, { useState, useRef, useEffect } from "react";
import { MatchState } from "../utils/matchSimulator";
import { MessageSquare, Send, Sparkles, AlertCircle, RefreshCw } from "lucide-react";

interface CricAIAnalystProps {
  matchState: MatchState;
}

interface Message {
  role: "user" | "bot";
  content: string;
}

const SHORTCUT_PROMPTS = [
  { label: "📊 Tactical analysis", prompt: "Give me a tactical analysis of the match right now. What should the batting team do next?" },
  { label: "🎯 Key match-up", prompt: "Who are the key players active right now, and what is the strategic matchup?" },
  { label: "📈 Win probability", prompt: "Analyze the current run rate and tell me the win probability. Who is favored?" },
  { label: "🏏 Bowling strategy", prompt: "What bowling strategy should the fielding team use against these active batsmen?" }
];

export default function CricAIAnalyst({ matchState }: CricAIAnalystProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content: "👋 Hello! I am CricAI, your expert real-time tactical analyst. Ask me anything about this match! I can analyze strike rates, player matchups, or recommend field placements. Tap a shortcut below to get started!"
    }
  ]);
  const [inputVal, setInputVal] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setError(null);
    setLoading(true);
    setInputVal("");

    const newMessages: Message[] = [...messages, { role: "user", content: textToSend }];
    setMessages(newMessages);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          matchState: matchState,
          history: newMessages.map(m => ({
            role: m.role === "user" ? "user" : "assistant",
            content: m.content
          }))
        })
      });

      const resData = await response.json();
      if (resData.success) {
        setMessages(prev => [...prev, { role: "bot", content: resData.response }]);
      } else {
        throw new Error(resData.error || "Failed to generate analytical response");
      }
    } catch (err: any) {
      console.error(err);
      setError("AI model is currently busy. Please try again!");
      setMessages(prev => [
        ...prev,
        {
          role: "bot",
          content: "⚠️ Sorry, I had trouble analyzing that match state. My connection to Gemini timed out. Let's try again!"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative flex flex-col h-[520px]">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white border border-indigo-500 shadow-lg shadow-indigo-600/20">
            <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">CRICAI CO-COACH</h3>
            <span className="text-[10px] text-zinc-500 font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-ping" />
              Gemini Pro Engine Active
            </span>
          </div>
        </div>
        <button
          onClick={() => setMessages([messages[0]])}
          className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 hover:bg-zinc-850 px-2.5 py-1.5 rounded-xl border border-zinc-850 transition-all font-semibold"
        >
          <RefreshCw className="h-3 w-3" />
          Reset Chat
        </button>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-2 mb-4 scrollbar-thin scrollbar-thumb-zinc-800">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed font-semibold transition-all ${
                m.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10 border border-indigo-500"
                  : "bg-zinc-950/70 text-zinc-300 border border-zinc-850 rounded-tl-none"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-950/70 border border-zinc-850 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] flex items-center gap-2.5">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-zinc-600 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-zinc-600 animate-bounce delay-100" />
                <span className="h-2 w-2 rounded-full bg-zinc-600 animate-bounce delay-200" />
              </div>
              <span className="text-[10px] text-zinc-500 font-extrabold tracking-wider animate-pulse">CRICAI IS ANALYZING MATCH STATES...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Shortcuts drawer */}
      <div className="shrink-0 mb-3.5 overflow-x-auto whitespace-nowrap py-1.5 scrollbar-none flex gap-2">
        {SHORTCUT_PROMPTS.map((sc, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(sc.prompt)}
            disabled={loading}
            className="inline-block bg-zinc-950 border border-zinc-850 hover:border-indigo-500 hover:bg-indigo-600/5 text-zinc-400 hover:text-white rounded-full px-3 py-1.5 text-[10px] font-black tracking-wide cursor-pointer transition-all active:scale-95 shrink-0"
          >
            {sc.label}
          </button>
        ))}
      </div>

      {/* Input container */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputVal);
        }}
        className="flex gap-2 shrink-0 bg-zinc-950 border border-zinc-850 p-1.5 rounded-2xl"
      >
        <input
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask CricAI strategic questions..."
          disabled={loading}
          className="flex-1 bg-transparent px-3 text-xs text-white focus:outline-none placeholder-zinc-600 font-semibold"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || loading}
          className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
            inputVal.trim() && !loading
              ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-md shadow-indigo-600/20"
              : "bg-zinc-900 text-zinc-700 cursor-not-allowed border border-zinc-850"
          }`}
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>
    </div>
  );
}
