/* =====================================================================
   ADOBALL UI KATMANI  (ikinci betik)
   KURAL: Bu dosya maç motorunun gövdesine dokunmaz. Motorun verisini (matchData, savedTeams,
   playerDatabase, tTeams ...) yalnızca OKUR; motor fonksiyonlarını "sonradan çalışan kanca"
   olarak sarar. Her kanca try/catch içindedir: UI hatası asla maç saatini dondurmaz.
   Motorda bulunmayan hiçbir veri uydurulmaz.
   ===================================================================== */
(function () {
    'use strict';
    var G = window;
    function $(id) { return document.getElementById(id); }
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function warn(where, e) { try { console.warn('[adoball-ui] ' + where, e); } catch (_) { } }

    // Motor fonksiyonunu, sonucu değiştirmeden, sonradan çalışan bir kancayla sarar.
    function after(name, hook) {
        var orig = G[name];
        if (typeof orig !== 'function') { warn('eksik fonksiyon', name); return; }
        G[name] = function () {
            var r = orig.apply(this, arguments);
            try { hook.call(this, r, arguments); } catch (e) { warn('kanca ' + name, e); }
            return r;
        };
    }
    function before(name, hook) {
        var orig = G[name];
        if (typeof orig !== 'function') { warn('eksik fonksiyon', name); return; }
        G[name] = function () {
            try { hook.apply(this, arguments); } catch (e) { warn('kanca ' + name, e); }
            return orig.apply(this, arguments);
        };
    }

    /* ---------- UI tercihleri (motorun anahtarlarından AYRI) ---------- */
    var PREF_KEY = 'adoball_ui_v1';
    function prefGet() { try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}') || {}; } catch (e) { return {}; } }
    function prefSet(k, v) { try { var p = prefGet(); p[k] = v; localStorage.setItem(PREF_KEY, JSON.stringify(p)); } catch (e) { } }

    /* ---------- renk yardımcıları ---------- */
    function hex2rgb(h) {
        h = String(h || '#888888').replace('#', '');
        if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
        var n = parseInt(h, 16);
        if (isNaN(n)) return [136, 136, 136];
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function rgb2hex(r) { return '#' + r.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join(''); }
    function lum(rgb) {
        var f = function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
    }
    // Çok koyu takım renklerini (örn. #111111) koyu zeminde görünür kılar
    function vis(hex) {
        var rgb = hex2rgb(hex), t = 0;
        while (lum(rgb) < 0.10 && t < 8) { rgb = rgb.map(function (v) { return v + (255 - v) * 0.18; }); t++; }
        return rgb2hex(rgb);
    }
    // Dolgu ustundeki yazi rengi: WCAG gecis noktasi ~0.179 (iki yonde de ~4.6:1). Eski .42 esigi orta parlaklikta beyaz secip 2.7:1 kaliyordu.
    function ink(hex) { return lum(hex2rgb(hex)) > 0.179 ? '#04101f' : '#ffffff'; }
    // Takim rengi koyu zeminde YAZI ya da ince cizgi olacaksa: s1 uzerinde >= 4.5:1 icin lum >= 0.24'e kadar acilir
    function textTone(hex) {
        var rgb = hex2rgb(hex), t = 0;
        while (lum(rgb) < 0.24 && t < 12) { rgb = rgb.map(function (v) { return v + (255 - v) * 0.16; }); t++; }
        return rgb2hex(rgb);
    }
    function setTeamVars(el, side, hex) {
        el.style.setProperty('--team-' + side, hex);
        el.style.setProperty('--team-' + side + '-ink', ink(hex));
        el.style.setProperty('--team-' + side + '-text', textTone(hex));
    }
    function dist(a, b) { var x = hex2rgb(a), y = hex2rgb(b); return Math.sqrt(Math.pow(x[0] - y[0], 2) + Math.pow(x[1] - y[1], 2) + Math.pow(x[2] - y[2], 2)); }
    // İki takımın rengi birbirine çok benziyorsa (varsayılan renkler aynıydı) deplasman için ayırt edici renk seçer.
    function pairColors(h, a) {
        var ch = vis(h.color), ca = vis(a.color);
        if (dist(ch, ca) < 90) ca = dist(ch, '#ff3b5c') >= 120 ? '#ff3b5c' : '#ffc93c';
        return [ch, ca];
    }
    function setPair(el, h, a) {
        if (!el || !h || !a) return;
        var c = pairColors(h, a);
        setTeamVars(el, 'h', c[0]);
        setTeamVars(el, 'a', c[1]);
    }

    /* ---------- takım / oyuncu yardımcıları (yalnızca okur) ---------- */
    function avg(a) { return a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : 0; }
    function ovrOf(id) { return getOverall(getPlayerFromId(id)); }
    function teamStats(t) {
        var o = t.squad.map(ovrOf);
        return { ovr: avg(o), gk: o[0], def: avg(o.slice(1, 5)), mid: avg(o.slice(5, 8)), att: avg(o.slice(8, 11)) };
    }
    function r0(v) { return Math.round(v); }
    function stripEmoji(s) { return String(s == null ? '' : s).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').replace(/\s{2,}/g, ' ').trim(); }
    function lastName(n) { var p = String(n || '').trim().split(/\s+/); return p[p.length - 1] || n; }
    function icon(id, cls) { return '<svg class="ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>'; }

    var ado = G.ado = {};
    ado.pairColors = pairColors; ado.ink = ink; ado.vis = vis; ado.textTone = textTone; ado.setTeamVars = setTeamVars;

    /* =====================================================================
       Toast
       ===================================================================== */
    function toast(msg, tone) {
        var box = $('toasts'); if (!box) return;
        if (!tone) tone = /^(Kaydedilemedi|Hata|Başlatılamadı)|olamaz|başarısız/i.test(String(msg)) ? 'err' : /kaydedildi|güncellendi|silindi|uygulandı/i.test(String(msg)) ? 'ok' : '';
        var d = document.createElement('div'); d.className = 'toast' + (tone ? ' ' + tone : ''); d.textContent = msg;
        box.appendChild(d);
        setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, Math.min(9000, 2600 + String(msg).length * 35));
    }

    /* =====================================================================
       Kenar çubuğu
       ===================================================================== */
    function applySb(on) {
        document.body.classList.toggle('sb-collapsed', !!on);
        var b = $('sb-toggle');
        if (b) { b.setAttribute('aria-expanded', on ? 'false' : 'true'); b.setAttribute('aria-label', on ? 'Menüyü genişlet' : 'Menüyü daralt'); }
    }
    ado.toggleSb = function () { var on = !document.body.classList.contains('sb-collapsed'); applySb(on); prefSet('sb', on ? 1 : 0); };
    ado.go = function (id) { showScreen(id); };
    ado.newTeam = function () { showScreen('squad-screen'); openNewTeamForm(); };

    /* =====================================================================
       Ekran geçişi: başlık, ana sayfa yenileme
       ===================================================================== */
    var TITLES = {
        'home-screen': 'Ana Sayfa', 'squad-screen': 'Takım Yönetimi', 'quick-match-screen': 'Hızlı Maç', 'tournament-screen': 'Turnuva Modu',
        'player-edit-screen': 'Futbolcu Veritabanı', 'settings-screen': 'Oyun Ayarları', 'match-screen': 'Canlı Maç'
    };
    function refreshChips() {
        var box = $('tb-chips'); if (!box) return;
        var np = (typeof playerDatabase !== 'undefined') ? playerDatabase.length : 0;
        var nt = (typeof savedTeams !== 'undefined') ? savedTeams.length : 0;
        box.innerHTML = '<span class="chip"><b>' + nt + '</b> takım</span><span class="chip"><b>' + np + '</b> futbolcu</span>';
    }
    after('showScreen', function (_, args) {
        var id = args[0];
        var t = TITLES[id];
        if (t) { $('tb-title').textContent = t; }
        document.querySelectorAll('#nav-buttons .btn').forEach(function (b) {
            if (b.classList.contains('nav-active')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
        });
        refreshChips();
        if (id === 'home-screen') renderHome();
        if (id !== 'match-screen') { try { window.scrollTo(0, 0); } catch (e) { } }
    });

    /* =====================================================================
       SON GELİŞMELER (yalnızca bu oturum, kaydedilmez)
       ===================================================================== */
    var feed = [], lastMatch = null, prevLeader = null, champLogged = false;
    var FEED_ICON = { goal: 'ab', result: 'i-match', leader: 'i-trophy', red: 'i-card', form: 'i-trend', tour: 'i-trophy' };
    function homeActive() { var s = $('home-screen'); return !!(s && s.classList.contains('active')); }
    function pushFeed(type, text, ctx) {
        feed.unshift({ type: type, text: text, ctx: ctx || '' });
        if (feed.length > 40) feed.length = 40;
        if (homeActive()) renderFeed();
    }
    function renderFeed() {
        var box = $('home-feed'); if (!box) return;
        if (!feed.length) {
            box.innerHTML = '<div class="empty-sm">' + icon('i-trend') + '<span class="grow"><b>Henüz gelişme yok</b>Goller, sonuçlar ve turnuva haberleri burada akar.</span></div>';
            return;
        }
        box.innerHTML = feed.slice(0, 6).map(function (f) {
            return '<div class="feed-row ' + esc(f.type) + '"><span class="feed-ic">' + icon(FEED_ICON[f.type] || 'i-dot') + '</span><span class="feed-txt" title="' + esc(f.text) + '">' + esc(f.text) + '</span><span class="feed-ctx">' + esc(f.ctx) + '</span></div>';
        }).join('');
    }

    /* =====================================================================
       ANA SAYFA (yayın vitrini): sıradaki maç kartı, mod karoları, Ado Kart rafı, kulüpler, akış, son maç
       Terimler: OVR = 11 oyuncunun ortalaması, Güç = takım gücü (oyuncu + TD + stadyum + saha; calcTeamPower)
       ===================================================================== */
    function powerOf(t, isHome) { try { return r0(calcTeamPower(t, isHome, 0, false)); } catch (e) { return 0; } }
    var OVR_TIP = 'OVR: ilk 11 oyuncunun ortalama reytingi';
    var POW_TIP = 'Güç: oyuncular, teknik direktör, stadyum ve saha avantajıyla takım gücü';
    function hmTeam(t, side) {
        var s = teamStats(t);
        var info = '<div class="hm-info"><div class="hm-name">' + esc(t.name) + '</div><div class="hm-meta"><span class="hm-ovr" data-tier="' + tierOf(r0(s.ovr)) + '" title="' + OVR_TIP + '">' + r0(s.ovr) + '<small>OVR</small></span><span title="' + POW_TIP + '">Güç ' + powerOf(t, side === 'h') + '</span></div></div>';
        var crest = renderTeamCrestHTML(t, 88, true);
        return '<div class="hm-team ' + side + '">' + (side === 'h' ? info + crest : crest + info) + '</div>';
    }
    function hmWm(t, side) { return '<div class="hm-wm ' + side + '" aria-hidden="true">' + renderTeamCrestHTML(t, 250) + '</div>'; }
    var HM_BAR = '<i class="hm-bar" aria-hidden="true"></i>';
    function renderHero() {
        var el = $('home-hero'); if (!el) return;
        el.className = 'hm';
        var h = null, a = null, tag = '', actions = '';
        var ix = -1;
        if (tourneyActive && tFixtures.length) ix = tFixtures.findIndex(function (f) { return !f.played; });
        if (tourneyActive && tFixtures.length && ix === -1 && tTeams.length) {
            var ch = tTeams[0];
            setTeamVars(el, 'h', vis(ch.color)); setTeamVars(el, 'a', '#ffc93c');
            el.innerHTML = hmWm(ch, 'h') + '<div class="hm-top"><span class="hm-eyebrow">Turnuva tamamlandı</span><span class="hm-tag">' + icon('i-trophy') + 'Şampiyon</span></div>' +
                '<div class="hm-center">' + renderTeamCrestHTML(ch, 96, true) + '<div class="hm-name">' + esc(ch.name) + '</div><div class="hm-meta"><span class="hm-ovr">' + esc(ch.p) + '<small>PUAN</small></span><span>' + esc(ch.w) + ' galibiyet</span></div></div>' +
                '<div class="hm-cta"><button type="button" class="btn btn-primary btn-lg" onclick="showScreen(\'tournament-screen\')">Puan durumu' + icon('i-arrow-r') + '</button></div>' + HM_BAR;
            return;
        }
        if (ix >= 0) {
            var nx = tFixtures[ix]; h = nx.h; a = nx.a;
            tag = 'Turnuva · ' + nx.week + '. hafta';
            actions = '<button type="button" class="btn btn-primary btn-lg" onclick="playTourneyMatch(' + ix + ')">Maçı oyna' + icon('i-arrow-r') + '</button>';
        } else if (savedTeams.length >= 2) {
            var hi = parseInt(($('qm-home') || {}).value), ai = parseInt(($('qm-away') || {}).value);
            if (isNaN(hi) || isNaN(ai) || hi === ai || !savedTeams[hi] || !savedTeams[ai]) { hi = 0; ai = 1; }
            h = savedTeams[hi]; a = savedTeams[ai];
            tag = 'Hızlı maç';
            actions = '<button type="button" class="btn btn-primary btn-lg" onclick="showScreen(\'quick-match-screen\')">Maç gününe git' + icon('i-arrow-r') + '</button>';
        }
        if (!h || !a) {
            el.classList.add('is-empty');
            setTeamVars(el, 'h', '#1fb2ff'); setTeamVars(el, 'a', '#8b7cff');
            var need = savedTeams.length === 0 ? 'İlk takımını kurarak başla' : 'Maç için bir takım daha kur';
            el.innerHTML = '<div class="hm-top"><span class="hm-eyebrow">Adoball\'a hoş geldin</span></div><div class="hm-empty"><h2>' + need + '</h2><p>Kadronu 4-2-3-1 dizilişinde kur. İki takımla Maç Günü, üç takımla turnuva açılır.</p></div>' +
                '<div class="hm-cta"><button type="button" class="btn btn-primary btn-lg" onclick="ado.newTeam()">' + icon('i-plus') + 'Takım kur</button></div>' + HM_BAR;
            return;
        }
        setPair(el, h, a);
        el.innerHTML = hmWm(h, 'h') + hmWm(a, 'a') +
            '<div class="hm-top"><span class="hm-eyebrow">Sıradaki maç</span><span class="hm-tag">' + esc(tag) + '</span></div>' +
            '<div class="hm-teams">' + hmTeam(h, 'h') + '<div class="hm-vs" aria-hidden="true"><span>VS</span></div>' + hmTeam(a, 'a') + '</div>' +
            '<div class="hm-cta">' + actions + '</div>' + HM_BAR;
    }
    function clubRow(t) {
        var s = teamStats(t);
        return '<div class="club-row" style="--tc:' + vis(t.color) + '" onclick="ado.go(\'squad-screen\')">' + renderTeamCrestHTML(t, 36) +
            '<span class="grow"><span class="t1">' + esc(t.name) + '</span><span class="t2">Güç ' + powerOf(t, true) + ' · TD ' + esc(t.manager) + ' · Stadyum ' + esc(t.stadium) + '</span></span>' +
            '<span class="ovr tier" data-tier="' + tierOf(r0(s.ovr)) + '" title="' + OVR_TIP + '">' + r0(s.ovr) + '</span></div>';
    }
    function renderClubs() {
        var box = $('home-clubs'); if (!box) return;
        var cnt = $('home-club-count'); if (cnt) cnt.textContent = savedTeams.length;
        if (!savedTeams.length) {
            box.innerHTML = '<div class="empty-sm">' + icon('i-team') + '<span class="grow"><b>Kayıtlı takım yok</b>Kadronu kur ve takımını kaydet.</span><button type="button" class="btn btn-sm" onclick="ado.newTeam()">Takım kur</button></div>';
            return;
        }
        var list = savedTeams.map(function (t, i) { return { t: t, i: i, o: teamStats(t).ovr }; }).sort(function (x, y) { return y.o - x.o; }).slice(0, 4);
        box.innerHTML = list.map(function (x) { return clubRow(x.t); }).join('');
    }
    // Ado Kart: mevki rengi, kart kademesi (85+ yıldız, 75-84 altın, 65-74 gümüş, altı bronz), mevkiye göre 3 nitelik (mevcut alanlar)
    var POS_C = { 'KL': 'gk', 'STP': 'def', 'SLB': 'def', 'SĞB': 'def', 'MDO': 'mid', 'MO': 'mid', 'MOO': 'mid', 'SLK': 'wing', 'SĞK': 'wing', 'SF': 'st' };
    var FB = [['pac', 'HIZ', 'Hız'], ['dri', 'DRP', 'Dripling'], ['pas', 'PAS', 'Kısa pas']];
    var CARD_STATS = {
        'KL': [['gk_ref', 'REF', 'Refleks'], ['gk_div', 'UÇM', 'Uçma'], ['gk_pos', 'YER', 'Yer tutma']],
        'STP': [['mar', 'MRK', 'Markaj'], ['tac', 'KAP', 'Top kapma'], ['hea', 'KAF', 'Kafa vuruşu']],
        'SLB': [['pac', 'HIZ', 'Hız'], ['tac', 'KAP', 'Top kapma'], ['sta', 'DAY', 'Dayanıklılık']],
        'MDO': [['tac', 'KAP', 'Top kapma'], ['pas', 'PAS', 'Kısa pas'], ['sta', 'DAY', 'Dayanıklılık']],
        'MO': [['pas', 'PAS', 'Kısa pas'], ['vis', 'VİZ', 'Vizyon'], ['sta', 'DAY', 'Dayanıklılık']],
        'MOO': [['pas', 'PAS', 'Kısa pas'], ['vis', 'VİZ', 'Vizyon'], ['dri', 'DRP', 'Dripling']],
        'SLK': [['pac', 'HIZ', 'Hız'], ['dri', 'DRP', 'Dripling'], ['fin', 'BİT', 'Bitiricilik']],
        'SF': [['fin', 'BİT', 'Bitiricilik'], ['sho', 'ŞUT', 'Şut gücü'], ['pac', 'HIZ', 'Hız']]
    };
    CARD_STATS['SĞB'] = CARD_STATS['SLB']; CARD_STATS['SĞK'] = CARD_STATS['SLK'];
    function tierOf(o) { return o >= 85 ? 'star' : o >= 75 ? 'gold' : o >= 65 ? 'silver' : 'bronze'; }
    function shortName(n) { var p = String(n || '').trim().split(/\s+/); return p.length > 1 ? p.slice(1).join(' ') : (p[0] || ''); }
    var PC_SIL = '<svg class="pc-sil" viewBox="0 0 80 70" aria-hidden="true" focusable="false"><circle cx="40" cy="19" r="14"/><path d="M8 70c0-19 14-31 32-31s32 12 32 31z"/></svg>';
    function adoCard(p, rank) {
        var o = getOverall(p), sn = shortName(p.name), st = CARD_STATS[p.pos] || FB;
        return '<button type="button" class="pcard" data-tier="' + tierOf(o) + '" style="--pc: var(--pos-' + (POS_C[p.pos] || 'def') + ')" onclick="openPlayerEdit(' + p.id + ')" aria-label="' + esc(p.name) + ', ' + esc(p.pos) + ', OVR ' + o + '" title="' + esc(p.name) + '">' +
            '<span class="pcard-in"><span class="pc-top"><span class="pc-ovr"><b>' + o + '</b><span class="pc-pos">' + esc(p.pos) + '</span></span><span class="pc-rank">#' + rank + '</span></span>' + PC_SIL +
            '<span class="pc-name' + (sn.length > 11 ? ' long' : '') + '">' + esc(sn) + '</span><span class="pc-stats">' + st.map(function (s) {
                return '<span title="' + esc(s[2]) + '"><b>' + esc(p[s[0]] != null ? p[s[0]] : '-') + '</b><i>' + s[1] + '</i></span>';
            }).join('') + '</span></span></button>';
    }
    function renderStars() {
        var box = $('home-stars'); if (!box) return;
        var cnt = $('home-player-count'); if (cnt) cnt.textContent = playerDatabase.length;
        var top = playerDatabase.slice().sort(function (a, b) { return getOverall(b) - getOverall(a); }).slice(0, 5);
        box.innerHTML = top.map(function (p, i) { return adoCard(p, i + 1); }).join('');
    }
    // Turnuva karosunun durum satırı (karo bir düğme: içerik yalnız satır içi öğeler)
    function renderTour() {
        var box = $('home-tour'); if (!box) return;
        if (!tourneyActive || !tTeams.length) { box.innerHTML = 'Kurulmadı · 3-6 takımlı lig'; return; }
        var played = tFixtures.filter(function (f) { return f.played; }).length, total = tFixtures.length;
        var lead = tTeams[0];
        var pct = total ? Math.round(played / total * 100) : 0;
        if (total && played >= total) { box.innerHTML = '<span class="tm-line">Şampiyon <b>' + esc(lead.name) + '</b></span><span class="tm-line">' + esc(lead.p) + ' puan</span>'; return; }
        box.innerHTML = '<span class="tm-line" title="Zirvede"><b>' + esc(lead.name) + '</b> · ' + esc(lead.p) + ' P</span>' +
            '<span class="tm-prog" role="progressbar" aria-label="Oynanan maç" aria-valuemin="0" aria-valuemax="' + total + '" aria-valuenow="' + played + '"><i style="width:' + pct + '%"></i></span>' +
            '<span class="tm-line">' + played + ' / ' + total + ' maç</span>';
    }
    function renderLast() {
        var box = $('home-last'); if (!box) return;
        if (!lastMatch) {
            box.innerHTML = '<div class="empty-sm">' + icon('i-match') + '<span class="grow"><b>Henüz maç yok</b>Bu oturumda oynanan son maç burada görünür.</span></div>';
            return;
        }
        var m = lastMatch;
        box.innerHTML = '<div class="last-score"><div class="t">' + renderTeamCrestHTML(m.h, 44) + '<span>' + esc(m.h.name) + '</span></div><div class="sc">' + m.hg + ' – ' + m.ag + '</div><div class="t">' + renderTeamCrestHTML(m.a, 44) + '<span>' + esc(m.a.name) + '</span></div></div>' +
            '<div class="kv"><span>Bağlam</span><b>' + esc(m.ctx) + '</b></div>' +
            (m.motm ? '<div class="kv"><span>Maçın adamı</span><b>' + esc(m.motm.player.name) + ' · ' + m.motm.rating.toFixed(1) + '</b></div>' : '');
    }
    function renderHome() {
        var qm = $('home-quick-meta'); if (qm) qm.textContent = savedTeams.length >= 2 ? 'İki takım seç, canlı izle' : 'Önce iki takım kur';
        renderHero(); renderClubs(); renderStars(); renderTour(); renderFeed(); renderLast();
    }
    ado.renderHome = renderHome;

    /* =====================================================================
       TAKIM KARTLARI (Takım Yönetimi)  – motorun renderSavedTeams şablonunun yerine
       ===================================================================== */
    G.renderSavedTeams = function () {
        var list = $('saved-teams-list'); if (!list) return;
        refreshChips();
        if (!savedTeams.length) {
            list.className = 'panel';
            list.innerHTML = '<div class="empty">' + icon('i-team') + '<h4>Henüz kayıtlı takım yok</h4><p>Kadro, kaptan ve duran top kullanıcılarını seçerek ilk takımını kur.</p><button type="button" class="btn btn-primary" onclick="openNewTeamForm()">' + icon('i-plus') + 'Yeni takım oluştur</button></div>';
            return;
        }
        list.className = 'team-grid';
        // hat çubuğu 40-99 aralığını doldurur (80'li değerler arasındaki fark görünsün)
        var line = function (v, k, n) { v = r0(v); var w = Math.max(4, Math.min(100, (v - 40) / 59 * 100)); return '<div title="' + n + ' ' + v + '"><b>' + v + '</b><span>' + k + '</span><i class="tc-meter" aria-hidden="true"><i style="width:' + w.toFixed(0) + '%"></i></i></div>'; };
        list.innerHTML = savedTeams.map(function (t, i) {
            var s = teamStats(t), cap = getPlayerFromId(t.captainId), o = r0(s.ovr);
            return '<article class="team-card" style="--tc:' + vis(t.color) + ';animation-delay:' + Math.min(i, 8) * 40 + 'ms">' +
                '<div class="tc-head">' + renderTeamCrestHTML(t, 56) + '<div style="min-width:0"><h3 class="tc-name">' + esc(t.name) + '</h3><div class="tc-sub">TD ' + esc(t.manager) + ' · Stadyum ' + esc(t.stadium) + '</div></div>' +
                '<div class="tc-ovr" data-tier="' + tierOf(o) + '" title="' + OVR_TIP + '"><b>' + o + '</b><span>OVR</span></div></div>' +
                '<div class="lines">' + line(s.gk, 'KL', 'Kaleci') + line(s.def, 'SAV', 'Savunma ortalaması') + line(s.mid, 'ORT', 'Orta saha ortalaması') + line(s.att, 'HÜC', 'Hücum ortalaması') + '</div>' +
                sharedWarnHTML(i) +
                '<div class="tc-foot">' + (cap ? '<span class="chip">Kaptan <b>' + esc(cap.name) + '</b></span>' : '<span></span>') +
                '<span class="tc-actions"><button type="button" class="btn btn-sm" aria-label="' + esc(t.name) + ' takımını düzenle" onclick="ado.editTeam(' + i + ')">' + icon('i-edit') + 'Düzenle</button>' +
                '<button type="button" class="btn btn-ghost btn-sm icon-btn tc-del" title="Takımı sil" aria-label="' + esc(t.name) + ' takımını sil" onclick="deleteTeam(' + i + ')">' + icon('i-trash') + '</button></span></div></article>';
        }).join('');
    };
    after('openNewTeamForm', function () {
        // Her yeni takım için farklı bir varsayılan renk (eskiden hepsi #00ffcc'ydi)
        var c = presetTeamColors[savedTeams.length % presetTeamColors.length];
        selectTeamColor(c);
        var tb = $('team-builder'); if (tb) { try { tb.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) { } }
    });
    /* =====================================================================
       KADRO KURALI: Aynı futbolcu iki farklı kayıtlı kadroda oynayamaz.
       Motor gövdesi değişmez; kontrol kayıttan/maçtan/turnuvadan ÖNCE çalışan sarmalayıcılardır.
       ===================================================================== */
    var editIdx = null, pendingEdit = null;
    function pName(id) { var p = getPlayerFromId(id); return p ? p.name : '#' + id; }
    // {oyuncuId: {name, idx}}: excl dışındaki kayıtlı takımlarda kim hangi takımda oynuyor
    function ownersMap(excl) {
        var m = {};
        savedTeams.forEach(function (t, i) {
            if (i === excl) return;
            (t.squad || []).forEach(function (id) { if (!m[id]) m[id] = { name: t.name, idx: i }; });
        });
        return m;
    }
    function readSquad() {
        var ids = [];
        for (var i = 0; i < 11; i++) { var el = $('slot-' + i), v = el ? parseInt(el.value) : NaN; ids.push(isNaN(v) ? null : v); }
        return ids;
    }
    function squadConflicts(ids, excl) {
        var own = ownersMap(excl), out = [];
        ids.forEach(function (id, k) { if (id != null && own[id]) out.push({ slot: k, id: id, pname: pName(id), team: own[id].name, idx: own[id].idx }); });
        return out;
    }
    function pairShared(a, b) {
        if (!a || !b) return [];
        var s = {}; (b.squad || []).forEach(function (id) { s[id] = 1; });
        return (a.squad || []).filter(function (id) { return s[id]; });
    }
    function nameList(ids, max) {
        var n = ids.map(pName), more = n.length > max ? n.length - max : 0;
        return n.slice(0, max).join(', ') + (more ? ' +' + more : '');
    }
    // Kart üzerindeki kalıcı uyarı (eski kayıtlarda çakışma kalmışsa)
    function sharedWarnHTML(i) {
        var t = savedTeams[i], parts = [], total = 0;
        savedTeams.forEach(function (o, j) {
            if (j === i) return;
            var sh = pairShared(t, o);
            if (sh.length) { total += sh.length; parts.push(esc(nameList(sh, 2)) + ' (' + esc(o.name) + ')'); }
        });
        if (!parts.length) return '';
        return '<div class="tc-warn" role="note"><b>Ortak futbolcu:</b> ' + parts.slice(0, 3).join(', ') + (parts.length > 3 ? ' +' + (parts.length - 3) : '') +
            '. Bu takım o takımlarla maç yapamaz; <b>Düzenle</b> ile kadroyu revize et.</div>';
    }

    // --- kadro kurucu: seçenek notu + canlı uyarı ---
    function annotateOptions(selects, excl) {
        var own = ownersMap(excl);
        selects.forEach(function (el) {
            if (!el) return;
            [].forEach.call(el.options, function (o) {
                if (o.dataset.base == null) o.dataset.base = o.text;
                var w = own[o.value];
                o.text = o.dataset.base + (w ? '  ·  [' + w.name + ']' : '');
            });
        });
    }
    function slotSelects() { var a = []; for (var i = 0; i < 11; i++) a.push($('slot-' + i)); return a; }
    function checkConflicts() {
        var box = $('squad-conflict'), c = [];
        try { c = squadConflicts(readSquad(), editIdx == null ? -1 : editIdx); } catch (e) { warn('checkConflicts', e); }
        for (var i = 0; i < 11; i++) {
            var el = $('slot-' + i), it = el && el.closest('.pitch-slot-item');
            if (it) it.classList.toggle('conflict', c.some(function (x) { return x.slot === i; }));
        }
        if (box) {
            if (!c.length) { box.hidden = true; box.innerHTML = ''; }
            else {
                box.hidden = false;
                box.innerHTML = '<b>Kadro çakışması:</b> Aynı futbolcu iki farklı kadroda oynayamaz.<ul>' +
                    c.map(function (x) { return '<li><b>' + esc(x.pname) + '</b> zaten <b>' + esc(x.team) + '</b> kadrosunda.</li>'; }).join('') +
                    '</ul>Bu oyuncuyla devam etmek istiyorsan önce <b>' + esc(c[0].team) + '</b> kadrosunu revize et (Takımlar → o takımın kartı → <b>Düzenle</b>); ya da buradan başka bir futbolcu seç.';
            }
        }
        return c;
    }
    function conflictMsg(c) {
        var by = {}; c.forEach(function (x) { (by[x.team] = by[x.team] || []).push(x.pname); });
        var parts = Object.keys(by).map(function (k) { return by[k].join(', ') + ' → ' + k; });
        return 'Kaydedilemedi: ' + parts.join('; ') + ' zaten başka takımın kadrosunda. Aynı futbolcu iki farklı kadroda oynayamaz. ' +
            'Bu kadroda istiyorsan önce diğer kadroyu revize etmelisin (Takımlar → ilgili takım → Düzenle); yoksa başka bir oyuncu seç.';
    }

    before('openNewTeamForm', function () { editIdx = pendingEdit; pendingEdit = null; });
    after('populatePitchSlots', function () {
        var excl = editIdx == null ? -1 : editIdx, own = ownersMap(excl), used = {};
        posNamesList.forEach(function (pos, k) {
            var el = $('slot-' + k); if (!el) return;
            var cur = parseInt(el.value);
            if (own[cur] || used[cur]) {
                var alt = playerDatabase.filter(function (p) { return p.pos === pos && !own[p.id] && !used[p.id]; })[0];
                if (alt) el.value = alt.id;
            }
            used[parseInt(el.value)] = 1;
        });
        annotateOptions(slotSelects(), excl);
        refreshTeamRoleDropdowns();
        checkConflicts();
    });
    after('randomizeSquad', function () {
        var excl = editIdx == null ? -1 : editIdx, own = ownersMap(excl), used = {};
        var ids = readSquad();
        ids.forEach(function (id) { if (id != null && !own[id]) used[id] = 1; });
        posNamesList.forEach(function (pos, k) {
            if (ids[k] == null || !own[ids[k]]) return;
            var pool = playerDatabase.filter(function (p) { return p.pos === pos && !own[p.id] && !used[p.id]; });
            if (!pool.length) return;   // havuz tükendi: uyarı görünür kalır
            var pick = pool[Math.floor(Math.random() * pool.length)];
            $('slot-' + k).value = pick.id; used[pick.id] = 1;
        });
        refreshTeamRoleDropdowns();
        checkConflicts();
    });
    after('cancelTeamForm', function () {
        var was = editIdx; editIdx = null;
        if (was != null) { var n = $('tb-name'); if (n) { n.value = ''; if (typeof updateLogoPreview === 'function') updateLogoPreview(); } }
        var box = $('squad-conflict'); if (box) { box.hidden = true; box.innerHTML = ''; }
    });
    after('openNewTeamForm', function () {
        var h = $('team-builder-title'), b = $('btn-save-team');
        if (h) h.textContent = editIdx == null ? 'Yeni Takım Kur' : 'Takımı Düzenle: ' + (savedTeams[editIdx] ? savedTeams[editIdx].name : '');
        if (editIdx == null) {                 // [ui26] yeni takım: önceki takımın adı alanda kalmasın (düzenleme yolu adı ardından kendisi yazar)
            var tn = $('tb-name'); if (tn && tn.value) { tn.value = ''; try { tn.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) { } }
            try { updateLogoPreview(); } catch (e) { }
        }
        if (b) b.textContent = editIdx == null ? 'Takımı Kaydet' : 'Değişiklikleri Kaydet';
    });

    ado.editTeam = function (i) {
        var t = savedTeams[i]; if (!t) return;
        showScreen('squad-screen');
        pendingEdit = i; openNewTeamForm();
        var setSel = function (id, v) { var el = $(id); if (el && [].some.call(el.options, function (o) { return o.value === String(v); })) el.value = v; };
        $('tb-name').value = t.name;
        setSel('tb-manager', t.manager); setSel('tb-stadium', t.stadium);
        selectTeamColor(t.color); selectTeamLogo(t.logo || 'shield');
        (t.squad || []).forEach(function (id, k) { var el = $('slot-' + k); if (el) el.value = id; });
        refreshTeamRoleDropdowns();
        setSel('tb-captain', t.captainId); setSel('tb-pen-taker', t.penaltyTakerId); setSel('tb-fk-taker', t.freeKickTakerId); setSel('tb-cor-taker', t.cornerTakerId);
        updateLogoPreview();
        checkConflicts();
    };

    (function () {
        var _st = G.saveTeam;
        G.saveTeam = function () {
            var ei = editIdx, n = savedTeams.length;
            var c = []; try { c = checkConflicts(); } catch (e) { warn('saveTeam kontrol', e); }
            if (c.length) {
                showAlert('team-form-alert', conflictMsg(c));
                toast('Kaydedilemedi: aynı futbolcu iki kadroda olamaz');
                var box = $('squad-conflict'); if (box) { try { box.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) { } }
                return;
            }
            var r = _st.apply(this, arguments);
            try {
                if (savedTeams.length > n) {
                    var t = savedTeams[savedTeams.length - 1];
                    if (ei != null && ei < n) {
                        savedTeams.pop(); savedTeams[ei] = t;            // düzenleme: aynı sıraya yaz
                        localStorage.setItem('fm_teams_v16', JSON.stringify(savedTeams));
                        G.renderSavedTeams();
                        toast('Takım güncellendi: ' + t.name);
                    } else toast('Takım kaydedildi: ' + t.name);
                }
            } catch (e) { warn('saveTeam', e); }
            return r;
        };
    })();

    // --- hızlı maç: çakışan iki takım maç yapamaz ---
    function sharedMsg(h, a, sh) {
        return 'Maç başlatılamadı: ' + h.name + ' ve ' + a.name + ' kadrolarında ortak futbolcu var (' + nameList(sh, 3) + '). Aynı futbolcu iki farklı kadroda oynayamaz; ' +
            'takımlardan birini Takımlar → Düzenle ile revize et.';
    }
    (function () {
        var _pm = G.prepareMatch;
        G.prepareMatch = function () {
            try {
                var hs = $('qm-home'), as = $('qm-away');
                if (hs && as && hs.value !== '' && as.value !== '' && hs.value !== as.value) {
                    var h = savedTeams[parseInt(hs.value)], a = savedTeams[parseInt(as.value)], sh = pairShared(h, a);
                    if (sh.length) { showAlert('qm-form-alert', sharedMsg(h, a, sh)); return; }
                }
            } catch (e) { warn('prepareMatch kontrol', e); }
            return _pm.apply(this, arguments);
        };
    })();

    // --- turnuva: seçili takımlar birbirinin oyuncusunu paylaşamaz ---
    function tourneyConflicts() {
        var size = parseInt(($('tourney-size') || {}).value) || 0, idxs = [], bad = [], seen = {};
        for (var i = 0; i < size; i++) { var s = $('tt-slot-' + i); if (s && s.value !== '') idxs.push(parseInt(s.value)); }
        for (var x = 0; x < idxs.length; x++) for (var y = x + 1; y < idxs.length; y++) {
            var p = idxs[x], q = idxs[y]; if (p === q) continue;
            var key = Math.min(p, q) + '-' + Math.max(p, q); if (seen[key]) continue; seen[key] = 1;
            var sh = pairShared(savedTeams[p], savedTeams[q]);
            if (sh.length) bad.push({ a: savedTeams[p], b: savedTeams[q], sh: sh });
        }
        return bad;
    }
    function tourneyMsg(bad) {
        return 'Turnuva başlatılamadı: ' + bad.slice(0, 3).map(function (x) { return x.a.name + ' ↔ ' + x.b.name + ' (' + nameList(x.sh, 2) + ')'; }).join('; ') + (bad.length > 3 ? ' +' + (bad.length - 3) : '') +
            ' kadrolarında ortak futbolcu var. Aynı futbolcu iki farklı kadroda oynayamaz; bu takımlardan birini Takımlar → Düzenle ile revize et ya da farklı takım seç.';
    }
    function tcRender() {
        var box = $('tourney-conflict'); if (!box) return;
        var bad = []; try { bad = tourneyConflicts(); } catch (e) { warn('tcRender', e); }
        if (!bad.length) { box.hidden = true; box.innerHTML = ''; return; }
        box.hidden = false;
        box.innerHTML = '<b>Kadro çakışması:</b> Aynı futbolcu iki farklı kadroda oynayamaz.<ul>' + bad.slice(0, 4).map(function (x) {
            return '<li><b>' + esc(x.a.name) + '</b> ve <b>' + esc(x.b.name) + '</b>: ' + esc(nameList(x.sh, 3)) + '</li>';
        }).join('') + '</ul>Turnuvayı başlatmadan önce bu takımlardan birini Takımlar → <b>Düzenle</b> ile revize et ya da farklı takım seç.';
    }
    (function () {
        var _sT = G.startTournament;
        G.startTournament = function () {
            try {
                var bad = tourneyConflicts();
                if (bad.length) { tcRender(); showAlert('tourney-form-alert', tourneyMsg(bad)); return; }
            } catch (e) { warn('startTournament kontrol', e); }
            return _sT.apply(this, arguments);
        };
    })();
    after('generateTourneySlots', tcRender);

    // --- turnuva kadro düzenleyicisi: başka takımın oyuncusu seçilemez ---
    function tsAnnotate() {
        [].forEach.call(document.querySelectorAll('#tourney-squad-container .tourney-player-select'), function (el) {
            annotateOptions([el], parseInt(el.dataset.teamIdx));
        });
    }
    after('openTourneySquadEditor', tsAnnotate);
    function initTourneyEditorGuard() {
        var cont = $('tourney-squad-container'); if (!cont) return;
        cont.addEventListener('change', function (e) {   // yakalama aşaması: motorun kendi dinleyicisinden ÖNCE çalışır
            var t = e.target; if (!t || !t.classList || !t.classList.contains('tourney-player-select')) return;
            var tIdx = parseInt(t.dataset.teamIdx), slot = parseInt(t.dataset.slotIdx), pId = parseInt(t.value);
            var own = ownersMap(tIdx)[pId];
            if (!own) return;
            e.stopPropagation();
            t.value = savedTeams[tIdx].squad[slot];
            showAlert('tourney-squad-alert', pName(pId) + ' zaten ' + own.name + ' kadrosunda. Aynı futbolcu iki farklı kadroda oynayamaz; bu kadroda istiyorsan önce ' + own.name + ' kadrosunu revize etmelisin (Takımlar → Düzenle).');
        }, true);
        cont.addEventListener('change', function () { try { tsAnnotate(); } catch (e) { warn('tsAnnotate', e); } });
    }


    /* =====================================================================
       MAÇ GÜNÜ (Hızlı Maç)
       ===================================================================== */
    function mdSide(el, t, isHome) {
        if (!el) return;
        if (!t) { el.innerHTML = '<div class="empty-sm"><span class="grow"><b>Takım seçilmedi</b>Önce takım kur.</span></div>'; return; }
        var s = teamStats(t), cap = getPlayerFromId(t.captainId), o = r0(s.ovr);
        var neutral = !!($('qm-neutral-venue') && $('qm-neutral-venue').checked);
        el.innerHTML = renderTeamCrestHTML(t, 88, true) + '<div class="md-name">' + esc(t.name) + '</div>' +
            '<div class="md-nums"><span class="md-num ovr" data-tier="' + tierOf(o) + '" title="' + OVR_TIP + '"><b>' + o + '</b><span>OVR</span></span>' +
            '<span class="md-num" title="' + POW_TIP + '"><b>' + r0(calcTeamPower(t, isHome, 0, neutral)) + '</b><span>Güç</span></span></div>' +
            '<div class="md-facts"><span>TD <b>' + esc(t.manager) + '</b></span><span>Stadyum <b>' + esc(t.stadium) + '</b></span>' + (cap ? '<span>Kaptan <b>' + esc(cap.name) + '</b></span>' : '') + '</div>';
    }
    function cmpItem(label, hv, av, i) {
        var sum = hv + av || 1;
        var w = Math.max(12, Math.min(88, 50 + 250 * (hv - av) / sum));
        return '<div class="cmp-item" style="animation-delay:' + ((i || 0) * 40) + 'ms"><div class="lab">' + label + '</div><div class="cmp-row"><span class="v' + (hv > av ? ' lead' : '') + '">' + r0(hv) + '</span>' +
            '<div class="cmp-bar"><i class="h' + (hv >= av ? ' on' : '') + '" style="width:' + w.toFixed(1) + '%"></i><i class="a' + (av >= hv ? ' on' : '') + '" style="width:' + (100 - w).toFixed(1) + '%"></i></div>' +
            '<span class="v r' + (av > hv ? ' lead' : '') + '">' + r0(av) + '</span></div></div>';
    }
    var mdMoreOpen = false;
    function mdRender() {
        var hs = $('qm-home'), as = $('qm-away'); if (!hs || !as) return;
        var h = savedTeams[parseInt(hs.value)], a = savedTeams[parseInt(as.value)];
        var scr = $('quick-match-screen');
        if (h && a) setPair(scr, h, a);
        mdSide($('md-home'), h, true); mdSide($('md-away'), a, false);
        var cmp = $('md-compare'); if (!cmp) return;
        var od = cmp.querySelector('.cmp-more'); if (od) mdMoreOpen = od.open;
        var go = scr && scr.querySelector('.md-go'); if (go) go.disabled = !(h && a) || hs.value === as.value;
        if (!h || !a) {
            cmp.innerHTML = '<div class="empty">' + icon('i-team') + '<h4>Maç için iki takım gerekli</h4><p>Önce takımlarını kur; sonra burada kadro çizgilerini karşılaştırabilirsin.</p><button type="button" class="btn btn-primary btn-sm" onclick="ado.newTeam()">' + icon('i-plus') + 'Takım kur</button></div>';
            return;
        }
        var neutral = !!($('qm-neutral-venue') && $('qm-neutral-venue').checked);
        var sh = teamStats(h), sa = teamStats(a);
        var shared = hs.value === as.value ? [] : pairShared(h, a);
        cmp.innerHTML = (hs.value === as.value ? '<div class="md-hint">Aynı takımı iki tarafa seçtin. Maça geçmek için farklı iki takım seç.</div>' : '') +
            (shared.length ? '<div class="warn-box" role="alert"><b>Kadro çakışması:</b> ' + esc(nameList(shared, 4)) + ' iki kadroda birden var. Aynı futbolcu iki farklı kadroda oynayamaz; maçtan önce takımlardan birini revize et.<div class="warn-actions"><button type="button" class="btn btn-sm" onclick="ado.editTeam(' + parseInt(hs.value) + ')">' + esc(h.name) + ' kadrosunu düzenle</button><button type="button" class="btn btn-sm" onclick="ado.editTeam(' + parseInt(as.value) + ')">' + esc(a.name) + ' kadrosunu düzenle</button></div></div>' : '') +
            '<div class="cmp-head"><b class="h">' + esc(h.name) + '</b><span class="sec-title">Karşılaştırma</span><b class="a">' + esc(a.name) + '</b></div>' +
            cmpItem('Güç', calcTeamPower(h, true, 0, neutral), calcTeamPower(a, false, 0, neutral), 0) +
            cmpItem('Hücum', sh.att, sa.att, 1) + cmpItem('Orta saha', sh.mid, sa.mid, 2) + cmpItem('Savunma', sh.def, sa.def, 3) +
            '<details class="cmp-more"' + (mdMoreOpen ? ' open' : '') + '><summary><span class="off">Tüm karşılaştırma</span><span class="on">Daha az göster</span></summary>' +
            cmpItem('Ortalama OVR', sh.ovr, sa.ovr) + cmpItem('Kaleci', sh.gk, sa.gk) +
            cmpItem('Teknik direktör', parseInt(h.manager) || 0, parseInt(a.manager) || 0) + cmpItem('Stadyum', parseInt(h.stadium) || 0, parseInt(a.stadium) || 0) + '</details>';
        var d = cmp.querySelector('.cmp-more'); if (d) d.addEventListener('toggle', function () { mdMoreOpen = d.open; });
    }
    after('populateMatchDropdowns', mdRender);

    /* =====================================================================
       CANLI MAÇ
       ===================================================================== */
    // -- görünüm anahtarları --
    ado.view = function (v, noSave) {
        var is2d = !!(G.ado2d && G.ado2d.active()), pitchOn = is2d ? true : v !== 'list';     // canlı 2D'de saha görünümü sabit (ilk 11'ler sağ sütunda); klasik tercih (Saha/Liste) 2D'de ezilmez
        $('view-pitch').hidden = !(pitchOn && !is2d); $('view-list').hidden = pitchOn;
        if ($('view-2d')) $('view-2d').hidden = !(pitchOn && is2d);
        $('vt-pitch').classList.toggle('on', pitchOn); $('vt-list').classList.toggle('on', !pitchOn);
        if (!noSave && !is2d) prefSet('view', pitchOn ? 'pitch' : 'list');
    };
    ado.tl = function (k) {
        k = k === 'cm' || k === 'st' ? k : 'key';
        var key = k === 'key', sc = document.querySelector('.timeline-card .stats-container');      // istatistik paneli yalnız canlı modda akış kartında
        if (k === 'st' && !sc) k = 'key', key = true;
        $('fm-events-list').hidden = !key; $('commentary-list').hidden = k !== 'cm'; if ($('km-head')) $('km-head').hidden = !key;
        if (sc) sc.hidden = k !== 'st';
        [['key', 'tl-tab-key'], ['cm', 'tl-tab-cm'], ['st', 'tl-tab-st']].forEach(function (x) { var b = $(x[1]); if (b) { b.classList.toggle('active', x[0] === k); b.setAttribute('aria-pressed', x[0] === k ? 'true' : 'false'); } });
        ado.tlCur = k;
    };

    // -- saha görünümü --
    var SLOTS = [[5, 50], [17, 17], [17, 39], [17, 61], [17, 83], [28, 38], [28, 62], [37, 50], [37, 16], [37, 84], [44, 50]]; // 4-2-3-1: KL SLB STP STP SĞB MDO MO MOO SLK SĞK SF
    var PITCH_SVG = '<svg class="pitch-svg" viewBox="0 0 105 68" preserveAspectRatio="none" aria-hidden="true" focusable="false"><g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".35">' +
        '<rect x="1" y="1" width="103" height="66"/><line x1="52.5" y1="1" x2="52.5" y2="67"/><circle cx="52.5" cy="34" r="9.15"/>' +
        '<rect x="1" y="13.85" width="16.5" height="40.3"/><rect x="87.5" y="13.85" width="16.5" height="40.3"/><rect x="1" y="24.85" width="5.5" height="18.3"/><rect x="98.5" y="24.85" width="5.5" height="18.3"/>' +
        '<path d="M17.5 27.2 A9.15 9.15 0 0 1 17.5 40.8"/><path d="M87.5 27.2 A9.15 9.15 0 0 0 87.5 40.8"/></g><circle cx="52.5" cy="34" r=".6" fill="rgba(255,255,255,.75)"/></svg>';
    /* [ui23] dikey saha (telefon): aynı çizgiler 90 derece döndürülmüş ((x, y) -> (y, 105 - x)) */
    var PITCH_SVG_V = PITCH_SVG.replace('class="pitch-svg" viewBox="0 0 105 68"', 'class="pitch-svg v" viewBox="0 0 68 105"').replace('<g fill="none"', '<g transform="matrix(0 -1 1 0 0 105)"><g fill="none"').replace('</svg>', '</g></svg>');
    var pitchKey = '';
    function ensurePitch() {
        var pv = $('pitch-view');
        if (!pv || !matchData.h || !matchData.a) return false;
        var h = matchData.h, a = matchData.a;
        var key = [h.name, h.color, h.squad.join(','), a.name, a.color, a.squad.join(',')].join('|');
        if (key === pitchKey && pv.querySelector('.pp')) return true;
        var cols = pairColors(h, a);
        var html = PITCH_SVG.replace('class="pitch-svg"', 'class="pitch-svg h"') + PITCH_SVG_V + '<span class="pp-mark l">' + esc(h.name) + '</span><span class="pp-mark r">' + esc(a.name) + '</span>';
        [h, a].forEach(function (t, ti) {
            t.squad.forEach(function (id, i) {
                var p = getPlayerFromId(id); if (!p) return;
                var s = SLOTS[i] || [50, 50];
                var x = ti ? 100 - s[0] : s[0], y = ti ? 100 - s[1] : s[1];
                html += '<button type="button" class="pp" data-id="' + id + '" style="left:' + x + '%;top:' + y + '%;--x:' + x + ';--y:' + y + '" title="' + esc(p.name) + '" aria-label="' + esc(p.name + ', ' + p.pos + ', ' + t.name) + '" onclick="showPlayerMatchStats(' + id + ')">' +
                    '<span class="pp-dot" style="--pc:' + cols[ti] + ';color:' + ink(cols[ti]) + '">' + esc(p.pos) + '<span class="pp-b"></span></span>' +
                    '<span class="pp-rate rating-good">6.5</span><span class="pp-name">' + esc(lastName(p.name)) + '</span></button>';
            });
        });
        pv.innerHTML = html; pitchKey = key;
        return true;
    }
    function updatePitch() {
        if (!ensurePitch()) return;
        var btns = $('pitch-view').querySelectorAll('.pp');
        for (var i = 0; i < btns.length; i++) {
            var b = btns[i], id = parseInt(b.getAttribute('data-id'));
            var rating = (matchData.ratings && matchData.ratings[id] !== undefined) ? matchData.ratings[id] : 6.5;
            var st = (matchData.playerMatchStats && matchData.playerMatchStats[id]) || {};
            var rEl = b.querySelector('.pp-rate');
            var txt = rating.toFixed(1), cls = 'pp-rate ' + ratingClass(rating);
            if (rEl.textContent !== txt) rEl.textContent = txt;
            if (rEl.className !== cls) rEl.className = cls;
            b.classList.toggle('off', !!isSentOff(id));
            var sig = (st.goals || 0) + '|' + (st.yellow || 0) + '|' + (st.red || 0);
            if (b.getAttribute('data-sig') !== sig) {
                b.setAttribute('data-sig', sig);
                var bEl = b.querySelector('.pp-b');
                bEl.innerHTML = (st.goals > 0 ? icon('ab') + (st.goals > 1 ? '<sup>' + st.goals + '</sup>' : '') : '') +
                    (st.yellow > 0 ? '<i class="card-chip y"></i>' : '') + (st.red > 0 ? '<i class="card-chip r"></i>' : '');
            }
        }
    }
    after('renderLineups', updatePitch);

    // -- istatistik çubukları --
    var STAT_KEYS = ['xg', 'shots', 'sot', 'pass', 'corners', 'offsides', 'fouls'];
    var STAT_IDS = { xg: 'xg', shots: 'shots', sot: 'sot', pass: 'pass', corners: 'corners', offsides: 'offside', fouls: 'fouls' };
    after('updateStatUI', function () {
        if (!matchData.hStats || !matchData.aStats) return;
        STAT_KEYS.forEach(function (k) {
            var hv = matchData.hStats[k] || 0, av = matchData.aStats[k] || 0, sum = hv + av;
            var bar = document.querySelector('.cmp-bar[data-k="' + k + '"]');
            if (bar) {
                bar.classList.toggle('zero', sum === 0);
                var hp = sum ? (hv / sum * 100) : 50;
                bar.children[0].style.width = hp.toFixed(1) + '%'; bar.children[1].style.width = (100 - hp).toFixed(1) + '%';
            }
            var he = $('stat-' + STAT_IDS[k] + '-home'), ae = $('stat-' + STAT_IDS[k] + '-away');
            if (he) he.classList.toggle('dim', hv < av); if (ae) ae.classList.toggle('dim', av < hv);
        });
    });

    /* =====================================================================
       KRİTİK ANLAR — Football Manager mantığında iki taraflı olay akışı
       Listelenen TEK türler: gol (+ asist), sarı kart, kırmızı kart, VAR'ın iptal ettiği gol, VAR'ın verdiği gol / penaltı.
       Ev sahibi solda, deplasman sağda, ortada dakika. Şut, kurtarış, korner, ofsayt, faul, kaçan penaltı gibi başka HİÇBİR olay listelenmez.
       Kaynak motorun kendi kaydı (matchData.highlights): her kayda yalnızca yukarıdaki türlerdense bir "km" nesnesi eklenir, liste yalnızca km taşıyanları çizer.
       Klasik motor metin yazar; bu yüzden km, metinden ve VAR sonucundan türetilir (motor betiği değişmez). Canlı 2D köprüsü km'yi doğrudan verir (ado.km.next).
       km = { k: 'goal'|'yellow'|'red'|'varno', s: 0 ev | 1 deplasman, n: oyuncu, a: asist, pen, fk, cor, og, y2 (ikinci sarı), v: VAR etiketi, why: iptal nedeni, b: dakika, x: ilave süre }
       ===================================================================== */
    var KM = { next: null, pending: null, has: false, sig: null, head: '', varCtx: null };
    // motorun yarıya özgü dakika sayacı (ikinci yarıda sıfırlanır) → saat dakikası; ilave süre 45'+n / 90'+n
    function kmClock(lm, half) {
        lm = Math.max(0, lm | 0);
        if (lm > 45) return { b: half === 2 ? 90 : 45, x: lm - 45 };
        return { b: Math.max(1, (half === 2 ? 45 : 0) + lm), x: 0 };
    }
    function kmClassic(team, detail, type, minOv) {
        var raw = String(detail == null ? '' : detail), ty = type || (typeof guessEventType === 'function' ? guessEventType(raw) : ''), tx = stripEmoji(raw), s = team === matchData.a ? 1 : 0, m, mm;
        var clk = (minOv != null) ? { b: Math.max(1, minOv | 0), x: 0 } : kmClock(matchData.lastSimulatedMinute, matchData.currentHalf);
        var ctx = KM.varCtx; KM.varCtx = null;
        if (ctx && ctx.n !== (matchData.highlights || []).length) ctx = null;              // VAR sonucundan sonra başka kayıt düştüyse bağ kopar
        if (ty === 'goal') {
            m = /^(.+?)(?:\s+\(([^()]*)\))?$/.exec(tx); if (!m) return null;
            var k = { k: 'goal', s: s, n: m[1], a: '', pen: false, fk: false, cor: false, og: false, v: null, b: clk.b, x: clk.x }, tail = m[2] || '';
            if (/^P$/.test(tail)) k.pen = true; else if (/^Frikik$/i.test(tail)) k.fk = true;
            else if ((mm = /^Asist:\s*(.+)$/.exec(tail))) k.a = mm[1]; else if ((mm = /^Korner Asisti:\s*(.+)$/.exec(tail))) { k.a = mm[1]; k.cor = true; }
            if (ctx && ((ctx.kind === 'goal' && ctx.outcome === 'confirmed' && !k.pen) || (ctx.kind === 'penalty' && ctx.outcome === 'awarded' && k.pen))) k.v = k.pen ? 'pen' : 'goal';
            return k;
        }
        if (ty === 'card-yellow') { m = /^Sarı Kart\s*-\s*(.+)$/.exec(tx); return m ? { k: 'yellow', s: s, n: m[1], b: clk.b, x: clk.x } : null; }
        if (ty === 'card-red') { m = /^(.+?)\s+-\s+(.+)$/.exec(tx); return m ? { k: 'red', s: s, n: m[2], y2: /İkinci Sarı/.test(m[1]), v: /VAR/.test(m[1]) ? 'red' : null, b: clk.b, x: clk.x } : null; }
        if (ty === 'var') { m = /^İptal Edilen Gol \(VAR\)\s*-\s*(.+)$/.exec(tx); return m ? { k: 'varno', s: s, n: m[1], why: 'ofsayt', b: clk.b, x: clk.x } : null; }
        return null;
    }
    var KM_WHY = { ofsayt: 'ofsayt', faul: 'hücum faulü', el: 'elle oynama' };
    function kmLabel(k) { return k.b + '\'' + (k.x ? '+' + k.x : ''); }
    function kmIcon(k) {
        if (k.k === 'goal') return '<span class="km-ic">' + icon('ab') + '</span>';
        if (k.k === 'yellow') return '<span class="km-ic"><i class="km-card y"></i></span>';
        if (k.k === 'red') return '<span class="km-ic"><i class="km-card ' + (k.y2 ? 'yr' : 'r') + '"></i></span>';
        return '<span class="km-ic no">' + icon('i-var') + '</span>';
    }
    // satır açıklaması: [isim, alt satır, VAR etiketi]
    function kmParts(k) {
        var sub = '', chip = '';
        if (k.k === 'goal') {
            if (k.og) sub = 'Kendi kalesine';
            else if (k.a) sub = 'Asist: ' + k.a + (k.cor ? ' (korner)' : '');
            else if (k.pen) sub = 'Penaltı';
            else if (k.fk) sub = 'Serbest vuruş';
            if (k.v === 'goal') chip = 'VAR: gol verildi'; else if (k.v === 'pen') chip = 'VAR: penaltı verildi';
        } else if (k.k === 'yellow') sub = 'Sarı kart';
        else if (k.k === 'red') { sub = k.y2 ? 'İkinci sarıdan kırmızı kart' : 'Kırmızı kart'; if (k.v) chip = 'VAR: kırmızı kart'; }
        else { sub = KM_WHY[k.why] || k.why || ''; sub = sub ? sub.charAt(0).toLocaleUpperCase('tr') + sub.slice(1) : ''; if (k.cm) sub += ' · ' + k.cm + ' cm'; chip = 'VAR: gol iptal'; }
        return [k.n, sub, chip];
    }
    function kmEvent(k) {
        var p = kmParts(k), tx = '<span class="km-tx"><b class="km-nm">' + esc(p[0]) + '</b>' + (p[1] ? '<span class="km-sub">' + esc(p[1]) + '</span>' : '') + (p[2] ? '<em class="km-chip">' + esc(p[2]) + '</em>' : '') + '</span>';
        return '<div class="km-ev">' + (k.s ? kmIcon(k) + tx : tx + kmIcon(k)) + '</div>';
    }
    function kmRow(k, score, teamName) {
        var p = kmParts(k), ev = kmEvent(k), aria = kmLabel(k) + ' ' + teamName + ': ' + ({ goal: 'Gol', yellow: 'Sarı kart', red: 'Kırmızı kart', varno: 'Gol iptal (VAR)' }[k.k]) + ' ' + p[0] + (p[1] ? ', ' + p[1] : '') + (p[2] && k.k !== 'varno' ? ', ' + p[2] : '') + (score ? ', skor ' + score : '');
        return '<div class="km-row k-' + k.k + ' s' + k.s + (k.v ? ' has-var' : '') + '" role="listitem" aria-label="' + esc(aria) + '"><div class="km-l">' + (k.s ? '' : ev) + '</div><div class="km-c"><b class="km-min">' + esc(kmLabel(k)) + '</b>' + (score ? '<span class="km-sc">' + score + '</span>' : '') + '</div><div class="km-r">' + (k.s ? ev : '') + '</div></div>';
    }
    function kmHead() {
        var h = matchData && matchData.h, a = matchData && matchData.a; if (!h || !a) return;
        var key = h.name + '\u0001' + a.name; if (KM.head === key) return; KM.head = key;
        var hn = $('km-hname'), an = $('km-aname'); if (hn) hn.textContent = h.name; if (an) an.textContent = a.name;
    }
    G.renderHighlightsList = function () {
        var list = $('fm-events-list'); if (!list) return;
        var hs = matchData.highlights || [];
        if (KM.has && hs.length) { hs[0].km = KM.pending || null; }                       // addHighlight'ın hemen ardından: az önce eklenen kayıt sınıflandırılır
        KM.has = false; KM.pending = null;
        kmHead();
        var ks = kmList(), i;
        var sig = ks.length + '|' + (ks.length ? kmLabel(ks[0]) + '|' + ks[0].k + '|' + ks[0].n : '');
        if (sig === KM.sig) return;
        KM.sig = sig;
        if (!ks.length) { list.innerHTML = '<div class="fm-event-empty">Henüz olay yok. Goller, kartlar ve VAR kararları burada görünür.</div>'; return; }
        var sc = [0, 0], out = new Array(ks.length), k, s;
        for (i = ks.length - 1; i >= 0; i--) {                                              // skor: en eski olaydan yeniye doğru (kendi kalesine gol rakibe yazılır)
            k = ks[i]; s = '';
            if (k.k === 'goal') { sc[k.s]++; s = sc[0] + '–' + sc[1]; }
            out[i] = kmRow(k, s, k.s ? matchData.a.name : matchData.h.name);
        }
        list.innerHTML = out.join('');
    };
    /* [v187] çerçeve maçı yeniden kurunca (yeni sim, ör. motor yeniden başlatıldı) eski simin gol kayıtları yuva/ad karışır, defterin ürettiği
       goller listeye hiç düşmeyebilir. Bu durumda gol satırlarının tek kaynağı oyunun gol defteri (V177 → FX.gl): taraf, golcü, asist, dakika
       oradan; kart ve VAR iptali satırları motor kaydından kalır. Görüntüden önce gelmesin diye maç bitene dek yalnız görünen dakikaya kadarki goller. */
    function kmSrcGoals() {
        try {
            var P = G.parent; if (!P || P === G) return null;
            var A = P.ABM, V = P.V177; if (!A || A.win !== G || !A.fx || !V || !(V.rb > 0) || V.mid == null || (P.PL3 && V.mid !== P.PL3.mid)) return null;
            var gl = A.fx.gl; if (!Array.isArray(gl)) return null;
            var lm = Math.max(0, matchData.lastSimulatedMinute | 0), cur = matchData.currentHalf === 2 && lm <= 45 ? 45 + lm : lm, fin = !!(A.done || V.settled || (A.sim && A.sim.finished));
            var out = [], i, g, m;
            for (i = 0; i < gl.length; i++) { g = gl[i]; if (!g) continue; m = Math.max(1, g.m | 0); if (!fin && m > cur) continue;
                out.push({ k: 'goal', s: g.s === A.s0 ? 0 : 1, n: String(g.n || ''), a: String(g.an || ''), pen: !!g.pen, fk: false, cor: false, og: !!g.own, v: null, b: Math.min(m, 90), x: Math.max(0, m - 90), src: 'v177' }); }
            return out;
        } catch (e) { return null; }
    }
    function kmList() {      // listelenecek kritik anlar (en yeni başta)
        var hs = matchData.highlights || [], ks = [], i;
        for (i = 0; i < hs.length; i++) if (hs[i].km) ks.push(hs[i].km);
        var src = kmSrcGoals(); if (!src) return ks;
        var old = ks.filter(function (k) { return k.k === 'goal'; }), used = [];
        src.forEach(function (k) { for (var j = 0; j < old.length; j++) { var o = old[j]; if (used[j] || o.s !== k.s || o.n !== k.n) continue; used[j] = 1; k.v = o.v || null; k.fk = !!o.fk; k.cor = !!o.cor; if (!k.a && o.a) k.a = o.a; break; } });      // VAR etiketi, frikik/korner bilgisi korunur
        var all = ks.filter(function (k) { return k.k !== 'goal'; }).concat(src), ix = all.map(function (k, j) { return j; });
        ix.sort(function (p, q) { var a = all[p], b = all[q], d = (b.b + (b.x || 0)) - (a.b + (a.x || 0)); return d || (p - q); });
        return ix.map(function (j) { return all[j]; });
    }
    function kmReset() { KM.sig = null; KM.next = null; KM.pending = null; KM.has = false; KM.varCtx = null; KM.head = ''; }
    before('addHighlight', function (team, detail, type, minOv) {
        var k = KM.next; KM.next = null;
        if (!k) { try { k = kmClassic(team, detail, type, minOv); } catch (e) { warn('kritik an', e); k = null; } }
        KM.pending = k; KM.has = true;
    });
    // VAR incelemesinin sonucu (motor rastgele belirler): hemen ardından gelen gol/penaltı kaydına "VAR: gol/penaltı verildi" etiketi için saklanır
    (function () {
        var orig = G.playVarReview; if (typeof orig !== 'function') { warn('eksik fonksiyon', 'playVarReview'); return; }
        G.playVarReview = function (kind) {
            var r = orig.apply(this, arguments);
            return Promise.resolve(r).then(function (out) { try { KM.varCtx = { kind: kind, outcome: out, n: (matchData.highlights || []).length }; } catch (e) { warn('VAR sonucu', e); } return out; });
        };
    })();
    // köprü (2D) ve testler
    ado.km = {
        next: function (k) { KM.next = k || null; },
        rows: function () { return kmList(); },
        kinds: ['goal', 'yellow', 'red', 'varno'], label: kmLabel, classify: kmClassic, clock: kmClock
    };

    // -- Anlatım: motorun canlı ticker metinlerinin oturum içi arşivi --
    var cmCount = 0;
    function clearCommentary() { var l = $('commentary-list'); if (l) l.innerHTML = '<div class="fm-event-empty">Anlatım maç başlayınca akar...</div>'; cmCount = 0; }
    after('addTicker', function (_, args) {
        var l = $('commentary-list'); if (!l) return;
        var txt = String(args[0] || '').replace(/<\/?[^>]+(>|$)/g, '');
        var t = ($('match-time') && $('match-time').textContent) || '';
        var m = t.split(':')[0] + '\'';
        if (cmCount === 0) l.innerHTML = '';
        var row = document.createElement('div'); row.className = 'cm-row';
        row.innerHTML = '<span class="m">' + esc(m) + '</span><span>' + esc(txt) + '</span>';
        l.insertBefore(row, l.firstChild); cmCount++;
        if (l.children.length > 150) l.removeChild(l.lastChild);
    });
    after('resetMatchStats', function () { clearCommentary(); kmReset(); });
    /* [ui26] ondalık ayırıcı: görüntüde Türkçe virgül (motor değerleri değişmez) */
    function trDec(el) { if (el && /^-?\d+\.\d+$/.test(el.textContent)) el.textContent = el.textContent.replace('.', ','); }
    after('updateStatUI', function () { trDec($('stat-xg-home')); trDec($('stat-xg-away')); });
    after('showMatchSummary', function () { [].forEach.call(document.querySelectorAll('#summary-stats-rows .stat-val'), trDec); });
    after('startMatch', function () { try { if (!(G.ado2d && G.ado2d.active && G.ado2d.active()) && matchData && !matchData.isFinished) G.renderHighlightsList(); } catch (e) { warn('kritik an başlangıç', e); } });    // ilk kritik ana kadar boş durum metni: maç başladı

    // -- canlı etiketi / dönem etiketi --
    function uiTick() {
        if (!document.body.classList.contains('match-mode') || !matchData || !matchData.h) return;
        var md = matchData, started = md.currentTimeMs > 0 || md.currentHalf === 2 || md.isFinished;
        var ht = $('halftime-overlay') && $('halftime-overlay').classList.contains('active');
        var running = (matchInterval !== null || !!(G.ado2d && G.ado2d.running())) && !md.isFinished;
        var tag = $('live-tag'), lt = tag && tag.querySelector('.lt'), pt = $('period-tag');
        var label, period;
        if (md.isFinished) { label = 'MAÇ SONU'; period = 'Maç sona erdi'; }
        else if (ht) { label = 'DEVRE ARASI'; period = 'Devre arası'; }
        else if (!started) { label = 'MAÇ ÖNCESİ'; period = 'Başlamadı'; }
        else if (!running) { label = 'DURAKLATILDI'; period = md.currentHalf === 2 ? '2. yarı' : '1. yarı'; }
        else { label = 'CANLI'; period = md.currentHalf === 2 ? '2. yarı' : '1. yarı'; }
        if (tag) tag.classList.toggle('on', label === 'CANLI');
        if (lt && lt.textContent !== label) lt.textContent = label;
        var sbt = $('btn-start-match'); if (sbt && md.isFinished && !md.isTournamentMatch && sbt.textContent !== 'Yeniden oyna') sbt.textContent = 'Yeniden oyna';   // bitmiş maçta "Devam Et" yanıltıcı (tıklayınca maç baştan oynar)
        var skb = $('v2d-skip'); if (skb && skb.disabled !== !running) skb.disabled = !running;
        if (pt && pt.textContent !== period) pt.textContent = period;
        var es = $('eng-seg'), esh = started && !md.isFinished; if (es && es.hidden !== esh) es.hidden = esh;        // [ui22] maç sürerken motor değişmez: seçici gizli ("CANLI" durum hapıyla karışmasın)
        var shf = $('speed-half'), cl = !document.body.classList.contains('eng-2d');
        if (shf && shf.disabled !== cl) { shf.disabled = cl; shf.title = cl ? 'Yavaş çekim yalnız Canlı (2B/3B) maçta' : 'Yavaş çekim: maçı yarı hızla izle'; }
    }
    setInterval(uiTick, 250);

    // -- maç kurulumu --
    after('setupMatchView', function () {
        setPair($('match-screen'), matchData.h, matchData.a);
        clearCommentary(); ado.tl('key'); kmHead();
        var pv = prefGet().view; ado.view(pv === 'list' ? 'list' : 'pitch');
        uiTick();
    });

    // -- gol kaplaması: skor ve arma --
    before('showGoalEffect', function (playerName, teamName) {
        var h = matchData.h, a = matchData.a;
        $('gol-score-text').textContent = h.name + '  ' + matchData.hStats.goals + ' – ' + matchData.aStats.goals + '  ' + a.name;
        var team = teamName === h.name ? h : a;
        $('gol-crest').innerHTML = renderTeamCrestHTML(team, 72, true);
    });
    // -- devre arası: gerçek maç istatistikleri --
    /* [ui2] yayın kartı yardımcıları (devre arası + maç sonu): armalı skor şeridi, golcüler, çubuklu istatistik */
    function bcCrest(t, n) { try { return renderTeamCrestHTML(t, n || 52, false); } catch (e) { return ''; } }
    function bcScorers(t) {
        var st = matchData.playerMatchStats || {}, out = [];
        ((t && t.squad) || []).forEach(function (id) { var s = st[id], p; if (s && s.goals && (p = getPlayerFromId(id))) out.push(esc(p.name) + (s.goals > 1 ? ' <b>×' + s.goals + '</b>' : '')); });
        return out.join(', ');
    }
    var BC_STATS = [['pos', 'Topa sahip olma', function (v) { return '%' + v; }], ['xg', 'Gol beklentisi (xG)', function (v) { return (+v || 0).toFixed(2).replace('.', ','); }], ['shots', 'Şut'], ['sot', 'İsabetli şut'], ['corners', 'Korner'], ['offsides', 'Ofsayt'], ['fouls', 'Faul']];
    function bcStatsHTML(keys) {
        var h = matchData.hStats || {}, a = matchData.aStats || {};
        return BC_STATS.filter(function (s) { return !keys || keys.indexOf(s[0]) >= 0; }).map(function (s, i) {
            var hv = +h[s[0]] || 0, av = +a[s[0]] || 0, f = s[2] || String, t = hv + av, hp = t > 0 ? Math.round(hv / t * 100) : 50;
            return '<div class="bc-stat' + (hv > av ? ' hl' : av > hv ? ' al' : '') + '" style="--i:' + i + '"><span class="v h">' + f(hv) + '</span><span class="l">' + s[1] + '</span><span class="v a">' + f(av) + '</span><span class="bar" aria-hidden="true"><i class="h" style="width:' + hp + '%"></i><i class="a" style="width:' + (100 - hp) + '%"></i></span></div>';
        }).join('');
    }
    /* [bc] modern skor tabelası: takım rengi yıkamalı şerit, cam skor kutuları, İY/MS saati, dakikalı golcüler, kırmızı kart rozetleri, zaman çizgisi */
    function bcShortName(n) { var w = String(n == null ? '' : n).trim().split(' ').filter(Boolean); return w.length > 1 ? w[0].charAt(0) + '. ' + w.slice(1).join(' ') : w.join(' '); }
    function bcMin(k) { return k.b + (k.x ? '+' + k.x : '') + "'"; }
    function bcEvents() {      // anahtar an kayıtları (km): goller ve kırmızı kartlar, kronolojik
        var ev = { g: [[], []], r: [[], []] };
        (matchData.highlights || []).slice().reverse().forEach(function (x) { var k = x && x.km; if (!k || (k.s !== 0 && k.s !== 1)) return; if (k.k === 'goal') ev.g[k.s].push(k); else if (k.k === 'red') ev.r[k.s].push(k); });
        return ev;
    }
    function bcGoalRows(t, s, ev, goals) {
        var L = ev.g[s], by = [], ix = {};
        if (!L.length) { var old = goals > 0 ? bcScorers(t) : ''; return old ? '<span class="g">' + icon('ab') + '<span class="nm">' + old + '</span></span>' : ''; }      // km kaydı yoksa eski özet
        L.forEach(function (k) { var nm = bcShortName(k.n), key = nm + (k.og ? '|kk' : ''); if (ix[key] == null) { ix[key] = by.length; by.push({ n: nm, og: !!k.og, m: [] }); } by[ix[key]].m.push(bcMin(k) + (k.pen ? ' (P)' : '')); });
        return by.map(function (g) { return '<span class="g">' + icon('ab') + '<b>' + esc(g.n) + (g.og ? ' (KK)' : '') + '</b><em>' + esc(g.m.join(', ')) + '</em></span>'; }).join('');
    }
    function bcTimeline(ev, end) {
        var mk = '', at = function (k) { return (Math.min(k.b, 90) / .9).toFixed(1); };
        [0, 1].forEach(function (s) {
            var c = s ? 'a' : 'h';
            ev.g[s].forEach(function (k) { mk += '<b class="mk ' + c + '" style="left:' + at(k) + '%"></b>'; });
            ev.r[s].forEach(function (k) { mk += '<b class="mk rc ' + c + '" style="left:' + at(k) + '%"></b>'; });
        });
        return '<div class="bc-tl" aria-hidden="true"><div class="bc-tl-bar"><i class="fill" style="width:' + (end >= 90 ? 100 : 50) + '%"></i><i class="half"></i>' + mk + '</div><div class="bc-tl-lab"><span>0' + "'" + '</span><span>45' + "'" + '</span><span>90' + "'" + '</span></div></div>';
    }
    // o: { end: 45 | 90, per: 'İY' | 'MS', ids: maç sonu kartının eski kimlikleri (özgün showMatchSummary bunlara yazar) }
    function bcFillScore(el, o) {
        if (!el || !matchData.h || !matchData.a) return;
        o = o || {};
        var h = matchData.h, a = matchData.a, hg = +(matchData.hStats || {}).goals || 0, ag = +(matchData.aStats || {}).goals || 0, ev = bcEvents(), end = o.end || 45, inj = +matchData.injuryMinutes || 0;
        var id = function (x) { return o.ids ? ' id="' + x + '"' : ''; };
        var team = function (t, s) {
            var nm = String(t.name == null ? '' : t.name), lw = Math.max.apply(null, nm.split(' ').map(function (w) { return w.length; }).concat(0)), sz = lw > 16 ? ' class="xl"' : lw > 12 || nm.length > 18 ? ' class="l"' : '';      // uzun adlar küçülür, harf ortasından bölünmez
            var rc = ev.r[s].map(function (k) { return '<i class="bc-rc" title="' + esc('Kırmızı kart: ' + k.n + ' ' + bcMin(k)) + '"></i>'; }).join('');
            return '<div class="bc-team ' + (s ? 'a' : 'h') + '"><span class="bc-crest"' + id(s ? 'sum-crest-a' : 'sum-crest-h') + '>' + bcCrest(t, 64) + '</span><b' + id(s ? 'summary-away-name' : 'summary-home-name') + sz + '>' + esc(t.name) + '</b><small><span>' + (s ? 'Deplasman' : 'Ev sahibi') + '</span>' + rc + '</small></div>';
        };
        var dg = function (v, s, d) { return '<span class="bc-d ' + (s ? 'a' : 'h') + (d > 0 ? ' win' : d < 0 ? ' lose' : '') + '"' + id(s ? 'summary-away-score' : 'summary-home-score') + '>' + v + '</span>'; };
        var gh = bcGoalRows(h, 0, ev, hg), ga = bcGoalRows(a, 1, ev, ag);
        el.innerHTML = team(h, 0) + '<div class="bc-board"><div class="bc-digits">' + dg(hg, 0, hg - ag) + '<span class="bc-sep" aria-hidden="true"></span>' + dg(ag, 1, ag - hg) + '</div><span class="bc-per"><b>' + esc(o.per || 'İY') + '</b><span>' + end + (inj ? '+' + inj : '') + "'" + '</span></span></div>' + team(a, 1) +
            (gh || ga ? '<div class="bc-sc h"' + id('sum-sc-h') + '>' + gh + '</div><div class="bc-sc a"' + id('sum-sc-a') + '>' + ga + '</div>' : '') + bcTimeline(ev, end);
        el.classList.toggle('nog', !(gh || ga));
    }
    function bcScoreHTML_eski() {
        var h = matchData.h, a = matchData.a;
        return '<div class="bc-team h"><span class="bc-crest">' + bcCrest(h) + '</span><b>' + esc(h.name) + '</b></div><div class="bc-num"><span>' + matchData.hStats.goals + '</span><i>-</i><span>' + matchData.aStats.goals + '</span></div><div class="bc-team a"><b>' + esc(a.name) + '</b><span class="bc-crest">' + bcCrest(a) + '</span></div>' +
            '<div class="bc-sc h">' + bcScorers(h) + '</div><div class="bc-sc a">' + bcScorers(a) + '</div>';
    }
    // -- devre arası: yayın kartı (gerçek maç istatistikleri) --
    after('triggerHalfTime', function () {
        try { setPair($('halftime-overlay'), matchData.h, matchData.a); } catch (e) { }
        bcFillScore($('ht-score'), { end: 45, per: 'İY' });
        $('halftime-stats').innerHTML = bcStatsHTML(['pos', 'xg', 'shots', 'sot', 'corners', 'fouls']);
    });
    // -- maç sonu: armalar, golcüler, çubuklu istatistik --
    after('showMatchSummary', function () {
        var m = $('match-summary-modal'); if (!m || !matchData.h || !matchData.a) return;
        try { setPair(m, matchData.h, matchData.a); } catch (e) { }
        bcFillScore(m.querySelector('.bc-score'), { end: 90, per: 'MS', ids: true });      // [bc] modern tabela (eski kimlikler korunur)
        if ($('summary-stats-rows')) $('summary-stats-rows').innerHTML = bcStatsHTML();
    });
    // -- canlı maçta eylem katmanı (kırmızı kart vb.) sahnenin üstünde alt bant; klasikte sayfanın üstünde tam katman --
    function placeAction() {
        var ov = $('action-overlay'), cv = $('cv2d'), wrap = cv && cv.parentNode; if (!ov || !wrap) return;
        var live = !!(G.ado2d && G.ado2d.active && G.ado2d.active()) && !!wrap.offsetParent;
        if (live) { if (ov.parentNode !== wrap) wrap.appendChild(ov); }
        else if (ov.parentNode !== document.body) document.body.appendChild(ov);
    }
    ['showActionOverlay', 'playVarReview', 'playOutcomeReveal'].forEach(function (n) { before(n, placeAction); });

    /* =====================================================================
       SON GELİŞMELER kancaları (yalnızca okur)
       ===================================================================== */
    after('addHighlight', function () {
        var h = (matchData.highlights || [])[0]; if (!h) return;
        if (h.type === 'goal') pushFeed('goal', h.min + '\' ' + stripEmoji(h.detail) + ' — ' + h.team, 'Canlı maç');
        else if (h.type === 'card-red') pushFeed('red', h.min + '\' Kırmızı kart — ' + stripEmoji(h.detail) + ' (' + h.team + ')', 'Canlı maç');
    });
    function streakOf(t) {
        var f = (t && t.form) || []; if (!f.length) return null;
        var last = f[f.length - 1], n = 0;
        for (var i = f.length - 1; i >= 0 && f[i] === last; i--) n++;
        return { r: last, n: n };
    }
    after('resolveFixtureResult', function (_, args) {
        var fix = args[0], hg = args[1], ag = args[2];
        pushFeed('result', fix.h.name + ' ' + hg + '–' + ag + ' ' + fix.a.name, 'Hafta ' + fix.week);
        lastMatch = { h: fix.h, a: fix.a, hg: hg, ag: ag, ctx: 'Turnuva · Hafta ' + fix.week, motm: null };
        [fix.h, fix.a].forEach(function (ft) {
            var t = tTeams.filter(function (x) { return x.tId === ft.tId; })[0]; if (!t) return;
            var s = streakOf(t);
            if (s && s.n >= 3 && s.r === 'W') pushFeed('form', t.name + ' üst üste ' + s.n + ' maç kazandı', 'Form');
            if (s && s.n >= 3 && s.r === 'L') pushFeed('form', t.name + ' üst üste ' + s.n + ' maç kaybetti', 'Form');
        });
    });
    after('showMatchSummary', function () {
        var m = null; try { m = computeMOTM(); } catch (e) { }
        if (!matchData.isTournamentMatch) {
            pushFeed('result', matchData.h.name + ' ' + matchData.hStats.goals + '–' + matchData.aStats.goals + ' ' + matchData.a.name, 'Hızlı maç');
            lastMatch = { h: matchData.h, a: matchData.a, hg: matchData.hStats.goals, ag: matchData.aStats.goals, ctx: 'Hızlı maç', motm: m };
        } else if (lastMatch) { lastMatch.motm = m; }
    });
    after('confirmTournamentStart', function () { prevLeader = null; champLogged = false; pushFeed('tour', 'Turnuva başladı: ' + tTeams.length + ' takım', 'Turnuva'); });
    after('renderTourney', function () {
        if (!tTeams.length) return;
        var lead = tTeams[0];
        if (lead.pl > 0) {
            if (prevLeader && prevLeader !== lead.name) pushFeed('leader', lead.name + ' zirveye yükseldi (' + lead.p + ' puan)', 'Turnuva');
            prevLeader = lead.name;
        }
    });
    after('showChampionCelebration', function (_, args) {
        if (champLogged) return; champLogged = true;
        pushFeed('leader', args[0].name + ' şampiyon oldu', 'Turnuva');
    });
    after('endTournament', function () { if (!tourneyActive) { prevLeader = null; champLogged = false; } });

    /* =====================================================================
       Erişilebilirlik: tıklanabilir ama odaklanamayan öğelere klavye desteği
       ===================================================================== */
    var NATIVE = { BUTTON: 1, A: 1, INPUT: 1, SELECT: 1, TEXTAREA: 1, LABEL: 1, SUMMARY: 1 };
    function enhance(node) {
        if (!node || node.nodeType !== 1) return;
        var els = [];
        if (node.hasAttribute && node.hasAttribute('onclick')) els.push(node);
        if (node.querySelectorAll) { var q = node.querySelectorAll('[onclick]'); for (var i = 0; i < q.length; i++) els.push(q[i]); }
        els.forEach(function (n) {
            if (NATIVE[n.tagName] || n.hasAttribute('tabindex')) return;
            n.setAttribute('tabindex', '0');
            if (n.tagName !== 'TR' && n.tagName !== 'TH') n.setAttribute('role', 'button');
        });
    }
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var t = e.target;
        if (!t || !t.matches || NATIVE[t.tagName]) return;
        if (t.hasAttribute('onclick') && t.hasAttribute('tabindex')) { e.preventDefault(); t.click(); }
    });
    try {
        new MutationObserver(function (muts) {
            for (var i = 0; i < muts.length; i++) for (var j = 0; j < muts[i].addedNodes.length; j++) enhance(muts[i].addedNodes[j]);
        }).observe(document.body, { childList: true, subtree: true });
    } catch (e) { warn('observer', e); }

    /* =====================================================================
       Oyuncu veritabanı: düzenleme ekranındaki emoji simgeleri (Faul Eğilimi, Liderlik) ve tablo başlıkları temiz kalır.
       Bu etiketler motor betiğinde şablon olarak üretilir (motor bayt-aynı kalır), bu yüzden yalnızca görüntü katmanında temizlenir.
       Yalnızca bu iki kapsayıcı izlenir; maç metinlerindeki emojiler (olay türü tespitinde kullanılır) olduğu gibi kalır.
       ===================================================================== */
    var EMO_RANGE = '[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}\\u{FE0F}\\u{200D}]';
    var EMO_TEST = new RegExp(EMO_RANGE, 'u'), EMO_ALL = new RegExp(EMO_RANGE, 'gu');
    function cleanEmoji(root) {
        if (!root) return;
        var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, hit = [];
        while ((n = w.nextNode())) if (EMO_TEST.test(n.nodeValue)) hit.push(n);
        hit.forEach(function (t) { t.nodeValue = t.nodeValue.replace(EMO_ALL, '').replace(/^\s+/, ''); });
    }
    function guardEmoji() {
        ['edit-inputs', 'players-table-head'].forEach(function (id) {
            var el = $(id); if (!el) return;
            cleanEmoji(el);
            try { new MutationObserver(function () { cleanEmoji(el); }).observe(el, { childList: true, subtree: true }); } catch (e) { warn('emoji gözcüsü', e); }
        });
    }
    ado.cleanEmoji = cleanEmoji;

    /* [ui] Govde capinda emoji temizligi (yalniz GORUNUM). Motor metinleri ve olay turu tespiti degismez; eklenen/degisen
       metin dugumlerinde emoji dizileri silinir. Yalniz emojiden olusan simge yuvalarinda ayni anlamli SVG ikon konur. */
    var EMO_RUN = /[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\p{Variation_Selector}\p{Join_Control}]+ ?/gu;
    var EMO_HAS = /[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Variation_Selector}]/u;
    var EMO_KEEP = String.fromCharCode(0x2605, 0x2606, 0x2713, 0x2714, 0x2715, 0x2716, 0xA9, 0xAE, 0x2122, 0x2194);
    var EMO_ICON = { '26a0': 'i-alert', '1f6a8': 'i-alert', '1f7e8': 'i-card|cy', '1f7e5': 'i-card|cr', '1f6a9': 'i-flag', '1f3af': 'i-target', '1f945': 'i-goal',
        '26bd': 'i-ball', '1f9e4': 'i-glove', '274c': 'i-x', '2705': 'i-check', '1f44d': 'i-check', '1f6ab': 'i-ban', '1f5a5': 'i-var', '1f9f1': 'i-wall',
        '2b06': 'i-arrow-up', '2197': 'i-arrow-ur', '1f50a': 'i-vol', '1f507': 'i-mute', '1f3c6': 'i-trophy', '2b50': 'i-star', '1f170': 'i-assist',
        '1f947': 'i-medal', '1f948': 'i-medal', '1f949': 'i-medal', '1f4cc': 'i-dot', '25b6': 'i-play', '1f525': 'i-bolt', '26a1': 'i-bolt', '1f527': 'i-sliders',
        '1f4c5': 'i-calendar', '1f389': 'i-star', '1f4cb': 'i-news', '1f4f0': 'i-news', '1f451': 'i-crown' };
    var EMO_SLOT = '#action-icon, #btn-sound-toggle, .fm-event-icon, .award-icon, .format-card-icon, .tourney-trophy-icon, .lineup-badge';
    var EMO_SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
    function emoStrip(s) {
        return s.replace(EMO_RUN, function (m) {
            var k = ''; for (var i = 0; i < m.length; i++) if (EMO_KEEP.indexOf(m.charAt(i)) >= 0) k += m.charAt(i);
            return k ? k + (m.charAt(m.length - 1) === ' ' ? ' ' : '') : '';
        });
    }
    function emoIcon(s) {
        var m = s.match(/\p{Extended_Pictographic}/u); if (!m) return null;
        var spec = EMO_ICON[m[0].codePointAt(0).toString(16)]; if (!spec) return null;
        var p = spec.split('|'), box = document.createElement('span');
        box.innerHTML = icon(p[0], 'emo-ic' + (p[1] ? ' ' + p[1] : ''));
        return box.firstChild;
    }
    function emoText(t) {
        var v = t.nodeValue; if (!v || !EMO_HAS.test(v)) return;
        var par = t.parentNode; if (!par || par.nodeType !== 1 || EMO_SKIP[par.nodeName]) return;
        var nv = emoStrip(v);
        if (nv === v) return;
        if (!nv.trim() && par.matches && par.matches(EMO_SLOT)) { var svg = emoIcon(v); if (svg) { par.replaceChild(svg, t); return; } }
        t.nodeValue = nv;
    }
    function emoTree(root) {
        if (!root) return;
        if (root.nodeType === 3) { emoText(root); return; }
        if (root.nodeType !== 1 || EMO_SKIP[root.nodeName]) return;
        var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, hit = [];
        while ((n = w.nextNode())) if (EMO_HAS.test(n.nodeValue)) hit.push(n);
        hit.forEach(emoText);
    }
    ado.emoTree = emoTree;
    try {
        emoTree(document.body);
        new MutationObserver(function (muts) {
            for (var i = 0; i < muts.length; i++) {
                var m = muts[i];
                if (m.type === 'characterData') emoText(m.target);
                else for (var j = 0; j < m.addedNodes.length; j++) emoTree(m.addedNodes[j]);
            }
        }).observe(document.body, { childList: true, subtree: true, characterData: true });
    } catch (e) { warn('emoji temizligi', e); }

    /* =====================================================================
       Futbolcu Veritabanı: Boy / Kilo / Ten Rengi (yalnızca 3B GÖRÜNÜM - motorun
       playerDatabase/fm_players_v16 alanına HİÇ dokunmaz; ayrı depo proto/dbadapter.js
       DB2D.getAppearance/setAppearance, 3B'ye anlık yansıması build/ado3d.js
       R.refreshAppearance + build/ado2d.js ado2d.refreshAppearance köprüsü).
       Düzenleme formuna (#edit-inputs) motorun KENDİ render'ından SONRA eklenir; motorun
       kendi .edit-live-input sınıfından FARKLI bir sınıf (.apr-input) kullanıldığı için
       motorun savePlayerEdit() döngüsü bu alanları hiç görmez/dokunmaz - kaydetme burada,
       before('savePlayerEdit') kancasıyla TAMAMEN AYRI bir depoya yapılır.
       ===================================================================== */
    var APR_FALLBACK_SKIN = [[.945, .78, .64], [.878, .675, .525], [.776, .541, .384], [.635, .42, .27], [.44, .28, .19]];
    // Ten rengi paleti: TEK kaynak ado3d.js'in Ado3D.SKIN dışa aktarımı (3B'de GERÇEKTEN kullanılan renkler,
    // elle taşınan ikinci bir kopya DEĞİL). ado3d.js bu dosyadan (ado.js) SONRA yüklenir (bkz assemble.py), bu
    // yüzden Ado3D global'i yalnızca ÇAĞRI ANINDA (kullanıcı düzenleme ekranını gerçekten açtığında, tüm betikler
    // zaten yüklenmiş olur) okunur - dosya başında değil. APR_FALLBACK_SKIN yalnızca Ado3D hiç yüklenemediyse
    // (örn. betik hatası) devreye giren son çare; normal akışta hiç kullanılmaz.
    function aprSkinHex() {
        var pal = (G.Ado3D && G.Ado3D.SKIN) || APR_FALLBACK_SKIN;
        return pal.map(function (c) { return rgb2hex([c[0] * 255, c[1] * 255, c[2] * 255]); });
    }
    // seçili/seçilmemiş ten rengi yuvarlağının kenar/gölge/ölçek stili - hem İLK çizimde (HTML metni, openPlayerEdit
    // kancası) hem TIKLAMADA (canlı DOM, aprSkinApply) AYNI üç değeri üretir (satır bitişik, kazara sapmasın diye).
    function aprSkinStyleText(sel) {
        return 'border-color:' + (sel ? 'var(--primary)' : 'var(--line-2)') + ';box-shadow:' + (sel ? '0 0 0 3px var(--primary-glow)' : 'none') + ';transform:' + (sel ? 'scale(1.08)' : 'scale(1)') + ';';
    }
    function aprSkinApply(el, sel) { el.style.borderColor = sel ? 'var(--primary)' : 'var(--line-2)'; el.style.boxShadow = sel ? '0 0 0 3px var(--primary-glow)' : 'none'; el.style.transform = sel ? 'scale(1.08)' : 'scale(1)'; }
    // Ten rengi yuvarlağına tıklanınca: seçimi görsel olarak taşı + kapsayıcının data-sk'sini güncelle (kaydetme
    // anında before('savePlayerEdit') kancası buradan okur). fm_players_v16/fm_appearance_v1'e HENÜZ dokunmaz -
    // yalnızca "Kaydet"e basılınca kalıcı olur (motorun kendi stat alanlarıyla birebir aynı davranış).
    ado.aprPickSkin = function (el) {
        var wrap = el && el.parentNode; if (!wrap) return;
        var kids = wrap.querySelectorAll('.apr-skin-sw');
        for (var i = 0; i < kids.length; i++) aprSkinApply(kids[i], false);
        aprSkinApply(el, true);
        wrap.setAttribute('data-sk', el.getAttribute('data-sk'));
    };
    /* Saç stili / saç rengi / sakal (3B görünüm) ve güçlü ayak / zayıf ayak (2D/3D maç motoru) - aynı ayrı depo (fm_appearance_v1).
       Çeşitler UE sürümüyle birebir aynı: saç stili 8, saç rengi 6, sakal 3. Seçimler "Kaydet"e kadar yalnızca DOM'da tutulur. */
    var APR_HS = ['Uzun', 'Kısa', 'Kazıtılmış', 'Kel', 'Afro', 'Rasta', 'Mohikan', 'Topuz', 'Kısa afro', 'Örgü (cornrows)', 'Geriye taranmış'];
    var APR_HC = ['Siyah', 'Koyu kahve', 'Kahve', 'Açık kahve', 'Sarı', 'Kızıl'];
    var APR_HAIR_FALLBACK = [[.11, .08, .06], [.17, .114, .08], [.29, .2, .12], [.55, .42, .23], [.72, .65, .5], [.60, .27, .11]];
    var APR_WF = ['', 'Neredeyse hiç kullanmaz, kullanınca isabetsiz', 'Nadiren kullanır, isabeti düşük', 'Gerektiğinde kullanır', 'Rahat kullanır, isabeti iyi', 'İki ayaklı: iki ayağını da aynı ustalıkla kullanır'];
    function aprHairHex() { var pal = (G.Ado3D && G.Ado3D.HAIR) || APR_HAIR_FALLBACK; return pal.map(function (c) { return rgb2hex([c[0] * 255, c[1] * 255, c[2] * 255]); }); }
    function aprSeg(key, opts, cur) {
        return '<div class="seg apr-seg" data-apr="' + key + '" data-v="' + cur + '">' + opts.map(function (o) {
            return '<button type="button" class="' + (String(o[0]) === String(cur) ? 'on' : '') + '" data-v="' + o[0] + '" onclick="ado.aprPickSeg(this)">' + o[1] + '</button>';
        }).join('') + '</div>';
    }
    // yıldız: SVG (★ karakteri DEĞİL - #edit-inputs'taki emoji temizleyici U+2605'i siler)
    var APR_STAR = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2.6l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.4l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" fill="currentColor"/></svg>';
    function aprStarPaint(wrap, v) { var kids = wrap.querySelectorAll('.apr-star'); for (var i = 0; i < kids.length; i++) kids[i].style.color = (i + 1) <= v ? 'var(--gold)' : 'var(--line-2)'; var t = wrap.parentNode && wrap.parentNode.querySelector('.apr-wf-txt'); if (t) t.textContent = APR_WF[v] || ''; }
    ado.aprPickSeg = function (el) {
        var w = el && el.parentNode; if (!w) return;
        for (var i = 0; i < w.children.length; i++) w.children[i].classList.toggle('on', w.children[i] === el);
        w.setAttribute('data-v', el.getAttribute('data-v'));
    };
    ado.aprPickStar = function (el) { var w = el && el.parentNode; if (!w) return; var v = parseInt(el.getAttribute('data-v'), 10) || 3; w.setAttribute('data-wf', v); aprStarPaint(w, v); };
    ado.aprPickHair = function (el) {
        var wrap = el && el.parentNode; if (!wrap) return;
        var kids = wrap.querySelectorAll('.apr-hair-sw');
        for (var i = 0; i < kids.length; i++) aprSkinApply(kids[i], false);
        aprSkinApply(el, true);
        wrap.setAttribute('data-hc', el.getAttribute('data-hc'));
    };
    after('openPlayerEdit', function (_, args) {
        // NOT: playerDatabase motorda "let" ile tanımlı (window.playerDatabase YOK) - bu yüzden G.playerDatabase
        // DEĞİL, motorun kendi erişimcisi getPlayerFromId(id) kullanılır (bkz ovrOf, bu dosyada aynı desen).
        var id = args[0], p = typeof getPlayerFromId === 'function' ? getPlayerFromId(id) : null;
        var host = $('edit-inputs'); if (!p || !host || !G.DB2D) return;
        var cur = DB2D.getAppearance(p) || { h: 180, w: 75, sk: 0, hs: 1, hc: 0, bd: 0, ft: 'R', wf: 3 };
        var sw = aprSkinHex().map(function (hx, i) {
            return '<button type="button" class="apr-skin-sw" data-sk="' + i + '" onclick="ado.aprPickSkin(this)" aria-label="Ten rengi ' + (i + 1) + '" ' +
                'style="width:30px;height:30px;border-radius:50%;padding:0;cursor:pointer;background:' + hx + ';border:2px solid;' + aprSkinStyleText(i === cur.sk) + '"></button>';
        }).join('');
        var hw = aprHairHex().map(function (hx, i) {
            return '<button type="button" class="apr-hair-sw" data-hc="' + i + '" onclick="ado.aprPickHair(this)" title="' + APR_HC[i] + '" aria-label="Saç rengi: ' + APR_HC[i] + '" ' +
                'style="width:30px;height:30px;border-radius:50%;padding:0;cursor:pointer;background:' + hx + ';border:2px solid;' + aprSkinStyleText(i === cur.hc) + '"></button>';
        }).join('');
        var stars = ''; for (var s = 1; s <= 5; s++) stars += '<button type="button" class="apr-star" data-v="' + s + '" onclick="ado.aprPickStar(this)" aria-label="Zayıf ayak ' + s + ' yıldız" style="background:none;border:none;padding:2px;cursor:pointer;line-height:0;color:' + (s <= cur.wf ? 'var(--gold)' : 'var(--line-2)') + ';">' + APR_STAR + '</button>';
        var sub = function (t) { return '<span style="display:block;font-size:.72rem;color:var(--text-muted);margin-bottom:6px;">' + t + '</span>'; };
        var box = document.createElement('div');
        box.className = 'form-group'; box.id = 'apr-edit-box'; box.style.gridColumn = '1/-1';
        box.innerHTML =
            '<label>Görünüm <span style="font-size:.72rem;color:var(--text-muted);font-weight:400;text-transform:none;letter-spacing:0;">(yalnızca 3B görünümü etkiler)</span></label>' +
            '<div class="apr-row" style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;margin-bottom:4px;">' +
            '<div class="apr-pv-host" style="flex:0 0 auto;"></div>' +
            '<div class="apr-ctl" style="flex:1;min-width:250px;">' +
            '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px;">' +
            '<div style="flex:1;min-width:110px;">' + sub('Boy (cm)') +
            '<input type="number" class="form-control apr-input" data-apr="h" min="140" max="230" value="' + cur.h + '"></div>' +
            '<div style="flex:1;min-width:110px;">' + sub('Kilo (kg)') +
            '<input type="number" class="form-control apr-input" data-apr="w" min="35" max="160" value="' + cur.w + '"></div>' +
            '<div style="flex:1;min-width:140px;">' + sub('Saç Stili') +
            '<select class="form-control apr-input" data-apr="hs">' + APR_HS.map(function (nm, i) { return '<option value="' + i + '"' + (i === cur.hs ? ' selected' : '') + '>' + nm + '</option>'; }).join('') + '</select></div>' +
            '</div>' +
            '<div style="display:flex;gap:22px;flex-wrap:wrap;margin-bottom:12px;">' +
            '<div>' + sub('Ten Rengi') + '<div class="apr-swatches" data-sk="' + cur.sk + '" style="display:flex;gap:10px;">' + sw + '</div></div>' +
            '<div>' + sub('Saç Rengi') + '<div class="apr-hcs" data-hc="' + cur.hc + '" style="display:flex;gap:10px;">' + hw + '</div></div>' +
            '</div>' +
            '<div style="margin-bottom:16px;">' + sub('Sakal') + aprSeg('bd', [[0, 'Yok'], [1, 'Kirli sakal'], [2, 'Sakal']], cur.bd) + '</div>' +
            '</div></div>' +
            '<label>Ayak Kullanımı <span style="font-size:.72rem;color:var(--text-muted);font-weight:400;text-transform:none;letter-spacing:0;">(2D/3D maç motoru: oyuncu genelde güçlü ayağını kullanır)</span></label>' +
            '<div style="display:flex;gap:22px;flex-wrap:wrap;align-items:flex-start;">' +
            '<div>' + sub('Güçlü Ayak') + aprSeg('ft', [['R', 'Sağ'], ['L', 'Sol']], cur.ft) + '</div>' +
            '<div style="min-width:220px;">' + sub('Zayıf Ayak Kullanımı') + '<div class="apr-stars" data-wf="' + cur.wf + '" style="display:flex;gap:2px;">' + stars + '</div>' +
            '<span class="apr-wf-txt" style="display:block;font-size:.74rem;color:var(--text-2);margin-top:4px;">' + APR_WF[cur.wf] + '</span></div>' +
            '</div>';
        host.appendChild(box);
        try { apvMount(box, p); } catch (e) { warn('görünüm önizlemesi', e); }
    });
    /* ---------- Görünüm önizlemesi: oyuncunun 3B modeli (maçtaki AYNI çizici, Ado3D), seçimler değiştikçe anında güncellenir ----------
       Tek bir WebGL bağlamı oluşturulur ve tekrar kullanılır (her açılışta yeni bağlam açılmaz). Kaydetmeye dokunmaz: yalnızca
       formdaki o anki seçimleri gösterir; "Kaydet" yine before('savePlayerEdit') kancasıyla ayrı depoya yazar. */
    var APV = { R: null, cv: null, fail: false, raf: 0, yaw: .35, auto: true, drag: null, mode: 'full', cmp: false, cols: '', key: '', last: 0, box: null, rec: null };
    var APV_ROLE = { 'KL': 'GK', 'SLB': 'LB', 'STP': 'LCB', 'SĞB': 'RB', 'MDO': 'LDM', 'MO': 'RDM', 'MOO': 'AM', 'SLK': 'LW', 'SĞK': 'RW', 'SF': 'ST' };
    var APV_X = 52.5, APV_Z = 34, APV_W = 216, APV_H = 288;
    function apvTeam(id) {
        var ts = (G.savedTeams || (typeof savedTeams !== 'undefined' ? savedTeams : [])) || [];
        for (var i = 0; i < ts.length; i++) if (ts[i] && ts[i].squad && ts[i].squad.indexOf(id) >= 0) return { color: ts[i].color || '#1f6feb', name: ts[i].name || '' };
        return { color: '#1f6feb', name: '' };
    }
    // formdaki o anki seçimler (savePlayerEdit kancasıyla aynı alanlar); geçersiz/eksik sayıda son geçerli değer kalır
    function apvRead(box, prev) {
        function q(sel) { return box.querySelector(sel); }
        function ai(el, a) { var v = el ? parseInt(el.getAttribute(a), 10) : NaN; return isFinite(v) ? v : null; }
        var hEl = q('.apr-input[data-apr="h"]'), wEl = q('.apr-input[data-apr="w"]'), hsEl = q('.apr-input[data-apr="hs"]'), ftEl = q('.apr-seg[data-apr="ft"]');
        var h = hEl ? parseInt(hEl.value, 10) : NaN, w = wEl ? parseInt(wEl.value, 10) : NaN;
        return {
            h: isFinite(h) && h >= 140 && h <= 230 ? h : prev.h, w: isFinite(w) && w >= 35 && w <= 160 ? w : prev.w,
            sk: ai(q('.apr-swatches'), 'data-sk') != null ? ai(q('.apr-swatches'), 'data-sk') : prev.sk, hc: ai(q('.apr-hcs'), 'data-hc') != null ? ai(q('.apr-hcs'), 'data-hc') : prev.hc,
            hs: hsEl && isFinite(parseInt(hsEl.value, 10)) ? parseInt(hsEl.value, 10) : prev.hs, bd: ai(q('.apr-seg[data-apr="bd"]'), 'data-v') != null ? ai(q('.apr-seg[data-apr="bd"]'), 'data-v') : prev.bd,
            ft: ftEl && ftEl.getAttribute('data-v') === 'L' ? 'L' : 'R'
        };
    }
    function apvPlayers(rec, a) {
        var role = APV_ROLE[rec.pos] || 'AM';
        return [
            { team: 0, role: role, name: rec.name || 'Oyuncu', h: a.h, w: a.w, sk: a.sk, hs: a.hs, hc: a.hc, bd: a.bd, ft: a.ft },
            { team: 0, role: role === 'GK' ? 'ST' : 'GK', name: 'Ortalama', h: 180, w: 75, sk: a.sk, hs: 2, hc: 0, bd: 0, ft: 'R' }      // karşılaştırma: 180 cm / 75 kg
        ];
    }
    function apvEnsure() {
        if (APV.R && !APV.R.lost) return true;
        if (APV.fail) return false;
        if (APV.lostT && performance.now() < APV.lostT) return false;          // [ui] bağlam kaybından hemen sonra değil
        if (!(G.Ado3D && Ado3D.supported())) { APV.fail = true; return false; }
        try {
            APV.cv = document.createElement('canvas');
            APV.cv.style.cssText = 'display:block;border-radius:12px;cursor:grab;touch-action:none;background:#0b1220;';
            var C = (G.Sim2D && Sim2D.C) || { PA_Y0: 34 - 20.16, PA_Y1: 34 + 20.16 };
            APV.R = Ado3D.create(APV.cv, { PW: 105, PH: 68, C: C, quality: 'mid' });
            if (!APV.R) { APV.fail = true; return false; }
            APV.R.onLost = function () { APV.R = null; APV.lostT = performance.now() + 2500; };      // [ui] kayıp kalıcı değil: sonraki açılışta yeni tuvalle
            APV.R.setSize(APV_W, APV_H, Math.min(2, G.devicePixelRatio || 1));
            APV.v = { x: new Float32Array(2), y: new Float32Array(2), fx: new Float32Array(2), fy: new Float32Array(2), bx: APV_X + .95, by: APV_Z - .35, bz: 0, owner: -1 };
            // sürükleyerek döndür (fare ve dokunmatik)
            APV.cv.addEventListener('pointerdown', function (e) { APV.drag = { x: e.clientX, yaw: APV.yaw }; APV.auto = false; apvSyncBtns(); try { APV.cv.setPointerCapture(e.pointerId); } catch (er) { } APV.cv.style.cursor = 'grabbing'; });
            APV.cv.addEventListener('pointermove', function (e) { if (APV.drag) APV.yaw = APV.drag.yaw + (e.clientX - APV.drag.x) * .012; });
            var up = function () { APV.drag = null; APV.cv.style.cursor = 'grab'; };
            APV.cv.addEventListener('pointerup', up); APV.cv.addEventListener('pointercancel', up);
        } catch (e) { warn('önizleme 3B', e); APV.R = null; APV.fail = true; return false; }
        return true;
    }
    function apvRoot() { return (APV.cv && APV.cv.closest && APV.cv.closest('.apr-pv-host')) || APV.box; }       // [ui25] önizleme karta taşınmış olabilir
    function apvSyncBtns() {
        var b = apvRoot(); if (!b) return;
        var bs = b.querySelectorAll('.apv-btn');
        for (var i = 0; i < bs.length; i++) { var k = bs[i].getAttribute('data-k'), on = k === 'full' ? APV.mode === 'full' : k === 'face' ? APV.mode === 'face' : k === 'rot' ? APV.auto : k === 'cmp' ? APV.cmp : false; bs[i].classList.toggle('on', on); bs[i].setAttribute('aria-pressed', on ? 'true' : 'false'); }
    }
    function apvUpdate(force) {
        if (!APV.R || !APV.box || !APV.rec) return;
        var a = apvRead(APV.box, APV.cur), key = JSON.stringify(a);
        if (!force && key === APV.key) return;
        APV.key = key; APV.cur = a;
        var tm = apvTeam(APV.rec.id), cols = tm.color + '|' + tm.name;
        if (cols !== APV.cols) { APV.cols = cols; APV.R.setMatch({ cols: [tm.color, '#808890'], players: apvPlayers(APV.rec, a), names: [tm.name || 'Adoball', ''] }); }
        else APV.R.refreshAppearance(apvPlayers(APV.rec, a));
        var rt = apvRoot(), hl = rt && rt.querySelector('.apv-cap'); if (hl) hl.textContent = a.h + ' cm · ' + a.w + ' kg';
    }
    function apvFrame(now) {
        APV.raf = 0;
        var cv = APV.cv, R3 = APV.R; if (!cv || !R3 || R3.lost || !cv.isConnected) return;
        var md = $('edit-modal'); if (md && G.getComputedStyle && getComputedStyle(md).display === 'none') return;      // pencere kapandı: döngü durur
        var dt = APV.last ? Math.min(.1, (now - APV.last) / 1000) : 0; APV.last = now;
        if (APV.auto && !APV.drag) APV.yaw += dt * .55;
        var v = APV.v, a = APV.cur || { h: 180 }, hs = Math.max(.9, Math.min(1.08, a.h / 180));
        v.x[0] = APV.cmp ? APV_X - .5 : APV_X; v.y[0] = APV_Z; v.fx[0] = Math.sin(APV.yaw); v.fy[0] = Math.cos(APV.yaw);
        v.x[1] = APV.cmp ? APV_X + .55 : -100; v.y[1] = APV_Z; v.fx[1] = Math.sin(APV.yaw); v.fy[1] = Math.cos(APV.yaw);
        R3._camOverride = APV.mode === 'face'
            ? { eye: [APV_X - (APV.cmp ? .5 : 0), 1.6 * hs, APV_Z + 1.7], at: [APV_X - (APV.cmp ? .5 : 0), 1.58 * hs, APV_Z], fov: 27 }
            : { eye: [APV_X, 1.12, APV_Z + (APV.cmp ? 5.4 : 4.7)], at: [APV_X, .94, APV_Z], fov: 30 };          // [ui25] tüm boy: ayak ve top kadrajda
        try { R3.render({ now: now, v: v, cam: { mode: 'bcast', zoom: 1, replay: false, vs: false, dead: null, style: 'std' }, rings: [], hasGround: false, tscale: 1, celeb: null, refPose: null, refCard: null, varOn: false, crowdPulse: 0, crowdSide: .5, carry: null }); }
        catch (e) { warn('önizleme çizimi', e); return; }
        APV.raf = requestAnimationFrame(apvFrame);
    }
    function apvMount(box, rec) {
        var host = box.querySelector('.apr-pv-host'); if (!host) return;
        if (!apvEnsure()) { host.innerHTML = '<div style="width:' + APV_W + 'px;padding:14px;border:1px dashed var(--line-2);border-radius:12px;font-size:.78rem;color:var(--text-muted);">3B önizleme bu cihazda kullanılamıyor (WebGL2 gerekli).</div>'; return; }
        var btn = function (k, t) { return '<button type="button" class="apv-btn" data-k="' + k + '" style="flex:1;padding:5px 4px;font-size:.72rem;border-radius:8px;border:1px solid var(--line-2);background:transparent;color:var(--text-2);cursor:pointer;">' + t + '</button>'; };
        host.innerHTML = '<div class="apv-wrap" style="position:relative;width:' + APV_W + 'px;">' +
            '<div class="apv-cv"></div>' +
            '<span class="apv-ref" style="position:absolute;right:8px;top:' + (APV_H - 30) + 'px;padding:2px 8px;border-radius:8px;background:rgba(3,8,20,.72);color:#c9f23d;font-size:.68rem;font-weight:700;pointer-events:none;display:none;">Sağdaki: 180 cm · 75 kg</span>' +
            '<span class="apv-cap" style="position:absolute;left:8px;top:8px;padding:2px 8px;border-radius:8px;background:rgba(3,8,20,.72);color:#fff;font-size:.72rem;font-weight:700;pointer-events:none;"></span>' +
            '<div style="display:flex;gap:6px;margin-top:6px;">' + btn('full', 'Tüm boy') + btn('face', 'Yüz') + '</div>' +
            '<div style="display:flex;gap:6px;margin-top:6px;">' + btn('rot', 'Döndür') + btn('cmp', '180 cm ile') + '</div>' +
            '<span style="display:block;font-size:.68rem;color:var(--text-muted);margin-top:5px;text-align:center;">Sürükleyerek çevirebilirsin</span></div>';
        host.querySelector('.apv-cv').appendChild(APV.cv);
        (function () { var cvb = host.querySelector('.apv-cv'); ['.apv-cap', '.apv-ref'].forEach(function (s) { var e = host.querySelector(s); if (e && cvb) cvb.appendChild(e); }); })();     // [ui25] etiketler tuval kabında
        APV.box = box; APV.rec = rec; APV.key = ''; APV.cols = ''; APV.last = 0; APV.yaw = .35; APV.auto = true;
        APV.cur = DB2D.getAppearance(rec) || { h: 180, w: 75, sk: 0, hs: 1, hc: 0, bd: 0, ft: 'R' };
        if (!box.__apv) {
            box.__apv = true;
            var kick = function () { setTimeout(function () { apvUpdate(false); }, 0); };      // satır içi onclick (seçimi taşıyan) önce çalışsın
            box.addEventListener('click', kick); box.addEventListener('input', kick); box.addEventListener('change', kick);
        }
        host.addEventListener('click', function (e) {
            var b = e.target && e.target.closest ? e.target.closest('.apv-btn') : null; if (!b) return;
            var k = b.getAttribute('data-k');
            if (k === 'full' || k === 'face') APV.mode = k; else if (k === 'rot') APV.auto = !APV.auto; else if (k === 'cmp') APV.cmp = !APV.cmp;
            if (k === 'face' && APV.cmp) APV.cmp = false;
            apvSyncBtns();
            var rf = host.querySelector('.apv-ref'); if (rf) rf.style.display = APV.cmp ? 'block' : 'none';
        });
        apvSyncBtns(); apvUpdate(true);
        if (!APV.raf) APV.raf = requestAnimationFrame(apvFrame);
    }
    // Kaydetme motorun KENDİ savePlayerEdit()'inden ÖNCE okunur (before, after DEĞİL): motor closeModal() ile
    // modalı kapatıp #edit-inputs'u bir SONRAKİ açılışta sıfırlayacaktır - alanları o kapanmadan ÖNCE okumak
    // gerekir. fm_players_v16'ya YAZILMAZ; DB2D.setAppearance kendi ayrı deposuna (fm_appearance_v1) yazar.
    before('savePlayerEdit', function () {
        var idEl = $('edit-id'); if (!idEl || !G.DB2D) return;
        var id = parseInt(idEl.value, 10), p = typeof getPlayerFromId === 'function' ? getPlayerFromId(id) : null;
        var box = $('apr-edit-box'); if (!p || !box) return;
        function q(sel) { return box.querySelector(sel); }
        function attrInt(el, a) { return el ? parseInt(el.getAttribute(a), 10) : NaN; }
        var hEl = q('.apr-input[data-apr="h"]'), wEl = q('.apr-input[data-apr="w"]'), hsEl = q('.apr-input[data-apr="hs"]'), ftEl = q('.apr-seg[data-apr="ft"]');
        DB2D.setAppearance(p, {
            h: hEl ? parseInt(hEl.value, 10) : NaN, w: wEl ? parseInt(wEl.value, 10) : NaN, sk: attrInt(q('.apr-swatches'), 'data-sk'),
            hs: hsEl ? parseInt(hsEl.value, 10) : NaN, hc: attrInt(q('.apr-hcs'), 'data-hc'), bd: attrInt(q('.apr-seg[data-apr="bd"]'), 'data-v'),
            ft: ftEl ? ftEl.getAttribute('data-v') : null, wf: attrInt(q('.apr-stars'), 'data-wf')
        });
        if (G.ado2d && G.ado2d.refreshAppearance) G.ado2d.refreshAppearance();
    });

    /* =====================================================================
       [ui3] Uygulama içi onay penceresi. Motorun confirm() kullanan fonksiyonları DEĞİŞMEZ: önce confirm() yakalanıp
       false döndürülerek soru metni alınır (bu fonksiyonlarda confirm'den önce yan etki yok); kullanıcı onaylarsa aynı
       çağrı confirm() = true ile yinelenir. Esc / dışarı tıklama vazgeçer; odak açan öğeye döner.
       ===================================================================== */
    var CFM = null;
    function cfmEl() {
        if (CFM) return CFM;
        var d = document.createElement('div');
        d.id = 'ado-confirm'; d.className = 'cfm'; d.hidden = true;
        d.innerHTML = '<div class="cfm-card" role="alertdialog" aria-modal="true" aria-labelledby="cfm-t" aria-describedby="cfm-m">' +
            '<div class="cfm-head"><span class="cfm-ic">' + icon('i-alert') + '</span><h3 id="cfm-t"></h3></div>' +
            '<p class="cfm-msg" id="cfm-m"></p>' +
            '<div class="cfm-foot"><button type="button" class="btn btn-ghost" data-r="0">Vazgeç</button><button type="button" class="btn btn-primary" data-r="1">Onayla</button></div></div>';
        document.body.appendChild(d);
        CFM = { el: d, cb: null, back: null };
        d.addEventListener('click', function (e) {
            var b = e.target && e.target.closest ? e.target.closest('[data-r]') : null;
            if (b) cfmClose(b.getAttribute('data-r') === '1');
            else if (e.target === d) cfmClose(false);
        });
        document.addEventListener('keydown', function (e) {
            if (!CFM || CFM.el.hidden) return;
            if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); cfmClose(false); return; }
            if (e.key === 'Tab') {      // odak pencerede kalır
                var bs = CFM.el.querySelectorAll('button'), f = bs[0], l = bs[bs.length - 1];
                if (e.shiftKey && document.activeElement === f) { e.preventDefault(); l.focus(); }
                else if (!e.shiftKey && document.activeElement === l) { e.preventDefault(); f.focus(); }
                else if (!CFM.el.contains(document.activeElement)) { e.preventDefault(); f.focus(); }
            }
        }, true);
        return CFM;
    }
    function cfmClose(ok) {
        var c = CFM; if (!c || c.el.hidden) return;
        c.el.hidden = true;
        var cb = c.cb; c.cb = null;
        try { if (c.back && c.back.focus && c.back.isConnected) c.back.focus(); } catch (e) { }
        if (cb) { try { cb(!!ok); } catch (e) { warn('onay', e); } }
    }
    // o: { title, msg, ok, cancel, danger }; cb(true|false)
    ado.confirm = function (o, cb) {
        var c = cfmEl();
        if (!c.el.hidden) cfmClose(false);
        $('cfm-t').textContent = o.title || 'Emin misin?';
        $('cfm-m').textContent = o.msg || '';
        var ok = c.el.querySelector('[data-r="1"]'), no = c.el.querySelector('[data-r="0"]');
        ok.textContent = o.ok || 'Onayla'; no.textContent = o.cancel || 'Vazgeç';
        ok.className = 'btn ' + (o.danger ? 'btn-danger-solid' : 'btn-primary');
        c.el.classList.toggle('danger', !!o.danger);
        c.cb = cb || null; c.back = document.activeElement;
        c.el.hidden = false;
        try { (o.danger ? no : ok).focus(); } catch (e) { }
    };
    function confirmWrap(name, o) {
        var orig = G[name]; if (typeof orig !== 'function') { warn('eksik fonksiyon', name); return; }
        G[name] = function () {
            var self = this, args = arguments, nc = G.confirm, asked = null, r;
            G.confirm = function (m) { asked = String(m == null ? '' : m); return false; };
            try { r = orig.apply(self, args); } finally { G.confirm = nc; }
            if (asked === null) return r;          // soru sorulmadı: işlem zaten yapıldı
            var resume = null;
            if (o.pause) {                          // [ui22] pencere JS'yi bloklamaz: soru açıkken maç durur, Vazgeç'te devam eder
                try {
                    var live = !!(G.ado2d && G.ado2d.running && G.ado2d.running()), cls = typeof matchInterval !== 'undefined' && matchInterval !== null;
                    var pb = $('btn-pause-match');
                    if ((live || cls) && matchData && !matchData.isFinished && pb) { pb.click(); resume = function () { var sb = $('btn-start-match'); if (sb && matchData && !matchData.isFinished) sb.click(); }; }
                } catch (e) { warn('onay duraklatma', e); }
            }
            ado.confirm({ title: o.title, msg: asked, ok: o.ok, danger: o.danger }, function (yes) {
                if (!yes) { if (resume) { try { resume(); } catch (e) { warn('onay devam', e); } } return; }
                G.confirm = function () { return true; };
                try { orig.apply(self, args); } catch (e) { warn(name, e); } finally { G.confirm = nc; }
            });
        };
    }
    confirmWrap('deleteTeam', { title: 'Takımı sil', ok: 'Sil', danger: true });
    confirmWrap('simulateWeekInstant', { title: 'Haftayı hızlı simüle et', ok: 'Simüle et' });
    confirmWrap('simulateAllRemainingInstant', { title: 'Kalan maçları simüle et', ok: 'Simüle et' });
    confirmWrap('endTournament', { title: 'Turnuvayı sıfırla', ok: 'Sıfırla', danger: true });
    confirmWrap('exitMatchToOrigin', { title: 'Maçtan ayrıl', ok: 'Ayrıl', danger: true, pause: true });
    // Bilgi pencereleri (alert) yayın görünümünü bozmasın: bildirim olarak gösterilir
    G.alert = function (m) {
        var s = String(m == null ? '' : m);
        toast(s, /hata|geçersiz|başarısız|olamaz|okunamadı/i.test(s) ? 'err' : /başarı|yüklendi|kaydedildi|güncellendi/i.test(s) ? 'ok' : (/düzeltme/i.test(s) ? 'warn' : ''));
    };

    /* =====================================================================
       [ui3] Takım kurucu: açıkken sayfa tek iş (kayıtlı takımlar gizli), canlı ön izleme (ad + arma + forma rengi),
       arma biçimlerinin Türkçe adları. Motorun kurucu fonksiyonları değişmez; yalnız sonradan çalışan kancalar.
       ===================================================================== */
    var CREST_TR = { shield: 'Kalkan', circle: 'Yuvarlak', hexagon: 'Altıgen', pentagon: 'Beşgen', diamond: 'Baklava', star: 'Yıldız', banner: 'Flama', roundsq: 'Yuvarlak kare' };
    function tbMode(on) {
        var sc = $('squad-screen'); if (sc) sc.classList.toggle('is-building', !!on);
        if (on) { try { G.scrollTo(0, 0); } catch (e) { } }
    }
    after('openNewTeamForm', function () {
        tbMode(true);
        var n = $('tb-name'); if (n && !n.value) { try { n.focus({ preventScroll: true }); } catch (e) { } }
    });
    after('cancelTeamForm', function () { tbMode(false); });
    after('renderLogoSwatches', function () {
        [].forEach.call(document.querySelectorAll('#tb-logo-swatches .logo-swatch'), function (el, i) {
            var nm = CREST_TR[crestOrder[i]] || crestOrder[i];
            el.title = nm; el.setAttribute('aria-label', 'Arma biçimi: ' + nm);
        });
    });
    after('updateLogoPreview', function () {
        var n = $('tb-name'), pv = $('tb-prev-name'), c = $('tb-color'), box = document.querySelector('.tb-preview');
        if (pv) pv.textContent = (n && n.value.trim()) || 'Takım adı';
        if (box && c) box.style.setProperty('--tc', vis(c.value));
        var tbb = $('team-builder'); if (tbb && c) tbb.style.setProperty('--tb-c', vis(c.value));      // [ui26] seçili arma biçimi takım renginde
    });
    after('selectTeamColor', function () {
        [].forEach.call(document.querySelectorAll('#tb-color-swatches .kit-swatch'), function (sw) {
            if (!sw.getAttribute('aria-label')) sw.setAttribute('aria-label', 'Forma rengi ' + (sw.title || ''));
            sw.setAttribute('aria-pressed', sw.classList.contains('selected') ? 'true' : 'false');
        });
    });

    /* =====================================================================
       [ui3] Turnuva: motorun turnuva fonksiyonları DEĞİŞMEZ; çıktılarını (puan durumu, fikstür, krallık listeleri,
       fikstür önizlemesi, şampiyon kartı) sonradan çalışan kancalar aynı veriden yayın grafiği diliyle yeniden çizer.
       ===================================================================== */
    var FORM_TR = { W: ['G', 'win', 'Galibiyet'], D: ['B', 'draw', 'Beraberlik'], L: ['M', 'loss', 'Mağlubiyet'] };
    function signed(n) { return n > 0 ? '+' + n : String(n); }
    function tsCrests() {
        [].forEach.call(document.querySelectorAll('#tourney-team-slots .ts-slot'), function (g) {
            var s = g.querySelector('select'), c = g.querySelector('.ts-crest'), t = s ? savedTeams[parseInt(s.value)] : null;
            if (c) c.innerHTML = t ? renderTeamCrestHTML(t, 40) : '';
            g.style.setProperty('--tc', t ? vis(t.color) : 'var(--line-2)');
        });
    }
    after('generateTourneySlots', function () {
        var size = parseInt(($('tourney-size') || {}).value) || 3, box = $('tourney-team-slots'), btn = $('tourney-start-btn');
        var enough = savedTeams.length >= size;
        if (btn) btn.disabled = !enough;
        if (!box) return;
        if (!enough) {
            box.className = 'ts-empty';
            box.innerHTML = '<div class="empty-sm">' + icon('i-team') + '<span class="grow"><b>' + size + ' takım gerekli</b>Bu format için en az ' + size + ' kayıtlı takım olmalı; şu an ' + savedTeams.length + ' takım var.</span>' +
                '<button type="button" class="btn btn-sm btn-primary" onclick="ado.newTeam()">' + icon('i-plus') + 'Takım kur</button></div>';
            return;
        }
        box.className = 'ts-slots';
        [].forEach.call(box.querySelectorAll('.form-group'), function (g, i) {
            g.classList.add('ts-slot');
            var l = g.querySelector('label'); if (l) { l.textContent = (i + 1) + '. takım'; l.setAttribute('for', 'tt-slot-' + i); }
            if (!g.querySelector('.ts-crest')) { var c = document.createElement('span'); c.className = 'ts-crest'; c.setAttribute('aria-hidden', 'true'); g.insertBefore(c, g.firstChild); }
        });
        tsCrests();
    });
    (function () { var tsl = $('tourney-team-slots'); if (tsl) tsl.addEventListener('change', function () { try { tsCrests(); } catch (e) { warn('tsCrests', e); } }); })();
    after('selectTourneyFormat', function () {
        [].forEach.call(document.querySelectorAll('.format-card'), function (c) { c.setAttribute('aria-checked', c.classList.contains('selected') ? 'true' : 'false'); });
    });
    after('switchTourneyTab', function () {
        [].forEach.call(document.querySelectorAll('.tourney-tab-btn'), function (b) { b.setAttribute('aria-selected', b.classList.contains('active') ? 'true' : 'false'); });
    });
    function fxSide(t, side, win) {
        var c = renderTeamCrestHTML(t, 28), n = '<b>' + esc(t.name) + '</b>';
        return '<span class="fx-t ' + side + (win ? ' win' : '') + '">' + (side === 'h' ? n + c : c + n) + '</span>';
    }
    after('renderFixturePreview', function () {
        var box = $('tourney-fixture-preview'); if (!box || !tFixtures.length) return;
        var weeks = Math.max.apply(null, tFixtures.map(function (f) { return f.week; })), html = '';
        for (var w = 1; w <= weeks; w++) {
            html += '<div class="fxp-week">' + w + '. hafta</div>';
            tFixtures.forEach(function (f) { if (f.week === w) html += '<div class="fxp-row">' + fxSide(f.h, 'h') + '<span class="fxp-vs">vs</span>' + fxSide(f.a, 'a') + '</div>'; });
        }
        box.innerHTML = html;
    });
    after('renderTourney', function () {
        if (!tTeams.length) return;
        // puan durumu
        var sb = $('tourney-standings-body');
        if (sb) sb.innerHTML = tTeams.map(function (t, idx) {
            var pos = idx + 1, gd = t.gf - t.ga, fm = (t.form || []).slice(-5), dots = '';
            fm.forEach(function (r) { var x = FORM_TR[r] || ['-', 'none', '']; dots += '<span class="form-dot ' + x[1] + '" title="' + x[2] + '">' + x[0] + '</span>'; });
            for (var k = fm.length; k < 5; k++) dots += '<span class="form-dot none" aria-hidden="true"></span>';
            return '<tr class="' + (idx === 0 && t.pl > 0 ? 'is-lead' : '') + '"><td class="c-pos"><span class="standings-pos ' + (pos <= 3 ? 'pos-' + pos : 'pos-other') + '">' + pos + '</span></td>' +
                '<td class="c-team"><div class="standings-team-cell">' + renderTeamCrestHTML(t, 26) + '<span>' + esc(t.name) + '</span></div></td>' +
                '<td>' + t.pl + '</td><td>' + t.w + '</td><td>' + t.d + '</td><td>' + t.l + '</td><td class="xs-hide">' + t.gf + '</td><td class="xs-hide">' + t.ga + '</td>' +
                '<td class="c-gd">' + signed(gd) + '</td><td class="c-pts">' + t.p + '</td><td class="c-form"><div class="form-dots">' + dots + '</div></td></tr>';
        }).join('');
        // lider + ilerleme
        var played = tFixtures.filter(function (f) { return f.played; }).length, total = tFixtures.length, nx = tFixtures.filter(function (f) { return !f.played; })[0];
        var weeks = total ? Math.max.apply(null, tFixtures.map(function (f) { return f.week; })) : 0, lead = tTeams[0];
        var strip = $('tourney-leader-strip');
        if (strip) strip.innerHTML = '<span class="ta-k">' + (nx ? 'Lider' : 'Şampiyon') + '</span>' + renderTeamCrestHTML(lead, 30) + '<b class="ta-name">' + esc(lead.name) + '</b><span class="ta-pts">' + lead.p + ' P</span>' +
            '<span class="ta-prog"><span>' + (nx ? nx.week + '. hafta / ' + weeks : 'Sezon tamamlandı') + ' · ' + played + '/' + total + ' maç</span><i><b style="width:' + (total ? Math.round(played / total * 100) : 0) + '%"></b></i></span>';
        var sab = $('tourney-simall-btn'); if (sab) sab.disabled = !nx;
        var bdg = $('tourney-hero-badge'); if (bdg && !nx) bdg.textContent = 'Sezon tamamlandı';
        // fikstür
        var fx = $('tourney-fixtures');
        if (fx) {
            var nxi = tFixtures.indexOf(nx), html = '';
            for (var w = 1; w <= weeks; w++) {
                var open = tFixtures.some(function (f) { return f.week === w && !f.played; });
                html += '<div class="fx-week"><span class="fx-wk">' + w + '. hafta</span>' + (open ? '<button type="button" class="btn btn-ghost btn-sm" onclick="simulateWeekInstant(' + w + ')">' + icon('i-ff') + 'Haftayı simüle et</button>' : '<span class="fx-done">' + icon('i-check') + 'Tamamlandı</span>') + '</div>';
                tFixtures.forEach(function (f, i) {
                    if (f.week !== w) return;
                    var next = i === nxi, mid;
                    if (f.played) mid = '<span class="fx-score" aria-label="Skor ' + f.hg + ' - ' + f.ag + '">' + f.hg + '<i>–</i>' + f.ag + '</span>';
                    else mid = '<button type="button" class="btn btn-sm fx-play' + (next ? ' btn-primary' : '') + '" onclick="playTourneyMatch(' + i + ')" aria-label="' + esc(f.h.name + ' - ' + f.a.name) + ' maçını oyna">' + icon('i-play') + 'Oyna</button>';
                    html += '<div class="fx-row' + (next ? ' is-next' : '') + (f.played ? ' played' : '') + '">' + fxSide(f.h, 'h', f.played && f.hg > f.ag) + '<span class="fx-mid">' + mid + '</span>' + fxSide(f.a, 'a', f.played && f.ag > f.hg) + '</div>';
                });
            }
            fx.innerHTML = html;
        }
    });
    after('renderTournamentLeaderboards', function () {
        var all = Object.values(tourneyPlayerStats);
        function rows(key, emptyTxt) {
            var l = all.filter(function (s) { return s[key] > 0; }).sort(function (a, b) { return b[key] - a[key]; }).slice(0, 5);
            return l.length ? l.map(function (s, i) { return '<tr><td class="c-rk">' + (i + 1) + '</td><td class="c-name">' + esc(s.name) + '<small>' + esc(s.team) + '</small></td><td class="c-val">' + s[key] + '</td></tr>'; }).join('')
                : '<tr><td colspan="3" class="c-empty">' + emptyTxt + '</td></tr>';
        }
        var g = $('tourney-topscorers-body'), a = $('tourney-topassists-body');
        if (g) g.innerHTML = rows('goals', 'Henüz gol atılmadı.');
        if (a) a.innerHTML = rows('assists', 'Henüz asist yok.');
    });
    after('showChampionCelebration', function (_, args) {
        var ch = args[0]; if (!ch) return;
        var ov = $('champion-overlay'), cr = $('champ-crest'), sub = $('champ-sub'), hero = ov && ov.querySelector('.champ-hero');
        if (cr) cr.innerHTML = renderTeamCrestHTML(ch, 96, true);
        if (hero) hero.style.setProperty('--tc', vis(ch.color));
        if (sub) sub.innerHTML = '<b>' + ch.p + ' puan</b> · ' + ch.w + 'G ' + ch.d + 'B ' + ch.l + 'M · averaj ' + signed(ch.gf - ch.ga);
        ['award-topscorer-value', 'award-topassist-value', 'award-motm-value'].forEach(function (id) {
            var el = $(id); if (!el) return;
            el.textContent = el.textContent.replace(/ kez MOTM/, ' kez maçın oyuncusu').replace(/ \(([^()]*)\)$/, ' · $1');
        });
        if (ov) { ov.classList.remove('champion-on'); void ov.offsetWidth; ov.classList.add('champion-on'); }
        var b = $('champ-close'); if (b) { try { b.focus({ preventScroll: true }); } catch (e) { } }
    });
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        var ov = $('champion-overlay'); if (ov && ov.classList.contains('active')) ov.classList.remove('active');
    });

    /* =====================================================================
       [ui3] Futbolcu veritabanı: mevki çipleri (gizli select'i sürer), tablo satırlarının sınıflandırılması (OVR kademe
       rozeti, ısı rengi, kaleci nitelikleri), başlık ipuçları ve aria-sort. Motorun renderPlayerTable() üretimi değişmez.
       ===================================================================== */
    function heat(v) { return v >= 85 ? 'v-90' : v >= 75 ? 'v-80' : v >= 60 ? 'v-70' : v >= 45 ? 'v-60' : 'v-0'; }
    var GK_K = [['gk_ref', 'REF', 'Refleks'], ['gk_div', 'UÇM', 'Uçma'], ['gk_pos', 'YER', 'Yer tutma'], ['gk_kic', 'DAĞ', 'Pas / dağıtım'], ['gk_1v1', '1V1', 'Birebir']];
    (function () {
        var sel = $('player-pos-filter'), box = $('db-chips'), wrap = $('db-wrap');
        if (sel && box) {
            box.innerHTML = [].map.call(sel.options, function (o) {
                var v = o.value;
                return '<button type="button" class="db-chip" data-pos="' + esc(v) + '" aria-pressed="' + (sel.value === v ? 'true' : 'false') + '" title="' + esc(v ? o.text : 'Tüm mevkiler') + '">' +
                    (v ? '<i style="background:var(--pos-' + (POS_C[v] || 'def') + ')"></i>' + esc(v) : 'Tümü') + '</button>';
            }).join('');
            box.addEventListener('click', function (e) {
                var b = e.target && e.target.closest ? e.target.closest('.db-chip') : null; if (!b) return;
                sel.value = b.getAttribute('data-pos'); renderPlayerTable();
            });
        }
        if (wrap) wrap.addEventListener('scroll', function () { wrap.classList.toggle('scrolled-x', wrap.scrollLeft > 4); }, { passive: true });
    })();
    after('renderPlayerTable', function () {
        var sel = $('player-pos-filter');
        [].forEach.call(document.querySelectorAll('#db-chips .db-chip'), function (b) { b.setAttribute('aria-pressed', sel && sel.value === b.getAttribute('data-pos') ? 'true' : 'false'); });
        var head = $('players-table-head');
        if (head) [].forEach.call(head.children, function (th) {
            var ic = th.querySelector('.stat-info-icon'); if (ic && !th.title) th.title = ic.getAttribute('title') || '';
            th.setAttribute('aria-sort', th.classList.contains('sorted-asc') ? 'ascending' : th.classList.contains('sorted-desc') ? 'descending' : 'none');
        });
        var tb = $('players-tbody'); if (!tb) return;
        [].forEach.call(tb.rows, function (tr) {
            var c = tr.cells; if (c.length < 5) return;
            var o = c[2], v = parseInt(o.textContent);
            o.removeAttribute('style'); o.className = 'ovr-cell'; o.innerHTML = '<span class="ovr-b" data-tier="' + tierOf(v) + '">' + v + '</span>';
            if (c.length === 6) {          // kaleci: motor tek birleşik hücre üretir
                var id = parseInt((tr.getAttribute('onclick') || '').replace(/\D+/g, '')), p = getPlayerFromId(id), g = c[3];
                if (p && g) { g.removeAttribute('style'); g.className = 'gk-cell'; g.innerHTML = GK_K.map(function (k) { return '<span class="gk-s" title="' + k[2] + '"><i>' + k[1] + '</i><b class="' + heat(p[k[0]]) + '">' + esc(p[k[0]]) + '</b></span>'; }).join(''); }
            } else for (var i = 3; i < c.length - 2; i++) c[i].className = heat(parseInt(c[i].textContent));
            var fa = c[c.length - 2], ld = c[c.length - 1];
            if (fa) { fa.removeAttribute('style'); fa.className = 'c-agg'; }
            if (ld) { ld.removeAttribute('style'); ld.className = 'c-lead'; }
        });
    });

    /* =====================================================================
       [ui3] Oyuncu düzenleme penceresi: Ado Kart (canlı), sekmeler, nitelik çubukları. Motorun openPlayerEdit /
       updateLiveOverall / applyOverallToStats / savePlayerEdit akışı DEĞİŞMEZ; görünüm kutusu (#apr-edit-box) ve
       3B önizleme yalnız yer değiştirir (kaydetme kancası id'yle okur).
       ===================================================================== */
    var ED_STATS = {
        'KL': [['gk_ref', 'REF'], ['gk_div', 'UÇM'], ['gk_pos', 'YER'], ['gk_kic', 'DAĞ'], ['gk_1v1', '1V1'], ['lead', 'LİD']],
        'STP': [['mar', 'MRK'], ['tac', 'KAP'], ['hea', 'KAF'], ['str', 'GÜÇ'], ['pac', 'HIZ'], ['pas', 'PAS']],
        'SLB': [['pac', 'HIZ'], ['tac', 'KAP'], ['sta', 'DAY'], ['pas', 'PAS'], ['dri', 'DRP'], ['mar', 'MRK']],
        'MDO': [['tac', 'KAP'], ['pas', 'PAS'], ['sta', 'DAY'], ['mar', 'MRK'], ['str', 'GÜÇ'], ['vis', 'VİZ']],
        'MO': [['pas', 'PAS'], ['vis', 'VİZ'], ['sta', 'DAY'], ['dri', 'DRP'], ['lon', 'UPS'], ['tac', 'KAP']],
        'MOO': [['pas', 'PAS'], ['vis', 'VİZ'], ['dri', 'DRP'], ['sho', 'ŞUT'], ['fin', 'BİT'], ['lon', 'UPS']],
        'SLK': [['pac', 'HIZ'], ['dri', 'DRP'], ['fin', 'BİT'], ['sho', 'ŞUT'], ['pas', 'PAS'], ['sta', 'DAY']],
        'SF': [['fin', 'BİT'], ['sho', 'ŞUT'], ['pac', 'HIZ'], ['hea', 'KAF'], ['str', 'GÜÇ'], ['posi', 'POZ']]
    };
    ED_STATS['SĞB'] = ED_STATS['SLB']; ED_STATS['SĞK'] = ED_STATS['SLK'];
    var POS_FULL = { 'KL': 'Kaleci', 'SLB': 'Sol bek', 'STP': 'Stoper', 'SĞB': 'Sağ bek', 'MDO': 'Defansif orta saha', 'MO': 'Orta saha', 'MOO': 'Ofansif orta saha', 'SLK': 'Sol kanat', 'SĞK': 'Sağ kanat', 'SF': 'Santrafor' };
    var APV_LBL = { full: ['Boy', 'Tüm boy görünüm'], face: ['Yüz', 'Yüz yakın plan'], rot: ['Döndür', 'Otomatik döndür'], cmp: ['Kıyas', '180 cm / 75 kg ortalama oyuncuyla karşılaştır'] };
    function edVal(k) { var i = document.querySelector('#edit-inputs .edit-live-input[data-key="' + k + '"]'); return i ? (parseInt(i.value) || 0) : null; }
    function edCard() {
        var card = $('ed-card'); if (!card) return;
        var pos = ($('edit-pos-val') || {}).value || '', o = parseInt(($('edit-live-ovr') || {}).value) || 0;
        card.setAttribute('data-tier', tierOf(o));
        card.style.setProperty('--pc', 'var(--pos-' + (POS_C[pos] || 'def') + ')');
        $('ed-ovr').textContent = o; $('ed-pos').textContent = pos;
        $('ed-stats').innerHTML = (ED_STATS[pos] || ED_STATS.MO).map(function (s) { var v = edVal(s[0]); return '<span><b>' + (v == null ? '-' : v) + '</b><i>' + s[1] + '</i></span>'; }).join('');
    }
    function edMeters() {
        [].forEach.call(document.querySelectorAll('#edit-inputs .edit-live-input'), function (inp) {
            var g = inp.closest('.form-group'); if (!g) return;
            var m = g.querySelector('.attr-meter');
            if (!m) { m = document.createElement('span'); m.setAttribute('aria-hidden', 'true'); m.innerHTML = '<i></i>'; g.appendChild(m); }
            var v = Math.max(0, Math.min(99, parseInt(inp.value) || 0));
            m.className = 'attr-meter ' + heat(v); m.firstChild.style.width = v + '%';
        });
    }
    function edTab(k) {
        [].forEach.call(document.querySelectorAll('#edit-modal [data-ed]'), function (t) { var on = t.getAttribute('data-ed') === k; t.classList.toggle('active', on); t.setAttribute('aria-selected', on ? 'true' : 'false'); });
        var a = $('ed-pane-attr'), l = $('ed-pane-look'); if (a) a.hidden = k !== 'attr'; if (l) l.hidden = k !== 'look';
    }
    after('openPlayerEdit', function (_, args) {
        var p = getPlayerFromId(args[0]), host = $('edit-inputs'); if (!p || !host) return;
        var look = $('ed-pane-look'), pv = $('ed-pv');
        // görünüm kutusu: motor/kanca #edit-inputs içine yeni kutuyu ekledi; eskisini kaldır, yenisini sekmeye taşı
        var nb = host.querySelector('#apr-edit-box');
        [].forEach.call(document.querySelectorAll('#apr-edit-box'), function (b) { if (b !== nb && b.parentNode) b.parentNode.removeChild(b); });
        if (nb && look) {
            look.appendChild(nb);
            var ls = nb.querySelectorAll(':scope > label');
            if (ls[0]) ls[0].innerHTML = 'Görünüm <span class="ed-lsub">yalnız 3B görüntüyü etkiler</span>';
            if (ls[1]) ls[1].innerHTML = 'Ayak kullanımı <span class="ed-lsub">2B/3B maç motoru: oyuncu genelde güçlü ayağını kullanır</span>';
        }
        // 3B önizleme kartın portresine (aynı tuval taşınır; kayıp ya da destek yoksa uyarı kutusu taşınır)
        var ph = nb ? nb.querySelector('.apr-pv-host') : null;
        if (pv) {
            [].forEach.call(pv.querySelectorAll('.apr-pv-host'), function (h) { if (h !== ph && h.parentNode) h.parentNode.removeChild(h); });
            if (ph) pv.appendChild(ph);
            [].forEach.call(pv.querySelectorAll('.apv-btn'), function (b) {
                b.removeAttribute('style');
                var k = b.getAttribute('data-k'), L = APV_LBL[k]; if (L) { b.textContent = L[0]; b.title = L[1]; b.setAttribute('aria-label', L[1]); }
            });
            var cvs = pv.querySelector('canvas'); if (cvs) { cvs.title = 'Sürükleyerek çevirebilirsin'; cvs.setAttribute('aria-label', '3B oyuncu önizlemesi; sürükleyerek çevirebilirsin'); cvs.setAttribute('role', 'img'); }
        }
        // nitelik alanları: kritik işareti, karakter alanları, etiket bağı, değer çubuğu
        [].forEach.call(host.querySelectorAll('.form-group'), function (g) {
            var inp = g.querySelector('.edit-live-input'); if (!inp) return;
            var k = inp.getAttribute('data-key'), lab = g.querySelector('label');
            g.classList.add('ed-f');
            if (inp.classList.contains('highlight-green')) g.classList.add('crit');
            inp.id = 'ed-in-' + k; inp.setAttribute('inputmode', 'numeric');
            if (lab) {
                lab.htmlFor = inp.id;
                var ic = lab.querySelector('.stat-info-icon'); if (ic) { lab.title = ic.getAttribute('title') || ''; inp.title = lab.title; }
                if (k === 'agg' || k === 'lead') { g.classList.add('trait'); lab.removeAttribute('style'); if (!lab.querySelector('.ed-tag')) lab.insertAdjacentHTML('beforeend', '<span class="ed-tag" title="OVR hesabına girmez">Karakter</span>'); }
            }
        });
        var tm = apvTeam(p.id);
        $('ed-name').textContent = shortName(p.name);
        $('ed-team').textContent = tm.name || '';
        $('ed-meta').textContent = (POS_FULL[p.pos] || p.pos) + ' · ' + (tm.name || 'Kayıtlı takımda değil');
        edMeters(); edCard(); edTab('attr');
        var body = document.querySelector('#edit-modal .mc-body'); if (body) body.scrollTop = 0;
        var t1 = $('ed-tab-attr'); if (t1) { try { t1.focus({ preventScroll: true }); } catch (e) { } }
    });
    (function () {
        var m = $('edit-modal'); if (!m) return;
        var f = function () { try { edMeters(); edCard(); } catch (e) { warn('düzenleme kartı', e); } };
        m.addEventListener('input', f); m.addEventListener('change', f);
        m.addEventListener('click', function (e) { var t = e.target && e.target.closest ? e.target.closest('[data-ed]') : null; if (t) edTab(t.getAttribute('data-ed')); });
        m.addEventListener('keydown', function (e) {
            var t = e.target; if (!t || !t.hasAttribute || !t.hasAttribute('data-ed') || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
            var k = t.getAttribute('data-ed') === 'attr' ? 'look' : 'attr'; edTab(k); var n = $('ed-tab-' + k); if (n) n.focus(); e.preventDefault();
        });
    })();
    after('savePlayerEdit', function () {
        var t = $('edit-title'); toast('Oyuncu kaydedildi: ' + (t ? t.textContent : ''), 'ok');
    });

    /* =====================================================================
       [ui3] Ayarlar: kaydırıcı dolgusu, toplam halkası, dağılım şeridi ve lejant, kaydedilmemiş değişiklik işareti,
       "Varsayılana dön". Motorun onWeightSliderInput / saveSettings fonksiyonları değişmez.
       ===================================================================== */
    var SET_K = [['player', 'pWeight', 'Oyuncu güçleri', 'var(--primary)'], ['manager', 'mWeight', 'Teknik direktör', 'var(--violet)'], ['home', 'hWeight', 'İç saha avantajı', 'var(--volt)'], ['stadium', 'sWeight', 'Stadyum gücü', 'var(--gold)'], ['luck', 'lWeight', 'Futbol şansı', 'var(--magenta)']];
    var SET_DEF = { player: 70, manager: 10, home: 8, stadium: 7, luck: 5 };
    function setSync() {
        var vals = SET_K.map(function (k) { var el = $('set-' + k[0]); return el ? (parseInt(el.value) || 0) : 0; }), tot = vals.reduce(function (a, b) { return a + b; }, 0);
        SET_K.forEach(function (k, i) { var el = $('set-' + k[0]); if (el) el.style.setProperty('--v', vals[i]); var vl = $('set-' + k[0] + '-val'); if (vl && vl.textContent !== '%' + vals[i]) vl.textContent = '%' + vals[i]; });     // [ui26] Türkçe yüzde biçimi
        var g = $('weight-total-gauge'); if (g) g.style.setProperty('--tot', Math.min(100, tot));
        var mix = $('set-mix'); if (mix) mix.innerHTML = SET_K.map(function (k, i) { return vals[i] ? '<i style="width:' + (vals[i] / Math.max(100, tot) * 100).toFixed(2) + '%;background:' + k[3] + '" title="' + k[2] + ' %' + vals[i] + '"></i>' : ''; }).join('');
        var lg = $('set-legend'); if (lg) lg.innerHTML = SET_K.map(function (k, i) { return '<li><i style="background:' + k[3] + '"></i><span>' + k[2] + '</span><b>%' + vals[i] + '</b></li>'; }).join('');
        var cur = (typeof settings !== 'undefined' && settings) || {}, dirty = SET_K.some(function (k, i) { return parseInt(cur[k[1]]) !== vals[i]; });
        var sum = document.querySelector('.set-sum'); if (sum) sum.classList.toggle('dirty', dirty);
    }
    after('onWeightSliderInput', setSync);
    after('saveSettings', function () {
        setSync();
        var b = $('btn-save-settings'); if (b && b.classList.contains('nav-active')) toast('Ayarlar kaydedildi', 'ok');
    });
    (function () {
        var r = $('set-reset'); if (!r) return;
        r.addEventListener('click', function () {
            SET_K.forEach(function (k) { var el = $('set-' + k[0]); if (el) el.value = SET_DEF[k[0]]; });
            onWeightSliderInput();
        });
    })();

    /* =====================================================================
       Başlatma (motorun window.onload -> initApp()'inden SONRA çalışır)
       ===================================================================== */
    window.addEventListener('load', function () {
        try {
            var p = prefGet();
            applySb(!!p.sb);
            ado.view(p.view === 'list' ? 'list' : 'pitch');
            ['qm-home', 'qm-away'].forEach(function (id) { var s = $(id); if (s) s.addEventListener('change', mdRender); });
            var nv = $('qm-neutral-venue'); if (nv) nv.addEventListener('change', mdRender);
            for (var k = 0; k < 11; k++) { var se = $('slot-' + k); if (se) se.addEventListener('change', checkConflicts); }
            var tsl = $('tourney-team-slots'); if (tsl) tsl.addEventListener('change', tcRender);
            var tsz = $('tourney-size'); if (tsz) tsz.addEventListener('change', tcRender);
            initTourneyEditorGuard();
            guardEmoji();
            enhance(document.body);
            clearCommentary();
            G.renderSavedTeams();
            showScreen('home-screen');
        } catch (e) { warn('başlatma', e); }
    });
})();

