#!/usr/bin/env node
/* v151: büyük veri dosyalarını derlemede sıkıştırır (manifestte `@z dosya.js` satırı).
   Paket: deflate-raw( [u32 metin uzunluğu][metin; uzun base64 dizileri \x01 ile işaretli][her dizi için: u32 uzunluk + ikili bayt] ), base64.
   Base64 dizileri ikiliye çevrilip sıkıştırıldığı için (Meshy modeli, saç, kafa derisi bitmapleri, GLB) metin sıkıştırmasından daha küçüktür.
   Oyunda adoZKayit(ad, paket) kaydı yapar; `ad` global değişkeni ilk okunduğunda paket açılır (DecompressionStream ya da yedek
   JS inflate, 178_v151) ve dosyanın özgün metni kurulur (JSON.parse; olmazsa eval) — sonuç, dosyanın doğrudan gömülmesiyle birebir aynıdır.
   v171: iki biçim
     @z  dosya.js  → üst düzeyde tek global tanımlayan veri: `var X = …;`, `const X = …;`, `let X = …;` ya da `Object.assign(X, …);`
                     (Object.assign yalnız X daha önce @z ile kaydedildiyse). Tembel: X ilk okunduğunda açılır. `const`/`let` veri
                     bağlaması window özelliğine (getter) dönüşür; X'e dosyanın satırından önce erişen kod yoktur (TDZ'de zaten hata verirdi).
     @zy dosya.js  → yerinde, eşzamanlı: bildirim olduğu gibi kalır, yalnız değer paketten açılır
                     (`var X = adoZYerinde("…");` / `Object.assign(X, adoZYerinde("…"));`). IIFE içindeki veriler (3B motorun
                     ADO_MOCAP…) ve sözcüksel (const) bir nesneye eklenen veriler (CLUB_INFO) için. Açma o satır çalışınca olur.
   Kullanım (deneme): node tools/sikistir.js [--y] <dosya.js> [...]   → boyutları yazar ve açma sınamasını yapar. */
'use strict';
const fs = require('fs'), zlib = require('zlib');

const B64 = /[A-Za-z0-9+/]{256,}={0,2}/g;
/* baş: [1] bildirim türü, [2] ad | [3] Object.assign hedefi; [4] metnin geri kalanı (değer + kapanış) */
const DEF = /^(\s*(?:\/\*[\s\S]*?\*\/\s*)?)(?:(var|const|let)\s+([A-Za-z_$][\w$]*)\s*=|Object\.assign\(\s*([A-Za-z_$][\w$]*)\s*,)\s*/;

/* dosyanın tanımladığı ad ve biçim (baştaki blok yorumu atlanır) */
function parse(text) {
  const m = DEF.exec(text); if (!m) return null;
  return { kind: m[2] || 'assign', name: m[3] || m[4], head: m[0], pre: m[1] };
}
function globalName(text) { const p = parse(text); return p ? p.name : null; }
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
/* değer metni: başlık ve kapanış (`;` / `);`, ardından satır yorumu olabilir) atılmış */
function valueText(text, p) {
  const v = text.slice(p.head.length), re = p.kind === 'assign' ? /\)\s*;\s*(\/\/[^\n]*)?\s*$/ : /;\s*(\/\/[^\n]*)?\s*$/;
  if (!re.test(v)) return null; return v.replace(re, '');
}
/* tek ifade mi: değer JSON ise ya da tek bir ifade olarak derleniyorsa (birden çok deyimli dosyalar paketlenmez) */
function singleValue(text, p) {
  const v = valueText(text, p); if (v == null) return false;
  try { JSON.parse(v); return true; } catch (e) { }
  try { new (require('vm').Script)('(' + v + '\n)'); return true; } catch (e) { return false; }
}
/* manifest satırı → tek JS satırı; açma sınaması başarısızsa hata fırlatır.
   yerinde=true: @zy (bildirim yerinde kalır); known: daha önce @z ile kaydedilmiş adlar (Object.assign hedefi için) */
function zLine(text, file, yerinde, known) {
  const p = parse(text); if (!p) throw new Error(`${file}: başta "var|const|let X =" ya da "Object.assign(X," bulunamadı`);
  if (!singleValue(text, p)) throw new Error(`${file}: dosya tek bir veri değeri tanımlamıyor (birden çok deyim ya da kapanış yok)`);
  const z = pack(text); if (unpack(z) !== text) throw new Error(`${file}: sıkıştırma sınaması tutmadı`);
  let line;
  if (yerinde) line = p.kind === 'assign' ? `Object.assign(${p.name},adoZYerinde("${z}"));` : `${p.kind} ${p.name}=adoZYerinde("${z}");`;
  else {
    if (p.kind === 'assign' && known && !known.has(p.name)) throw new Error(`${file}: Object.assign hedefi ${p.name} @z ile kaydedilmemiş (sözcüksel bir nesneyse @zy kullan)`);
    line = `adoZKayit(${JSON.stringify(p.name)},"${z}");`;
  }
  return { name: p.name, kind: p.kind, line, raw: text.length, size: z.length };
}
module.exports = { pack, unpack, zLine, globalName, parse, valueText };

if (require.main === module) {
  let a = 0, b = 0; const av = process.argv.slice(2), y = av.includes('--y');
  for (const f of av.filter(x => x !== '--y')) {
    const r = zLine(fs.readFileSync(f, 'utf8'), f, y); a += r.raw; b += r.line.length;
    console.log(`${f}: ${r.kind} ${r.name} · ${(r.raw / 1024).toFixed(0)} KB → ${(r.line.length / 1024).toFixed(0)} KB`);
  }
  console.log(`toplam ${(a / 1048576).toFixed(2)} MB → ${(b / 1048576).toFixed(2)} MB · ZIP_OK`);
}
