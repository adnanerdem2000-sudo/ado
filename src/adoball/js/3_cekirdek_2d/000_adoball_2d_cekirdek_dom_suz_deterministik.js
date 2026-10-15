/* =====================================================================
   ADOBALL 2D — ÇEKİRDEK (DOM'suz, deterministik)
   Tek doğruluk kaynağı: bu simülasyon. Görüntü ve spiker ondan TÜRETİLİR.
   Birim: metre / saniye. Saha 105 x 68. Sabit adım DT = 0.04 s (25 Hz).
   ===================================================================== */
(function (root) {
    'use strict';
    var PW = 105, PH = 68, CX = 52.5, CY = 34, GW = 7.32, GY0 = CY - GW / 2, GY1 = CY + GW / 2, DT = 0.04;
    var PA_D = 16.5, PA_Y0 = CY - 20.16, PA_Y1 = CY + 20.16;
    // Zaman: sim.t = FİZİKSEL saniye (oyuncular/top gerçek hızla; ekranda 3x'te 3 sn/sn). Maç saati = sim.t · CK (CK = 5400 / MATCH_S): kısa simülasyon 90 dakikaya ölçeklenir.
    var CLOCK_S = 5400;
    // Ayarlanabilir sabitler (kalibrasyon). create({params:{...}}) ile deneme amaçlı geçersiz kılınabilir.
    var DEFAULTS = {
        INT_REACT: .7, INT_SPEED: .65, INT_SLACK: .6,      // rakibin pas kesme tepkisi: gecikme (sn), koşu hızı çarpanı, ek erişim (m)
        REC_R: 1.8,                                        // pasın asıl alıcısının topa uzanma yarıçapı (m)
        LONG_PEN: .11, LANE_PEN: 2.2, PASS_ARR: 9.5,      // uzun pas cezası, dar koridor cezası, pas varış hızı (m/sn)
        SAVE_A: .66, SAVE_XG: 1.9, BLOCK_R: .9,            // kaleci kurtarma olasılığı = SAVE_A − SAVE_XG·xG; blok yarıçapı
        JD_MOVE: 2.6, JD_HOLD: 1.8, COVER_D: 6,            // baskı mesafesi (topla koşan / duran), kapatma mesafesi
        MARK_R: 22, MARK_GS: 2.4, MARK_W: .85,             // markaj: eşleşme yarıçapı, kaleye doğru duruş mesafesi, markaj ağırlığı
        SHOT_SD: .36, SHOT_BASE: .06, SHOT_RANGE: .16,     // şut savrulması, şut isteği eşiği ve aralığı (xG)
        DRIB_SF: .70, JOCKEY: .74, ENGAGE: .6,             // topla koşu hızı, rakip yakınken yavaşlama, savunmacının müdahale isteği
        // karar yapay zekası (beklenen değer): konum değeri V(d) = PV_BASE + PV_AMP·exp(−d/PV_LEN), kaybın maliyeti = LOSS_W · rakibin konum değeri
        PV_BASE: .004, PV_AMP: .31, PV_LEN: 17, LOSS_W: 1, TURN_C: 0, SHOT_LOSS: 1,
        PP_BASE: .97, PP_LANE: .67, PP_C0: .844, PP_F0: 2.875, PP_A3: .022, PP_HH: .762, SHOT_W: 2.2, SHOT_MIN: .03, SPILL: .006, DRIB_EV: .75, DRIB_COST: .002, OFFS_MISS: .07,
        TEMPO_A: .55, TEMPO_B: .5, THINK_A: .95, THINK_B: .38, HOLD_MAX: 5, PRESS_REACH: .75, BLOCK_P: .45, PP_CROSS: .5, PP_RUN: .85, GK_LONG: .35, PRESS_HI_D: 32, PRESS_MID_D: 32, PROG_W: .0004, DEAD_K: 2, DEAD_T: 5, DEAD_G: 6, DEAD_C: 9, DEAD_F: 5.5, DEAD_GOAL: 12, PASS_MISS: .02, IDLE_SF: .32, CLEAR_HEAD: .55, CLEAR_BEHIND: .32, TACKLE_CD: 1.4, FOUL_K: 6, RUN_RATE: .28, RUN_T: 2.6, RUN_CD: 3, CARRY_STOP: 3.6, SUP_N: 5, SUP_OPEN: 1.0, SUP_LANE: 1.5, SUP_REACH: .08, SUP_SHAPE: .12, SUP_PROG: 25, SUP_EVERY: .35, MARK_FAR: 78, MARK_ZONE: 34, TAKEON_R: 2.4, TAKEON_P: .5, TAKEON_STUN: .9,
        // oyuncu beyni (kişilik + bağlam): BR_ON=0 → herkes aynı karar ağırlıklarını kullanır. Diğerleri özelliğin (z-puanı) karar ağırlığına etkisi
        OB_ON: 1, OB_CHK: .16, OB_DIAG: 1, OB_3M: .5, OB_UND: .06, OB_LATE: .6, OB_TRIG: 1, OB_TRP: 3, OB_NEAR: 1,      // [ob] topsuz hareket: gelip gösterme, çapraz koşu, üçüncü adam, içeriden bindirme, geç gelen orta saha, pres tetikleyicileri
        BR_ON: 1, BR_DRIB: .06, BR_SHOOT: .06, BR_SMIN: .05, BR_PROG: .12, BR_RISK: .08, BR_LONG: .5, BR_URG: .5, BR_OVL: .04, BR_RUNP: .3, BR_MARKQ: .12, BR_GS: .12, BR_SEE: .3,               // karar sonrası bekleme: A + B·rastgele (sn); topu tutma sınırı (sn)
        // karar KALİTESİ: DEC_ON=0 → eski davranış (seçim her zaman matematiksel en iyisi; sadece YÜRÜTME özelliğe göre hataya açık, hangi seçeneğin seçildiği değil).
        // DEC_ON=1 iken vizyon+pozisyon alma+pas tekniğinden türeyen bileşik özellik (70 nötr, K eğrisiyle aynı mantık) her karara (pas hedefi SEÇİMİ, pas/şut/çalım/uzaklaştırma eylem SEÇİMİ) gürültü ekler:
        // düşük özellikli oyuncu sadece daha kötü vurmaz, GERÇEKTEN daha kötü bir seçenek seçer; yüksek özellikli oyuncu neredeyse hep matematiksel en iyisini bulur.
        DEC_ON: 1, DEC_G: .35, DEC_MISS: .09, DEC_ACT: .035,
        KY_ON: 1, KY_SW: .95, KY_MIN: .014, KY_LON: .006, KY_EPV: 1, KY_EPS: .8,      // [ky] EPV agi karisimi, olcegi (.8: gol 2.95, sut 24)      // [ky] sut karari ogrenilmis xG ile: agirlik, esik, uzaktan sut becerisi
        // hakem: CARDS=0 / VAR=0 → kart ve VAR tamamen kapalı (simülasyon eskisiyle aynı). Y_*: sarı kart olasılığı, R_*: doğrudan kırmızı, VAR_*: incelemeler
        CARDS: 1, VAR: 1, Y_BASE: .09, Y_EXP: 1.35, Y_AGAIN: .08, Y_POS: 1, R_SERIOUS: .0009, R_DOGSO: .35,
        VAR_MARG: 1, VAR_RND: .05, VAR_CANCEL: .5,                  // gol: ofsayt bandı (m, içerideki yakın konumlar da incelenir) · rastgele faul/el kontrolü · onun iptal oranı
        VAR_PEN: .3, VAR_PEN_NO: .3, VAR_PEN_OUT: .3,               // penaltı: incelenme oranı · incelenenlerin iptal oranı · iptallerin "faul ceza sahası dışında" payı (serbest vuruş)
        VAR_RED: .55, VAR_RED_DOWN: .2, VAR_UP: .2,                 // kırmızı: kontrol edilme oranı · kontrol edilenin sarıya çevrilme oranı · DOGSO'da verilen sarının kırmızıya çevrilme oranı
        // --- [var] VAR olaylara bağlı: VAR2=0 → eski (golde rastgele faul / el kontrolü, penaltıda rastgele 'temas yok' / 'dışarıda' iptali, kırmızıda sabit sarıya düşürme / kırmızıya çevirme oranı) ---
        // VAR yalnız sahadaki hakemin hatasını düzeltir (IFAB: açık hata); karar simülasyonda olan bir şeye dayanır, hakem hatası hakem akışından (RR):
        // gol: yalnız hücum evresinde (APP) kayıtlı, çalınmamış bir hücumcu faulü varsa incelenir. Hava topunu kolunu kullanarak kazanan oyuncunun (airFoul) çalınmayan teması kaydedilir:
        //   VAR_AFM·pF olasılıkla kaçan faul (hakem faulün ~1/3'ünü kaçırır: .5·pF / (1 − pF) ≈ .6·pF; gol iptal, serbest vuruş faulün yerinde), kalanı kol teması (kontrol, gol geçerli) · elle oynama modeli yok: 'el' incelemesi yok
        // penaltı: ceza sahasında önden, topa temiz uzanarak (tkG.ex · tkG.ca) kazanılan müdahalede hakem VAR_PWR·ex·ca olasılıkla yanlış penaltı çalar → VAR iptal (temiz müdahale, düşen top) ·
        //   ceza sahası çizgisine 1 m'den yakın, DIŞARIDAKİ faulde hakem VAR_EDGE·(1 − uzaklık) olasılıkla penaltı der → VAR iptal, serbest vuruş faulün gerçek yerinde ·
        //   doğru penaltılar VAR_PEN oranında görünür kontrolden geçer (onay; iptal yok)
        // kırmızı: sarıya düşürme olasılığı VAR_CK · hakem hatası payı (sert: .2 / (.2 + 2,5·sev²), yani hakemin kırmızı olasılığında sertlikten gelmeyen pay; son adam: (.7 − dogso) / .3);
        //   düşürülmeyen kırmızı VAR_RED oranında görünür onay · net gol pozisyonunda verilen sarı VAR_CK · (dogso − .5) / .4 olasılıkla kırmızıya çevrilir
        VAR2: 1, VAR_AFM: .6, VAR_PWR: .06, VAR_EDGE: .06, VAR_CK: .9,
        // serbest vuruş barajı: WALL=0 → baraj yok (eski davranış) · topa uzaklık (m; IFAB en az 9,15) · oyuncu aralığı (m) · barajın şutu tutma olasılığı = B0 + B1·kişi (vuruşçu becerisine göre ±)
        WALL: 1, WALL_D: 9.5, WALL_SP: .74, WALL_B0: .05, WALL_B1: .066, WALL_WAIT: 9,
        // maç uzunluğu (fiziksel sn). 5400 = gerçek zamanlı 90 dk (eski davranış); daha kısa değer saati CLOCK_S'e ölçekler
        MATCH_S: 1400,
        // takım talimatları (create({tactics:[{ment,tempo,line,press,width,gk},…]}) ya da sim.setTactics ile; her biri −1/0/+1, 0 = eski davranış BAYT BAYT AYNI). TAC=0 → hepsi kapalı.
        // MT_*: mentalite (kayıp maliyeti / ileri oyun / şut / çalım isteği, takım bloğunun kayması, koşu sıklığı) · TP_*: tempo (karar süresi, pas hatası, koşu sıklığı)
        // LN_*: savunma çizgisi (savunma hattı ve ön libero kayması, kale önü blok derinliği, kaleci çıkışı) · PR_*: baskı (baskı yarıçapı, uzanma, müdahale isteği, kapatma) · WD_*: genişlik (kanat ve bekler dizilişi)
        // GKD_*: kaleciden oyun kurma (aut ve eldeki topta uzun pas payı, uzun seçeneği tercih cezası). Ayrı bir yorgunluk bedeli yok; [fatigue] açıkken baskı/tempo daha çok koşu, o da daha çok yorgunluk demektir.
        TAC: 1, MT_LOSS: .22, MT_PROG: .32, MT_SHOT: .18, MT_SMIN: .09, MT_DRIB: .16, MT_PUSH: 7, MT_D: 3, MT_RUN: .5, MT_XG: .3,
        TP_THINK: .4, TP_ERR: .008, TP_MISS: .012, TP_RUN: .45, TP_PSPD: .12,
        LN_X: 6, LN_DM: 3, LN_D: 4, LN_GK: 3, LN_RUN: .8, LN_XG: .28,
        PR_D: .45, PR_R: .6, PR_E: .32, PR_PUSH: 6, PR_COVER: 8, PR_STUN: 1, PR_XG: .15,
        CT_T: 11, CT_M: .6, CT_L: .5, CT_P: .25, CT_D: .2, CT_PROG: .8, CT_RUN: 1.3, CT_XG: .7, CT_SHOT: .55,
        WD_Y: .28, WD_CROSS: .6, WD_XG: .06, GKD_L: .45, GKD_W: 12,
        // güçlü / zayıf ayak: FOOT=0 → herkes her vuruşu güçlü ayağıyla yapar, isabet çarpanı yok (eski davranış; ayak seçimi ana R() dizisini
        // hiç tüketmediği için maç akışı da bayt bayt aynı). FOOT_NP / FOOT_NS: ayak çarpanlarının lig ortalaması (pas / şut; gerçek FC 27 kadrolarıyla
        // 120 maçta ölçüldü, dev/foot_calib.js) - bölünerek takım geneli isabet kalibrasyonu korunur
        FOOT: 1, FOOT_NP: 1.045, FOOT_NS: 1.035,
        // --- [move] hareket fiziği: MOVE=0 → eski hareket (sabit ivme, anında dönüş) BAYT BAYT AYNI ---
        // ileri ivme a(v) = A0·(1 − (v / (MV_TAPER·Vmax))²) (hız arttıkça azalır; tam hıza ~2-3 sn) · fren en fazla MV_BRK m/sn² · yanal ivme MV_LAT0·(1 − MV_LATV·(v/Vmax)²) (sürtünme elipsi: hızlıyken keskin dönemez)
        // gövde dönüş hızı MV_TURN0 (dururken) → MV_TURN1 (sprintte) rad/sn · gövdeye göre geri / yan hareketin hız tavanı MV_BACK / MV_SIDE · topsuz hedef yumuşatma MV_SMOOTH sn, durma bandı MV_DEAD m
        // MV_ARR: hedefe yaklaşırken frenin ne kadarı kullanılır · MV_COLL: oyuncular birbirinin içinden geçmez (gövde çarpışması, güce göre itilme)
        // MV_SEP: aynı noktadaki iki oyuncu (devre başında santrada aynı yere dizilen forvet ve 10 numara) birim normalle ayrılır (0 = eski: normal 1000 kat, oyuncu tek adımda sahanın öbür ucuna fırlıyordu)
        MOVE: 1, MV_TAPER: 1.03, MV_BRK: 6.6, MV_LAT0: 7.4, MV_LATV: .42, MV_TURN0: 10, MV_TURN1: 3.4, MV_BACK: .52, MV_SIDE: .78, MV_SMOOTH: .3, MV_DEAD: .6, MV_ARR: .7, MV_ARRS: .3, MV_ARRB: 5, SH_TAU: .6, MV_BIG: 1,      // [dinamik]
        MV_COLL: 1, MV_SEP: 1,
        // --- [ais] topsuz oyun kararlılığı: AIS=0 → eski davranış. Takım bloğu topu AIS_LAG sn gecikmeyle izler (her pasta 22 kişi birden depara kalkmaz) ·
        // acil olmayan yer değiştirmede ivme AIS_EFF katı (jog) · kovalayan (AIS_CH sn), baskı yapan (AIS_PR m) ve destek hücresi (AIS_SUP puan) için histerezis: rol küçük farkla el değiştirmez
        AIS: 1, AIS_LAG: .7, AIS_EFF: .35, AIS_CH: .25, AIS_PR: 2, AIS_SUP: 1.5,
        // --- [ball] 3B top: BALL3D=0 → eski düz top (yükseklik yalnız görüntü, yüksek top inişte ölür) BAYT BAYT AYNI ---
        // yüksek top balistik yayla gider ve hedef noktaya BL_HZ (m) yükseklikte (baş/göğüs) varır; orada kimse kazanmazsa düşüp seker (sekme katsayısı BL_E, yatay hız payı BL_HRET; BL_BMIN m/sn altı sekme yok, yuvarlanır)
        // top BL_CTRLZ m altındayken ayakla/göğüsle alınabilir · şut: hedef yükseklik SH_AIMZ0..SH_AIMZ1 m, dikey sapma = yatay açısal sapma × mesafe × SH_VK (üstten auta, üst direk, alçak/yerden şut)
        MG_PH: 1,      // [motor] dokunus temas evresinde
        KR_FT: .45,      // [karsila] ilk dokunus mesafesi (govde merkezinden)
        PEN_FIX: 1, PEN_S0: .04, PEN_S1: .3, PEN_SD0: .015, PEN_SD1: .05,      // [pen] penalti kurtaris / sapma
        KF_BLK: 1.1, KF_GKR: .1, KF_GKS: .15, KF_GKW: 3, KF_GKB: .4,      // [kafa] kafa sutunu temas noktasina bu kadar yakin savunmaci bloklayamaz (duello rakibi)
        SU_PH: 1, SURME: 1, SU_N1: 3, SU_N2: 7, SU_GB: .06,      // [surme] GASP evresi; dokunus adim sayisiyla planlanir
        BL_ROLL: 1, BL_RD: 1.2, BL_AD: .0108, BL_SLIDE: 1, BL_MUK: .40, BL_R57: .714, BL_LOWV: 2.0, BL_LOWD: .7,      // [motor] yerdeki top: cim yuvarlanmasi (mac cimi, lab ayari) + hava direnci
        BALL3D: 1, BL_G: 9.81, BL_HZ: 1.8, BL_E: .55, BL_HRET: .78, BL_BMIN: 1.2, BL_CTRLZ: 1.1, SH_VK: .4, SH_AIMZ0: .15, SH_AIMZ1: 1.9,
        // [ball] düzeltmeleri (her biri 0 = eski yol aynen):
        // SH_VFIX: şutun dikey hızı topun sahadan ilk çıkacağı noktaya (kale çizgisi ya da taç çizgisi, hangisi önce) kadarki yola göre seçilir; varış süresi 2·DT..SH_TMAX sn, hedef yükseklik ≤ SH_ZMAX m,
        //   dikey hız ≤ SH_VZMAX m/sn; dikey sapma kaleye uzaklıkla ölçeklenir, 8 m'den yakın şutta hedef yükseklik küçülür (eskiden çizgiye paralel şutta top yüzlerce metre yükseliyordu)
        // BL_HFIX: yüksek topun hızı topun gerçek başlangıç noktasından ve ayrık adım sayısından (yarı örtük Euler) hesaplanır: top iniş noktasına tam BL_HZ yükseklikte, ilan edilen adımda varır
        //   (eskiden diz hizasında ve noktanın ~1,3 m ötesinde varıp geri çekiliyordu) · uçuş boyunca çizgi denetimi: havada çizgiyi geçen top oyun dışıdır (IFAB 9)
        // POSTN: direk dikey silindir (yarıçap .06 m, merkezi kale ağzının kenarında): top temas noktasında normal boyunca BL_E ile yansır, teğet hızın %88'i kalır (içten çarpan top kaleye girebilir)
        // BL_EDGE: çizgi bandında (.3 m) duran ya da sürünen top kovalanabilir (yalnız çizgiyi geçen ya da çizgiye doğru giden top kovalanmaz) · yerdeki .02 m/sn altındaki top durur
        SH_VFIX: 1, SH_TMAX: 2.5, SH_ZMAX: 6, SH_VZMAX: 14, BL_HFIX: 1, POSTN: 1, BL_EDGE: 1,
        // BL_AERO: yüksek top havada sürüklenme (Cd .45 → .25, 10-14 m/sn sürüklenme krizi) ve BL_SPIN dev/sn ters dönüşün kaldırmasıyla (Magnus, CL = .9·rω/v ≤ .35) uçar;
        //   iniş noktası, iniş adımı ve iniş yüksekliği (BL_HZ) aynı kalır (fırlatma hızı ayrık adımlarla çözülür) - daha düz kalkış, alçak tepe, inişte yavaş top (Unity PhysX referansı)
        BL_AERO: 1, BL_SPIN: 6,
        // BL_FIFA: sekme FIFA çim deneylerine göre (2 m'den dikey sekme .60-1.00 m; 50 km/sa, 15° açılı sekmede yatay hız payı %45-70): BL_E2 / BL_HRET2 (0 = BL_E / BL_HRET aynen)
        BL_FIFA: 1, BL_E2: .60, BL_HRET2: .68,
        // [v137] CURL: yan dönüş (falso) uçuşu. Ayak içiyle vuruşta sağ ayaklı topu soluna, sol ayaklı sağına kıvırır (devir/sn, işaret > 0 = gidişin soluna).
        //   Büyüklük = taban × beceri (orta: cor/pas, uzun pas: pas, frikik şutu: fk, uzaktan şut: lon) × zayıf ayak CU_WEAK; yanal Magnus ivmesi ½ρC_L·A·v²/m
        //   (C_L = .9·rω/v ≤ .35, BL_AERO ile aynı model). Yüksek topta aeSolve iniş noktasını, şutta cuShotAim kale çizgisindeki hedefi korur (yalnız eğri yol).
        //   CU_CROSS orta/korner, CU_LONG uzun havadan pas (≥ CU_LD m), CU_FK doğrudan frikik şutu, CU_LS uzaktan şut (CU_LS0 m'den başlar, +10 m'de tam); CU_GND yerde sürünen şuttaki pay.
        //   CURL=0 → eski düz uçuş BAYT BAYT AYNI. Top durumu B.sps (devir/sn) - çizici kullanabilir.
        CURL: 1, CU_CROSS: 7, CU_LONG: 4, CU_LD: 25, CU_FK: 8, CU_LS: 5, CU_LS0: 14, CU_GND: .4, CU_WEAK: .7,
        // [v137] AGIL: dönüş hızı (MV_TURN0/1) ve yanal ivme (MV_LAT0) oyuncunun çevikliğiyle (a.agi; yoksa .4·hızlanma + .35·denge + .25·top sürme) ölçeklenir:
        //   k = 1 + AG_K·(çeviklik − AG_C), ±AG_MAX ile sınırlı; kaleci 1. AGIL=0 → eski hareket BAYT BAYT AYNI.
        AGIL: 1, AG_C: 70, AG_K: .012, AG_MAX: .2,
        // [v137] WX: hava / zemin seti ('dry' = bugünkü değerler aynen; 'wet' ıslak: top kayar ve hızlı akar, alçak seker; 'heavy' ağır/çamurlu: çabuk durur, ölü seker;
        //   'wind' rüzgâr: yüksek topta göreli hava hızıyla sürüklenme, WX_WS m/sn, yön tohumdan ya da create({wind:{x,y}})). create({weather}) ile seçilir.
        WX: 'dry', WX_WS: 7,
        // --- [gk] fiziksel kaleci: GKP=0 → eski (kaleci topun geleceği yeri şut anında bilir, kurtarış olasılığı xG formülünden) ---
        // yer tutma: top ile kale ortası arasındaki çizgi üzerinde (açı ortası) · tepki GK_REACT sn (refleksle ±) · plonjon uzanması GK_DIVE m/sn hızla en fazla GK_DMAX m, ayakta erişim GK_R0 m
        // top kalecinin düzleminden geçerken erişim içindeyse kurtarış olasılığı = GK_S0 + GK_S1·(1 − uzaklık/erişim) + beceri − hız cezası (vücuda yakın top kolay, uç köşe zor)
        GKP: 1, GK_REACT: .18, GK_DIVE: 7, GK_DMAX: 2.2, GK_R0: 1.1, GK_S0: .65, GK_S1: .4,
        // GK_CPA: kurtarış kararı topun kaleciye en yakın geçeceği noktadaki ıska mesafesine göre (top erişim küresine girdiğinde o anki merkez uzaklığına göre değil; .3 sn ileriye doğrusal yol);
        //   çelmede top temas noktasında kalır (kaleci düzlemine ışınlanmaz) · 0 = eski
        // GK_BOX: kaleci elle yalnız kendi ceza sahasında oynar: dışarıdaki kaleci hava topunda saha oyuncusu gibi (kafa/güç/hız) yarışır, topu tutamaz (CLAIM yok) · 0 = eski
        GK_CPA: 1, GK_BOX: 1,
        // GK_SET: top kalesine GK_SETD m'den yakınken kalecinin yer tutması (açı ortası; top uçarken ön direk tarafı) saha oyuncusunun topsuz yer değiştirmesi gibi işlemez:
        //   hedefi GK_SETT sn'de okur (eski .3 sn yumuşatma yerine), durma bandı GK_SETB m (eski .6-1,1 m), ivmesi GK_SETA kat (eski .35 kat koşar adım; .45 ≈ 2,9 m/sn² yan adım, depar çıkışı değil) - kaleci küçük ayar adımlarıyla açıyı kapatır,
        //   ama topun hızlı yer değişiminde (geri pas, orta) yine biraz geç kalır · 0 = eski
        GK_SET: 1, GK_SETD: 35, GK_SETT: .3, GK_SETB: .2, GK_SETA: .45,
        // --- [touch] top sürme ve ilk dokunuş: TOUCH=0 → eski (top ayağın .55 m önüne yapışık, alma her zaman temiz) ---
        // top sürerken top her dokunuşta açılır ve oyuncu ona yetişir: açıklık TC_GMIN + TC_GV·hız·(1.25 − top sürme/200) m'ye kadar, dokunuş aralığı hıza göre (.38–1.1 sn)
        // pas/şut kararı top ayağa yakınken verilir · ilk dokunuş: sert gelen (hız > 8 m/sn), yerden sekmiş, baskı altında alınan topta kontrol kaçabilir (TC_HEAVY + TC_HV·(v − 8) …, teknikle üstel azalır)
        TOUCH: 1, TC_GMIN: .35, TC_GV: .2, TC_HEAVY: .01, TC_HV: .005,
        // TC_SLINE: şutun isabet çizgisi (cy), isabet bayrağı ve kalecinin kayacağı nokta topun gerçek çıkış noktasından (ayaktaki top) hesaplanır; dikey hız ayrık entegrasyona göre (+g·t·DT/2),
        //   'üstten' eşiği gol koşuluyla aynı (cz < GH) · 0 = eski
        // TC_RCV: alınan top bir sonraki adımda ayağın önüne ışınlanmaz: alıcıya göre konumu en çok TC_SNAPV m/sn ile bakış yönündeki yerine gelir (arkadan gelen top gövdenin yanından dolanır),
        //   havadan alınan top yerçekimiyle düşer, oyuncu top ayağa inene dek (en çok .5 sn) bekler · 0 = eski
        // TC_OFF: kötü ilk dokunuş da topa dokunmaktır: ofsayt burada değerlendirilir (yan hakem, RR), ofsayt kaydı dokunuştan yenilenir, süren şut kaydı kapanır (arkadaş: dışarı, rakip: blok) · 0 = eski
        TC_SLINE: 1, TC_RCV: 1, TC_SNAPV: 7, TC_OFF: 1,
        // [carry] fiziksel top surme (Unity DribbleRef): kayma surtunmesi CR_MUG (mu g), cim yuvarlanma CR_RD, hava CR_KD (m/sn^2 / v^2), itiste ileri donus kaybi CR_SPIN,
        // dokunus mesafesi CR_G0 + CR_G1*hiz, acik alanda uzun dokunus CR_OPEN, erisim CR_REACH (m), kontrol kaybi CR_LOSE (m)
        TC_PHYS: 1, CR_MUG: 5.4, CR_RD: .74, CR_KD: .0239, CR_SPIN: .29, CR_G0: .42, CR_G1: .02, CR_OPEN: .5, CR_REACH: .95, CR_LOSE: 4.2, CR_STEER: 1, CR_KV: 0,
        // [knock] vur-koş: boş alanda hızlı/iyi top süren oyuncu topu önüne itip depara kalkar (hız çarpanı, en yakın rakip, döngü ve açıklık çarpanı)
        KNOCK: 1, KN_SF: .95, KN_OPP: 4.5, KN_END: 3, KN_TT: 1.7, KN_GAP: .8,
        KN_RUN: 0, KN_STR: 1, KN_CUT: 1,      // [knock] döngüde: rakip yaklaşsa da depar (RUN), kaçma sapması yok (STR), vur-koş bitince döngü normal sürede biter (CUT)
        // --- [offs] ofsayt (IFAB Kural 11): OFFS2=0 → eski (yalnız pasın hedeflediği oyuncu, çizgi pasçının konumundan) ---
        // pas/şut/uzaklaştırma anında ofsayt konumundaki bütün takım arkadaşları kaydedilir; kurtarış, blok ya da direkten dönen top bu kaydı silmez, rakibin topu kontrol etmesi siler
        OFFS2: 1, AR_MISS: .15,
        // AR_MISS: yan hakemin açık ofsaytı (pay > .2 m) kaçırma olasılığı, pay büyüdükçe üstel azalır; hedef olmayan oyuncu / dönen topta daha sık kaçar.
        // Kaçan ya da tolerans içinde (≤ .2 m) kalan ofsayt hücum evresine (rakip topu kontrol edene / top ölene kadar) yazılır; gol olursa VAR inceler ve golü iptal eder
        // OFFS_AIR: hava topunda ofsayt konumundaki hücumcu düelloya girerse (iniş noktasına 2,8 m'den yakın, pasın hedefiyse 3,4 m) savunma kazansa da ofsayttır (rakibe müdahale, IFAB 11) · 0 = eski
        // VAR_OG: VAR kendi kalesine golde ve penaltı kararında da hücum evresindeki (APP) kaçan ofsayta bakar (penaltı iptal: ofsayt yerinde endirekt serbest vuruş) · 0 = eski
        OFFS_AIR: 1, VAR_OG: 1,
        // --- [tackle] müdahale ve faul: TACKLE=0 → eski (anlık zar: yalnız özellik farkı; DOGSO yalnız kaleyle arasındaki savunmacı sayısından) ---
        // savunmacının topçuya göre konumu (topçunun hareket yönüne, yavaşken bakışına göre önden · yandan · arkadan), gövdesinin topa dönüklüğü, göreli hız ve topun ayaktan açıklığı
        // kapma ve faul olasılığını belirler: önden ve topa bakarak iyi kapar, az faul yapar; arkadan (top gövdeyle korunur) az kapar, çok faul yapar; hızla dalan kolay geçilir, sert girer
        // TK_ENG: arkadan, top korunurken müdahaleye girme isteği (çoğu savunmacı ayakta kalıp bekler) · kaçan müdahale: savunmacı TK_STUN0..TK_STUN1 sn dengesiz (açı ve hıza göre) · TK_FOUL: faul ölçeği
        // hakem (IFAB 12): DOGSO = kaleye uzaklık × oyunun yönü × topun kontrolü × kapatan savunmacı yokluğu; TK_DOG: açık DOGSO'da kırmızı olasılığı
        // ceza sahasında topa oynama girişimiyle yapılan DOGSO kırmızı değil sarı (2016 çifte ceza kuralı) · TK_SER: ciddi faul (sertlik: arkadan + hız) · TK_Y: sarı ölçeği
        // TK_WIN: girilen (dalınan) baskı müdahalesinde kapma tabanı çarpanı (eski çekişme "girmeden yanında koşma"yı da sayıyordu; artık her çekişme gerçek bir hamle)
        TACKLE: 1, TK_ENG: .45, TK_WIN: 2, TK_STUN0: .3, TK_STUN1: .7, TK_FOUL: 1.35, TK_DOG: .9, TK_SER: .0012, TK_Y: 1.3,
        SL_ON: 1, SL_R: 2.2, SL_P: .3, SL_W: .8, SL_F: .45, SL_STUN: 1.2,      // [sav] kayarak mudahale: erisim, girme istegi, kapma tabani, faul carpani, kacinca yerde kalma
        // TK_SPAPEN: ceza sahasında topa oynama girişimiyle yapılan SPA faulü: penaltı yeter, SPA sarısı yok (IFAB 12; DOGSO payı aynen) · 0 = eski
        TK_SPAPEN: 1,
        // --- [fatigue] yorgunluk: FATIGUE=0 → eski (tükenme yalnız hız²'den ve çok küçük; dayanıklılık (sta) etkisiz; anaerobik yorgunluk ve devre arası toparlanması yok) ---
        // uzun süreli kondisyon p.stam: tükenme = FT_K · ((hız/Vmax)² + FT_KA · sert hızlanma (hızlanma/A0 − .2)) · dayanıklılık çarpanı (1 − FT_STA·(sta − 80)/15; yüksek sta yavaş yorulur), maç saatine ölçekli (CK)
        // harcananın FT_IRR kadarı kalıcıdır (tavan p.stamCap düşer); kalanı yürürken / top ölüyken tavana toparlanır (FT_REC, maç saniyesi başına) · devre arasında kalıcı kaybın FT_HT kadarı geri gelir
        // kısa süreli (anaerobik) depo p.ana (W' dengesi gibi): kritik hızın (FT_AHI·Vmax) üstündeki hız ve sert hızlanma en çok FT_AD/sn boşaltır; kritik hızın altında FT_AT sn zaman sabitiyle dolar (arka arkaya deparlardan sonra birkaç sn)
        // etkiler: azami hız (eski .82 + .18·stam) × (1 − FT_AV·boşluk²) · ivme × (1 − FT_A·yorgunluk) × (1 − FT_AA·boşluk²) · fren · çalım ve arkaya koşu isteği (FT_RUN) · pası okuma / kesmeye çıkma tepkisi +FT_RX·yorgunluk sn (yorgun savunma pası geç okur; fiziksel yavaşlamanın azalttığı boşluğu maç sonunda yeniden açar)
        // savunmada: markaj ağırlığı × (1 − FT_MK·yorgunluk) (yorgun markajcı adamını bırakıp bölgeye döner) · deposu FT_EA altındaki oyuncu koşucuyu deparla izlemez, top kaybında geri dönüşte depar atmaz (efor politikası)
        // FT_RN: rol yükü - oyuncunun kondisyonu rolünün tipik eforuna (FT_ROLE, kaleci için saha ortalaması) göre hazırlanmıştır: tükenme × (saha ortalaması / rol eforu)^FT_RN (gerçekte son 15 dk'daki yoğunluk düşüşü her mevkide benzer oranda)
        // FT_PACE: tempo ayarı - acil olmayan yer değiştirmede (destek, diziliş, bölgeye dönüş) deposu dolu olmayan oyuncu kritik hızın üstüne çıkmaz (depo .8 altındaysa tavan FT_AHI·Vmax, doluya doğru kalkar); deparını asıl ana saklar
        // FT_BK: yorgun hücum oyuncusu (kanat, 10 numara, forvet) top kaybında geri dönüş hızını FT_BK·yorgunluk kadar düşürür (enerjisini hücuma saklar; maç sonunda oyun uzar)
        FATIGUE: 1, FT_K: .00023, FT_KA: 4, FT_STA: .45, FT_IRR: .5, FT_REC: .004, FT_HT: .3, FT_A: .1, FT_AHI: .7, FT_AD: .2, FT_AACC: .5, FT_AT: 10, FT_AV: .15, FT_AA: .35, FT_RUN: .8, FT_RX: 2.5, FT_MK: 1.5, FT_EA: .55, FT_BK: 1, FT_RN: .7, FT_PACE: 1,
        // --- [aical] oyun mantığı gerçekçiliği: AICAL=0 → eski davranış BAYT BAYT AYNI (orta başarısı sabit çarpan PP_CROSS, topun 1 m yakınından geçen rakip pası her zaman temiz alır, kaleci yalnız top 14 m'den yakınken kovalar,
        //     pasçı ofsaytı anlık ve kesin görür, şutu yalnız ilk yakındaki savunmacı BLOCK_P ile bloklar, sapan topa kaleci tepki vermez, hava topunda faul yok) ---
        // PAS · isabet (elit eğri açıkken): yön sapması ve kötü vuruşta beceri payı üstel - her +10 pas puanı hatayı exp(−AC_PK) katına indirir (pas 80'de eski değer)
        //   kesme çekişmesi: pasın yolundaki rakip topa ancak ayağı yetişirse dokunur - gövdenin .35 m içinden geçen top hep; ötesinde uzanma AC_IR m (savunma becerisi her +10 puanda exp(AC_IS), pasçı tekniği exp(−AC_IP), topun hızı)
        //   dokunduysa temiz alma olasılığı AC_IC (hız ve uzanma payıyla düşer); alamazsa top seker, pas biter (gövdeden geri yansır, ayaktan sıyırıp uzağa gider) · kendi ceza sahasında savunmacı bloklamaya adanır (uzanma × AC_IBX, temiz alma × .7)
        //   topa sahip olmanın değeri: kayıp maliyetine AC_PV·exp(AC_QK·(takım gücü − rakip gücü)/10) eklenir (güç: saha oyuncularının teknik + savunma ortalaması, eksik oyuncuyla düşer) - güçlü takım sabırlı oynar, zayıf takım daha doğrudan
        //   ofsayt algısı: pasçı kararını AC_PL·(1,6 − vizyon/100) sn önceki görüntüye göre verir (koşucu ve savunma çizgisi o arada yer değiştirir) - erken koşu / geç pas gerçek ofsayt üretir
        // ORTA · inanç fiziksel: iniş noktasındaki hava düellosu (resolveAerial ağırlıkları; alıcı, AC_XRX sn geç tepki veren savunmacı, iniş noktası yakınındaki markajcılar, yetişebilen kaleci AC_GKW kat) × düşme noktası isabeti
        //   orta bölgesi kale çizgisine kadar; kale çizgisine AC_LOWD m'den yakın ortacı topu yerden de gönderebilir (hangisinin başarısı yüksekse) · kanat / bek son 45 m'de topla koşarken güçlü ayağı çizgi tarafındaysa AC_LT, değilse AC_LI olasılıkla çizgiye iner
        //   ceza sahasına giriş (ortaya hazırlık) top kanattan yaklaşırken başlar · yükselen yüksek top (z < 1,9 m) yanından geçtiği rakibe AC_XB olasılıkla çarpar (bacaktan sekip havalanır; çoğu korner / taç)
        //   markajcı hava topuna çıkar: kendi ceza sahasına inen yüksek topta adamı iniş noktasına AC_AGD m'den yakın markajcı AC_XRX sn sonra iniş noktasına (kale tarafında .5 m) koşar (eski: adamını 2,4 m geriden izliyordu)
        // HAVA TOPU / KALECİ · kaleci kendi ceza sahasında kale çizgisine AC_GKD m'ye kadar (pozisyon alma ±) inen yüksek topa kaleci tepkisiyle (gkReact; eski: pas okuma tepkisi INT_REACT) yetişebiliyorsa çıkar, düelloda elleriyle AC_GKW kat üstün
        //   kendi ceza sahasında rakibin yüksek topunu kazanan savunmacı AC_CH olasılıkla kafayla uzaklaştırır; kendi kalesine dönükse çoğunlukla arkaya (AC_CB·dönüklük + .12): temas noktasından direğin 1-5 m dışına (± .12 rad)
        //   ceza sahasında kaleye 14 m içinde hava topunu kazanan hücumcu AC_HSH olasılıkla kaleye kafa vurur (eski .55; kalanında topu indirir)
        //   kafa vuruşunun hızı AC_HV m/sn (kafa ve güçle ±; ölçülen kafa şutları 13-19 m/sn; eski: ayakla şutun 6 m/sn altı)
        //   çekişmeli hava düellosunda (rakip 1,6 m içinde) faul: AC_AF·agresiflik·güç farkı - %65 kaybeden (tutma / itme), %35 kazanan (kol); kaleciyi iten hücumcu da · savunmacının kendi ceza sahasındaki tutması çoğunlukla çalınmaz
        //   sarı: AC_AFY·(agresiflik/45)^Y_EXP (+ ısrarlı faul), hakem akışından (RR)
        // ŞUT BLOĞU · topun o adımda geçtiği yoldaki her savunmacı (şut başına bir kez) denenir: gövdesinin önünden (.33 m) geçen topu AC_SBB olasılıkla keser (geri yansır)
        //   bacakla (top 1 m'den alçaksa) uzanma AC_SBR + AC_SBV·(varış − .15 sn), en fazla 1,9 m; olasılık AC_SBL·(uzaklıkla azalan)·beceri·dönüklük (top hızını yitirip yana sapar, yukarı sıçrayabilir; çoğu korner) · baraj eski yolda
        //   bloklayamayan bacak AC_ST·(1 − uzaklık payı) olasılıkla hafifçe değer (± .1 rad, hızın %85-95'i; son dokunan savunmacı → dışarı giderse korner) · yolda bloklayamadığı hızlı şutu savunmacı ancak .65 − .045·(hız − 8) olasılıkla kontrol eder
        //   sapan top (blok, pas kesme sekmesi, hafif dokunuş) kaleye gidiyorsa kaleci yeniden tepki verir; isabetli şut sapıp girerse gol şutçunundur
        FIN_ON: 1, FIN_AIM: 1, FIN_CL: 1, FIN_EARLY: 1, FIN_GK1: 1,      // [fin] şut kalitesi ve zamanlaması
        AICAL: 1, AC_XRX: .35, AC_GKW: 1.1, AC_GKD: 10, AC_XB: .5, AC_LT: .75, AC_LI: .3, AC_IR: .75, AC_IC: .8, AC_PV: .02, AC_QK: 2, AC_PK: .5, AC_PL: .22, AC_LOWD: 12, AC_IS: .15, AC_IP: .08, AC_CH: .85, AC_CB: .6, AC_IBX: 1.35, AC_HV: 15.5, AC_SBB: .9, AC_SBL: .55, AC_SBR: 1.05, AC_SBV: 3, AC_AGD: 4, AC_AF: .16, AC_AFY: .08, AC_ST: .35, AC_HSH: .75,
        // --- [air] hava topu hedefi: AIR_TGT=0 → eski (kovalayan inişten sonraki ilk yörünge örneğine koşar, düelloya iniş noktasına 3,4 m'deki herkes girer, kafa vuruşu hep 2 m'den ve gövdenin önünden başlar) ---
        // inişe yetişebilen oyuncu tam iniş noktasına iniş anında koşar · düelloya (ceza sahasındaki kaleci dışında) yalnız iniş noktasına AIR_R m'den yakın (baş + sıçrama erişimi) oyuncular girer;
        // kimse yoksa top düşer ve seker · kafa vuruşu topun temas yüksekliğinden ve temas noktasından başlar
        AIR_TGT: 1, AIR_R: 1.8,
        // --- [dead] duran toplar (her biri 0 = eski yol aynen) ---
        // DEADB: top ihlal / yerleştirme noktasında kalır (vuruş anında vuruşçunun önüne ışınlanmaz; IFAB 13/14), vuruşçu topun .5 m arkasına gelip vurur (taç hariç)
        // PEN14: penaltı (IFAB 14): vuruşçu noktanın 2,5 m gerisinde bekler, düdükten 1 sn önce topa koşar · savunan kaleci kale çizgisinde · iki takımın ceza yayı yuvaları iç içe (aynı noktaya iki oyuncu dizilmez)
        // DEADGK: kornerde / penaltıda hücum eden takımın kalecisi kendi kalesinin önünde kalır (eskiden rakip kaleye koşuyordu)
        // DEADSH: ölü top dizilişinde savunan takım rakip topa sahipken kurduğu şekle dizilir (eskiden iki takım da 'top bizde' şekli: oyun başlayınca savunma bloğu ~4 m geri kaçıyordu)
        // KO_DIST: başlama vuruşunda başlamayı yapmayan takım topa ≥ 9,15 m (IFAB 8.1); 10 numara ile forvet aynı noktaya dizilmez
        // DEADFB: taçta / serbest vuruşta / kornerde uygun pas bulunamazsa en yakın arkadaşa kısa atış / pas (serbest vuruşta o da yoksa uzaklaştırma); eskiden oyun vuruşsuz başlıyordu
        // TI_FIX: taç atışında top çizginin üstünden (saha içinden) bırakılır ve sahaya doğru gider (eskiden çizgiye dar açıyla atılan top çizgi dışında kalıp rakibe taç oluyordu; IFAB 15)
        // PEN_END: devre / maç sonunda verilmiş penaltı kullanılıp sonucu belli olmadan devre bitmez (IFAB 7.4)
        // CARRYOUT: topla çizgiyi geçen oyuncu topu oyun dışına çıkarır (kırpılmamış konumla denetim; kaleci ve kale ağzı hariç)
        DEADB: 1, PEN14: 1, DEADGK: 1, DEADSH: 1, KO_DIST: 1, DEADFB: 1, TI_FIX: 1, PEN_END: 1, CARRYOUT: 1,
        // --- [fk] doğrudan serbest vuruş kararı: FKD=0 → eski (kaleye 15-28 m'deki her doğrudan serbest vuruş şut) ---
        // şut olasılığı = FKD_A · (xG / .04) · (1 + FKD_SK · (fk − 75) / 25) · (1 − FKD_W · (baraj − 3)), en fazla FKD_MAX (iyi açı / yakın mesafe / usta vuruşçu → şut); kalanında pas / orta (ana akış R)
        FKD: 1, FKD_A: .3, FKD_SK: .8, FKD_W: .1, FKD_MAX: .85,
        // --- [av] v186 açık veri kalibrasyonu (StatsBomb Open Data 34 830 şut / 1401 maç, Metrica Sports örnek izleme verisi; özet sayılar scratchpad acikveri/parametreler.json) ---
        // Her bayrak 0 → eski davranış BAYT BAYT AYNI (yeni rastgelelik ayrı RA akışından; ana R() dizisi bayrak kapalıyken aynen tüketilir).
        // AV_XG: raporlanan xG ve şut kararının inancı gerçek şutlardan uydurulan lojistik model (aynı xgFeat özellikleri), penaltı .751
        // AV_SHOT: şut eşiği AV_SMIN (eski KY_MIN .014), uzaktan şut becerisi AV_SLON, ceza sahasında kafayla kaleye vurma isteği AV_HSH, kaleci kurtarış tabanı AV_GKS0;
        //   ayakla şut hızı AV_SV0 + AV_SV1·şut gücü + 3 m/sn (16 m+) ± N(0, AV_SVSD) (gerçek medyan 22 m/sn; eski 21 + .11·şut ≈ 29,6), hız cezası AV_GKV m/sn'den
        // AV_DRAG: şutun hava direnci gerçek biçimde (½ρC_dAv²/m, C_d .45 → .25 sürüklenme krizi; 25 m/sn'de ≈ 8 m/sn²; eski doğrusal .10·v) — kale çizgisine varış süresi aynı adımlarla çözülür
        // AV_PASS: pas inancı ve yürütmesi veriye göre (uzunluk/baskı/havadan; 45 m+ %37, orta %29): uzun pas cezası, havadan pas düşme noktası sapması, kesme payı
        // AV_GK: kalecinin çizgiden uzaklığı topun uzaklığına göre gerçek izleme verisinden (top 50–55 m'de ≈ 8 m, 65–70 m'de ≈ 13,6 m), arkaya atılan topa çıkış bölgesi buna göre
        // AV_MOVE: ivme / fren / yanal ivme sınırları ve efor politikası izleme verisine göre (yüksek hız payı %3–4,5), çarpışmada hız sönümü fren sınırında
        // AV_OUT: topun oyun dışına çıkması (taç / korner) ve ölü top bekleme süreleri gerçek akışa göre
        // AV_ATTR: Karar Alma (dec), Önsezi (ant), Soğukkanlılık (cmp), Çalışkanlık (wr) özellikleri kararlara (yoksa eski bileşik özellik)
        // AV_TRIG5: pres tetiği 5 "kötü ilk dokunuş" · AV_LATE: son 20 dk geride olan takım daha çok risk/şut, önde olan blok geride
        AV_XG: 0, AV_SHOT: 0, AV_SMIN: .007, AV_SLON: .012, AV_HSH: .9, AV_GKS0: .65, AV_SV0: 15, AV_SV1: .1, AV_SVSD: 2.5, AV_GKV: 24, AV_DRAG: 0,
        AV_PASS: 0, AV_PL0: 25, AV_PL1: .045, AV_PHH: .62, AV_PC0: .8, AV_PERR: .07, AV_PMISS: .03, AV_ISLK: .8, AV_XERR: 1.6,
        AV_GK: 0, AV_MOVE: 0, AV_OUT: 0, AV_ATTR: 0, AV_TRIG5: 0, AV_LATE: 0,
        AV_HL: 0      // canlı mod (005) önemli anlar: gerçek xG ile net fırsat eşiği .15, korner ve 28 m içi serbest vuruş da an (motoru etkilemez)
    };
    // [av] gerçek şut verisinden lojistik xG (IRLS; test log-kayıp .2412, AUC .804 — StatsBomb'un kendi xG'si .2400 / .806)
    var XG_B_AV = [-3.8273, 0.791, 2.0545, -0.8046, 1.567, 0.229, -0.3977, 0.095, 0.2233, 0.0963, -1.6323];
    // [av] kalecinin kale çizgisine uzaklığı (m), rakip topa sahipken, topun kendi kale çizgisine x uzaklığına göre (Metrica izleme, iki maç)
    var GK_DX = [0, 5, 13, 20, 30, 42, 49, 55, 60, 65, 79, 105], GK_DY = [1.2, 1.4, 1.9, 2.2, 3.9, 6.4, 7.9, 9.8, 11.8, 13.6, 17.7, 19];
    var hyp = Math.hypot;
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    /* [v137] hava / zemin setleri: ['*', k] çarpan, ['=', v] değer. Islak çim: yuvarlanma direnci ve kayma sürtünmesi düşer (top kayar, hızlı akar),
       sekme alçak ve yatay hız daha çok korunur (top sekip kaçar). Ağır/çamurlu: direnç yüksek, sekme ölü. Rüzgâr: yalnız yüksek topta göreli hava hızı. */
    var WX_SET = {
        wet: { BL_RD: ['*', .78], BL_MUK: ['=', .28], BL_LOWD: ['*', .7], BL_E2: ['=', .50], BL_HRET2: ['=', .80], CR_RD: ['*', .82], CR_MUG: ['*', .75] },
        heavy: { BL_RD: ['*', 1.45], BL_MUK: ['=', .52], BL_LOWD: ['*', 1.5], BL_E2: ['=', .42], BL_HRET2: ['=', .56], CR_RD: ['*', 1.4], CR_MUG: ['*', 1.15] },
        wind: {}
    };
    function mulberry(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    function segDist(px, py, ax, ay, bx, by) { var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = clamp(t, 0, 1); return hyp(px - (ax + t * dx), py - (ay + t * dy)); }

    // 4-2-3-1 (hücum yönü +x, "sol" = yukarı/−y). [rol, x oranı, y oranı]
    var FORM = [['GK', .035, .5], ['LB', .27, .10], ['LCB', .245, .36], ['RCB', .245, .64], ['RB', .27, .90], ['LDM', .42, .36], ['RDM', .42, .64], ['LW', .60, .12], ['AM', .58, .5], ['RW', .60, .88], ['ST', .72, .5]];
    // [fatigue] rollerin tipik eforu ((hız/Vmax)² + 4·sert hızlanma; FATIGUE=0 ile ölçüldü, dev/eff_role.js) · FT_EM: saha oyuncularının ortalaması (kaleci bununla ölçeklenir → az yorulur)
    var FT_ROLE = { GK: .48, LB: .389, LCB: .372, RCB: .372, RB: .389, LDM: .508, RDM: .508, LW: .546, AM: .621, RW: .546, ST: .551 }, FT_EM = .48;
    var PUSH = { GK: .05, LB: .55, LCB: .5, RCB: .5, RB: .55, LDM: .85, RDM: .85, LW: 1, AM: 1, RW: 1, ST: 1 };
    var MARK = { LB: 'RW', RB: 'LW', LCB: 'ST', RCB: 'AM', LDM: 'RDM', RDM: 'LDM' };
    var ROLE_TR = { GK: 'KL', LB: 'SLB', LCB: 'STP', RCB: 'STP', RB: 'SĞB', LDM: 'MDO', RDM: 'MDO', LW: 'SLK', AM: 'MOO', RW: 'SĞK', ST: 'SF' };
    var NAMES = [
        ['Aksoy', 'Bulut', 'Çelik', 'Doğan', 'Eren', 'Fidan', 'Güneş', 'Hazar', 'İnan', 'Kaplan', 'Yıldız'],
        ['Arslan', 'Balcı', 'Coşkun', 'Demirci', 'Ekinci', 'Gökçe', 'Korkmaz', 'Özkan', 'Polat', 'Sezer', 'Tunç']
    ];

    // ---------- OYUNCU BEYNİ: kişilik ----------
    // Kişilik = oyuncunun DB özelliklerinin, oynadığı rolün DB ortalamasına göre farkı (z-puanı; sd tabanı 4 puan, ±1.6/1.8 ile sınırlı).
    // Böylece "çalımcı", "bitirici", "oyun kurucu" eğilimleri roldeki tipik oyuncuya göre okunur ve takım toplamları (şut, çalım) rol başına dengede kalır.
    // Sıra: dz çalım (dri·.55+pac·.25+bal·.2) · sz bitiricilik (fin·.5+sho·.3+lon·.2) · vz vizyon (vis·.6+pas·.4) · hz hava/güç · wz iş gücü (sta·.6+pac·.2+tac·.2)
    //       df savunma (tac·.5+mar·.5) · po pozisyon alma · pc hız · pz pas tekniği.  Her biri [DB rol ortalaması, sd]  (fm.html oyuncu tablosundan, rol başına)
    var BR_KEYS = ['dz', 'sz', 'vz', 'hz', 'wz', 'df', 'po', 'pc', 'pz'];
    var BR_SF = [[80.9, 5.3], [81.1, 5.7], [77, 5.3], [78.4, 10.1], [70.4, 4.1], [34.1, 4.5], [85, 6.6], [82.9, 8.9], [74.5, 6.1]],
        BR_SLK = [[84.6, 3.1], [76.8, 4.1], [77.6, 3.9], [65.3, 6.4], [72.8, 5.8], [38.7, 9.2], [79, 3.7], [89.5, 2.7], [76.6, 4.1]],
        BR_SGK = [[83.4, 2.4], [77.8, 2.7], [79, 2.5], [62, 5.2], [72.6, 4.1], [41.7, 7.6], [79.8, 2.9], [86.3, 3.2], [78.3, 2.5]],
        BR_MOO = [[82.3, 3.7], [80.6, 4.3], [83.8, 4], [61.5, 6.8], [73.5, 7.4], [48.8, 13.6], [81.7, 4.5], [79.6, 4.7], [84.4, 4.2]],
        BR_MO = [[80.1, 3.3], [78.2, 2.9], [84.1, 4.1], [68.4, 7.4], [80.9, 4.4], [74.8, 5.2], [80.4, 2.6], [75.9, 5.4], [85.4, 4.6]],
        BR_MDO = [[77.9, 3], [75, 5.2], [82.4, 4.2], [72.6, 5.9], [81.2, 4.8], [79.5, 5.6], [77.3, 3.8], [72, 5.3], [84, 4.7]],
        BR_SLB = [[80, 2.9], [66.8, 5.8], [76.8, 4.4], [65.8, 4], [82.4, 3.4], [75.2, 4], [75.5, 2.7], [84.5, 4.2], [77, 5.1]],
        BR_SGB = [[80.2, 3], [69, 6.6], [79, 4.3], [71.6, 6.2], [83.3, 2.6], [76.9, 3.9], [76.9, 3.5], [82.6, 4], [79.5, 5]],
        BR_STP = [[72.3, 3.7], [58.6, 6.4], [71.6, 5.4], [81.5, 5.5], [78.7, 4.1], [81.8, 5.1], [56.1, 5.8], [75.8, 6], [76.1, 5.6]];
    var BR_BASE = { ST: BR_SF, LW: BR_SLK, RW: BR_SGK, AM: BR_MOO, RDM: BR_MO, LDM: BR_MDO, LB: BR_SLB, RB: BR_SGB, LCB: BR_STP, RCB: BR_STP };
    var BR_TAG = { dz: 'Çalımcı', sz: 'Bitirici', vz: 'Vizyoner', hz: 'Güçlü/havada üstün', wz: 'Koşucu', df: 'Savunma ustası', po: 'Pozisyon zekâsı', pc: 'Seri', pz: 'Pas ustası' };
    function styleOf(b, role) {
        var hi = .75;
        if (role === 'ST') return b.sz > hi ? 'Bitirici forvet' : (b.hz > hi && b.dz < 0) ? 'Hedef forvet' : b.pc > hi ? 'Hızlı forvet' : b.vz > hi ? 'Oyun kuran forvet' : b.dz > hi ? 'Çalımcı forvet' : 'Dengeli forvet';
        if (role === 'LW' || role === 'RW') return b.dz > hi ? 'Çalımcı kanat' : b.pc > hi ? 'Hızlı kanat' : b.vz > hi ? 'Yaratıcı kanat' : b.sz > hi ? 'Golcü kanat' : 'Dengeli kanat';
        if (role === 'AM') return b.vz > hi ? 'Oyun kurucu' : b.dz > hi ? 'Çalımcı 10 numara' : b.sz > hi ? 'Gol arayan 10 numara' : b.wz > hi ? 'Çalışkan 10 numara' : 'Dengeli 10 numara';
        if (role === 'LDM' || role === 'RDM') return b.df > hi ? 'Top kesici' : (b.vz > hi || b.pz > hi) ? 'Derin oyun kurucu' : b.wz > hi ? 'Alan koruyucu' : 'Dengeli orta saha';
        if (role === 'LCB' || role === 'RCB') return (b.df > hi && b.hz > .4) ? 'Lider stoper' : b.pz > hi ? 'Oyun kuran stoper' : b.pc > hi ? 'Hızlı stoper' : b.df > hi ? 'Sert stoper' : 'Klasik stoper';
        if (role === 'LB' || role === 'RB') return (b.pc > hi || b.dz > hi) ? 'Hücumcu bek' : b.df > hi ? 'Defansif bek' : b.pz > hi ? 'Oyun kuran bek' : 'Dengeli bek';
        return 'Standart';
    }
    // Beyin vektörü: 9 eğilimin ham değerleri (makeBrain ve roleBase AYNI formülü kullanır)
    function brainVec(a) { return [a.dri * .55 + a.pac * .25 + a.bal * .2, a.fin * .5 + a.sho * .3 + a.lon * .2, a.vis * .6 + a.pas * .4, a.hea * .5 + a.str * .5, a.sta * .6 + a.pac * .2 + a.tac * .2, a.tac * .5 + a.mar * .5, a.posi, a.pac, a.pas]; }
    // Rol tabanlarını (ortalama, sd) oyuncu veritabanından CANLI hesaplar: list = [{pos:'SF', a:{...}} ...] (dbadapter.toEngine çıktıları).
    // Böylece kullanıcı oyuncuların özelliklerini toplu değiştirse bile etiketler "rolündeki diğer oyunculara göre" doğru kalır.
    // Bir mevkide 8'den az oyuncu varsa o rolün gömülü (varsayılan) tabanı kullanılır. Değerler 0,1'e yuvarlanır → değişmemiş veritabanında gömülü tablolarla birebir aynıdır.
    var BASE_POS = { ST: 'SF', LW: 'SLK', RW: 'SĞK', AM: 'MOO', RDM: 'MO', LDM: 'MDO', LB: 'SLB', RB: 'SĞB', LCB: 'STP', RCB: 'STP' };
    function roleBase(list) {
        var out = {}, byPos = {};
        (list || []).forEach(function (r) { if (r && r.a && r.pos && r.pos !== 'KL') (byPos[r.pos] = byPos[r.pos] || []).push(brainVec(r.a)); });
        Object.keys(BASE_POS).forEach(function (role) {
            var rows = byPos[BASE_POS[role]];
            if (!rows || rows.length < 8) return;
            var tbl = [];
            for (var i = 0; i < 9; i++) {
                var m = 0, k; for (k = 0; k < rows.length; k++) m += rows[k][i]; m /= rows.length;
                var v = 0; for (k = 0; k < rows.length; k++) v += (rows[k][i] - m) * (rows[k][i] - m); v = Math.sqrt(v / rows.length);
                if (!isFinite(m) || !isFinite(v)) { tbl = null; break; }
                tbl.push([Math.round(m * 10) / 10, Math.round(v * 10) / 10]);
            }
            if (tbl) out[role] = tbl;
        });
        return out;
    }
    // ---------- güçlü / zayıf ayak tabloları (yıldız 1..5; indeks 0 kullanılmaz) ----------
    // WF_BASE + WF_SIT·m: zayıf ayağı kullanma olasılığı (m = durumun zayıf ayağı gerektirme derecesi, footFor) - hedef, maç başına
    // ayaklı vuruşların ~%3 (1 yıldız) · %8 (2) · %15 (3) · %24 (4) · %37 (5)'si zayıf ayakla (iki ayaklı oyuncu bile hafif tercihli).
    // WF_ERR: zayıf ayakla vuruşta yön sapması çarpanı · WF_PW: zayıf ayakla şut gücü çarpanı.
    var WF_BASE = [0, .004, .018, .055, .095, .20], WF_SIT = [0, .09, .22, .40, .60, .72];
    var WF_ERR = [0, 1.85, 1.5, 1.27, 1.11, 1.02], WF_PW = [0, .90, .925, .95, .975, .995];
    // dolgu (veritabanında olmayan) oyuncu: role göre solak olasılığı ve zayıf ayak yıldızı dağılımı
    var LEFT_ROLE = { GK: .18, LB: .75, LCB: .45, RCB: .1, RB: .06, LDM: .22, RDM: .16, LW: .35, AM: .25, RW: .45, ST: .2 };
    function wfPick(u) { return u < .03 ? 1 : u < .19 ? 2 : u < .70 ? 3 : u < .94 ? 4 : 5; }
    function makeBrain(a, role, real, on, tbl) {
        var b = { dz: 0, sz: 0, vz: 0, hz: 0, wz: 0, df: 0, po: 0, pc: 0, pz: 0, risk: 0, style: role === 'GK' ? 'Kaleci' : 'Standart', tags: [], real: false };
        if (role === 'GK' || !real || !BR_BASE[role]) return b;
        var base = (tbl && tbl[role]) || BR_BASE[role], x = brainVec(a);
        for (var i = 0; i < 9; i++) b[BR_KEYS[i]] = clamp((x[i] - base[i][0]) / Math.max(base[i][1], 4), -1.6, 1.8);
        b.risk = clamp(.5 * b.dz + .3 * b.vz + .2 * b.sz, -1.5, 1.6);
        b.style = styleOf(b, role); b.real = true;
        BR_KEYS.forEach(function (k) { if (b[k] > .9) b.tags.push(BR_TAG[k]); });
        if (b.risk < -.8) b.tags.push('Riskten kaçınır'); else if (b.risk > .9) b.tags.push('Risk alır');
        if (!on) { BR_KEYS.forEach(function (k) { b['_' + k] = b[k]; b[k] = 0; }); b.risk = 0; }      // beyin kapalıyken etiket kalır, karar ağırlıkları nötr
        return b;
    }

    function create(opts) {
        opts = opts || {};
        var PRM = {}; for (var pk in DEFAULTS) PRM[pk] = opts.params && opts.params[pk] != null ? opts.params[pk] : DEFAULTS[pk];
        /* [v137] hava / zemin: seçilen setin çarpanları (ya da değerleri) PRM'ye işlenir; params ile açıkça verilen anahtara dokunulmaz. 'dry' hiçbir şeyi değiştirmez. */
        var WXN = opts.weather != null ? String(opts.weather) : String(PRM.WX || 'dry'), WXS = WX_SET[WXN] || null, WX_X = 0, WX_Y = 0;
        if (WXS) for (var wk0 in WXS) if (!(opts.params && opts.params[wk0] != null)) { var wv0 = WXS[wk0]; PRM[wk0] = wv0[0] === '*' ? PRM[wk0] * wv0[1] : wv0[1]; }
        if (WXN === 'wind') {      // rüzgâr yönü: verilmediyse tohumdan (ana rastgele diziyi tüketmez)
            var wd0 = opts.wind && isFinite(+opts.wind.x) && isFinite(+opts.wind.y) ? opts.wind : null, wa0 = ((((opts.seed || 1) * 2654435761) >>> 0) % 3600) / 3600 * 2 * Math.PI;
            WX_X = wd0 ? +wd0.x : Math.cos(wa0) * PRM.WX_WS; WX_Y = wd0 ? +wd0.y : Math.sin(wa0) * PRM.WX_WS;
        }
        var WXON = WX_X !== 0 || WX_Y !== 0;
        var INT_REACT = PRM.INT_REACT, INT_SPEED = PRM.INT_SPEED, INT_SLACK = PRM.INT_SLACK, REC_R = PRM.REC_R, LONG_PEN = PRM.LONG_PEN, LANE_PEN = PRM.LANE_PEN, PASS_ARR = PRM.PASS_ARR,
            SAVE_A = PRM.SAVE_A, SAVE_XG = PRM.SAVE_XG, BLOCK_R = PRM.BLOCK_R, JD_MOVE = PRM.JD_MOVE, JD_HOLD = PRM.JD_HOLD, COVER_D = PRM.COVER_D, MARK_R = PRM.MARK_R, MARK_GS = PRM.MARK_GS, MARK_W = PRM.MARK_W,
            SHOT_SD = PRM.SHOT_SD, SHOT_BASE = PRM.SHOT_BASE, SHOT_RANGE = PRM.SHOT_RANGE, DRIB_SF = PRM.DRIB_SF, JOCKEY = PRM.JOCKEY, ENGAGE = PRM.ENGAGE,
            PV_BASE = PRM.PV_BASE, PV_AMP = PRM.PV_AMP, PV_LEN = PRM.PV_LEN, LOSS_W = PRM.LOSS_W, TURN_C = PRM.TURN_C, SHOT_LOSS = PRM.SHOT_LOSS, PP_BASE = PRM.PP_BASE, PP_LANE = PRM.PP_LANE, PP_C0 = PRM.PP_C0, PP_F0 = PRM.PP_F0, PP_A3 = PRM.PP_A3, PP_HH = PRM.PP_HH, SHOT_W = PRM.SHOT_W, SHOT_MIN = PRM.SHOT_MIN, SPILL = PRM.SPILL, DRIB_EV = PRM.DRIB_EV, DRIB_COST = PRM.DRIB_COST, OFFS_MISS = PRM.OFFS_MISS, THINK_A = PRM.THINK_A, THINK_B = PRM.THINK_B, TEMPO_A = PRM.TEMPO_A, TEMPO_B = PRM.TEMPO_B, HOLD_MAX = PRM.HOLD_MAX, BLOCK_P = PRM.BLOCK_P, PP_CROSS = PRM.PP_CROSS, PP_RUN = PRM.PP_RUN, GK_LONG = PRM.GK_LONG, PRESS_HI_D = PRM.PRESS_HI_D, PRESS_MID_D = PRM.PRESS_MID_D, PROG_W = PRM.PROG_W, DEAD_K = PRM.DEAD_K, DEAD_T = PRM.DEAD_T, DEAD_G = PRM.DEAD_G, DEAD_C = PRM.DEAD_C, DEAD_F = PRM.DEAD_F, DEAD_GOAL = PRM.DEAD_GOAL, PASS_MISS = PRM.PASS_MISS, IDLE_SF = PRM.IDLE_SF, CLEAR_HEAD = PRM.CLEAR_HEAD, CLEAR_BEHIND = PRM.CLEAR_BEHIND, TACKLE_CD = PRM.TACKLE_CD, FOUL_K = PRM.FOUL_K, RUN_RATE = PRM.RUN_RATE, RUN_T = PRM.RUN_T, RUN_CD = PRM.RUN_CD, CARRY_STOP = PRM.CARRY_STOP, SUP_N = PRM.SUP_N, SUP_OPEN = PRM.SUP_OPEN, SUP_LANE = PRM.SUP_LANE, SUP_REACH = PRM.SUP_REACH, SUP_SHAPE = PRM.SUP_SHAPE, SUP_PROG = PRM.SUP_PROG, SUP_EVERY = PRM.SUP_EVERY, MARK_FAR = PRM.MARK_FAR, MARK_ZONE = PRM.MARK_ZONE, TAKEON_R = PRM.TAKEON_R, TAKEON_P = PRM.TAKEON_P, TAKEON_STUN = PRM.TAKEON_STUN, PRESS_REACH = PRM.PRESS_REACH,
            BR_ON = PRM.BR_ON, BR_DRIB = PRM.BR_DRIB, BR_SHOOT = PRM.BR_SHOOT, BR_SMIN = PRM.BR_SMIN, BR_PROG = PRM.BR_PROG, BR_RISK = PRM.BR_RISK, BR_LONG = PRM.BR_LONG, BR_URG = PRM.BR_URG, BR_OVL = PRM.BR_OVL, BR_RUNP = PRM.BR_RUNP, BR_MARKQ = PRM.BR_MARKQ, BR_GS = PRM.BR_GS, BR_SEE = PRM.BR_SEE, FIN_ON = !!PRM.FIN_ON, FIN_AIM = PRM.FIN_AIM, FIN_CL = PRM.FIN_CL, FIN_EARLY = PRM.FIN_EARLY, FIN_GK1 = PRM.FIN_GK1, OB_ON = !!PRM.OB_ON, OB_CHK = PRM.OB_CHK, OB_DIAG = PRM.OB_DIAG, OB_3M = PRM.OB_3M, OB_UND = PRM.OB_UND, OB_LATE = PRM.OB_LATE, OB_TRIG = PRM.OB_TRIG, OB_TRP = PRM.OB_TRP, OB_NEAR = PRM.OB_NEAR,
            DEC_ON = PRM.DEC_ON, DEC_G = PRM.DEC_G, DEC_MISS = PRM.DEC_MISS, DEC_ACT = PRM.DEC_ACT, KY_ON = !!PRM.KY_ON, KY_EPV = PRM.KY_EPV || 0, KY_EPS = PRM.KY_EPS || 1, KY_SW = PRM.KY_SW, KY_MIN = PRM.KY_MIN, KY_LON = PRM.KY_LON;
        var TAC_ON = !!PRM.TAC, MT_LOSS = PRM.MT_LOSS, MT_PROG = PRM.MT_PROG, MT_SHOT = PRM.MT_SHOT, MT_SMIN = PRM.MT_SMIN, MT_DRIB = PRM.MT_DRIB, MT_PUSH = PRM.MT_PUSH, MT_D = PRM.MT_D, MT_RUN = PRM.MT_RUN, MT_XG = PRM.MT_XG, PR_XG = PRM.PR_XG, WD_XG = PRM.WD_XG,
            TP_THINK = PRM.TP_THINK, TP_ERR = PRM.TP_ERR, TP_MISS = PRM.TP_MISS, TP_RUN = PRM.TP_RUN, TP_PSPD = PRM.TP_PSPD, LN_RUN = PRM.LN_RUN, LN_XG = PRM.LN_XG, PR_STUN = PRM.PR_STUN, WD_CROSS = PRM.WD_CROSS, LN_X = PRM.LN_X, LN_DM = PRM.LN_DM, LN_D = PRM.LN_D, LN_GK = PRM.LN_GK,
            PR_D = PRM.PR_D, PR_R = PRM.PR_R, PR_E = PRM.PR_E, PR_PUSH = PRM.PR_PUSH, PR_COVER = PRM.PR_COVER, WD_Y = PRM.WD_Y, GKD_L = PRM.GKD_L, GKD_W = PRM.GKD_W;
        var TAC0 = { ment: 0, tempo: 0, line: 0, press: 0, width: 0, gk: 0 };
        function normTac(o) {
            var r = { ment: 0, tempo: 0, line: 0, press: 0, width: 0, gk: 0 };
            if (o) for (var k in r) { var v = Math.round(+o[k]); r[k] = v > 0 ? 1 : v < 0 ? -1 : 0; }
            return r;
        }
        function tacOf(tm) { return TAC_ON ? S.teams[tm].tac : TAC0; }
        var FULL_S = PRM.MATCH_S, HALF_S = FULL_S / 2, CK = ((opts.params && opts.params.CLOCK_S) || CLOCK_S) / FULL_S;
        var R = mulberry(opts.seed || 1);
        var RR = mulberry(((opts.seed || 1) ^ 0x5bd1e995) >>> 0);      // hakem akışı: kart/VAR kararları ana rastgele diziyi tüketmez
        var CARDS_ON = !!PRM.CARDS, VAR_ON = !!PRM.VAR, Y_BASE = PRM.Y_BASE, Y_EXP = PRM.Y_EXP, R_SERIOUS = PRM.R_SERIOUS, R_DOGSO = PRM.R_DOGSO, Y_AGAIN = PRM.Y_AGAIN, Y_POS = PRM.Y_POS, VAR_MARG = PRM.VAR_MARG, VAR_RND = PRM.VAR_RND, VAR_CANCEL = PRM.VAR_CANCEL, OFF_TOL = .2,
            VAR_PEN = PRM.VAR_PEN, VAR_PEN_NO = PRM.VAR_PEN_NO, VAR_PEN_OUT = PRM.VAR_PEN_OUT, VAR_RED = PRM.VAR_RED, VAR_RED_DOWN = PRM.VAR_RED_DOWN, VAR_UP = PRM.VAR_UP,
            WALL_ON = !!PRM.WALL, WALL_D = PRM.WALL_D, WALL_SP = PRM.WALL_SP, WALL_B0 = PRM.WALL_B0, WALL_B1 = PRM.WALL_B1, WALL_WAIT = PRM.WALL_WAIT;
        var VAR2 = !!PRM.VAR2 && VAR_ON, VAR_AFM = PRM.VAR_AFM, VAR_PWR = PRM.VAR_PWR, VAR_EDGE = PRM.VAR_EDGE, VAR_CK = PRM.VAR_CK;      // [var]
        var FOOT_ON = !!PRM.FOOT, FOOT_NP = PRM.FOOT_NP, FOOT_NS = PRM.FOOT_NS;
        var MOVE = !!PRM.MOVE, MV_TAPER = PRM.MV_TAPER, MV_BRK = PRM.MV_BRK, MV_LAT0 = PRM.MV_LAT0, MV_LATV = PRM.MV_LATV, MV_TURN0 = PRM.MV_TURN0, MV_TURN1 = PRM.MV_TURN1, MV_BACK = PRM.MV_BACK, MV_SIDE = PRM.MV_SIDE,
            MV_SMOOTH = PRM.MV_SMOOTH, MV_DEAD = PRM.MV_DEAD, MV_ARR = PRM.MV_ARR, MV_ARRS = PRM.MV_ARRS || 0, MV_ARRB = PRM.MV_ARRB != null ? PRM.MV_ARRB : 5, SH_TAU = PRM.SH_TAU || 0, MV_BIG = !!PRM.MV_BIG, MV_COLL = !!PRM.MV_COLL, MV_SEP = !!PRM.MV_SEP;
        var AIS = !!PRM.AIS, AIS_LAG = PRM.AIS_LAG, AIS_EFF = PRM.AIS_EFF, AIS_CH = PRM.AIS_CH, AIS_PR = PRM.AIS_PR, AIS_SUP = PRM.AIS_SUP;
        var BALL3D = !!PRM.BALL3D, BL_G = PRM.BL_G, BL_HZ = PRM.BL_HZ, BL_E = PRM.BL_E, BL_HRET = PRM.BL_HRET, BL_BMIN = PRM.BL_BMIN, BL_CTRLZ = PRM.BL_CTRLZ, SH_VK = PRM.SH_VK, SH_AIMZ0 = PRM.SH_AIMZ0, SH_AIMZ1 = PRM.SH_AIMZ1;
        var GKP = !!PRM.GKP && !!PRM.BALL3D, GK_REACT = PRM.GK_REACT, GK_DIVE = PRM.GK_DIVE, GK_DMAX = PRM.GK_DMAX, GK_R0 = PRM.GK_R0, GK_S0 = PRM.GK_S0, GK_S1 = PRM.GK_S1;
        var TOUCH = !!PRM.TOUCH && !!PRM.BALL3D, TC_GMIN = PRM.TC_GMIN, TC_GV = PRM.TC_GV, TC_HEAVY = PRM.TC_HEAVY, TC_HV = PRM.TC_HV;
        var OFFS2 = !!PRM.OFFS2, AR_MISS = PRM.AR_MISS;
        var SL_ON = !!PRM.SL_ON, SL_R = PRM.SL_R, SL_P = PRM.SL_P, SL_W = PRM.SL_W, SL_F = PRM.SL_F, SL_STUN = PRM.SL_STUN, slNow = false, TACKLE = !!PRM.TACKLE, TK_ENG = PRM.TK_ENG, TK_WIN = PRM.TK_WIN, TK_STUN0 = PRM.TK_STUN0, TK_STUN1 = PRM.TK_STUN1, TK_FOUL = PRM.TK_FOUL, TK_DOG = PRM.TK_DOG, TK_SER = PRM.TK_SER, TK_Y = PRM.TK_Y;
        var FATIGUE = !!PRM.FATIGUE, FT_K = PRM.FT_K, FT_KA = PRM.FT_KA, FT_STA = PRM.FT_STA, FT_IRR = PRM.FT_IRR, FT_REC = PRM.FT_REC, FT_HT = PRM.FT_HT, FT_A = PRM.FT_A, FT_AHI = PRM.FT_AHI, FT_AD = PRM.FT_AD, FT_AACC = PRM.FT_AACC, FT_AT = PRM.FT_AT, FT_AV = PRM.FT_AV, FT_AA = PRM.FT_AA, FT_RUN = PRM.FT_RUN, FT_RX = PRM.FT_RX, FT_MK = PRM.FT_MK, FT_EA = PRM.FT_EA, FT_BK = PRM.FT_BK, FT_RN = PRM.FT_RN, FT_PACE = !!PRM.FT_PACE;
        var AICAL = !!PRM.AICAL, AC_HSH = PRM.AC_HSH, AC_ST = PRM.AC_ST, AC_AF = PRM.AC_AF, AC_AFY = PRM.AC_AFY, AC_SBV = PRM.AC_SBV, AC_AGD = PRM.AC_AGD, AC_SBB = PRM.AC_SBB, AC_SBL = PRM.AC_SBL, AC_SBR = PRM.AC_SBR, AC_HV = PRM.AC_HV, AC_IBX = PRM.AC_IBX, AC_CH = PRM.AC_CH, AC_CB = PRM.AC_CB, AC_IS = PRM.AC_IS, AC_IP = PRM.AC_IP, AC_LOWD = PRM.AC_LOWD, AC_PL = PRM.AC_PL, AC_PK = PRM.AC_PK, AC_PV = PRM.AC_PV, AC_QK = PRM.AC_QK, AC_IR = PRM.AC_IR, AC_IC = PRM.AC_IC, AC_XRX = PRM.AC_XRX, AC_GKW = PRM.AC_GKW, AC_GKD = PRM.AC_GKD, AC_XB = PRM.AC_XB, AC_LT = PRM.AC_LT, AC_LI = PRM.AC_LI;
        var SH_VFIX = !!PRM.SH_VFIX && BALL3D, SH_TMAX = PRM.SH_TMAX, SH_ZMAX = PRM.SH_ZMAX, SH_VZMAX = PRM.SH_VZMAX, BL_HFIX = !!PRM.BL_HFIX && BALL3D, POSTN = !!PRM.POSTN && BALL3D, BL_EDGE = !!PRM.BL_EDGE && BALL3D;
        var BL_AERO = !!PRM.BL_AERO && BL_HFIX, BL_SPIN = +PRM.BL_SPIN || 0;
        var CURL = !!PRM.CURL && BL_AERO, CU_CROSS = PRM.CU_CROSS, CU_LONG = PRM.CU_LONG, CU_LD = PRM.CU_LD, CU_FK = PRM.CU_FK, CU_LS = PRM.CU_LS, CU_LS0 = PRM.CU_LS0, CU_GND = PRM.CU_GND, CU_WEAK = PRM.CU_WEAK;      // [v137]
        var AGIL = !!PRM.AGIL && MOVE, AG_C = PRM.AG_C, AG_K = PRM.AG_K, AG_MAX = PRM.AG_MAX;      // [v137]
        WXON = WXON && BL_AERO;      // [v137] rüzgâr yalnız hava kuvvetli yüksek topta
        if (PRM.BL_FIFA && BALL3D) { BL_E = PRM.BL_E2; BL_HRET = PRM.BL_HRET2; }      // [ball] FIFA çim sekmesi
        var GK_CPA = !!PRM.GK_CPA && GKP, GK_BOX = !!PRM.GK_BOX, GK_SET = !!PRM.GK_SET && MOVE, GK_SETD = PRM.GK_SETD, GK_SETT = PRM.GK_SETT, GK_SETB = PRM.GK_SETB, GK_SETA = PRM.GK_SETA, TC_SLINE = !!PRM.TC_SLINE && BALL3D, TC_RCV = !!PRM.TC_RCV && TOUCH, TC_SNAPV = PRM.TC_SNAPV, TC_OFF = !!PRM.TC_OFF && TOUCH;
        var TC_PHYS = !!PRM.TC_PHYS && TOUCH && BALL3D, CR_MUG = PRM.CR_MUG, CR_RD = PRM.CR_RD, CR_KD = PRM.CR_KD, CR_SPIN = PRM.CR_SPIN, CR_G0 = PRM.CR_G0, CR_G1 = PRM.CR_G1, CR_OPEN = PRM.CR_OPEN, CR_REACH = PRM.CR_REACH, CR_LOSE = PRM.CR_LOSE, CR_STEER = PRM.CR_STEER != null ? +PRM.CR_STEER : 1, CR_KV = +PRM.CR_KV || 0;
        var KNOCK = !!PRM.KNOCK && TOUCH, KN_SF = PRM.KN_SF, KN_OPP = PRM.KN_OPP, KN_END = PRM.KN_END, KN_TT = PRM.KN_TT, KN_GAP = PRM.KN_GAP, KN_RUN = !!PRM.KN_RUN, KN_STR = !!PRM.KN_STR, KN_CUT = !!PRM.KN_CUT;
        var OFFS_AIR = !!PRM.OFFS_AIR && OFFS2, VAR_OG = !!PRM.VAR_OG && OFFS2, TK_SPAPEN = !!PRM.TK_SPAPEN, AIR_TGT = !!PRM.AIR_TGT && BALL3D, AIR_R = PRM.AIR_R;
        var DEADB = !!PRM.DEADB, PEN14 = !!PRM.PEN14, DEADGK = !!PRM.DEADGK, DEADSH = !!PRM.DEADSH, KO_DIST = !!PRM.KO_DIST, DEADFB = !!PRM.DEADFB, TI_FIX = !!PRM.TI_FIX, PEN_END = !!PRM.PEN_END, CARRYOUT = !!PRM.CARRYOUT && BALL3D;
        var FKD = !!PRM.FKD, FKD_A = PRM.FKD_A, FKD_SK = PRM.FKD_SK, FKD_W = PRM.FKD_W, FKD_MAX = PRM.FKD_MAX;
        // [av] açık veri bayrakları (DEFAULTS [av]); RA: yeni rastgelelik akışı (yalnız bayrak açıkken tüketilir)
        var AV_XG = !!PRM.AV_XG, AV_SHOT = !!PRM.AV_SHOT, AV_DRAG = !!PRM.AV_DRAG && BALL3D, AV_PASS = !!PRM.AV_PASS, AV_GK = !!PRM.AV_GK, AV_MOVE = !!PRM.AV_MOVE && MOVE, AV_OUT = !!PRM.AV_OUT, AV_ATTR = !!PRM.AV_ATTR, AV_TRIG5 = !!PRM.AV_TRIG5, AV_LATE = !!PRM.AV_LATE;
        var RA = mulberry(((opts.seed || 1) ^ 0x3c6ef372) >>> 0);
        function gaussA() { return (RA() + RA() + RA() + RA() - 2) * 1.732; }
        function avp(k, d) { return opts.params && opts.params[k] != null ? +opts.params[k] : d; }      // [av] ince ayar anahtarı (laboratuvar; DEFAULTS dışında)
        if (AV_SHOT) { KY_MIN = PRM.AV_SMIN; KY_LON = PRM.AV_SLON; AC_HSH = PRM.AV_HSH; GK_S0 = PRM.AV_GKS0; }
        if (AV_PASS) { PP_C0 = PRM.AV_PC0; PP_HH = PRM.AV_PHH; PASS_MISS = PRM.AV_PMISS; INT_SLACK = PRM.AV_ISLK; }
        if (AV_MOVE) { MV_BRK = avp('AV_BRK', 5.5); MV_LAT0 = avp('AV_LAT0', 5.2); MV_LATV = avp('AV_LATV', .1); AIS_EFF = avp('AV_EFF', .3); }
        if (AV_OUT) { DEAD_T = avp('AV_DT', 3); DEAD_G = avp('AV_DG', 4.5); DEAD_F = avp('AV_DF', 4); DEAD_C = avp('AV_DC', 7); }
        var keepBall = false, ballPending = false, hdZ = null;      // [dead]/[air] bir sonraki vuruşta top yerinde kalır · [ball] bu adımda top adımı henüz işlemedi · [air] kafa temasındaki top yüksekliği
        var GH = 2.44, BRAD = .11;      // kale yüksekliği, top yarıçapı (m)
        var BS = { x: CX, y: CY };      // [ais] takım bloğunun izlediği (gecikmeli) top konumu
        var tkG = null;      // [tackle] son çekişmenin geometrisi (hakem kararı için)
        var prevCh = [null, null], prevPr = [null, null];
        var RF = mulberry(((opts.seed || 1) ^ 0x2c1b3c6d) >>> 0);      // ayak akışı: ayak seçimi/dolgu oyuncunun ayağı ana rastgele diziyi tüketmez
        function gauss() { return (R() + R() + R() + R() - 2) * 1.732; }
        var S = {
            t: 0, half: 1, finished: false, mode: 'dead', dead: null, events: [], eid: 0,
            teams: [{ id: 0, dir: 1, score: 0, name: opts.names ? opts.names[0] : 'Ev', st: newStats(), tac: normTac(opts.tactics && opts.tactics[0]) }, { id: 1, dir: -1, score: 0, name: opts.names ? opts.names[1] : 'Dep', st: newStats(), tac: normTac(opts.tactics && opts.tactics[1]) }],
            players: [], pass: null, shot: null, lastTeam: 0, onEvent: null, chain: [0, 0],
            audit: { maxV: 0, maxBallV: 0, oob: 0, maxAcc: 0, ticks: 0 },
            dbg: { dec: {}, take: {}, press: {}, footP: [0, 0], footS: [0, 0] }
        };
        function newStats() { return { shots: 0, sot: 0, passes: 0, passOk: 0, poss: 0, fouls: 0, corners: 0, xg: 0, tackles: 0, inter: 0, saves: 0, throwins: 0, goalkicks: 0, offsides: 0, yellow: 0, red: 0 }; }
        var B = S.ball = { x: CX, y: CY, z: 0, vx: 0, vy: 0, vz: 0, owner: null, last: null, high: null, shotFlag: false };
        var str = opts.strength || [0, 0];
        S.refLog = opts.refLog ? [] : null;      // laboratuvar: faul ve gol bağlamı (kart/VAR kalibrasyonu)
        S.spr = opts.spr || null;      // [v164] [{cor:'near'|'far'|'spot'|'short', w}, ...]: takım başına korner rutini (yoksa eski davranış)
        S.takers = opts.takers || null;   // [{pen, fk, cor}, {...}]: takım içi oyuncu sırası (0-10, FORM sırası); yoksa en yakın oyuncu kullanır
        // Özellik→etki eğrisi. 'linear' = ilk prototip (özellikler doğrusal, elit farkı küçük). 'elite' = üstel: her +10 puan hatayı/başarıyı sabit oranda değiştirir, 70 = nötr.
        var CURVE = opts.curve === 'elite';
        function K(v, g) { return CURVE ? Math.exp(-g * (v - 70) / 10) : 1; }
        // karar kalitesi: vis/posi/pas bileşik özelliğinin K eğrisindeki karşılığı (70 nötr; yüksek özellik → düşük gürültü çarpanı)
        function decK(p) { return DEC_ON ? K(AV_ATTR && p.a.dec != null ? p.a.dec * .45 + p.a.vis * .30 + p.a.posi * .25 : p.a.vis * .55 + p.a.posi * .30 + p.a.pas * .15, DEC_G) : 1; }      // [av] AV_ATTR: Karar Alma varsa karar kalitesinin ana bileşeni
        // [av] AV_MOVE: azami hız ve ivme (Metrica: 1 sn sürekli azami hız medyanı 8,4 m/sn, ivme p99,5 3,5–4,2 m/sn² — motorun ivme eğrisi a(v) = A0·(1 − (v/Vmax)²))
        function avMaxV(a) { return avp('AV_V0', 6.3) + avp('AV_V1', .036) * a.pac; }
        function avAcc(a) { return avp('AV_A0', 4.0) + avp('AV_A1', .022) * (a.acc != null ? a.acc : a.pac); }

        // ---------- oyuncular ----------
        [0, 1].forEach(function (tm) { FORM.forEach(function (f, i) {
            var role = f[0], base = 64 + str[tm] + R() * 14;
            var a = { pac: base, pas: base, sho: base - 4, dri: base, tac: base, hea: base, str: base, sta: 70 + R() * 20, vis: base, gk: 0, fin: base - 4, mar: base, posi: base, lon: base - 6, bal: base, agg: 40, pen: base, fk: base, cor: base };
            if (role === 'GK') { a.gk = 66 + str[tm] + R() * 20; a.pac -= 8; }
            else if (/B$|CB/.test(role)) { a.tac += 9; a.hea += 8; a.str += 6; a.sho -= 10; a.dri -= 6; }
            else if (/DM/.test(role)) { a.pas += 6; a.tac += 6; a.vis += 4; }
            else if (role === 'AM') { a.pas += 10; a.vis += 10; a.dri += 8; a.sho += 3; }
            else if (/W$/.test(role)) { a.pac += 10; a.dri += 9; a.sho += 2; }
            else if (role === 'ST') { a.sho += 12; a.fin += 14; a.hea += 8; a.str += 6; }
            var ro = opts.roster && opts.roster[tm] && opts.roster[tm][i];   // gerçek veritabanı oyuncusu (DB2D.toEngine çıktısı)
            if (ro) { for (var ak in ro.a) a[ak] = ro.a[ak]; }
            if (role === 'GK' && !(a.gk > 0)) a.gk = 45;      // kaleci yuvasına (veri hatasıyla) kaleci olmayan oyuncu düşerse: zayıf ama geçerli kaleci
            // güçlü ayak / zayıf ayak yıldızı: veritabanından (DB2D.toEngine -> ro.ft/ro.wf); dolgu oyuncuda mevkiye göre gerçekçi dağılımla (RF akışı)
            var ft = ro && (ro.ft === 'L' || ro.ft === 'R') ? ro.ft : (RF() < (LEFT_ROLE[role] != null ? LEFT_ROLE[role] : .2) ? 'L' : 'R');
            var wf = ro && ro.wf >= 1 && ro.wf <= 5 ? Math.round(ro.wf) : wfPick(RF());
            var p = { id: tm * 11 + i, team: tm, role: role, num: i + 1, ft: ft, wf: wf, name: ro ? ro.name : NAMES[tm][i], short: ro && ro.short ? ro.short : (ro ? ro.name : NAMES[tm][i]), db: ro ? ro.db : null, a: a, x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, sf: .6, fx: tm === 0 ? 1 : -1, fy: 0,
                maxV: AV_MOVE && CURVE ? avMaxV(a) : CURVE ? 6.2 + .0395 * a.pac : 5.6 + 0.032 * a.pac, acc: AV_MOVE && CURVE ? avAcc(a) : CURVE ? 4.8 + .028 * (a.acc != null ? a.acc : a.pac) : 6.5, stam: 1, think: 0, cd: 0, tcd: 0, stunT: -9, run: null, runCd: 0, boxT: null, ix: 0, iy: 0, tInt: 99, mark: null, off: false, yc: 0, nf: 0, rx: R() * .25 - (CURVE && /B$|CB|DM/.test(role) ? clamp((a.mar * .7 + a.tac * .3 - 70) * .006, -.1, .14) : 0) };
            p.br = makeBrain(a, role, !!(ro && ro.db), BR_ON, opts.brainBase); trApply(p, ro); var hm = opts.homes && opts.homes[tm] && opts.homes[tm][i]; p.home = hm ? [role, hm[0], hm[1]] : null; /* [port] diziliş ev konumu */ p.n = { dec: 0, pass: 0, fwd: 0, long: 0, sw: 0, drib: 0, take: 0, shot: 0, clear: 0, ovl: 0, run: 0, kick: 0, weak: 0 }; p.dec = null;
            p.agK = agilK(a, role);      // [v137]
            if (FATIGUE) { p.stamCap = 1; p.ana = 1; p.staK = clamp(1 - FT_STA * ((a.sta != null ? a.sta : 80) - 80) / 15, .5, 1.6) * Math.pow(FT_EM / (FT_ROLE[role] || FT_EM), FT_RN); p.anaD = 0; }      // [fatigue] dayanıklılık: yüksek sta yavaş yorulur; kondisyon rolün yüküne göre
            S.players.push(p);
        }); });
        function opp(tm) { return S.teams[1 - tm]; }
        function P(tm, role) { return S.players.filter(function (p) { return p.team === tm && p.role === role && !p.off; })[0]; }
        function anyMate(p) { var best = null, bd = 1e9; S.players.forEach(function (q) { if (q.team !== p.team || q.off || q.role === 'GK' || q === p) return; var d = hyp(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = q; } }); return best; }
        function gkOf(tm) { return S.players[tm * 11]; }
        function ownGoalX(tm) { return S.teams[tm].dir === 1 ? 0 : PW; }
        function atkGoalX(tm) { return S.teams[tm].dir === 1 ? PW : 0; }

        // ---------- olay ----------
        function emit(type, o) {
            if (type === 'SAVE' && S.userRef && S.refGlFn && !S.refAsk && o && o.team >= 0) { var glx = ownGoalX(o.team), gdl = Math.abs(B.x - glx); if (gdl < .9 && B.y > GY0 - .3 && B.y < GY1 + .3 && (B.z || 0) < GH) { var gq = { kind: 'gline', team: 1 - o.team, gk: o.p, scorer: o.p2 != null ? o.p2 : -1, dl: gdl, t: S.t, x: B.x, y: B.y, truth: { call: 'nogol' } }; if (S.refGlFn(gq)) { S.refAsk = gq; S.refHold = true; } } }      /* [port] çizgide kurtarış: gol mü? */
            var ev = { id: ++S.eid, t: S.t, type: type, team: -1, p: -1, p2: -1, x: B.x, y: B.y, meta: {}, score: [S.teams[0].score, S.teams[1].score] };
            for (var k in o) ev[k] = o[k];
            ev.min = Math.floor(S.t * CK / 60); ev.tc = S.t * CK; ev.dir = ev.team >= 0 ? S.teams[ev.team].dir : 0;
            S.events.push(ev);
            if (S.onEvent) S.onEvent(ev);
            return ev;
        }

        // ---------- yerleşim ----------
        function placeKickoff(first) {
            S.players.forEach(function (p) {
                if (p.off) return;
                var f = (p.home || FORM.filter(function (r) { return r[0] === p.role; })[0]), d = S.teams[p.team].dir;
                var ks = koSpot(p, p.team === first), fx = ks[0], fy = ks[1]; p.x = d === 1 ? fx * PW : (1 - fx) * PW; p.y = d === 1 ? fy * PH : (1 - fy) * PH; p.vx = p.vy = 0;
                p.tx = p.x; p.ty = p.y; p.fx = d;
                if (MOVE) { p.fy = 0; p.fa = null; p.stx = null; p.idle = false; }
            });
            var st = P(first, 'ST'); if (st) { st.x = CX + (S.teams[first].dir === 1 ? -0.6 : 0.6); st.y = CY; }
            var am = P(first, 'AM'); if (am) { am.x = CX + (S.teams[first].dir === 1 ? -3 : 3); am.y = CY + 4; }
        }
        // [dead] KO_DIST: başlamayı yapmayan takımın forveti ve 10 numarası orta yuvarlağın dışında, ayrı noktalarda (y oranı)
        function koY(role, fy) { return role === 'ST' ? .5 - 4 / PH : role === 'AM' ? .5 + 6 / PH : fy; }
        // [v153] başlama vuruşu dizilişinde aynı takımdan iki oyuncu üst üste gelmesin (4-4-2'de MO ile MOO gibi): sonraki oyuncu yana kaydırılır (RNG yok)
        function koSpotRaw(p, kicking) { var f = (p.home || FORM.filter(function (r) { return r[0] === p.role; })[0]), kd = KO_DIST && !kicking; return [Math.min(f[1], kd ? .41 : .47), kd ? koY(p.role, f[2]) : f[2]]; }
        function koSpot(p, kicking) {
            var d = S.teams[p.team].dir, ms = S.players.filter(function (q) { return q.team === p.team && !q.off; }), fix = [];
            var sp = ms.map(function (q) { var k = kicking && (q.role === 'ST' || q.role === 'AM'); fix.push(k); if (kicking && q.role === 'ST') return [.5 - .6 / PW, .5]; if (kicking && q.role === 'AM') return [.5 - 3 / PW, d === 1 ? .5 + 4 / PH : .5 - 4 / PH]; return koSpotRaw(q, kicking); });
            for (var it = 0; it < 2; it++) for (var i = 0; i < sp.length; i++) for (var j = 0; j < sp.length; j++) {
                if (i === j || fix[j] || (j < i && !fix[i])) continue;
                var dx = (sp[i][0] - sp[j][0]) * PW, dy = (sp[i][1] - sp[j][1]) * PH; if (dx * dx + dy * dy >= 16) continue;
                var sg = dy > 0 ? -1 : 1; sp[j][1] = Math.max(.03, Math.min(.97, sp[j][1] + sg * (4 - Math.abs(dy)) / PH));
                if (KO_DIST && !kicking) { var cx = (.5 - sp[j][0]) * PW, cy = (sp[j][1] - .5) * PH; if (cx * cx + cy * cy < 92) sp[j][0] = .5 - Math.sqrt(Math.max(0, 92 - cy * cy)) / PW; }
            }
            var ix = ms.indexOf(p); return ix < 0 ? koSpotRaw(p, kicking) : sp[ix];
        }
        function startDead(kind, team, spot, extra) {
            var d = { kind: kind, team: team, x: spot.x, y: spot.y, timer: 0, wait: { kickoff: DEAD_K, throw: DEAD_T, goalkick: DEAD_G, corner: DEAD_C, freekick: DEAD_F, penalty: 5 }[kind], taker: null };
            for (var k in extra) d[k] = extra[k];
            var best = null, bd = 1e9;
            S.players.forEach(function (p) {
                if (p.team !== team || p.off) return;
                if (kind === 'goalkick' && p.role !== 'GK') return;
                if (kind !== 'goalkick' && (p.role === 'GK')) return;
                if (kind === 'penalty' && p.role !== 'ST') return;
                if (kind === 'kickoff' && p.role !== 'ST') return;
                var dd = hyp(p.x - spot.x, p.y - spot.y);
                if (kind === 'corner' && (p.role === 'ST' || p.role === 'LCB' || p.role === 'RCB')) dd += 40;
                if (dd < bd) { bd = dd; best = p; }
            });
            var desKey = kind === 'penalty' ? 'pen' : kind === 'freekick' ? 'fk' : kind === 'corner' ? 'cor' : null;
            var desIdx = desKey && S.takers && S.takers[team] ? S.takers[team][desKey] : null;
            if (desIdx != null && desIdx >= 0) { var dp = S.players[team * 11 + desIdx]; if (dp && dp.role !== 'GK' && !dp.off) best = dp; }
            if (S.forceFK != null && kind === 'freekick' && team === S.forceGoal) { var fkp = S.players[S.forceFK]; if (fkp && !fkp.off && fkp.team === team && fkp.role !== 'GK') best = fkp; }      // [v186] zorla gol kurgusu: doğrudan serbest vuruşu golcü kullanır
            if (!best) { S.players.forEach(function (p) { if (p.team !== team || p.off || p.role === 'GK') return; var dd2 = hyp(p.x - spot.x, p.y - spot.y); if (dd2 < bd) { bd = dd2; best = p; } }); }      // 10 kişi: rol yoksa en yakın oyuncu
            d.taker = best;
            if (kind === 'freekick') { planWall(d); if (d.wall) d.wait = Math.max(d.wait, WALL_WAIT); }
            S.mode = 'dead'; S.dead = d; S.pass = null; S.shot = null; B.owner = null; S.offSnap = null; S.app = null; B.high = null; B.shotFlag = false;
            B.x = spot.x; B.y = spot.y; B.vx = B.vy = 0; B.z = 0; B.vz = 0;
        }


        // ---------- serbest vuruş barajı ----------
        // Dayanaklar: IFAB Kural 13 (rakip en az 9,15 m; 3+ kişilik barajda saldırganlar en az 1 m uzakta) · kaleci eğitimi kaynakları (16,5 m'de 6 kişi, her ~2,75 m'de bir kişi eksilir;
        // açı arttıkça azalır: "saat kadranı" merkez 4 → 3 → 2 → 1) · baraj yakın direği kapatır, kaleci uzak tarafı tutar · baraj vuruşa kadar kıpırdamaz.
        function wallCount(bx, by, attTeam) {
            var dx = Math.abs(atkGoalX(attTeam) - bx), dy = Math.abs(by - CY), dG = hyp(dx, dy);
            if (dx < 11 || dG > 34) return 0;
            var th = Math.atan2(dy, dx), nD = 6 - (dG - 16.5) / 2.75, f = 1 - th / (Math.PI / 2) * .75;
            return clamp(Math.round(nD * f), 0, 7);
        }
        function planWall(d) {
            d.wall = null; if (!WALL_ON) return;
            var att = d.team, def = 1 - att, n = wallCount(d.x, d.y, att); if (n < 1) return;
            var ag = atkGoalX(att), sg = ag > d.x ? 1 : -1, off = d.y - CY, ns = Math.abs(off) < .5 ? ((Math.floor(d.x * 7) & 1) ? -1 : 1) : (off < 0 ? -1 : 1);
            var s = Math.max(.35, clamp(Math.abs(off) / 6, 0, 1)), aimY = CY + ns * s * (GW / 2 - .3);      // yakın direğe doğru kayık (merkezde hafif)
            var ux = ag - d.x, uy = aimY - d.y, ul = hyp(ux, uy) || 1; ux /= ul; uy /= ul;
            var cx = d.x + ux * WALL_D, cy = d.y + uy * WALL_D, qx = -uy * sg, qy = ux * sg;           // q: sahada +y yönüne bakan, doğrultuya dik birim vektör
            var slots = [], i;
            for (i = 0; i < n; i++) { var o = ((n - 1) / 2 - i) * ns * WALL_SP; slots.push({ x: clamp(cx + qx * o, .8, PW - .8), y: clamp(cy + qy * o, .8, PH - .8), id: -1 }); }   // 0. = yakın direk ucu
            var cand = S.players.filter(function (p) { return p.team === def && !p.off && p.role !== 'GK'; }), used = {};
            slots.forEach(function (sl) {
                var best = null, bd = 1e9;
                cand.forEach(function (p) { if (used[p.id]) return; var dd = hyp(p.x - sl.x, p.y - sl.y) + (p.role === 'ST' ? 8 : /W$/.test(p.role) ? 5 : p.role === 'AM' ? 3 : 0); if (dd < bd) { bd = dd; best = p; } });
                if (best) { used[best.id] = 1; sl.id = best.id; }
            });
            slots = slots.filter(function (sl) { return sl.id >= 0; }); if (!slots.length) return;
            // kaleci: baraj yakın direği kapatır, kaleci kapatılmayan uzak yarıyı (barajın uzak ucundan uzak direğe) tutar
            var far = slots[slots.length - 1], fx = far.x - qx * ns * .35, fy = far.y - qy * ns * .35, farY = CY - ns * GW / 2;
            var tt = (ag - d.x) / ((fx - d.x) || .001), yInt = d.y + tt * (fy - d.y), covered = (-ns * yInt) >= (-ns * farY);
            var gy = covered ? farY + ns * .9 : yInt + (farY - yInt) * .55; gy = clamp(gy, CY - GW / 2 + .8, CY + GW / 2 - .8);
            d.wall = { n: slots.length, slots: slots, ids: slots.map(function (sl) { return sl.id; }), gk: { x: ag - sg * 1.0, y: gy }, ux: ux, uy: uy, cx: cx, cy: cy, qx: qx, qy: qy };
        }
        function wallSlot(d, p) { if (!d.wall) return null; for (var i = 0; i < d.wall.slots.length; i++) if (d.wall.slots[i].id === p.id) return d.wall.slots[i]; return null; }

        // ---------- yardımcılar ----------
        function xgAt(x, y, dir, pd) {
            var gx = dir === 1 ? PW : 0, dx = Math.abs(gx - x); if (dx < .5) dx = .5;
            var a1 = Math.atan2(GY0 - y, dx), a2 = Math.atan2(GY1 - y, dx), th = Math.abs(a2 - a1);
            var v = Math.min(.62, .29 * Math.pow(th, 1.7));   // 6 m ≈ .40 · penaltı noktası ≈ .13 · ceza sahası çizgisi ≈ .07 · 25 m ≈ .035
            return v * (pd < 2.5 ? .62 : pd < 4 ? .8 : 1);
        }
        var XG_REP = 1, XG_B = AV_XG ? XG_B_AV : [2.7679, -1.1951, -.2839, -.5345, 1.0621, .0389, -.6165, .3928, .1559, -.0694, -1.8857], XG_PEN = AV_XG ? .751 : .75;      // [av] AV_XG: gerçek şutlardan      // [xg] katsayilar xg_fit.js ciktisi
        function xgFeat(ox, oy, tm, pd, kind) {      // [xg] sut oncesi ozellikler
            var dir = S.teams[tm].dir, gx = dir === 1 ? PW : 0, dx = Math.max(.5, Math.abs(gx - ox)), a1 = Math.atan2(GY0 - oy, dx), a2 = Math.atan2(GY1 - oy, dx), th = Math.abs(a2 - a1);
            var d = hyp(gx - ox, CY - oy), nb = 0, i, q, gk = gkOf(1 - tm), gko = 4, gkg = 0;
            for (i = 0; i < 22; i++) { q = S.players[i]; if (q.team === tm || q.off || q.role === 'GK') continue; if ((q.x - ox) * dir < 0) continue; var s1 = (gx - ox) * (q.y - oy) - (GY0 - oy) * (q.x - ox), s2 = (gx - ox) * (q.y - oy) - (GY1 - oy) * (q.x - ox); if (s1 * s2 <= 0 || segDist(q.x, q.y, ox, oy, gx, CY) < .5) nb++; }
            if (gk && !gk.off) { gko = Math.min(4, segDist(gk.x, gk.y, ox, oy, gx, CY)); gkg = Math.min(12, Math.abs(gk.x - gx)); }
            return [d, th, kind === 'HEAD' ? 1 : 0, kind === 'FK' ? 1 : 0, Math.min(5, pd == null ? 5 : pd), nb, gko, gkg, S.lastShotT && S.lastShotT[tm] != null && S.t - S.lastShotT[tm] < 3 ? 1 : 0];
        }
        // [av] şut KARARININ inancı: motorun kendi maçlarından uydurulan model (bu fiziğin gerçek gol olasılığı); AV_XG yalnız RAPORLANAN xG'yi gerçek veriye taşır.
        //   (gerçek modelle karar verilince motor şutu ceza sahası dışından %69 çekiyordu — 24 maç ölçümü; AV_XGD=1 kararı da gerçek modele bağlar)
        var XG_B0 = [2.7679, -1.1951, -.2839, -.5345, 1.0621, .0389, -.6165, .3928, .1559, -.0694, -1.8857];
        function xgDec(f, kind) { if (!AV_XG || avp('AV_XGD', 0)) return xgRep(f, kind); var B0 = XG_B0, z = B0[0] + B0[1] * Math.log(Math.max(1, f[0])) + B0[2] * f[1] + B0[3] * f[2] + B0[4] * f[3] + B0[5] * f[4] + B0[6] * f[5] + B0[7] * f[6] + B0[8] * f[7] + B0[9] * f[8] + B0[10] * f[0] / 10; return Math.max(.003, Math.min(.97, 1 / (1 + Math.exp(-z)))); }
        function xgRep(f, kind) {      // [xg] raporlanan xG
            if (kind === 'PEN') return XG_PEN;
            var z = XG_B[0] + XG_B[1] * Math.log(Math.max(1, f[0])) + XG_B[2] * f[1] + XG_B[3] * f[2] + XG_B[4] * f[3] + XG_B[5] * f[4] + XG_B[6] * f[5] + XG_B[7] * f[6] + XG_B[8] * f[7] + XG_B[9] * f[8] + XG_B[10] * f[0] / 10;
            return Math.max(.003, Math.min(.97, 1 / (1 + Math.exp(-z))));
        }
        function inBox(x, y, tmAttacking) { var gx = atkGoalX(tmAttacking); return Math.abs(gx - x) <= PA_D && y >= PA_Y0 && y <= PA_Y1; }
        var BL_ROLL = !!PRM.BL_ROLL, BL_RD = PRM.BL_RD, BL_AD = PRM.BL_AD, BL_SLIDE = !!PRM.BL_SLIDE, BL_MUK = PRM.BL_MUK || .4, BL_R57 = PRM.BL_R57 || .714, BL_LOWV = PRM.BL_LOWV || 2, BL_LOWD = PRM.BL_LOWD || 0;
        var PEN_FIX = !!PRM.PEN_FIX, PEN_S0 = PRM.PEN_S0, PEN_S1 = PRM.PEN_S1, PEN_SD0 = PRM.PEN_SD0, PEN_SD1 = PRM.PEN_SD1, KF_BLK = PRM.KF_BLK || 0, KF_GKR = PRM.KF_GKR || 0, KF_GKS = PRM.KF_GKS || 0, KF_GKW = PRM.KF_GKW || 0, KF_GKB = PRM.KF_GKB || 0, KR_FT = PRM.KR_FT || .55, SU_PH = !!PRM.SU_PH, SURME = !!PRM.SURME, SU_N1 = PRM.SU_N1, SU_N2 = PRM.SU_N2, SU_GB = PRM.SU_GB, MG_PH = !!PRM.MG_PH, GT_X = [0, 1, 1.6, 2.5, 3.5, 4.2, 5, 6, 7, 8.3, 9.5], GT_Y = [1.2, 1.7, 2.0, 2.6, 2.85, 2.95, 3.1, 3.3, 3.55, 4.0, 4.3];
        var GTAB = [[0.317,3.927,0.205,0.698,0.22,-0.269],[0.369,3.927,0.287,0.698,0.198,-0.254],[0.457,3.927,0.43,0.698,0.154,-0.224],[0.32,4.712,0.368,1.484,0.034,-0.047],[0.394,4.625,0.41,1.484,0.04,-0.023],[0.448,4.538,0.451,1.484,0.049,0.002],[0.471,4.712,0.494,1.571,0.001,0.025],[0.503,4.974,0.51,1.658,-0.015,0.008],[0.475,4.974,0.526,1.745,0.004,-0.004],[0.475,4.974,0.526,1.745,0.004,-0.004]];      // [surme] GASP pozundan (tablo_gasp.js)
        var GDT = [0.4201,1.0001,1.4514,1.7776,2.0526,2.0429,2.2686,2.4942,2.7199,2.9455,3.1712,3.3351,3.4288,3.5226,3.6163,3.686,3.686,3.686,3.686,3.686,3.686];      // [surme] GASP ileri kosu cevrim mesafesi (m), hiz 0..10 m/sn .5 adim      // cizici temas tablosu (mocap kosu)
        function gaitK(sp, ck) { if (SU_PH) { var gu = Math.max(0, Math.min(19.999, (sp || 0) * 2)), gi = Math.floor(gu); return 2 * Math.PI / Math.max(.3, GDT[gi] + (GDT[gi + 1] - GDT[gi]) * (gu - gi)); } return gaitK0(sp, ck); }      // [surme] GASP cevrim mesafesi
        function gaitK0(sp, ck) { var c = GT_Y[GT_Y.length - 1], i; if (!(sp > 0)) c = GT_Y[0]; else for (i = 1; i < GT_X.length; i++) if (sp <= GT_X[i]) { c = GT_Y[i - 1] + (GT_Y[i] - GT_Y[i - 1]) * (sp - GT_X[i - 1]) / (GT_X[i] - GT_X[i - 1]); break; } return Math.PI * c * (1 + .12 * (ck || 0)) / Math.max(.35, sp || 0); }
        function nextPh(ph, e, k) { var a = e[1], b = e[3], tp = 2 * Math.PI, c = [], m; for (m = 0; m < 4; m++) { c.push(a + tp * (Math.floor((ph - a) / tp) + 1 + m)); c.push(b + tp * (Math.floor((ph - b) / tp) + 1 + m)); } c.sort(function (x, y) { return x - y; }); return c[Math.max(0, Math.min(c.length - 1, k))]; }
        function gaitStep() {      // [motor] adim evresi (konum guncellemesinden sonra)
            var kk = 1 - Math.exp(-DT / .18), ks = 1 - Math.exp(-DT / .12);
            for (var i = 0; i < 22; i++) {
                var p = S.players[i], g = p.gq || (p.gq = { x: p.x, y: p.y, sp: 0, ck: 0 }), dx = p.x - g.x, dy = p.y - g.y, d = hyp(dx, dy); if (d > 5) d = 0;
                var tg = B.owner === p && p.role !== 'GK' && S.mode === 'live' ? 1 : 0; g.ck += (tg - g.ck) * kk; g.sp += (Math.min(9.5, d / DT) - g.sp) * ks;
                var bk = d > 1e-4 && (dx * p.fx + dy * p.fy) < -.35 * d ? -1 : 1; p.pgph = p.gph || 0; p.gph = (p.gph || 0) + bk * d * gaitK(g.sp, g.ck); g.x = p.x; g.y = p.y;
            }
        }
        // [av] AV_DRAG: şutun yatay yavaşlaması (m/sn²) — havada ½ρC_dA·v²/m (C_d hıza göre: aeCd, BL_AERO ile aynı), yerde + çim yuvarlanma direnci
        function shDecA(v, air) { return AE_K * aeCd(v) * v * v + (air ? 0 : BL_RD); }
        // [av] şutun yatayda L m'yi aldığı süre (sn): ballStep3D ile aynı ayrık adım (önce hız, sonra konum); top 1,2 m/sn'ye düşerse kalan yol o hızla
        function shFlightT(L, v0, air) { var v = v0, x = 0, n = 0; while (x < L && n < 400) { v = Math.max(1.2, v - shDecA(v, air) * DT); x += v * DT; n++; } return n * DT - (x > L ? (x - L) / v : 0); }
        function rdec(v) { return BL_ROLL ? BL_RD + BL_AD * v * v + (BL_SLIDE && v < BL_LOWV ? BL_LOWD * (1 - v / BL_LOWV) : 0) : .30 * v + .5; }      // [v59] yavaş top çimde daha çabuk durur
        /* [v59] vuruştan / düşüşten sonra top önce KAYAR (kinetik sürtünme mu_k*g ≈ 3,9 m/sn²), dönüşü hızına yetişince (katı küre: hızın 5/7'si) YUVARLANIR (çim direnci + hava) */
        function gdec(v, slv) { return BL_SLIDE && v > slv ? BL_MUK * 9.81 + BL_AD * v * v : rdec(v); }      // [motor] yerdeki topun yavaslamasi (m/sn2)
        function travelV(v0, d) { var v = v0, x = 0, sl = BL_SLIDE ? v0 * BL_R57 : 0; while (x < d && v > .5) { x += v * .05; v -= gdec(v, sl) * .05; } return v; }
        function rollSpeed(d, vArr) { var lo = vArr, hi = 34; for (var i = 0; i < 14; i++) { var m = (lo + hi) / 2; if (travelV(m, d) >= vArr) hi = m; else lo = m; } return hi; }
        // ofsayt: takım tm hücum ederken rakibin sondan ikinci oyuncusunun kaleye uzaklığı
        function offDist(tm) { var gx = atkGoalX(tm), a = []; for (var i = 0; i < 22; i++) { var o = S.players[i]; if (o.team !== tm && !o.off) a.push(Math.abs(gx - o.x)); } a.sort(function (x, y) { return x - y; }); return a[1]; }
        function isOffside(q, fromX) { var gx = atkGoalX(q.team), dq = Math.abs(gx - q.x); return dq < offDist(q.team) - .2 && dq < Math.abs(gx - fromX) - .2 && dq < CX; }
        function nearestOpp(p) { var pd = 99, np = null; for (var i = 0; i < 22; i++) { var o = S.players[i]; if (o.team === p.team || o.off) continue; var d = hyp(o.x - p.x, o.y - p.y); if (d < pd) { pd = d; np = o; } } return { d: pd, p: np }; }

        // ---------- vuruşlar ----------
        function kick(p, vx, vy, opt) {
            opt = opt || {};
            var sp = hyp(vx, vy) || 1;
            if (CR_KV && TC_PHYS && B.owner === p && p.role !== 'GK' && p.cr) { B.x = gbx(); B.y = gby(); }      // deney: vurus sanal toptan
            var ownK = TOUCH && B.owner === p && hyp(B.x - p.x, B.y - p.y) < (TC_PHYS ? 2.4 : 1.2);
            if (keepBall) { ownK = true; keepBall = false; }      // [dead]/[air] top yerinde: duran top noktası / kafa teması
            B.owner = null; if (!ownK) { B.x = p.x + vx / sp * .75; B.y = p.y + vy / sp * .75; } B.vx = vx; B.vy = vy; B.last = p; S.lastTeam = p.team;
            if (CURL) B.sps = opt.sps || 0;      // [v137] yan dönüş (aeSolve bunu okur)
            B.high = opt.high || null; B.shotFlag = !!opt.shot; p.cd = .55; p.think = 0; B.slv = BL_SLIDE && !B.high && !B.shotFlag ? hyp(vx, vy) * BL_R57 : 0;
            S.chain[1 - p.team] = 0;
            if (BALL3D) {      // [ball] yerden pas/şut z=0 (şutun dikey hızı doShot verir) · yüksek top: hedefe tf sn sonra BL_HZ yükseklikte varacak balistik yay
                B.z = 0; B.vz = 0;
                if (B.high) {
                    var tf = Math.max(.25, B.high.tLand - S.t);
                    if (BL_HFIX) {      // [ball] ayrık çözüm: nI top adımı sonra top (x, y, BL_HZ)'de (vz önce, z sonra güncellenir); bu adımın top adımı daha işlemediyse ilk adım bu adımdır
                        var nI = Math.max(2, Math.round(tf / DT)), nT = nI * DT;
                        B.vx = (B.high.x - B.x) / nT; B.vy = (B.high.y - B.y) / nT; B.vz = (BL_HZ + BL_G * DT * DT * nI * (nI + 1) / 2) / nT;
                        if (BL_AERO) aeSolve(B.high.x, B.high.y, nI);      // [ball] hava kuvvetli: aynı adımda aynı noktaya, aynı yükseklikte
                        B.high.n = nI; B.high.tLand = S.t + (nI - (ballPending ? 1 : 0)) * DT;
                    } else B.vz = (BL_HZ + BL_G * tf * tf / 2) / tf;
                    B.high.h = B.vz * B.vz / (2 * BL_G);
                }
            }
        }
        // ---------- ayak seçimi (güçlü / zayıf ayak) ----------
        // Oyuncu genelde GÜÇLÜ ayağını kullanır. Zayıf ayak isteği (m, 0..1): vuruş yönü güçlü ayağın "ters" tarafına düştükçe (sağ ayaklı
        // için sağa doğru yan/çapraz vuruş - güçlü ayakla ancak dış-üst ya da vücut kapalı vurulabilir) ve oyuncunun gövdesini / topu güçlü
        // ayağına çevirecek zamanı yoksa (rakip baskısı, sürat) artar. Zayıf ayak yıldızı (1-5) hem kullanma olasılığını (WF_BASE + WF_SIT·m)
        // hem isabeti belirler: zayıf ayakla sapma WF_ERR, şut gücü WF_PW katı; zayıf ayağını kullanmayıp güçlü ayakla ters açıya zorlanan
        // oyuncu da (yıldızı düşükse) hafif isabet kaybeder. Duran toplar (penaltı, frikik, korner, aut, başlama vuruşu, kalecinin oyunu
        // başlatması) her zaman güçlü ayakla; taç (el) ve kafa ayaksızdır (foot=null). Çarpanlar lig ortalamasına (FOOT_NP/FOOT_NS) bölünür:
        // takım geneli isabet kalibrasyonu korunur, iki ayaklı oyuncu kazanır, tek ayaklı oyuncu zor durumda kaybeder.
        function footFor(p, dx, dy, set, pd, shot) {
            var ft = p.ft === 'L' ? 'L' : 'R', wf = p.wf >= 1 && p.wf <= 5 ? p.wf : 3, o = { foot: ft, weak: false, k: 1, pw: 1, m: 0 };
            if (set || !FOOT_ON) return o;
            var l = hyp(dx, dy) || 1, kx = dx / l, ky = dy / l, sp = hyp(p.vx, p.vy);
            var bx = sp > 1.2 ? p.vx / sp : kx, by = sp > 1.2 ? p.vy / sp : ky;          // gövde yönü: koşan oyuncuda koşu yönü; yavaş/duran oyuncu gövdesini vuruşa çevirir
            var side = bx * ky - by * kx;                                                  // > 0: vuruş oyuncunun SAĞINA, < 0: SOLUNA (hücum +x iken sol = −y)
            var adj = clamp((pd - 1.5) / 4, 0, 1) * (1 - clamp((sp - 3) / 4, 0, 1));      // düzeltme fırsatı: boş alan ve düşük hız
            var m = Math.max(0, ft === 'R' ? side : -side) * (1 - .75 * adj);
            o.m = m;
            if (RF() < clamp(WF_BASE[wf] + WF_SIT[wf] * m, 0, .95)) { o.foot = ft === 'L' ? 'R' : 'L'; o.weak = true; }
            o.k = (o.weak ? WF_ERR[wf] : 1 + .30 * m * (5 - wf) / 4) / (shot ? FOOT_NS : FOOT_NP);
            o.pw = o.weak ? WF_PW[wf] : 1;
            p.n.kick++; if (o.weak) p.n.weak++;
            var fa = shot ? S.dbg.footS : S.dbg.footP; fa[0] += o.k * (shot ? FOOT_NS : FOOT_NP); fa[1]++;      // laboratuvar: normalize edilmemiş çarpan ortalaması (FOOT_NP/FOOT_NS kalibrasyonu)
            return o;
        }
        function doPass(p, q, high, kindTag, info) {
            var d = hyp(q.x - p.x, q.y - p.y), pd = nearestOpp(p).d;
            var fo = kindTag === 'THROW' ? null : footFor(p, q.x - p.x, q.y - p.y, kindTag === 'CORNER' || kindTag === 'GOALKICK' || kindTag === 'KICKOFF' || kindTag === 'FREEKICK' || kindTag === 'GKD', pd, false), fk = fo ? fo.k : 1;
            var tf = high ? .7 + d / 24 : d / 14;
            var tx = q.x + q.vx * Math.min(tf, 1.4) * .8, ty = q.y + q.vy * Math.min(tf, 1.4) * .8;
            tx = clamp(tx, 1, PW - 1); ty = clamp(ty, 1, PH - 1);
            var pkE = AICAL && CURVE ? Math.exp(-AC_PK * (p.a.pas - 80) / 10) : 0;      // [aical] pas becerisinin elit eğrisi (80 = eski ortalama)
            var ang = Math.atan2(ty - p.y, tx - p.x) + gauss() * (.014 + (pkE ? .017 * pkE : (100 - p.a.pas) / 100 * .085) + (AV_PASS ? (pd < 3 ? avp('AV_PPE', .05) * (3 - pd) / 3 : 0) + avp('AV_PANG', .015) : (pd < 2 ? .03 : 0)) + d * .0007 + TP_ERR * tacOf(p.team).tempo) * fk;      // [av] AV_PASS: baskı altında sapma (StatsBomb baskı altında %70, baskısız %81)
            var mish = R() < clamp((PASS_MISS + (pkE ? .016 * pkE : (100 - p.a.pas) / 100 * .08) + (AV_PASS ? (pd < 3 ? avp('AV_PPM', .05) * (3 - pd) / 3 : 0) : (pd < 2 ? .03 : 0)) + (d > 30 ? .03 : 0) + TP_MISS * tacOf(p.team).tempo) * fk, 0, .3);
            if (mish) { var mda = (R() < .5 ? -1 : 1) * (.3 + .55 * R()); if (AV_OUT && Math.min(ty, PH - ty) < 8 && RA() < avp('AV_MSO', .7)) { var e1 = Math.abs(p.y + Math.sin(ang + mda) * d - CY), e2 = Math.abs(p.y + Math.sin(ang - mda) * d - CY); if (e2 > e1) mda = -mda; } ang += mda; }     // kötü vuruş: yön şaşar · [av] AV_OUT: kenardaki alıcıya kaçan pas çoğunlukla çizgi dışına
            var dd = hyp(tx - p.x, ty - p.y);
            var prog = (q.x - p.x) * S.teams[p.team].dir;
            if (high) {
                var err = gauss() * (1.2 + d * (AV_PASS ? PRM.AV_PERR : .05)) * (pkE ? .5 * Math.pow(pkE, .6) : 1 - p.a.pas / 160) * fk * (AV_PASS && ((info && info.cross) || kindTag === 'CORNER') ? PRM.AV_XERR : 1) * (AV_PASS && kindTag !== 'GOALKICK' && kindTag !== 'GKD' ? avp('AV_HERR', 2) : 1);
                if (S.forceAir != null && S.forceAir === q.id) err *= .2;      // [v186] zorla gol kurgusu: golcüye orta      // [av] AV_PASS: uzun top / orta düşme noktası sapması
                var lx = clamp(p.x + Math.cos(ang) * dd + err * .7, .5, PW - .5), ly = clamp(p.y + Math.sin(ang) * dd + err, AV_OUT && !/^(CORNER|GOALKICK|KICKOFF|THROW)$/.test(kindTag || '') ? -4 : .5, AV_OUT && !/^(CORNER|GOALKICK|KICKOFF|THROW)$/.test(kindTag || '') ? PH + 4 : PH - .5);      // [av] AV_OUT: kaçan uzun top taç çizgisini geçebilir
                var dl = hyp(lx - p.x, ly - p.y) || 1;
                var cuS = 0;      // [v137] yan dönüş: orta / korner / frikik ortası tam, uzun havadan pas CU_LD m'den uzunsa
                if (CURL && fo && kindTag !== 'GOALKICK' && kindTag !== 'GKD' && kindTag !== 'KICKOFF') {
                    var pa = p.a, crs = kindTag === 'CORNER' || kindTag === 'FREEKICK' || !!(info && info.cross);
                    cuS = crs ? cuSpin(fo.foot, fo.weak, CU_CROSS, kindTag === 'CORNER' ? (pa.cor != null ? pa.cor : pa.pas) : kindTag === 'FREEKICK' && pa.fk != null ? .5 * pa.fk + .5 * pa.pas : pa.cor != null ? .5 * pa.cor + .5 * pa.pas : pa.pas)
                        : d >= CU_LD ? cuSpin(fo.foot, fo.weak, CU_LONG, pa.pas) : 0;
                }
                kick(p, (lx - p.x) / tf, (ly - p.y) / tf, { high: { tLand: S.t + tf, t0: S.t, x: lx, y: ly, h: Math.min(9, 1.5 + dd / 7) }, sps: cuS });
            } else {
                var v0 = rollSpeed(dd, clamp(PASS_ARR + .12 * dd, PASS_ARR, PASS_ARR + 3) * (1 + TP_PSPD * tacOf(p.team).tempo));
                kick(p, Math.cos(ang) * v0, Math.sin(ang) * v0);
            }
            var setPc = kindTag === 'THROW' || kindTag === 'GOALKICK' || kindTag === 'CORNER' || kindTag === 'KICKOFF';      // duran toptan gelen pasta ofsayt yok
            // px/py/lx: pas anındaki vuruşçu konumu ve ofsayt çizgisi (sondan ikinci rakibin x'i); VAR ofsayt incelemesinin çizgileri buradan çizilir
            S.pass = { active: true, from: p, to: q, team: p.team, t0: S.t, high: !!high, tag: kindTag || null, tx: tx, ty: ty, offside: !setPc && isOffside(q, OFFS2 ? B.x : p.x), mo: setPc ? -9 : offMargin(q, OFFS2 ? B.x : p.x), qx: q.x, qy: q.y, px: p.x, py: p.y, lx: setPc ? null : atkGoalX(p.team) - S.teams[p.team].dir * offDist(p.team) };
            S.shot = null;
            if (OFFS2) { if (setPc) S.offSnap = null; else offSnapTake(p.team, B.x, p, q); }
            S.teams[p.team].st.passes++;
            emit('PASS', { team: p.team, p: p.id, p2: q.id, x: p.x, y: p.y, x2: q.x, y2: q.y, meta: { dist: d, prog: prog, high: !!high, tag: kindTag || null, lane: info ? info.lane : null, free: info ? info.free : null, pd: pd, pr: info && info.pr != null ? info.pr : null, ev: info && info.ev != null ? info.ev : null, run: !!(info && info.run), cross: !!(info && info.cross), sps: CURL ? B.sps || 0 : 0, foot: fo ? fo.foot : null, weak: !!(fo && fo.weak) } });
        }
        function doShot(p, xg, pd, kindTag, wall) {
            var T = S.teams[p.team], dir = T.dir, gx = dir === 1 ? PW : 0;
            if (kindTag !== 'PEN') {      // rakibin savunma talimatları şansın kalitesini değiştirir: geride/defansif/rahat baskı/dar → kale önü kalabalık ve dizili (kalite düşer) · önde/hücum/yüksek baskı/geniş → arkada ya da merkezde boşluk (kalite artar)
                var td = tacOf(1 - p.team), qm = 1 + LN_XG * td.line + MT_XG * td.ment + PR_XG * td.press + WD_XG * td.width;
                if (S.ctr && S.ctr.team === p.team) qm *= 1 + PRM.CT_XG * S.ctr.k;      /* [port] kontra: savunma dağınık */
                if (qm !== 1) xg = xg * clamp(qm, .6, 1.7);
            }
            var fa = kindTag === 'FK' ? p.a.fk * .7 + p.a.fin * .3 : p.a.fin;
            var ox = p.x, oy = p.y;      // şutun çıkış noktası: eski yolda vuruşçu (top önüne konur) · [touch] ayaktaki top / [dead] yerleştirilmiş top / [air] kafa teması: topun kendisi
            if ((TC_SLINE && TOUCH && B.owner === p && hyp(B.x - p.x, B.y - p.y) < 1.2) || keepBall) { ox = B.x; oy = B.y; }
            var side = R() < .5 ? -1 : 1, aimY = CY + side * (GW / 2 - .55 - R() * 1.1 * (1.2 - fa / 100));
            if (FIN_ON && FIN_AIM && kindTag !== 'PEN') {
                var gkS = gkOf(1 - p.team), scS = [0, 0], mgS = .55 + .5 * (1.2 - fa / 100);
                for (var si = 0; si < 2; si++) {
                    var ay = CY + (si ? 1 : -1) * (GW / 2 - mgS), ln = 4;
                    for (var oi = 0; oi < 22; oi++) { var oq = S.players[oi]; if (oq.team === p.team || oq.off || oq.role === 'GK') continue; var sdq = segDist(oq.x, oq.y, ox, oy, gx, ay); if (sdq < ln) ln = sdq; }
                    var gkd = gkS && !gkS.off ? segDist(gkS.x, gkS.y, ox, oy, gx, ay) : 3;
                    scS[si] = Math.min(ln, 2.5) + 1.3 * Math.min(gkd, 3);
                }
                var bestS = scS[1] > scS[0] ? 1 : -1, pRight = clamp(.55 + .008 * (fa - 55) + .04 * Math.abs(scS[1] - scS[0]), .5, .93);
                side = R() < pRight ? bestS : -bestS; aimY = CY + side * (GW / 2 - mgS - R() * .9 * (1.2 - fa / 100));
            }
            var d = hyp(gx - ox, aimY - oy);
            var sd = CURVE ? (SHOT_SD + (pd < 2.5 ? .08 : pd < 4 ? .04 : 0) * (AV_ATTR && p.a.cmp != null ? K(p.a.cmp, .3) : 1) + (kindTag === 'HEAD' ? .08 : 0)) * K(kindTag === 'HEAD' ? p.a.hea * .6 + p.a.fin * .4 : fa, .30) + d * .0040 * K(p.a.lon, .22)
                : .085 + (100 - fa) / 100 * .17 + (pd < 2.5 ? .05 : pd < 4 ? .025 : 0) + d * .0028 + (kindTag === 'HEAD' ? .06 : 0);
            if (kindTag === 'PEN') sd = PEN_FIX ? PEN_SD0 + (100 - (CURVE ? p.a.pen * .6 + p.a.sho * .4 : p.a.sho)) / 100 * PEN_SD1 : .012 + (100 - (CURVE ? p.a.pen * .6 + p.a.sho * .4 : p.a.sho)) / 100 * .04;      /* [pen] */
            var fo = kindTag === 'HEAD' ? null : footFor(p, gx - p.x, aimY - p.y, kindTag === 'PEN' || kindTag === 'FK', pd, true);
            if (fo) sd *= fo.k;
            if (FIN_ON && FIN_CL && kindTag !== 'PEN') { var dsh = hyp(gx - ox, CY - oy); sd *= clamp(.45 + dsh * .026, .55, 1); }      // [fin] 5 m ≈ .58 · 10 m ≈ .71 · 14 m ≈ .81 · 21 m+ = 1
            var ang = Math.atan2(aimY - oy, gx - ox) + gauss() * sd;
            var FG = S.forceGoal === p.team && (S.forceBy == null || S.forceBy === p.id || kindTag === 'PEN') && !(S.forceHold && kindTag !== 'PEN' && (S.forceOK !== p.id || (S.forceOKKind && kindTag !== S.forceOKKind) || (S.forceOKMax && hyp(gx - ox, CY - oy) > S.forceOKMax))), NG = false;      // [v186] forceHold: zorla golün türü kurgulanırken golcünün sıradan şutu gol sayılmaz (yalnız kurgunun bitiriş anı: forceOK)      // [port] zorunlu gol / gol yok
            if (FG) { var fgA = fgAim(p, ox, oy, gx, fa); aimY = fgA ? fgA.y : CY + (aimY < CY ? -1 : 1) * (GW / 2 - 1.1); sd = 0; ang = Math.atan2(aimY - oy, gx - ox); }      /* [v183] zorla gol kalecinin uzak köşesine (eskiden rastgele köşe, 1,1 m içeriden: kaleci çoğu kez topun yolundaydı) */
            else if (S.noGoal) { NG = true; var gkN = gkOf(1 - p.team); if ((R() < .45 || (S.forceRebound != null && p.team === S.forceGoal && p.id !== S.forceRebound)) && gkN && !gkN.off) { aimY = clamp(gkN.y + gauss() * .35, GY0 + .3, GY1 - .3); } else { aimY = CY + (aimY < CY ? -1 : 1) * (GW / 2 + .8 + R() * 2.6); } sd *= .25; ang = Math.atan2(aimY - oy, gx - ox) + gauss() * sd; }
            // serbest vuruş barajı: vuruş barajın üzerinden/yanından aşar ya da baraja çarpar (kişi sayısı ve vuruşçunun becerisine göre); çarpacaksa top gerçekten baraj oyuncusuna gider
            var wl = kindTag === 'FK' && wall && wall.n ? wall : null, wHit = -1;
            if (wl && !FG && R() < clamp((WALL_B0 + WALL_B1 * wl.n) * (1 + (75 - fa) * .008), .03, .6)) {
                var bs = null, bl = 1e9; wl.slots.forEach(function (sl) { var ld = segDist(sl.x, sl.y, ox, oy, gx, aimY) + R() * 1.1; if (ld < bl) { bl = ld; bs = sl; } });
                if (bs) { ang = Math.atan2(bs.y - oy, bs.x - ox) + gauss() * .03; wHit = bs.id; }
            }
            var v0 = (AICAL && kindTag === 'HEAD' ? AC_HV + .05 * (p.a.hea - 75) + .03 * (p.a.str - 75) : AV_SHOT && kindTag !== 'HEAD' ? clamp(PRM.AV_SV0 + PRM.AV_SV1 * p.a.sho + (hyp(gx - ox, CY - oy) > 16 ? 3 : 0) + gaussA() * PRM.AV_SVSD, 13, 34) : 21 + .11 * p.a.sho + (kindTag === 'HEAD' ? -6 : 0)) * (fo ? fo.pw : 1);      // [av] AV_SHOT: gerçek şut hızı (Metrica medyan 22 m/sn; p25–p75 19,9–24,1)      // [aical] kafa vuruşu gerçekçi hızda
            var cy = oy + Math.tan(ang) * (gx - ox);
            var onT = Math.cos(ang) * dir > 0 && cy > GY0 + .05 && cy < GY1 - .05;
            var pl = kindTag === 'HEAD' ? 0 : 0;
            var cuS = 0;      // [v137] yan dönüş: doğrudan frikik şutu (fk), uzaktan şut (lon; CU_LS0 m'den +10 m'ye artar) · kafa, penaltı ve baraja giden vuruş düz
            if (CURL && fo && kindTag !== 'PEN' && kindTag !== 'HEAD' && wHit < 0) {
                var dsc = hyp(gx - ox, CY - oy);
                cuS = kindTag === 'FK' ? cuSpin(fo.foot, fo.weak, CU_FK, p.a.fk != null ? p.a.fk : p.a.lon) : cuSpin(fo.foot, fo.weak, CU_LS * clamp((dsc - CU_LS0) / 10, 0, 1), p.a.lon);
            }
            kick(p, Math.cos(ang) * v0, Math.sin(ang) * v0, { shot: true, sps: cuS });
            if (FG) { ang = Math.atan2(aimY - B.y, gx - B.x); B.vx = Math.cos(ang) * v0; B.vy = Math.sin(ang) * v0; cy = aimY; onT = true; }
            var cz = 0;
            if (BALL3D) { cz = shotVert(p, kindTag, gx, ang, v0, sd); if (cz >= (TC_SLINE ? GH : GH - BRAD * .5)) onT = false; }      // [ball] üstten giden şut isabetli değildir ([touch] TC_SLINE: gol koşuluyla aynı eşik)
            if (CURL && B.sps) cuShotAim(gx, B.y + Math.tan(Math.atan2(B.vy, B.vx)) * (gx - B.x));      // [v137] kıvrılan şut kale çizgisini düz yoldaki noktada geçer
            S.pass = null;
            S.shot = { t0: S.t, shooter: p, team: p.team, xg: xg, on: onT, cy: cy, cz: cz, gkTried: false, pen: kindTag === 'PEN', blockChecked: false, hd: kindTag === 'HEAD', ox: ox, oy: oy, dist0: hyp(gx - ox, CY - oy), wall: wl ? wl.ids : null, wallHit: wHit };
            if (FG) { S.shot.force = true; S.shot.on = true; onT = true; } if (NG) S.shot.ng = true;
            if (OFFS2) offSnapTake(p.team, B.x, p);
            var xgF = xgFeat(ox, oy, p.team, pd, kindTag), xgR = xgRep(xgF, kindTag); S.shot.xgr = xgR; if (!S.lastShotT) S.lastShotT = [null, null]; S.lastShotT[p.team] = S.t;      /* [xg] */
            T.st.shots++; T.st.xg += XG_REP ? xgR : xg; if (onT) T.st.sot++;
            var gk = gkOf(1 - p.team);
            if (GKP && !onT && Math.abs(cy - CY) < GW / 2 + 2.5) { gk.saveY = oy + Math.tan(ang) * (gk.x - ox); gk.saveT = S.t; }
            if (onT) { var yy = oy + Math.tan(ang) * (gk.x - ox); gk.saveY = yy; gk.saveT = S.t; }
            if (FG && gk && !gk.off) { var yF = B.y + Math.tan(Math.atan2(B.vy, B.vx)) * (gk.x - B.x), gF = yF - gk.y; gk.saveY = gk.y + (gF > 0 ? 1 : -1) * clamp(Math.abs(gF) - 2.4, 0, .5); }      /* [v183] zorla gol: kaleci topun yoluna kaymaz (eskiden tam yola geçip top içinden geçiyordu); uzanır ama yetişemez */
            var shM = { xg: XG_REP ? xgR : xg, xgi: xg, xf: xgF, on: onT, dist: hyp(gx - ox, CY - oy), inBox: inBox(p.x, p.y, p.team), tag: kindTag || null, speed: v0, cy: cy };
            if (BALL3D) { shM.cz = cz; shM.over = cz >= (TC_SLINE ? GH : GH - BRAD * .5); }      // [ball] dikey hedef ve üstten giden şut yalnız 3B topta (BALL3D=0: eski olay verisi aynen)
            shM.wall = wl ? wl.n : 0; shM.foot = fo ? fo.foot : null; shM.weak = !!(fo && fo.weak); if (CURL && B.sps) shM.sps = B.sps;      // [v137] yan dönüş (devir/sn)
            emit('SHOT', { team: p.team, p: p.id, x: p.x, y: p.y, meta: shM });
            if (kindTag === 'PEN') S.shot.pen = true;
        }
        // [ball] şutun dikey bileşeni: vuruşçu bir yükseklik hedefler (çoğunlukla alçak köşeler), dikey sapma yatay açısal sapmayla aynı kökenden (beceri, baskı, ayak, mesafe).
        // Topun kale çizgisine varış süresi şut sürüklenmesiyle (.10·v) hesaplanır; dikey hız topun o anda hedef yükseklikte olacağı şekilde seçilir. Dönen: kale çizgisindeki yükseklik (m)
        // [ball] SH_VFIX: yol topun sahadan ilk çıkacağı noktaya kadar (kale çizgisine paralele yakın şutta taç çizgisi), süre / hedef yükseklik / dikey hız sınırlı · [touch] TC_SLINE: ayrık entegrasyon düzeltmesi
        function shotVert(p, tag, gx, ang, v0, sd) {
            var ca = Math.abs(Math.cos(ang)) || .01, L = Math.abs(gx - B.x) / ca, Ls;
            if (SH_VFIX) { var sa = Math.sin(ang), Ly = sa > .01 ? (PH - B.y) / sa : sa < -.01 ? B.y / -sa : 1e9; L = Math.cos(ang) * (gx - B.x) > 0 ? Math.min(L, Ly) : Math.min(Ly, 30); }
            var q = 1 - .1 * L / v0, t = AV_DRAG ? shFlightT(L, v0, true) : q > .05 ? -Math.log(q) / .1 : L / v0 * 1.6;      // [av] AV_DRAG: v² hava direnciyle varış süresi
            if (SH_VFIX) t = clamp(t, 2 * DT, SH_TMAX);
            var z0 = tag === 'HEAD' ? (AIR_TGT && hdZ != null ? clamp(hdZ, .5, 2.3) : 2.0) : 0, aim;      // [air] kafa vuruşu temas yüksekliğinden
            if (tag === 'HEAD') aim = .2 + .9 * R();
            else aim = SH_AIMZ0 + (SH_AIMZ1 - SH_AIMZ0) * Math.pow(R(), 1.4);
            if (SH_VFIX) { Ls = Math.min(L, hyp(gx - B.x, CY - B.y)); aim *= clamp(Ls / 8, .4, 1); } else Ls = L;      // dikey sapma kaleye uzaklıkla; çok yakından alçak hedef
            var zg = aim + gauss() * Ls * sd * SH_VK;
            if (tag !== 'HEAD' && zg < .25) { B.z = 0; B.vz = 0; return 0; }      // yerden (yuvarlanan) şut
            zg = Math.max(0, zg);
            if (SH_VFIX) zg = Math.min(zg, SH_ZMAX);
            var dz = TC_SLINE ? BL_G * t * DT / 2 : 0;      // [touch] yarı örtük Euler (vz önce, z sonra): ayrık yörünge sürekli yayın g·t·DT/2 altında
            B.z = z0; B.vz = (zg - z0 + BL_G * t * t / 2 + dz) / t;
            if (SH_VFIX && B.vz > SH_VZMAX) { B.vz = SH_VZMAX; zg = Math.max(0, z0 + B.vz * t - BL_G * t * t / 2 - dz); }      // tavan: kale çizgisindeki yükseklik buna göre
            return zg;
        }
        // konum değeri: takım tm topu (x,y)'de tutuyorsa yaklaşık gol yolu değeri (kaleye uzaklık + kenarlık)
        /* [ky] karar yapay zekasi, adim B: ogrenilmis saha degeri (EPV). Kucuk sinir agi (8 -> 16 -> 12 -> 2, tanh / sigmoid), lab maclarindan
           (epv_topla.js: top sahibi varken her .5 sn'de durum + "takim 15 sn icinde gol atti mi / yedi mi") epv_egit.js ile egitildi. Girdiler:
           kaleye uzaklik, kale agzi acisi, yanal sapma, sahada ilerleme, kaleyle arasindaki savunmaci sayisi, 5 / 10 m icindeki rakip sayisi,
           en yakin rakip uzakligi. Cikti P(gol) "o noktada topa sahip olmanin degeri": pas hedefi, top surme, top kaybi maliyeti ve topsuz
           oyuncunun yer secimi (posValue) bunu kullanir; KY_EPV karisim orani (0: eski elle ayarli egri). */
        var EPV_W = {"L":[8,16,12,2],"W":[[0.3087,-0.3378,-0.8508,-0.1022,-0.4562,-0.3409,0.4293,-0.0922,0.0871,0.1393,0.0561,-0.4701,0.068,0.0427,-0.5367,-0.1817,-0.0798,0.0999,0.3385,-0.1458,0.1781,0.1962,-0.0295,-0.1006,0.8758,-0.5216,0.3271,0.0675,0.2417,0.4401,0.2916,-0.2774,-0.4013,0.7111,-0.468,0.4822,-0.1362,-0.1408,-0.0136,0.3776,-0.1149,0.0404,0.3415,-0.1678,-0.0413,0.2469,0.057,0.2978,0.6368,-1.0166,0.0758,-0.243,-0.2028,-0.214,-0.2515,-0.6127,0.2152,-0.9666,0.8442,0.0272,0.2453,-0.2231,-0.2703,-0.3769,-0.9982,0.7527,0.4922,-0.0148,-0.2011,0.0835,-0.0512,-0.0718,0.622,-0.4786,0.3905,0.1058,0.4414,0.0766,-0.4314,0.3644,-0.4313,0.665,0.5856,0.8037,0.3375,-0.3447,-0.2662,-0.226,0.1385,-0.0623,0.4328,-0.187,0.3497,0.0419,0.2372,-0.0129,-0.0215,0.3514,0.3967,-0.5796,-0.0694,0.2409,0.0065,0.483,-0.1356,-0.1512,-0.261,0.4588,-0.2737,-0.325,-0.1393,0.3242,-0.2554,-0.0436,-0.0552,-0.4437,0.0532,-0.024,-0.2087,-0.5146,-1.0016,1.5061,0.5777,0.087,-0.3079,-0.1534,-0.1708,-0.1122],[0.0173,-0.2585,-0.0224,0.3005,-0.015,0.0349,-0.075,0.0401,-0.1931,0.1824,0.1325,0.0941,0.0853,0.2758,-0.5414,-0.1272,0.0792,-0.0678,-0.0751,0.4172,0.1868,0.0165,-0.2099,-0.0561,-0.0507,0.2114,0.1158,-0.0146,0.0206,0.1844,-0.2249,-0.0677,-0.2028,0.1652,0.0951,-0.0141,-0.03,-0.0825,0.1224,-0.0051,0.1656,-0.2606,0.1407,-0.0641,-0.2056,-0.1111,0.0995,-0.2157,0.2586,-0.1835,-0.1063,0.1457,-0.2557,0.0204,0.5127,0.2247,-0.3795,-0.1074,-0.3785,-0.1229,-0.1359,0.2229,0.0157,-0.8552,-0.34,-0.1718,0.1085,0.5324,-0.6332,0.0466,0.8304,0.6073,-0.5821,0.4701,0.1309,0.2967,0.0015,-0.0711,-0.0015,-1.2882,0.244,-0.6435,-0.071,0.2776,0.5045,-0.1775,-0.287,-0.1007,0.2302,-0.0768,0.4842,-0.1846,-0.679,0.1659,-0.2055,-0.0066,-0.1737,0.2853,0.0965,-0.6491,-0.1841,-0.0014,0.2357,0.2048,0.003,-0.17,-0.1331,0.0739,-0.0051,-0.1752,0.1775,0.0474,-0.3243,0.0605,-0.0261,-0.0296,0.3345,0.1293,-0.4374,0.1525,0.6725,-0.138,0.6507,0.1845,0.1031,0.1474,0.0464,1.1252,0.4034,0.2531,-0.0518,-0.222,-0.8038,-0.1726,0.4987,-0.1257,0.2461,-0.3514,-0.4695,0.3081,0.1046,-0.4505,0.3114,-0.1918,-0.0365,-0.1959,-0.0519,0.2914,0.141,0.0236,-0.1823,-0.0073,-0.335,0.2593,0.11,-0.007,0.0122,0.2054,-0.5006,-0.13,0.0905,-0.1356,-0.1821,-0.3664,0.1744,-0.1295,-0.2688,-0.2316,0.1005,-0.1462,-0.0504,-0.1003,-0.2672,-0.017,0.282,-0.1438,-0.4808,0.226,0.269,-0.4997,-0.3461,0.0573,0.6166,0.4206,0.0124,-0.3388,0.2793,0.0739,-0.0568,-0.1945,0.1814,-0.3908],[0.1132,0.0926,-0.0131,-0.6371,-0.7224,0.4308,-0.1494,0.3896,-0.5047,0.1651,0.0791,-0.1052,-0.666,-0.2626,0.308,0.5925,-0.2405,-0.3696,0.4512,-0.5578,0.3503,-0.5304,0.2813,0.5203]],"B":[[0.035,-0.3831,0.0825,0.1762,0.0025,-0.0826,0.1077,0.0845,0.055,0.1272,-0.0215,-0.1278,-0.0401,0.0631,-0.2019,0.0562],[0.4914,0.4215,-0.2394,0.0227,0.2203,0.3045,-0.3854,-0.1032,-0.3288,0.556,-0.0032,-0.2304],[-3.358,-3.7768]]}, EPV_H1 = new Float64Array(16), EPV_H2 = new Float64Array(12), EPV_F = new Float64Array(8);
        function epvAt(x, y, tm) {
            var dir = S.teams[tm].dir, gx = dir === 1 ? PW : 0, dx = Math.max(.5, Math.abs(gx - x)), d = hyp(gx - x, CY - y), i, j, q;
            var ang = Math.abs(Math.atan2(GY1 - y, dx) - Math.atan2(GY0 - y, dx)), xr = (x - (dir === 1 ? 0 : PW)) * dir, n5 = 0, n10 = 0, nb = 0, nd = 20;
            for (i = 0; i < 22; i++) {
                q = S.players[i]; if (q.team === tm || q.off) continue; var qd = hyp(q.x - x, q.y - y); if (qd < nd) nd = qd; if (qd < 5) n5++; if (qd < 10) n10++;
                if (q.role === 'GK' || (q.x - x) * dir < 0) continue;
                var s1 = (gx - x) * (q.y - y) - (GY0 - y) * (q.x - x), s2 = (gx - x) * (q.y - y) - (GY1 - y) * (q.x - x); if (s1 * s2 <= 0) nb++;
            }
            var F = EPV_F; F[0] = d / 50; F[1] = ang / Math.PI; F[2] = Math.abs(y - CY) / 34; F[3] = xr / PW; F[4] = Math.min(nb, 6) / 6; F[5] = Math.min(n5, 4) / 4; F[6] = Math.min(n10, 7) / 7; F[7] = Math.min(nd, 12) / 12;
            var W0 = EPV_W.W[0], W1 = EPV_W.W[1], W2 = EPV_W.W[2], B0 = EPV_W.B[0], B1 = EPV_W.B[1], B2 = EPV_W.B[2];
            for (j = 0; j < 16; j++) { var s = B0[j]; for (i = 0; i < 8; i++) s += W0[j * 8 + i] * F[i]; EPV_H1[j] = Math.tanh(s); }
            for (j = 0; j < 12; j++) { var s2b = B1[j]; for (i = 0; i < 16; i++) s2b += W1[j * 16 + i] * EPV_H1[i]; EPV_H2[j] = Math.tanh(s2b); }
            var z = B2[0]; for (i = 0; i < 12; i++) z += W2[i] * EPV_H2[i];
            return 1 / (1 + Math.exp(-z));
        }
        function posValue(x, y, tm) { var v0 = posValue0(x, y, tm); return KY_EPV > 0 ? v0 + (epvAt(x, y, tm) * KY_EPS - v0) * KY_EPV : v0; }
        S.epvAt = epvAt;
        function posValue0(x, y, tm) {
            var d = hyp(atkGoalX(tm) - x, CY - y), wide = Math.abs(y - CY) / 34;
            return (PV_BASE + PV_AMP * Math.exp(-d / PV_LEN)) * (1 - .3 * wide * Math.exp(-d / 30));
        }
        function lossCost(x, y, tm, k) { return (posValue(x, y, 1 - tm) + TURN_C + (AICAL ? AC_PV * qRel[tm] : 0)) * LOSS_W * (k == null ? 1 : k); }     // topu (x,y)'de kaybedersek rakibin kazandığı değer ([aical] + kendi topa sahip olma değerimiz)
        // [aical] takım gücü (saha oyuncularının teknik + savunma ortalaması; eksik oyuncu sıfır sayılır) ve topa sahip olma değeri çarpanı qRel
        var qRel = [1, 1];
        function teamQ(tm) { var s = 0; S.players.forEach(function (q) { if (q.team !== tm || q.off || q.role === 'GK') return; var a = q.a; s += a.pas * .25 + a.dri * .2 + a.vis * .15 + a.posi * .1 + a.tac * .15 + a.pac * .15; }); return s / 10; }
        function calcQ() { var q0 = teamQ(0), q1 = teamQ(1); var dq = clamp(AC_QK * (q0 - q1) / 10, -(S.qMax != null ? S.qMax : .9), (S.qMax != null ? S.qMax : .9)); qRel = [Math.exp(dq), Math.exp(-dq)];      /* [port] büyük güç farkında topa sahip olma değeri sınırlı: güçlü takım kısır paslaşmaya gömülmesin */ }
        // ---------- oyuncu beyni: bağlam ve karar ağırlıkları ----------
        // ctxUrg: skor ve dakikaya göre aciliyet (+ geride/geç → risk ve ileri oyun, − önde/geç → topu koru)
        function ctxUrg(tm) {
            var diff = S.teams[tm].score - S.teams[1 - tm].score, late = clamp((S.t / FULL_S - .55) / .45, 0, 1);
            if (diff < 0) return clamp(-diff, 0, 2) * .5 * (.35 + .65 * late);
            if (diff > 0) return -clamp(diff, 0, 2) * .45 * late;
            return 0;
        }
        // brainK: oyuncunun kişiliği + bağlam → karar terimlerinin çarpanları (hepsi 1 civarı; BR_ON=0 iken tam 1)
        function trApply(p, ro) {      /* [trait] kayıttaki karakteristikler beyin ve davranış çarpanlarına */
            var L = ro && ro.db && ro.db.tr; p.tr = L && L.length ? L.slice() : null; p.trRun = 1; p.trDrib = 1; p.trShot = 1; p.trOvl = 1; p.trKn = false; p.trCd = {};
            if (!p.tr) return; var b = p.br, a = p.a, h = function (k) { return p.tr.indexOf(k) >= 0; };
            if (h('arakos')) { p.trRun = 1.9; b.po += .6; }
            if (h('toplakos')) { p.trDrib = 1.35; b.dz += .8; }
            if (h('hiz')) { p.trKn = true; p.trDrib *= 1.1; }
            if (h('uzak')) { p.trShot = 1.18; a.lon = Math.min(99, (a.lon || 60) + 8); b.sz += .4; }
            if (h('uzunpas')) { b.vz += .9; }
            if (h('kisapas')) { b.vz -= .7; b.risk -= .6; }
            if (h('bindir')) { p.trOvl = 1.9; }
            if (h('sert')) { a.agg = Math.min(95, (a.agg != null ? a.agg : 40) + 18); }
            if (h('didis')) { a.agg = Math.min(95, (a.agg != null ? a.agg : 40) + 6); }
        }
        function trEv(p, k, cd) { if (!p || !p.tr || p.tr.indexOf(k) < 0) return; var t = p.trCd[k] || -99; if (S.t - t < (cd || 40)) return; p.trCd[k] = S.t; emit('TRAIT', { team: p.team, p: p.id, x: p.x, y: p.y, meta: { k: k } }); }
        function brainK(p) {
            var b = p.br, u = BR_ON ? ctxUrg(p.team) * (AV_LATE && S.t > FULL_S * .78 && S.teams[p.team].score < S.teams[1 - p.team].score ? 1.6 : 1) : 0, st = BR_ON ? (.8 + .2 * p.stam) * (FATIGUE ? 1 - .5 * p.anaD : 1) : 1, m = tacOf(p.team).ment;       // m: takım mentalitesi (−1 defansif · 0 dengeli · +1 hücum)
            var ck = S.ctr && S.ctr.team === p.team ? S.ctr.k : 0;      /* [port] kontra atakta ileri oyun ve risk artar */
            return { urg: u, ctr: ck,
                loss: (1 - .3 * ck) * clamp(1 - BR_RISK * b.risk - BR_URG * .6 * u - MT_LOSS * m, .55, 1.4),          // kayıp maliyeti çarpanı (risk alan oyuncu kaybı daha az önemser)
                prog: clamp(1 + BR_PROG * b.vz + BR_URG * 1.2 * u + MT_PROG * m + PRM.CT_PROG * ck + .2 * tacOf(p.team).tempo, .4, 2.6),            // ileri oyun isteği
                shot: (p.trShot || 1) * clamp(1 + BR_SHOOT * b.sz + BR_URG * .6 * u + MT_SHOT * m + PRM.CT_SHOT * ck, .6, 1.8),            // şut isteği
                shotMin: clamp(1 - BR_SMIN * b.sz - .5 * BR_SMIN * u - MT_SMIN * m, .6, 1.4),                        // şut eşiği (bitiriciler daha düşük olasılıkla da vurur)
                drib: (p.trDrib || 1) * clamp(1 + BR_DRIB * b.dz + BR_URG * .5 * u + MT_DRIB * m, .55, 1.6) * st };      // çalım isteği (yorgunlukla azalır)
        }
        // pas başarı inancı (fit2.js ile simülasyon sonuçlarına oturtuldu): koridor boşluğu doygun üstel, alıcı baskısı, uzaklık, yüksek top, pas özelliği
        // [av] AV_PASS: uzunluk cezası AV_PL0 m'den sonra e^(−AV_PL1·Δd) (StatsBomb: 30–45 m %61, 45 m+ %37), havadan AV_PHH, pasçı baskı altındaysa (en yakın rakip < 3 m) ×(.86 + .045·uzaklık)
        function passProb(p, lane, free, d, high, pdP) {
            var s1 = 1 - Math.exp(-lane / PP_LANE), s2 = PP_C0 + (1 - PP_C0) * (1 - Math.exp(-Math.pow(free / PP_F0, .87)));
            var pr = .995 * s1 * s2 * (AV_PASS ? Math.exp(-PRM.AV_PL1 * Math.max(0, d - PRM.AV_PL0)) : Math.exp(-PP_A3 * Math.max(0, d - 20))) * (high ? PP_HH : 1) * (1 + .003 * (p.a.pas - 70)) * PP_BASE;
            if (AV_PASS && pdP != null && pdP < 3) pr *= .86 + .045 * pdP;
            return clamp(pr, .02, .985);
        }
        // [aical] hava topu ağırlığı (resolveAerial ile aynı formül, uzaklık cezası dahil)
        function hgtK(q) { return clamp(((q.a.h || 180) - 180) * .6, -12, 14); }      // [v131] boy farkı hava topu gücüne
        function aerW(q, dd) { return (CURVE ? Math.exp(.028 * ((q.role === 'GK' ? 90 + ((q.a.gk_air || 70) - 70) * .6 : q.a.hea * .55 + q.a.str * .3 + q.a.pac * .15 + hgtK(q)) - 70)) * 60 : (q.a.hea * .5 + q.a.str * .3 + q.a.pac * .1 + (q.role === 'GK' ? 40 : 0))) / (1 + dd * .55); }
        // [aical] kalecinin çıkış bölgesi: kendi ceza sahasına, kale çizgisine AC_GKD m'ye kadar (pozisyon alma ±) inen yüksek top
        function gkZone(g, lx, ly) { var gp = g.a.gk_pos != null ? g.a.gk_pos : g.a.gk, og = ownGoalX(g.team); return inBox(lx, ly, 1 - g.team) && Math.abs(lx - og) <= (AV_GK ? Math.max(AC_GKD, Math.abs(g.x - og) + 4) : AC_GKD) + .12 * (gp - 75); }      // [av] AV_GK: ileride duran kaleci arkaya atılan topa daha geniş bölgeden çıkar
        // [aical] orta başarısı: düelloya alıcı (ortayı bekler, inişe koşar), savunmanın topa en erken varan oyuncusu (AC_XRX sn geç tepkiyle) ve iniş noktasının zaten yakınındakiler (markajcılar) girer; kaleci bölgesine inen topa yetişebiliyorsa çıkar
        function crossPr(p, q, lx, ly, d) {
            var tf = .7 + d / 24, de = Math.max(0, hyp(q.x - lx, q.y - ly) - q.maxV * .75 * tf), wd = 0, i, o, dO, dN, bD = 99, bW = 0, bN = false;
            if (de > 3.4) return .03;
            var wa = aerW(q, de);
            for (i = 0; i < 22; i++) {
                o = S.players[i]; if (o.team === p.team || o.off) continue;
                if (o.role === 'GK') { if (gkZone(o, lx, ly) && hyp(o.x - lx, o.y - ly) - o.maxV * .65 * Math.max(0, tf - gkReact(o)) < 1) wd += aerW(o, 0) * AC_GKW; continue; }
                dN = hyp(o.x - lx, o.y - ly); dO = Math.max(0, dN - o.maxV * .75 * Math.max(0, tf - AC_XRX));
                if (dN < 4.9) wd += aerW(o, Math.max(0, dN - 1.5));      // zaten iniş noktasının yakınında (markaj)
                if (dO < bD) { bD = dO; bW = aerW(o, dO); bN = dN < 4.9; }
            }
            if (bD < 3.4 && !bN) wd += bW;      // topa koşan savunmacı
            var acc = AV_PASS ? clamp(avp('AV_XA0', .78) + .004 * ((p.a.cor != null ? .5 * p.a.cor + .5 * p.a.pas : p.a.pas) - 70) - .004 * d, .45, .9) : clamp(1 - (1.2 + d * .05) * (1 - p.a.pas / 160) * .12, .6, 1);      // [av] AV_PASS: orta isabeti (StatsBomb ortaların %71,5'i tamamlanamıyor)      // orta isabeti: düşme noktasının sapması (doPass yüksek top hatasıyla aynı ölçek)
            return clamp(wa / (wa + wd) * acc, .03, .9);
        }
        // ortalama bölgesi: kanatta (kenarlık yakını) ve rakip kalesinin son 30 m'sinde
        function crossZone(p) { var dg = Math.abs(atkGoalX(p.team) - p.x); return Math.abs(p.y - CY) >= 15 && dg <= 30 && dg >= (AICAL ? 1 : 6); }      // [aical] kale çizgisine kadar
        // [aical] pasçının ofsayt algısı: tau sn önceki görüntü (alıcı ve savunmacılar hızlarıyla geri sarılır)
        function offSeen(q, p) {
            var tau = AC_PL * clamp(1.6 - p.a.vis / 100, .5, 1.2), gx = atkGoalX(q.team), a = [], i, o;
            for (i = 0; i < 22; i++) { o = S.players[i]; if (o.team !== q.team && !o.off) a.push(Math.abs(gx - (o.x - o.vx * tau))); }
            a.sort(function (u, v) { return u - v; });
            var dq = Math.abs(gx - (q.x - q.vx * tau));
            return dq < a[1] - .2 && dq < Math.abs(gx - p.x) - .2 && dq < CX;
        }
        // Pas seçenekleri: her hedef için başarı olasılığı, hedefin konum değeri ve beklenen değer (ev). s = ev·100 (spiker/karar katmanı bu ölçeği kullanır)
        function passOptions(p, allowGK, wantProg, noNoise) {
            var T = S.teams[p.team], dir = T.dir, gx = atkGoalX(p.team), list = [];
            var nz = noNoise ? 0 : (1.25 - p.a.vis / 100) * .010, bk = brainK(p), seeP = clamp(.85 + BR_SEE * p.br.vz, .3, 1), pdP = AV_PASS ? nearestOpp(p).d : null;
            for (var i = 0; i < 22; i++) {
                var q = S.players[i]; if (q.team !== p.team || q === p || q.off) continue;
                if (q.role === 'GK' && !allowGK) continue;
                var d0 = hyp(q.x - p.x, q.y - p.y); if (d0 < 4 || d0 > 48) continue;
                if (!noNoise && BR_ON && d0 > 26 && R() > seeP) continue;      // algı: düşük vizyonlu oyuncu uzaktaki her seçeneği görmez
                // top alıcının gelecekteki noktasına gider (koşu yapan oyuncuya ara pası): doPass ile aynı öncü mesafe
                var tfl = d0 > 38 ? .7 + d0 / 24 : d0 / 14, lead = Math.min(tfl, 1.4) * .8;
                var lx = clamp(q.x + q.vx * lead, 1, PW - 1), ly = clamp(q.y + q.vy * lead, 1, PH - 1);
                var d = hyp(lx - p.x, ly - p.y); if (d < 3) continue;
                var prog = (lx - p.x) * dir, lane = 8, free = 10;
                for (var j = 0; j < 22; j++) {
                    var o = S.players[j]; if (o.team === p.team || o.off) continue;
                    var sd = segDist(o.x, o.y, p.x, p.y, lx, ly); if (sd < lane) lane = sd;
                    var od = hyp(o.x - lx, o.y - ly); if (od < free) free = od;
                }
                var cross = crossZone(p) && d >= 9 && inBox(lx, ly, p.team), high = d > 38 || cross;
                var pr = passProb(p, cross ? Math.max(lane, 3) : lane, free, d, high, pdP);
                if (cross) {
                    if (AICAL) { var prL = d <= 38 && Math.abs(gx - p.x) <= AC_LOWD ? passProb(p, lane, free, d, false, pdP) : 0; pr = crossPr(p, q, lx, ly, d); if (prL > pr) { pr = prL; high = false; } }      // [aical] orta: havadan (hava düellosu) ya da yerden (koridor)
                    else pr *= PP_CROSS;
                    pr *= 1 + WD_CROSS * tacOf(p.team).width;
                }
                if (q.run && q.run.until > S.t) pr *= PP_RUN * clamp(1 + .015 * (q.a.pac - 70), .75, 1.35);      // [v131] hızlı koşucuya ara pas daha cazip
                var off = AICAL ? offSeen(q, p) : isOffside(q, p.x);      // [aical] gecikmeli algı
                if (off && (noNoise || R() > OFFS_MISS * (1.5 - p.a.vis / 100))) pr = .03;     // paslaşmaz (nadiren yanlış görür → ofsayt kararı)
                var vq = posValue(lx, ly, p.team) * (.55 + .45 * Math.min(free, 6) / 6);
                var sw = 0; if (BR_ON) { if (d > 24 && Math.abs(ly - p.y) > 18) sw += BR_LONG * .004 * p.br.vz; if (q.run && q.run.until > S.t && prog > 8) sw += BR_LONG * .003 * p.br.vz; }     // vizyon: oyun değiştirme ve koşucuya ara pas
                var ev = pr * vq - (1 - pr) * lossCost(p.x + (lx - p.x) * .7, p.y + (ly - p.y) * .7, p.team, bk.loss) + PROG_W * bk.prog * pr * clamp(prog, -12, 40) + sw + (noNoise ? 0 : gauss() * nz);
                if (AV_PASS && cross) ev += avp('AV_XV', .01);      // [av] ortanın değeri: dönen top / korner / kafa şansı (gerçekte takım başına ~12 orta, %28 tamamlanır)
                var s = ev * 100;
                if (wantProg && prog < wantProg) s -= 4;
                list.push({ q: q, s: s, ev: ev, pr: pr, vq: vq, d: d, prog: prog, lane: lane, free: free, high: high, cross: cross, run: !!(q.run && q.run.until > S.t) });
            }
            return list;
        }
        function bestPass(p, allowGK, wantProg) {
            var l = passOptions(p, allowGK, wantProg, false), best = null;
            for (var i = 0; i < l.length; i++) if (!best || l[i].s > best.s) best = l[i];
            return best;
        }
        // kaleciden oyun kurma talimatı: kısa (yakın seçenekler, ≤ 30 m) · uzun (ilerisi 25 m'den az olan seçeneklere ceza)
        function gkPass(p, wantProg, gkl) {
            var l = passOptions(p, false, wantProg, false), best = null, bs = -1e9, i, sc;
            if (gkl < 0) { var sh = l.filter(function (o) { return o.d <= 30; }); if (sh.length) l = sh; }
            for (i = 0; i < l.length; i++) { sc = l[i].s - (gkl > 0 && l[i].prog < 25 ? GKD_W : 0); if (!best || sc > bs) { best = l[i]; bs = sc; } }
            return best;
        }
        function clearance(p) {
            var dir = S.teams[p.team].dir, ty = p.y < CY ? 1.5 : PH - 1.5, tx = clamp(p.x + dir * 38, 6, PW - 6);
            if (AV_OUT) { var cu = avp('AV_CLI', 2.5) - avp('AV_CLW', 5) * RA(); ty = p.y < CY ? cu : PH - cu;
                if (Math.abs(p.x - ownGoalX(p.team)) < 14 && Math.abs(p.y - CY) > 7 && RA() < avp('AV_CLB', .35)) { tx = ownGoalX(p.team) - dir * 4; ty = CY + (p.y < CY ? -1 : 1) * (GW / 2 + 4 + 8 * RA()); }      // [av] baskı altındaki savunmacı topu kale çizgisinin dışına (korner) atar
            }      // [av] AV_OUT: uzaklaştırma kenara — yarıya yakını taç çizgisinin dışına (gerçekte taçların çoğu uzaklaştırma ve kaçan toptan)
            var tf = .8 + hyp(tx - p.x, ty - p.y) / 24, fo = footFor(p, tx - p.x, ty - p.y, false, nearestOpp(p).d, false);
            var ang = Math.atan2(ty - p.y, tx - p.x) + gauss() * .09 * fo.k;
            var d = hyp(tx - p.x, ty - p.y), lx = p.x + Math.cos(ang) * d, ly = clamp(p.y + Math.sin(ang) * d, AV_OUT ? -6 : .5, AV_OUT ? PH + 6 : PH - .5);
            kick(p, (lx - p.x) / tf, (ly - p.y) / tf, { high: { tLand: S.t + tf, t0: S.t, x: clamp(lx, AV_OUT ? -5 : .5, AV_OUT ? PW + 5 : PW - .5), y: ly, h: 7 } });
            S.pass = { active: true, from: p, to: null, team: p.team, t0: S.t, high: true, tag: 'CLEAR' };
            if (OFFS2) offSnapTake(p.team, B.x, p);
            S.teams[p.team].st.passes++;
            emit('CLEAR', { team: p.team, p: p.id, x: p.x, y: p.y, meta: { foot: fo.foot, weak: fo.weak } });
        }

        // ---------- top sahibi karar ----------
        /* [port] kullanıcı kontrolü */
        function ctlOn(p) { var c = S.ctl; return !!(c && !c.auto && c.id === p.id && !p.off && S.mode === 'live'); }
        function ctlAim(p) { var c = S.ctl, m = hyp(c.mx, c.my), dir = S.teams[p.team].dir; if (m > .2) return [c.mx / m, c.my / m]; var gx = atkGoalX(p.team), vx = gx - p.x, vy = CY - p.y, l = hyp(vx, vy) || 1; return [vx / l, vy / l]; }
        function ctlPick(p, kind) {
            var a = ctlAim(p), L = passOptions(p, kind !== 'through' && kind !== 'cross', 0, true), best = null, bs = -1e9;
            for (var i = 0; i < L.length; i++) { var o = L[i], dx = o.q.x - p.x, dy = o.q.y - p.y, dl = hyp(dx, dy) || 1, dot = (dx * a[0] + dy * a[1]) / dl; if (dot < .35) continue;
                var sc = dot * 2.2 + o.pr * 1.2 + (kind === 'through' ? clamp(o.prog, -10, 30) * .03 : 0) + (kind === 'cross' ? (o.cross ? 1.5 : inBox(o.q.x, o.q.y, p.team) ? 1 : -1) : 0) - (o.d > 35 && kind === 'pass' ? .4 : 0); if (sc > bs) { bs = sc; best = o; } }
            if (kind === 'pass' && hyp(S.ctl.mx, S.ctl.my) <= .2 && S.ctl.sug >= 0) for (var k2 = 0; k2 < L.length; k2++) if (L[k2].q.id === S.ctl.sug) best = L[k2];      /* yön verilmezse önerilen arkadaşa */
            if (!best) for (var j = 0; j < L.length; j++) if (!best || L[j].ev > best.ev) best = L[j];
            return best;
        }
        function ctlOwner(o) {
            var c = S.ctl, m = hyp(c.mx, c.my); o.knock = false;
            if (!c.sugT || S.t - c.sugT > .3 || S.t < c.sugT) { var sb = bestPass(o, false, 0); c.sug = sb && sb.pr > .45 ? sb.q.id : -1; c.sugPr = sb ? sb.pr : 0; c.sugProg = sb ? sb.prog : 0; c.sugT = S.t; }
            if (m > .2 || c.act) c.io = 0; else c.io = (c.io || 0) + DT;
            if (!c.act && c.io > 1.1) { if (o.think > 0) o.think -= DT; else { o.waitT = 0; decide(o); } return; }      /* girdi yoksa yapay zekâ yardımı */
            o.holdT = 0;
            if (m > .2) { o.dribble = true; o.dribType = 'carry'; o.think = .4; } else { o.dribble = false; o.think = .4; }
            var act = c.act; if (!act) return; c.act = null; c.n = (c.n || 0) + 1;
            var T = S.teams[o.team], dir = T.dir, pd = nearestOpp(o).d;
            if (act === 'shoot') { c.sh = (c.sh || 0) + 1; o.p_shot = (o.p_shot || 0) + 1; doShot(o, xgAt(o.x, o.y, dir, pd), pd, null); return; }
            if (act === 'pass' || act === 'through' || act === 'cross') {
                var b = ctlPick(o, act); if (!b) return; var q = b.q;
                if (act === 'through') { var ax = ctlAim(o), sv = [q.vx, q.vy], gxq = atkGoalX(q.team); q.vx = (ax[0] * .5 + dir * .8) * 7; q.vy = ax[1] * 4; q.run = { x: clamp(q.x + dir * 14, 2, PW - 2), y: clamp(q.y + ax[1] * 6, 3, PH - 3), until: S.t + 2.6 }; doPass(o, q, false, null, b); q.vx = sv[0]; q.vy = sv[1]; }
                else doPass(o, q, act === 'cross' ? true : b.high, null, b);
                c.ps = (c.ps || 0) + 1; return;
            }
        }
        function ctlMove() {
            var c = S.ctl; if (!c || c.auto || S.mode !== 'live') return; var p = S.players[c.id]; if (!p || p.off) return;
            var m = hyp(c.mx, c.my), own = B.owner === p;
            c.ax = p.tx; c.ay = p.ty; if (!own) c.sug = -1;      /* yapay zekânın önerdiği yer (oyuncu kendi başına olsa nereye giderdi) */
            if (c.act === 'tackle' || c.act === 'call') { if (c.act === 'call') { c.callT = S.t; if (B.owner && B.owner.team === p.team && B.owner !== p) B.owner.think = Math.min(B.owner.think, .25); } else c.pressT = S.t + 1.2; c.act = null; }
            if (!own && c.pressT && S.t < c.pressT && B.owner && B.owner.team !== p.team) { p.tx = B.owner.x; p.ty = B.owner.y; p.sf = 1; p.tcd = Math.min(p.tcd || 0, 0); c.idle = 0; return; }
            if (m > .2) { p.tx = clamp(p.x + c.mx / m * 7, 1, PW - 1); p.ty = clamp(p.y + c.my / m * 7, 1, PH - 1); p.sf = own ? (c.spr ? .97 : .74) : (c.spr ? 1 : .78); p.chk = null; p.late = null; c.idle = 0;
                var hasB = B.owner && B.owner.team === p.team && B.owner !== p, fwd = c.mx / m * S.teams[p.team].dir;      /* [port] takım arkadaşları koşunu görür: depar atarak ileri koşarsan ara pası gelir */
                p.run = hasB && c.spr && fwd > .4 ? { x: clamp(p.x + c.mx / m * 12, 2, PW - 2), y: clamp(p.y + c.my / m * 12, 2, PH - 2), until: S.t + .5 } : null;
                if (own && TC_PHYS && p.role !== 'GK') { if (CR_STEER) carrySteer(p); else if (p.cr) { p.cr.atx = p.tx; p.cr.aty = p.ty; } } }
            else c.idle = (c.idle || 0) + DT;
        }
        S.setCtl = function (id) { S.ctl = id == null || id < 0 ? null : { id: id, mx: 0, my: 0, spr: false, act: null, idle: 0 }; };
        S.ctlInput = function (mx, my, spr) { if (!S.ctl) return; S.ctl.mx = mx || 0; S.ctl.my = my || 0; S.ctl.spr = !!spr; };
        S.ctlAct = function (k) { if (!S.ctl) return; S.ctl.act = k; };
        /* [v183] zorla gol: kalecinin uzak köşesi (şut yolunun kaleciye uzaklığı en büyük köşe) · fırsat açık mı (S.forceGap: kaleci-yol aralığı, S.forceAng: kale ağzına yan açı sınırı) */
        function fgAim(p, ox, oy, gx, fa) {
            var gk = gkOf(1 - p.team), ins = .55 + .5 * clamp(1 - (fa || 70) / 100, 0, .5), best = null, i, ay, g;
            for (i = 0; i < 2; i++) { ay = CY + (i ? 1 : -1) * (GW / 2 - ins); g = gk && !gk.off ? segDist(gk.x, gk.y, ox, oy, gx, ay) : 9; if (!best || g > best.g) best = { y: ay, g: g }; }
            return best;
        }
        function fgOpen(p) {
            var need = S.forceGap || 0, gx = atkGoalX(p.team), ox = p.x, oy = p.y, dy = Math.abs(oy - CY), dx = Math.abs(gx - ox);
            if (S.forceAng && dy > S.forceAng * Math.max(dx, 1)) return false;      // çizgiye çok yakın, dar açı
            if (!(need > 0)) return true;
            var a = fgAim(p, ox, oy, gx, p.a.fin); if (!a || a.g < need) return false;
            for (var i = 0; i < 22; i++) { var o = S.players[i]; if (o.team === p.team || o.off || o.role === 'GK') continue; if (segDist(o.x, o.y, ox, oy, gx, a.y) < .8) return false; }      // şut yolunda savunmacı
            return true;
        }
        function decide(p) {
            var T = S.teams[p.team], dir = T.dir, gx = atkGoalX(p.team);
            var no = nearestOpp(p), pd = no.d, dGoal = hyp(gx - p.x, CY - p.y);
            p.think = (TEMPO_A + TEMPO_B * R()) * (1 - TP_THINK * tacOf(p.team).tempo); p.dribble = false;
            if (p.role === 'GK') {
                var gkl = tacOf(p.team).gk, bp = gkl ? gkPass(p, 6, gkl) : bestPass(p, false, 6); if (bp) doPass(p, bp.q, bp.d > (gkl > 0 ? 30 : 40), 'GKD'); else clearance(p);
                return;
            }
            if (S.forceGoal === p.team && (S.forceBy == null || S.forceBy === p.id) && !(S.forceHold && S.forceOK !== p.id) && dGoal < (S.forceDist || 30) && p.role !== 'GK' && fgOpen(p)) { doShot(p, xgAt(p.x, p.y, dir, pd), pd, null); return; }
            if (S.ctl && S.ctl.callT && S.t - S.ctl.callT < 1.6) { var cq0 = S.players[S.ctl.id]; if (cq0 && !cq0.off && cq0.team === p.team && cq0 !== p) { var co0 = passOptions(p, false, 0, true).filter(function (o) { return o.q === cq0; })[0]; if (co0 && co0.pr > .28) { S.ctl.callT = 0; S.ctl.got = (S.ctl.got || 0) + 1; doPass(p, cq0, co0.high, null, co0); return; } } }      /* [port] kullanıcı pas istedi */
            if (S.forceGoal === p.team && S.forceBy != null && S.forceBy !== p.id && !S.forceNoFeed) { var fq = S.players[S.forceBy]; if (fq && !fq.off && fq.team === p.team && hyp(fq.x - p.x, fq.y - p.y) < 42 && R() < .7) { doPass(p, fq, hyp(fq.x - p.x, fq.y - p.y) > 24, null); return; } }      /* [port] golcü adayına pas */
            var ownThird = (p.x - ownGoalX(p.team)) * dir < 30, bk = brainK(p), alt = {};
            if ((p.holdT || 0) > HOLD_MAX) {      // topu çok tuttu: sıkışmışsa en iyi pas, yoksa uzaklaştır
                var fb = bestPass(p, true, 0);
                if (fb && fb.s > -6) doPass(p, fb.q, fb.high, null, fb); else clearance(p);
                return;
            }
            var opts = passOptions(p, ownThird && pd < 3.5, 0, false), best = null;
            opts.forEach(function (o) { if (!best || o.ev > best.ev) best = o; });
            var ev = best ? best.ev : -9, act = 'pass'; alt.pass = best ? best.ev : null;
            // "yanlış kişiye pas": EYLEM seçimi (pas/şut/çalım/uzaklaştırma) her zaman gerçek en iyi değere göre kalır (ev/best değişmez);
            // yalnızca pas atılacaksa KİME atılacağı, karar kalitesi düştükçe en iyi seçenek yerine yakın-ama-daha-kötü bir seçeneğe kayabilir.
            var passTarget = best;
            if (DEC_ON && best && opts.length > 1) {
                var missP = clamp(DEC_MISS * decK(p), 0, .55);
                if (R() < missP) {
                    var sortedOpts = opts.slice().sort(function (x, y) { return y.ev - x.ev; });
                    var pool = sortedOpts.slice(1, Math.min(sortedOpts.length, 5)).filter(function (o) { return !isOffside(o.q, p.x); });   // ofsayttaki oyuncu "yanlışlıkla" seçilmez - bu OFFS_MISS'in işi
                    if (pool.length) passTarget = pool[Math.floor(R() * pool.length)];
                }
            }
            var fwd = /ST|AM|W$/.test(p.role) ? 1 : 0, dribType = 'carry';
            // şut
            var xg = xgAt(p.x, p.y, dir, pd);
            if (dGoal < 36) {
                var laneS = 9; for (var jj = 0; jj < 22; jj++) { var oo = S.players[jj]; if (oo.team === p.team || oo.role === 'GK' || oo.off) continue; var sdd = segDist(oo.x, oo.y, p.x, p.y, gx, CY); if (sdd < laneS) laneS = sdd; }
                var belief = KY_ON ? xgDec(xgFeat(p.x, p.y, p.team, pd, null), null) * clamp(1 + .012 * (p.a.fin - 70), .6, 1.4) : xg * clamp(1 + .012 * (p.a.fin - 70), .6, 1.4) * (laneS > 2.2 ? 1 : laneS > 1.3 ? .7 : .35);      /* [ky] ogrenilmis xG */
                var shMin = KY_ON ? KY_MIN * (1 - clamp((p.a.lon - 70) * .012, -.3, .4)) : SHOT_MIN;      /* [ky] iyi uzaktan sutcu daha dusuk olasilikla da dener */
                var evS = (belief + SPILL) * (KY_ON ? KY_SW : SHOT_W) * bk.shot * (1 + .25 * fwd + (p.a.lon - 66) * (KY_ON ? KY_LON : .003)) - (1 - belief) * lossCost(p.x, p.y, p.team, bk.loss) * SHOT_LOSS + (p.a.agg - 40) * .00006 + gauss() * DEC_ACT * decK(p);
                if (AV_SHOT) shMin *= 1 + avp('AV_SDK', .1) * Math.max(0, dGoal - avp('AV_SD0', 16));      // [av] AV_SHOT: uzaklaştıkça eşik yükselir (gerçek xG ile şutların %60'ı ceza sahası içinden; StatsBomb)
                if (AV_LATE && S.t > FULL_S * .78 && T.score < opp(p.team).score) shMin *= .8;      // [av] AV_LATE: son 20 dk geride olan takım daha düşük olasılıkla da vurur (gol dakikası 76–90+ %22,5)
                alt.shot = belief >= shMin * bk.shotMin ? evS : null;
                if (evS > ev && belief >= shMin * bk.shotMin) { ev = evS; act = 'shot'; }
            }
            // top sürme: önündeki en fazla 2 savunmacıyı geçme olasılığı (take-on çekişmesiyle aynı model)
            if (dGoal > 9 && !(ownThird && pd < 3)) {
                var pk = .95 - (pd < 2 ? .05 : 0), ahd = 6, blockers = [];
                for (var j = 0; j < 22; j++) { var o = S.players[j]; if (o.team === p.team || o.role === 'GK' || o.off) continue; var ox = (o.x - p.x) * dir, oy = Math.abs(o.y - p.y); if (ox > 0 && ox < 9 && oy < 3.2 + ox * .3) blockers.push({ o: o, ox: ox }); }
                blockers.sort(function (u, v) { return u.ox - v.ox; });
                for (var bi = 0; bi < Math.min(2, blockers.length); bi++) pk *= 1 - clamp(tackleP(blockers[bi].o, p, TAKEON_P) + .03, 0, .9);
                var evD = (pk * posValue(p.x + dir * ahd, p.y + (CY - p.y) * .12, p.team) + PROG_W * bk.prog * pk * ahd - (1 - pk) * lossCost(p.x, p.y, p.team, bk.loss) - DRIB_COST) * DRIB_EV * bk.drib * (1 + .2 * fwd) + gauss() * DEC_ACT * decK(p);
                alt.drib = evD;
                if (FIN_ON && FIN_EARLY && dGoal < 20) { var gk3 = gkOf(1 - p.team), gkd3 = gk3 && !gk3.off ? hyp(gk3.x - p.x, gk3.y - p.y) : 20; var shk = (gkd3 < 9 ? .55 : gkd3 < 13 ? .8 : 1) * (pd < 2.2 ? .8 : 1); if (alt.shot != null && shk < 1) { evD = evD * shk - (1 - shk) * .01; alt.drib = evD; } }      // [fin] kaleci üstüne gelirken çekip vurur
                if (evD > ev) { ev = evD; act = 'drib'; dribType = blockers.length && blockers[0].ox < 4.5 ? 'takeon' : 'carry'; }
            }
            // uzaklaştırma: kendi bölgesinde sıkışık ve elde iyi seçenek yoksa
            if (ownThird && pd < 3.5) {
                var evC = -lossCost(p.x + dir * 25, p.y, p.team, bk.loss) * .5 - .003 + gauss() * DEC_ACT * decK(p); alt.clear = evC;
                if (evC > ev) { ev = evC; act = 'clear'; }
            }
            S.dbg.dec[act] = (S.dbg.dec[act] || 0) + 1;
            p.dec = { t: S.t, act: act, alt: alt, q: (act === 'pass' && passTarget) ? passTarget.q.id : -1, pr: passTarget ? passTarget.pr : null, urg: bk.urg }; p.n.dec++;      // karar kaydı: katman ve laboratuvar için
            if (act === 'shot') { p.n.shot++; doShot(p, xg, pd, null); return; }
            if (act === 'drib') { p.n.drib++; if (dribType === 'takeon') p.n.take++; p.dribble = true; if (AICAL) p.wideLine = wideLine(p); p.dribType = dribType; p.dribT = .6 + R() * .6; p.knock = KNOCK && dribType === 'carry' && knockOK(p); if (p.knock) trEv(p, 'hiz', 35); else if (act === 'drib') trEv(p, 'toplakos', 45);
                if (p.knock) { p.dribT *= 1.5; S.dbg.kn = (S.dbg.kn || 0) + 1; } p.think = p.dribT; return; }
            if (act === 'clear') { p.n.clear++; clearance(p); return; }
            if (passTarget) { p.n.pass++; if (passTarget.prog > 10) p.n.fwd++; if (passTarget.d > 25) p.n.long++; if (passTarget.d > 24 && Math.abs(passTarget.q.y - p.y) > 18) p.n.sw++; doPass(p, passTarget.q, passTarget.high, null, passTarget); return; }
            p.dribble = true; p.dribType = 'carry'; p.dribT = .5; p.think = .5; p.knock = false;
        }

        // [aical] kanat / bek son 45 m'de kenarda topla koşuyorsa çizgiye iner mi (güçlü ayak çizgi tarafındaysa çoğunlukla; ters ayaklı çoğunlukla içeri keser)
        function wideLine(p) {
            if (!/^(LW|RW|LB|RB)$/.test(p.role)) return false;
            var dg = Math.abs(atkGoalX(p.team) - p.x); if (Math.abs(p.y - CY) < 13 || dg > 45 || dg < 9) return false;
            var leftSide = (p.y < CY) === (S.teams[p.team].dir === 1), out = (leftSide ? p.ft === 'L' : p.ft === 'R'), two = p.wf >= 4;
            return R() < (out ? AC_LT : two ? (AC_LT + AC_LI) / 2 : AC_LI);
        }
        // ---------- ölü top ----------
        function corner(p, dd) {
            var att = S.players.filter(function (q) { return !q.off && (q.team === p.team && q !== p && q.role !== 'GK' && inBox(q.x, q.y, p.team) || (q.team === p.team && q !== p && q.role === 'ST')); });
            var sp = S.spr && S.spr[p.team], q;
            if (sp && sp.cor && att.length) q = sprCorner(p, att, sp, R());      // [v164] kullanıcının korner rutini: R() yine tam bir kez tüketilir (belirlenimcilik korunur)
            else q = att.length ? att[Math.floor(R() * att.length)] : DEADFB ? (bestPass(p, false, 0) || shortMate(p, 0)).q : bestPass(p, false, 0).q;      // [dead] DEADFB: pas seçeneği yoksa kısa
            if (S.forceCorner != null && p.team === S.forceGoal) { var fcq = S.players[S.forceCorner]; if (fcq && !fcq.off && fcq.team === p.team && fcq !== p) { q = fcq; S.forceAir = fcq.id; } S.forceCorner = null; }      // [v186] zorla gol kurgusu: korner golcüye (kafa)
            doPass(p, q, true, 'CORNER');
        }
        // [v164] korner rutini: r < w ise rutinin hedef noktasına en yakın hücumcu (yakın direk / uzak direk / penaltı noktası) ya da kısa korner; değilse eski tekdüze seçim
        function sprCorner(p, att, sp, r) {
            var w = sp.w != null ? sp.w : .6;
            if (r >= w) return att[Math.min(att.length - 1, Math.floor((r - w) / (1 - w) * att.length))];
            if (sp.cor === 'short') { var sm = shortMate(p, 0); if (sm && sm.q) return sm.q; return att[0]; }
            var gx = atkGoalX(p.team), sg = gx > CX ? -1 : 1, ny = p.y < CY ? CY - GW / 2 : CY + GW / 2, fy = p.y < CY ? CY + GW / 2 : CY - GW / 2;
            var tx = sp.cor === 'spot' ? gx + sg * 11 : gx + sg * (sp.cor === 'near' ? 4.5 : 6), ty = sp.cor === 'near' ? ny : sp.cor === 'far' ? fy : CY;
            var b = att[0], bd = 1e9; att.forEach(function (q) { var d = hyp(q.x - tx, q.y - ty); if (d < bd) { bd = d; b = q; } }); return b;
        }
        // [dead] DEADFB: uygun pas yoksa en yakın / en iyi kısa seçenek (gürültüsüz, R tüketmez); hiç yoksa en yakın arkadaş
        function shortMate(p, wp) { var b = null; passOptions(p, false, wp, true).forEach(function (o) { if (!b || o.s > b.s) b = o; }); if (!b) { var m1 = anyMate(p); if (m1) b = { q: m1, d: hyp(m1.x - p.x, m1.y - p.y) }; } return b; }
        // [dead] TI_FIX: taç atışında top çizginin üstünden (saha içinden) bırakılır ve sahaya doğru gider (IFAB 15)
        function throwIn() { B.y = clamp(B.y, .05, PH - .05); if ((B.y < CY && B.vy < 0) || (B.y >= CY && B.vy > 0)) B.vy = -B.vy; }
        // [fk] FKD: doğrudan serbest vuruşta şut olasılığı (xG, vuruşçunun serbest vuruş becerisi, baraj)
        function fkShotP(p, d) { var xgF = xgAt(p.x, p.y, S.teams[p.team].dir, 9) * .8, fk = p.a.fk != null ? p.a.fk : 70; return clamp(FKD_A * (xgF / .04) * (1 + FKD_SK * (fk - 75) / 25) * (1 - FKD_W * Math.max(0, (d.wall ? d.wall.n : 0) - 3)), 0, FKD_MAX); }
        function executeDead(d) {
            var p = d.taker, kind = d.kind;
            if (DEADB && kind !== 'throw') keepBall = true;      // [dead] top noktasında kalır (ölü topta her adım d.x, d.y'ye konur); vuruş onu oradan gönderir
            else { B.x = p.x + p.fx * .5; B.y = p.y + p.fy * .5; }
            S.mode = 'live'; S.dead = null;
            var no = nearestOpp(p);
            if (kind === 'kickoff') { var bp = bestPass(p, false, -20); doPass(p, bp ? bp.q : (P(p.team, 'AM') || anyMate(p)), false, 'KICKOFF'); S.pass.tag = 'KICKOFF'; return; }
            if (kind === 'throw') {
                var opts1 = passOptions(p, false, -5, false).filter(function (o) { return o.d >= 5 && o.d <= 24 && o.q.y > 3.5 && o.q.y < PH - 3.5; }), bp1 = null;
                opts1.forEach(function (o) { if (!bp1 || o.s > bp1.s) bp1 = o; });
                if (!bp1) bp1 = bestPass(p, false, -5);
                if (!bp1 && DEADFB) bp1 = shortMate(p, -5);      // [dead] yedek: en yakın arkadaşa kısa atış
                if (bp1) { S.teams[p.team].st.throwins++; doPass(p, bp1.q, false, 'THROW'); if (TI_FIX) throwIn(); } return;
            }
            if (kind === 'goalkick') { var gg = tacOf(p.team).gk, bp2 = gg ? gkPass(p, R() < GK_LONG + GKD_L * gg ? 20 : -30, gg) : bestPass(p, false, R() < GK_LONG ? 20 : -30); if (!d.drop) S.teams[p.team].st.goalkicks++; if (bp2) doPass(p, bp2.q, bp2.high || bp2.d > 30, 'GOALKICK'); else clearance(p); return; }
            if (kind === 'corner') { S.teams[p.team].st.corners++; corner(p); return; }
            if (kind === 'penalty') { doShot(p, .76, 9, 'PEN'); return; }
            if (kind === 'freekick') {
                var dG = hyp(atkGoalX(p.team) - p.x, CY - p.y);
                if (dG < 28 && dG > 15 && !d.indirect && ((S.forceFK != null && S.forceFK === p.id && S.forceGoal === p.team) || !FKD || R() < fkShotP(p, d))) { if (S.forceFK === p.id) S.forceFK = null; doShot(p, xgAt(p.x, p.y, S.teams[p.team].dir, 9) * .8, 9, 'FK', d.wall); return; }      // dolaylı serbest vuruş (ofsayt) doğrudan kaleye vurulamaz
                var bp3 = bestPass(p, false, 0); if (!bp3 && DEADFB) bp3 = shortMate(p, 0); if (bp3) doPass(p, bp3.q, bp3.d > 30, 'FREEKICK'); else if (DEADFB) clearance(p);      // [dead] yedek: kısa pas, o da yoksa uzaklaştırma
            }
        }

        // ---------- hedef atama ----------
        var traj = [], trajEnd = 24;
        function buildTraj() {
            if (BALL3D) { buildTraj3D(); return; }
            var x = B.x, y = B.y, vx = B.vx, vy = B.vy, hi = B.high;
            traj.length = 0; trajEnd = 24;
            for (var i = 0; i <= 24; i++) {
                traj.push([x, y]);
                for (var s = 0; s < 5; s++) {
                    if (hi && S.t + i * .2 + s * .04 < hi.tLand) { x += vx * .04; y += vy * .04; }
                    else { var v = hyp(vx, vy); if (v > .05) { var dv = gdec(v, B.slv || 0) * .04; var nv = Math.max(0, v - dv); vx *= nv / v; vy *= nv / v; } x += vx * .04; y += vy * .04; }
                }
            }
            for (var k = 1; k <= 24; k++) if (traj[k][0] < .3 || traj[k][0] > PW - .3 || traj[k][1] < .3 || traj[k][1] > PH - .3) { trajEnd = k - 1; break; }   // top bu noktadan sonra saha dışında: kovalanmaz
        }
        /* [ball] BL_AERO: yüksek topun bir adımı (yarı örtük Euler; önce hız, sonra konum). q: {x, y, z, vx, vy, vz}. Sürüklenme -½ρCdA|v|v⃗/m,
           kaldırma ½ρCLA|v|²/m hıza dik ve düşey düzlemde yukarı (ters dönüş) - yanal sapma yok, top hedef doğrusunda kalır. BL_AERO=0: eski adım. */
        var AE_K = .5 * 1.2 * Math.PI * .11 * .11 / .43, AE_Q = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
        function aeCd(v) { if (v <= 10) return .45; if (v >= 14) return .25; var u = (v - 10) / 4; u = u * u * (3 - 2 * u); return .45 - .2 * u; }
        /* [v137] AGIL: çeviklik çarpanı (dönüş hızı ve yanal ivme); a.agi yoksa .4·hızlanma (yoksa hız) + .35·denge + .25·top sürme */
        function agilK(a, role) {
            if (!AGIL || role === 'GK' || !a) return 1;
            var ag = a.agi != null ? +a.agi : .4 * (a.acc != null ? +a.acc : +a.pac || 70) + .35 * (a.bal != null ? +a.bal : 70) + .25 * (a.dri != null ? +a.dri : 70);
            return isFinite(ag) ? clamp(1 + AG_K * (ag - AG_C), 1 - AG_MAX, 1 + AG_MAX) : 1;
        }
        /* [v137] yan dönüşün yanal Magnus ivmesi (m/sn², işaretli): ½ρ·C_L·A·v²/m, C_L = .9·rω/v ≤ .35 (BL_AERO kaldırmasıyla aynı) */
        function cuAcc(v, sps) { var a = AE_K * Math.min(.35, .9 * .11 * Math.abs(sps) * 2 * Math.PI / Math.max(v, 1)) * v * v; return sps > 0 ? a : -a; }
        /* [v137] şutta yan dönüş: hız vektörü (büyüklük aynı) yanal ivme/v açısal hızla döner - şutun süresi ve dikey çözümü değişmez */
        function cuRot(q, k) { var v = hyp(q.vx, q.vy); if (v < 1) return; var th = -cuAcc(v, q.sps) * k / v * DT, c = Math.cos(th), sn = Math.sin(th), vx = q.vx; q.vx = vx * c - q.vy * sn; q.vy = vx * sn + q.vy * c; }
        /* [v137] vuruşun yan dönüşü (devir/sn): ayak içi - sağ ayak soluna (+), sol ayak sağına (−); büyüklük taban × (.55 + .45·beceri) × zayıf ayak */
        function cuSpin(foot, weak, base, tech) { if (!CURL || !(base > 0) || !foot) return 0; var t = clamp(((tech != null ? tech : 60) - 40) / 50, 0, 1), m = base * (.55 + .45 * t) * (weak ? CU_WEAK : 1); return foot === 'L' ? -m : m; }
        /* [v137] kıvrılan şut: başlangıç yönü, top kale çizgisini (gx) yine düz yoldaki noktada (cy) geçecek şekilde döndürülür (ballStep3D ile aynı adım) */
        var CU_Q = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, sps: 0 };
        function cuShotAim(gx, cy) {
            var dir = gx > CX ? 1 : -1, it, i, nMax = Math.ceil(SH_TMAX / DT) + 10;
            for (it = 0; it < 4; it++) {
                var q = CU_Q; q.x = B.x; q.y = B.y; q.z = B.z || 0; q.vx = B.vx; q.vy = B.vy; q.vz = B.vz || 0; q.sps = B.sps; var yc = null, xc = 0;
                for (i = 0; i < nMax; i++) {
                    var v = hyp(q.vx, q.vy), x0 = q.x, y0 = q.y;
                    if (q.z > 0 || q.vz > 0) { q.vz -= BL_G * DT; q.z += q.vz * DT; if (v > .02) { var n0 = Math.max(0, v - (AV_DRAG ? shDecA(v, true) * DT : .10 * v * DT)); q.vx *= n0 / v; q.vy *= n0 / v; } if (q.z <= 0) { q.z = 0; if (-q.vz > BL_BMIN) { q.vz = -q.vz * BL_E; q.vx *= BL_HRET; q.vy *= BL_HRET; } else q.vz = 0; } }
                    else if (v > .02) { var nv = Math.max(0, v - (AV_DRAG ? shDecA(v, false) * DT : .10 * v * DT)); q.vx *= nv / v; q.vy *= nv / v; }
                    cuRot(q, q.z > 0 ? 1 : CU_GND);
                    q.x += q.vx * DT; q.y += q.vy * DT;
                    if ((q.x - gx) * dir >= 0) { var u = (gx - x0) / ((q.x - x0) || 1e-9); yc = y0 + (q.y - y0) * u; xc = gx; break; }
                    if (q.y < 0 || q.y > PH || hyp(q.vx, q.vy) < 1.2) break;
                }
                if (yc == null) return;
                var e = yc - cy; if (Math.abs(e) < .02) return;
                var d0 = Math.atan2(cy - B.y, xc - B.x) - Math.atan2(yc - B.y, xc - B.x), c = Math.cos(d0), sn = Math.sin(d0), vx = B.vx; B.vx = vx * c - B.vy * sn; B.vy = vx * sn + B.vy * c;
            }
        }
        function hiStep(q) {
            if (!BL_AERO) { q.x += q.vx * DT; q.y += q.vy * DT; q.vz -= BL_G * DT; q.z += q.vz * DT; return q; }
            var vh = hyp(q.vx, q.vy), v = Math.sqrt(vh * vh + q.vz * q.vz), ax = 0, ay = 0, az = -BL_G;
            if (v > .05) {
                var kd = AE_K * aeCd(v) * v, kl = AE_K * Math.min(.35, .9 * .11 * BL_SPIN * 2 * Math.PI / v) * v;
                if (WXON) { var wrx = q.vx - WX_X, wry = q.vy - WX_Y, vr = Math.sqrt(wrx * wrx + wry * wry + q.vz * q.vz), kdr = AE_K * aeCd(vr) * vr; ax = -kdr * wrx; ay = -kdr * wry; az -= kdr * q.vz; }      // [v137] rüzgâr: göreli hava hızıyla sürüklenme
                else { ax = -kd * q.vx; ay = -kd * q.vy; az -= kd * q.vz; }
                if (vh > 1e-6) { ax -= kl * q.vz * q.vx / vh; ay -= kl * q.vz * q.vy / vh; az += kl * vh; }
                if (q.sps && vh > .5) { var kc = cuAcc(v, q.sps) / vh; ax += kc * q.vy; ay -= kc * q.vx; }      // [v137] yan dönüş: yatay hıza dik (sps > 0 → gidişin soluna)
            }
            q.vx += ax * DT; q.vy += ay * DT; q.vz += az * DT; q.x += q.vx * DT; q.y += q.vy * DT; q.z += q.vz * DT;
            return q;
        }
        function aeRun(x0, y0, z0, ux, uy, s, vz, n) { var q = AE_Q, i; q.x = x0; q.y = y0; q.z = z0; q.vx = ux * s; q.vy = uy * s; q.vz = vz; q.sps = CURL ? B.sps || 0 : 0; for (i = 0; i < n; i++) hiStep(q); return q; }
        // fırlatma hızı: n adım sonra top (hx, hy) noktasında BL_HZ yükseklikte (Newton, sonlu fark; boşluk çözümünden başlar)
        /* [v137] yan dönüşte / rüzgârda iniş noktası yanal kayar: nişan noktası kaymanın tersine taşınarak çözüm yinelenir (gerçek iniş = ilan edilen iniş noktası) */
        function aeSolve(hx, hy, n) {
            aeSolve0(hx, hy, n); if (!((CURL && B.sps) || WXON)) return;
            var mx = hx, my = hy, it, q;
            for (it = 0; it < 5; it++) {
                q = aeRun(B.x, B.y, B.z || 0, 1, 0, 0, B.vz, 0); q.vx = B.vx; q.vy = B.vy; for (var j = 0; j < n; j++) hiStep(q);
                var ex = q.x - hx, ey = q.y - hy; if (ex * ex + ey * ey < 1e-4) break;
                mx -= ex; my -= ey; aeSolve0(mx, my, n);
            }
        }
        function aeSolve0(hx, hy, n) {
            var dx = hx - B.x, dy = hy - B.y, D = hyp(dx, dy); if (D < .5) return;
            var ux = dx / D, uy = dy / D, s = hyp(B.vx, B.vy), vz = B.vz, z0 = B.z || 0, it, q, ex, ez, h = .05;
            for (it = 0; it < 10; it++) {
                q = aeRun(B.x, B.y, z0, ux, uy, s, vz, n); ex = (q.x - B.x) * ux + (q.y - B.y) * uy - D; ez = q.z - BL_HZ;
                if (Math.abs(ex) < .003 && Math.abs(ez) < .003) break;
                q = aeRun(B.x, B.y, z0, ux, uy, s + h, vz, n); var a1 = ((q.x - B.x) * ux + (q.y - B.y) * uy - D - ex) / h, c1 = (q.z - BL_HZ - ez) / h;
                q = aeRun(B.x, B.y, z0, ux, uy, s, vz + h, n); var b1 = ((q.x - B.x) * ux + (q.y - B.y) * uy - D - ex) / h, d1 = (q.z - BL_HZ - ez) / h, det = a1 * d1 - b1 * c1;
                if (!(Math.abs(det) > 1e-9)) break;
                s = clamp(s - (d1 * ex - b1 * ez) / det, .5, 60); vz = clamp(vz - (-c1 * ex + a1 * ez) / det, -5, 45);
            }
            B.vx = ux * s; B.vy = uy * s; B.vz = vz;
        }
        // [ball] 3B yörünge tahmini (ballStep3D ile aynı fizik): [x, y, z] her .2 sn
        function buildTraj3D() {
            var x = B.x, y = B.y, z = B.z || 0, vx = B.vx, vy = B.vy, vz = B.vz || 0, hi = B.high, sf = B.shotFlag, sl = B.slv || 0, tt = S.t, i, s, hn = hi && BL_HFIX && hi.n != null ? hi.n : -1;      // [ball] BL_HFIX: kalan uçuş adımı
            traj.length = 0; trajEnd = 24;
            for (i = 0; i <= 24; i++) {
                traj.push([x, y, z]);
                for (s = 0; s < 5; s++) {
                    tt += .04;
                    var v = hyp(vx, vy);
                    if (hi && (hn >= 0 ? hn-- > 0 : tt < hi.tLand)) { if (BL_AERO) { var aq = AE_Q; aq.x = x; aq.y = y; aq.z = z; aq.vx = vx; aq.vy = vy; aq.vz = vz; aq.sps = CURL ? B.sps || 0 : 0; hiStep(aq); x = aq.x; y = aq.y; z = aq.z; vx = aq.vx; vy = aq.vy; vz = aq.vz; } else { x += vx * .04; y += vy * .04; vz -= BL_G * .04; z += vz * .04; } continue; }
                    hi = null;
                    if (z > 0 || vz > 0) { vz -= BL_G * .04; z += vz * .04; if (sf && v > .02) { var n0 = Math.max(0, v - (AV_DRAG ? shDecA(v, true) * .04 : .1 * v * .04)); vx *= n0 / v; vy *= n0 / v; } if (z <= 0) { z = 0; if (-vz > BL_BMIN) { vz = -vz * BL_E; vx *= BL_HRET; vy *= BL_HRET; } else { vz = 0; sl = BL_SLIDE ? hyp(vx, vy) * BL_R57 : 0; } } }
                    else if (v > .05) { var dv = (sf ? (AV_DRAG ? shDecA(v, false) : .1 * v) : gdec(v, sl)) * .04, nv = Math.max(0, v - dv); vx *= nv / v; vy *= nv / v; }
                    else if (BL_EDGE) { vx = 0; vy = 0; }      // [ball] çok yavaş top durur
                    if (sf && CURL && B.sps) { var cq = CU_Q; cq.vx = vx; cq.vy = vy; cq.sps = B.sps; cuRot(cq, z > 0 ? 1 : CU_GND); vx = cq.vx; vy = cq.vy; }      // [v137] kıvrılan şut
                    x += vx * .04; y += vy * .04;
                }
            }
            for (var k = 1; k <= 24; k++) if (BL_EDGE ? edgeGone(traj[k], traj[k - 1]) : (traj[k][0] < .3 || traj[k][0] > PW - .3 || traj[k][1] < .3 || traj[k][1] > PH - .3)) { trajEnd = k - 1; break; }
        }
        // [ball] BL_EDGE: yörünge noktası çizgiyi geçti ya da çizgi bandında (.3 m) çizgiye doğru gidiyor (.2 sn'de 6 cm'den çok) → top bu noktadan sonra kovalanmaz; bantta duran top kovalanır
        function edgeGone(a, b) {
            if (a[0] < 0 || a[0] > PW || a[1] < 0 || a[1] > PH) return true;
            var dx = a[0] - b[0], dy = a[1] - b[1];
            return (a[0] < .3 && dx < -.06) || (a[0] > PW - .3 && dx > .06) || (a[1] < .3 && dy < -.06) || (a[1] > PH - .3 && dy > .06);
        }
        function interceptFor(p) {
            p.tInt = 99;
            // rakip takım pas atıldıktan sonra kısa bir tepki süresi kadar geç başlar; hedefi de tam bilmez
            var react = 0, i, opp = !!(S.pass && S.pass.active && S.pass.team !== p.team);
            if (opp) react = Math.max(0, (AICAL && p.role === 'GK' && B.high && gkZone(p, B.high.x, B.high.y) ? gkReact(p) : INT_REACT + p.rx + (FATIGUE ? FT_RX * (1 - p.stam) : 0) - (AV_ATTR && p.a.ant != null ? clamp(.004 * (p.a.ant - 70), -.1, .1) : 0)) - (S.t - S.pass.t0));      // [av] AV_ATTR: Önsezi      // [aical] kaleci yüksek topu kaleci tepkisiyle okur      // [fatigue] yorgun oyuncu geç tepki verir
            // havadaki top yere inmeden alınamaz: yalnızca iniş anından sonraki noktalar hedef olabilir
            var i0 = B.high ? Math.min(trajEnd, Math.ceil(Math.max(0, B.high.tLand - S.t) / .2)) : 0;
            var spd = opp ? INT_SPEED : .82, slack = opp ? INT_SLACK : .9, vI = FATIGUE ? p.maxV * (.74 + .26 * p.stam) * (1 - FT_AV * p.anaD) : p.maxV;      // [fatigue] varış tahmini oyuncunun o anki azami hızıyla
            if (AIR_TGT && B.high) {      // [air] yüksek top: inişe yetişebilen tam iniş noktasına, iniş anına koşar (yetişemeyen inişten sonraki yörüngeye bakar)
                var tL = Math.max(0, B.high.tLand - S.t), dxh = B.high.x - p.x, dyh = B.high.y - p.y, dh = hyp(dxh, dyh) || .001, awh = Math.max(0, -(p.vx * dxh + p.vy * dyh) / dh);
                if (dh + awh * awh / p.acc <= vI * spd * Math.max(0, tL - react) + slack) { p.tInt = tL; p.ix = B.high.x; p.iy = B.high.y; return; }
            }
            for (i = i0; i <= trajEnd; i++) {
                if (BALL3D && traj[i][2] > BL_CTRLZ && !(B.high && i === i0)) continue;      // [ball] bu noktada top alınamayacak yükseklikte
                var t = i * .2, dx = traj[i][0] - p.x, dy = traj[i][1] - p.y, d = hyp(dx, dy) || .001;
                var away = Math.max(0, -(p.vx * dx + p.vy * dy) / d);          // hedefe ters yöndeki hız: önce durup dönmesi gerekir (momentum)
                var need = d + away * away / p.acc;
                if (need <= vI * spd * Math.max(0, t - react) + slack) { p.tInt = t; p.ix = traj[i][0]; p.iy = traj[i][1]; return; }
            }
            p.ix = traj[trajEnd][0]; p.iy = traj[trajEnd][1]; p.tInt = 40 + hyp(p.x - p.ix, p.y - p.iy) / p.maxV;
        }
        function shapeTarget(p, has) {
            var T = S.teams[p.team], d = T.dir, f = (p.home || FORM.filter(function (r) { return r[0] === p.role; })[0]);
            var BX = AIS ? BS.x : B.x, BY = AIS ? BS.y : B.y;      // [ais] blok topu gecikmeyle izler
            var hx = d === 1 ? f[1] * PW : (1 - f[1]) * PW, hy = d === 1 ? f[2] * PH : (1 - f[2]) * PH;
            var adv = (BX - CX) * d, push = adv * .44 * PUSH[p.role];
            if (has === p.team && p.role !== 'GK') push += 6.5 * PUSH[p.role]; else if (has !== p.team && has !== -1) push -= 3 * PUSH[p.role];
            var tc = tacOf(p.team), lsh = 0;
            if (p.role !== 'GK') {      // takım talimatları: mentalite bloğu kaydırır · baskı (rakipteyken) geri çekilmeyi azaltır · savunma çizgisi hattı/ön liberoyu kaydırır · genişlik kanat-bek dizilişini açar/daraltır
                push += MT_PUSH * tc.ment * PUSH[p.role];
                if (has !== p.team && has !== -1) push += PR_PUSH * tc.press * PUSH[p.role];
                if (OB_ON && S.trigT && has !== p.team && has !== -1 && S.t - S.trigT[p.team] < 1.6) push += OB_TRP * (1 + .5 * tc.press) * PUSH[p.role];
                if (AV_LATE && has !== p.team && has !== -1 && S.t > FULL_S * .78 && T.score > opp(p.team).score) push -= 4 * PUSH[p.role];      // [av] AV_LATE: son 20 dk önde olan takım bloğu geri çeker      // [ob] pres tetiklendi: blok ileri kayar
                if (tc.line) lsh = tc.line * (/B$|CB/.test(p.role) ? LN_X : /DM/.test(p.role) ? LN_DM : 0);
                if (tc.width && has === p.team && /^(LW|RW|LB|RB)$/.test(p.role)) hy = CY + (hy - CY) * (1 + WD_Y * tc.width);
            }
            var tx = hx + d * push + d * lsh;
            if (has === p.team && (p.role === 'ST' || p.role === 'LW' || p.role === 'RW' || p.role === 'AM')) { var gxo = atkGoalX(p.team), lineD = offDist(p.team) - (CURVE ? clamp(1.4 - (p.a.posi - 60) * .03, .15, 2.2) : .6); if (Math.abs(gxo - tx) < lineD && p.role !== 'AM') tx = gxo - d * lineD; }
            var ty = hy + (BY - hy) * (p.role === 'LW' || p.role === 'RW' || p.role === 'LB' || p.role === 'RB' ? .12 : .24);
            // rakip topla tehlikeli bölgedeyse: kale önünde kompakt blok
            if (has !== p.team && has !== -1 && p.role !== 'GK') {
                var ownG2 = ownGoalX(p.team), bd = Math.abs(BX - ownG2);
                if (bd < 46) {
                    var depth = null, comp = 0;
                    if (/B$|CB/.test(p.role)) { depth = clamp(bd * .5 + 1, 6, 24); comp = .5; }
                    else if (/DM/.test(p.role)) { depth = clamp(bd * .62 + 6, 12, 34); comp = .35; }
                    else if (p.role === 'AM') { depth = clamp(bd * .8 + 6, 18, 42); comp = .2; }
                    if (depth != null) {
                        if (tc.line || tc.ment) depth = clamp(depth + (LN_D * tc.line + MT_D * tc.ment) * (/B$|CB/.test(p.role) ? 1 : /DM/.test(p.role) ? .6 : 0), 3, 46);
                        var lim = ownG2 + d * depth; if ((tx - lim) * d > 0) tx = lim;
                        ty = CY + (ty - CY) * (1 - comp * clamp((46 - bd) / 30, 0, 1)) + (BY - CY) * .18 * clamp((46 - bd) / 30, 0, 1);
                    }
                }
            }
            return [clamp(tx, 2, PW - 2), clamp(ty, 2, PH - 2)];
        }
        // ---------- savunma organizasyonu ----------
        // has: topa sahip takım (yoksa -1). Yalnızca savunan takımın oyuncuları için {kind, tx, ty, sf, w} döndürür.
        function defenseOrg(has) {
            if (has < 0) return null;
            var dTm = 1 - has, out = {}, gxc = ownGoalX(dTm), dDir = S.teams[dTm].dir, ow = B.owner, pj = tacOf(dTm).press;
            var defs = S.players.filter(function (q) { return q.team === dTm && q.role !== 'GK' && !q.off; }), used = {};
            var bx = ow ? ow.x : B.x, by = ow ? ow.y : B.y;
            var ux = gxc - bx, uy = CY - by, ul = hyp(ux, uy) || 1; ux /= ul; uy /= ul;
            var bd = Math.abs(bx - gxc), trg = ow ? pressTrig(dTm, ow) : 0;
            if (ow) {
                defs.sort(function (a, b) { return hyp(a.x - bx, a.y - by) - hyp(b.x - bx, b.y - by); });
                var p1 = defs[0], d1 = hyp(p1.x - bx, p1.y - by);
                if (AIS && prevPr[dTm] && prevPr[dTm] !== p1 && defs.indexOf(prevPr[dTm]) >= 0) { var dp0 = hyp(prevPr[dTm].x - bx, prevPr[dTm].y - by); if (dp0 < d1 + AIS_PR) { defs.splice(defs.indexOf(prevPr[dTm]), 1); defs.unshift(prevPr[dTm]); p1 = defs[0]; d1 = dp0; } }
                if (AIS) prevPr[dTm] = null;
                if (d1 < (bd > 72 ? PRESS_HI_D : bd > 50 ? PRESS_MID_D : 32) * (1 + PR_D * pj) * (trg ? 1.25 : 1)) {
                    var jd = ow.dribble ? JD_MOVE : JD_HOLD, behind = hyp(p1.x - gxc, p1.y - CY) > hyp(bx - gxc, by - CY) + 1.5;
                    var tx1 = behind ? bx + ow.vx * .3 : bx + ow.vx * .2 + ux * jd, ty1 = behind ? by + ow.vy * .3 : by + ow.vy * .2 + uy * jd;
                    out[p1.id] = { kind: 'press', tx: tx1, ty: ty1, sf: d1 > 9 ? 1 : .92 }; used[p1.id] = 1; p1.pressT = S.t; if (AIS) prevPr[dTm] = p1;
                    // presin kalitesi: baskı yapan oyuncunun müdahale/okuma özelliği tackle dışında hız ve durma mesafesini de belirler (duels'te kullanılır)
                }
                var p2 = defs[1], d2 = p2 ? hyp(p2.x - bx, p2.y - by) : 99;
                if (trg && out[p1.id] && out[p1.id].kind === 'press') {      // [ob] tetikleyici: 1. presçi depar atar ve yakın durur, 2. adam en kolay pas yolunu (çizgide: içeriyi) kapatır
                    var o1 = out[p1.id]; o1.sf = 1; if (trg !== 3) { o1.tx = bx + ow.vx * .25 + ux * JD_HOLD * .5; o1.ty = by + ow.vy * .25 + uy * JD_HOLD * .5; } else { var inw0 = ow.y < CY ? 1 : -1; o1.tx = bx + ux * 1.2; o1.ty = by + inw0 * 1.3; }
                    (S.trigT || (S.trigT = [-9, -9]))[dTm] = S.t; S.dbg['trig' + trg] = (S.dbg['trig' + trg] || 0) + (S.t - (p1.trgT || -9) > 2 ? 1 : 0); p1.trgT = S.t;
                    if (p2 && d2 < 20 && bd < 80) {
                        var lx2, ly2;
                        if (trg === 3) { var inw = ow.y < CY ? 1 : -1; lx2 = bx + ux * 3; ly2 = by + inw * 5; }
                        else { var mt = null, md = 25; for (var mi = 0; mi < 22; mi++) { var mq = S.players[mi]; if (mq.team !== ow.team || mq === ow || mq.off || mq.role === 'GK') continue; var mdd = hyp(mq.x - bx, mq.y - by); if (mdd < md) { md = mdd; mt = mq; } } if (mt) { lx2 = bx + (mt.x - bx) * .45; ly2 = by + (mt.y - by) * .45; } else { lx2 = bx + ux * COVER_D; ly2 = by + uy * COVER_D; } }
                        out[p2.id] = { kind: 'press', tx: lx2, ty: ly2, sf: .97 }; used[p2.id] = 1;
                    }
                }
                if (!used[p2 ? p2.id : -1] && p2 && d2 < 24 + PR_COVER * pj && bd < 60) {
                    var side = ((p2.x - bx) * -uy + (p2.y - by) * ux) >= 0 ? 1 : -1;   // topun hangi yanındaysa orada kalsın
                    out[p2.id] = { kind: 'cover', tx: bx + ux * COVER_D + (-uy) * side * 2.4, ty: by + uy * COVER_D + ux * side * 2.4, sf: .9 }; used[p2.id] = 1;
                }
            }
            // adam adam markaj: kaleye yakın rakip hücumcular (top sahibi hariç); kalıcı eşleşme (titremeyi önler)
            if (true) {
                var gxa = gxc, mwf = clamp((MARK_FAR - bd) / 30, .5, 1), thr = S.players.filter(function (q) { return q.team === has && q.role !== 'GK' && !q.off && q !== ow && Math.abs(q.x - gxa) < (bd < 48 ? 40 : MARK_ZONE); });
                thr.sort(function (a, b) { return Math.abs(a.x - gxa) - Math.abs(b.x - gxa); });
                var free = defs.filter(function (q) { return !used[q.id]; });
                thr.forEach(function (t) {
                    var best = null, bdst = 1e9;
                    free.forEach(function (q) { if (used[q.id]) return; var d = hyp(q.x - t.x, q.y - t.y) - (q.markId === t.id ? 5 : 0); if (d < bdst && d < MARK_R) { bdst = d; best = q; } });
                    if (best) {
                        used[best.id] = 1; best.markId = t.id;
                        var vx = gxc - t.x, vy = CY - t.y, vl = hyp(vx, vy) || 1, gs = MARK_GS * (BR_ON ? clamp(1 - BR_GS * best.br.df, .8, 1.2) : 1);
                        out[best.id] = { kind: 'mark', tx: t.x + vx / vl * gs + (bx - t.x) * .06, ty: t.y + vy / vl * gs + (by - t.y) * .06, sf: AIS ? (hyp(t.vx, t.vy) > 4.5 && !(FATIGUE && best.ana < FT_EA) ? .95 : .86) : .9, w: MARK_W * mwf * (BR_ON ? clamp(1 + BR_MARKQ * best.br.df, .75, 1.15) : 1) * (FATIGUE ? clamp(1 - FT_MK * (1 - best.stam), .4, 1) : 1) };      // [fatigue] yorgun markajcı gevşer, soluklanan koşucuyu deparla izlemez
                    }
                });
            }
            defs.forEach(function (q) { if (!used[q.id]) q.markId = null; });
            return out;
        }
        // ---------- topsuz hareket: destek pozisyonları ----------
        // Topu tutan takımın topa en yakın SUP_N oyuncusu, taşıyıcının 8–17 m çevresinde serbest, pas koridoru açık, hücuma değerli ve kendi diziliminden fazla kopmayan bir hücre seçer.
        // [ob] pres tetikleyicileri: 1 geri pas · 2 sırtı dönük / baskı altında alış · 3 çizgide sıkışma · 4 top kaybı sonrası karşı baskı (2,2 sn)
        function pressTrig(dTm, ow) {
            if (!OB_ON || !OB_TRIG || !ow || ow.role === 'GK' || S.mode === 'dead') return 0;
            var aDir = S.teams[ow.team].dir, gt = ow.gainT != null ? S.t - ow.gainT : 9;
            if (ow.gainBack && gt < 1.6 && Math.abs(ow.x - ownGoalX(ow.team)) > 12) return 1;
            if (gt < .9 && ow.fx * aDir < -.25 && nearestOpp(ow).d < 5) return 2;
            if ((ow.y < 6.5 || ow.y > PH - 6.5) && nearestOpp(ow).d < 9) return 3;
            if (AV_TRIG5 && ow.badT != null && S.t - ow.badT < 1.6 && nearestOpp(ow).d < 7) return 5;      // [av] AV_TRIG5: kötü ilk dokunuştan sonra topu yeniden alan oyuncu
            if (S.lostT && S.t - S.lostT[dTm] < 2.2 && tacOf(dTm).press > -1) return 4;
            return 0;
        }
        // [ob] çapraz koşu: önce ofsayt çizgisinde kavis (çizgide bekleyip açıyı alır), sonra savunmacıların arasından çapraz depar
        function obRun(q, gx, dir, lastLine, gy) {
            if (!OB_ON || !OB_DIAG) return null;
            var ty = gy, wide = Math.abs(q.y - CY) > 13;
            if (wide) ty = gy * .6 + (CY + (q.y > CY ? 1 : -1) * 5) * .4;                       // kanattan içeri (bek-stoper arası)
            else if (Math.abs(gy - q.y) < 6) ty = q.y + (gy >= q.y ? 1 : -1) * 6;                 // ortadan kanal tarafına
            ty = clamp(ty, 6, PH - 6);
            var dq = Math.abs(gx - q.x), lineX = gx - dir * (lastLine + .9), wx = (dq > lastLine + 4) ? q.x + dir * Math.min(3, dq - lastLine - 1) : lineX;
            S.dbg.ob_diag = (S.dbg.ob_diag || 0) + 1;
            return { until: S.t + RUN_T + .45, x: clamp(gx - dir * Math.max(7, lastLine - 8), 6, PW - 6), y: ty, wx: clamp(wx, 4, PW - 4), wy: clamp(q.y + (ty - q.y) * .35, 4, PH - 4), wt: S.t + .5, diag: true };
        }
        // [ob] üçüncü adam: pas yoldayken, pası atanın yakınındaki bir oyuncu alıcının ilerisindeki boşluğa koşar (tek dokunuşla verilecek topu bekler)
        function thirdMan(ps) {
            ps.tm3 = true;
            var to = ps.to, fr = ps.from; if (!to || !fr || to.off || ps.high || ps.team == null) return;
            var tm = ps.team, dir = S.teams[tm].dir, gx = atkGoalX(tm), dg = Math.abs(gx - to.x), offL = offDist(tm);
            if (dg < 20 || dg > 75 || hyp(to.x - fr.x, to.y - fr.y) > 30) return;
            var best = null, bs = -1e9;
            for (var i = 0; i < 22; i++) {
                var q = S.players[i]; if (q.team !== tm || q === to || q.off || q.role === 'GK' || /CB/.test(q.role)) continue;
                if ((q.run && q.run.until > S.t) || q.runCd > S.t) continue;
                var dt = hyp(q.x - to.x, q.y - to.y); if (dt < 6 || dt > 24 || (q.x - to.x) * dir > 3) continue;
                var sc = q.a.posi * .6 + q.a.vis * .2 + q.a.pac * .2 - dt * .8 + (q === fr ? 6 : 0) + (/LB|RB/.test(q.role) ? -8 : 0);
                if (sc > bs) { bs = sc; best = q; }
            }
            if (!best) return;
            if (R() > OB_3M * clamp(.6 + .012 * (best.a.posi - 60), .3, 1.5) * (FATIGUE ? .5 + .5 * best.stam : 1) * (1 + .3 * tacOf(tm).tempo)) return;
            var ax = to.x + dir * clamp(dg * .35, 9, 16), ay = clamp(to.y + (best.y - to.y) * .5 + (to.y < CY ? 4 : -4) * (Math.abs(best.y - to.y) < 4 ? 1 : 0), 5, PH - 5);
            if (Math.abs(gx - ax) < offL - .6) ax = gx - dir * (offL - .6);
            best.run = { until: S.t + 2.6, x: clamp(ax, 5, PW - 5), y: ay, tm3: true }; best.runCd = S.t + RUN_CD; best.n.run++; S.dbg.ob_3m = (S.dbg.ob_3m || 0) + 1;
        }
        var supLast = [-9, -9], supOwner = [null, null];
        function computeSupport(tm) {
            var ow = B.owner; if (!ow || ow.team !== tm) return;
            if (supOwner[tm] === ow && S.t - supLast[tm] < SUP_EVERY) return;
            supOwner[tm] = ow; supLast[tm] = S.t;
            var dir = S.teams[tm].dir, gx = atkGoalX(tm), offL = offDist(tm), i, m;
            var mates = S.players.filter(function (q) { return q.team === tm && q !== ow && q.role !== 'GK' && !q.off; });
            mates.sort(function (a, b) { return hyp(a.x - ow.x, a.y - ow.y) - hyp(b.x - ow.x, b.y - ow.y); });
            // arkaya koşular: hücum oyuncuları savunma hattının arkasındaki boşluğa (savunmacılar arası en geniş aralık) koşar
            var advO = (ow.x - CX) * dir;
            if (advO > -14 && Math.abs(gx - ow.x) > 20 && nearestOpp(ow).d > 2.2) {
                var lastLine = offL, defsY = [];
                for (i = 0; i < 22; i++) { var od0 = S.players[i]; if (od0.team !== tm && od0.role !== 'GK' && !od0.off) defsY.push(od0.y); }
                defsY.sort(function (u, v) { return u - v; });
                var gaps = [], prevY = 4; defsY.forEach(function (yy) { gaps.push([prevY, yy]); prevY = yy; }); gaps.push([prevY, PH - 4]);
                mates.forEach(function (q) {
                    if (!(q.role === 'ST' || q.role === 'LW' || q.role === 'RW' || q.role === 'AM')) return;
                    if ((q.run && q.run.until > S.t) || q.runCd > S.t) return;
                    var dq = Math.abs(gx - q.x); if (dq < lastLine - 3.5 || dq < 14) return;      // hâlâ hat gerisinde (ofsayta yakın) ve kaleye çok yakın değil
                    var pr0 = (q.trRun || 1) * RUN_RATE * (q.role === 'ST' ? 1.25 : q.role === 'AM' ? .5 : .8) * clamp(.55 + .012 * (q.a.posi - 60), .3, 1.5) * clamp(1 + .01 * (q.a.pac - 70), .75, 1.3) * (BR_ON ? clamp(1 + BR_RUNP * q.br.pc + .5 * BR_RUNP * q.br.po, .5, 1.7) : 1) * (1 + TP_RUN * tacOf(q.team).tempo + MT_RUN * tacOf(q.team).ment + LN_RUN * tacOf(1 - q.team).line + (S.ctr && S.ctr.team === q.team ? PRM.CT_RUN * S.ctr.k : 0)) * (FATIGUE ? clamp(1 - FT_RUN * (1 - q.stam), .3, 1) * Math.max(.3, 1 - 1.5 * q.anaD) : 1);      // [fatigue] yorgun / soluklanan oyuncu daha az koşu atar
                    if (R() > pr0) return;
                    var bestG = null, bs = -1e9;
                    gaps.forEach(function (g) { var w = g[1] - g[0]; if (w < 5) return; var cy = (g[0] + g[1]) / 2, sc = w - .25 * Math.abs(cy - q.y); if (sc > bs) { bs = sc; bestG = cy; } });
                    if (bestG == null) return;
                    q.run = obRun(q, gx, dir, lastLine, bestG) || { until: S.t + RUN_T, x: clamp(gx - dir * Math.max(7, lastLine - 8), 6, PW - 6), y: clamp(bestG, 5, PH - 5) }; q.runCd = S.t + RUN_CD; q.n.run++; trEv(q, 'arakos', 30);
                    if (ow.think > .35) ow.think = .35;
                });
            }
            // bek bindirmesi: kanat oyuncusu ileride topu taşırken aynı kanattaki bek (özellikle hızlı/koşucu olanlar) onun dışından ileri bindirir
            if (BR_ON && BR_OVL > 0 && (ow.role === 'LW' || ow.role === 'RW') && Math.abs(gx - ow.x) < 46 && Math.abs(gx - ow.x) > 16) {
                var sgn = ow.y < CY ? -1 : 1, fbs = null;
                mates.forEach(function (q) { if ((q.role === 'LB' || q.role === 'RB') && (q.y - CY) * sgn > 0 && !(q.run && q.run.until > S.t) && q.runCd <= S.t && Math.abs(gx - q.x) > Math.abs(gx - ow.x) - 2) fbs = q; });
                if (fbs) {
                    var pO = (fbs.trOvl || 1) * BR_OVL * clamp(1 + .5 * fbs.br.wz + .4 * fbs.br.pc + .3 * fbs.br.dz, .3, 2.2) * (.5 + .5 * fbs.stam) * (ow.dribble ? 1.3 : 1) * (nearestOpp(ow).d > 2.5 ? 1 : .5);
                    if (R() < pO) { var dtg = Math.max(offL - .5, Math.abs(gx - ow.x) - 10, 6); trEv(fbs, 'bindir', 45); fbs.run = { until: S.t + 3.4, x: clamp(gx - dir * dtg, 6, PW - 6), y: CY + sgn * 27.5, ovl: true }; fbs.runCd = S.t + 9; fbs.n.ovl++; }
                }
            }
            if (OB_ON && OB_UND > 0 && (ow.role === 'LW' || ow.role === 'RW') && Math.abs(ow.y - CY) > 15 && Math.abs(gx - ow.x) < 40 && Math.abs(gx - ow.x) > 12) {      // [ob] içeriden bindirme: aynı kanattaki orta saha kanatçının içinden yarı alana koşar
                var sgU = ow.y < CY ? -1 : 1, und = null;
                mates.forEach(function (q) { if (!(q.role === 'LDM' || q.role === 'RDM' || q.role === 'AM') || (q.y - CY) * sgU < -6 || (q.run && q.run.until > S.t) || q.runCd > S.t) return; if (Math.abs(gx - q.x) < Math.abs(gx - ow.x) - 2 || hyp(q.x - ow.x, q.y - ow.y) > 26) return; if (!und || q.role === 'AM') und = q; });
                if (und && !(mates.some(function (q) { return q.run && q.run.ovl && q.run.until > S.t; }))) {
                    var pU = OB_UND * clamp(.6 + .012 * (und.a.posi - 60) + .006 * (und.a.sta - 60), .3, 1.6) * (.5 + .5 * und.stam) * (1 + .4 * tacOf(tm).ment);
                    if (R() < pU) { var dU = Math.max(offL - .6, 11); und.run = { until: S.t + 2.8, x: clamp(gx - dir * dU, 6, PW - 6), y: CY + sgU * 9.5, und: true }; und.runCd = S.t + 8; S.dbg.ob_und = (S.dbg.ob_und || 0) + 1; }
                }
            }
            // ortaya hazırlık: top kanattaki oyuncudayken forvet, oyun kurucu ve uzak kanat ceza sahasına girer (penaltı noktası, uzak direk, ön direk)
            var boxOn = crossZone(ow) || (AICAL && Math.abs(ow.y - CY) >= 13 && Math.abs(gx - ow.x) <= 38 && Math.abs(gx - ow.x) >= 4), boxTaken = {};      // [aical] top kanattan yaklaşırken de
            if (boxOn) {
                var sideY = ow.y < CY ? -1 : 1, cells = { ST: [gx - dir * 10.5, CY], AM: [gx - dir * 15.5, CY - sideY * 3], far: [gx - dir * 7.5, CY - sideY * 7], near: [gx - dir * 6, CY + sideY * 4] };
                var farW = null; mates.forEach(function (q) { if ((q.role === 'LW' || q.role === 'RW') && Math.abs(q.y - ow.y) > 25) farW = q; });
                mates.forEach(function (q) {
                    var c = q.role === 'ST' ? cells.ST : q.role === 'AM' ? cells.AM : q === farW ? cells.far : null; if (!c) return;
                    var dq = Math.abs(gx - c[0]); if (dq < offL - .6) c = [gx - dir * (offL - .6), c[1]];
                    q.boxT = { x: c[0], y: c[1], t: S.t }; boxTaken[q.id] = 1;
                });
                if (OB_ON) {
                    if (OB_NEAR) mates.forEach(function (q) { if ((q.role === 'LW' || q.role === 'RW') && !boxTaken[q.id] && (q.y - CY) * sideY > 0 && Math.abs(gx - q.x) < 32) { var cn = cells.near; if (Math.abs(gx - cn[0]) < offL - .6) cn = [gx - dir * (offL - .6), cn[1]]; q.boxT = { x: cn[0], y: cn[1], t: S.t }; boxTaken[q.id] = 1; } });      // [ob] ön direğe atak
                    if (S.lateOw !== ow) {      // [ob] geç gelen orta saha: bir an bekler, sonra ceza yayına (geri çevrilen top bölgesi) koşar
                        S.lateOw = ow; var lm = null, ls = -1;
                        mates.forEach(function (q) { if (!(q.role === 'LDM' || q.role === 'RDM') || boxTaken[q.id] || Math.abs(gx - q.x) > 44) return; var sc0 = q.a.posi + .6 * q.a.sta + 30 * q.stam - .5 * Math.abs(gx - q.x); if (sc0 > ls) { ls = sc0; lm = q; } });
                        if (lm && R() < OB_LATE * clamp(.7 + .01 * (lm.a.posi - 60), .4, 1.4) * (1 + .3 * tacOf(tm).ment)) { lm.late = { x: gx - dir * 12.5, y: CY - sideY * 2.5, t0: S.t + .7 + .5 * R(), until: S.t + 4.2, ow: ow }; S.dbg.ob_late = (S.dbg.ob_late || 0) + 1; }
                    }
                }
            }
            var opps = S.players.filter(function (o) { return o.team !== tm && !o.off; }), taken = [], RS = [8, 12, 17];
            for (m = 0; m < Math.min(SUP_N, mates.length); m++) {
                var q = mates[m], sh = shapeTarget(q, tm), bestS = -1e9, bx = q.x, by = q.y;
                if (boxTaken[q.id]) continue;
                for (var ri = 0; ri < 3; ri++) for (var a = -150; a <= 150; a += 30) {
                    var ang = a * .0174533, cx = ow.x + dir * Math.cos(ang) * RS[ri], cy = ow.y + Math.sin(ang) * RS[ri];
                    if (cx < 3 || cx > PW - 3 || cy < 3 || cy > PH - 3) continue;
                    if (Math.abs(gx - cx) < offL - .5 && Math.abs(gx - cx) < Math.abs(gx - ow.x)) continue;     // ofsayt hattının ötesi
                    var dsh = hyp(sh[0] - cx, sh[1] - cy); if (dsh > 24) continue;
                    var open = 6, lane = 4;
                    for (i = 0; i < 22; i++) { var o = opps[i]; if (!o) break; var od = hyp(o.x - cx, o.y - cy); if (od < open) open = od; var sd = segDist(o.x, o.y, ow.x, ow.y, cx, cy); if (sd < lane) lane = sd; }
                    var sc = SUP_OPEN * open + SUP_LANE * lane - SUP_REACH * hyp(q.x - cx, q.y - cy) - SUP_SHAPE * dsh + SUP_PROG * posValue(cx, cy, tm);
                    for (i = 0; i < taken.length; i++) if (hyp(taken[i][0] - cx, taken[i][1] - cy) < 7) sc -= 3;
                    if (AIS && q.supT && hyp(q.supT.x - cx, q.supT.y - cy) < 3) sc += AIS_SUP;
                    if (sc > bestS) { bestS = sc; bx = cx; by = cy; }
                }
                q.supT = { x: bx, y: by, t: S.t }; taken.push([bx, by]);
                if (OB_ON && OB_CHK > 0 && !(q.chk && q.chk.until > S.t) && !(q.run && q.run.until > S.t) && (q.chkCd || 0) < S.t) {      // [ob] gelip gösterme: sıkı markajlı (rakip arkasında) oyuncu önce kısa bir hamle yapar, sonra topa doğru gelir
                    var dO = hyp(q.x - ow.x, q.y - ow.y), mk = nearestOpp(q);
                    if (dO > 11 && dO < 34 && mk.d < 3 && (mk.p.x - q.x) * dir > -.5 && nearestOpp(ow).d > 2.5) {
                        var pC = OB_CHK * clamp(.6 + .012 * (q.a.posi - 60) + .006 * (q.a.pac - 60), .3, 1.6) * (FATIGUE ? .5 + .5 * q.stam : 1);
                        if (R() < pC) {
                            var cx0 = (ow.x - q.x) / dO, cy0 = (ow.y - q.y) / dO, sdC = (q.y - mk.p.y) >= 0 ? 1 : -1, cl = Math.min(6.5, dO - 6);
                            q.chk = { until: S.t + 1.35, ft: S.t + .3, fx: clamp(q.x - cx0 * 1.6 + 1.2 * sdC * cy0, 2, PW - 2), fy: clamp(q.y - cy0 * 1.6 + 1.2 * sdC * Math.abs(cx0), 2, PH - 2), x: clamp(q.x + cx0 * cl, 2, PW - 2), y: clamp(q.y + cy0 * cl + sdC * 1.5, 2, PH - 2) };
                            q.chkCd = S.t + 4; S.dbg.ob_chk = (S.dbg.ob_chk || 0) + 1; if (ow.think > .6) ow.think = .6;
                        }
                    }
                }
            }
        }
        // [ais] isabetli bir pasın peşine düşmenin anlamı var mı: pas atan takımda alıcıdan başkası koşmaz; rakip yalnızca alıcıdan önce (ya da onunla aynı anda) yetişebilecekse depara kalkar
        function hopeless(p) {
            var ps = S.pass; if (!ps || !ps.active || !ps.to || ps.to.off) return false;
            var rt = ps.to.tInt;
            if (ps.team === p.team) return rt < p.tInt + .8;
            return p.tInt > rt + .5 && p.tInt > 1;
        }
        // [ais] topa varış zamanlaması: rakibin en iyi kovalayanı en az 1 sn geride ve top henüz uzaktaysa oyuncu azami ivmeyle değil, topun varış anına göre koşar (0 = depar)
        // [aical] markajcı p, kendi ceza sahasına inen rakip yüksek topunda (tepki süresinden sonra) adamı iniş noktasına yakınsa topa çıkar
        function aerialGo(p) {
            var hl = B.high, ps = S.pass; if (!hl || B.owner || !ps || !ps.active || ps.team === p.team || S.t - ps.t0 < AC_XRX || p.markId == null) return false;
            if (!inBox(hl.x, hl.y, ps.team)) return false;
            var mk = S.players[p.markId]; return !!mk && !mk.off && hyp(mk.x - hl.x, mk.y - hl.y) < AC_AGD;
        }
        // [av] AV_GK: kalecinin kale çizgisine uzaklığı, topun kendi kale çizgisine x uzaklığından (GK_DX/GK_DY tablosu, doğrusal ara değer); top rakip ayağında ve kaleye 32 m'den yakınken şut duruşu (StatsBomb donmuş kare: 11–30 m şutta 1,9–2,1 m)
        function gkDepthAV(bdx, sd) {
            var i = 1; while (i < GK_DX.length - 1 && bdx > GK_DX[i]) i++;
            var v = GK_DY[i - 1] + (GK_DY[i] - GK_DY[i - 1]) * clamp((bdx - GK_DX[i - 1]) / (GK_DX[i] - GK_DX[i - 1]), 0, 1);
            v *= avp('AV_GKK', .85);      // kaleci yer değişiminde topun gerisinde kalır: hedef ölçülen ortalamaya göre
            return sd != null && sd < 32 ? Math.min(v, 1.35 + .028 * sd) : v;
        }
        // [av] AV_OUT: çizgiye yakın çekişmeden seken top çoğu kez oyun dışına (taçların ve kornerlerin çoğu çizgi kenarındaki ikili mücadeleden; StatsBomb taç 22, korner 4,9 / takım)
        //   x, y: çekişme yeri · atk: topu kaybeden (hücum eden) takım · k: olasılık çarpanı. Top hızını korur, yönü en yakın çizgiye (yan çizgi → taç, kale çizgisi → korner) döner
        function avOut(x, y, atk, k) {
            if (!AV_OUT) return false;
            var dy = Math.min(y, PH - y), gx = atkGoalX(atk), dxg = Math.abs(gx - x), wl = avp('AV_OW', 8);
            var pT = dy < wl ? avp('AV_TKO', .5) * (1 - dy / wl) : 0, pC = dxg < 9 && Math.abs(y - CY) > GW / 2 + 1 ? avp('AV_TKC', .45) * (1 - dxg / 9) : 0, u = RA();
            if (u >= (pT + pC) * k) return false;
            var v = Math.max(avp('AV_OV', 6.5), hyp(B.vx, B.vy)), a; B.avo = S.t;      // çekişmedeki iki oyuncu topa hemen yeniden dokunamaz (top gövdeden seker)
            if (u < pT * k) a = Math.atan2(y < CY ? -1 : 1, (RA() - .5) * 1.2);
            else a = Math.atan2((y < CY ? -1 : 1) * (.2 + .6 * RA()), gx - x);
            B.vx = Math.cos(a) * v; B.vy = Math.sin(a) * v; return true;
        }
        function gkReact(g) { return clamp(GK_REACT - .003 * ((g.a.gk_ref != null ? g.a.gk_ref : g.a.gk) - 75), .15, .4); }
        function relaxT(p, ch) {
            var o = ch[1 - p.team], m = o ? o.tInt - p.tInt : 9;
            return m > 1 && p.tInt > .4 && p.tInt < 6 ? p.tInt : 0;
        }
        function assignTargets() {
            for (var ri = 0; ri < 22; ri++) S.players[ri].relax = 0;
            var has = B.owner ? B.owner.team : (S.pass && S.pass.active ? S.pass.team : -1);
            var chaser = [null, null], i, p;
            if (!B.owner) { buildTraj(); for (i = 0; i < 22; i++) { p = S.players[i]; if (p.off) { p.tInt = 99; continue; } p.gkCome = false; if (p.role === 'GK' && !(hyp(p.x - B.x, p.y - B.y) < 14) && !(AICAL && B.high && gkZone(p, B.high.x, B.high.y))) { p.tInt = 99; continue; } interceptFor(p); if (AICAL && p.role === 'GK' && B.high && gkZone(p, B.high.x, B.high.y) && p.tInt <= B.high.tLand - S.t + .05) p.gkCome = true; var ef = p.tInt - (AIS && prevCh[p.team] === p ? AIS_CH : 0); if (!chaser[p.team] || ef < chaser[p.team].ef) { chaser[p.team] = p; p.ef = ef; } } }
            if (AIS) { prevCh[0] = B.owner ? null : chaser[0]; prevCh[1] = B.owner ? null : chaser[1]; }
            // savunma organizasyonu: 1. savunmacı topa baskı (kale tarafından durur, geciktirir), 2. savunmacı kapatma, kalanlar adam adam markaj
            var D = defenseOrg(has);
            if (S.mode !== 'dead' && has >= 0 && B.owner) computeSupport(has);
            if (OB_ON && OB_3M > 0 && S.mode !== 'dead' && !B.owner && S.pass && S.pass.active && !S.pass.tm3) thirdMan(S.pass);
            for (i = 0; i < 22; i++) {
                p = S.players[i];
                if (p.off) continue;
                if (S.mode === 'dead') { deadTarget(p); continue; }
                var T = S.teams[p.team], d = T.dir, ownG = ownGoalX(p.team);
                if (p.role === 'GK') {
                    var bdx = Math.abs(B.x - ownG), gxb = AV_GK ? gkDepthAV(bdx, B.owner && B.owner.team !== p.team ? hyp(B.owner.x - ownG, B.owner.y - CY) : null) : clamp(1.6 + bdx * .045, 1.6, 6.5), lnT = tacOf(p.team).line; if (lnT) gxb = clamp(gxb + LN_GK * lnT, 1.2, AV_GK ? 21 : 9); var gxo = gxb * d + ownG;      // [av] AV_GK
                    var gty = CY + clamp((B.y - CY) * (bdx < 30 ? .3 : .18), -3.3, 3.3);
                    if (GKP && B.owner && B.owner.team !== p.team) { var sr = gxb / Math.max(gxb, bdx); gty = clamp(CY + (B.y - CY) * sr, GY0 - .4, GY1 + .4); }      // [gk] açı ortası: top ile kale ortasını birleştiren çizgi
                    p.tx = gxo; p.ty = gty; p.sf = .7;
                    if (FIN_ON && FIN_GK1 && B.owner && B.owner.team !== p.team && S.mode === 'live') {
                        var ow1 = B.owner, gdx = ow1.x - ownG, gdy = ow1.y - CY, gdl = hyp(gdx, gdy);
                        if (gdl < 22 && gdl > 3) {
                            var cov = false; for (var ci1 = 0; ci1 < 22; ci1++) { var cq = S.players[ci1]; if (cq.team !== p.team || cq === p || cq.off) continue; if (hyp(cq.x - ownG, cq.y - CY) < gdl - .5 && segDist(cq.x, cq.y, ow1.x, ow1.y, ownG, CY) < 2.2) { cov = true; break; } }
                            if (!cov) { var outD = clamp(gdl * .34, 1.8, 6.5) * clamp(.8 + .006 * ((p.a.gk_1v1 != null ? p.a.gk_1v1 : p.a.gk) - 70), .6, 1.15); p.tx = ownG + gdx / gdl * outD; p.ty = CY + gdy / gdl * outD; p.sf = .95; p.gk1 = S.t; }
                        }
                    }
                    if (GKP && S.shot && S.shot.team !== p.team && !S.shot.gkTried && p.saveT != null && S.t - p.saveT < 2) {      // [gk] tepki süresi dolana kadar yerinde, sonra topun yoluna kayar (asıl uzanma plonjonla)
                        if (S.t - p.saveT < gkReact(p)) { if (GK_SET && p.stx != null) { p.tx = p.stx; p.ty = p.sty; } else { p.tx = p.x; p.ty = p.y; p.sf = .3; } } else { p.tx = p.x; p.ty = clamp(p.saveY, GY0 - 1, GY1 + 1); p.sf = 1; }      // [gk] GK_SET: tepki süresince önceki yer tutma hareketi sürer
                    }
                    else if (S.shot && S.shot.team !== p.team && S.shot.on && !S.shot.gkTried) { p.tx = p.x; p.ty = p.saveY == null ? gty : clamp(p.saveY, GY0 - 1.5, GY1 + 1.5); p.sf = 1.35; }
                    else if (!B.owner && (chaser[p.team] === p && p.tInt < 3 || p.gkCome)) { p.tx = p.ix; p.ty = p.iy; p.sf = 1; }      // [aical] gkCome: kendi alanına inen yüksek topa çıkar
                    continue;
                }
                if (B.owner === p) {
                    if (p.dribble) { var no = nearestOpp(p), gx = atkGoalX(p.team), vx = gx - p.x, vy = CY - p.y; if (AICAL && p.wideLine && Math.abs(gx - p.x) > 7) { vx = gx - d * 6 - p.x; vy = clamp(p.y, 5, PH - 5) - p.y; } /* [aical] çizgiye inen kanat: kale çizgisine 6 m kalana dek kenardan */ var l = hyp(vx, vy) || 1; vx /= l; vy /= l; var pxv = 0, pyv = 0; if (no.d < 5) { var ox = p.x - no.p.x, oy = p.y - no.p.y, ol = hyp(ox, oy) || 1; pxv = ox / ol * .5; pyv = oy / ol * .5; } var edy = 0, edx = 0; if (p.y < 6) edy += (6 - p.y) / 6; else if (p.y > PH - 6) edy -= (p.y - (PH - 6)) / 6;
                        var dg = Math.abs(gx - p.x); if (dg < 7 && (p.y < GY0 - 2 || p.y > GY1 + 2)) edx -= d * (7 - dg) / 7;   // hücum yönünün tersi: kale çizgisi boyunca taşımaz, içeri keser
                        if (p.knC && KN_STR) { pxv = 0; pyv = 0; }      // [knock] itilen topa koşar: rakipten kaçma sapması yok
                        p.tx = clamp(p.x + (vx + pxv + edx * 1.5) * 8, 2.5, PW - 2.5); p.ty = clamp(p.y + (vy * .5 + pyv + edy * 1.5) * 8, 2.5, PH - 2.5);
                        p.sf = clamp(DRIB_SF + .003 * (p.a.dri - 60), .58, .86) * (no.d < 2.6 ? JOCKEY : no.d < 4 ? .92 : 1);
                        if (p.knock) { if (no.d < KN_END) p.knock = false; else p.sf = Math.max(p.sf, KN_SF); }      // [knock] topu önüne itip depar
                        if (p.knC && KN_RUN) p.sf = Math.max(p.sf, KN_SF); }      // [knock] döngü bitene dek itilen topa depar (rakip yaklaşsa da)
                    else {      // düşünürken durmaz: topu yavaşça ilerletir ya da baskıdan uzaklaşır
                        var nq = nearestOpp(p), gx0 = atkGoalX(p.team), ux0 = gx0 - p.x, uy0 = CY - p.y, ul0 = hyp(ux0, uy0) || 1; ux0 /= ul0; uy0 /= ul0;
                        var ax0 = ux0, ay0 = uy0 * .5;
                        if (nq.d < 5) { var awx = p.x - nq.p.x, awy = p.y - nq.p.y, awl = hyp(awx, awy) || 1; ax0 = ux0 * .3 + awx / awl * .9; ay0 = uy0 * .15 + awy / awl * .9; }
                        else { var blk = false; for (var bi0 = 0; bi0 < 22; bi0++) { var ob = S.players[bi0]; if (ob.team === p.team || ob.off) continue; var dxb = (ob.x - p.x) * S.teams[p.team].dir; if (dxb > 0 && dxb < 6 && Math.abs(ob.y - p.y) < 2.5 + dxb * .3) { blk = true; break; } } if (blk) { ax0 = 0; ay0 = 0; } }
                        var al0 = hyp(ax0, ay0);
                        if (al0 < .05 || (p.role === 'GK')) { p.tx = p.x; p.ty = p.y; p.sf = .3; }
                        else { p.tx = clamp(p.x + ax0 / al0 * 3, 2.5, PW - 2.5); p.ty = clamp(p.y + ay0 / al0 * 3, 2.5, PH - 2.5); p.sf = IDLE_SF; }
                    }
                    if (TC_PHYS && p.role !== 'GK' && B.owner === p) { if (CR_STEER) carrySteer(p); else if (p.cr) { p.cr.atx = p.tx; p.cr.aty = p.ty; } }      // [carry]
                    continue;
                }
                if (!B.owner) {
                    if (S.pass && S.pass.active && S.pass.to === p) { p.tx = p.ix; p.ty = p.iy; p.sf = 1; if (AIS) p.relax = relaxT(p, chaser); continue; }
                    if (chaser[p.team] === p && p.tInt < 30 && !(AIS && hopeless(p))) { p.tx = p.ix; p.ty = p.iy; p.sf = 1; if (AIS) p.relax = relaxT(p, chaser); continue; }
                }
                var sh = shapeTarget(p, has);
                if (SH_TAU > 0) {      // [dinamik] dizilis hedefi izlenir (sahiplik degisiminde 6-10 m sicrama yok)
                    if (p.shX == null || p.shT == null || S.t - p.shT > .2) { p.shX = sh[0]; p.shY = sh[1]; }
                    else { var shk = 1 - Math.exp(-DT / SH_TAU); p.shX += (sh[0] - p.shX) * shk; p.shY += (sh[1] - p.shY) * shk; }
                    p.shT = S.t; sh = [p.shX, p.shY];
                }
                var dr = D && D[p.id];
                if (dr && dr.kind !== 'mark') { p.tx = clamp(dr.tx, 1, PW - 1); p.ty = clamp(dr.ty, 1, PH - 1); p.sf = dr.sf; continue; }
                var tx = sh[0], ty = sh[1], sf = .6;
                if (has === p.team && B.owner && p !== B.owner && p.supT && S.t - p.supT.t < .9) { tx = p.supT.x; ty = p.supT.y; sf = .8; }
                if (has === p.team && B.owner && p !== B.owner && p.boxT && S.t - p.boxT.t < .8) { tx = p.boxT.x; ty = p.boxT.y; sf = .9; }
                if (OB_ON && has === p.team && p !== B.owner) {
                    if (p.chk && p.chk.until > S.t) { if (S.t < p.chk.ft) { tx = p.chk.fx; ty = p.chk.fy; sf = .9; } else { tx = p.chk.x; ty = p.chk.y; sf = 1; } }
                    if (p.late && S.t >= p.late.t0 && S.t < p.late.until) { var gxl = atkGoalX(p.team), oL = offDist(p.team); tx = Math.abs(gxl - p.late.x) < oL - .6 ? gxl - d * (oL - .6) : p.late.x; ty = p.late.y; sf = .97; }
                } else if (p.chk || p.late) { p.chk = null; p.late = null; }
                if (has === p.team && p !== B.owner && p.run && p.run.until > S.t) { if (p.run.wt && S.t < p.run.wt) { tx = p.run.wx; ty = p.run.wy; sf = .92; } else { tx = p.run.x; ty = p.run.y; sf = 1; } } else if (p.run && (has !== p.team || p.run.until <= S.t)) p.run = null;
                if (dr && dr.kind === 'mark') {
                    var wgt = dr.w; tx = wgt * dr.tx + (1 - wgt) * sh[0]; ty = wgt * dr.ty + (1 - wgt) * sh[1]; sf = dr.sf;
                    if (AICAL && aerialGo(p)) { var hl = B.high, ogx = ownGoalX(p.team) - hl.x, ogy = CY - hl.y, ogl = hyp(ogx, ogy) || 1; p.tx = clamp(hl.x + ogx / ogl * .5, 1, PW - 1); p.ty = clamp(hl.y + ogy / ogl * .5, 1, PH - 1); p.sf = 1; continue; }      // [aical] markajcı hava topuna çıkar
                }
                // takım arkadaşlarından ayrışma
                var rx = 0, ry = 0;
                for (var k = 0; k < 22; k++) { var q = S.players[k]; if (q === p || q.team !== p.team || q.role === 'GK' || q.off) continue; var qd = hyp(q.x - p.x, q.y - p.y); if (qd < 5 && qd > .01) { rx += (p.x - q.x) / qd * (5 - qd) * .5; ry += (p.y - q.y) / qd * (5 - qd) * .5; } }
                p.tx = clamp(tx + rx, 1, PW - 1); p.ty = clamp(ty + ry, 1, PH - 1);
                var far = hyp(p.tx - p.x, p.ty - p.y); p.sf = far > 14 ? Math.max(sf, AV_MOVE ? avp('AV_FAR', .75) : .85) : sf;      // [av] AV_MOVE: uzak yer değiştirme koşar adım (izleme: 5,5 m/sn+ zaman payı %3,2)
                var bkF = FATIGUE && (p.role === 'AM' || p.role === 'ST' || p.role === 'LW' || p.role === 'RW') ? FT_BK * (1 - p.stam) : 0;      // [fatigue] yorgun hücumcu geri dönüşte eforunu kısar
                if (has !== -1 && has !== p.team && (p.x - p.tx) * d > 3.5) p.sf = (!AIS || ((p.x - B.x) * d > 0 && Math.abs(B.x - ownG) < (AV_MOVE ? 52.5 : 50)) || (!AV_MOVE && (p.x - p.tx) * d > 12 && Math.abs(B.x - ownG) < 40)) ? (FATIGUE && p.ana < FT_EA ? .86 : .98) - bkF : Math.max(p.sf, (AV_ATTR && p.a.wr != null ? clamp(.86 + .002 * (p.a.wr - 70), .8, .92) : .86) - bkF);      // [av] AV_MOVE: geri dönüş deparı yalnız top kendi yarı alanımızdayken ve oyuncu topun önündeyse · AV_ATTR: Çalışkanlık geri dönüş temposu      // [ais] depar: topun önünde kalmışken top kaleye yaklaşıyorsa ya da hedefin çok gerisindeyse; değilse koşar adım   // top kaybedilince geri koş
            }
        }
        // [dead] vuruşçunun yeri: DEADB → topun .5 m arkası (vuruş yönünün tersi: serbest vuruş / penaltı kaleye, korner / aut saha ortasına; başlama vuruşunda yan-arka)
        //   PEN14 → penaltıda düdükten 1 sn öncesine dek 2,5 m geride bekler, sonra topa koşar (DEADB kapalıyken .75 m arkasına: vuruş topu noktaya koyar)
        function takerSpot(p, d, dir) {
            var kind = d.kind, ux, uy, back = DEADB ? .5 : .75;
            if (kind === 'penalty') { if (PEN14 && d.timer < d.wait - 1) back = 2.5; else if (!PEN14) back = .5; }
            else if (!DEADB) return;
            if (kind === 'kickoff') { ux = dir; uy = 1; }
            else if (kind === 'penalty' || kind === 'freekick') { ux = atkGoalX(d.team) - d.x; uy = CY - d.y; }
            else { ux = CX - d.x; uy = CY - d.y; }
            var ul = hyp(ux, uy) || 1;
            p.tx = d.x - ux / ul * back; p.ty = d.y - uy / ul * back;
        }
        function deadTarget(p) {
            var d = S.dead, T = S.teams[p.team], dir = T.dir, kind = d.kind;
            if (p === d.taker) { p.tx = d.x - dir * (kind === 'penalty' ? 3 : .2) * (kind === 'penalty' ? 1 : 0); p.ty = d.y; if (kind === 'penalty') p.tx = d.x - dir * 2.5; p.sf = 1; if (kind === 'throw') { p.tx = d.x; p.ty = d.y + (d.y < CY ? -.4 : .4); } else if (DEADB || PEN14) takerSpot(p, d, dir); return; }
            var atk = p.team === d.team, ag = atkGoalX(d.team);
            if (kind === 'kickoff') { var ks = koSpot(p, atk), fx = ks[0], fy = ks[1]; p.tx = dir === 1 ? fx * PW : (1 - fx) * PW; p.ty = dir === 1 ? fy * PH : (1 - fy) * PH; if (p.role === 'AM' && atk) { p.tx = CX - dir * 3; p.ty = CY + 4; } p.sf = .95; return; }
            if (kind === 'corner' || kind === 'penalty') {
                var gd = S.teams[d.team].dir, gx = ag;
                if (p.role === 'GK') {
                    if (DEADGK && atk) { var ogk = ownGoalX(p.team), gxk = AV_GK ? gkDepthAV(Math.abs(d.x - ogk)) : clamp(1.6 + Math.abs(d.x - ogk) * .045, 1.6, 6.5), lnK = tacOf(p.team).line; if (lnK) gxk = clamp(gxk + LN_GK * lnK, 1.2, AV_GK ? 21 : 9); p.tx = ogk + dir * gxk; p.ty = CY; p.sf = .7; return; }      // [dead] hücum eden takımın kalecisi kendi kalesinin önünde (canlı oyundaki yeri)
                    if (PEN14 && kind === 'penalty' && !atk) { p.tx = clamp(gx - gd * .1, .05, PW - .05); p.ty = CY; p.sf = .7; return; }      // [dead] penaltıda savunan kaleci kale çizgisinde
                    p.tx = clamp(gx - gd * 1.2, .5, PW - .5); p.ty = CY + (kind === 'corner' ? (d.y < CY ? -1.2 : 1.2) : 0); p.sf = .7; return;
                }
                var slot = { LB: 0, RB: 1, LCB: 2, RCB: 3, LDM: 4, RDM: 5, LW: 6, RW: 7, AM: 8, ST: 9 }[p.role], sy = [-5, 5, -2.5, 2.5, -6.5, 6.5, -1, 1, 0, -4][slot], sx = [9, 9, 7.5, 7.5, 11, 11, 13, 13, 8.5, 6][slot];
                if (kind === 'penalty') { var edge = gx - gd * 20.5, spotSide = (slot % 2 ? 1 : -1) * (7 + (slot >> 1) * 2.2); if (PEN14 && !atk) spotSide += (slot % 2 ? 1 : -1) * 1.1; p.tx = clamp(edge, 1, PW - 1); p.ty = CY + spotSide; p.sf = .8; return; }
                if (atk) { p.tx = clamp(gx - gd * (sx + (slot >= 4 && slot < 8 ? 3 : 0)), 1, PW - 1); p.ty = CY + sy * 1.3; if (slot === 0 || slot === 1 || slot === 4 || slot === 5) { var back = shapeTarget(p, p.team); p.tx = back[0]; p.ty = back[1]; } }
                else { p.tx = clamp(gx - gd * (sx - 3), 1, PW - 1); p.ty = CY + sy * 1.25; }
                p.sf = .9; return;
            }
            var sh = shapeTarget(p, DEADSH ? d.team : (atk ? d.team : (1 - d.team)));      // [dead] DEADSH: topa sahip takım d.team (eski ifade her oyuncuya kendi takımını veriyordu)
            if (kind === 'freekick' && !atk) {
                if (p.role === 'GK') {      // baraj varsa: barajın kapatmadığı uzak yarıyı tutar · yoksa topa göre normal duruş
                    if (d.wall) { p.tx = d.wall.gk.x; p.ty = d.wall.gk.y; }
                    else { var ownG = ownGoalX(p.team), bdx = Math.abs(d.x - ownG); p.tx = ownG + dir * (AV_GK ? gkDepthAV(bdx, hyp(d.x - ownG, d.y - CY)) : clamp(1.6 + bdx * .045, 1.6, 6.5)); p.ty = CY + clamp((d.y - CY) * (bdx < 30 ? .3 : .18), -3.3, 3.3); }
                    p.sf = .8; return;
                }
                var sl = wallSlot(d, p); if (sl) { p.tx = sl.x; p.ty = sl.y; p.sf = 1; return; }      // baraj oyuncusu yerine koşar, vuruşa kadar kıpırdamaz
                var dd = hyp(sh[0] - d.x, sh[1] - d.y); if (dd < 9.6) { var ux = (sh[0] - d.x) / (dd || 1), uy = (sh[1] - d.y) / (dd || 1); sh = [d.x + ux * 9.8, d.y + uy * 9.8]; }
            }
            if (kind === 'freekick' && atk && d.wall) {      // IFAB: 3+ kişilik barajda saldırganlar en az 1 m uzakta durur (koridor payı ile 1,8 m)
                for (var wi = 0; wi < d.wall.slots.length; wi++) { var w = d.wall.slots[wi], wd = hyp(sh[0] - w.x, sh[1] - w.y); if (wd < 1.8) { var wx = wd > .01 ? (sh[0] - w.x) / wd : -dir, wy = wd > .01 ? (sh[1] - w.y) / wd : 0; sh = [w.x + wx * 1.8, w.y + wy * 1.8]; } }
            }
            p.tx = clamp(sh[0], 1, PW - 1); p.ty = clamp(sh[1], 1, PH - 1); p.sf = .8;
        }

        /* [port] talimatların kondisyon bedeli: yüksek baskı ve hızlı tempo daha çabuk yorar, rahat baskı ve yavaş tempo korur */
        function tacFat(tm) { if (!TAC_ON) return 1; var t = S.teams[tm].tac; return (t.press > 0 ? 1.32 : t.press < 0 ? .88 : 1) * (t.tempo > 0 ? 1.12 : t.tempo < 0 ? .94 : 1) * (t.ment > 0 ? 1.05 : 1) * (t.line > 0 ? 1.04 : 1); }
        // [fatigue] yorgunluk adımı: v = adım sonu hız (m/sn), aL = hız değişimi (m/sn², + hızlanma), live = canlı oyun
        function fatigueStep(p, v, aL, live) {
            var r = Math.min(1.1, v / p.maxV), up = Math.min(1.5, Math.max(0, aL) / p.acc);      // fiziksel olmayan sıçramalar (konum düzeltmesi) tükenmeye girmesin
            // uzun süreli: efor (hız² + hızlanma) × dayanıklılık; kalıcı kısım tavanı düşürür, geri kalanı yavaşken / top ölüyken tavana toparlanır
            var dr = FT_K * (r * r + FT_KA * Math.max(0, up - .2)) * p.staK * DT * CK * tacFat(p.team);
            p.stam -= dr; p.stamCap = clamp(p.stamCap - dr * FT_IRR, .3, 1);
            if (!live || r < .45) p.stam += (p.stamCap - p.stam) * Math.min(1, FT_REC * CK * DT);
            p.stam = clamp(p.stam, .3, p.stamCap);
            // kısa süreli (anaerobik, W' dengesi gibi): kritik hızın (FT_AHI·Vmax) üstündeki hız ve sert hızlanma depoyu boşaltır; depo yalnız kritik hızın altında, FT_AT sn zaman sabitiyle dolar
            var hi = Math.max(0, (r - FT_AHI) / (1 - FT_AHI));
            p.ana = clamp(p.ana - FT_AD * (hi + FT_AACC * Math.max(0, up - .3)) * DT + (hi > 0 ? 0 : (1 - p.ana) * DT / FT_AT), 0, 1);
            p.anaD = (1 - p.ana) * (1 - p.ana);      // etki boşluğun karesiyle: olağan koşuda küçük, arka arkaya deparlardan sonra belirgin
        }
        // ---------- hareket ----------
        function movePlayers() {
            if (MOVE) { movePlayersPhys(); return; }
            for (var i = 0; i < 22; i++) {
                var p = S.players[i];
                if (p.off) continue;
                var dx = p.tx - p.x, dy = p.ty - p.y, d = hyp(dx, dy);
                var sp0 = hyp(p.vx, p.vy), maxV = p.maxV * (.74 + .26 * p.stam) * (FATIGUE ? 1 - FT_AV * p.anaD : 1), want = Math.min(maxV * p.sf * (p.stunT > S.t ? .35 : 1), d / .3);
                var vdx = 0, vdy = 0; if (d > .05) { vdx = dx / d * want; vdy = dy / d * want; }
                var ax = vdx - p.vx, ay = vdy - p.vy, al = hyp(ax, ay), lim = p.acc * DT; if (al > lim) { ax *= lim / al; ay *= lim / al; }
                p.vx += ax; p.vy += ay;
                var sp = hyp(p.vx, p.vy); if (sp > maxV * 1.35) { p.vx *= maxV * 1.35 / sp; p.vy *= maxV * 1.35 / sp; sp = maxV * 1.35; }
                p.x = clamp(p.x + p.vx * DT, -1, PW + 1); p.y = clamp(p.y + p.vy * DT, -1, PH + 1);
                if (sp > .4) { p.fx = p.vx / sp; p.fy = p.vy / sp; } else { var bx = B.x - p.x, by = B.y - p.y, bl = hyp(bx, by) || 1; p.fx = bx / bl; p.fy = by / bl; }
                if (FATIGUE) fatigueStep(p, sp, (sp - sp0) / DT, S.mode === 'live');
                else p.stam = clamp(p.stam - (Math.pow(sp / p.maxV, 2) * DT * .00012 - DT * .00004 * (sp < p.maxV * .5 ? 1 : 0)) * CK, .3, 1);
                if (p.cd > 0) p.cd -= DT; if (p.tcd > 0) p.tcd -= DT;
                if (sp / p.maxV > S.audit.maxV) S.audit.maxV = sp / p.maxV;
                if (p.x < -1.01 || p.x > PW + 1.01 || p.y < -1.01 || p.y > PH + 1.01) S.audit.oob++;
                var acc = Math.min(al, lim) / DT; if (acc > S.audit.maxAcc) S.audit.maxAcc = acc;
            }
        }
        function angDiff(a, b) { var d = a - b; return d - 6.283185307179586 * Math.round(d / 6.283185307179586); }
        // [move] fiziksel hareket: gövde yönü (p.fa) hareket yönünden ayrıdır ve sınırlı hızla döner; ivme hıza bağlıdır; fren ve yanal ivme sınırlıdır (sürtünme elipsi)
        function movePlayersPhys() {
            var live = S.mode === 'live', i, p;
            for (i = 0; i < 22; i++) {
                p = S.players[i];
                if (p.off) continue;
                if (p.fa == null) p.fa = Math.atan2(p.fy, p.fx);
                var sp = hyp(p.vx, p.vy), maxV = p.maxV * (.74 + .26 * p.stam) * (FATIGUE ? 1 - FT_AV * p.anaD : 1), own = B.owner === p;      // [fatigue] anaerobik depo boşaldıkça azami hız düşer
                // topsuz hedef yumuşatma: hedef her adımda yeniden hesaplanır; küçük sıçramalar oyuncunun "yeniden okuma" süresiyle yumuşar (acil işler - top, baskı, geri koşu - anında)
                var urgent = !live || own || p.sf >= .9 || (S.pass && S.pass.to === p);
                var gkSet = GK_SET && !urgent && p.role === 'GK' && hyp(B.x - ownGoalX(p.team), B.y - CY) < GK_SETD;      // [gk] GK_SET: kalesine yakın topta kalecinin yer tutması
                if (urgent || p.stx == null || (!(MV_BIG && live) && hyp(p.tx - p.stx, p.ty - p.sty) > 8)) { p.stx = p.tx; p.sty = p.ty; }      // [dinamik] MV_BIG: canli oyunda buyuk sicrama da yumusar
                else { var k = Math.min(1, DT / (gkSet ? Math.max(GK_SETT, DT) : MV_SMOOTH)); p.stx += (p.tx - p.stx) * k; p.sty += (p.ty - p.sty) * k; }
                var dx = p.stx - p.x, dy = p.sty - p.y, d = hyp(dx, dy);
                // durma bandı (histerezis): hedefe yeterince yakın ve yavaşken kıpırdamaz, hedef bandın dışına çıkınca yeniden yürür
                if (gkSet) { p.idle = false; if (d < GK_SETB) d = 0; }      // [gk] kalecinin dar durma bandı
                else if (!urgent) { if (p.idle && d < MV_DEAD * 1.8) d = 0; else if (d < MV_DEAD && sp < 1.2) { p.idle = true; d = 0; } else p.idle = false; } else p.idle = false;
                var brk = MV_BRK * (.9 + .1 * p.stam) * (FATIGUE ? 1 - .5 * FT_AA * p.anaD : 1);
                var want = Math.min(maxV * p.sf * (p.stunT > S.t ? .35 : 1), Math.sqrt(2 * brk * (MV_ARRS && !(!live || own || (S.pass && S.pass.to === p) || hyp(p.tx - B.x, p.ty - B.y) < MV_ARRB) ? MV_ARRS : MV_ARR) * d), d / .25);      // [dinamik] topa yakin hedef (pres, kovalama, pas karsilama) ve top sahibi sert; uzaktaki yerlesim / geri donus / kosu bitisi yumusak varir
                if (p.relax > 0) want = Math.min(want, Math.max(2, d / p.relax * 1.15));      // [ais] topa tam zamanında varır
                if (FATIGUE && FT_PACE && !urgent && live) want = Math.min(want, p.maxV * (FT_AHI + (1 - FT_AHI) * clamp((p.ana - .8) / .2, 0, 1)));      // [fatigue] tempo ayarı: depo dolana dek kritik hızın altında
                var mx = d > .05 ? dx / d : 0, my = d > .05 ? dy / d : 0;
                // gövde yönü: koşarken hareket yönüne; yavaşken ya da kısa ayarlamada (top sahibi değilse) topa bakar → geri / yan adım
                var bx = B.x - p.x, by = B.y - p.y, bl = hyp(bx, by) || 1, hd;
                var faceBall = !own && live && bl > .8 && sp < 4.5 && (want < 3 || (d < 7 && p.sf < .9 && (mx * bx + my * by) / bl < .2));
                if (faceBall || want < .3) hd = Math.atan2(by, bl > .01 ? bx : 1);
                else hd = Math.atan2(my, mx);
                var wk = Math.max(0, 1 - sp / 5), w = (MV_TURN1 + (MV_TURN0 - MV_TURN1) * wk * wk) * (AGIL ? p.agK : 1), dA = angDiff(hd, p.fa), mxA = w * DT;      // [v137] AGIL: çeviklik
                p.fa += dA > mxA ? mxA : dA < -mxA ? -mxA : dA;
                p.fx = Math.cos(p.fa); p.fy = Math.sin(p.fa);
                // gövdeye göre hareket açısı: geri ve yan adımlar daha yavaş
                if (want > .3) { var cr = mx * p.fx + my * p.fy, lim2 = cr > .82 ? 1 : cr > 0 ? MV_SIDE + (1 - MV_SIDE) * cr / .82 : MV_SIDE + (MV_BACK - MV_SIDE) * (-cr); want = Math.min(want, p.maxV * lim2); }
                var vdx = mx * want, vdy = my * want, ddx = vdx - p.vx, ddy = vdy - p.vy, ax, ay;
                var A0 = p.acc * (p.stunT > S.t ? .6 : 1) * (gkSet ? GK_SETA : AIS && !urgent ? AIS_EFF : AIS && p.relax > 0 ? .55 : 1) * (FATIGUE ? (1 - FT_A * (1 - p.stam)) * (1 - FT_AA * p.anaD) : 1);      // [ais] acil olmayan yer değiştirme: koşar adım, depar değil
                if (sp > .8) {
                    var ux = p.vx / sp, uy = p.vy / sp, L = ddx * ux + ddy * uy, Tn = -ddx * uy + ddy * ux;
                    var aF = Math.max(.35, A0 * (1 - Math.pow(sp / (MV_TAPER * p.maxV), 2)));
                    var Lm = (L > 0 ? aF : brk) * DT, Tm = MV_LAT0 * (AGIL ? p.agK : 1) * (1 - MV_LATV * Math.min(1, Math.pow(sp / p.maxV, 2))) * DT;
                    var s = hyp(L / Lm, Tn / Tm); if (s > 1) { L /= s; Tn /= s; }
                    ax = ux * L - uy * Tn; ay = uy * L + ux * Tn;
                } else {
                    var al = hyp(ddx, ddy), lim = A0 * DT; ax = ddx; ay = ddy; if (al > lim) { ax *= lim / al; ay *= lim / al; }
                }
                p.vx += ax; p.vy += ay;
                var sp2 = hyp(p.vx, p.vy); if (sp2 > maxV * 1.05) { p.vx *= maxV * 1.05 / sp2; p.vy *= maxV * 1.05 / sp2; sp2 = maxV * 1.05; }
                p.x = clamp(p.x + p.vx * DT, -1, PW + 1); p.y = clamp(p.y + p.vy * DT, -1, PH + 1);
                if (FATIGUE) fatigueStep(p, sp2, (sp2 - sp) / DT, live);
                else p.stam = clamp(p.stam - (Math.pow(sp2 / p.maxV, 2) * DT * .00012 - DT * .00004 * (sp2 < p.maxV * .5 ? 1 : 0)) * CK, .3, 1);
                if (p.cd > 0) p.cd -= DT; if (p.tcd > 0) p.tcd -= DT;
                if (sp2 / p.maxV > S.audit.maxV) S.audit.maxV = sp2 / p.maxV;
                if (p.x < -1.01 || p.x > PW + 1.01 || p.y < -1.01 || p.y > PH + 1.01) S.audit.oob++;
                var acc = hyp(ax, ay) / DT; if (acc > S.audit.maxAcc) S.audit.maxAcc = acc;
            }
            if (MV_COLL && live) collide();
        }
        // gövde çarpışması: iki oyuncu iç içe geçmez; birbirine doğru hız bileşeni sönümlenir, itilme payı güce (str) ve kütleye göre paylaşılır
        function collide() {
            for (var i = 0; i < 22; i++) {
                var p = S.players[i]; if (p.off) continue;
                for (var j = i + 1; j < 22; j++) {
                    var q = S.players[j]; if (q.off) continue;
                    var dx = q.x - p.x, dy = q.y - p.y, d = hyp(dx, dy), md = p.team === q.team ? .62 : .56;
                    if (d >= md) continue;
                    if (d < .001) { dx = 1; dy = 0; d = 1e-3; if (MV_SEP) dx = d; }      // [move] MV_SEP: birim normal
                    var nx = dx / d, ny = dy / d, ov = (md - d) * .5;      // yumuşak gövde: örtüşmenin yarısı her adımda giderilir (sert sıçrama yok)
                    var mp = p.a.str + 40, mq = q.a.str + 40, wp = mq / (mp + mq), wq = 1 - wp;
                    p.x -= nx * ov * wp; p.y -= ny * ov * wp; q.x += nx * ov * wq; q.y += ny * ov * wq;
                    var rv = ((q.vx - p.vx) * nx + (q.vy - p.vy) * ny) * .35; if (AV_MOVE && rv < -MV_BRK * DT) rv = -MV_BRK * DT;      // [av] AV_MOVE: gövde temasında hız sönümü fren sınırını aşmaz (eskiden 1–2 m/sn'de −22 m/sn² ani duruş)      // yaklaşma hızının bir kısmı sönümlenir (omuz teması; ani duruş değil)
                    if (rv < 0) { p.vx += nx * rv * wp; p.vy += ny * rv * wp; q.vx -= nx * rv * wq; q.vy -= ny * rv * wq; p.colT = q.colT = S.t; }
                }
            }
        }

        // ---------- top ----------
        // [offs] ofsayt kaydındaki p topa dokundu: yan hakem kararı (açık ofsayt: genellikle bayrak; kaçarsa / tolerans içindeyse hücum evresine yazılır). Dönen: bayrak kalktı mı
        function offJudge(osn, p) {
                var mo0 = osn.mo[p.id];
                if (osn.ids[p.id]) {      // açık ofsayt: yan hakem genellikle bayrağı kaldırır; kıl payında ve hedef olmayan oyuncuda daha sık kaçırır
                    var pMiss = AR_MISS * Math.exp(-(mo0 - OFF_TOL) / .6) * (osn.to === p.id ? 1 : 1.6);
                    if (RR() < pMiss) appRec(osn, p, mo0, 'off'); else return true;
                }
                else if (mo0 > 0) appRec(osn, p, mo0, 'off');      // tolerans içinde: yan hakem göremez, yalnız VAR ölçer
                else appRec(osn, p, mo0, 'close');                  // kıl payı içeride: VAR kontrol eder (gol geçerli)
                return false;
        }
        function gain(p) {
            var prev = B.last, pass = S.pass, osn = OFFS2 ? S.offSnap : null;
            var offP = OFFS2 ? false : !!(pass && pass.active && pass.offside && pass.team === p.team && pass.to === p);
            if (OFFS2 && osn && osn.team === p.team && S.mode === 'live' && osn.mo[p.id] != null) offP = offJudge(osn, p);
            var snapMo = osn && osn.team === p.team && osn.mo[p.id] != null ? osn.mo[p.id] : null;
            if (OFFS2) S.offSnap = null;      // top kontrol edildi: ofsayt yeniden bir sonraki vuruşta değerlendirilir
            if (offP) {
                S.pass = null; S.shot = null; S.chain[p.team] = 0;
                S.teams[p.team].st.offsides++; emit('OFFSIDE', { team: p.team, p: p.id, p2: OFFS2 ? osn.from : (pass.from ? pass.from.id : -1), x: p.x, y: p.y });
                startDead('freekick', 1 - p.team, { x: clamp(p.x, 1, PW - 1), y: clamp(p.y, 1, PH - 1) }, { indirect: true });
                if (S.userRef && S.refAllFn) S._outAsk({ kind: 'offs', flag: true, p: p.id, team: p.team, mo: snapMo, t: S.t, x: p.x, y: p.y, truth: { call: snapMo == null || snapMo > 0 ? 'ofs' : 'devam' } });
                return;
            }
            if (S.userRef && S.refAllFn && snapMo != null && snapMo > -.9 && S.mode === 'live') S._outAsk({ kind: 'offs', flag: false, p: p.id, team: p.team, mo: snapMo, t: S.t, x: p.x, y: p.y, truth: { call: snapMo > 0 ? 'ofs' : 'devam' } });
            var gvx = B.vx, gvy = B.vy;
            B.owner = p; B.high = null; B.shotFlag = false; B.vx = B.vy = 0; if (TC_PHYS && p.role !== 'GK') { B.vx = gvx; B.vy = gvy; p.cr = null; }      // [carry] ilk dokunus bekler
            if (BALL3D) { if (TC_RCV && p.role !== 'GK') B.vz = Math.min(0, B.vz || 0); else { B.z = 0; B.vz = 0; } }
            if (TC_RCV) { p.rbOn = p.role !== 'GK'; p.rbx = B.x - p.x; p.rby = B.y - p.y; }      // [touch] top alındığı yerden ayağa taşınır (havadaysa düşer)
            p.think = (THINK_A + THINK_B * R()) * clamp(.3 + .7 * (nearestOpp(p).d - 1.5) / 5, .3, 1) * (1 - TP_THINK * tacOf(p.team).tempo); p.dribble = false; p.holdT = 0; p.knock = false; p.knC = false;
            if (S.forceQuick != null && S.forceQuick === p.id) { p.think = .06; S.forceQuick = null; }      // [v186] zorla gol kurgusu: tek dokunuş (dönen top, orta, ara pası)
            if (OB_ON) { p.gainT = S.t; p.gainBack = !!(pass && pass.active && pass.team === p.team && pass.from && (p.x - pass.from.x) * S.teams[p.team].dir < -5); var lt0 = S.lostT || (S.lostT = [-9, -9]); if ((pass && pass.active && pass.team !== p.team) || (!(pass && pass.active) && prev && prev.team !== p.team)) lt0[1 - p.team] = S.t; }      // [ob]
            if (pass && pass.active) {
                if (pass.team !== p.team) { S.lastAst = null; S.teams[p.team].st.inter++; emit('INTERCEPT', { team: p.team, p: p.id, p2: pass.from ? pass.from.id : -1, meta: { tag: pass.tag, high: pass.high } }); S.chain[pass.team] = 0; }
                else { S.teams[p.team].st.passOk++; S.chain[p.team]++; S.lastAst = pass.from ? { from: pass.from.id, to: p.id, t: S.t, team: p.team, tag: pass.tag, mo: OFFS2 && snapMo != null ? snapMo : (pass.to === p ? pass.mo : -9), ox: pass.qx, oy: pass.qy, tp: pass.t0, px: pass.px, py: pass.py, lx: pass.lx } : null; emit('PASS_OK', { team: p.team, p: p.id, p2: pass.from ? pass.from.id : -1, meta: { chain: S.chain[p.team], prog: pass.from ? (p.x - pass.from.x) * S.teams[p.team].dir : 0, tag: pass.tag, receiver: pass.to === p } }); }
            } else if (prev && prev.team !== p.team && !S.shot) { S.chain[prev.team] = 0; }
            if (S.shot && S.shot.team !== p.team) {
                var sh0 = S.shot;
                if (p.role === 'GK') { S.teams[p.team].st.saves++; emit('SAVE', { team: p.team, p: p.id, p2: sh0.shooter.id, meta: { xg: sh0.xg, parry: false, gkDist: hyp(p.x - B.x, p.y - B.y), reach: 1.25 + .024 * p.a.gk, speed: 0, slow: true } }); }
                else { S.teams[p.team].st.tackles++; emit('BLOCK', { team: p.team, p: p.id, p2: sh0.shooter.id, meta: { xg: sh0.xg, gain: true } }); }
            } else if (S.shot && S.shot.team === p.team) { emit('OFF', { team: S.shot.team, p: S.shot.shooter.id, meta: { xg: S.shot.xg, teammate: true } }); }
            S.pass = null; S.shot = null; S.lastTeam = p.team; B.last = p;
        }
        // [gk] GK_BOX: kaleci elle yalnız kendi ceza sahasında oynar (dışarıda saha oyuncusu gibi)
        function gkHands(q) { return q.role === 'GK' && (!GK_BOX || inBox(q.x, q.y, 1 - q.team)); }
        function resolveAerial(hi) {
            var cands = S.players.filter(function (q) { return !q.off && hyp(q.x - hi.x, q.y - hi.y) < (AIR_TGT && !(q.role === 'GK' && inBox(q.x, q.y, 1 - q.team)) ? AIR_R + clamp(((q.a.h || 180) - 180) * .012, -.15, .2) : 3.4); });      // [air] saha oyuncusu yalnız baş + sıçrama erişiminde
            var fAir0 = S.forceAir != null ? S.players[S.forceAir] : null; if (fAir0 && !fAir0.off && cands.indexOf(fAir0) < 0 && hyp(fAir0.x - hi.x, fAir0.y - hi.y) <= 3.6) cands.push(fAir0);      // [v186] zorla gol kurgusu: golcü ortaya biraz uzaktan da yetişir
            hdZ = B.z;
            B.x = hi.x; B.y = hi.y; B.high = null;
            var shooterTeam = S.pass ? S.pass.team : S.lastTeam;
            if (!cands.length) { if (!BALL3D) { B.vx *= .12; B.vy *= .12; } return; }      // [ball] 3B: kimse yoksa top düşmeye devam eder ve seker
            var best = null, bw = -1, fAir = S.forceAir != null ? S.players[S.forceAir] : null; S.forceAir = null;
            if (fAir && (fAir.off || hyp(fAir.x - hi.x, fAir.y - hi.y) > 3.6)) fAir = null; else if (fAir && cands.indexOf(fAir) < 0) cands.push(fAir);      // [v186] zorla gol kurgusu: golcü düelloyu kazanır (iniş noktasına yetiştiyse)
            cands.forEach(function (q) { var gkH = gkHands(q); var w = (CURVE ? Math.exp(.028 * ((gkH ? 90 + ((q.a.gk_air || 70) - 70) * .6 : q.a.hea * .55 + q.a.str * .3 + q.a.pac * .15 + hgtK(q)) - 70)) * 60 : (q.a.hea * .5 + q.a.str * .3 + q.a.pac * .1 + (gkH ? 40 : 0))) / (1 + hyp(q.x - hi.x, q.y - hi.y) * .55) * (.6 + .8 * R()); if (AICAL && gkH && inBox(q.x, q.y, 1 - q.team)) w *= AC_GKW; /* [aical] kaleci elleriyle */ if (KF_GKW && gkH && hyp(q.x - hi.x, q.y - hi.y) < 2) w *= KF_GKW; /* [kafa] topun altindaki kaleci elleriyle */ if (gkH && hyp(q.x - hi.x, q.y - hi.y) > 8) w = 0; if (w > bw) { bw = w; best = q; } });
            if (fAir) best = fAir;
            if (!best) { if (!BALL3D) { B.vx *= .12; B.vy *= .12; } return; }
            var q = best, pass = S.pass;
            if (OFFS_AIR && airOffside(q, hi)) return;      // [offs] ofsayt konumundaki hücumcu düelloya girdi
            if (AICAL && AC_AF > 0 && airFoul(q, cands)) return;      // [aical] hava topu düellosunda faul
            if (gkHands(q)) { gain(q); emit('CLAIM', { team: q.team, p: q.id }); return; }
            var inFront = inBox(q.x, q.y, q.team) && hyp(atkGoalX(q.team) - q.x, CY - q.y) < 14;
            var wasOpp = pass && pass.team !== q.team;
            var ownBox = wasOpp && inBox(q.x, q.y, 1 - q.team);      // savunmacı kendi ceza sahasında rakibin yüksek topunu kazandı
            gain(q); if (S.mode === 'dead') return;
            emit('HEADER', { team: q.team, p: q.id, meta: { inFront: inFront, won: true, opp: wasOpp, clear: ownBox && R() < (AICAL ? AC_CH : CLEAR_HEAD) } });      // [aical] savunmacı çoğunlukla kafayla uzaklaştırır
            if (ownBox && S.events[S.events.length - 1].meta.clear) {      // uzaklaştırma kafası: kaleden uzağa, yanlara doğru gider (kenar çizgisi/gol çizgisi → korner ya da taç)
                var dr = S.teams[q.team].dir, behind = R() < CLEAR_BEHIND, ca = behind ? (dr === 1 ? Math.PI : 0) + gauss() * .55 : (dr === 1 ? 0 : Math.PI) + (R() < .5 ? -1 : 1) * (.45 + .9 * R()), cs = behind ? 9 + 5 * R() : 11 + 7 * R();
                if (AICAL) {      // [aical] arkaya kafa gövde yönüne bağlı (kendi kalesine dönük savunmacı topu ancak arkaya / yana çıkarır) ve direğin dışına, kendi tarafına yönelir
                    var ogx = ownGoalX(q.team) - q.x, ogy = CY - q.y, ogl = hyp(ogx, ogy) || 1, cOwn = (q.fx * ogx + q.fy * ogy) / ogl;
                    behind = R() < clamp(.12 + AC_CB * Math.max(0, cOwn), .1, .8);
                    if (behind) { var sy = B.y < CY ? -1 : 1, tyO = sy < 0 ? GY0 - 1 - 4 * R() : GY1 + 1 + 4 * R(); ca = Math.atan2(tyO - B.y, ownGoalX(q.team) - B.x) + gauss() * .12; cs = 9 + 5 * R(); }      // direğin dışına (temas noktasından)
                    else { ca = (dr === 1 ? 0 : Math.PI) + (R() < .5 ? -1 : 1) * (.45 + .9 * R()); cs = 11 + 7 * R(); }      // öne, kaleden uzağa
                }
                B.owner = null; B.vx = Math.cos(ca) * cs; B.vy = Math.sin(ca) * cs; B.last = q; S.lastTeam = q.team; q.cd = .6; S.pass = null; S.shot = null; if (BALL3D) { B.z = AIR_TGT && hdZ != null ? clamp(hdZ, .5, 2.3) : 2.0; B.vz = 2.5 + 3 * R(); } return;
            }
            if (fAir && q === fAir && S.forceGoal === q.team && !inFront && inBox(q.x, q.y, q.team) && hyp(atkGoalX(q.team) - q.x, CY - q.y) < 17) inFront = true;      // [v186]
            if (inFront && ((fAir && q === fAir && S.forceGoal === q.team) || R() < (AICAL ? AC_HSH : .55))) { q.think = 0; if (AIR_TGT) keepBall = true; doShot(q, xgAt(q.x, q.y, S.teams[q.team].dir, nearestOpp(q).d) * .8, nearestOpp(q).d, 'HEAD'); keepBall = false; }      // [air] kafa şutu temas noktasından
            else { B.owner = q; q.think = .05; }
        }
        // [offs] OFFS_AIR: savunma hava topunu kazandı ama ofsayt konumundaki hücumcu düelloya girmişti (iniş noktasına 2,8 m'den yakın; pasın hedefiyse 3,4 m) - rakibe müdahale (IFAB 11)
        //   yan hakem kararı gain() ile aynı (RR, AR_MISS); kaçırırsa oyun sürer. Dönen: ofsayt çalındı mı
        function airOffside(q, hi) {
            var osa = S.offSnap; if (!osa || S.mode !== 'live' || q.team === osa.team) return false;
            var oq = null, oqd = 1e9;
            S.players.forEach(function (c) { if (c.off || c.role === 'GK' || c.team !== osa.team || !osa.ids[c.id]) return; var cd2 = hyp(c.x - hi.x, c.y - hi.y); if ((cd2 < 2.8 || (osa.to === c.id && cd2 < 3.4)) && cd2 < oqd) { oqd = cd2; oq = c; } });
            if (!oq) return false;
            var mo1 = osa.mo[oq.id], pMs = AR_MISS * Math.exp(-(mo1 - OFF_TOL) / .6) * (osa.to === oq.id ? 1 : 1.6);
            if (RR() < pMs) return false;
            S.pass = null; S.shot = null; S.chain[oq.team] = 0; S.teams[oq.team].st.offsides++;
            emit('OFFSIDE', { team: oq.team, p: oq.id, p2: osa.from, x: oq.x, y: oq.y, meta: { air: true } });
            startDead('freekick', 1 - oq.team, { x: clamp(oq.x, 1, PW - 1), y: clamp(oq.y, 1, PH - 1) }, { indirect: true });
            return true;
        }
        // [touch] TC_OFF: kötü ilk dokunuş topa dokunmaktır - ofsayt (yan hakem) burada değerlendirilir, ofsayt kaydı dokunuştan yenilenir, süren şut kaydı kapanır. Dönen: ofsayt çalındı mı
        function badTouch(c) {
            var osh = S.offSnap;
            if (OFFS2) {
                if (osh && osh.team === c.team && S.mode === 'live' && osh.mo[c.id] != null && offJudge(osh, c)) {
                    S.pass = null; S.shot = null; S.chain[c.team] = 0; S.teams[c.team].st.offsides++;
                    emit('OFFSIDE', { team: c.team, p: c.id, p2: osh.from, x: c.x, y: c.y, meta: { touch: true } });
                    startDead('freekick', 1 - c.team, { x: clamp(c.x, 1, PW - 1), y: clamp(c.y, 1, PH - 1) }, { indirect: true });
                    return true;
                }
                offSnapTake(c.team, B.x, c);      // takım topu oynadı: ofsayt bir sonraki dokunuşta bu ana göre (rakibin dokunuşu hücum kaydını siler)
            }
            if (S.shot) {
                var sh = S.shot;
                if (sh.team === c.team) emit('OFF', { team: sh.team, p: sh.shooter.id, meta: { xg: sh.xg, teammate: true } });
                else { S.teams[c.team].st.tackles++; emit('BLOCK', { team: c.team, p: c.id, p2: sh.shooter.id, meta: { xg: sh.xg, touch: true } }); }
                S.shot = null; B.shotFlag = false;
            }
            return false;
        }
        // [ball] POSTN: direk silindiriyle çarpışma (bu adımın yolu px,py → B.x,B.y; merkez kale ağzının kenarında, yarıçap .06 + top). Top temas noktasına konur, hız normale göre yansır.
        //   Dönen: 0 değmedi · 1 değdi, top sahada (geri döndüyse şut biter; kaleye sekiyorsa kayıt sürer) · 2 değdi, top çizginin ötesinde (lineCheck: gol / aut / korner)
        function postStep(px, py, pz) {
            var rr = BRAD + .06, sx = B.x - px, sy = B.y - py, a = sx * sx + sy * sy, best = 2, hg = 0, hy = 0, k;
            if (a < 1e-9) return 0;
            for (k = 0; k < 4; k++) {
                var gl = k < 2 ? 0 : PW, cyp = k & 1 ? GY1 : GY0;
                if (Math.min(Math.abs(px - gl), Math.abs(B.x - gl)) > 1.5) continue;
                var fx = px - gl, fy = py - cyp, b = 2 * (fx * sx + fy * sy), c = fx * fx + fy * fy - rr * rr, disc = b * b - 4 * a * c;
                if (c < 0 || disc < 0) continue;      // başlangıç zaten temas içinde ya da yol değmiyor
                var tt = (-b - Math.sqrt(disc)) / (2 * a);
                if (tt < 0 || tt > 1 || tt >= best || pz + (B.z - pz) * tt >= GH + BRAD) continue;
                best = tt; hg = gl; hy = cyp;
            }
            if (best > 1) return 0;
            var cx0 = px + sx * best, cy0 = py + sy * best, nx = (cx0 - hg) / rr, ny = (cy0 - hy) / rr, vn = B.vx * nx + B.vy * ny;
            if (vn >= 0) return 0;
            var tvx = B.vx - vn * nx, tvy = B.vy - vn * ny;
            B.vx = tvx * .88 - BL_E * vn * nx; B.vy = tvy * .88 - BL_E * vn * ny; B.vz *= .9;
            B.z = Math.max(0, pz + (B.z - pz) * best); B.x = hg + nx * (rr + .01); B.y = hy + ny * (rr + .01);
            var gdir = hg === PW ? 1 : -1, inward = B.vx * gdir > 0;
            if (S.shot) emit('POST', { team: S.shot.team, p: S.shot.shooter.id, meta: { xg: S.shot.xg, bar: false, inward: inward } });
            if ((B.x - hg) * gdir > 0) return 2;
            if (!inward) { S.shot = null; S.pass = null; }
            return 1;
        }
        // [aical] hava topu düellosunda faul (q: düelloyu kazanan). Dönen: faul çalındı mı
        function airFoul(q, cands) {
            var r = null, rd = 1.6;
            cands.forEach(function (c) { if (c.team === q.team || c.role === 'GK') return; var dd = hyp(c.x - q.x, c.y - q.y); if (dd < rd) { rd = dd; r = c; } });
            if (!r) return false;
            var f = r, v = q; if (q.role !== 'GK' && R() >= .65) { f = q; v = r; }      // çoğunlukla kaybeden tutar / iter, bazen kazanan kolunu kullanır
            if (inBox(f.x, f.y, 1 - f.team)) return false;      // savunmacının kendi ceza sahasındaki tutması çoğunlukla çalınmaz
            var agg = f.a.agg != null ? f.a.agg : 40, pF = AC_AF * clamp(.6 + agg / 75, .6, 1.6) * clamp(1 + .02 * (v.a.str - f.a.str), .6, 1.5);
            if (R() >= pF) { if (VAR2 && f === q) appFoulRec(f, v, pF); return false; }      // [var] düelloyu kolunu kullanarak kazanan oyuncu: çalınmayan temas hücum evresine yazılır
            S.teams[f.team].st.fouls++;
            emit('FOUL', { team: f.team, p: f.id, p2: v.id, x: v.x, y: v.y, meta: { pen: false, air: true } });
            S.chain = [0, 0];
            startDead('freekick', v.team, { x: clamp(v.x, 1, PW - 1), y: clamp(v.y, 1, PH - 1) });
            f.nf = (f.nf || 0) + 1;
            if (S.refLog) S.refLog.push({ t: S.t, p: f.id, role: f.role, agg: agg, pen: false, air: true, nf: f.nf, dogso: 0, spa: 0 });
            if (CARDS_ON && !f.off) {      // hakem: hava topu faulünde sarı (dirsek / ısrarlı faul), hakem akışından
                var pYel = AC_AFY * Math.pow(Math.max(agg, 8) / 45, Y_EXP) + (f.nf >= 3 ? .2 : f.nf === 2 ? .1 : 0);
                if ((f.yc || 0) >= 1) pYel *= Y_AGAIN;
                if (RR() < pYel) { if ((f.yc || 0) >= 1) { f.yc++; cardEv(f, v, 'R', 'ikinci_sari', true, false); sendOff(f); } else cardEv(f, v, 'Y', 'faul', false, false); }
            }
            return true;
        }
        // [var] VAR2: çalınmayan hücumcu teması (f: kolunu kullanan, v: rakip). clear: hakemin kaçırdığı faul (hakem akışı, VAR_AFM·pF) · değilse kol teması (VAR kontrol eder, gol geçerli)
        function appFoulRec(f, v, pF) {
            var ap = appOf(f.team);
            (ap.foul || (ap.foul = [])).push({ clear: RR() < VAR_AFM * pF, p: f.id, v: v.id, x: v.x, y: v.y, t: S.t });
        }
        // [var] hücum evresindeki faul kaydı: önce kaçan faul (ilk), yoksa kol teması. Dönen: null | kayıt
        function appFoul(tm) {
            var ap = S.app && S.app[tm], l = ap && ap.foul, r = null, k;
            if (!l || !l.length) return null;
            for (k = 0; k < l.length; k++) if (!r || (l[k].clear && !r.clear)) r = l[k];
            return r;
        }
        // çizgi kontrolü: top (yerde, havada ya da taşınırken) saha dışına çıktı mı → gol / korner / aut / taç
        function lineCheck(px, py, v, how, pz) {
            var crossX = (B.x < 0 && px >= 0) || (B.x > PW && px <= PW);
            if (crossX) {
                var t = B.x < 0 ? px / (px - B.x) : (PW - px) / (B.x - px), cy = py + (B.y - py) * t;
                var goalLine = B.x < 0 ? 0 : PW, dirG = goalLine === PW ? 1 : -1;
                var atkTm = dirG === S.teams[0].dir ? 0 : 1;   // bu kaleye hücum eden takım
                var cz = BALL3D ? (pz == null ? B.z : pz + (B.z - pz) * t) : 0;
                if (BALL3D) {      // [ball] yan direkler ve üst direk gerçek geometriyle: top, yarıçapı (ve direk kalınlığı) içinde değerse çarpar
                    var postHit = !POSTN && (Math.abs(cy - GY0) < BRAD + .06 || Math.abs(cy - GY1) < BRAD + .06) && cz < GH + BRAD, barHit = !postHit && cy > GY0 - BRAD && cy < GY1 + BRAD && cz >= GH && cz < GH + BRAD + .06;
                    if (postHit || barHit) {
                        if (S.shot) emit('POST', { team: S.shot.team, p: S.shot.shooter.id, meta: { xg: S.shot.xg, bar: barHit } });
                        B.x = px; B.y = py; B.z = Math.max(0, pz == null ? B.z : pz);
                        if (barHit) { B.vx *= -.45; B.vz = -Math.abs(B.vz) * .45 - 1; B.vy += gauss() * 1.5; }
                        else { B.vx *= -.55; B.vy = B.vy * .6 + (cy < CY ? -1 : 1) * (1 + 2 * R()) * (Math.abs(cy - CY) > GW / 2 ? 1 : -1); }
                        S.shot = null; S.pass = null; return true;
                    }
                }
                if (cy > GY0 && cy < GY1 && (!BALL3D || cz < GH) && !(S.noGoal && !(S.shot && S.shot.force))) {
                    var nearPost = Math.min(Math.abs(cy - GY0), Math.abs(cy - GY1));
                    if (!BALL3D && S.shot && nearPost < .13 && R() < .8) { emit('POST', { team: S.shot.team, p: S.shot.shooter.id, meta: { xg: S.shot.xg } }); B.vx *= -.55; B.x = px; S.shot = null; S.pass = null; return true; }
                    var owng = B.last && B.last.team !== atkTm;
                    var scorer = B.last;
                    if (AICAL && owng && S.shot && S.shot.defl && S.shot.on0 && S.shot.team === atkTm) { owng = false; scorer = S.shot.shooter; }      // [aical] isabetli şut sapıp girdi: gol şutçunun
                    var asst = null, la = S.lastAst; if (scorer && !owng && la && la.team === atkTm && la.to === scorer.id && la.from !== scorer.id && S.t - la.t < 8 && !/^(THROW|GOALKICK|KICKOFF)$/.test(la.tag || '')) asst = la.from;
                    var vr = (VAR_ON && scorer && !owng && !(S.shot && (S.shot.pen || S.shot.force))) ? varReview(atkTm, scorer, asst != null ? la : null, goalLine + dirG * .2, cy) : null;
                    if (!vr && VAR_ON && VAR_OG && owng && scorer && !(S.shot && (S.shot.pen || S.shot.force))) vr = varAppOff(atkTm, scorer, goalLine + dirG * .2, cy);      // [offs] kendi kalesine golde de hücum evresi
                    if (S.refLog && scorer && !owng) S.refLog.push({ goal: 1, t: S.t, mo: asst != null ? la.mo : -9, pen: !!(S.shot && S.shot.pen) });
                    var goalNow = function (vrX) {
                    if (vrX) emit('VAR', vrX.ev);
                    S.teams[atkTm].score++;
                    if (S.shot && S.shot.force) S.forceGoal = null;
                    S.lastAst = null;
                    emit('GOAL', { team: atkTm, p: scorer ? scorer.id : -1, x: goalLine + dirG * .2, y: cy, meta: { own: !!owng, assist: asst, xg: S.shot ? (XG_REP && S.shot.xgr != null ? S.shot.xgr : S.shot.xg) : 0, shot: !!S.shot, dist: S.shot ? S.shot.dist0 : 0, pen: S.shot ? S.shot.pen : false, varOk: !!vr } });
                    S.chain = [0, 0];
                    B.x = goalLine === PW ? PW + .5 : -.5;
                    startDead('kickoff', 1 - atkTm, { x: CX, y: CY }, { afterGoal: true });
                    placeAfterGoal(1 - atkTm);
                    return true;
                    };
                    if (S.userRef && S.refWantGoal && !(S.shot && (S.shot.force || S.shot.pen))) {      /* [port] gol şüpheli mi: karar hakemin */
                        var gkG = gkOf(1 - atkTm), gi = { kind: 'goal', gl: !!(gkG && !gkG.off && Math.abs(gkG.x - goalLine) < 1.6 && S.shot && S.shot.gkTried), team: atkTm, scorer: scorer ? scorer.id : -1, own: !!owng, vr: vr ? { cancel: !!vr.cancel, reason: vr.reason, margin: vr.margin } : null, t: S.t, x: goalLine, y: cy };
                        gi.truth = { call: vr && vr.cancel ? (vr.reason === 'ofsayt' ? 'ofs' : 'faul') : 'gol' };
                        if (S.refWantGoal(gi)) {
                            gi.go = function () { return goalNow(null); };
                            gi.no = function () { S.lastAst = null; S.shot = null; S.pass = null; S.chain = [0, 0]; B.owner = null; B.high = null; B.shotFlag = false; var sp = { x: scorer ? scorer.x : CX, y: scorer ? scorer.y : CY }; var la2 = vr && vr.la; if (la2 && la2.kx != null) sp = { x: la2.kx, y: la2.ky }; startDead('freekick', 1 - atkTm, { x: clamp(sp.x, 1, PW - 1), y: clamp(sp.y, 1, PH - 1) }, { indirect: true }); };
                            S.refAsk = gi; S.refHold = true; return true;
                        }
                    }
                    if (vr && vr.cancel) { varCancel(atkTm, scorer, vr); return true; }
                    return goalNow(vr);
                }
                if (S.shot) { S.shot.off = true; emit('OFF', { team: S.shot.team, p: S.shot.shooter.id, meta: { xg: S.shot.xg } }); }
                var defTm = 1 - atkTm;
                if (B.last && B.last.team === defTm) { S.teams[atkTm].st.corners += 0; startDead('corner', atkTm, { x: goalLine === PW ? PW : 0, y: py < CY ? 0 : PH }); emit('CORNER', { team: atkTm, x: goalLine === PW ? PW : 0, y: py < CY ? 0 : PH }); }
                else { startDead('goalkick', defTm, { x: goalLine === PW ? PW - 5.5 : 5.5, y: cy < CY ? CY - 6 : CY + 6 }); }
                if (S.userRef && S.refAllFn) S._outAsk({ kind: 'out', sub: 'line', atk: atkTm, def: defTm, line: goalLine === PW ? PW : 0, cy0: py < CY ? 0 : PH, gky: cy < CY ? CY - 6 : CY + 6, last: B.last ? B.last.id : -1, x: clamp(B.x, 0, PW), y: clamp(B.y, 0, PH), t: S.t, truth: { call: B.last && B.last.team === defTm ? 'corner' : 'goalkick' } });
                return true;
            }
            if (B.y < 0 || B.y > PH) {
                var lt = B.last ? B.last.team : 0, tk = 1 - lt;
                var sx = clamp(B.x, 1, PW - 1), sy = B.y < 0 ? 0 : PH;
                if (S.shot) { S.shot.off = true; emit('OFF', { team: S.shot.team, p: S.shot.shooter.id, meta: { xg: S.shot.xg } }); }
                emit('THROWIN', { team: tk, x: sx, y: sy, meta: { how: how || (S.pass && S.pass.active ? (S.pass.high ? 'highpass' : 'pass') : (S.shot ? 'shot' : 'loose')), tag: S.pass && S.pass.tag ? S.pass.tag : null } });
                startDead('throw', tk, { x: sx, y: sy });
                if (S.userRef && S.refAllFn) S._outAsk({ kind: 'out', sub: 'throw', tk: tk, last: B.last ? B.last.id : -1, x: sx, y: sy, t: S.t, truth: { call: 'T' + tk } });
                return true;
            }
            return false;
        }
        function ballStep() {
            if (BALL3D) { ballStep3D(); return; }
            if (B.owner) {
                var o = B.owner, opx = B.x, opy = B.y, nbx = clamp(o.x + o.fx * .55, .02, PW - .02), nby = clamp(o.y + o.fy * .55, .02, PH - .02);
                if (nbx < 0 || nbx > PW || nby < 0 || nby > PH) {          // topu taşıyarak çizgiyi geçti: top çıktı
                    B.owner = null; o.cd = .7; B.last = o; S.lastTeam = o.team; B.x = nbx; B.y = nby; B.vx = B.vy = 0; B.high = null; S.pass = null; o.dribble = false; o.think = 0;
                    lineCheck(opx, opy, 0, 'carry'); return;
                }
                B.x = nbx; B.y = nby; B.vx = o.vx; B.vy = o.vy; return;
            }
            var v = hyp(B.vx, B.vy);
            if (B.high) {
                B.x += B.vx * DT; B.y += B.vy * DT;
                if (S.t >= B.high.tLand) resolveAerial(B.high);
                return;
            }
            if (v > .02) { var dv = B.shotFlag ? .10 * v * DT : gdec(v, B.slv || 0) * DT; var nv = Math.max(0, v - dv); B.vx *= nv / v; B.vy *= nv / v; }
            var px = B.x, py = B.y; B.x += B.vx * DT; B.y += B.vy * DT;
            v = hyp(B.vx, B.vy); if (v > S.audit.maxBallV) S.audit.maxBallV = v;
            if (v < 1.2 && B.shotFlag) B.shotFlag = false;
            // şut kontrolleri
            if (S.shot) {
                var sh = S.shot, gk = gkOf(1 - sh.team), gxl = atkGoalX(sh.team), dir = S.teams[sh.team].dir;
                // savunma bloğu
                if (!sh.blockChecked) for (var i = 0; i < 22; i++) { var o = S.players[i]; if (o.team === sh.team || o.role === 'GK' || o.off) continue; if (sh.wall && o.id !== sh.wallHit && sh.wall.indexOf(o.id) >= 0) continue; if (hyp(o.x - B.x, o.y - B.y) < BLOCK_R) { sh.blockChecked = true; if (o.id === sh.wallHit || R() < BLOCK_P) { if (sh.on) S.teams[sh.team].st.sot = Math.max(0, S.teams[sh.team].st.sot - 1); var a = Math.atan2(B.vy, B.vx) + gauss() * 1.0; var sp2 = v * .4; B.vx = Math.cos(a) * sp2; B.vy = Math.sin(a) * sp2; B.shotFlag = false; S.teams[o.team].st.tackles++; emit('BLOCK', { team: o.team, p: o.id, p2: sh.shooter.id, meta: { xg: sh.xg, wall: o.id === sh.wallHit } }); S.shot = null; S.pass = null; S.lastTeam = o.team; B.last = o; return; } break; } }
                // kaleci müdahalesi
                if (S.shot && sh.on && !sh.gkTried) {
                    var dg = hyp(gk.x - B.x, gk.y - B.y), reach = 1.25 + .024 * gk.a.gk;
                    if (dg < reach) {
                        sh.gkTried = true;
                        var ps = sh.pen ? clamp(.22 + .006 * (gk.a.gk - 72), .08, .5) : clamp(SAVE_A - SAVE_XG * sh.xg + .006 * (gk.a.gk - 72) - .010 * Math.max(0, v - 24) + (dg < reach * .55 ? .06 : 0) - (sh.wall ? .05 : 0), .06, .94);
                        if (R() < ps) {
                            S.teams[gk.team].st.saves++;
                            var catchIt = v < 22 && R() < .55;
                            emit('SAVE', { team: gk.team, p: gk.id, p2: sh.shooter.id, meta: { xg: sh.xg, parry: !catchIt, gkDist: dg, reach: reach, speed: v } });
                            if (catchIt) { B.owner = gk; B.vx = B.vy = 0; B.shotFlag = false; S.shot = null; S.pass = null; S.lastTeam = gk.team; B.last = gk; gk.think = .6; gk.dribble = false; return; }
                            var ra, rs = 9 + 6 * R();
                            if (R() < .38) { var sy2 = (B.y < CY ? -1 : 1) * (R() < .15 ? -1 : 1); var glx = dir === 1 ? PW : 0, tyc = CY + sy2 * (GW / 2 + 3 + 3 * R()); ra = Math.atan2(tyc - B.y, glx - B.x); rs = 8 + 5 * R(); }
                            else ra = (dir === 1 ? Math.PI : 0) + gauss() * .8;
                            B.vx = Math.cos(ra) * rs; B.vy = Math.sin(ra) * rs; B.shotFlag = false; S.shot = null; S.pass = null; S.lastTeam = gk.team; B.last = gk; gk.cd = .5; return;
                        }
                    }
                }
            }
            // çizgiler
            if (lineCheck(px, py, v)) return;
            // topu alma
            if (B.high) return;
            var cand = null, cd = 9;
            for (var i2 = 0; i2 < 22; i2++) {
                var q = S.players[i2]; if (q.cd > 0 || q.off) continue;
                var d = hyp(q.x - B.x, q.y - B.y), R0 = v > 16 ? .8 : 1.0; if (q.role === 'GK') R0 += .5;
                if (S.pass && S.pass.active && S.pass.to === q && v < 14) R0 = REC_R;   // pasın asıl alıcısı topa uzanabilir (ayağını uzatır, vücudunu çevirir)
                if (d < R0 && d / R0 + R() * .25 < cd) { cd = d / R0 + R() * .25; cand = q; }
            }
            if (cand) {
                if (v > 14 && R() < Math.min(.55, (v - 14) * .035) * (1.15 - (cand.a.dri + cand.a.pas) / 200)) { var ka = Math.atan2(B.vy, B.vx) + gauss() * .9; B.vx = Math.cos(ka) * v * .5; B.vy = Math.sin(ka) * v * .5; cand.cd = .35; return; }
                gain(cand);
            }
        }
        // [ball] 3B top adımı: uçuş (yerçekimi), sekme, yuvarlanma; şut bloğu/kaleci yüksekliğe göre; top yalnızca alınabilir yükseklikteyken (ayak/göğüs; kaleci kendi ceza sahasında elle) alınır
        /* [knock] vur-koş uygunluğu: kanat ya da hızlı ve iyi top süren; boş alan (hücum yönünde 7 m koni, en yakın rakip >= KN_OPP; KN_END m'ye girince biter); kale çizgisine > 18 m; kenara > 3 m */
        function knockOK(p) {
            var a = p.a, wing = p.role === 'LW' || p.role === 'RW';
            if (!((wing && a.pac >= 70 && a.dri >= 64) || (a.pac >= 80 && a.dri >= 73) || (p.trKn && a.pac >= 66))) return false;
            var dir = S.teams[p.team].dir, gx = atkGoalX(p.team); if (Math.abs(gx - p.x) < 18 || p.y < 3 || p.y > PH - 3) return false;
            for (var i = 0; i < 22; i++) { var q = S.players[i]; if (q.team === p.team || q.off) continue; var rx = q.x - p.x, ry = q.y - p.y; if (hyp(rx, ry) < KN_OPP) return false; var al = rx * dir; if (al > -1 && al < 7 && Math.abs(ry) < 1.8 + .3 * al) return false; }
            return true;
        }
        /* [carry] fiziksel top surme - bkz. PRM TC_PHYS. Top durumu: B.x/B.y/B.vx/B.vy (mutlak) + p.cr: {v hiz, w ileri donus (r*omega), tau son dokunustan sure,
           Tt planlanan dongu, n dokunus sayaci, k tur (0 surme, 1 donus, 2 ilk dokunus, 3 taban/durdurma), tl/tp son/onceki dokunus ani, pend ilk dokunus bekliyor, far erisim disi} */
        function crRoll(st, dt) {      // kayma -> yuvarlanma (PhysX ile ayni: kaymada mu g yavaslatir ve dondurur; yuvarlanmada cim direnci + hava)
            var v = st.v, w = st.w, aS = CR_MUG + CR_RD * 1.667 + CR_KD * v * v, aW = 1.5 * CR_MUG, ts;
            if (v > w + 1e-3) {
                ts = (v - w) / (aS + aW);
                if (ts >= dt) { v -= aS * dt; w += aW * dt; }
                else { v -= aS * ts; v -= (CR_RD + .6 * CR_KD * v * v) * (dt - ts); w = v; }
            } else if (v < w - 1e-3) {      // donusu hizindan fazla: surtunme topu ileri iter, donus azalir
                ts = (w - v) / (CR_MUG + aW);
                if (ts >= dt) { v += CR_MUG * dt; w -= aW * dt; } else { v += CR_MUG * ts; w = v; }
            } else { v -= (CR_RD + .6 * CR_KD * v * v) * dt; w = v; }
            if (v <= 0) { v = 0; w = 0; }
            st.v = v; st.w = Math.max(0, w);
        }
        var CR_TMP = { v: 0, w: 0 };
        function crExit(u, v0, w0, g0, Tt, gT) {      // cikis hizi: oyuncu u ile kosarken top Tt sonra yine g0 acikliginda (ikiye bolme)
            var lo = 0, hi = u + 12, k, n = Math.max(4, Math.round(Tt / .02)), h = Tt / n, i, m, g, vb;
            for (k = 0; k < 16; k++) {
                m = (lo + hi) / 2; g = gT; CR_TMP.v = m; CR_TMP.w = m >= v0 ? Math.max(0, w0 - CR_SPIN * (m - v0)) : Math.min(w0, m);
                for (i = 0; i < n; i++) { vb = CR_TMP.v; crRoll(CR_TMP, h); g += ((vb + CR_TMP.v) / 2 - u) * h; }
                if (g > g0) hi = m; else lo = m;
            }
            return (lo + hi) / 2;
        }
        function crExitA(o, u0, v0, w0, g0, Tt, gT) {      // [surme] crExit + oyuncu hizlanmasi
            var uT = o.maxV * (.82 + .18 * o.stam) * Math.max(.3, o.sf || .6), lo = 0, hi = u0 + 12, k, n = Math.max(4, Math.round(Tt / .02)), h = Tt / n, i, m, g, vb, u;
            for (k = 0; k < 16; k++) {
                m = (lo + hi) / 2; g = gT; u = u0; CR_TMP.v = m; CR_TMP.w = m >= v0 ? Math.max(0, w0 - CR_SPIN * (m - v0)) : Math.min(w0, m);
                for (i = 0; i < n; i++) { vb = CR_TMP.v; crRoll(CR_TMP, h); var ub = u; if (u < uT) u = Math.min(uT, u + o.acc * Math.max(.35, 1 - Math.pow(u / (MV_TAPER * o.maxV), 2)) * h); else u = Math.max(uT, u - MV_BRK * .5 * h); g += ((vb + CR_TMP.v) / 2 - (ub + u) / 2) * h; }
                if (g > g0) hi = m; else lo = m;
            }
            return (lo + hi) / 2;
        }
        function crRoom(x, y, dx, dy) {      // (x,y)'den (dx,dy) yonunde saha cizgisine uzaklik
            var t = 1e9; if (dx > 1e-6) t = Math.min(t, (PW - x) / dx); else if (dx < -1e-6) t = Math.min(t, -x / dx);
            if (dy > 1e-6) t = Math.min(t, (PH - y) / dy); else if (dy < -1e-6) t = Math.min(t, -y / dy); return t;
        }
        function crAlong(x, y, dx, dy) {      // cizgiye dogru olan bileseni atilmis yon (cizgi boyunca; ikisi de kapaliysa iceri)
            var ex = dx, ey = dy; if ((dx > 0 && PW - x < 4) || (dx < 0 && x < 4)) ex = 0; if ((dy > 0 && PH - y < 4) || (dy < 0 && y < 4)) ey = 0;
            var l = hyp(ex, ey); if (l < .2) { ex = CX - x; ey = CY - y; l = hyp(ex, ey) || 1; } return [ex / l, ey / l];
        }
        function crHash(a, b) { var x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; }      // RNG tuketmeyen gurultu (-1..1)
        function crTouch(o, C, kind, dx, dy, osp, fwd) {
            var bv = hyp(B.vx, B.vy), v0 = B.vx * dx + B.vy * dy, cs = bv > .05 ? v0 / bv : 1, w0 = C.w * Math.max(0, cs), err = clamp(1 - o.a.dri / 100, .05, .6), Tt, m;
            var g0 = CR_G0 + CR_G1 * osp;
            if (kind === 2) Tt = clamp(.45 + .6 * ((o.ftGap || .5) - .4), .45, 1.3);
            else { var no = nearestOpp(o).d; Tt = clamp(.35 + .09 * osp, .38, 1.1) * (1 + CR_OPEN * clamp((no - 5) / 7, 0, 1) * clamp((osp - 4) / 2, 0, 1)); if (KNOCK && o.knock && o.dribble) { Tt = Math.min(2, Tt * KN_TT); g0 += .3; } }      // [motor] vur-kos: uzun dokunus
            if (SURME && MG_PH && kind !== 2 && osp >= 1) {      // [surme] N adim sonraki temas evresine plan
                var suE = GTAB[Math.max(0, Math.min(9, Math.round(osp)))], suNo = 99, suI, suQ; for (suI = 0; suI < 22; suI++) { suQ = S.players[suI]; if (suQ.team === o.team || suQ.off) continue; var suX = suQ.x - o.x, suY = suQ.y - o.y; if (suX * dx + suY * dy > -.5) suNo = Math.min(suNo, hyp(suX, suY)); }      // onde (ya da yaninda) en yakin rakip
                var suN = osp < 2 ? 1 : osp < 4.5 ? (suNo < SU_N1 - .5 ? 1 : 2) : (suNo < SU_N1 ? 2 : 3);
                if (KNOCK && o.knock && o.dribble) suN = 4;
                var suPh = o.gph || 0, suT = nextPh(suPh + 1e-6, suE, suN - 1), suR = Math.max(.5, gaitK(osp, 0) * osp), suA = suT % (2 * Math.PI), suL = Math.abs(Math.atan2(Math.sin(suA - suE[1]), Math.cos(suA - suE[1]))) < Math.abs(Math.atan2(Math.sin(suA - suE[3]), Math.cos(suA - suE[3])));
                Tt = Math.max(.2, (suT - suPh) / suR); g0 = (suL ? suE[0] : suE[2]) + SU_GB;
            }
            if (kind !== 2 && osp >= 1) {      // [carry] cizgi: top (oyuncu + g0 + tasma payi) bir sonraki dokunusa dek sahada kalmali (.8 m pay)
                var need = function (T) { return osp * T + g0 + .5 + .8; }, room = crRoom(o.x, o.y, dx, dy);
                if (room < need(Tt)) { var T2 = (room - g0 - 1.3) / osp; if (T2 >= .3) Tt = T2; else { var pd = crAlong(o.x, o.y, dx, dy); dx = pd[0]; dy = pd[1]; Tt = Math.min(Tt, .45); v0 = B.vx * dx + B.vy * dy; cs = bv > .05 ? v0 / bv : 1; w0 = C.w * Math.max(0, cs); } }
            }
            if (kind === 2) {      // ilk dokunus: top alicinin ~.35 sn sonraki adiminin onune (uzaktan uzanarak alinsa da govdeye dogru gelir)
                var axp = o.x + o.vx * .35 + dx * g0, ayp = o.y + o.vy * .35 + dy * g0, qx = axp - B.x, qy = ayp - B.y, ql = hyp(qx, qy);
                if (ql > .05) { dx = qx / ql; dy = qy / ql; } v0 = B.vx * dx + B.vy * dy; cs = bv > .05 ? v0 / bv : 1; w0 = C.w * Math.max(0, cs);
                m = clamp(ql / .35 + .6, 0, osp + 6); if (osp < 1) m = Math.min(m, Math.sqrt(2 * 1.5 * ql));
                Tt = Math.max(.35, Tt * .6);
            }
            else if (osp < 1) m = Math.sqrt(2 * 1.5 * Math.max(0, .4 - fwd));      // duran oyuncu: top ayagin onunde durur
            else m = SURME && MG_PH ? crExitA(o, osp, Math.max(0, v0), w0, g0, Tt, fwd) : crExit(osp, Math.max(0, v0), w0, g0, Tt, fwd);
            m *= 1 + .08 * err * crHash(o.id + .37, C.n + S.t);
            var an = .06 * err * crHash(o.id + 1.7, C.n * 3.1 + S.t), ca = Math.cos(an), sa = Math.sin(an);
            B.vx = (dx * ca - dy * sa) * m; B.vy = (dx * sa + dy * ca) * m;
            C.v = m; C.w = m >= v0 ? Math.max(0, w0 - CR_SPIN * (m - v0)) : Math.min(w0, m);
            C.tau = 0; C.Tt = Tt; C.n++; C.k = kind; C.tp = C.tl; C.tl = S.t; C.pend = 0; o.tPh = 0;
        }
        function carryPhys(o) {
            var C = o.cr, opx = B.x, opy = B.y, osp = hyp(o.vx, o.vy);
            if (C && S.t - C.ls > DT * 1.5) C = o.cr = null;      // sahiplik kesildi (gain disi yoldan yeniden alindi): ilk dokunus yeniden
            if (!C) C = o.cr = { v: hyp(B.vx, B.vy), w: 0, tau: 0, Tt: .6, n: 0, k: 2, tl: S.t, tp: S.t, pend: 1, far: 1, atx: NaN, aty: NaN, ls: S.t };
            // dokunus yonu: oyuncunun hedefi (yapay zeka), yoksa hareket / bakis yonu; kosarken hiz yonunden en cok 60 derece
            var mx = osp > .6 ? o.vx / osp : o.fx, my = osp > .6 ? o.vy / osp : o.fy, dx = mx, dy = my;
            if (C.atx === C.atx) { var ax = C.atx - o.x, ay = C.aty - o.y, al = hyp(ax, ay); if (al > 1) { dx = ax / al; dy = ay / al; } }
            if (osp > 3 && dx * mx + dy * my < .5) { var sg = (mx * dy - my * dx) >= 0 ? 1 : -1, c6 = .5, s6 = .866 * sg; dx = mx * c6 - my * s6; dy = mx * s6 + my * c6; }
            // dikey: havadan alinan top duser, seker
            if (B.z > 0 || B.vz > 0) { B.vz -= BL_G * DT; B.z += B.vz * DT; if (B.z <= 0) { B.z = 0; B.vz = -B.vz > BL_BMIN ? -B.vz * BL_E : 0; } }
            // yatay: serbest top (ilk dokunus beklenirken gelen top motorun serbest top yavaslamasiyla)
            var v = hyp(B.vx, B.vy);
            if (C.pend) { if (v > .02) { var nv = Math.max(0, v - rdec(v) * DT); B.vx *= nv / v; B.vy *= nv / v; } else { B.vx = B.vy = 0; } C.v = hyp(B.vx, B.vy); C.w = C.v; }
            else if (v > 1e-4) { var ux = B.vx / v, uy = B.vy / v; C.v = v; crRoll(C, DT); B.vx = ux * C.v; B.vy = uy * C.v; }
            var nbx = B.x + B.vx * DT, nby = B.y + B.vy * DT;
            var cOut = CARRYOUT ? (nby < 0 || nby > PH || ((nbx < 0 || nbx > PW) && (nby <= GY0 || nby >= GY1))) : (nbx < 0 || nbx > PW || nby < 0 || nby > PH);
            if (cOut) {      // topu tasirken cizgiyi gecti: top cikti
                B.owner = null; o.cd = .7; B.last = o; S.lastTeam = o.team; B.x = nbx; B.y = nby; B.vx = B.vy = 0; B.high = null; S.pass = null; o.dribble = false; o.think = 0; o.cr = null;
                lineCheck(opx, opy, 0, 'carry', 0); return;
            }
            B.x = clamp(nbx, .02, PW - .02); B.y = clamp(nby, .02, PH - .02);
            var rx = B.x - o.x, ry = B.y - o.y, dist = hyp(rx, ry), fwd = rx * dx + ry * dy, lat = -rx * dy + ry * dx;
            C.tau += DT;
            var reach = fwd > -.12 && fwd < CR_REACH + .05 * osp && Math.abs(lat) < .55 && B.z < .5;
            if (C.pend) {      // ilk dokunus: top ayaga ulasinca (ya da yanindan geciyorsa) yonlendirilir
                var rv = (B.vx - o.vx) * rx + (B.vy - o.vy) * ry;      // > 0: top oyuncudan uzaklasiyor (en yakin gecis geride kaldi)
                if (dist < KR_FT || (reach && fwd < .75 && dist < KR_FT + .15) || rv >= 0 || C.tau > 1) crTouch(o, C, 2, dx, dy, osp, fwd);      // [motor] ilk dokunus: top ayaga gelince ya da en yakin geciste (kopru karsilama hareketini ayni kuralla zamanlar)
            } else if (osp < 1) {      // yavas / duran: top tabanla ayagin onunde tutulur (.4 m, en cok 1.5 m/sn ile)
                var tx = o.x + o.fx * .4, ty = o.y + o.fy * .4, ex = tx - B.x, ey = ty - B.y, el = hyp(ex, ey), sm = Math.min(el, 1.5 * DT), kx = el > 1e-4 ? ex / el * sm : 0, ky = el > 1e-4 ? ey / el * sm : 0;
                if (dist < .9) { B.x += kx; B.y += ky; B.vx = o.vx + kx / DT; B.vy = o.vy + ky / DT; C.v = hyp(B.vx, B.vy); C.w = C.v; if (C.k !== 3) { C.k = 3; C.tp = C.tl; C.tl = S.t; C.n++; } C.tau = 0; C.Tt = .6; }      // [motor] uzaktaki top cekilmez: oyuncu topa yurur (carrySteer)
            } else if (reach) {
                var bvl = hyp(B.vx, B.vy), turn = bvl > .5 && (B.vx * dx + B.vy * dy) / bvl < .866;
                var bxs = B.x + B.vx * .6, bys = B.y + B.vy * .6, line = (bxs < .3 || bxs > PW - .3 || bys < .3 || bys > PH - .3) && C.tau > .08, slow = (B.vx * dx + B.vy * dy) > osp + 1.6 && C.tau > .15 && (!SURME || fwd > CR_G0 + 1.2 + .1 * osp);
                if (line) { var pa = crAlong(B.x, B.y, dx, dy); dx = pa[0]; dy = pa[1]; }
                var gE = GTAB[Math.max(0, Math.min(9, Math.round(osp)))], gCross = !MG_PH || nextPh(o.pgph || 0, gE, 0) <= (o.gph || 0) + 1e-9;      // [motor] salinan ayak temas evresinde mi
                var want = C.tau >= C.Tt - (SURME ? .06 : 0) || slow || (fwd < .22 && C.tau > .15) || (turn && C.tau > .15);
                if (line || (C.k === 3 && C.tau > .08) || (want && gCross) || C.tau >= C.Tt + .25) crTouch(o, C, turn ? 1 : 0, dx, dy, osp, fwd);
            }
            if (!C.pend && dist > CR_LOSE) {      // top kontrolden cikti (agir dokunus ve oyuncu durdu / dondu): serbest top
                B.owner = null; o.cd = .25; B.last = o; S.lastTeam = o.team; o.dribble = false; o.think = 0; o.cr = null; S.dbg.crLost = (S.dbg.crLost || 0) + 1; return;
            }
            // oyun kurallari icin sanal aciklik (eski bicim, dokunus evresinden)
            o.tPh = clamp(C.tau / C.Tt, 0, 1);
            var gmx = TC_GMIN + TC_GV * osp * (1.25 - o.a.dri / 200), gp = osp < 1 ? .45 : TC_GMIN + (gmx - TC_GMIN) * Math.sin(Math.PI * o.tPh);
            if (o.ftGap > 0) { gp = Math.max(gp, o.ftGap); o.ftGap -= DT * 2.5; }
            C.ls = S.t; o.gapNow = gp; o.pgap = dist; C.far = (C.pend || fwd > 1.15 || fwd < -.15 || Math.abs(lat) > .6) ? 1 : 0;
        }
        function gbx() { var o = B.owner; return TC_PHYS && o && o.role !== 'GK' && o.cr ? o.x + o.fx * (o.gapNow || .55) : B.x; }
        function gby() { var o = B.owner; return TC_PHYS && o && o.role !== 'GK' && o.cr ? o.y + o.fy * (o.gapNow || .55) : B.y; }
        function carrySteer(p) {      // [carry] top erisim disindaysa (ilk dokunus bekleniyor ya da top acildi) oyuncu topun gidecegi yere kosar; yapay zeka hedefi dokunus yonu olarak saklanir
            var C = p.cr; if (!C) return;
            C.atx = p.tx; C.aty = p.ty;
            var rx = B.x - p.x, ry = B.y - p.y, d = hyp(rx, ry); if (d < .3) return;
            var tx = p.tx - p.x, ty = p.ty - p.y, tl = hyp(tx, ty);
            var fwd = tl > .5 ? (rx * tx + ry * ty) / tl : d, lat = tl > .5 ? Math.abs(-rx * ty + ry * tx) / tl : 0;
            var w = C.pend ? clamp((d - .45) / .5, 0, 1) : clamp(Math.max((lat - .35) / .35, (fwd - 1.3) / .6, fwd < -.05 ? 1 : 0), 0, 1);
            if (w <= 0) return;
            var lead = clamp(d / 6, .1, .45), bx = B.x + B.vx * lead, by = B.y + B.vy * lead;
            p.tx = clamp(p.tx + (bx - p.tx) * w, 1, PW - 1); p.ty = clamp(p.ty + (by - p.ty) * w, 1, PH - 1);
            if (w > .5) p.sf = Math.max(p.sf, .8);
        }
        function ballStep3D() {
            ballPending = false;
            if (B.owner && TC_PHYS && B.owner.role !== 'GK') { carryPhys(B.owner); return; }      // [carry]
            if (B.owner) {
                var o = B.owner, opx = B.x, opy = B.y, gap = .55;
                if (TOUCH && o.role !== 'GK') {      // [touch] dokunuş döngüsü: top açılır, oyuncu yetişir
                    var osp = hyp(o.vx, o.vy), Tt = clamp(.35 + .09 * osp, .38, 1.1), gmx = TC_GMIN + TC_GV * osp * (1.25 - o.a.dri / 200);
                    if (o.knC) { if (o.knock || !KN_CUT) Tt = Math.min(2.2, Tt * KN_TT); gmx += KN_GAP; }      // [knock] vur-koş döngüsü: top daha önde, dokunuş seyrek
                    o.tTt = Tt; o.tPh = (o.tPh || 0) + DT / Tt;
                    if (o.tPh >= 1) { o.tPh -= 1; o.knC = !!(KNOCK && o.knock && o.dribble && osp > 1.2); if (o.knC) S.dbg.knc = (S.dbg.knc || 0) + 1; }      // [knock] döngü başında kilitlenir (aralık o an TC_GMIN: top sıçramaz)
                    gap = osp < 1 ? .45 : TC_GMIN + (gmx - TC_GMIN) * Math.sin(Math.PI * o.tPh);
                    if (o.ftGap > 0) { gap = Math.max(gap, o.ftGap); o.ftGap -= DT * 2.5; }
                }
                o.gapNow = gap;
                var ofx = o.fx * gap, ofy = o.fy * gap, rvx = 0, rvy = 0;
                if (TC_RCV && o.rbOn && o.role !== 'GK') {      // [touch] alış: top alıcıya göre konumundan bakış yönündeki yerine en çok TC_SNAPV m/sn ile gelir; gövdenin arkasındaysa önce yanına dolanır
                    var tgx = ofx, tgy = ofy, bh0 = o.rbx * o.fx + o.rby * o.fy < -.1;
                    if (bh0) { var sd0 = (o.rby * o.fx - o.rbx * o.fy) >= 0 ? 1 : -1; tgx = -o.fy * sd0 * .5; tgy = o.fx * sd0 * .5; }
                    var ex = tgx - o.rbx, ey = tgy - o.rby, el = hyp(ex, ey), mx = TC_SNAPV * DT;
                    if (el > mx) { rvx = ex / el * mx; rvy = ey / el * mx; } else { rvx = ex; rvy = ey; if (!bh0) o.rbOn = false; }
                    o.rbx += rvx; o.rby += rvy; ofx = o.rbx; ofy = o.rby; o.gapNow = hyp(ofx, ofy);
                }
                var rx = o.x + ofx, ry = o.y + ofy, nbx = clamp(rx, .02, PW - .02), nby = clamp(ry, .02, PH - .02);
                if (TC_RCV && B.z > 0 && o.role !== 'GK') { B.vz -= BL_G * DT; B.z += B.vz * DT; if (B.z <= 0) { B.z = 0; B.vz = 0; } }      // [touch] havadan alınan top ayağa düşer
                else { B.z = 0; B.vz = 0; }
                var cOut = CARRYOUT ? o.role !== 'GK' && (ry < 0 || ry > PH || ((rx < 0 || rx > PW) && (ry <= GY0 || ry >= GY1))) : (nbx < 0 || nbx > PW || nby < 0 || nby > PH);      // [dead] CARRYOUT: kırpılmamış konumla (eski denetim kırpmadan sonraydı: hiç tetiklenmezdi)
                if (cOut) {
                    B.owner = null; o.cd = .7; B.last = o; S.lastTeam = o.team; B.x = CARRYOUT ? rx : nbx; B.y = CARRYOUT ? ry : nby; B.vx = B.vy = 0; B.high = null; S.pass = null; o.dribble = false; o.think = 0;
                    lineCheck(opx, opy, 0, 'carry', 0); return;
                }
                B.x = nbx; B.y = nby; B.vx = rvx ? o.vx + rvx / DT : o.vx; B.vy = rvy ? o.vy + rvy / DT : o.vy; return;
            }
            var px = B.x, py = B.y, pz = B.z, v = hyp(B.vx, B.vy);
            if (B.high) {
                if (BL_AERO) hiStep(B); else { B.x += B.vx * DT; B.y += B.vy * DT; B.vz -= BL_G * DT; B.z += B.vz * DT; }
                if (AICAL && AC_XB > 0 && S.pass && S.pass.active && !S.pass.blk && B.z < 1.9 && B.vz > 0 && !/^(CORNER|GOALKICK|KICKOFF|FREEKICK|THROW)$/.test(S.pass.tag || '') && highBlock()) return;      // [aical] yükselen top yanından geçtiği rakibe çarpar
                if (BL_HFIX) {      // [ball] uçuşta çizgi denetimi (havada çizgiyi geçen top oyun dışı); çözüm sayılan adımda: top tam iniş noktasında, BL_HZ yükseklikte
                    if (lineCheck(px, py, v, 'highpass', pz)) { B.high = null; return; }
                    if (B.high.n != null ? --B.high.n <= 0 : S.t >= B.high.tLand) resolveAerial(B.high);
                } else if (S.t >= B.high.tLand) resolveAerial(B.high);
                if (B.z <= 0 && B.high) { B.z = 0; B.vz = 0; B.high = null; B.slv = BL_SLIDE ? hyp(B.vx, B.vy) * BL_R57 : 0; }
                return;
            }
            if (B.z > 0 || B.vz > 0) {      // havada: sekme, kaleci çelmesi, şut
                B.vz -= BL_G * DT; B.z += B.vz * DT;
                if (B.shotFlag && v > .02) { var nv0 = Math.max(0, v - (AV_DRAG ? shDecA(v, true) * DT : .10 * v * DT)); B.vx *= nv0 / v; B.vy *= nv0 / v; }      // [av] AV_DRAG: v² hava direnci
                if (B.z <= 0) { B.z = 0; if (-B.vz > BL_BMIN) { B.vz = -B.vz * BL_E; B.vx *= BL_HRET; B.vy *= BL_HRET; } else { B.vz = 0; B.slv = BL_SLIDE && !B.shotFlag ? hyp(B.vx, B.vy) * BL_R57 : 0; } }
            } else if (v > .02) { var dv = B.shotFlag ? (AV_DRAG ? shDecA(v, false) * DT : .10 * v * DT) : gdec(v, B.slv || 0) * DT; var nv = Math.max(0, v - dv); B.vx *= nv / v; B.vy *= nv / v; }
            else if (BL_EDGE) { B.vx = 0; B.vy = 0; }      // [ball] çok yavaş top durur (sonsuza dek sürünmez)
            if (CURL && B.sps && B.shotFlag) cuRot(B, B.z > 0 ? 1 : CU_GND);      // [v137] kıvrılan şut (cuShotAim ile aynı sıra)
            B.x += B.vx * DT; B.y += B.vy * DT;
            v = hyp(B.vx, B.vy); if (v > S.audit.maxBallV) S.audit.maxBallV = v;
            if (v < 1.2 && B.shotFlag && B.z <= 0) B.shotFlag = false;
            if (S.shot) {
                var sh = S.shot, gk = gkOf(1 - sh.team), dir = S.teams[sh.team].dir;
                if (sh.force) { }
                else if (AICAL && !sh.wall) { if (shotBlock(sh, px, py, pz)) return; }      // [aical] fiziksel şut bloğu
                else if (!sh.blockChecked && B.z < 1.9) for (var i = 0; i < 22; i++) { var o2 = S.players[i]; if (o2.team === sh.team || o2.role === 'GK' || o2.off) continue; if (sh.wall && o2.id !== sh.wallHit && sh.wall.indexOf(o2.id) >= 0) continue; if (hyp(o2.x - B.x, o2.y - B.y) < BLOCK_R) { sh.blockChecked = true; if (o2.id === sh.wallHit || R() < BLOCK_P) { if (sh.on) S.teams[sh.team].st.sot = Math.max(0, S.teams[sh.team].st.sot - 1); var a = Math.atan2(B.vy, B.vx) + gauss() * 1.0; var sp2 = v * .4; B.vx = Math.cos(a) * sp2; B.vy = Math.sin(a) * sp2; B.vz = Math.max(0, B.vz) * .3 + 3 * R(); B.shotFlag = false; S.teams[o2.team].st.tackles++; emit('BLOCK', { team: o2.team, p: o2.id, p2: sh.shooter.id, meta: { xg: sh.xg, wall: o2.id === sh.wallHit } }); S.shot = null; S.pass = null; S.lastTeam = o2.team; B.last = o2; return; } break; } }
                if (GKP && S.shot && sh.on && !sh.gkTried && !sh.pen && !sh.force) {
                    var crossed = (B.x - gk.x) * dir >= 0 && (px - gk.x) * dir < 0;
                    var el = S.t - (gk.saveT != null ? gk.saveT : S.t) - gkReact(gk) - (sh.hd ? KF_GKR : 0), ext = clamp(el * GK_DIVE, 0, GK_DMAX);      /* [kafa] */
                    var nearB = !crossed && hyp(hyp(gk.x - B.x, gk.y - B.y), B.z > 1.9 ? B.z - 1.9 : 0) < GK_R0 + ext;      // top kalecinin düzlemini kesmeden erişimine girdi (dar açı, öne çıkmış kaleci)
                    if (crossed || nearB) {
                        sh.gkTried = true;
                        var tc = crossed ? (gk.x - px) / ((B.x - px) || 1e-6) : 1, yb = py + (B.y - py) * tc, zb = pz + (B.z - pz) * tc;
                        var reachP = GK_R0 + ext + .006 * (gk.a.gk - 75), dyb = crossed ? yb - gk.y : hyp(gk.x - B.x, gk.y - B.y) * (B.y >= gk.y ? 1 : -1), dzb = zb > 1.9 ? zb - 1.9 : 0, distP = hyp(dyb, dzb);
                        if (GK_CPA && nearB) {      // [gk] karar topun kaleciye en yakın geçeceği noktada (doğrusal yol, en çok .3 sn): gerçek ıska mesafesi ve o ana kadarki plonjon uzanması
                            var vq2 = v * v || 1e-6, tq = clamp(((gk.x - B.x) * B.vx + (gk.y - B.y) * B.vy) / vq2, 0, .3), xq = B.x + B.vx * tq, yq = B.y + B.vy * tq;
                            zb = Math.max(0, B.z + B.vz * tq - BL_G * tq * tq / 2); dyb = hyp(gk.x - xq, gk.y - yq) * (yq >= gk.y ? 1 : -1); dzb = zb > 1.9 ? zb - 1.9 : 0; distP = hyp(dyb, dzb);
                            reachP = GK_R0 + clamp((el + tq) * GK_DIVE, 0, GK_DMAX) + .006 * (gk.a.gk - 75);
                        }
                        if (S.dbg.gkLog) S.dbg.gkLog.push({ el: el, reach: reachP, dist: distP, v: v, gx: Math.abs(gk.x - atkGoalX(sh.team)), sd: sh.dist0, gy: gk.y - CY, yb: yb - CY });
                        if (distP < (KF_GKB && sh.hd && el + (GK_CPA && nearB ? tq : 0) < 0 ? KF_GKB : reachP)) {      /* [kafa] tepkiden once yalniz govde */
                            var psP = clamp(GK_S0 + GK_S1 * (1 - distP / reachP) + .008 * (gk.a.gk - 75) - .012 * Math.max(0, v - (AV_SHOT ? PRM.AV_GKV : 24)) - (sh.hd ? KF_GKS : 0), .05, .97); if (sh.ng) psP = 1;      /* [kafa] */
                            if (R() < psP) {
                                S.teams[gk.team].st.saves++;
                                var catchP = v < 22 && zb < 2.2 && distP < reachP * .6 && R() < clamp(.7 + .006 * ((gk.a.gk_han || 70) - 70), .5, .85);      // [v131] elle oyun
                                var frb = S.forceRebound != null && sh.team === S.forceGoal ? S.players[S.forceRebound] : null; if (frb && (frb.off || frb.team !== sh.team)) frb = null; if (frb) catchP = false;      // [v186] zorla gol kurgusu: kaleci çeler, top golcünün önüne
                                emit('SAVE', { team: gk.team, p: gk.id, p2: sh.shooter.id, meta: { xg: sh.xg, parry: !catchP, gkDist: distP, reach: reachP, speed: v, z: zb } });
                                if (catchP) { B.owner = gk; B.vx = B.vy = 0; B.z = 0; B.vz = 0; B.shotFlag = false; S.shot = null; S.pass = null; S.lastTeam = gk.team; B.last = gk; gk.think = .6; gk.dribble = false; return; }
                                // çelme: top kaleciden seker - çoğu kenara/dışarı (korner), bir kısmı öne (dönen top)
                                var outP = R() < .55, ra2, rs2 = 6 + 7 * R(); if (AV_OUT && !outP && RA() < avp('AV_GKO', .35)) outP = true; if (frb) outP = false;      // [av] AV_OUT: kaleci çoğunlukla kornere çeler
                                if (outP) { var sgn = dyb >= 0 ? 1 : -1, glx2 = dir === 1 ? PW : 0, tyo = CY + sgn * (GW / 2 + 1 + 4 * R()); ra2 = Math.atan2(tyo - yb, glx2 - gk.x); }      // kenara çelme: direğin dışına (korner)
                                else ra2 = Math.atan2(gauss() * .9, -dir);
                                if (frb) { var fbx = frb.x + frb.vx * .35, fby = frb.y + frb.vy * .35; ra2 = Math.atan2(fby - (crossed ? yb : B.y), fbx - gk.x) + gauss() * .06; rs2 = clamp(hyp(fbx - gk.x, fby - (crossed ? yb : B.y)) * 1.6, 4, 9); S.forceQuick = frb.id; S.forceRebound = null; }      // [v186] çelme golcünün koşu yoluna
                                if (!GK_CPA) { B.x = gk.x - dir * .3; B.y = clamp(yb, .5, PH - .5); B.z = Math.max(.2, zb); }
                                else if (crossed) { B.x = px + (B.x - px) * tc; B.y = clamp(yb, .5, PH - .5); B.z = Math.max(.2, zb); }      // [gk] çelme temas noktasında (kaleci düzlemi)
                                else B.z = Math.max(.2, B.z);      // [gk] erişime girdiği yerde
                                B.vx = Math.cos(ra2) * rs2; B.vy = Math.sin(ra2) * rs2; B.vz = outP && zb > 1.2 ? 4 + 2 * R() : 1 + 3 * R(); B.shotFlag = false; S.shot = null; S.pass = null; S.lastTeam = gk.team; B.last = gk; gk.cd = .5; return;
                            }
                        }
                    }
                }
                if (S.shot && sh.on && !sh.gkTried && (!GKP || sh.pen) && !sh.force) {
                    var dg = hyp(gk.x - B.x, gk.y - B.y), reach = 1.25 + .024 * gk.a.gk, dg3 = hyp(dg, Math.max(0, B.z - 1.7) * .9);
                    if (dg3 < reach) {
                        sh.gkTried = true;
                        var ps = sh.pen ? (PEN_FIX ? clamp(PEN_S0 + .006 * (gk.a.gk - 72) + PEN_S1 * (1 - dg3 / reach), .05, .6) : clamp(.22 + .006 * (gk.a.gk - 72), .08, .5)) : clamp(SAVE_A - SAVE_XG * sh.xg + .006 * (gk.a.gk - 72) - .010 * Math.max(0, v - 24) + (dg3 < reach * .55 ? .06 : 0) - (sh.wall ? .05 : 0), .06, .94);
                        if (R() < ps) {
                            S.teams[gk.team].st.saves++;
                            var catchIt = v < 22 && B.z < 2.2 && R() < .55;
                            emit('SAVE', { team: gk.team, p: gk.id, p2: sh.shooter.id, meta: { xg: sh.xg, parry: !catchIt, gkDist: dg3, reach: reach, speed: v, z: B.z } });
                            if (catchIt) { B.owner = gk; B.vx = B.vy = 0; B.z = 0; B.vz = 0; B.shotFlag = false; S.shot = null; S.pass = null; S.lastTeam = gk.team; B.last = gk; gk.think = .6; gk.dribble = false; return; }
                            var ra, rs = 9 + 6 * R();
                            if (R() < .38) { var sy2 = (B.y < CY ? -1 : 1) * (R() < .15 ? -1 : 1); var glx = dir === 1 ? PW : 0, tyc = CY + sy2 * (GW / 2 + 3 + 3 * R()); ra = Math.atan2(tyc - B.y, glx - B.x); rs = 8 + 5 * R(); }
                            else ra = (dir === 1 ? Math.PI : 0) + gauss() * .8;
                            B.vx = Math.cos(ra) * rs; B.vy = Math.sin(ra) * rs; B.vz = 1 + 4 * R(); B.z = Math.max(.3, B.z); B.shotFlag = false; S.shot = null; S.pass = null; S.lastTeam = gk.team; B.last = gk; gk.cd = .5; return;
                        }
                    }
                }
            }
            if (POSTN && postStep(px, py, pz) === 1) return;      // [ball] direğe çarptı, top sahada
            if (lineCheck(px, py, v, undefined, pz)) return;
            if (S.shot && S.shot.force) return;
            var cand = null, cd = 9;
            for (var i2 = 0; i2 < 22; i2++) {
                var q = S.players[i2]; if (q.cd > 0 || q.off) continue;
                if (AV_OUT && B.avo != null && S.t - B.avo < avp('AV_OCD', .45)) continue;      // [av] AV_OUT: seken top
                var gkHands = q.role === 'GK' && B.z < 2.5 && inBox(q.x, q.y, 1 - q.team);
                if (q.role === 'GK' && KF_GKB && S.shot && S.shot.hd && S.shot.team !== q.team && S.t - S.shot.t0 < gkReact(q) + KF_GKR && hyp(q.x - B.x, q.y - B.y) > KF_GKB) continue;      /* [kafa] burun dibindeki kafa: tepki yok */
                if (B.z > BL_CTRLZ && !gkHands) continue;      // top alınamayacak yükseklikte
                var d = hyp(q.x - B.x, q.y - B.y), R0 = v > 16 ? .8 : 1.0; if (q.role === 'GK') R0 += .5;
                if (S.pass && S.pass.active && S.pass.to === q && v < 14) R0 = REC_R;
                if (d < R0 && d / R0 + R() * .25 < cd) { cd = d / R0 + R() * .25; cand = q; }
            }
            if (cand) {
                if (AICAL && S.shot && S.shot.team !== cand.team && cand.role !== 'GK' && v > 8 && R() >= clamp(.65 - .045 * (v - 8), 0, .65)) {      // [aical] hızlı şut: kontrol edemedi
                    var str0 = S.shot.tr || (S.shot.tr = {}); if (str0[cand.id]) return;      // yolda bloklayamadığı top yanından geçer
                    str0[cand.id] = 1; var bvv = hyp(B.vx, B.vy) || 1; blockShot(S.shot, cand, Math.abs((cand.x - B.x) * B.vy / bvv - (cand.y - B.y) * B.vx / bvv) < .33); return;
                }
                if (AICAL && S.pass && S.pass.active && S.pass.team !== cand.team && cand.role !== 'GK' && v > 3) { intContest(cand, v); return; }      // [aical] pasın yolundaki rakip: kesme çekişmesi
                if (TOUCH && cand.role !== 'GK') {      // [touch] ilk dokunuş: kontrol kaçarsa top sekip açılır (alıcı kısa süre ona dokunamaz; yakındaki herkes kapabilir)
                    var pdn = nearestOpp(cand).d, qk = cand.a.dri * .5 + cand.a.pas * .3 + cand.a.bal * .2;
                    var ph = clamp((TC_HEAVY + TC_HV * Math.max(0, v - 8) + (pdn < 2 ? .05 : pdn < 4 ? .015 : 0) + (B.z > .35 ? .04 : 0)) * K(qk, .5), 0, .6);
                    if (R() < ph) {
                        if (TC_OFF && badTouch(cand)) return;      // [touch] kötü dokunuş da dokunuş: ofsayt çalındı
                        var ka2 = Math.atan2(B.vy, B.vx) + gauss() * .7, ks = clamp(v * .35 + 1.5, 2, 7);
                        B.vx = Math.cos(ka2) * ks; B.vy = Math.sin(ka2) * ks; avOut(B.x, B.y, cand.team, .6); B.vz = B.z > .3 ? 1.5 * R() : 0; B.last = cand; S.lastTeam = cand.team; cand.cd = .3; S.dbg.heavy = (S.dbg.heavy || 0) + 1; if (AV_TRIG5) cand.badT = S.t; return;
                    }
                    gain(cand); cand.ftGap = clamp(.3 + v * .06 * K(qk, .4), .4, 1.6); cand.tPh = 0;
                    return;
                }
                if (v > 14 && R() < Math.min(.55, (v - 14) * .035) * (1.15 - (cand.a.dri + cand.a.pas) / 200)) { var ka = Math.atan2(B.vy, B.vx) + gauss() * .9; B.vx = Math.cos(ka) * v * .5; B.vy = Math.sin(ka) * v * .5; B.vz = 1.5 * R(); cand.cd = .35; return; }
                gain(cand);
            }
        }
        // [aical] yükselen yüksek top (orta, uzun pas, uzaklaştırma) BLOCK_R içinden geçtiği rakibe AC_XB olasılıkla çarpar: top yavaşlayıp sapar (çoğu kornere / taça), pas biter
        function highBlock() {
            var ps = S.pass, i, o;
            for (i = 0; i < 22; i++) {
                o = S.players[i]; if (o.team === ps.team || o.role === 'GK' || o.off || o.cd > 0) continue;
                if (hyp(o.x - B.x, o.y - B.y) >= BLOCK_R) continue;
                ps.blk = true; if (R() >= AC_XB) return false;
                var bv = hyp(B.vx, B.vy) || 1; glance(o, Math.abs((o.x - B.x) * B.vy / bv - (o.y - B.y) * B.vx / bv), .55, .6, 1.0); B.vz = 2.5 + 3.5 * R(); B.high = null; B.shotFlag = false;      // bacaktan seken top havalanır
                if (AV_OUT && Math.abs(B.x - ownGoalX(o.team)) < 30 && RA() < avp('AV_XBC', .55)) { var gxh = ownGoalX(o.team), vh2 = hyp(B.vx, B.vy), ah2 = Math.atan2((B.y < CY ? -1 : 1) * (2 + 6 * RA()), gxh - B.x); B.vx = Math.cos(ah2) * vh2; B.vy = Math.sin(ah2) * vh2; }      // [av] AV_OUT: bloklanan orta çoğunlukla kale çizgisine (korner)
                emit('BLOCK', { team: o.team, p: o.id, p2: ps.from ? ps.from.id : -1, meta: { cross: true, kind: ps.tag === 'CLEAR' ? 'clear' : ps.from && crossZone(ps.from) ? 'cross' : 'long' } });
                S.pass = null; S.shot = null; S.lastTeam = o.team; B.last = o; o.cd = .3;
                return true;
            }
            return false;
        }
        // [aical] sekme: top oyuncunun gövdesinden / bacağından yansır. Normal: oyuncu topa dönükse bakış yönü, değilse topun geliş yönünün tersi (± sp rad bacak açısı);
        // gövdeye dik bileşen e katsayısıyla tersine döner, teğet bileşen kt katı korunur
        function deflect(o, e, kt, sp) {
            var v = hyp(B.vx, B.vy) || 1, ux = B.vx / v, uy = B.vy / v, nx = o.fx, ny = o.fy;
            if (nx * ux + ny * uy > -.2) { nx = -ux; ny = -uy; }
            var na = Math.atan2(ny, nx) + gauss() * sp; nx = Math.cos(na); ny = Math.sin(na);
            var vn = B.vx * nx + B.vy * ny;
            if (vn < 0) { var tx = B.vx - vn * nx, ty = B.vy - vn * ny; B.vx = tx * kt - e * vn * nx; B.vy = ty * kt - e * vn * ny; }
            else { B.vx *= kt; B.vy *= kt; }
        }
        // [aical] pas kesme çekişmesi: rakip, pasın yoluna girdi. Dönen: 'win' (temiz aldı) · 'miss' (ayağı yetişmedi, top geçti) · 'defl' (dokundu ama alamadı: top seker, pas biter)
        // [aical] sekme: oyuncu topun yolundan perp m uzaktaydı. Gövdeye çarpan top (perp < .3) deflect ile yansır; ayaktan sıyıran top savunmacıdan uzağa .3-1.2 rad sapar, hızının %50-75'ini korur
        function glance(o, perp, e, kt, sp, km) {
            if (perp < .3) { deflect(o, e, kt, sp); return; }
            var v = hyp(B.vx, B.vy) || 1, ux = B.vx / v, uy = B.vy / v, side = (ux * (o.y - B.y) - uy * (o.x - B.x)) > 0 ? -1 : 1;
            var a = Math.atan2(uy, ux) + side * (.3 + .9 * R()), sp2 = v * (km != null ? km : .5 + .25 * R());
            B.vx = Math.cos(a) * sp2; B.vy = Math.sin(a) * sp2;
        }
        // [aical] şut bloğu: top bu adımda (px,py,pz) → (B.x,B.y,B.z) yolunda savunmacının yanından geçti mi; her savunmacı şut başına bir kez denenir. Dönen: blok oldu mu
        function shotBlock(sh, px, py, pz) {
            var sx = B.x - px, sy = B.y - py, l2 = sx * sx + sy * sy, tr = sh.tr || (sh.tr = {}), i, o;
            if (l2 < 1e-6) return false;
            for (i = 0; i < 22; i++) {
                o = S.players[i]; if (o.team === sh.team || o.role === 'GK' || o.off || tr[o.id]) continue; if (KF_BLK && sh.hd && hyp(o.x - sh.ox, o.y - sh.oy) < KF_BLK) continue;      /* [kafa] duello rakibi bloklayamaz */
                var tt = ((o.x - px) * sx + (o.y - py) * sy) / l2; if (tt < 0 || tt > 1) continue;
                var cx = px + sx * tt, cy = py + sy * tt, perp = hyp(o.x - cx, o.y - cy), cz = pz + (B.z - pz) * tt;
                var reachS = Math.min(1.9, AC_SBR + AC_SBV * Math.max(0, S.t - DT * (1 - tt) - (sh.t0 != null ? sh.t0 : S.t) - .15));      // blok hamlesi: tepkiden sonra uzanma
                if (perp >= reachS || cz > 1.9) continue;
                tr[o.id] = 1; var sb = S.dbg.sb || (S.dbg.sb = {}); sb.cand = (sb.cand || 0) + 1; if (perp < .33) sb.body = (sb.body || 0) + 1;
                var ds = o.a.tac * .4 + o.a.mar * .3 + o.a.posi * .3, fc = (o.fx * (cx - o.x) + o.fy * (cy - o.y)) / (perp || 1), body = perp < .33;
                var pB = body ? AC_SBB : cz > 1 ? 0 : AC_SBL * (1 - (perp - .33) / (reachS - .33)) * Math.exp(AC_IS * (ds - 75) / 10) * (fc > -.3 ? 1 : .5) * (o.stunT > S.t ? .4 : 1);
                if (R() >= pB) { if (!body && cz < 1.2 && R() < AC_ST * (1 - (perp - .33) / (reachS - .33))) { sb.touch = (sb.touch || 0) + 1; shotTouch(sh, o); } continue; }      // bloklayamadı: belki hafifçe değdi
                sb.blk = (sb.blk || 0) + 1;
                B.x = cx; B.y = cy; B.z = Math.max(0, cz);
                blockShot(sh, o, body);
                return true;
            }
            return false;
        }
        // [aical] şutta hafif dokunuş: top biraz sapar, son dokunan savunmacı; isabet yeniden hesaplanır, kaleci yeniden tepki verir
        function shotTouch(sh, o) {
            var v = hyp(B.vx, B.vy) || 1, a = Math.atan2(B.vy, B.vx) + gauss() * .1, sp = v * (.85 + .1 * R());
            B.vx = Math.cos(a) * sp; B.vy = Math.sin(a) * sp; B.vz += gauss() * .8; B.last = o; S.lastTeam = o.team;
            var gx = atkGoalX(sh.team), gk = gkOf(1 - sh.team);
            if ((gx - B.x) * B.vx <= 0) return;
            var t = (gx - B.x) / B.vx, cy = B.y + B.vy * t, cz = B.z + B.vz * t - BL_G * t * t / 2, on2 = cy > GY0 + .05 && cy < GY1 - .05 && cz < GH;
            if (on2 !== !!sh.on) S.teams[sh.team].st.sot = Math.max(0, S.teams[sh.team].st.sot + (on2 ? 1 : -1));
            if (!sh.defl) { sh.defl = true; sh.on0 = !!sh.on; }
            sh.on = on2; sh.cy = cy; sh.cz = Math.max(0, cz);
            if (gk && !gk.off && !sh.gkTried) { gk.saveY = B.y + B.vy * ((gk.x - B.x) / B.vx); gk.saveT = S.t; }
        }
        // [aical] şut savunmacıdan seker: gövde (body) → geri yansır, bacak → hızını yitirip yana sapar; kaleye gidiyorsa kaleci tepki verir
        function blockShot(sh, o, body) {
            if (sh.on) S.teams[sh.team].st.sot = Math.max(0, S.teams[sh.team].st.sot - 1);
            if (body) { deflect(o, .35, .5, .6); B.vz = Math.max(0, B.vz) * .3 + 2 * R(); }      // gövde: geri yansır
            else { var bv = hyp(B.vx, B.vy) || 1; glance(o, Math.max(.3, Math.abs((o.x - B.x) * B.vy / bv - (o.y - B.y) * B.vx / bv)), .35, .5, .6, .35 + .3 * R()); B.vz = 1 + 6 * R() * R(); }      // bacak: hızını yitirip yana sapar
            if (AV_OUT && RA() < avp('AV_BLC', body ? .25 : .45)) { var gxb2 = ownGoalX(o.team), sgb = B.y < CY ? -1 : 1, tyb = CY + sgb * (GW / 2 + 1 + 7 * RA()), vb2 = Math.max(5, hyp(B.vx, B.vy)), ab2 = Math.atan2(tyb - B.y, gxb2 - B.x); B.vx = Math.cos(ab2) * vb2; B.vy = Math.sin(ab2) * vb2; }      // [av] AV_OUT: bloklanan şut çoğu kez kale çizgisinin dışına (korner; StatsBomb blok payı %26)
            B.shotFlag = false; S.teams[o.team].st.tackles++; o.cd = .25;
            emit('BLOCK', { team: o.team, p: o.id, p2: sh.shooter.id, meta: { xg: sh.xg, wall: false, body: body } });
            S.shot = null; S.pass = null; S.lastTeam = o.team; B.last = o;
            deflOnGoal(o.team, sh.shooter, sh.xg, sh.on, sh.tr);
        }
        // [aical] sapan top dt takımının kalesine gidiyorsa (2,5 sn içinde, direklerin ve üst direğin .3 m yakınından) yeni bir 'şut' kaydı: kaleci tepki süresinden sonra uzanır (on0: asıl şut isabetliydi → gol şutçunun)
        function deflOnGoal(dt, from, xg, on0, tr) {
            var gx = ownGoalX(dt), vx = B.vx; if (!from || hyp(B.vx, B.vy) < 4 || Math.abs(vx) < .5 || (gx - B.x) * vx <= 0) return;
            var t = (gx - B.x) / vx, cy = B.y + B.vy * t, cz = B.z + B.vz * t - BL_G * t * t / 2, gk = gkOf(dt);
            if (t > 2.5 || cy < GY0 - .3 || cy > GY1 + .3 || cz > GH + .3 || !gk || gk.off) return;
            S.shot = { shooter: from, team: 1 - dt, xg: xg, on: cy > GY0 + .05 && cy < GY1 - .05 && cz < GH, cy: cy, cz: Math.max(0, cz), gkTried: false, pen: false, blockChecked: true, dist0: hyp(gx - B.x, CY - B.y), wall: null, wallHit: -1, defl: true, on0: !!on0, tr: tr || {} };
            gk.saveY = B.y + B.vy * ((gk.x - B.x) / vx); gk.saveT = S.t;
        }
        function intContest(o, v) {
            var ux = B.vx / v, uy = B.vy / v, perp = Math.abs((o.x - B.x) * uy - (o.y - B.y) * ux), ps = S.pass.from ? S.pass.from.a.pas : 75;
            var ds = o.a.tac * .4 + o.a.mar * .3 + o.a.posi * .3;
            var inB = inBox(o.x, o.y, 1 - o.team), reach = AC_IR * Math.exp(AC_IS * (ds - 75) / 10) * Math.exp(-AC_IP * (ps - 75) / 10) * clamp(13 / v, .6, 1.3) * (o.stunT > S.t ? .5 : 1) * (inB ? AC_IBX : 1);
            var pT = perp < .35 ? 1 : clamp(1 - (perp - .35) / reach, 0, 1);
            var ic = S.dbg.ic || (S.dbg.ic = {}); ic.n = (ic.n || 0) + 1; ic.perp = (ic.perp || 0) + perp;
            if (R() >= pT) { o.cd = .3; ic.miss = (ic.miss || 0) + 1; return 'miss'; }
            var pC = clamp(AC_IC - .025 * Math.max(0, v - 10) - .25 * Math.max(0, perp - .35) + .004 * (ds - 75), .25, .95) * (inB ? .7 : 1);
            if (R() < pC) { if (AV_OUT && avOut(B.x, B.y, 1 - o.team, avp('AV_ICO', .35))) { o.cd = .3; B.last = o; S.lastTeam = o.team; emit('BLOCK', { team: o.team, p: o.id, p2: S.pass.from ? S.pass.from.id : -1, meta: { cross: true, kind: 'pass' } }); S.pass = null; return 'defl'; }      // [av] AV_OUT: çizgi kenarında pası kesen savunmacı topu dışarı atar
                ic.win = (ic.win || 0) + 1; gain(o); return 'win'; }
            ic.defl = (ic.defl || 0) + 1;
            var pf = S.pass.from;
            glance(o, perp, .3, .7, .8); B.vz = .6 * R(); B.last = o; S.lastTeam = o.team; o.cd = .3; avOut(B.x, B.y, 1 - o.team, .8);      // [av] AV_OUT
            emit('BLOCK', { team: o.team, p: o.id, p2: pf ? pf.id : -1, meta: { cross: true, kind: 'pass' } });
            S.pass = null;
            if (inBox(B.x, B.y, 1 - o.team)) deflOnGoal(o.team, pf, .1, false);      // kendi kalesine sapan pas: kaleci tepki verir
            return 'defl';
        }
        function placeAfterGoal(nextTeam) { /* oyuncular deadTarget ile yürüyerek dizilir */ }

        // ---------- top sahibi mücadelesi ----------
        // savunmacı d, top sürücü o: topu kapma olasılığı (elit eğri: savunma özelliği − sürücü özelliği farkına üstel)
        function tackleP(d, o, base) {
            return CURVE ? clamp(base * Math.exp(.045 * ((d.a.tac * .6 + d.a.mar * .25 + d.a.str * .15) - (o.a.dri * .55 + o.a.bal * .2 + o.a.pac * .1 + o.a.str * .15))), .05, .8) : clamp(base + .0065 * (d.a.tac - o.a.dri), .08, .5);
        }
        // tek bir çekişmeyi çöz: 'tackle' | 'foul' | 'beaten' (savunmacı geçildi)
        // [tackle] çekişme geometrisi. ca: savunmacının topçuya göre yeri, topçunun hareket (yavaşken bakış) yönüne göre: +1 önden, 0 yandan, −1 arkadan · cf: savunmacının gövdesi topa dönük mü (+1 tam)
        // vr: göreli hız (m/sn) · ex: top ayaktan açık ve savunmacı topa topçudan yakın (topa temiz uzanır) · bh: arkadanlık 0..1 · w / f: kapma / faul çarpanı · sev: sertlik (arkadan + hız)
        function tkGeo(d, o) {
            var osp = hyp(o.vx, o.vy), ux = osp > 1 ? o.vx / osp : o.fx, uy = osp > 1 ? o.vy / osp : o.fy;
            var rx = d.x - o.x, ry = d.y - o.y, rl = hyp(rx, ry) || 1, ca = (rx * ux + ry * uy) / rl;
            var bx = gbx() - d.x, by = gby() - d.y, bl = hyp(bx, by) || 1, cf = (d.fx * bx + d.fy * by) / bl;      // [carry] sanal top
            var vr = hyp(d.vx - o.vx, d.vy - o.vy), gp = TOUCH ? (o.gapNow || .55) : .55;
            var ex = clamp((gp - .6) / .7, 0, 1) * (bl < gp + .2 ? 1 : .4), bh = clamp((-.2 - ca) / .8, 0, 1);
            var w = (ca >= 0 ? 1 + .2 * ca : 1 + .55 * ca) * clamp(.7 + .6 * cf, .45, 1) * clamp(1.2 - .05 * vr, .8, 1.15) * (1 + .7 * ex);
            var f = (ca >= 0 ? 1 - .3 * ca : 1 - 1.1 * ca) * (1 + .25 * Math.max(0, -cf)) * (1 + .1 * Math.max(0, vr - 2.5)) * (1 - .5 * ex);
            return { ca: ca, cf: cf, vr: vr, ex: ex, bh: bh, w: w, f: f, sev: clamp(.55 * bh + .45 * Math.min(1, vr / 7), 0, 1) };
        }
        // müdahaleye girme isteği çarpanı: arkadan (top gövdeyle korunuyor) ya da sırtı topa dönükken savunmacı ayakta kalıp bekler; sarı kartlı oyuncu ve kendi ceza sahasındaki savunmacı daha temkinli
        // müdahale becerisi zayıf olan (forvet, kanat) dalmak yerine topçuyu yönlendirir · son adam arkadan dalmaz (kırmızı riski), yetişmeye çalışır
        function tkEng(d, o, g) {
            var dq = d.a.tac * .6 + d.a.mar * .25 + d.a.str * .15;
            var e = (1 - (1 - TK_ENG) * g.bh * (1 - g.ex)) * (g.cf > 0 ? 1 : .7 + .3 * (1 + g.cf)) * clamp(.3 + .7 * (dq - 45) / 35, .3, 1);
            if (d.yc) e *= 1 - .5 * Math.min(1, g.bh + .3);
            if (inBox(o.x, o.y, o.team)) e *= 1 - .55 * Math.max(g.bh, .45);
            if (g.ca < .25 && tkSit(d, o, g).dogso > .2) e *= 1 - .85 * clamp((.25 - g.ca) / .65, 0, 1);
            return e;
        }
        // durumun IFAB okuması (hakem ve savunmacının kendi kararı için): kaleye uzaklık (dG), oyunun yönü (dirG: topçu kaleye doğru koşuyor mu), topun kontrolü (ayaktan açıklık),
        // kapatan savunmacılar (cover; kaleci hariç, topçuyla kale arasında ve topçudan uzaklaştıkça genişleyen koridorda; faulü yapan önden ve kale tarafındaysa topçu onu henüz geçmemiştir)
        // dogso: net gol pozisyonu (0..1) · spa: umut vaat eden atak (0..1)
        function tkSit(d, o, g) {
            var gx = atkGoalX(o.team), dG = hyp(gx - o.x, CY - o.y), osp = hyp(o.vx, o.vy), cover = 0, i, q;
            for (i = 0; i < 22; i++) { q = S.players[i]; if (q.team !== d.team || q.off || q.role === 'GK' || (q === d && g.ca < .25)) continue; if (q === d) { cover++; continue; } if (hyp(gx - q.x, CY - q.y) < dG - .5 && segDist(q.x, q.y, o.x, o.y, gx, CY) < 3 + .45 * hyp(q.x - o.x, q.y - o.y)) cover++; }
            var dirG = osp > 1.5 ? ((gx - o.x) * o.vx + (CY - o.y) * o.vy) / ((dG || 1) * osp) : -1, ctrl = TOUCH ? clamp((1.8 - (o.gapNow || .55)) / .8, 0, 1) : 1;
            return { dG: dG, dirG: dirG, cover: cover,
                dogso: clamp((30 - dG) / 12, 0, 1) * clamp((dirG - .2) / .5, 0, 1) * ctrl * (cover === 0 ? 1 : cover === 1 ? .25 : 0),
                spa: clamp((45 - dG) / 20, 0, 1) * clamp((dirG + .1) / .6, 0, 1) * (cover === 0 ? 1 : cover === 1 ? .6 : 0) };
        }
        // kaçan müdahale: önden dalıp geçilen savunmacı dönmek zorunda (uzun), arkadan yetişmeye çalışan zaten aynı yöne koşuyor (kısa); hızla dalan daha uzun dengesiz kalır
        function tkStun(g) { return TK_STUN0 + (TK_STUN1 - TK_STUN0) * clamp(.35 * (g.ca + 1) / 2 + .65 * Math.min(1, g.vr / 5), 0, 1); }
        function tkLog(g, res) { var c = S.dbg.tk || (S.dbg.tk = {}), k = (g.ca > .4 ? 'on' : g.ca < -.4 ? 'ark' : 'yan') + '_' + res; c[k] = (c[k] || 0) + 1; }
        function resolveContest(d, o, base, g) {
            var pw = tackleP(d, o, base), pf = (.032 + .0003 * (60 - d.a.tac + 30)) * FOUL_K * (inBox(o.x, o.y, o.team) ? .15 : 1), r = R();
            if (TACKLE) {      // [tackle] açı, gövde yönü, göreli hız, topun açıklığı; ceza sahasında savunmacı ayakta kalır (daha az faul, biraz daha az kapma)
                tkG = g || tkGeo(d, o); pw = clamp(pw * tkG.w, .02, .8); pf *= TK_FOUL * tkG.f;
                if (inBox(o.x, o.y, o.team)) { pf *= .65; pw *= .9; }
            }
            if (r < pw) {
                if (VAR2 && TACKLE && tkG.ex > 0 && tkG.ca > 0 && inBox(o.x, o.y, o.team) && RR() < VAR_PWR * tkG.ex * tkG.ca) return penWrong(d, o);      // [var] hakem temiz müdahalede penaltı çaldı
                S.teams[d.team].st.tackles++; S.lastAst = null;
                B.owner = null; var ka = Math.atan2(d.y - o.y, d.x - o.x) + gauss() * .8; B.vx = Math.cos(ka) * 5; B.vy = Math.sin(ka) * 5; B.last = d; S.lastTeam = d.team; o.cd = .5; d.cd = .1;
                S.pass = null; S.chain[o.team] = 0;
                if (slNow) {      /* [sav] kayma topu kayma yonune (kendi kalesinden uzaga karisik) carptirir; kayan oyuncu yerde, hemen alamaz */
                    var sx5 = o.x - d.x, sy5 = o.y - d.y, sl5 = hyp(sx5, sy5) || 1, ax5 = S.teams[d.team].dir; sx5 = sx5 / sl5 + .7 * ax5; sy5 /= sl5;
                    var ka5 = Math.atan2(sy5, sx5) + gauss() * .5, kv5 = 5 + 3 * R(); B.vx = Math.cos(ka5) * kv5; B.vy = Math.sin(ka5) * kv5; d.cd = 1.1;
                }
                avOut(o.x, o.y, o.team, 1);      // [av] AV_OUT
                emit('TACKLE', { team: d.team, p: d.id, p2: o.id, x: o.x, y: o.y, meta: slNow ? { slide: true } : {} });
                return 'tackle';
            }
            if (r < pw + pf) {
                S.teams[d.team].st.fouls++;
                var pen = inBox(o.x, o.y, o.team), pv = null, edge = VAR2 && !pen && penEdge(o);      // [var] edge: hakem çizginin hemen dışındaki faulü penaltı sandı
                if (edge) pen = true;
                emit('FOUL', { team: d.team, p: d.id, p2: o.id, x: o.x, y: o.y, meta: { pen: pen, slide: slNow } }); S._edge = !!edge;
                S.chain = [0, 0];
                if (pen && VAR_ON && VAR_OG && !S.userRef && penAppOff(d, o)) return 'foul';      // [offs] VAR: hücum evresinde kaçan ofsayt → penaltı iptal
                if (pen && VAR_ON && !S.userRef) pv = VAR2 ? varPen2(d, o, edge) : varPenalty(d, o);      // hakem penaltı dedi; VAR bazılarını inceler (onay ya da iptal) · [var] VAR2: yalnız hakem hatası iptal edilir
                if (pv) emit('VAR', pv.ev);
                if (pv && pv.cancel) {
                    varPenCancel(d, o, pv);
                    if (pv.reason === 'disi') referee(d, o, false);      // faul ceza sahası dışında: serbest vuruş, kart yine verilebilir · temas yoksa faul de yok
                    return 'foul';
                }
                if (pen) startDead('penalty', o.team, { x: atkGoalX(o.team) - S.teams[o.team].dir * 11, y: CY });
                else startDead('freekick', o.team, { x: clamp(o.x, 1, PW - 1), y: clamp(o.y, 1, PH - 1) });
                referee(d, o, pen);
                return 'foul';
            }
            return 'beaten';
        }
        function duels() {
            var o = B.owner; if (!o || o.role === 'GK') return;      // kaleci topu ayağında/elindeyken müdahale edilmez
            for (var i = 0; i < 22; i++) {
                var d = S.players[i]; if (d.team === o.team || d.role === 'GK' || d.tcd > 0 || d.off) continue;
                var dd = hyp(d.x - gbx(), d.y - gby());      // [carry] sanal top
                // top sürme: önünde 2.4 m içinde savunmacı → tek seferlik adam eksiltme (take-on) çekişmesi
                if (o.dribble && o.dribType === 'takeon' && d.stunT < S.t) {
                    var od = hyp(d.x - o.x, d.y - o.y), sp = hyp(o.vx, o.vy) || 1;
                    if (od < TAKEON_R && ((d.x - o.x) * o.vx + (d.y - o.y) * o.vy) / (od * sp || 1) > .3) {
                        d.tcd = 1.1;
                        var res = resolveContest(d, o, TAKEON_P); S.dbg.take[res] = (S.dbg.take[res] || 0) + 1;
                        if (TACKLE) tkLog(tkG, 't' + res);
                        if (res !== 'beaten') return;
                        d.stunT = S.t + TAKEON_STUN; o.takeOns = (o.takeOns || 0) + 1; S.teams[o.team].st.takeOns = (S.teams[o.team].st.takeOns || 0) + 1;
                        continue;
                    }
                }
                if (SL_ON && dd > 1.05 && dd < SL_R && d.stunT < S.t && !(d.slT > S.t)) {      /* [sav] kayarak mudahale */
                    var dq5 = d.a.tac * .6 + d.a.mar * .25 + d.a.str * .15, dsp5 = hyp(d.vx, d.vy);
                    if (dq5 >= 68 && hyp(o.vx, o.vy) > 2.5 && dsp5 > 2.2 && (d.vx * (gbx() - d.x) + d.vy * (gby() - d.y)) / (dsp5 * dd) > .5) {
                        d.slT = S.t + .4;
                        var g5 = tkGeo(d, o), dg5 = hyp(atkGoalX(o.team) - o.x, CY - o.y);
                        var want5 = SL_P * clamp((dq5 - 68) / 20, .15, 1) * (g5.ca > .5 ? .35 : g5.ca < -.3 ? .1 : 1) * (d.yc ? .3 : 1) * (inBox(o.x, o.y, o.team) ? .25 : 1) * (1 + .8 * clamp((40 - dg5) / 25, 0, 1));
                        if (R() < want5) {
                            d.tcd = TACKLE_CD; d.slT = S.t + 5;
                            g5.w *= 1.3 * (1 - .35 * clamp((dd - 1.05) / (SL_R - 1.05), 0, 1)) * (g5.ca < -.3 ? .75 : 1); g5.f *= SL_F; g5.sev = clamp(g5.sev + .1, 0, 1);
                            slNow = true; var res5 = resolveContest(d, o, SL_W, g5); slNow = false;
                            S.dbg.slide = S.dbg.slide || {}; S.dbg.slide[res5] = (S.dbg.slide[res5] || 0) + 1; if (TACKLE) tkLog(g5, 's' + res5);
                            if (res5 === 'tackle') { d.stunT = S.t + 1; d.slideT = S.t; return; }
                            if (res5 !== 'beaten') { d.slideT = S.t; return; }
                            d.slideMiss = S.t; d.stunT = S.t + SL_STUN; d.slideT = S.t;
                            continue;
                        }
                    }
                }
                if (dd > (S.t - (d.pressT || -9) < .15 ? 1.05 + PRESS_REACH * (1 + PR_R * tacOf(d.team).press) : 1.05)) continue;
                d.tcd = TACKLE_CD;
                if (TACKLE) {      // [tackle] girme isteği konuma/gövde yönüne bağlı; kaçan müdahalede savunmacı açı ve hıza göre bir an dengesiz kalır (topçu kurtulur)
                    var g2 = tkGeo(d, o);
                    if (R() > ENGAGE * (1 + PR_E * tacOf(d.team).press) * tkEng(d, o, g2)) continue;
                    var res3 = resolveContest(d, o, .24 * TK_WIN, g2); S.dbg.press[res3] = (S.dbg.press[res3] || 0) + 1; tkLog(g2, res3);
                    if (res3 !== 'beaten') return;
                    d.stunT = S.t + Math.max(tkStun(g2), tacOf(d.team).press > 0 ? PR_STUN : 0);
                    continue;
                }
                if (R() > ENGAGE * (1 + PR_E * tacOf(d.team).press)) continue;   // her temasta müdahaleye girmez
                var res2 = resolveContest(d, o, .24); S.dbg.press[res2] = (S.dbg.press[res2] || 0) + 1;
                if (res2 !== 'beaten') return;
                if (tacOf(d.team).press > 0) d.stunT = S.t + PR_STUN;      // yüksek baskıda aşılan oyuncu bir an oyun dışı kalır (baskı kırılınca arkada boşluk)
            }
        }

        // ---------- hakem: kartlar ve VAR ----------
        // Kararlar ayrı rastgele akıştan (RR) gelir. Sarı kart oyunun akışını değiştirmez; kırmızı kart (10 kişi) ve iptal edilen gol gerçekten değiştirir.
        // ofsayt payı: alıcı, son savunmacıyı ve topu ne kadar geçmişti (m). > 0 ofsayt konumu; hakem .2 m'ye kadar bayrak kaldırmaz, VAR çizgiyi kesin ölçer.
        // [offs] ofsayt kaydı: takım topu oynadığı anda (bx: topun konumu) ofsayt konumundakiler ve VAR için çizgiye göre payları
        function offSnapTake(team, bx, from, to) {
            var ids = {}, mo = {}, pos = {}, i, q, m;
            for (i = 0; i < 22; i++) { q = S.players[i]; if (q.team !== team || q.off || q === from) continue; m = offMargin(q, bx); if (m > -VAR_MARG) { mo[q.id] = m; pos[q.id] = [q.x, q.y]; } if (isOffside(q, bx)) ids[q.id] = 1; }
            S.offSnap = { team: team, ids: ids, mo: mo, pos: pos, from: from ? from.id : -1, to: to ? to.id : -1, t0: S.t, bx: B.x, by: B.y, lx: atkGoalX(team) - S.teams[team].dir * offDist(team) };
        }
        // [offs] hücum evresi kaydı: yan hakemin kaçırdığı / göremediği ofsaytlar (off) ve kıl payı içeride kalanlar (close) - VAR gol anında bunlara bakar
        function appOf(tm) { if (!S.app) S.app = [null, null]; return S.app[tm] || (S.app[tm] = { off: [], close: [] }); }
        function appRec(osn, p, mo0, list) {
            var ps = osn.pos[p.id] || [p.x, p.y];
            appOf(p.team)[list].push({ mo: mo0, op: p.id, from: osn.from, to: p.id, tp: osn.t0, lx: osn.lx, px: osn.bx, py: osn.by, ox: ps[0], oy: ps[1], kx: p.x, ky: p.y });
        }
        function offMargin(q, fromX) {
            var gx = atkGoalX(q.team), dq = Math.abs(gx - q.x);
            if (dq >= CX) return -9;
            return Math.min(offDist(q.team) - dq, Math.abs(gx - fromX) - dq);
        }
        // viaVar: kart VAR incelemesinden çıktı (onay / sarıya düşürme / kırmızıya çevirme) → köprü "VAR: kırmızı kart" etiketini yazar
        function cardEv(d, o, kind, why, second, pen, viaVar) {
            var T = S.teams[d.team].st;
            if (kind === 'Y') { d.yc = (d.yc || 0) + 1; T.yellow++; } else T.red++;
            var gone = S.players.filter(function (q) { return q.team === d.team && q.off; }).length;      // kırmızıda: bu karttan sonra sahada kalan oyuncu sayısı
            emit('CARD', { team: d.team, p: d.id, p2: o ? o.id : -1, x: o ? o.x : B.x, y: o ? o.y : B.y, meta: { card: kind, second: !!second, yc: d.yc || 0, why: why, pen: !!pen, men: 11 - gone - (kind === 'R' ? 1 : 0), var: !!viaVar } });
        }
        // oyundan atılan: sahadan çıkar (sahanın dışına park edilir, hiçbir döngüde yer almaz), takım kalan 10 kişiyle dengelenir
        function sendOff(p) {
            p.off = true; p.x = p.tx = -80; p.y = p.ty = CY; p.vx = p.vy = 0; p.run = null; p.boxT = null; p.supT = null; p.dec = null; p.markId = null; p.dribble = false;
            S.teams[p.team].men = 11 - S.players.filter(function (q) { return q.team === p.team && q.off; }).length;
            reorg(p.team, p.role);
            if (AICAL) calcQ();      // [aical] 10 kişi: topa sahip olma değeri düşer
        }
        // teknik direktör tepkisi: boşalan rolü 10 numara (yoksa kanat/forvet) doldurur; 10 numarayı kaybeden takım dizilimi olduğu gibi bırakır
        function reorg(tm, role) {
            if (role === 'AM') return null;
            var order = ['AM', 'LW', 'RW', 'ST'];
            for (var k = 0; k < order.length; k++) {
                if (order[k] === role) continue;
                var q = P(tm, order[k]); if (!q) continue;
                q.role = role; q.home = null; q.run = null; q.boxT = null; q.supT = null; q.markId = null; q.dec = null;
                S.teams[tm].reorg = { from: order[k], to: role, p: q.id };
                return q;
            }
            return null;
        }
        var POSY = { LB: 2.8, RB: 2.8, LCB: 3, RCB: 3, LDM: 1.6, RDM: 1.4, AM: .45, LW: .4, RW: .4, ST: .4 };
        // [tackle] hakem (IFAB Kural 12). DOGSO dört ölçütü: kaleye uzaklık · oyunun genel yönü (topçu kaleye doğru gidiyor mu) · topu kontrol etme olasılığı (ayaktan açıklık) ·
        // savunmacıların yeri ve sayısı (kaleci hariç, topçuyla kale arasında ve koridoru kapatabilecek olanlar; faulü yapan önden ve kale tarafındaysa topçu onu henüz geçmemiştir)
        // ceza sahasında topa oynama girişimiyle yapılan DOGSO: penaltı + sarı (2016 çifte ceza kuralı); arkadan, top gövdeyle korunurken (tutma/çekme) yine kırmızı
        // sarı: sertlik (arkadan + hız) ve agresiflikle, ısrarlı faul, umut vaat eden atağı durdurma (SPA) · ciddi faul oyunu: sertliğin karesiyle doğrudan kırmızı
        function refereeTk(d, o, pen) {
            d.nf = (d.nf || 0) + 1;
            var g = tkG || tkGeo(d, o), agg = d.a.agg != null ? d.a.agg : 40, s = tkSit(d, o, g), dogso = s.dogso, spa = s.spa;
            var att = g.ca > -.4 || g.ex > .3, dogR = dogso >= .4 && !(pen && att);      // topa oynama girişimi · kırmızılık DOGSO
            if (S.userRef && !d.off) {      /* [port] kuralın gerçeği (IFAB Kural 12): kart / penaltı; oyuncu karar verir */
                var tC = dogR ? 'R' : g.sev >= .72 ? 'R' : (g.sev >= .42 || spa >= .5 || (pen && dogso >= .3) || d.nf >= 3) ? 'Y' : 'none', tW = dogR ? 'son_adam' : g.sev >= .72 ? 'sert' : spa >= .5 ? 'taktik' : d.nf >= 3 ? 'israrli' : 'faul';
                if (tC === 'Y' && (d.yc || 0) >= 1) { tC = 'R2'; tW = 'ikinci_sari'; }
                var rInf = { kind: 'foul', d: d.id, o: o.id, pen: pen, sev: g.sev, dogso: dogso, spa: spa, att: att, nf: d.nf, yc: d.yc || 0, slide: !!(typeof slNow !== 'undefined' && slNow), x: o.x, y: o.y, t: S.t, truth: { call: pen ? (S._edge ? 'fk' : 'pen') : 'fk', card: tC, why: tW } };
                if (!S.refWant || S.refWant(rInf)) { S.refAsk = rInf; S.refHold = true; return; }
            }
            if (S.refLog) S.refLog.push({ t: S.t, p: d.id, role: d.role, agg: agg, behind: s.cover, dGoal: s.dG, pen: pen, central: s.dirG, dogso: dogso, nf: d.nf, spa: spa, sev: g.sev, ca: g.ca, att: att, dt: o.dribble ? o.dribType : 'tut' });
            if (!CARDS_ON || d.off) return;
            var pSer = TK_SER * (.5 + agg / 50) * (.2 + 2.5 * g.sev * g.sev), pDog = dogR ? TK_DOG * clamp((dogso - .4) / .4, 0, 1) : 0, pRed = pSer + pDog;
            var pYel = TK_Y * (Y_BASE * Math.pow(Math.max(agg, 8) / 45, Y_EXP) * (.35 + 1.3 * g.sev) + (d.nf >= 3 ? .2 : d.nf === 2 ? .1 : 0)) + .5 * spa * (TK_SPAPEN && pen && att ? 0 : 1) + (pen && dogso >= .3 ? .9 : 0);      // [tackle] TK_SPAPEN: ceza sahasında topa oynama girişimli SPA → penaltı yeter
            if ((d.yc || 0) >= 1) pYel *= Y_AGAIN;      // sarı kartlı oyuncu temkinli oynar, hakem de ikinci kartta daha çekingendir
            if (RR() < pRed) {
                var whyR = pDog >= pSer ? 'son_adam' : 'sert', rv = VAR_ON ? varCard(d, o, 'R', whyR, pen, { sev: g.sev, dogso: dogso }) : null;
                if (rv) emit('VAR', rv.ev);
                if (rv && rv.outcome === 'downgrade') { cardEv(d, o, 'Y', whyR === 'son_adam' ? 'taktik' : 'faul', false, pen, true); return; }
                cardEv(d, o, 'R', whyR, false, pen, !!rv); sendOff(d); return;
            }
            if (RR() < pYel) {
                if ((d.yc || 0) >= 1) { d.yc++; cardEv(d, o, 'R', 'ikinci_sari', true, pen); sendOff(d); }
                else {
                    var ru = (VAR_ON && dogR) ? varCard(d, o, 'Y', 'son_adam', pen, { sev: g.sev, dogso: dogso }) : null;      // kırmızılık DOGSO'da yalnız sarı: VAR kırmızıya çevirebilir
                    if (ru) emit('VAR', ru.ev);
                    if (ru) { cardEv(d, o, 'R', 'son_adam', false, pen, true); sendOff(d); }
                    else cardEv(d, o, 'Y', dogso >= .3 || (spa >= .5 && !(TK_SPAPEN && pen && att)) ? 'taktik' : 'faul', false, pen);
                }
            }
        }
        function referee(d, o, pen) {
            if (TACKLE) return refereeTk(d, o, pen);
            d.nf = (d.nf || 0) + 1;
            var agg = d.a.agg != null ? d.a.agg : 40, gx = atkGoalX(o.team), dGoal = Math.abs(gx - o.x), behind = 0, i, q;
            for (i = 0; i < 22; i++) { q = S.players[i]; if (q.team === d.team && !q.off && q.role !== 'GK' && Math.abs(gx - q.x) < dGoal - .5) behind++; }      // faul yiyenle kale arasındaki rakip oyuncular (kaleci hariç)
            var central = Math.abs(o.y - CY) < (pen ? 40 : 20);
            var dogso = (behind === 0 ? (dGoal < 40 ? 1 : .25) : behind === 1 && dGoal < 30 ? .2 : 0) * (central ? 1 : .35);      // net gol pozisyonunu engelleme
            if (S.refLog) S.refLog.push({ t: S.t, p: d.id, role: d.role, agg: agg, behind: behind, dGoal: dGoal, pen: pen, central: central, dogso: dogso, nf: d.nf });      // kalibrasyon günlüğü (yalnızca laboratuvar)
            if (!CARDS_ON || d.off) return;
            // rol çarpanı: bu simülasyonda faulleri en çok baskı yapan forvet/10 numara yapar; hakem ise savunmacıların müdahalelerini (arkadan, taktik, sert) daha sık cezalandırır
            var rf = Y_POS ? (POSY[d.role] || 1) : 1;
            var pRed = R_SERIOUS * (.5 + agg / 50) * rf + R_DOGSO * dogso * (pen ? .6 : 1);
            var pYel = (Y_BASE * Math.pow(Math.max(agg, 8) / 45, Y_EXP) + (d.nf >= 3 ? .2 : d.nf === 2 ? .1 : 0)) * rf + (behind <= 1 && dGoal < 55 && !pen ? .12 : 0) + (pen ? .3 : 0);
            if ((d.yc || 0) >= 1) pYel *= Y_AGAIN;      // sarı kartlı oyuncu temkinli oynar, hakem de ikinci kartta daha çekingendir
            if (RR() < pRed) {
                var whyR = dogso >= .25 ? 'son_adam' : 'sert', rv = VAR_ON ? varCard(d, o, 'R', whyR, pen, { sev: null, dogso: dogso }) : null;      // VAR bazı kırmızıları kontrol eder: onay ya da sarıya düşürme
                if (rv) emit('VAR', rv.ev);
                if (rv && rv.outcome === 'downgrade') { cardEv(d, o, 'Y', whyR === 'son_adam' ? 'taktik' : 'faul', false, pen, true); return; }
                cardEv(d, o, 'R', whyR, false, pen, !!rv); sendOff(d); return;
            }
            if (RR() < pYel) {
                if ((d.yc || 0) >= 1) { d.yc++; cardEv(d, o, 'R', 'ikinci_sari', true, pen); sendOff(d); }
                else {
                    var ru = (VAR_ON && dogso >= .25) ? varCard(d, o, 'Y', 'son_adam', pen, { sev: null, dogso: dogso }) : null;      // net gol pozisyonunu engellemede VAR sarıyı kırmızıya çevirebilir
                    if (ru) emit('VAR', ru.ev);
                    if (ru) { cardEv(d, o, 'R', 'son_adam', false, pen, true); sendOff(d); }
                    else cardEv(d, o, 'Y', dogso ? 'taktik' : 'faul', false, pen);
                }
            }
        }
        // VAR: gol anında (1) yakın ofsayt (pas anındaki gerçek konumdan) ya da (2) rastgele faul/el kontrolü. Dönen: null (inceleme yok) | { cancel, reason, ev }
        // meta (yalnızca görüntü için; karar bunlardan çıkmaz): ofsayt incelemesinde pas anı (tp), çizgi x'i (lx), vuruşçu (px,py) ve alıcı (ox,oy) konumu; golcünün gol anındaki konumu (sx,sy)
        function varReview(tm, scorer, la, gx, gy) {
            var mo = la ? la.mo : -9, reason, cancel, margin = null;
            if (OFFS2) {      // [offs] VAR bütün hücum evresine bakar: kaçan ofsayt varsa (en büyük paylı) gol iptal; yalnız kıl payı içeride kalan varsa kontrol edilir, gol geçerli
                var ap = S.app && S.app[tm], rec = null, k;
                if (ap && ap.off.length) { for (k = 0; k < ap.off.length; k++) if (!rec || ap.off[k].mo > rec.mo) rec = ap.off[k]; }
                else if (ap && ap.close.length) { for (k = 0; k < ap.close.length; k++) if (!rec || ap.close[k].mo > rec.mo) rec = ap.close[k]; }
                la = rec; mo = rec ? rec.mo : -9;
            }
            var fr = null;
            if (VAR2) {      // [var] rastgele faul / el kontrolü yok: ofsayt incelemesi (yukarıdaki gibi), hücum evresinde kaçan faul varsa iptal; yalnız kol teması varsa (ofsayt incelemesi yoksa) kontrol, gol geçerli
                if (mo > -VAR_MARG && mo <= (OFFS2 ? 99 : OFF_TOL)) { reason = 'ofsayt'; margin = mo; cancel = mo > 0; }
                fr = cancel ? null : appFoul(tm);
                if (fr && (fr.clear || !reason)) { reason = 'faul'; margin = null; cancel = fr.clear; } else fr = null;
                if (!reason) return null;
            }
            else if (mo > -VAR_MARG && mo <= (OFFS2 ? 99 : OFF_TOL)) { reason = 'ofsayt'; margin = mo; cancel = mo > 0; }
            else if (RR() < VAR_RND) { reason = RR() < .75 ? 'faul' : 'el'; cancel = RR() < VAR_CANCEL; }
            else return null;
            var off = reason === 'ofsayt' && la;
            var res = { cancel: cancel, reason: reason, la: la, ev: { team: tm, p: scorer.id, p2: la ? la.from : -1, x: gx, y: gy, meta: { kind: 'goal', reason: reason, outcome: cancel ? 'cancel' : 'confirm', margin: margin, sx: scorer.x, sy: scorer.y,
                tp: off ? la.tp : null, lx: off ? la.lx : null, px: off ? la.px : null, py: off ? la.py : null, ox: off ? la.ox : null, oy: off ? la.oy : null, op: off && la.op != null ? la.op : (off ? scorer.id : -1) } } };
            if (fr) { res.fr = fr; res.ev.meta.fp = fr.p; res.ev.meta.fx = fr.x; res.ev.meta.fy = fr.y; }      // [var] faulü yapan ve faulün yeri
            return res;
        }
        // [offs] VAR_OG: yalnız hücum evresi (APP) ofsayt incelemesi - kendi kalesine gol (rastgele faul / el kontrolü yok, RR tüketmez). Dönen: null | varReview biçimi
        function varAppOff(tm, scorer, gx, gy) {
            var ap = S.app && S.app[tm], rec = null, k;
            if (ap && ap.off.length) { for (k = 0; k < ap.off.length; k++) if (!rec || ap.off[k].mo > rec.mo) rec = ap.off[k]; }
            else if (ap && ap.close.length) { for (k = 0; k < ap.close.length; k++) if (!rec || ap.close[k].mo > rec.mo) rec = ap.close[k]; }
            if (!rec || !(rec.mo > -VAR_MARG)) return null;
            var cancel = rec.mo > 0;
            return { cancel: cancel, reason: 'ofsayt', la: rec, ev: { team: tm, p: scorer.id, p2: rec.from, x: gx, y: gy, meta: { kind: 'goal', reason: 'ofsayt', outcome: cancel ? 'cancel' : 'confirm', margin: rec.mo, sx: scorer.x, sy: scorer.y,
                tp: rec.tp, lx: rec.lx, px: rec.px, py: rec.py, ox: rec.ox, oy: rec.oy, op: rec.op != null ? rec.op : -1, own: true } } };
        }
        // [offs] VAR_OG: penaltı faulünden önce hücum evresinde kaçan ofsayt: penaltı iptal, ofsayt yerinde savunmaya endirekt serbest vuruş (faul silinir). Dönen: iptal edildi mi
        function penAppOff(d, o) {
            var ap = S.app && S.app[o.team], rec = null, k;
            if (!ap || !ap.off.length) return false;
            for (k = 0; k < ap.off.length; k++) if (!rec || ap.off[k].mo > rec.mo) rec = ap.off[k];
            emit('VAR', { team: o.team, p: d.id, p2: o.id, x: o.x, y: o.y, meta: { kind: 'pen', reason: 'ofsayt', outcome: 'cancel', margin: rec.mo, op: rec.op } });
            S.teams[d.team].st.fouls--; S.lastAst = null; S.chain = [0, 0];
            startDead('freekick', d.team, { x: clamp(rec.kx, 1, PW - 1), y: clamp(rec.ky, 1, PH - 1) }, { indirect: true });
            return true;
        }
        // gol iptal: skor değişmez; savunma takımı serbest vuruşla oyunu başlatır (ofsayt: alıcının olduğu nokta, faul/el: golün atıldığı yer)
        function varCancel(tm, scorer, vr) {
            emit('VAR', vr.ev);
            S.lastAst = null; S.shot = null; S.pass = null; S.chain = [0, 0]; B.owner = null; B.high = null; B.shotFlag = false;
            var la = vr.la, sp = vr.fr ? { x: vr.fr.x, y: vr.fr.y } : (vr.reason === 'ofsayt' && la && la.kx != null) ? { x: la.kx, y: la.ky } : (vr.reason === 'ofsayt' && la && la.ox != null) ? { x: la.ox, y: la.oy } : { x: scorer.x, y: scorer.y };      // [var] VAR2: faulün yeri
            startDead('freekick', 1 - tm, { x: clamp(sp.x, 1, PW - 1), y: clamp(sp.y, 1, PH - 1) }, vr.reason === 'ofsayt' ? { indirect: true } : undefined);
        }
        // VAR penaltı incelemesi: hakem penaltı verdi (FOUL olayı emit edildi); VAR_PEN oranında incelenir. Dönen: null | { cancel, reason: 'temas'|'disi', ev }
        //   onay      → penaltı kararı geçerli
        //   iptal 'disi'  → faul ceza sahasının hemen dışında: penaltı yerine serbest vuruş (kart yine verilebilir)
        //   iptal 'temas' → temas/faul yok: faul silinir, oyun kaleciye topla başlar (düşen top)
        function varPenalty(d, o) {
            if (RR() >= VAR_PEN) return null;
            var cancel = RR() < VAR_PEN_NO, reason = cancel && RR() < VAR_PEN_OUT ? 'disi' : 'temas';
            return { cancel: cancel, reason: reason, ev: { team: o.team, p: d.id, p2: o.id, x: o.x, y: o.y, meta: { kind: 'pen', reason: reason, outcome: cancel ? 'cancel' : 'confirm' } } };
        }
        // [var] VAR2 penaltı incelemesi: hakem çizginin hemen dışındaki faulü penaltı sandıysa (edge) iptal 'disi'; doğru penaltı VAR_PEN oranında görünür kontrol (onay). Dönen: null | varPenalty biçimi
        function varPen2(d, o, edge) {
            if (!edge && RR() >= VAR_PEN) return null;
            return { cancel: !!edge, reason: edge ? 'disi' : 'temas', edge: !!edge, ev: { team: o.team, p: d.id, p2: o.id, x: o.x, y: o.y, meta: { kind: 'pen', reason: edge ? 'disi' : 'temas', outcome: edge ? 'cancel' : 'confirm' } } };
        }
        // [var] VAR2: faul ceza sahası dışında, çizgiye 1 m'den yakın: hakem VAR_EDGE·(1 − uzaklık) olasılıkla penaltı der (hakem akışı; yalnız bantta çekilir)
        function penEdge(o) {
            var dx = Math.max(0, Math.abs(atkGoalX(o.team) - o.x) - PA_D), dy = Math.max(0, PA_Y0 - o.y, o.y - PA_Y1), dd = hyp(dx, dy);
            return dd < 1 && RR() < VAR_EDGE * (1 - dd);
        }
        // [var] VAR2: hakem ceza sahasında topa temiz yapılan müdahaleye penaltı çaldı. VAR temiz müdahaleyi görür: penaltı iptal, faul silinir, oyun kaleciye düşen topla başlar (kart yok)
        function penWrong(d, o) {
            if (S.userRef) {      /* [port] temiz müdahale ama penaltı şüphesi: karar hakemin */
                S.teams[d.team].st.fouls++; emit('FOUL', { team: d.team, p: d.id, p2: o.id, x: o.x, y: o.y, meta: { pen: true } }); S.chain = [0, 0];
                startDead('penalty', o.team, { x: atkGoalX(o.team) - S.teams[o.team].dir * 11, y: CY });
                S.refAsk = { kind: 'foul', d: d.id, o: o.id, pen: true, clean: true, sev: 0, dogso: 0, spa: 0, nf: d.nf || 0, yc: d.yc || 0, x: o.x, y: o.y, t: S.t, truth: { call: 'none', card: 'none', why: '' } }; S.refHold = true; return 'foul';
            }
            S.teams[d.team].st.fouls++;
            emit('FOUL', { team: d.team, p: d.id, p2: o.id, x: o.x, y: o.y, meta: { pen: true } });
            S.chain = [0, 0];
            if (VAR_OG && penAppOff(d, o)) return 'foul';      // [offs] hücum evresinde kaçan ofsayt önce gelir
            var pv = { cancel: true, reason: 'temas', ev: { team: o.team, p: d.id, p2: o.id, x: o.x, y: o.y, meta: { kind: 'pen', reason: 'temas', outcome: 'cancel', clean: true } } };
            emit('VAR', pv.ev);
            varPenCancel(d, o, pv);
            return 'foul';
        }
        function varPenCancel(d, o, pv) {
            var tm = o.team, dir = S.teams[tm].dir, gxl = atkGoalX(tm);
            S.lastAst = null; S.chain = [0, 0];
            if (pv.reason === 'disi') startDead('freekick', tm, pv.edge ? { x: clamp(o.x, 1, PW - 1), y: clamp(o.y, 1, PH - 1) } : { x: gxl - dir * (PA_D + .8), y: clamp(o.y, 2, PH - 2) });      // [var] VAR2: faulün gerçek yeri
            else { S.teams[d.team].st.fouls--; startDead('goalkick', d.team, { x: gxl - dir * 5.5, y: o.y < CY ? CY - 6 : CY + 6 }, { drop: true }); }
        }
        // VAR kırmızı kart kontrolü. kind 'R': hakem kırmızı gösterecekti → VAR_RED oranında kontrol; sonuç 'confirm' | 'downgrade' (sarıya; zaten sarısı olanda mümkün değil, ikinci sarıya dönerdi)
        //   kind 'Y': hakem net gol pozisyonunu engellemede yalnız sarı gösterdi → VAR_UP oranında 'upgrade' (kırmızıya); aksi hâlde inceleme yok.
        // [var] VAR2 (sv = { sev, dogso }): sarıya düşürme / kırmızıya çevirme hakem hatası payına bağlı (DEFAULTS [var]); kırmızıların tümü sessizce incelenir, düşürülmeyen VAR_RED oranında görünür onay
        function varCard(d, o, kind, why, pen, sv) {
            var out;
            if (VAR2 && sv) {
                if (kind === 'R') {
                    var pD = why === 'son_adam' ? VAR_CK * clamp((.7 - sv.dogso) / .3, 0, 1) : sv.sev != null ? VAR_CK * .2 / (.2 + 2.5 * sv.sev * sv.sev) : VAR_RED_DOWN;
                    if ((d.yc || 0) < 1 && RR() < pD) out = 'downgrade'; else if (RR() < VAR_RED) out = 'confirm'; else return null;
                } else { if (RR() >= VAR_CK * clamp((sv.dogso - .5) / .4, 0, 1)) return null; out = 'upgrade'; }
            }
            else if (kind === 'R') { if (RR() >= VAR_RED) return null; out = ((d.yc || 0) < 1 && RR() < VAR_RED_DOWN) ? 'downgrade' : 'confirm'; }
            else { if (RR() >= VAR_UP) return null; out = 'upgrade'; }
            return { outcome: out, ev: { team: d.team, p: d.id, p2: o ? o.id : -1, x: o ? o.x : B.x, y: o ? o.y : B.y, meta: { kind: 'red', reason: why, outcome: out, pen: !!pen } } };
        }

        // ---------- ana adım ----------
        function step() {
            if (S.finished) return;
            if (S.refHold) return;      /* [port] hakem kararı bekleniyor */
            S.t += DT; S.audit.ticks++; ballPending = false;
            if (AIS) { var kb = Math.min(1, DT / AIS_LAG); BS.x += (B.x - BS.x) * kb; BS.y += (B.y - BS.y) * kb; }
            var penHold = PEN_END && (S.mode === 'dead' && S.dead && S.dead.kind === 'penalty' || !!(S.shot && (S.shot.pen || S.shot.force)));      // [dead] PEN_END: verilmiş penaltının sonucu belli olmadan devre / maç bitmez (IFAB 7.4)
            if (S.half === 1 && S.t >= HALF_S && !S.halfBreak && !penHold) { S.halfBreak = true; emit('HALFTIME', {}); S.teams.forEach(function (t) { t.dir = -t.dir; }); startDead('kickoff', 1, { x: CX, y: CY }, { second: true }); placeKickoff(1); S.half = 2; S.dead.wait = 1.5;
                if (FATIGUE) S.players.forEach(function (q) { if (q.stamCap == null) return; q.stamCap += (1 - q.stamCap) * FT_HT; q.stam = q.stamCap; q.ana = 1; });      // [fatigue] devre arası toparlanma
            }
            if (S.t >= FULL_S && !penHold && !(S.holdEnd && S.t < FULL_S + 600) && !(S.forceGoal != null && S.forceGoal !== undefined && S.t < FULL_S + (S.forceHold || 150))) { S.finished = true; emit('FULLTIME', {}); return; }
            // topa sahip olma sayacı
            var pt = B.owner ? B.owner.team : (S.pass ? S.pass.team : -1); if (pt >= 0) S.teams[pt].st.poss += DT;
            if (TAC_ON && B.owner && S._pt !== B.owner.team) { var ntm = B.owner.team; if (S._pt === 0 || S._pt === 1) { var ltc = S.teams[1 - ntm].tac, wtc = S.teams[ntm].tac, odir = S.teams[1 - ntm].dir, og = ownGoalX(1 - ntm), bh = 0;
                for (var ci = 0; ci < 22; ci++) { var cq = S.players[ci]; if (cq.team === ntm || cq.off || cq.role === 'GK') continue; if ((cq.x - og) * odir < (B.x - og) * odir - 1) bh++; }
                var expo = clamp((6 - bh) / 4, 0, 1), ctk = expo * (.35 + PRM.CT_M * Math.max(0, ltc.ment) + PRM.CT_L * Math.max(0, ltc.line) + PRM.CT_P * Math.max(0, ltc.press) + PRM.CT_D * Math.max(0, -wtc.ment));
                S.ctr = ctk > .15 ? { team: ntm, until: S.t + PRM.CT_T, k: ctk } : null; if (S.ctr) S.teams[ntm].st.ctr = (S.teams[ntm].st.ctr || 0) + 1; }
                S._pt = ntm; }
            if (S.ctr && (S.t > S.ctr.until || S.mode === 'dead')) S.ctr = null;      /* [port] kontra penceresi */
            if ((OFFS2 || VAR2) && B.owner && S.app) S.app[1 - B.owner.team] = null;      // [offs] rakip topu kontrol etti: hücum evresi bitti ([var] faul kayıtları da)
            if (S.mode === 'dead') {
                var d = S.dead; d.timer += DT;
                if (d.wall && d.kind === 'freekick') for (var wi = 0; wi < d.wall.ids.length; wi++) if (S.players[d.wall.ids[wi]].off) { planWall(d); if (d.wall) d.wait = Math.max(d.wait, d.timer + 3); break; }      // faulü yapan barajda yer almışken kırmızı kart görürse (sahadan atılır) baraj yeniden kurulur
                assignTargets(); movePlayers(); gaitStep();
                var tk = d.taker; B.x = d.x; B.y = d.y;
                var near = hyp(tk.x - d.x, tk.y - d.y) < 1.1 || d.kind === 'penalty' && hyp(tk.x - d.x, tk.y - d.y) < 3.2;
                if ((DEADB || (PEN14 && d.kind === 'penalty')) && d.kind !== 'throw') near = hyp(tk.x - tk.tx, tk.y - tk.ty) < (DEADB ? .3 : .25) && !(PEN14 && d.kind === 'penalty' && d.timer < d.wait - 1);      // [dead] vuruşçu topun arkasında (penaltıda koşu bitti)
                var ready = d.timer >= d.wait && (near || d.timer > d.wait + 6);
                if (d.afterGoal) ready = ready && d.timer > DEAD_GOAL;
                if (ready) { executeDead(d); keepBall = false; }
                return;
            }
            ballPending = true;
            var o = B.owner;
            if (o) {
                o.holdT = (o.holdT || 0) + DT;
                if (o.dribble && o.dribType === 'carry' && o.think > .12 && o.role !== 'GK') {      // taşırken önünde savunmacı belirdi → yeniden karar ver
                    var dr0 = S.teams[o.team].dir;
                    for (var oi = 0; oi < 22; oi++) { var oo = S.players[oi]; if (oo.team === o.team || oo.role === 'GK' || oo.off) continue; var dxo = (oo.x - o.x) * dr0; if (dxo > 0 && dxo < CARRY_STOP && Math.abs(oo.y - o.y) < 2.6 + dxo * .3) { o.think = 0; break; } }
                }
                if (ctlOn(o)) ctlOwner(o);
                else if (o.think > 0) o.think -= DT;
                else if (TOUCH && o.role !== 'GK' && ((o.gapNow || 0) > .8 || (TC_PHYS && o.cr && o.cr.pend) || (TC_RCV && B.z > .3)) && (o.waitT = (o.waitT || 0) + DT) < .5) { }      // [touch] top ayaktan açık: bir sonraki dokunuşu bekler
                else { o.waitT = 0; decide(o); }
            }
            assignTargets(); ctlMove(); movePlayers(); gaitStep(); ballStep();      // [motor] adim evresi
            if (B.owner) duels();
            if (S.pass && S.pass.active && !B.high && hyp(B.vx, B.vy) < 1.5 && !B.owner) { S.pass = null; }
        }

        // ---------- dış API ----------
        function pos(tm) { return S.teams[tm].st.poss; }
        S.step = step;
        S.setTactics = function (tm, o) { S.teams[tm].tac = normTac(o); return S.teams[tm].tac; };
                // [port] oyuncu değişikliği: slot idx (takım*11 + FORM sırası) yeni oyuncuyu alır; rol ve konum aynı kalır
        S.sub = function (idx, ro) {
            var p = S.players[idx]; if (!p || p.off || !ro || !ro.a) return null;
            var a = {}, k, outN = p.name, outDb = p.db; for (k in p.a) a[k] = p.a[k]; for (k in ro.a) a[k] = ro.a[k];
            if (p.role === 'GK' && !(a.gk > 0)) a.gk = 45;
            p.a = a; p.name = ro.name; p.short = ro.short || ro.name; p.db = ro.db || null;
            if (ro.ft === 'L' || ro.ft === 'R') p.ft = ro.ft; if (ro.wf >= 1 && ro.wf <= 5) p.wf = Math.round(ro.wf);
            p.maxV = AV_MOVE && CURVE ? avMaxV(a) : CURVE ? 6.2 + .0395 * a.pac : 5.6 + .032 * a.pac; p.acc = AV_MOVE && CURVE ? avAcc(a) : CURVE ? 4.8 + .028 * a.pac : 6.5; p.agK = agilK(a, p.role);      // [v137]
            p.stam = 1; p.yc = 0; p.nf = 0; p.dec = null; p.run = null;
            p.br = makeBrain(a, p.role, !!ro.db, BR_ON, opts.brainBase); trApply(p, ro);
            if (FATIGUE) { p.stamCap = 1; p.ana = 1; p.anaD = 0; p.staK = clamp(1 - FT_STA * ((a.sta != null ? a.sta : 80) - 80) / 15, .5, 1.6) * Math.pow(FT_EM / (FT_ROLE[p.role] || FT_EM), FT_RN); }
            S.audit.accCap = Math.max(S.audit.accCap || 0, p.acc);
            if (AICAL) calcQ();
            emit('SUB', { team: p.team, p: p.id, x: p.x, y: p.y, meta: { outName: outN, outDb: outDb, inName: p.name } });
            return p;
        };
        S.refApply = function (dec) {      /* [port] dec: { call: 'pen'|'fk'|'none'|'adv'|'sim'|'gol'|'ofs'|'faul', card: 'none'|'Y'|'R', why, to: 'd'|'o' } */
            var A = S.refAsk; if (!A) return false; S.refAsk = null; S.refHold = false; dec = dec || {};
            if (A.kind === 'goal') { if (dec.call === 'gol') A.go(); else A.no(); return true; }
            if (A.kind === 'gline') { if (dec.call === 'gol') S.awardGoal(A.team, A.scorer); return true; }
            if (A.kind === 'out') {
                if (A.sub === 'throw') { var tk2 = dec.call === 'T0' ? 0 : dec.call === 'T1' ? 1 : A.tk; if (tk2 !== A.tk) startDead('throw', tk2, { x: A.x, y: A.y }); }
                else if (dec.call && dec.call !== A.truth.call) { if (dec.call === 'corner') startDead('corner', A.atk, { x: A.line, y: A.cy0 }); else startDead('goalkick', A.def, { x: A.line === PW ? PW - 5.5 : 5.5, y: A.gky }); }
                return true;
            }
            if (A.kind === 'offs') { var op = S.players[A.p];
                if (A.flag) { if (dec.call === 'devam' && op && !op.off) { S.mode = 'live'; S.dead = null; B.owner = op; B.x = op.x; B.y = op.y; B.z = 0; B.vx = B.vy = B.vz = 0; B.high = null; B.last = op; S.lastTeam = op.team; S.pass = null; S.shot = null; op.think = .3; } }
                else if (dec.call === 'ofs' && op) { S.pass = null; S.shot = null; B.owner = null; S.teams[op.team].st.offsides++; startDead('freekick', 1 - op.team, { x: clamp(op.x, 1, PW - 1), y: clamp(op.y, 1, PH - 1) }, { indirect: true }); }
                return true;
            }
            var d = S.players[A.d], o = S.players[A.o];
            if (dec.call === 'none' || dec.call === 'adv') { var pp = dec.call === 'adv' ? o : d; if (pp && !pp.off) { S.mode = 'live'; S.dead = null; B.owner = pp; B.x = pp.x + (pp.fx || 0) * .5; B.y = pp.y; B.z = 0; B.vx = B.vy = B.vz = 0; B.high = null; B.last = pp; S.lastTeam = pp.team; S.pass = null; S.shot = null; pp.think = .35; } }
            else if (dec.call === 'sim') startDead('freekick', d.team, { x: clamp(o.x, 1, PW - 1), y: clamp(o.y, 1, PH - 1) }, { indirect: true });
            else if (dec.call === 'pen') startDead('penalty', o.team, { x: atkGoalX(o.team) - S.teams[o.team].dir * 11, y: CY });
            else startDead('freekick', o.team, { x: clamp(o.x, 1, PW - 1), y: clamp(o.y, 1, PH - 1) });
            var cp = dec.to === 'o' ? o : d, vic = cp === d ? o : d;
            if (cp && !cp.off && dec.card === 'Y') { if ((cp.yc || 0) >= 1) { cp.yc++; cardEv(cp, vic, 'R', 'ikinci_sari', true, dec.call === 'pen'); sendOff(cp); } else cardEv(cp, vic, 'Y', dec.why || 'faul', false, dec.call === 'pen'); }
            else if (cp && !cp.off && dec.card === 'R') { cardEv(cp, vic, 'R', dec.why || 'sert', false, dec.call === 'pen'); sendOff(cp); }
            return true;
        };
        S.awardGoal = function (tm, sid) { S.teams[tm].score++; B.owner = null; B.high = null; S.shot = null; S.pass = null; emit('GOAL', { team: tm, p: sid != null ? sid : -1, meta: { awarded: true } }); startDead('kickoff', 1 - tm, { x: CX, y: CY }, { afterGoal: true }); placeAfterGoal(1 - tm); };
        S._outAsk = function (inf) { if (S.refAsk || !S.refAllFn || !S.refAllFn(inf)) return; S.refAsk = inf; S.refHold = true; };
        S.cardNow = function (pid, kind, why) { var p = S.players[pid]; if (!p || p.off) return false; if (kind === 'Y') { if ((p.yc || 0) >= 1) { p.yc++; cardEv(p, null, 'R', 'ikinci_sari', true, false); sendOff(p); } else cardEv(p, null, 'Y', why || 'sportmenlik', false, false); } else { cardEv(p, null, 'R', why || 'siddet', false, false); sendOff(p); } return true; };
        S.sendOff = function (idx) { var p = S.players[idx]; if (!p || p.off) return false; sendOff(p); return true; };
        S.startPen = function (tm, slot) {
            if (!S.takers) S.takers = [{}, {}]; if (!S.takers[tm]) S.takers[tm] = {}; if (slot != null) S.takers[tm].pen = slot;
            S.finished = false; startDead('penalty', tm, { x: atkGoalX(tm) - S.teams[tm].dir * 11, y: CY });
            return S.dead;
        };

        S.tactics = function (tm) { var t = S.teams[tm].tac; return { ment: t.ment, tempo: t.tempo, line: t.line, press: t.press, width: t.width, gk: t.gk }; };
        S.run = function (sec) { var n = Math.round(sec / DT) + 1; for (var i = 0; i < n && !S.finished; i++) step(); };
        S.possPct = function () { var a = pos(0), b = pos(1), s = a + b || 1; return [Math.round(100 * a / s), 100 - Math.round(100 * a / s)]; };
        S.C = { PW: PW, PH: PH, CX: CX, CY: CY, GW: GW, GY0: GY0, GY1: GY1, PA_D: PA_D, PA_Y0: PA_Y0, PA_Y1: PA_Y1, DT: DT, ROLE_TR: ROLE_TR, HALF_S: HALF_S, FULL_S: FULL_S, CLOCK_S: CLOCK_S, CK: CK };
        S.clock = function () { return S.t * CK; };
        S.audit.accCap = Math.max.apply(null, S.players.map(function (p) { return p.acc; }));
        S.footFor = footFor;
        S._lab = { setOwner: function (p) { S.mode = 'live'; S.dead = null; B.owner = p; B.x = p.x + p.fx * .55; B.y = p.y; B.vx = B.vy = 0; B.high = null; B.last = p; S.lastTeam = p.team; S.pass = null; S.shot = null; }, movePlayers: movePlayers, doPass: doPass, doShot: doShot, resolveAerial: resolveAerial, duels: duels, gkOf: gkOf, fgOpen: fgOpen };
        S.ball3d = BALL3D;
        S.av = { XG: AV_XG, SHOT: AV_SHOT, DRAG: AV_DRAG, PASS: AV_PASS, GK: AV_GK, MOVE: AV_MOVE, OUT: AV_OUT, ATTR: AV_ATTR, TRIG5: AV_TRIG5, LATE: AV_LATE, HL: !!PRM.AV_HL };      // [av] görüntü / köprü katmanı için
        S.cardsOn = CARDS_ON; S.varOn = VAR_ON; S.ctxUrg = function (tm) { return BR_ON ? ctxUrg(tm) : 0; }; S.passOptions = passOptions; S.rdec = rdec; S.posValue = posValue; S.xgAt = xgAt; S.xgRepAt = function (x, y, tm, pd, kind) { return xgRep(xgFeat(x, y, tm, pd, kind), kind); }; S.inBox = inBox; S.bestPass = bestPass; S.atkGoalX = atkGoalX; S.ownGoalX = ownGoalX; S.rollSpeed = rollSpeed; S.hiStep = hiStep; S.aero = BL_AERO; S.ballE = BL_E; S.ballHret = BL_HRET;
        if (AICAL) calcQ();      // [aical] takım güçleri
        placeKickoff(0); startDead('kickoff', 0, { x: CX, y: CY }, { first: true });
        emit('KICKOFF', { team: 0 });
        return S;
    }
    var api = { create: create, roleBase: roleBase, C: { PW: PW, PH: PH, CX: CX, CY: CY, GW: GW, GY0: GY0, GY1: GY1, PA_D: PA_D, PA_Y0: PA_Y0, PA_Y1: PA_Y1, DT: DT, HALF_S: DEFAULTS.MATCH_S / 2, FULL_S: DEFAULTS.MATCH_S, CLOCK_S: CLOCK_S, CK: CLOCK_S / DEFAULTS.MATCH_S }, FORM: FORM, ROLE_TR: ROLE_TR };
    if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Sim2D = api;
})(typeof window !== 'undefined' ? window : globalThis);

