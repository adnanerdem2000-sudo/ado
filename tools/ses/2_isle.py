#!/usr/bin/env python3
# Ses paketini işler: kes, filtrele, seviye eşle, döngü yap, MP3'e kodla, snd_data.js üret.
# [v140] Kullanım: python3 tools/ses/2_isle.py <indirme klasörü> <çıkış klasörü> src/adoball/data/snd_data.js
# Gerekenler: ffmpeg (libmp3lame), numpy. Kaynaklar ve lisanslar: src/adoball/SESLER.md
import sys, os, json, subprocess, base64, numpy as np
DL, OUT, JS = sys.argv[1], sys.argv[2], sys.argv[3]
SR = 22050
os.makedirs(OUT, exist_ok=True)

# key, kaynak id, başlangıç s, süre s, fade-in s, fade-out s, mod, hedef dB, hp Hz, lp Hz, kbps, ek
SPEC = [
    # tribün uğultusu: 40 sn kesintisiz döngü (3 sn çapraz geçiş)
    ("CrowdLoop",   "424354",  1.0, 40.0, 0, 0,    "rms", -16.0,  70, 9000, 32, {"loop": 3.0}),
    ("CrowdChant",  "500250",  0.3, 17.0, 1.2, 2.5, "rms", -15.0, 70, 9000, 32, {}),
    ("CrowdChant2", "500250", 61.0, 16.0, 1.2, 2.5, "rms", -15.0, 70, 9000, 32, {}),
    ("CrowdRoar",   "528799",  1.0, 11.0, 0.15, 3.5, "rms", -15.0, 60, 10000, 48, {}),
    ("CrowdRoar2",  "241630",  0.2, 8.0, 0.05, 3.0, "rms", -15.0, 60, 10000, 48, {}),
    ("CrowdOoh",    "494362",  2.6, 4.8, 0.3, 1.6, "rms", -16.0, 70, 9000, 40, {}),
    ("CrowdOoh2",   "612131", 30.8, 5.0, 0.4, 1.8, "rms", -16.0, 70, 9000, 40, {}),
    ("CrowdGroan",  "763880",  0.7, 5.5, 0.1, 1.8, "rms", -17.0, 70, 9000, 40, {}),
    ("Applause",    "160493",  1.0, 6.0, 0.25, 2.2, "rms", -17.0, 70, 10000, 40, {}),
    ("CrowdCheer",  "221567",  0.2, 6.5, 0.1, 2.0, "rms", -17.0, 70, 10000, 40, {}),
    ("CrowdWhistle","557189",  1.2, 8.0, 0.4, 2.0, "rms", -17.0, 70, 10000, 40, {}),
    ("Kick",        "555042",  None, 0.32, 0.004, 0.18, "peak", -1.0, 50, 10000, 48, {"at": 0.05}),
    ("Kick2",       "446639",  None, 0.30, 0.004, 0.16, "peak", -1.0, 50, 10000, 48, {"at": 0.05}),
    ("Kick3",       "515908",  None, 0.32, 0.004, 0.18, "peak", -1.0, 50, 10000, 48, {"at": 2.2}),
    ("KickHard",    "515908",  None, 0.40, 0.004, 0.22, "peak", -1.0, 40, 10000, 48, {"at": 8.1}),
    ("KickHard2",   "515908",  None, 0.40, 0.004, 0.22, "peak", -1.0, 40, 10000, 48, {"at": 11.0}),
    ("Header",      "795715",  None, 0.30, 0.004, 0.16, "peak", -1.0, 60, 9000, 48, {"at": 1.0}),
    ("Net",         "816989",  0.08, 0.62, 0.01, 0.3, "peak", -1.0, 80, 10000, 48, {}),
    ("Post",        "781717",  0.52, 1.8, 0.005, 0.9, "peak", -1.0, 60, 10000, 48, {}),
    ("Whistle",     "538422",  0.0, 0.48, 0.01, 0.12, "peak", -1.0, 900, 10000, 48, {}),
    ("Whistle2",    "218318",  0.05, 0.75, 0.01, 0.3, "peak", -1.0, 900, 10000, 48, {}),
    ("WhistleLong", "817398",  0.0, 1.55, 0.01, 0.25, "peak", -1.0, 900, 10000, 48, {}),
]
PRE = 0.5   # döngü dosyasında baş/son pay (MP3 kod çözücü gecikmesine karşı)

def load(sid, start, dur):
    p = os.path.join(DL, sid + ".mp3")
    cmd = ["ffmpeg", "-nostdin", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"]
    x = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).copy()
    return x

