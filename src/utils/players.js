import { POSITIONS } from "../constants/players";

export const sortPositions = (positions) => {
  const order = new Map(POSITIONS.map((pos, index) => [pos, index]));
  return [...positions].sort(
    (a, b) => (order.get(a) ?? POSITIONS.length) - (order.get(b) ?? POSITIONS.length)
  );
};

export const sortPlayers = (players) =>
  [...players].sort((a, b) => {
    const numberDelta = (a.number ?? 0) - (b.number ?? 0);
    if (numberDelta !== 0) return numberDelta;
    return String(a.name).localeCompare(String(b.name));
  });

export const createNewPlayerForm = () => ({
  number: "",
  name: "",
  role: "player",
  positions: [...POSITIONS],
  captaincy: "none",
});

export const generatePlayerId = () =>
  `player-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;

export const normalizeCaptaincy = (value) =>
  value === "C" || value === "A" ? value : "none";

export const formatPlayer = (player) => {
  const suffix =
    player && (player.captaincy === "C" || player.captaincy === "A")
      ? ` (${player.captaincy})`
      : "";
  return `${player.number} ${player.name}${suffix}`;
};
