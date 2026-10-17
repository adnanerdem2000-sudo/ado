#!/usr/bin/env node
/* Toplu maç testi (Adoball motoru, görüntüsüz) + tanılama sayımları + regresyon denetimi.
   Derlenmiş oyunu headless Chromium'da açar, teknik direktör kariyeri başlatır, ilk lig maçını oyunun kendi yoluyla (fxStart → abSetup)
   Adoball çerçevesinde kurar; sonra her test maçı için oyunun TD fxStart'ıyla lig rakibine karşı (sırayla ev/deplasman) yeni maç kurulur. Maçın gerçek kurulum seçenekleri (kadro, taktik, duran top kullanıcıları, beyin tabanı) tanılama katmanının
   (006_adoball_tanilama.js, AdoTani) Sim2D.create sarmalamasından alınır; maç bu seçeneklerle, kendi tohumuyla Sim2D.create ile kurulup sonuna dek adım adım oynatılır (oyunun "Sonuna simüle et" yolu gibi: görüntü adımları yok).
   Kullanım:
     node tools/mac_test.js --mac N [--file dist/futbol-kariyeri.html] [--rapor x.json] [--devam] [--sure 100] [--tohum 1]
                           [--kulup galatasaray,fenerbahce,...] [--lig sl] [--oturum 6] [--det K] [--tani 0] [--veri parametreler.json]
     node tools/mac_test.js --ozet a.json[,b.json]       (rapor(lar)ı birleştirip tabloyu yazar; maç oynatmaz)
     node tools/mac_test.js --regresyon [--file …]      (başlat/duraklat/sürdür/hızlar/taktik/değişiklik/devre/gol sonrası santra/maç sonu/kaydet-yükle/menüler)
   --sure: bu çağrının süre bütçesi (sn, varsayılan 100; 0 = sınırsız). Bütçe dolunca yeni maç başlatmaz, raporu yazar; --devam kaldığı yerden sürer.
     Çok maç için arka planda: setsid nohup node tools/mac_test.js --mac 100 --sure 0 --rapor r.json > r.log 2>&1 &
   --det K: ilk K maçı tanılama kapalıyken de oynatıp olay akışı + durum özetini karşılaştırır (determinizm: AYNI olmalı).
   --oturum M: her M maçta bir yeni kariyer (sıradaki kulüp) — takım çeşitliliği.
   Son satır: MACTEST_OK (kritik tanılama kaydı, sayfa hatası, determinizm farkı yok) ya da MACTEST_HATA; süre bütçesi dolup maçlar
   bitmediyse (o ana dek hata yoksa) MACTEST_DEVAM (çıkış kodu 3). */
'use strict';
const path = require('path'), fs = require('fs');
function loadPlaywright() {
  try { return require('playwright'); } catch (e) { }
  const g = require('child_process').execSync('npm root -g').toString().trim();
  return require(path.join(g, 'playwright'));
}
const args = process.argv.slice(2);
const has = k => { const i = args.indexOf(k); if (i < 0) return false; args.splice(i, 1); return true; };
const opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const ROOT = path.resolve(__dirname, '..');
const FILE = path.resolve(ROOT, opt('--file', 'dist/futbol-kariyeri.html'));
const NMAC = +opt('--mac', 10), SURE = +opt('--sure', 100), TOH0 = +opt('--tohum', 1), OTURUM = +opt('--oturum', 6), DETK = +opt('--det', 0);
const TANI = opt('--tani', '1') !== '0', LIG = opt('--lig', 'sl');
const KULUP = opt('--kulup', 'galatasaray,fenerbahce,besiktas,trabzonspor,samsunspor,goztepe,basaksehir,kasimpasa').split(',');
const RAPOR = opt('--rapor', null), DEVAM = has('--devam'), REG = has('--regresyon'), OZET = opt('--ozet', null), VERI = opt('--veri', null);
const T0 = Date.now(), log = (...a) => console.log(((Date.now() - T0) / 1000).toFixed(0).padStart(4) + 's', ...a);
const left = () => SURE > 0 ? SURE - (Date.now() - T0) / 1000 : 1e9;

/* gerçek maç hedefleri (takım başına maç ortalaması ve maç başı standart sapma) — StatsBomb Open Data, 1401 maç (PL/Serie A/Ligue 1 2015/16 …);
   açık veri çalışmasının çıktısı parametreler.json varsa (--veri) oradan okunur */
const REAL0 = { kaynak: 'StatsBomb Open Data, 1401 maç (gömülü özet)', gol: 1.3, sut: 12.58, isabetliSut: 4.12, xg: 1.23, korner: 4.91, faul: 14.59, sari: 1.98, kirmizi: 0.12, ofsayt: 2.08, pas: 491.28, pasIsabet: 0.784, kurtaris: 2.95, tac: 22.09,
  sapma: { gol: 1.19, sut: 5.17, isabetliSut: 2.35, korner: 2.82, faul: 4.66, sari: 1.35 } };
function realTargets() {
  const cand = [VERI, path.join(ROOT, 'tools', 'veri', 'acik_parametreler.json')].filter(Boolean);
  for (const f of cand) { try { const j = JSON.parse(fs.readFileSync(f, 'utf8')); if (j.macBasi) return Object.assign({}, j.macBasi, { kaynak: (j.kaynaklar && j.kaynaklar[0] && j.kaynaklar[0].ad || 'açık veri') + ' (' + path.basename(f) + ')' }); } catch (e) { } }
  return REAL0;
}

