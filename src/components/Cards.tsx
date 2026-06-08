import { Card } from "../types/types";

interface Props {
  card?: Card;
  isFaceDown?: boolean;
}

export default function CardView(props: Props) {
  if (!props.card || props.isFaceDown) {
    return <div className="card">🂠</div>;
  }

  return (
    <div className="card">
      {props.card.rank}{props.card.suit}
    </div>
  );
}