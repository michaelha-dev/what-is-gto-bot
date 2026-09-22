import { useEffect, useState } from "react";

import Table from "./components/Table";
import ActionPanel from "./components/ActionPanel";

import type { GameState, PlayerAction } from "./types/types";

import { getGame, sendAction } from "./api/gameApi";

function App() {
    const [game, setGame] = useState<GameState | null>(null);
    const [error, setError] = useState<string | null>(null);

    const localPlayerId = "alice";

    useEffect(() => {
        loadGame();
    }, []);

    async function loadGame() {
        try {
            const gameState = await getGame();
            setGame(gameState);
        } catch (error) {
            setError(String(error));
        }
    }

    async function handleAction(action: PlayerAction) {
        try {
            setError(null);

            const updatedGame = await sendAction(action);

            setGame(updatedGame);
        } catch (error) {
            setError(String(error));
        }
    }

    if (error) {
        return (
            <div>
                <h2>Something went wrong</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (!game) {
        return <div>Loading game...</div>;
    }

    const currentPlayer = game.players[game.currentPlayerIndex];

    if (!currentPlayer) {
        return <div>No current player</div>;
    }

    const callAmount = Math.max(
        0,
        game.currentBet - currentPlayer.currentBet
    );

    const canCheck = callAmount === 0;

    const minimumRaiseTo =
        game.currentBet + game.minimumRaise;

    const maximumRaiseTo =
        currentPlayer.currentBet + currentPlayer.chips;

    const canRaise =
        currentPlayer.status === "active" &&
        maximumRaiseTo >= minimumRaiseTo;

    return (
        <div className="app">
            <Table
                game={game}
                localPlayerId={currentPlayer.id}
            />


            <div className="turn-indicator">
                {currentPlayer.name}'s turn
            </div>
            {currentPlayer.status === "active" && (
                <ActionPanel
                    callAmount={callAmount}
                    minRaise={minimumRaiseTo}
                    maxRaise={maximumRaiseTo}
                    canCheck={canCheck}
                    canRaise={canRaise}
                    onAction={handleAction}
                />
            )}
        </div>
    );
}

export default App;