智慧工作入口｜D1 安全同步版

此版本已改為：
1. 管理密碼不寫死在 index.html。
2. 登入管理設定時，會呼叫 Worker：
   POST /api/portal-auth
3. 儲存設定時，Worker 會再次驗證管理密碼。
4. 只有驗證成功才允許：
   POST /api/portal-settings
5. 一般同仁仍可 GET /api/portal-settings 讀取共用設定。

Cloudflare 必做設定：
Worker → Settings → Variables and Secrets
新增 Secret：
名稱：PORTAL_ADMIN_PASSWORD
值：你要使用的管理密碼

建議正式使用時不要使用 11，請改成較難猜的密碼。

Worker CORS 已加入：
X-Portal-Admin-Password

部署順序：
A. 先在 Cloudflare 新增 PORTAL_ADMIN_PASSWORD Secret
B. 再把 tax-status-api_管理密碼驗證版.js 貼到 Worker 並 Deploy
C. 再使用本資料夾的 index.html

注意：
GET 共用設定不需要密碼，這是刻意設計，讓所有同仁都能看到相同入口設定。
只有「修改設定」需要管理密碼。
