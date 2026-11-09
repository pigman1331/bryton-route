// Bryton 路線轉換器：Google Maps 短網址展開服務（Cloudflare Worker）
// GET /?url=<maps.app.goo.gl 短網址>  →  {"url": 完整網址, "center": [lat, lng] | null}
// center：網址本身沒有座標時（例如只有地點 ID 的地點連結），從地點頁面取得的座標。

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

function hasCoords(u) {
  return /!3d-?\d+\.\d+!4d-?\d+\.\d+/.test(u) || /\/maps\/dir\//.test(u) || /@-?\d+\.\d+,-?\d+\.\d+/.test(u);
}

async function placeHtml(mapsUrl) {
  const r = await fetch(mapsUrl, { headers: { "User-Agent": UA, "Accept-Language": "zh-TW,zh;q=0.9", "Cookie": "CONSENT=YES+" } });
  return { status: r.status, finalUrl: r.url, html: await r.text() };
}

function centerFrom(html) {
  const t = html.replace(/\\u003d/g, "=").replace(/\\u0026/g, "&").replace(/&amp;/g, "&");
  // 地點頁的預覽圖：staticmap?center=lat%2Clng 或 center=lat,lng
  let m = t.match(/center=(-?\d{1,2}\.\d+)(?:%2C|,)(-?\d{1,3}\.\d+)/);
  if (m) return [+m[1], +m[2]];
  m = t.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (m) return [+m[1], +m[2]];
  // APP_INITIALIZATION_STATE=[[[zoom,lng,lat]
  m = t.match(/APP_INITIALIZATION_STATE=\[\[\[-?[\d.]+,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
  if (m) return [+m[2], +m[1]];
  m = t.match(/@(-?\d{1,2}\.\d{4,}),(-?\d{1,3}\.\d{4,})/);
  if (m) return [+m[1], +m[2]];
  return null;
}

async function placeCenter(mapsUrl) {
  return centerFrom((await placeHtml(mapsUrl)).html);
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    const target = new URL(request.url).searchParams.get("url") || "";
    if (!ALLOW_SHORT.test(target) && !ALLOW_MAPS.test(target)) {
      return json({ error: "只接受 Google Maps 網址" }, 400);
    }
    try {
      const full = ALLOW_MAPS.test(target) ? target : await expand(target);
      if (!full) return json({ error: "無法展開這個短網址" }, 502);
      let center = null;
      if (new URL(request.url).searchParams.get("debug")) {
        const p = await placeHtml(full);
        const idx = [/center=/, /staticmap/, /APP_INITIALIZATION_STATE/, /!3d/].map(re => { const i = p.html.search(re); return i < 0 ? null : p.html.slice(Math.max(0, i - 40), i + 160); });
        return json({ url: full, status: p.status, finalUrl: p.finalUrl, len: p.html.length, title: (p.html.match(/<title>([^<]*)/) || [])[1], idx, center: centerFrom(p.html) });
      }
      if (!hasCoords(full)) {
        try { center = await placeCenter(full); } catch (e) { /* 沒有座標就算了 */ }
      }
      return json({ url: full, center });
    } catch (e) {
      return json({ error: "展開失敗：" + e.message }, 502);
    }
  },
};
