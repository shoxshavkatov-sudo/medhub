#!/usr/bin/env bash
# Сборка статического сайта для Render (buildCommand в render.yaml).
# CDN Render кэширует js/css до часа и не различает ?v= в адресе, поэтому после деплоя
# мог отдаваться старый app.js. Решение: каждая сборка кладёт js и css в новую папку
# r/<время сборки>/ и index.html ссылается на неё — у каждой версии свой адрес.
# Корневые js/ и css/ тоже остаются (на случай старого index.html в кэше браузера).
set -euo pipefail
rm -rf dist
mkdir -p dist
cp -R index.html js css img vendor models dist/
R="r/$(date +%s)"
mkdir -p "dist/$R"
cp -R js css "dist/$R/"
sed -i -e "s|\"js/|\"$R/js/|g" -e "s|\"css/|\"$R/css/|g" dist/index.html
echo "build: js/css → /$R/"
