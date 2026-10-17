/* =====================================================================
   ADOBALL — MAÇ TANILAMA (MatchDiagnostics) · salt gözlemci
   Simülasyonu DEĞİŞTİRMEZ: yalnız okur. RNG tüketmez, sim nesnelerine alan eklemez, olay dinleyicisine dokunmaz
   (sim.onEvent köprünün; olaylar sim.events dizisinden okunur). Kapalıyken hiçbir şey sarmalanmaz (maliyet sıfır).
   Açma: localStorage.adoTani = '1' · adreste #tani (çerçevede üst pencerenin adresi de okunur) · window.__adoTani = true
         ya da çalışırken AdoTani.enable(true). Node: require(bu dosya).attach(sim).
   Nasıl: Sim2D.create sarmalanır → her yeni maçta sim.step (öz alan) sarmalanır; her adımın öncesi/sonrası karşılaştırılır.
     · adım içi (çekirdek): ışınlanma, temassız top yön/hız değişimi, uzaktan sahiplik, NaN, saha dışı, saat, takılı aksiyon,
       çakışan aksiyon, üst üste binme, yinelenen olay, skor ↔ GOL, maç sonu istatistik ↔ olay sayıları
     · adımlar arası (köprü/sunum katmanı): dışarıdan konum/skor değişimi
     · görüntü (yalnız tarayıcı, açıkken): canlı akışta sim saatinin durması, uzun gol/kart/VAR beklemesi, 3B vuruşta ayak-top mesafesi
   Her kayıt: kod, önem, dakika/tick, oyuncu, aksiyon, önce/sonra durumu, neden.
   ===================================================================== */
