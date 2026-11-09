# Bryton 路線轉換器（網頁版）

貼上 Google Maps 路線／地點分享網址，轉成 Bryton 車機「照線走、不會亂繞」的 GPX 軌跡檔。

- 支援 maps.app.goo.gl 短網址、路線網址（含拖曳途經點）、地點網址；可一行一個貼多個，依序串成一條路線
- 路線規劃：BRouter（公路車／一般自行車／安全優先），失敗時改用 OSRM 自行車
- 地圖上可修正：點道路加途經點、拖曳移動、點圓點刪除，只重算受影響的路段
- 「送到 Bryton」書籤（電腦版 Chrome）：在 Google Maps 路線頁按下，讀取 Google 逐段指示，自動加途經點讓路線跟 Google 一致，並顯示里程差距
- 可直接貼座標（十進位或度分秒），座標前的文字當作點名稱
- 也可上傳 KML / KMZ / GPX

## 開發

- `bookmarklet.src.js`：書籤原始碼；改完執行 `node build-bookmarklet.js`（需要 terser）寫回 `index.html`
- `worker/worker.js`：Cloudflare Worker `bryton-maps`，展開 maps.app.goo.gl 短網址
- 輸出：單一 `<trk>` 軌跡、點距 ≤ 20 m、不含 `<rtept>` / `<wpt>`
- 手機可直接「分享到 Bryton Active」

匯入 Bryton Active 後，關閉「產生轉彎提示 (Turn-by-Turn)」，車機就會完全照線走。

地圖 © OpenStreetMap contributors。
