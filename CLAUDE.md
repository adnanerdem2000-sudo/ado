# Futbol Kariyeri — geliştirme notları

Kullanıcıyla her zaman Türkçe konuş. Oyun Türkçe; arayüz metinleri, yorumlar ve commit mesajları da Türkçe.

## Derle ve test et
- `bash build.sh` → `dist/futbol-kariyeri.html` (13 MB, tek dosya). Son satır `SYNTAX_OK` değilse hata mesajı kaynak dosya:satır verir.
- `node tools/smoke.js [profil...]` → Playwright ile td, oyuncu, yrd, scout, dr, sd, bsk, ref kariyerlerini başlatıp `fmCont()` ile ilerletir. Son satır `SMOKE_OK` olmalı. Komutları 118 saniyenin altında tut (tüm profiller ~65 sn).
- Başlangıç noktası: v127 (md5 `521d2ea0f6ae9dd076f37ecd562f9bbe`, Ekim 2026 yüklemesi). `tools/split.js` başka yerde düzenlenmiş tek dosyayı yeniden parçalar.

## Yapı
- `src/manifest.txt` derleme sırasıdır: dosya yolu, `| düz satır` ya da `@abdoc adoball/manifest.txt`. Çıktı, satırların birebir birleşimidir.
- `src/game/parts/NNN_*.js` hepsi tek bir klasik `<script>` bloğudur (ortak global kapsam, `'use strict'`). Sıra önemlidir: üst düzeydeki `const`/`let` tanımları kendinden önce kullanılamaz.
- `src/game/data/`, `src/engine3d/data/`, `src/adoball/data/`: tek satırlık dev veri (kadrolar, bayraklar, modeller, sesler). **Bu dosyaları okuma, `cat` etme**; gerekirse `grep -o '.\{0,80\}aranan.\{0,80\}'` ile parça al.
- `src/adoball/` gömülü Adoball maç motorudur (iframe `srcdoc` ile açılır). Derleyici içindeki `<!--`, `<script`, `</script` dizilerini `<\x07` ile kaçırır; kaynakta normal yaz.
- `src/engine3d/engine*.js` 3B motor (`window.Ado3D`); Adoball iframe'i `parent.Ado3D`'yi kullanır.

## Kod kuralları (mevcut koda uy)
- Yeni özellik = yeni sürüm parçası: `src/game/parts/NNN_vXXX_kisa_ad.js`, başında `/* ================= vXXX: açıklama ================= */`. Manifestte son `vNNN` parçasından sonra, `150_takvim_…` satırından önce ekle. CSS'i `src/shell/style.css` sonuna `/* vXXX: … */` başlığıyla ekle.
- Mevcut fonksiyonlar çoğunlukla sarmalanarak değiştirilir: `fn=(old=>function(){const r=old.apply(this,arguments);try{…}catch(e){}return r;})(fn);`. Küçük düzeltmeleri doğrudan ilgili parçada yapabilirsin.
- Durum: `G` (kayıt; `save()` ile localStorage'a), `W` (kariyer sihirbazı), `TAB`, `render()`. Görünümler HTML dizesi döndürür (`viewHub` vb.). Tıklamalar `data-act="ad"` → `ACTX.ad(el)` (161_events.js'deki tek dinleyici).
- Yardımcılar: `$`, `esc`, `clamp`, `rnd`, `rint`, `pick`, `money`/`eur`, `msg(tür,başlık,metin)` gelen kutusu, `toast()`, `closeModal()`.
- Gerçek oyuncu/kulüp verisi uydurma; kaynağı belli olmayan değer ekleme. Eski kayıtlarla uyumu koru (yeni alanlara `G.x=G.x||…` ile varsayılan ver).

## Yayın
Değişiklikten sonra: `bash build.sh` → `node tools/smoke.js` → commit/push. Kullanıcı dosyayı isterse `dist/futbol-kariyeri.html`'i `SendUserFile` (`display: attach`) ile gönder; artifact olarak yayımlanabilir (16 MB sınırının altında).
