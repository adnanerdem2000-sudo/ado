#!/usr/bin/env node
/* FotMob özetlerinden oyunun veri dosyasını üretir: src/game/data/fm_kariyer.js
   İçerik (deflate-raw + base64, oyunda DecompressionStream ile açılır):
     c: kulüp tablosu [ad, oyun kulüp kimliği|'' , FotMob takım kimliği]
     l: lig/turnuva adları
     p: {oyunKulübü: {oyuncuAdı: "boy|sezonlar|transferler|milli|ayak+yaş"}}
        sezon   = yıl,kulüp,maç,gol,asist,reyting*100,lig[,L]   yeni → eski sırada; ilk yıl 1980'den fark, sonrakiler bir öncekinden fark
        transfer= yıl-1980,kimden,kime,tür[bedel_bin€]           eski → yeni sırada; tür: T transfer, F bonservissiz, L kiralık (bedel varsa kiralama bedeli), R kiralıktan dönüş
        kulüp ve lig sıra numaraları 36 tabanında
        milli   = maç,gol,ilk sezon (A milli takım; yoksa boş)
        ayak/yaş= L|R|B (+ düzeltilmiş yaş, yalnız kadrodaki yaş açıkça yanlışsa)
        mevki   = GK,DC,DL,... ana mevki önce (6_mevki.js)
   Kullanım: node tools/veri/3_veri_uret.js <oyun.json> <kulupler.json> <oyuncular.json> <önbellek> [çıktı=src/game/data/fm_kariyer.js] [--bon bonservis.json] [--boy boy_ss.json]
   Bedel: önce SofaScore transfer geçmişi (4_bonservis.js), yoksa eski CARD verisi. */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib'), vm = require('vm');
const { norm, toks } = require('./ortak');
const ROOT = path.resolve(__dirname, '../..');
const argv = process.argv.slice(2), bi = argv.indexOf('--bon'), BONF = bi >= 0 ? argv.splice(bi, 2)[1] : null, hi = argv.indexOf('--boy'), BOYF = hi >= 0 ? argv.splice(hi, 2)[1] : null, mi = argv.indexOf('--mevki'), MEVF = mi >= 0 ? argv.splice(mi, 2)[1] : null;
const [IN, KL, PL, CACHE, OUTA] = argv;
const BON = BONF && fs.existsSync(BONF) ? JSON.parse(fs.readFileSync(BONF, 'utf8')) : {};
const BOY = BOYF && fs.existsSync(BOYF) ? JSON.parse(fs.readFileSync(BOYF, 'utf8')) : {};
const MEV = MEVF && fs.existsSync(MEVF) ? JSON.parse(fs.readFileSync(MEVF, 'utf8')) : {};
const OUT = path.resolve(OUTA || path.join(ROOT, 'src/game/data/fm_kariyer.js'));
const D = JSON.parse(fs.readFileSync(IN, 'utf8')), K = JSON.parse(fs.readFileSync(KL, 'utf8')), P = JSON.parse(fs.readFileSync(PL, 'utf8'));
const rd = f => fs.existsSync(f) ? JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString()) : null;
const load = (f, v) => vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'src/game/data', f), 'utf8') + ';' + v);
const CARD = load('card.js', 'CARD'), CAR_CL = load('car_cl.js', 'CAR_CL');