/* ---------- özet tablo ---------- */
const KRITIK = new Set(['nan', 'saat_durdu', 'saat_geri', 'mac_bitmiyor', 'isinlanma_oyuncu', 'isinlanma_top', 'dis_skor', 'imkansiz_sahiplik', 'uzak_kazanim', 'sahipsiz_sahip', 'olu_topta_sahip', 'yinelenen_olay', 'skor_olay', 'ist_olay']);
function summarize(R) {
  const M = R.maclar.filter(m => m && m.st), n = M.length, out = [], tg = {};
  if (!n) { out.push('rapor boş'); return { text: out.join('\n'), ok: false }; }
  const S = k => M.reduce((a, m) => a + m.st[0][k] + m.st[1][k], 0);
  const goals = M.reduce((a, m) => a + m.skor[0] + m.skor[1], 0), xg = S('xg'), sh = S('shots'), sot = S('sot'), ps = S('passes'), pok = S('passOk');
  const per = v => (v / n / 2), sd = f => { const v = M.flatMap(m => [f(m, 0), f(m, 1)]), mu = v.reduce((a, b) => a + b, 0) / v.length; return Math.sqrt(v.reduce((a, b) => a + (b - mu) * (b - mu), 0) / Math.max(1, v.length - 1)); };
  const RT = realTargets();
  const row = (ad, val, real, rsd, fmt, sdv) => { const f = fmt || (x => x.toFixed(2)); let band = '-';
    if (real != null) { const tol = Math.max(rsd != null ? 2 * rsd / Math.sqrt(n * 2) : 0, Math.abs(real) * .15); band = Math.abs(val - real) <= tol ? 'bant içi' : (val > real ? 'YÜKSEK' : 'DÜŞÜK') + ` (±${f(tol)})`; }
    out.push(`  ${ad.padEnd(26)} ${f(val).padStart(8)}${sdv != null ? (' ±' + f(sdv)).padEnd(9) : ''.padEnd(9)} ${real != null ? f(real).padStart(8) : ''.padStart(8)} ${rsd != null ? ('±' + f(rsd)).padEnd(8) : ''.padEnd(8)} ${band}`); };
  out.push(`MAÇ İSTATİSTİKLERİ — ${n} maç (takım başına maç ortalaması; gerçek: ${RT.kaynak})`);
  out.push(`  ${'ölçü'.padEnd(26)} ${'motor'.padStart(8)}${'(sd)'.padEnd(9)} ${'gerçek'.padStart(8)} ${'(sd)'.padEnd(8)} karşılaştırma`);
  row('gol', per(goals), RT.gol, RT.sapma && RT.sapma.gol, null, sd((m, t) => m.skor[t]));
  row('şut', per(sh), RT.sut, RT.sapma && RT.sapma.sut, null, sd((m, t) => m.st[t].shots));
  row('isabetli şut', per(sot), RT.isabetliSut, RT.sapma && RT.sapma.isabetliSut, null, sd((m, t) => m.st[t].sot));
  row('xG', per(xg), RT.xg, null, null, sd((m, t) => m.st[t].xg));
  row('gol / xG', xg ? goals / xg : 0, RT.gol && RT.xg ? RT.gol / RT.xg : null, null);
  row('şut başına gol', sh ? goals / sh : 0, RT.gol / RT.sut, null, x => x.toFixed(3));
  row('pas', per(ps), RT.pas, null, x => x.toFixed(1), sd((m, t) => m.st[t].passes));
  row('pas isabeti', ps ? pok / ps : 0, RT.pasIsabet, null, x => (x * 100).toFixed(1) + '%');
  row('faul', per(S('fouls')), RT.faul, RT.sapma && RT.sapma.faul, null, sd((m, t) => m.st[t].fouls));
  row('sarı kart', per(S('yellow')), RT.sari, RT.sapma && RT.sapma.sari, null, sd((m, t) => m.st[t].yellow));
  row('kırmızı kart', per(S('red')), RT.kirmizi, null);
  row('korner', per(S('corners')), RT.korner, RT.sapma && RT.sapma.korner, null, sd((m, t) => m.st[t].corners));
  row('ofsayt', per(S('offsides')), RT.ofsayt, null);
  row('taç', per(S('throwins')), RT.tac, null);
  row('kurtarış', per(S('saves')), RT.kurtaris, null);
  const pos = M.map(m => { const a = m.st[0].poss, b = m.st[1].poss; return a + b ? 100 * a / (a + b) : 50; });
  row('top hâkimiyeti (ev %)', pos.reduce((a, b) => a + b, 0) / n, 50, null, x => x.toFixed(1), Math.sqrt(pos.reduce((a, b) => a + (b - 50) * (b - 50), 0) / n));
  const gd = {}; for (const m of M) { const g = Math.min(7, m.skor[0] + m.skor[1]); gd[g] = (gd[g] || 0) + 1; }
  out.push('  maç toplam gol dağılımı: ' + Object.keys(gd).sort().map(k => `${k}${k === '7' ? '+' : ''}:${(100 * gd[k] / n).toFixed(0)}%`).join(' ') + (RT.macToplamGolDagilimi ? '  (gerçek: ' + Object.keys(RT.macToplamGolDagilimi).slice(0, 8).map(k => `${k}:${(100 * RT.macToplamGolDagilimi[k]).toFixed(0)}%`).join(' ') + ')' : ''));
  const W = M.reduce((a, m) => a + (m.skor[0] > m.skor[1] ? 1 : 0), 0), Dw = M.reduce((a, m) => a + (m.skor[0] === m.skor[1] ? 1 : 0), 0);
  out.push(`  ev sahibi galibiyet/beraberlik/yenilgi: ${(100 * W / n).toFixed(0)}% / ${(100 * Dw / n).toFixed(0)}% / ${(100 * (n - W - Dw) / n).toFixed(0)}%`);
  /* tanılama */
  const tot = {}, mc = {}; for (const m of M) for (const [k, v] of Object.entries(m.tani && m.tani.sayim || {})) { tot[k] = (tot[k] || 0) + v; mc[k] = (mc[k] || 0) + 1; }
  out.push(`TANILAMA — ${M.filter(m => m.tani).length} maç tanılamalı`);
  const ks = Object.keys(tot).sort((a, b) => (KRITIK.has(b) - KRITIK.has(a)) || tot[b] - tot[a]);
  if (!ks.length) out.push('  kayıt yok');
  for (const k of ks) out.push(`  ${(KRITIK.has(k) ? 'KRİTİK ' : k === 'reset' || k === 'ist_bilgi' || k === 'tani_hata' ? 'bilgi  ' : 'uyarı  ') + k.padEnd(22)} ${String(tot[k]).padStart(6)} kayıt · ${mc[k]}/${n} maçta · maç başı ${(tot[k] / n).toFixed(2)}`);
  const det = M.filter(m => m.det); const detBad = det.filter(m => m.det.sonuc !== 'AYNI');
  if (det.length) out.push(`DETERMİNİZM (tanılama açık ↔ kapalı, aynı tohum): ${det.length} maç, ${detBad.length ? 'FARK ' + detBad.length : 'hepsi AYNI'} · tanılama ek süresi (yük altında gürültülü) ort. ${(det.reduce((a, m) => a + (m.sure_sn - m.det.sure_sn), 0) / det.length).toFixed(2)} sn/maç (${(100 * det.reduce((a, m) => a + m.sure_sn, 0) / Math.max(1e-9, det.reduce((a, m) => a + m.det.sure_sn, 0)) - 100).toFixed(1)}%)`);
  const errs = (R.hatalar || []);
  if (errs.length) { out.push('SAYFA HATALARI: ' + errs.length); for (const e of errs.slice(0, 6)) out.push('  ' + e); }
  const kr = ks.filter(k => KRITIK.has(k)).reduce((a, k) => a + tot[k], 0);
  out.push(`süre: ort. ${(M.reduce((a, m) => a + m.sure_sn, 0) / n).toFixed(1)} sn/maç · ${n}/${R.hedef || n} maç tamam`);
  return { text: out.join('\n'), ok: kr === 0 && !errs.length && !detBad.length && n > 0, kritik: kr };
}

