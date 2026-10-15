# Maaş modeli (v156) — kaynaklar ve varsayımlar

Kod: `src/game/parts/183_v156_gercekci_maaslar.js`. Tüm tutarlar **yıllık brüt €**. Oyunda iç birim değişmedi
(`G.contract.wage` haftalık iç birim, `pWage` haftalık €). Ekranda yıllık + haftalık gösterilir (v172: tek biçimlendirici
`wgH`/`wgT`, HTML üretilirken).

## Lig ortalamaları (oyuncu başı = kulüp başına ortalama oyuncu ücreti ÷ 30 kadro oyuncusu)

| Lig | Kulüp başı ort. / medyan (mn €) | Oyuncu başı ort. | Ücret/gelir | Kaynak |
|---|---|---|---|---|
| Premier League | 175 / 145 | 5,83 mn | %47 | UEFA ECFIL 2025 (2024 mali yılı), s. 36 |
| Bundesliga | 87 / 63 | 2,9 mn | %40 | UEFA |
| LaLiga | 92 / 47 | 3,07 mn | %47 | UEFA |
| Serie A | 75 / 53 | 2,5 mn | %51 | UEFA |
| Ligue 1 | 79 / 43 | 2,63 mn | %56 | UEFA |
| Rusya | 23 / 13 | 0,77 mn | %36 | UEFA |
| **Süper Lig** | **26 / 12** | **0,87 mn** | %57 | UEFA |
| Eredivisie | 17 / 6,9 | 0,57 mn | %43 | UEFA |
| Belçika | 25 / 17 | 0,83 mn | %70 | UEFA |
| Portekiz | 18 / 5,8 | 0,6 mn | %51 | UEFA |
| İskoçya 12/3,4 · İsviçre 11/11 · Avusturya 8,8/4,9 · Danimarka 7,7/5,1 · Yunanistan 12/3,9 · İsveç 5/3,2 · Polonya 5,2/4,4 · Hırvatistan 6,4/2,6 · Norveç 4/2,5 | | ÷30 | | UEFA |
| Championship | £892 mn toplam / 24 kulüp | ≈1,45 mn | %93 | Deloitte, 2023/24 |
| Suudi Pro Lig | ≈$1,28 mr sabit maaş / 18 kulüp | ≈2,2 mn | — | Capology tahmini (haber aktarımı, 2025-26) |
| MLS | ort. garantili ücret $649.199, medyan $339.876 | ≈0,56 mn | — | MLSPA, Bahar 2025 |
| Liga MX | ort. 339.610 € | 0,34 mn | — | FootyStats 2025/26 |

**Tahmini** (açık kaynak bulunamadı; komşu liglere ve gelir düzeyine göre ölçeklendi): LaLiga 2 0,4 mn ·
2. Bundesliga 0,55 mn · Serie B 0,35 mn · Ligue 2 0,3 mn · League One 0,25 mn · 3. seviye ligler 50–150 bin ·
Brezilya 0,5 mn · Arjantin 0,2 mn · J1 0,25 mn · Çekya 0,12 mn · Ukrayna 0,15 mn · Sırbistan 80 bin ·
TFF 1. Lig 160 bin · TFF 2. Lig 45 bin · TFF 3. Lig 18 bin.

## Türkiye alt yapı ve amatör
- Profesyonelliğe geçiş 15 yaşından itibaren mümkündür (TFF Profesyonel Futbolcuların Statüsü ve Transferleri Talimatı, md. 5);
  18 yaş altı profesyonel sözleşme en fazla 3 yıl (FIFA RSTP md. 18.2).
- Altyapıdan ilk profesyonel sözleşmeler asgari ücretle imzalanabiliyor (ör. Fanatik, 28.06.2017: Galatasaray'ın 2000 doğumlu
  7 oyuncusu asgari ücretle 3 yıllık profesyonel sözleşme). 2026 brüt asgari ücret 33.030 ₺/ay → yıllık ≈7,2 bin €
  (oyundaki kur `KUR.eur`). Bu, U19 ve TFF profesyonel liglerinin tabanıdır.
- U14/U16: amatör lisans → **ücret yok**. Süper Amatör ve BAL: amatör lisansta maaş olmaz (FIFA RSTP md. 2: amatöre yalnız
  masraf ödenir); oyunda küçük bir **masraf karşılığı** var (yıllık ≈1,2 bin € / 2,4 bin €, tahmini).

