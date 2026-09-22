import type { GameState, PlayerAction } from "../types/types";

const API_URL = "http://localhost:8080/api";

export async function getGame(): Promise<GameState> {
    const response = await fetch(`${API_URL}/game`);

    if (!response.ok) {
        throw new Error("Failed to get game");
    }

    return response.json();
}

export async function sendAction(
    action: PlayerAction
): Promise<GameState> {
    const response = await fetch(`${API_URL}/game/action`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(action),
    });

    if (!response.ok) {
        const message = await response.text();
        throw new Error(message);
    }

    return response.json();
}