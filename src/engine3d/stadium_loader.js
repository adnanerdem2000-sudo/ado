var ADO_STAD = { ready: false };
(function () {
    try {
        var D = typeof ADO_STAD_DATA !== 'undefined' ? ADO_STAD_DATA : null; if (!D) return;
        var bin = atob(D.z), u8 = new Uint8Array(bin.length), i; for (i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        /* v151: DecompressionStream yoksa yedek JS inflate (adoAc, 178_v151) */
        var ac = typeof adoAc === 'function' ? adoAc(u8).then(function (u) { return u.byteOffset === 0 && u.byteLength === u.buffer.byteLength ? u.buffer : u.slice().buffer; })
            : (typeof DecompressionStream === 'undefined' ? Promise.reject(0) : new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer());
        ac.then(function (ab) {
            var n = D.n, ni = D.ni, ns = D.ns, o = 0, p4 = function (b) { return (b + 3) & ~3; }, k;
            var q = new Int16Array(ab, o, n * 3); o += p4(n * 6);
            var nr = new Int8Array(ab, o, n * 3); o += p4(n * 3);
            var li = new Uint8Array(ab, o, n * 3); o += p4(n * 3);
            var al = new Uint8Array(ab, o, n * 3); o += p4(n * 3);
            var cl = new Uint8Array(ab, o, n); o += p4(n);
            var ix = new Uint32Array(ab, o, ni); o += ni * 4;
            var sq = new Int16Array(ab, o, ns * 5); o += p4(ns * 10);
            var sbu = new Uint8Array(ab, o, ns * 4), sbs = new Int8Array(ab, o, ns * 4);
            var pos = new Float32Array(n * 3), sp = new Float32Array(ns * 5), MAP = [0, 1, 2, 0, 2];
            for (k = 0; k < n * 3; k++) pos[k] = D.mn[k % 3] + (q[k] + 32767) * D.sc[k % 3];
            for (k = 0; k < ns * 5; k++) sp[k] = D.mn[MAP[k % 5]] + (sq[k] + 32767) * D.sc[MAP[k % 5]];
            ADO_STAD = { ready: true, n: n, ni: ni, ns: ns, pos: pos, nrm: nr, light: li, alb: al, cls: cl, idx: ix, sp: sp, sbu: sbu, sbs: sbs, kuleler: D.kuleler, lsc: D.isik };
            try { window.ADO_STAD = ADO_STAD; } catch (e) { }
        }).catch(function () { });
    } catch (e) { }
})();
