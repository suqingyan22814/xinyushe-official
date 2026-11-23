#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成 assets/css/themes.css：七套风格 × 明暗两版

用法：python3 tools/build-themes.py
风格键（写在 <html data-style="...">）：
  mixed 混合（默认）· flat 扁平 · glass 玻璃拟态 · dark 暗黑科技
  swiss 瑞士/编辑杂志 · a11y 无障碍高对比 · seal 印章公文
明暗键（写在 <html data-scheme="...">）：light / dark
字号键（写在 <html data-size="...">）：sm / md / lg
动效键（写在 <html data-motion="...">）：on / off

设计约定（每套必须彼此不重样）：
  1. 主色不同：蓝 / 橙 / 紫 / 青 / 瑞红 / 高对比蓝黄 / 印泥红
  2. 圆角不同：12 / 0 / 24 / 8 / 0 / 0 / 2
  3. 材质不同：玻璃 / 纯色块 / 真毛玻璃 / 霓虹描边 / 细线报纸 / 硬边黑白 / 纸纹
  4. 字体不同：黑体 / 系统 / 系统 / 黑体+等宽 / Helvetica / 系统 / 宋体
  5. 阴影不同：柔和 / 无 / 大扩散 / 辉光 / 无 / 硬边 / 纸质
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "css" / "themes.css"

SANS = '"Noto Sans SC", -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif'
SYS = '-apple-system, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif'
SERIF = '"Noto Serif SC", "STSong", "SimSun", serif'
SWISS_FONT = '"Helvetica Neue", Helvetica, Inter, "Noto Sans SC", Arial, sans-serif'
MONO = '"JetBrains Mono", "SFMono-Regular", Consolas, "Courier New", monospace'
APPLE = '-apple-system, "SF Pro Text", "SF Pro Display", "PingFang SC", "Helvetica Neue", "Segoe UI", sans-serif'

BASE = {
    "seal": "#2563eb", "seal-dark": "#1d4ed8", "seal-deep": "#16369b", "seal-light": "#3b82f6",
    "gold": "#b58122", "paper": "#f2f5f9", "paper-card": "rgba(255,255,255,0.74)",
    "ink": "#0e1726", "ink-secondary": "#46536b", "ink-muted": "#7b8a9e",
    "border": "rgba(14,23,38,0.13)", "border-soft": "rgba(14,23,38,0.06)", "navy": "#12294a",
    "on-accent": "#ffffff", "on-navy": "#eaf2ff",
    "ok": "#0f7a4d", "off": "#7b8a9e", "warn": "#b45309",
    "shadow": "0 1px 2px rgba(14,23,38,0.06), 0 10px 28px -14px rgba(14,23,38,0.22)",
    "shadow-hover": "0 2px 6px rgba(14,23,38,0.08), 0 22px 48px -20px rgba(14,23,38,0.3)",
    "topbar-bg": "rgba(10,16,26,0.92)", "topbar-fg": "#dbe6f5", "topbar-accent": "#7fb0ff",
    "footer-strong": "#c3d2e6", "footer-muted": "#8595ab", "footer-line": "rgba(255,255,255,0.12)",
    "card-solid": "#ffffff", "card-float": "rgba(255,255,255,0.94)",
    "overlay": "rgba(10,16,26,0.55)",
    "scrim-1": "rgba(0,0,0,0.15)", "scrim-2": "rgba(0,0,0,0.25)", "scrim-3": "rgba(0,0,0,0.4)",
    "scrim-4": "rgba(255,255,255,0.5)",
    "hover-soft": "rgba(255,255,255,0.1)", "hover-soft-2": "rgba(255,255,255,0.08)",
    "seal-a04": "rgba(37,99,235,0.05)", "seal-a06": "rgba(37,99,235,0.07)", "seal-a07": "rgba(37,99,235,0.08)",
    "seal-a08": "rgba(37,99,235,0.10)", "seal-a10": "rgba(37,99,235,0.13)",
    "gold-a06": "rgba(181,129,34,0.06)", "gold-a10": "rgba(181,129,34,0.10)", "gold-a16": "rgba(181,129,34,0.16)",
    "gold-a28": "rgba(181,129,34,0.24)", "gold-a30": "rgba(181,129,34,0.28)",
    "navy-shadow": "rgba(18,41,74,0.25)", "subnav-fg": "#c3d2e6",
    "bg-texture": (
        "radial-gradient(circle at 12% 3%, rgba(37,99,235,0.10) 0, transparent 42%),"
        "radial-gradient(circle at 88% 0%, rgba(0,196,180,0.08) 0, transparent 38%)"
    ),
    "radius-s": "8px", "radius-m": "12px", "radius-l": "16px",
    "font-head": SANS, "font-body": SANS, "font-mono": MONO,
    "glass-filter": "blur(14px) saturate(150%)", "stamp-rotate": "-6deg",
}


def p(**kw):
    d = dict(BASE)
    d.update({k.replace("_", "-"): v for k, v in kw.items()})
    return d


def tint(hex_color, alpha):
    h = hex_color.lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return f"rgba({r},{g},{b},{alpha})"


STYLES = {}

# ────────────────────────────── 1. mixed 混合（默认）
BLUE = "#2563eb"
STYLES["mixed"] = {
    "light": p(),
    "dark": p(
        seal="#4d9bff", seal_dark="#2d7ceb", seal_deep="#1d5cb8", seal_light="#7cb8ff",
        gold="#d8a63f", paper="#070a10", paper_card="rgba(19,25,35,0.72)",
        ink="#e7eef8", ink_secondary="#9cb0c7", ink_muted="#67788d",
        border="rgba(231,238,248,0.12)", border_soft="rgba(231,238,248,0.06)", navy="#8fb6ff",
        on_navy="#07101f", ok="#35d39a", warn="#e2a848", off="#67788d",
        shadow="0 1px 2px rgba(0,0,0,0.5), 0 14px 36px -16px rgba(0,0,0,0.9)",
        shadow_hover="0 2px 8px rgba(0,0,0,0.6), 0 26px 56px -20px rgba(77,155,255,0.35)",
        topbar_bg="rgba(5,8,13,0.94)", topbar_fg="#c6d5e6", topbar_accent="#7cb8ff",
        footer_strong="#b9c8db", footer_muted="#7d8fa5", footer_line="rgba(255,255,255,0.10)",
        card_solid="#121821", card_float="rgba(19,25,35,0.95)",
        overlay="rgba(0,0,0,0.7)", scrim_4="rgba(255,255,255,0.28)",
        seal_a04=tint("#4d9bff", 0.06), seal_a06=tint("#4d9bff", 0.09), seal_a07=tint("#4d9bff", 0.10),
        seal_a08=tint("#4d9bff", 0.12), seal_a10=tint("#4d9bff", 0.16),
        gold_a06=tint("#d8a63f", 0.06), gold_a10=tint("#d8a63f", 0.10), gold_a16=tint("#d8a63f", 0.16),
        gold_a28=tint("#d8a63f", 0.24), gold_a30=tint("#d8a63f", 0.28),
        navy_shadow=tint("#8fb6ff", 0.28), subnav_fg="#b9c8db",
        bg_texture=(
            "radial-gradient(circle at 10% 0%, rgba(77,155,255,0.16) 0, transparent 40%),"
            "radial-gradient(circle at 92% 6%, rgba(0,240,210,0.09) 0, transparent 36%)"
        ),
        glass_filter="blur(16px) saturate(140%)",
    ),
}

