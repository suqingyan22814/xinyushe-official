#!/bin/sh
# 一键部署到 Cloudflare Pages（直传）
#
# 用法：
#   export CLOUDFLARE_API_TOKEN=<你的 Token>
#   export CLOUDFLARE_ACCOUNT_ID=<账户 ID>
#   sh tools/deploy.sh
#
# 说明：
#   - Pages 项目是「直接上传」模式，不连 Git，所以改完数据要跑一次本脚本才会生效
#   - GitHub 仓库只是存档，push 不会触发部署
#   - 上传前会排除 source/、.git、*.zip、*.bak、tools/（工具目录不需要上线）
set -e

ROOT=$(cd "$(dirname "$0")/.." && pwd)
STAGE=$(mktemp -d)
trap 'rm -rf "$STAGE"' EXIT

echo "→ 准备上传目录"
cd "$ROOT"
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "local")

for item in index.html plus.html admin assets data 404.html _headers _redirects; do
    [ -e "$item" ] && cp -r "$item" "$STAGE/"
done
cp *.jpg *.png "$STAGE/" 2>/dev/null || true

COUNT=$(find "$STAGE" -type f | wc -l)
SIZE=$(du -sh "$STAGE" | cut -f1)
echo "  文件 $COUNT 个，共 $SIZE"

echo "→ 部署到 xinyushe"
cd "$STAGE"
npx --yes wrangler@latest pages deploy . \
    --project-name xinyushe \
    --commit-dirty=true \
    --commit-message "deploy $COMMIT"

echo "→ 完成，约 10 秒后生效： https://xinyushe.pages.dev"