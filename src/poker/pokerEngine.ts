import { PlayerStatus } from "../types/status";
import { GameState, PlayerAction } from "../types/types";
import { isBettingRoundComplete, startNextHand } from "./gamestate";

export type PokerAction =
    | { type: "fold" }
    | { type: "check" }
    | { type: "call" }
    | { type: "raise"; amount: number };


export function applyAction(
    game: GameState,
    action: PlayerAction
): GameState {

    const newGame: GameState = {
        ...game,
        players: game.players.map(player => ({ ...player })),
        communityCards: [...game.communityCards],
        log: [...game.log],
    };

    const currentPlayer =
        newGame.players[newGame.currentPlayerIndex];

    if (!currentPlayer) {
        return newGame;
    }

    switch (action.type) {
        case "fold":
            return handleFold(newGame);

        case "check":
            return handleCheck(newGame);

        case "call":
            return handleCall(newGame);

        case "raise":
            return handleRaise(newGame, action.amount);
    }
}


function handleFold(game: GameState): GameState {

    const foldingPlayer =
        game.players[game.currentPlayerIndex];

    foldingPlayer.status = "folded";
    foldingPlayer.hasActed = true;

    game.log.push(
        `${foldingPlayer.name} folded`
    );

    const remainingPlayers =
        game.players.filter(
            player => player.status !== "folded"
        );

    // Only one player remains
    if (remainingPlayers.length === 1) {

        const winner = remainingPlayers[0];

        const winnings = game.pot;

        winner.chips += winnings;

        game.log.push(
            `${winner.name} wins ${winnings}`
        );

        game.pot = 0;

        return startNextHand(game);
    }

    nextTurn(game);

    return game;
}


function handleCheck(game: GameState): GameState {

    const player =
        game.players[game.currentPlayerIndex];

    // Can't check if there is a bet to call
    if (player.currentBet !== game.currentBet) {
        return game;
    }

    player.hasActed = true;

    game.log.push(
        `${player.name} checked`
    );

    nextTurn(game);

    return game;
}

function handleCall(game: GameState): GameState {

    const player =
        game.players[game.currentPlayerIndex];

    const callAmount =
        game.currentBet - player.currentBet;

    // Nothing to call
    if (callAmount <= 0) {
        return handleCheck(game);
    }

    // Player cannot bet more than they have
    const amountToPutIn =
        Math.min(callAmount, player.chips);

    player.chips -= amountToPutIn;
    player.currentBet += amountToPutIn;
    game.pot += amountToPutIn;

    player.hasActed = true;

    game.log.push(
        `${player.name} called ${amountToPutIn}`
    );

    nextTurn(game);

    return game;
}


function handleRaise(
    game: GameState,
    raiseTo: number
): GameState {

    const player =
        game.players[game.currentPlayerIndex];

    const minimumRaiseTo =
        game.currentBet + game.minimumRaise;

    const maximumRaiseTo =
        player.currentBet + player.chips;

    // Invalid raise
    if (raiseTo < minimumRaiseTo) {
        return game;
    }

    if (raiseTo > maximumRaiseTo) {
        return game;
    }

    const previousBet =
        game.currentBet;

    const amountToPutIn =
        raiseTo - player.currentBet;

    const raiseSize =
        raiseTo - previousBet;

    player.chips -= amountToPutIn;
    player.currentBet = raiseTo;

    game.pot += amountToPutIn;

    game.currentBet = raiseTo;

    game.minimumRaise = raiseSize;

    player.hasActed = true;

    game.log.push(
        `${player.name} raised to ${raiseTo}`
    );

    nextTurn(game);

    return game;
}

function nextPlayer(game: GameState) {

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
}

function nextTurn(game: GameState): void {
    if (isBettingRoundComplete(game)) {
        advanceRound(game);

        if (game.round !== "showdown") {
            startBettingRound(game);
        }

        return;
    }

    nextPlayer(game)
}

function getRemainingPlayers(game: GameState) {
    return game.players.filter(
        player =>
            player.status === PlayerStatus.Active ||
            player.status === PlayerStatus.AllIn
    );
}

function isOnlyOnePlayerRemaining(game: GameState) {
    return getRemainingPlayers(game).length === 1;
}

function endHand(game: GameState) {

    const remainingPlayers =
        getRemainingPlayers(game);

    if (remainingPlayers.length !== 1) {
        return;
    }

    const winner = remainingPlayers[0];

    winner.chips += game.pot;

    game.log.push(
        `${winner.name} wins ${game.pot}`
    );

    game.pot = 0;

    return;
}

function advanceRound(game: GameState): GameState {
    // Remove one card from the deck as a burn card
    game.deck.pop();

    if (game.round === "preflop") {
        // Flop = 3 cards
        game.communityCards.push(
            game.deck.pop()!,
            game.deck.pop()!,
            game.deck.pop()!
        );

        game.round = "flop";
    } else if (game.round === "flop") {
        // Turn = 1 card
        game.communityCards.push(game.deck.pop()!);

        game.round = "turn";
    } else if (game.round === "turn") {
        // River = 1 card
        game.communityCards.push(game.deck.pop()!);

        game.round = "river";
    } else if (game.round === "river") {
        game.round = "showdown";
    }

    return game;
}

function startBettingRound(game: GameState): void {
    game.currentBet = 0;

    for (const player of game.players) {
        player.currentBet = 0;
        player.hasActed = false;
    }

    // First active player after the dealer
    game.currentPlayerIndex =
        (game.dealerIndex + 1) % game.players.length;

    // Skip folded players
    while (
        game.players[game.currentPlayerIndex].status !== "active"
    ) {
        game.currentPlayerIndex =
            (game.currentPlayerIndex + 1) % game.players.length;
    }
}