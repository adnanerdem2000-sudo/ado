    var ADO_JOG_LP = {"jog forward":{"d":1.992,"ang":0.041,"v":2.39,"u0":0.48,"dyaw":0.046,"pl":[10],"pr":[23]},"jog forward diagonal":{"d":2.137,"ang":0.535,"v":2.671,"u0":0.042,"dyaw":-0.073,"pl":[23],"pr":[11]},"jog strafe left":{"d":1.948,"ang":-1.798,"v":2.783,"u0":0.619,"dyaw":-0.056,"pl":[11],"pr":[2]},"jog strafe right":{"d":1.626,"ang":1.432,"v":2.217,"u0":0.955,"dyaw":0.046,"pl":[1],"pr":[11]},"jog backward":{"d":1.76,"ang":2.919,"v":2.2,"u0":0.5,"dyaw":-0.13,"pl":[14],"pr":[1]},"jog backward diagonal":{"d":1.555,"ang":1.929,"v":2.121,"u0":0.182,"dyaw":-0.043,"pl":[2],"pr":[12]}};
    for (var gak_ in ADO_MOCAP_G) ADO_MOCAP[gak_] = ADO_MOCAP_G[gak_];
    for (var gaj_ in ADO_JOG_LP) if (ADO_MOCAP[gaj_]) ADO_MOCAP[gaj_].lp = ADO_JOG_LP[gaj_];
    var GA_ON = 1, GA_SURGE = 1, GA_OWN = 1, FK_ON = 1;      // [gasp] topsuz oyuncu kosusu donguden; kalca salinimi      // [mocap] kosu / vurus klipleri acik
    var MC = {}, MC_MIR = [0, 1, 2, 5, 6, 3, 4, 10, 11, 12, 7, 8, 9];      // [mocap] cozulmus klipler; aynada kemik eslemesi
    function mcClip(name) { var c = MC[name]; if (c) return c; var s = ADO_MOCAP[name]; if (!s) return null; var bin = atob(s.b), u = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); c = MC[name] = { n: s.n, fps: s.fps, a: new Int16Array(u.buffer), len: (s.n - 1) / s.fps }; return c; }
    function mcPose(name, t, out, loop, mr) {      // [mocap] t sn'deki poz (dogrusal ara deger) -> out[0..38] (Hips[1] = yukseklik ofseti)
        var c = mcClip(name); if (!c) return false; var u = t * c.fps; if (loop) { u = u % (c.n - 1); if (u < 0) u += c.n - 1; } else u = Math.max(0, Math.min(c.n - 1, u));
        var i0 = Math.floor(u), i1 = Math.min(c.n - 1, i0 + 1), w = u - i0, a = c.a, o0 = i0 * 42, o1 = i1 * 42, b, k, s;
        for (b = 0; b < 13; b++) { s = mr ? MC_MIR[b] : b; for (k = 0; k < 3; k++) { var v = (a[o0 + s * 3 + k] + (a[o1 + s * 3 + k] - a[o0 + s * 3 + k]) * w) / 1000; out[b * 3 + k] = mr && k > 0 && b > 0 ? -v : mr && b === 0 && k === 2 ? -v : v; } }
        return true;
    }
    function mcRoot(name, t, out, mr) { var c = mcClip(name); if (!c) return false; var u = Math.max(0, Math.min(c.n - 1, t * c.fps)), i0 = Math.floor(u), i1 = Math.min(c.n - 1, i0 + 1), w = u - i0, o0 = i0 * 42 + 39, o1 = i1 * 42 + 39, k; for (k = 0; k < 3; k++) out[k] = (c.a[o0 + k] + (c.a[o1 + k] - c.a[o0 + k]) * w) / 1000; if (mr) { out[0] = -out[0]; out[1] = -out[1]; } return true; }
    var GAIT_SP = [0, 1.6, 4.2, 8.3];
    /* [fiz] adim kadansi (adim/sn): yuruyus ~1.7-2.2, kosu ~2.6-3.3, depar ~3.6-4.3 (kosu biyomekanigi verisi); top surerken %12 sik. Adim evresi metre basina
       pi * kadans / hiz ilerler (iki adim = 2pi). Kopru esi: crGaitK (ayni tablo). */
    var GAIT_CX = [0, 1, 1.6, 2.5, 3.5, 4.2, 5, 6, 7, 8.3, 9.5, 10.5], GAIT_CY = [1.2, 1.7, 2.0, 2.6, 2.85, 2.95, 3.1, 3.3, 3.55, 4.0, 4.3, 4.6];      // [v133] cok hizli oyuncu (10.5 m/sn) daha sik adim
    function gaitCad(sp) { if (!(sp > 0)) return GAIT_CY[0]; for (var i = 1; i < GAIT_CX.length; i++) if (sp <= GAIT_CX[i]) return GAIT_CY[i - 1] + (GAIT_CY[i] - GAIT_CY[i - 1]) * (sp - GAIT_CX[i - 1]) / (GAIT_CX[i] - GAIT_CX[i - 1]); return GAIT_CY[GAIT_CY.length - 1]; }
    function gaitPhK(sp, ck) { return Math.PI * gaitCad(sp) * (1 + .12 * (ck || 0)) / Math.max(.35, sp || 0); }                                                       // hız çapaları: dur/yürüyüş/koşu/sprint (motorun gerçek maks hızı 8.21 m/s)
    function plerp(sp, ys) {                                                                 // hız-çapalı parçalı-doğrusal enterpolasyon
        var xs = GAIT_SP;
        if (sp <= xs[0]) return ys[0];
        for (var i = 1; i < xs.length; i++) { if (sp <= xs[i]) { var tt = (sp - xs[i - 1]) / (xs[i] - xs[i - 1]); return lerp2(ys[i - 1], ys[i], tt); } }
        return ys[ys.length - 1];
    }
    var PL_STF = [0.62, 0.60, 0.38, 0.20];                                                    // [oa] sabit dizi (kare başına tahsis yok)
    function stanceFracFor(sp) { return plerp(sp, PL_STF); }               // duruş fazı payı (Perry gait-cycle / sprint temas süresi araştırması)
    function warpPhase(ph, stanceFrac) {                                                     // ham fazı (0=ayak önde) duruşta yavaş/salınımda hızlı akan bir eğriye büker
        var u = ((ph % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI) / (2 * Math.PI);
        var w;
        if (u < stanceFrac) { var tt = smooth01(u / stanceFrac); w = lerp2(0.25, 0.75, tt); }
        else { var tt2 = smooth01((u - stanceFrac) / (1 - stanceFrac)); w = lerp2(0.75, 1.25, tt2); }
        return w * 2 * Math.PI;
    }
    function rngf(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

    /* ---------- GLB (Godot çıktısı) ---------- */
    var MODELS = null, BODY_MESH = [null, null, null];
    function parseGLB(b64) {
        var bin = atob(b64), n = bin.length, u8 = new Uint8Array(n), i;
        for (i = 0; i < n; i++) u8[i] = bin.charCodeAt(i);
        var dv = new DataView(u8.buffer), jl = dv.getUint32(12, true), json = JSON.parse(new TextDecoder().decode(u8.subarray(20, 20 + jl)));
        var bo = 20 + jl, bl = dv.getUint32(bo, true), buf = u8.buffer.slice(bo + 8, bo + 8 + bl);
        var mats = json.materials.map(function (m) {
            var c = (m.pbrMetallicRoughness && m.pbrMetallicRoughness.baseColorFactor) || [1, 1, 1, 1];
            return { name: m.name || '', c: [lin2s(c[0]), lin2s(c[1]), lin2s(c[2])], a: c[3] == null ? 1 : c[3], emis: !!m.emissiveFactor, blend: m.alphaMode === 'BLEND' };
        });
        function readAcc(ai) {
            var a = json.accessors[ai], bv = json.bufferViews[a.bufferView], off = (bv.byteOffset || 0) + (a.byteOffset || 0);
            if (a.componentType === 5126) return new Float32Array(buf, off, a.count * (a.type === 'VEC3' ? 3 : 1));
            if (a.componentType === 5123) return new Uint16Array(buf, off, a.count);
            return new Uint32Array(buf, off, a.count);
        }
        var meshes = json.meshes.map(function (m) { return m.primitives.map(function (p) { return { P: readAcc(p.attributes.POSITION), N: readAcc(p.attributes.NORMAL), I: readAcc(p.indices), mat: mats[p.material] }; }); });
        var nodes = json.nodes.map(function (n2, k) { return { id: k, name: n2.name || '', t: n2.translation || [0, 0, 0], q: n2.rotation || [0, 0, 0, 1], s: n2.scale || [1, 1, 1], mesh: n2.mesh, kids: n2.children || [] }; });
        var byName = {}; nodes.forEach(function (n2) { byName[n2.name] = n2; });
        return { nodes: nodes, meshes: meshes, mats: mats, byName: byName };
    }

    /* ---------- oyuncu HD geometri: dönel-simetrik (loft) parçaları GERÇEK Godot verisinden
       ölçülen halka profiliyle (y yüksekliği + o yükseklikteki gerçek x/z yarıçapı, en-küçük-
       kareler elips uydurmasıyla çıkarılır) daha yüksek açısal çözünürlükte yeniden örer.
       Taper/bulge silueti BİREBİR korunur (uydurma geometri YOK), yalnızca 8-12 açısal dilimden
       16-24'e çıkarılarak yuvarlaklık artırılır. El (9,13) ve bot (18,23) KASITLI hariç: bunlar
       dönel-simetrik olmayan (parmak/burun/topuk şekilli) gerçek modelleme - olduğu gibi kalır.
       TEK kasıtlı sapma: JOINT_MARGIN'deki parçalar (aşağıda) - bkz orada. */
    function fitEllipseR(pts) {                                       // pts: [[x,z],...] aynı y'de, merkez=orijin
        var Saa = 0, Sab = 0, Sbb = 0, Sa = 0, Sb = 0, n = pts.length, anyNonzero = false, i, a, b;
        for (i = 0; i < n; i++) { a = pts[i][0] * pts[i][0]; b = pts[i][1] * pts[i][1]; if (a > 1e-12 || b > 1e-12) anyNonzero = true; Saa += a * a; Sab += a * b; Sbb += b * b; Sa += a; Sb += b; }
        if (!anyNonzero) return [0, 0];
        var det = Saa * Sbb - Sab * Sab;
        if (Math.abs(det) < 1e-15) { var mx = 0, j; for (j = 0; j < n; j++) mx = Math.max(mx, pts[j][0] * pts[j][0] + pts[j][1] * pts[j][1]); var rr = Math.sqrt(mx); return [rr, rr]; }
        var u = (Sa * Sbb - Sb * Sab) / det, v = (Saa * Sb - Sab * Sa) / det;
        return [u > 1e-9 ? 1 / Math.sqrt(u) : 0, v > 1e-9 ? 1 / Math.sqrt(v) : 0];
    }
    function ringsFromMesh(prims) {                                    // yalnızca tek-primitive'li basit parçalar
        if (prims.length !== 1) return null;
        var P = prims[0].P, nv = P.length / 3, groups = {}, i, y, yk, g;
        for (i = 0; i < nv; i++) { y = P[i * 3 + 1]; yk = y.toFixed(4); g = groups[yk] || (groups[yk] = { y: y, pts: [] }); g.pts.push([P[i * 3], P[i * 3 + 2]]); }
        var ys = Object.keys(groups).map(Number).sort(function (a, b) { return a - b; });
        return ys.map(function (ykk) { var gg = groups[ykk.toFixed(4)], r = fitEllipseR(gg.pts); return { y: gg.y, rx: r[0], rz: r[1] }; });
    }
    function revolvePart(rings, segs) {                                // profil + açısal dilim sayısı -> {P,N,I}
        var nR = rings.length; if (nR < 2) return null;
        var P = [], N = [], I = [], ringIdx = [];
        function push(x, y, z, nx, ny, nz) { P.push(x, y, z); N.push(nx, ny, nz); return P.length / 3 - 1; }
        var r, cur, below, above, dRx, dRz, dRy, s, s2, th, ct, st, x, y, z, dThx, dThz, tvx, tvy, tvz, nx, ny, nz, nl, botC, topC;
        for (r = 0; r < nR; r++) {
            cur = rings[r]; below = rings[Math.max(0, r - 1)]; above = rings[Math.min(nR - 1, r + 1)];
            dRx = above.rx - below.rx; dRz = above.rz - below.rz; dRy = above.y - below.y;
            ringIdx[r] = [];
            for (s = 0; s < segs; s++) {
                th = s / segs * 2 * Math.PI; ct = Math.cos(th); st = Math.sin(th);
                x = cur.rx * ct; z = cur.rz * st; y = cur.y;
                dThx = -cur.rx * st; dThz = cur.rz * ct;               // teğet: açısal (çevresel) yön
                tvx = dRx * ct; tvy = dRy; tvz = dRz * st;             // teğet: profil (boyuna) yön
                nx = tvy * dThz; ny = tvz * dThx - tvx * dThz; nz = -tvy * dThx;  // cross(dV, dTheta) = dışa bakan normal
                nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
                ringIdx[r].push(push(x, y, z, nx, ny, nz));
            }
        }
        botC = push(0, rings[0].y, 0, 0, -1, 0); topC = push(0, rings[nR - 1].y, 0, 0, 1, 0);
        for (s = 0; s < segs; s++) {
            s2 = (s + 1) % segs;
            I.push(botC, ringIdx[0][s], ringIdx[0][s2]);
            I.push(topC, ringIdx[nR - 1][s2], ringIdx[nR - 1][s]);
            for (r = 0; r < nR - 1; r++) { var va = ringIdx[r][s], vb = ringIdx[r][s2], vc = ringIdx[r + 1][s], vd = ringIdx[r + 1][s2]; I.push(va, vd, vb); I.push(va, vc, vd); }
        }
        return { P: new Float32Array(P), N: new Float32Array(N), I: I.length > 65535 ? new Uint32Array(I) : new Uint16Array(I) };
    }
    // hedef parça (GLB mesh indeksi) -> açısal dilim sayısı. El (9,13) ve bot (18,23) KASITLI
    // hariç tutulur (bkz. yukarıdaki not).
    var PLAYER_HD_SEGS = { 0: 24, 1: 24, 2: 20, 3: 20, 4: 24, 5: 20, 6: 20, 7: 20, 8: 20, 10: 20, 11: 20, 12: 20, 14: 20, 15: 20, 16: 20, 17: 16, 19: 20, 20: 20, 21: 20, 22: 16 };
    // Eklem-örtüşmesi (joint sleeve): GERÇEK Godot verisi doğrudan ölçüldüğünde (bkz PLAN.md) bu 6
    // parçanın (üst kol/uyluk/çorap) geometrisi komşu pivot noktasında (dirsek/diz/bilek) TAM SIFIR
    // paylaşımla bitiyordu - üst kol tam olarak dirsek pivotunda duruyor, uyluk tam diz pivotunda,
    // çorap tam bilek pivotunda. Sonuç: eklem herhangi bir açıyla büküldüğünde iki parça arasında
    // görünür bir V-boşluğu açılıyordu (rijit-segment "oyuncak bebek/kukla eklemi" görünümünün temel
    // nedeni - iki ayrı katı parça birbirinden ayrılıyor, gerçek bir uzuv gibi deri/kumaş sürekli
    // AKMIYOR). Düzeltme: parçanın pivota bakan (alt) ucunu, SON ölçülen halkanın GERÇEK yarıçapıyla
    // (düz bir silindirik uzatma - incelme/kalınlaşma YOK, uydurma profil YOK) küçük bir pay kadar
    // pivotun ÖTESİNE taşıyoruz; komşu parça (alt bacak/önkol) döndüğünde artık arkasında boşluk değil
    // hafif bir örtüşme kalıyor. Pay büyüklüğü, bu modelde zaten var olan diğer kasıtlı örtüşmelerle
    // (Sleeve ~.045, Neck ~.06 - ölçüldü) aynı mertebede seçildi; iskelet HİÇ değişmedi (yalnızca
    // görünen geometri komşu pivotun biraz içine taşıyor), motorun poz/kinematik mantığına dokunmaz.
    var JOINT_MARGIN = { UpperSkinL: .04, UpperSkinR: .04, ThighL: .045, ThighR: .045, SockL: .035, SockR: .035 };
    function extendLo(rings, margin) {                                 // en alt (pivota en yakın) halkanın AYNI yarıçapıyla bir halka daha ekler
        var r0 = rings[0];
        return [{ y: r0.y - margin, rx: r0.rx, rz: r0.rz }].concat(rings);
    }
    function upgradePlayerMeshes(glb) {
        var marginByIdx = {};
        Object.keys(JOINT_MARGIN).forEach(function (nm) { var n = glb.byName[nm]; if (n && n.mesh != null) marginByIdx[n.mesh] = JOINT_MARGIN[nm]; });
        Object.keys(PLAYER_HD_SEGS).forEach(function (k) {
            var idx = +k, prims = glb.meshes[idx]; if (!prims || !prims.length) return;
            var rings = ringsFromMesh(prims); if (!rings || rings.length < 2) return;
            if (marginByIdx[idx] != null) rings = extendLo(rings, marginByIdx[idx]);
            var gen = revolvePart(rings, PLAYER_HD_SEGS[idx]); if (!gen) return;
            glb.meshes[idx] = [{ P: gen.P, N: gen.N, I: gen.I, mat: prims[0].mat }];
        });
    }

    /* =====================================================================
       PROSEDÜREL ANATOMİK OYUNCU GÖVDESİ (tek parça, iskelet ağırlıklı - "kukla" görünümünün kökten çözümü)
       Eski model 24 AYRI katı parçadan (tüp kol/bacak, kutu gövde) oluşuyordu ve her parça kendi pivotu
       etrafında bağımsız dönüyordu - eklemlerde kırılma, omuz/kas yok, orantılar (kısa bacak, uzun gövde)
       gerçek insan ölçülerinden uzaktı. Bu blok, aynı 13 pivotlu iskelete (PIVOTS sırası, poseFor'un ürettiği
       açılar AYNEN kullanılır) bağlı, SÜREKLİ bir gövde üretir:
         - orantılar antropometrik oranlardan (Drillis & Contini segment uzunlukları, boy H ~ 1.85 birim):
           omuz .818H, dirsek .635H, bilek .49H, kalça eklemi .52H, diz .276H, ayak bileği .038H;
         - kesitler süperelips + açısal "kas" tümsekleri (göğüs, kürek kemiği, kalça, quadriseps/VMO, diz
           kapağı, baldır, deltoid, biseps, ön kol) - kesit tablosu yükseklik boyunca Catmull-Rom ile pürüzsüz;
         - her köşe en fazla iki kemiğe ağırlıklı (kalça/diz/bilek/dirsek/omuz/boyun/bel geçişleri);
         - çizim GPU'da ÇİFT KUATERNİYON (DQS) deri bağlamasıyla yapılır: diz 147°'ye kadar büküldüğünde
           doğrusal karışımın yaptığı "hacim çökmesi" olmaz;
         - giysi katmanları (forma, şort, tozluk, bot) aynı yüzeyin kalınlık ofsetleriyle - kenarlarda
           gerçek bir dikiş/kıvrım basamağı oluşur; renkler palet yuvalarıyla (PSLOT) mevcut sistemle uyumlu.
       Hiçbir dış varlık, doku veya marka kullanılmaz; her şey yükleme anında bu koddan üretilir.
       ===================================================================== */
    var BODY_BONES = [                      // [ad, ebeveyn, ebeveyn pivotuna göre bağ (bind) ofseti] - PIVOTS ile AYNI sıra
        ['Hips', -1, [0, .98, 0]], ['Torso', 0, [0, .04, 0]], ['Head', 1, [0, .582, 0]],
        ['ArmL', 1, [-.18, .49, -.005]], ['ForeL', 3, [0, -.335, 0]], ['ArmR', 1, [.18, .49, -.005]], ['ForeR', 5, [0, -.335, 0]],
        ['LegL', 0, [-.09, -.02, 0]], ['ShinL', 7, [0, -.45, 0]], ['FootL', 8, [0, -.44, 0]],
        ['LegR', 0, [.09, -.02, 0]], ['ShinR', 10, [0, -.45, 0]], ['FootR', 11, [0, -.44, 0]]];
    var BB = {}; BODY_BONES.forEach(function (b, i) { BB[b[0]] = i; });
    var BODY_BIND = (function () { var o = []; BODY_BONES.forEach(function (b, i) { var p = b[1] < 0 ? [0, 0, 0] : o[b[1]]; o.push([p[0] + b[2][0], p[1] + b[2][1], p[2] + b[2][2]]); }); return o; })();
    var SLOT_N = 12;                         // 0 forma 1 şort 2 tozluk 3 ten 4 saç 5 bot 6 el/eldiven 7 şerit 8 taban 9 forma-2 10 göz/kaş 11 dudak
    function sstep(a, b, x) { var t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
    function gbell(d, s) { return Math.exp(-(d / s) * (d / s)); }
    function adiff(a, b) { var d = a - b; return d - 6.283185307179586 * Math.round(d / 6.283185307179586); }
    /* kesit tablosunu (sütun 0 = yükseklik) Catmull-Rom ile örnekler (uçlarda sabit) */
    function tableAt(rows, y) {
        var n = rows.length, i = 0, k;
        if (rows[0][0] > rows[n - 1][0]) { rows = rows.slice().reverse(); }
        if (y <= rows[0][0]) return rows[0].slice(1); if (y >= rows[n - 1][0]) return rows[n - 1].slice(1);
        while (i < n - 2 && y > rows[i + 1][0]) i++;
        var r0 = rows[Math.max(0, i - 1)], r1 = rows[i], r2 = rows[i + 1], r3 = rows[Math.min(n - 1, i + 2)], t = (y - r1[0]) / (r2[0] - r1[0]), out = [];
        for (k = 1; k < r1.length; k++) {
            var p0 = r0[k], p1 = r1[k], p2 = r2[k], p3 = r3[k], t2 = t * t, t3 = t2 * t;
            var v = .5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
            var lo = Math.min(p1, p2), hi = Math.max(p1, p2); out.push(v < lo ? lo : v > hi ? hi : v);   // aşmasız (monoton) - kesit "dalgalanmaz"
        }
        return out;
    }
    function BodyAcc() { this.P = []; this.N = []; this.UV = []; this.S = []; this.B = []; this.W = []; this.I = []; this.part = []; }
    BodyAcc.prototype.v = function (x, y, z, u, vv, slot, ba, bb, w) { this.P.push(x, y, z); this.N.push(0, 0, 0); this.UV.push(u, vv); this.S.push(slot); this.B.push(ba, bb); this.W.push(w); return this.P.length / 3 - 1; };
    /* üçgeni, verilen referans noktasından DIŞA bakacak şekilde (CCW) ekler; sıfır alanlıları atlar */
    BodyAcc.prototype.tri = function (a, b, c, rx, ry, rz) {
        var P = this.P, ax = P[a * 3], ay = P[a * 3 + 1], az = P[a * 3 + 2];
        var ux = P[b * 3] - ax, uy = P[b * 3 + 1] - ay, uz = P[b * 3 + 2] - az, vx = P[c * 3] - ax, vy = P[c * 3 + 1] - ay, vz = P[c * 3 + 2] - az;
        var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = nx * nx + ny * ny + nz * nz;
        if (l < 1e-24) return;
        var cx = (ax + P[b * 3] + P[c * 3]) / 3 - rx, cy = (ay + P[b * 3 + 1] + P[c * 3 + 1]) / 3 - ry, cz = (az + P[b * 3 + 2] + P[c * 3 + 2]) / 3 - rz;
        if (nx * cx + ny * cy + nz * cz < 0) this.I.push(a, c, b); else this.I.push(a, b, c);
    };
    /* halka dizisi -> yüzey. ring: {p:[[x,y,z]...] (M+1 nokta, son = ilk; dikiş kopyası), u:[...], v, s: yuva|[yuva], c:[merkez]}
       capA/capB: uçlar kapatılacaksa kutup noktası [x,y,z] */
    function loftRings(acc, rings, wfn, capA, capB) {
        var idx = [], i, k, M = rings[0].p.length - 1;
        for (i = 0; i < rings.length; i++) {
            var rg = rings[i], row = [];
            for (k = 0; k <= M; k++) { var q = rg.p[k], wb = wfn(q[0], q[1], q[2]); row.push(acc.v(q[0], q[1], q[2], rg.u[k], rg.v, Array.isArray(rg.s) ? rg.s[k] : rg.s, wb[0], wb[1], wb[2])); }
            idx.push(row);
        }
        for (i = 0; i < rings.length - 1; i++) {
            var c0 = rings[i].c, c1 = rings[i + 1].c, rx = (c0[0] + c1[0]) / 2, ry = (c0[1] + c1[1]) / 2, rz = (c0[2] + c1[2]) / 2;
            for (k = 0; k < M; k++) { var a = idx[i][k], b = idx[i][k + 1], c = idx[i + 1][k], d = idx[i + 1][k + 1]; acc.tri(a, b, d, rx, ry, rz); acc.tri(a, d, c, rx, ry, rz); }
        }
        function cap(row, ring, pole) {
            var wb = wfn(pole[0], pole[1], pole[2]), pv = acc.v(pole[0], pole[1], pole[2], .5, ring.v, Array.isArray(ring.s) ? ring.s[0] : ring.s, wb[0], wb[1], wb[2]), c = ring.c;
            for (k = 0; k < M; k++) acc.tri(pv, row[k], row[k + 1], c[0], c[1], c[2]);
        }
        if (capA) cap(idx[0], rings[0], capA);
        if (capB) cap(idx[rings.length - 1], rings[rings.length - 1], capB);
    }
    /* süperelips kesit noktaları. th=0 ön (+Z), th=+pi/2 +X. side: uzvun x işareti (-1 sol pivot, +1 sağ, 0 gövde).
       prm: {ain, aout, bf, bb, n} ; bumps: [[phi, sigma, amp], ...] (phi: 0 ön, +pi/2 İÇ/medial, pi arka) */
    function secRing(cx, y, cz, prm, bumps, M, side, th0, off, slot, vv) {
        var p = [], u = [], k;
        for (k = 0; k <= M; k++) {
            var th = th0 + (k === M ? 0 : k / M * 2 * Math.PI), s = Math.sin(th), c = Math.cos(th);
            var medialX = side < 0 ? 1 : -1, ax = side === 0 ? prm.ain : ((s >= 0) === (medialX > 0) ? prm.ain : prm.aout), bz = c >= 0 ? prm.bf : prm.bb, n = prm.n || 2.2;
            var r = 1 / Math.pow(Math.pow(Math.abs(s) / ax, n) + Math.pow(Math.abs(c) / bz, n), 1 / n), j;
            for (j = 0; bumps && j < bumps.length; j++) {
                var bp = bumps[j], phi = bp[0];
                if (side === 0) r *= 1 + bp[2] * (gbell(adiff(th, phi), bp[1]) + (phi !== 0 && Math.abs(phi - Math.PI) > 1e-6 ? gbell(adiff(th, -phi), bp[1]) : 0));
                else r *= 1 + bp[2] * gbell(adiff(th, side < 0 ? phi : -phi), bp[1]);
            }
            r += (typeof off === 'function') ? off(th) : off;
            p.push([cx + r * s, y, cz + r * c]); u.push(k / M);
        }
        return { p: p, u: u, v: vv, s: slot, c: [cx, y, cz] };
    }
    /* yükseklik örnekleri: düzgün adım + (kopya) sınır halkaları. bounds: [[y, {slot, off} altı, {slot, off} üstü], ...] */
    function ySamples(y0, y1, step, bounds) {
        var n = Math.max(2, Math.ceil(Math.abs(y1 - y0) / step)), i, ys = [], bvals = [];
        (bounds || []).forEach(function (b) { if ((b - y0) * (b - y1) < 0 && bvals.every(function (q) { return Math.abs(q - b) > 1e-9; })) bvals.push(b); });
        for (i = 0; i <= n; i++) { var y = y0 + (y1 - y0) * i / n; if (i > 0 && i < n && bvals.some(function (b) { return Math.abs(b - y) < step * .4; })) continue; ys.push({ y: y }); }
        bvals.forEach(function (b) { ys.push({ y: b, bd: true, side: 0 }); ys.push({ y: b, bd: true, side: 1 }); });
        var down = y1 < y0;
        ys.sort(function (a, b) { if (a.y !== b.y) return down ? b.y - a.y : a.y - b.y; return down ? (b.side || 0) - (a.side || 0) : (a.side || 0) - (b.side || 0); });
        return ys;
    }
    /* katman (giysi) çözümü: y'nin hangi aralıkta olduğuna göre {slot, off}. layers: [[yAlt, yUst, slot, off(y, th)|sayı], ...] - ilk eşleşen */
    function layerIndex(layers, y, upper) {          // sınırda: upper=true -> üstteki katman
        var best = -1;
        for (var i = 0; i < layers.length; i++) { var L = layers[i]; if (y >= L[0] - 1e-9 && y <= L[1] + 1e-9) { if (best < 0) best = i; else if (upper ? L[1] > layers[best][1] : L[0] < layers[best][0]) best = i; } }
        return best < 0 ? layers.length - 1 : best;
    }
    /* bir uzuv/gövde yüzeyi: kesit tablosu + katmanlar + tümsek fonksiyonu. rows: [y, ain, aout, bf, bb, dz, n] */
    function limbSurface(acc, o) {
        var bvals = []; o.layers.forEach(function (L) { bvals.push(L[0], L[1]); });
        var ys = ySamples(o.y0, o.y1, o.step, bvals), rings = [];
        ys.forEach(function (e) {
            var t = tableAt(o.rows, e.y), prm = { ain: t[0], aout: t[1], bf: t[2], bb: t[3], n: t[5] || 2.2 }, dz = t[4] || 0;
            var L = o.layers[layerIndex(o.layers, e.y, e.bd ? e.side === 1 : true)];   // sınır kopyasında: side 1 = üst katman (iki yönde de)
            var off = typeof L[3] === 'function' ? (function (yy, f) { return function (th) { return f(yy, th); }; })(e.y, L[3]) : L[3];
            var rg = secRing(o.cx(e.y), e.y, o.cz + dz, prm, o.bumps ? o.bumps(e.y) : null, o.M, o.side, o.th0 || 0, off, L[2], (e.y - o.vy0) / (o.vy1 - o.vy0));
            if (o.warp) rg.p.forEach(o.warp);
            rings.push(rg);
        });
        loftRings(acc, rings, o.wfn, o.capA, o.capB);
        return rings;
    }
    /* iki nokta arasında dairesel kesitli konik tüp (başparmak, kulak vb. küçük parçalar) */
    function tubeAlong(acc, p0, p1, r0, r1, nr, M, slot, wfn, cap0, cap1) {
        var dx = p1[0] - p0[0], dy = p1[1] - p0[1], dz = p1[2] - p0[2], L = Math.hypot(dx, dy, dz); dx /= L; dy /= L; dz /= L;
        var ax = Math.abs(dy) < .9 ? [0, 1, 0] : [1, 0, 0], ex = [dy * ax[2] - dz * ax[1], dz * ax[0] - dx * ax[2], dx * ax[1] - dy * ax[0]], el = Math.hypot(ex[0], ex[1], ex[2]); ex = [ex[0] / el, ex[1] / el, ex[2] / el];
        var ey = [dy * ex[2] - dz * ex[1], dz * ex[0] - dx * ex[2], dx * ex[1] - dy * ex[0]], rings = [], i, k;
        for (i = 0; i <= nr; i++) {
            var t = i / nr, r = r0 + (r1 - r0) * t, c = [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t, p0[2] + (p1[2] - p0[2]) * t], p = [], u = [];
            r *= Math.sqrt(Math.max(0, 1 - Math.pow(Math.abs(2 * t - 1), 6)) * .25 + .75);
            for (k = 0; k <= M; k++) { var a = (k === M ? 0 : k / M) * 2 * Math.PI, ca = Math.cos(a), sa = Math.sin(a); p.push([c[0] + r * (ca * ex[0] + sa * ey[0]), c[1] + r * (ca * ex[1] + sa * ey[1]), c[2] + r * (ca * ex[2] + sa * ey[2])]); u.push(k / M); }
            rings.push({ p: p, u: u, v: t, s: slot, c: c });
        }
        loftRings(acc, rings, wfn, cap0 ? [p0[0] - dx * r0 * .6, p0[1] - dy * r0 * .6, p0[2] - dz * r0 * .6] : null, cap1 ? [p1[0] + dx * r1 * .6, p1[1] + dy * r1 * .6, p1[2] + dz * r1 * .6] : null);
    }
    /* kalın şerit (saç perdesi): dış (O) ve iç (I) yüzey ızgaraları [satır][sütun] + dört kenar. Her yüz şeridin İÇİNDEN dışarı bakacak
       biçimde yönlendirilir (arka yüz kırpmasıyla her açıdan kapalı görünür). UV: u sütun (çevre, saç telleri), v satır (yukarıdan aşağı). */
    function ribbon(acc, O, I, slot, wfn) {
        var R = O.length, K = O[0].length, i, k, vo = [], vi = [];
        function V(p, u, v) { var w = wfn(p[0], p[1], p[2]); return acc.v(p[0], p[1], p[2], u, v, slot, w[0], w[1], w[2]); }
        function mid(a, b, c, d) { return [(a[0] + b[0] + c[0] + d[0]) / 4, (a[1] + b[1] + c[1] + d[1]) / 4, (a[2] + b[2] + c[2] + d[2]) / 4]; }
        function quad(a, b, c, d, ref) { acc.tri(a, b, c, ref[0], ref[1], ref[2]); acc.tri(a, c, d, ref[0], ref[1], ref[2]); }
        for (i = 0; i < R; i++) { var ro = [], ri = []; for (k = 0; k < K; k++) { ro.push(V(O[i][k], k / (K - 1), i / (R - 1))); ri.push(V(I[i][k], k / (K - 1), i / (R - 1))); } vo.push(ro); vi.push(ri); }
        for (i = 0; i < R - 1; i++) for (k = 0; k < K - 1; k++) {
            quad(vo[i][k], vo[i][k + 1], vo[i + 1][k + 1], vo[i + 1][k], mid(I[i][k], I[i][k + 1], I[i + 1][k + 1], I[i + 1][k]));
            quad(vi[i][k], vi[i][k + 1], vi[i + 1][k + 1], vi[i + 1][k], mid(O[i][k], O[i][k + 1], O[i + 1][k + 1], O[i + 1][k]));
        }
        for (i = 0; i < R - 1; i++) [[0, 1], [K - 1, K - 2]].forEach(function (e) { var c = e[0], n = e[1]; quad(vo[i][c], vo[i + 1][c], vi[i + 1][c], vi[i][c], mid(O[i][n], O[i + 1][n], I[i + 1][n], I[i][n])); });
        [[R - 1, R - 2], [0, 1]].forEach(function (e) { var r = e[0], n = e[1]; for (k = 0; k < K - 1; k++) quad(vo[r][k], vo[r][k + 1], vi[r][k + 1], vi[r][k], mid(O[n][k], O[n][k + 1], I[n][k + 1], I[n][k])); });
    }
    /* KAFA: işaretli mesafe alanı (SDF) heykeli. Kafatası, alın, orta yüz, elmacık kemikleri, alt çene gövdesi ve köşeleri, çene ucu,
       kaş kemeri, burun (kök-sırt-uç-kanatlar, burun delikleri), dudaklar (üst/alt, ağız çizgisi, ağız köşeleri, philtrum), göz
       yuvası, üst göz kapağı kıvrımı - her biri anatomik ölçülerle (yetişkin erkek: kafa uzunluğu ~20 cm, genişlik ~15.5 cm,
       çene-tepe ~23.6 cm, göz bebekleri arası ~6.3 cm, burun ~5.5 cm, ağız ~5 cm) yerleştirilmiş elipsoit/kapsüllerin YUMUŞAK
       birleşimi (smooth-min) - eski "toplanmış tümsekler" yerine gerçekten organik geçişler. Yüzey, kafa merkezinden çıkan ışınlarla
       (dışarıdan içeri küre izleme + ikiye bölme) örneklenir; böylece mevcut (phi, th) ızgarası, UV'si ve saç düzeni aynen korunur.
       Gözler AYRI küre ağlarıdır (slot 10: iris/göz bebeği/sklera + kornea parlaması shader'da) ve göz kapağı yarığının arkasında durur. */
    var HEAD_S = 1.04;                                                           // kafa ölçeği (oyun kamerasında okunurluk; 7.6 baş boyu)
    var HEAD_C = [0, 1.730, .008], HEAD_R = [.079 * HEAD_S, .118 * HEAD_S, .099 * HEAD_S];
    var EYE_C = [.0315 * HEAD_S, .0055 * HEAD_S, .0670 * HEAD_S], EYE_R = .0121 * HEAD_S;                           // kafa-yerel; x işareti sağ/sol
    function headTh(u) { var t = 2 * u - 1; return Math.PI * t * (.45 + .55 * t * t); }    // u: 0 arka (dikiş), .5 ön - ön tarafta ~2.2x sık
    function sdEll(px, py, pz, cx, cy, cz, rx, ry, rz) { var x = (px - cx) / rx, y = (py - cy) / ry, z = (pz - cz) / rz, k0 = Math.sqrt(x * x + y * y + z * z); if (k0 < 1e-9) return -Math.min(rx, ry, rz); var x1 = x / rx, y1 = y / ry, z1 = z / rz, k1 = Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1); return k0 * (k0 - 1) / k1; }
    function sdCone(px, py, pz, ax, ay, az, bx, by, bz, ra, rb) { var bax = bx - ax, bay = by - ay, baz = bz - az, pax = px - ax, pay = py - ay, paz = pz - az, h = (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz); h = h < 0 ? 0 : h > 1 ? 1 : h; var dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h; return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h); }
    function smin(a, b, k) { var h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * .25; }
    function smax(a, b, k) { return -smin(-a, -b, k); }
    function headSDF(x, y, z) {
        var ax = Math.abs(x), d;
        d = sdEll(x, y, z, 0, .020, -.008, .077, .099, .100);                                   // kafatası
        d = smin(d, sdEll(x, y, z, 0, .028, .040, .066, .055, .055), .030);                     // alın
        d = smin(d, sdEll(x, y, z, 0, -.032, .042, .062, .058, .050), .030);                    // orta yüz (üst çene)
        d = smin(d, sdEll(ax, y, z, .051, -.008, .047, .022, .017, .030), .020);                // elmacık kemikleri
        d = smin(d, sdEll(x, y, z, 0, -.073, .028, .060, .045, .060), .030);                    // alt çene gövdesi
        d = smin(d, sdEll(ax, y, z, .054, -.064, -.004, .015, .030, .030), .025);               // çene köşeleri (gonion)
        d = smin(d, sdEll(x, y, z, 0, -.104, .069, .024, .017, .019), .020);                    // çene ucu
        d = smin(d, sdCone(ax, y, z, .013, .021, .089, .050, .022, .078, .0072, .0055), .010);  // kaş kemeri
        d = smax(d, -sdEll(x, y, z, 0, .012, .0985, .0085, .0060, .0050), .004);              // burun kökü (nasion) çukuru - kaşlar arası dar
        d = smax(d, -sdEll(ax, y, z, .031, .015, .092, .019, .008, .009), .006);                // üst göz kapağı kıvrımı / yörünge çukuru
        d = smax(d, -sdEll(ax, y, z, .0315, .0045, .085, .0160, .0064, .018), .003);           // göz kapağı yarığı (badem)
        d = smin(d, sdCone(x, y, z, 0, .008, .089, 0, -.030, .110, .0042, .0068), .006);        // burun sırtı
        d = smin(d, sdEll(x, y, z, 0, -.037, .109, .0092, .0092, .0098), .007);                 // burun ucu
        d = smin(d, sdEll(ax, y, z, .0122, -.043, .098, .0078, .0068, .0085), .006);            // burun kanatları
        d = smax(d, -sdEll(ax, y, z, .0072, -.0485, .1035, .0036, .0022, .0042), .0015);       // burun delikleri
        d = smax(d, -sdEll(x, y, z, 0, -.057, .0985, .0040, .0060, .0030), .002);              // philtrum oluğu
        d = smin(d, sdEll(x, y, z, 0, -.064, .0905, .0235, .0062, .0102), .006);                // üst dudak
        d = smin(d, sdEll(x, y, z, 0, -.0765, .0885, .0205, .0072, .0105), .006);               // alt dudak
        d = smax(d, -sdEll(x, y, z, 0, -.0703, .0985, .0245, .0011, .0120), .0012);            // ağız çizgisi
        d = smax(d, -sdEll(ax, y, z, .024, -.071, .086, .0035, .0035, .0035), .003);           // ağız köşeleri
        return d;
    }
    /* merkezden (kafa-yerel 0,0,0) yöne giden ışının EN DIŞ yüzey kesişimi: dışarıdan içeri küre izleme, sonra ikiye bölme */
    function headRay(dx, dy, dz) { return headRay0(dx, dy, dz) * HEAD_S; }      // ölçekli kafa: aynı yönde S kat uzak yüzey
    function headRay0(dx, dy, dz) {
        var t = .17, d = headSDF(dx * t, dy * t, dz * t), tp = t, k;
        for (k = 0; k < 80 && d > 1e-5 && t > .02; k++) { tp = t; t -= Math.max(d * .8, .0004); d = headSDF(dx * t, dy * t, dz * t); }
        if (d < 0) { var lo = t, hi2 = tp; for (k = 0; k < 18; k++) { var m = (lo + hi2) * .5; if (headSDF(dx * m, dy * m, dz * m) < 0) lo = m; else hi2 = m; } t = (lo + hi2) * .5; }
        return Math.max(.02, t);
    }
    function headPoint(phi, th) {           // phi: -pi/2 (alt) .. +pi/2 (üst), th: 0 ön - dünya (model) koordinatı
        var cp = Math.cos(phi), dx = cp * Math.sin(th), dy = Math.sin(phi), dz = cp * Math.cos(th), t = headRay(dx, dy, dz);
        return [HEAD_C[0] + dx * t, HEAD_C[1] + dy * t, HEAD_C[2] + dz * t];
    }
    /* saç çizgisi (alın/şakak/ense) - th'ye göre başlangıç enlemi (sin(phi) cinsinden) */
    function hairlineS(th, nape) {
        var a = Math.abs(adiff(th, 0)) / Math.PI, T = [[0, .52], [.18, .44], [.30, .31], [.50, .21], [.62, .15], [.90, nape], [1, nape]], i = 0;
        while (i < T.length - 2 && a > T[i + 1][0]) i++;
        var t = sstep(0, 1, (a - T[i][0]) / (T[i + 1][0] - T[i][0])); return T[i][1] + (T[i + 1][1] - T[i][1]) * t;
    }
    /* saç stilleri - veritabanı (Futbolcu Veritabanı / UE sürümü) ile birebir aynı sıra:
       0 uzun, 1 kısa, 2 kazıtılmış, 3 kel, 4 afro, 5 rasta, 6 mohikan, 7 topuz. Kafa derisi kabuğunun kalınlığı (s = sin(enlem), th = boylam,
       0 ön); stile özgü ek hacimler bodyGen'de: uzun -> ense/omuz perdesi, rasta -> sarkan örgüler, topuz -> tepe-arkada topuz. */
    var HAIR_STYLES = 8, HAIR_STYLES_ALL = 11;              // 8-10: yalnız Meshy saç modeli olan stiller (prosedürel yedekleri: 8 -> afro, 9/10 -> kısa)
    function hairThick(style, s, th) {
        var a = Math.abs(adiff(th, 0)) / Math.PI, top = sstep(.25, .95, s);
        if (style === 0) return .013 + .012 * top + .006 * sstep(.6, 1, a);                                   // uzun: dolgun kabuk (+ perde)
        if (style === 1) return .006 + .008 * top;                                                           // kısa
        if (style === 2) return .0032;                                                                       // kazıtılmış (makine)
        if (style === 4) return .030 + .026 * top + .006 * sstep(.3, .7, a);                                  // afro: yuvarlak, hacimli
        if (style === 5) return .009 + .007 * top;                                                           // rasta: dar taban (+ örgüler)
        if (style === 6) {                                                                                   // mohikan: yanlar kazıtılmış, ortada sırt
            var lat = Math.sqrt(Math.max(0, 1 - s * s)) * Math.abs(Math.sin(th));
            return .0028 + .031 * gbell(lat, .25) * (.35 + .65 * sstep(-.5, .45, s));
        }
        if (style === 7) return .006 + .006 * top;                                                           // topuz: geriye toplanmış (+ topuz)
        return 0;                                                                                            // 3 kel
    }
    /* sakal kalınlığı (veritabanı: 2 = sakal; 1 = kirli sakal yalnızca dokudur). ph: enlem, th: boylam. Yüz alt yarısı: çene altından
       favorilere; üst sınır yanak çizgisi, dudaklar açık (ağız deliği), bıyık üst dudak ile burun arası. Kenarlara doğru incelir. */
    var BEARD_TH = 1.62;
    function beardHi(at) { return at < .32 ? -.50 : at < .7 ? -.50 + (at - .32) / .38 * .17 : at < 1.15 ? -.33 + (at - .7) / .45 * .15 : -.18 + (at - 1.15) / .47 * .20; }
    function beardLo(at) { return at < .5 ? -1.18 : -1.18 + (at - .5) / 1.12 * .43; }
    function beardThick(ph, th) {
        var at = Math.abs(th), hiP = beardHi(at), loP = beardLo(at);
        if (ph > hiP + 1e-6 || ph < loP - 1e-6 || at > BEARD_TH) return 0;
        var e = Math.min(sstep(hiP + .005, hiP - .085, ph), sstep(loP - .005, loP + .07, ph), sstep(BEARD_TH + .005, BEARD_TH - .14, at));
        var mo = (th / .30) * (th / .30) + ((ph + .632) / .088) * ((ph + .632) / .088);                    // ağız (dudaklar) elipsi
        if (mo < 1) return 0;
        var chin = .0045 * gbell(th, .55) * sstep(-.62, -.95, ph), must = ph > -.548 ? -.0025 : 0;           // çene ucu daha gür, bıyık ince
        return (.0068 + chin + must) * e * sstep(1, 1.35, mo);
    }
    /* boyun tabanı eğimi: göğüs kemiği çentiği önde (~1.53), C7 arkada (~1.58) - yaka ve gövde üstü buna uyar */
    function neckTilt(p) { var t = sstep(1.47, 1.565, p[1]); if (t > 0) { var r = Math.sqrt(p[0] * p[0] + p[2] * p[2]) || 1; p[1] += t * .026 * (-p[2] / r); } }
    function bodyWeightsTorso(x, y, z) {
        var ax = Math.abs(x);
        if (y < .935) { var wl = sstep(.94, .84, y) * sstep(.015, .07, ax) * .55; return [BB.Hips, x < 0 ? BB.LegL : BB.LegR, wl]; }
        var wt = sstep(.96, 1.10, y);
        if (y > 1.35 && ax > .10) { var wa = sstep(.10, .19, ax) * sstep(1.35, 1.47, y) * .55; return [BB.Torso, x < 0 ? BB.ArmL : BB.ArmR, wa]; }
        return [BB.Hips, BB.Torso, wt];
    }
    /* üretim bir üreteç (generator): ana iş parçacığını kilitlememek için yakın-çekim ağı (LOD0) kare başına birkaç
       milisaniyelik dilimlerle üretilir (bkz create -> bodyJob); senkron gerektiğinde buildBody sonuna kadar çalıştırır. */
    function buildBody(lod) { var g = bodyGen(lod), r; while (!(r = g.next()).done); return r.value; }
    function* bodyGen(lod) {
        // lod: 0 yakın çekim, 1 yayın, 2 uzak/Düşük kalite (yazılım çizicide ve zayıf GPU'da eski rijit modelin maliyetine yakın)
        var q, acc = new BodyAcc(), hi = lod === 0, lo2 = lod === 2, ST = hi ? .02 : lo2 ? .075 : .042, MT = hi ? 36 : lo2 ? 14 : 20, ML = hi ? 22 : lo2 ? 9 : 12, MA = hi ? 18 : lo2 ? 7 : 10, MH = hi ? 64 : lo2 ? 11 : 16, NH = hi ? 48 : lo2 ? 7 : 11, i;
        /* ---- gövde (pelvis -> boyun tabanı): şort / forma katmanları ---- */
        var torsoRows = [   // y, a, a, bf, bb, dz, n
            [.80, .072, .072, .060, .070, -.004, 2.2], [.84, .128, .128, .082, .100, -.009, 2.3], [.90, .158, .158, .092, .113, -.011, 2.4],
            [.95, .169, .169, .098, .110, -.010, 2.5], [1.00, .161, .161, .098, .097, -.006, 2.5], [1.06, .149, .149, .097, .088, -.002, 2.4],
            [1.14, .151, .151, .102, .089, 0, 2.4], [1.22, .159, .159, .110, .093, .004, 2.5], [1.30, .169, .169, .119, .099, .008, 2.6],
            [1.37, .176, .176, .120, .105, .006, 2.7], [1.43, .184, .184, .110, .106, 0, 2.8], [1.465, .192, .192, .099, .101, -.004, 2.9], [1.49, .180, .180, .086, .093, -.008, 2.7],
            [1.515, .158, .158, .080, .088, -.011, 2.3], [1.54, .122, .122, .070, .080, -.010, 2.1], [1.565, .084, .084, .062, .070, -.008, 2.0]];
        function torsoBumps(y) {
            var pec = .045 * gbell(y - 1.32, .06), blade = .03 * gbell(y - 1.39, .07), spine = -.03 * sstep(1.02, 1.12, y) * sstep(1.50, 1.42, y), glute = .045 * gbell(y - .905, .05), cleft = -.03 * gbell(y - .885, .04);
            return [[.48, .32, pec], [Math.PI - .55, .35, blade], [Math.PI, .16, spine + cleft], [Math.PI - .62, .38, glute], [0, .14, -.012 * gbell(y - 1.16, .08)]];
        }
        var torsoLayers = [[.78, .905, 1, function (y) { return .016; }], [.905, 1.60, 0, function (y) { return .002 + .006 * sstep(1.56, 1.50, y) + .028 * sstep(1.12, .905, y); }]];
        var torsoV0 = acc.P.length / 3;
        limbSurface(acc, { y0: .80, y1: 1.565, step: ST, rows: torsoRows, layers: torsoLayers, bumps: torsoBumps, M: MT, side: 0, th0: 1.5 * Math.PI, cx: function () { return 0; }, cz: 0, vy0: .80, vy1: 1.58, wfn: bodyWeightsTorso, capA: [0, .785, -.004], capB: null, warp: neckTilt });
        yield 0;
        var torsoV1 = acc.P.length / 3;
        /* yaka (şerit) */
        (function () {
            var rows = [[1.53, .098, .098, .084, .090, -.008, 2], [1.585, .081, .081, .071, .077, -.004, 2]], rings = [], ys = [1.53, 1.545, 1.56, 1.573, 1.585];
            ys.forEach(function (y) { var t = tableAt(rows, y), rg = secRing(0, y, t[4], { ain: t[0], aout: t[1], bf: t[2], bb: t[3], n: 2 }, null, MT, 0, 1.5 * Math.PI, 0, 7, .98); rg.p.forEach(neckTilt); rings.push(rg); });
            loftRings(acc, rings, function () { return [BB.Torso, BB.Torso, 0]; }, null, null);
        })();
        /* boyun */
        var neckV0 = acc.P.length / 3;
        limbSurface(acc, {
            y0: 1.49, y1: 1.70, step: ST, rows: [[1.49, .074, .074, .062, .068, 0, 2], [1.56, .068, .068, .060, .064, .003, 2], [1.62, .064, .064, .060, .060, .012, 2], [1.70, .058, .058, .056, .055, .020, 2]],
            layers: [[1.40, 1.80, 3, 0]], bumps: function (y) { return [[Math.PI / 2 + .25, .4, .05 * gbell(y - 1.52, .05)]]; }, M: MA + 4, side: 0, th0: Math.PI, cx: function () { return 0; }, cz: 0, vy0: 1.49, vy1: 1.70,
            wfn: function (x, y) { return [BB.Torso, BB.Head, sstep(1.56, 1.665, y)]; }, capA: null, capB: [0, 1.715, .016]
        });
        var neckV1 = acc.P.length / 3;
        yield 0;
        /* bacaklar */
        [-1, 1].forEach(function (sd) {
            var bL = sd < 0 ? BB.LegL : BB.LegR, bS = sd < 0 ? BB.ShinL : BB.ShinR, bF = sd < 0 ? BB.FootL : BB.FootR, X = .09 * sd;
            var rows = [   // y, ain(iç), aout(dış), bf, bb, dz
                [1.03, .040, .045, .045, .048, 0], [1.01, .056, .060, .061, .063, 0], [.97, .078, .082, .084, .088, 0], [.92, .080, .084, .087, .087, 0], [.85, .077, .084, .086, .080, .002],
                [.77, .072, .078, .082, .074, .003], [.69, .066, .070, .074, .066, .003], [.62, .060, .060, .064, .058, .002], [.57, .055, .052, .058, .053, .002],
                [.53, .050, .049, .057, .050, .003], [.49, .048, .048, .052, .052, 0], [.44, .050, .049, .049, .060, -.004], [.39, .053, .050, .048, .066, -.006],
                [.33, .049, .046, .045, .060, -.005], [.26, .042, .040, .042, .048, -.002], [.19, .036, .034, .038, .039, 0], [.13, .031, .030, .034, .033, 0], [.09, .030, .029, .033, .032, 0], [.075, .028, .027, .030, .030, 0]];
            function bumps(y) {
                return [[Math.PI / 2 - .55, .35, .07 * gbell(y - .60, .035)], [0, .30, .06 * gbell(y - .525, .025)], [Math.PI - .5, .45, .05 * gbell(y - .40, .04)],
                    [-Math.PI / 2 + .25, .5, .03 * gbell(y - .80, .10)], [0, .25, .025 * sstep(.15, .2, y) * sstep(.42, .36, y)]];
            }
            var legLayers = [[.665, 1.10, 1, function (y) { return .004 + .013 * sstep(.95, .88, y) + .021 * sstep(.88, .665, y); }], [.475, .665, 3, 0], [.44, .475, 7, .011], [.0, .44, 2, function (y, th) { return .006 + .007 * gbell(adiff(th, 0), .7) * sstep(.17, .22, y) * sstep(.43, .38, y); }]];
            limbSurface(acc, {
                y0: 1.03, y1: .075, step: ST, rows: rows, layers: legLayers, bumps: bumps, M: ML, side: sd, th0: sd < 0 ? Math.PI / 2 + .2 : -Math.PI / 2 - .2, cx: function () { return X; }, cz: 0, vy0: 1.03, vy1: .075,
                wfn: function (x, y) { if (y > .76) return [BB.Hips, bL, sstep(1.02, .90, y)]; if (y > .30) return [bL, bS, sstep(.555, .465, y)]; return [bS, bF, sstep(.13, .08, y)]; },
                capA: [X, 1.045, 0], capB: [X, .062, 0]
            });
            /* bot: ayak bileğine (FootL/R) katı; topuktan buruna z boyunca loft, hafif dışa dönük (~6°) */
            var A = BODY_BIND[bF], toe = .105 * sd;
            function bootRing(zz, w, yb, yt, slot, vv, M2) {
                var p = [], u = [], k, cy = (yb + yt) / 2, hh = (yt - yb) / 2, nexp = 2.8, cx = A[0] + toe * zz;
                for (k = 0; k <= M2; k++) { var a = (k === M2 ? 0 : k / M2) * 2 * Math.PI, ca = Math.cos(a), sa = Math.sin(a); p.push([cx + w * Math.sign(ca) * Math.pow(Math.abs(ca), 2 / nexp), A[1] + cy + hh * Math.sign(sa) * Math.pow(Math.abs(sa), 2 / nexp), A[2] + zz]); u.push(k / M2); }
                return { p: p, u: u, v: vv, s: slot, c: [cx, A[1] + cy, A[2] + zz] };
            }
            var bootRows = [[-.07, .028, -.056, .012], [-.055, .037, -.056, .050], [-.03, .041, -.056, .068], [0, .043, -.056, .072], [.03, .044, -.056, .052], [.065, .046, -.056, .026], [.10, .047, -.056, .006], [.135, .045, -.056, -.010], [.165, .039, -.056, -.020], [.188, .028, -.054, -.030]];
            var MB = hi ? 20 : lo2 ? 8 : 12, bz = [], zz;
            for (zz = -.07; zz <= .1881; zz += hi ? .018 : lo2 ? .064 : .036) bz.push(zz); if (bz[bz.length - 1] < .188) bz.push(.188);
            var br = bz.map(function (z0) { var t = tableAt(bootRows, z0); return bootRing(z0, t[0], t[1], t[2], 5, (z0 + .07) / .26, MB); });
            var wB = function () { return [bF, bF, 0]; };
            loftRings(acc, br, wB, [A[0] + toe * -.075, A[1] - .02, A[2] - .076], [A[0] + toe * .2, A[1] - .043, A[2] + .2]);
            var sr = bz.map(function (z0) { var t = tableAt(bootRows, z0); return bootRing(z0, t[0] + .004, -.07, -.054, 8, 0, MB); });
            loftRings(acc, sr, wB, [A[0] + toe * -.076, A[1] - .062, A[2] - .077], [A[0] + toe * .197, A[1] - .062, A[2] + .197]);
        });
        yield 0;
        /* kollar + kollar (yarım kol forma) + eller */
        [-1, 1].forEach(function (sd) {
            var bA = sd < 0 ? BB.ArmL : BB.ArmR, bF = sd < 0 ? BB.ForeL : BB.ForeR, S0 = BODY_BIND[bA], X = S0[0], Z = S0[2];
            var rows = [[1.495, .026, .028, .028, .028, 0], [1.485, .040, .044, .042, .043, 0], [1.468, .049, .054, .052, .052, 0], [1.445, .051, .056, .053, .053, 0], [1.415, .047, .052, .051, .050, 0],
                [1.38, .042, .047, .049, .047, .001], [1.33, .040, .044, .048, .046, .002], [1.29, .039, .042, .048, .045, .002], [1.25, .037, .039, .042, .042, 0], [1.20, .035, .037, .036, .041, 0],
                [1.165, .037, .039, .037, .040, 0], [1.13, .040, .042, .039, .037, .002], [1.08, .039, .040, .036, .033, .002], [1.02, .033, .035, .030, .029, 0], [.96, .026, .029, .025, .024, 0], [.92, .019, .021, .027, .026, 0], [.905, .017, .019, .025, .024, 0]];
            function bumps(y) { return [[0, .45, .06 * gbell(y - 1.33, .05)], [Math.PI, .35, .05 * gbell(y - 1.185, .02)], [-Math.PI / 2 + .6, .5, .05 * gbell(y - 1.12, .04)]]; }
            var wArm = function (x, y) { return [bA, bF, sstep(1.215, 1.13, y)]; };
            limbSurface(acc, { y0: 1.495, y1: .905, step: ST, rows: rows, layers: [[0, 2, 3, 0]], bumps: bumps, M: MA, side: sd, th0: sd < 0 ? Math.PI / 2 + .3 : -Math.PI / 2 - .3, cx: function () { return X; }, cz: Z, vy0: 1.495, vy1: .905, wfn: wArm, capA: [X, 1.502, Z], capB: [X, .898, Z] });
            // kol yeni (forma): omuz kubbesi -> kolun ortası, kenarında şerit
            limbSurface(acc, {
                y0: 1.495, y1: 1.335, step: ST, rows: rows, layers: [[1.35, 1.70, 0, function (y) { return .011 + .007 * sstep(1.41, 1.35, y); }], [1.30, 1.35, 7, .019]],
                bumps: bumps, M: MA, side: sd, th0: sd < 0 ? Math.PI / 2 + .3 : -Math.PI / 2 - .3, cx: function () { return X; }, cz: Z, vy0: 1.335, vy1: 1.50, wfn: function () { return [bA, bA, 0]; }, capA: [X, 1.506, Z], capB: null
            });
            // el: avuç içi uyluğa dönük, parmaklar avuca doğru hafif kıvrık (pivot dışı ofset: -sd = iç/medial yön)
            var md = -sd, handRows = [[.925, .016, .018, .024, .023, 0, 0], [.915, .017, .019, .026, .025, 0, 0], [.89, .019, .021, .034, .032, 0, 0], [.855, .019, .021, .042, .040, .002, .002],
                [.82, .017, .019, .043, .040, .006, .002], [.79, .016, .017, .040, .037, .012, .002], [.765, .014, .015, .036, .033, .019, .001], [.745, .012, .013, .030, .028, .025, 0]];
            var wHand = function () { return [bF, bF, 0]; };
            if (!hi) {                                                         // yayın ağı: eldiven-benzeri tek parça (uzakta parmaklar seçilmez)
                var hr = [], hy;
                for (hy = .925; hy >= .7449; hy -= lo2 ? .06 : .03) hr.push(hy); if (hr[hr.length - 1] > .746) hr.push(.745);
                var rings = hr.map(function (y) { var t = tableAt(handRows, y); return secRing(X + md * t[4], y, Z + t[5], { ain: t[0], aout: t[1], bf: t[2], bb: t[3], n: 2.4 }, null, MA, sd, 0, 0, 6, (y - .745) / .18); });
                loftRings(acc, rings, wHand, null, [X + md * .027, .735, Z]);
                if (!lo2) tubeAlong(acc, [X + md * .006, .893, Z + .022], [X + md * .016, .836, Z + .047], .0125, .0085, 3, 6, 6, wHand, true, true);
            } else {
                /* yakın-çekim eli: avuç (bilekten boğumlara) + 4 parmak (her biri 3 boğum, gevşek elde MCP ~20°, PIP ~35°, DIP ~20° avuca
                   doğru kıvrık, hafif yelpaze) + başparmak (öne-aşağı). Parmak uzunlukları/kalınlıkları yetişkin erkek el ölçülerinden. */
                var palmRows = [[.928, .0212, .0232, .0278, .0268, 0, 0], [.915, .0205, .0225, .0295, .0285, 0, 0], [.89, .020, .0215, .035, .033, .001, 0], [.86, .019, .020, .041, .039, .002, .001], [.838, .017, .018, .041, .038, .003, .001]];
                var pr2 = [], py2; for (py2 = .928; py2 >= .8379; py2 -= .011) pr2.push(py2); if (pr2[pr2.length - 1] > .839) pr2.push(.838);
                var prings = pr2.map(function (y) { var t = tableAt(palmRows, y); return secRing(X + md * t[4], y, Z + t[5], { ain: t[0], aout: t[1], bf: t[2], bb: t[3], n: 2.6 }, null, 16, sd, 0, 0, 6, (y - .745) / .18); });
                loftRings(acc, prings, wHand, null, [X + md * .004, .829, Z]);
                var FING = [[.026, .837, .0085, [.042, .025, .020], .10], [.009, .833, .0088, [.046, .028, .021], .03], [-.008, .836, .0082, [.043, .027, .020], -.04], [-.024, .842, .0072, [.034, .020, .018], -.12]];
                FING.forEach(function (f) {
                    var cx = X + md * .003, cy = f[1], cz = Z + f[0], ang = 0, spl = f[4], curl = [.36, .62, .34], r = f[2], k5;
                    for (k5 = 0; k5 < 3; k5++) {
                        ang += curl[k5]; var L = f[3][k5], dy = -Math.cos(ang) * L, dxm = Math.sin(ang) * L, dz = Math.sin(spl) * L * (k5 === 0 ? 1 : .5);
                        var nx = cx + md * dxm, ny = cy + dy, nz = cz + dz, r1 = r * (k5 === 2 ? .80 : .93);
                        tubeAlong(acc, [cx, cy, cz], [nx, ny, nz], r * 1.04, r1, 3, 8, 6, wHand, true, true);
                        cx = nx - md * Math.sin(ang) * r * .35; cy = ny + Math.cos(ang) * r * .35; cz = nz; r = r1;
                    }
                });
                var th0p = [X + md * .006, .888, Z + .026], th1p = [X + md * .016, .860, Z + .045], th2p = [X + md * .023, .834, Z + .052], th3p = [X + md * .027, .815, Z + .050];
                tubeAlong(acc, th0p, th1p, .0125, .0108, 3, 8, 6, wHand, true, true); tubeAlong(acc, th1p, th2p, .0105, .0095, 3, 8, 6, wHand, true, true); tubeAlong(acc, th2p, th3p, .0094, .0080, 3, 8, 6, wHand, true, true);
            }
        });
        yield 0;
        /* kafa + kulaklar */
        var headStart = acc.P.length / 3, rowsH = [], ii, jj;
        var wH = function () { return [BB.Head, BB.Head, 0]; };
        for (ii = 0; ii <= NH; ii++) {
            var phi = -Math.PI / 2 + .18 + (Math.PI - .18) * ii / NH;                // alt kutup boyunun içine gömülü kalır (açık)
            if (ii === NH) phi = Math.PI / 2 - 1e-4;
            var p = [], u = [];
            for (jj = 0; jj <= MH; jj++) { var th = headTh(jj / MH); p.push(headPoint(phi, th)); u.push(jj / MH); }   // dikiş arkada; boylam yüz bölgesinde sık (burun/kaş gibi küçük hatlar örneklenebilsin)
            rowsH.push({ p: p, u: u, v: ii / NH, s: 3, c: [HEAD_C[0], HEAD_C[1] + HEAD_R[1] * Math.sin(phi) * .9, HEAD_C[2]] });
            if ((ii & 7) === 7) yield 0;
        }
        loftRings(acc, rowsH, wH, null, [HEAD_C[0], HEAD_C[1] + HEAD_R[1] + .0005, HEAD_C[2] - .004]);
        var headV1 = acc.P.length / 3;
        /* göz küreleri (slot 10): UV = göz-yerel (x, y) / yarıçap - ön yarıküre; arka yarıküre UV'si +10 kaydırılır (iris çizilmesin) */
        var eyeV0 = acc.P.length / 3;
        [-1, 1].forEach(function (sd) {
            var cx = HEAD_C[0] + sd * EYE_C[0], cy = HEAD_C[1] + EYE_C[1], cz = HEAD_C[2] + EYE_C[2], NR = hi ? 14 : lo2 ? 3 : 6, NS = hi ? 18 : lo2 ? 6 : 8, rings3 = [], k3, m3;
            for (k3 = 1; k3 < NR; k3++) {
                var al = Math.PI * k3 / NR, zz = -Math.cos(al) * EYE_R, rr = Math.sin(al) * EYE_R, pp = [], uu = [];
                for (m3 = 0; m3 <= NS; m3++) { var a3 = (m3 === NS ? 0 : m3 / NS) * 2 * Math.PI; pp.push([cx + rr * Math.cos(a3), cy + rr * Math.sin(a3), cz + zz]); uu.push(m3 / NS); }
                rings3.push({ p: pp, u: uu, v: k3 / NR, s: 10, c: [cx, cy, cz] });
            }
            loftRings(acc, rings3, wH, [cx, cy, cz - EYE_R], [cx, cy, cz + EYE_R * 1.035]);
        });
        var eyeV1 = acc.P.length / 3;
        for (q = eyeV0; q < eyeV1; q++) { var ex0 = acc.P[q * 3] - HEAD_C[0], lx = ex0 - (ex0 < 0 ? -EYE_C[0] : EYE_C[0]), ly = acc.P[q * 3 + 1] - HEAD_C[1] - EYE_C[1], lz = acc.P[q * 3 + 2] - HEAD_C[2] - EYE_C[2]; acc.UV[q * 2] = lx / EYE_R + (lz > 0 ? 0 : 10); acc.UV[q * 2 + 1] = ly / EYE_R; }
        [-1, 1].forEach(function (sd) {           // kulak: yassı (kalınlık ~1 cm, boy ~6 cm), hafif geriye yatık, kafaya gömülü kökle
            var ey = HEAD_C[1] - .008, ez = HEAD_C[2] - .014, er = [], k2, ny = hi ? 8 : lo2 ? 2 : 4, M2 = hi ? 10 : lo2 ? 4 : 6;
            for (k2 = 0; k2 <= ny; k2++) {
                var t = k2 / ny, yy = ey + .031 - .062 * t, prof = Math.sin(Math.PI * Math.min(1, .08 + t * .9)), hz = .0175 * Math.pow(prof, .7) * (1 - .25 * t), hx = .0055 * Math.pow(prof, .5) + .001;
                var cxE = sd * (HEAD_R[0] * .93 + .006 * prof), czE = ez - .006 * (1 - t) + .003, pp = [], uu = [];
                for (var m2 = 0; m2 <= M2; m2++) { var a2 = (m2 === M2 ? 0 : m2 / M2) * 2 * Math.PI; pp.push([cxE + hx * Math.sin(a2), yy, czE + hz * Math.cos(a2)]); uu.push(m2 / M2); }
                er.push({ p: pp, u: uu, v: t, s: 3, c: [cxE, yy, czE] });
            }
            loftRings(acc, er, wH, [sd * HEAD_R[0] * .93, ey + .033, ez - .003], [sd * HEAD_R[0] * .93, ey - .033, ez + .001]);
        });
        var headEnd = acc.P.length / 3;
        yield 0;
        /* saç stilleri: ayrı alt-çizim aralıkları (oyuncu başına biri seçilir; sıra veritabanıyla aynı - bkz HAIR_STYLES) */
        var hairRanges = [], bodyCount = acc.I.length, hairV0 = acc.P.length / 3, KH = hi ? 9 : lo2 ? 3 : 5;
        var wHang = function (x, y) { return [BB.Head, BB.Torso, sstep(1.69, 1.57, y) * .75]; };    // sarkan saç: kökü kafaya, ucu gövdeye bağlı (baş dönünce/eğilince gövdeyle birlikte doğal izler)
        function nrm3(v) { var l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
        function scalpOut(ph, th, extra, st) {                                                     // kafa derisi kabuğunun dış yüzeyindeki nokta (+ ek uzaklık)
            var hp = headPoint(ph, th), n = nrm3([hp[0] - HEAD_C[0], hp[1] - HEAD_C[1], hp[2] - HEAD_C[2]]), d = hairThick(st, Math.sin(ph), th) + .0024 + extra;
            return [hp[0] + n[0] * d, hp[1] + n[1] * d, hp[2] + n[2] * d];
        }
        for (var st = 0; st < HAIR_STYLES; st++) {
            var i0 = acc.I.length;
            if (st !== 3) {
                var nape = st === 0 ? -.66 : st === 5 ? -.60 : -.50, rings2 = [];
                for (ii = 0; ii <= KH; ii++) {
                    var p2 = [], u2 = [];
                    for (jj = 0; jj <= MH; jj++) {
                        var th2 = headTh(jj / MH), s0 = hairlineS(th2, nape), sA = Math.asin(Math.min(.999, s0)), ph2 = sA + (Math.PI / 2 - .02 - sA) * Math.pow(ii / KH, .8);
                        var hp = headPoint(ph2, th2), hn = [hp[0] - HEAD_C[0], hp[1] - HEAD_C[1], hp[2] - HEAD_C[2]], nl = Math.hypot(hn[0], hn[1], hn[2]) || 1, sp2 = Math.sin(ph2);
                        var tk = hairThick(st, sp2, th2) * sstep(0, .30, ii / KH) * (1 + .22 * (gbell(Math.sin(th2 * 7 + st) * 2 + Math.cos(sp2 * 9), .9) - .5)) + .0024;
                        p2.push([hp[0] + hn[0] / nl * tk, hp[1] + hn[1] / nl * tk, hp[2] + hn[2] / nl * tk]); u2.push(jj / MH);
                    }
                    rings2.push({ p: p2, u: u2, v: ii / KH, s: 4, c: [HEAD_C[0], HEAD_C[1], HEAD_C[2]] });
                }
                var top2 = HEAD_C[1] + HEAD_R[1] + hairThick(st, 1, 0) + .0012;
                loftRings(acc, rings2, wH, null, [HEAD_C[0], top2, HEAD_C[2] - .004]);
            }
            if (st === 0) {                                                                       // uzun: kafanın arkası ve yanlarında, başın EN GENİŞ yerinden düz aşağı (omuz hizasına) düşen saç
                // her boylamda: üst nokta kabuğun hemen altında (dikiş görünmez) -> başın en geniş noktası -> serbest düşüş (ense altında başla
                // arada boşluk kalır, saç başı "sarmaz"). Alt kenar düzensiz (tutam uzunlukları), yüze doğru kısalır; tutam kabartıları gölge verir.
                var MC = hi ? 34 : lo2 ? 9 : 16, NC = hi ? 10 : lo2 ? 3 : 6, thA = 1.30, thB = 2 * Math.PI - 1.30, O = [], I2 = [], kc, ic, cols0 = [];
                for (kc = 0; kc <= MC; kc++) {
                    var thc = thA + (thB - thA) * kc / MC, sideF = Math.abs(adiff(thc, Math.PI)) / (Math.PI - thA), best = -1, phW = 0;
                    for (var phc = -.70; phc <= .30; phc += .05) { var qc = scalpOut(phc, thc, 0, 0), rc = Math.hypot(qc[0] - HEAD_C[0], qc[2] - HEAD_C[2]); if (rc > best) { best = rc; phW = phc; } }
                    var pT = scalpOut(phW + .30, thc, -.0035, 0), pW = scalpOut(phW, thc, -.0012, 0), lenC = (.165 - .055 * sideF * sideF) * (1 + .09 * Math.sin(thc * 9) + .05 * Math.sin(thc * 23 + 1.3));
                    cols0.push({ th: thc, sf: sideF, yT: pT[1], rT: Math.hypot(pT[0] - HEAD_C[0], pT[2] - HEAD_C[2]), yW: pW[1], rW: Math.hypot(pW[0] - HEAD_C[0], pW[2] - HEAD_C[2]), yB: pW[1] - lenC });
                }
                for (ic = 0; ic <= NC; ic++) {
                    var tc = ic / NC, ro2 = [], ri2 = [];
                    for (kc = 0; kc <= MC; kc++) {
                        var c0 = cols0[kc], yc, rr, uu;
                        if (tc < .25) { uu = tc / .25; yc = c0.yT + (c0.yW - c0.yT) * uu; rr = c0.rT + (c0.rW - c0.rT) * (uu * (2 - uu)); }
                        else { uu = (tc - .25) / .75; yc = c0.yW + (c0.yB - c0.yW) * uu; rr = c0.rW + .007 * uu * uu; }
                        var clump = .0024 * Math.sin(c0.th * 17 + tc * 1.7) * sstep(.25, .6, tc), hz = .0055 * (1 - .5 * tc) * (1 - .55 * c0.sf * c0.sf), cs = Math.sin(c0.th), cc2 = Math.cos(c0.th);
                        ro2.push([HEAD_C[0] + (rr + clump + hz) * cs, yc, HEAD_C[2] + (rr + clump + hz) * cc2]); ri2.push([HEAD_C[0] + (rr + clump - hz) * cs, yc, HEAD_C[2] + (rr + clump - hz) * cc2]);
                    }
                    O.push(ro2); I2.push(ri2);
                }
                ribbon(acc, O, I2, 4, wHang);
            }
            if (st === 5 && !lo2) {                                                               // rasta: tepe/arka/yanlardan kafa yüzeyini izleyip sarkan örgüler (yüzün önüne kök konmaz)
                var NL = hi ? 30 : 14, MR = hi ? 6 : 4, rr5 = rngf(911);
                for (var nl5 = 0; nl5 < NL; nl5++) {
                    var thL = (nl5 % 2 ? 1 : -1) * (.95 + (Math.PI - .95) * ((nl5 * .6180339) % 1)), phL = -.30 + 1.05 * rr5(), len = .11 + .09 * rr5(), rad = .0068 + .0018 * rr5();
                    var pts = [], phs = phL;
                    while (true) { pts.push(scalpOut(phs, thL, rad * .9, 5)); if (phs <= -.12) break; phs = Math.max(-.12, phs - .34); }
                    var last = pts[pts.length - 1], hd = nrm3([last[0] - HEAD_C[0], 0, last[2] - HEAD_C[2]]), yEnd = Math.max(1.575, last[1] - len);
                    pts.push([last[0] + hd[0] * .012, yEnd, last[2] + hd[2] * .012]);
                    for (var sg = 0; sg < pts.length - 1; sg++) tubeAlong(acc, pts[sg], pts[sg + 1], rad * (1 - .06 * sg), rad * (1 - .06 * (sg + 1)) * (sg === pts.length - 2 ? .8 : 1), 2, MR, 4, wHang, sg === 0, sg === pts.length - 2);
                }
            }
            if (st === 7) {                                                                       // topuz: tepe-arkada, kafa derisi kabuğuna gömülü kökle
                var bc0 = scalpOut(.62, Math.PI, 0, 7), bn = nrm3([bc0[0] - HEAD_C[0], bc0[1] - HEAD_C[1], bc0[2] - HEAD_C[2]]), BR0 = .031, bc = [bc0[0] + bn[0] * BR0 * .55, bc0[1] + bn[1] * BR0 * .55, bc0[2] + bn[2] * BR0 * .55];
                var e1 = nrm3([1, 0, 0]), e2 = nrm3([bn[1] * e1[2] - bn[2] * e1[1], bn[2] * e1[0] - bn[0] * e1[2], bn[0] * e1[1] - bn[1] * e1[0]]), NRb = hi ? 9 : lo2 ? 4 : 6, NSb = hi ? 16 : lo2 ? 7 : 10, rb = [], kb, mb;
                for (kb = 1; kb < NRb; kb++) {
                    var alb = Math.PI * kb / NRb, zb = -Math.cos(alb) * BR0 * .82, rrb = Math.sin(alb) * BR0, pb = [], ub = [], cb = [bc[0] + bn[0] * zb, bc[1] + bn[1] * zb, bc[2] + bn[2] * zb];
                    for (mb = 0; mb <= NSb; mb++) { var ab = (mb === NSb ? 0 : mb / NSb) * 2 * Math.PI, wob = 1 + .07 * Math.sin(3 * ab + kb), ca = Math.cos(ab) * rrb * wob, sa = Math.sin(ab) * rrb * wob * .9; pb.push([cb[0] + e1[0] * ca + e2[0] * sa, cb[1] + e1[1] * ca + e2[1] * sa, cb[2] + e1[2] * ca + e2[2] * sa]); ub.push(mb / NSb); }
                    rb.push({ p: pb, u: ub, v: kb / NRb, s: 4, c: cb });
                }
                loftRings(acc, rb, wH, [bc[0] - bn[0] * BR0 * .82, bc[1] - bn[1] * BR0 * .82, bc[2] - bn[2] * BR0 * .82], [bc[0] + bn[0] * BR0 * .82, bc[1] + bn[1] * BR0 * .82, bc[2] + bn[2] * BR0 * .82]);
            }
            hairRanges.push([i0, acc.I.length - i0]);
            yield 0;
        }
        /* sakal (veritabanı 2): yüz alt yarısında kalınlığı kenarlara doğru incelen kabuk - dudak bölgesi boş kalır (dörtgenin dört köşesi
           de kalınsa çizilir). Uzak ağda (LOD2) yalnızca doku (kirli sakal gibi) - kafa ızgarasıyla aynı (ph, th) parametrizasyonu. */
        var bdI0 = acc.I.length;
        if (!lo2) {
            var BT = hi ? 44 : 18, BP = hi ? 18 : 7, gridB = [], gb, hb;
            for (gb = 0; gb <= BP; gb++) {
                var rowB = [];
                for (hb = 0; hb <= BT; hb++) {
                    var thb = -BEARD_TH + 2 * BEARD_TH * hb / BT, atb = Math.abs(thb), lob = beardLo(atb), hib = beardHi(atb), phb = lob + (hib - lob) * gb / BP;
                    var tkb = beardThick(phb, thb), hpb = headPoint(phb, thb), nb2 = nrm3([hpb[0] - HEAD_C[0], hpb[1] - HEAD_C[1], hpb[2] - HEAD_C[2]]), off = tkb + .0016;
                    rowB.push({ tk: tkb, p: [hpb[0] + nb2[0] * off, hpb[1] + nb2[1] * off, hpb[2] + nb2[2] * off], u: hb / BT, v: gb / BP, i: -1 });
                }
                gridB.push(rowB);
            }
            var bvx = function (c) { if (c.i < 0) c.i = acc.v(c.p[0], c.p[1], c.p[2], c.u, c.v, 4, BB.Head, BB.Head, 0); return c.i; };   // yalnızca kullanılan köşeler (boşta köşe = tanımsız normal)
            for (gb = 0; gb < BP; gb++) for (hb = 0; hb < BT; hb++) {
                var A1 = gridB[gb][hb], B1 = gridB[gb][hb + 1], C1 = gridB[gb + 1][hb + 1], D1 = gridB[gb + 1][hb];
                if (Math.min(A1.tk, B1.tk, C1.tk, D1.tk) < .0011) continue;
                var ia = bvx(A1), ib = bvx(B1), ic2 = bvx(C1), id = bvx(D1);
                acc.tri(ia, ib, ic2, HEAD_C[0], HEAD_C[1], HEAD_C[2]); acc.tri(ia, ic2, id, HEAD_C[0], HEAD_C[1], HEAD_C[2]);
            }
        }
        var beardRange = [bdI0, acc.I.length - bdI0];
        yield 0;
        /* normaller: konuma göre kaynaklanmış (dikiş ve renk sınırlarında pürüzsüz), alan ağırlıklı */
        var P = acc.P, N = acc.N, I = acc.I, key = {}, nv = P.length / 3, grp = new Int32Array(nv), gN = [], q;
        key = new Map(); for (q = 0; q < nv; q++) { var kk = (Math.round(P[q * 3] * 2e4) + 65536) + (Math.round(P[q * 3 + 1] * 2e4) + 65536) * 131072 + (Math.round(P[q * 3 + 2] * 2e4) + 65536) * 17179869184, gk = key.get(kk); if (gk == null) { gk = gN.length / 3; key.set(kk, gk); gN.push(0, 0, 0); } grp[q] = gk; }
        for (q = 0; q < I.length; q += 3) {
            var a = I[q], b = I[q + 1], c = I[q + 2], ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2], vx = P[c * 3] - P[a * 3], vy = P[c * 3 + 1] - P[a * 3 + 1], vz = P[c * 3 + 2] - P[a * 3 + 2];
            var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
            [a, b, c].forEach(function (t) { var g = grp[t] * 3; gN[g] += nx; gN[g + 1] += ny; gN[g + 2] += nz; });
        }
        for (q = 0; q < nv; q++) { var g = grp[q] * 3, l = Math.sqrt(gN[g] * gN[g] + gN[g + 1] * gN[g + 1] + gN[g + 2] * gN[g + 2]) || 1; N[q * 3] = gN[g] / l; N[q * 3 + 1] = gN[g + 1] / l; N[q * 3 + 2] = gN[g + 2] / l; }
        var skipAO = new Uint8Array(nv); for (q = hairV0; q < nv; q++) skipAO[q] = 1;           // saç kabuğu: tepe/yan - örtme yok (hız)
        /* doku koordinatları (oyuncu başına doku katmanı): üst yarı = forma gövdesi (u: 0 sol yan(-X) / .25 ön / .5 sağ yan / .75 sırt,
           v: .005..495 = bel->boyun), alt yarı = yüz (u: .5 ön, v: .51..99 = çene->tepe). Dokusuz yüzeyler (-1,-1) - palet rengi. */
        var UV = acc.UV;
        for (q = 0; q < nv; q++) {
            if (q >= torsoV0 && q < torsoV1 && acc.S[q] === 0) UV[q * 2 + 1] = .005 + .49 * UV[q * 2 + 1];
            else if (q >= headStart && q < headV1) UV[q * 2 + 1] = .51 + .48 * Math.min(1, UV[q * 2 + 1]);
            else if ((q >= eyeV0 && q < eyeV1) || q >= hairV0) { /* göz: göz-yerel; saç: (çevre, saç çizgisi->tepe) - shader kendi yorumlar */ }
            else { UV[q * 2] = -1; UV[q * 2 + 1] = -1; }
        }
        for (q = eyeV0; q < eyeV1; q++) skipAO[q] = 1;
        var AO = yield* bakeAO(P, N, acc.B, nv, skipAO, acc.S);
        for (q = eyeV0; q < eyeV1; q++) AO[q] = .78;                                   // göz küresi: kapak altında, hafif gölgede
        hairRanges.push(hairRanges[4], hairRanges[1], hairRanges[1]);       // stil 8-10 prosedürel yedek kabukları (Meshy kapalıysa)
        var res = { AO: AO, P: new Float32Array(P), N: new Float32Array(N), UV: new Float32Array(acc.UV), S: new Float32Array(acc.S), B: new Float32Array(acc.B), W: new Float32Array(acc.W), I: nv > 65535 ? new Uint32Array(I) : new Uint16Array(I), nv: nv, bodyCount: bodyCount, hair: hairRanges, beard: beardRange, head: [headStart, headEnd], neck: [neckV0, neckV1] };
        if (G.ADO3D_MESHY && G.ADO3D_MESHY_ON !== false) { try { res = yield* meshyMerge(res, lod); } catch (e) { if (G.console && console.warn) console.warn('Ado3D: Meshy gövde birleştirilemedi, prosedürel gövde kullanılıyor:', e && e.message); } }
        return res;
    }
    /* =====================================================================
       MESHY OYUNCU MODELİ (ADO3D_MESHY v2) - gövde + kafa, gerçekçi detay dokusu
       Meshy AI ile üretilen yüksek çözünürlüklü (357 bin üçgen) oyuncu modeli çevrimdışı olarak bu motorun 13 kemikli iskeletine
       yeniden hedeflendi (A-pozdan bağ pozuna), kemik ağırlıkları + palet yuvaları (forma/şort/tozluk/ten/el/şerit/krampon/taban)
       atandı, UV dikişleri korunarak 3 ayrıntı düzeyine indirildi (40000 / 9000 / 2500 üçgen). RENKLER TAKIM PALETİNDEN gelir
       (uPal; forma gövdesi forma dokusunu - numara/isim/desen - silindirik UV ile kullanır); Meshy dokusundan yalnızca logo ve
       numaraları temizlenmiş bir DETAY ORANI dokusu (md) çarpılır: kumaşta parlaklık oranı (kıvrım/dikiş gölgesi), tende kanal
       oranı (yüz hatları, kaş, dudak, kas gölgesi) - böylece ten rengi oyuncuya göre değişir. Kafa Meshy'den gelir; saç stilleri ve
       sakal, prosedürel kafaya göre üretilen kabuklarını Meshy kafatasına radyal olarak uydurur (ht: HEAD_C'den yön başına yüzey
       uzaklığı tablosu). Kapatmak için sayfa yüklenmeden önce: window.ADO3D_MESHY_ON = false (eski prosedürel gövdeye döner).
       ===================================================================== */
    var MESHY_LOD = [null, null, null];
    function meshyDecode(lod) {
        if (MESHY_LOD[lod]) return MESHY_LOD[lod];
        var D = G.ADO3D_MESHY; if (!D || !D.h || !D.b || G.ADO3D_MESHY_ON === false) return null;
        if (!D._u8) { var bin = atob(D.b), n = bin.length, u8 = new Uint8Array(n), i; for (i = 0; i < n; i++) u8[i] = bin.charCodeAt(i); D._u8 = u8; }
        var off = 0, k, h = D.h[lod], buf = D._u8.buffer; for (k = 0; k < lod; k++) off += D.h[k].nv * 18 + D.h[k].ni * 2;
        var nv = h.nv;
        return (MESHY_LOD[lod] = { nv: nv, ni: h.ni, P: new Int16Array(buf, off, nv * 3), UV: new Int16Array(buf, off + nv * 6, nv * 2), UV2: new Int16Array(buf, off + nv * 10, nv * 2),
            S: new Uint8Array(buf, off + nv * 14, nv), B: new Uint8Array(buf, off + nv * 15, nv * 2), W: new Uint8Array(buf, off + nv * 17, nv), I: new Uint16Array(buf, off + nv * 18, h.ni) });
    }
    /* Meshy kafatası: HEAD_C'den (phi, th) yönünde yüzey uzaklığı (0 = isabet yok) - çift doğrusal */
    function meshyHeadR(dx, dy, dz) {
        var T = G.ADO3D_MESHY && G.ADO3D_MESHY.ht; if (!T) return 0;
        var NP = T.np, NT = T.nt, r = T.r, phi = Math.asin(clamp(dy, -1, 1)), th = Math.atan2(dx, dz); if (th < 0) th += 2 * Math.PI;
        var fp = (phi + Math.PI / 2) / Math.PI * (NP - 1), ft = th / (2 * Math.PI) * NT, p0 = Math.min(NP - 2, Math.floor(fp)), t0 = Math.floor(ft) % NT, t1 = (t0 + 1) % NT, ap = fp - p0, at = ft - Math.floor(ft);
        var a = r[p0 * NT + t0], b = r[p0 * NT + t1], c = r[(p0 + 1) * NT + t0], d = r[(p0 + 1) * NT + t1];
        if (!(a > 0 && b > 0 && c > 0 && d > 0)) return 0;
        return (a * (1 - at) + b * at) * (1 - ap) + (c * (1 - at) + d * at) * ap;
    }
    /* kaynaklanmış (konuma göre) alan ağırlıklı köşe normalleri */
    function meshyNormals(Pm, I, nM) {
        var key = new Map(), grp = new Int32Array(nM), gN = [], Nm = new Float32Array(nM * 3), i;
        for (i = 0; i < nM; i++) { var kk = (Math.round(Pm[i * 3] * 2e4) + 65536) + (Math.round(Pm[i * 3 + 1] * 2e4) + 65536) * 131072 + (Math.round(Pm[i * 3 + 2] * 2e4) + 65536) * 17179869184, gk = key.get(kk); if (gk == null) { gk = gN.length / 3; key.set(kk, gk); gN.push(0, 0, 0); } grp[i] = gk; }
        for (i = 0; i < I.length; i += 3) {
            var a = I[i], b = I[i + 1], c = I[i + 2], ux = Pm[b * 3] - Pm[a * 3], uy = Pm[b * 3 + 1] - Pm[a * 3 + 1], uz = Pm[b * 3 + 2] - Pm[a * 3 + 2], vx = Pm[c * 3] - Pm[a * 3], vy = Pm[c * 3 + 1] - Pm[a * 3 + 1], vz = Pm[c * 3 + 2] - Pm[a * 3 + 2];
            var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, g;
            g = grp[a] * 3; gN[g] += nx; gN[g + 1] += ny; gN[g + 2] += nz; g = grp[b] * 3; gN[g] += nx; gN[g + 1] += ny; gN[g + 2] += nz; g = grp[c] * 3; gN[g] += nx; gN[g + 1] += ny; gN[g + 2] += nz;
        }
        for (i = 0; i < nM; i++) { var g2 = grp[i] * 3, l = Math.sqrt(gN[g2] * gN[g2] + gN[g2 + 1] * gN[g2 + 1] + gN[g2 + 2] * gN[g2 + 2]) || 1; Nm[i * 3] = gN[g2] / l; Nm[i * 3 + 1] = gN[g2 + 1] / l; Nm[i * 3 + 2] = gN[g2 + 2] / l; }
        return Nm;
    }
    /* Meshy saç modelleri (ADO3D_HAIR[stil].lods[lod]): kafa kemiğine bağlı (Head, w=0 - boy/kilo kafa ölçeği uygulanır), yuva 4 (saç rengi),
       UV = (boylam, enlem) -> saç gölgelendiricisinin tel bantları ve anizotropik parlaması. lods[i] sayı ise o düzeyin ağını paylaşır. */
    var MESHY_HAIR = {};
    function meshyHair(style, lod) {
        var H = G.ADO3D_HAIR && G.ADO3D_HAIR[style]; if (!H || G.ADO3D_MESHY_ON === false) return null;
        var e = H.lods[lod]; if (typeof e === 'number') { lod = e; e = H.lods[e]; } if (!e) return null;
        var key = style + ':' + lod; if (MESHY_HAIR[key]) return MESHY_HAIR[key];
        var bin = atob(e.b), u8 = new Uint8Array(bin.length), i; for (i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        var nv = e.nv;
        if (e.q) {                                                                   // nicemlenmiş (int16 / 16000): konum + (boylam, enlem)
            var Pq = new Int16Array(u8.buffer, 0, nv * 3), Uq = new Int16Array(u8.buffer, nv * 6, nv * 2), Pf = new Float32Array(nv * 3), Uf = new Float32Array(nv * 2);
            for (i = 0; i < nv * 3; i++) Pf[i] = Pq[i] / 16000; for (i = 0; i < nv * 2; i++) Uf[i] = Uq[i] / 16000;
            return (MESHY_HAIR[key] = { nv: nv, ni: e.ni, P: Pf, UV: Uf, I: new Uint16Array(u8.buffer, nv * 10, e.ni) });
        }
        return (MESHY_HAIR[key] = { nv: nv, ni: e.ni, P: new Float32Array(u8.buffer, 0, nv * 3), UV: new Float32Array(u8.buffer, nv * 12, nv * 2), I: new Uint16Array(u8.buffer, nv * 20, e.ni) });
    }
    function* meshyMerge(m, lod) {
        var md = meshyDecode(lod); if (!md) return m;
        var nE = m.nv, nM = md.nv, i, k, q = 1 / 16000, HX = [], nH = 0;
        for (i = 0; i < m.hair.length; i++) { var hx = meshyHair(i, lod); if (hx) { HX[i] = { o: nE + nM + nH, d: hx }; nH += hx.nv; } }
        var nv = nE + nM + nH;
        var P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), UV = new Float32Array(nv * 2), UV2 = new Float32Array(nv * 2), S = new Float32Array(nv), B = new Float32Array(nv * 2), W = new Float32Array(nv), AO = new Float32Array(nv);
        P.set(m.P); N.set(m.N); UV.set(m.UV); S.set(m.S); B.set(m.B); W.set(m.W); AO.set(m.AO); UV2.fill(-1, 0, nE * 2);
        var Pm = new Float32Array(nM * 3), Nm, Bm = new Float32Array(nM * 2), Sm = new Float32Array(nM);
        for (i = 0; i < nM; i++) {
            for (k = 0; k < 3; k++) Pm[i * 3 + k] = md.P[i * 3 + k] * q;
            UV[(nE + i) * 2] = md.UV[i * 2] < 0 ? -1 : md.UV[i * 2] * q; UV[(nE + i) * 2 + 1] = md.UV[i * 2 + 1] < 0 ? -1 : md.UV[i * 2 + 1] * q;
            UV2[(nE + i) * 2] = md.UV2[i * 2] < 0 ? -1 : md.UV2[i * 2] * q; UV2[(nE + i) * 2 + 1] = md.UV2[i * 2 + 1] < 0 ? -1 : md.UV2[i * 2 + 1] * q;
            Sm[i] = md.S[i]; Bm[i * 2] = md.B[i * 2]; Bm[i * 2 + 1] = md.B[i * 2 + 1]; W[nE + i] = md.W[i] / 255;
        }
        var I = md.I; Nm = meshyNormals(Pm, I, nM);
        yield 0;
        var aoM = yield* bakeAO(Pm, Nm, Bm, nM, null, Sm);
        P.set(Pm, nE * 3); N.set(Nm, nE * 3); B.set(Bm, nE * 2); S.set(Sm, nE); AO.set(aoM, nE);
        HX.forEach(function (h) {                                                      // Meshy saç modelleri: köşe verisi
            var d = h.d, o = h.o, Nh = meshyNormals(d.P, d.I, d.nv), j;
            P.set(d.P, o * 3); N.set(Nh, o * 3);
            for (j = 0; j < d.nv; j++) { var t = o + j; UV[t * 2] = d.UV[j * 2]; UV[t * 2 + 1] = d.UV[j * 2 + 1]; UV2[t * 2] = -1; UV2[t * 2 + 1] = -1; S[t] = 4; B[t * 2] = 2; B[t * 2 + 1] = 2; W[t] = 0; AO[t] = 1; }
        });
        /* saç + sakal kabukları: prosedürel kafa yüzeyine göre kalınlıkları korunarak Meshy kafatasına taşınır (bağ uzayında, radyal) */
        var EI = m.I, mark = new Uint8Array(nE);
        m.hair.forEach(function (r) { for (var j = 0; j < r[1]; j++) mark[EI[r[0] + j]] = 1; });
        if (m.beard) for (i = 0; i < m.beard[1]; i++) mark[EI[m.beard[0] + i]] = 2;
        for (i = 0; i < nE; i++) {
            if (!mark[i]) continue;
            var ex = P[i * 3] - HEAD_C[0], ey = P[i * 3 + 1] - HEAD_C[1], ez = P[i * 3 + 2] - HEAD_C[2], dl = Math.sqrt(ex * ex + ey * ey + ez * ez); if (dl < 1e-6) continue;
            var dx = ex / dl, dy = ey / dl, dz = ez / dl, rM = meshyHeadR(dx, dy, dz); if (!(rM > 0)) continue;
            var rE = headRay(dx, dy, dz), wv = mark[i] === 2 ? 1 : smooth01((dy + .80) / .30), off = dl - rE, nd = dl + (rM - rE) * wv - (mark[i] === 2 ? .3 : .4) * Math.max(0, Math.min(off, .03)) * wv;   // kabuk kafatasına daha sıkı oturur (kask görünümü azalır)           // çene altına doğru (sarkan saç / boyun) etkisi söner
            P[i * 3] = HEAD_C[0] + dx * nd; P[i * 3 + 1] = HEAD_C[1] + dy * nd; P[i * 3 + 2] = HEAD_C[2] + dz * nd;
            if ((i & 1023) === 1023) yield 0;
        }
        /* indeksler: Meshy (gövde + kafa) | saç stilleri | sakal - prosedürel gövde/kafa/göz/kulak çizilmez */
        var out = [], hair = [], beard;
        for (i = 0; i < I.length; i++) out.push(I[i] + nE);
        var body = out.length;
        m.hair.forEach(function (r, hi) { var s = out.length; if (HX[hi]) { var hd = HX[hi]; for (var j2 = 0; j2 < hd.d.ni; j2++) out.push(hd.d.I[j2] + hd.o); hair.push([s, hd.d.ni]); return; } if (hi === 2 && G.ADO3D_BUZZ) { hair.push([s, 0]); return; } for (var j = 0; j < r[1]; j++) out.push(EI[r[0] + j]); hair.push([s, r[1]]); });   // [buzz] kazıtılmış: kabuk yok, kafa derisine boyanır
        beard = [out.length, 0];                 // sakal: Meshy yüzüne boyanır (yüz dokusu katmanı: kirli sakal / sakal) - ayrı kabuk çizilmez, yüzden kopuk durmaz
        return { AO: AO, P: P, N: N, UV: UV, UV2: UV2, S: S, B: B, W: W, I: nv > 65535 ? new Uint32Array(out) : new Uint16Array(out), nv: nv, bodyCount: body, hair: hair, beard: beard, head: m.head, meshy: true };
    }
    /* ortam örtmesi (AO) - bağ pozunda, gövdeyi yaklaşık temsil eden küre/kapsül vekillerine ve zemine karşı ışın
       izlenerek köşe başına bir kez hesaplanır (yükleme anında; çalışma anı maliyeti sıfır). Kasık, koltuk altı, çene altı,
       bacak arası, ayak bileği/zemin temasında gerçekçi koyulaşma verir. Kollar hareketli olduğundan kol<->gövde örtmesi
       yarı ağırlıkla sayılır (kol öne/arkaya sallandığında gövde yanında "kalıcı leke" kalmasın). */
    function* bakeAO(P, N, Bn, nv, skip, Sl) {
        var prims = [], i, k, q;
        function sph(x, y, z, r, g) { prims.push({ t: 0, a: [x, y, z], r: r, g: g }); }
        function cap(a, b, r, g) { prims.push({ t: 1, a: a, b: b, r: r, g: g }); }
        [[.86, -.006], [.95, -.008], [1.05, -.002], [1.15, 0], [1.25, .004], [1.35, .006], [1.43, 0]].forEach(function (L) { sph(0, L[0], L[1], .084, 0); sph(-.075, L[0], L[1], .078, 0); sph(.075, L[0], L[1], .078, 0); });
        sph(0, 1.58, .005, .05, 3); sph(0, 1.738, .008, .088, 3);
        [-1, 1].forEach(function (sd) {
            var X = .09 * sd, A = .18 * sd;
            cap([X, .95, 0], [X, .53, 0], .064, 2); cap([X, .50, -.004], [X, .12, 0], .042, 2); cap([X, .02, -.05], [X + .01 * sd, .02, .17], .03, 2);
            cap([A, 1.47, -.005], [A, 1.19, -.005], .038, 1); cap([A, 1.16, -.005], [A, .94, -.005], .03, 1); cap([A, .92, -.005], [A - .02 * sd, .77, -.005], .02, 1);
        });
        function grpOf(b) { return b === 3 || b === 4 || b === 5 || b === 6 ? 1 : b >= 7 ? 2 : b === 2 ? 3 : 0; }
        // 16 sabit kosinüs-ağırlıklı yarıküre yönü (Hammersley)
        var DIRS = []; for (k = 0; k < 12; k++) { var u1 = (k + .5) / 12, rb = 0, bb2 = k, f = .5; while (bb2) { rb += (bb2 & 1) * f; bb2 >>= 1; f *= .5; } var r = Math.sqrt(u1), ph = 2 * Math.PI * rb; DIRS.push([r * Math.cos(ph), Math.sqrt(1 - u1), r * Math.sin(ph)]); }
        var out = new Float32Array(nv), MAXD = .32, AO_MIN = [.50, .58, .42, .40, .40, .45, .40, .50, .45, .50, .78, .40];   // yuva başına alt sınır: açık renk kumaşta (şort/forma) kasık örtmesi "kirli leke" gibi durmasın
        var ox, oy, oz, dx, dy, dz;              // sıcak döngü: ayırma (allocation) yok, skaler
        function hitSphere(c, r) { var px = ox - c[0], py = oy - c[1], pz = oz - c[2], b = px * dx + py * dy + pz * dz, cc = px * px + py * py + pz * pz - r * r; if (cc < 0) return -1; var h = b * b - cc; if (h < 0) return -1; var t = -b - Math.sqrt(h); return t > 0 ? t : -1; }
        function hitCap(pa, pb, r) {             // iq kapsül kesişimi
            var bax = pb[0] - pa[0], bay = pb[1] - pa[1], baz = pb[2] - pa[2], oax = ox - pa[0], oay = oy - pa[1], oaz = oz - pa[2];
            var baba = bax * bax + bay * bay + baz * baz, bard = bax * dx + bay * dy + baz * dz, baoa = bax * oax + bay * oay + baz * oaz, rdoa = dx * oax + dy * oay + dz * oaz, oaoa = oax * oax + oay * oay + oaz * oaz;
            var a = baba - bard * bard, b = baba * rdoa - baoa * bard, c = baba * oaoa - baoa * baoa - r * r * baba, h = b * b - a * c;
            if (h >= 0 && a > 1e-12) {
                var t = (-b - Math.sqrt(h)) / a, y = baoa + t * bard; if (y > 0 && y < baba && t > 0) return t;
                var cx = y <= 0 ? oax : ox - pb[0], cy = y <= 0 ? oay : oy - pb[1], cz = y <= 0 ? oaz : oz - pb[2], bq = dx * cx + dy * cy + dz * cz, cq = cx * cx + cy * cy + cz * cz - r * r, hq = bq * bq - cq;
                if (hq > 0 && cq > 0) { var tq = -bq - Math.sqrt(hq); if (tq > 0) return tq; }
            }
            return -1;
        }
        var near = new Array(prims.length), RAYS = DIRS.length;
        for (i = 0; i < nv; i++) {
            if ((i & 255) === 255) yield 0;                                       // zaman dilimli çalışma (bkz bodyGen)
            if (skip && skip[i]) { out[i] = 1; continue; }
            var nx = N[i * 3], ny = N[i * 3 + 1], nz = N[i * 3 + 2], g0 = grpOf(Bn[i * 2]);
            ox = P[i * 3] + nx * .004; oy = P[i * 3 + 1] + ny * .004; oz = P[i * 3 + 2] + nz * .004;
            var t0x = Math.abs(ny) < .9 ? 0 : 1, t0y = Math.abs(ny) < .9 ? 1 : 0, exx = ny * 0 - nz * t0y, exy = nz * t0x - nx * 0, exz = nx * t0y - ny * t0x, el = Math.sqrt(exx * exx + exy * exy + exz * exz); exx /= el; exy /= el; exz /= el;
            var ezx = ny * exz - nz * exy, ezy = nz * exx - nx * exz, ezz = nx * exy - ny * exx, occ = 0, nn = 0;
            for (q = 0; q < prims.length; q++) {                                 // yalnızca erişim mesafesindeki vekiller
                var pp = prims[q], dd;
                var qx = ox - pp.a[0], qy = oy - pp.a[1], qz = oz - pp.a[2];
                if (pp.t) { var sx = pp.b[0] - pp.a[0], sy = pp.b[1] - pp.a[1], sz = pp.b[2] - pp.a[2], tt = (qx * sx + qy * sy + qz * sz) / (sx * sx + sy * sy + sz * sz); tt = tt < 0 ? 0 : tt > 1 ? 1 : tt; qx -= sx * tt; qy -= sy * tt; qz -= sz * tt; }
                var d2 = qx * qx + qy * qy + qz * qz, own = pp.r + .03; if (d2 < own * own) continue;      // köşenin KENDİ parçasını temsil eden vekil: kendini örtmesin (ör. çene - kafa küresi)
                dd = MAXD + pp.r; if (d2 < dd * dd) near[nn++] = pp;
            }
            for (k = 0; k < RAYS; k++) {
                var D = DIRS[k], best = 0;
                dx = exx * D[0] + nx * D[1] + ezx * D[2]; dy = exy * D[0] + ny * D[1] + ezy * D[2]; dz = exz * D[0] + nz * D[1] + ezz * D[2];
                if (dy < -1e-4) { var tg = -oy / dy; if (tg > 0 && tg < MAXD) best = 1 - tg / MAXD; }
                for (q = 0; q < nn; q++) {
                    var pr = near[q], t = pr.t ? hitCap(pr.a, pr.b, pr.r) : hitSphere(pr.a, pr.r);
                    if (t > 0 && t < MAXD) { var wgt = (1 - t / MAXD) * ((g0 === 1) !== (pr.g === 1) && (g0 === 0 || pr.g === 0) ? .5 : 1); if (wgt > best) best = wgt; }
                }
                occ += best;
            }
            out[i] = Math.max(Sl ? AO_MIN[Sl[i]] : .32, Math.min(1, 1 - 1.25 * occ / RAYS));
        }
        return out;
    }
    /* [gk] şut yolu kestirimi: motorun ballStep3D'si ile AYNI adım ve sıra (DT .04, yerçekimi 9.81, şut sürüklenmesi .10·v, sekme e=.55 /
       yatay .78 / eşik 1.2 m/sn). out[i*3..]: i. adım sonundaki (x, y, z) - i. adım = şut anı + i·DT. Yalnızca görüntü kestirimi (kaleci
       plonjonunun temas anı/noktası, motorun erken çeldiği topun ele kadar görünen yolu); simülasyona dokunmaz. */
    var GKP_E = .55, GKP_H = .78;                                         // [ball] motorun sekme katsayıları (Ado3D.ballPhys ile; BL_FIFA)
    function ballPhys(e, h) { if (e > 0 && e < 1) GKP_E = e; if (h > 0 && h <= 1) GKP_H = h; }
    function gkPredict(x, y, z, vx, vy, vz, out, n) {
        for (var i = 0; i < n; i++) {
            var v = Math.sqrt(vx * vx + vy * vy);
            if (z > 0 || vz > 0) {
                vz -= 9.81 * .04; z += vz * .04;
                if (v > .02) { var k0 = Math.max(0, v - .10 * v * .04) / v; vx *= k0; vy *= k0; }
                if (z <= 0) { z = 0; if (-vz > 1.2) { vz = -vz * GKP_E; vx *= GKP_H; vy *= GKP_H; } else vz = 0; }
            } else if (v > .02) { var k1 = Math.max(0, v - .10 * v * .04) / v; vx *= k1; vy *= k1; }
            x += vx * .04; y += vy * .04;
            out[i * 3] = x; out[i * 3 + 1] = y; out[i * 3 + 2] = z;
        }
        return out;
    }
    /* poz dizisinden (poseFor çıktısı) kemik başına çift kuaterniyon: döner (r) + öteleme (d). PIVOTS ile aynı
       hiyerarşi mantığı (drawNode'daki mtrs çağrısının birebir aynısı) - eski rijit çizimle AYNI açılar. */
    var _bw = [], _bl = null;
    function bodyDQ(pose, out) {
        if (!_bl) { _bl = m4(); for (var j = 0; j < BODY_BONES.length; j++) _bw.push(m4()); }
        for (var i = 0; i < BODY_BONES.length; i++) {
            var b = BODY_BONES[i], k = i * 3, t = b[2];
            if (i === 0) mtrs(_bl, t[0], t[1] + pose[k + 1], t[2], pose[k], 0, pose[k + 2], 1); else mtrs(_bl, t[0], t[1], t[2], pose[k], pose[k + 1], pose[k + 2], 1);
            if (b[1] < 0) mcopy(_bw[i], _bl); else mmul(_bw[i], _bw[b[1]], _bl);
            var m = _bw[i], m00 = m[0], m11 = m[5], m22 = m[10], tr = m00 + m11 + m22, qw, qx, qy, qz, s;
            if (tr > 0) { s = Math.sqrt(tr + 1) * 2; qw = .25 * s; qx = (m[6] - m[9]) / s; qy = (m[8] - m[2]) / s; qz = (m[1] - m[4]) / s; }
            else if (m00 > m11 && m00 > m22) { s = Math.sqrt(1 + m00 - m11 - m22) * 2; qw = (m[6] - m[9]) / s; qx = .25 * s; qy = (m[4] + m[1]) / s; qz = (m[8] + m[2]) / s; }
            else if (m11 > m22) { s = Math.sqrt(1 + m11 - m00 - m22) * 2; qw = (m[8] - m[2]) / s; qx = (m[4] + m[1]) / s; qy = .25 * s; qz = (m[9] + m[6]) / s; }
            else { s = Math.sqrt(1 + m22 - m00 - m11) * 2; qw = (m[1] - m[4]) / s; qx = (m[8] + m[2]) / s; qy = (m[9] + m[6]) / s; qz = .25 * s; }
            var bp = BODY_BIND[i], px = bp[0], py = bp[1], pz = bp[2];
            var tx = m[12] - (m[0] * px + m[4] * py + m[8] * pz), ty = m[13] - (m[1] * px + m[5] * py + m[9] * pz), tz = m[14] - (m[2] * px + m[6] * py + m[10] * pz);
            var o = i * 8; out[o] = qx; out[o + 1] = qy; out[o + 2] = qz; out[o + 3] = qw;
            out[o + 4] = .5 * (qw * tx + (ty * qz - tz * qy)); out[o + 5] = .5 * (qw * ty + (tz * qx - tx * qz)); out[o + 6] = .5 * (qw * tz + (tx * qy - ty * qx)); out[o + 7] = -.5 * (tx * qx + ty * qy + tz * qz);
        }
        return out;
    }
    /* CPU üzerinde DQS (test/doğrulama ve el konumu için shader ile AYNI formül) */
    function dqsPoint(dq, ba, bb, w, p) {
        var a = ba * 8, b = bb * 8, r = [dq[a], dq[a + 1], dq[a + 2], dq[a + 3]], d = [dq[a + 4], dq[a + 5], dq[a + 6], dq[a + 7]], r1 = [dq[b], dq[b + 1], dq[b + 2], dq[b + 3]], d1 = [dq[b + 4], dq[b + 5], dq[b + 6], dq[b + 7]], k;
        if (r[0] * r1[0] + r[1] * r1[1] + r[2] * r1[2] + r[3] * r1[3] < 0) { for (k = 0; k < 4; k++) { r1[k] = -r1[k]; d1[k] = -d1[k]; } }
        for (k = 0; k < 4; k++) { r[k] = r[k] * (1 - w) + r1[k] * w; d[k] = d[k] * (1 - w) + d1[k] * w; }
        var l = Math.hypot(r[0], r[1], r[2], r[3]); for (k = 0; k < 4; k++) { r[k] /= l; d[k] /= l; }
        function rot(v) { var cx = r[1] * v[2] - r[2] * v[1] + r[3] * v[0], cy = r[2] * v[0] - r[0] * v[2] + r[3] * v[1], cz = r[0] * v[1] - r[1] * v[0] + r[3] * v[2]; return [v[0] + 2 * (r[1] * cz - r[2] * cy), v[1] + 2 * (r[2] * cx - r[0] * cz), v[2] + 2 * (r[0] * cy - r[1] * cx)]; }
        var q = rot(p), t = [2 * (r[3] * d[0] - d[3] * r[0] + (r[1] * d[2] - r[2] * d[1])), 2 * (r[3] * d[1] - d[3] * r[1] + (r[2] * d[0] - r[0] * d[2])), 2 * (r[3] * d[2] - d[3] * r[2] + (r[0] * d[1] - r[1] * d[0]))];
        return [q[0] + t[0], q[1] + t[1], q[2] + t[2]];
    }

    /* ---------- GL yardımcıları ---------- */
    function compile(gl, type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(s)); return s; }
    /* [opt] engellemeyen program kurulumu: derle + bağla, durum sorgusu yok (sürücü arka planda derler). progEnd ilk çizimde (ya da
       KHR_parallel_shader_compile 'hazır' dedikten sonra) bağlantıyı doğrular ve uniform konumlarını doldurur. */
    function progA(gl, vs, fs, attrs, list) {
        var p = gl.createProgram(), sv = gl.createShader(gl.VERTEX_SHADER), sf = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(sv, vs); gl.compileShader(sv); gl.shaderSource(sf, fs); gl.compileShader(sf); gl.attachShader(p, sv); gl.attachShader(p, sf);
        attrs.forEach(function (a, i) { gl.bindAttribLocation(p, i, a); }); gl.linkProgram(p);
        var P = { p: p, u: {}, sv: sv, sf: sf, ok: 0, fail: null }; list.push(P); return P;
    }
    function progEnd(gl, P) {
        var p = P.p; if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p) + ' ' + (gl.getShaderInfoLog(P.sv) || '') + ' ' + (gl.getShaderInfoLog(P.sf) || ''));
        var n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (var i = 0; i < n; i++) { var inf = gl.getActiveUniform(p, i), nm = inf.name.replace(/\[0\]$/, ''); P.u[nm] = gl.getUniformLocation(p, inf.name); }
        P.ok = 1;
    }
    function program(gl, vs, fs, attrs) {
        var p = gl.createProgram(); gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs)); gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
        attrs.forEach(function (a, i) { gl.bindAttribLocation(p, i, a); });
        gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
        var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (var i = 0; i < n; i++) { var inf = gl.getActiveUniform(p, i), nm = inf.name.replace(/\[0\]$/, ''); u[nm] = gl.getUniformLocation(p, inf.name); }
        return { p: p, u: u };
    }
    /* [vq] görüntü kalitesi A/B bayrakları (0 = eski davranış): sh gölge kapsamı + projektör gölgeleri, pitch çim/çizgi, mat malzeme/ton,
       face yüz boyaması, ui gömülü panel örneklemesi. Yalnızca çizim - simülasyon/kayıt etkilenmez. */
    var VQ = { sh: 1, pitch: 1, mat: 1, face: 1, ui: 1, csm: 1 };              // csm: iki kademeli gölge (VQ.sh gerekir)
    /* filmik ton eşleme + hafif kontrast/doygunluk (yayın/broadcast hissi): shade() ve çim/pano dokusunda ortak kullanılır */
    var GRADE = [
        'vec3 ado_filmic(vec3 x) {',
        '  float A=0.15, B=0.50, C=0.10, D=0.20, E=0.02, F=0.30;',
        '  return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;',
        '}',
        'vec3 ado_grade(vec3 c) {',
        '  vec3 x = c * 1.18;',
        '  vec3 ws = vec3(1.0) / ado_filmic(vec3(2.6));',
        '  vec3 t = ado_filmic(x) * ws;',
        '  float l = dot(t, vec3(0.299, 0.587, 0.114));',
        VQ.mat ? ['  t = mix(vec3(l), t, 1.10);',                         // [vq] doygunluk + luminans S eğrisi (ton korunur) + hafif bölünmüş tonlama
            '  float lc = clamp(dot(t, vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0), lp = 0.38, lg = 1.14, ls = lc < lp ? lp * pow(lc / lp, lg) : 1.0 - (1.0 - lp) * pow((1.0 - lc) / (1.0 - lp), lg);',
            '  t *= ls / max(lc, 1e-4);',
            '  t += vec3(0.010, 0.004, -0.008) * smoothstep(0.4, 0.9, ls) + vec3(-0.004, 0.0, 0.010) * (1.0 - smoothstep(0.0, 0.3, ls));',
            '  t = pow(clamp(t, 0.0, 1.0), vec3(0.955));'].join('\n') :
        '  t = mix(vec3(l), t, 1.07);\n  t = pow(clamp(t, 0.0, 1.0), vec3(0.965));',
        '  return clamp(t, 0.0, 1.0);',
        '}'].join('\n');
    var LIGHT = [
        'uniform vec3 uCam; uniform vec3 uSun; uniform vec3 uAmbS; uniform vec3 uAmbG; uniform vec3 uFogC; uniform float uFog; uniform vec3 uLdir;',
        GRADE,
        'vec3 shade(vec3 base, vec3 n, vec3 w, float rim) {',
        '  n = normalize(n); float d = max(dot(n, uLdir), 0.0); float hemi = n.y * 0.5 + 0.5;',
        '  vec3 c = base * (mix(uAmbG, uAmbS, hemi) + uSun * d);',
        '  vec3 v = normalize(uCam - w); c += rim * pow(1.0 - max(dot(n, v), 0.0), 3.0) * vec3(0.55, 0.62, 0.75);',
        '  c = ado_grade(c);',
        '  float f = 1.0 - exp(-length(w - uCam) * uFog); return mix(c, uFogC, clamp(f, 0.0, 0.85));',
        '}',
        // [vq] parlak yüzey (top): Blinn parlaması + Fresnel'li gök/zemin yansıması
        'vec3 shadeSp(vec3 base, vec3 n, vec3 w, float ks) {',
        '  n = normalize(n); float d = max(dot(n, uLdir), 0.0); float hemi = n.y * 0.5 + 0.5; vec3 v = normalize(uCam - w), h = normalize(uLdir + v);',
        '  vec3 c = base * (mix(uAmbG, uAmbS, hemi) + uSun * d);',
        '  float fr = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0), ry = reflect(-v, n).y;',
        '  c += ks * (uSun * (0.45 * 98.0 / 25.13) * pow(max(dot(n, h), 0.0), 90.0) * smoothstep(0.0, 0.1, d) + fr * mix(uAmbG, uAmbS, clamp(ry * 0.5 + 0.5, 0.0, 1.0)) * 0.8);',
        '  c = ado_grade(c);',
        '  float f = 1.0 - exp(-length(w - uCam) * uFog); return mix(c, uFogC, clamp(f, 0.0, 0.85));',
        '}'].join('\n');
    var VS_LIT = '#version 300 es\nlayout(location=0) in vec3 aPos; layout(location=1) in vec3 aNor; layout(location=2) in vec3 aCol;\nuniform mat4 uVP; uniform mat4 uM; out vec3 vN; out vec3 vW; out vec3 vC;\nvoid main(){ vec4 w = uM * vec4(aPos, 1.0); vW = w.xyz; vN = mat3(uM) * aNor; vC = aCol; gl_Position = uVP * w; }';
    var FS_LIT = '#version 300 es\nprecision mediump float; in vec3 vN; in vec3 vW; in vec3 vC; uniform vec4 uColor; uniform float uEmis; uniform float uSpec; out vec4 o;\n' + LIGHT + '\nvoid main(){ vec3 b = vC * uColor.rgb; vec3 c = uEmis > 1.5 ? mix(ado_grade(b), uFogC, clamp(1.0 - exp(-length(vW - uCam) * uFog), 0.0, 0.85)) : uEmis > 0.5 ? b : uSpec > 0.0 ? shadeSp(b, vN, vW, uSpec) : shade(b, vN, vW, 0.0); o = vec4(c, uColor.a); }';
    var VS_PL = '#version 300 es\nlayout(location=0) in vec3 aPos; layout(location=1) in vec3 aNor; layout(location=2) in float aSlot;\nuniform mat4 uVP; uniform mat4 uM; out vec3 vN; out vec3 vW; flat out int vS;\nvoid main(){ vec4 w = uM * vec4(aPos, 1.0); vW = w.xyz; vN = mat3(uM) * aNor; vS = int(aSlot + 0.5); gl_Position = uVP * w; }';
    var FS_PL = '#version 300 es\nprecision mediump float; in vec3 vN; in vec3 vW; flat in int vS; uniform vec3 uPal[8]; out vec4 o;\n' + LIGHT + '\nvoid main(){ vec3 b = uPal[vS]; o = vec4(shade(b, vN, vW, 0.55), 1.0); }';
    var VS_TEX = '#version 300 es\nlayout(location=0) in vec3 aPos; layout(location=1) in vec2 aUV; layout(location=2) in vec4 aTint;\nuniform mat4 uVP; uniform vec2 uUVO; out vec2 vUV; out vec3 vW; out vec4 vT;\nvoid main(){ vUV = aUV + uUVO; vW = aPos; vT = aTint; gl_Position = uVP * vec4(aPos, 1.0); }';
    /* [vq] çim: analitik çizgiler (SDF, fwidth ile kenar yumuşatma - ince kalan çizgi yoğunluk olarak söner), bakış yönüne bağlı biçim şeritleri,
       yakın planda döşeli ayrıntı (iki ölçek, döndürülmüş ikinci örnek) ve uzakta düşük frekanslı lekelenme */
    var PITCH_FN = !VQ.pitch ? '' : [
        'uniform sampler2D uDet; uniform vec4 uStr; uniform vec4 uPG;',
        'float sdBox(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }',
        'float pLineD(vec2 p) {',
        '  float W = uPG.x, H = uPG.y, cx = W * 0.5, cy = H * 0.5, hy = (uPG.w - uPG.z) * 0.5;',
        '  vec2 q = vec2(min(p.x, W - p.x), p.y), cc = vec2(cx, cy), ps = vec2(11.0, cy);',
        '  float d = abs(sdBox(p - cc, cc));',
        '  d = min(d, abs(p.x - cx) + max(0.0, max(-p.y, p.y - H)));',
        '  float lc = length(p - cc); d = min(d, abs(lc - 9.15)); d = min(d, lc - 0.12);',
        '  d = min(d, abs(sdBox(q - vec2(8.25, cy), vec2(8.25, hy))));',
        '  d = min(d, abs(sdBox(q - vec2(2.75, cy), vec2(2.75, 9.16))));',
        '  float lp = length(q - ps); d = min(d, lp - 0.12);',
        '  d = min(d, q.x > 16.5 ? abs(lp - 9.15) : min(length(q - vec2(16.5, cy + 7.312)), length(q - vec2(16.5, cy - 7.312))));',
        '  vec2 r = vec2(q.x, min(p.y, H - p.y)); if (r.x >= 0.0 && r.y >= 0.0) d = min(d, abs(length(r) - 1.0));',
        '  return d;',
        '}',
        'vec3 ado_pitch(vec3 c) {',
        '  vec2 w = vW.xz; float dist = length(vW - uCam);',
        '  float det = texture(uDet, w * 1.7).r, det2 = texture(uDet, vec2(w.x * 0.61 + w.y * 0.37, w.y * 0.61 - w.x * 0.37) * 1.35).g, lf = texture(uDet, w * 0.021).b;',
        '  float kd = 1.0 - smoothstep(7.0, 38.0, dist);',
        '  c *= mix(1.0, 0.78 + 0.44 * (det * 0.62 + det2 * 0.38), kd) * (0.95 + 0.10 * lf);',
        '  float ux = (w.x - uStr.x) / uStr.z, uz = (w.y - uStr.y) / uStr.w;',
        '  float sb = -clamp(sin(3.14159 * ux) / (fwidth(ux) * 3.14159 + 1e-4), -1.0, 1.0), sc = -clamp(sin(3.14159 * uz) / (fwidth(uz) * 3.14159 + 1e-4), -1.0, 1.0);',
        '  vec2 vh = normalize(w - uCam.xz + vec2(1e-3, 0.0));',
        '  c *= 1.0 + 0.11 * sb * vh.y + 0.035 * sc * vh.x;',
        '  float ld = pLineD(w), aa = max(length(fwidth(w)) * 0.75, 1e-4), hw = 0.06, hw2 = max(hw, aa * 0.5);',
        '  float cov = clamp((hw2 - ld) / aa + 0.5, 0.0, 1.0) * (hw / hw2);',
        '  return mix(c, vec3(0.93, 0.95, 0.91), cov * 0.92);',
        '}'].join('\n');
    /* [vq] iki kademeli gölge: yakın kademe (uLightVPN, atlasın sol yarısı) içte tek başına, kenarında (%80-97) uzak kademeyle karışır;
       uCsm = 0 iken (atlas yok) yalnız uzak kademe = p_r3_08 penceresi */
    var CSM_TEX_FN = !(VQ.sh && VQ.csm) ? '' : [
        'uniform mat4 uLightVPN; uniform vec4 uShA; uniform float uCsm;',
        'float shT4(vec3 lc, float sx, float ox, float b) {',
        '  vec2 tx = vec2(uTexel * sx, uTexel), uv = vec2(lc.x * sx + ox, lc.y); float z = lc.z - b;',
        '  return 0.25 * (texture(uShadow, vec3(uv + vec2(-1.3, -1.3) * tx, z)) + texture(uShadow, vec3(uv + vec2(1.3, -1.3) * tx, z)) + texture(uShadow, vec3(uv + vec2(-1.3, 1.3) * tx, z)) + texture(uShadow, vec3(uv + vec2(1.3, 1.3) * tx, z)));',
        '}',
        'float ado_shadow2() {',
        '  float sN = 1.0, wN = 0.0;',
        '  if (uCsm > 0.5) { vec4 ln = uLightVPN * vec4(vW, 1.0); vec3 nc = ln.xyz * 0.5 + 0.5; vec2 en = abs(nc.xy - 0.5) * 2.0; float mn = max(en.x, en.y);',
        '    if (mn < 0.97) { wN = 1.0 - smoothstep(0.80, 0.97, mn); sN = shT4(nc, uShA.x, uShA.y, 0.0010); if (wN > 0.999) return sN; } }',
        '  vec4 lp = uLightVP * vec4(vW, 1.0); vec3 lc = lp.xyz * 0.5 + 0.5; vec2 e = abs(lc.xy - 0.5) * 2.0; float fade = 1.0 - smoothstep(0.93, 1.0, max(e.x, e.y));',
        '  float sF = fade > 0.001 ? mix(1.0, shT4(lc, uShA.z, uShA.w, 0.0010), fade) : 1.0;',
        '  return mix(sF, sN, wN);',
        '}'].join('\n');
    var CSM_SK_FN = !(VQ.sh && VQ.csm) ? '' : [
        'uniform mat4 uLightVPN; uniform vec4 uShA; uniform float uCsm; uniform float uShWN;',
        'float shK(vec3 lc, float sx, float ox) {',
        '  float b = 0.000375, s = 0.0, z = lc.z - b; vec2 tx = vec2(uTexel * sx, uTexel), uv = vec2(lc.x * sx + ox, lc.y);',
        '  s += texture(uShadow, vec3(uv + vec2(-0.75, -0.75) * tx, z)); s += texture(uShadow, vec3(uv + vec2(0.75, -0.75) * tx, z));',
        '  s += texture(uShadow, vec3(uv + vec2(-0.75, 0.75) * tx, z)); s += texture(uShadow, vec3(uv + vec2(0.75, 0.75) * tx, z));',
        '  if (uPcf > 0.5) { s += texture(uShadow, vec3(uv + vec2(-1.8, 0.2) * tx, z)); s += texture(uShadow, vec3(uv + vec2(1.8, -0.2) * tx, z)); s += texture(uShadow, vec3(uv + vec2(0.2, 1.8) * tx, z)); s += texture(uShadow, vec3(uv + vec2(-0.2, -1.8) * tx, z)); s *= 0.125; } else s *= 0.25;',
        '  return s;',
        '}',
        'float shP2(vec3 w, vec3 n) {',
        '  if (uShadowOn < 0.5) return 1.0;',
        '  float sN = 1.0, wN = 0.0;',
        '  if (uCsm > 0.5) { vec4 ln = uLightVPN * vec4(w + n * max(0.012, uShWN), 1.0); vec3 nc = ln.xyz * 0.5 + 0.5; vec2 en = abs(nc.xy - 0.5) * 2.0; float mn = max(en.x, en.y);',
        '    if (mn < 0.97) { wN = 1.0 - smoothstep(0.80, 0.97, mn); sN = shK(nc, uShA.x, uShA.y); if (wN > 0.999) return sN; } }',
        '  vec4 lp = uLightVP * vec4(w + n * max(0.03, uShW), 1.0); vec3 lc = lp.xyz * 0.5 + 0.5; vec2 e = abs(lc.xy - 0.5) * 2.0; float fade = 1.0 - smoothstep(0.93, 1.0, max(e.x, e.y));',
        '  float sF = fade > 0.001 ? mix(1.0, shK(lc, uShA.z, uShA.w), fade) : 1.0;',
        '  return mix(sF, sN, wN);',
        '}'].join('\n');
    var FS_TEX = '#version 300 es\nprecision ' + (VQ.pitch ? 'highp' : 'mediump') + ' float; in vec2 vUV; in vec3 vW; in vec4 vT; uniform sampler2D uTex; uniform vec4 uMul; uniform vec3 uCam; uniform vec3 uFogC; uniform float uFog; uniform float uPitch; uniform float uShadowOn; uniform mat4 uLightVP; uniform highp sampler2DShadow uShadow; uniform float uTexel; uniform float uBias; uniform float uGr; out vec4 o;\n' + GRADE + '\n' + PITCH_FN + '\nfloat ado_shadow() {\n  vec4 lp = uLightVP * vec4(vW, 1.0); vec3 lc = lp.xyz * 0.5 + 0.5; float bias = ' + (VQ.sh ? '0.0010' : '0.0016') + ';\n  vec2 e = abs(lc.xy - 0.5) * 2.0; float fade = 1.0 - smoothstep(' + (VQ.sh ? '0.93' : '0.82') + ', 1.0, max(e.x, e.y));\n  if (fade <= 0.001) return 1.0;\n  float sum = 0.0; vec2 tx = vec2(uTexel);\n  sum += texture(uShadow, vec3(lc.xy + vec2(-1.3,-1.3) * tx, lc.z - bias));\n  sum += texture(uShadow, vec3(lc.xy + vec2( 1.3,-1.3) * tx, lc.z - bias));\n  sum += texture(uShadow, vec3(lc.xy + vec2(-1.3, 1.3) * tx, lc.z - bias));\n  sum += texture(uShadow, vec3(lc.xy + vec2( 1.3, 1.3) * tx, lc.z - bias));\n  float sh = sum * 0.25; return mix(1.0, sh, fade);\n}\n' + CSM_TEX_FN + '\nvoid main(){ vec4 t = texture(uTex, vUV, uBias) * vT * uMul; vec3 c = t.rgb;\n  if (uPitch > 0.5) {\n    ' + (VQ.pitch ? 'c = ado_pitch(c); ' : '') + 'float d = length(vec2((vW.x - 52.5) / 75.0, (vW.z - 34.0) / 52.0)); c *= ' + (VQ.pitch ? '1.04 - 0.16 * smoothstep(0.30, 1.20, d)' : '1.08 - 0.34 * smoothstep(0.25, 1.15, d)') + ';\n    float sh = uShadowOn > 0.5 ? ' + (VQ.sh && VQ.csm ? 'ado_shadow2()' : 'ado_shadow()') + ' : 1.0; c *= mix(' + (VQ.sh ? '0.66' : '0.6') + ', 1.0, sh);\n    c = ado_grade(c * ' + (VQ.pitch ? '1.04' : '0.92') + ');\n  }' + (VQ.mat ? ' else if (uGr > 0.5) c = ado_grade(c * 1.5);' : '') + '\n  float f = 1.0 - exp(-length(vW - uCam) * uFog); c = mix(c, uFogC, clamp(f, 0.0, 0.85)); o = vec4(c, t.a); }';
    /* seyirci şeritleri: FS_TEX ile çizilir; tepe noktalar gol coşkusunda (uPulse) şerit fazıyla sıçrar - atılan tarafın tribünü daha güçlü */
    var VS_CROWD = '#version 300 es\nlayout(location=0) in vec3 aPos; layout(location=1) in vec2 aUV; layout(location=2) in vec4 aTint;\nuniform mat4 uVP; uniform float uT; uniform float uPulse; uniform float uSide; uniform float uIdle;\nout vec2 vUV; out vec3 vW; out vec4 vT;\nvoid main(){ vec3 p = aPos; float ph = aTint.y * 6.2831; float near = 1.0 - min(1.0, abs(aTint.z - uSide) * 1.4);\n  float jump = uPulse * mix(0.35, 1.0, near) * max(0.0, sin(uT * 9.0 + ph)) * 0.32 + uIdle * 0.02 * sin(uT * 1.3 + ph * 3.0);\n  p.y += jump * (0.55 + 0.45 * aTint.w);\n  vUV = aUV; vW = p; vT = vec4(vec3(aTint.x * (1.0 + 0.25 * uPulse * near)), 1.0); gl_Position = uVP * vec4(p, 1.0); }';
    /* ışık hâlesi (bloom) son işleme - yalnızca Yüksek kalite: sahne çoklu-örneklemeli (MSAA) ara tampona çizilir, çözülür,
       yalnızca gerçekten parlak yerler (projektör kafası/parlaması, çatı ışık şeridi, VAR ekranı) eşikten geçer, çeyrek çözünürlükte
       ayrılabilir Gauss ile yumuşatılıp sahneye eklenir. Saha çizgileri/beyaz forma eşiğin altında kalır (yumuşak diz eşiği). */
    var VS_POST = '#version 300 es\nlayout(location=0) in vec2 aP; out vec2 vUV; void main(){ vUV = aP * 0.5 + 0.5; gl_Position = vec4(aP, 0.0, 1.0); }';
    var FS_BRIGHT = '#version 300 es\nprecision mediump float; in vec2 vUV; uniform sampler2D uSrc; uniform vec2 uPx; out vec4 o;\nvec3 bp(vec3 c){ float l = ' + (VQ.mat ? 'max(dot(c, vec3(0.2126, 0.7152, 0.0722)), max(c.r, max(c.g, c.b)) * 0.8)' : 'max(c.r, max(c.g, c.b))') + '; float k = clamp((l - 0.80) / 0.14, 0.0, 1.0); k = k * k; return c * k; }\nvoid main(){ vec3 a = bp(texture(uSrc, vUV + uPx * vec2(-1.0, -1.0)).rgb) + bp(texture(uSrc, vUV + uPx * vec2(1.0, -1.0)).rgb) + bp(texture(uSrc, vUV + uPx * vec2(-1.0, 1.0)).rgb) + bp(texture(uSrc, vUV + uPx * vec2(1.0, 1.0)).rgb); o = vec4(a * 0.25, 1.0); }';
    var FS_BLUR = '#version 300 es\nprecision mediump float; in vec2 vUV; uniform sampler2D uSrc; uniform vec2 uDir; out vec4 o;\nvoid main(){ vec3 c = texture(uSrc, vUV).rgb * 0.2270270270;\n  c += (texture(uSrc, vUV + uDir * 1.3846153846).rgb + texture(uSrc, vUV - uDir * 1.3846153846).rgb) * 0.3162162162;\n  c += (texture(uSrc, vUV + uDir * 3.2307692308).rgb + texture(uSrc, vUV - uDir * 3.2307692308).rgb) * 0.0702702703; o = vec4(c, 1.0); }';
    var FS_COMP = '#version 300 es\nprecision mediump float; in vec2 vUV; uniform sampler2D uSrc; uniform sampler2D uBloom; uniform float uInt; out vec4 o;\nvoid main(){ vec3 c = texture(uSrc, vUV).rgb, b = texture(uBloom, vUV).rgb; o = vec4(c + b * uInt * (1.0 - c * 0.5), 1.0); }';
    var VS_SKY = '#version 300 es\nlayout(location=0) in vec2 aP; out float vY; void main(){ vY = aP.y * 0.5 + 0.5; gl_Position = vec4(aP, 0.999, 1.0); }';
    var FS_SKY = '#version 300 es\nprecision mediump float; in float vY; uniform vec3 uTop; uniform vec3 uBot; out vec4 o; void main(){ float t = smoothstep(0.35, 1.0, vY); o = vec4(mix(uBot, uTop, t), 1.0); }';
    var VS_DEPTH = '#version 300 es\nlayout(location=0) in vec3 aPos;\nuniform mat4 uMVP;\nvoid main(){ gl_Position = uMVP * vec4(aPos, 1.0); }';
    var FS_DEPTH = '#version 300 es\nprecision mediump float; out vec4 o; void main(){ o = vec4(1.0); }';
    /* deri bağlamalı (skinned) oyuncu: çift kuaterniyon (DQS), kemik başına 2 vec4 (dönüş + öteleme). Kök (konum/yön/boy-yapı ölçeği)
       ayrıca uM ile uygulanır; normal, eşit olmayan ölçek için ters-devrik yerine S^-2 düzeltmesiyle (uNS) taşınır. */
    /* boy/kilo oranı düzeltmesi (bağ uzayında, deri bağlamadan ÖNCE): kökteki boy/yapı ölçeği tüm vücuda eşit uygulanır; ama gerçekte
       kafa boyutu boyla/kiloyla neredeyse değişmez, ayak uzunluğu kiloyla değişmez. uHK: x kafa yatay, y kafa dikey (Head kemiği pivotu
       etrafında), z ayak genişliği, w ayak uzunluğu (bilek etrafında). Yalnızca TEK kemiğe tam bağlı köşeler (kafa/göz/kulak/saç, bot). */
    var SK_PROP = 'uniform vec4 uHK; uniform vec3 uHB;\nvec3 propFix(vec3 p, vec2 bo, float w){ int b0 = int(bo.x + 0.5); if (w < 0.001) { if (b0 == 2) return uHB + (p - uHB) * vec3(uHK.x, uHK.y, uHK.x); if (b0 == 9 || b0 == 12) { vec3 ac = vec3(b0 == 9 ? -0.09 : 0.09, 0.07, 0.0); return ac + (p - ac) * vec3(uHK.z, 1.0, uHK.w); } } return p; }\n';
    var SK_DQS = 'uniform vec4 uDQ[26];\nvec4 gQ;\nvec3 skinP(vec3 p, vec3 nIn, vec2 bo, float w, out vec3 nOut){\n  int a = int(bo.x + 0.5), b = int(bo.y + 0.5); vec4 r0 = uDQ[a*2], d0 = uDQ[a*2+1], r1 = uDQ[b*2], d1 = uDQ[b*2+1];\n  if (dot(r0, r1) < 0.0) { r1 = -r1; d1 = -d1; }\n  vec4 r = r0 * (1.0 - w) + r1 * w, d = d0 * (1.0 - w) + d1 * w; float l = length(r); r /= l; d /= l; gQ = r;\n  nOut = nIn + 2.0 * cross(r.xyz, cross(r.xyz, nIn) + r.w * nIn);\n  return p + 2.0 * cross(r.xyz, cross(r.xyz, p) + r.w * p) + 2.0 * (r.w * d.xyz - d.w * r.xyz + cross(r.xyz, d.xyz));\n}\n';
    var VS_SK = '#version 300 es\nlayout(location=0) in vec3 aPos; layout(location=1) in vec3 aNor; layout(location=2) in vec2 aUV; layout(location=3) in float aSlot; layout(location=4) in vec2 aBone; layout(location=5) in float aW; layout(location=6) in float aAO; layout(location=7) in vec2 aUV2;\nuniform mat4 uVP; uniform mat4 uM; uniform vec3 uNS;\n' + SK_PROP + SK_DQS + 'out vec3 vN; out vec3 vW; out vec2 vUV; out vec2 vUV2; out float vAO; flat out int vS; out vec3 vB; out vec4 vQ;\nvoid main(){ vUV2 = aUV2; vec3 n; vec3 p = skinP(propFix(aPos, aBone, aW), aNor, aBone, aW, n); vec4 w = uM * vec4(p, 1.0); vW = w.xyz; vN = mat3(uM) * (n * uNS); vUV = aUV; vAO = aAO; vS = int(aSlot + 0.5); vB = aPos; vQ = gQ; gl_Position = uVP * w; }';
    /* oyuncu yüzeyi: (1) gölge haritasından GERÇEK gölge alır (kendi kolunun/başka oyuncunun gölgesi - eskiden oyuncular hiç gölge
       ALMIYORDU), normal-ofsetli düşük sapma; (2) malzemeye göre (yuva başına) parlaklık: forma/şort polyester hafif parlak, ten geniş-yumuşak,
       krampon parlak, saç ince parlak; (3) ten/kumaş için "sarmalı" (wrap) dağınık ışık - yüzey altı saçılımın ucuz karşılığı, ten
       plastik/kil gibi sert gölgelenmez; (4) pişirilmiş ortam örtmesi (vAO) - kasık/koltuk altı/çene altı/bacak arası. */
    var FS_SK = ['#version 300 es', 'precision highp float;',
        'in vec3 vN; in vec3 vW; in vec2 vUV; in vec2 vUV2; in float vAO; flat in int vS; in vec3 vB; in vec4 vQ; uniform sampler2D uMD; uniform float uMDOn;',
        'uniform vec3 uPal[12]; uniform highp sampler2DArray uKit; uniform float uLayer; uniform float uKitOn; uniform float uShadowOn; uniform float uPcf; uniform mat4 uLightVP;',
        'uniform highp sampler2DShadow uShadow; uniform float uTexel; uniform float uShW; uniform mat4 uM; uniform float uDetail; uniform vec3 uHeadC; uniform vec3 uL2; uniform vec3 uC2; uniform vec3 uL3; uniform vec3 uC3; out vec4 o;',
        LIGHT,
        // yuva başına malzeme: [parlaklık, parlaklık keskinliği, sarmalı dağınık ışık] - 0 forma 1 şort 2 tozluk 3 ten 4 saç 5 krampon 6 el 7 şerit 8 taban 9 forma-2 10 göz 11 dudak
        'const vec3 MAT[12] = vec3[12](vec3(.10, 22., .18), vec3(.10, 22., .18), vec3(.05, 10., .20), vec3(.13, 16., .32), vec3(.16, 40., .12), vec3(.45, 70., .05), vec3(.12, 16., .26), vec3(.10, 22., .18), vec3(.06, 12., .05), vec3(.10, 22., .18), vec3(.90, 180., .0), vec3(.24, 30., .30));',
        'float shP(vec3 w, vec3 n) {',
        '  if (uShadowOn < 0.5) return 1.0;',
        '  vec4 lp = uLightVP * vec4(w + n * max(0.03, uShW), 1.0); vec3 lc = lp.xyz * 0.5 + 0.5; vec2 e = abs(lc.xy - 0.5) * 2.0; float fade = 1.0 - smoothstep(' + (VQ.sh ? '0.93' : '0.82') + ', 1.0, max(e.x, e.y));',
        '  if (fade <= 0.001) return 1.0;',
        '  float b = ' + (VQ.sh ? '0.000375' : '0.0006') + ', s = 0.0; vec2 tx = vec2(uTexel);',
        '  s += texture(uShadow, vec3(lc.xy + vec2(-0.75, -0.75) * tx, lc.z - b)); s += texture(uShadow, vec3(lc.xy + vec2(0.75, -0.75) * tx, lc.z - b));',
        '  s += texture(uShadow, vec3(lc.xy + vec2(-0.75, 0.75) * tx, lc.z - b)); s += texture(uShadow, vec3(lc.xy + vec2(0.75, 0.75) * tx, lc.z - b));',
        '  if (uPcf > 0.5) { s += texture(uShadow, vec3(lc.xy + vec2(-1.8, 0.2) * tx, lc.z - b)); s += texture(uShadow, vec3(lc.xy + vec2(1.8, -0.2) * tx, lc.z - b)); s += texture(uShadow, vec3(lc.xy + vec2(0.2, 1.8) * tx, lc.z - b)); s += texture(uShadow, vec3(lc.xy + vec2(-0.2, -1.8) * tx, lc.z - b)); s *= 0.125; } else s *= 0.25;',
        '  return mix(1.0, s, fade);',
        '}',
        CSM_SK_FN,
        'float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
        'float vn(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);',
        '  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }',
        // bağ (bind) uzayında ayrıntı yüksekliği: kumaş kırışıkları (bel, koltuk altı, kol yeni, şort kasığı/paçası) + örgü dokusu.
        // ap/aw: ekranda çok küçük kaldığında (piksel ayak izi > dalga boyu) kaybolur - parıldama/titreme (aliasing) yapmaz.
        'float detH(vec3 b, int s, float ap, float aw) {',
        '  float h = 0.0, ax = abs(b.x);',
        '  if (s == 0 || s == 9) {',
        '    float waist = smoothstep(0.90, 0.97, b.y) * (1.0 - smoothstep(1.05, 1.16, b.y)) * (1.0 - step(0.2, ax));',
        '    h += ap * waist * smoothstep(0.05, 0.13, ax) * 0.0007 * sin(b.y * 150.0 + vn(b * vec3(18.0, 4.0, 18.0)) * 7.0) * vn(b * 11.0);',
        '    float pit = (1.0 - smoothstep(0.0, 0.07, abs(b.y - 1.36 + (0.2 - ax) * 0.6))) * smoothstep(0.08, 0.15, ax) * step(ax, 0.2);',
        '    h += ap * pit * 0.0009 * sin((b.y + ax * 0.8) * 200.0 + vn(b * 15.0) * 3.0);',
        '    h += ap * step(0.165, ax) * smoothstep(1.47, 1.40, b.y) * 0.0010 * sin(b.y * 230.0 + vn(b * 20.0) * 3.0);',
        '    h += aw * 0.00018 * vn(b * 700.0);',
        '  } else if (s == 1) {',
        '    h += ap * 0.0010 * smoothstep(0.74, 0.80, b.y) * (1.0 - smoothstep(0.84, 0.90, b.y)) * smoothstep(0.03, 0.09, ax) * sin((b.y * 1.2 - ax * 0.9) * 140.0 + vn(b * 14.0) * 6.0) * (0.3 + 0.7 * vn(b * 9.0));',
        '    h += ap * 0.0007 * sin(b.y * 170.0 + vn(b * 12.0) * 7.0) * smoothstep(0.75, 0.69, b.y) * (0.3 + 0.7 * vn(b * 10.0));',
        '    h += aw * 0.00018 * vn(b * 700.0);',
        '  } else if (s == 2 || s == 7) { h += aw * 0.00025 * vn(b * vec3(900.0, 120.0, 900.0)); }',
        '  else if (s == 3) { h += aw * 0.00005 * vn(b * 900.0); }',
        '  return h;',
        '}',
        'vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }',
        'void main(){',
        '  vec3 base = uPal[vS]; vec3 m = MAT[vS]; vec3 n = normalize(vN);',
        '  if (uKitOn > 0.5 && vUV.x >= 0.0 && (vS == 0 || vS == 3)) { vec4 tk = texture(uKit, vec3(vUV, uLayer)); base = vS == 0 ? tk.rgb : mix(base, tk.rgb, tk.a); }',
        '  if (uMDOn > 0.5 && vUV2.x >= 0.0) base *= texture(uMD, vUV2).rgb * 2.0;',
        '  if (vS == 3 || vS == 11) { float bl = dot(base, vec3(0.299, 0.587, 0.114)); base = max(vec3(0.0), mix(vec3(bl), base, ' + (VQ.face ? '1.06' : '1.14') + ')); }',
        '  if (uDetail > 0.5 && (vS <= 3 || vS == 7 || vS == 9)) {',
        '    float fw = length(fwidth(vB)), ap = 1.0 - smoothstep(0.006, 0.016, fw), aw = 1.0 - smoothstep(0.0004, 0.0012, fw);',
        VQ.ui ? ['    float h0 = (ap + aw > 0.001) ? detH(vB, vS, ap, aw) : 0.0;',      // [vq] yüzey gradyanı: dFdx/dFdy (tek detH)
            '    vec3 dpx = dFdx(vW), dpy = dFdy(vW); float dhx = dFdx(h0), dhy = dFdy(h0);',
            '    vec3 r1 = cross(dpy, n), r2 = cross(n, dpx); float dt = dot(dpx, r1);',
            '    vec3 gs = sign(dt) * (dhx * r1 + dhy * r2); float gsl = length(gs), lim = abs(dt) * 1.5; if (gsl > lim) gs *= lim / gsl;',
            '    if (abs(dt) > 1e-14) n = normalize(abs(dt) * n - gs);'].join('\n') :
        ['    if (ap + aw > 0.001) { float e = 0.0012, h0 = detH(vB, vS, ap, aw);',
        '      vec3 g = vec3(detH(vB + vec3(e, 0.0, 0.0), vS, ap, aw) - h0, detH(vB + vec3(0.0, e, 0.0), vS, ap, aw) - h0, detH(vB + vec3(0.0, 0.0, e), vS, ap, aw) - h0) / e;',
        '      vec3 gw = mat3(uM) * qrot(vQ, g); n = normalize(n - (gw - dot(gw, n) * n)); }'].join('\n'),
        '  }',
        '  vec3 v = normalize(uCam - vW), l = uLdir, hv = normalize(l + v);',
        '  float sh = ' + (VQ.sh && VQ.csm ? 'shP2' : 'shP') + '(vW, n), nl = dot(n, l), ao = vAO, hemi = n.y * 0.5 + 0.5, extra = 0.0;',
        '  vec3 spc = vec3(0.0);',
        '  if (vS == 10) {',                                              // göz: sklera / iris (radyal lifli) / göz bebeği + kornea parlaması
        '    float r = length(vUV), ang = atan(vUV.y, vUV.x);',
        '    vec3 scl = vec3(0.80, 0.77, 0.73) * mix(1.0, 0.82, smoothstep(0.55, 1.0, r));',
        '    vec3 ic = uPal[10] * (0.78 + 0.35 * h3(vec3(floor(ang * 16.0), 1.0, 2.0))) * mix(1.15, 0.55, smoothstep(0.30, 0.46, r));',
        '    base = r < 0.46 ? (r < 0.17 ? vec3(0.015) : ic) : scl;',
        '  }',
        '  if (vS == 4 && vUV.x >= 0.0) {',                               // saç: tel yönünde (UV v) Kajiya-Kay çift parlama + tel bantları
        '    vec3 rb = vB - uHeadC, cr = vB - (uHeadC + vec3(0.0, 0.12, -0.035)), nb = normalize(rb), Tb = cr - nb * dot(cr, nb);',      // tel yönü: tepe girdabından dışa (bağ uzayında, analitik - türev gürültüsü yok)
        '    vec3 T = mat3(uM) * qrot(vQ, Tb); T = T - n * dot(T, n); T = length(T) > 1e-6 ? normalize(T) : vec3(0.0, 1.0, 0.0);',
        '    float bandW = fwidth(vUV.x * 420.0), sv = h3(vec3(floor(vUV.x * 420.0), 7.0, 3.0)), sv2 = vn(vec3(floor(vUV.x * 420.0) * 1.7, vUV.y * 5.0, 5.0));',
        '    base *= mix(0.70 + 0.55 * sv * (0.6 + 0.4 * sv2), 0.95, smoothstep(0.35, 0.9, bandW));',
        '    vec3 T1 = normalize(T + n * 0.12), T2 = normalize(T - n * 0.10); float d1 = dot(T1, hv), d2 = dot(T2, hv);',
        '    float s1 = sqrt(max(0.0, 1.0 - d1 * d1)), s2 = sqrt(max(0.0, 1.0 - d2 * d2));',
        '    spc = (vec3(0.10) * pow(s1, 70.0) + base * 0.28 * pow(s2, 18.0)) * uSun * sh * smoothstep(-0.1, 0.3, nl) * ao; m.x = 0.0;',
        '  }',
        '  float d = max((nl + m.z) / (1.0 + m.z), 0.0);',
        '  float d2l = max((dot(n, uL2) + m.z) / (1.0 + m.z), 0.0), d3l = max((dot(n, uL3) + m.z) / (1.0 + m.z), 0.0);',
        '  vec3 c = base * (mix(uAmbG, uAmbS, hemi) * ao + uSun * d * ' + (VQ.mat ? 'mix(0.3, 1.0, sh)' : 'sh') + ' * mix(1.0, ao, 0.4) + (uC2 * d2l + uC3 * d3l) * ao);',
        '  if (vS == 3) c += base * vec3(0.30, 0.07, 0.03) * uSun * sh * max(0.0, 1.0 - abs(nl - 0.05) * 3.5) * 0.5;',     // ten: gölge sınırında kırmızımsı geçiş (yüzey altı saçılım yaklaşımı)
        '  float fr = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0);',
        '  float sp = m.x * (m.y + 8.0) / 25.13 * pow(max(dot(n, hv), 0.0), m.y) * smoothstep(0.0, 0.15, nl);',
        '  vec3 h2v = normalize(uL2 + v); float sp2 = m.x * (m.y + 8.0) / 25.13 * pow(max(dot(n, h2v), 0.0), m.y) * smoothstep(0.0, 0.15, dot(n, uL2));',
        '  c += (uSun * sp * sh + uC2 * sp2) * ao * (0.6 + 0.4 * fr * 4.0) + spc;',
        VQ.mat ? [
            '  float nv = max(dot(n, v), 0.0);',
            '  if (vS <= 2 || vS == 7 || vS == 9) {',                    // [vq] kumaş: Charlie parlaması (α = 0.2) güneş + arka ışık, forma renginde
            '    float nh = max(dot(n, hv), 0.0), nlc = max(nl, 0.0), D1 = 7.0 * pow(max(1.0 - nh * nh, 1e-4), 2.5) / 6.2832, V1 = 1.0 / (4.0 * (nlc + nv - nlc * nv) + 1e-3);',
            '    vec3 h3v = normalize(uL3 + v); float nh3 = max(dot(n, h3v), 0.0), nl3 = max(dot(n, uL3), 0.0), D3 = 7.0 * pow(max(1.0 - nh3 * nh3, 1e-4), 2.5) / 6.2832, V3 = 1.0 / (4.0 * (nl3 + nv - nl3 * nv) + 1e-3);',
            '    c += mix(base, vec3(1.0), 0.3) * 0.34 * 3.1416 * (D1 * V1 * nlc * uSun * sh + D3 * V3 * nl3 * uC3) * ao;',
            '  }',
            '  if (vS == 3) c += uSun * (0.05 * 68.0 / 25.13) * pow(max(dot(n, hv), 0.0), 60.0) * smoothstep(0.0, 0.15, nl) * sh * ao;',      // [vq] ten: dar yağlı parlama lobu
            '  c += 0.16 * pow(1.0 - nv, 4.0) * vec3(0.55, 0.62, 0.75) * ao;'].join('\n') :
        '  c += 0.42 * pow(1.0 - max(dot(n, v), 0.0), 3.0) * vec3(0.55, 0.62, 0.75) * ao;',
        '  c = ado_grade(c);',
        '  float f = 1.0 - exp(-length(vW - uCam) * uFog); o = vec4(mix(c, uFogC, clamp(f, 0.0, 0.85)), 1.0);',
        '}'].join('\n');
    var VS_SKD = '#version 300 es\nlayout(location=0) in vec3 aPos; layout(location=1) in vec3 aNor; layout(location=4) in vec2 aBone; layout(location=5) in float aW;\nuniform mat4 uMVP;\n' + SK_PROP + SK_DQS + 'void main(){ vec3 n; vec3 p = skinP(propFix(aPos, aBone, aW), aNor, aBone, aW, n); gl_Position = uMVP * vec4(p, 1.0); }';

    /* ---------- modelleri ayıkla ---------- */
    var PSLOT = { kit: 0, shorts: 1, socks: 2, skin: 3, hair: 4, boots: 5, hand: 6, trim: 7 };
    var PIVOTS = ['Hips', 'Torso', 'Head', 'ArmL', 'ForeL', 'ArmR', 'ForeR', 'LegL', 'ShinL', 'FootL', 'LegR', 'ShinR', 'FootR'];
    var TRACK = null;
    function makeVBO(gl, data, stride, attribs) {
        var vao = gl.createVertexArray(); gl.bindVertexArray(vao); var b = gl.createBuffer(); if (TRACK) TRACK.push({ vao: vao, buf: b }); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
        attribs.forEach(function (a, i) { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, a[0], gl.FLOAT, false, stride * 4, a[1] * 4); });
        return { vao: vao, buf: b };
    }
    function buildPlayerModel(gl, glb) {
        var map = {};
        function build(n) {
            var o = { name: n.name, t: n.t, kids: [], vao: null, count: 0, pi: PIVOTS.indexOf(n.name) };
            if (n.mesh != null) {
                var verts = [], idx = [], base = 0;
                glb.meshes[n.mesh].forEach(function (p) {
                    var slot = PSLOT[p.mat.name]; if (slot == null) slot = 3;
                    var nv = p.P.length / 3, i;
                    for (i = 0; i < nv; i++) verts.push(p.P[i * 3], p.P[i * 3 + 1], p.P[i * 3 + 2], p.N[i * 3], p.N[i * 3 + 1], p.N[i * 3 + 2], slot);
                    for (i = 0; i < p.I.length; i++) idx.push(p.I[i] + base);
                    base += nv;
                });
                var v = makeVBO(gl, new Float32Array(verts), 7, [[3, 0], [3, 3], [1, 6]]);
                var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
                o.vao = v.vao; o.count = idx.length;
            }
            n.kids.forEach(function (k) { o.kids.push(build(glb.nodes[k])); });
            map[n.name] = o; return o;
        }
        return { root: build(glb.byName.Player), map: map };
    }
    /* [top] beyaz maç topu: FIFA 5 numara (çap 22 cm, yarıçap 0.11 m). İkosfer (5 kez bölünmüş, 20 480 üçgen) üzerinde klasik 32 panelli
       (12 beşgen + 20 altıgen) dikiş deseni: panel sınırları açık gri ve 1.2 mm gömük, böylece dönüş ve ışık okunur; panellerin kendisi beyaz. */
    function proceduralBall(R) {
        var t = (1 + Math.sqrt(5)) / 2, nrm = function (v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
        var P = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(nrm);
        var F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
        var C = P.slice(); F.forEach(function (f) { C.push(nrm([P[f[0]][0] + P[f[1]][0] + P[f[2]][0], P[f[0]][1] + P[f[1]][1] + P[f[2]][1], P[f[0]][2] + P[f[1]][2] + P[f[2]][2]])); });
        var V = P.slice(), cache = {}, k, i;
        function mid(a, b) { var key = a < b ? a + '_' + b : b + '_' + a; if (cache[key] != null) return cache[key]; V.push(nrm([V[a][0] + V[b][0], V[a][1] + V[b][1], V[a][2] + V[b][2]])); return cache[key] = V.length - 1; }
        for (k = 0; k < 5; k++) { var F2 = []; F.forEach(function (f) { var a = mid(f[0], f[1]), b = mid(f[1], f[2]), c = mid(f[2], f[0]); F2.push([f[0], a, c], [f[1], b, a], [f[2], c, b], [a, b, c]); }); F = F2; }
        var nv = V.length, pos = new Float32Array(nv * 3), col = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), W = .042;
        for (i = 0; i < nv; i++) {
            var d = V[i], m1 = -2, m2 = -2;
            for (k = 0; k < C.length; k++) { var dt = d[0] * C[k][0] + d[1] * C[k][1] + d[2] * C[k][2]; if (dt > m1) { m2 = m1; m1 = dt; } else if (dt > m2) m2 = dt; }
            var gap = Math.acos(Math.max(-1, Math.min(1, m2))) - Math.acos(Math.max(-1, Math.min(1, m1))), s = gap >= W ? 0 : 1 - gap / W; s = s * s * (3 - 2 * s);
            var r = R * (1 - .011 * s), w = .965 - .3 * s;
            pos[i * 3] = d[0] * r; pos[i * 3 + 1] = d[1] * r; pos[i * 3 + 2] = d[2] * r;
            col[i * 3] = w; col[i * 3 + 1] = w + .01 * s; col[i * 3 + 2] = w + .025 * s;
        }
        var idx = new Uint16Array(F.length * 3);
        F.forEach(function (f, j) {
            idx[j * 3] = f[0]; idx[j * 3 + 1] = f[1]; idx[j * 3 + 2] = f[2];
            var a = f[0] * 3, b = f[1] * 3, c = f[2] * 3, ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
            var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
            for (var q = 0; q < 3; q++) { var o = f[q] * 3; nor[o] += nx; nor[o + 1] += ny; nor[o + 2] += nz; }
        });
        var vb = new Float32Array(nv * 9);
        for (i = 0; i < nv; i++) {
            var o3 = i * 3, l = Math.hypot(nor[o3], nor[o3 + 1], nor[o3 + 2]) || 1;
            if (nor[o3] * pos[o3] + nor[o3 + 1] * pos[o3 + 1] + nor[o3 + 2] * pos[o3 + 2] < 0) l = -l;
            vb.set([pos[o3], pos[o3 + 1], pos[o3 + 2], nor[o3] / l, nor[o3 + 1] / l, nor[o3 + 2] / l, col[o3], col[o3 + 1], col[o3 + 2]], i * 9);
        }
        return { vb: vb, idx: idx };
    }
    function buildBall(gl, glb) {
        if (G.ADO3D_BALL_ON !== false) {
            try {
                var PB = proceduralBall(.11), vv0 = makeVBO(gl, PB.vb, 9, [[3, 0], [3, 3], [3, 6]]), ib0 = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib0); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, PB.idx, gl.STATIC_DRAW); gl.bindVertexArray(null);
                return [{ vao: vv0.vao, count: PB.idx.length, c: [1, 1, 1] }];
            } catch (e) { if (G.console && console.warn) console.warn('Ado3D: top üretilemedi:', e && e.message); }
        }
        var BD = G.ADO3D_BALL;
        if (BD && BD.b && G.ADO3D_BALL_ON !== false) {
            try {
                var bin = atob(BD.b), n8 = bin.length, u8 = new Uint8Array(n8), j; for (j = 0; j < n8; j++) u8[j] = bin.charCodeAt(j);
                var nv0 = BD.nv, PB = new Float32Array(u8.buffer, 0, nv0 * 3), NB = new Float32Array(u8.buffer, nv0 * 12, nv0 * 3), LB = new Uint8Array(u8.buffer, nv0 * 24, nv0), io = nv0 * 25 + (nv0 % 2), IB = new Uint16Array(u8.buffer, io, BD.ni);
                var vb = new Float32Array(nv0 * 9);
                for (j = 0; j < nv0; j++) { var cc = BD.cols[LB[j]] || BD.cols[0], o9 = j * 9; vb[o9] = PB[j * 3]; vb[o9 + 1] = PB[j * 3 + 1]; vb[o9 + 2] = PB[j * 3 + 2]; vb[o9 + 3] = NB[j * 3]; vb[o9 + 4] = NB[j * 3 + 1]; vb[o9 + 5] = NB[j * 3 + 2]; vb[o9 + 6] = cc[0]; vb[o9 + 7] = cc[1]; vb[o9 + 8] = cc[2]; }
                var vv = makeVBO(gl, vb, 9, [[3, 0], [3, 3], [3, 6]]), ibb = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibb); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(IB), gl.STATIC_DRAW);
                gl.bindVertexArray(null);
                return [{ vao: vv.vao, count: BD.ni, c: [1, 1, 1] }];
            } catch (e) { if (G.console && console.warn) console.warn('Ado3D: Meshy top yüklenemedi, eski top kullanılıyor:', e && e.message); }
        }
        var parts = glb.meshes[glb.byName.BallMesh.mesh].map(function (p) {
            var nv = p.P.length / 3, verts = [], i; for (i = 0; i < nv; i++) verts.push(p.P[i * 3], p.P[i * 3 + 1], p.P[i * 3 + 2], p.N[i * 3], p.N[i * 3 + 1], p.N[i * 3 + 2], 1, 1, 1);
            var v = makeVBO(gl, new Float32Array(verts), 9, [[3, 0], [3, 3], [3, 6]]); var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(p.I), gl.STATIC_DRAW);
            return { vao: v.vao, count: p.I.length, c: p.mat.c };
        });
        return parts;
    }
    /* düğüm ağacını dünyaya yerleştirip (kalıcı) tepe listelerine yazar */
    function bakeModel(glb, rootName, place, out, colorOf) {
        var tmp = m4(), loc = m4();
        function rec(n, pm) {
            mquat(loc, n.t, n.q, n.s); var w = mmul(new Float32Array(16), pm, loc);
            if (n.mesh != null) glb.meshes[n.mesh].forEach(function (p) {
                var bucket = p.mat.blend ? out.glass : p.mat.emis ? (p.mat.name === 'screen' ? out.screen : out.emis) : out.opaque, c = colorOf ? colorOf(p.mat) : p.mat.c;
                var nv = p.P.length / 3, i, x, y, z, nx, ny, nz;
                for (i = 0; i < p.I.length; i++) {
                    var k = p.I[i]; x = p.P[k * 3]; y = p.P[k * 3 + 1]; z = p.P[k * 3 + 2]; nx = p.N[k * 3]; ny = p.N[k * 3 + 1]; nz = p.N[k * 3 + 2];
                    bucket.push(w[0] * x + w[4] * y + w[8] * z + w[12], w[1] * x + w[5] * y + w[9] * z + w[13], w[2] * x + w[6] * y + w[10] * z + w[14],
                        w[0] * nx + w[4] * ny + w[8] * nz, w[1] * nx + w[5] * ny + w[9] * nz, w[2] * nx + w[6] * ny + w[10] * nz, c[0], c[1], c[2]);
                }
            });
            n.kids.forEach(function (k) { rec(glb.nodes[k], w); });
        }
        rec(glb.byName[rootName], place);
    }

    /* ---------- oluşturucu ---------- */
    // ten rengi paleti: sabit veri, herhangi bir create() örneğine bağlı değil - modül seviyesinde tanımlanır ki
    // hem create() içindeki render kodu HEM DE dışarıdaki G.Ado3D.SKIN dışa aktarımı (bkz alttaki G.Ado3D = {...})
    // AYNI diziyi paylaşsın (Futbolcu Veritabanı ekranındaki ten rengi seçici İKİ ayrı yerde tanımlanıp sapmasın diye).
    var SKIN = [[.945, .78, .64], [.878, .675, .525], [.776, .541, .384], [.635, .42, .27], [.44, .28, .19]];
    // saç rengi paleti (veritabanı ile birebir aynı sıra): 0 siyah, 1 koyu kahve, 2 kahve, 3 açık kahve, 4 sarı, 5 kızıl - SKIN gibi
    // modül seviyesinde: Futbolcu Veritabanı ekranındaki saç rengi seçici (ado.js) AYNI diziyi G.Ado3D.HAIR'dan okur
    var HAIR = [[.11, .08, .06], [.17, .114, .08], [.29, .2, .12], [.55, .42, .23], [.72, .65, .5], [.60, .27, .11]];
    /* [opt] olumlu yoklama sonucu (WebGL2 var, donanım hızlandırmalı mı) tarayıcı kimliğiyle saklanır: sonraki açılışlarda sayfa yüklenirken
       geçici WebGL2 bağlamı açılmaz (~0.35 sn). create() gerçek bağlamla doğrular, sapma varsa kaydı günceller/siler. */
    var SUP_KEY = 'ado3d_sup_v1';
    function supSave(v, hw) { try { if (v) G.localStorage.setItem(SUP_KEY, JSON.stringify({ v: 1, hw: hw ? 1 : 0, ua: String(G.navigator && navigator.userAgent || '') })); else G.localStorage.removeItem(SUP_KEY); } catch (e) { } }
    function supported() {
        if (supported._v != null) return supported._v;
        try { var sc = G.localStorage && G.localStorage.getItem(SUP_KEY), so = sc ? JSON.parse(sc) : null; if (so && so.v && so.ua === String(G.navigator && navigator.userAgent || '') && typeof ADO3D_GLB_B64 === 'string' && typeof WebGL2RenderingContext !== 'undefined') { supported._v = true; supported._hw = !!so.hw; return true; } } catch (e) { }
        try {
            var c = document.createElement('canvas'), gl = c.getContext('webgl2'); supported._v = !!gl && typeof ADO3D_GLB_B64 === 'string'; supported._hw = false;
            if (gl) { var ex = gl.getExtension('WEBGL_debug_renderer_info'), rn = ex ? String(gl.getParameter(ex.UNMASKED_RENDERER_WEBGL) || '') : ''; supported._hw = !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(rn); }      // yazılım çizici (GPU yok) ise varsayılan olarak 2B
            if (gl) { var lc = gl.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); }
        } catch (e) { supported._v = false; supported._hw = false; }
        supSave(supported._v, supported._hw);
        return supported._v;
    }
    function create(cv, cfg) {
        var PW = cfg.PW, PH = cfg.PH;
        var gl = cv.getContext('webgl2', { antialias: true, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!cfg.preserve });
        if (!gl) { supSave(false); return null; }
        if (!MODELS) { MODELS = parseGLB(ADO3D_GLB_B64); upgradePlayerMeshes(MODELS); }
        var R = { gl: gl, lost: false }, W = 1, H = 1, dpr = 1;
        cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); if (R.lost) return; R.lost = true; if (R.onLost) R.onLost(); });
        var KPS = gl.getExtension('KHR_parallel_shader_compile'), PEND = [];   // [opt] programlar arka planda derlenir; durum ilk çizimde (progsReady)
        var pLit = progA(gl, VS_LIT, FS_LIT, ['aPos', 'aNor', 'aCol'], PEND), pPl = progA(gl, VS_PL, FS_PL, ['aPos', 'aNor', 'aSlot'], PEND), pTex = progA(gl, VS_TEX, FS_TEX, ['aPos', 'aUV', 'aTint'], PEND), pSky = progA(gl, VS_SKY, FS_SKY, ['aP'], PEND), pCrowd = progA(gl, VS_CROWD, FS_TEX, ['aPos', 'aUV', 'aTint'], PEND);
        var pDepth = null; try { pDepth = progA(gl, VS_DEPTH, FS_DEPTH, ['aPos'], PEND); } catch (e) { pDepth = null; }
        try { var dbg = gl.getExtension('WEBGL_debug_renderer_info'), rnm = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '', hw0 = !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(rnm); if (supported._hw !== hw0) { supported._hw = hw0; supSave(true, hw0); } } catch (e) { }   // [opt] saklı donanım bilgisini gerçek bağlamla doğrula
        /* anatomik deri-bağlamalı gövde (2 ayrıntı düzeyi: 0 yakın çekim, 1 yayın mesafesi). Herhangi bir adımda hata olursa
           (eski/kısıtlı sürücü) sessizce ESKİ rijit modele döner - oyun asla görünmez oyuncuyla kalmaz. */
        var SKN = null;
        function uploadBody(m) {
            var n = m.nv, f = new Float32Array(n * 15), i, U2 = m.UV2;
            for (i = 0; i < n; i++) { var o = i * 15; f[o] = m.P[i * 3]; f[o + 1] = m.P[i * 3 + 1]; f[o + 2] = m.P[i * 3 + 2]; f[o + 3] = m.N[i * 3]; f[o + 4] = m.N[i * 3 + 1]; f[o + 5] = m.N[i * 3 + 2]; f[o + 6] = m.UV[i * 2]; f[o + 7] = m.UV[i * 2 + 1]; f[o + 8] = m.S[i]; f[o + 9] = m.B[i * 2]; f[o + 10] = m.B[i * 2 + 1]; f[o + 11] = m.W[i]; f[o + 12] = m.AO[i]; f[o + 13] = U2 ? U2[i * 2] : -1; f[o + 14] = U2 ? U2[i * 2 + 1] : -1; }
            var v = makeVBO(gl, f, 15, [[3, 0], [3, 3], [2, 6], [1, 8], [2, 9], [1, 11], [1, 12], [2, 13]]);
            var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.I, gl.STATIC_DRAW);
            gl.bindVertexArray(null);
            return { vao: v.vao, it: m.I instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, ib: m.I instanceof Uint32Array ? 4 : 2, body: m.bodyCount, hair: m.hair, beard: m.beard };
        }
        try {
            var pSk = progA(gl, VS_SK, FS_SK, ['aPos', 'aNor', 'aUV', 'aSlot', 'aBone', 'aW', 'aAO', 'aUV2'], PEND), pSkD = pDepth ? progA(gl, VS_SKD, FS_DEPTH, ['aPos', 'aNor', 'aUV', 'aSlot', 'aBone', 'aW', 'aAO', 'aUV2'], PEND) : null;
            if (!BODY_MESH[1]) BODY_MESH[1] = buildBody(1);                       // yayın ağı: hemen (≈0.1 s, tek sefer)
            if (!BODY_MESH[2]) BODY_MESH[2] = buildBody(2);                       // uzak / Düşük kalite ağı
            var lod1 = uploadBody(BODY_MESH[1]), lod2 = uploadBody(BODY_MESH[2]);
            var glErr = gl.getError(); if (glErr !== gl.NO_ERROR && glErr !== gl.CONTEXT_LOST_WEBGL) throw new Error('gl ' + glErr);
            SKN = { p: pSk, pd: pSkD, lod: [null, lod1, lod2], dq: new Float32Array(BODY_BONES.length * 8), job: BODY_MESH[0] ? null : bodyGen(0) };
            if (BODY_MESH[0]) SKN.lod[0] = uploadBody(BODY_MESH[0]);
        } catch (e) { SKN = null; if (G.console && console.warn) console.warn('Ado3D: anatomik gövde devre dışı, rijit modele dönüldü:', e && e.message); }
        /* yakın-çekim ağı (LOD0): kare başına en fazla ~4 ms'lik dilimlerle arka planda üretilir; hazır olana dek yayın ağı kullanılır */
        function bodyJobStep(budgetMs) {
            if (!SKN || !SKN.job) return;
            var now = G.performance && performance.now ? function () { return performance.now(); } : Date.now, end = now() + budgetMs, r;
            try {
                do { r = SKN.job.next(); } while (!r.done && now() < end);
                if (r.done) { BODY_MESH[0] = r.value; SKN.lod[0] = uploadBody(r.value); SKN.job = null; }
            } catch (e) { SKN.job = null; }
        }
        /* Meshy detay dokusu (TEXTURE4): yüklenene dek uMDOn = 0 (düz palet rengi) */
        var MDT = { tex: null, ok: false }, aniso0 = gl.getExtension('EXT_texture_filter_anisotropic');
        if (SKN && G.ADO3D_MESHY && G.ADO3D_MESHY.md && G.ADO3D_MESHY_ON !== false && G.Image) {
            try {
                var mdImg = new Image();
                mdImg.onload = function () {
                    try {
                        if (R.lost) return;
                        MDT.tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, MDT.tex);
                        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE, mdImg); gl.generateMipmap(gl.TEXTURE_2D);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                        if (aniso0) gl.texParameterf(gl.TEXTURE_2D, aniso0.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(aniso0.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
                        gl.activeTexture(gl.TEXTURE0); MDT.ok = true;
                    } catch (e) { MDT.ok = false; gl.activeTexture(gl.TEXTURE0); }
                };
                mdImg.src = G.ADO3D_MESHY.md;
            } catch (e) { }
        }
        R._bodyReady = function (budget) { while (SKN && SKN.job) bodyJobStep(budget || 1e9); return !!(SKN && SKN.lod[0]); };
        R.skinned = function () { return !!SKN; };
        var aniso = gl.getExtension('EXT_texture_filter_anisotropic');
        var player = buildPlayerModel(gl, MODELS), ballParts = buildBall(gl, MODELS);
        var skyVao = gl.createVertexArray(); gl.bindVertexArray(skyVao); var sb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, sb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

        /* ----- dokular ----- */
        function tex(canvas, opts) {
            var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
            if (opts && opts.mip) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT))); }
            else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            var wrap = opts && opts.repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE; gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            return t;
        }
        function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d', { willReadFrequently: true }); return c; }   // [opt] CPU bellekli: dokuya yükleme GPU geri okuması beklemez
        var PX0 = -6, PX1 = PW + 6, PZ0 = -6, PZ1 = PH + 6;            // çim dokusunun kapsadığı dünya dikdörtgeni
        function pitchCanvas() {
            var pw = 2048, ph = Math.round(pw * (PZ1 - PZ0) / (PX1 - PX0)), c = mkCanvas(pw, ph), g = c.getContext('2d'), s = pw / (PX1 - PX0), rnd = rngf(1234);
            function X(x) { return (x - PX0) * s; } function Z(z) { return (z - PZ0) * s; }
            var nb = 22, bw = (PX1 - PX0) / nb;
            for (var i = 0; i < nb; i++) { g.fillStyle = VQ.pitch ? (i % 2 ? '#2d7639' : '#368f4a') : (i % 2 ? '#296b32' : '#3a9a51'); g.fillRect(i * bw * s, 0, bw * s + 1, ph); }   // [vq] kalan şerit kontrastı bakış yönünden (FS_TEX)
            var nb2 = 15, bh2 = ph / nb2;                                     // çapraz biçim (hafif dama deseni): yatay bant, düşük alfa ile üst üste
            for (var i2 = 0; i2 < nb2; i2++) { g.fillStyle = i2 % 2 ? 'rgba(0,0,0,.05)' : 'rgba(255,255,255,.035)'; g.fillRect(0, i2 * bh2, pw, bh2 + 1); }
            for (var k = 0; k < 90000; k++) { g.fillStyle = 'rgba(' + (rnd() < .5 ? '10,40,14' : '190,230,150') + ',' + (.025 + rnd() * .05).toFixed(3) + ')'; var w0 = 1 + rnd() * 2.2; g.fillRect(rnd() * pw, rnd() * ph, w0, 1 + rnd() * 3.5); }
            var lg = g.createLinearGradient(0, 0, 0, ph); lg.addColorStop(0, 'rgba(0,0,0,.10)'); lg.addColorStop(.5, 'rgba(255,255,255,.02)'); lg.addColorStop(1, 'rgba(0,0,0,.10)'); g.fillStyle = lg; g.fillRect(0, 0, pw, ph);
            var C = cfg.C;
            function wear(x, z, r, a) { var gr = g.createRadialGradient(X(x), Z(z), 0, X(x), Z(z), r * s); gr.addColorStop(0, 'rgba(60,40,18,' + a + ')'); gr.addColorStop(.7, 'rgba(60,40,18,' + (a * .4).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(60,40,18,0)'); g.fillStyle = gr; g.beginPath(); g.arc(X(x), Z(z), r * s, 0, 7); g.fill(); }
            wear(PW / 2, PH / 2, 3.4, .16); wear(11, PH / 2, 2.6, .22); wear(PW - 11, PH / 2, 2.6, .22);
            wear(0, PH / 2, 4.2, .13); wear(PW, PH / 2, 4.2, .13);
            if (VQ.pitch) return c;                                          // [vq] çizgiler golgelendiricide analitik (SDF) çizilir
            g.strokeStyle = 'rgba(244,247,240,.93)'; g.lineWidth = Math.max(1.6, .13 * s); g.lineCap = 'butt'; g.fillStyle = 'rgba(244,247,240,.93)';
            g.strokeRect(X(0), Z(0), PW * s, PH * s);
            g.beginPath(); g.moveTo(X(PW / 2), Z(0)); g.lineTo(X(PW / 2), Z(PH)); g.stroke();
            g.beginPath(); g.arc(X(PW / 2), Z(PH / 2), 9.15 * s, 0, 7); g.stroke();
            g.beginPath(); g.arc(X(PW / 2), Z(PH / 2), .28 * s, 0, 7); g.fill();
            [0, 1].forEach(function (sd) {
                var dir = sd ? -1 : 1, gx = sd ? PW : 0;
                g.strokeRect(sd ? X(PW - 16.5) : X(0), Z(C.PA_Y0), 16.5 * s, (C.PA_Y1 - C.PA_Y0) * s);
                g.strokeRect(sd ? X(PW - 5.5) : X(0), Z(PH / 2 - 9.16), 5.5 * s, 18.32 * s);
                var px = sd ? PW - 11 : 11; g.beginPath(); g.arc(X(px), Z(PH / 2), .28 * s, 0, 7); g.fill();
                g.beginPath(); g.arc(X(px), Z(PH / 2), 9.15 * s, sd ? Math.PI - .93 : -.93, sd ? Math.PI + .93 : .93); g.stroke();
                [0, PH].forEach(function (cz) { g.beginPath(); g.arc(X(gx), Z(cz), 1 * s, cz === 0 ? (sd ? Math.PI / 2 : 0) : (sd ? Math.PI : -Math.PI / 2), cz === 0 ? (sd ? Math.PI : Math.PI / 2) : (sd ? Math.PI * 1.5 : 0)); g.stroke(); });
            });
            return c;
        }
        function detailCanvas() {                                            // [vq] 256² döşenebilir çim ayrıntısı (periyodik değer gürültüsü + kısa yaprak çizgileri)
            var N = 256, c = mkCanvas(N, N), g = c.getContext('2d'), im = g.createImageData(N, N), d = im.data, rnd = rngf(9182), x, y, k;
            function lat(f, sd) { var a = new Float32Array(f * f), r2 = rngf(sd); for (var j = 0; j < a.length; j++) a[j] = r2(); return a; }
            function vnz(L, f, x0, y0) { var fx = x0 * f / N, fy = y0 * f / N, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy; tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
                var x1 = ix % f, y1 = iy % f, x2 = (ix + 1) % f, y2 = (iy + 1) % f, a = L[y1 * f + x1], b = L[y1 * f + x2], c2 = L[y2 * f + x1], e = L[y2 * f + x2]; return (a + (b - a) * tx) * (1 - ty) + (c2 + (e - c2) * tx) * ty; }
            var L1 = lat(32, 11), L2 = lat(64, 12), L3 = lat(128, 13), M1 = lat(8, 21), M2 = lat(16, 22), B1 = lat(4, 31), B2 = lat(8, 32);
            for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
                var o = (y * N + x) * 4, r = .5 * vnz(L1, 32, x, y) + .3 * vnz(L2, 64, x, y) + .2 * vnz(L3, 128, x, y), gg = .6 * vnz(M1, 8, x, y) + .4 * vnz(M2, 16, x, y), bb = .7 * vnz(B1, 4, x, y) + .3 * vnz(B2, 8, x, y);
                d[o] = clamp(Math.round((.5 + (r - .5) * 1.9) * 255), 0, 255); d[o + 1] = clamp(Math.round((.5 + (gg - .5) * 1.8) * 255), 0, 255); d[o + 2] = clamp(Math.round((.5 + (bb - .5) * 2.2) * 255), 0, 255); d[o + 3] = 255;
            }
            g.putImageData(im, 0, 0);
            g.globalCompositeOperation = 'source-over'; g.lineCap = 'round';
            for (k = 0; k < 2600; k++) {                                     // yaprak çizgileri: R kanalında kısa açık/koyu çizgiler (kenardan taşan sarılır)
                var px = rnd() * N, py = rnd() * N, an = rnd() * Math.PI, ln = 3 + rnd() * 7, lt = rnd() < .5, ox, oy;
                g.strokeStyle = lt ? 'rgba(255,0,0,' + (.18 + rnd() * .25).toFixed(2) + ')' : 'rgba(0,0,0,' + (.10 + rnd() * .18).toFixed(2) + ')'; g.lineWidth = .8 + rnd() * .7;
                for (ox = -1; ox <= 1; ox++) for (oy = -1; oy <= 1; oy++) { var bx2 = px + ox * N, by2 = py + oy * N; if (bx2 < -12 || bx2 > N + 12 || by2 < -12 || by2 > N + 12) continue; g.beginPath(); g.moveTo(bx2, by2); g.lineTo(bx2 + Math.cos(an) * ln, by2 + Math.sin(an) * ln); g.stroke(); }
            }
            return c;
        }
        function boardCanvas() {
            var c = mkCanvas(2048, 64), g = c.getContext('2d'), grd = g.createLinearGradient(0, 0, 0, 64); grd.addColorStop(0, '#12233a'); grd.addColorStop(1, '#0a1526'); g.fillStyle = grd; g.fillRect(0, 0, 2048, 64);
            var words = ['ADOBALL', 'FUTBOL MENAJERLİK', 'OYNA · KAZAN', 'ADOBALL', 'HER PAS BİR KARAR'], cols = ['#ffd21f', '#7fd1ff', '#ffffff', '#ffd21f', '#7fd1ff'], x = 30;
            g.textBaseline = 'middle'; g.font = '800 34px sans-serif';
            for (var i = 0; i < 5; i++) { var w = g.measureText(words[i]).width; g.fillStyle = cols[i]; g.fillText(words[i], x, 34); x += w + 44; g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(x - 24, 22, 4, 22); if (x > 1990) break; }
            g.fillStyle = 'rgba(255,255,255,.06)'; g.fillRect(0, 0, 2048, 4);
            return c;
        }
        function netCanvas() {
            var c = mkCanvas(64, 64), g = c.getContext('2d'); g.strokeStyle = 'rgba(240,244,250,.62)'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 61, 61); return c;
        }
        function blobCanvas() {
            var c = mkCanvas(64, 64), g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(0,0,0,.62)'); gr.addColorStop(.55, 'rgba(0,0,0,.38)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
        }
        function streakCanvas() {                                            // [vq] projektör "yıldız" gölgesi: ayakta dar, gövde boyunca geniş, uca doğru sönen şerit
            var c = mkCanvas(128, 32), g = c.getContext('2d'), im = g.createImageData(128, 32), d = im.data, x, y;
            for (y = 0; y < 32; y++) for (x = 0; x < 128; x++) {
                var u = (x + .5) / 128, v = ((y + .5) / 32) * 2 - 1, wv = .42 + .58 * Math.min(1, u / .3) - .18 * Math.max(0, (u - .78) / .22);
                var a = Math.pow(1 - u, .9) * Math.min(1, u / .05) * Math.exp(-(v * v) / (wv * wv) * 2.6), o = (y * 128 + x) * 4;
                d[o] = d[o + 1] = d[o + 2] = 0; d[o + 3] = Math.round(255 * Math.min(1, a));
            }
            g.putImageData(im, 0, 0); return c;
        }
        function ringCanvas() {
            var c = mkCanvas(128, 128), g = c.getContext('2d'); g.strokeStyle = '#fff'; g.lineWidth = 9; g.beginPath(); g.arc(64, 64, 52, 0, 7); g.stroke();
            var gr = g.createRadialGradient(64, 64, 40, 64, 64, 60); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.22)'); g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); return c;
        }
        function glareCanvas() {
            var c = mkCanvas(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
            gr.addColorStop(0, 'rgba(255,255,250,.95)'); gr.addColorStop(.28, 'rgba(255,250,235,.55)'); gr.addColorStop(.6, 'rgba(255,245,220,.16)'); gr.addColorStop(1, 'rgba(255,245,220,0)');
            g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return c;
        }
        /* seyirci dokusu: 16 şerit x 64 kişi (kişi başı 16x64 px). Şerit 0-5 ev sahibi ağırlıklı, 6-11 deplasman, 12-15 karışık.
           Oturan/ayakta, kollar havada, atkılı, boş koltuk çeşitleri - rastgelelik sabit tohumlu (her maçta aynı takım renkleriyle aynı tribün). */
        function crowdCanvas(home, away, neutral) {
            var W2 = 1024, H2 = 1024, c = mkCanvas(W2, H2), g = c.getContext('2d'), rnd = rngf(4242), k, i;
            function rgb(col, m) { m = m == null ? 1 : m; return 'rgb(' + Math.round(clamp(col[0] * m, 0, 1) * 255) + ',' + Math.round(clamp(col[1] * m, 0, 1) * 255) + ',' + Math.round(clamp(col[2] * m, 0, 1) * 255) + ')'; }
            for (k = 0; k < 16; k++) {
                var y0 = k * 64, bias = k < 6 ? 0 : k < 12 ? 1 : 2, seat = bias === 0 ? mixc(home, [0, 0, 0], .55) : bias === 1 ? mixc(away, [0, 0, 0], .55) : [.16, .18, .23];
                var gr = g.createLinearGradient(0, y0, 0, y0 + 64); gr.addColorStop(0, '#0b0e15'); gr.addColorStop(1, '#151a24'); g.fillStyle = gr; g.fillRect(0, y0, W2, 64);
                for (i = 0; i < 64; i++) {
                    var x = i * 16 + 8 + (rnd() - .5) * 3;
                    g.fillStyle = rgb(seat, .9); g.fillRect(x - 6, y0 + 40, 12, 20);                                  // koltuk sırtı
                    if (rnd() < .10) continue;                                                                    // boş koltuk
                    var u = rnd(), pc;
                    if (bias === 0) pc = u < .72 ? mixc(home, [1, 1, 1], rnd() * .25) : neutral[(rnd() * 6) | 0];
                    else if (bias === 1) pc = u < .70 ? mixc(away, [1, 1, 1], rnd() * .25) : neutral[(rnd() * 6) | 0];
                    else pc = u < .30 ? mixc(home, [1, 1, 1], rnd() * .2) : u < .42 ? mixc(away, [1, 1, 1], rnd() * .2) : neutral[(rnd() * 6) | 0];
                    var stand = rnd() < .25 ? -7 : 0, sk = SKIN[(rnd() * 5) | 0], hy = y0 + 20 + stand + (rnd() - .5) * 3, sh = .82 + rnd() * .3, by = hy + 6;
                    g.fillStyle = rgb(pc, sh); g.beginPath(); g.moveTo(x - 6, y0 + 64); g.lineTo(x - 6.5, by + 5); g.quadraticCurveTo(x - 6, by, x, by); g.quadraticCurveTo(x + 6, by, x + 6.5, by + 5); g.lineTo(x + 6, y0 + 64); g.closePath(); g.fill();   // gövde
                    if (rnd() < .18) { g.fillStyle = rgb(bias === 1 ? away : home, 1.05); g.fillRect(x - 6, by + 4, 12, 3); }                         // atkı
                    if (rnd() < .12) { g.fillStyle = rgb(sk, .95); g.fillRect(x - 7, hy - 14, 2.2, 14); g.fillRect(x + 5, hy - 14, 2.2, 14); }            // kollar havada
                    g.fillStyle = rgb(sk, .9 + rnd() * .15); g.beginPath(); g.ellipse(x, hy, 4.2, 5, 0, 0, 7); g.fill();                                 // baş
                    g.fillStyle = rgb(HAIR[(rnd() * 6) | 0]); g.beginPath(); g.ellipse(x, hy - 2.2, 4.4, 3.2, 0, Math.PI, 2 * Math.PI); g.fill();       // saç
                }
                var sh2 = g.createLinearGradient(0, y0, 0, y0 + 64); sh2.addColorStop(0, 'rgba(255,255,255,.06)'); sh2.addColorStop(.6, 'rgba(0,0,0,0)'); sh2.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = sh2; g.fillRect(0, y0, W2, 64);
            }
            return c;
        }
        function labelCanvas(text, w, h, fg, bg) { var c = mkCanvas(w, h), g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.fillStyle = fg; g.font = '800 ' + Math.round(h * .5) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, w / 2, h / 2 + 1); return c; }
        var T = { pitch: tex(pitchCanvas(), { mip: true }), board: tex(boardCanvas(), { mip: true, repeat: true }), net: tex(netCanvas(), { mip: true, repeat: true }), blob: tex(blobCanvas()), streak: tex(streakCanvas(), { mip: true }), ring: tex(ringCanvas(), { mip: true }), glare: tex(glareCanvas()), ground: null, varTxt: tex(labelCanvas('VAR', 128, 48, '#dff2ff', '#0b1d31')) };
        /* projektör direkleri: köşe tribünlerinin ARKASINDA, lamba yüzü saha merkezine dönük. Parlama noktası modelin GERÇEK lamba
           kafasında (y ≈ 34 m, yüz ofseti 0.8 m) - eskiden direğin ortasında (19.5 m) asılı duruyordu. */
        var FLOOD_POS = [[-26, -25], [PW + 26, -25], [-22, PH + 23], [PW + 22, PH + 23]].map(function (p) { return [p[0], p[1], Math.atan2(PW / 2 - p[0], PH / 2 - p[1])]; });
        var FLOOD_TIPS = FLOOD_POS.map(function (p) { return [p[0] + Math.sin(p[2]) * 1.0, 34.0, p[1] + Math.cos(p[2]) * 1.0]; });
        var FLOOD_SKIP = -1, FLOOD_H = 34;                                   // [stad] FLOOD_H: lamba yuksekligi (golge serit boyu)                                                 // [vq] gölge haritası ışığına denk gelen direk (LIGHTS kurulunca hesaplanır)
        var groundTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, groundTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (VQ.pitch) {                                                      // [vq] çim ayrıntı dokusu: iki eksende tekrar, mipmap + anizotropi
            T.detail = tex(detailCanvas(), { mip: true }); gl.bindTexture(gl.TEXTURE_2D, T.detail); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        }
        var U_STR = new Float32Array([PX0, PZ0, (PX1 - PX0) / 22, (PZ1 - PZ0) / 15]), U_PG = new Float32Array([PW, PH, cfg.C && cfg.C.PA_Y0 != null ? cfg.C.PA_Y0 : PH / 2 - 20.16, cfg.C && cfg.C.PA_Y1 != null ? cfg.C.PA_Y1 : PH / 2 + 20.16]);
        var white1 = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, white1); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

        /* ----- dinamik dörtgen tamponu (gölgeler, halkalar, zemin katmanı, panolar) ----- */
        var QN = 256, qbuf = new Float32Array(QN * 6 * 9), qvao = gl.createVertexArray(); gl.bindVertexArray(qvao); var qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, qbuf.byteLength, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 36, 12); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 20);
        var qn = 0;
        /* [opt] çim dörtgeni hiç değişmez: kare başına dinamik tampona yazılmak yerine bir kez yüklenen sabit tampon */
        var pitchVao = gl.createVertexArray(); gl.bindVertexArray(pitchVao); (function () { var b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([PX0, 0, PZ0, 0, 0, 1, 1, 1, 1, PX1, 0, PZ0, 1, 0, 1, 1, 1, 1, PX1, 0, PZ1, 1, 1, 1, 1, 1, 1, PX0, 0, PZ0, 0, 0, 1, 1, 1, 1, PX1, 0, PZ1, 1, 1, 1, 1, 1, 1, PX0, 0, PZ1, 0, 1, 1, 1, 1, 1]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 36, 12); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 20); })();
        gl.bindVertexArray(null);
        function qv(x, y, z, u, v, r, g, b, a) { var o = qn * 9; qbuf[o] = x; qbuf[o + 1] = y; qbuf[o + 2] = z; qbuf[o + 3] = u; qbuf[o + 4] = v; qbuf[o + 5] = r; qbuf[o + 6] = g; qbuf[o + 7] = b; qbuf[o + 8] = a; qn++; }
        function qFlat(cx, cz, hx, hz, y, r, g, b, a) { qv(cx - hx, y, cz - hz, 0, 0, r, g, b, a); qv(cx + hx, y, cz - hz, 1, 0, r, g, b, a); qv(cx + hx, y, cz + hz, 1, 1, r, g, b, a); qv(cx - hx, y, cz - hz, 0, 0, r, g, b, a); qv(cx + hx, y, cz + hz, 1, 1, r, g, b, a); qv(cx - hx, y, cz + hz, 0, 1, r, g, b, a); }
        function qFlush(texture, mul) {
            if (!qn) return; gl.bindVertexArray(qvao); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, qbuf, 0, qn * 9);
            gl.bindTexture(gl.TEXTURE_2D, texture); gl.uniform4fv(pTex.u.uMul, mul || U_ONE4); gl.drawArrays(gl.TRIANGLES, 0, qn); qn = 0;   // [opt] tahsissiz
        }
        /* [vq] diğer üç direkten uzayan soluk gölgeler (boy · yatay mesafe / direk yüksekliği): ayak noktasından (ux,uz) yönünde zemine yatık
           şerit (u boyuna, v enine). Köşeler doğrudan dörtgen tamponuna yazılır - kare başına tahsis (kutulanmış sayı) yok. */
        var STRIP_UV = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1], STRIP_S = [-1, -1, 1, -1, 1, 1];
        /* [vq] yönlü yumuşak temas gölgesi: ayak ortasından göğsün 0.45 m ötesine, govde ekseni boyunca (u), 0.6 m genişlik (v) - blob dokusu */
        function lieShadow(a, alpha) {
            var c = a.cP, fx = c[3], fz = c[5], dx = c[0] - fx, dz = c[2] - fz, L = Math.sqrt(dx * dx + dz * dz);
            if (L < .25) return;
            var ux = dx / L, uz = dz / L, x0 = fx - ux * .2, z0 = fz - uz * .2, x1 = c[0] + ux * .45, z1 = c[2] + uz * .45, px = -uz * .34, pz = ux * .34;
            for (var k = 0; k < 6; k++) {
                var u = STRIP_UV[k * 2], sv = STRIP_S[k], o = qn * 9;
                qbuf[o] = (u ? x1 : x0) + px * sv; qbuf[o + 1] = .036; qbuf[o + 2] = (u ? z1 : z0) + pz * sv; qbuf[o + 3] = u; qbuf[o + 4] = STRIP_UV[k * 2 + 1];
                qbuf[o + 5] = 1; qbuf[o + 6] = 1; qbuf[o + 7] = 1; qbuf[o + 8] = alpha; qn++;
            }
        }
        function floodShadows(i, v) {                                        // i: oyuncu (-1 = hakem); sayılar argüman olarak kutulanmasın diye içeride okunur
            var x, z, sc, a0 = 1;
            if (i < 0) { x = v.rx; z = v.ry; sc = .97; }
            else { var a6 = S.st[i], ry6 = a6.rY || 0; x = a6.dX != null ? a6.dX : v.x[i]; z = a6.dZ != null ? a6.dZ : v.y[i]; sc = a6.hScale != null ? a6.hScale : .98; if (ry6 > .03) a0 = clamp(1 - ry6 * 1.6, .25, 1); }
            for (var f = 0; f < FLOOD_POS.length; f++) {
                if (f === FLOOD_SKIP) continue;
                var fp = FLOOD_POS[f], dx = x - fp[0], dz = z - fp[1], hd = Math.sqrt(dx * dx + dz * dz) || 1, ux = dx / hd, uz = dz / hd, len = 1.85 * sc * hd / FLOOD_H;
                var a = a0 * .19 * (hd > 122.2 ? .45 : hd < 55 ? 1 : 55 / hd), px = -uz * .26, pz = ux * .26, x0 = x - ux * .12, z0 = z - uz * .12, x1 = x + ux * len, z1 = z + uz * len;
                for (var k = 0; k < 6; k++) {
                    var u = STRIP_UV[k * 2], sv = STRIP_S[k], o = qn * 9;
                    qbuf[o] = (u ? x1 : x0) + px * sv; qbuf[o + 1] = .033; qbuf[o + 2] = (u ? z1 : z0) + pz * sv; qbuf[o + 3] = u; qbuf[o + 4] = STRIP_UV[k * 2 + 1];
                    qbuf[o + 5] = 1; qbuf[o + 6] = 1; qbuf[o + 7] = 1; qbuf[o + 8] = a; qn++;
                }
            }
        }
        /* kameraya dönük (billboard) dörtgen: projektör parlaması ve seyirci patlaması için */
        function qBill(cx, cy, cz, sx, sy, r, g, b, a) {
            var rx = VIEW[0], ry = VIEW[4], rz = VIEW[8], ux = VIEW[1], uy = VIEW[5], uz = VIEW[9];
            var x0 = cx - rx * sx - ux * sy, y0 = cy - ry * sx - uy * sy, z0 = cz - rz * sx - uz * sy;
            var x1 = cx + rx * sx - ux * sy, y1 = cy + ry * sx - uy * sy, z1 = cz + rz * sx - uz * sy;
            var x2 = cx + rx * sx + ux * sy, y2 = cy + ry * sx + uy * sy, z2 = cz + rz * sx + uz * sy;
            var x3 = cx - rx * sx + ux * sy, y3 = cy - ry * sx + uy * sy, z3 = cz - rz * sx + uz * sy;
            qv(x0, y0, z0, 0, 0, r, g, b, a); qv(x1, y1, z1, 1, 0, r, g, b, a); qv(x2, y2, z2, 1, 1, r, g, b, a);
            qv(x0, y0, z0, 0, 0, r, g, b, a); qv(x2, y2, z2, 1, 1, r, g, b, a); qv(x3, y3, z3, 0, 1, r, g, b, a);
        }

        /* ----- sahne (maça özel) ----- */
        var S = { team: [[.9, .1, .2], [.1, .6, 1]], gk: [[.2, .8, .3], [1, .6, .1]], pal: [], pos: [], names: [], sceneryKey: '', sc: null, players: null };
        var SC = null;      // statik sahne tamponları
        var LIGHTS = { sun: [1.22, 1.16, 1.02], ambS: [.46, .52, .64], ambG: [.22, .27, .19], ldir: null, fogC: [.07, .10, .16], fog: .0042 };
        (function () { var l = [-.35, .82, .42], n = Math.hypot(l[0], l[1], l[2]); LIGHTS.ldir = [l[0] / n, l[1] / n, l[2] / n]; })();
        /* oyuncular için ek projektör ışıkları (gölgesiz): karşı köşeden dolgu + kamera karşısından arka/kenar ışığı - gece maçında dört
           direkten gelen çok yönlü aydınlatmanın karşılığı; oyuncu hacmi (omuz, yüz, kas) tek ışıktaki gibi düz görünmez */
        (function () { function nz(v) { var n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; } LIGHTS.l2 = nz([.50, .62, -.60]); LIGHTS.c2 = [.34, .35, .38]; LIGHTS.l3 = nz([-.15, .50, -.85]); LIGHTS.c3 = [.26, .28, .34]; })();
        // [vq] gölge haritasının ışığı (LIGHTS.ldir) zaten bir direğe denk gelir (yakın-sol): o direğin şerit gölgesi çizilmez
        function floodSkipCalc() { var lx = LIGHTS.ldir[0], lz = LIGHTS.ldir[2], best = -1, bd = -9; FLOOD_POS.forEach(function (p, k) { var dx = p[0] - PW / 2, dz = p[1] - PH / 2, l = Math.hypot(dx, dz) * Math.hypot(lx, lz), d = (dx * lx + dz * lz) / l; if (d > bd) { bd = d; best = k; } }); return best; }
        FLOOD_SKIP = floodSkipCalc();
        var BOOT = [[.06, .06, .08], [.06, .06, .08], [.95, .95, .95], [.9, .3, .1], [.2, .5, 1]];
        function pushBox(out, x0, y0, z0, x1, y1, z1, c) {
            var f = [[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], 0, 0, 1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], 0, 0, -1], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], 1, 0, 0],
                [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], -1, 0, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], 0, 1, 0]];
            f.forEach(function (q) { [0, 1, 2, 0, 2, 3].forEach(function (k) { var p = q[k]; out.push(p[0], p[1], p[2], q[4], q[5], q[6], c[0], c[1], c[2]); }); });
        }
        function pushQuad(out, a, b, c, d, n, col) { [a, b, c, a, c, d].forEach(function (p) { out.push(p[0], p[1], p[2], n[0], n[1], n[2], col[0], col[1], col[2]); }); }
        function upload(arr) { var v = makeVBO(gl, new Float32Array(arr), 9, [[3, 0], [3, 3], [3, 6]]); return { vao: v.vao, n: arr.length / 9 }; }

        /* [stad] Unity stadyumu: seyirci seritleri (isik = pisirilmis, cati golgesinde karanlik), gol coskusu noktalari, projektor kuleleri */
        function stadUnity(crowdQ, crowdPts, rnd) {
            var D = G.ADO_STAD, s, step = .56;
            for (s = 0; s < D.ns; s++) {
                var ax = D.sp[s * 5], ay = D.sp[s * 5 + 1], az = D.sp[s * 5 + 2], bx = D.sp[s * 5 + 3], bz = D.sp[s * 5 + 4], nx = D.sbs[s * 4] / 127, nz = D.sbs[s * 4 + 1] / 127, bias = D.sbu[s * 4 + 2] / 255, li = D.sbu[s * 4 + 3] / 255 * 2;
                var len = Math.hypot(bx - ax, bz - az); if (len < .3) continue;
                var mixB = bias > .25 && bias < .75, variant = (bias <= .25 ? 0 : bias >= .75 ? 6 : 12) + ((rnd() * (mixB ? 4 : 6)) | 0), v0 = variant / 16 + .004, v1 = (variant + 1) / 16 - .004;
                var br = clamp(li * .8, .2, 1.15), ph = rnd(), yb = ay, yt = ay + .98, ua = rnd(), ub = ua + len / (64 * step);
                if ((bx - ax) * nz - (bz - az) * nx < 0) { var tq = ua; ua = ub; ub = tq; }
                [[ax, az, ua, yb, v1], [bx, bz, ub, yb, v1], [bx, bz, ub, yt, v0], [ax, az, ua, yb, v1], [bx, bz, ub, yt, v0], [ax, az, ua, yt, v0]].forEach(function (q) { crowdQ.push(q[0], q[3], q[1], q[2], q[4], br, ph, bias, q[3] > yb ? 1 : 0); });
                if (ay < 2.4 && rnd() < .4) crowdPts.push((ax + bx) / 2 - nx * .3, ay + .56, (az + bz) / 2 - nz * .3, bias);
            }
            var K = D.kuleler;
            if (K && K.length) { FLOOD_POS.length = 0; FLOOD_TIPS.length = 0; K.forEach(function (k) { FLOOD_POS.push([k[0], k[1], Math.atan2(PW / 2 - k[0], PH / 2 - k[1])]); FLOOD_TIPS.push([k[2], k[3], k[4]]); }); FLOOD_H = K[0][3]; FLOOD_SKIP = floodSkipCalc(); }
        }
        function stadUpload(D, home, away) {
            var n = D.n, f = new Float32Array(n * 9), L = D.light, A = D.alb, K = D.cls, P = D.pos, Nn = D.nrm, sc = (D.lsc || 3.2) / 255, i;
            var hS = mixc(home, [0, 0, 0], .32), aS = mixc(away, [0, 0, 0], .32), hW = mixc(home, [0, 0, 0], .42);
            for (i = 0; i < n; i++) {
                var o = i * 9, c = K[i], ar, ag, ab;
                if (c === 1) { ar = hS[0]; ag = hS[1]; ab = hS[2]; } else if (c === 2) { ar = aS[0]; ag = aS[1]; ab = aS[2]; } else if (c === 4) { ar = hW[0]; ag = hW[1]; ab = hW[2]; }
                else { ar = A[i * 3] / 255; ag = A[i * 3 + 1] / 255; ab = A[i * 3 + 2] / 255; }
                f[o] = P[i * 3]; f[o + 1] = P[i * 3 + 1]; f[o + 2] = P[i * 3 + 2]; f[o + 3] = Nn[i * 3] / 127; f[o + 4] = Nn[i * 3 + 1] / 127; f[o + 5] = Nn[i * 3 + 2] / 127;
                f[o + 6] = ar * L[i * 3] * sc; f[o + 7] = ag * L[i * 3 + 1] * sc; f[o + 8] = ab * L[i * 3 + 2] * sc;
            }
            var vao = gl.createVertexArray(); gl.bindVertexArray(vao); var vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, f, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 36, 12); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 36, 24);
            var ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, D.idx, gl.STATIC_DRAW);
            gl.bindVertexArray(null); SCRES.push({ vao: vao, buf: vb }); SCRES.push({ vao: null, buf: ib });
            return { vao: vao, n: D.ni };
        }
        function buildScenery(cols) {
            var opaque = [], glass = [], emis = [], screen = [], crowdQ = [], home = hex2rgb(cols[0]), away = hex2rgb(cols[1]), rnd = rngf(777), rndW = rngf(778);
            // dış zemin
            pushQuad(opaque, [-80, -.05, -70], [200, -.05, -70], [200, -.05, 150], [-80, -.05, 150], [0, 1, 0], [.11, .15, .16]);
            // sahayı çevreleyen zemin şeridi (koyu yeşil-gri): reklam panolarına kadar
            pushQuad(opaque, [PX0 - 8, -.03, PZ0 - 5], [PX1 + 8, -.03, PZ0 - 5], [PX1 + 8, -.03, PZ1 + 12], [PX0 - 8, -.03, PZ1 + 12], [0, 1, 0], [.16, .24, .2]);
            // tribünler
            var neutral = [[.9, .9, .92], [.13, .14, .18], [.36, .42, .53], [.78, .8, .85], [.23, .28, .4], [.6, .62, .68]];
            /* [vq] merdiven boşluklu seyirci şeritleri: [a0, a1, a0, a1, ...] (tribün boyunca metre) · AISLE_W: merdiven genişliği */
            var AISLE_W = 1.1;
            function aisleSegs(len) {
                var out = [], nA = Math.max(1, Math.round(len / 15)), gw = AISLE_W / 2, prev = 0, k, j;
                for (k = 0; k <= nA; k++) {
                    var e = k < nA ? len * (k + .5) / nA - gw : len, L = e - prev;
                    if (L > .3) { var nS = Math.max(1, Math.round(L / 4.5)); for (j = 0; j < nS; j++) out.push(prev + L * j / nS, prev + L * (j + 1) / nS); }
                    prev = e + 2 * gw;
                }
                return out;
            }
            function stand(side, x0, z0, len, rows, rh, rd, bias) {
                // side: 'N' (uzak), 'S' (yakın), 'W', 'E'; (x0,z0) = sahaya en yakın sıranın başlangıcı (uzunluk boyunca en küçük koordinat)
                var n, t, alongX = side === 'N' || side === 'S';
                if (side === 'N') { n = [0, 0, 1]; t = [1, 0, 0]; } else if (side === 'S') { n = [0, 0, -1]; t = [1, 0, 0]; } else if (side === 'W') { n = [1, 0, 0]; t = [0, 0, 1]; } else { n = [-1, 0, 0]; t = [0, 0, 1]; }
                var away2 = [-n[0], 0, -n[2]], step = .56, segA = VQ.mat ? aisleSegs(len) : null;
                for (var r = 0; r < rows; r++) {
                    var h = (r + 1) * rh, d0 = r * rd, y0 = r * rh;
                    // basamak kutusu (sahadan uzağa doğru)
                    var bx0, bx1, bz0, bz1;
                    if (side === 'N') { bx0 = x0; bx1 = x0 + len; bz1 = z0 - d0; bz0 = z0 - d0 - rd; }
                    else if (side === 'S') { bx0 = x0; bx1 = x0 + len; bz0 = z0 + d0; bz1 = z0 + d0 + rd; }
                    else if (side === 'W') { bz0 = z0; bz1 = z0 + len; bx1 = x0 - d0; bx0 = x0 - d0 - rd; }
                    else { bz0 = z0; bz1 = z0 + len; bx0 = x0 + d0; bx1 = x0 + d0 + rd; }
                    if (side === 'N' || side === 'S') pushBox(opaque, bx0, 0, bz0, bx1, h, bz1, [.27, .29, .33]); else pushBox(opaque, bx0, 0, bz0, bx1, h, bz1, [.27, .29, .33]);
                    // koltuk şeridi (takım renginden koyulaştırılmış)
                    var sc = r % 7 < 3 ? mixc(home, [0, 0, 0], .35) : r % 7 < 5 ? [.2, .23, .3] : mixc(away, [0, 0, 0], .45);
                    if (bias === 'home') sc = mixc(home, [0, 0, 0], .3 + (r % 3) * .05); else if (bias === 'away') sc = mixc(away, [0, 0, 0], .3 + (r % 3) * .05);
                    var ex = side === 'N' || side === 'S' ? [len, .04, rd * .55] : [rd * .55, .04, len];
                    if (alongX) { var zc = side === 'N' ? bz0 + rd * .45 : bz0 + rd * .05; pushBox(opaque, bx0, h, zc, bx1, h + .04, zc + rd * .5, sc); }
                    else { var xc = side === 'W' ? bx0 + rd * .45 : bx0 + rd * .05; pushBox(opaque, xc, h, bz0, xc + rd * .5, h + .04, bz1, sc); }
                    // seyirciler: sıra başına ~4.5 m'lik dokulu şeritler (mipmap'li seyirci dokusu - uzakta "TV karıncalanması" yapmaz;
                    // her şeridin kendi sıçrama fazı var: gol coşkusunda tribün dalga gibi hareket eder - bkz VS_CROWD)
                    var depthC = d0 + rd * .42, segN = Math.max(1, Math.round(len / 4.5)), segL = len / segN, variant = (bias === 'home' ? 0 : bias === 'away' ? 6 : 12) + ((rnd() * (bias === 'mix' ? 4 : 6)) | 0), uo = rnd();
                    var v0 = variant / 16 + .004, v1 = (variant + 1) / 16 - .004, br = (side === 'S' ? .95 : 1.0) - .30 * (r / rows), sideB = bias === 'home' ? 0 : bias === 'away' ? 1 : .5, sg;
                    if (segA) {                                                     // [vq] merdivenler: boşlukların ortasında basamak üstü açık beton şerit
                        for (var ai = 0; ai + 2 < segA.length; ai += 2) {
                            if (segA[ai + 2] - segA[ai + 1] < AISLE_W * .5) continue;
                            var m0 = segA[ai + 1] + .08, m1 = segA[ai + 2] - .08, sy = h + .05, sc2 = [.40, .41, .44];
                            if (side === 'N') pushQuad(opaque, [x0 + m0, sy, bz1], [x0 + m1, sy, bz1], [x0 + m1, sy, bz0], [x0 + m0, sy, bz0], [0, 1, 0], sc2);
                            else if (side === 'S') pushQuad(opaque, [x0 + m0, sy, bz1], [x0 + m1, sy, bz1], [x0 + m1, sy, bz0], [x0 + m0, sy, bz0], [0, 1, 0], sc2);
                            else pushQuad(opaque, [bx0, sy, z0 + m0], [bx1, sy, z0 + m0], [bx1, sy, z0 + m1], [bx0, sy, z0 + m1], [0, 1, 0], sc2);
                        }
                    }
                    for (sg = 0; sg < (segA ? segA.length / 2 : segN); sg++) {
                        var a0 = segA ? segA[sg * 2] : sg * segL, a1 = segA ? segA[sg * 2 + 1] : a0 + segL, yb = h + .02, yt = h + .02 + .98, ph = rnd(), P0, P1;
                        if (side === 'N') { P0 = [x0 + a0, z0 - depthC]; P1 = [x0 + a1, z0 - depthC]; } else if (side === 'S') { P0 = [x0 + a1, z0 + depthC]; P1 = [x0 + a0, z0 + depthC]; }
                        else if (side === 'W') { P0 = [x0 - depthC, z0 + a1]; P1 = [x0 - depthC, z0 + a0]; } else { P0 = [x0 + depthC, z0 + a0]; P1 = [x0 + depthC, z0 + a1]; }
                        var ua = uo + a0 / (64 * step), ub = uo + a1 / (64 * step);
                        if (side === 'S' || side === 'W') { var tq = ua; ua = ub; ub = tq; }
                        [[P0, ua, yb, v1], [P1, ub, yb, v1], [P1, ub, yt, v0], [P0, ua, yb, v1], [P1, ub, yt, v0], [P0, ua, yt, v0]].forEach(function (q) { crowdQ.push(q[0][0], q[2], q[0][1], q[1], q[3], br, ph, sideB, q[2] > yb ? 1 : 0); });
                    }
                }
                // arka duvar + çatı
                var hb = rows * rh, db = rows * rd;
                if (side === 'N') { pushBox(opaque, x0 - 2, 0, z0 - db - 1.2, x0 + len + 2, hb + 7, z0 - db, [.16, .18, .22]); pushBox(opaque, x0 - 3, hb + 6.4, z0 - db - 1.2, x0 + len + 3, hb + 7.1, z0 - db * .45, [.12, .14, .18]); }
                else if (side === 'S') { pushBox(opaque, x0 - 2, 0, z0 + db, x0 + len + 2, hb + 4, z0 + db + 1.2, [.16, .18, .22]); }
                else if (side === 'W') { pushBox(opaque, x0 - db - 1.2, 0, z0 - 2, x0 - db, hb + 7, z0 + len + 2, [.16, .18, .22]); pushBox(opaque, x0 - db - 1.2, hb + 6.4, z0 - 3, x0 - db * .45, hb + 7.1, z0 + len + 3, [.12, .14, .18]); }
                else { pushBox(opaque, x0 + db, 0, z0 - 2, x0 + db + 1.2, hb + 7, z0 + len + 2, [.16, .18, .22]); pushBox(opaque, x0 + db * .45, hb + 6.4, z0 - 3, x0 + db + 1.2, hb + 7.1, z0 + len + 3, [.12, .14, .18]); }
                if (VQ.mat && side !== 'S') {                                  // [vq] arka duvarda loca camları: sıcak, loş paneller (üst tribün boş/kara görünmesin)
                    var nP = Math.max(1, Math.floor(len / 2.6)), pw2 = len / nP, wy0 = hb + 2.15, wy1 = hb + 3.15, wp;
                    for (wp = 0; wp < nP; wp++) {
                        var e0 = wp * pw2 + .22, e1 = (wp + 1) * pw2 - .22, lit = rndW() < .18 ? .25 : .55 + rndW() * .45, wc = [.25 * lit, .215 * lit, .16 * lit];
                        if (side === 'N') pushQuad(emis, [x0 + e0, wy0, z0 - db + .04], [x0 + e1, wy0, z0 - db + .04], [x0 + e1, wy1, z0 - db + .04], [x0 + e0, wy1, z0 - db + .04], [0, 0, 1], wc);
                        else if (side === 'W') pushQuad(emis, [x0 - db + .04, wy0, z0 + e0], [x0 - db + .04, wy0, z0 + e1], [x0 - db + .04, wy1, z0 + e1], [x0 - db + .04, wy1, z0 + e0], [1, 0, 0], wc);
                        else pushQuad(emis, [x0 + db - .04, wy0, z0 + e0], [x0 + db - .04, wy0, z0 + e1], [x0 + db - .04, wy1, z0 + e1], [x0 + db - .04, wy1, z0 + e0], [-1, 0, 0], wc);
                    }
                }
            }
            var stadU = !!(G.ADO_STAD && G.ADO_STAD.ready), crowdPts = [];
            if (stadU) stadUnity(crowdQ, crowdPts, rnd);
            else {
            var xs = -10, xl = PW + 20, zs = -9, zl = PH + 21;
            stand('N', xs, -9, xl, 22, .46, .78, 'mix');
            stand('S', xs, PH + 12, xl, 11, .42, .78, 'mix');
            stand('W', -10, zs, zl, 22, .46, .78, 'home');
            stand('E', PW + 10, zs, zl, 22, .46, .78, 'away');
            /* köşe tribünleri: dört köşedeki boşluklar (eskiden gökyüzü görünüyordu) çeyrek-halka basamaklarla kapatılır - kase tamamlanır */
            function corner(ccx, ccz, a0, a1, rows, rh, rd, bias, wallH, roofOn) {
                var NSEG = 9, r, k, sideB = bias === 'home' ? 0 : bias === 'away' ? 1 : .5, stepC = [.27, .29, .33];
                function P(t, d, y) { return [ccx + Math.cos(t) * d, y, ccz + Math.sin(t) * d]; }
                for (r = 0; r < rows; r++) {
                    var h = (r + 1) * rh, d0 = r * rd, d1 = d0 + rd, variant = (bias === 'home' ? 0 : bias === 'away' ? 6 : 12) + ((rnd() * (bias === 'mix' ? 4 : 6)) | 0), v0 = variant / 16 + .004, v1 = (variant + 1) / 16 - .004, br = 1 - .30 * (r / rows);
                    for (k = 0; k < NSEG; k++) {
                        var t0 = a0 + (a1 - a0) * k / NSEG, t1 = a0 + (a1 - a0) * (k + 1) / NSEG, tm = (t0 + t1) / 2, nn = [-Math.cos(tm), 0, -Math.sin(tm)];
                        pushQuad(opaque, P(t0, d0, h), P(t1, d0, h), P(t1, d1, h), P(t0, d1, h), [0, 1, 0], stepC);
                        pushQuad(opaque, P(t0, d0, h - rh), P(t1, d0, h - rh), P(t1, d0, h), P(t0, d0, h), nn, [.22, .24, .28]);
                        var dc = d0 + rd * .42, yb = h + .02, yt = yb + .98, A = P(t0, dc, 0), B2 = P(t1, dc, 0), arc = Math.abs(t1 - t0) * dc, ua = rnd(), ub = ua + arc / (64 * .56), ph = rnd();
                        [[A, ua, yb, v1], [B2, ub, yb, v1], [B2, ub, yt, v0], [A, ua, yb, v1], [B2, ub, yt, v0], [A, ua, yt, v0]].forEach(function (q) { crowdQ.push(q[0][0], q[2], q[0][2], q[1], q[3], br, ph, sideB, q[2] > yb ? 1 : 0); });
                    }
                }
                var db = rows * rd, hb = rows * rh;
                for (k = 0; k < NSEG; k++) {
                    var s0 = a0 + (a1 - a0) * k / NSEG, s1 = a0 + (a1 - a0) * (k + 1) / NSEG, sm = (s0 + s1) / 2;
                    pushQuad(opaque, P(s0, db, 0), P(s1, db, 0), P(s1, db, hb + wallH), P(s0, db, hb + wallH), [-Math.cos(sm), 0, -Math.sin(sm)], [.16, .18, .22]);
                    if (roofOn) {
                        pushQuad(opaque, P(s0, db * .45, hb + 7.1), P(s1, db * .45, hb + 7.1), P(s1, db + 1.2, hb + 7.1), P(s0, db + 1.2, hb + 7.1), [0, 1, 0], [.12, .14, .18]);
                        pushQuad(opaque, P(s0, db * .45, hb + 6.4), P(s1, db * .45, hb + 6.4), P(s1, db + 1.2, hb + 6.4), P(s0, db + 1.2, hb + 6.4), [0, -1, 0], [.10, .12, .15]);
                        pushQuad(opaque, P(s0, db * .45, hb + 6.4), P(s1, db * .45, hb + 6.4), P(s1, db * .45, hb + 7.1), P(s0, db * .45, hb + 7.1), [-Math.cos(sm), 0, -Math.sin(sm)], [.14, .16, .2]);
                        // çatı ön kenarı altında ışık şeridi (gece maçı: tribün aydınlatması)
                        pushQuad(emis, P(s0, db * .45 + .15, hb + 6.36), P(s1, db * .45 + .15, hb + 6.36), P(s1, db * .45 + .45, hb + 6.36), P(s0, db * .45 + .45, hb + 6.36), [0, -1, 0], [1, .96, .86]);
                    }
                }
            }
            corner(-10, -9, Math.PI, 1.5 * Math.PI, 22, .46, .78, 'mix', 7, true);
            corner(PW + 10, -9, 1.5 * Math.PI, 2 * Math.PI, 22, .46, .78, 'mix', 7, true);
            corner(-10, PH + 12, .5 * Math.PI, Math.PI, 11, .42, .78, 'mix', 4, false);
            corner(PW + 10, PH + 12, 0, .5 * Math.PI, 11, .42, .78, 'mix', 4, false);
            // düz tribünlerin çatı ön kenarı ışık şeritleri (N/W/E)
            (function () {
                var hb = 22 * .46, db = 22 * .78, yl = hb + 6.36, L1 = [1, .96, .86];
                pushQuad(emis, [xs - 3, yl, -9 - db * .45 - .15], [xs + xl + 3, yl, -9 - db * .45 - .15], [xs + xl + 3, yl, -9 - db * .45 - .45], [xs - 3, yl, -9 - db * .45 - .45], [0, -1, 0], L1);
                pushQuad(emis, [-10 - db * .45 - .15, yl, zs - 3], [-10 - db * .45 - .15, yl, zs + zl + 3], [-10 - db * .45 - .45, yl, zs + zl + 3], [-10 - db * .45 - .45, yl, zs - 3], [0, -1, 0], L1);
                pushQuad(emis, [PW + 10 + db * .45 + .15, yl, zs - 3], [PW + 10 + db * .45 + .15, yl, zs + zl + 3], [PW + 10 + db * .45 + .45, yl, zs + zl + 3], [PW + 10 + db * .45 + .45, yl, zs - 3], [0, -1, 0], L1);
            })();
            // seyirci tepkisi (gol kutlaması): ön sıraların seyrek örneklemesi — dört tribünden de, kale arkasındaki (W/E) taraf öncelikli parlar
            var crowdPts = [];
            (function sampleCrowd() {
                function along(side, x0, z0, len, n, y) {
                    for (var k = 0; k < n; k++) {
                        var u = (k + .5) / n, px, pz;
                        if (side === 'N') { px = x0 + u * len; pz = z0 - .3; } else if (side === 'S') { px = x0 + u * len; pz = z0 + .3; }
                        else if (side === 'W') { pz = z0 + u * len; px = x0 - .3; } else { pz = z0 + u * len; px = x0 + .3; }
                        crowdPts.push(px, y, pz, side === 'W' ? 0 : side === 'E' ? 1 : .5);
                    }
                }
                along('N', xs, -9, xl, 46, .58); along('S', xs, PH + 12, xl, 26, .5);
                along('W', -10, zs, zl, 40, .58); along('E', PW + 10, zs, zl, 40, .58);
            })();
            }
            // modeller
            var glb = MODELS, I = m4(), place = m4();
            function at(x, y, z, ry) { return mtrs(place, x, y, z, 0, ry || 0, 0, 1); }
            var accent = hex2rgb(cols[0]);
            var colorOfHome = function (m) { return m.name === 'accent' ? accent : m.c; }, colorOfAway = function (m) { return m.name === 'accent' ? hex2rgb(cols[1]) : m.c; };
            var buckets = { opaque: opaque, glass: glass, emis: emis, screen: screen };
            bakeModel(glb, 'Goal', at(0, 0, PH / 2, 0), buckets); bakeModel(glb, 'Goal', at(PW, 0, PH / 2, Math.PI), buckets);
            [[0, 0], [PW, 0], [0, PH], [PW, PH]].forEach(function (p) { bakeModel(glb, 'Flag', at(p[0], 0, p[1], 0), buckets); });
            bakeModel(glb, 'Dugout', at(PW / 2 - 15, 0, PH + 5.2, Math.PI), buckets, colorOfHome); bakeModel(glb, 'Dugout', at(PW / 2 + 15, 0, PH + 5.2, Math.PI), buckets, colorOfAway);
            bakeModel(glb, 'VarBooth', at(PW / 2, 0, PH + 3.5, Math.PI), buckets);
            if (!stadU) FLOOD_POS.forEach(function (p) { bakeModel(glb, 'Floodlight', at(p[0], 0, p[1], p[2]), buckets); });
            var o = { opaque: upload(opaque), glass: upload(glass), emis: upload(emis), screen: upload(screen) };
            if (stadU) { try { o.stad = stadUpload(G.ADO_STAD, home, away); } catch (e) { o.stad = null; } }
            o.crowdPts = new Float32Array(crowdPts);
            // ağlar (kale) - [fx] ızgaralı file: her yüz alt bölümlere ayrılır; kare başına topun değdiği yerde esneme + dalga (NET, netStep)
            var netG = [], netT = [], netF = [];
            function netFace(gi, a, b, c, d, uw, vw, nu, nv, ctr) {
                var base = netG.length / 9, i, j;
                for (j = 0; j <= nv; j++) for (i = 0; i <= nu; i++) {
                    var u = i / nu, w = j / nv, p = [0, 0, 0];
                    for (var k = 0; k < 3; k++) p[k] = a[k] * (1 - u) * (1 - w) + b[k] * u * (1 - w) + c[k] * u * w + d[k] * (1 - u) * w;
                    var pin = Math.pow(Math.sin(Math.PI * u) * Math.sin(Math.PI * w), .6);
                    netG.push(p[0], p[1], p[2], u * uw, w * vw, pin, gi, 0, 0);
                }
                var tu = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], tv = [d[0] - a[0], d[1] - a[1], d[2] - a[2]], n = [tu[1] * tv[2] - tu[2] * tv[1], tu[2] * tv[0] - tu[0] * tv[2], tu[0] * tv[1] - tu[1] * tv[0]], nl = Math.hypot(n[0], n[1], n[2]) || 1;
                n[0] /= nl; n[1] /= nl; n[2] /= nl;
                var mc = [(a[0] + c[0]) / 2 - ctr[0], (a[1] + c[1]) / 2 - ctr[1], (a[2] + c[2]) / 2 - ctr[2]]; if (n[0] * mc[0] + n[1] * mc[1] + n[2] * mc[2] < 0) { n[0] = -n[0]; n[1] = -n[1]; n[2] = -n[2]; }
                netF.push(n);
                for (j = base; j < netG.length / 9; j++) { netG[j * 9 + 7] = netF.length - 1; }
                for (j = 0; j < nv; j++) for (i = 0; i < nu; i++) {
                    var q00 = base + j * (nu + 1) + i, q10 = q00 + 1, q01 = q00 + nu + 1, q11 = q01 + 1;
                    netT.push(q00, q10, q11, q00, q11, q01);
                }
            }
            [0, 1].forEach(function (sd) {
                var gx = sd ? PW : 0, s = sd ? -1 : 1, z0 = PH / 2 - 3.66, z1 = PH / 2 + 3.66, hh = 2.44;
                var back = -2.15 * s, topb = -1.2 * s, ctr = [gx - .9 * s, 1.1, PH / 2];
                netFace(sd, [gx, hh, z0], [gx, hh, z1], [gx + topb, hh - .1, z1], [gx + topb, hh - .1, z0], 30, 5, 26, 5, ctr);         // üst
                netFace(sd, [gx + topb, hh - .1, z0], [gx + topb, hh - .1, z1], [gx + back, .03, z1], [gx + back, .03, z0], 30, 8, 26, 9, ctr);   // arka
                netFace(sd, [gx, 0, z0], [gx, hh, z0], [gx + topb, hh - .1, z0], [gx + back, .03, z0], 12, 8, 9, 9, ctr);           // yan
                netFace(sd, [gx, 0, z1], [gx, hh, z1], [gx + topb, hh - .1, z1], [gx + back, .03, z1], 12, 8, 9, 9, ctr);
            });
            var nN = netT.length, ndat = new Float32Array(nN * 5);
            for (var ni = 0; ni < nN; ni++) { var gq = netT[ni] * 9; ndat[ni * 5] = netG[gq]; ndat[ni * 5 + 1] = netG[gq + 1]; ndat[ni * 5 + 2] = netG[gq + 2]; ndat[ni * 5 + 3] = netG[gq + 3]; ndat[ni * 5 + 4] = netG[gq + 4]; }
            var nvao = gl.createVertexArray(); gl.bindVertexArray(nvao); var nb = gl.createBuffer(); SCRES.push({ vao: nvao, buf: nb }); gl.bindBuffer(gl.ARRAY_BUFFER, nb); gl.bufferData(gl.ARRAY_BUFFER, ndat, gl.DYNAMIC_DRAW);
            gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12);
            var ntin = new Float32Array(nN * 4).fill(1), ntb = gl.createBuffer(); SCRES.push({ vao: null, buf: ntb }); gl.bindBuffer(gl.ARRAY_BUFFER, ntb); gl.bufferData(gl.ARRAY_BUFFER, ntin, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 16, 0);      // [fx] gerilen file daha belirgin (ton)
            o.net = { vao: nvao, n: nN, buf: nb, tb: ntb, tin: ntin, g: new Float32Array(netG), t: new Uint16Array(netT), f: netF, dat: ndat, dsp: new Float32Array(netG.length / 9), live: false };
            // pano
            // reklam panoları
            var bq = [];
            function bd(a, b, c, d, uw) { [[a, 0, 1], [b, uw, 1], [c, uw, 0], [a, 0, 1], [c, uw, 0], [d, 0, 0]].forEach(function (p) { bq.push(p[0][0], p[0][1], p[0][2], p[1], p[2]); }); }
            var bh = .95, zN = -3.6, zS = PH + 8.6, xW = -6, xE = PW + 6;
            bd([xW, 0, zN], [xE, 0, zN], [xE, bh, zN], [xW, bh, zN], (xE - xW) / 22);              // uzak kenar (+Z'ye bakar)
            bd([xE, 0, zS], [xW, 0, zS], [xW, bh, zS], [xE, bh, zS], (xE - xW) / 22);              // yakın kenar arkası (−Z'ye bakar)
            bd([xW, 0, zS], [xW, 0, zN], [xW, bh, zN], [xW, bh, zS], (zS - zN) / 22);             // batı (+X'e bakar)
            bd([xE, 0, zN], [xE, 0, zS], [xE, bh, zS], [xE, bh, zN], (zS - zN) / 22);             // doğu (−X'e bakar)
            var bvao = gl.createVertexArray(); gl.bindVertexArray(bvao); var bb = gl.createBuffer(); SCRES.push({ vao: bvao, buf: bb }); gl.bindBuffer(gl.ARRAY_BUFFER, bb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bq), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 20, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 20, 12); gl.disableVertexAttribArray(2); gl.vertexAttrib4f(2, 1, 1, 1, 1);
            o.boards = { vao: bvao, n: bq.length / 5 };
            // seyirci şeritleri: konum(3) uv(2) [parlaklık, faz, taraf, üst-köşe](4)
            var cvao = gl.createVertexArray(); gl.bindVertexArray(cvao); var cb2 = gl.createBuffer(); SCRES.push({ vao: cvao, buf: cb2 }); gl.bindBuffer(gl.ARRAY_BUFFER, cb2); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(crowdQ), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 36, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 36, 12); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 36, 20);
            o.crowd = { vao: cvao, n: crowdQ.length / 9 };
            if (T.crowd) gl.deleteTexture(T.crowd); T.crowd = tex(crowdCanvas(home, away, neutral), { mip: true, repeat: true });
            // VAR kabini üstündeki yazı
            o.count = opaque.length / 9;
            return o;
        }
        var SCRES = [];
        /* [fx] file dinamiği (yalnızca görüntü): top filenin bir yüzüne değdiğinde/bastırdığında
           1) temas şişkinliği: top filenin dinlenme yüzeyinin ötesine geçtiği kadar file topu sarar (Gauss, σ≈.45 m)
           2) darbe: ilk temasta topun hızıyla orantılı, sönümlü salınan şişkinlik + yüzeyde yayılan halka dalgası
           Kenarlar (direk, üst direk, zemin, arka destek) sabittir (pin = sin·sin). Zaman: görünen sim saati (tekrarda yavaş çekimle yavaşlar). */
        var NETS = { imp: [], c: [0, 0], cp: [0, 0], cx: [0, 0], cy: [0, 0], cz: [0, 0], cpin: [0, 0], px: 0, py: 0, pz: 0, pt: -1, clean: true, lt: -1 };
        function netBack(y) { return 1.2 + (2.34 - clamp(y, .03, 2.34)) / 2.31 * .95; }
        function netStep(net, tnow) {
            if (!net || !net.g) return;
            var Rb = .11 * BSC, bx = GB.x, by = ballY(GB.y), bz = GB.z, sd, i, ok = GB.ok !== false && !GB.held;
            if (tnow < NETS.lt - .05 || tnow - NETS.lt > 3) { NETS.imp.length = 0; NETS.pt = -1; }       // tekrar başa sarıldı / uzun ara
            var dtb = NETS.pt >= 0 ? tnow - NETS.pt : 0, spd = 0;
            if (dtb > 1e-4) { var dd = Math.hypot(bx - NETS.px, by - NETS.py, bz - NETS.pz); spd = dd < 6 ? dd / dtb : 0; }
            if (dtb > 1e-4 || NETS.pt < 0) { NETS.px = bx; NETS.py = by; NETS.pz = bz; NETS.pt = tnow; }
            NETS.lt = tnow;
            for (sd = 0; sd < 2; sd++) {
                var gx = sd ? PW : 0, s = sd ? -1 : 1, dep = (gx - bx) * s, lat = Math.abs(bz - PH / 2), pen = -1, hx = 0, hy = 0, hz = 0;
                if (ok && dep > -.05 && lat < 3.66 + Rb + .1 && by < 2.6) {
                    var bb = netBack(by), pb = dep + Rb - bb, ps = dep > 0 && dep < bb + .2 ? lat + Rb - 3.66 : -1, tz = 2.44 - .1 * clamp(dep / 1.2, 0, 1), pt = dep > 0 && dep < 1.3 ? by + Rb - tz : -1;
                    if (pb > pen && dep > .3) { pen = pb; hx = gx - s * bb; hy = by; hz = bz; }
                    if (ps > pen) { pen = ps; hx = bx; hy = by; hz = PH / 2 + (bz > PH / 2 ? 3.66 : -3.66); }
                    if (pt > pen) { pen = pt; hx = bx; hy = tz; hz = bz; }
                }
                var on = pen > -.07;
                if (on && !NETS.c[sd] && spd > 1.5) NETS.imp.push({ sd: sd, x: hx, y: hy, z: hz, t0: tnow, a: clamp(spd * .028, .12, .62) });
                NETS.c[sd] = on ? 1 : 0; NETS.cp[sd] = on ? clamp(pen + .03, 0, .5) : 0; NETS.cx[sd] = hx; NETS.cy[sd] = hy; NETS.cz[sd] = hz;
            }
            for (i = NETS.imp.length - 1; i >= 0; i--) if (tnow - NETS.imp[i].t0 > 3 || tnow < NETS.imp[i].t0 - .05) NETS.imp.splice(i, 1);
            if (!NETS.imp.length && !NETS.c[0] && !NETS.c[1]) { if (!NETS.clean) { net.dsp.fill(0); netUpload(net); NETS.clean = true; } return; }
            var G = net.g, nG = G.length / 9, D = net.dsp, k, j;
            for (k = 0; k < nG; k++) {
                var q = k * 9, gsd = G[q + 6], pin = G[q + 5], d = 0; if (pin < .01) { D[k] = 0; continue; }
                var px = G[q], py = G[q + 1], pz = G[q + 2];
                if (NETS.c[gsd]) { var r2 = (px - NETS.cx[gsd]) * (px - NETS.cx[gsd]) + (py - NETS.cy[gsd]) * (py - NETS.cy[gsd]) + (pz - NETS.cz[gsd]) * (pz - NETS.cz[gsd]); d += NETS.cp[gsd] * Math.exp(-r2 / .2) * Math.min(1, pin * 1.6); }
                for (j = 0; j < NETS.imp.length; j++) {
                    var im = NETS.imp[j]; if (im.sd !== gsd) continue;
                    var tt = tnow - im.t0; if (tt < 0) continue;
                    var r = Math.sqrt((px - im.x) * (px - im.x) + (py - im.y) * (py - im.y) + (pz - im.z) * (pz - im.z));
                    var ramp = 1 - Math.exp(-tt * 30);
                    var bulge = Math.exp(-r * r / 1.0) * ramp * Math.exp(-tt * 1.9) * Math.cos(tt * 7.5);                        // vuruş noktasında şişip geri yaylanma
                    var wave = r > .05 ? Math.exp(-r / 2.4) * Math.sin(r * 5.5 - tt * 17) * Math.exp(-tt * 2.1) * clamp((tt * 17 - r * 5.5) / 2, 0, 1) * .5 : 0;   // yüzeyde yayılan dalga
                    var sway = .28 * ramp * Math.exp(-tt * 1.4) * Math.sin(tt * 5.2 + .4);                                      // tüm filenin salınımı
                    d += im.a * pin * (bulge + wave + sway);
                }
                D[k] = d;
            }
            netUpload(net); NETS.clean = false;
        }
        function netUpload(net) {
            var G = net.g, T = net.t, F = net.f, D = net.dsp, A = net.dat, n = T.length, i;
            var TN = net.tin;
            for (i = 0; i < n; i++) { var k = T[i], q = k * 9, nf = F[G[q + 7]], d = D[k], o = i * 5; A[o] = G[q] + nf[0] * d; A[o + 1] = G[q + 1] + nf[1] * d; A[o + 2] = G[q + 2] + nf[2] * d; var ad = Math.min(1, Math.abs(d) * 2.6); TN[i * 4] = TN[i * 4 + 1] = TN[i * 4 + 2] = 1 + .1 * ad; TN[i * 4 + 3] = 1 + .85 * ad; }
            gl.bindBuffer(gl.ARRAY_BUFFER, net.buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, A);
            gl.bindBuffer(gl.ARRAY_BUFFER, net.tb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, TN);
        }
        function freeScenery() { SCRES.forEach(function (r) { try { gl.deleteVertexArray(r.vao); gl.deleteBuffer(r.buf); } catch (e) { } }); SCRES = []; }

        /* ----- maç kurulumu ----- */
        var REF_H = 181;   // referans boy (cm): bu değerde oyuncu tam olarak eski sabit .98 ölçeğiyle çizilir (geriye dönük uyumlu ortalama)
        // Oyuncu başına palet (forma/ten/saç/bot rengi) + boy/yapı ölçeğini hesaplar - R.setMatch (maç kurulumu, sahne
        // dahil TAM sıfırlama) İLE R.refreshAppearance (yalnızca görünüm - sahne/kamera/pozisyon DOKUNULMAZ) arasında
        // TEK bir yerden paylaşılır, aynı matematiğin iki kopyası birbirinden sapmasın diye.
        function buildLook(players) {
            var pal = [], roles = [], hw = [], hairs = [], beards = [], feet = [];
            players.forEach(function (p, i) {
                var kit = S.team[p.team], dark = lum(kit) < .35, isGK = p.role === 'GK', h = hash(p.name || ('p' + i)), pv = new Float32Array(SLOT_N * 3);
                var gkc = p.team ? (S.gkc2 || S.gkc) : S.gkc, kitc = isGK ? gkc : kit, short = isGK ? [.09, .1, .13] : (dark ? [.94, .94, .96] : mixc(kit, [0, 0, .06], .72)), socks = isGK ? mixc(gkc, [0, 0, 0], .35) : kit, trim = isGK ? [1, 1, 1] : (dark ? [1, 1, 1] : [.06, .06, .1]);
                var KX = !isGK && S.kitX ? S.kitX[p.team] : null; if (KX) { try { if (KX.shorts) short = hex2rgb(KX.shorts); if (KX.socks) socks = hex2rgb(KX.socks); if (KX.trim) trim = hex2rgb(KX.trim); } catch (e) { } }      // [v160]
                // ten rengi: oyuncuya kalıcı bir değer atanmışsa (p.sk, bkz DB2D.getAppearance/setAppearance) onu kullan; yoksa eski isim-hash yedeği
                var skIdx = p.sk != null ? clamp(p.sk | 0, 0, 4) : (h % 5 === 4 && (h >>> 4) % 3 ? 3 : h % 5);
                // saç rengi: veritabanından (p.hc, bkz DB2D.getAppearance); yoksa isim-hash yedeği (koyu ağırlıklı dağılım)
                var hcU = (h >>> 3) % 100, hcIdx = p.hc != null ? clamp(p.hc | 0, 0, 5) : (hcU < 30 ? 0 : hcU < 58 ? 1 : hcU < 80 ? 2 : hcU < 90 ? 3 : hcU < 96 ? 4 : 5);
                var sk = (p.skc && p.skc.length === 3) ? p.skc : SKIN[skIdx], hr = (p.hcc && p.hcc.length === 3) ? p.hcc : HAIR[hcIdx], bt = BOOT[(h >>> 6) % 5];
                var eu = (h >>> 17) % 100, iris = eu < 55 ? [.20, .11, .05] : eu < 75 ? [.30, .17, .07] : eu < 87 ? [.36, .28, .12] : eu < 93 ? [.22, .33, .16] : [.30, .40, .48];   // göz rengi: koyu kahve %55, kahve %20, ela %12, yeşil %6, mavi-gri %7
                var set = [kitc, short, socks, sk, hr, bt, isGK ? [.95, .95, .95] : sk, trim, [.07, .07, .08], mixc(kitc, [0, 0, 0], .3), iris, mixc(sk, [.62, .28, .27], .3)];
                set.forEach(function (c, k) { pv[k * 3] = c[0]; pv[k * 3 + 1] = c[1]; pv[k * 3 + 2] = c[2]; });
                pal.push(pv); roles.push(isGK);
                // saç stili / sakal: veritabanından (p.hs 0-7, p.bd 0-2); yoksa isim-hash yedeği (kısa %45, kazıtılmış %25, afro %8, uzun %6, kel %6, rasta %4, topuz %4, mohikan %2)
                var hu = ((h >>> 11) % 100), hst = p.hs != null ? clamp(p.hs | 0, 0, HAIR_STYLES_ALL - 1) : (hu < 45 ? 1 : hu < 70 ? 2 : hu < 78 ? 4 : hu < 84 ? 0 : hu < 90 ? 3 : hu < 94 ? 5 : hu < 98 ? 7 : 6);
                hairs.push(hst);
                beards.push(p.bd != null ? clamp(p.bd | 0, 0, 2) : (((h >>> 13) % 100) < 32 ? (((h >>> 20) % 3) ? 1 : 2) : 0));
                feet.push(p.ft === 'L' ? 'L' : 'R');
                // boy/kilo: p.h (cm) / p.w (kg) verilmişse gerçek 3B ölçeğe çevrilir; yoksa ikisi de eski sabit .98'e eşitlenir (tekdüze, sıfır davranış farkı)
                var hScale = p.h != null ? clamp(.98 * (p.h / REF_H), .90, 1.08) : .98, wScale = hScale;
                // kilo/yapı: hScale'e göre BAĞIL bir çarpan (mutlak sınır DEĞİL) - böylece kısa+hafif bir oyuncu her zaman
                // kendi hScale'inden İNCE, uzun+ağır bir oyuncu her zaman kendi hScale'inden İRİ kalır (çelişki olmaz)
                if (p.h != null && p.w != null) { var refBmi = 22.3, bmi = p.w / ((p.h / 100) * (p.h / 100)), wMul = clamp(1 + ((bmi - refBmi) / refBmi) * .6, .86, 1.18); wScale = clamp(hScale * wMul, .80, 1.25); }
                hw.push({ hScale: hScale, wScale: wScale });
            });
            return { pal: pal, roles: roles, hw: hw, hair: hairs, beard: beards, ft: feet };
        }
        /* ----- forma/yüz dokusu: oyuncu başına bir DOKU DİZİSİ katmanı (TEXTURE_2D_ARRAY - atlas kenar taşması yok, katman başına mipmap).
           Üst yarı: forma gövdesi (takıma özgü KURGUSAL desen, sırtta soyadı + numara, göğüste küçük numara ve takım baş harfli arma);
           alt yarı: yüz (göz, kaş - saç renginde, dudak, oyuncuya göre sakal/kirli sakal). Hiçbir gerçek marka/arma/sponsor kullanılmaz.
           Numara: oyuncunun gerçek forma numarası (kayıtta no; [v186]), yoksa mevkiden klasik numaralandırmayla türetilir (KL 1, SĞB 2, SLB 3, ...). */
        var KIT = { tex: null, size: 0, n: 0, ok: false, info: null };
        var ROLE_NO = { GK: 1, RB: 2, LB: 3, RCB: 4, LCB: 5, CB: 4, RDM: 6, DM: 6, LDM: 8, CM: 8, RW: 7, RM: 7, ST: 9, CF: 9, AM: 10, CAM: 10, LW: 11, LM: 11 };
        function shirtNumbers(players) {
            var out = [], used = [{}, {}];
            players.forEach(function (p, i) { var t = p.team ? 1 : 0, rn = p.db && +p.db.no; if (rn >= 1 && rn <= 99 && !used[t][rn]) { used[t][rn] = 1; out[i] = rn | 0; } });      // [v186] gerçek forma numarası (kadro verisi; oyun kaydından p.db.no)
            players.forEach(function (p, i) { if (out[i]) return; var t = p.team ? 1 : 0, n = ROLE_NO[p.role]; if (n && !used[t][n]) { used[t][n] = 1; out[i] = n; } else out[i] = 0; });
            players.forEach(function (p, i) { if (out[i]) return; var t = p.team ? 1 : 0, h = hash(p.name || ('p' + i)), n = 12 + h % 19, k = 0; while (used[t][n] && k++ < 40) n = n >= 30 ? 12 : n + 1; used[t][n] = 1; out[i] = n; });
            return out;
        }
        function surnameOf(nm) { var w = String(nm || '').trim().split(/\s+/); var sn = w.length > 1 ? w[w.length - 1] : w[0] || ''; try { return sn.toLocaleUpperCase('tr-TR'); } catch (e) { return sn.toUpperCase(); } }
        function css(c) { return 'rgb(' + Math.round(clamp(c[0], 0, 1) * 255) + ',' + Math.round(clamp(c[1], 0, 1) * 255) + ',' + Math.round(clamp(c[2], 0, 1) * 255) + ')'; }
        function teamPattern(name, col) { var h = hash(String(name || '') + '|' + col.map(function (v) { return v.toFixed(2); }).join(',')), u = h % 100; return u < 38 ? 0 : u < 52 ? 1 : u < 62 ? 2 : u < 67 ? 3 : u < 75 ? 4 : u < 85 ? 5 : u < 94 ? 6 : 7; }
        function kitEnsure(size, layers) {
            if (KIT.tex && KIT.size === size && KIT.n >= layers) return true;
            try {
                if (KIT.tex) gl.deleteTexture(KIT.tex);
                KIT.tex = gl.createTexture(); gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D_ARRAY, KIT.tex);
                var lv = Math.floor(Math.log2(size)) + 1; gl.texStorage3D(gl.TEXTURE_2D_ARRAY, lv, gl.RGBA8, size, size, layers);
                gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                if (aniso) gl.texParameterf(gl.TEXTURE_2D_ARRAY, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
                gl.activeTexture(gl.TEXTURE0);
                KIT.size = size; KIT.n = layers; KIT.ok = true; return true;
            } catch (e) { KIT.ok = false; KIT.tex = null; gl.activeTexture(gl.TEXTURE0); return false; }
        }
        /* yüz parametrizasyonu (bodyGen ile AYNI): u = headTh^-1(th), v = (phi - phi0) / (pi - .18) */
        function faceU(th) { var t = th / Math.PI, k; for (k = 0; k < 8; k++) { var f = t * (.45 + .55 * t * t) - th / Math.PI, df = .45 + 1.65 * t * t; t -= f / df; } return (t + 1) / 2; }
        function faceV(sn) { return (Math.asin(clamp(sn, -1, 1)) - (-Math.PI / 2 + .18)) / (Math.PI - .18); }
        /* [buzz] "kazıtılmış" (2) saç stili = buzz fade: Meshy saç modelinden (Mbappé) kafa yüzeyine aktarılmış yoğunluk maskesi (yüz
           dokusu düzleminde: u = boylam, v = enlem; tepe dolu, yanlar/ense yukarı doğru açılan geçiş, alın/şakak "line-up" köşeleri).
           Oyuncunun saç rengiyle boyanır; ayrı saç kabuğu çizilmez (kafa derisine yapışık çok kısa saç). Renk başına önbellekli. */
        var BUZZ = { m: null, c: {} };
        /* saç modeli olan stillerde (ADO3D_SCALP[stil]) aynı yöntemle: saçın örttüğü kafa derisi saç rengine boyanır (teller arasından ten görünmez) */
        function buzzTint(col, style) {
            var D = style === 2 || style == null ? G.ADO3D_BUZZ : (G.ADO3D_SCALP && G.ADO3D_SCALP[style]); if (!D || !D.b) return null;
            var mk = 'm' + (style == null ? 2 : style); if (!BUZZ[mk]) { var bin = atob(D.b), a = new Uint8Array(bin.length), j; for (j = 0; j < bin.length; j++) a[j] = bin.charCodeAt(j); BUZZ[mk] = a; }
            var key = mk + css(col); if (BUZZ.c[key]) return BUZZ.c[key];
            var c = mkCanvas(D.w, D.h), cg = c.getContext('2d'), im = cg.createImageData(D.w, D.h), d = im.data, r = Math.round(clamp(col[0], 0, 1) * 255), gg = Math.round(clamp(col[1], 0, 1) * 255), b = Math.round(clamp(col[2], 0, 1) * 255), k;
            var MM = BUZZ[mk], aa = D.a || .94; for (k = 0; k < D.w * D.h; k++) { d[k * 4] = r; d[k * 4 + 1] = gg; d[k * 4 + 2] = b; d[k * 4 + 3] = Math.round(MM[k] * aa); }
            cg.putImageData(im, 0, 0); return (BUZZ.c[key] = c);
        }
        function paintLayer(g, N, info) {
            var Ny = function (V) { return N * (.005 + .49 * V); }, NyF = function (vf) { return N * (.51 + .48 * vf); }, k;
            g.clearRect(0, 0, N, N);
            /* --- forma gövdesi --- */
            var c1 = info.c1, c2 = info.c2, pat = info.pat, top = Ny(1) + 2;
            g.fillStyle = css(c1); g.fillRect(0, 0, N, top);
            g.fillStyle = css(c2);
            if (pat === 1) { for (k = 0; k < 16; k += 2) g.fillRect(k * N / 16, 0, N / 16, top); }                                  // dikey çubuklar
            else if (pat === 2) { for (k = 0; k < 9; k += 2) g.fillRect(0, Ny(k / 9), N, Ny(1 / 9) - Ny(0)); }                        // yatay çemberler
            else if (pat === 3) { g.fillRect(N * .25, 0, N * .5, top); }                                                             // yarım-yarım (oyuncunun solu)
            else if (pat === 4) {                                                                                                  // çapraz kuşak (önde ve arkada)
                [[.25, 1], [.75, -1]].forEach(function (q) { g.beginPath(); var cx = q[0] * N, w = .10 * N, d = q[1] * .14 * N; g.moveTo(cx - w - d, Ny(.95)); g.lineTo(cx + w - d, Ny(.95)); g.lineTo(cx + w + d, Ny(.12)); g.lineTo(cx - w + d, Ny(.12)); g.closePath(); g.fill(); });
            }
            else if (pat === 5) { for (k = 0; k < 40; k++) g.fillRect(k * N / 40, 0, Math.max(1, N / 300), top); }                     // ince çizgiler
            else if (pat === 6) { g.fillRect(N * -.04, 0, N * .08, top); g.fillRect(N * .96, 0, N * .08, top); g.fillRect(N * .46, 0, N * .08, top); }   // yan paneller
            else if (pat === 7) { g.fillRect(0, Ny(.60), N, Ny(.72) - Ny(.60)); }                                                   // göğüs bandı
            // omuz/yaka çevresi ince şerit (trim) - üst kenar
            g.fillStyle = css(info.trim); g.globalAlpha = .9; g.fillRect(0, Ny(.975), N, top - Ny(.975)); g.globalAlpha = 1;
            // metin çizimi: dokuda satır yukarı = vücutta yukarı -> dikey çevrilmiş; yatay/dikey piksel ölçeği farkı (çevre ~0.9 m / boy 0.78 m) düzeltilir
            var HX = 1.77;
            function txt(str, u, V, hV, color, outline, maxW) {
                if (!str) return; var px = Ny(hV) - Ny(0), fs = Math.max(6, px / .72);
                g.save(); g.translate(u * N, Ny(V)); g.font = '800 ' + fs.toFixed(1) + 'px "Arial Narrow", "Roboto Condensed", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
                var w = g.measureText(str).width * HX, sx = HX; if (maxW && w > maxW * N) sx *= maxW * N / w;
                g.scale(sx, -1);
                if (outline) { g.lineJoin = 'round'; g.lineWidth = Math.max(1.5, fs * .09); g.strokeStyle = css(outline); g.strokeText(str, 0, 0); }
                g.fillStyle = css(color); g.fillText(str, 0, 0); g.restore();
            }
            var ink = info.ink, ol = info.pat ? info.inkO : null;
            if (info.num) {
                if (info.pat === 1 || info.pat === 2 || info.pat === 5) { g.fillStyle = css(c1); g.globalAlpha = .92; g.fillRect(N * (.75 - .085), Ny(.40), N * .17, Ny(.73) - Ny(.40)); g.globalAlpha = 1; }   // çizgili sırtlarda numara paneli
                txt(String(info.num), .75, .565, .30, ink, ol, .16);
                txt(String(info.num), .25, .655, .085, ink, ol, .07);
            }
            if (info.name) txt(info.name, .75, .80, .055, ink, ol, .30);
            if (info.crest) {                                                          // kurgusal arma: kalkan + takım baş harfi (oyuncunun sol göğsü: u ≈ .31)
                var cu = (G.ADO3D_MESHY && G.ADO3D_MESHY_ON !== false ? .318 : .352) * N, cy = Ny(.745), cw = .024 * N, ch = Ny(.064) - Ny(0);
                g.beginPath(); g.moveTo(cu - cw, cy + ch); g.lineTo(cu + cw, cy + ch); g.lineTo(cu + cw, cy - ch * .2); g.quadraticCurveTo(cu + cw, cy - ch * .8, cu, cy - ch); g.quadraticCurveTo(cu - cw, cy - ch * .8, cu - cw, cy - ch * .2); g.closePath();
                g.fillStyle = css(info.trim); g.fill(); g.lineWidth = Math.max(1, N / 260); g.strokeStyle = css(c2); g.stroke();
                g.save(); g.translate(cu, cy + ch * .08); g.scale(HX * .5, -1); g.font = '900 ' + (ch * 1.05).toFixed(1) + 'px Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = css(c1); g.fillText(info.crest, 0, 0); g.restore();
            }
            /* --- yüz (alt yarı, saydam zemin = ten rengi değişmez). Gözler artık GERÇEK geometri (göz küresi + kapak yarığı); burada
               yalnızca kirpik çizgisi, kaşlar (saç renginde), dudak rengi, göz altı/yanak ton farkı, kirli sakal/sakal ve saç dibi
               geçişi boyanır. Konumlar kafa SDF'sindeki anatomik noktalardan (kafa-yerel x,y,z) doğrudan dokuya izdüşürülür. --- */
            if (info.face) {
                var F = info.face, MESHYF = !!(G.ADO3D_MESHY && G.ADO3D_MESHY_ON !== false && SKN && BODY_MESH[1] && BODY_MESH[1].meshy);   // Meshy yüzü: göz/kaş/dudak/ton boyaları modelin kendi yüz dokusundan gelir; yalnız sakal ve saç dibi boyanır
                function P3(x, y, z) { var r = Math.sqrt(x * x + y * y + z * z) || 1; return [faceU(Math.atan2(x, z)) * N, NyF(faceV(y / r))]; }
                function poly(pts, col, a) { g.globalAlpha = a; g.fillStyle = css(col); g.beginPath(); pts.forEach(function (q, i2) { var c = P3(q[0], q[1], q[2]); if (i2) g.lineTo(c[0], c[1]); else g.moveTo(c[0], c[1]); }); g.closePath(); g.fill(); g.globalAlpha = 1; }
                function blob(x, y, z, rx, ry, col, a) { var c = P3(x, y, z), cx2 = P3(x + rx, y, z), cy2 = P3(x, y + ry, z); g.globalAlpha = a; g.fillStyle = css(col); g.beginPath(); g.ellipse(c[0], c[1], Math.max(.6, Math.abs(cx2[0] - c[0])), Math.max(.6, Math.abs(cy2[1] - c[1])), 0, 0, 7); g.fill(); g.globalAlpha = 1; }
                function strokeArc(pts, w, col, a) { g.globalAlpha = a; g.strokeStyle = css(col); g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = w; g.beginPath(); pts.forEach(function (q, i2) { var c = P3(q[0], q[1], q[2]); if (i2) g.lineTo(c[0], c[1]); else g.moveTo(c[0], c[1]); }); g.stroke(); g.globalAlpha = 1; }
                var px1 = N / 512;                                                    // 512 dokuda 1 birim
                var vqC = VQ.face ? clamp(lum(F.skin) - lum(F.hair), 0, .6) : 0, rndF = rngf(F.seed || 7);
                function relS(m) { return [clamp(F.skin[0] * m[0], 0, 1), clamp(F.skin[1] * m[1], 0, 1), clamp(F.skin[2] * m[2], 0, 1)]; }
                function stubblePat(col, n) {                                      // [vq] kıl noktası deseni (renk + doku boyuna göre önbellekli 64 px döşeme)
                    var key = css(col) + '@' + n, pc = (KIT.sp = KIT.sp || {});
                    if (!pc[key]) { var tw = Math.max(16, Math.round(64 * n / 512)), tc = mkCanvas(tw, tw), tg = tc.getContext('2d'), rr = rngf(5150), k6; tg.fillStyle = css(col);
                        for (k6 = 0; k6 < tw * tw * .30; k6++) { tg.globalAlpha = .25 + rr() * .55; var s6 = (.6 + rr() * .7) * n / 512; tg.fillRect(rr() * tw, rr() * tw, s6, s6 * (1 + rr())); }
                        pc[key] = g.createPattern(tc, 'repeat'); }
                    return pc[key];
                }
                function rgbaS(c, a) { return 'rgba(' + Math.round(clamp(c[0], 0, 1) * 255) + ',' + Math.round(clamp(c[1], 0, 1) * 255) + ',' + Math.round(clamp(c[2], 0, 1) * 255) + ',' + a.toFixed(3) + ')'; }
                function softBlob(x, y, z, rx, ry, col, a) {                         // [vq] yumuşak kenarlı elips (radyal geçiş - süzgeç yok)
                    var c = P3(x, y, z), cx2 = P3(x + rx, y, z), cy2 = P3(x, y + ry, z), ex = Math.max(.6, Math.abs(cx2[0] - c[0])), ey = Math.max(.6, Math.abs(cy2[1] - c[1]));
                    g.save(); g.translate(c[0], c[1]); g.scale(ex, ey); var gr = g.createRadialGradient(0, 0, 0, 0, 0, 1.5); gr.addColorStop(0, rgbaS(col, a)); gr.addColorStop(.5, rgbaS(col, a * .72)); gr.addColorStop(1, rgbaS(col, 0));
                    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1.5, 0, 7); g.fill(); g.restore();
                }
                if (VQ.face && !MESHYF) {                                             // [vq] ten tonu çeşitliliği: tene göre bağıl, yumuşak kenarlı
                    softBlob(0, .052, .088, .046, .024, relS([1.06, 1.05, 1.03]), .32);  // alın: hafif açık
                    softBlob(0, -.036, .108, .011, .016, relS([1.07, .88, .85]), .32);   // burun ucu: kanlı
                    softBlob(0, -.106, .080, .040, .016, relS([.86, .84, .86]), .24);    // çene altı: hafif koyu
                    [-1, 1].forEach(function (sg) {
                        softBlob(sg * .047, -.030, .074, .022, .019, relS([1.08, .85, .83]), .30);   // yanak kanı
                        softBlob(sg * .031, .001, .083, .019, .012, relS([.80, .75, .78]), .30);    // göz çukuru / göz altı
                        softBlob(sg * .080, -.010, .005, .010, .026, relS([1.06, .82, .80]), .38);   // kulak
                        softBlob(sg * .013, .002, .093, .006, .010, relS([.72, .66, .68]), .30);     // göz iç köşesi (burun kökü yanı) çukuru
                        strokeArc([[sg * .019, .0128, .088], [sg * .031, .0150, .0875], [sg * .043, .0128, .084]], 2.4 * px1, relS([.66, .58, .58]), .30);   // üst göz kapağı kıvrımı
                        strokeArc([[sg * .0135, -.044, .099], [sg * .0215, -.058, .095], [sg * .0245, -.071, .090]], 3.4 * px1, relS([.78, .70, .70]), .24);  // burun-dudak çizgisi
                        softBlob(sg * .026, -.0715, .092, .004, .004, relS([.62, .52, .52]), .40);   // ağız köşesi
                    });
                    softBlob(0, -.0855, .097, .016, .005, relS([.76, .70, .70]), .30);                // alt dudak altı gölgesi
                    softBlob(0, -.0565, .1035, .004, .006, relS([.86, .80, .80]), .25);               // üst dudak oluğu (filtrum)
                }
                if (F.beard && VQ.face) {                                             // [vq] sakal: yumuşak taban + nokta nokta kıl (opaklık ten-saç kontrastına göre)
                    var bpts = [[-.066, -.045, .040], [-.050, -.040, .074], [-.022, -.056, .094], [0, -.058, .099], [.022, -.056, .094], [.050, -.040, .074], [.066, -.045, .040], [.058, -.090, .010], [.030, -.112, .050], [0, -.120, .072], [-.030, -.112, .050], [-.058, -.090, .010]];
                    var full = F.beard > .5, ba = full ? F.beard * (.62 + .55 * vqC) : F.beard * (.30 + .75 * vqC);
                    var bsF = full ? 6 : 8, bW = Math.max(8, Math.round(N / bsF)), bo = (KIT.bc = KIT.bc || {})[bW] || (KIT.bc[bW] = mkCanvas(bW, bW)), bg = bo.getContext('2d');   // yumuşak kenar: düşük çözünürlükte çiz, iki doğrusal büyüt
                    bg.clearRect(0, 0, bW, bW); bg.fillStyle = css(F.hair); bg.beginPath(); bpts.forEach(function (q, i2) { var c = P3(q[0], q[1], q[2]); if (i2) bg.lineTo(c[0] * bW / N, c[1] * bW / N); else bg.moveTo(c[0] * bW / N, c[1] * bW / N); }); bg.closePath(); bg.fill();
                    g.globalAlpha = ba; g.imageSmoothingEnabled = true; g.drawImage(bo, 0, 0, N, N); g.globalAlpha = 1;
                    if (!full) { bg.globalCompositeOperation = 'source-in'; bg.fillStyle = css(relS([.62, .64, .70])); bg.fillRect(0, 0, bW, bW); bg.globalCompositeOperation = 'source-over'; g.globalAlpha = .22; g.drawImage(bo, 0, 0, N, N); g.globalAlpha = 1; }   // kirli sakal: deri altı kıl gölgesi (ten tonunda mavimsi-gri)
                    softBlob(0, -.0715, .095, .024, .010, F.skin, Math.min(.8, F.beard * 1.2));   // dudak çevresi açık
                    g.save(); g.beginPath(); bpts.forEach(function (q, i2) { var c = P3(q[0], q[1], q[2]); if (i2) g.lineTo(c[0], c[1]); else g.moveTo(c[0], c[1]); }); g.closePath(); g.clip();
                    var b0 = P3(-.07, -.03, .05), b1 = P3(.07, -.125, .05), bx0 = Math.min(b0[0], b1[0]), bx1 = Math.max(b0[0], b1[0]), by0 = Math.min(b0[1], b1[1]), by1 = Math.max(b0[1], b1[1]);
                    g.globalAlpha = (full ? .8 : .42) * (.4 + vqC); g.fillStyle = stubblePat(F.hair, N); g.fillRect(bx0, by0, bx1 - bx0, by1 - by0);   // tek dolgu: önceden üretilmiş kıl deseni
                    g.globalAlpha = 1; g.restore();
                }
                else if (F.beard) {                                                        // sakal: çene hattı + yanaklar, ağız ve burun altı açık
                    poly([[-.066, -.045, .040], [-.050, -.040, .074], [-.022, -.056, .094], [0, -.058, .099], [.022, -.056, .094], [.050, -.040, .074], [.066, -.045, .040], [.058, -.090, .010], [.030, -.112, .050], [0, -.120, .072], [-.030, -.112, .050], [-.058, -.090, .010]], F.hair, F.beard);
                    blob(0, -.0715, .095, .027, .012, F.skin, Math.min(.9, F.beard * 1.4));   // dudak çevresi
                }
                if (!MESHYF) [-1, 1].forEach(function (sg) {
                    var ex = sg * .0315, pts = [], k4;
                    for (k4 = 0; k4 <= 10; k4++) { var tt = -1 + 2 * k4 / 10, dx = tt * .0164, yy = .0045 + .0067 * Math.sqrt(Math.max(0, 1 - tt * tt)) * (1 - .15 * sg * tt); pts.push([ex + dx, yy, .0835]); }
                    strokeArc(pts, 2.2 * px1, [.07, .05, .045], .85);                 // üst kirpik çizgisi
                    var low = []; for (k4 = 0; k4 <= 8; k4++) { var t2 = -1 + 2 * k4 / 8; low.push([ex + t2 * .015, .0045 - .0058 * Math.sqrt(Math.max(0, 1 - t2 * t2)), .0835]); }
                    strokeArc(low, 1.2 * px1, [.22, .14, .12], .45);                  // alt kirpik
                    if (!VQ.face) blob(ex, -.0085, .080, .014, .0045, [.35, .22, .22], .09);         // göz altı hafif koyuluk ([vq] açıkken tene bağıl, yukarıda)
                    var br = []; for (k4 = 0; k4 <= 8; k4++) { var t3 = k4 / 8; br.push([sg * (.010 + .040 * t3), .0215 + .0065 * Math.sin(Math.PI * Math.min(1, t3 * 1.15)) - .002 * t3, .093 - .015 * t3 * t3]); }
                    if (VQ.face) {                                                    // [vq] kaş: yumuşak taban + kaşın yönünde ince tel vuruşları
                        strokeArc(br, 6.0 * px1, F.hair, .22); strokeArc(br, 4.2 * px1, F.hair, .30);
                        g.globalAlpha = .62; g.strokeStyle = css(F.hair); g.lineCap = 'round'; g.lineWidth = 1.3 * px1; g.beginPath();      // tek yol: 14 tel
                        for (var kb = 0; kb < 14; kb++) { var tb = kb / 13, qb = br[Math.min(8, Math.round(tb * 8))], qb2 = br[Math.min(8, Math.round(tb * 8) + 1)] || qb, jy = (rndF() - .5) * .003, pa = P3(qb[0], qb[1] + jy - .0018, qb[2]), pb2 = P3(qb2[0], qb2[1] + jy + .0012, qb2[2]);
                            g.moveTo(pa[0], pa[1]); g.lineTo(pb2[0], pb2[1]); }
                        g.stroke(); g.globalAlpha = 1;
                    }
                    else strokeArc(br, (5.2 - 1.8 * 0) * px1, F.hair, .80);               // kaş
                    if (!VQ.face) blob(sg * .050, -.030, .072, .020, .016, [.80, .38, .34], .10);    // yanak kanı
                    blob(sg * .0072, -.0488, .1035, .0032, .0020, [.22, .12, .10], .40);   // burun deliği gölgesi
                });
                if (!MESHYF) poly([[-.0235, -.0703, .095], [-.012, -.0625, .099], [0, -.0612, .1005], [.012, -.0625, .099], [.0235, -.0703, .095], [.012, -.0705, .1], [0, -.0703, .1015], [-.012, -.0705, .1]], F.lip, .55);   // üst dudak
                if (!MESHYF) poly([[-.021, -.0712, .095], [-.010, -.0715, .099], [0, -.0715, .1], [.010, -.0715, .099], [.021, -.0712, .095], [.012, -.0805, .097], [0, -.0825, .098], [-.012, -.0805, .097]], F.lip, .45);   // alt dudak
                if (!MESHYF) strokeArc([[-.024, -.0708, .094], [-.010, -.0712, .1], [0, -.0706, .1015], [.010, -.0712, .1], [.024, -.0708, .094]], 1.4 * px1, [.30, .14, .12], .65);   // ağız çizgisi
                var BZ = MESHYF && (F.hs === 2 || (G.ADO3D_SCALP && G.ADO3D_SCALP[F.hs])) ? buzzTint(F.hair, F.hs) : null;
                if (BZ) { g.globalAlpha = 1; g.drawImage(BZ, 0, NyF(0), N, NyF(1) - NyF(0)); }          // [buzz] buzz fade boyası
                if (F.hairline && !BZ) {                                                     // saç dibi: saç çizgisinin hemen altında yumuşak saç rengi geçişi
                    for (var hx = 0, hst = Math.max(1, N / 128); hx <= N; hx += hst) { var th5 = (function (u) { var t = 2 * u - 1; return Math.PI * t * (.45 + .55 * t * t); })(hx / N), s5 = hairlineS(th5, F.nape); var y5 = NyF(faceV(s5)) + (VQ.face ? (Math.sin(hx * .37) * .5 + Math.sin(hx * 1.13 + 1.7) * .3 + (rndF() - .5) * .6) * N * .006 : 0);   /* [vq] düzensiz saç dibi */ var gr5 = g.createLinearGradient(0, y5 - N * .03, 0, y5 + N * .004); gr5.addColorStop(0, 'rgba(0,0,0,0)'); gr5.addColorStop(1, css(F.hair)); g.globalAlpha = F.hairline; g.fillStyle = gr5; g.fillRect(hx, y5 - N * .03, hst, N * .034); }     /* [vq] sütunlar uç uca (üst üste binmez: barkod çizgisi yok) */
                    g.globalAlpha = 1;
                }
            }
        }
        function kitPaintAll(players, look) {
            if (!SKN || !G.document) return;
            var N = Q.name === 'high' ? 512 : 256, L = players.length + 3;      // [v187] +2: top görevlisi yeleği, çıkan oyuncu
            if (!kitEnsure(N, L)) return;
            var LB = VQ.face ? L : 1, cv2 = KIT.cv && KIT.cv.width === N && KIT.cv.height === N * LB ? KIT.cv : (KIT.cv = mkCanvas(N, N * LB)), g = cv2.getContext('2d'), nums = shirtNumbers(players), names = KIT.names || [];   // [vq] LB > 1: tüm katmanlar alt alta
            var pats = [teamPattern(names[0], S.team[0]), teamPattern(names[1], S.team[1])];
            if (S.kitX) for (var kq = 0; kq < 2; kq++) if (S.kitX[kq] && S.kitX[kq].p3 != null) pats[kq] = S.kitX[kq].p3 | 0;      // [v160] sezonluk forma deseni
            gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D_ARRAY, KIT.tex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            for (var i = 0; i <= players.length + 2; i++) {
                if (i > players.length) { var xinf = v7KitInfo(i - players.length); if (LB > 1) { g.setTransform(1, 0, 0, 1, 0, i * N); g.save(); g.beginPath(); g.rect(0, 0, N, N); g.clip(); } paintLayer(g, N, xinf); if (LB > 1) g.restore(); else gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, N, N, 1, gl.RGBA, gl.UNSIGNED_BYTE, cv2); continue; }      // [v187]
                var ref = i === players.length, p = ref ? null : players[i], pv = ref ? S.refPal : S.pal[i], isGK = !ref && p.role === 'GK';
                var c1 = [pv[0], pv[1], pv[2]], trim = [pv[21], pv[22], pv[23]], h = hash(ref ? 'hakem' : (p.name || ('p' + i)));
                var c2 = ref || isGK ? mixc(c1, [0, 0, 0], .25) : trim, pat = ref ? 0 : isGK ? 7 : pats[p.team ? 1 : 0];
                var ink = lum(c1) < .45 ? [.97, .97, .97] : [.07, .07, .09], inkO = lum(ink) > .5 ? mixc(c1, [0, 0, 0], .55) : mixc(c1, [1, 1, 1], .6);
                var hairC = [pv[12], pv[13], pv[14]], skinC = [pv[9], pv[10], pv[11]];
                var info = { c1: c1, c2: c2, trim: trim, pat: pat, ink: ink, inkO: inkO, num: ref ? 0 : nums[i], name: ref ? '' : surnameOf(p.name), crest: ref ? '' : (String(names[p.team ? 1 : 0] || '').trim().charAt(0).toLocaleUpperCase('tr-TR') || ''),
                    face: { hair: mixc(hairC, [0, 0, 0], .15), skin: skinC, lip: mixc(skinC, [.55, .22, .22], .45), beard: ref ? 0 : [0, .30, .62][S.beard ? S.beard[i] | 0 : 0],      // sakal dokusu: yok / kirli sakal / sakal (tam sakalda geometri de var)
                        hairline: ref ? .18 : !S.hair ? .18 : S.hair[i] === 3 ? 0 : S.hair[i] === 2 ? .34 : VQ.face ? .28 : .18, seed: h, hs: ref ? -1 : (S.hair ? S.hair[i] | 0 : -1), nape: ref ? -.5 : (S.hair && S.hair[i] === 0 ? -.66 : S.hair && S.hair[i] === 5 ? -.60 : -.5) } };
                if (LB > 1) { g.setTransform(1, 0, 0, 1, 0, i * N); g.save(); g.beginPath(); g.rect(0, 0, N, N); g.clip(); }
                paintLayer(g, N, info);
                if (LB > 1) g.restore(); else gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, N, N, 1, gl.RGBA, gl.UNSIGNED_BYTE, cv2);
            }
            if (LB > 1) { g.setTransform(1, 0, 0, 1, 0, 0); gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, 0, N, N, L, gl.RGBA, gl.UNSIGNED_BYTE, cv2); KIT.cv = null; }   // [vq] tek yükleme
            gl.generateMipmap(gl.TEXTURE_2D_ARRAY); gl.activeTexture(gl.TEXTURE0);
            KIT.players = players; KIT.refLayer = players.length;
        }
        R._kitInfo = function () { return KIT.ok ? { size: KIT.size, layers: KIT.n, numbers: KIT.players ? shirtNumbers(KIT.players) : null } : null; };
        /* [opt] çizim durumu nesnesi: TÜM alanlar baştan, hep aynı sırayla - 23 aktör tek gizli sınıfı paylaşır (V8'de tek biçimli erişim;
           ondalık alanlar yerinde güncellenir, okuma/yazmada kutulanmış sayı üretilmez - eskiden alanlar sonradan farklı sırayla eklendiği için
           erişimler çok biçimliydi ve kare başına ~30 KB geçici bellek doğuyordu). Boş konum/saat alanı NaN (denetim: '> -1e9'). */
        function mkAct(ph, hs, ws, vary) {
            return { px: NaN, pz: NaN, ph: ph, spd: 0, yaw: 0, kickT: -9, celeb: 0, ax: 0, hScale: hs, wScale: ws, vary: vary, pkv: null, pkh: 0, pkw: 0,
                accS: 0, carryK: 0, takeonK: 0, latV: 0, lonV: 0, yawR: 0, stSide: null, stanceB: 0, stT: 0, idleT: 0, hipsK: 0, look: 0,
                dX: 0, dZ: 0, dYaw: 0, rY: 0, gkC: NaN, readyK: 0, holdK: 0, needHand: false, acW: 0, gW: 0, gDt: 0, gX: NaN, gZ: NaN, gWp: 0, gSp: NaN,
                cP: null, acP: null, ac: null, hR: null, hL: null, rOx: 0, rOz: 0,
                kickKind: null, kickDur: 0, kickCf: 0, kickLg0: 0, kickLg1: 0, kickKn0: 0, kickArm: 0, kickTorso: 0, kickFoot: null,
                ok: 0, vM: 0, vS: 0, sN: 0, sF: 0, dS: 1, dW: 1, mK: 0, mC: 0, rM: null, dqc: null,
                spX: 0, spZ: 0, uX: 0, uZ: 0, uOk: 0, gaW: 0, gaP: 0, gaC: 0, gaD: 0, gaRX: 0, gaRZ: 0, gaRT: -1, kickC: 0 };      // [v133] sayisal alanlar bastan (kutulanmis sayi tahsisi yok)
        }
        R.setMatch = function (o) {
            S.team = [hex2rgb(o.cols[0]), hex2rgb(o.cols[1])];
            S.kitX = o.kits && o.kits.length === 2 ? o.kits : null;      // [v160] sezonluk forma: desen, şort, tozluk, garnitür (yoksa eski davranış)
            var cand = [[.2, .82, .36], [1, .62, .12], [1, .36, .66], [.72, .95, .1], [.66, .4, 1], [.15, .8, .9]], best = cand[0], bd = -1;
            cand.forEach(function (c) { var d = Math.min(dist3(c, S.team[0]), dist3(c, S.team[1])); if (d > bd) { bd = d; best = c; } });
            S.gkc = best;
            // deplasman kalecisi: ev sahibi kalecisinden de AYRIŞAN ikinci renk (gerçek maçta iki kaleci aynı renk giymez)
            var best2 = null, bd2 = -1; cand.forEach(function (c) { if (c === best) return; var d = Math.min(dist3(c, S.team[0]), dist3(c, S.team[1]), dist3(c, best) * 1.2); if (d > bd2) { bd2 = d; best2 = c; } });
            S.gkc2 = best2 || best;
            var look = buildLook(o.players);
            S.pal = look.pal; S.n = o.players.length; S.roles = look.roles; S.hw = look.hw; S.hair = look.hair; S.beard = look.beard; S.ft = look.ft;
            S.refPal = new Float32Array(SLOT_N * 3); [[.05, .05, .06], [.05, .05, .06], [.05, .05, .06], SKIN[1], HAIR[0], [.05, .05, .06], SKIN[1], [.78, .95, .24], [.07, .07, .08], [.05, .05, .06], [.24, .14, .06], mixc(SKIN[1], [.62, .28, .27], .3)].forEach(function (c, k) { S.refPal[k * 3] = c[0]; S.refPal[k * 3 + 1] = c[1]; S.refPal[k * 3 + 2] = c[2]; });
            freeScenery(); TRACK = SCRES; SC = buildScenery(o.cols); TRACK = null;
            KIT.names = o.names || []; try { kitPaintAll(o.players, look); } catch (e) { KIT.ok = false; }
            S.st = []; for (var i = 0; i < o.players.length; i++) S.st.push(mkAct(hash(i) % 6, S.hw[i].hScale, S.hw[i].wScale, (hash('v' + i + (o.players[i].name || '')) % 1000) / 1000));   // [opt] tek gizli sınıf
            S.ref = mkAct(0, .97, .97, .62);
            S.ball = { px: NaN, py: 0, pz: NaN, qx: 0, qy: 0, qz: 0, qw: 1, sp: 0 };
            S.cam = null; S.lastT = 0;
        };
        // Hafif görünüm-yenileme: kullanıcı Futbolcu Veritabanı ekranından boy/kilo/ten rengini değiştirip kaydettiğinde
        // çağrılır. R.setMatch'in TERSİNE sahneyi yeniden kurmaz, kamerayı SIFIRLAMAZ, oyuncu konumlarını/pozunu
        // bozmaz - yalnızca palet + boy/yapı ölçeğini (S.pal/S.hw/S.st[i].hScale-wScale) günceller. Maç devam
        // ederken bile fark edilmeden (kamera sıçraması/sahne titremesi olmadan) uygulanır.
        R.refreshAppearance = function (players) {
            if (!S.st || !players || !players.length) return false;
            var look = buildLook(players), n = Math.min(players.length, S.st.length);
            for (var i = 0; i < n; i++) {
                S.pal[i] = look.pal[i]; S.roles[i] = look.roles[i]; S.hw[i] = look.hw[i]; S.hair[i] = look.hair[i]; S.beard[i] = look.beard[i]; S.ft[i] = look.ft[i];
                S.st[i].hScale = look.hw[i].hScale; S.st[i].wScale = look.hw[i].wScale;
            }
            try { kitPaintAll(players, look); } catch (e) { KIT.ok = false; }
            return true;
        };
        var refresh7_ = R.refreshAppearance;      // [v187] değişiklik: yuva, sahne başlayana dek çıkan oyuncunun görünümünde kalır
        R.refreshAppearance = function (players) {
            if (S.v7hold && players && KIT.players) { players = players.slice(); for (var k7 in S.v7hold) { var i7 = +k7; if (players[i7] && KIT.players[i7]) { (S.v7pend || (S.v7pend = {}))[i7] = players[i7]; players[i7] = KIT.players[i7]; } } }
            return refresh7_(players);
        };
        R.subHold = function (id, on) {
            S.v7hold = S.v7hold || {}; if (on) { S.v7hold[id] = 1; return true; }
            delete S.v7hold[id]; var np = S.v7pend && S.v7pend[id]; if (np && KIT.players) { var pl = KIT.players.slice(); pl[id] = np; delete S.v7pend[id]; refresh7_(pl); } return true;
        };
        function dist3(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]); }

        /* ----- kamera ----- */
        var VP = m4(), VIEW = m4(), PROJ = m4(), FOVY = 34 * Math.PI / 180, eye = [0, 30, 90], asp = 1.6, curFov = FOVY, CAM_FD = 60, CAM_AX = 52.5, CAM_AZ = 34;   // [vq] CAM_FD: gözün baktığı noktaya uzaklık · CAM_AX/AZ: o nokta (yakın gölge kademesi merkezi)

        /* ----- gölge haritası (yönlü ışık, top/oyuncular etrafında sabitlenmiş ortografik pencere) ----- */
        /* görüntü kalitesi ön ayarları (Düşük / Orta / Yüksek). Oyunun kaydı/simülasyonu ETKİLENMEZ - yalnızca çizim maliyeti:
           recv = oyuncular gölge ALIR, pcf = yumuşak (8 örnek) gölge kenarı, lodPx = yakın-çekim ağına geçiş eşiği (ekrandaki oyuncu boyu),
           shadow = gölge haritası çözünürlüğü, bloom = parlak ışık hâlesi, dpr = piksel yoğunluğu üst sınırı (ado2d uygular). */
        var QUALITY = {
            low: { name: 'low', recv: false, pcf: false, lodPx: 1e9, shadow: 1024, bloom: false, dpr: 1, noShadow: true },     // [opt] noShadow: derinlik geçişi yok (blob gölge)
            mid: { name: 'mid', recv: true, pcf: false, lodPx: 170, shadow: 1536, bloom: false, dpr: 1.5 },
            high: { name: 'high', recv: true, pcf: true, lodPx: 110, shadow: 2048, bloom: true, dpr: 2 }
        };
        var Q = QUALITY[cfg.quality] || QUALITY.mid;
        var SHADOW_SIZE = (cfg.shadowSize || Q.shadow), shadowOK = false, shadowFB = null, shadowTex = null, SH_ALLOC = 0;
        var LVIEW = m4(), LPROJ = m4(), LVP = m4(), shadowHalf = 22;
        /* [vq] iki kademe: LVP = uzak (görüş alanı), LVPN = yakın; LVPC: o an çizilen kademe (ağaç yolu). Atlas genişliği 2S - desteklenmiyorsa tek kademe */
        var CSM = !!(VQ.sh && VQ.csm && pDepth && (gl.getParameter(gl.MAX_TEXTURE_SIZE) || 0) >= 2 * Math.max(SHADOW_SIZE, QUALITY.high.shadow));
        var LVPN = m4(), LVPC = LVP, SHN = CSM ? 2 : 1, SHX = CSM ? 2 : 1, SHA = new Float32Array(CSM ? [.5, 0, .5, .5] : [1, 0, 1, 0]), SHWN = 44;
        /* [opt] gölge atlası: düşük kalitede (noShadow) ayrılmaz - 4x4 karşılaştırmalı kukla doku (örnekleyici geçerli kalır), FBO yok;
           kalite yükselince shadowAlloc ile kurulur, düşüğe inince shadowFree ile bırakılır */
        function shadowDummy() {
            try {
                if (!shadowTex) shadowTex = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, shadowTex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, 4, 4, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
            } catch (e2) { shadowTex = null; }
        }
        function shadowFree() { if (shadowFB) { try { gl.deleteFramebuffer(shadowFB); } catch (e) { } shadowFB = null; } shadowOK = false; shadowDummy(); }
        function shadowAlloc() {
            if (!pDepth) return;
            try {
                if (!shadowTex) shadowTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, shadowTex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT24, SHADOW_SIZE * SHX, SHADOW_SIZE, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
                if (!shadowFB) shadowFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB);
                gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shadowTex, 0);
                gl.drawBuffers([gl.NONE]); gl.readBuffer(gl.NONE);
                var st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
                gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                shadowOK = (st === gl.FRAMEBUFFER_COMPLETE); SH_ALLOC = shadowOK ? SHADOW_SIZE : 0;
            } catch (e) { shadowOK = false; }
            if (!shadowOK) shadowFree();                                      // her ihtimale karşı: 4x4 karşılaştırma modlu kukla doku (sampler2DShadow her zaman geçerli bir dokuya bağlı kalsın)
        }
        if (Q.noShadow || !pDepth) shadowDummy(); else shadowAlloc();
        var POST = null;
        postEnsure.prog = { br: progA(gl, VS_POST, FS_BRIGHT, ['aP'], PEND), bl: progA(gl, VS_POST, FS_BLUR, ['aP'], PEND), cp: progA(gl, VS_POST, FS_COMP, ['aP'], PEND) };   // [opt] arka planda derlenir
        function postFree() { if (!POST) return; try { [POST.msFB, POST.rFB, POST.aFB, POST.bFB].forEach(function (f) { if (f) gl.deleteFramebuffer(f); }); [POST.msC, POST.msD].forEach(function (r) { if (r) gl.deleteRenderbuffer(r); }); [POST.rT, POST.aT, POST.bT].forEach(function (t) { if (t) gl.deleteTexture(t); }); } catch (e) { } POST = null; }
        function postEnsure() {
            if (!Q.bloom) { if (POST) postFree(); return null; }
            var w = cv.width, h = cv.height; if (POST && POST.w === w && POST.h === h) return POST.ok ? POST : null;
            postFree(); POST = { w: w, h: h, ok: false };
            try {
                if (!postEnsure.prog) postEnsure.prog = { br: program(gl, VS_POST, FS_BRIGHT, ['aP']), bl: program(gl, VS_POST, FS_BLUR, ['aP']), cp: program(gl, VS_POST, FS_COMP, ['aP']) };
                var samples = Math.min(4, gl.getParameter(gl.MAX_SAMPLES) || 0);
                function rt(tw, th) { var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, tw, th, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); var f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); var ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE; return { t: t, f: f, ok: ok }; }
                POST.msFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, POST.msFB);
                POST.msC = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, POST.msC); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.RGBA8, w, h); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, POST.msC);
                POST.msD = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, POST.msD); gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, w, h); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, POST.msD);
                var okMs = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
                var qw = Math.max(1, w >> 2), qh = Math.max(1, h >> 2), R0 = rt(w, h), A0 = rt(qw, qh), B0 = rt(qw, qh);
                POST.rFB = R0.f; POST.rT = R0.t; POST.aFB = A0.f; POST.aT = A0.t; POST.bFB = B0.f; POST.bT = B0.t; POST.qw = qw; POST.qh = qh;
                gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                POST.ok = okMs && R0.ok && A0.ok && B0.ok && gl.getError() === gl.NO_ERROR;
            } catch (e) { POST.ok = false; gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
            return POST.ok ? POST : null;
        }
        function postFinish(P) {
            var pr = postEnsure.prog, w = P.w, h = P.h;
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, P.msFB); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, P.rFB); gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT, gl.NEAREST);
            gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null); gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
            gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.disable(gl.CULL_FACE); gl.depthMask(false); gl.bindVertexArray(skyVao); gl.activeTexture(gl.TEXTURE0);
            gl.bindFramebuffer(gl.FRAMEBUFFER, P.aFB); gl.viewport(0, 0, P.qw, P.qh); gl.useProgram(pr.br.p); gl.uniform1i(pr.br.u.uSrc, 0); gl.uniform2f(pr.br.u.uPx, 1 / w, 1 / h); gl.bindTexture(gl.TEXTURE_2D, P.rT); gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.useProgram(pr.bl.p); gl.uniform1i(pr.bl.u.uSrc, 0);
            for (var it = 0; it < 2; it++) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, P.bFB); gl.uniform2f(pr.bl.u.uDir, (1 + it) / P.qw, 0); gl.bindTexture(gl.TEXTURE_2D, P.aT); gl.drawArrays(gl.TRIANGLES, 0, 3);
                gl.bindFramebuffer(gl.FRAMEBUFFER, P.aFB); gl.uniform2f(pr.bl.u.uDir, 0, (1 + it) / P.qh); gl.bindTexture(gl.TEXTURE_2D, P.bT); gl.drawArrays(gl.TRIANGLES, 0, 3);
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h); gl.useProgram(pr.cp.p); gl.uniform1i(pr.cp.u.uSrc, 0); gl.uniform1i(pr.cp.u.uBloom, 3); gl.uniform1f(pr.cp.u.uInt, .9);
            gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, P.aT); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, P.rT); gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.depthMask(true);
        }
        R._post = function () { return { on: !!(POST && POST.ok), w: POST ? POST.w : 0 }; };
        R.setQuality = function (name) {
            var nq = QUALITY[name]; if (!nq) return false;
            Q = nq;
            if (!cfg.shadowSize) SHADOW_SIZE = Q.shadow;
            if (Q.noShadow) { if (shadowFB || shadowOK) shadowFree(); }                // [opt] düşük: atlas bırakılır
            else if (pDepth && (!shadowFB || SH_ALLOC !== SHADOW_SIZE)) shadowAlloc();  // [opt] orta/yüksek: atlas kurulur / boyutu değişir
            if (KIT.players) { try { kitPaintAll(KIT.players); } catch (e) { KIT.ok = false; } }
            return true;
        };
        R.quality = function () { return { name: Q.name, recv: Q.recv, pcf: Q.pcf, lodPx: Q.lodPx, shadow: SHADOW_SIZE, bloom: Q.bloom, dpr: Q.dpr }; };
        /* [vq] gölge penceresi kameranın zemindeki görüş alanına oturur: dört köşe ışını y=0 düzlemiyle kesilir (ufkun üstündekiler uzak yatay nokta),
           kenarlar örneklenip çim dikdörtgenine kırpılır, ışık uzayında (sabit LV0) sınır kutusu alınır (zemin + 2.2 m: oyuncu üstü de içeride).
           Boyut 4 m adımlı, merkez texel ızgarasına oturur - yayın kamerası kayarken gölge kenarı titremez. Derinlik aralığı sabit 120 m. */
        var LV0 = m4(), SFX = new Float64Array(4), SFZ = new Float64Array(4), SB = new Float64Array(4), SHW = { w: 44, h: 44 };
        (function () { var L = LIGHTS.ldir, D = 80; mlook(LV0, PW / 2 + L[0] * D, L[1] * D, PH / 2 + L[2] * D, PW / 2, 0, PH / 2); })();
        function shAcc(x, z) {
            x = x < PX0 - 2 ? PX0 - 2 : x > PX1 + 2 ? PX1 + 2 : x; z = z < PZ0 - 2 ? PZ0 - 2 : z > PZ1 + 2 ? PZ1 + 2 : z;
            var lx = LV0[0] * x + LV0[8] * z + LV0[12], ly = LV0[1] * x + LV0[9] * z + LV0[13], lx2 = lx + LV0[4] * 2.2, ly2 = ly + LV0[5] * 2.2;
            if (lx < SB[0]) SB[0] = lx; if (lx > SB[1]) SB[1] = lx; if (ly < SB[2]) SB[2] = ly; if (ly > SB[3]) SB[3] = ly;
            if (lx2 < SB[0]) SB[0] = lx2; if (lx2 > SB[1]) SB[1] = lx2; if (ly2 < SB[2]) SB[2] = ly2; if (ly2 > SB[3]) SB[3] = ly2;
        }
        function shFit() {
            var tY = Math.tan(curFov / 2), tX = tY * asp, fx = -VIEW[2], fy = -VIEW[6], fz = -VIEW[10], k, j;
            for (k = 0; k < 4; k++) {
                var sx = (k === 0 || k === 3) ? -1 : 1, sy = k < 2 ? -1 : 1;
                var dx = fx + VIEW[0] * tX * sx + VIEW[1] * tY * sy, dy = fy + VIEW[4] * tX * sx + VIEW[5] * tY * sy, dz = fz + VIEW[8] * tX * sx + VIEW[9] * tY * sy;
                var tt = dy < -1e-4 ? Math.min(-eye[1] / dy, 600) : 600 / Math.max(1e-3, Math.sqrt(dx * dx + dz * dz));
                SFX[k] = eye[0] + dx * tt; SFZ[k] = eye[2] + dz * tt;
            }
            SB[0] = 1e9; SB[1] = -1e9; SB[2] = 1e9; SB[3] = -1e9;
            for (k = 0; k < 4; k++) { var k2 = (k + 1) & 3; for (j = 0; j < 6; j++) { var u = j / 6; shAcc(SFX[k] + (SFX[k2] - SFX[k]) * u, SFZ[k] + (SFZ[k2] - SFZ[k]) * u); } }
            for (j = 0; j < 4; j++) {                                        // çim dikdörtgeninin görüş alanı içindeki köşeleri
                var cx = j & 1 ? PX1 + 2 : PX0 - 2, cz = j & 2 ? PZ1 + 2 : PZ0 - 2, pos = 0, neg = 0;
                for (k = 0; k < 4; k++) { var k3 = (k + 1) & 3, cr = (SFX[k3] - SFX[k]) * (cz - SFZ[k]) - (SFZ[k3] - SFZ[k]) * (cx - SFX[k]); if (cr > 0) pos++; else neg++; }
                if (!pos || !neg) shAcc(cx, cz);
            }
            var w = clamp(Math.ceil((SB[1] - SB[0] + 3) / 4) * 4, 20, 176), h = clamp(Math.ceil((SB[3] - SB[2] + 3) / 4) * 4, 20, 176);
            var tx = w / SHADOW_SIZE, ty = h / SHADOW_SIZE, ccx = Math.round((SB[0] + SB[1]) * .5 / tx) * tx, ccy = Math.round((SB[2] + SB[3]) * .5 / ty) * ty;
            mortho(LPROJ, ccx - w / 2, ccx + w / 2, ccy - h / 2, ccy + h / 2, 20, 140); mmul(LVP, LPROJ, LV0); SHW.w = w; SHW.h = h;
            if (CSM) shNear();
        }
        function shNear() {
            var nh = Math.ceil(clamp(CAM_FD * .4, 7, 28) / 2) * 2, cx = clamp(CAM_AX, PX0, PX1), cz = clamp(CAM_AZ, PZ0, PZ1), k;
            SB[0] = 1e9; SB[1] = -1e9; SB[2] = 1e9; SB[3] = -1e9;
            for (k = 0; k < 4; k++) shAcc(cx + (k & 1 ? nh : -nh), cz + (k & 2 ? nh : -nh));
            var w = Math.ceil((SB[1] - SB[0] + 2) / 2) * 2, h = Math.ceil((SB[3] - SB[2] + 2) / 2) * 2, tx = w / SHADOW_SIZE, ty = h / SHADOW_SIZE;
            var ccx = Math.round((SB[0] + SB[1]) * .5 / tx) * tx, ccy = Math.round((SB[2] + SB[3]) * .5 / ty) * ty;
            mortho(LPROJ, ccx - w / 2, ccx + w / 2, ccy - h / 2, ccy + h / 2, 20, 140); mmul(LVPN, LPROJ, LV0); SHWN = Math.max(w, h);
        }
        // kademe kırpması: aktörün (bel hizası) ışık kırpma uzayındaki en büyük |x|,|y| değeri (ortografik: w = 1)
        function shClip(M, x, z) { var cx = M[0] * x + M[4] + M[8] * z + M[12], cy = M[1] * x + M[5] + M[9] * z + M[13]; cx = cx < 0 ? -cx : cx; cy = cy < 0 ? -cy : cy; return cx > cy ? cx : cy; }
        function updateLightVP(cx, cz) {
            if (VQ.sh) { shFit(); return; }
            var texel = (shadowHalf * 2) / SHADOW_SIZE;
            cx = Math.round(clamp(cx, -5, PW + 5) / texel) * texel; cz = Math.round(clamp(cz, -5, PH + 5) / texel) * texel;
            var L = LIGHTS.ldir, D = 46;
            mlook(LVIEW, cx + L[0] * D, L[1] * D, cz + L[2] * D, cx, 0, cz);
            mortho(LPROJ, -shadowHalf, shadowHalf, -shadowHalf, shadowHalf, 1, D + 30);
            mmul(LVP, LPROJ, LVIEW);
        }
        /* kamera yönetmeni önceliği: (1) taktik/VAR tam saha - değişmedi; (2) gol kutlaması - kutlayan
           grubun ağırlık merkezine yakın/alçak çerçeve; (3) duran top - türüne göre (penaltı/korner/
           serbest vuruş/başlangıç/aut/kale vuruşu) yayıncı kuralına uygun çerçeve (ax/dir/side, aynı
           refTarget()'ta kullanılan hücum-yönü sözleşmesi); (4) varsayılan yayın kamerası - kullanıcının
           seçtiği İZLEME AÇISINA (st.style) göre elev/mesafe değişir, GERİ KALAN HER ŞEY (takip mantığı,
           tekrar/replay çerçevesi - st.replay her zaman KENDİ sabit açısını kullanır, style'dan ETKİLENMEZ)
           değişmedi. */
        var TV_H = 21, TV_Z = 57, TV_DOL = .12, TV_ZM = .8;      // TV_ZM: kadraj (yayında topun çevresi ~45–50 m; eski yayın kamerası 60 m — oyuncular çok küçüktü)      // [v186] TV ana kamerası: yükseklik (m), saha ortasından derinlik (m; yan çizginin ~23 m gerisi), topa doğru hafif kayma payı
        var CAM_STYLE = { std: { wvL: 60, wvP: 44, elev: 27 }, low: { wvL: 40, wvP: 30, elev: 15 }, high: { wvL: 80, wvP: 60, elev: 39 } };  // yayın kamerası açı ön ayarları: std = eski/öntanımlı davranışla SAYISAL OLARAK birebir aynı (geriye dönük uyum)
        function camGoal(mode, st, bx, bz, cel0, v) {
            var zoom = Math.max(1, st.zoom || 1), tx, tz, dist, elev, az = 0, wv;
            if (mode === 'full') {
                tx = PW / 2; tz = PH / 2 + 4; elev = 54 * Math.PI / 180; az = 0; dist = fitFull(elev);
            } else if (cel0 && cel0.length && v) {
                var cx = 0, cz = 0, cn = 0, ci, id;
                for (ci = 0; ci < cel0.length; ci++) { id = cel0[ci]; if (v.x[id] > -20) { cx += v.x[id]; cz += v.y[id]; cn++; } }
                if (cn > 0) { cx /= cn; cz /= cn; } else { cx = bx; cz = bz; }
                tx = clamp(cx, 6, PW - 6); tz = clamp(cz, 4, PH - 4); elev = 20 * Math.PI / 180;
                wv = 25 / zoom; dist = wv / (2 * Math.tan(FOVY / 2) * asp); az = cx < PW / 2 ? .20 : -.20;
            } else if (st.dead) {
                var dd = st.dead, ax = dd.ax, dir = dd.dir, side = dd.y < PH / 2 ? 1 : -1, k = dd.kind;
                if (k === 'penalty') {
                    tx = ax - dir * 9; tz = PH / 2; elev = 14 * Math.PI / 180; wv = 22 / zoom; az = dir === 1 ? -.10 : .10;
                } else if (k === 'corner') {
                    tx = ax - dir * 9; tz = dd.y + (PH / 2 - dd.y) * (dd.y > PH / 2 ? .25 : .55); elev = 24 * Math.PI / 180; wv = 40 / zoom; az = dir === 1 ? -.28 : .28;
                } else if (k === 'freekick') {
                    var fkd = Math.abs(ax - dd.x), fkb = dd.x - dir * 6;      // fkb: vurucunun bekleme noktasinin gerisi (kosu payi dahil)
                    if (fkd > 42) {      // uzak frikik: kale kadraja sigmaz - vurucu, top ve onundeki oyun alani
                        tx = dd.x + dir * 7; tz = dd.y + (PH / 2 - dd.y) * .3; elev = 22 * Math.PI / 180; wv = 36 / zoom;
                    } else {
                        tx = (fkb + ax) / 2; tz = (dd.y + PH / 2) / 2; elev = 18 * Math.PI / 180;
                        wv = Math.min(64, Math.max(24, Math.abs(ax - fkb) * 1.18 + Math.abs(PH / 2 - dd.y) * .3)) / zoom;
                    }
                    az = dd.x < PW / 2 ? .20 : -.20;
                } else if (k === 'kickoff') {
                    tx = PW / 2; tz = PH / 2; elev = 31 * Math.PI / 180; wv = 54 / zoom;
                } else if (k === 'goalkick') {
                    var og = dir === 1 ? 0 : PW; tx = og + dir * 16; tz = PH / 2; elev = 27 * Math.PI / 180; wv = 50 / zoom;
                } else {                                                                          // taç atışı (throw)
                    tx = clamp(dd.x, 8, PW - 8); var nr = dd.y > PH / 2; tz = PH / 2 + (dd.y - PH / 2) * (nr ? .78 : .97); elev = (nr ? 33 : 24) * Math.PI / 180; wv = (nr ? 28 : 21) / zoom;      // [sp] atıcı ve atış kadrajda: uzak çizgide hedef çizgiye yakın, dar; yakın çizgide yüksek açı (yedek kulübesi atıcıyı örtmesin)
                }
                tx = clamp(tx, 6, PW - 6); tz = clamp(tz, k === 'throw' ? 1 : 4, k === 'throw' ? PH - 1 : PH - 4); dist = wv / (2 * Math.tan(FOVY / 2) * asp);      // [sp] taçta hedef çizgiye 1 m'ye dek
            } else {
                if (st.replay) { wv = (asp < 1 ? 44 : 60) / zoom; elev = 22 * Math.PI / 180; az = (bx < PW / 2 ? .22 : -.22); }             // tekrar (replay) çerçevesi: DEĞİŞMEDİ, style'dan bağımsız
                else { var cs = CAM_STYLE[st.style] || CAM_STYLE.std; wv = (asp < 1 ? cs.wvP : cs.wvL) / zoom; elev = cs.elev * Math.PI / 180; }
                var pf = !st.replay && R.proFocus; if (pf) { bx = bx * .5 + pf.x * .5; bz = bz * .45 + pf.y * .55; wv *= .8; }      /* [port] Pro modu: kamera oyuncunu da kadrajda tutar */
                tx = clamp(bx, 8, PW - 8); tz = PH / 2 + (bz - PH / 2) * (pf ? .6 : .32); dist = wv / (2 * Math.tan(FOVY / 2) * asp);
            }
            return { tx: tx, tz: tz, dist: dist, elev: elev, az: az };
        }
        var fitCache = {};
        function fitFull(elev) {
            var k = asp.toFixed(3) + '|' + elev.toFixed(3); if (fitCache[k]) return fitCache[k];
            var L = 80, tz = PH / 2 + 4, pts = [[-3, 0, -3], [PW + 3, 0, -3], [-3, 0, PH + 9], [PW + 3, 0, PH + 9], [PW / 2, 3, -3]];
            for (var it = 0; it < 14; it++) {
                var ex = PW / 2, ey = Math.sin(elev) * L, ez = tz + Math.cos(elev) * L, v = mlook(m4(), ex, ey, ez, PW / 2, 0, tz), p = mpersp(m4(), FOVY, asp, 1, 900), vp = mmul(m4(), p, v), mx = 0;
                pts.forEach(function (q) { var x = vp[0] * q[0] + vp[4] * q[1] + vp[8] * q[2] + vp[12], y = vp[1] * q[0] + vp[5] * q[1] + vp[9] * q[2] + vp[13], w = vp[3] * q[0] + vp[7] * q[1] + vp[11] * q[2] + vp[15]; mx = Math.max(mx, Math.abs(x / w) / .95, Math.abs(y / w) / .93); });
                L *= mx > 0 ? (.5 + .5 * mx) : 1;
            }
            return fitCache[k] = L;
        }
        function camSd(c, k, g, w, dt) { var kv = k + 'V', v = c[kv] || 0, x = c[k] - g, e = Math.exp(-w * dt), t = (v + w * x) * dt; c[k] = g + (x + t) * e; c[kv] = (v - w * t) * e; }      // [v133]
        function camUpdate(st, bx, bz, dt, cel0, v) {
            if (R._camOverride || R.varCam || R.cutCam) {                                       // test/geliştirme sabit göz/hedefi ya da [var3d] VAR tekrar kamerası (2B köprüden, yalnız inceleme izlenirken)
                var co = R._camOverride || R.varCam || R.cutCam; eye[0] = co.eye[0]; eye[1] = co.eye[1]; eye[2] = co.eye[2]; CAM_FD = Math.hypot(co.at[0] - eye[0], co.at[1] - eye[1], co.at[2] - eye[2]); CAM_AX = co.at[0]; CAM_AZ = co.at[2];
                curFov = (co.fov || 34) * Math.PI / 180; mlook(VIEW, eye[0], eye[1], eye[2], co.at[0], co.at[1], co.at[2]); mpersp(PROJ, curFov, asp, .1, 900); mmul(VP, PROJ, VIEW); return;
            }
            if (st.mode === 'loca' && !st.vs) { locaCam(st, bx, bz, dt); return; }      // [v158] loca: ana tribünün üst katındaki camlı locadan bakış (yayın kamerası değil)
            var mode = st.mode === 'full' || st.vs ? 'full' : 'bcast', g = camGoal(mode, st, bx, bz, cel0, v), c = S.cam;
            if (!c) { c = S.cam = { tx: g.tx, tz: g.tz, dist: g.dist, elev: g.elev, az: g.az }; }
            var wp = mode === 'full' ? 4 : 3.6;      // [v133] kritik sonumlu yay: hiz surekli (canli/olu top kadraj gecisinde ve vuruslarda sarsinti yok)
            camSd(c, 'tx', g.tx, wp, dt); camSd(c, 'tz', g.tz, wp, dt); camSd(c, 'dist', g.dist, 4, dt); camSd(c, 'elev', g.elev, 4, dt); camSd(c, 'az', g.az, 4, dt);
            eye[0] = c.tx + Math.sin(c.az) * Math.cos(c.elev) * c.dist; eye[1] = Math.sin(c.elev) * c.dist; eye[2] = c.tz + Math.cos(c.az) * Math.cos(c.elev) * c.dist;
            curFov = FOVY; CAM_FD = c.dist;
            /* [v186] TV ana kamerası: canlı oyunda göz orta çizgi hizasında, tribünün üst katında SABİT durur; topu döner (pan) ve görüş açısıyla (zoom) izler —
               kale önünde ceza sahası yandan-çapraz görünür (yayın görüntüsü). Kadraj eski yayın kamerasının TV_ZM katı (~48 m; oyuncular daha büyük); duran top / sevinç / tekrar
               kameraları değişmez, geçiş yumuşak (tvk yayı). R.tvCam = false → eski kaydırmalı (dolly) kamera. */
            var tvOn = mode === 'bcast' && R.tvCam !== false && !st.dead && !st.replay && !(cel0 && cel0.length) && !R.proFocus;
            if (c.tvk == null) c.tvk = tvOn ? 1 : 0; camSd(c, 'tvk', tvOn ? 1 : 0, 2.6, dt);
            var tk = clamp(c.tvk, 0, 1);
            if (tk > .001) {
                var tex = PW / 2 + (c.tx - PW / 2) * TV_DOL, tey = TV_H, tez = PH / 2 + TV_Z, dTV = Math.hypot(c.tx - tex, tey, c.tz - tez), fTV = 2 * Math.atan(c.dist * Math.tan(FOVY / 2) * TV_ZM / dTV);
                eye[0] += (tex - eye[0]) * tk; eye[1] += (tey - eye[1]) * tk; eye[2] += (tez - eye[2]) * tk; curFov = FOVY + (fTV - FOVY) * tk; CAM_FD = c.dist + (dTV - c.dist) * tk;
            }
            CAM_AX = c.tx; CAM_AZ = c.tz; mlook(VIEW, eye[0], eye[1], eye[2], c.tx, 0, c.tz); mpersp(PROJ, curFov, asp, 1.5, 900); mmul(VP, PROJ, VIEW);
        }
        /* [v158] loca kamerası: göz yakın (S) tribünün en üst sırasının biraz üstünde ve gerisinde SABİT durur (yalnız topa doğru çok az kayar);
           bakış hedefi topu insan başı gibi gecikmeli izler; geniş açı. Unity stadyumunda üst sıra yüksekliği seyirci şeritlerinden bulunur. */
        var LOCA_P = null;
        function locaPos() {
            var key = !!(G.ADO_STAD && G.ADO_STAD.ready); if (LOCA_P && LOCA_P.k === key) return LOCA_P;
            var y = 4.62, z = PH + 20.6;                                           // yerleşik yakın tribün: 11 sıra × .42 m yükseklik, × .78 m derinlik (stand('S', …))
            if (key) { try { var D = G.ADO_STAD, s, my = -1, mz = 0; for (s = 0; s < D.ns; s++) { var ax = D.sp[s * 5], ay = D.sp[s * 5 + 1], az = D.sp[s * 5 + 2], bx2 = D.sp[s * 5 + 3], bz2 = D.sp[s * 5 + 4];
                if (az > PH + 2 && bz2 > PH + 2 && Math.abs((ax + bx2) / 2 - PW / 2) < 30 && ay > my) { my = ay; mz = (az + bz2) / 2; } } if (my > 0) { y = my; z = mz; } } catch (e) { } }
            return LOCA_P = { k: key, y: y + 7.2, z: z - 1.2 };
        }
        function locaCam(st, bx, bz, dt) {
            var L = S.lcam, P = locaPos(), dd = st.dead, gx = clamp(bx, 26, PW - 26), gz = PH / 2 + (bz - PH / 2) * .3, por = asp < 1;
            if (dd && dd.kind === 'kickoff') { gx = PW / 2; gz = PH / 2; }
            if (!L) L = S.lcam = { lx: gx, lz: gz, ex: PW / 2 + (gx - PW / 2) * .1 };
            camSd(L, 'lx', gx, 1.25, dt); camSd(L, 'lz', gz, 1.1, dt); camSd(L, 'ex', PW / 2 + (L.lx - PW / 2) * .1, .45, dt);
            eye[0] = L.ex; eye[1] = P.y + (por ? 5 : 0) + Math.sin((st.now || 0) / 2300) * .035; eye[2] = P.z + (por ? 4 : 0);
            curFov = (por ? 50 : 40) * Math.PI / 180; CAM_AX = L.lx; CAM_AZ = L.lz; CAM_FD = Math.hypot(L.lx - eye[0], eye[1], L.lz - eye[2]);
            mlook(VIEW, eye[0], eye[1], eye[2], L.lx, 0, L.lz); mpersp(PROJ, curFov, asp, .3, 900); mmul(VP, PROJ, VIEW);
        }
        if (!R.resetCam) R.resetCam = function () { S.lcam = null; };      // [v158] görünüm değişince loca kamerası yeniden yerleşir
        R._locaState = function () { return { eye: eye.slice(), fov: curFov * 180 / Math.PI, at: S.lcam ? [S.lcam.lx, 0, S.lcam.lz] : null, pos: locaPos() }; };
        // test/hata ayıklama: camGoal'ün ANLIK hedefini (yumuşatma uygulanmadan) ve canlı kamera durumunu okur - ekran görüntüsü yerine sayısal doğrulama için
        R._camGoal = function (cam, bx, bz, cel0, v) { var mode = cam.mode === 'full' || cam.vs ? 'full' : 'bcast'; return camGoal(mode, cam, bx, bz, cel0, v); };
        R.varCam = null;
        R._camState = function () { return S.cam ? { tx: S.cam.tx, tz: S.cam.tz, dist: S.cam.dist, elev: S.cam.elev, az: S.cam.az } : null; };
        R.projectTo = function (o, x, y, z) {                              // [opt] tahsissiz izdüşüm (o: {x, y, w}); ekran arkasındaysa null
            var wx = VP[0] * x + VP[4] * y + VP[8] * z + VP[12], wy = VP[1] * x + VP[5] * y + VP[9] * z + VP[13], ww = VP[3] * x + VP[7] * y + VP[11] * z + VP[15];
            if (ww <= .01) return null; o.x = (wx / ww * .5 + .5) * W; o.y = (1 - (wy / ww * .5 + .5)) * H; o.w = ww; return o;
        };
        R.project = function (x, y, z) {
            var wx = VP[0] * x + VP[4] * y + VP[8] * z + VP[12], wy = VP[1] * x + VP[5] * y + VP[9] * z + VP[13], ww = VP[3] * x + VP[7] * y + VP[11] * z + VP[15];
            if (ww <= .01) return null; return { x: (wx / ww * .5 + .5) * W, y: (1 - (wy / ww * .5 + .5)) * H, w: ww };
        };
        /* dünya (x,z) zemin noktasının ekran konumu + 1 m'nin piksel karşılığı (yatay) */
        R.groundPx = function (x, z) { var a = R.project(x, 0, z), b = R.project(x + 1, 0, z); if (!a || !b) return null; return { x: a.x, y: a.y, ppm: Math.abs(b.x - a.x) }; };

        /* ----- oyuncu çizimi ----- */
        var stk = []; for (var si = 0; si < 12; si++) stk.push(m4());
        var pose = new Float32Array(PIVOTS.length * 3), lm = m4();
        function drawNode(n, parent, depth) {
            var w = stk[depth];
            if (n.pi >= 0) { var k = n.pi * 3; mtrs(lm, n.t[0], n.t[1] + (n.pi === 0 ? pose[k + 1] : 0), n.t[2], pose[k], n.pi === 0 ? 0 : pose[k + 1], pose[k + 2], 1); }
            else mtrs(lm, n.t[0], n.t[1], n.t[2], 0, 0, 0, 1);
            mmul(w, parent, lm);
            if (n.vao) { gl.uniformMatrix4fv(pPl.u.uM, false, w); gl.bindVertexArray(n.vao); gl.drawElements(gl.TRIANGLES, n.count, gl.UNSIGNED_SHORT, 0); }
            for (var i = 0; i < n.kids.length; i++) drawNode(n.kids[i], w, depth + 1);
        }
        /* aynı iskelet gezinmesi, yalnızca gölge haritası derinlik geçişi için (yalnızca konum, uM = ışık-VP * dünya) */
        var mvpTmp = m4();
        function drawNodeDepth(n, parent, depth) {
            var w = stk[depth];
            if (n.pi >= 0) { var k = n.pi * 3; mtrs(lm, n.t[0], n.t[1] + (n.pi === 0 ? pose[k + 1] : 0), n.t[2], pose[k], n.pi === 0 ? 0 : pose[k + 1], pose[k + 2], 1); }
            else mtrs(lm, n.t[0], n.t[1], n.t[2], 0, 0, 0, 1);
            mmul(w, parent, lm);
            if (n.vao) { mmul(mvpTmp, LVPC, w); gl.uniformMatrix4fv(pDepth.u.uMVP, false, mvpTmp); gl.bindVertexArray(n.vao); gl.drawElements(gl.TRIANGLES, n.count, gl.UNSIGNED_SHORT, 0); }
            for (var i = 0; i < n.kids.length; i++) drawNodeDepth(n.kids[i], w, depth + 1);
        }
        /* poz: pivot başına [ax, ay, az] (Hips için ay = dikey sıçrama). Model +Z'ye bakar; bir sarkan uzvun +ax dönüşü onu geriye (−Z) savurur, yani ileri = negatif ax */
        var PK = { Hips: 0, Torso: 3, Head: 6, ArmL: 9, ForeL: 12, ArmR: 15, ForeR: 18, LegL: 21, ShinL: 24, FootL: 27, LegR: 30, ShinR: 33, FootR: 36 };
        var KW_ = 1;      // [v133] P agirligi (1 = eski davranis: dogrudan yazma); yedek vurus giris/cikista karisir
        function P(n, ax, ay, az) { var k = PK[n], w = KW_; if (ax != null) pose[k] += (ax - pose[k]) * w; if (ay != null) pose[k + 1] += (ay - pose[k + 1]) * w; if (az != null) pose[k + 2] += (az - pose[k + 2]) * w; }
        // [oa] hız çapalı genlik tabloları (derece / m) - modül sabitleri: poseFor her çağrıda dizi üretmesin
        var PL_HA = [3, 25, 30, 43], PL_HB = [0, 3, 8, 14], PL_KA = [8, 60, 125, 147], PL_AA = [4, 16, 24, 30], PL_TL = [0, 3, 9, 15], PL_TT = [0, 2, 9, 13], PL_HBM = [0, .018, .032, .034], PL_FB = [12, 85, 90, 106], PL_FO = [3, 10, 14, 62], PL_AR = [4, 22, 33, 50];
        function poseFor(a, sp, t, mods) {
            pose.fill(0);
            if (R._mcTest && S.st && a === S.st[R._mcTest.i] && mcPose(R._mcTest.ad, performance.now() / 1000 - R._mcTest.t0, pose, true, R._mcTest.mr)) return;      // [mocap] test
            var q01 = 0;                                                    // [opt] satır içi smooth01 geçicisi (çağrı/sayı kutulaması yok)
            var ph = a.ph;
            var carryK = a.carryK || 0, takeonK = a.takeonK || 0;          // top sürme karışımı: OLAYA değil canlı top sahipliğine bağlı, sürekli/yumuşak geçişli (bkz PLAN.md)
            var g0, g1, gt;                                                 // [opt] hız çapası parçası bir kez (plerp ile bire bir aynı)
            if (sp <= GAIT_SP[0]) { g0 = 0; g1 = 0; gt = 0; } else if (sp <= GAIT_SP[1]) { g0 = 0; g1 = 1; } else if (sp <= GAIT_SP[2]) { g0 = 1; g1 = 2; } else if (sp <= GAIT_SP[3]) { g0 = 2; g1 = 3; } else { g0 = 3; g1 = 3; gt = 0; }
            if (g1 !== g0) gt = (sp - GAIT_SP[g0]) / (GAIT_SP[g1] - GAIT_SP[g0]);
            var stanceFrac = PL_STF[g0] + (PL_STF[g1] - PL_STF[g0]) * gt;    // duruş fazı payı: yürüyüş ~%60 -> sprint ~%20 (Perry gait-cycle)
            var phw = warpPhase(ph, stanceFrac);                            // bacaklar: bükülmüş faz (duruşta yavaş, salınımda hızlı - saf sin(ph)'in veremediği ağırlık aktarma hissi)
            var s1 = Math.sin(phw), c1 = Math.cos(phw);
            var idleFade = 1 - (q01 = Math.max(0, Math.min(1, sp / .35)), q01 * q01 * (3 - 2 * q01));                         // sp->0 iken boşta hafif salınıma yumuşak geçiş

            // hedef genlikler (derece): hız çapalarında (dur/yürüyüş/koşu/sprint) araştırmayla hizalı
            // değerler, aradaki hızlarda parçalı-doğrusal geçiş (plerp). hipBias: kalçanın öne kayması
            // (fleksiyon ekstansiyondan büyük, fark hızla açılıyor) - saf simetrik sinüsün veremediği detay.
            var hipAmpDeg = PL_HA[g0] + (PL_HA[g1] - PL_HA[g0]) * gt, hipBiasDeg = PL_HB[g0] + (PL_HB[g1] - PL_HB[g0]) * gt;
            var kneeAmpDeg = PL_KA[g0] + (PL_KA[g1] - PL_KA[g0]) * gt, ankleAmpDeg = PL_AA[g0] + (PL_AA[g1] - PL_AA[g0]) * gt;
            var torsoLeanDeg = PL_TL[g0] + (PL_TL[g1] - PL_TL[g0]) * gt, torsoTwistDeg = PL_TT[g0] + (PL_TT[g1] - PL_TT[g0]) * gt;
            var hipBounceM = PL_HBM[g0] + (PL_HBM[g1] - PL_HBM[g0]) * gt;
            var foreArmBaseDeg = PL_FB[g0] + (PL_FB[g1] - PL_FB[g0]) * gt, foreArmOscDeg = PL_FO[g0] + (PL_FO[g1] - PL_FO[g0]) * gt;
            var armAmpDeg = PL_AR[g0] + (PL_AR[g1] - PL_AR[g0]) * gt;
            if (carryK > 0) {                                               // top sürme: kısa/hızlı adım (az kalça ekstansiyonu), hafif öne eğik gövde, daralan kol sallanışı - dribbling biyomekaniği araştırmasıyla hizalı (mid-foot temas, düşük gövde merkezi, yüksek kadans)
                hipAmpDeg *= 1 - .12 * carryK; kneeAmpDeg *= 1 - .12 * carryK; torsoLeanDeg += 4.5 * carryK; armAmpDeg *= 1 - .18 * carryK;
            }

            var hipAmp = hipAmpDeg * D2R, hipBias = hipBiasDeg * D2R, kneeAmp = kneeAmpDeg * D2R, ankleAmp = ankleAmpDeg * D2R;
            var legL = s1 * hipAmp + hipBias, legR = -s1 * hipAmp + hipBias;
            var kneeL = Math.max(0, -c1) * kneeAmp, kneeR = Math.max(0, c1) * kneeAmp;
            var footL = -kneeL * .35 + ankleAmp * .18, footR = -kneeR * .35 + ankleAmp * .18;
            if (carryK > .05) {                                            // top dokunuşu: adım başına (yarım fazda bir) hafif ekstra bilek vuruşu - mevcut faza senkronize, ayrı bir zamanlayıcı icat edilmedi
                var touch = Math.max(0, Math.sin(phw * 2)) * .17 * carryK; footL -= touch * (s1 > 0 ? 1 : .35); footR -= touch * (s1 < 0 ? 1 : .35);
            }
            var idleSway = Math.sin(t * .9) * .035 * idleFade;             // boşta gerçek-zamanlı hafif ağırlık aktarma (mesafeden BAĞIMSIZ - dururken de donuk kalmasın)
            legL += idleSway; legR -= idleSway;
            var torsoAx = torsoLeanDeg * D2R;                                // DÜZELTME: gövde gibi YUKARI bakan bir parçada +ax ÖNE eğer (mtrs: y ekseni -> (0,cos,sin)).
                                                                             // Eski kod -ax kullanıyordu: koşan oyuncu GERİYE yaslanıyordu (kafa vuruşu/şut ile tutarsız).
            var twist = s1 * torsoTwistDeg * D2R + (takeonK > .05 ? Math.sin(t * 6.5) * .16 * takeonK : 0);    // takeon (rakibi çalımlama): yavaş yanal gövde/omuz sallanışı üst üste biner
            var takeonArm = takeonK > .05 ? Math.sin(t * 6.5) * .10 * takeonK : 0;
            var armLx = -s1 * armAmpDeg * D2R - takeonArm, armRx = s1 * armAmpDeg * D2R + takeonArm, armLz = -.08, armRz = .08, armLy = 0, armRy = 0;
            var foreL = -(foreArmBaseDeg + foreArmOscDeg * s1) * D2R, foreR = -(foreArmBaseDeg - foreArmOscDeg * s1) * D2R;
            var hipZ = 0, torsoZ = 0, legLz = 0, legRz = 0, legLy = 0, legRy = 0, headX = .05 + .08 * Math.max(0, Math.min(1, sp / 6.4)), headY = 0;
            /* --- DOĞAL DURUŞ (dururken / ağır adımda): "hazır ol" mankenin yerine ağırlık bir bacakta (kontrapposto), diğer diz hafif
               bükük ve topuk hafif kalkık, ayaklar omuz genişliğinde ve hafif dışa dönük, leğen ağırlık tarafına eğik, omuz hattı ters
               yöne, kollar hafif önde-açık ve dirsekler bükük, nefes alma. Oyuncuya özgü değişkenlik (a.vary) ve zaman zaman taraf
               değiştirme (a.stanceB, render döngüsünde yumuşak). Bazı oyuncular uzun duraklamada ELLERİ BELDE durur (a.hipsK). */
            var idleK = 1 - (q01 = Math.max(0, Math.min(1, sp / .9)), q01 * q01 * (3 - 2 * q01));
            if (idleK > .001) {
                var vy = a.vary || 0, side = a.stanceB == null ? (vy < .5 ? 1 : -1) : a.stanceB, rL = Math.max(0, -side), rR = Math.max(0, side), br = Math.sin(t * 1.55 + vy * 6.0);
                legL = ((legL) + ((-.10 * rL + .025 * rR) - (legL)) * (idleK)); legR = ((legR) + ((-.10 * rR + .025 * rL) - (legR)) * (idleK));
                kneeL = ((kneeL) + ((.25 * rL + .035) - (kneeL)) * (idleK)); kneeR = ((kneeR) + ((.25 * rR + .035) - (kneeR)) * (idleK));
                footL = ((footL) + ((-.10 * rL - .055 * rR) - (footL)) * (idleK)); footR = ((footR) + ((-.10 * rR - .055 * rL) - (footR)) * (idleK));
                hipZ = -.05 * side * idleK; legLz = (.05 * side - .055 - .03 * rL) * idleK; legRz = (.05 * side + .055 + .03 * rR) * idleK;
                legLy = -(.09 + .05 * rL) * idleK; legRy = (.09 + .05 * rR) * idleK;
                torsoAx = ((torsoAx) + ((.035 + .012 * br) - (torsoAx)) * (idleK)); torsoZ = .035 * side * idleK; twist = ((twist) + ((.05 * side) - (twist)) * (idleK));
                armLx = ((armLx) + ((-.10 - .06 * vy + .015 * br) - (armLx)) * (idleK)); armRx = ((armRx) + ((-.07 - .05 * (1 - vy) + .015 * br) - (armRx)) * (idleK));
                armLz = ((armLz) + ((-.11 - .03 * rL) - (armLz)) * (idleK)); armRz = ((armRz) + ((.11 + .03 * rR) - (armRz)) * (idleK));
                foreL = ((foreL) + ((-(.30 + .16 * vy)) - (foreL)) * (idleK)); foreR = ((foreR) + ((-(.26 + .16 * (1 - vy))) - (foreR)) * (idleK));
                headX = ((headX) + ((.07) - (headX)) * (idleK));
                var hk = (a.hipsK || 0) * idleK;                            // eller belde: omuz geride-açık, dirsek ~93° (analitik ters kinematikle hesaplanmış açılar)
                if (hk > .001) {
                    armLx = ((armLx) + ((1.175) - (armLx)) * (hk)); armLy = ((armLy) + ((.748) - (armLy)) * (hk)); armLz = ((armLz) + ((-1.05) - (armLz)) * (hk)); foreL = ((foreL) + ((-1.62) - (foreL)) * (hk));
                    armRx = ((armRx) + ((1.175) - (armRx)) * (hk)); armRy = ((armRy) + ((-.748) - (armRy)) * (hk)); armRz = ((armRz) + ((1.05) - (armRz)) * (hk)); foreR = ((foreR) + ((-1.62) - (foreR)) * (hk));
                }
            }
            /* [oa] koşu döngüsünün doğallığı (gövdeye göre görünen hız bileşenleri, ivme ve dönüş hızı render döngüsünde sim saniyesiyle):
               yan adım (jokey / kaleci dışı yana kayış): çapraz adım yok - ayaklar sırayla açılıp kapanır, dizler bükük, gövde dik, kollar açık;
               geri koşu: kısa adım, gövde hafif öne, kollar denge için açık; ivmede öne / frende geriye eğilme (~2.6°/(m/sn²)); virajda içe yatma
               atan(v·ω/g) (±0.3 rad) - leğenle birlikte tüm vücut yatar, ayaklar dışta kalır (kalça çember kadar iner). */
            var latV = a.latV || 0, lonV = a.lonV || 0, vm = Math.sqrt(latV * latV + lonV * lonV), sideK = 0, backK = 0, roll = 0;
            if (vm > .4 && sp > .4) {
                var mvK = (q01 = Math.max(0, Math.min(1, (sp - .4) / .6)), q01 * q01 * (3 - 2 * q01));
                sideK = (q01 = Math.max(0, Math.min(1, (Math.abs(latV) / vm - .62) / .25)), q01 * q01 * (3 - 2 * q01)) * (1 - (q01 = Math.max(0, Math.min(1, (sp - 3.6) / 1.4)), q01 * q01 * (3 - 2 * q01))) * mvK;
                backK = (q01 = Math.max(0, Math.min(1, (-lonV / vm - .55) / .25)), q01 * q01 * (3 - 2 * q01)) * mvK * (1 - sideK);
            }
            if (sideK > .01) {
                var opn = .5 + .5 * s1, wdt = .05 + .13 * opn;
                legL = ((legL) + ((-.3) - (legL)) * (sideK)); legR = ((legR) + ((-.3) - (legR)) * (sideK));
                kneeL = ((kneeL) + ((.5 + .22 * Math.max(0, s1)) - (kneeL)) * (sideK)); kneeR = ((kneeR) + ((.5 + .22 * Math.max(0, -s1)) - (kneeR)) * (sideK));
                legLz = ((legLz) + ((-wdt) - (legLz)) * (sideK)); legRz = ((legRz) + ((wdt) - (legRz)) * (sideK)); footL = ((footL) + ((-.08) - (footL)) * (sideK)); footR = ((footR) + ((-.08) - (footR)) * (sideK));
                torsoAx = ((torsoAx) + ((.16) - (torsoAx)) * (sideK)); twist = ((twist) + ((0) - (twist)) * (sideK));
                armLx = ((armLx) + ((-.35) - (armLx)) * (sideK)); armRx = ((armRx) + ((-.35) - (armRx)) * (sideK)); armLz = ((armLz) + ((-.32) - (armLz)) * (sideK)); armRz = ((armRz) + ((.32) - (armRz)) * (sideK));
                foreL = ((foreL) + ((-1.0) - (foreL)) * (sideK)); foreR = ((foreR) + ((-1.0) - (foreR)) * (sideK));
            }
            if (backK > .01) { legL *= 1 - .35 * backK; legR *= 1 - .35 * backK; kneeL *= 1 - .3 * backK; kneeR *= 1 - .3 * backK; torsoAx = ((torsoAx) + ((.1) - (torsoAx)) * (backK)); armLz -= .14 * backK; armRz += .14 * backK; }
            torsoAx += Math.max(-.12, Math.min(.26, .045 * (a.accS || 0))) * (q01 = Math.max(0, Math.min(1, sp / 1.5)), q01 * q01 * (3 - 2 * q01)) * (1 - sideK) * (1 - backK);
            roll = Math.max(-.3, Math.min(.3, -Math.atan(sp * (a.yawR || 0) / 9.81))) * (q01 = Math.max(0, Math.min(1, (sp - 1.5) / 2)), q01 * q01 * (3 - 2 * q01)) * (1 - sideK);
            var look = a.look || 0;                                          // baş (ve biraz gövde) TOPA döner - koşarken daha az
            headY = look * (.62 - .25 * (1 - idleK)); twist += look * .22 * idleK;

            pose[0] = 0; pose[1] = Math.abs(c1) * hipBounceM * (stanceFrac < .5 ? 1 : .8) * (1 - .15 * carryK); pose[2] = 0;      // Hips: dikey sıçrama (ay alanı) - top sürerken biraz daha alçak/kontrollü
            pose[2] = hipZ + roll;                                                                              // leğen yanal eğimi (az) · [oa] viraj yatışı
            if (sideK > .01 || roll) pose[1] -= legDrop(-.3, .5, 0) * sideK + .9 * (1 - Math.cos(roll));      // [oa] yan adımda dizler bükük, virajda kalça iner (ayak yerde)
            pose[3] = torsoAx; pose[4] = twist; pose[5] = torsoZ;                                                                  // öne eğilme + dönme + omuz hattı eğimi
            pose[6] = headX; pose[7] = headY; pose[8] = 0;
            // kollar bacakların tersi yönünde sallanır; dirsek kendi omzuyla aynı fazı paylaşıp taban
            // değeri etrafında iki kutuplu sallanır (jogda ~90° civarı neredeyse sabit, sprintte omuz öne
            // geldikçe belirgin şekilde daha çok bükülen geniş bir "kamçı" yayı - gerçek dirsek sabit değil).
            pose[9] = armLx; pose[10] = armLy; pose[11] = armLz; pose[15] = armRx; pose[16] = armRy; pose[17] = armRz;
            pose[12] = foreL; pose[13] = 0; pose[14] = 0; pose[18] = foreR; pose[19] = 0; pose[20] = 0;
            pose[21] = legL; pose[22] = legLy; pose[23] = legLz; pose[24] = kneeL; pose[25] = 0; pose[26] = 0; pose[27] = footL; pose[28] = 0; pose[29] = 0;
            pose[30] = legR; pose[31] = legRy; pose[32] = legRz; pose[33] = kneeR; pose[34] = 0; pose[35] = 0; pose[36] = footR; pose[37] = 0; pose[38] = 0;
            var gaW = GA_ON && !MC_OFF ? (a.gaW || 0) : 0;      // [gasp]
            if (gaW > .01 && sp > .2) { var wg = (q01 = Math.max(0, Math.min(1, (sp - .2) / .6)), q01 * q01 * (3 - 2 * q01)) * gaW; if (wg > .01) gaspLoco(a, sp, wg); }
            if (MC_LOCO && !MC_OFF && sp > 1.3) { var wl = (q01 = Math.max(0, Math.min(1, (sp - 1.3) / .8)), q01 * q01 * (3 - 2 * q01)) * (1 - (q01 = Math.max(0, Math.min(1, (sp - 7) / 1.2)), q01 * q01 * (3 - 2 * q01))) * (1 - sideK) * (1 - backK) * (1 - gaW); if (wl > .01) mcLoco(a, sp, wl); }      // [mocap] kosu
            if (CLKOK && (a.readyK > .002 || a.holdK > .002 || a.ac || a.acP)) gkPose(a);      // [gk] kaleci: hazır duruş / topu elde tutuş / kurtarış-alma-oyuna sokma aksiyonu
            if (!mods) return;
            if (mods.kick > 0) {
                var q = mods.kick; KW_ = smooth01(q / .12) * (1 - smooth01((q - .82) / .18));      // [v133] yedek vurus: pozdan yumusak giris/cikis (pop yok)
                if (a.kickKind === 'head') {                                                                    // kafa vuruşu: bacak sallanmaz - gövde/kafa geriye gerilip fırlama + hafif sıçrama (leg-kick modifiyeriyle karıştırılması eski bir hataydı: SHOT olayı HEAD etiketliyken de aynı bacak animasyonu oynuyordu)
                    var cfh = .30, hq;
                    if (q < cfh) { hq = smooth01(q / cfh); P('Torso', -.30 * (1 - hq) + .55 * hq, twist, 0); P('Head', -.20 * (1 - hq) + .30 * hq, 0, 0); pose[1] += hq * .11; }
                    else { var fh = (q - cfh) / (1 - cfh), eh = 1 - smooth01(fh); P('Torso', .55 * eh, twist, 0); P('Head', .30 * eh, 0, 0); pose[1] += eh * .11; }
                    var hsw = Math.sin(q * Math.PI) * .5; P('ArmL', -1.55 + hsw, 0, -.35); P('ArmR', -1.55 + hsw, 0, .35);
                } else {                                                                                        // erken temas + geniş ağırlıklı takip: top, olayın AYNI anında fırlatıldığı için (bkz PLAN.md) temas anı pencerenin başına yakın olmalı - eskiden ~%55'te olan temas topun çoktan uzaklaşmış olmasına, "havada asılı" hissine yol açıyordu
                    var cf = a.kickCf || .16, lg0 = a.kickLg0 != null ? a.kickLg0 : 1.05, lg1 = a.kickLg1 != null ? a.kickLg1 : -1.5, kn0 = a.kickKn0 != null ? a.kickKn0 : 1.35, armA = a.kickArm != null ? a.kickArm : .4;
                    var lg, kn;
                    if (q < cf) { var f = q / cf, ease = f * f * f; lg = lg0 + (lg1 - lg0) * Math.min(1, ease * 1.08); kn = kn0 * (1 - Math.min(1, f * 1.15)); }
                    else { var f3 = (q - cf) / (1 - cf), e2 = smooth01(f3); lg = lg1 * (1 - e2); kn = .12 * (1 - e2); }
                    // vuruş ayağı (a.kickFoot, ANATOMİK): iskeletteki L/R adları izleyiciye göredir (bağ uzayında +Z'ye bakan modelde -X tarafı
                    // 'LegL' = oyuncunun SAĞ bacağı). Sağ ayakla vuruşta 'LegL' sallanır, karşı (sol) kol öne gelir, gövde ters yöne döner.
                    var kR = a.kickFoot !== 'L', KL = kR ? 'LegL' : 'LegR', KS = kR ? 'ShinL' : 'ShinR', AF = kR ? 'ArmR' : 'ArmL', AB = kR ? 'ArmL' : 'ArmR', zF = kR ? .08 : -.08, tw = kR ? -1 : 1;
                    P(KL, lg, 0, 0); P(KS, kn, 0, 0); P(AF, lg * armA, 0, zF); P(AB, -lg * armA, 0, -zF);
                    if (a.kickTorso) { var lean = clamp(-lg / 1.6, -.3, 1) * a.kickTorso; P('Torso', torsoAx + lean * .20, twist + tw * lean * .22, 0); }   // işaret düzeltmesi: takipte (lean>0) gövde topun ÜZERİNE öne katlanır, geri savurmada hafif geriye   // gövde/kalça katılımı (X-factor): yalnızca şut/uzaklaştırmada belirgin (kickTorso>0), kısa paslarda yok
                }
            }
            KW_ = 1;
            if (mods.celeb) { var sw = Math.sin(t * 9); P('ArmL', -2.9, 0, -(.45 + .25 * sw)); P('ArmR', -2.9, 0, .45 + .25 * sw); P('ForeL', -.2, 0, 0); P('ForeR', -.2, 0, 0); pose[1] += Math.abs(Math.sin(t * 8)) * .12; }
            // hakem hareketleri ANATOMİK SAĞ kolla (iskelette 'ArmL'/'ForeL' - bkz vuruş ayağı notu): kart sağ elde kaldırılır
            if (mods.ref === 'card') {      /* [hakem] kart: cebe uzanma -> kolu dumduz kaldirma -> bekletme -> indirme (anatomik sag kol 'ArmL') */
                var ct = mods.cardT != null && mods.cardT >= 0 ? mods.cardT : 1, kred = mods.cardK === 'R', ke1 = smooth01(Math.max(0, Math.min(1, ct / .3))), ke2 = smooth01(Math.max(0, Math.min(1, (ct - .32) / .38))), ke3 = smooth01(Math.max(0, Math.min(1, (ct - 2.05) / .4)));
                var kpx = kred ? .55 : -.55, kpz = kred ? .02 : -.45, kpf = kred ? -.45 : -2.1, kax = kpx + (-2.95 - kpx) * ke2, kaz = kpz + (-.06 - kpz) * ke2, kfx = kpf + (-.04 - kpf) * ke2, kw = ke1 * (1 - ke3), kA = PK.ArmL, kF = PK.ForeL, kB = PK.ArmR, kG = PK.ForeR;
                pose[kA] += (kax - pose[kA]) * kw; pose[kA + 1] += (0 - pose[kA + 1]) * kw; pose[kA + 2] += (kaz - pose[kA + 2]) * kw; pose[kF] += (kfx - pose[kF]) * kw; pose[kF + 1] *= 1 - kw; pose[kF + 2] *= 1 - kw;
                var kw2 = .6 * ke2 * (1 - ke3); pose[kB] += (-.25 - pose[kB]) * kw2; pose[kB + 2] += (.35 - pose[kB + 2]) * kw2; pose[kG] += (-.3 - pose[kG]) * kw2;      // diger kol hafif yana
                pose[PK.Head] += (-.12 - pose[PK.Head]) * .5 * ke2 * (1 - ke3);      // bas hafif yukari
            }
            else if (mods.ref === 'ear') { P('ArmL', -.75, 0, -.25); P('ForeL', -2.0, 0, 0); }
            else if (mods.ref === 'tv') { P('ArmL', -1.35, 0, -.28); P('ArmR', -1.35, 0, .28); P('ForeL', -.15, 0, 0); P('ForeR', -.15, 0, 0); }
            else if (mods.ref === 'point') { P('ArmL', -1.5, 0, -.55); P('ForeL', -.1, 0, 0); }
            if (mods.fw > .005) {      // [yan] yan hakem bayragi: 1 dik (ofsayt), 2 one (yer: uzak yukari / orta yatay / yakin asagi), 3 yana yukari (tac), 4 yana asagi (korner), 5 yana yatay (aut)
                var fwa = mods.fw, fkA = PK[mods.fa > 0 ? 'ArmL' : 'ArmR'], fkF = PK[mods.fa > 0 ? 'ForeL' : 'ForeR'], zsA = mods.fa > 0 ? -1 : 1, fax = null, faz = 0;
                if (mods.fl === 1) { fax = -2.95; faz = .08; } else if (mods.fl === 2) { fax = mods.fp > 0 ? -2.3 : mods.fp < 0 ? -.85 : -1.57; faz = .1; }
                else if (mods.fl === 3) { fax = -.25; faz = 2.0; } else if (mods.fl === 4) { fax = -.35; faz = .8; } else if (mods.fl === 5) { fax = -.45; faz = 1.5; }
                if (fax != null) { pose[fkA] += (fax - pose[fkA]) * fwa; pose[fkA + 1] -= pose[fkA + 1] * fwa; pose[fkA + 2] += (zsA * faz - pose[fkA + 2]) * fwa; pose[fkF] += (-.05 - pose[fkF]) * fwa; pose[fkF + 1] -= pose[fkF + 1] * fwa; pose[fkF + 2] -= pose[fkF + 2] * fwa; }
            }
            if (mods.dive) { P('ArmL', -2.6, 0, -.2); P('ArmR', -2.6, 0, .2); }
        }
        /* doğal duruş durumu (poseFor okur): ağırlık tarafı (birkaç saniyede bir yumuşakça değişir), uzun duraklamada eller belde
           (oyuncuların ~%28'i), baş topa döner (gövdeye göre ±66°, yumuşatılmış). Simülasyona/kayda dokunmaz - yalnızca görünüm. */
        function idleState(a, canHips) {
            var x = a.px, z = a.pz, bx = FRM[0], bz = FRM[1], dt = FRM[2], t = FRM[3];     // [opt] konum ve kare değerleri (argüman kutulaması yok)
            var vy = a.vary || 0;
            if (a.stSide == null) { a.stSide = vy < .5 ? 1 : -1; a.stanceB = a.stSide; a.stT = t + 3 + 7 * ((vy * 13.7) % 1); }
            if (t > a.stT) { a.stSide = -a.stSide; a.stT = t + 4 + 6 * ((vy * 7.3 + t * .37) % 1); }
            a.stanceB += (a.stSide - a.stanceB) * (1 - Math.exp(-dt / .5));
            a.idleT = a.spd < .35 ? (a.idleT || 0) + dt : 0;
            var ht = canHips && vy < .28 && a.idleT > 2.2 ? 1 : 0; a.hipsK = (a.hipsK || 0) + (ht - (a.hipsK || 0)) * (1 - Math.exp(-dt / .35));
            var dx = bx - x, dz = bz - z, rel = 0;
            if (dx * dx + dz * dz > .25) { rel = Math.atan2(dx, dz) - a.yaw; rel = Math.atan2(Math.sin(rel), Math.cos(rel)); rel = clamp(rel, -1.15, 1.15); }
            a.look = (a.look || 0) + (rel - (a.look || 0)) * (1 - Math.exp(-dt / .25));
        }
        /* ===== [gk] KALECİ AKSİYONLARI — yalnızca görüntü (simülasyona/kayda dokunmaz) =====
           Saat CLK = st.clock: SİM saniyesi (canlıda görünen sim zamanı + donma payı, tekrarda kare zamanı). Aksiyon topla AYNI saatte akar:
           1x = 3 sim-sn/sn olduğundan gerçek zamanlı bir plonjon topa 3 kat geç kalırdı; tekrarda (fiziksel 1x, yavaş çekim) da aynı karede oynar.
           Türler (ac.k): 1 kurtarış (geometriden: 1 plonjon / 2 göğüs (W tutuşu) / 3 kepçe / 4 yüksek), 2 havadan alma (sıçrayıp iki elle),
           3 yerden toplama, 4 yuvarlama, 5 omuz üstü atış, 6 vole (elden bırakıp havada vurma), 7 aut için topu yere koyma.
           Kök: kurtarış/alma başladığı anki konum dünyaya kilitlenir (motorun kalecisi o sırada kaysa da plonjon kendi yörüngesini izler), kalkışta
           motor konumuna yumuşakça döner. Temas: temas pozundaki avuç noktası (gerçek iskelet + DQS) kestirilen top noktasına gelecek kök ofseti
           bir kez hesaplanır ("action smuggle", Gameplay Football); erişim sınırlı - uzak topta plonjon kısa kalır, top elin yanından geçer.
           Zamanlama/açı: Gameplay Football anahtar kareleri ve kaleci biyomekaniği (tepki ~0.2 sn, yaylanma-itiş-uçuş temas ~0.31-0.36 sn,
           iniş ~0.15-0.3 sn, yerden kalkış ~0.75 sn; plonjonda karşı bacak iter, dalış tarafı bacak uzanır, üstteki diz bükülü kalır). */
        var FRM = new Float64Array(6), CLK = 0, CLKOK = false, PW_ = 1, GB_HOLD = -1, GK_RD = null, GK_PN = 72, GK_DT = .04, YLIE = -.80;
        var kHi = 0, kTo = 3, kHe = 6, kAL = 9, kFL = 12, kAR = 15, kFR = 18, kLL = 21, kSL = 24, kfL = 27, kLR = 30, kSR = 33, kfR = 36;
        var HOLD_AX = -.5, HOLD_FX = -1.35, HOLD_AZ = .2;                  // top göğüs önünde (iki el, ~1.25 m): kol hafif önde-içe, dirsek ~77° bükük
        var gkDQ = new Float32Array(BODY_BONES.length * 8), gkP = new Float32Array(3), gkQ = new Float32Array(3), gkQ2 = new Float32Array(3);
        var RT = { L: 0, F: 0, Y: 0, lk: 0, yw: 1, hy: 0, ya: 0, gait: 0 };  // aksiyonun kök çıktısı (model çerçevesi: L yan (+X = anatomik sol), F ileri, Y dikey; lk dünyaya kilit, yw yön ağırlığı) · [sp] hy/ya: çerçeveden ayrı gövde yönü (dünya), gait: adım evresi kök hareketinden
        var GB = { ok: false, held: false, lh: -1, x: 0, y: .17, z: 0, rel: 0, rt: 0, ox: 0, oy: 0, oz: 0, tau: .15, arc: 0, h0: 0, vz: 0, tl: 0 };   // görsel top
        var HB_R = BODY_BIND[BB.ForeL], HB_L = BODY_BIND[BB.ForeR];        // anatomik sağ el = 'ForeL' (iskelet adları izleyiciye göre)
        var FB_L = BODY_BIND[BB.FootL], FB_R = BODY_BIND[BB.FootR], CP_T = new Float32Array(3), CP_W = new Float32Array(3), FB_L5 = new Float64Array([FB_L[0], FB_L[1], FB_L[2] + .05]), FB_R5 = new Float64Array([FB_R[0], FB_R[1], FB_R[2] + .05]);   // [vq] temas gölgesi noktaları (geçici)
        function PA(k, ax, ay, az) { var w = PW_; if (ax != null) pose[k] += (ax - pose[k]) * w; if (ay != null) pose[k + 1] += (ay - pose[k + 1]) * w; if (az != null) pose[k + 2] += (az - pose[k + 2]) * w; }
        function rmp(c, a, b) { return b > a ? clamp((c - a) / (b - a), 0, 1) : (c >= b ? 1 : 0); }
        function sm(x) { return smooth01(x); }
        function legDrop(lx, sx, hp) { var al = -lx - hp, be = al - sx; return Math.max(0, .89 - (.45 * Math.cos(al) + .44 * Math.cos(be))); }   // diz bükülünce ayak yerde kalsın: kalçanın inmesi (uyluk .45, baldır .44)
        function angLerp(a, b, t) { var d = b - a; d = Math.atan2(Math.sin(d), Math.cos(d)); return a + d * t; }
        function xform(m, p, o) { var x = p[0], y = p[1], z = p[2]; o[0] = m[0] * x + m[4] * y + m[8] * z + m[12]; o[1] = m[1] * x + m[5] * y + m[9] * z + m[13]; o[2] = m[2] * x + m[6] * y + m[10] * z + m[14]; }
        // tek kemikli DQS noktası (dqsPoint'in w=0 hâli, tahsissiz) - model uzayı
        function dqsPt(dq, bi, px, py, pz, out) {
            var o = bi * 8, r0 = dq[o], r1 = dq[o + 1], r2 = dq[o + 2], r3 = dq[o + 3], d0 = dq[o + 4], d1 = dq[o + 5], d2 = dq[o + 6], d3 = dq[o + 7];
            var cx = r1 * pz - r2 * py + r3 * px, cy = r2 * px - r0 * pz + r3 * py, cz = r0 * py - r1 * px + r3 * pz;
            out[0] = px + 2 * (r1 * cz - r2 * cy) + 2 * (r3 * d0 - d3 * r0 + (r1 * d2 - r2 * d1));
            out[1] = py + 2 * (r2 * cx - r0 * cz) + 2 * (r3 * d1 - d3 * r1 + (r2 * d0 - r0 * d2));
            out[2] = pz + 2 * (r0 * cy - r1 * cx) + 2 * (r3 * d2 - d3 * r2 + (r0 * d1 - r1 * d0));
            return out;
        }
        function dqsPtV(dq, bi, v, out) { return dqsPt(dq, bi, v[0], v[1], v[2], out); }     // [opt] nokta sabit diziden (çağıranda kutulama yok)
        function handsModel(dq) { dqsPt(dq, BB.ForeL, HB_R[0], HB_R[1] - .27, HB_R[2], gkQ); dqsPt(dq, BB.ForeR, HB_L[0], HB_L[1] - .27, HB_L[2], gkQ2); }   // avuç: dirsekten .27 (ön kol ekseni)
        function gkNew(k, t0, tc, d) {
            var o = { k: k, t0: t0, tc: tc, te: tc + 1.6, win: .1, ws: t0, nr: 0, d: new Float32Array(12), init: false, out: 0, v: 0, sgn: 1, rho: 0, hump: 0, armH: -2.4, oL: 0, oF: 0, oY: 0, H: 1, bx: 0, bz: 0, yaw: 0, path: null, rel: false, hand: 1, foot: 1, tl: t0, tland: tc + .2, dy0: null, dx0: 0, dz0: 0 };
            if (d) for (var i = 0; i < 12 && i < d.length; i++) o.d[i] = d[i];
            return o;
        }
        // aksiyon ağırlığı: giriş (kısa) ve çıkış (son .15 sn) karışımı
        function gkW(ac, c) { if (c < ac.t0) return 0; return sm(rmp(c, ac.ws, ac.ws + ac.win)) * (1 - sm(rmp(c, ac.te - .15, ac.te))); }     // [oa] ws: giriş karışımı ilk görünen kareden
        function gkK(a, ac, c, P) {
            RT.L = 0; RT.F = 0; RT.Y = 0; RT.lk = 0; RT.yw = 1; RT.hy = 0; RT.gait = 0;
            switch (ac.k) {
                case 1: if (ac.v === 1) gkDive(a, ac, c, P); else if (ac.v === 4) gkJump(a, ac, c, P); else gkBlock(a, ac, c, P); break;
                case 2: gkJump(a, ac, c, P); break;
                case 3: case 7: gkScoopUp(a, ac, c, P); break;
                case 4: gkRoll(a, ac, c, P); break;
                case 5: gkThrow(a, ac, c, P); break;
                case 6: gkPunt(a, ac, c, P); break;
                case 8: spKick(a, ac, c, P); break;                         // [sp] duran top vuruşu (koşulu)
                case 9: spThrow(a, ac, c, P); break;                        // [sp] taç atışı
                case 10: spWall(a, ac, c, P); break;                        // [sp] baraj
                case 11: oaHead(a, ac, c, P); break;                        // [oa] kafa (sıçrayarak / ayakta)
                case 12: oaTackle(a, ac, c, P); break;                      // [oa] müdahale (ayakta / kayarak / kaçan)
                case 13: oaStumble(a, ac, c, P); break;                     // [oa] sendeleme
                case 14: oaFall(a, ac, c, P); break;                        // [oa] faul sonrası düşme ve kalkış
                case 15: oaReact(a, ac, c, P); break;                       // [oa] faul yapan: durur, itiraz / kart bekler
                case 16: oaCtrl(a, ac, c, P); break;                        // [oa] göğüs / uyluk kontrolü
                case 17: oaBlock(a, ac, c, P); break;                       // [oa] şut bloğu
                case 18: oaKick(a, ac, c, P); break;                        // [oa] canlı oyunda vuruş (sim saatinde)
            }
        }

        /* [v58] Mixamo klipleri: aksiyonun prosedürel kök/zaman planı aynen kalır; kemik pozu klipten, klip zamanı aksiyonun anahtar anlarına
           parça parça doğrusal eşlenir (temas anı ↔ klibin temas karesi). Ayna: klip tek yöne kayıtlı, diğer yön MC_MIR ile. */
        var MXC = {}, MXP = new Float32Array(39), MXR = new Float32Array(3), MX_UP = [0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0];
        function mxSeg(c, G, K) {
            if (c <= G[0]) return K[0];
            for (var i = 1; i < G.length; i++) if (c <= G[i]) { var d = G[i] - G[i - 1]; return d > 1e-6 ? K[i - 1] + (K[i] - K[i - 1]) * (c - G[i - 1]) / d : K[i]; }
            return K[K.length - 1];
        }
        function mxApply(nm, t, mr, mask, wk) {
            if (!mcPose(nm, t, MXP, false, mr)) return false;
            MXC[nm] = (MXC[nm] || 0) + 1;
            var W0 = PW_; PW_ = W0 * (wk == null ? 1 : wk);
            for (var b = 0; b < 13; b++) { if (mask && !mask[b]) continue; PA(b * 3, MXP[b * 3], MXP[b * 3 + 1], MXP[b * 3 + 2]); }
            PW_ = W0; return true;
        }
        function mxRootZ(nm, t, mr) { return mcRoot(nm, t, MXR, mr) ? MXR[2] : 0; }
        function mxOver(a, ac, c, P) {
            var k = ac.k, nm, t, K, G, mr;
            if (k === 1 && ac.v === 1) {                                                    // plonjon: orta/yüksek top → plonjon klibi, alçak top → yere yatarak blok
                if (ac.mxN === undefined) ac.mxN = !(ac.H > 0 && ac.H <= 1.5) ? '' : ac.H < .55 ? 'mx gk block' : 'mx gk dive';
                nm = ac.mxN; if (!nm || !ADO_MOCAP[nm]) return;
                var tla = ac.tland, tli = tla + (ac.out === 1 ? .2 : .42), tri = tli + .72;
                G = [ac.t0, ac.tl, ac.tc, tla, tli, tri];
                K = nm === 'mx gk dive' ? [.40, .60, 1.03, 1.42, 2.15, 3.10] : [.17, .33, .70, .85, 1.30, 2.20];
                mr = nm === 'mx gk dive' ? (ac.sgn > 0 ? 1 : 0) : (ac.sgn < 0 ? 1 : 0);
                if (c >= ac.tc) RT.Y = ac.oY * (1 - sm(rmp(c, ac.tc, tla)));               // yere iniş klipteki kalça yüksekliğiyle (kök yalnız temas yüksekliğinden döner)
                if (!P) return;
                if (mxApply(nm, mxSeg(c, G, K), mr) && pose[1] < -.8) pose[1] = -.8;
                return;
            }
            if (k === 4) {                                                                  // yerden pas (yuvarlama): klip sağ elle; sol el aynada
                nm = 'mx gk roll'; if (!ADO_MOCAP[nm]) return;
                if (!ac.mxI) { ac.mxI = 1; ac.te = Math.max(ac.te, ac.tc + .75); }
                mr = ac.hand > 0 ? 1 : 0; G = [ac.t0, ac.tc, ac.te]; K = [.30, 1.17, 2.30]; t = mxSeg(c, G, K);
                RT.F = .4 * (mxRootZ(nm, t, mr) - mxRootZ(nm, K[0], mr));
                if (P) mxApply(nm, t, mr);
                return;
            }
            if (k === 6) {                                                                  // vole (degaj): klip sağ ayakla
                nm = V7_ON && (a.vary || 0) < .42 && ADO_MOCAP['goalkeeper drop kick'] ? 'goalkeeper drop kick' : 'mx gk punt'; if (!ADO_MOCAP[nm]) return;      // [v187] kalecilerin bir kısmı yarı vole (drop kick)
                if (!ac.mxI) { ac.mxI = 1; ac.te = Math.max(ac.te, ac.tc + .8); }
                mr = ac.foot > 0 ? 1 : 0; G = [ac.t0, ac.tc, ac.te]; K = [Math.max(1.3, 2.12 - (ac.tc - ac.t0)), 2.12, 2.95]; t = mxSeg(c, G, K);
                RT.F = .4 * (mxRootZ(nm, t, mr) - mxRootZ(nm, K[0], mr));
                if (P) mxApply(nm, t, mr);
                return;
            }
            if (k === 11) {                                                                 // kafa: ayakta tam beden; sıçrayarak üst beden (bacaklar sıçramayı taşır)
                nm = 'mx header'; if (!ADO_MOCAP[nm] || !P) return;
                mr = ac.tf > 0 ? 1 : 0; G = [ac.t0, ac.tc, ac.te]; K = [Math.max(0, .5 - (ac.tc - ac.t0)), .5, 1.4];
                var jump = ac.h > .06;
                mxApply(nm, mxSeg(c, G, K), mr, jump ? MX_UP : null, jump ? .85 : 1);
            }
        }
        var gkK0_ = gkK; gkK = function (a, ac, c, P) { gkK0_(a, ac, c, P); if (MX_ON) { try { mxOver(a, ac, c, P); } catch (e) { MX_ON = 0; console.warn('[mx]', e); } } };
        /* aksiyon başlangıcı: kök tabanı (o anki görünen konum) kilitlenir; kurtarış/almada temas noktası ve temas pozundaki avuç noktasından kök ofseti */
        function gkInit(a, ac, x, z) {
            ac.init = true; ac.bx = x; ac.bz = z;
            var d = ac.d, k = ac.k, sc = a.hScale != null ? a.hScale : .98, ws = a.wScale != null ? a.wScale : .98;
            if (k >= 11) { oaInit(a, ac, x, z); return; }                    // [oa] saha oyuncusu aksiyonları
            if (k >= 8) { spInit(a, ac, x, z); return; }                     // [sp] duran toplar
            if (k >= 3) {                                                  // toplama / koyma / oyuna sokma: hedefe dön (yoksa mevcut yön)
                var tx = d[0] - x, tz = d[1] - z; ac.yaw = (k >= 4 && k <= 6 && tx * tx + tz * tz > 1) ? Math.atan2(tx, tz) : a.yaw;
                ac.hand = d[3] < 0 ? -1 : 1; ac.foot = d[4] < 0 ? -1 : 1; ac.win = .12;
                ac.te = k === 3 ? ac.t0 + .6 : k === 7 ? ac.t0 + .7 : k === 4 ? ac.tc + .42 : k === 5 ? ac.tc + .45 : ac.tc + .5;
                return;
            }
            var fx = d[7] - x, fz = d[8] - z; ac.yaw = fx * fx + fz * fz > .04 ? Math.atan2(fx, fz) : a.yaw;
            var cy = Math.cos(ac.yaw), sy = Math.sin(ac.yaw), px, pz, ph, i;
            if (k === 1 && !d[10]) {                                       // şut: yolu motorla aynı fizikle kestir; kalecinin önündeki düzlemi kestiği an/nokta
                if (!ac.path) ac.path = new Float32Array(GK_PN * 3);
                var pp = gkPredict(d[1], d[2], d[3], d[4], d[5], d[6], ac.path, GK_PN), fp = d[9] ? .5 : .32, lf0 = (d[1] - x) * sy + (d[2] - z) * cy, hi = -1, best = 1e9, bi = 0;
                for (i = 0; i < GK_PN; i++) {
                    var qx = pp[i * 3] - x, qz = pp[i * 3 + 1] - z, f = qx * sy + qz * cy;
                    if (f <= fp) { hi = i; break; }
                    var ld = Math.abs(qx * cy - qz * sy) + f; if (ld < best) { best = ld; bi = i; }
                    lf0 = f;
                }
                if (hi >= 0) {
                    var f1 = (pp[hi * 3] - x) * sy + (pp[hi * 3 + 1] - z) * cy, u = lf0 > f1 ? clamp((lf0 - fp) / (lf0 - f1), 0, 1) : 1;
                    var ax0 = hi > 0 ? pp[hi * 3 - 3] : d[1], az0 = hi > 0 ? pp[hi * 3 - 2] : d[2], ah0 = hi > 0 ? pp[hi * 3 - 1] : d[3];
                    px = ax0 + (pp[hi * 3] - ax0) * u; pz = az0 + (pp[hi * 3 + 1] - az0) * u; ph = ah0 + (pp[hi * 3 + 2] - ah0) * u;
                    ac.tc = d[0] + (hi - 1 + u) * GK_DT;
                } else { px = pp[bi * 3]; pz = pp[bi * 3 + 1]; ph = pp[bi * 3 + 2]; ac.tc = d[0] + bi * GK_DT; }
            } else { px = d[1]; pz = d[2]; ph = d[3]; if (k === 2) { px = d[0]; pz = d[1]; ph = d[2]; } }
            if (ac.tc < ac.t0 + .14) ac.tc = ac.t0 + .14;                  // topa yetişemeyen (geç kalmış) refleks: en az ~.14 sn'lik hamle
            var qx2 = px - x, qz2 = pz - z, lx = qx2 * cy - qz2 * sy, lf = qx2 * sy + qz2 * cy, H = ph + .17, D = Math.abs(lx), sg = lx >= 0 ? 1 : -1;
            ac.sgn = sg; ac.H = H;
            var v = k === 2 ? 4 : (D < .55 || (D < .95 && H > 1.75)) ? (H < .8 ? 3 : H < 1.75 ? 2 : 4) : 1;
            ac.v = v; ac.win = v === 1 ? .06 : .1;
            ac.rho = (H > 1.9 ? .62 : H > 1.25 ? .9 : H > .6 ? 1.12 : 1.36) + clamp((D - 1.6) * .08, -.12, .1);
            ac.hump = v === 1 && H > 1.0 ? .1 + .08 * clamp(H - 1, 0, 1) : 0;
            ac.armH = v === 2 ? -Math.acos(clamp((1.45 * sc - H) / (.62 * sc), -1, 1)) : -(2.4 + clamp((H - 2.1) * .8, 0, .5));
            var Tc = ac.tc - ac.t0;
            ac.tl = ac.t0 + (v === 1 && Tc > .22 ? Math.min(.16, .32 * Tc) : 0);
            ac.tland = ac.tc + (H > 1.6 ? .3 : H > .8 ? .22 : .14);
            ac.te = v === 1 ? ac.tland + 1.2 : ac.tc + .6;
            // temas pozundaki avuç orta noktası (model uzayı)
            var o0 = ac.out; ac.out = 0; pose.fill(0); PW_ = 1; gkK(a, ac, ac.tc - 1e-4, true); ac.out = o0;
            bodyDQ(pose, gkDQ); handsModel(gkDQ);
            var hx = (gkQ[0] + gkQ2[0]) * .5 * ws, hy = (gkQ[1] + gkQ2[1]) * .5 * sc, hz = (gkQ[2] + gkQ2[2]) * .5 * ws;
            if (v === 1) {                                                 // plonjon: avuç topun yakın yüzüne
                ac.oL = sg * clamp(sg * (lx - sg * .12 - hx), -.3, 1.75 * sc); ac.oF = clamp(lf - hz, -.4, d[9] ? 1.5 : 1.0); ac.oY = clamp(H - hy, -.85, .5);
            } else if (v === 4) {                                          // sıçrama: yatayda topun altına (havadan almada 1-2 adım), dikeyde gereken sıçrama
                var rg = k === 2 ? 3.2 : .6; ac.oL = clamp(lx - hx, -rg, rg); ac.oF = clamp(lf - .1 - hz, -rg, rg); ac.oY = clamp(H - hy, 0, .55);
            } else { ac.oL = clamp(lx - hx, -.45, .45); ac.oF = clamp(lf - .1 - hz, -.3, .7); ac.oY = 0; }
        }
        /* plonjon: yükleme (güç adımı) → itiş+uçuş (yana yatış, kollar baş üstünden topa) → iniş (yan yatış; tutuşta top göğse) → yerde → kalkış */
        function gkDive(a, ac, c, P) {
            var sg = ac.sgn, AA = sg > 0 ? kAR : kAL, AT = sg > 0 ? kAL : kAR, FA = AA + 3, FT = AT + 3, LA = sg > 0 ? kLR : kLL, LT = sg > 0 ? kLL : kLR, SA = LA + 3, ST = LT + 3;
            var tl = ac.tl, tc = ac.tc, tla = ac.tland, ca = ac.out === 1, tli = tla + (ca ? .2 : .42), tri = tli + .72, oL = ac.oL, oF = ac.oF, oY = ac.oY;
            var s, u, e, roll;
            ac.te = tri; RT.lk = 1;
            if (c < tl) {                                                  // yükleme: dalış tarafına kısa güç adımı, dizler yaylanır, kollar öne-yukarı
                s = sm(rmp(c, ac.t0, tl)); RT.L = sg * .14 * s; RT.F = .05 * s;
                if (P) {
                    var dr0 = legDrop(-.45, .85, .1) * s;
                    PA(kHi, .10, -dr0, -sg * .06 * s); PA(kTo, .28, 0, 0); PA(kHe, -.12, 0, 0);
                    PA(AA, -.6 - .45 * s, 0, sg * .3); PA(AT, -.6 - .45 * s, 0, -sg * .3); PA(FA, -.85, 0, 0); PA(FT, -.85, 0, 0);
                    PA(LA, -.45, 0, sg * (.08 + .14 * s)); PA(SA, .85, 0, 0); PA(LT, -.45, 0, -sg * .1); PA(ST, .85 + .15 * s, 0, 0); PA(kfL, 0, 0, 0); PA(kfR, 0, 0, 0);
                }
                return;
            }
            if (c < tc) {                                                  // itiş + uçuş
                u = rmp(c, tl, tc); e = sm(u); var eo = 1 - (1 - u) * (1 - u);
                RT.L = sg * .14 + (oL - sg * .14) * e; RT.F = .05 + (oF - .05) * e; RT.Y = oY * e + ac.hump * Math.sin(Math.PI * u);
                if (P) {
                    roll = .06 + (ac.rho - .06) * eo; var dr1 = legDrop(-.45, .85, .1) * (1 - e);
                    PA(kHi, .10 + .06 * e, -dr1, -sg * roll); PA(kTo, .28 - .16 * e, sg * .1 * e, -sg * .2 * e); PA(kHe, -.12 + .04 * e, sg * .3 * e, 0);
                    PA(AA, -1.05 - 1.8 * e, 0, sg * (.3 - .2 * e)); PA(AT, -1.05 - 1.55 * e, 0, sg * (-.3 + .62 * e)); PA(FA, -.85 + .75 * e, 0, 0); PA(FT, -.85 + .62 * e, 0, 0);
                    PA(LA, -.45 + .25 * e, 0, sg * (.22 - .1 * e)); PA(SA, .85 - .7 * e, 0, 0); PA(LT, -.45 - .25 * e, 0, -sg * .1); PA(ST, 1.0 + .05 * e, 0, 0); PA(kfL, .35 * e, 0, 0); PA(kfR, .35 * e, 0, 0);
                }
                return;
            }
            var L1 = oL + sg * .22, F1 = oF + .06;
            if (c < tli) {                                                 // iniş ve yerde: yan yatış (kalça ~.18 m); tutuşta top göğse çekilir
                u = rmp(c, tc, tla); e = sm(u);
                RT.L = oL + sg * .22 * e; RT.F = oF + .06 * e; RT.Y = oY + (YLIE - oY) * e;
                if (P) {
                    roll = ac.rho + (1.5 - ac.rho) * e; var g2 = ca ? sm(rmp(c, tc, tc + .2)) : 0;
                    PA(kHi, .16 + .08 * e, 0, -sg * roll); PA(kTo, .12, sg * .1, -sg * (.2 - .08 * e)); PA(kHe, -.08, sg * .3, 0);
                    var aA = -2.85 + .4 * e, aT = -2.6 + .35 * e;
                    PA(AA, aA + (HOLD_AX - aA) * g2, 0, sg * (.1 - (.1 + HOLD_AZ) * g2)); PA(AT, aT + (HOLD_AX - aT) * g2, 0, sg * (.32 - (.32 - HOLD_AZ) * g2));
                    PA(FA, -.1 + (HOLD_FX + .1) * g2, 0, 0); PA(FT, -.23 + (HOLD_FX + .23) * g2, 0, 0);
                    PA(LA, -.2 - .1 * e, 0, sg * .12); PA(SA, .15 + .2 * e, 0, 0); PA(LT, -.7 + .25 * e, 0, -sg * .1); PA(ST, 1.05 - .3 * e, 0, 0); PA(kfL, .35, 0, 0); PA(kfR, .35, 0, 0);
                }
                return;
            }
            // kalkış: yan yatıştan dizlere, yarım diz çökmeye, ayağa (~0.72 sn); kök motor konumuna döner
            u = rmp(c, tli, tri); e = sm(u); RT.lk = 1; RT.L = L1; RT.F = F1;                  // düştüğü yerde kalkar; motor konumuna dönüşü bitişte yürüyerek (artık ofset)
            var uA = sm(u / .4), uB = sm((u - .35) / .35), uC = sm((u - .7) / .3);
            RT.Y = YLIE + (-.43 - YLIE) * uA + .15 * uB + .28 * uC;
            if (P) {
                roll = 1.5 * (1 - sm(u / .5));
                PA(kHi, .24 + .3 * uA - .25 * uB - .29 * uC, 0, -sg * roll);
                PA(kTo, .12 + .3 * uA - .2 * uB - .22 * uC, sg * .1 * (1 - uA), -sg * .12 * (1 - uA)); PA(kHe, -.08 - .1 * uA + .18 * uC, sg * .3 * (1 - uA), 0);
                if (ca) { PA(AA, HOLD_AX, 0, -sg * HOLD_AZ); PA(AT, HOLD_AX, 0, sg * HOLD_AZ); PA(FA, HOLD_FX, 0, 0); PA(FT, HOLD_FX, 0, 0); }
                else { var ar = -2.4 + 1.9 * uA; PA(AA, ar, 0, sg * .15); PA(AT, ar, 0, sg * (.32 - .47 * uA)); PA(FA, -.1 - .2 * uA, 0, 0); PA(FT, -.23 - .07 * uA, 0, 0); }
                // diz çökme → dalış tarafı bacak öne basar (yarım diz) → ayağa
                PA(LT, (-.45 + .15 * uA) * (1 - uC), 0, -sg * .1 * (1 - uA)); PA(ST, (.75 + .6 * uA) * (1 - uC), 0, 0);
                PA(LA, (-.3 - 1.05 * uB) * (1 - uC), 0, sg * .12 * (1 - uA)); PA(SA, (.35 + 1.0 * uA + .1 * uB) * (1 - uC), 0, 0);
                PA(kfL, (.35 - .15 * uA) * (1 - uC), 0, 0); PA(kfR, (.35 - .15 * uA) * (1 - uC), 0, 0);
            }
        }
        /* plonjonsuz kurtarış: 2 göğüs (W tutuşu; vücut topun arkasında), 3 kepçe (diz bükülür, avuçlar topun altına) - tutunca top göğse */
        function gkBlock(a, ac, c, P) {
            var tc = ac.tc, ca = ac.out === 1;
            ac.te = tc + (ca ? .32 : .45); RT.lk = 1;
            var e = sm(rmp(c, ac.t0, tc)), g = sm(rmp(c, tc, tc + .22));
            RT.L = ac.oL * e; RT.F = ac.oF * e;
            if (!P) return;
            if (ac.v === 3) {
                var k = e * (1 - g * .7), dr = legDrop(-.95 * k, 1.25 * k, .3 * k), hg = ca ? g : 0;
                PA(kHi, .3 * k, -dr, 0); PA(kTo, .75 * k + .06 * g, 0, 0); PA(kHe, -.25 * k, 0, 0);
                PA(kLL, -.95 * k, 0, -.12); PA(kLR, -.95 * k, 0, .12); PA(kSL, 1.25 * k, 0, 0); PA(kSR, 1.25 * k, 0, 0); PA(kfL, -.2 * k, 0, 0); PA(kfR, -.2 * k, 0, 0);
                var ax0 = -1.0 * (1 - hg) + HOLD_AX * hg, fx0 = -.3 * (1 - hg) + HOLD_FX * hg;
                PA(kAL, ax0, 0, .14); PA(kAR, ax0, 0, -.14); PA(kFL, fx0, 0, 0); PA(kFR, fx0, 0, 0);
            } else {
                var k2 = ca ? g : 0, dr2 = legDrop(-.3, .45, .1) * e;
                PA(kHi, .1 * e, -dr2, 0); PA(kTo, .15 * e, 0, 0); PA(kHe, -.1 * e, 0, 0);
                PA(kLL, -.3 * e, 0, -.1); PA(kLR, -.3 * e, 0, .1); PA(kSL, .45 * e, 0, 0); PA(kSR, .45 * e, 0, 0);
                var axc = -.55 + (ac.armH + .55) * e, fxc = -.9 + .35 * e;
                axc += (HOLD_AX - axc) * k2; fxc += (HOLD_FX - fxc) * k2;
                PA(kAL, axc, 0, HOLD_AZ * .8); PA(kAR, axc, 0, -HOLD_AZ * .8); PA(kFL, fxc, 0, 0); PA(kFR, fxc, 0, 0);
            }
        }
        /* sıçrayarak yakalama (yüksek top / havadan alma): yaklaşma → yaylanma (kollar geride) → tek ayak sıçrama, koruyucu diz kalkık, kollar
           tam yukarı → en yüksek noktada iki elle → top göğse → dizler bükülerek iniş */
        function gkJump(a, ac, c, P) {
            var tc = ac.tc, tk = Math.max(ac.t0 + .05, tc - .24), tld = tc + .26, ca = ac.out === 1;
            ac.te = tld + .3; RT.lk = 1;
            var ea = sm(rmp(c, ac.t0, tk)); RT.L = ac.oL * ea; RT.F = ac.oF * ea;
            var uf = rmp(c, tk, tld); if (c >= tk && c < tld) RT.Y = 4 * ac.oY * uf * (1 - uf);
            if (!P) return;
            var sg = ac.sgn, KN = sg > 0 ? kLL : kLR, KS = KN + 3, PL = sg > 0 ? kLR : kLL, PS = PL + 3, D0 = legDrop(-.4, .9, .1), knz = KN === kLL ? -.08 : .08;
            if (c < tk) {                                                  // yaklaşma + yaylanma: diz bükülür, kollar geriye
                var lo = sm(rmp(c, tk - .16, tk));
                PA(kHi, .1 * lo, -D0 * lo, 0); PA(kTo, .15 * lo, 0, 0); PA(kHe, -.2 * lo, 0, 0);
                PA(KN, -.4 * lo, 0, knz); PA(PL, -.4 * lo, 0, -knz); PA(KS, .9 * lo, 0, 0); PA(PS, .9 * lo, 0, 0);
                var ar0 = -.9 + 1.3 * lo; PA(kAL, ar0, 0, -.25 + .35 * lo); PA(kAR, ar0, 0, .25 - .35 * lo); PA(kFL, -.7, 0, 0); PA(kFR, -.7, 0, 0);
                return;
            }
            var g = ca ? sm(rmp(c, tc + .02, tc + .2)) : 0;
            if (c < tld) {                                                 // uçuş: itiş bacağı uzanır, koruyucu diz kalkar, kollar tam yukarı; tutunca göğse
                var up = sm(rmp(c, tk, tk + .13)), dn = 1 - up;
                PA(kHi, .1 * dn - .05 * up, -D0 * dn, 0); PA(kTo, .15 * dn - .12 * up + .25 * g, 0, 0); PA(kHe, -.2 - .15 * up + .3 * g, 0, 0);
                PA(KN, -.4 - .85 * up, 0, knz); PA(KS, .9 + .6 * up, 0, 0); PA(PL, -.4 + .35 * up, 0, -knz); PA(PS, .9 - .78 * up, 0, 0); PA(kfL, .3 * up, 0, 0); PA(kfR, .3 * up, 0, 0);
                var axj = .4 + (ac.armH - .4) * up, fxj = -.7 + .5 * up; axj += (HOLD_AX - axj) * g; fxj += (HOLD_FX - fxj) * g;
                PA(kAL, axj, 0, .1 + (HOLD_AZ - .1) * g); PA(kAR, axj, 0, -.1 - (HOLD_AZ - .1) * g); PA(kFL, fxj, 0, 0); PA(kFR, fxj, 0, 0);
                return;
            }
            var ul = rmp(c, tld, ac.te), a1 = sm(ul / .35), k = 1 - sm((ul - .35) / .65), ldl = legDrop(-.35, .8, .1) * a1 * k;   // iniş: dizler darbeyi emer, toparlanır
            PA(kHi, (.1 * a1 - .05 * (1 - a1)) * k, -ldl, 0); PA(kTo, (.2 * a1 + (-.12 + .25 * g) * (1 - a1)) * k, 0, 0); PA(kHe, (-.1 * a1 + (-.35 + .3 * g) * (1 - a1)) * k, 0, 0);
            PA(KN, (-1.25 + .9 * a1) * k, 0, knz); PA(KS, (1.5 - .7 * a1) * k, 0, 0); PA(PL, (-.05 - .3 * a1) * k, 0, -knz); PA(PS, (.12 + .68 * a1) * k, 0, 0); PA(kfL, .3 * (1 - a1), 0, 0); PA(kfR, .3 * (1 - a1), 0, 0);
            if (ca) { PA(kAL, HOLD_AX, 0, HOLD_AZ); PA(kAR, HOLD_AX, 0, -HOLD_AZ); PA(kFL, HOLD_FX, 0, 0); PA(kFR, HOLD_FX, 0, 0); }
            else { var al = ac.armH + (-.45 - ac.armH) * a1; PA(kAL, al * k, 0, .1 - .3 * a1); PA(kAR, al * k, 0, -.1 + .3 * a1); PA(kFL, -.2 - .4 * a1, 0, 0); PA(kFR, -.2 - .4 * a1, 0, 0); }
        }
        /* 3 yerden toplama (çömel, avuçlar yerde topun altına, göğse kaldır) · 7 aut için topu yere koyma (eğil, bırak, doğrul) */
        function gkScoopUp(a, ac, c, P) {
            if (!P) return;
            var dn = ac.t0 + .26, up = ac.te, d1 = sm(rmp(c, ac.t0, dn)), d2 = sm(rmp(c, dn, up)), k = d1 * (1 - d2);
            var dr = legDrop(-.95 * k, 1.25 * k, .3 * k), hold = ac.k === 3 ? d2 : 0;
            PA(kHi, .3 * k, -dr, 0); PA(kTo, .8 * k, 0, 0); PA(kHe, -.25 * k, 0, 0);
            PA(kLL, -.95 * k, 0, -.12); PA(kLR, -.95 * k, 0, .12); PA(kSL, 1.25 * k, 0, 0); PA(kSR, 1.25 * k, 0, 0);
            var ax = -1.0 * k + HOLD_AX * hold, fx = -.25 * k + HOLD_FX * hold;
            PA(kAL, ax, 0, .14 * k + HOLD_AZ * hold); PA(kAR, ax, 0, -.14 * k - HOLD_AZ * hold); PA(kFL, fx, 0, 0); PA(kFR, fx, 0, 0);
        }
        /* yuvarlama (kısa): bowling atışı - karşı bacak öne uzun adım, arka diz yere yakın, atan kol geriden yere paralel öne; bırakış öndeki ayağın yanında */
        function gkRoll(a, ac, c, P) {
            var tr = ac.tc, t1 = tr - .17, e = sm(rmp(c, ac.t0, t1)), f = sm(rmp(c, t1, tr)), g = sm(rmp(c, tr, ac.te - .12));
            RT.F = .28 * e;
            if (!P) return;
            var R_ = ac.hand > 0, TA = R_ ? kAL : kAR, TF = TA + 3, OA = R_ ? kAR : kAL, OF = OA + 3, FLg = R_ ? kLR : kLL, FSh = FLg + 3, BLg = R_ ? kLL : kLR, BSh = BLg + 3, hz = R_ ? -1 : 1;
            var k = e * (1 - .55 * g), dr = legDrop(-1.15 * k, 1.45 * k, .2 * k);
            PA(kHi, .2 * k, -dr, 0); PA(kTo, .8 * k, hz * .25 * e * (1 - f) - hz * .15 * f, 0); PA(kHe, -.45 * k, 0, 0);
            PA(FLg, -1.15 * k, 0, 0); PA(FSh, 1.45 * k, 0, 0); PA(BLg, .2 * k, 0, 0); PA(BSh, 1.45 * k, 0, 0);
            var ax = .75 * e - .9 * f - 1.0 * g;
            PA(TA, ax, 0, hz * .12); PA(TF, -.15, 0, 0); PA(OA, -.6 * e, 0, -hz * .3); PA(OF, -.6, 0, 0);
        }
        /* omuz üstü (cirit) atış (orta mesafe): yan duruş, atan omuz geride, top başın arkasında → omuz üstünden kamçı → gövde öne katlanır */
        function gkThrow(a, ac, c, P) {
            var tr = ac.tc, t1 = tr - .15, e = sm(rmp(c, ac.t0, t1)), f = sm(rmp(c, t1, tr)), g = sm(rmp(c, tr, ac.te - .12));
            RT.F = .22 * e + .12 * f;
            if (!P) return;
            var R_ = ac.hand > 0, TA = R_ ? kAL : kAR, TF = TA + 3, OA = R_ ? kAR : kAL, OF = OA + 3, FLg = R_ ? kLR : kLL, FSh = FLg + 3, BLg = R_ ? kLL : kLR, BSh = BLg + 3, hz = R_ ? -1 : 1;
            var tw = hz * .45 * e * (1 - f) - hz * .3 * f * (1 - .5 * g);
            PA(kHi, .05, 0, 0); PA(kTo, -.18 * e * (1 - f) + .45 * f * (1 - .3 * g), tw, 0); PA(kHe, .1 * e, -tw * .6, 0);
            var ax = -2.45 * e + .45 * f + 1.15 * g, fx = -1.7 * e + 1.55 * f;
            PA(TA, ax, 0, hz * .35 * (1 - f)); PA(TF, fx, 0, 0);
            PA(OA, -1.4 * e * (1 - f) - .4 * f, 0, -hz * .2); PA(OF, -.5, 0, 0);
            PA(FLg, -.45 * e, 0, 0); PA(FSh, .25 * e, 0, 0); PA(BLg, .25 * e * (1 - f), 0, 0); PA(BSh, .35 * e, 0, 0);
        }
        /* vole (uzun / yüksek): top iki elle bel hizasında önde → bırak (düşer) → vuruş bacağı geri → diz hizasında temas (uyluk ~43° önde, diz
           neredeyse açık, üst ayak gergin) → yüksek takip, gövde geriye */
        function gkPunt(a, ac, c, P) {
            var tr = ac.tc, td = tr - .38, tb = tr - .12, e = sm(rmp(c, ac.t0, td)), r = sm(rmp(c, td, td + .1)), g = sm(rmp(c, tr, ac.te - .1));
            RT.F = .35 * sm(rmp(c, ac.t0, tr));
            if (!P) return;
            var R_ = ac.foot > 0, KL = R_ ? kLL : kLR, KS = KL + 3, SL = R_ ? kLR : kLL, SS = SL + 3, hz = R_ ? -1 : 1, lg, kn;
            if (c < td) { lg = 0; kn = .1 * e; }
            else if (c < tb) { var b = sm(rmp(c, td, tb)); lg = .75 * b; kn = .1 + 1.2 * b; }
            else if (c < tr) { var h = rmp(c, tb, tr); lg = .75 - 1.5 * h * h; kn = 1.3 - 1.05 * Math.min(1, h * 1.2); }
            else { lg = -.75 - 1.0 * g; kn = .25 - .15 * g; }
            var pt = sm(rmp(c, tb - .08, tb)); PA(KL, lg, 0, 0); PA(KS, kn, 0, 0); PA(SL, -.2 * e, 0, 0); PA(SS, .35 * e, 0, 0); PA(KL + 6, .45 * pt, 0, 0);
            PA(kHi, 0, -legDrop(-.2 * e, .35 * e, 0), 0);
            PA(kTo, .12 * e - .35 * g, hz * .12 * sm(rmp(c, tb - .1, tr)), 0);
            var hd = 1 - r;
            PA(kAL, -.6 * hd - .5 * r, 0, .2 * hd - .9 * r); PA(kAR, -.6 * hd - .5 * r, 0, -.2 * hd + .9 * r); PA(kFL, -.65 * hd - .6 * r, 0, 0); PA(kFR, -.65 * hd - .6 * r, 0, 0);
        }
        /* hazır duruş (kaleci set pozisyonu): dizler bükük, ağırlık ayak önünde, gövde öne, eller açık bel önünde; yana kayarken çapraz adım yok -
           bacaklar sırayla açılıp kapanır (yan adım / shuffle) */
        function gkReadyPose(a, w) {
            PW_ = w;
            var lt = clamp(Math.abs(a.latV || 0) / 2.2, 0, 1), s = Math.sin(a.ph || 0), sp = Math.max(0, s), sn = Math.max(0, -s);
            PA(kHi, .14, -legDrop(-.5, .95, .14), 0); PA(kTo, .32, null, 0); PA(kHe, -.18, null, 0);
            PA(kAL, -.5, 0, -.36); PA(kAR, -.5, 0, .36); PA(kFL, -.95, 0, 0); PA(kFR, -.95, 0, 0);
            PA(kLL, -.5 - .12 * lt * sp, -.08, -.11 - .2 * lt * sp); PA(kLR, -.5 - .12 * lt * sn, .08, .11 + .2 * lt * sn);
            PA(kSL, .95 + .3 * lt * sp, 0, 0); PA(kSR, .95 + .3 * lt * sn, 0, 0); PA(kfL, -.12, 0, 0); PA(kfR, -.12, 0, 0);
        }
        function gkHoldPose(w) { PW_ = w; PA(kAL, HOLD_AX, 0, HOLD_AZ); PA(kAR, HOLD_AX, 0, -HOLD_AZ); PA(kFL, HOLD_FX, 0, 0); PA(kFR, HOLD_FX, 0, 0); PA(kTo, .08, null, null); }
        /* [vq] zemin kısıtı: poz hesaplandıktan sonra uç noktalar zeminin altındaysa eklem açıları en küçük düzeltmeyle yukarı alınır (Gauss-Newton,
           sayısal gradyan, en çok 4 adım, adım başına ≤ .45 rad). Zincir: ebeveyn (gövde / kalça) → üst kemik → alt kemik (→ ayak). Tahsissiz. */
        var GF_ON = 1, GF_H = m4(), GF_T = m4(), GF_A = m4(), GF_F = m4(), GF_E = m4(), GF_X = m4(), GF_RY = 0, GF_SC = 1, GF_G0 = 0, GF_G1 = 0, GF_G2 = 0;
        function gfLoc(o, b) { var t = BODY_BONES[b][2], k = b * 3; return b === 0 ? mtrs(o, t[0], t[1] + pose[1], t[2], pose[0], 0, pose[2], 1) : mtrs(o, t[0], t[1], t[2], pose[k], pose[k + 1], pose[k + 2], 1); }
        function gfEval(P, b, n) { gfLoc(GF_X, b); mmul(GF_A, P, GF_X); gfLoc(GF_X, b + 1); mmul(GF_F, GF_A, GF_X); if (n > 2) { gfLoc(GF_X, b + 2); mmul(GF_E, GF_F, GF_X); } }
        // q: 0 dirsek/diz (alt kemik başı), 1 avuç, 2 bilek, 3 ayak ucu, 4 topuk (bkz R._jw tanımları) → dünya yüksekliği
        function gfQ(q) {
            var m = q < 2 ? GF_F : GF_E, x = 0, y = 0, z = 0;
            if (q === 1) y = -.30; else if (q === 3) { y = -.06; z = .17; } else if (q === 4) { y = -.07; z = -.05; }
            return GF_RY + GF_SC * (m[1] * x + m[5] * y + m[9] * z + m[13]);
        }
        function gfSolve(q, y0, P, b, n, j0, j1, j2) {
            for (var it = 0; it < 4; it++) {
                gfEval(P, b, n); var y = gfQ(q), d = y0 - y, s, gg = 0;
                if (it === 0 ? d <= .004 : d <= .001) return;                   // eşik payı: yere basan ayakta titreşim yok
                GF_G0 = GF_G1 = GF_G2 = 0;
                if (j0 >= 0) { s = pose[j0]; pose[j0] = s + .03; gfEval(P, b, n); GF_G0 = (gfQ(q) - y) / .03; pose[j0] = s; }
                if (j1 >= 0) { s = pose[j1]; pose[j1] = s + .03; gfEval(P, b, n); GF_G1 = (gfQ(q) - y) / .03; pose[j1] = s; }
                if (j2 >= 0) { s = pose[j2]; pose[j2] = s + .03; gfEval(P, b, n); GF_G2 = (gfQ(q) - y) / .03; pose[j2] = s; }
                gg = GF_G0 * GF_G0 + GF_G1 * GF_G1 + GF_G2 * GF_G2;
                if (gg < 4e-3) {                                            // uç noktası yayın en altında (gradyan ~0): ilk eklemi iki yöne .35 rad dene, iyisini al
                    s = pose[j0]; pose[j0] = s + .35; gfEval(P, b, n); var ya = gfQ(q); pose[j0] = s - .35; gfEval(P, b, n); var yb = gfQ(q);
                    pose[j0] = ya >= yb ? s + .35 : s - .35; if (Math.max(ya, yb) <= y) { pose[j0] = s; return; } continue;
                }
                var kk = 1.1 * d / gg;
                if (j0 >= 0) pose[j0] += clamp(kk * GF_G0, -.45, .45); if (j1 >= 0) pose[j1] += clamp(kk * GF_G1, -.45, .45); if (j2 >= 0) pose[j2] += clamp(kk * GF_G2, -.45, .45);
            }
        }
        function groundFix(a) {
            GF_RY = a.rY || 0; GF_SC = a.hScale != null ? a.hScale : .98;
            gfLoc(GF_H, 0); gfLoc(GF_X, 1); mmul(GF_T, GF_H, GF_X);
            var s, b, k;
            for (s = 0; s < 2; s++) {                                       // kollar: dirsek ≥ .055 (omuz), avuç ≥ .035 (dirsek, sonra omuz + dirsek)
                b = s ? 5 : 3; k = b * 3;
                gfSolve(0, .055, GF_T, b, 2, k, k + 2, -1); gfSolve(1, .035, GF_T, b, 2, k + 3, -1, -1); gfSolve(1, .035, GF_T, b, 2, k, k + 2, k + 3);
            }
            for (s = 0; s < 2; s++) {                                       // bacaklar: diz ≥ .06 (kalça), bilek ≥ .072 (diz + kalça; ayakta bağ yüksekliği .07), ayak ucu/topuk ≥ .004 (ayak bileği)
                b = s ? 10 : 7; k = b * 3;
                gfSolve(0, .06, GF_H, b, 3, k, -1, -1); gfSolve(2, .072, GF_H, b, 3, k + 3, k, -1);
                gfSolve(3, .004, GF_H, b, 3, k + 6, -1, -1); gfSolve(4, .004, GF_H, b, 3, k + 6, -1, -1); gfSolve(3, .004, GF_H, b, 3, k + 6, -1, -1);
            }
        }
        function gkPose(a) {
            var c = CLK, cur = a.ac, prv = a.acP, wp = 0, wc = 0;
            if (prv && prv.init) wp = gkW(prv, c);
            if (cur && cur.init && c >= cur.t0) wc = gkW(cur, c);
            var wa = Math.max(wp, wc), rk = (a.readyK || 0) * (1 - wa), hk = (a.holdK || 0) * (1 - wa);
            if (rk > .002) gkReadyPose(a, rk);
            if (hk > .002) gkHoldPose(hk);
            if (wp > .001) { PW_ = wp; gkK(a, prv, c, true); }
            if (wc > .001) { PW_ = wc; gkK(a, cur, c, true); }
            PW_ = 1;
            // [vq] zemin kısıtı: hazır duruş/tutuş ve aksiyonlarda (duran top / canlı vuruşlar hariç: temas pozu kestirimle hizalı kalsın)
            if (GF_ON && !(wc > .001 && (cur.k === 8 || cur.k === 18)) && !(wp > .001 && (prv.k === 8 || prv.k === 18))) groundFix(a);
        }
        // konum yalnızca giriş karışımıyla (çıkışta kayma olmasın: bitişte kalan fark yürüyerek kapanan artık ofsete devredilir), yön tam ağırlıkla
        function gkRootApply(a, ac, x, z, w, c) {
            var cy = Math.cos(ac.yaw), sy = Math.sin(ac.yaw), lk = RT.lk, wi = sm(rmp(c, ac.ws, ac.ws + ac.win));
            var bx = lk * ac.bx + (1 - lk) * x + RT.L * cy + RT.F * sy, bz = lk * ac.bz + (1 - lk) * z - RT.L * sy + RT.F * cy;
            if (!ac.nr) { a.dX += (bx - a.dX) * wi; a.dZ += (bz - a.dZ) * wi; }      // [oa] nr: kökü artık ofsete devredilmiş önceki aksiyon (yalnız poz/yükseklik/yön)
            a.rY += (RT.Y - a.rY) * w; a.dYaw = angLerp(a.dYaw, RT.hy ? RT.ya : ac.yaw, w * RT.yw);     // [fix] kök yüksekliği ve gövde yönü (p27 yorumu bu atamayı yoruma almıştı)
        }
        /* kare başı: hazır duruş/elde tutuş karışımları, aksiyon başlangıcı, kök ofseti → çizim konumu a.dX/a.dZ, yön a.dYaw, kök yüksekliği a.rY */
        /* [oa] önceki aksiyonun görünen kök farkı artık ofsete (yürüyerek söner); aksiyonun kökü bundan sonra uygulanmaz (ac.nr) */
        function gkHand(a, ac, c, x, z) {
            gkK(a, ac, c, false); a.dX = x; a.dZ = z; gkRootApply(a, ac, x, z, 1, c);
            var ox = a.dX - x, oz = a.dZ - z; a.rOx = (a.rOx || 0) + ox; a.rOz = (a.rOz || 0) + oz; a.px += ox; a.pz += oz; ac.nr = 1;
            a.dX = x + ox; a.dZ = z + oz; a.rY = 0; a.dYaw = a.yaw;
        }
        function gkUpdate(a, i) {
            var x = a.px, z = a.pz, dt = FRM[2];                               // [opt] çizim konumu ve kare süresi (argüman kutulaması yok)
            if (a.acQ && a.acQ.length && CLKOK && CLK >= a.acQ[0].t0) { var q0 = a.acQ.shift(), cu0 = a.ac; a.acP = (cu0 && cu0.init && CLK >= cu0.t0 && CLK < cu0.te) ? cu0 : (a.acP && a.acP.init && CLK < a.acP.te ? a.acP : null); a.ac = q0; }      // [v187] sıradaki aksiyon
            a.dX = x; a.dZ = z; a.dYaw = a.yaw; a.rY = 0;
            var held = i === GB_HOLD, rt = CLKOK && GK_RD ? (GK_RD[i] || 0) : 0, dts = clamp(CLK - (a.gkC > -1e9 ? a.gkC : CLK), 0, .25); a.gkC = CLK;
            if (a.rOx || a.rOz) {                                          // artık ofset: aksiyon bittiği yerden motor konumuna yürüyerek (mesafeyle hızlanan, ≤ 2.8 m/sn)
                var rl = Math.hypot(a.rOx, a.rOz), st0 = Math.min(rl, dts * clamp(rl * 2.2, .6, 2.8));
                if (rl - st0 < .01 || !CLKOK) { a.rOx = 0; a.rOz = 0; } else { a.rOx *= (rl - st0) / rl; a.rOz *= (rl - st0) / rl; }
            }
            a.readyK = (a.readyK || 0) + (rt - (a.readyK || 0)) * (1 - Math.exp(-dt / .2));
            a.holdK = (a.holdK || 0) + ((held ? 1 : 0) - (a.holdK || 0)) * (1 - Math.exp(-dt / .09));
            a.needHand = held; a.acW = 0; a.gW = 0; a.gDt = dts;
            if (!CLKOK) return;
            var c = CLK, cur = a.ac, prv = a.acP;
            if (!cur && !prv) return;
            if (cur && !cur.init && c >= cur.t0) {
                if (prv && prv.init && !prv.nr) { gkHand(a, prv, Math.min(c, prv.te), x, z); x = a.dX; z = a.dZ; }     // [oa] yeni aksiyon görünen konumdan başlar
                gkInit(a, cur, x, z); if (c > cur.t0 + .02) cur.ws = c;                // [oa] geç kurulan aksiyon: giriş karışımı ilk görünen kareden
            }
            if (prv && (!prv.init || !cur || c > cur.t0 + .2 || c > prv.te)) {
                if (prv.init && !prv.nr && !(cur && cur.init)) { gkHand(a, prv, Math.min(c, prv.te), x, z); x = a.dX; z = a.dZ; }     // [oa] tek başına süren önceki aksiyon bitti: fark artık ofsete
                prv = a.acP = null;
            }
            if (cur && cur.init && c > cur.te) {                            // bitti: son çizim konumundaki fark artık ofsete
                gkK(a, cur, cur.te, false); gkRootApply(a, cur, x, z, 1, cur.te);
                a.rOx = (a.rOx || 0) + a.dX - x; a.rOz = (a.rOz || 0) + a.dZ - z; a.dX = x; a.dZ = z; a.rY = 0; a.dYaw = a.yaw; cur = a.ac = null;
                if (!prv) return;
            }
            var wp = 0, wc = 0;
            if (prv) { gkK(a, prv, c, false); wp = gkW(prv, c); if (wp > .001 || (V7_ON && RT.lk && prv.init && !prv.nr)) gkRootApply(a, prv, x, z, wp, c);      /* [v187] D1: kilitli kök son karede de kilitli (yoksa bir kare motor konumuna sıçrıyordu) */ a.gW = RT.gait * wp; }
            if (OA3_FULL && cur && cur.init && cur.k === 16 && cur.mode === 3 && cur.cmx != null && c < cur.tc && c >= cur.t0) oaAlign3(cur, x, z);      // [fiz]
            if (cur && cur.init && c >= cur.t0) { gkK(a, cur, c, false); wc = gkW(cur, c); if (wc > .001 || (V7_ON && RT.lk)) gkRootApply(a, cur, x, z, wc, c); a.gW = Math.max(a.gW, RT.gait * wc); }
            a.acW = Math.max(wp, wc);
            if (cur && cur.k >= 4 && cur.k <= 6 && c < cur.tc + .05) a.needHand = true;
            if (cur && cur.k === 9 && cur.init && !cur.cx && c < cur.tc + .6) a.needHand = true;      // [sp] taç: top ellerde (motor atışı gecikse de)
        }
        /* kestirilen top yolu üzerinde c anındaki nokta (dünya: x, yükseklik (+.17 top merkezi), z) */
        function gkPathAt(ac, c, out) {
            var d = ac.d, p = ac.path, f = (c - d[0]) / GK_DT, i = Math.floor(f), u = f - i, ax, ay, az, bx, by, bz;
            if (i >= GK_PN - 1) { i = GK_PN - 2; u = 1; }
            if (i < 0) { ax = d[1]; ay = d[2]; az = d[3]; bx = p[0]; by = p[1]; bz = p[2]; u = clamp(f + 1, 0, 1); }
            else { var o = i * 3; ax = p[o]; ay = p[o + 1]; az = p[o + 2]; bx = p[o + 3]; by = p[o + 4]; bz = p[o + 5]; }
            out[0] = ax + (bx - ax) * u; out[1] = .17 + az + (bz - az) * u; out[2] = ay + (by - ay) * u;
        }
        function gkRelSet(ox, oy, oz, t, tau, arc, h0, dist) {
            GB.rel = 1; GB.rt = t; GB.ox = ox; GB.oy = oy; GB.oz = oz; GB.tau = tau; GB.arc = arc ? 1 : 0;
            if (arc) { var T = clamp(.42 * (dist || 20) / 15, .3, 1.0); GB.tl = T; GB.h0 = h0; GB.vz = (.17 - h0 + 4.905 * T * T) / T; }
        }
        /* görsel top: (1) motor topu erken çeldi/aldıysa temas anına dek kestirilen yolda, (2) kalecinin elinde (avuç orta noktası; atış/yuvarlamada
           atan el, volede bırakılıp düşen top), (3) bırakış/çelme sonrası motorun topuna sönen ofsetle (omuz üstü atışta yay) - motor topu değişmez */
        function gkBall(v) {
            var bx = v.bx, bz = v.by, by = .17 + clamp(v.bz, 0, 30), i, a, ac, was = GB.held;
            if (CLKOK) bhPush(CLK, bx, by, bz);                                  // [tp] motor topu geçmişi
            GB.held = false; GB.ok = true;
            var gcj = GB.cut || !(CLK >= GB.lc - .02 && CLK <= GB.lc + .35); GB.cut = 0; GB.lc = CLKOK ? CLK : -1e9;      // [fm] kurgu kesmesi / saat sicramasi: tutusa giris suzmesi kurulmaz
            if (!CLKOK) { GB.x = bx; GB.y = by; GB.z = bz; GB.rel = 0; GB.lh = -1; return; }
            for (i = 0; i < S.n; i++) {
                ac = S.st[i].ac; if (!ac || ac.k !== 1 || !ac.init || !ac.path || ac.d[10] || (ac.out !== 1 && ac.out !== 2)) continue;
                if (CLK < ac.tc) { gkPathAt(ac, CLK, gkP); GB.x = gkP[0]; GB.y = gkP[1]; GB.z = gkP[2]; if (CT2_ON && CLK > ac.tc - .1) ctGkPalm(S.st[i], ac); return; }
                if (ac.out === 2 && !ac.rel) { ac.rel = true; gkPathAt(ac, ac.tc, gkP); if (CT2_ON && ac.ctp) { gkP[0] = ac.ctp[0]; gkP[1] = ac.ctp[1]; gkP[2] = ac.ctp[2]; } if (Math.abs(gkP[0] - bx) + Math.abs(gkP[2] - bz) < 9) gkRelSet(gkP[0] - bx, gkP[1] - by, gkP[2] - bz, CLK, .12, 0, 0, 0); }
            }
            var h = GB_HOLD;
            if (h >= 0 && CLKOK && OAB.hc && OAB.hc.k === 18 && CLK < OAB.hc.tc + .02 && !was) h = -1;      /* [kaleci] vurus temasindan once tutus yok */
            a = h >= 0 ? S.st[h] : null;
            if (a && a.hR) {
                ac = a.ac; var x, y, z;
                if (ac && ac.init && (ac.k === 4 || ac.k === 5) && CLK >= ac.t0 + .06) { var hp = ac.hand > 0 ? a.hR : a.hL; x = hp[0]; y = hp[1]; z = hp[2]; if (CT3_ON && a.dqc && a.rM) { var hfb = ac.hand > 0 ? BB.ForeL : BB.ForeR, hfe = BODY_BIND[hfb]; dqsPt(a.dqc, hfb, hfe[0], hfe[1], hfe[2], CT_Q); xform(a.rM, CT_Q, CT_W); var hdx = x - CT_W[0], hdy = y - CT_W[1], hdz = z - CT_W[2], hdl = Math.sqrt(hdx * hdx + hdy * hdy + hdz * hdz) || 1, hR0 = .85 * .11 * BSC; x += hdx / hdl * hR0; y += hdy / hdl * hR0; z += hdz / hdl * hR0; } }      /* [temas] top avucun ilerisinde */
                else if (ac && ac.init && ac.k === 6 && CLK >= ac.tc - .38) {
                    if (ac.dy0 == null) { ac.dx0 = GB.x; ac.dy0 = GB.y; ac.dz0 = GB.z; }
                    var tf = CLK - (ac.tc - .38); x = ac.dx0 + Math.sin(ac.yaw) * .8 * tf; z = ac.dz0 + Math.cos(ac.yaw) * .8 * tf; y = Math.max(.3, ac.dy0 - 4.905 * tf * tf);
                } else { var fo = CT3_ON && a.hik > .5 ? 0 : .05 + (BSC - 1) * .11; x = (a.hR[0] + a.hL[0]) * .5 + Math.sin(a.dYaw) * fo; y = (a.hR[1] + a.hL[1]) * .5; z = (a.hR[2] + a.hL[2]) * .5 + Math.cos(a.dYaw) * fo; }     // [vq] büyütülmüş top (uzak plan) avuçların önünde
                if (GB.lh !== h) { var hex = GB.x - x, hey = GB.y - y, hez = GB.z - z, he2 = hex * hex + hez * hez; GB.hk = !gcj && he2 > .0025 && he2 < 225 ? 1 : 0; GB.hex = hex; GB.hey = hey; GB.hez = hez; GB.het = CLK; GB.hT = Math.min(.45, Math.sqrt(he2) / 28); }      // [fm] tutusa giris: top ellere uzaktan geliyorsa suzulur
                if (GB.hk) { var htt = CLK - GB.het; if (htt < -.05 || htt > .6) GB.hk = 0; else { var hkk = GB.hT > .07 ? Math.max(0, 1 - Math.max(0, htt) / GB.hT) : Math.exp(-Math.max(0, htt) / .07); x += GB.hex * hkk; y += GB.hey * hkk; z += GB.hez * hkk; } }
                GB.x = x; GB.y = Math.max(.16, y); GB.z = z; GB.held = true; GB.lh = h; return;      // top zemine gömülmesin (yerde sarılırken)
            }
            if (was && GB.lh >= 0) {                                       // elden çıktı: motor topuna sönen ofset
                a = S.st[GB.lh]; ac = a ? a.ac : null; var kd = ac ? ac.k : 0, ox = GB.x - bx, oy = GB.y - by, oz = GB.z - bz;
                if (ox * ox + oz * oz < 64) { if (kd === 5) gkRelSet(ox, 0, oz, CLK, .2, 1, GB.y, ac.d[2]); else gkRelSet(ox, oy, oz, CLK, kd === 4 ? .1 : kd === 6 ? .18 : .12, 0, 0, 0); }
                GB.lh = -1;
            }
            if (GB.rel) {
                var tt = CLK - GB.rt, kk = tt < 0 ? 1 : Math.exp(-tt / GB.tau);
                GB.x = bx + GB.ox * kk; GB.y = by + GB.oy * kk; GB.z = bz + GB.oz * kk;
                if (GB.arc && tt >= 0 && tt < GB.tl) GB.y = Math.max(GB.y, GB.h0 + GB.vz * tt - 4.905 * tt * tt);
                if (tt < -.5 || (kk < .01 && (!GB.arc || tt > GB.tl))) GB.rel = 0;
                return;
            }
            GB.x = bx; GB.y = by; GB.z = bz;
        }
        /* ===== [sp] DURAN TOPLAR — yalnızca görüntü (simülasyona/kayda dokunmaz) =====
           Kaleci aksiyon altyapısını (a.ac, sim saati CLK, RT kök çıktısı, günlük → tekrar) kullanır. Türler:
           8 duran top vuruşu (korner, serbest vuruş, penaltı, başlama, aut): vurucu topa varınca kurulur → topu yere koyar → geri geri duruş noktasına
             çekilir (topun 2-4 m gerisi, güçlü ayağın karşı tarafından ~20-35°) → düdüğü bekler → hızlanan koşu → son adımda destek ayağı topun yanında,
             TEMAS tam motorun vuruş anında (arayüz yürütme anını kesin kestirir). Temas pozunda vuruş ayağının üst yüzü (gerçek iskelet + DQS) topun
             arkasına gelecek kök (leğen) noktası bir kez hesaplanır. Kök topa göre dünyaya kilitli (motor vurucuyu topun üstünde tutar), adım evresi
             kökün kendi hareketinden. Bacak salınımı kickProfile genlikleriyle (geri savurma lg0, takip lg1, diz kn0, kol, gövde) ama SİM saatinde:
             geri savurma temastan ~.3 sn önce, temasta uyluk dikeyin ~20° önünde ve diz açılmakta (kamçı), karşı kol yana açık, destek dizi bükük.
             Dış kök (bayrak 4): kök motorda kalır; yalnızca yön ve vuruş pozu (kestirilmemiş duran top - olay anında, top temasa dek noktada).
           9 taç atışı (IFAB 15): topu yerden iki elle alır, göğüs önünde taşır; çizgide iki ayak yerde (adım açık, arka ayak parmak ucunda), top baş
             arkasına, gövde geriye esner (uzun taçta daha çok), atışta gövde öne kamçılanır, kollar baş üstünden öne; top elden ~2 m'de çıkar, motorun
             yer pasına doğal bir yayla iner (görsel yükseklik; motor yolu değişmez).
           10 baraj: eller kasık önünde, ayaklar bitişik, topa dönük; serbest vuruş şutunda vuruşla birlikte sıçrama (~.3 m), dizlerle iniş. */
        var SP_DEAD = null, SP_CA = .6, SP_PROF = ['pass', 'pass_high', 'shot', 'clear'], SP_PL2 = 1;
        /* [sp] topu yere koyma pozu (çerçevede gövde vuruş yönüne dönük): derin çömelme - uyluk ~75°, diz ~115°, topuklar yerde (ayak bileği
           bükük), leğen ~.4 m iner; gövde öne (~75°), baş topa bakar; iki kol aşağı-öne, avuçlar topun iki yanında yarı yükseklikte */
        function spPlace() {
            PA(kHi, .55, -legDrop(-1.9, 2.0, .55), 0); PA(kTo, .8, 0, 0); PA(kHe, -.2, 0, 0);
            PA(kLL, -1.9, null, null); PA(kLR, -1.9, null, null); PA(kSL, 2.0, 0, 0); PA(kSR, 2.0, 0, 0); PA(kfL, -.6, 0, 0); PA(kfR, -.6, 0, 0);
            PA(kAL, -1.6, 0, .08); PA(kAR, -1.6, 0, -.08); PA(kFL, -.25, 0, 0); PA(kFR, -.25, 0, 0);
        }
        var SPB = { on: 0, ox: 0, oy: 0, oz: 0, rt: 0, tau: .13, arc: 0, tl: 0, h0: 0, vz: 0, lx: 0, ly: .17, lz: 0 };   // bırakış ofseti (motor topuna söner) + taç yayı
        function angW(x) { return Math.atan2(Math.sin(x), Math.cos(x)); }
        function spDist(a, b, c, d) { var x = c - a, y = d - b; return Math.sqrt(x * x + y * y); }
        // beş anahtar (b0 < b1 < 0 = temas < t3 < t4): geri savurma yumuşak, öne salınım temasa doğru hızlanır, takip temastan sonra yavaşlar
        function k5(u, b0, b1, t3, t4, v0, v1, v2, v3, v4) {
            if (u <= b0) return v0;
            if (u < b1) return v0 + (v1 - v0) * sm((u - b0) / (b1 - b0));
            if (u < 0) { var x = (u - b1) / -b1; return v1 + (v2 - v1) * x * x; }
            if (u < t3) { var y = 1 - u / t3; return v2 + (v3 - v2) * (1 - y * y); }
            if (u < t4) return v3 + (v4 - v3) * sm((u - t3) / (t4 - t3));
            return v4;
        }
        function spKyAt(ac, c) { return angLerp(ac.ky0, ac.ky, sm(rmp(c, ac.kyT, ac.kyT + .25))); }   // gerçek vuruş yönü (olayda bildirilir) .25 sn'de
        function spYawT(ac, c) { return angLerp(ac.yw0, ac.yaw, sm(rmp(c, ac.ywT, ac.ywT + .3))); }   // taç: hedef değişince .3 sn'de döner
        function spInit(a, ac, x, z) {
            var d = ac.d, k = ac.k;
            ac.win = .15;
            if (k === 9) { ac.yaw = Math.atan2(d[2] - d[0], d[3] - d[1]); ac.yw0 = ac.yaw; ac.ywT = -1e9; ac.thr = d[6] > 0; spThrowPlan(ac); return; }
            if (k === 10) { ac.yaw = Math.atan2(d[0] - x, d[1] - z); ac.te = ac.tc + (d[2] > 0 ? .78 : .3); ac.win = .35; return; }
            var sc = a.hScale != null ? a.hScale : .98, ws = a.wScale != null ? a.wScale : .98, ul = Math.sqrt(d[2] * d[2] + d[3] * d[3]) || 1;
            ac.bx = d[0]; ac.bz = d[1]; ac.yaw = Math.atan2(d[2] / ul, d[3] / ul); ac.ky = 0; ac.ky0 = 0; ac.kyT = -1e9;
            var fl = d[9] | 0; ac.foot = d[4] < 0 ? -1 : 1; ac.ext = fl & 4 ? 1 : 0; ac.place = fl & 2 ? 1 : 0; ac.tau = fl & 16 ? .2 : .13; ac.pen = fl & 16 ? 1 : 0;
            ac.pr = kickProfile(SP_PROF[clamp(d[5] | 0, 0, 3)], d[6]);
            var cy = Math.cos(ac.yaw), sy = Math.sin(ac.yaw), qx = x - ac.bx, qz = z - ac.bz;
            ac.s0L = qx * cy - qz * sy; ac.s0F = qx * sy + qz * cy; ac.y0 = angW(a.yaw - ac.yaw);            // başlangıç (çerçevede) ve gövde yönü
            ac.sL = ac.foot * d[7] * Math.sin(d[8]); ac.sF = -d[7] * Math.cos(d[8]);                          // duruş noktası: güçlü ayağın karşı tarafı
            ac.kb0 = -clamp(ac.tc - ac.t0, .08, .3); ac.kb1 = ac.kb0 * .34;                                  // geri savurma anahtar anları (temasa göre)
            // temas pozunda vuruş ayağının üst yüzü (model uzayı) → topun arkasına gelecek kök noktası (koşu yönü ile temas gövde yönü birlikte oturur)
            var o0 = PW_;
            if (SP_PL2 && ac.place) {                                         // [sp] koyma noktası: koyma pozundaki avuç orta noktası topun merkezine (oyuncunun boyuyla)
                pose.fill(0); PW_ = 1; spPlace(); PW_ = o0; bodyDQ(pose, gkDQ); handsModel(gkDQ);
                ac.qL0 = -(gkQ[0] + gkQ2[0]) * .5 * ws; ac.qF0 = -(gkQ[2] + gkQ2[2]) * .5 * ws;
            } else ac.qF0 = NaN;
            pose.fill(0); PW_ = 1; spStrike(a, ac, ac.tc); PW_ = o0; bodyDQ(pose, gkDQ);
            var fb = ac.foot > 0 ? BB.FootL : BB.FootR, fp = BODY_BIND[fb]; dqsPt(gkDQ, fb, fp[0], fp[1] - .025, fp[2] + .1, gkQ);
            var mx = gkQ[0] * ws, mz = gkQ[2] * ws, it, cd, sd;
            ac.dR = Math.atan2(-ac.sL, -.4 - ac.sF);
            for (it = 0; it < 3; it++) {
                ac.dC = ac.ext ? 0 : ac.dR * .45; cd = Math.cos(ac.dC); sd = Math.sin(ac.dC);
                ac.pL = -(mx * cd + mz * sd); ac.pF = -.15 - (-mx * sd + mz * cd);
                ac.dR = Math.atan2(ac.pL - ac.sL, ac.pF - ac.sF);
            }
            spPlan(ac);
        }
        /* zaman planı (t0 ve temas anı tc'den): [t0,tA] ilk hedefe yürüyüş · [tA,tB] eğilip topu koyma · [tB,tC] geri geri duruş noktasına ·
           [tC,tr] bekleme · [tr,tc] koşu (ivmelenen) · [tc,te] takip. Vakit kısaysa yürüyüş hızlanır, daha da kısaysa koyma atlanır; o da yetmezse
           koşu bulunduğu yerden (topun gerisindeyse) başlar, değilse yerinde vuruş. */
        /* [sp] s0 → (gL, gF) doğru parçası topa (orijin) .45 m'den yakınsa yana bükülme: ac[p+'L'/'F'] birim dik (dışa), [p+'K'] tepe genliği,
           [p+'T'] tepe konumu (yol oranı); dönüş: genlik (0 = bükülme yok) */
        var SP_BEND = 1;
        function spBend(ac, gL, gF, p) {
            ac[p + 'K'] = 0; if (!SP_BEND) return 0;
            var aL = ac.s0L, aF = ac.s0F, dL = gL - aL, dF = gF - aF, l2 = dL * dL + dF * dF; if (l2 < .04) return 0;
            var u = -(aL * dL + aF * dF) / l2; if (u <= .02 || u >= .98) return 0;                 // en yakın nokta uçta: yol topa yaklaşmıyor
            var cL = aL + dL * u, cF = aF + dF * u, dm = Math.sqrt(cL * cL + cF * cF); if (dm >= .45) return 0;
            var l = Math.sqrt(l2), nL = -dF / l, nF = dL / l, s = nL * cL + nF * cF, sg = Math.abs(s) > .02 ? (s > 0 ? 1 : -1) : (ac.sL >= 0 ? 1 : -1);
            ac[p + 'L'] = nL * sg; ac[p + 'F'] = nF * sg; ac[p + 'K'] = .45 - dm; ac[p + 'T'] = clamp(u, .2, .8);
            return ac[p + 'K'];
        }
        function spPlan(ac) {
            var P = ac.pr.kind, vc = P === 'shot' ? 4.3 + 1.1 * clamp(ac.d[6], 0, 1) : P === 'clear' ? 4.0 : P === 'pass_high' ? 3.4 : 2.6;
            if (ac.d[7] < 1.2) vc = 1.7;                                     // kısa yaklaşma (başlama vuruşu)
            ac.vc = vc; ac.tA = ac.tB = ac.tC = ac.t0; ac.mode = 0; ac.rL = ac.sL; ac.rF = ac.sF; ac.te = ac.tc + .62;
            if (ac.ext) { ac.tr = ac.tc; ac.Tr = .001; return; }
            var Ld = spDist(ac.sL, ac.sF, ac.pL, ac.pF), Tr = Ld / (vc * .825), tr = ac.tc - Tr, t0 = ac.t0;
            var qL = ac.qF0 === ac.qF0 ? ac.qL0 : -.06 * ac.foot, qF = ac.qF0 === ac.qF0 ? ac.qF0 : -.62, w1 = spDist(ac.s0L, ac.s0F, qL, qF) / 1.7, w2 = spDist(qL, qF, ac.sL, ac.sF) / 1.3, w3 = spDist(ac.s0L, ac.s0F, ac.sL, ac.sF) / 1.8;
            ac.qL = qL; ac.qF = qF;
            var kq = spBend(ac, qL, qF, 'bq'), kr = spBend(ac, ac.sL, ac.sF, 'br'); w1 += 1.6 * kq / 1.7; w3 += 1.6 * kr / 1.8;     // [sp] bükülen yol biraz daha uzun
            var av = tr - t0, A1 = Math.max(.25, w1), C1 = Math.max(.3, w2), A2 = Math.max(.25, w3), fb = .7 * clamp(av / (A1 + .7 + C1 + .25), .65, 1), f1 = Math.min(1, (av - .25 - fb) / (A1 + C1)), f2 = Math.min(1, (av - .25) / A2);
            if (ac.place && f1 >= .45) { ac.mode = 1; ac.tA = t0 + A1 * f1; ac.tB = ac.tA + fb; ac.tC = ac.tB + C1 * f1; }        // vakit kısaysa yürüyüş hızlanır (en çok ~2,2 kat: hafif koşu)
            else if (f2 >= .4) { ac.mode = 2; ac.tA = ac.tB = ac.tC = t0 + A2 * f2; }
            else if (ac.s0F < -.25) { ac.mode = 3; ac.rL = ac.s0L; ac.rF = ac.s0F; Ld = spDist(ac.rL, ac.rF, ac.pL, ac.pF); Tr = Math.min(ac.tc - t0, Ld / (vc * .825)); tr = ac.tc - Tr; }   // koşu bulunduğu yerden (topun gerisinden)
            else { ac.ext = 1; ac.tr = ac.tc; ac.Tr = .001; return; }       // topun önünde ve vakit yok: yerinde vuruş (kök motorda)
            ac.Tr = Math.max(.001, Tr); ac.tr = tr;
        }
        /* duran top vuruşu: kök yolu (çerçeve: F vuruş yönü, L anatomik sol), gövde yönü, eğilme ve vuruş pozu */
        function spKick(a, ac, c, P) {
            var L, F, yd, e, W0;
            if (ac.ext) {                                                    // dış kök: yalnızca vuruş yönü ve pozu
                RT.lk = 0; RT.hy = 1; RT.ya = ac.yaw + spKyAt(ac, c) * sm(rmp(c, ac.tc - .05, ac.tc + .2)); RT.yw = sm(rmp(c, ac.tc - .4, ac.tc - .2));
                if (P) { W0 = PW_; PA(kHe, .2, 0, null); spStrike(a, ac, c); PW_ = W0; }
                return;
            }
            var tA = ac.tA, tB = ac.tB, tC = ac.tC, tr = ac.tr, tc = ac.tc;
            RT.lk = 1; RT.gait = 1; RT.hy = 1;
            if (c < tA) {                                                    // ilk hedefe yürüyüş (koyma noktası ya da duruş noktası)
                var gL = ac.mode === 1 ? ac.qL : ac.rL, gF = ac.mode === 1 ? ac.qF : ac.rF, yA = spDist(ac.s0L, ac.s0F, gL, gF) > .4 ? Math.atan2(gL - ac.s0L, gF - ac.s0F) : ac.y0;
                e = sm(rmp(c, ac.t0, tA)); L = ac.s0L + (gL - ac.s0L) * e; F = ac.s0F + (gF - ac.s0F) * e;
                var bK = ac.mode === 1 ? ac.bqK : ac.mode === 2 ? ac.brK : 0;
                if (bK > 0) {                                                // [sp] topun çevresinden: yana bükülme (tepe topa en yakın noktada), yön yolun teğeti
                    var m1 = ac.mode === 1, bT = m1 ? ac.bqT : ac.brT, bL = m1 ? ac.bqL : ac.brL, bF = m1 ? ac.bqF : ac.brF, q0 = e < bT ? e / bT : (1 - e) / (1 - bT);
                    var hb = Math.sin(1.5708 * q0), hd = (e < bT ? 1.5708 / bT : -1.5708 / (1 - bT)) * Math.cos(1.5708 * q0);
                    L += bL * bK * hb; F += bF * bK * hb;
                    var tL = gL - ac.s0L + bL * bK * hd, tF = gF - ac.s0F + bF * bK * hd; if (tL * tL + tF * tF > .16) yA = Math.atan2(tL, tF);
                }
                yd = angLerp(angLerp(ac.y0, yA, sm(rmp(c, ac.t0, ac.t0 + .3))), ac.mode === 1 ? 0 : ac.dR, sm(rmp(c, tA - .3, tA)));
            } else if (c < tB) { L = ac.qL; F = ac.qF; yd = 0; }            // eğilip topu koyar
            else if (c < tC) {                                               // geri geri duruş noktasına (topa bakarak)
                e = sm(rmp(c, tB, tC)); L = ac.qL + (ac.rL - ac.qL) * e; F = ac.qF + (ac.rF - ac.qF) * e;
                yd = angLerp(angLerp(0, Math.atan2(-L, -F), sm(rmp(c, tB, tB + .3))), ac.dR, sm(rmp(c, tC - .3, tC)));
            } else if (c < tr) { L = ac.rL; F = ac.rF; yd = ac.dR; }       // düdüğü bekler: koşu çizgisinde, topa dönük
            else if (c < tc) {                                               // koşu: ivmelenir (ilk %35), son adım destek ayağını topun yanına koyar
                var u = clamp((c - tr) / ac.Tr, 0, 1), s = (u < .35 ? u * u / .7 : u - .175) / .825;
                L = ac.rL + (ac.pL - ac.rL) * s; F = ac.rF + (ac.pF - ac.rF) * s; yd = angLerp(ac.dR, ac.dC, sm(rmp(c, tc - .22, tc)));
            } else {                                                         // takip: vuruş yönünde kısa süzülme, durur
                var gl = ac.vc * .16 * (1 - Math.exp(-(c - tc) / .16));
                L = ac.pL + Math.sin(ac.dC) * gl * .4; F = ac.pF + gl; yd = angLerp(ac.dC, ac.dC * .35 + spKyAt(ac, c), sm(rmp(c, tc, tc + .35)));
            }
            RT.L = L; RT.F = F; RT.ya = ac.yaw + yd;
            if (!P) return;
            W0 = PW_;
            PA(kHe, .18, 0, null);                                           // topa bakar (gövdeye göre baş dönüşü yok)
            if (SP_PL2 && ac.mode === 1 && c > tA - .1 && c < tB + .1) {     // [sp] çömelip topu koyma: avuçlar topun iki yanında; kalkış geri yürüyüşle birlikte
                var kb2 = sm(rmp(c, tA - .1, tA + .18)) * (1 - sm(rmp(c, tB - .15, tB + .1)));
                if (kb2 > .002) {
                    PW_ = W0 * kb2; spPlace(); PW_ = W0;
                    // leğen yüksekliği karışmış bacak açılarından (alçaktaki ayak zeminde): doğrusal karışımda inişin ortasında ayaklar ~8 cm gömülüyordu
                    var dl2 = Math.min(legDrop(pose[kLL], pose[kSL], pose[kHi]), legDrop(pose[kLR], pose[kSR], pose[kHi]));
                    pose[kHi + 1] += (-dl2 - pose[kHi + 1]) * Math.min(1, kb2 * 3) * W0;
                }
            }
            if (!SP_PL2 && ac.mode === 1 && c > tA - .05 && c < tB + .05) {             // eğilip topu koyma: bel ve diz bükük, kollar topa
                var kb = sm(rmp(c, tA - .05, tA + .22)) * (1 - sm(rmp(c, tB - .25, tB)));
                if (kb > .002) {
                    PW_ = W0 * kb;
                    PA(kHi, .45, -legDrop(-.75, .6, .45), 0); PA(kTo, .6, 0, 0); PA(kHe, -.05, 0, 0);
                    PA(kLL, -.75, null, null); PA(kLR, -.75, null, null); PA(kSL, .6, 0, 0); PA(kSR, .6, 0, 0); PA(kfL, -.15, 0, 0); PA(kfR, -.15, 0, 0);
                    PA(kAL, -1.25, 0, .1); PA(kAR, -1.25, 0, -.1); PA(kFL, -.15, 0, 0); PA(kFR, -.15, 0, 0);
                    PW_ = W0;
                }
            }
            spStrike(a, ac, c);
            PW_ = W0;
        }
        /* vuruş pozu (sim saati, temas = ac.tc): vuruş bacağı geri savrulur (kalça ekstansiyonu lg0, diz kn0) → öne salınır, temasta uyluk ~-.38,
           diz açılmakta → takip (lg1); içten pasta kalça dış rotasyonda. Destek bacağı öne basar, temasta dizi bükük (leğen alçalır). Karşı kol yana
           açık (denge), aynı taraf kol bacağın tersine sallanır; gövde geri savurmada vuruş tarafına döner, takipte açılır; yüksek topta geriye, sert
           alçak şutta öne eğik. */
        /* [mocap] kosu dongusu: ilk kullanimda prosedurel yuruyusle evre hizasi (sol bacagin en geride oldugu ham evre ile klibin ayni karesi) ve
           kanal ortalamalari (genlik olcegi bunlarin cevresinde) */
        var MCL = null, MCK = new Float32Array(39);
        function mcLocoInit() {
            if (MCL) return MCL; var c = mcClip('jog forward'); if (!c) return (MCL = { ok: 0 });
            var fk = { ph: 0, carryK: 0, takeonK: 0 }, k, f, best = -9, phm = 0, bm = -9, tmax = 0, mean = new Float32Array(39), tmp = new Float32Array(39);
            var sv = pose.slice(); MC_OFF = 1; for (k = 0; k < 72; k++) { fk.ph = k / 72 * 2 * Math.PI; poseFor(fk, 3, 0, null); if (pose[21] > best) { best = pose[21]; phm = fk.ph; } } MC_OFF = 0; pose.set(sv);      // dis poz korunur (ilk kullanim poz hesabinin icinde olabilir)
            for (f = 0; f < c.n - 1; f++) { mcPose('jog forward', f / c.fps, tmp, false, 0); for (k = 0; k < 39; k++) mean[k] += tmp[k] / (c.n - 1); if (tmp[21] > bm) { bm = tmp[21]; tmax = f / c.fps; } }
            return (MCL = { ok: 1, ph0: phm, t0: tmax, len: c.len, mean: mean, tmp: tmp });
        }
        function mcLoco(a, sp, wl) {
            var L = mcLocoInit(); if (!L.ok) return;
            var u = ((a.ph - L.ph0) / (2 * Math.PI)) % 1, k, v; if (u < 0) u += 1;
            mcPose('jog forward', L.t0 + u * L.len, L.tmp, true, 0);
            var amp = Math.max(.85, Math.min(1.45, 1 + .075 * (sp - 2.6)));
            for (k = 9; k < 39; k++) { v = L.tmp[k]; if (k % 3 === 0) v = L.mean[k] + (v - L.mean[k]) * amp; pose[k] += (v - pose[k]) * wl; }
            pose[0] += (L.tmp[0] * .6 - pose[0]) * wl; pose[2] += (L.tmp[2] * .6 - pose[2]) * wl; pose[1] += (L.tmp[1] - pose[1]) * wl;
        }
        /* [gasp] yon / tempo karisimli dongu kosusu */
        var GL = null, GA_T = new Float32Array(39), GA_B = new Float32Array(39), GA_A = new Float32Array(39), GA_DW = [], GA_V = [0, 0, 0, 0];
        var GA_R0 = [0, 0, 0], GA_R1 = [0, 0, 0], GA_RF = [0, 0, 0], GA_RE = [0, 0, 0], GA_SX = 0, GA_SZ = 0;
        function gaspEntry(nm, mr) {
            var s = ADO_MOCAP[nm]; if (!s || !s.lp || !s.lp.pl || !s.lp.pl.length || !s.lp.pr || !s.lp.pr.length) return null;
            var pl = (mr ? s.lp.pr : s.lp.pl).slice(), nc = pl.length; pl.push(pl[0] + s.n - 1);
            return { nm: nm, mr: mr, ang: mr ? -s.lp.ang : s.lp.ang, v: s.lp.v, dc: s.lp.d / nc, pl: pl, n: s.n, fps: s.fps };
        }
        function gaspInit() {
            if (GL) return GL; GL = { ok: 0 };
            var D8 = ['F', 'FL', 'FR', 'LL', 'RR', 'B', 'BL', 'BR'], G = function (g) { return D8.map(function (d) { return ['gasp G_M_Neutral_' + g + '_Loop_' + d, 0]; }); };
            var lv = [G('Walk'), [['jog forward', 0], ['jog forward diagonal', 0], ['jog forward diagonal', 1], ['jog strafe left', 0], ['jog strafe right', 0], ['jog backward', 0], ['jog backward diagonal', 0], ['jog backward diagonal', 1]], G('Run'), [['gasp G_M_Neutral_Sprint_Loop_F', 0]]], L = [], i, j;
            for (i = 0; i < lv.length; i++) {
                var cl = [];
                for (j = 0; j < lv[i].length; j++) { var e = gaspEntry(lv[i][j][0], lv[i][j][1]); if (e) cl.push(e); }
                if (!cl.length) return GL;
                cl.sort(function (x, y) { return x.ang - y.ang; });
                L.push({ cl: cl }); GA_DW.push([0, 0, 0]);
            }
            var idl = ADO_MOCAP['gasp G_M_Neutral_Stand_Idle_Loop'];
            GL = { ok: 1, L: L, idle: idl ? 'gasp G_M_Neutral_Stand_Idle_Loop' : null }; return GL;
        }
        function gaspDir(lv, th, out) {      // en yakin iki yon klibi ve karisim agirligi (aci cembersel); donen: o yondeki klip hizi
            var cl = lv.cl, n = cl.length, k = n - 1, j;
            if (n === 1) { out[0] = 0; out[1] = 0; out[2] = 0; return cl[0].v; }
            for (j = 0; j < n; j++) if (cl[j].ang > th) { k = j - 1; break; }
            var i0 = (k + n) % n, i1 = (k + 1) % n, span = cl[i1].ang - cl[i0].ang, dd = th - cl[i0].ang;
            if (span <= 0) span += 2 * Math.PI; if (dd < 0) dd += 2 * Math.PI;
            out[0] = i0; out[1] = i1; out[2] = Math.max(0, Math.min(1, dd / span));
            return cl[i0].v + (cl[i1].v - cl[i0].v) * out[2];
        }
        function gaspRootAt(c, f, out) {      // kok (yaw, x, z) f karesinde; dongu sonrasi kare: bas + bir tur yer degistirme
            var n1 = c.n - 1;
            if (f <= n1) { mcRoot(c.nm, f / c.fps, out, c.mr); return; }
            mcRoot(c.nm, n1 / c.fps, GA_RE, c.mr); mcRoot(c.nm, (f - n1) / c.fps, out, c.mr); out[1] += GA_RE[1]; out[2] += GA_RE[2];
        }
        function gaspAcc(first, w) { var q; if (first) for (q = 0; q < 39; q++) { GA_B[q] = GA_T[q]; GA_A[q] = 0; } for (q = 0; q < 39; q++) { var e = GA_T[q] - GA_B[q]; if (q !== 1) e -= Math.round(e / (2 * Math.PI)) * 2 * Math.PI; GA_A[q] += e * w; } }
        function gaspAdd(c, ph, cyc, w, first) {      // klibi evrede ornekle (sol / aynada sag ayak isaretleri arasinda), sargili aci farkiyla biriktir
            var k = cyc % (c.pl.length - 1), f = c.pl[k] + ph * (c.pl[k + 1] - c.pl[k]);
            mcPose(c.nm, f / c.fps, GA_T, true, c.mr); gaspAcc(first, w);
            if (GA_SURGE) {      // kalca salinimi: cevrimin dogrusal ilerlemesinden sapma
                gaspRootAt(c, c.pl[k], GA_R0); gaspRootAt(c, c.pl[k + 1], GA_R1); gaspRootAt(c, f, GA_RF);
                if (first) { GA_SX = 0; GA_SZ = 0; }
                GA_SX += (GA_RF[1] - (GA_R0[1] + (GA_R1[1] - GA_R0[1]) * ph)) * w; GA_SZ += (GA_RF[2] - (GA_R0[2] + (GA_R1[2] - GA_R0[2]) * ph)) * w;
            }
            return c.dc * w;
        }
        function gaspLvl(i, ph, cyc, w, first) {      // basamagin yon karisimi
            var cl = GL.L[i].cl, d = GA_DW[i], D = 0;
            if ((1 - d[2]) * w > .001) { D += gaspAdd(cl[d[0]], ph, cyc, (1 - d[2]) * w, first); first = false; }
            if (d[2] * w > .001) { D += gaspAdd(cl[d[1]], ph, cyc, d[2] * w, first); first = false; }
            return [D, first];
        }
        function gaspLoco(a, sp, wg) {
            var G = gaspInit(); if (!G.ok) return false;
            var lt = a.latV || 0, ln = a.lonV || 0, th = lt * lt + ln * ln > .09 ? Math.atan2(lt, ln) : 0, nL = G.L.length, i;
            var fw = Math.max(0, 1 - Math.max(0, Math.abs(th) - .35) / .35), top = fw > .01 ? nL - 1 : nL - 2;      // depar yalniz ileri
            for (i = 0; i < nL; i++) { GA_V[i] = gaspDir(G.L[i], th, GA_DW[i]); if (i > 0 && GA_V[i] < GA_V[i - 1] + .25) GA_V[i] = GA_V[i - 1] + .25; }
            var ph = a.gaP || 0, cyc = a.gaC || 0, D = 0, first = true, r;
            if (sp <= GA_V[0]) {      // yavas: kadans sqrt(oran), adim boyu durusla kisalir
                var ratio = Math.max(0, sp / GA_V[0]), rate = Math.max(.5, Math.min(1, Math.sqrt(ratio))), mix = G.idle ? Math.max(0, Math.min(.78, 1 - ratio / rate)) : 0;
                r = gaspLvl(0, ph, cyc, 1 - mix, true); first = r[1];
                if (mix > .001) { mcPose(G.idle, 0, GA_T, false, 0); gaspAcc(first, mix); first = false; GA_SX *= 1 - mix; GA_SZ *= 1 - mix; }
                if (first) return false;
                var T = r[0] / Math.max(.05, 1 - mix) / Math.max(.3, GA_V[0]);      // yuruyus cevrim suresi (sn)
                D = Math.max(.02, sp * T / rate);
            } else {
                var lo = 0; while (lo < top && sp > GA_V[lo + 1]) lo++;
                var t = lo < top ? (sp - GA_V[lo]) / Math.max(.05, GA_V[lo + 1] - GA_V[lo]) : 0; if (lo + 1 === nL - 1) t *= fw;
                if (1 - t > .001) { r = gaspLvl(lo, ph, cyc, 1 - t, first); D += r[0]; first = r[1]; }
                if (t > .001) { r = gaspLvl(lo + 1, ph, cyc, t, first); D += r[0]; first = r[1]; }
                if (first) return false;
            }
            a.gaD = D;
            if (GA_SURGE) { var cyw = Math.cos(a.dYaw), syw = Math.sin(a.dYaw); a.gaRX = (GA_SX * cyw + GA_SZ * syw) * wg; a.gaRZ = (-GA_SX * syw + GA_SZ * cyw) * wg; a.gaRT = FRM[3]; }      // govde cercevesi -> dunya
            var q;
            pose[0] += (GA_B[0] + GA_A[0] - pose[0]) * .6 * wg; pose[2] += (GA_B[2] + GA_A[2] - pose[2]) * .6 * wg; pose[1] += (GA_B[1] + GA_A[1] - pose[1]) * wg;
            for (q = 3; q < 6; q++) pose[q] += (GA_B[q] + GA_A[q] - pose[q]) * .5 * wg;
            for (q = 9; q < 39; q++) pose[q] += (GA_B[q] + GA_A[q] - pose[q]) * wg;
            return true;
        }
        /* [ayak] ayak kilidi */
        var FK_DQ = null, FK_M = new Float32Array(16), BK_ON = 1, BK_YW = .45;      // [bacak] p_bacak_01: diz yonu ve kilitli ayak pivotu
        var CT_ON = 1, CT_DQ = null, CT_Q = new Float32Array(3), CT_W = new Float32Array(3), CT_A = new Float32Array(3);
        var CT3_ON = 1, GD_ON = 1, SP_ON = 1, SP_D = .42;      // [govde] SP: oyuncu ayirma
        function ctGround(a, root) {      // [govde] ayak zemine gomulmez
            if (!CT_DQ) CT_DQ = new Float32Array(BODY_BONES.length * 8);
            bodyDQ(pose, CT_DQ);
            var sc = root[5] || 1, sd;
            for (sd = 0; sd < 2; sd++) {
                var iL = sd ? BB.LegR : BB.LegL, iS = sd ? BB.ShinR : BB.ShinL, iF = sd ? BB.FootR : BB.FootL, FB = BODY_BIND[iF], mF = _bw[iF];
                dqsPt(CT_DQ, iF, FB[0], FB[1] - .04, FB[2] + .16, CT_Q); var ty = root[13] + CT_Q[1] * sc;
                dqsPt(CT_DQ, iF, FB[0], FB[1] - .07, FB[2] - .04, CT_Q); var hy = root[13] + CT_Q[1] * sc;
                var lo = Math.min(ty, hy); if (lo > -.012) continue;
                xform(root, fkT(mF), CT_A); var up = -lo;
                fkLeg(sd, iL, iS, iF, fkR(_bw[0]), fkW2M(root, [CT_A[0], CT_A[1] + up, CT_A[2]]), fkR(mF));
                bodyDQ(pose, CT_DQ);
                dqsPt(CT_DQ, iF, FB[0], FB[1] - .04, FB[2] + .16, CT_Q); var ty2 = root[13] + CT_Q[1] * sc;
                if (ty2 < -.012) pose[iF * 3] -= Math.min(.6, Math.asin(Math.min(.9, -ty2 / .165)));      // ucu kaldir (+x ucu asagi indirir)
            }
        }
        function fkArm(iU, iF, Wp, tgt) {      // [temas] model uzayinda avucu (on kol ekseni boyunca .27 m) tgt'ye goturen omuz / dirsek acilari -> pose
            var S = fkT(_bw[iU]), E = fkT(_bw[iF]), L1 = fkL(fkS(E, S)), L2 = .27, dv = fkS(tgt, S), D = fkL(dv);
            if (D < .05) return; D = Math.min(D, (L1 + L2) * .985);
            var u = fkK(dv, 1 / fkL(dv)), a1 = (L1 * L1 - L2 * L2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, L1 * L1 - a1 * a1));
            var n0 = fkP(fkS(E, S), u); if (fkL(n0) < 1e-3) { var Ru = fkR(_bw[iU]); n0 = fkP([-Ru[2], -Ru[5], -Ru[8]], u); } n0 = fkN(n0);
            var E2 = fkA(fkA(S, fkK(u, a1)), fkK(n0, h)), W2 = fkA(S, fkK(u, D)), d = fkN(fkS(E2, S)), e = fkN(fkS(W2, E2));
            var zh = fkP(e, d); if (fkL(zh) < .05) { var Ru2 = fkR(_bw[iU]); zh = [Ru2[2], Ru2[5], Ru2[8]]; }      // dirsek on kolu ust kolun onune (+z) buker
            var Wu = fkFY(fkK(d, -1), zh), eU = fkE(fkMM(fkTr(Wp), Wu)), fl = Math.acos(Math.max(-1, Math.min(1, fkD(d, e))));
            pose[iU * 3] = eU[0]; pose[iU * 3 + 1] = eU[1]; pose[iU * 3 + 2] = eU[2]; pose[iF * 3] = -fl; pose[iF * 3 + 1] = 0; pose[iF * 3 + 2] = 0;
        }
        function ctGkHoldIK(a, root) {      // [temas] elde tutulan top: avuclar topun iki yaninda
            var w = Math.min(1, a.holdK || 0); if (w < .05) { a.hik = 0; return; }
            if (!CT_DQ) CT_DQ = new Float32Array(BODY_BONES.length * 8);
            bodyDQ(pose, CT_DQ);
            var hl = BODY_BIND[BB.ForeL], hr = BODY_BIND[BB.ForeR];
            dqsPt(CT_DQ, BB.ForeL, hl[0], hl[1] - .27, hl[2], CT_Q); var PL = [CT_Q[0], CT_Q[1], CT_Q[2]];
            dqsPt(CT_DQ, BB.ForeR, hr[0], hr[1] - .27, hr[2], CT_Q); var PR = [CT_Q[0], CT_Q[1], CT_Q[2]];
            var lat = fkN(fkS(PR, PL)), fz = fkN(fkP([0, 0, 1], lat)), R = .11 * BSC / (a.wScale || .98) + .012;
            var C = [(PL[0] + PR[0]) * .5 + fz[0] * .05, (PL[1] + PR[1]) * .5 + fz[1] * .05, (PL[2] + PR[2]) * .5 + fz[2] * .05];
            var TL = [C[0] - lat[0] * R, C[1] - lat[1] * R, C[2] - lat[2] * R], TR = [C[0] + lat[0] * R, C[1] + lat[1] * R, C[2] + lat[2] * R], Wt = fkR(_bw[BB.Torso]);
            fkArm(BB.ArmL, BB.ForeL, Wt, [PL[0] + (TL[0] - PL[0]) * w, PL[1] + (TL[1] - PL[1]) * w, PL[2] + (TL[2] - PL[2]) * w]);
            fkArm(BB.ArmR, BB.ForeR, Wt, [PR[0] + (TR[0] - PR[0]) * w, PR[1] + (TR[1] - PR[1]) * w, PR[2] + (TR[2] - PR[2]) * w]);
            a.hik = w;
        }
        /* [v139] kurtaris / havadan alma: kalecinin elleri temas aninda topa (kestirilen yol, temas ani). Tutus: avuclar topun iki yaninda (biraz arkasinda);
           celme / bilinmeyen: topa yakin el topa, oteki el yarim agirlikla yardim eder. Erisim fkArm ile sinirli (kol boyu); agirlik temastan .28 sn once artar, .3 sn sonra soner. */
        var GKIK_ON = 1, GKT = new Float64Array(3);
        function ctGkSaveIK(a, root) {
            var ac = a.ac, c = CLK, w = sm(rmp(c, ac.tc - .28, ac.tc - .04)) * (1 - sm(rmp(c, ac.tc + .08, ac.tc + .32))); if (w < .02 || ac.out === 3) return;
            if (ac.k === 1 && ac.path && ac.d) gkPathAt(ac, ac.tc, GKT);
            else if (ac.k === 2 && ac.d) { GKT[0] = ac.d[0]; GKT[1] = .17 + (ac.d[2] || 1.8); GKT[2] = ac.d[1]; }
            else return;
            if (ac.ctp && c >= ac.tc - .1) { GKT[0] = ac.ctp[0]; GKT[1] = ac.ctp[1]; GKT[2] = ac.ctp[2]; }      // ctGkPalm'in son konumu (gorunen top)
            GKT[1] = ballY(GKT[1]);
            if (!CT_DQ) CT_DQ = new Float32Array(BODY_BONES.length * 8);
            bodyDQ(pose, CT_DQ);
            var m = fkW2M(root, GKT), hl = BODY_BIND[BB.ForeL], hr = BODY_BIND[BB.ForeR];
            dqsPt(CT_DQ, BB.ForeL, hl[0], hl[1] - .27, hl[2], CT_Q); var PL = [CT_Q[0], CT_Q[1], CT_Q[2]];
            dqsPt(CT_DQ, BB.ForeR, hr[0], hr[1] - .27, hr[2], CT_Q); var PR = [CT_Q[0], CT_Q[1], CT_Q[2]];
            var R = .11 * BSC / (a.wScale || .98) + .015, lat = fkN(fkS(PR, PL)), TL, TR;
            if (ac.out === 1 || ac.k === 2) { TL = [m[0] - lat[0] * R, m[1] - lat[1] * R, m[2] - lat[2] * R]; TR = [m[0] + lat[0] * R, m[1] + lat[1] * R, m[2] + lat[2] * R]; }      // tutus: top iki avuc arasinda
            else {
                var dL = Math.hypot(PL[0] - m[0], PL[1] - m[1], PL[2] - m[2]), dR = Math.hypot(PR[0] - m[0], PR[1] - m[1], PR[2] - m[2]), near = dL < dR ? PL : PR, nx = near[0] - m[0], ny = near[1] - m[1], nz = near[2] - m[2], nl = Math.hypot(nx, ny, nz) || 1;
                var Tn = [m[0] + nx / nl * R, m[1] + ny / nl * R, m[2] + nz / nl * R], far = dL < dR ? PR : PL, Tf = [far[0] + (m[0] - far[0]) * .55, far[1] + (m[1] - far[1]) * .55, far[2] + (m[2] - far[2]) * .55];
                TL = dL < dR ? Tn : Tf; TR = dL < dR ? Tf : Tn;
            }
            var Wt = fkR(_bw[BB.Torso]);
            fkArm(BB.ArmL, BB.ForeL, Wt, [PL[0] + (TL[0] - PL[0]) * w, PL[1] + (TL[1] - PL[1]) * w, PL[2] + (TL[2] - PL[2]) * w]);
            fkArm(BB.ArmR, BB.ForeR, Wt, [PR[0] + (TR[0] - PR[0]) * w, PR[1] + (TR[1] - PR[1]) * w, PR[2] + (TR[2] - PR[2]) * w]);
        }
        function ctKickIK(a, root) {      // [temas] vuran ayak temas aninda topun arkasinda
            var ac = a.ac; if (!CLKOK || !ac || !ac.init || ac.k !== 18 || ac.hx0 == null) return;
            var c = CLK, w = sm(rmp(c, ac.tc - .14, ac.tc - .03)) * (1 - sm(rmp(c, ac.tc + .02, ac.tc + .1))); if (w < .01) return;
            if (!CT_DQ) CT_DQ = new Float32Array(BODY_BONES.length * 8);
            bodyDQ(pose, CT_DQ);      // kemik dunya matrisleri (_bw) guncel poza
            var lf = ac.foot > 0, iL = lf ? BB.LegL : BB.LegR, iS = lf ? BB.ShinL : BB.ShinR, iF = lf ? BB.FootL : BB.FootR, FB = BODY_BIND[iF], mF = _bw[iF];
            dqsPt(CT_DQ, iF, FB[0], FB[1] - .025, FB[2] + .1, CT_Q); xform(root, CT_Q, CT_W);
            xform(root, fkT(mF), CT_A);
            var R = .11 * BSC + .015, kx = Math.sin(ac.ky), kz = Math.cos(ac.ky), lo = ac.pr && (ac.pr.kind === 'pass_high' || ac.pr.kind === 'clear') ? .05 : .02;
            var dx = ac.hx0 - kx * R - CT_W[0], dy = ballY(ac.hy) - lo - CT_W[1], dz = ac.hz0 - kz * R - CT_W[2], dl = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dl < .005) return; var k = Math.min(1, .35 / dl) * w;
            fkLeg(lf ? 0 : 1, iL, iS, iF, fkR(_bw[0]), fkW2M(root, [CT_A[0] + dx * k, CT_A[1] + dy * k, CT_A[2] + dz * k]), fkR(mF));
        }
        /* [v133] fk yardimcilari halka havuzundan doner (kare basina binlerce kucuk dizi tahsisi yok); sonuc kisa omurlu - kalici tutulacaksa kopyalanir */
        var FK3 = [], FK9 = [], FK3i = 0, FK9i = 0; for (var fki = 0; fki < 1024; fki++) FK3.push(new Float64Array(3)); for (fki = 0; fki < 256; fki++) FK9.push(new Float64Array(9));
        function f3(x, y, z) { var o = FK3[FK3i = (FK3i + 1) & 1023]; o[0] = x; o[1] = y; o[2] = z; return o; }
        function f9() { return FK9[FK9i = (FK9i + 1) & 255]; }
        function fkR(m) { var o = f9(); o[0] = m[0]; o[1] = m[4]; o[2] = m[8]; o[3] = m[1]; o[4] = m[5]; o[5] = m[9]; o[6] = m[2]; o[7] = m[6]; o[8] = m[10]; return o; }      // sutun-oncelikli 4x4 -> satir-oncelikli 3x3
        function fkT(m) { return f3(m[12], m[13], m[14]); }
        function fkS(a, b) { return f3(a[0] - b[0], a[1] - b[1], a[2] - b[2]); } function fkA(a, b) { return f3(a[0] + b[0], a[1] + b[1], a[2] + b[2]); } function fkK(a, k) { return f3(a[0] * k, a[1] * k, a[2] * k); }
        function fkD(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; } function fkX(a, b) { return f3(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]); }
        function fkL(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); } function fkN(a) { var l = fkL(a) || 1; return f3(a[0] / l, a[1] / l, a[2] / l); } function fkP(a, n) { return fkS(a, fkK(n, fkD(a, n))); }
        function fkC(X, Y, Z) { var o = f9(); o[0] = X[0]; o[1] = Y[0]; o[2] = Z[0]; o[3] = X[1]; o[4] = Y[1]; o[5] = Z[1]; o[6] = X[2]; o[7] = Y[2]; o[8] = Z[2]; return o; } function fkTr(m) { var o = f9(); o[0] = m[0]; o[1] = m[3]; o[2] = m[6]; o[3] = m[1]; o[4] = m[4]; o[5] = m[7]; o[6] = m[2]; o[7] = m[5]; o[8] = m[8]; return o; }
        function fkMM(a, b) { var o = f9(), r, c; for (r = 0; r < 3; r++) for (c = 0; c < 3; c++) o[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c]; return o; }
        function fkRx(ax, ay, az) { var cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az), o = f9(); o[0] = cy * cz; o[1] = -cy * sz; o[2] = sy; o[3] = sx * sy * cz + cx * sz; o[4] = -sx * sy * sz + cx * cz; o[5] = -sx * cy; o[6] = -cx * sy * cz + sx * sz; o[7] = cx * sy * sz + sx * cz; o[8] = cx * cy; return o; }
        function fkE(m) { var ay = Math.asin(Math.max(-1, Math.min(1, m[2]))); return f3(Math.atan2(-m[5], m[8]), ay, Math.atan2(-m[1], m[0])); }
        function fkFY(Y, Zh) { Y = fkN(Y); var Z = fkP(Zh, Y); if (fkL(Z) < 1e-4) Z = fkP([0, 0, 1], Y); Z = fkN(Z); return fkC(fkX(Y, Z), Y, Z); }
        function fkW2M(root, p) {      // dunya -> model (kok: oteleme * yaw * olcek)
            var ws = Math.sqrt(root[0] * root[0] + root[2] * root[2]) || 1, c = root[0] / ws, s = root[8] / ws, dx = p[0] - root[12], dz = p[2] - root[14];
            return [(dx * c - dz * s) / ws, (p[1] - root[13]) / (root[5] || 1), (dx * s + dz * c) / ws];
        }
        function fkLeg(sd, iL, iS, iF, Wh, tgt, keepFootW) {      // model uzayinda bilegi tgt'ye goturen kalca / diz / bilek acilari -> pose
            var H = fkT(_bw[iL]), K = fkT(_bw[iS]), A = fkT(_bw[iF]), L1 = fkL(fkS(K, H)), L2 = fkL(fkS(A, K)), dv = fkS(tgt, H), D = fkL(dv);
            if (D < .05) return; D = Math.min(D, (L1 + L2) * .97);      /* [ayak] diz hic tam gerilmez */ var u = fkK(dv, 1 / fkL(dv)), a1 = (L1 * L1 - L2 * L2 + D * D) / (2 * D), h = Math.sqrt(Math.max(0, L1 * L1 - a1 * a1));
            var n0 = fkP(fkS(K, H), u);
            if (BK_ON) { var Wb0 = fkR(_bw[iL]), zk0 = fkP([Wb0[2], Wb0[5], Wb0[8]], u), lz0 = fkL(zk0), ln0 = fkL(n0); if (lz0 > 1e-3 && !(ln0 > .03 && fkD(n0, zk0) > .5 * ln0 * lz0)) n0 = zk0; }      /* [bacak] diz kapagi yonu */
            if (fkL(n0) < 1e-3) { var Wl0 = fkR(_bw[iL]); n0 = fkP([Wl0[2], Wl0[5], Wl0[8]], u); } n0 = fkN(n0);
            var K2 = fkA(fkA(H, fkK(u, a1)), fkK(n0, h)), A2 = fkA(H, fkK(u, D)), d = fkN(fkS(K2, H)), e = fkN(fkS(A2, K2));
            var zh = fkK(fkP(e, d), -1); if (fkL(zh) < .05) { var Wl1 = fkR(_bw[iL]); zh = [Wl1[2], Wl1[5], Wl1[8]]; }
            var Wl = fkFY(fkK(d, -1), zh), eL = fkE(fkMM(fkTr(Wh), Wl)), kn = Math.acos(Math.max(-1, Math.min(1, fkD(d, e))));
            pose[iL * 3] = eL[0]; pose[iL * 3 + 1] = eL[1]; pose[iL * 3 + 2] = eL[2]; pose[iS * 3] = kn; pose[iS * 3 + 1] = 0; pose[iS * 3 + 2] = 0;
            var Rs = fkMM(fkMM(Wh, fkRx(eL[0], eL[1], eL[2])), fkRx(kn, 0, 0)), eF = fkE(fkMM(fkTr(Rs), keepFootW));      // bilek: dunya yonu korunur
            pose[iF * 3] = eF[0]; pose[iF * 3 + 1] = eF[1]; pose[iF * 3 + 2] = eF[2];
        }
        var NC_ON = 1, NC_M = .03, NC_DQ = null;
        function legNoCross(a) {      /* [bacak] bilekler kalca ekseninde caprazlanmaz */
            if ((a.acW || 0) > .3) return;
            if (!NC_DQ) NC_DQ = new Float32Array(BODY_BONES.length * 8);
            bodyDQ(pose, NC_DQ);
            var Wh = fkR(_bw[0]), sx = [Wh[0], 0, Wh[6]], sl = Math.hypot(sx[0], sx[2]); if (sl < .2) return; sx[0] /= sl; sx[2] /= sl;
            var AL = fkT(_bw[BB.FootL]), AR = fkT(_bw[BB.FootR]), xc = (AL[0] - AR[0]) * sx[0] + (AL[2] - AR[2]) * sx[2];
            if (xc <= NC_M) return;
            var need = xc - NC_M, lo = Math.min(AL[1], AR[1]), fk = a.fk || [{}, {}];
            var wL = Math.max(.01, AL[1] - lo + .02) * (fk[0].lk ? .15 : 1), wR = Math.max(.01, AR[1] - lo + .02) * (fk[1].lk ? .15 : 1), sw = wL + wR;
            var mL = need * wL / sw, mR = need * wR / sw, mFL = fkR(_bw[BB.FootL]), mFR = fkR(_bw[BB.FootR]);
            if (mL > .002) fkLeg(0, BB.LegL, BB.ShinL, BB.FootL, Wh, [AL[0] - sx[0] * mL, AL[1], AL[2] - sx[2] * mL], mFL);
            if (mR > .002) fkLeg(1, BB.LegR, BB.ShinR, BB.FootR, Wh, [AR[0] + sx[0] * mR, AR[1], AR[2] + sx[2] * mR], mFR);
        }
        function footIK(a, root) {
            var dt = Math.max(1e-3, FRM[5] || FRM[2]), sd, q;      // [v133] kilit esikleri sim saatiyle (hizli oynatmada da ayak kayamaz)
            if (!a.fk) a.fk = [{ lk: 0, w: 0, t: 0 }, { lk: 0, w: 0, t: 0 }];
            var ack = a.ac && a.ac.init ? a.ac.k : 0, act = (!(a.acW < .3) && !((ack === 16 && a.ac.mode === 3 && !OA3_FULL) || ack === 18)) || (a.rY || 0) > .05;      // tek bacakli karsilama (16 mod 3) ve vurusta destek ayagi kilitlenir
            if (!FK_DQ) FK_DQ = new Float32Array(BODY_BONES.length * 8);
            bodyDQ(pose, FK_DQ);
            var Wh = fkR(_bw[0]), any = false;
            for (sd = 0; sd < 2; sd++) {
                var st = a.fk[sd], iL = sd ? BB.LegR : BB.LegL, iS = sd ? BB.ShinR : BB.ShinL, iF = sd ? BB.FootR : BB.FootL, mF = _bw[iF];
                var A = fkT(mF), toe = [mF[12] + mF[4] * -.04 + mF[8] * .16, mF[13] + mF[5] * -.04 + mF[9] * .16, mF[14] + mF[6] * -.04 + mF[10] * .16];
                xform(root, A, FK_M); var Aw = [FK_M[0], FK_M[1], FK_M[2]]; xform(root, toe, FK_M); var tY = FK_M[1];
                var v = st.pA ? Math.hypot(Aw[0] - st.pA[0], Aw[2] - st.pA[2]) / dt : 9; st.pA = Aw;
                if (act) { st.lk = 0; st.w = 0; continue; }
                var acR = a.ac && a.ac.init && a.ac.k === 16 && a.ac.mode === 3 && !OA3_FULL ? a.ac : null;      // [karsila] karsilayan ayak topa uzanir
                if (acR && (acR.side > 0) === (sd === 0) && GB.ok !== false) {
                    var cR = CLK, eR = sm(rmp(cR, acR.tc - .16, acR.tc - .03)) * (1 - sm(rmp(cR, acR.tc + .05, acR.tc + .2)));
                    if (eR > .01) {
                        var bxw = GB.x, bzw = GB.z, Hw = fkT(_bw[iL]); xform(root, Hw, FK_M); var hx = FK_M[0], hz = FK_M[2], qx = bxw - hx, qz = bzw - hz, ql = Math.hypot(qx, qz) || 1;
                        var qlc = Math.min(ql, .48), tgw = [hx + qx / ql * (qlc - .1), .08, hz + qz / ql * (qlc - .1)]; eR *= .75;      /* [ayak] kalcadan en cok .38 m, kismi agirlik */ var tgw0 = tgw, tgm = fkW2M(root, [Aw[0] + (tgw[0] - Aw[0]) * eR, Aw[1] + (tgw[1] - Aw[1]) * eR, Aw[2] + (tgw[2] - Aw[2]) * eR]);
                        st.lk = 0; st.w = 0; fkLeg(sd, iL, iS, iF, Wh, tgm, fkR(mF)); any = true; continue;
                    }
                }
                if (!st.lk && tY < .04 && v < .9) { st.lk = 1; st.x = Aw[0]; st.y = Aw[1]; st.z = Aw[2]; st.t = 0; st.fw = Float64Array.from(fkR(mF)); st.yw = a.dYaw; }      // [v133] havuzdan kopya (kalici)
                else if (st.lk) { var hW = fkT(_bw[iL]); xform(root, hW, FK_M); var sup = !!(a.ac && a.ac.init && a.ac.k === 16 && a.ac.mode === 3); if (tY > .07 || Math.hypot(Aw[0] - st.x, Aw[2] - st.z) > (sup ? .28 : .2) || Math.hypot(FK_M[0] - st.x, FK_M[2] - st.z) > (sup ? .55 : .48) || st.t > (sup ? 1.2 : .9)) st.lk = 0; }      /* [ayak] bacak acilmadan birak */
                st.t += dt; st.w += ((st.lk ? 1 : 0) - st.w) * (1 - Math.exp(-dt / .05));
                if (st.w < .01) continue;
                var tw = [Aw[0] + (st.x - Aw[0]) * st.w, Aw[1], Aw[2] + (st.z - Aw[2]) * st.w], tm = fkW2M(root, tw);
                var fW = fkR(mF); if (st.fw && st.lk) {
                    var ry = (st.yw || 0) - a.dYaw;
                    if (BK_ON) { ry = Math.atan2(Math.sin(ry), Math.cos(ry)); if (ry > BK_YW) { ry = BK_YW; st.yw = a.dYaw + ry; } else if (ry < -BK_YW) { ry = -BK_YW; st.yw = a.dYaw + ry; } }      /* [bacak] pivot: ayak govdeden en cok BK_YW geride */
                    var rc = Math.cos(ry), rs = Math.sin(ry); fW = fkMM([rc, 0, rs, 0, 1, 0, -rs, 0, rc], st.fw);
                }      // kilitteki dunya yonu (govde dondukce ters)
                fkLeg(sd, iL, iS, iF, Wh, tm, fW); any = true;
            }
            return any;
        }
        var GFT = null;
        function gaspFeet() {      // ileri kosu: cevrim mesafesi D[hiz*2] ve dokunus tablosu (motorla ortak)
            if (GFT) return GFT; var G = gaspInit(); if (!G.ok) return null;
            var DQ = new Float32Array(BODY_BONES.length * 8), Q = new Float32Array(3), FL = BODY_BIND[BB.FootL], FR = BODY_BIND[BB.FootR], fake = { latV: 0, lonV: 0, gaP: 0, gaC: 0, dYaw: 0 }, sp, k, D = [], tab = [];
            for (sp = 0; sp <= 10.001; sp += .5) { fake.lonV = Math.max(.31, sp); pose.fill(0); fake.gaP = 0; gaspLoco(fake, Math.max(.21, sp), 1); D.push(+(fake.gaD || 0).toFixed(4)); }
            for (sp = 0; sp <= 9; sp++) {
                var zL = [], yL = [], xL = [], zR = [], yR = [], xR = [], e = [0, 0, 0, 0, .08, -.08], s = Math.max(.6, sp);
                for (k = 0; k < 72; k++) {
                    fake.lonV = s; fake.gaP = k / 72; fake.gaC = 0; pose.fill(0); gaspLoco(fake, s, 1); bodyDQ(pose, DQ);
                    var sz = GA_SURGE ? (fake.gaRZ || 0) : 0, sx = GA_SURGE ? (fake.gaRX || 0) : 0;
                    dqsPt(DQ, BB.FootL, FL[0], FL[1] - .04, FL[2] + .16, Q); zL.push(Q[2] + sz); yL.push(Q[1]); xL.push(Q[0] + sx);
                    dqsPt(DQ, BB.FootR, FR[0], FR[1] - .04, FR[2] + .16, Q); zR.push(Q[2] + sz); yR.push(Q[1]); xR.push(Q[0] + sx);
                }
                [[zL, yL, 0, xL], [zR, yR, 2, xR]].forEach(function (f) {
                    var zz = f[0], yy = f[1], zm = Math.max.apply(null, zz), i0 = 0, j, kk = 0;
                    for (j = 0; j < 72; j++) if (zz[j] < zz[i0]) i0 = j;
                    for (j = 1; j < 72; j++) { kk = (i0 + j) % 72; if (zz[kk] >= .8 * zm && yy[kk] < .15) break; }
                    e[f[2]] = +zz[kk].toFixed(3); e[f[2] + 1] = +(kk / 72 * 2 * Math.PI).toFixed(3); e[4 + f[2] / 2] = +(-f[3][kk]).toFixed(3);
                });
                tab.push(e);
            }
            GFT = { D: D, tab: tab }; return GFT;
        }
        var KC_ON = 1, KCT = {};
        function kcTrue(nm, mr, s) {      // [temas] klibin gercek temas ani (sn); onbellekli
            var key = nm + '|' + mr; if (KCT[key] != null) return KCT[key];
            var T = (s.n - 1) / s.fps, st = 1 / 120, P = new Float32Array(39), DQ = new Float32Array(BODY_BONES.length * 8), Q = new Float32Array(3), FL = BODY_BIND[BB.FootL], FR = BODY_BIND[BB.FootR], A = [], B = [], ts = [], t, i;
            for (t = 0; t <= T + 1e-6; t += st) { mcPose(nm, t, P, false, mr); bodyDQ(P, DQ); dqsPt(DQ, BB.FootL, FL[0], FL[1] - .04, FL[2] + .16, Q); A.push([Q[0], Q[1], Q[2]]); dqsPt(DQ, BB.FootR, FR[0], FR[1] - .04, FR[2] + .16, Q); B.push([Q[0], Q[1], Q[2]]); ts.push(t); }
            var n = ts.length, vA = -9, vB = -9, iA = 1, iB = 1;
            for (i = 1; i < n; i++) { var va = (A[i][2] - A[i - 1][2]) / st, vb = (B[i][2] - B[i - 1][2]) / st; if (va > vA) { vA = va; iA = i; } if (vb > vB) { vB = vb; iB = i; } }      // ileri (model +z) hiz: donus salinimi sayilmaz
            var K = vA >= vB ? A : B, im = vA >= vB ? iA : iB, cfT = s.cf, best = -9, ib = -1, lo = 9, il = -1;
            for (i = Math.max(1, im - Math.round(.45 / st)); i <= im; i++) {      // temas: ayak ucu yerden alcakken (<= 12 cm) ileri hizin en buyuk oldugu an
                var hy = (K[i][1] + K[i - 1][1]) * .5, vz = (K[i][2] - K[i - 1][2]) / st;
                if (hy <= .12 && vz > best) { best = vz; ib = i; }
                if (hy < lo) { lo = hy; il = i; }
            }
            if (ib < 0) ib = il;
            if (ib > 0) cfT = (ts[ib - 1] + ts[ib]) * .5;
            KCT[key] = cfT; return cfT;
        }
        function mxKickName(ac, pr) {      // [v58] şut: koşarak vuruş · penaltı: penaltı klibi · pas/havadan pas: pas klibi · uzaklaştırma: şut klibi
            var k = pr && pr.kind;
            if (!MX_ON) return k === 'shot' ? 'strike foward jog' : 'kick soccerball';
            var n = k === 'shot' ? (ac.pen ? 'mx penalty' : 'mx strike') : k === 'clear' ? 'mx strike' : 'mx pass'; MXC[n] = (MXC[n] || 0) + 1; return n;
        }
        function mcKick(a, ac, u, b0, w) {      // [mocap] vurus klibi; false: klip yok (prosedurel)
            var pr = ac.pr, nm = mxKickName(ac, pr), s = ADO_MOCAP[nm]; if (!s || s.cf == null) return false;
            var mr = (ac.foot > 0) !== (s.kf === 'L') ? 1 : 0, cf = KC_ON ? kcTrue(nm, mr, s) : s.cf, pre = Math.max(.08, -b0), r = Math.min(1.8, Math.max(1, cf * .9 / pre)), tcl = u < 0 ? cf + u * r : cf + u, b, W0 = PW_;
            mcPose(nm, Math.max(0, tcl), MCK, false, mr);
            PW_ = W0 * w; PA(kHi, MCK[0], MCK[1], MCK[2]); for (b = 1; b < 13; b++) PA(b * 3, MCK[b * 3], MCK[b * 3 + 1], MCK[b * 3 + 2]); PW_ = W0;
            return true;
        }
        function spStrike(a, ac, c) {
            var u = c - ac.tc, b0 = ac.kb0, b1 = ac.kb1, w = sm(rmp(u, b0 - .03, b0 * .4)) * (1 - sm(rmp(u, .3, .58)));
            if (w < .002) return;
            if (MC_KICK && mcKick(a, ac, u, b0, w * (1 - sm(rmp(u, .08, .26)) * Math.max(0, Math.min(1, ((a.spd || 0) - 2) / 2))))) return;      // [gasp] hizli vurucuda takip erken soner      // [mocap]
            var W0 = PW_; PW_ = W0 * w;
            var pr = ac.pr, R_ = ac.foot > 0, K = R_ ? kLL : kLR, Sp = R_ ? kLR : kLL, AO = R_ ? kAR : kAL, AS = R_ ? kAL : kAR, zO = AO === kAL ? -1 : 1, zS = AS === kAL ? -1 : 1, pass = pr.kind === 'pass';
            var lg0 = pr.lg0 != null ? pr.lg0 : .9, lg1 = pr.lg1 != null ? pr.lg1 : -1.4, kn0 = pr.kn0 != null ? pr.kn0 : 1.2, arm = pr.arm != null ? pr.arm : .4, tq = pr.torso || 0;
            var lean = pr.kind === 'shot' ? .2 : pass ? .1 : -.15, tw = (R_ ? 1 : -1) * (.5 + .5 * Math.min(1, tq));
            var hs = k5(u, b0, b1, .16, .45, -.45, -.45, -.42, -.08, -.05), ks = k5(u, b0, b1, .16, .45, .28, .22, .4, .45, .25);     // destek ayağı temasta topun yanında (leğen topun ~.35 m gerisinde)
            var rotE = pass ? (K === kLL ? -.7 : .7) * sm(rmp(u, b0, b1)) * (1 - sm(rmp(u, .1, .35))) : 0;      // içten pas: ayak içi topa
            PA(K, k5(u, b0, b1, .16, .45, .2, lg0, pass ? -.3 : -.38, lg1, -.2), rotE, null);
            PA(K + 3, k5(u, b0, b1, .16, .45, .7, kn0 + .12, pass ? .22 : .5, .1, .3), 0, 0);
            PA(K + 6, k5(u, b0, b1, .16, .45, .1, .25, pass ? 0 : .55, .35, 0), 0, 0);
            PA(Sp, hs, null, null); PA(Sp + 3, ks, 0, 0); PA(Sp + 6, k5(u, b0, b1, .16, .45, 0, -.1, -.06, .12, 0), 0, 0);
            PA(kHi, null, -legDrop(hs, ks, 0), null);
            PA(kTo, k5(u, b0, b1, .16, .45, .1, lean * .4, lean, lean + .08, .1), k5(u, b0, b1, .16, .45, 0, .22 * tw, 0, -.26 * tw, 0), 0);
            PA(kHe, .28, 0, 0);
            PA(AO, k5(u, b0, b1, .16, .45, -.3, -.55, -.42, -.12, -.15), 0, zO * k5(u, b0, b1, .16, .45, .35, 1.0, 1.2, .95, .3)); PA(AO + 3, -.5, 0, 0);
            PA(AS, k5(u, b0, b1, .16, .45, .05, -arm, .25, .5, .1), 0, zS * .18); PA(AS + 3, -.6, 0, 0);
            PW_ = W0;
        }
        /* taç: zaman planı (alış tpH/tp1, kurma tw, bırakış tc); vakit kısaysa sıkıştırılır */
        function spThrowPlan(ac) {
            var T = ac.tc - ac.t0, dist = ac.d[4] || 12, Tw = clamp(.36 + .006 * dist, .36, .5), need = .45 + Tw, k = T < need ? Math.max(.15, T / need) : 1;
            ac.tpH = ac.t0 + .2 * k; ac.tp1 = ac.t0 + .45 * k; ac.tw = Math.max(ac.tp1, ac.tc - Tw * k);
            ac.arch = clamp(.26 + .012 * dist, .3, .55); ac.te = ac.tc + .55;
        }
        function spThrow(a, ac, c, P) {
            var t0 = ac.t0, tH = ac.tpH, t1 = ac.tp1, tw = ac.tw, tc = ac.tc, tf = tc + .3;
            RT.lk = 0; RT.hy = 1; RT.ya = spYawT(ac, c); RT.yw = sm(rmp(c, t1 - .1, t1 + .25));      // topu aldıktan sonra hedefe dönük
            if (!P) return;
            var W0 = PW_, kb = sm(rmp(c, t0, tH)) * (1 - sm(rmp(c, tH + .02, t1)));                // eğilip yerden alma
            var e1 = sm(rmp(c, tH - .02, t1)), e2 = sm(rmp(c, tw, tc - .1)), e3 = rmp(c, tc - .1, tc), e4 = sm(rmp(c, tc, tf));
            e3 *= e3;                                                        // atış: bırakışa doğru hızlanır
            var ax = -1.1, fx = -.2, zz = .1;
            ax += (-.8 - ax) * e1; fx += (-1.5 - fx) * e1; zz += (.26 - zz) * e1;          // göğüs önünde iki elle taşıma
            ax += (-2.95 - ax) * e2; fx += (-1.5 - fx) * e2; zz += (.15 - zz) * e2;        // baş arkasına kurma (omuz ~170°, dirsek ~85°: top başın arkasında, tepesi hizasında)
            ax += (-2.2 - ax) * e3; fx += (-.5 - fx) * e3;                                   // atış: kollar baş üstünden öne, dirsek açılır
            ax += (-.8 - ax) * e4; fx += (-.3 - fx) * e4; zz += (.3 - zz) * e4;            // takip
            PW_ = W0 * sm(rmp(c, t0, t0 + .12));
            PA(kAL, ax, 0, zz); PA(kAR, ax, 0, -zz); PA(kFL, fx, 0, 0); PA(kFR, fx, 0, 0);
            // gövde: alırken eğilir; kurmada geriye esner (uzun taçta daha çok), atışta öne kamçılanır; baş öne telafi eder (gözler ileride)
            var to = 0, he = 0;
            to += (-ac.arch - to) * e2; he += (.22 - he) * e2; to += (.32 - to) * e3; he += (.12 - he) * e3; to += (.42 - to) * e4; he += (.15 - he) * e4;
            var wT = Math.max(kb, sm(rmp(c, tw - .08, tw + .1)) * (1 - sm(rmp(c, tf, ac.te))));
            if (wT > .002) { PW_ = W0 * wT; PA(kTo, to + .85 * kb, 0, 0); PA(kHe, he - .2 * kb, 0, 0); }
            if (kb > .002) { PW_ = W0 * kb; PA(kHi, .25, -legDrop(-.85, 1.15, .25), 0); PA(kLL, -.85, null, null); PA(kLR, -.85, null, null); PA(kSL, 1.15, 0, 0); PA(kSR, 1.15, 0, 0); }
            // çizgide adım açık, iki ayak yerde: öndeki güçlü ayağın karşısı, arka ayak parmak ucunda (topuk kalkık)
            var wl = sm(rmp(c, tw - .12, tw + .12)) * (1 - sm(rmp(c, tf, ac.te)));
            if (wl > .002) {
                var fr = ac.d[7] < 0 ? kLL : kLR, bk = fr === kLL ? kLR : kLL, kf = .32 + .1 * e3;
                PW_ = W0 * wl;
                PA(fr, -.32, null, null); PA(fr + 3, kf, 0, 0); PA(fr + 6, -.05, 0, 0);
                PA(bk, .2, null, null); PA(bk + 3, .14, 0, 0); PA(bk + 6, .32, 0, 0);
                PA(kHi, null, -legDrop(-.32, kf, 0), null);
            }
            PW_ = W0;
        }
        /* baraj: eller kasık önünde, ayaklar bitişik; şutta vuruşla birlikte sıçrama (çömelme → ~.3 m, ~.5 sn havada → dizlerle iniş) */
        function spWall(a, ac, c, P) {
            var jp = ac.d[2] > 0, tk = ac.tc - .03, Ta = .5, hJ = .3;
            RT.lk = 0; RT.yw = 1;
            if (jp && c >= tk && c < tk + Ta) { var u = (c - tk) / Ta; RT.Y = 4 * hJ * u * (1 - u); }
            if (!P) return;
            var cr = jp ? sm(rmp(c, tk - .16, tk - .02)) * (1 - sm(rmp(c, tk - .02, tk + .06))) : 0;
            var air = jp ? sm(rmp(c, tk, tk + .1)) * (1 - sm(rmp(c, tk + Ta - .1, tk + Ta))) : 0;
            var ld = jp ? sm(rmp(c, tk + Ta - .04, tk + Ta + .06)) * (1 - sm(rmp(c, tk + Ta + .06, tk + Ta + .28))) : 0;
            var kn = .14 + .6 * cr + .3 * air + .5 * ld, hp = -.08 - .3 * cr - .25 * air - .35 * ld;
            PA(kHi, .05, -legDrop(hp, kn, 0) * (1 - air), 0); PA(kTo, .08 + .25 * cr + .1 * ld, 0, 0); PA(kHe, .05, 0, 0);
            PA(kLL, hp, -.05, .03); PA(kLR, hp, .05, -.03); PA(kSL, kn, 0, 0); PA(kSR, kn, 0, 0); PA(kfL, .35 * air, 0, 0); PA(kfR, .35 * air, 0, 0);
            PA(kAL, -.28, .75, .2); PA(kAR, -.28, -.75, -.2); PA(kFL, -.45, 0, 0); PA(kFR, -.45, 0, 0);     // eller kasık önünde üst üste (iç rotasyon)
        }
        /* kök kendi yolunda yürüyor/koşuyorsa (motor vurucuyu topun üstünde tutar) hız ve adım evresi kökün hareketinden (sim saatiyle) */
        function spGait(a) {
            var w = a.gW || 0, px = a.gX, pz = a.gZ, w0 = a.gWp || 0; a.gX = a.dX; a.gZ = a.dZ; a.gWp = w;
            if (w < .01 || !(px > -1e9)) { if (!(px > -1e9)) a.gWp = 0; return; }
            if (w0 < .01 || !(a.gSp >= 0)) a.gSp = a.spd;                  // [oa] ilk karede (temizlemeden sonra) başlatılmamış kalmasın
            var dx = a.dX - px, dz = a.dZ - pz, d = Math.sqrt(dx * dx + dz * dz), dts = a.gDt || 0;
            if (d > 3) return;
            if (dts > 1e-4) a.gSp += (Math.min(10.5, d / dts) - a.gSp) * (1 - Math.exp(-dts / .07));
            a.spd += (a.gSp - a.spd) * w;
            var bk = d > 1e-4 && (dx * Math.sin(a.dYaw) + dz * Math.cos(a.dYaw)) < -.35 * d ? -1 : 1;    // geri geri yürüyüş: adım döngüsü ters
            a.ph += w * bk * d * gaitPhK(a.spd, 0);
        }
        function spRel(ox, oy, oz, rt, tau, T, h0) {
            SPB.on = 1; SPB.ox = ox; SPB.oy = oy; SPB.oz = oz; SPB.rt = rt; SPB.tau = tau; SPB.arc = T > 0 ? 1 : 0;
            if (T > 0) { SPB.tl = T; SPB.h0 = h0; SPB.vz = (.17 - h0 + 4.905 * T * T) / T; }
        }
        /* görsel top (gkBall'dan sonra): duran top vuruşunda temasa dek noktada, sonra motor topuna sönen ofset (penaltıda motor topu vurucunun
           önüne taşır); taçta alınana dek yerde, sonra ellerde, bırakışta yayla; kornerde ölü top süresince yayın içinde */
        function spBall(v) {
            if (!CLKOK) { SPB.on = 0; return; }
            if (V7_DLV) { SPB.on = 0; return; }      // [v187] top görevlisi yeni topu atıyor: görünen top arayüzden
            var bx = v.bx, bz = v.by, i, a, ac;
            for (i = 0; i < S.n; i++) {
                a = S.st[i]; ac = a.ac; if (!ac || !ac.init || ac.cx || (ac.k !== 8 && ac.k !== 9)) continue;
                if (ac.k === 8) {
                    if (CLK < ac.tc) {
                        GB.x = ac.d[0]; GB.y = .17; GB.z = ac.d[1]; GB.held = false; SPB.on = 0;
                        if (ac.d[9] & 8) {                                   // korner: top eğilip koyarken varsayılan yay noktasından seçilen noktaya
                            var wq = ac.mode === 1 ? sm(rmp(CLK, ac.tA + .15, ac.tB - .15)) : sm(rmp(CLK, ac.t0, ac.t0 + .3));
                            var cpl = SP_DEAD && SP_DEAD.bx === SP_DEAD.bx;          // [sp] planlı yay noktası biliniyor: top oradan (koyma noktasıyla aynı - kayma yok)
                            if (wq < 1) { var qx0 = cpl ? SP_DEAD.bx : (ac.d[0] < PW / 2 ? 0 : PW) + (ac.d[0] < PW / 2 ? SP_CA : -SP_CA), qz0 = cpl ? SP_DEAD.by : (ac.d[1] < PH / 2 ? 0 : PH) + (ac.d[1] < PH / 2 ? SP_CA : -SP_CA); GB.x = qx0 + (GB.x - qx0) * wq; GB.z = qz0 + (GB.z - qz0) * wq; }
                        }
                        return;
                    }
                    if (!ac.rel) { ac.rel = true; var ox = ac.d[0] - bx, oz = ac.d[1] - bz; if (ox * ox + oz * oz < 81) spRel(ox, 0, oz, ac.tc, ac.tau, 0, 0); }
                } else {
                    if (CLK < ac.tc || (!ac.thr && CLK < ac.tc + .6)) {
                        var w = a.hR ? sm(rmp(CLK, ac.tpH - .1, ac.tpH + .03)) : 0, hx = ac.d[0], hy = .17, hz = ac.d[1];
                        if (w > 0) { var sy = Math.sin(a.dYaw), cy = Math.cos(a.dYaw); hx += ((a.hR[0] + a.hL[0]) * .5 + sy * .03 - hx) * w; hy += ((a.hR[1] + a.hL[1]) * .5 + .02 - hy) * w; hz += ((a.hR[2] + a.hL[2]) * .5 + cy * .03 - hz) * w; }
                        GB.x = hx; GB.y = Math.max(.16, hy); GB.z = hz; GB.held = w > .5; SPB.lx = GB.x; SPB.ly = GB.y; SPB.lz = GB.z; SPB.on = 0; return;
                    }
                    if (!ac.rel) { ac.rel = true; spRel(SPB.lx - bx, 0, SPB.lz - bz, Math.max(ac.tc, CLK - .02), .22, ac.d[5] > .05 ? ac.d[5] : .7, SPB.ly); }
                }
            }
            if (SPB.on) {
                var tt = CLK - SPB.rt, kk = tt < 0 ? 1 : Math.exp(-tt / SPB.tau);
                GB.x += SPB.ox * kk; GB.y += SPB.oy * kk; GB.z += SPB.oz * kk;
                if (SPB.arc && tt >= 0 && tt < SPB.tl) GB.y = Math.max(GB.y, SPB.h0 + SPB.vz * tt - 4.905 * tt * tt);
                if (tt < -.5 || (kk < .01 && (!SPB.arc || tt > SPB.tl))) SPB.on = 0;
                return;
            }
            if (SP_DEAD && SP_DEAD.kind === 'corner') {                      // korner: top yayın içinde (motor köşe noktasında tutar) · [sp] vurucu belliyse planlı noktada
                if (SP_DEAD.bx === SP_DEAD.bx) { GB.x = SP_DEAD.bx; GB.z = SP_DEAD.by; }
                else { GB.x = SP_DEAD.x + (SP_DEAD.x < PW / 2 ? SP_CA : -SP_CA); GB.z = SP_DEAD.y + (SP_DEAD.y < PH / 2 ? SP_CA : -SP_CA); }
            }
        }
        /* ===== [oa] SAHA OYUNCUSU AKSİYONLARI — yalnızca görüntü (simülasyona/kayda dokunmaz) =====
           Kaleci/duran top altyapısını (a.ac, sim saati CLK, RT kök çıktısı, günlük → tekrar) kullanır. Açılar Gameplay Football anahtar kareleri
           (header_jump, interfere reach/side, sliding, trip, stand_up, trap chest) ve biyomekanik literatürüyle hizalı. Türler:
           11 kafa: yüksek topun inişinden önce kurulur (iki takımdan adaylar birlikte sıçrar); koşarak tek ayak (salınım dizi yukarı sürülür) ya da
              duruştan çift ayak (derin çömelme), kalkışta gövde geriye gerilir, temas sıçramanın tepesinde - gövde ve boyun öne kamçılanır, kollar
              yukarı-yana açık (denge/koruma), iniş dizlerle. Temas pozundaki alın noktası topun yoluna gelecek kök ofseti ve sıçrama yüksekliği bir kez
              hesaplanır. Kazanan: top alında tutulur, motorun topuna (kontrolde yerçekimiyle ayağa) iner.
           12 müdahale: ayakta öne uzanma (kalça ~70°, diz 120° kıvrıktan ~30°'ye açılır) / yandan blok (bacak yana açılır, ayak içi topa) / kayarak
              (kalça geriye yatar, kök ~.75 m alçalır, ön bacak gergin, alttaki bacak katlı, destek eli yerde, yavaşlayarak kayar → diz çöküp kalkar);
              kaçan müdahalede (motor savunmacıyı "geçildi" sayar) uzanma boşa gider, savunmacı bir an dengesini kaybeder.
           13 sendeleme (topu kaptıran): gövde itilme yönüne, kollar dengede yana.
           14 faul sonrası düşme: öne yüzüstü (gövde ivmelenerek ~88°'ye, kollar düşüşü karşılar, baş kalkık) / yana / sırtüstü; momentumla kısa kayar,
              yerde kalır, eller-dizler → tek diz → ayağa (~.85 sn). Kök düştüğü yere kilitli; kalkınca motor konumuna yürür.
           15 faul yapan: motor onu yavaşlattıkça durur ve rakibine döner (kök motorda), itiraz (eller havada → açık avuçlar) ya da hayal kırıklığı (eller belde);
              kart gelirse eller belde, baş eğik bekler.
           16 göğüs / uyluk kontrolü: top göğse (gövde geriye, kollar açık) / kalkık uyluğa gelir, yastıklanır, ayağa düşer.
           17 şut bloğu: gövde öne ve yan döner, kollar arkada, alçak topta bacak topa uzanır.
           18 canlı oyunda vuruş: kickProfile genlikleri (geri savurma, diz kamçısı, destek dizi, karşı kol) SİM saatinde; temas olaydan ~.07-.11 sn
              sonra - top görüntüde temasa dek ayakta tutulur, sonra motorun topuna sönen ofsetle yetişir (görsel zaman bükme). Temas pozundaki vuruş
              ayağı topa gelecek kök ofseti hesaplanır (destek ayağı topun yanında); gövde koşu yönüyle vuruş yönü arasına döner.
           Kök kilitli aksiyonlarda (kayma, düşme, faul yapan) adım evresi kökün kendi hareketinden (RT.gait) - motor oyuncuyu taşısa da ayak kaymaz. */
        /* [tp] motor topunun kısa geçmişi (görünen saat → konum): vuruş bırakışında top, motorun yolunu zaman kaydırmasıyla izler */
        var BH = { t: new Float64Array(240), x: new Float32Array(240), y: new Float32Array(240), z: new Float32Array(240), n: 0, h: 0 }, TSP = [0, 0, 0];
        function bhPush(c, x, y, z) {
            var L = 240;
            if (BH.n) { var li = (BH.h + L - 1) % L; if (c < BH.t[li] - 1e-6) BH.n = 0; else if (c - BH.t[li] < 1e-6) { BH.x[li] = x; BH.y[li] = y; BH.z[li] = z; return; } }
            BH.t[BH.h] = c; BH.x[BH.h] = x; BH.y[BH.h] = y; BH.z[BH.h] = z; BH.h = (BH.h + 1) % L; if (BH.n < L) BH.n++;
        }
        function bhAt(c, o) {
            var L = 240, k, i, j; if (!BH.n) return false;
            for (k = 0; k < BH.n; k++) {
                i = (BH.h + L - 1 - k) % L;
                if (BH.t[i] <= c) {
                    if (k === 0) { o[0] = BH.x[i]; o[1] = BH.y[i]; o[2] = BH.z[i]; return true; }
                    j = (i + 1) % L; var dt = BH.t[j] - BH.t[i], a = dt > 1e-6 ? (c - BH.t[i]) / dt : 0;
                    var jx = BH.x[j] - BH.x[i], jy = BH.y[j] - BH.y[i], jz = BH.z[j] - BH.z[i], jl = jx * jx + jy * jy + jz * jz; if (jl > 1 && jl > 2025 * dt * dt) a = 0;      // [fm] motor topu isinlandi (> 45 m/sn): ara deger yok, gecisi ballJump karsilar
                    o[0] = BH.x[i] + jx * a; o[1] = BH.y[i] + jy * a; o[2] = BH.z[i] + jz * a; return true;
                }
            }
            i = (BH.h + L - BH.n) % L; o[0] = BH.x[i]; o[1] = BH.y[i]; o[2] = BH.z[i]; return true;
        }
        /* [tp] canlı vuruş bırakışı: eskiden top, temasa dek ayakta tutulup (motor topu o sırada 2-5 m uçmuşken) üstel ofsetle motor topuna
           "fırlıyordu" (görüntüde ışınlanma, 60-110 m/sn). Şimdi temas anında top, motorun gerçek yolunu L sn gecikmeyle izler ve gecikme
           T içinde yumuşakça (1-u)² ile sıfırlanır: görünen hız en çok ~1,4 kat, bitişte hız sürekli. */
        function oaTS(ac) {
            var hc0 = OAB.hc === ac, et0 = Math.max(0, CLK - OAB.ht), e0 = hc0 ? Math.exp(-et0 / OAB.etau) : 0, ey0 = hc0 ? oaEy(et0) : 0;      // [fiz] kalan giris ofseti
            if (OAB.hc === ac) OAB.hc = null;
            var tl = R._dl ? ac.tc : ac.t0 + .03, L = clamp(CLK - tl, 0, .35);      // [v135] gecikmede motor topu temas aninda ayrilir: gecikmesiz birakis
            if (L < .015 || !bhAt(tl, TSP)) { oaRelE(ac, CLK, ac.tau, ac.drop, ac.vz0); return; }
            OAB.on = 0;
            OAB.ts = { rt: CLK, L: L, T: Math.max(.4, L * 5), rx: ac.hx + OAB.ex * e0 - TSP[0], ry: ac.hy + ey0 - TSP[1], rz: ac.hz + OAB.ez * e0 - TSP[2] };
            var rl = Math.abs(OAB.ts.rx) + Math.abs(OAB.ts.rz); if (rl > 3) { OAB.ts.rx = OAB.ts.ry = OAB.ts.rz = 0; }
        }
        function oaTSApply() {
            var ts = OAB.ts; if (!ts) return;
            var u = (CLK - ts.rt) / ts.T; if (u < -.02 || u >= 1) { OAB.ts = null; return; }
            u = Math.max(0, u); var w = (1 - u) * (1 - u);
            if (bhAt(CLK - ts.L * w, TSP)) { GB.x = TSP[0] + ts.rx * w; GB.y = TSP[1] + ts.ry * w; GB.z = TSP[2] + ts.rz * w; }
        }
        /* [tp] görünen topta olanaksız sıçrama (ölü top yerleşimi: taç/korner/aut/faul noktası, devre/gol sonrası orta nokta, tekrar başlangıcı):
           kısa sıçramada eski yerden yeni yere kayarak (≈.2 sn), uzun sıçramada eski top son hızıyla yoluna devam ederken küçülüp kaybolur,
           yeni top yerinde büyüyerek belirir (yayındaki "yeni top" etkisi) - tek karede ışınlanma yok. */
        var BJ = { on: 0, sc: 1, hide: 0, ht: 0, gr: -9 }, GHB = { on: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, qx: 0, qy: 0, qz: 0, qw: 1, c: 0, st: 0, t0: 0 };
        function ghostStep() {      // [fiz] oyundan cikan top: yercekimi, sekme, cim yuvarlanmasi, reklam panosu (cizgilerin ~6 m disi) ve ag (gol arkasi)
            if (!GHB.on) return; var dt = CLKOK ? CLK - GHB.c : 0; GHB.c = CLK; if (!(dt > 0) || dt > .25) return;
            var n = Math.ceil(dt / .01), h = dt / n, i, v, R0 = .11;
            for (i = 0; i < n; i++) {
                if (GHB.y > .17 + 1e-3 || GHB.vy > 0) { GHB.vy -= 9.81 * h; GHB.y += GHB.vy * h; if (GHB.y < .17) { GHB.y = .17; GHB.vy = GHB.vy < -1.2 ? -GHB.vy * .55 : 0; GHB.vx *= .85; GHB.vz *= .85; } }
                else { v = Math.hypot(GHB.vx, GHB.vz); if (v > 1e-3) { var nv = Math.max(0, v - (.9 + .02 * v * v) * h); GHB.vx *= nv / v; GHB.vz *= nv / v; } }
                GHB.x += GHB.vx * h; GHB.z += GHB.vz * h;
                var inG = Math.abs(GHB.z - PH / 2) < 3.76 && GHB.y < 2.5;      // kale agi: direkler arasi, cizginin 1.8 m arkasi
                var lx = inG && (GHB.x < 0 || GHB.x > PW) ? 1.8 : 6.2;
                if (GHB.x < -lx) { GHB.x = -lx; GHB.vx = Math.abs(GHB.vx) * .15; } else if (GHB.x > PW + lx) { GHB.x = PW + lx; GHB.vx = -Math.abs(GHB.vx) * .15; }
                if (GHB.z < -5.2) { GHB.z = -5.2; GHB.vz = Math.abs(GHB.vz) * .15; } else if (GHB.z > PH + 5.2) { GHB.z = PH + 5.2; GHB.vz = -Math.abs(GHB.vz) * .15; }
            }
            v = Math.hypot(GHB.vx, GHB.vz); if (v > .05 && GHB.y <= .18) { var ang = v * dt / R0, sn = Math.sin(ang / 2), ax = GHB.vz / v, az = -GHB.vx / v, qx1 = ax * sn, qz1 = az * sn, qw1 = Math.cos(ang / 2), x0 = GHB.qx, y0 = GHB.qy, z0 = GHB.qz, w0 = GHB.qw;
                GHB.qx = qw1 * x0 + qx1 * w0 - qz1 * y0; GHB.qy = qw1 * y0 - qx1 * z0 + qz1 * x0; GHB.qz = qw1 * z0 + qx1 * y0 + qz1 * w0; GHB.qw = qw1 * w0 - qx1 * x0 - qz1 * z0; }
            GHB.st = v < .05 && GHB.y <= .18 ? GHB.st + dt : 0;
            if (CLK - GHB.t0 > 40 || (GHB.st > 4 && !SP_DEAD && !sphereIn(GHB.x, GHB.y, GHB.z, .3))) GHB.on = 0;      // durduktan sonra, gorus disindayken kaldirilir
        }
        function ballJump(bo) {
            var nowR = lastNow / 1000, rx = GB.x, ry = GB.y, rz = GB.z; BJ.sc = 1;
            if (V7_DLV) { BJ.on = 0; BJ.hide = 0; GHB.on = 0; bo.gx = rx; bo.gy = ry; bo.gz = rz; bo.gc = CLKOK ? CLK : nowR; return; }      // [v187] top görevlisi yeni topu atıyor: görünen top arayüzden (sürekli)
            if (bo.gx != null && !GB.held) {
                var jx = rx - bo.gx, jy = ry - bo.gy, jz = rz - bo.gz, jd = Math.sqrt(jx * jx + jy * jy + jz * jz), dc = CLKOK ? CLK - bo.gc : .03;
                var cut = !CLKOK || dc < -1e-3 || dc > .5 || GB.cutJ; GB.cutJ = 0;      // [fiz] kurgu kesmesi / saat sicramasi
                if (cut && jd > 1.5) { BJ.on = 0; BJ.hide = 0; GHB.on = 0; }
                else if (dc < 0) dc = .03;
                if (!cut && jd > (SP_DEAD && jd < 3.5 ? .4 : Math.max(1.5, 60 * dc + .6))) {      // olu topta kisa yerlesim (faul noktasi) de kayarak
                    if (jd > 3.5) { GHB.on = 1; GHB.x = bo.gx; GHB.y = Math.max(.17, bo.gy); GHB.z = bo.gz; GHB.vx = bo.gvx || 0; GHB.vy = bo.gvy || 0; GHB.vz = bo.gvz || 0; GHB.qx = bo.qx || 0; GHB.qy = bo.qy || 0; GHB.qz = bo.qz || 0; GHB.qw = bo.qw == null ? 1 : bo.qw; GHB.c = CLK; GHB.st = 0; GHB.t0 = CLK;
                        var gs = Math.hypot(GHB.vx, GHB.vz); if (gs > 40) { GHB.vx *= 40 / gs; GHB.vz *= 40 / gs; } BJ.hide = 1; BJ.ht = CLK; BJ.on = 0; }      // [fiz] ikinci top yoluna devam; yeni top gizli
                    else { BJ.on = 1; BJ.t0 = nowR; BJ.c0 = CLKOK ? CLK : nowR; BJ.ox = bo.gx; BJ.oy = bo.gy; BJ.oz = bo.gz; BJ.vx = bo.gvx || 0; BJ.vy = bo.gvy || 0; BJ.vz = bo.gvz || 0; BJ.big = false; }
                }
                else if (dc > 1e-4) { bo.gvx = jx / dc; bo.gvy = jy / dc; bo.gvz = jz / dc; }
            }
            ghostStep();
            if (BJ.hide) {      // [fiz] yeni top: duran top hareketi kurulunca (vurucu topa vardi / taccinin elinde), top canlanınca ya da 3 sn sonra belirir
                var shw = !SP_DEAD || CLK - BJ.ht > 3 || GB.held, si;
                for (si = 0; si < S.n && !shw; si++) { var sac = S.st[si].ac; if (sac && sac.init && (sac.k === 8 || sac.k === 9) && CLK >= sac.t0) shw = true; }
                if (shw) { BJ.hide = 0; BJ.gr = nowR; } else BJ.sc = .001;
            }
            if (!BJ.hide && nowR - BJ.gr < .25) { var gu = Math.max(0, (nowR - BJ.gr) / .25); BJ.sc = Math.min(BJ.sc, 1 - (1 - gu) * (1 - gu) * (1 - gu)); }
            bo.gx = rx; bo.gy = ry; bo.gz = rz; bo.gc = CLKOK ? CLK : nowR;
            if (!BJ.on) return;
            var te = nowR - BJ.t0;
            if (te < 0 || GB.held || te > .5) { BJ.on = 0; return; }
            if (BJ.big) {
                if (te < .16) {
                    var sd = clamp((CLKOK ? CLK : nowR) - BJ.c0, 0, .45), sp = Math.sqrt(BJ.vx * BJ.vx + BJ.vz * BJ.vz), kf = sp > 40 ? 40 / sp : 1;
                    GB.x = BJ.ox + BJ.vx * kf * sd; GB.z = BJ.oz + BJ.vz * kf * sd; GB.y = Math.max(.17, BJ.oy + BJ.vy * kf * sd - 4.9 * sd * sd);
                    BJ.sc = 1 - te / .16;
                } else if (te < .4) { var u = (te - .16) / .24; BJ.sc = 1 - (1 - u) * (1 - u) * (1 - u); }
                else BJ.on = 0;
            } else {
                var k = Math.exp(-te / .07); if (k < .02) { BJ.on = 0; return; }
                GB.x += (BJ.ox - GB.x) * k; GB.z += (BJ.oz - GB.z) * k; GB.y += (BJ.oy - GB.y) * k;
            }
        }
        var OAB = { on: 0, ox: 0, oy: 0, oz: 0, rt: 0, tau: .1, drop: 0, h0: 0, vz: 0, hc: null, ht: 0, ex: 0, ey: 0, ez: 0, lx: 0, ly: 0, lz: 0, lt: -1e9, pr: null, mx: 0, mz: 0, mt: 0, v0: 2.5, etau: .06, mo: -2, mot: -1e9 };     // görsel top bırakış ofseti (tutuş noktasından motorun topuna) · [oa] hc/ht/e*: tutuş girişi ofseti, l*: son görünen top, pr: ezilen tutuş (bırakılacak)
        function oaSc(a) { return a.hScale != null ? a.hScale : .98; }
        function oaWs(a) { return a.wScale != null ? a.wScale : .98; }
        /* kök ofseti: model noktası (mx, mz; ölçekli) temas anında dünya noktası (px, pz) üzerine gelsin; motor kökü temas anına hızıyla kestirilir */
        function oaAlign(ac, x, z, vx, vz, mx, mz, px, pz, lf, ll) {
            var dtp = clamp(ac.tc - CLK, 0, .35), ex = x + vx * dtp * .85, ez = z + vz * dtp * .85, cy = Math.cos(ac.yaw), sy = Math.sin(ac.yaw);
            var qx = px - (mx * cy + mz * sy) - ex, qz = pz - (-mx * sy + mz * cy) - ez;
            ac.oL = clamp(qx * cy - qz * sy, -ll, ll); ac.oF = clamp(qx * sy + qz * cy, -lf * .6, lf);
            var rL = qx * cy - qz * sy - ac.oL, rF = qx * sy + qz * cy - ac.oF; ac.rsx = rL * cy + rF * sy; ac.rsz = -rL * sy + rF * cy;     // [oa] hamleyle kapanmayan fark (dünya)
        }
        function oaAlign3(ac, x, z) {      // [fiz] mod 3 kok hizasi: guncel konum + kalan sure x hiz (sinirsiz ufuk)
            var d = ac.d, dtp = Math.max(0, ac.tc - CLK), ex = x + d[6] * dtp, ez = z + d[7] * dtp, cy = Math.cos(ac.yaw), sy = Math.sin(ac.yaw);
            var qx = d[0] - (ac.cmx * cy + ac.cmz * sy) - ex, qz = d[1] - (-ac.cmx * sy + ac.cmz * cy) - ez;
            var lim3 = ac.rc ? .75 : 1.1; ac.oL = clamp(qx * cy - qz * sy, -lim3, lim3); ac.oF = clamp(qx * sy + qz * cy, -.6 * lim3, lim3);
        }
        function oaRel(ox, oy, oz, rt, tau, drop, h0, vz) { OAB.on = 1; OAB.ox = ox; OAB.oy = drop ? 0 : oy; OAB.oz = oz; OAB.rt = rt; OAB.tau = tau; OAB.drop = drop ? 1 : 0; OAB.h0 = h0; OAB.vz = vz || 0; }
        /* hedef değeri iki ara pozdan (a → b, k) karıştırıp aksiyon ağırlığıyla uygula - kalkış gibi "poz → poz → serbest" zincirleri için */
        function oaPA(kk, a0, a1, k, ay, az) { PA(kk, a0 + (a1 - a0) * k, ay, az); }
        function oaInit(a, ac, x, z) {
            var d = ac.d, k = ac.k, sc = oaSc(a), ws = oaWs(a), o0 = PW_, hb, fb, fp;
            ac.hold = 0; ac.rel = false; ac.win = .06; ac.yaw = a.yaw; ac.oL = 0; ac.oF = 0; ac.act = a; ac.h0t = 0; ac.h1t = 0; ac.tau = .1; ac.drop = 0; ac.vz0 = 0;
            if (k === 18) {                                                  // canlı vuruş
                ac.foot = d[5] < 0 ? -1 : 1; ac.pr = kickProfile(SP_PROF[clamp(d[6] | 0, 0, 3)], d[7]);
                ac.ky = Math.atan2(d[3], d[4]); ac.yaw = angLerp(a.yaw, ac.ky, .55);       // kalça/gövde koşu yönüyle vuruş yönü arasına döner
                ac.kb0 = -clamp(ac.tc - ac.t0, .08, .3); ac.kb1 = ac.kb0 * .34; ac.te = ac.tc + .5; ac.win = .04;
                pose.fill(0); PW_ = 1; spStrike(a, ac, ac.tc); PW_ = o0; bodyDQ(pose, gkDQ);
                fb = ac.foot > 0 ? BB.FootL : BB.FootR; fp = BODY_BIND[fb]; dqsPt(gkDQ, fb, fp[0], fp[1] - .025, fp[2] + .1, gkQ);
                oaAlign(ac, x, z, d[8], d[9], gkQ[0] * ws, gkQ[2] * ws, d[0], d[1], d[10] > 0 ? 1.3 : .75, .45);      // [carry] vur-koşla öndeki topa daha uzun uzanır
                ac.hold = 1; ac.h0t = R._dl ? Math.max(ac.t0, ac.tc - .06) : ac.t0; ac.h1t = ac.tc; ac.hx = d[0]; ac.hy = .17 + d[2];      /* [v135] gecikmede top temastan hemen once ayaga (geri savurmada yuvarlanir) */
                ac.hz = d[1]; ac.tau = ac.pr.kind === 'shot' ? .09 : .07;
                ac.hx0 = ac.hx; ac.hz0 = ac.hz; ac.act = a;      /* [temas] ilk tutus noktasi ve vuran */
                return;
            }
            if (k === 11) {                                                  // kafa
                ac.mode = d[6] | 0; ac.tf = (a.vary || 0) < .55 ? 1 : -1; ac.yaw = d[7]; ac.win = .08;
                if (ac.mode === 3) ac.out = 1;                               // anlık (kestirilmemiş) kafa: yalnızca kazanana kurulur
                oaHeadT(ac, d[5]);
                pose.fill(0); PW_ = 1; oaHead(a, ac, ac.tc, true); PW_ = o0; bodyDQ(pose, gkDQ);
                hb = BODY_BIND[BB.Head]; dqsPt(gkDQ, BB.Head, hb[0], hb[1] + .1, hb[2] + .1, gkQ);      // alın (top merkezi temas noktası)
                oaHeadT(ac, clamp(d[2] - gkQ[1] * sc, ac.mode === 3 ? 0 : .04, .6));                 // gereken sıçrama: temas sıçramanın tepesinde
                oaAlign(ac, x, z, d[9], d[10], gkQ[0] * ws, gkQ[2] * ws, d[0], d[1], ac.mode === 3 ? .5 : 1.5, ac.mode === 3 ? .4 : 1.1);     // [oa] sıçrayan aday topa doğru hamle eder (çözüm yarıçapı 3,4 m)
                var rsl = Math.sqrt(ac.rsx * ac.rsx + ac.rsz * ac.rsz), rsk = rsl > 1.5 ? 1.5 / rsl : 1;      // [oa] tutuş noktası alnın ulaşabildiği yere (top yolundan eğilerek gelir)
                ac.hx = d[0] - ac.rsx * rsk; ac.hy = d[2]; ac.hz = d[1] - ac.rsz * rsk; ac.tau = .1; ac.drop = 1; ac.vz0 = .4; ac.bnd = ac.mode !== 3 && rsl * rsk > .05 ? 1 : 0;
                if (ac.out === 1) oaHeadHold(ac);
                return;
            }
            if (k === 12) {                                                  // müdahale
                ac.mode = d[5] | 0; ac.side = d[6] < 0 ? -1 : 1; ac.res = d[7] | 0; ac.stun = clamp(d[8], 0, 1.2);
                var tx = d[0] - x, tz = d[1] - z, dl = Math.sqrt(tx * tx + tz * tz), by0 = dl > .3 ? Math.atan2(tx, tz) : a.yaw;
                fb = ac.side > 0 ? BB.FootR : BB.FootL; fp = BODY_BIND[fb];
                ac.sF = 0; ac.sL = 0; ac.sE = 0;
                if (ac.mode === 4) {      /* [sav] araya girme: hucumcunun kosu yonune doner; rakipten uzak ayak topa, govde araya */
                    var ux4 = d[0] - d[2], uz4 = d[1] - d[3], ay4 = ux4 * ux4 + uz4 * uz4 > .04 ? Math.atan2(ux4, uz4) : by0;
                    ac.yaw = angLerp(a.yaw, ay4, .8);
                    var lp4 = (d[2] - x) * Math.cos(ac.yaw) - (d[3] - z) * Math.sin(ac.yaw);      // hucumcu govdeye gore (model x; + = sag bacak yani)
                    ac.side = lp4 < 0 ? 1 : -1; fb = ac.side > 0 ? BB.FootR : BB.FootL; fp = BODY_BIND[fb];
                    ac.te = ac.tc + (ac.res === 3 ? .3 + ac.stun : .62);
                    pose.fill(0); PW_ = 1; oaTackle(a, ac, ac.tc, true); PW_ = o0; bodyDQ(pose, gkDQ);
                    dqsPt(gkDQ, fb, fp[0], fp[1], fp[2] + .1, gkQ);
                    oaAlign(ac, x, z, d[9], d[10], gkQ[0] * ws, gkQ[2] * ws, d[0], d[1], .75, .6);
                } else
                if (ac.mode === 3) {                                         // kayarak: kök dünyaya kilitli, topa doğru kayar
                    ac.yaw = by0; ac.win = .05; ac.ts = ac.tc + .3; ac.tu = ac.ts + .14; ac.te = ac.tu + .8;
                    pose.fill(0); PW_ = 1; oaTackle(a, ac, ac.tc, true); PW_ = o0; bodyDQ(pose, gkDQ);
                    dqsPt(gkDQ, fb, fp[0], fp[1], fp[2] + .12, gkQ);
                    var vs = Math.sqrt(d[9] * d[9] + d[10] * d[10]);
                    ac.sF = clamp(dl - gkQ[2] * ws, 0, 2.8); ac.sL = clamp(-gkQ[0] * ws, -.5, .5); ac.sE = ac.sF + .5 + .1 * clamp(vs, 0, 8);
                } else {
                    ac.yaw = angLerp(a.yaw, by0, .6); ac.te = ac.tc + (ac.res === 3 ? .3 + ac.stun : .45);
                    pose.fill(0); PW_ = 1; oaTackle(a, ac, ac.tc, true); PW_ = o0; bodyDQ(pose, gkDQ);
                    dqsPt(gkDQ, fb, fp[0], fp[1], fp[2] + .1, gkQ);
                    oaAlign(ac, x, z, d[9], d[10], gkQ[0] * ws, gkQ[2] * ws, d[0], d[1], .5, .4);
                }
                if (ac.res === 1) { ac.hold = 1; ac.h0t = ac.t0; ac.h1t = ac.tc; ac.hx = d[0]; ac.hy = .17; ac.hz = d[1]; ac.tau = .09; }
                return;
            }
            if (k === 13) { ac.te = ac.t0 + clamp(d[3], .3, 1); ac.win = .08; return; }      // sendeleme: kök motorda
            if (k === 14) {                                                  // düşme: kök düştüğü yere kilitli, momentumla kısa kayar
                ac.type = d[2] | 0; var fy0 = Math.atan2(d[0], d[1]);
                ac.yaw = ac.type === 1 ? angLerp(a.yaw, fy0, .7) : a.yaw;
                var cy0 = Math.cos(ac.yaw), sy0 = Math.sin(ac.yaw), sl = clamp(.15 + .12 * d[4], .15, 1.3);
                ac.sL = sl * (d[0] * cy0 - d[1] * sy0); ac.sF = sl * (d[0] * sy0 + d[1] * cy0); ac.sg = ac.sL >= 0 ? 1 : -1;
                ac.tf = ac.t0 + .5; ac.tli = ac.tf + clamp(d[3], .25, 2.5); ac.tu = ac.tli + .85; ac.te = ac.tu + .05; ac.win = .06;
                return;
            }
            if (k === 15) {                                                  // faul yapan: durur, rakibe/hakeme döner
                var fx0 = d[0] - x, fz0 = d[1] - z; ac.yaw = fx0 * fx0 + fz0 * fz0 > .04 ? Math.atan2(fx0, fz0) : a.yaw;
                ac.gest = d[2] | 0; ac.card = d[4] > 0 ? 1 : 0; ac.tH = ac.card ? ac.t0 + (ac.gest === 3 ? 0 : .9) : 1e9; ac.te = ac.t0 + clamp(d[3], .8, 5); ac.win = .15;
                return;
            }
            if (k === 16) {                                                  // göğüs / uyluk kontrolü
                var ix = d[3], iy = d[4]; ac.mode = d[5] | 0; ac.side = (a.vary || 0) < .5 ? 1 : -1;
                ac.yaw = ix * ix + iy * iy > .01 ? angLerp(a.yaw, Math.atan2(-ix, -iy), ac.mode === 3 ? .45 : .7) : a.yaw; ac.te = ac.tc + .5; ac.win = .07;
                if (ac.mode === 3) { var lxm = (d[0] - x) * Math.cos(ac.yaw) - (d[1] - z) * Math.sin(ac.yaw); ac.side = lxm >= 0 ? -1 : 1; ac.te = ac.tc + .45; ac.rc = d[9] > 0 ? 1 : 0; if (ac.rc) ac.yaw = angLerp(a.yaw, ac.yaw, .4); }      // [fiz] top surme uzanmasi: govde kosu yonunden az doner      // [carry] topun tarafındaki ayak (model +x: sağ bacak)
                pose.fill(0); PW_ = 1; oaCtrl(a, ac, ac.tc, true); PW_ = o0; bodyDQ(pose, gkDQ);
                if (ac.mode === 2) { hb = BODY_BIND[BB.Torso]; dqsPt(gkDQ, BB.Torso, hb[0], hb[1] + .3, hb[2] + .17, gkQ); }
                else if (ac.mode === 3) { fb = ac.side > 0 ? BB.FootL : BB.FootR; fp = BODY_BIND[fb]; dqsPt(gkDQ, fb, fp[0] + (ac.side > 0 ? .17 : -.17), fp[1] + .04, fp[2] + .05, gkQ); ac.cmx = gkQ[0] * ws; ac.cmz = gkQ[2] * ws; }      // [carry] ayağın içinde top merkezi
                else { fb = ac.side > 0 ? BB.LegL : BB.LegR; fp = BODY_BIND[fb]; dqsPt(gkDQ, fb, fp[0], fp[1] - .28, fp[2] + .1, gkQ); }
                ac.air = d[8] > 0 ? 1 : 0;                                   // yüksek top inişi: top uçuşta (motor), tutuş yalnızca kazanırsa temastan (motorun son adımı görünmeden) itibaren
                oaAlign(ac, x, z, d[6], d[7], gkQ[0] * ws, gkQ[2] * ws, d[0], d[1], ac.mode === 3 ? (ac.rc ? .75 : 1.1) : ac.air ? .6 : .45, ac.mode === 3 ? (ac.rc ? .75 : 1.1) : ac.air ? .55 : .35);
                ac.hold = ac.air && ac.out !== 1 ? 0 : 1; ac.h0t = ac.air ? ac.tc - .04 : ac.t0; ac.h1t = ac.tc + .04; ac.hx = d[0]; ac.hy = .17 + d[2]; ac.hz = d[1]; ac.tau = .12; ac.drop = 1; ac.vz0 = ac.mode === 2 ? .3 : .9;
                var qy = gkQ[1] * sc; ac.hy = ac.mode === 2 ? clamp(ac.hy, qy - .12, qy + .05) : qy + .11;
                if (ac.mode === 3) { ac.h0t = ac.tc - .005; ac.h1t = ac.tc + .05; ac.hy = .17; ac.drop = 0; ac.vz0 = 0; ac.tau = .1; }
                if (ac.mode === 3 && !OA3_FULL) { ac.oL = 0; ac.oF = 0; ac.rsx = 0; ac.rsz = 0; ac.hold = 0; }      // [duzgun] kok kaydirma ve top tutusu yok (gorunen top motor topu)      // [carry] yerden top: temasta kısa tutuş, sonra görünen topa      // [oa] uyluk: top uyluğun üstünde (el hizasında değil); göğüs: göğüs hizasında
                if (ac.out === 3) { ac.hold = 0; ac.te = Math.min(ac.te, Math.max(CLK, ac.t0) + .3); }
                if (ac.air) {                                                    // [oa] tutuş noktası gövdenin ulaşabildiği yere; kazanılan kontrolde bir adım uzun tutuş
                    var rsl2 = Math.sqrt(ac.rsx * ac.rsx + ac.rsz * ac.rsz), rsk2 = rsl2 > 1.2 ? 1.2 / rsl2 : 1;
                    ac.hx = d[0] - ac.rsx * rsk2; ac.hz = d[1] - ac.rsz * rsk2; ac.bnd = rsl2 * rsk2 > .05 ? 1 : 0; if (ac.out === 1) ac.h1t = ac.tc + .1;
                }
                return;
            }
            if (k === 17) {                                                  // blok: şutu atana döner
                ac.yaw = d[2] * d[2] + d[3] * d[3] > .01 ? Math.atan2(-d[2], -d[3]) : a.yaw; ac.side = d[4] < 0 ? -1 : 1; ac.hi = d[5] > .75 ? 1 : 0; ac.te = ac.tc + .6; ac.win = .06;
                return;
            }
        }
        /* görsel top: vuruş/kafa/kontrol/müdahale aksiyonunun tutuş penceresinde temas noktasında, sonra motorun topuna sönen ofsetle
           (kontrol ve kafada dikeyde yerçekimiyle düşer) - motor topu değişmez */
        /* [oa] tutuşun kalan giriş ofsetiyle bırakış (top görünen yerinden bırakılır) */
        // tutuş girişinin kalan dikey ofseti: yukarıdaki top üstel sönümden hızlı, ama yerçekiminden (≈2,5 m/sn ilk iniş hızıyla) hızlı inmez
        function oaEy(et) { var ex = OAB.ey * Math.exp(-et / OAB.etau); return OAB.ey > 0 ? Math.max(ex, OAB.ey - (OAB.v0 * et + 4.905 * et * et)) : ex; }
        function oaRelE(ac, rt, tau, drop, vz) {
            OAB.ts = null;                                                   // [fm] birakis ofseti motor topuna gore: zaman kaydirmali iz ustune binmesin
            var hc = OAB.hc === ac, et = Math.max(0, CLK - OAB.ht), e = hc ? Math.exp(-et / OAB.etau) : 0, ry = hc ? oaEy(et) : 0, hx = ac.hx + OAB.ex * e, hy = ac.hy + ry, hz = ac.hz + OAB.ez * e;
            if (hc && ry > OAB.ey * e + .01) { vz = -(OAB.v0 + 9.81 * et); drop = 1; }          // top tutuş noktasına henüz inmedi: düşmeye devam eder
            if (hc) OAB.hc = null;
            if (CLKOK && CLK - OAB.lt >= 0 && CLK - OAB.lt < .15) { hx = OAB.lx; hy = OAB.ly; hz = OAB.lz; rt = CLK; }     // [oa] görünen son konumdan (süreklilik)
            oaRel(hx - GB.x, hy - GB.y, hz - GB.z, rt, tau, drop, hy, vz);
        }
        /* [oa] motor topu ışınlanırsa (top kazanma/çelme: motor topu oyuncunun ayağına koyar; > 38 m/sn ve < 6 m, ölü top değil) görünen top
           yerinden motor topuna sönen ofsetle süzülür (havadaysa yerçekimiyle iner) - tek karede ışınlanma yok. Son görünen top (tutuş girişi için). */
        /* [carry] ayak ucu tablosu: top sürme yürüyüşünde (carryK 1) hız 0..9 m/sn için iki ayak ucunun temas evresi (salınan uç geriden öne giderken
           erişiminin %80'ine vardığı ve yere yakın olduğu ilk ham evre) ve o andaki ileri uzanımı (model uzayı): [sol uç, sol evre, sağ uç, sağ evre] */
        var CRF = null, CRF_DQ = null, CRF_Q = new Float32Array(3);
        function carryFeet() {
            if (CRF) return CRF; CRF = []; CRF_DQ = new Float32Array(BODY_BONES.length * 8);
            var fake = { ph: 0, carryK: 1, takeonK: 0 }, FL = BODY_BIND[BB.FootL], FR = BODY_BIND[BB.FootR], sp, k;
            for (sp = 0; sp <= 9; sp++) {
                var zL = [], yL = [], zR = [], yR = [], xL = [], xR = [], e = [0, 0, 0, 0, .08, -.08];
                for (k = 0; k < 72; k++) {
                    fake.ph = k / 72 * 2 * Math.PI; poseFor(fake, Math.max(.6, sp), 0, null); bodyDQ(pose, CRF_DQ);
                    dqsPt(CRF_DQ, BB.FootL, FL[0], FL[1] - .04, FL[2] + .16, CRF_Q); zL.push(CRF_Q[2]); yL.push(CRF_Q[1]); xL.push(CRF_Q[0]);
                    dqsPt(CRF_DQ, BB.FootR, FR[0], FR[1] - .04, FR[2] + .16, CRF_Q); zR.push(CRF_Q[2]); yR.push(CRF_Q[1]); xR.push(CRF_Q[0]);
                }
                [[zL, yL, 0, xL], [zR, yR, 2, xR]].forEach(function (f) {
                    var zz = f[0], yy = f[1], zm = Math.max.apply(null, zz), i0 = 0, j, kk = 0;
                    for (j = 0; j < 72; j++) if (zz[j] < zz[i0]) i0 = j;
                    for (j = 1; j < 72; j++) { kk = (i0 + j) % 72; if (zz[kk] >= .8 * zm && yy[kk] < .15) break; }
                    e[f[2]] = zz[kk]; e[f[2] + 1] = kk / 72 * 2 * Math.PI; e[4 + f[2] / 2] = -f[3][kk];      // [fiz] yanal (model +x sag bacak: sol +)
                });
                CRF.push(e);
            }
            return CRF;
        }
        // adım evresi köprünün evresine yaklaşır (köprü dokunuşu temas evresinde yapar); kadans en çok %50 değişir
        function carrySync(a, d, dts, v) {
            if (!(v.gph === v.gph)) return;
            var e = v.gph - a.ph; e -= Math.round(e / (2 * Math.PI)) * 2 * Math.PI;
            var nat = d * gaitPhK(a.spd, a.carryK || 0), lim = .5 * Math.abs(nat) + .01, c = e * (1 - Math.exp(-dts / .08));
            a.ph += Math.max(-lim, Math.min(lim, c));
        }
        // sahiplik bitti (görünen top -> motor topu): tutuş yoksa son görünen yerden motor topuna sönen ofset (tek karede atlama yok)
        function carryHand(v) {
            var on = v.dOn ? 1 : 0;
            if (R._dOn && !on && CLKOK && !GB.held && !OAB.hc && Math.abs(CLK - OAB.lt) < .15) {
                var pa = R._dOwn >= 0 && S.st[R._dOwn] ? S.st[R._dOwn].ac : null, hold = pa && pa.init && pa.hold && pa.k >= 11 && CLK < pa.h1t + .05;
                var ox = OAB.lx - GB.x, oz = OAB.lz - GB.z, ol = Math.sqrt(ox * ox + oz * oz);
                if (!hold && ol > .05 && ol < 3) { OAB.ts = null; oaRel(ox, 0, oz, CLK, .1, 0, 0, 0); }
            }
            R._dOnP = R._dOn ? 1 : 0; R._dOn = on; R._dOwn = on ? v.owner : -1;
        }
        var CS_ON = 1;      // [temas] surme dokunusu (p_temas_03)
        var CC = { ox: 0, oz: 0, lt: -1e9 }, CC_DQ = null, CC_M = null, CC_Q = new Float32Array(3), CC_W = new Float32Array(3), CC_T = new Float32Array(5), CC_T2 = new Float32Array(5);
        function ccToe(dq, root, left, out) {      // [fiz] ayak ucu (dunya) ve ayak yonu (orta -> uc)
            var b = left ? BB.FootL : BB.FootR, F = BODY_BIND[b];
            dqsPt(dq, b, F[0], F[1] - .04, F[2] + .16, CC_Q); xform(root, CC_Q, out);
            dqsPt(dq, b, F[0], F[1] - .04, F[2] - .02, CC_Q); xform(root, CC_Q, CC_W); out[3] = out[0] - CC_W[0]; out[4] = out[2] - CC_W[2];
        }
        function carryContact(v) {
            var dt = CLKOK && CC.lt > -1e8 ? Math.max(0, Math.min(.2, CLK - CC.lt)) : 0, tx = 0, tz = 0, a = v.owner >= 0 && S.st ? S.st[v.owner] : null; CC.lt = CLKOK ? CLK : -1e9;
            if (CLKOK && v.dOn && a && a.ok && a.rM && a.dqc && !GB.held && !OAB.hc && !(a.ac && a.ac.init && a.ac.k >= 11 && CLK < (a.ac.h1t > 0 ? a.ac.h1t : a.ac.tc) + .05)) {      // aksiyonun tutusu bitince (geri donus) temas surer
                var wIn = 0, wOut = 0, u;
                if (v.dtn > 0 && v.dfn) { u = CS_ON ? (CLK - (v.dtn - .18)) / .18 : (CLK - (v.dtn - .12)) / .12; if (u > 0) { u = Math.min(1, u); wIn = u * u * (3 - 2 * u); } }
                if (v.dtl > 0 && v.dk !== 2 && v.dk !== 3) { u = (CLK - v.dtl) / .14; if (u >= -.5 && u < 1) wOut = u <= 0 ? 1 : 1 - u * u * (3 - 2 * u); }      // cizici kopruden bir adim geride: dokunus kaydi gelince ara karede de tam agirlik
                var w = Math.max(wIn, wOut);
                if (w > .001) {
                    if (wIn >= wOut) {      // dokunustan once: temas evresindeki ayak ucu (ayni aktor, adim evresi temas evresine alinmis; kok govde hiziyla ileri)
                        var csG = CS_ON && GA_ON && GA_OWN && (a.gaW || 0) > .3 ? gaspFeet() : null, tab = csG ? csG.tab[Math.max(0, Math.min(9, Math.round(a.spd)))] : carryFeet()[Math.max(0, Math.min(9, Math.round(a.spd)))], left = v.dfn > 0, ph0 = a.ph, cs0 = [a.gaP, a.gaC, a.gaD, a.gaRX, a.gaRZ, a.gaRT];      /* [temas] GASP dokunus evresi */
                        if (!CC_DQ) { CC_DQ = new Float32Array(BODY_BONES.length * 8); CC_M = new Float32Array(16); }
                        a.ph = left ? tab[1] : tab[3]; if (csG) { a.gaP = (left ? tab[1] : tab[3]) / (2 * Math.PI); a.gaRT = -1; } poseFor(a, a.spd, FRM[3], null); var csX = csG && a.gaRT === FRM[3] ? a.gaRX || 0 : 0, csZ = csG && a.gaRT === FRM[3] ? a.gaRZ || 0 : 0; a.ph = ph0; a.gaP = cs0[0]; a.gaC = cs0[1]; a.gaD = cs0[2]; a.gaRX = cs0[3]; a.gaRZ = cs0[4]; a.gaRT = cs0[5]; bodyDQ(pose, CC_DQ);
                        var lead = Math.max(0, v.dtn - CLK); CC_M.set(a.rM); if (csG) { if (cs0[5] === FRM[3]) { CC_M[12] -= cs0[3] || 0; CC_M[14] -= cs0[4] || 0; } CC_M[12] += csX; CC_M[14] += csZ; } CC_M[12] += Math.sin(a.dYaw) * a.spd * lead; CC_M[14] += Math.cos(a.dYaw) * a.spd * lead;
                        ccToe(CC_DQ, CC_M, left, CC_T);
                    } else {      // dokunustan sonra: topa yakin ayagin simdiki ucu (itis)
                        ccToe(a.dqc, a.rM, true, CC_T); ccToe(a.dqc, a.rM, false, CC_T2);
                        if ((CC_T2[0] - GB.x) * (CC_T2[0] - GB.x) + (CC_T2[2] - GB.z) * (CC_T2[2] - GB.z) < (CC_T[0] - GB.x) * (CC_T[0] - GB.x) + (CC_T[2] - GB.z) * (CC_T[2] - GB.z)) CC_T.set(CC_T2);
                    }
                    var fl = Math.hypot(CC_T[3], CC_T[4]) || 1, Rv = .11 * BSC + .02; if (CS_ON) { var csR = .11 * BSC + .012, csH = ballY(GB.y) - CC_T[1]; Rv = Math.abs(csH) < csR ? Math.sqrt(csR * csR - csH * csH) : .02; }      /* [temas] kure geometrisi */
                    var ex = CC_T[0] + CC_T[3] / fl * Rv - GB.x, ez = CC_T[2] + CC_T[4] / fl * Rv - GB.z, el = Math.hypot(ex, ez);
                    var csM = CS_ON ? .7 : .5; if (el > csM) { ex *= csM / el; ez *= csM / el; }
                    tx = ex * w; tz = ez * w;
                }
            }
            var mx = (CS_ON ? 5.5 : 4) * dt + .002, ddx = tx - CC.ox, ddz = tz - CC.oz, dl = Math.hypot(ddx, ddz);      // ofset hiz sinirli: sicrama yok
            if (dl > mx) { ddx *= mx / dl; ddz *= mx / dl; }
            CC.ox += ddx; CC.oz += ddz; if (!CLKOK) { CC.ox = 0; CC.oz = 0; }
            if (Math.abs(CC.ox) + Math.abs(CC.oz) > 1e-5) { GB.x += CC.ox; GB.z += CC.oz; }
        }
        var CT2_ON = 1, CT2_O = [0, 0, 0], CT2_P = new Float32Array(3), CT2_S = [], CT2_U = { x: 0, y: 0, z: 0, t: -1 };
        for (var ct2i = 0; ct2i < 16; ct2i++) CT2_S.push(new Float32Array(3));
        function ctGkPalm(a, ac) {      // [temas] kurtaris: kestirilen yoldaki top son .1 sn'de avuclara (tutma: avuc ortasi, celme: yakin avuc)
            if (!a || !a.ok || !a.dqc || !a.rM) return;
            handsModel(a.dqc); xform(a.rM, gkQ, CT_Q); xform(a.rM, gkQ2, CT_W);
            var R = .11 * BSC + .01, cy = ballY(GB.y), px, py, pz;
            if (ac.out === 1) { px = (CT_Q[0] + CT_W[0]) * .5; py = (CT_Q[1] + CT_W[1]) * .5; pz = (CT_Q[2] + CT_W[2]) * .5; R = .03; }
            else { var dq1 = Math.hypot(CT_Q[0] - GB.x, CT_Q[1] - cy, CT_Q[2] - GB.z), dq2 = Math.hypot(CT_W[0] - GB.x, CT_W[1] - cy, CT_W[2] - GB.z), P = dq1 < dq2 ? CT_Q : CT_W; px = P[0]; py = P[1]; pz = P[2]; }
            var nx = GB.x - px, ny = cy - py, nz = GB.z - pz, nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1, tx = px + nx / nl * R - GB.x, ty = py + ny / nl * R - cy, tz = pz + nz / nl * R - GB.z, tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
            if (tl > 1.2) { tx *= 1.2 / tl; ty *= 1.2 / tl; tz *= 1.2 / tl; }
            if (ac.gpk) { var gpl = Math.sqrt(tx * tx + ty * ty + tz * tz); if (gpl > .5) { tx = ty = tz = 0; } }      /* [kaleci] uzak topu cekme */
            var w = sm(rmp(CLK, ac.tc - .1, ac.tc - .01)); GB.x += tx * w; GB.y += ty * w; GB.z += tz * w;
            if (ac.gpk) { ac.gpo = ac.gpo || [0, 0, 0]; ac.gpo[0] = tx * w; ac.gpo[1] = ty * w; ac.gpo[2] = tz * w; }
            if (!ac.ctp) ac.ctp = [0, 0, 0]; ac.ctp[0] = GB.x; ac.ctp[1] = GB.y; ac.ctp[2] = GB.z;
        }
        var CT2_RT = { x: 0, y: 0, z: 0, on: 0 }, CT2_R = { x: 0, y: 0, z: 0 };
        function ctGkPost() {      // [kaleci] kurtarista (tutma / celme) son .1 sn: gorunen top avuclara
            if (!CLKOK || GB.held) return;
            for (var i = 0; i < S.n; i++) {
                var a = S.st[i], ac = a.ac; if (!ac || !ac.init || ac.k !== 1 || (ac.out !== 1 && ac.out !== 2)) continue;
                if (CLK >= ac.tc && CLK < ac.tc + .1 && ac.gpo) { var fo = 1 - (CLK - ac.tc) / .1; GB.x += ac.gpo[0] * fo; GB.y += ac.gpo[1] * fo; GB.z += ac.gpo[2] * fo; return; }      /* [kaleci] cekim ofseti yumusak birakilir */
                if (CLK >= ac.tc || CLK <= ac.tc - .1) continue; ac.gpk = 1; ctGkPalm(a, ac); ac.gpk = 0; return;
            }
        }
        function ctRecv() {      // [temas] ayakla karsilama (16 mod 3, tutussuz): gorunen top karsilayan ayagin en yakin noktasina (hiz sinirli ofset)
            CT2_RT.x = CT2_RT.y = CT2_RT.z = 0; CT2_RT.on = 0;
            if (CLKOK && !GB.held && !OAB.hc) ctRecvT();
            var mx = 6 * Math.max(.001, FRM[5] || FRM[2]), dx = CT2_RT.x - CT2_R.x      /* [v139] karsilama ofseti sim saatiyle (hizli oynatmada top ayaga gec gelmez) */, dy = CT2_RT.y - CT2_R.y, dz = CT2_RT.z - CT2_R.z, dl = Math.sqrt(dx * dx + dy * dy + dz * dz);
            if (dl > mx) { dx *= mx / dl; dy *= mx / dl; dz *= mx / dl; }
            CT2_R.x += dx; CT2_R.y += dy; CT2_R.z += dz; if (!CLKOK || GB.held) { CT2_R.x = CT2_R.y = CT2_R.z = 0; return; }
            GB.x += CT2_R.x; GB.z += CT2_R.z; GB.y = Math.max(.17, GB.y + CT2_R.y);      /* top zeminin altina inmez */
        }
        var RC_ON = 1;
        function ctRecvPush(a, ac) {      /* [bacak] karsilama boyunca top ayak yuzeyinin icine girmez (yalniz itme) */
            var cy = ballY(GB.y), R = .11 * BSC + .008, best = 9, bx = 0, by = 0, bz = 0, sd, k, dep = 0, pr = 0;
            for (sd = 0; sd < 2; sd++) {
                var fb = sd ? BB.FootR : BB.FootL, FB = BODY_BIND[fb], sx = sd ? -1 : 1;
                var PT = [[.05 * sx, -.045, .07], [0, -.04, .15], [0, -.02, .09], [-.04 * sx, -.05, .07], [0, -.05, .02]];
                for (k = 0; k < 5; k++) { dqsPt(a.dqc, fb, FB[0] + PT[k][0], FB[1] + PT[k][1], FB[2] + PT[k][2], CT_Q); xform(a.rM, CT_Q, CT_W); var dd = Math.hypot(CT_W[0] - GB.x, CT_W[1] - cy, CT_W[2] - GB.z); if (R - dd > dep) { dep = R - dd; best = dd; pr = 0; bx = CT_W[0]; by = CT_W[1]; bz = CT_W[2]; } }
                var sb = sd ? BB.ShinR : BB.ShinL, SB = BODY_BIND[sb]; dqsPt(a.dqc, sb, SB[0], SB[1], SB[2], CT_Q); xform(a.rM, CT_Q, CT_W); var k0 = [CT_W[0], CT_W[1], CT_W[2]]; dqsPt(a.dqc, fb, FB[0], FB[1], FB[2], CT_Q); xform(a.rM, CT_Q, CT_W);      /* baldir: diz -> bilek, yaricap .05 */
                var ux = CT_W[0] - k0[0], uy = CT_W[1] - k0[1], uz = CT_W[2] - k0[2], uu = ux * ux + uy * uy + uz * uz || 1e-6, tt = Math.max(0, Math.min(1, ((GB.x - k0[0]) * ux + (cy - k0[1]) * uy + (GB.z - k0[2]) * uz) / uu)), qx = k0[0] + ux * tt, qy = k0[1] + uy * tt, qz = k0[2] + uz * tt, ds = Math.hypot(GB.x - qx, cy - qy, GB.z - qz);
                if (R + .05 - ds > dep) { dep = R + .05 - ds; best = ds; pr = .05; bx = qx; by = qy; bz = qz; }
            }
            if (dep <= 0) return false;
            var nx = GB.x - bx, ny = cy - by, nz = GB.z - bz, nl = Math.sqrt(nx * nx + ny * ny + nz * nz);
            if (nl < 1e-3) { nx = GB.x - a.dX; ny = 0; nz = GB.z - a.dZ; nl = Math.hypot(nx, nz) || 1; }
            if (ny < 0 && cy < R + .03) { ny = 0; nl = Math.hypot(nx, nz) || 1; }      /* zemindeki top asagi itilmez */
            var p = dep; CT2_RT.x = nx / nl * p; CT2_RT.y = ny / nl * p; CT2_RT.z = nz / nl * p; CT2_RT.on = 1; return true;
        }
        function ctRecvT() {
            for (var i = 0; i < S.n; i++) {
                var a = S.st[i], ac = a.ac; if (!ac || !ac.init || ac.k !== 16 || ac.mode !== 3 || ac.hold || !a.ok || !a.dqc || !a.rM) continue;
                var w = sm(rmp(CLK, ac.tc - .12, ac.tc - .01)) * (1 - sm(rmp(CLK, ac.tc + .05, ac.tc + .18)));
                if (w < .01) { if (RC_ON && CLK >= ac.t0 && CLK <= ac.te && Math.hypot(a.dX - GB.x, a.dZ - GB.z) < 1.2 && ctRecvPush(a, ac)) break; continue; }
                var fb = ac.side > 0 ? BB.FootL : BB.FootR, FB = BODY_BIND[fb], sx = ac.side > 0 ? 1 : -1, cy = ballY(GB.y), bd = 9, k;
                var PT = [[.05 * sx, -.045, .07], [0, -.04, .15], [0, -.02, .09], [-.04 * sx, -.05, .07]];
                for (k = 0; k < 4; k++) { dqsPt(a.dqc, fb, FB[0] + PT[k][0], FB[1] + PT[k][1], FB[2] + PT[k][2], CT_Q); xform(a.rM, CT_Q, CT_W); var dd = Math.hypot(CT_W[0] - GB.x, CT_W[1] - cy, CT_W[2] - GB.z); if (dd < bd) { bd = dd; CT2_P[0] = CT_W[0]; CT2_P[1] = CT_W[1]; CT2_P[2] = CT_W[2]; } }
                var R = .11 * BSC + .008, nx = GB.x - CT2_P[0], ny = cy - CT2_P[1], nz = GB.z - CT2_P[2], nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                var tx = CT2_P[0] + nx / nl * R - GB.x, ty = CT2_P[1] + ny / nl * R - cy, tz = CT2_P[2] + nz / nl * R - GB.z, tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
                if (tl > .5) { tx *= .5 / tl; ty *= .5 / tl; tz *= .5 / tl; }
                CT2_RT.x = tx * w; CT2_RT.y = ty * w; CT2_RT.z = tz * w; CT2_RT.on = 1;
                break;
            }
        }
        function ctPush(v) {      // [temas] top yakin oyuncunun uyluk / baldir / ayak / govde / bas kapsulune girmesin (yumusatilmis itis)
            var dt = CLKOK && CT2_U.t >= 0 ? clamp(CLK - CT2_U.t, 0, .1) : 0; CT2_U.t = CLKOK ? CLK : -1;
            var px = 0, py = 0, pz = 0, i, j;
            if (CLKOK && !GB.held && GB.ok !== false) {
                var R = .11 * BSC, cx = GB.x, cy = ballY(GB.y), cz = GB.z, grd = cy < R + .04;
                for (i = 0; i < S.n; i++) {
                    var a = S.st[i]; if (!a || !a.ok || !a.dqc || !a.rM || Math.abs(a.dX - cx) > 1.3 || Math.abs(a.dZ - cz) > 1.3) continue;
                    var pac = a.ac && a.ac.init ? a.ac : null, skp = 0;      /* temas eden uzuv muaf (1 sol bacak, 2 sag bacak, 4 govde, 8 bas): temas yuzeyden olur, buyutulmus top baldiri da keser */
                    if (pac && pac.k <= 10) continue;
                    if (pac && CLK >= pac.t0 - .05) {
                        if (pac.k === 17 && CLK <= pac.tc + .3) continue;
                        if ((pac.k === 18 || pac.k === 12) && CLK <= pac.tc + .2) skp |= 15;      /* vurus / mudahale: top destek ayaginin yaninda da olur */
                        else if (pac.k === 11 && CLK <= pac.tc + .2) skp |= 12;
                        else if (pac.k === 16 && CLK <= pac.tc + .1) skp |= pac.mode === 2 ? 4 : pac.side > 0 ? 1 : 2;
                    }
                    if (v && v.owner === i) skp |= 3;      /* top sahibinin bacaklari topu itmez (surme temasi carryContact'ta) */
                    if (OAB.hc && OAB.hc.k === 18) skp |= 15;      /* vurus tutusunda kimse topu itmez (yakindaki savunmacinin bacagi topu vuran ayaktan uzaklastiriyordu) */
                    var P = CT2_S, dq = a.dqc, rM = a.rM, b, q = 0;
                    var BN = [BB.LegL, BB.ShinL, BB.FootL, BB.LegR, BB.ShinR, BB.FootR, BB.Hips, BB.Head];
                    for (j = 0; j < 8; j++) { b = BODY_BIND[BN[j]]; dqsPt(dq, BN[j === 2 ? 1 : j === 5 ? 4 : j], b[0], b[1] + (j === 6 ? .08 : j === 2 || j === 5 ? .08 : 0), b[2], CT_Q); xform(rM, CT_Q, P[j]); }      /* 2, 5: bilegin 8 cm ustu (baldir kemiginde) */
                    b = BODY_BIND[BB.FootL]; dqsPt(dq, BB.FootL, b[0], b[1] - .04, b[2] + .15, CT_Q); xform(rM, CT_Q, P[8]);
                    b = BODY_BIND[BB.FootR]; dqsPt(dq, BB.FootR, b[0], b[1] - .04, b[2] + .15, CT_Q); xform(rM, CT_Q, P[9]);
                    b = BODY_BIND[BB.Head]; dqsPt(dq, BB.Head, b[0], b[1] + .12, b[2] + .02, CT_Q); xform(rM, CT_Q, P[10]);
                    var SEG = [[0, 1, .075, 1], [1, 2, .055, 1], [3, 4, .075, 2], [4, 5, .055, 2], [6, 7, .13, 4], [10, 10, .11, 8]];      /* ayaklar haric: temas ayakla yuzeyden olur; 4. alan: uzuv biti */
                    for (j = 0; j < 6; j++) {
                        if (skp & SEG[j][3]) continue;
                        var A0 = P[SEG[j][0]], B0 = P[SEG[j][1]], ux = B0[0] - A0[0], uy = B0[1] - A0[1], uz = B0[2] - A0[2], l2 = ux * ux + uy * uy + uz * uz, tt = l2 > 1e-8 ? clamp(((cx + px - A0[0]) * ux + (cy + py - A0[1]) * uy + (cz + pz - A0[2]) * uz) / l2, 0, 1) : 0;
                        var qx = cx + px - (A0[0] + ux * tt), qy = grd ? 0 : cy + py - (A0[1] + uy * tt), qz = cz + pz - (A0[2] + uz * tt), ql = Math.sqrt(qx * qx + qy * qy + qz * qz), need = R + SEG[j][2] - .005;
                        if (ql < need && ql > 1e-4) { var k = (need - ql) / ql; px += qx * k; py += qy * k; pz += qz * k; }
                    }
                }
                var pl = Math.sqrt(px * px + py * py + pz * pz); if (pl > .3) { px *= .3 / pl; py *= .3 / pl; pz *= .3 / pl; }
            }
            var kk = 1 - Math.exp(-Math.max(.001, FRM[2]) / .03);      /* gercek kare suresi: sim saati durdugu karede tek karede sicrama yok */
            CT2_U.x += (px - CT2_U.x) * kk; CT2_U.y += (py - CT2_U.y) * kk; CT2_U.z += (pz - CT2_U.z) * kk;
            if (GB.held || !CLKOK) { CT2_U.x = CT2_U.y = CT2_U.z = 0; return; }
            GB.x += CT2_U.x; GB.y += CT2_U.y; GB.z += CT2_U.z;
        }
        function oaBall(bx, bz, own) {
            if (own !== OAB.mo) { OAB.mo = own; OAB.mot = CLK; }                 // [oa] top sahibi değişti (kazanım)
            if (CLKOK && !GB.held && !SP_DEAD && OAB.mt) {
                var dc = CLK - OAB.lt, dmx = bx - OAB.mx, dmz = bz - OAB.mz, dm = Math.sqrt(dmx * dmx + dmz * dmz), thr = 38;      // [fiz] gorunen top acikken kopru topu surekli uretir: denetim yok
                if (dc > 0 && dm > .02 && dm > thr * dc && dm < 6 && !R._dOn && !R._dOnP) { var dr = OAB.ly > GB.y + .15 ? 1 : 0; OAB.ts = null; oaRel(OAB.lx - GB.x, dr ? 0 : OAB.ly - GB.y, OAB.lz - GB.z, CLK, .12, dr, OAB.ly, 0); }
            }
            oaBall0(); OAB.lx = GB.x; OAB.ly = GB.y; OAB.lz = GB.z; OAB.lt = CLKOK ? CLK : -1e9; OAB.mx = bx; OAB.mz = bz; OAB.mt = 1;
        }
        function oaBall0() {
            if (!CLKOK || GB.held) { OAB.on = 0; OAB.hc = null; OAB.pr = null; OAB.ts = null; return; }
            var i, ac, best = null, pv = null;
            if (OAB.pr) { var po = OAB.pr; OAB.pr = null; if (!po.rel) { po.rel = true; if (po.k === 18) oaTS(po); else oaRelE(po, CLK, po.tau || .1, po.k === 11 || po.k === 16 ? 1 : po.drop, po.vz0 || 0); } }   // [oa] ezilen tutuş: şimdiki motor topuna göre bırakılır
            for (i = 0; i < S.n; i++) {
                ac = S.st[i].ac; if (!ac || !ac.init || ac.k < 11) continue;
                if (ac.k === 11 && ac.mode !== 3 && ac.out !== 1) {             // kafa: kazanan belli olana dek (motor inişte çözer) en erken temasta geçici tutuş
                    if (!ac.out && CLK >= Math.min(ac.tc, ac.tc + ac.d[8] - .04) && CLK < ac.tc + .3) { if (!pv || ac.tc < pv.tc) pv = ac; }
                    else if (ac.prov && !ac.rel) { ac.rel = true; oaRelE(ac, CLK, .1, 1, 0); }
                    continue;
                }
                if (!ac.hold) continue;
                if (CLK >= ac.h0t && CLK < ac.h1t) { if (!best || ac.t0 > best.t0) best = ac; }
                else if (CLK >= ac.h1t && !ac.rel) { ac.rel = true; if (CLK - ac.h1t < .2) { if (ac.k === 18) oaTS(ac); else oaRelE(ac, ac.h1t, ac.tau, ac.drop, ac.vz0); } else if (OAB.hc === ac) OAB.hc = null; }
            }
            if (!best && pv) { best = pv; pv.prov = 1; }
            var bq = null, bx2 = 0, bz2 = 0;                                   // [oa] kafa: top yolundan alnın ulaşabildiği yere yatay eğilme (tutuştan önce)
            if (!best) for (i = 0; i < S.n; i++) { ac = S.st[i].ac; if (ac && ac.init && (ac.k === 11 || ac.k === 16) && ac.bnd && ac.out !== 3 && CLK >= ac.tc - .3 && CLK < ac.tc + .3 && (!bq || ac.tc < bq.tc)) bq = ac; }
            if (bq) { var wb = sm(rmp(CLK, bq.tc - .3, Math.min(bq.tc, bq.tc + bq.d[8] - .04))); bx2 = (bq.hx - bq.d[0]) * wb; bz2 = (bq.hz - bq.d[1]) * wb; }
            if (OAB.bq && OAB.bq !== bq && !best && (OAB.bx || OAB.bz)) oaRel(OAB.bx, 0, OAB.bz, CLK, .12, 0, 0, 0);      // hedef değişti/bitti: kalan fark söner
            OAB.bq = bq; OAB.bx = bx2; OAB.bz = bz2; if (bq) { GB.x += bx2; GB.z += bz2; }
            if (best) {
                OAB.ts = null;
                if (OAB.hc !== best) {                                       // [oa] yeni tutuş: görünen top uzaktaysa (> 5 cm) ofset kısa sürede söner - tek karede ışınlanma yok
                    OAB.hc = best; OAB.ht = CLK; OAB.v0 = best.k === 18 ? 4.5 : 2.5; var fr = Math.abs(CLK - OAB.lt) < .3;      // v0: ilk iniş hızı (ayağa vuruş: göğüsten aşağı indirilmiş top)
                    OAB.ex = fr ? OAB.lx - best.hx : 0; OAB.ey = fr ? OAB.ly - best.hy : 0; OAB.ez = fr ? OAB.lz - best.hz : 0;
                    var eo = OAB.ex * OAB.ex + OAB.ey * OAB.ey + OAB.ez * OAB.ez; if (eo < .0025 || eo > 100) OAB.ex = OAB.ey = OAB.ez = 0;
                    OAB.etau = clamp(Math.sqrt(OAB.ex * OAB.ex + OAB.ez * OAB.ez) / 12, .06, .2);      // [oa] büyük giriş ofseti daha uzun sürede söner (top eğilerek gelir)
                }
                var et = Math.max(0, CLK - OAB.ht), ek = Math.exp(-et / OAB.etau);
                GB.x = best.hx + OAB.ex * ek; GB.z = best.hz + OAB.ez * ek;
                GB.y = best.hy + oaEy(et);
                if (CT2_ON && best.k !== 18 && best.act && best.act.ok && best.act.dqc && best.act.rM && CLK > best.tc - .1 && (best.k === 11 || best.k === 12 || best.k === 16)) {      /* [temas] alin / ayak / gogus / uyluk */
                    if (best.hx0 == null) { best.hx0 = best.hx; best.hy0 = best.hy; best.hz0 = best.hz; }
                    var pB = -1, pO = CT2_O;
                    if (best.k === 11) { pB = BB.Head; pO[0] = 0; pO[1] = .1; pO[2] = .1; }
                    else if (best.k === 12) { pB = best.side > 0 ? BB.FootR : BB.FootL; pO[0] = 0; pO[1] = 0; pO[2] = .1; }
                    else if (best.mode === 2) { pB = BB.Torso; pO[0] = 0; pO[1] = .3; pO[2] = .17; }
                    else if (best.mode === 3) { pB = best.side > 0 ? BB.FootL : BB.FootR; pO[0] = best.side > 0 ? .05 : -.05; pO[1] = -.045; pO[2] = .07; }
                    else { pB = best.side > 0 ? BB.LegL : BB.LegR; pO[0] = 0; pO[1] = -.28; pO[2] = .1; }
                    var pb = BODY_BIND[pB]; dqsPt(best.act.dqc, pB, pb[0] + pO[0], pb[1] + pO[1], pb[2] + pO[2], CT_Q); xform(best.act.rM, CT_Q, CT_W);
                    var pR = .11 * BSC + .01, cy0 = ballY(best.hy0), nx = best.hx0 - CT_W[0], ny = cy0 - CT_W[1], nz = best.hz0 - CT_W[2], nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                    if (best.k === 11) {      /* kafa: top bas merkezinden alnin baktigi yone (gelis yonuyle hafif karisik), bas + top yaricapi uzakta: alnin onune deger */
                        dqsPt(best.act.dqc, BB.Head, pb[0], pb[1] + .12, pb[2] + .02, CT_Q); xform(best.act.rM, CT_Q, CT2_P);
                        var fx = CT_W[0] - CT2_P[0], fy = CT_W[1] - CT2_P[1], fz = CT_W[2] - CT2_P[2], fl2 = Math.sqrt(fx * fx + fy * fy + fz * fz) || 1, gx = best.hx0 - CT2_P[0], gy = cy0 - CT2_P[1], gz = best.hz0 - CT2_P[2], gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
                        nx = fx / fl2 + .5 * gx / gl; ny = fy / fl2 + .5 * gy / gl; nz = fz / fl2 + .5 * gz / gl; nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                        CT_W[0] = CT2_P[0]; CT_W[1] = CT2_P[1]; CT_W[2] = CT2_P[2]; pR += .1;
                    }
                    var tx = CT_W[0] + nx / nl * pR - best.hx0, ty = CT_W[1] + ny / nl * pR - cy0, tz = CT_W[2] + nz / nl * pR - best.hz0, tl = Math.sqrt(tx * tx + ty * ty + tz * tz);
                    if (tl > .6) { tx *= .6 / tl; ty *= .6 / tl; tz *= .6 / tl; }
                    var pw0 = Math.max(best.tc - .1, OAB.ht), pw = best.tc - .01 > pw0 + .005 ? sm(rmp(CLK, pw0, best.tc - .01)) : 1;      /* rampa tutusun basladigi andan: giriste sicrama yok */
                    best.hx = best.hx0 + tx * pw; best.hy = best.hy0 + ty * pw; best.hz = best.hz0 + tz * pw;
                    GB.x = best.hx + OAB.ex * ek * (1 - pw); GB.z = best.hz + OAB.ez * ek * (1 - pw); GB.y = best.hy + oaEy(et) * (1 - pw);      /* giris farki temas aninda sifir */
                }
                if (CT_ON && best.k === 18 && best.act && best.act.ok && best.act.dqc && best.act.rM && best.hx0 != null && CLK > best.tc - .1) {      /* [temas] top ayakta */
                    var ka = best.act, kl = best.foot > 0, kF = kl ? BB.FootL : BB.FootR, kB = BODY_BIND[kF];
                    dqsPt(ka.dqc, kF, kB[0], kB[1] - .025, kB[2] + .1, CT_Q); xform(ka.rM, CT_Q, CT_W);
                    var kR = .11 * BSC + .015, kw = sm(rmp(CLK, best.tc - .1, best.tc - .01)), kox = CT_W[0] + Math.sin(best.ky) * kR - best.hx0, koz = CT_W[2] + Math.cos(best.ky) * kR - best.hz0, kol = Math.hypot(kox, koz);
                    if (kol > .4) { kox *= .4 / kol; koz *= .4 / kol; }
                    best.hx = best.hx0 + kox * kw; best.hz = best.hz0 + koz * kw; GB.x = best.hx + OAB.ex * ek; GB.z = best.hz + OAB.ez * ek;
                }                                   // yukarıdaki top yerçekiminden hızlı inmez
                return;
            }
            OAB.hc = null;
            oaTSApply();
            if (!OAB.on) return;
            var tt = CLK - OAB.rt, kk = tt < 0 ? 1 : Math.exp(-tt / OAB.tau);
            GB.x += OAB.ox * kk; GB.z += OAB.oz * kk;
            if (OAB.drop) { var yd = OAB.h0 + OAB.vz * tt - 4.905 * tt * tt; if (tt > 0 && yd <= GB.y) OAB.drop = 0; else if (yd > GB.y) GB.y = yd; }
            else GB.y += OAB.oy * kk;
            if (tt < -.5 || (kk < .01 && !OAB.drop)) OAB.on = 0;
        }
        /* 18 canlı vuruş: kök motorda + temasta vuruş ayağını topa getiren ofset; gövde vuruş yönüne kısmen döner; poz spStrike (sim saati) */
        function oaKick(a, ac, c, P) {
            var wo = sm(rmp(c, ac.t0, ac.tc)) * (1 - sm(rmp(c, ac.tc + .06, ac.tc + .4)));
            RT.L = ac.oL * wo; RT.F = ac.oF * wo;
            RT.hy = 1; RT.ya = ac.yaw; RT.yw = sm(rmp(c, ac.t0, ac.tc - .02)) * (1 - sm(rmp(c, ac.tc + .12, ac.te - .04)));
            if (P) spStrike(a, ac, c);
        }
        /* 11 kafa: zaman planı (kalkış tk, temas tc = sıçramanın tepesi, iniş tl); h → uçuş süresi T = √(8h/g) */
        function oaHeadT(ac, h) {
            var T = h > .01 ? Math.sqrt(8 * h / 9.81) : .2;
            ac.h = h; ac.tk = Math.max(ac.t0 + .07, ac.tc - T * .5); ac.tl = ac.tk + T; ac.te = ac.tl + .34;
        }
        function oaHeadHold(ac) { ac.hold = 1; ac.h0t = ac.mode === 3 ? ac.t0 : Math.min(ac.tc, ac.tc + ac.d[8] - .04); ac.h1t = ac.tc + Math.max(0, ac.d[8]) + (ac.mode === 3 ? 0 : .06); }   // [oa] +.06: motor topu ayağa koyduktan sonra bırakılır · motorun çözüm adımı (top ayağa) görünmeden tutuş başlar
        function oaHead(a, ac, c, P) {
            var tk = ac.tk, tc = ac.tc, tl = ac.tl, h = ac.h, st = ac.mode !== 1;
            var wo = sm(rmp(c, ac.t0, tc)) * (1 - sm(rmp(c, tl, ac.te)));
            RT.L = ac.oL * wo; RT.F = ac.oF * wo;
            if (c > tk && c < tl && h > .01) { var u = (c - tk) / (tl - tk); RT.Y = 4 * h * u * (1 - u); }
            RT.hy = 1; RT.ya = ac.yaw; RT.yw = sm(rmp(c, ac.t0, tk)) * (1 - sm(rmp(c, tl + .05, ac.te)));
            if (!P) return;
            var won = ac.out === 1 ? 1 : ac.out === 3 ? .5 : .8;
            var cr = sm(rmp(c, ac.t0, tk - .03)) * (1 - sm(rmp(c, tk - .03, tk + .07)));          // karşı hareket (çömelme)
            var up = sm(rmp(c, tk - .03, tk + .09)), dn = sm(rmp(c, tl - .09, tl + .01));         // kalkış / inişe hazırlık
            var ld = sm(rmp(c, tl - .02, tl + .07)) * (1 - sm(rmp(c, tl + .1, ac.te)));            // iniş: dizler darbeyi emer
            var e1 = sm(rmp(c, tk - .04, tk + .12)), e2 = sm(rmp(c, tc - .07, tc + .03)), e3 = sm(rmp(c, tc + .06, tl + .04));
            // gövde: çömelirken öne, kalkışta geriye gerilir (~-17°), temasta öne kamçı (~+24°); baş topa bakar → temasta öne
            var to = .25 * cr; to += (-.18 - to) * e1; to += (.42 * won - to) * e2; to += (.12 - to) * e3; to += (.3 - to) * ld;
            var he = -.05 * cr; he += (-.22 - he) * e1; he += (.3 * won - he) * e2; he += (.1 - he) * e3;
            PA(kTo, to, null, null); PA(kHe, he, 0, 0);
            // kollar: geriye savrulur → yana-yukarı açılır (~60° abdüksiyon, dirsek ~80°: denge, koruma) → temasta aşağı-yana çekilir → inişte iner
            var ax = .45 * cr, az = .12, fx = -.5;
            ax += (-.28 - ax) * e1; az += (1.25 - az) * e1; fx += (-1.05 - fx) * e1;
            ax += (-.2 - ax) * e2 * .6; az += (1.3 - az) * e2 * .6;      /* [kafa] kollar omuz hizasinda yana */
            var e4 = Math.max(e3 * .6, ld); ax += (-.35 - ax) * e4; az += (.35 - az) * e4; fx += (-.7 - fx) * ld;
            PA(kAL, ax, 0, -az); PA(kAR, ax, 0, az); PA(kFL, fx, 0, 0); PA(kFR, fx, 0, 0);
            // bacaklar
            var TF = ac.tf > 0 ? kLR : kLL, SW = TF === kLR ? kLL : kLR, l1, s1, l2, s2, f1, f2;
            if (st) {                                                        // duruştan çift ayak: derin çömelme → iki bacak uzanır → iniş
                l1 = -.7 * cr; s1 = 1.3 * cr; var fa = up * (1 - dn);
                l1 += (-.15 - l1) * fa; s1 += (.35 - s1) * fa; f1 = .4 * fa;
                l1 += (-.45 - l1) * dn; s1 += (.8 - s1) * dn; l1 += (-.55 - l1) * ld; s1 += (1.0 - s1) * ld;
                l2 = l1; s2 = s1; f2 = f1;
            } else {                                                         // koşarak tek ayak: kalkış bacağı iter (uzanır), salınım dizi yukarı sürülür
                l1 = -.3 * cr; s1 = .75 * cr; l2 = .35 * cr; s2 = 1.1 * cr; var fb = up * (1 - dn);
                l1 += (.12 - l1) * fb; s1 += (.15 - s1) * fb; f1 = .45 * fb;
                l2 += (-1.15 - l2) * fb; s2 += (1.25 - s2) * fb; f2 = .2 * fb;
                l1 += (-.35 - l1) * dn; s1 += (.5 - s1) * dn; l2 += (-.5 - l2) * dn; s2 += (.7 - s2) * dn;
                l1 += (-.45 - l1) * ld; s1 += (.9 - s1) * ld; l2 += (-.5 - l2) * ld; s2 += (.85 - s2) * ld;
            }
            PA(TF, l1, null, null); PA(TF + 3, s1, 0, 0); PA(TF + 6, f1, 0, 0); PA(SW, l2, null, null); PA(SW + 3, s2, 0, 0); PA(SW + 6, f2, 0, 0);
            var air = up * (1 - sm(rmp(c, tl - .02, tl + .03)));
            PA(kHi, .06 * cr, -Math.min(legDrop(l1, s1, 0), legDrop(l2, s2, 0)) * (1 - air), 0);   // yerdeyken uzanan bacak zemine (kalça iner)
        }
        /* 12 müdahale */
        function oaTackle(a, ac, c, P) {
            if (ac.mode === 3) { oaSlide(a, ac, c, P); return; }
            if (ac.mode === 4) { oaStepIn(a, ac, c, P); return; }
            var tc = ac.tc, wo = sm(rmp(c, ac.t0, tc)) * (1 - sm(rmp(c, tc + .1, tc + .4)));
            RT.L = ac.oL * wo; RT.F = ac.oF * wo; RT.hy = 1; RT.ya = ac.yaw; RT.yw = sm(rmp(c, ac.t0, tc)) * (1 - sm(rmp(c, ac.te - .25, ac.te)));
            if (!P) return;
            var sd = ac.side, TL = sd > 0 ? kLR : kLL, SL = TL === kLR ? kLL : kLR, az = TL === kLR ? 1 : -1;     // az: müdahale bacağının yana açılma işareti
            var rc = sm(rmp(c, ac.t0, tc - .03)), ex = sm(rmp(c, tc - .05, tc + .02)), bk = sm(rmp(c, tc + .1, tc + .38));
            var miss = ac.res === 3 ? sm(rmp(c, tc + .04, tc + .18)) * (1 - sm(rmp(c, ac.te - .22, ac.te))) : 0;
            var lx, sx, lz = 0, ly = 0, fx = 0;
            if (ac.mode === 2) { lx = -.35 * rc; lz = az * (.25 * rc + .7 * ex); ly = az * .7 * rc; sx = .9 * rc * (1 - ex) + .25 * ex; }   // yandan blok: bacak yana, ayak içi topa
            else { lx = -.6 * rc - .65 * ex; sx = 1.9 * rc * (1 - ex) + .5 * ex; fx = -.25 * ex; lz = az * .1; }                            // öne uzanma: kalça ~70°, diz 110° → 30°
            var kb = 1 - bk * (1 - .5 * miss);
            lx *= kb; lz *= kb; ly *= kb; sx = sx * kb + .3 * (1 - kb);
            PA(TL, lx, ly, lz); PA(TL + 3, sx, 0, 0); PA(TL + 6, fx, 0, 0);
            var sk = .15 + .55 * rc * (1 - bk * (1 - miss)), sl = -.25 * rc * (1 - bk * (1 - miss));         // destek dizi bükük (hamle), kalça alçalır
            PA(SL, sl, null, null); PA(SL + 3, sk, 0, 0);
            PA(kHi, .1 * rc * (1 - bk), -legDrop(sl, sk, 0), (ac.mode === 2 ? az * .12 : 0) * rc);
            // gövde öne eğilir ve topa döner; kaçan müdahalede rakibin kaçtığı yöne savrulur, kollar dengede açılır
            PA(kTo, .12 + .35 * rc * (1 - bk) + .25 * miss, .25 * sd * rc * (1 - bk) - .45 * sd * miss, -az * .1 * rc);
            PA(kHe, .25, null, null);
            var oA = TL === kLR ? kAL : kAR, sA = oA === kAL ? kAR : kAL, oz = oA === kAL ? -1 : 1;
            PA(oA, -.4 * rc - .3 * miss, 0, oz * (.6 * rc + .5 * miss)); PA(oA + 3, -.5, 0, 0);
            PA(sA, .25 * rc - .5 * miss, 0, -oz * (.25 + .7 * miss)); PA(sA + 3, -.6, 0, 0);
        }
        /* [sav] araya girme: adim (kok hizasi tc'ye dek) + rakipten uzak ayakla topa uzanma; govde rakibe yaslanir, rakip tarafindaki kol onu tutar;
           temastan sonra alcak koruma durusu (dizler bukuk, top ayak altinda) yavasca kosuya doner */
        function oaStepIn(a, ac, c, P) {
            var tc = ac.tc, t0 = ac.t0, wo = sm(rmp(c, t0, tc)) * (1 - sm(rmp(c, tc + .25, tc + .58)));
            RT.L = ac.oL * wo; RT.F = ac.oF * wo; RT.hy = 1; RT.ya = ac.yaw; RT.yw = sm(rmp(c, t0, tc - .02)) * (1 - sm(rmp(c, ac.te - .22, ac.te)));
            if (!P) return;
            var sd = ac.side, TL = sd > 0 ? kLR : kLL, SL = TL === kLR ? kLL : kLR, az = TL === kLR ? 1 : -1;
            var rc = sm(rmp(c, t0, tc - .02)), ex = sm(rmp(c, tc - .04, tc + .03)), bk = sm(rmp(c, tc + .1, ac.te - .04));
            var miss = ac.res === 3 ? sm(rmp(c, tc + .04, tc + .18)) * (1 - sm(rmp(c, ac.te - .22, ac.te))) : 0, on = rc * (1 - .75 * bk);
            // topa uzanan (rakipten uzak) bacak: one ve hafif iceri, diz bukuk -> temasta uzanir -> topu govde altina ceker
            var lx = -.5 * rc - .18 * ex, lz = -az * .13 * rc, sx = .85 * rc * (1 - ex) + .4 * ex, fx = -.12 * ex, kb = 1 - bk * .85;
            lx *= kb; lz *= kb; sx = sx * kb + .3 * (1 - kb);
            PA(TL, lx, 0, lz); PA(TL + 3, sx, 0, 0); PA(TL + 6, fx, 0, 0);
            // destek bacagi (rakip tarafi): genis, bukuk; kalca alcalir
            var sl = -.28 * on, sk = .55 * on + .15 * (1 - on) * rc;
            PA(SL, sl, null, -az * .1 * on); PA(SL + 3, sk, 0, 0);
            PA(kHi, .1 * on, -legDrop(sl, sk, 0), 0);
            // govde one egik, rakibe yaslanir (omuz araya), bas topa
            PA(kTo, .16 + .24 * on + .2 * miss, .2 * sd * on - .4 * sd * miss, -az * .2 * on);
            PA(kHe, .3, null, null);
            // rakip tarafindaki kol yana / geriye acik (rakibi tutar), diger kol denge
            var oA = TL === kLR ? kAL : kAR, sA = oA === kAL ? kAR : kAL, oz = oA === kAL ? -1 : 1;
            PA(oA, .15 * on - .3 * miss, 0, oz * (.95 * on + .4 * miss)); PA(oA + 3, -.45 * on - .15, 0, 0);
            PA(sA, -.25 * on, 0, -oz * (.3 * on)); PA(sA + 3, -.6, 0, 0);
        }
        /* kayarak müdahale: düşüş (kalça geriye yatar, kök alçalır) → temas → yavaşlayarak kayma → diz çöküp kalkış */
        function oaSlide(a, ac, c, P) {
            var t0 = ac.t0, tc = ac.tc, tu = ac.tu, ua = rmp(c, t0, tc), g = rmp(c, tu, ac.te - .06), wA = sm(g / .5), wB = sm((g - .45) / .55);
            RT.lk = 1; RT.gait = 1;
            RT.F = c < tc ? ac.sF * ua : ac.sF + (ac.sE - ac.sF) * (1 - Math.exp(-(c - tc) / .13)); RT.L = ac.sL * sm(ua);
            var s = sm(rmp(c, t0, tc - .03)), dy = -.74 * sm(rmp(c, t0 + .02, tc + .04));
            RT.Y = (dy + (-.42 - dy) * wA) * (1 - wB);
            if (!P) return;
            var W0 = PW_, sd = ac.side, LD = sd > 0 ? kLR : kLL, BT = LD === kLR ? kLL : kLR, bz = BT === kLL ? -1 : 1, AB = BT === kLL ? kAL : kAR, AO = AB === kAL ? kAR : kAL, abz = AB === kAL ? -1 : 1;
            PW_ = W0 * (1 - wB);
            // kayma pozu (s) → çömelme/diz (wA): ön bacak gergin topa, alttaki bacak katlı yana, kalça geriye yatık, destek eli yerde
            oaPA(kHi, -1.15 * s, .25, wA, 0, sd * .3 * s * (1 - wA));
            oaPA(kTo, .5 * s, .55, wA, .2 * sd * s * (1 - wA), 0); oaPA(kHe, .45 * s, .2, wA, 0, 0);
            oaPA(LD, -.4 * s, -1.25, wA, 0, 0); oaPA(LD + 3, .15 * s, 1.45, wA, 0, 0); oaPA(LD + 6, -.2 * s, 0, wA, 0, 0);
            oaPA(BT, -.1 * s, .15, wA, 0, bz * .35 * s * (1 - wA)); oaPA(BT + 3, 1.6 * s, 1.9, wA, 0, 0);
            oaPA(AB, .75 * s, -.5, wA, 0, abz * .45 * s * (1 - wA)); oaPA(AB + 3, -.3, -.7, wA, 0, 0);
            oaPA(AO, -.9 * s, -.5, wA, 0, -abz * .35 * s * (1 - wA)); oaPA(AO + 3, -.8, -.7, wA, 0, 0);
            PW_ = W0;
        }
        /* 13 sendeleme: gövde itilme yönüne eğilir/yana yatar, kollar yana açılır, adım açılır */
        function oaStumble(a, ac, c, P) {
            if (!P) return;
            var e = sm(rmp(c, ac.t0, ac.t0 + .1)) * (1 - sm(rmp(c, ac.te - .25, ac.te))), s = clamp(ac.d[2], 0, 1);
            if (e < .002) return;
            var yw = a.dYaw != null ? a.dYaw : a.yaw, cy = Math.cos(yw), sy = Math.sin(yw), pf = ac.d[0] * sy + ac.d[1] * cy, pl = ac.d[0] * cy - ac.d[1] * sy;
            var W0 = PW_; PW_ = W0 * e;
            PA(kTo, .12 + .42 * s * Math.max(0, pf) - .18 * s * Math.max(0, -pf), null, -pl * .35 * s); PA(kHe, -.12, null, null);
            PA(kHi, null, null, -pl * .12 * s);
            PA(kAL, -.55, 0, -(.5 + .55 * s)); PA(kAR, -.55, 0, .5 + .55 * s); PA(kFL, -.45, 0, 0); PA(kFR, -.45, 0, 0);
            PA(kLL, null, null, -.1 * s); PA(kLR, null, null, .1 * s);
            PW_ = W0;
        }
        /* 14 faul sonrası düşme: düşüş (ivmelenen dönme) → yerde → kalkış (eller-dizler → tek diz → ayağa) */
        function oaFall(a, ac, c, P) {
            var ty = ac.type, u = rmp(c, ac.t0, ac.tf), f = Math.pow(u, 1.6), g = rmp(c, ac.tli, ac.tu), gA = sm(g / .42), gB = sm((g - .38) / .32), gC = sm((g - .68) / .32);
            var sl = 1 - Math.exp(-(c - ac.t0) / .22);
            RT.lk = 1; RT.gait = 1; RT.F = ac.sF * sl; RT.L = ac.sL * sl;
            var bo = u >= 1 && c < ac.tf + .2 ? .05 * Math.sin(Math.PI * (c - ac.tf) / .2) : 0;                // yere çarpınca küçük sekme
            var Yl = ty === 2 ? YLIE : -.84, Yf = Math.max(Yl, -.98 * (1 - Math.cos(1.5 * f))) + bo;          // düşerken kalça yay çizerek iner
            RT.Y = ((Yf + (-.5 - Yf) * gA) + (-.42 - (Yf + (-.5 - Yf) * gA)) * gB) * (1 - gC);
            if (!P) return;
            var W0 = PW_; PW_ = W0 * (1 - gC);
            var sg = ac.sg, tA = sm(rmp(c, ac.t0, ac.t0 + .2)), lie = sm(rmp(c, ac.tf - .05, ac.tf + .25));
            if (ty === 2) {                                                  // yana: düşen tarafa yuvarlanır, alttaki kol yana açılıp yeri karşılar
                var rl = -sg * 1.45 * f, LA = sg > 0 ? kAR : kAL, UA = LA === kAR ? kAL : kAR, lz = LA === kAR ? 1 : -1;
                PA(kHi, gA * .9 * (1 - gB) + .3 * gB, null, rl * (1 - gA));
                oaPA(kTo, .15 * tA, .6, gA, 0, sg * -.2 * f * (1 - gA)); PA(kHe, -.2 * (1 - gA) + .2 * gA, sg * .3 * f * (1 - gA), 0);
                oaPA(LA, -.9 * f - .4 * lie, -1.35, gA, 0, lz * (.4 + .9 * f) * (1 - gA)); oaPA(LA + 3, -.3, -.2, gA, 0, 0);
                oaPA(UA, -.7 * f, -1.35, gA, 0, -lz * .15); oaPA(UA + 3, -1.1, -.2, gA, 0, 0);
            } else if (ty === 3) {                                           // sırtüstü: geriye düşer, kollar arkada yeri karşılar
                var pb = -1.45 * f;
                PA(kHi, pb * (1 - gA) + 1.0 * gA * (1 - gB) + .3 * gB, null, 0);
                oaPA(kTo, .3 * f, .6, gA, 0, 0); PA(kHe, .5 * f * (1 - gA) + .2 * gA, 0, 0);
                oaPA(kAL, .9 * f, -1.35, gA, 0, -.35 * (1 - gA)); oaPA(kAR, .9 * f, -1.35, gA, 0, .35 * (1 - gA)); oaPA(kFL, -.3, -.2, gA, 0, 0); oaPA(kFR, -.3, -.2, gA, 0, 0);
            } else {                                                         // öne yüzüstü: gövde ~88°, kollar öne uzanıp düşüşü karşılar (dirsek ~130°), baş kalkık
                var pf2 = 1.5 * f + bo;
                PA(kHi, pf2 * (1 - gA) + 1.45 * gA * (1 - gB) + .3 * gB, null, 0);
                oaPA(kTo, .15 * tA * (1 - lie), .3, gB, 0, 0); PA(kHe, -.45 * tA * (1 - gB) + .2 * gB, 0, 0);
                var arx = (-.6 * tA - 1.3 * f) * (1 - lie) - 1.1 * lie, afx = -.6 * (1 - lie) - 2.3 * lie, av = arx + (-1.45 - arx) * gA, fv = afx + (-.15 - afx) * gA;   // [vq] yatışta kollar yerde: dirsek yana açık, avuç başın yanında
                var azw = .25 + .8 * lie * (1 - gA);
                av += (-.6 - av) * gB; fv += (-.3 - fv) * gB;                // eller yerde (dirsek açık) → el diz üstünde
                PA(kAL, av, 0, -azw); PA(kAR, av, 0, azw); PA(kFL, fv, 0, 0); PA(kFR, fv, 0, 0);
            }
            // bacaklar: düşerken takılan bacak geride kalır, öbürü öne adım; yerde uzanık; kalkışta eller-dizler (kalça/diz 90°) → tek diz → ayağa
            var TR = sg > 0 ? kLR : kLL, OT = TR === kLR ? kLL : kLR, kL = ty === 1 ? -1.5 : -1.55, kS = ty === 1 ? 1.6 : 2.0;
            var lt = .18 * tA * (1 - lie) + (ty === 1 ? -.1 : .1) * lie, st = .7 * tA * (1 - lie) + (ty === 1 ? .15 : .3) * lie, lo = -.6 * tA * (1 - lie) + (ty === 3 ? -.5 : ty === 1 ? -.15 : .05) * lie, so = .5 * tA * (1 - lie) + (ty === 3 ? .9 : ty === 1 ? .25 : .35) * lie;   // [vq] yüzüstü: bacaklar yerde uzanık
            if (ty === 2) { lt = -.5 * f; st = .7 * f; lo = -.3 * f; so = .5 * f; }
            oaPA(TR, lt + (kL - lt) * gA, .1, gB, 0, 0); oaPA(TR + 3, st + (kS - st) * gA, 1.2, gB, 0, 0);     // tek diz: arka diz yerde, baldır geriye yerde
            oaPA(OT, lo + (kL - lo) * gA, -1.5, gB, 0, 0); oaPA(OT + 3, so + (kS - so) * gA, 1.5, gB, 0, 0);    // öndeki ayak basar (baldır dik)
            var fpl = (ty === 1 ? .3 + .65 * lie : .3) * (1 - gA); PA(kfL, fpl, 0, 0); PA(kfR, fpl, 0, 0);     // [vq] yüzüstü: ayak üstü yerde
            PW_ = W0;
        }
        /* 15 faul yapan: durur ve döner; itiraz (eller havada → açık avuçlar) / hayal kırıklığı; kart: eller belde, baş eğik */
        function oaReact(a, ac, c, P) {
            var sl = 1 - sm((a.spd - 2) / 2.5);                              // kök motorda (motor oyuncuyu hemen yerine yollar - kilit sonradan koşarak yetişmeyi gerektirirdi); yavaşken durup döner ve hareket eder, koşarken jest söner
            RT.hy = 1; RT.ya = ac.yaw; RT.yw = sm(rmp(c, ac.t0 + .05, ac.t0 + .55)) * sl;
            if (!P) return;
            var W0 = PW_, e = sm(rmp(c, ac.t0 + .12, ac.t0 + .45)) * sl, hd = ac.card ? sm(rmp(c, ac.tH, ac.tH + .45)) * sl : 0;
            if (ac.gest !== 1) hd = Math.max(hd, e);                         // 2: hayal kırıklığı (eller belde, baş eğik) - kartla aynı duruş
            var k1 = ac.gest === 1 ? e * (1 - hd) : 0;
            if (k1 > .002) {                                                 // 1: itiraz - eller havada, sonra açık avuçlar öne
                PW_ = W0 * k1;
                var lo = sm(rmp(c, ac.t0 + .75, ac.t0 + 1.15)), ax = -2.35 + 1.35 * lo, az = .3 + .3 * lo, fx = -.35 - .65 * lo;
                PA(kAL, ax, 0, -az); PA(kAR, ax, 0, az); PA(kFL, fx, 0, 0); PA(kFR, fx, 0, 0); PA(kTo, -.06, null, null); PA(kHe, -.12, null, 0);
            }
            if (hd > .002) { PW_ = W0 * hd; PA(kAL, 1.175, .748, -1.05); PA(kAR, 1.175, -.748, 1.05); PA(kFL, -1.62, 0, 0); PA(kFR, -1.62, 0, 0); PA(kHe, .38, 0, 0); PA(kTo, .08, null, null); }
            PW_ = W0;
        }
        /* 16 kontrol: göğüs (gövde geriye, göğüs öne, kollar açık → yastıklama → topa bakar) / uyluk (uyluk kalkar → yastıklayarak iner) */
        function oaCtrl(a, ac, c, P) {
            var tc = ac.tc, wo = sm(rmp(c, ac.t0, tc)) * (1 - sm(rmp(c, tc + .1, ac.te - .1)));
            RT.L = ac.oL * wo; RT.F = ac.oF * wo; RT.hy = 1; RT.ya = ac.yaw; RT.yw = sm(rmp(c, ac.t0, tc - .04)) * (1 - sm(rmp(c, tc + .15, ac.te)));
            if (ac.mode === 3 && !OA3_FULL) { RT.L = 0; RT.F = 0; RT.yw = 0; }      // [duzgun] govde kosu yonunde
            if (!P) return;
            var pr = sm(rmp(c, ac.t0, tc - .02)), cu = sm(rmp(c, tc - .02, tc + .12)), rs = sm(rmp(c, tc + .1, ac.te - .05));
            if (ac.mode === 2) {
                var to = -.3 * pr; to += (-.42 - to) * cu * (1 - rs); to += (.22 - to) * rs;
                PA(kTo, to, 0, 0); PA(kHe, .1 * pr + .35 * rs, 0, 0);
                var ax = -.35 * pr, az = .85 * pr * (1 - .7 * rs);
                PA(kAL, ax, 0, -az); PA(kAR, ax, 0, az); PA(kFL, -.5, 0, 0); PA(kFR, -.5, 0, 0);
                PA(kLL, -.2 * pr, null, null); PA(kLR, -.2 * pr, null, null); PA(kSL, .35 * pr, 0, 0); PA(kSR, .35 * pr, 0, 0);
                PA(kHi, -.04 * pr, -legDrop(-.2 * pr, .35 * pr, 0), 0);
            } else if (ac.mode === 3) {      // [carry] ayakla karşılama: karşılayan bacak öne-yana, ayağın içi topa dönük (dışa dönme), diz hafif bükük; destek dizi bükük, gövde topa
                var TL3 = ac.side > 0 ? kLL : kLR, SL3 = TL3 === kLL ? kLR : kLL, sg3 = TL3 === kLL ? -1 : 1;
                if (!OA3_FULL) { var e3 = sm(rmp(c, tc - .16, tc - .02)) * (1 - sm(rmp(c, tc + .06, tc + .24))), W3 = PW_; if (e3 > .002) { PW_ = W3 * e3; PA(TL3, -.5, sg3 * .7, sg3 * .15); PA(TL3 + 3, .35, 0, 0); PA(TL3 + 6, .15, 0, 0); PW_ = W3; } return; }      // [duzgun] yalniz karsilayan bacak
                var lx3 = -.55 * pr; lx3 += (-.32 - lx3) * cu; lx3 += (-.1 - lx3) * rs;
                PA(TL3, lx3, sg3 * .85 * pr * (1 - rs), sg3 * .22 * pr * (1 - rs)); PA(TL3 + 3, .3 * pr + .15 * cu * (1 - rs), 0, 0); PA(TL3 + 6, .15 * pr, 0, 0);
                PA(SL3, -.12 * pr, null, null); PA(SL3 + 3, .5 * pr * (1 - .6 * rs), 0, 0); PA(kHi, null, -legDrop(-.12 * pr, .5 * pr * (1 - .6 * rs), 0), 0);
                PA(kTo, (ac.rc ? .08 : .18) * pr, -sg3 * (ac.rc ? .1 : .18) * pr * (1 - rs), 0); PA(kHe, (ac.rc ? .15 : .38) * pr, 0, 0);
                if (!ac.rc) { PA(kAL, -.18, 0, -.6 * pr); PA(kAR, -.18, 0, .6 * pr); PA(kFL, -.45 * pr, 0, 0); PA(kFR, -.45 * pr, 0, 0); }      // [fiz] top surmede kollar kosu salinimiyla
            } else {
                var TL = ac.side > 0 ? kLL : kLR, SL = TL === kLL ? kLR : kLL;
                var lx = -1.2 * pr; lx += (-.75 - lx) * cu; lx += (-.2 - lx) * rs;
                var sx = 1.35 * pr; sx += (.9 - sx) * cu; sx += (.3 - sx) * rs;
                PA(TL, lx, null, null); PA(TL + 3, sx, 0, 0); PA(TL + 6, .3 * pr, 0, 0);
                PA(SL, -.1, null, null); PA(SL + 3, .3, 0, 0); PA(kHi, null, -legDrop(-.1, .3, 0), 0);
                PA(kTo, .2 * pr + .15 * rs, null, null); PA(kHe, .4, 0, 0);
                PA(kAL, -.22, 0, -.95 * pr); PA(kAR, -.22, 0, .95 * pr); PA(kFL, -.55 * pr, 0, 0); PA(kFR, -.55 * pr, 0, 0);     // [oa] kollar denge için yana açık
            }
        }
        /* 17 şut bloğu: kollar arkada (el ile temas olmasın), gövde öne ve yan döner, alçak topta bacak topa */
        function oaBlock(a, ac, c, P) {
            RT.hy = 1; RT.ya = ac.yaw; RT.yw = sm(rmp(c, ac.t0, ac.tc)) * (1 - sm(rmp(c, ac.te - .2, ac.te)));
            if (!P) return;
            var e = sm(rmp(c, ac.t0, ac.tc)), sd = ac.side, TL = sd > 0 ? kLR : kLL, SL = TL === kLR ? kLL : kLR, az = TL === kLR ? 1 : -1;
            PA(kAL, .6 * e, 0, .12 * e); PA(kAR, .6 * e, 0, -.12 * e); PA(kFL, -1.25 * e, 0, 0); PA(kFR, -1.25 * e, 0, 0);
            PA(kTo, (ac.hi ? -.05 : .3) * e, .25 * sd * e, 0); PA(kHe, .2 * e, null, null);
            if (!ac.hi) { PA(TL, -.55 * e, az * .4 * e, az * .45 * e); PA(TL + 3, .25 * e, 0, 0); PA(SL, -.2 * e, null, null); PA(SL + 3, .5 * e, 0, 0); PA(kHi, null, -legDrop(-.2 * e, .5 * e, 0), 0); }
            else { PA(kSL, .3 * e, 0, 0); PA(kSR, .3 * e, 0, 0); PA(kHi, null, -legDrop(0, .3 * e, 0), 0); }
        }
        /* ================= [v187] FAUL TÜRLERİ, YERDE ACI, JESTLER, HAKEM İŞARETLERİ — yalnız görüntü (simülasyona/kayda dokunmaz) =================
           19 faul hareketi (faul yapan): d = [kurban x, kurban z, tür, yan, göreli hız, kurban hız x, kurban hız z]
              tür: 1 tutma (forma çekme) · 2 itme (iki el) · 3 dirsek · 4 tekme (ayakta, kaval kemiğine) · 5 çelme (ayak bileğine kanca) · 6 yüksek ayak · 7 kafa çarpışması (havada)
              Kök: temasa dek kurbana doğru kısa hamle (≤ 1,3 m; erişim payı türe göre), sonra artık ofsete devredilir (yürüyerek söner).
           14 düşme (kurban) ek çeşitler d[5]: 1 sekerek (tekme: vurulan bacak havada, tek ayak sekme) · 2 yüz tutma (dirsek / yüksek ayak) · 3 bacak tutma (yerde acı, sallanma)
              4 yuvarlanma (hızlı düşüşte yere değince yan dönüp sırtüstü kalır) · 5 çekilme (tutma: gövde geriye çekilir, kollar savrulur) · 6 baş tutma (kafa çarpışması)
           20 jest/tepki (her oyuncu): d = [hedef x, hedef z, tür, süre, şiddet, el (1 sağ / -1 sol)]
              1 eller başta · 2 eller dizde · 3 diz çökme · 4 itiraz (kollar açık) · 5 alkış · 6 kol kaldırma · 7 el sıkışma · 8 kucaklaşma · 9 baraj (eller önde)
              10 itişme / markaj · 11 yönlendirme (kol uzatıp gösterme) · 12 yumruk havada · 13 uçak (kollar yana) · 14 diz kayması (kök kilitli, dizler üstünde kayar)
              15 sıçrayıp yumruk (köşe bayrağı) · 16 yerdekine el uzatma · 17 eller belde · 18 elleriyle yüzünü kapatma · 19 seyirciye alkış (baş üstünde) · 20 kaleci barajı yönetir (mocap) */
        var V7_ON = 1, V7_DLV = 0, V7_REF = { adv: 1, fk: 1, pen: 1, corner: 1, gk: 1, whistle: 1 }, V7_REACH = [0, .55, .62, .5, .72, .82, .9, .35], V7_DUR = [0, 1.0, .75, .7, .7, .75, .85, 1.0];
        function v7Ramp(c, a, b) { return sm(rmp(c, a, b)); }
        function v7FoulInit(a, ac, x, z) {
            var d = ac.d, md = clamp(d[2] | 0, 1, 7), tx = d[0] - x, tz = d[1] - z, dl = Math.sqrt(tx * tx + tz * tz), by = dl > .2 ? Math.atan2(tx, tz) : a.yaw;
            ac.mode = md; ac.side = d[3] < 0 ? -1 : 1; ac.win = .07; ac.hold = 0;
            ac.yaw = angLerp(a.yaw, by, md === 1 ? .75 : md === 5 ? .6 : .85);
            var cy = Math.cos(ac.yaw), sy = Math.sin(ac.yaw), fwd = tx * sy + tz * cy, lat = tx * cy - tz * sy;      // kurban gövdeye göre: ileri / yan (model +X anatomik sol)
            ac.oF = clamp(fwd - V7_REACH[md], -.35, 1.3); ac.oL = clamp(lat * (md === 3 || md === 5 ? .35 : .6), -.6, .6);
            if (md === 7) { ac.oF = clamp(fwd - .35, -.2, .8); ac.jH = .32 + .1 * clamp((d[4] || 0) / 5, 0, 1); }
            ac.te = ac.tc + V7_DUR[md]; ac.tf = ac.tc + .12;
        }
        function v7Foul(a, ac, c, P) {
            var md = ac.mode, t0 = ac.t0, tc = ac.tc, te = ac.te, wo = v7Ramp(c, t0, tc) * (1 - v7Ramp(c, tc + .15, Math.min(te, tc + .55)));
            RT.L = ac.oL * wo; RT.F = ac.oF * wo; RT.hy = 1; RT.ya = ac.yaw; RT.yw = v7Ramp(c, t0, tc - .02) * (1 - v7Ramp(c, te - .25, te));
            if (md === 7) { var jt = (c - (tc - .3)) / .6; RT.Y = jt > 0 && jt < 1 ? ac.jH * Math.sin(Math.PI * jt) : 0; }
            if (!P) return;
            var pre = v7Ramp(c, t0, tc - .02), hit = v7Ramp(c, tc - .06, tc + .03), rec = v7Ramp(c, tc + .12, te - .05), on = pre * (1 - rec), sd = ac.side;
            var NA = sd > 0 ? kAR : kAL, NF = NA === kAR ? kFR : kFL, FA = NA === kAR ? kAL : kAR, FF = FA === kAL ? kFL : kFR, nz = NA === kAR ? 1 : -1;     // NA: kurbana yakın kol (sd > 0: kurban anatomik solda)
            var NL = sd > 0 ? kLR : kLL, NS = NL === kLR ? kSR : kSL, NFo = NL === kLR ? kfR : kfL, FL = NL === kLR ? kLL : kLR, FS = FL === kLL ? kSL : kSR, lz = NL === kLR ? 1 : -1;
            if (md === 1) {                                                  // tutma: yakın kol uzanıp formayı kavrar, sonra dirsek bükülerek çeker; gövde geriye yaslanır, ayaklar frenler
                var pull = v7Ramp(c, tc, tc + .35) * (1 - rec);
                PA(NA, -1.35 * on + .25 * pull, 0, nz * (.18 * on)); PA(NF, -.15 * on - 1.05 * pull, 0, 0);
                PA(FA, -.45 * on, 0, -nz * .35 * on); PA(FF, -.7 * on, 0, 0);
                PA(kTo, .25 * on - .32 * pull, sd * .35 * on, -sd * .1 * on); PA(kHe, .1 * on, sd * .3 * on, 0);
                PA(NL, -.35 * on - .25 * pull, null, null); PA(NS, .35 * on, 0, 0); PA(FL, .25 * pull, null, null); PA(FS, .3 * on + .3 * pull, 0, 0);
                PA(kHi, -.12 * pull, -legDrop(-.3 * on, .45 * on, 0), 0);
            } else if (md === 2) {                                           // itme: iki el göğüs hizasında bükük → temasta itiş (dirsek açılır), gövde öne, bir adım
                var ext = hit * (1 - rec);
                PA(kAL, -1.4 * on, 0, -.12 * on); PA(kAR, -1.4 * on, 0, .12 * on); PA(kFL, -1.35 * on * (1 - ext) - .12 * ext, 0, 0); PA(kFR, -1.35 * on * (1 - ext) - .12 * ext, 0, 0);
                PA(kTo, .12 * on + .3 * ext, null, null); PA(kHe, -.05, null, null);
                PA(NL, -.55 * on, null, null); PA(NS, .45 * on, 0, 0); PA(FL, .2 * on, null, null); PA(FS, .25 * on, 0, 0); PA(kHi, .05 * ext, -legDrop(-.55 * on, .45 * on, 0), 0);
            } else if (md === 3) {                                           // dirsek: yakın kol yana kalkar (dirsek bükük), temasta gövde kurbana döner, dirsek savrulur
                var sw = hit * (1 - rec);
                PA(NA, -1.25 * on, sd * .4 * sw, nz * (1.25 * on)); PA(NF, -1.95 * on, 0, 0);
                PA(FA, -.4 * on, 0, -nz * .45 * on); PA(FF, -.8 * on, 0, 0);
                PA(kTo, .1 * on, sd * (-.35 * on * (1 - sw) + .55 * sw), sd * .12 * sw); PA(kHe, -.05 * on, sd * .35 * on, 0);
            } else if (md === 4) {                                           // tekme: vuran bacak geri gerilir → kaval kemiği hizasında öne savrulur → takip; karşı kol öne
                var bk = v7Ramp(c, t0, tc - .12), sw4 = v7Ramp(c, tc - .14, tc + .02), fo = v7Ramp(c, tc + .02, tc + .25) * (1 - rec);
                var lx = (.55 * bk) * (1 - sw4) + (-1.0 * sw4) * (1 - rec * .9), kn = 1.35 * bk * (1 - sw4) + (.25 + .3 * fo) * sw4 * (1 - rec) + .1 * rec;
                PA(NL, lx, null, lz * .1 * on); PA(NS, kn, 0, 0); PA(NFo, .35 * sw4 * (1 - rec), 0, 0);
                PA(FL, -.15 * on, null, null); PA(FS, .4 * on, 0, 0); PA(kHi, -.06 * on, -legDrop(-.15 * on, .4 * on, 0), 0);
                PA(FA, -.9 * sw4 * (1 - rec), 0, -nz * .2); PA(NA, .45 * sw4 * (1 - rec), 0, nz * .45 * on); PA(kTo, .18 * on + .12 * fo, -sd * .25 * sw4 * (1 - rec), 0);
            } else if (md === 5) {                                           // çelme: yakın bacak alçakta öne-yana uzanır, ayak içi kurbanın bileğine kanca; destek dizi bükük, gövde öne, kollar dengede
                var ho = hit * (1 - rec);
                PA(NL, -.55 * on - .2 * ho, lz * .25 * on, lz * (.35 * on + .15 * ho)); PA(NS, .45 * on * (1 - ho) + .12 * ho, 0, 0); PA(NFo, -.25 * ho, 0, lz * .2 * ho);
                PA(FL, -.2 * on, null, null); PA(FS, .7 * on, 0, 0); PA(kHi, .05 * on, -legDrop(-.2 * on, .7 * on, 0), lz * .08 * on);
                PA(kTo, .35 * on, -sd * .15 * on, lz * .1 * on); PA(kHe, .25 * on, null, null);
                PA(NA, -.5 * on, 0, nz * .7 * on); PA(NF, -.5, 0, 0); PA(FA, .2 * on, 0, -nz * .35 * on); PA(FF, -.6, 0, 0);
            } else if (md === 6) {                                           // yüksek ayak: bacak dizi gergin göğüs hizasına kalkar (krampon önde), gövde geriye, kollar açık
                var up = v7Ramp(c, t0 + .05, tc) * (1 - rec);
                PA(NL, -1.75 * up, null, lz * .12 * up); PA(NS, .55 * (1 - up) * on + .08 * up, 0, 0); PA(NFo, -.35 * up, 0, 0);
                PA(FL, .12 * on, null, null); PA(FS, .3 * on, 0, 0); PA(kHi, -.1 * up, -legDrop(.12 * on, .3 * on, 0), 0);
                PA(kTo, -.38 * up, null, null); PA(kHe, .2 * up, null, null);
                PA(kAL, -.9 * on, 0, -.85 * on); PA(kAR, -.9 * on, 0, .85 * on); PA(kFL, -.4, 0, 0); PA(kFR, -.4, 0, 0);
            } else {                                                         // kafa çarpışması: sıçrama, baş öne, kollar yukarıda; temasta baş geri savrulur
                var air = v7Ramp(c, tc - .32, tc - .1) * (1 - v7Ramp(c, tc + .25, tc + .45)), rc = v7Ramp(c, tc, tc + .12) * (1 - rec);
                PA(kAL, -1.9 * air, 0, -.35 * air); PA(kAR, -1.9 * air, 0, .35 * air); PA(kFL, -1.1 * air, 0, 0); PA(kFR, -1.1 * air, 0, 0);
                PA(kTo, .25 * air - .35 * rc, null, null); PA(kHe, .25 * air - .55 * rc, null, null);
                PA(kLL, -.4 * air, null, null); PA(kLR, -.15 * air, null, null); PA(kSL, .9 * air, 0, 0); PA(kSR, .6 * air, 0, 0);
            }
        }
        /* düşme çeşitleri (temel düşüşün üstüne): öncesinde tepki, yerde acı, yuvarlanma */
        function v7FallOver(a, ac, c, P) {
            var vr = ac.vr | 0; if (!vr) return;
            var pre = c < ac.tf ? 1 : 0, u = rmp(c, ac.t0, ac.tf), lie = sm(rmp(c, ac.tf - .05, ac.tf + .25)), up = sm(rmp(c, ac.tli, ac.tli + .3)), lieW = lie * (1 - up);
            if (vr === 4 && ac.type === 1) {                                  // yuvarlanma: yüzüstü değince yana döner, sırtüstü kalır (kalkış öncesi yeniden yan)
                var rl = sm(rmp(c, ac.tf, ac.tf + .55)) * (1 - sm(rmp(c, ac.tli - .35, ac.tli)));
                if (rl > .001) { RT.Y += .12 * Math.sin(Math.PI * Math.min(1, rl * 2)) * (1 - up); }
                if (!P) return;
                var W0 = PW_; PW_ = W0 * rl * (1 - up);
                PA(kHi, -1.0, null, ac.sg * .35); PA(kTo, .25, 0, 0); PA(kHe, .35, 0, 0);
                PA(kAL, -.4, 0, -.9); PA(kAR, -.4, 0, .9); PA(kFL, -.6, 0, 0); PA(kFR, -.6, 0, 0);
                PA(kLL, -.9, null, null); PA(kSL, 1.6, 0, 0); PA(kLR, -.3, null, null); PA(kSR, .4, 0, 0);
                PW_ = W0; return;
            }
            if (!P) return;
            var W1 = PW_, rk = Math.sin((c - ac.tf) * 3.1);
            if (vr === 1 && pre) {                                           // sekerek: vurulan bacak yukarı çekilir (diz bükük), kollar savrulur
                var h = sm(u / .35); PW_ = W1 * h;
                PA(kLL, -.6, null, null); PA(kSL, 1.5, 0, 0); PA(kAL, -.8, 0, -.9); PA(kAR, -.6, 0, .9); PA(kFL, -.3, 0, 0); PA(kFR, -.3, 0, 0);
            }
            if (vr === 5 && pre) {                                           // çekilme: gövde geriye, baş geride, kollar öne savrulur
                var h5 = sm(u / .3); PW_ = W1 * h5;
                PA(kTo, -.35, null, null); PA(kHe, -.35, null, null); PA(kAL, -1.6, 0, -.45); PA(kAR, -1.2, 0, .6); PA(kFL, -.2, 0, 0); PA(kFR, -.3, 0, 0);
            }
            if ((vr === 2 || vr === 6) && (pre || lieW > .01)) {           // yüz / baş tutma: iki el yüze (düşerken ve yerde)
                var h2 = pre ? sm(u / .25) : lieW; PW_ = W1 * h2;
                var hx = vr === 6 ? -2.55 : -2.15, fx = vr === 6 ? -1.75 : -2.3;
                PA(kAL, hx, 0, .38); PA(kAR, hx, 0, -.38); PA(kFL, fx, 0, 0); PA(kFR, fx, 0, 0); PA(kHe, .3 + .08 * rk * lieW, .15 * rk * lieW, 0);
                if (lieW > .01) { PA(kLL, -1.1, null, null); PA(kSL, 1.7, 0, 0); PA(kLR, -.5, null, null); PA(kSR, .9, 0, 0); }
            }
            if ((vr === 3 || vr === 1) && lieW > .01) {                      // bacak tutma (tekmede sekmeden sonra da): sırtüstü/yan, bir diz karına çekili, iki el kaval kemiğinde, sağa sola sallanır
                PW_ = W1 * lieW;
                PA(kHi, null, null, (ac.type === 2 ? -ac.sg * 1.2 : 0) + .22 * rk);
                PA(kLL, -1.35, null, null); PA(kSL, 2.05, 0, 0); PA(kfL, .35, 0, 0); PA(kLR, -.25 + .1 * rk, null, null); PA(kSR, .5, 0, 0);
                PA(kAL, -1.05, 0, .25); PA(kAR, -1.05, 0, -.25); PA(kFL, -.75, 0, 0); PA(kFR, -.75, 0, 0); PA(kTo, .55, null, null); PA(kHe, .45, .2 * rk, 0);
            }
            PW_ = W1;
        }
        /* jestler (20 aksiyonu ve aktör değiştiricileri ortak): w ağırlık, c yerel saat (sn), h el (1 sağ / -1 sol) */
        function v7Gest(md, c, w, h, a) {
            if (w < .002) return; var W0 = PW_; PW_ = W0 * w;
            var RA = h < 0 ? kAR : kAL, RF = RA === kAL ? kFL : kFR, OA = RA === kAL ? kAR : kAL, OF = OA === kAL ? kFL : kFR, rz = RA === kAL ? -1 : 1, os = Math.sin(c * 7.5), sl = Math.sin(c * 2.2);
            switch (md) {
                case 1: PA(kAL, -2.55, .25, .5); PA(kAR, -2.55, -.25, -.5); PA(kFL, -2.25, 0, 0); PA(kFR, -2.25, 0, 0); PA(kHe, -.28 + .06 * sl, .12 * sl, 0); PA(kTo, -.06, null, null); break;
                case 2: PA(kTo, .85, null, null); PA(kHe, -.25, null, null); PA(kAL, -.75, 0, -.15); PA(kAR, -.75, 0, .15); PA(kFL, -.25, 0, 0); PA(kFR, -.25, 0, 0);
                    PA(kLL, -.45, null, -.06); PA(kLR, -.45, null, .06); PA(kSL, .7, 0, 0); PA(kSR, .7, 0, 0); PA(kHi, .1, -legDrop(-.45, .7, 0), 0); break;
                case 3: PA(kLL, .08, null, -.12); PA(kLR, .08, null, .12); PA(kSL, 1.62, 0, 0); PA(kSR, 1.62, 0, 0); PA(kfL, .7, 0, 0); PA(kfR, .7, 0, 0);
                    PA(kTo, .3, null, null); PA(kHe, .45, null, null); PA(kAL, -.2, 0, -.1); PA(kAR, -.2, 0, .1); PA(kFL, -.4, 0, 0); PA(kFR, -.4, 0, 0); break;
                case 4: PA(kAL, -.75 - .25 * os, 0, -.85); PA(kAR, -.75 + .25 * os, 0, .85); PA(kFL, -.55, 0, 0); PA(kFR, -.55, 0, 0); PA(kTo, .12, null, null); PA(kHe, -.15, null, null); break;
                case 5: var cl = Math.max(0, Math.sin(c * 12)); PA(kAL, -1.15, 0, .15 - .3 * cl); PA(kAR, -1.15, 0, -.15 + .3 * cl); PA(kFL, -1.25, 0, 0); PA(kFR, -1.25, 0, 0); break;
                case 6: PA(RA, -2.95, 0, rz * .1); PA(RF, -.1, 0, 0); PA(kHe, -.15, null, null); break;
                case 7: PA(RA, -1.0, 0, -rz * .05); PA(RF, -.45 + .12 * os, 0, 0); PA(kTo, .12, null, null); PA(kHe, .12, null, null); break;
                case 8: PA(kAL, -1.45, 0, .45); PA(kAR, -1.45, 0, -.45); PA(kFL, -1.2, 0, 0); PA(kFR, -1.2, 0, 0); PA(kTo, .2, null, null); PA(kHe, .15, .3 * sl, 0); break;
                case 9: PA(kAL, -.35, 0, .32); PA(kAR, -.35, 0, -.32); PA(kFL, -1.05, 0, 0); PA(kFR, -1.05, 0, 0); PA(kTo, .08, null, null); PA(kHe, .05, null, null); break;
                case 10: PA(kAL, -1.25 - .15 * os, 0, .15); PA(kAR, -1.1 + .15 * os, 0, -.1); PA(kFL, -1.1, 0, 0); PA(kFR, -1.3, 0, 0); PA(kTo, .3, .15 * sl, null);
                    PA(kLL, -.3, null, -.08); PA(kLR, -.1, null, .08); PA(kSL, .55, 0, 0); PA(kSR, .45, 0, 0); PA(kHi, null, -legDrop(-.3, .55, 0), 0); break;
                case 11: PA(RA, -1.55 + .25 * Math.sin(c * 4), 0, rz * (.95 + .2 * Math.sin(c * 4))); PA(RF, -.1, 0, 0); PA(kHe, -.05, -rz * .45, 0); PA(kTo, null, -rz * .2, null); break;
                case 12: var pm = Math.max(0, Math.sin(c * 6)); PA(RA, -2.4 - .45 * pm, 0, rz * .25); PA(RF, -1.6 + 1.3 * pm, 0, 0); PA(OA, -.5, 0, -rz * .35); PA(OF, -1.3, 0, 0); PA(kHe, -.3, null, null); break;
                case 13: PA(kAL, 0, 0, -1.6); PA(kAR, 0, 0, 1.6); PA(kFL, -.1, 0, 0); PA(kFR, -.1, 0, 0); PA(kHi, null, null, .22 * sl); PA(kTo, null, null, .1 * sl); PA(kHe, -.15, null, null); break;
                case 14: PA(kLL, .12, null, -.15); PA(kLR, .12, null, .15); PA(kSL, 1.62, 0, 0); PA(kSR, 1.62, 0, 0); PA(kfL, .7, 0, 0); PA(kfR, .7, 0, 0);
                    PA(kTo, -.45, null, null); PA(kHe, -.45, null, null); PA(kAL, -2.6, 0, -.75); PA(kAR, -2.6, 0, .75); PA(kFL, -.15, 0, 0); PA(kFR, -.15, 0, 0); break;
                case 15: var jp = Math.max(0, Math.sin(c * 5.2)); PA(RA, -2.7 - .2 * jp, 0, rz * .2); PA(RF, -.4 - .5 * (1 - jp), 0, 0); PA(OA, -.6, 0, -rz * .5); PA(OF, -1.2, 0, 0);
                    PA(kLL, -.35 * (1 - jp), null, null); PA(kSL, .9 * (1 - jp), 0, 0); PA(kLR, -.1 * (1 - jp), null, null); PA(kSR, .5 * (1 - jp), 0, 0); PA(kHe, -.35, null, null); break;
                case 16: PA(kTo, .65, null, null); PA(kHe, .5, null, null); PA(RA, -.95, 0, -rz * .1); PA(RF, -.15, 0, 0); PA(OA, .1, 0, -rz * .25); PA(OF, -.6, 0, 0);
                    PA(kLL, -.4, null, null); PA(kLR, -.15, null, null); PA(kSL, .55, 0, 0); PA(kSR, .4, 0, 0); PA(kHi, null, -legDrop(-.4, .55, 0), 0); break;
                case 17: PA(kAL, 1.175, .748, -1.05); PA(kAR, 1.175, -.748, 1.05); PA(kFL, -1.62, 0, 0); PA(kFR, -1.62, 0, 0); PA(kHe, .25 + .05 * sl, .2 * sl, 0); break;
                case 18: PA(kAL, -1.75, .2, .55); PA(kAR, -1.75, -.2, -.55); PA(kFL, -2.35, 0, 0); PA(kFR, -2.35, 0, 0); PA(kHe, .4, null, null); PA(kTo, .2, null, null); break;
                case 19: var c19 = Math.max(0, Math.sin(c * 11)); PA(kAL, -2.5, 0, .2 - .25 * c19); PA(kAR, -2.5, 0, -.2 + .25 * c19); PA(kFL, -1.0, 0, 0); PA(kFR, -1.0, 0, 0); PA(kHe, -.2, null, null); break;
                case 20: if (!(a && mxApply('goalkeeper directing', 1.2 + (c % 5.2), 0, null, 1))) { PA(kAL, -1.5, 0, -.9 - .25 * os); PA(kFL, -.1, 0, 0); PA(kHe, -.1, null, null); } break;
                case 21: PA(kAL, -.75, 0, -.25); PA(kFL, -2.0, 0, 0); break;      // düdük (el ağızda)
                case 22: PA(kAL, -2.72, 0, .22); PA(kAR, -2.72, 0, -.22); PA(kFL, -.55, 0, 0); PA(kFR, -.55, 0, 0); PA(kHe, -.08, null, null); break;      // dördüncü hakem: tabela baş üstünde
                case 23: var u23 = clamp(c / .7, 0, 1), sw23 = u23 < .45 ? -.35 + .75 * sm(u23 / .45) : .4 - 2.3 * sm((u23 - .45) / .55);      // top görevlisi: iki elle alttan atış (geri savurma → öne yukarı)
                    PA(kAL, sw23, 0, .25); PA(kAR, sw23, 0, -.25); PA(kFL, -.35, 0, 0); PA(kFR, -.35, 0, 0); PA(kTo, .35 * (1 - u23) + .05, null, null); PA(kLL, -.25, null, null); PA(kSL, .45 * (1 - u23), 0, 0); PA(kSR, .4 * (1 - u23), 0, 0); break;
                case 24: var u24 = clamp(c / .8, 0, 1), b24 = Math.sin(Math.PI * u24);      // top görevlisi: eğilip yerdeki topu alma
                    PA(kTo, 1.05 * b24, null, null); PA(kHe, .3 * b24, null, null); PA(kAL, -1.35 * b24, 0, .2); PA(kAR, -1.35 * b24, 0, -.2); PA(kFL, -.2, 0, 0); PA(kFR, -.2, 0, 0);
                    PA(kLL, -.55 * b24, null, null); PA(kLR, -.45 * b24, null, null); PA(kSL, .9 * b24, 0, 0); PA(kSR, .8 * b24, 0, 0); PA(kHi, -.15 * b24, -legDrop(-.55 * b24, .9 * b24, 0), 0); break;
            }
            PW_ = W0;
        }
        function v7GestInit(a, ac, x, z) {
            var d = ac.d, tx = d[0] - x, tz = d[1] - z; ac.mode = d[2] | 0; ac.win = .2; ac.hand = d[5] < 0 ? -1 : 1;
            ac.yaw = tx * tx + tz * tz > .25 && (d[0] || d[1]) ? Math.atan2(tx, tz) : a.yaw; ac.te = ac.t0 + clamp(d[3] || 2, .4, 12);
            ac.sF = ac.mode === 14 ? clamp(d[4] || 4, 1.5, 7) : 0;
        }
        function v7GestK(a, ac, c, P) {
            var e = v7Ramp(c, ac.t0, ac.t0 + (ac.mode === 14 ? .12 : .3)) * (1 - v7Ramp(c, ac.te - .35, ac.te)), md = ac.mode;
            RT.hy = 1; RT.ya = ac.yaw; RT.yw = (ac.d[0] || ac.d[1]) && md !== 13 && md !== 15 ? e * clamp(1 - ((a.spd || 0) - 2.5) / 2.5, 0, 1) : 0;
            if (md === 14) {                                                 // diz kayması: koşudan dizlerin üstüne düşer, yavaşlayarak kayar
                var u = c - ac.t0, T = Math.max(.4, ac.sF / 3.2); RT.lk = 1; RT.gait = 1; RT.yw = e;
                RT.F = ac.sF * (1 - Math.pow(1 - Math.min(1, u / T), 2)); RT.Y = -.5 * sm(rmp(c, ac.t0, ac.t0 + .18)) * (1 - v7Ramp(c, ac.te - .4, ac.te));
            }
            if (md === 3) RT.Y = -.42 * e;
            if (md === 15) { var jp = Math.max(0, Math.sin((c - ac.t0) * 5.2)); RT.Y = .28 * jp * e; }
            if (!P) return;
            v7Gest(md, c - ac.t0, e, ac.hand, a);
        }
        /* hakem işaretleri ve aktör jestleri (değiştirici): mods.ref = 'adv' | 'fk' | 'pen' | 'corner' | 'gk' | 'whistle', mods.g jest, mods.hold topu elde tutar */
        function v7Mods(a, t, mods) {
            var r = mods.ref, k;
            if (r === 'adv') { var sw = Math.sin(t * 3.2); P('ArmL', -1.45, 0, -.25 - .35 * sw); P('ArmR', -1.45, 0, .25 + .35 * sw); P('ForeL', -.1, 0, 0); P('ForeR', -.1, 0, 0); }
            else if (r === 'fk' || r === 'corner') { P('ArmL', r === 'corner' ? -2.25 : -1.95, 0, -.12); P('ForeL', -.05, 0, 0); P('Head', -.08, null, null); }
            else if (r === 'pen' || r === 'gk') { P('ArmL', -.95, 0, -.05); P('ForeL', -.05, 0, 0); P('Torso', .08, null, null); }
            else if (r === 'whistle') { P('ArmL', -.75, 0, -.25); P('ForeL', -2.0, 0, 0); }
            if (mods.g) v7Gest(mods.g, mods.gt || 0, 1, mods.gh || 1, a);
            if (mods.hold) { k = PW_; PW_ = 1; PA(kAL, -.9, 0, .32); PA(kAR, -.9, 0, -.32); PA(kFL, -1.15, 0, 0); PA(kFR, -1.15, 0, 0); PW_ = k; }
        }
        var poseFor0_ = poseFor; poseFor = function (a, sp, t, mods) { poseFor0_(a, sp, t, mods); if (V7_ON && mods && (mods.g || mods.hold || (mods.ref && V7_REF[mods.ref]))) { try { v7Mods(a, t, mods); } catch (e) { } } };
        var oaInit0_ = oaInit; oaInit = function (a, ac, x, z) {
            if (ac.k === 19) { v7FoulInit(a, ac, x, z); return; }
            if (ac.k === 20) { v7GestInit(a, ac, x, z); return; }
            oaInit0_(a, ac, x, z);
            if (ac.k === 14) { ac.vr = ac.d[5] | 0; if (ac.vr === 4 && ac.type === 1) { ac.tli = Math.max(ac.tli, ac.tf + .9); ac.tu = ac.tli + .85; ac.te = ac.tu + .05; } if (ac.vr === 1) { ac.tf += .2; ac.tli += .2; ac.tu += .2; ac.te += .2; } }
        };
        var gkK1_ = gkK; gkK = function (a, ac, c, P) {
            if (ac.k === 19 || ac.k === 20) { RT.L = 0; RT.F = 0; RT.Y = 0; RT.lk = 0; RT.yw = 1; RT.hy = 0; RT.gait = 0; if (ac.k === 19) v7Foul(a, ac, c, P); else v7GestK(a, ac, c, P); return; }
            gkK1_(a, ac, c, P);
            if (ac.k === 14 && ac.vr) v7FallOver(a, ac, c, P);
        };
        /* [v187] ek aktörler: top görevlileri (turuncu yelek) ve oyuncu değişikliğinde giren / çıkan oyuncu. Konum, yön ve jest arayüzden (st.xa):
           { k: 0 top görevlisi | 1 giren (yuvanın yeni görünümü) | 2 çıkan (değişiklik anındaki görünüm), id: yuva, x, z, fx, fz, g: jest, gt: jest saati, gh: el, hold: topu elde tutar } */
        var V7X = { n: 0, A: [], M: [], ball: new Float32Array(24), nb: 0 };
        function v7Pal() {
            var sg = v7PalSig(); if (S.bbPal && S.bbSig === sg) return S.bbPal; var pv = new Float32Array(SLOT_N * 3), bc = v7BibColor(); S.bbSig = sg;
            [bc, [.06, .06, .08], [.06, .06, .08], SKIN[2], HAIR[0], [.08, .08, .09], SKIN[2], [.98, .98, .98], [.07, .07, .08], mixc(bc, [0, 0, 0], .3), [.2, .11, .05], mixc(SKIN[2], [.62, .28, .27], .3)].forEach(function (c, k) { pv[k * 3] = c[0]; pv[k * 3 + 1] = c[1]; pv[k * 3 + 2] = c[2]; });
            return (S.bbPal = pv);
        }
        /* top görevlisi yeleği: iki takımın (kaleciler dahil) ve hakemin forma renginden en uzak aday renk (çim yeşili aday değil) */
        var V7_BIB = [[.12, .6, .95], [1, .45, .05], [.78, .95, .1], [.92, .15, .62], [.5, .22, .85], [.05, .85, .85], [.98, .98, .98]];
        function v7PalSig() { var P = S.pal, s = '', i; if (!P) return ''; for (i = 0; i < P.length; i++) if (P[i]) s += (P[i][0] * 9 | 0) + '' + (P[i][1] * 9 | 0) + (P[i][2] * 9 | 0); if (S.refPal) s += 'r' + (S.refPal[0] * 9 | 0) + (S.refPal[1] * 9 | 0) + (S.refPal[2] * 9 | 0); return s; }
        function v7ColD(a, b) { var rm = (a[0] + b[0]) * .5, dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2]; return Math.sqrt((2 + rm) * dr * dr + 4 * dg * dg + (3 - rm) * db * db); }
        function v7BibColor() {
            var P = S.pal || [], K = [], i, j; for (i = 0; i < P.length; i++) if (P[i]) K.push([P[i][0], P[i][1], P[i][2]]); if (S.refPal) K.push([S.refPal[0], S.refPal[1], S.refPal[2]]);
            var best = V7_BIB[0], bd = -1; for (j = 0; j < V7_BIB.length; j++) { var c = V7_BIB[j], m = 9; for (i = 0; i < K.length; i++) m = Math.min(m, v7ColD(c, K[i])); if (m > bd + .05) { bd = m; best = c; } }
            S.bbBib = { c: best, d: bd }; return best;
        }
        function v7KitInfo(j) {      // 1: top görevlisi yeleği · 2: çıkan oyuncunun değişiklik anındaki forması/yüzü
            var so = j === 2 ? S.v7so : null, pv = so ? so.pal : v7Pal(), c1 = [pv[0], pv[1], pv[2]], skinC = [pv[9], pv[10], pv[11]], hairC = [pv[12], pv[13], pv[14]];
            var ink = lum(c1) < .45 ? [.97, .97, .97] : [.07, .07, .09];
            return { c1: c1, c2: so ? [pv[21], pv[22], pv[23]] : mixc(c1, [0, 0, 0], .25), trim: [pv[21], pv[22], pv[23]], pat: so ? so.pat : 0, ink: ink, inkO: lum(ink) > .5 ? mixc(c1, [0, 0, 0], .55) : mixc(c1, [1, 1, 1], .6),
                num: so ? so.num : 0, name: so ? so.name : '', crest: so ? so.crest : '',
                face: { hair: mixc(hairC, [0, 0, 0], .15), skin: skinC, lip: mixc(skinC, [.55, .22, .22], .45), beard: so ? so.beardT : 0, hairline: .18, seed: so ? so.seed : 77, hs: so ? so.hs : 1, nape: -.5 } };
        }
        R.subSnap = function (id) {      // [v187] değişiklikte çıkan oyuncunun görünümü (yuva yeni oyuncuya geçmeden önce)
            try {
                if (!S.pal || !S.pal[id] || !KIT.players || !KIT.players[id]) return false;
                var p = KIT.players[id], nums = shirtNumbers(KIT.players), names = KIT.names || [];
                S.v7so = { id: id, pal: new Float32Array(S.pal[id]), hs: S.hair ? S.hair[id] | 0 : 1, bd: S.beard ? S.beard[id] | 0 : 0, beardT: [0, .30, .62][S.beard ? S.beard[id] | 0 : 0],
                    num: nums[id], name: surnameOf(p.name), crest: (String(names[p.team ? 1 : 0] || '').trim().charAt(0).toLocaleUpperCase('tr-TR') || ''), seed: hash(p.name || ('p' + id)), pat: 0,
                    hw: S.hw && S.hw[id] ? { hScale: S.hw[id].hScale, wScale: S.hw[id].wScale } : { hScale: .98, wScale: .98 } };
                return true;
            } catch (e) { return false; }
        };
        function v7XUpdate(st, dt, ts, SHD) {
            var L = st.xa, n = L ? Math.min(8, L.length) : 0, j; V7X.n = n; V7X.nb = 0;
            for (j = 0; j < n; j++) {
                var q = L[j], aa = V7X.A[j], md = V7X.M[j];
                if (!aa) { aa = V7X.A[j] = mkAct(j, .9, .9, .3 + .1 * j); md = V7X.M[j] = { kick: 0, celeb: false, ref: null, g: 0, gt: 0, gh: 1, hold: 0 }; }
                aa.ok = 0; if (!q || !(q.x > -1e3)) { aa.px = NaN; continue; }
                var sc = q.k === 0 ? .9 : (q.k === 2 && S.v7so ? S.v7so.hw.hScale : (S.hw && S.hw[q.id] ? S.hw[q.id].hScale : .98)), wsc = q.k === 0 ? .88 : (q.k === 2 && S.v7so ? S.v7so.hw.wScale : (S.hw && S.hw[q.id] ? S.hw[q.id].wScale : .98));
                aa.hScale = sc; aa.wScale = wsc;
                if (!(aa.px > -1e9) || aa.xk !== q.k || aa.xid !== q.id) { aa.px = q.x; aa.pz = q.z; aa.yaw = Math.atan2(q.fx || 0, q.fz || 1); aa.spd = 0; aa.latV = 0; aa.lonV = 0; aa.xk = q.k; aa.xid = q.id; }
                var adx = q.x - aa.px, adz = q.z - aa.pz, ad = Math.sqrt(adx * adx + adz * adz), dts = Math.max(1e-4, dt * ts); if (ad > 5) { ad = 0; adx = 0; adz = 0; aa.px = q.x; aa.pz = q.z; }
                var cya = Math.cos(aa.yaw), sya = Math.sin(aa.yaw), ke = 1 - Math.exp(-dt / .15);
                aa.latV += (clamp((adx * cya - adz * sya) / dts, -9, 9) - aa.latV) * ke; aa.lonV += (clamp((adx * sya + adz * cya) / dts, -9.5, 9.5) - aa.lonV) * ke;
                aa.spd += (Math.max(0, Math.min(9, ad / dts)) - aa.spd) * ke; aa.ph += ad * gaitPhK(aa.spd, 0); aa.px = q.x; aa.pz = q.z;
                if (q.fx || q.fz) { var ay = Math.atan2(q.fx, q.fz), dr = ay - aa.yaw; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); aa.yaw += dr * (1 - Math.exp(-dt / .14)); }
                idleState(aa, false);
                md.g = q.g || 0; md.gt = q.gt || 0; md.gh = q.gh || 1; md.hold = q.hold ? 1 : 0; md.ref = null;
                aa.dX = q.x; aa.dZ = q.z; aa.dYaw = aa.yaw; aa.rY = 0; aa.needHand = !!q.hold;
                FRM[4] = sc; actPrep(aa, md.g || md.hold ? md : null, SHD);
                if (q.hold && aa.hR && V7X.nb < 8) { var o = V7X.nb * 3, sy2 = Math.sin(aa.yaw), cy2 = Math.cos(aa.yaw); V7X.ball[o] = (aa.hR[0] + aa.hL[0]) * .5 + sy2 * .1; V7X.ball[o + 1] = Math.max(.17, (aa.hR[1] + aa.hL[1]) * .5); V7X.ball[o + 2] = (aa.hR[2] + aa.hL[2]) * .5 + cy2 * .1; V7X.nb++; }
            }
        }
        function v7XPal(q) { return q.k === 0 ? v7Pal() : q.k === 2 && S.v7so ? S.v7so.pal : S.pal[q.id] || v7Pal(); }
        function v7XLayer(q) { return q.k === 0 ? KIT.refLayer + 1 : q.k === 2 && S.v7so ? KIT.refLayer + 2 : q.id; }
        function v7XHair(q) { return q.k === 0 ? 2 : q.k === 2 && S.v7so ? S.v7so.hs : S.hair ? S.hair[q.id] : 1; }
        function v7XBeard(q) { return q.k === 0 ? 0 : q.k === 2 && S.v7so ? S.v7so.bd : S.beard ? S.beard[q.id] : 0; }
        var V7_Q = [0, 0, 0, 1];
        /* [v187] ölçücü (D1 ışınlanma, D2 ayak kayması): kare başına çizilen kök konumu. D1: kesme dışında iki kare arası yer değiştirme ≤ v_max·dt·1,5
           (v_max 9,5 m/sn). D2: hareket eden oyuncuda (> 0,3 m/sn, aksiyonsuz) kök hızı / adım döngüsünü süren hız oranı 0,8–1,25; duran oyuncu yürüme oynatmaz. */
        var OLC7 = { on: 0, n: 0, tp: 0, tpS: [], mv: 0, ok: 0, lo: 0, hi: 0, idle: 0, idleW: 0, cut: 0, mvA: 0 };
        function olc7Frame(v, ddt) {
            if (!(ddt > 1e-4)) return; var i, a;
            for (i = 0; i < S.n; i++) {
                a = S.st[i]; if (!a.ok || v.x[i] < -20) { a.o7 = 0; continue; }
                var px = a.o7x, pz = a.o7z, had = a.o7; a.o7 = 1; a.o7x = a.dX; a.o7z = a.dZ; if (!had || a.cutN > 0 || OLC7.cut) continue;
                var d = Math.hypot(a.dX - px, a.dZ - pz), sp = d / ddt; OLC7.n++;
                if (d > 9.5 * ddt * 1.5 + .03) { OLC7.tp++; if (OLC7.tpS.length < 60) OLC7.tpS.push([i, +d.toFixed(2), +ddt.toFixed(3), +CLK.toFixed(2), a.ac ? a.ac.k : 0, a.acP ? a.acP.k : 0, +v.x[i].toFixed(2), +v.y[i].toFixed(2), +a.dX.toFixed(2), +a.dZ.toFixed(2), +(a.rOx || 0).toFixed(2), +(a.rOz || 0).toFixed(2), +(a.spX || 0).toFixed(2), +px.toFixed(2), +pz.toFixed(2)]); }
                if (a.acW > .05) { if (sp > .3) OLC7.mvA++; continue; }
                if (sp > .3) { OLC7.mv++; var rr = sp / Math.max(.05, a.spd); if (rr >= .8 && rr <= 1.25) OLC7.ok++; else if (rr < .8) OLC7.lo++; else OLC7.hi++; }
                else { OLC7.idle++; if (a.spd > .45) OLC7.idleW++; }
            }
            OLC7.cut = 0;
        }
        R.bbBib = function () { try { v7Pal(); } catch (e) { } return S.bbBib ? { c: S.bbBib.c.slice(), d: +S.bbBib.d.toFixed(3) } : null; };      // [v187] sınama: seçilen yelek rengi ve formalara en yakın uzaklık
        R.olc7 = function (on) { if (on === 'get') return JSON.parse(JSON.stringify(OLC7)); OLC7.on = on ? 1 : 0; OLC7.n = OLC7.tp = OLC7.mv = OLC7.ok = OLC7.lo = OLC7.hi = OLC7.idle = OLC7.idleW = OLC7.mvA = 0; OLC7.tpS = []; return true; };
        function drawActor(a, pal, x, z, yaw, sc, mods, t, hairStyle, layer, beard) {
            var root = stk[0]; mtrs(root, x, a.rY || 0, z, 0, yaw, 0, sc, a.wScale);   // sc: boy ölçeği (yerel Y) · a.wScale: yapı/genişlik ölçeği (yerel X/Z) - bkz mtrs · a.rY: [gk] kök yüksekliği (plonjon/sıçrama)
            poseFor(a, a.spd, t, mods);
            if (SKN) {
                var ws = a.wScale != null ? a.wScale : sc, L = SKN.lod[actorLod(x, z, sc)];
                bodyDQ(pose, SKN.dq); gl.uniform4fv(SKN.p.u.uDQ, SKN.dq); gl.uniformMatrix4fv(SKN.p.u.uM, false, root);
                if (a.needHand) { if (!a.hR) { a.hR = new Float32Array(3); a.hL = new Float32Array(3); } handsModel(SKN.dq); xform(root, gkQ, a.hR); xform(root, gkQ2, a.hL); }   // [gk] avuç noktaları (top elde)
                if (VQ.sh) {                                                        // [vq] temas gölgesi için göğüs + ayak ortası (dünya; bir sonraki karede kullanılır)
                    if (!a.cP) a.cP = new Float32Array(6);
                    dqsPt(SKN.dq, BB.Torso, 0, 1.30, .02, CP_T); xform(root, CP_T, CP_W); a.cP[0] = CP_W[0]; a.cP[1] = CP_W[1]; a.cP[2] = CP_W[2];
                    dqsPt(SKN.dq, BB.FootL, FB_L[0], FB_L[1], FB_L[2] + .05, CP_T); xform(root, CP_T, CP_W); a.cP[3] = CP_W[0]; a.cP[4] = CP_W[1]; a.cP[5] = CP_W[2];
                    dqsPt(SKN.dq, BB.FootR, FB_R[0], FB_R[1], FB_R[2] + .05, CP_T); xform(root, CP_T, CP_W); a.cP[3] = (a.cP[3] + CP_W[0]) * .5; a.cP[4] = (a.cP[4] + CP_W[1]) * .5; a.cP[5] = (a.cP[5] + CP_W[2]) * .5;
                }
                gl.uniform3f(SKN.p.u.uNS, 1 / (ws * ws), 1 / (sc * sc), 1 / (ws * ws)); gl.uniform3fv(SKN.p.u.uPal, pal); gl.uniform1f(SKN.p.u.uLayer, layer == null ? 0 : layer);
                gl.uniform4fv(SKN.p.u.uHK, propKA(a, sc, ws)); gl.uniform3fv(SKN.p.u.uHB, BODY_BIND[BB.Head]);
                gl.bindVertexArray(L.vao); gl.drawElements(gl.TRIANGLES, L.body, L.it, 0);
                var hr = L.hair[hairStyle == null ? 1 : hairStyle]; if (hr && hr[1]) gl.drawElements(gl.TRIANGLES, hr[1], L.it, hr[0] * L.ib);
                if (beard === 2 && L.beard && L.beard[1]) gl.drawElements(gl.TRIANGLES, L.beard[1], L.it, L.beard[0] * L.ib);
                STAT.draws++;
                if (a === S.ref) {                                                  // hakem kartı GERÇEK sağ el konumunda tutulsun (iskeletten; anatomik sağ = 'ForeL')
                    var hb = BODY_BIND[BB.ForeL], hp = dqsPoint(SKN.dq, BB.ForeL, BB.ForeL, 0, [hb[0], hb[1] - .30, hb[2]]);
                    S.refHand = [root[0] * hp[0] + root[4] * hp[1] + root[8] * hp[2] + root[12], root[1] * hp[0] + root[5] * hp[1] + root[9] * hp[2] + root[13], root[2] * hp[0] + root[6] * hp[1] + root[10] * hp[2] + root[14]];
                }
                return;
            }
            gl.uniform3fv(pPl.u.uPal, pal.length > 24 ? pal.subarray(0, 24) : pal);
            drawNode(player.root, root, 1);
        }
        /* boy/kilo oranı düzeltmesi katsayıları (bkz SK_PROP): nihai kafa yatay ölçeği (boy·yapı)^0.3, dikey boy^0.3; ayak uzunluğu yalnızca
           boyla, genişliği yapıyla ^0.4 büyür - kafası ya da ayağı vücuduyla aynı oranda büyüyen "şişirilmiş" görünüm olmaz */
        function propK(hs, ws) { var wm = ws / hs; return [Math.pow(ws, -.7), Math.pow(hs, -.7), Math.pow(wm, -.6), 1 / wm]; }
        function propKA(a, hs, ws) { if (!a.pkv || a.pkh !== hs || a.pkw !== ws) { var wm = ws / hs; a.pkv = a.pkv || new Float32Array(4); a.pkv[0] = Math.pow(ws, -.7); a.pkv[1] = Math.pow(hs, -.7); a.pkv[2] = Math.pow(wm, -.6); a.pkv[3] = 1 / wm; a.pkh = hs; a.pkw = ws; } return a.pkv; }   // [oa] aktör başına önbellek
        function propBind(lp, hs, ws) { var k = propK(hs, ws), hb = BODY_BIND[BB.Head]; return [hb[0] + (lp[0] - hb[0]) * k[0], hb[1] + (lp[1] - hb[1]) * k[1], hb[2] + (lp[2] - hb[2]) * k[0]]; }
        /* ayrıntı düzeyi: ekrandaki tahmini oyuncu boyu (piksel) büyükse yakın-çekim (0), değilse yayın (1) ağı */
        function actorLod(x, z, sc) {
            var ex = eye[0] - x, ey = eye[1] - .9, ez = eye[2] - z, d = Math.sqrt(ex * ex + ey * ey + ez * ez), px = 1.85 * sc * cv.height / (2 * Math.tan(curFov / 2) * Math.max(.5, d));
            if (px < 42 || (Q.name === 'low' && !(VQ.ui && px > 120))) return 2;      // [vq] Düşük kalitede yakın plandaki (> 120 px) oyuncu yayın ağı (LOD1)                       // Düşük kalitede ya da çok uzaktaki (ekranda < 42 px) oyuncuda en hafif ağ
            return px > Q.lodPx && SKN.lod[0] ? 0 : 1;
        }
        /* gölge (derinlik) geçişi için aynı deri bağlama - her zaman yayın ağı (1): gölge çözünürlüğünde fark görünmez */
        function drawActorDepth(a, x, z, yaw, sc, ws, mods, t, hairStyle, beard) {
            var root = stk[0]; mtrs(root, x, a.rY || 0, z, 0, yaw, 0, sc, ws); poseFor(a, a.spd, t, mods);
            if (SKN && SKN.pd) {
                var L = SKN.lod[Q.name === 'low' ? 2 : 1]; bodyDQ(pose, SKN.dq); gl.uniform4fv(SKN.pd.u.uDQ, SKN.dq);
                gl.uniform4fv(SKN.pd.u.uHK, propKA(a, sc, ws)); gl.uniform3fv(SKN.pd.u.uHB, BODY_BIND[BB.Head]);
                gl.bindVertexArray(L.vao); var hr = L.hair[hairStyle == null ? 1 : hairStyle], mN = SHN > 1 ? shClip(LVPN, x, z) : 9;
                for (var cs = 0; cs < SHN; cs++) {                              // [vq] cs 0: yakın kademe (atlas solu), 1: uzak (sağ); tek kademede yalnız LVP
                    var near = SHN > 1 && cs === 0, CM = near ? LVPN : LVP;
                    if (SHN > 1) { if (near ? mN > 1 + 3 / SHWN : (mN < .6 || shClip(LVP, x, z) > 1 + 3 / Math.max(SHW.w, SHW.h))) continue; gl.viewport(near ? 0 : SHADOW_SIZE, 0, SHADOW_SIZE, SHADOW_SIZE); }
                    mmul(mvpTmp, CM, root); gl.uniformMatrix4fv(SKN.pd.u.uMVP, false, mvpTmp);
                    gl.drawElements(gl.TRIANGLES, L.body, L.it, 0);
                    if (hr && hr[1]) gl.drawElements(gl.TRIANGLES, hr[1], L.it, hr[0] * L.ib);
                    if (beard === 2 && L.beard && L.beard[1]) gl.drawElements(gl.TRIANGLES, L.beard[1], L.it, L.beard[0] * L.ib);
                }
                return;
            }
            for (var cs2 = 0; cs2 < SHN; cs2++) { if (SHN > 1) gl.viewport(cs2 ? SHADOW_SIZE : 0, 0, SHADOW_SIZE, SHADOW_SIZE); LVPC = SHN > 1 && !cs2 ? LVPN : LVP; drawNodeDepth(player.root, root, 1); }
            LVPC = LVP;
        }

        /* [opt] aktör çizim önbelleği: kök matrisi (a.rM) ve deri DQ'su (a.dqc) karede bir kez hesaplanır; gölge ve ana geçiş aynı veriyi
           kullanır. Görünürlük: ana kamera konisi (bel hizasında, plonjon/kayma/yatış dahil tüm pozları kapsayan 2.1 m küre) ve gölge
           kademeleri (ışık kırpma uzayında bel noktası + 1.5 m pay). Hiçbirinde olmayan aktörün pozu/DQ'su hesaplanmaz (avuç noktası
           gereken kaleci hariç); temas gölgesi noktası bayatlatılır (yerde yatma gölgesi çizilmez). Kare başına tahsis yok. */
        var FRU = new Float64Array(24), VAO_CUR = null, SHV = -1;
        function frustumSet() {
            var m = VP, k, o, l;
            for (k = 0; k < 6; k++) {
                var r = k >> 1, sg = k & 1 ? -1 : 1; o = k * 4;
                FRU[o] = m[3] + sg * m[r]; FRU[o + 1] = m[7] + sg * m[4 + r]; FRU[o + 2] = m[11] + sg * m[8 + r]; FRU[o + 3] = m[15] + sg * m[12 + r];
                l = Math.sqrt(FRU[o] * FRU[o] + FRU[o + 1] * FRU[o + 1] + FRU[o + 2] * FRU[o + 2]) || 1; FRU[o] /= l; FRU[o + 1] /= l; FRU[o + 2] /= l; FRU[o + 3] /= l;
            }
        }
        function sphereIn(x, y, z, rad) { for (var k = 0; k < 24; k += 4) if (FRU[k] * x + FRU[k + 1] * y + FRU[k + 2] * z + FRU[k + 3] < -rad) return false; return true; }
        function actPrep(a, mods, shd) {
            var sc = FRM[4], t = FRM[3], ws = a.wScale != null ? a.wScale : sc, x = a.dX, z = a.dZ, ry = a.rY || 0, k, vy = ry + .9 * sc, vr = 2.1 * (sc > ws ? sc : ws);     // [opt] boy/saat FRM
            a.ok = 1; a.dS = sc; a.dW = ws; a.mK = mods ? mods.kick || 0 : 0; a.mC = mods && mods.celeb ? 1 : 0;
            a.vM = 1; for (k = 0; k < 24; k += 4) if (FRU[k] * x + FRU[k + 1] * vy + FRU[k + 2] * z + FRU[k + 3] < -vr) { a.vM = 0; break; }     // [opt] sphereIn satır içi
            a.sN = 0; a.sF = 0;
            if (shd) {
                if (!VQ.sh) a.sF = 1;
                else if (SHN > 1) {                                         // [opt] shClip satır içi (yakın / uzak kademe)
                    var c1x = LVPN[0] * x + LVPN[4] + LVPN[8] * z + LVPN[12], c1y = LVPN[1] * x + LVPN[5] + LVPN[9] * z + LVPN[13], mN = Math.max(Math.abs(c1x), Math.abs(c1y)); a.sN = mN <= 1 + 3 / SHWN ? 1 : 0;
                    var c2x = LVP[0] * x + LVP[4] + LVP[8] * z + LVP[12], c2y = LVP[1] * x + LVP[5] + LVP[9] * z + LVP[13]; a.sF = mN >= .6 && Math.max(Math.abs(c2x), Math.abs(c2y)) <= 1 + 3 / Math.max(SHW.w, SHW.h) ? 1 : 0;
                }
                else { var c3x = LVP[0] * x + LVP[4] + LVP[8] * z + LVP[12], c3y = LVP[1] * x + LVP[5] + LVP[9] * z + LVP[13]; a.sF = Math.max(Math.abs(c3x), Math.abs(c3y)) <= 1 + 3 / Math.max(SHW.w, SHW.h) ? 1 : 0; }
            }
            a.vS = a.sN || a.sF ? 1 : 0;
            if (!SKN) return;                                                // rijit yedek model: eski yol (çizimde poz yeniden hesaplanır)
            if (!a.vM && !a.vS && !a.needHand) { if (a.cP) a.cP[1] = 9; return; }
            if (!a.rM) { a.rM = new Float32Array(16); a.dqc = new Float32Array(BODY_BONES.length * 8); }
            var root = a.rM, cyw = Math.cos(a.dYaw), syw = Math.sin(a.dYaw);      // [opt] kök matrisi satır içi: mtrs(root, x, ry, z, 0, yaw, 0, sc, ws) ile aynı
            root[0] = cyw * ws; root[1] = 0; root[2] = -syw * ws; root[3] = 0; root[4] = 0; root[5] = sc; root[6] = 0; root[7] = 0; root[8] = syw * ws; root[9] = 0; root[10] = cyw * ws; root[11] = 0; root[12] = x; root[13] = ry; root[14] = z; root[15] = 1;
            a.gaRT = -1; poseFor(a, a.spd, t, mods); if (a.gaRT === t && (a.gaRX || a.gaRZ)) { root[12] += a.gaRX; root[14] += a.gaRZ; } if (FK_ON) footIK(a, root); if (NC_ON && BK_ON) legNoCross(a); if (GD_ON) ctGround(a, root); if (CT_ON && a.ac && a.ac.k === 18) ctKickIK(a, root); if (CT3_ON && a.needHand && (a.holdK || 0) > .05 && !(a.ac && a.ac.init && CLK >= a.ac.t0 && a.ac.k >= 4 && a.ac.k <= 9)) ctGkHoldIK(a, root); else a.hik = 0; if (GKIK_ON && CLKOK && a.ac && a.ac.init && (a.ac.k === 1 || a.ac.k === 2) && !(a.hik > .05)) ctGkSaveIK(a, root); bodyDQ(pose, a.dqc);      // [gasp] kalca salinimi kokte
            if (a.needHand) { if (!a.hR) { a.hR = new Float32Array(3); a.hL = new Float32Array(3); } handsModel(a.dqc); xform(root, gkQ, a.hR); xform(root, gkQ2, a.hL); }   // [gk] avuç noktaları (top elde)
            if (VQ.sh) {                                                     // [vq] temas gölgesi için göğüs + ayak ortası (dünya)
                if (!a.cP) a.cP = new Float32Array(6);
                var dq = a.dqc;
                dqsPt(dq, BB.Torso, 0, 1.30, .02, CP_T); xform(root, CP_T, CP_W); a.cP[0] = CP_W[0]; a.cP[1] = CP_W[1]; a.cP[2] = CP_W[2];
                dqsPtV(dq, BB.FootL, FB_L5, CP_T); xform(root, CP_T, CP_W); a.cP[3] = CP_W[0]; a.cP[4] = CP_W[1]; a.cP[5] = CP_W[2];
                dqsPtV(dq, BB.FootR, FB_R5, CP_T); xform(root, CP_T, CP_W); a.cP[3] = (a.cP[3] + CP_W[0]) * .5; a.cP[4] = (a.cP[4] + CP_W[1]) * .5; a.cP[5] = (a.cP[5] + CP_W[2]) * .5;
            }
            if (a === S.ref) {                                               // hakem kartı GERÇEK sağ el konumunda (anatomik sağ = 'ForeL')
                var hb = BODY_BIND[BB.ForeL]; dqsPt(a.dqc, BB.ForeL, hb[0], hb[1] - .30, hb[2], CP_T);
                if (!S.refHand) S.refHand = new Float32Array(3); xform(root, CP_T, S.refHand);
            }
        }
        /* ana geçiş (deri bağlamalı): önbellekteki DQ + kök; ardışık aktörler aynı ağı paylaştığında VAO yeniden bağlanmaz */
        function drawActorC(a, pal, layer, hairStyle, beard) {
            var sc = a.dS, ws = a.dW, ex = eye[0] - a.dX, ey = eye[1] - .9, ez = eye[2] - a.dZ, dd = Math.sqrt(ex * ex + ey * ey + ez * ez);
            var px = 1.85 * sc * cv.height / (2 * Math.tan(curFov / 2) * Math.max(.5, dd)), li = (px < 42 || (Q.name === 'low' && !(VQ.ui && px > 120))) ? 2 : (px > Q.lodPx && SKN.lod[0] ? 0 : 1), L = SKN.lod[li], u = SKN.p.u;
            gl.uniform4fv(u.uDQ, a.dqc); gl.uniformMatrix4fv(u.uM, false, a.rM);
            gl.uniform3f(u.uNS, 1 / (ws * ws), 1 / (sc * sc), 1 / (ws * ws)); gl.uniform3fv(u.uPal, pal); gl.uniform1f(u.uLayer, layer == null ? 0 : layer);
            gl.uniform4fv(u.uHK, propKA(a, sc, ws));
            if (L.vao !== VAO_CUR) { gl.bindVertexArray(L.vao); VAO_CUR = L.vao; }
            gl.drawElements(gl.TRIANGLES, L.body, L.it, 0);
            var hr = L.hair[hairStyle == null ? 1 : hairStyle]; if (hr && hr[1]) gl.drawElements(gl.TRIANGLES, hr[1], L.it, hr[0] * L.ib);
            if (beard === 2 && L.beard && L.beard[1]) gl.drawElements(gl.TRIANGLES, L.beard[1], L.it, L.beard[0] * L.ib);
            STAT.draws++;
        }
        /* gölge geçişi (deri bağlamalı, her zaman yayın ağı): önbellekteki DQ; yalnızca aktörün düştüğü kademelere */
        function drawActorDepthC(a, hairStyle, beard) {
            var L = SKN.lod[Q.name === 'low' ? 2 : 1], u = SKN.pd.u, hr = L.hair[hairStyle == null ? 1 : hairStyle];
            gl.uniform4fv(u.uDQ, a.dqc); gl.uniform4fv(u.uHK, propKA(a, a.dS, a.dW));
            if (L.vao !== VAO_CUR) { gl.bindVertexArray(L.vao); VAO_CUR = L.vao; }
            for (var cs = 0; cs < SHN; cs++) {                              // [vq] cs 0: yakın kademe (atlas solu), 1: uzak (sağ); tek kademede yalnız LVP
                var near = SHN > 1 && cs === 0;
                if (SHN > 1) { if (near ? !a.sN : !a.sF) continue; if (SHV !== cs) { gl.viewport(near ? 0 : SHADOW_SIZE, 0, SHADOW_SIZE, SHADOW_SIZE); SHV = cs; } }
                mmul(mvpTmp, near ? LVPN : LVP, a.rM); gl.uniformMatrix4fv(u.uMVP, false, mvpTmp);
                gl.drawElements(gl.TRIANGLES, L.body, L.it, 0);
                if (hr && hr[1]) gl.drawElements(gl.TRIANGLES, hr[1], L.it, hr[0] * L.ib);
                if (beard === 2 && L.beard && L.beard[1]) gl.drawElements(gl.TRIANGLES, L.beard[1], L.it, L.beard[0] * L.ib);
            }
        }

        /* ----- kare ----- */
        var gtex = null, gInfo = null, gW = 0, gH = 0;
        R.setGround = function (canvas, rect) {
            if (!canvas) { gInfo = null; return; }
            gl.bindTexture(gl.TEXTURE_2D, groundTex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            if (VQ.ui && canvas.width === gW && canvas.height === gH) gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, canvas);   // [vq] aynı boyut: yeniden ayırma yok
            else { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas); gW = canvas.width; gH = canvas.height; }
            gInfo = rect;
        };
        R.setSize = function (cw, ch, d) { dpr = d; W = cw; H = ch; cv.width = Math.round(cw * d); cv.height = Math.round(ch * d); cv.style.width = cw + 'px'; cv.style.height = ch + 'px'; asp = cw / Math.max(1, ch); S.cam = null; };
        R.aspect = function () { return asp; };
        var lastNow = 0, tmpM = m4();
        // [oa] kare başına geçici bellek olmasın: yeniden kullanılan poz değiştirici nesneleri, sabit uniform değerleri, top dönüşüm dizileri, kart kutusu
        var OA3_FULL = 0;      // [duzgun] 1: eski ayakla karsilama (kok ofseti + yon + tum vucut pozu)
        var MOD_B7 = { kick: 0, celeb: false, ref: null, g: 0, gt: 0, gh: 1, hold: 0 }, BOARD7 = null;      // [v187]
        var FLAG_GEO = null, MOD_A = [{ ref: null, fl: 0, fp: 0, fw: 0, fa: 1 }, { ref: null, fl: 0, fp: 0, fw: 0, fa: 1 }, { ref: null, fl: 0, fp: 0, fw: 0, fa: 1 }], FL_M = new Float32Array(16);      // [yan]
        var MOD_D = { kick: 0, celeb: false }, MOD_M = { kick: 0, celeb: false }, MOD_R = { ref: null }, U_SKYT = new Float32Array([.03, .07, .15]), U_SKYB = new Float32Array([.13, .2, .32]);
        var U_ONE4 = new Float32Array([1, 1, 1, 1]), U_BRD4 = new Float32Array([1.15, 1.15, 1.15, 1]), BL_T = [0, 0, 0], BL_Q = [0, 0, 0, 1], BL_S = [1.2, 1.2, 1.2], CRC0 = [1, .86, .35], CRC1 = [.55, .85, 1], CRC2 = [1, .93, .7], CARD_BOX = null;
        function light(p) { gl.uniform3fv(p.u.uCam, eye); if (p._lc) return; p._lc = 1; gl.uniform3fv(p.u.uSun, LIGHTS.sun);   /* [opt] sabit ışıklar program başına bir kez (değer programda kalır) */ gl.uniform3fv(p.u.uAmbS, LIGHTS.ambS); gl.uniform3fv(p.u.uAmbG, LIGHTS.ambG); gl.uniform3fv(p.u.uFogC, LIGHTS.fogC); gl.uniform1f(p.u.uFog, LIGHTS.fog); gl.uniform3fv(p.u.uLdir, LIGHTS.ldir); }
        /* [vq] top boyu: ekranda en az ~7.5 px kalacak kadar büyütülür (en fazla eski 1.45 kat - yayın kamerası değişmez), yakın planda gerçek
           22 cm; elde tutulurken de aynı (yakın planda avuçlar gerçek boydaki topu kavrar; uzakta büyütülmüş topun merkezi avuçların önüne kayar,
           bkz gkBall). Geçiş yumuşak. Yerdeki topun alt noktası zeminde kalır. */
        /* [top] gerçek boy önceliği: uzak yayın planında yalnız ekranda ~6 px'in altına düşerse en fazla 1.2 kat büyütülür */
        var BSC = 1.2, BMB = { n: 0, x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 0, a: 0 };      // BMB: [vq] top hareket bulanıklığı (bu kare)
        function ballScale(x, y, z, dt) {
            if (!VQ.mat) { BSC = 1.2; return; }
            var ex = x - eye[0], ey = y - eye[1], ez = z - eye[2], dd = Math.max(.5, Math.sqrt(ex * ex + ey * ey + ez * ez)), dpx = .22 * H / (2 * Math.tan(curFov / 2) * dd), tg = CT2_ON && GB.held ? 1 : clamp(6 / dpx, 1, 1.2);
            BSC += (tg - BSC) * (1 - Math.exp(-dt / .25)); BL_S[0] = BL_S[1] = BL_S[2] = BSC;
        }
        function ballY(y) { return VQ.mat ? y - (.16 - .11 * BSC) * clamp(1 - (y - .17) / .5, 0, 1) : y; }
        function ballDraw(col) { for (var bi = 0; bi < ballParts.length; bi++) { var bp = ballParts[bi]; if (col) gl.uniform4f(pLit.u.uColor, bp.c[0], bp.c[1], bp.c[2], 1); gl.bindVertexArray(bp.vao); gl.drawElements(gl.TRIANGLES, bp.count, gl.UNSIGNED_SHORT, 0); } }
        var STAT = { draws: 0, frames: 0 };
        R.stats = STAT; R._gb = GB; R._nets = NETS; Object.defineProperty(R, '_netD', { get: function () { return SC && SC.net ? SC.net.dsp : null; } });
        /* st: {now(ms), v: görünüm, cam:{mode, zoom, replay, vs, dead:{kind,x,y,ax,dir}|null}, rings:[{x,z,r,col:[r,g,b],a}], ref:{pose,card}, celeb:{ids:[...]}, varOn, hasGround, carry:{id,type:'carry'|'takeon'}|null} */
        /* [opt] bekleyen programlar: KHR_parallel_shader_compile varsa hepsi 'tamam' diyene dek çizim yapılmaz (arayüz o karelerde 2B çizer, sayfa
           donmaz); yoksa ilk çizimde beklenir (derleme yine de kurulumdaki CPU işiyle örtüşür). Bağlanamayan program: derinlik → gölge yok,
           deri bağlamalı gövde → rijit model, temel programlar → bağlam kaybı yolu (2B'ye dönüş). */
        function progsReady() {
            if (gl.isContextLost()) { if (!R.lost) { R.lost = true; if (R.onLost) R.onLost(); } return false; }      // [ui] bağlam kayıp: bağlanma hatası sayılmaz
            var i; if (KPS) for (i = 0; i < PEND.length; i++) if (!gl.getProgramParameter(PEND[i].p, KPS.COMPLETION_STATUS_KHR)) return false;
            var L = PEND; PEND = [];
            for (i = 0; i < L.length; i++) { try { progEnd(gl, L[i]); } catch (e) { L[i].fail = e; } }
            if (pLit.fail || pPl.fail || pTex.fail || pSky.fail || pCrowd.fail) { if (G.console && console.warn) console.warn('Ado3D: program bağlanamadı', (pLit.fail || pPl.fail || pTex.fail || pSky.fail || pCrowd.fail).message); R.lost = true; if (R.onLost) R.onLost(); return false; }
            if (pDepth && pDepth.fail) { pDepth = null; shadowOK = false; }
            if (SKN && (SKN.p.fail || (SKN.pd && SKN.pd.fail))) { if (G.console && console.warn) console.warn('Ado3D: anatomik gövde devre dışı, rijit modele dönüldü:', (SKN.p.fail || SKN.pd.fail).message); SKN = null; }
            var pp = postEnsure.prog; if (pp && (pp.br.fail || pp.bl.fail || pp.cp.fail)) postEnsure.prog = null;
            return true;
        }
        R.render = function (st) {
            if (R.lost || !SC || !S.st) return false;
            if (PEND.length && !progsReady()) return false;                  // [opt] programlar henüz hazır değil
            if (SKN && SKN.job && !(st.clock != null && !st.noAct)) bodyJobStep(4);      // [v133] yakin cekim agi canli oyunda karede uretilmez (bosta / mac oncesi _bodyReady)
            var v = st.v, now = st.now, dt = clamp((now - lastNow) / 1000, .001, .1); lastNow = now;
            var t = now / 1000, i, bx = v.bx, bz = v.by;
            FRM[0] = bx; FRM[1] = bz; FRM[2] = dt; FRM[3] = t;                    // [opt] kare değerleri (aktör işlevleri kutulanmış sayı argümanı almaz)
            if (!(S.ball.px > -1e9)) { S.ball.px = bx; S.ball.pz = bz; }
            // [gk] aksiyon saati (sim sn; st.clock yoksa - ör. önizleme - aksiyon yok) · hazır duruş hedefleri · topu elinde tutan
            CLKOK = (R._clk != null) || (st.clock != null && !st.noAct && isFinite(st.clock)); CLK = R._clk != null ? R._clk : CLKOK ? st.clock : t;
            GK_RD = st.ready || null; GB_HOLD = -1; SP_DEAD = st.cam && st.cam.dead ? st.cam.dead : null; V7_DLV = st.v7dlv ? 1 : 0;      // [v187]
            if (CLKOK) {
                if (st.hand != null && st.hand >= 0 && st.hand < S.n && v.x[st.hand] > -20) GB_HOLD = st.hand;
                for (i = 0; i < S.n; i++) { var acH = S.st[i].ac; if (acH && acH.k >= 4 && acH.k <= 6 && CLK >= acH.t0 && CLK < acH.tc) GB_HOLD = i; }
            }
            var cel0 = st.celeb ? st.celeb.ids : null;
            camUpdate(st.cam, bx, bz, dt, cel0, v);
            ballScale(GB.ok ? GB.x : bx, GB.ok ? GB.y : .17, GB.ok ? GB.z : bz, dt);      // [vq] topun görünen boyu (gölge geçişinden önce)
            var PST = postEnsure(), mainFB = PST ? PST.msFB : null, SHD = !!(shadowOK && pDepth && !Q.noShadow);
            if (SHD) updateLightVP(bx, bz);
            frustumSet();                                                    // [opt] görüş konisi düzlemleri (aktör ayıklama)
            /* [opt] aktör güncellemesi + poz/DQ: karede BİR kez, gölge ve ana geçişten ÖNCE. İki geçiş aynı DQ'yu ve kök matrisini kullanır
               (gölge artık bir kare geride kalmaz); görüş konisi ve gölge kademeleri dışındaki aktörün pozu hiç hesaplanmaz. */
            var cel = st.celeb ? st.celeb.ids : null, ts = Math.max(.05, st.tscale || 1); FRM[5] = dt * ts;      // [v133] FRM[5]: kare suresi (sim sn) - ayak kilidi
            var VO = CLKOK && st.voff ? st.voff : null;
            if (SP_ON) {      /* [govde] ic ice gecmeyi onleyen cizim ofseti (onceki karenin ayrilmamis cizim konumlarindan) */
                var spN = S.n, spi, spj, spK = 1 - Math.exp(-dt / .08);
                if (!S.spT || S.spT.length < spN * 2) S.spT = new Float32Array(spN * 2);
                var spT = S.spT; spT.fill(0);
                for (spi = 0; spi < spN; spi++) {
                    var ai0 = S.st[spi]; if (v.x[spi] < -20 || !(ai0.uX > -1e9) || !ai0.uOk) continue; var ac0 = ai0.ac && ai0.ac.init ? ai0.ac : null; if (ac0 && ac0.k === 10) continue;
                    for (spj = spi + 1; spj < spN; spj++) {
                        var aj0 = S.st[spj]; if (v.x[spj] < -20 || !(aj0.uX > -1e9) || !aj0.uOk) continue; var ac1 = aj0.ac && aj0.ac.init ? aj0.ac : null; if (ac1 && ac1.k === 10) continue;
                        var dxs = aj0.uX - ai0.uX, dzs = aj0.uZ - ai0.uZ, ds = Math.sqrt(dxs * dxs + dzs * dzs);
                        if (ds >= SP_D) continue;
                        var ph = (SP_D - ds) * .5;
                        if (ds < 1e-3) { dxs = Math.cos(spi * 1.7 + spj); dzs = Math.sin(spi * 1.7 + spj); } else { dxs /= ds; dzs /= ds; }
                        spT[spi * 2] -= dxs * ph; spT[spi * 2 + 1] -= dzs * ph; spT[spj * 2] += dxs * ph; spT[spj * 2 + 1] += dzs * ph;
                    }
                }
                for (spi = 0; spi < spN; spi++) { var asp = S.st[spi]; asp.spX = (asp.spX || 0) + (spT[spi * 2] - (asp.spX || 0)) * spK; asp.spZ = (asp.spZ || 0) + (spT[spi * 2 + 1] - (asp.spZ || 0)) * spK; asp.uOk = 0; }
            }                   // [gk] arayüzün görsel konum ofseti (penaltıda kaleci çizgide, aut koşusu) - motor konumu değişmez
            for (i = 0; i < S.n; i++) {
                var a = S.st[i]; a.ok = 0;
                if (v.x[i] < -20) continue;
                var x = v.x[i] + (VO ? VO[i * 2] : 0) + (a.rOx || 0), z = v.y[i] + (VO ? VO[i * 2 + 1] : 0) + (a.rOz || 0);
                if (!(a.px > -1e9)) { a.px = x; a.pz = z; a.yaw = Math.atan2(v.fx[i], v.fy[i]); }
                if (!(a.spd >= 0)) a.spd = 0; if (!(a.accS > -99 && a.accS < 99)) a.accS = 0;      // [oa] NaN koruması (görünmez oyuncu olmasın)
                var ddx = x - a.px, ddz = z - a.pz, d = Math.sqrt(ddx * ddx + ddz * ddz), sp = d / (dt * ts), sp0 = a.spd; if (d > 5) { sp = 0; d = 0; }
                if (a.cutN > 0) { a.cutN--; if (!a.cutN) { a.spd = Math.max(0, Math.min(10.5, sp)); sp0 = a.spd; } }      // [v132] kurgu kesmesi: hız süzgeçsiz yeni kareden (ayakta başlama yok)
                else a.spd += (Math.max(0, Math.min(10.5, sp)) - a.spd) * (1 - Math.exp(-dt * ts / (V7_ON ? .055 : .12)));      // [v187] D2: adım hızı kök hızını yakından izler (yavaşlarken ayak kayması yok)      // [fiz] sim saatiyle
                a.accS = (a.accS || 0) + (Math.max(-12, Math.min(12, (a.spd - sp0) / (dt * ts))) - (a.accS || 0)) * (1 - Math.exp(-dt * ts / .2));      // [v133] süzgeçler sim saatiyle      // [oa] ivme (m/sn²): öne / geriye eğilme
                var cTarget = (st.carry && st.carry.id === i) ? 1 : 0, tTarget = (st.carry && st.carry.id === i && st.carry.type === 'takeon') ? 1 : 0;   // top sürme karışımı: canlı top sahipliğine yumuşak geçiş (pop yok)
                a.carryK = (a.carryK || 0) + (cTarget - (a.carryK || 0)) * (1 - Math.exp(-dt * ts / .18));
                a.takeonK = (a.takeonK || 0) + (tTarget - (a.takeonK || 0)) * (1 - Math.exp(-dt * ts / .15));
                var lv0 = d > 1e-5 ? ((x - a.px) * Math.cos(a.yaw) - (z - a.pz) * Math.sin(a.yaw)) / (dt * ts) : 0; a.latV = (a.latV || 0) + (Math.max(-9, Math.min(9, lv0)) - (a.latV || 0)) * (1 - Math.exp(-dt * ts / .15));   // [gk] gövdeye göre yanal hız (+ = sol): yan adım
                var lo0 = d > 1e-5 ? ((x - a.px) * Math.sin(a.yaw) + (z - a.pz) * Math.cos(a.yaw)) / (dt * ts) : 0; a.lonV = (a.lonV || 0) + (Math.max(-10.5, Math.min(10.5, lo0)) - (a.lonV || 0)) * (1 - Math.exp(-dt * ts / .15));   // [oa] ileri hız (geri koşu)
                var bkS = d > 1e-4 && ((x - a.px) * Math.sin(a.yaw) + (z - a.pz) * Math.cos(a.yaw)) < -.35 * d ? -1 : 1;      // geri geri koşu: adım döngüsü ters
                if (GA_ON) { var gOn = (!cTarget || (GA_OWN && v.gpOn && v.gp)) && !(S.roles && S.roles[i]) ? 1 : 0;
                    if (cTarget && GA_OWN && v.gpOn && v.gp) { var gpu = v.gp[i] / (2 * Math.PI); a.gaC = Math.floor(gpu); a.gaP = gpu - a.gaC; a.gaD = 0; }      /* [gasp] top sahibi: evre motordan */ a.gaW = (a.gaW || 0) + (gOn - (a.gaW || 0)) * (1 - Math.exp(-dt * ts / .15)); if (a.gaD > .01) { a.gaP = (a.gaP || 0) + d / a.gaD; if (a.gaP >= 1) { var gfl = Math.floor(a.gaP); a.gaP -= gfl; a.gaC = (a.gaC || 0) + gfl; } } }      // [gasp]
                a.ph += bkS * d * gaitPhK(a.spd, a.carryK); if (cTarget && v.gpOn && v.gp && !R._noLock) { var gpe = v.gp[i] - a.ph; gpe -= Math.round(gpe / (2 * Math.PI)) * 2 * Math.PI; a.ph += gpe * (1 - Math.exp(-dt * ts / .05)); }      // [motor] evre motora kilitli
                else if (cTarget && v.dOn && bkS > 0 && !R._noLock) carrySync(a, d, dt * ts, v); a.px = x; a.pz = z;      // [carry] adımlar dokunuşla eş                      // top sürerken kadans artar (aynı hızda daha kısa/sık adım - araştırma dayanaklı)
                var ty = Math.atan2(v.fx[i], v.fy[i]), dy = ty - a.yaw, kyw = 1 - Math.exp(-dt * ts / .09);
                if (BK_ON && a.spd > 2 && !cTarget && !(S.roles && S.roles[i]) && (a.latV || 0) * (a.latV || 0) + (a.lonV || 0) * (a.lonV || 0) > 1) {      /* [bacak] hizliyken yan / geri kosu yok */
                    var bkL = a.spd < 3 ? 3.1416 - 1.39 * (a.spd - 2) : a.spd < 4.5 ? 1.75 - .567 * (a.spd - 3) : Math.max(.6, .9 - .2 * (a.spd - 4.5));
                    var bkH = a.yaw + Math.atan2(a.latV || 0, a.lonV || 0), bkD = bkH - ty; bkD = Math.atan2(Math.sin(bkD), Math.cos(bkD));
                    if (bkD > bkL || bkD < -bkL) { var bkC1 = bkH - bkL, bkC2 = bkH + bkL, bkE1 = bkC1 - a.yaw, bkE2 = bkC2 - a.yaw; bkE1 = Math.atan2(Math.sin(bkE1), Math.cos(bkE1)); bkE2 = Math.atan2(Math.sin(bkE2), Math.cos(bkE2)); ty = Math.abs(bkE1) <= Math.abs(bkE2) ? bkC1 : bkC2; }      /* mevcut yone yakin taraf (geri kosuda salinim yok) */
                    dy = ty - a.yaw;
                }
                dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.yaw += dy * kyw;      // [fiz] sim saatiyle (kopru YAW ile es)
                a.yawR = (a.yawR || 0) + (Math.max(-8, Math.min(8, dy * kyw / (dt * ts))) - (a.yawR || 0)) * (1 - Math.exp(-dt * ts / .15));   // [oa] dönüş hızı (rad/sn): viraj yatışı
                idleState(a, true);                                          // [opt] konum a.px/a.pz, kare değerleri FRM
                gkUpdate(a, i); a.uX = a.dX; a.uZ = a.dZ; a.uOk = 1; if (SP_ON) { a.dX += a.spX || 0; a.dZ += a.spZ || 0; }      /* [govde] ayirma son cizim konumunda */                                    // [gk] hazır duruş / elde tutuş / aksiyon kökü → a.dX, a.dZ, a.dYaw, a.rY
                spGait(a);                                                   // [sp] kök kendi yolunda yürüyor/koşuyorsa adım evresi ve hız ondan
                var kq = ((a.kickC && CLKOK ? CLK : t) - a.kickT) / (a.kickDur || .42)      // [v133] yedek vurus sim saatiyle
                   , mk = kq >= 0 && kq < 1 ? kq : 0, mc = !!(cel && cel.indexOf(i) >= 0) && !(V7_ON && a.ac && a.ac.k === 20 && CLKOK && CLK >= a.ac.t0 - .3 && CLK < a.ac.te);      // [v187] sevinç jesti sürüyorsa kollar jestte
                if (mc) a.spd *= .3;
                MOD_M.kick = mk; MOD_M.celeb = mc;                               // [oa] yeniden kullanılan nesne
                FRM[4] = a.hScale != null ? a.hScale : .98; actPrep(a, mk || mc ? MOD_M : null, SHD);
            }
            if (OLC7.on && CLKOK) olc7Frame(v, dt * ts);      // [v187] ışınlanma / ayak kayması ölçücüsü
            var r = S.ref; r.ok = 0;
            if (v.rx != null) {
                if (!(r.px > -1e9)) { r.px = v.rx; r.pz = v.ry; r.yaw = Math.atan2(v.rfx, v.rfy); }
                var rdx = v.rx - r.px, rdz = v.ry - r.pz, rd = Math.sqrt(rdx * rdx + rdz * rdz), rs = rd / (dt * ts); if (rd > 5) { rs = 0; rd = 0; }
                r.spd += (Math.max(0, Math.min(7, rs)) - r.spd) * (1 - Math.exp(-dt / .15)); r.ph += rd * gaitPhK(r.spd, 0); r.px = v.rx; r.pz = v.ry;
                var ry = Math.atan2(v.rfx, v.rfy), dr = ry - r.yaw; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); r.yaw += dr * (1 - Math.exp(-dt / .12));
                idleState(r, false);
                var rm = null; if (st.refPose) { rm = MOD_R; MOD_R.ref = st.refPose; MOD_R.cardT = st.refCardT; MOD_R.cardK = st.refCard; r.spd *= .4; }
                r.dX = v.rx; r.dZ = v.ry; r.dYaw = r.yaw; r.rY = 0;
                FRM[4] = .97; actPrep(r, rm, SHD);
            }
            if (!S.arA) S.arA = [mkAct(1, .96, .96, .31), mkAct(4, .98, .97, .77), mkAct(2, .97, 1.0, .55)];
            for (var ai = 0; ai < 3; ai++) {      // [yan] yan hakemler (0, 1) ve dorduncu hakem (2)
                var aa = S.arA[ai], md = MOD_A[ai], ax0, az0, afx, afy, afc = 0, afp = 0; aa.ok = 0;
                if (!v.ar || !v.fo) continue;
                if (ai < 2) { var ao = ai * 6; ax0 = v.ar[ao]; az0 = v.ar[ao + 1]; afx = v.ar[ao + 2]; afy = v.ar[ao + 3]; afc = v.ar[ao + 4] | 0; afp = v.ar[ao + 5]; }
                else { ax0 = v.fo[0]; az0 = v.fo[1]; afx = 0; afy = -1; }
                if (!(aa.px > -1e9)) { aa.px = ax0; aa.pz = az0; aa.yaw = Math.atan2(afx, afy); }
                var adx = ax0 - aa.px, adz = az0 - aa.pz, ad = Math.sqrt(adx * adx + adz * adz), dts2 = Math.max(1e-4, dt * ts); if (ad > 5) { ad = 0; adx = 0; adz = 0; }
                var cya = Math.cos(aa.yaw), sya = Math.sin(aa.yaw), kea = 1 - Math.exp(-dt / .15);
                aa.latV += (clamp((adx * cya - adz * sya) / dts2, -9, 9) - aa.latV) * kea; aa.lonV += (clamp((adx * sya + adz * cya) / dts2, -9.5, 9.5) - aa.lonV) * kea;
                aa.spd += (Math.max(0, Math.min(8, ad / dts2)) - aa.spd) * kea; aa.ph += ad * gaitPhK(aa.spd, 0); aa.px = ax0; aa.pz = az0;
                var ayt = Math.atan2(afx, afy), adr = ayt - aa.yaw; adr = Math.atan2(Math.sin(adr), Math.cos(adr)); aa.yaw += adr * (1 - Math.exp(-dt / .14));
                idleState(aa, false);
                if (afc > 0) { aa.fcL = afc; aa.fpL = afp; } aa.fw = (aa.fw || 0) + ((afc > 0 ? 1 : 0) - (aa.fw || 0)) * (1 - Math.exp(-dt / .1));
                md.fl = aa.fcL || 0; md.fp = aa.fpL || 0; md.fw = ai < 2 ? aa.fw : 0;
                if (md.fl >= 3 && md.fw > .02) md.fa = md.fp * -Math.cos(aa.yaw) >= 0 ? 1 : -1; else if (md.fw <= .02) md.fa = 1;      // yana isarette isaret yonundeki kol (anatomik sag dunyada (-cos yaw, sin yaw))
                aa.dX = ax0; aa.dZ = az0; aa.dYaw = aa.yaw; aa.rY = 0;
                if (ai === 2) { MOD_B7.g = st.v7board ? 22 : 0; aa.needHand = !!st.v7board; }      // [v187] değişiklik tabelası
                FRM[4] = ai < 2 ? .96 : .97; actPrep(aa, ai < 2 ? md : (st.v7board ? MOD_B7 : null), SHD);
                if (ai < 2 && SKN && aa.rM && aa.dqc && (aa.vM || aa.vS)) {      // bayrak: elden onkol yonunde
                    var fbA = md.fa > 0 ? BB.ForeL : BB.ForeR, hbA = BODY_BIND[fbA]; if (!aa.fH) { aa.fH = new Float32Array(3); aa.fE = new Float32Array(3); }
                    dqsPt(aa.dqc, fbA, hbA[0], hbA[1] - .30, hbA[2], CP_T); xform(aa.rM, CP_T, aa.fH); dqsPt(aa.dqc, fbA, hbA[0], hbA[1] - .08, hbA[2], CP_T); xform(aa.rM, CP_T, aa.fE); aa.fOk = 1;
                } else aa.fOk = 0;
            }
            if (V7_ON) { try { v7XUpdate(st, dt, ts, SHD); } catch (e) { V7X.n = 0; V7X.nb = 0; } }      // [v187] top görevlileri, giren / çıkan oyuncu
            if (SHD) {
                gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB); gl.viewport(0, 0, SHADOW_SIZE * SHX, SHADOW_SIZE);
                gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.colorMask(false, false, false, false); gl.clear(gl.DEPTH_BUFFER_BIT);
                gl.enable(gl.CULL_FACE); gl.cullFace(gl.FRONT); gl.useProgram(SKN && SKN.pd ? SKN.pd.p : pDepth.p);
                if (SKN && SKN.pd) gl.uniform3fv(SKN.pd.u.uHB, BODY_BIND[BB.Head]);      // [opt] sabit: aktör başına değil, karede bir kez
                VAO_CUR = null; SHV = -1;
                for (i = 0; i < S.n; i++) {
                    var a2 = S.st[i]; if (!a2.ok || !a2.vS) continue;
                    if (SKN && SKN.pd) drawActorDepthC(a2, S.hair ? S.hair[i] : 1, S.beard ? S.beard[i] : 0);
                    else { MOD_D.kick = a2.mK; MOD_D.celeb = !!a2.mC; drawActorDepth(a2, a2.dX, a2.dZ, a2.dYaw, a2.dS, a2.dW, a2.mK || a2.mC ? MOD_D : null, t, S.hair ? S.hair[i] : 1, S.beard ? S.beard[i] : 0); }
                }
                if (r.ok && r.vS) {
                    if (SKN && SKN.pd) drawActorDepthC(r, 1, 0);
                    else drawActorDepth(r, r.dX, r.dZ, r.dYaw, .97, .97, null, t, 1);
                }
                if (S.arA) for (var asd = 0; asd < 3; asd++) { var aq = S.arA[asd]; if (!aq.ok || !aq.vS) continue; if (SKN && SKN.pd) drawActorDepthC(aq, 1, 0); else drawActorDepth(aq, aq.dX, aq.dZ, aq.dYaw, aq.dS, aq.dW, null, t, 1); }      // [yan]
                for (var x7d = 0; x7d < V7X.n; x7d++) { var x7a = V7X.A[x7d], x7q = st.xa[x7d]; if (!x7a || !x7a.ok || !x7a.vS) continue; if (SKN && SKN.pd) drawActorDepthC(x7a, v7XHair(x7q), v7XBeard(x7q)); }      // [v187] ek aktörler
                gl.useProgram(pDepth.p);
                BL_T[0] = GB.ok ? GB.x : bx; BL_T[1] = ballY(GB.ok ? GB.y : .17 + clamp(v.bz, 0, 30)); BL_T[2] = GB.ok ? GB.z : bz; BL_Q[0] = S.ball.qx; BL_Q[1] = S.ball.qy; BL_Q[2] = S.ball.qz; BL_Q[3] = S.ball.qw; var bsS = BL_S[0]; if (BJ.sc < 1) BL_S[0] = BL_S[1] = BL_S[2] = bsS * Math.max(.001, BJ.sc); mquat(tmpM, BL_T, BL_Q, BL_S); BL_S[0] = BL_S[1] = BL_S[2] = bsS;      // [fiz] gizli/buyuyen topun golgesi de
                for (var cb = 0; cb < SHN; cb++) {                               // [vq] top: her iki kademeye
                    if (SHN > 1) gl.viewport(cb ? SHADOW_SIZE : 0, 0, SHADOW_SIZE, SHADOW_SIZE);
                    mmul(mvpTmp, SHN > 1 && !cb ? LVPN : LVP, tmpM); gl.uniformMatrix4fv(pDepth.u.uMVP, false, mvpTmp);
                    ballDraw(false);
                }
                if (GHB.on) { BL_T[0] = GHB.x; BL_T[1] = ballY(GHB.y); BL_T[2] = GHB.z; mquat(tmpM, BL_T, BL_Q, BL_S); for (var cg = 0; cg < SHN; cg++) { if (SHN > 1) gl.viewport(cg ? SHADOW_SIZE : 0, 0, SHADOW_SIZE, SHADOW_SIZE); mmul(mvpTmp, SHN > 1 && !cg ? LVPN : LVP, tmpM); gl.uniformMatrix4fv(pDepth.u.uMVP, false, mvpTmp); ballDraw(false); } }      // [fiz]
                gl.colorMask(true, true, true, true); gl.cullFace(gl.BACK); gl.bindFramebuffer(gl.FRAMEBUFFER, mainFB);
            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, mainFB); gl.viewport(0, 0, cv.width, cv.height); gl.disable(gl.SCISSOR_TEST); gl.clearColor(.03, .05, .09, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            // gökyüzü
            gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.useProgram(pSky.p); gl.uniform3fv(pSky.u.uTop, U_SKYT); gl.uniform3fv(pSky.u.uBot, U_SKYB); gl.bindVertexArray(skyVao); gl.drawArrays(gl.TRIANGLES, 0, 3);
            gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
            // --- sahne (opak) ---
            gl.useProgram(pLit.p); gl.uniformMatrix4fv(pLit.u.uVP, false, VP); light(pLit); gl.uniformMatrix4fv(pLit.u.uM, false, mident(tmpM)); gl.uniform4f(pLit.u.uColor, 1, 1, 1, 1); gl.uniform1f(pLit.u.uEmis, 0);
            gl.disable(gl.CULL_FACE);
            gl.bindVertexArray(SC.opaque.vao); gl.drawArrays(gl.TRIANGLES, 0, SC.opaque.n);
            gl.uniform1f(pLit.u.uEmis, 1); gl.bindVertexArray(SC.emis.vao); gl.drawArrays(gl.TRIANGLES, 0, SC.emis.n);
            if (SC.stad) { gl.uniform1f(pLit.u.uEmis, 2); gl.bindVertexArray(SC.stad.vao); gl.drawElements(gl.TRIANGLES, SC.stad.n, gl.UNSIGNED_INT, 0); gl.uniform1f(pLit.u.uEmis, 1); }      // [stad] Unity stadyumu
            var sOn = st.varOn ? .9 + .1 * Math.sin(t * 6) : .32; gl.uniform4f(pLit.u.uColor, sOn, sOn, sOn, 1); gl.bindVertexArray(SC.screen.vao); gl.drawArrays(gl.TRIANGLES, 0, SC.screen.n);
            gl.uniform1f(pLit.u.uEmis, 0); gl.uniform4f(pLit.u.uColor, 1, 1, 1, 1);
            // --- çim ---
            gl.useProgram(pTex.p); gl.uniformMatrix4fv(pTex.u.uVP, false, VP); gl.uniform3fv(pTex.u.uCam, eye); gl.activeTexture(gl.TEXTURE0);
            if (!pTex._c) { gl.uniform3fv(pTex.u.uFogC, LIGHTS.fogC); gl.uniform1f(pTex.u.uFog, LIGHTS.fog * .8); gl.uniform1i(pTex.u.uTex, 0); gl.uniform1i(pTex.u.uShadow, 1); if (VQ.pitch) { gl.uniform1i(pTex.u.uDet, 4); gl.uniform4fv(pTex.u.uStr, U_STR); gl.uniform4fv(pTex.u.uPG, U_PG); } pTex._c = 1; }   // [opt] sabitler program başına bir kez
            gl.uniform1f(pTex.u.uPitch, 1); qn = 0;
            gl.uniform1f(pTex.u.uShadowOn, (SHD && shadowTex) ? 1 : 0); gl.uniformMatrix4fv(pTex.u.uLightVP, false, LVP); gl.uniform1f(pTex.u.uTexel, 1 / SHADOW_SIZE);
            if (VQ.sh && VQ.csm) { gl.uniformMatrix4fv(pTex.u.uLightVPN, false, LVPN); gl.uniform4fv(pTex.u.uShA, SHA); gl.uniform1f(pTex.u.uCsm, CSM ? 1 : 0); }
            gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, shadowTex || white1); gl.activeTexture(gl.TEXTURE0);
            if (VQ.pitch && T.detail) { gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, T.detail); gl.activeTexture(gl.TEXTURE0); }
            gl.bindVertexArray(pitchVao); gl.bindTexture(gl.TEXTURE_2D, T.pitch); gl.uniform4fv(pTex.u.uMul, U_ONE4); gl.drawArrays(gl.TRIANGLES, 0, 6);   // [opt] sabit çim dörtgeni
            gl.uniform1f(pTex.u.uPitch, 0); gl.uniform1f(pTex.u.uShadowOn, 0);
            // panolar
            if (VQ.mat) gl.uniform2f(pTex.u.uUVO, (t * .04) % 1, 0);         // [vq] LED panolar: yavaş kayan yazı
            gl.uniform4fv(pTex.u.uMul, U_BRD4); gl.bindTexture(gl.TEXTURE_2D, T.board); gl.bindVertexArray(SC.boards.vao); gl.drawArrays(gl.TRIANGLES, 0, SC.boards.n);
            if (VQ.mat) gl.uniform2f(pTex.u.uUVO, 0, 0);
            if (SC.crowd && SC.crowd.n && T.crowd) {
                gl.useProgram(pCrowd.p); gl.uniformMatrix4fv(pCrowd.u.uVP, false, VP); gl.uniform3fv(pCrowd.u.uCam, eye); gl.uniform1f(pCrowd.u.uT, t);
                if (!pCrowd._c) { gl.uniform3fv(pCrowd.u.uFogC, LIGHTS.fogC); gl.uniform1f(pCrowd.u.uFog, LIGHTS.fog); gl.uniform1i(pCrowd.u.uTex, 0); gl.uniform1i(pCrowd.u.uShadow, 1); gl.uniform1f(pCrowd.u.uPitch, 0); gl.uniform1f(pCrowd.u.uShadowOn, 0); gl.uniform4fv(pCrowd.u.uMul, U_ONE4); if (VQ.mat) gl.uniform1f(pCrowd.u.uGr, 1); gl.uniform1f(pCrowd.u.uIdle, 1); pCrowd._c = 1; }   // [opt] sabitler bir kez
                if (VQ.mat) { gl.uniform1f(pCrowd.u.uBias, .45 + 1.35 * clamp((26 - CAM_FD) / 18, 0, 1)); }   // [vq] yakın planda arka plan yumuşar (sahte alan derinliği)
                var cpul = clamp(st.crowdPulse || 0, 0, 1); gl.uniform1f(pCrowd.u.uPulse, cpul); gl.uniform1f(pCrowd.u.uSide, st.crowdSide == null ? .5 : st.crowdSide);
                gl.disable(gl.CULL_FACE); gl.bindTexture(gl.TEXTURE_2D, T.crowd); gl.bindVertexArray(SC.crowd.vao); gl.drawArrays(gl.TRIANGLES, 0, SC.crowd.n);
                gl.useProgram(pTex.p);
            }
            // --- projektör parlaması + seyirci gol coşkusu (katmalı harman, derinlik yazmaz) ---
            gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE); gl.depthMask(false); gl.uniform4fv(pTex.u.uMul, U_ONE4);
            qn = 0;
            for (i = 0; i < FLOOD_TIPS.length; i++) { var fp = FLOOD_TIPS[i]; qBill(fp[0], fp[1], fp[2], 7.5, 5.5, 1, .97, .88, .55); qBill(fp[0], fp[1], fp[2], 2.6, 2.2, 1, 1, .95, .9); }
            qFlush(T.glare);
            var pulse = clamp(st.crowdPulse || 0, 0, 1), pside = st.crowdSide;
            if (pulse > .01 && SC.crowdPts && SC.crowdPts.length) {
                qn = 0; var cp = SC.crowdPts, npt = cp.length / 4;
                for (i = 0; i < npt; i++) {
                    var o4 = i * 4, bias = cp[o4 + 3], near = (pside === 0 && bias === 0) || (pside === 1 && bias === 1) || bias === .5;
                    var ii = near ? pulse : pulse * .35; if (ii < .04) continue;
                    var ph2 = Math.sin(t * 14 + i * 1.7) * .5 + .5, cc = pside === 0 ? CRC0 : pside === 1 ? CRC1 : CRC2;
                    qBill(cp[o4], cp[o4 + 1] + .3, cp[o4 + 2], .34, .5, cc[0], cc[1], cc[2], ii * (.55 + .45 * ph2));
                }
                qFlush(T.glare);
            }
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            // --- zemin katmanı, gölgeler, halkalar (yarı saydam, derinlik yazmaz) ---
            gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
            if (st.trail && st.trail.length > 1) {                       // [opt] top izi (tekrar / iz katmanı): zemine serilen şerit, saydamlık eski çizimle aynı
                var tl = st.trail, tn = tl.length, thw = (st.trailW || .3) * .5; qn = 0;
                for (i = 1; i < tn && qn <= QN * 6 - 6; i++) {
                    var tp0 = tl[i - 1], tp1 = tl[i], tdx = tp1[0] - tp0[0], tdz = tp1[1] - tp0[1], tsl = Math.sqrt(tdx * tdx + tdz * tdz); if (tsl < 1e-4) continue;
                    var tnx = -tdz / tsl * thw, tnz = tdx / tsl * thw, ta = st.trailLive ? .35 : .12 + .5 * i / tn;
                    qv(tp0[0] - tnx, .022, tp0[1] - tnz, 0, 0, 1, 1, 1, ta); qv(tp1[0] - tnx, .022, tp1[1] - tnz, 1, 0, 1, 1, 1, ta); qv(tp1[0] + tnx, .022, tp1[1] + tnz, 1, 1, 1, 1, 1, ta);
                    qv(tp0[0] - tnx, .022, tp0[1] - tnz, 0, 0, 1, 1, 1, ta); qv(tp1[0] + tnx, .022, tp1[1] + tnz, 1, 1, 1, 1, 1, ta); qv(tp0[0] + tnx, .022, tp0[1] + tnz, 0, 1, 1, 1, 1, ta);
                }
                qFlush(white1);
            }
            if (st.hasGround && gInfo) {
                qn = 0; var gi = gInfo; qv(gi.x0, .02, gi.z0, 0, 0, 1, 1, 1, 1); qv(gi.x1, .02, gi.z0, 1, 0, 1, 1, 1, 1); qv(gi.x1, .02, gi.z1, 1, 1, 1, 1, 1, 1); qv(gi.x0, .02, gi.z0, 0, 0, 1, 1, 1, 1); qv(gi.x1, .02, gi.z1, 1, 1, 1, 1, 1, 1); qv(gi.x0, .02, gi.z1, 0, 1, 1, 1, 1, 1);
                qFlush(groundTex);
            }
            if (VQ.sh) {                                                     // [vq] gece maçı: diğer üç projektörden uzayan soluk "yıldız" gölgeleri (ayak dibinden)
                qn = 0;
                for (i = 0; i < S.n; i++) { if (v.x[i] < -20) continue; floodShadows(i, v); }
                if (v.rx != null) floodShadows(-1, v);
                qFlush(T.streak);
            }
            qn = 0;
            var sx = .16, sz = .09, bshadowA = (SHD && shadowTex) ? .5 : .95, bshadowS = (SHD && shadowTex) ? .62 : 1;    // gerçek gölge haritası varsa blob yalnızca yumuşak temas gölgesi (AO) olarak kalır
            for (i = 0; i < S.n; i++) { if (v.x[i] < -20) continue; var a5 = S.st[i], ry5 = a5.rY || 0; qFlat((a5.dX != null ? a5.dX : v.x[i]) + sx, (a5.dZ != null ? a5.dZ : v.y[i]) + sz, .5 * bshadowS, .34 * bshadowS, .035, 1, 1, 1, bshadowA * (ry5 > .03 ? clamp(1 - ry5 * 1.6, .25, 1) : 1)); }
            if (v.rx != null) qFlat(v.rx + sx, v.ry + sz, .45 * bshadowS, .3 * bshadowS, .035, 1, 1, 1, bshadowA);
            if (S.arA) for (var asb = 0; asb < 3; asb++) { var ab = S.arA[asb]; if (ab.ok) qFlat(ab.dX + sx, ab.dZ + sz, .44 * bshadowS, .3 * bshadowS, .035, 1, 1, 1, bshadowA); }      // [yan]
            for (var x7s = 0; x7s < V7X.n; x7s++) { var x7b = V7X.A[x7s]; if (x7b && x7b.ok) qFlat(x7b.dX + sx, x7b.dZ + sz, .4 * bshadowS, .28 * bshadowS, .035, 1, 1, 1, bshadowA); }      // [v187]
            if (VQ.sh) for (i = 0; i < S.n; i++) {                         // [vq] yerde yatan / diz üstü gövde: gövde boyunca temas gölgesi
                var a7 = S.st[i]; if (v.x[i] < -20 || !a7.cP || a7.cP[1] > .8) continue;
                lieShadow(a7, clamp((.8 - a7.cP[1]) / .4, 0, 1) * (bshadowA + .25));
            }
            var bh = GB.ok ? clamp(GB.y - .17, 0, 30) : clamp(v.bz, 0, 30), bsz = (.3 + Math.max(0, .5 - bh * .05)) * bshadowS * BSC / 1.45, bgx = GB.ok ? GB.x : bx, bgz = GB.ok ? GB.z : bz;
            qFlat(bgx + sx * (1 + bh * .4), bgz + sz * (1 + bh * .4), bsz, bsz * .8, .035, 1, 1, 1, clamp(bshadowA - bh * .04, .18, bshadowA));
            qFlush(T.blob);
            var rgN = st.rings ? (st.ringN != null ? st.ringN : st.rings.length) : 0;      // [opt] arayüz halka havuzu: geçerli sayı ringN
            if (rgN) {
                for (i = 0; i < rgN; i++) { var rg = st.rings[i]; qFlat(rg.x, rg.z, rg.r, rg.r, .05, rg.col[0], rg.col[1], rg.col[2], rg.a == null ? 1 : rg.a); }
                qFlush(T.ring);
            }
            gl.depthMask(true); gl.disable(gl.BLEND);
            // --- oyuncular --- ([opt] güncelleme ve poz/DQ gölge geçişinden önce yapıldı; burada yalnızca görüş konisindekiler çizilir)
            gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
            if (SKN) {
                gl.useProgram(SKN.p.p); gl.uniformMatrix4fv(SKN.p.u.uVP, false, VP); light(SKN.p);
                if (!SKN.p._c) { gl.uniform3fv(SKN.p.u.uL2, LIGHTS.l2); gl.uniform3fv(SKN.p.u.uC2, LIGHTS.c2); gl.uniform3fv(SKN.p.u.uL3, LIGHTS.l3); gl.uniform3fv(SKN.p.u.uC3, LIGHTS.c3); gl.uniform3fv(SKN.p.u.uHeadC, HEAD_C); SKN.p._c = 1; }   // [opt] sabitler: program başına bir kez (uniform değeri programda kalır)
                gl.uniform1f(SKN.p.u.uDetail, Q.name === 'low' ? 0 : 1); gl.uniform3fv(SKN.p.u.uHB, BODY_BIND[BB.Head]);
                gl.uniform1f(SKN.p.u.uShadowOn, (SHD && shadowTex && Q.recv) ? 1 : 0); gl.uniform1f(SKN.p.u.uPcf, Q.pcf ? 1 : 0); gl.uniformMatrix4fv(SKN.p.u.uLightVP, false, LVP); gl.uniform1f(SKN.p.u.uTexel, 1 / SHADOW_SIZE); gl.uniform1f(SKN.p.u.uShW, VQ.sh ? 1.5 * Math.max(SHW.w, SHW.h) / SHADOW_SIZE : .03);
                if (VQ.sh && VQ.csm) { gl.uniformMatrix4fv(SKN.p.u.uLightVPN, false, LVPN); gl.uniform4fv(SKN.p.u.uShA, SHA); gl.uniform1f(SKN.p.u.uCsm, CSM ? 1 : 0); gl.uniform1f(SKN.p.u.uShWN, 1.5 * SHWN / SHADOW_SIZE); }
                gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, shadowTex || white1); gl.uniform1i(SKN.p.u.uShadow, 1);
                gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D_ARRAY, KIT.ok ? KIT.tex : null); gl.uniform1i(SKN.p.u.uKit, 2); gl.uniform1f(SKN.p.u.uKitOn, KIT.ok ? 1 : 0); gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, MDT.ok ? MDT.tex : null); gl.uniform1i(SKN.p.u.uMD, 4); gl.uniform1f(SKN.p.u.uMDOn, MDT.ok ? 1 : 0); gl.activeTexture(gl.TEXTURE0);
            }
            else { gl.useProgram(pPl.p); gl.uniformMatrix4fv(pPl.u.uVP, false, VP); light(pPl); }
            VAO_CUR = null;
            for (i = 0; i < S.n; i++) {
                var a3 = S.st[i]; if (!a3.ok) continue;
                if (SKN) { if (a3.vM) drawActorC(a3, S.pal[i], i, S.hair ? S.hair[i] : 1, S.beard ? S.beard[i] : 0); }
                else { MOD_M.kick = a3.mK; MOD_M.celeb = !!a3.mC; drawActor(a3, S.pal[i], a3.dX, a3.dZ, a3.dYaw, a3.dS, a3.mK || a3.mC ? MOD_M : null, t, S.hair ? S.hair[i] : 1, i, S.beard ? S.beard[i] : 0); }
            }
            if (r.ok) {
                if (SKN) { if (r.vM) drawActorC(r, S.refPal, KIT.refLayer, 1, 0); }
                else drawActor(r, S.refPal, v.rx, v.ry, r.yaw, .97, rm, t, 1, KIT.refLayer);
                if (st.refCard && !(st.refCardT != null && st.refCardT >= 0 && (st.refCardT < .28 || st.refCardT > 2.42))) { // kart (cepten ciktiktan sonra)ı tutan el üzerinde küçük dikdörtgen
                    var sy = Math.sin(r.yaw), cy = Math.cos(r.yaw), hx = v.rx + cy * .28 + sy * .05, hz = v.ry - sy * .28 + cy * .05, hy0 = 2.02;
                    if (SKN && S.refHand) { hx = S.refHand[0]; hz = S.refHand[2]; hy0 = S.refHand[1] - .03; }
                    if (!CARD_BOX) { var cb = []; pushBox(cb, -.05, 0, -.01, .05, .24, .01, [1, 1, 1]); CARD_BOX = upload(cb); }      // [oa] bir kez (eskiden her karede sızan VBO)
                    gl.useProgram(pLit.p); gl.uniformMatrix4fv(pLit.u.uM, false, mtrs(tmpM, hx, hy0, hz, 0, 0, 0, 1)); gl.uniform1f(pLit.u.uEmis, 1); if (st.refCard === 'R') gl.uniform4f(pLit.u.uColor, .9, .1, .18, 1); else gl.uniform4f(pLit.u.uColor, 1, .82, .1, 1);
                    gl.disable(gl.CULL_FACE); gl.bindVertexArray(CARD_BOX.vao); gl.drawArrays(gl.TRIANGLES, 0, CARD_BOX.n); gl.uniform1f(pLit.u.uEmis, 0); gl.uniform4f(pLit.u.uColor, 1, 1, 1, 1); gl.enable(gl.CULL_FACE);
                }
            }
            if (S.arA) {      // [yan] yan hakemler, dorduncu hakem ve bayraklar
                if (SKN) { gl.useProgram(SKN.p.p); VAO_CUR = null; gl.enable(gl.CULL_FACE); }
                for (var adr2 = 0; adr2 < 3; adr2++) { var ad3 = S.arA[adr2]; if (!ad3.ok) continue; if (SKN) { if (ad3.vM) drawActorC(ad3, S.refPal, KIT.refLayer, 1, 0); } else { if (SKN === null || !SKN) { gl.useProgram(pPl.p); } drawActor(ad3, S.refPal, ad3.dX, ad3.dZ, ad3.dYaw, ad3.dS, adr2 < 2 ? MOD_A[adr2] : null, t, 1, KIT.refLayer); } }
                gl.useProgram(pLit.p); gl.uniformMatrix4fv(pLit.u.uVP, false, VP); light(pLit);
                if (!FLAG_GEO) { var fgb = []; pushBox(fgb, -.011, -.03, -.011, .011, .54, .011, [.93, .93, .9]); pushBox(fgb, .011, .32, -.004, .175, .43, .004, [1, .8, .06]); pushBox(fgb, .175, .32, -.004, .34, .43, .004, [.9, .08, .12]); pushBox(fgb, .011, .43, -.004, .175, .54, .004, [.9, .08, .12]); pushBox(fgb, .175, .43, -.004, .34, .54, .004, [1, .8, .06]); FLAG_GEO = upload(fgb); }
                gl.disable(gl.CULL_FACE); gl.uniform4f(pLit.u.uColor, 1, 1, 1, 1); gl.uniform1f(pLit.u.uEmis, 0); gl.bindVertexArray(FLAG_GEO.vao);
                for (var afl = 0; afl < 2; afl++) {
                    var af = S.arA[afl]; if (!af.ok || !af.fOk || !af.vM) continue;
                    var ux = af.fH[0] - af.fE[0], uy = af.fH[1] - af.fE[1], uz = af.fH[2] - af.fE[2], ul = Math.sqrt(ux * ux + uy * uy + uz * uz) || 1; ux /= ul; uy /= ul; uz /= ul;
                    var hx2 = 1, hy2 = 0, hz2 = 0; if (Math.abs(ux) > .7) { hx2 = 0; hy2 = -1; }      // bez: kenar cizgisi boyunca (kameraya donuk); sap yatayken asagi sarkar
                    var dpu = hx2 * ux + hy2 * uy, Xx = hx2 - dpu * ux, Xy = hy2 - dpu * uy, Xz = -dpu * uz, Xl = Math.sqrt(Xx * Xx + Xy * Xy + Xz * Xz) || 1; Xx /= Xl; Xy /= Xl; Xz /= Xl;
                    var Zx = Xy * uz - Xz * uy, Zy = Xz * ux - Xx * uz, Zz = Xx * uy - Xy * ux;
                    FL_M[0] = Xx; FL_M[1] = Xy; FL_M[2] = Xz; FL_M[3] = 0; FL_M[4] = ux; FL_M[5] = uy; FL_M[6] = uz; FL_M[7] = 0; FL_M[8] = Zx; FL_M[9] = Zy; FL_M[10] = Zz; FL_M[11] = 0; FL_M[12] = af.fH[0]; FL_M[13] = af.fH[1]; FL_M[14] = af.fH[2]; FL_M[15] = 1;
                    gl.uniformMatrix4fv(pLit.u.uM, false, FL_M); gl.drawArrays(gl.TRIANGLES, 0, FLAG_GEO.n);
                }
                gl.enable(gl.CULL_FACE);
                var a42 = S.arA[2];
                if (st.v7board && a42 && a42.ok && a42.vM && a42.hR) {      // [v187] tabela: iki elin arasında (siyah çerçeve, kırmızı çıkan / yeşil giren numarası)
                    if (!BOARD7) { var bgq = []; pushBox(bgq, -.3, -.2, -.02, .3, .2, .02, [.05, .05, .06]); pushBox(bgq, -.26, .01, -.03, .26, .17, .03, [.95, .1, .12]); pushBox(bgq, -.26, -.17, -.03, .26, -.01, .03, [.1, .85, .25]); BOARD7 = upload(bgq); }
                    var bmx = (a42.hR[0] + a42.hL[0]) * .5, bmy = (a42.hR[1] + a42.hL[1]) * .5 + .12, bmz = (a42.hR[2] + a42.hL[2]) * .5;
                    gl.uniformMatrix4fv(pLit.u.uM, false, mtrs(tmpM, bmx, bmy, bmz, 0, a42.dYaw, 0, 1)); gl.uniform1f(pLit.u.uEmis, .6); gl.disable(gl.CULL_FACE); gl.bindVertexArray(BOARD7.vao); gl.drawArrays(gl.TRIANGLES, 0, BOARD7.n); gl.uniform1f(pLit.u.uEmis, 0); gl.enable(gl.CULL_FACE);
                }
            }
            if (V7X.n && SKN) {      // [v187] ek aktörler (top görevlisi, giren / çıkan oyuncu)
                gl.useProgram(SKN.p.p); VAO_CUR = null; gl.enable(gl.CULL_FACE);
                for (var x7m = 0; x7m < V7X.n; x7m++) { var x7c = V7X.A[x7m], x7r = st.xa[x7m]; if (!x7c || !x7c.ok || !x7c.vM) continue; drawActorC(x7c, v7XPal(x7r), v7XLayer(x7r), v7XHair(x7r), v7XBeard(x7r)); }
            }
            // --- top ---
            gl.useProgram(pLit.p); gl.uniformMatrix4fv(pLit.u.uVP, false, VP); light(pLit); gl.uniform1f(pLit.u.uEmis, 0);
            gkBall(v);                                                       // [gk] görsel top: kalecinin elinde / kestirilen yolda / bırakış sonrası
            spBall(v);                                                       // [sp] duran top: temasa dek noktada, taçta ellerde, bırakışta motor topuna sönen ofset / yay
            carryHand(v);                                                    // [carry] sahiplik bitti: görünen top motor topuna süzülür
            oaBall(bx, bz, v.owner);                                                  // [oa] vuruş/kafa/kontrol/müdahale: temasa dek temas noktasında, sonra motor topuna (motor topu ışınlanırsa süzülür)
            carryContact(v);                                                 // [fiz] dokunus aninda top ayagin ucunda
            if (CT2_ON) { ctRecv(); ctPush(v); ctGkPost(); }      // [temas] karsilama temasi, top - govde ic ice gecmesi
            ballJump(S.ball);
            if (R._trace && R._trace.length < 40000) {
                var trr = [+CLK.toFixed(3), +GB.x.toFixed(3), +GB.y.toFixed(3), +GB.z.toFixed(3), +v.bx.toFixed(3), +v.by.toFixed(3), +v.bz.toFixed(3), GB.held ? 1 : 0, v.owner, OAB.hc ? OAB.hc.k : (OAB.on ? -2 : OAB.ts ? -3 : -1), GB_HOLD, +BJ.sc.toFixed(2)];
                if (R._traceFeet) {      // [olcum] cizilen pozdan ayak uclari (top sahibi)
                    var tra = v.owner >= 0 ? S.st[v.owner] : null; trr.push(+lastNow.toFixed(1), v.dn || 0, v.dk || 0, v.dOn ? 1 : 0, +(v.dtl || 0).toFixed(3), +(v.gph || 0).toFixed(3));
                    if (tra && tra.ok && tra.rM && tra.dqc) {
                        var TFL = BODY_BIND[BB.FootL], TFR = BODY_BIND[BB.FootR];
                        dqsPt(tra.dqc, BB.FootL, TFL[0], TFL[1] - .04, TFL[2] + .16, CP_T); xform(tra.rM, CP_T, CP_W); trr.push(+CP_W[0].toFixed(3), +CP_W[1].toFixed(3), +CP_W[2].toFixed(3));
                        dqsPt(tra.dqc, BB.FootR, TFR[0], TFR[1] - .04, TFR[2] + .16, CP_T); xform(tra.rM, CP_T, CP_W); trr.push(+CP_W[0].toFixed(3), +CP_W[1].toFixed(3), +CP_W[2].toFixed(3));
                        trr.push(+tra.dX.toFixed(3), +tra.dZ.toFixed(3), +tra.dYaw.toFixed(3), +tra.spd.toFixed(2), +tra.ph.toFixed(3), +(v.dtn || 0).toFixed(3), v.dfn || 0, +CC.ox.toFixed(3), +CC.oz.toFixed(3));
                        dqsPt(tra.dqc, BB.FootL, TFL[0], TFL[1] - .07, TFL[2] - .06, CP_T); xform(tra.rM, CP_T, CP_W); trr.push(+CP_W[0].toFixed(3), +CP_W[1].toFixed(3), +CP_W[2].toFixed(3));
                        dqsPt(tra.dqc, BB.FootR, TFR[0], TFR[1] - .07, TFR[2] - .06, CP_T); xform(tra.rM, CP_T, CP_W); trr.push(+CP_W[0].toFixed(3), +CP_W[1].toFixed(3), +CP_W[2].toFixed(3));
                    }
                }
                R._trace.push(trr);
            }
            var bo = S.ball, bxm = GB.x, bzm = GB.z, by = GB.y, SPS_W = v && v.sps ? v.sps * 2 * Math.PI : 0;      // [v139] motorun yan donusu (rad/sn)
            // [fx] top dönüşü: yerde yuvarlanma (kaymadan yuvarlanmaya hızlı geçiş), havada açısal hız korunur ve yavaşça söner;
            // kalkışta tür: yüksek top geri dönüş (backspin), sert yerden/alçak şut az üst dönüş + yan falso. Zaman: görünen saat (yavaş çekimde yavaş döner)
            var tcl = CLKOK ? CLK : lastNow / 1000, dtv = bo.lc != null ? tcl - bo.lc : 0; bo.lc = tcl;
            var Rb0 = .11 * BSC, bhy = ballY(by), mvx = bxm - bo.px, mvz = bzm - bo.pz, mvy = bhy - (bo.hy != null ? bo.hy : bhy), mv = Math.sqrt(mvx * mvx + mvz * mvz); if (mv > 6 || GB.held) mv = 0;
            if (bo.wx == null) { bo.wx = 0; bo.wy = 0; bo.wz = 0; bo.air = 0; bo.hsp = 0; }
            if (!GB.held && mv > 0 && dtv > 1e-4 && dtv < .25) {
                var vx3 = mvx / dtv, vz3 = mvz / dtv, vy3 = mvy / dtv, hs = mv / dtv, air = bhy > Rb0 + .06;
                var kick = hs - bo.hsp > 6 || (air && !bo.air && vy3 > 2);
                if (air) {
                    if (kick) {
                        var hl = hs || 1, ax = vz3 / hl, az = -vx3 / hl, ssw = SPS_W;      // [v139] yan donus uydurma degil: motorun B.sps'i (devir/sn) - Magnus yonu kavisle ayni (+ = sola kivrilir, dikey eksende +)
                        if (vy3 > 2.5) { var bs = -(8 + .25 * hs); bo.wx = ax * bs; bo.wz = az * bs; bo.wy = ssw; }      // havalı top: geri dönüş
                        else { bo.wx = ax * 3; bo.wz = az * 3; bo.wy = ssw; }                                // sert vuruş: az üst dönüş + motorun falsosu
                    } else { var dk = Math.exp(-dtv * .35); bo.wx *= dk; bo.wz *= dk; bo.wy = SPS_W ? bo.wy + (SPS_W - bo.wy) * (1 - Math.exp(-dtv * 6)) : bo.wy * dk; }      // [v139] havada yan donus motorla es (kavis surdukce)
                } else {
                    var rx = vz3 / Rb0, rz = -vx3 / Rb0, ex = rx - bo.wx, ez = rz - bo.wz, el = Math.sqrt(ex * ex + ez * ez), am = 2.5 * .4 * 9.81 / Rb0 * dtv;      // [v59] yerde: kayan top dönüşünü sürtünme torkuyla kazanır (kayma → yuvarlanma)
                    if (el > am) { bo.wx += ex / el * am; bo.wz += ez / el * am; } else { bo.wx = rx; bo.wz = rz; }
                    bo.wy *= Math.exp(-dtv * 4);
                }
                bo.air = air ? 1 : 0; bo.hsp = hs;
                var wl = Math.sqrt(bo.wx * bo.wx + bo.wy * bo.wy + bo.wz * bo.wz), ang = wl * dtv * (Rb0 / .11 / BSC);
                if (wl > 1e-4 && ang > 1e-5) {
                    var sn = Math.sin(ang / 2), qx1 = bo.wx / wl * sn, qy1 = bo.wy / wl * sn, qz1 = bo.wz / wl * sn, qw1 = Math.cos(ang / 2), x0 = bo.qx, y0 = bo.qy, z0 = bo.qz, w0 = bo.qw;
                    bo.qx = qw1 * x0 + qx1 * w0 + qy1 * z0 - qz1 * y0; bo.qy = qw1 * y0 - qx1 * z0 + qy1 * w0 + qz1 * x0; bo.qz = qw1 * z0 + qx1 * y0 - qy1 * x0 + qz1 * w0; bo.qw = qw1 * w0 - qx1 * x0 - qy1 * y0 - qz1 * z0;
                    var nl = Math.sqrt(bo.qx * bo.qx + bo.qy * bo.qy + bo.qz * bo.qz + bo.qw * bo.qw) || 1; bo.qx /= nl; bo.qy /= nl; bo.qz /= nl; bo.qw /= nl;
                }
            } else if (GB.held) { bo.wx = bo.wy = bo.wz = 0; bo.hsp = 0; }
            bo.hy = bhy;
            var pvx = bo.px, pvy = bo.py, pvz = bo.pz;                        // [vq] hareket bulanıklığı: önceki görünen konum
            bo.px = bxm; bo.pz = bzm; bo.sp = mv / dt;
            BMB.n = 0;
            if (VQ.mat) {
                var bdx = bxm - pvx, bdy = by - pvy, bdz = bzm - pvz, bd3 = Math.sqrt(bdx * bdx + bdy * bdy + bdz * bdz), bsp = bd3 / dt;
                if (!GB.held && bd3 > 1e-5 && bd3 < 6 && bsp > 12 && bsp < 70) { var bL = Math.min(.55, bsp * .012) / bd3; BMB.n = 1; BMB.x = bxm; BMB.y = ballY(by); BMB.z = bzm; BMB.dx = bdx * bL; BMB.dy = bdy * bL; BMB.dz = bdz * bL; BMB.a = clamp((bsp - 12) / 10, 0, 1); }
                bo.py = by;
            }
            var bs0 = BL_S[0]; if (BJ.sc < 1) BL_S[0] = BL_S[1] = BL_S[2] = bs0 * Math.max(.001, BJ.sc);      // [tp] top değişimi: küçülüp büyüme
            BL_T[0] = bxm; BL_T[1] = ballY(by); BL_T[2] = bzm; BL_Q[0] = bo.qx; BL_Q[1] = bo.qy; BL_Q[2] = bo.qz; BL_Q[3] = bo.qw; mquat(tmpM, BL_T, BL_Q, BL_S); gl.uniformMatrix4fv(pLit.u.uM, false, tmpM);
            BL_S[0] = BL_S[1] = BL_S[2] = bs0;
            if (VQ.mat) gl.uniform1f(pLit.u.uSpec, 1);                       // [vq] parlak top yüzeyi
            ballDraw(true);
            if (GHB.on) { BL_T[0] = GHB.x; BL_T[1] = ballY(GHB.y); BL_T[2] = GHB.z; BL_Q[0] = GHB.qx; BL_Q[1] = GHB.qy; BL_Q[2] = GHB.qz; BL_Q[3] = GHB.qw; mquat(tmpM, BL_T, BL_Q, BL_S); gl.uniformMatrix4fv(pLit.u.uM, false, tmpM); ballDraw(true); }      // [fiz] oyundan cikan top
            for (var x7b2 = 0; x7b2 < V7X.nb; x7b2++) { BL_T[0] = V7X.ball[x7b2 * 3]; BL_T[1] = V7X.ball[x7b2 * 3 + 1]; BL_T[2] = V7X.ball[x7b2 * 3 + 2]; mquat(tmpM, BL_T, V7_Q, BL_S); gl.uniformMatrix4fv(pLit.u.uM, false, tmpM); ballDraw(true); }      // [v187] görevlinin elindeki top
            if (st.xb) for (var x7f = 0; x7f + 2 < st.xb.length; x7f += 3) { BL_T[0] = st.xb[x7f]; BL_T[1] = ballY(Math.max(.17, st.xb[x7f + 1])); BL_T[2] = st.xb[x7f + 2]; mquat(tmpM, BL_T, V7_Q, BL_S); gl.uniformMatrix4fv(pLit.u.uM, false, tmpM); ballDraw(true); }      // [v187] çizgi dışında duran eski top
            if (VQ.mat) gl.uniform1f(pLit.u.uSpec, 0);
            gl.uniform4f(pLit.u.uColor, 1, 1, 1, 1);
            // --- yarı saydam: cam, ağlar ---
            gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.disable(gl.CULL_FACE);
            gl.uniformMatrix4fv(pLit.u.uM, false, mident(tmpM)); gl.uniform4f(pLit.u.uColor, 1, 1, 1, .3); gl.bindVertexArray(SC.glass.vao); gl.drawArrays(gl.TRIANGLES, 0, SC.glass.n);
            gl.useProgram(pTex.p); gl.uniform4fv(pTex.u.uMul, U_ONE4); gl.bindTexture(gl.TEXTURE_2D, T.net); try { netStep(SC.net, CLKOK ? CLK : lastNow / 1000); } catch (e) { R._netErr = String(e && e.stack || e); } gl.bindVertexArray(SC.net.vao); gl.drawArrays(gl.TRIANGLES, 0, SC.net.n);
            if (BMB.n) {                                                     // [vq] hızlı top: hız yönünde sönen yumuşak izler
                qn = 0; var gr0 = .11 * BSC * 1.35;
                for (var gk = 1; gk <= 4; gk++) { var gf = gk / 4; qBill(BMB.x - BMB.dx * gf, BMB.y - BMB.dy * gf, BMB.z - BMB.dz * gf, gr0, gr0, .93, .93, .9, .30 * BMB.a * (1 - gf * .65)); }
                qFlush(T.glare);
            }
            gl.depthMask(true); gl.disable(gl.BLEND);
            if (PST) postFinish(PST);
            STAT.frames++;
            return true;
        };
        /* kind: 'shot'|'pass'|'pass_high'|'clear'|'head' (varsayılan 'shot'), power: 0..1 (şut gücü - normalize edilmiş hız).
           Her tür kendi süresini/genliğini/temas-fazını taşır (a üzerinde saklanır, poseFor doğrudan okur) - bu sayede
           pas/şut/uzaklaştırma/kafa vuruşu birbirinden görsel olarak ayrışır (eskiden hepsi aynı tek animasyonu paylaşıyordu). */
        function kickProfile(kind, power) {
            var p = power == null ? .5 : clamp(power, 0, 1), k = kind || 'shot';
            if (k === 'head') return { kind: 'head', dur: .32, cf: null, lg0: null, lg1: null, kn0: null, arm: null, torso: 0 };
            if (k === 'pass') return { kind: 'pass', dur: .26, cf: .22, lg0: .42, lg1: -.60, kn0: .55, arm: .28, torso: 0 };
            if (k === 'pass_high') return { kind: 'pass_high', dur: .36, cf: .19, lg0: .68, lg1: -.95, kn0: .85, arm: .32, torso: 0 };
            if (k === 'clear') return { kind: 'clear', dur: .40, cf: .13, lg0: 1.05, lg1: -1.55, kn0: 1.30, arm: .42, torso: 1.25 };
            return { kind: 'shot', dur: .52 + .16 * p, cf: .16, lg0: 1.0 + .30 * p, lg1: -1.45 - .45 * p, kn0: 1.25 + .35 * p, arm: .52, torso: 1.15 };
        }
        // foot: motorun seçtiği vuruş ayağı ('L'/'R', anatomik); verilmezse oyuncunun güçlü ayağı (S.ft, veritabanından)
        R.kick = function (id, kind, power, foot, tc) {
            var a = S.st && S.st[id]; if (!a) return;
            var pr = kickProfile(kind, power);
            a.kickC = CLKOK ? 1 : 0; a.kickT = CLKOK ? CLK : lastNow / 1000;      // [v133] sim saati (top ayni saatle ucar)
            if (tc != null && CLKOK) a.kickT = tc - (pr.cf != null ? pr.cf : .3) * pr.dur;      // [v135] gecikmeli gosterim: temas karesi topun cikis anina
            a.kickKind = pr.kind; a.kickDur = pr.dur; a.kickCf = pr.cf; a.kickLg0 = pr.lg0; a.kickLg1 = pr.lg1; a.kickKn0 = pr.kn0; a.kickArm = pr.arm; a.kickTorso = pr.torso;
            a.kickFoot = foot === 'L' || foot === 'R' ? foot : (S.ft && S.ft[id]) || 'R';
        };
        /* [gk] kaleci aksiyonu başlat: id, tür (1-7), t0 (başlangıç), tc (temas/bırakış), d (türüne göre veri, kopyalanır):
             1 kurtarış: [şut anı, top x, y, z, vx, vy, vz, bakış x, bakış y, penaltı, doğrudan nokta (1: x,y,z temas noktası)]
             2 havadan alma: [iniş x, iniş y, yükseklik, -, -, -, -, bakış x, bakış y]   3/7: -   4/5/6: [hedef x, hedef y, mesafe, el (1 sağ/-1 sol), ayak]
           Önceki aksiyon sürüyorsa yenisine kısa karışımla geçilir (kaleci yerdeyken gelen atış vb.). Saat: st.clock ile aynı birim. */
        R.gkAct = function (id, k, t0, tc, d) {
            var a = S.st && S.st[id]; if (!a) return null;
            var o = a.ac;
            if (o && o.init && CLKOK) {                                         // [oa] havadaki kafa sendelemeyle kesilmez (inişe dek); düşme/sendeleme/tepki sürerken duran top hazırlığı bitişe ertelenir
                if (k === 13 && o.k === 11 && CLK < o.tl) { t0 = Math.max(t0, o.tl - .04); tc = Math.max(tc, t0); }
                else if (k >= 8 && k <= 10 && o.k >= 13 && o.k <= 15 && CLK < o.te) t0 = Math.min(Math.max(t0, o.te - .15), Math.max(t0, tc - .3));
            }
            var n = gkNew(k, t0, tc, d);
            if (V7_ON && CLKOK && o && (!o.init || CLK < o.t0) && t0 > o.t0 + .02 && o.k >= 11 && k >= 11) {      // [v187] aynı anda kurulan ardışık aksiyonlar (faul hareketi → tepki, düşme → acı): sonraki sıraya girer, öncekini ezmez
                var q7 = a.acQ || (a.acQ = []); q7.push(n); q7.sort(function (x, y) { return x.t0 - y.t0; }); if (q7.length > 4) q7.shift(); return n;
            }
            if (a.acQ && a.acQ.length) { for (var qi = a.acQ.length - 1; qi >= 0; qi--) if (a.acQ[qi].t0 >= t0 - .02) a.acQ.splice(qi, 1); }      // [v187] yeni (erken) aksiyon: sonraki sıradakiler geçersiz
            if (o && o.init && o.k >= 11 && !o.rel && (o.prov || (o.hold && CLK >= o.h0t && CLK < o.h1t))) OAB.pr = o;     // [oa] tutuştaki aksiyon eziliyor: top bırakılacak
            a.acP = (o && o.init && CLK >= o.t0 && CLK < o.te) ? o : null;
            a.ac = n; return n;
        };
        // sonuç: 1 tuttu, 2 çeldi, 3 kaçırdı (havadan almada başkası kazandı). Kestirilmemiş bir kurtarışta (ör. 3B sonradan açıldı) anlık refleks hamlesi.
        R.gkOut = function (id, out, t, x, z, h) {
            var a = S.st && S.st[id]; if (!a) return;
            var ac = a.ac;
            if (ac && (ac.k === 1 || ac.k === 2) && t <= (ac.init ? ac.te : ac.tc + 1.5)) {
                ac.out = out;
                if (!ac.init && ac.t0 > t - .08) ac.t0 = t - .08;          // motor erken kurtardı (dar açı/penaltı): hamle hemen başlar, top görüntüde ele kadar gider
                return;
            }
            if (out === 3) return;
            var yw = a.yaw || 0, px = a.px > -1e9 ? a.px : x, pz = a.pz > -1e9 ? a.pz : z;
            var n = R.gkAct(id, 1, t - .14, t, null); n.d[0] = t; n.d[1] = x; n.d[2] = z; n.d[3] = h || 0; n.d[7] = px + Math.sin(yw) * 6; n.d[8] = pz + Math.cos(yw) * 6; n.d[10] = 1; n.out = out;
        };
        // şut engellendi/saptı: henüz başlamamış plonjon iptal (başladıysa sürer, top kestirimi kullanılmaz)
        R.gkCancel = function (id, t) {
            var a = S.st && S.st[id]; if (!a || !a.ac) return;
            var ac = a.ac; if (ac.k !== 1 && ac.k !== 2) return;
            if (!ac.init && t < ac.t0) { a.ac = a.acP; a.acP = null; } else if (!ac.out) ac.out = 3;
        };
        R.cutBall = function () { if (S.ball) S.ball.gx = null; BJ.on = 0; BJ.sc = 1; GB.cut = 1; };
        /* [v132] kurgu kesmesi (tekrar başı/sonu, döngü, önemli an, VAR görüntüsü): aktör süzgeçleri yeni kareden başlar (dönme/hız rampası yok), kamera hedefe atlar */
        R.cutActors = function () { OLC7.cut = 1;
            if (S.st) for (var i = 0; i < S.st.length; i++) { var a = S.st[i]; if (!a) continue; a.px = NaN; a.pz = NaN; a.latV = 0; a.lonV = 0; a.accS = 0; a.yawR = 0; a.spX = 0; a.spZ = 0; a.cutN = 2; }
            if (S.ref) { S.ref.px = NaN; S.ref.spd = 0; }
            if (S.arA) for (var j = 0; j < S.arA.length; j++) { S.arA[j].px = NaN; S.arA[j].spd = 0; S.arA[j].latV = 0; S.arA[j].lonV = 0; }
            S.cam = null;
        };      // [fm] kurgu kesmesi: gorunen top yeni kareye suzulmeden gecer (isinlanma suzmesi yok)
        R.gkClear = function () { if (S.st) for (var i = 0; i < S.st.length; i++) { var q = S.st[i]; q.ac = null; q.acP = null; q.acQ = null; q.rOx = 0; q.rOz = 0; q.gkC = NaN; q.gX = NaN; } GB.rel = 0; GB.held = false; GB.lh = -1; SPB.on = 0; OAB.on = 0; OAB.hc = null; OAB.pr = null; OAB.lt = -1e9; OAB.mt = 0; };
        /* [sp] duran top aksiyonu güncelle: tc yeni temas/bırakış anı, d türüne göre (8: d[10] = 1 ise olay - gerçek vuruş yönü d[2..3], tür d[5], güç d[6];
           değilse plan (kurulmadan önce); 9: hedef d[2..3], mesafe d[4], yay süresi d[5], atıldı d[6]; 10: sıçrama d[2]); tU: güncelleme anı */
        R.spUpd = function (id, k, tc, d, tU) {
            var a = S.st && S.st[id], ac = a ? a.ac : null, i; if (!ac || ac.k !== k || ac.cx) return;
            if (k === 16) { if (d) { ac.d[0] = d[0]; ac.d[1] = d[1]; if (ac.init && ac.mode === 3) { ac.hx = d[0]; ac.hz = d[1]; } } if (Math.abs(tc - ac.tc) > 1e-4) { ac.tc = tc; if (ac.init && ac.mode === 3) { ac.h0t = tc - .005; ac.h1t = tc + .05; ac.te = tc + .45; } } return; }      // [motor]
            if (k === 9) {
                if (d) { var ny = Math.atan2(d[2] - ac.d[0], d[3] - ac.d[1]); if (ac.init) { ac.yw0 = spYawT(ac, tU); ac.ywT = tU; } else ac.yw0 = ny; ac.yaw = ny; for (i = 2; i < 8; i++) ac.d[i] = d[i]; if (d[6] > 0) ac.thr = true; }
                if (Math.abs(tc - ac.tc) > 1e-4) { ac.tc = tc; if (ac.init) spThrowPlan(ac); }
            } else if (k === 8) {
                if (d && d[10] > 0) {
                    if (ac.init) { ac.ky0 = spKyAt(ac, tU); ac.kyT = tU; ac.ky = angW(Math.atan2(d[2], d[3]) - ac.yaw); } else { ac.d[2] = d[2]; ac.d[3] = d[3]; }
                    ac.d[5] = d[5]; ac.d[6] = d[6]; if (ac.init) ac.pr = kickProfile(SP_PROF[clamp(d[5] | 0, 0, 3)], d[6]);
                } else if (d && !ac.init) for (i = 0; i < 10; i++) ac.d[i] = d[i];
                if (Math.abs(tc - ac.tc) > 1e-4) { ac.tc = tc; if (ac.init) spPlan(ac); }
            } else if (k === 10) { if (d) ac.d[2] = d[2]; ac.tc = tc; ac.te = tc + (ac.d[2] > 0 ? .78 : .3); }
        };
        // yürütülmeden biten ölü top (devre, VAR, yeniden kurulum): aksiyon kısa sürede söner
        /* [oa] oyuncu aksiyonu sonucu/güncellemesi: out 1 kazandı (kafa: top alında tutulur), 3 kaybetti, 5 kart (faul yapan eller belde bekler; te: yeni bitiş) */
        R.oaOut = function (id, out, t, te) {
            var a = S.st && S.st[id], ac = a ? a.ac : null; if (!ac || ac.k < 11) return;
            if (ac.k === 11 && (out === 1 || out === 3) && ac.out !== 1) { ac.out = out; if (out === 1 && ac.init) oaHeadHold(ac); }
            else if (ac.k === 16 && (out === 1 || out === 3)) {
                ac.out = out; if (out === 1) { ac.hold = 1; if (ac.air && ac.init) ac.h1t = Math.max(ac.h1t, ac.tc + .1); }     // [oa] +.06: motor topu ayağa koyduktan sonra bırakılır
                else if (!ac.init) { a.ac = a.acP; a.acP = null; }                 // [oa] havadan topu kaybetti: kurulmamış kontrol iptal
                else { ac.hold = 0; ac.te = Math.min(ac.te, Math.max(t, ac.t0) + .3); }      // başladıysa kısa sürede söner (top başkasında)
            }
            else if (ac.k === 15 && out === 5) { ac.card = 1; ac.tH = Math.max(t, ac.t0 + .9); if (te > ac.te) ac.te = te; }
        };
        R._arA = function () { return (S.arA || []).map(function (a) { return { ok: a.ok, vM: a.vM, x: a.dX, z: a.dZ, yaw: a.dYaw, spd: a.spd, fOk: a.fOk, fH: a.fH ? Array.from(a.fH) : null, fw: a.fw }; }); };      // [yan] test kancasi
        R._gasp = function (o) { if (o && o.surge != null) GA_SURGE = o.surge; if (o && o.on != null) GA_ON = o.on; var G = gaspInit(); return { ok: G.ok, on: GA_ON, n: G.ok ? G.L.map(function (l) { return l.cl.length; }) : null }; };
        R._duzgun = function (o) { if (o.oa3 != null) OA3_FULL = o.oa3; };
        R._oaState = function (i) {
            var a = S.st && S.st[i]; if (!a) return null; var ac = a.ac;
            return { k: ac ? ac.k : 0, init: ac ? !!ac.init : false, mode: ac ? ac.mode || 0 : 0, out: ac ? ac.out : 0, t0: ac ? ac.t0 : 0, tc: ac ? ac.tc : 0, te: ac ? ac.te : 0, oL: ac ? ac.oL : 0, oF: ac ? ac.oF : 0, h: ac ? ac.h || 0 : 0,
                dX: a.dX, dZ: a.dZ, yaw: a.dYaw, rY: a.rY, spd: a.spd, ball: [GB.x, GB.y, GB.z], clk: CLK, oab: OAB.on };
        };
        R.spCancel = function (id, t) { var a = S.st && S.st[id], ac = a ? a.ac : null; if (!ac || ac.k < 8 || ac.k > 10) return; ac.cx = true; if (!ac.init) { a.ac = null; return; } ac.te = Math.min(ac.te, Math.max(t, ac.t0) + .25); };
        R._spState = function (i) {
            var a = S.st && S.st[i]; if (!a) return null; var ac = a.ac;
            return { k: ac ? ac.k : 0, init: ac ? !!ac.init : false, mode: ac ? ac.mode : 0, t0: ac ? ac.t0 : 0, tA: ac ? ac.tA : 0, tB: ac ? ac.tB : 0, tC: ac ? ac.tC : 0, tr: ac ? ac.tr : 0, tc: ac ? ac.tc : 0, te: ac ? ac.te : 0,
                pL: ac ? ac.pL : 0, pF: ac ? ac.pF : 0, foot: ac ? ac.foot : 0, fyaw: ac ? ac.yaw : 0, ky: ac ? ac.ky : 0, dC: ac ? ac.dC : 0, sL: ac ? ac.sL : 0, sF: ac ? ac.sF : 0, dR: ac ? ac.dR : 0, dX: a.dX, dZ: a.dZ, yaw: a.dYaw, rY: a.rY, spd: a.spd, gW: a.gW || 0, ball: [GB.x, GB.y, GB.z], held: GB.held, clk: CLK,
                hR: a.hR ? [a.hR[0], a.hR[1], a.hR[2]] : null, hL: a.hL ? [a.hL[0], a.hL[1], a.hL[2]] : null };
        };
        R._clk = null;                                                     // test: aksiyon saatini elle sabitler (null = st.clock)
        R.actor = function (i) { return S.st ? S.st[i] || null : null; };
        R._carryTab = function () { if (GA_ON && GA_OWN) { var gf = gaspFeet(); if (gf) return gf.tab; } return carryFeet(); };
        R._spin = function () { var b = S.ball; return b ? [b.wx || 0, b.wy || 0, b.wz || 0] : null; };      // [v139] test: gorunen topun acisal hizi (rad/sn)
        R._ayak = function (o) { if (o && o.on != null) FK_ON = o.on; return FK_ON; };
        R.mxSet = function (on) { MX_ON = on ? 1 : 0; KCT = {}; return MX_ON; }; R._mxStat = function () { return { on: MX_ON, c: MXC }; };
        R._kcTrue = function () { var o = {}; ['strike foward jog', 'kick soccerball'].forEach(function (nm) { var s = ADO_MOCAP[nm]; if (s) o[nm] = { cf: s.cf, gercek0: kcTrue(nm, 0, s), gercek1: kcTrue(nm, 1, s) }; }); return o; };      /* [temas] olcum */
        R._gaspTab = function () { GFT = null; return gaspFeet(); }; R._mcOpt = function (o) { if (o.loco != null) MC_LOCO = o.loco; if (o.kick != null) MC_KICK = o.kick; CRF = null; };
        R._mcList = function () { return Object.keys(ADO_MOCAP); }; R._mcInfo = function (n) { var c = mcClip(n); return c ? { len: c.len, n: c.n } : null; };      // [carry] köprü temas evrelerini buradan alır
        // [carry] test kancası: i. oyuncunun iki ayak ucunun dünya konumu (son karedeki kök/evreyle) ve görünen top
        R._carryFoot = function (i) {
            var a = S.st && S.st[i]; if (!a || !(a.px > -1e9)) return null;
            var root = m4(); mtrs(root, a.px, 0, a.pz, 0, a.yaw, 0, a.hScale != null ? a.hScale : .98, a.wScale != null ? a.wScale : .98);
            poseFor(a, a.spd, lastNow / 1000, null); var dq = bodyDQ(pose, new Float32Array(BODY_BONES.length * 8)), FL = BODY_BIND[BB.FootL], FR = BODY_BIND[BB.FootR], q = new Float32Array(3), w = new Float32Array(3);
            dqsPt(dq, BB.FootL, FL[0], FL[1] - .04, FL[2] + .16, q); xform(root, q, w); var L = [w[0], w[1], w[2]];
            dqsPt(dq, BB.FootR, FR[0], FR[1] - .04, FR[2] + .16, q); xform(root, q, w);
            return { L: L, R: [w[0], w[1], w[2]], ball: [GB.x, GB.y, GB.z], ph: a.ph, spd: a.spd, clk: CLK };
        };   // çizim durumu (a.dX/a.dZ: aksiyon/ofsetle görünen konum) - etiketler için, tahsissiz
        R._gkState = function (i) {
            var a = S.st && S.st[i]; if (!a) return null; var ac = a.ac;
            return { k: ac ? ac.k : 0, v: ac ? ac.v : 0, init: ac ? ac.init : false, sgn: ac ? ac.sgn : 0, H: ac ? ac.H : 0, oL: ac ? ac.oL : 0, oF: ac ? ac.oF : 0, oY: ac ? ac.oY : 0, t0: ac ? ac.t0 : 0, tc: ac ? ac.tc : 0, te: ac ? ac.te : 0, out: ac ? ac.out : 0,
                dX: a.dX, dZ: a.dZ, rY: a.rY, yaw: a.dYaw, readyK: a.readyK || 0, holdK: a.holdK || 0, hR: a.hR ? [a.hR[0], a.hR[1], a.hR[2]] : null, hL: a.hL ? [a.hL[0], a.hL[1], a.hL[2]] : null, ball: [GB.x, GB.y, GB.z], held: GB.held, clk: CLK };
        };
        // test-only kancalar (_camGoal/_camState emsali): WebGL/ekran görüntüsü olmadan poseFor'un GERÇEK üretim
        // çıktısını sayısal örnekler - temas zamanlaması, tür ayrışması, top sürme karışımı doğrudan doğrulanabilir.
        // foot: 'L' (varsayılan - eski testlerle uyum: iskelette 'LegR' sallanır) ya da 'R' (anatomik sağ: 'LegL' sallanır)
        R._poseSample = function (kind, power, q, sp, foot) {
            var pr = kickProfile(kind, power);
            var fake = { ph: 0, kickKind: pr.kind, kickDur: pr.dur, kickCf: pr.cf, kickLg0: pr.lg0, kickLg1: pr.lg1, kickKn0: pr.kn0, kickArm: pr.arm, kickTorso: pr.torso, kickFoot: foot || 'L', carryK: 0, takeonK: 0 };
            poseFor(fake, sp || 0, 0, { kick: q, celeb: false });
            return { legR: pose[PK.LegR], shinR: pose[PK.ShinR], legL: pose[PK.LegL], shinL: pose[PK.ShinL], torsoX: pose[PK.Torso], torsoY: pose[PK.Torso + 1], head: pose[PK.Head], armL: pose[PK.ArmL], armR: pose[PK.ArmR], dur: pr.dur, cf: pr.cf };
        };
        R._carrySample = function (carryK, takeonK, sp, ph, t) {
            var fake = { ph: ph || 0, carryK: carryK || 0, takeonK: takeonK || 0 };
            poseFor(fake, sp == null ? 3 : sp, t || 0, null);
            return { legR: pose[PK.LegR], shinR: pose[PK.ShinR], legL: pose[PK.LegL], footL: pose[PK.FootL], torsoX: pose[PK.Torso], torsoY: pose[PK.Torso + 1], hipY: pose[PK.Hips + 1], armR: pose[PK.ArmR] };
        };
        // test-only kanca: i. oyuncunun yüz noktalarının (göz, yanak, alın) GERÇEK deri-bağlı dünya konumu - son karedeki poz/kök ile
        R._facePts = function (i) {
            var a = S.st && S.st[i]; if (!a || !SKN) return null;
            var root = m4(); mtrs(root, a.px, 0, a.pz, 0, a.yaw, 0, a.hScale != null ? a.hScale : .98, a.wScale != null ? a.wScale : .98);
            poseFor(a, a.spd, lastNow / 1000, null); var dq = bodyDQ(pose, new Float32Array(BODY_BONES.length * 8));
            var hsF = a.hScale != null ? a.hScale : .98, wsF = a.wScale != null ? a.wScale : .98;
            function W(lp) { var q = dqsPoint(dq, BB.Head, BB.Head, 0, propBind([HEAD_C[0] + lp[0], HEAD_C[1] + lp[1], HEAD_C[2] + lp[2]], hsF, wsF)); return [root[0] * q[0] + root[4] * q[1] + root[8] * q[2] + root[12], root[1] * q[0] + root[5] * q[1] + root[9] * q[2] + root[13], root[2] * q[0] + root[6] * q[1] + root[10] * q[2] + root[14]]; }
            return { eye: W([EYE_C[0], EYE_C[1], EYE_C[2] + EYE_R]), cheek: W([.046 * HEAD_S, -.026 * HEAD_S, .074 * HEAD_S]), forehead: W([0, .05 * HEAD_S, .092 * HEAD_S]), browSkin: W([0, .030 * HEAD_S, .095 * HEAD_S]), nose: W([0, -.012 * HEAD_S, .101 * HEAD_S]), head: W([0, 0, 0]), top: W([0, HEAD_R[1], -.004]) };
        };
        // test-only kanca: doğal duruş - dururken (sp=0) kontrapposto / eller belde / topa bakış örneklemesi (WebGL'siz, poseFor'un GERÇEK çıktısı)
        R._idleSample = function () {
            var a = { ph: 0, vary: .2, stanceB: 1, hipsK: 0, look: 0 };
            poseFor(a, 0, 1, null); var o = { kneeL: pose[PK.ShinL], kneeR: pose[PK.ShinR], foreL: pose[PK.ForeL], foreR: pose[PK.ForeR], hipZ: pose[PK.Hips + 2] };
            a.hipsK = 1; poseFor(a, 0, 1, null); o.hips = { foreL: pose[PK.ForeL], armLz: pose[PK.ArmL + 2], armLx: pose[PK.ArmL] };
            a.hipsK = 0; a.look = .8; poseFor(a, 0, 1, null); o.lookHead = pose[PK.Head + 1];
            return o;
        };
        // test-only kanca: R.setMatch'e verilen p.h/p.w/p.sk (boy/kilo/ten rengi) GERÇEKTEN S.st[i].hScale/wScale
        // ve S.pal[i]'nin ten yuvasına (indeks 3) ulaşıyor mu - ekran görüntüsü olmadan uçtan uca veri akışı kanıtı.
        R._appearance = function (i) {
            var a = S.st && S.st[i], p = S.pal && S.pal[i]; if (!a || !p) return null;
            return { hScale: a.hScale, wScale: a.wScale, skin: [p[9], p[10], p[11]] };
        };
        // test-only kanca: veritabanındaki saç stili / saç rengi / sakal / güçlü ayak 3B katmana (S.hair/S.beard/S.ft + paletin saç yuvası) ulaştı mı
        R._look = function (i) {
            var p = S.pal && S.pal[i]; if (!p || !S.hair) return null;
            var a = S.st && S.st[i];
            return { hair: S.hair[i], beard: S.beard ? S.beard[i] : null, ft: S.ft ? S.ft[i] : null, hairColor: [p[12], p[13], p[14]], kickFoot: a ? a.kickFoot || null : null };
        };
        // test-only kanca (_camState emsali): R.refreshAppearance'ın S.st[i]'yi YERİNDE güncellediğini, S.setMatch
        // gibi sıfırdan (px/pz=null) yeniden KURMADIĞINI kanıtlar - konum/poz bozulmadığının doğrudan sayısal delili.
        R._posState = function (i) {
            var a = S.st && S.st[i]; if (!a) return null;
            return { px: a.px, pz: a.pz, ph: a.ph, kickT: a.kickT, yaw: a.yaw };
        };
        R.pick = function (mx, my, v, radiusMin) {
            var best = -1, bd = 1e9, i, p, top, bot, hh, rad;
            for (i = 0; i < S.n; i++) {
                if (v.x[i] < -20) continue; bot = R.project(v.x[i], 0, v.y[i]); top = R.project(v.x[i], 1.8, v.y[i]); if (!bot || !top) continue;
                hh = Math.max(4, bot.y - top.y); rad = Math.max(radiusMin || 12, hh * .5);
                var cx = bot.x, cy = (bot.y + top.y) / 2, d = Math.hypot(mx - cx, (my - cy) * .7); if (d < rad && d < bd) { bd = d; best = i; }
            }
            if (v.rx != null) { bot = R.project(v.rx, 0, v.ry); top = R.project(v.rx, 1.8, v.ry); if (bot && top) { hh = Math.max(4, bot.y - top.y); rad = Math.max(radiusMin || 12, hh * .5); var d2 = Math.hypot(mx - bot.x, (my - (bot.y + top.y) / 2) * .7); if (d2 < rad && d2 < bd) { best = 22; bd = d2; } } }
            return best;
        };
        R.dispose = function () { try { var e = gl.getExtension('WEBGL_lose_context'); if (e) e.loseContext(); } catch (er) { } };
        return R;
    }
    G.Ado3D = { supported: supported, hw: function () { supported(); return !!supported._hw; }, create: create, SKIN: SKIN, HAIR: HAIR, gkPredict: gkPredict, ballPhys: ballPhys, _m: { proceduralBall: proceduralBall, m4: m4, mmul: mmul, mlook: mlook, mpersp: mpersp, mtrs: mtrs, parseGLB: parseGLB, fitEllipseR: fitEllipseR, ringsFromMesh: ringsFromMesh, revolvePart: revolvePart, upgradePlayerMeshes: upgradePlayerMeshes, PLAYER_HD_SEGS: PLAYER_HD_SEGS, JOINT_MARGIN: JOINT_MARGIN }, _body: { buildBody: buildBody, bodyDQ: bodyDQ, dqsPoint: dqsPoint, BONES: BODY_BONES, BIND: BODY_BIND, SLOT_N: SLOT_N, HAIR_STYLES: HAIR_STYLES, headPoint: headPoint } };
})();

