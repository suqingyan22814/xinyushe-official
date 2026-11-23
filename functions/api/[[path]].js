/**
 * 新雨社 · Pages Functions API
 * 路径：/api/*
 * 存储：KV（AUTH 绑定）
 * 数据：GitHub Contents API（GITHUB_TOKEN 环境变量）
 *
 * 环境变量（wrangler secret / Dashboard）：
 *   GITHUB_TOKEN  可写的 fine-grained token（只给本仓库 Contents 读写）
 *   GITHUB_REPO   owner/repo
 *   GITHUB_BRANCH main
 *   GITHUB_DIR    data
 */

const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}
function fail(msg, status = 400) { return json({ ok: false, error: msg }, status); }

/* ---------- 密码 ---------- */
async function hashPassword(pass, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256);
  return [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function makeSalt() {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return [...a].map(b => b.toString(16).padStart(2, '0')).join('');
}
function makeToken() {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return [...a].map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- KV 读写 ---------- */
async function kvGet(env, key) {
  const v = await env.AUTH.get(key, 'json');
  return v || null;
}
async function kvPut(env, key, val, ttl) {
  const opts = ttl ? { expirationTtl: ttl } : undefined;
  await env.AUTH.put(key, JSON.stringify(val), opts);
}

/* ---------- 会话 ---------- */
async function authUser(request, env) {
  const h = request.headers.get('Authorization') || '';
  const m = h.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const sess = await kvGet(env, 'session:' + m[1]);
  if (!sess) return null;
  if (sess.expires && Date.now() > sess.expires) {
    await env.AUTH.delete('session:' + m[1]);
    return null;
  }
  const user = await kvGet(env, 'user:' + sess.username);
  if (!user || user.status !== 'active') return null;
  return { token: m[1], user };
}

function publicUser(u) {
  return { username: u.username, role: u.role, joined: u.created, note: u.note || '' };
}

/* ---------- GitHub 代理 ---------- */
async function ghApi(env, path, opts = {}) {
  const repo = env.GITHUB_REPO;
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': 'Bearer ' + env.GITHUB_TOKEN,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'xinyushe-worker'
  };
  if (opts.body) headers['Content-Type'] = 'application/json';
  const res = await fetch('https://api.github.com' + path, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) {}
  if (!res.ok) {
    const err = new Error((data && data.message) || ('GitHub ' + res.status));
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ---------- 登录节流（按 IP） ---------- */
const FAIL_WINDOW = 10 * 60;      // 10 分钟内累计
const FAIL_LIMIT = 5;             // 5 次锁定
const LOCK_SECONDS = 15 * 60;     // 锁 15 分钟

function clientIp(request) {
  return request.headers.get('CF-Connecting-IP')
      || request.headers.get('X-Forwarded-For')
      || 'unknown';
}

async function readFail(env, ip) {
  const rec = await env.AUTH.get('fail:' + ip, 'json');
  if (!rec) return { count: 0, locked: false, retry: 0 };
  if (rec.lockedUntil && Date.now() < rec.lockedUntil) {
    return { count: rec.count || 0, locked: true, retry: Math.ceil((rec.lockedUntil - Date.now()) / 1000) };
  }
  return { count: rec.count || 0, locked: false, retry: 0 };
}

async function bumpFail(env, ip) {
  const key = 'fail:' + ip;
  let rec = await env.AUTH.get(key, 'json') || { count: 0, first: Date.now() };
  if (Date.now() - rec.first > FAIL_WINDOW * 1000) { rec.count = 0; rec.first = Date.now(); }
  rec.count = (rec.count || 0) + 1;
  rec.lockedUntil = rec.count >= FAIL_LIMIT ? Date.now() + LOCK_SECONDS * 1000 : 0;
  await env.AUTH.put(key, JSON.stringify(rec), { expirationTtl: LOCK_SECONDS });
  return { count: rec.count, locked: !!rec.lockedUntil, retry: rec.lockedUntil ? LOCK_SECONDS : 0 };
}

async function clearFail(env, ip) {
  await env.AUTH.delete('fail:' + ip);
}

/* ---------- 业务 ---------- */
async function handleRegister(ctx, body) {
  const { env } = ctx;
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const reason = String(body.reason || '').slice(0, 200);
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return fail('用户名需 3–20 位小写字母、数字或下划线');
  if (password.length < 6) return fail('密码至少 6 位');
  if (await kvGet(env, 'user:' + username)) return fail('该用户名已被占用', 409);
  if (await kvGet(env, 'request:' + username)) return fail('该用户名的申请已在处理中', 409);
  const req = {
    username, reason,
    passHash: await hashPassword(password, makeSalt()),
    salt: null,
    status: 'pending',
    created: Date.now()
  };
  // 重新计算带 salt 的哈希
  const salt = makeSalt();
  req.salt = salt;
  req.passHash = await hashPassword(password, salt);
  await kvPut(env, 'request:' + username, req);
  return json({ ok: true, message: '申请已提交，等待超级管理员审批' });
}

async function handleLogin(ctx, body) {
  const { env } = ctx;
  const ip = clientIp(ctx.request);
  const gate = await readFail(env, ip);
  if (gate.locked) {
    return json({
      ok: false,
      error: '尝试次数过多，请 ' + Math.ceil(gate.retry / 60) + ' 分钟后再试',
      locked: true,
      retryAfter: gate.retry
    }, 429);
  }
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const user = await kvGet(env, 'user:' + username);
  if (!user) {
    const req = await kvGet(env, 'request:' + username);
    if (req && req.status === 'pending') return fail('申请尚在审批中', 403);
    const st = await bumpFail(env, ip);
    return json({ ok: false, error: '账号或密码不正确', left: Math.max(0, FAIL_LIMIT - st.count) }, 401);
  }
  if (user.status !== 'active') {
    await bumpFail(env, ip);
    return fail('账号已被停用', 403);
  }
  const h = await hashPassword(password, user.salt);
  if (h !== user.passHash) {
    const st = await bumpFail(env, ip);
    if (st.locked) {
      return json({ ok: false, error: '尝试次数过多，已锁定 15 分钟', locked: true, retryAfter: st.retry }, 429);
    }
    return json({ ok: false, error: '账号或密码不正确', left: Math.max(0, FAIL_LIMIT - st.count) }, 401);
  }
  await clearFail(env, ip);
  const token = makeToken();
  const expires = Date.now() + 7 * 24 * 3600 * 1000;
  await kvPut(env, 'session:' + token, { username, expires }, 7 * 24 * 3600);
  return json({ ok: true, token, user: publicUser(user) });
}

async function handleMe(ctx) {
  if (!ctx.auth) return fail('未登录', 401);
  return json({ ok: true, user: publicUser(ctx.auth.user) });
}

async function handleLogout(ctx) {
  if (!ctx.auth) return json({ ok: true });
  await ctx.env.AUTH.delete('session:' + ctx.auth.token);
  return json({ ok: true });
}

async function handleMembers(ctx) {
  const list = await ctx.env.AUTH.list({ prefix: 'user:' });
  const out = [];
  for (const k of list.keys) {
    const u = await kvGet(ctx.env, k.name);
    if (u && u.status === 'active') out.push(publicUser(u));
  }
  out.sort((a, b) => (a.joined || 0) - (b.joined || 0));
  return json({ ok: true, members: out });
}

async function handleRequests(ctx) {
  if (!ctx.auth || ctx.auth.user.role !== 'super') return fail('仅超级管理员可查看', 403);
  const list = await ctx.env.AUTH.list({ prefix: 'request:' });
  const out = [];
  for (const k of list.keys) {
    const r = await kvGet(ctx.env, k.name);
    if (r && r.status === 'pending') out.push({ username: r.username, reason: r.reason, created: r.created });
  }
  out.sort((a, b) => a.created - b.created);
  return json({ ok: true, requests: out });
}

async function handleApprove(ctx, body) {
  if (!ctx.auth || ctx.auth.user.role !== 'super') return fail('仅超级管理员可审批', 403);
  const username = String(body.username || '').trim().toLowerCase();
  const action = body.action === 'reject' ? 'reject' : 'approve';
  const req = await kvGet(ctx.env, 'request:' + username);
  if (!req) return fail('申请不存在', 404);
  if (action === 'reject') {
    await ctx.env.AUTH.delete('request:' + username);
    return json({ ok: true, message: '已拒绝 ' + username });
  }
  const role = body.role === 'super' ? 'super' : 'editor';
  await kvPut(ctx.env, 'user:' + username, {
    username,
    salt: req.salt,
    passHash: req.passHash,
    role,
    status: 'active',
    created: Date.now(),
    approvedBy: ctx.auth.user.username,
    note: req.reason || ''
  });
  await ctx.env.AUTH.delete('request:' + username);
  return json({ ok: true, message: '已批准 ' + username + '（' + role + '）' });
}

async function handleCreateUser(ctx, body) {
  if (!ctx.auth || ctx.auth.user.role !== 'super') return fail('仅超级管理员可建号', 403);
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  const role = body.role === 'super' ? 'super' : body.role === 'viewer' ? 'viewer' : 'editor';
  if (!/^[a-z0-9_]{3,20}$/.test(username)) return fail('用户名需 3–20 位小写字母、数字或下划线');
  if (password.length < 6) return fail('密码至少 6 位');
  if (await kvGet(ctx.env, 'user:' + username)) return fail('该用户名已存在', 409);
  const salt = makeSalt();
  await kvPut(ctx.env, 'user:' + username, {
    username, salt,
    passHash: await hashPassword(password, salt),
    role, status: 'active',
    created: Date.now(),
    approvedBy: ctx.auth.user.username,
    note: body.note || '超级管理员直接下发'
  });
  return json({ ok: true, message: '已创建 ' + username + '（' + role + '）' });
}

async function handleListUsers(ctx) {
  if (!ctx.auth || ctx.auth.user.role !== 'super') return fail('仅超级管理员可查看', 403);
  const list = await ctx.env.AUTH.list({ prefix: 'user:' });
  const out = [];
  for (const k of list.keys) {
    const u = await kvGet(ctx.env, k.name);
    if (u) out.push({ ...publicUser(u), status: u.status, approvedBy: u.approvedBy || '' });
  }
  out.sort((a, b) => (a.joined || 0) - (b.joined || 0));
  return json({ ok: true, users: out });
}

async function handleSetStatus(ctx, body) {
  if (!ctx.auth || ctx.auth.user.role !== 'super') return fail('仅超级管理员可操作', 403);
  const username = String(body.username || '').trim().toLowerCase();
  if (username === ctx.auth.user.username) return fail('不能停用自己');
  const u = await kvGet(ctx.env, 'user:' + username);
  if (!u) return fail('用户不存在', 404);
  if (body.action === 'delete') {
    await ctx.env.AUTH.delete('user:' + username);
    return json({ ok: true, message: '已删除 ' + username });
  }
  u.status = body.action === 'disable' ? 'disabled' : 'active';
  await kvPut(ctx.env, 'user:' + username, u);
  return json({ ok: true, message: '已' + (u.status === 'active' ? '启用' : '停用') + ' ' + username });
}

async function handleResetPassword(ctx, body) {
  if (!ctx.auth || ctx.auth.user.role !== 'super') return fail('仅超级管理员可重置', 403);
  const username = String(body.username || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (password.length < 6) return fail('密码至少 6 位');
  const u = await kvGet(ctx.env, 'user:' + username);
  if (!u) return fail('用户不存在', 404);
  const salt = makeSalt();
  u.salt = salt;
  u.passHash = await hashPassword(password, salt);
  await kvPut(ctx.env, 'user:' + username, u);
  return json({ ok: true, message: '已重置 ' + username + ' 的密码' });
}

/* ---------- 版本历史 ---------- */
async function handleHistory(ctx, file) {
  if (!ctx.auth) return fail('未登录', 401);
  const dir = ctx.env.GITHUB_DIR || 'data';
  const list = await ghApi(ctx.env,
    `/repos/${ctx.env.GITHUB_REPO}/commits?path=${encodeURIComponent(dir + '/' + file)}&per_page=30`);
  const out = (list || []).map(c => ({
    sha: c.sha,
    short: c.sha.slice(0, 7),
    message: (c.commit && c.commit.message || '').split('\n')[0],
    date: c.commit && c.commit.author && c.commit.author.date,
    author: c.commit && c.commit.author && c.commit.author.name
  }));
  return json({ ok: true, commits: out });
}

async function handleVersion(ctx, file, ref) {
  if (!ctx.auth) return fail('未登录', 401);
  const dir = ctx.env.GITHUB_DIR || 'data';
  const data = await ghApi(ctx.env,
    `/repos/${ctx.env.GITHUB_REPO}/contents/${dir}/${file}?ref=${encodeURIComponent(ref)}`);
  const bin = atob((data.content || '').replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return json({ ok: true, ref, sha: data.sha, text: new TextDecoder('utf-8').decode(bytes) });
}

/* ---------- 数据读写代理 ---------- */
const DAILY_ALLOW = ['site', 'news', 'timeline', 'events', 'zones', 'people',
  'surveys', 'faq', 'groups', 'emergency', 'banner', 'mod-list', 'mod-timeline', 'wiki', 'org'];

async function handleDataGet(ctx, file) {
  if (!ctx.auth) return fail('未登录', 401);
  const dir = ctx.env.GITHUB_DIR || 'data';
  const data = await ghApi(ctx.env, `/repos/${ctx.env.GITHUB_REPO}/contents/${dir}/${file}?ref=${encodeURIComponent(ctx.env.GITHUB_BRANCH || 'main')}`);
  const bin = atob((data.content || '').replace(/\s/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return json({ ok: true, file, sha: data.sha, text: new TextDecoder('utf-8').decode(bytes) });
}

async function handleDataPut(ctx, file, body) {
  if (!ctx.auth) return fail('未登录', 401);
  const role = ctx.auth.user.role;
  const key = String(file).replace(/\.json$/, '');
  if (role !== 'super' && DAILY_ALLOW.indexOf(key) < 0) return fail('该文件对当前角色只读', 403);
  const text = String(body.text || '');
  try { JSON.parse(text); } catch (e) { return fail('JSON 语法错误：' + e.message); }
  const dir = ctx.env.GITHUB_DIR || 'data';
  const path = `/repos/${ctx.env.GITHUB_REPO}/contents/${dir}/${file}`;
  const payload = {
    message: `更新 ${dir}/${file}（${ctx.auth.user.username}）`,
    content: btoa(String.fromCharCode(...new TextEncoder().encode(text))),
    branch: ctx.env.GITHUB_BRANCH || 'main'
  };
  if (body.sha) payload.sha = body.sha;
  const res = await ghApi(ctx.env, path, { method: 'PUT', body: payload });
  return json({ ok: true, sha: res && res.content && res.content.sha, commit: res && res.commit && res.commit.sha });
}

/* ---------- 路由 ---------- */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '');

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: {
      'Access-Control-Allow-Origin': url.origin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    }});
  }

  let body = {};
  if (request.method === 'POST' || request.method === 'PUT') {
    try { body = await request.json(); } catch (e) { body = {}; }
  }

  try {
    if (path === 'ping') return json({ ok: true, now: Date.now() });
    if (path === 'register' && request.method === 'POST') return await handleRegister(context, body);
    if (path === 'login' && request.method === 'POST') return await handleLogin(context, body);
    if (path === 'members') return await handleMembers(context);

    const auth = await authUser(request, env);
    context.auth = auth;

    if (path === 'me') return await handleMe(context);
    if (path === 'logout' && request.method === 'POST') return await handleLogout(context);
    if (path === 'admin/requests') return await handleRequests(context);
    if (path === 'admin/approve' && request.method === 'POST') return await handleApprove(context, body);
    if (path === 'admin/create' && request.method === 'POST') return await handleCreateUser(context, body);
    if (path === 'admin/users') return await handleListUsers(context);
    if (path === 'admin/status' && request.method === 'POST') return await handleSetStatus(context, body);
    if (path === 'admin/password' && request.method === 'POST') return await handleResetPassword(context, body);

    const mHist = path.match(/^admin\/history\/([\w.-]+\.json)$/);
    if (mHist && request.method === 'GET') return await handleHistory(context, mHist[1]);
    const mVer = path.match(/^admin\/version\/([\w.-]+\.json)$/);
    if (mVer && request.method === 'GET') return await handleVersion(context, mVer[1], url.searchParams.get('ref') || 'HEAD');

    const mData = path.match(/^data\/([\w.-]+\.json)$/);
    if (mData) {
      if (request.method === 'GET') return await handleDataGet(context, mData[1]);
      if (request.method === 'PUT') return await handleDataPut(context, mData[1], body);
    }

    return fail('接口不存在：/' + path, 404);
  } catch (e) {
    return fail(e.message || '服务器错误', e.status || 500);
  }
}