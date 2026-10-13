#!/usr/bin/env node
/* Tek dosyalık oyunu (futbol-kariyeri.html) düzenlenebilir kaynak parçalarına ayırır.
   Kullanım: node tools/split.js <oyun.html> [hedef=src]
   Ardından `node tools/build.js --verify <oyun.html>` aynı baytları geri üretmeli.
   Kurallar:
   - Satır düzeyinde bölünür; hiçbir bayt değiştirilmez (Adoball belgesindeki <\x07 kaçışları açılır, derlemede geri konur).
   - 10 000 karakterden uzun veri satırları (const X={...}, Object.assign(X,{...})) ayrı veri dosyasına gider.
   - Ana oyun betiği "/* ===== ..." ve "/* vNN ..." başlıklarından bölünür; her parça tek başına sözdizimi denetiminden geçmelidir. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');

const [, , input, outArg] = process.argv;
if (!input) { console.error('Kullanım: node tools/split.js <oyun.html> [hedef=src]'); process.exit(2); }
const OUT = path.resolve(outArg || 'src');
const AB_TAG = '<script type="text/x-abdoc" id="abdoc">';

function toLines(text) {
  if (!text.endsWith('\n')) throw new Error('Dosya satır sonuyla bitmiyor');
  const L = text.split('\n'); L.pop(); return L;
}
const TR = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u', 'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u', 'â': 'a', 'î': 'i', 'û': 'u' };
function slug(s, max = 42) {
  s = s.replace(/[çğıöşüÇĞİÖŞÜâîû]/g, c => TR[c]).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
  s = s.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (s.length > max) { s = s.slice(0, max); const k = s.lastIndexOf('_'); if (k > 20) s = s.slice(0, k); }
  return s || 'parca';
}
function compiles(code) { try { new vm.Script(code); return true; } catch (e) { return false; } }
const DATA_RE = /^\s*(?:(?:const|var|let)\s+([A-Za-z_$][\w$]*)\s*=|Object\.assign\(\s*([A-Za-z_$][\w$]*)\s*,)/;
const isData = l => l.length > 10000 && DATA_RE.test(l) && compiles(l);
function dataName(l) { const m = DATA_RE.exec(l); return m[1] ? m[1].toLowerCase() : m[2].toLowerCase() + '_ek'; }
function isCommentOnly(ls) {
  const t = ls.join('\n').trim(); if (!t) return false;
  if (ls.every(x => /^\s*(\/\/|$)/.test(x))) return true;
  return t.startsWith('/*') && t.indexOf('*/') === t.length - 2;
}

class Doc {
  constructor(root) { this.root = root; this.files = new Set(); this.ents = []; }
  uniq(rel) { if (!this.files.has(rel)) return rel; const ext = path.extname(rel), b = rel.slice(0, -ext.length); for (let i = 2; ; i++) if (!this.files.has(`${b}_${i}${ext}`)) return `${b}_${i}${ext}`; }
  file(rel, lines) {
    rel = this.uniq(rel); this.files.add(rel);
    const p = path.join(this.root, rel); fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, lines.map(x => x + '\n').join('')); this.ents.push(rel); return rel;
  }
  lit(s) { this.ents.push(s === '' ? '|' : '| ' + s); }
  manifest(title) {
    fs.writeFileSync(path.join(this.root, 'manifest.txt'), `# ${title}
# Derleme sırası. Her satır: bu klasöre göre bir dosya yolu, "| " ile başlayan düz satır ya da "@abdoc <manifest>".
# Satırlar bayt bayt çıktıyı belirler; yeni parçayı doğru yere ekle ve dosyayı satır sonuyla bitir.
` + this.ents.join('\n') + '\n');
  }
  /* Kod satırlarından veri satırlarını ayır. Veri satırının hemen önündeki yalnız-yorum bloğu veri dosyasına katılır. */
  code(lines, codeRel, dataDir) {
    const chunks = []; let cur = [];
    for (const l of lines) { if (isData(l)) { chunks.push({ code: cur }); cur = []; chunks.push({ data: l }); } else cur.push(l); }
    chunks.push({ code: cur });
    let n = 0;
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      if (c.data != null) { this.file(path.posix.join(dataDir, dataName(c.data) + '.js'), (c.pre || []).concat([c.data])); continue; }
      if (!c.code.length) continue;
      if (c.code.every(x => x === '')) { c.code.forEach(() => this.lit('')); continue; }
      const next = chunks[i + 1];
      if (next && next.data != null && isCommentOnly(c.code)) { next.pre = c.code; continue; }
      n++; this.file(n === 1 ? codeRel : codeRel.replace(/\.js$/, `_${n}.js`), c.code);
    }
  }
}