/* ---------- tarayıcı yardımcıları ---------- */
async function newPage(browser, errs) {
  const ctx = await browser.newContext({ viewport: { width: 960, height: 600 } });
  await ctx.route(u => !/^(file|data|blob|about):/.test(u.protocol), r => r.abort());
  await ctx.addInitScript(() => { try { localStorage.setItem('adoTani', '1'); } catch (e) { } });      // seçenekleri almak için tanılama her zaman yüklenir; --tani 0'da maçlar sarmalanmamış create ile kurulur
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('sayfa: ' + (e.stack || e.message).split('\n').slice(0, 2).join(' | ').slice(0, 300)));
  page.on('console', m => { const t = m.text(); if (m.type() === 'error' && !/ERR_FAILED|net::|Failed to load resource|permissions policy|AudioContext|WebGL|GPU|swiftshader/i.test(t)) errs.push('konsol: ' + t.slice(0, 240)); });
  return { ctx, page };
}
async function openCareerMatch(page, club) {
  await page.goto('file://' + FILE, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await page.evaluate(([c, lg]) => { G = null; Object.assign(W, { prof: 'td', fn: 'Test', ln: 'Hoca', age: 40, lvl: 'orta', lg, club: c }); wizGo(); }, [club, LIG]);
  await page.waitForTimeout(300);
  for (let i = 0; i < 700; i++) {
    const r = await page.evaluate(() => {
      if (typeof FX !== 'undefined' && FX && FX.ab) return 'fx';
      try { if (!document.querySelector('#modal').hidden) { const bs = [...document.querySelectorAll('#modalCard button[data-act]')].filter(x => x.offsetParent && x.dataset.act !== 'closeModal'); if (bs[0]) bs[0].click(); else closeModal(); return 'modal'; } } catch (e) { }
      const host = document.createElement('div'); host.innerHTML = viewHub(); const c = host.querySelector('.cta[data-act]'); const a = c && c.dataset.act;
      if (a === 'play' || a === 'mgrPlay') { v165Click(a); return 'start'; }
      fmCont(); return 'cont';
    });
    if (r === 'fx') break;
    await page.waitForTimeout(r === 'cont' ? 60 : 150);
  }
  await page.waitForFunction(() => window.ABM && ABM.ready && ABM.win && ABM.win.ado2d && ABM.win.ado2d.sim() && ABM.win.AdoTani && ABM.win.AdoTani.lastOpts(), null, { timeout: 60000 });
  const fr = page.frames().find(f => f !== page.mainFrame());
  const info = await fr.evaluate(() => { const o = AdoTani.lastOpts(); window.__mtBase = JSON.stringify(o); return { names: o.names, seed: o.seed }; });
  return { fr, info };
}
/* lig rakibiyle yeni maç kur (oyunun TD fxStart'ı → abSetup → 005 prepare); ilk açılan maç çoğunlukla hazırlık maçıdır (alt lig rakibi) */
async function setupLeagueMatch(page, fr, j) {
  const r = await page.evaluate(j => {
    const lg = [...new Set((G.s.fixtures || []).flat(2))].filter(c => c !== G.club && CLUBS[c]); if (!lg.length) return { yok: true };
    const opp = lg[Math.floor(j / 2) % lg.length], usHome = j % 2 === 0;
    try { cancelAnimationFrame(ABM.raf); ABM.raf = 0; ABM.win.ado2d.state.running = false; } catch (e) { }
    ABM.fx = null; FX = null; try { ABM.win.AdoTani.state.lastOpts = null; } catch (e) { }
    fxStart({ opp: CLUBS[opp], usHome, neutral: false, onEnd: () => { } });
    return { opp, usHome, n: lg.length };
  }, j);
  if (r.yok) throw new Error('lig fikstürü yok');
  await page.waitForFunction(() => { try { const o = ABM.win.AdoTani.lastOpts(); return ABM.fx && FX === ABM.fx && ABM.win.ado2d.sim() && !!o; } catch (e) { return false; } }, null, { timeout: 30000 });
  const info = await fr.evaluate(() => { const o = AdoTani.lastOpts(); window.__mtBase = JSON.stringify(o); return { names: o.names }; });
  await page.evaluate(() => { try { cancelAnimationFrame(ABM.raf); ABM.raf = 0; } catch (e) { } });
  return Object.assign(r, info);
}
/* sayfa içi: bir maçı kur (tohum, yer değiştirme, tanılama) ve parça parça oynat */
const PAGE_RUN = ({ seed, swap, tani, ms }) => {
  const H = window.__mt;
  if (!H || H.seed !== seed || H.tani !== tani || H.done) {
    const o = JSON.parse(window.__mtBase); o.seed = seed;
    if (swap) for (const k of ['names', 'roster', 'takers', 'homes', 'tactics', 'strength']) if (Array.isArray(o[k]) && o[k].length === 2) o[k] = [o[k][1], o[k][0]];
    const mk = tani ? Sim2D.create : AdoTani.create0();
    const t0 = performance.now(), sim = mk(o);
    window.__mt = { seed, tani, sim, k: 0, h1: 0x811c9dc5, h2: 0x01000193 ^ 0x5bd1e995, ms: 0, t0, names: o.names, done: false, ne: 0 };
  }
  const M = window.__mt, sim = M.sim, t1 = performance.now();
  const fnv = s => { let a = M.h1, b = M.h2; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a ^= c; a = Math.imul(a, 16777619) >>> 0; b ^= c; b = Math.imul(b ^ (b >>> 13), 0x5bd1e995) >>> 0; } M.h1 = a; M.h2 = b; };
  while (!sim.finished && M.k < 140000 && performance.now() - t1 < ms) {
    for (let i = 0; i < 50 && !sim.finished; i++) { sim.step(); M.k++; if (M.k % 250 === 0) fnv(JSON.stringify([sim.ball.x, sim.ball.y, sim.ball.z, sim.players.map(p => [p.x, p.y, p.vx, p.vy, p.stam])])); }
  }
  M.ms += performance.now() - t1;
  if (!sim.finished && M.k < 140000) return { bitti: false, k: M.k, dk: Math.floor(sim.t * sim.C.CK / 60) };
  for (let i = M.ne; i < sim.events.length; i++) { const e = sim.events[i]; fnv(JSON.stringify([e.id, e.type, e.t, e.team, e.p, e.p2, e.x, e.y, e.meta])); }
  fnv(JSON.stringify([sim.teams.map(t => [t.score, t.st]), sim.players.map(p => [p.x, p.y, p.vx, p.vy, p.stam])]));
  M.done = true;
  const st = sim.teams.map(t => { const s = t.st; return { shots: s.shots, sot: s.sot, xg: +s.xg.toFixed(4), passes: s.passes, passOk: s.passOk, fouls: s.fouls, yellow: s.yellow, red: s.red, corners: s.corners, offsides: s.offsides, throwins: s.throwins, saves: s.saves, poss: +s.poss.toFixed(2), tackles: s.tackles, inter: s.inter }; });
  const ty = {}; for (const e of sim.events) ty[e.type] = (ty[e.type] || 0) + 1;
  const pen = sim.events.filter(e => e.type === 'GOAL' && e.meta && e.meta.pen).length, own = sim.events.filter(e => e.type === 'GOAL' && e.meta && e.meta.own).length;
  let td = null;
  if (M.tani) { const D = AdoTani.state.list.find(x => x.sim === sim); if (D) { const ilk = {}; for (const k in D.first) ilk[k] = D.first[k].slice(0, 3); td = { sayim: D.count, ilk, son: D.end, adim: D.steps }; AdoTani.detach(D); AdoTani.state.list.splice(AdoTani.state.list.indexOf(D), 1); } }
  return { bitti: true, k: M.k, md5: (M.h1 >>> 0).toString(16).padStart(8, '0') + (M.h2 >>> 0).toString(16).padStart(8, '0'), skor: [sim.teams[0].score, sim.teams[1].score], st, olay: ty, pen, own, names: M.names, sure_sn: +(M.ms / 1000).toFixed(2), tani: td, t: +sim.t.toFixed(2) };
};
async function playOne(fr, seed, swap, tani) {
  for (; ;) {
    const r = await fr.evaluate(PAGE_RUN, { seed, swap, tani, ms: 4000 });
    if (r.bitti) return r;
  }
}