/* FotMob takım → oyun kulübü: önce kadro eşlemesi, sonra birebir ad (tek aday) */
const fm2g = {}; for (const [id, k] of Object.entries(K)) if (k.ok) fm2g[k.fm] = id;
const byName = {};
const addN = (n, id) => { const k = norm(n); if (!k) return; (byName[k] = byName[k] || new Set()).add(id); };
for (const [id, c] of Object.entries(D.clubs)) { if (c.youth) continue; addN(c.name, id); }
for (const [id, c] of Object.entries(D.ext)) addN(c.name, id);
const gameClub = (tid, name) => {
  if (fm2g[tid]) return fm2g[tid];
  const s = byName[norm(name)]; if (s && s.size === 1) return [...s][0];
  return '';
};
const C = [], Cix = new Map(), clubIdx = (tid, name) => { const key = tid || 'n:' + name; if (Cix.has(key)) return Cix.get(key); const i = C.length; C.push([name, gameClub(tid, name), tid || 0]); Cix.set(key, i); return i; };
const L = [], Lix = new Map(), lgIdx = n => { if (!n) return ''; if (!Lix.has(n)) { Lix.set(n, L.length); L.push(n); } return Lix.get(n); };
const CUP = /cup|pokal|copa|coupe|coppa|kupa|kupası|champions|europa|conference|super ?cup|supercup|shield|libertadores|sudamericana|concacaf|club world|play-?offs?|qualification|trophy|taça|beker|league cup|efl|carabao|friendl|charity|recopa|leagues cup|asian|afc|caf|uefa|ofc|international|premier league 2|youth|u\d\d|reserve|segunda.*b$/i;
const b36 = n => n.toString(36);
const seasonY = n => { let m = /^(\d{4})\/(\d{4})$/.exec(n); if (m) return +m[2] - +m[1] === 1 ? +m[1] : null; m = /^(\d{4})$/.exec(n); return m ? +m[1] - 1 : null; };
const moveY = d => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d); if (!m) return null; const y = +m[1], mo = +m[2]; const Y = mo >= 7 ? y : y - 1; const day = Math.round((Date.UTC(y, mo - 1, +m[3]) - Date.UTC(Y, 6, 1)) / 864e5); return [Y, day]; };
const RES = /\b(II|B|U-?\d{2}|Reserves?|Jong|Youth|Academy|Next|NG|Castilla|Atl[eè]tic|Primavera|Futuro|Promesas|Mestalla|Fabril)\b|\s2$/i;
const SEL = /all[- ]?stars?|\bXI\b|select|legends|olympic|universiade/i;
const sameBase = (a, b) => { const x = base(a), y = base(b); return x === y || (x && y && (x.startsWith(y + ' ') || y.startsWith(x + ' '))); };
const base = n => norm(n).replace(/\b(ii|b|u\d\d|reserves|reserve|2|sub \d\d|jong|youth|academy)\b/g, '').replace(/\s+/g, ' ').trim();

/* SofaScore transfer kaydı: [zaman, kimden, kimdenId, kime, kimeId, tür(1 kiralık,2 dönüş,3 transfer), bedel, para birimi, açıklama] */
const GEN2 = new Set(['fk', 'sk', 'fc', 'cf', 'afc', 'sc', 'ac', 'cd', 'sd', 'ud', 'club', 'de', 'spor', 'kulubu', 'futbol', 'as', 'us', 'ss', 'calcio', 'the', 'nk', 'bk', 'if', 'ik', 'sv', 'vfl', 'vfb', 'tsv', '1', 'jk', 'ca', 'cs', 'sa', 'ssc', 'rc', 'sporting', 'real', 'city', 'united', 'athletic', 'atletico', 'deportivo', 'olympique', 'stade', 'racing']);
const sig2 = s => toks(s).map(w => w.replace(/spor$/, '')).filter(w => w.length >= 3 && !GEN2.has(w));
const teamSim = (a, b) => { if (!a || !b) return false; if (norm(a) === norm(b)) return true; const A = sig2(a), B = sig2(b); return A.some(w => B.some(x => x === w || (w.length >= 5 && x.length >= 5 && (x.startsWith(w) || w.startsWith(x))))); };
const EURO = { EUR: 1, GBP: 1.17, USD: 0.92 };
const ssFind = (T, d, to) => { if (!T) return null; const t0 = Date.parse(d + 'T00:00:00Z') / 1000; let best = null; for (const t of T) { const dd = Math.abs(t[0] - t0); if (dd <= 75 * 86400 && teamSim(t[3], to) && (!best || dd < best[0])) best = [dd, t]; } return best && best[1]; };
/* CARD bonservisleri: oyuncu → [{y, kulüpAdı, bedel}] */
const cardFees = nm => { const d = CARD[nm]; if (!d) return []; return d.split(';').map(x => x.split(',')).filter(a => a[2] === 'T' && a[3] != null).map(a => ({ y: 2000 + +a[0], n: CAR_CL[+a[1]], fee: +a[3] })); };
const sameClub = (a, b) => { const A = toks(a).filter(w => w.length >= 4), B = toks(b).filter(w => w.length >= 4); return norm(a) === norm(b) || A.some(w => B.includes(w)); };