# ────────────────────────────── 2. flat 扁平（橙 + 纯色块 + 全直角）
ORANGE = "#f97316"
STYLES["flat"] = {
    "light": p(
        seal="#c2410c", seal_dark="#9a3412", seal_deep="#7c2d12", seal_light="#ea580c",
        gold="#0f766e", paper="#ffffff", paper_card="#f5f7fa",
        ink="#0f172a", ink_secondary="#475569", ink_muted="#94a3b8",
        border="#d5dde8", border_soft="#eef2f7", navy="#1e293b",
        on_navy="#f8fafc", ok="#15803d", warn="#b45309", off="#64748b",
        shadow="none", shadow_hover="none",
        topbar_bg="#0f172a", topbar_fg="#e2e8f0", topbar_accent="#fdba74",
        footer_strong="#cbd5e1", footer_muted="#94a3b8", footer_line="#334155",
        card_solid="#ffffff", card_float="#ffffff", overlay="rgba(15,23,42,0.45)",
        seal_a04=tint("#c2410c", 0.06), seal_a06=tint("#c2410c", 0.08), seal_a07=tint("#c2410c", 0.10),
        seal_a08=tint("#c2410c", 0.12), seal_a10=tint("#c2410c", 0.16),
        gold_a06=tint("#0f766e", 0.06), gold_a10=tint("#0f766e", 0.10), gold_a16=tint("#0f766e", 0.14),
        gold_a28=tint("#0f766e", 0.22), gold_a30=tint("#0f766e", 0.26),
        navy_shadow="rgba(30,41,59,0.18)", subnav_fg="#cbd5e1",
        bg_texture="none",
        radius_s="0", radius_m="0", radius_l="0",
        font_head=SYS, font_body=SYS, font_mono=MONO,
        glass_filter="none", stamp_rotate="0deg",
    ),
    "dark": p(
        seal="#fb923c", seal_dark="#f97316", seal_deep="#c2410c", seal_light="#fdba74",
        gold="#2dd4bf", paper="#0d1117", paper_card="#161b22",
        ink="#e6edf3", ink_secondary="#9ba7b4", ink_muted="#6e7b8b",
        border="#30363d", border_soft="#21262d", navy="#93c5fd",
        on_navy="#0b1220", ok="#3fb950", warn="#d29922", off="#6e7b8b",
        shadow="none", shadow_hover="none",
        topbar_bg="#010409", topbar_fg="#c9d1d9", topbar_accent="#fdba74",
        footer_strong="#c9d1d9", footer_muted="#8b949e", footer_line="#30363d",
        card_solid="#161b22", card_float="#161b22", overlay="rgba(1,4,9,0.7)",
        seal_a04=tint("#fb923c", 0.07), seal_a06=tint("#fb923c", 0.09), seal_a07=tint("#fb923c", 0.11),
        seal_a08=tint("#fb923c", 0.13), seal_a10=tint("#fb923c", 0.17),
        gold_a06=tint("#2dd4bf", 0.06), gold_a10=tint("#2dd4bf", 0.10), gold_a16=tint("#2dd4bf", 0.14),
        gold_a28=tint("#2dd4bf", 0.22), gold_a30=tint("#2dd4bf", 0.26),
        navy_shadow="rgba(147,197,253,0.2)", subnav_fg="#c9d1d9", scrim_4="rgba(255,255,255,0.3)",
        bg_texture="none",
        radius_s="0", radius_m="0", radius_l="0",
        font_head=SYS, font_body=SYS, font_mono=MONO,
        glass_filter="none", stamp_rotate="0deg",
    ),
}

# ────────────────────────────── 3. glass 玻璃拟态（紫 + 真毛玻璃 + 大圆角）
VIOLET = "#6d4dff"
STYLES["glass"] = {
    "light": p(
        seal="#007aff", seal_dark="#0062cc", seal_deep="#004a99", seal_light="#409cff",
        gold="#ff9500", paper="#fbfcfe", paper_card="rgba(255,255,255,0.44)",
        ink="#1c1c1e", ink_secondary="#48484a", ink_muted="#8e8e93",
        border="rgba(255,255,255,0.66)", border_soft="rgba(60,60,67,0.10)", navy="#1c1c1e",
        on_navy="#ffffff", ok="#248a3d", warn="#c93400", off="#8e8e93",
        shadow="0 1px 2px rgba(0,0,0,0.04), 0 12px 32px -14px rgba(0,0,0,0.18)",
        shadow_hover="0 2px 8px rgba(0,0,0,0.06), 0 22px 52px -18px rgba(0,0,0,0.26)",
        topbar_bg="rgba(255,255,255,0.55)", topbar_fg="#48484a", topbar_accent="#007aff",
        footer_strong="#c7c7cc", footer_muted="#8e8e93", footer_line="rgba(60,60,67,0.14)",
        card_solid="#ffffff", card_float="rgba(255,255,255,0.88)",
        overlay="rgba(0,0,0,0.30)",
        seal_a04=tint("#007aff", 0.06), seal_a06=tint("#007aff", 0.09), seal_a07=tint("#007aff", 0.11),
        seal_a08=tint("#007aff", 0.14), seal_a10=tint("#007aff", 0.18),
        gold_a06=tint("#ff9500", 0.07), gold_a10=tint("#ff9500", 0.10), gold_a16=tint("#ff9500", 0.15),
        gold_a28=tint("#ff9500", 0.24), gold_a30=tint("#ff9500", 0.28),
        navy_shadow="rgba(0,0,0,0.16)", subnav_fg="#c7c7cc",
        bg_texture=(
            "radial-gradient(1100px 760px at 8% 2%, rgba(0,122,255,0.075), transparent 66%),"
            "radial-gradient(980px 700px at 92% 4%, rgba(175,82,222,0.05), transparent 64%),"
            "radial-gradient(1000px 780px at 46% 100%, rgba(52,199,89,0.035), transparent 66%),"
            "radial-gradient(820px 620px at 92% 78%, rgba(255,149,0,0.035), transparent 64%)"
        ),
        radius_s="12px", radius_m="18px", radius_l="26px",
        font_head=APPLE, font_body=APPLE, font_mono=MONO,
        glass_filter="blur(32px) saturate(180%)",
    ),
    "dark": p(
        seal="#0a84ff", seal_dark="#0066cc", seal_deep="#004a99", seal_light="#4aa5ff",
        gold="#ff9f0a", paper="#05070c", paper_card="rgba(255,255,255,0.055)",
        ink="#f2f2f7", ink_secondary="#c7c7cc", ink_muted="#8e8e93",
        border="rgba(255,255,255,0.16)", border_soft="rgba(255,255,255,0.07)", navy="#1c1c1e",
        on_navy="#f2f2f7", ok="#30d158", warn="#ff9f0a", off="#8e8e93",
        shadow="0 2px 8px rgba(0,0,0,0.4), 0 18px 48px -18px rgba(0,0,0,0.7)",
        shadow_hover="0 4px 14px rgba(0,0,0,0.5), 0 28px 64px -20px rgba(0,0,0,0.8)",
        topbar_bg="rgba(20,20,24,0.60)", topbar_fg="#c7c7cc", topbar_accent="#0a84ff",
        footer_strong="#c7c7cc", footer_muted="#8e8e93", footer_line="rgba(255,255,255,0.12)",
        card_solid="#1c1c1e", card_float="rgba(28,28,30,0.9)",
        overlay="rgba(0,0,0,0.6)", scrim_4="rgba(255,255,255,0.32)",
        seal_a04=tint("#0a84ff", 0.08), seal_a06=tint("#0a84ff", 0.11), seal_a07=tint("#0a84ff", 0.13),
        seal_a08=tint("#0a84ff", 0.16), seal_a10=tint("#0a84ff", 0.20),
        gold_a06=tint("#ff9f0a", 0.07), gold_a10=tint("#ff9f0a", 0.10), gold_a16=tint("#ff9f0a", 0.15),
        gold_a28=tint("#ff9f0a", 0.24), gold_a30=tint("#ff9f0a", 0.28),
        navy_shadow="rgba(0,0,0,0.5)", subnav_fg="#c7c7cc",
        bg_texture=(
            "radial-gradient(1100px 760px at 6% 0%, rgba(10,132,255,0.24), transparent 62%),"
            "radial-gradient(980px 700px at 94% 2%, rgba(175,82,222,0.18), transparent 60%),"
            "radial-gradient(1000px 780px at 44% 100%, rgba(48,209,88,0.12), transparent 62%),"
            "radial-gradient(820px 620px at 92% 80%, rgba(255,159,10,0.10), transparent 60%)"
        ),
        radius_s="12px", radius_m="18px", radius_l="26px",
        font_head=APPLE, font_body=APPLE, font_mono=MONO,
        glass_filter="blur(34px) saturate(175%)",
    ),
}

