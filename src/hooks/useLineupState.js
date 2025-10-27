import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LINE_COUNT,
  POSITIONS
} from "../constants/players";
import {
  createNewPlayerForm,
  generatePlayerId,
  normalizeCaptaincy,
  sortPlayers,
  sortPositions,
} from "../utils/players";

const STORAGE_KEY = "nibacos.players";

const normalizeRosterPlayers = (rawList) => {
  const list = Array.isArray(rawList) ? rawList : [];
  const seenIds = new Set();
  let captainOwner = null;
  const normalized = [];

  list.forEach((item) => {
    if (!item) return;
    const name = typeof item.name === "string" ? item.name.trim() : "";
    if (!name) return;
    const number = parseInt(item.number ?? "", 10);
    if (!Number.isInteger(number) || number <= 0) return;
    const role = item.role === "goalie" ? "goalie" : "player";

    let positions;
    if (role === "goalie") {
      positions = ["MV"];
    } else {
      const rawPositions = Array.isArray(item.positions) ? item.positions : [];
      const filtered = rawPositions.filter((pos) => POSITIONS.includes(pos));
      positions = filtered.length ? sortPositions([...new Set(filtered)]) : ["VH"];
    }

    let id = typeof item.id === "string" ? item.id.trim() : "";
    while (!id || seenIds.has(id)) {
      id = generatePlayerId();
    }
    seenIds.add(id);

    let captaincy = normalizeCaptaincy(item.captaincy);
    if (captaincy === "C") {
      if (!captainOwner) {
        captainOwner = id;
      } else {
        captaincy = "none";
      }
    }

    normalized.push({ id, number, name, role, positions, captaincy });
  });

  return sortPlayers(normalized);
};

const createEmptyLine = () =>
  POSITIONS.reduce(
    (acc, pos) => ({
      ...acc,
      [pos]: null,
    }),
    {}
  );

