window.UI = {
  currentSong: null,
  currentDifficulty: "easy",
  category: "最新上架",
  toastTimer: null,
  selectedSongId: null,
  previewSongId: null,
  previewTimer: null,
  previewEndHandler: null,
  previewStartTime: 5,
  previewLength: 15,

  show(name) {
    if (name !== "songs") {
      this.stopPreview(false);
    }

    const target = document.getElementById(`${name}Screen`);

    if (!target) {
      console.error(`找不到畫面：${name}Screen`);
      this.toast("頁面載入失敗，請重新整理");
      return;
    }

    document.querySelectorAll(".screen").forEach(function (screen) {
      screen.classList.remove("active");
    });

    target.classList.add("active");

    try {
      if (name === "songs") {
        this.renderSongs();
        setTimeout(() => this.autoPreviewSelectedSong(), 80);
      }
      if (name === "knowledge") this.renderKnowledgeHub();
      if (name === "learning") this.renderLearning();
      if (name === "records") this.renderRecords();
    } catch (error) {
      console.error(`${name} 頁面顯示失敗：`, error);

      if (name === "learning") {
        this.renderLearningFallback();
      } else {
        this.toast("頁面資料載入失敗");
      }
    }

    window.scrollTo(0, 0);
  },

  toast(text) {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.textContent = text;
    toast.classList.add("show");

    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(function () {
      toast.classList.remove("show");
    }, 2200);
  },

  renderTabs() {
    const el = document.getElementById("categoryTabs");
    if (!el || !Array.isArray(TAX_MELODY_DATA.categories)) return;

    el.innerHTML = TAX_MELODY_DATA.categories
      .map(
        (category) =>
          `<button class="${category === this.category ? "active" : ""}" data-category="${category}">${category}</button>`
      )
      .join("");

    el.querySelectorAll("button").forEach((button) => {
      button.onclick = () => {
        this.category = button.dataset.category;
        this.renderSongs();
      };
    });
  },

  stopPreview(updateView = true) {
    const audio = document.getElementById("songPreview");

    clearTimeout(this.previewTimer);
    this.previewTimer = null;

    if (audio) {
      if (this.previewEndHandler) {
        audio.removeEventListener("timeupdate", this.previewEndHandler);
        audio.removeEventListener("ended", this.previewEndHandler);
      }

      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute("src");
      audio.load();
    }

    this.previewEndHandler = null;
    this.previewSongId = null;

    if (
      updateView &&
      document.getElementById("songsScreen")?.classList.contains("active")
    ) {
      this.renderSongs();
    }
  },

  async playPreview(song) {
    if (!song || !song.available || !song.audio) {
      this.toast("這首歌目前沒有可試聽的音檔");
      return;
    }

    const audio = document.getElementById("songPreview");
    if (!audio) return;

    if (this.previewSongId === song.id && !audio.paused) {
      this.stopPreview();
      this.toast("已停止試聽");
      return;
    }

    this.stopPreview(false);

    const loginBgm = document.getElementById("loginBgm");
    if (loginBgm) {
      loginBgm.pause();
    }

    this.previewSongId = song.id;
    audio.src = song.audio;
    audio.volume =
      window.TMSettings && TMSettings.values
        ? Number(TMSettings.values.bgmVolume ?? 0.8)
        : 0.8;

    const startPlayback = async () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const start = duration > 8 ? Math.min(this.previewStartTime, duration - 1) : 0;
      const end = Math.min(duration || start + this.previewLength, start + this.previewLength);

      try {
        audio.currentTime = start;
      } catch (error) {
        console.warn("無法設定試聽起點：", error);
      }

      this.previewEndHandler = () => {
        if (!this.previewSongId || audio.paused) return;

        if (audio.ended || audio.currentTime >= end - 0.08) {
          try {
            audio.currentTime = start;
            audio.play().catch(() => {});
          } catch (error) {
            console.warn("試聽循環失敗：", error);
          }
        }
      };

      audio.addEventListener("timeupdate", this.previewEndHandler);
      audio.addEventListener("ended", this.previewEndHandler);

      try {
        await audio.play();
        this.renderSongs();
      } catch (error) {
        console.error("歌曲試聽失敗：", error);
        this.previewSongId = null;
        this.renderSongs();
        this.toast("瀏覽器需要先點一下歌曲才能試聽");
      }
    };

    if (audio.readyState >= 1) {
      startPlayback();
    } else {
      audio.addEventListener("loadedmetadata", startPlayback, { once: true });
      audio.load();
    }
  },

  autoPreviewSelectedSong() {
    const songs = Array.isArray(TAX_MELODY_DATA.songs)
      ? TAX_MELODY_DATA.songs
      : [];

    const song =
      songs.find((item) => item.id === this.selectedSongId) ||
      this.currentSong ||
      songs[0];

    if (song && song.available && song.audio && this.previewSongId !== song.id) {
      this.playPreview(song);
    }
  },

  renderSongs() {
    const list = document.getElementById("songList");
    if (!list) return;

    const favorites = TMStorage.get("favorites", []);
    const scores = TMStorage.get("scores", {});
    const songs = Array.isArray(TAX_MELODY_DATA.songs)
      ? TAX_MELODY_DATA.songs
      : [];

    if (!songs.length) {
      list.innerHTML = "<p class=\"empty-song-list\">目前沒有歌曲資料。</p>";
      return;
    }

    const selected =
      songs.find((song) => song.id === this.selectedSongId) ||
      this.currentSong ||
      songs[0];

    this.selectedSongId = selected.id;
    this.currentSong = selected;

    const scoreKey = `${selected.id}:${this.currentDifficulty}`;
    const selectedScore = scores[scoreKey];

    const selectedCover = document.getElementById("selectedSongCover");
    const selectedTitle = document.getElementById("selectedSongTitle");
    const selectedSubtitle = document.getElementById("selectedSongSubtitle");
    const selectedDuration = document.getElementById("selectedSongDuration");
    const selectedStars = document.getElementById("selectedSongStars");
    const selectedBestScore = document.getElementById("selectedBestScore");
    const selectedAvailability = document.getElementById("selectedAvailability");
    const selectedPlayButton = document.getElementById("selectedPlayButton");
    const selectedFavoriteButton = document.getElementById("selectedFavoriteButton");
    const difficultyLabel = document.getElementById("difficultyLabel");
    const songCountBadge = document.getElementById("songCountBadge");
    const totalSongCount = document.getElementById("totalSongCount");

    const starLevel =
      selected.stars && selected.stars[this.currentDifficulty]
        ? selected.stars[this.currentDifficulty]
        : 2;

    if (selectedCover) {
      selectedCover.src = selected.cover || "";
      selectedCover.alt = `${selected.title || "歌曲"}封面`;
    }

    if (selectedTitle) selectedTitle.textContent = selected.title || "未命名歌曲";
    if (selectedSubtitle) selectedSubtitle.textContent = selected.subtitle || "";
    if (selectedDuration) selectedDuration.textContent = selected.duration || "--:--";
    if (selectedStars) {
      selectedStars.textContent = "★".repeat(
        Math.min(5, Math.max(1, Math.ceil(starLevel / 2)))
      );
    }

    if (selectedBestScore) {
      selectedBestScore.textContent = Number(
        selectedScore?.score || 0
      ).toLocaleString();
    }

    if (selectedAvailability) {
      const isPreviewing = this.previewSongId === selected.id;
      selectedAvailability.textContent = !selected.available
        ? "LOCKED"
        : isPreviewing
          ? "PREVIEW"
          : "READY";
      selectedAvailability.classList.toggle("locked", !selected.available);
      selectedAvailability.classList.toggle("previewing", isPreviewing);
    }

    if (selectedFavoriteButton) {
      const isFavorite = favorites.includes(selected.id);
      selectedFavoriteButton.textContent = isFavorite ? "★" : "☆";
      selectedFavoriteButton.classList.toggle("on", isFavorite);

      selectedFavoriteButton.onclick = () => {
        TMStorage.favorite(selected.id);
        this.renderSongs();
      };
    }

    if (selectedPlayButton) {
      selectedPlayButton.disabled = !selected.available;
      selectedPlayButton.classList.toggle("locked", !selected.available);
      selectedPlayButton.innerHTML = selected.available
        ? "<span>▶</span><b>開始挑戰</b>"
        : "<span>🔒</span><b>尚未開放</b>";

      selectedPlayButton.onclick = () => {
        if (!selected.available) {
          this.toast("這首歌尚未加入音檔");
          return;
        }

        this.stopPreview(false);
        this.currentSong = selected;
        TMGame.start(selected, this.currentDifficulty);
      };
    }

    if (difficultyLabel) {
      difficultyLabel.textContent = this.currentDifficulty.toUpperCase();
    }

    if (songCountBadge) songCountBadge.textContent = `${songs.length} 首`;
    if (totalSongCount) totalSongCount.textContent = songs.length;

    this.renderMobileAlbumSelector(songs, selected, scores);

    list.innerHTML = songs
      .map((song, index) => {
        const score = scores[`${song.id}:${this.currentDifficulty}`];
        const active = song.id === selected.id;
        const favorite = favorites.includes(song.id);
        const previewing = song.id === this.previewSongId;

        return `
          <button class="compact-song-item ${active ? "active" : ""} ${previewing ? "previewing" : ""}"
                  type="button"
                  data-select-song="${song.id}">
            <span class="song-index">${String(index + 1).padStart(2, "0")}</span>

            <img src="${song.cover || ""}"
                 alt=""
                 class="compact-song-cover">

            <span class="compact-song-copy">
              <b>${song.title || "未命名歌曲"}</b>
              <small>${song.subtitle || ""}</small>
              <em>${score ? `BEST ${Number(score.score || 0).toLocaleString()}` : "NO RECORD"}</em>
            </span>

            <span class="compact-song-status">
              ${previewing ? "♫" : favorite ? "★" : ""}
              ${song.available ? (previewing ? "Ⅱ" : "▶") : "🔒"}
            </span>
          </button>
        `;
      })
      .join("");

    list.querySelectorAll("[data-select-song]").forEach((button) => {
      button.onclick = () => {
        const song =
          songs.find((item) => item.id === button.dataset.selectSong) || songs[0];

        this.selectedSongId = song.id;
        this.currentSong = song;
        this.renderSongs();
        this.playPreview(song);
      };
    });

    const completedSongs = new Set(
      Object.keys(scores)
        .filter((key) => scores[key] && scores[key].cleared)
        .map((key) => key.split(":")[0])
    );

    const completedCount = document.getElementById("completedCount");
    const missionProgressBar = document.getElementById("missionProgressBar");

    if (completedCount) completedCount.textContent = completedSongs.size;

    if (missionProgressBar) {
      const percent = songs.length
        ? Math.min(100, (completedSongs.size / songs.length) * 100)
        : 0;

      missionProgressBar.style.width = `${percent}%`;
    }
  },


  renderMobileAlbumSelector(songs, selected, scores) {
    const carousel = document.getElementById("mobileAlbumCarousel");
    if (!carousel) return;

    const title = document.getElementById("mobileSelectedSongTitle");
    const subtitle = document.getElementById("mobileSelectedSongSubtitle");
    const difficultyLabel = document.getElementById("mobileDifficultyLabel");
    const startButton = document.getElementById("mobileStartChallenge");

    if (title) title.textContent = selected.title || "未命名歌曲";
    if (subtitle) subtitle.textContent = selected.subtitle || "";
    if (difficultyLabel) {
      difficultyLabel.textContent = this.currentDifficulty.toUpperCase();
    }

    carousel.innerHTML = songs.map((song) => {
      const active = song.id === selected.id;
      const score = scores[`${song.id}:${this.currentDifficulty}`];

      return `
        <button type="button"
                class="mobile-album-card ${active ? "active" : ""}"
                data-mobile-album="${song.id}"
                aria-label="選擇${song.title || "歌曲"}">
          <img src="${song.cover || ""}" alt="${song.title || "歌曲"}專輯封面">
          <b>${song.title || "未命名歌曲"}</b>
          <small>${score ? `BEST ${Number(score.score || 0).toLocaleString()}` : "NO RECORD"}</small>
          <span>${song.available ? "▶" : "🔒"}</span>
        </button>
      `;
    }).join("");

    carousel.querySelectorAll("[data-mobile-album]").forEach((button) => {
      button.onclick = () => {
        const song = songs.find((item) => item.id === button.dataset.mobileAlbum);
        if (!song) return;

        this.selectedSongId = song.id;
        this.currentSong = song;
        this.renderSongs();
        this.playPreview(song);

        requestAnimationFrame(() => {
          document
            .querySelector(`[data-mobile-album="${song.id}"]`)
            ?.scrollIntoView({
              behavior: "smooth",
              block: "nearest",
              inline: "center"
            });
        });
      };
    });

    document.querySelectorAll("[data-mobile-difficulty]").forEach((button) => {
      const isActive = button.dataset.mobileDifficulty === this.currentDifficulty;
      button.classList.toggle("active", isActive);

      button.onclick = () => {
        this.currentDifficulty = button.dataset.mobileDifficulty || "easy";
        this.renderSongs();
      };
    });

    if (startButton) {
      startButton.disabled = !selected.available;
      startButton.textContent = selected.available ? "▶ 開始挑戰" : "🔒 尚未開放";
      startButton.classList.toggle("locked", !selected.available);

      startButton.onclick = () => {
        if (!selected.available) {
          this.toast("這首歌尚未加入音檔");
          return;
        }

        this.stopPreview(false);
        this.currentSong = selected;
        TMGame.start(selected, this.currentDifficulty);
      };
    }

    requestAnimationFrame(() => {
      carousel
        .querySelector(".mobile-album-card.active")
        ?.scrollIntoView({
          behavior: "auto",
          block: "nearest",
          inline: "center"
        });
    });
  },

  getLearningData(song) {
    const learning = TAX_MELODY_DATA.learning || {};

    if (song && song.learningId && learning[song.learningId]) {
      return learning[song.learningId];
    }

    if (song && song.id && learning[song.id]) {
      return learning[song.id];
    }

    const firstLearning = Object.values(learning)[0];
    return firstLearning || null;
  },


  renderKnowledgeHub() {
    const list = document.getElementById("knowledgeTopicList");
    if (!list) return;

    const songs = Array.isArray(TAX_MELODY_DATA.songs)
      ? TAX_MELODY_DATA.songs
      : [];
    const learning = TAX_MELODY_DATA.learning || {};

    const topics = songs
      .filter((song) => {
        const learningId = song.learningId || song.id;
        const data = learning[learningId];
        return data && Array.isArray(data.points) && data.points.length;
      })
      .map((song) => {
        const learningId = song.learningId || song.id;
        return {
          song,
          data: learning[learningId]
        };
      });

    list.innerHTML = topics.length
      ? topics.map(({ song, data }, index) => `
          <article class="knowledge-topic-card glass"
                   style="--topic-order:${index}"
                   data-learning-song="${song.id}"
                   role="button"
                   tabindex="0"
                   aria-label="查看${data.title || song.title}學習重點">
            <div class="knowledge-topic-cover">
              <img src="${song.cover || "assets/images/tax-melody-concept.jpg"}"
                   alt="${data.title || song.title}主題封面">
              <span>${String(index + 1).padStart(2, "0")}</span>
            </div>

            <div class="knowledge-topic-copy">
              <small>${song.subtitle || "地方稅學習主題"}</small>
              <h2>${data.title || song.title}</h2>
              <p>${data.summary || "查看這個主題的地方稅學習重點。"}</p>

              <div class="knowledge-topic-tags">
                ${(data.points || []).slice(0, 3).map((point) =>
                  `<span>${point.icon || "✓"} ${point.title || "學習重點"}</span>`
                ).join("")}
              </div>

              <button type="button"
                      class="knowledge-open-btn">
                查看學習重點
                <span>→</span>
              </button>
            </div>
          </article>
        `).join("")
      : `
        <div class="knowledge-empty glass">
          <span>📖</span>
          <h2>學習內容準備中</h2>
          <p>目前尚未建立可顯示的主題。</p>
        </div>
      `;

    const openTopic = (card) => {
      const song = songs.find((item) => item.id === card.dataset.learningSong);
      if (!song) return;

      this.currentSong = song;
      this.selectedSongId = song.id;
      this.show("learning");
    };

    list.querySelectorAll(".knowledge-topic-card[data-learning-song]").forEach((card) => {
      card.onclick = (event) => {
        event.preventDefault();
        openTopic(card);
      };

      card.onkeydown = (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openTopic(card);
        }
      };
    });
  },

  renderLearning() {
    const songs = Array.isArray(TAX_MELODY_DATA.songs)
      ? TAX_MELODY_DATA.songs
      : [];

    const song = this.currentSong || songs[0] || null;
    const data = this.getLearningData(song);

    if (!data) {
      this.renderLearningFallback();
      return;
    }

    const title = document.getElementById("learningTitle");
    const summary = document.getElementById("learningSummary");
    const points = document.getElementById("learningPoints");
    const favoriteButton = document.getElementById("favoriteLearning");

    if (title) {
      title.textContent = data.title || song?.title || "今日學習重點";
    }

    if (summary) {
      summary.textContent =
        data.summary || "完成歌曲後，一起複習今天學到的地方稅知識。";
    }

    if (points) {
      const pointList = Array.isArray(data.points) ? data.points : [];

      points.innerHTML = pointList.length
        ? pointList
            .map(
              (point) => `
                <div class="learning-point">
                  <span>${point.icon || "✓"}</span>
                  <b>${point.title || "重點"}</b>
                  <small>${point.text || ""}</small>
                </div>
              `
            )
            .join("")
        : `
          <div class="learning-point">
            <span>✓</span>
            <b>今日重點</b>
            <small>${data.summary || "完成歌曲並複習相關稅務知識。"}</small>
          </div>
        `;
    }

    if (favoriteButton && song) {
      favoriteButton.textContent = TMStorage.get(
        "favorites",
        []
      ).includes(song.id)
        ? "★"
        : "☆";
    }
  },

  renderLearningFallback() {
    const title = document.getElementById("learningTitle");
    const summary = document.getElementById("learningSummary");
    const points = document.getElementById("learningPoints");

    if (title) title.textContent = "今日學習重點";

    if (summary) {
      summary.textContent =
        "目前這首歌曲尚未設定學習內容，請先回到歌曲選單選擇其他歌曲。";
    }

    if (points) {
      points.innerHTML = `
        <div class="learning-point">
          <span>📖</span>
          <b>學習內容準備中</b>
          <small>歌曲仍可正常遊玩，之後可再補上對應的稅務重點。</small>
        </div>
      `;
    }
  },

  renderRecords() {
    const list = document.getElementById("recordsList");
    if (!list) return;

    const songs = Array.isArray(TAX_MELODY_DATA.songs)
      ? TAX_MELODY_DATA.songs
      : [];
    const scores = TMStorage.get("scores", {});
    const history = TMStorage.get("playHistory", []);
    const difficultyOrder = ["easy", "normal", "hard", "expert"];
    const difficultyLabels = {
      easy: "EASY",
      normal: "NORMAL",
      hard: "HARD",
      expert: "EXPERT"
    };

    const songRecords = songs.map((song) => {
      const entries = Object.entries(scores)
        .filter(([key, value]) => key.startsWith(`${song.id}:`) && value)
        .map(([key, value]) => ({
          difficulty: key.split(":")[1] || "easy",
          ...value
        }));

      const attemptsFromHistory = history.filter(
        (item) => item && item.songId === song.id
      );

      const bestEntry = entries.reduce((best, current) => {
        if (!best || Number(current.score || 0) > Number(best.score || 0)) {
          return current;
        }
        return best;
      }, null);

      const highestDifficulty = entries.reduce((best, current) => {
        const currentIndex = difficultyOrder.indexOf(current.difficulty);
        const bestIndex = difficultyOrder.indexOf(best || "easy");
        return currentIndex > bestIndex ? current.difficulty : best;
      }, entries.length ? entries[0].difficulty : "easy");

      const attempts = attemptsFromHistory.length || entries.length;
      const cleared = entries.some((entry) => entry.cleared);
      const lastPlayed =
        attemptsFromHistory[0]?.playedAt ||
        entries
          .map((entry) => entry.savedAt)
          .filter(Boolean)
          .sort()
          .reverse()[0] ||
        null;

      return {
        song,
        entries,
        bestEntry,
        highestDifficulty,
        attempts,
        cleared,
        lastPlayed
      };
    });

    const completedCount = songRecords.filter((record) => record.cleared).length;
    const attemptsCount =
      history.length ||
      songRecords.reduce((total, record) => total + record.attempts, 0);
    const topScore = songRecords.reduce(
      (max, record) => Math.max(max, Number(record.bestEntry?.score || 0)),
      0
    );
    const learnedTopics = songRecords.filter(
      (record) =>
        record.cleared &&
        this.getLearningData(record.song) &&
        Array.isArray(this.getLearningData(record.song).points) &&
        this.getLearningData(record.song).points.length
    ).length;

    const completedEl = document.getElementById("recordCompletedSongs");
    const attemptsEl = document.getElementById("recordAttempts");
    const topScoreEl = document.getElementById("recordTopScore");
    const learnedEl = document.getElementById("recordLearnedTopics");

    if (completedEl) completedEl.textContent = completedCount;
    if (attemptsEl) attemptsEl.textContent = attemptsCount;
    if (topScoreEl) topScoreEl.textContent = topScore.toLocaleString();
    if (learnedEl) learnedEl.textContent = learnedTopics;

    const playedRecords = songRecords
      .filter((record) => record.entries.length || record.attempts)
      .sort((a, b) => {
        const aTime = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
        const bTime = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
        return bTime - aTime;
      });

    const formatDate = (value) => {
      if (!value) return "尚無日期紀錄";
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return "尚無日期紀錄";

      return new Intl.DateTimeFormat("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(date);
    };

    list.innerHTML = playedRecords.length
      ? playedRecords.map((record) => {
          const best = record.bestEntry || {};
          const accuracy = Number(best.accuracy || 0);
          const combo = Number(best.maxCombo || best.combo || 0);
          const difficulty =
            difficultyLabels[record.highestDifficulty] || "EASY";

          return `
            <article class="record-card glass">
              <div class="record-cover">
                <img src="${record.song.cover || "assets/images/tax-melody-concept.jpg"}"
                     alt="${record.song.title || "歌曲"}封面">
                <span class="${record.cleared ? "cleared" : ""}">
                  ${record.cleared ? "CLEARED" : "PLAYED"}
                </span>
              </div>

              <div class="record-main">
                <small>${record.song.subtitle || "地方稅學習歌曲"}</small>
                <h2>${record.song.title || "未命名歌曲"}</h2>

                <div class="record-meta">
                  <span>最高難度 <b>${difficulty}</b></span>
                  <span>挑戰 <b>${record.attempts}</b> 次</span>
                  <span>最近挑戰 <b>${formatDate(record.lastPlayed)}</b></span>
                </div>

                <div class="record-performance">
                  <div>
                    <small>BEST SCORE</small>
                    <strong>${Number(best.score || 0).toLocaleString()}</strong>
                  </div>
                  <div>
                    <small>MAX COMBO</small>
                    <strong>${combo.toLocaleString()}</strong>
                  </div>
                  <div>
                    <small>ACCURACY</small>
                    <strong>${accuracy ? `${accuracy.toFixed(1)}%` : "--"}</strong>
                  </div>
                </div>
              </div>

              <div class="record-actions">
                <button type="button"
                        class="record-retry-btn"
                        data-record-retry="${record.song.id}"
                        data-record-difficulty="${record.highestDifficulty}">
                  ▶ 再次挑戰
                </button>

                <button type="button"
                        class="record-learning-btn"
                        data-record-learning="${record.song.id}">
                  📖 複習重點
                </button>
              </div>
            </article>
          `;
        }).join("")
      : `
        <section class="records-empty glass">
          <span>🎵</span>
          <h2>還沒有學習紀錄</h2>
          <p>完成第一首歌曲後，最高分、難度與學習成果會顯示在這裡。</p>
          <button type="button" data-go="songs">開始第一場挑戰</button>
        </section>
      `;

    list.querySelectorAll("[data-record-retry]").forEach((button) => {
      button.onclick = () => {
        const song = songs.find(
          (item) => item.id === button.dataset.recordRetry
        );
        if (!song) return;

        if (!song.available) {
          this.toast("這首歌目前尚未開放");
          return;
        }

        this.currentSong = song;
        this.selectedSongId = song.id;
        this.currentDifficulty =
          button.dataset.recordDifficulty || "easy";
        TMGame.start(song, this.currentDifficulty);
      };
    });

    list.querySelectorAll("[data-record-learning]").forEach((button) => {
      button.onclick = () => {
        const song = songs.find(
          (item) => item.id === button.dataset.recordLearning
        );
        if (!song) return;

        this.currentSong = song;
        this.selectedSongId = song.id;
        this.show("learning");
      };
    });

    list.querySelectorAll("[data-go]").forEach((button) => {
      button.onclick = () => this.show(button.dataset.go);
    });
  },
};
