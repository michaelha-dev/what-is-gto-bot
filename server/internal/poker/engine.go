package poker

import "fmt"

type PlayerActionType string

const (
	ActionFold  PlayerActionType = "fold"
	ActionCheck PlayerActionType = "check"
	ActionCall  PlayerActionType = "call"
	ActionRaise PlayerActionType = "raise"
)

type PlayerAction struct {
	Type   PlayerActionType `json:"type"`
	Amount int              `json:"amount,omitempty"`
}

func ApplyAction(game *Game, action PlayerAction) error {
	if game.Round == Showdown {
		return fmt.Errorf("hand is already at showdown")
	}

	if game.CurrentPlayer < 0 || game.CurrentPlayer >= len(game.Players) {
		return fmt.Errorf("invalid current player")
	}

	switch action.Type {
	case ActionFold:
		return handleFold(game)

	case ActionCheck:
		return handleCheck(game)

	case ActionCall:
		return handleCall(game)

	case ActionRaise:
		return handleRaise(game, action.Amount)

	default:
		return fmt.Errorf("unknown action: %s", action.Type)
	}
}

func handleFold(game *Game) error {
	player := &game.Players[game.CurrentPlayer]

	player.Status = Folded
	player.HasActed = true

	game.Log = append(
		game.Log,
		fmt.Sprintf("%s folded", player.Name),
	)

	// Check how many players remain.
	remaining := 0
	winnerIndex := -1

	for i := range game.Players {
		if game.Players[i].Status != Folded {
			remaining++
			winnerIndex = i
		}
	}

	// Everyone except one has folded.
	if remaining == 1 {
		winner := &game.Players[winnerIndex]

		winner.Chips += game.Pot

		game.Log = append(
			game.Log,
			fmt.Sprintf("%s wins %d", winner.Name, game.Pot),
		)

		game.Pot = 0

		return nil
	}

	nextPlayer(game)

	return nil
}

func handleCheck(game *Game) error {
	player := &game.Players[game.CurrentPlayer]

	if player.CurrentBet != game.CurrentBet {
		return fmt.Errorf("cannot check: must call %d",
			game.CurrentBet-player.CurrentBet)
	}

	player.HasActed = true

	game.Log = append(
		game.Log,
		fmt.Sprintf("%s checked", player.Name),
	)

	nextPlayer(game)

	return nil
}

func handleCall(game *Game) error {
	player := &game.Players[game.CurrentPlayer]

	callAmount := game.CurrentBet - player.CurrentBet

	if callAmount <= 0 {
		return handleCheck(game)
	}

	amountToPutIn := callAmount

	if amountToPutIn > player.Chips {
		amountToPutIn = player.Chips
	}

	player.Chips -= amountToPutIn
	player.CurrentBet += amountToPutIn
	game.Pot += amountToPutIn

	player.HasActed = true

	if player.Chips == 0 {
		player.Status = AllIn
	}

	game.Log = append(
		game.Log,
		fmt.Sprintf("%s called %d", player.Name, amountToPutIn),
	)

	nextPlayer(game)

	return nil
}

func handleRaise(game *Game, raiseTo int) error {
	player := &game.Players[game.CurrentPlayer]

	minimumRaiseTo := game.CurrentBet + game.MinimumRaise
	maximumRaiseTo := player.CurrentBet + player.Chips

	if raiseTo < minimumRaiseTo {
		return fmt.Errorf(
			"raise must be at least %d",
			minimumRaiseTo,
		)
	}

	if raiseTo > maximumRaiseTo {
		return fmt.Errorf(
			"raise cannot exceed %d",
			maximumRaiseTo,
		)
	}

	previousBet := game.CurrentBet

	amountToPutIn := raiseTo - player.CurrentBet
	raiseSize := raiseTo - previousBet

	player.Chips -= amountToPutIn
	player.CurrentBet = raiseTo

	game.Pot += amountToPutIn

	game.CurrentBet = raiseTo
	game.MinimumRaise = raiseSize

	// A raise reopens the betting for every other active player.
	for i := range game.Players {
		if i != game.CurrentPlayer &&
			game.Players[i].Status == Active {
			game.Players[i].HasActed = false
		}
	}

	player.HasActed = true

	if player.Chips == 0 {
		player.Status = AllIn
	}

	game.Log = append(
		game.Log,
		fmt.Sprintf("%s raised to %d", player.Name, raiseTo),
	)

	nextPlayer(game)

	return nil
}

func nextPlayer(game *Game) {
	if isBettingRoundComplete(game) {
		advanceBettingRound(game)
		return
	}

	for i := 1; i <= len(game.Players); i++ {
		next := (game.CurrentPlayer + i) % len(game.Players)

		if game.Players[next].Status == Active {
			game.CurrentPlayer = next
			return
		}
	}
}

