/* =====================================================================
   ADOBALL · 3B GÖRÜNÜM MOTORU (WebGL2, kütüphanesiz)
   Godot 4.3 ile hazırlanan modelleri (ADO3D_GLB_B64: oyuncu, top, kale, bayrak, yedek kulübesi, VAR kabini, projektör) çizer.
   Simülasyona / oyun kayıtlarına dokunmaz: yalnızca 2D köprünün verdiği görünüm karelerini (oyuncu x/y/yön, top x/y/yükseklik, hakem) çizer.
   Dünya: X = simülasyon x (m), Z = simülasyon y (m), Y yukarı. Sahanın alt kenarı (y = PH) kameraya yakındır (2D ekranla aynı yön).
   ===================================================================== */
(function () {
    'use strict';
    var G = window;

    /* ---------- matematik (sütun-öncelikli 4x4) ---------- */
    function m4() { var m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; }
    function mmul(o, a, b) {
        var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3], a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7], a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11], a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
        for (var c = 0; c < 4; c++) {
            var b0 = b[c * 4], b1 = b[c * 4 + 1], b2 = b[c * 4 + 2], b3 = b[c * 4 + 3];
            o[c * 4] = a00 * b0 + a10 * b1 + a20 * b2 + a30 * b3; o[c * 4 + 1] = a01 * b0 + a11 * b1 + a21 * b2 + a31 * b3;
            o[c * 4 + 2] = a02 * b0 + a12 * b1 + a22 * b2 + a32 * b3; o[c * 4 + 3] = a03 * b0 + a13 * b1 + a23 * b2 + a33 * b3;
        }
        return o;
    }
    function mcopy(o, a) { for (var i = 0; i < 16; i++) o[i] = a[i]; return o; }
    function mident(o) { for (var i = 0; i < 16; i++) o[i] = 0; o[0] = o[5] = o[10] = o[15] = 1; return o; }
    function mpersp(o, fovy, asp, n, f) {
        var t = 1 / Math.tan(fovy / 2); for (var i = 0; i < 16; i++) o[i] = 0;
        o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f); return o;
    }
    function mortho(o, l, r, b, t, n, f) {
        for (var i = 0; i < 16; i++) o[i] = 0;
        o[0] = 2 / (r - l); o[5] = 2 / (t - b); o[10] = -2 / (f - n); o[15] = 1;
        o[12] = -(r + l) / (r - l); o[13] = -(t + b) / (t - b); o[14] = -(f + n) / (f - n); return o;
    }
    function mlook(o, ex, ey, ez, tx, ty, tz) {
        var zx = ex - tx, zy = ey - ty, zz = ez - tz, l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
        var xx = zz, xy = 0, xz = -zx, lx = Math.hypot(xx, xz) || 1; xx /= lx; xz /= lx;            // yukarı = +Y
        var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
        o[0] = xx; o[1] = yx; o[2] = zx; o[3] = 0; o[4] = xy; o[5] = yy; o[6] = zy; o[7] = 0; o[8] = xz; o[9] = yz; o[10] = zz; o[11] = 0;
        o[12] = -(xx * ex + xy * ey + xz * ez); o[13] = -(yx * ex + yy * ey + yz * ez); o[14] = -(zx * ex + zy * ey + zz * ez); o[15] = 1; return o;
    }
    /* yerel dönüşüm: T · Rx · Ry · Rz · S. S köşegeni (sxz,sy,sxz) - yani YEREL Y (yükseklik) ile YEREL X/Z (genişlik/derinlik,
       "yapı") ayrı ölçeklenebilir; sxz verilmezse sy'ye eşitlenir (tek ölçekli ESKİ çağrılarla bire bir aynı sonucu verir -
       geriye dönük uyumlu). S, R'den ÖNCE (yerel eksende) uygulandığı için oyuncunun bakış yönünden (yaw) BAĞIMSIZ, her zaman
       kendi gövdesine göre "daha uzun" ya da "daha geniş" görünür. */
    function mtrs(o, tx, ty, tz, ax, ay, az, sy, sxz) {
        if (sxz == null) sxz = sy;
        var cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), syy = Math.sin(ay), cz = Math.cos(az), sz = Math.sin(az);
        // R = Rx * Ry * Rz
        var r00 = cy * cz, r01 = -cy * sz, r02 = syy;
        var r10 = sx * syy * cz + cx * sz, r11 = -sx * syy * sz + cx * cz, r12 = -sx * cy;
        var r20 = -cx * syy * cz + sx * sz, r21 = cx * syy * sz + sx * cz, r22 = cx * cy;
        o[0] = r00 * sxz; o[1] = r10 * sxz; o[2] = r20 * sxz; o[3] = 0; o[4] = r01 * sy; o[5] = r11 * sy; o[6] = r21 * sy; o[7] = 0; o[8] = r02 * sxz; o[9] = r12 * sxz; o[10] = r22 * sxz; o[11] = 0;
        o[12] = tx; o[13] = ty; o[14] = tz; o[15] = 1; return o;
    }
    function mquat(o, t, q, s) {
        var x = q[0], y = q[1], z = q[2], w = q[3], x2 = x + x, y2 = y + y, z2 = z + z, xx = x * x2, xy = x * y2, xz = x * z2, yy = y * y2, yz = y * z2, zz = z * z2, wx = w * x2, wy = w * y2, wz = w * z2;
        o[0] = (1 - (yy + zz)) * s[0]; o[1] = (xy + wz) * s[0]; o[2] = (xz - wy) * s[0]; o[3] = 0;
        o[4] = (xy - wz) * s[1]; o[5] = (1 - (xx + zz)) * s[1]; o[6] = (yz + wx) * s[1]; o[7] = 0;
        o[8] = (xz + wy) * s[2]; o[9] = (yz - wx) * s[2]; o[10] = (1 - (xx + yy)) * s[2]; o[11] = 0;
        o[12] = t[0]; o[13] = t[1]; o[14] = t[2]; o[15] = 1; return o;
    }
    function lin2s(c) { return c <= .0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - .055; }
    function hex2rgb(h) { h = String(h || '#888').replace('#', ''); if (h.length === 3) h = h.replace(/./g, function (c) { return c + c; }); var n = parseInt(h, 16); if (isNaN(n)) n = 0x888888; return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; }
    function lum(c) { return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; }
    function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
    function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
    function hash(s) { var h = 2166136261 >>> 0; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
    /* ---------- oyuncu pozu: biyomekanik-temelli yardımcılar (bkz. poseFor) ---------- */
    function lerp2(a, b, t) { return a + (b - a) * t; }
    function smooth01(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }               // smoothstep, C1 sürekli
    var D2R = Math.PI / 180;
