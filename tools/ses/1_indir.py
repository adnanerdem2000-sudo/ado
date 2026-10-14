#!/usr/bin/env python3
# [v140] Freesound ses sayfasını açar, lisansı doğrular, hq mp3 önizlemesini indirir; meta bilgiyi meta.jsonl satırı olarak ekler.
# Kullanım: python3 tools/ses/1_indir.py <indirme klasörü> <ses id> [<ses id> ...]  (id listesi: src/adoball/SESLER.md)
import sys, re, json, urllib.request, html, os
out = sys.argv[1]
os.makedirs(out, exist_ok=True)
meta_path = os.path.join(out, "meta.jsonl")
for sid in sys.argv[2:]:
    url = "https://freesound.org/s/%s/" % sid
    try:
        req = urllib.request.urlopen(url, timeout=30)
        page_url = req.geturl()
        t = req.read().decode("utf8", "replace")
    except Exception as e:
        print(sid, "ERR", e); continue
    lic = re.search(r'href="(https?://creativecommons\.org/[^"]+)"', t)
    lictxt = re.search(r'title="License: ([^"]*)"', t) or re.search(r'(Creative Commons 0|Attribution[^<"]*)', t)
    title = re.search(r'<meta property="og:title" content="([^"]*)"', t)
    m = re.search(r'/people/([^/"]+)/sounds/%s/' % sid, page_url) or re.search(r'/people/([^/"]+)/sounds/%s/' % sid, t)
    prev = re.search(r'(https://cdn\.freesound\.org/previews/\d+/%s_\d+-hq\.mp3)' % sid, t)
    if not prev:
        lq = re.search(r'(https://cdn\.freesound\.org/previews/\d+/%s_\d+)-lq\.mp3' % sid, t)
        prev = lq and re.match(r'(.*)', lq.group(1) + "-hq.mp3")
    rec = dict(id=sid, url=page_url, author=html.unescape(m.group(1)) if m else "?",
               title=html.unescape(title.group(1)) if title else "?",
               license=lictxt.group(1) if lictxt else "?", license_url=lic.group(1) if lic else "?",
               preview=prev.group(1) if prev else None)
    if rec["preview"]:
        fn = os.path.join(out, "%s.mp3" % sid)
        if not os.path.exists(fn):
            with urllib.request.urlopen(rec["preview"], timeout=60) as r, open(fn, "wb") as f: f.write(r.read())
        rec["file"] = fn
    print(json.dumps(rec, ensure_ascii=False))
    with open(meta_path, "a") as f: f.write(json.dumps(rec, ensure_ascii=False) + "\n")