# ────────────────────────────── 4. dark 暗黑科技（青 + 辉光 + 等宽数字）
CYAN = "#0891b2"
STYLES["dark"] = {
    "light": p(
        seal="#1668b0", seal_dark="#12528f", seal_deep="#0e3f70", seal_light="#2f86cc",
        gold="#c8860d", paper="#edf1f6", paper_card="#ffffff",
        ink="#07121c", ink_secondary="#3c5266", ink_muted="#6f8598",
        border="rgba(22,104,176,0.24)", border_soft="rgba(7,18,28,0.07)", navy="#123a63",
        on_navy="#dceeff", ok="#0b7a55", warn="#b06f12", off="#6f8598",
        shadow="0 0 0 1px rgba(22,104,176,0.14), 0 8px 24px -12px rgba(22,104,176,0.38)",
        shadow_hover="0 0 0 1px rgba(22,104,176,0.28), 0 16px 38px -14px rgba(22,104,176,0.5)",
        topbar_bg="#071826", topbar_fg="#a9c8e6", topbar_accent="#6fb2ff",
        footer_strong="#b6cfe6", footer_muted="#7b95ab", footer_line="rgba(111,178,255,0.22)",
        card_solid="#ffffff", card_float="#ffffff", overlay="rgba(7,18,28,0.55)",
        seal_a04=tint("#1668b0", 0.07), seal_a06=tint("#1668b0", 0.09), seal_a07=tint("#1668b0", 0.11),
        seal_a08=tint("#1668b0", 0.13), seal_a10=tint("#1668b0", 0.17),
        gold_a06=tint("#c8860d", 0.07), gold_a10=tint("#c8860d", 0.11), gold_a16=tint("#c8860d", 0.16),
        gold_a28=tint("#c8860d", 0.24), gold_a30=tint("#c8860d", 0.28),
        navy_shadow="rgba(18,58,99,0.22)", subnav_fg="#b6cfe6",
        bg_texture=(
            "linear-gradient(rgba(22,104,176,0.055) 1px, transparent 1px) 0 0 / 100% 28px,"
            "linear-gradient(90deg, rgba(22,104,176,0.055) 1px, transparent 1px) 0 0 / 28px 100%"
        ),
        radius_s="6px", radius_m="10px", radius_l="14px",
        font_head=SANS, font_body=SANS, font_mono=MONO,
        glass_filter="none", stamp_rotate="0deg",
    ),
    "dark": p(
        seal="#3a9bff", seal_dark="#2b83e0", seal_deep="#1c6bbd", seal_light="#7db8ff",
        gold="#f5c451", paper="#04070c", paper_card="#0a1119",
        ink="#dbeafe", ink_secondary="#8aa4c0", ink_muted="#5b7590",
        border="rgba(58,155,255,0.26)", border_soft="rgba(58,155,255,0.10)", navy="#3a9bff",
        on_accent="#04121f", on_navy="#04070c", ok="#3a9bff", warn="#f5c451", off="#5b7590",
        shadow="0 0 0 1px rgba(58,155,255,0.16), 0 0 26px -6px rgba(58,155,255,0.34)",
        shadow_hover="0 0 0 1px rgba(58,155,255,0.40), 0 0 46px -8px rgba(58,155,255,0.62)",
        topbar_bg="#04070c", topbar_fg="#8aa4c0", topbar_accent="#3a9bff",
        footer_strong="#a9c6e4", footer_muted="#5b7590", footer_line="rgba(58,155,255,0.18)",
        card_solid="#0a1119", card_float="rgba(10,17,25,0.95)",
        overlay="rgba(0,0,0,0.75)", scrim_4="rgba(255,255,255,0.28)",
        seal_a04=tint("#3a9bff", 0.07), seal_a06=tint("#3a9bff", 0.10), seal_a07=tint("#3a9bff", 0.12),
        seal_a08=tint("#3a9bff", 0.15), seal_a10=tint("#3a9bff", 0.19),
        gold_a06=tint("#f5c451", 0.07), gold_a10=tint("#f5c451", 0.11), gold_a16=tint("#f5c451", 0.16),
        gold_a28=tint("#f5c451", 0.24), gold_a30=tint("#f5c451", 0.28),
        navy_shadow=tint("#3a9bff", 0.4), subnav_fg="#a9c6e4",
        bg_texture=(
            "linear-gradient(rgba(58,155,255,0.06) 1px, transparent 1px) 0 0 / 100% 30px,"
            "linear-gradient(90deg, rgba(58,155,255,0.06) 1px, transparent 1px) 0 0 / 30px 100%,"
            "radial-gradient(circle at 20% 0%, rgba(58,155,255,0.12) 0, transparent 48%)"
        ),
        radius_s="6px", radius_m="10px", radius_l="14px",
        font_head=SANS, font_body=SANS, font_mono=MONO,
        glass_filter="none", stamp_rotate="0deg",
    ),
}

# ────────────────────────────── 5. swiss 瑞士国际主义 / 编辑杂志
SWISS_RED = "#e30613"
STYLES["swiss"] = {
    "light": p(
        seal=SWISS_RED, seal_dark="#bb040f", seal_deep="#8a030b", seal_light="#ff2a36",
        gold="#000000", paper="#ffffff", paper_card="#ffffff",
        ink="#000000", ink_secondary="#2b2b2b", ink_muted="#6b6b6b",
        border="#000000", border_soft="rgba(0,0,0,0.16)", navy="#000000",
        on_navy="#ffffff", ok="#00602e", warn="#964b00", off="#6b6b6b",
        shadow="none", shadow_hover="none",
        topbar_bg="#000000", topbar_fg="#ffffff", topbar_accent="#ffffff",
        footer_strong="#ffffff", footer_muted="#b3b3b3", footer_line="rgba(255,255,255,0.4)",
        card_solid="#ffffff", card_float="#ffffff", overlay="rgba(0,0,0,0.6)",
        seal_a04=tint(SWISS_RED, 0.06), seal_a06=tint(SWISS_RED, 0.08), seal_a07=tint(SWISS_RED, 0.10),
        seal_a08=tint(SWISS_RED, 0.12), seal_a10=tint(SWISS_RED, 0.16),
        gold_a06="rgba(0,0,0,0.04)", gold_a10="rgba(0,0,0,0.06)", gold_a16="rgba(0,0,0,0.10)",
        gold_a28="rgba(0,0,0,0.16)", gold_a30="rgba(0,0,0,0.2)",
        navy_shadow="rgba(0,0,0,0.18)", subnav_fg="#ffffff",
        bg_texture="none",
        radius_s="0", radius_m="0", radius_l="0",
        font_head=SWISS_FONT, font_body=SWISS_FONT, font_mono=SWISS_FONT,
        glass_filter="none", stamp_rotate="0deg",
    ),
    "dark": p(
        seal="#ff3b30", seal_dark="#e30613", seal_deep="#bb040f", seal_light="#ff6b62",
        gold="#ffffff", paper="#101010", paper_card="#101010",
        ink="#ffffff", ink_secondary="#cccccc", ink_muted="#8a8a8a",
        border="#ffffff", border_soft="rgba(255,255,255,0.2)", navy="#ffffff",
        on_navy="#101010", ok="#3ddc84", warn="#ffb347", off="#8a8a8a",
        shadow="none", shadow_hover="none",
        topbar_bg="#000000", topbar_fg="#ffffff", topbar_accent="#ff3b30",
        footer_strong="#ffffff", footer_muted="#8a8a8a", footer_line="rgba(255,255,255,0.28)",
        card_solid="#101010", card_float="#101010", overlay="rgba(0,0,0,0.75)",
        seal_a04=tint("#ff3b30", 0.08), seal_a06=tint("#ff3b30", 0.10), seal_a07=tint("#ff3b30", 0.12),
        seal_a08=tint("#ff3b30", 0.14), seal_a10=tint("#ff3b30", 0.18),
        gold_a06="rgba(255,255,255,0.05)", gold_a10="rgba(255,255,255,0.08)", gold_a16="rgba(255,255,255,0.12)",
        gold_a28="rgba(255,255,255,0.18)", gold_a30="rgba(255,255,255,0.22)",
        navy_shadow="rgba(255,255,255,0.2)", subnav_fg="#ffffff", scrim_4="rgba(255,255,255,0.32)",
        bg_texture="none",
        radius_s="0", radius_m="0", radius_l="0",
        font_head=SWISS_FONT, font_body=SWISS_FONT, font_mono=SWISS_FONT,
        glass_filter="none", stamp_rotate="0deg",
    ),
}

