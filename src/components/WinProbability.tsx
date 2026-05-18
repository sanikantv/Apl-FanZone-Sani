"use client";
import React, { useState, useEffect } from "react";
import { TrendingUp, Activity } from "lucide-react";

interface WinProbabilityProps {
  battingTeam: string;
  bowlingTeam: string;
  score: number;
  wickets: number;
  overs: number;
  target: number | null | undefined;
}

// Simple heuristic-based win probability engine
function calculateWinProbability(
  score: number,
  wickets: number,
  overs: number,
  target: number | null | undefined,
): { batting: number; bowling: number } {
  // If no target, first innings — estimate based on scoring pace
  if (!target || target <= 0) {
    // First innings: batting team starts at 50/50, slight advantage grows with score
    const projectedScore = overs > 0 ? (score / overs) * 20 : 0;
    const batting = Math.min(75, Math.max(35, 50 + (projectedScore - 160) / 10 - wickets * 3));
    return { batting: Math.round(batting), bowling: Math.round(100 - batting) };
  }

  // Second innings chase logic
  const runsNeeded = target - score;
  const ballsRemaining = Math.max(1, (20 - overs) * 6);
  const wicketsLeft = 10 - wickets;
  const requiredRunRate = (runsNeeded / ballsRemaining) * 6;
  const currentRunRate = overs > 0 ? score / overs : 0;

  // Base probability from run rate comparison
  let battingProb = 50;

  // Factor 1: Required rate vs current rate
  if (currentRunRate > 0) {
    const rrDiff = currentRunRate - requiredRunRate;
    battingProb += rrDiff * 8; // each run rate difference shifts ~8%
  }

  // Factor 2: Wickets in hand (more wickets = more power later)
  battingProb += (wicketsLeft - 5) * 4;

  // Factor 3: Runs already scored toward target
  const chaseProgress = score / target;
  battingProb += (chaseProgress - 0.5) * 20;

  // Factor 4: Death overs pressure (bowling gets advantage late if RRR is high)
  if (overs > 15 && requiredRunRate > 10) {
    battingProb -= (requiredRunRate - 10) * 3;
  }

  // Factor 5: If almost won
  if (runsNeeded <= 10 && wicketsLeft > 2) {
    battingProb = Math.max(battingProb, 85);
  }

  // Factor 6: Collapse scenario
  if (wickets >= 7) {
    battingProb = Math.min(battingProb, 25);
  }
  if (wickets >= 9) {
    battingProb = Math.min(battingProb, 10);
  }

  // Clamp
  battingProb = Math.min(95, Math.max(5, battingProb));

  return {
    batting: Math.round(battingProb),
    bowling: Math.round(100 - battingProb),
  };
}

