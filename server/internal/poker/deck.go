package poker

import "math/rand"

func NewDeck() []Card {
	suits := []Suit{
		Hearts,
		Diamonds,
		Clubs,
		Spades,
	}

	ranks := []Rank{
		Two,
		Three,
		Four,
		Five,
		Six,
		Seven,
		Eight,
		Nine,
		Ten,
		Jack,
		Queen,
		King,
		Ace,
	}

	deck := make([]Card, 0, 52)

	for _, suit := range suits {
		for _, rank := range ranks {
			deck = append(deck, Card{
				Rank: rank,
				Suit: suit,
			})
		}
	}

	return deck
}

func Shuffle(deck []Card) {
	rand.Shuffle(len(deck), func(i, j int) {
		deck[i], deck[j] = deck[j], deck[i]
	})
}

func DrawCard(deck *[]Card) Card {
	card := (*deck)[len(*deck)-1]
	*deck = (*deck)[:len(*deck)-1]

	return card
}