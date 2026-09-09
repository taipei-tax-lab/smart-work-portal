window.TMAudio = {
  el: null,

  load(song) {
    this.el = document.getElementById("song");
    this.el.src = song.audio;
    this.el.volume = TMSettings.values.bgmVolume;
    this.el.load();
  },

  async play() {
    await this.el.play();
  },

  pause() {
    this.el.pause();
  },

  stop() {
    this.el.pause();
    this.el.currentTime = 0;
  },

  seek(t) {
    this.el.currentTime = t;
  },

  time() {
    return this.el?.currentTime || 0;
  },

  duration() {
    return this.el?.duration || 247.92;
  }
};

/* 登入首頁 BGM */
const loginBgm = document.getElementById("loginBgm");
const enterOverlay = document.getElementById("enterOverlay");
const enterGameButton = document.getElementById("enterGameButton");

if (loginBgm && enterOverlay && enterGameButton) {
  loginBgm.volume = 0.3;

  enterGameButton.addEventListener("click", async function () {
    try {
      await loginBgm.play();

      enterOverlay.classList.add("hide");

      setTimeout(function () {
        enterOverlay.style.display = "none";
      }, 400);
    } catch (error) {
      console.log("登入音樂播放失敗", error);
    }
  });
}


/* =========================================================
   遊戲按鍵音效 V2
   - 點擊登入、觸碰畫面時先解除手機瀏覽器音效限制
   - 不需要額外 MP3
   ========================================================= */
window.TMSFX = {
  context: null,
  masterGain: null,
  unlocked: false,

  createContext() {
    if (this.context) return this.context;

    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return null;

    this.context = new AudioContextClass();
    this.masterGain = this.context.createGain();
    this.masterGain.connect(this.context.destination);

    return this.context;
  },

  async unlock() {
    const ctx = this.createContext();
    if (!ctx) return false;

    try {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }

      /* 播放極短靜音，讓部分 Android 瀏覽器完成解鎖 */
      const buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      this.unlocked = ctx.state === "running";
      return this.unlocked;
    } catch (error) {
      console.warn("音效解鎖失敗：", error);
      return false;
    }
  },

  getVolume() {
    const value =
      window.TMSettings && TMSettings.values
        ? Number(TMSettings.values.seVolume ?? 0.8)
        : 0.8;

    if (!Number.isFinite(value)) return 0.8;
    if (value <= 0) return 0;

    /* 避免手機上太小聲，保留設定但設最低可聽音量 */
    return Math.min(1, Math.max(0.45, value));
  },

  async tone({
    frequency = 520,
    duration = 0.07,
    type = "square",
    gain = 0.2,
    slideTo = null
  } = {}) {
    const ctx = this.createContext();
    if (!ctx || !this.masterGain) return;

    if (ctx.state !== "running") {
      const ok = await this.unlock();
      if (!ok) return;
    }

    const volume = this.getVolume();
    if (volume <= 0) return;

    this.masterGain.gain.value = volume;

    const now = ctx.currentTime + 0.005;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    if (slideTo) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(30, slideTo),
        now + duration
      );
    }

    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(gain, now + 0.008);
    envelope.gain.exponentialRampToValueAtTime(
      0.0001,
      now + duration
    );

    oscillator.connect(envelope);
    envelope.connect(this.masterGain);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.03);
  },
tap(lane = 0) {
  // 第一聲「叮」
  this.tone({
    frequency: 900,
    duration: 0.045,
    type: "sine",
    gain: 0.12,
    slideTo: 1050
  });

  // 第二聲「叮」
  setTimeout(() => {
    this.tone({
      frequency: 1150,
      duration: 0.05,
      type: "sine",
      gain: 0.1,
      slideTo: 1300
    });
  }, 55);
},
  judge(result) {
    const settings = {
      PERFECT: { frequency: 980, duration: 0.09, gain: 0.13 },
      GREAT: { frequency: 790, duration: 0.08, gain: 0.11 },
      GOOD: { frequency: 610, duration: 0.07, gain: 0.09 }
    };

    const item = settings[result];
    if (!item) return;

    this.tone({
      ...item,
      type: "triangle",
      slideTo: item.frequency * 1.12
    });
  }
};

/* 第一次點擊或觸碰頁面時先解鎖音效 */
document.addEventListener(
  "pointerdown",
  function unlockGameSound() {
    if (window.TMSFX) {
      TMSFX.unlock();
    }
  },
  { passive: true, once: true }
);

document.addEventListener(
  "keydown",
  function unlockGameSoundByKeyboard() {
    if (window.TMSFX) {
      TMSFX.unlock();
    }
  },
  { once: true }
);

if (enterGameButton) {
  enterGameButton.addEventListener("click", function () {
    if (window.TMSFX) {
      TMSFX.unlock();
    }
  });
}
