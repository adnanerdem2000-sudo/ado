    /* [v140] GERÇEK SES PAKETİ: SND_DATA artık CC0 (kamu malı) lisanslı gerçek stadyum kayıtlarından kesilmiş MP3'ler taşır
       (kaynak listesi: src/adoball/SESLER.md). Eski sentetik paket ve IMA ADPCM / mu-law çözücüsü kaldırıldı.
       Örnekler ilk sesli etkileşimde decodeAudioData ile eşzamansız çözülür; çözülürken gelen sesler kısa bir kuyrukta bekler,
       hiçbiri çözülemezse sndPlay false döner ve çağıran eski sentez sesine döner. Döngüler (tribün uğultusu) dosyanın içindeki
       ls..le aralığında döner (dosya başı/sonu MP3 kod çözücü gecikmesine karşı payla periyodik kesilmiştir). */
    var SND = { ok: false, st: 0, b: {}, out: null, bed: null, ch: null, lv: .3, chNext: 0, last: {}, boost: 0, boostT: 0, goalTeam: -1, wh: 0, alive: 0, driven: false, q: [], bedWant: false };
    // [v140] aynı olayın ses çeşitleri: istenen ad yerine çözülmüş çeşitlerden rastgele biri çalar (tekdüzeliği kırar)
    var SND_VAR = { Kick: ['Kick', 'Kick2', 'Kick3'], KickHard: ['KickHard', 'KickHard2'], CrowdRoar: ['CrowdRoar', 'CrowdRoar2'], CrowdOoh: ['CrowdOoh', 'CrowdOoh2'], Whistle: ['Whistle', 'Whistle2'], CrowdChant: ['CrowdChant', 'CrowdChant2'] };
    function sndPick(name) { var v = SND_VAR[name], a = [], i; if (v) for (i = 0; i < v.length; i++) if (SND.b[v[i]]) a.push(v[i]); return a.length ? a[Math.floor(Math.random() * a.length)] : name; }
    function sndB64(s) { var bin = atob(s), u8 = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return u8.buffer; }
    // st: 0 başlamadı, 1 çözülüyor, 2 hazır, 3 kullanılamaz (çağıran sentez sese döner)
    function sndInit() {
        if (SND.st) return SND.st !== 3;
        var ctx = ensureAudioCtx(); if (!ctx) return false;
        if (typeof SND_DATA !== 'object' || !SND_DATA || !ctx.decodeAudioData) { SND.st = 3; return false; }
        try {
            var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3; comp.attack.value = .005; comp.release.value = .25;
            SND.out = ctx.createGain(); SND.out.gain.value = .9; SND.lp = ctx.createBiquadFilter(); SND.lp.type = 'lowpass'; SND.lp.frequency.value = 20000; SND.out.connect(SND.lp); SND.lp.connect(comp); comp.connect(ctx.destination); sndLocaApply();      // [v158] loca: cam arkasından boğuk ses (lp)
        } catch (e) { SND.st = 3; return false; }
        SND.st = 1;
        var keys = Object.keys(SND_DATA), left = keys.length, okN = 0;
        function fin() { if (SND.st !== 1) return; SND.st = okN ? 2 : 3; SND.ok = okN > 0; sndFlush(); }
        keys.forEach(function (k) {
            var D = SND_DATA[k], over = false;
            function ok(ab) { if (over) return; over = true; if (ab && ab.length) { SND.b[k] = ab; okN++; } if (--left <= 0) fin(); }
            function bad() { if (over) return; over = true; if (--left <= 0) fin(); }
            try { var p = ctx.decodeAudioData(sndB64(D.d), ok, bad); if (p && p.then) p.then(ok, bad); } catch (e) { bad(); }
        });
        if (!keys.length) fin();
        setTimeout(fin, 6000);                                                   // güvenlik: takılan çözümde ne çözüldüyse onunla devam
        return true;
    }
    // çözüm bitince kuyrukta bekleyen (son 1,2 sn içinde istenmiş) sesleri ve tribün uğultusunu başlat
    function sndFlush() {
        var q = SND.q, now = performance.now(); SND.q = [];
        if (SND.st !== 2) { SND.bedWant = false; return; }
        if (SND.bedWant) { SND.bedWant = false; try { sndBedStart(); } catch (e) { } }
        q.forEach(function (o) { var age = (now - o.t) / 1000; if (age < 1.2) sndRaw(o.n, o.v, Math.max(0, (o.d || 0) - age), o.r); });
    }
    function sndRaw(name, vol, delay, rate) {
        var ctx = ensureAudioCtx(), nm = sndPick(name), buf = SND.b[nm]; if (!ctx || !buf) return false;
        try { var s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = buf; if (rate) s.playbackRate.value = rate; g.gain.value = vol == null ? 1 : vol; s.connect(g); g.connect(SND.out); s.start(ctx.currentTime + (delay || 0)); return true; } catch (e) { return false; }
    }
    // tek ses: true = çalındı / kuyruğa alındı ya da bilerek atlandı (ses kapalı / aralık sınırı); false = örnek yok, çağıran eski sese döner
    function sndPlay(name, vol, delay, rate, gap) {
        if (!soundEnabled) return true;
        var ctx = ensureAudioCtx(); if (!ctx || !sndInit()) return false;
        if (SND.st === 2 && !SND.b[name]) return false;
        var now = performance.now(); if (gap && SND.last[name] && now - SND.last[name] < gap) return true; SND.last[name] = now;
        if (SND.st === 1) { if (SND.q.length < 24) SND.q.push({ n: name, v: vol, d: delay, r: rate, t: now }); return true; }
        return sndRaw(name, vol, delay, rate);
    }
    function sndWhistle(name, vol, delay) { var now = performance.now(); if (now - SND.wh < 3500 && name === 'Whistle' && !delay) return true; SND.wh = now; return sndPlay(name, vol, delay, 1, 0); }
    function sndBedStart() {
        if (!soundEnabled) return true;
        var ctx = ensureAudioCtx(); if (!ctx || !sndInit()) return false; if (SND.bed) return true;
        if (SND.st === 1) { SND.bedWant = true; return true; }                 // [v140] çözüm bitince başlar
        var b = SND.b.CrowdLoop; if (!b) return false;
        try {
            var D = SND_DATA.CrowdLoop || {}, ls = D.ls || 0, le = D.le && D.le <= b.duration ? D.le : b.duration, len = le - ls;
            var g = ctx.createGain(), hs = ctx.createBiquadFilter(), L = ctx.createBufferSource(), R = ctx.createBufferSource(), sp = !!ctx.createStereoPanner, pl = sp ? ctx.createStereoPanner() : null, pr = sp ? ctx.createStereoPanner() : null, t = ctx.currentTime;
            hs.type = 'highshelf'; hs.frequency.value = 1800; hs.gain.value = -3;
            L.buffer = b; R.buffer = b; L.loop = true; R.loop = true; L.loopStart = ls; L.loopEnd = le; R.loopStart = ls; R.loopEnd = le;
            if (sp) { pl.pan.value = -.7; pr.pan.value = .7; L.connect(pl); R.connect(pr); pl.connect(hs); pr.connect(hs); } else L.connect(hs);
            hs.connect(g); g.connect(SND.out); g.gain.value = 0; SND.lv = .3; g.gain.setTargetAtTime(SND.lv, t, .9);
            L.start(t, ls + Math.random() * len * .2); if (sp) R.start(t, ls + len * .52);      // kaydırılmış ikinci kopya: ilintisiz stereo kalabalık
            SND.bed = { L: L, R: sp ? R : null, g: g, hs: hs }; SND.driven = false; SND.alive = performance.now();
            SND.chNext = performance.now() + 30000 + Math.random() * 40000;
            return true;
        } catch (e) { SND.bed = null; return false; }
    }
    /* [v158] loca sesi: tüm maç sesi camın arkasından gelir gibi boğuk (alçak geçiren süzgeç); gol anında "loca kapısı açılır" (__abLocaOpen) */
    function sndLocaApply() { if (!SND.lp) return; try { var ctx = ensureAudioCtx(), t = ctx.currentTime, f = SND.lp.frequency; f.cancelScheduledValues(t); f.setTargetAtTime(SND.loca ? 820 : 20000, t, .25); } catch (e) { } }
    window.__abLoca = function (on) { SND.loca = !!on; sndLocaApply(); };
    window.__abLocaOpen = function () { if (!SND.loca || !SND.lp) return; try { var ctx = ensureAudioCtx(), t = ctx.currentTime, f = SND.lp.frequency; f.cancelScheduledValues(t); f.setTargetAtTime(9500, t, .05); f.setTargetAtTime(820, t + 2.8, 1.1); } catch (e) { } };
    function sndBedStop(fast) {
        SND.bedWant = false;
        var B = SND.bed; SND.bed = null; sndChantStop(fast);
        if (!B) return; try { var ctx = ensureAudioCtx(), t = ctx.currentTime, tl = fast ? .05 : .7; B.g.gain.cancelScheduledValues(t); B.g.gain.setTargetAtTime(0, t, tl); B.L.stop(t + tl * 5); if (B.R) B.R.stop(t + tl * 5); } catch (e) { try { B.L.stop(); if (B.R) B.R.stop(); } catch (e2) { } }
    }
    // [v140] tezahürat: gerçek kayıt (davullu / şarkılı) bir kez, yumuşak giriş-çıkışla çalar; "loops" eski çağrılarla uyum için yok sayılır
    function sndChant(loops) {
        var ctx = ensureAudioCtx(); if (!ctx || SND.st !== 2 || SND.ch || !SND.bed || !soundEnabled) return;
        try {
            var nm = sndPick('CrowdChant'), buf = SND.b[nm]; if (!buf) return;
            var s = ctx.createBufferSource(), g = ctx.createGain(), t = ctx.currentTime, dur = buf.duration;
            s.buffer = buf; g.gain.value = 0; g.gain.setTargetAtTime(.24, t, .9); g.gain.setTargetAtTime(0, t + Math.max(1, dur - 2.2), .7);
            s.connect(g); g.connect(SND.out); s.start(t); s.stop(t + dur + .1);
            var C = SND.ch = { s: s, g: g }; s.onended = function () { if (SND.ch === C) SND.ch = null; };
        } catch (e) { SND.ch = null; }
    }
    function sndChantStop(fast) { var C = SND.ch; SND.ch = null; if (!C) return; try { var ctx = ensureAudioCtx(), t = ctx.currentTime; C.g.gain.cancelScheduledValues(t); C.g.gain.setTargetAtTime(0, t, fast ? .05 : .6); C.s.stop(t + (fast ? .3 : 3)); } catch (e) { } }
    function sndBoost(v, sec) { SND.boost = Math.max(v, SND.boostT > performance.now() ? SND.boost : 0); SND.boostT = performance.now() + sec * 1000; }
    /* tribün şiddeti (2B motor kare döngüsünden ~7 Hz): o = { tens: atak tehlikesi 0..1, home: atak ev sahibinin, dead, late: son dk gerginliği 0..1, ff: hızlı akış, paused } */
    function sndCrowd(o) {
        SND.alive = performance.now(); SND.driven = true;
        if (!soundEnabled || !SND.ok || !SND.bed) return;
        var ctx = ensureAudioCtx(), now = SND.alive, t = ctx.currentTime, bst = SND.boostT > now ? SND.boost : 0;
        var lv = o.paused ? .07 : Math.min(.62, (.24 + .22 * o.tens * (o.home ? 1 : .7) + .05 * (o.late || 0) + bst) * (o.dead ? .92 : 1));
        if (Math.abs(lv - SND.lv) > .004) { SND.bed.g.gain.setTargetAtTime(lv, t, lv > SND.lv ? .35 : 1.3); SND.lv = lv; }
        SND.bed.hs.gain.setTargetAtTime(-4 + 6.5 * Math.max(0, Math.min(1, (lv - .24) / .3)), t, .5);      // coşkuyla tiz (bağırış) artar
        if (!o.ff && !o.paused && now > SND.chNext) { SND.chNext = now + 75000 + Math.random() * 75000; if (Math.random() < .75) sndChant(); }
    }
    /* 2B motor olayına tepki (vuruş, şut, kurtarış, direk, kaçan fırsat, faul, kart, ofsayt, korner). c = { ff: hızlı akış }.
       true = örneklerle işlendi (ya da ses kapalı) - false: çağıran eski sese döner */
    function sndEvent(ev, c) {
        if (!soundEnabled) return true; if (!sndInit()) return false;
        var m = ev.meta || {}, ff = !!(c && c.ff), xg = m.xg || 0, r = .93 + Math.random() * .14, ty = ev.type;
        if (ff && !(ty === 'POST' || ((ty === 'SAVE' || ty === 'OFF') && xg >= .15) || ty === 'CARD')) return true;      // hızlı akış: yalnız büyük tepkiler
        switch (ty) {
            case 'PASS':
                if (m.tag === 'KICKOFF') sndWhistle('Whistle', .55, 0);                     // golden sonra başlama düdüğü (maç başı düdüğü az önce çaldıysa atlanır)
                sndPlay(m.high || m.cross ? 'KickHard' : 'Kick', m.high || m.cross ? .34 : .3, m.tag === 'KICKOFF' ? .25 : 0, r, 100); break;      // [v140] gerçek vuruş kayıtları sentezden kısık: seviye biraz artırıldı
            case 'CLEAR': sndPlay('KickHard', .4, 0, r * .95, 100); break;
            case 'SHOT': if (m.tag === 'HEAD') sndPlay('Header', .42, 0, r, 120); else sndPlay('KickHard', .62, 0, r, 120); sndBoost(.08 + .22 * Math.min(1, xg * 3), 2.4); break;
            case 'HEADER': sndPlay('Header', .3, 0, r, 100); break;
            case 'BLOCK': sndPlay('Kick', .34, 0, .85 * r, 100); break;
            case 'SAVE': sndPlay(ev.team === 0 ? 'CrowdCheer' : 'Applause', ev.team === 0 ? .4 : .22, .25, 1, 1800); if (xg >= .15) sndPlay('CrowdOoh', Math.min(.85, .45 + xg), 0, 1, 1500); break;
            case 'POST': sndPlay('Post', .75, 0, 1, 600); sndPlay('CrowdOoh', .85, .1, 1, 1200); sndBoost(.2, 3); break;
            case 'OFF': if (xg >= .1) sndPlay('CrowdOoh', Math.min(.85, .35 + xg * 1.2), 0, 1, 1500); if (xg >= .3 && ev.team === 0) sndPlay('CrowdGroan', .4, 1.1, 1, 5000); break;      // [v140] ev sahibinin büyük fırsatı kaçınca hayal kırıklığı iç çekişi
            case 'FOUL': sndWhistle(m.pen ? 'WhistleLong' : 'Whistle', .55, 0); if (ev.team === 1 || m.pen) sndPlay('CrowdWhistle', m.pen ? .5 : .26, .25, 1, 4000); break;      // deplasman faulüne ev sahibi yuhalar
            case 'CARD': sndPlay('CrowdWhistle', m.card === 'R' ? .75 : .42, .1, 1, 2500); break;
            case 'OFFSIDE': sndWhistle('Whistle', .5, 0); break;
            case 'CORNER': sndBoost(.08, 3); if (ev.team === 0) sndPlay('CrowdCheer', .22, .2, 1, 6000); break;
        }
        return true;
    }
    setInterval(function () { if (SND.bed && SND.driven && performance.now() - SND.alive > 2500) sndBedStop(false); }, 1000);      // 2B maç ekranı kapandıysa uğultu söner
    // ------- /SES EFEKTLERİ -------


    function showActionOverlay(icon, title, subtitle, toneClass, team) {
        const ov = document.getElementById('action-overlay');
        ov.classList.remove('var-mode');
        document.getElementById('var-monitor-box').style.display = 'none';
        const iconEl = document.getElementById('action-icon');
        iconEl.style.display = 'block';
        iconEl.innerText = icon;
        updateActionOverlayText(title, subtitle, toneClass);
        const crestEl = document.getElementById('action-crest');
        if (crestEl) crestEl.innerHTML = team ? renderTeamCrestHTML(team, 44) : '';
        ov.classList.add('active');
    }

    function updateActionOverlayText(title, subtitle, toneClass) {
        const titleEl = document.getElementById('action-title');
        titleEl.innerText = title;
        titleEl.className = 'action-title' + (toneClass ? ' ' + toneClass : '');
        document.getElementById('action-subtitle').innerText = subtitle;
    }

    function hideActionOverlay() {
        document.getElementById('action-overlay').classList.remove('active');
        document.getElementById('action-overlay').classList.remove('var-mode');
    }

    function hideInjuryBoard() {
        const overlay = document.getElementById('injury-board-overlay');
        const board = document.getElementById('injury-board');
        if (overlay) overlay.classList.remove('active');
        if (board) board.classList.remove('board-exit');
    }

    async function showInjuryTimeBoard(minutes, sessionAtCall, half) {
        const overlay = document.getElementById('injury-board-overlay');
        const board = document.getElementById('injury-board');
        document.getElementById('injury-board-label').innerText = half === 1 ? 'İLK YARI - İLAVE SÜRE' : 'İLAVE SÜRE';
        document.getElementById('injury-board-digits').innerText = '+' + minutes;
        board.classList.remove('board-exit');
        overlay.classList.add('active');
        playWhistle();
        addTicker(half === 1
            ? `Dördüncü hakem tabelayı kaldırdı: ilk yarıya <strong>${minutes} dakika</strong> ilave süre verildi.`
            : `Dördüncü hakem tabelayı kaldırdı: <strong>${minutes} dakika</strong> ilave süre verildi.`);
        await overlayWait(3200);
        if (sessionAtCall !== matchSessionId) return;
        // Çıkış girişten farklı bir his versin: yavaşça zıplayarak inmek yerine hızlıca yukarı süzülüp soluyor
        board.classList.add('board-exit');
        await overlayWait(450);
        overlay.classList.remove('active');
        board.classList.remove('board-exit');
        if (sessionAtCall === matchSessionId) eventOverlayActive = false;
    }

    // MAÇ AKIŞI / ATAK ZİNCİRİ: bir tehlikeli atak artık tek başına kopuk bir olay değil, birkaç
    // bağlı adımdan oluşan küçük bir hikaye olarak Kritik Anlar paneline akıyor - "topu kazandı" ->
    // "boşluğu buldu" -> "ceza sahasına girdi" -> (ardından TEHLİKELİ ATAK! ve şut sonucu). Her adım
    // gerçek dakikadan 1-2 dakika GERİYE yaslanmış bir etiketle gösterilir (12', 14', 15' gibi),
    // böylece atağın birkaç dakikaya yayılan bir gelişim gibi hissettirmesi sağlanır.
    async function playAttackBuildupChain(attTeam, attacker, midfielder, currentMin) {
        const sessionId = matchSessionId;
        const pick = arr => arr[Math.floor(Math.random() * arr.length)];
        const m1 = Math.max(0, currentMin - 2);
        const m2 = Math.max(0, currentMin - 1);

        const phaseWon = [
            `${attTeam.name} topu kazandı.`,
            `${attTeam.name} orta sahada topa sahip oldu.`,
            `${midfielder.name} topu kazandı.`,
            `${midfielder.name}'in müdahalesiyle ${attTeam.name} topu kaptı.`
        ];
        const phaseSpace = [
            `${attacker.name} kanatta boşluğu buldu.`,
            `${attacker.name} hızla ileri çıktı.`,
            `${midfielder.name}'dan topu alan ${attacker.name} ilerledi.`,
            `${attacker.name} rakibini çalımlayıp ilerledi.`
        ];
        const phaseBox = [
            `${attacker.name} ceza sahasına girdi.`,
            `${attTeam.name} ceza sahası önünde tehlike yaratıyor.`,
            `${attacker.name} pozisyon arıyor.`
        ];

        addHighlight(attTeam, pick(phaseWon), 'buildup', m1);
        await wait(overlayWaitDurationForChain());
        if (sessionId !== matchSessionId) return false;
        addHighlight(attTeam, pick(phaseSpace), 'buildup', m2);
        await wait(overlayWaitDurationForChain());
        if (sessionId !== matchSessionId) return false;
        addHighlight(attTeam, pick(phaseBox), 'buildup', currentMin);
        await wait(overlayWaitDurationForChain());
        return sessionId === matchSessionId;
    }
    // Zincirdeki her adım arası kısa, SABİT bir bekleme - diğer tüm dramatik sahneler gibi maç
    // hızından (1x/2x/4x) etkilenmez, sadece dakikaların akış hızı değişir.
    function overlayWaitDurationForChain() {
        return 480;
    }

    async function playDangerousAttack(attTeam, attacker) {
        showActionOverlay('⚠️', 'TEHLİKELİ ATAK!', `${attTeam.name} atağında ${attacker.name} topla buluştu...`, '', attTeam);
        playCrowdGasp();
        await overlayWait(2100);
    }

    // Önce takımın ÖNCEDEN ATADIĞI oyuncuyu dener (kadro ekranında seçilen penaltıcı/frikikçi/
    // kornerci); o oyuncu kırmızı kart görmüşse (ya da hiç atanmamışsa) otomatik olarak takımdaki
    // ilgili özelliği en yüksek oyuncuya geçer - "seçilen futbolcu kırmızı kart yerse en iyi
    // alternatif devralsın" kuralı burada uygulanıyor.
    function getDesignatedOrBestTaker(team, designatedField, statKey) {
        const designatedId = team[designatedField];
        if (designatedId && !isSentOff(designatedId)) {
            const p = getPlayerFromId(designatedId);
            if (p) return p;
        }
        const candidates = team.squad
            .filter((id, idx) => idx !== 0 && !isSentOff(id))
            .map(getPlayerFromId)
            .filter(Boolean);
        if (!candidates.length) return getPlayerFromId(team.squad[6]);
        candidates.sort((a, b) => (b[statKey] || 50) - (a[statKey] || 50));
        return candidates[0];
    }

    // Bir takımın "Penaltı Kullanma" özelliği en yüksek sahadaki oyuncusunu bulur - gerçek
    // futbolda olduğu gibi, penaltıyı rastgele biri değil takımın penaltıcısı kullanır.
    function getBestPenaltyTaker(team) {
        return getDesignatedOrBestTaker(team, 'penaltyTakerId', 'pen');
    }

    // Korneri takımın "Korner Kullanma" özelliği en yüksek oyuncusu atar.
    function getBestCornerTaker(team) {
        return getDesignatedOrBestTaker(team, 'cornerTakerId', 'cor');
    }

    // Kornerde topla buluşacak oyuncu rastgele değil, kafa vuruşu iyi olanlara ağırlıklı seçilir.
    function getWeightedHeaderTarget(team, excludeId) {
        const candidates = team.squad
            .filter((id, idx) => idx !== 0 && id !== excludeId && !isSentOff(id))
            .map(getPlayerFromId)
            .filter(Boolean);
        if (!candidates.length) return null;
        const weighted = candidates.map(p => ({ p, w: Math.max(5, p.hea || 50) }));
        const total = weighted.reduce((s, w) => s + w.w, 0);
        let r = Math.random() * total;
        for (const w of weighted) { r -= w.w; if (r <= 0) return w.p; }
        return weighted[weighted.length - 1].p;
    }

    // Korner kazanıldığında: takımın kornercisi ortayı atar, kafa vuruşu iyi bir oyuncu topla
    // buluşur. Golse asist AÇIKÇA "Korner Asisti" olarak işaretlenir - normal açık oyun asistleriyle
    // karıştırılmaz (onlar hâlâ sadece "(Asist: X)" şeklinde kalır).
    async function playCornerSequence(attTeam, defTeam) {
        const taker = getBestCornerTaker(attTeam);
        showActionOverlay('🚩', 'KORNER!', `${taker.name} korneri kullanmaya hazırlanıyor...`, '', attTeam);
        await overlayWait(1700);

        const target = getWeightedHeaderTarget(attTeam, taker.id);
        const gk = getPlayerFromId(defTeam.squad[0]);
        const corScore = taker.cor || 50;
        const heaScore = target ? (target.hea || 50) : 50;
        const gkScore = gk ? getOverall(gk) : 50;

        // Kornerin gerçekten tehlikeli bir kafa vuruşu pozisyonuna dönüşme ihtimali - kornercinin
        // kalitesine bağlı.
        const dangerChance = Math.max(0.2, Math.min(0.7, 0.35 + (corScore - 60) / 200));
        if (!target || Math.random() >= dangerChance) {
            await playOutcomeReveal('🧤', 'KALECİ TOPLADI!', `Kaleci korneri güvenli şekilde kontrol altına aldı.`, 'outcome-neutral', 1400);
            return { scored: false };
        }

        const headGoalChance = Math.max(0.08, Math.min(0.55, 0.20 + (heaScore - 60) / 200 - (gkScore - 60) / 300));
        const scored = Math.random() < headGoalChance;
        if (scored) {
            await playOutcomeReveal('⚽', 'KAFA GOLÜ!', `${target.name}, ${taker.name} korneriyle kafa vuruşunu filelere gönderdi!`, 'outcome-good', 1300);
        } else {
            await playOutcomeReveal('❌', 'KAFAYLA DIŞARI!', `${target.name}'in kafa vuruşu dışarı gitti.`, 'outcome-bad', 1400);
        }
        return { scored, scorer: target, taker, gk, xg: headGoalChance };
    }

    // Frikiği takımın "Duran Top (Frikik)" özelliği en yüksek oyuncusu kullanır.
    function getBestFreeKickTaker(team) {
        return getDesignatedOrBestTaker(team, 'freeKickTakerId', 'fk');
    }

    // Tehlikeli bölgede kazanılan faul sonrası DOĞRUDAN kaleye frikik denemesi. Golse asist YOK -
    // doğrudan "Frikik Golü" olarak işaretlenir, normal açık oyun/korner asistleriyle karışmaz.
    // Kaçırma anlatımları artık her zaman "duvara çarptı" demek yerine gerçekçi çeşitlilik gösterir:
    // bara çarpma, üstten auta gitme, direğin yanından/direkten auta çıkma, kalecinin harika çıkarması.
    async function playFreeKickSequence(attTeam, defTeam) {
        const taker = getBestFreeKickTaker(attTeam);
        showActionOverlay('🎯', 'FRİKİK!', `${taker.name} topun başına geçti, doğrudan kaleye vuracak...`, '', attTeam);
        await overlayWait(2000);

        const gk = getPlayerFromId(defTeam.squad[0]);
        const fkScore = taker.fk || 50;
        const gkScore = gk ? Math.max(gk.gk_ref || 50, gk.gk_pos || 50) : 50;

        const onTargetChance = Math.max(0.25, Math.min(0.75, 0.35 + (fkScore - 60) / 200));
        if (Math.random() >= onTargetChance) {
            const missTemplates = [
                { icon: '🧱', title: 'DUVARDAN DÖNDÜ!', text: `${taker.name}'in vuruşu duvara çarpıp uzaklaştı.` },
                { icon: '⬆️', title: 'ÜSTTEN AUTA!', text: `${taker.name}'in vuruşu kale üstünden auta gitti.` },
                { icon: '↗️', title: 'DİREĞİN YANINDAN!', text: `${taker.name}'in vuruşu direğin yanından auta gitti.` },
                { icon: '🥅', title: 'DİREKTEN DÖNDÜ!', text: `${taker.name}'in vuruşu direğe çarpıp auta çıktı.` },
                { icon: '🎯', title: 'BARA ÇARPTI!', text: `${taker.name}'in vuruşu kale direğinin üst çubuğuna çarptı!` }
            ];
            const m = missTemplates[Math.floor(Math.random() * missTemplates.length)];
            await playOutcomeReveal(m.icon, m.title, m.text, 'outcome-neutral', 1500);
            addHighlight(attTeam, `${m.icon} ${taker.name}'in frikiği kaleyi bulamadı`, 'freekick');
            // ÖNEMLİ HATA DÜZELTMESİ: bu dönüş değeri eskiden "taker"/"gk" alanlarını içermiyordu,
            // ama çağıran kod (simulateMinuteAction) fkResult.taker.id'ye HER durumda koşulsuz
            // erişiyordu. Bu, kaçırılan her frikikte bir hata fırlatıp (fkResult.taker undefined)
            // maçı o anda TAMAMEN dondururdu (eventOverlayActive hiç false olmuyordu) - kullanıcının
            // "duvardan döndü'de takılı kalıyor" diye bildirdiği hata tam olarak buydu.
            return { scored: false, onTarget: false, taker, gk, xg: onTargetChance * Math.max(0.06, Math.min(0.45, 0.16 + (fkScore - 60) / 180 - (gkScore - 60) / 250)) };
        }

        const goalChance = Math.max(0.06, Math.min(0.45, 0.16 + (fkScore - 60) / 180 - (gkScore - 60) / 250));
        const scored = Math.random() < goalChance;
        if (scored) {
            await playOutcomeReveal('⚽', 'MÜTHİŞ FRİKİK GOLÜ!', `${taker.name} topu doğrudan filelerle buluşturdu!`, 'outcome-good', 1600);
        } else {
            const saveTemplates = [
                `${gk ? gk.name : 'Kaleci'} frikiği kurtardı!`,
                `${gk ? gk.name : 'Kaleci'} harika bir refleksle çıkardı!`,
                `${gk ? gk.name : 'Kaleci'} son anda topu kornere çeldi!`
            ];
            const saveText = saveTemplates[Math.floor(Math.random() * saveTemplates.length)];
            await playOutcomeReveal('🧤', 'KALECİ ÇIKARDI!', saveText, 'outcome-neutral', 1600);
            addHighlight(defTeam, `🧤 Frikik Kurtarışı - ${gk ? gk.name : 'Kaleci'}`, 'chance');
        }
        return { scored, onTarget: true, taker, gk, xg: onTargetChance * goalChance };
    }

    // Ceza sahasında müdahale -> penaltı verilip verilmeyeceği (bazen doğrudan hakem, bazen VAR
    // incelemesiyle) -> verildiyse gerçek bir penaltı atışı sahnesi. "Penaltı Kullanma" özelliği
    // atışın gol olma ihtimalini, kalecinin "Birebir" özelliği de kurtarış ihtimalini belirliyor.
    async function playPenaltySequence(attTeam, defTeam) {
        showActionOverlay('🥅', 'CEZA SAHASINDA MÜDAHALE!', `${attTeam.name} için penaltı ihtimali doğdu, hakem pozisyona bakıyor...`, '', attTeam);
        await overlayWait(1700);

        let outcome;
        if (Math.random() < 0.6) {
            // Hakem doğrudan karar veriyor, VAR'a gerek kalmadan
            outcome = 'awarded';
            await playOutcomeReveal('🎯', 'PENALTI VERİLDİ!', 'Hakem doğrudan noktayı gösteriyor!', 'outcome-good', 1500);
        } else {
            outcome = await playVarReview('penalty');
        }

        if (outcome !== 'awarded') {
            addTicker(`VAR incelemesi sonrası penaltı kararı verilmedi, oyun devam ediyor.`);
            return { awarded: false };
        }

        const taker = getBestPenaltyTaker(attTeam);
        const gk = getPlayerFromId(defTeam.squad[0]);
        showActionOverlay('⚽', 'PENALTI!', `${taker.name} topun başına geçti...`, '', attTeam);
        await overlayWait(2200);

        const penScore = taker.pen || 50;
        const gkScore = gk ? (gk.gk_1v1 || 50) : 50;
        const convertChance = Math.max(0.45, Math.min(0.93, 0.78 + (penScore - 70) / 250 - (gkScore - 70) / 300));
        const scored = Math.random() < convertChance;
        let result;

        if (scored) {
            result = 'scored';
            await playOutcomeReveal('⚽', 'GOL!', `${taker.name} soğukkanlılıkla topu filelerle buluşturdu!`, 'outcome-good', 1300);
        } else if (Math.random() < 0.6) {
            result = 'saved';
            await playOutcomeReveal('🧤', 'KALECİ KURTARDI!', `${gk ? gk.name : 'Kaleci'} müthiş bir refleksle penaltıyı kurtardı!`, 'outcome-neutral', 1800);
        } else {
            result = 'missed';
            await playOutcomeReveal('❌', 'AUTA GİTTİ!', `${taker.name} baskıya yenildi, şutu auta gitti!`, 'outcome-bad', 1800);
        }

        return { awarded: true, scored, result, taker, gk };
    }

    async function playOutcomeReveal(icon, title, subtitle, toneClass, holdMs) {
        updateActionOverlayText(title, subtitle, toneClass);
        document.getElementById('action-icon').innerText = icon;
        await overlayWait(holdMs || 1900);
        hideActionOverlay();
        await overlayWait(300);
    }

    async function playVarReview(kind, tendency) {
        const ov = document.getElementById('action-overlay');
        ov.classList.add('active');
        ov.classList.add('var-mode');
        document.getElementById('action-icon').style.display = 'none';
        document.getElementById('var-monitor-box').style.display = 'block';

        // VAR monitöründe İNCELEME SEBEBİ net ve sabit 3 mesajdan biriyle gösteriliyor:
        // "Penaltı İnceleniyor", "Ofsayt Kontrolü", "Kırmızı Kart Kontrolü".
        let reviewLabel;
        if (kind === 'goal') {
            reviewLabel = 'Ofsayt Kontrolü';
        } else if (kind === 'penalty') {
            reviewLabel = 'Penaltı İnceleniyor';
        } else {
            reviewLabel = 'Kırmızı Kart Kontrolü';
        }
        updateActionOverlayText('VAR İNCELEMESİ', reviewLabel, '');
        await overlayWait(3800);
        document.getElementById('var-monitor-box').style.display = 'none';
        document.getElementById('action-icon').style.display = 'block';

        let outcome, icon, title, subtitle, tone;
        let roll = Math.random();
        if (kind === 'goal') {
            outcome = roll < 0.55 ? 'confirmed' : 'cancelled';
            icon = outcome === 'confirmed' ? '✅' : '🚫';
            title = outcome === 'confirmed' ? 'GOL ONAYLANDI!' : 'GOL İPTAL EDİLDİ!';
            subtitle = outcome === 'confirmed' ? 'Hakem sahaya işaret ediyor, gol geçerli.' : 'Ofsayt tespit edildi, gol sayılmıyor.';
            tone = outcome === 'confirmed' ? 'outcome-good' : 'outcome-bad';
            if (outcome === 'cancelled') playDisappointment();
        } else if (kind === 'penalty') {
            outcome = roll < 0.62 ? 'awarded' : 'not-awarded';
            icon = outcome === 'awarded' ? '🎯' : '🚫';
            title = outcome === 'awarded' ? 'PENALTI VERİLDİ!' : 'PENALTI YOK!';
            subtitle = outcome === 'awarded' ? 'Hakem noktayı gösteriyor!' : 'İnceleme sonucu penaltılık pozisyon bulunamadı.';
            tone = outcome === 'awarded' ? 'outcome-good' : 'outcome-neutral';
        } else {
            // Kırmızı kart ihtimali faul yapan oyuncunun agresiflik eğilimiyle orantılı ama her zaman düşük kalır
            let t = (tendency === undefined ? 0.4 : tendency);
            let redChance = 0.05 + t * 0.10;   // ~%5 – %15 arası (ikinci sarı kart birikimiyle birleşince gerçekçi ~0.2-0.3/maç kırmızı kart oranı hedefleniyor)
            let yellowChance = 0.55;
            if (roll < redChance) outcome = 'red';
            else if (roll < redChance + yellowChance) outcome = 'yellow';
            else outcome = 'none';
            icon = outcome === 'red' ? '🟥' : outcome === 'yellow' ? '🟨' : '👍';
            title = outcome === 'red' ? 'KIRMIZI KART!' : outcome === 'yellow' ? 'SARI KART!' : 'DEVAM EDİYOR';
            subtitle = outcome === 'red' ? 'Hakem VAR sonrası kararını değiştirdi.' : outcome === 'yellow' ? 'İhlal onaylandı, kart gösteriliyor.' : 'İnceleme sonucu faul verilmedi, oyun devam ediyor.';
            tone = outcome === 'red' ? 'outcome-bad' : outcome === 'yellow' ? 'outcome-neutral' : 'outcome-good';
        }
        await playOutcomeReveal(icon, title, subtitle, tone, 2400);
        ov.classList.remove('var-mode');
        return outcome;
    }

    function showGoalEffect(playerName, teamName) {
        const overlay = document.getElementById('gol-overlay');
        document.getElementById('gol-scorer-text').innerText = `${playerName} (${teamName})`;
        overlay.classList.add('active');
        playGoalSound();
        return overlayWait(2700).then(() => { overlay.classList.remove('active'); });
    }

    async function simulateMinuteAction(min) {
        const sessionId = matchSessionId;
        matchData.globalMinuteCounter = (matchData.globalMinuteCounter || 0) + 1;
        // Topa sahip olma: eskiden basit oran (hPower/(hPower+aPower)) kullanılıyordu, bu da gerçek
        // bir güç farkını bile aşırı "yumuşatıp" %55-56 gibi neredeyse başa baş sonuçlara sıkıştırıyordu.
        // Artık güç farkı DOĞRUDAN yüzdeye yansıyor (fark × 0.8), 20-80 aralığında sınırlanıyor - eşit
        // takımlarda yine %50/%50 kalıyor ama gerçek bir kalite farkında (örn. 19 puan) %65 gibi
        // gerçekçi bir üstünlüğe dönüşüyor. Şans faktörü (lWeight) hedefin etrafında rastgele oynatıyor.
        // getEffectiveTeamPower, kalıcı güce büyük kararlar sonrası geçici moral etkisini ekler.
        let effHPower = getEffectiveTeamPower(true);
        let effAPower = getEffectiveTeamPower(false);
        let baseShare = Math.max(20, Math.min(80, 50 + (effHPower - effAPower) * 0.8));
        let luckNoise = (Math.random() - 0.5) * 2 * 100 * (settings.lWeight / 100);
        let instantShare = Math.max(10, Math.min(90, baseShare + luckNoise));

        matchData.hStats.pos = Math.round((matchData.hStats.pos * 4 + instantShare) / 5);
        matchData.aStats.pos = 100 - matchData.hStats.pos;
        matchData.hStats.pass += Math.floor((matchData.hStats.pos/10) * (Math.random()*0.5+0.5));
        matchData.aStats.pass += Math.floor((matchData.aStats.pos/10) * (Math.random()*0.5+0.5));

        let r = Math.random();
        if (r < 0.25) {
            let isHomeAtt = (Math.random() < matchData.hStats.pos/100);
            let att = isHomeAtt ? matchData.hStats : matchData.aStats;
            let def = isHomeAtt ? matchData.aStats : matchData.hStats;
            let attTeam = isHomeAtt ? matchData.h : matchData.a;
            let defTeam = isHomeAtt ? matchData.a : matchData.h;
            
            // Şutun ham kalitesi (konum/pozisyon): xG aralığı ~0.08–0.58 (simülasyonla doğrulandı:
            // eşit güçte iki takımda maç başına ort. ~2.6 gol, ~%25 beraberlik - gerçek futbol
            // istatistiklerine çok yakın). Takımlar arası güç farkı, yaratılan pozisyonun
            // KALİTESİNİ de etkiler: güçlü bir takım sadece daha sık değil, aynı zamanda daha
            // nitelikli pozisyonlar üretir. Fark çok büyükse bile tek bir şutta üst sınır ~1.7x,
            // alt sınır ~0.55x ile tutuluyor - sürpriz sonuçlar hâlâ mümkün ama daha az sıklıkla.
            let powerGap = getEffectiveTeamPower(isHomeAtt) - getEffectiveTeamPower(!isHomeAtt);
            let qualityMultiplier = Math.max(0.55, Math.min(1.7, 1 + powerGap / 110));
            let base_xg = ((Math.random() * 0.5) + 0.08) * qualityMultiplier;
            let attacker = getRandomAttacker(attTeam);
            let midfielder = getRandomMidfielder(attTeam);
            let defender = getRandomDefender(defTeam);

            if(Math.random() < 0.4) {
                addTicker(getCommentary('buildUp', { player: midfielder.name, team: attTeam.name }));
                adjustRating(midfielder.id, 0.03);
            } else {
                // MAÇ AKIŞI: önce Kritik Anlar panelinde birkaç bağlı adımdan oluşan bir atak zinciri
                // akar (topu kazandı -> boşluğu buldu -> ceza sahasına girdi), ardından dramatik
                // TEHLİKELİ ATAK! sahnesi oynar. Maç saati bu zincir boyunca da donuk kalır.
                eventOverlayActive = true;
                const chainOk = await playAttackBuildupChain(attTeam, attacker, midfielder, min);
                if (!chainOk || sessionId !== matchSessionId) return;
                await playDangerousAttack(attTeam, attacker);
                if (sessionId !== matchSessionId) return;

                // Bazen atak ofsayt bayrağıyla kesiliyor - şut hiç gerçekleşmiyor
                if (Math.random() < 0.08) {
                    att.offsides = (att.offsides || 0) + 1;
                    await playOutcomeReveal('🚩', 'OFSAYT!', `${attacker.name} ofsayt pozisyonunda yakalandı, atak kesildi.`, 'outcome-neutral', 1500);
                    if (sessionId !== matchSessionId) return;
                    addTicker(`Yardımcı hakemin bayrağı kalktı: <strong>${attacker.name}</strong> ofsaytta.`);
                    hideActionOverlay();
                    if (sessionId === matchSessionId) eventOverlayActive = false;
                    updateStatUI();
                    return;
                }

                // Ceza sahası içinde müdahale / penaltı ihtimali - "Penaltı Kullanma" özelliği burada
                // devreye giriyor, artık gol sonrası rastgele "(p)" etiketi değil, GERÇEK bir olay.
                if (Math.random() < 0.07) {
                    const penResult = await playPenaltySequence(attTeam, defTeam);
                    if (sessionId !== matchSessionId) return;
                    if (penResult.awarded) {
                        att.shots++; att.sot++;
                        att.xg += 0.76; // gerçek futbolda ortalama penaltı xG değeri
                        bumpPlayerStat(penResult.taker.id, 'shots');
                        bumpPlayerStat(penResult.taker.id, 'sot');
                        if (penResult.scored) {
                            att.goals++;
                            document.getElementById(isHomeAtt ? 'score-home' : 'score-away').innerText = att.goals;
                            addHighlight(attTeam, `⚽ ${penResult.taker.name} (P)`);
                            recordTournamentGoal(penResult.taker, null, attTeam);
                            bumpPlayerStat(penResult.taker.id, 'goals');
                            adjustRating(penResult.taker.id, 1.1);
                            if (penResult.gk) adjustRating(penResult.gk.id, -0.4);
                            applyMomentumShift(attTeam, 2.5);
                            applyMomentumShift(defTeam, -2.5);
                            await showGoalEffect(penResult.taker.name, attTeam.name);
                            if (sessionId !== matchSessionId) return;
                        } else if (penResult.result === 'saved') {
                            // Kaleci penaltı çıkardığında bu MAÇIN öne çıkan anlarından biri -
                            // reyting etkisi buna göre büyük ve belirgin olmalı.
                            addHighlight(defTeam, `🧤 Kurtarılan Penaltı - ${penResult.gk ? penResult.gk.name : 'Kaleci'}`);
                            if (penResult.gk) bumpPlayerStat(penResult.gk.id, 'saves');
                            adjustRating(penResult.taker.id, -0.6);
                            if (penResult.gk) adjustRating(penResult.gk.id, 1.2);
                            applyMomentumShift(defTeam, 2.5);
                            applyMomentumShift(attTeam, -2);
                        } else {
                            // Kaçırılan (auta giden) penaltıda kalecinin bir katkısı yok, reyting almaz
                            adjustRating(penResult.taker.id, -0.7);
                            applyMomentumShift(attTeam, -2.5);
                            applyMomentumShift(defTeam, 1.5);
                        }
                    }
                    hideActionOverlay();
                    if (sessionId === matchSessionId) eventOverlayActive = false;
                    updateStatUI();
                    return;
                }

                // Korner ihtimali - "Korner Kullanma" ve kafa vuruşu iyi bir oyuncunun bulunması
                // buradan gol üretebilir. Golse asist AÇIKÇA korner asisti olarak işaretlenir.
                if (Math.random() < 0.08) {
                    att.corners = (att.corners || 0) + 1;
                    const cornerResult = await playCornerSequence(attTeam, defTeam);
                    if (sessionId !== matchSessionId) return;
                    if (cornerResult.scored) {
                        att.shots++; att.sot++;
                        att.xg += cornerResult.xg != null ? cornerResult.xg : 0.12;      /* [xg] kafa gol olasiligi */ // kafa golü xG ortalaması düşük ama gerçekleşti
                        att.goals++;
                        document.getElementById(isHomeAtt ? 'score-home' : 'score-away').innerText = att.goals;
                        addHighlight(attTeam, `⚽ ${cornerResult.scorer.name} (Korner Asisti: ${cornerResult.taker.name})`);
                        recordTournamentGoal(cornerResult.scorer, cornerResult.taker, attTeam);
                        bumpPlayerStat(cornerResult.scorer.id, 'shots');
                        bumpPlayerStat(cornerResult.scorer.id, 'sot');
                        bumpPlayerStat(cornerResult.scorer.id, 'goals');
                        bumpPlayerStat(cornerResult.taker.id, 'assists');
                        adjustRating(cornerResult.scorer.id, 1.1);
                        adjustRating(cornerResult.taker.id, 0.55);
                        if (cornerResult.gk) adjustRating(cornerResult.gk.id, -0.4);
                        applyMomentumShift(attTeam, 2.5);
                        applyMomentumShift(defTeam, -2.5);
                        await showGoalEffect(cornerResult.scorer.name, attTeam.name);
                        if (sessionId !== matchSessionId) return;
                    } else if (cornerResult.scorer) {
                        att.shots++; att.xg += cornerResult.xg || 0;      /* [xg] kacan kafa da takim sutu */
                        addHighlight(attTeam, `🚩 Korner Tehlikesi - ${cornerResult.scorer.name}'in kafa vuruşu dışarı gitti`, 'miss');
                        bumpPlayerStat(cornerResult.scorer.id, 'shots');
                    }
                    hideActionOverlay();
                    if (sessionId === matchSessionId) eventOverlayActive = false;
                    updateStatUI();
                    return;
                }

                att.shots++;
                let gkPwr = def.gk ? getOverall(def.gk) : 50;
                // İsabet ihtimali: şut kalitesi + bitiricilik + DENGE (baskı altında ayakta kalıp
                // temiz bir vuruş yapabilme) etkiler, ama abartmayız.
                let onTargetChance = Math.max(0.25, Math.min(0.8, 0.42 + base_xg * 0.5 + ((attacker.fin || 50) - 50) / 350 + ((attacker.bal || 50) - 50) / 500));

                att.xg += onTargetChance * Math.max(0.04, Math.min(0.88, base_xg + ((attacker.fin || 50) - 50) / 420 - ((gkPwr - 50) / 380)));      /* [xg] sut oncesi */
                if (Math.random() < onTargetChance) {
                    att.sot++;
                    bumpPlayerStat(attacker.id, 'shots');
                    bumpPlayerStat(attacker.id, 'sot');
                    // Efektif xG: temel şut kalitesi + bitiricilik bonusu - kaleci kalitesi cezası
                    let finishBonus = ((attacker.fin || 50) - 50) / 420;
                    let keeperPenalty = ((gkPwr - 50) / 380);
                    let effectiveXG = Math.max(0.04, Math.min(0.88, base_xg + finishBonus - keeperPenalty));
                    /* [xg] xG sut oncesi eklendi */

                    // GOL KARARI: xG'ye orantılı bir olasılık zarı - yüksek xG'de bile gol garanti değil
                    let isGoal = Math.random() < effectiveXG;

                    if (isGoal) {
                        let triggerVar = Math.random() < 0.14;
                        let varOutcome = null;
                        if (triggerVar) varOutcome = await playVarReview('goal');
                        if (sessionId !== matchSessionId) return;

                        if (varOutcome === 'cancelled') {
                            addTicker(getCommentary('varCancel', { player: attacker.name, team: attTeam.name }));
                            addHighlight(attTeam, `İptal Edilen Gol (VAR) - ${attacker.name}`);
                            adjustRating(attacker.id, -0.2);
                            applyMomentumShift(attTeam, -2.5);
                            applyMomentumShift(defTeam, 2);
                        } else {
                            att.goals++;
                            document.getElementById(isHomeAtt ? 'score-home' : 'score-away').innerText = att.goals;
                            let assistPlayer = getAssistCandidate(attTeam, attacker.id);
                            // Vizyon: asist verecek oyuncunun görüş/yaratıcılık düzeyi ne kadar yüksekse,
                            // öldürücü pası isabetli verme ihtimali o kadar artar.
                            let assistChance = assistPlayer ? Math.max(0.25, Math.min(0.85, 0.45 + ((assistPlayer.vis || 50) - 50) / 150)) : 0;
                            let hasAssist = assistPlayer && Math.random() < assistChance;
                            addTicker(getCommentary('goal', { player: attacker.name, team: attTeam.name }));
                            addHighlight(attTeam, `⚽ ${attacker.name}${hasAssist ? ' (Asist: ' + assistPlayer.name + ')' : ''}`);
                            recordTournamentGoal(attacker, hasAssist ? assistPlayer : null, attTeam);
                            bumpPlayerStat(attacker.id, 'goals');
                            if (hasAssist) bumpPlayerStat(assistPlayer.id, 'assists');
                            // Reytingler artık gol/asist gibi büyük anlarda GÖZLE GÖRÜLÜR şekilde sıçrıyor.
                            adjustRating(attacker.id, 1.1);
                            if (hasAssist) adjustRating(assistPlayer.id, 0.55);
                            if (def.gk) adjustRating(def.gk.id, -0.4);
                            // Karar sonrası geçici moral etkisi: golü atan takım 5-10 dakika daha güçlü,
                            // gol yiyen takım aynı süre boyunca hafif düşük performans gösterir.
                            applyMomentumShift(attTeam, 2.5);
                            applyMomentumShift(defTeam, -2.5);
                            await showGoalEffect(attacker.name, attTeam.name);
                            if (sessionId !== matchSessionId) return;
                        }
                    } else {
                        // Yüksek xG'li şut bile kalecide kalabilir - şık bir kurtarış anlatımı
                        playSaveThud();
                        if (def.gk) bumpPlayerStat(def.gk.id, 'saves');
                        await playOutcomeReveal('🧤', 'KALECİ KURTARDI!', `${def.gk ? def.gk.name : 'Kaleci'} ${effectiveXG > 0.4 ? 'kritik bir pozisyonda muhteşem bir kurtarış yaptı!' : 'şutu kontrol altına aldı.'}`, 'outcome-neutral', 1900);
                        if (sessionId !== matchSessionId) return;
                        addTicker(getCommentary('shotOnTarget', { player: attacker.name, team: attTeam.name }));
                        if (effectiveXG > 0.4) addHighlight(defTeam, `🧤 Harika Kurtarış - ${def.gk ? def.gk.name : 'Kaleci'} (${attacker.name}'in şutuna)`, 'chance');
                        if (def.gk) adjustRating(def.gk.id, effectiveXG > 0.4 ? 0.55 : 0.25);
                        if (Math.random() < 0.3) att.corners = (att.corners || 0) + 1; // kurtarış kornere çıkabilir
                    }
                } else {
                    /* [xg] xG sut oncesi eklendi */ // hedefi bulmayan şutlar da düşük oranda xG'ye katkı yapar
                    bumpPlayerStat(attacker.id, 'shots');
                    await playOutcomeReveal('🎯', 'TOP DIŞARI ÇIKTI!', `${attacker.name}'in şutu hedefi bulamadı.`, 'outcome-neutral', 1600);
                    if (sessionId !== matchSessionId) return;
                    addTicker(getCommentary('shotOffTarget', { player: attacker.name, team: attTeam.name }));
                    adjustRating(attacker.id, -0.05);
                    if (Math.random() < 0.4) att.corners = (att.corners || 0) + 1; // auta giden şut kornerle sonuçlanabilir
                }
                hideActionOverlay();
                if (sessionId === matchSessionId) eventOverlayActive = false;
            }
        } else if (r > 0.95) {
            let isHomeCard = Math.random() > 0.5;
            let cardTeam = isHomeCard ? matchData.h : matchData.a;
            let cardPlayer = pickFoulCommitter(cardTeam);
            if (!cardPlayer) {
                addTicker(`Orta sahada sert bir mücadele yaşanıyor ama hakem oyunu durdurmuyor.`);
                updateStatUI();
                return;
            }
            let cardTeamStats = isHomeCard ? matchData.hStats : matchData.aStats;
            cardTeamStats.fouls = (cardTeamStats.fouls || 0) + 1;
            let tendency = getFoulTendency(cardPlayer) / 100; // 0..1 arası agresiflik

            // Faul ne kadar agresif bir oyuncudan geliyorsa, VAR'a gidip ciddiye alınma ihtimali o kadar artar
            let seriousChance = 0.045 + tendency * 0.14; // kalibrasyon: eski değer ikinci sarı kart birikimiyle birleşince gerçekçi olmayan (~0.75/maç) kırmızı kart oranı üretiyordu

            if (Math.random() < seriousChance) {
                // SERT MÜDAHALE — VAR kırmızı kart incelemesi (kırmızı ihtimali oyuncunun faul eğilimiyle orantılı)
                eventOverlayActive = true;
                showActionOverlay('🚨', 'SERT MÜDAHALE!', `${cardTeam.name} formasındaki ${cardPlayer.name} sert bir müdahalede bulundu...`, '', cardTeam);
                await overlayWait(1900);
                if (sessionId !== matchSessionId) return;
                let cardOutcome = await playVarReview('card', tendency);
                if (sessionId !== matchSessionId) return;
                if (cardOutcome === 'red') {
                    addTicker(getCommentary('redCard', { player: cardPlayer.name, team: cardTeam.name }));
                    sendOffPlayer(cardPlayer, cardTeam, 'VAR İncelemesi Sonrası Kırmızı Kart');
                } else if (cardOutcome === 'yellow') {
                    await giveYellowCard(cardPlayer, cardTeam);
                    if (sessionId !== matchSessionId) return;
                } else {
                    addTicker(`VAR incelemesi sonrası hakem faul vermedi, oyun devam ediyor.`);
                }
                hideActionOverlay();
                if (sessionId === matchSessionId) eventOverlayActive = false;
            } else {
                await giveYellowCard(cardPlayer, cardTeam);
                if (sessionId !== matchSessionId) return;
            }
        } else {
            let generalTeam = Math.random() > 0.5 ? matchData.h : matchData.a;
            if (Math.random() < 0.16) {
                // Kartsız, sıradan bir faul - istatistiklere yansır ama oyun akışını kesmez
                let foulTeamStats = (generalTeam === matchData.h) ? matchData.hStats : matchData.aStats;
                foulTeamStats.fouls = (foulTeamStats.fouls || 0) + 1;
                let foulPlayer = pickFoulCommitter(generalTeam);

                // Faul bazen TEHLİKELİ bir bölgede oluyor - bu durumda faulü YİYEN takım doğrudan
                // frikik kullanır. "Duran Top (Frikik)" özelliği burada devreye giriyor.
                if (Math.random() < 0.22) {
                    const fkTeam = generalTeam === matchData.h ? matchData.a : matchData.h;
                    const fkOpponent = generalTeam;
                    eventOverlayActive = true;
                    addTicker(foulPlayer
                        ? `Hakem, ${foulPlayer.name}'in (<strong>${generalTeam.name}</strong>) müdahalesi sonrası tehlikeli bölgede faul veriyor - frikik!`
                        : `<strong>${generalTeam.name}</strong> tehlikeli bölgede faul yapıyor - frikik!`);
                    const fkResult = await playFreeKickSequence(fkTeam, fkOpponent);
                    if (sessionId !== matchSessionId) return;

                    let fkTeamStats = fkTeam === matchData.h ? matchData.hStats : matchData.aStats;
                    fkTeamStats.shots++; fkTeamStats.xg += fkResult.xg || 0;      /* [xg] frikik sut oncesi */
                    bumpPlayerStat(fkResult.taker.id, 'shots');
                    if (fkResult.scored) {
                        fkTeamStats.sot++;
                        /* [xg] frikik xG sut oncesi eklendi */ // gerçek frikik golü ortalama xG'si düşüktür
                        fkTeamStats.goals++;
                        document.getElementById(fkTeam === matchData.h ? 'score-home' : 'score-away').innerText = fkTeamStats.goals;
                        addHighlight(fkTeam, `⚽ ${fkResult.taker.name} (Frikik)`);
                        recordTournamentGoal(fkResult.taker, null, fkTeam);
                        bumpPlayerStat(fkResult.taker.id, 'sot');
                        bumpPlayerStat(fkResult.taker.id, 'goals');
                        adjustRating(fkResult.taker.id, 1.2);
                        if (fkResult.gk) adjustRating(fkResult.gk.id, -0.4);
                        applyMomentumShift(fkTeam, 2.5);
                        applyMomentumShift(fkOpponent, -2.5);
                        await showGoalEffect(fkResult.taker.name, fkTeam.name);
                        if (sessionId !== matchSessionId) return;
                    } else {
                        if (fkResult.onTarget) {
                            bumpPlayerStat(fkResult.taker.id, 'sot');
                            if (fkResult.gk) { bumpPlayerStat(fkResult.gk.id, 'saves'); adjustRating(fkResult.gk.id, 0.3); }
                        }
                        adjustRating(fkResult.taker.id, -0.05);
                    }
                    hideActionOverlay();
                    if (sessionId === matchSessionId) eventOverlayActive = false;
                    updateStatUI();
                    return;
                }

                addTicker(foulPlayer ? `Hakem, ${foulPlayer.name}'in (<strong>${generalTeam.name}</strong>) müdahalesi sonrası faul veriyor.` : `<strong>${generalTeam.name}</strong> orta sahada faul yapıyor.`);
            } else {
                addTicker(`<strong>${generalTeam.name}</strong> oyunu kendi sahasında paslaşarak olgunlaştırmaya çalışıyor.`);
            }
        }
        
        updateStatUI();
    }

    function updateStatUI() {
        document.getElementById('stat-pos-home').innerText = `%${matchData.hStats.pos}`;
        document.getElementById('stat-pos-away').innerText = `%${matchData.aStats.pos}`;
        document.getElementById('bar-pos-home').style.width = `${matchData.hStats.pos}%`;
        document.getElementById('bar-pos-away').style.width = `${matchData.aStats.pos}%`;
        
        document.getElementById('stat-xg-home').innerText = matchData.hStats.xg.toFixed(2);
        document.getElementById('stat-xg-away').innerText = matchData.aStats.xg.toFixed(2);
        document.getElementById('stat-shots-home').innerText = matchData.hStats.shots;
        document.getElementById('stat-shots-away').innerText = matchData.aStats.shots;
        document.getElementById('stat-sot-home').innerText = matchData.hStats.sot;
        document.getElementById('stat-sot-away').innerText = matchData.aStats.sot;
        document.getElementById('stat-pass-home').innerText = matchData.hStats.pass;
        document.getElementById('stat-pass-away').innerText = matchData.aStats.pass;
        document.getElementById('stat-corners-home').innerText = matchData.hStats.corners || 0;
        document.getElementById('stat-corners-away').innerText = matchData.aStats.corners || 0;
        document.getElementById('stat-offside-home').innerText = matchData.hStats.offsides || 0;
        document.getElementById('stat-offside-away').innerText = matchData.aStats.offsides || 0;
        document.getElementById('stat-fouls-home').innerText = matchData.hStats.fouls || 0;
        document.getElementById('stat-fouls-away').innerText = matchData.aStats.fouls || 0;
    }

    let playerSortKey = null;
    let playerSortDir = 1;

    function sortPlayerTable(key) {
        if (playerSortKey === key) { playerSortDir *= -1; } else { playerSortKey = key; playerSortDir = 1; }
        renderPlayerTable();
    }

    function populateTableHeaderTooltips() {
        document.querySelectorAll('#players-table-head th[data-key]').forEach(th => {
            const key = th.dataset.key;
            const desc = statDescriptions[key];
            if (desc && !th.querySelector('.stat-info-icon')) {
                th.innerHTML = th.innerHTML + statTooltip(key);
            }
        });
    }

    function renderPlayerTable() {
        populateTableHeaderTooltips();
        const search = document.getElementById('player-search').value.toLowerCase();
        const posFilter = document.getElementById('player-pos-filter') ? document.getElementById('player-pos-filter').value : '';
        let list = playerDatabase.filter(p => {
            if (search && !p.name.toLowerCase().includes(search)) return false;
            if (posFilter && p.pos !== posFilter) return false;
            return true;
        });

        if (playerSortKey) {
            list = list.slice().sort((a, b) => {
                let va, vb;
                if (playerSortKey === 'ovr') { va = getOverall(a); vb = getOverall(b); }
                else if (playerSortKey === 'agg') { va = getFoulTendency(a); vb = getFoulTendency(b); }
                else if (playerSortKey === 'name' || playerSortKey === 'pos') { va = a[playerSortKey] || ''; vb = b[playerSortKey] || ''; }
                else { va = a[playerSortKey] !== undefined ? a[playerSortKey] : -1; vb = b[playerSortKey] !== undefined ? b[playerSortKey] : -1; }
                if (typeof va === 'string') return va.localeCompare(vb) * playerSortDir;
                return (va - vb) * playerSortDir;
            });
        }

        document.querySelectorAll('#players-table-head th').forEach(th => th.classList.remove('sorted-asc', 'sorted-desc'));
        if (playerSortKey) {
            const keyIdx = ['name','pos','ovr','pac','str','sta','dri','pas','lon','fin','sho','hea','tac','mar','posi','pen','fk','cor','vis','bal','agg','lead'].indexOf(playerSortKey);
            const ths = document.querySelectorAll('#players-table-head th');
            if (ths[keyIdx]) ths[keyIdx].classList.add(playerSortDir === 1 ? 'sorted-asc' : 'sorted-desc');
        }

        let html = '';
        list.forEach(p => {
            let stats = '';
            if(p.pos === 'KL') {
                stats = `<td colspan="17" style="color:var(--warning)">[Kaleci Refleksleri] Ref:${p.gk_ref} | Uçm:${p.gk_div} | Yer:${p.gk_pos} | Dağ:${p.gk_kic} | 1v1:${p.gk_1v1}</td>`;
            } else {
                stats = `<td>${p.pac}</td><td>${p.str}</td><td>${p.sta}</td><td>${p.dri}</td><td>${p.pas}</td><td>${p.lon}</td><td>${p.fin}</td><td>${p.sho}</td><td>${p.hea}</td><td>${p.tac}</td><td>${p.mar}</td><td>${p.posi}</td><td>${p.pen}</td><td>${p.fk}</td><td>${p.cor}</td><td>${p.vis}</td><td>${p.bal}</td>`;
            }
            html += `<tr onclick="openPlayerEdit(${p.id})">
                <td><strong>${p.name}</strong></td>
                <td><span class="pos-badge ${p.pos}">${p.pos}</span></td>
                <td style="color:var(--primary); font-weight:700; font-family:'Rajdhani'; font-size:1.15rem;">${getOverall(p)}</td>
                ${stats}
                <td style="color:var(--danger); font-weight:700;">${getFoulTendency(p)}</td>
                <td style="color:var(--gold); font-weight:700;">${getLeadership(p)}</td>
            </tr>`;
        });
        document.getElementById('players-tbody').innerHTML = html;
        document.getElementById('player-count').innerText = list.length;
    }

    function openPlayerEdit(id) {
        const p = playerDatabase.find(x => x.id === id);
        document.getElementById('edit-id').value = p.id;
        document.getElementById('edit-pos-val').value = p.pos;
        document.getElementById('edit-title').innerText = p.name;
        document.getElementById('edit-pos-label').innerText = p.pos;
        document.getElementById('edit-live-ovr').value = getOverall(p);
        
        // Yeşil vurgu SADECE o mevki için gerçekten "birincil" (önemli) özelliklerde gösterilir.
        // posWeights artık her özelliğe küçük bir taban ağırlık verdiği için (hiçbiri "sıfır etki"
        // olmasın diye), oradan kontrol etmek artık HER özelliği vurgulamış olurdu - bu yüzden
        // outfield oyuncularda asıl birincil ağırlık tablosuna (primaryWeights) bakıyoruz.
        // Kaleciler için taban ağırlık sistemi uygulanmadığından posWeights['KL'] zaten sadece
        // birincil özellikleri içerir.
        const weights = p.pos === 'KL' ? posWeights['KL'] : (primaryWeights[p.pos] || {});
        let inputsHtml = '';
        let keysToUse = p.pos === 'KL' ? gkKeys : outKeys;
        let namesToUse = p.pos === 'KL' ? gkNames : outNames;

        keysToUse.forEach((k, i) => {
            let isHighlight = weights[k] ? 'highlight-green' : '';
            inputsHtml += `
                <div class="form-group">
                    <label>${namesToUse[i]}${statTooltip(k)}</label>
                    <input type="number" data-key="${k}" class="form-control edit-live-input ${isHighlight}" value="${p[k]}" min="1" max="99">
                </div>
            `;
        });
        inputsHtml += `
            <div class="form-group">
                <label style="color:var(--danger);">⚠️ Faul Eğilimi${statTooltip('agg')}</label>
                <input type="number" data-key="agg" class="form-control edit-live-input" value="${getFoulTendency(p)}" min="1" max="99">
            </div>
            <div class="form-group">
                <label style="color:var(--gold);">👑 Liderlik${statTooltip('lead')}</label>
                <input type="number" data-key="lead" class="form-control edit-live-input" value="${getLeadership(p)}" min="1" max="99">
            </div>
        `;
        document.getElementById('edit-inputs').innerHTML = inputsHtml;
        document.getElementById('edit-modal').style.display = 'flex';
        
        document.querySelectorAll('.edit-live-input').forEach(inp => {
            inp.addEventListener('input', updateLiveOverall);
        });
    }

    function updateLiveOverall() {
        let tempObj = { pos: document.getElementById('edit-pos-val').value, name: document.getElementById('edit-title').innerText };
        document.querySelectorAll('.edit-live-input').forEach(inp => { tempObj[inp.dataset.key] = parseInt(inp.value) || 0; });
        document.getElementById('edit-live-ovr').value = getOverall(tempObj);
    }

    // Overall alanı elle değiştirildiğinde, o pozisyonun ağırlık formülünü TERSİNE çevirip tüm
    // özellikleri aynı oranda ölçekler - böylece oyuncunun "karakteri" (hangi özelliği güçlü/zayıf)
    // korunur, sadece genel seviyesi yükselir ya da düşer. Faul Eğilimi ve Liderlik, OVR hesabının
    // dışında tutulan karakter özellikleri olduğu için bu ölçeklemeden etkilenmez.
    function applyOverallToStats() {
        const pos = document.getElementById('edit-pos-val').value;
        const w = posWeights[pos];
        if (!w) return;
        const targetOvr = Math.max(1, Math.min(99, parseInt(document.getElementById('edit-live-ovr').value) || 50));

        let tempObj = { pos, name: document.getElementById('edit-title').innerText };
        document.querySelectorAll('.edit-live-input').forEach(inp => { tempObj[inp.dataset.key] = parseInt(inp.value) || 1; });
        if (getOverall(tempObj) <= 0) { updateLiveOverall(); return; }
        // formülde sabit terim olduğundan tek çarpan yetmez: oran birkaç adımda (en çok 8) hedefe yaklaştırılır
        const base = {}; document.querySelectorAll('.edit-live-input').forEach(inp => { base[inp.dataset.key] = parseInt(inp.value) || 1; });
        let lo = 0.2, hi = 3, scale = 1;
        for (let it = 0; it < 30; it++) {
            scale = (lo + hi) / 2; const t = { pos, name: tempObj.name };
            Object.keys(base).forEach(k => { t[k] = (k === 'agg' || k === 'lead') ? base[k] : Math.max(1, Math.min(99, Math.round(base[k] * scale))); });
            const o = getOverall(t); if (o === targetOvr) break; if (o < targetOvr) lo = scale; else hi = scale;
        }
        document.querySelectorAll('.edit-live-input').forEach(inp => {
            const key = inp.dataset.key;
            if (key === 'agg' || key === 'lead') return; // karakter özellikleri, OVR hesabına dahil değil
            inp.value = Math.max(1, Math.min(99, Math.round(base[key] * scale)));
        });

        updateLiveOverall();
    }

    function savePlayerEdit() {
        const id = parseInt(document.getElementById('edit-id').value);
        let p = playerDatabase.find(x => x.id === id);
        document.querySelectorAll('.edit-live-input').forEach(inp => { p[inp.dataset.key] = parseInt(inp.value) || 0; });
        localStorage.setItem('fm_players_v16', JSON.stringify(playerDatabase));
        renderPlayerTable(); 
        closeModal('edit-modal');
    }

    function downloadJSON() {
        let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(playerDatabase, null, 2));
        let downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "fm_pro_veritabani.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    }

    function handleImport(event) {
        let file = event.target.files[0];
        if(!file) return;
        let reader = new FileReader();
        reader.onload = function(e) {
            try {
                let importedData = JSON.parse(e.target.result);
                if(Array.isArray(importedData)) {
                    // Eski/eksik dosyalarda "agg" (Faul Eğilimi) alanı olmayabilir - initApp() ile aynı
                    // göç mantığını burada da uyguluyoruz, aksi halde bu oyuncular kaydedilene kadar
                    // (ör. bir düzenleme yapılana kadar) veritabanında eksik kalırdı.
                    importedData.forEach(p => {
                        if (p.agg === undefined || p.agg === null) {
                            p.agg = defaultAggByPos[p.pos] !== undefined ? defaultAggByPos[p.pos] : 40;
                        }
                        if (p.pen === undefined || p.fk === undefined || p.cor === undefined || p.vis === undefined || p.bal === undefined || p.lead === undefined) {
                            migratePlayerAdvancedStats(p);
                        }
                    });
                    playerDatabase = importedData;
                    localStorage.setItem('fm_players_v16', JSON.stringify(playerDatabase));
                    renderPlayerTable();
                    alert("Veritabanı başarıyla yüklendi ve güncellendi!");
                } else { alert("Geçersiz dosya formatı!"); }
            } catch(err) { alert("JSON dosyası okunurken hata oluştu!"); }
        };
        reader.readAsText(file);
    }

    let tourneyActive = false; let tTeams = []; let tFixtures = []; let tCurrentMatchIdx = 0;
    let tourneyPlayerStats = {}; // id -> {name, team, goals, assists}
    let tourneyMOTMCounts = {}; // id -> {name, team, count}
    let pendingTourneyTeams = null; // fikstür onaylanmadan önce bekleyen takım listesi

    // Format kartına tıklanınca görsel seçimi günceller ve gizli <select>'i senkron tutar - eski
    // JS akışının tamamı (generateTourneySlots vb.) hâlâ o select'in value'sunu okuyor.
    function selectTourneyFormat(size) {
        document.getElementById('tourney-size').value = size;
        document.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));
        const card = document.getElementById(`format-card-${size}`);
        if (card) card.classList.add('selected');
        generateTourneySlots();
    }

    function generateTourneySlots() {
        const size = parseInt(document.getElementById('tourney-size').value);
        let options = savedTeams.map((t, i) => `<option value="${i}">${t.name}</option>`).join('');
        if(savedTeams.length < size) {
            document.getElementById('tourney-team-slots').innerHTML = `<p style="color:var(--danger)">Lütfen önce en az ${size} takım kurun!</p>`;
            return;
        }
        let html = '';
        for(let i=0; i<size; i++) html += `<div class="form-group"><label>${i+1}. Turnuva Takımı</label><select id="tt-slot-${i}" class="form-control" onchange="onTourneySlotChange(${i})">${options}</select></div>`;
        document.getElementById('tourney-team-slots').innerHTML = html;
        // Her slota baştan FARKLI bir takım atanır - aksi halde tüm kutular ilk takımı seçili gösterir
        // ve kullanıcı elle değiştirmediği slotlar aynı takım nesnesine referans vererek birbirinin
        // üzerine yazar (isim/renk kaydının "kayboluyormuş" gibi görünmesinin asıl sebebi buydu).
        for(let i=0; i<size; i++) {
            document.getElementById(`tt-slot-${i}`).value = i % savedTeams.length;
        }
    }

    // Bir slotta takım değiştirildiğinde, aynı takım başka bir slotta zaten seçiliyse
    // çakışmayı otomatik giderir (o slotu boşta kalan başka bir takıma kaydırır) ve uyarır.
    function onTourneySlotChange(changedIdx) {
        const size = parseInt(document.getElementById('tourney-size').value);
        const changedSel = document.getElementById(`tt-slot-${changedIdx}`);
        if (!changedSel) return;
        const newVal = changedSel.value;
        for (let i = 0; i < size; i++) {
            if (i === changedIdx) continue;
            const otherSel = document.getElementById(`tt-slot-${i}`);
            if (otherSel && otherSel.value === newVal) {
                showAlert('tourney-form-alert', `Bu takım zaten ${i+1}. slotta seçiliydi, o slot otomatik olarak başka bir takıma kaydırıldı.`);
                const usedVals = new Set();
                for (let j = 0; j < size; j++) {
                    const s = document.getElementById(`tt-slot-${j}`);
                    if (s) usedVals.add(s.value);
                }
                for (let k = 0; k < savedTeams.length; k++) {
                    if (!usedVals.has(String(k))) { otherSel.value = k; break; }
                }
                break;
            }
        }
    }

    const managerOptions = [
        { v: 90, label: 'Pep Guardiola (90)' },
        { v: 84, label: 'Hansi Flick (84)' },
        { v: 78, label: 'Okan Buruk (78)' },
        { v: 60, label: 'Nuri Şahin (60)' },
        { v: 64, label: 'Volkan Demirel (64)' }
    ];
    const stadiumOptions = [
        { v: 100, label: 'Santiago Bernabéu (100)' },
        { v: 90, label: 'Signal Iduna Park (90)' },
        { v: 75, label: 'TÜPRAŞ Stadyumu (75)' }
    ];

    function openTourneySquadEditor() {
        const size = parseInt(document.getElementById('tourney-size').value);
        let html = '';
        let slotMap = []; // slot index i -> tIdx
        for(let i=0; i<size; i++) {
            let sel = document.getElementById(`tt-slot-${i}`);
            let tIdx = sel ? parseInt(sel.value) : 0;
            let team = savedTeams[tIdx];
            if(!team) continue;
            slotMap.push({ i, tIdx });

            html += `<div class="panel" id="tt-panel-${i}" style="margin-bottom:15px; border-left:4px solid ${team.color};">
                <div class="responsive-grid-3" style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:14px; margin-bottom:16px;">
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:0.75rem;">Takım Adı</label>
                        <input type="text" class="form-control" value="${team.name}" style="padding:10px; font-size:0.9rem;" oninput="updateTourneyTeamField(${i}, ${tIdx}, 'name', this.value)">
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:0.75rem;">Teknik Direktör</label>
                        <select class="form-control" style="padding:10px; font-size:0.85rem;" onchange="updateTourneyTeamField(${i}, ${tIdx}, 'manager', this.value)">
                            ${managerOptions.map(o => `<option value="${o.v}" ${parseInt(team.manager) === o.v ? 'selected' : ''}>${o.label}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0;">
                        <label style="font-size:0.75rem;">Stadyum</label>
                        <select class="form-control" style="padding:10px; font-size:0.85rem;" onchange="updateTourneyTeamField(${i}, ${tIdx}, 'stadium', this.value)">
                            ${stadiumOptions.map(o => `<option value="${o.v}" ${parseInt(team.stadium) === o.v ? 'selected' : ''}>${o.label}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom:16px;">
                    <label style="font-size:0.75rem;">Forma Rengi</label>
                    <div class="kit-color-picker" style="padding:10px 14px; gap:14px;">
                        <div class="kit-preview">
                            <div class="kit-jersey" id="tt-kit-jersey-${i}" style="width:38px; height:38px; background:${team.color};"></div>
                            <span class="kit-hex" id="tt-kit-hex-${i}">${(team.color || '#00ffcc').toUpperCase()}</span>
                        </div>
                        <div class="kit-swatch-grid" id="tt-color-swatches-${i}"></div>
                        <label class="kit-swatch kit-swatch-custom" title="Özel Renk Seç">
                            <input type="color" value="${team.color || '#00ffcc'}" oninput="selectTourneyTeamColor(${i}, ${tIdx}, this.value)">
                            <span><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-palette"/></svg></span>
                        </label>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom:16px;">
                    <label style="font-size:0.75rem;">Takım Logosu</label>
                    <div class="kit-color-picker" style="padding:10px 14px; gap:14px;">
                        <div class="kit-preview">
                            <div id="tt-logo-preview-${i}">${renderTeamCrestHTML(team, 38)}</div>
                        </div>
                        <div class="logo-swatch-grid" id="tt-logo-swatches-${i}"></div>
                    </div>
                </div>

                <h3 id="tt-title-${i}" style="font-size:1.2rem; color:${team.color};">${team.name} İlk 11 Kadrosu</h3>
                <div class="responsive-grid-2" style="display:grid; grid-template-columns: repeat(2, 1fr); gap:10px; margin-top:10px;">`;
            
            team.squad.forEach((playerId, pIdx) => {
                let pObj = getPlayerFromId(playerId);
                let matching = playerDatabase.filter(x => x.pos === posNamesList[pIdx]);
                html += `<div class="form-group" style="margin-bottom:8px;">
                    <label style="font-size:0.75rem;">${posNamesList[pIdx]}</label>
                    <select class="form-control tourney-player-select" data-team-idx="${tIdx}" data-slot-idx="${pIdx}" style="padding:10px; font-size:0.85rem;">
                        ${matching.map(m => `<option value="${m.id}" ${m.id === playerId ? 'selected' : ''}>${m.name} (${getOverall(m)})</option>`).join('')}
                    </select>
                </div>`;
            });
            html += `</div>

                <div style="margin-top:16px;">
                    <h4 style="font-size:0.85rem; color:var(--gold); margin-bottom:4px;">👑 Takım Rolleri</h4>
                    <div class="responsive-grid-4" id="tt-roles-${i}" style="display:grid; grid-template-columns: repeat(4, 1fr); gap:10px;"></div>
                </div>
            </div>`;
        }
        document.getElementById('tourney-squad-container').innerHTML = html;
        
        document.querySelectorAll('.tourney-player-select').forEach(sel => {
            sel.addEventListener('change', (e) => {
                let tIdx = parseInt(e.target.dataset.teamIdx);
                let slotIdx = parseInt(e.target.dataset.slotIdx);
                let pId = parseInt(e.target.value);
                const squad = savedTeams[tIdx].squad;
                if (squad.some((id, idx) => idx !== slotIdx && id === pId)) {
                    showAlert('tourney-form-alert', 'Bu futbolcu zaten aynı takımda başka bir pozisyonda seçili! Lütfen farklı bir oyuncu seçin.');
                    e.target.value = squad[slotIdx]; // seçimi eski haline geri al
                    return;
                }
                squad[slotIdx] = pId;
                localStorage.setItem('fm_teams_v16', JSON.stringify(savedTeams));
                const rowI = e.target.closest('.panel').id.replace('tt-panel-', '');
                renderTourneyRoleDropdowns(parseInt(rowI), tIdx);
            });
        });

        slotMap.forEach(({ i, tIdx }) => {
            renderTourneyColorSwatches(i, tIdx, savedTeams[tIdx].color);
            renderTourneyLogoSwatches(i, tIdx, savedTeams[tIdx].logo);
            renderTourneyRoleDropdowns(i, tIdx);
        });

        document.getElementById('tourney-squad-modal').style.display = 'flex';
    }

    // Kaptan / Penaltı / Frikik / Korner kullanıcısı dropdown'larını, o an takımın 11 oyuncusuyla
    // doldurur. Önceki seçim hâlâ kadroda ise korunur.
    function renderTourneyRoleDropdowns(i, tIdx) {
        const container = document.getElementById(`tt-roles-${i}`);
        if (!container) return;
        const team = savedTeams[tIdx];
        const roleDefs = [
            { field: 'captainId', label: 'Kaptan', statLabel: 'Liderlik', getValue: p => getLeadership(p) },
            { field: 'penaltyTakerId', label: '🎯 Penaltı', statLabel: 'Penaltı', getValue: p => p.pen },
            { field: 'freeKickTakerId', label: '🎯 Frikik', statLabel: 'Frikik', getValue: p => p.fk },
            { field: 'cornerTakerId', label: '🚩 Korner', statLabel: 'Korner', getValue: p => p.cor }
        ];
        container.innerHTML = roleDefs.map(rd => {
            // Her rol için oyuncular O GÖREVE ait özelliğe göre en iyiden en kötüye sıralanır ve
            // isim yanında değeri gösterilir (örn. "Bellingham (MOO) — Penaltı: 67").
            const players = team.squad.map(getPlayerFromId).filter(Boolean);
            players.sort((a, b) => (rd.getValue(b) || 0) - (rd.getValue(a) || 0));
            const optionsHtml = players.map(p => {
                const val = rd.getValue(p);
                return `<option value="${p.id}" ${team[rd.field] === p.id ? 'selected' : ''}>${p.name} (${p.pos}) — ${rd.statLabel}: ${val !== undefined && val !== null ? val : '-'}</option>`;
            }).join('');
            return `
            <div class="form-group" style="margin-bottom:0;">
                <label style="font-size:0.7rem;">${rd.label}</label>
                <select class="form-control" style="padding:8px; font-size:0.8rem;" onchange="updateTourneyTeamRole(${tIdx}, '${rd.field}', this.value)">
                    ${optionsHtml}
                </select>
            </div>`;
        }).join('');
    }

    function updateTourneyTeamRole(tIdx, field, value) {
        savedTeams[tIdx][field] = parseInt(value) || null;
        localStorage.setItem('fm_teams_v16', JSON.stringify(savedTeams));
    }

    function renderTourneyColorSwatches(i, tIdx, currentColor) {
        const grid = document.getElementById(`tt-color-swatches-${i}`);
        if (!grid) return;
        grid.innerHTML = presetTeamColors.map(c =>
            `<div class="kit-swatch ${ (currentColor||'').toLowerCase() === c.toLowerCase() ? 'selected' : '' }" style="background:${c};" onclick="selectTourneyTeamColor(${i}, ${tIdx}, '${c}')" title="${c}"></div>`
        ).join('');
    }

    function selectTourneyTeamColor(i, tIdx, hex) {
        savedTeams[tIdx].color = hex;
        localStorage.setItem('fm_teams_v16', JSON.stringify(savedTeams));

        const jersey = document.getElementById(`tt-kit-jersey-${i}`);
        if (jersey) jersey.style.background = hex;
        const hexLabel = document.getElementById(`tt-kit-hex-${i}`);
        if (hexLabel) hexLabel.innerText = hex.toUpperCase();
        renderTourneyColorSwatches(i, tIdx, hex);

        const panel = document.getElementById(`tt-panel-${i}`);
        if (panel) panel.style.borderLeftColor = hex;
        const titleEl = document.getElementById(`tt-title-${i}`);
        if (titleEl) titleEl.style.color = hex;
    }

    function updateTourneyTeamField(i, tIdx, field, value) {
        savedTeams[tIdx][field] = (field === 'manager' || field === 'stadium') ? parseInt(value) : value;
        localStorage.setItem('fm_teams_v16', JSON.stringify(savedTeams));
        if (field === 'name') {
            const titleEl = document.getElementById(`tt-title-${i}`);
            if (titleEl) titleEl.innerText = value + ' İlk 11 Kadrosu';
            const preview = document.getElementById(`tt-logo-preview-${i}`);
            if (preview) preview.innerHTML = renderTeamCrestHTML(savedTeams[tIdx], 38);
        }
    }

    function renderTourneyLogoSwatches(i, tIdx, currentLogo) {
        const grid = document.getElementById(`tt-logo-swatches-${i}`);
        if (!grid) return;
        const shape = currentLogo || 'shield';
        grid.innerHTML = crestOrder.map(s =>
            `<div class="logo-swatch ${s === shape ? 'selected' : ''}" style="clip-path:${crestTemplates[s]}; -webkit-clip-path:${crestTemplates[s]};" onclick="selectTourneyTeamLogo(${i}, ${tIdx}, '${s}')" title="${s}"></div>`
        ).join('');
    }

    function selectTourneyTeamLogo(i, tIdx, shape) {
        savedTeams[tIdx].logo = shape;
        localStorage.setItem('fm_teams_v16', JSON.stringify(savedTeams));
        const preview = document.getElementById(`tt-logo-preview-${i}`);
        if (preview) preview.innerHTML = renderTeamCrestHTML(savedTeams[tIdx], 38);
        renderTourneyLogoSwatches(i, tIdx, shape);
    }

    // Standart "circle method" round-robin: n takımı, her biri diğerleriyle
    // birer kez oynayacak şekilde haftalara (round) böler. Rövanş (2. devre)
    // için aynı haftalar ev sahibi/deplasman ters çevrilerek eklenir.
    function generateRoundRobinWeeks(teams) {
        let list = teams.slice();
        if (list.length % 2 !== 0) list.push(null); // tek sayıda takım varsa "bay" ekle
        const n = list.length;
        const totalRounds = n - 1;
        const half = n / 2;
        let legOneWeeks = [];

        for (let r = 0; r < totalRounds; r++) {
            let weekMatches = [];
            for (let i = 0; i < half; i++) {
                let t1 = list[i], t2 = list[n - 1 - i];
                if (t1 && t2) {
                    if (r % 2 === 0) weekMatches.push({ h: t1, a: t2 });
                    else weekMatches.push({ h: t2, a: t1 });
                }
            }
            legOneWeeks.push(weekMatches);
            // ilk takımı sabit tutup diğerlerini bir pozisyon döndür
            const fixed = list[0];
            const rest = list.slice(1);
            rest.unshift(rest.pop());
            list = [fixed, ...rest];
        }

        let legTwoWeeks = legOneWeeks.map(week => week.map(m => ({ h: m.a, a: m.h })));
        return legOneWeeks.concat(legTwoWeeks);
    }

    function startTournament() {
        const size = parseInt(document.getElementById('tourney-size').value);
        let teams = []; let used = new Set();
        for(let i=0; i<size; i++) {
            let sel = document.getElementById(`tt-slot-${i}`);
            if(!sel) return;
            let tIdx = sel.value;
            if(used.has(tIdx)) { showAlert('tourney-form-alert', 'Hata: Turnuvada aynı takımı birden fazla kez seçemezsiniz!'); return; }
            used.add(tIdx);
            let teamObj = JSON.parse(JSON.stringify(savedTeams[tIdx]));
            teamObj.tId = i; teamObj.p=0; teamObj.w=0; teamObj.d=0; teamObj.l=0; teamObj.gf=0; teamObj.ga=0; teamObj.pl=0; teamObj.matchCount=0; teamObj.form=[];
            teams.push(teamObj);
        }

        const weeks = generateRoundRobinWeeks(teams);
        let fixtures = [];
        weeks.forEach((week, wIdx) => {
            week.forEach(m => fixtures.push({ h: m.h, a: m.a, played: false, hg: 0, ag: 0, week: wIdx + 1 }));
        });

        pendingTourneyTeams = teams;
        tFixtures = fixtures;

        renderFixturePreview();
        document.getElementById('tourney-fixture-modal').style.display = 'flex';
    }

    function renderFixturePreview() {
        const totalWeeks = Math.max(...tFixtures.map(f => f.week));
        let html = '';
        for (let w = 1; w <= totalWeeks; w++) {
            html += `<div class="fixture-week-header">Hafta ${w}</div>`;
            tFixtures.filter(f => f.week === w).forEach(f => {
                html += `<div class="flex-between" style="background:rgba(0,0,0,0.25); padding:10px 14px; border-radius:8px; border:1px solid var(--border); margin-bottom:6px;">
                    <div style="width:42%; text-align:right; font-weight:600; display:flex; align-items:center; justify-content:flex-end; gap:6px; font-size:0.9rem;">${f.h.name} <span style="width:8px; height:8px; border-radius:50%; background:${f.h.color}; display:inline-block;"></span></div>
                    <div style="width:16%; text-align:center; color:var(--text-muted); font-size:0.8rem;">vs</div>
                    <div style="width:42%; text-align:left; font-weight:600; display:flex; align-items:center; gap:6px; font-size:0.9rem;"><span style="width:8px; height:8px; border-radius:50%; background:${f.a.color}; display:inline-block;"></span> ${f.a.name}</div>
                </div>`;
            });
        }
        document.getElementById('tourney-fixture-preview').innerHTML = html;
    }

    function confirmTournamentStart() {
        tTeams = pendingTourneyTeams;
        pendingTourneyTeams = null;
        tourneyPlayerStats = {};
        tourneyMOTMCounts = {};
        tourneyActive = true;

        document.getElementById('tourney-fixture-modal').style.display = 'none';
        document.getElementById('tourney-setup').style.display = 'none';
        document.getElementById('tourney-active').style.display = 'block';
        document.getElementById('tourney-hero-badge').innerText = '🔥 Sezon Devam Ediyor';
        document.getElementById('tourney-hero-subtitle').innerText = `${tTeams.length} takım, çift devreli mücadele — kupa kimin olacak?`;
        renderTourney();
    }

    // Puan Durumu / Fikstür / Ödüller sekmeleri arasında geçiş yapar.
    function switchTourneyTab(tabName) {
        document.querySelectorAll('.tourney-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
        document.querySelectorAll('.tourney-tab-panel').forEach(p => p.classList.toggle('active', p.id === `tourney-tab-${tabName}`));
    }

    function ensureTournamentStat(player, teamObj) {
        if (!tourneyPlayerStats[player.id]) {
            tourneyPlayerStats[player.id] = { name: player.name, team: teamObj.name, goals: 0, assists: 0 };
        }
        return tourneyPlayerStats[player.id];
    }

    function recordTournamentGoal(scorer, assistPlayer, teamObj) {
        if (!matchData.isTournamentMatch || !scorer) return;
        ensureTournamentStat(scorer, teamObj).goals++;
        if (assistPlayer) ensureTournamentStat(assistPlayer, teamObj).assists++;
    }

    function renderTourney() {
        tTeams.sort((a,b) => { if(b.p !== a.p) return b.p - a.p; return (b.gf-b.ga) - (a.gf-a.ga); });
        let sHtml = '';
        tTeams.forEach((t, idx) => {
            const pos = idx + 1;
            const posClass = pos === 1 ? 'pos-1' : pos === 2 ? 'pos-2' : pos === 3 ? 'pos-3' : 'pos-other';
            let formHtml = (t.form || []).slice(-5).map(r =>
                `<span class="form-dot ${r === 'W' ? 'win' : r === 'D' ? 'draw' : 'loss'}">${r}</span>`
            ).join('');
            sHtml += `<tr>
                <td><span class="standings-pos ${posClass}">${pos}</span></td>
                <td><div class="standings-team-cell">${renderTeamCrestHTML(t, 26)}${t.name}</div></td>
                <td>${t.pl}</td><td>${t.w}</td><td>${t.d}</td><td>${t.l}</td><td>${t.gf - t.ga}</td>
                <td style="font-size:1.1rem; font-family:'Rajdhani'; color:var(--gold);"><strong>${t.p}</strong></td>
                <td><div class="form-dots">${formHtml || '<span style="color:var(--text-muted); font-size:0.75rem;">-</span>'}</div></td>
            </tr>`;
        });
        document.getElementById('tourney-standings-body').innerHTML = sHtml;

        // Başlıktaki "lider" şeridi: kim şu an zirvede, kaç puanla
        const leaderStrip = document.getElementById('tourney-leader-strip');
        if (leaderStrip && tTeams.length) {
            const leader = tTeams[0];
            leaderStrip.innerHTML = `👑 Zirvede: ${renderTeamCrestHTML(leader, 22)} <strong style="color:#fff;">${leader.name}</strong> <span style="color:var(--gold);">${leader.p} Puan</span>`;
        }

        const totalWeeks = tFixtures.length ? Math.max(...tFixtures.map(f => f.week)) : 0;
        const nextUnplayedIdx = tFixtures.findIndex(f => !f.played);
        let fHtml = '';
        for (let w = 1; w <= totalWeeks; w++) {
            const weekHasUnplayed = tFixtures.some(f => f.week === w && !f.played);
            fHtml += `<div class="matchday-header">
                <span>📅 Hafta ${w}</span>
                ${weekHasUnplayed ? `<button class="btn btn-info" style="padding:3px 12px; font-size:0.72rem; text-transform:none; letter-spacing:0;" onclick="simulateWeekInstant(${w})">⚡ Bu Haftayı Hızlı Simüle Et</button>` : ''}
            </div>`;
            tFixtures.forEach((f, i) => {
                if (f.week !== w) return;
                let isNext = (i === nextUnplayedIdx);
                let btnStyle = isNext ? "background:var(--primary); color:#050b14; font-weight:bold;" : "";
                let st = f.played ? `<span style="color:var(--text-muted); font-weight:bold; font-family:'Rajdhani'; font-size:1.1rem;">${f.hg} - ${f.ag}</span>` :
                         `<button class="btn" style="padding:5px 14px; font-size:0.85rem; ${btnStyle}" onclick="playTourneyMatch(${i})">Maçı Oyna</button>`;
                fHtml += `<div class="fixture-card-v2 ${isNext ? 'is-next' : ''}">
                    <div class="fixture-team-side home">${f.h.name} ${renderTeamCrestHTML(f.h, 24)}</div>
                    <div style="width:20%; text-align:center;">${st}</div>
                    <div class="fixture-team-side away">${renderTeamCrestHTML(f.a, 24)} ${f.a.name}</div>
                </div>`;
            });
        }
        document.getElementById('tourney-fixtures').innerHTML = fHtml;

        renderTournamentLeaderboards();

        if (nextUnplayedIdx === -1 && tFixtures.length > 0) {
            showChampionCelebration(tTeams[0]);
        }
    }

    function computeMOTM() {
        if (!matchData.ratings || !matchData.h || !matchData.a) return null;
        let best = null;
        [matchData.h, matchData.a].forEach(team => {
            team.squad.forEach(id => {
                const rating = matchData.ratings[id];
                if (rating === undefined) return;
                if (!best || rating > best.rating) {
                    best = { player: getPlayerFromId(id), team, rating };
                }
            });
        });
        return best;
    }

    function recordTourneyMOTM() {
        if (!matchData.isTournamentMatch) return;
        const motm = computeMOTM();
        if (!motm) return;
        const id = motm.player.id;
        if (!tourneyMOTMCounts[id]) tourneyMOTMCounts[id] = { name: motm.player.name, team: motm.team.name, count: 0 };
        tourneyMOTMCounts[id].count++;
    }

    function populateSummaryStatRow(label, homeVal, awayVal) {
        return `<div class="stat-row"><div class="stat-val home">${homeVal}</div><div class="stat-label">${label}</div><div class="stat-val away">${awayVal}</div></div>`;
    }

    // Maç sonucundan otomatik bir "gazete manşeti" üretir - ayrı bir yapay zeka çağrısı değil,
    // skor deseni + güç farkı + Maçın Adamı bilgisine göre birkaç şablondan rastgele seçim yapar.
    function generateHeadline(hTeam, aTeam, hg, ag, motm) {
        const motmName = motm ? motm.player.name : null;
        const hPower = matchData.hStats ? matchData.hStats.power : 50;
        const aPower = matchData.aStats ? matchData.aStats.power : 50;
        const diff = Math.abs(hg - ag);
        const totalGoals = hg + ag;
        const winnerName = hg > ag ? hTeam.name : (ag > hg ? aTeam.name : null);
        const loserName = hg > ag ? aTeam.name : (ag > hg ? hTeam.name : null);
        // "Sürpriz sonuç" sadece ANLAMLI bir güç farkında (en az ~8 puan) tetiklenir - aksi halde
        // neredeyse eşit iki takım arasındaki her sonuç yanlışlıkla "sürpriz" gibi gösterilirdi.
        const UNDERDOG_THRESHOLD = 8;
        const winnerWasUnderdog = (hg > ag && (aPower - hPower) >= UNDERDOG_THRESHOLD) || (ag > hg && (hPower - aPower) >= UNDERDOG_THRESHOLD);

        const pick = arr => arr[Math.floor(Math.random() * arr.length)];

        if (winnerName && winnerWasUnderdog) {
            return pick([
                `Sürpriz Sonuç! ${winnerName}, favori ${loserName} karşısında ${hg}-${ag} kazandı.`,
                `Kimse Beklemiyordu: ${winnerName}, güçlü ${loserName} karşısında ${hg}-${ag} üstünlük sağladı.`,
                `Büyük Şok! ${loserName}, ${winnerName} karşısında ${hg}-${ag} mağlup oldu.`
            ]);
        }
        if (hg === 0 && ag === 0) {
            return pick([
                `Golsüz Beraberlik: ${hTeam.name} ile ${aTeam.name} kalitesiz bir mücadelede 0-0 ayrıldı.`,
                `Sessiz Kalan Kaleler: ${hTeam.name} - ${aTeam.name} maçında ağlar hiç sarsılmadı.`
            ]);
        }
        if (hg === ag) {
            return pick([
                `Puanlar Paylaşıldı: ${hTeam.name} ${hg}-${ag} ${aTeam.name} berabere kaldı.`,
                `Adil Sonuç: ${hTeam.name} ile ${aTeam.name} arasında ${hg}-${ag}'lik golcü bir maç yaşandı.`
            ]);
        }
        if (diff >= 3) {
            return pick([
                `Farklı Galibiyet: ${winnerName}, ${loserName} karşısında ${hg}-${ag} ile sahadan farklı ayrıldı!${motmName ? ` Günün yıldızı: ${motmName}.` : ''}`,
                `Tek Taraflı Maç: ${winnerName}, ${loserName} karşısında ${hg}-${ag}'lik farkla gülüp geçti.`
            ]);
        }
        if (totalGoals >= 5) {
            return pick([
                `Gol Şöleni! ${hTeam.name} ${hg}-${ag} ${aTeam.name} - kalabalık tribünler doyasıya eğlendi.${motmName ? ` ${motmName} sahnedeydi.` : ''}`,
                `Savunmalar Tatildeydi: ${hTeam.name} ${hg}-${ag} ${aTeam.name} maçında toplam ${totalGoals} gol vardı.`
            ]);
        }
        if ((hg > ag && ag === 0) || (ag > hg && hg === 0)) {
            const winnerScore = hg || ag;
            return pick([
                `${winnerName} kalesini gole kapattı, ${loserName} karşısında ${winnerScore}-0 kazandı.`,
                `Temiz Sayfa: ${winnerName}, rakip fileleri hiç sarsmadan ${winnerScore}-0 kazandı.`
            ]);
        }
        return pick([
            `${winnerName}, ${loserName} karşısında kıl payı kazandı: ${hg}-${ag}.${motmName ? ` Kahraman: ${motmName}.` : ''}`,
            `Dar Farkla: ${winnerName}, ${loserName} karşısında ${hg}-${ag} önde bitirdi.`
        ]);
    }

    function showMatchSummary(onContinue) {
        const modal = document.getElementById('match-summary-modal');
        if (!modal || !matchData.h || !matchData.a) return;

        document.getElementById('summary-home-name').innerText = matchData.h.name;
        document.getElementById('summary-away-name').innerText = matchData.a.name;
        document.getElementById('summary-home-score').innerText = matchData.hStats.goals;
        document.getElementById('summary-away-score').innerText = matchData.aStats.goals;

        document.getElementById('summary-stats-rows').innerHTML =
            populateSummaryStatRow('Topa Sahip Olma', `%${matchData.hStats.pos}`, `%${matchData.aStats.pos}`) +
            populateSummaryStatRow('Gol Beklentisi (xG)', matchData.hStats.xg.toFixed(2), matchData.aStats.xg.toFixed(2)) +
            populateSummaryStatRow('Toplam Şut', matchData.hStats.shots, matchData.aStats.shots) +
            populateSummaryStatRow('İsabetli Şut', matchData.hStats.sot, matchData.aStats.sot) +
            populateSummaryStatRow('Korner', matchData.hStats.corners || 0, matchData.aStats.corners || 0) +
            populateSummaryStatRow('Ofsayt', matchData.hStats.offsides || 0, matchData.aStats.offsides || 0) +
            populateSummaryStatRow('Faul', matchData.hStats.fouls || 0, matchData.aStats.fouls || 0);

        const motm = computeMOTM();
        document.getElementById('summary-motm-name').innerText = motm ? motm.player.name : '-';
        document.getElementById('summary-motm-team').innerText = motm ? motm.team.name : '-';
        document.getElementById('summary-motm-rating').innerText = motm ? motm.rating.toFixed(1) : '-';

        document.getElementById('summary-headline-text').innerText =
            generateHeadline(matchData.h, matchData.a, matchData.hStats.goals, matchData.aStats.goals, motm);

        const btn = document.getElementById('summary-continue-btn');
        btn.innerText = onContinue ? 'Fikstüre ve Puan Durumuna Dön' : 'Kapat';
        btn.onclick = () => {
            modal.style.display = 'none';
            if (onContinue) onContinue();
        };

        modal.style.display = 'flex';
    }

    function renderTournamentLeaderboards() {
        const allStats = Object.values(tourneyPlayerStats);
        const topScorers = allStats.filter(s => s.goals > 0).sort((a,b) => b.goals - a.goals).slice(0, 5);
        const topAssists = allStats.filter(s => s.assists > 0).sort((a,b) => b.assists - a.assists).slice(0, 5);

        document.getElementById('tourney-topscorers-body').innerHTML = topScorers.length ? topScorers.map(s =>
            `<tr><td style="text-align:left; font-weight:600;">${s.name}</td><td style="text-align:left; color:var(--text-muted); font-size:0.85rem;">${s.team}</td><td style="font-family:'Rajdhani'; font-weight:700; color:var(--gold);">${s.goals}</td></tr>`
        ).join('') : `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">Henüz gol atılmadı.</td></tr>`;

        document.getElementById('tourney-topassists-body').innerHTML = topAssists.length ? topAssists.map(s =>
            `<tr><td style="text-align:left; font-weight:600;">${s.name}</td><td style="text-align:left; color:var(--text-muted); font-size:0.85rem;">${s.team}</td><td style="font-family:'Rajdhani'; font-weight:700; color:var(--primary);">${s.assists}</td></tr>`
        ).join('') : `<tr><td colspan="3" style="text-align:center; color:var(--text-muted);">Henüz asist yok.</td></tr>`;
    }

    function showChampionCelebration(champion) {
        document.getElementById('champion-name-text').innerText = champion.name;

        const allStats = Object.values(tourneyPlayerStats);
        const topScorer = allStats.filter(s => s.goals > 0).sort((a,b) => b.goals - a.goals)[0];
        const topAssist = allStats.filter(s => s.assists > 0).sort((a,b) => b.assists - a.assists)[0];
        const motmList = Object.values(tourneyMOTMCounts).sort((a,b) => b.count - a.count);
        const seasonMVP = motmList[0];

        document.getElementById('award-topscorer-name').innerText = topScorer ? topScorer.name : '-';
        document.getElementById('award-topscorer-value').innerText = topScorer ? `${topScorer.goals} gol (${topScorer.team})` : '-';

        document.getElementById('award-topassist-name').innerText = topAssist ? topAssist.name : '-';
        document.getElementById('award-topassist-value').innerText = topAssist ? `${topAssist.assists} asist (${topAssist.team})` : '-';

        document.getElementById('award-motm-name').innerText = seasonMVP ? seasonMVP.name : '-';
        document.getElementById('award-motm-value').innerText = seasonMVP ? `${seasonMVP.count} kez MOTM (${seasonMVP.team})` : '-';

        document.getElementById('champion-overlay').classList.add('active');
    }

    // Bir fikstürün sonucunu puan durumuna/forma işler - hem gerçek (canlı izlenen) maçlarda
    // hem de "hızlı simülasyon" akışında ortak kullanılır.
    function resolveFixtureResult(fix, homeGoals, awayGoals) {
        fix.played = true;
        fix.hg = homeGoals;
        fix.ag = awayGoals;

        let hTeam = tTeams.find(t => t.tId === fix.h.tId);
        let aTeam = tTeams.find(t => t.tId === fix.a.tId);

        hTeam.pl++; aTeam.pl++;
        hTeam.gf += fix.hg; hTeam.ga += fix.ag;
        aTeam.gf += fix.ag; aTeam.ga += fix.hg;
        hTeam.form = hTeam.form || []; aTeam.form = aTeam.form || [];

        if(fix.hg > fix.ag) { hTeam.w++; hTeam.p+=3; aTeam.l++; hTeam.form.push('W'); aTeam.form.push('L'); }
        else if(fix.hg < fix.ag) { aTeam.w++; aTeam.p+=3; hTeam.l++; hTeam.form.push('L'); aTeam.form.push('W'); }
        else { hTeam.d++; aTeam.d++; hTeam.p+=1; aTeam.p+=1; hTeam.form.push('D'); aTeam.form.push('D'); }
    }

    function playTourneyMatch(idx) {
        let fix = tFixtures[idx];
        if(fix.played) return;
        tCurrentMatchIdx = idx;
        
        matchData.h = fix.h; 
        matchData.a = fix.a;
        matchData.isTournamentMatch = true;
        matchData.neutralVenue = false; // turnuva fikstürlerinde ev sahibi avantajı her zaman geçerlidir
        
        matchData.h.matchCount = (matchData.h.matchCount || 0) + 1;
        matchData.a.matchCount = (matchData.a.matchCount || 0) + 1;

        setupMatchView();

        window.onTournamentMatchEnd = function(homeGoals, awayGoals) {
            resolveFixtureResult(fix, homeGoals, awayGoals);
            recordTourneyMOTM();

            const returnToTourney = () => {
                showScreen('tournament-screen');
                renderTourney();
            };
            let mBtn = document.getElementById('btn-start-match');
            mBtn.innerText = "Fikstüre ve Puan Durumuna Dön";
            mBtn.onclick = () => {
                mBtn.onclick = startMatch;
                returnToTourney();
            };
            showMatchSummary(returnToTourney);
        };
    }

    // ------- HIZLI SİMÜLASYON (canlı izlemeden anında sonuç) -------
    // Gerçek maç motoruyla aynı olasılık formülleri kullanılır (xG, güç farkı, faul eğilimi vb.)
    // ama animasyon/bekleme olmadan, tek seferde 90+ilave süre dakikası hesaplanır.
    function recordTournamentGoalDirect(scorer, assistPlayer, teamObj) {
        if (!scorer) return;
        ensureTournamentStat(scorer, teamObj).goals++;
        if (assistPlayer) ensureTournamentStat(assistPlayer, teamObj).assists++;
    }

    function simulateInstantMatch(hTeam, aTeam, dryRun, neutralVenue) {
        // ÖNEMLİ: Hızlı Simülasyon matchData'ya hiç dokunmadan çalışır, AMA getRandomAttacker /
        // getAssistCandidate / pickFoulCommitter gibi paylaşılan yardımcı fonksiyonlar oyuncu
        // seçerken hâlâ matchData.sentOff/yellowCounts'u kontrol ediyor. Önceki bir CANLI maçtan
        // kalan bu bilgiler, o maçla hiç ilgisi olmayan bu hızlı simülasyona sızabiliyordu. Bu
        // yüzden fonksiyon süresince ikisini de geçici olarak sıfırlayıp, işlem bitince eski
        // hallerine geri koyuyoruz.
        const savedSentOff = matchData.sentOff;
        const savedYellowCounts = matchData.yellowCounts;
        matchData.sentOff = new Set();
        matchData.yellowCounts = {};
        try {
            return runInstantMatchSimulation(hTeam, aTeam, dryRun, neutralVenue);
        } finally {
            matchData.sentOff = savedSentOff;
            matchData.yellowCounts = savedYellowCounts;
        }
    }

    function runInstantMatchSimulation(hTeam, aTeam, dryRun, neutralVenue) {
        // ÖNEMLİ MİMARİ DÜZELTME: Bu fonksiyon eskiden canlı maç motorundan (simulateMinuteAction)
        // BAĞIMSIZ, daha basit bir hesaplama kullanıyordu - momentum sistemi yoktu, kırmızı kartla
        // adam eksilmiyordu, korner/frikik golü hiç üretilmiyordu. Bu da AYNI iki takım için canlı
        // izlerken ve hızlı simüle ederken FARKLI istatistiksel davranış (örn. farklı topa sahip olma
        // oranı) ortaya çıkmasına yol açıyordu. Artık iki motor da AYNI olasılık formüllerini ve
        // olay yapısını kullanıyor - sadece görsel animasyon/bekleme yok.
        let redCardCountH = 0, redCardCountA = 0;
        let hPower = calcTeamPower(hTeam, true, 0, neutralVenue);
        let aPower = calcTeamPower(aTeam, false, 0, neutralVenue);
        function recalcLocalPowers() {
            hPower = calcTeamPower(hTeam, true, redCardCountH, neutralVenue);
            aPower = calcTeamPower(aTeam, false, redCardCountA, neutralVenue);
        }

        let hPos = 50, aPos = 50;
        let hGoals = 0, aGoals = 0;
        // yellowCounts artık matchData.yellowCounts üzerinden tutulur (simulateInstantMatch
        // sarmalayıcısı tarafından bu çağrı için izole edilmiştir) - böylece pickFoulCommitter'ın
        // "zaten sarı kart görmüş oyuncu daha dikkatli olur" mantığı iki motorda da AYNI şekilde
        // çalışır, ayrı bir yerel kopya tutmaya gerek kalmaz.

        // Canlı maçlardaki initMatchRatings() ile aynı mantık: tüm 22 oyuncu başlangıçta 6.5 alır.
        // Böylece hiçbir olayın yaşanmadığı (0-0, kartsız) bir maçta bile MOTM ataması boş kalmaz -
        // eskiden ratings boş başlıyordu ve tamamen olaysız maçlarda MOTM hiç atanmıyordu.
        let ratings = {};
        hTeam.squad.forEach(id => { ratings[id] = 6.5; });
        aTeam.squad.forEach(id => { ratings[id] = 6.5; });
        function bump(id, delta) {
            // Aynı hata burada da vardı: id=0 (Mbappé) olan oyuncular hızlı simülasyonda hiçbir
            // zaman reyting değişimi almıyordu, bu da MOTM seçiminde haksız şekilde dışlanmalarına
            // yol açıyordu.
            if (id === undefined || id === null) return;
            ratings[id] = Math.max(3, Math.min(10, (ratings[id] === undefined ? 6.5 : ratings[id]) + delta));
        }

        // Yerel momentum sistemi: canlı maçtaki applyMomentumShift/getEffectiveTeamPower ile BİREBİR
        // aynı formülü kullanır (liderlik dampening dahil), ama bu tek çağrıya özel yerel
        // değişkenlerde tutulur - global matchData'daki gerçek/canlı maçın momentumuna dokunmaz.
        let momentumH = 0, momentumHExpire = -1, momentumA = 0, momentumAExpire = -1;
        function applyLocalMomentum(isHome, amount, currentMin) {
            let finalAmount = amount;
            if (amount < 0) {
                const team = isHome ? hTeam : aTeam;
                const captain = getTeamCaptain(team);
                const leadScore = captain ? getLeadership(captain) : 50;
                const dampening = Math.max(0, Math.min(0.55, (leadScore - 20) / 145));
                finalAmount = amount * (1 - dampening);
            }
            const duration = Math.floor(Math.random() * 6) + 5;
            if (isHome) { momentumH = finalAmount; momentumHExpire = currentMin + duration; }
            else { momentumA = finalAmount; momentumAExpire = currentMin + duration; }
        }
        function getLocalEffectivePower(isHome, currentMin) {
            if (isHome) { if (currentMin > momentumHExpire) momentumH = 0; return hPower + momentumH; }
            else { if (currentMin > momentumAExpire) momentumA = 0; return aPower + momentumA; }
        }

        // Kırmızı kart artık hızlı simülasyonda da GERÇEKTEN uygulanıyor: oyuncu sahadan çıkarılır
        // (isSentOff ile hemen dışlanır - matchData.sentOff bu çağrı süresince zaten izole edilmiş
        // geçici bir set) ve takımın gücü aynı canlı maçtaki gibi anında yeniden hesaplanır.
        function localSendOff(player, team) {
            matchData.sentOff.add(player.id);
            if (team === hTeam) redCardCountH++; else redCardCountA++;
            recalcLocalPowers();
            bump(player.id, -1.8);
        }

        function localGiveYellow(player, team) {
            matchData.yellowCounts[player.id] = (matchData.yellowCounts[player.id] || 0) + 1;
            if (matchData.yellowCounts[player.id] >= 2) {
                localSendOff(player, team);
            } else {
                bump(player.id, -0.4);
            }
        }

        // Canlı maçtaki gibi her devre için AYRI 1-9 dakikalık ilave süre - toplam dakika sayısı
        // artık iki devrenin toplamına eşit (gerçek maçlarda olduğu gibi).
        const injuryMinutesFirstHalf = Math.floor(Math.random() * 9) + 1;
        const injuryMinutesSecondHalf = Math.floor(Math.random() * 9) + 1;
        const totalMinutes = 90 + injuryMinutesFirstHalf + injuryMinutesSecondHalf;

        for (let min = 0; min < totalMinutes; min++) {
            let effHPower = getLocalEffectivePower(true, min);
            let effAPower = getLocalEffectivePower(false, min);
            let baseShare = Math.max(20, Math.min(80, 50 + (effHPower - effAPower) * 0.8));
            let luckNoise = (Math.random() - 0.5) * 2 * 100 * (settings.lWeight / 100);
            let instantShare = Math.max(10, Math.min(90, baseShare + luckNoise));
            hPos = Math.round((hPos * 4 + instantShare) / 5);
            aPos = 100 - hPos;

            let r = Math.random();
            if (r < 0.25) {
                let isHomeAtt = Math.random() < hPos / 100;
                let attTeam = isHomeAtt ? hTeam : aTeam;
                let defTeam = isHomeAtt ? aTeam : hTeam;
                let attPower = getLocalEffectivePower(isHomeAtt, min);
                let defPower = getLocalEffectivePower(!isHomeAtt, min);

                let powerGap = attPower - defPower;
                let qualityMultiplier = Math.max(0.55, Math.min(1.7, 1 + powerGap / 110));
                let base_xg = ((Math.random() * 0.5) + 0.08) * qualityMultiplier;
                let attacker = getRandomAttacker(attTeam);
                let defGkPlayer = getPlayerFromId(defTeam.squad[0]);
                let gkPwr = defGkPlayer ? getOverall(defGkPlayer) : 50;

                if (Math.random() < 0.4) { /* pas/toparlanma - şans yok */ }
                else {
                    if (Math.random() < 0.08) continue; // ofsayt

                    // KORNER - canlı maçla aynı %8 ihtimal ve aynı formüller, sadece animasyon yok.
                    if (Math.random() < 0.08) {
                        const cTaker = getBestCornerTaker(attTeam);
                        const target = getWeightedHeaderTarget(attTeam, cTaker.id);
                        const corScore = cTaker.cor || 50;
                        const dangerChance = Math.max(0.2, Math.min(0.7, 0.35 + (corScore - 60) / 200));
                        if (target && Math.random() < dangerChance) {
                            const heaScore = target.hea || 50;
                            const gkScore = defGkPlayer ? getOverall(defGkPlayer) : 50;
                            const headGoalChance = Math.max(0.08, Math.min(0.55, 0.20 + (heaScore - 60) / 200 - (gkScore - 60) / 300));
                            if (Math.random() < headGoalChance) {
                                if (isHomeAtt) hGoals++; else aGoals++;
                                if (!dryRun) recordTournamentGoalDirect(target, cTaker, attTeam);
                                bump(target.id, 1.1);
                                bump(cTaker.id, 0.55);
                                applyLocalMomentum(isHomeAtt, 2.5, min);
                                applyLocalMomentum(!isHomeAtt, -2.5, min);
                            }
                        }
                        continue;
                    }

                    // PENALTI - canlı maçtaki ortalama %85 verilme oranıyla aynı, "Penaltı Kullanma"
                    // ve kalecinin "Birebir" özelliği burada da devrede.
                    if (Math.random() < 0.07) {
                        let awarded = Math.random() < 0.85;
                        if (awarded) {
                            const taker = getBestPenaltyTaker(attTeam);
                            const gkScore = defGkPlayer ? (defGkPlayer.gk_1v1 || 50) : 50;
                            const convertChance = Math.max(0.45, Math.min(0.93, 0.78 + ((taker.pen || 50) - 70) / 250 - (gkScore - 70) / 300));
                            if (taker && Math.random() < convertChance) {
                                if (isHomeAtt) hGoals++; else aGoals++;
                                if (!dryRun) recordTournamentGoalDirect(taker, null, attTeam);
                                bump(taker.id, 1.1);
                                applyLocalMomentum(isHomeAtt, 2.5, min);
                                applyLocalMomentum(!isHomeAtt, -2.5, min);
                            } else if (taker) {
                                const savedByKeeper = Math.random() < 0.6;
                                if (savedByKeeper) {
                                    bump(taker.id, -0.6);
                                    if (defGkPlayer) bump(defGkPlayer.id, 1.2);
                                    applyLocalMomentum(!isHomeAtt, 2.5, min);
                                    applyLocalMomentum(isHomeAtt, -2, min);
                                } else {
                                    bump(taker.id, -0.7);
                                    applyLocalMomentum(isHomeAtt, -2.5, min);
                                    applyLocalMomentum(!isHomeAtt, 1.5, min);
                                }
                            }
                        }
                        continue;
                    }

                    let onTargetChance = Math.max(0.25, Math.min(0.8, 0.42 + base_xg * 0.5 + ((attacker.fin || 50) - 50) / 350 + ((attacker.bal || 50) - 50) / 500));
                    if (Math.random() < onTargetChance) {
                        let finishBonus = ((attacker.fin || 50) - 50) / 420;
                        let keeperPenalty = (gkPwr - 50) / 380;
                        let effectiveXG = Math.max(0.04, Math.min(0.88, base_xg + finishBonus - keeperPenalty));
                        if (Math.random() < effectiveXG) {
                            let confirmed = true;
                            if (Math.random() < 0.14) confirmed = Math.random() < 0.55; // basitleştirilmiş VAR
                            if (confirmed) {
                                if (isHomeAtt) hGoals++; else aGoals++;
                                let assistPlayer = getAssistCandidate(attTeam, attacker.id);
                                let assistChance = assistPlayer ? Math.max(0.25, Math.min(0.85, 0.45 + ((assistPlayer.vis || 50) - 50) / 150)) : 0;
                                let hasAssist = assistPlayer && Math.random() < assistChance;
                                if (!dryRun) recordTournamentGoalDirect(attacker, hasAssist ? assistPlayer : null, attTeam);
                                bump(attacker.id, 1.1);
                                if (hasAssist) bump(assistPlayer.id, 0.55);
                                if (defGkPlayer) bump(defGkPlayer.id, -0.4);
                                applyLocalMomentum(isHomeAtt, 2.5, min);
                                applyLocalMomentum(!isHomeAtt, -2.5, min);
                            } else {
                                bump(attacker.id, -0.2);
                                applyLocalMomentum(isHomeAtt, -2.5, min);
                                applyLocalMomentum(!isHomeAtt, 2, min);
                            }
                        } else if (defGkPlayer) {
                            bump(defGkPlayer.id, effectiveXG > 0.4 ? 0.55 : 0.25);
                        }
                    }
                }
            } else if (r > 0.95) {
                // Kartlar artık canlı maçtaki gibi faul eğilimine göre ağırlıklı seçiliyor ve ikinci
                // sarıdan kırmızı kart üretebiliyor - eskiden burada hiç gerçek kırmızı kart yoktu.
                let isHomeCard = Math.random() > 0.5;
                let cardTeam = isHomeCard ? hTeam : aTeam;
                let cardPlayer = pickFoulCommitter(cardTeam);
                if (cardPlayer) {
                    let tendency = getFoulTendency(cardPlayer) / 100;
                    let seriousChance = 0.045 + tendency * 0.14; // kalibrasyon: eski değer ikinci sarı kart birikimiyle birleşince gerçekçi olmayan (~0.75/maç) kırmızı kart oranı üretiyordu
                    if (Math.random() < seriousChance) {
                        let roll = Math.random();
                        let redChance = 0.05 + tendency * 0.10;
                        if (roll < redChance) localSendOff(cardPlayer, cardTeam);
                        else if (roll < redChance + 0.55) localGiveYellow(cardPlayer, cardTeam);
                    } else {
                        localGiveYellow(cardPlayer, cardTeam);
                    }
                }
            } else {
                // Kartsız faul + tehlikeli bölgede kazanılırsa frikik - canlı maçtaki %16 x %22
                // ihtimaliyle aynı, "Duran Top (Frikik)" özelliği burada da devrede.
                let generalTeam = Math.random() > 0.5 ? hTeam : aTeam;
                if (Math.random() < 0.16 && Math.random() < 0.22) {
                    const fkTeam = generalTeam === hTeam ? aTeam : hTeam;
                    const taker = getBestFreeKickTaker(fkTeam);
                    const fkGk = getPlayerFromId(generalTeam.squad[0]);
                    const fkScore = taker.fk || 50;
                    const gkScore = fkGk ? Math.max(fkGk.gk_ref || 50, fkGk.gk_pos || 50) : 50;
                    const fkOnTargetChance = Math.max(0.25, Math.min(0.75, 0.35 + (fkScore - 60) / 200));
                    if (Math.random() < fkOnTargetChance) {
                        const goalChance = Math.max(0.06, Math.min(0.45, 0.16 + (fkScore - 60) / 180 - (gkScore - 60) / 250));
                        if (Math.random() < goalChance) {
                            if (fkTeam === hTeam) hGoals++; else aGoals++;
                            if (!dryRun) recordTournamentGoalDirect(taker, null, fkTeam);
                            bump(taker.id, 1.2);
                            applyLocalMomentum(fkTeam === hTeam, 2.5, min);
                            applyLocalMomentum(fkTeam !== hTeam, -2.5, min);
                        } else {
                            if (fkGk) bump(fkGk.id, 0.3);
                            bump(taker.id, -0.05);
                        }
                    }
                }
            }
        }

        let motmId = null, motmRating = -1;
        if (!dryRun) {
            [hTeam, aTeam].forEach(team => {
                team.squad.forEach(id => {
                    if (ratings[id] !== undefined && ratings[id] > motmRating) { motmRating = ratings[id]; motmId = id; }
                });
            });
            if (motmId !== null) {
                const p = getPlayerFromId(motmId);
                const teamOfMotm = hTeam.squad.includes(motmId) ? hTeam : aTeam;
                if (p) {
                    if (!tourneyMOTMCounts[motmId]) tourneyMOTMCounts[motmId] = { name: p.name, team: teamOfMotm.name, count: 0 };
                    tourneyMOTMCounts[motmId].count++;
                }
            }
        }

        return { hg: hGoals, ag: aGoals };
    }

    function simulateFixtureInstant(idx) {
        let fix = tFixtures[idx];
        if (!fix || fix.played) return;
        fix.h.matchCount = (fix.h.matchCount || 0) + 1;
        fix.a.matchCount = (fix.a.matchCount || 0) + 1;
        let result = simulateInstantMatch(fix.h, fix.a);
        resolveFixtureResult(fix, result.hg, result.ag);
    }

    function simulateWeekInstant(week) {
        const weekFixtures = tFixtures.map((f, i) => ({ f, i })).filter(x => x.f.week === week && !x.f.played);
        if (!weekFixtures.length) return;
        if (!confirm(`Hafta ${week}'deki ${weekFixtures.length} maçı hızlı simüle etmek istediğine emin misin? Maçları canlı izleyemeyeceksin, sadece sonuçlar işlenecek.`)) return;
        weekFixtures.forEach(x => simulateFixtureInstant(x.i));
        renderTourney();
    }

    function simulateAllRemainingInstant() {
        const remaining = tFixtures.filter(f => !f.played).length;
        if (!remaining) return;
        if (!confirm(`Kalan ${remaining} maçın tamamını hızlı simüle etmek istediğine emin misin? Hiçbirini canlı izleyemeyeceksin.`)) return;
        tFixtures.forEach((f, i) => { if (!f.played) simulateFixtureInstant(i); });
        renderTourney();
    }
    // ------- /HIZLI SİMÜLASYON -------

    function endTournament() {
        if (!confirm('Turnuvayı bitirip sıfırlamak istediğine emin misin? Şu ana kadarki tüm puan durumu, fikstür ve istatistikler silinecek.')) return;
        tourneyActive = false;
        tTeams = []; tFixtures = []; tourneyPlayerStats = {}; pendingTourneyTeams = null;
        document.getElementById('champion-overlay').classList.remove('active');
        document.getElementById('tourney-setup').style.display = 'block';
        document.getElementById('tourney-active').style.display = 'none';
        document.getElementById('tourney-hero-badge').innerText = '🔧 Kurulum Aşaması';
        document.getElementById('tourney-hero-subtitle').innerText = 'Kendi turnuvanı kur, rakiplerini ez, kupayı kaldır.';
        switchTourneyTab('standings');
    }

    const weightSliderIds = ['set-player', 'set-manager', 'set-home', 'set-stadium', 'set-luck'];

    function loadSettingsIntoSliders() {
        document.getElementById('set-player').value = settings.pWeight;
        document.getElementById('set-manager').value = settings.mWeight;
        document.getElementById('set-home').value = settings.hWeight;
        document.getElementById('set-stadium').value = settings.sWeight;
        document.getElementById('set-luck').value = settings.lWeight;
        onWeightSliderInput();
    }

    function readWeightSliders() {
        return {
            p: parseInt(document.getElementById('set-player').value),
            m: parseInt(document.getElementById('set-manager').value),
            h: parseInt(document.getElementById('set-home').value),
            s: parseInt(document.getElementById('set-stadium').value),
            l: parseInt(document.getElementById('set-luck').value)
        };
    }

    function onWeightSliderInput() {
        const w = readWeightSliders();
        document.getElementById('set-player-val').innerText = w.p + '%';
        document.getElementById('set-manager-val').innerText = w.m + '%';
        document.getElementById('set-home-val').innerText = w.h + '%';
        document.getElementById('set-stadium-val').innerText = w.s + '%';
        document.getElementById('set-luck-val').innerText = w.l + '%';

        const total = w.p + w.m + w.h + w.s + w.l;
        const gaugeEl = document.getElementById('weight-total-gauge');
        const valEl = document.getElementById('weight-total-value');
        valEl.innerText = total;
        gaugeEl.classList.toggle('gauge-bad', total !== 100);

        const alertBox = document.getElementById('settings-form-alert');
        if (total !== 100) {
            const diff = 100 - total;
            alertBox.innerText = diff > 0
                ? `Toplam %${total}. Kaydetmek için %${diff} daha eklemelisin.`
                : `Toplam %${total}. Kaydetmek için %${Math.abs(diff)} azaltmalısın.`;
            alertBox.style.display = 'block';
        } else {
            alertBox.style.display = 'none';
        }
    }

    function saveSettings() {
        const w = readWeightSliders();
        const total = w.p + w.m + w.h + w.s + w.l;
        const alertBox = document.getElementById('settings-form-alert');
        if (total !== 100) {
            onWeightSliderInput();
            alertBox.classList.remove('shake');
            void alertBox.offsetWidth;
            alertBox.classList.add('shake');
            return;
        }
        settings = { pWeight: w.p, mWeight: w.m, hWeight: w.h, sWeight: w.s, lWeight: w.l };
        localStorage.setItem('fm_settings_v16', JSON.stringify(settings));
        const btn = document.getElementById('btn-save-settings');
        const originalText = btn.innerText;
        btn.innerText = '✓ Ayarlar Kaydedildi!';
        btn.classList.add('nav-active');
        setTimeout(() => { btn.innerText = originalText; btn.classList.remove('nav-active'); }, 1600);
    }

    window.onload = () => {
        initApp();
        generateTourneySlots();
    };