(function (root) {
    'use strict';
    var hyp = Math.hypot || function (a, b) { return Math.sqrt(a * a + b * b); };
    var KOD = {
        nan: ['kritik', 'NaN/Infinity değer'],
        saat_durdu: ['kritik', 'Maç saati ilerlemedi (hakem beklemesi yokken)'],
        saat_geri: ['kritik', 'Maç saati geri gitti'],
        mac_bitmiyor: ['kritik', 'Süre doldu, maç bitmedi'],
        isinlanma_oyuncu: ['kritik', 'Oyuncu ışınlandı (adım başına imkânsız yer değiştirme)'],
        isinlanma_top: ['kritik', 'Top ışınlandı (vuruş/sahiplik/duran top yokken)'],
        dis_isinlanma: ['uyari', 'Adımlar arasında dışarıdan konum değişimi (köprü/sunum katmanı)'],
        dis_skor: ['kritik', 'Skor adımlar arasında dışarıdan değişti'],
        sahipli_top_sicrama: ['uyari', 'Sahipli top bir adımda sıçradı (sahibin bakış yönü ani döndü)'],
        vurus_sicramasi: ['uyari', 'Vuruş anında top ayağa sıçradı (görsel kopma)'],
        reset: ['bilgi', 'Kurallı yeniden yerleşim (devre arası / başlama / kırmızı kart)'],
        top_tunel: ['uyari', 'Top bir adımda oyuncunun içinden geçti (uç noktalar alma yarıçapı dışında; sürekli çarpışma sınaması yok)'],
        temassiz_top: ['uyari', 'Temassız top yön/hız değişimi (olay ve yakın oyuncu yok)'],
        imkansiz_sahiplik: ['kritik', 'Top, sahibinden çok uzakta'],
        uzak_kazanim: ['kritik', 'Top uzaktan kazanıldı'],
        vurus_kazanim: ['uyari', 'Pas/şut aynı adımda uzaktaki oyuncuca alındı (vuruş sıçramasıyla birlikte)'],
        sahipsiz_sahip: ['kritik', 'Sahadan çıkmış oyuncu topa sahip'],
        olu_topta_sahip: ['kritik', 'Ölü topta top sahibi var'],
        cakisan_aksiyon: ['uyari', 'Çakışan aksiyonlar'],
        takili_olu_top: ['uyari', 'Duran top uzun süre kullanılmadı'],
        takili_pas: ['uyari', 'Pas zaman aşımı (çözülmedi)'],
        takili_sut: ['uyari', 'Şut zaman aşımı (çözülmedi)'],
        takili_hava: ['uyari', 'Havadaki top iniş anında çözülmedi'],
        sahipsiz_top: ['uyari', 'Canlı top uzun süre sahipsiz ve hareketsiz'],
        top_tutma: ['uyari', 'Oyuncu topu çok uzun tuttu'],
        saha_disi_oyuncu: ['uyari', 'Oyuncu saha sınırının dışında'],
        saha_disi_top: ['uyari', 'Canlı top saha sınırının dışında'],
        ust_uste: ['uyari', 'Oyuncular üst üste (sürekli)'],
        yinelenen_olay: ['kritik', 'Yinelenen olay'],
        skor_olay: ['kritik', 'Skor ↔ GOL olayı uyuşmuyor'],
        ist_olay: ['kritik', 'İstatistik ↔ olay sayısı uyuşmuyor'],
        ist_bilgi: ['bilgi', 'İstatistik farkı (kurallı: bekleyen duran top vb.)'],
        sunum_durdu: ['uyari', 'Canlı görüntüde sim saati durdu'],
        sunum_bekleme: ['uyari', 'Gol/kart/VAR beklemesi uzun sürdü'],
        temas_3b: ['uyari', '3B: vuruşta ayak-top mesafesi büyük'],
        tani_hata: ['bilgi', 'Tanılama iç hatası']
    };
    /* eşikler (metre / sim saniyesi). Ölçümle ayarlandı: tanilama/sonuclar.md */
    var E = {
        P_JUMP: 1.0,          // oyuncu: bir adımda (0,04 sn) en çok 1 m (25 m/sn); en hızlı oyuncu ~10 m/sn = 0,4 m
        B_SLACK: 1.2,         // top: beklenen yol (v·DT) üstüne pay
        B_GAIN: 4.6,          // sahiplik değişiminde (kaleci elle tutuş: uzanma ≤ 1,25 + 0,024·99 ≈ 3,6 m) top sıçrama sınırı
        B_KICK: 1.0,          // vuruşta topun ayağa sıçraması bu kadarı aşarsa uyarı
        OWN_FAR: 5.0,         // sahip-top uzaklığı (sürme fiziğinde kontrol kaybı CR_LOSE = 4,2 m)
        GAIN_FAR: 3.8,        // yeni sahibin topa uzaklığı (alıcı uzanması REC_R 1,8; kaleci +0,5)
        GAIN_FAR_GK: 4.6,
        ANG: 30 * Math.PI / 180, DV: 1.5, V_MIN: 3, NEAR: 2.0, NEAR_GK: 3.8,
        FLD_P: 1.05,          // çekirdek oyuncuyu [-1, 106] × [-1, 69] içinde tutar
        FLD_BX: 3.5, FLD_BY: 2.5, BZ: 45,
        DEAD_X: 15, PASS_T: 8, SHOT_T: 6, HIGH_T: 1.0, LOOSE_T: 8, HOLD_T: 20,
        OVL_D: .3, OVL_N: 5,
        GOAL_DUP: 2, SHOT_DUP: .25,
        FOOT_3B: .45
    };
    var MAXREC = 400, FIRST_N = 6;

    function envOn() {
        try { if (root.__adoTani === true) return true; } catch (e) { }
        try { if (root.localStorage && root.localStorage.getItem('adoTani') === '1') return true; } catch (e) { }
        try { if (root.location && /(^|[#&])tani\b/.test(String(root.location.hash || '').slice(1))) return true; } catch (e) { }
        try { if (root.parent && root.parent !== root) { if (root.parent.__adoTani === true) return true; if (/(^|[#&])tani\b/.test(String(root.parent.location.hash || '').slice(1))) return true; } } catch (e) { }
        return false;
    }

    var T = { on: false, list: [], nid: 0, lastOpts: null, wrapped: false, ov: null, ovT: 0, iv: 0, E: E, KOD: KOD };

    function fin(v) { return typeof v === 'number' && isFinite(v); }
    function r2(v) { return fin(v) ? Math.round(v * 100) / 100 : v; }
    function clk(sim) { var s = sim.t * (sim.C && sim.C.CK || 1), m = Math.floor(s / 60), ss = Math.floor(s % 60); return (m < 10 ? '0' : '') + m + ':' + (ss < 10 ? '0' : '') + ss; }
    function pName(sim, i) { var p = sim.players[i]; return p ? (p.team + '#' + (i % 11) + ' ' + (p.role || '') + ' ' + (p.name || '')) : '?'; }

    function attach(sim, opts) {
        if (!sim || typeof sim.step !== 'function' || sim.__noTani) return null;
        for (var q = 0; q < T.list.length; q++) if (T.list[q].sim === sim) return T.list[q];
        var n = sim.players.length;
        var D = {
            id: ++T.nid, sim: sim, seed: opts && opts.seed, names: opts && opts.names ? opts.names.slice(0, 2) : null,
            count: {}, first: {}, recs: [], steps: 0, ev: { n: 0, byType: {}, byTeam: [{}, {}] }, endChecked: false, end: null,
            /* önceki adım sonrası durum (adımlar arası değişimi bulmak için) ve adım öncesi */
            post: null, pre: null, evIdx: 0,
            ep: {}, ovl: new Int16Array(n * n), deadRef: null, passRef: null, passT0: 0, shotRef: null, shotT0: 0, highRef: null, highDone: null,
            looseT: 0, looseOn: false, ownRef: null, ownT0: 0, holdDone: false, lastGoal: [-99, -99], lastShot: {}, ids: {}, ftN: 0, htN: 0,
            sup: {}, k3: [], k3n: 0, k3sum: 0, k3max: 0, k3bad: 0
        };
        D.post = snap(sim, null); D.evIdx = sim.events ? sim.events.length : 0;
        var s0 = sim.step;
        D.step0 = s0;
        sim.step = function () {
            if (!T.on || D.off) return s0.apply(this, arguments);
            var ok = true;
            try { D.pre = snap(sim, D.pre); between(D); } catch (e) { ok = false; terr(D, e); }
            var r = s0.apply(this, arguments);
            if (ok) try { after(D); } catch (e) { terr(D, e); }
            return r;
        };
        T.list.push(D); if (T.list.length > 300) T.list.shift();
        return D;
    }
    function detach(D) { if (D && D.step0) { D.sim.step = D.step0; D.off = true; } }
    function terr(D, e) { rec(D, 'tani_hata', { neden: String(e && e.message || e).slice(0, 160) }); }

    /* hafif anlık görüntü (yeniden kullanılan diziler) */
    function snap(sim, o) {
        var n = sim.players.length, i, p, B = sim.ball;
        if (!o) o = { px: new Float64Array(n), py: new Float64Array(n), off: new Uint8Array(n), sc: [0, 0] };
        for (i = 0; i < n; i++) { p = sim.players[i]; o.px[i] = p.x; o.py[i] = p.y; o.off[i] = p.off ? 1 : 0; }
        o.bx = B.x; o.by = B.y; o.bz = B.z || 0; o.bvx = B.vx; o.bvy = B.vy; o.bvz = B.vz || 0;
        o.own = B.owner ? B.owner.id : -1; o.ofx = B.owner ? B.owner.fx : 0; o.ofy = B.owner ? B.owner.fy : 0; o.mode = sim.mode; o.dead = sim.dead; o.t = sim.t; o.fin = !!sim.finished; o.hold = !!sim.refHold;
        o.sc[0] = sim.teams[0].score; o.sc[1] = sim.teams[1].score; o.half = sim.half; o.high = B.high;
        o.evN = sim.events ? sim.events.length : 0;
        return o;
    }
    function aks(sim, i) {
        var p = sim.players[i], B = sim.ball, a = [sim.mode === 'dead' ? 'ölü:' + (sim.dead ? sim.dead.kind : '?') : 'canlı'];
        if (!p) return a.join('/');
        if (B.owner === p) a.push('topta' + (p.dribble ? ':sürme' : '') + (p.knock ? ':vur-koş' : ''));
        if (sim.pass && sim.pass.active && sim.pass.from === p) a.push('pas:' + (sim.pass.tag || ''));
        if (sim.pass && sim.pass.active && sim.pass.to === p) a.push('pas_alıcı');
        if (sim.shot && sim.shot.shooter === p) a.push('şut');
        if (sim.dead && sim.dead.taker === p) a.push('vuruşçu');
        if (p.off) a.push('oyun_dışı');
        return a.join('/');
    }
    function rec(D, k, o) {
        var sim = D.sim, kd = KOD[k] || ['uyari', k];
        D.count[k] = (D.count[k] || 0) + 1;
        var r = { k: k, onem: kd[0], dk: clk(sim), tick: sim.audit ? sim.audit.ticks : D.steps, t: r2(sim.t) };
        for (var x in o) r[x] = o[x];
        if (r.p != null && r.p >= 0 && !r.oyuncu) { r.oyuncu = pName(sim, r.p); if (!r.aks) r.aks = aks(sim, r.p); }
        if (!r.neden) r.neden = kd[1];
        var f = D.first[k] || (D.first[k] = []); if (f.length < FIRST_N) f.push(r);
        D.recs.push(r); if (D.recs.length > MAXREC) D.recs.shift();
        T.dirty = true;
        return r;
    }
    function epi(D, key, on) { var was = !!D.ep[key]; D.ep[key] = on ? 1 : 0; return on && !was; }      // bölüm başlangıcı: sürekli durumu bir kez say

    /* adımlar arası: köprü/sunum katmanı sim'i değiştirdi mi (oyuncu değişikliği, zorla gol kurgusu, hakem kararı vb.) */
    function between(D) {
        var a = D.post, b = D.pre, sim = D.sim, n = sim.players.length, i, d;
        if (!a) return;
        for (i = 0; i < n; i++) {
            if (a.off[i] !== b.off[i]) continue;
            d = hyp(b.px[i] - a.px[i], b.py[i] - a.py[i]);
            if (d > .05 && !b.off[i]) rec(D, 'dis_isinlanma', { p: i, once: [r2(a.px[i]), r2(a.py[i])], sonra: [r2(b.px[i]), r2(b.py[i])], m: r2(d), neden: 'oyuncu adımlar arasında ' + r2(d) + ' m yer değiştirdi' });
        }
        d = hyp(b.bx - a.bx, b.by - a.by);
        if (d > .05) rec(D, 'dis_isinlanma', { p: b.own, once: [r2(a.bx), r2(a.by)], sonra: [r2(b.bx), r2(b.by)], m: r2(d), neden: 'top adımlar arasında ' + r2(d) + ' m yer değiştirdi (mod ' + a.mode + '→' + b.mode + ')' });
        if (a.sc[0] !== b.sc[0] || a.sc[1] !== b.sc[1]) {
            var ge = scanEvents(D, a.evN, b.evN).goals;      // dışarıdan S.awardGoal: GOL olayıyla birlikte (kurallı)
            if (ge[0] + ge[1] !== (b.sc[0] - a.sc[0]) + (b.sc[1] - a.sc[1])) rec(D, 'dis_skor', { once: a.sc.slice(), sonra: b.sc.slice(), neden: 'skor adımlar arasında GOL olayı olmadan değişti' });
        }
        if (b.evN > a.evN) eventsIn(D, a.evN, b.evN, 'dış');
        supDead(D, a, b);
    }
    /* kullanılmadan yerine başka duran top geçen duran top (devre sonu, avantaj dönüşü, hakem kararı): istatistik yürütmede sayılır, olay verilişte */
    function supDead(D, a, b) { if (a.mode === 'dead' && a.dead && b.dead !== a.dead) { var exe = b.mode === 'live' && !b.dead; if (!exe && b.dead) { var k = a.dead.kind + a.dead.team; D.sup[k] = (D.sup[k] || 0) + 1; } } }
    function scanEvents(D, i0, i1) { var ev = D.sim.events, g = [0, 0], ty = {}; for (var i = i0; i < i1; i++) { var e = ev[i]; ty[e.type] = 1; if (e.type === 'GOAL' && e.team >= 0) g[e.team]++; } return { goals: g, ty: ty }; }

    /* olay kaydı: sayımlar + yinelenen olay */
    function eventsIn(D, i0, i1, src) {
        var ev = D.sim.events, i, e, m;
        for (i = i0; i < i1; i++) {
            e = ev[i]; if (!e) continue;
            D.ev.n++; D.ev.byType[e.type] = (D.ev.byType[e.type] || 0) + 1;
            if (e.team === 0 || e.team === 1) { var bt = D.ev.byTeam[e.team]; bt[e.type] = (bt[e.type] || 0) + 1;
                if (e.type === 'CARD') { var ck = 'CARD_' + (e.meta && e.meta.card); bt[ck] = (bt[ck] || 0) + 1; }
                if (e.type === 'SHOT' && e.meta && e.meta.on) bt.SHOT_ON = (bt.SHOT_ON || 0) + 1; }
            if (e.id != null) { if (D.ids[e.id]) rec(D, 'yinelenen_olay', { p: e.p, olay: e.type, neden: 'olay kimliği ' + e.id + ' iki kez' }); D.ids[e.id] = 1; }
            if (e.type === 'GOAL' && (e.team === 0 || e.team === 1)) { if (e.t - D.lastGoal[e.team] < E.GOAL_DUP) rec(D, 'yinelenen_olay', { p: e.p, olay: 'GOAL', once: r2(D.lastGoal[e.team]), sonra: r2(e.t), neden: 'aynı takım ' + r2(e.t - D.lastGoal[e.team]) + ' sn içinde iki GOL' }); D.lastGoal[e.team] = e.t; }
            if (e.type === 'SHOT' && e.p >= 0) { m = D.lastShot[e.p]; if (m != null && e.t - m < E.SHOT_DUP) rec(D, 'yinelenen_olay', { p: e.p, olay: 'SHOT', neden: 'aynı oyuncu ' + r2(e.t - m) + ' sn içinde iki şut' }); D.lastShot[e.p] = e.t; }
            if (e.type === 'FULLTIME') { if (++D.ftN > 1 && !D.penSO) rec(D, 'yinelenen_olay', { olay: 'FULLTIME', neden: 'maç sonu iki kez' }); }
            if (e.type === 'HALFTIME') { if (++D.htN > 1) rec(D, 'yinelenen_olay', { olay: 'HALFTIME', neden: 'devre arası iki kez' }); }
            if (T.k3on && (e.type === 'PASS' || e.type === 'SHOT' || e.type === 'CLEAR') && e.p >= 0 && D.k3.length < 40) D.k3.push({ p: e.p, t: e.t, ty: e.type, min: 9 });
        }
    }

    /* adım sonrası denetimler */
    function after(D) {
        var sim = D.sim, a = D.pre, n = sim.players.length, B = sim.ball, i, j, p, d, dt = (sim.C && sim.C.DT) || .04;
        D.steps++;
        var b = D.post = snap(sim, D.post);
        var es = scanEvents(D, a.evN, b.evN), ty = es.ty, nEv = b.evN - a.evN, kickEv = !!(ty.PASS || ty.SHOT || ty.CLEAR || ty.HEADER), anyBallEv = nEv > 0;
        if (nEv > 0) eventsIn(D, a.evN, b.evN, 'adım');
        var modeCh = a.mode !== b.mode || a.dead !== b.dead, reset = !!(ty.HALFTIME || ty.KICKOFF);
        supDead(D, a, b);
        /* saat */
        if (!a.fin && !a.hold && !b.hold && b.t <= a.t && !b.fin) rec(D, 'saat_durdu', { once: r2(a.t), sonra: r2(b.t), aks: 'mod ' + b.mode });
        if (b.t < a.t - 1e-9) rec(D, 'saat_geri', { once: r2(a.t), sonra: r2(b.t) });
        var FULL = sim.C && sim.C.FULL_S || 2800;
        if (!b.fin && b.t > FULL + 700 && epi(D, 'bitmiyor', true)) rec(D, 'mac_bitmiyor', { sonra: r2(b.t), neden: 'sim.t ' + r2(b.t) + ' > FULL_S + 700' });
        /* NaN / saha dışı / ışınlanma (oyuncu) */
        for (i = 0; i < n; i++) {
            p = sim.players[i];
            if (!fin(p.x) || !fin(p.y) || !fin(p.vx) || !fin(p.vy)) { if (epi(D, 'nan' + i, true)) rec(D, 'nan', { p: i, sonra: [p.x, p.y, p.vx, p.vy], neden: 'oyuncu konum/hız sayı değil' }); continue; } else D.ep['nan' + i] = 0;
            if (b.off[i]) { if (!a.off[i]) rec(D, 'reset', { p: i, neden: 'oyuncu oyundan çıktı (kırmızı kart)' }); continue; }
            if (epi(D, 'sdo' + i, p.x < -E.FLD_P || p.x > 105 + E.FLD_P || p.y < -E.FLD_P || p.y > 68 + E.FLD_P)) rec(D, 'saha_disi_oyuncu', { p: i, sonra: [r2(p.x), r2(p.y)] });
            if (a.off[i]) continue;
            d = hyp(b.px[i] - a.px[i], b.py[i] - a.py[i]);
            if (d > E.P_JUMP) {
                if (reset) rec(D, 'reset', { p: i, m: r2(d), neden: (ty.HALFTIME ? 'devre arası' : 'başlama') + ' dizilişi ' + r2(d) + ' m' });
                else rec(D, 'isinlanma_oyuncu', { p: i, once: [r2(a.px[i]), r2(a.py[i])], sonra: [r2(b.px[i]), r2(b.py[i])], m: r2(d), olaylar: Object.keys(ty).join(','), neden: 'bir adımda ' + r2(d) + ' m (en çok ' + E.P_JUMP + ')' });
            }
        }
        /* top: NaN, saha dışı */
        if (!fin(B.x) || !fin(B.y) || !fin(B.z || 0) || !fin(B.vx) || !fin(B.vy) || !fin(B.vz || 0)) { if (epi(D, 'nanB', true)) rec(D, 'nan', { p: b.own, sonra: [B.x, B.y, B.z, B.vx, B.vy, B.vz], neden: 'top konum/hız sayı değil' }); return endCheck(D); } else D.ep.nanB = 0;
        if (epi(D, 'sdt', b.mode === 'live' && a.mode === 'live' && (B.x < -E.FLD_BX || B.x > 105 + E.FLD_BX || B.y < -E.FLD_BY || B.y > 68 + E.FLD_BY || (B.z || 0) < -.05 || (B.z || 0) > E.BZ))) rec(D, 'saha_disi_top', { p: b.own, sonra: [r2(B.x), r2(B.y), r2(B.z || 0)], aks: 'canlı top' });
        /* top: ışınlanma / vuruş sıçraması */
        var bd = hyp(b.bx - a.bx, b.by - a.by), ownCh = a.own !== b.own, vPre = hyp(a.bvx, a.bvy), vPost = hyp(b.bvx, b.bvy);
        var expect = Math.max(vPre, vPost) * dt + E.B_SLACK;
        if (b.mode === 'live' && a.mode === 'live' && !modeCh && bd > expect) {
            var gkNow = b.own >= 0 && sim.players[b.own].role === 'GK';
            if (kickEv) { if (bd - vPost * dt > E.B_KICK) rec(D, 'vurus_sicramasi', { p: kicker(sim, a.evN, b.evN), once: [r2(a.bx), r2(a.by)], sonra: [r2(b.bx), r2(b.by)], m: r2(bd - vPost * dt), olaylar: Object.keys(ty).join(','), neden: 'vuruşta top ' + r2(bd) + ' m sıçradı' }); }
            else if (ownCh && bd <= (gkNow ? E.B_GAIN : E.B_GAIN * .7)) { /* sahiplik değişimi: top ayağa/ele alındı */ }
            else if (!ownCh && a.own >= 0 && bd <= E.B_GAIN) rec(D, 'sahipli_top_sicrama', { p: a.own, once: { top: [r2(a.bx), r2(a.by)], bakis: [r2(a.ofx), r2(a.ofy)] }, sonra: { top: [r2(b.bx), r2(b.by)], bakis: [r2(b.ofx), r2(b.ofy)] }, m: r2(bd), olaylar: Object.keys(ty).join(',') || '-', sahiplik_sn: r2(b.t - D.ownT0), neden: 'sahipli top bir adımda ' + r2(bd) + ' m (sahiplikten ' + r2(b.t - D.ownT0) + ' sn sonra); bakış ' + r2(Math.acos(Math.max(-1, Math.min(1, a.ofx * b.ofx + a.ofy * b.ofy))) * 57.3) + '° döndü' });
            else if (!anyBallEv || bd > E.B_GAIN) rec(D, 'isinlanma_top', { p: b.own >= 0 ? b.own : a.own, once: [r2(a.bx), r2(a.by)], sonra: [r2(b.bx), r2(b.by)], m: r2(bd), olaylar: Object.keys(ty).join(',') || '-', sahip: [a.own, b.own], neden: 'top bir adımda ' + r2(bd) + ' m (beklenen ≤ ' + r2(expect) + ')' });
        }
        /* temassız yön/hız değişimi: sahipsiz canlı top, olay yok, yakında oyuncu yok, kale çerçevesinden uzak */
        if (a.mode === 'live' && b.mode === 'live' && a.own < 0 && b.own < 0 && !anyBallEv && vPre > E.V_MIN) {
            var dot = (a.bvx * b.bvx + a.bvy * b.bvy) / Math.max(1e-9, vPre * vPost), ang = vPost > 1 ? Math.acos(Math.max(-1, Math.min(1, dot))) : 0;
            if (ang > E.ANG || vPost > vPre + E.DV) {
                var nr = nearest(sim, b.bx, b.by), frame = (Math.abs(b.bx) < 2.5 || Math.abs(b.bx - 105) < 2.5) && b.by > 34 - 3.66 - 1.5 && b.by < 34 + 3.66 + 1.5;
                if (!(nr.d < (nr.gk ? E.NEAR_GK : E.NEAR)) && !frame) rec(D, 'temassiz_top', { p: nr.i, once: { v: r2(vPre), yon: r2(Math.atan2(a.bvy, a.bvx) * 57.3) }, sonra: { v: r2(vPost), yon: r2(Math.atan2(b.bvy, b.bvx) * 57.3) }, m: r2(nr.d), aks: 'z ' + r2(B.z || 0), neden: 'açı ' + r2(ang * 57.3) + '°, hız ' + r2(vPre) + '→' + r2(vPost) + ' m/sn; en yakın oyuncu ' + r2(nr.d) + ' m' });
            }
        }
        /* tünel geçişi: hızlı yerden top adım boyunca bir oyuncunun 0,45 m yakınından geçti ama iki uç nokta da alma yarıçapının dışında (motor yalnız uç noktayı sınar) */
        if (a.mode === 'live' && b.mode === 'live' && a.own < 0 && b.own < 0 && !anyBallEv && vPre > 12 && a.bz < .6 && (B.z || 0) < .6) {
            for (i = 0; i < n; i++) { p = sim.players[i]; if (b.off[i] || p.cd > 0) continue; var R0 = (vPre > 16 ? .8 : 1) + (p.role === 'GK' ? .5 : 0), sdx = segD(b.px[i], b.py[i], a.bx, a.by, b.bx, b.by);
                if (sdx < .45 && hyp(b.px[i] - a.bx, b.py[i] - a.by) > R0 && hyp(b.px[i] - b.bx, b.py[i] - b.by) > R0) { rec(D, 'top_tunel', { p: i, m: r2(sdx), once: [r2(a.bx), r2(a.by)], sonra: [r2(b.bx), r2(b.by)], neden: 'top ' + r2(vPre) + ' m/sn ile oyuncunun ' + r2(sdx) + ' m yanından geçti; uç noktalar ' + R0 + ' m alma yarıçapı dışında' }); break; } }
        }
        /* sahiplik */
        if (b.own >= 0) {
            var o = sim.players[b.own], od = hyp(o.x - B.x, o.y - B.y);
            if (o.off) { if (epi(D, 'offown', true)) rec(D, 'sahipsiz_sahip', { p: b.own }); } else D.ep.offown = 0;
            if (epi(D, 'own' + b.own, od > E.OWN_FAR)) rec(D, 'imkansiz_sahiplik', { p: b.own, m: r2(od), once: [r2(o.x), r2(o.y)], sonra: [r2(B.x), r2(B.y)], neden: 'top sahibinden ' + r2(od) + ' m uzakta (sınır ' + E.OWN_FAR + ')' });
            if (ownCh) { var gd = hyp(o.x - a.bx, o.y - a.by), lim = o.role === 'GK' ? E.GAIN_FAR_GK : E.GAIN_FAR; if (gd > lim && a.mode === 'live' && b.mode === 'live') rec(D, kickEv ? 'vurus_kazanim' : 'uzak_kazanim', { p: b.own, m: r2(gd), once: { sahip: a.own, top: [r2(a.bx), r2(a.by)] }, sonra: { sahip: b.own, oyuncu: [r2(o.x), r2(o.y)] }, olaylar: Object.keys(ty).join(',') || '-', neden: 'yeni sahip topa ' + r2(gd) + ' m uzaktan kazandı (sınır ' + lim + ')' }); }
            if (b.mode === 'dead' && epi(D, 'deadown', true)) rec(D, 'olu_topta_sahip', { p: b.own, aks: 'ölü:' + (sim.dead && sim.dead.kind) });
            if (b.mode !== 'dead') D.ep.deadown = 0;
            if (B.high && epi(D, 'ownhigh', true)) rec(D, 'cakisan_aksiyon', { p: b.own, neden: 'top hem sahipli hem havada (B.high)' }); else if (!B.high) D.ep.ownhigh = 0;
            if (D.ownRef !== o || ownCh) { D.ownRef = o; D.ownT0 = b.t; D.holdDone = false; }
            else if (!D.holdDone && b.mode === 'live' && b.t - D.ownT0 > E.HOLD_T) { D.holdDone = true; rec(D, 'top_tutma', { p: b.own, m: r2(b.t - D.ownT0), neden: r2(b.t - D.ownT0) + ' sn topta' }); }
        } else { D.ownRef = null; D.ep.offown = 0; D.ep.deadown = 0; D.ep.ownhigh = 0; }
        if (sim.mode === 'live' && sim.dead && epi(D, 'livedead', true)) rec(D, 'cakisan_aksiyon', { neden: 'mod canlı ama duran top kaydı açık' }); else if (!(sim.mode === 'live' && sim.dead)) D.ep.livedead = 0;
        if (sim.pass && sim.pass.active && sim.shot && epi(D, 'passshot', true)) rec(D, 'cakisan_aksiyon', { p: sim.shot.shooter ? sim.shot.shooter.id : -1, neden: 'aynı anda etkin pas ve şut' }); else if (!(sim.pass && sim.pass.active && sim.shot)) D.ep.passshot = 0;
        /* takılı aksiyonlar */
        var dd = sim.dead;
        if (b.mode === 'dead' && dd) { if (dd.timer > (dd.wait || 0) + E.DEAD_X && D.deadRef !== dd) { D.deadRef = dd; var tk = dd.taker; rec(D, 'takili_olu_top', { p: tk ? tk.id : -1, m: r2(dd.timer), aks: 'ölü:' + dd.kind, neden: dd.kind + ' ' + r2(dd.timer) + ' sn bekledi (bekleme ' + r2(dd.wait) + ' sn)' + (tk ? '; vuruşçu topa ' + r2(hyp(tk.x - dd.x, tk.y - dd.y)) + ' m' : '') }); } }
        if (sim.pass && sim.pass.active) {
            if (D.passRef !== sim.pass) { D.passRef = sim.pass; D.passT0 = b.t; D.passDone = false; D.pv = [1e9, 0, 0]; }
            else if (b.own < 0) { D.pv[0] = Math.min(D.pv[0], vPost); D.pv[1] = Math.max(D.pv[1], vPost); D.pv[2]++; }
            if (!D.passDone && b.t - D.passT0 > E.PASS_T) { D.passDone = true; rec(D, 'takili_pas', { p: sim.pass.from ? sim.pass.from.id : -1, m: r2(b.t - D.passT0), aks: 'pas:' + (sim.pass.tag || ''), sonra: { sahip: b.own, v: r2(vPost), vmin: r2(D.pv[0]), vmax: r2(D.pv[1]), z: r2(B.z || 0), havada: !!B.high, mod: b.mode, alici: sim.pass.to ? sim.pass.to.id : -1, top: [r2(B.x), r2(B.y)] }, neden: 'pas ' + r2(b.t - D.passT0) + ' sn etkin kaldı (top ' + (b.own >= 0 ? 'sahipli' : 'sahipsiz') + ', hız şimdi ' + r2(vPost) + ', en az ' + r2(D.pv[0]) + ', en çok ' + r2(D.pv[1]) + ' m/sn' + (B.high ? ', havada kaydı' : '') + ')' }); }
        } else D.passRef = null;
        if (sim.shot) { if (D.shotRef !== sim.shot) { D.shotRef = sim.shot; D.shotT0 = b.t; D.shotDone = false; } else if (!D.shotDone && b.t - D.shotT0 > E.SHOT_T) { D.shotDone = true; rec(D, 'takili_sut', { p: sim.shot.shooter ? sim.shot.shooter.id : -1, m: r2(b.t - D.shotT0) }); } } else D.shotRef = null;
        if (B.high && B.high.tLand != null && b.t > B.high.tLand + E.HIGH_T && D.highDone !== B.high) { D.highDone = B.high; rec(D, 'takili_hava', { p: b.own, m: r2(b.t - B.high.tLand), neden: 'iniş zamanından ' + r2(b.t - B.high.tLand) + ' sn sonra hâlâ havada kaydı' }); }
        if (b.mode === 'live' && b.own < 0 && vPost < .3 && !(sim.pass && sim.pass.active) && !sim.shot && !B.high) { if (!D.looseOn) { D.looseOn = true; D.looseT = b.t; D.looseDone = false; } else if (!D.looseDone && b.t - D.looseT > E.LOOSE_T) { D.looseDone = true; var nr2 = nearest(sim, B.x, B.y); rec(D, 'sahipsiz_top', { p: nr2.i, m: r2(b.t - D.looseT), sonra: [r2(B.x), r2(B.y)], neden: r2(b.t - D.looseT) + ' sn duran sahipsiz top; en yakın oyuncu ' + r2(nr2.d) + ' m' }); } } else D.looseOn = false;
        /* üst üste binme (canlı oyunda sürekli) */
        if (b.mode === 'live') {
            for (i = 0; i < n; i++) { if (b.off[i]) continue; for (j = i + 1; j < n; j++) { if (b.off[j]) continue; var k = i * n + j, dx = b.px[i] - b.px[j], dy = b.py[i] - b.py[j];
                if (dx * dx + dy * dy < E.OVL_D * E.OVL_D) { if (D.ovl[k] < 30000 && ++D.ovl[k] === E.OVL_N) rec(D, 'ust_uste', { p: i, p2: j, oyuncu2: pName(sim, j), m: r2(hyp(dx, dy)), neden: pName(sim, i) + ' ile ' + pName(sim, j) + ' ' + r2(hyp(dx, dy)) + ' m (' + E.OVL_N + '+ adım)' }); } else D.ovl[k] = 0; } }
        }
        /* skor ↔ GOL (adım içi) */
        for (var tm = 0; tm < 2; tm++) { var dsc = b.sc[tm] - a.sc[tm]; if (dsc !== es.goals[tm]) rec(D, 'skor_olay', { once: a.sc.slice(), sonra: b.sc.slice(), neden: 'takım ' + tm + ': skor +' + dsc + ', GOL olayı ' + es.goals[tm] }); }
        endCheck(D);
    }
    function segD(px, py, ax, ay, bx, by) { var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy, t = l2 ? ((px - ax) * dx + (py - ay) * dy) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t; return hyp(px - (ax + dx * t), py - (ay + dy * t)); }
    function kicker(sim, i0, i1) { for (var i = i0; i < i1; i++) { var e = sim.events[i]; if (/^(PASS|SHOT|CLEAR|HEADER)$/.test(e.type)) return e.p; } return -1; }
    function nearest(sim, x, y) { var bi = -1, bd = 1e9, gk = false; for (var i = 0; i < sim.players.length; i++) { var p = sim.players[i]; if (p.off) continue; var d = hyp(p.x - x, p.y - y); if (d < bd) { bd = d; bi = i; gk = p.role === 'GK'; } } return { i: bi, d: bd, gk: gk }; }

    /* maç sonu: istatistik ↔ olay */
    function endCheck(D) {
        var sim = D.sim; if (!sim.finished || D.endChecked) return; D.endChecked = true;
        var out = [], E2 = D.ev.byTeam, dead = sim.dead && sim.mode === 'dead' ? sim.dead.kind : null;
        for (var tm = 0; tm < 2; tm++) {
            var st = sim.teams[tm].st, e = E2[tm], g = function (k) { return e[k] || 0; };
            var rows = [
                ['gol', sim.teams[tm].score, g('GOAL')], ['sut', st.shots, g('SHOT')], ['pas', st.passes, g('PASS') + g('CLEAR')], ['isabetli_pas', st.passOk, g('PASS_OK')],
                ['faul', st.fouls, g('FOUL')], ['ofsayt', st.offsides, g('OFFSIDE')], ['kurtaris', st.saves, g('SAVE')], ['sari', st.yellow, g('CARD_Y')], ['kirmizi', st.red, g('CARD_R')],
                ['korner', st.corners, g('CORNER')], ['tac', st.throwins, g('THROWIN')], ['top_kesme', st.inter, g('INTERCEPT')]
            ];
            for (var r = 0; r < rows.length; r++) {
                var w = rows[r]; if (w[1] === w[2]) continue;
                var dk0 = w[0] === 'korner' ? 'corner' : w[0] === 'tac' ? 'throw' : null, al = dk0 ? (D.sup[dk0 + tm] || 0) + (dead === dk0 && sim.dead.team === tm ? 1 : 0) : 0;
                var pend = !!dk0 && w[2] - w[1] > 0 && w[2] - w[1] <= al;
                out.push({ takim: tm, alan: w[0], ist: w[1], olay: w[2], kurallı: !!pend });
                rec(D, pend ? 'ist_bilgi' : 'ist_olay', { aks: 'takım ' + tm, alan: w[0], once: { istatistik: w[1] }, sonra: { olay: w[2] }, neden: 'takım ' + tm + ' ' + w[0] + ': istatistik ' + w[1] + ' ≠ olay ' + w[2] + (pend ? ' (kullanılmadan kalan/yerine geçen ' + dk0 + ': ' + al + ')' : '') });
            }
            var onT = st.sot, gl = 0; for (var i = 0; i < sim.events.length; i++) { var ev = sim.events[i]; if (ev.type === 'GOAL' && ev.team === tm && !(ev.meta && (ev.meta.own || ev.meta.awarded)) && ev.meta && ev.meta.shot) gl++; }
            if (onT < gl) { out.push({ takim: tm, alan: 'isabetli_sut<gol', ist: onT, olay: gl }); rec(D, 'ist_olay', { aks: 'takım ' + tm, alan: 'isabetli_sut', once: { isabetli: onT }, sonra: { sut_golu: gl }, neden: 'takım ' + tm + ': isabetli şut (' + onT + ') şut golünden (' + gl + ') az' }); }
        }
        D.end = { skor: [sim.teams[0].score, sim.teams[1].score], fark: out };
    }

    /* ---------- raporlama ---------- */
    function sum(D) {
        return { id: D.id, seed: D.seed, names: D.names, adim: D.steps, skor: [D.sim.teams[0].score, D.sim.teams[1].score], bitti: !!D.sim.finished, sayim: D.count, olay: D.ev.byType, son: D.end,
            ilk: D.first, k3: D.k3n ? { n: D.k3n, ort: r2(D.k3sum / D.k3n), max: r2(D.k3max), uzak: D.k3bad } : null };
    }
    function report(o) {
        o = o || {}; var tot = {}, i, k, L = T.list;
        for (i = 0; i < L.length; i++) for (k in L[i].count) tot[k] = (tot[k] || 0) + L[i].count[k];
        var kr = 0; for (k in tot) if ((KOD[k] || [])[0] === 'kritik') kr += tot[k];
        return { surum: 1, acik: T.on, mac: L.length, toplam: tot, kritik: kr, eşik: E, maclar: o.ozet === false ? undefined : L.map(sum), son: o.son ? (L.length ? L[L.length - 1].recs.slice(-o.son) : []) : undefined };
    }
    function reset() { T.list.forEach(detach); T.list.length = 0; T.dirty = true; }

    /* ---------- tarayıcı: Sim2D.create sarmalama, görüntü denetimleri, kaplama ---------- */
    function wrapCreate() {
        if (T.wrapped || !root.Sim2D || typeof root.Sim2D.create !== 'function') return;
        var c0 = root.Sim2D.create; T.create0 = c0; T.wrapped = true;
        root.Sim2D.create = function (o) {
            if (T.on) { try { T.lastOpts = JSON.parse(JSON.stringify(o || {})); } catch (e) { T.lastOpts = null; } }
            var s = c0.apply(this, arguments);
            if (T.on) { try { attach(s, o); } catch (e) { } }
            return s;
        };
    }
    function curSim() { try { return root.ado2d && root.ado2d.sim ? root.ado2d.sim() : null; } catch (e) { return null; } }
    function curD() { var s = curSim(); for (var i = T.list.length - 1; i >= 0; i--) if (T.list[i].sim === s) return T.list[i]; return T.list[T.list.length - 1] || null; }
    var MON = { t: -1, rt: 0, hold: null, ht: 0 };
    function monitor() {
        if (!T.on) return;
        var s = curSim(), st = null; try { st = root.ado2d && root.ado2d.state; } catch (e) { }
        if (s) { var D = curD(); if (!D || D.sim !== s) D = attach(s, null); }
        var now = Date.now(), D2 = curD();
        if (s && st && D2 && D2.sim === s && st.running && !s.finished && !s.refHold) {
            if (s.t !== MON.t) { MON.t = s.t; MON.rt = now; }
            else if (!st.hold && now - MON.rt > 8000 && epi(D2, 'sunum', true)) rec(D2, 'sunum_durdu', { aks: 'hold ' + (st.hold || '-'), neden: 'canlı akışta sim saati ' + Math.round((now - MON.rt) / 1000) + ' sn ilerlemedi' });
            if (s.t !== MON.t || st.hold) D2.ep.sunum = 0;
            if (st.hold && st.hold !== 'half' && st.hold !== 'end') { if (MON.hold !== st.hold) { MON.hold = st.hold; MON.ht = now; } else if (now - MON.ht > 25000 && epi(D2, 'bekle' + st.hold, true)) rec(D2, 'sunum_bekleme', { aks: 'hold ' + st.hold, neden: st.hold + ' beklemesi ' + Math.round((now - MON.ht) / 1000) + ' sn' }); }
            else { MON.hold = null; }
        }
    }
    /* 3B: vuruş olayından sonra görüntü saatinde ayak-top uzaklığının en küçüğü (engine_4 test kancası R._carryFoot okunur) */
    function k3Frame() {
        if (!T.on || !T.k3on) return;
        var D = curD(), R = null; try { R = root.ado2d && root.ado2d.view && root.ado2d.view.renderer(); } catch (e) { }
        if (D && R && typeof R._carryFoot === 'function' && D.k3.length) {
            for (var i = D.k3.length - 1; i >= 0; i--) {
                var q = D.k3[i], f = null; try { f = R._carryFoot(q.p); } catch (e) { f = null; }
                if (!f || !f.ball || !fin(f.clk)) { if (D.sim.t - q.t > 3) D.k3.splice(i, 1); continue; }
                if (f.clk < q.t - .35) continue;
                var dl = hyp(f.L[0] - f.ball[0], f.L[1] - f.ball[1], f.L[2] - f.ball[2]), dr = hyp(f.R[0] - f.ball[0], f.R[1] - f.ball[1], f.R[2] - f.ball[2]); if (fin(dl) && fin(dr)) q.min = Math.min(q.min, dl, dr);
                if (f.clk > q.t + .25) { D.k3.splice(i, 1); if (q.min < 9) { D.k3n++; D.k3sum += q.min; if (q.min > D.k3max) D.k3max = q.min; if (q.min > E.FOOT_3B) { D.k3bad++; rec(D, 'temas_3b', { p: q.p, olay: q.ty, m: r2(q.min), neden: q.ty + ' anında en yakın ayak topa ' + r2(q.min) + ' m (sınır ' + E.FOOT_3B + ')' }); } } }
            }
        }
        if (root.requestAnimationFrame) root.requestAnimationFrame(k3Frame);
    }
    function overlay(on) {
        var doc = root.document; if (!doc || !doc.body) return;
        if (!on) { if (T.ov) { T.ov.remove(); T.ov = null; } return; }
        if (T.ov) return;
        var d = doc.createElement('div'); d.id = 'ado-tani';
        d.style.cssText = 'position:fixed;left:6px;top:6px;z-index:2147483000;max-width:min(420px,92vw);max-height:46vh;overflow:auto;font:11px/1.35 ui-monospace,Menlo,Consolas,monospace;color:#e8f0ff;background:rgba(8,12,20,.82);border:1px solid rgba(120,160,255,.45);border-radius:6px;padding:6px 8px;pointer-events:auto;white-space:pre-wrap';
        d.addEventListener('click', function (ev) { var t = ev.target; if (t && t.getAttribute && t.getAttribute('data-x') === 'kapat') { overlay(false); } else if (t && t.getAttribute && t.getAttribute('data-x') === 'kopya') { try { console.log('AdoTani', JSON.stringify(report({ son: 50 }))); } catch (e) { } } });
        doc.body.appendChild(d); T.ov = d; T.dirty = true;
    }
    function ovDraw() {
        if (!T.on || !T.ov || !T.dirty) return; T.dirty = false;
        var D = curD(), h = '<b>Tanılama</b> <span data-x="kopya" style="cursor:pointer;text-decoration:underline">konsola yaz</span> <span data-x="kapat" style="cursor:pointer;float:right">✕</span>\n';
        if (!D) { T.ov.innerHTML = h + 'maç yok'; return; }
        var ks = Object.keys(D.count).sort(function (a, b) { return D.count[b] - D.count[a]; });
        h += 'maç #' + D.id + ' · adım ' + D.steps + ' · olay ' + D.ev.n + '\n';
        for (var i = 0; i < ks.length; i++) { var kd = KOD[ks[i]] || ['?']; h += (kd[0] === 'kritik' ? '<b style="color:#ff8a8a">' : kd[0] === 'bilgi' ? '<span style="color:#9fb3c8">' : '<span style="color:#ffd27a">') + ks[i] + ' ' + D.count[ks[i]] + (kd[0] === 'kritik' ? '</b>' : '</span>') + (i % 3 === 2 ? '\n' : '  '); }
        h += '\n';
        var L = D.recs.slice(-6).reverse(); for (var j = 0; j < L.length; j++) { var r = L[j]; h += r.dk + ' ' + r.k + (r.oyuncu ? ' · ' + r.oyuncu : '') + ' — ' + String(r.neden).replace(/</g, '&lt;') + '\n'; }
        T.ov.innerHTML = h;
    }
    function enable(on) {
        T.on = !!on;
        if (T.on) {
            wrapCreate(); var s = curSim(); if (s) attach(s, null);
            if (root.document && !T.iv && root.setInterval) {
                T.iv = root.setInterval(function () { try { monitor(); } catch (e) { } if (++T.ovT % 2 === 0) T.dirty = true; try { ovDraw(); } catch (e) { } }, 500);
                var go = function () { overlay(true); }; if (root.document.body) go(); else root.document.addEventListener('DOMContentLoaded', go);
                T.k3on = !!(root.ado2d || root.Ado3D); if (T.k3on && root.requestAnimationFrame) root.requestAnimationFrame(k3Frame);
            }
        } else { if (T.iv) { root.clearInterval(T.iv); T.iv = 0; } overlay(false); }
        return T.on;
    }

    var api = { enable: enable, attach: attach, detach: detach, report: report, reset: reset, overlay: overlay, state: T, kodlar: KOD, esik: E,
        create0: function () { return T.create0 || (root.Sim2D && root.Sim2D.create); }, lastOpts: function () { return T.lastOpts; }, cur: curD };
    if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
    root.AdoTani = api;
    if (envOn()) enable(true);
})(typeof window !== 'undefined' ? window : globalThis);
