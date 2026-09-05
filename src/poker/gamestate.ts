import { PlayerStatus } from "../types/status";
import { GameState } from "../types/types";
import { createShuffledDeck } from "./deck";

export function createNewGame() {
    const game: GameState = {
        players: [],
        communityCards: [],
        pot: 0,

        currentPlayerIndex: 0,
        dealerIndex: 0,
        smallBlindIndex: 0,
        bigBlindIndex: 0,

        smallBlind: 10,
        bigBlind: 20,

        deck: [],

        currentBet: 0,
        minimumRaise: 20,

        round: "preflop",
        log: []
    };

    return game;
}

export function startNewHand(game: GameState) {

    game.deck = createShuffledDeck();

    game.communityCards = [];
    game.pot = 0;

    game.round = "preflop";

    // Reset players
    game.players.forEach(player => {
        player.holeCards = [
            game.deck.pop()!,
            game.deck.pop()!
        ];

        player.currentBet = 0;
        player.hasActed = false;
        player.status = PlayerStatus.Active;
    });


    // Determine blinds
    if (game.players.length === 2) {

        // Heads-up:
        // Dealer is small blind
        game.smallBlindIndex =
            game.dealerIndex;

        // Other player is big blind
        game.bigBlindIndex =
            (game.dealerIndex + 1) %
            game.players.length;

    } else {

        // Normal poker
        game.smallBlindIndex =
            (game.dealerIndex + 1) %
            game.players.length;

        game.bigBlindIndex =
            (game.dealerIndex + 2) %
            game.players.length;
    }

    // Post small blind
    const smallBlindPlayer =
        game.players[game.smallBlindIndex];

    const smallBlindAmount =
        Math.min(
            game.smallBlind,
            smallBlindPlayer.chips
        );

    smallBlindPlayer.chips -= smallBlindAmount;
    smallBlindPlayer.currentBet =
        smallBlindAmount;

    if (smallBlindPlayer.chips === 0) {
        smallBlindPlayer.status = PlayerStatus.AllIn;
    }


    // Post big blind
    const bigBlindPlayer =
        game.players[game.bigBlindIndex];

    const bigBlindAmount =
        Math.min(
            game.bigBlind,
            bigBlindPlayer.chips
        );

    bigBlindPlayer.chips -= bigBlindAmount;
    bigBlindPlayer.currentBet =
        bigBlindAmount;

    if (bigBlindPlayer.chips === 0) {
        bigBlindPlayer.status = PlayerStatus.AllIn;
    }


    // Add blinds to pot
    game.pot =
        smallBlindAmount +
        bigBlindAmount;


    // Current highest bet
    game.currentBet =
        Math.max(
            smallBlindAmount,
            bigBlindAmount
        );


    // Minimum raise is one big blind initially
    game.minimumRaise = game.bigBlind;


    // Preflop starts immediately after BB
    if (game.players.length === 2) {

        // Heads-up: dealer/SB acts first
        game.currentPlayerIndex =
            game.smallBlindIndex;

    } else {

        // Normal game: player after BB acts first
        game.currentPlayerIndex =
            (game.bigBlindIndex + 1) %
            game.players.length;
    }


    return game;
}

export function startNextHand(game: GameState): GameState {

    game.dealerIndex =
        (game.dealerIndex + 1) %
        game.players.length;

    return startNewHand(game);
}

export function nextPlayer(game: GameState) { // Moves to the next active player

    let nextIndex =
        (game.currentPlayerIndex + 1) %
        game.players.length;

    while (
        game.players[nextIndex].status !== PlayerStatus.Active
    ) {
        nextIndex =
            (nextIndex + 1) %
            game.players.length;
    }

    game.currentPlayerIndex = nextIndex;

    return game;
}

export function isBettingRoundComplete(game: GameState) {
    for (const player of game.players) {
        if (player.status === PlayerStatus.Active && !player.hasActed) {
            return false;
        }
    }
    return true;
}
