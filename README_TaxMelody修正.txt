修正內容：
- 趣學習頁位於 games/index.html，因此原本的 music/index.html 會被錯誤解析成 games/music/index.html。
- 現已加入內部路徑轉換：
  music/index.html → ../music/index.html
- 外部 https:// 網址維持不變。
- 圖片、影片、PDF、其他本機學習內容同樣適用。
