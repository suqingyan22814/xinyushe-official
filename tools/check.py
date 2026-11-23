#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""部署前自检：JSON 合法性、资源引用、常见空壳。

用法：python3 tools/check.py
退出码非 0 表示有阻断性问题。
"""
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_KEYS = [
    "site", "banner", "news", "timeline", "people", "zones", "events",
    "mod-list", "mod-timeline", "wiki", "faq", "history-volumes", "org",
    "surveys", "emergency", "groups", "archive",
]

problems = []
warnings = []


def check_json():
    for k in DATA_KEYS:
        p = ROOT / "data" / f"{k}.json"
        if not p.exists():
            problems.append(f"缺少数据文件：{p.relative_to(ROOT)}")
            continue
        try:
            obj = json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:
            problems.append(f"JSON 语法错误：{p.name} → {e}")
            continue
        if isinstance(obj, (list, dict)) and len(obj) == 0:
            warnings.append(f"数据为空：{p.name}")
    return True


def check_refs():
    for page in ["index.html", "plus.html"]:
        p = ROOT / page
        if not p.exists():
            problems.append(f"缺少页面：{page}")
            continue
        s = p.read_text(encoding="utf-8")
        for ref in set(re.findall(r'(?:href|src)="([^"#]+)"', s)):
            ref = ref.split('?')[0].split('#')[0]
            if ref.startswith(("http://", "https://", "//", "data:", "mailto:", "tel:")):
                continue
            if not ref or ref == "":
                warnings.append(f"{page} 存在空 src/href")
                continue
            # 跳过 JS 模板字符串里动态拼接的地址（含引号或加号）
            if "'" in ref or '"' in ref or "+" in ref or "${" in ref:
                continue
            if not (ROOT / ref).exists():
                problems.append(f"{page} 引用的文件不存在：{ref}")
        if "<style>" in s and len(re.search(r"<style>(.*?)</style>", s, re.S).group(1)) > 4000:
            warnings.append(f"{page} 仍有较大内联样式，建议外链")
        if 'data-style=' not in s:
            problems.append(f"{page} 缺少主题属性 data-style")


def check_data_js():
    p = ROOT / "data" / "data.js"
    if not p.exists():
        problems.append("缺少 data/data.js，请执行 sh tools/build-data.sh")
        return
    s = p.read_text(encoding="utf-8")
    n = s.count("__XY_DATA__[")
    if n < len(DATA_KEYS):
        problems.append(f"data.js 数据键不足（{n} < {len(DATA_KEYS)}），请重新生成")
    # 与源文件时间无关，改为内容抽检
    try:
        site = json.loads((ROOT / "data" / "site.json").read_text(encoding="utf-8"))
        if site.get("totalMembers") and site["totalMembers"] not in s:
            problems.append("data.js 与 site.json 不一致（总人数），请重新生成")
    except Exception:
        pass


def check_history():
    p = ROOT / "data" / "history-volumes.json"
    if not p.exists():
        return
    h = json.loads(p.read_text(encoding="utf-8"))
    for vol in h:
        if "content" not in vol or "full" not in vol:
            problems.append(f"史书卷缺少 content/full 字段：{vol.get('title')}")
    if len(h) < 4:
        warnings.append(f"史书卷数偏少：{len(h)}")


def check_themes():
    p = ROOT / "assets" / "css" / "themes.css"
    if not p.exists():
        problems.append("缺少 assets/css/themes.css")
        return
    s = p.read_text(encoding="utf-8")
    for style in ["mixed", "flat", "glass", "dark", "swiss", "a11y", "seal"]:
        for scheme in ["light", "dark"]:
            if f'data-style="{style}"][data-scheme="{scheme}"' not in s:
                problems.append(f"主题缺失：{style} · {scheme}")


def main():
    check_json()
    check_refs()
    check_data_js()
    check_history()
    check_themes()

    print("=" * 52)
    if warnings:
        print(f"提示（{len(warnings)}）")
        for w in warnings:
            print("  ·", w)
    if problems:
        print(f"\n阻断问题（{len(problems)}）")
        for p in problems:
            print("  ✗", p)
        print("\n自检未通过")
        return 1
    print("\n自检通过：数据、引用、主题、史书双版本均就绪")
    return 0


if __name__ == "__main__":
    sys.exit(main())