# ────────────────────────────── 6. a11y 无障碍高对比
STYLES["a11y"] = {
    "light": p(
        seal="#0000d1", seal_dark="#0000a8", seal_deep="#000080", seal_light="#2424ff",
        gold="#000000", paper="#ffffff", paper_card="#ffffff",
        ink="#000000", ink_secondary="#1a1a1a", ink_muted="#3d3d3d",
        border="#000000", border_soft="rgba(0,0,0,0.6)", navy="#000000",
        on_navy="#ffffff", ok="#006414", warn="#7a4200", off="#000000",
        shadow="0 0 0 2px #000000", shadow_hover="0 0 0 3px #0000d1",
        topbar_bg="#000000", topbar_fg="#ffffff", topbar_accent="#ffff00",
        footer_strong="#ffffff", footer_muted="#ffffff", footer_line="#ffffff",
        card_solid="#ffffff", card_float="#ffffff", overlay="rgba(0,0,0,0.85)",
        seal_a04=tint("#0000d1", 0.10), seal_a06=tint("#0000d1", 0.14), seal_a07=tint("#0000d1", 0.16),
        seal_a08=tint("#0000d1", 0.18), seal_a10=tint("#0000d1", 0.22),
        gold_a06="rgba(0,0,0,0.06)", gold_a10="rgba(0,0,0,0.10)", gold_a16="rgba(0,0,0,0.14)",
        gold_a28="rgba(0,0,0,0.2)", gold_a30="rgba(0,0,0,0.24)",
        navy_shadow="rgba(0,0,0,0.4)", subnav_fg="#ffffff",
        bg_texture="none",
        radius_s="0", radius_m="0", radius_l="0",
        font_head=SYS, font_body=SYS, font_mono='"DejaVu Sans Mono", Consolas, monospace',
        glass_filter="none", stamp_rotate="0deg",
    ),
    "dark": p(
        seal="#ffd400", seal_dark="#e6bf00", seal_deep="#b39b00", seal_light="#ffe74d",
        gold="#ffffff", paper="#000000", paper_card="#000000",
        ink="#ffffff", ink_secondary="#f0f0f0", ink_muted="#d4d4d4",
        border="#ffffff", border_soft="rgba(255,255,255,0.75)", navy="#ffffff",
        on_accent="#000000", on_navy="#000000", ok="#4dff4d", warn="#ffb347", off="#ffffff",
        shadow="0 0 0 2px #ffffff", shadow_hover="0 0 0 3px #ffd400",
        topbar_bg="#000000", topbar_fg="#ffffff", topbar_accent="#ffd400",
        footer_strong="#ffffff", footer_muted="#ffffff", footer_line="#ffffff",
        card_solid="#000000", card_float="#000000", overlay="rgba(0,0,0,0.9)",
        seal_a04=tint("#ffd400", 0.10), seal_a06=tint("#ffd400", 0.14), seal_a07=tint("#ffd400", 0.16),
        seal_a08=tint("#ffd400", 0.18), seal_a10=tint("#ffd400", 0.22),
        gold_a06="rgba(255,255,255,0.06)", gold_a10="rgba(255,255,255,0.10)", gold_a16="rgba(255,255,255,0.14)",
        gold_a28="rgba(255,255,255,0.2)", gold_a30="rgba(255,255,255,0.24)",
        navy_shadow="rgba(255,255,255,0.5)", subnav_fg="#ffffff", scrim_4="rgba(255,255,255,0.5)",
        bg_texture="none",
        radius_s="0", radius_m="0", radius_l="0",
        font_head=SYS, font_body=SYS, font_mono='"DejaVu Sans Mono", Consolas, monospace',
        glass_filter="none", stamp_rotate="0deg",
    ),
}

# ────────────────────────────── 7. seal 印章公文（原样式，提一点对比度）
STYLES["seal"] = {
    "light": p(
        seal="#a61b29", seal_dark="#7d1420", seal_deep="#5c0f18", seal_light="#c8372a",
        gold="#b8933f", paper="#f6f1e4", paper_card="#fffdf7",
        ink="#2b2620", ink_secondary="#5c5548", ink_muted="#8b8271",
        border="#e3d9bf", border_soft="rgba(43,38,32,0.08)", navy="#1d3557",
        on_navy="#eef2fa", ok="#2f6b3a", warn="#a8681f", off="#8b8271",
        shadow="0 1px 4px rgba(93,66,32,0.10)", shadow_hover="0 6px 18px rgba(93,66,32,0.18)",
        topbar_bg="#5c0f18", topbar_fg="#f3e6c8", topbar_accent="#e8c98a",
        footer_strong="#e8dcc0", footer_muted="#b9a97e", footer_line="rgba(232,220,192,0.2)",
        card_solid="#ffffff", card_float="rgba(255,255,255,0.92)",
        overlay="rgba(20,14,8,0.6)",
        seal_a04=tint("#a61b29", 0.04), seal_a06=tint("#a61b29", 0.06), seal_a07=tint("#a61b29", 0.07),
        seal_a08=tint("#a61b29", 0.08), seal_a10=tint("#a61b29", 0.10),
        gold_a06=tint("#b8933f", 0.06), gold_a10=tint("#b8933f", 0.10), gold_a16=tint("#b8933f", 0.16),
        gold_a28=tint("#b8933f", 0.28), gold_a30=tint("#b8933f", 0.30),
        navy_shadow="rgba(29,53,87,0.3)", subnav_fg="#cddaf0",
        bg_texture=(
            "radial-gradient(circle at 15% 8%, rgba(166,27,41,0.045) 0, transparent 45%),"
            "repeating-linear-gradient(180deg, rgba(93,66,32,0.022) 0px, rgba(93,66,32,0.022) 1px, transparent 1px, transparent 26px)"
        ),
        radius_s="2px", radius_m="4px", radius_l="6px",
        font_head=SERIF, font_body=SERIF, font_mono=MONO,
        glass_filter="none", stamp_rotate="-8deg",
    ),
    "dark": p(
        seal="#d8564a", seal_dark="#b8372c", seal_deep="#8f2018", seal_light="#e8776a",
        gold="#d4b06a", paper="#191510", paper_card="#221c14",
        ink="#ece4d3", ink_secondary="#b8ac93", ink_muted="#8a7f6a",
        border="#3a3225", border_soft="rgba(236,228,211,0.10)", navy="#6f93c4",
        on_navy="#0c1424", ok="#5aa96b", warn="#d4a24a", off="#8a7f6a",
        shadow="0 1px 4px rgba(0,0,0,0.35)", shadow_hover="0 6px 18px rgba(0,0,0,0.5)",
        topbar_bg="#140f0a", topbar_fg="#e8dcc0", topbar_accent="#d4b06a",
        footer_strong="#e8dcc0", footer_muted="#b9a97e", footer_line="rgba(232,220,192,0.16)",
        card_solid="#221c14", card_float="rgba(34,28,20,0.95)",
        overlay="rgba(0,0,0,0.72)", scrim_4="rgba(255,255,255,0.35)",
        seal_a04=tint("#d8564a", 0.06), seal_a06=tint("#d8564a", 0.09), seal_a07=tint("#d8564a", 0.10),
        seal_a08=tint("#d8564a", 0.12), seal_a10=tint("#d8564a", 0.14),
        gold_a06=tint("#d4b06a", 0.06), gold_a10=tint("#d4b06a", 0.10), gold_a16=tint("#d4b06a", 0.16),
        gold_a28=tint("#d4b06a", 0.24), gold_a30=tint("#d4b06a", 0.28),
        navy_shadow="rgba(111,147,196,0.3)", subnav_fg="#e8dcc0",
        bg_texture=(
            "radial-gradient(circle at 15% 8%, rgba(216,86,74,0.06) 0, transparent 45%),"
            "repeating-linear-gradient(180deg, rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 26px)"
        ),
        radius_s="2px", radius_m="4px", radius_l="6px",
        font_head=SERIF, font_body=SERIF, font_mono=MONO,
        glass_filter="none", stamp_rotate="-8deg",
    ),
}

NAMES = {
    "mixed": "混合", "flat": "扁平", "glass": "玻璃拟态", "dark": "暗黑科技",
    "swiss": "瑞士编辑", "a11y": "无障碍高对比", "seal": "印章公文",
}