## Model
- **Yapay zekâ oyuncusu:** `yetenek = piyasa değeri ÷ yaş katsayısı (0,6–1,5 ile sınırlı) × gençlik indirimi`;
  `maaş = K_lig × yetenek^b × kulüp zenginliği^0,2 × (0,85–1,15 kişisel)`. `K_lig`, ligdeki tüm oyuncuların ortalaması tablo
  ortalamasına eşit olacak şekilde oturum başında hesaplanır; UEFA liglerinde `b`, kulüp ücretlerinin medyan/ortalama oranı
  tutacak şekilde uyduruldu. Gerçek oyunculara tek tek gerçek maaş atanmaz; oyuncu kartında "Maaş (tahmini)" yazar.
- **Bizim futbolcu:** kulübündeki oyuncuların maaş–güç eğrisinden (log-doğrusal) aynı güç için beklenen maaş ×
  rol (Yıldız 1,25 · İlk 11 1 · Rotasyon 0,82 · Gelişim 0,6 · A takıma yükselme 0,55) × yaş (17: 0,45 … 23+: 1) ×
  sezon performansı (0,85–1,25) × tanınırlık (0,65–1) × kulübün isteği, ardından kulüp vizyonu ve menajer etkileri.
  Taban: ligin asgarisi.
- **Kulüp finansı (menajer):** gelir, bir "gelir tabanı" ÷ ligin ücret/gelir oranına tamamlanır (sponsor ve ticari
  kalemi); oyuncu dışı giderler gelirin en az %30'u. v172: taban sezon başında kadronun yıllık maaşıyla sabitlenir ve her sezon
  en çok %15 değişir; sezon içinde maaş bütçesini zorlayan kulüp açık verebilir, gelir uzun vadede kulübün ölçeğine yaklaşır.
- **Teknik direktör, yönetici, personel, hakem (v172, varsayım):** taban ligin oyuncu başı ortalamasıdır (yukarıdaki tablo);
  görev oranları kaynak değil, eski oyun modelinin oranlarıdır: TD = ortalama × kulüp zenginliği^2,5 (0,75–1,5 aralığı → ×0,49–×2,76)
  × itibar (0,75–1,25); sportif direktör ×0,6, başkan ×0,4; yardımcı antrenör/gözlemci/doktor kademeye göre TD'nin %25–76'sı;
  hakem kulüpten bağımsız, personel oranının %30'u, lig ortalaması yerine √(lig ort. × Süper Lig ort.) ile. Türkiye'de taban
  asgari ücret. Ekranda bu kişiler için ayrı "tahmini" işareti yok (kendi sözleşmen); yapay zekâ oyuncu maaşlarının yanında
  "tahmini" yazar ve üzerine gelince lig ortalamasının kaynağı (ya da ortalamanın da tahmini olduğu) görünür.
- **Eski kayıtlar:** oyuncunun mevcut sözleşmesi bir kez yeni modele göre yeniden hesaplanır (süre ve rol aynı, gelen
  kutusuna bilgi mesajı). Menajer kayıtlarında oyuncu sözleşmeleri eski pazarlık primini koruyarak yeni ölçeğe taşınır,
  maaş bütçesi yeniden hesaplanır.

## Bağlantılar
- UEFA, *The European Club Finance and Investment Landscape 2025*, s. 34–37 — https://ecfil.uefa.com (PDF kopyası:
  https://patrickbayeux.com/wp-content/uploads/2026/03/2603-the-european-club-finance-and-investment-landscape-2025.pdf)
- Deloitte Annual Review of Football Finance (Championship 2023/24) — https://www.deloitte.com/uk/en/about/press-room/deloittes-annual-review-of-football-finance.html
- MLSPA Salary Guide — https://mlsplayers.org/resources/salary-guide ; ESPN haberi: https://global.espn.com/football/story/_/id/45580966/lionel-messi-earns-205m-best-paid-mls-second-year
- Suudi Pro Lig ücret toplamı (Capology aktarımı) — https://worldsoccertalk.com/news/cristiano-ronaldo-and-karim-benzema-still-sit-on-top-as-saudi-pro-league-wage-bill-takes-surprising-turn/
- Liga MX — https://footystats.org/mexico/liga-mx/salaries
- TFF talimatı — https://www.tff.org/Resources/TFF/Documents/TALIMATLAR/Profesyonel-Futbolcularin-Statusu-ve-Transferleri-Talimati.pdf
- Asgari ücretle profesyonel sözleşme — https://www.fanatik.com.tr/galatasaray/gelecegin-aslanlari-asgari-ucrete-imza-attilar-1303496
- 2026 asgari ücret — https://www.alomaliye.com/asgari-ucret/
- Süper Lig ücret yükü (UEFA 2023) — https://www.ntv.com.tr/sporskor/super-lig-kuluplerinin-maas-yuku-gelirlerin-yuzde-88i-futbolculara-gidiyor-uc-buyuklerilk-50-kulup-arasinda,rWJdu0ighEeRiFRwfFTEVA
