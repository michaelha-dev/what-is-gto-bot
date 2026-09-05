import { GameState } from "../types/types";
import CardView from "./Cards";
import "../css/Table.css";

type TableProps = {
    game: GameState;
    localPlayerId: string;
};

function getSeatPosition(
    playerIndex: number,
    playerCount: number,
    localPlayerIndex: number
) {
    const relativeIndex =
        (playerIndex - localPlayerIndex + playerCount) % playerCount;

    const angle =
        (relativeIndex / playerCount) * 2 * Math.PI +
        Math.PI / 2;

    const radiusX = 42;
    const radiusY = 42;

    return {
        left: `${50 + Math.cos(angle) * radiusX}%`,
        top: `${50 + Math.sin(angle) * radiusY}%`,
    };
}

export default function Table({
    game,
    localPlayerId,
}: TableProps) {

    const localPlayerIndex = game.players.findIndex(
        player => player.id === localPlayerId
    );

    return (
        <div className="table-container">

            <div className="poker-table">

                {/* Community cards */}
                <div className="community-area">

                    <div className="community-cards">
                        {game.communityCards.map((card, index) => (
                            <CardView
                                key={index}
                                card={card}
                                isFaceDown={false}
                            />
                        ))}
                    </div>

                    <div className="pot-display">
                        <span className="pot-label">
                            POT
                        </span>

                        <span className="pot-amount">
                            {game.pot}
                        </span>
                    </div>

                </div>


                {/* Players */}
                {game.players.map((player, index) => {

                    const position = getSeatPosition(
                        index,
                        game.players.length,
                        localPlayerIndex
                    );

                    const isCurrentPlayer =
                        index === game.currentPlayerIndex;

                    const isDealer =
                        index === game.dealerIndex;

                    const isSmallBlind =
                        index === game.smallBlindIndex;

                    const isBigBlind =
                        index === game.bigBlindIndex;

                    return (
                        <div
                            key={player.id}
                            className={`player-seat ${
                                isCurrentPlayer
                                    ? "current-player"
                                    : ""
                            } ${
                                player.status === "folded"
                                    ? "folded-player"
                                    : ""
                            }`}
                            style={position}
                        >

                            {/* Player information */}
                            <div className="player-panel">

                                <div className="player-name">
                                    {player.name}
                                </div>

                                <div className="player-cards">
                                    {player.holeCards.map(
                                        (card, cardIndex) => (
                                            <CardView
                                                key={cardIndex}
                                                card={card}
                                                isFaceDown={
                                                    player.isBot
                                                }
                                            />
                                        )
                                    )}
                                </div>

                                <div className="player-chips">
                                    {player.chips}
                                </div>

                                {player.currentBet > 0 && (
                                    <div className="player-bet">
                                        Bet: {player.currentBet}
                                    </div>
                                )}

                                {player.status === "folded" && (
                                    <div className="player-status">
                                        Folded
                                    </div>
                                )}

                                {player.status === "all-in" && (
                                    <div className="player-status">
                                        ALL IN
                                    </div>
                                )}

                            </div>


                            {/* Dealer button */}
                            {isDealer && (
                                <div className="dealer-button">
                                    D
                                </div>
                            )}


                            {/* Small blind */}
                            {isSmallBlind && (
                                <div className="blind-button small-blind">
                                    SB
                                </div>
                            )}


                            {/* Big blind */}
                            {isBigBlind && (
                                <div className="blind-button big-blind">
                                    BB
                                </div>
                            )}

                        </div>
                    );
                })}

            </div>

        </div>
    );
}