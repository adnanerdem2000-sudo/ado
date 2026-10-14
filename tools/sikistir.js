#!/usr/bin/env node
/* v151: büyük veri dosyalarını derlemede sıkıştırır (manifestte `@z dosya.js` satırı).
   Paket: deflate-raw( [u32 metin uzunluğu][metin; uzun base64 dizileri \x01 ile işaretli][her dizi için: u32 uzunluk + ikili bayt] ), base64.
   Base64 dizileri ikiliye çevrilip sıkıştırıldığı için (Meshy modeli, saç, kafa derisi bitmapleri, GLB) metin sıkıştırmasından daha küçüktür.
   Oyunda adoZKayit(ad, paket) kaydı yapar; `ad` global değişkeni ilk okunduğunda paket açılır (DecompressionStream ya da yedek
   JS inflate, 178_v151) ve dosyanın özgün metni (0,eval) ile çalıştırılır — sonuç, dosyanın doğrudan gömülmesiyle birebir aynıdır.
   Yalnız üst düzeyde tek bir global tanımlayan dosyalar içindir: `var X = …;` ya da `Object.assign(X, …);` (IIFE içindeki veriler olmaz).
   Kullanım (deneme): node tools/sikistir.js <dosya.js> [...]   → boyutları yazar ve açma sınamasını yapar. */
'use strict';
const fs = require('fs'), zlib = require('zlib');

const B64 = /[A-Za-z0-9+/]{256,}={0,2}/g;
const DEF = /^\s*(?:var\s+([A-Za-z_$][\w$]*)\s*=|Object\.assign\(\s*([A-Za-z_$][\w$]*)\s*,)/m;

/* dosyanın tanımladığı global ad (yorum satırları atlanır) */
function globalName(text) {
  const body = text.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '').replace(/^\s*\/\/.*\n/gm, '');
  const m = DEF.exec(body); return m ? (m[1] || m[2]) : null;
}
function pack(text) {
  if (text.includes('\x01')) throw new Error('metinde \\x01 var');
  const segs = [];
  const t = text.replace(B64, s => { if (s.length % 4 || Buffer.from(s, 'base64').toString('base64') !== s) return s; segs.push(Buffer.from(s, 'base64')); return '\x01'; });
  const tb = Buffer.from(t, 'utf8'), parts = [u32(tb.length), tb];
  for (const b of segs) parts.push(u32(b.length), b);
  return zlib.deflateRawSync(Buffer.concat(parts), { level: 9 }).toString('base64');
}
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n, 0); return b; }
function unpack(b64) {
  const u = zlib.inflateRawSync(Buffer.from(b64, 'base64'));
  const n = u.readUInt32LE(0), t = u.subarray(4, 4 + n).toString('utf8').split('\x01');
  let o = 4 + n, out = t[0];
  for (let i = 1; i < t.length; i++) { const L = u.readUInt32LE(o); o += 4; out += u.subarray(o, o + L).toString('base64') + t[i]; o += L; }
  return out;
}
/* manifest satırı → tek JS satırı; açma sınaması başarısızsa hata fırlatır */
function zLine(text, file) {
  const name = globalName(text); if (!name) throw new Error(`${file}: üst düzeyde "var X =" ya da "Object.assign(X," bulunamadı`);
  const z = pack(text); if (unpack(z) !== text) throw new Error(`${file}: sıkıştırma sınaması tutmadı`);
  return { name, line: `adoZKayit(${JSON.stringify(name)},"${z}");`, raw: text.length, size: z.length };
}
module.exports = { pack, unpack, zLine, globalName };

if (require.main === module) {
  let a = 0, b = 0;
  for (const f of process.argv.slice(2)) {
    const r = zLine(fs.readFileSync(f, 'utf8'), f); a += r.raw; b += r.line.length;
    console.log(`${f}: ${r.name} · ${(r.raw / 1024).toFixed(0)} KB → ${(r.line.length / 1024).toFixed(0)} KB`);
  }
  console.log(`toplam ${(a / 1048576).toFixed(2)} MB → ${(b / 1048576).toFixed(2)} MB · ZIP_OK`);
}
