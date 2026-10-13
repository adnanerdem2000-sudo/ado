#!/usr/bin/env node
/* FotMob'da boyu olmayan profesyonel oyuncuların boyu SofaScore oyuncu sayfasından. Kimlik: bonservis aşamasında doğrulanan SofaScore kimliği,
   yoksa ad araması + kulüp adı benzerliği; doğum tarihinden yaş oyundaki yaşla ±2 içinde olmalı.
   Kullanım: node tools/veri/5_boy_sofascore.js <oyun.json> <oyuncular.json> <bonservis.json> <önbellek> <çıktı: boy_ss.json> */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const { cachedCurl, pool, norm, toks } = require('./ortak');
const [, , IN, PL, BN, CACHE, OUT] = process.argv;
const D = JSON.parse(fs.readFileSync(IN, 'utf8')), P = JSON.parse(fs.readFileSync(PL, 'utf8')), B = JSON.parse(fs.readFileSync(BN, 'utf8'));
const rd = f => fs.existsSync(f) ? JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString()) : null;
const GEN = new Set(['fk', 'sk', 'fc', 'cf', 'afc', 'sc', 'ac', 'cd', 'sd', 'ud', 'club', 'de', 'spor', 'kulubu', 'futbol', 'as', 'us', 'ss', 'calcio', 'the', 'nk', 'bk', 'if', 'ik', 'sv', 'vfl', 'vfb', 'tsv', '1', 'jk', 'ca', 'cs', 'sa', 'ssc', 'rc', 'sporting', 'real', 'city', 'united', 'athletic', 'atletico', 'deportivo', 'olympique', 'stade', 'racing', 'belediyespor', 'belediye']);
const sig = s => toks(s).map(w => w.replace(/spor$/, '')).filter(w => w.length >= 3 && !GEN.has(w));
const teamSim = (a, b) => { if (!a || !b) return false; if (norm(a) === norm(b)) return true; const A = sig(a), Bb = sig(b); return A.some(w => Bb.some(x => x === w || (w.length >= 5 && x.length >= 5 && (x.startsWith(w) || w.startsWith(x))))); };
const nameEq = (a, b) => { const x = norm(a), y = norm(b); if (x === y) return true; const A = toks(a), Bb = toks(b); return A.length > 1 && Bb.length > 1 && A[A.length - 1] === Bb[Bb.length - 1] && A[0] === Bb[0]; };
const SS = 'https://api.sofascore.com/api/v1';
const pickSearch = j => (j.results || []).map(r => r.entity).filter(e => e && e.team && (!e.team.sport || e.team.sport.id === 1)).map(e => ({ id: e.id, name: e.name, tn: e.team.name }));
const pickP = j => { const p = j.player || {}; return { h: p.height || null, dob: p.dateOfBirthTimestamp || null, tn: p.team && p.team.name }; };
(async () => {
  const res = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}, save = () => fs.writeFileSync(OUT, JSON.stringify(res));
  const todo = [];
  for (const [cid, c] of Object.entries(D.clubs)) {
    if (!c.sq || /^(bal|sal|trx)/.test(c.lg)) continue;
    c.sq.forEach((r, i) => { const k = cid + '#' + i; if (res[k] !== undefined) return; const e = P[k]; let h = null; if (e && e.p) { const x = rd(path.join(CACHE, 'oyuncu', 'pl_' + e.fm + '.json.gz')); h = (x && x.v && x.v.h) || e.h; } if (!h) todo.push([k, cid, r]); });
  }
  console.log('boysuz', todo.length);
  let ok = 0;
  await pool(todo, 6, async ([k, cid, r]) => {
    const club = D.clubs[cid]; let id = B[k] && B[k].ss ? B[k].ss : null, via = 'bon';
    if (!id) {
      const s = await cachedCurl(CACHE + '/ss_ara', 'p_' + norm(r[0]).replace(/ /g, '_').slice(0, 80), SS + '/search/players?q=' + encodeURIComponent(r[0]) + '&page=0', pickSearch);
      const c = ((s && s.v) || []).filter(x => nameEq(r[0], x.name) && (teamSim(x.tn, club.name) || teamSim(x.tn, club.short)));
      if (c.length === 1) { id = c[0].id; via = 'ara'; }
    }
    if (!id) { res[k] = 0; return; }
    const d = await cachedCurl(CACHE + '/ss_p', 'p_' + id, SS + '/player/' + id, pickP);
    const v = d && d.v; if (!v || !v.h || v.h < 150 || v.h > 210) { res[k] = 0; return; }
    if (v.dob && r[2] != null) { const age = Math.floor((Date.UTC(2026, 7, 1) / 1000 - v.dob) / (365.25 * 86400)); if (Math.abs(age - r[2]) > 2 && via === 'ara') { res[k] = 0; return; } }
    res[k] = v.h; ok++;
  }, 500, n => { save(); console.log(`${n}/${todo.length} · boy bulundu ${ok}`); });
  save(); console.log('BİTTİ · boy bulundu', ok, '/', todo.length);
})();
