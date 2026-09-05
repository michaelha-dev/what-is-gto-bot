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

  useEffect(() => {
    setRaiseAmount(minRaise);
  }, [minRaise]);

  const handleRaise = () => {
    onAction({
      type: "raise",
      amount: raiseAmount,
    });
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

            <input
              type="range"
              min={minRaise}
              max={maxRaise}
              value={raiseAmount}
              onChange={(e) =>
                setRaiseAmount(Number(e.target.value))
              }
            />

            <span>
              Raise to {raiseAmount}
            </span>

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