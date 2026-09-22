package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"what-is-gto-bot/server/internal/poker"
)

var game *poker.Game

func main() {
	game = createGame()

	http.HandleFunc("/api/game", getGame)
	http.HandleFunc("/api/game/action", applyAction)

	fmt.Println("Poker server running on http://localhost:8080")

	handler := enableCORS(http.DefaultServeMux)

	err := http.ListenAndServe(":8080", handler)
	if err != nil {
		fmt.Println("Server error:", err)
	}
}

func createGame() *poker.Game {
	game := &poker.Game{
		Players: []poker.Player{
			{
				ID:    "alice",
				Name:  "Alice",
				Chips: 1000,
			},
			{
				ID:    "bob",
				Name:  "Bob",
				Chips: 1000,
				IsBot: true,
			},
			{
				ID:    "charlie",
				Name:  "Charlie",
				Chips: 1000,
				IsBot: true,
			},
		},

		Dealer:     0,
		SmallBlind: 10,
		BigBlind:   20,
	}

	if err := poker.StartHand(game); err != nil {
		panic(err)
	}

	return game
}

func getGame(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(game)
}

func applyAction(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var action poker.PlayerAction

	err := json.NewDecoder(r.Body).Decode(&action)
	if err != nil {
		http.Error(w, "invalid action", http.StatusBadRequest)
		return
	}

	err = poker.ApplyAction(game, action)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(game)
}

func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:5173")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
