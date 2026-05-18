import React, { useState, useEffect } from "react";
import { LocalDB, UserProfile } from "../utils/localDb";
import { Zap, Flame, Trophy, Volume2 } from "lucide-react";

interface CheerMeterProps {
  userProfile: UserProfile;
  setUserProfile: (user: UserProfile) => void;
  battingTeam: string;
  bowlingTeam: string;
}

export default function CheerMeter({ userProfile, setUserProfile, battingTeam, bowlingTeam }: CheerMeterProps) {
  const [cheerInd, setCheerInd] = useState<number>(1420);
  const [cheerAus, setCheerAus] = useState<number>(1150);
  const [activeTap, setActiveTap] = useState<"left" | "right" | null>(null);
  const [tapStreak, setTapStreak] = useState<number>(0);
  const [showFlame, setShowFlame] = useState<boolean>(false);

  // Decelerate streaks slowly over time
  useEffect(() => {
    const timer = setInterval(() => {
      if (tapStreak > 0) {
        setTapStreak(prev => Math.max(0, prev - 1));
      } else {
        setShowFlame(false);
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [tapStreak]);

  const handleCheer = (team: "left" | "right") => {
    setActiveTap(team);
    setTapStreak(prev => {
      const next = prev + 1;
      if (next >= 10) setShowFlame(true);
      return next;
    });

    if (team === "left") {
      setCheerInd(prev => prev + 1);
    } else {
      setCheerAus(prev => prev + 1);
    }

    // Trigger local storage updates & award coins for participating in real-time cheers
    const updatedUser = LocalDB.incrementCheers();
    
    // Every 10 cheers, reward with 5 bonus coins!
    if (updatedUser.cheerCount % 10 === 0) {
      const rewardedUser = LocalDB.addPoints(5);
      setUserProfile(rewardedUser);
    } else {
      setUserProfile(updatedUser);
    }

    // Reset tap state
    setTimeout(() => setActiveTap(null), 120);
  };

  const totalCheers = cheerInd + cheerAus;
  const leftPct = totalCheers > 0 ? (cheerInd / totalCheers) * 100 : 50;
  const rightPct = 100 - leftPct;

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Absolute overlay elements for cheering energy */}
      {showFlame && (
        <div className="absolute inset-0 bg-yellow-500/5 animate-pulse pointer-events-none transition-all duration-300" />
      )}

      <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-5">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-emerald-400" />
          CROWD CHEER METER
        </h3>
        {tapStreak > 0 && (
          <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-extrabold text-xs px-2.5 py-0.5 rounded-full animate-bounce">
            <Flame className="h-3.5 w-3.5" />
            STREAK {tapStreak}x
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-500 mb-4">
        Tap to cheer for your team! Taps contribute to the global fan decibel index. Every 10 taps awards 5 coins!
      </p>

      {/* Thermometer Gauge Container */}
      <div className="bg-zinc-950 border border-zinc-850 h-10 rounded-2xl flex overflow-hidden relative mb-6">
        {/* Left Side: Battling Team */}
        <div
          style={{ width: `${leftPct}%` }}
          className="bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-500 flex items-center justify-start pl-4 font-black text-white text-sm transition-all duration-300 relative shadow-[inset_0_-2px_10px_rgba(0,0,0,0.5)]"
        >
          {leftPct > 15 && (
            <span className="flex items-center gap-1 shrink-0">
              🦁 {battingTeam} ({leftPct.toFixed(0)}%)
            </span>
          )}
        </div>

        {/* Right Side: Bowling Team */}
        <div
          style={{ width: `${rightPct}%` }}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-end pr-4 font-black text-black text-sm transition-all duration-300 relative shadow-[inset_0_-2px_10px_rgba(0,0,0,0.2)]"
        >
          {rightPct > 15 && (
            <span className="flex items-center gap-1 shrink-0">
              🧡 {bowlingTeam} ({rightPct.toFixed(0)}%)
            </span>
          )}
        </div>

        {/* Center Split Marker */}
        <div className="absolute top-0 bottom-0 left-1/2 -ml-0.5 w-1 bg-white/20 border-r border-black/10 z-10" />
      </div>

      {/* Interactive Cheering Tap Buttons */}
      <div className="grid grid-cols-2 gap-4">
        {/* Cheer Left */}
        <button
          onClick={() => handleCheer("left")}
          className={`py-4 rounded-2xl font-black text-sm relative overflow-hidden transition-all duration-150 transform ${
            activeTap === "left" ? "scale-[0.96] brightness-125" : "hover:-translate-y-0.5 active:scale-95"
          } bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 border border-indigo-500`}
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-xl">🙌</span>
            <span>CHEER {battingTeam}</span>
            <span className="text-[10px] opacity-75 font-semibold font-mono">{cheerInd} Cheers</span>
          </div>
        </button>

        {/* Cheer Right */}
        <button
          onClick={() => handleCheer("right")}
          className={`py-4 rounded-2xl font-black text-sm relative overflow-hidden transition-all duration-150 transform ${
            activeTap === "right" ? "scale-[0.96] brightness-125" : "hover:-translate-y-0.5 active:scale-95"
          } bg-yellow-500 text-black shadow-lg shadow-yellow-500/10 border border-yellow-400`}
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="text-xl">⚡</span>
            <span>CHEER {bowlingTeam}</span>
            <span className="text-[10px] opacity-75 font-semibold font-mono">{cheerAus} Cheers</span>
          </div>
        </button>
      </div>

      {/* Mini Cheering Stats Summary */}
      <div className="mt-5 flex items-center justify-between text-xs font-semibold text-zinc-500 bg-zinc-950/40 border border-zinc-850/60 rounded-xl p-3">
        <span className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-yellow-400" />
          Your Contributions:
        </span>
        <span className="text-white font-extrabold">{userProfile.cheerCount} taps</span>
      </div>
    </div>
  );
}
