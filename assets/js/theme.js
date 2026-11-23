/* 风格系统：七套外观 × 明暗 × 字号 × 动效，两页共用
 * 用法：在 <head> 里尽早引入本文件（避免首屏闪色），设置会自动注入右下角切换面板。
 */
(function () {
  'use strict';

  var STYLE_VALUES = ['mixed', 'flat', 'glass', 'dark', 'swiss', 'a11y', 'seal'];
  var KEY = {
    style: 'xinyushe-style',
    scheme: 'xinyushe-scheme',
    size: 'xinyushe-size',
    motion: 'xinyushe-motion'
  };
  var STYLE_META = {
    seal:   { label: '印章公文', tag: '默认' },
    glass:  { label: '玻璃拟态', tag: '重点' },
    a11y:   { label: '高对比',   tag: '重点' },
    mixed:  { label: '混合',     tag: '完善中' },
    flat:   { label: '扁平',     tag: '完善中' },
    dark:   { label: '暗黑科技', tag: '完善中' },
    swiss:  { label: '瑞士编辑', tag: '完善中' }
  };
  var STYLE_ORDER = ['seal', 'glass', 'a11y', 'mixed', 'flat', 'dark', 'swiss'];

  function get(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { window.localStorage.setItem(k, v); } catch (e) {} }

  // URL 参数覆盖（?style=glass&scheme=dark&size=lg&motion=off），用于分享与截图，不写入本机设置
  function fromQuery() {
    var out = {};
    try {
      var q = new URLSearchParams(window.location.search);
      ['style', 'scheme', 'size', 'motion'].forEach(function (k) {
        var v = q.get(k);
        if (v) out[k] = v;
      });
    } catch (e) {}
    return out;
  }

  function read() {
    var q = fromQuery();
    var style = q.style || get(KEY.style);
    var scheme = q.scheme || get(KEY.scheme);
    var size = q.size || get(KEY.size);
    var motion = q.motion || get(KEY.motion);
    return {
      style: STYLE_VALUES.indexOf(style) >= 0 ? style : 'seal',
      scheme: scheme === 'dark' || scheme === 'light' ? scheme : 'light',
      size: size === 'sm' || size === 'lg' ? size : 'md',
      motion: motion === 'off' ? 'off' : 'on'
    };
  }

  function syncButtons(st) {
    var root = document.getElementById('styleGrid');
    if (root) {
      Array.prototype.forEach.call(root.querySelectorAll('[data-style]'), function (b) {
        b.classList.toggle('active', b.dataset.style === st.style);
        b.setAttribute('aria-pressed', b.dataset.style === st.style ? 'true' : 'false');
      });
    }
    var groups = [['#schemeRow', 'scheme'], ['#sizeRow', 'size'], ['#motionRow', 'motion']];
    groups.forEach(function (g) {
      var box = document.querySelector(g[0]);
      if (!box) return;
      Array.prototype.forEach.call(box.querySelectorAll('[data-' + g[1] + ']'), function (b) {
        b.classList.toggle('active', b.dataset[g[1]] === st[g[1]]);
        b.setAttribute('aria-pressed', b.dataset[g[1]] === st[g[1]] ? 'true' : 'false');
      });
    });
    var t = document.getElementById('themeToggle') || document.getElementById('themeToggleBtn');
    if (t) t.textContent = st.scheme === 'dark' ? '☼' : '☾';
  }

  function apply(st) {
    var root = document.documentElement;
    root.setAttribute('data-style', st.style);
    root.setAttribute('data-scheme', st.scheme);
    root.setAttribute('data-size', st.size);
    root.setAttribute('data-motion', st.motion);
    root.style.colorScheme = st.scheme === 'dark' ? 'dark' : 'light';
    syncButtons(st);
  }

  function panelHTML() {
    var chips = STYLE_ORDER.map(function (k) {
      var m = STYLE_META[k] || { label: k, tag: '' };
      var tag = m.tag ? '<i data-tag="' + m.tag + '">' + m.tag + '</i>' : '';
      return '<button class="style-chip" type="button" data-style="' + k + '">' +
        '<span>' + m.label + '</span>' + tag + '</button>';
    }).join('');
    return '' +
      '<button class="style-fab" id="styleFab" type="button" aria-label="切换界面风格" aria-expanded="false">◐</button>' +
      '<div class="style-panel" id="stylePanel" role="dialog" aria-label="界面风格设置">' +
      '<h4>界面风格</h4><div class="style-grid" id="styleGrid">' + chips + '</div>' +
      '<h4>明暗</h4><div class="style-row" id="schemeRow">' +
      '<button type="button" data-scheme="light">浅色</button><button type="button" data-scheme="dark">深色</button></div>' +
      '<h4>字号</h4><div class="style-row" id="sizeRow">' +
      '<button type="button" data-size="sm">小</button><button type="button" data-size="md">中</button>' +
      '<button type="button" data-size="lg">大</button></div>' +
      '<h4>动效</h4><div class="style-row" id="motionRow">' +
      '<button type="button" data-motion="on">开启</button><button type="button" data-motion="off">减弱</button></div>' +
      '<p class="hint">七套风格各自适配明暗两版，设置保存在本机并与「史料与规章馆」同步。按住圆钮可拖动位置，双击圆钮回到右下角。</p>' +
      '</div>';
  }

  function buildPanel() {
    if (document.getElementById('stylePanel')) return;
    var host = document.body;
    if (!host) return;
    host.insertAdjacentHTML('beforeend', panelHTML());
    var fab = document.getElementById('styleFab');
    var panel = document.getElementById('stylePanel');
    if (fab && panel) {
      makeDraggable(fab);
      fab.addEventListener('click', function (e) {
        if (fab.dataset.dragged === '1') { fab.dataset.dragged = '0'; return; }
        e.stopPropagation();
        var open = panel.classList.toggle('open');
        fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      document.addEventListener('click', function (e) {
        if (!panel.classList.contains('open')) return;
        if (panel.contains(e.target) || fab.contains(e.target)) return;
        panel.classList.remove('open');
        fab.setAttribute('aria-expanded', 'false');
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && panel.classList.contains('open')) {
          panel.classList.remove('open');
          fab.setAttribute('aria-expanded', 'false');
        }
      });
    }
    bind();
    syncButtons(read());
  }

  function bind() {
    var map = [
      ['#styleGrid', KEY.style, 'style'],
      ['#schemeRow', KEY.scheme, 'scheme'],
      ['#sizeRow', KEY.size, 'size'],
      ['#motionRow', KEY.motion, 'motion']
    ];
    map.forEach(function (m) {
      var box = document.querySelector(m[0]);
      if (!box) return;
      Array.prototype.forEach.call(box.querySelectorAll('[data-' + m[2] + ']'), function (btn) {
        btn.addEventListener('click', function () {
          set(m[1], btn.dataset[m[2]]);
          apply(read());
        });
      });
    });
  }


  // 悬浮球可拖动：位置记在本机，双击复位
  function makeDraggable(fab) {
    var POS_KEY = 'xinyushe-fab-pos';
    var dragging = false, moved = false, startX = 0, startY = 0, originX = 0, originY = 0;

    function clamp(x, y) {
      var w = fab.offsetWidth || 46, h = fab.offsetHeight || 46;
      var maxX = Math.max(8, window.innerWidth - w - 8);
      var maxY = Math.max(8, window.innerHeight - h - 8);
      return { x: Math.max(8, Math.min(x, maxX)), y: Math.max(8, Math.min(y, maxY)) };
    }
    function place(x, y) {
      var c = clamp(x, y);
      fab.style.left = c.x + 'px';
      fab.style.top = c.y + 'px';
      fab.style.right = 'auto';
      fab.style.bottom = 'auto';
      return c;
    }
    function save(x, y) {
      try { localStorage.setItem(POS_KEY, JSON.stringify({ x: x, y: y })); } catch (e) {}
    }
    function restore() {
      var p = null;
      try { p = JSON.parse(localStorage.getItem(POS_KEY) || 'null'); } catch (e) {}
      if (p && typeof p.x === 'number' && typeof p.y === 'number') {
        place(p.x, p.y);
        return true;
      }
      return false;
    }

    if (!restore()) {
      // 默认贴右下，但在窄屏上抬一点避开返回顶部
      var w = window.innerWidth;
      place(w - 62, window.innerHeight - 150);
    }

    fab.addEventListener('pointerdown', function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      dragging = true; moved = false;
      startX = e.clientX; startY = e.clientY;
      var r = fab.getBoundingClientRect();
      originX = r.left; originY = r.top;
      fab.setPointerCapture && fab.setPointerCapture(e.pointerId);
      fab.style.transition = 'none';
    });

    fab.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX, dy = e.clientY - startY;
      if (!moved && Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      if (!moved) return;
      e.preventDefault();
      place(originX + dx, originY + dy);
    });

    function end(e) {
      if (!dragging) return;
      dragging = false;
      fab.style.transition = '';
      if (moved) {
        var r = fab.getBoundingClientRect();
        save(r.left, r.top);
        fab.dataset.dragged = '1';
        window.setTimeout(function () { fab.dataset.dragged = '0'; }, 0);
      }
      if (e && e.pointerId && fab.releasePointerCapture) {
        try { fab.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    }
    fab.addEventListener('pointerup', end);
    fab.addEventListener('pointercancel', end);

    fab.addEventListener('dblclick', function () {
      try { localStorage.removeItem(POS_KEY); } catch (e) {}
      place(window.innerWidth - 62, window.innerHeight - 150);
    });

    window.addEventListener('resize', function () {
      var r = fab.getBoundingClientRect();
      var c = place(r.left, r.top);
      if (dragging) return;
      save(c.x, c.y);
    });
  }

  function bindThemeToggle() {
    var t = document.getElementById('themeToggle') || document.getElementById('themeToggleBtn');
    if (!t || t.dataset.xyBound) return;
    t.dataset.xyBound = '1';
    t.addEventListener('click', function () {
      var st = read();
      st.scheme = st.scheme === 'dark' ? 'light' : 'dark';
      set(KEY.scheme, st.scheme);
      apply(st);
    });
  }

  // 尽早应用，避免首屏闪色
  apply(read());

  function boot() {
    buildPanel();
    bindThemeToggle();
    apply(read());
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.XYTheme = { read: read, apply: apply, palette: STYLE_VALUES };
})();