import { useEffect, useState } from "react";
import { PlayerAction } from "../types/types";
import "../css/ActionPanel.css";

type ActionPanelProps = {
  callAmount: number;
  minRaise: number;
  maxRaise: number;
  canCheck: boolean;
  canRaise: boolean;
  onAction: (action: PlayerAction) => void;
};

function ActionPanel({
    callAmount,
    minRaise,
    maxRaise,
    canCheck,
    canRaise,
    onAction,
}: ActionPanelProps) {
    const [raiseAmount, setRaiseAmount] = useState(minRaise);

    const gameIncrement = 10;

    useEffect(() => {
        setRaiseAmount(minRaise);
    }, [minRaise]);

    const handleRaise = () => {
        const amount = Math.min(
            maxRaise,
            Math.max(minRaise, raiseAmount)
        );

        onAction({
            type: "raise",
            amount,
        });
    };

    const decreaseRaise = () => {
        setRaiseAmount((current) =>
            Math.max(minRaise, current - gameIncrement)
        );
    };

    const increaseRaise = () => {
        setRaiseAmount((current) =>
            Math.min(maxRaise, current + gameIncrement)
        );
    };

    return (
        <div className="action-panel">
            <div className="action-buttons">

                <button
                    className="fold-button"
                    onClick={() => onAction({ type: "fold" })}
                >
                    Fold
                </button>

                {canCheck ? (
                    <button
                        className="check-button"
                        onClick={() => onAction({ type: "check" })}
                    >
                        Check
                    </button>
                ) : (
                    <button
                        className="call-button"
                        onClick={() => onAction({ type: "call" })}
                    >
                        Call {callAmount}
                    </button>
                )}

                {canRaise && (
                    <div className="raise-container">
                        <span className="raise-label">
                            Raise to
                        </span>

                        <div className="raise-controls">
                            <button
                                type="button"
                                className="raise-adjust-button"
                                onClick={decreaseRaise}
                            >
                                −
                            </button>

                            <input
                                type="number"
                                min={minRaise}
                                max={maxRaise}
                                value={raiseAmount}
                                onChange={(e) => {
                                    const value = Number(e.target.value);

                                    if (!Number.isNaN(value)) {
                                        setRaiseAmount(value);
                                    }
                                }}
                                className="raise-input"
                            />

                            <button
                                type="button"
                                className="raise-adjust-button"
                                onClick={increaseRaise}
                            >
                                +
                            </button>
                        </div>

                        <button
                            className="raise-button"
                            onClick={handleRaise}
                        >
                            Raise
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ActionPanel;