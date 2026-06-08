import { createNewGame, startNewHand } from "../poker/gamestate";
import { Player } from "../types/types";
import CardView from "./Cards";


export default function Table() {
    const newPlayer = {
        id: "player1",
        name: "Alice",
        chips: 1000,
    } as Player;

    const botPlayer = {
        id: "player2",
        name: "Bob",
        chips: 1000,
        isBot: true,
    } as Player;

    const newGameState = createNewGame();
    newGameState.players.push(newPlayer);
    newGameState.players.push(botPlayer);
    const newHandState = startNewHand(newGameState);

    return (
        <>
            {newHandState.players.map((player) => (
                <>
                <div>player: {player.name}</div>
                {
                    player.holeCards.map((card) => (
                        <CardView card={card} isFaceDown={player.isBot} />
                    ))
                }
                <div>chips: {player.chips}</div>
                </>
                
            ))}
        </>
    );
}