/* =====================================================================
   ADOBALL · 2D MAÇ REYTİNGİ  (Rating2D)
   2D motorun olay günlüğünden (gol, asist, şut, kurtarış, top kapma, faul ...) 22 oyuncunun reytingini üretir.
   Neden ayrı bir model: klasik motordaki ağırlıklar (gol +1.1, asist +.55, top kapma +.15 ...) seyrek olaylar içindir.
   2D'de top kapma ve araya girme maç başına yüzlerce kez olur; eski köprü bunları düz topladığı için ön libero ve stoperler
   otomatik en yüksek reytingi alıyordu (24 tam maç ölçümü: MOTM'un %67'si defansif orta saha / stoper, 2+ gol atan oyuncu
   olan 8 maçın yalnızca 3'ünde MOTM o oyuncuydu, rol ortalamaları 7.06 ile 8.77 arasında dağılıyordu).
   Bu modelde:
     - Her olay ağırlığıyla toplanır. Sıklığı role göre değişen "arka plan" olayların (top kapma, araya girme, blok, hava topu,
       faul, ofsayt, şut) rolün BEKLENEN değeri kadarı düşülür ("rol dengesi", maç boyunca orantılı işler).
     - Sonuç olaylar (gol, asist, direk, kurtarış, yenen gol, kendi kalesine, kaçan penaltı) düz eklenir; rol dengesi bunların
       da bir kısmını (ALPHA) düşer, böylece hiçbir rol yapısal olarak yüksek ortalama almaz.
     - Yenen gol kaleci/defans/ön liberoya işlenir; kalesini kapatma bonusu yalnızca maç sonunda eklenir.
     - Sonuç 3.0-10.0 aralığına, toplamdan SONRA kısılır (sıra etkisi yok).
   Tablolar (DRIFT) proto/rate_eval.js ile 2D motorun tam maç olay günlüklerinden üretilir. Motor kalibrasyonu değişirse yeniden üretilmelidir.
   ===================================================================== */
