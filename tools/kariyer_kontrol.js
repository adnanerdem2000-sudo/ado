#!/usr/bin/env node
/* Seçilen oyuncuların oyundaki kariyer geçmişini, boyunu ve milli maçlarını yazdırır; istenirse profil ekran görüntüsü alır.
   Kullanım: node tools/kariyer_kontrol.js [--file oyun.html] [--shot dosya.png] "Lionel Messi" "Uğurcan Çakır" ... */
'use strict';
const path = require('path');
const pw = (() => { try { return require('playwright'); } catch (e) { return require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')); } })();
const args = process.argv.slice(2); let shot = null; const si = args.indexOf('--shot'); if (si >= 0) { shot = args[si + 1]; args.splice(si, 2); }
let FILE = path.resolve(__dirname, '../dist/futbol-kariyeri.html'); const fi = args.indexOf('--file'); if (fi >= 0) { FILE = path.resolve(args[fi + 1]); args.splice(fi, 2); }
(async () => {
  const b = await pw.chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.route(u => !/^(file|data|blob):/.test(u.protocol), r => r.abort());
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + FILE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof FMK !== 'undefined' && FMK.ready, null, { timeout: 20000 }).catch(() => errs.push('FMK hazır olmadı'));
  await page.evaluate(() => { G = null; Object.assign(W, { prof: 'td', fn: 'Test', ln: 'Hoca', age: 40, lvl: 'orta', lg: 'sl', club: 'samsunspor' }); wizGo(); });
  for (const name of args) {
    const out = await page.evaluate(name => {
      let key = null; for (const id in SQ_REAL) { const i = SQ_REAL[id].findIndex(r => r[0] === name); if (i >= 0) { key = id + '#' + i; break; } }
      if (!key && typeof adNorm === 'function') { const q = adNorm(name); for (const id in SQ_REAL) { const i = SQ_REAL[id].findIndex(r => adNorm(r[0]) === q); if (i >= 0) { key = id + '#' + i; break; } } }   /* v151: aksan farkı yok sayılır */
      if (!key) return { name, yok: 1 };
      const p = pByKey(key), C = careerOf(p), X = pHW(p), cl = id => { const c = clubObj(id); return c ? c.short || c.name : '?' + id; };
      return {
        name, key, forma: p.num, boy: X.h + (X.hq ? ' (tahmini)' : ''), kilo: X.w, milli: fmCaps(p), kaynak: C.fm ? 'FotMob' : C.real ? 'CARD' : C.none ? 'veri yok' : '?',
        sezon: C.rows.slice(0, 40).map(r => `${typeof krYL === 'function' ? krYL(r) : seasonLabel(r.y)} ${cl(r.cid)}${r.loan ? ' (k)' : ''} ${r.lgn || ''} ${r.ap}M ${r.g}G ${r.a}A ${r.rt ? (+r.rt).toFixed(2) : ''}`),
        transfer: C.tx.map(e => `${seasonLabel(e.y)} ${cl(e.from)} → ${cl(e.to)} ${e.loan ? 'kiralık' : e.ret ? 'dönüş' : e.free ? 'bonservissiz' : e.fee ? eur(e.fee) : 'bedel ?'}`),
      };
    }, name);
    console.log(JSON.stringify(out, null, 1));
  }
  if (shot && args[0]) {
    await page.evaluate(name => { for (const id in SQ_REAL) { const i = SQ_REAL[id].findIndex(r => r[0] === name); if (i >= 0) { showPCard(id, id + '#' + i); return; } } }, args[0]);
    await page.waitForTimeout(600);
    await page.evaluate(() => { const b = document.querySelector('[data-act="pfTab"][data-k="kr"],[data-act="fmpTab"][data-k="kr"]'); if (b) b.click(); });
    await page.waitForTimeout(600);
    await page.screenshot({ path: shot, fullPage: false });
    console.log('görüntü:', shot);
  }
  if (errs.length) console.log('HATALAR:', errs.slice(0, 5));
  await b.close();
})();
