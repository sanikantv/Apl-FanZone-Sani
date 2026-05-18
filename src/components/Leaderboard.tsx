import React, { useEffect, useState } from "react";
import { LocalDB, UserProfile } from "../utils/localDb";
import { Trophy, ShieldAlert, Award, Star } from "lucide-react";

interface LeaderboardProps {
  userProfile: UserProfile;
}

const BADGE_DESCRIPTIONS: Record<string, { label: string; desc: string; emoji: string }> = {
  "🏏 Rookie": { label: "Rookie Fan", desc: "Started your second-screen journey", emoji: "🏏" },
  "🔥 Elite Predictor": { label: "Elite Predictor", desc: "Reached 1,000 Fan Points", emoji: "🔥" },
  "⚡ Decibel Demolisher": { label: "Decibel Demolisher", desc: "Tapped Cheer button 50+ times", emoji: "⚡" },
  "🔮 Oracle": { label: "The Oracle", desc: "Placed 5 match predictions", emoji: "🔮" },
  "🎯 Snipers Eye": { label: "Sniper's Eye", desc: "Got 3 correct predictions", emoji: "🎯" },
  "🏆 Hall of Fame": { label: "Hall of Fame", desc: "Reached 2,000 Fan Points", emoji: "🏆" },
};

const ALL_BADGES = [
  "🏏 Rookie",
  "🔥 Elite Predictor",
  "⚡ Decibel Demolisher",
  "🔮 Oracle",
  "🎯 Snipers Eye",
  "🏆 Hall of Fame",
];

export default function Leaderboard({ userProfile }: LeaderboardProps) {
  const [board, setBoard] = useState<{ username: string; points: number; badges: string[] }[]>([]);

  useEffect(() => {
    setBoard(LocalDB.getLeaderboard());
  }, [userProfile]);

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* Ranks List */}
        <div>
          <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-400" />
              FAN LEADERBOARD
            </h3>
            <span className="text-xs text-zinc-500 font-bold">Updated Live</span>
          </div>

          <div className="space-y-2">
            {board.map((item, idx) => {
              const isCurrentUser = item.username === userProfile.username;
              const rank = idx + 1;
              
              let rankBadge = <span className="text-zinc-500 font-bold font-mono text-xs w-6">{rank}</span>;
              if (rank === 1) rankBadge = <span className="text-yellow-400 font-bold text-md w-6">🥇</span>;
              else if (rank === 2) rankBadge = <span className="text-zinc-300 font-bold text-md w-6">🥈</span>;
              else if (rank === 3) rankBadge = <span className="text-amber-600 font-bold text-md w-6">🥉</span>;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isCurrentUser
                      ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400"
                      : "bg-zinc-950/40 border-zinc-850/60 text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {rankBadge}
                    <div className="flex flex-col">
                      <span className="text-xs font-black">{item.username}</span>
                      <span className="text-[10px] text-zinc-500 font-semibold flex flex-wrap gap-1 mt-0.5">
                        {item.badges.slice(0, 2).map((b, bIdx) => (
                          <span key={bIdx} className="bg-zinc-900 border border-zinc-800 rounded px-1 text-[9px]">
                            {b.split(" ")[0]}
                          </span>
                        ))}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-black font-mono">{item.points} Pts</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestones / Badges Grid */}
        <div>
          <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-400" />
              MY ACHIEVEMENTS
            </h3>
            <span className="text-xs text-zinc-500 font-bold">
              {userProfile.badges.length} / {ALL_BADGES.length} Unlocked
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {ALL_BADGES.map((badgeName) => {
              const isUnlocked = userProfile.badges.includes(badgeName);
              const badgeMeta = BADGE_DESCRIPTIONS[badgeName] || { label: badgeName, desc: "Special fan token", emoji: "🏆" };

              return (
                <div
                  key={badgeName}
                  className={`p-3 rounded-2xl border flex flex-col text-left transition-all duration-300 ${
                    isUnlocked
                      ? "bg-zinc-950 border-emerald-900/60 text-white"
                      : "bg-zinc-950/40 border-zinc-850 opacity-40 hover:opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{badgeMeta.emoji}</span>
                    {isUnlocked && (
                      <Star className="h-3 w-3 text-emerald-400 fill-emerald-400" />
                    )}
                  </div>
                  <span className="text-xs font-bold mt-2 truncate">{badgeMeta.label}</span>
                  <span className="text-[10px] text-zinc-500 font-semibold leading-tight mt-1">
                    {badgeMeta.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