export default function WinProbability({
  battingTeam,
  bowlingTeam,
  score,
  wickets,
  overs,
  target,
}: WinProbabilityProps) {
  const [prob, setProb] = useState({ batting: 50, bowling: 50 });
  const [prevProb, setPrevProb] = useState({ batting: 50, bowling: 50 });
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    if (battingTeam === "Loading...") return;
    const newProb = calculateWinProbability(score, wickets, overs, target);

    // Track momentum shift
    const shift = newProb.batting - prob.batting;
    if (Math.abs(shift) >= 3) {
      setFlash(shift > 0 ? "batting" : "bowling");
      setTimeout(() => setFlash(null), 1500);
    }

    setPrevProb(prob);
    setProb(newProb);
  }, [score, wickets, overs, battingTeam]);

  if (battingTeam === "Loading...") {
    return (
      <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl animate-pulse">
        <div className="h-4 w-40 bg-zinc-800 rounded-full mb-4" />
        <div className="h-10 w-full bg-zinc-800 rounded-2xl mb-3" />
        <div className="h-6 w-full bg-zinc-800 rounded-full" />
      </div>
    );
  }

  const battingShift = prob.batting - prevProb.batting;
  const isChasing = target && target > 0;

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Ambient glow */}
      <div className={`absolute -top-16 -left-16 w-40 h-40 rounded-full filter blur-3xl pointer-events-none transition-all duration-1000 ${
        prob.batting > 60 ? "bg-emerald-500/15" : prob.bowling > 60 ? "bg-red-500/15" : "bg-indigo-500/10"
      }`} />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          WIN PROBABILITY
        </h3>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${Math.abs(battingShift) >= 3 ? "bg-yellow-400 animate-ping" : "bg-emerald-500"}`} />
          {Math.abs(battingShift) >= 3 ? "Momentum Shift!" : "Live Analysis"}
        </span>
      </div>

      {/* Probability Bar */}
      <div className="mb-5">
        {/* Team labels with percentages */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white">{battingTeam}</span>
            <span className={`text-2xl font-black tabular-nums transition-all duration-500 ${
              flash === "batting" ? "text-emerald-400 scale-110" : prob.batting > 55 ? "text-emerald-400" : "text-zinc-300"
            }`}>
              {prob.batting}%
            </span>
            {battingShift !== 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                battingShift > 0
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-red-400 bg-red-500/10"
              }`}>
                {battingShift > 0 ? "▲" : "▼"}{Math.abs(battingShift)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {battingShift !== 0 && (
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                battingShift < 0
                  ? "text-emerald-400 bg-emerald-500/10"
                  : "text-red-400 bg-red-500/10"
              }`}>
                {battingShift < 0 ? "▲" : "▼"}{Math.abs(battingShift)}
              </span>
            )}
            <span className={`text-2xl font-black tabular-nums transition-all duration-500 ${
              flash === "bowling" ? "text-red-400 scale-110" : prob.bowling > 55 ? "text-red-400" : "text-zinc-300"
            }`}>
              {prob.bowling}%
            </span>
            <span className="text-sm font-black text-white">{bowlingTeam}</span>
          </div>
        </div>

        {/* The main bar */}
        <div className="relative h-8 rounded-2xl overflow-hidden bg-zinc-800/50 border border-zinc-700/50">
          {/* Batting side */}
          <div
            className={`absolute left-0 top-0 bottom-0 transition-all duration-700 ease-out rounded-l-2xl ${
              prob.batting > 60
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500"
                : prob.batting > 40
                  ? "bg-gradient-to-r from-indigo-600 to-indigo-500"
                  : "bg-gradient-to-r from-zinc-600 to-zinc-500"
            }`}
            style={{ width: `${prob.batting}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite] rounded-l-2xl" />
          </div>

          {/* Bowling side fills from right */}
          <div
            className={`absolute right-0 top-0 bottom-0 transition-all duration-700 ease-out rounded-r-2xl ${
              prob.bowling > 60
                ? "bg-gradient-to-l from-red-600 to-red-500"
                : prob.bowling > 40
                  ? "bg-gradient-to-l from-orange-600 to-orange-500"
                  : "bg-gradient-to-l from-zinc-600 to-zinc-500"
            }`}
            style={{ width: `${prob.bowling}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite] rounded-r-2xl" />
          </div>

          {/* Center divider */}
          <div className="absolute top-0 bottom-0 w-0.5 bg-white/30 backdrop-blur-sm" style={{ left: `${prob.batting}%`, transform: 'translateX(-50%)' }} />
        </div>
      </div>

      {/* Match Context Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-3 text-center">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Score</span>
          <strong className="text-sm font-black text-white block mt-1">{score}/{wickets}</strong>
        </div>
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-3 text-center">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
            {isChasing ? "Needed" : "CRR"}
          </span>
          <strong className={`text-sm font-black block mt-1 ${
            isChasing && (target! - score) <= 20 ? "text-emerald-400" : "text-white"
          }`}>
            {isChasing ? `${target! - score} runs` : (overs > 0 ? (score / overs).toFixed(2) : "0.00")}
          </strong>
        </div>
        <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-3 text-center">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
            {isChasing ? "RRR" : "Proj. Total"}
          </span>
          <strong className={`text-sm font-black block mt-1 ${
            isChasing && ((target! - score) / Math.max(0.1, (20 - overs))) > 12 ? "text-red-400" : "text-white"
          }`}>
            {isChasing
              ? ((target! - score) / Math.max(0.1, (20 - overs))).toFixed(2)
              : overs > 0 ? Math.round((score / overs) * 20) : 0
            }
          </strong>
        </div>
      </div>
    </div>
  );
}
