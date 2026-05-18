"use client";

import React, { useState, useEffect } from "react";
import { LocalDB, UserProfile, Prediction } from "../utils/localDb";
import { MatchState, INITIAL_MATCH_STATE } from "../utils/matchSimulator";
import Scoreboard from "../components/Scoreboard";
import PredictionCard from "../components/PredictionCard";
import CheerMeter from "../components/CheerMeter";
import PollsWidget from "../components/PollsWidget";
import CricAIAnalyst from "../components/CricAIAnalyst";
import IplQuiz from "../components/IplQuiz";
import WinProbability from "../components/WinProbability";
import {
  LayoutDashboard,
  Sparkles,
  Trophy,
  Award,
  Gift,
  User,
  Coins,
  ChevronRight,
  Tv,
  CheckCircle,
  HelpCircle,
  Volume2,
  Calendar,
  X,
  VolumeX,
  RotateCw,
  Flame,
  Zap,
  Info,
  Crown
} from "lucide-react";

export default function Home() {
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: "user-1",
    username: "Cricket Fan 🏏",
    points: 1000,
    predictionsCount: 0,
    correctPredictions: 0,
    cheerCount: 0,
    badges: ["🏏 Rookie"],
    avatar: "🦁"
  });

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [matchState, setMatchState] = useState<MatchState>(INITIAL_MATCH_STATE);
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);

  // Onboarding & Tutorial flow states
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardStep, setOnboardStep] = useState<number>(1);
  const [onboardName, setOnboardName] = useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("🦁");

  // Spin the Wheel mini-game states
  const [spinDeg, setSpinDeg] = useState<number>(0);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [wheelResult, setWheelResult] = useState<string | null>(null);
  
  // Global Boundary Celebration State
  const [boundaryEvent, setBoundaryEvent] = useState<{ type: string; id: number } | null>(null);

  // Sync profile & onboarding state on client load
  useEffect(() => {
    const user = LocalDB.getUser();
    setUserProfile(user);
    setOnboardName(user.username === "APL_Fanatic_7" || user.username === "Cricket Fan 🏏" ? "" : user.username);
    setSelectedAvatar(user.avatar || "🦁");

    const hasOnboarded = localStorage.getItem("apl_onboarded");
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  }, []);

  // Listen for boundary events from the prediction engine
  useEffect(() => {
    const handleBoundary = (e: any) => {
      setBoundaryEvent({ type: e.detail.type, id: Date.now() });
      setTimeout(() => setBoundaryEvent(null), 4000);
    };
    window.addEventListener("BOUNDARY_HIT", handleBoundary);
    return () => window.removeEventListener("BOUNDARY_HIT", handleBoundary);
  }, []);

  // Poll live CREX scoring feed from route
  useEffect(() => {
    const fetchLiveMatch = async () => {
      try {
        setApiError(null);
        const res = await fetch("/api/match-data?live=true");
        const resData = await res.json();
        
        if (resData.success) {
          if (resData.data) {
            const liveData = resData.data;
            setMatchState((prev) => {
              const b1 = liveData.batsmen?.[0] || prev.batsman1;
              const b2 = liveData.batsmen?.[1] || prev.batsman2;
              const apiBowler = liveData.bowler || prev.bowler;
              
              return {
                ...prev,
                battingTeam: liveData.battingTeam || prev.battingTeam,
                bowlingTeam: liveData.bowlingTeam || prev.bowlingTeam,
                score: liveData.score,
                wickets: liveData.wickets,
                overs: liveData.overs,
                target: liveData.target || null,
                batsman1: {
                  name: b1.name,
                  runs: b1.runs,
                  balls: b1.balls,
                  fours: b1.fours || 0,
                  sixes: b1.sixes || 0,
                  onStrike: b1.onStrike ?? true
                },
                batsman2: {
                  name: b2.name,
                  runs: b2.runs,
                  balls: b2.balls,
                  fours: b2.fours || 0,
                  sixes: b2.sixes || 0,
                  onStrike: b2.onStrike ?? false
                },
                bowler: {
                  name: apiBowler.name,
                  overs: apiBowler.overs,
                  ballsCount: apiBowler.ballsCount || 0,
                  runsConceded: apiBowler.runs || apiBowler.runsConceded || 0,
                  wickets: apiBowler.wickets
                },
                commentary: liveData.recentCommentary.map((text: string, idx: number) => ({
                  ball: `${Math.floor(liveData.overs)}.${idx + 1}`,
                  text,
                  type: text.includes("FOUR") || text.includes("SIX") ? "boundary" : text.includes("out") || text.includes("OUT") ? "wicket" : "runs"
                }))
              };
            });
          }

          if (resData.matches) {
            setUpcomingMatches(resData.matches.filter((m: any) => m.status.toLowerCase() === "upcoming"));
          }
        }
      } catch (err: any) {
        console.error(err);
        setApiError("📡 Connecting to live IPL server feed...");
      }
    };

    fetchLiveMatch();
    const interval = setInterval(fetchLiveMatch, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleFinishOnboarding = () => {
    const finalName = onboardName.trim() || "Cricket Fan 🏏";
    const updatedUser = {
      ...userProfile,
      username: finalName,
      avatar: selectedAvatar,
      points: userProfile.points + 1000 // Onboarding welcome bonus of 1000 Coins!
    };
    
    LocalDB.saveUser(updatedUser);
    setUserProfile(updatedUser);
    localStorage.setItem("apl_onboarded", "true");
    setShowOnboarding(false);
  };

  const handleUpdateProfile = (name: string, avatar: string) => {
    const updated = {
      ...userProfile,
      username: name.trim() || userProfile.username,
      avatar: avatar
    };
    LocalDB.saveUser(updated);
    setUserProfile(updated);
  };

  // Spin The Wheel logic
  const handleSpinWheel = () => {
    if (userProfile.points < 100 || isSpinning) return;

    // Deduct spin cost (100 Coins)
    const afterDeduction = {
      ...userProfile,
      points: userProfile.points - 100
    };
    LocalDB.saveUser(afterDeduction);
    setUserProfile(afterDeduction);

    setIsSpinning(true);
    setWheelResult(null);

    // Prizes list:
    // Sector 0: 0 Coins
    // Sector 1: 50 Coins
    // Sector 2: 150 Coins
    // Sector 3: 200 Coins
    // Sector 4: 300 Coins
    // Sector 5: 500 Coins
    const prizes = [0, 50, 150, 200, 300, 500];
    const randomIndex = Math.floor(Math.random() * prizes.length);
    const winAmount = prizes[randomIndex];

    // Spin between 4 to 8 full rotations + target angle
    const sectorAngle = 360 / prizes.length;
    const targetAngle = randomIndex * sectorAngle + sectorAngle / 2;
    const extraRotations = (4 + Math.floor(Math.random() * 4)) * 360;
    const totalAngle = extraRotations + targetAngle;

    setSpinDeg(totalAngle);

    setTimeout(() => {
      setIsSpinning(false);
      const afterWin = LocalDB.addPoints(winAmount);
      setUserProfile(afterWin);
      setWheelResult(winAmount > 0 ? `🎉 You Won ${winAmount} Coins!` : "😭 Unlucky! Better luck next time!");
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row font-sans antialiased overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Ambient glowing orb highlights */}
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 rounded-full filter blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-emerald-600/5 rounded-full filter blur-[100px] pointer-events-none z-0" />

      {/* Global Boundary Celebration Overlay */}
      {boundaryEvent && (
        <div className={`fixed inset-0 pointer-events-none z-[200] flex items-center justify-center overflow-hidden mix-blend-screen transition-opacity duration-300 ${boundaryEvent.type === "4" ? "bg-blue-600/20" : "bg-emerald-500/20"}`}>
          {/* Confetti particles simulated by CSS */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-ping"></div>
          
          <div className="relative transform scale-150 animate-[bounce_0.5s_ease-out_infinite]">
            <h1 className={`text-[12rem] md:text-[18rem] font-black tracking-tighter drop-shadow-[0_0_50px_rgba(255,255,255,0.8)] ${boundaryEvent.type === "4" ? "text-blue-400" : "text-emerald-400"}`}>
              {boundaryEvent.type}
            </h1>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full blur-3xl rounded-full ${boundaryEvent.type === "4" ? "bg-blue-500" : "bg-emerald-500"} opacity-50`}></div>
            <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-4xl md:text-6xl font-black text-white whitespace-nowrap uppercase tracking-widest drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
              {boundaryEvent.type === "4" ? "BOUNDARY!" : "MAXIMUM!"}
            </p>
          </div>
        </div>
      )}

      {/* Onboarding Dialog Slider */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl relative overflow-hidden transition-all duration-300 transform scale-100 animate-[fadeIn_0.3s_ease-out]">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-600 to-yellow-500" />
            
            {onboardStep === 1 ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-indigo-600 rounded-3xl mb-4 border border-emerald-400/20 shadow-xl">
                    <Sparkles className="h-8 w-8 text-yellow-300 animate-pulse" />
                  </div>
                  <h2 className="text-2xl font-black text-white">🏆 Welcome to APL FanZone 🏆</h2>
                  <p className="text-xs text-zinc-400 mt-2">The Ultimate IPL 2026 Gamified Second-Screen Experience</p>
                </div>

                <div className="space-y-4 bg-zinc-950/50 p-6 rounded-2xl border border-zinc-850">
                  <div>
                    <label className="block text-xs font-black text-zinc-400 mb-2 uppercase tracking-widest">Select Your Spirit Animal</label>
                    <div className="grid grid-cols-4 gap-3">
                      {[
                        { emoji: "🦁", name: "Lion" },
                        { emoji: "🐘", name: "Elephant" },
                        { emoji: "🦅", name: "Eagle" },
                        { emoji: "🐯", name: "Tiger" }
                      ].map((av) => (
                        <button
                          key={av.emoji}
                          onClick={() => setSelectedAvatar(av.emoji)}
                          className={`p-3 rounded-2xl text-2xl border flex flex-col items-center justify-center transition-all ${
                            selectedAvatar === av.emoji
                              ? "bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500 text-white scale-[1.05]"
                              : "bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-zinc-400"
                          }`}
                        >
                          <span>{av.emoji}</span>
                          <span className="text-[9px] font-bold mt-1 uppercase tracking-wider">{av.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-zinc-400 mb-2 uppercase tracking-widest">Your Fan Username</label>
                    <input
                      type="text"
                      value={onboardName}
                      onChange={(e) => setOnboardName(e.target.value)}
                      placeholder="Enter custom fan name..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-white font-extrabold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-zinc-600 font-sans"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setOnboardStep(2)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-3.5 rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                  NEXT: HOW TO PLAY
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-black text-white">🎮 How to Play APL FanZone</h3>
                  <p className="text-xs text-zinc-400 mt-1">Get ready to multiply your fan experience!</p>
                </div>

                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {[
                    { title: "📡 IPL Live Scores", desc: "Live match feeds synced directly from high-speed CREX IPL API." },
                    { title: "🔮 Next-Ball Predictions", desc: "Lock predictions inside 5 seconds. Payouts automatically double your Coins!" },
                    { title: "💎 Redeem Fan Rewards", desc: "Spin the Neon Wheel to win huge bonus coins or claim achievement badges." },
                    { title: "🧠 CricAI Analyst", desc: "Ask the Gemini AI assistant for real-time predictions, pitch metrics, and deep game logic." }
                  ].map((step, index) => (
                    <div key={index} className="flex gap-4 p-3 bg-zinc-950/30 border border-zinc-850 rounded-2xl">
                      <div className="w-8 h-8 rounded-full bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 flex items-center justify-center font-black text-xs shrink-0">
                        {index + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">{step.title}</h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed font-semibold">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setOnboardStep(1)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-350 font-black py-3 rounded-2xl text-xs transition-all"
                  >
                    BACK
                  </button>
                  <button
                    onClick={handleFinishOnboarding}
                    className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 active:scale-95"
                  >
                    LET'S GO! +1,000 COINS 🪙
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-72 bg-zinc-950 lg:border-r border-zinc-900 shrink-0 flex flex-col z-40 relative">
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
              <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h1 className="text-md font-black text-white tracking-tight leading-none">APL FanZone</h1>
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-900/30 uppercase tracking-widest mt-1 inline-block animate-pulse">
                Live IPL 2026
              </span>
            </div>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "predictions", label: "Predictions", icon: Sparkles },
            { id: "leaderboard", label: "Leaderboard", icon: Trophy },
            { id: "achievements", label: "Achievements", icon: Award },
            { id: "rewards", label: "Rewards", icon: Gift },
            { id: "profile", label: "Profile", icon: User }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-xs transition-all relative ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900/50"
                }`}
              >
                {isSelected && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-full" />
                )}
                <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-yellow-300" : "text-zinc-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Stats Card footer in Sidebar */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-900/10 shrink-0">
          <div className="bg-zinc-900/80 border border-zinc-850 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-xl shrink-0">
              {userProfile.avatar || "🦁"}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-white truncate">{userProfile.username}</h4>
              <div className="flex items-center gap-1.5 text-yellow-400 font-extrabold text-[10px] mt-0.5">
                <Coins className="h-3.5 w-3.5" />
                <span>{userProfile.points} Coins</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10 overflow-y-auto">
        
        {/* Top bar with level progress & summary metrics */}
        <header className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Tab Feed · {activeTab}</span>
            <div className="h-4 w-px bg-zinc-850 hidden md:block" />
            <div className="flex items-center gap-2 bg-indigo-950/20 border border-indigo-900/30 px-3 py-1 rounded-full text-[10px] font-black text-indigo-400">
              <Award className="h-3.5 w-3.5" />
              <span>LEVEL 4 · STATE CHAMPION</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[10px] text-zinc-500 font-bold">
              XP Progress: <span className="text-indigo-400 font-black">3,200 XP</span> (35% to Level 5)
            </div>
            <div className="w-24 h-2 bg-zinc-900 border border-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full" style={{ width: "35%" }} />
            </div>
          </div>
        </header>

        {/* Render Active Tab */}
        <div className="flex-1 p-6 space-y-8 max-w-7xl mx-auto w-full">
          
          {/* TAB 1: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-[fadeIn_0.25s_ease-out]">
              {/* Welcome Headline card */}
              <div className="bg-gradient-to-r from-indigo-950/40 via-zinc-900/90 to-emerald-950/20 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial-gradient from-indigo-500/10 to-transparent pointer-events-none" />
                <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  Good afternoon, {userProfile.username} {userProfile.avatar} 🏏
                </h3>
                <p className="text-xs text-zinc-400 mt-2 max-w-xl leading-relaxed">
                  Solid accuracy! Focus on winner predictions to build your streak. Keep cheering and lock in live next-ball guesses!
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {[
                    { label: "Season Rank", val: "#42", color: "text-indigo-400" },
                    { label: "Total XP", val: "3,200 XP", color: "text-yellow-400" },
                    { label: "Streak", val: "5 Days", color: "text-orange-400" },
                    { label: "Accuracy", val: "62%", color: "text-emerald-400" }
                  ].map((st, i) => (
                    <div key={i} className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-2xl text-center">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">{st.label}</span>
                      <strong className={`text-md font-black block mt-1.5 ${st.color}`}>{st.val}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Layout grids */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Scoreboard and commentary feed */}
                <div className="lg:col-span-7 space-y-8">
                  {/* Scoreboard component */}
                  <Scoreboard matchState={matchState} apiError={apiError} />

                  {/* Crowd Cheer meter widget */}
                  <CheerMeter
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                    battingTeam={matchState.battingTeam}
                    bowlingTeam={matchState.bowlingTeam}
                  />
                </div>

                {/* Interaction sidebar */}
                <div className="lg:col-span-5 space-y-8">
                  {/* Daily Challenges */}
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-xl">
                    <h4 className="text-sm font-black text-white uppercase tracking-wider border-b border-zinc-850 pb-3 mb-4 flex items-center gap-2">
                      <Award className="h-4 w-5 text-indigo-400" />
                      Daily Challenges
                    </h4>
                    <div className="space-y-3">
                      {[
                        { title: "Daily Predictor", desc: "Make 3 predictions today", xp: "100 XP", done: userProfile.predictionsCount >= 3 },
                        { title: "Accuracy Hunter", desc: "Get 2 predictions correct today", xp: "200 XP", done: userProfile.correctPredictions >= 2 },
                        { title: "Streak Keeper", desc: "Log in and predict to keep streak", xp: "50 XP", done: true }
                      ].map((ch, idx) => (
                        <div key={idx} className="bg-zinc-950/40 border border-zinc-850/60 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                          <div>
                            <h5 className="text-xs font-black text-white flex items-center gap-2">
                              {ch.title}
                              {ch.done && <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">Done</span>}
                            </h5>
                            <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">{ch.desc}</p>
                          </div>
                          <span className="text-[10px] font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 rounded-xl shrink-0">
                            {ch.xp}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CricAI assistant chat */}
                  <CricAIAnalyst matchState={matchState} />
                </div>
              </div>

              {/* Upcoming matches grid list */}
              {upcomingMatches.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="h-4.5 w-4.5 text-indigo-400" />
                    Upcoming Matches
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingMatches.map((m: any, idx: number) => (
                      <div key={idx} className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-5 hover:border-zinc-700 transition-all">
                        <div className="flex justify-between items-center text-xs text-zinc-500 font-bold border-b border-zinc-850 pb-3 mb-4">
                          <span>Upcoming</span>
                          <span>{m.startTime || "TBD"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col items-center">
                            <span className="text-xl">🏏</span>
                            <span className="text-sm font-black text-white mt-1.5">{m.team1}</span>
                          </div>
                          <span className="text-xs font-extrabold text-zinc-600 uppercase tracking-widest">VS</span>
                          <div className="flex flex-col items-center">
                            <span className="text-xl">🛡️</span>
                            <span className="text-sm font-black text-white mt-1.5">{m.team2}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PREDICTIONS */}
          {activeTab === "predictions" && (
            <div className="space-y-8 animate-[fadeIn_0.25s_ease-out]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Predictions Deck left */}
                <div className="lg:col-span-7 space-y-8">
                  {/* Realtime Scoreboard display */}
                  <Scoreboard matchState={matchState} apiError={apiError} />

                  {/* Live Win Probability */}
                  <WinProbability
                    battingTeam={matchState.battingTeam}
                    bowlingTeam={matchState.bowlingTeam}
                    score={matchState.score}
                    wickets={matchState.wickets}
                    overs={matchState.overs}
                    target={matchState.target}
                  />

                  {/* Sentiment Poll widget */}
                  <PollsWidget
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                    battingTeam={matchState.battingTeam}
                    bowlingTeam={matchState.bowlingTeam}
                    score={matchState.score}
                    overs={matchState.overs}
                    target={matchState.target}
                  />
                </div>

                {/* Gamified Prediction widget right */}
                <div className="lg:col-span-5">
                  <PredictionCard
                    currentBall={matchState.overs === 0 ? "0.1" : `${matchState.overs.toFixed(1)}`}
                    predictionTimer={5}
                    userProfile={userProfile}
                    setUserProfile={setUserProfile}
                    lastBallOutcome={null}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LEADERBOARD */}
          {activeTab === "leaderboard" && (
            <div className="space-y-8 animate-[fadeIn_0.25s_ease-out] max-w-5xl mx-auto w-full">
              {/* Premium Leaderboard Header */}
              <div className="relative bg-gradient-to-r from-zinc-900 via-indigo-950/40 to-zinc-900 border border-zinc-850 rounded-3xl p-8 text-center overflow-hidden shadow-2xl">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none" />
                <Trophy className="h-14 w-14 text-yellow-400 mx-auto mb-4 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse" />
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">APL Global Rankings</h2>
                <p className="text-sm font-semibold text-zinc-400 mt-2 tracking-widest uppercase">Live Season Standings mapped by Net Worth & Prediction Accuracy</p>
              </div>

              {/* Podium for Top 3 */}
              <div className="flex items-end justify-center gap-4 lg:gap-8 mt-12 mb-16 pt-8">
                {(() => {
                  const players = LocalDB.getLeaderboard();
                  if (players.length < 3) return null;

                  const top3 = [players[1], players[0], players[2]]; // Order: 2nd, 1st, 3rd

                  return top3.map((player, idx) => {
                    const isFirst = idx === 1;
                    const isSecond = idx === 0;
                    const isThird = idx === 2;
                    
                    const height = isFirst ? "h-64" : isSecond ? "h-52" : "h-44";
                    const glow = isFirst ? "shadow-[0_-20px_50px_rgba(250,204,21,0.15)] border-yellow-400/50" : isSecond ? "shadow-[0_-20px_30px_rgba(161,161,170,0.1)] border-zinc-300/40" : "shadow-[0_-20px_30px_rgba(180,83,9,0.1)] border-amber-700/40";
                    const badgeColor = isFirst ? "bg-yellow-500 text-black" : isSecond ? "bg-zinc-300 text-black" : "bg-amber-700 text-white";
                    
                    return (
                      <div key={idx} className="flex flex-col items-center relative group w-1/3 max-w-[200px]">
                        {/* Player Avatar & Info floating above podium */}
                        <div className={`absolute -top-24 flex flex-col items-center transition-transform duration-500 group-hover:-translate-y-4`}>
                          <div className="relative">
                            <div className={`w-20 h-20 rounded-3xl bg-zinc-950 border-2 ${isFirst ? "border-yellow-400 w-24 h-24" : isSecond ? "border-zinc-300" : "border-amber-700"} flex items-center justify-center text-4xl shadow-xl z-10 relative`}>
                              {player.avatar || "🦁"}
                            </div>
                            {isFirst && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 w-8 h-8 text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] z-20" />}
                            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${badgeColor} w-8 h-8 rounded-full flex items-center justify-center font-black text-sm z-30 border-4 border-zinc-950`}>
                              {isFirst ? "1" : isSecond ? "2" : "3"}
                            </div>
                          </div>
                          <div className="text-center mt-4 w-max">
                            <h4 className={`font-black ${isFirst ? "text-lg text-yellow-400" : "text-sm text-white"}`}>{player.username}</h4>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{player.badges?.[0] || "Rookie"}</p>
                          </div>
                        </div>

                        {/* Podium Pillar */}
                        <div className={`w-full ${height} bg-gradient-to-t from-zinc-950 to-zinc-900 border-t-2 border-l border-r border-zinc-800/50 rounded-t-3xl ${glow} relative overflow-hidden`}>
                          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
                          <div className="absolute inset-x-0 bottom-6 flex flex-col items-center">
                            <Coins className={`h-6 w-6 mb-1 ${isFirst ? "text-yellow-400" : isSecond ? "text-zinc-300" : "text-amber-600"}`} />
                            <span className={`font-black tracking-widest ${isFirst ? "text-2xl text-yellow-400" : "text-xl text-zinc-300"}`}>
                              {player.points.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Net Worth</span>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* List for Rank 4+ */}
              <div className="space-y-3 bg-zinc-900/50 border border-zinc-850 rounded-3xl p-6 shadow-xl">
                {LocalDB.getLeaderboard().slice(3).map((player: any, index: number) => {
                  const rank = index + 4;
                  const isSelf = player.username === userProfile.username;
                  return (
                    <div
                      key={rank}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300 group ${
                        isSelf
                          ? "bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                          : "bg-zinc-950/60 border-zinc-850 hover:bg-zinc-900 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center gap-5">
                        <span className="w-8 font-black text-zinc-600 text-lg text-center group-hover:text-zinc-400 transition-colors">
                          #{rank}
                        </span>
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform shadow-md">
                          {player.avatar || "🦁"}
                        </div>
                        <div>
                          <span className="text-sm font-black text-white flex items-center gap-2">
                            {player.username}
                            {isSelf && (
                              <span className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                                You
                              </span>
                            )}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mt-0.5">
                            {player.badges?.[0] || "🏏 Rookie"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden sm:flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-xl">
                          <Flame className="h-3.5 w-3.5 text-orange-400" />
                          <span className="text-xs font-bold text-zinc-400">Streak: {Math.floor(Math.random() * 5) + 2}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl shadow-inner">
                          <Coins className="h-4 w-4 text-yellow-400" />
                          <span className="font-black text-sm text-yellow-400 tracking-wide">
                            {player.points.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ACHIEVEMENTS */}
          {activeTab === "achievements" && (
            <div className="space-y-6 animate-[fadeIn_0.25s_ease-out]">
              <div className="border-b border-zinc-850 pb-4">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-400" />
                  UNLOCKED FAN BADGES
                </h3>
                <p className="text-xs text-zinc-500 mt-1">Unlock badges by reaching Coin balances and correct guesses!</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { badge: "🏏 Rookie", req: "Default Starter Badge", done: true },
                  { badge: "🔥 Elite Predictor", req: "Reach 1,000 Coins balance", done: userProfile.points >= 1000 },
                  { badge: "🏆 Hall of Fame", req: "Reach 2,000 Coins balance", done: userProfile.points >= 2000 },
                  { badge: "🔮 Oracle", req: "Place 5 Next-Ball Predictions", done: userProfile.predictionsCount >= 5 },
                  { badge: "🎯 Snipers Eye", req: "Get 3 correct Predictions", done: userProfile.correctPredictions >= 3 },
                  { badge: "⚡ Decibel Demolisher", req: "Cheer 50 times on cheer meter", done: userProfile.cheerCount >= 50 }
                ].map((bg, idx) => (
                  <div
                    key={idx}
                    className={`p-5 rounded-3xl border relative overflow-hidden transition-all ${
                      bg.done
                        ? "bg-indigo-600/10 border-indigo-500/40 shadow-lg shadow-indigo-600/5"
                        : "bg-zinc-900/40 border-zinc-850 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 ${
                        bg.done ? "bg-indigo-600/20 text-white" : "bg-zinc-950 border border-zinc-850 text-zinc-600"
                      }`}>
                        {bg.badge.substring(0, 2)}
                      </span>
                      <div>
                        <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                          {bg.badge.substring(2)}
                          {bg.done && <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">{bg.req}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: REWARDS */}
          {activeTab === "rewards" && (
            <div className="space-y-8 animate-[fadeIn_0.25s_ease-out] max-w-xl mx-auto w-full">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center">
                <Gift className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
                <h3 className="text-lg font-black text-white">APL Neon Spin-The-Wheel</h3>
                <p className="text-xs text-zinc-500 mt-1">Spend 100 Coins to spin the wheel and win huge multiplier rewards!</p>

                {/* Spin Wheel display canvas */}
                <div className="my-8 flex justify-center relative">
                  {/* Arrow selector indicator */}
                  <div className="absolute top-[-10px] left-1/2 transform -translate-x-1/2 z-30 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[20px] border-t-yellow-400 animate-bounce" />

                  {/* Glowing neon ring */}
                  <div className="w-64 h-64 rounded-full border-[6px] border-zinc-800 shadow-[0_0_25px_rgba(99,102,241,0.2)] overflow-hidden relative transition-transform duration-[4.5s] cubic-bezier(0.1, 1, 0.1, 1)"
                    style={{
                      transform: `rotate(${-spinDeg}deg)`,
                      transition: isSpinning ? "transform 4.5s cubic-bezier(0.15, 0.95, 0.3, 1)" : "none"
                    }}
                  >
                    {/* Render Wheel sectors visually */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-900 via-zinc-950 to-emerald-950 flex items-center justify-center">
                      <div className="grid grid-cols-2 grid-rows-2 w-full h-full text-xs font-black text-white/50">
                        <div className="border-r border-b border-zinc-850 flex items-center justify-center p-4 bg-emerald-950/20">50 Coins</div>
                        <div className="border-b border-zinc-850 flex items-center justify-center p-4 bg-indigo-950/20">150 Coins</div>
                        <div className="border-r border-zinc-850 flex items-center justify-center p-4 bg-yellow-950/10">300 Coins</div>
                        <div className="flex items-center justify-center p-4 bg-red-950/10">500 Coins</div>
                      </div>
                    </div>
                  </div>
                </div>

                {wheelResult && (
                  <div className="mb-6 p-3 bg-zinc-950 border border-zinc-850 rounded-2xl text-xs font-black text-yellow-400 animate-bounce">
                    {wheelResult}
                  </div>
                )}

                <button
                  onClick={handleSpinWheel}
                  disabled={userProfile.points < 100 || isSpinning}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-1.5 ${
                    userProfile.points >= 100 && !isSpinning
                      ? "bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/10 active:scale-95 cursor-pointer"
                      : "bg-zinc-800 text-zinc-500 border border-zinc-850 cursor-not-allowed"
                  }`}
                >
                  <RotateCw className="h-4 w-4" />
                  SPIN THE WHEEL (Cost: 100 Coins)
                </button>
              </div>

              {/* IPL Trivia Quiz Component */}
              <IplQuiz userProfile={userProfile} setUserProfile={setUserProfile} />
            </div>
          )}

          {/* TAB 6: PROFILE */}
          {/* TAB 6: PROFILE */}
          {activeTab === "profile" && (
            <div className="space-y-8 animate-[fadeIn_0.25s_ease-out] max-w-4xl mx-auto w-full">
              {/* Premium Stat Header Banner */}
              <div className="relative bg-gradient-to-br from-indigo-950 via-zinc-900 to-emerald-950/40 border border-zinc-800 rounded-[2rem] p-8 overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <User className="w-64 h-64 text-indigo-400" />
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  {/* Big Avatar */}
                  <div className="relative group">
                    <div className="w-32 h-32 bg-zinc-950 border-4 border-indigo-500/50 rounded-[2rem] flex items-center justify-center text-6xl shadow-[0_0_40px_rgba(99,102,241,0.3)] transition-transform duration-500 group-hover:scale-105 group-hover:border-indigo-400">
                      {userProfile.avatar || "🦁"}
                    </div>
                    <div className="absolute -bottom-3 -right-3 bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-xl">
                      Level 4
                    </div>
                  </div>

                  {/* Core Stats Overview */}
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-4xl font-black text-white tracking-tight flex items-center justify-center md:justify-start gap-3">
                      {userProfile.username}
                      {userProfile.badges.length > 0 && (
                        <CheckCircle className="h-6 w-6 text-emerald-400" />
                      )}
                    </h2>
                    <p className="text-zinc-400 font-semibold mt-2 text-sm uppercase tracking-widest">APL Official Fan Account</p>
                    
                    <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
                      <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl px-5 py-3 flex items-center gap-3">
                        <Coins className="h-6 w-6 text-yellow-400" />
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Net Worth</p>
                          <p className="text-xl font-black text-yellow-400">{userProfile.points.toLocaleString()} Coins</p>
                        </div>
                      </div>
                      <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl px-5 py-3 flex items-center gap-3">
                        <Trophy className="h-6 w-6 text-indigo-400" />
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Win Rate</p>
                          <p className="text-xl font-black text-white">
                            {userProfile.predictionsCount > 0 ? Math.round((userProfile.correctPredictions / userProfile.predictionsCount) * 100) : 0}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Editing Controls & Advanced Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Advanced Stats */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Flame className="h-4.5 w-4.5 text-orange-400" />
                    Career Statistics
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: "Total Predictions Placed", val: userProfile.predictionsCount, color: "text-zinc-300" },
                      { label: "Correct Predictions", val: userProfile.correctPredictions, color: "text-emerald-400" },
                      { label: "Total Crowd Cheers", val: userProfile.cheerCount, color: "text-indigo-400" },
                      { label: "Badges Unlocked", val: userProfile.badges.length, color: "text-yellow-400" }
                    ].map((stat, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-zinc-950/50 border border-zinc-850 rounded-2xl">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{stat.label}</span>
                        <span className={`text-lg font-black ${stat.color}`}>{stat.val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Profile Editor */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Zap className="h-4.5 w-4.5 text-indigo-400" />
                    Fan Identity Settings
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 mb-3 uppercase tracking-widest">Fan Username</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                          type="text"
                          value={userProfile.username}
                          onChange={(e) => handleUpdateProfile(e.target.value, userProfile.avatar || "🦁")}
                          placeholder="Your epic fan name..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-sm text-white font-black focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-zinc-500 mb-3 uppercase tracking-widest">Select Spirit Animal</label>
                      <div className="grid grid-cols-4 gap-3">
                        {["🦁", "🐘", "🦅", "🐯"].map((av) => (
                          <button
                            key={av}
                            onClick={() => handleUpdateProfile(userProfile.username, av)}
                            className={`p-4 rounded-2xl text-3xl border flex items-center justify-center transition-all duration-300 ${
                              userProfile.avatar === av
                                ? "bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)] scale-[1.05]"
                                : "bg-zinc-950 border-zinc-850 text-zinc-400 hover:bg-zinc-900 hover:border-zinc-700"
                            }`}
                          >
                            {av}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
}
