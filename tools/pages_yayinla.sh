#!/bin/bash
# GitHub Pages'e yayın: dist + çevrimdışı dosyaları (pages/) gh-pages dalına koyar. Kullanım: bash tools/pages_yayinla.sh <gh-pages klon klasörü> "commit mesajı"
set -e
K="$1"; M="$2"; R="$(cd "$(dirname "$0")/.." && pwd)"
[ -d "$K/.git" ] || git clone -q --depth 1 -b gh-pages "$(git -C "$R" remote get-url origin)" "$K"
git -C "$K" pull -q origin gh-pages
cp "$R/dist/futbol-kariyeri.html" "$K/index.html"
cp "$R/pages/manifest.webmanifest" "$R/pages/icon-180.png" "$R/pages/icon-192.png" "$R/pages/icon-512.png" "$K/"
S=$(md5sum "$R/dist/futbol-kariyeri.html" | cut -c1-12); sed "s/SURUM_YER/$S/" "$R/pages/sw.js" > "$K/sw.js"
touch "$K/.nojekyll"; git -C "$K" add -A; git -C "$K" commit -qm "$M" && git -C "$K" push -q origin gh-pages; git -C "$K" log --oneline -1