/* ---------- toplu maç ---------- */
async function runBatch() {
  if (!fs.existsSync(FILE)) { console.error('Dosya yok: ' + FILE + ' (önce bash build.sh)'); process.exit(2); }
  let R = { surum: 1, dosya: path.relative(ROOT, FILE), hedef: NMAC, basla: new Date().toISOString(), maclar: [], hatalar: [] };
  if (DEVAM && RAPOR && fs.existsSync(RAPOR)) { R = JSON.parse(fs.readFileSync(RAPOR, 'utf8')); R.hedef = NMAC; log('devam:', R.maclar.length, 'maç kayıtlı'); }
  const write = () => { if (RAPOR) fs.writeFileSync(RAPOR, JSON.stringify(R, null, 1)); };
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let sess = null, sessIdx = -1;
  try {
    while (R.maclar.length < NMAC) {
      const i = R.maclar.length, want = Math.floor(i / OTURUM);
      if (left() < 25) { log('süre bütçesi doldu; --devam ile sürdür'); break; }
      if (!sess || sessIdx !== want) {
        if (sess) await sess.ctx.close();
        const club = KULUP[want % KULUP.length], errs = [];
        const t = Date.now(); const pg = await newPage(browser, errs);
        try { const m = await openCareerMatch(pg.page, club); sess = Object.assign(pg, m, { errs, club }); sessIdx = want; log(`oturum ${want}: ${club} · ${m.info.names.join(' – ')} · kurulum ${((Date.now() - t) / 1000).toFixed(1)} sn`); }
        catch (e) { R.hatalar.push('kurulum (' + club + '): ' + e.message.split('\n')[0]); write(); await pg.ctx.close(); sess = null; sessIdx = want; R.maclar.push({ no: i + 1, hata: 'kurulum' }); continue; }
      }
      const seed = (TOH0 * 7919 + i * 104729) >>> 0, swap = false;
      try { await setupLeagueMatch(sess.page, sess.fr, i - want * OTURUM + TOH0 * 3); } catch (e) { R.hatalar.push('lig maçı kurulumu ' + (i + 1) + ': ' + e.message.split('\n')[0]); R.maclar.push({ no: i + 1, hata: 'kurulum' }); write(); sess = null; continue; }
      if (left() < 15) break;
      let r;
      let pre = null;
      if (i < DETK && i % 2 === 1) pre = await playOne(sess.fr, seed, swap, !TANI).catch(() => null);      // ek süre ölçümü yük altında gürültülü: sıra her maçta değişir
      try { r = await playOne(sess.fr, seed, swap, TANI); }
      catch (e) { R.hatalar.push('maç ' + (i + 1) + ': ' + e.message.split('\n')[0]); R.maclar.push({ no: i + 1, hata: 'oynatma' }); write(); sess = null; continue; }
      const m = Object.assign({ no: i + 1, tohum: seed, yer_degisti: swap, kulup: sess.club }, r);
      if (i < DETK) { const b = pre || await playOne(sess.fr, seed, swap, !TANI); m.det = { sonuc: b.md5 === r.md5 ? 'AYNI' : 'FARKLI', md5_diger: b.md5, sure_sn: b.sure_sn, skor: b.skor }; if (!TANI) { const s = m.sure_sn; m.sure_sn = b.sure_sn; m.det.sure_sn = s; } }
      R.maclar.push(m);
      for (const e of sess.errs.splice(0)) R.hatalar.push(e);
      write();
      const tk = m.tani ? Object.entries(m.tani.sayim).filter(([k]) => k !== 'reset').map(([k, v]) => k + ':' + v).join(' ') : '-';
      log(`maç ${i + 1}/${NMAC} ${m.names[0]} ${m.skor[0]}-${m.skor[1]} ${m.names[1]} · şut ${m.st[0].shots}-${m.st[1].shots} xG ${m.st[0].xg.toFixed(2)}-${m.st[1].xg.toFixed(2)} · ${m.sure_sn} sn${m.det ? ' · det ' + m.det.sonuc : ''} · tanılama ${tk || 'temiz'}`);
    }
  } finally { try { if (sess) await sess.ctx.close(); } catch (e) { } await browser.close(); }
  R.bitis = new Date().toISOString(); write();
  const S = summarize(R); console.log(S.text);
  if (R.maclar.length < NMAC && S.ok) { console.log(`MACTEST_DEVAM ${R.maclar.length}/${NMAC} — sürdürmek için: node tools/mac_test.js --mac ${NMAC} --rapor ${RAPOR || 'x.json'} --devam`); process.exit(3); }      // bütçe doldu, şimdiye dek hata yok
  console.log(S.ok ? 'MACTEST_OK' : 'MACTEST_HATA');
  process.exit(S.ok ? 0 : 1);
}