const ageAt = dob => { if (!dob) return null; const d = new Date(dob + 'T00:00:00Z'), r = new Date('2026-08-01T00:00:00Z'); let a = r.getUTCFullYear() - d.getUTCFullYear(); if (r.getUTCMonth() < d.getUTCMonth() || (r.getUTCMonth() === d.getUTCMonth() && r.getUTCDate() < d.getUTCDate())) a--; return a; };
const fakeAge = {}; for (const [id, c] of Object.entries(D.clubs)) { if (!c.sq || !c.sq.length) continue; const m = {}; for (const r of c.sq) m[r[2]] = (m[r[2]] || 0) + 1; fakeAge[id] = Math.max(...Object.values(m)) / c.sq.length > 0.5; }
const out = {}; let nPos = 0, nAge = 0, nFt = 0, nP = 0, nS = 0, nM = 0, nFee = 0, nH = 0, nN = 0, nSS = 0, nCard = 0, nFree = 0, nLoanFee = 0;
const stat = { yasFark: 0, boyFark: [] };
for (const [key, e] of Object.entries(P)) {
  if (!e.p) continue;
  const [cid, i] = key.split('#'), g = D.clubs[cid].sq[+i], nm = g[0];
  const r = rd(path.join(CACHE, 'oyuncu', 'pl_' + e.fm + '.json.gz')); if (!r || !r.v) continue;
  const X = r.v, h = X.h || e.h || 0;
  /* sezonlar (oyun 2026/27'de başlar: yalnız önceki sezonlar) */
  const S = []; let py = null;
  for (const s of X.se) {
    const y = seasonY(s[0]); if (y == null || y >= 2026 || y < 1985 || SEL.test(s[2] || '')) continue;
    const ap = s[3], gl = s[4], as = s[5]; if (ap == null && gl == null) continue;
    const lgs = (s[8] || []).filter(t => t[0] && !CUP.test(t[0])), lg = lgs.length ? lgs[0][0] : '';
    const li = lgIdx(lg), dy = py == null ? y - 1980 : py - y; py = y;
    S.push([dy, b36(clubIdx(s[1], s[2])), ap || 0, gl || 0, as || 0, s[6] ? Math.round(s[6] * 100) : '', li === '' ? '' : b36(li)].join(',') + (s[7] === 'on_loan' ? ',L' : ''));
  }
  /* transferler: takım girdilerinden (eski → yeni) */
  const te = X.te.filter(t => t[2]).slice().sort((a, b) => a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0), M = [], fees = cardFees(nm), SST = BON[key] && BON[key].t;
  let cur = te[0];
  for (let j = 1; j < te.length; j++) {
    const a = cur, b = te[j];
    /* aynı kulübün A takımı ile rezerv/altyapı takımı arası geçiş transfer sayılmaz; ana takım "kimden" olarak kalır */
    if (SEL.test(b[1])) continue;
    if (a[0] === b[0] || sameBase(a[1], b[1])) { if (RES.test(a[1]) && !RES.test(b[1])) cur = b; continue; }
    cur = b;
    if (b[2] > '2026-10-01') continue;
    const yd = moveY(b[2]); if (!yd || yd[0] < 1985) continue;
    let tp = b[4] === 'on_loan' ? 'L' : /back_from_loan/.test(b[4] || '') ? 'R' : /free/.test(b[4] || '') ? 'F' : 'T';
    let fee = '';
    const ss = ssFind(SST, b[2], b[1]);
    if (ss) {
      const v = ss[6] > 0 ? Math.round(ss[6] * (EURO[ss[7]] || 1) / 1000) : 0;
      if (ss[5] === 3) { if (v > 0) { tp = 'T'; fee = v; nFee++; nSS++; } else if (/^free$/i.test(ss[8])) { if (tp === 'T') nFree++; tp = 'F'; } }
      else if (ss[5] === 1) { tp = 'L'; if (v > 0) { fee = v; nLoanFee++; } }
      else if (ss[5] === 2 && tp === 'T') tp = 'R';
    }
    if (tp === 'T' && fee === '') { const f = fees.find(x => Math.abs(x.y - yd[0]) <= 1 && sameClub(x.n, b[1])); if (f) { fee = Math.round(f.fee * 1000); nFee++; nCard++; } }
    M.push([yd[0] - 1980, b36(clubIdx(a[0], a[1])), b36(clubIdx(b[0], b[1])), tp + fee].join(','));
  }
  /* A milli takım: en çok maçlı büyükler takımı → maç,gol,ilk yıl (sezon) */
  let N = '';
  const sen = (X.nt || []).filter(t => t[0] && !/\bU-?\d{2}\b|U\d{2}|olymp|under|sub-?\d|amateur|\bB$|futsal|beach/i.test(t[0]) && (t[1] || 0) > 0).sort((a, b) => b[1] - a[1]);
  if (sen.length) { const t = sen[0], yd = t[3] ? moveY(t[3]) : null; N = [t[1], t[2] || 0, yd ? yd[0] : ''].join(','); nN++; }
  /* tercih edilen ayak + yaş düzeltmesi: yaş yalnız kadro yaşları yer tutucuysa (çoğu aynı) ya da 2+ yaş farkta yazılır */
  const ft = X.ft === 'left' ? 'L' : X.ft === 'right' ? 'R' : X.ft === 'both' ? 'B' : '', ag = ageAt(X.dob);
  let FA = ft; if (ag != null && g[2] != null && ag >= 15 && ag <= 45 && (fakeAge[cid] ? ag !== g[2] : Math.abs(ag - g[2]) >= 2)) { FA += ag; nAge++; }
  if (ft) nFt++;
  if (!S.length && !M.length && !h && !FA) continue;
  const PS = MEV[key] || ''; if (PS) nPos++;
  (out[cid] = out[cid] || {})[nm] = [h || '', S.join(';'), M.join(';'), N, FA, PS].join('|').replace(/\|+$/, '');
  nP++; nS += S.length; nM += M.length; if (h) nH++;
}
/* FotMob'da boyu olmayanlara SofaScore boyu (5_boy_sofascore.js) */
let nBoy = 0;
for (const [key, h] of Object.entries(BOY)) {
  if (!h) continue; const [cid, i] = key.split('#'), g = D.clubs[cid] && D.clubs[cid].sq && D.clubs[cid].sq[+i]; if (!g) continue;
  const o = out[cid] = out[cid] || {}, cur = o[g[0]];
  if (cur == null) { o[g[0]] = String(h); nBoy++; nP++; }
  else { const f = cur.split('|'); if (!f[0]) { f[0] = String(h); o[g[0]] = f.join('|'); nBoy++; } }
}
console.log(`SofaScore boyu ${nBoy}`);
const json = JSON.stringify({ c: C, l: L, p: out });
const z = zlib.deflateRawSync(Buffer.from(json), { level: 9 }).toString('base64');
const head = `/* v128 veri: FotMob'dan gerçek kariyer geçmişi ve boylar — ${nP} oyuncu, ${C.length} kulüp (Ekim 2026). tools/veri/ ile üretildi; elle düzenleme. */`;
fs.writeFileSync(OUT, head + '\nconst FMK_Z="' + z + '";\n');
console.log(`oyuncu ${nP} · boy ${nH} · milli ${nN} · sezon ${nS} · transfer ${nM} (bedel ${nFee}) · kulüp ${C.length} (oyunda ${C.filter(c => c[1]).length}) · lig ${L.length}`);
console.log(`ayak ${nFt} · yaş düzeltmesi ${nAge} · güncel mevki ${nPos}`);
console.log(`bedel kaynağı: SofaScore ${nSS} · CARD ${nCard} · SofaScore'a göre bonservissiz ${nFree} · ücretli kiralık ${nLoanFee}`);
console.log(`ham ${(json.length / 1048576).toFixed(2)} MB → dosya ${(fs.statSync(OUT).size / 1048576).toFixed(2)} MB · ${path.relative(ROOT, OUT)}`);
