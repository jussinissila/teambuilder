import { useRef, useState } from "react";
import GoalieSection from "../components/GoalieSection";
import LineupSection from "../components/LineupSection";
import SummarySection from "../components/SummarySection";
import { POSITIONS, POSITION_LABELS } from "../constants/players";
import { openRosterPdfPreview } from "../utils/rosterPdf";

const LineupView = ({
  lineSelections,
  handleLineSelection,
  goalieSelections,
  handleGoalieSelection,
  getPlayerOptions,
  getGoalieOptions,
  playerIndex,
  exportLineup,
  importLineup,
  lineupPlayers,
}) => {
  const fileInputRef = useRef(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfTeamName, setPdfTeamName] = useState("");
  const [pdfDate, setPdfDate] = useState(() => new Date().toISOString().split("T")[0]);

  const triggerFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImport = (event) => {
    if (!importLineup) return;
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = typeof reader.result === "string" ? reader.result : "";
        const data = JSON.parse(text || "{}");
        const result = importLineup(data);
        if (!result?.ok) {
          window.alert(result?.error || "Kokoonpanon lataus epäonnistui.");
        }
      } catch (error) {
        window.alert("Kokoonpanon lataus epäonnistui.");
      } finally {
        event.target.value = "";
      }
    };
    reader.onerror = () => {
      window.alert("Kokoonpanon lataus epäonnistui.");
      event.target.value = "";
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (!exportLineup) return;
    try {
      const data = exportLineup();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().split("T")[0];
      link.href = url;
      link.download = `lineup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      window.alert("Kokoonpanon tallennus epäonnistui.");
    }
  };

  return (
    <div className="lineup-view">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json"
        style={{ display: "none" }}
        onChange={handleImport}
      />

      <div className="lineup-toolbar">
        <button type="button" onClick={triggerFileDialog}>
          Lataa kokoonpano
        </button>
        <button type="button" className="secondary" onClick={handleExport}>
          Tallenna kokoonpano
        </button>
        <button type="button" className="secondary" onClick={() => {
          setPdfTeamName("");
          setPdfDate(new Date().toISOString().split("T")[0]);
          setPdfModalOpen(true);
        }}>
          Tulosta kokoonpano PDF
        </button>
      </div>

      <LineupSection
        lineSelections={lineSelections}
        positions={POSITIONS}
        positionLabels={POSITION_LABELS}
        getPlayerOptions={getPlayerOptions}
        onSelect={handleLineSelection}
      />

      <GoalieSection
        goalieSelections={goalieSelections}
        getGoalieOptions={getGoalieOptions}
        onSelect={handleGoalieSelection}
      />

      <SummarySection
        lineSelections={lineSelections}
        goalieSelections={goalieSelections}
        positions={POSITIONS}
        positionLabels={POSITION_LABELS}
        playerIndex={playerIndex}
      />

      {pdfModalOpen && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-dialog" role="dialog" aria-modal="true" aria-labelledby="lineup-pdf-title">
            <h3 id="lineup-pdf-title">Tallennettavan PDF:n tiedot</h3>
            <div className="modal-fields">
              <label className="modal-field">
                <span>Joukkueen nimi</span>
                <input
                  type="text"
                  value={pdfTeamName}
                  onChange={(event) => setPdfTeamName(event.target.value)}
                />
              </label>
              <label className="modal-field">
                <span>Päivämäärä</span>
                <input
                  type="date"
                  value={pdfDate}
                  onChange={(event) => setPdfDate(event.target.value)}
                />
              </label>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  const effectiveDate = pdfDate || new Date().toISOString().split("T")[0];
                  if (!lineupPlayers || lineupPlayers.length === 0) {
                    window.alert("Kokoonpano on tyhjä.");
                    return;
                  }
                  openRosterPdfPreview(lineupPlayers, {
                    teamName: pdfTeamName,
                    date: effectiveDate,
                    title: "Pelaajaluettelo",
                  });
                  setPdfModalOpen(false);
                }}
              >
                Tulosta PDF
              </button>
              <button type="button" className="secondary" onClick={() => setPdfModalOpen(false)}>
                Peruuta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LineupView;
