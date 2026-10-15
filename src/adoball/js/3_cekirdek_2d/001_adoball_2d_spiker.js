/* =====================================================================
   ADOBALL 2D — SPİKER
   İlke: spiker sahaya BAKMAZ; yalnızca simülasyonun olay günlüğünü okur.
   Söylediği her ayrıntı (kanat, mesafe, ceza sahası, skor, oyuncu adı) olayın kaydından hesaplanır.
   Gecikmiş (bayat) satırlar düşürülür, önemli olay küçük olayı keser.
   ===================================================================== */
(function (root) {
    'use strict';
    var PRIO = { GOAL: 10, PEN: 9, POST: 8, SAVE: 8, SHOT: 6, OFF: 5, BLOCK: 5, FOUL: 6, CORNER: 4, HALFTIME: 9, FULLTIME: 9, KICKOFF: 7, HEADER: 4, INTERCEPT: 3, TACKLE: 4, CHAIN: 2, THROUGH: 3, CROSS: 3, CLEAR: 2, THROWIN: 1, GOALKICK: 1, CLAIM: 3, OFFSIDE: 5, ADV: 5, CARD: 7, VAR: 9, VARCHK: 9 };
    var MAX_LAG = { 10: 99, 9: 99, 8: 6, 7: 99, 6: 5, 5: 5, 4: 4, 3: 3, 2: 3, 1: 2 };

    // Türkçe ek uyumu: ünlü uyumu, kaynaştırma harfi (y/n), sert ünsüz (d→t)
    var VOW = 'aeıioöuü', BACK = 'aıou', ROUND = 'ouöü', HARD = 'çfhkpsşt';
    // Aksanlı harfleri (é, ã, š ...) ünlü uyumu için Türkçe karşılığına indirger
    var ACC = { 'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e', 'á': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a', 'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i', 'ó': 'o', 'ò': 'o', 'ô': 'o', 'õ': 'o', 'ø': 'ö', 'ú': 'u', 'ù': 'u', 'û': 'u', 'č': 'ç', 'ć': 'ç', 'š': 'ş', 'ž': 'j', 'ñ': 'n' };
    function fold(ch) { ch = ch.toLowerCase(); return ACC[ch] || ch; }
    function sfx(name, kind) {
        name = String(name || ''); if (!name) return name;
        var lv = 'e'; for (var i = name.length - 1; i >= 0; i--) { var ch = fold(name[i]); if (VOW.indexOf(ch) >= 0) { lv = ch; break; } }
        var last = fold(name[name.length - 1]), ev = VOW.indexOf(last) >= 0, back = BACK.indexOf(lv) >= 0, rnd = ROUND.indexOf(lv) >= 0, hard = HARD.indexOf(last) >= 0;
        var four = back ? (rnd ? 'u' : 'ı') : (rnd ? 'ü' : 'i');
        switch (kind) {
            case 'dat': return name + "'" + (ev ? 'y' : '') + (back ? 'a' : 'e');
            case 'acc': return name + "'" + (ev ? 'y' : '') + four;
            case 'gen': return name + "'" + (ev ? 'n' : '') + four + 'n';
            case 'abl': return name + "'" + (hard ? 't' : 'd') + (back ? 'a' : 'e') + 'n';
            case 'loc': return name + "'" + (hard ? 't' : 'd') + (back ? 'a' : 'e');
        }
        return name;
    }
    function pick(arr, memo, key) {
        var i, last = memo[key];
        do { i = Math.floor(Math.random() * arr.length); } while (arr.length > 1 && i === last);
        memo[key] = i; return arr[i];
    }
    function make(sim, C) {
        var memo = { sh: {}, sv: {}, gl: {} }, T = sim.teams, pl = sim.players;      // [spk] sh/sv/gl: oyuncu başına şut / kurtarış / gol sayacı (seri vurgusu)
        var NW = ['', 'bire', 'ikiye', 'üçe', 'dörde', 'beşe', 'altıya', 'yediye'];
        function possTxt() { try { var pp = sim.possPct(), k = pp[0] >= pp[1] ? 0 : 1; return pp[k] >= 55 ? ' ' + tn(k) + ' topa %' + pp[k] + ' sahip oldu.' : ' Topa sahiplik dengeliydi.'; } catch (e) { return ''; } }
        function nm(id) { return id >= 0 ? (pl[id].short || pl[id].name) : ''; }
        function tn(t) { return T[t].name; }
        // Bir oyuncunun takımına göre kanat/bölge: SADECE olay koordinatından hesaplanır
        function side(team, y, dirAtEvent) {
            var d = dirAtEvent, left = d === 1 ? y < C.PH / 3 : y > 2 * C.PH / 3, right = d === 1 ? y > 2 * C.PH / 3 : y < C.PH / 3;
            return left ? 'sol kanat' : right ? 'sağ kanat' : 'merkez';
        }
        function zone(team, x, y, dir) {
            var gx = dir === 1 ? C.PW : 0, dx = Math.abs(gx - x), inbox = dx <= C.PA_D && y >= C.PA_Y0 && y <= C.PA_Y1;
            return inbox ? 'ceza sahası içinden' : Math.hypot(gx - x, C.CY - y) < 24 ? 'ceza sahası önünden' : 'uzaktan';
        }
        function score(ev) { return ev.score[0] + '-' + ev.score[1]; }
        function varOkText(v) {
            if (v.reason === 'ofsayt') { var c = Math.round(Math.abs(v.margin || 0) * 100); return c < 1 ? 'ofsayt yok, milimetrik farkla içeride' : 'ofsayt yok, ' + c + ' cm farkla içeride'; }
            return v.reason === 'el' ? 'elle oynama yok' : 'faul yok';
        }
        function line(ev, dirs) {
            var t = ev.type, m = ev.meta, d = dirs[ev.team], p = nm(ev.p), q = nm(ev.p2), tm = ev.team >= 0 ? tn(ev.team) : '';
            var out = null, pr = PRIO[t] || 1, ids = [ev.p, ev.p2].filter(function (i) { return i >= 0; });
            switch (t) {
                case 'KICKOFF': out = 'Hakem düdüğü çaldı, karşılaşma başladı! Topla oynamaya ' + tn(0) + ' başlıyor.'; break;
                case 'HALFTIME': out = 'İlk yarı sona erdi. Skor ' + score(ev) + '.' + possTxt(); break;
                case 'FULLTIME': out = 'Maç bitti! Final skoru ' + score(ev) + '.' + (ev.score && ev.score[0] !== ev.score[1] ? ' Kazanan ' + tn(ev.score[0] > ev.score[1] ? 0 : 1) + '!' : ' Puanlar paylaşıldı.'); break;
                case 'SHOT':
                    if (m.tag === 'PEN') { out = 'Penaltı noktasında ' + p + '... Vuruyor!'; pr = 9; break; }
                    if (m.tag === 'FK') { out = m.wall ? pick([p + ' frikikte topun başında; karşısında ' + m.wall + ' kişilik baraj var. Vuruyor!', 'Baraj ' + m.wall + ' kişi, ' + p + ' frikiği kullanıyor!'], memo, 'fkw') : p + ' frikik atışını kullanıyor, şut çekiyor!'; break; }
                    if (m.tag === 'HEAD') { out = p + ' kafayı vurdu!'; memo.lastFoot = null; break; }
                    var ayak = m.foot === 'L' ? 'sol' : m.foot === 'R' ? 'sağ' : '';
                    memo.lastFoot = ayak ? { p: ev.p, ayak: ayak, weak: !!m.weak } : null;
                    out = pick([p + ' ' + zone(ev.team, ev.x, ev.y, d) + ' vuruyor!', p + ' ' + Math.round(m.dist) + ' metreden şutunu çekti!', tm + ' adına ' + p + ' denedi!'], memo, 'shot');
                    if (m.dist > 24) out = p + ' ' + Math.round(m.dist) + ' metreden zorluyor kaleyi!';
                    if (ayak && m.weak) out = pick([p + ', zayıf ' + ayak + ' ayağıyla vuruyor!', p + ' bu kez zayıf ' + ayak + ' ayağıyla denedi!', p + ' topu zayıf ' + ayak + ' ayağına alıp vurdu!'], memo, 'shotW');      // zayıf ayak kullanımı spikerde de duyulur
                    else if (ayak && Math.random() < .22) out = p + ' ' + ayak + ' ayağıyla ' + (m.dist > 24 ? Math.round(m.dist) + ' metreden' : zone(ev.team, ev.x, ev.y, d)) + ' vuruyor!';
                    if ((m.xg || 0) >= .3 && !(ayak && m.weak)) out = pick(['Büyük fırsat! ' + p + ' ' + zone(ev.team, ev.x, ev.y, d) + ' vuruyor!', p + ' kaleciyle karşı karşıya... ve vuruyor!', 'Tehlike! ' + p + ' çok net pozisyonda, şutunu çekti!'], memo, 'shotB');      // [spk] net fırsat
                    else if (m.dist > 27 && Math.random() < .5) out = pick([p + ' ' + Math.round(m.dist) + ' metreden füzeyi ateşledi!', p + ' uzaktan şansını deniyor, ' + Math.round(m.dist) + ' metreden sert vurdu!'], memo, 'shotL');
                    var nsh = memo.sh[ev.p] = (memo.sh[ev.p] || 0) + 1; if (nsh >= 3 && Math.random() < .55) out += ' ' + p + ' bugün çok istekli, bu ' + nsh + '. şutu.';
                    break;
                case 'SAVE':
                    out = m.parry ? nm(ev.p) + ' topu çeldi! ' + sfx(q, 'gen') + ' şutu kaleciden döndü.' : nm(ev.p) + ' sağlam tuttu, ' + sfx(q, 'gen') + ' şutu kalecide kaldı!';
                    if ((m.xg || 0) >= .3) out = pick(['Müthiş kurtarış! ' + nm(ev.p) + ', ' + sfx(q, 'gen') + ' golünü önledi!', 'İnanılmaz! ' + nm(ev.p) + ' gol olacak topu ' + (m.parry ? 'çeldi' : 'kucakladı') + '!', 'Ne kurtarış! ' + nm(ev.p) + ' ' + sfx(q, 'dat') + ' gol izni vermedi!'], memo, 'svB');      // [spk] net fırsatta kurtarış
                    var nsv = memo.sv[ev.p] = (memo.sv[ev.p] || 0) + 1; if (nsv >= 3) out += nsv >= 5 ? ' ' + nm(ev.p) + ' adeta duvar ördü, bu ' + nsv + '. kurtarışı!' : ' ' + sfx(nm(ev.p), 'gen') + ' bu maçtaki ' + nsv + '. kurtarışı.';
                    break;
                case 'GOAL':
                    if (m.own) out = 'Kendi kalesine! ' + p + ' topu ağlara gönderdi. Skor ' + score(ev) + '.';
                    else if (m.pen) out = 'GOOOL! Penaltıyı ' + p + ' gole çevirdi! ' + tm + ' ' + score(ev) + '.';
                    else out = 'GOOOL! ' + p + '! ' + (m.dist ? Math.round(m.dist) + ' metreden ' : '') + 'ağları buldu. Skor ' + score(ev) + '.';
                    if (!m.own && !m.pen && memo.lastFoot && memo.lastFoot.p === ev.p && memo.lastFoot.weak) out += ' Zayıf ' + memo.lastFoot.ayak + ' ayağıyla gelen bir gol!';
                    memo.lastFoot = null;
                    if (m.varOk && memo.varConf) { out += ' VAR incelemesi tamamlandı: ' + varOkText(memo.varConf) + ', gol geçerli!'; }
                    memo.varConf = null;
                    var gx = '', gsc = ev.score, gdf = ev.team >= 0 && gsc ? gsc[ev.team] - gsc[1 - ev.team] : null;      // [spk] skor bağlamı + gol serisi + son dakika: skordan hemen sonra
                    if (gdf === 1) gx += ' ' + tm + ' öne geçti!'; else if (gdf === 0) gx += ' Ve beraberlik geldi!'; else if (gdf > 1) gx += ' Fark ' + (NW[gdf] || gdf) + ' çıktı!'; else if (gdf === -1) gx += ' Fark bire indi, maç yeniden başlıyor!'; else if (gdf < -1) gx += ' Fark ' + (NW[-gdf] || -gdf) + ' indi.';
                    if (ev.min >= 85) gx += ' Hem de ' + ev.min + '. dakikada!';
                    if (!m.own && ev.p >= 0) { var ngl = memo.gl[ev.p] = (memo.gl[ev.p] || 0) + 1; if (ngl === 2) gx += ' ' + sfx(p, 'gen') + ' maçtaki ikinci golü!'; else if (ngl === 3) gx += ' HAT-TRICK! ' + p + ' üçüncü golünü attı!'; else if (ngl > 3) gx += ' ' + p + ' bugün durdurulamıyor, bu ' + ngl + '. golü!'; }
                    var skT = 'Skor ' + score(ev) + '.', skI = out.indexOf(skT); out = skI >= 0 ? out.slice(0, skI + skT.length) + gx + out.slice(skI + skT.length) : out + gx;
                    break;
                case 'CARD':
                    if (m.card === 'R') {
                        var men = m.men != null ? m.men : 10, left = ' ' + tm + ' ' + men + ' kişiye düştü.';
                        if (m.second) out = 'İKİNCİ SARI! ' + p + ' bir sarı kart daha gördü ve oyundan atıldı!' + left;
                        else if (m.why === 'son_adam') out = 'KIRMIZI KART! ' + p + ' son adam olarak ' + (q ? sfx(q, 'acc') + ' ' : '') + 'durdurdu, hakem doğrudan kırmızıyı gösterdi!' + left;
                        else out = 'KIRMIZI KART! ' + sfx(p, 'gen') + ' sert müdahalesi sonrası hakem doğrudan kırmızı kartı çıkardı!' + left;
                        if (m.var && memo.varRed === 'upgrade') out = 'VAR incelemesi sonrası karar değişti! ' + out;
                        else if (m.var && memo.varRed === 'confirm') out += ' VAR kontrolü de kararı onayladı.';
                        memo.varRed = null;
                        pr = 9;
                    } else {
                        if (m.var) return null;      // VAR kırmızıyı sarıya çevirdi: sonuç VAR satırında anlatıldı
                        if (m.pen) out = 'Penaltıya neden olan ' + p + ' sarı kart görüyor.';
                        else if (m.why === 'taktik') out = pick(['Taktik faul! ' + p + ' atağı durdurdu, hakem sarı kartı gösterdi.', p + ' hızlı hücumu faulle kesti ve sarı kart gördü.'], memo, 'ycT');
                        else out = pick(['Hakem sarı kartı çıkardı: ' + p + '.', p + ' sert müdahalesi nedeniyle sarı kart gördü.', 'Sarı kart! ' + p + ' uyarıldı.'], memo, 'yc');
                        pr = 7;
                    }
                    break;
                case 'VARCHK':      // incelemenin başlangıcı: sonuç henüz bilinmez; VAR olayından yalnızca tür ve neden okunur
                    if (m.kind === 'pen') out = pick(['Hakem penaltıyı gösterdi ama VAR devrede! Pozisyon monitörden inceleniyor...', 'Penaltı kararı! Ancak VAR hakeme ulaştı, pozisyon kontrol ediliyor...'], memo, 'vcP');
                    else if (m.kind === 'red') out = 'Sert müdahale sonrası hakem VAR ile görüşüyor, pozisyon kırmızı kart açısından inceleniyor...';
                    else out = m.reason === 'ofsayt' ? 'VAR devrede! Gol öncesi ofsayt kontrolü yapılıyor...' : m.reason === 'el' ? 'VAR devrede! Golden önce elle oynama ihtimali inceleniyor...' : 'VAR devrede! Golden önceki bir faul ihtimali inceleniyor...';
                    pr = 9;
                    break;
                case 'VAR':
                    if (m.kind === 'pen') {
                        if (m.outcome === 'confirm') out = pick(['VAR incelemesi tamamlandı: temas var, penaltı kararı geçerli!', 'VAR hakemin kararını onayladı, penaltı geçerli!'], memo, 'vpc');
                        else if (m.reason === 'disi') out = 'VAR faulün ceza sahası dışında olduğunu gösterdi! Penaltı geri alındı, ' + tn(ev.team) + ' lehine serbest vuruş.';
                        else if (m.reason === 'ofsayt') out = 'VAR atağın başında ofsayt buldu' + (m.op != null && m.op >= 0 ? ' (' + nm(m.op) + ')' : '') + '! Penaltı iptal, ' + tn(1 - ev.team) + ' lehine endirekt serbest vuruş.';
                        else if (m.clean) out = 'Penaltı kararı iptal! VAR, ' + sfx(p, 'gen') + ' önce topa dokunduğunu gösterdi, müdahale temiz. Oyun ' + tn(1 - ev.team) + ' kalecisiyle yeniden başlıyor.';      // [var]
                        else out = 'Penaltı kararı iptal! VAR temas olmadığını gösterdi, hakem kararını geri aldı. Oyun ' + tn(1 - ev.team) + ' kalecisiyle yeniden başlıyor.';
                        pr = 9; break;
                    }
                    if (m.kind === 'red') {
                        if (m.outcome === 'downgrade') { out = 'VAR incelemesi sonrası hakem kararını değiştirdi: ' + p + ' kırmızı kart görmüyor, sarı kartla devam ediyor.'; pr = 9; break; }
                        memo.varRed = m.outcome; return null;      // onay / kırmızıya çevirme: kart satırına eklenir (CARD olayı hemen ardından gelir)
                    }
                    if (m.outcome === 'confirm') { memo.varConf = { reason: m.reason, margin: m.margin }; return null; }      // gol satırına eklenir (GOAL olayı hemen ardından gelir)
                    var cmv = Math.max(1, Math.round(Math.abs(m.margin || 0) * 100));
                    var opn = (m.op != null && m.op >= 0 && m.op !== ev.p) ? nm(m.op) : null;      // [offs] iptal kaydı hücum evresindeki başka bir oyuncuya ait olabilir
                    if (m.reason === 'ofsayt') out = opn ? 'VAR incelemesi... Atakta ' + opn + ' ofsayt konumundaymış (' + cmv + ' cm)! ' + (m.own ? 'Gol' : sfx(p, 'gen') + ' golü') + ' iptal edildi.' : 'VAR incelemesi... Pas atıldığı anda ' + p + ' ofsayt konumundaymış (' + cmv + ' cm)! Gol iptal edildi.';
                    else if (m.reason === 'el') out = 'VAR incelemesi... Golden önce elle oynama tespit edildi! ' + sfx(p, 'gen') + ' golü geçersiz.';
                    else if (m.fp != null && m.fp >= 0) out = 'VAR incelemesi... Golden önce ' + nm(m.fp) + ' hava topunda rakibini kolla itmiş! ' + sfx(p, 'gen') + ' golü geçersiz.';      // [var]
                    else out = 'VAR incelemesi... Golden önce ' + tm + ' oyuncusunun faulü var! ' + sfx(p, 'gen') + ' golü geçersiz.';
                    pr = 9;
                    break;
                case 'POST': out = pick(['DİREK! ' + sfx(p, 'gen') + ' şutu direkten döndü!', 'DİREK! Top direği sarstı, ' + p + ' ellerini başına götürdü!', 'DİREK! ' + sfx(p, 'gen') + ' vuruşu direğe çarptı, tribünler nefesini tuttu!'], memo, 'post'); break;
                case 'BLOCK': out = m.wall ? pick(['Baraj engelledi! ' + sfx(q, 'gen') + ' frikiği barajdan döndü.', p + ' barajda, ' + sfx(q, 'gen') + ' frikik atışı takıldı.'], memo, 'wblk') : m.cross ? p + ' araya girdi, ' + sfx(q, 'gen') + (m.kind === 'clear' ? ' uzaklaştırması' : m.kind === 'cross' ? ' ortası' : m.kind === 'pass' ? ' pası' : ' uzun pası') + ' bloke edildi.' : p + ' araya girdi, ' + sfx(q, 'gen') + ' şutu bloke edildi.'; break;
                case 'OFF':
                    var oxg = m.xg || 0;      // [spk] kaçan fırsatın büyüklüğüyle heyecan
                    out = oxg >= .3 ? pick(['İnanılmaz! ' + p + ' bu pozisyonu kaçırdı!', 'Kaçtı! ' + p + ' çok net pozisyonda topu dışarı gönderdi!', 'Bu nasıl kaçtı! ' + sfx(p, 'gen') + ' vuruşu auta gitti!'], memo, 'offB') : oxg >= .12 ? pick(['Az farkla auta! ' + sfx(p, 'gen') + ' şutu direğin yanından çıktı.', 'Çok yakındı! ' + sfx(p, 'gen') + ' vuruşu az farkla dışarıda.'], memo, 'offM') : sfx(p, 'gen') + ' şutu auta gitti.';
                    if (oxg >= .12) pr = 6;
                    break;
                case 'CORNER': out = pick([tn(ev.team) + ' lehine korner.', 'Korner! ' + tn(ev.team) + ' ceza sahasını dolduruyor.', tn(ev.team) + ' köşe vuruşu kazandı, uzun boylular öne çıkıyor.'], memo, 'crn'); break;
                case 'ADV': out = m.back ? 'Avantaj gerçekleşmedi; hakem geri dönüp serbest vuruşu ' + tn(ev.team) + ' lehine verdi.' : m.ok ? 'Avantaj tamam, oyun devam ediyor.' : ''; if (m.ok) pr = 2; break;      // [v186]
                case 'FOUL': if (m.adv) { out = 'Faul! ' + p + ', ' + sfx(q, 'acc') + ' durdurmaya çalıştı ama hakem avantaj verdi, oyun devam ediyor.'; break; } out = m.pen ? 'Ceza sahası içinde faul! ' + p + ' rakibini düşürdü, hakem PENALTI diyor!' : m.air ? 'Hava topunda faul! ' + p + ', ' + sfx(q, 'acc') + ' itti. Serbest vuruş ' + tn(1 - ev.team) + ' lehine.' : m.slide ? pick(['Kayarak girdi ama topa değil adama! ' + p + ' ' + sfx(q, 'acc') + ' biçti. Serbest vuruş ' + tn(1 - ev.team) + ' lehine.', p + ' kayarak müdahalede geç kaldı, faul. Serbest vuruş ' + tn(1 - ev.team) + ' lehine.'], memo, 'slf') : 'Faul! ' + p + ', ' + sfx(q, 'acc') + ' durdurdu. Serbest vuruş ' + tn(1 - ev.team) + ' lehine.'; if (m.pen) pr = 9; break;
                case 'TACKLE': out = m.slide ? pick(['Harika kayarak müdahale! ' + p + ' topu ' + sfx(q, 'abl') + ' temizce aldı.', p + ' kayarak girdi ve topu kaptı!', 'Zamanlaması kusursuz: ' + p + ' kayarak ' + sfx(q, 'acc') + ' durdurdu.'], memo, 'slk') : p + ' topu ' + sfx(q, 'abl') + ' kaptı!'; break;
                case 'INTERCEPT': if (m.tag === 'CORNER' || m.high) out = p + ' ortayı kesti, ' + tm + ' topa sahip.'; else out = p + ' araya girdi, top artık ' + sfx(tm, 'loc') + '.'; break;
                case 'HEADER': out = m.clear ? p + ' ortayı kafayla uzaklaştırdı.' : m.inFront ? p + ' ceza sahasında kafa mücadelesini kazandı!' : p + ' havadaki topu aldı.'; break;
                case 'OFFSIDE': out = pick(['Yan hakem bayrağını kaldırdı, ' + p + ' ofsaytta kaldı.', 'Bayrak havada! Yardımcı hakem ' + p + ' için ofsayt işaretini verdi.', 'Ofsayt! Yan hakemin bayrağı kalkıyor, ' + p + ' çizginin önündeydi.', 'Yardımcı hakem bayrağıyla ofsaytı gösteriyor: ' + p + '.', p + ' ofsayta yakalandı, yan hakem bayrağını kaldırdı.'], memo, 'ofs'); break;      // [hakem]
                case 'CLAIM': out = nm(ev.p) + ' ortayı kaptı.'; break;
                case 'THROUGH': out = sfx(q, 'gen') + ' ' + side(ev.team, ev.y, d) + ' üzerinden ' + Math.round(m.prog) + ' metre ileri gönderdiği pas ' + sfx(p, 'dat') + ' ulaştı.'; break;
                case 'CROSS': out = p + ' ' + side(ev.team, ev.y, d) + 'tan ortayı yaptı.'; break;
                case 'CHAIN': out = tn(ev.team) + ' sabırla oynuyor, üst üste ' + m.chain + ' pas.'; break;
                case 'CLEAR': out = p + ' topu uzaklaştırdı.'; break;
                case 'THROWIN': out = 'Taç atışı ' + tn(ev.team) + ' lehine.'; break;
                case 'GOALKICK': out = 'Aut atışı, ' + nm(ev.p) + ' topu oyuna sokuyor.'; break;
            }
            return out ? { t: ev.t, ev: ev.id, type: t, prio: pr, text: out, ids: ids, team: ev.team, min: ev.min } : null;
        }
        return { line: line };
    }

    // Sıra + gecikme yönetimi (hangi satır ekrana çıkar?)
    function Feed(sim, C, onLine) {
        var mk = make(sim, C), q = [], shownT = -99, last = null;
        var chainSaid = [0, 0];
        function dirsAt() { return [sim.teams[0].dir, sim.teams[1].dir]; }
        function derive(ev) {
            // ham olaylardan spiker olayları türet (yalnızca kayıttan)
            var out = [ev];
            if (ev.type === 'PASS_OK') {
                var m = ev.meta;
                if (m.chain === 6 || m.chain === 10 || m.chain === 15) out = [{ id: ev.id + .1, t: ev.t, type: 'CHAIN', team: ev.team, p: ev.p, p2: ev.p2, meta: { chain: m.chain }, score: ev.score, min: ev.min, x: ev.x, y: ev.y }];
                else if (m.prog >= 20 && m.receiver) out = [{ id: ev.id + .1, t: ev.t, type: 'THROUGH', team: ev.team, p: ev.p, p2: ev.p2, meta: { prog: m.prog }, score: ev.score, min: ev.min, x: ev.x, y: ev.y }];
                else out = [];
            }
            if (ev.type === 'PASS') out = ev.meta && ev.meta.cross ? [{ id: ev.id + .1, t: ev.t, type: 'CROSS', team: ev.team, p: ev.p, p2: ev.p2, meta: {}, score: ev.score, min: ev.min, x: ev.x, y: ev.y }] : [];
            return out;
        }
        function push(ev) {
            derive(ev).forEach(function (e) {
                var l = mk.line(e, dirsAt()); if (!l) return;
                if (l.type === 'INTERCEPT' || l.type === 'CLEAR' || l.type === 'THROWIN' || l.type === 'GOALKICK' || l.type === 'CROSS' || l.type === 'HEADER') { if (!(l.type === 'HEADER' && e.meta.inFront)) { if (Math.random() < .55) return; } }
                q.push(l);
            });
        }
        // now: simülasyon saati. Bir satır göster (varsa) ve döndür.
        // force: simülasyon saati donmuşken (VAR incelemesi, gol/kart sahnesi) satır aralığı beklenmez; çağıran gerçek zamanla aralığı kendisi ayarlar.
        function pump(now, force) {
            if (!q.length) return null;
            // bayat düşür
            q = q.filter(function (l) { return now - l.t <= (MAX_LAG[l.prio] || 3); });
            if (!q.length) return null;
            q.sort(function (a, b) { return b.prio - a.prio || a.t - b.t; });
            var gap = last && last.prio >= 8 ? 2.2 : 1.6;
            var top = q[0];
            if (!force && now - shownT < gap && !(top.prio >= 9 && (!last || last.prio < 9))) return null;
            q.shift(); shownT = now; last = top;
            // aynı anda kalan düşük öncelikli olayları ele
            q = q.filter(function (l) { return l.prio > 3 || now - l.t < 2; });
            if (onLine) onLine(top);
            return top;
        }
        return { push: push, pump: pump, size: function () { return q.length; } };
    }
    var api = { Feed: Feed, PRIO: PRIO, sfx: sfx };
    if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Comm2D = api;
})(typeof window !== 'undefined' ? window : globalThis);

