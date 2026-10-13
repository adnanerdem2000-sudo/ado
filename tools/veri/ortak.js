/* FotMob veri hattı için ortak yardımcılar: önbellekli istek, eşzamanlılık havuzu, ad normalleştirme ve kadro eşleme. */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140 Safari/537.36';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* İsteği önbellekten ver; yoksa indir, özetle (pick) ve sıkıştırıp sakla. pick null dönerse yine saklanır (tekrar sorulmaz). */
async function cached(cacheDir, key, url, pick) {
  const f = path.join(cacheDir, key + '.json.gz');
  if (fs.existsSync(f)) return JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString());
  let last = null;
  for (let a = 0; a < 5; a++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA, 'accept': 'application/json', 'referer': 'https://www.fotmob.com/' }, signal: AbortSignal.timeout(20000) });
      if (r.status === 404) { last = { status: 404 }; break; }
      if (r.status === 429 || r.status >= 500) { last = { status: r.status }; await sleep(3000 * (a + 1)); continue; }
      if (!r.ok) { last = { status: r.status }; break; }
      const j = await r.json(), v = { status: 200, v: pick ? pick(j) : j };
      fs.mkdirSync(path.dirname(f), { recursive: true });
      fs.writeFileSync(f, zlib.gzipSync(JSON.stringify(v)));
      return v;
    } catch (e) { last = { status: 'ERR', e: String(e.message || e) }; await sleep(2000 * (a + 1)); }
  }
  if (last && last.status === 404) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, zlib.gzipSync(JSON.stringify(last))); }
  return last;
}
async function pool(items, n, fn, every, onTick) {
  let i = 0, done = 0;
  const w = async () => { while (i < items.length) { const k = i++; try { await fn(items[k], k); } catch (e) { console.error('hata', k, e.message); } done++; if (onTick && done % every === 0) onTick(done); } };
  await Promise.all(Array.from({ length: n }, w));
}

function norm(s) {
  return String(s || '').toLowerCase().replace(/ı/g, 'i').replace(/[øØ]/g, 'o').replace(/æ/g, 'ae').replace(/ß/g, 'ss').replace(/[đð]/g, 'd').replace(/ł/g, 'l').replace(/œ/g, 'oe').replace(/þ/g, 'th')
    .normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}
const toks = s => norm(s).split(' ').filter(Boolean);

/* Oyun kadrosu (ad, yaş) ile FotMob kadrosunu eşle. Dönüş: {oyunIndeksi: fotmobÜye} */
function matchSquad(game, fm) {
  const out = {}, usedF = new Set(), usedG = new Set();
  const F = fm.map((m, j) => ({ j, m, n: norm(m.name), t: toks(m.name) }));
  const G = game.map((g, i) => ({ i, g, n: norm(g[0]), t: toks(g[0]) }));
  const ageOk = (g, m) => m.age == null || g[2] == null || Math.abs(m.age - g[2]) <= 2;
  const take = (gi, fj) => { out[gi] = F[fj].m; usedG.add(gi); usedF.add(fj); };
  /* 1) tam ad */
  for (const g of G) { const c = F.filter(f => !usedF.has(f.j) && f.n === g.n && ageOk(g.g, f.m)); if (c.length === 1) take(g.i, c[0].j); }
  /* 2) soyad + ilk harf, ya da bir adın sözcükleri ötekinin içinde (tek aday, yaş tutarlı) */
  for (const g of G) {
    if (usedG.has(g.i)) continue;
    const c = F.filter(f => {
      if (usedF.has(f.j) || !ageOk(g.g, f.m)) return false;
      const a = g.t, b = f.t; if (!a.length || !b.length) return false;
      if (a[a.length - 1] === b[b.length - 1] && a[0][0] === b[0][0]) return true;
      const sub = (x, y) => x.every(w => y.includes(w)) && x.join('').length >= 5;
      return sub(a, b) || sub(b, a);
    });
    if (c.length === 1) take(g.i, c[0].j);
  }
  /* 3) tek sözcüklük takma adlar: sözcük ötekinde geçiyor ve yaş birebir */
  for (const g of G) {
    if (usedG.has(g.i)) continue;
    const c = F.filter(f => !usedF.has(f.j) && f.m.age != null && g.g[2] != null && Math.abs(f.m.age - g.g[2]) <= 1 && (g.t.some(w => w.length >= 4 && f.t.includes(w))));
    if (c.length === 1) take(g.i, c[0].j);
  }
  return out;
}
module.exports = { cached, pool, norm, toks, matchSquad, sleep };

/* SofaScore Node fetch'ini engelliyor; curl ile istek. Önbellek biçimi cached() ile aynı. */
const { execFile } = require('child_process');
function curl(url) {
  return new Promise(res => execFile('curl', ['-sS', '-m', '25', '-A', UA, '-H', 'accept: application/json', '-w', '\n%{http_code}', url], { maxBuffer: 64 << 20 }, (err, out) => {
    if (err && !out) return res({ status: 'ERR', body: '' });
    const i = out.lastIndexOf('\n'); res({ status: +out.slice(i + 1) || 'ERR', body: out.slice(0, i) });
  }));
}
async function cachedCurl(cacheDir, key, url, pick) {
  const f = path.join(cacheDir, key + '.json.gz');
  if (fs.existsSync(f)) return JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString());
  let last = null;
  for (let a = 0; a < 5; a++) {
    const r = await curl(url);
    if (r.status === 200) { let j; try { j = JSON.parse(r.body); } catch (e) { last = { status: 'JSON' }; await sleep(2000); continue; } const v = { status: 200, v: pick ? pick(j) : j }; fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, zlib.gzipSync(JSON.stringify(v))); return v; }
    last = { status: r.status };
    if (r.status === 404) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, zlib.gzipSync(JSON.stringify(last))); return last; }
    await sleep((r.status === 403 || r.status === 429 ? 8000 : 2000) * (a + 1));
  }
  return last;
}
module.exports.cachedCurl = cachedCurl;
