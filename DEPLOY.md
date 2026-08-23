# Cloudflare Pages 部署配置

## 部署方式
1. 将项目文件上传到 Git 仓库
2. 在 Cloudflare Dashboard 中连接仓库
3. 设置构建配置：
   - Build command: (留空)
   - Publish directory: .
   - Root directory: .

## 已创建的配置文件
- _headers - 设置正确的 MIME 类型和缓存策略
- _redirects - SPA 路由支持
- 404.html - 自定义 404 页面
- wrangler.toml - Cloudflare CLI 配置
