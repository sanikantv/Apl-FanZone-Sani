import React, { useState, useEffect } from "react";
import { LocalDB, Poll, UserProfile } from "../utils/localDb";
import { BarChart3, Check, Award } from "lucide-react";

interface PollsWidgetProps {
  userProfile: UserProfile;
  setUserProfile: (user: UserProfile) => void;
}

export default function PollsWidget({ userProfile, setUserProfile }: PollsWidgetProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [votedNotification, setVotedNotification] = useState<boolean>(false);

  useEffect(() => {
    setPolls(LocalDB.getPolls());
  }, [userProfile]);

  const handleVote = (pollId: string, optionIdx: number) => {
    const updatedPolls = LocalDB.voteInPoll(pollId, optionIdx);
    setPolls(updatedPolls);
    setUserProfile(LocalDB.getUser());
    
    setVotedNotification(true);
    setTimeout(() => setVotedNotification(false), 3000);
  };

  const calculatePercentage = (votes: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
      <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-5">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          LIVE FAN POLLS
        </h3>
        <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
          Earn +20 Pts
        </span>
      </div>

      {votedNotification && (
        <div className="mb-4 p-3 bg-emerald-950/20 border border-emerald-800 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <Award className="h-4.5 w-4.5 text-yellow-400 animate-pulse" />
          <span>Vote registered! +20 Fan Points rewarded.</span>
        </div>
      )}

      <div className="space-y-6">
        {polls.map((poll) => {
          const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
          const hasVoted = poll.userVotedIndex !== undefined;

          return (
            <div key={poll.id} className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-4.5">
              <h4 className="text-sm font-extrabold text-white mb-3">{poll.question}</h4>
              
              <div className="space-y-2.5">
                {poll.options.map((opt, idx) => {
                  const pct = calculatePercentage(opt.votes, totalVotes);
                  const isUserSelection = poll.userVotedIndex === idx;

                  return (
                    <div key={idx} className="relative">
                      {hasVoted ? (
                        /* Results state */
                        <div className="w-full border border-zinc-850 rounded-xl p-3 flex items-center justify-between text-xs font-bold text-zinc-300 overflow-hidden bg-zinc-950/50">
                          {/* Colored overlay for percentage bar */}
                          <div
                            style={{ width: `${pct}%` }}
                            className={`absolute left-0 top-0 bottom-0 pointer-events-none transition-all duration-500 ${
                              isUserSelection ? "bg-indigo-600/20 border-r border-indigo-500/30" : "bg-zinc-800/10"
                            }`}
                          />
                          <span className="z-10 flex items-center gap-1.5">
                            {opt.text}
                            {isUserSelection && (
                              <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                            )}
                          </span>
                          <span className="z-10 text-zinc-400 font-mono">
                            {pct}% <span className="text-[10px] text-zinc-600">({opt.votes})</span>
                          </span>
                        </div>
                      ) : (
                        /* Interactive Voting state */
                        <button
                          onClick={() => handleVote(poll.id, idx)}
                          className="w-full border border-zinc-800 hover:border-indigo-500 rounded-xl p-3 text-left text-xs font-semibold text-zinc-400 hover:text-white transition-all bg-zinc-950/20 hover:bg-indigo-600/5 cursor-pointer"
                        >
                          {opt.text}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {hasVoted && (
                <div className="mt-2.5 text-[10px] font-semibold text-zinc-600 text-right">
                  Total votes: {totalVotes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
