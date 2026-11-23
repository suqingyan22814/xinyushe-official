# 雨群联合社区门户 · 部署与维护说明

> 版本：2026-11-23 重构版（数据截止 2026-11-22，依据《雨群编年体发展史》青城版 V1.48）

## 一、站点结构

```
index.html                 主门户（结构 + 少量内联样式）
plus.html                  史料与规章馆（只保留公报原文 / 群规沿革 / 历史今天 / 新人须知）
admin/index.html           「撤编通告」彩蛋页（独立，可部署）
assets/css/base.css        结构层样式（颜色全部走变量）
assets/css/themes.css      七套风格 × 明暗两版（由 tools/build-themes.py 生成）
assets/css/plus.css        附页专用样式（沿用同一套主题变量）
assets/js/theme.js         风格切换（两页共用，自动注入右下角面板）
assets/js/app.js           主页逻辑与渲染
assets/img/                提取出的两张档案图（原为 base64 内嵌）
data/*.json                全部数据文件（见下）
data/data.js               file:// 本地预览降级数据源（由工具生成，勿手改）
data/archive.json          档案原文（公报 / 群规 / 历史今天 / 新人须知），供主页搜索调用
source/*.docx              文档源（群史 V1.48、职能概要 2026-11-04），仅供重新生成用
tools/build-data.sh        由 data/*.json 生成 data/data.js
tools/build-themes.py      生成 assets/css/themes.css
tools/convert-history.py   docx → data/history-volumes.json（含对外版 / 全本双版本）
tools/check.py             部署前自检（JSON 合法性 + 资源引用）
```

## 二、部署（Cloudflare Pages · 直接上传）

| 项目 | 值 |
|---|---|
| Pages 项目名 | `xinyushe` |
| 访问地址 | https://xinyushe.pages.dev |
| 部署方式 | **直接上传（Direct Upload）**，不走 Git 集成 |
| GitHub 仓库 | `suqingyan22814/xinyushe-official`（存档与版本回溯用） |

### 部署命令

```sh
export CLOUDFLARE_API_TOKEN=<你的 API Token>
npx wrangler pages deploy . --project-name xinyushe --commit-dirty=true
```

上传前请排除：`source/`（文档源与原始上传图）、`.dsh-vision-toolkit/`、`*.bak`、`*.zip`。

### 数据后台

`admin/panel.html` 直接读写 GitHub 仓库的 `data/*.json`：填仓库、分支、目录、Token 即可连接。
保存后提交到仓库，**不会自动上线**（因为 Pages 是直传），需要再执行一次上面的部署命令。

### 若要改成 Git 自动部署

Dashboard → Workers & Pages → `xinyushe` → Settings → Build → 连接 Git 仓库。
本站无构建步骤（Build command 留空、输出目录 `/`），连上之后 `git push` 即自动发布。

## 三、日常维护

改完任意 `data/*.json` 后**必须**执行：

```sh
sh tools/build-data.sh      # 重新生成 data/data.js
```

否则直接用 `file://` 双击打开时页面仍在读旧快照（HTTP 部署不受影响，但本地预览会显示旧内容）。

群史更新（拿到新版 docx）：

```sh
cp 新版群史.docx source/雨群史-青城版-V1.48.docx
python3 tools/convert-history.py
sh tools/build-data.sh
```

改主题配色：

```sh
python3 tools/build-themes.py   # 改完 tools/build-themes.py 里的 palette 后执行
```

部署前自检：

```sh
python3 tools/check.py
```

## 四、风格系统

页面根元素携带四个开关：

```html
<html data-style="mixed" data-scheme="light" data-size="md" data-motion="on">
```

| 属性 | 取值 |
|---|---|
| `data-style` | `mixed` 混合（默认）· `flat` 扁平 · `glass` 玻璃拟态 · `dark` 暗黑科技 · `swiss` 瑞士编辑 · `a11y` 高对比 · `seal` 印章公文 |
| `data-scheme` | `light` / `dark`（每套风格都有独立明暗两版） |
| `data-size` | `sm` / `md` / `lg` 三档字号 |
| `data-motion` | `on` / `off`（`off` 关闭动效，供无障碍使用） |

设置存在 `localStorage`（键名 `xinyushe-style` / `xinyushe-scheme` / `xinyushe-size` / `xinyushe-motion`），两页共用。
切换入口有两个：右下角悬浮球（两页都有）、顶栏 ☾/☼ 按钮（快捷切明暗）。

**布局是共用的一套**：七套风格只改变配色、字体、圆角、阴影、间距密度与材质，不改变 DOM 顺序与栅格。瑞士风做不到杂志式换行列布，这是刻意取舍——否则等于维护七套模板。

## 五、数据文件说明

