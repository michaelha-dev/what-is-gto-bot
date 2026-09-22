package poker

type PlayerStatus string

const (
	Active  PlayerStatus = "active"
	Folded  PlayerStatus = "folded"
	AllIn   PlayerStatus = "all-in"
	Out     PlayerStatus = "out"
)

type Player struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Chips       int          `json:"chips"`
	HoleCards   []Card       `json:"holeCards"`
	CurrentBet  int          `json:"currentBet"`
	HasActed    bool         `json:"hasActed"`
	Status      PlayerStatus `json:"status"`
	IsBot       bool         `json:"isBot"`
}