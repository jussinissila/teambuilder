import { formatPlayer } from "../utils/players";

const LineupSection = ({
  lineSelections,
  positions,
  positionLabels,
  getPlayerOptions,
  onSelect,
}) => (
  <section className="lineup-grid">
    {lineSelections.map((line, lineIndex) => (
      <article key={lineIndex} className="line-card">
        <h2>Ketju {lineIndex + 1}</h2>
        <div className="slot-grid">
          {positions.map((position) => {
            const current = line[position];
            const options = getPlayerOptions(position, current);
            return (
              <label
                key={position}
                className={`slot-field slot-${position.toLowerCase()}`}
              >
                <span className="slot-label">{positionLabels[position]}</span>
                <select
                  value={current || ""}
                  onChange={(event) =>
                    onSelect(lineIndex, position, event.target.value)
                  }
                >
                  <option value="">Valitse pelaaja</option>
                  {options.map((player) => (
                    <option key={player.id} value={player.id}>
                      {formatPlayer(player)}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
      </article>
    ))}
  </section>
);

export default LineupSection;
