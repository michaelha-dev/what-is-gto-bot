package poker

import (
	"fmt"
	"sort"
)

type HandRank int

const (
	HighCard HandRank = iota
	Pair
	TwoPair
	ThreeOfAKind
	Straight
	Flush
	FullHouse
	FourOfAKind
	StraightFlush
)

type EvaluatedHand struct {
	Rank   HandRank
	Values []int
}

// evaluateBestHand finds the best 5-card hand from the player's
// hole cards + community cards.
func evaluateBestHand(cards []Card) EvaluatedHand {
	if len(cards) < 5 {
		return EvaluatedHand{}
	}

	best := EvaluatedHand{
		Rank:   HighCard,
		Values: []int{},
	}

	// Texas Hold'em gives us 7 cards.
	// There are only 21 possible 5-card combinations,
	// so simply evaluate every combination.
	for a := 0; a < len(cards)-4; a++ {
		for b := a + 1; b < len(cards)-3; b++ {
			for c := b + 1; c < len(cards)-2; c++ {
				for d := c + 1; d < len(cards)-1; d++ {
					for e := d + 1; e < len(cards); e++ {

						fiveCards := []Card{
							cards[a],
							cards[b],
							cards[c],
							cards[d],
							cards[e],
						}

						current := evaluateFiveCards(fiveCards)

						if compareHands(current, best) > 0 {
							best = current
						}
					}
				}
			}
		}
	}

	return best
}

// evaluateFiveCards evaluates exactly five cards.
func evaluateFiveCards(cards []Card) EvaluatedHand {
	rankCounts := make(map[int]int)

	for _, card := range cards {
		rank := cardRankValue(card.Rank)
		rankCounts[rank]++
	}

	// Check for flush.
	isFlush := true

	for i := 1; i < len(cards); i++ {
		if cards[i].Suit != cards[0].Suit {
			isFlush = false
			break
		}
	}

	// Get unique ranks.
	ranks := make([]int, 0, len(rankCounts))

	for rank := range rankCounts {
		ranks = append(ranks, rank)
	}

	sort.Sort(sort.Reverse(sort.IntSlice(ranks)))

	// Check for straight.
	straightHigh := straightHighCard(ranks)

	// Straight flush.
	if isFlush && straightHigh > 0 {
		return EvaluatedHand{
			Rank:   StraightFlush,
			Values: []int{straightHigh},
		}
	}

	// Four of a kind.
	var four int
	var fourKicker int

	for rank, count := range rankCounts {
		if count == 4 {
			four = rank
		}
	}

	if four > 0 {
		for rank := range rankCounts {
			if rank != four && rank > fourKicker {
				fourKicker = rank
			}
		}

		return EvaluatedHand{
			Rank:   FourOfAKind,
			Values: []int{four, fourKicker},
		}
	}

	// Full house.
	var trips int
	var pair int

	for rank, count := range rankCounts {
		if count == 3 && rank > trips {
			trips = rank
		}
	}

	if trips > 0 {
		for rank, count := range rankCounts {
			if rank != trips && count >= 2 && rank > pair {
				pair = rank
			}
		}
	}

	if trips > 0 && pair > 0 {
		return EvaluatedHand{
			Rank:   FullHouse,
			Values: []int{trips, pair},
		}
	}

	// Flush.
	if isFlush {
		return EvaluatedHand{
			Rank:   Flush,
			Values: ranks,
		}
	}

	// Straight.
	if straightHigh > 0 {
		return EvaluatedHand{
			Rank:   Straight,
			Values: []int{straightHigh},
		}
	}

	// Three of a kind.
	if trips > 0 {
		kickers := make([]int, 0, 2)

		for _, rank := range ranks {
			if rank != trips {
				kickers = append(kickers, rank)
			}
		}

		return EvaluatedHand{
			Rank: ThreeOfAKind,
			Values: []int{
				trips,
				kickers[0],
				kickers[1],
			},
		}
	}

	// Two pair.
	pairs := []int{}

	for rank, count := range rankCounts {
		if count == 2 {
			pairs = append(pairs, rank)
		}
	}

	sort.Sort(sort.Reverse(sort.IntSlice(pairs)))

	if len(pairs) >= 2 {
		kicker := 0

		for rank := range rankCounts {
			if rank != pairs[0] &&
				rank != pairs[1] &&
				rank > kicker {
				kicker = rank
			}
		}

		return EvaluatedHand{
			Rank: TwoPair,
			Values: []int{
				pairs[0],
				pairs[1],
				kicker,
			},
		}
	}

	// One pair.
	if len(pairs) == 1 {
		kickers := []int{}

		for _, rank := range ranks {
			if rank != pairs[0] {
				kickers = append(kickers, rank)
			}
		}

		return EvaluatedHand{
			Rank: Pair,
			Values: []int{
				pairs[0],
				kickers[0],
				kickers[1],
				kickers[2],
			},
		}
	}

	// High card.
	return EvaluatedHand{
		Rank:   HighCard,
		Values: ranks,
	}
}

