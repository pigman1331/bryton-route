// 「送到 Bryton」書籤原始碼（build-bookmarklet.js 會把它壓成 javascript: 網址）
// 在 Google Maps 路線頁面執行：展開「詳細資料」→ 讀取逐段指示 → 帶著網址與指示開啟轉換器
(async () => {
  const T = "https://pigman1331.github.io/bryton-route/";
  if (!/\/maps\/dir\//.test(location.href)) {
    alert("請先在 Google Maps 規劃好路線（左側顯示路線的頁面），再按這個書籤。");
    return;
  }
  const w = window.open("about:blank", "_blank");
  const btn = [...document.querySelectorAll("button")].find(b => /^\s*(詳細資料|详细信息|Details)\s*$/.test(b.textContent));
  if (btn) { btn.click(); await new Promise(r => setTimeout(r, 2000)); }
  const text = document.body.innerText;
  const k = text.search(/\(\s*[\d.,]+\s*(公里|km)\s*\)/);
  const payload = { v: 1, u: location.href, t: (k >= 0 ? text.slice(k) : text).slice(0, 60000) };
  const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const url = T + "#g=" + b64;
  if (w) w.location.href = url; else location.href = url;
})();
