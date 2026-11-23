/* 新雨社数据后台 v0.3
 * 账号登录（Pages Functions + KV）· 云端/本地双数据源 · 成员审批
 */
(function () {
    'use strict';

    var API = '../api';
    var TOKEN_KEY = 'xinyushe-admin-token';
    var FAIL_KEY = 'xinyushe-admin-fails';
    var FAIL_LIMIT = 5;
    var FILE_LIST = ['site', 'banner', 'news', 'timeline', 'people', 'zones', 'events',
        'mod-list', 'mod-timeline', 'wiki', 'faq', 'history-volumes', 'org',
        'surveys', 'emergency', 'groups', 'archive'];
    var DAILY_ALLOW = ['site', 'news', 'timeline', 'events', 'zones', 'people',
        'surveys', 'faq', 'groups', 'emergency', 'banner', 'mod-list', 'mod-timeline', 'wiki', 'org'];

    var state = {
        token: null,
        user: null,
        mode: 'cloud',
        files: [],
        current: null,
        original: '',
        local: {},
        requests: [],
        users: []
    };

    function $(id) { return document.getElementById(id); }
    function hide(el, v) { if (el) el.classList.toggle('hide', !!v); }
    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /* 中文对话框：替代浏览器原生的英文 OK/Cancel */
    function dialog(opts) {
        return new Promise(function (resolve) {
            var mask = document.createElement('div');
            mask.className = 'xy-dialog-mask';
            var box = document.createElement('div');
            box.className = 'xy-dialog';
            var title = document.createElement('h3');
            title.textContent = opts.title || '提示';
            box.appendChild(title);
            if (opts.body) {
                var p = document.createElement('p');
                p.textContent = opts.body;
                box.appendChild(p);
            }
            var input = null;
            if (opts.input) {
                input = document.createElement('input');
                input.type = opts.inputType || 'text';
                input.placeholder = opts.placeholder || '';
                input.value = opts.value || '';
                box.appendChild(input);
            }
            var row = document.createElement('div');
            row.className = 'xy-dialog-btns';
            var cancel = document.createElement('button');
            cancel.className = 'btn';
            cancel.textContent = opts.cancelText || '取消';
            var ok = document.createElement('button');
            ok.className = 'btn primary';
            ok.textContent = opts.okText || '确定';
            if (opts.danger) ok.classList.add('danger');
            row.appendChild(cancel);
            row.appendChild(ok);
            box.appendChild(row);
            mask.appendChild(box);
            document.body.appendChild(mask);
            if (input) setTimeout(function () { input.focus(); }, 30);
            function close(v) { mask.remove(); resolve(v); }
            cancel.addEventListener('click', function () { close(null); });
            ok.addEventListener('click', function () {
                close(opts.input ? (input.value || '') : true);
            });
            if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') close(input.value || ''); });
            document.addEventListener('keydown', function esc(e) {
                if (e.key === 'Escape') { document.removeEventListener('keydown', esc); close(null); }
            });
        });
    }

    function log(msg, tone) {
        var box = $('logList');
        if (!box) return;
        var li = document.createElement('li');
        var t = new Date();
        var p2 = n => String(n).padStart(2, '0');
        var color = tone === 'err' ? ' style="color:var(--seal)"' : tone === 'ok' ? ' style="color:var(--ok)"' : '';
        li.innerHTML = '<time>' + p2(t.getHours()) + ':' + p2(t.getMinutes()) + ':' + p2(t.getSeconds()) +
            '</time><span' + color + '>' + esc(msg) + '</span>';
        box.insertBefore(li, box.firstChild);
        while (box.children.length > 120) box.removeChild(box.lastChild);
    }

    function msg(text, tone) {
        var el = $('editMsg');
        el.textContent = text || '';
        el.className = 'adm-msg' + (tone ? ' ' + tone : '');
    }

    /* ---------- API ---------- */
    function api(path, opts) {
        opts = opts || {};
        var headers = { 'Content-Type': 'application/json' };
        if (state.token) headers['Authorization'] = 'Bearer ' + state.token;
        return fetch(API + path, {
            method: opts.method || 'GET',
            headers: headers,
            body: opts.body ? JSON.stringify(opts.body) : undefined
        }).then(function (r) {
            return r.text().then(function (txt) {
                var data = null;
                try { data = txt ? JSON.parse(txt) : null; } catch (e) {}
                if (!r.ok || (data && data.ok === false)) {
                    var err = new Error((data && data.error) || ('HTTP ' + r.status));
                    err.status = r.status;
                    err.data = data || {};
                    throw err;
                }
                return data;
            });
        });
    }

    /* ---------- 登录 / 申请 ---------- */
    function showScreen(id) {
        ['loginScreen', 'applyScreen'].forEach(function (k) { hide($(k), k !== id); });
    }

    function doLogin() {
        var u = $('loginUser').value.trim().toLowerCase();
        var p = $('loginPass').value;
        if (!u || !p) { $('loginErr').textContent = '请填写账号和密码'; return; }
        $('loginBtn').disabled = true;
        $('loginErr').textContent = '登录中…';
        api('/login', { method: 'POST', body: { username: u, password: p } })
            .then(function (r) {
                state.token = r.token;
                state.user = r.user;
                try { localStorage.setItem(TOKEN_KEY, r.token); localStorage.removeItem(FAIL_KEY); } catch (e) {}
                enterApp();
            })
            .catch(function (e) {
                $('loginBox').classList.add('shake');
                setTimeout(function () { $('loginBox').classList.remove('shake'); }, 320);
                var d = e.data || {};
                if (e.status === 429) {
                    var sec = d.retryAfter || 900;
                    $('loginErr').textContent = '尝试次数过多，已锁定 ' + Math.ceil(sec / 60) + ' 分钟';
                    $('loginBtn').disabled = true;
                    var left = sec;
                    var timer = setInterval(function () {
                        left -= 1;
                        if (left <= 0) {
                            clearInterval(timer);
                            $('loginBtn').disabled = false;
                            $('loginErr').textContent = '';
                            return;
                        }
                        $('loginErr').textContent = '尝试次数过多，还需 ' + Math.ceil(left / 60) + ' 分钟';
                    }, 1000);
                    log('登录被锁定 ' + Math.ceil(sec / 60) + ' 分钟', 'err');
                    return;
                }
                $('loginErr').textContent = d.left !== undefined
                    ? (e.message + '（还可再试 ' + d.left + ' 次）')
                    : e.message;
                bumpFail(e.message);
            })
            .then(function () { $('loginBtn').disabled = false; });
    }

    // 连续输错：达到 5 次转入彩蛋页
    function bumpFail(reason) {
        var n = 0;
        try { n = parseInt(localStorage.getItem(FAIL_KEY) || '0', 10) || 0; } catch (e) {}
        n += 1;
        try { localStorage.setItem(FAIL_KEY, String(n)); } catch (e) {}
        log('登录失败 ' + n + ' 次：' + reason, 'err');
        if (n >= FAIL_LIMIT) {
            try { localStorage.removeItem(FAIL_KEY); } catch (e) {}
            $('loginErr').textContent = '尝试次数过多，正在核验访问来源…';
            setTimeout(function () { location.href = 'index.html?trap=1'; }, 700);
            return;
        }
        var left = FAIL_LIMIT - n;
        $('loginErr').textContent = (reason || '账号或密码不正确') + '（再错 ' + left + ' 次将触发访问核验）';
    }

    function doApply() {
        var u = $('applyUser').value.trim().toLowerCase();
        var p = $('applyPass').value;
        var reason = $('applyReason').value.trim();
        if (!u || !p) { $('applyErr').textContent = '账号和密码都要填'; return; }
        $('applyBtn').disabled = true;
        $('applyErr').textContent = '提交中…';
        api('/register', { method: 'POST', body: { username: u, password: p, reason: reason } })
            .then(function (r) {
                $('applyErr').textContent = r.message || '已提交，等待审批';
                log('提交编辑权限申请：' + u, 'ok');
                setTimeout(function () { showScreen('loginScreen'); $('loginErr').textContent = '申请已提交，等超级管理员审批'; }, 1400);
            })
            .catch(function (e) { $('applyErr').textContent = e.message; })
            .then(function () { $('applyBtn').disabled = false; });
    }

    function enterApp() {
        hide($('loginScreen'), true);
        hide($('applyScreen'), true);
        $('appRoot').classList.remove('hide');
        var u = state.user;
        var badge = $('roleBadge');
        var label = u.role === 'super' ? '超级管理员' : u.role === 'viewer' ? '只读成员' : '编辑';
        badge.textContent = label + ' · ' + u.username;
        badge.className = 'role-badge ' + u.role;
        $('appSub').textContent = u.role === 'super'
            ? '超级管理员 · 全部数据 + 成员审批'
            : (u.role === 'viewer' ? '只读成员 · 可查看不可保存' : '编辑 · 日常数据维护');
        log('登录成功：' + u.username + '（' + label + '）', 'ok');
        var isSuper = u.role === 'super';
        hide($('cardCreate'), !isSuper);
        hide($('cardRequests'), !isSuper);
        var self = $('selfName');
        if (self) self.textContent = u.username;
        loadFileList();
        openFromQuery();
    }

    // 主页「✎ 编辑」跳转过来时自动打开对应文件
    function openFromQuery() {
        var file = null;
        try { file = new URLSearchParams(location.search).get('file'); } catch (e) {}
        if (!file) return;
        var key = String(file).replace(/\.json$/, '');
        if (FILE_LIST.indexOf(key) < 0) return;
        setTimeout(function () {
            var role = state.user && state.user.role;
            if (role !== 'super' && DAILY_ALLOW.indexOf(key) < 0) {
                log('该文件对当前角色只读：' + key, 'err');
                return;
            }
            openFile(key);
            log('从主页跳转，已打开 ' + key, 'ok');
        }, 240);
    }

    function doLogout() {
        api('/logout', { method: 'POST' }).catch(function () {});
        try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
        setTimeout(function () { location.reload(); }, 120);
    }

    function restoreSession() {
        var t = null;
        try { t = localStorage.getItem(TOKEN_KEY); } catch (e) {}
        if (!t) return false;
        state.token = t;
        api('/me').then(function (r) {
            state.user = r.user;
            enterApp();
        }).catch(function () {
            try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
        });
        return true;
    }

    /* ---------- 文件列表 ---------- */
    function loadFileList() {
        if (state.mode === 'local') { loadLocal(); return; }
        state.files = FILE_LIST.map(function (k) { return { name: k + '.json', size: 0 }; });
        renderFiles();
        msg('云端模式：点左侧文件载入', '');
    }

    function renderFiles() {
        var ul = $('fileList');
        ul.innerHTML = '';
        if (!state.files.length) {
            ul.innerHTML = '<li style="cursor:default;color:var(--ink-muted)">暂无文件</li>';
            return;
        }
        state.files.forEach(function (f) {
            var name = f.name, key = name.replace(/\.json$/i, '');
            var li = document.createElement('li');
            var locked = state.user && state.user.role !== 'super' && DAILY_ALLOW.indexOf(key) < 0;
            li.textContent = key + (locked ? ' 🔒' : '');
            if (f.size) {
                var sz = document.createElement('span');
                sz.textContent = (f.size / 1024).toFixed(0) + 'K';
                li.appendChild(sz);
            }
            li.dataset.name = name;
            if (state.current === name) li.className = 'active';
            li.addEventListener('click', function () { openFile(key); });
            ul.appendChild(li);
        });
    }

    /* ---------- 打开 / 保存 ---------- */
    function openFile(key) {
        var name = key + '.json';
        if (state.mode === 'local') {
            var txt = state.local[key];
            if (txt === undefined) { msg('本地数据未载入', 'err'); return; }
            setEditor(name, txt, '本地快照');
            return;
        }
        msg('读取中…');
        api('/data/' + name).then(function (r) {
            var pretty = r.text;
            try { pretty = JSON.stringify(JSON.parse(r.text), null, 2); } catch (e) {}
            state.sha = r.sha;
            setEditor(name, pretty, '云端 · sha ' + String(r.sha).slice(0, 7));
            msg('已载入 ' + (pretty.length / 1024).toFixed(1) + ' KB', 'ok');
        }).catch(function (e) {
            msg('读取失败：' + e.message, 'err');
            log('读取 ' + name + ' 失败：' + e.message, 'err');
        });
    }

    function setEditor(name, text, note) {
        state.current = name;
        state.original = text;
        $('editor').value = text;
        $('editorTitle').textContent = name + '　·　' + note;
        hide($('diffBox'), true);
        renderFiles();
    }

    function loadLocal() {
        msg('读取本地快照…');
        var jobs = FILE_LIST.map(function (k) {
            return fetch('../data/' + k + '.json', { cache: 'no-store' })
                .then(function (r) { if (!r.ok) throw new Error(k); return r.text(); })
                .then(function (t) {
                    var pretty = t;
                    try { pretty = JSON.stringify(JSON.parse(t), null, 2); } catch (e) {}
                    state.local[k] = pretty;
                    return { name: k + '.json', size: t.length };
                })
                .catch(function () { return null; });
        });
        Promise.all(jobs).then(function (list) {
            state.files = list.filter(Boolean);
            renderFiles();
            msg('本地快照已载入 ' + state.files.length + ' 个文件（不可提交）', 'ok');
        });
    }

    function doSave() {
        if (state.mode === 'local') { msg('本地快照不能提交，请切换到云端', 'err'); return; }
        if (!state.current) { msg('先选择文件', 'err'); return; }
        if (state.user.role === 'viewer') { msg('只读成员不能保存', 'err'); return; }
        var parsed;
        try { parsed = JSON.parse($('editor').value); } catch (e) { msg('语法错误：' + e.message, 'err'); return; }
        var text = JSON.stringify(parsed, null, 2);
        $('btnSave').disabled = true;
        msg('提交中…');
        api('/data/' + state.current, { method: 'PUT', body: { text: text, sha: state.sha } })
            .then(function (r) {
                if (r.sha) state.sha = r.sha;
                state.original = text;
                $('editorTitle').textContent = state.current + '　·　云端 · sha ' + String(r.sha || '').slice(0, 7);
                msg('已提交仓库，部署后生效', 'ok');
                log('提交 ' + state.current + ' · ' + String(r.commit || '').slice(0, 7), 'ok');
            })
            .catch(function (e) {
                msg('提交失败：' + e.message, 'err');
                log('提交失败：' + e.message, 'err');
            })
            .then(function () { $('btnSave').disabled = false; });
    }

    /* ---------- 历史版本 ---------- */
    function toggleHistory() {
        var box = $('historyBox');
        if (!box.classList.contains('hide')) { box.classList.add('hide'); return; }
        if (!state.current) { msg('先选择文件', 'err'); return; }
        if (state.mode === 'local') { msg('本地快照没有版本历史', 'err'); return; }
        box.classList.remove('hide');
        $('historyList').innerHTML = '<p class="adm-note">读取中…</p>';
        api('/admin/history/' + state.current).then(function (r) {
            var list = r.commits || [];
            if (!list.length) { $('historyList').innerHTML = '<p class="adm-note">暂无提交记录</p>'; return; }
            $('historyList').innerHTML = list.map(function (c, i) {
                var d = new Date(c.date);
                var p2 = n => String(n).padStart(2, '0');
                var when = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()) +
                           ' ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
                return '<div class="hist-row" data-sha="' + esc(c.sha) + '">' +
                    '<span class="hist-sha">' + esc(c.short) + '</span>' +
                    '<span class="hist-msg">' + esc(c.message || '(无提交信息)') + '</span>' +
                    '<span class="hist-date">' + when + '</span>' +
                    (i === 0 ? '<span class="hist-cur">当前</span>' : '<span class="hist-act">载入</span>') +
                    '</div>';
            }).join('');
            $('historyList').querySelectorAll('.hist-row').forEach(function (row) {
                row.addEventListener('click', function () {
                    loadVersion(row.dataset.sha);
                });
            });
        }).catch(function (e) {
            $('historyList').innerHTML = '<p class="adm-note">读取失败：' + esc(e.message) + '</p>';
        });
    }

    function loadVersion(sha) {
        if (!sha || !state.current) return;
        msg('载入历史版本 ' + sha.slice(0, 7) + '…');
        api('/admin/version/' + state.current + '?ref=' + encodeURIComponent(sha)).then(function (r) {
            var pretty = r.text;
            try { pretty = JSON.stringify(JSON.parse(r.text), null, 2); } catch (e) {}
            $('editor').value = pretty;
            hide($('diffBox'), true);
            msg('已载入 ' + sha.slice(0, 7) + ' 版本；点「保存并提交」即回滚到此版本', 'ok');
            log('载入历史版本 ' + state.current + ' @ ' + sha.slice(0, 7), 'ok');
        }).catch(function (e) {
            msg('载入失败：' + e.message, 'err');
        });
    }

    /* ---------- 编辑器工具 ---------- */
    function doFormat() {
        try { $('editor').value = JSON.stringify(JSON.parse($('editor').value), null, 2); msg('已格式化', 'ok'); }
        catch (e) { msg('JSON 语法错误：' + e.message, 'err'); }
    }
    function doCheck() {
        try {
            var d = JSON.parse($('editor').value);
            var kind = Array.isArray(d) ? '数组 ' + d.length + ' 项' : '对象 ' + Object.keys(d).length + ' 键';
            msg('语法正确 · ' + kind, 'ok');
        } catch (e) { msg('JSON 语法错误：' + e.message, 'err'); }
    }
    function doDownload() {
        if (!state.current) { msg('先选择文件', 'err'); return; }
        var blob = new Blob([$('editor').value], { type: 'application/json;charset=utf-8' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = state.current;
        document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
        log('导出 ' + state.current, 'ok');
    }
    function doRevert() {
        if (!state.current) return;
        $('editor').value = state.original;
        hide($('diffBox'), true);
        msg('已还原');
    }
    function doDiff() {
        var box = $('diffBox');
        if (!box.classList.contains('hide')) { hide(box, true); return; }
        var a = state.original.split('\n'), b = $('editor').value.split('\n');
        var out = [], max = Math.max(a.length, b.length);
        for (var i = 0; i < max; i++) {
            if (a[i] === b[i]) { if (out.length && i < 300) out.push('<span class="same">  ' + esc(a[i]) + '</span>'); continue; }
            if (a[i] !== undefined) out.push('<span class="del">- ' + esc(a[i]) + '</span>');
            if (b[i] !== undefined) out.push('<span class="add">+ ' + esc(b[i]) + '</span>');
        }
        box.innerHTML = out.length ? out.join('') : '<span class="same">没有改动</span>';
        box.classList.remove('hide');
    }

    /* ---------- 成员管理 ---------- */
    function loadMembers() {
        var isSuper = state.user && state.user.role === 'super';
        api('/members').then(function (r) {
            var list = r.members || [];
            var box = $('userList');
            $('userCount').textContent = list.length;
            box.innerHTML = list.map(function (m) {
                var role = m.role === 'super' ? '超管' : m.role === 'viewer' ? '只读' : '编辑';
                var d = new Date(m.joined || Date.now());
                var date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                var isMe = m.username === state.user.username;
                var acts = '';
                if (isSuper) {
                    acts += '<span class="mem-act" data-u="' + esc(m.username) + '" data-a="reset">改密</span>';
                    if (!isMe) {
                        acts += '<span class="mem-act" data-u="' + esc(m.username) + '" data-a="disable">停用</span>' +
                                '<span class="mem-act danger" data-u="' + esc(m.username) + '" data-a="delete">删除</span>';
                    }
                }
                if (isMe) acts = '<span class="mem-me">我</span>' + acts;
                return '<div class="mem-row"><b>' + esc(m.username) + '</b>' +
                    '<em>' + role + '</em><span class="mem-date">' + date + '</span>' + acts + '</div>';
            }).join('') || '<p class="adm-note">还没有成员</p>';
            box.querySelectorAll('.mem-act').forEach(function (el) {
                el.addEventListener('click', function () {
                    var u = el.dataset.u, a = el.dataset.a;
                    if (a === 'reset') {
                        dialog({
                            title: '重置密码',
                            body: '给 ' + u + ' 设置一个新密码（至少 6 位）',
                            input: true,
                            placeholder: '输入新密码',
                            okText: '确认重置'
                        }).then(function (np) {
                            if (!np) return;
                            if (np.length < 6) { dialog({ title: '密码太短', body: '至少 6 位', okText: '知道了' }); return; }
                            api('/admin/password', { method: 'POST', body: { username: u, password: np } })
                                .then(function (r) {
                                    log(r.message, 'ok');
                                    dialog({ title: '已重置', body: '把新密码私下告诉 ' + u + '，让他登录后自己改。', okText: '好' });
                                })
                                .catch(function (e) { dialog({ title: '重置失败', body: e.message, okText: '知道了' }); });
                        });
                        return;
                    }
                    var isDelete = a === 'delete';
                    dialog({
                        title: isDelete ? '删除成员' : '停用成员',
                        body: isDelete
                            ? '确定删除 ' + u + ' 吗？账号与记录一并移除，不可恢复。'
                            : '确定停用 ' + u + ' 吗？对方会立刻无法登录，数据保留，可随时启用。',
                        okText: isDelete ? '确认删除' : '确认停用',
                        danger: isDelete
                    }).then(function (yes) {
                        if (!yes) return;
                        api('/admin/status', { method: 'POST', body: { username: u, action: a } })
                            .then(function (r) { log(r.message, 'ok'); loadMembers(); })
                            .catch(function (e) { dialog({ title: '操作失败', body: e.message, okText: '知道了' }); });
                    });
                });
            });
        }).catch(function (e) { log('读取成员失败：' + e.message, 'err'); });

        if (!isSuper) return;
        api('/admin/requests').then(function (r) {
            state.requests = r.requests || [];
            $('reqCount').textContent = state.requests.length;
            var box = $('reqList');
            box.innerHTML = state.requests.map(function (q) {
                return '<div class="mem-row"><b>' + esc(q.username) + '</b>' +
                    '<span class="mem-date">' + esc(q.reason || '未填写理由') + '</span>' +
                    '<span class="mem-act ok" data-u="' + esc(q.username) + '" data-a="approve">批准</span>' +
                    '<span class="mem-act danger" data-u="' + esc(q.username) + '" data-a="reject">拒绝</span></div>';
            }).join('') || '<p class="adm-note">没有待审批的申请</p>';
            box.querySelectorAll('.mem-act').forEach(function (el) {
                el.addEventListener('click', function () {
                    api('/admin/approve', { method: 'POST', body: { username: el.dataset.u, action: el.dataset.a } })
                        .then(function (r) { log(r.message, 'ok'); loadMembers(); })
                        .catch(function (e) { alert(e.message); });
                });
            });
        }).catch(function (e) { log('读取申请失败：' + e.message, 'err'); });
    }

    function doSelfPassword() {
        var p = $('selfPass').value;
        if (!p || p.length < 6) { $('selfHint').textContent = '密码至少 6 位'; return; }
        $('selfHint').textContent = '修改中…';
        api('/admin/password', { method: 'POST', body: { username: state.user.username, password: p } })
            .then(function (r) {
                $('selfHint').textContent = '已修改，下次用新密码登录';
                $('selfPass').value = '';
                log('修改了自己的密码', 'ok');
            })
            .catch(function (e) { $('selfHint').textContent = e.message; });
    }

    function doCreateUser() {
        var u = $('newUser').value.trim().toLowerCase();
        var p = $('newPass').value;
        var role = $('newRole').value;
        $('createHint').textContent = '创建中…';
        api('/admin/create', { method: 'POST', body: { username: u, password: p, role: role } })
            .then(function (r) {
                $('createHint').textContent = r.message;
                log(r.message, 'ok');
                $('newUser').value = ''; $('newPass').value = '';
                loadMembers();
            })
            .catch(function (e) { $('createHint').textContent = e.message; });
    }

    /* ---------- 标签页 ---------- */
    function initTabs() {
        document.querySelectorAll('.adm-tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                document.querySelectorAll('.adm-tab').forEach(function (b) { b.classList.remove('active'); });
                btn.classList.add('active');
                var t = btn.dataset.tab;
                hide($('pageData'), t !== 'data');
                hide($('pageMembers'), t !== 'members');
                hide($('pageLog'), t !== 'log');
                if (t === 'members') loadMembers();
            });
        });
    }

    /* ---------- 初始化 ---------- */
    function init() {
        $('loginBtn').addEventListener('click', doLogin);
        $('loginPass').addEventListener('keydown', function (e) { if (e.key === 'Enter') doLogin(); });
        $('applyBtn').addEventListener('click', doApply);
        $('altBtn').addEventListener('click', function () { showScreen('applyScreen'); });
        $('backLogin').addEventListener('click', function () { showScreen('loginScreen'); });
        $('logoutBtn').addEventListener('click', doLogout);
        $('btnCreate').addEventListener('click', doCreateUser);
        $('btnSelfPass').addEventListener('click', doSelfPassword);

        $('srcCloud').addEventListener('click', function () {
            state.mode = 'cloud';
            $('srcCloud').classList.add('active'); $('srcLocal').classList.remove('active');
            $('srcNote').innerHTML = '云端模式直接读写仓库，保存后需要部署才会上线。';
            state.current = null; $('editor').value = ''; $('editorTitle').textContent = '选择左侧文件';
            loadFileList();
        });
        $('srcLocal').addEventListener('click', function () {
            state.mode = 'local';
            $('srcLocal').classList.add('active'); $('srcCloud').classList.remove('active');
            $('srcNote').innerHTML = '本地快照只读，用于对照与导出，不能提交。';
            state.current = null; $('editor').value = ''; $('editorTitle').textContent = '选择左侧文件';
            loadFileList();
        });

        $('btnReload').addEventListener('click', loadFileList);
        $('btnFormat').addEventListener('click', doFormat);
        $('btnCheck').addEventListener('click', doCheck);
        $('btnDownload').addEventListener('click', doDownload);
        $('btnRevert').addEventListener('click', doRevert);
        $('btnDiff').addEventListener('click', doDiff);
        $('btnSave').addEventListener('click', doSave);
        $('btnHistory').addEventListener('click', toggleHistory);
        $('btnHistoryClose').addEventListener('click', function () { $('historyBox').classList.add('hide'); });
        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); doSave(); }
        });

        initTabs();
        if (!restoreSession()) showScreen('loginScreen');
        log('后台就绪');
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();