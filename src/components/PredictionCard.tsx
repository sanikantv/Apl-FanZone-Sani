import React, { useState, useEffect } from "react";
import { LocalDB, Prediction, UserProfile } from "../utils/localDb";
import { Coins, Timer, Sparkles, CheckCircle2, History, AlertTriangle } from "lucide-react";

interface PredictionCardProps {
  currentBall: string;
  predictionTimer?: number;
  userProfile: UserProfile;
  setUserProfile: (user: UserProfile) => void;
  lastBallOutcome: string | null;
}

const PREDICTION_OPTIONS = [
  { id: "dot", label: "Dot Ball (•)", multiplier: 1.5, color: "from-zinc-800 to-zinc-900 border-zinc-700 hover:border-zinc-500 text-zinc-300" },
  { id: "runs", label: "Runs (1, 2, 3)", multiplier: 1.2, color: "from-blue-900/40 to-blue-950/40 border-blue-900 hover:border-blue-700 text-blue-300" },
  { id: "boundary", label: "Boundary (4, 6)", multiplier: 3.0, color: "from-emerald-900/40 to-emerald-950/40 border-emerald-900 hover:border-emerald-700 text-emerald-300" },
  { id: "wicket", label: "Wicket (W)", multiplier: 10.0, color: "from-red-900/40 to-red-950/40 border-red-900 hover:border-red-700 text-red-300" },
];

