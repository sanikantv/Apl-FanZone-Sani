export interface BatsmanState {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  onStrike: boolean;
}

export interface BowlerState {
  name: string;
  overs: number;
  ballsCount: number; // number of balls in current over
  runsConceded: number;
  wickets: number;
}

export interface MatchState {
  battingTeam: string;
  bowlingTeam: string;
  score: number;
  wickets: number;
  overs: number; // e.g. 18.2 represented as 18.2
  ballsInCurrentOver: number; // 0 to 5
  batsman1: BatsmanState;
  batsman2: BatsmanState;
  bowler: BowlerState;
  recentBalls: string[]; // last 12 balls e.g. ["1", "4", "W", "•", "6"]
  commentary: { ball: string; text: string; type: "runs" | "boundary" | "wicket" | "dot" }[];
  target?: number;
  matchEnded: boolean;
  predictionTimer: number; // seconds left for next ball
}

export const INITIAL_MATCH_STATE: MatchState = {
  battingTeam: "Loading...",
  bowlingTeam: "Loading...",
  score: 0,
  wickets: 0,
  overs: 0.0,
  ballsInCurrentOver: 0,
  batsman1: { name: "Batter 1", runs: 0, balls: 0, fours: 0, sixes: 0, onStrike: true },
  batsman2: { name: "Batter 2", runs: 0, balls: 0, fours: 0, sixes: 0, onStrike: false },
  bowler: { name: "Bowler 1", overs: 0.0, ballsCount: 0, runsConceded: 0, wickets: 0 },
  recentBalls: [],
  commentary: [
    { ball: "0.0", text: "Fetching live match data...", type: "dot" },
  ],
  target: undefined,
  matchEnded: false,
  predictionTimer: 10,
};

const COMMENTARIES: Record<string, string[]> = {
  dot: [
    "Excellent yorker on the off stump, batsman defends it back to the bowler.",
    "Beaten! Slower ball outside off, batsman swings and misses completely.",
    "Short ball, batsman ducks under it safely. Good carry to the keeper.",
    "Driven straight to mid-off. Quick fielding stops any chance of a single."
  ],
  runs_1: [
    "Tucked away to deep square leg for a comfortable single.",
    "Flicked off the pads down to fine leg to rotate the strike.",
    "Pushed gently to cover and they scamper through for a quick run.",
    "Outside edge, runs down to third man. Just a single."
  ],
  runs_2: [
    "Driven beautifully through extra cover. Great running gets them a second run!",
    "Pulled away into the gap at deep mid-wicket. Good hustle for two runs.",
    "Chipped over mid-on, fielders chase it down. Easy double.",
    "Played fine down to third man, they push hard and complete two runs safely."
  ],
  boundary_4: [
    "FOUR! Magnificent shot! Cracking cover drive right through the gap!",
    "FOUR! Short and pulled away with immense power through deep square leg!",
    "FOUR! Thick outside edge, flies past the slip fielder and races to the boundary!",
    "FOUR! Elegant straight drive. The bowler can only watch as it speeds to the rope!"
  ],
  boundary_6: [
    "SIX! Monumental blow! Picked up off the pads and dispatched deep into the stands!",
    "SIX! Down the track and lofted straight over the bowler's head! What a shot!",
    "SIX! Full toss on the leg side, Gaikwad flicks it with effortless wristwork over deep mid-wicket!",
    "SIX! MS Dhoni flexes his muscles! Smashed high and handsome over long-on!"
  ],
  wicket: [
    "OUT! Clean bowled! Lightning-fast yorker that rattles the stumps! Batsman completely missed it!",
    "OUT! Caught! Tried to clear the boundary, but sliced it high to deep cover where the fielder takes a running catch!",
    "OUT! Caught behind! Excellent outswinger, gets the thin edge and the keeper makes no mistake behind the stumps!",
    "OUT! LBW! Plumb! Searing in-swinger, hits the batsman straight on the pads. Umpire raises the finger instantly!"
  ]
};

const BENCH_BATSMEN = ["MS Dhoni", "Shivam Dube", "Ravindra Jadeja", "Daryl Mitchell", "Sameer Rizvi"];

