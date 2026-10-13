#!/usr/bin/env node
/* Oyundaki gerçek kadrolu kulüpleri FotMob takımlarıyla eşler. Aday takımlar aramadan gelir; kadro örtüşmesi en yüksek olan seçilir.
   Kullanım: node tools/veri/1_kulup_esle.js <oyun.json> <önbellek> <çıktı: kulupler.json> */
'use strict';
const fs = require('fs');
const { cached, pool, norm, matchSquad } = require('./ortak');
const [, , IN, CACHE, OUT] = process.argv;
const D = JSON.parse(fs.readFileSync(IN, 'utf8'));

const pickTeam = j => {
  const sq = []; for (const g of (j.squad && j.squad.squad) || []) { if (g.title === 'coach') continue; for (const m of g.members || []) sq.push({ id: m.id, name: m.name, h: m.height || null, dob: m.dateOfBirth || null, age: m.age != null ? m.age : null, pos: m.positionIdsDesc || g.title, cc: m.ccode || null }); }
  const d = j.details || {};
  return { id: d.id, name: d.name, short: d.shortName, country: d.country, gender: d.gender, sq };
};
const pickSearch = j => { const s = []; for (const grp of j || []) for (const x of grp.suggestions || []) if (x.type === 'team') s.push({ id: +x.id, name: x.name, lg: x.leagueName, score: x.score }); return s; };

const terms = c => {
  const t = [c.name, c.short], s = new Set();
  t.push(c.name.replace(/\b(FK|SK|FC|CF|AFC|SC|AC|CD|SD|UD|JK|GK|Spor Kulübü|Kulübü|Futbol)\b/gi, '').replace(/\s+/g, ' ').trim());
  t.push(c.name.replace(/spor$/i, '').trim());
  return t.filter(x => x && x.length >= 3 && !s.has(x) && s.add(x));
};

(async () => {
  const ids = Object.keys(D.clubs).filter(id => D.clubs[id].sq && D.clubs[id].sq.length);
  const res = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const todo = ids.filter(id => !res[id]);
  console.log('kulüp', ids.length, 'yapılacak', todo.length);
  await pool(todo, 6, async id => {
    const c = D.clubs[id], cand = new Map();
    for (const t of terms(c)) {
      const r = await cached(CACHE + '/ara', 't_' + norm(t).replace(/ /g, '_').slice(0, 80), 'https://www.fotmob.com/api/data/search/suggest?term=' + encodeURIComponent(t) + '&lang=en', pickSearch);
      for (const x of (r && r.v) || []) if (!cand.has(x.id)) cand.set(x.id, x);
      if (cand.size >= 3) break;
    }
    let best = null;
    for (const x of [...cand.values()].slice(0, 5)) {
      const r = await cached(CACHE + '/takim', 'tm_' + x.id, 'https://www.fotmob.com/api/data/teams?id=' + x.id, pickTeam);
      if (!r || !r.v || !r.v.sq) continue;
      const m = matchSquad(c.sq, r.v.sq), n = Object.keys(m).length, f = n / c.sq.length;
      if (!best || n > best.n) best = { fm: x.id, fmName: r.v.name, n, f: +f.toFixed(2), size: r.v.sq.length };
      if (f >= 0.6) break;
    }
    res[id] = best && (best.f >= 0.3 || best.n >= 8) ? Object.assign({ ok: 1 }, best) : Object.assign({ ok: 0 }, best || {});
  }, 25, n => { fs.writeFileSync(OUT, JSON.stringify(res)); const ok = Object.values(res).filter(x => x.ok).length; console.log(`${n}/${todo.length} · eşlenen ${ok}`); });
  fs.writeFileSync(OUT, JSON.stringify(res));
  const ok = Object.values(res).filter(x => x.ok);
  console.log('BİTTİ · eşlenen kulüp', ok.length, '/', ids.length, '· eşlenen oyuncu', ok.reduce((a, x) => a + x.n, 0));
})();
