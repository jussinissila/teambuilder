const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatRoleCell = (player) => {
  if (player.role === "goalie") return "MV";
  if (player.captaincy === "C") return "C";
  if (player.captaincy === "A") return "A";
  return "";
};

export const openRosterPdfPreview = (players, options = {}) => {
  const generatedDate = new Date().toISOString().split("T")[0];
  const metaDate = options.date || generatedDate;
  const teamName = options.teamName ? String(options.teamName).trim() : "";
  const title = options.title ? String(options.title).trim() : "Pelaajaluettelo";

  const sortedPlayers = [...players].sort((a, b) => {
    const aNumber = parseInt(a.number ?? 0, 10);
    const bNumber = parseInt(b.number ?? 0, 10);
    if (Number.isFinite(aNumber) && Number.isFinite(bNumber) && aNumber !== bNumber) {
      return aNumber - bNumber;
    }
    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });

  const rows = sortedPlayers
    .map((player) => {
      const number = escapeHtml(player.number);
      const role = escapeHtml(formatRoleCell(player));
      const name = escapeHtml(player.name);
      return `<tr>
        <td class="col-number">${number}</td>
        <td class="col-role">${role}</td>
        <td class="col-name">${name}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
  <html lang="fi">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(title)}</title>
      <style>
        :root {
          color-scheme: light;
        }
        body {
          font-family: "Helvetica Neue", Arial, sans-serif;
          margin: 40px;
          color: #111827;
        }
        h1 {
          margin: 0 0 24px;
          font-size: 24px;
          text-align: center;
        }
        .meta {
          text-align: center;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 24px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        thead {
          background: #f3f4f6;
        }
        th, td {
          padding: 5px 5px;
          border: 1px solid #d1d5db;
          text-align: left;
        }
        th {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #4b5563;
        }
        .col-number {
          width: 60px;
        }
        .col-role {
          width: 80px;
        }
        .col-name {
          width: auto;
        }
      </style>
    </head>
    <body>
      <h1>${escapeHtml(title)}</h1>
      ${
        teamName
          ? `<div class="meta"><strong>Joukkue:</strong> ${escapeHtml(teamName)}</div>`
          : ""
      }
      <div class="meta"><strong>Päivämäärä:</strong> ${escapeHtml(metaDate)}</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Rooli</th>
            <th>Nimi</th>
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="3">Ei pelaajia</td></tr>`}
        </tbody>
      </table>
      <script>
        window.onload = function () {
          setTimeout(function () {
            window.print();
          }, 150);
        };
      </script>
    </body>
  </html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    window.alert("Ponnahdusikkunan avaaminen estettiin. Salli ponnahdusikkunat tallentaaksesi PDF:n.");
    return;
  }

  const cleanup = () => {
    URL.revokeObjectURL(url);
  };

  win.addEventListener("beforeunload", cleanup, { once: true });

  try {
    win.focus();
  } catch (error) {
    // ignore focus errors
  }
};
