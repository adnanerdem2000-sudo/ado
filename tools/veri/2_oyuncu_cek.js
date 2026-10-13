#!/usr/bin/env node
/* Oyundaki gerçek oyuncuları FotMob oyuncularıyla eşler ve kariyer verilerini çeker.
   A) eşlenmiş kulübün FotMob kadrosundan; B) kalanlar için adla arama + doğrulama; C) her oyuncunun playerData özeti.
   Kullanım: node tools/veri/2_oyuncu_cek.js <oyun.json> <kulupler.json> <önbellek> <çıktı: oyuncular.json> */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const { cached, pool, norm, toks, matchSquad } = require('./ortak');
const [, , IN, KL, CACHE, OUT] = process.argv;
const D = JSON.parse(fs.readFileSync(IN, 'utf8')), K = JSON.parse(fs.readFileSync(KL, 'utf8'));
const rd = f => fs.existsSync(f) ? JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString()) : null;
const num = v => v == null || v === '' ? null : (isNaN(+v) ? null : +v);
const ttk = t => t ? (t.localizationKey || t.text || null) : null;
const ds = d => typeof d === 'string' ? d.slice(0, 10) : d && typeof d.utcTime === 'string' ? d.utcTime.slice(0, 10) : '';

const pickPlayer = j => {
  const info = {}; for (const x of j.playerInformation || []) info[x.title] = x;
  const v = k => info[k] && info[k].value;
  const ci = (j.careerHistory || {}).careerItems || {}, sen = ci.senior || {};
  return {
    id: j.id, name: j.name, dob: j.birthDate ? ds(j.birthDate) || null : null,
    h: v('Height') && v('Height').numberValue || null, ft: v('Preferred foot') ? v('Preferred foot').key || null : null,
    cc: info.Country ? info.Country.countryCode || null : null,
    pt: j.primaryTeam ? [j.primaryTeam.teamId, j.primaryTeam.teamName, !!j.primaryTeam.onLoan] : null,
    full: !!(j.careerHistory && j.careerHistory.fullCareer),
    te: (sen.teamEntries || []).map(t => [t.teamId, t.team, ds(t.startDate), ds(t.endDate), ttk(t.transferType), num(t.appearances), num(t.goals), num(t.assists)]),
    se: (sen.seasonEntries || []).map(s => [s.seasonName, s.teamId, s.team, num(s.appearances), num(s.goals), num(s.assists), s.rating && s.rating.rating ? +s.rating.rating : null, ttk(s.transferType), (s.tournamentStats || []).slice(0, 4).map(x => [x.leagueName, num(x.appearances)])]),
    nt: ((ci['national team'] || {}).teamEntries || []).map(t => [t.team, num(t.appearances), num(t.goals), ds(t.startDate), t.teamId]),
  };
};
const pickSearch = j => { const s = []; for (const grp of j || []) for (const x of grp.suggestions || []) if (x.type === 'player' && !x.isCoach && !s.some(y => y.id === +x.id)) s.push({ id: +x.id, name: x.name, tid: x.teamId, tn: x.teamName }); return s; };
const pickTeamSearch = j => { const s = []; for (const grp of j || []) for (const x of grp.suggestions || []) if (x.type === 'team') s.push({ id: +x.id, name: x.name, lg: x.leagueName, score: x.score }); return s; };

const GEN = new Set(['fk', 'sk', 'fc', 'cf', 'afc', 'sc', 'ac', 'cd', 'sd', 'ud', 'club', 'de', 'spor', 'kulubu', 'futbol', 'as', 'us', 'ss', 'calcio', 'the', 'city', 'united', 'real', 'sporting', 'atletico', 'deportivo', 'nk', 'fk', 'bk', 'if', 'ik', 'sv', 'vfl', 'vfb', 'tsv', '1', 'jk', 'ca', 'cs', 'sa']);
const sigT = s => toks(s).map(w => w.replace(/spor$/, '')).filter(w => w.length >= 3 && !GEN.has(w));
function teamSim(a, b) { const A = sigT(a), B = sigT(b); if (!A.length || !B.length) return norm(a) === norm(b); return A.some(w => B.some(x => x === w || (w.length >= 5 && x.length >= 5 && (x.startsWith(w) || w.startsWith(x))))); }
function nameSim(a, b) {
  const x = norm(a), y = norm(b); if (x === y) return 2;
  const A = toks(a), B = toks(b); if (!A.length || !B.length) return 0;
  if (A[A.length - 1] === B[B.length - 1] && A[0][0] === B[0][0]) return 1;
  const sub = (p, q) => p.every(w => q.includes(w)) && p.join('').length >= 5;
  return sub(A, B) || sub(B, A) ? 1 : 0;
}
const ageAt = dob => { if (!dob) return null; const d = new Date(dob + 'T00:00:00Z'), r = new Date('2026-08-01T00:00:00Z'); let a = r.getUTCFullYear() - d.getUTCFullYear(); if (r.getUTCMonth() < d.getUTCMonth() || (r.getUTCMonth() === d.getUTCMonth() && r.getUTCDate() < d.getUTCDate())) a--; return a; };

