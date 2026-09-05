export type Suit = "hearts" | "diamonds" | "clubs" | "spades";
export type Rank =
  | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10"
  | "J" | "Q" | "K" | "A";

export type Card = {
  rank: Rank;
  suit: Suit;
};

export type PlayerStatus =
  | "active"
  | "folded"
  | "all-in"
  | "out";

export type Player = {
  id: string;
  name: string;
  chips: number;
  holeCards: Card[];
  currentBet: number;
  hasActed: boolean;
  status: PlayerStatus;
  isBot: boolean;
};

export type BettingRound = "preflop" | "flop" | "turn" | "river" | "showdown";

export type GameState = {
  players: Player[];
  deck: Card[];
  communityCards: Card[];
  pot: number;

  currentPlayerIndex: number;

  dealerIndex: number;
  smallBlindIndex: number;
  bigBlindIndex: number;

  smallBlind: number;
  bigBlind: number;

  currentBet: number;
  minimumRaise: number;

  round: BettingRound;
  log: string[];
};

export type PlayerAction =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call" }
  | { type: "raise"; amount: number };