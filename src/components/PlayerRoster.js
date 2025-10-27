import { useEffect, useRef, useState } from "react";
import { CAPTAINCY_OPTIONS, ROLE_LABELS, POSITIONS } from "../constants/players";

const PlayerRoster = ({
  benchPlayers,
  benchCounts,
  editingPlayerId,
  editForm,
  editError,
  newPlayerForm,
  newPlayerError,
  onStartEdit,
  onCancelEdit,
  onUpdateEditField,
  onEditRoleChange,
  onToggleEditPosition,
  onSaveEdit,
  onRemove,
  onUpdateNewPlayer,
  onNewRoleChange,
  onToggleNewPosition,
  onAddNewPlayer,
  onResetNewPlayer,
  onImportPlayers,
  onExportPlayers,
  selectedPlayerIds,
}) => {
  const fileInputRef = useRef(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addSubmitAttempted, setAddSubmitAttempted] = useState(false);
  const selectedIds = selectedPlayerIds ?? new Set();

  const triggerFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    if (!onImportPlayers) return;
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === "string" ? reader.result : "";
        const data = JSON.parse(text || "[]");
        const result = onImportPlayers(data);
        if (!result?.ok) {
          window.alert(result?.error || "Pelaajien lataus epäonnistui.");
        }
      } catch (error) {
        window.alert("Tiedoston lukeminen epäonnistui.");
      } finally {
        event.target.value = "";
      }
    };
    reader.onerror = () => {
      window.alert("Tiedoston lukeminen epäonnistui.");
      event.target.value = "";
    };
    reader.readAsText(file);
  };

  const handleExportJson = () => {
    if (!onExportPlayers) return;
    const data = onExportPlayers();
    if (!Array.isArray(data)) {
      window.alert("Pelaajaluettelon tallennus epäonnistui.");
      return;
    }
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `players-${date}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      window.alert("Pelaajaluettelon tallennus epäonnistui.");
    }
  };

  const openAddModal = () => {
    onResetNewPlayer();
    setAddSubmitAttempted(false);
    setAddModalOpen(true);
  };

  const closeAddModal = () => {
    setAddModalOpen(false);
    setAddSubmitAttempted(false);
    onResetNewPlayer();
  };

  const handleAddSubmit = (event) => {
    event.preventDefault();
    setAddSubmitAttempted(true);
    onAddNewPlayer();
  };

  useEffect(() => {
    if (!addModalOpen) return;
    if (!addSubmitAttempted) return;
    if (!newPlayerError) {
      setAddModalOpen(false);
      setAddSubmitAttempted(false);
      onResetNewPlayer();
    } else {
      setAddSubmitAttempted(false);
    }
  }, [addModalOpen, addSubmitAttempted, newPlayerError, onResetNewPlayer]);

  return (
    <section className="bench-section">
      <h2>Pelaajaluettelo</h2>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      <div className="roster-toolbar">
        <button type="button" onClick={triggerFileDialog}>
          Lataa tiedostosta
        </button>
        <button type="button" className="secondary" onClick={handleExportJson}>
          Tallenna tiedostoon
        </button>
        <button type="button" onClick={openAddModal}>
          Lisää pelaaja
        </button>
      </div>

    <div className="bench-list-wrapper">
      <div className="bench-summary">
        <span>
          Kenttäpelaajia yhteensä: <strong>{benchCounts.playerCount}</strong>
        </span>
        <span>
          Maalivahteja yhteensä: <strong>{benchCounts.goalieCount}</strong>
        </span>
      </div>
      {benchPlayers.length === 0 ? (
        <p>Kaikki pelaajat on valittu kokoonpanoon.</p>
      ) : (
        <ul className="bench-list">
          {benchPlayers.map((player) => {
            const isEditing = editingPlayerId === player.id;
            const isSelected = selectedIds.has(player.id);
            const form = isEditing ? editForm : null;
            return (
              <li
                key={player.id}
                className={isEditing ? "bench-item editing" : "bench-item"}
              >
                {isEditing && form ? (
                  <form
                    className="bench-edit-form"
                    onSubmit={(event) => {
                      event.preventDefault();
                      onSaveEdit(player.id);
                    }}
                  >
                    <div className="bench-edit-fields">
                      <div className="bench-edit-field">
                        <label htmlFor={`edit-number-${player.id}`}>Numero</label>
                        <input
                          id={`edit-number-${player.id}`}
                          type="number"
                          min="1"
                          value={form.number}
                          onChange={(event) =>
                            onUpdateEditField("number", event.target.value)
                          }
                        />
                      </div>
                      <div className="bench-edit-field">
                        <label htmlFor={`edit-name-${player.id}`}>Nimi</label>
                        <input
                          id={`edit-name-${player.id}`}
                          type="text"
                          value={form.name}
                          onChange={(event) =>
                            onUpdateEditField("name", event.target.value)
                          }
                        />
                      </div>
                      <div className="bench-edit-field">
                        <label htmlFor={`edit-role-${player.id}`}>Rooli</label>
                        <select
                          id={`edit-role-${player.id}`}
                          value={form.role}
                          onChange={(event) => onEditRoleChange(event.target.value)}
                        >
                          <option value="player">{ROLE_LABELS.player}</option>
                          <option value="goalie">{ROLE_LABELS.goalie}</option>
                        </select>
                      </div>
                      <div className="bench-edit-field">
                        <label htmlFor={`edit-captaincy-${player.id}`}>Kapteenirooli</label>
                        <select
                          id={`edit-captaincy-${player.id}`}
                          value={form.captaincy}
                          onChange={(event) =>
                            onUpdateEditField("captaincy", event.target.value)
                          }
                        >
                          {CAPTAINCY_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <fieldset className="bench-edit-field bench-edit-fieldset">
                      <legend>Pelipaikat</legend>
                      {form.role === "goalie" ? (
                        <p className="bench-edit-note">
                          Maalivahdin pelipaikka on aina MV.
                        </p>
                      ) : (
                        <div className="bench-edit-positions">
                          {POSITIONS.map((position) => (
                            <label key={position} className="bench-edit-checkbox">
                              <input
                                type="checkbox"
                                checked={form.positions.includes(position)}
                                onChange={() => onToggleEditPosition(position)}
                              />
                              {position}
                            </label>
                          ))}
                        </div>
                      )}
                    </fieldset>
                    {editError && <p className="bench-edit-error">{editError}</p>}
                    <div className="bench-edit-actions">
                      <button type="submit">Tallenna</button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={onCancelEdit}
                      >
                        Peruuta
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bench-row">
                    <div className="bench-row-main">
                      <span className="bench-player-name">
                        {player.number} {player.name}
                        {player.captaincy !== "none" && (
                          <span className={`captaincy-pill captaincy-pill--${player.captaincy.toLowerCase()}`}>
                            {player.captaincy}
                          </span>
                        )}
                        {isSelected && (
                          <span className="lineup-pill">Kokoonpanossa</span>
                        )}
                      </span>
                     {player.positions.includes("MV") ? <span className="bench-roles"> {player.positions.join(", ")}</span> : <span></span>}
                    </div>
                    <div className="bench-row-actions">
                      <button type="button" onClick={() => onStartEdit(player)}>
                        Muokkaa
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => onRemove(player.id)}
                      >
                        Poista
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>

    {addModalOpen && (
      <div className="modal-backdrop" role="presentation">
        <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="add-player-modal-title">
          <h3 id="add-player-modal-title">Lisää uusi pelaaja</h3>
          <form data-testid="add-player-form" className="bench-edit-form" onSubmit={handleAddSubmit}>
            <div className="bench-edit-fields">
              <div className="bench-edit-field">
                <label htmlFor="new-player-number">Numero</label>
                <input
                  id="new-player-number"
                  type="number"
                  min="1"
                  value={newPlayerForm.number}
                  onChange={(event) => onUpdateNewPlayer("number", event.target.value)}
                />
              </div>
              <div className="bench-edit-field">
                <label htmlFor="new-player-name">Nimi</label>
                <input
                  id="new-player-name"
                  type="text"
                  value={newPlayerForm.name}
                  onChange={(event) => onUpdateNewPlayer("name", event.target.value)}
                />
              </div>
              <div className="bench-edit-field">
                <label htmlFor="new-player-role">Rooli</label>
                <select
                  id="new-player-role"
                  value={newPlayerForm.role}
                  onChange={(event) => onNewRoleChange(event.target.value)}
                >
                  <option value="player">{ROLE_LABELS.player}</option>
                  <option value="goalie">{ROLE_LABELS.goalie}</option>
                </select>
              </div>
              <div className="bench-edit-field">
                <label htmlFor="new-player-captaincy">Kapteenirooli</label>
                <select
                  id="new-player-captaincy"
                  value={newPlayerForm.captaincy}
                  onChange={(event) => onUpdateNewPlayer("captaincy", event.target.value)}
                >
                  {CAPTAINCY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <fieldset className="bench-edit-field bench-edit-fieldset">
              <legend>Pelipaikat</legend>
              {newPlayerForm.role === "goalie" ? (
                <p className="bench-edit-note">Maalivahdin pelipaikka on aina MV.</p>
              ) : (
                <div className="bench-edit-positions">
                  {POSITIONS.map((position) => (
                    <label key={position} className="bench-edit-checkbox">
                      <input
                        id={`new-position-${position}`}
                        type="checkbox"
                        checked={newPlayerForm.positions.includes(position)}
                        onChange={() => onToggleNewPosition(position)}
                      />
                      {position}
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            {newPlayerError && <p className="bench-edit-error">{newPlayerError}</p>}
            <div className="modal-actions">
              <button type="submit">Lisää pelaaja</button>
              <button type="button" className="secondary" onClick={closeAddModal}>
                Peruuta
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </section>
  );
};

export default PlayerRoster;
