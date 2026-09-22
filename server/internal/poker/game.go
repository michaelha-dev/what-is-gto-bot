package poker

type BettingRound string

const (
	Preflop  BettingRound = "preflop"
	Flop     BettingRound = "flop"
	Turn     BettingRound = "turn"
	River    BettingRound = "river"
	Showdown BettingRound = "showdown"
)

type Game struct {
	Players        []Player `json:"players"`
	Deck           []Card   `json:"-"`
	CommunityCards []Card   `json:"communityCards"`

	Pot int `json:"pot"`

	CurrentPlayer int `json:"currentPlayerIndex"`
	Dealer        int `json:"dealerIndex"`

	SmallBlind int `json:"smallBlind"`
	BigBlind   int `json:"bigBlind"`

	SmallBlindIndex int `json:"smallBlindIndex"`
	BigBlindIndex   int `json:"bigBlindIndex"`

	CurrentBet   int `json:"currentBet"`
	MinimumRaise int `json:"minimumRaise"`

	Round BettingRound `json:"round"`
	Log   []string     `json:"log"`
}