export default function PredictionCard({
  currentBall,
  userProfile,
  setUserProfile,
}: PredictionCardProps) {
  const [selectedOpt, setSelectedOpt] = useState<string | null>(null);
  const [pointsWager, setPointsWager] = useState<number>(50);
  const [lockedPrediction, setLockedPrediction] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<Prediction[]>([]);
  const [notification, setNotification] = useState<{ text: string; success: boolean } | null>(null);
  
  // Real ticking timer state
  const [timeLeft, setTimeLeft] = useState<number>(10);

  // Load history on mount
  useEffect(() => {
    setHistory(LocalDB.getPredictions().reverse().slice(0, 5));
  }, []);

  // Tick the timer every second
  useEffect(() => {
    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Ball is delivered! Reset to 10 for next ball
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  // Resolve prediction exactly when ball is delivered (timeLeft hits 10 again)
  useEffect(() => {
    if (timeLeft === 10 && lockedPrediction) {
      // Resolve the locked prediction now!
      const outcomes = ["•", "1", "2", "4", "6", "W"];
      const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      
      // Trigger global celebration for boundaries
      if (randomOutcome === "4" || randomOutcome === "6") {
        window.dispatchEvent(new CustomEvent("BOUNDARY_HIT", { detail: { type: randomOutcome } }));
      }

      let isWinner = false;
      if (lockedPrediction.prediction === "dot" && randomOutcome === "•") isWinner = true;
      else if (lockedPrediction.prediction === "runs" && ["1", "2", "3"].includes(randomOutcome)) isWinner = true;
      else if (lockedPrediction.prediction === "boundary" && ["4", "6"].includes(randomOutcome)) isWinner = true;
      else if (lockedPrediction.prediction === "wicket" && randomOutcome === "W") isWinner = true;

      // Update resolution in database
      const allPredictions = LocalDB.getPredictions();
      const matchPred = allPredictions.find(p => p.id === lockedPrediction.id);
      if (matchPred) {
        matchPred.resolved = true;
        matchPred.won = isWinner;
        matchPred.actualOutcome = randomOutcome;
        LocalDB.savePredictions(allPredictions);
      }

      const opt = PREDICTION_OPTIONS.find(o => o.id === lockedPrediction.prediction);
      const mult = opt ? opt.multiplier : 1.5;

      if (isWinner) {
        const winAmount = Math.floor(lockedPrediction.amount * mult);
        const updatedUser = LocalDB.addPoints(winAmount);
        LocalDB.incrementPredictions(true);
        setUserProfile(updatedUser);
        setNotification({ text: `🎉 Prediction Won! +${winAmount} Coins! (Outcome: ${randomOutcome === "•" ? "Dot Ball" : randomOutcome === "W" ? "Wicket" : randomOutcome + " Runs"})`, success: true });
      } else {
        LocalDB.incrementPredictions(false);
        setUserProfile(LocalDB.getUser());
        setNotification({ text: `❌ Missed prediction on ball ${lockedPrediction.ballId} (Outcome: ${randomOutcome === "•" ? "Dot Ball" : randomOutcome === "W" ? "Wicket" : randomOutcome + " Runs"})`, success: false });
      }

      // Reset UI state
      setLockedPrediction(null);
      setSelectedOpt(null);
      setHistory(LocalDB.getPredictions().reverse().slice(0, 5));

      setTimeout(() => setNotification(null), 4000);
    }
  }, [timeLeft, lockedPrediction, setUserProfile]);

  const handleLockPrediction = () => {
    if (!selectedOpt || lockedPrediction) return;
    if (userProfile.points < pointsWager) {
      setNotification({ text: "⚠️ Insufficient fan points!", success: false });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const opt = PREDICTION_OPTIONS.find(o => o.id === selectedOpt);
    if (!opt) return;

    // LocalDB.placePrediction already deducts wagered amount!
    const newPred = LocalDB.placePrediction({
      ballId: currentBall,
      prediction: selectedOpt as any,
      multiplier: opt.multiplier,
      amount: pointsWager,
    });

    setLockedPrediction(newPred);
    setUserProfile(LocalDB.getUser());
    setNotification({ text: `🔮 Prediction locked! Resolving when ball is delivered...`, success: true });
  };

  return (
    <div className="w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative">
      <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-5">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-400" />
          PREDICT-THE-NEXT-BALL
        </h3>
        <div className="flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-black text-sm px-3 py-1 rounded-full">
          <Coins className="h-4 w-4" />
          {userProfile.points} Coins
        </div>
      </div>

      {notification && (
        <div className={`mb-4 p-3 rounded-2xl text-xs font-bold border transition-all duration-300 flex items-center gap-2 ${
          notification.success 
            ? "bg-emerald-950/20 border-emerald-800 text-emerald-300"
            : "bg-red-950/20 border-red-800 text-red-300"
        }`}>
          {notification.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          <span>{notification.text}</span>
        </div>
      )}

      {lockedPrediction ? (
        /* Locked State */
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10 text-yellow-400 mb-3 animate-pulse">
            <Timer className="h-6 w-6" />
          </div>
          <h4 className="text-white font-extrabold text-md">Prediction Locked for Ball {lockedPrediction.ballId}</h4>
          <p className="text-zinc-500 text-xs mt-1 font-black">Delivery in <span className="text-yellow-400">{timeLeft}s</span>...</p>
          
          <div className="mt-4 p-3 bg-zinc-900 border border-zinc-850 rounded-xl max-w-xs mx-auto flex items-center justify-between text-sm">
            <span className="text-zinc-400 capitalize">Outcome: <strong>{lockedPrediction.prediction}</strong></span>
            <span className="text-emerald-400 font-bold">{lockedPrediction.multiplier}x Multiplier</span>
          </div>

          <div className="mt-2 text-xs font-semibold text-zinc-500">
            Wagered: <span className="text-yellow-400">{lockedPrediction.amount} Coins</span> | Potential Win: <span className="text-emerald-400">{Math.floor(lockedPrediction.amount * lockedPrediction.multiplier)} Coins</span>
          </div>
        </div>
      ) : (
        /* Selection Panel */
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 mb-3">
            <span>CHOOSE OUTCOME</span>
            <span className="flex items-center gap-1 text-yellow-400 font-black tracking-wider">
              <Timer className="h-3.5 w-3.5 animate-pulse" />
              LOCK IN {timeLeft}s
            </span>
          </div>

          {/* Predict Selection grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {PREDICTION_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setSelectedOpt(opt.id)}
                className={`p-3.5 rounded-2xl border bg-gradient-to-br flex flex-col text-left transition-all duration-300 relative overflow-hidden group ${opt.color} ${
                  selectedOpt === opt.id 
                    ? "ring-2 ring-yellow-400 border-transparent scale-[1.02] shadow-xl" 
                    : ""
                }`}
              >
                <span className="font-extrabold text-sm">{opt.label}</span>
                <span className="text-xs font-semibold mt-1 opacity-70">Payout: {opt.multiplier}x</span>
              </button>
            ))}
          </div>

          {/* Points selector */}
          <div className="mb-5">
            <span className="text-xs font-semibold text-zinc-500 block mb-2">FAN COINS TO WAGER</span>
            <div className="flex gap-2">
              {[20, 50, 100, 250].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setPointsWager(amt)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${
                    pointsWager === amt
                      ? "bg-yellow-500 border-yellow-400 text-black shadow-md shadow-yellow-500/20"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleLockPrediction}
            disabled={!selectedOpt}
            className={`w-full py-3.5 rounded-2xl font-black text-sm transition-all duration-350 flex items-center justify-center gap-2 ${
              selectedOpt
                ? "bg-yellow-500 hover:bg-yellow-400 text-zinc-950 cursor-pointer shadow-lg shadow-yellow-500/10 transform active:scale-95"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-850"
            }`}
          >
            LOCK PREDICTION
            {selectedOpt && <CheckCircle2 className="h-4 w-4" />}
          </button>
        </div>
      )}

      {/* Prediction History Drawer */}
      {history.length > 0 && (
        <div className="mt-6 border-t border-zinc-850 pt-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5 mb-3">
            <History className="h-4 w-4" />
            Live Predictions Feed
          </h4>
          <div className="space-y-2">
            {history.map((pred) => (
              <div key={pred.id} className="flex items-center justify-between text-xs bg-zinc-950/40 border border-zinc-850/60 rounded-xl p-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-500">Ball {pred.ballId}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
                  <span className="text-zinc-300 font-bold capitalize">{pred.prediction}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">{pred.amount} Coins</span>
                  {pred.resolved ? (
                    pred.won ? (
                      <span className="text-emerald-400 font-black px-2 py-0.5 bg-emerald-950/20 border border-emerald-900/20 rounded">
                        +{Math.floor(pred.amount * pred.multiplier)}
                      </span>
                    ) : (
                      <span className="text-red-400 font-black px-2 py-0.5 bg-red-950/20 border border-red-900/20 rounded">
                        -{pred.amount}
                      </span>
                    )
                  ) : (
                    <span className="text-yellow-400 font-black px-2 py-0.5 bg-yellow-950/20 border border-yellow-900/20 rounded animate-pulse">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
