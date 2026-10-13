#!/usr/bin/env node
/* Derlenmiş oyundan kulüpleri ve gerçek kadroları dışa aktarır (FotMob eşlemesi için).
   Kullanım: node tools/veri/0_disa_aktar.js <çıktı.json> */
'use strict';
const path = require('path'), fs = require('fs');
const pw = (() => { try { return require('playwright'); } catch (e) { return require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')); } })();
(async () => {
  const b = await pw.chromium.launch(), ctx = await b.newContext();
  await ctx.route(u => !/^(file|data|blob):/.test(u.protocol), r => r.abort());
  const p = await ctx.newPage();
  await p.goto('file://' + path.resolve(__dirname, '../../dist/futbol-kariyeri.html'), { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(3000);
  const out = await p.evaluate(() => {
    const clubs = {}, ext = {};
    for (const [id, c] of Object.entries(CLUBS)) { const L = LEAGUES[c.league] || {}; clubs[id] = { name: c.name, short: c.short, lg: c.league, lgn: L.name, cc: L.cc, tier: L.tier, youth: !!L.youth, sq: SQ_REAL[id] ? SQ_REAL[id].map(r => [r[0], r[1], r[2], r[4]]) : null }; }
    for (const [id, c] of Object.entries(EXT)) ext[id] = { name: c.name, short: c.short, nat: c.nat };
    return { clubs, ext };
  });
  fs.writeFileSync(process.argv[2], JSON.stringify(out));
  console.log('kulüp', Object.keys(out.clubs).length, 'kadrolu', Object.values(out.clubs).filter(c => c.sq).length, 'EXT', Object.keys(out.ext).length);
  await b.close();
})();