def filt(x, hp, lp):
    cmd = ["ffmpeg", "-nostdin", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
           "-af", "highpass=f=%d,lowpass=f=%d" % (hp, lp), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, input=x.tobytes(), capture_output=True, check=True).stdout, dtype=np.float32).copy()

def fades(y, fi, fo):
    n = len(y)
    if fi > 0:
        k = min(n, int(fi * SR)); y[:k] *= np.sin(np.linspace(0, np.pi / 2, k)) ** 2
    if fo > 0:
        k = min(n, int(fo * SR)); y[n - k:] *= np.cos(np.linspace(0, np.pi / 2, k)) ** 2
    return y

def softlim(y, th=0.85):
    # yumuşak tepe sınırlayıcı (eşik üstü tanh)
    a = np.abs(y); o = a > th
    y = y.copy(); y[o] = np.sign(y[o]) * (th + (1 - th) * np.tanh((a[o] - th) / (1 - th)))
    return y

def enc(y, kbps, path):
    cmd = ["ffmpeg", "-nostdin", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
           "-c:a", "libmp3lame", "-b:a", "%dk" % kbps, "-id3v2_version", "0", path]
    subprocess.run(cmd, input=y.astype(np.float32).tobytes(), check=True)
    return open(path, "rb").read()

data = {}; rep = []
for key, sid, st, dur, fi, fo, mode, tgt, hp, lp, kb, ex in SPEC:
    x = filt(load(sid, st, dur), hp, lp)
    if st is None:
        # vuruş: verilen zamanın ±0,3 sn çevresinde en güçlü tepeyi bul, 12 ms önceden başla
        c = int(ex["at"] * SR); a, b = max(0, c - int(.3 * SR)), min(len(x), c + int(.3 * SR))
        pk = a + int(np.argmax(np.abs(x[a:b])))
        # tepe öncesi ilk belirgin yükselişi bul
        s0 = pk
        thr = abs(x[pk]) * 0.08
        while s0 > a and np.max(np.abs(x[max(a, s0 - 64):s0])) > thr: s0 -= 64
        st = max(0, s0 - int(.005 * SR)) / SR
    y = x[int(st * SR): int((st + dur + ex.get("loop", 0)) * SR)].copy()
    meta = {}
    if "loop" in ex:
        L = int(dur * SR); X = int(ex["loop"] * SR)
        seg = y
        t = np.linspace(0, np.pi / 2, X)
        lp_ = seg[:L].copy()
        lp_[:X] = seg[:X] * np.sin(t) + seg[L:L + X] * np.cos(t)   # eşit güçlü çapraz geçiş: döngü sonu -> başı kesintisiz
        P = int(PRE * SR)
        y = np.concatenate([lp_[L - P:], lp_, lp_[:P]])
        meta = {"ls": PRE, "le": PRE + dur}
    else:
        y = fades(y, fi, fo)
    if mode == "rms":
        act = y[np.abs(y) > 1e-4]
        # etkin bölümün (en yüksek %60 pencere) RMS'i
        w = int(.1 * SR); k = len(y) // w
        fr = np.sqrt((y[:k * w].reshape(k, w) ** 2).mean(1)); fr.sort()
        r = np.sqrt((fr[int(k * .4):] ** 2).mean()) if "loop" not in ex else np.sqrt((y ** 2).mean())
        g = 10 ** (tgt / 20) / (r + 1e-9)
        y = softlim(y * g)
    else:
        g = 10 ** (tgt / 20) / (np.abs(y).max() + 1e-9); y = y * g
    raw = enc(y, kb, os.path.join(OUT, key + ".mp3"))
    peak = 20 * np.log10(np.abs(y).max()); rms = 20 * np.log10(np.sqrt((y ** 2).mean()))
    rep.append((key, sid, round(st, 3), round(len(y) / SR, 2), round(peak, 1), round(rms, 1), len(raw)))
    data[key] = dict(f="mp3", n=len(y), d=base64.b64encode(raw).decode(), **meta)

for r in rep: print("%-12s %-7s st=%-7s dur=%-6s peak=%-5s rms=%-6s %6d B" % r)
tot = sum(r[-1] for r in rep)
# snd_data.js: tek satır
parts = []
for k, v in data.items():
    m = ",".join("%s:%s" % (a, json.dumps(v[a])) for a in ("f", "n", "ls", "le") if a in v)
    parts.append("%s:{%s,d:'%s'}" % (k, m, v["d"]))
js = "    var SND_DATA = {" + ",".join(parts) + "};\n"
open(JS, "w").write(js)
print("toplam mp3:", tot, "B; js:", len(js), "B")
