package poker

func isBettingRoundComplete(game *Game) bool {
	activePlayers := 0

	for _, player := range game.Players {
		if player.Status == Active {
			activePlayers++

			if !player.HasActed {
				return false
			}

			if player.CurrentBet != game.CurrentBet {
				return false
			}
		}
	}

	return activePlayers <= 1 || true
}