/* Başlıklardan böl: önceki parça tek başına derlenebiliyorsa kes. */
const HDR_RE = /^\/\* ?(?:={3,}|v\d+[a-z]?\b)/;
function splitByHeaders(lines) {
  const parts = []; let start = 0;
  for (let i = 1; i < lines.length; i++) if (HDR_RE.test(lines[i]) && compiles(lines.slice(start, i).join('\n'))) { parts.push(lines.slice(start, i)); start = i; }
  parts.push(lines.slice(start));
  return parts;
}
function partTitle(lines) {
  if (!HDR_RE.test(lines[0] || '')) return 'baslangic';
  for (const h of lines.slice(0, 4)) {
    const t = h.replace(/^\s*\/?\*?\s*=*\s*/, '').replace(/\s*=*\s*\*\/.*$/, '').replace(/\s*=+\s*$/, '').trim();
    if (t) return t;
  }
  return 'parca';
}

/* Bir HTML belgesini (ana oyun ya da Adoball) parçalara ayır. */
function splitDoc(L, doc, shell, names) {
  const findTrim = (t, from) => { for (let k = from; k < L.length; k++) if (L[k].trim() === t) return k; return -1; };
  const s = findTrim('<style>', 0), e = findTrim('</style>', s + 1);
  doc.file(shell + 'head.html', L.slice(0, s)); doc.lit(L[s]);
  doc.file(shell + 'style.css', L.slice(s + 1, e)); doc.lit(L[e]);
  let i = L.findIndex((x, k) => k > e && (x === '<script>' || x.startsWith(AB_TAG)));
  doc.file(shell + 'body.html', L.slice(e + 1, i));
  let blk = 0;
  while (i < L.length) {
    const l = L[i];
    if (l === '<script>') {
      let j = i + 1; while (L[j] !== '</script>') j++;
      const nm = names[blk++] || { file: `js/blok_${blk}.js`, data: 'data' };
      const body = L.slice(i + 1, j);
      doc.lit('<script>');
      const parts = nm.split ? splitByHeaders(body) : [body];
      if (parts.length > 1) parts.forEach((p, k) => doc.code(p, `${nm.file.replace(/\.js$/, '')}/${String(k).padStart(3, '0')}_${slug(partTitle(p))}.js`, nm.data));
      else doc.code(body, nm.file, nm.data);
      doc.lit('</script>'); i = j + 1; continue;
    }
    if (l.startsWith(AB_TAG)) {
      let k = i; while (!(L[k] === '</script>' && L[k - 1] === '</html>')) k++;
      const sub = [l.slice(AB_TAG.length)].concat(L.slice(i + 1, k)).map(x => x.replace(/<\u0007/g, '<'));
      const ab = new Doc(path.join(doc.root, 'adoball'));
      splitDoc(sub, ab, '', ADOBALL_NAMES);
      ab.manifest('Adoball maç motoru — oyunun içine <script type="text/x-abdoc" id="abdoc"> olarak gömülür');
      doc.ents.push('@abdoc adoball/manifest.txt'); i = k; continue; /* kapanış </script> düz satır olarak eklenir */
    }
    doc.lit(l); i++;
  }
}
const GAME_NAMES = [
  { file: 'game/parts.js', split: true, data: 'game/data' },
  { file: 'engine3d/models_glb.js', data: 'engine3d/data' },
  { file: 'engine3d/stadium_loader.js', data: 'engine3d/data' },
  { file: 'engine3d/engine.js', split: true, data: 'engine3d/data' },
];
const ADOBALL_NAMES = [
  { file: 'js/1_mac_motoru.js', data: 'data' },
  { file: 'js/2_arayuz.js', split: true, data: 'data' },
  { file: 'js/3_cekirdek_2d.js', split: true, data: 'data' },
  { file: 'js/4_kariyer_koprusu.js', data: 'data' },
];

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
const main = new Doc(OUT);
splitDoc(toLines(fs.readFileSync(input, 'utf8')), main, 'shell/', GAME_NAMES);
main.manifest('Futbol Kariyeri — ana belge');
console.log(`Ana belge: ${main.files.size} dosya · ${path.relative(process.cwd(), OUT)}/manifest.txt`);
