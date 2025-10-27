import { formatPlayer } from "../utils/players";

const SummarySection = ({
  lineSelections,
  goalieSelections,
  positions,
  positionLabels,
  playerIndex,
}) => (
  <section className="summary-section">
    <h2>Valittu kokoonpano</h2>
    <div className="summary-grid">
      {lineSelections.map((line, lineIndex) => (
        <div key={lineIndex} className="summary-card">
          <h3>Ketju {lineIndex + 1}</h3>
          <ul>
            {positions.map((position) => {
              const playerId = line[position];
              const player = playerId ? playerIndex.get(playerId) : null;
              return (
                <li key={position}>
                  <strong>{positionLabels[position]}:</strong>{" "}
                  {player ? formatPlayer(player) : ""}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="summary-card">
        <h3>MV</h3>
        <ul>
          {goalieSelections.map((playerId, index) => {
            const player = playerId ? playerIndex.get(playerId) : null;
            return (
              <li key={index}>
                <strong>MV {index + 1}:</strong>{" "}
                {player ? formatPlayer(player) : ""}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  </section>
);

export default SummarySection;
