#!/usr/bin/env node
/* v151: gerçek forma numaralarını SQ_RL kadro satırlarına 7. alan olarak yazar (Ad|mevki|yaş|güç farkı|uyruk|değer bin €|numara).
   Kaynak: v82 SQ_ADD ve v87 SQ_FIX (2026-27 kadroları, Ekim 2026; v87 önceliklidir) — artık derlemede değiller, src/game/data/eski/ içinde.
   Eşleme aynı kulüpte, aksan/ğ/ı farkı yok sayılarak ad ile yapılır; bulunamayan oyuncuya numara uydurulmaz (alan boş kalır).
   Kullanım: node tools/forma_no.js   (src/game/data/sq_rl.js yerinde güncellenir; tekrar çalıştırmak aynı sonucu verir) */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.resolve(__dirname, '../src/game/data');
const load = (f, v) => vm.runInNewContext(fs.readFileSync(path.join(D, f), 'utf8') + ';' + v);
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ıİ]/g, 'i').replace(/[øØ]/g, 'o').replace(/[đĐ]/g, 'd').replace(/[łŁ]/g, 'l').replace(/ß/g, 'ss').replace(/[æÆ]/g, 'ae').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const ADD = load('eski/sq_add.js', 'SQ_ADD'), FIX = load('eski/sq_fix.js', 'SQ_FIX');
const F = path.join(D, 'sq_rl.js'), text = fs.readFileSync(F, 'utf8');
const m = /^([\s\S]*?const SQ_RL=)(\{.*\});\n$/m.exec(text); if (!m) throw new Error('sq_rl.js biçimi tanınmadı');
const RL = JSON.parse(m[2]); let n = 0, tot = 0, dup = 0;
for (const [id, s] of Object.entries(RL)) {
  const want = new Map(); for (const L of [ADD[id] || [], FIX[id] || []]) for (const r of L) if (r[5] > 0 && r[5] < 100) want.set(norm(r[0]), r[5]);
  const used = new Set();
  RL[id] = s.split(';').map(row => {
    const f = row.split('|'); while (f.length < 6) f.push(''); f.length = 6; tot++;
    const no = want.get(norm(f[0])); if (no && !used.has(no)) { used.add(no); f.push(String(no)); n++; } else if (no) dup++;
    return f.join('|').replace(/\|+$/, '');
  }).join(';');
}
fs.writeFileSync(F, m[1] + JSON.stringify(RL) + ';\n');
console.log(`forma numarası: ${n}/${tot} oyuncu (çakışan ${dup} atlandı) · ${Object.keys(RL).length} kulüp · FORMA_OK`);