(function (root) {
    'use strict';
    var IDX_ROLE = ['GK', 'LB', 'LCB', 'RCB', 'RB', 'LDM', 'RDM', 'LW', 'AM', 'RW', 'ST'];
    var GROUP = { GK: 'GK', LB: 'FB', RB: 'FB', LCB: 'CB', RCB: 'CB', LDM: 'DM', RDM: 'DM', LW: 'W', RW: 'W', AM: 'AM', ST: 'ST' };
    var W = {
        g: 1.10, a: .55, post: .10, og: -1.2,
        tk: .10, ic: .035, bl: .15, hd: .08,
        fl: -.10, flPen: -.5, off: -.05, yel: -.4, red: -1.5,
        shOn: .04, shOff: -.02, shOffX: -.25, penMiss: -.5,
        sv: .04, svX: .22, pksv: .9,
        conc: { GK: -.40, FB: -.12, CB: -.12, DM: -.04, W: 0, AM: 0, ST: 0 },
        clean: { GK: .40, FB: .25, CB: .25, DM: .10, W: 0, AM: 0, ST: 0 }
    };
    var ALPHA = 0.5;
    var DRIFT = { GK: 0.028, LB: 0.58, LCB: 0.998, RCB: 0.675, RB: 0.517, LDM: 1.069, RDM: 0.994, LW: 0.321, AM: 0.859, RW: 0.265, ST: 0.322 };   // rol başına (LCB rakip santrforu, RCB rakip 10 numarayı markaladığı için iş yükleri farklıdır) · 48 tam maçtan, ALPHA 0.5
    var LABEL = { g: 'Gol', a: 'Asist', post: 'Direk', og: 'Kendi kalesine', tk: 'Top kapma', ic: 'Araya girme', bl: 'Şut engelleme', hd: 'Hava topu', fl: 'Faul', flPen: 'Penaltıya neden', off: 'Ofsayt', shOn: 'İsabetli şut', shOff: 'İsabetsiz şut', penMiss: 'Kaçan penaltı', sv: 'Kurtarış', pksv: 'Penaltı kurtarışı', conc: 'Yenen gol', clean: 'Gol yemedi', role: 'Rol dengesi', yel: 'Sarı kart', red: 'Kırmızı kart' };

    function blank() { return { g: 0, a: 0, post: 0, og: 0, tk: 0, ic: 0, bl: 0, hd: 0, fl: 0, flPen: 0, off: 0, shOn: 0, shOff: 0, shOffX: 0, penMiss: 0, sv: 0, svX: 0, pksv: 0, yel: 0, red: 0 }; }
    // rolün beklenen değeri düşülen "arka plan" katkı
    function bgValue(c) { return W.tk * c.tk + W.ic * c.ic + W.bl * c.bl + W.hd * c.hd + W.fl * c.fl + W.off * c.off + W.shOn * c.shOn + W.shOff * c.shOff + W.shOffX * c.shOffX; }
    // sonuç katkı (gol, asist, ...); yenen gol ve kale kapatma takım düzeyinde eklenir
    function outValue(c) { return W.g * c.g + W.a * c.a + W.post * c.post + W.og * c.og + W.flPen * c.flPen + W.penMiss * c.penMiss + W.sv * c.sv + W.svX * c.svX + W.pksv * c.pksv; }
    // disiplin: sarı −0.40, kırmızı −1.50 (klasik motorla aynı ağırlıklar); rol dengesine girmez (kalibrasyon kartsız maçlardan yapıldı)
    function discValue(c) { return W.yel * c.yel + W.red * c.red; }
    function teamValue(g, conc, clean) { return (W.conc[g] || 0) * conc + (clean ? (W.clean[g] || 0) : 0); }
    function clamp(x) { return Math.max(3, Math.min(10, x)); }

    function create(o) {
        o = o || {};
        var total = o.total || 5400, roles = o.roles || IDX_ROLE.concat(IDX_ROLE), n = roles.length, lastShot = null, i;
        var R = { c: [], grp: [], role: [], conc: [0, 0], done: false, total: total, off: {} };
        for (i = 0; i < n; i++) { R.c.push(blank()); R.grp.push(GROUP[roles[i]] || 'AM'); R.role.push(roles[i]); }

        // olayı işler; reytingi etkileyen bir olay olduysa true döner
        R.onEvent = function (e) {
            var m = e.meta || {}, c = R.c[e.p];
            switch (e.type) {
                case 'SHOT':
                    lastShot = { p: e.p, pen: m.tag === 'PEN' };
                    if (!c) return false;
                    if (m.on) c.shOn++; else { c.shOff++; c.shOffX += (m.xg || 0); }
                    if (m.tag === 'PEN') c.penMiss++;               // gol olursa GOAL olayı geri alır
                    return true;
                case 'SAVE':
                    if (!c) return false;
                    c.sv++; c.svX += (m.xg || 0); if (lastShot && lastShot.pen && lastShot.p === e.p2) c.pksv++;
                    return true;
                case 'POST': if (!c) return false; c.post++; return true;
                case 'BLOCK': if (!c) return false; if (m.cross) c.ic++; else c.bl++; return true;      // [aical] pas / orta / uzaklaştırma bloğu (meta.cross) araya girmedir; şut engelleme yalnız şut
                case 'TACKLE': if (!c) return false; c.tk++; return true;
                case 'INTERCEPT': if (!c) return false; c.ic++; return true;
                case 'HEADER': if (!c || !m.inFront) return false; c.hd++; return true;
                case 'FOUL': if (!c) return false; c.fl++; if (m.pen) c.flPen++; return true;
                case 'OFFSIDE': if (!c) return false; c.off++; return true;
                case 'CARD':
                    if (!c) return false;
                    if (m.card === 'R') {
                        c.red++;
                        // oyundan atılan: rol dengesi ve yenen gol, atıldığı andan sonra işlemez (artık sahada değil)
                        if (!R.off[e.p]) R.off[e.p] = { pr: e.t != null ? Math.max(0, Math.min(1, e.t / total)) : null, conc: R.conc[R.tm(e.p)] };
                    } else c.yel++;
                    return true;
                case 'VAR':
                    // penaltı incelemesi (e.p = faul yapan savunmacı): iptalde "penaltıya neden" kaydı silinir; temas yoksa faul da silinir (ceza sahası dışı ise faul kalır)
                    if (m.kind === 'pen') {
                        if (!c || m.outcome !== 'cancel') return false;
                        if (c.flPen > 0) c.flPen--; if (m.reason !== 'disi' && c.fl > 0) c.fl--;
                        if (m.reason === 'ofsayt' && m.op != null && R.c[m.op]) R.c[m.op].off++;      // [offs] VAR_OG: ofsayttaki hücumcu
                        return true;
                    }
                    if (m.kind === 'red') return false;      // kart etkisi ardından gelen CARD olayından işlenir (onay / sarıya düşürme / kırmızıya çevirme)
                    // VAR ofsayt nedeniyle golü iptal ettiyse golcü ofsayttaydı (hakemin gördüğü ofsayt gibi sayılır); faul/el iptalinde kişi belirtilmez
                    var co = m.op != null && m.op >= 0 && R.c[m.op] ? R.c[m.op] : c;      // [offs] ofsayttaki oyuncu golcü olmayabilir (hücum evresi)
                    if (co && m.outcome === 'cancel' && m.reason === 'ofsayt') { co.off++; return true; }
                    if (m.outcome === 'cancel' && m.reason === 'faul' && m.fp != null && R.c[m.fp]) { R.c[m.fp].fl++; return true; }      // [var] VAR2: golü iptal ettiren faul
                    return false;
                case 'GOAL':
                    R.conc[1 - e.team]++;
                    if (c) {
                        if (m.own) c.og++;
                        else { c.g++; if (m.pen && c.penMiss > 0) c.penMiss--; }
                    }
                    if (!m.own && m.assist != null && m.assist >= 0 && R.c[m.assist]) R.c[m.assist].a++;
                    return true;
            }
            return false;
        };
        R.tm = function (idx) { return idx < (n >> 1) ? 0 : 1; };
        R.finish = function () { R.done = true; };
        // t: maç saniyesi (rol dengesi maç ilerledikçe orantılı işler); maç bittiyse tam uygulanır
        R.get = function (idx, t) {
            var c = R.c[idx]; if (!c) return 6.5;
            var g = R.grp[idx], tm = idx < (n >> 1) ? 0 : 1, pr = R.done ? 1 : Math.max(0, Math.min(1, (t || 0) / total)), of = R.off[idx], conc = R.conc[tm], clean = R.done && R.conc[tm] === 0;
            if (of) { if (of.pr != null) pr = Math.min(pr, of.pr); conc = of.conc; clean = false; }        // atılan oyuncu: kale kapatma bonusu yok, yenen gol atıldığı ana kadar
            return clamp(6.5 + bgValue(c) + outValue(c) + discValue(c) + teamValue(g, conc, clean) - (DRIFT[R.role[idx]] || 0) * pr);
        };
        R.all = function (t) { var a = [], k; for (k = 0; k < n; k++) a.push(R.get(k, t)); return a; };
        // gerekçe dökümü (arayüz için): [{k, label, n, v}], etkisi olanlar, büyükten küçüğe
        R.parts = function (idx, t) {
            var c = R.c[idx], out = [], g = R.grp[idx], tm = idx < (n >> 1) ? 0 : 1, pr = R.done ? 1 : Math.max(0, Math.min(1, (t || 0) / total)), of = R.off[idx], conc = R.conc[tm], clean = R.done && R.conc[tm] === 0;
            if (!c) return out;
            if (of) { if (of.pr != null) pr = Math.min(pr, of.pr); conc = of.conc; clean = false; }
            function add(k, cnt, v) { if (cnt && Math.abs(v) >= .005) out.push({ k: k, label: LABEL[k], n: cnt, v: v }); }
            add('g', c.g, W.g * c.g); add('a', c.a, W.a * c.a); add('post', c.post, W.post * c.post); add('og', c.og, W.og * c.og);
            add('tk', c.tk, W.tk * c.tk); add('ic', c.ic, W.ic * c.ic); add('bl', c.bl, W.bl * c.bl); add('hd', c.hd, W.hd * c.hd);
            add('fl', c.fl, W.fl * c.fl); add('flPen', c.flPen, W.flPen * c.flPen); add('off', c.off, W.off * c.off);
            add('shOn', c.shOn, W.shOn * c.shOn); add('shOff', c.shOff, W.shOff * c.shOff + W.shOffX * c.shOffX); add('penMiss', c.penMiss, W.penMiss * c.penMiss);
            add('sv', c.sv, W.sv * c.sv + W.svX * c.svX); add('pksv', c.pksv, W.pksv * c.pksv);
            add('yel', c.yel, W.yel * c.yel); add('red', c.red, W.red * c.red);
            add('conc', conc, (W.conc[g] || 0) * conc);
            if (clean) add('clean', 1, W.clean[g] || 0);
            add('role', 1, -(DRIFT[R.role[idx]] || 0) * pr);
            out.sort(function (x, y) { return Math.abs(y.v) - Math.abs(x.v); });
            return out;
        };
        return R;
    }

    var api = { create: create, W: W, ALPHA: ALPHA, DRIFT: DRIFT, GROUP: GROUP, IDX_ROLE: IDX_ROLE, LABEL: LABEL, bgValue: bgValue, outValue: outValue, discValue: discValue, teamValue: teamValue, blank: blank };
    if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Rating2D = api;
})(typeof window !== 'undefined' ? window : globalThis);
/* [reyting] v37 mac reytingi (Rating2Dv2): kullanici 'reytingler cok rastgele, gol/asist disinda cok fazla dusus; pas sayisi / isabeti, orta, xG, tehlikeli sans,
   defans aksiyonlarina gore arti eksi degissin'. Eski model rolun beklenen degerini mac boyunca orantili dusuyordu (belirgin olayi olmayan
   oyuncu dakika ilerledikce dusuyordu). Yeni model: taban 6.0, zamanla dusus yok; pas (tamamlanan, isabet, kesilen), ileri pas metresi,
   firsat yaratan pas (+ sutun xG'si), basarili orta, sut xG / isabet / buyuk firsati kacirma, gol (zor gol bonusu), asist, savunma (top kapma,
   araya girme, blok, uzaklastirma, hava topu), top kaybi, faul, kart, kurtaris (xG), yenen gol, gol yememe. Rol dengesi etkinlik carpanlariyla
   (zaman kaymasi yok). Kalibrasyon rt_topla.js + rt_fit.js (168 lab maci): genel 6.88, rol ortalamalari 6.72-7.03, gol atan 7.9, 2+ gol 8.9. */
