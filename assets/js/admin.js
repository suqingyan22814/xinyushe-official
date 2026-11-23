/* 新雨社数据后台 v0.2
 * 双级权限 · 本地模式（免 Token） + 云端模式（GitHub Contents API）
 *
 * 账号改动位置：下方 ACCOUNTS 数组。改完记得刷新页面。
 */
(function () {
    'use strict';

    /* ================= 账号 ================= */
    var ACCOUNTS = [
        { user: 'xinyushe', pass: 'yushu2026',  role: 'super', label: '超级管理员' },
        { user: 'daily',    pass: 'daily2026',  role: 'daily', label: '日常管理员' }
    ];
    // 日常管理员可编辑的文件（其余为史书/公报等只读档案）
    var DAILY_ALLOW = ['site', 'news', 'timeline', 'events', 'zones', 'people',
                       'surveys', 'faq', 'groups', 'emergency', 'banner',
                       'mod-list', 'mod-timeline', 'wiki', 'org'];

    var SESSION_KEY = 'xinyushe-admin-session';
    var CFG_KEY = 'xinyushe-admin-cfg';
    var API = 'https://api.github.com';
    var FILE_LIST = ['site', 'banner', 'news', 'timeline', 'people', 'zones', 'events',
                     'mod-list', 'mod-timeline', 'wiki', 'faq', 'history-volumes', 'org',
                     'surveys', 'emergency', 'groups', 'archive'];

    var state = {
        role: null,
        mode: 'local',
        files: [],
        current: null,
        sha: null,
        original: '',
        local: {},
        dirty: {}
    };

    function $(id) { return document.getElementById(id); }
    function hide(el, v) { if (el) el.classList.toggle('hide', !!v); }

    function log(msg, tone) {
        var box = $('logList');
        if (!box) return;
        var li = document.createElement('li');
        var t = new Date();
        var hh = String(t.getHours()).padStart(2, '0');
        var mm = String(t.getMinutes()).padStart(2, '0');
        var ss = String(t.getSeconds()).padStart(2, '0');
        var color = tone === 'err' ? ' style="color:var(--seal)"' : tone === 'ok' ? ' style="color:var(--ok)"' : '';
        li.innerHTML = '<time>' + hh + ':' + mm + ':' + ss + '</time><span' + color + '>' + msg + '</span>';
        box.insertBefore(li, box.firstChild);
        while (box.children.length > 80) box.removeChild(box.lastChild);
    }

    function msg(text, tone) {
        var el = $('editMsg');
        el.textContent = text || '';
        el.className = 'adm-msg' + (tone ? ' ' + tone : '');
    }

    /* ================= 登录 ================= */
    function findAccount(user, pass) {
        for (var i = 0; i < ACCOUNTS.length; i++) {
            if (ACCOUNTS[i].user === user && ACCOUNTS[i].pass === pass) return ACCOUNTS[i];
        }
        return null;
    }

    function doLogin() {
        var user = $('loginUser').value.trim();
        var pass = $('loginPass').value;
        var acc = findAccount(user, pass);
        var err = $('loginErr');
        var box = $('loginBox');
        if (!acc) {
            err.textContent = '账号或密码不正确';
            box.classList.add('shake');
            setTimeout(function () { box.classList.remove('shake'); }, 320);
            return;
        }
        state.role = acc.role;
        try { localStorage.setItem(SESSION_KEY, JSON.stringify({ user: acc.user, role: acc.role, label: acc.label })); } catch (e) {}
        enterApp(acc);
    }

    function enterApp(acc) {
        $('loginScreen').classList.add('hide');
        $('appRoot').classList.remove('hide');
        var badge = $('roleBadge');
        badge.textContent = acc.label + ' · ' + acc.user;
        badge.className = 'role-badge ' + acc.role;
        $('appSub').textContent = acc.role === 'super'
            ? '超级管理员 · 可编辑全部数据、新建与删除文件'
            : '日常管理员 · 可维护公告、分区、人物、普查等日常数据';
        log('登录成功：' + acc.label + '（' + acc.user + '）', 'ok');
        applyRole();
        restoreCloudCfg();
    }

    function applyRole() {
        var isSuper = state.role === 'super';
        // 日常管理员看不到「云端提交」以外的高级入口（后续版本扩展）
        hide($('btnSave'), false);
        if (!isSuper) {
            $('appSub').title = '部分档案（史书、公报原文）对日常管理员只读';
        }
    }

    function doLogout() {
        try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
        location.reload();
    }

    function restoreSession() {
        try {
            var raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return false;
            var s = JSON.parse(raw);
            var acc = null;
            for (var i = 0; i < ACCOUNTS.length; i++) if (ACCOUNTS[i].user === s.user) acc = ACCOUNTS[i];
            if (!acc) return false;
            state.role = acc.role;
            enterApp(acc);
            return true;
        } catch (e) { return false; }
    }

    /* ================= base64 ================= */
    function b64encode(str) {
        var bytes = new TextEncoder().encode(str), bin = '';
        for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        return btoa(bin);
    }
    function b64decode(b64) {
        var bin = atob(String(b64).replace(/\s/g, ''));
        var bytes = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return new TextDecoder('utf-8').decode(bytes);
    }

    /* ================= 模式 ================= */
    function setMode(mode) {
        state.mode = mode;
        hide($('paneLocal'), mode !== 'local');
        hide($('paneCloud'), mode !== 'cloud');
        $('srcLocal').classList.toggle('active', mode === 'local');
        $('srcCloud').classList.toggle('active', mode === 'cloud');
        state.files = [];
        state.current = null;
        $('fileList').innerHTML = '';
        $('editor').value = '';
        $('editorTitle').textContent = '选择左侧文件';
        msg(mode === 'local' ? '本地模式：读取当前站点数据' : '云端模式：需要可写 Token');
    }

    /* ================= 本地模式 ================= */
    function loadLocal() {
        msg('读取本地数据…');
        var base = '../data/';
        var jobs = FILE_LIST.map(function (name) {
            return fetch(base + name + '.json', { cache: 'no-store' })
                .then(function (r) { if (!r.ok) throw new Error(name + ' HTTP ' + r.status); return r.text(); })
                .then(function (txt) {
                    var pretty = txt;
                    try { pretty = JSON.stringify(JSON.parse(txt), null, 2); } catch (e) {}
                    state.local[name] = pretty;
                    return name;
                })
                .catch(function (e) { log('读取失败 ' + name + '：' + e.message, 'err'); return null; });
        });
        Promise.all(jobs).then(function () {
            state.files = FILE_LIST.filter(function (n) { return state.local[n] !== undefined; })
                .map(function (n) { return { name: n + '.json', key: n, size: state.local[n].length }; });
            renderFiles();
            $('localHint').textContent = '已读取 ' + state.files.length + ' 个文件';
            log('本地数据载入 ' + state.files.length + ' 个文件', 'ok');
            msg('本地数据已载入，选择左侧文件开始编辑', 'ok');
        });
    }

    function openLocal(key) {
        var txt = state.local[key];
        if (txt === undefined) { msg('本地数据未载入', 'err'); return; }
        state.current = key + '.json';
        state.sha = null;
        state.original = txt;
        $('editor').value = txt;
        $('editorTitle').textContent = state.current + '　·　本地模式';
        hide($('diffBox'), true);
        renderFiles();
        msg('已载入 ' + (txt.length / 1024).toFixed(1) + ' KB', 'ok');
    }

    function exportAll() {
        var out = {};
        FILE_LIST.forEach(function (n) {
            if (state.local[n] !== undefined) {
                try { out[n] = JSON.parse(state.local[n]); } catch (e) {}
            }
        });
        var d = new Date();
        var stamp = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
        download('xinyushe-data-' + stamp + '.json', JSON.stringify(out, null, 2));
        log('已导出全部数据（' + Object.keys(out).length + ' 个文件）', 'ok');
    }

    /* ================= 云端模式 ================= */
    function loadCfg() {
        try {
            var c = JSON.parse(localStorage.getItem(CFG_KEY) || 'null');
            if (!c || !c.repo || !c.token) return null;
            c.branch = c.branch || 'main';
            c.dir = c.dir || 'data';
            return c;
        } catch (e) { return null; }
    }

    function restoreCloudCfg() {
        var c = loadCfg();
        if (!c) return;
        state.cfg = c;
        $('cfgRepo').value = c.repo;
        $('cfgBranch').value = c.branch;
        $('cfgDir').value = c.dir;
        $('cfgToken').value = c.token;
        log('已恢复上次的仓库配置（未自动连接）');
    }

    function readCfgForm() {
        var repo = $('cfgRepo').value.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '').replace(/\/+$/, '');
        var token = $('cfgToken').value.trim();
        var branch = $('cfgBranch').value.trim() || 'main';
        var dir = $('cfgDir').value.trim().replace(/^\/+|\/+$/g, '') || 'data';
        if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) { msg('仓库格式应为 owner/repo', 'err'); return null; }
        if (!token) { msg('请填写 Token', 'err'); return null; }
        return { repo: repo, token: token, branch: branch, dir: dir };
    }

    function api(path, opts) {
        opts = opts || {};
        var headers = { 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
        if (state.cfg && state.cfg.token) headers['Authorization'] = 'Bearer ' + state.cfg.token;
        if (opts.body) headers['Content-Type'] = 'application/json';
        return fetch(API + path, {
            method: opts.method || 'GET',
            headers: headers,
            body: opts.body ? JSON.stringify(opts.body) : undefined
        }).then(function (r) {
            return r.text().then(function (txt) {
                var data = null;
                try { data = txt ? JSON.parse(txt) : null; } catch (e) {}
                if (!r.ok) {
                    var err = new Error((data && data.message) || ('HTTP ' + r.status));
                    err.status = r.status;
                    throw err;
                }
                return data;
            });
        });
    }

    function connect() {
        var cfg = readCfgForm();
        if (!cfg) return;
        state.cfg = cfg;
        msg('连接中…');
        api('/repos/' + cfg.repo).then(function () {
            try { localStorage.setItem(CFG_KEY, JSON.stringify(cfg)); } catch (e) {}
            log('连接成功：' + cfg.repo + ' · ' + cfg.branch, 'ok');
            msg('已连接 ' + cfg.repo, 'ok');
            return listCloud();
        }).catch(function (e) {
            log('连接失败：' + e.message, 'err');
            msg(e.status === 401 ? 'Token 无效或已过期' : e.message, 'err');
        });
    }

    function listCloud() {
        var cfg = state.cfg;
        if (!cfg) return Promise.reject(new Error('未连接'));
        return api('/repos/' + cfg.repo + '/contents/' + cfg.dir + '?ref=' + encodeURIComponent(cfg.branch))
            .then(function (items) {
                state.files = (items || []).filter(function (x) {
                    return x.type === 'file' && /\.json$/i.test(x.name);
                }).sort(function (a, b) { return a.name.localeCompare(b.name); });
                renderFiles();
                log('仓库文件 ' + state.files.length + ' 个', 'ok');
            })
            .catch(function (e) {
                log('读取目录失败：' + e.message, 'err');
                msg(e.status === 404 ? '目录不存在：' + cfg.dir : e.message, 'err');
            });
    }

    function openCloud(name) {
        var cfg = state.cfg;
        if (!cfg) { msg('请先在云端模式连接仓库', 'err'); return; }
        var key = name.replace(/\.json$/i, '');
        if (state.role !== 'super' && DAILY_ALLOW.indexOf(key) < 0) {
            msg('该文件对日常管理员只读', 'err');
            return;
        }
        api('/repos/' + cfg.repo + '/contents/' + cfg.dir + '/' + name + '?ref=' + encodeURIComponent(cfg.branch))
            .then(function (data) {
                var text = b64decode(data.content || '');
                var pretty = text;
                try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch (e) {}
                state.current = name;
                state.sha = data.sha;
                state.original = pretty;
                $('editor').value = pretty;
                $('editorTitle').textContent = name + '　·　sha ' + data.sha.slice(0, 7);
                hide($('diffBox'), true);
                renderFiles();
                msg('已载入 ' + (pretty.length / 1024).toFixed(1) + ' KB', 'ok');
            })
            .catch(function (e) {
                msg('读取失败：' + e.message, 'err');
                log('读取 ' + name + ' 失败：' + e.message, 'err');
            });
    }

    function renderFiles() {
        var ul = $('fileList');
        ul.innerHTML = '';
        if (!state.files.length) {
            ul.innerHTML = '<li style="cursor:default;color:var(--ink-muted)">' +
                (state.mode === 'local' ? '点上方「读取本地数据」' : '先连接仓库') + '</li>';
            return;
        }
        state.files.forEach(function (f) {
            var name = f.name;
            var key = name.replace(/\.json$/i, '');
            var li = document.createElement('li');
            var locked = state.role !== 'super' && DAILY_ALLOW.indexOf(key) < 0;
            li.textContent = key + (locked ? ' 🔒' : '');
            var size = document.createElement('span');
            size.textContent = (f.size / 1024).toFixed(0) + 'K';
            li.appendChild(size);
            li.dataset.name = name;
            if (state.current === name) li.className = 'active';
            li.addEventListener('click', function () {
                if (state.mode === 'local') openLocal(key);
                else openCloud(name);
            });
            ul.appendChild(li);
        });
    }

    /* ================= 编辑器 ================= */
    function doFormat() {
        var ed = $('editor');
        try {
            ed.value = JSON.stringify(JSON.parse(ed.value), null, 2);
            msg('已格式化', 'ok');
        } catch (e) { msg('JSON 语法错误：' + e.message, 'err'); }
    }

    function doCheck() {
        var ed = $('editor');
        try {
            var data = JSON.parse(ed.value);
            var kind = Array.isArray(data) ? '数组 ' + data.length + ' 项' : '对象 ' + Object.keys(data).length + ' 键';
            msg('语法正确 · ' + kind, 'ok');
            log('校验通过：' + state.current + '（' + kind + '）', 'ok');
        } catch (e) {
            msg('JSON 语法错误：' + e.message, 'err');
            log('校验失败：' + state.current + ' → ' + e.message, 'err');
        }
    }

    function download(name, text) {
        var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        document.body.appendChild(a);
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    }

    function doDownload() {
        if (!state.current) { msg('先选择文件', 'err'); return; }
        download(state.current, $('editor').value);
        log('已导出 ' + state.current, 'ok');
    }

    function doRevert() {
        if (!state.current) return;
        $('editor').value = state.original;
        hide($('diffBox'), true);
        msg('已还原为载入时的内容');
    }

    function doDiff() {
        var box = $('diffBox');
        if (!box.classList.contains('hide')) { hide(box, true); return; }
        var a = state.original.split('\n');
        var b = $('editor').value.split('\n');
        var out = [];
        var max = Math.max(a.length, b.length);
        for (var i = 0; i < max; i++) {
            var la = a[i], lb = b[i];
            if (la === lb) {
                if (out.length && i < 400) out.push('<span class="same">  ' + esc(la) + '</span>');
                continue;
            }
            if (la !== undefined) out.push('<span class="del">- ' + esc(la) + '</span>');
            if (lb !== undefined) out.push('<span class="add">+ ' + esc(lb) + '</span>');
        }
        box.innerHTML = out.length ? out.join('') : '<span class="same">没有改动</span>';
        box.classList.remove('hide');
    }

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function doSave() {
        if (state.mode === 'local') {
            msg('本地模式不能提交，请用「导出」或切到云端模式', 'err');
            return;
        }
        var cfg = state.cfg;
        if (!cfg || !state.current) { msg('请先连接并选择文件', 'err'); return; }
        var parsed;
        try { parsed = JSON.parse($('editor').value); } catch (e) { msg('语法错误，不能保存：' + e.message, 'err'); return; }
        var body = {
            message: '更新 ' + cfg.dir + '/' + state.current + '（' + (state.role === 'super' ? '超管' : '日常') + '提交）',
            content: b64encode(JSON.stringify(parsed, null, 2)),
            branch: cfg.branch
        };
        if (state.sha) body.sha = state.sha;
        msg('提交中…');
        $('btnSave').disabled = true;
        api('/repos/' + cfg.repo + '/contents/' + cfg.dir + '/' + state.current, { method: 'PUT', body: body })
            .then(function (res) {
                var newSha = res && res.content && res.content.sha;
                if (newSha) state.sha = newSha;
                $('editorTitle').textContent = state.current + '　·　sha ' + (newSha || '').slice(0, 7);
                state.original = $('editor').value;
                msg('已提交仓库，还需部署才会上线', 'ok');
                log('提交成功：' + state.current + ' · ' + ((res && res.commit && res.commit.sha) || '').slice(0, 7), 'ok');
                return listCloud();
            })
            .catch(function (e) {
                msg('提交失败：' + e.message, 'err');
                log('提交失败：' + e.message, 'err');
                if (e.status === 409) msg('文件已被他处修改，请重新加载后再改', 'err');
                if (e.status === 403) msg('Token 没有写入权限（需要 Contents: Read and write）', 'err');
            })
            .then(function () { $('btnSave').disabled = false; });
    }

    /* ================= 初始化 ================= */
    function init() {
        $('loginBtn').addEventListener('click', doLogin);
        $('loginPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
        $('loginUser').addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
        $('logoutBtn').addEventListener('click', doLogout);

        $('srcLocal').addEventListener('click', function () { setMode('local'); });
        $('srcCloud').addEventListener('click', function () { setMode('cloud'); });
        $('btnLoadLocal').addEventListener('click', loadLocal);
        $('btnExportAll').addEventListener('click', exportAll);

        $('btnConnect').addEventListener('click', connect);
        $('btnForget').addEventListener('click', function () {
            try { localStorage.removeItem(CFG_KEY); } catch (e) {}
            state.cfg = null;
            $('cfgRepo').value = ''; $('cfgToken').value = '';
            msg('已清除本机配置');
        });
        $('btnReload').addEventListener('click', function () {
            if (state.mode === 'local') loadLocal();
            else if (state.cfg) listCloud();
        });
        $('btnFormat').addEventListener('click', doFormat);
        $('btnCheck').addEventListener('click', doCheck);
        $('btnDownload').addEventListener('click', doDownload);
        $('btnRevert').addEventListener('click', doRevert);
        $('btnDiff').addEventListener('click', doDiff);
        $('btnSave').addEventListener('click', doSave);

        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); doSave(); }
        });

        setMode('local');
        if (!restoreSession()) {
            log('等待登录');
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();