#!/usr/bin/env node
/* Oyuncu portreleri için ten (ve güvenliyse saç) rengini FotMob oyuncu fotoğraflarından ölçer.
   Kaynak: https://images.fotmob.com/image_resources/playerimages/<fotmobId>.png (192×192, saydam arka planlı vesikalık).
   Yöntem: yanak ve alın bölgelerinden (görüntü boyutuna göre sabit oranlı dikdörtgenler) saydam olmayan pikseller alınır,
   aşırı koyu (gölge/sakal) ve aşırı parlak (ışık yansıması) uçlar atılır, CIELAB medyanı hesaplanır. Ölçülen renk oyunun ten
   paletine (SKN, 9 ton) Lab uzaklığıyla eşlenir. Güven: piksel sayısı, bölgeler arası tutarlılık ve renk doygunluğu (siyah-beyaz foto elenir).
   Saç: alnın üstündeki bantta tene benzemeyen pikseller yeterince çoksa medyanı saç paletine (koyu/kahve/açık kahve/sarı/kızıl) eşlenir.
   Etnik köken ya da benzeri hiçbir etiket üretilmez; yalnızca çizim renkleri.
   Kullanım: node tools/veri/7_gorunus.js <oyun.json> <oyuncular.json> <önbellek> <çıktı: gorunus.json> [--yaz src/game/data/ten_fm.js] [--esz 6] [--sinir n]
   Önbellek: <önbellek>/foto/<id>.png (403/404 için <id>.yok). */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(k); if (i < 0) return d; const v = argv[i + 1]; argv.splice(i, 2); return v; };
const YAZ = opt('--yaz', null), ESZ = +opt('--esz', 6), SINIR = +opt('--sinir', 0);
const [IN, PL, CACHE, OUT] = argv;
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- küçük PNG çözücü (renk türü 0/2/3/4/6, 1–8 bit, taramasız) ---------- */
function decodePNG(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('png değil');
  let p = 8, W = 0, H = 0, bd = 0, ct = 0, il = 0, pal = null, trn = null; const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), typ = buf.toString('ascii', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len); p += 12 + len;
    if (typ === 'IHDR') { W = d.readUInt32BE(0); H = d.readUInt32BE(4); bd = d[8]; ct = d[9]; il = d[12]; }
    else if (typ === 'PLTE') pal = d; else if (typ === 'tRNS') trn = d; else if (typ === 'IDAT') idat.push(d); else if (typ === 'IEND') break;
  }
  if (il) throw new Error('taramalı png');
  if (bd === 16) throw new Error('16 bit');
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ct], bpp = Math.max(1, (ch * bd) >> 3), stride = (W * ch * bd + 7) >> 3;
  const raw = zlib.inflateSync(Buffer.concat(idat)), out = Buffer.alloc(W * H * 4); let prev = Buffer.alloc(stride);
  for (let y = 0; y < H; y++) {
    const f = raw[y * (stride + 1)], line = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? line[i - bpp] : 0, b = prev[i], c = i >= bpp ? prev[i - bpp] : 0;
      let v = line[i];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += (pa <= pb && pa <= pc) ? a : pb <= pc ? b : c; }
      line[i] = v & 255;
    }
    prev = line;
    const sample = x => { if (bd === 8) return line[x]; const per = 8 / bd, byte = line[Math.floor(x / per)], sh = (per - 1 - (x % per)) * bd; return (byte >> sh) & ((1 << bd) - 1); };
    for (let x = 0; x < W; x++) {
      const o = (y * W + x) * 4; let r, g, b2, al = 255;
      if (ct === 3) { const ix = sample(x); r = pal[ix * 3]; g = pal[ix * 3 + 1]; b2 = pal[ix * 3 + 2]; if (trn && ix < trn.length) al = trn[ix]; }
      else if (ct === 0) { r = g = b2 = sample(x) * (255 / ((1 << bd) - 1)); }
      else if (ct === 4) { r = g = b2 = line[x * 2]; al = line[x * 2 + 1]; }
      else if (ct === 2) { r = line[x * 3]; g = line[x * 3 + 1]; b2 = line[x * 3 + 2]; }
      else { r = line[x * 4]; g = line[x * 4 + 1]; b2 = line[x * 4 + 2]; al = line[x * 4 + 3]; }
      out[o] = r; out[o + 1] = g; out[o + 2] = b2; out[o + 3] = al;
    }
  }
  return { W, H, px: out };
}

/* ---------- renk ---------- */
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
function lab(r, g, b) {
  const R = lin(r), G = lin(g), B = lin(b);
  const X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, Y = R * 0.2126 + G * 0.7152 + B * 0.0722, Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const hex2lab = h => lab(parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16));
const dE = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };

