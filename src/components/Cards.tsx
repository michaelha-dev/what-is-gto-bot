import type { Card } from "../types/types";
import "../css/Cards.css";

const cardImages = import.meta.glob(
    "../assets/cards/*.svg",
    {
        eager: true,
        query: "?url",
        import: "default",
    }
) as Record<string, string>;

function getCardImage(card: Card): string {
    const suitMap = {
        diamonds: "D",
        hearts: "H",
        clubs: "C",
        spades: "S",
    };

    // Convert TypeScript rank to the filename convention
    const rankMap = {
        "10": "T",
        "J": "J",
        "Q": "Q",
        "K": "K",
        "A": "A",
    };

    const filenameRank =
        rankMap[card.rank as keyof typeof rankMap] ?? card.rank;

    const filename = `${filenameRank}${suitMap[card.suit]}.svg`;

    const imagePath = Object.keys(cardImages).find(
        (path) => path.endsWith(`/${filename}`)
    );

    if (!imagePath) {
        throw new Error(`Card image not found: ${filename}`);
    }

    return cardImages[imagePath];
}

type CardViewProps = {
    card: Card;
};

function CardView({ card }: CardViewProps) {
    const image = getCardImage(card);

    return (
        <img
            src={image}
            alt={`${card.rank} of ${card.suit}`}
            className="playing-card"
        />
    );
}

export default CardView;