/* ---------- regresyon ---------- */
async function runRegresyon() {
  if (!fs.existsSync(FILE)) { console.error('Dosya yok: ' + FILE); process.exit(2); }
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [], res = [];
  const ok = (ad, durum, ayr) => { res.push({ ad, durum, ayr }); log(`${durum.padEnd(15)} ${ad}${ayr ? ' — ' + ayr : ''}`); };
  const pg = await newPage(browser, errs), page = pg.page;
  const W = (fn, a) => fr.evaluate(fn, a);
  let fr;
  try {
    const t = Date.now(); const m = await openCareerMatch(page, KULUP[0]); fr = m.fr;
    ok('maç ekranı açılışı', 'TAMAM', `${m.info.names.join(' – ')} · ${((Date.now() - t) / 1000).toFixed(1)} sn`);
    await fr.waitForFunction(() => { const d = document.getElementById('ado-tani'); return d && /Tanılama/.test(d.innerText); }, null, { timeout: 5000 }).catch(() => { });
    const ov = await W(() => { const d = document.getElementById('ado-tani'); return { on: !!(window.AdoTani && AdoTani.state.on), ov: !!d, txt: d ? d.innerText.slice(0, 60) : '', bagli: AdoTani.state.list.length }; });
    ok('tanılama kaplaması (localStorage.adoTani=1)', ov.on && ov.ov && /Tanılama/.test(ov.txt) ? 'TAMAM' : 'HATA', `açık ${ov.on}, kaplama ${ov.ov ? JSON.stringify(ov.txt) : 'YOK'}, izlenen maç ${ov.bagli}`);
    const simT = () => W(() => { const s = ado2d.sim(); return { t: s.t, half: s.half, fin: s.finished, hold: ado2d.state.hold, run: ado2d.state.running, sc: [s.teams[0].score, s.teams[1].score], ev: s.events.length }; });
    /* başlat */
    let a = await simT(); await W(() => startMatch()); await page.waitForTimeout(2500); let b = await simT();
    ok('başlat', b.t > a.t ? 'TAMAM' : 'HATA', `sim.t ${a.t.toFixed(2)} → ${b.t.toFixed(2)} (2,5 sn)`);
    /* duraklat / sürdür */
    await W(() => pauseMatch()); await page.waitForTimeout(300); a = await simT(); await page.waitForTimeout(1500); b = await simT();
    ok('duraklat', Math.abs(b.t - a.t) < 1e-9 && !b.run ? 'TAMAM' : 'HATA', `duraklatıldıktan sonra 1,5 sn: Δt ${(b.t - a.t).toFixed(3)}`);
    await W(() => startMatch()); await page.waitForTimeout(2000); const c = await simT();
    ok('sürdür', c.t > b.t ? 'TAMAM' : 'HATA', `Δt ${(c.t - b.t).toFixed(2)} (2 sn)`);
    /* hızlar: düğme durumu (preset/speed) kesin denetim; gerçek zamanlı akış hızı bilgi amaçlı (yük altında ve akıllı tempoyla oynar) */
    const rates = {}, sp = {};
    for (const s of [1, 2, 4]) { await W(v => setMatchSpeed(v), s); await page.waitForTimeout(500); const x = await simT(), tt = Date.now(); await page.waitForTimeout(2000); const y = await simT(); rates[s] = (y.t - x.t) / ((Date.now() - tt) / 1000); sp[s] = await W(() => ({ preset: ado2d.state.preset, speed: ado2d.state.speed })); sp[s].hold = y.hold || '-'; }
    const spOk = [1, 2, 4].every(s => +sp[s].preset === s) && sp[2].speed > sp[1].speed && sp[4].speed > sp[2].speed;
    ok('hızlar (1x/2x/4x)', spOk ? 'TAMAM' : 'HATA', `hız çarpanı ${sp[1].speed}/${sp[2].speed}/${sp[4].speed}; ölçülen sim sn / gerçek sn (bilgi; yük ve akıllı tempoya bağlı): 1x ${rates[1].toFixed(2)} · 2x ${rates[2].toFixed(2)} · 4x ${rates[4].toFixed(2)} (bekleme: ${sp[1].hold}/${sp[2].hold}/${sp[4].hold})`);
    await W(() => setMatchSpeed(1));
    /* taktik değişikliği (kullanıcının takımı: motor takımı ABM.s0'a göre) */
    const tac = await page.evaluate(() => { const W = ABM.win, sim = ABM.sim, e = abS2E(0); const t0 = sim.tactics(e).ment; W.ado2d.tac.set(e, 'ment', t0 === 1 ? -1 : 1); const t1 = sim.tactics(e).ment; W.ado2d.tac.set(e, 'ment', t0); return { e, t0, t1, t2: sim.tactics(e).ment }; });
    ok('taktik değişikliği', tac.t1 !== tac.t0 && tac.t2 === tac.t0 ? 'TAMAM' : 'HATA', `mentalite ${tac.t0} → ${tac.t1} → ${tac.t2} (sim.setTactics)`);
    /* oyuncu değişikliği (oyunun fxSub yolu → abSubEng → sim.sub) */
    const sub = await page.evaluate(() => { const S = FX, T = S.U, sim = ABM.sim; const out = T.P.find(p => !p.off && p.spos !== 'KL' && p.ei != null), inP = (T.bench || [])[0]; if (!out || !inP) return { yok: true };
      const n0 = sim.events.length, ei = out.ei, r = fxSub(T, out, inP); const sv = sim.events.slice(n0).find(e => e.type === 'SUB');
      return { r, ei, ad: sim.players[ei].name, giren: inP.name, sub: !!sv }; });
    ok('oyuncu değişikliği', sub.yok ? 'TEST EDİLMEDİ' : sub.r && sub.sub && sub.ad === sub.giren ? 'TAMAM' : 'HATA', sub.yok ? 'yedek yok' : `fxSub → SUB olayı ${sub.sub ? 'var' : 'YOK'}; motorda yuva ${sub.ei}: ${sub.ad} (giren ${sub.giren})`);
    /* devre arası: ilk yarı sonuna 20 sn kalana dek motor parça parça eşzamanlı ilerletilir; arada gol/VAR/kart sahnesi (S.hold) açılırsa görüntü akışı
       kendi kapatsın diye beklenir. Son 20 sn, devre arası ekranı ve ikinci yarı gerçek akışla (oyunun yolu). */
    for (let g = 0; g < 400; g++) {
      const q = await W(() => { const s = ado2d.sim(), st = ado2d.state, H = s.C.HALF_S - 20; if (st.hold) { if (st.hold === 'replay') try { ado2d.skipReplay(); } catch (e) { } return 'hold:' + st.hold; } let n = 0; while (s.t < H && !s.finished && !st.hold && n < 400) { s.step(); n++; } return s.t >= H ? 'tamam' : 'devam'; });
      if (q === 'tamam') break; if (q.startsWith('hold')) { await W(() => { try { if (ado2d.state.vs) ado2d.varSkip(); } catch (e) { } }); await page.waitForTimeout(400); }
    }
    await W(() => setMatchSpeed(4));
    let h = null; const th = Date.now();
    while (Date.now() - th < 40000) { h = await simT(); if (h.hold === 'half' || h.half === 2) break; await page.evaluate(() => { try { if (!document.querySelector('#modal').hidden) closeModal(); } catch (e) { } }); await W(() => { try { if (ado2d.state.vs) ado2d.varSkip(); if (ado2d.state.hold === 'replay') ado2d.skipReplay(); } catch (e) { } }); await page.waitForTimeout(400); }
    if (h && (h.hold === 'half' || h.half === 2)) {
      const h0 = h; let h2 = h, pressed = false; const t2 = Date.now();
      while (Date.now() - t2 < 20000) { await page.evaluate(() => { try { if (!document.querySelector('#modal').hidden) closeModal(); } catch (e) { } }); h2 = await simT();
        if (h2.hold === 'half' && Date.now() - t2 > 1000) { await W(() => startSecondHalf()); pressed = true; }
        if (h2.half === 2 && h2.t > h0.t + 1) break; await page.waitForTimeout(500); }
      ok('devre arası → ikinci yarı', h2.half === 2 && h2.t > h0.t + 1 ? 'TAMAM' : 'HATA', `devre arası: hold ${h0.hold}, t ${h0.t.toFixed(1)}; ${pressed ? 'ikinci yarı düğmesi' : 'otomatik geçiş'} → yarı ${h2.half}, t ${h2.t.toFixed(1)}, hold ${h2.hold}`);
    } else ok('devre arası → ikinci yarı', 'HATA', `devre arası ekranına geçilmedi (t ${h && h.t.toFixed(1)}, hold ${h && h.hold})`);
    const tr = await W(() => { const D = AdoTani.cur(); return D ? D.count : null; });
    ok('canlı maçta tanılama sayımı (bilgi)', 'TAMAM', JSON.stringify(tr));
    /* maç sonu: oyunun "sonuna simüle et" yolu (ABM.syncRun) → abFullTime → fxClose → G.s.results */
    const n0 = await page.evaluate(() => { try { const o = FX.o, f0 = o.onEnd; o.onEnd = function (gu, go) { window.__mtEnd = [gu, go]; return f0 && f0.apply(this, arguments); }; } catch (e) { } return G.s.results.length; });
    let fin = null; const tf = Date.now();
    while (Date.now() - tf < 50000) { fin = await page.evaluate(() => { try { if (!document.querySelector('#modal').hidden) closeModal(); } catch (e) { } return ABM.syncRun ? ABM.syncRun(3000) : 'yok'; }); if (fin !== 'abrun' && fin !== 'abpause' && fin !== 'abwait') break; if (fin === 'abpause') await page.evaluate(() => { try { if (FX && FX.phase === 'pause') { FX.phase = 'play'; } } catch (e) { } }); }
    await page.waitForTimeout(1200);
    const sumBtn = await W(() => { const b = document.getElementById('summary-continue-btn'); if (b && b.offsetParent !== null) { b.click(); return true; } return false; }).catch(() => 'çerçeve kapandı');      // maç özeti → "Devam" (kullanıcının düğmesi)
    await page.waitForTimeout(1500);
    const end = await page.evaluate(n0 => { const sim = ABM.sim || (ABM.win && ABM.win.ado2d.sim()); const ev = sim ? sim.events : [];
      const rd = G.s.results[n0]; const f = rd && rd.find(r => r[0] === G.club || r[1] === G.club);
      const goals = ev.filter(e => e.type === 'GOAL'); const ko = goals.map(g => { const n = ev.find(e => e.id > g.id && (e.type === 'PASS' || e.type === 'CLEAR')); return n ? { tag: n.meta && n.meta.tag, x: +n.x.toFixed(1), y: +n.y.toFixed(1), takim: n.team, golcuTakim: g.team } : null; });
      const us = sim ? [sim.teams[abS2E(0)].score, sim.teams[abS2E(1)].score] : null;
      return { sk: sim ? [sim.teams[0].score, sim.teams[1].score] : null, us, onEnd: window.__mtEnd || null, fin: sim && sim.finished, res: f || null, fx: typeof FX !== 'undefined' && !!FX, ko }; }, n0);
    const endOk = end.onEnd && end.us && end.onEnd[0] === end.us[0] && end.onEnd[1] === end.us[1], resOk = !end.res || (end.res[2] === end.sk[0] && end.res[3] === end.sk[1]);
    ok('maç sonu (sonuna simüle et → oyuna sonuç)', end.fin && endOk && resOk && !end.fx ? 'TAMAM' : 'HATA', `syncRun: ${fin}; motor (biz-rakip) ${end.us && end.us.join('-')} · oyunun onEnd sonucu ${end.onEnd ? end.onEnd.join('-') : 'YOK'} · özet Devam düğmesi ${sumBtn} · FX ${end.fx ? 'açık kaldı' : 'kapandı'} · lig sonuç kaydı ${end.res ? end.res.slice(0, 4).join(' ') : '(lig maçı değil: hazırlık maçı)'}`);
    if (end.ko.length) { const bad = end.ko.filter(k => !k || k.tag !== 'KICKOFF' || Math.abs(k.x - 52.5) > 3 || Math.abs(k.y - 34) > 3 || k.takim === k.golcuTakim);
      ok('gol sonrası santra', bad.length ? 'HATA' : 'TAMAM', `${end.ko.length} gol: gol sonrası ilk vuruş ${end.ko.map(k => k ? k.tag + '@' + k.x + ',' + k.y : '?').join(' · ')}`); }
    else ok('gol sonrası santra', 'TEST EDİLMEDİ', 'bu maçta gol olmadı');
    /* kaydet-yükle */
    const sv = await page.evaluate(() => { save(); try { if (typeof svFlushSync === 'function') svFlushSync(); } catch (e) { } return { ham: (localStorage.getItem(SLOT_PRE + G.sid) || '').length, sid: G.sid, day: G.s.day, res: G.s.results.length, club: G.club, ad: G.p && G.p.name }; });
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.waitForTimeout(3000);
    const ld = await page.evaluate(sid => { const g = slotLoad(sid); if (!g) { const o = { yuklenemedi: true }; try { const raw = localStorage.getItem(SLOT_PRE + sid); o.ham = raw ? raw.length : 0; const pg = raw ? svParse(raw) : null; o.cozuldu = !!pg; if (pg && typeof kvGecerli === 'function') o.gecersiz = kvGecerli(pg) || null; } catch (e) { o.hata = e.message; } return o; } const r = { day: g.s.day, res: g.s.results.length, club: g.club, ad: g.p && g.p.name }; try { G = g; TAB = 'hub'; render(); r.render = true; } catch (e) { r.render = 'HATA ' + e.message; } return r; }, sv.sid);
    ok('kaydet-yükle', ld && ld.day === sv.day && ld.res === sv.res && ld.club === sv.club && ld.render === true ? 'TAMAM' : 'HATA', `kayıt ${JSON.stringify(sv)} → yeniden yükleme sonrası ${JSON.stringify(ld)}`);
    /* menüler (sekmeler) */
    const tabs = await page.evaluate(() => { const out = []; let ts = [...new Set([...document.querySelectorAll('#tabsIn [data-act="tab"][data-tab]')].map(b => b.dataset.tab))];
      if (!ts.length) ts = G && G.mode === 'mgr' ? ['hub', 'squad', 'league', 'board', 'inbox', 'career', 'life'] : ['hub', 'league', 'inbox', 'career'];      // sekme çubuğu çizilmemişse 013 render'ın TD sekmeleri
      for (const t of ts) { try { const b = document.querySelector('#tabsIn [data-tab="' + t + '"]'); if (b) b.click(); else { TAB = t; render(); } const v = document.querySelector('#view'); out.push([t, v ? v.innerText.length : -1]); } catch (e) { out.push([t, 'HATA ' + e.message]); } }
      try { TAB = 'hub'; render(); } catch (e) { } return out; });
    const tb = tabs.filter(x => typeof x[1] !== 'number' || x[1] < 20);
    ok('menüler (sekmeler)', tabs.length && !tb.length ? 'TAMAM' : tabs.length ? 'HATA' : 'TEST EDİLMEDİ', `${tabs.length} sekme: ${tabs.map(x => x[0]).join(', ')}${tb.length ? ' · sorunlu ' + JSON.stringify(tb) : ''}`);
  } catch (e) { ok('regresyon akışı', 'HATA', e.message.split('\n')[0]); }
  for (const x of ['3B animasyon/IK görsel kalitesi (göz)', 'ses', 'dokunmatik/mobil düzen', 'tam ekran', 'tekrar (replay) görüntüsü', 'hakem kariyeri karar pencereleri', 'oyuncu kariyeri kritik an modu'])
    ok(x, 'TEST EDİLMEDİ', 'otomatikleştirilmedi');
  if (errs.length) { ok('sayfa hataları', 'HATA', errs.length + ' hata'); for (const e of errs.slice(0, 8)) console.log('   ' + e); }
  await browser.close();
  if (RAPOR) fs.writeFileSync(RAPOR, JSON.stringify({ regresyon: res, hatalar: errs }, null, 1));
  const bad = res.filter(r => r.durum === 'HATA').length;
  console.log(`REGRESYON: ${res.filter(r => r.durum === 'TAMAM').length} tamam · ${bad} hata · ${res.filter(r => r.durum === 'TEST EDİLMEDİ').length} test edilmedi`);
  console.log(bad ? 'MACTEST_HATA' : 'MACTEST_OK');
  process.exit(bad ? 1 : 0);
}

(async () => {
  if (OZET) {
    const R = { maclar: [], hatalar: [], hedef: 0 };
    for (const f of OZET.split(',')) { const j = JSON.parse(fs.readFileSync(f, 'utf8')); R.maclar.push(...(j.maclar || [])); R.hatalar.push(...(j.hatalar || [])); R.hedef += j.hedef || (j.maclar || []).length; }
    const S = summarize(R); console.log(S.text); console.log(S.ok ? 'MACTEST_OK' : 'MACTEST_HATA'); process.exit(S.ok ? 0 : 1);
  }
  if (REG) return runRegresyon();
  return runBatch();
})().catch(e => { console.error('FATAL', e); console.log('MACTEST_HATA'); process.exit(1); });