(function (root) {
    var W = {
        base: 6.0,
        pok: .010, acc: .55, plost: -.035, prog: .0022, kp: .08, kpx: .5, crOk: .05,
        xg: .18, shOn: .04, shOff: -.03, big: -.15,
        g: .9, gHard: .2, a: .5, post: .08,
        tk: .14, ic: .09, blS: .16, blP: .06, clr: .05, hd: .03, hdF: .03, claim: .07,
        dsp: -.06, fl: -.08, flPen: -.45, yel: -.35, red: -1.3, off: -.05, og: -1.0, penMiss: -.5,
        sv: .08, svx: .7,
        conc: { GK: -.38, FB: -.10, CB: -.11, DM: -.04, W: 0, AM: 0, ST: 0 }, concx: { GK: .2, FB: .05, CB: .05, DM: 0, W: 0, AM: 0, ST: 0 },
        clean: { GK: .45, FB: .3, CB: .3, DM: .12, W: 0, AM: 0, ST: 0 },
        // rol dengesi: rolun dogal is yuku (cok pas / cok mudahale) ortalamayi kaydirmasin diye etkinlik terimleri rol carpaniyla
        act: { GK: .6, FB: 1.35, CB: 1.0, DM: .85, W: .7, AM: .5, ST: .45 }
    };
    // her terim: [anahtar, etiket, deger(c, g)]
    function terms(c, g, end) {
        var k = W.act[g] || 1, acc = c.pa >= 5 ? (c.pok / Math.max(1, c.pa) - .8) * Math.min(c.pa, 40) / 40 : 0;
        var t = [
            ['pas', 'Pas', k * (W.pok * c.pok + W.acc * acc + W.plost * c.plost), c.pok],
            ['ileri', 'İleri pas', k * W.prog * c.prog, 0],
            ['kp', 'Fırsat yaratan pas', W.kp * c.kp + W.kpx * c.kpx, c.kp],
            ['orta', 'Başarılı orta', W.crOk * c.crOk, c.crOk],
            ['sut', 'Şut / xG', W.xg * c.xg + W.shOn * c.shOn + W.shOff * c.shOff + W.big * c.big, c.sh],
            ['g', 'Gol', W.g * c.g + W.gHard * Math.max(0, c.g - c.gx), c.g],
            ['a', 'Asist', W.a * c.a, c.a],
            ['post', 'Direk', W.post * c.post, c.post],
            ['sav', 'Savunma (top kapma, araya girme, blok)', k * (W.tk * c.tk + W.ic * c.ic + W.blS * c.blS + W.blP * c.blP + W.clr * c.clr), c.tk + c.ic + c.blS + c.blP + c.clr],
            ['hava', 'Hava topu', k * (W.hd * c.hd + W.hdF * c.hdF), c.hd],
            ['kap', 'Top yakalama', W.claim * c.claim, c.claim],
            ['kayip', 'Top kaybı', W.dsp * c.dsp, c.dsp],
            ['faul', 'Faul', W.fl * c.fl + W.flPen * c.flPen, c.fl],
            ['kart', 'Kart', W.yel * c.yel + W.red * c.red, c.yel + c.red],
            ['ofs', 'Ofsayt', W.off * c.off, c.off],
            ['kk', 'Kendi kalesine', W.og * c.og, c.og],
            ['pen', 'Kaçan penaltı', W.penMiss * c.penMiss, c.penMiss],
            ['kurt', 'Kurtarış', W.sv * c.sv + W.svx * c.svx, c.sv],
            ['yenen', 'Yenen gol', (W.conc[g] || 0) * c.ga + (W.concx[g] || 0) * c.concx, c.ga]
        ];
        if (end && c.ga === 0) t.push(['temiz', 'Gol yememe', W.clean[g] || 0, 1]);
        return t;
    }
    function score(c, g, end) { var s = W.base, t = terms(c, g, end), i; for (i = 0; i < t.length; i++) s += t[i][2]; return Math.max(3, Math.min(10, s)); }
    var api = { W: W, terms: terms, score: score };
    if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Rating2Core = api;
})(typeof window !== 'undefined' ? window : globalThis);

