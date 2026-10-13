#!/usr/bin/env node
/* Bonservis bedelleri: FotMob'da eşlenen her oyuncuyu SofaScore'da bulur ve transfer geçmişini (tarih, kulüpler, tür, bedel) çeker.
   Doğrulama: SofaScore'daki transferlerden en az biri FotMob geçmişiyle (±60 gün, aynı varış kulübü) örtüşmeli.
   Kullanım: node tools/veri/4_bonservis.js <oyun.json> <oyuncular.json> <önbellek> <çıktı: bonservis.json> */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const { cachedCurl, pool, norm, toks } = require('./ortak');
const [, , IN, PL, CACHE, OUT] = process.argv;
const D = JSON.parse(fs.readFileSync(IN, 'utf8')), P = JSON.parse(fs.readFileSync(PL, 'utf8'));
const rd = f => fs.existsSync(f) ? JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString()) : null;
const GEN = new Set(['fk', 'sk', 'fc', 'cf', 'afc', 'sc', 'ac', 'cd', 'sd', 'ud', 'club', 'de', 'spor', 'kulubu', 'futbol', 'as', 'us', 'ss', 'calcio', 'the', 'nk', 'bk', 'if', 'ik', 'sv', 'vfl', 'vfb', 'tsv', '1', 'jk', 'ca', 'cs', 'sa', 'ssc', 'rc', 'sporting', 'real', 'city', 'united', 'athletic', 'atletico', 'deportivo', 'olympique', 'stade', 'racing', 'club']);
const sig = s => toks(s).map(w => w.replace(/spor$/, '')).filter(w => w.length >= 3 && !GEN.has(w));
const teamSim = (a, b) => { if (!a || !b) return false; if (norm(a) === norm(b)) return true; const A = sig(a), B = sig(b); return A.some(w => B.some(x => x === w || (w.length >= 5 && x.length >= 5 && (x.startsWith(w) || w.startsWith(x))))); };
const nameSim = (a, b) => { const x = norm(a), y = norm(b); if (x === y) return 2; const A = toks(a), B = toks(b); if (!A.length || !B.length) return 0; if (A[A.length - 1] === B[B.length - 1] && A[0][0] === B[0][0]) return 1; const sub = (p, q) => p.every(w => q.includes(w)) && p.join('').length >= 5; return sub(A, B) || sub(B, A) ? 1 : 0; };
const pickSearch = j => (j.results || []).filter(r => r.type === 'player' || r.entity).map(r => r.entity).filter(e => e && e.team && (!e.team.sport || e.team.sport.id === 1)).map(e => ({ id: e.id, name: e.name, tid: e.team.id, tn: e.team.name, cc: e.country && e.country.alpha2 }));
const pickTH = j => (j.transferHistory || []).map(t => [t.transferDateTimestamp || 0, t.fromTeamName || (t.transferFrom || {}).name || '', (t.transferFrom || {}).id || 0, t.toTeamName || (t.transferTo || {}).name || '', (t.transferTo || {}).id || 0, t.type, t.transferFeeRaw ? t.transferFeeRaw.value : null, t.transferFeeRaw ? t.transferFeeRaw.currency : null, t.transferFeeDescription || '']);
const SS = 'https://api.sofascore.com/api/v1';
const ts = d => Date.parse(d + 'T00:00:00Z') / 1000;

(async () => {
  const res = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};
  const save = () => fs.writeFileSync(OUT, JSON.stringify(res));
  const todo = [];
  for (const [key, e] of Object.entries(P)) {
    if (!e.p || res[key]) continue;
    const r = rd(path.join(CACHE, 'oyuncu', 'pl_' + e.fm + '.json.gz')); if (!r || !r.v) continue;
    const te = (r.v.te || []).filter(t => t[2]); if (te.length < 2) continue; /* tek kulüplü oyuncunun transferi yok */
    todo.push([key, r.v]);
  }
  console.log('aranacak', todo.length);
  let ok = 0, no = 0;
  await pool(todo, 6, async ([key, X]) => {
    const [cid, i] = key.split('#'), g = D.clubs[cid].sq[+i], club = D.clubs[cid];
    const names = [g[0]]; if (norm(X.name) !== norm(g[0])) names.push(X.name);
    const cands = new Map();
    for (const nm of names) {
      const s = await cachedCurl(CACHE + '/ss_ara', 'p_' + norm(nm).replace(/ /g, '_').slice(0, 80), SS + '/search/players?q=' + encodeURIComponent(nm) + '&page=0', pickSearch);
      for (const c of (s && s.v) || []) if (nameSim(nm, c.name) > 0 && !cands.has(c.id)) cands.set(c.id, c);
    }
    const ptn = X.pt ? X.pt[1] : '', hist = X.te.map(t => t[1]);
    const score = c => (teamSim(c.tn, club.name) || teamSim(c.tn, club.short) ? 3 : 0) + (teamSim(c.tn, ptn) ? 3 : 0) + (hist.some(h => teamSim(h, c.tn)) ? 1 : 0) + (nameSim(g[0], c.name) === 2 || nameSim(X.name, c.name) === 2 ? 1 : 0);
    const list = [...cands.values()].map(c => [score(c), c]).filter(x => x[0] >= 1).sort((a, b) => b[0] - a[0]).slice(0, 3);
    const fmMoves = X.te.filter(t => t[2]).map(t => [ts(t[2]), t[1]]);
    for (const [, c] of list) {
      const h = await cachedCurl(CACHE + '/ss_th', 'th_' + c.id, SS + '/player/' + c.id + '/transfer-history', pickTH);
      const T = (h && h.v) || [];
      const hit = T.filter(t => fmMoves.some(([d, n]) => Math.abs(d - t[0]) < 60 * 86400 && teamSim(n, t[3]))).length;
      if (hit >= 1 || (!T.length && false)) { res[key] = { ss: c.id, hit, t: T }; ok++; return; }
    }
    res[key] = { ss: 0 }; no++;
  }, 400, n => { save(); console.log(`${n}/${todo.length} · bulunan ${ok} · bulunamayan ${no}`); });
  save();
  console.log('BİTTİ · bulunan', ok, '· bulunamayan', no);
})();