EXTRA = r'''
/* ════════ 材质与结构差异（变量表达不了的部分） ════════ */

/* ── 玻璃拟态：真毛玻璃（半透明 + 模糊 + 高光边 + 内阴影） ── */
.card, .side-card, .banner-wrap, .catalog-panel, .search-result, .gp-item, .zone-item,
.people-card, .org-node, .es-card, .event-card, .wiki-catalog-item, .collapse-panel,
.mod-item, .tl-item, .sv-table, .zone-grid, .stat-cell {
    -webkit-backdrop-filter: var(--glass-filter);
    backdrop-filter: var(--glass-filter);
}
:root[data-style="glass"] .card,
:root[data-style="glass"] .side-card,
:root[data-style="glass"] .gp-item,
:root[data-style="glass"] .zone-item,
:root[data-style="glass"] .people-card,
:root[data-style="glass"] .event-card,
:root[data-style="glass"] .es-card {
    background-image: linear-gradient(152deg, rgba(255,255,255,0.58), rgba(255,255,255,0.06));
    border: 0.5px solid rgba(255,255,255,0.80);
    box-shadow: 0 12px 36px -16px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.9),
                inset 0 -0.5px 0 rgba(255,255,255,0.30);
}
:root[data-style="glass"][data-scheme="dark"] .card,
:root[data-style="glass"][data-scheme="dark"] .side-card,
:root[data-style="glass"][data-scheme="dark"] .gp-item,
:root[data-style="glass"][data-scheme="dark"] .zone-item,
:root[data-style="glass"][data-scheme="dark"] .people-card,
:root[data-style="glass"][data-scheme="dark"] .event-card,
:root[data-style="glass"][data-scheme="dark"] .es-card {
    background-image: linear-gradient(152deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02));
    border: 0.5px solid rgba(255,255,255,0.20);
    box-shadow: 0 14px 44px -18px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.18);
}
:root[data-style="glass"] .gov-topbar,
:root[data-style="glass"] .scroll-notice {
    -webkit-backdrop-filter: blur(18px) saturate(180%);
    backdrop-filter: blur(18px) saturate(180%);
}
:root[data-style="glass"] .card h2::before { content: '◇'; }

/* ── 扁平：纯色块、硬边界、无阴影、直角 ── */
:root[data-style="flat"] .card,
:root[data-style="flat"] .side-card,
:root[data-style="flat"] .gp-item,
:root[data-style="flat"] .zone-item,
:root[data-style="flat"] .people-card,
:root[data-style="flat"] .event-card,
:root[data-style="flat"] .es-card,
:root[data-style="flat"] .collapse-panel {
    box-shadow: none;
    border-width: 2px;
    border-radius: 0;
}
:root[data-style="flat"] .card h2 {
    border-bottom: 2px solid var(--border);
    font-weight: 800;
}
:root[data-style="flat"] .card h2::before {
    content: '';
    width: 6px; height: 16px;
    background: var(--seal);
    border-radius: 0;
    display: inline-block;
    margin-right: 8px;
}

/* ── 瑞士：细线、大标题、左对齐、去装饰 ── */
:root[data-style="swiss"] .card {
    border-radius: 0;
    box-shadow: none;
    border: none;
    border-top: 3px solid var(--ink);
    padding: 16px 0 22px;
    background: transparent;
}
:root[data-style="swiss"] .card h2 {
    border-bottom: none;
    font-size: 26px;
    font-weight: 700;
    letter-spacing: -0.025em;
    line-height: 1.15;
    padding-left: 0;
}
:root[data-style="swiss"] .card h2::before { content: none; }
:root[data-style="swiss"] .card h2 .date-tag {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-muted);
}
:root[data-style="swiss"] h1 { font-size: 40px; letter-spacing: -0.03em; line-height: 1.05; }
:root[data-style="swiss"] .scroll-notice { border-bottom-width: 4px; }
:root[data-style="swiss"] .section-title,
:root[data-style="swiss"] h3 { letter-spacing: -0.01em; }

/* ── 暗黑科技：描边 + 辉光 + 等宽数字 ── */
:root[data-style="dark"] .card,
:root[data-style="dark"] .side-card,
:root[data-style="dark"] .gp-item,
:root[data-style="dark"] .zone-item,
:root[data-style="dark"] .people-card,
:root[data-style="dark"] .es-card,
:root[data-style="dark"] .event-card {
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
}
:root[data-style="dark"] .card h2::before { content: '›'; font-weight: 400; }
:root[data-style="dark"] .stat-num,
:root[data-style="dark"] .date-tag,
:root[data-style="dark"] .doc-code { font-variant-numeric: tabular-nums; letter-spacing: 0.06em; }

/* ── 高对比：加粗边框、去圆角、去过渡 ── */
:root[data-style="a11y"] *,
:root[data-style="a11y"] *::before,
:root[data-style="a11y"] *::after {
    transition: none !important;
    animation-duration: 0.001ms !important;
}
:root[data-style="a11y"] .card,
:root[data-style="a11y"] .side-card,
:root[data-style="a11y"] .gp-item,
:root[data-style="a11y"] .zone-item,
:root[data-style="a11y"] .people-card,
:root[data-style="a11y"] .es-card,
:root[data-style="a11y"] .event-card {
    border-width: 2px !important;
    border-radius: 0;
}
:root[data-style="a11y"] .card h2 { border-bottom: 2px solid var(--border); }
:root[data-style="a11y"] a { text-decoration: underline; text-underline-offset: 2px; }
:root[data-style="a11y"] a:focus-visible,
:root[data-style="a11y"] button:focus-visible {
    outline: 3px solid var(--seal) !important;
    outline-offset: 2px;
}
:root[data-style="a11y"] .card h2::before { content: '■'; }

/* ── 印章公文：纸纹 + 衬线 + 小圆角 ── */
:root[data-style="seal"] .card { border-top: 3px solid var(--seal); }
:root[data-style="seal"] .card h2::before { content: '§'; }

/* ── 混合：轻玻璃 + 细网格 ── */
:root[data-style="mixed"] .card h2::before { content: '▍'; color: var(--seal); }

/* ════════ 字号三档 ════════ */
:root[data-size="sm"] { font-size: 14px; }
:root[data-size="md"] { font-size: 15px; }
:root[data-size="lg"] { font-size: 17px; }

/* ════════ 动效开关 ════════ */
:root[data-motion="off"] *,
:root[data-motion="off"] *::before,
:root[data-motion="off"] *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
}

/* ════════ 风格切换：可拖动的悬浮球 + 面板 ════════ */
.style-fab {
    position: fixed; right: 16px; bottom: 96px; z-index: 1200;
    width: 48px; height: 48px; border-radius: 50%;
    border: 1px solid var(--border);
    background: var(--card-solid); color: var(--seal);
    box-shadow: var(--shadow-hover);
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; cursor: grab;
    touch-action: none; user-select: none; -webkit-user-select: none;
    transition: box-shadow 0.2s, background 0.2s;
}
.style-fab:active { cursor: grabbing; }
.style-fab:hover { box-shadow: 0 0 0 3px var(--seal-a10), var(--shadow-hover); }
.style-fab::after {
    content: '';
    position: absolute; inset: -6px;
    border-radius: 50%;
}
.style-panel {
    position: fixed; right: 16px; bottom: 156px; z-index: 1201;
    width: 300px; max-width: calc(100vw - 32px);
    max-height: 72vh; overflow-y: auto;
    background: var(--card-solid); color: var(--ink);
    border: 1px solid var(--border); border-radius: var(--radius-m);
    box-shadow: var(--shadow-hover);
    padding: 16px;
    display: none;
    -webkit-backdrop-filter: var(--glass-filter);
    backdrop-filter: var(--glass-filter);
}
.style-panel.open { display: block; }
.style-panel h4 {
    font-size: 11px; margin: 12px 0 7px;
    color: var(--ink-muted); letter-spacing: 0.12em; font-weight: 700;
}
.style-panel h4:first-child { margin-top: 0; }
.style-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 7px; }
.style-chip {
    border: 1px solid var(--border); border-radius: var(--radius-s);
    background: var(--paper-card); color: var(--ink);
    padding: 9px 10px; font-size: 12.5px; cursor: pointer; text-align: left;
    display: flex; align-items: center; gap: 7px;
}
.style-chip::before {
    content: '';
    width: 12px; height: 12px; border-radius: 3px;
    background: var(--seal); opacity: 0.55; flex: none;
}
.style-chip[data-style="flat"]::before { border-radius: 0; background: #f97316; }
.style-chip[data-style="glass"]::before { border-radius: 50%; background: linear-gradient(140deg,#8f74ff,#3cd2ff); }
.style-chip[data-style="dark"]::before { background: #22d3ee; box-shadow: 0 0 8px #22d3ee; }
.style-chip[data-style="swiss"]::before { border-radius: 0; background: #e30613; }
.style-chip[data-style="a11y"]::before { border-radius: 0; background: #000; border: 2px solid #ffd400; }
.style-chip[data-style="seal"]::before { border-radius: 50%; background: #a61b29; }
.style-chip { justify-content: flex-start; }
.style-chip > span { flex: 1; }
.style-chip i {
    font-style: normal; font-size: 9px; line-height: 1.6;
    padding: 0 5px; border-radius: 99px; letter-spacing: 0;
    background: var(--seal-a08); color: var(--seal); white-space: nowrap;
}
.style-chip i[data-tag="重点"] { background: var(--seal); color: var(--on-accent); }
.style-chip i[data-tag="默认"] { background: var(--ink-secondary); color: var(--paper); }
.style-chip.active {
    border-color: var(--seal); color: var(--seal); font-weight: 700;
    box-shadow: inset 0 0 0 1px var(--seal);
}
.style-row { display: flex; gap: 7px; flex-wrap: wrap; }
.style-row button {
    flex: 1; min-width: 56px; border: 1px solid var(--border); border-radius: var(--radius-s);
    background: var(--paper-card); color: var(--ink); font-size: 12.5px; padding: 8px 4px; cursor: pointer;
}
.style-row button.active {
    border-color: var(--seal); color: var(--seal); font-weight: 700;
    box-shadow: inset 0 0 0 1px var(--seal);
}
.style-panel .hint {
    font-size: 11px; color: var(--ink-muted); line-height: 1.7;
    margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-soft);
}
@media (max-width: 768px) {
    .style-fab { width: 44px; height: 44px; font-size: 18px; }
    .style-panel { width: 272px; right: 12px; bottom: 148px; }
}
''' + r'''
/* ════════ 第二轮：装饰条与卡片的主题化细节 ════════ */
:root[data-style="swiss"] .card::before,
:root[data-style="swiss"] .card::after { display: none; }
:root[data-style="swiss"] .card:hover { transform: none; }
:root[data-style="swiss"] .card h2::before { content: none; }
:root[data-style="swiss"] .scroll-notice::before { content: 'NOTICE'; letter-spacing: 0.18em; font-weight: 700; }
:root[data-style="swiss"] .gov-topbar { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; }

:root[data-style="flat"] .card::before { width: 6px; opacity: 1; }
:root[data-style="flat"] .card::after { display: none; }
:root[data-style="flat"] .card:hover { transform: none; }
:root[data-style="flat"] .nav-item.active > a { background: var(--seal); }

:root[data-style="glass"] .card { border-radius: var(--radius-l); }
:root[data-style="glass"] .card::before {
    border-radius: var(--radius-l) 0 0 var(--radius-l);
    background: linear-gradient(180deg, rgba(255,255,255,0.75), rgba(255,255,255,0.1));
    width: 3px;
}
:root[data-style="glass"] .card::after { display: none; }
:root[data-style="glass"] .gov-topbar,
:root[data-style="glass"] .scroll-notice { border: none; }
:root[data-style="glass"] .style-fab {
    background: linear-gradient(150deg, rgba(255,255,255,0.7), rgba(255,255,255,0.25));
    -webkit-backdrop-filter: blur(18px) saturate(180%);
    backdrop-filter: blur(18px) saturate(180%);
}

:root[data-style="dark"] .card::before {
    width: 3px;
    background: var(--seal);
    box-shadow: 0 0 12px var(--seal);
}
:root[data-style="dark"] .card::after { display: none; }
:root[data-style="dark"] .style-fab { box-shadow: var(--shadow), 0 0 18px -6px var(--seal); }

:root[data-style="a11y"] .card::before { width: 8px; opacity: 1; }
:root[data-style="a11y"] .card::after { display: none; }
:root[data-style="a11y"] .card:hover { transform: none; }
:root[data-style="a11y"] .scroll-notice { height: auto; min-height: 40px; line-height: 1.5; padding: 6px 0; }
:root[data-style="a11y"] .scroll-text { animation: none !important; white-space: normal; padding: 0 12px; }
:root[data-style="a11y"] .style-fab { border-width: 2px; }

/* ════════ 附页（plus.css）组件的玻璃与描边 ════════ */
.doc, .node, .rule-card, .step, .topic, .tl-item {
    -webkit-backdrop-filter: var(--glass-filter);
    backdrop-filter: var(--glass-filter);
}
:root[data-style="glass"] .doc,
:root[data-style="glass"] .node,
:root[data-style="glass"] .step {
    background-image: linear-gradient(155deg, rgba(255,255,255,0.6), rgba(255,255,255,0.14));
    border: 1px solid rgba(255,255,255,0.7);
    box-shadow: var(--shadow), inset 0 1px 0 rgba(255,255,255,0.85);
}
:root[data-style="glass"][data-scheme="dark"] .doc,
:root[data-style="glass"][data-scheme="dark"] .node,
:root[data-style="glass"][data-scheme="dark"] .step {
    background-image: linear-gradient(155deg, rgba(255,255,255,0.14), rgba(255,255,255,0.03));
    border: 1px solid rgba(255,255,255,0.18);
}
:root[data-style="swiss"] .doc, :root[data-style="swiss"] .step { border-radius: 0; box-shadow: none; }
:root[data-style="flat"] .doc, :root[data-style="flat"] .step { border-radius: 0; box-shadow: none; border-width: 2px; }
:root[data-style="a11y"] .doc, :root[data-style="a11y"] .step { border-width: 2px; border-radius: 0; }


/* ════════ 高对比补充：区块全部实色、线框加粗 ════════ */
:root[data-style="a11y"] .card,
:root[data-style="a11y"] .zone-item,
:root[data-style="a11y"] .gp-item,
:root[data-style="a11y"] .people-card,
:root[data-style="a11y"] .es-card,
:root[data-style="a11y"] .event-card,
:root[data-style="a11y"] .collapse-panel,
:root[data-style="a11y"] .wiki-catalog-item {
    background: var(--paper-card) !important;
    border: 2px solid var(--border) !important;
    box-shadow: none !important;
}
:root[data-style="a11y"] .wiki-catalog-item.active { outline: 3px solid var(--seal); outline-offset: 2px; }
:root[data-style="a11y"] .date-tag,
:root[data-style="a11y"] .doc-code { text-decoration: underline; text-underline-offset: 2px; }
:root[data-style="a11y"] .stat-num { text-decoration: underline; text-decoration-thickness: 2px; }

/* ════════ 第三轮（按真机反馈）：玻璃主题的实心色块改为真玻璃 ════════ */
:root[data-style="glass"] nav,
:root[data-style="glass"] .gov-topbar,
:root[data-style="glass"] .scroll-notice,
:root[data-style="glass"] .header,
:root[data-style="glass"] .banner-item {
    -webkit-backdrop-filter: blur(22px) saturate(180%);
    backdrop-filter: blur(22px) saturate(180%);
}
:root[data-style="glass"] nav {
    background: rgba(255,255,255,0.52);
    border-bottom: 0.5px solid rgba(60,60,67,0.14);
    box-shadow: 0 0.5px 0 rgba(255,255,255,0.75), 0 8px 28px rgba(0,0,0,0.06);
}
:root[data-style="glass"] .nav-item > a { color: var(--ink); }
:root[data-style="glass"] .nav-item > a:hover { background: rgba(79,70,229,0.08); }
:root[data-style="glass"] .nav-item.active > a { background: var(--seal-a10); color: var(--seal); }
:root[data-style="glass"] .sub-nav {
    background: rgba(255,255,255,0.9);
    -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.8);
    box-shadow: 0 12px 30px rgba(60,70,130,0.14);
}
:root[data-style="glass"] .sub-nav li a { color: var(--ink-secondary); }
:root[data-style="glass"] .header { background: rgba(255,255,255,0.55); }
:root[data-style="glass"] .gov-topbar {
    background: rgba(255,255,255,0.44);
    color: var(--ink-secondary);
    border-bottom: 0.5px solid rgba(60,60,67,0.12);
}
:root[data-style="glass"] .gov-topbar .doc-code,
:root[data-style="glass"] .gov-topbar .top-links a { color: var(--ink-secondary); }
:root[data-style="glass"] .scroll-notice {
    background: rgba(255,255,255,0.46);
    color: var(--ink);
    border-bottom: 0.5px solid rgba(60,60,67,0.12);
}
:root[data-style="glass"] .scroll-notice::before {
    background: rgba(255,255,255,0.62);
    color: var(--seal);
    border-right: 0.5px solid rgba(60,60,67,0.12);
}
:root[data-style="glass"] .banner-item {
    background: linear-gradient(150deg, rgba(255,255,255,0.56), rgba(255,255,255,0.12));
    color: var(--ink);
}
:root[data-style="glass"] .banner-item.img-banner { background: rgba(255,255,255,0.34); }
:root[data-style="glass"] .banner-btn {
    background: rgba(255,255,255,0.66);
    color: var(--ink);
    border: 1px solid rgba(255,255,255,0.85);
}
:root[data-style="glass"] .banner-dot { background: rgba(30,35,70,0.20); }

:root[data-style="glass"][data-scheme="dark"] nav {
    background: rgba(255,255,255,0.08);
    border-bottom: 1px solid rgba(255,255,255,0.16);
    box-shadow: 0 10px 30px rgba(0,0,0,0.4);
}
:root[data-style="glass"][data-scheme="dark"] .nav-item > a { color: var(--ink); }
:root[data-style="glass"][data-scheme="dark"] .sub-nav { background: rgba(20,26,46,0.94); border-color: rgba(255,255,255,0.16); }
:root[data-style="glass"][data-scheme="dark"] .header { background: rgba(255,255,255,0.06); }
:root[data-style="glass"][data-scheme="dark"] .gov-topbar {
    background: rgba(255,255,255,0.06); color: var(--ink-secondary);
    border-bottom: 1px solid rgba(255,255,255,0.14);
}
:root[data-style="glass"][data-scheme="dark"] .scroll-notice {
    background: rgba(255,255,255,0.10); color: var(--ink);
    border-bottom: 1px solid rgba(255,255,255,0.18);
}
:root[data-style="glass"][data-scheme="dark"] .scroll-notice::before {
    background: rgba(255,255,255,0.14); color: var(--ink);
    border-right: 1px solid rgba(255,255,255,0.2);
}
:root[data-style="glass"][data-scheme="dark"] .banner-item {
    background: linear-gradient(150deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04));
    color: var(--ink);
}
:root[data-style="glass"][data-scheme="dark"] .banner-dot { background: rgba(255,255,255,0.32); }

/* ════════ 高对比：黑白分块，蓝色只留给链接与焦点 ════════ */
:root[data-style="a11y"] nav,
:root[data-style="a11y"] .gov-topbar,
:root[data-style="a11y"] .scroll-notice,
:root[data-style="a11y"] .banner-item {
    background: #000000 !important;
    color: #ffffff !important;
    border-color: #ffffff !important;
}
:root[data-style="a11y"] nav a,
:root[data-style="a11y"] .gov-topbar a,
:root[data-style="a11y"] .gov-topbar .doc-code,
:root[data-style="a11y"] .scroll-notice .scroll-text { color: #ffffff !important; }
:root[data-style="a11y"] nav { border-bottom: 2px solid #ffffff; }
:root[data-style="a11y"] .scroll-notice { border-bottom: 2px solid #ffffff; }
:root[data-style="a11y"] .scroll-notice::before {
    background: #000000; color: #ffffff;
    border-right: 2px solid #ffffff;
}
:root[data-style="a11y"] .nav-item.active > a,
:root[data-style="a11y"] .nav-item > a:hover { background: #ffffff; color: #000000 !important; }
:root[data-style="a11y"] .header { background: #ffffff; border-bottom: 3px solid #000000; }
:root[data-style="a11y"] .banner-dot { background: #ffffff; opacity: 0.5; }
:root[data-style="a11y"] .banner-dot.active { opacity: 1; }
:root[data-style="a11y"] .banner-btn { background: #000000; color: #ffffff; border: 2px solid #ffffff; }
:root[data-style="a11y"] .sub-nav { background: #000000; border: 2px solid #ffffff; }
:root[data-style="a11y"] .sub-nav li a { color: #ffffff; }
:root[data-style="a11y"] .stat-cell,
:root[data-style="a11y"] .card { background: #ffffff; color: #000000; box-shadow: none; }

:root[data-style="a11y"][data-scheme="dark"] nav,
:root[data-style="a11y"][data-scheme="dark"] .gov-topbar,
:root[data-style="a11y"][data-scheme="dark"] .scroll-notice,
:root[data-style="a11y"][data-scheme="dark"] .banner-item {
    background: #000000 !important; color: #ffffff !important;
    border-color: #ffffff !important;
}
:root[data-style="a11y"][data-scheme="dark"] .header { background: #000000; border-bottom: 3px solid #ffffff; }
:root[data-style="a11y"][data-scheme="dark"] .stat-cell,
:root[data-style="a11y"][data-scheme="dark"] .card { background: #000000; color: #ffffff; }


/* ════════ 第四轮：液态玻璃（Liquid Glass）══ 参考泉文社而做得更细 ════════ */
:root {
    --ease-ios: cubic-bezier(.32,.72,0,1);
    --r-pill: 980px;
}

/* — 卡片：斜角双向渐变 + 30px 模糊 + 1px 渐变描边 + 光谱色散 — */
:root[data-style="glass"] .card {
    position: relative;
    background: linear-gradient(155deg, rgba(255,255,255,0.50), rgba(255,255,255,0.04));
    background-color: transparent;
    border: none;
    border-radius: 22px;
    box-shadow:
        0 24px 64px -26px rgba(0,0,0,0.30),
        0 8px 24px -14px rgba(0,0,0,0.16),
        inset 0 1px 0 rgba(255,255,255,0.55);
    transition: transform .45s var(--ease-ios), box-shadow .45s var(--ease-ios);
}
/* 1px 渐变描边（mask 双图层相减） */
:root[data-style="glass"] .card::before {
    content: "";
    position: absolute; inset: 0;
    border-radius: inherit; padding: 1px;
    background: linear-gradient(160deg,
        rgba(255,255,255,0.92), rgba(255,255,255,0.10) 34%,
        rgba(255,255,255,0.06) 66%, rgba(255,255,255,0.42));
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
    pointer-events: none;
    opacity: 1;
    width: auto; height: auto;
    background-color: transparent;
    box-shadow: none;
}
/* 边缘光谱色散（左偏红、右偏蓝、底偏紫） */
:root[data-style="glass"] .card::after {
    content: "";
    position: absolute; inset: 0;
    border-radius: inherit; pointer-events: none;
    box-shadow:
        inset 1.5px 0 7px -3px rgba(255,95,120,0.26),
        inset -1.5px 0 7px -3px rgba(90,140,255,0.32),
        inset 0 -1.5px 6px -3px rgba(140,110,255,0.22);
    opacity: .75;
    transition: opacity .4s var(--ease-ios);
    background: none;
    width: auto; height: auto;
}
:root[data-style="glass"] .card:hover {
    transform: translateY(-2.5px);
    box-shadow:
        0 32px 80px -28px rgba(0,0,0,0.36),
        0 12px 30px -16px rgba(0,0,0,0.20),
        inset 0 1px 0 rgba(255,255,255,0.62);
}
:root[data-style="glass"] .card:hover::after { opacity: 1; }

/* 深色：烟熏玻璃 */
:root[data-style="glass"][data-scheme="dark"] .card {
    background: linear-gradient(155deg, rgba(255,255,255,0.105), rgba(255,255,255,0.015));
    box-shadow:
        0 28px 72px -26px rgba(0,0,0,0.75),
        0 8px 24px -14px rgba(0,0,0,0.5),
        inset 0 1px 0 rgba(255,255,255,0.20);
}
:root[data-style="glass"][data-scheme="dark"] .card::before {
    background: linear-gradient(160deg,
        rgba(255,255,255,0.55), rgba(255,255,255,0.05) 36%,
        rgba(255,255,255,0.03) 64%, rgba(255,255,255,0.24));
}
:root[data-style="glass"][data-scheme="dark"] .card::after {
    box-shadow:
        inset 1.5px 0 7px -3px rgba(255,90,130,0.30),
        inset -1.5px 0 7px -3px rgba(80,150,255,0.36),
        inset 0 -1.5px 6px -3px rgba(150,110,255,0.26);
}

/* — 顶部导航：更强的玻璃与发丝分隔 — */
:root[data-style="glass"] nav {
    background: linear-gradient(180deg, rgba(255,255,255,0.56), rgba(255,255,255,0.28));
    border-bottom: none;
    box-shadow: 0 1px 0 rgba(255,255,255,0.55), 0 12px 32px -18px rgba(0,0,0,0.22);
    -webkit-backdrop-filter: blur(26px) saturate(190%);
    backdrop-filter: blur(26px) saturate(190%);
}
:root[data-style="glass"] nav::after {
    content: "";
    position: absolute; left: 0; right: 0; bottom: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(60,60,67,0.18) 18%, rgba(60,60,67,0.18) 82%, transparent);
    pointer-events: none;
}
:root[data-style="glass"][data-scheme="dark"] nav {
    background: linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.02));
    box-shadow: 0 1px 0 rgba(255,255,255,0.10), 0 12px 32px -18px rgba(0,0,0,0.75);
}

/* — 分组小卡（分区 / 群入口 / 人物）：轻玻璃，不用模糊以保性能 — */
:root[data-style="glass"] .zone-item,
:root[data-style="glass"] .gp-item,
:root[data-style="glass"] .people-card,
:root[data-style="glass"] .stat-cell,
:root[data-style="glass"] .es-card,
:root[data-style="glass"] .event-card,
:root[data-style="glass"] .wiki-catalog-item {
    background: linear-gradient(155deg, rgba(255,255,255,0.48), rgba(255,255,255,0.10));
    border: 1px solid rgba(255,255,255,0.50);
    border-radius: 16px;
    box-shadow: 0 6px 18px -10px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.6);
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    transition: transform .35s var(--ease-ios), box-shadow .35s var(--ease-ios);
}
:root[data-style="glass"] .zone-item:hover,
:root[data-style="glass"] .gp-item:hover,
:root[data-style="glass"] .people-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 34px -14px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.7);
}
:root[data-style="glass"][data-scheme="dark"] .zone-item,
:root[data-style="glass"][data-scheme="dark"] .gp-item,
:root[data-style="glass"][data-scheme="dark"] .people-card,
:root[data-style="glass"][data-scheme="dark"] .stat-cell,
:root[data-style="glass"][data-scheme="dark"] .es-card,
:root[data-style="glass"][data-scheme="dark"] .event-card,
:root[data-style="glass"][data-scheme="dark"] .wiki-catalog-item {
    background: linear-gradient(155deg, rgba(255,255,255,0.095), rgba(255,255,255,0.015));
    border: 1px solid rgba(255,255,255,0.16);
    box-shadow: 0 8px 22px -12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.14);
}

/* — 浅色以白为主：只在按钮、链接、图标留彩色 — */
:root[data-style="glass"][data-scheme="light"] .stat-num { color: var(--ink); }
:root[data-style="glass"][data-scheme="light"] .stat-label { color: var(--ink-secondary); }
:root[data-style="glass"][data-scheme="light"] .card h2 { color: var(--ink); }
:root[data-style="glass"][data-scheme="light"] .card h2::before { color: var(--seal); }
:root[data-style="glass"][data-scheme="light"] .date-tag { color: var(--ink-muted); }
:root[data-style="glass"][data-scheme="light"] .org-node-role,
:root[data-style="glass"][data-scheme="light"] .es-body,
:root[data-style="glass"][data-scheme="light"] .people-desc { color: var(--ink-secondary); }

/* — 胶囊按钮 — */
:root[data-style="glass"] .collapse-btn,
:root[data-style="glass"] .theme-toggle,
:root[data-style="glass"] .catalog-toggle,
:root[data-style="glass"] .back-top {
    border-radius: var(--r-pill);
    background: linear-gradient(155deg, rgba(255,255,255,0.70), rgba(255,255,255,0.30));
    box-shadow: 0 6px 20px -10px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.8);
    transition: transform .35s var(--ease-ios), box-shadow .35s var(--ease-ios);
}
:root[data-style="glass"][data-scheme="dark"] .collapse-btn,
:root[data-style="glass"][data-scheme="dark"] .theme-toggle,
:root[data-style="glass"][data-scheme="dark"] .catalog-toggle,
:root[data-style="glass"][data-scheme="dark"] .back-top {
    background: linear-gradient(155deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06));
    box-shadow: 0 6px 20px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.18);
}

/* — 苹果缓动应用到全局交互 — */
:root[data-style="glass"] a,
:root[data-style="glass"] button,
:root[data-style="glass"] .card,
:root[data-style="glass"] .zone-item,
:root[data-style="glass"] .gp-item,
:root[data-style="glass"] .people-card {
    transition-timing-function: var(--ease-ios);
}

/* — 用户要求降低透明度时自动退回不透明 — */
@media (prefers-reduced-transparency: reduce) {
    :root[data-style="glass"] .card,
    :root[data-style="glass"] .zone-item,
    :root[data-style="glass"] .gp-item,
    :root[data-style="glass"] .people-card,
    :root[data-style="glass"] nav {
        -webkit-backdrop-filter: none !important;
        backdrop-filter: none !important;
        background: var(--paper-card) !important;
    }
}

/* — 移动端：模糊半径降档，保流畅但仍是玻璃 — */
@media (max-width: 768px) {
    :root[data-style="glass"] .card {
        -webkit-backdrop-filter: blur(18px) saturate(170%);
        backdrop-filter: blur(18px) saturate(170%);
    }
    :root[data-style="glass"] nav {
        -webkit-backdrop-filter: blur(18px) saturate(180%);
        backdrop-filter: blur(18px) saturate(180%);
    }
}
'''


