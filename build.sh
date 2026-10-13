#!/usr/bin/env bash
# Oyunu src/ parçalarından derler: dist/futbol-kariyeri.html. Başarılıysa son satır SYNTAX_OK.
# Ek seçenekler tools/build.js'e geçer (ör. --check, --verify <dosya.html>, --out <yol>).
set -e
cd "$(dirname "$0")"
node tools/build.js "$@"