export function simulateNextBall(state: MatchState): MatchState {
  if (state.matchEnded) return state;

  const nextState = { ...state };
  
  // 1. Roll outcome
  // Weights: dot (25%), 1 run (35%), 2 runs (10%), 4 runs (15%), 6 runs (10%), wicket (5%)
  const roll = Math.random() * 100;
  let runs = 0;
  let isWicket = false;
  let type: "runs" | "boundary" | "wicket" | "dot" = "dot";
  let displayOutcome = "•";
  let commText = "";

  const activeBatsman = nextState.batsman1.onStrike ? nextState.batsman1 : nextState.batsman2;
  const nonStriker = nextState.batsman1.onStrike ? nextState.batsman2 : nextState.batsman1;

  if (roll < 25) {
    // Dot ball
    runs = 0;
    type = "dot";
    displayOutcome = "•";
    commText = COMMENTARIES.dot[Math.floor(Math.random() * COMMENTARIES.dot.length)];
  } else if (roll < 60) {
    // 1 Run
    runs = 1;
    type = "runs";
    displayOutcome = "1";
    commText = COMMENTARIES.runs_1[Math.floor(Math.random() * COMMENTARIES.runs_1.length)];
  } else if (roll < 70) {
    // 2 Runs
    runs = 2;
    type = "runs";
    displayOutcome = "2";
    commText = COMMENTARIES.runs_2[Math.floor(Math.random() * COMMENTARIES.runs_2.length)];
  } else if (roll < 85) {
    // 4 Runs
    runs = 4;
    type = "boundary";
    displayOutcome = "4";
    commText = COMMENTARIES.boundary_4[Math.floor(Math.random() * COMMENTARIES.boundary_4.length)];
  } else if (roll < 95) {
    // 6 Runs
    runs = 6;
    type = "boundary";
    displayOutcome = "6";
    commText = COMMENTARIES.boundary_6[Math.floor(Math.random() * COMMENTARIES.boundary_6.length)];
  } else {
    // Wicket
    isWicket = true;
    type = "wicket";
    displayOutcome = "W";
    commText = COMMENTARIES.wicket[Math.floor(Math.random() * COMMENTARIES.wicket.length)];
  }

  // 2. Update Ball Count & Over
  nextState.ballsInCurrentOver += 1;
  nextState.bowler.ballsCount += 1;
  
  const currentBallStr = `${Math.floor(nextState.overs)}.${nextState.ballsInCurrentOver}`;

  // Update Batsman Stats
  activeBatsman.balls += 1;
  if (isWicket) {
    nextState.wickets += 1;
    nextState.bowler.wickets += 1;
    
    commText = `${nextState.bowler.name} to ${activeBatsman.name}. ${commText}`;

    // Get a new batsman from the bench
    const nextBatsmanName = BENCH_BATSMEN[nextState.wickets - 5] || "Batsman Tail";
    
    if (activeBatsman === nextState.batsman1) {
      nextState.batsman1 = {
        name: nextBatsmanName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        onStrike: true
      };
    } else {
      nextState.batsman2 = {
        name: nextBatsmanName,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        onStrike: true
      };
    }
  } else {
    activeBatsman.runs += runs;
    if (runs === 4) activeBatsman.fours += 1;
    if (runs === 6) activeBatsman.sixes += 1;
    nextState.score += runs;
    nextState.bowler.runsConceded += runs;

    commText = `${nextState.bowler.name} to ${activeBatsman.name}. ${runs === 0 ? "No run" : runs === 1 ? "1 run" : runs + " runs"}, ${commText}`;
  }

  // Update Bowler Over Count
  if (nextState.ballsInCurrentOver === 6) {
    nextState.bowler.overs = Math.floor(nextState.bowler.overs) + 1;
    nextState.bowler.ballsCount = 0;
    nextState.overs = Math.floor(nextState.overs) + 1.0;
    nextState.ballsInCurrentOver = 0;
    
    // Rotate strike at end of over
    nextState.batsman1.onStrike = !nextState.batsman1.onStrike;
    nextState.batsman2.onStrike = !nextState.batsman2.onStrike;
  } else {
    nextState.overs = Math.floor(nextState.overs) + nextState.ballsInCurrentOver / 10;
    
    // Rotate strike during over for odd runs
    if (runs === 1 || runs === 3) {
      nextState.batsman1.onStrike = !nextState.batsman1.onStrike;
      nextState.batsman2.onStrike = !nextState.batsman2.onStrike;
    }
  }

  // Update recent balls timeline
  const updatedRecent = [...nextState.recentBalls, displayOutcome];
  if (updatedRecent.length > 12) updatedRecent.shift();
  nextState.recentBalls = updatedRecent;

  // Prepend new commentary
  nextState.commentary = [
    { ball: currentBallStr, text: commText, type },
    ...nextState.commentary
  ];

  // Limit commentary size
  if (nextState.commentary.length > 15) {
    nextState.commentary.pop();
  }

  // Check for Match End (20 overs reached or 10 wickets down)
  if (nextState.overs >= 20.0 || nextState.wickets >= 10) {
    nextState.matchEnded = true;
    nextState.commentary = [
      {
        ball: "END",
        text: `Innings completed! ${nextState.battingTeam} finished at ${nextState.score}/${nextState.wickets} in 20.0 overs.`,
        type: "runs"
      },
      ...nextState.commentary
    ];
  }

  return nextState;
}
