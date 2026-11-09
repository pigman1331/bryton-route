// 把 bookmarklet.src.js 壓縮成 javascript: 網址，寫進 index.html 的 BOOKMARKLET 常數
// 用法：npm i -g terser && node build-bookmarklet.js
const fs = require("fs");
const { minify } = require("terser");
(async () => {
  const src = fs.readFileSync(__dirname + "/bookmarklet.src.js", "utf8");
  const { code } = await minify(src, { ecma: 2020, compress: true, mangle: true });
  const bm = "javascript:" + encodeURIComponent(code);
  const html = fs.readFileSync(__dirname + "/index.html", "utf8");
  const out = html.replace(/const BOOKMARKLET = ".*";/, "const BOOKMARKLET = " + JSON.stringify(bm) + ";");
  if (out === html && !html.includes(JSON.stringify(bm))) throw new Error("找不到 BOOKMARKLET 常數");
  fs.writeFileSync(__dirname + "/index.html", out);
  console.log("bookmarklet length", bm.length);
})();
