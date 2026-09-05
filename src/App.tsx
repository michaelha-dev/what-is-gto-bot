import { useState } from "react";
import ActionPanel from "./components/ActionPanel";
import Table from "./components/Table";
import { createNewGame, startNewHand } from "./poker/gamestate";
import { applyAction } from "./poker/pokerEngine";
import { GameState, PlayerAction } from "./types/types";

function createInitialGame(): GameState {

    const game = createNewGame();

    game.players.push(
        {
            id: "player1",
            name: "Alice",
            chips: 1000,
            holeCards: [],
            currentBet: 0,
            hasActed: false,
            status: "active",
            isBot: false,
        },
        {
            id: "player2",
            name: "Bob",
            chips: 1000,
            holeCards: [],
            currentBet: 0,
            hasActed: false,
            status: "active",
            isBot: true,
        }
    );

    return startNewHand(game);
}

function App() {

    const [game, setGame] = useState(createInitialGame());

    const handleAction = (action: PlayerAction) => {

        setGame(currentGame =>
            applyAction(currentGame, action)
        );

    };

    const currentPlayer =
        game.players[game.currentPlayerIndex];

    if (!currentPlayer) {
        return <p>No players in the game.</p>;
    }

    const callAmount =
        game.currentBet - currentPlayer.currentBet;

    const canCheck =
        callAmount === 0;

    const minRaise =
        game.currentBet + game.minimumRaise;

    const maxRaise =
        currentPlayer.currentBet + currentPlayer.chips;

    const canRaise =
        currentPlayer.chips > 0 &&
        maxRaise >= minRaise;

    const localPlayerId = "player1";

    return (
        <main>

            <Table game={game} localPlayerId={localPlayerId} />

            <ActionPanel
                callAmount={callAmount}
                minRaise={minRaise}
                maxRaise={maxRaise}
                canCheck={canCheck}
                canRaise={canRaise}
                onAction={handleAction}
            />

        </main>
    );
}

export default App;