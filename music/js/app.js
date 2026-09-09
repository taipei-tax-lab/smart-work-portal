document.addEventListener("DOMContentLoaded", function () {
  const songs =
    window.TAX_MELODY_DATA && Array.isArray(TAX_MELODY_DATA.songs)
      ? TAX_MELODY_DATA.songs
      : [];

  const firstSong = songs[0] || null;

  if (window.UI) {
    UI.currentSong = UI.currentSong || firstSong;
  }

  /* ---------------------------------------------------------
     先綁定所有頁面按鈕
     即使設定或遊戲初始化出錯，學習中心仍可正常開啟
     --------------------------------------------------------- */
  document.querySelectorAll("[data-go]").forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();

      const target = button.dataset.go;

      if (!window.UI) {
        console.error("UI 尚未載入");
        return;
      }

      if (target === "learning") {
        UI.currentSong = UI.currentSong || firstSong;
      }

      UI.show(target);
    });
  });

  /* 首頁與結算頁的學習按鈕，再加一層保險 */
  const learningButtons = [
    ...document.querySelectorAll('[data-go="learning"]'),
    document.getElementById("toLearningButton"),
  ].filter(Boolean);

  learningButtons.forEach(function (button) {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      UI.currentSong =
        (window.TMGame && TMGame.song) || UI.currentSong || firstSong;

      UI.show("learning");
    });
  });

  /* 提示訊息 */
  document.querySelectorAll("[data-toast]").forEach(function (button) {
    button.addEventListener("click", function () {
      if (window.UI) UI.toast(button.dataset.toast);
    });
  });

  /* ---------------------------------------------------------
     個別初始化，任何一項失敗都不會阻斷頁面按鈕
     --------------------------------------------------------- */
  try {
    if (window.TMSettings && typeof TMSettings.init === "function") {
      TMSettings.init();
    }
  } catch (error) {
    console.error("設定初始化失敗：", error);
  }

  try {
    if (window.TMGame && typeof TMGame.init === "function") {
      TMGame.init();
    }
  } catch (error) {
    console.error("遊戲初始化失敗：", error);
  }

  /* 首頁開始新歌 */
  const quickStart = document.getElementById("quickStart");

  if (quickStart) {
    quickStart.addEventListener("click", function () {
      const loginBgm = document.getElementById("loginBgm");

      if (loginBgm) {
        loginBgm.pause();
        loginBgm.currentTime = 0;
      }

      UI.show("songs");
    });
  }

  /* 難度選擇 */
  document.querySelectorAll("[data-difficulty]").forEach(function (button) {
    button.addEventListener("click", function () {
      document
        .querySelectorAll("[data-difficulty]")
        .forEach(function (item) {
          item.classList.remove("active");
        });

      button.classList.add("active");
      UI.currentDifficulty = button.dataset.difficulty;
      UI.renderSongs();
    });
  });

  /* 遊戲控制 */
  const pauseButton = document.getElementById("pauseButton");
  const resumeButton = document.getElementById("resumeButton");
  const restartButton = document.getElementById("restartButton");
  const leaveSongButton = document.getElementById("leaveSongButton");
  const pauseSettingsButton = document.getElementById("pauseSettingsButton");
  const gameHelpButton = document.getElementById("gameHelpButton");
  const closeGameGuideButton = document.getElementById("closeGameGuideButton");
  const startGameFromGuideButton = document.getElementById("startGameFromGuideButton");
  const gameGuideModal = document.getElementById("gameGuideModal");

  if (pauseButton) {
    pauseButton.onclick = function () {
      TMGame.togglePause(true);
    };
  }

  if (gameHelpButton) {
    gameHelpButton.onclick = function () {
      TMGame.openGuide(true);
    };
  }

  if (closeGameGuideButton) {
    closeGameGuideButton.onclick = function () {
      TMGame.closeGuide();
    };
  }

  if (startGameFromGuideButton) {
    startGameFromGuideButton.onclick = function () {
      TMGame.closeGuide();
    };
  }

  if (gameGuideModal) {
    gameGuideModal.addEventListener("click", function (event) {
      if (event.target === gameGuideModal) {
        TMGame.closeGuide();
      }
    });
  }

  if (resumeButton) {
    resumeButton.onclick = function () {
      TMGame.togglePause(false);
    };
  }

  if (restartButton) {
    restartButton.onclick = function () {
      TMGame.restart();
    };
  }

  if (leaveSongButton) {
    leaveSongButton.onclick = function () {
      TMGame.leave();
    };
  }

  if (pauseSettingsButton) {
    pauseSettingsButton.onclick = function () {
      document.getElementById("settingsModal")?.classList.remove("hidden");
    };
  }

  /* 結算頁重新挑戰 */
  const retryButton = document.getElementById("retryButton");

  if (retryButton) {
    retryButton.onclick = function () {
      if (window.TMGame && TMGame.song) {
        TMGame.start(TMGame.song, TMGame.difficulty);
      }
    };
  }

  /* 收藏 */
  const favoriteLearning = document.getElementById("favoriteLearning");

  if (favoriteLearning) {
    favoriteLearning.onclick = function () {
      const song = UI.currentSong || firstSong;
      if (!song) return;

      TMStorage.favorite(song.id);
      UI.renderLearning();
    };
  }

  /* 設定視窗 */
  document.querySelectorAll("[data-open-settings]").forEach(function (button) {
    button.onclick = function () {
      document.getElementById("settingsModal")?.classList.remove("hidden");
    };
  });

  document.querySelectorAll("[data-close-settings]").forEach(function (button) {
    button.onclick = function () {
      document.getElementById("settingsModal")?.classList.add("hidden");
    };
  });

  /* FPS */
  let last = performance.now();
  let frames = 0;

  function updateFps(now) {
    frames++;

    if (now - last >= 1000) {
      const fpsCounter = document.getElementById("fpsCounter");

      if (fpsCounter) {
        fpsCounter.textContent = frames + " FPS";
      }

      frames = 0;
      last = now;
    }

    requestAnimationFrame(updateFps);
  }

  requestAnimationFrame(updateFps);

  /* 初始首頁 */
  if (window.UI) {
    UI.show("home");
  }
});