/* Oyunun ten paleti (016_v10…: SKN) ve saç paleti (HCOL) */
const SKN = ['#f6d6bd', '#efc6a2', '#e2b088', '#d39c6e', '#c08559', '#a8704a', '#8c5a39', '#6e4329', '#52301d'];
const HC = { black: '#120b07', dark: '#2b1a10', brown: '#4a2f18', lbrown: '#7a5230', blond: '#c9a35e', red: '#9a4a22' };
/* Fotoğraflar stüdyo ışığında çekilir: ölçülen L* oyun paletine göre daha parlaktır. Eşlemeden önce L* doğrusal düzeltilir
   (katsayılar, elle seçilmiş LOOKS ten sınıfı olan oyuncularla uyuma göre ayarlandı; --kalibre çıktısına bak). */
const CAL = { a: 1.0, b: 0 };
const SKN_LAB = SKN.map(hex2lab);
function skinIndex(L) {
  const q = [L[0] * CAL.a + CAL.b, L[1], L[2]];
  let bi = 0, bd = 1e9; for (let i = 0; i < SKN_LAB.length; i++) { const P = SKN_LAB[i], d = Math.hypot((q[0] - P[0]) * 1.0, (q[1] - P[1]) * 0.6, (q[2] - P[2]) * 0.6); if (d < bd) { bd = d; bi = i; } }
  return bi;
}

/* ---------- ölçüm ---------- */
function region(img, x0, y0, x1, y1) {
  const { W, H, px } = img, out = [];
  for (let y = Math.round(y0 * H); y < Math.round(y1 * H); y++) for (let x = Math.round(x0 * W); x < Math.round(x1 * W); x++) {
    const o = (y * W + x) * 4; if (px[o + 3] < 230) continue; out.push(lab(px[o], px[o + 1], px[o + 2]));
  }
  return out;
}
function trimmedMedian(arr) {
  if (arr.length < 20) return null;
  const s = arr.slice().sort((a, b) => a[0] - b[0]), lo = Math.floor(s.length * 0.25), hi = Math.ceil(s.length * 0.85), mid = s.slice(lo, hi);
  return [med(mid.map(v => v[0])), med(mid.map(v => v[1])), med(mid.map(v => v[2]))];
}
function analyse(buf) {
  const img = decodePNG(buf);
  /* görüntünün kenarlarında saydamlık var mı (vesikalık kesimi) */
  const R = { cl: region(img, 0.29, 0.56, 0.40, 0.68), cr: region(img, 0.60, 0.56, 0.71, 0.68), fh: region(img, 0.41, 0.33, 0.59, 0.42), ns: region(img, 0.45, 0.50, 0.55, 0.60) };
  const M = {}; for (const k in R) M[k] = trimmedMedian(R[k]);
  const parts = Object.values(M).filter(Boolean);
  if (parts.length < 2) return { ok: 0, why: 'bölge' };
  const all = [].concat(R.cl, R.cr, R.fh, R.ns), sk = trimmedMedian(all);
  /* tutarlılık: yanaklar ve burun ortası birbirine yakın olmalı (alın saçla kapanabilir; yalnız bilgi amaçlı) */
  const core = [M.cl, M.cr, M.ns].filter(Boolean); let spread = 0; for (const a of core) for (const b of core) spread = Math.max(spread, dE(a, b));
  const chroma = Math.hypot(sk[1], sk[2]), hue = Math.atan2(sk[2], sk[1]) * 180 / Math.PI;
  let conf = 1;
  if (all.length < 400) conf -= 0.3;
  if (spread > 14) conf -= 0.35; else if (spread > 9) conf -= 0.15;
  if (chroma < 8) conf -= 0.6;              /* siyah-beyaz/renksiz */
  if (hue < 20 || hue > 85) conf -= 0.4;    /* deri tonu açısı dışında (renk kayması) */
  if (sk[0] < 18 || sk[0] > 92) conf -= 0.4;
  /* saç: alnın üstündeki bant; tene uzak pikseller */
  let hair = null;
  const band = region(img, 0.30, 0.10, 0.70, 0.24);
  if (band.length > 300) {
    const far = band.filter(v => dE(v, sk) > 22 && Math.hypot(v[1], v[2]) < 45);
    const frac = far.length / band.length;
    if (frac > 0.55 && far.length > 400) {
      const h = trimmedMedian(far.map(v => [v[0], v[1], v[2]]).sort((a, b) => a[0] - b[0]).slice(0, Math.ceil(far.length * 0.8)));
      if (h) {
        const hl = h[0], hc = Math.hypot(h[1], h[2]);
        let k = null;
        if (hl < 22) k = 'black'; else if (hl < 30) k = 'dark'; else if (hl < 40) k = 'brown';
        else if (hl < 52) k = hc > 22 && h[1] > 14 ? 'red' : 'lbrown';
        else if (hl < 78 && h[2] > 18) k = hc > 26 && h[1] > 16 ? 'red' : 'blond';
        if (k) hair = { k, L: +hl.toFixed(1), frac: +frac.toFixed(2) };
      }
    }
  }
  return { ok: 1, lab: sk.map(v => +v.toFixed(1)), n: all.length, spread: +spread.toFixed(1), conf: +Math.max(0, conf).toFixed(2), hair };
}

