import React, { useState } from "react";
import { HelpCircle, CheckCircle2, AlertTriangle, Gift } from "lucide-react";
import { LocalDB, UserProfile } from "../utils/localDb";

const QUIZ_QUESTIONS = [
  { q: "Who holds the record for the most runs in a single IPL season?", options: ["Virat Kohli", "Chris Gayle", "David Warner", "Jos Buttler"], answer: 0 },
  { q: "Which team has won the most IPL titles as of 2024?", options: ["Mumbai Indians", "Chennai Super Kings", "Both MI & CSK", "Kolkata Knight Riders"], answer: 2 },
  { q: "Who bowled the fastest delivery in IPL history?", options: ["Umran Malik", "Shaun Tait", "Lockie Ferguson", "Anrich Nortje"], answer: 1 },
  { q: "Which player has taken the most hat-tricks in IPL?", options: ["Lasith Malinga", "Amit Mishra", "Yuvraj Singh", "Rashid Khan"], answer: 1 },
  { q: "Who hit the longest six in IPL history?", options: ["Chris Gayle", "Albie Morkel", "MS Dhoni", "Liam Livingstone"], answer: 1 },
  { q: "Who holds the record for the highest individual score in an IPL match?", options: ["Brendon McCullum", "Chris Gayle", "AB de Villiers", "KL Rahul"], answer: 1 },
  { q: "Which bowler has taken the most wickets in IPL history?", options: ["Lasith Malinga", "Yuzvendra Chahal", "Dwayne Bravo", "Amit Mishra"], answer: 1 },
  { q: "Which team holds the record for the highest team total in IPL?", options: ["Royal Challengers Bangalore", "Sunrisers Hyderabad", "Chennai Super Kings", "Lucknow Super Giants"], answer: 1 },
  { q: "Who is the only captain to win three consecutive IPL titles?", options: ["MS Dhoni", "Rohit Sharma", "Hardik Pandya", "No one"], answer: 3 },
  { q: "Which player has the most centuries in IPL history?", options: ["Chris Gayle", "Jos Buttler", "Virat Kohli", "KL Rahul"], answer: 2 },
  { q: "Who won the first ever IPL tournament in 2008?", options: ["Chennai Super Kings", "Rajasthan Royals", "Mumbai Indians", "Deccan Chargers"], answer: 1 },
  { q: "Which stadium is known as the home ground of Kolkata Knight Riders?", options: ["Wankhede Stadium", "Eden Gardens", "M. Chinnaswamy Stadium", "Arun Jaitley Stadium"], answer: 1 },
  { q: "Who was the most expensive player bought in the IPL 2024 auction?", options: ["Pat Cummins", "Mitchell Starc", "Sam Curran", "Cameron Green"], answer: 1 },
  { q: "Which player has won the 'Emerging Player of the Year' award twice?", options: ["Rishabh Pant", "Sanju Samson", "Mustafizur Rahman", "No player has won it twice"], answer: 3 },
  { q: "Who holds the record for the most catches by a fielder in IPL history?", options: ["Kieron Pollard", "Suresh Raina", "Virat Kohli", "AB de Villiers"], answer: 1 }
];

interface IplQuizProps {
  userProfile: UserProfile;
  setUserProfile: (u: UserProfile) => void;
}

export default function IplQuiz({ userProfile, setUserProfile }: IplQuizProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [notification, setNotification] = useState<{text: string, success: boolean} | null>(null);

  // Pick a random question on mount to avoid hydration mismatch
  React.useEffect(() => {
    setCurrentQ(Math.floor(Math.random() * QUIZ_QUESTIONS.length));
    setIsClient(true);
  }, []);

  const handleAnswer = (index: number) => {
    if (hasAnswered) return;
    setSelectedOpt(index);
    setHasAnswered(true);

    const isCorrect = index === QUIZ_QUESTIONS[currentQ].answer;

    if (isCorrect) {
      const updatedUser = LocalDB.addPoints(50);
      setUserProfile(updatedUser);
      setNotification({ text: "Correct! +50 Coins Added!", success: true });
    } else {
      setNotification({ text: `Wrong! The correct answer was ${QUIZ_QUESTIONS[currentQ].options[QUIZ_QUESTIONS[currentQ].answer]}.`, success: false });
    }

    setTimeout(() => {
      setNotification(null);
      setSelectedOpt(null);
      setHasAnswered(false);
      // Pick a new random question
      setCurrentQ(Math.floor(Math.random() * QUIZ_QUESTIONS.length));
    }, 4000);
  };

  if (!isClient) return null; // Avoid hydration mismatch

  const question = QUIZ_QUESTIONS[currentQ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mt-8 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-850 pb-4 mb-5">
        <h3 className="text-lg font-black text-white flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-indigo-400" />
          IPL Ultimate Trivia
        </h3>
        <div className="text-[10px] font-black text-emerald-400 bg-emerald-950/20 px-2 py-1 rounded-full uppercase tracking-widest border border-emerald-900/30 shadow-md">
          Reward: 50 Coins
        </div>
      </div>

      {notification && (
        <div className={`mb-4 p-3 rounded-2xl text-xs font-bold border transition-all duration-300 flex items-center gap-2 animate-[fadeIn_0.3s_ease-out] ${
          notification.success 
            ? "bg-emerald-950/20 border-emerald-800 text-emerald-300"
            : "bg-red-950/20 border-red-800 text-red-300"
        }`}>
          {notification.success ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <AlertTriangle className="h-4 w-4 shrink-0" />}
          <span>{notification.text}</span>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-sm font-black text-white mb-4">{question.q}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {question.options.map((opt, idx) => {
            let btnStyle = "bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-indigo-500 hover:text-white cursor-pointer";
            if (hasAnswered) {
              if (idx === question.answer) {
                btnStyle = "bg-emerald-600/20 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/20";
              } else if (idx === selectedOpt) {
                btnStyle = "bg-red-600/20 border-red-500 text-red-400 shadow-inner";
              } else {
                btnStyle = "bg-zinc-950 border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed";
              }
            }

            return (
              <button
                key={idx}
                disabled={hasAnswered}
                onClick={() => handleAnswer(idx)}
                className={`p-4 rounded-2xl border text-xs font-bold text-left transition-all duration-300 ${btnStyle} active:scale-[0.98]`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
