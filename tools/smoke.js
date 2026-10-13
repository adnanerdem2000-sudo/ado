#!/usr/bin/env node
/* Duman testi: derlenmiş oyunu headless Chromium'da açar, her meslekte kariyer başlatır, "Devam" (fmCont) ile günleri ilerletir,
   sayfa hatalarını toplar. Dış ağ (Google Fonts) engellenir.
   Kullanım: node tools/smoke.js [--file dist/futbol-kariyeri.html] [--steps 12] [profil ...]
   Profiller: td oyuncu yrd scout dr sd bsk ref (varsayılan: hepsi). Hata yoksa son satır SMOKE_OK olur. */
'use strict';
const path = require('path'), fs = require('fs');
function loadPlaywright() {
  try { return require('playwright'); } catch (e) { }
  const g = require('child_process').execSync('npm root -g').toString().trim();
  return require(path.join(g, 'playwright'));
}
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const FILE = path.resolve(__dirname, '..', opt('--file', 'dist/futbol-kariyeri.html'));
const STEPS = +opt('--steps', 12);
const PROFILES = {
  td: { prof: 'td', fn: 'Test', ln: 'Hoca', age: 40, lvl: 'orta', lg: 'sl', club: 'samsunspor' },
  oyuncu: { prof: 'oyuncu', fn: 'Test', ln: 'Oyuncu', age: 12, lvl: 'sifir' },
  yrd: { prof: 'yrd', fn: 'Test', ln: 'Yardımcı', age: 32, lvl: 'orta' },
  scout: { prof: 'scout', fn: 'Test', ln: 'Gözlemci', age: 30, lvl: 'orta' },
  dr: { prof: 'dr', fn: 'Test', ln: 'Doktor', age: 34, lvl: 'orta' },
  sd: { prof: 'sd', fn: 'Test', ln: 'Direktör', age: 45, lvl: 'orta' },
  bsk: { prof: 'bsk', fn: 'Test', ln: 'Başkan', age: 55, lvl: 'orta' },
  ref: { prof: 'ref', fn: 'Test', ln: 'Hakem', age: 30, lvl: 'orta' },
};
const list = args.length ? args : Object.keys(PROFILES);
if (!fs.existsSync(FILE)) { console.error('Dosya yok: ' + FILE + ' (önce bash build.sh)'); process.exit(2); }

(async () => {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let bad = 0;
  for (const name of list) {
    const P = PROFILES[name]; if (!P) { console.log(`${name}: bilinmeyen profil`); bad++; continue; }
    const ctx = await browser.newContext({ viewport: { width: 412, height: 860 } });
    await ctx.route(u => !u.protocol.startsWith('file') && !u.protocol.startsWith('data') && !u.protocol.startsWith('blob') && !u.protocol.startsWith('about'), r => r.abort());
    const page = await ctx.newPage(), errs = [];
    page.on('pageerror', e => errs.push('pageerror: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' | ')));
    page.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|net::|Failed to load resource|permissions policy violation/.test(m.text())) errs.push('console: ' + m.text().slice(0, 300)); });
    const t0 = Date.now();
    await page.goto('file://' + FILE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    let info = null;
    try {
      await page.evaluate(P => { G = null; Object.assign(W, P); wizGo(); }, P);
      await page.waitForTimeout(400);
      for (let i = 0; i < STEPS; i++) {
        await page.evaluate(() => { try { if (!document.querySelector('#modal').hidden) closeModal(); } catch (e) { } fmCont(); });
        await page.waitForTimeout(150);
      }
      info = await page.evaluate(() => ({ mode: G && G.mode, phase: G && G.phase, club: G && G.club, day: G && G.s && G.s.day, year: G && G.s && G.s.year }));
    } catch (e) { errs.push('test: ' + e.message.split('\n')[0]); }
    const ok = errs.length === 0; if (!ok) bad++;
    console.log(`${ok ? 'TEMİZ' : 'HATA '} ${name.padEnd(7)} ${((Date.now() - t0) / 1000).toFixed(1)} sn  ${info ? JSON.stringify(info) : ''}`);
    for (const e of errs.slice(0, 8)) console.log('   ' + e);
    await ctx.close();
  }
  await browser.close();
  console.log(bad ? `SMOKE_FAIL (${bad} profil)` : 'SMOKE_OK');
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
