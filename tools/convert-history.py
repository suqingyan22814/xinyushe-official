#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把《雨群编年体发展史（青城版）》docx 转成 data/history-volumes.json

用法：python3 tools/convert-history.py
输出：
  data/history-volumes.json   四卷（content 为全本 HTML）
  data/history-full.html      调试用，全本拼接预览
规则：
  卷首        卷[一二三四]：xxx      -> 卷标题
  章          初代史：/二代史：…     -> h5.history-chapter-title
  时期        ‖xxx‖                 -> h5.history-period
  月份分隔    —【x月】—             -> div.history-month
  序言        序言                   -> div.history-comment（紧随其后的两段并入）
  附录        正文结束后的「未完待续…… / Mod项目年表 / 【…】」 -> 卷四附录
"""
import json
import re
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "source" / "雨群史-青城版-V1.48.docx"
OUT = ROOT / "data" / "history-volumes.json"
DEBUG = ROOT / "data" / "history-full.html"

VOLUME_TITLES = {
    "卷一": "卷一：草创（2022.6-2022.12）",
    "卷二": "卷二：动荡与黄金时期（2023.1-2023.8）",
    "卷三": "卷三：衰落与重构尝试（2023.9-2025.7）",
    "卷四": "卷四：群聊的新生（2025.7.26～至今）",
}


TERM_FIX = {"通告处": "通报处"}


def _term_fix_one(t: str) -> str:
    for a, b in TERM_FIX.items():
        t = t.replace(a, b)
    return t



# 对外版改写规则：只保留事实与时间，把人身攻讦式原话改为间接叙述，
# 涉及个人健康与账号受限的表述略写。全本（full）逐字保留原文。
REWRITES = [
    ("就莫名其妙的瞅他瞅这烦了吧唧我就他个妈就想骂他。我不知道我啥精神啊",
     "对某些成员的言行颇为不耐"),
    ("你不管熟不熟的张口就是你不是赛人，活你妈呢",
     "不熟也张口就做人籍判断，措辞激烈"),
    ("先给青妈（指青喧）管理，让青妈把他看不顺眼的全给干掉。出事我担着（两个呲牙笑的表情），稳定高于一切（两个呲牙笑的表情）",
     "以玩笑口吻主张让青喧先接管五区、把看不顺眼的人清理掉，称出事他担着、稳定高于一切"),
    ("“同性恋讲白了就是有病啊，你同就同吧，也没人说你，还搁这宣传上了，被查了就受着🙏被骂了也受着。”的歧视性观点",
     "歧视性言论"),
    ("自己因为玩了烈焰升腾模组被请去喝茶了，被迫退群退圈",
     "自己因模组相关问题受到外部压力，被迫退群退圈"),
    ("本人因个人健康问题", "本人因个人原因"),
    ("青喧一系列账号被封禁", "青喧的一系列账号出现异常、无法正常使用"),
    ("统筹院黑料并发", "统筹院内部调侃不断"),
    ("青喧因健康问题宣布暂时停止接收信息", "青喧因个人原因宣布暂时停止接收信息"),
]


def to_public(text: str) -> str:
    for a, b in REWRITES:
        text = text.replace(a, b)
    return text


def has_cjk(s: str) -> bool:
    return any("\u4e00" <= ch <= "\u9fff" for ch in s)


def load_paragraphs(path: Path):
    z = zipfile.ZipFile(path)
    xml = z.read("word/document.xml").decode("utf-8", "ignore")
    paras = []
    for seg in re.split(r"</w:p>", xml):
        text = "".join(re.findall(r"<w:t[^>]*>(.*?)</w:t>", seg, re.S))
        text = re.sub(r"<[^>]+>", "", text).strip()
        if text:
            paras.append(text)
    return paras


def apply_term_fix(t: str) -> str:
    return _term_fix_one(t)


def esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def main():
    paras = load_paragraphs(SRC)
    # 去掉首行书名
    if paras and "编年体发展史" in paras[0]:
        paras = paras[1:]

    volumes = []          # [{title, blocks}]
    cur = None
    appendix = []         # 附录段落
    in_appendix = False
    expect_preface = False

    for raw in paras:
        line = raw

        # 卷
        m = re.match(r"^(卷[一二三四五六七八九十]+)：(.+)$", line)
        if m and has_cjk(m.group(2)):
            key = m.group(1)
            title = VOLUME_TITLES.get(key) or line
            cur = {"title": title, "blocks": [], "chars": 0}
            volumes.append(cur)
            continue

        # 正文结束标记之后进入附录
        if line.startswith("未完待续"):
            in_appendix = True
            appendix.append(line)
            continue
        if in_appendix:
            appendix.append(line)
            continue

        if cur is None:
            continue

        # 序言
        if line == "序言":
            expect_preface = True
            continue

        # 章
        if re.match(r"^(初代史|二代史|三代史|四代史|五代史|六代史)：", line):
            cur["blocks"].append(("chapter", line))
            continue

        # 时期
        if re.match(r"^‖.+‖$", line):
            cur["blocks"].append(("period", line))
            continue

        # 月份
        if re.match(r"^—【.+】—$", line):
            cur["blocks"].append(("month", line))
            continue

        if expect_preface:
            cur["blocks"].append(("comment", line))
            expect_preface = False
            continue

        cur["blocks"].append(("p", line))

    # 追加附录到卷四
    if appendix and volumes:
        blocks = []
        i = 0
        while i < len(appendix):
            a = appendix[i]
            if a.startswith("未完待续"):
                blocks.append(("end", a))
            elif re.match(r"^【.+】$", a) or a == "Mod项目年表":
                blocks.append(("chapter", a))
            elif re.match(r"^- ", a):
                blocks.append(("li", a[2:].strip()))
            elif a.startswith("（2026.6.5）"):
                blocks.append(("comment", a))
            else:
                # 【当前管理架构】下的四行归入 li
                prev = [b for b in blocks]
                if prev and prev[-1][0] in ("li", "end") and ("管理架构" in "".join(x for _, x in prev[-6:])):
                    blocks.append(("li", a))
                else:
                    blocks.append(("p", a))
            i += 1
        volumes[-1]["blocks"].extend(blocks)

    # 生成 HTML
    out = []
    for vol in volumes:
        html = []
        opened = False
        for kind, text in vol["blocks"]:
            text = apply_term_fix(text)
            if kind == "chapter":
                if opened:
                    html.append("</div>")
                html.append(f'<div class="history-chapter"><h5>{esc(text)}</h5>')
                opened = True
            elif kind == "period":
                html.append(f'<h5 class="history-period">{esc(text)}</h5>')
            elif kind == "month":
                html.append(f'<div class="history-month">{esc(text)}</div>')
            elif kind == "comment":
                html.append(f'<div class="history-comment">{esc(text)}</div>')
            elif kind == "li":
                html.append(f'<div class="history-li">· {esc(text)}</div>')
            elif kind == "end":
                html.append(f'<div class="history-end">{esc(text)}</div>')
            else:
                html.append(f"<p>{esc(text)}</p>")
        if opened:
            html.append("</div>")
        s = "".join(html).strip()
        vol["html"] = s
        vol["chars"] = len(re.sub(r"<[^>]+>", "", s))

    data = []
    for v in volumes:
        pub_html = to_public(v["html"])
        data.append({
            "title": v["title"],
            "content": pub_html,
            "full": v["html"],
            "chars": len(re.sub(r"<[^>]+>", "", pub_html)),
        })
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    DEBUG.write_text(
        "<!doctype html><meta charset='utf-8'><title>全本预览</title>"
        "<style>body{max-width:820px;margin:2rem auto;font:15px/1.9 sans-serif}"
        "h5{margin:1.6em 0 .6em;font-size:15px}"
        ".history-month{margin:1.4em 0;color:#a03;font-weight:700;font-size:14px}"
        ".history-comment{background:#f7f4ee;border-left:3px solid #a03;padding:.7em 1em;margin:1em 0}"
        ".history-end{text-align:center;color:#888;margin:2em 0}</style>"
        + "".join(f"<h2>{esc(d['title'])}</h2>{d['content']}" for d in data),
        encoding="utf-8",
    )
    for v, d in zip(volumes, data):
        print(f"{d['title']:<34} 字符 {d['chars']:>6}  HTML {len(d['content']):>7}")
    print(f"\n合计字符 {sum(d['chars'] for d in data)}，写入 {OUT}")


if __name__ == "__main__":
    main()