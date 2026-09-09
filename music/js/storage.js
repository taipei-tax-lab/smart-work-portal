window.TMStorage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem("tm2_" + key)) ?? fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem("tm2_" + key, JSON.stringify(value));
    } catch {}
  },

  favorite(id) {
    const list = this.get("favorites", []);
    const next = list.includes(id)
      ? list.filter((item) => item !== id)
      : [...list, id];

    this.set("favorites", next);
    return next;
  },

  saveScore(songId, difficulty, result) {
    const scores = this.get("scores", {});
    const key = `${songId}:${difficulty}`;
    const savedAt = new Date().toISOString();
    const current = scores[key];

    const normalized = {
      ...result,
      savedAt,
      songId,
      difficulty
    };

    if (!current || Number(result.score || 0) > Number(current.score || 0)) {
      scores[key] = normalized;
    } else if (result.cleared && !current.cleared) {
      scores[key] = {
        ...current,
        cleared: true,
        savedAt
      };
    }

    this.set("scores", scores);

    const history = this.get("playHistory", []);
    history.unshift({
      songId,
      difficulty,
      score: Number(result.score || 0),
      maxCombo: Number(result.maxCombo || result.combo || 0),
      accuracy: Number(result.accuracy || 0),
      cleared: Boolean(result.cleared),
      playedAt: savedAt
    });

    this.set("playHistory", history.slice(0, 200));
  },

  unlockAchievement(id) {
    const achievements = this.get("achievements", []);

    if (!achievements.includes(id)) {
      achievements.push(id);
      this.set("achievements", achievements);
      return true;
    }

    return false;
  }
};