| 文件 | 内容 | 更新频率 |
|---|---|---|
| `site.json` | 官网元信息、滚动公告、普查汇总口径、版权与备案 | 每次普查 / 机构变更 |
| `org.json` | 组织架构图数据（靖枢堂置顶 + 四级分线） | 机构变更时 |
| `emergency.json` | 治理状态看板（四行状态 + 六张速查卡 + 两栏清单） | 状态变化时 |
| `wiki.json` | 百科：词条 / 机构 / 职能 / 群规章程 | 规章变化时 |
| `news.json` | 公告时间线（倒序） | 有事即记 |
| `timeline.json` | 大事记（分期） | 每阶段 |
| `events.json` | 重大事件专题（12 个，11·2 与 11·17 为新增） | 重大事件 |
| `surveys.json` | 历次普查汇总表 | 每次普查 |
| `zones.json` | 20 个分区 + 7 个机构/历史条目（含详情弹窗） | 分区变化时 |
| `people.json` | 人物档案（41 人，职务表述为 2026-11-01 口径，待人物包整体更新） | 人物包更新时 |
| `history-volumes.json` | 四卷史书，每卷含 `content`（对外版）与 `full`（全本原文） | 每版 group 史 |
| `groups.json` | 接管 / 新并入 / 特区群聊入口 | 群聊变动时 |
| `archive.json` | 公报原文 / 群规沿革 / 历史今天 / 新人须知 | 有新公文时 |

## 六、史书的两种读法

`data/history-volumes.json` 每卷有两个字段：

- `content`：**对外版**——保留全部事实、时间与数字，把人身攻讦式原话改为间接叙述，涉及个人健康与账号受限的表述略写；
- `full`：**全本原文**——逐字保留 docx 原文，不改一个标点。

页面展开任一卷后可在「对外版 / 全本原文」之间切换。加工规则写在 `tools/convert-history.py` 的 `REWRITES` 列表里，新增条目直接往下追加。

## 七、本次重构（2026-11-23）变更清单

**修复**

1. `news.json` / `events.json` / `org.json` 共 4 处 JSON 语法错误（缺逗号、缺冒号），此前导致 `fetch` 解析失败后静默回退到 10 小时前的旧快照，11 月 1 日的内容从未真正上线；
2. `data.js` 与 `data/*.json` 长期不同步，已改为工具生成；
3. 「页面渲染抛错」原先会被误判为「fetch 失败」而触发整体降级，现改为渲染与初始化各自兜底。

**内容换代**

1. 组织架构切到 11·17 建制重整后：靖枢堂（非建制共识）置顶虚线，其下总群主 / 代理总群主，再下四级分线——枢密院（青喧）、群务统筹院（胡安）、通报交流中心（游客，冻结）、分区管理组；
2. 原「紧急状态速查」改为「治理状态看板」：紧急状态（名义终止 / 内部延续）· 对外事务（全面冻结）· 日常管理（统筹院）· 高层裁决（枢密院）；
3. 补 11 月 2 日至 21 日全部史实（统筹院成立、通报处改组、青城司缩编、撤耄耋、文明评议会解散、露西亚停更、撤销周天子群、二十区破 500 等）；
4. 第十一次普查数据替换第十次：在册 17530 人（主编区 13969 ＋ 外部/接管 3561，截止 11-22 夜）；
5. 史书全量换成 V1.48（4 卷、4 万字，原版约 1.3 万字）；
6. 全站「青城司」退场：页脚版权、维护方、FAQ、百科、分区机构卡统一改署枢密院，仅史书与 11·17 通告保留历史署名。

**工程重构**

1. `index.html` 从 127 KB / 2729 行降到 20 KB，CSS 与 JS 全部外链；
2. `plus.html` 从 429 KB 降到 68 KB：两张 base64 内嵌图提取为 `assets/img/`（省 332 KB），四个与主页重复的板块删除；
3. 新增七套风格 × 明暗两版的主题系统与切换面板；
4. 附页接入同一套主题变量，切换后两页外观完全同步；
5. 主页搜索覆盖附页档案（公报 / 群规 / 历史今天 / 新人须知），点击直达对应锚点。

**待办**

- 人物档案整体更新（11 月新人、别名合并、头像打包、管理结构增层）——按约定放在倒数第二件事；
- 管理员后台（无后端方案）——全部更新完成后再单独讨论；
- `groups.json` 新增两个联机群与德系群的入口链接，待提供群号 / 分享链接后补入。

## 八、已知限制

1. `file://` 双击直开时无法 fetch，会降级读取 `data/data.js`；改完 JSON 记得重新生成该文件；
2. 字体走 jsdelivr CDN，国内个别地区慢时会先以系统字体渲染（无阻塞）；
3. 瑞士编辑风只做排版气质，不改栅格结构；
4. 高对比风为纯色硬边界，不透明度动画在 `data-motion="off"` 下全部关闭。