(async () => {
  const res = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const save = () => fs.writeFileSync(OUT, JSON.stringify(res));
  const clubs = Object.entries(D.clubs).filter(([, c]) => c.sq && c.sq.length);
  /* yaşlar yer tutucu mu? (kadronun çoğu aynı yaş) */
  const fakeAge = {}; for (const [id, c] of clubs) { const m = {}; for (const r of c.sq) m[r[2]] = (m[r[2]] || 0) + 1; fakeAge[id] = Math.max(...Object.values(m)) / c.sq.length > 0.5; }
  /* A) kadrodan */
  let nA = 0;
  for (const [id, c] of clubs) {
    const k = K[id]; if (!k || !k.ok) continue;
    const t = rd(path.join(CACHE, 'takim', 'tm_' + k.fm + '.json.gz')); if (!t || !t.v) continue;
    const sq = c.sq.map(r => fakeAge[id] ? [r[0], r[1], null, r[3]] : r);
    const m = matchSquad(sq, t.v.sq);
    for (const [i, mm] of Object.entries(m)) { const key = id + '#' + i; if (!res[key]) { res[key] = { fm: mm.id, via: 'sq', h: mm.h, dob: mm.dob }; nA++; } }
  }
  save(); console.log('A) kadrodan eşlenen', nA, '· toplam', Object.keys(res).length);
  /* B) adla arama */
  const todo = []; for (const [id, c] of clubs) c.sq.forEach((r, i) => { const key = id + '#' + i; if (!res[key]) todo.push([id, i]); });
  console.log('B) aranacak', todo.length);
  const teamCand = {};
  const clubIds = async id => {
    if (teamCand[id]) return teamCand[id];
    const c = D.clubs[id], set = new Set(); const k = K[id]; if (k && k.ok) set.add(k.fm);
    for (const t of [c.name, c.short]) { const r = await cached(CACHE + '/ara', 't_' + norm(t).replace(/ /g, '_').slice(0, 80), 'https://www.fotmob.com/api/data/search/suggest?term=' + encodeURIComponent(t) + '&lang=en', pickTeamSearch); for (const x of (r && r.v) || []) if (teamSim(c.name, x.name) || teamSim(c.short, x.name)) set.add(x.id); }
    return teamCand[id] = set;
  };
  let nB = 0;
  await pool(todo, 8, async ([id, i]) => {
    const c = D.clubs[id], g = c.sq[i], key = id + '#' + i;
    const r = await cached(CACHE + '/arap', 'p_' + norm(g[0]).replace(/ /g, '_').slice(0, 80), 'https://www.fotmob.com/api/data/search/suggest?term=' + encodeURIComponent(g[0]) + '&lang=en', pickSearch);
    const cand = ((r && r.v) || []).filter(x => nameSim(g[0], x.name) > 0); if (!cand.length) return;
    const ids = await clubIds(id);
    let hit = cand.find(x => ids.has(x.tid)) || cand.find(x => x.tn && (teamSim(c.name, x.tn) || teamSim(c.short, x.tn)));
    let via = 'ara-takim';
    if (!hit) { const ex = cand.filter(x => nameSim(g[0], x.name) === 2); if (ex.length === 1 && toks(g[0]).length >= 2) { hit = ex[0]; via = 'ara-ad'; } }
    if (hit) { res[key] = { fm: hit.id, via }; nB++; }
  }, 500, n => { save(); console.log(`B) ${n}/${todo.length} · bulunan ${nB}`); });
  save(); console.log('B) bulunan', nB);
  /* C) oyuncu verisi + doğrulama */
  const keys = Object.keys(res).filter(k => !res[k].p && !res[k].bad);
  console.log('C) çekilecek', keys.length);
  let nC = 0, nBad = 0;
  await pool(keys, 8, async key => {
    const e = res[key], [id, i] = key.split('#'), g = D.clubs[id].sq[+i];
    const r = await cached(CACHE + '/oyuncu', 'pl_' + e.fm, 'https://www.fotmob.com/api/data/playerData?id=' + e.fm, pickPlayer);
    if (!r || !r.v) { e.bad = 'veri yok'; nBad++; return; }
    const P = r.v, a = ageAt(P.dob);
    if (e.via !== 'sq') {
      if (!fakeAge[id] && a != null && g[2] != null && Math.abs(a - g[2]) > 2) { e.bad = `yaş ${a}≠${g[2]}`; nBad++; return; }
      if (e.via === 'ara-ad' && (fakeAge[id] || a == null || P.cc !== g[3])) { e.bad = 'doğrulanamadı'; nBad++; return; }
    }
    e.p = 1; nC++;
  }, 500, n => { save(); console.log(`C) ${n}/${keys.length} · tamam ${nC} · red ${nBad}`); });
  save();
  const all = Object.values(res), ok = all.filter(x => x.p);
  console.log('BİTTİ · eşlenen oyuncu', ok.length, '· kadrodan', ok.filter(x => x.via === 'sq').length, '· aramadan', ok.filter(x => x.via !== 'sq').length, '· reddedilen', all.filter(x => x.bad).length);
})();