/* ---------- indirme ---------- */
async function photo(id) {
  const dir = path.join(CACHE, 'foto'), f = path.join(dir, id + '.png'), no = path.join(dir, id + '.yok');
  if (fs.existsSync(f)) return fs.readFileSync(f);
  if (fs.existsSync(no)) return null;
  fs.mkdirSync(dir, { recursive: true });
  for (let a = 0; a < 4; a++) {
    try {
      const r = await fetch(`https://images.fotmob.com/image_resources/playerimages/${id}.png`, { headers: { 'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) futbol-kariyeri-veri', 'referer': 'https://www.fotmob.com/' }, signal: AbortSignal.timeout(15000) });
      if (r.status === 403 || r.status === 404) { fs.writeFileSync(no, String(r.status)); return null; }
      if (r.status === 429 || r.status >= 500) { await sleep(2500 * (a + 1)); continue; }
      if (!r.ok) return null;
      const b = Buffer.from(await r.arrayBuffer()); fs.writeFileSync(f, b); await sleep(60); return b;
    } catch (e) { await sleep(1500 * (a + 1)); }
  }
  return null;
}
async function pool(items, n, fn, every, tick) {
  let i = 0, done = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; try { await fn(items[k]); } catch (e) { } if (++done % every === 0) tick(done); } }));
}

/* oyunda da aynı sağlama: ad üzerinden tek karakter (ad değişmiş/kadro kaymışsa veri kullanılmaz) */
const CK = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const nameCk = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.codePointAt(0)) >>> 0; return CK[h % 62]; };

if (require.main !== module) module.exports = { analyse, decodePNG, skinIndex, lab, nameCk, SKN };
else (async () => {
  const D = JSON.parse(fs.readFileSync(IN, 'utf8')), P = JSON.parse(fs.readFileSync(PL, 'utf8'));
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  let items = Object.entries(P).filter(([k, e]) => e && e.fm);
  if (SINIR) items = items.slice(0, SINIR);
  const res = {}; let got = 0, miss = 0, bad = 0;
  console.log('eşlenmiş oyuncu', items.length);
  await pool(items, ESZ, async ([key, e]) => {
    const buf = await photo(e.fm);
    if (!buf) { miss++; return; }
    got++;
    try { const a = analyse(buf); res[key] = Object.assign({ fm: e.fm }, a); if (!a.ok) bad++; } catch (er) { bad++; res[key] = { fm: e.fm, ok: 0, why: er.message }; }
  }, 500, d => console.log(`${d}/${items.length} · foto ${got} · yok ${miss} · ölçülemedi ${bad}`));
  fs.writeFileSync(OUT, JSON.stringify(res));
  const ok = Object.values(res).filter(r => r.ok), conf = ok.filter(r => r.conf >= 0.6);
  console.log(`BİTTİ · foto ${got} · fotoğrafı yok ${miss} · ölçülen ${ok.length} · güvenli ${conf.length} · saç ${conf.filter(r => r.hair).length}`);
  if (!YAZ) return;
  /* oyun verisi: kulüp başına dize; her oyuncu yuvası 3 karakter: ten (0-8 | '.'), saç (k d b l s r | '.'), ad sağlaması */
  const HK = { black: 'k', dark: 'd', brown: 'b', lbrown: 'l', blond: 's', red: 'r' };
  const out = {};
  for (const [id, c] of Object.entries(D.clubs)) {
    if (!c.sq) continue; let s = '', any = false;
    c.sq.forEach((row, i) => {
      const r = res[id + '#' + i];
      if (r && r.ok && r.conf >= 0.6) { any = true; s += skinIndex(r.lab) + (r.hair ? HK[r.hair.k] : '.') + nameCk(row[0]); } else s += '...';
    });
    if (any) out[id] = s.replace(/(\.\.\.)+$/, '');
  }
  const js = `/* v159: FotMob oyuncu fotoğraflarından ölçülen ten/saç rengi (tools/veri/7_gorunus.js ile üretildi; elle düzenleme). Kulüp → yuva başına 3 karakter: ten 0-8 (SKN), saç k/d/b/l/s/r, ad sağlaması */\nconst TEN_FM=${JSON.stringify(out)};\n`;
  fs.writeFileSync(YAZ, js);
  console.log('yazıldı', YAZ, js.length, 'bayt · kulüp', Object.keys(out).length);
})();
