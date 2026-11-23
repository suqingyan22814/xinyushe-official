#!/bin/sh
# 由 data/*.json 生成 data/data.js（file:// 本地预览降级数据源）
# 用法：在站点根目录执行 sh tools/build-data.sh
set -e
cd "$(dirname "$0")/.."
out=data/data.js.tmp
echo '/* 自动生成：file:// 本地预览降级数据源。修改 data/*.json 后请重新运行 tools/build-data.sh */' > "$out"
emit() {
  printf "window.__XY_DATA__ = window.__XY_DATA__ || {};\n" >> "$out"
  printf "window.__XY_DATA__['%s'] = " "$2" >> "$out"
  cat "data/$1.json" >> "$out"
  printf ";\n" >> "$out"
}
emit site site
emit banner banner
emit news news
emit timeline timeline
emit people people
emit zones zones
emit events events
emit mod-list modList
emit mod-timeline modTimeline
emit wiki wiki
emit faq faq
emit history-volumes historyVolumes
emit org org
emit surveys surveys
emit emergency emergency
emit groups groups
emit archive archive
mv "$out" data/data.js
printf "data.js 生成完成：%s 字节，%s 个数据键\n" "$(wc -c < data/data.js)" "$(grep -c '__XY_DATA__\[' data/data.js)"