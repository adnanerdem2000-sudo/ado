#!/usr/bin/env node
/* Güncel mevkiler (ana mevki önce): FotMob kadro kaydı (positionIdsDesc), yoksa oyuncu sayfasındaki positionDescription (ana mevki + oynama sıklığı).
   Oyun kodları: GK DC DL DR WBL WBR DM MC AMC ML MR AML AMR ST.
   Kullanım: node tools/veri/6_mevki.js <oyun.json> <kulupler.json> <oyuncular.json> <önbellek> <çıktı: mevki.json> */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const { cached, pool, matchSquad } = require('./ortak');
const [, , IN, KL, PL, CACHE, OUT] = process.argv;
const D = JSON.parse(fs.readFileSync(IN, 'utf8')), K = JSON.parse(fs.readFileSync(KL, 'utf8')), P = JSON.parse(fs.readFileSync(PL, 'utf8'));
const rd = f => fs.existsSync(f) ? JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString()) : null;
const MAP = { GK: 'GK', CB: 'DC', LB: 'DL', RB: 'DR', LWB: 'WBL', RWB: 'WBR', CDM: 'DM', DM: 'DM', CM: 'MC', CAM: 'AMC', AM: 'AMC', LM: 'ML', RM: 'MR', LW: 'AML', RW: 'AMR', ST: 'ST', CF: 'ST' };
const conv = list => { const o = []; for (const x of list) { const k = MAP[String(x).trim().toUpperCase()]; if (k && !o.includes(k)) o.push(k); } return o; };
const pickPos = j => { const P = (j.positionDescription && j.positionDescription.positions) || []; return P.map(p => [p.strPosShort && p.strPosShort.label, p.occurences || 0, !!p.isMainPosition]); };
(async () => {
  const res = {}, need = [];
  /* kadro mevkileri: aynı eşlemeyi yeniden kur */
  const sqPos = {};
  for (const [id, c] of Object.entries(D.clubs)) { const k = K[id]; if (!c.sq || !k || !k.ok) continue; const t = rd(path.join(CACHE, 'takim', 'tm_' + k.fm + '.json.gz')); if (!t || !t.v) continue; for (const m of t.v.sq) sqPos[m.id] = m.pos; }
  for (const [key, e] of Object.entries(P)) { if (!e.p) continue; const L = conv(String(sqPos[e.fm] || '').split(',')); if (L.length) res[key] = L.join(','); else need.push([key, e.fm]); }
  console.log('kadrodan', Object.keys(res).length, '· sayfadan çekilecek', need.length);
  let n = 0;
  await pool(need, 8, async ([key, fm]) => {
    const r = await cached(CACHE + '/mevki', 'm_' + fm, 'https://www.fotmob.com/api/data/playerData?id=' + fm, pickPos);
    if (!r || !r.v || !r.v.length) return;
    const s = r.v.slice().sort((a, b) => (b[2] - a[2]) || (b[1] - a[1]));
    const L = conv(s.filter(x => x[2] || x[1] >= 2).map(x => x[0])); if (L.length) { res[key] = L.join(','); n++; }
  }, 500, d => console.log(`${d}/${need.length} · bulunan ${n}`));
  fs.writeFileSync(OUT, JSON.stringify(res));
  console.log('BİTTİ · mevki', Object.keys(res).length);
})();
