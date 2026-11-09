// Bryton 路線轉換器：Google Maps 短網址展開服務（Cloudflare Worker）
// GET /?url=<maps.app.goo.gl 短網址>  →  {"url": 完整的 Google Maps 網址}
// 瀏覽器不能直接讀取跨站轉址，所以由這個 Worker 代為跟隨轉址。

const ALLOW_SHORT = /^https:\/\/(maps\.app\.goo\.gl|goo\.gl|g\.co)\//i;
const ALLOW_MAPS = /^https:\/\/(www\.)?google\.[a-z.]+\/maps/i;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=86400",
};
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: CORS });
}

async function expand(url) {
  let cur = url;
  for (let i = 0; i < 6; i++) {
    if (ALLOW_MAPS.test(cur)) return cur;
    const r = await fetch(cur, { redirect: "manual", headers: { "User-Agent": UA, "Accept-Language": "zh-TW,zh;q=0.9" } });
    const loc = r.headers.get("location");
    if (!loc) break;
    cur = new URL(loc, cur).toString();
  }
  return ALLOW_MAPS.test(cur) ? cur : null;
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    const target = new URL(request.url).searchParams.get("url") || "";
    if (!ALLOW_SHORT.test(target)) return json({ error: "只接受 Google Maps 短網址" }, 400);
    try {
      const full = await expand(target);
      if (!full) return json({ error: "無法展開這個短網址" }, 502);
      return json({ url: full });
    } catch (e) {
      return json({ error: "展開失敗：" + e.message }, 502);
    }
  },
};