func StartHand(game *Game) error {
	if len(game.Players) < 2 {
		return fmt.Errorf("need at least 2 players to start a hand")
	}

	// Create and shuffle a fresh deck.
	game.Deck = NewDeck()
	Shuffle(game.Deck)

	// Reset hand state.
	game.CommunityCards = []Card{}
	game.Pot = 0
	game.CurrentBet = 0
	game.MinimumRaise = 0
	game.Round = Preflop
	game.Log = []string{}

	// Reset every player.
	for i := range game.Players {
		player := &game.Players[i]

		player.HoleCards = []Card{}
		player.CurrentBet = 0
		player.HasActed = false

		// Players with chips are active.
		if player.Chips > 0 {
			player.Status = Active
		} else {
			player.Status = Out
		}
	}

	// Make sure there are at least two players who can play.
	activePlayers := 0
	for i := range game.Players {
		if game.Players[i].Status == Active {
			activePlayers++
		}
	}

	if activePlayers < 2 {
		return fmt.Errorf("need at least 2 players with chips")
	}

	// Find the players who should receive the blinds.
	assignBlindPositions(game)

	// Deal two cards to every active player.
	for cardNumber := 0; cardNumber < 2; cardNumber++ {
		for i := range game.Players {
			if game.Players[i].Status != Active {
				continue
			}

			card := DrawCard(&game.Deck)
			game.Players[i].HoleCards = append(
				game.Players[i].HoleCards,
				card,
			)
		}
	}

	postBlind(game, game.SmallBlindIndex, game.SmallBlind)
	postBlind(game, game.BigBlindIndex, game.BigBlind)

	game.CurrentBet = game.BigBlind
	game.MinimumRaise = game.BigBlind

	// Determine who acts first preflop.
	if len(activePlayerIndexes(game)) == 2 {
		// Heads-up:
		// Dealer = Small Blind = first to act preflop.
		game.CurrentPlayer = game.SmallBlindIndex
	} else {
		// Normal table:
		// Player immediately after the big blind acts first.
		game.CurrentPlayer = nextActivePlayerFrom(game, game.BigBlindIndex)
	}

	game.Log = append(
		game.Log,
		fmt.Sprintf(
			"Hand started. Dealer: %s, Small Blind: %s, Big Blind: %s",
			game.Players[game.Dealer].Name,
			game.Players[game.SmallBlindIndex].Name,
			game.Players[game.BigBlindIndex].Name,
		),
	)

	return nil
}

func assignBlindPositions(game *Game) {
	active := activePlayerIndexes(game)

	if len(active) == 2 {
		// Heads-up:
		// Dealer posts the small blind.
		// Other player posts the big blind.
		game.SmallBlindIndex = game.Dealer

		if active[0] == game.Dealer {
			game.BigBlindIndex = active[1]
		} else {
			game.BigBlindIndex = active[0]
		}

		return
	}

	// Normal game:
	// SB = first active player after dealer.
	// BB = first active player after SB.
	game.SmallBlindIndex = nextActivePlayerFrom(
		game,
		game.Dealer,
	)

	game.BigBlindIndex = nextActivePlayerFrom(
		game,
		game.SmallBlindIndex,
	)
}

func postBlind(game *Game, playerIndex int, blindAmount int) {
	player := &game.Players[playerIndex]

	amount := blindAmount

	// A player cannot post more chips than they have.
	if amount > player.Chips {
		amount = player.Chips
	}

	player.Chips -= amount
	player.CurrentBet += amount
	game.Pot += amount

	if player.Chips == 0 {
		player.Status = AllIn
	}

	game.Log = append(
		game.Log,
		fmt.Sprintf(
			"%s posted blind %d",
			player.Name,
			amount,
		),
	)
}

func activePlayerIndexes(game *Game) []int {
	var indexes []int

	for i := range game.Players {
		if game.Players[i].Status == Active ||
			game.Players[i].Status == AllIn {
			indexes = append(indexes, i)
		}
	}

	return indexes
}

func nextActivePlayerFrom(game *Game, currentIndex int) int {
	for i := 1; i <= len(game.Players); i++ {
		next := (currentIndex + i) % len(game.Players)

		if game.Players[next].Status == Active {
			return next
		}
	}

	return -1
}

func StartNextHand(game *Game) error {
	game.Dealer = nextDealer(game)

	return StartHand(game)
}

func nextDealer(game *Game) int {
	for i := 1; i <= len(game.Players); i++ {
		next := (game.Dealer + i) % len(game.Players)

		if game.Players[next].Chips > 0 {
			return next
		}
	}

	return -1
}

func advanceBettingRound(game *Game) {
	switch game.Round {
	case Preflop:
		dealFlop(game)

	case Flop:
		dealTurn(game)

	case Turn:
		dealRiver(game)

	case River:
		game.Round = Showdown
		game.CurrentPlayer = -1

		game.Log = append(
			game.Log,
			"Betting complete. Going to showdown.",
		)

		resolveShowdown(game)
	}
}

func resetStreetBetting(game *Game) {
	game.CurrentBet = 0
	game.MinimumRaise = game.BigBlind

	for i := range game.Players {
		player := &game.Players[i]

		if player.Status == Active {
			player.CurrentBet = 0
			player.HasActed = false
		}
	}

	// First player to act postflop is the first active
	// player after the dealer.
	game.CurrentPlayer = nextActivePlayerFrom(game, game.Dealer)
}

func dealFlop(game *Game) {
	// Burn one card.
	DrawCard(&game.Deck)

	// Deal three community cards.
	for i := 0; i < 3; i++ {
		game.CommunityCards = append(
			game.CommunityCards,
			DrawCard(&game.Deck),
		)
	}

	game.Round = Flop

	resetStreetBetting(game)

	game.Log = append(
		game.Log,
		"Flop dealt.",
	)
}

func dealTurn(game *Game) {
	// Burn one card.
	DrawCard(&game.Deck)

	// Deal the turn.
	game.CommunityCards = append(
		game.CommunityCards,
		DrawCard(&game.Deck),
	)

	game.Round = Turn

	resetStreetBetting(game)

	game.Log = append(
		game.Log,
		"Turn dealt.",
	)
}

func dealRiver(game *Game) {
	// Burn one card.
	DrawCard(&game.Deck)

	// Deal the river.
	game.CommunityCards = append(
		game.CommunityCards,
		DrawCard(&game.Deck),
	)

	game.Round = River

	resetStreetBetting(game)

	game.Log = append(
		game.Log,
		"River dealt.",
	)
}
