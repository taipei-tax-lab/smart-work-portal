智慧工作入口｜D1 共用同步版

API：
https://tax-status-api.ddy88000000.workers.dev/api/portal-settings

行為：
1. 網頁開啟時會先顯示本機快取，再讀取 D1 最新設定。
2. 管理設定按「儲存設定」會 POST 到 D1。
3. 其他電腦重新整理／重新開啟後會讀到相同設定。
4. D1 暫時不可用時會退回本機快取。
5. 趣學習頁與子頁返回按鈕也會讀取 D1。

注意：
目前 Worker 的 POST /api/portal-settings 尚未做伺服器端密碼驗證。
現階段管理介面密碼 11 只保護前端 UI；正式上線前建議再把寫入 API 加上 Token / Secret 驗證。

圖片：
目前石虎上傳圖片仍以 base64 存在 settings JSON 中。
少量使用可行；正式多人版若常換圖片，建議改用 Cloudflare R2 存圖、D1 只存圖片網址。
