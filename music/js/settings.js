
window.TMSettings = {
  storageKey: "taxMelodySettings",

  defaults: {
    bgmVolume: 0.8,
    seVolume: 0.7,
    noteSpeed: 1,
    judgeStrictness: "normal",
    bgBrightness: 0.85,
    showFps: false
  },

  values: {},

  init() {
    this.values = {
      ...this.defaults,
      ...this.load()
    };

    this.bindControls();
    this.syncControls();
    this.applyAll();
  },

  load() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch (error) {
      console.warn("讀取遊戲設定失敗：", error);
      return {};
    }
  },

  save() {
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify(this.values)
      );
    } catch (error) {
      console.warn("儲存遊戲設定失敗：", error);
    }
  },

  bindControls() {
    const bgmVolume = document.getElementById("bgmVolume");
    const seVolume = document.getElementById("seVolume");
    const noteSpeed = document.getElementById("noteSpeed");
    const judgeStrictness = document.getElementById("judgeStrictness");
    const bgBrightness = document.getElementById("bgBrightness");
    const fpsToggle = document.getElementById("fpsToggle");
    const fullscreenButton = document.getElementById("fullscreenButton");

    bgmVolume?.addEventListener("input", () => {
      this.values.bgmVolume = Number(bgmVolume.value);
      this.save();
      this.applyBgmVolume();
    });

    seVolume?.addEventListener("input", () => {
      this.values.seVolume = Number(seVolume.value);
      this.save();
      this.applySeVolume();
    });

    noteSpeed?.addEventListener("input", () => {
      this.values.noteSpeed = Number(noteSpeed.value);
      this.save();
      this.updateNoteSpeedOutput();
    });

    judgeStrictness?.addEventListener("change", () => {
      this.values.judgeStrictness = judgeStrictness.value;
      this.save();
    });

    bgBrightness?.addEventListener("input", () => {
      this.values.bgBrightness = Number(bgBrightness.value);
      this.save();
      this.applyBrightness();
    });

    fpsToggle?.addEventListener("change", () => {
      this.values.showFps = Boolean(fpsToggle.checked);
      this.save();
      this.applyFps();
    });

    fullscreenButton?.addEventListener("click", async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
          fullscreenButton.textContent = "離開全螢幕";
        } else {
          await document.exitFullscreen();
          fullscreenButton.textContent = "切換全螢幕";
        }
      } catch (error) {
        console.warn("全螢幕切換失敗：", error);
        window.UI?.toast?.("這個瀏覽器不支援全螢幕");
      }
    });

    document.addEventListener("fullscreenchange", () => {
      if (!fullscreenButton) return;
      fullscreenButton.textContent = document.fullscreenElement
        ? "離開全螢幕"
        : "切換全螢幕";
    });
  },

  syncControls() {
    const bgmVolume = document.getElementById("bgmVolume");
    const seVolume = document.getElementById("seVolume");
    const noteSpeed = document.getElementById("noteSpeed");
    const judgeStrictness = document.getElementById("judgeStrictness");
    const bgBrightness = document.getElementById("bgBrightness");
    const fpsToggle = document.getElementById("fpsToggle");

    if (bgmVolume) bgmVolume.value = this.values.bgmVolume;
    if (seVolume) seVolume.value = this.values.seVolume;
    if (noteSpeed) noteSpeed.value = this.values.noteSpeed;
    if (judgeStrictness) {
      judgeStrictness.value = this.values.judgeStrictness;
    }
    if (bgBrightness) {
      bgBrightness.value = this.values.bgBrightness;
    }
    if (fpsToggle) fpsToggle.checked = this.values.showFps;

    this.updateNoteSpeedOutput();
  },

  updateNoteSpeedOutput() {
    const output = document.getElementById("noteSpeedOut");
    if (!output) return;

    output.textContent =
      `${Number(this.values.noteSpeed).toFixed(2)}×`;
  },

  applyAll() {
    this.applyBgmVolume();
    this.applySeVolume();
    this.applyBrightness();
    this.applyFps();
  },

  applyBgmVolume() {
    const volume = Math.max(
      0,
      Math.min(1, Number(this.values.bgmVolume))
    );

    const song = document.getElementById("song");
    const preview = document.getElementById("songPreview");
    const login = document.getElementById("loginBgm");

    if (song) song.volume = volume;
    if (preview) preview.volume = volume;
    if (login) login.volume = Math.min(volume, 0.45);
  },

  applySeVolume() {
    const volume = Math.max(
      0,
      Math.min(1, Number(this.values.seVolume))
    );

    if (window.TMSFX?.masterGain && window.TMSFX?.context) {
      window.TMSFX.masterGain.gain.setValueAtTime(
        volume,
        window.TMSFX.context.currentTime
      );
    }
  },

  applyBrightness() {
    const value = Math.max(
      0.45,
      Math.min(1, Number(this.values.bgBrightness))
    );

    document.documentElement.style.setProperty(
      "--game-bg-brightness",
      String(value)
    );

    const gameStage = document.querySelector(".game-stage");
    if (gameStage) {
      gameStage.style.filter = `brightness(${value})`;
    }
  },

  applyFps() {
    const fps = document.getElementById("fpsCounter");
    if (!fps) return;

    fps.classList.toggle(
      "hidden",
      !this.values.showFps
    );
  }
};
