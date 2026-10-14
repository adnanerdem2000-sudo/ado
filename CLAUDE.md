# Futbol Kariyeri — geliştirme notları

Kullanıcıyla her zaman Türkçe konuş. Oyun Türkçe; arayüz metinleri, yorumlar ve commit mesajları da Türkçe.

## Derle ve test et
- `bash build.sh` → `dist/futbol-kariyeri.html` (~13,8 milyon bayt, tek dosya; v151). Son satır `SYNTAX_OK` değilse hata mesajı kaynak dosya:satır verir. Boyut sınırı derlemede denetlenir: 15,5 milyon baytta UYARI, 16.000.000 baytı aşarsa derleme başarısız (artifact sınırı).
- `node tools/mac3b.js <klasör> [--prof td|ref|oyuncu] [--sure sn] [--kare n] [--file oyun.html]` ilk maçı 3B yayında açıp ekran görüntüsü ve kare süresi verir (yazılım WebGL: kare hızı düşük).
- `node tools/kariyer_sim.js <profil> --sezon 2 --dk 25 [--rapor x.json]` çok sezonluk kariyer simülasyonu (maçlar klasik motorla görüntüsüz); son satır SIM_OK.
- `node tools/smoke.js [profil...]` → Playwright ile td, oyuncu, yrd, scout, dr, sd, bsk, ref kariyerlerini başlatıp `fmCont()` ile ilerletir. Son satır `SMOKE_OK` olmalı. Komutları 118 saniyenin altında tut (tüm profiller ~65 sn).
- Klavye: Space = Devam (gün atla), Esc = pencere/katman kapat, sihirbazda geri, önceki sekme (v130).
- Başlangıç noktası: v127 (md5 `521d2ea0f6ae9dd076f37ecd562f9bbe`, Ekim 2026 yüklemesi). `tools/split.js` başka yerde düzenlenmiş tek dosyayı yeniden parçalar.

## Yapı
- `src/manifest.txt` derleme sırasıdır: dosya yolu, `| düz satır` ya da `@abdoc adoball/manifest.txt`. Çıktı, satırların birebir birleşimidir.
- `src/game/parts/NNN_*.js` hepsi tek bir klasik `<script>` bloğudur (ortak global kapsam, `'use strict'`). Sıra önemlidir: üst düzeydeki `const`/`let` tanımları kendinden önce kullanılamaz.
- `src/game/data/`, `src/engine3d/data/`, `src/adoball/data/`: tek satırlık dev veri (kadrolar, bayraklar, modeller, sesler). **Bu dosyaları okuma, `cat` etme**; gerekirse `grep -o '.\{0,80\}aranan.\{0,80\}'` ile parça al.
- Sıkıştırılmış gömme (v151): manifestte `@z <veri.js>` satırı dosyayı derlemede `tools/sikistir.js` ile paketler (uzun base64 dizileri ikiliye çevrilip deflate-raw). Oyunda `adoZKayit(ad, paket)` kaydolur, `ad` globali ilk okunduğunda açılır (DecompressionStream ile boşta önceden, yoksa yedek JS `adoInflate`); sonuç dosyayı doğrudan gömmekle birebir aynıdır. Yalnız üst düzeyde tek global tanımlayan veri (`var X = {…};` / `Object.assign(X, {…});`) için; 3B modeller (Meshy, saç, kafa derisi, GLB) böyle. Kaynak dosyalar düz kalır, düzenleme sonrası yalnız derle. `node tools/sikistir.js <dosya>` boyut ve açma sınaması yapar.
- Yeni büyük veri eklerken boyutu ölç; açılışta gerekmeyen veriyi `@z` ile göm. `DecompressionStream` olmayan tarayıcılar için `adoAc(u8)` (Promise) ya da `adoInflate(u8)` kullan (178_v151).
- `src/adoball/` gömülü Adoball maç motorudur (iframe `srcdoc` ile açılır). Derleyici içindeki `<!--`, `<script`, `</script` dizilerini `<\x07` ile kaçırır; kaynakta normal yaz.
- `src/engine3d/engine*.js` 3B motor (`window.Ado3D`); Adoball iframe'i `parent.Ado3D`'yi kullanır.

