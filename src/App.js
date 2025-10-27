import { useMemo, useState } from "react";
import "./App.css";
import initialPlayers from "./data/players.json";
import { useLineupState } from "./hooks/useLineupState";
import LineupView from "./views/LineupView";
import PlayerRosterView from "./views/PlayerRosterView";
import { POSITIONS } from "./constants/players";

const App = () => {
  const [activeView, setActiveView] = useState("lineup"); // lineup | roster
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    lineSelections,
    handleLineSelection,
    goalieSelections,
    handleGoalieSelection,
    getPlayerOptions,
    getGoalieOptions,
    playerIndex,
    benchPlayers,
    benchCounts,
    editingPlayerId,
    editForm,
    editError,
    startEditingPlayer,
    cancelEditingPlayer,
    updateEditField,
    handleEditRoleChange,
    toggleEditPosition,
    saveEditedPlayer,
    newPlayerForm,
    newPlayerError,
    updateNewPlayerField,
    handleNewPlayerRoleChange,
    toggleNewPlayerPosition,
    addNewPlayer,
    resetNewPlayerForm,
    removePlayer,
    importPlayers,
    exportPlayers,
    exportLineup,
    importLineup,
    selectedPlayerIds,
  } = useLineupState(initialPlayers);

  const navigation = useMemo(
    () => [
      { id: "lineup", label: "Etusivu" },
      { id: "roster", label: "Pelaajaluettelo" },
    ],
    []
  );

  const lineupPlayers = useMemo(() => {
    const seen = new Set();
    const selected = [];

    lineSelections.forEach((line) => {
      POSITIONS.forEach((pos) => {
        const id = line[pos];
        if (!id || seen.has(id)) return;
        const player = playerIndex.get(id);
        if (player) {
          selected.push(player);
          seen.add(id);
        }
      });
    });

    goalieSelections.forEach((id) => {
      if (!id || seen.has(id)) return;
      const player = playerIndex.get(id);
      if (player) {
        selected.push(player);
        seen.add(id);
      }
    });

    return selected;
  }, [lineSelections, goalieSelections, playerIndex]);

  return (
    <div className="app">
      <header className="app-banner">
        <div className="banner-top">
          <h1>Nibacos-kokoonpanon rakentaja</h1>
          <button
            className={mobileMenuOpen ? "nav-button active" : "nav-button"}
            type="button"
            aria-label="Näytä valikko"
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            <span className="burger-lines" aria-hidden="true" />
          </button>
        </div>
        <span className="banner-subtitle">Koosta ketjut ja hallitse kokoonpanoa helposti</span>
        <div className={mobileMenuOpen ? "nav-links open" : "nav-links"}>
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === activeView ? "nav-link active" : "nav-link"}
              onClick={() => {
                setActiveView(item.id);
                setMobileMenuOpen(false);
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="app-body">
        {activeView === "lineup" ? (
          <LineupView
            lineSelections={lineSelections}
            handleLineSelection={handleLineSelection}
            goalieSelections={goalieSelections}
            handleGoalieSelection={handleGoalieSelection}
            getPlayerOptions={getPlayerOptions}
            getGoalieOptions={getGoalieOptions}
            playerIndex={playerIndex}
            exportLineup={exportLineup}
            importLineup={importLineup}
            lineupPlayers={lineupPlayers}
          />
        ) : (
          <PlayerRosterView
            benchPlayers={benchPlayers}
            benchCounts={benchCounts}
            editingPlayerId={editingPlayerId}
            editForm={editForm}
            editError={editError}
            newPlayerForm={newPlayerForm}
            newPlayerError={newPlayerError}
            onStartEdit={startEditingPlayer}
            onCancelEdit={cancelEditingPlayer}
            onUpdateEditField={updateEditField}
            onEditRoleChange={handleEditRoleChange}
            onToggleEditPosition={toggleEditPosition}
            onSaveEdit={saveEditedPlayer}
            onRemove={removePlayer}
            onUpdateNewPlayer={updateNewPlayerField}
            onNewRoleChange={handleNewPlayerRoleChange}
            onToggleNewPosition={toggleNewPlayerPosition}
            onAddNewPlayer={addNewPlayer}
            onResetNewPlayer={resetNewPlayerForm}
            onImportPlayers={importPlayers}
            onExportPlayers={exportPlayers}
            selectedPlayerIds={selectedPlayerIds}
          />
        )}
      </main>
    </div>
  );
};

export default App;
