#!/usr/bin/env node
/* 3B maç testi: teknik direktör kariyeri açar, ilk maçı Adoball 3B yayın görünümünde başlatır, belirli aralıklarla ekran görüntüsü alır,
   sayfa/çerçeve hatalarını ve kare sürelerini toplar. Yazılım WebGL'de (SwiftShader) kare hızı gerçek cihazdan düşüktür.
   Kullanım: node tools/mac3b.js <çıktı klasörü> [--prof td|ref|oyuncu] [--sure saniye] [--kare n] [--hiz 1|2|4] [--kulup id] [--file oyun.html] */
'use strict';
const path = require('path'), fs = require('fs');
const pw = (() => { try { return require('playwright'); } catch (e) { return require(path.join(require('child_process').execSync('npm root -g').toString().trim(), 'playwright')); } })();
const A = process.argv.slice(2), opt = (k, d) => { const i = A.indexOf(k); return i < 0 ? d : A[i + 1]; };
const OUT = A[0] || '.', PROF = opt('--prof', 'td'), DUR = +opt('--sure', 40), SHOTS = +opt('--kare', 6), SPD = opt('--hiz', '2'), CLUB = opt('--kulup', 'galatasaray'), FILE = path.resolve(opt('--file', path.join(__dirname, '../dist/futbol-kariyeri.html')));
fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await pw.chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.route(u => !/^(file|data|blob|about):/.test(u.protocol), r => r.abort());
  const p = await ctx.newPage(), errs = [];
  p.on('pageerror', e => errs.push('sayfa: ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ')));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_FAILED|permissions policy/.test(m.text())) errs.push('konsol: ' + m.text().slice(0, 240)); });
  await p.goto('file://' + FILE);
  await p.waitForTimeout(1500);
  await p.evaluate(([prof, club]) => { localStorage.setItem('fx3d', '1'); G = null; Object.assign(W, { prof, fn: 'Test', ln: 'Kullanıcı', age: prof === 'oyuncu' ? 24 : 40, lvl: 'orta', lg: 'sl', club }); wizGo(); }, [PROF, CLUB]);
  for (let i = 0; i < 40; i++) { const fx = await p.evaluate(() => { const f = document.querySelector('#fx'); if (f && f.innerHTML) return 1; try { if (!document.querySelector('#modal').hidden) closeModal(); } catch (e) { } fmCont(); return 0; }); if (fx) break; await p.waitForTimeout(150); }
  await p.waitForFunction(() => window.ABM && ABM.ready, null, { timeout: 45000 }).catch(() => errs.push('ABM hazır olmadı'));
  await p.waitForTimeout(2500);
  const fr = p.frames().find(f => f !== p.mainFrame());
  if (!fr) { console.log('çerçeve yok', errs); await b.close(); return; }
  fr.on && 0;
  const clk = async sel => { try { await fr.click(sel, { timeout: 3000 }); return true; } catch (e) { return false; } };
  await clk('#v3-bcast'); await p.waitForTimeout(800);
  await clk('#btn-start-match'); await p.waitForTimeout(700);
  await fr.evaluate(() => { const b = [...document.querySelectorAll('button[data-ok]')].find(x => x.offsetParent && !/Onaylandı/.test(x.textContent)); if (b) b.click(); }); await p.waitForTimeout(500);
  await clk('#tac-go'); await p.waitForTimeout(1000);
  await clk('#speed-' + (SPD === '1' ? '1x' : SPD + 'x'));
  /* kare süresi ölçümü (çerçeve içinde) */
  await fr.evaluate(() => { window.__ft = []; let l = performance.now(); const f = t => { window.__ft.push(t - l); l = t; if (window.__ft.length < 100000) requestAnimationFrame(f); }; requestAnimationFrame(f); });
  for (let s = 0; s < SHOTS; s++) {
    await p.waitForTimeout(DUR * 1000 / SHOTS);
    const st = await fr.evaluate(() => { try { const s = window.ado2d && ado2d.state; return { dk: s && s.sim ? Math.floor((s.sim.t || 0) / 60) : null, mod: document.body.className.slice(0, 80) }; } catch (e) { return { e: e.message }; } });
    await p.screenshot({ path: path.join(OUT, `3b_${PROF}_${s}.png`) });
    console.log('kare', s, JSON.stringify(st));
  }
  const ft = await fr.evaluate(() => { const a = window.__ft.slice(5).sort((x, y) => x - y), n = a.length; return n ? { n, med: a[n >> 1].toFixed(1), p95: a[Math.floor(n * .95)].toFixed(1), max: a[n - 1].toFixed(1) } : null; });
  console.log('kare süreleri (ms):', JSON.stringify(ft));
  console.log(errs.length ? 'HATALAR:\n  ' + errs.slice(0, 15).join('\n  ') : 'hata yok');
  await b.close();
})();
