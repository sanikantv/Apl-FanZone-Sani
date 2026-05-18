export interface UserProfile {
  id: string;
  username: string;
  points: number; // mapped to Coins
  predictionsCount: number;
  correctPredictions: number;
  cheerCount: number;
  badges: string[];
  avatar?: string; // spirit animal avatar
}

export interface Prediction {
  id: string;
  ballId: string; // e.g., "18.3"
  prediction: "dot" | "runs" | "boundary" | "wicket";
  multiplier: number;
  amount: number;
  resolved: boolean;
  won: boolean;
  actualOutcome?: string;
}

export interface Poll {
  id: string;
  question: string;
  options: { text: string; votes: number }[];
  userVotedIndex?: number;
  category?: string;
}

const DEFAULT_PROFILE: UserProfile = {
  id: "user-1",
  username: "APL_Fanatic_7",
  points: 1000, // starting balance
  predictionsCount: 0,
  correctPredictions: 0,
  cheerCount: 0,
  badges: ["🏏 Rookie"],
  avatar: "🦁"
};

const INITIAL_MOCK_LEADERBOARD = [
  { username: "Arjun Kapoor", points: 24800, badges: ["🔥 Superfan", "🏆 State Champion"], avatar: "🦁" },
  { username: "Priya Sharma", points: 22100, badges: ["🎯 Boundary Master"], avatar: "🐘" },
  { username: "Rahul Nair", points: 19750, badges: ["⚡ Lightning Hands"], avatar: "🦅" },
  { username: "Deepa Menon", points: 17300, badges: ["🔮 Oracle"], avatar: "🐯" },
  { username: "Vikram Singh", points: 15900, badges: ["🎯 Wicket Taker"], avatar: "🦁" },
];

export class LocalDB {
  private static isBrowser = typeof window !== "undefined";

  static getUser(): UserProfile {
    if (!this.isBrowser) return DEFAULT_PROFILE;
    const data = localStorage.getItem("apl_fan_profile");
    if (!data) {
      this.saveUser(DEFAULT_PROFILE);
      return DEFAULT_PROFILE;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  static saveUser(profile: UserProfile): void {
    if (!this.isBrowser) return;
    localStorage.setItem("apl_fan_profile", JSON.stringify(profile));
  }

  static addPoints(amount: number): UserProfile {
    const user = this.getUser();
    user.points += amount;
    
    // Check for badge unlocks based on score thresholds
    if (user.points >= 1000 && !user.badges.includes("🔥 Elite Predictor")) {
      user.badges.push("🔥 Elite Predictor");
    }
    if (user.points >= 2000 && !user.badges.includes("🏆 Hall of Fame")) {
      user.badges.push("🏆 Hall of Fame");
    }

    this.saveUser(user);
    return user;
  }

  static incrementCheers(): UserProfile {
    const user = this.getUser();
    user.cheerCount += 1;
    
    if (user.cheerCount >= 50 && !user.badges.includes("⚡ Decibel Demolisher")) {
      user.badges.push("⚡ Decibel Demolisher");
    }
    
    this.saveUser(user);
    return user;
  }

  static incrementPredictions(correct: boolean): UserProfile {
    const user = this.getUser();
    user.predictionsCount += 1;
    if (correct) user.correctPredictions += 1;
    
    if (user.predictionsCount >= 5 && !user.badges.includes("🔮 Oracle")) {
      user.badges.push("🔮 Oracle");
    }
    if (user.correctPredictions >= 3 && !user.badges.includes("🎯 Snipers Eye")) {
      user.badges.push("🎯 Snipers Eye");
    }

    this.saveUser(user);
    return user;
  }

  static getPredictions(): Prediction[] {
    if (!this.isBrowser) return [];
    const data = localStorage.getItem("apl_predictions");
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  static savePredictions(predictions: Prediction[]): void {
    if (!this.isBrowser) return;
    localStorage.setItem("apl_predictions", JSON.stringify(predictions));
  }

  static placePrediction(prediction: Omit<Prediction, "id" | "resolved" | "won">): Prediction {
    const predictions = this.getPredictions();
    const newPrediction: Prediction = {
      ...prediction,
      id: Math.random().toString(36).substring(2, 9),
      resolved: false,
      won: false,
    };
    
    // Deduct points placed as bet/points amount
    const user = this.getUser();
    if (user.points >= prediction.amount) {
      user.points -= prediction.amount;
      this.saveUser(user);
    }

    predictions.push(newPrediction);
    this.savePredictions(predictions);
    return newPrediction;
  }

  static getLeaderboard(): { username: string; points: number; badges: string[]; avatar?: string }[] {
    const user = this.getUser();
    const board = [...INITIAL_MOCK_LEADERBOARD];
    
    // Find if user is in board and update their score
    const userIndex = board.findIndex(b => b.username === user.username);
    if (userIndex !== -1) {
      board[userIndex].points = user.points;
      board[userIndex].badges = user.badges;
      board[userIndex].avatar = user.avatar || "🦁";
    } else {
      board.push({ username: user.username, points: user.points, badges: user.badges, avatar: user.avatar || "🦁" });
    }

    // Sort by points descending
    return board.sort((a, b) => b.points - a.points);
  }

  static getPolls(): Poll[] {
    const initialPolls: Poll[] = [
      {
        id: "poll-1",
        question: "Will India score more than 210 runs?",
        options: [
          { text: "Yes, definitely", votes: 145 },
          { text: "No, tight bowling", votes: 82 },
        ],
      },
      {
        id: "poll-2",
        question: "Who will pick the next wicket?",
        options: [
          { text: "Mitchell Starc", votes: 94 },
          { text: "Adam Zampa", votes: 112 },
          { text: "Pat Cummins", votes: 68 },
        ],
      },
    ];

    if (!this.isBrowser) return initialPolls;
    const data = localStorage.getItem("apl_polls");
    if (!data) {
      localStorage.setItem("apl_polls", JSON.stringify(initialPolls));
      return initialPolls;
    }
    try {
      return JSON.parse(data);
    } catch {
      return initialPolls;
    }
  }

  static savePolls(polls: Poll[]): void {
    if (this.isBrowser) {
      localStorage.setItem("apl_polls", JSON.stringify(polls));
    }
  }

  static voteInPoll(pollId: string, optionIndex: number): Poll[] {
    const polls = this.getPolls();
    const poll = polls.find(p => p.id === pollId);
    if (poll && poll.userVotedIndex === undefined) {
      poll.options[optionIndex].votes += 1;
      poll.userVotedIndex = optionIndex;
      
      // Reward user with 20 points for voting!
      this.addPoints(20);
      
      if (this.isBrowser) {
        localStorage.setItem("apl_polls", JSON.stringify(polls));
      }
    }
    return polls;
  }
}
