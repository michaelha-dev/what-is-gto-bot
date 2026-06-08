import { GameState } from "../types/types";
import { createShuffledDeck } from "./deck";

export function createNewGame() {
    const game: GameState = {
        players: [],
        communityCards: [],
        pot: 0,
        currentPlayerIndex: 0,
        dealerIndex: 0,
        deck: [],
        smallBlindIndex: 0,
        bigBlindIndex: 0,
        currentBet: 0,
        minimumRaise: 0,
        round: "preflop",
        log: []
    };

    return game;
}

export function startNewHand(game: GameState) {
    game.deck = createShuffledDeck();
    game.players.forEach(player => {
        player.holeCards = [game.deck.pop()!, game.deck.pop()!];
        player.currentBet = 0;
        player.hasActed = false;
        player.status = "active";
    });
    game.communityCards = [];
    game.pot = 0;
    game.currentPlayerIndex = (game.dealerIndex + 1) % game.players.length;


    return game;
}

export function nextPlayer(game: GameState) {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    return game;
}

export function isBettingRoundComplete(game: GameState) {
    for (const player of game.players) {
        if (player.status === "active" && !player.hasActed) {
            return false;
        }
    }
    return true;
}
