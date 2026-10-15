#!/usr/bin/env node
/* v151: büyük veri dosyalarını derlemede sıkıştırır (manifestte `@z dosya.js` satırı).
   Paket: deflate-raw( [u32 metin uzunluğu][metin; uzun base64 dizileri \x01 ile işaretli][her dizi için: u32 uzunluk + ikili bayt] ), base64.
   Base64 dizileri ikiliye çevrilip sıkıştırıldığı için (Meshy modeli, saç, kafa derisi bitmapleri, GLB) metin sıkıştırmasından daha küçüktür.
   Oyunda adoZKayit(ad, paket) kaydı yapar; `ad` global değişkeni ilk okunduğunda paket açılır (DecompressionStream ya da yedek
   JS inflate, 178_v151) ve dosyanın özgün metni kurulur (JSON.parse; olmazsa eval) — sonuç, dosyanın doğrudan gömülmesiyle birebir aynıdır.
   v171: iki biçim
     @z  dosya.js  → tembel: `var X = …;` ya da `Object.assign(X, …);` (X daha önce @z ile kaydedilmiş olmalı). X window özelliği
                     (getter) olur, ilk okunduğunda açılır; açılışta gerekmeyen büyük veri (3B modeller) için.
     @zy dosya.js  → açılışta gereken veri: bildirim OLDUĞU GİBİ kalır (`const X = adoZYerinde("anahtar");`, `var`, `let` ya da
                     `Object.assign(X, adoZYerinde("anahtar"));`), yani const/TDZ/IIFE içi kapsam değişmez. Paket, derleyicinin bloğun
                     önüne koyduğu ön yükleme betiğine (ZPRE) taşınır; o betik paketi hemen tarayıcının yerel açıcısıyla
                     (fetch data: + DecompressionStream, eşzamansız) açmaya başlar. Satır çalıştığında açılmış bayt hazırsa
                     yalnız metin + JSON.parse yapılır; hazır değilse (eski tarayıcı) yedek JS inflate eşzamanlı çalışır.
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
   yerinde=true: @zy (bildirim yerinde kalır, paket `pre` dizisine {key, z} olarak eklenir); known: daha önce @z ile kaydedilmiş adlar */
function zLine(text, file, yerinde, known, pre) {
  const p = parse(text); if (!p) throw new Error(`${file}: başta "var|const|let X =" ya da "Object.assign(X," bulunamadı`);
  if (!singleValue(text, p)) throw new Error(`${file}: dosya tek bir veri değeri tanımlamıyor (birden çok deyim ya da kapanış yok)`);
  const z = pack(text); if (unpack(z) !== text) throw new Error(`${file}: sıkıştırma sınaması tutmadı`);
  let line;
  if (yerinde) {
    const key = JSON.stringify(file), arg = pre ? key : `"${z}"`; if (pre) pre.push({ key: file, z });
    line = p.kind === 'assign' ? `Object.assign(${p.name},adoZYerinde(${arg}));` : `${p.kind} ${p.name}=adoZYerinde(${arg});`;
  } else {
    if (p.kind !== 'var' && p.kind !== 'assign') throw new Error(`${file}: tembel @z yalnız "var X =" / "Object.assign(X," içindir; const/let veri için @zy kullan`);
    if (p.kind === 'assign' && known && !known.has(p.name)) throw new Error(`${file}: Object.assign hedefi ${p.name} @z ile kaydedilmemiş (sözcüksel bir nesneyse @zy kullan)`);
    line = `adoZKayit(${JSON.stringify(p.name)},"${z}");`;
  }
  return { name: p.name, kind: p.kind, line, raw: text.length, size: line.length + (yerinde && pre ? z.length : 0) };
}
/* ön yükleme betiği (ES5): paketleri kaydeder ve yerel açıcıyla hemen açmaya başlar; 178_v151 adoZYerinde() buradan okur */
function preScript(list) {
  return '(function(){var P=window.__adoZon=window.__adoZon||{};function on(k,b){var e=P[k]={b:b,u:null,t:0};' +
    'if(typeof DecompressionStream==="undefined"||typeof fetch==="undefined"||typeof Response==="undefined")return;' +
    'try{fetch("data:application/octet-stream;base64,"+b).then(function(r){return new Response(r.body.pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer();})' +
    '.then(function(a){if(!e.bitti){e.u=new Uint8Array(a);e.t=performance.now();}},function(){});}catch(x){}}' +
    list.map(x => `on(${JSON.stringify(x.key)},"${x.z}");`).join('') + '})();';
}
module.exports = { pack, unpack, zLine, preScript, globalName, parse, valueText };

if (require.main === module) {
  let a = 0, b = 0; const av = process.argv.slice(2), y = av.includes('--y');
  for (const f of av.filter(x => x !== '--y')) {
    const r = zLine(fs.readFileSync(f, 'utf8'), f, y); a += r.raw; b += r.line.length;
    console.log(`${f}: ${r.kind} ${r.name} · ${(r.raw / 1024).toFixed(0)} KB → ${(r.line.length / 1024).toFixed(0)} KB`);
  }
  console.log(`toplam ${(a / 1048576).toFixed(2)} MB → ${(b / 1048576).toFixed(2)} MB · ZIP_OK`);
}