// straightHighCard returns the highest card in a straight.
// Returns 0 if the cards aren't a straight.
//
// A-2-3-4-5 is treated as a 5-high straight.
func straightHighCard(ranks []int) int {
	if len(ranks) != 5 {
		return 0
	}

	// Normal straight.
	if ranks[0]-ranks[4] == 4 {
		return ranks[0]
	}

	// Wheel: A-2-3-4-5.
	if ranks[0] == 14 &&
		ranks[1] == 5 &&
		ranks[2] == 4 &&
		ranks[3] == 3 &&
		ranks[4] == 2 {
		return 5
	}

	return 0
}

// compareHands returns:
//
//	> 0 if first hand wins
//	< 0 if second hand wins
//	= 0 if they tie
func compareHands(first, second EvaluatedHand) int {
	if first.Rank != second.Rank {
		if first.Rank > second.Rank {
			return 1
		}

		return -1
	}

	for i := 0; i < len(first.Values) && i < len(second.Values); i++ {
		if first.Values[i] > second.Values[i] {
			return 1
		}

		if first.Values[i] < second.Values[i] {
			return -1
		}
	}

	return 0
}

// resolveShowdown evaluates every remaining player and awards the pot.
func resolveShowdown(game *Game) {
	type contender struct {
		index int
		hand  EvaluatedHand
	}

	contenders := []contender{}

	for i := range game.Players {
		player := &game.Players[i]

		// Folded and eliminated players cannot win.
		if player.Status == Folded || player.Status == Out {
			continue
		}

		cards := make([]Card, 0, 7)

		cards = append(cards, player.HoleCards...)
		cards = append(cards, game.CommunityCards...)

		hand := evaluateBestHand(cards)

		contenders = append(contenders, contender{
			index: i,
			hand:  hand,
		})
	}

	if len(contenders) == 0 {
		game.Log = append(game.Log, "No players remaining at showdown.")
		game.Pot = 0
		game.CurrentPlayer = -1
		return
	}

	// Find the best hand.
	bestHand := contenders[0].hand

	for _, contender := range contenders[1:] {
		if compareHands(contender.hand, bestHand) > 0 {
			bestHand = contender.hand
		}
	}

	// Find all players tied for the best hand.
	winners := []int{}

	for _, contender := range contenders {
		if compareHands(contender.hand, bestHand) == 0 {
			winners = append(winners, contender.index)
		}
	}

	// Log every player's hand.
	for _, contender := range contenders {
		player := &game.Players[contender.index]

		game.Log = append(
			game.Log,
			fmt.Sprintf(
				"%s has %s",
				player.Name,
				handName(contender.hand),
			),
		)
	}

	// Split the pot between tied winners.
	share := game.Pot / len(winners)
	remainder := game.Pot % len(winners)

	for i, winnerIndex := range winners {
		amount := share

		// For now, give any odd chip to the first winner.
		// We can make this positional later.
		if i == 0 {
			amount += remainder
		}

		game.Players[winnerIndex].Chips += amount

		game.Log = append(
			game.Log,
			fmt.Sprintf(
				"%s wins %d",
				game.Players[winnerIndex].Name,
				amount,
			),
		)
	}

	game.Pot = 0

	// Start the next hand automatically.
	if err := StartNextHand(game); err != nil {
		game.Log = append(
			game.Log,
			fmt.Sprintf("Could not start next hand: %s", err),
		)
	}
}

// handName converts a hand category into something readable.
func handName(hand EvaluatedHand) string {
	switch hand.Rank {
	case HighCard:
		return "High Card"

	case Pair:
		return "One Pair"

	case TwoPair:
		return "Two Pair"

	case ThreeOfAKind:
		return "Three of a Kind"

	case Straight:
		return "Straight"

	case Flush:
		return "Flush"

	case FullHouse:
		return "Full House"

	case FourOfAKind:
		return "Four of a Kind"

	case StraightFlush:
		if len(hand.Values) > 0 && hand.Values[0] == 14 {
			return "Royal Flush"
		}

		return "Straight Flush"

	default:
		return "Unknown Hand"
	}
}

// cardRankValue converts poker ranks into comparable integers.
func cardRankValue(rank Rank) int {
	switch rank {
	case Two:
		return 2
	case Three:
		return 3
	case Four:
		return 4
	case Five:
		return 5
	case Six:
		return 6
	case Seven:
		return 7
	case Eight:
		return 8
	case Nine:
		return 9
	case Ten:
		return 10
	case Jack:
		return 11
	case Queen:
		return 12
	case King:
		return 13
	case Ace:
		return 14
	default:
		return 0
	}
}
