import React from "react";
import { MatchState } from "../utils/matchSimulator";
import { Tv, Info, User, HelpCircle } from "lucide-react";

interface ScoreboardProps {
  matchState: MatchState;
  apiError: string | null;
}

export default function Scoreboard({ matchState, apiError }: ScoreboardProps) {
  const calculateSR = (runs: number, balls: number) => {
    if (balls === 0) return "0.0";
    return ((runs / balls) * 100).toFixed(1);
  };

  const calculateEcon = (runs: number, ballsCount: number, overs: number) => {
    // Convert overs to total balls
    const totalOversDec = Math.floor(overs);
    const balls = totalOversDec * 6 + ballsCount;
    if (balls === 0) return "0.00";
    return ((runs / balls) * 6).toFixed(2);
  };

  if (matchState.battingTeam === "Loading...") {
    return (
      <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
          <div className="space-y-3">
            <div className="h-3 w-40 bg-zinc-800 rounded-full" />
            <div className="h-7 w-56 bg-zinc-800 rounded-full" />
          </div>
          <div className="h-8 w-48 bg-zinc-800 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mb-6">
          <div className="md:col-span-6 space-y-5">
            <div className="h-14 w-64 bg-zinc-800 rounded-2xl" />
            <div className="flex gap-4">
              <div className="h-4 w-24 bg-zinc-800 rounded-full" />
              <div className="h-4 w-32 bg-zinc-800 rounded-full" />
            </div>
          </div>
          <div className="md:col-span-6 space-y-4">
            <div className="h-3 w-36 bg-zinc-800 rounded-full" />
            <div className="flex flex-wrap gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-9 w-9 bg-zinc-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-t border-zinc-800 pt-6">
          <div className="bg-zinc-950/50 rounded-2xl p-4 h-36 border border-zinc-800/60 flex flex-col justify-between">
            <div className="h-4 w-full bg-zinc-800/50 rounded-full mb-4" />
            <div className="h-6 w-full bg-zinc-800 rounded-full mb-2" />
            <div className="h-6 w-full bg-zinc-800 rounded-full" />
          </div>
          <div className="bg-zinc-950/50 rounded-2xl p-4 h-36 border border-zinc-800/60 flex flex-col justify-between">
            <div className="h-4 w-full bg-zinc-800/50 rounded-full mb-4" />
            <div className="h-6 w-full bg-zinc-800 rounded-full" />
            <div className="h-6 w-full bg-transparent" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header with Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-4 mb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            Live Global Matches feed
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            {matchState.battingTeam} <span className="text-zinc-500 font-medium">vs</span> {matchState.bowlingTeam}
          </h2>
        </div>

        {/* Live Sync Status Badge */}
        <div className="flex items-center gap-2 bg-emerald-950/20 border border-emerald-800/30 text-emerald-400 font-black text-xs px-4 py-2 rounded-2xl animate-pulse">
          <Tv className="h-4 w-4" />
          <span>CRICKETDATA LIVE SYNC ACTIVE</span>
        </div>
      </div>

      {apiError && (
        <div className="mb-4 p-3.5 text-xs text-yellow-300/80 bg-yellow-950/20 border border-yellow-800/40 rounded-2xl flex items-start gap-2 animate-pulse">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      {/* Main Score Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center mb-6">
        <div className="md:col-span-6">
          <div className="flex items-baseline gap-3">
            <span className="text-5xl font-black tracking-tight text-white">
              {matchState.battingTeam} {matchState.score}
            </span>
            <span className="text-3xl font-bold text-zinc-500">/</span>
            <span className="text-4xl font-extrabold text-zinc-300">{matchState.wickets}</span>
          </div>
          <div className="flex items-center gap-4 mt-2.5">
            <span className="text-sm font-semibold text-zinc-400">
              Overs <strong className="text-white">{matchState.overs.toFixed(1)}</strong> <span className="text-zinc-600">/ 20.0</span>
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
            <span className="text-sm font-semibold text-zinc-400">
              CRR: <strong className="text-emerald-400">{((matchState.score / (matchState.overs || 0.1)) || 0).toFixed(2)}</strong>
            </span>
            {matchState.target && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                <span className="text-sm font-semibold text-zinc-400">
                  Target: <strong className="text-white">{matchState.target}</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Recent Balls Timeline */}
        <div className="md:col-span-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2.5">Recent Deliveries</h4>
          <div className="flex flex-wrap items-center gap-2">
            {matchState.recentBalls.map((ball, idx) => {
              let style = "bg-zinc-800 text-zinc-300 border-zinc-700";
              if (ball === "W") {
                style = "bg-red-600 text-white font-black animate-bounce border-red-500 scale-105 shadow-md shadow-red-900/40";
              } else if (ball === "4") {
                style = "bg-blue-600 text-white font-bold border-blue-500";
              } else if (ball === "6") {
                style = "bg-emerald-600 text-white font-bold border-emerald-500 animate-pulse";
              } else if (ball === "•") {
                style = "bg-zinc-950 text-zinc-500 border-zinc-800";
              }
              return (
                <div
                  key={idx}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm font-black transition-all ${style}`}
                >
                  {ball}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Players Crease Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 border-t border-zinc-800 pt-6">
        {/* Batsmen */}
        <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/60">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 pb-2 mb-3">
            <span>Batter</span>
            <div className="flex items-center gap-6">
              <span className="w-8 text-right">R</span>
              <span className="w-8 text-right">B</span>
              <span className="w-8 text-right">4s</span>
              <span className="w-8 text-right">6s</span>
              <span className="w-12 text-right">SR</span>
            </div>
          </div>
          <div className="space-y-3">
            {[matchState.batsman1, matchState.batsman2].map((bat, idx) => (
              <div key={idx} className={`flex items-center justify-between text-sm ${bat.onStrike ? "text-white font-bold" : "text-zinc-400"}`}>
                <span className="flex items-center gap-1.5">
                  <User className={`h-4 w-4 ${bat.onStrike ? "text-emerald-400" : "text-zinc-600"}`} />
                  {bat.name}
                  {bat.onStrike && <span className="text-xs text-emerald-400 font-bold ml-1 animate-pulse">★</span>}
                </span>
                <div className="flex items-center gap-6">
                  <span className={`w-8 text-right ${bat.onStrike ? "text-emerald-400 font-black" : "text-zinc-300"}`}>{bat.runs}</span>
                  <span className="w-8 text-right text-zinc-500">{bat.balls}</span>
                  <span className="w-8 text-right text-zinc-500">{bat.fours}</span>
                  <span className="w-8 text-right text-zinc-500">{bat.sixes}</span>
                  <span className="w-12 text-right font-mono text-zinc-400">{calculateSR(bat.runs, bat.balls)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bowler */}
        <div className="bg-zinc-950/50 rounded-2xl p-4 border border-zinc-800/60">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-800 pb-2 mb-3">
            <span>Bowler</span>
            <div className="flex items-center gap-6">
              <span className="w-10 text-right">Overs</span>
              <span className="w-8 text-right">M</span>
              <span className="w-8 text-right">R</span>
              <span className="w-8 text-right">W</span>
              <span className="w-12 text-right">Econ</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-white font-bold">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {matchState.bowler.name}
            </span>
            <div className="flex items-center gap-6">
              <span className="w-10 text-right text-zinc-300">
                {matchState.bowler.overs.toFixed(1)}
              </span>
              <span className="w-8 text-right text-zinc-500">0</span>
              <span className="w-8 text-right text-zinc-300">{matchState.bowler.runsConceded}</span>
              <span className="w-8 text-right text-red-500 font-black">{matchState.bowler.wickets}</span>
              <span className="w-12 text-right font-mono text-zinc-400">
                {calculateEcon(matchState.bowler.runsConceded, matchState.bowler.ballsCount, matchState.bowler.overs)}
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Commentary Feed Section */}
      {matchState.commentary && matchState.commentary.length > 0 && (
        <div className="mt-6 border-t border-zinc-800 pt-6">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-500 mb-4 flex items-center gap-2">
            <Tv className="h-4 w-4 text-emerald-400" /> Live Commentary Feed
          </h4>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {matchState.commentary.map((comm, idx) => (
              <div key={idx} className="flex gap-4 items-start bg-zinc-950/40 p-3.5 rounded-2xl border border-zinc-800/50">
                <span className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 mt-0.5 ${
                  comm.type === "boundary" ? "bg-blue-900/40 text-blue-400 border border-blue-800/50" : 
                  comm.type === "wicket" ? "bg-red-900/40 text-red-400 border border-red-800/50" : 
                  "bg-emerald-900/40 text-emerald-400 border border-emerald-800/50"
                }`}>
                  {comm.ball}
                </span>
                <p className={`text-sm leading-snug font-medium ${comm.type === "boundary" || comm.type === "wicket" ? "text-white" : "text-zinc-300"}`}>
                  {comm.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