## Gerçek oyuncu verisi (v128, FotMob)
- `src/game/data/fm_kariyer.js` (`FMK_Z`): sıkıştırılmış kariyer + boy + milli maç verisi; oyunda `FMK` olarak açılır, `fmkRec(p)` ile okunur. Elle düzenleme; yeniden üret.
- Üretim hattı `tools/veri/` (ağ gerekir, ~45 dk; önbellek scratchpad'de tutulabilir):
  `bash build.sh` → `node tools/veri/0_disa_aktar.js oyun.json` → `1_kulup_esle.js oyun.json önbellek kulupler.json` → `2_oyuncu_cek.js oyun.json kulupler.json önbellek oyuncular.json` → `4_bonservis.js oyun.json oyuncular.json önbellek bonservis.json` (SofaScore, curl) → `5_boy_sofascore.js oyun.json oyuncular.json bonservis.json önbellek boy_ss.json` → `6_mevki.js oyun.json kulupler.json oyuncular.json önbellek mevki.json` → `3_veri_uret.js oyun.json kulupler.json oyuncular.json önbellek --bon bonservis.json --boy boy_ss.json --mevki mevki.json` → `bash build.sh`.
- Uzun işleri `setsid nohup … &` ile başlat; FotMob'a Node fetch, SofaScore'a curl ile gidilir (SofaScore Node fetch'ini engelliyor).
- Kulüpler kadro örtüşmesiyle, oyuncular ad + yaş (+ takım ya da uyruk) ile eşlenir. Kadro verisi değişirse hattı yeniden çalıştır.
- Sezon alanında `C` = takvim yılı sezonu (MLS, Eliteserien, J1, Brasileirão…; FotMob "2023" → y=2022, ekranda `krYL()` ile "2023"), `L` = kiralık. Kiralıktan kalıcıya geçiş (ör. Mbappé 2018) yalnız SofaScore aynı kulübe kalıcı transfer kaydı veriyorsa yazılır. `3_veri_uret.js` önbellekten ~8 sn'de, ağ olmadan yeniden üretir.
- Ad eşleme aksan/ğ/ı farkını yok sayar: `adNorm()`; POSD, FOOT_DB, HW_REAL, LOOKS, CARD ve FMK kayıtlarına FotMob verisi açılınca takma ad eklenir (178_v151).
- `node tools/kariyer_kontrol.js [--file oyun.html] [--shot x.png] "Oyuncu Adı"` oyuncunun oyundaki geçmişini, forma numarasını, boyunu ve milli maçını yazdırır (ad aksansız da yazılabilir).
- Verisi olmayan oyuncuya oyun öncesi geçmiş uydurulmaz; boyu tahminse ekranda "tahmini" yazar.

## Kadrolar ve forma numaraları (v151)
- Gerçek kadrolar `SQ_RL` (`sq_rl.js`; satır `Ad|mevki|yaş|güç farkı|uyruk|değer bin €|forma no`) → 132_v110 `SQ_REAL`'i kurar. Eski `NEW_SQ`, `NEW_SQ2`, `NEW_SQ3`, `SQ_ADD`, `SQ_FIX` derlemede değil (`src/game/data/eski/`); SQ_RL hepsinin üzerine yazıyordu.
- Forma numarası (7. alan) `node tools/forma_no.js` ile eski SQ_FIX/SQ_ADD'den (aynı kulüp, aksansız ad) yazılır; bulunamayana numara uydurulmaz. SQ_RL yeniden üretilirse bu aracı tekrar çalıştır.
- Gerçek kadrosu olmayan (üretilmiş) kulüpler arayüzde "Temsili kadro" diye işaretlenir (`kadroTemsili(id)`).
- Para: `EUR_TL` kur değil iç para birimidir (kayıt uyumu için sabit); tek döviz kuru `KUR.eur`, ₺ karşılığı `tlOf()`.

## Kod kuralları (mevcut koda uy)
- Yeni özellik = yeni sürüm parçası: `src/game/parts/NNN_vXXX_kisa_ad.js`, başında `/* ================= vXXX: açıklama ================= */`. Manifestte son `vNNN` parçasından sonra, `150_takvim_…` satırından önce ekle; dosya numarası 162'den devam eder (162 = v128). CSS'i `src/shell/style.css` sonuna `/* vXXX: … */` başlığıyla ekle.
- Mevcut fonksiyonlar çoğunlukla sarmalanarak değiştirilir: `fn=(old=>function(){const r=old.apply(this,arguments);try{…}catch(e){}return r;})(fn);`. Küçük düzeltmeleri doğrudan ilgili parçada yapabilirsin.
- Durum: `G` (kayıt; `save()` ile localStorage'a), `W` (kariyer sihirbazı), `TAB`, `render()`. Görünümler HTML dizesi döndürür (`viewHub` vb.). Tıklamalar `data-act="ad"` → `ACTX.ad(el)` (161_events.js'deki tek dinleyici).
- Yardımcılar: `$`, `esc`, `clamp`, `rnd`, `rint`, `pick`, `money`/`eur`, `msg(tür,başlık,metin)` gelen kutusu, `toast()`, `closeModal()`.
- Gerçek oyuncu/kulüp verisi uydurma; kaynağı belli olmayan değer ekleme. Eski kayıtlarla uyumu koru (yeni alanlara `G.x=G.x||…` ile varsayılan ver).

## Yayın
Değişiklikten sonra: `bash build.sh` → `node tools/smoke.js` → commit/push. Kullanıcı dosyayı isterse `dist/futbol-kariyeri.html`'i `SendUserFile` (`display: attach`) ile gönder; artifact olarak yayımlanabilir (16 MB sınırı; derleme 16.000.000 baytı aşarsa durur).
