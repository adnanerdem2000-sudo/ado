#!/usr/bin/env node
/* src/manifest.txt'ten tek dosyalık oyunu üretir ve her <script> bloğunu tarayıcıdaki gibi (klasik betik) derleyerek denetler.
   Kullanım: node tools/build.js [--out dist/futbol-kariyeri.html] [--verify <karşılaştırılacak.html>] [--check]
     --check   yalnız denetle, dosya yazma
     --verify  çıktı verilen dosyayla bayt bayt aynı mı (bölme işleminin kayıpsız olduğunu kanıtlamak için)
   Manifest satırları: dosya yolu, "| düz satır", "@abdoc <manifest>" ya da "@z <veri.js>" (v151: sıkıştırılmış gömme, tools/sikistir.js).
   Çıktı 15,5 milyon baytı aşarsa uyarır, 16 milyonu aşarsa başarısız olur (yayın sınırı).
   Başarılıysa son satır SYNTAX_OK olur. Sözdizimi hatasında hatanın kaynak dosyası ve satırı yazılır. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const ZIP = require('./sikistir');
/* v151: yayın sınırı (artifact 16 MB): 15,5 milyon baytı aşınca uyar, 16 milyonu aşınca derleme başarısız */
const SIZE_WARN = 15500000, SIZE_MAX = 16000000;
const args = process.argv.slice(2), opt = k => { const i = args.indexOf(k); return i < 0 ? null : (args[i + 1] || ''); };
const OUT = path.resolve(ROOT, opt('--out') || 'dist/futbol-kariyeri.html');
const AB_TAG = '<script type="text/x-abdoc" id="abdoc">';

/* Manifestten metni kur; her çıktı satırı için kaynak (dosya, satır) tut. */
function assemble(manifest) {
  const dir = path.dirname(manifest), out = [], src = [];
  const rows = fs.readFileSync(manifest, 'utf8').split('\n');
  rows.forEach((row, n) => {
    if (row === '' || row.startsWith('#')) return;
    const at = `${path.relative(ROOT, manifest)}:${n + 1}`;
    if (row.startsWith('| ') || row === '|') { out.push(row.slice(2)); src.push([at, 1]); return; }
    if (row.startsWith('@z ')) {   /* v151: veri dosyasını sıkıştırılmış gömer (tools/sikistir.js); oyunda ilk kullanımda açılır */
      const rel = row.slice(3).trim(), f = path.join(dir, rel);
      if (!fs.existsSync(f)) fail(`${at}: dosya yok: ${rel}`);
      let z; try { z = ZIP.zLine(fs.readFileSync(f, 'utf8'), rel); } catch (e) { fail(`${at}: ${e.message}`); }
      out.push(z.line); src.push([path.relative(ROOT, f), 1]); return;
    }
    if (row.startsWith('@abdoc ')) {
      const sub = assemble(path.join(dir, row.slice(7).trim()));
      checkScripts(sub, 'Adoball');
      const esc = sub.lines.map(l => l.replace(/<(?=!--|\/?script)/g, '<\u0007'));
      out.push(AB_TAG + esc[0]); src.push(sub.src[0]);
      for (let i = 1; i < esc.length; i++) { out.push(esc[i]); src.push(sub.src[i]); }
      return;
    }
    const f = path.join(dir, row);
    if (!fs.existsSync(f)) fail(`${at}: dosya yok: ${row}`);
    const t = fs.readFileSync(f, 'utf8');
    if (t.includes('\r')) fail(`${row}: CRLF satır sonu var; yalnız LF kullan`);
    if (t && !t.endsWith('\n')) fail(`${row}: dosya satır sonuyla bitmeli`);
    const ls = t.split('\n'); ls.pop();
    ls.forEach((l, k) => { out.push(l); src.push([path.relative(ROOT, f), k + 1]); });
  });
  return { lines: out, src };
}

/* Klasik <script> bloklarını derle (çalıştırmadan). */
function checkScripts(doc, label) {
  const L = doc.lines; let n = 0;
  for (let i = 0; i < L.length; i++) {
    if (L[i] !== '<script>') continue;
    let j = i + 1; while (j < L.length && L[j] !== '</script>') j++;
    n++;
    const code = L.slice(i + 1, j).join('\n');
    try { new vm.Script(code, { filename: 'blok' }); }
    catch (e) {
      const m = /blok:(\d+)/.exec(e.stack || ''), ln = m ? +m[1] : 0, s = doc.src[i + ln] || ['?', 0];
      const near = (e.stack || '').split('\n').slice(1, 3).join('\n');
      fail(`${label} betik ${n}: ${e.name}: ${e.message}\n  kaynak: ${s[0]}:${s[1]}\n${near}`);
    }
    i = j;
  }
  return n;
}
function fail(msg) { console.error('HATA: ' + msg); process.exit(1); }

const doc = assemble(path.join(ROOT, 'src/manifest.txt'));
const nScripts = checkScripts(doc, 'Ana belge');
const text = doc.lines.join('\n') + '\n';
const buf = Buffer.from(text, 'utf8');
const md5 = crypto.createHash('md5').update(buf).digest('hex');
if (buf.length > SIZE_MAX) fail(`çıktı ${buf.length.toLocaleString('tr-TR')} bayt: yayın sınırı ${SIZE_MAX.toLocaleString('tr-TR')} baytı aşıyor (büyük veriyi manifestte @z ile sıkıştır ya da kullanılmayanı çıkar)`);
if (buf.length > SIZE_WARN) console.warn(`UYARI: çıktı ${buf.length.toLocaleString('tr-TR')} bayt — sınıra (${SIZE_MAX.toLocaleString('tr-TR')}) yaklaşıyor`);
if (args.includes('--check')) console.log(`denetlendi: ${nScripts} betik bloğu`);
else { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, buf); console.log(`${path.relative(ROOT, OUT)} · ${buf.length.toLocaleString('tr-TR')} bayt (${(buf.length / 1048576).toFixed(2)} MiB) · md5 ${md5}`); }
const ver = opt('--verify');
if (ver != null) {
  const ref = fs.readFileSync(path.resolve(ver));
  if (Buffer.compare(ref, buf) !== 0) {
    let k = 0; while (k < ref.length && ref[k] === buf[k]) k++;
    fail(`çıktı ${ver} ile aynı değil (ilk fark bayt ${k}: ${JSON.stringify(ref.subarray(k, k + 40).toString())} ≠ ${JSON.stringify(buf.subarray(k, k + 40).toString())})`);
  }
  console.log('VERIFY_OK: bayt bayt aynı');
}
console.log('SYNTAX_OK');
