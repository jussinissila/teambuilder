import { formatPlayer } from "../utils/players";

const GoalieSection = ({ goalieSelections, getGoalieOptions, onSelect }) => (
  <section className="goalie-section">
    <h2>MV-valinnat</h2>
    <div className="goalie-grid">
      {goalieSelections.map((current, index) => {
        const options = getGoalieOptions(current);
        return (
          <label key={index} className="slot-field">
            <span className="slot-label">MV {index + 1}</span>
            <select
              value={current || ""}
              onChange={(event) => onSelect(index, event.target.value)}
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
  </section>
);

export default GoalieSection;