(function (root) {
    'use strict';
    var GRP = { GK: 'GK', LB: 'FB', RB: 'FB', LCB: 'CB', RCB: 'CB', LDM: 'DM', RDM: 'DM', LW: 'W', RW: 'W', AM: 'AM', ST: 'ST' };
    function blank(role, team) { return { role: role, team: team, pa: 0, pok: 0, plost: 0, prog: 0, kp: 0, kpx: 0, cr: 0, crOk: 0, sh: 0, shOn: 0, shOff: 0, xg: 0, big: 0, g: 0, gx: 0, a: 0, post: 0, tk: 0, ic: 0, blS: 0, blP: 0, clr: 0, hd: 0, hdF: 0, claim: 0, dsp: 0, fl: 0, flPen: 0, yel: 0, red: 0, off: 0, og: 0, penMiss: 0, sv: 0, svx: 0, conc: 0, concx: 0, gf: 0, ga: 0, out: false }; }
    function create(o) {
        o = o || {};
        var roles = o.roles || [], n = roles.length, i, core = root.Rating2Core;
        var R = { c: [], grp: [], done: false, lastOk: null, lastShot: null, pend: {} };
        for (i = 0; i < n; i++) { R.c.push(blank(roles[i], i < (n >> 1) ? 0 : 1)); R.grp.push(GRP[roles[i]] || 'AM'); }
        R.onEvent = function (e) {
            var m = e.meta || {}, c = R.c[e.p], t = e.t != null ? e.t : 0, ps, pd;
            switch (e.type) {
                case 'PASS': if (!c) return false; c.pa++; if (m.cross || m.tag === 'CROSS') c.cr++; R.pend[e.p] = { cross: !!(m.cross || m.tag === 'CROSS') }; return true;
                case 'PASS_OK': ps = R.c[e.p2]; if (ps) { ps.pok++; ps.prog += Math.max(0, m.prog || 0); pd = R.pend[e.p2]; if (pd && pd.cross) ps.crOk++; } R.lastOk = { r: e.p, p: e.p2, t: t }; return !!ps;
                case 'INTERCEPT': ps = R.c[e.p2]; if (ps) ps.plost++; if (c) c.ic++; return true;
                case 'SHOT':
                    if (!c) return false; c.sh++; c.xg += m.xg || 0; if (m.on) c.shOn++; else { c.shOff++; if ((m.xg || 0) >= .3) c.big++; } if (m.tag === 'PEN') c.penMiss++;
                    if (R.lastOk && R.lastOk.r === e.p && t - R.lastOk.t < 4 && R.c[R.lastOk.p] && m.tag !== 'PEN') { R.c[R.lastOk.p].kp++; R.c[R.lastOk.p].kpx += m.xg || 0; }
                    R.lastShot = { p: e.p, xg: m.xg || 0 }; return true;
                case 'SAVE': if (!c) return false; c.sv++; c.svx += R.lastShot ? R.lastShot.xg : (m.xg || 0); return true;
                case 'POST': if (!c) return false; c.post++; return true;
                case 'BLOCK': if (!c) return false; if (m.cross) c.blP++; else c.blS++; return true;
                case 'TACKLE': if (c) c.tk++; if (R.c[e.p2]) R.c[e.p2].dsp++; return true;
                case 'CLEAR': if (!c) return false; c.clr++; return true;
                case 'HEADER': if (!c) return false; c.hd++; if (m.inFront) c.hdF++; return true;
                case 'CLAIM': if (!c) return false; c.claim++; return true;
                case 'FOUL': if (!c) return false; c.fl++; if (m.pen) c.flPen++; return true;
                case 'OFFSIDE': if (!c) return false; c.off++; return true;
                case 'CARD': if (!c) return false; if (m.card === 'R') { c.red++; c.out = true; } else c.yel++; return true;
                case 'VAR':
                    if (m.kind === 'pen' && m.outcome === 'cancel' && c) { if (c.flPen > 0) c.flPen--; if (m.reason !== 'disi' && c.fl > 0) c.fl--; return true; }
                    if (m.outcome === 'cancel' && m.reason === 'ofsayt') { var co = m.op != null && m.op >= 0 && R.c[m.op] ? R.c[m.op] : c; if (co) { co.off++; return true; } }
                    return false;
                case 'GOAL':
                    var gx = R.lastShot && !m.own ? R.lastShot.xg : .3;
                    for (i = 0; i < n; i++) { var q = R.c[i]; if (q.out) continue; if (q.team === e.team) q.gf++; else { q.ga++; q.concx += gx; } }
                    if (c) { if (m.own) c.og++; else { c.g++; c.gx += gx; if (m.pen && c.penMiss > 0) c.penMiss--; } }
                    if (!m.own && m.assist != null && m.assist >= 0 && R.c[m.assist]) R.c[m.assist].a++;
                    return true;
            }
            return false;
        };
        R.finish = function () { R.done = true; };
        R.get = function (idx) { var c = R.c[idx]; return c ? core.score(c, R.grp[idx], R.done) : 6.0; };
        R.all = function () { var a = [], k; for (k = 0; k < n; k++) a.push(R.get(k)); return a; };
        R.parts = function (idx) {
            var c = R.c[idx]; if (!c) return [];
            return core.terms(c, R.grp[idx], R.done).filter(function (x) { return Math.abs(x[2]) >= .02; }).map(function (x) { return { k: x[0], label: x[1], n: x[3], v: x[2] }; }).sort(function (x, y) { return Math.abs(y.v) - Math.abs(x.v); });
        };
        return R;
    }
    root.Rating2Dv2 = { create: create, GRP: GRP };
})(typeof window !== 'undefined' ? window : globalThis);




