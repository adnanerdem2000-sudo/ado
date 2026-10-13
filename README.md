# Futbol Kariyeri

Tek HTML dosyasında çalışan, Türkçe futbol kariyeri oyunu. Telefonda ve bilgisayarda tarayıcıda açılır; kurulum ya da internet gerekmez (yalnız yazı tipleri Google Fonts'tan gelir, yoksa sistem yazı tipi kullanılır). Kayıtlar tarayıcının `localStorage` alanında tutulur.

## Oyunda neler var

- **8 meslek:** futbolcu (12 yaşında seçmelerle başlar), teknik direktör, yardımcı antrenör, gözlemci, takım doktoru, sportif direktör, kulüp başkanı, hakem. Başlangıç seviyesi: sıfırdan, orta, zirve.
- **Gerçek dünya (2026-27):** Süper Lig'den Bölgesel Amatör Lig'e kadar Türkiye ligleri; 5 büyük lig, Portekiz, İskoçya, Arjantin, MLS, Meksika, Rusya, Japonya, Norveç ve diğerleri. Gerçek kadrolar, piyasa değerleri, boy-kilo, tercih edilen ayak, teknik direktörler, kulüp bilgileri.
- **Maç:** FM tarzı 2B maç motoru, Adoball 2B/3B canlı maç ekranı (WebGL2, kütüphanesiz), futbolcu modunda "Pro" (tek oyuncunu yönet), hakem modunda canlı kararlar ve VAR.
- **Kariyer derinliği:** transfer ve sözleşme pazarlığı, kiralık, soyunma odası hiyerarşisi, yaşayan rakip hocalar, sosyal medya, basın, kupalar, Avrupa, milli takım, Ballon d'Or töreni, efsaneler, sezon özeti, kumarhane ve yasa dışı bahis.

## Klasör yapısı

```
build.sh                 derle → dist/futbol-kariyeri.html (son satır SYNTAX_OK)
src/manifest.txt         ana belgenin derleme sırası
src/shell/               <head>, CSS ve HTML iskeleti
src/game/parts/          ana oyun betiği, sürüm sürüm (000_baslangic … 149_v127 … 161_events)
src/game/data/           büyük veri: kadrolar, bayraklar, kulüp bilgileri, boy-kilo…
src/engine3d/            3B görünüm motoru (WebGL2) ve modeller/animasyonlar (data/)
src/adoball/             gömülü Adoball maç motoru (ayrı bir HTML belgesi; kendi manifest.txt'si var)
tools/build.js           derleyici + sözdizimi denetimi
tools/split.js           tek dosyalık HTML'i yeniden parçalara ayırır
tools/smoke.js           duman testi (Playwright): her meslekte kariyer başlatır, günleri ilerletir
```

## Geliştirme

```bash
bash build.sh                 # derle ve denetle
node tools/smoke.js           # tüm meslekleri test et (yaklaşık 1 dk)
node tools/smoke.js td ref    # yalnız seçili meslekler
```

Derlenen dosya `dist/futbol-kariyeri.html`'dir (Git'e eklenmez). Telefona ya da bilgisayara bu tek dosya kopyalanıp açılır.

Başka bir yerde düzenlenmiş tek dosyalık bir sürümü içeri almak için:

```bash
node tools/split.js yeni-surum.html src
bash build.sh --verify yeni-surum.html   # VERIFY_OK: bayt bayt aynı
```
