# Maç sesleri — kaynaklar ve lisanslar (v140)

`src/adoball/data/snd_data.js` içindeki bütün sesler Freesound.org'dan alınmış, **CC0 1.0 (kamu malı)** lisanslı
kayıtlardır: https://creativecommons.org/publicdomain/zero/1.0/ — atıf zorunlu değildir, ticari kullanım serbesttir.
Yine de kayıtçılara teşekkür olarak aşağıda listelenir. Her sesin lisansı, indirme sırasında ses sayfasından
(“License: Creative Commons 0”) doğrulanmıştır (Ekim 2026). Freesound'un herkese açık yüksek kaliteli MP3
önizlemeleri kullanılmıştır; önizleme, sesin kendi lisansıyla aynı lisansı taşır.

Eski sentetik ses paketi (Adoball SoundGen) tamamen kaldırıldı.

| Oyundaki anahtar | Ne zaman çalar | Kaynak (Freesound) | Kayıtçı | Kesit |
|---|---|---|---|---|
| CrowdLoop | Maç boyunca tribün uğultusu (stereo, tehlikeyle kabarır) | [Milan Derby (Milan vs Inter) at San Siro Stadium](https://freesound.org/people/neilraouf/sounds/424354/) | neilraouf | 1–44 sn, 40 sn kesintisiz döngü |
| CrowdChant, CrowdChant2 | Ara ara tezahürat, gol sonrası | [Soccer fans screaming and playing drums in a small stadium of Chile](https://freesound.org/people/felix.blume/sounds/500250/) | felix.blume | 0,3–17,3 sn ve 61–77 sn |
| CrowdRoar | Gol bağırışı | [19 Football Crowd - Reaction To Goal](https://freesound.org/people/D.jones/sounds/528799/) | D.jones | 1–12 sn |
| CrowdRoar2 | Gol bağırışı (çeşit) | [Crowd screaming GOAL during the soccer game Mexico-Holland](https://freesound.org/people/felix.blume/sounds/241630/) | felix.blume | 0,2–8,2 sn |
| CrowdOoh | Kaçan fırsat, direk, kurtarış “ooo” | [Soccer stadium Oehh](https://freesound.org/people/Sandermotions/sounds/494362/) | Sandermotions | 2,6–7,4 sn |
| CrowdOoh2 | “ooo” (çeşit) | [Crowd yelling huuuuu (60k persons) during a soccer game in Brazil](https://freesound.org/people/felix.blume/sounds/612131/) | felix.blume | 30,8–35,8 sn |
| CrowdGroan | Gol iptali, ev sahibinin büyük fırsatı kaçınca iç çekiş | [Crowd Sigh In Disappointment (GSC24, XY)](https://freesound.org/people/ShangusBurger/sounds/763880/) | ShangusBurger (Shane Vincent) | 0,7–6,2 sn |
| Applause | Devre/maç sonu, rakip kalecinin kurtarışı | [Large crowd applause](https://freesound.org/people/Bansemer/sounds/160493/) | Bansemer | 1–7 sn |
| CrowdCheer | Kendi kalecinin kurtarışı, ev sahibi korneri | [cheering and clapping crowd 2](https://freesound.org/people/AlaskaRobotics/sounds/221567/) | AlaskaRobotics | 0,2–6,7 sn |
| CrowdWhistle | Yuhalama: kart, rakip faulü, penaltı, gol iptali | [JM_AMB_INT_Crowd Sport 01 - Booing](https://freesound.org/people/Julien_Matthey/sounds/557189/) | Julien_Matthey | 1,2–9,2 sn |
| Kick | Pas | [Soccer Ball Kick](https://freesound.org/people/bittermelonheart/sounds/555042/) | bittermelonheart | ilk vuruş |
| Kick2 | Pas (çeşit) | [Ball Kick](https://freesound.org/people/Nicolas4677/sounds/446639/) | Nicolas4677 | ilk vuruş |
| Kick3, KickHard, KickHard2 | Pas, uzun top, şut, uzaklaştırma | [Soccer kicks](https://freesound.org/people/padpad/sounds/515908/) | padpad | ~2,2 / 8,1 / 11,0 sn'deki vuruşlar |
| Header | Kafa vuruşu | [Kicking a Football](https://freesound.org/people/Ultra-Edward/sounds/795715/) | Ultra-Edward | ~0,9 sn'deki darbe |
| Net | Gol: file | [soccer net](https://freesound.org/people/Luisa_Sanchez/sounds/816989/) | Luisa_Sanchez | 0,08–0,7 sn |
| Post | Direk/üst direk | [Soccer ball hitting the goal frame](https://freesound.org/people/YannSauvin/sounds/781717/) | YannSauvin | 0,52–2,32 sn |
| Whistle | Faul, ofsayt, başlama düdüğü | [Referee whistle sound](https://freesound.org/people/Rosa-Orenes256/sounds/538422/) | Rosa-Orenes256 | tamamı (0,48 sn) |
| Whistle2 | Faul düdüğü (çeşit), maç sonu kısa düdükler | [Referee whistle blow, gymnasium](https://freesound.org/people/SpliceSound/sounds/218318/) | SpliceSound | 0,05–0,8 sn |
| WhistleLong | Devre/maç sonu uzun düdük, penaltı | [Coach whistle](https://freesound.org/people/Chaos-Kid/sounds/817398/) | Chaos-Kid | 0–1,55 sn |

## İşleme

`tools/ses/1_indir.py` (indir + lisans doğrula) ve `tools/ses/2_isle.py` (kes, süz, seviye eşle, döngü, kodla) ile üretilir:

```
python3 tools/ses/1_indir.py <indirme> 424354 500250 528799 241630 494362 612131 763880 160493 221567 557189 555042 446639 515908 795715 816989 781717 538422 218318 817398
python3 tools/ses/2_isle.py <indirme> <çıkış> src/adoball/data/snd_data.js
```

- 22,05 kHz mono MP3 (tribün döngüsü ve tezahürat 32 kbps, diğerleri 40–48 kbps), base64 olarak gömülü; toplam ~640 KB MP3 / ~860 KB JS.
- Tribün sesleri eski paketin seviyesine (RMS) eşlendi, kısa sesler −1 dBFS tepeye normalize edildi; yumuşak tepe sınırlayıcı.
- Döngü: 3 sn eşit güçlü çapraz geçiş; dosyanın başına ve sonuna 0,5 sn periyodik pay eklendi, oyun `ls`–`le` aralığında döndürür
  (MP3 kod çözücü gecikmesi döngüde boşluk yapmaz).
- Oyunda `decodeAudioData` ile çözülür; çözülemezse eski sentez sesleri (Web Audio osilatör) çalar. Ses düğmesi (🔊/🔇) aynen geçerli.