def block(style_key, scheme, pal):
    lines = [f':root[data-style="{style_key}"][data-scheme="{scheme}"] {{']
    for k, v in pal.items():
        lines.append(f"    --{k}: {v};")
    lines.append("}")
    return "\n".join(lines)


def main():
    parts = [
        "/* 由 tools/build-themes.py 生成，请勿手工编辑 */",
        '/* 七套风格 × 明暗两版：<html data-style="mixed" data-scheme="light" data-size="md" data-motion="on"> */',
        "",
        "/* ── 兜底：未设置属性时按 seal（印章公文）/ 浅色 渲染 ── */",
    ]
    fallback = block("seal", "light", STYLES["seal"]["light"]).replace(
        ':root[data-style="seal"][data-scheme="light"]',
        ':root, :root[data-style="seal"][data-scheme="light"]')
    parts.append(fallback)

    for key in ["mixed", "seal", "flat", "glass", "dark", "swiss", "a11y"]:
        for scheme in ("light", "dark"):
            parts.append(f"\n/* ── {NAMES[key]} · {'浅色' if scheme == 'light' else '深色'} ── */")
            parts.append(block(key, scheme, STYLES[key][scheme]))

    parts.append(EXTRA)
    css = "\n".join(parts)
    OUT.write_text(css, encoding="utf-8")

    # 变量齐备性自检
    used = set()
    for f in ["base.css", "plus.css"]:
        pth = ROOT / "assets" / "css" / f
        if pth.exists():
            import re
            used |= set(re.findall(r"var\(--([a-z0-9-]+)", pth.read_text(encoding="utf-8")))
    missing = sorted(used - set(STYLES["mixed"]["light"]))
    print(f"themes.css 生成完成：{len(css)} 字符 / {css.count(chr(10))+1} 行")
    print("未被定义的变量:", missing if missing else "无")
    for key in ["mixed", "seal", "flat", "glass", "dark", "swiss", "a11y"]:
        print(f"  {NAMES[key]:<8} 变量 {len(STYLES[key]['light'])} 项 · 圆角 {STYLES[key]['light']['radius-m']} · 主色 {STYLES[key]['light']['seal']}")


if __name__ == "__main__":
    main()