#!/usr/bin/env node
/* Uzun kariyer simülasyonu: seçilen meslekte kariyer başlatır, "Devam" ile günleri ilerletir, maçları görüntüsüz sonuçlandırır (fxToEnd),
   açılan pencereleri varsayılan seçimle kapatır; hataları, takılmaları ve ilerlemeyi raporlar.
   Kullanım: node tools/kariyer_sim.js <profil> [--sezon 2] [--dk 15] [--rapor rapor.json]
   Profiller: td oyuncu yrd scout dr sd bsk ref (tools/smoke.js ile aynı başlangıçlar). Son satır SIM_OK ya da SIM_FAIL. */
'use strict';
const path = require('path'), fs = require('fs');
const pw = (() => { try { return require('playwright'); } catch (e) { return require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')); } })();
const A = process.argv.slice(2), opt = (k, d) => { const i = A.indexOf(k); return i < 0 ? d : A[i + 1]; };
const PROF = A[0] || 'td', SEASONS = +opt('--sezon', 2), MINS = +opt('--dk', 15), REP = opt('--rapor', null);
const PROFILES = {
  td: { prof: 'td', age: 40, lvl: 'orta', lg: 'sl', club: 'samsunspor' }, oyuncu: { prof: 'oyuncu', age: 12, lvl: 'sifir' },
  yrd: { prof: 'yrd', age: 32, lvl: 'orta' }, scout: { prof: 'scout', age: 30, lvl: 'orta' }, dr: { prof: 'dr', age: 34, lvl: 'orta' },
  sd: { prof: 'sd', age: 45, lvl: 'orta' }, bsk: { prof: 'bsk', age: 55, lvl: 'orta' }, ref: { prof: 'ref', age: 30, lvl: 'orta' },
};
(async () => {
  const P = PROFILES[PROF]; if (!P) { console.log('bilinmeyen profil', PROF); process.exit(2); }
  const b = await pw.chromium.launch(), ctx = await b.newContext({ viewport: { width: 412, height: 860 } });
  await ctx.route(u => !/^(file|data|blob|about):/.test(u.protocol), r => r.abort());
  const p = await ctx.newPage(), errs = [], seen = new Set();
  const addErr = s => { const k = s.slice(0, 160); if (seen.has(k)) return; seen.add(k); errs.push(s); };
  p.on('pageerror', e => addErr('sayfa: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|permissions policy|Failed to load resource/.test(m.text())) addErr('konsol: ' + m.text().slice(0, 300)); });
  await p.goto('file://' + path.resolve(__dirname, '../dist/futbol-kariyeri.html'));
  await p.waitForTimeout(2000);
  await p.evaluate(P => { localStorage.setItem('fx3d', '0'); localStorage.setItem('abeng', '0'); localStorage.setItem('pl3d', '0'); localStorage.setItem('plmode', 'classic'); G = null; Object.assign(W, { fn: 'Deneme', ln: 'Simülasyon' }, P); wizGo(); }, P);
  const t0 = Date.now(), log = []; let last = '', same = 0, it = 0, stalls = 0, matches = 0, scenes = 0, y0 = null;
  while (Date.now() - t0 < MINS * 60000) {
    it++;
    let st;
    try {
      st = await p.evaluate(() => {
        const vis = el => el && el.offsetParent !== null;
        if (typeof FX !== 'undefined' && FX) { if (FX.phase === 'end' && !FX.ab) { FX.__end = (FX.__end || 0) + 1; if (FX.__end > 2) { try { fxClose(); } catch (e) { return 'kapat-hata ' + e.message; } return 'maç-bitti'; } } if (FX.phase === 'pre' && !FX.ab) { try { fxAct('play'); } catch (e) { } } if (!FX.__sim || (FX.ab && window.ABM && ABM.sim && !ABM.ff)) { FX.__sim = 1; try { fxToEnd(); } catch (e) { return 'maç-hata ' + e.message; } } return 'maç'; }
        const md = document.querySelector('#modal');
        if (md && !md.hidden) {
          const bs = [...document.querySelectorAll('#modalCard button')].filter(vis);
          const pref = bs.find(x => x.dataset.auto) || bs.find(x => /\bcta\b/.test(x.className) && !/sil|ayrıl|istifa|emekli|bırak|kov/i.test(x.textContent)) || bs.find(x => x.dataset.act && x.dataset.act !== 'closeModal' && !/sil|ayrıl|istifa|emekli|bırak|kov|reddet/i.test(x.textContent));
          if (pref && Math.random() < 0.8) { pref.click(); return 'pencere:' + (pref.dataset.act || pref.textContent.trim().slice(0, 20)); }
          closeModal(); return 'pencere-kapat';
        }
        const ms = document.querySelector('#match');
        if (ms && !ms.hidden) { for (const sel of ['#mgTut:not([hidden]) [data-act="tutGo"]', '#mvSkip:not([hidden])', '#mvDone:not([hidden])', '#mvFast']) { const x = document.querySelector(sel); if (x && vis(x)) { x.click(); return 'sahne:' + sel; } } try { if (typeof MR !== 'undefined' && MR) MR.fast = true; } catch (e) { } return 'sahne'; }
        if (G && G.phase === 'tryout') { const s = document.querySelector('[data-act="trySkip"]'); if (s) { s.click(); return 'seçme-atla'; } const t = document.querySelector('[data-act="trySign"]'); if (t) { t.click(); return 'seçme-imza'; } }
        const y = G && G.s ? G.s.year : 0, d = G && G.s ? G.s.day : 0;
        try { fmCont(); } catch (e) { return 'devam-hata ' + e.message; }
        return 'gün ' + y + '/' + d;
      });
    } catch (e) { addErr('test: ' + e.message.split('\n')[0]); await p.waitForTimeout(500); continue; }
    if (st === 'maç') { matches++; await p.waitForTimeout(400); }
    if (typeof st === 'string' && st.startsWith('sahne')) { same = 0; scenes++; await p.waitForTimeout(250); continue; }
    const info = await p.evaluate(() => ({ y: G && G.s ? G.s.year : null, d: G && G.s ? G.s.day : null, ph: G && G.phase, mode: G && G.mode, club: G && G.club, fx: typeof FX !== 'undefined' && !!FX })).catch(() => ({}));
    if (y0 == null && info.y) y0 = info.y;
    const key = `${info.y}/${info.d}/${info.ph}/${info.fx}`;
    if (key === last) same++; else { same = 0; last = key; }
    if (same === 25) {
      stalls++; const what = await p.evaluate(() => { const v = document.querySelector('#view'); const c = v ? [...v.querySelectorAll('button.cta,[data-act].cta')].filter(x => x.offsetParent) : []; if (c[0]) { c[0].click(); return 'tıklandı: ' + (c[0].dataset.act || '') + ' ' + c[0].textContent.trim().slice(0, 40); } return 'tıklanacak düğme yok · ' + (v ? v.innerText.slice(0, 120).replace(/\s+/g, ' ') : ''); }).catch(e => e.message);
      const fxs = await p.evaluate(() => typeof FX !== 'undefined' && FX ? JSON.stringify({ ab: !!FX.ab, ph: FX.phase, half: FX.half, t: Math.round(FX.t || 0), sim: !!FX.__sim, ff: !!FX.ff, abff: window.ABM ? ABM.ff : null, abs: window.ABM ? !!ABM.sim : null, el: (document.querySelector('#fx') || {}).className, hid: (document.querySelector('#fx') || {}).hidden }) : '').catch(e => e.message);
      log.push(`takılma (${key}): ${what} ${fxs}`);
    }
    if (same > 120) { log.push('ilerleme yok, durduruldu: ' + key); break; }
    if (info.y && y0 && info.y - y0 >= SEASONS) break;
    if (it % 200 === 0) console.log(`  ${PROF} ${((Date.now() - t0) / 1000).toFixed(0)} sn · ${key} · maç ${matches} · hata ${errs.length}`);
    await p.waitForTimeout(st === 'maç' ? 300 : 30);
  }
  const fin = await p.evaluate(() => ({ y: G && G.s && G.s.year, d: G && G.s && G.s.day, ph: G && G.phase, mode: G && G.mode, club: G && G.club, name: G && G.p && G.p.name })).catch(() => ({}));
  const ok = errs.length === 0;
  const rep = { prof: PROF, ok, start: y0, end: fin, seasons: fin.y && y0 ? fin.y - y0 : 0, matches, stalls, sec: Math.round((Date.now() - t0) / 1000), errs, log: log.slice(0, 30) };
  if (REP) fs.writeFileSync(REP, JSON.stringify(rep, null, 1));
  console.log(`${ok ? 'TEMİZ' : 'HATA '} ${PROF} · ${y0}→${fin.y} (${rep.seasons} sezon) · maç ${matches} · takılma ${stalls} · ${rep.sec} sn`);
  for (const e of errs.slice(0, 12)) console.log('   ' + e);
  for (const l of log.slice(0, 8)) console.log('   · ' + l);
  await b.close();
  console.log(ok ? 'SIM_OK' : 'SIM_FAIL');
  process.exit(ok ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
