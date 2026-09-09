# Tax Melody v2

地方稅宣導 × 音樂節奏 × 學習的純前端網頁遊戲。

## 開啟方式

1. 解壓縮 `TaxMelody-v2.zip`。
2. 直接雙擊 `index.html`。
3. 點「選擇歌曲」→「守護第一時間」→ Play。

也可將整個資料夾上傳到 GitHub Pages。

## 已完成

- 首頁、歌曲選單、四種難度、四軌玩法
- D / F / J / K 鍵盤與手機觸控
- 歌曲播放、程序化譜面、歌詞同步
- Score、Combo、Life、Accuracy、進度與歌曲時間
- ESC / 暫停按鈕、繼續、重開、設定、離開歌曲
- SSS～D 結算、Perfect / Great / Good / Miss、Max Combo
- 遊戲完成後的地方稅學習重點
- 收藏、最佳成績、基本成就與 localStorage 儲存
- BGM 音量、SE 音量、音符速度、判定嚴格度、背景亮度、FPS、全螢幕
- 手機、平板、電腦響應式版面

## 資料檔

- `data/songs.json`：歌曲清單
- `data/lyrics.json`：同步文字
- `data/charts.json`：譜面設定
- `data/learning.json`：學習內容
- `data/offline-data.js`：雙擊 `index.html` 時使用的離線資料副本

瀏覽器直接用 `file://` 開啟時通常會封鎖 `fetch(JSON)`，所以 v2 同時保留 JSON 與離線 JS。新增歌曲時請同步修改兩者；部署到 GitHub Pages 後可再改為只讀 JSON。

## 新增歌曲

1. 將 MP3 放進 `assets/music/`。
2. 在 `data/songs.json` 與 `data/offline-data.js` 新增歌曲資料。
3. 在 `lyrics.json`、`learning.json` 與 `offline-data.js` 加入對應內容。
4. 將 `available` 設為 `true`。

## 注意

目前只有「守護第一時間」含實際音檔；其他四首已建立歌曲卡片與擴充位置，但尚未附音檔。
