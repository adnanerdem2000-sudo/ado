/* =====================================================================
   ADOBALL · CANLI 2D MAÇ MODU  (üçüncü betik: köprü)
   Motor betiğine (ilk <script>) dokunmaz. 2D maç motoru (Sim2D), spiker (Comm2D) ve veritabanı
   bağdaştırıcısı (DB2D) bu betikten önce yüklenir. Bu dosya yalnızca:
     1) oyunun kadrolarını (matchData.h / matchData.a) 2D motora verir,
     2) 2D motorun olaylarını oyunun mevcut kayıt sistemine yazar
        (skor, oyuncu istatistiği, reyting, kritik anlar, anlatım, turnuva sonucu),
     3) sahayı çizer.
   Motorda bulunmayan hiçbir veri uydurulmaz: her sayı 2D simülasyonun olay günlüğünden gelir.
   ===================================================================== */
(function () {
    'use strict';
    var G = window;
    function $(id) { return document.getElementById(id); }
    function warn(w, e) { try { console.warn('[adoball-2d] ' + w, e); } catch (_) { } }
    /* [opt] DOM yazımı yalnızca değer değişince (aynı metni yeniden yazmak da yerleşimi geçersiz kılar). textContent okumak yerleşim zorlamaz. */
    function setTxt(el, s) { if (el && el.textContent !== s) el.textContent = s; }
    /* [opt] görünmez tam ekran katmanlar (gol/devre/şampiyon/aksiyon): opaklık 0 iken içlerindeki sonsuz 'pop' animasyonları ve bulanık arka
       plan her karede stil/çizim yaptırıyordu - etkin değilken gizli (solma geçişi korunur) ve animasyonsuz. Canlı noktası kendi katmanında. */
    (function () { try { if (document.getElementById('ab-opt-style')) return; var st = document.createElement('style'); st.id = 'ab-opt-style';
        st.textContent = '.gol-effect:not(.active),.action-effect:not(.active){visibility:hidden;transition:opacity .25s ease,visibility 0s linear .25s}' +
            '.gol-effect:not(.active) *,.action-effect:not(.active) *{animation:none!important}.live-dot,.ab-hud-comm .dot{will-change:transform,opacity}' +
            'body.ab-stat-off .stat-bar-home,body.ab-stat-off .stat-bar-away,body.ab-stat-off .cmp-bar i{transition:none}';
        document.head.appendChild(st); } catch (e) { } })();
    /* [opt] istatistik paneli ekranda değilken çubuk genişlik geçişi kapalı: değer değişince tek yerleşim, karede değil */
    (function () { try { var b = document.getElementById('bar-pos-home'), el = b && b.closest ? b.closest('.stats-container') : null; if (!el || !G.IntersectionObserver) return;
        new IntersectionObserver(function (es) { document.body.classList.toggle('ab-stat-off', !es[es.length - 1].isIntersecting); }).observe(el); } catch (e) { } })();
    if (typeof Sim2D === 'undefined' || typeof Comm2D === 'undefined' || typeof DB2D === 'undefined' || typeof Rating2D === 'undefined') { warn('bileşenler yüklenmedi'); return; }

    var C = Sim2D.C, PW = C.PW, PH = C.PH, DT = C.DT, SIM_TOTAL = C.FULL_S, CK = C.CK || 1;      // SIM_TOTAL: fiziksel maç uzunluğu (sn) · CK: maç saati çarpanı (saat = sim.t · CK; 90 dk'ya ölçeklenir)
    // Taban tempo (1 gerçek sn = N SİMÜLASYON sn; oyuncu/top hızı bu çarpanla akar). 1x = 3: eskiden 8 idi, top saniyede ekranı geçiyordu.
    // Maç 1400 sim-sn'dir ve saat 90 dakikaya ölçeklenir (CK ≈ 3,9): görünen oyun hızı aynı kalır, maç 1x'te ≈ 8 dk, 2x'te ≈ 4 dk, 4x'te ≈ 2 dk sürer (½x ≈ 16 dk).
    // Üzerine "akıllı tempo" biner: tehlikeli anlarda yavaşlar, ölü toplarda ve kendi yarı sahada hızlanır (ortalama ≈ 1).
    var SPEEDS = { '0.5': 1.5, 1: 3, 2: 6, 4: 12 };
    var SPEEDS3 = { '0.5': .5, 1: 1, 2: 2, 4: 4 }, LEN_BASE3 = { wide: 17, key: 10, fm: 7 };      // [fiz] 3B: fiziksel gercek zaman; 1x'te olculen mac suresi (dk)
    function liveSpeed() { return S.raw ? S.speed : S.use3 ? (SPEEDS3[String(S.preset)] || 1) : S.speed; }
    function lkEff() { var k = S.lk || 1; if (!(S.use3 && !S.raw && S.watch === 'wide')) return k; var c = Math.min(k, 1.5), u = Math.max(0, Math.min(1, (S.pace - 1) / .5)); u = u * u * (3 - 2 * u); return c + (k - c) * u; }      // [v133] tehlikeli oyun tavanina yumusak gecis (eski esik tek karede 2.3 kat sicratiyordu)
    /* [v135] FM tarzi gosterim gecikmesi (3B canli): simulasyon gorunumun DL.D sim-sn ONUNDE kosar; goruntu halka kayittan (ringView) DL.dT aninda cizilir.
       Aksiyonlar (vurus/kafa/mudahale/blok/karsilama) olay aninda sim saatinde kurulur ve temas ani topun hiz degistirdigi kareye (ev.t - DT) cekilir: ayak topa tam
       temasta degir, top ayagin oldugu yerden cikar (FM / FIFA "contact sync"). Skor, spiker, ses, gol/kart/VAR duraklamalari olay GORUNTUYE ulasinca islenir. */
    var DL = { on: 0, dT: 0, q: [], fz: 0, D: .32 }, DLV = null, DL_ACT = { 11: 1, 12: 1, 17: 1, 18: 1 };
    function dlWant() { return !!(S.use3 && S.r3 && !S.r3.lost && mode === '2d' && !S.raw && !G.__abLive && S.watch !== 'fm' && !S.skip && !(S.sim && S.sim.userRef) && S.ring && S.ring.n > 4); }
    function dlFlush(all) {      // goruntu saatine gelen olaylar (gol/kart/VAR duraklamasi baslarsa durur)
        var q = DL.q;
        while (q.length && (all || !S.hold)) { var e = q[0]; if (!all && e.t - DT > DL.dT + 1e-6) break; q.shift(); try { handle(e); } catch (x) { warn('olay ' + e.type, x); } }
    }
    function dlOff() { if (!DL.on) return; DL.on = 0; dlFlush(true); DL.fz = 0; if (S.sim) DL.dT = S.sim.t; }
    /* [v188] görüntü saatine düşen halka karesi kayıtlı sim zamanından bulunur. Eskiden kare = n1 - (sim.t - görüntü saati) / DT idi; top ölüyken sim saati
       adım başına 3·DT ilerlediği için (AV_CLKD) canlıdan ölüye geçişte (top dışarı, faul, gol) görüntü her ölü adımda 2 kare GERİ sıçrıyordu: top ileri-geri
       titriyor (testere), gol vuruşunun son ~.3 sn'si çizgiye varmadan donuyordu. */
    var V8B = { dl: 1, gt: 1, ld: 1, an: 1 };
    function dlFa(R, lo, n1, t) {
        var b = R.buf, tl = b[(lo % RING) * FS], th = b[(n1 % RING) * FS];
        if (!(th >= tl)) return -1; if (t >= th) return n1; if (t <= tl) return lo;
        var a = lo, c = n1, m; while (c - a > 1) { m = (a + c) >> 1; if (b[(m % RING) * FS] <= t) a = m; else c = m; }
        var ta = b[(a % RING) * FS], tc = b[(c % RING) * FS]; return a + (tc > ta + 1e-9 ? Math.min(1, (t - ta) / (tc - ta)) : 0);
    }
    function dlView() {      // goruntu saatindeki kare (halka kayit, kareler arasi ara deger) - canlidaki gibi aksiyon saati payi (clkOff) ile
        var R = S.ring, sim = S.sim, n1 = R.n - 1, lo = Math.max(0, R.n - RING + 3), fa = n1 - (sim.t - DL.dT) / DT; if (V8B.dl) { var fa8 = dlFa(R, lo, n1, DL.dT); if (fa8 >= 0) fa = fa8; } if (fa < lo) fa = lo; if (fa > n1) fa = n1;
        if (!DLV) DLV = newView();
        var v = ringView(fa, n1, DLV), fo = S.clkOff || 0, i0 = Math.floor(fa); if (fo) { v.dtl += fo; v.dtp += fo; if (v.dtn > 0) v.dtn += fo; }
        v.dead = S.ring.buf[(Math.min(n1, i0 + (fa - i0 > .5 ? 1 : 0)) % RING) * FS + 5] === 1 ? 1 : 0; S.viewT = DL.dT;
        try { dlCushion(v, fa, lo, n1); } catch (e) { }
        return v;
    }
    /* [v139] yumusak ilk dokunus (cushion): kayitta gorunen andan en cok ~.22 sn once, topu yeni alan oyuncunun ilk temasi (hiz kirilimi) varsa
       gorunen top temastan sonra gelis hizini birden kaybetmez: O(t) = (v_gelis - v_cikis)·dt·e^(-dt/tau) (temas aninda 0, hiz surekli, en cok ~.2 m), sonra motor topuna doner */
    var CU_TAU = .045;
    function dlCushion(v, fa, lo, n1) {
        var b = S.ring.buf, i0 = Math.floor(fa), j, k, best = -1;
        for (j = i0; j > Math.max(lo + 2, i0 - 6); j--) {
            var oj = (j % RING) * FS, om = ((j - 1) % RING) * FS, ow = b[oj + 4]; if (ow < 0 || b[om + 4] !== ow || b[oj + 5] === 1) continue;
            var op = ((j + 1) % RING) * FS; if (j + 1 > n1 || b[op + 4] !== ow) continue;
            var vix = (b[oj + 1] - b[om + 1]) / DT, viy = (b[oj + 2] - b[om + 2]) / DT, viz = (b[oj + 3] - b[om + 3]) / DT, vox = (b[op + 1] - b[oj + 1]) / DT, voy = (b[op + 2] - b[oj + 2]) / DT, voz = (b[op + 3] - b[oj + 3]) / DT;
            var vin = Math.hypot(vix, viy, viz), dv = Math.hypot(vix - vox, viy - voy, viz - voz); if (vin < 3 || dv < 2.5 || Math.hypot(vox, voy, voz) > vin * .8) continue;
            var fresh = false; for (k = 2; k < 38 && j - k > lo; k++) { if (b[((j - k) % RING) * FS + 4] !== ow) { fresh = true; break; } } if (!fresh) continue;      // yalniz yeni alinan top (ilk dokunus)
            best = j; break;
        }
        if (best < 0) return;
        var ob = (best % RING) * FS, obm = ((best - 1) % RING) * FS, obp = ((best + 1) % RING) * FS, tt = (fa - best) * DT; if (tt <= 0) return;
        var ex = Math.exp(-tt / CU_TAU) * tt, dx = ((b[ob + 1] - b[obm + 1]) - (b[obp + 1] - b[ob + 1])) / DT * ex, dy = ((b[ob + 2] - b[obm + 2]) - (b[obp + 2] - b[ob + 2])) / DT * ex, dz = ((b[ob + 3] - b[obm + 3]) - (b[obp + 3] - b[ob + 3])) / DT * ex, dl = Math.hypot(dx, dy, dz);
        if (dl > .2) { dx *= .2 / dl; dy *= .2 / dl; dz *= .2 / dl; }
        v.bx += dx; v.by += dy; v.bz = Math.max(0, v.bz + dz); v.cuT = tt;
        return v;
    }
    function gkHandAt(t) {      // [v135] gorunen anda topu elinde tutan kaleci (gunlukten, tur 3)
        var G3 = S.gk; if (!G3) return -1; var b = G3.log, n = Math.min(G3.ln, GKL_N), h = -2, i, o;
        for (i = G3.ln - 1; i >= G3.ln - n; i--) { o = (i % GKL_N) * GKL_W; if (b[o] === 3 && b[o + 1] <= t + 1e-6) { h = b[o + 2]; break; } }
        return h === -2 ? G3.hand : h;
    }
    var LIVE3_CAP = 2.4;      // [v133] 3B genis ozet: canli oyunda gorunen hiz tavani (mac suresi kisaltmasi lk bunu asarsa lk)      // [fiz] 3B genis ozet: tehlikeli oyun en cok 1.5 kat
    var PREF_KEY = 'adoball_2d_v1';                             // yalnızca 2D modun kendi tercihleri (oyunun fm_*_v16 anahtarlarına dokunulmaz)
    var MAP = [0, 1, 2, 3, 4, 5, 6, 8, 7, 9, 10];               // oyun kadro sırası (KL SLB STP STP SĞB MDO MO MOO SLK SĞK SF) -> motor dizilimi (4-2-3-1)
    var KEY_TYPES = { GOAL: 1, SHOT: 1, FOUL: 1, CORNER: 1, POST: 1, SAVE: 1, OFFSIDE: 1, CARD: 1, VAR: 1 };
    var KEY_PACE = { GOAL: 1, SHOT: 1, SAVE: 1, POST: 1, CORNER: 1, CARD: 1, VAR: 1 };       // "Kritik anlar" modunda bu olaylardan sonra sonuç görülene dek normal tempoda kalınır
    var KEY_TAIL = 4;                                                       // sim sn
    var MAX_RATE = 120;                                                     // sim sn / gerçek sn üst sınırı (ileri sarmada tarayıcı kare başına en çok ~50 adım işler)
    var RING = 400, RO = 6 + 22 * 4, FS = RO + 26;      // [v139] RO+25: topun yan donusu (motor B.sps, devir/sn; serbest canli topta)
         // [yan] RO+13..24: yan hakemler (x, y, fx, fy, isaret, isaret degeri) x 2      // [fiz] RO+11 sonraki planli dokunus ani, RO+12 ayagi      // [carry] RO+4..10: görünen top sürme (son dokunuş, döngü, sayaç, tür, önceki dokunuş, açık, sahibin adım evresi)               // gol tekrarı için son 16 sn'lik kare tamponu (kare başına: t, top x/y/z, top sahibi, ölü top bayrağı, 22 x [x y fx fy], hakem [x y fx fy])
    var MB = 38;                                                // tuval alt boşluğu (px): yedek kulübeleri ve hakem inceleme alanı (VAR monitörü) sahanın hemen dışında çizilir
    var ICON_BALL = '<svg class="ico" aria-hidden="true" focusable="false"><use href="#ab"/></svg>';

    var mode = 'classic';
    function newVirt() { return { '0.5': 0, 1: 0, 2: 0, 4: 0 }; }
    var S = { sim: null, feed: null, sid: -1, running: false, hold: null, speed: SPEEDS[1], acc: 0, prev: [], prevB: { x: 0, y: 0 }, raf: 0, last: 0,
        skip: false, keyHit: false, halfPending: false, focus: null, trail: [], ov: { dec: false, ctl: false, trail: false, names: false }, cols: ['#e60023', '#00a3ff'],
        eng2db: [], db2eng: {}, pst: {}, dirty: false, ratingTimer: 0, statTimer: 0, hover: null, seed: 0, boot: false, dist: [],
        preset: 1, smart: true, replayOn: true, zoom: false, pace: 1, raw: false, rpCount: 0, virt: { wide: newVirt(), key: newVirt() },
        watch: 'wide', keyUntil: -1, rt: null, rtDisp: [], xiKey: '', xiBall: -2, xiHl: -1, tab: 'key',
        ring: { n: 0, buf: new Float32Array(RING * FS) }, rp: null, goalInfo: null, lastShot: null, cam: { x: 52.5, y: 34, z: 1, tx: 0, ty: 0 },
        ref: null, vs: null, refCard: null, pumpAt: 0, varCount: 0, cards: { y: 0, r: 0 }, penVar: null, penShotVar: false, hoverRef: false,
        tac: [tacZero(), tacZero()], tacOk: [false, false], tacOpen: false, tacPurpose: '', tacResume: false, tacBefore: null, tacOpener: null,
        view: '2d', viewSet: false, cam3: 'bcast', camStyle: 'std', gfx: 'auto', gfxAuto: '', use3: false, r3: null, r3fail: false, r3key: '', r3size: '', gc: null, gg: null, lastV: null };

    function loadPrefs() {
        try {
            var o = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
            if (o.replay === false) S.replayOn = false; if (o.smart === false) S.smart = false; if (o.zoom === true) S.zoom = true;
            if (o.speed != null && SPEEDS[String(o.speed)]) S.preset = +o.speed;
            if (o.watch === 'key' || o.watch === 'fm') S.watch = o.watch;
            if (o.view === '3d' || o.view === '2d') { S.view = o.view; S.viewSet = true; } if (o.cam3 === 'full' || o.cam3 === 'bcast') S.cam3 = o.cam3;
            if (o.camStyle === 'std' || o.camStyle === 'low' || o.camStyle === 'high') S.camStyle = o.camStyle;
            if (o.gfx === 'auto' || o.gfx === 'low' || o.gfx === 'mid' || o.gfx === 'high') S.gfx = o.gfx;                       // 3B görüntü kalitesi (yalnızca bu anahtarın YENİ alanı - fm_*_v16'ya dokunmaz)             // yayın kamerası açısı: 3B Yayın modunda kullanılan öntanımlı/alçak/geniş açı tercihi (yalnızca bu YENİ anahtara ait alan - fm_*_v16'ya dokunmaz)
        } catch (e) { }
    }
    function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify({ replay: S.replayOn, smart: S.smart, zoom: S.zoom, speed: S.preset, watch: S.watch, view: S.view, cam3: S.cam3 === 'loca' ? 'bcast' : S.cam3, camStyle: S.camStyle, gfx: S.gfx })); } catch (e) { } }
    loadPrefs();
    if (!S.viewSet) { try { S.view = (G.Ado3D && Ado3D.supported() && Ado3D.hw() && !(navigator && navigator.webdriver)) ? '3d' : '2d'; } catch (e) { S.view = '2d'; } }        // ilk açılışta 3B (destek varsa); otomasyon (test) tarayıcılarında 2B

    /* ---------- kadro -> motor ---------- */
    function teamRoster(t) {
        var arr = new Array(11);
        t.squad.forEach(function (id, i) { arr[MAP[i]] = DB2D.toEngine(getPlayerFromId(id)); });      // kayıt yoksa / bozuksa null → motor o yuvada jenerik oyuncu kullanır (çökmez)
        return arr;
    }
    // Beyin tabanları: rol başına ortalama/sd, oyuncu veritabanının O ANKİ hâlinden canlı hesaplanır (özellikler toplu değişse bile etiketler rolüne göre doğru kalır)
    function brainBase() {
        try { return Sim2D.roleBase((G.playerDatabase || playerDatabase || []).map(function (r) { return DB2D.toEngine(r); })); } catch (e) { warn('beyin tabanı', e); return undefined; }
    }
    function takerIdx(t, id) { if (id == null) return null; var i = t.squad.indexOf(id); return i < 0 ? null : MAP[i]; }
    function takers(t) { return { pen: takerIdx(t, t.penaltyTakerId), fk: takerIdx(t, t.freeKickTakerId), cor: takerIdx(t, t.cornerTakerId) }; }

    function newSeed() { return (G.__ab2d_seed != null) ? (G.__ab2d_seed >>> 0) : ((Date.now() ^ (Math.random() * 4294967296)) >>> 0); }

    function prepare() {
        var h = matchData.h, a = matchData.a; if (!h || !a) return;
        S.seed = newSeed();
        S.tac = G.__abTac ? [tacNorm(G.__abTac[0]), tacNorm(G.__abTac[1])] : [loadTac(h.name), loadTac(a.name)]; S.tacOk = [false, false]; S.tacOpen = false; { var tov = $('tac-overlay'); if (tov) { tov.hidden = true; tov.innerHTML = ''; } document.body.classList.remove('tac-open'); }
        var sim = S.sim = Sim2D.create({ seed: S.seed, names: [h.name, a.name], curve: 'elite', roster: [teamRoster(h), teamRoster(a)], takers: [takers(h), takers(a)], spr: G.__abSpr || null, brainBase: G.__abNoBrainBase ? undefined : brainBase(), homes: G.__abHomes || undefined, tactics: S.tac });
        S.sid = matchSessionId;
        S.eng2db = sim.players.map(function (p) { return p.db ? p.db.id : null; });
        S.db2eng = {}; S.eng2db.forEach(function (d, i) { if (d != null) S.db2eng[d] = i; });
        S.pst = {}; S.dist = sim.players.map(function () { return 0; });
        sim.players.forEach(function (p) { S.pst[p.id] = { tk: 0, ic: 0, hd: 0, ps: 0, pok: 0, blk: 0 }; });
        S.feed = Comm2D.Feed(sim, sim.C, onLine);
        sim.onEvent = onSimEvent;
        S.rt = (window.Rating2Dv2 || Rating2D).create({ roles: sim.players.map(function (p) { return p.role; }), total: SIM_TOTAL });      // [reyting] v37 S.rtDisp = []; S.keyUntil = -1;
        S.keyUntil = -1; S.rtDisp = []; S.fm = null; S.keyHit = false; S.clkOff = 0; sqReset();      /* [port] önceki maçtan kalan kritik an süresi sıfırlanır (FM tarzı / kritik anlar modu ikinci maçta da çalışsın) */
        S.prev = sim.players.map(function (p) { return { x: p.x, y: p.y, fx: p.fx, fy: p.fy }; }); S.prevB = { x: sim.ball.x, y: sim.ball.y };      // [v133] fx/fy: bakis yonu ara degeri · [v135] prevB yorumda kalmisti
        DL.on = 0; DL.q.length = 0; DL.fz = 0; DL.dT = sim.t; S.goalPend = null; S.scHold = null;      // [v135] gosterim gecikmesi yeni macta sifirdan
        CRD.on = 0; CRD.pon = 0; CRD.own = -1; CRD.n = 0; CRD.tl = CRD.tp = -9; GPH.fill(0); GPHP.fill(0); GCK.fill(0); GSP.fill(0);      // [carry]
        for (var yi0 = 0; yi0 < 22; yi0++) YAW[yi0] = Math.atan2(sim.players[yi0].fx, sim.players[yi0].fy);      // [fiz]
        S.running = false; S.hold = null; S.acc = 0; S.skip = false; S.halfPending = false; S.focus = null; S.trail = []; S.boot = false;
        var cols = (G.ado && ado.pairColors) ? ado.pairColors(h, a) : ['#e60023', '#00a3ff'];
        S.cols = cols; S.tnames = [h.name, a.name];
        S.speed = SPEEDS[S.preset]; S.raw = false; S.pace = 1; S.rp = null; S.goalInfo = null; S.vs = null; S.refCard = null; S.pumpAt = 0; S.varCount = 0; S.cards = { y: 0, r: 0 }; S.penVar = null; S.penShotVar = false; S.hoverRef = false; S.lastShot = null; S.ring.n = 0; S.virt = { wide: newVirt(), key: newVirt() };
        refInit(); hideSkip(); gkReset(sim); spReset(); oaReset(sim);
        S.cam.x = PW / 2; S.cam.y = PH / 2; S.cam.z = 1; S.xiBall = -2; S.xiHl = -1;
        buildXI(); pushRatings(); updateXI(true);
        syncSpeedUI(); syncOptUI(); syncWatchUI(); hideReplayUI(); tacSync();
        loop();
    }
    function on() { return mode === '2d' && !!S.sim && S.sid === matchSessionId; }

    /* ---------- oyunun kayıt sistemine yazım ---------- */
    function dbOf(eid) { return eid >= 0 ? S.eng2db[eid] : null; }
    function nameOf(eid) { return eid >= 0 ? S.sim.players[eid].name : ''; }
    function shortOf(eid) { return eid >= 0 ? (S.sim.players[eid].short || S.sim.players[eid].name) : ''; }
    function teamObj(t) { return t === 0 ? matchData.h : matchData.a; }
    function fmt(t) { t *= CK; var m = Math.floor(t / 60), s = Math.floor(t % 60); return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
    function bump(eid, key) { var id = dbOf(eid); if (id != null) bumpPlayerStat(id, key); }
    /* KRİTİK ANLAR: paneline yalnızca gol (+ asist), sarı kart, kırmızı kart ve VAR kararı (iptal edilen / verilen gol) yazılır.
       km = panelin (ado.km) iki taraflı akışı çizmek için kullandığı yapı; oyunun kendi addHighlight kaydı da tutulur (Son Gelişmeler akışı okur). */
    function minOf(t) { return Math.max(1, Math.floor(t * CK / 60)); }          // ekrandaki saatin dakikası (ilk dakika 1')
    function key(km, text, type) {
        matchData.lastSimulatedMinute = Math.floor(S.sim.t * CK / 60);
        try { if (G.ado && ado.km) ado.km.next(km); } catch (e) { warn('kritik an', e); }
        addHighlight(teamObj(km.s), text, type, km.b);
        try { fmKey(km, text, type); } catch (e) { }
    }
    // VAR incelemesi sürerken skor incelemeden ÖNCEKİ değerde kalır (onaylanan gol sonuç açıklanmadan skora yansımaz)
    function scoreNow() { var sim = S.sim; if (S.scHold) return S.scHold;      // [v139] gol goruntude ilan edilene dek eski skor
        if (S.fm && S.fm.sid === S.sid && S.fm.ph === 'clip' && S.fm.sc && S.watch === 'fm') return S.fm.sc; return S.vs && S.vs.score ? S.vs.score : [sim.teams[0].score, sim.teams[1].score]; }      // [fm] önemli an oynarken skor görüntüden önce değişmez
    function syncStats() {
        var sim = S.sim, a = sim.teams[0].st, b = sim.teams[1].st, pp = sim.possPct(), sc = scoreNow();
        [[matchData.hStats, sim.teams[0], a, pp[0]], [matchData.aStats, sim.teams[1], b, pp[1]]].forEach(function (x) {
            var o = x[0]; o.goals = sc[x[1].id]; o.xg = x[2].xg; o.shots = x[2].shots; o.sot = x[2].sot; o.pass = x[2].passes; o.pos = x[3]; o.corners = x[2].corners; o.offsides = x[2].offsides || 0; o.fouls = x[2].fouls;
        });
        setTxt($('score-home'), String(sc[0])); setTxt($('score-away'), String(sc[1]));          // [opt] yalnız değişince
        matchData.currentHalf = sim.half;
        matchData.currentTimeMs = Math.max(1, Math.round(sim.t / SIM_TOTAL * matchData.totalDurationMs));
        matchData.lastSimulatedMinute = Math.floor(sim.t * CK / 60);
        var hS = matchData.hStats, aS = matchData.aStats, sk = S.sid + '|' + hS.pos + '|' + hS.xg + '|' + hS.shots + '|' + hS.sot + '|' + hS.pass + '|' + hS.corners + '|' + hS.offsides + '|' + hS.fouls + '|' + aS.pos + '|' + aS.xg + '|' + aS.shots + '|' + aS.sot + '|' + aS.pass + '|' + aS.corners + '|' + aS.offsides + '|' + aS.fouls;
        if (sk !== S.statKey) { S.statKey = sk; updateStatUI(); }                                    // [opt] istatistik paneli (~25 DOM yazımı) yalnız değişince
    }

    /* =====================================================================
       [gk] KALECİ AKSİYONLARI — arayüz tarafı (yalnızca görüntü: motor durumu ve olaylarından türetilir, simülasyona dokunmaz, RNG tüketmez)
       Olay → aksiyon: SHOT → plonjon (top yolu + kalecinin tepki süresi - motorun gkReact'iyle aynı formül; temas anı/noktası Ado3D'de
       kalecinin o anki konumuyla hesaplanır), SAVE → tuttu/çeldi, CLAIM → havadan alma (sıçrama iniş anından ~0.45 sn önce başlar),
       yavaş SAVE / kendi ceza sahasında serbest top / araya girme → elle toplama. Kalecinin elindeki top (motor ayak önünde tutar) görüntüde
       ellerde; oyuna sokma (GKD/CLEAR) motorun karar sayacından (think) önceden kurulur: kısa → yuvarlama, orta → omuz üstü atış, uzun/yüksek
       → vole. Geri pas ve taç (takım arkadaşından PASS_OK) ayakla kalır (IFAB 12.2). Penaltıda kaleci çizgide bekler (IFAB 14.1); aut
       atışında kaleci topu yere koyar, geri çekilir, koşarak vurur.
       Saat: st.clock = görünen sim zamanı (+ gol/kart/VAR duraklamasında akan pay, böylece başlamış plonjon havada donmaz).
       Tekrar: aksiyonlar ve "top elde" değişimleri sim zamanıyla halka günlüğe yazılır; tekrar aynı aksiyonları aynı karede yeniden kurar.
       ===================================================================== */
    var GKL_N = 128, GKL_W = 17, GKD_LEAD = { 4: .42, 5: .48, 6: .58 };
    function gkSm(x) { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
    function gkReset(sim) {
        var ids = [], i; if (sim) for (i = 0; i < 22; i++) if (sim.players[i].role === 'GK') ids.push(i);
        S.gk = { ids: ids, ready: new Float32Array(22), voff: new Float32Array(44), hand: -1, own: -1, hint: null, posN: 0, dist: null, claimT: -1, claimG: -1, shotG: -1,
            recP: null, recK: null, kick: null, path: new Float32Array(72 * 3), log: new Float64Array(GKL_N * GKL_W), ln: 0, tmp: new Float32Array(11), tmp2: new Float32Array(11) };
        S.clkOff = 0; S.viewT = sim ? sim.t : 0;
    }
    // günlük kaydı: [tür (1 aksiyon, 2 sonuç, 3 top elde, 4 iptal), kayıt anı (sim sn), id, a1 (aksiyon türü / sonuç), a2 (temas/bırakış), t0, d0..d10]
    function gkLog(type, tI, id, a1, a2, t0, d) {
        var G3 = S.gk, o = (G3.ln % GKL_N) * GKL_W, b = G3.log, i;
        b[o] = type; b[o + 1] = tI; b[o + 2] = id; b[o + 3] = a1; b[o + 4] = a2; b[o + 5] = t0;
        for (i = 0; i < 11; i++) b[o + 6 + i] = d ? (d[i] || 0) : 0;
        G3.ln++;
    }
    function gkSend(type, id, a1, a2, t0, d, off) {                         // çiziciye uygula (canlıda off = duraklama payı, tekrarda 0)
        var R3 = S.r3; if (!R3 || !R3.gkAct) return;
        if (type === 1) { var dd = S.gk.tmp2, i; for (i = 0; i < 11; i++) dd[i] = d ? (d[i] || 0) : 0; if (a1 === 1) dd[0] += off; R3.gkAct(id, a1, t0 + off, a2 + off, dd); }
        else if (type === 2) R3.gkOut(id, a1, t0 + off, d ? d[0] : 0, d ? d[1] : 0, d ? d[2] : 0);
        else if (type === 4) R3.gkCancel(id, t0 + off);
        else if (type === 5) { if (R3.spUpd) R3.spUpd(id, a1, a2 + off, d, t0 + off); }               // [sp] duran top aksiyonu güncellemesi
        else if (type === 6) { if (R3.spCancel) R3.spCancel(id, t0 + off); }                          // [sp] duran top aksiyonu iptali
        else if (type === 7) { if (R3.oaOut) R3.oaOut(id, a1, t0 + off, a2 > 0 ? a2 + off : 0); }    // [oa] oyuncu aksiyonu sonucu (kafa kazandı/kaybetti, kart)
    }
    function gkIssue(type, id, a1, a2, t0, d) { var t = S.sim ? S.sim.t : 0;
        var tR8 = t - DT;      // [v188] denendi: t'ye kaydırmak top çıkışını 1 kare öne aldı ama temas karesinde ayak-top uzaklığını büyüttü (ölçüm) - eski hâli
        if (DL.on && type === 1 && DL_ACT[a1] && t0 < t - 1e-6 && a2 > tR8 + 1e-6) { var sh = a2 - tR8, t0n = Math.max(DL.dT + .02, t0 - sh); if (t0n < a2 - sh - .02) { t0 = t0n; a2 -= sh; } }      // [v135] tepkisel temas (vurus/kafa/mudahale/blok) topun hiz degistirdigi ana: gosterim gecikmesi hazirligi onceden oynatir
        gkLog(type, t, id, a1, a2, t0, d); gkSend(type, id, a1, a2, t0, d, S.clkOff || 0); }
    function gkHandSet(id, t, h) { var G3 = S.gk; if (G3.hand === id) return; G3.hand = id; if (id >= 0) { G3.posN++; G3.handT = t; G3.handH = h || null; G3.pk = null; } gkLog(3, t, id, 0, 0, t, null); }
    function gkDistKind(hi, dist) { return hi ? 6 : dist < 24 ? 4 : 5; }
    function gkDistData(d, p, tx, ty, dist) { d[0] = tx; d[1] = ty; d[2] = dist; d[3] = p.ft === 'L' ? -1 : 1; d[4] = p.ft === 'L' ? -1 : 1; for (var i = 5; i < 11; i++) d[i] = 0; }
    /* oyuna sokma türü kestirimi (önceden kurmak için): motorun kaleci kararıyla aynı seçenek listesi, gürültüsüz (RNG tüketmez); yüksek = >40 m (uzun talimatta >30) */
    function gkPredictDist(o) {
        var sim = S.sim, gkl = 0, l, best = null, bs = -1e9, i, sc;
        try { gkl = (sim.tactics(o.team) || {}).gk || 0; l = sim.passOptions(o, false, 6, true); } catch (e) { l = []; }
        for (i = 0; i < l.length; i++) { if (gkl < 0 && l[i].d > 30) continue; sc = l[i].s - (gkl > 0 && l[i].prog < 25 ? 4 : 0); if (sc > bs) { bs = sc; best = l[i]; } }
        if (!best) return { k: 6, x: o.x + sim.teams[o.team].dir * 35, y: PH / 2, d: 40 };
        return { k: gkDistKind(best.d > (gkl > 0 ? 30 : 40), best.d), x: best.q.x, y: best.q.y, d: best.d };
    }
    var GV_ON = 1;      // [kaleci] p_kaleci_01
    function gkShot(ev) {
        var sim = S.sim, B = sim.ball, m = ev.meta || {}, T = 1 - ev.team, g = T * 11, gp = sim.players[g], G3 = S.gk, i;
        if (!gp || gp.role !== 'GK' || gp.off) return;
        var pen = m.tag === 'PEN', wide = Math.abs((m.cy != null ? m.cy : PH / 2) - PH / 2) - C.GW / 2;
        if (!m.on && !(wide < 1.1 && (m.cz || 0) < 3.4)) return;           // kaleyi bulmayan uzak şut: kaleci yalnızca izler
        var ref = gp.a ? (gp.a.gk_ref != null ? gp.a.gk_ref : gp.a.gk) : 75, react = pen ? .05 : Math.max(.15, Math.min(.4, .18 - .003 * ((ref || 75) - 75)));
        if (pen && G3.recP) G3.recP.ts = ev.t;
        var gxv = gp.x + (pen && G3.recP ? G3.recP.dx : 0), tcE = ev.t + .6, pth = G3.path, n = 72;
        if (G.Ado3D && Ado3D.ballPhys && sim.ballE != null) Ado3D.ballPhys(sim.ballE, sim.ballHret);      // [ball] kestirim motorun sekme katsayılarıyla
        if (G.Ado3D && Ado3D.gkPredict) { Ado3D.gkPredict(B.x, B.y, B.z || 0, B.vx, B.vy, B.vz || 0, pth, n); var s0 = B.x - gxv; for (i = 0; i < n; i++) if ((pth[i * 3] - gxv) * s0 <= 0) { tcE = ev.t + i * DT; break; } }
        var gvD = 0, gvK = 0;
        if (GV_ON && !pen && m.tag !== 'HEAD' && m.tag !== 'FK') {      /* [kaleci] gorunen topun kaleciye varis ani */
            var gvL = .24, gvT = Math.max(.4, 5 * gvL), gvTk = ev.t + gvL, gvDd = tcE - gvTk;
            if (gvDd >= gvT) gvD = 0;
            else if (gvDd > -gvL) { var glo = 0, ghi = 1, gu = 0; for (var gk2 = 0; gk2 < 30; gk2++) { gu = (glo + ghi) * .5; if (gu * gvT - gvL * (1 - gu) * (1 - gu) < gvDd) glo = gu; else ghi = gu; } gvD = Math.max(0, gvTk + gu * gvT - tcE); }
            else gvD = gvTk - tcE;
            gvK = gvL;
        }
        tcE += gvD;
        var ts = Math.max(ev.t + react + gvK, tcE - .42), d = G3.tmp;               // erken başlayan plonjon: temastan ~.42 sn önce (yükleme+itiş+uçuş)
        d[0] = ev.t + gvD; d[1] = B.x; d[2] = B.y; d[3] = B.z || 0; d[4] = B.vx; d[5] = B.vy; d[6] = B.vz || 0; d[7] = ev.x; d[8] = ev.y; d[9] = pen ? 1 : 0; d[10] = 0;      /* [kaleci] yol zamani gorunen topa gore */
        gkIssue(1, g, 1, tcE, ts, d); G3.shotG = g;
    }
    // kalecinin elindeki topla oyuna sokma: ayak vuruşu (R3.kick) yerine el aksiyonu - true döner
    function gkDist(ev) {
        var G3 = S.gk, m = ev.meta || {}, id = ev.p, sim = S.sim;
        if (G3.hand !== id || !sim) return false;
        var p = sim.players[id], k = ev.type === 'CLEAR' ? 6 : gkDistKind(!!m.high, m.dist || 0), d = G3.tmp, pd = G3.dist;
        var tx = ev.x2 != null ? ev.x2 : p.x + sim.teams[p.team].dir * 35, ty = ev.y2 != null ? ev.y2 : PH / 2;
        gkDistData(d, p, tx, ty, ev.type === 'CLEAR' ? 40 : (m.dist || 20));
        if (pd && pd.id === id && pd.pos === G3.posN) { if (pd.k !== k || ev.t > pd.tr + .09) gkIssue(1, id, k, Math.max(ev.t, pd.tr), pd.t0, d); }   // önceden kurulmuş: tür/an tuttuysa olduğu gibi
        else gkIssue(1, id, k, ev.t + .08, ev.t - GKD_LEAD[k] + .08, d);                                       // kurulmamış: kısa gecikmeyle bırakış
        G3.dist = null; gkHandSet(-1, ev.t);
        return true;
    }
    function gkEvent(ev) {
        var G3 = S.gk, sim = S.sim; if (!G3 || !sim) return false;
        var m = ev.meta || {}, pp = ev.p >= 0 ? sim.players[ev.p] : null, d = G3.tmp;
        switch (ev.type) {
            case 'SHOT': gkShot(ev); break;
            case 'SAVE':
                G3.shotG = -1;
                if (m.slow) { G3.hint = 'slow'; break; }                     // yavaş top kaleciye geldi: elle toplama
                if (!m.parry) G3.hint = 'catch';
                d[0] = ev.x; d[1] = ev.y; d[2] = m.z || 0; gkIssue(2, ev.p, m.parry ? 2 : 1, 0, ev.t, d); break;
            case 'CLAIM': G3.hint = 'claim'; d[0] = ev.x; d[1] = ev.y; d[2] = 1.8; gkIssue(2, ev.p, 1, 0, ev.t, d); G3.claimG = -1; break;
            case 'HEADER': if (G3.claimG >= 0) { gkIssue(2, G3.claimG, 3, 0, ev.t, null); G3.claimG = -1; } break;
            case 'BLOCK': case 'OFF': if (G3.shotG >= 0) { gkIssue(4, G3.shotG, 0, 0, ev.t, null); G3.shotG = -1; } break;
            case 'PASS_OK': if (pp && pp.role === 'GK') G3.hint = 'feet'; break;               // geri pas / taç: kaleci elle alamaz
            case 'INTERCEPT': if (pp && pp.role === 'GK') G3.hint = 'inter'; break;
            case 'PASS': if (m.tag === 'GOALKICK' && G3.recK && G3.recK.g === ev.p) G3.recK.tE = ev.t; if (m.tag === 'GKD') return gkDist(ev); break;
            case 'CLEAR': return gkDist(ev);
        }
        return false;
    }
    /* her sim adımından sonra: top sahipliği değişimi (eller/ayak), oyuna sokma ve havadan alma için önceden kurma, aut için topu yere koyma */
    function gkStep(sim) {
        var G3 = S.gk; if (!G3) return;
        var B = sim.ball, o = B.owner, oid = o ? o.id : -1, i, d = G3.tmp;
        if (oid !== G3.own) {
            G3.own = oid;
            if (G3.hand >= 0 && G3.hand !== oid) gkHandSet(-1, sim.t);
            if (o && o.role === 'GK' && sim.mode === 'live') {
                var h = G3.hint, inb = !!(sim.inBox && sim.inBox(o.x, o.y, 1 - o.team));
                if (h === 'catch' || h === 'claim' || (h !== 'feet' && inb)) {
                    gkHandSet(oid, sim.t, h);
                    if (h !== 'catch' && h !== 'claim') gkIssue(1, oid, 3, sim.t + .26, sim.t, null);   // yerden toplama
                }
            }
        }
        G3.hint = null;
        if (sim.mode !== 'live') G3.dist = null;
        // oyuna sokmayı önceden kur: motor think ≤ 0 olunca karar verir (kalan adım sayısı biliniyor)
        // (tutuş/alma/toplama aksiyonu oturmadan kurulmaz: sıçrayıştaki ya da yerdeki kaleci havada kesilmesin; kısa kalan kurulumda bırakış görüntüde
        //  en az .26 sn sonra olur - top elden çıkınca motorun topuna sönen ofsetle yetişir)
        if (G3.hand >= 0 && o && oid === G3.hand && sim.mode === 'live' && !(G3.dist && G3.dist.pos === G3.posN)) {
            var tl = (Math.ceil(Math.max(0, o.think) / DT - 1e-6) + 1) * DT, ear = G3.handT + (G3.handH === 'catch' ? .95 : G3.handH === 'claim' ? .42 : .3);
            if (tl <= .62) {
                var pk = G3.pk || (G3.pk = gkPredictDist(o));
                if (tl <= GKD_LEAD[pk.k] && (sim.t >= ear || tl <= .22)) { var trv = Math.max(sim.t + tl, sim.t + .26); gkDistData(d, o, pk.x, pk.y, pk.d); gkIssue(1, oid, pk.k, trv, sim.t, d); G3.dist = { id: oid, k: pk.k, t0: sim.t, tr: trv, pos: G3.posN }; }
            }
        }
        // havadan alma: yüksek top kalecinin ceza sahasına iniyor ve kaleci yakın → inişten ~.45 sn önce sıçramaya başlar
        var hi = B.high;
        if (!o && hi && sim.mode === 'live' && G3.claimT !== hi.t0) {
            var tl2 = hi.tLand - sim.t;
            if (tl2 > 0 && tl2 <= .5) for (i = 0; i < G3.ids.length; i++) {
                var g = G3.ids[i], gp = sim.players[g];
                if (gp.off || !(sim.inBox && sim.inBox(hi.x, hi.y, 1 - gp.team)) || Math.hypot(gp.x - hi.x, gp.y - hi.y) > 3.2) continue;
                var zl = (B.z || 0) + (B.vz || 0) * tl2 - 4.905 * tl2 * tl2;
                if (sim.aero && sim.hiStep) { var aq = G3.aq || (G3.aq = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }), ak; aq.x = B.x; aq.y = B.y; aq.z = B.z || 0; aq.vx = B.vx; aq.vy = B.vy; aq.vz = B.vz || 0; for (ak = Math.round(tl2 / DT); ak > 0; ak--) sim.hiStep(aq); zl = aq.z; }      // [ball] BL_AERO: iniş yüksekliği motorun adımıyla
                d[0] = hi.x; d[1] = hi.y; d[2] = Math.max(.6, zl); d[3] = d[4] = d[5] = d[6] = 0; d[7] = B.x; d[8] = B.y; d[9] = 0; d[10] = 1;
                gkIssue(1, g, 2, hi.tLand, sim.t + Math.max(0, tl2 - .45), d); G3.claimT = hi.t0; G3.claimG = g; break;
            }
        }
        // aut: kaleci topun yanına varınca topu yere koyar
        var dd = sim.mode === 'dead' ? sim.dead : null;
        if (!SP_ON && dd && dd.kind === 'goalkick' && dd.taker && dd.taker.role === 'GK' && (!G3.kick || G3.kick.d !== dd) && Math.hypot(dd.taker.x - dd.x, dd.taker.y - dd.y) < 1.1) {      // [sp] açıkken aut da duran top vuruşuyla (koyma, geri çekilme, koşu, temas anı)
            G3.kick = { d: dd, id: dd.taker.id, tN: sim.t }; d[0] = dd.x; d[1] = dd.y; for (i = 2; i < 11; i++) d[i] = 0;
            gkIssue(1, dd.taker.id, 7, sim.t + .3, sim.t, d);
        }
    }
    /* kare başı (görünüm): kalecilerin hazır duruşu, penaltıda çizgi ofseti, aut koşusu ofseti (motor konumu değişmez) */
    function gkFrame(v, live) {
        var G3 = S.gk, sim = S.sim, rd = G3.ready, vo = G3.voff, j, t = S.viewT;
        rd.fill(0); vo.fill(0);
        var ow = v.owner >= 0 ? sim.players[v.owner] : null, dd = live && sim.mode === 'dead' ? sim.dead : null;
        for (j = 0; j < G3.ids.length; j++) {
            var g = G3.ids[j], gp = sim.players[g], T = gp.team, gx = sim.teams[T].dir === 1 ? 0 : PW, near = Math.abs(v.bx - gx), r = 0;
            if (dd) r = dd.team !== T && (dd.kind === 'penalty' || dd.kind === 'corner' || (dd.kind === 'freekick' && Math.abs(dd.x - gx) < 35)) ? 1 : 0;   // duran top: yalnızca rakibin tehlikeli duran topunda
            else if (live && sim.shot && sim.shot.team !== T) r = 1;                                  // şut yolda
            else if (ow && ow.team !== T && near < 30) r = 1;                                          // rakip topla kaleye yakın
            else if (!ow && near < 18 && !(live && sim.pass && sim.pass.team === T)) r = 1;           // serbest top kale önünde
            if (G3.hand === g || v.owner === g) r = 0;
            rd[g] = r;
        }
        // penaltı: kaleci çizgide (motor 1.2 m önde tutar), vuruşa dek hafifçe yana salınır; vuruştan sonra ofset plonjon bitince söner.
        // Kayıt (recP) tekrarda aynı ofseti kurar.
        var rp0 = G3.recP;
        if (live && dd && dd.kind === 'penalty') {
            var gk = (1 - dd.team) * 11, gl = sim.teams[dd.team].dir === 1 ? PW : 0;
            if (!rp0 || rp0.d !== dd) rp0 = G3.recP = { d: dd, g: gk, gl: gl, din: gl === 0 ? 1 : -1, t0: t, ts: 1e9, dx: 0 };
            rp0.dx = gl + rp0.din * .12 - v.x[gk];
        }
        if (rp0 && t >= rp0.t0 - .05) {
            var pk0 = t < rp0.ts ? 1 : 1 - gkSm((t - rp0.ts - .8) / .9);
            if (pk0 > 0) { vo[rp0.g * 2] = (t < rp0.ts ? rp0.gl + rp0.din * .12 - v.x[rp0.g] : rp0.dx) * pk0; vo[rp0.g * 2 + 1] = .22 * Math.sin(Math.min(t, rp0.ts) * 2.3) * pk0; }
        }
        // aut: kayıt (recK) - canlıda vuruş anı kestirilir, tekrarda gerçekleşen an kullanılır
        var rk = G3.recK;
        if (live && dd && dd.kind === 'goalkick' && G3.kick && G3.kick.d === dd) {
            var kg = G3.kick.id;
            if (!rk || rk.d !== dd) rk = G3.recK = { d: dd, g: kg, x: dd.x, y: dd.y, dir: sim.teams[dd.team].dir, ft: sim.players[kg].ft === 'L' ? -1 : 1, tN: G3.kick.tN, tE: 1e9, tEp: 1e9 };
            rk.tEp = sim.t + Math.max(0, dd.wait - dd.timer) + DT;
            if (rk.ok == null) rk.ok = rk.tEp - rk.tN >= 2.6;                 // topa geç vardıysa (vuruş hemen) geri çekilip koşmaya vakit yok: yerinden vurur
        }
        if (rk && rk.ok && t >= rk.tN) gkKickRun(vo, v, rk, t);
        if (SP_ASIDE) spAside(vo, v, t, live);                                // [sp] topun / koşu yolunun yanındaki oyuncular kenara
    }
    /* [sp] duran top vuruşunda vurucu dışındaki oyuncular topa (< 1 m) ya da koşu yoluna (duruş noktası → topun .4 m önü, < .65 m) yakınsa
       görselde kenara çekilir (çerçeve: F vuruş yönü, L anatomik sol; önce koşu yolundan dik yönde, sonra top + koyma noktası kapsülünden radyal). Kayıt: son iki duran top */
    var SP_ASIDE = 1;
    function spAsideRec() { return { d: null, tk: -1, t0: -1e9, tc: 0, bx: 0, by: 0, ux: 0, uy: 1, sL: 0, sF: -2 }; }
    function spAside(vo, v, t, live) {
        var G3 = S.gk, sim = S.sim, RA = G3.recA || (G3.recA = [spAsideRec(), spAsideRec()]), dd = live && sim.mode === 'dead' ? sim.dead : null, R, i, r;
        if (dd && SP_ON && SP.d === dd && SP.iss && SP.tk >= 0 && SP.lk[SP.tk] === 8) {
            R = RA[0].d === dd ? RA[0] : RA[1].d === dd ? RA[1] : null;
            if (!R) { R = RA[0].t0 <= RA[1].t0 ? RA[0] : RA[1]; R.d = dd; R.t0 = t; }               // yeni duran top: eski yuvaya
            var o = SP.tk * 11, ft = SP.ld[o + 4] < 0 ? -1 : 1, D = SP.ld[o + 7], th = SP.ld[o + 8], ul = Math.hypot(SP.ld[o + 2], SP.ld[o + 3]) || 1;
            R.tk = SP.tk; R.tc = SP.lt[SP.tk]; R.bx = SP.ld[o]; R.by = SP.ld[o + 1]; R.ux = SP.ld[o + 2] / ul; R.uy = SP.ld[o + 3] / ul; R.sL = ft * D * Math.sin(th); R.sF = -D * Math.cos(th);
        }
        for (r = 0; r < 2; r++) {
            R = RA[r]; if (!R.d || t < R.t0 || t > R.tc + .9) continue;
            var w = gkSm((t - R.t0) / .5) * (1 - gkSm((t - R.tc - .25) / .6)); if (w <= .001) continue;
            var cdL = -R.sL, cdF = .4 - R.sF, cl2 = cdL * cdL + cdF * cdF || 1;
            for (i = 0; i < 22; i++) {
                if (i === R.tk || v.x[i] < -20) continue;
                var px = v.x[i] - R.bx, py = v.y[i] - R.by; if (px * px + py * py > 25) continue;
                var L = px * R.uy - py * R.ux, F = px * R.ux + py * R.uy, TL = L, TF = F;
                var u = Math.max(0, Math.min(1, ((TL - R.sL) * cdL + (TF - R.sF) * cdF) / cl2)), qL = R.sL + cdL * u, qF = R.sF + cdF * u, eL = TL - qL, eF = TF - qF, ed = Math.sqrt(eL * eL + eF * eF);
                if (ed < .65) {                                                 // koşu yolunda: dik yönde (yol üstündeyse duruş noktasının karşı tarafına)
                    if (ed < .02) { eL = -cdF; eF = cdL; ed = Math.sqrt(cl2); if (eL * R.sL > 0) { eL = -eL; eF = -eF; } }
                    TL = qL + eL / ed * .65; TF = qF + eF / ed * .65;
                }
                var cF = Math.max(-1, Math.min(.3, TF)), rF = TF - cF, rd = Math.sqrt(TL * TL + rF * rF);     // top + koyma noktası (topun 1 m gerisine dek kapsül): en az 1 m
                if (rd < 1) { if (rd < .02) { TL = R.sL >= 0 ? -1 : 1; rF = 0; rd = 1; } TL /= rd; TF = cF + rF / rd; }
                var oL = (TL - L) * w, oF = (TF - F) * w; if (oL || oF) { vo[i * 2] += oL * R.uy + oF * R.ux; vo[i * 2 + 1] += -oL * R.ux + oF * R.uy; }
            }
        }
    }
    /* aut koşusu: topu koyduktan sonra 2.7 m geri (güçlü ayak tarafından ~20°), vuruştan .75 sn önce hızlanan koşu, destek ayağı topun yanında;
       vuruştan sonra .5 sn'de motor konumuna */
    function gkKickRun(vo, v, rk, t) {
        var g = rk.g, ly = -rk.dir * rk.ft, tE = rk.tE < 1e8 ? rk.tE : rk.tEp, x0 = v.x[g], y0 = v.y[g];
        var sx = rk.x - rk.dir * 2.7, sy = rk.y + ly * 1.0, px = rk.x - rk.dir * .4, py = rk.y + ly * .26, qx = x0, qy = y0;
        if (t <= tE) {
            var w1 = gkSm((t - rk.tN - .75) / 1.0); qx += (sx - qx) * w1; qy += (sy - qy) * w1;
            var ur = (t - (tE - .75)) / .75; if (ur > 0) { var e = Math.pow(Math.min(1, ur), 1.3); qx = sx + (px - sx) * e; qy = sy + (py - sy) * e; }
            vo[g * 2] = qx - x0; vo[g * 2 + 1] = qy - y0;
        } else { var k2 = 1 - gkSm((t - tE) / .5); if (k2 > 0) { vo[g * 2] = (px - x0) * k2; vo[g * 2 + 1] = (py - y0) * k2; } }
    }
    /* tekrar: günlükteki aksiyonları tekrar saatinde yeniden kurar (aynı aksiyon aynı karede); "top elde" durumunu izler */
    function gkReplay(rp, t) {
        var G3 = S.gk, R3 = S.r3; if (!G3 || !R3 || !R3.gkAct) return -1;
        var b = G3.log, n = Math.min(G3.ln, GKL_N), i, o, k, d = G3.tmp;
        if (!rp.gk) {
            rp.gk = { last: t, hand: -1 }; R3.gkClear();
            for (i = G3.ln - n; i < G3.ln; i++) {
                o = (i % GKL_N) * GKL_W; if (b[o + 1] > t) continue;
                if (b[o] === 3) { rp.gk.hand = b[o + 2]; continue; }
                // [sp] tekrar başında hâlâ sürmesi beklenenler: temas/bırakış (tür 1/5) ya da olay anı (2/4/6) + 2,5 sn geçmemiş, en çok 15 sn önce kurulmuş
                var tr0 = b[o] === 1 || b[o] === 5 ? b[o + 4] : b[o + 5]; if (tr0 + 2.5 < t || b[o + 1] < t - 15) continue;
                for (k = 0; k < 11; k++) d[k] = b[o + 6 + k];
                gkSend(b[o], b[o + 2], b[o + 3], b[o + 4], b[o + 5], d, rp.off || 0);      // [fm] FM oynatimi canli saat payiyla (gol tekrarinda 0)
            }
        }
        var g = rp.gk; if (t <= g.last) return g.hand;
        for (i = G3.ln - n; i < G3.ln; i++) {
            o = (i % GKL_N) * GKL_W; var tI = b[o] === 1 ? Math.min(b[o + 1], b[o + 5] + .02) : b[o + 1]; if (tI <= g.last || tI > t) continue;      // [v135] onceden kurulan aksiyon tekrarda da baslangicinda
            if (b[o] === 3) { g.hand = b[o + 2]; continue; }
            for (k = 0; k < 11; k++) d[k] = b[o + 6 + k];
            if (rp.off != null && b[o] === 1 && (b[o + 3] === 18 || b[o + 3] === 11)) { try { var kpf = d[6] | 0, kr = .93 + Math.random() * .14; if (b[o + 3] === 11) sndPlay('Kick', .2, 0, .78 * kr, 90); else sndPlay(kpf >= 1 ? 'KickHard' : 'Kick', kpf === 2 ? .6 : kpf ? .32 : .25, 0, kr, 90); } catch (e) { } }      // [ses] FM oynatımında vuruş/kafa sesi (gol tekrarında yok)
            gkSend(b[o], b[o + 2], b[o + 3], b[o + 4], b[o + 5], d, rp.off || 0);
        }
        g.last = t;
        return g.hand;
    }

    /* =====================================================================
       [sp] DURAN TOPLAR — arayüz tarafı (yalnızca görüntü: motor durumu ve olaylarından türetilir, simülasyona dokunmaz, RNG tüketmez)
       Motor, vurucu topa yakınken (< 1,1 m; penaltıda < 3,2 m) bekleme süresi dolunca vurur: yürütme anı d.timer'ın kayan nokta toplamıyla
       (step() ile aynı sırada) kesin kestirilir (4 maçta 185/185 duran topta tam). Vurucu topa varınca Ado3D'ye aksiyon kurulur:
         8 duran top vuruşu (korner, serbest vuruş, penaltı, başlama, aut - kaleci de): topu koyma → geri çekilme → bekleme → koşu → temas tam
           motorun vuruş anında; vuruş yönü/türü motorun seçenek listesinden gürültüsüz kestirilir (passOptions noNoise), olay anında gerçeği bildirilir;
         9 taç: vurucu çizgiye gelirken topu yerden alır, ellerde taşır, kurma ve atış motorun atış anında; top elden ~2 m'de, yer pasına yayla iner;
         10 baraj: yerini alan oyuncu eller önde bekler, serbest vuruş şutunda vuruşla birlikte sıçrar.
       Kestirilemeyen durumda (ör. 3B sonradan açıldı) olay anında yerinden kısa vuruş - top temas anına dek noktada tutulur.
       Günlük (gkLog) tür 5 = güncelleme, 6 = iptal; tekrar aynı aksiyonları aynı karede kurar. Tempo: 3B'de geniş özet ileri sarması yürütmeden
       ~1,8 sn önce 1x'e iner (hazırlık ve vuruş görünsün; 2B ve kritik anlar değişmez). SP_ON = 0: eski davranış (olay anında bacak vuruşu).
       ===================================================================== */
    var SP_ON = 1, SP_CA = .6, SP_SLOW = 1.8, SP_CSPOT = 1;
    var SP = { cpd: null, cpk: -1, cpa: new Float32Array(2), d: null, tk: -1, iss: 0, tc: null, tcP: null, tu: 0, ty: 0, ex: 0, w: new Float64Array(22), tmp: new Float32Array(11), tmp2: new Float32Array(11), o: { x: 0, y: 0, d: 0, high: false }, ld: new Float32Array(22 * 11), lt: new Float64Array(22), lk: new Int8Array(22), off: 0 };
    function spReset() { SP.d = null; SP.tk = -1; SP.iss = 0; SP.tc = null; SP.tcP = null; SP.ex = 0; SP.w.fill(0); SP.lk.fill(0); SP.off = S.clkOff || 0; }
    // aksiyon kur/güncelle ve son veriyi sakla (duraklamadan sonra motorun anına yeniden hizalamak için)
    function spIss(type, id, k, tc, dd) { gkIssue(type, id, k, tc, S.sim.t, dd); SP.lk[id] = k; SP.lt[id] = tc; for (var i = 0; i < 11; i++) SP.ld[id * 11 + i] = dd[i]; }
    // motorun yürütme anı (vurucu yakınken): step() içindeki d.timer += DT toplamı birebir; gol sonrası başlama vuruşunda motorun DEAD_GOAL (12 sn) koşulu
    function spExecT(sim, d) { var tt = d.timer, k = 0; while (!(tt >= d.wait && (!d.afterGoal || tt > 12)) && k < 5000) { tt += DT; k++; } return sim.t + k * DT; }
    /* [sp] kornerde vurucunun topu koyacağı yay noktası (spKickData ile aynı hesap; ölü top + vurucu başına bir kez) → o.bx/o.by (yoksa NaN) */
    function spCornerSpot(sim, d, o) {
        o.bx = NaN; o.by = NaN; var tk = d.taker; if (!SP_ON || !SP_CSPOT || !tk || tk.off) return;
        if (SP.cpd !== d || SP.cpk !== tk.id) { var T = tk.team; SP.cpd = d; SP.cpk = tk.id; spCornerPlan(d, sim.atkGoalX(T) - sim.teams[T].dir * 9, PH / 2, tk.ft === 'L' ? -1 : 1, 2.6, SP.cpa); }
        o.bx = SP.cpa[0]; o.by = SP.cpa[1];
    }
    function spSpot(d, o) { o[0] = d.x; o[1] = d.y; if (d.kind === 'corner') { o[0] += d.x < PW / 2 ? SP_CA : -SP_CA; o[1] += d.y < PH / 2 ? SP_CA : -SP_CA; } }   // kornerde top yayın içinde (motor köşede tutar)
    function spSeg(px, py, ax, ay, bx, by) { var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; return Math.hypot(px - ax - t * dx, py - ay - t * dy); }
    // motorun pas seçeneklerinden gürültüsüz en iyisi → hedefin öncü noktası (doPass ile aynı)
    function spBest(sim, p, wp, o) {
        var l, i, best = null; try { l = sim.passOptions(p, false, wp, true); } catch (e) { l = []; }
        for (i = 0; i < l.length; i++) if (!best || l[i].s > best.s) best = l[i];
        if (!best) return null;
        var q = best.q, tf = best.high ? .7 + best.d / 24 : best.d / 14, ld = Math.min(tf, 1.4) * .8;
        o.x = q.x + q.vx * ld; o.y = q.y + q.vy * ld; o.d = best.d; o.high = best.high; return o;
    }
    function spFkShot(sim, d, p) { var dG = Math.hypot(sim.atkGoalX(d.team) - p.x, PH / 2 - p.y); return dG < 28 && dG > 15 && !d.indirect; }   // motorun executeDead koşulu
    /* korner: top yayın üzerinde (köşeden ,95 m) hangi noktaya konacağı ve güçlü ayağın karşı tarafından yaklaşma açısı birlikte seçilir:
       duruş noktası saha dışında, koşu (duruş → destek adımındaki leğen noktası) korner bayrağından en az ~,55 m uzakta, açı doğal (~30°) */
    function spCornerPlan(d, tx, ty, ft, D, dd) {
        var ix = d.x < PW / 2 ? 1 : -1, iy = d.y < PH / 2 ? 1 : -1, i, k, bs = -9, th = .6;
        for (i = 0; i < 7; i++) {
            var ph = (10 + i * 11.7) * Math.PI / 180, bx = d.x + ix * .95 * Math.cos(ph), by = d.y + iy * .95 * Math.sin(ph), ux = tx - bx, uy = ty - by, ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
            for (k = 0; k < 8; k++) {
                var t = .25 + k * .12, cs = Math.cos(t) * D, sn = Math.sin(t) * D * ft, Sx = bx - ux * cs + uy * sn, Sy = by - uy * cs - ux * sn;
                var Px = bx - ux * .32 + uy * ft * .14, Py = by - uy * .32 - ux * ft * .14, out = Sx < -.2 || Sx > PW + .2 || Sy < -.2 || Sy > PH + .2;
                var sc = (out ? 1 : 0) + Math.min(.9, spSeg(d.x, d.y, Sx, Sy, Px, Py)) - .15 * Math.abs(t - .55);
                if (sc > bs) { bs = sc; th = t; dd[0] = bx; dd[1] = by; }
            }
        }
        return th;
    }
    // vuruş verisi: [top x, y (görsel nokta), vuruş yönü ux, uy, ayak (1 sağ / -1 sol), tür (0 pas, 1 yüksek, 2 şut, 3 uzun), güç, duruş mesafesi, yaklaşma açısı, bayrak, 0]
    // bayrak: 2 topu koy, 4 dış kök (koşusuz), 8 korner, 16 penaltı
    function spKickData(sim, d, tk, dd) {
        var T = tk.team, gx = sim.atkGoalX(T), dir = sim.teams[T].dir, k = d.kind, o = SP.o, b = null, tx, ty, prof = 0, pw = .5, D = 2.4, th = .5, fl = 2;
        spSpot(d, dd); var sx = dd[0], sy = dd[1], ft = tk.ft === 'L' ? -1 : 1;
        if (k === 'penalty') { tx = gx; ty = PH / 2; prof = 2; pw = .75; D = 3.7; th = .38; fl |= 16; }
        else if (k === 'corner') { tx = gx - dir * 9; ty = PH / 2; prof = 1; D = 2.6; th = spCornerPlan(d, tx, ty, ft, D, dd); sx = dd[0]; sy = dd[1]; fl |= 8; }
        else if (k === 'kickoff') { b = spBest(sim, tk, -20, o); tx = b ? b.x : sx - dir * 6; ty = b ? b.y : sy + 4; D = .85; th = .25; fl = 0; }
        else if (k === 'freekick' && spFkShot(sim, d, tk)) { tx = gx; ty = PH / 2; prof = 2; pw = .6; D = 3.3; th = .6; }
        else if (k === 'freekick') { b = spBest(sim, tk, 0, o); tx = b ? b.x : sx + dir * 20; ty = b ? b.y : sy; prof = b && (b.high || b.d > 30) ? 1 : 0; D = prof ? 2.6 : 1.9; }
        else { b = spBest(sim, tk, 0, o); tx = b ? b.x : sx + dir * 30; ty = b ? b.y : PH / 2; prof = b && (b.high || b.d > 30) ? 3 : 0; D = 2.7; th = .45; }      // aut (kaleci ya da - kaleci yoksa - saha oyuncusu)
        var ux = tx - sx, uy = ty - sy, ul = Math.hypot(ux, uy) || 1;
        dd[2] = ux / ul; dd[3] = uy / ul; dd[4] = ft; dd[5] = prof; dd[6] = pw; dd[7] = D; dd[8] = th; dd[9] = fl; dd[10] = 0;
    }
    // taç verisi: [top x, y, hedef x, y, mesafe, yay süresi, atıldı, ayak] - hedef: motorun executeDead seçimi gürültüsüz (5-24 m, kenardan > 3,5 m)
    function spThrowTgt(sim, p, d, dd) {
        var l, i, o, best = null; try { l = sim.passOptions(p, false, -5, true); } catch (e) { l = []; }
        for (i = 0; i < l.length; i++) { o = l[i]; if (o.d >= 5 && o.d <= 24 && o.q.y > 3.5 && o.q.y < PH - 3.5 && (!best || o.s > best.s)) best = o; }
        if (!best) for (i = 0; i < l.length; i++) if (!best || l[i].s > best.s) best = l[i];
        dd[0] = d.x; dd[1] = d.y;
        if (best) { var q = best.q, ld = Math.min(best.d / 14, 1.4) * .8; dd[2] = q.x + q.vx * ld; dd[3] = q.y + q.vy * ld; dd[4] = best.d; }
        else { dd[2] = d.x; dd[3] = d.y < PH / 2 ? d.y + 12 : d.y - 12; dd[4] = 12; }
        dd[5] = 0; dd[6] = 0; dd[7] = p.ft === 'L' ? -1 : 1; dd[8] = 0; dd[9] = 0; dd[10] = 0;
    }
    // taç yayı: motorun yer topu (yavaşlama .30·v + .5) pas mesafesinin ~%75'ini aldığında görsel top yere iner
    function spArcT(B, dist) {
        var v = Math.hypot(B.vx, B.vy), s = 0, t = 0, goal = .75 * dist;
        while (s < goal && t < 1.6 && v > .05) { v = Math.max(0, v - (.30 * v + .5) * DT); s += v * DT; t += DT; }
        return Math.max(.3, Math.min(1.4, t));
    }
    function spCancelAll(sim) {
        if (SP.iss && SP.tk >= 0) gkIssue(6, SP.tk, 0, 0, sim.t, null);
        for (var i = 0; i < 22; i++) if (SP.w[i]) gkIssue(6, i, 0, 0, sim.t, null);
    }
    /* her sim adımından sonra: ölü top değişimi, yürütme anı kestirimi, aksiyon kurma/güncelleme */
    function spStep(sim) {
        if (!SP_ON) return;
        var d = sim.mode === 'dead' ? sim.dead : null;
        if (d !== SP.d) { if (SP.d && !SP.ex) spCancelAll(sim); spReset(); SP.d = d; SP.tk = d && d.taker ? d.taker.id : -1; }
        if (!d || !d.taker || d.taker.off) { SP.tcP = null; return; }
        var tk = d.taker, dist = Math.hypot(tk.x - d.x, tk.y - d.y), near = dist < 1.1 || (d.kind === 'penalty' && dist < 3.2), tcE = near ? spExecT(sim, d) : null;
        SP.tcP = tcE;
        var off = S.clkOff || 0, i, j;
        if (off !== SP.off) {                                               // duraklamada (kart, VAR) aksiyon saati aktı: bekleyen aksiyonlar motorun yürütme anına yeniden hizalanır
            SP.off = off;
            for (i = 0; i < 22; i++) if (SP.lk[i] && sim.t < SP.lt[i]) { for (j = 0; j < 11; j++) SP.tmp2[j] = SP.ld[i * 11 + j]; gkIssue(5, i, SP.lk[i], SP.lt[i], sim.t, SP.tmp2); }
        }
        if (d.kind === 'throw') spThrowStep(sim, d, tk, dist, tcE); else spKickStep(sim, d, tk, tcE);
        if (d.kind === 'freekick' && d.wall) spWallStep(sim, d, tcE);
    }
    function spThrowStep(sim, d, tk, dist, tcE) {
        var dd = SP.tmp;
        if (!SP.iss) {                                                     // çizgiye gelirken topu yerden alır
            if (dist > 1.5) return;
            var vs = Math.max(1.2, Math.hypot(tk.vx, tk.vy)), tc = tcE != null ? tcE : Math.max(sim.t + Math.max(0, d.wait - d.timer), sim.t + Math.max(0, dist - 1.05) / vs) + DT;
            tc = Math.max(tc, sim.t + .3);
            spThrowTgt(sim, tk, d, dd); spIss(1, tk.id, 9, tc, dd); SP.iss = 1; SP.tc = tc; SP.tu = sim.t; SP.ty = Math.atan2(dd[2] - d.x, dd[3] - d.y); return;
        }
        var chg = tcE != null && Math.abs(tcE - SP.tc) > 1e-4;
        if (sim.t > Math.min(SP.tc, chg ? tcE : SP.tc) - .55) return;      // kurma başladıysa plan sabit
        if (chg || sim.t - SP.tu > .4) {                                    // yürütme anı netleşti ya da hedef kestirimi değişti (kurmadan önce)
            spThrowTgt(sim, tk, d, dd); var ny = Math.atan2(dd[2] - d.x, dd[3] - d.y), dy = Math.abs(Math.atan2(Math.sin(ny - SP.ty), Math.cos(ny - SP.ty)));
            if (chg || dy > .2) { if (chg) SP.tc = tcE; spIss(5, tk.id, 9, SP.tc, dd); SP.ty = ny; }
            SP.tu = sim.t;
        }
    }
    function spKickStep(sim, d, tk, tcE) {
        var dd = SP.tmp;
        if (tcE == null) return;                                            // vurucu henüz topta değil
        if (OA_ON && OA.fall[tk.id] > sim.t) return;                        // [oa] faul yiyen yerde: hazırlık kalkınca başlar
        if (!SP.iss) { spKickData(sim, d, tk, dd); spIss(1, tk.id, 8, tcE, dd); SP.iss = 1; SP.tc = tcE; return; }
        if (Math.abs(tcE - SP.tc) > 1e-4) { spKickData(sim, d, tk, dd); spIss(5, tk.id, 8, tcE, dd); SP.tc = tcE; }
    }
    function spWallStep(sim, d, tcE) {
        var W = d.wall, dd = SP.tmp2, j, k, jp = spFkShot(sim, d, d.taker) ? 1 : 0, tc = tcE != null ? tcE : sim.t + 60;
        for (j = 0; j < W.slots.length; j++) {
            var sl = W.slots[j], id = sl.id, p = sim.players[id]; if (!p || p.off) continue;
            if (!SP.w[id] ? Math.hypot(p.x - sl.x, p.y - sl.y) > .8 : (tcE == null || Math.abs(tc - SP.w[id]) < 1e-4)) continue;
            dd[0] = d.x; dd[1] = d.y; dd[2] = jp; for (k = 3; k < 11; k++) dd[k] = 0;
            spIss(SP.w[id] ? 5 : 1, id, 10, tc, dd); SP.w[id] = tc;
        }
    }
    /* olay: duran top vuruşu/taç yürütüldü - gerçek yön, tür, yay; kurulmuş aksiyon yoksa kısa vuruş. true: bacak vuruşu (R3.kick) oynatılmaz */
    function spEvent(ev) {
        if (!SP_ON || !S.sim) return false;
        var m = ev.meta || {}, tag = m.tag, ty = ev.type, th = ty === 'PASS' && tag === 'THROW';
        var k8 = (ty === 'PASS' && (tag === 'CORNER' || tag === 'FREEKICK' || tag === 'KICKOFF' || tag === 'GOALKICK')) || (ty === 'SHOT' && (tag === 'FK' || tag === 'PEN'));
        if (!th && !k8) return false;
        var sim = S.sim, B = sim.ball, d = SP.d, id = ev.p, dd = SP.tmp, i, k, own = SP.iss && SP.tk === id && SP.tc != null && Math.abs(SP.tc - ev.t) < .3, pl = sim.players[id];
        SP.ex = 1;
        if (th) {
            var vl = Math.hypot(B.vx, B.vy) || 1, ds = m.dist || 12;
            if (d) { dd[0] = d.x; dd[1] = d.y; } else { dd[0] = ev.x; dd[1] = ev.y; }
            dd[2] = dd[0] + B.vx / vl * ds; dd[3] = dd[1] + B.vy / vl * ds; dd[4] = ds; dd[5] = spArcT(B, ds); dd[6] = 1; dd[7] = pl && pl.ft === 'L' ? -1 : 1; dd[8] = 0; dd[9] = 0; dd[10] = 0;
            if (own) gkIssue(5, id, 9, ev.t, ev.t, dd); else gkIssue(1, id, 9, ev.t + .3, ev.t, dd);     // kurulmamış: hızlı atış (top bırakışa dek elde)
            return true;
        }
        var vl2 = Math.hypot(B.vx, B.vy) || 1, prof = ty === 'SHOT' ? 2 : (m.high || m.cross) ? (tag === 'GOALKICK' ? 3 : 1) : 0, pw = ty === 'SHOT' && m.speed != null ? Math.max(0, Math.min(1, (m.speed - 21) / 12)) : .5;
        if (own) { for (i = 0; i < 11; i++) dd[i] = 0; dd[2] = B.vx / vl2; dd[3] = B.vy / vl2; dd[5] = prof; dd[6] = pw; dd[10] = 1; gkIssue(5, id, 8, ev.t, ev.t, dd); }
        else {
            if (d) spSpot(d, dd); else { dd[0] = B.x - B.vx / vl2 * .75; dd[1] = B.y - B.vy / vl2 * .75; }
            dd[2] = B.vx / vl2; dd[3] = B.vy / vl2; dd[4] = pl && pl.ft === 'L' ? -1 : 1; dd[5] = prof; dd[6] = pw; dd[7] = 0; dd[8] = 0; dd[9] = 4 | (tag === 'PEN' ? 16 : 0); dd[10] = 1;
            gkIssue(1, id, 8, ev.t + .13, ev.t, dd);
        }
        if (d && d.wall) { var d2 = SP.tmp2; for (i = 0; i < 22; i++) if (SP.w[i]) { d2[0] = d.x; d2[1] = d.y; d2[2] = ty === 'SHOT' ? 1 : 0; for (k = 3; k < 11; k++) d2[k] = 0; gkIssue(5, i, 10, ev.t, ev.t, d2); } }   // baraj: şutta sıçrar, pasta sıçramaz
        return true;
    }

    /* =====================================================================
       [oa] SAHA OYUNCUSU AKSİYONLARI — arayüz tarafı (yalnızca görüntü: motor durumu ve olaylarından türetilir, simülasyona dokunmaz, RNG tüketmez)
       Olay → aksiyon (Ado3D türleri, bkz çizici): PASS/SHOT/CLEAR → 18 canlı vuruş (temas olaydan ~.07-.11 sn sonra, top görüntüde temasa dek
       ayakta tutulur; motorun seçtiği ayak); yüksek topun inişinden ~.6 sn önce inişe yakın saha oyuncuları (iki takımdan en çok 3) → 11 sıçrayarak
       kafa (temas anı/noktası topun balistik yolundan, sıçrama yüksekliği kafa becerisi ve çekişmeyle); HEADER/CLAIM → kazanan/kaybeden; kafa
       pası/şutu bacak vuruşu oynatmaz; TACKLE → 12 müdahale (ayakta uzanma / yandan blok / kayarak: topa uzaklık, hız, göreli hız) + topu
       kaptırana 13 sendeleme; motorun "geçildi" saydığı savunmacı (stunT) → 12 boşa uzanma ve denge kaybı; FOUL → faul yiyene 14 düşme (temasın
       yönüne göre öne / yana / sırtüstü; yerde kalır, kalkar), faul yapana 15 tepki (durur, rakibe döner, itiraz); CARD → kart gören eller belde
       bekler; BLOCK → 17 blok; top havadayken (z > .45 m) alınan top → 16 göğüs / uyluk kontrolü. Düşen oyuncu serbest vuruşu kullanacaksa duran
       top hazırlığı kalkınca başlar. Günlük (gkLog) tür 7 = sonuç/güncelleme; tekrar aynı aksiyonları aynı karede kurar.
       OA_ON = 0: eski davranış (olay anında gerçek zamanlı bacak vuruşu, diğer aksiyonlar yok).
       ===================================================================== */
    var OA_ON = 1;
    var OA = { hdrK: 11, jk: new Int8Array(22), hiT: -1, jump: new Int8Array(22), cand: new Int8Array(3), cd: new Float32Array(3), own: -1, stun: new Float64Array(22), fall: new Float64Array(22), gnd: new Float64Array(22), react: new Float64Array(22), hdr: -1, hdrT: -9, tmp: new Float32Array(11), trj: new Float64Array(160), fpx: new Float32Array(22), fpy: new Float32Array(22) };
    function oaReset(sim) { OA.hiT = -1; OA.jump.fill(0); OA.jk.fill(0); OA.hdrK = 11; OA.own = -1; OA.fall.fill(-9); OA.gnd.fill(-9); OA.react.fill(-9); OA.hdr = -1; OA.hdrT = -9; for (var i = 0; i < 22; i++) OA.stun[i] = sim ? sim.players[i].stunT : -9; }
    function oaH(a, b) { var x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return x - Math.floor(x); }      // deterministik seçim (RNG tüketmez, tekrar aynı)
    function oaD(d, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) { d[0] = a0; d[1] = a1; d[2] = a2; d[3] = a3; d[4] = a4; d[5] = a5; d[6] = a6; d[7] = a7; d[8] = a8; d[9] = a9; d[10] = a10; return d; }
    function oaYaw(p) { return Math.abs(p.fx) + Math.abs(p.fy) > 1e-6 ? Math.atan2(p.fx, p.fy) : 0; }
    // (bx, by) noktası, yaw yönüne bakan gövdeye göre hangi yanda: +1 anatomik sol (3B modelin +X'i; dünyada x → x, y → z), -1 sağ
    function oaSideY(yw, px, py, bx, by) { return ((bx - px) * Math.cos(yw) - (by - py) * Math.sin(yw)) >= 0 ? 1 : -1; }
    /* yüksek topun inişinden önce: inişe yakın saha oyuncuları sıçrar (kalecinin havadan alması kaleci aksiyonunda) */
    function oaAerial(sim) {
        var B = sim.ball, hi = B.high; if (!hi || B.owner || sim.mode !== 'live' || OA.hiT === hi.t0) return;
        var tl = hi.tLand - sim.t; if (tl > .62 || tl < .06) return;
        OA.hiT = hi.t0; OA.jump.fill(0);
        var n = 0, i, j, p, k = Math.min(tl, .35);                          // [oa] adaylar: motorun çözüm yarıçapı (3,4 m) + pay; şimdiki ya da kısa kestirimli konum (uzun kestirim gürültülü)
        for (i = 0; i < 22; i++) {
            p = sim.players[i]; if (p.off || p.role === 'GK') continue;
            var dd = Math.hypot(p.x + p.vx * k - hi.x, p.y + p.vy * k - hi.y); if (Math.min(dd, Math.hypot(p.x - hi.x, p.y - hi.y)) > 3.6 || (n === 3 && dd >= OA.cd[2])) continue;
            j = n < 3 ? n++ : 2;
            while (j > 0 && OA.cd[j - 1] > dd) { OA.cd[j] = OA.cd[j - 1]; OA.cand[j] = OA.cand[j - 1]; j--; }
            OA.cd[j] = dd; OA.cand[j] = i;
        }
        var gkC = !!(S.gk && S.gk.claimT === hi.t0), nt = oaTraj(sim), tm = 0;
        for (i = 0; i < n; i++) tm |= 1 << sim.players[OA.cand[i]].team;
        var cont = tm === 3 || gkC;                                          // [oa] çekişme: yakında rakip (ya da çıkan kaleci) var
        for (i = 0; i < n; i++) { if (!cont && i > 0) break; oaJump(sim, sim.players[OA.cand[i]], nt, cont); }     // çekişmesiz: yalnız en yakın takım arkadaşı
    }
    // yüksek topun motordaki adımları iniş (çözüm) adımına dek - motorla aynı: konum doğrusal, dikeyde vz -= g·DT; z += vz·DT → OA.trj [t, x, y, z]
    function oaTraj(sim) {
        var B = sim.ball, hi = B.high, T = OA.trj, t = sim.t, x = B.x, y = B.y, z = B.z || 0, vz = B.vz || 0, n = 0;
        if (sim.aero && sim.hiStep) {      // [ball] BL_AERO: motorun hava kuvvetli adımı
            var q = OA.q || (OA.q = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 }); q.x = x; q.y = y; q.z = z; q.vx = B.vx; q.vy = B.vy; q.vz = vz;
            while (n < 40) { t += DT; sim.hiStep(q); T[n * 4] = t; T[n * 4 + 1] = q.x; T[n * 4 + 2] = q.y; T[n * 4 + 3] = q.z; n++; if (t >= hi.tLand - 1e-9) break; }
            return n;
        }
        while (n < 40) { t += DT; x += B.vx * DT; y += B.vy * DT; vz -= 9.81 * DT; z += vz * DT; T[n * 4] = t; T[n * 4 + 1] = x; T[n * 4 + 2] = y; T[n * 4 + 3] = z; n++; if (t >= hi.tLand - 1e-9) break; }
        return n;
    }
    /* aday: çekişmesiz alıcıya top göğüs hizasında iniyorsa (uzun toplarda çoğu kez ~1.3-1.5 m) göğüsle kontrol, değilse sıçrayarak kafa:
       temas = top merkezinin alın + istenen sıçrama yüksekliğine indiği an (inişte hâlâ üstündeyse çözüm adımında, daha yüksek sıçrama) */
    function oaJump(sim, p, n, cont) {
        var B = sim.ball, hi = B.high, T = OA.trj, d = OA.tmp, hea = p.a && p.a.hea != null ? p.a.hea : 65, i, e = (n - 1) * 4;
        var vl = Math.hypot(B.vx, B.vy) || 1, ix = B.vx / vl, iy = B.vy / vl, yw = Math.atan2(-ix, -iy), gx = sim.atkGoalX(p.team), nearG = Math.hypot(gx - p.x, PH / 2 - p.y) < 20;
        OA.jump[p.id] = 1; OA.jk[p.id] = 11;
        if (!cont && !nearG && T[e + 3] + .17 < 1.62) { OA.jk[p.id] = 16; gkIssue(1, p.id, 16, T[e], Math.max(sim.t, T[e] - .32), oaD(d, T[e + 1], T[e + 2], T[e + 3], ix, iy, T[e + 3] + .17 < 1.08 ? 1 : 2, p.vx, p.vy, 1, 0, 0)); return; }      // bel altı: uyluk, üstü: göğüs
        var hD = cont ? Math.max(.22, Math.min(.55, .28 + .3 * (hea - 55) / 40)) : .14, tgt = 1.67 + hD, k = -1, tc, cx, cy, H;
        for (i = 0; i < n; i++) if (T[i * 4 + 3] + .17 <= tgt) { k = i; break; }
        if (k > 0 && T[k * 4] - sim.t > .3) { var o0 = (k - 1) * 4, o1 = k * 4, z0 = T[o0 + 3] + .17, u = (z0 - tgt) / Math.max(1e-6, z0 - T[o1 + 3] - .17); tc = T[o0] + u * DT; cx = T[o0 + 1] + (T[o1 + 1] - T[o0 + 1]) * u; cy = T[o0 + 2] + (T[o1 + 2] - T[o0 + 2]) * u; H = tgt; }
        else { var j = k < 0 ? n - 1 : Math.min(n - 1, Math.max(k, Math.ceil(.3 / DT) - 1)), o2 = j * 4; tc = T[o2]; cx = T[o2 + 1]; cy = T[o2 + 2]; H = T[o2 + 3] + .17; }
        if (nearG) { var gy = Math.atan2(gx - p.x, PH / 2 - p.y); yw += Math.atan2(Math.sin(gy - yw), Math.cos(gy - yw)) * .5; }   // kale önünde gövde gelen topla kale arasında
        var Tf = Math.sqrt(8 * hD / 9.81);
        gkIssue(1, p.id, 11, tc, Math.max(sim.t, tc - Tf * .5 - .2), oaD(d, cx, cy, H, ix, iy, hD, Math.hypot(p.vx, p.vy) > 2.2 ? 1 : 2, yw, hi.tLand - tc, p.vx, p.vy));
    }
    // kestirilmemiş kafa (kazanan): olay anında ayakta kısa kafa - top temas noktasında tutulur
    function oaQuickHead(sim, id, t, sh) {
        var p = sim.players[id], B = sim.ball, d = OA.tmp; if (!p) return;
        var vx = B.x - S.prevB.x, vy = B.y - S.prevB.y, vl = Math.hypot(vx, vy), ix = vl > 1e-4 ? vx / vl : 0, iy = vl > 1e-4 ? vy / vl : 0;
        // [oa] yön ve temas noktası: kafa şutunda şut yönü; havadan kazanılan topta gelen topa (adımdan önceki top konumu - motor topu kazanana koyar)
        var qx = S.prevB.x, qy = S.prevB.y, dq = Math.hypot(qx - p.x, qy - p.y), yw = sh ? (vl > 1e-4 ? Math.atan2(ix, iy) : oaYaw(p)) : dq > .25 ? Math.atan2(qx - p.x, qy - p.y) : oaYaw(p);
        var hx = !sh && dq < 1.6 ? qx : B.x, hy = !sh && dq < 1.6 ? qy : B.y;
        gkIssue(1, id, 11, t + .08, t - .12, oaD(d, hx, hy, Math.max(1.5, (S.prevB.z || 0) + .17), ix, iy, 0, 3, yw, 0, p.vx, p.vy));     // [oa] görünür kafa: temas .08 sn sonra (öne kamçı görünür)
    }
    function oaKickEv(sim, ev, m) {
        var p = sim.players[ev.p], B = sim.ball, d = OA.tmp; if (!p) return false;
        var prof = ev.type === 'SHOT' ? 2 : ev.type === 'CLEAR' ? 3 : (m.high || m.cross) ? 1 : 0;
        var pw = ev.type === 'SHOT' && m.speed != null ? Math.max(0, Math.min(1, (m.speed - 21) / 12)) : .5;
        var ft = m.foot === 'L' || m.foot === 'R' ? m.foot : p.ft === 'L' ? 'L' : 'R';
        var vl = Math.hypot(B.vx, B.vy), ux = vl > .1 ? B.vx / vl : p.fx, uy = vl > .1 ? B.vy / vl : p.fy;
        var lead = prof === 2 ? .24 : prof === 3 ? .18 : prof === 1 ? .18 : .15;      // [mocap]                               // temas: olaydan sonra (geri savurma görünsün)
        if (V8B.ld && DL.on) lead = prof === 2 ? .34 : prof === 3 ? .27 : prof === 1 ? .29 : .25;      // [v188] geri savurma + vuruş ~.27-.37 sn (gerçek pas/şut salınımı)
        var cdo = (CRD.on || CRD.pon) && Math.hypot(CRD.x - p.x, CRD.y - p.y) < 2.2, kx = cdo ? CRD.x + (DL.on ? 0 : CRD.vx * DT) : DL.on ? S.prevB.x : B.x, ky = cdo ? CRD.y + (DL.on ? 0 : CRD.vy * DT) : DL.on ? S.prevB.y : B.y, kz = cdo ? CRD.z : Math.max(0, DL.on ? S.prevB.z || 0 : B.z || 0);      // [v135] gecikmede temas noktasi: topun ayrildigi (adim basi) konum      // [carry] temas: görünen top
        gkIssue(1, ev.p, 18, ev.t + lead, ev.t - .03, oaD(d, kx, ky, kz, ux, uy, ft === 'L' ? -1 : 1, prof, pw, p.vx, p.vy, cdo && CRD.knock ? 1 : 0));
        if (V8B.an && DL.on && ev.type === 'PASS' && !m.tag && ev.p2 >= 0) try {      /* [v188] pas isteme: uzak (≥14 m) alıcı, vuruştan ~.4 sn önce kolunu kaldırıp topu ister (oyuncuya göre kararlı; herkes her pasta değil) */
            var rq = sim.players[ev.p2]; if (rq && !rq.off && rq.role !== 'GK' && Math.hypot(rq.x - p.x, rq.y - p.y) > 14 && oaH(ev.t, ev.p2) < .55 && v7Free(ev.p2, ev.t - .4)) v7Gest(ev.p2, 31, ev.t - .4, .95, p.x, p.y, oaH(ev.p2, ev.t) < .5 ? 1 : -1);
        } catch (e) { }
        return true;
    }
    var SI_ON = 1;      // [sav] p_sav_02 araya girme
    function oaTackleEv(sim, ev) {
        var dp = sim.players[ev.p], op = sim.players[ev.p2], B = sim.ball, d = OA.tmp; if (!dp || !op) return;
        var dl = Math.hypot(B.x - dp.x, B.y - dp.y), dsp = Math.hypot(dp.vx, dp.vy), vr = Math.hypot(dp.vx - op.vx, dp.vy - op.vy), yw = oaYaw(dp);
        var lat = Math.abs((B.x - dp.x) * Math.cos(yw) - (B.y - dp.y) * Math.sin(yw));
        var mode = (ev.meta && ev.meta.slide) || (dl > .95 && dsp > 2.4 && (vr > 3 || dl > 1.25) && oaH(ev.t, ev.p) < .75) ? 3 : lat > .55 * Math.max(dl, .3) ? 2 : 1;      /* [sav] motorun kayma mudahalesi */      // 3 kayarak, 2 yandan blok, 1 öne uzanma
        var air = (S.prevB.z || 0) > .3 || (OA.hdr === ev.p2 && ev.t - OA.hdrT < .2);      // [oa] top havada / kaptıran az önce kafa vurdu: top ayakta tutulmaz (kafadan düşerek iner)
        var tco = (CRD.on || CRD.pon) && Math.hypot(CRD.x - op.x, CRD.y - op.y) < 2.2, tbx = tco ? CRD.x : B.x, tby = tco ? CRD.y : B.y;      // [carry] müdahale teması: görünen top
        if (SI_ON && !(ev.meta && ev.meta.slide) && !air) {      /* [sav] araya girme: savunmaci hucumcunun yaninda / capraz onunde (motorun kaymasi degilse eski 'hizliysa kay' kuralinin onunde) */
            var osp4 = Math.hypot(op.vx, op.vy), ux4 = osp4 > 1 ? op.vx / osp4 : op.fx, uy4 = osp4 > 1 ? op.vy / osp4 : op.fy, rx4 = dp.x - op.x, ry4 = dp.y - op.y, rl4 = Math.hypot(rx4, ry4) || 1, ca4 = (rx4 * ux4 + ry4 * uy4) / rl4;
            if (osp4 > .9 && ca4 > -.55 && ca4 < .85 && Math.min(dl, Math.hypot(tbx - dp.x, tby - dp.y)) < 2.2) mode = 4;      /* dl: motor topu */
        }
        if (V8B.ld && !air) { var tco8 = mode === 3 ? .12 : mode === 4 ? .14 : .06, bv8x = tco ? (CRD.vx || op.vx) : (B.vx || op.vx), bv8y = tco ? (CRD.vy || op.vy) : (B.vy || op.vy); tbx += bv8x * tco8; tby += bv8y * tco8; }      /* [v188] müdahale hedefi: topun temas anındaki yeri (top sürülürken ~.1 sn'de .3-.5 m ilerliyor) */
        gkIssue(1, ev.p, 12, ev.t + (mode === 3 ? .12 : mode === 4 ? .14 : .06), ev.t - (V8B.ld && DL.on ? (mode === 3 ? .3 : .22) : .03), oaD(d, tbx, tby, op.x, op.y, vr, mode, oaSideY(yw, dp.x, dp.y, tbx, tby), air ? 0 : 1, 0, dp.vx, dp.vy));      // [v188] müdahale hareketi temastan önce başlar
        if (mode === 3) OA.gnd[ev.p] = ev.t + .95;                             // kayan oyuncu yerde: motor topu hemen oynatsa da bacak vuruşu kurulmaz
        // topu kaptıran sendeler: savunmacıdan uzağa, kendi koşu yönüyle karışık
        var px = op.x - dp.x, py = op.y - dp.y, pl = Math.hypot(px, py) || 1, osp = Math.hypot(op.vx, op.vy), mx = osp > .5 ? op.vx / osp : 0, my = osp > .5 ? op.vy / osp : 0;
        px = px / pl * .6 + mx * .4; py = py / pl * .6 + my * .4; pl = Math.hypot(px, py) || 1;
        var tS = ev.t + (mode === 3 ? .1 : mode === 4 ? .13 : .05);      // [sav] araya girmede sendeleme temasla
        gkIssue(1, ev.p2, 13, tS, tS, oaD(d, px / pl, py / pl, Math.max(.35, Math.min(1, vr / 5)), .5, 0, 0, 0, 0, 0, 0, 0));
    }
    function oaFoulEv(sim, ev, m) {
        var dp = sim.players[ev.p], op = sim.players[ev.p2], d = OA.tmp; if (!dp || !op) return;
        var osp = Math.hypot(op.vx, op.vy), ux = osp > 1 ? op.vx / osp : op.fx, uy = osp > 1 ? op.vy / osp : op.fy, ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
        var rx = dp.x - op.x, ry = dp.y - op.y, rl = Math.hypot(rx, ry) || 1, ca = (rx * ux + ry * uy) / rl, h = oaH(ev.t, ev.p2);
        var ty = ca < -.3 || osp > 4.5 ? 1 : ca > .55 && osp < 3 && h < .5 ? 3 : 2, fx, fy;          // arkadan / hızlıyken öne yüzüstü, önden itilince sırtüstü, yandan yana
        if (ty === 1) { fx = ux * .75 - rx / rl * .25; fy = uy * .75 - ry / rl * .25; } else { fx = -rx / rl; fy = -ry / rl; }
        var fl = Math.hypot(fx, fy) || 1, lie = (m.pen ? .9 : .45) + 1.1 * h;
        if (m.adv) gkIssue(1, ev.p2, 13, ev.t + .08, ev.t + .08, oaD(d, fx / fl, fy / fl, .7, .5, 0, 0, 0, 0, 0, 0, 0));      // [v186] avantaj: hücumcu sendeler ama topla devam eder
        else {
        gkIssue(1, ev.p2, 14, ev.t + .45, ev.t - .02, oaD(d, fx / fl, fy / fl, ty, lie, osp, 0, 0, 0, 0, 0, 0));
        OA.fall[ev.p2] = ev.t + .5 + Math.max(.25, Math.min(2.5, lie)) + .9;
        }
        var rk5 = 0; OA.fpx[ev.p] = dp.x; OA.fpy[ev.p] = dp.y;      // [v186] faul anı konumu (kırmızıda motor oyuncuyu hemen park eder)
        if (!m.slide && !m.air) {      /* [v186] ayakta faul de temasla: arkadan / önden çelme (ayak rakibin ayağına uzanır), yandan omuz-bacak (blok); eskiden savunmacı yalnız durup dönüyordu */
            var md6 = ca < -.3 || ca > .55 ? 1 : 2, sp6 = osp > 1 ? .35 : .1;
            gkIssue(1, ev.p, 12, ev.t + .06, ev.t - .03, oaD(d, op.x + ux * sp6, op.y + uy * sp6, op.x, op.y, Math.hypot(dp.vx - op.vx, dp.vy - op.vy), md6, oaSideY(oaYaw(dp), dp.x, dp.y, op.x, op.y), 1, 0, dp.vx, dp.vy));
            rk5 = .55;
        }
        if (m.slide) {      /* [sav] kayarak faul: faul yapan kayar (rakibin ayagina), tepki kaymadan sonra */
            rk5 = 1.25; gkIssue(1, ev.p, 12, ev.t + .1, ev.t - .03, oaD(d, op.x, op.y, op.x, op.y, Math.hypot(dp.vx - op.vx, dp.vy - op.vy), 3, oaSideY(oaYaw(dp), dp.x, dp.y, op.x, op.y), 0, 0, dp.vx, dp.vy)); OA.gnd[ev.p] = ev.t + 1.1;
        }
        gkIssue(1, ev.p, 15, ev.t + .4 + rk5, ev.t + .08 + rk5, oaD(d, op.x, op.y, h < .62 ? 1 : 2, 1.9, 0, 0, 0, 0, 0, 0, 0));     // faul yapan durur, rakibine döner
        OA.react[ev.p] = ev.t + rk5;
    }
    function oaCardEv(sim, ev) {
        var id = ev.p, d = OA.tmp; if (id < 0 || !sim.players[id] || sim.t - ev.t > 2) return;
        if (ev.t - OA.react[id] < 2.5) gkIssue(7, id, 5, ev.t + 3.2, ev.t, null);                    // faul tepkisi sürüyor: kart gelince eller belde bekler
        else gkIssue(1, id, 15, ev.t + .3, ev.t, oaD(d, S.ref.x, S.ref.y, 3, 3.2, 1, 0, 0, 0, 0, 0, 0));
    }
    /* ================= [v186] OLAY SEKANSI — yalnız görüntü (motor/kayıt/MR değişmez) =================
       3B canlıda ölü top hazırlığı 2,5–5 kat hızlı oynuyordu: faulde düşme, hakem, kart; taçta/autta topun çizgiden sonraki yolu görülmeden bir sonraki olaya geçiliyordu.
       Ölü top başlayınca olayın sekansı gerçek zamanda (× seçili hız: 2x/4x oranlı kısalır) oynar: SEQ_T sim-sn (taç/aut/korner topun yolu, faul düşme + düdük, ofsayt bayrağı).
       Kart: hakem oyuncuya koşar, kart ancak varınca kalkar (kırmızıda sahne o an, oyuncu yürüyerek çıkar). Kart / çıkış bitmeden duran top kullanılmaz (sim adımı bekler,
       aksiyon saati akar). Kritik ana atla / sonuna simüle et / 2B / FM gösterimi bu sekansı atlar. */
    var SEQ_T = { throw: 3.0, goalkick: 2.8, corner: 2.8, freekick: 3.2, penalty: 3.2 }, SQ = { d: null, until: -1, card: null, blk: 0, blk0: 0 };
    function sqLog(k, x) { var a = S.tlog || (S.tlog = []); if (a.length < 3000) a.push([Math.round(performance.now()), k, x == null ? null : Math.round(x * 100) / 100, S.sim ? Math.round(S.sim.t * 100) / 100 : 0]); }      // olay zaman çizelgesi (ölçüm: ado2d._tlog)
    function sqOn() { return !!(S.use3 && S.r3 && !S.r3.lost && mode === '2d' && !S.raw && !G.__abLive && !S.skip && S.watch !== 'fm' && !(S.sim && S.sim.userRef)); }
    function sqReset() { SQ.d = null; SQ.until = -1; SQ.card = null; SQ.blk = 0; SQ.blk0 = 0; S.offWalk = null; }
    function sqCard(ev, red, scene) {
        var sim = S.sim, now = performance.now(), id = ev.p, p = sim && sim.players[id], kind = red ? 'R' : 'Y';
        if (red && p) { var fx0 = OA.fpx[id], fy0 = OA.fpy[id]; if (!(fx0 > 0 || fy0 > 0)) { fx0 = ev.x; fy0 = ev.y; } S.offWalk = { id: id, sid: S.sid, x: fx0, y: fy0, go: Infinity, end: Infinity, gp: 0, fx: p.fx || 1, fy: p.fy || 0 }; }
        if (!sqOn() || !p) { sqBand(kind, id, now); if (S.feedCard) { try { S.feed.push(S.feedCard); } catch (e) { } S.feedCard = null; } S.refCard = { kind: kind, id: id, until: now + 2600 }; if (S.offWalk) { S.offWalk.go = now; S.offWalk.end = now; } if (scene) scene(); return; }
        var r = S.ref, tx = p.off && S.offWalk ? S.offWalk.x : p.x, ty = p.off && S.offWalk ? S.offWalk.y : p.y, dist = r ? Math.hypot(r.x - tx, r.y - ty) : 0;
        SQ.card = { kind: kind, id: id, red: red, scene: scene, sid: S.sid, fev: S.feedCard && S.feedCard.p === id ? S.feedCard : null, max: now + Math.max(1.2, Math.min(3.2, dist / 5.5)) * 1000 / Math.max(.5, liveSpeed()) };      /* en geç 3,2 sn: hakem uzaktaysa kartı oradan gösterir */ S.feedCard = null;
        if (V7.on && (red ? !!S.offWalk : !p.off)) try { v7Go(id, 0, 0, 1.75, 7, { fol: 1, stop: 1.45 }); V7.cardW = id; } catch (e) { }      // [v187] oyuncu hakeme yürür (≤ 2 m/sn), önünde durur (kırmızıda da: kart ≤ 3 m'de)
    }
    function sqBand(kind, id, now) { try { var p = S.sim.players[id]; S.cardBand = { kind: kind, id: id, team: p ? p.team : 0, min: minOf(S.sim.t), until: now + 5000 / Math.max(.5, liveSpeed()) }; } catch (e) { } }      /* [v186] kart alt bandı ~5 sn (ad, dakika, takım) */
    function sqTick(sim, now) {      /* her karede: bekleyen kart (hakem vardı mı), yeni ölü top sekansı */
        var c = SQ.card;
        if (c) {
            if (c.sid !== S.sid) { SQ.card = null; c = null; }
            else {
                var p = sim.players[c.id], tx = p && p.off && S.offWalk ? S.offWalk.x : p ? p.x : 0, ty = p && p.off && S.offWalk ? S.offWalk.y : p ? p.y : 0, r = S.ref;
                var g7 = V7.on && V7.gv[c.id] ? V7.gv[c.id] : null; if (g7 && g7.x === g7.x) { tx = g7.x; ty = g7.y; }      // [v187] görünen konum (hakeme yürüyor)
                if (!sqOn() || now >= c.max || !r || Math.hypot(r.x - tx, r.y - ty) < 2.9) {
                    SQ.card = null; S.refCard = { kind: c.kind, id: c.id, until: now + 2600 }; sqBand(c.kind, c.id, now); sqLog('kart:' + c.kind, r ? Math.hypot(r.x - tx, r.y - ty) : -1);
                    if (V7.on) try { v7CardShown(c, now); } catch (e) { }      // [v187] itiraz eden oyuncular, kart pozunda bekleme
                    var ls = Math.max(.5, liveSpeed()); SQ.blk = Math.max(SQ.blk, now + 2700 / ls);
                    if (S.offWalk && S.offWalk.id === c.id) { S.offWalk.go = now + 1300 / ls; S.offWalk.end = S.offWalk.go + 9000 / ls; SQ.blk = Math.max(SQ.blk, S.offWalk.go + 3800 / ls); }
                    if (c.fev) SQ.fd = { ev: c.fev, at: now + 1700 / Math.max(.5, liveSpeed()), sid: S.sid };      /* kart satırı faul satırından sonra (spiker satır aralığı 1,6 sn; kart önceliği faulden yüksek) */
                    if (c.scene) try { c.scene(); } catch (e) { warn('kart sahnesi', e); }
                }
            }
        }
        if (SQ.fd && (now >= SQ.fd.at || SQ.fd.sid !== S.sid || !sqOn())) { if (SQ.fd.sid === S.sid) try { S.feed.push(SQ.fd.ev); } catch (e) { } SQ.fd = null; }
        var d = sim.mode === 'dead' ? sim.dead : null, B = sim.ball;
        if (!d) SQ.lb = { t: sim.t, x: B.x, y: B.y, z: B.z || 0, vx: B.vx || 0, vy: B.vy || 0, vz: B.vz || 0 };      // son canlı top (çizgiyi geçiş yolu için)
        else if (d !== SQ.d && SQ.lb && !d.afterGoal && (d.kind === 'throw' || d.kind === 'goalkick' || d.kind === 'corner') && sqOn() && sim.t - SQ.lb.t < .3) SQ.ob = SQ.lb;      // [v186] top çizgiden sonra yoluna devam eder (görüntü)
        if (d !== SQ.d) { sqLog(d ? 'olu:' + d.kind : 'basla'); SQ.d = d; if (d && !d.afterGoal && SEQ_T[d.kind] && sqOn()) { var k = d.kind; SQ.until = sim.t - (d.timer || 0) + SEQ_T[k]; } }
    }
    function sqSlow(sim) { return sqOn() && (sim.t < SQ.until || !!SQ.card || !!S.offWalk || performance.now() < SQ.blk); }
    function sqBlock(sim, now) {      /* duran top kullanılmak üzere ama kart / çıkış sekansı sürüyor: sim bekler (en çok 9 sn) */
        if (!sqOn() || sim.mode !== 'dead' || !sim.dead) { SQ.blk0 = 0; return false; }
        var d = sim.dead, want = !!SQ.card || now < SQ.blk; if (!want || d.timer + DT < d.wait - .05) { SQ.blk0 = 0; return false; }
        if (!SQ.blk0) SQ.blk0 = now; if (now - SQ.blk0 > 9000) return false; return true;
    }
    function sqCam(v, now) {      /* [v186] kart gösterilirken kamera hakemi ve oyuncuyu aynı dar kadraja alır; kırmızıda ilk ~2,8 sn çıkan oyuncuyu izler (ofsayt kesmesi önceliklidir) */
        if (S.arCut && S.r3.cutCam && !S.r3.sqCut) return;
        var rc = S.refCard, ow = S.offWalk, id = -1, walk = 0, ls = Math.max(.5, liveSpeed());
        if (rc && now < rc.until && rc.id >= 0 && sqOn()) id = rc.id;
        if (ow && now >= ow.go && now < ow.go + 2800 / ls) { id = ow.id; walk = 1; }
        if (id < 0 || !(v.x[id] > -20)) { if (S.r3.sqCut) { S.r3.cutCam = null; S.r3.sqCut = 0; } return; }
        var px = v.x[id], py = v.y[id], rx = walk ? px + (ow.fx || 0) * 2 : v.rx, ry = walk ? py + (ow.fy || 0) * 2 : v.ry, mx = (px + rx) / 2, my = (py + ry) / 2, dx = rx - px, dy = ry - py, dl = Math.hypot(dx, dy);
        var nx = dl > .3 ? -dy / dl : 0, ny = dl > .3 ? dx / dl : 1; if (ny < 0) { nx = -nx; ny = -ny; }      // yayın tarafından (ana kamera tarafı)
        var ds = 8.5 + .45 * Math.min(dl, 12);
        S.r3.cutCam = { eye: [mx + nx * ds, 2.4, my + ny * ds], at: [mx, 1.15, my], fov: 30 }; S.r3.sqCut = 1;
    }
    function outBallLive(v) {      /* [v186] taç / aut / kornerde top çizgiyi geçince ~1,3 sn yoluna devam eder (yerçekimi, sekme, çim sürtünmesi, reklam panosu); kamera onu izler, sonra motor 'yeni top'u gösterir */
        var o = SQ.ob, t = S.viewT; if (!o) return false; var e = t - o.t; if (e < 0) return false; if (e > 1.3 || !sqOn()) { SQ.ob = null; return false; }
        var x = o.x, y = o.y, z = o.z, vx = o.vx, vy = o.vy, vz = o.vz, h = .02, n = Math.ceil(e / h), i;
        for (i = 0; i < n; i++) { var hh = Math.min(h, e - i * h); if (z > .01 || vz > 0) { vz -= 9.81 * hh; z += vz * hh; if (z < 0) { z = 0; vz = vz < -1.2 ? -vz * .55 : 0; vx *= .85; vy *= .85; } }
            else { var sp = Math.hypot(vx, vy); if (sp > 1e-3) { var ns = Math.max(0, sp - (.9 + .02 * sp * sp) * hh); vx *= ns / sp; vy *= ns / sp; } }
            x += vx * hh; y += vy * hh; if (x < -6.2) { x = -6.2; vx = Math.abs(vx) * .15; } else if (x > PW + 6.2) { x = PW + 6.2; vx = -Math.abs(vx) * .15; } if (y < -5.2) { y = -5.2; vy = Math.abs(vy) * .15; } else if (y > PH + 5.2) { y = PH + 5.2; vy = -Math.abs(vy) * .15; } }
        v.bx = x; v.by = y; v.bz = z; v.owner = -1; return true;
    }
    function offWalkLive(v, dt) {      /* atılan oyuncu: kart görülene dek yerinde (hakeme döner), sonra en yakın yan çizgiye yürür; çizginin dışında kaybolur */
        var w = S.offWalk, sim = S.sim, now = performance.now(); if (!w || w.sid !== S.sid || !sim || now > w.end) { S.offWalk = null; return; }
        var i = w.id, r = S.ref; if (!(i >= 0 && i < v.x.length)) { S.offWalk = null; return; }
        if (now >= w.go && !(S.hold === 'goal')) {
            if (!w.v7h) { w.v7h = 1; var g7 = V7.on && V7.gv[i]; if (g7 && g7.x === g7.x) { w.x = g7.x; w.y = g7.y; V7.gv[i] = null; } }      // [v187] hakeme yürüdüğü yerden çıkar (ışınlanma yok)
            var ey = w.y < PH / 2 ? -4.5 : PH + 4.5, ex = w.x + (PW / 2 - w.x) * .25, dx = ex - w.x, dy = ey - w.y, dl = Math.hypot(dx, dy), st = Math.min(dl, 1.45 * Math.max(.5, liveSpeed()) * Math.min(dt, .1));
            if (dl < .3) { S.offWalk = null; return; }
            w.x += dx / dl * st; w.y += dy / dl * st; w.fx = dx / dl; w.fy = dy / dl; w.gp += st * crGaitK(1.45, 0);
        } else if (r) { var rx = r.x - w.x, ry = r.y - w.y, rl = Math.hypot(rx, ry); if (rl > .5) { w.fx = rx / rl; w.fy = ry / rl; } }
        v.x[i] = w.x; v.y[i] = w.y; if (v.fx) { v.fx[i] = w.fx; v.fy[i] = w.fy; } if (v.gp) v.gp[i] = w.gp % 6283.185307;
    }
    function oaBlockEv(sim, ev, m) {
        if (m.wall) return;                                                   // baraj: duran top aksiyonu (sıçrama)
        var bp = sim.players[ev.p], sp = ev.p2 >= 0 ? sim.players[ev.p2] : null, B = sim.ball, d = OA.tmp; if (!bp) return;
        var sx = sp ? bp.x - sp.x : -bp.fx, sy = sp ? bp.y - sp.y : -bp.fy, sl = Math.hypot(sx, sy) || 1; sx /= sl; sy /= sl;
        gkIssue(1, ev.p, 17, ev.t + .02, ev.t - (V8B.ld && DL.on ? .3 : .08), oaD(d, B.x, B.y, sx, sy, oaSideY(Math.atan2(-sx, -sy), bp.x, bp.y, B.x, B.y), S.prevB.z || 0, m.gain ? 1 : 0, 0, 0, 0, 0));      // [v188] blok: şut anında başlayan uzanma
        if (V8B.an && bp.role !== 'GK') try { v7Gest(ev.p, 32, ev.t + .04, .65, 0, 0, oaH(ev.t, ev.p) < .5 ? 1 : -1); } catch (e) { }      // [v188] vücuda çarpan topa irkilme (blok temasından hemen sonra)
    }
    /* olay: true → bacak vuruşu (R3.kick) oynatılmaz (vuruş/kafa aksiyonu kuruldu) */
    function oaEvent(ev) {
        if (!OA_ON || !S.sim) return false;
        var sim = S.sim, m = ev.meta || {}, ty = ev.type, i;
        switch (ty) {
            case 'PASS': case 'SHOT': case 'CLEAR':
                if (ev.p < 0) return false;
                if (ev.p === OA.hdr && ev.t - OA.hdrT < .35 && OA.hdrK !== 16) return true;           // kafa pası / kafa şutu: kafa aksiyonu (top alından çıkar) · [oa] göğüs/uyluk kontrolünden pas: bacak vuruşu
                if (OA.gnd[ev.p] > ev.t || OA.fall[ev.p] > ev.t) return true;                         // yerdeki (kayan / düşen) oyuncu: aksiyon bozulmasın
                if (ty === 'SHOT' && m.tag === 'HEAD') { oaQuickHead(sim, ev.p, ev.t, 1); return true; }
                return oaKickEv(sim, ev, m);
            case 'HEADER':
                OA.hdr = ev.p; OA.hdrT = ev.t; OA.hdrK = OA.jump[ev.p] ? OA.jk[ev.p] : 11;      // [oa] kazananın oynadığı: 16 göğüs/uyluk kontrolü, 11 kafa
                for (i = 0; i < 22; i++) if (OA.jump[i]) gkIssue(7, i, i === ev.p ? 1 : 3, 0, ev.t, null);
                if (!OA.jump[ev.p]) oaQuickHead(sim, ev.p, ev.t);
                OA.jump.fill(0); break;
            case 'CLAIM': for (i = 0; i < 22; i++) if (OA.jump[i]) gkIssue(7, i, 3, 0, ev.t, null); OA.jump.fill(0); break;
            case 'TACKLE': oaTackleEv(sim, ev); break;
            case 'FOUL': oaFoulEv(sim, ev, m); break;
            case 'CARD': oaCardEv(sim, ev); break;
            case 'BLOCK': oaBlockEv(sim, ev, m); break;
        }
        return false;
    }
    /* [v188] omuz omuza mücadele: top sahibi ve ≤1,05 m yanındaki rakip (ikisi de ≥2,2 m/sn, yan yana: aradaki doğrultu koşu yönüne dik) birlikte
       gövdelerini birbirine yaslar (jest 30, ~1 sn, oyuncu başına 2,5 sn'de bir) - görüntü */
    var OSH = new Float64Array(22);
    function oaShoulder(sim) {
        if (sim.mode !== 'live') return; var B = sim.ball, o = B.owner; if (!o || o.role === 'GK' || o.off) return;
        var osp = Math.hypot(o.vx, o.vy); if (osp < 2.2 || OSH[o.id] > sim.t) return;
        var ux = o.vx / osp, uy = o.vy / osp, best = null, bd = 1.05, i;
        for (i = 0; i < 22; i++) { var q = sim.players[i]; if (q.team === o.team || q.off || q.role === 'GK') continue; var dx = q.x - o.x, dy = q.y - o.y, dl = Math.hypot(dx, dy); if (dl < bd && Math.abs(dx * ux + dy * uy) < .6 * dl && Math.hypot(q.vx, q.vy) > 2.2) { bd = dl; best = q; } }
        if (!best || OSH[best.id] > sim.t || !v7Free(o.id, sim.t) || !v7Free(best.id, sim.t)) return;
        var sd = (best.x - o.x) * uy - (best.y - o.y) * ux;      // rakip koşu yönünün hangi yanında
        v7Gest(o.id, 30, sim.t, 1.0, 0, 0, sd > 0 ? -1 : 1); v7Gest(best.id, 30, sim.t, 1.0, 0, 0, sd > 0 ? 1 : -1);
        OSH[o.id] = OSH[best.id] = sim.t + 2.5;
    }
    /* her sim adımından sonra: yüksek top kafa adayları, havadaki topun kontrolü (göğüs/uyluk), geçilen savunmacı */
    function oaStep(sim) {
        if (!OA_ON) return;
        oaAerial(sim);
        if (V8B.an) try { oaShoulder(sim); } catch (e) { }
        var B = sim.ball, o = B.owner, oid = o ? o.id : -1, i;
        if (oid !== OA.own) {
            OA.own = oid;
            if (o && o.role !== 'GK' && sim.mode === 'live' && !(OA.hdr === oid && sim.t - OA.hdrT < .06)) {
                var zp = S.prevB.z || 0;
                if (zp > .45 && zp < 1.6) {
                    var vx = (B.x - S.prevB.x) / DT, vy = (B.y - S.prevB.y) / DT, vl = Math.hypot(vx, vy);
                    gkIssue(1, oid, 16, sim.t + .02, sim.t - .04, oaD(OA.tmp, B.x, B.y, zp, vl > .3 ? vx / vl : 0, vl > .3 ? vy / vl : 0, zp + .17 > 1.0 ? 2 : 1, o.vx, o.vy, 0, 0, 0));
                }
            }
        }
        for (i = 0; i < 22; i++) {
            var p = sim.players[i], s = p.stunT;
            if (s === OA.stun[i]) continue;
            OA.stun[i] = s;
            if (s > sim.t + .05 && sim.mode === 'live' && o && o.team !== p.team && !p.off)      // motor savunmacıyı "geçildi" saydı: boşa uzanma + denge kaybı
                { var slm = p.slideMiss != null && sim.t - p.slideMiss < .1; gkIssue(1, i, 12, sim.t + (slm ? .12 : .04), sim.t - .03, oaD(OA.tmp, B.x, B.y, o.x, o.y, Math.hypot(p.vx - o.vx, p.vy - o.vy), slm ? 3 : 1, oaSideY(oaYaw(p), p.x, p.y, B.x, B.y), 3, s - sim.t, p.vx, p.vy)); if (slm) OA.gnd[i] = sim.t + 1.1; }      /* [sav] kacan kayma: kayarak */
        }
    }

    /* [ses] hızlı akış (FM maç arası, ileri sarma, yüksek hız): yalnız uğultu ve büyük tepkiler */
    function sndFF() { return !!(S.skip || (S.watch === 'fm' && S.fm && S.fm.sid === S.sid && S.fm.ph === 'gap') || liveSpeed() * (S.pace || 1) * (S.lk || 1) > 8.5); }
    /* [ses] tribün şiddeti: topa sahip takımın atak tehlikesi (kaleye uzaklık; şut yolda = en yüksek), ev sahibi/deplasman, ölü top, son dakika
       gerginliği (skor farkı ≤ 1, 75'+), duraklatma. FM önemli an oynatımında oynatılan kareden. */
    function sndTick2() {
        var sim = S.sim; if (!sim || typeof sndCrowd !== 'function') return;
        var F = S.watch === 'fm' && S.fm && S.fm.sid === S.sid ? S.fm : null, clip = !!(F && F.ph === 'clip'), bx, by, own, tens = 0;
        if (clip) { bx = FMV.bx; by = FMV.by; own = FMV.owner >= 0 && sim.players[FMV.owner] ? sim.players[FMV.owner].team : -1; }
        else { bx = sim.ball.x; by = sim.ball.y; own = sim.ball.owner ? sim.ball.owner.team : (sim.pass && sim.pass.active ? sim.pass.team : -1); }
        if (own >= 0) { var gx = sim.teams[own].dir === 1 ? PW : 0; tens = Math.max(0, Math.min(1, (42 - Math.hypot(gx - bx, PH / 2 - by)) / 30)); }
        if (!clip && sim.shot) { tens = 1; own = sim.shot.team; }
        var ff = sndFF(); if (ff) tens *= .5;
        var mi = minOf(sim.t), sd = sim.teams[0].score - sim.teams[1].score, late = mi >= 75 && Math.abs(sd) <= 1 ? Math.min(1, (mi - 75) / 15) : 0;
        sndCrowd({ tens: tens, home: own === 0, dead: !clip && sim.mode === 'dead', late: late, ff: ff, paused: !S.running && !S.hold });
    }
    function onLine(l) {
        try { $('match-time').innerText = fmt(S.sim.t); addTicker(l.text); fmLine(l.text, l); } catch (e) { warn('anlatım', e); }
        S.focus = { ids: l.ids, until: performance.now() + 2600 };
    }

    function onSimEvent(ev) {
        try { handle(ev); } catch (e) { warn('olay ' + ev.type, e); }
    }
    function handle(ev) {
        var sim = S.sim, T = ev.team, m = ev.meta || {}, ps = S.pst;
        if (DL.on && !ev.__dl) { ev.__dl = 1; actEvent(ev, m); DL.q.push(ev); if (ev.type === 'GOAL' && !S.scHold) { var sh0 = [sim.teams[0].score, sim.teams[1].score]; if (T === 0 || T === 1) sh0[T] = Math.max(0, sh0[T] - 1); S.scHold = sh0; }      // [v139]
            if (ev.type === 'GOAL' || ev.type === 'CARD' || ev.type === 'VAR') DL.fz = 1; return; }      // [v135] aksiyon simde, gerisi goruntu olaya gelince (gol/kart/VAR: sim durur, goruntu yetisir)
        if (fmIntercept(ev)) return;                                       // [fm] önemli an: görüntü olaya ulaşınca işlenir
        if (ev.type === 'VAR') { if (S.vs) S.vs.after.push(ev); else varEv(ev); return; }          // VAR: hakem monitöre gider; sonuç sahne bitince işlenir (aynı adımda ikinci inceleme varsa sırayla)
        if (S.vs && (ev.type === 'GOAL' || ev.type === 'CARD')) { S.vs.after.push(ev); return; }   // incelemenin sonucuna bağlı olaylar sahne bitince işlenir (skor/kart önceden görünmesin)
        var sndH = false; if (/^(FOUL|OFFSIDE|THROWIN|CORNER|ADV|CARD|OFF)$/.test(ev.type)) sqLog('ev:' + ev.type + (ev.meta && ev.meta.adv ? ':adv' : ev.meta && ev.meta.back ? ':back' : ev.meta && ev.meta.card ? ':' + ev.meta.card : ''));
        if ((ev.type === 'FOUL' && ev.meta && ev.meta.adv) || ev.type === 'ADV') {      /* [v186] avantaj: düdük yok, hakem kolları öne (≈1,8 sn); avantaj oluşmazsa geri dönüş düdüğü */
            sndH = true; var lsA = Math.max(.5, liveSpeed());
            if (ev.type === 'FOUL') { S.advShow = { until: performance.now() + 1800 / lsA }; if (V7.on && sqOn()) V7.band = { kind: 'adv', txt: 'Oyun devam ediyor', team: 1 - ev.team, until: performance.now() + 2200 / lsA }; }
            else if (ev.meta && ev.meta.back) { var sidB = S.sid; setTimeout(function () { if (S.sid === sidB) try { playWhistle(); } catch (e) { } }, 300 / lsA); }
        } else
        if ((ev.type === 'FOUL' || ev.type === 'OFFSIDE') && sqOn()) {      /* [v186] düdük temastan ~0,45 sn (ofsaytta bayraktan ~0,55 sn) sonra: temas / bayrak önce görülür */
            sndH = true; var evW = ev, sidW = S.sid; setTimeout(function () { if (S.sid !== sidW) return; sqLog('duduk:' + evW.type); try { if (!sndEvent(evW, { ff: sndFF() }) && evW.type === 'FOUL') playWhistle(); } catch (e) { } }, (ev.type === 'FOUL' ? 450 : 550) / Math.max(.5, liveSpeed()));
        } else if (ev.type !== 'CARD' && ev.type !== 'GOAL') { try { sndH = sndEvent(ev, { ff: sndFF() }); } catch (e) { } }      // [ses] vuruş, şut, kurtarış, direk, kaçan fırsat, faul, ofsayt, korner
        if (V7.on) try { v7RefEv(ev); if (ev.type === 'FOUL' && !(ev.meta && ev.meta.adv)) v7FoulRpPlan(); } catch (e) { }      // [v187]
        if (ev.type === 'CARD' && sqOn() && !(ev.meta && ev.meta.var)) S.feedCard = ev;      // [v186] kart satırı kart gösterilince (sqCard)
        else if (ev.type !== 'GOAL') S.feed.push(ev);      // [v139] gol satiri top cizgiyi gecince (goalAnnounce)
        try { fmLog(ev); } catch (e) { }                                             // [fm2] önemli anlar / baskı
        if (!ev.__dl) actEvent(ev, m);
        handleRest(ev, m, sim, T, ps, sndH);
    }
    function actEvent(ev, m) {      // [v135] olayin 3B aksiyon kismi (gecikmeli gosterimde olay aninda, sim saatinde)
        if (V7.on) try { v7Event(ev, m); } catch (e) { }      // [v187] değişiklik görünümü, kaçan şut / ofsayt jestleri
        if (ev.type === 'OFFSIDE') try { arOff(ev); } catch (e) { }      // [yan] yan hakem bayragi
        var gkHandK = false; try { gkHandK = gkEvent(ev); } catch (e) { warn('kaleci aksiyonu', e); }      // [gk] kurtarış/alma/oyuna sokma (elle oyuna sokmada bacak vuruşu oynatılmaz)
        try { if (!gkHandK && spEvent(ev)) gkHandK = true; } catch (e) { warn('duran top aksiyonu', e); }  // [sp] taç / koşulu duran top vuruşu (temas sim saatinde, R3.kick yok)
        try { if (!gkHandK && oaEvent(ev)) gkHandK = true; } catch (e) { warn('oyuncu aksiyonu', e); }     // [oa] vuruş/kafa/müdahale/faul/kart/blok (sim saatinde, R3.kick yok)
        if (S.r3 && S.use3 && !gkHandK && (ev.type === 'PASS' || ev.type === 'SHOT' || ev.type === 'CLEAR')) {               // vuruş tipi (şut/pas/pas-yüksek/uzaklaştırma/kafa) ve güç motor olay verisinden (meta.tag/meta.speed/meta.high/meta.cross) türetilir - eskiden üçü de AYNI animasyonu paylaşıyordu
            try {
                var kk, kp = .5;
                if (ev.type === 'SHOT') { kk = m.tag === 'HEAD' ? 'head' : 'shot'; if (m.speed != null) kp = Math.max(0, Math.min(1, (m.speed - 21) / 12)); }
                else if (ev.type === 'PASS') kk = (m.high || m.cross) ? 'pass_high' : 'pass';
                else kk = 'clear';
                S.r3.kick(ev.p, kk, kp, m.foot, DL.on ? ev.t - DT + (S.clkOff || 0) : null);                            // m.foot: motorun seçtiği vuruş ayağı ('L'/'R') - solak oyuncu sol bacağıyla vurur · [v135] gecikmede temas ani
            } catch (e) { }
        }
    }
    function handleRest(ev, m, sim, T, ps, sndH) {
        if (KEY_TYPES[ev.type]) S.keyHit = true;
        if (KEY_PACE[ev.type] || (ev.type === 'FOUL' && m.pen)) S.keyUntil = Math.max(S.keyUntil, ev.t + KEY_TAIL);
        if (S.rt && S.rt.onEvent(ev)) S.dirty = true;                       // reyting: Rating2D olay günlüğünden hesaplar (rol dengeli model), köprü yalnızca yazar
        switch (ev.type) {
            case 'PASS': if (ps[ev.p]) ps[ev.p].ps++; break;
            case 'PASS_OK': if (ps[ev.p2]) ps[ev.p2].pok++; break;
            case 'SHOT':
                bump(ev.p, 'shots'); if (m.on) bump(ev.p, 'sot'); S.lastShot = { p: ev.p, tag: m.tag || null, t: ev.t };
                if (m.tag === 'PEN') { S.penShotVar = S.penVar != null && ev.t - S.penVar < 90; S.penVar = null; }      // bu penaltı VAR incelemesinden geçtiyse gol satırı "VAR: penaltı verildi" etiketi taşır
                break;
            case 'SAVE': bump(ev.p, 'saves'); if (!sndH) playSaveThud(); break;
            case 'POST': if (!sndH) playCrowdGasp(); break;
            case 'BLOCK': if (ps[ev.p]) ps[ev.p].blk++; break;
            case 'TACKLE': if (ps[ev.p]) ps[ev.p].tk++; break;
            case 'INTERCEPT': if (ps[ev.p]) ps[ev.p].ic++; break;
            case 'HEADER': if (ps[ev.p]) ps[ev.p].hd++; break;
            case 'FOUL': if (!sndH) playWhistle(); break;
            case 'CARD': card(ev); break;
            case 'GOAL': goal(ev); break;
            case 'HALFTIME': S.halfPending = true; break;
        }
    }
    /* [v139] gol GORUNTUDE ilan edilir: top cizgiyi tamamen gecene dek (gtLive ile aga ilerler) skor, GOL bandi, ses, spiker, kutlama kamerasi bekler */
    function goal(ev) {
        if (S.goalPend && S.goalPend.ev === ev) return;
        var m0 = ev.meta || {}, T0 = ev.team, sc0 = S.scHold || [S.sim.teams[0].score, S.sim.teams[1].score];
        if (!S.scHold) { sc0 = sc0.slice(); if (T0 === 0 || T0 === 1) sc0[T0] = Math.max(0, sc0[T0] - 1); S.scHold = sc0; }
        S.hold = 'goal';
        S.goalInfo = { scorer: ev.p, ast: (m0.assist != null && m0.assist >= 0) ? m0.assist : -1, own: !!m0.own, team: T0, min: minOf(ev.t), pen: !!m0.pen, gx: ev.x, gy: ev.y };
        if (V8B.gt) {      /* [v188] gol: yenilen takımın kalecisinin "tuttu / çeldi" kestirimi geçersiz (top görüntüde avuçta / kestirilen yolda kalıp çizgiye varmıyordu) · üretilen (v177) gol işaretlenir */
            S.goalInfo.syn = !!m0.v177;
            try { for (var gi8 = 0; gi8 < 22; gi8++) { var gp8 = S.sim.players[gi8]; if (gp8 && gp8.role === 'GK' && gp8.team !== T0 && S.r3 && S.r3.gkCancel) S.r3.gkCancel(gi8, ev.t - DT + (S.clkOff || 0), 1); } } catch (e) { }
        }
        S.goalPend = { ev: ev, t0: performance.now(), sid: S.sid };
    }
    function goalPendTick() {      // [v139] her kare: cizilen top cizgiyi gecti mi (top yaricapi kadar icerde) - gtLive yoksa kisa sure sonra, en gec 1.6 sn
        var P = S.goalPend; if (!P) return;
        if (P.sid !== S.sid) { S.goalPend = null; S.scHold = null; return; }
        var g2 = S.gb, el = performance.now() - P.t0, ok = el > 1600 || (S.gbGi === S.goalInfo && (!g2 ? el > 150 : (g2.x - g2.gl) * g2.dirG > .12));
        if (!ok) return;
        S.goalPend = null; S.scHold = null; goalAnnounce(P.ev);
    }
    function goalAnnounce(ev) {
        var sim = S.sim, m = ev.meta || {}, T = ev.team, scorer = ev.p, own = !!m.own, ast = (m.assist != null && m.assist >= 0) ? m.assist : -1;
        try { S.feed.push(ev); } catch (e) { }
        syncStats();
        var ls = S.lastShot, fk = !!(ls && ls.p === scorer && ls.tag === 'FK' && ev.t - ls.t < 8 && !own && !m.pen), vr = !!m.varOk, mn = minOf(ev.t);
        var text = own ? '⚽ Kendi kalesine - ' + nameOf(scorer) : '⚽ ' + nameOf(scorer) + (ast >= 0 ? ' (Asist: ' + nameOf(ast) + ')' : '') + (m.pen ? ' (P)' : fk ? ' (Frikik)' : '');
        key({ k: 'goal', s: T, n: nameOf(scorer), a: (!own && ast >= 0) ? nameOf(ast) : '', pen: !!m.pen, fk: fk, cor: false, og: own, v: vr ? 'goal' : (m.pen && S.penShotVar ? 'pen' : null), b: mn, x: 0 }, text, 'goal');
        if (!own) {
            bump(scorer, 'goals');
            var sid = dbOf(scorer), aid = ast >= 0 ? dbOf(ast) : null;
            try { recordTournamentGoal(getPlayerFromId(sid), aid != null ? getPlayerFromId(aid) : null, teamObj(T)); } catch (e) { warn('turnuva golü', e); }
            if (ast >= 0) bump(ast, 'assists');
        }
        if (m.pen) S.penShotVar = false;
        S.dirty = true;                                   // gol rozetleri + yenen gol (kaleci/defans reytingi, Rating2D olay günlüğünden işler)
        try { SND.goalTeam = T; } catch (e) { }                               // [ses] gol bağırışı: ev sahibi golünde tüm stat, deplasmanda misafir tribün
        S.hold = 'goal'; var sidNow = S.sid;
        if (!S.goalInfo || S.goalInfo.scorer !== scorer) S.goalInfo = { scorer: scorer, ast: ast, own: own, team: T, min: mn, pen: !!m.pen, gx: ev.x, gy: ev.y };      // [v139] bekleyen golun nesnesi korunur (top aga ilerlemeye devam eder)
        S.goalPulseT0 = performance.now(); S.statTimer = 0;          // [ui2] gol alt bandı + skor bandı bir sonraki karede
        var show = function () { return showGoalEffect(nameOf(scorer) + (own ? ' (k.k.)' : ''), teamObj(T).name); };
        Promise.resolve(show()).then(function () {
            if (S.sid !== sidNow || S.hold !== 'goal') return;
            var go = function () {
                if (S.sid !== sidNow || S.hold !== 'goal') return;
                if (S.replayOn && !(V8B.gt && S.goalInfo && S.goalInfo.syn) && startReplay()) return;      // gol tekrarı açıksa tekrar oynar, bitince maç devam eder · [v188] defterden üretilen golün kaydı yok (kayıttaki an başka bir pozisyon): tekrar oynatılmaz
                S.hold = null; S.last = performance.now();
            };
            /* [v186] TV akışı: GOL bandı kalkınca kamera sevinçteki golcü ve arkadaşlarında kalır (sevinç → tekrar → santra); eskiden bant kalkar kalkmaz tekrar başlıyordu, sevinç görünmüyordu */
            var cm = S.skip || G.__abLive ? 0 : S.preset >= 4 ? 900 : S.preset >= 2 ? 1500 : 2300;
            if (cm > 0 && !own) setTimeout(go, cm); else go();
        });
    }
    /* KART: sarı kart sessiz geçer (klasik motordaki gibi yalnızca kayıt + ses; hakem kartı kısa süre havaya kaldırır); kırmızıda kısa bir sahne gösterilir ve maç saati durur.
       Hakem kararı 2D simülasyondan gelir (faul özellikleri + oyuncunun "Faul Eğilimi" alanı); köprü yalnızca oyunun kayıtlarına yazar. VAR incelemesinden çıkan kart (meta.var) bu sahneden sonra işlenir. */
    function card(ev) {
        var m = ev.meta || {}, T = ev.team, red = m.card === 'R', id = dbOf(ev.p), nm = nameOf(ev.p), tm = teamObj(T), sidNow = S.sid, mn = minOf(ev.t);
        if (id != null) {
            if (red) {
                if (matchData.sentOff) matchData.sentOff.add(id);
                if (T === 0) matchData.redCardCountH = (matchData.redCardCountH || 0) + 1; else matchData.redCardCountA = (matchData.redCardCountA || 0) + 1;
                bumpPlayerStat(id, 'red'); if (m.second && matchData.yellowCounts) matchData.yellowCounts[id] = 2;
            } else {
                if (matchData.yellowCounts) matchData.yellowCounts[id] = (matchData.yellowCounts[id] || 0) + 1;
                bumpPlayerStat(id, 'yellow');
            }
        }
        S.dirty = true;                                   // kadro kart işaretleri + reyting
        if (red) S.cards.r++; else S.cards.y++;
        var sndC = false; try { sndC = sndEvent(ev, { ff: sndFF() }); } catch (e) { } if (!sndC) playCardSound();      // [ses] kart: yuhalama (kırmızıda daha güçlü)
        if (!red) { sqCard(ev, false, null); key({ k: 'yellow', s: T, n: nm, b: mn, x: 0 }, '🟨 Sarı Kart - ' + nm, 'card-yellow'); return; }      /* [v186] kart hakem oyuncuya varınca gösterilir (eskiden faul anında, hakem uzaktayken) */
        var why = m.second ? 'İkinci Sarı Karttan Kırmızı Kart' : m.var ? 'VAR İncelemesi Sonrası Kırmızı Kart' : m.why === 'son_adam' ? 'Son Adam Faulü, Kırmızı Kart' : 'Sert Faul, Kırmızı Kart', men = m.men != null ? m.men : 10;
        key({ k: 'red', s: T, n: nm, y2: !!m.second, v: m.var ? 'red' : null, b: mn, x: 0 }, '🟥 ' + why + ' - ' + nm, 'card-red');
        sqCard(ev, true, function () {      /* [v186] kırmızı kart sahnesi hakem oyuncuya varınca: kart → (atılan oyuncu yürüyerek çıkar) */
        S.hold = 'card'; S.last = performance.now();
        var alive = function () { return S.sid === sidNow && mode === '2d'; }, end = function () { try { hideActionOverlay(); } catch (e) { } if (alive() && S.hold === 'card') { S.hold = null; S.last = performance.now(); } };
        try {
            var first = m.second ? (showActionOverlay('🟨', 'İKİNCİ SARI KART!', nm + ' (' + tm.name + ') ikinci sarısını görüyor...', 'outcome-neutral', tm), overlayWait(1500)) : Promise.resolve();
            first.then(function () {
                if (!alive()) { end(); return; }
                if (m.second) return playOutcomeReveal('🟥', 'KIRMIZI KART!', nm + ' ikinci sarı karttan oyundan atılıyor! ' + tm.name + ' ' + men + ' kişi kalıyor.', 'outcome-bad', 2000);
                showActionOverlay('🟥', 'KIRMIZI KART!', nm + ' (' + tm.name + ') ' + (m.var ? 'VAR incelemesi sonrası' : m.why === 'son_adam' ? 'son adam faulüyle' : 'sert müdahaleyle') + ' oyundan atılıyor! ' + tm.name + ' ' + men + ' kişi kalıyor.', 'outcome-bad', tm);
                return overlayWait(2200).then(function () { try { hideActionOverlay(); } catch (e) { } return overlayWait(300); });
            }).then(end, end);
        } catch (e) { warn('kırmızı kart sahnesi', e); end(); }
        });
    }

    /* =====================================================================
       HAKEM (siyah forma) — yalnızca görüntü: oyunu etkilemez (simülasyonda yoktur); konumu topun ve ölü topun durumundan türetilir.
       Yerleşim "çapraz kontrol" düzenini izler: topun gerisinde ve oyunun karşı yanında durur, oyun ile yan hakem arasında kalmaya çalışır;
       ölü toplarda o duruma uygun yere (penaltı, korner, serbest vuruş barajı, orta yuvarlak, taç çizgisi) gider. Koşusu 3-6 m/sn.
       ===================================================================== */
    var REF = { back: 8, lat: 10, tau: 2, tauD: .5, tauF: 3, d0: 3, k1: .3, vmax: 5.6, acc: 4, ra: 5.5, rs: 7, sep: 2, pmax: .08, hard: 6.4 };     // laboratuvarda (proto/ref_sweep.js) ayarlandı: ≈12-13 km/maç, en çok 6,4 m/sn
    function refInit() { arInit(); var x0 = PW / 2 - 2.5, y0 = PH / 2 - 11.5; S.ref = { x: x0, y: y0, px: x0, py: y0, fx: 1, fy: 0, vx: 0, vy: 0, tx: x0, ty: y0, sd: 1, fl: 1 }; }
    /* [yan] yan hakemler */
    var AR_K = { tau: .22, kv: 2.6, vmax: 7.6, acc: 5.5, off1: 2.0, off2: 4.2, sig: 2.2, run1: 4.6, run0: 3.8 }, AR_FO = [PW / 2 - 3.4, PH + 1.9];
    function arMk(x, ly, half) { return { x: x, y: ly, px: x, py: ly, vx: 0, vy: 0, tx: x, ly: ly, half: half, fx: 0, fy: ly < 0 ? 1 : -1, fc: 0, fp: 0, fT: -9, oT: -9, ox: x, op: 0, dk: null, run: 0 }; }
    function arInit() { S.ar = [arMk(PW * .62, -1.1, 1), arMk(PW * .38, PH + 1.1, -1)]; }
    function arLine(sim, a) {      // kendi yarisinda ofsayt cizgisi: ikinci son savunmaci ya da top (kale cizgisine yakin olan), orta cizgiden geri gelmez
        var h = a.half, b1 = -1e9, b2 = -1e9, i, p, u, tm = -1, B = sim.ball;
        for (i = 0; i < 2; i++) if (sim.teams[i].dir === -h) tm = i;
        for (i = 0; i < 22; i++) { p = sim.players[i]; if (p.off || p.team !== tm) continue; u = p.x * h; if (u > b1) { b2 = b1; b1 = u; } else if (u > b2) b2 = u; }
        var L = Math.max(b2 > -1e8 ? b2 : B.x * h, B.x * h);
        L = Math.min(Math.max(L, h * PW / 2), h > 0 ? PW - .3 : -.3);
        return L * h;
    }
    function arDeadSig(sim, a, dd) {      // olu top basinda isaret (kendi yarisinda / kenarinda)
        var h = a.half, mine = (dd.x - PW / 2) * h > 0, k = dd.kind;
        a.fc = 0;
        if (k === 'throw' && (dd.y < PH / 2) === (a.ly < 0) && (dd.x - PW / 2) * h > -8) { a.fc = 3; a.fp = sim.teams[dd.team].dir; }
        else if (k === 'corner' && mine) { a.fc = 4; a.fp = h; }
        else if (k === 'goalkick' && mine) { a.fc = 5; a.fp = h; }
        if (a.fc) a.fT = sim.t + AR_K.sig;
    }
    var HK_ON = 1;      // [hakem] p_hakem_01
    function arOff(ev) {      // ofsayt: kendi yarisindaki yan hakem bayragi kaldirir, duduk sonrasi yeri gosterir
        var sim = S.sim; if (!S.ar || !sim) return;
        var a = ev.x > PW / 2 ? S.ar[0] : S.ar[1], dy = Math.abs(ev.y - a.ly);
        a.oT = Math.max(ev.t, sim.t - .2); a.ox = ev.x; a.op = dy < PH / 3 ? -1 : dy > PH * 2 / 3 ? 1 : 0;
        if (HK_ON) S.arCut = { t0: performance.now(), i: a === S.ar[0] ? 0 : 1 };      /* [hakem] yayin kesmesi */
    }
    function arStep(sim) {
        if (!S.ar) arInit();
        var t = sim.t, dd = sim.mode === 'dead' ? sim.dead : null, i, a;
        for (i = 0; i < 2; i++) {
            a = S.ar[i]; var h = a.half, gx = h > 0 ? PW : 0, ty = a.ly, tx, oA = t - a.oT;
            if (dd !== a.dk) { a.dk = dd; if (dd) arDeadSig(sim, a, dd); }
            if (oA >= 0 && oA < AR_K.off2) { tx = a.ox; a.fc = oA < AR_K.off1 ? 1 : 2; a.fp = oA < AR_K.off1 ? 0 : a.op; }
            else {
                if (a.fc === 1 || a.fc === 2 || t > a.fT) a.fc = 0;
                tx = arLine(sim, a);
                if (dd && (dd.x - PW / 2) * h > 0) {
                    if (dd.kind === 'corner') tx = gx - h * .4;
                    else if (dd.kind === 'penalty') { tx = gx - h * .3; ty = a.ly < 0 ? PH / 2 - 20.16 : PH / 2 + 20.16; }
                    else if (dd.kind === 'goalkick') tx = gx - h * 16.5;
                }
            }
            a.tx += (tx - a.tx) * (1 - Math.exp(-DT / AR_K.tau));
            var ex = a.tx - a.x, ey = ty - a.y, wvx = Math.abs(ex) < .25 ? 0 : Math.max(-AR_K.vmax, Math.min(AR_K.vmax, (ex - .25 * Math.sign(ex)) * AR_K.kv)), wvy = Math.abs(ey) < .2 ? 0 : Math.max(-5.5, Math.min(5.5, ey * 1.6));
            var ax = wvx - a.vx, ay = wvy - a.vy, al = Math.hypot(ax, ay), lim = AR_K.acc * DT; if (al > lim) { ax *= lim / al; ay *= lim / al; }
            a.vx += ax; a.vy += ay; a.px = a.x; a.py = a.y; a.x += a.vx * DT; a.y += a.vy * DT;
            var vl = Math.hypot(a.vx, a.vy); a.run = a.fc ? 0 : vl > AR_K.run1 ? 1 : vl < AR_K.run0 ? 0 : a.run;      // hizli kosuda kosu yonune, yoksa sahaya donuk (yan adim)
            if (a.run) { a.fx = a.vx / vl; a.fy = a.vy / vl; } else { a.fx = 0; a.fy = a.ly < 0 ? 1 : -1; }
        }
    }
    function arRec(b, q) { var i, a; for (i = 0; i < 2; i++) { a = S.ar ? S.ar[i] : null; if (!a) continue; b[q] = a.x; b[q + 1] = a.y; b[q + 2] = a.fx; b[q + 3] = a.fy; b[q + 4] = a.fc; b[q + 5] = a.fp; q += 6; } }
    function arViewF(v, b, o0, o1, al) {
        var q0 = o0 + RO + 13, q1 = o1 + RO + 13, i, k; if (!v.ar) v.ar = new Float32Array(12); v.fo = AR_FO;
        for (i = 0; i < 2; i++) { k = i * 6; v.ar[k] = b[q0 + k] + (b[q1 + k] - b[q0 + k]) * al; v.ar[k + 1] = b[q0 + k + 1] + (b[q1 + k + 1] - b[q0 + k + 1]) * al; v.ar[k + 2] = b[q0 + k + 2]; v.ar[k + 3] = b[q0 + k + 3]; v.ar[k + 4] = b[q0 + k + 4]; v.ar[k + 5] = b[q0 + k + 5]; }
    }
    function arLive(v, al) {
        var i, k, a; if (!S.ar) return; if (!v.ar) v.ar = new Float32Array(12); v.fo = AR_FO;
        for (i = 0; i < 2; i++) { a = S.ar[i]; k = i * 6; v.ar[k] = a.px + (a.x - a.px) * al; v.ar[k + 1] = a.py + (a.y - a.py) * al; v.ar[k + 2] = a.fx; v.ar[k + 3] = a.fy; v.ar[k + 4] = a.fc; v.ar[k + 5] = a.fp; }
    }
    function refTarget(sim) {
        var B = sim.ball, dd = sim.mode === 'dead' ? sim.dead : null, tx, ty, r = S.ref;
        if (dd) {
            var k = dd.kind, dir = sim.teams[dd.team].dir, ax = dir === 1 ? PW : 0, side = dd.y < PH / 2 ? 1 : -1;      // ax: bu takımın hücum ettiği kale
            if (k === 'kickoff') { tx = PW / 2 - 2.5; ty = PH / 2 - 11.5; }
            else if (k === 'penalty') { tx = ax - dir * (C.PA_D + 2.4); ty = PH / 2 + 12; }
            else if (k === 'corner') { tx = ax - dir * 15; ty = PH / 2 + side * 8; }
            else if (k === 'freekick') {
                var ux = ax - dd.x, uy = PH / 2 - dd.y, ul = Math.hypot(ux, uy) || 1, near = ul < 42, off = near ? 10.5 : 4, pp = near ? 4.5 : 3;
                ux /= ul; uy /= ul; tx = dd.x + ux * off - uy * pp * side; ty = dd.y + uy * off + ux * pp * side;             // topla kale arasında, barajın yanında
            }
            else if (k === 'throw') { tx = dd.x - dir * 6; ty = dd.y + (dd.y < PH / 2 ? 8 : -8); }
            else { var og = dir === 1 ? 0 : PW; tx = og + dir * 24; ty = PH / 2 - side * 9; }                                  // aut atışı: oyunun gelişeceği yöne doğru
        } else {
            // canlı oyun: topun gerisinde (hücum yönüne göre, yön yumuşak izlenir: top el değiştirince ileri geri koşmaz) ve sahanın merkez yanında, oyunun yan hakem tarafında kalır
            var tm = B.owner ? B.owner.team : sim.lastTeam, dp = sim.teams[tm].dir, bx = B.x + B.vx * .4, by = B.y + B.vy * .4;
            r.fl += (dp - r.fl) * (1 - Math.exp(-DT / REF.tauF));
            if (Math.abs(by - PH / 2) > REF.lat * .7) r.sd = by < PH / 2 ? 1 : -1;                                          // yan (histerezisli): top kenara yakınsa merkeze doğru
            tx = bx - r.fl * REF.back; ty = by + r.sd * REF.lat;
        }
        return [Math.max(4, Math.min(PW - 4, tx)), Math.max(5, Math.min(PH - 5, ty))];
    }
    /* hakem hareketi: hedefi yumuşatılmış izler; hız hedefe uzaklıkla artar (yakında yürüyüş, uzakta tempolu koşu; ivme sınırlı), yakın oyunculardan yana çekilir. Anlık hız asla REF.hard'ı aşmaz. */
    function refStep(sim) {
        var r = S.ref, t = refTarget(sim), rcd = HK_ON && S.refCard && performance.now() < S.refCard.until && S.refCard.id >= 0 && sim.players[S.refCard.id] ? sim.players[S.refCard.id] : null;
        if (HK_ON && SQ.card && sim.players[SQ.card.id]) rcd = sim.players[SQ.card.id];      /* [v186] kart bekliyor: hakem oyuncuya koşar */
        if (rcd && rcd.off) rcd = S.offWalk && S.offWalk.id === rcd.id ? S.offWalk : null;      /* [v186] atılan oyuncu motorda saha dışına park edilir: görünen yerine */
        if (rcd && V7.on && rcd.id != null && V7.gv[rcd.id] && V7.gv[rcd.id].x === V7.gv[rcd.id].x) rcd = { x: V7.gv[rcd.id].x, y: V7.gv[rcd.id].y, id: rcd.id };      /* [v187] hakem, kendisine yürüyen oyuncunun GÖRÜNEN konumuna gider */
        var rq = HK_ON && !!SQ.card, RV = rq ? 7.2 : REF.vmax;      /* [v186] kart için hakem oyuncuya hızlı koşar (FM: düdükten 1–2,5 sn sonra yanında) */
        if (rcd) { var cux = r.x - rcd.x, cuy = r.y - rcd.y, cul = Math.hypot(cux, cuy) || 1; t = [rcd.x + cux / cul * 2.2, rcd.y + cuy / cul * 2.2]; }      /* [hakem] kartlanan oyuncuya ~2.2 m */
        var i, p, dead = sim.mode === 'dead', k = 1 - Math.exp(-DT / (dead ? REF.tauD : REF.tau));
        r.tx += (t[0] - r.tx) * k; r.ty += (t[1] - r.ty) * k;
        r.px = r.x; r.py = r.y;
        var dx = r.tx - r.x, dy = r.ty - r.y, d = Math.hypot(dx, dy), want = d < (rq ? 1 : REF.d0) ? 0 : Math.min(RV, (rq ? .9 : REF.k1) * (d - (rq ? 1 : REF.d0))), vx = 0, vy = 0;
        if (d > 1e-6) { vx = dx / d * want; vy = dy / d * want; }
        for (i = 0; i < 22; i++) {
            p = sim.players[i]; if (p.off) continue;
            var ex = r.x - p.x, ey = r.y - p.y, ed = Math.hypot(ex, ey);
            if (ed < REF.ra && ed > 1e-6) { var w = (REF.ra - ed) / REF.ra * REF.rs; vx += ex / ed * w; vy += ey / ed * w; }
        }
        var s0 = Math.hypot(vx, vy); if (s0 > RV) { vx *= RV / s0; vy *= RV / s0; }
        var ax = vx - r.vx, ay = vy - r.vy, al = Math.hypot(ax, ay), lim = (rq ? 6 : REF.acc) * DT;
        if (al > lim) { ax *= lim / al; ay *= lim / al; }
        r.vx += ax; r.vy += ay;
        var nx = r.x + r.vx * DT, ny = r.y + r.vy * DT;
        for (i = 0; i < 22; i++) {                                                     // birinin üstüne binmesin: yumuşak, adım başına sınırlı itme
            p = sim.players[i]; if (p.off) continue;
            var fx = nx - p.x, fy = ny - p.y, fd = Math.hypot(fx, fy);
            if (fd < REF.sep) { var pu = Math.min(REF.sep - fd, REF.pmax); if (fd < 1e-6) nx += pu; else { nx += fx / fd * pu; ny += fy / fd * pu; } }
        }
        var mx = nx - r.px, my = ny - r.py, ml = Math.hypot(mx, my), cap = (rq ? 7.6 : REF.hard) * DT; if (ml > cap) { mx *= cap / ml; my *= cap / ml; }
        r.x = Math.max(1, Math.min(PW - 1, r.px + mx)); r.y = Math.max(1, Math.min(PH - 1, r.py + my));
        r.vx = (r.x - r.px) / DT; r.vy = (r.y - r.py) / DT;
        var bx2 = sim.ball.x - r.x, by2 = sim.ball.y - r.y, bl = Math.hypot(bx2, by2) || 1, fl;
        if (rcd) { bx2 = rcd.x - r.x; by2 = rcd.y - r.y; bl = Math.hypot(bx2, by2) || 1; }      /* [hakem] karti gosterirken oyuncuya bakar */
        r.fx += (bx2 / bl - r.fx) * .12; r.fy += (by2 / bl - r.fy) * .12; fl = Math.hypot(r.fx, r.fy) || 1; r.fx /= fl; r.fy /= fl;
    }

    /* =====================================================================
       VAR İNCELEMESİ (tuval içi) — gerçek prosedür: oyun durur, hakem kulaklığındaki VAR ile konuşur (parmağı kulağında), "TV" işareti yapar,
       sahanın kenarındaki hakem inceleme alanına (RRA, başlıklı monitör) koşar, görüntüleri izler, tekrar TV işareti yapar, oyuna dönüp kararı gösterir.
       Kaynaklar: IFAB VAR protokolü, FIFA VAR, Premier League VAR SSS, slomo.tv RRA. Football Manager'da da (FM19'dan beri) hakem sahanın kenarındaki ekrana gider.
       Karar simülasyondan gelir (ofsayt çizgileri pas anındaki gerçek konumlardan); sahne yalnızca gösterir. Oyun bu sürede durur; skor, kart ve topun yeni yeri
       sonuç açıklanana dek görünmez: sahne, olay anından önceki kareyi (S.vs.snap) çizer. Football Manager'daki şikâyetlerden ders: kutlama sonucu önceden söylemesin,
       inceleme uzamasın (İncelemeyi geç), karar ekranda okunsun (renkli sonuç şeridi).
       ===================================================================== */
    var VS_LABEL = { ofsayt: 'Ofsayt kontrolü', faul: 'Faul kontrolü', el: 'Elle oynama kontrolü' };
    var VS_STAT = { alert: 'Hakem VAR ile görüşüyor', tv1: 'İnceleme başlıyor', walk: 'Hakem inceleme alanına gidiyor', watch: 'Görüntüler inceleniyor', tv2: 'İnceleme tamamlandı', back: 'Hakem sahaya dönüyor' };
    var VS_DUR = { alert: 1, tv1: .7, watch: 4, tv2: .7, sign: 2, signSkip: 1 };            // saniye (sahne saati; hız düğmesine göre ölçeklenir)
    function vsInfo(ev) {
        var m = ev.meta || {}, cm = Math.max(0, Math.round(Math.abs(m.margin || 0) * 100)), o = { label: '', rt: '', rs: '', tone: 'neutral' };
        if (m.kind === 'pen') {
            o.label = 'Penaltı kontrolü';
            if (m.outcome === 'confirm') { o.rt = 'PENALTI GEÇERLİ'; o.rs = 'Temas var, hakem kararı onaylandı'; o.tone = 'good'; }
            else if (m.reason === 'disi') { o.rt = 'PENALTI İPTAL'; o.rs = 'Faul ceza sahası dışında · serbest vuruş'; o.tone = 'warn'; }
            else { o.rt = 'PENALTI İPTAL'; o.rs = m.clean ? 'Topa temiz müdahale · oyun kaleciyle başlıyor' : 'Temas yok · oyun kaleciyle başlıyor'; o.tone = 'warn'; }
        } else if (m.kind === 'red') {
            o.label = 'Kırmızı kart kontrolü';
            if (m.outcome === 'confirm') { o.rt = 'KIRMIZI KART ONAYLANDI'; o.rs = 'Oyuncu oyundan atılıyor'; o.tone = 'bad'; }
            else if (m.outcome === 'upgrade') { o.rt = 'KIRMIZI KART'; o.rs = 'VAR sarı kartı kırmızıya çevirdi'; o.tone = 'bad'; }
            else { o.rt = 'KIRMIZI KART İPTAL'; o.rs = 'Karar sarı karta çevrildi'; o.tone = 'warn'; }
        } else {
            o.label = VS_LABEL[m.reason] || 'İnceleme';
            if (m.outcome === 'cancel') { o.rt = 'GOL İPTAL'; o.rs = m.reason === 'ofsayt' ? 'Ofsayt' + (m.op != null && m.op >= 0 && m.op !== ev.p ? ' (atakta: ' + shortOf(m.op) + ')' : '') + ' · ' + Math.max(1, cm) + ' cm' : m.reason === 'el' ? 'Golden önce elle oynama' : m.fp != null && m.fp >= 0 ? 'Golden önce faul (' + shortOf(m.fp) + ')' : 'Golden önce faul'; o.tone = 'bad'; }
            else { o.rt = 'GOL GEÇERLİ'; o.rs = m.reason === 'ofsayt' ? (cm < 1 ? 'Milimetrik farkla ofsayt yok' : 'Ofsayt yok · ' + cm + ' cm içeride') : 'İhlal tespit edilmedi'; o.tone = 'good'; }
        }
        return o;
    }
    function varEv(ev) {
        var m = ev.meta || {}, R = S.ring, info = vsInfo(ev), rings = [], n1 = R.n - 1, snap = null, kind = m.kind || 'goal';
        S.keyHit = true; S.keyUntil = Math.max(S.keyUntil, ev.t + KEY_TAIL); S.varCount++; S.refCard = null;
        if (n1 >= 0) {                                                                    // sahne, kararın uygulanmasından ÖNCEKİ kareyi çizer (simülasyon topu yeni yerine koydu, atılan oyuncuyu sahadan çıkardı)
            var so = (n1 % RING) * FS; snap = R.buf.slice(so, so + FS);
            if (kind === 'goal') { snap[1] = ev.x; snap[2] = ev.y; snap[3] = 0; snap[4] = -1; }        // gol incelemesi: top ağda
        }
        if (ev.p >= 0) rings.push({ id: ev.p, col: kind === 'goal' ? '#ffc93c' : '#ff5a6b' });
        if (ev.p2 >= 0) rings.push({ id: ev.p2, col: '#7fd1ff' });
        if (m.op != null && m.op >= 0 && m.op !== ev.p) rings.push({ id: m.op, col: '#ff5a6b' });      // atakta ofsayta düşen oyuncu (golcü değil)
        try { S.feed.push(Object.assign({}, ev, { type: 'VARCHK', id: ev.id + .2 })); } catch (e) { warn('VAR satırı', e); }
        S.vs = { ev: ev, m: m, kind: kind, info: info, phase: 'alert', t: 0, tt: 0, after: [], sid: S.sid, score: ev.score ? ev.score.slice() : null, snap: snap, n1: n1, rings: rings, skip: false, reveal: false, path: null, mon: null, fx: ev.x, fy: ev.y, sgAt: 0 };
        try { vsMonitor(S.vs); } catch (e) { warn('VAR monitörü', e); S.vs.mon = null; }
        S.hold = 'var'; S.last = performance.now();
        showSkip('İncelemeyi geç');
        try { playTone(880, .09, 'sine', .12); } catch (e) { }
    }
    function vsScale() { return S.raw ? 40 : ({ '0.5': .85, 1: 1, 2: 1.6, 4: 2.6 }[String(S.preset)] || 1); }
    function rraPoint() { return [PW / 2, PH + 9 / K]; }                                        // hakemin monitörün önünde duracağı nokta (dış çizginin ~9 px dışı)
    function vsGo(vs, tx, ty) { var r = S.ref, d = Math.hypot(tx - r.x, ty - r.y); vs.path = { tx: tx, ty: ty, sp: Math.max(4.2, Math.min(7, d / 5)), d0: d }; }
    function vsMove(vs, ds) {
        var r = S.ref, p = vs.path, dx = p.tx - r.x, dy = p.ty - r.y, d = Math.hypot(dx, dy), i, sn = vs.snap;
        if (d < .25) return true;
        var sp = p.sp * Math.min(1, vs.t / .7 + .2) * Math.min(1, d / 2.2 + .25), step = Math.min(d, sp * ds);
        r.x += dx / d * step; r.y += dy / d * step; r.vx = dx / d * sp; r.vy = dy / d * sp; r.fx = dx / d; r.fy = dy / d;
        if (sn) for (i = 0; i < 22; i++) {                                                // donmuş oyuncuların içinden geçmez, yanlarından dolanır
            var qx = sn[6 + i * 4], qy = sn[7 + i * 4]; if (qx < -20) continue;
            var ex = r.x - qx, ey = r.y - qy, ed = Math.hypot(ex, ey);
            if (ed < 2.6 && ed > 1e-6) { var pu = (2.6 - ed) * 2.4 * ds; r.x += ex / ed * pu; r.y += ey / ed * pu; }
        }
        return d - step < .25;
    }
    function vsPhase(vs, ph) {
        if (vs.phase === 'watch' && ph !== 'watch' && vs.rpx) {      // [v132] VAR görüntüsünden çıkış: tekrarın aksiyonları canlıya taşınmaz (endReplay gibi), kurgu kesmesi
            vs.rpx = null; try { if (S.r3 && S.r3.gkClear) S.r3.gkClear(); } catch (e) { } r3Cut(); try { SP.iss = 0; SP.w.fill(0); } catch (e) { }
        }
        vs.phase = ph; vs.t = 0;
    }
    function faceTo(x, y) { var r = S.ref, dx = x - r.x, dy = y - r.y, l = Math.hypot(dx, dy) || 1; r.fx = dx / l; r.fy = dy / l; }
    /* karar açılır: canlı görünüme geçilir (top yeni yerinde, atılan oyuncu sahada değil); geçerli golde top ağda kalır, kutlama hemen ardından başlar */
    function vsSign(vs) {
        vsPhase(vs, 'sign'); vs.sgAt = performance.now(); vs.reveal = !(vs.kind === 'goal' && vs.m.outcome === 'confirm'); hideSkip();
        try { if (vs.info.tone === 'bad' || vs.info.tone === 'warn') playDisappointment(); else playTone(660, .12, 'sine', .14); } catch (e) { }
    }
    function varAdvance(dt) {
        var vs = S.vs, r = S.ref, sim = S.sim; if (!vs) return;
        if (vs.sid !== S.sid || mode !== '2d') { S.vs = null; S.hold = null; hideSkip(); return; }
        var ds = Math.min(dt, .05) * vsScale() * (vs.user && (vs.phase === 'walk' || vs.phase === 'back') ? 1.8 : 1), ph = vs.phase, ra;
        vs.t += ds; vs.tt += ds;
        switch (ph) {
            case 'alert': r.vx = r.vy = 0; faceTo(vs.fx, vs.fy); if (vs.t >= VS_DUR.alert) vsPhase(vs, 'tv1'); break;
            case 'tv1': r.vx = r.vy = 0; faceTo(vs.fx, vs.fy); if (vs.t >= VS_DUR.tv1) { ra = rraPoint(); vsGo(vs, ra[0], ra[1]); vsPhase(vs, 'walk'); } break;
            case 'walk': ra = rraPoint(); vs.path.tx = ra[0]; vs.path.ty = ra[1]; if (vsMove(vs, ds) || vs.t > 18) { r.x = ra[0]; r.y = ra[1]; r.vx = r.vy = 0; vsPhase(vs, 'watch'); } break;
            case 'watch': ra = rraPoint(); r.x = ra[0]; r.y = ra[1]; r.vx = r.vy = 0; r.fx = 0; r.fy = 1; if (vs.user) { if (!vs.user.w) { vs.user.w = 1; try { if (vs.user.onWatch) vs.user.onWatch(); } catch (e) { } } if (vs.user.ret) vsPhase(vs, 'tv2'); else if (vs.t >= vsWatchDur(vs) + .6) vs.t = 0; } else if (vs.t >= vsWatchDur(vs)) vsPhase(vs, 'tv2'); break;     // [var3d] tekrar (ve ofsayt çizgileri) bitene dek
            case 'tv2': r.vx = r.vy = 0; r.fx = 0; r.fy = 1; if (vs.t >= VS_DUR.tv2) { ra = refTarget(sim); vsGo(vs, ra[0], ra[1]); vsPhase(vs, 'back'); } break;
            case 'back': ra = refTarget(sim); vs.path.tx = ra[0]; vs.path.ty = ra[1]; if (vsMove(vs, ds) || vs.t > 18) { if (vs.user) { vsPhase(vs, 'await'); try { if (vs.user.onBack) vs.user.onBack(); } catch (e) { } } else vsSign(vs); } break;
            case 'await': r.vx = r.vy = 0; if (vs.fx != null) faceTo(vs.fx, vs.fy); break;
            case 'sign': r.vx = r.vy = 0; if (sim.mode === 'dead' && sim.dead) faceTo(sim.dead.x, sim.dead.y); if (vs.t >= (vs.skip ? VS_DUR.signSkip : VS_DUR.sign)) { varFinish(); return; } break;
        }
        r.px = r.x; r.py = r.y;
    }
    function varSkip() {
        var vs = S.vs; if (!vs || vs.skip) return;
        vs.skip = true; hideSkip();
        if (vs.phase !== 'sign') { var t = refTarget(S.sim), r = S.ref; r.x = t[0]; r.y = t[1]; r.px = r.x; r.py = r.y; r.vx = r.vy = 0; vsSign(vs); }
    }
    /* sahne bitti: sonuç işlenir (spiker satırı, reyting, kritik an), oyun serbest kalır, incelemeye bağlı GOAL/CARD olayları sırayla işlenir */
    function varFinish() {
        var vs = S.vs; if (!vs) return;
        var ev = vs.ev, after = vs.after, m = vs.m, T = ev.team;
        S.vs = null; hideSkip(); if (S.ref) { S.ref.tx = S.ref.x; S.ref.ty = S.ref.y; S.ref.px = S.ref.x; S.ref.py = S.ref.y; }
        try {
            S.feed.push(ev);                                                             // sonuç satırı (onayda gol/kart satırına eklenir)
            if (S.rt && S.rt.onEvent(ev)) S.dirty = true;
            if (vs.kind === 'goal' && m.outcome === 'cancel') {
                var nm = nameOf(ev.p);
                key({ k: 'varno', s: T, n: nm, why: m.reason || 'ofsayt', cm: m.reason === 'ofsayt' ? Math.max(1, Math.round(Math.abs(m.margin || 0) * 100)) : 0, b: minOf(ev.t), x: 0 }, 'İptal Edilen Gol (VAR) - ' + nm, 'var');
            }
            if (vs.kind === 'pen' && m.outcome === 'confirm') S.penVar = ev.t;           // bu penaltı VAR incelemesinden geçti: gol olursa "VAR: penaltı verildi" etiketi
            S.dirty = true;
        } catch (e) { warn('VAR sonucu', e); }
        S.hold = null; S.last = performance.now(); S.acc = 0;
        syncStats();
        after.forEach(function (e) { try { handle(e); } catch (x) { warn('VAR sonrası olay ' + e.type, x); } });      // GOAL → hold 'goal' · CARD (kırmızı) → hold 'card' · ikinci VAR → yeni sahne
    }

    /* ---------- oyun akışı: başlat / duraklat / hız / ikinci yarı ---------- */
    var origStart = G.startMatch, origPause = G.pauseMatch, origSpeed = G.setMatchSpeed, origSecond = G.startSecondHalf;
    G.startMatch = function () {
        if (mode !== '2d') return origStart.apply(this, arguments);
        if (matchData.isFinished) { resetMatchStats(); }
        if (!on()) prepare();
        if (!S.sim) return;
        var kick = S.sim.t === 0 && !S.boot;
        if (kick) { S.boot = true; playWhistle(); try { renderHighlightsList(); } catch (e) { } S.sim.events.forEach(function (e) { if (e.type === 'KICKOFF') S.feed.push(e); }); }
        $('btn-start-match').style.display = 'none'; $('btn-pause-match').style.display = 'inline-block';
        S.running = true; S.last = performance.now(); startCrowdAmbience(); lockMode(true); loop();
    };
    G.pauseMatch = function () {
        if (mode === '2d') { S.running = false; }
        return origPause.apply(this, arguments);
    };
    G.setMatchSpeed = function (s) {
        if (mode === '2d' && SPEEDS[String(s)]) {
            S.preset = +s; S.speed = SPEEDS[String(s)]; S.raw = false; savePrefs();
            if (+s !== 0.5) { try { origSpeed.call(this, s); } catch (e) { } }      // oyunun kendi hız değişkeni ve düğme vurgusu (½x oyunda yok)
            syncSpeedUI(); return;
        }
        return origSpeed.apply(this, arguments);
    };
    function syncSpeedUI() {
        var ids = { '0.5': 'speed-half', 1: 'speed-1x', 2: 'speed-2x', 4: 'speed-4x' };
        if (mode !== '2d') return;
        Object.keys(ids).forEach(function (k) { var b = $(ids[k]); if (b) { var on = String(S.preset) === String(k); b.classList.toggle('active-speed', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); } });
    }
    G.startSecondHalf = function () {
        if (mode !== '2d' || !S.sim) return origSecond.apply(this, arguments);
        $('halftime-overlay').classList.remove('active');
        matchData.currentHalf = 2; addTicker('İkinci yarı başlıyor!'); playWhistle();
        $('btn-start-match').style.display = 'none'; $('btn-pause-match').style.display = 'inline-block';
        S.hold = null; S.running = true; S.last = performance.now(); startCrowdAmbience(); loop();
    };
    var origReset = G.resetMatchStats;
    G.resetMatchStats = function () {
        var r = origReset.apply(this, arguments);
        try { S.running = false; S.hold = null; if (mode === '2d') prepare(); else { S.sim = null; } lockMode(false); syncModeUI(); } catch (e) { warn('sıfırlama', e); }
        return r;
    };

    /* ---------- ana döngü ---------- */
    /* tempo: tabanın üstüne binen çarpan.
       GENİŞ ÖZET (varsayılan): tüm maç akıcı tempoda izlenir; tehlike ve şutta yavaşlar, ölü toplarda ve kendi yarı sahada hızlanır. */
    function paceWide(sim) {
        if (!S.smart) return 1;
        if (sim.mode === 'dead') {
            var dd = sim.dead, k = dd && dd.kind;
            if (S.use3 && SP_ON && SP.d === dd && SP.tcP != null && SP.tcP - sim.t < SP_SLOW) return k === 'penalty' ? .9 : (k === 'freekick' || k === 'corner') && Math.abs((sim.teams[dd.team].dir === 1 ? PW : 0) - dd.x) < 32 ? .85 : 1;   // [sp] 3B: koşu ve vuruş/atış normal hızda görünsün
            if (k === 'penalty') return .9;
            if (k === 'freekick' || k === 'corner') { var gx = sim.teams[dd.team].dir === 1 ? PW : 0; return Math.abs(gx - dd.x) < 32 ? .85 : 3; }
            return 3.2;
        }
        if (sim.shot) return .5;
        var B = sim.ball, tm = B.owner ? B.owner.team : sim.lastTeam, gxa = sim.teams[tm].dir === 1 ? PW : 0, dg = Math.abs(gxa - B.x);
        if (dg < 20) return .62;
        if (dg < 36) return .78;
        if (dg > 66) return 1.4;
        return 1;
    }
    /* KRİTİK ANLAR: pozisyonlar (rakip kaleye yakın top, şut, duran top, sonuç) normal hızda; aradaki süre ileri sarılır.
       Çarpan, topun hücum ettiği kaleye uzaklığıyla yumuşakça yükselir: son 23 m'de .8, orta sahaya doğru 11'e kadar.
       Uzaklık eğrisi proto/pace_lab.js ile ölçüldü: şutların yarısı ≥ 9 sn'lik hazırlığıyla izleniyor, tam maç ½ süreden kısa. */
    var KP = [[0, .8], [23, .8], [34, 2.2], [46, 6], [58, 11]];        // [hücum edilen kaleye uzaklık (m), çarpan]
    function paceKey(sim) {
        if (sim.mode === 'dead') {
            var dd = sim.dead, k = dd && dd.kind;
            if (k === 'penalty' || k === 'corner') return .9;
            if (k === 'freekick') { var gx = sim.teams[dd.team].dir === 1 ? PW : 0; return Math.abs(gx - dd.x) < 34 ? .9 : 8; }
            return 8;
        }
        if (sim.shot) return .5;
        if (sim.t < S.keyUntil) return .9;
        var B = sim.ball, tm = B.owner ? B.owner.team : sim.lastTeam, gxa = sim.teams[tm].dir === 1 ? PW : 0, dg = Math.abs(gxa - B.x), i;
        for (i = 1; i < KP.length; i++) if (dg <= KP[i][0]) { var a = KP[i - 1], b = KP[i], f = (dg - a[0]) / (b[0] - a[0]); return Math.exp(Math.log(a[1]) + f * (Math.log(b[1]) - Math.log(a[1]))); }
        return KP[KP.length - 1][1];
    }
    /* [len] maç süresi: 1x'e göre "oyun süresi" (sevinç/tekrar/VAR/devre arası hariç) seçilen dakikaya oturacak tempo katsayısı.
       Açık döngü başlangıç (izleme biçiminin ölçülmüş 1x süresi / hedef) + kalan simülasyon / kalan süre ile kapalı döngü düzeltme. */
    var LEN_BASE = { wide: 8, key: 4, fm: 5 };
    function lenK(sim, dt) {
        var T = typeof matchLenMin === 'function' ? matchLenMin() : 0;
        if (!T || S.raw) { if (S.ml) S.ml.k = 1; return 1; }
        var L = S.ml, base = (S.use3 ? LEN_BASE3 : LEN_BASE)[S.watch] || 8;
        if (!L || L.sid !== S.sid) L = S.ml = { sid: S.sid, e: 0, k: base / T };
        L.e += dt * (S.use3 && !S.raw ? liveSpeed() : S.speed / 3);      // [fiz] 3B'de 1x = gercek zaman                                                     // 1x-eşdeğeri oynanan saniye
        var B = Math.max(4, T * 60 - L.e), R = Math.max(0, SIM_TOTAL - sim.t), rm = SIM_TOTAL / (base * 60);
        var kq = Math.max(.3, Math.min(5, (R / B) / rm));
        L.k += (kq - L.k) * (1 - Math.exp(-dt / 2.5)); L.T = T; L.B = B;
        return L.k;
    }
    /* [fiz] 3B genis ozet temposu: tehlikeli oyun gercek zamanda, uzak bolge biraz hizli, olu top hazirligi hizli (vurus/atis ani gercek zamanda) */
    function paceWide3(sim) {
        if (!S.smart) return 1;
        if (sim.mode === 'dead') {
            var dd = sim.dead, k = dd && dd.kind, gx0 = dd && sim.teams[dd.team] ? (sim.teams[dd.team].dir === 1 ? PW : 0) : 0;
            if (SP_ON && SP.d === dd && SP.tcP != null && SP.tcP - sim.t < SP_SLOW) return 1;
            return k === 'penalty' || k === 'corner' || (k === 'freekick' && Math.abs(gx0 - dd.x) < 32) ? 2.5 : 5;
        }
        if (sim.shot) return 1;
        var B = sim.ball, tm = B.owner ? B.owner.team : sim.lastTeam, gxa = sim.teams[tm].dir === 1 ? PW : 0, dg = Math.abs(gxa - B.x);
        return dg < 36 ? 1 : dg <= 66 ? 1.25 : 1.6;
    }
    function paceTarget(sim) { if (S.use3 && !S.raw && S.watch === 'wide') return paceWide3(sim); return S.watch === 'fm' ? .9 * Math.max(.75, Math.min(1.5, Math.sqrt(S.lk || 1))) / Math.max(.01, S.lk || 1) : S.watch === 'key' ? paceKey(sim) : paceWide(sim); }
    /* [carry] görünen top sürme - bkz. p_carry_02 başlığı. CRD: görünen top (x, y, z, vx, vy, vz, w ileri dönüş r*omega), tau son dokunuştan süre, Tt planlanan döngü,
       n dokunuş sayacı, k tür (0 sürme, 1 dönüş, 2 ilk dokunuş, 3 taban/durdurma), tl/tp son/önceki dokunuş anı (sim sn), plan bir sonraki planlı temas evresi,
       due ara dokunuş bekliyor, gph/pgph sahibin adım evresi (adım sonu/başı). GPH: her oyuncunun adım evresi (3B çiziciyle aynı formül) */
    var CRP = { MUG: 5.4, RD: .74, KD: .0239, SPIN: .29, R: .11, REACH: 1.0 };      // Unity DribbleRef: kayma mu*g, çim yuvarlanma, hava, itişte dönüş kaybı (20° bot); top yarıçapı
    var CRD = { on: 0, pon: 0, own: -1, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, w: 0, tau: 0, Tt: .6, n: 0, k: 0, tl: -9, tp: -9, pend: 0, tFirst: 0, due: 0, plan: 0, pf: 0, knock: 0, kr: {}, px: 0, py: 0, pz: 0, gph: 0, pgph: 0 }, CR_T = { v: 0, w: 0 };
    var GPH = new Float64Array(22), GPHP = new Float64Array(22), GCK = new Float32Array(22);
    // temas evresi tablosu (hız 0..9 m/sn: [sol uç ileri, sol evre, sağ uç ileri, sağ evre]) - 3B çizicinin kendi iskeletinden; 2B'de varsayılan
    var CRT_DEF = [[.19, 3.14, .19, 5.85], [.26, 3.23, .27, 5.93], [.33, 3.14, .32, 5.93], [.32, 2.71, .32, 5.93], [.32, 2.27, .31, 5.93], [.34, 2.01, .33, 5.93], [.35, 1.75, .34, 5.93], [.35, 1.48, .33, 5.85], [.35, 1.22, .35, 5.85], [.34, 1.13, .36, 5.85]];
    function crTab() { var R3 = S.r3; try { if (R3 && R3._carryTab && !R3.lost) return R3._carryTab(); } catch (e) { } return CRT_DEF; }
    function crCl(v, a, b) { return v < a ? a : v > b ? b : v; }
    var GSP = new Float64Array(22), GAIT_CX = [0, 1, 1.6, 2.5, 3.5, 4.2, 5, 6, 7, 8.3, 9.5, 10.5], GAIT_CY = [1.2, 1.7, 2.0, 2.6, 2.85, 2.95, 3.1, 3.3, 3.55, 4.0, 4.3, 4.6];      // [v133] 3B tablosuyla es (10.5 m/sn)      // [fiz] cizicideki tabloyla ayni
    function crGaitK(sp, ck) { var c = GAIT_CY[GAIT_CY.length - 1], i; if (!(sp > 0)) c = GAIT_CY[0]; else for (i = 1; i < GAIT_CX.length; i++) if (sp <= GAIT_CX[i]) { c = GAIT_CY[i - 1] + (GAIT_CY[i] - GAIT_CY[i - 1]) * (sp - GAIT_CX[i - 1]) / (GAIT_CX[i] - GAIT_CX[i - 1]); break; } return Math.PI * c * (1 + .12 * (ck || 0)) / Math.max(.35, sp || 0); }
    function gphStep(sim) {      // adım evresi: 3B çizicinin a.ph formülü (mesafe x 2pi / 2.35 x (1 + .22 top sürme karışımı), geri koşuda ters)
        var o = sim.ball.owner, k = 1 - Math.exp(-DT / .18), i, p, q, dx, dy, d, bk, tg;
        for (i = 0; i < 22; i++) {
            p = sim.players[i]; q = S.prev[i]; GPHP[i] = GPH[i]; if (!q) continue;
            if (p.gph != null) { GPHP[i] = p.pgph; GPH[i] = p.gph; GCK[i] = p.gq ? p.gq.ck : 0; continue; }      // [motor] evre motordan
            dx = p.x - q.x; dy = p.y - q.y; d = Math.hypot(dx, dy); if (d > 5) d = 0;
            tg = o === p && p.role !== 'GK' && sim.mode === 'live' ? 1 : 0; GCK[i] += (tg - GCK[i]) * k;
            bk = d > 1e-4 && (dx * p.fx + dy * p.fy) < -.35 * d ? -1 : 1;
            GSP[i] += (Math.min(10.5, d / DT) - GSP[i]) * (1 - Math.exp(-DT / .12)); GPH[i] += bk * d * crGaitK(GSP[i], GCK[i]);      // [fiz] kadans
        }
    }
    function crRoll(st, dt) {      // kayma -> yuvarlanma (PhysX ile aynı: kaymada mu*g yavaşlatır ve döndürür; yuvarlanmada çim direnci + hava)
        var v = st.v, w = st.w, aS = CRP.MUG + CRP.RD * 1.667 + CRP.KD * v * v, aW = 1.5 * CRP.MUG, ts;
        if (v > w + 1e-3) { ts = (v - w) / (aS + aW); if (ts >= dt) { v -= aS * dt; w += aW * dt; } else { v -= aS * ts; v -= (CRP.RD + .6 * CRP.KD * v * v) * (dt - ts); w = v; } }
        else if (v < w - 1e-3) { ts = (w - v) / (CRP.MUG + aW); if (ts >= dt) { v += CRP.MUG * dt; w -= aW * dt; } else { v += CRP.MUG * ts; w = v; } }
        else { v -= (CRP.RD + .6 * CRP.KD * v * v) * dt; w = v; }
        if (v <= 0) { v = 0; w = 0; }
        st.v = v; st.w = Math.max(0, w);
    }
    function crExit(u, v0, w0, g0, Tt, gT) {      // çıkış hızı: oyuncu u ile koşarken top Tt sonra yine g0 açıklığında (ikiye bölme)
        var lo = 0, hi = u + 12, k, n = Math.max(4, Math.round(Tt / .02)), h = Tt / n, i, m, g, vb;
        for (k = 0; k < 16; k++) {
            m = (lo + hi) / 2; g = gT; CR_T.v = m; CR_T.w = m >= v0 ? Math.max(0, w0 - CRP.SPIN * (m - v0)) : Math.min(w0, m);
            for (i = 0; i < n; i++) { vb = CR_T.v; crRoll(CR_T, h); g += ((vb + CR_T.v) / 2 - u) * h; }
            if (g > g0) hi = m; else lo = m;
        }
        return (lo + hi) / 2;
    }
    function crRoom(x, y, dx, dy) { var t = 1e9; if (dx > 1e-6) t = Math.min(t, (PW - x) / dx); else if (dx < -1e-6) t = Math.min(t, -x / dx); if (dy > 1e-6) t = Math.min(t, (PH - y) / dy); else if (dy < -1e-6) t = Math.min(t, -y / dy); return t; }
    function crAlong(x, y, dx, dy) { var ex = dx, ey = dy; if ((dx > 0 && PW - x < 4) || (dx < 0 && x < 4)) ex = 0; if ((dy > 0 && PH - y < 4) || (dy < 0 && y < 4)) ey = 0; var l = Math.hypot(ex, ey); if (l < .2) { ex = PW / 2 - x; ey = PH / 2 - y; l = Math.hypot(ex, ey) || 1; } return [ex / l, ey / l]; }
    // ph'den sonraki temas evreleri (iki ayak) sırayla: k. olanın evresi
    function crNextPh(ph, e, k) { var a = e[1], b = e[3], tp = 2 * Math.PI, c = [], m; for (m = 0; m < 6; m++) { c.push(a + tp * (Math.floor((ph - a) / tp) + 1 + m)); c.push(b + tp * (Math.floor((ph - b) / tp) + 1 + m)); } c.sort(function (x, y) { return x - y; }); return c[Math.max(0, Math.min(c.length - 1, k))]; }
    function crTouch(o, kind, dx, dy, osp, fwd, t, Te, gph0) {
        if (gph0 == null) gph0 = CRD.gph;
        var D = CRD, bv = Math.hypot(D.vx, D.vy), v0 = D.vx * dx + D.vy * dy, cs = bv > .05 ? v0 / bv : 1, w0 = D.w * Math.max(0, cs), e = crTab()[Math.max(0, Math.min(9, Math.round(osp)))], gc = Math.max(e[0], e[2]) + CRP.R, m, Tt = .6;
        if (CRD.log && CRD.log.length < 5000) CRD.log.push([+t.toFixed(3), o.id, kind, CR_WHY, +fwd.toFixed(3), +(-(D.x - o.x) * dy + (D.y - o.y) * dx).toFixed(3), +osp.toFixed(2), +gc.toFixed(3), +(Math.atan2(dy, dx) - Math.atan2(o.fy, o.fx)).toFixed(3), +(Math.atan2(o.vy, o.vx) - Math.atan2(o.fy, o.fx)).toFixed(3)]);      // [olcum]
        if (kind === 2) {      // ilk dokunuş: top alıcının ~.35 sn sonraki adımının önüne
            var ax = crCl(o.x + o.vx * .35 + dx * gc, .5, PW - .5), ay = crCl(o.y + o.vy * .35 + dy * gc, .5, PH - .5), qx = ax - D.x, qy = ay - D.y, ql = Math.hypot(qx, qy);
            if (ql > .05) { dx = qx / ql; dy = qy / ql; } v0 = D.vx * dx + D.vy * dy; w0 = D.w * Math.max(0, bv > .05 ? v0 / bv : 1);
            m = crCl(ql / .35 + .6, 0, osp + 6); if (osp < 1) m = Math.min(m, Math.sqrt(3 * ql)); D.plan = 0;
            if (osp >= 1) { var rr2 = Math.max(.5, (D.gph - D.pgph) / DT), bd2 = 1e9, j2, ph2, tt2; for (j2 = 0; j2 < 8; j2++) { ph2 = crNextPh(gph0, e, j2); tt2 = (ph2 - gph0) / rr2; if (tt2 < .2) continue; if (Math.abs(tt2 - .35) < bd2) { bd2 = Math.abs(tt2 - .35); D.plan = ph2; } } if (D.plan > 0) D.pf = crFootPf(D.plan, e); }      // [fiz]
        } else if (osp < 1) { m = Math.sqrt(3 * Math.max(0, .4 - fwd)); D.plan = 0; }      // duran oyuncu: top ayağın önünde durur
        else {
            // bir sonraki planlı temas: motorun bir sonraki dokunuşuna (Te) en yakın temas evresi (en az .25 sn sonra)
            var rate = Math.max(.5, (D.gph - D.pgph) / DT), best = null, bd = 1e9, j, ph, tt;
            for (j = 0; j < 12; j++) { ph = crNextPh(gph0, e, j); tt = (ph - gph0) / rate; if (tt < .25) continue; if (Math.abs(tt - Te) < bd) { bd = Math.abs(tt - Te); best = ph; Tt = tt; } }
            if (best === null) { best = crNextPh(gph0, e, 1); Tt = Math.max(.25, (best - gph0) / rate); }
            var room = crRoom(o.x, o.y, dx, dy);      // çizgi: top bir sonraki dokunuşa dek sahada kalmalı
            if (room < osp * Tt + gc + 1.3) { var pd = crAlong(o.x, o.y, dx, dy); dx = pd[0]; dy = pd[1]; v0 = D.vx * dx + D.vy * dy; w0 = D.w * Math.max(0, bv > .05 ? v0 / bv : 1); best = crNextPh(gph0, e, 1); Tt = Math.max(.2, (best - gph0) / rate); }
            D.plan = best; m = crExit(osp, Math.max(0, v0), w0, gc, Tt, fwd);
            var tp2 = 2 * Math.PI, wl = function (x) { x = x % tp2; return x < 0 ? x + tp2 : x; }, dL = Math.abs(wl(best) - e[1]), dR = Math.abs(wl(best) - e[3]); dL = Math.min(dL, tp2 - dL); dR = Math.min(dR, tp2 - dR);
            D.pf = crFootPf(best, e);      // planlı temasta topun yanal yeri: dokunacak ayağın önü (motor yanal ekseni: sol ayak +)
            var lat0 = -(D.x - o.x) * dy + (D.y - o.y) * dx, sTr = Math.max(.5, osp * Tt + gc - fwd), al = crCl((D.pf - lat0) / sTr, -.15, .15), ca = Math.cos(al), sa = Math.sin(al), ndx = dx * ca - dy * sa, ndy = dy * ca + dx * sa; dx = ndx; dy = ndy;
        }
        D.vx = dx * m; D.vy = dy * m; D.w = m >= v0 ? Math.max(0, w0 - CRP.SPIN * (m - v0)) : Math.min(w0, m);
        D.tau = 0; D.Tt = Tt; D.n++; D.k = kind; D.tp = D.tl; D.tl = t; D.pend = 0; D.due = 0; D.knock = 0; D.gE = 0;
    }
    /* [carry] vur-koş (dokunuş türü 4): motor kanat ya da hızlı ve iyi top süren oyuncunun boş alandaki koşusunu vur-koş seçince (p_knock_01, o.knock; depar hızı)
       görünen top bir-iki metre öne itilir, oyuncu hızlanarak yetişir; itiş motorun bir sonraki dokunuşuna dek sürer (sanal top da önde). İtiş sırasında
       pas/şut gelirse vuruş hareketi öndeki topa 1.3 m uzanır; oyuncu yetişemezse (yavaşladı/döndü) top biraz daha çabuk yavaşlar. */
    function crKnockU(o, osp) { var uT = (o.sf || .75) * (o.maxV || 8) * (.82 + .18 * (o.stam == null ? 1 : o.stam)); return osp + (Math.max(osp, uT) - osp) * .35; }      // itişten sonraki ortalama hız (oyuncu hızlanır)
    function crKnockOK(sim, o, osp, dx, dy) {      // motorun vur-koş kararı (p_knock_01: o.knock) + görünüm denetimi; dönen: itiş süresi (motorun bir sonraki dokunuşuna dek)
        var KR = CRD.kr; if (!(o.dribble && o.knC && o.knock)) return 0;      // motorun vur-koş döngüsü (p_knock_02)
        if (osp < 1.2) { KR.hiz = (KR.hiz || 0) + 1; return 0; }
        var T = (1 - (o.tPh || 0)) * (o.tTt || 1); if (T < .7) { KR.kisa = (KR.kisa || 0) + 1; return 0; }      // döngünün sonu: kısa dokunuş, itiş bir sonraki döngüde
        T = Math.min(T, 2.0); var ue = crKnockU(o, osp);
        if (crRoom(o.x, o.y, dx, dy) < ue * T + 4.5) { KR.cizgi = (KR.cizgi || 0) + 1; return 0; }
        var gx = sim.atkGoalX ? sim.atkGoalX(o.team) : (dx > 0 ? PW : 0); if ((gx - o.x) * dx > 0 && Math.abs(gx - o.x) < 14) { KR.kale = (KR.kale || 0) + 1; return 0; }
        KR.ok = (KR.ok || 0) + 1; return T;
    }
    function crKnockPlan(o, osp, ph0, T, e) {      // T'ye en yakın temas evresi (oyuncu hızlandıkça evre hızı artar)
        var D = CRD, ue = crKnockU(o, osp), rate = Math.max(.5, (D.gph - D.pgph) / DT) * ue / Math.max(.5, osp), best = null, bd = 1e9, Tk = T, j, ph, tt;
        for (j = 0; j < 24; j++) { ph = crNextPh(ph0, e, j); tt = (ph - ph0) / rate; if (tt < .6) continue; if (Math.abs(tt - T) < bd) { bd = Math.abs(tt - T); best = ph; Tk = tt; } }
        if (best === null) return null;
        var tp2 = 2 * Math.PI, wl = function (x) { x = x % tp2; return x < 0 ? x + tp2 : x; }, dL = Math.abs(wl(best) - e[1]), dR = Math.abs(wl(best) - e[3]); dL = Math.min(dL, tp2 - dL); dR = Math.min(dR, tp2 - dR);
        return { ph: best, T: Tk, pf: crFootPf(best, e), ue: ue };
    }
    function crKnockSet(o, dx, dy, m, v0, w0, t, pl) {
        var D = CRD; D.vx = dx * m; D.vy = dy * m; D.w = m >= v0 ? Math.max(0, w0 - CRP.SPIN * (m - v0)) : Math.min(w0, m);
        D.pf = pl.pf; D.plan = pl.ph; D.tau = 0; D.Tt = pl.T; D.n++; D.k = 4; D.tp = D.tl; D.tl = t; D.pend = 0; D.due = 0; D.knock = 1; D.gE = 0; D.rcT = -9;
    }
    var CR_WHY = '';
    function crKnock(o, dx, dy, osp, fwd, t, ph0, T) {
        if (CRD.log && CRD.log.length < 5000) CRD.log.push([+t.toFixed(3), o.id, 4, 'vur', +fwd.toFixed(3), +(-(CRD.x - o.x) * dy + (CRD.y - o.y) * dx).toFixed(3), +osp.toFixed(2), 0, +(Math.atan2(dy, dx) - Math.atan2(o.fy, o.fx)).toFixed(3), +(Math.atan2(o.vy, o.vx) - Math.atan2(o.fy, o.fx)).toFixed(3)]);      // [olcum]      // sürerken vur-koş: top bir sonraki temasta (T) yine ayak ucunun önünde, oyuncu ortalama ue hızında
        var D = CRD, e = crTab()[Math.max(0, Math.min(9, Math.round(osp)))], gc = Math.max(e[0], e[2]) + CRP.R, pl = crKnockPlan(o, osp, ph0, T, e); if (!pl) return false;
        var bv = Math.hypot(D.vx, D.vy), v0 = D.vx * dx + D.vy * dy, w0 = D.w * Math.max(0, bv > .05 ? v0 / bv : 1);
        crKnockSet(o, dx, dy, crCapM(crExit(pl.ue, Math.max(0, v0), w0, gc, pl.T, fwd), Math.max(0, v0), w0, osp, fwd, pl.T), v0, w0, t, pl); return true;
    }
    function crPeak(m, w, u, g0, T) { CR_T.v = m; CR_T.w = w; var g = g0, pk = g0, n = Math.max(4, Math.round(T / .02)), h = T / n, i, vb; for (i = 0; i < n; i++) { vb = CR_T.v; crRoll(CR_T, h); g += ((vb + CR_T.v) / 2 - u) * h; if (g > pk) pk = g; } return pk; }
    function crCapM(m, v0, w0, osp, fwd, T) {      // oyuncu hızlanmasa da (osp) top en çok 1.8 m önde kalsın
        var wf = function (x) { return x >= v0 ? Math.max(0, w0 - CRP.SPIN * (x - v0)) : Math.min(w0, x); };
        if (crPeak(m, wf(m), osp, fwd, T * 1.6) <= 1.8) return m;
        var lo = 0, hi = m, k, x; for (k = 0; k < 14; k++) { x = (lo + hi) / 2; if (crPeak(x, wf(x), osp, fwd, T * 1.6) > 1.8) hi = x; else lo = x; } return lo;
    }
    function crFirstPlan(sim, o, t) {      // ilk dokunuş anı: topun alıcıya en yakın geçişi (.12-.36 sn); ayakla karşılama hareketi o ana kurulur
        var D = CRD, x = D.x, y = D.y, vx = D.vx, vy = D.vy, px = o.x, py = o.y, best = 1e9, bt = .16, bx = x, by = y, k, v, nv, dd;
        for (k = 1; k <= 20; k++) {      // [fiz] top alıcının ayağına (~.42 m) vardığı an (en çok .8 sn); yanından geçiyorsa en yakın geçiş
            v = Math.hypot(vx, vy); if (v > .02) { nv = Math.max(0, v - (sim.rdec ? sim.rdec(v) : .30 * v + .5) * DT); vx *= nv / v; vy *= nv / v; }
            x += vx * DT; y += vy * DT; px += o.vx * DT; py += o.vy * DT; dd = Math.hypot(x - px, y - py);
            if (k * DT >= .1 && dd < .45) { bt = k * DT; bx = x; by = y; break; }      // [motor]
            dd += k * DT < .1 ? .3 : 0; if (dd < best) { best = dd; bt = k * DT; bx = x; by = y; }
        }
        D.tFirst = t + bt; D.fq = null;
        if (D.z > .4 || S.vs) return;      // havadan gelen top: göğüs/uyluk kontrolü (oaStep) zaten kuruluyor
        var il = Math.hypot(D.vx, D.vy), ix = il > .3 ? D.vx / il : -o.fx, iy = il > .3 ? D.vy / il : -o.fy;
        D.fq = { bx: bx, by: by, ix: ix, iy: iy, id: o.id };      // [fiz] hareket crStep'te temastan en cok .34 sn once kurulur
    }
    /* [fiz] temas evresinin ayagi (sol: e[1], sag: e[3]); yanal yer (sol +; cizici tablosu e[4]/e[5], 2B'de +-.08) ve topun merkezine uzanim */
    var YAW = new Float64Array(22);      // cizicinin govde yonu (atan2(fx, fy) sim saatiyle .09 sn sonumle)
    function crFootL(ph, e) { var tp = 2 * Math.PI, w = function (x) { x = x % tp; return x < 0 ? x + tp : x; }, a = Math.abs(w(ph) - e[1]), b = Math.abs(w(ph) - e[3]); a = Math.min(a, tp - a); b = Math.min(b, tp - b); return a <= b; }
    function crFootPf(ph, e) { return crFootL(ph, e) ? (e[4] != null ? e[4] : .08) : (e[5] != null ? e[5] : -.08); }
    function crFootGc(ph, e) { return (crFootL(ph, e) ? e[0] : e[2]) + CRP.R; }
    /* [fiz] gudum: planli temas aninda (D.plan evresi) top, govdenin o anki kestirilen yeri (sabit hiz; vur-koşta hizlanan ortalama hiz) + cizicinin govde
       yonunde salinan ayagin uzanimi + ayagin yanal yeri noktasinda olsun. Serbest yuvarlanmayla kestirilen yerden fark kalan sureye yayilir; adim basina
       duzeltme sinirli: top yolundan kopmaz, yalniz oyuncunun yoluna hafifce kivrilir ve hizini ayarlar. */
    /* [fiz] kurtarma dokunusu: planli temas kacacaksa topun salinan ayagin uzanabilecegi (<= 1.05 m, govdenin cok gerisinde degil) ilk temas evresi
       (.14-.75 sn; top serbest yuvarlanir, govde sabit hizla); oraya karsilama hareketi (16, mod 3: govde topa kayar, ayagin ici topa) kurulur. */
    function crRecover(o, osp, e, rt) {
        var D = CRD, hx = Math.sin(YAW[o.id]), hy = Math.cos(YAW[o.id]), bv = Math.hypot(D.vx, D.vy), ux = bv > 1e-3 ? D.vx / bv : 0, uy = bv > 1e-3 ? D.vy / bv : 0, j, ph, tt, n, h, s, i, vb;
        for (j = 0; j < 6; j++) {
            ph = crNextPh(D.gph, e, j); tt = (ph - D.gph) / rt; if (tt < .14) continue; if (tt > .35) break;
            CR_T.v = bv; CR_T.w = D.w; n = Math.max(1, Math.round(tt / .04)); h = tt / n; s = 0; for (i = 0; i < n; i++) { vb = CR_T.v; crRoll(CR_T, h); s += (vb + CR_T.v) / 2 * h; }
            var bx = D.x + ux * s, by = D.y + uy * s, rx = bx - (o.x + o.vx * tt), ry = by - (o.y + o.vy * tt);
            if (Math.hypot(rx, ry) <= 1.05 && rx * hx + ry * hy > -.3) return { ph: ph, tt: tt, bx: bx, by: by, ix: bv > .3 ? ux : -hx, iy: bv > .3 ? uy : -hy };
        }
        return null;
    }
    function crGuide(o, osp, dx, dy) {
        var D = CRD, e = crTab()[Math.max(0, Math.min(9, Math.round(osp)))], rt = Math.max(.5, (D.gph - D.pgph) / DT), ue = D.knock ? crKnockU(o, osp) : osp;
        if (D.knock) rt *= ue / Math.max(.5, osp);
        var tr = (D.plan - D.gph) / rt; if (!(tr > DT * .5) || tr > 2.4) return;
        var hx = Math.sin(YAW[o.id]), hy = Math.cos(YAW[o.id]), gcf = crFootGc(D.plan, e), pf = D.pf;
        var px = o.x + (D.knock ? dx * ue : o.vx) * tr, py = o.y + (D.knock ? dy * ue : o.vy) * tr, cx = px + hx * gcf - hy * pf, cy = py + hy * gcf + hx * pf;
        var bv = Math.hypot(D.vx, D.vy), ux = bv > 1e-3 ? D.vx / bv : hx, uy = bv > 1e-3 ? D.vy / bv : hy, n = Math.max(1, Math.round(tr / .04)), h = tr / n, s = 0, i, vb;
        CR_T.v = bv; CR_T.w = D.w; for (i = 0; i < n; i++) { vb = CR_T.v; crRoll(CR_T, h); s += (vb + CR_T.v) / 2 * h; }
        var ex = cx - (D.x + ux * s), ey = cy - (D.y + uy * s), k = Math.min(1, DT / (.4 * tr + DT)), gx = ex / tr * k, gy = ey / tr * k, gl = Math.hypot(gx, gy), cap = (tr < .3 ? 7 : 4.5) * DT;
        if (gl > cap) { gx *= cap / gl; gy *= cap / gl; }
        D.vx += gx; D.vy += gy; var nb = Math.hypot(D.vx, D.vy); D.w = D.w >= bv - 1e-3 ? nb : Math.min(D.w, nb); D.gE = Math.hypot(ex, ey);
    }
    /* [motor] fiziksel surmede ilk dokunus kestirimi (motorun kurali): top alicinin .55 m icine girdigi ya da en yakin gectigi an (en cok .8 sn) */
    function crPredFirst(o, t) {
        var D = CRD, x = D.x, y = D.y, vx = D.vx, vy = D.vy, px = o.x, py = o.y, k, v, nv, dd, best = 1e9, bt = .04, bx = x, by = y, pr = 1e9, sim = S.sim;
        for (k = 1; k <= 20; k++) {
            v = Math.hypot(vx, vy); if (v > .02) { nv = Math.max(0, v - (sim.rdec ? sim.rdec(v) : .30 * v + .5) * DT); vx *= nv / v; vy *= nv / v; }
            x += vx * DT; y += vy * DT; px += o.vx * DT; py += o.vy * DT; dd = Math.hypot(x - px, y - py);
            if (dd < .45 || dd > pr + 1e-4) { if (dd >= .45) { x -= vx * DT; y -= vy * DT; k--; } bt = Math.max(1, k) * DT; bx = x; by = y; break; }
            pr = dd; if (dd < best) { best = dd; bt = k * DT; bx = x; by = y; }
        }
        var il = Math.hypot(D.vx, D.vy);
        return { tc: t + bt, bx: bx, by: by, ix: il > .3 ? D.vx / il : -o.fx, iy: il > .3 ? D.vy / il : -o.fy };
    }
    function crStep(sim) {
        var B = sim.ball, o = B.owner, D = CRD, t = sim.t;
        for (var yi = 0; yi < 22; yi++) { var yp = sim.players[yi], yd = Math.atan2(yp.fx, yp.fy) - YAW[yi]; yd = Math.atan2(Math.sin(yd), Math.cos(yd)); YAW[yi] += yd * (1 - Math.exp(-DT / .09)); }      // [fiz] cizicinin govde yonu
        gphStep(sim);
        D.pon = D.on; D.px = D.x; D.py = D.y; D.pz = D.z;
        if (sim.mode !== 'live' || !o || o.role === 'GK') { D.on = 0; D.own = -1; D.tn = -9; D.fn = 0; return; }
        var osp = Math.hypot(o.vx, o.vy), id = o.id;
        if (!D.on || D.own !== id) {      // yeni sahip: görünen top son görünen yerinden, gelen hızla (ilk dokunuş bekler)
            if (!D.on) { D.x = S.prevB.x; D.y = S.prevB.y; D.z = S.prevB.z || 0; D.vx = S.prevB.vx || 0; D.vy = S.prevB.vy || 0; D.vz = S.prevB.vz || 0; D.px = D.x; D.py = D.y; D.pz = D.z; }
            D.on = 1; D.own = id; D.pend = 1; D.due = 0; D.plan = 0; D.knock = 0; D.tau = 0; D.k = 2; D.w = Math.hypot(D.vx, D.vy);
            crFirstPlan(sim, o, t - DT);
        }
        D.pgph = GPHP[id]; D.gph = GPH[id];
        if (o.cr) {      // [motor] fiziksel surme: gorunen top motor topu
            var Cm = o.cr; D.x = B.x; D.y = B.y; D.z = B.z || 0; D.vx = B.vx; D.vy = B.vy; D.vz = B.vz || 0; D.w = Math.hypot(B.vx, B.vy); D.pend = Cm.pend ? 1 : 0; D.k = Cm.k; D.n = Cm.n; D.tl = Cm.tl + DT; D.tp = Cm.tp + DT;      /* motorun dokunus ani adim basi (S.t), top konumu adim sonu: gorunen an bir adim sonra */ D.Tt = Cm.Tt; D.knock = 0; D.rcT = -9; D.vl = 1.8;
            D.tn = -9; D.fn = 0;
            if (!Cm.pend && osp >= 1 && Cm.k !== 3) { var em = crTab()[Math.max(0, Math.min(9, Math.round(osp)))], rrm = Math.max(.5, (D.gph - D.pgph) / DT), tw = Cm.tl + DT + Cm.Tt, phw = D.gph + Math.max(0, tw - t) * rrm, phn = crNextPh(phw - 1e-6, em, 0); D.tn = t + Math.max(0, (phn - D.gph) / rrm); D.fn = crFootL(phn, em) ? 1 : -1; }
            if (Cm.pend) {      // karsilama hareketi: tahmin her adim yenilenir (alicinin ayagina .55 m ya da en yakin gecis)
                var qp = crPredFirst(o, t);
                if (!(D.fqI && D.fqI.id === id) && qp.tc - t <= .34) { D.fqI = { id: id, tc: qp.tc, bx: qp.bx, by: qp.by }; if (!(D.z > .4 || S.vs)) try { gkIssue(1, id, 16, qp.tc, t - .03, oaD(OA.tmp, qp.bx, qp.by, 0, qp.ix, qp.iy, 3, o.vx, o.vy, 0, 0, 0)); } catch (e) { } }
                else if (D.fqI && D.fqI.id === id && (Math.abs(qp.tc - D.fqI.tc) > .02 || Math.hypot(qp.bx - D.fqI.bx, qp.by - D.fqI.by) > .08)) { D.fqI.tc = qp.tc; D.fqI.bx = qp.bx; D.fqI.by = qp.by; try { gkIssue(5, id, 16, qp.tc, t, oaD(OA.tmp, qp.bx, qp.by, 0, qp.ix, qp.iy, 3, o.vx, o.vy, 0, 0, 0)); } catch (e) { } }
            } else if (D.fqI && D.fqI.id === id) {      // motor dokundu: hareketin temas ani ve noktasi gercek dokunusa
                if (Math.abs(D.tl - D.fqI.tc) > .015) { var bxd = B.x - B.vx * (t - D.tl), byd = B.y - B.vy * (t - D.tl); try { gkIssue(5, id, 16, D.tl, t, oaD(OA.tmp, bxd, byd, 0, -o.fx, -o.fy, 3, o.vx, o.vy, 0, 0, 0)); } catch (e) { } }
                D.fqI = null;
            } else if (Cm.k === 2 && Cm.n === 1 && Math.abs(t - D.tl) < 1e-6 && !(D.z > .4 || S.vs)) {      // tahminsiz ani ilk dokunus (sahiplikle ayni adim): hareket geriye donuk kurulur (gorunum motorun gerisinde)
                var ilq = Math.hypot(S.prevB.vx, S.prevB.vy); try { gkIssue(1, id, 16, D.tl, D.tl - .22, oaD(OA.tmp, B.x, B.y, 0, ilq > .3 ? S.prevB.vx / ilq : -o.fx, ilq > .3 ? S.prevB.vy / ilq : -o.fy, 3, o.vx, o.vy, 0, 0, 0)); } catch (e) { }
            }
            return;
        }
        // dokunuş yönü: oyuncunun hedefi (yapay zekâ), yoksa hareket / bakış yönü; koşarken hız yönünden en çok 60°
        var mx = osp > .6 ? o.vx / osp : o.fx, my = osp > .6 ? o.vy / osp : o.fy, dx = mx, dy = my, ax0 = o.tx - o.x, ay0 = o.ty - o.y, al0 = Math.hypot(ax0, ay0);
        if (al0 > 1) { dx = ax0 / al0; dy = ay0 / al0; }
        if (osp > 3 && dx * mx + dy * my < .5) { var sg = (mx * dy - my * dx) >= 0 ? 1 : -1; dx = mx * .5 - my * .866 * sg; dy = mx * .866 * sg + my * .5; }
        // dikey: havadan alınan top düşer, seker
        if (D.z > 0 || D.vz > 0) { D.vz -= 9.81 * DT; D.z += D.vz * DT; if (D.z <= 0) { D.z = 0; D.vz = -D.vz > 1.2 ? -D.vz * .55 : 0; } }
        // yatay: serbest top (ilk dokunuş beklenirken gelen top motorun serbest top yavaşlamasıyla)
        var v = Math.hypot(D.vx, D.vy);
        if (D.pend) { if (v > .02) { var nv = Math.max(0, v - (sim.rdec ? sim.rdec(v) : .30 * v + .5) * DT); D.vx *= nv / v; D.vy *= nv / v; } else { D.vx = 0; D.vy = 0; } D.w = Math.hypot(D.vx, D.vy); }
        else if (v > 1e-4) {
            var ux = D.vx / v, uy = D.vy / v; CR_T.v = v; CR_T.w = D.w; crRoll(CR_T, DT);
            if (D.knock) {      // vur-koş: oyuncu topa yetişemiyorsa (yavaşladı / döndü) top biraz daha çabuk yavaşlar (en çok 4 m/sn²) - konum düzeltmesinden az göze batar
                var kf = (D.x - o.x) * ux + (D.y - o.y) * uy, rvb = CR_T.v - (o.vx * ux + o.vy * uy), kl = o.knC && o.knock && o.dribble ? 1.5 : 1.0;      // motorun vur-koş döngüsü bittiyse daha erken
                if (kf > kl && rvb > 0) { var xd = Math.min(6, (kf - kl) * 8, rvb / DT) * DT; CR_T.v = Math.max(0, CR_T.v - xd); CR_T.w = Math.min(CR_T.w, CR_T.v); }
            }
            D.vx = ux * CR_T.v; D.vy = uy * CR_T.v; D.w = CR_T.w;
        }
        if (!D.pend && osp >= 1 && D.plan > 0 && D.z < .05 && D.tau > .06 && D.k !== 3 && !(D.rcT > t)) crGuide(o, osp, dx, dy);      // [fiz] gudum
        D.x += D.vx * DT; D.y += D.vy * DT;
        if (D.x < .12) { D.x = .12; if (D.vx < 0) D.vx = 0; } else if (D.x > PW - .12) { D.x = PW - .12; if (D.vx > 0) D.vx = 0; }      // taşınan top motorda çıkmaz: görünen de çıkmaz
        if (D.y < .12) { D.y = .12; if (D.vy < 0) D.vy = 0; } else if (D.y > PH - .12) { D.y = PH - .12; if (D.vy > 0) D.vy = 0; }
        D.tau += DT;
        var rx = D.x - o.x, ry = D.y - o.y, dist = Math.hypot(rx, ry), fwd = rx * dx + ry * dy, lat = -rx * dy + ry * dx;
        var reach = fwd > -.12 && fwd < CRP.REACH + .05 * osp && Math.abs(lat) < .55 && D.z < .5;
        var tph = o.tPh || 0, Te = Math.max(.15, (1 - tph) * (o.tTt || crCl(.35 + .09 * osp, .38, 1.1)));      // motorun bir sonraki dokunuşuna kalan süre (sanal top)
        if (D.pend) {      // ilk dokunuş: kestirilen anda (ya da top ayağa erken gelirse)
            if (D.fq && D.fq.id === id && D.tFirst - t <= .34) { try { gkIssue(1, id, 16, D.tFirst, t - .03, oaD(OA.tmp, D.fq.bx, D.fq.by, 0, D.fq.ix, D.fq.iy, 3, o.vx, o.vy, 0, 0, 0)); } catch (e) { } D.fq = null; }      // [fiz]
            if (t >= D.tFirst - 1e-6) { CR_WHY = 'ilk'; crTouch(o, 2, dx, dy, osp, fwd, t, Te); }      // ilk dokunuş (alıcı karar verene dek motor onu yavaş yürütür: vur-koş yalnız koşu kararıyla)
        } else if (osp < 1) {      // yavaş / duran: top tabanla ayağın önünde (.4 m) tutulur
            var hx = o.x + o.fx * .4, hy = o.y + o.fy * .4, ex = hx - D.x, ey = hy - D.y, el = Math.hypot(ex, ey), sm = Math.min(el, 1.5 * DT), kx = el > 1e-4 ? ex / el * sm : 0, ky = el > 1e-4 ? ey / el * sm : 0;
            if (D.k !== 3 && dist > .75 && dist < 2.2 && D.z < .3 && !(D.rcT > t - 1e-6 && D.rcO === id) && t - (D.rcL || -9) > .5) {      // [fiz] topa uzanma
                var bv3 = Math.hypot(D.vx, D.vy), s3 = 0, i3, vb3; CR_T.v = bv3; CR_T.w = D.w; for (i3 = 0; i3 < 7; i3++) { vb3 = CR_T.v; crRoll(CR_T, .04); s3 += (vb3 + CR_T.v) / 2 * .04; }
                var bx3 = D.x + (bv3 > 1e-3 ? D.vx / bv3 * s3 : 0), by3 = D.y + (bv3 > 1e-3 ? D.vy / bv3 * s3 : 0), ix3 = bv3 > .3 ? D.vx / bv3 : -o.fx, iy3 = bv3 > .3 ? D.vy / bv3 : -o.fy;
                D.rcT = t + .28; D.rcO = id; D.rcL = t; try { gkIssue(1, id, 16, D.rcT, t - .03, oaD(OA.tmp, bx3, by3, 0, ix3, iy3, 3, o.vx, o.vy, 0, 1, 0)); } catch (er) { }
            }
            if (D.k !== 3 && ((fwd > -.15 && (reach || dist < .9)) || (D.rcO === id && D.rcT > 0 && t >= D.rcT - 1e-6 && t - D.rcT < .12))) { D.k = 3; D.tp = D.tl; D.tl = t; D.n++; D.tau = 0; D.Tt = .6; D.plan = 0; }
            if (D.k === 3) { D.x += kx; D.y += ky; D.vx = o.vx + kx / DT; D.vy = o.vy + ky / DT; D.w = Math.hypot(D.vx, D.vy); D.tau = 0; }
        } else {
            var e = crTab()[Math.max(0, Math.min(9, Math.round(osp)))], gc = Math.max(e[0], e[2]) + CRP.R;
            var bvl = Math.hypot(D.vx, D.vy), turn = bvl > .5 && (D.vx * dx + D.vy * dy) / bvl < .866 && D.tau > .12;
            var bxs = D.x + D.vx * .6, bys = D.y + D.vy * .6, line = (bxs < .4 || bxs > PW - .4 || bys < .4 || bys > PH - .4) && D.tau > .08, slow = (D.vx * dx + D.vy * dy) > osp + 1.6 && D.tau > .15;
            var vd = Math.hypot(B.x - D.x, B.y - D.y), recon = !D.knock && vd > 1.15 && D.tau > .12;      // [fiz] sanal toptan ayrıldı: uzaktan dokunuş yok, bir sonraki temasa güdüm
            var hX = Math.sin(YAW[id]), hY = Math.cos(YAW[id]), fwH = rx * hX + ry * hY, ltH = -rx * hY + ry * hX;      // [fiz] çizicinin gövde çerçevesi
            var phc0 = crNextPh(D.pgph, e, 0), pfc = crFootPf(phc0, e), gcc = crFootGc(phc0, e);      // [fiz] bu adımda temas evresine gelen ayak: yanal yeri, uzanımı
            var zone = (fwH > gcc - .2 && fwH < gcc + .15 && Math.abs(ltH - pfc) < .25 && D.z < .5) || (D.k === 3 && dist < .9 && fwH > -.3 && D.z < .5), over = fwH < gcc - .2 && fwH > -.15 && Math.abs(ltH - pfc) < .35 && D.tau > .1;
            var kst = o.dribble && o.knC && o.knock && !D.knock && (1 - tph) * (o.tTt || 1) > .7; if (kst) { D.due = 1; zone = zone || (fwH > gcc - .25 && fwH < gcc + .32 && Math.abs(ltH - pfc) < .4 && D.z < .5); }      // motor vur-koşa başladı
            if (turn || slow || over || recon || line || D.k === 3) D.due = 1;
            if ((recon || turn || line) && D.plan > 0 && (D.plan - D.gph) / Math.max(.5, (D.gph - D.pgph) / DT) > .45) { D.plan = crNextPh(D.gph, e, 0); D.pf = crFootPf(D.plan, e); }      // [fiz] temas erkene: güdüm topu bir sonraki adımın önüne getirir
            // bu adımda bir temas evresi geçildi mi (salınan ayak ucu topa uzanıyor)
            var cross = phc0 <= D.gph + 1e-9, planned = D.plan > 0 && D.gph >= D.plan - 1e-9;
            if (line) { var pa = crAlong(D.x, D.y, dx, dy); dx = pa[0]; dy = pa[1]; }
            var rt0 = Math.max(.5, (D.gph - D.pgph) / DT), rcOn = D.rcT > t - 1e-6 && D.rcO === id;      // [fiz] kurtarma dokunusu
            if (!rcOn && !D.knock && D.z < .3 && t - (D.rcL || -9) > .35 && (recon || (D.gE > .35 && D.plan > 0 && (D.plan - D.gph) / rt0 < .7) || (turn && !zone))) {
                var rpl = crRecover(o, osp, e, rt0);
                if (rpl) { D.rcT = t + rpl.tt; D.rcPh = rpl.ph; D.rcO = id; D.plan = rpl.ph; D.pf = crFootPf(rpl.ph, e); D.rcL = t; rcOn = true; D.gE = 0; try { gkIssue(1, o.id, 16, D.rcT, t - .03, oaD(OA.tmp, rpl.bx, rpl.by, 0, rpl.ix, rpl.iy, 3, o.vx, o.vy, 0, 1, 0)); } catch (er) { } }
            }
            if (rcOn ? cross && D.gph >= D.rcPh - 1e-9 : cross && (D.due || planned || D.plan === 0) && (zone || over)) {
                if (rcOn) D.rcT = -9;
                var phc = crNextPh(D.pgph, e, 0), rt = Math.max(.5, (D.gph - D.pgph) / DT), dl = crCl((D.gph - phc) / rt, 0, DT);      // geçiş adımın içinde: o ana geri sar
                D.x -= D.vx * dl; D.y -= D.vy * dl; var fw2 = (D.x - o.x + o.vx * dl) * dx + (D.y - o.y + o.vy * dl) * dy;
                var kT = !turn && D.k !== 3 ? crKnockOK(sim, o, osp, dx, dy) : 0;      // [carry] boş alanda vur-koş
                CR_WHY = (zone ? 'bolge' : 'asti') + (turn ? '+don' : slow ? '+yavas' : D.k === 3 ? '+taban' : kst ? '+kst' : D.due ? '+ara' : planned ? '+plan' : '');
                if (!(kT && crKnock(o, dx, dy, osp, fw2, t - dl, phc, kT))) crTouch(o, turn ? 1 : 0, dx, dy, osp, fw2, t - dl, Te, phc); D.x += D.vx * dl; D.y += D.vy * dl;
            }
            else if (planned) { D.plan = crNextPh(D.gph, e, 0); D.pf = crFootPf(D.plan, e); }      // [fiz] planlı temas kaçtı (top önde / yanda): bir sonraki temas evresi, güdüm sürer
        }
        D.tn = -9; D.fn = 0;
        if (!D.pend && D.plan > 0 && D.k !== 3) { var tnr = Math.max(.5, (D.gph - D.pgph) / DT), tnE = crTab()[Math.max(0, Math.min(9, Math.round(osp)))]; if (D.knock) tnr *= crKnockU(o, osp) / Math.max(.5, osp); D.tn = t + Math.max(0, (D.plan - D.gph) / tnr); D.fn = D.rcT > t - 1e-6 && D.rcO === id ? 0 : crFootL(D.plan, tnE) ? 1 : -1; }      // [fiz] cizici temas penceresi
        var vd2 = Math.hypot(B.x - D.x, B.y - D.y), vt = D.knock ? 3.4 : 1.8; D.vl = !(D.vl > vt) ? vt : Math.max(vt, Math.min(D.vl, vd2) - 2.5 * DT); if (vd2 > D.vl) { var kk = (vd2 - D.vl) / vd2; D.x += (B.x - D.x) * kk; D.y += (B.y - D.y) * kk; }      // güvenlik: görünen top sanal toptan kopmaz
    }
    function record(sim) {
        var R = S.ring, o = (R.n % RING) * FS, b = R.buf, B = sim.ball, i, p, q, z = 0;
        if (sim.ball3d) z = B.z || 0; else if (B.high) { var pr = (sim.t - B.high.t0) / (B.high.tLand - B.high.t0); z = Math.sin(Math.PI * Math.max(0, Math.min(1, pr))) * B.high.h; }
        b[o] = sim.t; b[o + 1] = B.x; b[o + 2] = B.y; b[o + 3] = z; b[o + 4] = B.owner ? B.owner.id : -1; b[o + 5] = sim.mode === 'dead' ? 1 : 0;
        for (i = 0; i < 22; i++) { p = sim.players[i]; q = o + 6 + i * 4; b[q] = p.x; b[q + 1] = p.y; b[q + 2] = p.fx; b[q + 3] = p.fy; }
        q = o + RO; b[q] = S.ref.x; b[q + 1] = S.ref.y; b[q + 2] = S.ref.fx; b[q + 3] = S.ref.fy;
        if (CRD.on) { b[o + 1] = CRD.x; b[o + 2] = CRD.y; b[o + 3] = CRD.z; }      // [carry] tekrar da görünen topu gösterir
        b[q + 25] = (!B.owner && sim.mode === 'live') ? (B.sps || 0) : 0;      // [v139] yan donus kayda (tekrar ayni falsoyla doner)
        b[q + 4] = CRD.tl; b[q + 5] = CRD.Tt; b[q + 6] = CRD.n; b[q + 7] = CRD.k; b[q + 8] = CRD.tp; b[q + 9] = CRD.on; b[q + 10] = CRD.gph % 6283.185307; b[q + 11] = CRD.tn; b[q + 12] = CRD.fn; arRec(b, q + 13);
        R.n++;
    }
    function stepOnce() {
        var sim = S.sim, i, p;
        for (i = 0; i < 22; i++) { p = sim.players[i]; S.prev[i].x = p.x; S.prev[i].y = p.y; S.prev[i].fx = p.fx; S.prev[i].fy = p.fy; }
        S.prevB.x = sim.ball.x; S.prevB.y = sim.ball.y; S.prevB.z = sim.ball.z || 0; S.prevB.dead = sim.mode === 'dead' ? 1 : 0;
        S.prevB.vx = sim.ball.vx || 0; S.prevB.vy = sim.ball.vy || 0; S.prevB.vz = sim.ball.vz || 0;      // [carry] alinan topun gelis hizi
        var t0r = sim.t; sim.step(); if (sim.refHold && sim.t === t0r) return;      /* [port] hakem kararı bekleniyor */
        try { gkStep(sim); } catch (e) { warn('kaleci adımı', e); }                // [gk] eller/ayak, önceden kurma (yalnızca görüntü)
        try { spStep(sim); } catch (e) { warn('duran top adımı', e); }              // [sp] duran top: yürütme anı kestirimi, aksiyon kurma (yalnızca görüntü)
        try { oaStep(sim); } catch (e) { warn('oyuncu aksiyon adımı', e); }         // [oa] kafa adayları, havadan kontrol, geçilen savunmacı (yalnızca görüntü)
        if (!S.vs) refStep(sim);
        try { arStep(sim); } catch (e) { warn('yan hakem', e); }      // [yan]                                                    // hakem (yalnızca görüntü): VAR sahnesi başladıysa konumunu sahne yönetir
        try { crStep(sim); } catch (e) { warn('top sürme görünümü', e); CRD.on = 0; CRD.own = -1; }      // [carry] görünen top (yalnızca görüntü)
        record(sim);
        try { momStep(sim); } catch (e) { }                                          // [fm2] baskımetre
        for (i = 0; i < 22; i++) { p = sim.players[i]; if (!p.off) S.dist[i] += Math.hypot(p.x - S.prev[i].x, p.y - S.prev[i].y); }
        if (S.ov.trail) { S.trail.push([sim.ball.x, sim.ball.y]); if (S.trail.length > 40) S.trail.shift(); }
        if (S.raw) {                                                                 // test/ölçüm: her hız düğmesinde ve her izleme biçiminde maçın kaç gerçek saniye süreceği
            var tw = paceWide(sim), tk = paceKey(sim);
            for (var kk in S.virt.wide) { S.virt.wide[kk] += DT / Math.min(SPEEDS[kk] * tw, MAX_RATE); S.virt.key[kk] += DT / Math.min(SPEEDS[kk] * tk, MAX_RATE); }
        }
    }
    function afterSteps() {
        var sim = S.sim;
        if (S.halfPending) {
            S.halfPending = false; S.running = false; S.hold = 'half'; syncStats();
            $('match-time').innerText = '45:00'; triggerHalfTime(45); return;
        }
        if (sim.finished) {
            S.running = false; S.hold = 'end'; syncStats(); if (S.rt) S.rt.finish(); flushRatings(true);
            $('match-time').innerText = '90:00'; matchData.currentTimeMs = matchData.totalDurationMs;
            triggerFullTime(90); lockMode(false); tacSync();
        }
    }
    /* reyting: Rating2D'den okunur, oyunun matchData.ratings alanına yazılır (22 oyuncu). Ekranda görünen değer (1 ondalık) değiştiyse listeler yenilenir. */
    function pushRatings() {
        var sim = S.sim, R = S.rt, i, id, v, d, chg = false;
        if (!sim || !R || !matchData.ratings) return false;
        for (i = 0; i < 22; i++) {
            id = S.eng2db[i]; if (id == null) continue;
            v = R.get(i, sim.t); matchData.ratings[id] = v; d = v.toFixed(1);
            if (S.rtDisp[i] !== d) { S.rtDisp[i] = d; chg = true; }
        }
        return chg;
    }
    function flushRatings(force) {
        if (!S.sim) return;
        var chg = pushRatings();
        if (chg || S.dirty || force) { S.dirty = false; try { renderLineups(); } catch (e) { } try { updateXI(); } catch (e) { warn('kadro', e); } }
    }

    function loop() { if (!S.raf) S.raf = requestAnimationFrame(frame); }
    function cvVis(c, now) { var on = c.offsetParent !== null; S.cvVisT = on ? now + 250 : 0; return on; }
    function frame(now) {
        S.raf = 0;
        if (!S.sim || S.sid !== matchSessionId) return;         // maç bitti / sıfırlandı / çıkıldı
        var sim = S.sim, dt = Math.max(0, Math.min(.1, (now - S.last) / 1000)); S.last = now; S.fNow = now;      // [v133] eksi dt yok (performance.now ile kurulan S.last), 3B ayni kare saatini kullanir
        if (mode === '2d') {
            if (S.hold === 'replay') {
                if (S.running) advanceReplay(dt);
            } else if (S.hold === 'var') {
                if (!S.vs) { S.hold = null; S.last = now; } else if (S.running) varAdvance(dt);          // VAR sahnesi: hakem monitöre gider, sonuç sahne bitince açılır
            } else if (S.running && !S.hold && !sim.finished) {
                var n = 0; S.lk = lenK(sim, dt);
                if (G.__abLive && S.skip) S.skip = false;
                if (DL.on && !dlWant()) dlOff();      // [v135]
                if (S.watch === 'fm' && !G.__abLive && !S.skip && !S.raw && fmTick(dt, sim)) { /* [fm] maç arası hızlı akış / önemli an oynatımı */ }
                else if (S.skip) {
                    S.keyHit = false;
                    var tSk = performance.now() + 10;                                                       // [opt] zaman dilimli: donma yok, ilerleme görünür
                    while (n < 3000 && !S.keyHit && !S.hold && !sim.finished && !S.halfPending) { stepOnce(); n++; if ((n & 7) === 0 && performance.now() > tSk) break; }
                    if (S.keyHit || sim.finished) { S.skip = false; }
                    S.acc = 0;
                } else {
                    // akıllı tempo: hedef çarpana yavaşça yaklaş (yavaşlama hızlı, hızlanma yumuşak — ekran nefes almasın)
                    if (S.raw) S.pace = 1; else { var tg = G.__abPaceFn ? G.__abPaceFn(sim, paceTarget(sim)) : paceTarget(sim); S.pace += (tg - S.pace) * (1 - Math.exp(-dt / (tg < S.pace ? .12 : .9))); }
                    var rate = (G.__abLive ? (SPEEDS3[String(S.preset)] || 1) : liveSpeed()) * S.pace * (G.__abLive ? 1 : lkEff()); if (!S.raw && rate > MAX_RATE) rate = MAX_RATE;      // [fiz]
                    if (S.use3 && !S.raw) {      // [v133] 3B: canli oyunda hiz tavani + gorunen hizin yumusak degisimi (hizlanma ~e/sn, yavaslama ~e^3/sn)
                        var cap3 = Math.max(LIVE3_CAP, S.lk || 1); if (!G.__abLive && S.watch === 'wide' && sim.mode === 'live' && rate > cap3) rate = cap3;      // tavan: en az 2.4, mac suresi icin gereken kisaltma (lk) kadar - sure bozulmaz, sakin oyunda ek tempo sicramasi yok
                        var r0 = S.rateS > 0 ? S.rateS : rate, lr = Math.log(rate / r0); lr = Math.max(-3 * dt, Math.min((sim.mode === 'dead' ? 3 : 1) * dt, lr)); rate = S.rateS = r0 * Math.exp(lr);
                    } else S.rateS = 0;
                    try { sqTick(sim, now); if (sqSlow(sim)) { rate = Math.min(rate, liveSpeed()); if (S.rateS > 0) S.rateS = Math.min(S.rateS, rate); } if (sqBlock(sim, now)) { S.clkOff = (S.clkOff || 0) + dt * Math.max(.3, rate); rate = 0; } } catch (e) { }      // [v186] olay sekansı gerçek zamanda; kart/çıkış bitmeden duran top kullanılmaz
                    S.rateNow = rate;
                    var dlw = dlWant(); if (dlw && !DL.on) { DL.on = 1; DL.q.length = 0; DL.fz = 0; DL.dT = sim.t - (1 - Math.max(0, Math.min(1, S.acc / DT))) * DT; } else if (!dlw && DL.on) dlOff();      // [v135]
                    if (DL.on) {      // [v135] goruntu saati gercek hizla akar; sim onu DL.D onde tutar (yetisme en cok ~12 adim)
                        DL.fz = !!(S.vs || S.goalPend) || DL.q.some(function (e) { return e.type === 'GOAL' || e.type === 'CARD' || e.type === 'VAR'; });      // [v139] gol/kart/VAR goruntude bitene dek sim bekler (VAR sonrasi gol: son kare golun karesi kalir)
                        DL.D = V8B.ld ? .45 : .32;      // [v188] daha uzun ön görü: vuruş / müdahale / blok hareketi topun çıkışından ~.3 sn önce başlayabilir (eskiden en çok ~.18 sn: temas anı okunmuyordu)
                        DL.dT += dt * rate; var nD = 0, tgD = DL.dT + DL.D;
                        while (!DL.fz && sim.t < tgD - 1e-9 && nD < 12 && !S.hold && !sim.finished && !S.halfPending) { var tq = sim.t; stepOnce(); nD++; if (sim.t === tq) break; }
                        if (DL.dT > sim.t) DL.dT = sim.t; if (DL.dT < sim.t - DL.D - .25) DL.dT = sim.t - DL.D - .25;
                        S.acc = 0; dlFlush(false);
                    } else {
                    S.acc += dt * rate;
                    var nCap = S.use3 && !S.raw ? Math.max(2, Math.ceil(rate * Math.min(dt, 1 / 30) / DT) + 1) : 1500;      // [v133] 3B: takilmadan sonra yetisme patlamasi yok (fazla sure atilir)
                    while (S.acc >= DT && n < nCap && !S.hold && !sim.finished && !S.halfPending) { stepOnce(); S.acc -= DT; n++; }
                    if (n >= nCap) S.acc = nCap < 1500 ? Math.min(S.acc, DT * .999) : 0;
                    }
                }
                var mtI = Math.floor(sim.t * CK); if (mtI !== S.mtI || S.mtSid !== S.sid) { S.mtI = mtI; S.mtSid = S.sid; var mtT = fmt(sim.t); setTxt($('match-time'), mtT); if (S.bhud) setTxt($('ab-hud-clock'), mtT); }   // [opt] yalnız saniye değişince (yayın HUD saati de aynı anda)
                matchData.currentTimeMs = Math.max(1, Math.round(sim.t / SIM_TOTAL * matchData.totalDurationMs)); matchData.currentHalf = sim.half; matchData.lastSimulatedMinute = Math.floor(sim.t * CK / 60);
                if (!DL.on || (!DL.q.length && DL.dT >= sim.t - 1e-6)) afterSteps();      // [v135] devre/mac sonu goruntu yetisince
            }
            var hz = S.hold === 'goal' || S.hold === 'var' || S.hold === 'card' || S.hold === 'v7ht', pf = hz && now - S.pumpAt > 900;             // simülasyon saati donmuşken satır aralığı gerçek zamanla (≥ 0,9 sn) ayarlanır
            if (hz) S.clkOff = (S.clkOff || 0) + dt * Math.max(.3, liveSpeed() * S.pace);                                       // [gk] başlamış plonjon/kalkış duraklamada havada donmasın
            if (pf) S.pumpAt = now;
            if (hz || (!S.hold && !(fmOn() && S.fm.ph === 'clip') && (S.raw || S.watch !== 'key' || S.pace < 2.6))) S.feed.pump(sim.t, pf);       // ileri sarmada spiker satırları yığılmaz; tempo yavaşlayınca güncel olan söylenir
            var oi = sim.ball.owner ? sim.ball.owner.id : -1; if (oi !== S.xiBall) { S.xiBall = oi; markBall(oi); }
            if (now - S.statTimer > 250) { S.statTimer = now; if (S.running || S.hold) syncStats(); bcastHudSync(now); }
            if (now - (S.sndT || 0) > 140) { S.sndT = now; try { sndTick2(); } catch (e) { } }      // [ses] tribün şiddeti
            if (now - S.ratingTimer > 700) { S.ratingTimer = now; flushRatings(); if (S.use3) bcastHudPills(); }
            /* [opt] görünürlük önbelleği (görünürken 250 ms'de bir yoklanır) */ var cvs = $('cv2d'); if (cvs && (now < (S.cvVisT || 0) || cvVis(cvs, now))) { if (S.hold === 'replay' && S.rp) drawReplay(dt); else if (!S.hold && fmOn() && (S.fm.ph === 'gap' || S.fm.ph === 'clip')) drawFm(dt); else draw(Math.max(0, Math.min(1, S.acc / DT)), dt); }
        }
        try { goalPendTick(); } catch (e) { S.goalPend = null; S.scHold = null; }      // [v139]
        if (mode === '2d' && S.sim && S.sid === matchSessionId) loop();
    }

    /* ---------- çizim ---------- */
    var cv, g, W = 0, H = 0, K = 8, M = 14, dpr = 1;
    function X(x) { return M + x * K; } function Y(y) { return M + y * K; }
    function resize() {
        cv = $('cv2d'); if (!cv) return; S.cvVisT = 0;
        var wrap = cv.parentNode, host = wrap.parentNode, wide = document.body.classList.contains('l2d-wide'), grid = document.querySelector('.match-grid'), bw = wrap.offsetWidth - wrap.clientWidth, w = host ? host.clientWidth - bw : wrap.clientWidth;   // [ui2] kap tuvale sarılı (max-content): genişlik üst kaptan okunur
        var pcd = wrap.closest ? wrap.closest('.pitch-card') : null, padx = (pcd && host ? Math.max(0, pcd.offsetWidth - host.clientWidth) : 30) + bw;    // kart dolgusu + kenarlıklar
        var fsOn = !!(document.fullscreenElement || document.webkitFullscreenElement || S.pfs);     // [ui] tam ekran ([v150] sözde tam ekran da): tuval kartın içini doldurur (geniş düzen sütun hesabı yok)
        S.hudChk = 1;
        if (wide && grid && !fsOn) w = Math.max(240, grid.clientWidth - Math.max(320, Math.min(460, Math.round(grid.clientWidth * .3))) - 16 - padx);   // [ui2] sağ sütun %30 (320–460 px): sahne büyür   // geniş düzen: sağ sütun (ilk 11'ler + kritik anlar) genişliğin %34'ü (340–500 px), sütun aralığı 16 px, kart dolgusu 30 px
        if (!w) return;
        dpr = Math.min(2, G.devicePixelRatio || 1);
        var k = (w - 2 * M) / PW, cw = w;
        var room = 0, bc = !!(S.use3 && (S.cam3 === 'bcast' || S.cam3 === 'loca') && S.r3);      /* [v158] loca da kabı doldurur */      // [ui22] 3B Yayın: tuval kabı doldurur
        if (G.innerWidth >= 700 || G.innerHeight < G.innerWidth) {          // sahayı ekran yüksekliğine sığdır (aşağı kaydırmadan izlenebilsin) [ui2] 960x600 gibi küçük pencerelerde ve yatay telefonda da
            var pv = $('view-2d'), below = pv && pv.offsetHeight ? Math.max(0, pv.offsetHeight - wrap.offsetHeight) : 60;
            var top = wrap.getBoundingClientRect().top + (G.scrollY || 0); room = G.innerHeight - Math.min(top, G.innerHeight * .55) - below - 30;
            if (fsOn && pv && pv.clientHeight > 100) room = pv.clientHeight - 4; if (fsOn && pcd && pv) { var oth = 0; for (var ci = 0; ci < pcd.children.length; ci++) { var ch = pcd.children[ci]; if (ch !== pv && ch.offsetParent !== null && getComputedStyle(ch).position !== 'absolute' && getComputedStyle(ch).position !== 'fixed') oth += ch.offsetHeight; } var pcs = getComputedStyle(pcd); var rr = pcd.clientHeight - oth - (parseFloat(pcs.paddingTop) || 0) - (parseFloat(pcs.paddingBottom) || 0) - 12; if (rr > 100) room = Math.min(room, rr); }     // [v150] tam ekranda sahne kartın kalan yüksekliğine sığar (taşma yok)     // [ui22] tam ekran: sahne alanı esnek kutudan (eski hesap tuvali her seferinde küçültüyordu)
            var kh = (room - 2 * M - MB) / PH;
            if (kh < k) { k = Math.max(kh, k * .72); cw = Math.round(k * PW + 2 * M); }
        }
        if (bc && w > cw) cw = Math.floor(w);                                 // [ui22] saha oranı kilidi yalnız 2B ve 3B Taktik'te
        if (grid && !fsOn) { if (wide) grid.style.setProperty('--pitch-w', (cw + padx) + 'px'); else grid.style.removeProperty('--pitch-w'); }
        if (grid && !fsOn) { if (wide && room > 300) grid.style.setProperty('--mg-h', Math.round(room) + 'px'); else grid.style.removeProperty('--mg-h'); }     // [ui22] sağ sütun ekranın altına kadar     // [ui] tam ekranda ızgaraya yazılmaz (çıkışta düzen bozulmasın)
        var nar = cw < 560, tiny = cw < 380;                                  // [ui2] dar sahne: yayın grafiği küçülür · çok dar: görünüm sekmeleri sol alta
        if (wrap.classList.contains('cv-narrow') !== nar) wrap.classList.toggle('cv-narrow', nar);
        if (wrap.classList.contains('cv-tiny') !== tiny) wrap.classList.toggle('cv-tiny', tiny);
        K = k; var h = Math.round(PH * K + 2 * M + MB);
        if (bc && (room > h || (fsOn && room > 100))) h = Math.round(fsOn ? room : Math.min(room, cw / 1.2));      // [ui22] 3B Yayın: yükseklik ekrana göre (TV görüntüsü kenardan kenara)
        S.szw = cw; S.szh = h; sync3dSize();
        if (S.rp) S.rp.by = rpBadgeY();                                      // [rp] tekrar rozeti sekmelerin altında kalsın
        if (cv._cw === cw && cv._ch === h && cv._dpr === dpr && g) return;
        cv._cw = cw; cv._ch = h; cv._dpr = dpr;
        cv.width = Math.round(cw * dpr); cv.height = Math.round(h * dpr);
        cv.style.width = cw + 'px'; cv.style.height = h + 'px';
        g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); W = cw; H = h;
    }
    /* geniş düzen: maç alanı yeterince genişse (≥ 940 px) saha solda, sağda ilk 11'ler + kritik anlar; değilse tek sütun + sekmeler */
    function syncLayout() {
        var ms = $('match-screen'), w = ms ? ms.clientWidth : 0, wide = mode === '2d' && w >= 940, b = document.body;
        if (b.classList.contains('l2d-wide') !== wide) b.classList.toggle('l2d-wide', wide);
        resize();
    }
    function drawPitch() {
        g.fillStyle = '#0a2416'; g.fillRect(0, 0, W, H);
        for (var i = 0; i < 15; i++) { g.fillStyle = i % 2 ? '#14532d' : '#175c32'; g.fillRect(X(i * PW / 15), Y(0), PW / 15 * K + .5, PH * K); }
        g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(1.2, K * .16); g.strokeRect(X(0), Y(0), PW * K, PH * K);
        g.beginPath(); g.moveTo(X(PW / 2), Y(0)); g.lineTo(X(PW / 2), Y(PH)); g.stroke();
        g.beginPath(); g.arc(X(PW / 2), Y(PH / 2), 9.15 * K, 0, 7); g.stroke();
        g.beginPath(); g.arc(X(PW / 2), Y(PH / 2), .3 * K, 0, 7); g.fillStyle = '#fff'; g.fill();
        [0, 1].forEach(function (s) {
            g.strokeRect(s ? X(PW - 16.5) : X(0), Y(C.PA_Y0), 16.5 * K, (C.PA_Y1 - C.PA_Y0) * K);
            g.strokeRect(s ? X(PW - 5.5) : X(0), Y(PH / 2 - 9.16), 5.5 * K, 18.32 * K);
            var px = s ? PW - 11 : 11; g.beginPath(); g.arc(X(px), Y(PH / 2), .3 * K, 0, 7); g.fill();
            g.beginPath(); g.arc(X(px), Y(PH / 2), 9.15 * K, s ? Math.PI - .93 : -.93, s ? Math.PI + .93 : .93); g.stroke();
            g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(s ? X(PW) : X(-2.2), Y(C.GY0), 2.2 * K, C.GW * K);
            g.strokeStyle = '#fff'; g.strokeRect(s ? X(PW) : X(-2.2), Y(C.GY0), 2.2 * K, C.GW * K); g.strokeStyle = 'rgba(255,255,255,.85)';
        });
    }
    function rgba(hex, a) { var h = String(hex).replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
    function drawCtl() {
        var sim = S.sim, cw = 3, ch = 3, nx = Math.floor(PW / cw), ny = Math.floor(PH / ch);
        for (var i = 0; i < nx; i++) for (var j = 0; j < ny; j++) {
            var x = (i + .5) * cw, y = (j + .5) * ch, t0 = 99, t1 = 99;
            for (var k = 0; k < 22; k++) { var p = sim.players[k]; if (p.off) continue; var t = Math.hypot(p.x - x, p.y - y) / p.maxV; if (p.team === 0) { if (t < t0) t0 = t; } else if (t < t1) t1 = t; }
            var d = t1 - t0, a = Math.min(.42, Math.abs(d) * .22);
            g.fillStyle = rgba(d > 0 ? S.cols[0] : S.cols[1], a); g.fillRect(X(i * cw), Y(j * ch), cw * K, ch * K);
        }
    }
    function drawDecision() {
        var sim = S.sim, o = sim.ball.owner; if (!o || sim.mode !== 'live') return;
        var opts = sim.passOptions(o, false, 0, true), best = -9, bi = -1; opts.forEach(function (p, i) { if (p.s > best) { best = p.s; bi = i; } });
        opts.forEach(function (op, i) {
            var q = op.q, good = Math.max(0, Math.min(1, (op.ev + .03) / .10)), pt = Math.round(good * 100), r = Math.round(255 * (1 - good)), gr = Math.round(200 * good + 30);
            g.strokeStyle = 'rgba(' + r + ',' + gr + ',80,' + (i === bi ? .95 : .55) + ')'; g.lineWidth = i === bi ? 3.5 : 1.8; g.setLineDash(i === bi ? [] : [6, 5]);
            g.beginPath(); g.moveTo(X(o.x), Y(o.y)); g.lineTo(X(q.x), Y(q.y)); g.stroke(); g.setLineDash([]);
            g.fillStyle = 'rgba(3,8,20,.82)'; g.fillRect(X(q.x) - 15, Y(q.y) - 32, 30, 15); g.fillStyle = i === bi ? '#ffc93c' : '#dfe9f5'; g.font = '700 11px sans-serif'; g.textAlign = 'center'; g.fillText(pt, X(q.x), Y(q.y) - 21);
        });
        var pd = 99, np = null; sim.players.forEach(function (p) { if (p.team !== o.team && !p.off) { var d = Math.hypot(p.x - o.x, p.y - o.y); if (d < pd) { pd = d; np = p; } } });
        if (np) { g.strokeStyle = 'rgba(255,59,92,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(X(np.x), Y(np.y), Math.max(pd, 1) * K, 0, 7); g.stroke(); }
        var xg = sim.xgRepAt ? sim.xgRepAt(o.x, o.y, o.team, pd) : sim.xgAt(o.x, o.y, sim.teams[o.team].dir, pd);
        g.fillStyle = 'rgba(3,8,20,.82)'; g.fillRect(X(o.x) + 16, Y(o.y) - 9, 78, 18); g.fillStyle = '#ffc93c'; g.font = '700 11px sans-serif'; g.textAlign = 'left'; g.fillText('şut xG ' + xg.toFixed(2), X(o.x) + 21, Y(o.y) + 4);
        drawDecPanel(o);
    }
    /* taşıyıcının kendi kararı: hangi eylemleri değerlendirdi, hangisini seçti (oyuncu beyni ağırlıklarıyla) */
    function drawDecPanel(o, ax, ay) {
        var dc = o.dec, sim = S.sim; if (!dc || sim.t - dc.t > 2.5) return;
        var rows = [['pass', 'Pas'], ['shot', 'Şut'], ['drib', 'Çalım'], ['clear', 'Uzaklaştır']].filter(function (r) { return dc.alt[r[0]] != null; });
        if (!rows.length) return;
        var cx0 = ax != null ? ax : X(o.x), cy0 = ay != null ? ay : Y(o.y), xr = ax != null ? W - 2 : X(PW) + M - 2, yb = ay != null ? H - 2 : Y(PH) + M - 2, w = 118, h = 17 + rows.length * 14, px = cx0 + 16, py = cy0 + 13;
        if (px + w > xr) px = cx0 - 16 - w; if (py + h > yb) py = cy0 - 13 - h - 20;
        g.fillStyle = 'rgba(3,8,20,.88)'; g.fillRect(px, py, w, h);
        g.font = '700 9px sans-serif'; g.textAlign = 'left'; g.fillStyle = '#8fa6bd'; g.fillText((o.br && o.br.real ? o.br.style : 'Oyuncu kararı').toUpperCase(), px + 5, py + 11);
        rows.forEach(function (r, i) {
            var pt = Math.round(Math.max(0, Math.min(1, (dc.alt[r[0]] + .03) / .10)) * 100), y = py + 17 + i * 14, pick = r[0] === dc.act;
            g.fillStyle = pick ? '#ffc93c' : '#dfe9f5'; g.font = '700 10px sans-serif'; g.textAlign = 'left'; g.fillText(r[1], px + 5, y + 10);
            g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(px + 58, y + 3, 40, 6); g.fillStyle = pick ? '#ffc93c' : '#7fd1ff'; g.fillRect(px + 58, y + 3, 40 * pt / 100, 6);
            g.fillStyle = pick ? '#ffc93c' : '#dfe9f5'; g.textAlign = 'right'; g.fillText(pt, px + w - 4, y + 10);
        });
    }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function inkOn(hex) { return (G.ado && ado.ink) ? ado.ink(hex) : '#fff'; }
    var FD = '';                                                            // [ui2] tuval yazıları: CSS --font-display (yoksa sans-serif)
    function fd() { if (!FD) { try { FD = (getComputedStyle(document.documentElement).getPropertyValue('--font-display') || '').trim(); } catch (e) { } if (!FD) FD = 'sans-serif'; } return FD; }
    var LBF = { fs: -1, f: '', w: null };                                   // [opt] etiket yazı tipi + ad genişliği önbelleği (boy değişince sıfırlanır)
    var LB3 = { fs: -1, f1: '', f2: '', w: null, lc: Object.create(null) };
    function lb3Light(hex) {      // takim renginin acik tonu (koyu formalar koyu zeminde okunsun)
        var c = LB3.lc[hex]; if (c) return c; var h = String(hex || '#9fb8cf').replace('#', ''); if (h.length === 3) h = h.split('').map(function (q) { return q + q; }).join('');
        var n = parseInt(h, 16) || 0, r = n >> 16 & 255, gg = n >> 8 & 255, b = n & 255, L = (r * .3 + gg * .59 + b * .11) / 255, k = L < .55 ? .5 : .15;
        r = Math.round(r + (255 - r) * k); gg = Math.round(gg + (255 - gg) * k); b = Math.round(b + (255 - b) * k); return (LB3.lc[hex] = 'rgb(' + r + ',' + gg + ',' + b + ')');
    }
    function label3(text, num, x, y, col, tc) {      // [ui37] yayin tarzi isim kapsulu
        var fs = Math.max(10, Math.round(K * 1.1)), fsN = Math.max(9, Math.round(fs * .9));
        if (LB3.fs !== fs) { LB3.fs = fs; LB3.f1 = '600 ' + fs + 'px ' + fd(); LB3.f2 = '800 ' + fsN + 'px ' + fd(); LB3.w = Object.create(null); }
        var key = text + '|' + (num == null ? '' : num), m = LB3.w[key];
        if (!m) { g.font = LB3.f1; var wt = g.measureText(text).width; g.font = LB3.f2; var wn = num != null ? g.measureText(String(num)).width : 0; m = LB3.w[key] = [wt, wn]; }
        var h = fs + 8, px = 9, gap = num != null ? 6 : 0, w = m[0] + m[1] + gap + px * 2, x0 = Math.round(x - w / 2) + .5, y0 = Math.round(y) + .5;
        g.save();
        g.shadowColor = 'rgba(0,0,0,.38)'; g.shadowBlur = 7; g.shadowOffsetY = 1;
        g.fillStyle = 'rgba(8,13,23,.68)'; rr(x0, y0, w, h, h / 2); g.fill();
        g.shadowColor = 'rgba(0,0,0,0)'; g.shadowBlur = 0; g.shadowOffsetY = 0;
        g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1; g.stroke();
        g.beginPath(); g.moveTo(x - 4, y0 + h); g.lineTo(x + 4, y0 + h); g.lineTo(x, y0 + h + 4); g.closePath(); g.fillStyle = 'rgba(8,13,23,.68)'; g.fill();
        g.textBaseline = 'middle'; g.textAlign = 'left';
        if (num != null) { g.font = LB3.f2; g.fillStyle = lb3Light(tc); g.fillText(String(num), x0 + px, y0 + h / 2 + .5); }
        g.font = LB3.f1; g.fillStyle = col || '#f2f6fb'; g.fillText(text, x0 + px + m[1] + gap, y0 + h / 2 + .5);
        g.restore(); g.textBaseline = 'alphabetic';
    }
    function label(text, x, y, col) {
        var z = ZC, fs = Math.max(10, Math.round(K * 1.25)) / z;
        if (LBF.fs !== fs) { LBF.fs = fs; LBF.f = '700 ' + fs + 'px ' + fd(); LBF.w = Object.create(null); }
        g.font = LBF.f; g.textAlign = 'center';
        var w0 = LBF.w[text]; if (w0 == null) w0 = LBF.w[text] = g.measureText(text).width;
        var w = w0 + 10 / z; g.fillStyle = 'rgba(3,8,20,.86)'; g.fillRect(x - w / 2, y, w, 16 / z); g.fillStyle = col || '#fff'; g.fillText(text, x, y + 12 / z);
    }

    /* ---------- görünüm (canlı ya da tekrar karelerinden) + kamera ---------- */
    var V = newView();
    function liveView(alpha) {
        var sim = S.sim, B = sim.ball, i, p, pv, z = 0, vs = S.vs;
        if (vs && vs.snap && !vs.reveal) return snapView(vs.snap);
        for (i = 0; i < 22; i++) { p = sim.players[i]; pv = (S.prev[i] && !p.off) ? S.prev[i] : p; V.x[i] = lerp(pv.x, p.x, alpha); V.y[i] = lerp(pv.y, p.y, alpha);
            if (pv !== p && pv.fx != null) { var fa0 = Math.atan2(pv.fx, pv.fy), fda = Math.atan2(p.fx, p.fy) - fa0; fda = Math.atan2(Math.sin(fda), Math.cos(fda)); fa0 += fda * alpha; V.fx[i] = Math.sin(fa0); V.fy[i] = Math.cos(fa0); } else { V.fx[i] = p.fx; V.fy[i] = p.fy; } }      // [v133] bakis yonu de adimlar arasinda (25 Hz basamak yok)
        V.bx = lerp(S.prevB.x, B.x, alpha); V.by = lerp(S.prevB.y, B.y, alpha);
        if (sim.ball3d) z = lerp(S.prevB.z != null ? S.prevB.z : (B.z || 0), B.z || 0, alpha); else if (B.high) { var pr = (sim.t - B.high.t0) / (B.high.tLand - B.high.t0); z = Math.sin(Math.PI * Math.max(0, Math.min(1, pr))) * B.high.h; }
        V.bz = z; V.owner = B.owner ? B.owner.id : -1; V.sps = (!B.owner && sim.mode === 'live') ? (B.sps || 0) : 0;      // [v139] motorun gercek yan donusu
        if (CRD.on) { V.bx = lerp(CRD.px, CRD.x, alpha); V.by = lerp(CRD.py, CRD.y, alpha); V.bz = lerp(CRD.pz, CRD.z, alpha); }      // [carry]
        if (!V.gp) V.gp = new Float32Array(22); for (var gpi = 0; gpi < 22; gpi++) V.gp[gpi] = (GPHP[gpi] + (GPH[gpi] - GPHP[gpi]) * alpha) % 6283.185307; V.gpOn = 1;      // [motor] motor adim evresi
        V.dOn = CRD.on; V.dtl = CRD.tl + (S.clkOff || 0); V.dtp = CRD.tp + (S.clkOff || 0); V.dTt = CRD.Tt; V.dn = CRD.n; V.dk = CRD.k; V.gph = lerp(CRD.pgph, CRD.gph, alpha); V.dtn = CRD.tn > 0 ? CRD.tn + (S.clkOff || 0) : -9; V.dfn = CRD.fn;
        if (alpha < 1 && S.hold !== 'goal' && !S.prevB.dead && sim.mode === 'dead' && Math.hypot(B.x - S.prevB.x, B.y - S.prevB.y) > 1.2) { V.bx = B.x; V.by = B.y; V.bz = sim.ball3d ? (B.z || 0) : 0; }      // [fm] olu top yerlesimi: ara deger yok
        var r = S.ref; V.rx = lerp(r.px, r.x, alpha); V.ry = lerp(r.py, r.y, alpha); V.rfx = r.fx; V.rfy = r.fy; arLive(V, alpha);
        S.viewT = sim.t - (1 - alpha) * DT;                                     // [gk] görünen sim zamanı (aksiyon saati)
        return V;
    }
    /* VAR incelemesi sürerken sahne, olay anından önceki kareyi gösterir (karar henüz açılmadı); hakem canlıdır */
    function snapView(sn) {
        var i, q, r = S.ref;
        for (i = 0; i < 22; i++) { q = 6 + i * 4; V.x[i] = sn[q]; V.y[i] = sn[q + 1]; V.fx[i] = sn[q + 2]; V.fy[i] = sn[q + 3]; }
        V.bx = sn[1]; V.by = sn[2]; V.bz = sn[3]; V.owner = sn[4]; crViewF(V, sn, 0, 0, 0);
        V.rx = r.x; V.ry = r.y; V.rfx = r.fx; V.rfy = r.fy; S.viewT = sn[0]; arLive(V, 1);
        return V;
    }
    function replayView(rp) {
        var f = rp.fr, i0 = Math.min(rp.n - 2, Math.max(0, Math.floor(rp.tc))), a = Math.min(1, rp.tc - i0), o0 = i0 * FS, o1 = o0 + FS, i, q;
        for (i = 0; i < 22; i++) {
            q = 6 + i * 4;
            V.x[i] = f[o0 + q] + (f[o1 + q] - f[o0 + q]) * a; V.y[i] = f[o0 + q + 1] + (f[o1 + q + 1] - f[o0 + q + 1]) * a;
            V.fx[i] = f[o0 + q + 2]; V.fy[i] = f[o0 + q + 3];
        }
        V.bx = f[o0 + 1] + (f[o1 + 1] - f[o0 + 1]) * a; V.by = f[o0 + 2] + (f[o1 + 2] - f[o0 + 2]) * a; V.bz = f[o0 + 3] + (f[o1 + 3] - f[o0 + 3]) * a;
        V.owner = a < .5 ? f[o0 + 4] : f[o1 + 4]; crViewF(V, f, o0, o1, a); V.sps = f[o0 + RO + 25] || 0;      // [v139]
        V.rx = f[o0 + RO] + (f[o1 + RO] - f[o0 + RO]) * a; V.ry = f[o0 + RO + 1] + (f[o1 + RO + 1] - f[o0 + RO + 1]) * a; V.rfx = f[o0 + RO + 2]; V.rfy = f[o0 + RO + 3]; arViewF(V, f, o0, o1, a);
        S.viewT = f[o0] + (f[o1] - f[o0]) * a;                                  // [gk] tekrar saati (kayıtlı sim zamanı)
        return V;
    }
    function camStep(dt, v, tz) {
        var c = S.cam, kz = 1 - Math.exp(-dt / .45), kp = 1 - Math.exp(-dt / .35);
        c.z += (tz - c.z) * kz;
        if (tz > 1 || c.z > 1.001) { c.x += (v.bx - c.x) * kp; c.y += (v.by - c.y) * kp; }
    }
    function beginCam() {
        var c = S.cam, z = c.z; ZC = z > 1.001 ? z : 1;
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#0a2416'; g.fillRect(0, 0, W, H);
        if (z > 1.001) {
            var tx = W / 2 - X(c.x) * z, ty = H / 2 - Y(c.y) * z;
            tx = Math.min(0, Math.max(W - W * z, tx)); ty = Math.min(0, Math.max(H - H * z, ty));
            c.tx = tx; c.ty = ty; g.setTransform(dpr * z, 0, 0, dpr * z, dpr * tx, dpr * ty);
        } else { c.tx = 0; c.ty = 0; }
    }
    /* oyuncular + hakem + top. o.sc: monitör penceresinin ölçeği (piksel boyutları buna bölünür, oyuncular ana sahadaki kadar büyük görünür) */
    function drawActors(v, o) {
        var sim = S.sim, sc = o.sc || 1, u = 1 / sc, now = performance.now(), foc = o.live ? (S.focus && now < S.focus.until ? S.focus.ids : []) : [], Rm = Math.max(8.5, 1.55 * K), R0 = Rm * u, R = R0, i, j, ringCol,
            wd = o.live && sim.mode === 'dead' && !S.vs && sim.dead && sim.dead.kind === 'freekick' && sim.dead.wall ? sim.dead.wall.ids : null;      // barajdaki oyuncular bitişik durur: belirteçleri küçültülür (üst üste binmesin)
        drawRef(v, o); drawAR2(v, o);
        for (i = 0; i < 22; i++) {
            if (v.x[i] < -20) continue;                                             // oyundan atılan oyuncu sahanın dışına park edilir, çizilmez (tekrar karelerinde atılmadan önceki kareler çizilir)
            R = wd && wd.indexOf(i) >= 0 ? R0 * .66 : R0;
            var p = sim.players[i], x = v.x[i], y = v.y[i], col = S.cols[p.team], isF = foc.indexOf(p.id) >= 0, hov = o.live && S.hover === i, own = v.owner === i;
            ringCol = null; if (o.rings) for (j = 0; j < o.rings.length; j++) if (o.rings[j].id === i) ringCol = o.rings[j].col;
            g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(X(x) + 2 * u, Y(y) + 3 * u, R * .95, R * .75, 0, 0, 7); g.fill();
            if (isF || hov || ringCol) { g.strokeStyle = ringCol || '#ffc93c'; g.lineWidth = 2.5 * u; g.beginPath(); g.arc(X(x), Y(y), R + (4 + (isF || ringCol ? 2 * Math.sin(now / 120) : 0)) * u, 0, 7); g.stroke(); }
            g.fillStyle = col; g.beginPath(); g.arc(X(x), Y(y), R, 0, 7); g.fill();
            g.strokeStyle = own ? '#fff' : 'rgba(255,255,255,.55)'; g.lineWidth = (own ? 2.6 : 1.3) * u; g.stroke();
            g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 2 * u; g.beginPath(); g.moveTo(X(x) + v.fx[i] * (R + .5 * u), Y(y) + v.fy[i] * (R + .5 * u)); g.lineTo(X(x) + v.fx[i] * (R + 4.5 * u), Y(y) + v.fy[i] * (R + 4.5 * u)); g.stroke();
            g.fillStyle = inkOn(col); g.font = '700 ' + (Math.max(8, Math.round(Rm * .78)) * u) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText(p.db ? (p.db.lbl || p.db.pos) : ROLE(p.role), X(x), Y(y) + .5 * u); g.textBaseline = 'alphabetic';
            if (isF || ringCol || (o.live && own) || hov || (S.ov.names && !o.sc)) label(p.short || p.name, X(x), Y(y) + R + 2 * u, ringCol || (isF ? '#ffc93c' : '#fff'));
        }
        var z = v.bz * K * .7, bx = v.bx, by = v.by, br = Math.max(3.4, .62 * K) * u;
        g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.arc(X(bx), Y(by) - z, br * 2.6, 0, 7); g.fill();          // top halesi: yavaş oynatmada topu gözden kaçırma
        g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(X(bx), Y(by) + 2 * u, .6 * K * u, .4 * K * u, 0, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.strokeStyle = '#111'; g.lineWidth = 1.6 * u; g.beginPath(); g.arc(X(bx), Y(by) - z, br + z * .05, 0, 7); g.fill(); g.stroke();
    }
    function drawTrail(tr, live) {
        if (tr && tr.length > 1) {
            var nT = tr.length;
            for (var ti = 1; ti < nT; ti++) { g.strokeStyle = 'rgba(255,255,255,' + (live ? .35 : (.12 + .5 * ti / nT)) + ')'; g.lineWidth = live ? 2 : 2.6; g.beginPath(); g.moveTo(X(tr[ti - 1][0]), Y(tr[ti - 1][1])); g.lineTo(X(tr[ti][0]), Y(tr[ti][1])); g.stroke(); }
        }
    }
    function renderScene(v, o) {
        var sim = S.sim; beginCam(); drawPitch(); drawSide();
        if (o.live && S.ov.ctl) drawCtl();
        drawTrail(o.live ? (S.ov.trail ? S.trail : null) : o.trailPts, o.live);
        if (o.live && S.ov.dec) drawDecision();
        if (o.live) drawIncident();
        drawActors(v, o);
        if (o.live) drawWallSpray();
        if (o.live) drawRefFx(v, o);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        overlayCommon(o);
    }
    function overlayCommon(o) {
        var sim = S.sim;
        // [ui2] duran top etiketi tuvale çizilmez: skor bandının altındaki bayrakta (#ab-hud-dead, bcastHudSync) 2B ve 3B'de aynı yerde
        if (o.live && S.watch === 'key' && S.running && !S.hold && S.pace > 3) drawFF();
        if (o.live && S.vs) { drawMonitor(); drawVarHud(); }
        var lg = $('v2d-legend');
        if (lg) { var lgH = !(o.live && (S.ov.dec || S.ov.ctl)); if (lg.hidden !== lgH) lg.hidden = lgH; if (!lgH) setTxt(lg, S.ov.dec ? 'Çizgi = pas seçeneği · sayı = karar puanı 0-100 (kalın çizgi = en yüksek) · kutu = topu taşıyanın kararı (altın = seçtiği eylem) · kırmızı halka = en yakın rakip' : 'Renk = o noktaya önce ulaşabilecek takım (parlaklık = üstünlük)'); }
    }
    /* kritik anlar modunda ileri sarma göstergesi */
    function drawFF() {
        var t = 'İLERİ SARMA', ph = (performance.now() / 260) % 3 | 0, nar = W < 560, i;
        g.font = '800 13px ' + fd(); var w = g.measureText(t).width + 48, mg = nar ? 8 : 12, x0 = W - w - mg, y0 = mg + (S.tabB || 0);     // [ui2] sağ üstte, görünüm sekmelerinin altında (sol üst skor bandının yeri)
        g.fillStyle = 'rgba(6,10,20,.88)'; g.fillRect(x0, y0, w, 26); g.fillStyle = '#ffc93c'; g.fillRect(x0, y0, 3, 26);
        for (i = 0; i < 3; i++) { g.fillStyle = i <= ph ? '#ffc93c' : 'rgba(255,201,60,.28)'; g.beginPath(); g.moveTo(x0 + 10 + i * 9, y0 + 7); g.lineTo(x0 + 17 + i * 9, y0 + 13); g.lineTo(x0 + 10 + i * 9, y0 + 19); g.closePath(); g.fill(); }
        g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(t, x0 + 40, y0 + 18);
    }
    /* =====================================================================
       HAKEM (siyah forma) · SAHA KENARI (teknik alanlar + hakem inceleme alanı) · VAR MONİTÖRÜ ÇİZİMİ
       Hepsi yalnızca görüntüdür; oyun kayıtlarını değiştirmez.
       ===================================================================== */
    var ZC = 1;                                                                     // geçerli çizim ölçeği (kamera yakınlaştırması ya da monitör penceresi): etiket yazıları buna bölünür
    function rr(x, y, w, h, r) {
        g.beginPath();
        if (g.roundRect) { g.roundRect(x, y, w, h, r); return; }
        g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
    }
    function rraGeom() { var w = Math.max(50, Math.min(86, K * 9.5)); return { cx: X(PW / 2), y0: Y(PH), w: w, h: 26, top: Y(PH) + 20 }; }
    /* teknik alanlar: ev sahibi solda, deplasman sağda (orta çizginin iki yanı); ortada hakem inceleme alanı (RRA): başlıklı VAR monitörü */
    function drawSide() {
        var q = rraGeom(), vs = S.vs, act = !!(vs && (vs.phase === 'walk' || vs.phase === 'watch' || vs.phase === 'tv2')), now = performance.now(), i, x1;
        var bw = Math.max(64, Math.min(150, K * 15)), gap = 12, bh = 20, by = q.top + 3;      // [ui24] 20 px kutu, 11 px yazı; renk şeridi sol kenarda (yazının üstünden geçmez)
        for (i = 0; i < 2; i++) {
            x1 = i === 0 ? q.cx - q.w / 2 - gap - bw : q.cx + q.w / 2 + gap;
            g.fillStyle = 'rgba(2,10,7,.62)'; rr(x1, by, bw, bh, 4); g.fill();
            g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1; rr(x1, by, bw, bh, 4); g.stroke();
            g.fillStyle = rgba(S.cols[i], .95); g.fillRect(x1 + 4, by + 4, 3, bh - 8);
            g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '700 11px ' + fd(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(teamObj(i).name).toLocaleUpperCase('tr'), x1 + bw / 2 + 3, by + bh / 2 + .5, bw - 18);
        }
        var bx = q.cx - q.w / 2;
        if (!act) g.globalAlpha = .42;                                          // [ui24] inceleme yokken VAR kutusu soluk
        g.fillStyle = '#0a1522'; rr(bx, q.top, q.w, q.h, 5); g.fill();
        if (act) { g.strokeStyle = 'rgba(127,209,255,.3)'; g.lineWidth = 6; rr(bx - 1, q.top - 1, q.w + 2, q.h + 2, 6); g.stroke(); }
        g.strokeStyle = act ? 'rgba(127,209,255,.95)' : 'rgba(255,255,255,.3)'; g.lineWidth = act ? 1.8 : 1; rr(bx, q.top, q.w, q.h, 5); g.stroke();
        g.fillStyle = 'rgba(127,209,255,' + (act ? .55 + .2 * Math.sin(now / 150) : .22) + ')'; g.fillRect(bx + 7, q.top + 5, q.w - 14, 11);
        g.fillStyle = act ? '#fff' : '#9fb8cf'; g.font = '800 10px ' + fd(); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText('VAR', q.cx, q.top + q.h - 3.5);
        g.globalAlpha = 1;
    }
    /* hakem: siyah disk + ince yeşil-sarı halka (koyu çimde seçilsin), oyunculardan küçük */
    function drawAR2(v, o) {      // [yan]
        if (!v.ar) return; var sc = o.sc || 1, u = 1 / sc, R = Math.max(4.6, .8 * K) * u, i, k, x, y;
        for (i = 0; i < 2; i++) {
            k = i * 6; x = X(v.ar[k]); y = Y(Math.max(-.7, Math.min(PH + .7, v.ar[k + 1])));
            g.fillStyle = '#0b0b0e'; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill(); g.strokeStyle = '#c9f23d'; g.lineWidth = 1.2 * u; g.stroke();
            if (v.ar[k + 4] > 0) { var up = v.ar[k + 1] < PH / 2 ? -1 : 1, fy = y + up * (R + 1.5 * u); g.strokeStyle = '#ddd'; g.lineWidth = 1.2 * u; g.beginPath(); g.moveTo(x, y + up * R); g.lineTo(x, fy + up * 6 * u); g.stroke(); g.fillStyle = '#ffd21f'; g.fillRect(x, fy + up * 6 * u - (up > 0 ? 0 : 0) - 2.5 * u, 6 * u, 5 * u); g.fillStyle = '#e5233b'; g.fillRect(x + 3 * u, fy + up * 6 * u - 2.5 * u, 3 * u, 2.5 * u); }
        }
    }
    function drawRef(v, o) {
        if (v.rx == null) return;
        var sc = o.sc || 1, u = 1 / sc, rx = X(v.rx), ry = Y(v.ry), R = Math.max(6.4, 1.15 * K) * u;
        g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(rx + 2 * u, ry + 3 * u, R * .95, R * .75, 0, 0, 7); g.fill();
        if (o.live && S.hoverRef) { g.strokeStyle = '#ffc93c'; g.lineWidth = 2 * u; g.beginPath(); g.arc(rx, ry, R + 4 * u, 0, 7); g.stroke(); }
        g.fillStyle = '#0b0b0e'; g.beginPath(); g.arc(rx, ry, R, 0, 7); g.fill();
        g.strokeStyle = '#c9f23d'; g.lineWidth = 1.5 * u; g.stroke();
        g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = 1.6 * u; g.beginPath(); g.moveTo(rx + v.rfx * (R + .5 * u), ry + v.rfy * (R + .5 * u)); g.lineTo(rx + v.rfx * (R + 3.6 * u), ry + v.rfy * (R + 3.6 * u)); g.stroke();
        if (R * sc >= 7.6) { g.fillStyle = '#c9f23d'; g.font = '800 ' + Math.max(7 * u, R * .95) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', rx, ry + .5 * u); g.textBaseline = 'alphabetic'; }
        if (o.live && S.ov.names) label('Hakem', rx, ry + R + 2 * u, '#c9f23d');
    }
    /* incelenen pozisyonun yeri: sarı kesik halka */
    function drawIncident() {
        var vs = S.vs; if (!vs || vs.phase === 'sign') return;
        var early = vs.phase === 'alert' || vs.phase === 'tv1', r = Math.max(12, (2.2 + .5 * Math.sin(performance.now() / 200)) * K);
        g.strokeStyle = 'rgba(255,201,60,' + (early ? .85 : .4) + ')'; g.lineWidth = early ? 2.4 : 1.6; g.setLineDash([6, 5]); g.beginPath(); g.arc(X(vs.fx), Y(vs.fy), r, 0, 7); g.stroke(); g.setLineDash([]);
    }
    /* hakemin işaretleri: kulaklıkta VAR, havada "TV" dikdörtgeni, karar (tik / çarpı / kart), gösterdiği kart */
    function signGlyph(x, y, vs) {
        var m = vs.m, oc = m.outcome, pu = Math.min(1, (performance.now() - vs.sgAt) / 220), s = .6 + .4 * pu;
        g.save(); g.translate(x, y); g.scale(s, s);
        if (vs.kind === 'red') {
            g.fillStyle = oc === 'downgrade' ? '#ffd21f' : '#e5233b'; rr(-7, -10, 14, 20, 2.5); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.6; g.stroke();
        } else {
            var good = oc === 'confirm';
            g.fillStyle = good ? '#22c55e' : '#ef4444'; g.beginPath(); g.arc(0, 0, 11, 0, 7); g.fill();
            g.strokeStyle = '#fff'; g.lineWidth = 2.6; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
            if (good) { g.moveTo(-5, 0); g.lineTo(-1.5, 4); g.lineTo(5.5, -4); } else { g.moveTo(-4.5, -4.5); g.lineTo(4.5, 4.5); g.moveTo(4.5, -4.5); g.lineTo(-4.5, 4.5); }
            g.stroke(); g.lineCap = 'butt'; g.lineJoin = 'miter';
        }
        g.restore();
    }
    /* serbest vuruş: hakemin sprey çizgisi — topa 9,15 m'de, baraj oyuncularının hemen önünde kesikli beyaz çizgi (IFAB Kural 13; en üst düzeyde 2000'den beri kullanılır) */
    function drawWallSpray() {
        var d = S.sim && S.sim.mode === 'dead' && !S.vs ? S.sim.dead : null, w = d && d.kind === 'freekick' ? d.wall : null;
        if (!w) return;
        var mx = d.x + w.ux * 9.15, my = d.y + w.uy * 9.15, hw = Math.max(1.6, w.n * .42 + .6);
        g.save(); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = Math.max(1.6, K * .13); g.lineCap = 'butt'; g.setLineDash([K * .55, K * .35]);
        g.beginPath(); g.moveTo(X(mx - w.qx * hw), Y(my - w.qy * hw)); g.lineTo(X(mx + w.qx * hw), Y(my + w.qy * hw)); g.stroke(); g.restore();
    }
    function refBubble(rx, gy, vs, now) {
        var ph, g_ = g;
        if (vs) {
            ph = vs.phase;
            if (ph === 'alert') {                                                   // kulaklıktaki VAR ile konuşuyor
                var pu = 1 + .07 * Math.sin(now / 110);
                g.save(); g.translate(rx, gy); g.scale(pu, pu);
                g.fillStyle = 'rgba(3,8,20,.92)'; rr(-19, -9, 38, 18, 9); g.fill(); g.strokeStyle = '#ffc93c'; g.lineWidth = 1.4; g.stroke();
                g.fillStyle = '#ffc93c'; g.font = '800 10px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('VAR', 0, .5); g.textBaseline = 'alphabetic';
                g.restore();
            } else if (ph === 'tv1' || ph === 'tv2') {                              // "TV" işareti: havada dikdörtgen çizer
                var w = 28, h = 18, per = 2 * (w + h), pr = Math.min(1, vs.t / .45);
                g.strokeStyle = '#fff'; g.lineWidth = 2; g.setLineDash([per * pr, per]); rr(rx - w / 2, gy - h / 2, w, h, 3); g.stroke(); g.setLineDash([]);
                if (pr >= 1) { g.fillStyle = '#7fd1ff'; g.beginPath(); g.moveTo(rx - 3, gy - 4); g.lineTo(rx + 5, gy); g.lineTo(rx - 3, gy + 4); g.closePath(); g.fill(); }
            } else if (ph === 'sign') signGlyph(rx, gy, vs);
        }
    }
    function drawRefFx(v, o) {
        if (v.rx == null) return;
        var vs = S.vs, rc = S.refCard, now = performance.now(), R = Math.max(6.4, 1.15 * K), rx = X(v.rx), ry = Y(v.ry), up = ry > 64 ? -1 : 1, gy = ry + up * (R + 15);
        refBubble(rx, gy, vs, now);
        if (rc && now < rc.until) {                                                // gösterdiği kart + kartı gören oyuncunun halkası
            var cc = rc.kind === 'R' ? '#e5233b' : '#ffd21f', fade = Math.min(1, (rc.until - now) / 300);
            g.globalAlpha = fade; g.save(); g.translate(rx + 11, ry - R - 12); g.rotate(-.12);
            g.fillStyle = cc; rr(-5.5, -8, 11, 16, 2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.3; g.stroke(); g.restore();
            if (rc.id >= 0 && v.x[rc.id] > -20) { g.strokeStyle = cc; g.lineWidth = 2.4; g.beginPath(); g.arc(X(v.x[rc.id]), Y(v.y[rc.id]), Math.max(8.5, 1.55 * K) + 5 + 2 * Math.sin(now / 130), 0, 7); g.stroke(); }
            g.globalAlpha = 1;
        }
    }
    /* VAR şeridi (üst orta): inceleme aşaması; karar açılınca renkli sonuç şeridi */
    var HUD_TONE = { good: '#22c55e', bad: '#ff3b5c', warn: '#ffc93c', neutral: '#7fd1ff' };
    function drawVarHud() {
        var vs = S.vs; if (!vs) return;
        g.setTransform(dpr, 0, 0, dpr, 0, 0); ZC = 1;
        var fs = Math.max(11, Math.min(14, W / 62)), sign = vs.phase === 'sign', info = vs.info, now = performance.now();
        var t1 = sign ? info.rt : 'VAR · ' + info.label, t2 = sign ? info.rs : (VS_STAT[vs.phase] || ''), col = sign ? (HUD_TONE[info.tone] || '#fff') : '#8b7cff';
        var f1 = '800 ' + (sign ? fs + 6 : fs + 3) + 'px ' + fd(), f2 = '600 ' + (fs + 1) + 'px ' + fd(), tx0 = sign ? 18 : 29;
        g.font = f1; var w1 = g.measureText(t1).width; g.font = f2; var w2 = g.measureText(t2).width;
        var x = W < 560 ? 8 : 12, bw = Math.min(W - 2 * x, Math.max(w1, w2) + tx0 + 16), bh = Math.round(sign ? fs * 3.4 + 8 : fs * 3 + 4), y = (S.hudB || 50) + 6;      // [ui2] TV düzeni: VAR bandı skor bandının hemen altında, sola yaslı; "İncelemeyi geç" sağ altta (çakışma yok)
        S.hudRect = { x: x, y: y, w: bw, h: bh, W: W };
        g.fillStyle = 'rgba(6,10,20,.92)'; rr(x, y, bw, bh, 3); g.fill();
        g.fillStyle = col; g.fillRect(x, y, 4, bh);
        if (!sign) { g.fillStyle = 'rgba(255,59,92,' + (.55 + .45 * Math.sin(now / 200)) + ')'; g.beginPath(); g.arc(x + 17, y + bh / 2, 4.2, 0, 7); g.fill(); }
        g.textAlign = 'left'; g.fillStyle = sign ? col : '#fff'; g.font = f1; g.fillText(t1, x + tx0, y + Math.round(fs * 1.45) + (sign ? 3 : 0), bw - tx0 - 8);
        g.fillStyle = '#c9d6e6'; g.font = f2; g.fillText(t2, x + tx0, y + bh - Math.round(fs * .72), bw - tx0 - 8);
    }

    /* monitör görüntüsü: 16 sn'lik kare tamponundan (record) yavaş çekim tekrar. Ofsayt incelemesi pas anına kadar oynar ve orada durur; çizgiler pas anındaki gerçek konumlardan çizilir. */
    function crViewF(v, f, o0, o1, a) {      // [carry] kayıttan (tekrar saati kayıtlı sim zamanı); adım evresi aynı sahipte ara değerli
        var q = (a < .5 ? o0 : o1) + RO, q0 = o0 + RO, q1 = o1 + RO; v.dtl = f[q + 4]; v.dTt = f[q + 5]; v.dn = f[q + 6]; v.dk = f[q + 7]; v.dtp = f[q + 8]; v.dOn = f[q + 9] > .5 ? 1 : 0; v.dtn = f[q + 11]; v.dfn = f[q + 12];
        var g0 = f[q0 + 10], g1 = f[q1 + 10]; if (f[o0 + 4] === f[o1 + 4] && g1 >= g0 && g1 - g0 < 3) v.gph = g0 + (g1 - g0) * a; else v.gph = f[q + 10];
        // [v132] kayıttan adım evresi: yalnız top sürenin (kayıtlı CRD.gph = motorun GPH'si); canlıdan kalan bayat evre (paylaşılan V) kullanılmaz
        if (!v.gp) v.gp = new Float32Array(22); v.gpOn = 0; if (v.dOn && v.owner >= 0 && v.owner < 22 && v.gph === v.gph) { v.gp[v.owner] = v.gph; v.gpOn = 1; }
    }
    function newView() { return { dOn: 0, dtl: -9, dtp: -9, dTt: .6, dn: 0, dk: 0, gph: 0, dtn: -9, dfn: 0, x: new Float32Array(22), y: new Float32Array(22), fx: new Float32Array(22), fy: new Float32Array(22), bx: 0, by: 0, bz: 0, owner: -1, rx: 0, ry: 0, rfx: 1, rfy: 0 }; }
    function ringT(a) { return S.ring.buf[(a % RING) * FS]; }
    function ringView(fa, n1, v) {
        var b = S.ring.buf, i0 = Math.floor(fa), a = fa - i0, o0, o1, i, q;
        if (i0 >= n1) { i0 = n1; a = 0; }
        o0 = (i0 % RING) * FS; o1 = a === 0 ? o0 : ((i0 + 1) % RING) * FS;
        for (i = 0; i < 22; i++) {
            q = 6 + i * 4;
            v.x[i] = b[o0 + q] + (b[o1 + q] - b[o0 + q]) * a; v.y[i] = b[o0 + q + 1] + (b[o1 + q + 1] - b[o0 + q + 1]) * a;
            if (a > 0) { var ra0 = Math.atan2(b[o0 + q + 2], b[o0 + q + 3]), rda = Math.atan2(b[o1 + q + 2], b[o1 + q + 3]) - ra0; rda = Math.atan2(Math.sin(rda), Math.cos(rda)); ra0 += rda * a; v.fx[i] = Math.sin(ra0); v.fy[i] = Math.cos(ra0); } else { v.fx[i] = b[o0 + q + 2]; v.fy[i] = b[o0 + q + 3]; }      // [v135] bakis da ara degerli
        }
        v.bx = b[o0 + 1] + (b[o1 + 1] - b[o0 + 1]) * a; v.by = b[o0 + 2] + (b[o1 + 2] - b[o0 + 2]) * a; v.bz = b[o0 + 3] + (b[o1 + 3] - b[o0 + 3]) * a; v.owner = a < .5 ? b[o0 + 4] : b[o1 + 4]; crViewF(v, b, o0, o1, a); v.sps = b[o0 + RO + 25] || 0;      // [v139]
        if (a > 0 && b[o0 + 5] !== 1 && b[o1 + 5] === 1 && Math.hypot(b[o1 + 1] - b[o0 + 1], b[o1 + 2] - b[o0 + 2]) > 1.2) { v.bx = b[o1 + 1]; v.by = b[o1 + 2]; v.bz = b[o1 + 3]; }      // [fm] olu top yerlesimi: ara deger yok
        v.rx = b[o0 + RO] + (b[o1 + RO] - b[o0 + RO]) * a; v.ry = b[o0 + RO + 1] + (b[o1 + RO + 1] - b[o0 + RO + 1]) * a; v.rfx = b[o0 + RO + 2]; v.rfy = b[o0 + RO + 3]; arViewF(v, b, o0, o1, a);
        return v;
    }
    function vsMonitor(vs) {
        var R = S.ring, m = vs.m, ev = vs.ev, n1 = vs.n1, lo = Math.max(0, R.n - RING + 3), sim = S.sim;
        if (n1 < lo + 8) return;
        var f1 = n1, f0 = Math.max(lo, n1 - 75), pass = -1, cx = ev.x, cy = ev.y, lines = null, fps = 15;
        if (vs.kind === 'goal' && m.reason === 'ofsayt' && m.tp != null && m.lx != null && m.ox != null) {
            var pf = Math.round(n1 - (ringT(n1) - (m.tp - DT)) / DT);                 // pas anı: ofsayt ölçümü, vuruş adımının başındaki konumlardan yapılır (bir önceki kare)
            if (pf - 30 >= lo && pf <= n1) {
                var dir = sim.teams[ev.team].dir, gx = dir === 1 ? PW : 0, dq = Math.abs(gx - m.ox), d1 = Math.abs(gx - m.lx) - dq, d2 = m.px != null ? Math.abs(gx - m.px) - dq : 99, useBall = d2 < d1;
                pass = pf; f0 = pf - 30; f1 = pf; fps = 12.5;
                lines = { ref: useBall ? m.px : m.lx, ox: m.ox, cm: Math.round(Math.abs(m.margin || 0) * 100), ball: useBall, dir: dir };
                cx = (m.ox * 2 + (m.px != null ? m.px : m.ox)) / 3; cy = (m.oy * 2 + (m.py != null ? m.py : m.oy)) / 3;
            }
        } else if (vs.kind === 'goal') { cx = m.sx != null ? m.sx : ev.x; cy = m.sy != null ? m.sy : ev.y; }
        var ww = 34, wh = ww * .62;
        vs.mon = { f0: f0, f1: f1, pass: pass, fps: fps, lines: lines, win: { wx: Math.max(0, Math.min(PW - ww, cx - ww / 2)), wy: Math.max(0, Math.min(PH - wh, cy - wh / 2)), ww: ww, wh: wh } };
    }
    var PV = newView();
    function drawMonitor() {
        var vs = S.vs, mo = vs && vs.mon; if (!mo) return;
        var ph = vs.phase, a = ph === 'watch' ? Math.min(1, vs.t / .3) : ph === 'tv2' ? Math.max(0, 1 - vs.t / .3) : 0; if (a <= 0) return;
        var q = rraGeom(), pw = Math.round(Math.max(150, Math.min(300, W * .34))), phh = Math.round(pw * .62), x0 = Math.round(q.cx - pw / 2), y0 = Math.round(q.y0 - phh - 12);
        if (S.use3) { x0 = Math.round(W - pw - 16); y0 = Math.round(H - phh - 22); }       // 3B görünümde monitör penceresi sağ altta sabit durur
        var win = mo.win, s = pw / (win.ww * K), t = ph === 'watch' ? vs.t : 99, fa = Math.min(mo.f1, mo.f0 + t * mo.fps), tHold = (mo.f1 - mo.f0) / mo.fps, la = mo.lines ? Math.max(0, Math.min(1, (t - tHold) / .45)) : 0;
        g.save(); g.globalAlpha = a;
        g.fillStyle = 'rgba(2,6,14,.96)'; rr(x0 - 4, y0 - 4, pw + 8, phh + 8, 9); g.fill(); g.strokeStyle = 'rgba(127,209,255,.9)'; g.lineWidth = 1.6; g.stroke();
        g.save(); g.beginPath(); g.rect(x0, y0, pw, phh); g.clip();
        g.setTransform(dpr * s, 0, 0, dpr * s, dpr * (x0 - s * X(win.wx)), dpr * (y0 - s * Y(win.wy))); ZC = s;
        drawPitch();
        ringView(fa, vs.n1, PV);
        drawActors(PV, { live: false, rings: vs.rings, sc: s });
        if (mo.lines && la > 0) {
            var L = mo.lines, ya = Y(win.wy), yb = Y(win.wy + win.wh), lw = 2 / s;
            g.globalAlpha = a * la;
            g.strokeStyle = '#7fd1ff'; g.lineWidth = lw; g.setLineDash([6 / s, 4 / s]); g.beginPath(); g.moveTo(X(L.ref), ya); g.lineTo(X(L.ref), yb); g.stroke(); g.setLineDash([]);
            g.strokeStyle = '#fff'; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(X(L.ox), ya); g.lineTo(X(L.ox), yb); g.stroke();
        }
        g.restore(); ZC = 1;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        // monitör yazıları (ekran koordinatlarında)
        var fs = Math.max(9, Math.min(11, pw / 30));
        g.textBaseline = 'alphabetic'; g.font = '800 ' + fs + 'px sans-serif';
        g.fillStyle = 'rgba(3,8,20,.86)'; g.fillRect(x0, y0, fs * 4.4, fs * 1.9); g.fillStyle = '#ff3b5c'; g.beginPath(); g.arc(x0 + fs * .9, y0 + fs * .95, fs * .32, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText('VAR', x0 + fs * 1.6, y0 + fs * 1.32);
        var sub = mo.pass >= 0 ? (fa >= mo.f1 - .01 ? 'PAS ANI' : '½x') : '½x';
        g.font = '800 ' + fs + 'px sans-serif'; var sw = g.measureText(sub).width + fs * 1.2;
        g.fillStyle = 'rgba(255,201,60,.92)'; g.fillRect(x0 + pw - sw, y0, sw, fs * 1.9); g.fillStyle = '#241a00'; g.textAlign = 'center'; g.fillText(sub, x0 + pw - sw / 2, y0 + fs * 1.32);
        if (mo.lines && la > 0) {
            var L2 = mo.lines, sx1 = x0 + s * (X(L2.ref) - X(win.wx)), sx2 = x0 + s * (X(L2.ox) - X(win.wx)), lab = L2.cm < 1 ? '< 1 cm' : L2.cm + ' cm', right = sx2 >= sx1;
            g.globalAlpha = a * la; g.font = '800 ' + fs + 'px sans-serif';
            var put = function (txt, x, y, alignRight, col) { var w = g.measureText(txt).width, l = alignRight ? x - w : x; l = Math.max(x0 + 3, Math.min(x0 + pw - w - 3, l)); g.fillStyle = col; g.textAlign = 'left'; g.fillText(txt, l, y); };
            var wl = g.measureText(lab).width + fs * 1.1, ty = y0 + phh - fs * 2.2, lx0 = Math.max(x0 + 2, Math.min(x0 + pw - wl - 2, (sx1 + sx2) / 2 - wl / 2));
            g.fillStyle = 'rgba(3,8,20,.9)'; g.fillRect(lx0, ty, wl, fs * 1.8); g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(lab, lx0 + wl / 2, ty + fs * 1.3);
            put(L2.ball ? 'TOP' : 'SAVUNMA', sx1 + (right ? -4 : 4), y0 + fs * 3.5, right, '#7fd1ff');
            put('HÜCUM', sx2 + (right ? 4 : -4), y0 + fs * 3.5, !right, '#fff');
        }
        g.restore();
    }
    function ovrTag(o) { if (o == null) return 'OVR -'; var t = o >= 85 ? 'star' : o >= 75 ? 'gold' : o >= 65 ? 'silver' : 'bronze'; return '<b style="color:var(--tier-' + t + ')">OVR ' + o + '</b>'; }     // [ui24] kadro/ana sayfa ile aynı kademe rengi
    function showSkip(txt) { var b = $('v2d-rp-skip'); if (b) { b.innerHTML = esc(txt) + '<svg class="ico" aria-hidden="true" focusable="false"><use href="#i-arrow-r"/></svg>'; b.style.top = ''; b.hidden = false; } }
    function hideSkip() { var b = $('v2d-rp-skip'); if (b) { b.hidden = true; b.style.top = ''; } }
    /* hakem üzerine gelince: yalnızca gerçek sayılar (isimsiz; motorda hakem adı yok) */
    function refTipHTML() {
        var sim = S.sim, f = sim.teams[0].st.fouls + sim.teams[1].st.fouls, c = S.cards, bits = [f + ' faul', c.y + ' sarı kart', c.r + ' kırmızı kart'];
        if (S.varCount) bits.push(S.varCount + ' VAR incelemesi');
        return '<div class="t-h"><b>Hakem</b><span>Siyah forma</span></div><div class="t-s">' + bits.join(' · ') + '</div>';
    }
    /* =====================================================================
       3B GÖRÜNÜM KÖPRÜSÜ (build/ado3d.js): aynı görünüm karelerinden (V) WebGL2 ile 3B çizer.
       Simülasyona ve kayıtlara dokunmaz. cv3d altta 3B sahneyi çizer; cv2d şeffaf katman olarak üstte kalır (etiketler, VAR şeridi, monitör penceresi,
       tekrar rozeti) ve fare olaylarını alır. Zemin katmanları (kontrol alanı, iz, karar çizgileri, baraj çizgisi, inceleme halkası) eski 2B çizim
       kodundan ekran dışı bir tuvale çizilip sahaya doku olarak serilir; böylece iki görünümde aynı kod ve aynı ölçek kullanılır.
       WebGL2 yoksa ya da bağlam kaybolursa 2B görünüme kendiliğinden dönülür. ===================================================================== */
    function hexRGB(h) { h = String(h || '#fff').replace('#', ''); if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; }); var n = parseInt(h, 16); if (isNaN(n)) n = 0xffffff; return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
    /* 3B görüntü kalitesi: 'auto' -> donanım hızlandırma varsa Yüksek'ten başlar, kare süresi uzun kalırsa kendiliğinden Orta'ya, sonra Düşük'e
       iner (her biri bir kez). Elle seçilen düzey sabittir. Piksel yoğunluğu sınırı: Düşük 1x, Orta 1.5x, Yüksek 2x. */
    var GFX_DPR = { low: 1, mid: 1.5, high: 2 };
    var VQ_UI = 1;                                                              // [vq] Yüksek kalitede küçük (gömülü) 3B panel en az 1.5x çizilir
    function effGfx() { if (S.gfx !== 'auto') return S.gfx; if (!S.gfxAuto) { var hw = false; try { hw = !!(G.Ado3D && Ado3D.hw()); } catch (e) { } S.gfxAuto = hw ? 'high' : 'low'; } return S.gfxAuto; }
    function applyGfx() { if (S.r3 && S.r3.setQuality) { try { S.r3.setQuality(effGfx()); } catch (e) { } } S.r3size = ''; sync3dSize(); }
    function ensure3d() {
        if (S.r3) return !S.r3.lost;
        if (S.r3fail) return false;
        if (S.r3lost && S.r3gl && S.r3gl.isContextLost && S.r3gl.isContextLost()) return false;      // [ui] bağlam hâlâ kayıp: geri gelince (webglcontextrestored) yeniden kurulur
        var c3 = $('cv3d');
        if (c3 && !c3._rst) {                                                  // [ui] bağlam geri geldi: çizici yeniden kurulur, kayıp anında 3B açıksa 3B'ye dönülür
            c3._rst = 1;
            c3.addEventListener('webglcontextrestored', function () {
                if (!S.r3lost) return;
                S.r3lost = false; S.r3gl = null; S.r3size = ''; S.r3key = '';
                if (S.r3back && mode === '2d') { S.r3back = false; S.view = '3d'; applyView(); } else syncViewUI();
            });
        }
        if (!(G.Ado3D && Ado3D.supported()) || !$('cv3d')) { S.r3fail = true; return false; }
        try {
            S.r3 = Ado3D.create($('cv3d'), { PW: PW, PH: PH, C: C, quality: effGfx() });
            try { if (S.r3 && S.r3._bodyReady) S.r3._bodyReady(); } catch (e) { }      // [v133] yakin cekim agi kurulumda biter (canli oyunda karede uretim yok)
            if (!S.r3) { S.r3fail = true; return false; }
            S.r3.onLost = function () {                                          // [ui] bağlam kaybı: 2B'ye geçilir ama 3B "desteklenmiyor" sayılmaz (r3lost, yeniden kurulabilir)
                if (!S.r3lost) S.r3back = S.view === '3d';
                if (S.r3 && S.r3.gl) S.r3gl = S.r3.gl;
                S.r3 = null; S.r3lost = true; S.use3 = false; S.view = '2d'; S.r3size = ''; S.r3key = ''; document.body.classList.remove('ab-3d'); syncViewUI();
            };
        } catch (e) { warn('3B başlatılamadı', e); S.r3 = null; S.r3fail = true; return false; }
        return true;
    }
    function sync3dSize() {
        if (!S.use3 || !S.r3 || !S.szw) return;
        var d3 = S.r3low ? 1 : Math.min(dpr, GFX_DPR[effGfx()] || 1.5);
        if (VQ_UI && !S.r3low && effGfx() === 'high' && Math.min(S.szw, S.szh) < 900) d3 = Math.max(d3, 1.5);   // [vq] gömülü panel: üst-örnekleme (kenar yumuşatma)
        if (S.szw * S.szh * d3 * d3 > 8.3e6) d3 = Math.sqrt(8.3e6 / (S.szw * S.szh));      // [ui] arka tampon toplam piksel sınırı (4K tam ekran)
        var k = S.szw + 'x' + S.szh + '@' + d3; if (S.r3size === k) return; S.r3size = k;
        try { S.r3.setSize(S.szw, S.szh, d3); } catch (e) { warn('3B boyut', e); }
    }
    function applyView() {
        var want = mode === '2d' && S.view === '3d', ok = want && ensure3d(), was = S.use3;
        if (want && !ok) S.view = '2d';
        S.use3 = !!ok && !!S.r3;
        document.body.classList.toggle('ab-3d', S.use3);
        if (S.use3 !== was) { S.r3size = ''; S.r3key = ''; S.r3err = 0; try { syncWatchUI(); } catch (e) { } }      // [fiz] sure ipucu 2B/3B
        syncViewUI();
        if (S.use3 || was) { try { resize(); } catch (e) { } }
    }
    function setView(k) {
        if (k === '2d') S.view = '2d';
        else if (k === 'bcast' || k === 'full' || k === 'loca') { if (!(G.Ado3D && Ado3D.supported()) || S.r3fail) return; S.view = '3d'; S.cam3 = k; if (S.r3) S.r3.resetCam && S.r3.resetCam(); }
        else return;
        savePrefs(); applyView();
    }
    function syncViewUI() {
        document.body.classList.toggle('ab-3d-full', !!S.use3 && S.cam3 === 'full');       // taktik kamerada yakın kamera düğmesi anlamsız
        var sup = !!(G.Ado3D && Ado3D.supported()) && !S.r3fail;
        [['v3-bcast', S.use3 && S.cam3 === 'bcast', 'Yayın kamerası: topu yandan, TV yayını gibi izler'], ['v3-full', S.use3 && S.cam3 === 'full', 'Taktik kamera: tüm sahayı yüksekten, açılı gösterir'], ['v3-2d', !S.use3, 'Kuş bakışı 2B görünüm (klasik saha)']].forEach(function (x) {
            var b = $(x[0]); if (!b) return; b.classList.toggle('on', !!x[1]); b.setAttribute('aria-pressed', x[1] ? 'true' : 'false');
            if (x[0] !== 'v3-2d') { b.disabled = !sup; b.title = !sup ? 'Bu tarayıcı 3B (WebGL2) desteklemiyor: 2B görünüm kullanılıyor' : S.r3lost ? '3B grafik bağlamı kaybedildi: geri gelince 3B görünüme dönülür (tıklayarak yeniden dene)' : x[2]; } else b.title = x[2];
        });
    }
    function renderAny(v, o) {
        if (S.use3 && S.r3 && !S.r3.lost) {
            var ok = false;
            try { ok = renderScene3D(v, o); } catch (e) {
                var tn3 = performance.now(); if (!(tn3 - (S.r3errT || -1e9) < 3000)) { S.r3errT = tn3; S.r3err = 0; }
                if (!S.r3err) { warn('3B çizim', e); try { localStorage.setItem('ado_r3_hata', JSON.stringify({ t: new Date().toISOString(), e: String(e && e.stack || e).slice(0, 1500) })); } catch (e2) { } }
                if (++S.r3err > 90) { S.view = '2d'; S.r3err = 0; S.r3errT = 0; applyView(); try { addTicker('3B görüntüde hata oluştu, 2B görünüme geçildi. 3B düğmesiyle yeniden deneyebilirsiniz.'); } catch (e3) { } }
                return;      /* [r3hata] hatali kare atlanir: son 3B kare kalir */
            }
            if (ok) return;
        }
        renderScene(v, o);
    }
    /* zemine serilen katmanlar: kontrol alanı, iz, karar çizgileri, inceleme halkası, baraj çizgisi */
    function decCalc() {
        var sim = S.sim, o = sim.ball.owner; if (!o || sim.mode !== 'live') return null;
        var opts = sim.passOptions(o, false, 0, true), best = -9, bi = -1; opts.forEach(function (p, i) { if (p.s > best) { best = p.s; bi = i; } });
        var pd = 99, np = null; sim.players.forEach(function (p) { if (p.team !== o.team && !p.off) { var d = Math.hypot(p.x - o.x, p.y - o.y); if (d < pd) { pd = d; np = p; } } });
        return { o: o, opts: opts, bi: bi, pd: pd, np: np, xg: sim.xgRepAt ? sim.xgRepAt(o.x, o.y, o.team, pd) : sim.xgAt(o.x, o.y, sim.teams[o.team].dir, pd) };
    }
    function goodOf(op) { return Math.max(0, Math.min(1, (op.ev + .03) / .10)); }
    function decLines(dd) {
        var o = dd.o;
        dd.opts.forEach(function (op, i) {
            var q = op.q, good = goodOf(op), r = Math.round(255 * (1 - good)), gr = Math.round(200 * good + 30);
            g.strokeStyle = 'rgba(' + r + ',' + gr + ',80,' + (i === dd.bi ? .95 : .55) + ')'; g.lineWidth = i === dd.bi ? 3.5 : 1.8; g.setLineDash(i === dd.bi ? [] : [6, 5]);
            g.beginPath(); g.moveTo(X(o.x), Y(o.y)); g.lineTo(X(q.x), Y(q.y)); g.stroke(); g.setLineDash([]);
        });
        if (dd.np) { g.strokeStyle = 'rgba(255,59,92,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(X(dd.np.x), Y(dd.np.y), Math.max(dd.pd, 1) * K, 0, 7); g.stroke(); }
    }
    function decLabels(dd) {
        var R3 = S.r3, o = dd.o, sim = S.sim;
        dd.opts.forEach(function (op, i) {
            var q = op.q, pt = Math.round(goodOf(op) * 100), a = R3.project(q.x, 2.1, q.y); if (!a) return;
            g.fillStyle = 'rgba(3,8,20,.82)'; g.fillRect(a.x - 15, a.y - 16, 30, 15); g.fillStyle = i === dd.bi ? '#ffc93c' : '#dfe9f5'; g.font = '700 11px sans-serif'; g.textAlign = 'center'; g.fillText(pt, a.x, a.y - 5);
        });
        var b = R3.project(o.x, 1.0, o.y); if (!b) return;
        g.fillStyle = 'rgba(3,8,20,.82)'; g.fillRect(b.x + 16, b.y - 9, 78, 18); g.fillStyle = '#ffc93c'; g.font = '700 11px sans-serif'; g.textAlign = 'left'; g.fillText('şut xG ' + dd.xg.toFixed(2), b.x + 21, b.y + 4);
        drawDecPanel(o, b.x, b.y);
    }
    function groundLayer(v, o, live, dd) {
        var sim = S.sim, tr = live ? (S.ov.trail ? S.trail : null) : null;      // [ui37] tekrarlarda top izi yok
        var wall = live && sim.mode === 'dead' && !S.vs && sim.dead && sim.dead.kind === 'freekick' && sim.dead.wall;
        var vl3 = o.varLines || null, need = (live && (S.ov.ctl || S.vs || dd)) || (tr && tr.length > 1) || wall || vl3;
        RG.trail = null;
        if (need && !((live && (S.ov.ctl || S.vs || dd)) || wall || vl3)) { RG.trail = tr; RG.trailLive = live; RG.trailW = (live ? 2 : 2.6) / K; return false; }   // [opt] yalnız iz (tekrar): 3B'de şerit olarak çizilir - tuval + karede doku yüklemesi yok
        if (!need) return false;
        var gs = Math.min(dpr, 1.5), gw = Math.round(W * gs), gh = Math.round(H * gs);
        if (!S.gc) { S.gc = document.createElement('canvas'); S.gg = S.gc.getContext('2d'); }
        if (S.gc.width !== gw || S.gc.height !== gh) { S.gc.width = gw; S.gc.height = gh; }
        var save = g; g = S.gg; g.setTransform(gs, 0, 0, gs, 0, 0); g.clearRect(0, 0, W, H);
        try {
            if (live && S.ov.ctl) drawCtl();
            drawTrail(tr, live);
            if (dd) decLines(dd);
            if (live) drawIncident();
            if (live) drawWallSpray();
            if (vl3) drawVarLines(vl3);
        } finally { g = save; }
        S.r3.setGround(S.gc, { x0: -M / K, x1: (W - M) / K, z0: -M / K, z1: (H - M) / K });
        return true;
    }
    // R3.setMatch / R3.refreshAppearance için oyuncu listesini (takım/rol/isim + DB2D'den GÜNCEL boy/kilo/ten rengi)
    // üretir. S.sim'i DOĞRUDAN okur - hem ilk maç kurulumunda (renderScene3D, aşağıda) hem kullanıcı Futbolcu
    // Veritabanı'ndan kaydettiğinde (ado2d.refreshAppearance köprüsü, bkz G.ado2d) TEK bir yerden çağrılır, eşleme
    // mantığı iki yerde birbirinden sapmasın diye.
    function buildR3Players() {
        var sim = S.sim; if (!sim || !sim.players) return [];
        return sim.players.map(function (q) {
            // q.db: gerçek playerDatabase kaydı (id/pos/str ile) varsa onu kullan; yoksa (dolgu oyuncu) sim rolünden hafif bir yedek üret
            var apr = DB2D.getAppearance(q.db || { id: null, name: q.name, pos: q.role, str: q.a && q.a.str });
            return { team: q.team, role: q.role, name: q.name, h: apr && apr.h, w: apr && apr.w, sk: apr && apr.sk, skc: apr && apr.skc, hcc: apr && apr.hcc, hs: apr && apr.hs, hc: apr && apr.hc, bd: apr && apr.bd, ft: q.ft || (apr && apr.ft) };
        });
    }
    /* [opt] 3B sahne durum havuzu: halkalar, kamera/duran top/top sürme nesneleri, gol sevinci listesi, izdüşüm çıktısı - karede yeniden kullanılır */
    var RG = { trail: null, trailLive: false, trailW: .3, arr: [], n: 0, v: null, none: [], cel: { ids: [] }, dead: { kind: '', x: 0, y: 0, ax: 0, dir: 1, bx: NaN, by: NaN }, carry: { id: -1, type: 'carry' }, pj: { x: 0, y: 0, w: 0 }, hex: Object.create(null),
        st: { now: 0, v: null, cam: { mode: 'bcast', zoom: 1, replay: false, vs: false, dead: null, style: 'std' }, rings: null, ringN: 0, hasGround: false, tscale: 1, celeb: null, refPose: null, refCard: null, varOn: false, crowdPulse: 0, crowdSide: .5, carry: null, clock: null, ready: null, voff: null, hand: -1, noAct: false } };
    var RG_W = [1, 1, 1], RG_HOT = [1, .79, .24], RG_RED = [.9, .14, .23], RG_YEL = [1, .82, .13], RG_REF = [.79, .95, .24];
    function hexC(h) { var c = RG.hex[h]; if (!c) c = RG.hex[h] = hexRGB(h); return c; }
    function ringPut(x, z, r, col, a) { var q = RG.arr[RG.n]; if (!q) q = RG.arr[RG.n] = { x: 0, z: 0, r: 0, col: null, a: 0 }; q.x = x; q.z = z; q.r = r; q.col = col; q.a = a; RG.n++; }
    function ringAt(id, col, r, a) { var v = RG.v; if (id >= 0 && v.x[id] > -20) { var ac4 = S.r3.actor ? S.r3.actor(id) : null; ringPut(ac4 && ac4.dX != null ? ac4.dX : v.x[id], ac4 && ac4.dZ != null ? ac4.dZ : v.y[id], r, col, a); } }      // [sp] görünen konumda (duran top koşusu, kaleci plonjonu)
    function renderScene3D(v, o) {
        var R3 = S.r3, sim = S.sim, now = (o.live && S.fNow) || performance.now(), live = !!o.live,      // [v133] canli: rAF kare saati (sim ara degeriyle ayni saat, kamera titremez)
            i, j, p, key = S.sid + '|' + S.seed;
        // yavaş cihaz koruması: kare aralığı uzun süre 50 ms'yi aşarsa 3B çözünürlüğü bir kez 1x'e indirilir (görünüm ve simülasyon değişmez)
        // 'Otomatik' kalitede önce kalite düzeyi kademeli düşürülür (Yüksek -> Orta -> Düşük, ortalama kare > 40 ms), en sonda çözünürlük 1x'e iner
        if (S.r3t && !S.r3low) { var dtf = now - S.r3t; if (dtf < 250) { S.r3fs = (S.r3fs || 0) + 1; S.r3fsum = (S.r3fsum || 0) + dtf; if (S.r3fs >= 90) { var avg = S.r3fsum / S.r3fs; if (S.gfx === 'auto' && avg > 19 && effGfx() !== 'low') { S.gfxAuto = effGfx() === 'high' ? 'mid' : 'low'; applyGfx(); syncOptUI(); } else if (avg > 24 && dpr > 1) { S.r3low = true; S.r3size = ''; sync3dSize(); } S.r3fs = 0; S.r3fsum = 0; } } }
        S.r3t = now;
        if (S.r3key !== key) {
            R3.setMatch({ cols: S.cols, players: buildR3Players(), names: S.tnames || [] }); S.r3key = key;
        }
        S.lastV = v; ZC = 1;
        g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
        var dd = (live && S.ov.dec) ? decCalc() : null, has = groundLayer(v, o, live, dd);
        // zemin halkaları (odak, fare, top sahibi, VAR/tekrar vurguları, kart gören oyuncu)
        var rings = RG.arr, foc = live ? (S.focus && now < S.focus.until ? S.focus.ids : RG.none) : RG.none; RG.n = 0; RG.v = v;   // [opt] halka havuzu: kare başına nesne/dizi/kapanış yok
        if (live && v.owner >= 0) ringAt(v.owner, RG_W, .62, .26);      // [ui37] kucuk, soluk
        for (i = 0; i < foc.length; i++) ringAt(foc[i], RG_HOT, 1.35 + .12 * Math.sin(now / 120), .95);
        if (live && S.hover != null && S.hover >= 0 && S.hover < 22) ringAt(S.hover, RG_HOT, 1.3, .95);
        if (o.rings) for (i = 0; i < o.rings.length; i++) ringAt(o.rings[i].id, hexC(o.rings[i].col), 1.4 + .12 * Math.sin(now / 120), .95);
        if (live && G.__abSpot) ringPut(G.__abSpot.x, G.__abSpot.y, .9 + .1 * Math.sin(now / 200), hexC(G.__abSpot.col || '#3fe0ff'), .55);      /* [port] Pro: önerilen konum */
        var rc = S.refCard, cardOn = live && rc && now < rc.until;
        if (cardOn && rc.id >= 0) ringAt(rc.id, rc.kind === 'R' ? RG_RED : RG_YEL, 1.5 + .15 * Math.sin(now / 130), Math.min(1, (rc.until - now) / 300));
        if (live && S.hoverRef && v.rx != null) ringPut(v.rx, v.ry, 1.3, RG_REF, .95);
        // gol kutlaması: golü atan ve yakınındaki takım arkadaşları kollarını kaldırır
        var cel = null;
        if (live && S.hold === 'goal' && !S.goalPend && S.goalInfo && S.goalInfo.scorer >= 0 && !S.goalInfo.own && v.x[S.goalInfo.scorer] > -20 && !(S.goalPulseT0 != null && now - S.goalPulseT0 < 1300)) {      /* [v183] kamera önce topu ağda gösterir (~1,3 sn), sonra golcüye döner (eskiden top çizgiyi geçer geçmez golcüye dönüyordu: file hiç görünmüyordu) */
            var sc = S.goalInfo.scorer, tm = sim.players[sc].team, ids = RG.cel.ids; ids.length = 0; ids.push(sc);
            for (i = 0; i < 22; i++) if (i !== sc && sim.players[i].team === tm && v.x[i] > -20 && Math.hypot(v.x[i] - v.x[sc], v.y[i] - v.y[sc]) < 14) ids.push(i);
            cel = RG.cel;
        }
        // hakem duruşu
        var refPose = null, vs = live ? S.vs : null;
        if (vs) { var ph = vs.phase; refPose = ph === 'alert' ? 'ear' : (ph === 'tv1' || ph === 'tv2') ? 'tv' : ph === 'sign' ? 'point' : null; }
        if (cardOn) refPose = 'card';
        else if (!refPose && live && S.advShow && now < S.advShow.until) refPose = 'adv';      // [v186] avantaj işareti: iki kol öne · [v187] kollar öne süpürür
        if (!refPose && live && V7.on) { var rp7 = v7RefPose(now); if (rp7) refPose = rp7; }      // [v187] düdük + serbest vuruş yönü / korner / aut / penaltı noktası
        var ts = !live && S.rp ? S.rp.rate * (S.preset >= 4 ? 1.5 : S.preset >= 2 ? 1.2 : 1) : (S.vs ? vsScale() : (S.raw ? S.speed : Math.max(.3, S.rateNow || liveSpeed() * S.pace)));      // [fiz] gercek oynatma hizi
        try {      // [v132] tekrar türüne göre GERÇEK oynatma hızı: VAR görüntüsü fps/25 yavaş çekim, önemli an oynatımı kendi hızıyla
            if (!live && !S.rp && S.vs && S.vs.phase === 'watch' && S.vs.mon && S.vs.mon.fps > 0) ts = vsScale() * S.vs.mon.fps / 25;
            else if (!live && !S.rp && !S.vs && fmRp()) ts = liveSpeed() * .9 * Math.max(.75, Math.min(1.5, Math.sqrt(S.lk || 1)));
        } catch (e) { }
        var crowdPulse = 0, crowdSide = .5;
        if (live && S.goalInfo && S.goalPulseT0 != null) {
            var gAge = (now - S.goalPulseT0) / 1000;
            if (gAge >= 0 && gAge < 4.5) { crowdPulse = gAge < .15 ? gAge / .15 : Math.max(0, 1 - (gAge - .15) / 4); crowdSide = v.bx < PW / 2 ? 0 : 1; }
        }
        // duran top kamerası: yalnızca canlı oyunda (tekrarda değil, refTarget()'taki gibi) ve VAR sahnesi
        // yokken - kamera yönetmeni önceliği full/VAR > gol kutlaması (ado3d.js içinde cel0 ile) > bu > yayın
        var dd0 = (live && !vs && S.hold !== 'goal' && !(SQ.ob && S.viewT < SQ.ob.t + 1.3) && sim.mode === 'dead' && sim.dead && (!DL.on || v.dead)) ? sim.dead : null, deadCam = null;      /* [v183] gol beklemesinde başlama vuruşu kamerası yok: motor gol adımında ölü topu (orta nokta) kurar, kamera top ağdayken orta yuvarlağa kaçıyordu */
        if (dd0) { var ddir = sim.teams[dd0.team].dir; deadCam = RG.dead; deadCam.kind = dd0.kind; deadCam.x = dd0.x; deadCam.y = dd0.y; deadCam.ax = ddir === 1 ? PW : 0; deadCam.dir = ddir; if (dd0.kind === 'corner') spCornerSpot(sim, dd0, deadCam); else deadCam.bx = deadCam.by = NaN; }     // [sp] kornerde planlı top noktası
        // top sürme: canlı top sahibinin (kaleci hariç - eldeki top ayaktaki top değildir) sürekli koşu tarzını değiştirir; takeon = rakibi çalımlama girişimi (motor: player.dribble/dribType)
        var carry = null, G3 = S.gk;
        // [gk] kaleci: aksiyon saati, hazır duruş, elde top, görsel ofset (penaltı çizgisi / aut koşusu); VAR'ın donmuş karesinde aksiyon yok
        var gkHand = -1, noAct = !!(live && vs && vs.snap && !vs.reveal);
        var vrp = !live && !S.rp && S.vs && S.vs.phase === 'watch' && S.vs.rpx ? S.vs.rpx : null;      // [v132] VAR görüntüsü: aksiyonlar günlükten yeniden kurulur
        if (G3) { gkFrame(v, live); var fmr = !live && !S.rp ? fmRp() : null; gkHand = live ? (DL.on ? gkHandAt(S.viewT) : G3.hand) : (S.rp ? gkReplay(S.rp, S.viewT) : fmr ? gkReplay(fmr, S.viewT) : vrp ? gkReplay(vrp, S.viewT) : -1); }
        // [v132] tekrarda da (kayıtlı görünen top sürme açıkken) top sürme koşusu ve dokunuş eşlemesi; kalecinin elindeki top hariç
        if (v.owner >= 0 && (live || v.dOn)) { var ownerP = sim.players[v.owner]; if (ownerP && (ownerP.role !== 'GK' || (live ? (G3 && G3.hand !== v.owner) : gkHand !== v.owner))) { carry = RG.carry; carry.id = v.owner; carry.type = (live && ownerP.dribble && ownerP.dribType === 'takeon') ? 'takeon' : 'carry'; } }
        var ST3 = RG.st, CM3 = ST3.cam;                                    // [opt] çizim durumu nesnesi karede yeniden doldurulur
        CM3.mode = live ? S.cam3 : 'bcast'; CM3.zoom = S.cam.z; CM3.replay = !live; CM3.vs = !!vs; CM3.dead = deadCam; CM3.style = S.camStyle;
        ST3.now = now; ST3.v = v; ST3.rings = rings; ST3.ringN = RG.n; ST3.hasGround = has; ST3.tscale = ts; ST3.celeb = cel; ST3.refPose = refPose; ST3.refCard = cardOn ? rc.kind : null; ST3.refCardT = cardOn ? (now - (rc.until - 2600)) / 1000 : -1;
        if (S.r3) {      /* [hakem] ofsayt: bayrakli yan hakeme kisa yayin kesmesi */
            var arc = S.arCut, cutOn = !!(live && arc && !S.vs && !S.rp && now - arc.t0 > 200 && now - arc.t0 < 2600 && S.ar && S.ar[arc.i] && (S.ar[arc.i].fc === 1 || (arc.e && now - arc.e < 450)));      /* bayrak dik kaldikca (sim saati) + .45 sn */
            if (cutOn && arc && S.ar[arc.i].fc !== 1 && !arc.e) arc.e = now; if (arc && S.ar && S.ar[arc.i] && S.ar[arc.i].fc !== 1 && !arc.e && now - arc.t0 > 200) arc.e = now;
            if (cutOn) { var aa = S.ar[arc.i], sgo = aa.ly < 0 ? 1 : -1, alo = aa.x < PW / 2 ? 1 : -1; S.r3.cutCam = { eye: [aa.x + alo * 3.2, 1.55, aa.y + sgo * 5.6], at: [aa.x, 1.3, aa.y], fov: 32 }; }
            else if (S.r3.cutCam) S.r3.cutCam = null;
            if (arc && (now - arc.t0 > 2700 || (arc.e && now - arc.e > 500))) S.arCut = null;
        } if (S.r3 && live && !vs && !S.rp) try { sqCam(v, now); } catch (e) { } if (S.r3 && V7.on) try { v7Cam(v, now, live); } catch (e) { } ST3.varOn = !!vs; ST3.crowdPulse = crowdPulse; ST3.crowdSide = crowdSide; ST3.carry = carry;
        ST3.trail = RG.trail; ST3.trailLive = RG.trailLive; ST3.trailW = RG.trailW;
        ST3.clock = G3 ? (live ? S.viewT + (S.clkOff || 0) : S.viewT + (fmr && fmr.off || 0)) : null; ST3.ready = G3 ? G3.ready : null; ST3.voff = G3 ? G3.voff : null; ST3.hand = gkHand; ST3.noAct = noAct;
        R3._dl = DL.on ? 1 : 0;      // [v135]
        ST3.xa = live && V7.on ? V7.xa : null; ST3.xb = live && V7.on ? V7.xb : null; ST3.v7dlv = live && V7.on && V7.dlv ? 1 : 0; ST3.v7board = live && V7.on && V7.sub && V7.sub.t < 6 ? 1 : 0;      // [v187]
        var ok = R3.render(ST3);
        if (!ok) return false;
        // ekran katmanı: isimler, karar etiketleri, hakem işaretleri
        for (i = 0; i < 22; i++) {
            if (v.x[i] < -20) continue; p = sim.players[i];
            var isF = foc.indexOf(p.id) >= 0, hov = live && S.hover === i, own = v.owner === i, ringCol = null;
            if (o.rings) for (j = 0; j < o.rings.length; j++) if (o.rings[j].id === i) ringCol = o.rings[j].col;
            if (isF || hov || ringCol || own || S.ov.names) { var ac3 = R3.actor ? R3.actor(i) : null, t = R3.projectTo ? R3.projectTo(RG.pj, ac3 && ac3.dX != null ? ac3.dX : v.x[i], 2.05 + (ac3 && ac3.rY ? Math.min(0, ac3.rY) : 0), ac3 && ac3.dZ != null ? ac3.dZ : v.y[i]) : R3.project(ac3 && ac3.dX != null ? ac3.dX : v.x[i], 2.05 + (ac3 && ac3.rY ? Math.min(0, ac3.rY) : 0), ac3 && ac3.dZ != null ? ac3.dZ : v.y[i]); if (t) label3(p.short || p.name, null, t.x, t.y - 25, ringCol || (isF ? '#ffc93c' : '#f2f6fb'), S.cols ? S.cols[p.team] : null); }      // [gk] görünen konum
        }
        if (v.rx != null) {
            var tr = R3.projectTo ? R3.projectTo(RG.pj, v.rx, 2.1, v.ry) : R3.project(v.rx, 2.1, v.ry);
            if (tr) { if (S.ov.names) label('Hakem', tr.x, tr.y - 22, '#c9f23d'); if (vs) refBubble(tr.x, tr.y - 24, vs, now); }
        }
        if (dd) decLabels(dd);
        overlayCommon(o);
        return true;
    }

    /* [var3d] VAR incelemesi 3B görünümde: hakem monitörün başındayken ('watch') ana 3B sahne, olay anının yavaş çekim tekrarını
       (16 sn'lik kare tamponundan - 2B monitörle AYNI zaman çizelgesi) yayın tekrarı gibi tam ekranda gösterir. Ofsayt incelemesinde kamera
       çizgiye dik (taç çizgisinden) bakar, pas anında durur; savunma/top (mavi kesikli) ve hücum (beyaz) çizgileri ZEMİNE çizilir, aradaki
       fark (cm) ekranda yazar. Diğer incelemelerde kamera olay yeri ile topu birlikte izler. Simülasyona ve karara dokunmaz. */
    /* =====================================================================
       [fm] FOOTBALL MANAGER TARZI KRİTİK ANLAR ('fm' izleme biçimi) - FM'in "Key highlights" (Önemli anlar) mantığı:
       - Maç arka planda oynanır; yalnız ÖNEMLİ ANLAR saha görüntüsüyle gösterilir. FM'de "Key" ayarı: goller, net gol fırsatları
         (clear-cut chance), penaltılar, kırmızı kartlar, iptal edilen goller (VAR), direkten dönen toplar + başlama düdükleri.
       - Bir an, olaydan ÖNCEKİ hazırlıktan (topun o takıma geçtiği / duran topun başladığı yer; 4-12 sn) başlar, olayın SONUCU
         görülene dek (top ölene / tehlike geçene dek) sürer ve kesilir: arada ileri sarma GÖSTERİLMEZ (FM'de olduğu gibi kesme geçiş).
       - Anlar arasında saha gizlenir; "maç arası" paneli (FM'in highlight-arası bilgi paneli) maç saatini hızla akıtır, skoru,
         temel istatistikleri ve son spiker satırlarını gösterir. Taktik değişikliği, duraklatma, hız düğmeleri her an çalışır.
       Uygulama: olay anında simülasyon durdurulur (olay ve aynı adımdaki sonrakiler ertelenir), hazırlık 16 sn'lik kare tamponundan
       1x tempoda oynatılır; olay karesine gelince ertelenen olaylar işlenir (gol sevinci/tekrarı, kart, VAR olağan akışla) ve oyun
       canlı devam eder. Böylece skor ve spiker, görüntü olaya ulaşmadan ÖNCE asla değişmez. Simülasyona dokunmaz.
       ===================================================================== */
    var FM_GAPMAX = 40, FM_GAP = 8, FM_TAIL = 4, FM_MIN_PRE = 4, FM_MAX_PRE = 12, FMV = newView();
    function fmOn() { return S.watch === 'fm' && S.fm && S.fm.sid === S.sid; }
    function fmRp() { var F = S.fm; return S.watch === 'fm' && F && F.sid === S.sid && F.ph === 'clip' && F.rp ? F.rp : null; }      // [fm] oynatimin tekrar baglami (aksiyon yeniden kurulumu)
    function fmInit(sim) { S.fm = { sid: S.sid, ph: 'tail', until: sim.t + 6, half: sim.half, pend: [], lines: [], acc: 0, n: 0, f0: 0, f1: 0, fc: 0, t: 0, ev: null, kind: '' }; return S.fm; }
    function fmTrigger(ev) {
        var m = ev.meta || {};
        switch (ev.type) {
            case 'GOAL': case 'VAR': case 'POST': return ev.type;
            case 'SHOT': var avh = S.sim && S.sim.av && S.sim.av.XG; return m.tag === 'PEN' ? 'PEN' : ((m.xg || 0) >= (avh ? .15 : .10) || (m.on && (m.xg || 0) >= (avh ? .07 : .05))) ? 'CCC' : '';      // net gol fırsatı (FM: clear-cut chance) · [v186] gerçek xG ile eşik .15 (StatsBomb: penaltı dışı şutların %20'si; maç başına ~8–12 an)
            case 'CORNER': return S.sim && S.sim.av && S.sim.av.HL ? 'COR' : '';      // [v186] önemli an: korner (duran top ayarı)
            case 'FOUL': if (m.pen) return 'PENF'; if (m.adv) return ''; if (S.sim && S.sim.av && S.sim.av.HL && ev.team >= 0) { var gxF = S.sim.atkGoalX(1 - ev.team); if (Math.hypot(gxF - ev.x, 34 - ev.y) < 28) return 'FKD'; } return '';      // [v186] kaleye 28 m'den yakın serbest vuruş
            case 'CARD': return m.card === 'R' ? 'RED' : '';
        }
        return '';
    }
    var FM_LBL = { GOAL: 'GOL', VAR: 'VAR', POST: 'DİREK', PEN: 'PENALTI', PENF: 'PENALTI', CCC: 'GOL FIRSATI', RED: 'KIRMIZI KART', KO: 'BAŞLAMA', COR: 'KORNER', FKD: 'SERBEST VURUŞ' };
    function fmStartClip(F, ev, kind) {
        var R = S.ring, f1 = R.n - 1, lo = Math.max(0, R.n - RING + 3), T = ev.team, pl = S.sim.players, b = R.buf, i, run = 0, st = -1;
        while (f1 > lo + 2) { var oq = (f1 % RING) * FS, op = ((f1 - 1) % RING) * FS; if ((b[oq + 5] === 1 && b[op + 5] !== 1) || Math.hypot(b[oq + 1] - b[op + 1], b[oq + 2] - b[op + 2]) > 3) f1--; else break; }      // [fm] olay adiminda olu topa konan top oynatima alinmaz
        if (f1 - lo < FM_MIN_PRE * 25) return false;
        for (i = f1; i >= lo && f1 - i < FM_MAX_PRE * 25; i--) {
            var o = (i % RING) * FS, ow = b[o + 4];
            if (b[o + 5] === 1) { st = i - 12; break; }                                      // duran top: başlangıcından az önce
            if (ow >= 0 && pl[ow] && pl[ow].team !== T) { if (++run >= 6) { st = i + 6 - 12; break; } } else run = 0;   // top rakipteydi: hücum o andan başlar
        }
        if (st < 0) st = f1 - FM_MAX_PRE * 25;
        st = Math.max(lo, Math.min(st, f1 - FM_MIN_PRE * 25));
        F.ph = 'clip'; F.sc = F.sc0 || null; F.f0 = F.fc = st; F.f1 = f1; F.t = 0; F.ev = ev; F.kind = kind; F.n++; F.acc = 0; F.cam = null;
        F.rp = { gk: null, rate: 1, off: S.clkOff || 0 }; F.cut = 1;      // [fm] aksiyonlar gol tekrarindaki gibi gunlukten yeniden kurulur (gkReplay); ilk karede kurgu kesmesi
        return true;
    }
    /* handle() başında: 'gap' sırasında önemli an olayı gelirse an başlatılır ve olay ertelenir; an oynarken gelenler de ertelenir */
    function fmIntercept(ev) {
        if (!fmOn()) return false;
        var F = S.fm;
        if (F.ph === 'clip') { F.pend.push(ev); return true; }
        if (F.ph === 'gap') { var k = fmTrigger(ev); if (k && fmStartClip(F, ev, k)) { F.pend.push(ev); return true; } }
        return false;
    }
    /* kare başına: true -> bu kare ana döngü yerine burada işlendi (arada hızlı akış ya da an oynatımı) */
    function fmTick(dt, sim) {
        var F = S.fm && S.fm.sid === S.sid ? S.fm : fmInit(sim), now = performance.now();
        if (sim.half !== F.half) { F.half = sim.half; F.ph = 'tail'; F.until = sim.t + 6; F.kind = 'KO'; }      // ikinci yarı başlama vuruşu (FM: başlama düdükleri gösterilir)
        if (F.ph === 'tail') {
            if (sim.t > Math.max(F.until, S.keyUntil) && !sim.shot && paceKey(sim) >= 2) { F.ph = 'gap'; F.acc = 0; }
            else return false;
        }
        if (F.ph === 'gap') {
            var rate = Math.min(FM_GAPMAX, S.speed * FM_GAP * (S.lk || 1)) * (V7W.lvl === 'yaz' ? .32 : 1), n = 0, tEnd = now + 7;      // [perf] tavan: kare başına adım sayısı sınırlı (60 fps korunur, oyuncular sıçramaz)
            F.acc += dt * rate;
            while (F.acc >= DT && F.ph === 'gap' && !S.hold && !sim.finished && !S.halfPending) { F.sc0 = [sim.teams[0].score, sim.teams[1].score]; stepOnce(); F.acc -= DT; n++; if ((n & 7) === 0 && performance.now() > tEnd) { F.acc = 0; break; } }
            if (F.ph !== 'gap') F.acc = 0;
            S.acc = 0; return true;
        }
        if (F.ph === 'clip') {
            F.t += dt; F.fc += dt * 25 * liveSpeed() * .9 * Math.max(.75, Math.min(1.5, Math.sqrt(S.lk || 1)));
            if (F.fc >= F.f1) {                                                                 // olay karesi: ertelenen olaylar işlenir, oyun canlı devam eder
                F.fc = F.f1; F.ph = 'tail'; F.until = sim.t + (F.kind === 'COR' || F.kind === 'FKD' ? 13 : FM_TAIL);      // [v186] duran topta vuruş ve sonucu da canlı gösterilir
                var pe = F.pend; F.pend = []; F.rp = null;      // [fm] oynatim olay karesinde biter: yeniden kurulan aksiyon durumu canliyla ayni ana gelir, canliya devredilir
                S.last = performance.now(); S.acc = 0; S.pace = .9;
                for (var i = 0; i < pe.length; i++) { try { handle(pe[i]); } catch (e) { warn('olay ' + pe[i].type, e); } }
            }
            return true;
        }
        return false;
    }
    function fmLine(text, l) {
        if (!S.fm || S.fm.sid !== S.sid) return; var L = S.fm.lines, s = String(text || '').replace(/<\/?[^>]+(>|$)/g, '');
        L.push({ t: S.sim ? S.sim.t : 0, s: s }); if (L.length > 14) L.shift();
        if (s) spkPush(S.fm, { s: s, p: l && l.prio != null ? l.prio : 3, tm: l && l.team != null ? l.team : -1, heat: spkHeat(l ? l.type : '', s), t: S.sim ? S.sim.t : 0, rt: performance.now() });      // [spk] maç arası spiker bandı
    }
    function drawFm(dt) {
        var F = S.fm;
        if (F.ph === 'clip') return drawFmClip(dt, F);
        drawFmGap(F, dt);
    }
    function drawFmClip(dt, F) {
        if (!g || !W) resize(); if (!g || !W) return; fmGapCls(false);
        var v = ringView(F.fc, F.f1, FMV);
        var fo = F.rp && F.rp.off || 0; if (fo) { v.dtl += fo; v.dtp += fo; if (v.dtn > 0) v.dtn += fo; }      // [v132] dokunuş anları aksiyon saatiyle aynı payla (canlıdaki gibi +clkOff)
        var fi0 = Math.min(Math.floor(F.fc), F.f1), ffa = fi0 < F.f1 ? F.fc - fi0 : 0, ft0 = ringT(fi0);
        S.viewT = ffa > 0 ? ft0 + (ringT(fi0 + 1) - ft0) * ffa : ft0;      // [fm] aksiyon saati kareler arasinda da akar (konumlarla ayni ara deger)
        if (F.cut) { F.cut = 0; r3Cut(); }      // [v132] kurgu kesmesi: top + aktörler + kamera
        camStep(dt || .016, v, S.zoom ? (W < 520 ? 2.1 : 1.75) : 1.35);
        renderAny(v, { live: false, rings: null });
        g.setTransform(dpr, 0, 0, dpr, 0, 0); ZC = 1;
        var mg = W < 560 ? 8 : 12, y0 = mg + (S.tabB || 0), t1 = 'ÖNEMLİ AN', t2 = (FM_LBL[F.kind] || '') + ' · ' + minOf(F.ev ? F.ev.t : S.viewT) + '\'';
        var ck = fmt(S.viewT); if (ck !== F.ck) { F.ck = ck; setTxt($('match-time'), ck); if (S.bhud) setTxt($('ab-hud-clock'), ck); }      // saat görüntüyle birlikte akar
        g.font = '800 13px ' + fd(); var w1 = g.measureText(t1).width; g.font = '700 12px ' + fd(); var w2 = g.measureText(t2).width, bw = Math.max(w1, w2) + 30, bx = W - bw - mg;
        g.fillStyle = 'rgba(6,10,20,.88)'; g.fillRect(bx, y0, bw, 40); g.fillStyle = '#c9f23d'; g.fillRect(bx, y0, 3, 40);
        g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = '#fff'; g.font = '800 13px ' + fd(); g.fillText(t1, bx + 14, y0 + 17); g.fillStyle = '#c9f23d'; g.font = '700 12px ' + fd(); g.fillText(t2, bx + 14, y0 + 33);
        if (F.t < .3) { g.fillStyle = 'rgba(3,8,20,' + (1 - F.t / .3) + ')'; g.fillRect(0, 0, W, H); }           // kesme geçiş (kısa kararma)
    }
    /* [fm2] FM tarzı "maç arası" ekranı: önemli anlar arasında (oyun arka planda 8x akarken) FM'in maç ekranı düzeni -
       üstte saat/skor, ortada hızlı akan 2B saha, altında baskımetre (dakika dakika baskı grafiği + son 5 dk baskı oranı),
       solda önemli anlar listesi, sağda maç istatistikleri, altta spiker anlatımı. Tümü tuval üzerine çizilir (DOM'a dokunmaz). */
    function momStep(sim) {
        var M = S.mom; if (!M || M.sid !== S.sid) M = S.mom = { sid: S.sid, a: new Float32Array(130), b: new Float32Array(130) };
        if (sim.mode === 'dead') return;
        var B = sim.ball, tm = B.owner ? B.owner.team : (sim.pass && sim.pass.active ? sim.pass.team : -1); if (tm < 0) return;
        var adv = (B.x - PW / 2) * sim.teams[tm].dir / (PW / 2), w = Math.max(0, adv + .25); w = w * w * DT; if (adv > .55) w *= 2;
        var mi = Math.min(129, Math.floor(sim.t * CK / 60)); (tm ? M.b : M.a)[mi] += w;
    }
    function fmLog(ev) {
        var sim = S.sim; if (!sim) return;
        var M = S.mom; if (!M || M.sid !== S.sid) { momStep(sim); M = S.mom; }
        var m = ev.meta || {}, mi = Math.min(129, Math.floor(ev.t * CK / 60)), xg = m.xg || 0;
        if (ev.type === 'SHOT' && ev.team >= 0) (ev.team ? M.b : M.a)[mi] += .4 + xg * 4;
        var KL = S.kl && S.kl.sid === S.sid ? S.kl : (S.kl = { sid: S.sid, a: [] }), txt = null, ic = '';
        if (ev.type === 'SAVE' && xg >= .15) { ic = '🧤'; txt = 'Kurtarış: ' + nameOf(ev.p2) + ' fırsatı'; }
        else if (ev.type === 'POST') { ic = '▮'; txt = 'Direk: ' + nameOf(ev.p); }
        else if ((ev.type === 'OFF' || ev.type === 'BLOCK') && xg >= .22) { ic = '◎'; txt = 'Kaçan fırsat: ' + nameOf(ev.type === 'BLOCK' ? ev.p2 : ev.p); }
        if (txt) KL.a.push({ m: minOf(ev.t), s: ev.type === 'SAVE' || ev.type === 'BLOCK' ? 1 - ev.team : ev.team, ic: ic, txt: txt, k: 'ch' });
    }
    function fmKey(km, text, type) {
        if (!S.sim) return;
        var KL = S.kl && S.kl.sid === S.sid ? S.kl : (S.kl = { sid: S.sid, a: [] });
        var t = String(text || '').replace(/<\/?[^>]+(>|$)/g, ''), ic = '';
        var mm = t.match(/^(\S+)\s+(.*)$/); if (mm && !/[A-Za-zÇĞİÖŞÜçğıöşü0-9]/.test(mm[1])) { ic = mm[1]; t = mm[2]; }
        KL.a.push({ m: km.b, s: km.s, ic: ic || '•', txt: t, k: type || '' });
    }
    function fmFit(t, w) { if (g.measureText(t).width <= w) return t; while (t.length > 3 && g.measureText(t + '…').width > w) t = t.slice(0, -1); return t + '…'; }
    function fmPanel(x, y, w, h, title, col) {
        g.fillStyle = 'rgba(13,21,37,.94)'; rr(x, y, w, h, 10); g.fill(); g.strokeStyle = 'rgba(127,209,255,.14)'; g.lineWidth = 1; g.stroke();
        if (title) { g.fillStyle = col || '#7fd1ff'; g.font = '800 11px ' + fd(); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(title, x + 12, y + 18); }
    }
    function fmPitch(x0, y0, pw, ph, v) {
        var k = Math.min(pw / PW, ph / PH), w = PW * k, h = PH * k, ox = x0 + (pw - w) / 2, oy = y0 + (ph - h) / 2, i;
        var px = function (x) { return ox + x * k; }, py = function (y) { return oy + y * k; };
        for (i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#1d5c34' : '#21673a'; g.fillRect(ox + w * i / 10, oy, w / 10 + .5, h); }
        g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.2; g.strokeRect(ox, oy, w, h);
        g.beginPath(); g.moveTo(px(PW / 2), oy); g.lineTo(px(PW / 2), oy + h); g.stroke();
        g.beginPath(); g.arc(px(PW / 2), py(PH / 2), 9.15 * k, 0, 7); g.stroke();
        [0, 1].forEach(function (s) { var x = s ? PW - 16.5 : 0; g.strokeRect(px(x), py(PH / 2 - 20.16), 16.5 * k, 40.32 * k); var x2 = s ? PW - 5.5 : 0; g.strokeRect(px(x2), py(PH / 2 - 9.16), 5.5 * k, 18.32 * k); g.fillStyle = 'rgba(255,255,255,.8)'; g.fillRect(s ? px(PW) : px(0) - 3, py(PH / 2 - 3.66), 3, 7.32 * k); });
        var sim = S.sim, r = Math.max(3, 1.05 * k), own = v.owner;
        for (i = 0; i < 22; i++) {
            if (v.x[i] < -20) continue; var p = sim.players[i], c = S.cols ? S.cols[p.team] : '#888';
            g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.arc(px(v.x[i]) + 1, py(v.y[i]) + 1.5, r, 0, 7); g.fill();
            g.fillStyle = p.role === 'GK' ? '#f2c94c' : c; g.beginPath(); g.arc(px(v.x[i]), py(v.y[i]), r, 0, 7); g.fill();
            g.strokeStyle = own === i ? '#fff' : 'rgba(255,255,255,.6)'; g.lineWidth = own === i ? 2 : 1; g.stroke();
        }
        var bz = Math.max(0, v.bz || 0) * k * .6;
        g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(px(v.bx), py(v.by) - bz, r * 1.6, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(px(v.bx), py(v.by) - bz, Math.max(2.2, r * .55), 0, 7); g.fill(); g.strokeStyle = '#111'; g.lineWidth = 1; g.stroke();
        return { x: ox, y: oy, w: w, h: h };
    }
    function fmMomentum(x, y, w, h) {
        var M = S.mom, sim = S.sim, cols = S.cols || ['#c8102e', '#1e5aa8'];
        fmPanel(x, y, w, h, 'BASKIMETRE');
        var cur = Math.min(129, Math.floor(sim.t * CK / 60)), N = Math.max(90, cur + 1), gx = x + 12, gw = w - 24, gy = y + 26, gh = h - 34, mid = gy + gh / 2, i;
        var pa = 0, pb = 0; if (M && M.sid === S.sid) for (i = Math.max(0, cur - 4); i <= cur; i++) { pa += M.a[i]; pb += M.b[i]; }
        var tot = pa + pb, ra = tot > .05 ? pa / tot : .5, bw0 = Math.min(150, w * .32), bx0 = x + w - 12 - bw0;
        g.fillStyle = cols[0]; g.fillRect(bx0, y + 9, bw0 * ra, 9); g.fillStyle = cols[1]; g.fillRect(bx0 + bw0 * ra, y + 9, bw0 * (1 - ra), 9);
        g.font = '700 10px ' + fd(); g.fillStyle = '#dfe9f5'; g.textAlign = 'right'; g.fillText(Math.round(ra * 100) + '% · son 5 dk · ' + Math.round((1 - ra) * 100) + '%', bx0 - 8, y + 18);
        g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1; g.beginPath(); g.moveTo(gx, mid); g.lineTo(gx + gw, mid); g.stroke();
        var hx = gx + gw * 45 / N; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(hx, gy); g.lineTo(hx, gy + gh); g.stroke(); g.setLineDash([]);
        if (!M || M.sid !== S.sid) return;
        var vals = [], mx = .35;
        for (i = 0; i <= cur; i++) { var s = 0, ws = 0; for (var j = -1; j <= 1; j++) { var q = i + j; if (q < 0 || q > cur) continue; var wj = j ? .5 : 1; s += (M.a[q] - M.b[q]) * wj; ws += wj; } s /= ws; vals.push(s); if (Math.abs(s) > mx) mx = Math.abs(s); }
        var bw = gw / N;
        for (i = 0; i < vals.length; i++) { var vv = vals[i] / mx, bh = Math.abs(vv) * (gh / 2 - 2); g.globalAlpha = i === cur ? (.6 + .4 * Math.sin(performance.now() / 200)) : .9; g.fillStyle = vv >= 0 ? cols[0] : cols[1]; g.fillRect(gx + i * bw + .5, vv >= 0 ? mid - bh : mid, Math.max(1, bw - 1), bh); }
        g.globalAlpha = 1;
        var kl = S.kl && S.kl.sid === S.sid ? S.kl.a : [];       // goller grafikte işaret
        kl.forEach(function (e) { if (e.k !== 'goal') return; var xx = gx + (Math.min(e.m, N) - .5) * bw; g.fillStyle = '#fff'; g.beginPath(); g.arc(xx, e.s ? gy + gh - 4 : gy + 4, 3.2, 0, 7); g.fill(); });
        g.fillStyle = '#6f84a0'; g.font = '600 9px ' + fd(); g.textAlign = 'left'; g.fillText("0'", gx, gy + gh + 6); g.textAlign = 'center'; g.fillText("45'", hx, gy + gh + 6); g.textAlign = 'right'; g.fillText(N + "'", gx + gw, gy + gh + 6);
    }
    function fmStats(x, y, w, h) {
        var sim = S.sim, a = sim.teams[0].st, b = sim.teams[1].st, pp = sim.possPct ? sim.possPct() : [50, 50], cols = S.cols || ['#c8102e', '#1e5aa8'];
        fmPanel(x, y, w, h, 'İSTATİSTİKLER');
        var pa = function (s) { return s.passes ? Math.round(100 * (s.passOk || 0) / s.passes) : 0; };
        var rows = [['Topa sahip olma', pp[0], 100 - pp[0], '%'], ['Gol beklentisi (xG)', +(a.xg || 0).toFixed(2), +(b.xg || 0).toFixed(2), ''], ['Şut', a.shots || 0, b.shots || 0, ''], ['İsabetli şut', a.sot || 0, b.sot || 0, ''],
            ['Pas isabeti', pa(a), pa(b), '%'], ['Korner', a.corners || 0, b.corners || 0, ''], ['Faul', a.fouls || 0, b.fouls || 0, ''], ['Ofsayt', a.offsides || 0, b.offsides || 0, ''], ['Sarı / kırmızı', (a.yellow || 0) + ' / ' + (a.red || 0), (b.yellow || 0) + ' / ' + (b.red || 0), 'x']];
        if (h > 470) rows.splice(8, 0, ['Kurtarış', a.saves || 0, b.saves || 0, ''], ['Top kapma', a.tackles || 0, b.tackles || 0, ''], ['Pas arası', a.inter || 0, b.inter || 0, '']);      // [spk] tam boy panel
        if (w < 230) { var SH = { 'Topa sahip olma': 'Topa sahiplik', 'Gol beklentisi (xG)': 'xG', 'İsabetli şut': 'İsabetli', 'Pas isabeti': 'Pas %', 'Sarı / kırmızı': 'Kart' }; rows.forEach(function (r) { if (SH[r[0]]) r[0] = SH[r[0]]; }); }
        var nr = Math.max(1, Math.min(rows.length, Math.floor((h - 30) / 19))); rows = rows.slice(0, nr);
        var rh = Math.min(46, (h - 34) / rows.length), yy = y + 32, i, fL = Math.round(Math.max(10, Math.min(12.5, rh * .27))), fV = Math.round(Math.max(12, Math.min(17, rh * .37))), bt = rh >= 34 ? 6 : 4;      // [spk] satır boyu panelle büyür
        for (i = 0; i < rows.length; i++) {
            var r = rows[i], ty = yy + i * rh, by = ty + Math.max(15, rh * .5);
            g.font = '600 ' + fL + 'px ' + fd(); g.fillStyle = '#8fa3bd'; g.textAlign = 'center'; g.fillText(r[0], x + w / 2, by - fV * .35 - 2);
            g.font = '800 ' + fV + 'px ' + fd(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.fillText(String(r[1]) + (r[3] === '%' ? '%' : ''), x + 12, by - 3); g.textAlign = 'right'; g.fillText(String(r[2]) + (r[3] === '%' ? '%' : ''), x + w - 12, by - 3);
            if (r[3] !== 'x' && rh >= 20) { var va = +r[1], vb = +r[2], tt = va + vb, fa = tt > 0 ? va / tt : .5, bx = x + 12, bw = w - 24; g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(bx, by, bw, bt); g.fillStyle = cols[0]; g.fillRect(bx, by, bw * fa - 1, bt); g.fillStyle = cols[1]; g.fillRect(bx + bw * fa + 1, by, bw * (1 - fa) - 1, bt); }
        }
    }
    function fmKeys(x, y, w, h) {
        fmPanel(x, y, w, h, 'ÖNEMLİ ANLAR');
        var kl0 = S.kl && S.kl.sid === S.sid ? S.kl.a : [], cols = S.cols || ['#c8102e', '#1e5aa8'], lh = 22, maxN = Math.max(1, Math.floor((h - 30) / lh)), i;
        var kl = kl0.slice(), drop = kl.length - maxN;                       // sığmazsa önce eski fırsatlar, sonra en eski anlar düşer (goller/kartlar kalır)
        for (i = 0; i < kl.length && drop > 0; i++) if (kl[i].k === 'ch') { kl.splice(i, 1); i--; drop--; }
        var st = Math.max(0, kl.length - maxN);
        if (!kl.length) { g.fillStyle = '#6f84a0'; g.font = '500 11px ' + fd(); g.textAlign = 'left'; g.fillText('Henüz önemli an yok', x + 12, y + 40); return; }
        for (i = st; i < kl.length; i++) {
            var e = kl[i], ty = y + 30 + (i - st) * lh, nw = i === kl.length - 1;
            if (nw) { g.fillStyle = 'rgba(201,242,61,.08)'; g.fillRect(x + 6, ty - 2, w - 12, lh - 2); }
            g.fillStyle = cols[e.s] || '#888'; g.fillRect(x + 8, ty, 3, lh - 6);
            g.font = '800 11px ' + fd(); g.fillStyle = '#c9f23d'; g.textAlign = 'left'; g.fillText(e.m + "'", x + 16, ty + 12);
            g.font = '13px sans-serif'; g.fillText(e.ic, x + 44, ty + 13);
            g.font = (e.k === 'goal' ? '800 ' : '600 ') + '11px ' + fd(); g.fillStyle = e.k === 'ch' ? '#b9c6d8' : '#fff'; g.fillText(fmFit(e.txt, w - 76), x + 64, ty + 12);
        }
    }
    function fmComm(x, y, w, h, F) {
        fmPanel(x, y, w, h, 'SPİKER');
        var L = F.lines, lh = 17, n = Math.max(1, Math.floor((h - 26) / lh)), st = Math.max(0, L.length - n), i;
        g.textAlign = 'left';
        for (i = st; i < L.length; i++) {
            var k = i - st, last = i === L.length - 1, ty = y + 36 + k * lh;
            g.font = '800 10px ' + fd(); g.fillStyle = '#c9f23d'; g.fillText(minOf(L[i].t) + "'", x + 12, ty);
            g.font = (last ? '600 ' : '500 ') + '12px ' + fd(); g.fillStyle = last ? '#fff' : 'rgba(223,233,245,' + (.45 + .5 * (k + 1) / n) + ')'; g.fillText(fmFit(L[i].s, w - 60), x + 44, ty);
        }
    }
    /* [spk] FM maç arası CANLI SPİKER bandı: tek cümle (eski cümle ekranda kalmaz); her cümle okunur süre kadar (1,7-4,8 sn, golde uzun) kalır,
       önemli an (gol, kurtarış, direk, kart, VAR, net fırsat) sırayı keser, bayat satır düşer. Kaynak: spiker akışı (Comm2D) + akıllı anlatım
       (spkSmart: maç arasında hızlı akan oyunu mini sahayla eş zamanlı izler - hücum gelişimi, kontra, ceza sahası, baskı, dakika/skor bağlamı). */
    var FB = null, SPK_MIN = [10, 20, 30, 40, 50, 60, 70, 75, 80, 85, 88];
    function fbo() { if (!FB) { try { FB = (getComputedStyle(document.documentElement).getPropertyValue('--font-body') || '').trim(); } catch (e) { } if (!FB) FB = 'system-ui, sans-serif'; } return FB; }
    function spkHeat(ty, s) {
        if (ty === 'GOAL' || /^GOO+L/.test(s)) return 3;
        if (ty === 'VAR' || ty === 'VARCHK' || ty === 'POST' || (ty === 'CARD' && /KIRMIZI|İKİNCİ SARI/.test(s)) || (ty === 'FOUL' && /PENALTI/.test(s)) || /^Penaltı noktasında/.test(s) || /^(Müthiş|İnanılmaz|Ne kurtarış|Büyük fırsat|Kaçtı|Bu nasıl|Tehlike|Hızlı hücum|Kontra)/.test(s)) return 2;
        if (ty === 'SHOT' || ty === 'SAVE' || ty === 'CORNER' || ty === 'OFF' || ty === 'CARD' || ty === 'FOUL' || ty === 'BLOCK' || ty === 'OFFSIDE' || ty === 'HALFTIME' || ty === 'FULLTIME') return 1;
        return 0;
    }
    function spkSplit(s) {      // cümlelere böl (cümle cümle gösterim); çok kısa parçalar (ünlem, ad, skor) yanındakiyle birleşir
        var P = s.replace(/([.!?…])\s+/g, function (m0, c, off) { return c === '.' && /\d/.test(s.charAt(off - 1)) ? m0 : c + '\u0001'; }).split('\u0001'), U = [], cur = '', i;
        for (i = 0; i < P.length; i++) {
            if (!cur && P[i].length < 22 && U.length && U[U.length - 1].length + P[i].length < 64 && !/^(GOO+L|DİREK|KIRMIZI|İKİNCİ|HAT)/.test(P[i])) { U[U.length - 1] += ' ' + P[i]; continue; }
            cur = cur ? cur + ' ' + P[i] : P[i]; if (cur.length >= 22) { U.push(cur); cur = ''; }
        }
        if (cur) { if (U.length && cur.length < 14) U[U.length - 1] += ' ' + cur; else U.push(cur); }
        return U.length ? U : [s];
    }
    function spkPush(F, it) { it.u = spkSplit(it.s); var Q = F.bq || (F.bq = []); Q.push(it); if (Q.length > 10) Q.splice(0, Q.length - 10); }
    function spkCls(p) { return p >= 8 ? 2 : p >= 5 ? 1 : 0; }
    function spkDur(s, heat, fast) { var d = Math.max(1700, Math.min(4800, 900 + s.length * 40)) * (heat >= 3 ? 1.4 : 1); return fast ? Math.min(d, 2300) : d; }
    function spkBestI(Q) { var bi = 0, i; for (i = 1; i < Q.length; i++) { var ca = spkCls(Q[i].p), cb = spkCls(Q[bi].p); if (ca > cb || (ca === cb && Q[i].rt >= Q[bi].rt)) bi = i; } return bi; }
    function spkTick(F, now) {
        var Q = F.bq || (F.bq = []), cur = F.bc, i;
        for (i = Q.length - 1; i >= 0; i--) { var age = now - Q[i].rt, lim = Q[i].fast ? 1800 : Q[i].p >= 8 ? 8000 : Q[i].p >= 5 ? 4500 : 2800; if (age > lim) Q.splice(i, 1); }
        var shown = cur ? now - F.bt : 1e9, done = !cur || shown >= spkDur(cur.u[F.bu] || '', cur.heat, cur.fast), hot = Q.length && spkCls(Q[spkBestI(Q)].p) === 2;
        if (cur && done && F.bu < cur.u.length - 1 && !(hot && spkCls(cur.p) < 2)) { F.bu++; F.bt = now; return; }      // aynı satırın sonraki cümlesi
        if (!Q.length) return;
        var bi = spkBestI(Q), best = Q[bi], pre = cur && spkCls(best.p) === 2 && spkCls(cur.p) < 2 && shown > 450;
        if (done || pre) {
            var bc = spkCls(best.p);
            for (i = Q.length - 1; i >= 0; i--) if (i === bi || (spkCls(Q[i].p) <= bc && Q[i].rt <= best.rt)) Q.splice(i, 1);      // seçilenden eski ve önemsiz satırlar artık bayat
            F.bc = best; F.bu = 0; F.bt = now;
        }
    }
    function spkNm(p) { return p ? (p.short || p.name || '') : ''; }
    function spkSay(F, s, p, heat, tm, fast) { spkPush(F, { s: s, p: p, tm: tm == null ? -1 : tm, heat: heat, fast: fast ? 1 : 0, t: S.sim ? S.sim.t : 0, rt: performance.now() }); }
    function spkPick(F, key, arr) { var M = F.sk.mem, i, last = M[key]; do { i = Math.floor(Math.random() * arr.length); } while (arr.length > 1 && i === last); M[key] = i; return arr[i]; }
    function spkWing(sim, tm, y) { var d = sim.teams[tm].dir; return (d === 1 ? y < PH / 3 : y > 2 * PH / 3) ? 'sol' : (d === 1 ? y > 2 * PH / 3 : y < PH / 3) ? 'sağ' : ''; }
    function spkIntro(F, sim) {
        var T = sim.teams, o = sim.ball && sim.ball.owner, sx = Comm2D.sfx, now = performance.now(), mi = minOf(sim.t), sc = T[0].score + '-' + T[1].score;
        var lead = T[0].score > T[1].score ? 0 : T[1].score > T[0].score ? 1 : -1, pp = sim.possPct ? sim.possPct() : [50, 50], dom = pp[0] >= pp[1] ? 0 : 1, top = o ? ' Top ' + sx(spkNm(o), 'loc') + '.' : '';
        var A = ['Maçın ' + mi + '. dakikası, skor ' + sc + '.' + top, 'Oyun yeniden akıyor: ' + mi + '. dakika, skor ' + sc + '.' + top, 'Maç kaldığı yerden sürüyor, ' + mi + '. dakikada skor ' + sc + '.'];
        if (lead >= 0) A.push(T[lead].name + ' ' + sc + ' önde, ' + T[1 - lead].name + ' karşılık arıyor. Dakika ' + mi + '.');
        else if (T[0].score > 0) A.push('Skor ' + sc + ' eşit, ' + mi + '. dakikada maç dengede.');
        if (pp[dom] >= 56 && mi >= 10) A.push(T[dom].name + ' topa daha çok sahip (%' + pp[dom] + '), dakika ' + mi + ', skor ' + sc + '.');
        F.sk = F.sk || { tm: -1, att: 0, attT: -99, wonT: -99, wonOH: false, ctr: false, minSaid: {}, momT: [-99, -99], mem: {} };
        F.bq = []; F.bu = 0; F.bc = { s: spkPick(F, 'intro', A), p: 2, tm: o ? o.team : -1, heat: 0, t: sim.t, rt: now }; F.bc.u = spkSplit(F.bc.s); F.bt = now;
    }
    // dakika bağlamı: skor, sahiplik, şut, xG - sakin anlarda da anlatım canlı kalır
    function spkCtx(sim, mi) {
        var T = sim.teams, s0 = T[0].score, s1 = T[1].score, sc = s0 + '-' + s1, lead = s0 > s1 ? 0 : s1 > s0 ? 1 : -1, df = Math.abs(s0 - s1), late = mi >= 80;
        var pp = sim.possPct ? sim.possPct() : [50, 50], dom = pp[0] >= pp[1] ? 0 : 1, dp = pp[dom], a = T[0].st, b = T[1].st, sh = (a.shots || 0) + (b.shots || 0), xg = [a.xg || 0, b.xg || 0], L = [];
        if (lead < 0) {
            if (late) L.push({ s: 'Son ' + Math.max(1, 90 - mi) + ' dakika! Skor ' + sc + ', atılacak gol maçın kaderini belirleyecek!', p: 5, h: 1 });
            else if (s0 + s1 === 0) { L.push({ s: 'Maçın ' + mi + '. dakikası, skor hâlâ 0-0. ' + (dp >= 56 ? T[dom].name + ' topa daha çok sahip (%' + dp + ').' : 'İki takım da dengeli.'), p: 3, h: 0 }); if (sh >= 6) L.push({ s: 'Karşılıklı ' + sh + ' şut var ama ağlar hâlâ sallanmadı!', p: 3, h: 0 }); }
            else L.push({ s: 'Skor ' + sc + ', eşitlik sürüyor. ' + (dp >= 56 ? T[dom].name + ' oyunu kontrol ediyor.' : 'Maç her an kırılabilir.'), p: 3, h: 0 });
        } else {
            var ln = T[lead].name, tr = T[1 - lead].name;
            if (late && df === 1) L.push({ s: 'Son dakikalara giriliyor! ' + ln + ' bir golle önde, ' + tr + ' için zaman daralıyor!', p: 5, h: 1, tm: 1 - lead });
            else if (df >= 3) L.push({ s: ln + ' rahat önde: ' + sc + '. ' + tr + ' en azından farkı azaltmak istiyor.', p: 3, h: 0, tm: lead });
            else L.push({ s: 'Skor ' + sc + ', ' + ln + ' önde. ' + tr + ' ' + (df === 1 ? 'beraberlik golünü arıyor.' : 'maça tutunmaya çalışıyor.'), p: 3, h: 0, tm: 1 - lead });
        }
        var xd = xg[0] - xg[1], xk = xd >= 0 ? 0 : 1;
        if (Math.abs(xd) >= .9 && lead !== xk) L.push({ s: 'Gol beklentisinde ' + T[xk].name + ' önde (' + xg[xk].toFixed(1) + ' / ' + xg[1 - xk].toFixed(1) + '), ama skor tabelası bunu yansıtmıyor.', p: 3, h: 0, tm: xk });
        if (dp >= 60 && mi >= 20) L.push({ s: T[dom].name + ' topa %' + dp + ' sahip, oyunun kontrolü onlarda.', p: 3, h: 0, tm: dom });
        return L.length ? L[Math.floor(Math.random() * L.length)] : null;
    }
    function spkSmart(F, sim) {
        var K = F.sk || (F.sk = { tm: -1, att: 0, attT: -99, wonT: -99, wonOH: false, ctr: false, minSaid: {}, momT: [-99, -99], mem: {} });
        if (!sim || sim.mode !== 'live' || !sim.ball) return;
        var B = sim.ball, o = B.owner, t = sim.t, sx = Comm2D.sfx, T = sim.teams, mi = minOf(t), i;
        if (o) {
            var tm = o.team, nm = spkNm(o), tn = T[tm].name, op = T[1 - tm].name;
            if (tm !== K.tm) { K.tm = tm; K.att = 0; K.ctr = false; K.wonT = t; K.wonOH = Math.abs(o.x - sim.ownGoalX(tm)) < 50; }
            var dA = Math.hypot(sim.atkGoalX(tm) - o.x, PH / 2 - o.y), inB = sim.inBox(o.x, o.y, tm);
            if (dA > 45 && K.att && t - K.attT > 8) K.att = 0;                                // hücum geri döndü: yeni hücum yeniden anlatılabilir
            if (inB && K.att < 2) { K.att = 2; K.attT = t; spkSay(F, spkPick(F, 'box', ['Tehlike! ' + nm + ' ceza sahasında!', nm + ' ceza sahasına girdi... pozisyon çok tehlikeli!', 'Ceza sahası içinde ' + nm + '! ' + sx(op, 'gen') + ' savunması alarmda!']), 7, 2, tm, 1); }
            else if (dA < 32 && K.att < 1) {
                K.att = 1; K.attT = t;
                if (K.wonOH && t - K.wonT < 7 && !K.ctr) { K.ctr = true; spkSay(F, spkPick(F, 'ctr', ['Hızlı hücum! ' + tn + ' kontra atakta, ' + nm + ' boş alana koşuyor!', 'Kontra! ' + nm + ' topla hızla ilerliyor, ' + sx(op, 'gen') + ' savunması geride kaldı!']), 7, 2, tm, 1); }
                else { var wg = spkWing(sim, tm, o.y); spkSay(F, spkPick(F, 'f3', [nm + ' topla ilerliyor, ' + tn + ' rakip ceza sahasına yaklaştı!', tn + ' tehlikeli bölgede! Top ' + sx(nm, 'loc') + '.', wg ? nm + ' ' + wg + ' kanattan içeri giriyor...' : nm + ' ceza sahası önünde boşluk arıyor...', 'Top ' + sx(nm, 'loc') + ', ' + tn + ' ceza sahası çevresinde pas arıyor.']), 5, 1, tm, 1); }
            }
        }
        for (i = 0; i < SPK_MIN.length; i++) { var mk = SPK_MIN[i]; if (mi >= mk && mi < mk + 2 && !K.minSaid[mk]) { K.minSaid[mk] = 1; var cx = spkCtx(sim, mi); if (cx) spkSay(F, cx.s, cx.p, cx.h, cx.tm); } }
        var M = S.mom;                                                                         // baskı: son 5 dk baskımetre ≥ %68
        if (M && M.sid === S.sid && mi >= 8) {
            var cu = Math.min(129, Math.floor(t * CK / 60)), pa = 0, pb = 0; for (i = Math.max(0, cu - 4); i <= cu; i++) { pa += M.a[i]; pb += M.b[i]; }
            var tot = pa + pb, k = pa >= pb ? 0 : 1, r = tot > .8 ? (k ? pb : pa) / tot : 0;
            if (r >= .68 && mi - K.momT[k] >= 9) { K.momT[k] = mi; spkSay(F, spkPick(F, 'mom', [T[k].name + ' son dakikalarda baskıyı artırdı, ' + T[1 - k].name + ' kendi yarı alanına çekildi.', T[k].name + ' yüklendikçe yükleniyor! Oyun ' + sx(T[1 - k].name, 'gen') + ' yarı alanında oynanıyor.', 'Baskı ' + sx(T[k].name, 'loc') + '! ' + T[1 - k].name + ' nefes almakta zorlanıyor.']), 4, 1, k); }
        }
    }
    function spkLines(s, maxW) {
        var Wd = s.split(/\s+/), L = [], cur = '', i;
        for (i = 0; i < Wd.length; i++) { var t = cur ? cur + ' ' + Wd[i] : Wd[i]; if (!cur || g.measureText(t).width <= maxW) cur = t; else { L.push(cur); cur = Wd[i]; } }
        if (cur) L.push(cur); return L;
    }
    function spkWrap(s, maxW, h, heat) {
        var maxL = h >= 100 ? 3 : 2, fs = Math.round(Math.max(16, Math.min(26, h * .30))), L, m = heat >= 1 ? s.match(/^([^\s!.?,]{2,}(?: [^\s!.?,]{2,})?!)\s/) : null;
        for (; ; fs--) { g.font = '600 ' + fs + 'px ' + fbo(); L = spkLines(s, maxW); if ((L.length <= maxL && fs * 1.22 * L.length <= h - 12) || fs <= 13) break; }
        if (L.length > maxL) { L = L.slice(0, maxL); var la = L[maxL - 1]; while (la.length > 3 && g.measureText(la + '…').width > maxW) la = la.slice(0, -1); L[maxL - 1] = la + '…'; }
        return { fs: fs, L: L, lead: m && L[0].indexOf(m[1]) === 0 ? m[1] : null };
    }
    function fmBanner(x, y, w, h, F, now) {
        spkTick(F, now);
        var sim = S.sim, cur = F.bc, cols = S.cols || ['#c8102e', '#1e5aa8'], heat = cur ? cur.heat : 0, age = cur ? (now - F.bt) / 1000 : 9, u0 = !F.bu, cs = cur ? cur.u[F.bu] || cur.s : '';
        var hc = heat >= 3 ? '#c9f23d' : heat >= 2 ? '#ffb020' : heat >= 1 ? '#ffd66b' : '#7fd1ff';
        g.save();
        g.fillStyle = 'rgba(9,15,29,.97)'; rr(x, y, w, h, 10); g.fill();
        if (heat >= 2 && u0 && age < 1.4) { g.globalAlpha = (1 - age / 1.4) * (heat >= 3 ? .42 : .22); g.fillStyle = hc; rr(x, y, w, h, 10); g.fill(); g.globalAlpha = 1; }      // önemli an: kısa parlama
        g.strokeStyle = heat >= 2 ? hc : 'rgba(127,209,255,.2)'; g.lineWidth = heat >= 2 ? 1.6 : 1; rr(x, y, w, h, 10); g.stroke();
        var cy = y + h / 2, lx = x + 14, fsS = Math.round(Math.max(10, Math.min(12, h * .15))), fsM = Math.round(Math.max(18, Math.min(30, h * .36)));
        g.textBaseline = 'middle'; g.textAlign = 'left';
        g.fillStyle = 'rgba(255,59,92,' + (.55 + .45 * Math.sin(now / 220)) + ')'; g.beginPath(); g.arc(lx + 4, cy - fsM * .52, 4, 0, 7); g.fill();
        g.font = '800 ' + fsS + 'px ' + fd(); g.fillStyle = '#ff7b8f'; g.fillText('CANLI', lx + 13, cy - fsM * .5);
        g.font = '800 ' + fsM + 'px ' + fd(); g.fillStyle = '#c9f23d'; g.fillText(minOf(sim.t) + "'", lx, cy + fsM * .38);
        var colW = Math.max(g.measureText("90'").width + 6, 56) + 18, tx = x + colW + 10, tw = w - colW - 26;
        g.fillStyle = 'rgba(127,209,255,.14)'; g.fillRect(x + colW, y + 12, 1, h - 24);
        if (!cur) { g.font = '500 ' + Math.round(Math.max(14, h * .22)) + 'px ' + fbo(); g.fillStyle = '#6f84a0'; g.fillText('Spiker anlatıma hazırlanıyor...', tx, cy); g.restore(); return; }
        if (cur.tm >= 0 && cols[cur.tm]) { g.fillStyle = cols[cur.tm]; rr(tx, y + 14, 4, h - 28, 2); g.fill(); }      // cümlenin takımı
        var e = Math.min(1, age / .28), dy = (1 - (1 - (1 - e) * (1 - e) * (1 - e))) * 10, W2 = spkWrap(cs, tw - 14, h, u0 ? heat : 0), lh = W2.fs * 1.22, ty = cy - (W2.L.length - 1) * lh / 2 + dy, j;
        g.globalAlpha = Math.min(1, age / .2);                                               // yeni cümle kısa süzülmeyle belirir (eski cümle yok)
        for (j = 0; j < W2.L.length; j++) {
            var ln = W2.L[j], xx = tx + 14;
            if (j === 0 && W2.lead) { g.font = '800 ' + W2.fs + 'px ' + fbo(); g.fillStyle = hc; g.fillText(W2.lead, xx, ty); xx += g.measureText(W2.lead + ' ').width; ln = ln.slice(W2.lead.length).replace(/^\s+/, ''); }
            g.font = (heat >= 2 ? '700 ' : '600 ') + W2.fs + 'px ' + fbo(); g.fillStyle = '#f4f8ff'; g.fillText(ln, xx, ty + j * lh);
        }
        g.globalAlpha = 1; g.restore(); g.textBaseline = 'alphabetic';
    }
    function fmFlow(rx, y) {
        var now = performance.now(), t = '▶▶ HIZLI AKIŞ'; g.font = '800 10px ' + fd(); var w = g.measureText(t).width + 14;
        g.fillStyle = 'rgba(6,10,20,.75)'; rr(rx - w, y - 12, w, 17, 8); g.fill(); g.fillStyle = 'rgba(201,242,61,' + (.65 + .35 * Math.sin(now / 200)) + ')'; g.textAlign = 'right'; g.fillText(t, rx - 7, y + 1);
    }
    var FMG_ON = false;
    (function () { try { var st = document.createElement('style'); st.textContent = 'body.fm-gap #ab-hud-comm{display:none!important}'; document.head.appendChild(st); } catch (e) { } })();
    function fmGapCls(on) { if (FMG_ON === on) return; FMG_ON = on; try { document.body.classList.toggle('fm-gap', on); } catch (e) { } }
    var FMD = { x: new Float32Array(22), y: new Float32Array(22), bx: 0, by: 0, bz: 0, ok: false, sid: -1 }, FMDV = newView();
    function fmSmooth(v, dt) {      // [perf] mini sahada noktalar yumuşak akar (hızlı akışta adım adım sıçramaz); ölü top yerleşiminde anında
        var k = 1 - Math.exp(-(dt || .016) / .07), i, o = FMDV;
        if (!FMD.ok || FMD.sid !== S.sid) { for (i = 0; i < 22; i++) { FMD.x[i] = v.x[i]; FMD.y[i] = v.y[i]; } FMD.bx = v.bx; FMD.by = v.by; FMD.bz = v.bz; FMD.ok = true; FMD.sid = S.sid; }
        for (i = 0; i < 22; i++) { if (Math.abs(v.x[i] - FMD.x[i]) + Math.abs(v.y[i] - FMD.y[i]) > 14 || v.x[i] < -20) { FMD.x[i] = v.x[i]; FMD.y[i] = v.y[i]; } else { FMD.x[i] += (v.x[i] - FMD.x[i]) * k; FMD.y[i] += (v.y[i] - FMD.y[i]) * k; } o.x[i] = FMD.x[i]; o.y[i] = FMD.y[i]; o.fx[i] = v.fx[i]; o.fy[i] = v.fy[i]; }
        var kb = 1 - Math.exp(-(dt || .016) / .04); if (Math.abs(v.bx - FMD.bx) + Math.abs(v.by - FMD.by) > 20) { FMD.bx = v.bx; FMD.by = v.by; } else { FMD.bx += (v.bx - FMD.bx) * kb; FMD.by += (v.by - FMD.by) * kb; } FMD.bz = v.bz;
        o.bx = FMD.bx; o.by = FMD.by; o.bz = FMD.bz; o.owner = v.owner; return o;
    }
    function drawFmGap(F, dt) {
        if (!g || !W) resize(); if (!g || !W) return;
        var sim = S.sim, now = performance.now(), pd = W < 560 ? 8 : 12, i;
        g.setTransform(dpr, 0, 0, dpr, 0, 0); ZC = 1; g.textBaseline = 'alphabetic';
        var gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0b1424'); gr.addColorStop(1, '#060b15'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
        fmGapCls(true);
        if (F.gapN !== F.n) { F.gapN = F.n; try { spkIntro(F, sim); } catch (e) { } }      // [spk] yeni maç arası: bant güncel durumla başlar (önceki anın cümlesi kalmaz)
        try { spkSmart(F, sim); } catch (e) { warn('spiker', e); }
        var top = pd + Math.max(S.tabB || 0, W < 560 ? 44 : 50), hh = 0;
        var y0 = top, avail = H - y0 - pd, v = fmSmooth(liveView(1), dt);
        if (W >= 700) {                                                              // [spk] önemli anlar paneli ve alt spiker listesi yok: saha geniş, üstünde canlı spiker bandı
            var rw = Math.round(Math.max(220, Math.min(300, W * .26))), cw = W - 3 * pd - rw, cx = pd, rx = cx + cw + pd;
            var bnH = Math.round(Math.max(66, Math.min(100, avail * .13))), momH = Math.round(Math.max(70, Math.min(110, avail * .16))), pitH = Math.max(80, avail - bnH - momH - 2 * pd), py0 = y0 + bnH + pd;
            fmBanner(cx, y0, cw, bnH, F, now);
            fmPanel(cx, py0, cw, pitH, null); if (V7W.lvl === 'yaz') v7YazPanel(cx + 8, py0 + 8, cw - 16, pitH - 16, F); else fmPitch(cx + 8, py0 + 8, cw - 16, pitH - 16, v); fmFlow(cx + cw - 10, py0 + 20);
            fmMomentum(cx, py0 + pitH + pd, cw, momH);
            fmStats(rx, y0, rw, avail);
        } else {                                                                     // dar ekran: üstte spiker bandı, saha + istatistik yan yana, altta baskımetre
            var fw = W - 2 * pd, bnH2 = Math.round(Math.max(54, Math.min(84, avail * .15))), y1 = y0 + bnH2 + pd, av2 = avail - bnH2 - pd;
            var lw2 = Math.round(fw * .56), rw2 = fw - lw2 - pd, r1 = Math.max(96, Math.min(lw2 * PH / PW + 12, av2 * .64)), mh = Math.max(56, Math.min(96, av2 - r1 - pd));
            fmBanner(pd, y0, fw, bnH2, F, now);
            fmPanel(pd, y1, lw2, r1, null); if (V7W.lvl === 'yaz') v7YazPanel(pd + 5, y1 + 5, lw2 - 10, r1 - 10, F); else fmPitch(pd + 5, y1 + 5, lw2 - 10, r1 - 10, v); fmFlow(pd + lw2 - 6, y1 + 16);
            fmStats(pd + lw2 + pd, y1, rw2, r1);
            fmMomentum(pd, y1 + r1 + pd, fw, mh);
        }
    }
    var PV3 = newView();
    function vsWatchDur(vs) { var mo = vs && vs.mon; if (!mo) return VS_DUR.watch; return Math.max(VS_DUR.watch, Math.min(7.5, (mo.f1 - mo.f0) / mo.fps + (mo.lines ? 1.8 : .9))); }
    function drawVarLines(vl) {
        var L = vl.L, ya = Y(-1.5), yb = Y(PH + 1.5);
        g.save(); g.globalAlpha = Math.min(1, vl.a);
        g.strokeStyle = 'rgba(127,209,255,.95)'; g.lineWidth = .20 * K; g.setLineDash([1.1 * K, .7 * K]); g.beginPath(); g.moveTo(X(L.ref), ya); g.lineTo(X(L.ref), yb); g.stroke(); g.setLineDash([]);
        g.strokeStyle = 'rgba(255,255,255,.95)'; g.lineWidth = .24 * K; g.beginPath(); g.moveTo(X(L.ox), ya); g.lineTo(X(L.ox), yb); g.stroke();
        g.restore();
    }
    function drawVar3D(dt) {
        var vs = S.vs, mo = vs && vs.mon, R3 = S.r3;
        if (!mo || !S.use3 || !R3 || R3.lost || vs.phase !== 'watch' || vs.skip) return false;
        var t = vs.t, fa = Math.min(mo.f1, mo.f0 + t * mo.fps), tHold = (mo.f1 - mo.f0) / mo.fps, la = mo.lines ? Math.max(0, Math.min(1, (t - tHold) / .45)) : 0;
        var v = ringView(fa, vs.n1, PV3), L = mo.lines, win = mo.win, cx = win.wx + win.ww / 2, cy = win.wy + win.wh / 2, gl3, i0 = Math.min(Math.floor(fa), vs.n1);
        if (L) gl3 = { ex: L.ox, ey: 7.2, ez: cy + 22, ax: L.ox, ay: .7, az: cy, fov: 30 };                  // ofsayt: taç çizgisinden çizgiye dik bakış
        else { var tx = cx * .45 + v.bx * .55, tz = cy * .45 + v.by * .55; gl3 = { ex: tx, ey: 6.4, ez: tz + 14.5, ax: tx, ay: .8, az: tz, fov: 32 }; }
        var c = vs.cam3; if (!c) c = vs.cam3 = Object.assign({}, gl3);
        else { var k = 1 - Math.exp(-(dt || .016) / .45); for (var key in gl3) c[key] += (gl3[key] - c[key]) * k; }
        R3.varCam = { eye: [c.ex, c.ey, c.ez], at: [c.ax, c.ay, c.az], fov: c.fov };
        var vt0 = S.viewT, vff = i0 < vs.n1 ? Math.max(0, fa - i0) : 0, vtA = S.ring.buf[(i0 % RING) * FS];
        S.viewT = vff > 0 ? vtA + (S.ring.buf[((i0 + 1) % RING) * FS] - vtA) * vff : vtA;            // [gk] tekrar saati (kayıtlı sim zamanı) · [v132] kareler arasında ara değerli (aksiyonlar takılmaz)
        if (!vs.rpx || fa < (vs.rpx.fa || 0) - 1) { vs.rpx = { gk: null, off: 0, fa: fa }; r3Cut(); }      // [v132] ilk kare / döngü başı: aksiyonlar günlükten yeniden kurulur, kurgu kesmesi
        vs.rpx.fa = fa;
        try { renderAny(v, { live: false, rings: vs.rings, varLines: L && la > 0 ? { L: L, a: la } : null }); }
        finally { S.viewT = vt0; }
        if (!S.use3) return true;                                                              // 3B çizim başarısızsa renderAny 2B'ye döndü
        // ekran katmanı: VAR rozeti, hız etiketi, ofsayt farkı
        g.setTransform(dpr, 0, 0, dpr, 0, 0); ZC = 1;
        var fs = Math.max(11, Math.min(14, W / 62)), mg = W < 560 ? 8 : 12, y0 = mg + (S.tabB || 0), txt = 'VAR · ' + (vs.info.label || 'İnceleme').toLocaleUpperCase('tr-TR');
        g.font = '800 ' + fs + 'px ' + fd(); var bw = g.measureText(txt).width + fs * 2.6, bh = Math.round(fs * 2.1), x0 = W - bw - mg;
        g.fillStyle = 'rgba(3,8,20,.88)'; g.fillRect(x0, y0, bw, bh); g.fillStyle = '#7fd1ff'; g.fillRect(x0, y0, 3, bh);
        g.fillStyle = 'rgba(255,59,92,' + (.55 + .45 * Math.sin(performance.now() / 200)) + ')'; g.beginPath(); g.arc(x0 + fs * .95, y0 + bh / 2, fs * .3, 0, 7); g.fill();
        g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(txt, x0 + fs * 1.6, y0 + bh / 2 + 1);
        var sub = mo.pass >= 0 && fa >= mo.f1 - .01 ? 'PAS ANI' : 'YAVAŞ ÇEKİM'; g.font = '800 ' + Math.round(fs * .85) + 'px ' + fd();
        var sw = g.measureText(sub).width + fs * 1.2; g.fillStyle = 'rgba(255,201,60,.92)'; g.fillRect(W - sw - mg, y0 + bh + 4, sw, Math.round(fs * 1.7)); g.fillStyle = '#241a00'; g.textAlign = 'center'; g.fillText(sub, W - mg - sw / 2, y0 + bh + 4 + Math.round(fs * .85) + 1);
        if (L && la > 0 && R3.projectTo) {
            var pr = R3.projectTo({ x: 0, y: 0, w: 0 }, L.ref, 2.3, cy), po = R3.projectTo({ x: 0, y: 0, w: 0 }, L.ox, 2.3, cy), pm = R3.projectTo({ x: 0, y: 0, w: 0 }, (L.ref + L.ox) / 2, .05, cy);
            g.globalAlpha = la; g.font = '800 ' + fs + 'px ' + fd(); g.textBaseline = 'middle';
            var tag = function (p, s, col, side) { if (!p) return; var w = g.measureText(s).width + fs, l = side > 0 ? p.x + 4 : side < 0 ? p.x - w - 4 : p.x - w / 2; g.fillStyle = 'rgba(3,8,20,.85)'; g.fillRect(l, p.y - fs, w, fs * 1.8); g.fillStyle = col; g.textAlign = 'center'; g.fillText(s, l + w / 2, p.y - fs + fs * .9 + 1); };
            var rgt = !pr || !po || po.x >= pr.x;                                                // hücum çizgisi ekranda sağdaysa etiketi sağa, savunmanınki sola
            tag(pr, L.ball ? 'TOP' : 'SAVUNMA', '#7fd1ff', rgt ? -1 : 1); tag(po, 'HÜCUM', '#fff', rgt ? 1 : -1);
            if (pm) tag({ x: pm.x, y: pm.y + fs * 2.2 }, L.cm < 1 ? '< 1 cm' : L.cm + ' cm', '#ffc93c');
            g.globalAlpha = 1;
        }
        g.textBaseline = 'alphabetic';
        drawVarHud();
        return true;
    }
    function draw(alpha, dt) {
        if (!g || !W) resize(); if (!g || !W) return; fmGapCls(false);
        if (S.vs && S.vs.phase === 'watch' && drawVar3D(dt)) return;                                // [var3d] inceleme tekrarı 3B
        if (S.r3 && S.r3.varCam) S.r3.varCam = null;
        if (S.vs && S.vs.user && S.use3 && S.r3 && S.vs.phase !== 'watch' && S.ref) {      /* [v57] hakem takip kamerası */
            var vs2 = S.vs, r2 = S.ref, g2 = { ex: r2.x - 3.5, ey: 6.4, ez: r2.y - 13, ax: r2.x, ay: 1, az: r2.y, fov: 36 }, c2 = vs2.camF;
            if (!c2) c2 = vs2.camF = Object.assign({}, g2); else { var k2 = 1 - Math.exp(-(dt || .016) / .35); for (var key2 in g2) c2[key2] += (g2[key2] - c2[key2]) * k2; }
            S.r3.varCam = { eye: [c2.ex, c2.ey, c2.ez], at: [c2.ax, c2.ay, c2.az], fov: c2.fov };
        }
        var a = S.hold === 'goal' ? 0 : (S.hold === 'card' || S.hold === 'var') ? 1 : alpha;      // kutlamada top ağda kalır (kickoff noktasına ışınlanmaz), kartta atılan oyuncu görünmez
        var v = DL.on && !S.hold && !S.vs ? dlView() : liveView(a);      // [v135] gecikmeli gosterim: halka kayittan
        if (S.offWalk) try { offWalkLive(v, dt); } catch (e) { S.offWalk = null; }      // [v186] kırmızı kart: oyuncu yürüyerek çıkar
        var obOn = false; if (SQ.ob && !S.hold) try { obOn = outBallLive(v); } catch (e) { SQ.ob = null; }      // [v186] çizgiyi geçen top
        if (S.hold === 'goal') { gtLive(v, dt); celLive(v, dt); } else if (S.gcel) S.gcel = null;      // [gt] top ağa girer · [v183] gol sevinci koşusu
        else if (S.sim && S.sim.refHold && S.sim.refAsk && S.sim.refAsk.kind === 'goal' && !S.vs) {      /* [v57] karar anında top ağda */
            var ra0 = S.sim.refAsk, tm0 = S.sim.teams[ra0.team]; if (!S.refGi || S.refGi.ask !== ra0) S.refGi = { ask: ra0, gx: tm0 && tm0.dir === 1 ? PW : 0, gy: S.sim.ball.y, team: ra0.team, scorer: ra0.scorer };
            var gi0 = S.goalInfo; S.goalInfo = S.refGi; try { gtLive(v, dt); } finally { S.goalInfo = gi0; }
        }
        if (V7.on && !S.vs) try { v7Live(v, dt); } catch (e) { warn('v187', e); }      // [v187] görünüm hedefleri, top görevlileri, değişiklik, devre, sevinç
        camStep(dt || .016, v, S.vs ? 1 : S.zoom ? (W < 520 ? 2.1 : 1.75) : 1);                // VAR sahnesinde kamera uzaklaşır (hakem kenardaki monitöre yürür)
        renderAny(v, { live: true, rings: S.vs ? S.vs.rings : ((G.__abRing || G.__abTr) ? (G.__abRing || []).concat(G.__abTr || []) : null) });      /* [port] Pro modu halkası + karakteristik halkası */
    }

    /* [gt] gol tamamlama: motor topun çizgiyi geçtiği adımda topu başlama noktasına koyar, bu yüzden kayıtta topun ağa girişi yoktur.
       Son canlı kareden çizgi geçiş noktasına (olayın x/y'si) doğru top fiziği sürdürülür: ağ derinliği, yan ağlar, üst ağ, yerden sekme. */
    var GT_ND = 1.9, GT_GH = 2.44, GT_GW = 7.32;
    function gtInit(f, o, op, gi) {
        if (!gi || gi.gx == null) return null;
        var dirG = gi.gx > PW / 2 ? 1 : -1, gl = dirG > 0 ? PW : 0, bx = f[o + 1], by = f[o + 2], bz = f[o + 3];
        var vx = (f[o + 1] - f[op + 1]) * 25, vy = (f[o + 2] - f[op + 2]) * 25, vz = (f[o + 3] - f[op + 3]) * 25;
        var dx = gl - bx, dy = gi.gy - by, d = Math.hypot(dx, dy);
        if ((bx - gl) * dirG > 2.5) return null;      // [v139] uzak son kare de kabul (top gol noktasina yonelir) son canli karede top cizgiyi gecmis olabilir: yine de aga ilerlesin (tekrar ortada kesilmesin)
        var sp = Math.min(34, Math.max(Math.hypot(vx, vy), d / DT, 6));
        if (dx * dirG > .35) { vx = dx / d * sp; vy = dy / d * sp; }
        else { var fs = Math.hypot(vx, vy); if (vx * dirG < 2) { vx = dirG * Math.max(6, fs); vy = vy * .5; } else if (fs < 6) { vx *= 6 / fs; vy *= 6 / fs; } }
        if (bz + vz * (d / sp) > GT_GH - .3) vz = (GT_GH - .4 - bz) / Math.max(.04, d / sp);      // çizgide üst direğin altında kalsın
        return { x: bx, y: by, z: Math.max(0, bz), vx: vx, vy: vy, vz: vz, dirG: dirG, gl: gl, inN: false };
    }
    /* [fx] filenin gerçek biçimi (Ado3D ile aynı: arka file yerde 2,15 m, üstte 1,2 m geride; yan ağlar; çatı) ve esnekliği:
       top ağın dinlenme yüzeyini geçince yay-sönüm kuvveti (ω≈38 rad/sn, ζ≈.75) yüzeyin dik bileşenini yutar - top filede ~.3-.45 m
       esneyip yavaşça geri bırakılır, sonra yerçekimiyle ağın içinde aşağı süzülür ve zeminde durur. 8 alt adım (kararlılık). */
    function gtNetB(zc) { return 1.2 + (2.34 - Math.max(.03, Math.min(2.34, zc))) / 2.31 * .95; }
    function gtStep(b, h) {
        var R = .11, K = 1450, C = 57, n = 8, hs = h / n, i, y0 = PH / 2 - GT_GW / 2, y1 = PH / 2 + GT_GW / 2;
        for (i = 0; i < n; i++) {
            b.vz -= 9.81 * hs;
            var dep = (b.x - b.gl) * b.dirG, zc = b.z + R, pen, vn;
            if (dep > 0) {
                if (!b.inN) { b.inN = true; }
                pen = dep + R - gtNetB(zc);                                                                // arka file
                if (pen > 0) { vn = b.vx * b.dirG; b.vx -= b.dirG * (K * pen + C * vn) * hs; b.vy *= Math.exp(-hs * 2.5); b.vz *= Math.exp(-hs * 1.2); if (pen > .5) { b.x = b.gl + b.dirG * (gtNetB(zc) - R + .5); if (b.vx * b.dirG > 0) b.vx = 0; } }
                if (dep < gtNetB(zc) + .3) {                                                               // yan ağlar
                    pen = y0 + R - b.y; if (pen > 0) { b.vy += (K * pen - C * b.vy) * hs; b.vx *= Math.exp(-hs * 2); }
                    pen = b.y + R - y1; if (pen > 0) { b.vy -= (K * pen + C * b.vy) * hs; b.vx *= Math.exp(-hs * 2); }
                }
                if (dep < 1.3) { var tz = 2.44 - .1 * Math.min(1, dep / 1.2); pen = zc + R - tz; if (pen > 0) { b.vz -= (K * pen + C * b.vz) * hs; b.vx *= Math.exp(-hs * 2); } }      // çatı
                var dr = Math.exp(-hs * .9); b.vx *= dr; b.vy *= dr;                                        // file içi hava/sürtünme
            }
            b.x += b.vx * hs; b.y += b.vy * hs; b.z += b.vz * hs;
            if (b.z < 0) { b.z = 0; b.vz = Math.abs(b.vz) > 1.2 ? -b.vz * .38 : 0; b.vx *= .82; b.vy *= .82; }
            if (b.z === 0 && b.vz === 0) { var rf = Math.max(0, 1 - (dep > 0 ? 2.2 : .5) * hs); b.vx *= rf; b.vy *= rf; }   // yerde yuvarlanma sürtünmesi (filede çabuk durur)
        }
    }
    /* tekrar karelerine gol sonrası K kare ekler: top ağa girer ve durulur, oyuncular hızlarını yavaşça keserek koşularını tamamlar */
    function gtExtend(fr, n, gi, K) {
        if (n < 3) return null;
        var b = gtInit(fr, (n - 1) * FS, (n - 2) * FS, gi); if (!b) return null;
        var nf = new Float32Array((n + K) * FS), o0 = (n - 1) * FS, op = (n - 2) * FS, pv = new Float32Array(44), i, k, q, sp;
        nf.set(fr.subarray(0, n * FS));
        for (i = 0; i < 22; i++) {
            q = 6 + i * 4; pv[i * 2] = (fr[o0 + q] - fr[op + q]) * 25; pv[i * 2 + 1] = (fr[o0 + q + 1] - fr[op + q + 1]) * 25;
            sp = Math.hypot(pv[i * 2], pv[i * 2 + 1]); if (sp > 9 || fr[o0 + q] < -20) { pv[i * 2] = pv[i * 2 + 1] = 0; }
        }
        for (k = 1; k <= K; k++) {
            var o = (n - 1 + k) * FS, pr = o - FS;
            nf.set(nf.subarray(pr, pr + FS), o);
            nf[o] = nf[pr] + DT; gtStep(b, DT); nf[o + 1] = b.x; nf[o + 2] = b.y; nf[o + 3] = b.z; nf[o + 4] = -1; nf[o + 5] = 0;
            for (i = 0; i < 22; i++) { q = o + 6 + i * 4; if (nf[q] < -20) continue; nf[q] += pv[i * 2] * DT; nf[q + 1] += pv[i * 2 + 1] * DT; pv[i * 2] *= .9; pv[i * 2 + 1] *= .9; }
        }
        return nf;
    }
    /* [v188] gol beklemesinde topu ağa götüren yol yoksa (son canlı kare çizgiden uzak, kayıt kesik) ya da gol defterinden üretilmiş (v177 "synth")
       bir golse: top, golcünün tarafından ceza sahası içinden (çizgiye ~12,5 m; görünen top kaleye 30 m'den yakın ve öndeyse oradan) 23 m/sn'lik
       bir vuruşla kalenin içine (direklerin ~1,2–2,6 m içi, .6–1,5 m yükseklik) gider; ağa çarpar, gtStep'in file fiziğiyle düşer. Uzaktan
       başlıyorsa görüntü kesilir (top ışınlanıp kayarak gelmez). */
    function gtSyn(v, gi) {
        if (!gi || gi.gx == null) return null;
        var dirG = gi.gx > PW / 2 ? 1 : -1, gl = dirG > 0 ? PW : 0, bx = v.bx, by = v.by, dg = (gl - bx) * dirG, sx, sy, cut = 0;
        if (!gi.syn && dg > .3 && dg < 30 && Math.abs(by - PH / 2) < 22) { sx = bx; sy = by; }
        else { sx = gl - dirG * 12.5; sy = PH / 2 + Math.max(-7, Math.min(7, (by - PH / 2) * .3)); cut = Math.hypot(bx - sx, by - sy) > 3 ? 1 : 0; }
        var hs = ((gi.min * 7 + (gi.scorer + 3) * 13) % 10) / 10, side = sy >= PH / 2 ? -1 : 1, ty = gi.syn ? PH / 2 + side * (1.2 + 1.4 * hs) : PH / 2 + Math.max(-2.9, Math.min(2.9, (gi.gy || PH / 2) - PH / 2));
        var tz = .6 + .9 * ((hs * 3.7) % 1), z0 = .12, dx = gl - sx, dy = ty - sy, d = Math.hypot(dx, dy) || 1, T = Math.max(.25, d / 23);
        return { x: sx, y: sy, z: z0, vx: dx / T, vy: dy / T, vz: (tz - z0 + 4.905 * T * T) / T, dirG: dirG, gl: gl, inN: false, syn: 1, cut: cut };
    }
    /* canlı: 'goal' beklemesinde top son canlı karede donmasın; aynı fizikle ağa girer (yalnızca görüntü) */
    function gtLive(v, dt) {
        var gi = S.goalInfo; if (!gi) return;
        if (S.gb === undefined || S.gbSid !== S.sid || S.gbGi !== gi) {
            S.gbSid = S.sid; S.gbGi = gi; S.gb = null; S.gb8 = 0;
            var R = S.ring, b = R.buf, k = R.n - 1, lim = Math.max(2, R.n - 14);      // [v139] golun son canli karesi daha geride de aranir
            while (k > lim && b[(k % RING) * FS + 5] === 1) k--;
            if (k >= 2 && b[(k % RING) * FS + 5] !== 1 && R.n - 1 - k <= 12) S.gb = gtInit(b, (k % RING) * FS, ((k - 1) % RING) * FS, gi);
        }
        if (V8B.gt && S.gbGi === gi && !S.gb8) { S.gb8 = 1; if (!S.gb || gi.syn) { S.gb = gtSyn(v, gi); if (S.gb && S.gb.cut) try { if (S.r3 && S.r3.cutBall) S.r3.cutBall(); if (S.r3 && S.r3.cutActors) S.r3.cutActors(); } catch (e) { } } }      // kurgu kesmesi: kamera kale ağzına atlar      // [v188] çizgiye varan son kare yoksa / üretilen gol: top ağa canlandırılır
        var g2 = S.gb; if (!g2) return;
        var h = Math.min(.05, dt || .016); g2.acc = (g2.acc || 0) + h; if (g2.acc < 4) {      // [v186] file fiziği gerçek zamanlı (eskiden bilerek .8 hızla)
                 var st = Math.ceil(h / .01); for (var j = 0; j < st; j++) gtStep(g2, h / st); }
        v.bx = g2.x; v.by = g2.y; v.bz = g2.z; v.owner = -1;
    }
    /* [v183] gol sevinci (yalnızca görüntü, canlı 'goal' beklemesinde): motor gol anında durur ve eskiden 22 oyuncu koşunun ortasında donup kalıyordu.
       Şimdi golcü köşe bayrağı / tribün yönüne koşar, 35 m içindeki takım arkadaşları ona koşup çevresinde toplanır, diğerleri koşularını
       yavaşlayarak bitirir (hız 0'a ~1 sn'de iner). Konumlar görünüm katmanında; simülasyon ve RNG değişmez. Kendi kalesine golde sevinç koşusu yok. */
    function celLive(v, dt) {
        var gi = S.goalInfo, sim = S.sim; if (!gi || !sim) return;
        var C2 = S.gcel, i, p, h = Math.min(.05, Math.max(0, dt || .016));
        if (!C2 || C2.gi !== gi || C2.sid !== S.sid) {
            C2 = S.gcel = { gi: gi, sid: S.sid, x: new Float32Array(22), y: new Float32Array(22), vx: new Float32Array(22), vy: new Float32Array(22), t: 0, tx: 0, ty: 0 };
            var R = S.ring, b = R && R.buf, k = R ? R.n - 1 : -1, lim = Math.max(2, k - 14);      // son canlı kareden koşu hızı (motor gol adımında oyuncuları başlama düzenine koyar)
            while (b && k > lim && b[(k % RING) * FS + 5] === 1) k--;
            var okR = b && k >= 2 && b[(k % RING) * FS + 5] !== 1, o1 = okR ? (k % RING) * FS : 0, o0 = okR ? ((k - 1) % RING) * FS : 0;
            for (i = 0; i < 22; i++) { C2.x[i] = v.x[i]; C2.y[i] = v.y[i];
                if (okR) { var q = 6 + i * 4, ux = (b[o1 + q] - b[o0 + q]) / DT, uy = (b[o1 + q + 1] - b[o0 + q + 1]) / DT; if (Math.hypot(ux, uy) < 9.5 && b[o1 + q] > -20) { C2.vx[i] = ux; C2.vy[i] = uy; } } }
            var sc0 = gi.scorer; if (sc0 >= 0 && !gi.own && v.x[sc0] > -20) { var gxs = gi.gx != null ? (gi.gx > PW / 2 ? PW : 0) : (v.x[sc0] > PW / 2 ? PW : 0); C2.tx = gxs + (gxs > 0 ? -7 : 7); C2.ty = v.y[sc0] < PH / 2 ? 3 : PH - 3; }      // köşe bayrağı yönü
        }
        C2.t += h;
        var sc = gi.scorer, cel = sc >= 0 && !gi.own && v.x[sc] > -20, team = cel ? sim.players[sc].team : -1, ring = 0;
        for (i = 0; i < 22; i++) {
            if (v.x[i] < -20) continue; p = sim.players[i]; if (!p || p.role === 'GK') { C2.x[i] = v.x[i]; C2.y[i] = v.y[i]; continue; }      // kaleci: aksiyonu (plonjon/kalkış) kendi katmanında
            var tx = null, ty = null, vmax = 0, acc = 6;
            if (cel && i === sc && C2.t > .25) { tx = C2.tx; ty = C2.ty; vmax = C2.t < 2.6 ? 6.2 : 1.2; }
            else if (cel && p.team === team && Math.hypot(C2.x[i] - C2.x[sc], C2.y[i] - C2.y[sc]) < 35 && C2.t > .45) { var ang = (ring++) * 1.1 + i * .7, rr = 1.3 + .35 * ring; tx = C2.x[sc] + Math.cos(ang) * rr; ty = C2.y[sc] + Math.sin(ang) * rr; vmax = 5.8; }
            var ax, ay;
            if (tx != null) { var dx = tx - C2.x[i], dy = ty - C2.y[i], dl = Math.hypot(dx, dy), want = Math.min(vmax, dl * 1.6); ax = (dl > .05 ? dx / dl * want : 0) - C2.vx[i]; ay = (dl > .05 ? dy / dl * want : 0) - C2.vy[i]; }
            else { ax = -C2.vx[i] * 1.6; ay = -C2.vy[i] * 1.6; acc = 5; }      // koşuyu yavaşlayarak bitir
            var al = Math.hypot(ax, ay), am = acc * h; if (al > am) { ax *= am / al; ay *= am / al; }
            C2.vx[i] += ax; C2.vy[i] += ay; C2.x[i] = Math.max(.5, Math.min(PW - .5, C2.x[i] + C2.vx[i] * h)); C2.y[i] = Math.max(.5, Math.min(PH - .5, C2.y[i] + C2.vy[i] * h));
            v.x[i] = C2.x[i]; v.y[i] = C2.y[i];
            var spd = Math.hypot(C2.vx[i], C2.vy[i]); if (spd > .3) { v.fx[i] = C2.vx[i] / spd; v.fy[i] = C2.vy[i] / spd; }
        }
    }
    /* ---------- gol tekrarı ---------- */
    function showReplayUI() { showSkip('Tekrarı geç'); }
    function hideReplayUI() { hideSkip(); }
    /* [rp] tekrar rozeti görünüm sekmelerinin (DOM, sol üst) altına: sekme görünürse alt kenarına göre dikey kaydırma (CSS px) */
    function rpBadgeY() {
        var vv = $('v2d-view'), c = $('cv2d'); if (!vv || !c || !vv.offsetParent) return 0;
        var a = vv.getBoundingClientRect(), b = c.getBoundingClientRect(); if (a.width < 1 || a.top - b.top > 60 || a.right < b.right - 240 || a.bottom <= b.top + 10) return 0;     // [ui2] sekmeler sağ üstte: rozet altlarına iner
        return Math.max(0, Math.round(a.bottom - b.top - 4));
    }
    /* [v132] 3B kurgu kesmesi: görünen top, aktör süzgeçleri (konum/hız/yön) ve kamera yeni kareden başlar */
    function r3Cut() { try { if (S.r3) { if (S.r3.cutBall) S.r3.cutBall(); if (S.r3.cutActors) S.r3.cutActors(); } } catch (e) { } }
    function startReplay() {
        var R = S.ring, gi = S.goalInfo; if (!gi || !S.sim) return false;
        var n = Math.min(R.n, RING - 2, 25 * 13), i; if (n < 40) return false;
        var fr = new Float32Array(n * FS), base = R.n - n;
        for (i = 0; i < n; i++) { var src = ((base + i) % RING) * FS; fr.set(R.buf.subarray(src, src + FS), i * FS); }
        // [rp] sondaki gol adımı kareleri tekrara alınmaz: motor gol adımında topu başlama noktasına koyar (ölü top). Tekrar top ağdayken biter
        // (canlıdaki 'goal' beklemesiyle aynı kare), iz kaleden orta noktaya uzanmaz, ölü top araması gerçek önceki ölü topu bulur
        while (n > 40 && (fr[(n - 1) * FS + 5] === 1 || Math.hypot(fr[(n - 1) * FS + 1] - fr[(n - 2) * FS + 1], fr[(n - 1) * FS + 2] - fr[(n - 2) * FS + 2]) > 3)) n--;
        var ng = n, gx = gtExtend(fr, n, gi, 50); if (gx) { fr = gx; n += 50; }          // [gt] top ağa girip durulana kadar (~1 sn)
        var s0 = -1; for (i = ng - 1; i >= 0; i--) if (fr[i * FS + 5] === 1) { s0 = Math.max(0, i - 20); break; }     // son ölü toptan (0,8 sn öncesiyle) başla
        if (s0 < 0) {                                                                                             // ölü top yok: atak, golü atan takımın topu son kazandığı andan (rakipte ≥ ,3 sn kalmış son top) ,6 sn önce - en az 5, en çok 10 sn
            var run = 0, e = -1, ow, pl = S.sim.players;
            for (i = n - 1; i >= 0 && run < 8; i--) { ow = fr[i * FS + 4]; if (ow >= 0 && pl[ow] && pl[ow].team !== gi.team) { if (!run) e = i; run++; } else run = 0; }
            s0 = run >= 8 ? Math.max(0, e - 15) : 0; s0 = Math.max(Math.min(s0, n - 125), n - 250, 0);
        }
        if (n - s0 < 30) s0 = Math.max(0, n - 60);                                                                // çok kısaysa en az ~2,4 sn göster
        if (n - s0 > 25 * 12) s0 = n - 25 * 12;
        var rings = [{ id: gi.scorer, col: '#ffc93c' }]; if (gi.ast >= 0 && !gi.own) rings.push({ id: gi.ast, col: '#7fd1ff' });
        S.rp = { fr: fr, n: n, ng: ng, s0: s0, tc: s0, t: 0, endHold: 0, rings: rings, gi: gi, zoom: G.innerWidth < 520 ? 2.0 : 1.55, rate: 1, gk: null, by: rpBadgeY() };
        if (V7.on) try { S.rp.v7g = v7GoalAngle(gi); sqLog('tekrar_aci:' + S.rp.v7g.ang); } catch (e) { }      // [v187] tekrar açısı golün türüne göre
        r3Cut(); S.cam.z = S.rp.zoom;                                                    // [fm] tekrar baslangici kurgu kesmesi · [v132] aktörler + kamera da (süzülme yok)
        S.rpCount++; S.hold = 'replay'; S.last = performance.now(); S.hover = null; var tip = $('v2d-tip'); if (tip) tip.hidden = true; showReplayUI();
        return true;
    }
    function endReplay() {
        try { if (S.r3 && S.r3.gkClear) S.r3.gkClear(); } catch (e) { }                // [gk] tekrarın aksiyonları canlıya taşınmasın
        try { var sm0 = S.sim; if (sm0 && S.prev && S.prevB) { for (var pi0 = 0; pi0 < 22; pi0++) { S.prev[pi0].x = sm0.players[pi0].x; S.prev[pi0].y = sm0.players[pi0].y; S.prev[pi0].fx = sm0.players[pi0].fx; S.prev[pi0].fy = sm0.players[pi0].fy; } S.prevB.x = sm0.ball.x; S.prevB.y = sm0.ball.y; S.prevB.z = sm0.ball.z || 0; } if (S.r3 && S.r3.cutBall) S.r3.cutBall(); } catch (e) { }      // [fm] canliya kesme: bayat ara deger yok, top yeni yerinde
        if (S.hold === 'replay') { r3Cut(); try { S.cam.z = S.vs ? 1 : S.zoom ? (W < 520 ? 2.1 : 1.75) : 1; } catch (e) { } }      // [v132] canlıya kesme: aktörler + kamera da (dönme/hız rampası, kamera süzülmesi yok)
        SP.iss = 0; SP.w.fill(0);                                                        // [sp] süren ölü topun aksiyonları sonraki adımda yeniden kurulur
        if (S.hold !== 'replay') { S.rp = null; hideReplayUI(); return; }
        S.rp = null; S.hold = null; S.last = performance.now(); hideReplayUI();
    }
    function advanceReplay(dt) {
        var rp = S.rp; if (!rp) { endReplay(); return; }
        if (S.rpFreeze) return;                                                        // test: tekrar karesi elle sürülür
        rp.t += dt;
        var remain = (rp.n - 1 - rp.tc) / 25, rg = ((rp.ng || rp.n) - 1 - rp.tc) / 25, scale = S.preset >= 4 ? 1.5 : S.preset >= 2 ? 1.2 : 1;
        if (remain > .02) {
            rp.rate = rg > 2.4 ? 1 : rg > 0 ? Math.max(.36, .36 + (rg - .4) / 2 * .64) : Math.min(.62, .36 + -rg * .5); if (rp.slow) rp.rate = rg > 1.6 ? rp.slow : Math.max(.2, rp.slow * (.45 + rg / 2.9));    // gole 2,4 sn kala yavaş çekim; top ağdayken hafifçe hızlanır
            rp.tc = Math.min(rp.n - 1, rp.tc + dt * 25 * rp.rate * scale);
        } else { rp.endHold += dt; if (rp.endHold > (rp.ng && rp.ng < rp.n ? 1.0 : 1.25)) { if (rp.loop) { rp.tc = rp.s0; rp.t = .4; rp.endHold = 0; rp.gk = null; r3Cut(); } else endReplay(); } }      // [v132] döngü başı: aksiyonlar günlükten yeniden kurulur (gkReplay), kurgu kesmesi
    }
    var RP_PTS = [], RP_POOL = [];
    function drawReplay(dt) {
        if (!g || !W) resize(); if (!g || !W) return; fmGapCls(false);
        var rp = S.rp; if (!rp) return;
        var v = replayView(rp), remain = (rp.n - 1 - rp.tc) / 25;
        camStep(dt || .016, v, rp.zoom + (remain < 2.6 ? .45 : 0));
        var pts = RP_PTS, np = 0, i0 = Math.max(rp.s0, Math.floor(rp.tc) - 110), i1 = Math.floor(rp.tc), f = rp.fr, qp;      // [opt] havuzlu iz noktaları
        for (var i = i0; i <= i1; i += 2) { var tx = f[i * FS + 1], ty = f[i * FS + 2]; if (np && (tx - pts[np - 1][0]) * (tx - pts[np - 1][0]) + (ty - pts[np - 1][1]) * (ty - pts[np - 1][1]) > 20) np = 0; qp = RP_POOL[np] || (RP_POOL[np] = [0, 0]); qp[0] = tx; qp[1] = ty; pts[np++] = qp; }     // [rp] sıçramada iz kesilir
        if (np && (v.bx - pts[np - 1][0]) * (v.bx - pts[np - 1][0]) + (v.by - pts[np - 1][1]) * (v.by - pts[np - 1][1]) > 20) np = 0;
        qp = RP_POOL[np] || (RP_POOL[np] = [0, 0]); qp[0] = v.bx; qp[1] = v.by; pts[np++] = qp; pts.length = np;
        renderAny(v, { live: false, rings: rp.rings, trailPts: pts });
        // ekran katmanı: rozet, yavaş çekim etiketi, ilerleme çubuğu, geçiş parlaması
        var gi = rp.gi, nm = gi.scorer >= 0 ? (S.sim.players[gi.scorer].short || S.sim.players[gi.scorer].name) : '';
        var t1 = rp.title || 'GOL TEKRARI', t2 = rp.title ? (rp.sub || '') : gi.min + '\' ' + nm + (gi.own ? ' (k.k.)' : '') + (gi.pen ? ' (P)' : '');
        var f1 = '800 14px ' + fd(), f2 = '700 13px ' + fd(), mg = W < 560 ? 8 : 12, oy = rp.by || 0;      // [rp] oy: görünüm sekmelerinin altı · [ui2] rozet sağ üstte (TV "TEKRAR" köşesi)
        g.font = f1; var w1 = g.measureText(t1).width; g.font = f2; var w2b = g.measureText(t2).width, bw = Math.max(w1, w2b) + 42, bx = W - bw - mg, by = mg + oy;
        g.fillStyle = 'rgba(6,10,20,.9)'; g.fillRect(bx, by, bw, 44); g.fillStyle = '#ff4757'; g.fillRect(bx, by, 4, 44);
        g.fillStyle = '#ff4757'; g.beginPath(); g.arc(bx + 19, by + 15, 4.5 + 1.5 * Math.sin(performance.now() / 180), 0, 7); g.fill();
        g.fillStyle = '#fff'; g.textAlign = 'left'; g.font = f1; g.fillText(t1, bx + 30, by + 20); g.font = f2; g.fillStyle = '#ffc93c'; g.fillText(t2, bx + 30, by + 37);
        if (rp.rate < .9) { g.font = '800 12px ' + fd(); var t3 = 'YAVAŞ ÇEKİM', w3 = g.measureText(t3).width + 20; g.fillStyle = '#ffc93c'; g.fillRect(W - w3 - mg, by + 48, w3, 22); g.fillStyle = '#241a00'; g.fillText(t3, W - w3 - mg + 10, by + 63); }
        var prog = (rp.tc - rp.s0) / Math.max(1, rp.n - 1 - rp.s0); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, H - 5, W, 5); g.fillStyle = '#ffc93c'; g.fillRect(0, H - 5, W * Math.min(1, prog), 5);
        if (rp.t < .35) { g.fillStyle = 'rgba(255,255,255,' + (.55 * (1 - rp.t / .35)) + ')'; g.fillRect(0, 0, W, H); }
    }

    function refVarScene(o) {      /* [v57] kullanıcı hakem: VAR çağrısı → yürüyüş → monitör → dönüş → (host) nihai karar */
        o = o || {}; var R = S.ring, sim = S.sim; if (!sim || !S.ref || R.n < 40) return false;
        var n1 = R.n - 1, lo = Math.max(0, R.n - RING + 3), so = (n1 % RING) * FS, snap = R.buf.slice(so, so + FS);
        var kind = o.kind === 'goal' ? 'goal' : 'foul', ev = { x: o.x != null ? o.x : snap[1], y: o.y != null ? o.y : snap[2], p: o.p != null ? o.p : -1, p2: o.p2 != null ? o.p2 : -1, team: o.team || 0, t: sim.t, meta: { kind: kind } };
        var rings = []; if (ev.p >= 0) rings.push({ id: ev.p, col: kind === 'goal' ? '#ffc93c' : '#ff5a6b' }); if (ev.p2 >= 0) rings.push({ id: ev.p2, col: '#7fd1ff' });
        S.vs = { ev: ev, m: ev.meta, kind: kind, info: { label: o.label || 'Saha kenarı incelemesi', tone: '' }, phase: 'alert', t: 0, tt: 0, after: [], sid: S.sid, score: null, snap: snap, n1: n1, rings: rings, skip: false, reveal: false, path: null, mon: null, fx: ev.x, fy: ev.y, sgAt: 0, user: { onWatch: o.onWatch, onBack: o.onBack, ret: false, w: 0 } };
        try { vsMonitor(S.vs); } catch (e) { S.vs.mon = null; }
        if (S.vs.mon) { S.vs.mon.f0 = Math.max(lo, n1 - Math.round(25 * (o.sec || 5))); S.vs.mon.fps = o.fps || 11; }
        S.hold = 'var'; S.last = performance.now(); hideSkip(); try { playTone(880, .09, 'sine', .12); } catch (e) { }
        return true;
    }
    function refVarReturn() { var vs = S.vs; if (vs && vs.user) vs.user.ret = true; }
    function refVarEnd() { var vs = S.vs; if (!vs || !vs.user) return; S.vs = null; if (S.hold === 'var') S.hold = null; hideSkip(); if (S.ref) { S.ref.tx = S.ref.x; S.ref.ty = S.ref.y; S.ref.px = S.ref.x; S.ref.py = S.ref.y; } S.last = performance.now(); }
    function refVarPhase() { return S.vs && S.vs.user ? S.vs.phase : null; }
    function refReplay(o) {      /* [port] hakem/VAR monitörü: son saniyelerin yavaş çekim tekrarı (döngü) */
        o = o || {}; var R = S.ring; if (!S.sim || R.n < 30) return false;
        var n = Math.min(R.n, RING - 2, Math.round(25 * (o.sec || 6))), fr = new Float32Array(n * FS), base = R.n - n, i;
        for (i = 0; i < n; i++) { var src = ((base + i) % RING) * FS; fr.set(R.buf.subarray(src, src + FS), i * FS); }
        var rings = []; if (o.p >= 0) rings.push({ id: o.p, col: '#ff5a5a' }); if (o.p2 >= 0) rings.push({ id: o.p2, col: '#7fd1ff' });
        S.rp = { fr: fr, n: n, ng: n, s0: 0, tc: 0, t: 0, endHold: 0, rings: rings, gi: { scorer: -1, min: 0, team: o.team || 0 }, zoom: G.innerWidth < 520 ? 2.0 : 1.7, rate: 1, gk: null, by: rpBadgeY(), title: o.title || 'TEKRAR', sub: o.sub || '', loop: o.loop !== false, slow: o.slow || .5 };
        r3Cut();      // [v132] tekrar başı kurgu kesmesi (önceden top kesmesi de yoktu)
        S.rpCount++; S.hold = 'replay'; S.last = performance.now(); showReplayUI(); return true;
    }
    var ROLE_MAP = Sim2D.ROLE_TR; function ROLE(r) { return ROLE_MAP[r] || r; }

    /* ---------- oyuncu kartı (üzerine gelince) ---------- */
    var KEYATTR = {
        KL: [['REF', 'gk_ref'], ['DAL', 'gk_div'], ['POZ', 'gk_pos'], ['1e1', 'gk_1v1']],
        STP: [['MÜD', 'tac'], ['MRK', 'mar'], ['KAF', 'hea'], ['GÜÇ', 'str']], 'SLB': [['HIZ', 'pac'], ['MÜD', 'tac'], ['PAS', 'pas'], ['KON', 'sta']], 'SĞB': [['HIZ', 'pac'], ['MÜD', 'tac'], ['PAS', 'pas'], ['KON', 'sta']],
        MDO: [['MÜD', 'tac'], ['PAS', 'pas'], ['VİZ', 'vis'], ['KON', 'sta']], MO: [['PAS', 'pas'], ['VİZ', 'vis'], ['SÜR', 'dri'], ['KON', 'sta']], MOO: [['PAS', 'pas'], ['VİZ', 'vis'], ['SÜR', 'dri'], ['ŞUT', 'sho']],
        SLK: [['HIZ', 'pac'], ['SÜR', 'dri'], ['PAS', 'pas'], ['BİT', 'fin']], 'SĞK': [['HIZ', 'pac'], ['SÜR', 'dri'], ['PAS', 'pas'], ['BİT', 'fin']], SF: [['HIZ', 'pac'], ['BİT', 'fin'], ['ŞUT', 'sho'], ['POZ', 'posi']]
    };
    function tipHTML(i) {
        var p = S.sim.players[i], rec = p.db, id = rec ? rec.id : null, st = (matchData.playerMatchStats && id != null && matchData.playerMatchStats[id]) || {}, ex = S.pst[p.id] || {};
        var rating = (matchData.ratings && id != null && matchData.ratings[id] !== undefined) ? matchData.ratings[id] : 6.5;
        var attrs = (KEYATTR[rec ? rec.pos : 'SF'] || []).map(function (a) { return '<span><i>' + a[0] + '</i><b>' + (rec && rec[a[1]] != null ? Math.round(rec[a[1]]) : '-') + '</b></span>'; }).join('');
        var km = (S.dist[i] / 1000).toFixed(1).replace('.', ','), pas = ex.ps ? ex.ps + ' pas (%' + Math.round(100 * ex.pok / ex.ps) + ')' : '0 pas';
        var bits = [];
        if (st.goals) bits.push(st.goals + ' gol'); if (st.assists) bits.push(st.assists + ' asist'); if (st.red) bits.push('kırmızı kart'); else if (st.yellow) bits.push('sarı kart'); if (st.shots) bits.push(st.shots + ' şut'); if (st.saves) bits.push(st.saves + ' kurtarış');
        if (ex.tk) bits.push(ex.tk + ' top kapma'); if (ex.ic) bits.push(ex.ic + ' pas kesme'); if (ex.hd) bits.push(ex.hd + ' hava topu');
        bits.push(pas); bits.push(km + ' km');
        return '<div class="t-h"><b>' + esc(p.name) + '</b><span>' + esc(rec ? (rec.lbl || rec.pos) : '') + ' · ' + ovrTag(rec ? getOverall(rec) : null) + ' · ' + rating.toFixed(1) + '</span></div><div class="t-a">' + attrs + '</div>' + brainHTML(p) + ratingHTML(i) + '<div class="t-s">' + bits.join(' · ') + '</div>';
    }
    /* reyting gerekçesi: en büyük üç katkı (Rating2D olay günlüğünden) */
    function ratingHTML(i) {
        var R = S.rt; if (!R) return '';
        var parts = R.parts(i, S.sim.t).filter(function (x) { return x.k !== 'role'; }).slice(0, 3);
        if (!parts.length) return '';
        return '<div class="t-b"><i>REYTİNG</i><span>' + parts.map(function (x) { return esc(x.label) + (x.n > 1 ? ' ×' + x.n : '') + ' ' + (x.v > 0 ? '+' : '\u2212') + Math.abs(x.v).toFixed(2); }).join(' · ') + '</span></div>';
    }
    /* oyuncu beyni: kişilik (DB özelliklerinden) + son karar + takımın skor/dakika durumu */
    var ACT_TR = { pass: 'Pas', shot: 'Şut', drib: 'Top sürme', clear: 'Uzaklaştırma' };
    function decText(p, dc) {
        var s = ACT_TR[dc.act] || dc.act;
        if (dc.act === 'pass' && dc.q >= 0 && S.sim.players[dc.q]) s += ' → ' + esc(S.sim.players[dc.q].short || S.sim.players[dc.q].name) + (dc.pr != null ? ' (%' + Math.round(dc.pr * 100) + ')' : '');
        var ago = Math.max(0, Math.round(S.sim.t - dc.t)); return s + ' · ' + (ago < 1 ? 'şimdi' : ago + ' sn önce');
    }
    function stateText(u) { return u > .3 ? 'Golü arıyor' : u < -.2 ? 'Skoru koruyor' : ''; }
    function brainHTML(p) {
        if (!p.br || p.role === 'GK') return '';
        var out = '';
        if (p.br.real) { var tg = p.br.tags.slice(0, 3); out += '<div class="t-b"><i>BEYİN</i><b>' + esc(p.br.style) + '</b>' + (tg.length ? '<span>' + esc(tg.join(' · ')) + '</span>' : '') + '</div>'; }
        var dc = p.dec, u = S.sim.ctxUrg ? S.sim.ctxUrg(p.team) : 0, st = stateText(u);
        if (dc && S.sim.t - dc.t < 12) out += '<div class="t-b"><i>SON KARAR</i><span>' + decText(p, dc) + '</span></div>';
        if (st) out += '<div class="t-b"><i>DURUM</i><span>' + st + '</span></div>';
        return out;
    }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function pick(ev) {
        if (!S.sim || !cv || S.hold === 'replay') return -1;
        if (S.use3 && S.r3 && S.lastV) { var r3 = cv.getBoundingClientRect(), sc3 = W / (r3.width || W); return S.r3.pick((ev.clientX - r3.left) * sc3, (ev.clientY - r3.top) * sc3, S.lastV, 11); }
        var r = cv.getBoundingClientRect(), z = S.cam.z > 1.001 ? S.cam.z : 1, sc = W / (r.width || W);
        var mx = (((ev.clientX - r.left) * sc - (z > 1 ? S.cam.tx : 0)) / z - M) / K, my = (((ev.clientY - r.top) * sc - (z > 1 ? S.cam.ty : 0)) / z - M) / K, bi = -1, bd = 3.2;
        for (var i = 0; i < 22; i++) { var p = S.sim.players[i]; if (p.off) continue; var d = Math.hypot(p.x - mx, p.y - my); if (d < bd) { bd = d; bi = i; } }
        if (S.ref) { var rd = Math.hypot(S.ref.x - mx, S.ref.y - my); if (rd < 2.6 && rd < bd) return 22; }          // 22 = hakem
        return bi;
    }
    /* =====================================================================
       TAM EKRAN (2B ve 3B'de aynı şekilde çalışır - S.use3'e bağlı DEĞİL):
       .pitch-card'ı tarayıcının Fullscreen API'siyle büyütür. Gerçek durum
       HER ZAMAN document.fullscreenElement'ten okunup .ab-fs sınıfına
       yansıtılır (yerleşimin TEK doğruluk kaynağı bu sınıf - :fullscreen
       sözde-sınıfına güvenilmiyor: tarayıcılar arası tutarsız ve headless
       testte tetiklenemiyor). Düğme bcastHud enjeksiyon düzenini izler:
       shell.json'a dokunulmadan .v2d-wrap içine bir kez eklenir.
       ===================================================================== */
    var FS_ICO_ON = '<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>';
    var FS_ICO_OFF = '<svg viewBox="0 0 24 24"><path d="M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3"/></svg>';
    function fsCard() { var c = $('cv2d'); return c && c.closest ? c.closest('.pitch-card') : null; }
    function fsEl() { return document.fullscreenElement || document.webkitFullscreenElement || (S.pfs ? fsCard() : null); }
    function fsSupported() { return true; var d = document.documentElement || {}; return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled || d.requestFullscreen || d.webkitRequestFullscreen); }
    function fsBar(on) {
        var bar = $('match-bar'), card = fsCard(); if (!bar || !card) return;
        if (on) { if (bar.parentNode !== card) { S.barHome = { p: bar.parentNode, n: bar.nextSibling }; card.insertBefore(bar, card.firstChild); } }
        else if (S.barHome && bar.parentNode === card) { try { S.barHome.p.insertBefore(bar, S.barHome.n && S.barHome.n.parentNode === S.barHome.p ? S.barHome.n : null); } catch (e) { } S.barHome = null; }
    }
    var FS_PORT = ['tac-overlay', 'halftime-overlay', 'gol-overlay', 'action-overlay', 'injury-board-overlay', 'player-match-stats-modal', 'match-summary-modal', 'champion-overlay'];
    function fsPorts(on) {      // [ui37] tam ekran: katmanlar saha kartinin icine
        var card = fsCard(); if (!S.fsHome) S.fsHome = {};
        FS_PORT.forEach(function (id) {
            var el = $(id); if (!el) return; var hm = S.fsHome[id];
            if (on && card) { if (el.parentNode !== card) { S.fsHome[id] = { p: el.parentNode, n: el.nextSibling }; card.appendChild(el); } }
            else if (hm && card && el.parentNode === card) { try { hm.p.insertBefore(el, hm.n && hm.n.parentNode === hm.p ? hm.n : null); } catch (e) { document.body.appendChild(el); } S.fsHome[id] = null; }
        });
        if (on && !S.fsPortT) S.fsPortT = setInterval(function () { if (fsEl() && fsEl() === fsCard()) fsPorts(true); }, 500);
        if (!on && S.fsPortT) { clearInterval(S.fsPortT); S.fsPortT = 0; }
    }
    function fsApply() {
        var card = fsCard(), on = !!(card && fsEl() === card);
        if (card) card.classList.toggle('ab-fs', on);
        fsBar(on); fsPorts(on);      // [ui37] katmanlar tam ekranda
        var b = $('ab-fs-btn'); if (b) { b.innerHTML = on ? FS_ICO_OFF : FS_ICO_ON; b.title = on ? 'Tam ekrandan çık' : 'Tam ekran'; b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
        try { if (!on) syncLayout(); else resize(); } catch (e) { }                // [ui] çıkışta düzen (geniş/tek sütun) yeniden kurulur
        if (G.requestAnimationFrame) requestAnimationFrame(function () { try { resize(); } catch (e) { } });
    }
    function fsToggle() {
        var card = fsCard(); if (!card) return;
        var pseudo = function (on) { S.pfs = on; document.body.classList.toggle('ab-pfs', on); fsApply(); };      /* [port] tam ekran izni yoksa (iç çerçeve, iPhone) sahne pencereyi kaplar */
        /* [v150] oyun sayfası içindeysek tam ekranı ana sayfa yapar (iç çerçevenin izni olmasa da): ana sayfa maç katmanını
           pencereye yayar ve belgeyi tam ekrana almayı dener; burada saha kartı iç çerçeveyi doldurur. */
        var host = null; try { host = (G.parent && G.parent !== G && G.parent.abHostFS) ? G.parent.abHostFS : null; } catch (e) { host = null; }
        if (host) {
            G.abFsOff = function () { if (S.pfs) pseudo(false); };
            if (S.pfs) { pseudo(false); try { host(false); } catch (e) { } return; }
            try { host(true); } catch (e) { } pseudo(true); return;
        }
        if (S.pfs) { pseudo(false); return; }
        if (document.fullscreenElement || document.webkitFullscreenElement) { var ex = document.exitFullscreen || document.webkitExitFullscreen; if (ex) { try { ex.call(document); } catch (e) { } } return; }
        var rq = card.requestFullscreen || card.webkitRequestFullscreen, ok = !!(rq && (document.fullscreenEnabled || document.webkitFullscreenEnabled));
        if (!ok) { pseudo(true); return; }
        try { var p = rq.call(card); if (p && p.catch) p.catch(function () { pseudo(true); }); else setTimeout(function () { if (!(document.fullscreenElement || document.webkitFullscreenElement)) pseudo(true); }, 300); } catch (e) { pseudo(true); }
    }
    function fsEnsure() {
        ensureCss();
        var wrap = $('cv2d'); wrap = wrap && wrap.parentNode; if (!wrap || $('ab-fs-btn')) return;
        var sup = fsSupported();
        var b = document.createElement('button'); b.type = 'button'; b.className = 'ab-fs-btn'; b.id = 'ab-fs-btn'; b.setAttribute('aria-pressed', 'false'); b.innerHTML = FS_ICO_ON;
        if (sup) { b.title = 'Tam ekran'; b.onclick = fsToggle; } else { b.disabled = true; b.title = 'Bu tarayıcı/ortam tam ekranı desteklemiyor'; }
        wrap.appendChild(b);
        ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) { document.addEventListener(ev, fsApply); });
    }
    function bindCanvas() {
        var c = $('cv2d'); if (!c || c._b) return; c._b = 1;
        var tip = $('v2d-tip');
        c.addEventListener('mousemove', function (e) {
            var i = pick(e); S.hover = i >= 0 && i < 22 ? i : null; S.hoverRef = i === 22; hlRow(i < 22 ? i : -1);
            if (i < 0) { tip.hidden = true; return; }
            tip.innerHTML = i === 22 ? refTipHTML() : tipHTML(i); tip.hidden = false;
            var wr = c.parentNode.getBoundingClientRect(), tw = tip.offsetWidth, x = e.clientX - wr.left + 14; if (x + tw > wr.width - 4) x = e.clientX - wr.left - tw - 14;
            tip.style.left = Math.max(4, x) + 'px'; tip.style.top = Math.max(4, Math.min(wr.height - tip.offsetHeight - 4, e.clientY - wr.top + 12)) + 'px';
        });
        c.addEventListener('mouseleave', function () { S.hover = null; S.hoverRef = false; hlRow(-1); tip.hidden = true; });
        c.addEventListener('click', function (e) { var i = pick(e); if (i >= 0 && i < 22 && S.sim.players[i].db) { try { showPlayerMatchStats(S.sim.players[i].db.id); } catch (er) { warn('oyuncu penceresi', er); } } });
        if (G.ResizeObserver) new ResizeObserver(function () { resize(); }).observe(c.parentNode);
        G.addEventListener('resize', resize);
        fsEnsure();
    }

    /* ---------- iki takımın ilk 11'i (sağ sütun) ---------- */
    function xiRows(t) {
        var out = '', k, eid, p, rec, pos;
        for (k = 0; k < 11; k++) {
            eid = MAP[k] + 11 * t; p = S.sim.players[eid]; rec = p.db; pos = rec ? rec.pos : ROLE(p.role); var lb = rec && rec.lbl || pos;      // [v153] görünen kısaltma oyunun 14 mevkili kümesinden
            out += '<button type="button" class="xi-row" data-i="' + eid + '"' + (rec ? ' data-id="' + rec.id + '"' : '') + ' title="' + esc(p.name) + '" aria-label="' + esc(p.name + ', ' + lb) + '">' +
                '<span class="pos-badge ' + esc(pos) + '">' + esc(lb) + '</span><span class="xi-name">' + esc(p.short || p.name) + '</span><span class="xi-b"></span><span class="lineup-rating rating-good">6.5</span></button>';
        }
        return out;
    }
    function bindXI(host) {
        if (host._b) return; host._b = 1;
        function row(e) { var r = e.target && e.target.closest ? e.target.closest('.xi-row') : null; return r ? +r.getAttribute('data-i') : -1; }
        host.addEventListener('mouseover', function (e) { var i = row(e); if (i >= 0) { S.hover = i; hlRow(i); } });
        host.addEventListener('mouseout', function (e) { if (row(e) >= 0) { S.hover = null; hlRow(-1); } });
        host.addEventListener('focusin', function (e) { var i = row(e); if (i >= 0) { S.hover = i; hlRow(i); } });
        host.addEventListener('focusout', function (e) { if (row(e) >= 0) { S.hover = null; hlRow(-1); } });
        host.addEventListener('click', function (e) { var r = e.target && e.target.closest ? e.target.closest('.xi-row') : null; if (r && r.getAttribute('data-id') != null) { try { showPlayerMatchStats(+r.getAttribute('data-id')); } catch (er) { warn('oyuncu penceresi', er); } } });
    }
    function buildXI() {
        var a = $('xi-home'), b = $('xi-away'); if (!a || !b || !S.sim) return;
        var key = S.seed + '|' + matchSessionId; if (S.xiKey === key && a.children.length) return; S.xiKey = key;
        a.innerHTML = xiRows(0); b.innerHTML = xiRows(1);
        [[0, 'xi-title-h'], [1, 'xi-title-a']].forEach(function (x) { var el = $(x[1]); if (!el) return; var sp = el.querySelector('span'), dot = el.querySelector('i'); if (sp) sp.textContent = teamObj(x[0]).name; if (dot) dot.style.background = S.cols[x[0]]; });
        bindXI(a); bindXI(b);
    }
    function updateXI(force) {
        var rows = document.querySelectorAll('#xi-card .xi-row'), i, r, id, v, el, st, sig, txt, cls;
        for (i = 0; i < rows.length; i++) {
            r = rows[i]; id = +r.getAttribute('data-id'); if (isNaN(id)) continue;
            v = (matchData.ratings && matchData.ratings[id] !== undefined) ? matchData.ratings[id] : 6.5;
            el = r.lastChild; txt = v.toFixed(1); cls = 'lineup-rating ' + ratingClass(v);
            if (el.textContent !== txt) el.textContent = txt; if (el.className !== cls) el.className = cls;
            st = (matchData.playerMatchStats && matchData.playerMatchStats[id]) || {}; sig = (st.goals || 0) + '|' + (st.assists || 0) + '|' + (st.yellow || 0) + '|' + (st.red || 0);
            if (force || r.getAttribute('data-sig') !== sig) {
                r.setAttribute('data-sig', sig); r.classList.toggle('sent', !!st.red);
                r.querySelector('.xi-b').innerHTML = (st.yellow ? '<span class="xi-c" title="Sarı kart"><i class="km-card y"></i></span>' : '') + (st.red ? '<span class="xi-c" title="Kırmızı kart"><i class="km-card r"></i></span>' : '') + (st.goals ? '<span class="xi-g" title="' + st.goals + ' gol">' + ICON_BALL + (st.goals > 1 ? '<sup>' + st.goals + '</sup>' : '') + '</span>' : '') + (st.assists ? '<span class="xi-a" title="' + st.assists + ' asist">A' + (st.assists > 1 ? '<sup>' + st.assists + '</sup>' : '') + '</span>' : '');
            }
        }
    }
    function markBall(oi) {
        var old = document.querySelectorAll('#xi-card .xi-row.ball'), i; for (i = 0; i < old.length; i++) old[i].classList.remove('ball');
        if (oi >= 0) { var r = document.querySelector('#xi-card .xi-row[data-i="' + oi + '"]'); if (r) r.classList.add('ball'); }
    }
    function hlRow(i) {
        if (i === S.xiHl) return; S.xiHl = i;
        var old = document.querySelectorAll('#xi-card .xi-row.hl'), k; for (k = 0; k < old.length; k++) old[k].classList.remove('hl');
        if (i >= 0) { var r = document.querySelector('#xi-card .xi-row[data-i="' + i + '"]'); if (r) r.classList.add('hl'); }
    }
    /* dar ekranda (tek sütun): pitch altındaki sekmeler — Kritik anlar / Kadrolar / İstatistik */
    /* [ui2] canlı modda istatistik paneli akış kartına (Olaylar / Anlatım / İstatistik sekmeleri), klasikte sağ sütuna */
    function placeStats(is2) {
        var sc = document.querySelector('.stats-container'), tc = document.querySelector('.timeline-card'), side = document.querySelector('.mg-side'); if (!sc || !tc || !side) return;
        if (is2) { if (sc.parentNode !== tc) tc.appendChild(sc); }
        else { if (sc.parentNode !== side) side.appendChild(sc); sc.hidden = false; }
        if (G.ado && ado.tl) ado.tl(!is2 && ado.tlCur === 'st' ? 'key' : (ado.tlCur || 'key'));
    }
    function setTab(k) {
        if (k !== 'key' && k !== 'xi' && k !== 'stats' && k !== 'cm') k = 'key';
        S.tab = k; document.body.setAttribute('data-l2t', k);
        if (k !== 'xi' && G.ado && ado.tl && !document.body.classList.contains('l2d-wide')) ado.tl(k === 'stats' ? 'st' : k);     // dar ekran: tek sekme seti akış kartını da sürer
        [['key', 'l2t-key'], ['cm', 'l2t-cm'], ['xi', 'l2t-xi'], ['stats', 'l2t-stats']].forEach(function (x) { var b = $(x[1]); if (b) { b.classList.toggle('on', x[0] === k); b.setAttribute('aria-pressed', x[0] === k ? 'true' : 'false'); } });
    }

    /* ---------- kontroller ---------- */
    function tog(id, key) { var b = $(id); if (!b) return; b.onclick = function () { S.ov[key] = !S.ov[key]; b.classList.toggle('on', S.ov[key]); b.setAttribute('aria-pressed', S.ov[key]); }; }
    /* [ui2] segment seçimi: tıklanan [data-v] düğmesinin değeri; kabın kendisi (programla .click()) -> '' (döngü); etiket vb. -> false (yok say) */
    function segPick(e, box) { var t = e && e.target && e.target.closest ? e.target.closest('[data-v]') : null; if (t && box.contains(t)) return t.getAttribute('data-v'); return e && e.target === box ? '' : false; }
    function segSync(id, v) { var r = $(id); if (!r) return; var bs = r.querySelectorAll('[data-v]'), i, on; for (i = 0; i < bs.length; i++) { on = bs[i].getAttribute('data-v') === v; bs[i].classList.toggle('on', on); bs[i].setAttribute('aria-pressed', on ? 'true' : 'false'); } }
    /* [ui2] "Görünüm" menüsü: açılır panel (telefonda alt sayfa). Esc ve dışarı tıklama kapatır; seçim yapınca açık kalır */
    function menuOpen(on) {
        var b = $('v2d-menu-btn'), m = $('v2d-bar'); if (!b || !m) return;
        on = !!on; if (m.hidden === !on) return;
        m.hidden = !on; b.setAttribute('aria-expanded', on ? 'true' : 'false');
        if (on) { syncWatchUI(); syncOptUI(); var f = m.querySelector('.opt-group button.on:not([disabled])') || m.querySelector('.opt-group button:not([disabled])'); if (f) { try { f.focus({ preventScroll: true }); } catch (e) { } } }
    }
    function menuBind() {
        var b = $('v2d-menu-btn'), m = $('v2d-bar'); if (!b || !m || b._mb) return; b._mb = 1;
        b.addEventListener('click', function (e) { e.stopPropagation(); menuOpen(m.hidden); });
        var mx = $('v2d-menu-x'); if (mx) mx.addEventListener('click', function (e) { e.stopPropagation(); menuOpen(false); try { b.focus({ preventScroll: true }); } catch (x) { } });
        document.addEventListener('click', function (e) { if (!m.hidden && !m.contains(e.target) && !b.contains(e.target)) menuOpen(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !m.hidden) { menuOpen(false); try { b.focus(); } catch (x) { } } });
    }
    function bindBar() {
        tog('v2d-dec', 'dec'); tog('v2d-ctl', 'ctl'); tog('v2d-trail', 'trail'); tog('v2d-names', 'names');
        var sk = $('v2d-skip'); if (sk) sk.onclick = function () { if (!S.running || S.hold) return; S.skip = true; };
        var br = $('v2d-replay'); if (br) br.onclick = function () { setReplay(!S.replayOn); };
        var bs = $('v2d-smart'); if (bs) bs.onclick = function () { S.smart = !S.smart; savePrefs(); syncOptUI(); };
        var bc = $('v2d-cam'); if (bc) bc.onclick = function () { S.zoom = !S.zoom; savePrefs(); syncOptUI(); };
        // [ui2] kamera açısı / görüntü kalitesi: menüde segment (data-v); kabın kendisine programla tıklanırsa eskisi gibi sıradakine geçer
        var bcs = $('v2d-camstyle'); if (bcs) bcs.onclick = function (e) { var t = segPick(e, bcs); if (t === false) return; S.camStyle = t || (S.camStyle === 'std' ? 'low' : (S.camStyle === 'low' ? 'high' : 'std')); savePrefs(); syncOptUI(); };
        var bgx = $('v2d-gfx'); if (bgx) bgx.onclick = function (e) { var t = segPick(e, bgx); if (t === false) return; S.gfx = t || (S.gfx === 'auto' ? 'high' : S.gfx === 'high' ? 'mid' : S.gfx === 'mid' ? 'low' : 'auto'); S.gfxAuto = ''; S.r3low = false; S.r3fs = 0; S.r3fsum = 0; savePrefs(); applyGfx(); syncOptUI(); };
        menuBind();
        var rs = $('v2d-rp-skip'); if (rs) rs.onclick = function () { if (S.vs) varSkip(); else endReplay(); };
        [['v3-bcast', 'bcast'], ['v3-full', 'full'], ['v3-2d', '2d']].forEach(function (x) { var b = $(x[0]); if (b) b.onclick = function () { setView(x[1]); }; });
    }
    /* izleme biçimi: 'wide' = Geniş özet (tüm maç, akıcı tempo) · 'key' = Kritik anlar (pozisyonlar normal hız, arası ileri sarma) */
    var NB = '\u00A0';
    function dur(a) { return ['\u00BDx', '1x', '2x', '4x'].map(function (k, i) { return k + NB + '\u2248' + NB + a[i]; }).join(' \u00B7 ') + NB + 'dk'; }
    var DUR = { wide: dur([16, 8, 4, 2]), key: dur([8, 4, 2, 1]) };        // tüm maçın izleme süresi (gol tekrarları hariç); proto/pace_lab.js ile 12 tam maçta ölçüldü (Geniş özet: 15,7 / 8,0 / 4,1 / 2,1 · Kritik anlar: 8,2 / 4,1 / 2,0 / 1,0)
    function watchHint() {          // [ui21] tek kısa satır; ayrıntılı süre tablosu düğmelerin ve ipucunun title'ında
        var ml = typeof matchLenMin === 'function' ? matchLenMin() : 0, dk = ml ? '1x’te ' + ml + ' dk' : null;
        if (S.use3) return S.watch === 'fm' ? 'Önemli anlar · gerçek hızda' : S.watch === 'key' ? 'Yalnız pozisyonlar · 1x gerçek hız (~10 dk)' : 'Tüm maç · 1x gerçek hız (~17 dk' + (dk ? '; ' + dk + ' hedefi için sakin bölümler hızlanır' : ', 2x ~9 dk') + ')';      // [fiz] 3B
        return S.watch === 'fm' ? 'Önemli anlar · ' + (dk || 'aralar gösterilmez') : S.watch === 'key' ? 'Yalnız pozisyonlar · ' + (dk || '1x’te ~4 dk') : 'Tüm maç · ' + (dk || '1x’te ~8 dk');
    }
    var WATCH_TIP = { wide: 'Tüm maç akıcı tempoda izlenir; tehlikeli anlarda yavaşlar, ölü toplarda hızlanır', key: 'Yalnızca pozisyonlar normal hızda izlenir; aradaki süre hızlı akar' };
    function syncWatchUI() {
        [['watch-wide', 'wide'], ['watch-key', 'key'], ['watch-fm', 'fm']].forEach(function (x) { var b = $(x[0]); if (b) { b.classList.toggle('on', S.watch === x[1]); b.setAttribute('aria-pressed', S.watch === x[1] ? 'true' : 'false'); b.title = WATCH_TIP[x[1]] + '. Süre: ' + DUR[x[1]]; } });
        var sm = $('v2d-smart'); if (sm) { sm.disabled = S.watch === 'key'; sm.title = S.watch === 'key' ? 'Kritik anlar modunda tempo zaten pozisyona göre ayarlanır' : 'Tehlikeli anlarda yavaşlar, ölü toplarda ve sakin bölümlerde hızlanır'; }
        var hint = $('eng-hint'); if (hint && mode === '2d') { hint.textContent = watchHint(); hint.title = 'Süre (tüm maç): ' + DUR[S.watch === 'key' ? 'key' : 'wide'] + '. Gol tekrarları hariçtir; her tekrar birkaç saniye ekler (en fazla yaklaşık 15 sn).'; }
    }
    function setWatch(w) {
        if (w !== 'wide' && w !== 'key' && w !== 'fm') return;
        S.watch = w; savePrefs(); syncWatchUI(); if (w === 'wide') { S.skip = false; }
    }
    function setReplay(on) { S.replayOn = !!on; savePrefs(); syncOptUI(); if (!S.replayOn && S.hold === 'replay') endReplay(); }
    var CAM_STYLE_LBL = { std: 'Yayın', low: 'Alçak', high: 'Geniş' }, GFX_LBL = { low: 'Düşük', mid: 'Orta', high: 'Yüksek' };
    function syncOptUI() {
        syncViewUI();
        // [ui2] menü satırları: etiket + anahtar (durum yalnız .on / aria-pressed); metin yeniden yazılmaz
        [['v2d-replay', S.replayOn], ['v2d-smart', S.smart], ['v2d-cam', S.zoom]].forEach(function (x) {
            var b = $(x[0]); if (!b) return; b.classList.toggle('on', !!x[1]); b.setAttribute('aria-pressed', x[1] ? 'true' : 'false');
        });
        segSync('v2d-camstyle', CAM_STYLE_LBL[S.camStyle] ? S.camStyle : 'std');            // Yayın / Alçak / Geniş
        segSync('v2d-gfx', GFX_LBL[S.gfx] ? S.gfx : 'auto');                                 // Otomatik / Yüksek / Orta / Düşük
        var gn = $('v2d-gfx-now'); if (gn) setTxt(gn, S.gfx === 'auto' ? 'şu an ' + String(GFX_LBL[effGfx()] || '').toLocaleLowerCase('tr') : '');
    }

    /* ---------- mod seçimi ---------- */
    function lockMode(lock) { var a = $('eng-classic'), b = $('eng-2d'); if (a) a.disabled = !!lock; if (b) b.disabled = !!lock; }
    function started() { return matchData && (matchData.currentTimeMs > 0 || matchData.isFinished); }
    function syncModeUI() {
        var is2 = mode === '2d';
        var a = $('eng-classic'), b = $('eng-2d'); if (a) a.classList.toggle('on', !is2); if (b) b.classList.toggle('on', is2);
        var v = $('view-2d'); if (v) v.hidden = true;
        document.body.classList.toggle('eng-2d', is2);
        var hint = $('eng-hint'); if (hint) { hint.textContent = is2 ? watchHint() : ''; if (!is2) hint.removeAttribute('title'); }
        var ttl = $('pc-title'); if (ttl) ttl.textContent = is2 ? 'Canlı maç' : 'İlk 11';
        placeStats(is2);
        if (is2) { syncSpeedUI(); syncWatchUI(); setTab(S.tab); } else { try { origSpeed(matchSpeedMultiplier); } catch (e) { } document.body.classList.remove('l2d-wide'); }
        if (G.ado && ado.view) { var pv; try { pv = JSON.parse(localStorage.getItem('adoball_ui_v1') || '{}').view; } catch (e) { } ado.view(is2 || pv !== 'list' ? 'pitch' : 'list', is2); }
        applyView(); syncLayout(); tacSync();
    }
    function setMode(m) {
        if (m !== 'classic' && m !== '2d') return;
        if (started() && !matchData.isFinished) return;
        mode = m;
        if (m === '2d') { if (matchData.h && matchData.a) { if (matchData.isFinished) resetMatchStats(); else prepare(); } }
        else { S.sim = null; S.running = false; }
        syncModeUI(); setTimeout(resize, 30);
    }

    /* =====================================================================
       TAKIM TALİMATLARI (yalnızca 2D beta; klasik motor etkilenmez)
       Altı talimat, her biri üç seçenek (−1 / 0 / +1; 0 = eski davranış): mentalite, tempo, savunma çizgisi, baskı, genişlik, kaleciden oyun kurma.
       Kurallar: maç başlamadan ve her açılışta İKİ takım da "Onayla"ya basmadan panel kapanmaz (maça / önceki ekrana dönülemez). Maç sırasında panel açılınca
       maç durur; onaydan sonra kaldığı yerden devam eder. Seçimler takım adına göre ayrı bir tercih anahtarında (adoball_2d_tac_v1) hatırlanır.
       Yorgunlukla ilgili bir bedel yoktur (oyuncu değişikliği olmadığı için); bedeller şut/pas isabeti/faul/boşluk gibi oyun etkilerinden gelir. */
    var TAC_KEY = 'adoball_2d_tac_v1';
    var TAC_DEF = [
        { k: 'ment', name: 'Mentalite', sub: 'Takımın risk isteği', opts: [
            { v: -1, name: 'Defansif', pro: 'Rakibin şutları azalır ve daha düşük kaliteli olur; topa daha çok sahip olunur, pas isabeti artar.', con: 'Kendi şut ve pozisyon sayın düşer.' },
            { v: 0, name: 'Dengeli', pro: 'Oyuncuların kendi karar eğilimleri belirleyicidir (varsayılan).' },
            { v: 1, name: 'Hücum', pro: 'Daha çok ileri pas, çalım ve şut; forvetler daha sık koşu yapar.', con: 'Pas isabeti ve top kontrolü düşer; arkada boşluk kalınca rakibin şansları daha kaliteli olur.' }] },
        { k: 'tempo', name: 'Tempo', sub: 'Oyunun hızı', opts: [
            { v: -1, name: 'Yavaş', pro: 'Topa daha çok sahip olunur; paslar daha temiz gider.', con: 'Çalım ve koşu azalır; kendi pozisyon sayın düşer.' },
            { v: 0, name: 'Normal', pro: 'Varsayılan tempo.' },
            { v: 1, name: 'Hızlı', pro: 'Daha kısa karar süresi; daha çok çalım, koşu ve top kesme.', con: 'Pas isabeti ve topa sahip olma düşer; oyun açılınca rakibin de pozisyonu artar.' }] },
        { k: 'line', name: 'Savunma çizgisi', sub: 'Savunma hattının yüksekliği', opts: [
            { v: -1, name: 'Geride', pro: 'Rakibin şansları daha düşük kalitede olur; müdahale sayısı artar.', con: 'Rakip daha çok şut çeker ve topu daha rahat çevirir.' },
            { v: 0, name: 'Normal', pro: 'Varsayılan çizgi.' },
            { v: 1, name: 'Önde', pro: 'Rakibin şutları azalır; rakip daha sık ofsayta düşer.', con: 'Arkada boşluk kalır: rakip forvetler daha çok koşar, şansları daha kaliteli olur; daha çok sarı kart.' }] },
        { k: 'press', name: 'Baskı', sub: 'Rakibin topuna ne kadar erken girilir', opts: [
            { v: -1, name: 'Rahat', pro: 'Faul ve sarı kart belirgin azalır.', con: 'Müdahale ve top kazanma azalır; rakip topu rahat çıkarır.' },
            { v: 0, name: 'Normal', pro: 'Varsayılan baskı.' },
            { v: 1, name: 'Yüksek', pro: 'Daha çok müdahale ile topu daha erken kazanır.', con: 'Faul ve sarı kart belirgin artar; baskı aşılırsa arkada boşluk kalır, rakibin şansları daha kaliteli olur.' }] },
        { k: 'width', name: 'Genişlik', sub: 'Hücumda kanat ve bek dizilişi', opts: [
            { v: -1, name: 'Dar', pro: 'Merkezde kalabalık; kısa paslaşma; kontralara karşı daha derli toplu.', con: 'Kanatlar boş kalır; ortalar çok azalır (yaklaşık üçte iki).' },
            { v: 0, name: 'Normal', pro: 'Varsayılan genişlik.' },
            { v: 1, name: 'Geniş', pro: 'Kanatlardan yaklaşık iki kat daha çok orta; rakip savunmayı açar.', con: 'Merkez boş kalır; kontralarda rakibin şansları daha kaliteli olur.' }] },
        { k: 'gk', name: 'Kaleciden oyun kurma', sub: 'Aut ve elindeki top', opts: [
            { v: -1, name: 'Kısa', pro: 'Topu korur; yakın paslarla çıkar, uzun top atılmaz.', con: 'Rakip baskı yaparsa top kaybı riski artar.' },
            { v: 0, name: 'Karışık', pro: 'Duruma göre kısa ya da uzun (varsayılan).' },
            { v: 1, name: 'Uzun', pro: 'Baskıyı atlar; kaleci yaklaşık üç kat daha çok uzun top atar.', con: 'Uzun topların isabeti düşüktür; top sık sık rakibe geçer.' }] }
    ];
    function tacZero() { return { ment: 0, tempo: 0, line: 0, press: 0, width: 0, gk: 0 }; }
    function tacNorm(o) { var r = tacZero(); if (o) TAC_DEF.forEach(function (d) { var v = Math.round(+o[d.k]); r[d.k] = v > 0 ? 1 : v < 0 ? -1 : 0; }); return r; }
    function tacStore() { try { var o = JSON.parse(localStorage.getItem(TAC_KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; } }
    function loadTac(name) { var st = tacStore(); return tacNorm(st[String(name)]); }
    function saveTac() {
        try { var st = tacStore(); [matchData.h, matchData.a].forEach(function (t, i) { if (t && t.name != null) st[String(t.name)] = S.tac[i]; }); localStorage.setItem(TAC_KEY, JSON.stringify(st)); } catch (e) { }
    }
    function tacOptName(k, v) { var d = TAC_DEF.filter(function (x) { return x.k === k; })[0]; var o = d && d.opts.filter(function (x) { return x.v === v; })[0]; return o ? o.name : ''; }
    function tacSummary(t) { return TAC_DEF.map(function (d) { return d.name + ': ' + tacOptName(d.k, t[d.k]); }).join(' · '); }
    function tacChanged(a, b) { return TAC_DEF.filter(function (d) { return a[d.k] !== b[d.k]; }); }
    function tacBoth() { if (G.__abMine === 0 || G.__abMine === 1) S.tacOk[1 - G.__abMine] = true; return !!(S.tacOk[0] && S.tacOk[1]); }
    function tacSet(team, k, v) {
        if (!S.sim || (team !== 0 && team !== 1)) return false;
        v = v > 0 ? 1 : v < 0 ? -1 : 0; if (S.tac[team][k] === v) return true;
        S.tac[team][k] = v; S.tacOk[team] = false; try { S.sim.setTactics(team, S.tac[team]); } catch (e) { warn('talimat', e); }
        saveTac(); if (S.tacOpen) tacRender(); return true;
    }
    function tacConfirm(team, ok) { if (team !== 0 && team !== 1) return; S.tacOk[team] = ok !== false; if (S.tacOpen) tacRender(); }
    /* [tak] FM tarzı taktik ekranı: üstte takım sekmeleri; solda taktik stili + 4-2-3-1 dizilişli saha (oyuncu adı; maç öncesi genel güç,
       maç içinde reyting ve kondisyon); sağda mentalite ve üç evreli talimatlar. Ayarlar ve kurallar aynı (iki takım da onaylamadan kapanmaz). */
    var TAC_PH = [{ name: 'Topa sahipken', col: '#2bea8c', keys: ['tempo', 'width'] }, { name: 'Geçişte', col: '#ffc93c', keys: ['gk'] }, { name: 'Top rakipteyken', col: '#ff6a7d', keys: ['line', 'press'] }];
    var TAC_XY = [[50, 90], [13, 69], [36, 75], [64, 75], [87, 69], [38, 55], [62, 49], [50, 32], [15, 29], [85, 29], [50, 12]];      // posNamesList sırası: KL SLB STP STP SĞB MDO MO MOO SLK SĞK SF (dikey saha, hücum yukarı)
    function tacStyle(t) {
        if (t.press > 0 && t.line > 0 && t.tempo > 0) return ['Gegenpress', 'Önde yoğun baskı, top kazanınca hızlı hücum'];
        if (t.ment < 0 && t.line < 0 && t.press < 0) return ['Otobüsü çek', 'Derin ve kalabalık savunma, kontra fırsatı bekler'];
        if (t.tempo < 0 && t.gk < 0 && t.width <= 0) return ['Tiki-taka', 'Kısa paslarla sabırlı oyun kurma'];
        if (t.gk > 0 && t.tempo > 0) return ['Direkt oyun', 'Uzun toplarla hızla ileri'];
        if (t.line < 0 && t.tempo > 0) return ['Kontra atak', 'Geride karşılar, topu kazanınca hızla çıkar'];
        if (t.width > 0 && t.ment >= 0) return ['Kanat hücumu', 'Geniş oyun, bol orta'];
        if (t.press > 0) return ['Önde baskı', 'Rakibin oyun kurmasını erken bozar'];
        if (t.tempo < 0 && t.ment <= 0) return ['Kontrollü oyun', 'Topa sahip olarak tempoyu yönetir'];
        if (t.ment > 0) return ['Hücum futbolu', 'Risk alarak gol arar'];
        if (t.ment < 0) return ['Temkinli', 'Önce dengeyi korur, riskten kaçınır'];
        return ['Dengeli', 'Varsayılan oyun anlayışı'];
    }
    function tacInk(hex) { var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '')); if (!m) return '#fff'; var v = parseInt(m[1], 16); return (((v >> 16) & 255) * 299 + ((v >> 8) & 255) * 587 + (v & 255) * 114) / 1000 > 150 ? '#0a1020' : '#fff'; }
    function tacLive() { return !!(S.sim && (S.sim.t > 0 || S.boot)); }
    function tacPitchHTML(team) { TAC_TEAM = team;
        var t = matchData[team === 0 ? 'h' : 'a'], live = tacLive(), XY = tacPos(S.tac[team]), X0 = tacFrom(team), k, h = '<svg viewBox="0 0 68 100" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".35"><rect x="1" y="1" width="66" height="98"/><line x1="1" y1="50" x2="67" y2="50"/><circle cx="34" cy="50" r="8.7"/><rect x="13.85" y="1" width="40.3" height="15.7"/><rect x="24.85" y="1" width="18.3" height="5.2"/><rect x="13.85" y="83.3" width="40.3" height="15.7"/><rect x="24.85" y="93.8" width="18.3" height="5.2"/></g><circle cx="34" cy="50" r=".6" fill="rgba(255,255,255,.7)"/></svg>' + tacOverlay(team, XY, X0);
        for (k = 0; k < 11; k++) {
            var id = t && t.squad ? t.squad[k] : null, p = id != null ? getPlayerFromId(id) : null, xy = XY.p[k], xy0 = X0 ? X0.p[k] : xy, pos = (p && p.lbl) || posNamesList[k], full = p ? String(p.name || pos) : pos, ws = full.trim().split(' ').filter(Boolean), nm = ws.length > 1 ? ws.slice(1).join(' ') : full, badge = '', cond = '';
            if (live) {
                var r = (matchData.ratings && id != null && matchData.ratings[id] != null) ? matchData.ratings[id] : 6.5, sp = S.sim.players[team * 11 + MAP[k]], st = sp && sp.stam != null ? Math.max(0, Math.min(1, sp.stam)) : null;
                badge = '<em class="' + ratingClass(r) + '" title="Maç reytingi">' + r.toFixed(1) + '</em>';
                if (st != null) cond = '<span class="cond" title="Kondisyon %' + Math.round(st * 100) + '"><span style="width:' + Math.round(st * 100) + '%;background:' + (st > .7 ? '#2bea8c' : st > .45 ? '#ffc93c' : '#ff5a6e') + '"></span></span>';
            } else if (p) { try { badge = '<em title="Genel güç">' + getOverall(p) + '</em>'; } catch (e) { } }
            h += '<div class="tac-pl' + (k === 0 ? ' gk' : '') + '" style="left:' + xy0[0].toFixed(2) + '%;top:' + xy0[1].toFixed(2) + '%" data-x="' + xy[0].toFixed(2) + '" data-y="' + xy[1].toFixed(2) + '" title="' + esc(pos + ' · ' + full) + '"><i>' + esc(pos) + '</i><b>' + esc(nm) + '</b>' + badge + cond + '</div>';
        }
        S.tacXY = S.tacXY || []; S.tacXY[team] = XY;      // sonraki çizimde kaymanın başlangıcı
        return h;
    }
    /* [tak] talimatlara göre diziliş: TAC_XY taban (4-2-3-1), gruplara göre kaydırma (y küçük = rakip kale; yüzde) */
    var TAC_GR = ['gk', 'fb', 'cb', 'cb', 'fb', 'dm', 'cm', 'am', 'w', 'w', 'st'];
    var TAC_TEAM = 0;
    function tacXY(k) { try { var hm = G.__abHomes && G.__abHomes[TAC_TEAM] && G.__abHomes[TAC_TEAM][MAP[k]]; if (hm) return [Math.round(hm[1] * 100), Math.round(90 - (hm[0] - .035) / .685 * 78)]; } catch (e) { } return TAC_XY[k]; }
    /* [v186] oyuncunun grubu gerçek dizilişten (motor kaydındaki mevki etiketi); yoksa 4-2-3-1 varsayımı */
    var TAC_LB = { KL: 'gk', STP: 'cb', SLB: 'fb', 'SĞB': 'fb', SLKB: 'fb', 'SĞKB': 'fb', DOS: 'dm', MDO: 'dm', MOS: 'cm', MO: 'cm', OOS: 'am', MOO: 'am', SLO: 'w', 'SĞO': 'w', SLK: 'w', 'SĞK': 'w', SLA: 'w', 'SĞA': 'w', SNT: 'st', SF: 'st', FA: 'st' };
    function tacGrp(k) { try { var t = matchData[TAC_TEAM === 0 ? 'h' : 'a'], id = t && t.squad ? t.squad[k] : null, p = id != null ? getPlayerFromId(id) : null, g = p && p.lbl ? TAC_LB[p.lbl] : null; if (g) return g; } catch (e) { } return TAC_GR[k]; }
    function tacAyir(P) {      // yakın iki oyuncuyu (yüzde koordinat) yatayda ayır; birkaç tur
        for (var it = 0; it < 6; it++) { var moved = false;
            for (var i = 1; i < 11; i++) for (var j = i + 1; j < 11; j++) { var dx = P[j][0] - P[i][0], dy = P[j][1] - P[i][1];
                if (Math.abs(dx) < 15 && Math.abs(dy) < 9) { var need = (15 - Math.abs(dx)) / 2 + .5, sg = dx === 0 ? (P[i][0] < 50 ? 1 : -1) : (dx > 0 ? 1 : -1);
                    P[i][0] = Math.max(7, Math.min(93, P[i][0] - sg * need)); P[j][0] = Math.max(7, Math.min(93, P[j][0] + sg * need)); moved = true; } }
            if (!moved) break; } }
    function tacPos(t) {
        var P = [], k, s = function (v, a, b) { return v > 0 ? a : v < 0 ? b : 0; };
        for (k = 0; k < 11; k++) {
            var g = tacGrp(k), x = tacXY(k)[0], y = tacXY(k)[1], cx = x - 50, fw = g === 'st' || g === 'w' || g === 'am', mid = g === 'dm' || g === 'cm';
            if (g === 'cb' || g === 'fb') y += s(t.line, -7, 5);                                  // savunma çizgisi
            else if (g === 'dm') y += s(t.line, -4, 4);
            else if (g === 'cm') y += s(t.line, -2, 2);
            else if (g === 'gk') y += s(t.line, -3, 0);                                          // önde çizgide kaleci süpürür
            if (fw) y += s(t.ment, -4, 4); else if (mid) y += s(t.ment, -3, 3); else if (g === 'fb') y += s(t.ment, -6, 2); else if (g === 'cb') y += s(t.ment, -1.5, 1.5);      // mentalite: hücumda bekler bindirir
            if (fw) y += s(t.press, -4, 5); else if (mid) y += s(t.press, -2, 2);                 // baskı
            if (g === 'fb' || g === 'w') x = 50 + cx * (t.width > 0 ? 1.12 : t.width < 0 ? .78 : 1);      // genişlik
            else if (g === 'cb') x = 50 + cx * (t.width > 0 ? 1.06 : t.width < 0 ? .88 : 1);
            else if (mid) x = 50 + cx * (t.width > 0 ? 1.04 : t.width < 0 ? .9 : 1);
            if (g === 'cb') y = Math.min(y, 80);                                                 // kaleciyle üst üste binmesin
            P.push([Math.max(7, Math.min(93, x)), Math.max(11, Math.min(90, y))]);
        }
        if (tacGrp(7) === 'am' && tacGrp(10) === 'st') P[7][1] = Math.max(P[7][1], P[10][1] + 16);      // 10 numara forvetin altına girmesin (yalnız gerçekten 10 numara varsa)
        tacAyir(P);                                                                              // [v186] üst üste binen oyuncuları yana ayır
        return { p: P, l: [(P[2][1] + P[3][1]) / 2, t.press > 0 ? 30 : t.press < 0 ? 58 : 45] };      // l: savunma çizgisi, pres hattı
    }
    // kaymanın başlangıcı: aynı takımın sahası açıksa oyuncuların o anki yeri (kayarken yeni seçim yapılırsa sıçramaz), yoksa son çizilen yer
    function tacFrom(team) {
        var ov = $('tac-overlay'), pit = ov && !ov.hidden ? ov.querySelector('.tac-pitch') : null, W = pit ? pit.clientWidth : 0, H = pit ? pit.clientHeight : 0;
        if (pit && W > 20 && H > 20 && pit.getAttribute('data-team') === String(team)) {
            var els = pit.querySelectorAll('.tac-pl'), ln = pit.querySelectorAll('.tac-line'), bad = false;
            var pc = function (el, k, D) { var v = parseFloat(getComputedStyle(el)[k]) / D * 100; if (!isFinite(v)) bad = true; return v; };
            if (els.length === 11 && ln.length === 2) {
                var r = { p: [].map.call(els, function (el) { return [pc(el, 'left', W), pc(el, 'top', H)]; }), l: [pc(ln[0], 'top', H), pc(ln[1], 'top', H)] };
                if (!bad) return r;
            }
        }
        return S.tacXY && S.tacXY[team] || null;
    }
    function tacNameLen(team, k) {
        var t = matchData[team === 0 ? 'h' : 'a'], id = t && t.squad ? t.squad[k] : null, p = id != null ? getPlayerFromId(id) : null, full = p ? String(p.name || posNamesList[k]) : posNamesList[k], ws = full.trim().split(' ').filter(Boolean);
        return (ws.length > 1 ? ws.slice(1).join(' ') : full).length;
    }
    // kesikli çizgiler + oklar. Ok katmanı CSS ile oyuncu dairesinin merkezine kaydırılır; hesap pikselde, çıktı viewBox 68x100.
    // Oyuncudan oyuncuya oklar eğridir: denetim noktası, dairelerden, ad etiketlerinden ve rozetlerden uzak kalacak biçimde aranır.
    function tacOverlay(team, XY, X0) {
        var t = S.tac[team], P = XY.p, L0 = X0 ? X0.l : XY.l, h = '', A = [], ov = $('tac-overlay'), pit = ov && ov.querySelector('.tac-pitch');
        h += '<div class="tac-line def" style="top:' + L0[0].toFixed(2) + '%" data-y="' + XY.l[0].toFixed(2) + '"></div>';
        h += '<div class="tac-line prs" style="top:' + L0[1].toFixed(2) + '%" data-y="' + XY.l[1].toFixed(2) + '"></div>';
        var W = pit && pit.clientWidth > 20 ? pit.clientWidth : 430, H = pit && pit.clientHeight > 20 ? pit.clientHeight : 435, mob = !!(window.matchMedia && matchMedia('(max-width: 560px)').matches), live = tacLive();
        var r = mob ? 13 : 16, lh = mob ? 16 : 18, cy = (mob ? 19 : 20) + (live ? 3 : 0), bh = live ? 22 : 16;
        var Q = P.map(function (p) { return [p[0] * W / 100, p[1] * H / 100]; }), LW = P.map(function (p, k) { return Math.min(.27 * W, tacNameLen(team, k) * (mob ? 6 : 7) + (mob ? 8 : 12)) / 2; });
        function obs(i, j, own) { var B = [], k; for (k = 0; k < 11; k++) { var x = Q[k][0], y = Q[k][1]; if (k !== i && k !== j) B.push([x - r, y - r, x + r, y + r]); if (k === j && !own) continue; B.push([x - LW[k], y + r + 3, x + LW[k], y + r + 3 + lh]); B.push([x - 12, y + r + 6 + lh, x + 12, y + r + 6 + lh + bh]); } return B; }
        function clr(px, py, B) { if (px < 6 || px > W - 6 || py < cy + 6 || py > H - 6) return 0; var c = 1e9; for (var q = 0; q < B.length; q++) { var b = B[q], dx = Math.max(b[0] - px, 0, px - b[2]), dy = Math.max(b[1] - py, 0, py - b[3]), d = Math.sqrt(dx * dx + dy * dy); if (d < c) c = d; } return c; }
        function bz(a, c, b, s) { var u = 1 - s; return [u * u * a[0] + 2 * u * s * c[0] + s * s * b[0], u * u * a[1] + 2 * u * s * c[1] + s * s * b[1]]; }
        function put(a, c, b, cls, s0, s1) {      // eğriyi uçlardan kırp (daire + ok ucu payı), viewBox'a yaz
            var t0 = 0, t1 = 1, n, p, f = function (q) { return (q[0] / W * 68).toFixed(2) + ',' + (q[1] / H * 100).toFixed(2); };
            for (n = 0; n <= 200; n++) { p = bz(a, c, b, n / 200); if (Math.hypot(p[0] - a[0], p[1] - a[1]) >= s0) { t0 = n / 200; break; } }
            for (n = 200; n >= 0; n--) { p = bz(a, c, b, n / 200); if (Math.hypot(p[0] - b[0], p[1] - b[1]) >= s1) { t1 = n / 200; break; } }
            if (t1 <= t0) return;
            var w0 = (1 - t0) * (1 - t1), w1 = (1 - t0) * t1 + t0 * (1 - t1), w2 = t0 * t1;
            A.push('<path class="ar ' + cls + '" d="M' + f(bz(a, c, b, t0)) + ' Q' + f([w0 * a[0] + w1 * c[0] + w2 * b[0], w0 * a[1] + w1 * c[1] + w2 * b[1]]) + ' ' + f(bz(a, c, b, t1)) + '" marker-end="url(#' + (cls === 'gk' ? 'tac-ahy' : 'tac-ah') + ')"/>');
        }
        // i'den hedeflerden birine: en az 8 piksel açıklık, olabildiğince düz (örnek aralığı ~5 piksel). Hedef: [x, y, oyuncu (-1 = boş alan), ceza]
        // own: hedef oyuncunun kendi etiketi de engel (yoksa ok etiketin ucunun arkasından daireye girebilir)
        function route(i, T, cls, own) {
            var a = Q[i], s0 = r + 3, best = null, bs = -1e9, gi, gj, n, z;
            for (z = 0; z < T.length; z++) {
                var b = [T[z][0], T[z][1]], j = T[z][2], pen = T[z][3] || 0, B = obs(i, j, own), s1 = j >= 0 ? r + 5 : 1, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
                if (j < 0 && clr(b[0], b[1], B) < 8) continue;      // boş alan hedefi bir oyuncunun üstüne düşmesin
                for (gi = -8; gi <= 8; gi++) for (gj = -8; gj <= 8; gj++) {
                    var c = [mx + gi * W * .075, my + gj * H * .075], dev = Math.hypot(c[0] - mx, c[1] - my) + pen, m = 1e9;
                    if (800 - dev <= bs) continue;      // daha iyisi olamaz
                    var N = Math.max(18, Math.ceil((Math.hypot(c[0] - a[0], c[1] - a[1]) + Math.hypot(b[0] - c[0], b[1] - c[1])) / 5));
                    for (n = 1; n < N; n++) {
                        var p = bz(a, c, b, n / N); if (Math.hypot(p[0] - a[0], p[1] - a[1]) < s0 || Math.hypot(p[0] - b[0], p[1] - b[1]) < s1) continue;
                        m = Math.min(m, clr(p[0], p[1], B)); if (Math.min(m, 8) * 100 - dev <= bs) break;
                    }
                    var sc = Math.min(m, 8) * 100 - dev;
                    if (sc > bs) { bs = sc; best = [a, c, b, s1]; }
                }
            }
            if (best) put(best[0], best[1], best[2], cls, s0, best[3]);
        }
        function link(i, j, cls, own) { route(i, [[Q[j][0], Q[j][1], j, 0]], cls, own !== false); }
        function run(i, dx, dy) { var a = Q[i], b = [a[0] + dx * W / 100, a[1] + dy * H / 100]; put(a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], b, 'run', r + 3, 1); }      // boş alana koşu: düz
        var ck = JSON.stringify([P, t, W, H, mob, live]), C = (S.tacArwC = S.tacArwC || [])[team];      // aynı yerleşimde yeniden hesaplama yok
        if (C && C.k === ck) A = C.a;
        else {
            if (t.gk < 0) { link(0, 2, 'gk', false); link(0, 3, 'gk', false); }       // kısa: stoperlere (düz)
            else if (t.gk > 0) { var st = Q[10]; route(0, [[st[0], st[1], 10, 0], [st[0] - .2 * W, st[1] + .02 * H, -1, 120], [st[0] + .2 * W, st[1] + .02 * H, -1, 120]], 'gk', true); }      // uzun: forvete, yol kapalıysa yanındaki kanala
            if (t.tempo > 0) { run(8, 8, -11); run(9, -8, -11); run(6, 3, -11); }
            else if (t.tempo < 0) { link(5, 6, 'pas'); link(6, 7, 'pas'); link(7, 5, 'pas'); }
            if (t.ment > 0) { run(1, 0, -11); run(4, 0, -11); }      // bek bindirmesi
            S.tacArwC[team] = { k: ck, a: A };
        }
        if (!A.length) return h;
        var key = A.join(''), isNew = !S.tacArw || S.tacArw[team] !== key; S.tacArw = S.tacArw || []; S.tacArw[team] = key;      // oklar yalnız değişince belirir
        return h + '<svg class="tac-arw' + (isNew ? ' new' : '') + '" viewBox="0 0 68 100" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="tac-ah" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="rgba(255,255,255,.92)"/></marker><marker id="tac-ahy" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0,0 L6,3 L0,6 z" fill="#ffd84d"/></marker></defs>' + key + '</svg>';
    }
    function tacLegend(team) {
        var t = S.tac[team], L = [tacLive() ? '<span>Rozet: maç reytingi</span><span>Alt çubuk: kondisyon</span>' : '<span>Rozet: genel güç</span>', '<span class="lg def"><u></u>Savunma çizgisi</span>', '<span class="lg prs"><u></u>Pres hattı</span>'];
        if (t.gk) L.push('<span class="lg gk"><u></u>' + (t.gk < 0 ? 'Kaleciden kısa pas' : 'Kaleciden uzun top') + '</span>');
        if (t.tempo) L.push('<span class="lg ' + (t.tempo > 0 ? 'run"><u></u>Hızlı koşular' : 'pas"><u></u>Kısa pas üçgeni') + '</span>');
        if (t.ment > 0) L.push('<span class="lg run"><u></u>Bek bindirmesi</span>');
        L.push('<span>Hücum yönü ↑</span>');
        return '<p class="tac-leg">' + L.join('') + '</p>';
    }
    // yeni konumlara kayma: önce eski yer çizilir, iki kare sonra hedef verilir (CSS geçişi)
    function tacAnimate(ov) {
        var go = function () { [].forEach.call(ov.querySelectorAll('.tac-pitch [data-y]'), function (el) { if (el.hasAttribute('data-x')) el.style.left = el.getAttribute('data-x') + '%'; el.style.top = el.getAttribute('data-y') + '%'; }); };
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(function () { requestAnimationFrame(go); }); else go();
    }
    function tacRowHTML(team, d) {
        var cur = S.tac[team], sel = d.opts.filter(function (o) { return o.v === cur[d.k]; })[0], chg = cur[d.k] !== 0, t = matchData[team === 0 ? 'h' : 'a'];
        var h = '<div class="tac-row' + (chg ? ' chg' : '') + '"><div class="tac-rl"><b title="' + esc(d.sub) + '">' + d.name + '</b><i>' + esc(d.sub) + '</i></div><div class="tac-seg" role="radiogroup" aria-label="' + esc(t.name + ' ' + d.name) + '">';
        d.opts.forEach(function (o) { var on = o.v === cur[d.k]; h += '<button type="button" role="radio" aria-checked="' + on + '" class="tac-o' + (on ? ' on' : '') + (o.v === 0 ? ' mid' : o.v < 0 ? ' neg' : ' pos') + '" data-t="' + team + '" data-k="' + d.k + '" data-v="' + o.v + '" title="' + esc((o.pro ? 'Artı: ' + o.pro : '') + (o.con ? '\nEksi: ' + o.con : '')) + '">' + o.name + '</button>'; });
        return h + '</div>' + (chg ? '<p class="tac-fx"><span class="pro"><em>Artı</em> ' + esc(sel.pro || '') + '</span>' + (sel.con ? '<span class="con"><em>Eksi</em> ' + esc(sel.con) + '</span>' : '') + '</p>' : '') + '</div>';
    }
    function tacTabsHTML() {
        var h = '<div class="tac-tabs" role="tablist" aria-label="Takımlar">';
        [0, 1].forEach(function (i) {
            var t = matchData[i === 0 ? 'h' : 'a'], col = S.cols[i] || (i ? '#ff3b5c' : '#00a3ff'), ok = S.tacOk[i], on = S.tacTab === i, crest = '', n = 0;
            try { crest = renderTeamCrestHTML(t, 26, false); } catch (e) { }
            TAC_DEF.forEach(function (d) { if (S.tac[i][d.k] !== 0) n++; });
            h += '<button type="button" class="tac-tab" role="tab" id="tac-tab-' + i + '" aria-selected="' + on + '" aria-controls="tac-panel" tabindex="' + (on ? 0 : -1) + '" data-tab="' + i + '" style="--tc:' + esc(col) + '"><span class="tac-crest">' + crest + '</span><span class="tac-tn"><b>' + esc(t.name) + '</b><small>' + (i === 0 ? 'Ev sahibi' : 'Deplasman') + (n ? ' · ' + n + ' değişiklik' : '') + '</small></span><span class="tac-chip ' + (ok ? 'ok' : 'wait') + '">' + (ok ? 'Onaylandı' : 'Onay bekliyor') + '</span></button>';
        });
        return h + '</div>';
    }
    function tacPanelHTML(team) { TAC_TEAM = team;
        var t = matchData[team === 0 ? 'h' : 'a'], col = S.cols[team] || (team ? '#ff3b5c' : '#00a3ff'), sty = tacStyle(S.tac[team]), D = {}, h;
        TAC_DEF.forEach(function (d) { D[d.k] = d; });
        h = '<div class="tac-body" role="tabpanel" id="tac-panel" aria-labelledby="tac-tab-' + team + '" style="--tc:' + esc(col) + ';--tk:' + tacInk(col) + '">';
        h += '<div class="tac-pcol"><div class="tac-style"><span><span class="k">Taktik stili</span><b>' + esc(sty[0]) + '</b><small>' + esc(sty[1]) + '</small></span><span class="tac-form" title="Diziliş">' + esc((G.__abForm && G.__abForm[team]) || '4-2-3-1') + '</span></div>';
        h += '<div class="tac-pitch' + (tacLive() ? ' live' : '') + '" data-team="' + team + '" role="img" aria-label="' + esc(t.name + ' dizilişi ' + ((G.__abForm && G.__abForm[team]) || '4-2-3-1') + ' · ' + tacSummary(S.tac[team])) + '">' + tacPitchHTML(team) + '</div>';
        h += tacLegend(team) + '</div>';
        h += '<div class="tac-icol"><div class="tac-ment">' + tacRowHTML(team, D.ment) + '</div>';
        TAC_PH.forEach(function (ph) { h += '<section class="tac-ph" style="--pc:' + ph.col + '"><h3><span class="dot"></span>' + ph.name + '</h3>'; ph.keys.forEach(function (k) { h += tacRowHTML(team, D[k]); }); h += '</section>'; });
        return h + '</div></div>';
    }
    function tacHTML(team) {
        var t = matchData[team === 0 ? 'h' : 'a'], col = S.cols[team] || (team ? '#ff3b5c' : '#00a3ff'), ok = S.tacOk[team], cur = S.tac[team], crest = '', nchg = 0;
        try { crest = renderTeamCrestHTML(t, 40, false); } catch (e) { }
        TAC_DEF.forEach(function (d) { if (cur[d.k] !== 0) nchg++; });
        var h = '<section class="tac-team' + (ok ? ' ok' : '') + '" style="--tc:' + esc(col) + '" aria-label="' + esc(t.name) + ' talimatları"><header class="tac-th"><span class="tac-crest">' + crest + '</span><span class="tac-tn"><b>' + esc(t.name) + '</b><i>' + (team === 0 ? 'Ev sahibi' : 'Deplasman') + ' · ' + (nchg ? nchg + ' değişiklik' : 'varsayılan') + '</i></span><span class="tac-chip ' + (ok ? 'ok' : 'wait') + '">' + (ok ? 'Onaylandı' : 'Onay bekliyor') + '</span></header><div class="tac-rows">';
        TAC_DEF.forEach(function (d) {
            var sel = d.opts.filter(function (o) { return o.v === cur[d.k]; })[0], chg = cur[d.k] !== 0;
            h += '<div class="tac-row' + (chg ? ' chg' : '') + '"><div class="tac-rl"><b title="' + esc(d.sub) + '">' + d.name + '</b></div><div class="tac-seg" role="radiogroup" aria-label="' + esc(t.name + ' ' + d.name) + '">';
            d.opts.forEach(function (o) { var on = o.v === cur[d.k]; h += '<button type="button" role="radio" aria-checked="' + on + '" class="tac-o' + (on ? ' on' : '') + (o.v === 0 ? ' mid' : '') + '" data-t="' + team + '" data-k="' + d.k + '" data-v="' + o.v + '" title="' + esc((o.pro ? 'Artı: ' + o.pro : '') + (o.con ? '\nEksi: ' + o.con : '')) + '">' + o.name + '</button>'; });
            h += '</div>' + (chg ? '<p class="tac-fx"><span class="pro"><em>Artı</em> ' + esc(sel.pro || '') + '</span>' + (sel.con ? '<span class="con"><em>Eksi</em> ' + esc(sel.con) + '</span>' : '') + '</p>' : '') + '</div>';
        });
        h += '</div><footer class="tac-tf"><button type="button" class="btn ' + (ok ? 'tac-undo' : 'btn-primary') + '" data-ok="' + team + '">' + (ok ? 'Onaylandı · değiştir' : 'Takımı onayla') + '</button><button type="button" class="btn btn-ghost btn-sm" data-reset="' + team + '"' + (nchg ? '' : ' disabled') + '>Varsayılana dön</button></footer></section>';
        return h;
    }
    function tacRender() {
        var ov = $('tac-overlay'); if (!ov) return;
        var both = tacBoth(), live = S.tacPurpose !== 'pre' && S.tacPurpose !== 'start', min = S.sim ? Math.max(0, Math.floor(S.sim.t * CK / 60)) : 0;
        var head = S.tacPurpose === 'start' ? 'Maç başlamadan önce iki takım da talimatlarını onaylamalı.' : S.tacPurpose === 'half' ? 'Devre arası: talimatları değiştirebilir ya da aynen onaylayabilirsiniz.' : live ? 'Maç durdu (' + min + '. dakika). İki takım da onaylayınca maç kaldığı yerden devam eder.' : 'Talimatlar bu maç için geçerlidir. İki takım da onaylamadan bu pencere kapanmaz.';
        var kicker = S.tacPurpose === 'start' ? 'Maç öncesi' : S.tacPurpose === 'half' ? 'Devre arası' : live ? 'Maç içi' : 'Maç öncesi';
        var go = S.tacPurpose === 'start' ? 'Maçı başlat' : S.tacPurpose === 'pre' ? 'Kaydet ve dön' : 'Maça dön';
        var stat = both ? '<b class="ok">Hazır:</b> iki takım da onayladı.' : S.tacOk[0] || S.tacOk[1] ? '<b class="wait">' + esc(matchData[S.tacOk[0] ? 'a' : 'h'].name) + '</b> onayı bekleniyor.' : '<b class="wait">İki takımın</b> onayı bekleniyor.';
        var tab = S.tacTab === 1 ? 1 : 0, okT = S.tacOk[tab], nchg = 0; S.tacTab = tab; TAC_DEF.forEach(function (d) { if (S.tac[tab][d.k] !== 0) nchg++; });      // [tak] FM tarzı: sekmeli tek takım
        ov.innerHTML = '<div class="tac-modal" role="dialog" aria-modal="true" aria-labelledby="tac-title"><div class="tac-head"><span class="kicker">' + kicker + '</span><h2 id="tac-title">Taktik</h2><p class="tac-lead">' + head + '</p></div>' +
            tacTabsHTML() + tacPanelHTML(tab) +
            '<div class="tac-foot"><p class="tac-stat" id="tac-stat" aria-live="polite">' + stat + '</p>' +
            '<div class="tac-act"><button type="button" class="btn btn-ghost btn-sm" data-reset="' + tab + '"' + (nchg ? '' : ' disabled') + '>Varsayılana dön</button><button type="button" class="btn ' + (okT ? 'tac-undo' : 'btn-primary') + '" data-ok="' + tab + '">' + (okT ? 'Onaylandı · değiştir' : 'Takımı onayla') + '</button>' +
            '<button type="button" class="btn" id="tac-both"' + (both ? ' disabled' : '') + '>İki takımı da onayla</button><button type="button" class="btn btn-primary btn-lg" id="tac-go" aria-describedby="tac-stat"' + (both ? '' : ' disabled') + '>' + go + '</button></div></div></div>';
        tacAnimate(ov);      // [tak] diziliş talimatla kayar
        var f = ov._focus; if (f) { var el = ov.querySelector(f); if (el) el.focus(); ov._focus = null; }
    }
    function tacBind() {
        var ov = $('tac-overlay'); if (ov) return ov;
        ov = document.createElement('div'); ov.id = 'tac-overlay'; ov.className = 'tac-overlay'; ov.hidden = true; document.body.appendChild(ov);
        ov.addEventListener('click', function (e) {
            var t = e.target && e.target.closest ? e.target.closest('button') : null; if (!t) return;
            if (t.hasAttribute('data-k')) { ov._focus = '[data-t="' + t.getAttribute('data-t') + '"][data-k="' + t.getAttribute('data-k') + '"][data-v="' + t.getAttribute('data-v') + '"]'; tacSet(+t.getAttribute('data-t'), t.getAttribute('data-k'), +t.getAttribute('data-v')); return; }
            if (t.hasAttribute('data-tab')) { S.tacTab = +t.getAttribute('data-tab') === 1 ? 1 : 0; ov._focus = '#tac-tab-' + S.tacTab; tacRender(); return; }      // [tak] takım sekmesi
            if (t.hasAttribute('data-ok')) { var tm = +t.getAttribute('data-ok'), nowOk = !S.tacOk[tm]; if (nowOk && !S.tacOk[1 - tm]) { S.tacTab = 1 - tm; ov._focus = '#tac-tab-' + (1 - tm); } else ov._focus = nowOk ? '#tac-go' : '[data-ok="' + tm + '"]'; tacConfirm(tm, nowOk); return; }      // [tak] onaylanınca sıradaki takım
            if (t.hasAttribute('data-reset')) { var tr = +t.getAttribute('data-reset'); TAC_DEF.forEach(function (d) { S.tac[tr][d.k] = 0; }); S.tacOk[tr] = false; try { S.sim.setTactics(tr, S.tac[tr]); } catch (x) { } saveTac(); ov._focus = '[data-ok="' + tr + '"]'; tacRender(); return; }
            if (t.id === 'tac-both') { S.tacOk = [true, true]; ov._focus = '#tac-go'; tacRender(); return; }
            if (t.id === 'tac-go') tacClose();
        });
        ov.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (tacBoth()) tacClose(); return; }      // iki takım onaylamadan Esc de kapatmaz
            if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && document.activeElement && document.activeElement.hasAttribute && document.activeElement.hasAttribute('data-tab')) { e.preventDefault(); S.tacTab = 1 - (S.tacTab === 1 ? 1 : 0); ov._focus = '#tac-tab-' + S.tacTab; tacRender(); return; }      // [tak] sekmeler arası
            if (e.key === 'Tab') {
                var fs = [].slice.call(ov.querySelectorAll('button:not([disabled])')); if (!fs.length) return;
                var i = fs.indexOf(document.activeElement), n = e.shiftKey ? (i <= 0 ? fs.length - 1 : i - 1) : (i < 0 || i === fs.length - 1 ? 0 : i + 1);
                e.preventDefault(); fs[n].focus();
            }
        });
        return ov;
    }
    function tacOpen(purpose) {
        if (mode !== '2d' || !S.sim || !matchData.h || !matchData.a || S.tacOpen) return false;
        if (S.sim.finished || S.hold === 'end') return false;
        var ov = tacBind(); purpose = purpose || (S.sim.t === 0 && !S.boot ? 'pre' : S.hold === 'half' ? 'half' : 'live');
        S.tacPurpose = purpose; S.tacBefore = S.tac.map(function (t) { return tacNorm(t); }); S.tacResume = false;
        if (purpose === 'live' && S.running) { S.tacResume = true; G.pauseMatch(); }
        S.tacOk = [false, false]; if (G.__abMine === 0 || G.__abMine === 1) S.tacOk[1 - G.__abMine] = true; S.tacOpen = true; S.tacOpener = document.activeElement; S.tacTab = (G.__abMine === 1) ? 1 : 0;
        document.body.classList.add('tac-open'); ov.hidden = false; ov._focus = '[data-t="0"][data-k="ment"].on'; tacRender(); return true;
    }
    function tacClose() {
        if (!S.tacOpen || !tacBoth()) return false;
        var ov = $('tac-overlay'), purpose = S.tacPurpose; S.tacOpen = false; if (ov) { ov.hidden = true; ov.innerHTML = ''; } document.body.classList.remove('tac-open');
        saveTac(); tacSync();
        if (purpose === 'live' || purpose === 'half') {
            var msgs = []; [0, 1].forEach(function (i) { var ch = tacChanged(S.tacBefore[i], S.tac[i]); if (ch.length) msgs.push(matchData[i ? 'a' : 'h'].name + ': ' + ch.map(function (d) { return d.name + ' ' + tacOptName(d.k, S.tac[i][d.k]).toLowerCase(); }).join(', ')); });
            if (msgs.length) { try { addTicker('Takım talimatları değişti. ' + msgs.join(' | ')); } catch (e) { } }
        }
        if (purpose === 'start' || (purpose === 'live' && S.tacResume)) { S.tacResume = false; try { G.startMatch(); } catch (e) { warn('devam', e); } }
        else if (S.tacOpener && S.tacOpener.focus) { try { S.tacOpener.focus(); } catch (e) { } }
        return true;
    }
    function tacSync() {
        var b = $('btn-tactics'); if (!b) return;
        var show = mode === '2d' && !!S.sim && !(S.sim.finished || S.hold === 'end');
        b.hidden = !show; b.title = S.sim ? 'Ev: ' + tacSummary(S.tac[0]) + '\nDep: ' + tacSummary(S.tac[1]) : '';
        var hb = $('ht-tactics'); if (hb) hb.hidden = mode !== '2d';
    }
    function tacInit() {
        var b = $('btn-tactics'); if (b && !b._tac) { b._tac = 1; b.addEventListener('click', function () { tacOpen(); }); }
        var ho = $('halftime-overlay'); if (ho && !$('ht-tactics')) { var hf = $('ht-foot') || ho, hb = document.createElement('button'); hb.type = 'button'; hb.id = 'ht-tactics'; hb.className = 'btn btn-lg'; hb.textContent = 'Takım talimatları'; hb.hidden = true; hb.addEventListener('click', function () { tacOpen('half'); }); hf.insertBefore(hb, hf.firstChild); }
        // maçı başlat: talimatlar onaylanmadıysa panel açılır (yakalama aşaması: oyunun kendi onclick'i çalışmaz). Testler startMatch()'i doğrudan çağırabilir.
        var sb = $('btn-start-match'); if (sb && !sb._tac) { sb._tac = 1; sb.addEventListener('click', function (e) {
            if (mode !== '2d') return; if (!on() && matchData.h && matchData.a) prepare(); if (!S.sim) return;
            if (S.sim.t === 0 && !S.boot && !tacBoth()) { e.stopImmediatePropagation(); e.preventDefault(); if (!S.tacOpen) tacOpen('start'); }
        }, true); }
        tacSync();
    }

    /* =====================================================================
       YAYIN TARZI ÜST/ALT ARAYÜZ (yalnızca 3B görünümde): FM/EA FC referanslarındaki gibi -
       üstte skor rozeti (forma renkleri + amblem + skor + saat), altında anlatım şeridi (canlı
       satırı yansıtır) ve en altta 11'lerin canlı reytingi. Simülasyona / kayıtlara dokunmaz,
       yalnızca ZATEN var olan verileri (matchData, S.sim, #score-*, #match-time, #live-ticker-text)
       aynala; klasik ve 2B düz görünümü hiç etkilemez (body.ab-3d ile kapılı, applyView() zaten bu
       sınıfı S.use3'e göre ayarlıyor). Statik CSS için shell.json'a dokunmak yerine - tacBind()'ın
       tersine burada kendi <style> etiketimizi bir kez enjekte ediyoruz: bu ekleme tamamen bu
       dosyaya özgü kalsın, shell.json'daki mevcut hiçbir kurala bağımlı olmasın. ===================================================================== */
    var BCAST_CSS = [
        // [ui2] yayın grafiği canlı modda (2B ve 3B): skor bandı, bayrak, alt yazı şeridi, gol bandı. Klasik modda kap görünmez.
        '.ab-hud-top,.ab-hud-bottom,.ab-hud-dead,.ab-hud-goal,.ab-hud-comm-wrap{display:none}',
        'body.eng-2d .v2d-wrap .ab-hud-top{display:flex}body.eng-2d .v2d-wrap .ab-hud-comm-wrap,body.eng-2d .v2d-wrap .ab-hud-dead,body.eng-2d .v2d-wrap .ab-hud-goal{display:block}',
        'body.eng-2d #gol-overlay{display:none!important}',
        // skor bandı (sol üst): [arma KOD ▌] [1 - 0] [▐ KOD arma] [67:12] [+2] [İY]
        '.sbug{position:absolute;left:12px;top:12px;z-index:6;height:34px;align-items:stretch;color:var(--text);font-family:var(--font-display);font-weight:700;pointer-events:none;filter:drop-shadow(0 6px 14px rgba(0,0,0,.55));animation:fade-in var(--dur-3) var(--ease-out) both}',
        '.sbug>span{display:flex;align-items:center}',
        '.sbug-team{gap:7px;padding:0 10px;background:#0e1528;font-size:1.0625rem;letter-spacing:.06em;white-space:nowrap;line-height:1}',
        '.sbug-team.h{padding-left:13px;box-shadow:inset 4px 0 0 var(--team-h)}.sbug-team.a{padding-right:13px;box-shadow:inset -4px 0 0 var(--team-a)}',
        '.sbug .ab-hud-crest{width:22px;height:22px;flex:none;display:flex;align-items:center;justify-content:center}.sbug .ab-hud-crest>*{width:100%!important;height:100%!important;min-width:0!important}.sbug .ab-hud-crest span{font-size:11px!important}',
        '.sbug-score{gap:5px;padding:0 11px;min-width:72px;justify-content:center;background:var(--text);color:var(--primary-ink);font:800 1.375rem/1 var(--font-num);font-variant-numeric:tabular-nums}',
        '.sbug-score .sep{opacity:.45;font-weight:600}.sbug-score b{display:inline-block;min-width:.62em;text-align:center}.sbug-score b.bump{animation:ado-pop var(--dur-3) var(--ease-snap)}',
        '.sbug-clock{padding:0 12px;min-width:66px;justify-content:center;background:var(--s2);font:700 1.0625rem/1 var(--font-num);font-variant-numeric:tabular-nums;letter-spacing:.02em;border-radius:0 3px 3px 0}',
        '.sbug-add{padding:0 9px;margin-left:2px;background:var(--primary);color:var(--primary-ink);font:800 .9375rem/1 var(--font-num);border-radius:3px}',
        '.sbug-period{padding:0 10px;margin-left:2px;background:var(--gold);color:#1d1400;font-size:.8125rem;letter-spacing:.1em;border-radius:3px}.sbug .sbug-period:empty,.sbug .sbug-rc:empty{display:none}',
        '.sbug-rc{gap:2px}.sbug-rc i{display:block;width:7px;height:11px;border-radius:1.5px;background:var(--card-r);box-shadow:0 0 0 1px rgba(0,0,0,.45)}',
        // bayrak: skor bandına yapışık (duran top türü)
        '.ab-hud-dead{position:absolute;left:12px;top:46px;z-index:6;height:26px;padding:0 12px;background:var(--gold);color:#1d1400;font:800 .8125rem/26px var(--font-display);letter-spacing:.12em;white-space:nowrap;pointer-events:none;opacity:0;clip-path:inset(0 0 100% 0)}',
        '.ab-hud-dead.on{opacity:1;clip-path:inset(0);animation:ado-wipe-down var(--dur-3) var(--ease-wipe) both}',
        // alt yazı şeridi (spiker): alt orta
        '.ab-hud-comm-wrap{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:6;width:max-content;max-width:min(72%,640px);pointer-events:none}',
        'body:not(.ab-3d) .v2d-wrap .ab-hud-comm-wrap{bottom:58px}',
        '.ab-hud-comm{display:flex;align-items:center;gap:8px;padding:7px 14px 7px 12px;background:rgba(8,13,26,.92);border-left:3px solid var(--primary);border-radius:0 3px 3px 0;box-shadow:0 8px 20px rgba(0,0,0,.4);font:500 .875rem/1.3 var(--font-body);color:var(--text);white-space:nowrap;overflow:hidden;opacity:0;transform:translateY(6px);transition:opacity .25s,transform .25s}',
        '.ab-hud-comm.on{opacity:1;transform:none}#ab-hud-comm-text{min-width:0;overflow:hidden;text-overflow:ellipsis}',
        '.ab-hud-comm .dot{width:7px;height:7px;border-radius:50%;background:var(--live);flex:none;animation:ado-pulse 1.3s infinite}',
        '.v2d-wrap.ab-goal .ab-hud-comm,.v2d-wrap:has(#v2d-rp-skip:not([hidden])) .ab-hud-comm{opacity:0}.v2d-wrap:has(#v2d-legend:not([hidden])) .ab-hud-comm-wrap{bottom:64px}',
        // gol alt bandı (tam ekran gol katmanı yerine; 3B kutlaması görünür kalır)
        '.ab-hud-goal{position:absolute;left:50%;bottom:64px;transform:translateX(-50%);z-index:7;width:min(92%,620px);pointer-events:none;opacity:0;visibility:hidden;filter:drop-shadow(0 16px 30px rgba(0,0,0,.55))}',
        'body:not(.ab-3d) .v2d-wrap .ab-hud-goal{bottom:100px}.ab-hud-goal.on{opacity:1;visibility:visible}',
        '.gb{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:stretch;min-height:64px;background:var(--s1);clip-path:polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px))}',
        '.ab-hud-goal.on{animation:ado-wipe var(--dur-4) var(--ease-wipe) backwards}',
        '.ab-hud-goal.h{--gb:var(--team-h);--gb-ink:var(--team-h-ink)}.ab-hud-goal.a{--gb:var(--team-a);--gb-ink:var(--team-a-ink)}',
        '.gb-tag{display:flex;align-items:center;gap:10px;padding:0 18px 0 14px;background:var(--gb);color:var(--gb-ink);font:800 2.25rem/1 var(--font-display);letter-spacing:.06em}',
        '.gb-tag .ab-hud-crest{width:40px;height:40px;display:flex;padding:4px;border-radius:8px;background:rgba(6,10,20,.88);box-shadow:0 0 0 1.5px rgba(255,255,255,.85)}.gb-tag .ab-hud-crest>*{width:100%!important;height:100%!important;min-width:0!important}',
        '.gb-main{display:flex;flex-direction:column;justify-content:center;gap:3px;padding:10px 16px;min-width:0}',
        '.gb-p{font:800 1.3125rem/1.1 var(--font-display);letter-spacing:.03em;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '.gb-s{font:600 .8125rem/1.2 var(--font-body);color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '.gb-sc{display:flex;align-items:center;gap:8px;padding:0 16px;background:var(--text);color:var(--primary-ink);font:800 1.5rem/1 var(--font-num);font-variant-numeric:tabular-nums;white-space:nowrap}',
        '.gb-sc small{font:700 .8125rem/1 var(--font-display);letter-spacing:.06em;color:#33415c}.gb-sc .sep{opacity:.45}',
        // görünüm sekmeleri: sağ üst · tekrar / inceleme "geç" düğmesi: sağ alt · tam ekran: sağ alt köşe
        '.v2d-wrap .v2d-view{left:auto;right:12px;top:12px;padding:3px;gap:2px;background:rgba(6,10,20,.8);border:1px solid var(--line-2);border-radius:6px;opacity:.94}',
        '.v2d-wrap .v2d-view button{min-height:32px;padding:4px 11px;font-size:.875rem;border-radius:4px}',
        '.v2d-wrap .v2d-rp-skip{top:auto;right:54px;bottom:10px;min-height:36px;padding:6px 14px;font-size:.9375rem;background:rgba(6,10,20,.9);border:1px solid var(--line-2);color:var(--text)}',
        '.v2d-wrap .ab-fs-btn{position:absolute;right:10px;bottom:10px;z-index:8;width:36px;height:36px;display:flex;align-items:center;justify-content:center;padding:0;border-radius:6px;background:rgba(6,10,20,.8);border:1px solid var(--line-2);color:var(--text);cursor:pointer;opacity:.9;transition:opacity .15s,background .15s}',
        '.v2d-wrap .ab-fs-btn:hover,.v2d-wrap .ab-fs-btn:focus-visible{opacity:1;background:rgba(6,10,20,.94)}.v2d-wrap .ab-fs-btn svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
        '.v2d-wrap .ab-fs-btn[disabled]{opacity:.4;cursor:not-allowed}',
        // reyting hapçıkları: kadro listesiyle aynı bilgi; yalnız tam ekranda (3B)
        '.ab-hud-bottom{position:absolute;left:10px;right:56px;bottom:10px;z-index:6;align-items:center;gap:3px;padding:5px 6px;border-radius:6px;overflow-x:auto;overflow-y:hidden;background:rgba(6,10,20,.8);border:1px solid var(--line-2);scrollbar-width:none}',
        '',      // [fs] tam ekranda oyuncu reyting bandı gösterilmez (kullanıcı isteği); alt yazı ve gol bandı olağan yerinde
        '.ab-hud-bottom::-webkit-scrollbar{display:none}.ab-hud-bottom .ab-hud-div{width:1px;flex:none;align-self:stretch;background:var(--line-2);margin:0 3px}',
        '.ab-hud-pp{flex:none;display:flex;flex-direction:column;align-items:center;gap:2px;min-width:30px;padding:2px 1px}.ab-hud-pp.off{opacity:.45}',
        '.ab-hud-pp .pos{font:700 .625rem/1 var(--font-display);letter-spacing:.04em;color:var(--text-2)}',
        '.ab-hud-pp .rt{font:800 .8125rem/1.3 var(--font-num);padding:0 5px;border-radius:3px;background:rgba(255,255,255,.08)}',
        '.ab-hud-pp .rt.rating-great{color:var(--volt);background:rgba(43,234,140,.14)}.ab-hud-pp .rt.rating-good{color:var(--rt-good);background:rgba(76,195,255,.14)}.ab-hud-pp .rt.rating-avg{color:var(--warning);background:rgba(255,176,32,.12)}.ab-hud-pp .rt.rating-bad{color:var(--danger);background:rgba(255,90,110,.14)}',
        // dar sahne (telefon): bant küçülür, armalar gizlenir; sekmeler sol alta, şerit onların üstüne
        '.v2d-wrap.cv-narrow .sbug{left:8px;top:8px;height:28px}.v2d-wrap.cv-narrow .sbug .ab-hud-crest{display:none}',
        '.v2d-wrap.cv-narrow .sbug-team{padding:0 7px;font-size:.9375rem}.v2d-wrap.cv-narrow .sbug-team.h{padding-left:10px}.v2d-wrap.cv-narrow .sbug-team.a{padding-right:10px}',
        '.v2d-wrap.cv-narrow .sbug-score{min-width:54px;padding:0 8px;font-size:1.125rem}.v2d-wrap.cv-narrow .sbug-clock{min-width:52px;padding:0 8px;font-size:.9375rem}',
        '.v2d-wrap.cv-narrow .sbug-add,.v2d-wrap.cv-narrow .sbug-period{padding:0 6px;font-size:.8125rem}',
        '.v2d-wrap.cv-narrow .ab-hud-dead{left:8px;top:36px;height:22px;padding:0 9px;font-size:.75rem;line-height:22px}',
        '.v2d-wrap.cv-narrow .v2d-view{top:8px;right:8px}.v2d-wrap.cv-narrow .v2d-view button{padding:4px 9px;font-size:.8125rem}.v2d-wrap.cv-narrow .v3-p{display:none}.v2d-wrap.cv-tiny .v2d-view{top:auto;bottom:8px;right:auto;left:8px}',
        'body .v2d-wrap.cv-narrow .ab-hud-comm-wrap{left:8px;right:52px;bottom:8px;transform:none;width:auto;max-width:none}body:not(.ab-3d) .v2d-wrap.cv-narrow .ab-hud-comm-wrap{right:8px;bottom:42px}body .v2d-wrap.cv-tiny .ab-hud-comm-wrap{right:8px;bottom:48px}.v2d-wrap.cv-narrow .ab-hud-comm{font-size:.8125rem;padding:5px 10px}',
        'body .v2d-wrap.cv-narrow .ab-hud-goal{left:8px;right:52px;bottom:8px;width:auto;transform:none}body:not(.ab-3d) .v2d-wrap.cv-narrow .ab-hud-goal{right:8px;bottom:42px}body .v2d-wrap.cv-tiny .ab-hud-goal{right:8px;bottom:48px}.v2d-wrap.cv-narrow .gb{min-height:50px}.v2d-wrap.cv-narrow .gb-tag{font-size:1.5rem;padding:0 10px;gap:6px}.v2d-wrap.cv-narrow .gb-tag .ab-hud-crest{display:none}',
        '.v2d-wrap.cv-narrow .gb-main{padding:6px 10px}.v2d-wrap.cv-narrow .gb-p{font-size:1rem}.v2d-wrap.cv-narrow .gb-sc{font-size:1.125rem;padding:0 10px;gap:5px}.v2d-wrap.cv-narrow .gb-sc small{display:none}',
        '.v2d-wrap.cv-narrow .ab-fs-btn{right:8px;bottom:8px}.v2d-wrap.cv-narrow .v2d-rp-skip{right:52px;bottom:8px}.v2d-wrap.cv-narrow #v2d-legend{bottom:48px}',
        // tam ekran: kart ekranı kaplar; kontrol çubuğu (fsBar) üstte, sahne ortada
        '.pitch-card.ab-fs{position:fixed!important;inset:0!important;z-index:60;width:100vw;height:100vh;margin:0!important;padding:10px!important;border-radius:0;display:flex;flex-direction:column;background:#050b16!important}',
        '.pitch-card.ab-fs .match-bar{flex:none;margin:0 0 8px}.pitch-card.ab-fs .card-head{flex:none}.pitch-card.ab-fs #view-2d{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:center}',
        '.pitch-card.ab-fs #view-2d .v2d-wrap{flex:0 0 auto;margin:0 auto}.pitch-card.ab-fs .v2d-wrap canvas{max-height:100%}'
    ].join('');
    function ensureCss() { if (!$('ab-hud-style')) { var st = document.createElement('style'); st.id = 'ab-hud-style'; st.textContent = BCAST_CSS; document.head.appendChild(st); } }
    function bcastHudEnsure() {
        if (S.bhud) return S.bhud;
        var wrap = $('cv3d'); wrap = wrap && wrap.parentNode; if (!wrap) return null;
        ensureCss();
        var top = document.createElement('div'); top.className = 'ab-hud-top sbug'; top.id = 'ab-hud-top'; top.setAttribute('role', 'group'); top.setAttribute('aria-label', 'Skor');
        top.innerHTML = '<span class="sbug-team h"><span class="ab-hud-crest" id="ab-hud-crest-h"></span><span class="ab-hud-name home" id="ab-hud-name-h"></span><span class="sbug-rc" id="ab-hud-rc-h"></span></span>' +
            '<span class="ab-hud-score sbug-score"><b id="ab-hs">0</b><span class="sep">-</span><b id="ab-as">0</b></span>' +
            '<span class="sbug-team a"><span class="sbug-rc" id="ab-hud-rc-a"></span><span class="ab-hud-name away" id="ab-hud-name-a"></span><span class="ab-hud-crest" id="ab-hud-crest-a"></span></span>' +
            '<span class="ab-hud-clock sbug-clock" id="ab-hud-clock">00:00</span><span class="sbug-add" id="ab-hud-add" hidden></span><span class="sbug-period" id="ab-hud-period"></span>';
        var dead = document.createElement('div'); dead.className = 'ab-hud-dead'; dead.id = 'ab-hud-dead';
        var commWrap = document.createElement('div'); commWrap.className = 'ab-hud-comm-wrap';
        commWrap.innerHTML = '<div class="ab-hud-comm" id="ab-hud-comm"><span class="dot"></span><span id="ab-hud-comm-text"></span></div>';
        var gol = document.createElement('div'); gol.className = 'ab-hud-goal'; gol.id = 'ab-hud-goal'; gol.setAttribute('aria-hidden', 'true');
        var bot = document.createElement('div'); bot.className = 'ab-hud-bottom'; bot.id = 'ab-hud-bottom';
        wrap.appendChild(top); wrap.appendChild(dead); wrap.appendChild(commWrap); wrap.appendChild(gol); wrap.appendChild(bot);
        S.bhud = { top: top, comm: commWrap.firstChild, commTxt: commWrap.querySelector('#ab-hud-comm-text'), dead: dead, goal: gol, bottom: bot, key: null, lastLine: '', lineUntil: 0, gk: '' };
        return S.bhud;
    }
    var DEAD_LAB = { kickoff: 'BAŞLANGIÇ VURUŞU', throw: 'TAÇ ATIŞI', goalkick: 'AUT ATIŞI', corner: 'KORNER', freekick: 'SERBEST VURUŞ', penalty: 'PENALTI' };
    /* [ui2] skor bandı kodu: 1 kelime -> ilk 3 harf · 2 kelime -> baş harf + ikinci kelimenin 2 harfi · 3+ kelime -> baş harfler (tam ad title'da) */
    /* [ui24] 1 kelime: ilk 3 harf · 2 kelime: ilk kelimenin 2 harfi + ikincinin baş harfi · 3+ kelime: baş harfler.
       Uygunsuz kısaltmalar atlanır; iki takım aynı kodu alırsa deplasman sıradaki adayı kullanır (tam ad title'da) */
    var CODE_BAN = ['ASS', 'SEX', 'SİK', 'SIK', 'AMK', 'AMI', 'AMİ', 'GÖT', 'GOT', 'PİÇ', 'PIC', 'FUC', 'FAG', 'KUK', 'OÇE', 'NAZ', 'KKK'];
    function codeCands(t) {
        var n = String((t && t.name) || '').trim(); if (t && t.code) return [String(t.code).toLocaleUpperCase('tr')].concat(codeCands({ name: n })); var a = n.split(/\s+/).map(function (x) { return x.toLocaleUpperCase('tr').replace(/[^\p{L}\p{N}]/gu, ''); }).filter(Boolean), c = [], i;
        if (a.length >= 3) c.push(a[0].charAt(0) + a[1].charAt(0) + a[2].charAt(0));
        if (a.length >= 2) c.push(a[0].slice(0, 2) + a[1].charAt(0), a[0].charAt(0) + a[1].slice(0, 2));
        if (a.length) c.push(a[0].slice(0, 3));
        var all = a.join(''); for (i = 1; i + 1 < all.length && c.length < 14; i++) c.push(all.charAt(0) + all.charAt(i) + all.charAt(i + 1));
        c = c.filter(function (x, k) { return x.length === 3 && CODE_BAN.indexOf(x) < 0 && c.indexOf(x) === k; });
        return c.length ? c : [all.slice(0, 3) || '-'];
    }
    function teamCode(t) {
        var c = codeCands(t), o = matchData && t && t === matchData.a ? matchData.h : null;
        if (!o) return c[0];
        var oc = codeCands(o)[0];
        for (var i = 0; i < c.length; i++) if (c[i] !== oc) return c[i];
        return c[0].slice(0, 2) + '2';
    }
    var PER_SHORT = { 'Devre arası': 'İY', 'Maç sona erdi': 'MS' };
    function rcHTML(n) { var s = '', i; for (i = 0; i < Math.min(3, n); i++) s += '<i title="Kırmızı kart"></i>'; return s; }
    function hudPop(el) { if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
    function bcastHudSync(now) {
        var H = bcastHudEnsure(); if (!H || !matchData.h || !matchData.a) return;
        var key = matchData.h.name + '|' + matchData.a.name, sim = S.sim;
        if (H.key !== key) {
            H.key = key; S.hudChk = 1; H.hs = H.as = null; H.gk = ''; H.rk = '';
            $('ab-hud-crest-h').innerHTML = renderTeamCrestHTML(matchData.h, 22);
            $('ab-hud-crest-a').innerHTML = renderTeamCrestHTML(matchData.a, 22);
            $('ab-hud-name-h').textContent = teamCode(matchData.h); $('ab-hud-name-h').title = matchData.h.name;
            $('ab-hud-name-a').textContent = teamCode(matchData.a); $('ab-hud-name-a').title = matchData.a.name;
            H.top.setAttribute('aria-label', 'Skor: ' + matchData.h.name + ' - ' + matchData.a.name);
        }
        if (S.hudChk) { S.hudChk = 0; S.hudB = H.top.offsetTop + H.top.offsetHeight; S.tabB = rpBadgeY(); }       // VAR bandı (tuval) skor bandının, ileri sarma göstergesi görünüm sekmelerinin altına çizilir
        var sh = $('score-home'), sa = $('score-away'), mt = $('match-time'), hsT = sh ? sh.textContent : '0', asT = sa ? sa.textContent : '0';
        if (H.hs !== hsT) { if (H.hs != null) hudPop($('ab-hs')); H.hs = hsT; setTxt($('ab-hs'), hsT); }
        if (H.as !== asT) { if (H.as != null) hudPop($('ab-as')); H.as = asT; setTxt($('ab-as'), asT); }
        if (mt) setTxt($('ab-hud-clock'), mt.textContent);
        // dönem (yalnız devre arası İY / maç sonu MS) ve ilave dakika (+N: 45. ya da 90. dakikadan sonra oynanan dakika)
        var pt = $('period-tag'), per = PER_SHORT[pt ? pt.textContent : ''] || '', add = '';
        setTxt($('ab-hud-period'), per);
        if (sim && !per && !sim.finished) { var tt = sim.t * CK, lim = sim.half === 2 ? 90 : 45; if (tt > lim * 60 + .5) add = '+' + (Math.floor(tt / 60) - lim + 1); }
        var ad = $('ab-hud-add'); if (ad) { if (ad.hidden !== !add) ad.hidden = !add; setTxt(ad, add); }
        var rh = matchData.redCardCountH || 0, ra = matchData.redCardCountA || 0, rk = rh + '|' + ra;
        if (H.rk !== rk) { H.rk = rk; $('ab-hud-rc-h').innerHTML = rcHTML(rh); $('ab-hud-rc-a').innerHTML = rcHTML(ra); }
        // alt yazı şeridi: canlı anlatım satırını 5,2 sn gösterir
        var lt = $('live-ticker-text'), line = lt ? lt.textContent : '';
        if (line && line !== H.lastLine) { H.lastLine = line; H.commTxt.textContent = line; H.lineUntil = now + 5200; }
        H.comm.classList.toggle('on', !!line && now < H.lineUntil);
        // duran top bayrağı: canlı oyunda (tekrar, VAR ve gol kutlaması dışında)
        var dd = sim && sim.mode === 'dead' ? sim.dead : null, lab = dd ? DEAD_LAB[dd.kind] : null;
        if (S.hold === 'v7ht' && V7.half) lab = V7.half.fin ? 'MAÇ SONU' : 'DEVRE ARASI';      // [v187]
        var show = !!(lab && S.hold !== 'replay' && S.hold !== 'goal' && !S.vs);
        if (show && H.dead.textContent !== lab) H.dead.textContent = lab;
        H.dead.classList.toggle('on', show);
        // gol alt bandı: kutlama süresince (sonra gol tekrarı ya da oyun)
        var gi = S.hold === 'goal' && !S.goalPend ? S.goalInfo : null, wrap = H.top.parentNode;      // [v139]
        if (gi) {
            var gk = gi.team + '|' + gi.scorer + '|' + gi.min + '|' + hsT + asT;
            if (H.gk !== gk) {
                H.gk = gk; var t = teamObj(gi.team), crest = ''; try { crest = renderTeamCrestHTML(t, 34); } catch (e) { }
                H.goal.className = 'ab-hud-goal ' + (gi.team === 0 ? 'h' : 'a');
                H.goal.innerHTML = '<div class="gb"><span class="gb-tag"><span class="ab-hud-crest">' + crest + '</span>GOL</span><span class="gb-main"><span class="gb-p">' + esc(gi.scorer >= 0 ? nameOf(gi.scorer) : '') + (gi.own ? ' (k.k.)' : gi.pen ? ' (P)' : '') + '</span><span class="gb-s">' + gi.min + '\' · ' + esc(t.name) + '</span></span>' +
                    '<span class="gb-sc"><small>' + esc(teamCode(matchData.h)) + '</small>' + esc(hsT) + '<span class="sep">-</span>' + esc(asT) + '<small>' + esc(teamCode(matchData.a)) + '</small></span></div>';
            }
        }
        var cb = !gi && S.cardBand && S.cardBand.sid !== -1 && performance.now() < S.cardBand.until && S.hold !== 'replay' ? S.cardBand : null;      /* [v186] kart alt bandı (gol bandının biçimiyle) */
        if (cb) { var ck = 'k|' + cb.kind + '|' + cb.id + '|' + cb.min; if (H.gk !== ck) { H.gk = ck; var ct = teamObj(cb.team), ccr = ''; try { ccr = renderTeamCrestHTML(ct, 34); } catch (e) { }
            H.goal.className = 'ab-hud-goal ' + (cb.team === 0 ? 'h' : 'a');
            H.goal.innerHTML = '<div class="gb"><span class="gb-tag" style="background:' + (cb.kind === 'R' ? '#d6262b;color:#fff' : '#f5c518;color:#111') + '"><span class="ab-hud-crest">' + ccr + '</span>' + (cb.kind === 'R' ? 'KIRMIZI KART' : 'SARI KART') + '</span><span class="gb-main"><span class="gb-p">' + esc(nameOf(cb.id)) + '</span><span class="gb-s">' + cb.min + '\' · ' + esc(ct.name) + '</span></span></div>'; } }
        else if (!gi && H.gk && H.gk.charAt(0) === 'k') H.gk = '';
        var vb7 = !gi && !cb && V7.band && performance.now() < V7.band.until && S.hold !== 'replay' ? V7.band : null;      /* [v187] değişiklik / avantaj / VAR kararı alt bandı */
        if (vb7) { var vk7 = 'v|' + vb7.kind + '|' + (vb7.inN || vb7.txt || '') + '|' + (vb7.min || ''); if (H.gk !== vk7) { H.gk = vk7; H.goal.className = 'ab-hud-goal ' + (vb7.team === 1 ? 'a' : 'h'); H.goal.innerHTML = v7BandHTML(vb7); } }
        else if (!gi && !cb && H.gk && H.gk.charAt(0) === 'v') H.gk = '';
        if (H.goal.classList.contains('on') !== !!(gi || cb || vb7)) H.goal.classList.toggle('on', !!(gi || cb || vb7));
        if (wrap && wrap.classList.contains('ab-goal') !== !!gi) wrap.classList.toggle('ab-goal', !!gi);
    }
    function bcastHudPills() {
        var H = bcastHudEnsure(); if (!H || !matchData.h || !matchData.a) return;
        var parts = ['h', 'a'], html = '';
        parts.forEach(function (side, si) {
            if (si === 1) html += '<span class="ab-hud-div"></span>';
            var t = matchData[side]; if (!t || !t.squad) return;
            t.squad.forEach(function (id) {
                var p = getPlayerFromId(id); if (!p) return;
                var r = (matchData.ratings && matchData.ratings[id] !== undefined) ? matchData.ratings[id] : 6.5;
                var off = isSentOff(id);
                html += '<span class="ab-hud-pp' + (off ? ' off' : '') + '" title="' + esc(p.name) + '"><span class="pos">' + esc(p.lbl || p.pos) + '</span><span class="rt ' + ratingClass(r) + '">' + r.toFixed(1) + '</span></span>';
            });
        });
        if (H.pills !== html) { H.pills = html; H.bottom.innerHTML = html; }                       // [opt] 22 hap yalnız içerik değişince yeniden kurulur
    }

    /* ================= [v187] ANİMASYON VE YAYIN — yalnız görüntü (motor, kayıt, MR, olaylar ve sonuç değişmez) =================
       Faul türleri (tutma, itme, dirsek, tekme, çelme, yüksek ayak, kafa çarpışması, arkadan / önden / yandan kayarak) motorun FOUL anındaki
       konum, hız ve yönden (gerekirse aynı adımdaki kart sertliğinden) seçilir; faul yapana tür hareketi, kurbana uygun düşüş (sekme, yuvarlanma,
       yüz / bacak tutma, yerde kalma, kalkış). Kart: oyuncu hakeme yürür (≤ 2 m/sn), kart ≤ 3 m'de, itiraz eden 1–3 oyuncu; hakem düdük ve kol
       işaretleri (serbest vuruş yönü, korner, aut, penaltı noktası, avantaj). Top görevlileri: çizgiyi geçen top yolunda durur, görevli yeni topu
       atar ve eskisini toplar. Jestler: kaçan şut, ofsayt itirazı, gol sevinci çeşitleri, yenilen golde hayal kırıklığı, korner itişmesi, kalecinin
       barajı yönetmesi. Değişiklik sahnesi (tabela, el sıkışma, sahaya koşu), devre / maç sonu tünele yürüyüş ve tokalaşma, faul tekrarı.
       Hepsi görüntü saatinde ve seçili hızla (2x/4x oranlı kısalır); Kritik ana atla / Sonuna simüle et / FM özeti / 2B bunları atlar. */
    var V7 = { on: 1, gv: [], px: new Float32Array(22), py: new Float32Array(22), pOk: 0, busy: new Float64Array(22), xa: [], xb: [], dl: null, bb: null, sub: null, subQ: [], band: null, refP: null, half: null,
        foul: null, rpq: null, rpT: -99, obSeen: null, lastG: null, cel: null, fkGk: null, corJ: null, lab: null, cnt: {} };
    G.__v7 = V7;      // ölçüm / tanı
    var V7_FN = ['', 'tutma', 'itme', 'dirsek', 'tekme', 'çelme', 'yüksek ayak', 'kafa çarpışması', 'arkadan kayarak', 'önden kayarak', 'yandan kayarak'];
    function v7Now() { return performance.now(); }
    function v7Ls() { return Math.max(.5, liveSpeed()); }
    function v7Cnt(k) { V7.cnt[k] = (V7.cnt[k] || 0) + 1; sqLog('v7:' + k); }
    function v7Free(id, t) { return !(V7.busy[id] > t) && !(OA.fall[id] > t) && !(OA.gnd[id] > t); }
    function v7Act(id, k, t0, tc, d, until) { gkIssue(1, id, k, tc, t0, d); V7.busy[id] = Math.max(V7.busy[id], until != null ? until : tc + 1); }
    function v7Gest(id, md, t0, dur, tx, ty, h, pow) { if (id < 0 || !S.sim || !S.sim.players[id] || S.sim.players[id].off) return; if (md >= 30) { V8B.gN = (V8B.gN || 0) + 1; V8B.gL = [id, md, t0]; }      /* [v188] ölçüm: son yeni jest */ v7Act(id, 20, t0, t0, oaD(OA.tmp, tx || 0, ty || 0, md, dur, pow || 0, h || 1, 0, 0, 0, 0, 0), t0 + dur); }
    /* --- görünüm hedefi: oyuncunun GÖRÜNEN konumu hedefe yürür (ışınlanma yok), bırakılınca motor konumuna yürüyerek döner --- */
    function v7Go(id, tx, ty, vmax, dur, o) { var g = V7.gv[id] || (V7.gv[id] = { x: NaN, y: NaN }); g.tx = tx; g.ty = ty; g.v = vmax; g.until = v7Now() + dur * 1000 / v7Ls(); g.fol = o && o.fol || 0; g.stop = o && o.stop || 0; g.fcx = o && o.fcx != null ? o.fcx : NaN; g.fcy = o && o.fcy != null ? o.fcy : NaN; g.hide = 0; return g; }
    function v7GvApply(v, dt) {
        var now = v7Now(), h = Math.min(.1, dt || .016) * v7Ls(), i, g;
        for (i = 0; i < 22; i++) {
            g = V7.gv[i]; if (!g) continue;
            var bx = v.x[i], by = v.y[i]; if (!(bx > -20) && !g.keep) { V7.gv[i] = null; continue; }
            if (!(g.x === g.x)) { g.x = V7.pOk && V7.px[i] > -20 ? V7.px[i] : bx; g.y = V7.pOk && V7.px[i] > -20 ? V7.py[i] : by; }
            var act = now < g.until, tx = act ? g.tx : bx, ty = act ? g.ty : by;
            if (act && g.fol === 1 && v.rx != null) { var rx = g.x - v.rx, ry = g.y - v.ry, rl = Math.hypot(rx, ry) || 1; tx = v.rx + rx / rl * g.stop; ty = v.ry + ry / rl * g.stop; }      // hakeme yürür, önünde durur
            var bv = g.bpx === g.bpx ? Math.hypot(bx - g.bpx, by - g.bpy) / Math.max(1e-3, h) : 0; g.bpx = bx; g.bpy = by;
            var dx = tx - g.x, dy = ty - g.y, dl = Math.hypot(dx, dy), vm = act ? g.v : Math.max(2.6, Math.min(8, bv + 1.2)), st = vm * h;
            if (!act && dl < .05) { V7.gv[i] = null; continue; }
            if (dl > st) { g.x += dx / dl * st; g.y += dy / dl * st; } else { g.x = tx; g.y = ty; }
            v.x[i] = g.x; v.y[i] = g.y;
            if (act && dl > .25) { v.fx[i] = dx / dl; v.fy[i] = dy / dl; }
            else if (act && g.fol === 1 && v.rx != null) { var fx = v.rx - g.x, fy = v.ry - g.y, fl = Math.hypot(fx, fy) || 1; v.fx[i] = fx / fl; v.fy[i] = fy / fl; }
            else if (act && g.fcx === g.fcx) { var gx = g.fcx - g.x, gy = g.fcy - g.y, gl = Math.hypot(gx, gy) || 1; v.fx[i] = gx / gl; v.fy[i] = gy / gl; }
        }
    }
    /* --- faul türü: savunmacının kurbana göre yeri (arkadan / önden / yandan), kurbanın hızı, topun yüksekliği, kayma, hava topu; aynı adımda gelen kart sertliği --- */
    function v7FoulGeo(dp, op) {
        var osp = Math.hypot(op.vx, op.vy), ux = osp > 1 ? op.vx / osp : op.fx, uy = osp > 1 ? op.vy / osp : op.fy, ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
        var rx = dp.x - op.x, ry = dp.y - op.y, rl = Math.hypot(rx, ry) || 1;
        return { osp: osp, ux: ux, uy: uy, rx: rx / rl, ry: ry / rl, rl: rl, ca: (rx * ux + ry * uy) / rl };
    }
    function v7FoulKind(ev, m, dp, op, g) {
        var h = oaH(ev.t + .37, ev.p * 3 + ev.p2), bz = S.prevB && S.prevB.z || 0;
        if (m.air) return g.ca > .3 && h < .45 ? 7 : h < .55 ? 3 : 2;                                       // hava topu: kafa çarpışması (yüz yüze) / dirsek / sırttan itme
        if (m.slide) return g.ca < -.3 ? 8 : g.ca > .35 ? 9 : 10;
        if (bz > .75 && g.ca > -.2) return 6;                                                             // top havadayken öne uzanan ayak
        if (m.pen) return g.ca < -.3 ? (h < .6 ? 5 : 2) : g.ca > .4 ? (h < .55 ? 4 : 5) : (h < .5 ? 5 : 1);
        if (g.ca < -.3) return g.osp > 4.2 ? (h < .55 ? 5 : 2) : (h < .6 ? 1 : 2);                         // arkadan: hızlıyken çelme / itme, yavaşken forma çekme
        if (g.ca > .45) return h < .5 ? 4 : 5;                                                            // önden: tekme / çelme
        return h < .38 ? 2 : h < .7 ? 5 : 1;                                                              // yandan: omuz itmesi / çelme / tutma
    }
    function v7FoulIssue(sim, ev, m, k, dp, op, sev) {
        var d = OA.tmp, g = v7FoulGeo(dp, op), h = oaH(ev.t, ev.p2), osp = g.osp, ux = g.ux, uy = g.uy, rx = g.rx, ry = g.ry;
        var ty = 2, fx = -rx, fy = -ry, vr = 0, lie = (m.pen ? .9 : .5) + 1.0 * h + (sev || 0), dly = .45;
        switch (k) {
            case 1: ty = 3; vr = 5; fx = rx; fy = ry; lie *= .7; break;                                    // tutma: geriye çekilir, sırtüstü
            case 2: ty = g.ca < -.3 ? 1 : 2; fx = -rx * .6 + ux * .4; fy = -ry * .6 + uy * .4; break;       // itme: arkadan öne yüzüstü, yandan yana
            case 3: ty = h < .5 ? 3 : 2; vr = 2; lie += .6; break;                                           // dirsek: yüzünü tutar
            case 4: ty = 2; vr = 1; lie += .4; break;                                                        // tekme: seker, bacağını tutar
            case 5: ty = 1; vr = osp > 4.5 ? 4 : 0; fx = ux * .8 - rx * .2; fy = uy * .8 - ry * .2; break;  // çelme: öne düşer, hızlıysa yuvarlanır
            case 6: ty = 3; vr = 2; lie += .5; break;                                                        // yüksek ayak: geriye düşer, göğsünü / yüzünü tutar
            case 7: ty = 3; vr = 6; lie += .5; dly = .55; break;                                             // kafa çarpışması: havadan sırtüstü, başını tutar
            case 8: ty = 1; vr = osp > 3.5 ? 4 : 3; fx = ux; fy = uy; dly = .5; break;                       // arkadan kayma: öne takla
            case 9: ty = 1; vr = 0; fx = ux; fy = uy; dly = .5; break;                                       // önden kayma: bacağın üstünden öne
            case 10: ty = 2; vr = 3; dly = .5; break;                                                        // yandan kayma: yana, bacağını tutar
        }
        var fl = Math.hypot(fx, fy) || 1;
        if (m.adv) gkIssue(1, ev.p2, 13, ev.t + .08, ev.t + .08, oaD(d, fx / fl, fy / fl, .7, .5, 0, 0, 0, 0, 0, 0, 0));
        else { gkIssue(1, ev.p2, 14, ev.t + dly, ev.t - .02, oaD(d, fx / fl, fy / fl, ty, lie, osp, vr, 0, 0, 0, 0, 0)); OA.fall[ev.p2] = ev.t + dly + .05 + Math.max(.25, Math.min(3.2, lie)) + (vr === 4 ? .9 : 0) + (vr === 1 ? .2 : 0) + .9; }
        OA.fpx[ev.p] = dp.x; OA.fpy[ev.p] = dp.y;
        var rk5 = .55, side = oaSideY(oaYaw(dp), dp.x, dp.y, op.x, op.y);
        if (k >= 8) {      /* kayarak: arkadan rakibin ayağına (top ileride), önden topa / ayağa, yandan çapraz */
            var sx = op.x + ux * (k === 8 ? .45 : .15), sy = op.y + uy * (k === 8 ? .45 : .15);
            gkIssue(1, ev.p, 12, ev.t + .1, ev.t - .03, oaD(d, sx, sy, op.x, op.y, Math.hypot(dp.vx - op.vx, dp.vy - op.vy), 3, side, 0, 0, dp.vx, dp.vy)); OA.gnd[ev.p] = ev.t + 1.1; rk5 = 1.25;
        } else {
            gkIssue(1, ev.p, 19, ev.t + (k === 7 ? .05 : .06), ev.t - (k === 4 || k === 6 ? .32 : k === 7 ? .4 : .26), oaD(d, op.x + ux * Math.min(osp, 5) * .06, op.y + uy * Math.min(osp, 5) * .06, k, side, Math.hypot(dp.vx - op.vx, dp.vy - op.vy), op.vx, op.vy, 0, 0, dp.vx, dp.vy));
            rk5 = [0, 1.0, .75, .7, .7, .75, .85, 1.0][k];
            if (k === 7 && !m.adv) { gkIssue(1, ev.p, 14, ev.t + .55 + .35, ev.t + .7, oaD(OA.tmp, rx, ry, 3, .6 + .6 * h, 1, 6, 0, 0, 0, 0, 0)); rk5 = 2.4; }      // kafa çarpışmasında faul yapan da düşer
        }
        if (!(k === 7 && !m.adv)) gkIssue(1, ev.p, 15, ev.t + .4 + rk5, ev.t + .08 + rk5, oaD(OA.tmp, op.x, op.y, h < .62 ? 1 : 2, 1.9, 0, 0, 0, 0, 0, 0, 0));
        OA.react[ev.p] = ev.t + rk5; V7.busy[ev.p] = ev.t + rk5 + 2; V7.busy[ev.p2] = OA.fall[ev.p2] || ev.t + 1;
    }
    oaFoulEv = function (sim, ev, m) {
        var dp = sim.players[ev.p], op = sim.players[ev.p2]; if (!dp || !op) return;
        var g = v7FoulGeo(dp, op), k = v7FoulKind(ev, m, dp, op, g);
        V7.foul = { t: ev.t, p: ev.p, p2: ev.p2, k: k, x: op.x, y: op.y, pen: !!m.pen, adv: !!m.adv, card: '', ev: ev, m: m, now: v7Now(), sid: S.sid };
        sqLog('faul:' + V7_FN[k]); v7Cnt('faul_' + k);
        v7FoulIssue(sim, ev, m, k, dp, op, 0);
    };
    var oaCardEv0_ = oaCardEv;
    oaCardEv = function (sim, ev) {
        var F = V7.foul, m = ev.meta || {};
        if (F && F.sid === S.sid && F.p === ev.p && Math.abs(ev.t - F.t) < .05 && !F.card) {      /* aynı adımdaki kart: sertliğe göre tür ve yerde kalma süresi */
            F.card = m.card || 'Y'; var dp = sim.players[F.p], op = sim.players[F.p2], k = F.k;
            if (dp && op) {
                if (F.card === 'R' && m.why === 'sert' && (k === 1 || k === 2 || k === 5)) k = F.m.air ? 3 : (S.prevB && S.prevB.z > .5 ? 6 : 4);
                if (k !== F.k) { F.k = k; sqLog('faul:' + V7_FN[k] + ':kart'); }
                v7FoulIssue(sim, F.ev, F.m, k, dp, op, F.card === 'R' ? 1.3 : .7);
            }
        }
        return oaCardEv0_(sim, ev);
    };
    /* --- olaylar (sim saatinde; gecikmeli gösterimde olay anında) --- */
    function v7Event(ev, m) {
        if (!V7.on || !S.sim || !S.r3 || !S.use3) return; var sim = S.sim, t = ev.t, i, p;
        switch (ev.type) {
            case 'SUB':      /* çıkan oyuncunun görünümü yuva yeni oyuncuya geçmeden önce saklanır; sahne bir sonraki ölü topta */
                try { if (S.r3.subSnap && S.r3.subSnap(ev.p)) { if (S.r3.subHold) S.r3.subHold(ev.p, true); V7.subQ.push({ id: ev.p, team: ev.team, t: t, outN: m.outName || '', inN: m.inName || nameOf(ev.p), sid: S.sid }); } } catch (e) { }
                break;
            case 'OFF': case 'POST':
                if (m.teammate || ev.p < 0 || !sqOn()) break;
                if (v7Free(ev.p, t + .5)) v7Gest(ev.p, (m.xg || 0) >= .08 || ev.type === 'POST' ? 1 : 17, t + .55, 2.1);
                for (i = 0; i < 22; i++) { p = sim.players[i]; if (i === ev.p || p.off || p.team !== ev.team || p.role === 'GK') continue; if (Math.hypot(p.x - sim.players[ev.p].x, p.y - sim.players[ev.p].y) < 14 && (m.xg || 0) >= .15 && v7Free(i, t + .7) && oaH(t, i) < .6) { v7Gest(i, oaH(i, t) < .5 ? 1 : 17, t + .75, 1.8); break; } }
                break;
            case 'SAVE':
                if (ev.p2 >= 0 && (m.xg || 0) >= .12 && sqOn() && v7Free(ev.p2, t + .6)) v7Gest(ev.p2, oaH(t, ev.p2) < .5 ? 1 : 18, t + .65, 1.9);
                break;
            case 'OFFSIDE':
                if (!sqOn()) break;
                if (v7Free(ev.p, t + .9)) v7Gest(ev.p, oaH(t, ev.p) < .7 ? 4 : 1, t + .95, 1.8);
                for (i = 0; i < 22; i++) { p = sim.players[i]; if (p.off || p.team === ev.team || p.role === 'GK') continue; if (Math.abs(p.x - ev.x) < 12 && oaH(t, i * 7) < .35 && v7Free(i, t + .1)) { v7Gest(i, 6, t + .12, 1.5, 0, 0, oaH(i, t) < .5 ? 1 : -1); break; } }
                break;
        }
    }
    /* --- hakem işaretleri (düdükten sonra): serbest vuruş yönü, korner, aut, penaltı noktası, taç yönü --- */
    function v7RefSig(pose, dx, dy, delayMs, durMs) { var now = v7Now(), ls = v7Ls(), dl = Math.hypot(dx, dy) || 1; V7.refP = { pose: pose, t0: now + (delayMs || 0) / ls, until: now + ((delayMs || 0) + (durMs || 1700)) / ls, fx: dx / dl, fy: dy / dl, wh: now + Math.max(0, (delayMs || 0) - 380) / ls }; }
    function v7RefEv(ev) {
        if (ev.type === 'GOAL') sqLog('gol:' + (S.watch === 'fm' && S.fm ? S.fm.ph + ':' + V7W.lvl : S.watch), ev.t);
        if (!V7.on || !sqOn() || !S.sim) return; var sim = S.sim, m = ev.meta || {}, d;
        if (ev.type === 'FOUL' && !m.adv) { var ls7 = v7Ls(); V7.fcam = { t0: v7Now() + 550 / ls7, until: v7Now() + 3300 / ls7, p: ev.p, p2: ev.p2, sid: S.sid }; }      // düdükten sonra yakın plan: düşen oyuncu ve faul yapan
        if (ev.type === 'FOUL' && !m.adv) { var tf = 1 - ev.team, dir = sim.teams[tf] ? sim.teams[tf].dir : 1; if (m.pen) { var gx = sim.atkGoalX(tf); v7RefSig('pen', gx - dir * 11 - (S.ref ? S.ref.x : 0), PH / 2 - (S.ref ? S.ref.y : 0), 450, 2000); } else v7RefSig('fk', dir, 0, 450, 1700); }
        else if (ev.type === 'CORNER') { d = { x: ev.x - (S.ref ? S.ref.x : 0), y: ev.y - (S.ref ? S.ref.y : 0) }; v7RefSig('corner', d.x, d.y, 250, 1800); }
        else if (ev.type === 'THROWIN') { var dt = sim.teams[ev.team] ? sim.teams[ev.team].dir : 1; v7RefSig('fk', dt, 0, 250, 1300); }
        else if (ev.type === 'OFF' && !(m.teammate)) { var dd = sim.mode === 'dead' ? sim.dead : null; if (dd && dd.kind === 'goalkick') v7RefSig('gk', dd.x - (S.ref ? S.ref.x : 0), dd.y - (S.ref ? S.ref.y : 0), 350, 1600); }
    }
    /* --- top görevlileri: altı görevli (iki yan çizgide ikişer, iki kale arkasında); boşta yedek topu elde tutar --- */
    var V7_BB = [[26, -3.4, 0], [79, -3.4, 0], [26, PH + 3.7, 1], [79, PH + 3.7, 1], [-3.7, PH / 2 + 11, 2], [PW + 3.7, PH / 2 - 11, 3]];
    function v7BBInit() { V7.bb = V7_BB.map(function (q) { var fx = q[2] === 2 ? 1 : q[2] === 3 ? -1 : 0, fy = q[2] === 0 ? 1 : q[2] === 1 ? -1 : 0; return { x: q[0], y: q[1], hx: q[0], hy: q[1], fx: fx, fy: fy, hfx: fx, hfy: fy, s: q[2], hold: 1, tx: q[0], ty: q[1], v: 0, g: 0, gt: 0, gT: 0 }; }); }
    function v7BBStep(h) {
        var B = V7.bb, i, b; if (!B) return;
        for (i = 0; i < B.length; i++) {
            b = B[i]; var dx = b.tx - b.x, dy = b.ty - b.y, dl = Math.hypot(dx, dy), st = (b.v || 1.5) * h;
            if (dl > .03) { if (dl > st) { b.x += dx / dl * st; b.y += dy / dl * st; } else { b.x = b.tx; b.y = b.ty; } if (dl > .2) { b.fx = dx / dl; b.fy = dy / dl; } }
            else if (b.ffx != null) { b.fx = b.ffx; b.fy = b.ffy; }
            if (b.g) { b.gt += h; if (b.gt > b.gT) { b.g = 0; b.gt = 0; } }
        }
    }
    function v7BBOut() { var B = V7.bb, L = V7.xa, i; if (!B) return; for (i = 0; i < B.length; i++) { var b = B[i], q = L[L.length] = { k: 0, id: -1, x: b.x, z: b.y, fx: b.fx, fz: b.fy, g: b.g, gt: b.gt, gh: 1, hold: b.hold }; } }
    /* çizgiyi geçen topun 1,3 sn'lik yolu (outBallLive ile aynı fizik) */
    function v7ObAt(o, e) {
        var x = o.x, y = o.y, z = o.z, vx = o.vx, vy = o.vy, vz = o.vz, hh = .02, n = Math.ceil(e / hh), i;
        for (i = 0; i < n; i++) { var q = Math.min(hh, e - i * hh); if (z > .01 || vz > 0) { vz -= 9.81 * q; z += vz * q; if (z < 0) { z = 0; vz = vz < -1.2 ? -vz * .55 : 0; vx *= .85; vy *= .85; } }
            else { var sp = Math.hypot(vx, vy); if (sp > 1e-3) { var ns = Math.max(0, sp - (.9 + .02 * sp * sp) * q); vx *= ns / sp; vy *= ns / sp; } }
            x += vx * q; y += vy * q; if (x < -6.2) { x = -6.2; vx = Math.abs(vx) * .15; } else if (x > PW + 6.2) { x = PW + 6.2; vx = -Math.abs(vx) * .15; } if (y < -5.2) { y = -5.2; vy = Math.abs(vy) * .15; } else if (y > PH + 5.2) { y = PH + 5.2; vy = -Math.abs(vy) * .15; } }
        return { x: x, y: y, z: z };
    }
    /* yeni top teslimi: çizgi dışındaki top durur; en uygun görevli yerine koşar, yedek topu atış / köşe / aut noktasına atar; sonra eski topu alıp yerine döner */
    function v7DlvStart(sim, d, ob) {
        if (!V7.bb) v7BBInit();
        var tx = d.x, ty = d.y, k = d.kind, o = { bx: NaN, by: NaN }, i, best = -1, bd = 1e9;
        if (k === 'corner') { try { spCornerSpot(sim, d, o); } catch (e) { } if (o.bx === o.bx) { tx = o.bx; ty = o.by; } else { var sp2 = [0, 0]; spSpot(d, sp2); tx = sp2[0]; ty = sp2[1]; } }
        var rest = v7ObAt(ob, 1.3), sideY = ty < PH / 2 ? -1 : 1, end = tx < PW / 2 ? 2 : 3;
        for (i = 0; i < V7.bb.length; i++) {
            var b = V7.bb[i], ok = k === 'throw' ? b.s === (sideY < 0 ? 0 : 1) : k === 'goalkick' ? b.s === end : (b.s === end || b.s === (sideY < 0 ? 0 : 1));
            if (!ok) continue; var dd = Math.hypot(b.x - tx, b.y - ty); if (dd < bd) { bd = dd; best = i; }
        }
        if (best < 0) return;
        var sx, sy;      // görevlinin atış yeri (çizgi dışında, noktaya yakın)
        if (k === 'throw') { sx = Math.max(-2, Math.min(PW + 2, tx + (tx < PW / 2 ? 2.2 : -2.2))); sy = sideY < 0 ? -2.4 : PH + 2.4; }
        else if (k === 'goalkick') { sx = tx < PW / 2 ? -2.6 : PW + 2.6; sy = ty + (ty < PH / 2 ? 3.5 : -3.5); }
        else { sx = tx < PW / 2 ? -2.6 : PW + 2.6; sy = sideY < 0 ? 3.8 : PH - 3.8; }
        var b0 = V7.bb[best]; b0.tx = sx; b0.ty = sy; b0.v = 4.2; b0.ffx = tx - sx; b0.ffy = ty - sy; var fl = Math.hypot(b0.ffx, b0.ffy) || 1; b0.ffx /= fl; b0.ffy /= fl;
        V7.dl = { sid: S.sid, d: d, k: k, i: best, t: 0, ph: 0, tx: tx, ty: ty, rest: rest, ob: ob, toss: -1, T: 0, x0: 0, y0: 0, z0: 0, done: 0 };
        v7Cnt('teslim_' + k);
    }
    function v7DlvStep(v, h) {      // h: görüntü saniyesi (hızla ölçekli) · dönüş: görünen topu bu kare değiştirdi mi
        var D = V7.dl, sim = S.sim; if (!D) return false;
        if (D.sid !== S.sid || !sqOn() || S.hold) { if (D.ph < 3) V7_DLV_END(); V7.dl = null; return false; }
        D.t += h; var b = V7.bb[D.i];
        if (D.ph === 0) {      // çizgiyi geçen top yolunda (outBallLive); bitince eski top durduğu yerde kalır, görevlinin elindeki yeni top görünen top olur
            if (SQ.ob && D.t < 1.7) { D.lx = v.bx; D.ly = v.by; D.lz = v.bz; return false; }
            D.ph = 1; if (D.lx === D.lx && D.lx != null) { D.rest = { x: D.lx, y: D.ly, z: 0 }; } V7.xbOld = [D.rest.x, .17, D.rest.y]; b.hold = 0;
        }
        if (D.ph === 1) {      // görevli yedek topu elinde, atış yerine varıyor
            var arr = Math.hypot(b.tx - b.x, b.ty - b.y) < .25;
            if (arr || D.t > 2.1) { D.ph = 2; D.T = 0; D.x0 = b.x + b.fx * .32; D.y0 = b.y + b.fy * .32; D.z0 = .95; var dd = Math.hypot(D.tx - D.x0, D.ty - D.y0); D.dur = Math.max(.45, Math.min(.95, dd / 7.5)); b.g = 23; b.gt = 0; b.gT = .7; }
            else { v.bx = b.x + b.fx * .32; v.by = b.y + b.fy * .32; v.bz = .78; v.owner = -1; return true; }
        }
        if (D.ph === 2) {      // atış yayı (tepe ~1,5 m), noktaya iner, küçük sekme
            D.T += h; var u = Math.min(1, D.T / D.dur), ap = Math.max(.6, Math.min(2.2, D.dur * 2.2));
            v.bx = D.x0 + (D.tx - D.x0) * u; v.by = D.y0 + (D.ty - D.y0) * u; v.bz = Math.max(0, D.z0 * (1 - u) + 4 * ap * u * (1 - u) - .17 * u);
            if (u >= 1) { var e2 = D.T - D.dur; v.bz = e2 < .28 ? .14 * Math.sin(Math.PI * e2 / .28) : 0; if (e2 > .32) { D.ph = 3; V7_DLV_END(); b.tx = D.rest.x; b.ty = D.rest.y; b.v = 3.2; b.ffx = null; } }
            v.owner = -1; return true;
        }
        if (D.ph === 3) {      // eski topu almaya gider (uzaksa yerine döner)
            var far = Math.hypot(D.rest.x - b.hx, D.rest.y - b.hy) > 30;
            if (far) { V7.xbOld = null; b.hold = 1; b.tx = b.hx; b.ty = b.hy; b.v = 1.6; b.ffx = b.hfx; b.ffy = b.hfy; V7.dl = null; return false; }
            if (Math.hypot(b.x - D.rest.x, b.y - D.rest.y) < .55) { D.ph = 4; b.g = 24; b.gt = 0; b.gT = .8; D.T = 0; }
            return false;
        }
        if (D.ph === 4) { D.T += h; if (D.T > .45 && V7.xbOld) { V7.xbOld = null; b.hold = 1; } if (D.T > .8) { b.tx = b.hx; b.ty = b.hy; b.v = 1.6; b.ffx = b.hfx; b.ffy = b.hfy; V7.dl = null; } }
        return false;
    }
    function V7_DLV_END() { V7.dlv = 0; }
    /* --- değişiklik sahnesi: dördüncü hakem tabelayı kaldırır, çıkan oyuncu kenara gelir, el sıkışırlar, giren sahaya koşar (kesmeyle) --- */
    function v7SubStart(q) {
        var now = v7Now(), sim = S.sim; try { if (S.r3.subHold) S.r3.subHold(q.id, false); } catch (e) { }
        V7.sub = { q: q, t: 0, sid: S.sid, ox: PW / 2 - .5, oy: PH - 4.6, ix: PW / 2 - 6.1, iy: PH + 1.05, ph: 0 };      // VAR monitörü (orta çizgide) kadraja girmesin: dördüncü hakemin solunda
        V7.band = { kind: 'sub', team: q.team, inN: q.inN, outN: q.outN, min: minOf(sim.t), until: now + 5500 / v7Ls() };
        V7.sub.w0 = now; S.hold = 'v7sub'; S.last = now; r3Cut(); sqLog('degisiklik'); v7Cnt('degisiklik');
    }
    function v7SubStep(h) {
        var U = V7.sub; if (!U) return; if (U.sid !== S.sid) { V7.sub = null; if (S.hold === 'v7sub') S.hold = null; return; }
        U.t += h; var t = U.t, ox, oy, ix, iy, og = 0, ig = 0, ofx = -1, ofy = .3, ifx = .3, ify = -1;
        var hs = 2.7;      // çıkan oyuncu tabelaya varır
        var oT = Math.min(1, t / hs), oX = PW / 2 - 5.25; ox = U.ox + (oX - U.ox) * oT; oy = U.oy + (PH + .35 - U.oy) * oT;
        if (t < hs) { ofx = (oX - U.ox); ofy = (PH + .35 - U.oy); }
        ix = U.ix; iy = U.iy;
        if (t >= hs - .4 && t < hs + 1.1) { ig = 7; og = 7; ifx = ox - ix; ify = oy - iy; ofx = -ifx; ofy = -ify; }      // el sıkışma
        if (t >= hs + 1.1) { var r = Math.min(1, (t - hs - 1.1) / 1.6); ix = U.ix + (PW / 2 - 9 - U.ix) * r; iy = U.iy + (PH - 7.5 - U.iy) * r; ifx = -.4; ify = -1; ox += (t - hs - 1.1) * 1.3; ofx = 1; ofy = .35; }
        V7.xa.push({ k: 2, id: U.q.id, x: ox, z: oy, fx: ofx, fz: ofy, g: og, gt: t, gh: 1, hold: 0 });
        V7.xa.push({ k: 1, id: U.q.id, x: ix, z: iy, fx: ifx, fz: ify, g: ig, gt: t, gh: 1, hold: 0 });
        V7.scam = { eye: [PW / 2 - 8.6 + .5 * Math.min(1, t / 5), 2.35, PH + 10], at: [PW / 2 - 4.6, 1.15, PH + .2], fov: 40 };
        if (t > hs + 2.8) { V7.sub = null; if (S.hold === 'v7sub') { S.hold = null; S.last = v7Now(); } if (S.r3) { S.r3.cutCam = null; S.r3.v7Cut = 0; } r3Cut(); }
    }
    /* --- devre arası / maç sonu: oyuncular tokalaşır, tünele yürür (hakemle) --- */
    function v7HalfStart(fin) {
        var sim = S.sim, i; V7.half = { fin: fin, t: 0, sid: S.sid, x: new Float32Array(22), y: new Float32Array(22), rx: S.ref ? S.ref.x : PW / 2, ry: S.ref ? S.ref.y : PH / 2, pair: new Int8Array(22).fill(-1), dur: fin ? 7.2 : 5.6 };
        for (i = 0; i < 22; i++) { V7.half.x[i] = V7.pOk ? V7.px[i] : sim.players[i].x; V7.half.y[i] = V7.pOk ? V7.py[i] : sim.players[i].y; }
        if (fin) for (i = 0; i < 11; i++) { if (sim.players[i].off) continue; var bj = -1, bd = 12; for (var j = 11; j < 22; j++) { if (sim.players[j].off || V7.half.pair[j] >= 0) continue; var dd = Math.hypot(V7.half.x[i] - V7.half.x[j], V7.half.y[i] - V7.half.y[j]); if (dd < bd) { bd = dd; bj = j; } } if (bj >= 0) { V7.half.pair[i] = bj; V7.half.pair[bj] = i; } }
        var od = []; for (i = 0; i < 22; i++) if (!sim.players[i].off) od.push([Math.hypot(V7.half.x[i] - PW / 2 - 1, V7.half.y[i] - PH - 4.5), i]); od.sort(function (p, q) { return p[0] - q[0]; }); V7.half.grp = od.slice(0, 7).map(function (p) { return p[1]; });      // kameranın izlediği, tünele en yakın grup
        V7.half.w0 = v7Now(); S.hold = 'v7ht'; S.last = v7Now(); sqLog(fin ? 'mac_sonu' : 'devre'); v7Cnt(fin ? 'mac_sonu' : 'devre');
    }
    function v7HalfStep(v, h) {
        var Hh = V7.half, sim = S.sim; if (!Hh) return; if (Hh.sid !== S.sid) { V7.half = null; return; }
        Hh.t += h; var i, tx = PW / 2 + 1, ty = PH + 4.5;
        for (i = 0; i < 22; i++) {
            if (sim.players[i].off || !(v.x[i] > -20)) continue; var x = Hh.x[i], y = Hh.y[i], gx = tx, gy = ty, sp = 1.6 + .25 * oaH(i, 3), pj = Hh.pair[i];
            if (pj >= 0 && Hh.t < 2.6) { gx = (Hh.x[i] + Hh.x[pj]) / 2 + (i < 11 ? -.42 : .42); gy = (Hh.y[i] + Hh.y[pj]) / 2; sp = 1.5; }
            var dx = gx - x, dy = gy - y, dl = Math.hypot(dx, dy), st = sp * h; if (dl > st) { x += dx / dl * st; y += dy / dl * st; } else { x = gx; y = gy; }
            Hh.x[i] = x; Hh.y[i] = y; v.x[i] = x; v.y[i] = y;
            if (dl > .2) { v.fx[i] = dx / dl; v.fy[i] = dy / dl; } else if (pj >= 0) { var px2 = Hh.x[pj] - x, py2 = Hh.y[pj] - y, pl = Math.hypot(px2, py2) || 1; v.fx[i] = px2 / pl; v.fy[i] = py2 / pl; if (!Hh['g' + i]) { Hh['g' + i] = 1; v7Gest(i, 7, S.viewT, 1.1); } }
        }
        var rdx = tx - 2 - Hh.rx, rdy = ty - Hh.ry, rdl = Math.hypot(rdx, rdy), rst = 1.7 * h; if (rdl > rst) { Hh.rx += rdx / rdl * rst; Hh.ry += rdy / rdl * rst; v.rfx = rdx / rdl; v.rfy = rdy / rdl; } v.rx = Hh.rx; v.ry = Hh.ry;
        var gcx = 0, gcy = 0, gn = 0; (Hh.grp || []).forEach(function (j) { if (!sim.players[j].off) { gcx += Hh.x[j]; gcy += Hh.y[j]; gn++; } }); if (gn) { gcx /= gn; gcy /= gn; } else { gcx = Hh.rx; gcy = Hh.ry; }
        if (!(Hh.cx === Hh.cx)) { Hh.cx = gcx; Hh.cy = gcy; } else { var kk = Math.min(1, h * 2.5); Hh.cx += (gcx - Hh.cx) * kk; Hh.cy += (gcy - Hh.cy) * kk; }
        var ex = tx - 12, ey = PH + 8.5, cd = Math.hypot(Hh.cx - ex, Hh.cy - ey), fv = Math.max(16, Math.min(50, 2 * Math.atan(7.5 / Math.max(1, cd)) * 180 / Math.PI));
        if (!(Hh.fv > 0)) Hh.fv = fv; else Hh.fv += (fv - Hh.fv) * Math.min(1, h * 1.5);
        V7.scam = { eye: [ex, 4.6, ey], at: [Hh.cx, 1.0, Hh.cy], fov: Hh.fv };      // tünel ağzındaki sabit kamera: yürüyen grup yaklaştıkça büyür (devre / maç sonu)
        if (Hh.t > Hh.dur) { V7.half = null; if (S.r3) { S.r3.cutCam = null; S.r3.v7Cut = 0; } if (S.hold === 'v7ht') S.hold = null; Hh.done = 1; V7.htDone = S.sid + ':' + sim.half + ':' + (sim.finished ? 1 : 0); afterSteps(); }
    }
    /* --- gol: sevinç çeşitleri (uçak koşusu, diz kayması, köşe bayrağında sıçrama, yumruk, kucaklaşma), yenilen tarafta hayal kırıklığı --- */
    function v7GoalStep(v) {
        var gi = S.goalInfo, sim = S.sim, C2 = S.gcel; if (!gi || !C2 || !sim || gi.own || gi.scorer < 0) return;
        if (V7.cel && V7.cel.gi === gi) { var K = V7.cel, tN = S.viewT;
            if (!K.hug && C2.t > 2.2) { K.hug = 1; var sc0 = gi.scorer; for (var i = 0; i < 22; i++) { var p = sim.players[i]; if (i === sc0 || p.off || p.team !== gi.team || p.role === 'GK') continue; if (Math.hypot(v.x[i] - v.x[sc0], v.y[i] - v.y[sc0]) < 4.5) v7Gest(i, 8, tN, 2.2, v.x[sc0], v.y[sc0]); } }
            if (!K.fin && C2.t > 2.4) { K.fin = 1; v7Gest(gi.scorer, K.end, tN, K.end === 14 ? 1.6 : 2.4, 0, 0, 1, K.end === 14 ? 4 : 0); }
            return; }
        var h = oaH(gi.min + .3, gi.scorer), endK = h < .35 ? 14 : h < .62 ? 15 : 12, tN2 = S.viewT;
        V7.cel = { gi: gi, end: endK, hug: 0, fin: 0 };
        v7Gest(gi.scorer, h < .5 ? 13 : 12, tN2 + .35, 2.0);
        var gx = gi.gx != null ? (gi.gx > PW / 2 ? PW : 0) : (sim.players[gi.scorer].x > PW / 2 ? PW : 0), nG = 0;
        for (var j = 0; j < 22; j++) {      // yenilen takım: kaleye yakın olanlar
            var q = sim.players[j]; if (q.off || q.team === gi.team || !(v.x[j] > -20)) continue;
            var dg = Math.hypot(v.x[j] - gx, v.y[j] - PH / 2); if (dg > 30 && q.role !== 'GK') continue;
            var hq = oaH(j, gi.min), md = q.role === 'GK' ? (hq < .5 ? 3 : 17) : hq < .3 ? 1 : hq < .55 ? 17 : hq < .75 ? 18 : hq < .9 ? 2 : (nG++ ? 17 : 3);
            v7Gest(j, md, tN2 + .5 + .4 * hq, 3.2);
        }
        v7Cnt('gol_sevinc_' + endK);
    }
    /* --- duran top: korner itişmesi, kalecinin barajı yönetmesi --- */
    function v7DeadStep(sim) {
        var d = sim.mode === 'dead' ? sim.dead : null; if (!d || d.afterGoal || !sqOn()) return;
        var tN = sim.t, i, j;
        if (d.kind === 'freekick' && d.wall && V7.fkGk !== d && d.timer > .5) {
            V7.fkGk = d; var gk = (1 - d.team) * 11, gp = sim.players[gk];
            if (gp && gp.role === 'GK' && !gp.off) { v7Gest(gk, 20, tN + .1, Math.max(1.2, Math.min(4.5, (d.wait - d.timer) - 1.2)), d.x, d.y); v7Cnt('kaleci_baraj'); }
        }
        if (d.kind === 'corner' && V7.corJ !== d && d.timer > 1.2) {
            V7.corJ = d; var at = d.team, gx = sim.atkGoalX(at), n = 0;
            for (i = 0; i < 22 && n < 3; i++) {
                var a = sim.players[i]; if (a.off || a.team !== at || a === d.taker || a.role === 'GK' || Math.abs(a.x - gx) > 16) continue;
                var bj = -1, bd = 2.6; for (j = 0; j < 22; j++) { var q = sim.players[j]; if (q.off || q.team === at || q.role === 'GK') continue; var dd = Math.hypot(q.x - a.x, q.y - a.y); if (dd < bd) { bd = dd; bj = j; } }
                if (bj < 0 || !v7Free(i, tN) || !v7Free(bj, tN)) continue;
                var dur = Math.max(1.2, Math.min(3.5, (d.wait - d.timer) - .9)); v7Gest(i, 10, tN + .05, dur, sim.players[bj].x, sim.players[bj].y); v7Gest(bj, 10, tN + .05, dur, a.x, a.y); n++;
            }
            if (n) v7Cnt('korner_itisme');
        }
    }
    /* --- faul tekrarı: kartlı / sert / penaltı faulünde, kart sahnesinden sonra yakın açıdan ağır çekim --- */
    function v7FoulRpPlan() {
        var F = V7.foul; if (!F || F.sid !== S.sid || F.rp || F.adv || !S.replayOn || !sqOn() || liveSpeed() >= 4) return;
        if (!(F.card || F.pen || F.k === 3 || F.k === 4 || F.k === 6 || F.k === 7 || F.k >= 8)) return;
        if (S.sim.t - V7.rpT < 25) return;
        F.rp = 1; V7.rpq = { F: F, due: v7Now() + 1900 / v7Ls() };
    }
    function v7FoulRpTick(sim) {
        var Q = V7.rpq; if (!Q) return; var now = v7Now();
        if (Q.F.sid !== S.sid || !sqOn() || sim.mode !== 'dead') { V7.rpq = null; return; }
        if (now < Q.due || S.hold || SQ.card || (S.refCard && now < S.refCard.until) || (S.offWalk && now < S.offWalk.go + 2800 / v7Ls())) return;
        V7.rpq = null; var F = Q.F, R = S.ring, lo = Math.max(0, R.n - RING + 3), n1 = R.n - 1, i, f0 = -1, f1 = -1;
        for (i = n1; i >= lo; i--) { var tt = ringT(i); if (f1 < 0 && tt <= F.t + 1.3) f1 = i; if (tt <= F.t - 1.5) { f0 = i; break; } }
        if (f0 < 0 || f1 < 0 || f1 - f0 < 30) return;
        var n = f1 - f0 + 1, fr = new Float32Array(n * FS); for (i = 0; i < n; i++) { var src = ((f0 + i) % RING) * FS; fr.set(R.buf.subarray(src, src + FS), i * FS); }
        S.rp = { fr: fr, n: n, ng: n, s0: 0, tc: 0, t: 0, endHold: 0, rings: [{ id: F.p, col: '#ff5a6b' }, { id: F.p2, col: '#7fd1ff' }], gi: { scorer: -1, min: minOf(F.t), team: 0 }, zoom: 1.8, rate: 1, gk: null, by: rpBadgeY(),
            title: 'TEKRAR', sub: 'Faul · ' + V7_FN[F.k] + ' · ' + minOf(F.t) + '\'', loop: false, slow: .42, v7: { x: F.x, y: F.y, p: F.p, p2: F.p2 } };
        V7.rpT = sim.t; V7.rpCut = 1; S.rpCount++; S.hold = 'replay'; S.last = now; showReplayUI(); sqLog('faul_tekrar'); v7Cnt('faul_tekrar');
    }
    /* --- kamera: faul tekrarında yakın açı (temasa dik, yayın tarafından), gol tekrarında golün türüne göre açı --- */
    function v7Cam(v, now, live) {
        var R3 = S.r3; if (!R3) return;
        if (S.vs && live) { if (R3.v7Cut) { R3.cutCam = null; R3.v7Cut = 0; } return; }      // VAR sahnesi kendi kamerasını kullanır
        if (live && V7.scam && (V7.sub || V7.half)) { R3.cutCam = V7.scam; R3.v7Cut = 1; return; }      // değişiklik / devre sahnesi
        if (!live && S.rp && S.rp.v7) {
            var q = S.rp.v7, a = q.p >= 0 ? q.p : -1, b = q.p2 >= 0 ? q.p2 : -1, cx = b >= 0 && v.x[b] > -20 ? v.x[b] : q.x, cy = b >= 0 && v.x[b] > -20 ? v.y[b] : q.y;
            if (a >= 0 && v.x[a] > -20) { cx = (cx * 2 + v.x[a]) / 3; cy = (cy * 2 + v.y[a]) / 3; }
            var c = S.rp.v7c || (S.rp.v7c = { x: cx, y: cy }); c.x += (cx - c.x) * .12; c.y += (cy - c.y) * .12;
            var dx = a >= 0 && b >= 0 ? v.x[b] - v.x[a] : 1, dy = a >= 0 && b >= 0 ? v.y[b] - v.y[a] : 0, dl = Math.hypot(dx, dy) || 1, nx = -dy / dl, ny = dx / dl; if (ny < 0) { nx = -nx; ny = -ny; }
            var orb = .35 * Math.sin((S.rp.tc / Math.max(1, S.rp.n)) * 2.2 - 1.1), cs = Math.cos(orb), sn = Math.sin(orb), ex = nx * cs - ny * sn, ey = nx * sn + ny * cs; if (ey < .25) ey = .25;
            R3.cutCam = { eye: [c.x + ex * 8.2, 2.1, c.y + ey * 8.2], at: [c.x, .85, c.y], fov: 34 }; R3.v7Cut = 1; return;
        }
        if (!live && S.rp && S.rp.gi && S.rp.gi.scorer >= 0 && S.rp.v7g) {      // gol tekrarı açısı
            var G2 = S.rp.v7g, rem = ((S.rp.ng || S.rp.n) - 1 - S.rp.tc) / 25 + .6;      // golün karesine kalan süre (+ file payı)
            if (G2.ang === 'arka' && rem < 2.2) { var gx = G2.gx, dir = gx > PW / 2 ? 1 : -1; R3.cutCam = { eye: [gx + dir * 9.5, 3.2, PH / 2 + (G2.gy - PH / 2) * .2], at: [gx - dir * 9, 1.0, PH / 2 + (v.by - PH / 2) * .5], fov: 46 }; R3.v7Cut = 1; return; }
            if (G2.ang === 'yuksek' && rem < 3.2) { R3.cutCam = { eye: [v.bx - (G2.gx > PW / 2 ? 14 : -14), 15, PH + 6], at: [v.bx + (G2.gx > PW / 2 ? 4 : -4), 0, v.by], fov: 40 }; R3.v7Cut = 1; return; }
            if (G2.ang === 'kenar' && rem < 2.6) { R3.cutCam = { eye: [v.bx - (G2.gx > PW / 2 ? 6 : -6), 1.7, PH + 5.5], at: [v.bx + (G2.gx > PW / 2 ? 3 : -3), 1.0, v.by], fov: 38 }; R3.v7Cut = 1; return; }
        }
        var fc = V7.fcam;
        if (live && fc && !S.vs && fc.sid === S.sid && now >= fc.t0 && now < fc.until && !(S.refCard && now < S.refCard.until) && !(S.r3.sqCut) && !(S.arCut) && v.x[fc.p2] > -20) {      // [v187] faul yakın planı
            var px = v.x[fc.p2], py = v.y[fc.p2], qx = v.x[fc.p] > -20 ? v.x[fc.p] : px, qy = v.x[fc.p] > -20 ? v.y[fc.p] : py, mx = px * .6 + qx * .4, my = py * .6 + qy * .4, ddx = qx - px, ddy = qy - py, dd = Math.hypot(ddx, ddy);
            var nx = dd > .3 ? -ddy / dd : 0, ny = dd > .3 ? ddx / dd : 1; if (ny < 0) { nx = -nx; ny = -ny; } nx = nx * .6; ny = ny * .6 + .4; var nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
            var ds = 8 + .4 * Math.min(dd, 10); R3.cutCam = { eye: [mx + nx * ds, 2.5, my + ny * ds], at: [mx, .7, my], fov: 32 }; R3.v7Cut = 1; return;
        }
        if (R3.v7Cut && !V7.sub && !V7.half) { R3.cutCam = null; R3.v7Cut = 0; }
    }
    var drawReplay0_ = drawReplay; drawReplay = function () { if (V7.rpCut) { V7.rpCut = 0; r3Cut(); } return drawReplay0_.apply(this, arguments); };      /* [v187] faul tekrarı çizim içinde kurulur: kesme, tekrarın ilk karesinden hemen önce (yoksa canlı kare kesmeyi tüketiyor, tekrarın ilk karesi ışınlanma oluyordu) */
    var V7RC = { v: 'auto' }; try { var rc7 = localStorage.getItem('adoball_v187_tekrar'); if (/^(auto|bcast|arka|kenar|yuksek)$/.test(rc7 || '')) V7RC.v = rc7; } catch (e) { }
    (function v7RcInit() {      /* ayarlar: tekrar kamerası canlı kameradan ayrı seçilir (B4.4) */
        try {
            var cs = $('v2d-camstyle'); if (!cs || $('v7-rcam')) return;
            var row = document.createElement('div'); row.className = 'opt-row'; row.id = 'v7-rcam'; row.setAttribute('role', 'group'); row.setAttribute('aria-label', 'Tekrar kamerası'); row.title = 'Gol tekrarının açısı: Otomatik golün türüne göre seçer (kafa: kale arkası, uzaktan şut: yüksek, ceza sahası: yan)';
            row.innerHTML = '<span class="opt-l">Tekrar kamerası</span><span class="seg">' + [['auto', 'Otomatik'], ['bcast', 'Yayın'], ['arka', 'Kale arkası'], ['kenar', 'Yan'], ['yuksek', 'Yüksek']].map(function (x) { return '<button type="button" data-v="' + x[0] + '" aria-pressed="false">' + x[1] + '</button>'; }).join('') + '</span>';
            cs.parentNode.insertBefore(row, cs.nextSibling);
            row.onclick = function (e) { var t = segPick(e, row); if (!t) return; V7RC.v = t; try { localStorage.setItem('adoball_v187_tekrar', t); } catch (x) { } segSync('v7-rcam', t); };
            segSync('v7-rcam', V7RC.v);
        } catch (e) { }
    })();
    function v7GoalAngle(gi) {      // kafa golü: kale arkası · uzaktan şut: yüksek · ceza sahası içi ayak: kenar çizgisi (yer seviyesi)
        if (V7RC.v !== 'auto') return { ang: V7RC.v === 'bcast' ? 'yayin' : V7RC.v, gx: gi.gx != null ? (gi.gx > PW / 2 ? PW : 0) : PW, gy: gi.gy != null ? gi.gy : PH / 2 };
        var ls = S.lastShot, sim = S.sim, gx = gi.gx != null ? (gi.gx > PW / 2 ? PW : 0) : PW, ang = 'kenar';
        var sp = gi.scorer >= 0 ? sim.players[gi.scorer] : null, R = S.ring, i, sx = sp ? sp.x : gx;
        if (ls && ls.p === gi.scorer && ls.tag === 'HEAD') ang = 'arka';
        else { for (i = R.n - 1; i > Math.max(0, R.n - 200); i--) { var o = (i % RING) * FS; if (R.buf[o + 4] === gi.scorer) { sx = R.buf[o + 6 + gi.scorer * 4]; break; } } if (Math.abs(gx - sx) > 22) ang = 'yuksek'; else if (oaH(gi.min, gi.scorer) < .4) ang = 'arka'; }
        return { ang: ang, gx: gx, gy: gi.gy != null ? gi.gy : PH / 2 };
    }
    /* --- her kare (canlı çizimde): görünüm hedefleri, top görevlileri, değişiklik, devre, sevinç, hakem işareti --- */
    function v7Live(v, dt) {
        var sim = S.sim, now = v7Now(), h = Math.min(.1, dt || .016) * v7Ls(), i; V7.xa.length = 0; V7.xb.length = 0;
        if (!sim || !V7.on || !S.r3 || !S.use3) { V7.pOk = 0; return; }
        if (!V7.bb) v7BBInit();
        if (V7.half) v7HalfStep(v, h);
        if (V7.sub) { v7SubStep(h); if (V7.sub && V7.sub.q.id >= 0) v.x[V7.sub.q.id] = -99; }
        else if (V7.subQ.length && sqOn() && !S.hold && v7Vis() && sim.mode === 'dead' && !SQ.card && !(S.refCard && now < S.refCard.until) && !S.offWalk && !V7.dl) { var q = V7.subQ.shift(); if (q.sid === S.sid) v7SubStart(q); }
        else if (V7.subQ.length && (!sqOn() || sim.finished)) { var q2 = V7.subQ.shift(); try { if (S.r3.subHold) S.r3.subHold(q2.id, false); } catch (e) { } }
        if (S.hold === 'goal') try { v7GoalStep(v); } catch (e) { }
        if (sqOn() && !S.hold) {
            if (SQ.ob && SQ.ob !== V7.obSeen && sim.mode === 'dead' && sim.dead) { V7.obSeen = SQ.ob; try { v7DlvStart(sim, sim.dead, SQ.ob); } catch (e) { V7.dl = null; } }
            try { v7DeadStep(sim); } catch (e) { }
            try { v7FoulRpTick(sim); } catch (e) { }
        }
        v7GvApply(v, dt);
        v7BBStep(h);
        V7.dlv = 0; if (V7.dl && !V7.half && !V7.sub) { if (v7DlvStep(v, h)) V7.dlv = 1; else if (V7.dl && V7.dl.ph === 1) V7.dlv = 1; }
        if (V7.xbOld) V7.xb.push(V7.xbOld[0], V7.xbOld[1], V7.xbOld[2]);
        v7BBOut();
        var rp = V7.refP; if (rp && now >= rp.t0 && now < rp.until && v.rx != null) { v.rfx = rp.fx; v.rfy = rp.fy; }
        for (i = 0; i < 22; i++) { V7.px[i] = v.x[i]; V7.py[i] = v.y[i]; } V7.pOk = 1;
        if (G.__abLab) try { G.__abLab(v, S, V7); } catch (e) { }
    }
    function v7RefPose(now) { var rp = V7.refP; if (!rp || now >= rp.until) return null; if (now < rp.t0) return now >= rp.wh ? 'whistle' : null; return rp.pose; }
    function v7CardShown(c, now) {      /* kart gösterildi: oyuncu hakemin önünde kalır; takım arkadaşlarından 1–3'ü itiraz eder (kırmızıda hep) */
        var sim = S.sim, id = c.id, p = sim && sim.players[id], ls = v7Ls(); if (!p) return;
        var g = V7.gv[id]; if (g) g.until = now + 3000 / ls;
        var red = c.kind === 'R', h = oaH(sim.t + .11, id), n = red ? 3 : h < .5 ? 2 : h < .78 ? 1 : 0, L = [], i, k;
        var px = p.off && S.offWalk ? S.offWalk.x : p.x, py = p.off && S.offWalk ? S.offWalk.y : p.y;
        for (i = 0; i < 22; i++) { var q = sim.players[i]; if (i === id || q.off || q.team !== p.team || q.role === 'GK') continue; var dd = Math.hypot(q.x - px, q.y - py); if (dd < 22) L.push([dd, i]); }
        L.sort(function (a, b) { return a[0] - b[0]; });
        for (k = 0; k < Math.min(n, L.length); k++) { var j = L[k][1]; v7Go(j, 0, 0, 3.2, 3.8, { fol: 1, stop: 2.5 + .45 * k }); v7Gest(j, 4, S.viewT + .55 + .25 * k, 2.3, S.ref ? S.ref.x : px, S.ref ? S.ref.y : py); }
        sqLog('itiraz', Math.min(n, L.length)); if (n) v7Cnt('itiraz');
    }

    /* [v187] izleme düzeyleri (FM'deki beş düzey): Tam (tüm maç) · Kapsamlı (pozisyonlar normal hızda, sakin bölümler hızlı) · Geniş (yarım fırsatlar,
       isabetli şutlar, tehlikeli duran toplar, kartlar) · Önemli anlar (goller, net fırsatlar, penaltı, kırmızı, VAR) · Yalnız anlatım (saha yok; anlatım ve skor).
       Dinamik özet: fark ≥ 3 ve 60'+ → yalnız gol / penaltı / kırmızı / VAR; fark ≤ 1 ve 75'+ → daha çok an. "Kritik ana atla" ve "Sonuna simüle et" her düzeyde çalışır. */
    var V7W = { lvl: 'key' }; try { var lv7 = localStorage.getItem('adoball_v187_izleme'); if (lv7 === 'ext' || lv7 === 'yaz' || lv7 === 'key') V7W.lvl = lv7; } catch (e) { }
    var V7W_TIP = { ext: 'Geniş: yarım fırsatlar, isabetli şutlar, tehlikeli duran toplar ve kartlar; aralar maç arası panelinde hızlı akar', key: 'Önemli anlar: goller, net fırsatlar, penaltılar, kırmızı kartlar ve VAR; her an hazırlığıyla başlar', yaz: 'Yalnız anlatım: saha gösterilmez; anlatım satırları, skor ve istatistik akar' };
    var V7W_HINT = { ext: 'Geniş · yarım fırsatlar ve duran toplar da gösterilir', key: 'Önemli anlar · gerçek hızda', yaz: 'Yalnız anlatım · saha yok, maç anlatımla akar' };
    var setWatch0_ = setWatch;
    setWatch = function (w) {
        if (w === 'ext' || w === 'yaz' || w === 'fm') { V7W.lvl = w === 'fm' ? 'key' : w; try { localStorage.setItem('adoball_v187_izleme', V7W.lvl); } catch (e) { } w = 'fm'; sqLog('izleme:' + V7W.lvl); }
        else sqLog('izleme:' + w);
        var r = setWatch0_(w); v7WatchUI(); return r;
    };
    function v7WatchUI() {
        try {
            var fm = S.watch === 'fm';
            [['watch-fm', 'key'], ['watch-ext', 'ext'], ['watch-yaz', 'yaz']].forEach(function (x) { var b = $(x[0]); if (!b) return; var on = fm && V7W.lvl === x[1]; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.title = V7W_TIP[x[1]]; });
            var hint = $('eng-hint'); if (fm && hint && mode === '2d' && V7W_HINT[V7W.lvl] && !/Pro modu|Hakem modu|Oyuncun sahada/.test(hint.textContent)) hint.textContent = V7W_HINT[V7W.lvl];
        } catch (e) { }
    }
    var syncWatchUI0_ = syncWatchUI; syncWatchUI = function () { syncWatchUI0_(); v7WatchUI(); };
    (function v7WatchInit() {
        try {
            var seg = $('watch-seg'); if (!seg || $('watch-ext')) return;
            var mk = function (id, w, t) { var b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = t; b.title = V7W_TIP[w]; b.setAttribute('aria-pressed', 'false'); b.onclick = function () { setWatch(w); }; return b; };
            var ww = $('watch-wide'), wk = $('watch-key'), wf = $('watch-fm'), be = mk('watch-ext', 'ext', 'Geniş'), by = mk('watch-yaz', 'yaz', 'Yalnız anlatım');
            if (ww) { ww.textContent = 'Tam'; seg.appendChild(ww); } if (wk) { wk.textContent = 'Kapsamlı'; seg.appendChild(wk); } seg.appendChild(be); if (wf) { wf.textContent = 'Önemli anlar'; seg.appendChild(wf); } seg.appendChild(by);
            seg.classList.add('v7-watch5');
            if (!$('v7-style')) { var st7 = document.createElement('style'); st7.id = 'v7-style'; st7.textContent = '.watch-seg.v7-watch5{flex-wrap:wrap;row-gap:4px}.watch-seg.v7-watch5 button{padding:5px 9px}@media (max-width:520px){.watch-seg.v7-watch5 button{padding:4px 7px;font-size:.76rem}}#v7-rcam .seg{flex-wrap:wrap}#v7-rcam .seg button{padding-left:5px;padding-right:5px;min-width:0;flex:1 1 auto}'; document.head.appendChild(st7); }
        } catch (e) { }
    })();
    var fmTrigger0_ = fmTrigger;
    fmTrigger = function (ev) {
        var L = V7W.lvl, k = fmTrigger0_(ev), sim = S.sim; if (!sim) return k;
        if (L === 'yaz') return '';
        var mi = sim.t * CK / 60, sd = Math.abs(sim.teams[0].score - sim.teams[1].score), m = ev.meta || {}, fkd = function (r) { return ev.team >= 0 && ev.x != null && Math.hypot(sim.atkGoalX(1 - ev.team) - ev.x, PH / 2 - ev.y) < r; };
        if (L === 'ext' && !k) {
            if (ev.type === 'SHOT' && (m.on || (m.xg || 0) >= .03)) k = 'HALF';
            else if ((ev.type === 'SAVE' || ev.type === 'BLOCK') && (m.xg || 0) >= .04) k = 'HALF';
            else if (ev.type === 'FOUL' && !m.adv && fkd(35)) k = 'FKD';
            else if (ev.type === 'CARD') k = 'CARD';
            else if (ev.type === 'CORNER') k = 'COR';
        }
        var late = sd <= 1 && mi >= 75;
        if (L === 'key' && (k === 'COR' || k === 'FKD') && !late && !(k === 'FKD' && fkd(22))) k = '';      // Önemli anlar (FM Key): korner ve uzak serbest vuruş yalnız Geniş düzeyde (son dakikalar hariç)
        if (k && sd >= 3 && mi >= 60 && !/^(GOAL|VAR|PEN|PENF|RED)$/.test(k)) { v7Cnt('ozet_kisaldi'); return ''; }      // dinamik özet: maç koptu
        if (!k && late) {      // dinamik özet: son dakikalar, çekişmeli maç
            if (ev.type === 'SHOT' && (m.xg || 0) >= .06) k = 'CCC'; else if (ev.type === 'CORNER') k = 'COR'; else if (ev.type === 'FOUL' && !m.adv && fkd(30)) k = 'FKD';
            if (k) v7Cnt('ozet_uzadi');
        }
        return k;
    };
    FM_LBL.HALF = 'POZİSYON'; FM_LBL.CARD = 'KART';
    var fmStartClip0_ = fmStartClip; fmStartClip = function (F, ev, kind) { var r = fmStartClip0_(F, ev, kind); if (r) { sqLog('klip:' + kind + ':' + V7W.lvl, ev.t); v7Cnt('klip_' + kind); } return r; };
    var fmTick0_ = fmTick;
    fmTick = function (dt, sim) { var r = fmTick0_(dt, sim); if (V7W.lvl === 'yaz' && S.fm && S.fm.ph === 'tail') { S.fm.ph = 'gap'; S.fm.acc = 0; } return r; };
    function v7YazPanel(x, y, w, h, F) {      // yalnız anlatım: saha yerine son anlatım satırları (en yenisi üstte)
        g.save(); g.fillStyle = 'rgba(8,14,26,.9)'; g.fillRect(x, y, w, h);
        g.fillStyle = '#7fd1ff'; g.font = '800 12px ' + fd(); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('YALNIZ ANLATIM', x + 12, y + 20);
        var L = (F.lines || []).slice(-8).reverse(), ly = y + 44, i;
        g.font = '600 13px ' + fd();
        for (i = 0; i < L.length && ly < y + h - 8; i++) { var q = L[i]; g.fillStyle = i ? 'rgba(220,230,245,' + Math.max(.35, 1 - i * .12) + ')' : '#fff'; g.fillText((minOf(q.t) + '\'  ') + fmFit(q.s, w - 70), x + 12, ly); ly += 22; }
        if (!L.length) { g.fillStyle = 'rgba(220,230,245,.6)'; g.fillText('Maç anlatımla sürüyor…', x + 12, ly); }
        g.restore();
    }
    function v7BandHTML(b) {
        var tag = b.kind === 'sub' ? 'DEĞİŞİKLİK' : b.kind === 'adv' ? 'AVANTAJ' : b.kind === 'var' ? 'VAR' : '', col = b.kind === 'sub' ? '#1fa34a;color:#fff' : b.kind === 'adv' ? '#2f7dff;color:#fff' : '#7a3cff;color:#fff', crest = '';
        if (b.kind === 'sub') { try { crest = renderTeamCrestHTML(teamObj(b.team), 34); } catch (e) { } }
        var main = b.kind === 'sub' ? '<span class="gb-p"><b style="color:#3ddc6a">▲</b> ' + esc(b.inN || '') + '</span><span class="gb-s"><b style="color:#ff5a5a">▼</b> ' + esc(b.outN || '') + ' · ' + b.min + '\' · ' + esc(teamObj(b.team).name) + '</span>'
            : '<span class="gb-p">' + esc(b.txt || '') + '</span>' + (b.sub ? '<span class="gb-s">' + esc(b.sub) + '</span>' : '');
        return '<div class="gb"><span class="gb-tag" style="background:' + col + '">' + (crest ? '<span class="ab-hud-crest">' + crest + '</span>' : '') + tag + '</span><span class="gb-main">' + main + '</span></div>';
    }
    function v7Vis() { var c = $('cv2d'); return !!(c && c.offsetParent !== null); }
    function v7Watchdog() {      /* sahne çizim olmadan (tuval gizli) takılı kalmasın: gerçek süre dolunca bitir */
        var now = v7Now(), ls = v7Ls();
        if (V7.half && now - (V7.half.w0 || now) > (V7.half.dur + 2) * 1000 / ls) { V7.half.t = 1e9; if (!v7Vis()) { var Hh = V7.half; V7.half = null; if (S.hold === 'v7ht') S.hold = null; V7.htDone = S.sid + ':' + S.sim.half + ':' + (S.sim.finished ? 1 : 0); afterSteps(); } }
        if (V7.sub && now - (V7.sub.w0 || now) > 8000 / ls) { V7.sub = null; if (S.hold === 'v7sub') { S.hold = null; S.last = now; } if (S.r3) { S.r3.cutCam = null; S.r3.v7Cut = 0; } }
    }
    var goalPendTick0_ = goalPendTick; goalPendTick = function () {
        if (V7.on && (V7.half || V7.sub)) try { v7Watchdog(); } catch (e) { }
        /* [v187] maç bitti ama gecikmeli gösterimde (DL) son olaylar kuyrukta kaldı: döngü bitmiş simi adımlamadığından afterSteps hiç çağrılmıyordu (maç sonu ekranı gelmiyordu). Kısa beklemeden sonra kuyruğu boşalt, maçı bitir. */
        var sm7 = S.sim; if (sm7 && sm7.finished && S.running && !S.hold && !S.halfPending && mode === '2d') { var nw7 = performance.now(); if (!V7.finW) V7.finW = nw7; else if (nw7 - V7.finW > 600 / v7Ls()) { V7.finW = 0; if (DL.on) dlOff(); sqLog('dl_bitis'); if (!S.hold) afterSteps(); } } else V7.finW = 0;
        if (V7.subQ.length && S.sim && (S.sim.t - V7.subQ[0].t > 60 || V7.subQ[0].sid !== S.sid)) { var q7 = V7.subQ.shift(); try { if (S.r3 && S.r3.subHold) S.r3.subHold(q7.id, false); } catch (e) { } }      // sahne gösterilemedi: yuva yeni görünüme geçer
        return goalPendTick0_();
    };
    var afterSteps0_ = afterSteps;      /* [v187] devre / maç sonu: önce tokalaşma ve tünele yürüyüş, sonra devre arası / maç sonu ekranı */
    afterSteps = function () {
        var sim = S.sim;
        if (V7.on && sim && (S.halfPending || sim.finished) && !V7.half && sqOn() && S.r3 && !S.hold && v7Vis()) {
            var key7 = S.sid + ':' + sim.half + ':' + (sim.finished ? 1 : 0);
            if (V7.htDone !== key7) { try { v7HalfStart(!!sim.finished && !S.halfPending); return; } catch (e) { V7.half = null; if (S.hold === 'v7ht') S.hold = null; } }
        }
        return afterSteps0_();
    };
    var varFinish0_ = varFinish;      /* [v187] VAR kararı alt bandı */
    varFinish = function () {
        var vs = S.vs, r = varFinish0_.apply(this, arguments);
        try { if (vs && V7.on) { var m = vs.m || {}, oc = m.outcome || '', txt = vs.kind === 'goal' ? (oc === 'cancel' ? 'GOL İPTAL' : 'GOL GEÇERLİ') : vs.kind === 'pen' ? (oc === 'confirm' ? 'PENALTI VERİLDİ' : oc === 'cancel' ? 'PENALTI İPTAL' : 'KARAR DEĞİŞTİ') : oc === 'downgrade' ? 'KART DEĞİŞTİ' : oc === 'cancel' ? 'KARAR İPTAL' : 'KARAR GEÇERLİ';
            V7.band = { kind: 'var', txt: 'VAR · ' + txt, sub: (vs.info && vs.info.label) || '', team: vs.ev ? vs.ev.team : 0, until: performance.now() + 4500 / v7Ls() }; sqLog('var_bant'); } } catch (e) { }
        return r;
    };

    G.ado2d = {
        setMode: setMode, mode: function () { return mode; }, active: function () { return mode === '2d'; }, running: function () { return mode === '2d' && S.running; },
        sim: function () { return S.sim; }, state: S, _cr: function () { return CRD; },      // [carry] test kancası: görünen top durumu
        _v188: function (o) { if (o) for (var k in o) if (k in V8B) V8B[k] = o[k]; return V8B; },      // [v188] A/B ölçümü
        // test/hata ayıklama: çizim beklemeden maçı belirtilen hızla oynat
        setSpeedFactor: function (v) { S.speed = v; S.raw = true; }, _tlog: function () { return S.tlog || []; }, _rp: function () { return S.rp; }, _rpFreeze: function (v) { S.rpFreeze = !!v; }, _gb: function () { return S.gb; },
        setReplay: setReplay, replayCount: function () { return S.rpCount; }, skipReplay: function () { endReplay(); }, replaying: function () { return S.hold === 'replay'; },
        setSmart: function (on) { S.smart = !!on; savePrefs(); syncOptUI(); syncWatchUI(); }, setZoom: function (on) { S.zoom = !!on; savePrefs(); syncOptUI(); },
        prefs: function () { return { replay: S.replayOn, smart: S.smart, zoom: S.zoom, speed: S.preset, watch: S.watch }; },
        pace: function () { return S.pace; }, virt: function () { return S.virt[S.watch]; }, virtAll: function () { return S.virt; }, paceTarget: function () { return S.sim ? paceTarget(S.sim) : 1; },
        lenSync: function () { try { syncWatchUI(); var e = $('v2d-mlen-now'); if (e) { var ml = matchLenMin(); e.textContent = ml ? ml + ' dk' : 'standart'; } } catch (e) { } }, lenState: function () { return S.ml || null; },
        setWatch: setWatch, watch: function () { return S.watch; }, tab: setTab, layout: syncLayout, rating: function () { return S.rt; }, flush: function () { flushRatings(true); },
        // hakem ve VAR sahnesi (test/hata ayıklama okuması)
        refState: function () { var r = S.ref; return r ? { x: r.x, y: r.y, fx: r.fx, fy: r.fy, vx: r.vx, vy: r.vy } : null; },
        varScene: function () { var v = S.vs; return v ? { phase: v.phase, kind: v.kind, reason: v.m.reason, outcome: v.m.outcome, t: v.t, tt: v.tt, skip: v.skip, reveal: v.reveal, after: v.after.map(function (e) { return e.type; }), score: v.score, mon: !!v.mon, tone: v.info.tone } : null; },
        hudRect: function () { return S.hudRect || null; }, camZ: function () { return S.cam.z; },
        view: { set: setView, get: function () { return { view: S.view, cam3: S.cam3, use3: S.use3, camStyle: S.camStyle, gfx: S.gfx, gfxEff: effGfx() }; }, renderer: function () { return S.r3; }, supported: function () { return !!(G.Ado3D && Ado3D.supported()); } },
        // Futbolcu Veritabanı ekranında boy/kilo/ten rengi kaydedildiğinde ado.js'in çağırdığı köprü: 3B sahne zaten
        // kuruluysa (S.r3 var) DB2D'den GÜNCEL değerlerle yeniden hesaplanmış kadroyu S.r3.refreshAppearance'a verir
        // - R3.setMatch'in AKSİNE sahne/kamera/oyuncu konumu BOZULMADAN, maç devam ederken bile uygulanır. 3B henüz
        // kurulmamışsa (S.r3 yok, ya da ilk maç kurulumu henüz olmamış) yapacak bir şey yoktur: bir sonraki
        // renderScene3D zaten GÜNCEL DB2D verisiyle kuracaktır (S.r3key mekanizması) - bu durumda false döner.
        refreshAppearance: function () {
            if (!S.r3) return false;
            try { return !!S.r3.refreshAppearance(buildR3Players()); } catch (e) { warn('3B görünüm yenileme', e); return false; }
        },
        // takım talimatları (arayüz ve test)
        tac: { open: tacOpen, close: tacClose, isOpen: function () { return !!S.tacOpen; }, get: function (t) { return tacNorm(S.tac[t]); }, set: tacSet, confirm: tacConfirm, confirmed: function () { return S.tacOk.slice(); }, purpose: function () { return S.tacPurpose; }, def: TAC_DEF },
        refReplay: refReplay, refVarScene: refVarScene, refVarReturn: refVarReturn, refVarEnd: refVarEnd, refVarPhase: refVarPhase, varCount: function () { return S.varCount; }, varSkip: function () { varSkip(); }, cards: function () { return { y: S.cards.y, r: S.cards.r }; }, rraPoint: rraPoint,
        // yalnızca test: verilen VAR incelemesini şimdi başlatır (simülasyondan gelmiş bir olay gibi aynı yoldan işlenir)
        debugVar: function (o) {
            if (!on()) return false; o = o || {};
            var sim = S.sim, B = sim.ball, T = o.team != null ? o.team : 0, kind = o.kind || 'goal';
            var ev = { id: 9e5 + S.varCount, t: sim.t, type: 'VAR', team: T, p: o.p != null ? o.p : T * 11 + 10, p2: o.p2 != null ? o.p2 : T * 11 + 8, x: o.x != null ? o.x : B.x, y: o.y != null ? o.y : B.y,
                min: Math.floor(sim.t * CK / 60), score: [sim.teams[0].score, sim.teams[1].score], meta: Object.assign({ kind: kind, reason: 'ofsayt', outcome: 'cancel', margin: .12 }, o.meta || {}) };
            handle(ev); return true;
        }
    };

    function bindLayout() {
        var ms = $('match-screen'); if (!ms || ms._b) return; ms._b = 1;
        if (G.ResizeObserver) new ResizeObserver(function () { syncLayout(); }).observe(ms);
        G.addEventListener('resize', syncLayout);
        ['l2t-key', 'l2t-cm', 'l2t-xi', 'l2t-stats'].forEach(function (id) { var b = $(id); if (b) b.onclick = function () { setTab(id.slice(4)); }; });
    }
    document.addEventListener('DOMContentLoaded', function () { bindBar(); bindCanvas(); bindLayout(); syncModeUI(); syncOptUI(); syncWatchUI(); tacInit(); });
    if (document.readyState !== 'loading') { bindBar(); bindCanvas(); bindLayout(); syncModeUI(); syncOptUI(); syncWatchUI(); tacInit(); }
    /* ---------- "Veritabanını Yükle" güvenliği ----------
       Oyunun kendi içe aktarma işlevi (handleImport) DEĞİŞTİRİLMEZ: dosya önce temizlenir (yeni oyuncuya kimlik atanır, sayı olarak yazılmış
       metinler sayıya çevrilir, 1–99 dışı değerler sıkıştırılır, eksik özellikler 50'yle doldurulur, mevkisi tanınmayan kayıt atlanır), sonra
       temizlenmiş dosya oyunun kendi işlevine verilir. Geçerli kayıtlar aynen kalır. Bozuk JSON'da oyunun kendi hata iletisi görünür. */
    (function () {
        var orig = G.handleImport; if (typeof orig !== 'function' || orig._ab) return;
        function note(r) {
            var b = [];
            if (r.yeniId) b.push(r.yeniId + ' oyuncuya yeni kimlik (id) atandı');
            if (r.mevki) b.push(r.mevki + ' oyuncunun mevki yazımı düzeltildi');
            if (r.duzeltilen) b.push(r.duzeltilen + ' değer sayıya çevrildi/temizlendi');
            if (r.kirpilan) b.push(r.kirpilan + ' değer 1–99 aralığına çekildi');
            if (r.eksik) b.push(r.eksik + ' eksik özellik 50 ile dolduruldu');
            if (r.atlanan) b.push('mevkisi tanınmayan / geçersiz ' + r.atlanan + ' kayıt atlandı');
            return b.length ? 'Yükleme sırasında otomatik düzeltmeler: ' + b.join('; ') + '.' : '';
        }
        G.handleImport = function (ev) {
            var f = ev && ev.target && ev.target.files && ev.target.files[0];
            if (!f || !G.FileReader || !G.File) return orig.apply(this, arguments);
            var self = this, args = arguments, rd = new FileReader();
            rd.onload = function (e) {
                var parsed, res = null;
                try { parsed = JSON.parse(e.target.result); if (Array.isArray(parsed)) res = DB2D.normalizeImport(parsed); } catch (err) { res = null; }
                if (!res) return orig.apply(self, args);                                    // bozuk JSON / dizi değil: oyunun kendi denetimi ve iletisi
                var msg = note(res.report);
                orig.call(self, { target: { files: [new File([JSON.stringify(res.list)], f.name, { type: 'application/json' })] } });
                if (msg) setTimeout(function () { try { alert(msg); } catch (_) { } }, 700);
            };
            rd.onerror = function () { orig.apply(self, args); };
            rd.readAsText(f);
        };
        G.handleImport._ab = 1;
    })();
})();


