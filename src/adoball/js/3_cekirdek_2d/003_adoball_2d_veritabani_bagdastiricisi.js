/* =====================================================================
   ADOBALL 2D — VERİTABANI BAĞDAŞTIRICISI
   Oyunun oyuncu kaydını (playerDatabase öğesi) motorun oyuncu özelliklerine çevirir.
   Motor yalnızca bu dosya üzerinden veri alır; veritabanı şeması değişse bile burası uyarlanır.
   Tarayıcıda: toEngine(playerDatabase[i]) — kaydın tüm alanları hazırdır (vis, bal, agg dahil).
   Node testinde: loadRaw(path) yalnızca ham tablodan okur, türetilen alanlar (vis, bal, agg) sabit formülle üretilir.
   ===================================================================== */
(function (root) {
    'use strict';
    var KEYS = ['pac', 'str', 'sta', 'dri', 'pas', 'lon', 'fin', 'sho', 'hea', 'tac', 'mar', 'posi'];
    var AGG = { KL: 12, STP: 62, SLB: 52, 'SĞB': 52, MDO: 66, MO: 44, MOO: 34, SLK: 28, 'SĞK': 28, SF: 36 };
    // Oyunun kendi türetme formülü (jitter'sız), 0.9 katsayısı ölçek kaymasını düzeltir.
    function derive(o) {
        o.vis = o.vis != null ? o.vis : Math.round((o.pas * .5 + o.posi * .3 + o.dri * .1) / .9);
        o.bal = o.bal != null ? o.bal : Math.round((o.dri * .4 + o.str * .3 + o.sta * .2) / .9);
        return o;
    }
    // Ham tablo satırı → oyun kaydı biçimi
    function fromRawRow(p) {
        var o = { name: p[0], pos: p[1], agg: AGG[p[1]] != null ? AGG[p[1]] : 40 };
        if (p[1] === 'KL') { o.gk_ref = p[2]; o.gk_div = p[3]; o.gk_pos = p[4]; o.gk_kic = p[5]; o.gk_1v1 = p[6]; }
        else KEYS.forEach(function (k, i) { o[k] = p[i + 2]; });
        return o;
    }
    // Spiker için kısa ad: soyadı, "van/de/da/di/..." gibi soyadı parçacıklarıyla birlikte ("Virgil van Dijk" -> "van Dijk")
    var PART = { van: 1, von: 1, de: 1, da: 1, do: 1, dos: 1, di: 1, del: 1, der: 1, den: 1, le: 1, la: 1, el: 1, al: 1, ter: 1, ten: 1, bin: 1 };
    function shortName(n) {
        var t = String(n || '').trim().split(/\s+/); if (t.length < 2) return t[0] || '';
        var i = t.length - 1; while (i > 1 && PART[t[i - 1].toLowerCase()]) i--; if (i === 1 && PART[t[0].toLowerCase()]) i = 0;
        return t.slice(i).join(' ');
    }
    // ---- Güvenli okuma: veritabanı elle/JSON ile değiştirilse bile motora HER ZAMAN geçerli sayı gider ----
    // Sayıya çevrilir (metin "85" / "85,5" dahil), 1–99'a sıkıştırılır; boş / NaN / geçersiz değer için yedek kullanılır.
    // Kayıt (rec) ASLA değiştirilmez: yalnızca motora giden kopya temizlenir. Geçerli (1–99) değerler olduğu gibi kalır.
    function num(v, dflt) {
        if (v === null || v === undefined || v === '' || typeof v === 'boolean') return dflt;
        var x = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v);
        if (!isFinite(x)) return dflt;
        return x < 1 ? 1 : x > 99 ? 99 : x;
    }
    // Oyun kaydı → motor özellikleri (kayıt yoksa null: motor o yuvada jenerik oyuncu kullanır)
    function clampN(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function toEngine(rec) {
        if (!rec || typeof rec !== 'object') return null;
        var a, pos = rec.pos, agg = num(rec.agg, AGG[pos] != null ? AGG[pos] : 40);
        if (pos === 'KL') {
            var ref = num(rec.gk_ref, 50), div = num(rec.gk_div, 50), gps = num(rec.gk_pos, 50), kic = num(rec.gk_kic, 50), o1 = num(rec.gk_1v1, 50);
            var g = ref * .30 + div * .28 + gps * .26 + o1 * .16;
            a = { gk: g, gk_ref: ref, gk_div: div, gk_pos: gps, gk_1v1: o1, gk_kic: kic, gk_air: num(rec.gk_air, 70), gk_han: num(rec.gk_han, 70),
                  pac: rec.gk_spd != null ? clampN(num(rec.gk_spd, 58) - 6, 40, 75) : 58, str: 70, sta: 75, dri: 45, pas: kic, sho: 30, fin: 30, tac: 30, hea: 40, vis: gps, mar: 30, posi: gps, lon: 30, bal: 60, agg: agg, pen: 40, fk: 40, cor: 40 };
        } else {
            var v = {}; KEYS.forEach(function (k) { v[k] = num(rec[k], 50); });
            // vis / bal kayıtta yoksa (ya da geçersizse) oyunun kendi türetme formülüyle (jitter'sız) hesaplanır
            var vis = num(rec.vis, Math.round((v.pas * .5 + v.posi * .3 + v.dri * .1) / .9)), bal = num(rec.bal, Math.round((v.dri * .4 + v.str * .3 + v.sta * .2) / .9));
            a = { pac: v.pac, str: v.str, sta: v.sta, dri: v.dri, pas: v.pas, sho: v.sho, fin: v.fin, tac: v.tac, hea: v.hea, vis: vis,
                  mar: v.mar, posi: v.posi, lon: v.lon, bal: bal, agg: agg, gk: 0 };
            var pn = num(rec.pen, null), fk = num(rec.fk, null), co = num(rec.cor, null);
            if (pn != null) a.pen = pn; if (fk != null) a.fk = fk; if (co != null) a.cor = co;
        }
        // güçlü ayak / zayıf ayak yıldızı: oyuncu profilinden (fm_appearance_v1; gerçek oyuncuda FC 27 verisi) - 2D/3D motoru kullanır
        var ap = getAppearance(rec), ft = ap && ap.ft === 'L' ? 'L' : 'R', wf = ap && ap.wf >= 1 && ap.wf <= 5 ? ap.wf : 3;
        /* [v131] boy (cm) hava topu erişimine, ayrı hızlanma kalkışa girer */
        a.h = ap && ap.h >= 150 && ap.h <= 210 ? ap.h : 180; if (pos !== 'KL') a.acc = num(rec.acc, a.pac);
        return { name: rec.name != null && rec.name !== '' ? String(rec.name) : 'Oyuncu', short: shortName(rec.name), pos: pos, a: a, db: rec, ft: ft, wf: wf };
    }
    // ---- JSON içe aktarma temizleyicisi ("Veritabanını Yükle"den önce çalışır) ----
    // Yeni eklenen / elle düzenlenen oyuncular oyunu bozmasın: kimlik (id) atar, sayıları düzeltir, mevkiyi tanır. Geçerli kayıtlar değişmez.
    var POS_OK = { KL: 1, STP: 1, SLB: 1, 'SĞB': 1, MDO: 1, MO: 1, MOO: 1, SLK: 1, 'SĞK': 1, SF: 1 };
    var POS_ALT = { SGB: 'SĞB', SGK: 'SĞK', SAGB: 'SĞB', SAGK: 'SĞK' };
    var NUMKEYS = KEYS.concat(['pen', 'fk', 'cor', 'vis', 'bal', 'lead', 'agg', 'gk_ref', 'gk_div', 'gk_pos', 'gk_kic', 'gk_1v1']);
    function normalizeImport(list) {
        var rep = { yeniId: 0, kirpilan: 0, duzeltilen: 0, eksik: 0, atlanan: 0, mevki: 0 }, out = [], seen = {}, maxId = -1, pending = [];
        list.forEach(function (r) { if (r && typeof r === 'object' && isFinite(Number(r.id)) && r.id !== null && r.id !== '' && r.id >= 0) maxId = Math.max(maxId, Math.floor(Number(r.id))); });
        list.forEach(function (r0) {
            if (!r0 || typeof r0 !== 'object' || Array.isArray(r0)) { rep.atlanan++; return; }
            var r = Object.assign({}, r0), ps = typeof r.pos === 'string' ? r.pos.trim() : '';
            var up = ps.toLocaleUpperCase('tr-TR'); if (POS_OK[up]) { if (up !== r.pos) { r.pos = up; rep.mevki++; } } else if (POS_ALT[up]) { r.pos = POS_ALT[up]; rep.mevki++; } else { rep.atlanan++; return; }
            if (r.name == null || String(r.name).trim() === '') r.name = 'Oyuncu ' + (out.length + 1);
            var gk = r.pos === 'KL', need = gk ? ['gk_ref', 'gk_div', 'gk_pos', 'gk_kic', 'gk_1v1'] : KEYS;
            NUMKEYS.forEach(function (k) {
                if (!(k in r) || r[k] === undefined) return;
                var v0 = r[k]; if (v0 === null || v0 === '') { delete r[k]; return; }                 // boş → oyun kendi göçüyle (vis/bal/pen/...) doldurur
                var x = typeof v0 === 'string' ? parseFloat(v0.replace(',', '.')) : Number(v0);
                if (!isFinite(x)) { delete r[k]; rep.duzeltilen++; return; }
                var c = Math.min(99, Math.max(1, x));
                if (typeof v0 === 'string') rep.duzeltilen++; else if (c !== x) rep.kirpilan++;
                r[k] = c;
            });
            need.forEach(function (k) { if (r[k] === undefined) { r[k] = 50; rep.eksik++; } });
            var id = (r.id === null || r.id === '' || r.id === undefined) ? NaN : Number(r.id);
            if (!isFinite(id) || id < 0 || seen[Math.floor(id)]) { pending.push(r); } else { r.id = Math.floor(id); seen[r.id] = 1; }
            out.push(r);
        });
        pending.forEach(function (r) { do { maxId++; } while (seen[maxId]); r.id = maxId; seen[maxId] = 1; rep.yeniId++; });
        return { list: out, report: rep };
    }
    function loadRaw(path) {
        var fs = require('fs'), h = fs.readFileSync(path, 'utf8');
        var s = h.indexOf('const rawPlayerData = ['), e = h.indexOf('];', s);
        var raw = (0, eval)(h.slice(s + 'const rawPlayerData = '.length, e + 1));
        return raw.map(fromRawRow);
    }
    // ---- oyuncu profili (görünüm + ayak): ayrı depoda - fm_players_v16'nın YAPISINA DOKUNMAZ ----
    // playerDatabase (fm_players_v16) motorun (engine_verbatim.js) kendi alanı; ona yeni alan eklemek riskli
    // ve gereksiz. Burada her oyuncu (gerçek kayıt ya da dolgu) için id/isme göre KARARLI, pozisyona hafifçe
    // bağlı (gerçekçi eğilim, saf gürültü değil) değerler üretilip ayrı bir localStorage anahtarında
    // önbelleğe alınır - aynı oyuncu her zaman aynı görünür, maçtan maça değişmez.
    // Alanlar: h boy (cm), w kilo (kg), sk ten 0-4 | hs saç stili 0-7 (uzun, kısa, kazıtılmış, kel, afro, rasta,
    // mohikan, topuz), hc saç rengi 0-5 (siyah, koyu kahve, kahve, açık kahve, sarı, kızıl), bd sakal 0-2 (yok,
    // kirli, sakal) | ft güçlü ayak 'R'/'L', wf zayıf ayak 1-5 yıldız (2D/3D maç motoru kullanır). v: kayıt sürümü.
    // Gerçek oyuncular (proto/realdata.js) için varsayılanlar gerçek veridir (FC 27: boy/kilo/ayak; görünüm yaklaşık).
    var APR_KEY = 'fm_appearance_v1', APR_V = 2;
    function realApi() {
        if (root.ADO_REAL) return root.ADO_REAL;
        if (typeof module !== 'undefined' && module.exports && typeof require === 'function') { try { return require('./realdata.js'); } catch (e) { } }
        return null;
    }
    function realOf(rec) { var R = realApi(); return R && rec && rec.name != null ? R.lookup(rec.name) : null; }
    var POS_H = {                                    // ortalama boy (cm): pozisyona göre gerçekçi eğilim (KL/STP uzun, kanat kısa)
        KL: 188, STP: 187, SLB: 178, 'SĞB': 178, MDO: 181, MO: 177, MOO: 177, SLK: 174, 'SĞK': 174, SF: 182,
        GK: 188, LCB: 187, RCB: 187, LB: 178, RB: 178, LDM: 181, RDM: 181, AM: 177, LW: 174, RW: 174, ST: 182   // simülasyonun kendi rol kodları (dolgu oyuncu - gerçek kayıt yokken yedek)
    };
    function clampA(v, a, b) { return v < a ? a : v > b ? b : v; }
    function hashA(s) { var h = 2166136261 >>> 0; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
    function rngA(seed) { var x = seed >>> 0 || 1; return function () { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
    // Saf fonksiyon: aynı key+pos+str -> HER ZAMAN aynı sonuç (önbellek kaybolsa/sıfırlansa bile aynı oyuncu aynı çıkar)
    function genAppearance(key, pos, strAttr) {
        var rnd = rngA(hashA(key)), baseH = POS_H[pos] != null ? POS_H[pos] : 180;
        var h = clampA(baseH + (rnd() - .5) * 16, 163, 200);                                   // boy (cm): pozisyon tabanı ± rastgele sapma
        var refBmi = 22.3 + clampA(((strAttr != null ? strAttr : 70) - 70) * .01, -.4, .4);     // güç niteliği yüksekse hafifçe daha yapılı
        var bmi = clampA(refBmi + (rnd() - .5) * 2.6, 19, 28);
        var w = Math.round(bmi * (h / 100) * (h / 100));                                        // kilo (kg): BMI'den türetilir, gerçekçi aralıkta kalır
        var hs = hashA(key + '|sk');                                                            // ten tonu: 3B render katmanındaki (ado3d.js SKIN) MEVCUT dağılımla aynı formül, artık kalıcı
        var sk = hs % 5 === 4 && (hs >>> 4) % 3 ? 3 : hs % 5;
        return { h: Math.round(h), w: w, sk: sk };
    }
    // ---- saç / sakal / ayak: gerçek kayıt yoksa (dolgu ya da kullanıcının eklediği oyuncu) KARARLI ve gerçekçi dağılımla üretilir ----
    // Sol ayak olasılığı mevkiye göre (profesyonellerde ~%20-25 solak; sol bek/sol stoperde belirgin yüksek, sağ bekte düşük,
    // ters ayaklı kanat yaygın). Hem oyunun mevki kodları hem simülasyonun rol kodları (dolgu oyuncu) tanınır.
    var LEFT_P = { KL: .18, STP: .28, SLB: .75, 'SĞB': .06, MDO: .18, MO: .22, MOO: .25, SLK: .35, 'SĞK': .45, SF: .2,
        GK: .18, LCB: .45, RCB: .1, LB: .75, RB: .06, LDM: .22, RDM: .16, AM: .25, LW: .35, RW: .45, ST: .2 };
    // saç stili / rengi dağılımı ten grubuna göre (açık 0-1, orta 2, koyu 3-4): [uzun, kısa, kazıtılmış, kel, afro, rasta, mohikan, topuz]
    var HS_P = [[.06, .69, .12, .05, 0, 0, .03, .05], [.04, .58, .22, .05, .04, .03, .02, .02], [.01, .22, .46, .06, .10, .10, .04, .01]];
    var HC_P = [[.22, .33, .20, .13, .09, .03], [.62, .30, .07, .01, 0, 0], [.92, .06, 0, 0, .02, 0]];   // [siyah, koyu kahve, kahve, açık kahve, sarı, kızıl]
    var BD_P = [.45, .32, .23], WF_P = [.03, .16, .51, .24, .06];                                      // sakal [yok, kirli, sakal] · zayıf ayak 1..5 yıldız
    function pickP(u, P) { var s = 0; for (var i = 0; i < P.length; i++) { s += P[i]; if (u < s) return i; } return P.length - 1; }
    function genExtra(key, pos, sk) {
        var rnd = rngA(hashA(key + '|x2')), g = sk <= 1 ? 0 : sk === 2 ? 1 : 2;
        var ft = rnd() < (LEFT_P[pos] != null ? LEFT_P[pos] : .2) ? 'L' : 'R';
        return { hs: pickP(rnd(), HS_P[g]), hc: pickP(rnd(), HC_P[g]), bd: pickP(rnd(), BD_P), ft: ft, wf: pickP(rnd(), WF_P) + 1 };
    }
    function fromReal(r) { return { h: r.h, w: r.w, sk: r.look[0], hs: r.look[1], hc: r.look[2], bd: r.look[3], ft: r.ft, wf: r.wf }; }
    function validV2(c) { return c && c.v === APR_V && typeof c.h === 'number' && typeof c.w === 'number' && typeof c.sk === 'number' && typeof c.hs === 'number' && typeof c.hc === 'number' && typeof c.bd === 'number' && (c.ft === 'L' || c.ft === 'R') && typeof c.wf === 'number'; }
    function aprKey(rec) { return rec.id != null ? 'id' + rec.id : 'nm' + (rec.name || 'oyuncu'); }
    function loadAprStore() { try { return JSON.parse(localStorage.getItem(APR_KEY)) || {}; } catch (e) { return {}; } }
    function saveAprStore(store) { try { localStorage.setItem(APR_KEY, JSON.stringify(store)); } catch (e) { } }
    var APR_CACHE = null;
    // rec: gerçek playerDatabase kaydı (id/pos/str alanlarıyla) YA DA dolgu oyuncu için {id:null,name,pos,str} biçiminde hafif bir nesne
    // Sürüm 1 kaydı ({h,w,sk}) bulunursa YÜKSELTİLİR: yeni alanlar eklenir; h/w/sk kullanıcı tarafından değiştirilmemişse (hâlâ
    // otomatik üretilen değerdeyse) ve oyuncu gerçek bir oyuncuysa gerçek veriyle değiştirilir - elle girilmiş değer KORUNUR.
    function getAppearance(rec) {
        if (!rec) return null; if (rec.__ap) return rec.__ap;
        if (!APR_CACHE) APR_CACHE = loadAprStore();
        var key = aprKey(rec), cur = APR_CACHE[key];
        if (validV2(cur)) {
            var r0 = realOf(rec), o0 = r0 && r0.old;                               // [06.10] görünüm revizyonu: eski gerçek değerde (elle değişmemiş) kayıt güncellenir
            if (o0 && cur.h === o0[0] && cur.w === o0[1] && cur.sk === o0[2] && cur.hs === o0[3] && cur.hc === o0[4] && cur.bd === o0[5]) {
                var nx = fromReal(r0); nx.ft = cur.ft; nx.wf = cur.wf; nx.v = APR_V; APR_CACHE[key] = nx; saveAprStore(APR_CACHE); return nx;
            }
            return cur;
        }
        var real = realOf(rec), next;
        if (!cur || typeof cur.h !== 'number' || typeof cur.w !== 'number' || typeof cur.sk !== 'number') {
            next = real ? fromReal(real) : genAppearance(key, rec.pos, rec.str);
        } else {
            var g = genAppearance(key, rec.pos, rec.str), auto = cur.h === g.h && cur.sk === g.sk && Math.abs(cur.w - g.w) <= 3;   // kilo güç niteliğine bağlı (güç sonradan değişmiş olabilir) -> küçük tolerans
            next = real && auto ? { h: real.h, w: real.w, sk: real.look[0] } : { h: cur.h, w: cur.w, sk: cur.sk };
        }
        var ex = real ? fromReal(real) : genExtra(key, rec.pos, next.sk);
        ['hs', 'hc', 'bd', 'ft', 'wf'].forEach(function (k) { next[k] = cur && cur[k] != null && validField(k, cur[k]) ? cur[k] : ex[k]; });
        next.v = APR_V;
        APR_CACHE[key] = next; saveAprStore(APR_CACHE);
        return next;
    }
    function validField(k, v) {
        if (k === 'ft') return v === 'L' || v === 'R';
        var lim = { h: [140, 230], w: [35, 160], sk: [0, 4], hs: [0, 10], hc: [0, 5], bd: [0, 2], wf: [1, 5] }[k];
        return !!lim && typeof v === 'number' && isFinite(v) && v >= lim[0] && v <= lim[1];
    }
    function _resetAppearanceCache() { APR_CACHE = null; }   // yalnızca test: bellek-içi önbelleği sıfırlar (localStorage'a dokunmaz)

    // Kullanıcının Futbolcu Veritabanı ekranından ELLE girdiği değerleri kalıcı hale getirir (getAppearance'ın
    // otomatik ürettiği değerlerin üzerine yazar). patch: {h,w,sk,hs,hc,bd,ft,wf} - hiçbiri zorunlu değil, yalnızca verilenler
    // güncellenir; boş/geçersiz (NaN) bir alan sessizce MEVCUT değerinde kalır (kullanıcı girişini kazara sıfırlamaz).
    // Döndürülen nesne doğrulanmış/sıkıştırılmış NİHAİ değerdir - çağıran bunu doğrudan render'a besleyebilir.
    function setAppearance(rec, patch) {
        if (!rec) return null;
        var cur = getAppearance(rec) || {};
        function pick(v, curV, lo, hi) { var n = v == null || v === '' ? NaN : Math.round(Number(v)); return isFinite(n) ? clampA(n, lo, hi) : curV; }
        var p = patch || {}, ft = p.ft === 'L' || p.ft === 'R' ? p.ft : cur.ft;
        var next = { h: pick(p.h, cur.h, 140, 230), w: pick(p.w, cur.w, 35, 160), sk: pick(p.sk, cur.sk, 0, 4), hs: pick(p.hs, cur.hs, 0, 10), hc: pick(p.hc, cur.hc, 0, 5), bd: pick(p.bd, cur.bd, 0, 2), ft: ft, wf: pick(p.wf, cur.wf, 1, 5), v: APR_V };
        if (!APR_CACHE) APR_CACHE = loadAprStore();
        APR_CACHE[aprKey(rec)] = next; saveAprStore(APR_CACHE);
        return next;
    }

    /* ---- GÜÇ DEĞERLERİ: gerçek oyuncuları FC 27 verisine göre güncelleme (proto/realdata.js) ----
       Motor betiği bayt-aynı kalmak zorunda olduğundan (rawPlayerData değiştirilemez), güncelleme motorun initApp()'inden
       ÖNCE (bu betik ayrıştırılırken) localStorage'daki fm_players_v16 üzerinde yapılır; anahtar ve kayıt YAPISI aynen kalır.
       - İlk kurulum (anahtar yok): motorun kendi kurulumuyla aynı kayıtlar (id = sıra, ad, mevki, özellikler) gerçek veriyle
         yazılır; agg/lead ve kalecinin türetilmiş alanlarını motor initApp'te KENDİ göç koduyla doldurur.
       - Mevcut veritabanı: alan alan, YALNIZCA hâlâ orijinal (motorun dağıttığı) değerde duran alanlar güncellenir; kullanıcının
         elle değiştirdiği bir alan korunur. Türetilmiş alanlar (penaltı, frikik, korner, vizyon, denge) motorun ±5 rastgele
         sapmalı formülünün bandındaysa "otomatik" sayılır. Faul eğilimi (agg) ve liderlik (lead) FC'de yok - hiç değişmez.
       - Uygulanan oyuncu fm_dbrev_v1'e işaretlenir; sonradan elle yapılan değişiklik bir daha EZİLMEZ (veritabanı orijinal
         değerlere sıfırlanmışsa - tüm temel alanlar orijinal - yeniden uygulanır).
       - FC 27 kadrosunda olmayan oyuncular (nofc) değişmez. */
    var DBREV_KEY = 'fm_dbrev_v1', BASE12 = KEYS, DER5 = ['pen', 'fk', 'cor', 'vis', 'bal'], GK5 = ['gk_ref', 'gk_div', 'gk_pos', 'gk_kic', 'gk_1v1'];
    function derOrig(k, o) {          // motorun migratePlayerAdvancedStats formülü (rastgele sapmasız), saha oyuncusu
        if (k === 'pen') return o.fin * .55 + o.sho * .35;
        if (k === 'fk') return o.sho * .45 + o.pas * .3 + o.lon * .15;
        if (k === 'cor') return o.lon * .45 + o.pas * .3 + o.posi * .15;
        if (k === 'vis') return o.pas * .5 + o.posi * .3 + o.dri * .1;
        return o.dri * .4 + o.str * .3 + o.sta * .2;
    }
    function sameNum(v, ref) { if (v === null || v === undefined || v === '' || typeof v === 'boolean') return false; var x = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : Number(v); return isFinite(x) && Math.abs(x - ref) < 1e-9; }
    // db: fm_players_v16 kayıt dizisi (yerinde değiştirilir), raw: motorun rawPlayerData'sı, rev: işaret nesnesi (yerinde)
    // dönüş: { players: güncellenen oyuncu sayısı, fields: güncellenen alan sayısı, kept: korunan (elle değişmiş) alan sayısı }
    function applyRealRatings(db, raw, rev) {
        var R = realApi(), st = { players: 0, fields: 0, kept: 0 };
        if (!R || !db || !raw) return st;
        var byName = {}; raw.forEach(function (row) { byName[R.normName(row[0])] = row; });
        db.forEach(function (rec) {
            if (!rec || typeof rec !== 'object') return;
            var real = R.lookup(rec.name), orig = byName[R.normName(rec.name)];
            if (!real || !real.r || !orig) return;
            var isGK = rec.pos === 'KL';
            if (isGK !== (orig[1] === 'KL') || isGK !== (real.r.length === 5)) return;      // kaleci <-> saha oyuncusu karışmaz
            var keys = isGK ? GK5 : BASE12, ov = orig.slice(2, 2 + keys.length), mk = 'id' + rec.id + '|' + R.normName(rec.name);
            if (real.pr && rev[mk] && rev[mk] !== 'u1') {      /* [oyuncu50] FC 27 guncellemesi: onceki degerle ayni (degistirilmemis) alanlar yeni degere */
                var nu = st.fields; keys.forEach(function (k, i) { if (sameNum(rec[k], real.pr[i]) && rec[k] !== real.r[i]) { rec[k] = real.r[i]; st.fields++; } });
                if (!isGK) DER5.forEach(function (k, j) { if (sameNum(rec[k], real.pr[12 + j]) && rec[k] !== real.r[12 + j]) { rec[k] = real.r[12 + j]; st.fields++; } });
                rev[mk] = 'u1'; if (st.fields > nu) st.players++; return;
            }
            if (rev[mk] && !keys.every(function (k, i) { return sameNum(rec[k], ov[i]); })) return;     // zaten uygulandı (ve sıfırlanmadı)
            var n0 = st.fields;
            keys.forEach(function (k, i) { if (rec[k] === undefined || sameNum(rec[k], ov[i])) { if (rec[k] !== real.r[i]) { rec[k] = real.r[i]; st.fields++; } } else st.kept++; });
            if (!isGK) {
                var o = {}; BASE12.forEach(function (k, i) { o[k] = ov[i]; });
                DER5.forEach(function (k, j) {
                    var v = rec[k], f = derOrig(k, o), x = v == null ? NaN : Number(v);
                    if (v === undefined || v === null || v === '' || (isFinite(x) && Math.abs(x - f) <= 5.51)) { if (rec[k] !== real.r[12 + j]) { rec[k] = real.r[12 + j]; st.fields++; } }
                    else st.kept++;
                });
            }
            rev[mk] = 1; if (st.fields > n0) st.players++;
        });
        return st;
    }
    // ilk kurulum: motorun initApp'teki kurulumuyla AYNI kayıt şekli (agg/lead/kaleci türetmeleri motor tarafından eklenir)
    // (orijinal değerlerle kurulur; hemen ardından applyRealRatings gerçek oyuncuların alanlarını FC 27 değerleriyle değiştirir)
    function freshRealDb(raw) {
        return raw.map(function (p, i) {
            var o = { id: i, name: p[0], pos: p[1] };
            if (p[1] === 'KL') GK5.forEach(function (k, j) { o[k] = p[j + 2]; }); else BASE12.forEach(function (k, j) { if (p[j + 2] !== undefined) o[k] = p[j + 2]; });
            return o;
        });
    }
    // [oyuncu50] gercek tabloda add: 1 olan (sonradan eklenen) oyuncular kayitli veritabaninda yoksa bir kez eklenir; kimlik en buyuk + 1.
    // Her oyuncu icin 'add|ad' isareti tutulur: kullanici sonradan silerse geri eklenmez.
    function addNewReal(db, raw, rev) {
        var R = realApi(); if (!R) return 0;
        var have = {}, maxId = -1, n = 0;
        db.forEach(function (r) { if (r && typeof r === 'object') { have[R.normName(r.name)] = 1; var id = Number(r.id); if (isFinite(id) && id > maxId) maxId = Math.floor(id); } });
        raw.forEach(function (p) {
            var real = R.lookup(p[0]); if (!real || !real.add) return;
            var nn = R.normName(p[0]), key = 'add|' + nn; if (have[nn]) { rev[key] = 1; return; } if (rev[key]) return;
            var o = { id: ++maxId, name: p[0], pos: p[1] };
            if (p[1] === 'KL') GK5.forEach(function (k, j) { o[k] = p[j + 2]; }); else BASE12.forEach(function (k, j) { if (p[j + 2] !== undefined) o[k] = p[j + 2]; });
            db.push(o); rev[key] = 1; have[nn] = 1; n++;
        });
        return n;
    }
    function migrateStoredDb(ls, raw) {
        var rev = {}; try { rev = JSON.parse(ls.getItem(DBREV_KEY)) || {}; } catch (e) { rev = {}; }
        var txt = ls.getItem('fm_players_v16'), db, fresh = !txt;
        if (fresh) db = freshRealDb(raw);
        else { try { db = JSON.parse(txt); } catch (e) { return null; } if (!Array.isArray(db)) return null; }
        var added = addNewReal(db, raw, rev);      // [oyuncu50] sonradan eklenen gercek oyuncular
        var st = applyRealRatings(db, raw, rev); st.added = added; if (added > 0 && !fresh) ls.setItem('fm_players_v16', JSON.stringify(db));
        if (fresh || st.fields > 0) ls.setItem('fm_players_v16', JSON.stringify(db));
        ls.setItem(DBREV_KEY, JSON.stringify(rev));
        st.fresh = fresh; return st;
    }

    var api = { shortName: shortName, toEngine: toEngine, fromRawRow: fromRawRow, loadRaw: loadRaw, KEYS: KEYS, num: num, normalizeImport: normalizeImport, genAppearance: genAppearance, genExtra: genExtra, getAppearance: getAppearance, setAppearance: setAppearance, _resetAppearanceCache: _resetAppearanceCache,
        applyRealRatings: applyRealRatings, migrateStoredDb: migrateStoredDb, DBREV_KEY: DBREV_KEY, LEFT_P: LEFT_P };
    if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DB2D = api;
})(typeof window !== 'undefined' ? window : globalThis);

