#!/usr/bin/env node
/* Profesyonel temanın renk seçenekleri: style.css'teki mor tonları yeşile ve laciverte çevirip src/shell/tema_renk.css üretir.
   Kullanım: node tools/tema_renk.js   (style.css değişince yeniden çalıştır; build.sh öncesi)
   Üretilen kurallar yalnız body.pro.pv-yesil / body.pro.pv-lacivert altında geçerli; Futbol ve Klasik temalar etkilenmez. */
'use strict';
const fs = require('fs'), path = require('path');
const R = path.resolve(__dirname, '..'), SRC = path.join(R, 'src/shell/style.css'), OUT = path.join(R, 'src/shell/tema_renk.css');
const css = fs.readFileSync(SRC, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/* renk dönüşümü */
function hex2rgb(h) { h = h.slice(1); if (h.length === 3 || h.length === 4) h = h.split('').map(c => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : null]; }
function rgb2hsl(r, g, b) { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
function hsl2rgb(h, s, l) { h = ((h % 360) + 360) % 360 / 360; if (s === 0) return [l, l, l].map(v => Math.round(v * 255));
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q, f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3), f(h), f(h - 1 / 3)].map(v => Math.round(v * 255)); }
const isMor = (h, s) => h >= 235 && h <= 325 && s >= 0.16;
const HEDEF = { yesil: { h: 152, s: 0.92 }, lacivert: { h: 218, s: 0.9 } };
function cevir([r, g, b], v) { const [h, s, l] = rgb2hsl(r, g, b); if (!isMor(h, s)) return null; const T = HEDEF[v]; return hsl2rgb(T.h, Math.min(1, s * T.s), l); }
const hx = n => n.toString(16).padStart(2, '0');
function renkleriCevir(txt, v) { let n = 0;
  txt = txt.replace(/#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3,4}\b/g, m => { const c = hex2rgb(m), y = cevir(c, v); if (!y) return m; n++; return '#' + y.map(hx).join('') + (c[3] != null ? hx(Math.round(c[3] * 255)) : ''); });
  txt = txt.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)/g, (m, r, g, b, a) => { const y = cevir([+r, +g, +b], v); if (!y) return m; n++; return a ? `rgba(${y.join(',')}${a})` : `rgb(${y.join(',')})`; });
  return [txt, n]; }

/* basit CSS ayrıştırma: kural listesi; @media/@supports iç içe; @keyframes ve @font-face olduğu gibi atlanır */
function blocks(s) { const out = []; let i = 0;
  while (i < s.length) { const o = s.indexOf('{', i); if (o < 0) break; const head = s.slice(i, o).trim(); let d = 1, j = o + 1;
    while (j < s.length && d) { if (s[j] === '{') d++; else if (s[j] === '}') d--; j++; }
    out.push({ head, body: s.slice(o + 1, j - 1) }); i = j; } return out; }
function secici(sel, v) { sel = sel.trim(); if (!sel) return null; const K = `body.pro.pv-${v}`;
  if (/body\.fut|\.fut\b|data-tema|^html/.test(sel)) return null;
  if (sel.startsWith(':root')) return K + sel.slice(5);
  if (/^body\.pro\b/.test(sel)) return sel.replace(/^body\.pro/, K);
  if (/^body\b/.test(sel)) return K + sel.slice(4);
  return K + ' ' + sel; }
function uret(s, v) { let out = '';
  for (const b of blocks(s)) {
    if (/^@(media|supports)/.test(b.head)) { const ic = uret(b.body, v); if (ic) out += `${b.head}{${ic}}\n`; continue; }
    if (b.head.startsWith('@')) continue;
    const decls = b.body.split(';').map(x => x.trim()).filter(Boolean), yeni = [];
    for (const d of decls) { const [t, n] = renkleriCevir(d, v); if (n) yeni.push(t); }
    if (!yeni.length) continue;
    const sels = b.head.split(',').map(x => secici(x, v)).filter(Boolean); if (!sels.length) continue;
    out += `${sels.join(',')}{${yeni.join(';')}}\n`; }
  return out; }
let son = '/* Otomatik üretildi: node tools/tema_renk.js — elle düzenleme. Profesyonel tema renk seçenekleri (mor → yeşil / lacivert). */\n';
for (const v of Object.keys(HEDEF)) son += `/* ${v} */\n` + uret(css, v);
fs.writeFileSync(OUT, son);
console.log('tema_renk.css', son.length, 'bayt', son.split('\n').length, 'satır');
