import React, { useState, useEffect, useCallback } from "react";
import { LocalDB, Poll, UserProfile } from "../utils/localDb";
import { BarChart3, Check, Award, RefreshCw, Flame, TrendingUp, Zap } from "lucide-react";

interface PollsWidgetProps {
  userProfile: UserProfile;
  setUserProfile: (user: UserProfile) => void;
  battingTeam: string;
  bowlingTeam: string;
  score: number;
  overs: number;
  target: number | null | undefined;
}

// Generate match-contextual polls based on live state
function generateMatchPolls(
  battingTeam: string,
  bowlingTeam: string,
  score: number,
  overs: number,
  target: number | null | undefined,
): Poll[] {
  const bat = battingTeam || "Team A";
  const bowl = bowlingTeam || "Team B";

  const allPolls: Poll[] = [
    {
      id: `live-winner-${bat}-${bowl}`,
      question: `🏆 Who will win this match?`,
      options: [
        { text: `${bat} will dominate`, votes: Math.floor(Math.random() * 120) + 60 },
        { text: `${bowl} will fight back`, votes: Math.floor(Math.random() * 100) + 50 },
        { text: `It'll go down to the wire!`, votes: Math.floor(Math.random() * 80) + 40 },
      ],
      category: "match",
    },
    {
      id: `live-powerplay-${bat}`,
      question: `⚡ How many runs will ${bat} score in the next 2 overs?`,
      options: [
        { text: "Less than 12 runs", votes: Math.floor(Math.random() * 60) + 30 },
        { text: "12-20 runs", votes: Math.floor(Math.random() * 80) + 40 },
        { text: "20+ runs (fireworks!)", votes: Math.floor(Math.random() * 50) + 25 },
      ],
      category: "batting",
    },
    {
      id: `live-wicket-${bowl}`,
      question: `🎯 Will ${bowl} take a wicket in the next 3 overs?`,
      options: [
        { text: "Yes, definitely!", votes: Math.floor(Math.random() * 100) + 50 },
        { text: "No, batters in control", votes: Math.floor(Math.random() * 70) + 35 },
      ],
      category: "bowling",
    },
    {
      id: `live-six-${bat}`,
      question: `💥 Will we see a SIX in the next over?`,
      options: [
        { text: "Yes! Maximum incoming!", votes: Math.floor(Math.random() * 90) + 45 },
        { text: "Nah, singles and dots", votes: Math.floor(Math.random() * 70) + 40 },
      ],
      category: "batting",
    },
    {
      id: `live-score-${bat}`,
      question: `📊 ${bat} are at ${score}. What will they reach by over ${Math.min(20, Math.ceil(overs) + 5)}?`,
      options: [
        { text: `Under ${score + 30}`, votes: Math.floor(Math.random() * 60) + 25 },
        { text: `${score + 30} - ${score + 55}`, votes: Math.floor(Math.random() * 80) + 40 },
        { text: `Over ${score + 55} 🔥`, votes: Math.floor(Math.random() * 55) + 30 },
      ],
      category: "match",
    },
    {
      id: `live-motm-${bat}-${bowl}`,
      question: `🌟 Who's your Man of the Match pick right now?`,
      options: [
        { text: `${bat} top scorer`, votes: Math.floor(Math.random() * 110) + 55 },
        { text: `${bowl} best bowler`, votes: Math.floor(Math.random() * 90) + 45 },
        { text: "Someone who hasn't batted yet", votes: Math.floor(Math.random() * 40) + 20 },
      ],
      category: "match",
    },
  ];

  // Add a target-specific poll if chasing
  if (target && target > 0) {
    const runsNeeded = target - score;
    allPolls.push({
      id: `live-chase-${bat}-${target}`,
      question: `🎯 ${bat} need ${runsNeeded} more to win. Will they chase it?`,
      options: [
        { text: `Yes, ${bat} will chase it easily`, votes: Math.floor(Math.random() * 90) + 45 },
        { text: "It'll be a nail-biter", votes: Math.floor(Math.random() * 100) + 55 },
        { text: `No, ${bowl} will defend this`, votes: Math.floor(Math.random() * 70) + 35 },
      ],
      category: "match",
    });
  }

  // Shuffle and pick 3 polls for variety
  const shuffled = allPolls.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

export default function PollsWidget({
  userProfile,
  setUserProfile,
  battingTeam,
  bowlingTeam,
  score,
  overs,
  target,
}: PollsWidgetProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votedNotification, setVotedNotification] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalVoters, setTotalVoters] = useState(0);

  // Initialize polls on first load
  useEffect(() => {
    if (battingTeam && battingTeam !== "Loading...") {
      const stored = LocalDB.getPolls();
      // Check if stored polls match the current match context
      const matchId = `${battingTeam}-${bowlingTeam}`;
      const isRelevant = stored.some(p => p.id.includes(battingTeam) || p.id.includes(bowlingTeam));
      
      if (isRelevant && stored.length > 0) {
        setPolls(stored);
      } else {
        const newPolls = generateMatchPolls(battingTeam, bowlingTeam, score, overs, target);
        LocalDB.savePolls(newPolls);
        setPolls(newPolls);
      }
    }
  }, [battingTeam, bowlingTeam]);

  // Calculate total engaged voters
  useEffect(() => {
    const total = polls.reduce((sum, p) => sum + p.options.reduce((s, o) => s + o.votes, 0), 0);
    setTotalVoters(total);
  }, [polls]);

  const handleVote = (pollId: string, optionIdx: number) => {
    const updatedPolls = LocalDB.voteInPoll(pollId, optionIdx);
    setPolls(updatedPolls);
    setUserProfile(LocalDB.getUser());

    const poll = updatedPolls.find(p => p.id === pollId);
    const optText = poll?.options[optionIdx]?.text || "option";
    setVotedNotification(`You voted "${optText}" — +20 Fan Coins!`);
    setTimeout(() => setVotedNotification(null), 3500);
  };

  const handleRefreshPolls = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const newPolls = generateMatchPolls(battingTeam, bowlingTeam, score, overs, target);
      // Reset all voted states for new polls
      LocalDB.savePolls(newPolls);
      setPolls(newPolls);
      setIsRefreshing(false);
    }, 600);
  };

  const calculatePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "batting": return <Flame className="h-3.5 w-3.5 text-orange-400" />;
      case "bowling": return <Zap className="h-3.5 w-3.5 text-purple-400" />;
      default: return <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "batting": return "border-orange-800/30 bg-orange-900/10";
      case "bowling": return "border-purple-800/30 bg-purple-900/10";
      default: return "border-indigo-800/30 bg-indigo-900/10";
    }
  };

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
            LIVE FAN POLLS
          </h3>
          <p className="text-[10px] font-semibold text-zinc-500 mt-0.5 uppercase tracking-wider">
            {battingTeam !== "Loading..." ? `${battingTeam} vs ${bowlingTeam} • ` : ""}
            {totalVoters.toLocaleString()} fans engaged
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshPolls}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/50 px-3 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            New Polls
          </button>
          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1.5 rounded-xl border border-indigo-500/20">
            +20 Pts
          </span>
        </div>
      </div>

      {/* Vote notification */}
      {votedNotification && (
        <div className="mb-4 p-3 bg-emerald-950/20 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-[fadeIn_0.3s_ease-out]">
          <Award className="h-4.5 w-4.5 text-yellow-400 animate-pulse" />
          <span>{votedNotification}</span>
        </div>
      )}

      {/* Poll Cards */}
      <div className="space-y-5">
        {polls.map((poll, pollIdx) => {
          const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
          const hasVoted = poll.userVotedIndex !== undefined;
          const winningIdx = poll.options.reduce((maxIdx, opt, idx, arr) =>
            opt.votes > arr[maxIdx].votes ? idx : maxIdx, 0);

          return (
            <div
              key={poll.id}
              className={`border rounded-2xl p-5 transition-all duration-300 ${getCategoryColor(poll.category)}`}
              style={{ animationDelay: `${pollIdx * 100}ms` }}
            >
              {/* Poll question */}
              <div className="flex items-start gap-2.5 mb-4">
                <span className="mt-0.5 shrink-0">{getCategoryIcon(poll.category)}</span>
                <h4 className="text-sm font-extrabold text-white leading-snug">{poll.question}</h4>
              </div>

              {/* Options */}
              <div className="space-y-2.5">
                {poll.options.map((opt, idx) => {
                  const pct = calculatePercentage(opt.votes, totalVotes);
                  const isUserSelection = poll.userVotedIndex === idx;
                  const isLeading = hasVoted && idx === winningIdx;

                  return (
                    <div key={idx} className="relative">
                      {hasVoted ? (
                        /* Results View */
                        <div className={`w-full rounded-xl p-3.5 flex items-center justify-between text-xs font-bold overflow-hidden transition-all duration-500 ${
                          isUserSelection
                            ? "border-2 border-indigo-500/50 bg-indigo-950/30 text-white"
                            : "border border-zinc-800/60 bg-zinc-950/40 text-zinc-300"
                        }`}>
                          {/* Percentage bar */}
                          <div
                            style={{ width: `${pct}%` }}
                            className={`absolute left-0 top-0 bottom-0 pointer-events-none transition-all duration-700 ease-out rounded-xl ${
                              isUserSelection
                                ? "bg-indigo-600/25"
                                : isLeading
                                  ? "bg-emerald-600/15"
                                  : "bg-zinc-800/20"
                            }`}
                          />
                          <span className="z-10 flex items-center gap-2">
                            {opt.text}
                            {isUserSelection && (
                              <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                            )}
                            {isLeading && !isUserSelection && (
                              <span className="text-[9px] text-emerald-400 font-black uppercase">Leading</span>
                            )}
                          </span>
                          <span className="z-10 font-mono text-xs">
                            <span className={isLeading ? "text-emerald-400" : "text-zinc-400"}>{pct}%</span>
                            <span className="text-[10px] text-zinc-600 ml-1">({opt.votes})</span>
                          </span>
                        </div>
                      ) : (
                        /* Voting View */
                        <button
                          onClick={() => handleVote(poll.id, idx)}
                          className="w-full border border-zinc-800 hover:border-indigo-500/70 rounded-xl p-3.5 text-left text-xs font-semibold text-zinc-400 hover:text-white transition-all duration-200 bg-zinc-950/30 hover:bg-indigo-600/10 cursor-pointer group"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full border-2 border-zinc-700 group-hover:border-indigo-500 flex items-center justify-center transition-all shrink-0">
                              <span className="w-2 h-2 rounded-full bg-transparent group-hover:bg-indigo-500 transition-all" />
                            </span>
                            {opt.text}
                          </span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer stats */}
              {hasVoted && (
                <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-zinc-600">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    {totalVotes.toLocaleString()} votes
                  </span>
                  <span className="text-emerald-500/70">Results are live</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