export const useLineupState = (initialPlayers) => {
  const [playerList, setPlayerList] = useState(() => {
    let source = initialPlayers;
    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length) {
            source = parsed;
          }
        }
      } catch (error) {
        console.warn("Failed to read stored players", error);
      }
    }
    return normalizeRosterPlayers(source);
  });
  const [lineSelections, setLineSelections] = useState(() =>
    Array.from({ length: LINE_COUNT }, () => createEmptyLine())
  );
  const [goalieSelections, setGoalieSelections] = useState([null, null]);
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editError, setEditError] = useState("");
  const [newPlayerForm, setNewPlayerForm] = useState(() => createNewPlayerForm());
  const [newPlayerError, setNewPlayerError] = useState("");

  const players = useMemo(
    () => playerList.filter((player) => player.role !== "goalie"),
    [playerList]
  );
  const goalies = useMemo(
    () => playerList.filter((player) => player.role === "goalie"),
    [playerList]
  );

  const selectedPlayerIds = useMemo(() => {
    const ids = new Set();
    lineSelections.forEach((line) => {
      POSITIONS.forEach((pos) => {
        if (line[pos]) ids.add(line[pos]);
      });
    });
    goalieSelections.forEach((id) => {
      if (id) ids.add(id);
    });
    return ids;
  }, [lineSelections, goalieSelections]);

  const getPlayerOptions = useCallback(
    (position, currentId) =>
      players
        .filter((player) => player.positions.includes(position))
        .filter((player) => !selectedPlayerIds.has(player.id) || player.id === currentId)
        .sort((a, b) => a.number - b.number),
    [players, selectedPlayerIds]
  );

  const getGoalieOptions = useCallback(
    (currentId) =>
      goalies
        .filter((player) => !selectedPlayerIds.has(player.id) || player.id === currentId)
        .sort((a, b) => a.number - b.number),
    [goalies, selectedPlayerIds]
  );

  const playerIndex = useMemo(() => {
    const map = new Map();
    playerList.forEach((player) => map.set(player.id, player));
    return map;
  }, [playerList]);

  const benchCounts = useMemo(() => {
    const playerCount = playerList.filter((player) => player.role !== "goalie").length;
    const goalieCount = playerList.filter((player) => player.role === "goalie").length;
    return { playerCount, goalieCount };
  }, [playerList]);

  const benchPlayers = playerList;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(playerList));
    } catch (error) {
      console.warn("Failed to persist players", error);
    }
  }, [playerList]);

  const handleLineSelection = useCallback((lineIndex, position, playerId) => {
    setLineSelections((prev) => {
      const next = prev.map((line) => ({ ...line }));
      next[lineIndex][position] = playerId || null;
      return next;
    });
  }, []);

  const handleGoalieSelection = useCallback((slotIndex, playerId) => {
    setGoalieSelections((prev) => {
      const next = [...prev];
      next[slotIndex] = playerId || null;
      return next;
    });
  }, []);

  const startEditingPlayer = useCallback((player) => {
    setEditingPlayerId(player.id);
    setEditForm({
      number: String(player.number ?? ""),
      name: player.name ?? "",
      role: player.role === "goalie" ? "goalie" : "player",
      positions: sortPositions([...player.positions]),
      captaincy: normalizeCaptaincy(player.captaincy),
    });
    setEditError("");
  }, []);

  const cancelEditingPlayer = useCallback(() => {
    setEditingPlayerId(null);
    setEditForm(null);
    setEditError("");
  }, []);

  const updateEditField = useCallback((field, value) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const handleEditRoleChange = useCallback((role) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      if (role === "goalie") {
        return { ...prev, role, positions: ["MV"] };
      }
      const filtered = prev.positions.filter((pos) => pos !== "MV");
      return {
        ...prev,
        role,
        positions: filtered.length ? sortPositions([...new Set(filtered)]) : ["VH"],
      };
    });
    setEditError("");
  }, []);

  const toggleEditPosition = useCallback((position) => {
    setEditForm((prev) => {
      if (!prev) return prev;
      const has = prev.positions.includes(position);
      const nextPositions = has
        ? prev.positions.filter((pos) => pos !== position)
        : sortPositions([...prev.positions, position]);
      return { ...prev, positions: nextPositions };
    });
    setEditError("");
  }, []);

  const saveEditedPlayer = useCallback(
    (playerId) => {
      if (!editForm) return;
      const role = editForm.role === "goalie" ? "goalie" : "player";
      const name = (editForm.name || "").trim();
      const number = parseInt(editForm.number ?? "", 10);
      const allowedPositions = role === "goalie" ? ["MV"] : POSITIONS;
      const captaincy = normalizeCaptaincy(editForm.captaincy);
      const positions =
        role === "goalie"
          ? ["MV"]
          : sortPositions(
              Array.from(
                new Set(editForm.positions.filter((pos) => allowedPositions.includes(pos)))
              )
            );

      if (!name) {
        setEditError("Nimi on pakollinen.");
        return;
      }
      if (!Number.isInteger(number) || number <= 0) {
        setEditError("Numero tulee olla positiivinen kokonaisluku.");
        return;
      }
      if (positions.length === 0) {
        setEditError("Valitse vähintään yksi pelipaikka.");
        return;
      }

      setPlayerList((prev) => {
        let next = prev.map((player) =>
          player.id === playerId
            ? {
                ...player,
                name,
                number,
                role,
                positions: role === "goalie" ? ["MV"] : positions,
                captaincy,
              }
            : player
        );

        if (captaincy === "C") {
          next = next.map((player) =>
            player.id !== playerId && player.captaincy === "C"
              ? { ...player, captaincy: "none" }
              : player
          );
        }

        return sortPlayers(next);
      });
      cancelEditingPlayer();
    },
    [cancelEditingPlayer, editForm]
  );

  const resetNewPlayerForm = useCallback(() => {
    setNewPlayerForm(createNewPlayerForm());
    setNewPlayerError("");
  }, []);

  const updateNewPlayerField = useCallback((field, value) => {
    setNewPlayerForm((prev) => ({ ...prev, [field]: value }));
    setNewPlayerError("");
  }, []);

  const handleNewPlayerRoleChange = useCallback((role) => {
    setNewPlayerForm((prev) => {
      if (role === "goalie") {
        return { ...prev, role, positions: ["MV"] };
      }
      const filtered = prev.positions.filter((pos) => pos !== "MV");
      return {
        ...prev,
        role,
        positions: filtered.length
          ? sortPositions([...new Set(filtered)])
          : sortPositions(POSITIONS),
      };
    });
    setNewPlayerError("");
  }, []);

  const toggleNewPlayerPosition = useCallback((position) => {
    setNewPlayerForm((prev) => {
      const has = prev.positions.includes(position);
      const nextPositions = has
        ? prev.positions.filter((pos) => pos !== position)
        : sortPositions([...prev.positions, position]);
      return { ...prev, positions: nextPositions };
    });
    setNewPlayerError("");
  }, []);

  const addNewPlayer = useCallback(() => {
    const role = newPlayerForm.role === "goalie" ? "goalie" : "player";
    const name = (newPlayerForm.name || "").trim();
    const number = parseInt(newPlayerForm.number ?? "", 10);
    const allowedPositions = role === "goalie" ? ["MV"] : POSITIONS;
    const captaincy = normalizeCaptaincy(newPlayerForm.captaincy);
    const positions =
      role === "goalie"
        ? ["MV"]
        : sortPositions(
            Array.from(new Set(newPlayerForm.positions.filter((pos) => allowedPositions.includes(pos))))
          );

    if (!name) {
      setNewPlayerError("Nimi on pakollinen.");
      return;
    }
    if (!Number.isInteger(number) || number <= 0) {
      setNewPlayerError("Numero tulee olla positiivinen kokonaisluku.");
      return;
    }
    if (positions.length === 0) {
      setNewPlayerError("Valitse vähintään yksi pelipaikka.");
      return;
    }

    const newPlayer = {
      id: generatePlayerId(),
      number,
      name,
      role,
      positions: role === "goalie" ? ["MV"] : positions,
      captaincy,
    };

    setPlayerList((prev) => {
      let next = prev;
      if (captaincy === "C") {
        next = next.map((player) =>
          player.captaincy === "C" ? { ...player, captaincy: "none" } : player
        );
      }
      next = [...next, newPlayer];
      return sortPlayers(next);
    });
    resetNewPlayerForm();
  }, [newPlayerForm, resetNewPlayerForm]);

  const removePlayer = useCallback((playerId) => {
    setPlayerList((prev) => prev.filter((player) => player.id !== playerId));
    setLineSelections((prev) =>
      prev.map((line) => {
        const next = { ...line };
        POSITIONS.forEach((pos) => {
          if (next[pos] === playerId) {
            next[pos] = null;
          }
        });
        return next;
      })
    );
    setGoalieSelections((prev) => prev.map((id) => (id === playerId ? null : id)));
    if (editingPlayerId === playerId) {
      cancelEditingPlayer();
    }
  }, [cancelEditingPlayer, editingPlayerId]);

  const importPlayers = useCallback((rawPlayers) => {
    const normalized = normalizeRosterPlayers(rawPlayers);
    if (!normalized.length) {
      return { ok: false, error: "Tiedosto ei sisältänyt kelvollisia pelaajia." };
    }

    setPlayerList(normalized);
    setLineSelections(Array.from({ length: LINE_COUNT }, () => createEmptyLine()));
    setGoalieSelections([null, null]);
    setEditingPlayerId(null);
    setEditForm(null);
    setEditError("");
    setNewPlayerForm(createNewPlayerForm());
    setNewPlayerError("");
    return { ok: true, count: normalized.length };
  }, []);

  const exportPlayers = useCallback(
    () =>
      playerList.map((player) => ({
        id: player.id,
        number: player.number,
        name: player.name,
        role: player.role,
        positions: [...player.positions],
        captaincy: player.captaincy ?? "none",
      })),
    [playerList]
  );

  const exportLineup = useCallback(() => {
    const lines = lineSelections.map((line) => {
      const entry = {};
      POSITIONS.forEach((pos) => {
        entry[pos] = line[pos] || null;
      });
      return entry;
    });
    return {
      meta: {
        savedAt: new Date().toISOString(),
        version: 1,
      },
      lines,
      goalies: goalieSelections.map((id) => id || null),
    };
  }, [goalieSelections, lineSelections]);

  const importLineup = useCallback(
    (payload) => {
      if (!payload || !Array.isArray(payload.lines) || !Array.isArray(payload.goalies)) {
        return { ok: false, error: "Tiedoston rakenne on virheellinen." };
      }

      const available = new Set(playerList.map((player) => player.id));
      const used = new Set();

      const nextLines = Array.from({ length: LINE_COUNT }, (_, index) => {
        const source = payload.lines[index] || {};
        const line = createEmptyLine();
        POSITIONS.forEach((pos) => {
          const id = typeof source[pos] === "string" ? source[pos] : null;
          if (id && available.has(id) && !used.has(id)) {
            line[pos] = id;
            used.add(id);
          }
        });
        return line;
      });

      const nextGoalies = [null, null];
      payload.goalies.slice(0, 2).forEach((id, idx) => {
        if (typeof id === "string" && available.has(id) && !used.has(id)) {
          nextGoalies[idx] = id;
          used.add(id);
        }
      });

      setLineSelections(nextLines);
      setGoalieSelections(nextGoalies);
      return { ok: true };
    },
    [playerList]
  );

  return {
    playerList,
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
  };
};
