appData = {
            site: {},
            banner: [],
            news: [],
            timeline: [],
            people: {},
            zones: {},
            events: {},
            modList: [],
            modTimeline: [],
            wiki: {},
            faq: [],
            historyVolumes: [],
            org: {},
            surveys: {},
            emergency: {},
            groups: {},
            archive: {}
        };
        function throttle(fn, delay = 100) {
            let lastTime = 0;
            return function(...args) {
                const now = Date.now();
                if (now - lastTime >= delay) {
                    lastTime = now;
                    fn.apply(this, args);
                }
            }
        }
        const SANITIZE_ALLOWED_TAGS = new Set(['B','STRONG','I','EM','U','BR','P','SPAN','DIV','UL','OL','LI','H4','H5','A']);
        const SANITIZE_ALLOWED_ATTR = { A: ['href', 'target', 'rel'], DIV: ['class'], SPAN: ['style'], P: ['style'], H4: ['class'], H5: ['class'], UL: ['class'], LI: ['class'] };
        const SANITIZE_STYLE_PROP_RE = /^(color|background-color|font-size|font-weight|line-height|margin(-\w+)?|padding(-\w+)?|text-align|text-indent|font-style)$/i;
        function sanitizeInlineStyle(styleStr) {
            return styleStr.split(';').map(rule => rule.trim()).filter(Boolean).filter(rule => {
                const [prop, ...rest] = rule.split(':');
                const value = rest.join(':').trim();
                if (!prop || !SANITIZE_STYLE_PROP_RE.test(prop.trim())) return false;
                if (/url\s*\(|expression\s*\(|javascript:/i.test(value)) return false;
                return true;
            }).join('; ');
        }
        function sanitizeHtml(str) {
            if (!str) return '';
            const temp = document.createElement('div');
            temp.innerHTML = String(str);
            const walk = (node) => {
                [...node.childNodes].forEach(child => {
                    if (child.nodeType === 1) {
                        const tag = child.tagName;
                        if (!SANITIZE_ALLOWED_TAGS.has(tag)) {
                            const text = document.createTextNode(child.textContent);
                            child.replaceWith(text);
                            return;
                        }
                        [...child.attributes].forEach(attr => {
                            const name = attr.name.toLowerCase();
                            const allowed = SANITIZE_ALLOWED_ATTR[tag] || [];
                            if (name === 'style' && allowed.includes('style')) {
                                child.setAttribute('style', sanitizeInlineStyle(attr.value));
                            } else if (!allowed.includes(name)) {
                                child.removeAttribute(attr.name);
                            }
                        });
                        if (tag === 'A') {
                            const href = child.getAttribute('href') || '';
                            if (!/^https?:\/\//i.test(href) && !href.startsWith('#')) {
                                child.removeAttribute('href');
                            }
                            child.setAttribute('target', '_blank');
                            child.setAttribute('rel', 'noopener noreferrer');
                        }
                        walk(child);
                    }
                });
            };
            walk(temp);
            return temp.innerHTML;
        }
        const DATA_KEYS = ['site','banner','news','timeline','people','zones','events','modList','modTimeline','wiki','faq','historyVolumes','org','surveys','emergency','groups','archive'];
        function applyData(key, obj) { appData[key] = obj; }
        async function loadAllData() {
            let ready = false;
            try {
                const [
                    siteRes, bannerRes, newsRes, timelineRes,
                    peopleRes, zonesRes, eventsRes, modListRes,
                    modTimelineRes, wikiRes, faqRes, historyRes, orgRes,
                    surveysRes, emergencyRes, groupsRes, archiveRes
                ] = await Promise.all([
                    fetch('data/site.json'),
                    fetch('data/banner.json'),
                    fetch('data/news.json'),
                    fetch('data/timeline.json'),
                    fetch('data/people.json'),
                    fetch('data/zones.json'),
                    fetch('data/events.json'),
                    fetch('data/mod-list.json'),
                    fetch('data/mod-timeline.json'),
                    fetch('data/wiki.json'),
                    fetch('data/faq.json'),
                    fetch('data/history-volumes.json'),
                    fetch('data/org.json'),
                    fetch('data/surveys.json'),
                    fetch('data/emergency.json'),
                    fetch('data/groups.json'),
                    fetch('data/archive.json')
                ]);
                const allRes = [siteRes, bannerRes, newsRes, timelineRes, peopleRes, zonesRes, eventsRes, modListRes, modTimelineRes, wikiRes, faqRes, historyRes, orgRes, surveysRes, emergencyRes, groupsRes, archiveRes];
                const failed = allRes.find(r => !r.ok);
                if (failed) throw new Error('HTTP ' + failed.status + ' ' + failed.url);
                appData.site = await siteRes.json();
                appData.banner = await bannerRes.json();
                appData.news = await newsRes.json();
                appData.timeline = await timelineRes.json();
                appData.people = await peopleRes.json();
                appData.zones = await zonesRes.json();
                appData.events = await eventsRes.json();
                appData.modList = await modListRes.json();
                appData.modTimeline = await modTimelineRes.json();
                appData.wiki = await wikiRes.json();
                appData.faq = await faqRes.json();
                appData.historyVolumes = await historyRes.json();
                appData.org = await orgRes.json();
                appData.surveys = await surveysRes.json();
                appData.emergency = await emergencyRes.json();
                appData.groups = await groupsRes.json();
                appData.archive = await archiveRes.json();
                ready = true;
            } catch (err) {
                console.warn('fetch 数据失败（可能是 file:// 本地打开），尝试内置数据源:', err && err.message);
                const bundle = window.__XY_DATA__;
                if (bundle && DATA_KEYS.every(k => bundle[k] !== undefined)) {
                    DATA_KEYS.forEach(k => applyData(k, bundle[k]));
                    console.info('已使用内置数据源渲染（file:// 模式）');
                    ready = true;
                } else {
                    console.error('数据加载失败:', err);
                    document.querySelectorAll('.loading-placeholder').forEach(el => {
                        el.innerHTML = '数据加载失败，<button id="retryBtn" style="background:var(--seal);color:var(--on-accent);border:none;padding:4px 12px;border-radius:var(--radius-s);cursor:pointer;">点击重试</button>';
                    });
                    const retry = document.getElementById('retryBtn');
                    if (retry) retry.addEventListener('click', loadAllData);
                }
            }
            if (!ready) return;
            // 渲染与初始化各自兜底，任一板块出错都不会触发「误判为 fetch 失败」的整体降级
            try { renderAll(); } catch (e) { console.error('页面渲染失败:', e); }
            try { initPage(); } catch (e) { console.warn('页面初始化失败:', e); }
        }
        function renderAll() {
            renderScrollNotice();
            renderDocCode();
            renderFooter();
            renderBanner();
            try { renderOrgChart(); } catch (e) { console.warn('组织架构图渲染失败:', e); }
            try { renderEmergency(); } catch (e) { console.warn('治理状态看板渲染失败:', e); }
            try { renderSurveys(); } catch (e) { console.warn('普查汇总渲染失败:', e); }
            try { renderGroups(); } catch (e) { console.warn('开放群聊入口渲染失败:', e); }
            renderNews();
            renderTimeline();
            renderHistoryVolumes();
            renderEvents();
            renderModTimeline();
            renderModList();
            renderWiki('base');
            renderFaq();
            renderCorePeople();
            renderRetiredPeople();
            renderOldPeople();
            renderStaffPeople();
            renderCommonPeople();
            renderZones();
            renderMembers();
            initEditLinks();
            adaptMobileSidebar();
        }
        function renderOrgChart() {
            const org = appData.org || {};
            const box = document.getElementById('orgChartBox');
            if (!box) return;
            if (!org.root || !org.chain) {
                box.innerHTML = '<div class="loading-placeholder">组织架构数据未加载</div>';
                return;
            }
            const c = org.root.council;
            // 靖枢堂：非建制共识，置于最上方（虚线），不再横跨三人下方
            const councilTop = (c && c.position === 'top') ? `
                <div class="org-council-top">
                    <span class="name">${c.name}</span>
                    <span class="alias">${c.alias || ''}</span>
                    <span class="role">${c.role || ''}</span>
                    <span class="note">${c.note || ''}</span>
                </div>` : '';
            const rootNodes = org.root.boxes.map(b => `
                <div class="org-node tone-${b.tone || 'ink'}">
                    <div class="org-node-title">${b.name}<span class="org-node-alias">${b.alias || ''}</span></div>
                    <div class="org-node-role">${b.role || ''}</div>
                    <div class="org-node-role dim">${b.note || ''}</div>
                </div>`).join('');
            const rootRow = `
                <div class="org-tier-row is-first">
                    <div class="org-rail" aria-hidden="true"></div>
                    <div class="org-cell">
                        <div class="org-tier-cap"><b>${org.root.tier}</b><span class="cap-note">名位与分线</span></div>
                        <div class="org-nodes">${rootNodes}</div>
                    </div>
                </div>`;
            const chainRows = org.chain.map((td, i) => {
                const last = i === org.chain.length - 1;
                const tone = td.tone || (td.owner === '青' ? 'seal' : td.owner === '游' ? 'navy' : 'gold');
                const cls = ['org-node', 'tone-' + tone];
                if (td.status === 'paralyzed') cls.push('is-paralyzed');
                if (td.status === 'building') cls.push('is-building');
                if (td.status === 'frozen') cls.push('is-frozen');
                const mainNode = `<div class="${cls.join(' ')}">
                    <div class="org-node-title">${td.name}<span class="org-badge ${td.status}">${td.statusText}</span></div>
                    <div class="org-node-role">主管：${td.owner}　·　${td.ownerNote}</div>
                    <div class="org-node-role dim">${td.duty}</div>
                    <ul class="org-facts">${(td.facts || []).map(f => `<li>${f}</li>`).join('')}</ul>
                </div>`;
                const spur = td.takeover ? `<div class="org-spur">
                        <span class="org-spur-cap">临时接管</span>
                        <span class="org-spur-line" aria-hidden="true"></span>
                    </div>
                    <div class="org-node is-emergency tone-gold">
                        <div class="org-node-title">${td.takeover.name}<span class="org-badge ${td.takeover.status}">${td.takeover.statusText}</span></div>
                        <div class="org-node-role">${td.takeover.sub}</div>
                        <ul class="org-facts">${(td.takeover.facts || []).map(f => `<li>${f}</li>`).join('')}</ul>
                    </div>` : '';
                const rowCls = ['org-tier-row'];
                if (last) rowCls.push('is-last');
                if (td.status === 'paralyzed') rowCls.push('is-paralyzed');
                return `<div class="${rowCls.join(' ')}">
                    <div class="org-rail" aria-hidden="true"></div>
                    <div class="org-cell">
                        <div class="org-tier-cap"><b>${td.tier}</b><span class="cap-note">${td.chainNote || ''}</span></div>
                        <div class="org-nodes">${mainNode}${spur}</div>
                    </div>
                </div>`;
            }).join('');
            box.innerHTML = `<div class="org-inner">${councilTop}${rootRow}${chainRows}</div>`;
            const setTxt = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
            setTxt('orgIntro', org.intro || '');
            setTxt('orgUpdated', '数据截止 ' + (org.updated || ''));
            setTxt('orgMetaText', org.root.caption || '');
            const legend = document.getElementById('orgLegend');
            if (legend) legend.innerHTML = (org.legend || []).map(l => `
                <span class="org-legend-item"><span class="org-legend-swatch sw-${l.k}" title="${l.d}"></span>${l.t}</span>
            `).join('');
            const notes = document.getElementById('orgNotes');
            if (notes) notes.innerHTML = (org.notes || []).map(n => `<p>${n}</p>`).join('');
        }
        function renderEmergency() {
            const e = appData.emergency || {};
            const cards = document.getElementById('emergencyCards');
            if (!cards) return;
            if (!e.cards) {
                cards.innerHTML = '<div class="loading-placeholder">治理状态数据未加载</div>';
                return;
            }
            document.getElementById('emergencyUpdated').textContent = '数据截止 ' + (e.updated || '');
            document.getElementById('emergencyLead').textContent = e.lead || '';
            const statusBox = document.getElementById('govStatus');
            if (statusBox) {
                statusBox.innerHTML = (e.status || []).map(it => `
                    <div class="gov-status-item ${it.tone || ''}">
                        <div class="gov-status-label">${it.label}</div>
                        <div class="gov-status-value">${it.value}</div>
                        <div class="gov-status-note">${it.note || ''}</div>
                    </div>`).join('');
            }
            cards.innerHTML = e.cards.map(c => `
                <div class="es-card tone-${c.tone || 'ink'}">
                    <span class="es-tag">${c.tag}</span>
                    <span class="es-title">${c.title}</span>
                    <div class="es-body">${c.body}</div>
                </div>
            `).join('');
            document.getElementById('emergencyCols').innerHTML = (e.columns || []).map(col => `
                <div class="es-col ${col.tone}">
                    <h4>${col.head}</h4>
                    <ul>${col.items.map(i => `<li>${i}</li>`).join('')}</ul>
                </div>
            `).join('');
        }
        // 历次普查汇总表
        function renderSurveys() {
            const s = appData.surveys || {};
            const tbl = document.getElementById('surveysTable');
            if (!tbl) return;
            if (!s.rows) {
                tbl.innerHTML = '<tr><td class="loading-placeholder">普查数据未加载</td></tr>';
                return;
            }
            document.getElementById('surveysIntro').textContent = s.intro || '';
            const head = (s.headers || []).map(h => `<th>${h}</th>`).join('');
            const body = s.rows.map((r, i) => {
                const last = i === s.rows.length - 1 ? ' class="is-last"' : '';
                // 数值列：第 2、3 列（索引 1、2）为人数
                const cells = r.map((c, j) => {
                    const cls = (j === 1 || j === 2) && /^[\d,]+$/.test(String(c)) ? ' class="num"' : '';
                    return `<td${cls}>${c}</td>`;
                }).join('');
                return `<tr${last}>${cells}</tr>`;
            }).join('');
            tbl.innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
            document.getElementById('surveysNotes').innerHTML = (s.footnotes || []).map(n => `<p>${n}</p>`).join('');
            const t = document.getElementById('surveysTitle');
            if (t) t.textContent = s.title || '';
        }
        // 接管 / 互宣 群聊开放入口
        function renderGroups() {
            const g = appData.groups || {};
            const taken = document.getElementById('groupsTakenover');
            const mutual = document.getElementById('groupsMutual');
            if (!taken || !mutual) return;
            const list = (g.groups || []);
            const item = x => `
                <a class="gp-item ${x.type}" href="${x.url}" target="_blank" rel="noopener noreferrer">
                    <span class="gp-tag">${x.typeLabel}</span>
                    <span class="gp-name">${x.name}</span>
                    <span class="gp-desc">${x.desc}</span>
                    <span class="gp-note">${x.note}</span>
                </a>`;
            const tk = list.filter(x => x.type === 'takenover');
            const mu = list.filter(x => x.type === 'mutual');
            const leadEl = document.getElementById('groupsLead');
            if (leadEl) {
                leadEl.textContent = '下列 ' + tk.length + ' 个群聊为雨群接管、新并入的群及各特区。' +
                    (mu.length ? '另有 ' + mu.length + ' 个对外互宣群。' : '原对外互宣群系已于 2026-11-08 随文明评议会解散，互宣协议全部失效，故不再单列。') +
                    '点击整条卡片即可跳转加群。';
            }
            taken.innerHTML = tk.length
                ? `<div class="gp-sub">接管 · 新并入 · 特区（${tk.length}）</div><div class="gp-list">${tk.map(item).join('')}</div>`
                : '<div class="gp-empty">暂无接管群聊</div>';
            mutual.innerHTML = mu.length
                ? `<div class="gp-sub">对外互宣群系（${mu.length}）</div><div class="gp-list">${mu.map(item).join('')}</div>`
                : '';
        }
        function renderScrollNotice() {
            document.getElementById('scrollNoticeText').textContent = appData.site.scrollNotice;
        }
        function renderDocCode() {
            const s = appData.site;
            document.getElementById('docCode').textContent = `${s.recordNumber || ''} ｜ 全域在册 ${s.totalMembers || 0} 人 ｜ 非官方社群自治门户`;
        }
        function renderFooter() {
            const s = appData.site;
            document.querySelector('#footerBox .footer-inner').innerHTML = `
                <div class="footer-grid">
                    <div class="footer-col">
                        <h5>门户信息</h5>
                        <p>${s.copyright}</p>
                        <p>社群总登记人数：${s.totalMembers}人</p>
                        <p>社群备案编号：${s.recordNumber}</p>
                        <p>技术维护：${s.maintainer}</p>
                    </div>
                    <div class="footer-col">
                        <h5>档案与编纂</h5>
                        <p>全域总负责人：总管、副总管「${s.chiefManager}」</p>
                        <p>代总群主：${s.actingLeader}</p>
                        <p>档案编纂：${s.compilers}</p>
                        <p>参考资料：${s.references}</p>
                    </div>
                    <div class="footer-col">
                        <h5>快速入口</h5>
                        <ul>
                            <li><a href="plus.html">史料规章馆（群史全卷·规章全集）</a></li>
                            <li><a href="#wiki-rule">群规章程</a></li>
                            <li><a href="#contact">联络部</a></li>
                            <li><a href="#zones">分区入口</a></li>
                            <li><a href="#faq">常见问答</a></li>
                        </ul>
                    </div>
                </div>
                <div class="footer-legal" id="footer-legal">
                    <p><strong>合规声明：</strong>本门户为「文明时代2」游戏玩家自发组织的民间兴趣社群（雨群/新雨社）之内部信息服务平台，非任何政府机关、企事业单位或官方认证机构，页面中采用的公文样式、印章图形、编号格式等视觉元素，仅作为社群文化与版式设计之用，不代表、不模拟、不冒用任何国家机关公文效力，亦不具有行政、司法或公示送达等法律效果。</p>
                    <p>本站所载群史、人物介绍、分区状态、模组进度等内容，均由社群成员自愿编纂并仅供内部查阅、交流与存档使用，不构成任何商业宣传、投资建议或对外担保。相关游戏名称、模组名称及素材版权归其原著作权人所有，本站仅作社群自用性引用与说明，不用于任何商业用途；如涉及权利人异议，请联系本站维护方协商处理。</p>
                    <p>本站尊重并遵守《中华人民共和国网络安全法》《中华人民共和国个人信息保护法》及相关网络内容管理规定，不发布、不传播违法违规信息；页面内容如与现行法律法规存在冲突，以法律法规为准，本站保留依规修改、删除相关内容的权利。</p>
                </div>
            `;
            document.querySelector('#footerBox').insertAdjacentHTML('beforeend', `
                <div class="footer-bottom">© ${new Date().getFullYear()} 新雨社枢密院 · 民间社群自治门户 · 非官方 · 仅供社群内部使用</div>
            `);
        }
        function renderBanner() {
            const box = document.getElementById('bannerBox');
            box.innerHTML = appData.banner.map(item => {
                if (item.type === 'image') {
                    return `<div class="banner-item img-banner"><img src="${item.src}" alt="${item.alt || ''}"></div>`;
                }
                return `<div class="banner-item">${item.text}</div>`;
            }).join('');
        }
        function renderNews() {
            // 固定按日期倒序渲染（新的在上），与数据文件里的书写顺序无关
            const list = [...appData.news].sort((a, b) => String(b.date).localeCompare(String(a.date)));
            document.getElementById('newsList').innerHTML = list.map(item => `
                <li><a href="#">${item.name}</a><span class="date-tag">${item.date}</span></li>
            `).join('');
        }
        function renderTimeline() {
            document.getElementById('timelineBox').innerHTML = appData.timeline.map(item => `
                <div class="timeline-item ${item.active ? 'active' : ''}">
                    <div class="timeline-date">${item.date}</div>
                    <div class="timeline-content">${item.content}</div>
                </div>
            `).join('');
        }
        function renderHistoryVolumes() {
            const box = document.getElementById('historyVolumesBox');
            box.innerHTML = appData.historyVolumes.map((vol, index) => `
                <div class="collapse-panel" data-vol-index="${index}">
                    <div class="panel-head" data-panel="full-vol${index+1}">
                        <span>${vol.title}</span>
                        <span class="arrow">▶</span>
                    </div>
                    <div class="panel-body" id="full-vol${index+1}"></div>
                </div>
            `).join('');
        }
        function renderVolumeInto(body, index, version) {
            const vol = appData.historyVolumes[index] || {};
            const html = version === 'full' ? (vol.full || vol.content || '') : (vol.content || '');
            body.innerHTML = `
                <div class="history-switch">
                    <button type="button" data-ver="public" class="${version === 'public' ? 'active' : ''}">对外版</button>
                    <button type="button" data-ver="full" class="${version === 'full' ? 'active' : ''}">全本原文</button>
                    <span class="tip">${version === 'full' ? '逐字保留原文，含原始引语与史论批注' : '保留全部事实与时间，人身攻讦式原话改为间接叙述'}</span>
                </div>
                <div class="history-volume">${sanitizeHtml(html)}</div>`;
            body.querySelectorAll('.history-switch button').forEach(btn => {
                btn.addEventListener('click', () => renderVolumeInto(body, index, btn.dataset.ver));
            });
        }
        function renderEvents() {
            document.getElementById('eventsBox').innerHTML = Object.entries(appData.events).map(([key, item]) => `
                <div class="event-card" data-event="${key}">
                    <h4>${item.name}</h4>
                    <p>${item.desc}</p>
                </div>
            `).join('');
        }
        function renderModTimeline() {
            document.getElementById('modTimelineBox').innerHTML = appData.modTimeline.map(item => `
                <div class="mod-item">
                    <div class="mod-date">${item.date}</div>
                    <div class="mod-name">${item.name}</div>
                </div>
            `).join('');
        }
        function renderModList() {
            document.getElementById('modListBox').innerHTML = appData.modList.map(item => `
                <li><a href="#">${item.name}</a><span class="date-tag">${item.status}</span></li>
            `).join('');
        }
        function renderWiki(type) {
            const data = appData.wiki[type] || [];
            const titleMap = {
                base: '基础概念词条',
                org: '组织架构详解',
                duty: '内部机构与职务职权细则',
                rule: '雨群联合社区活动准则（1号修正案）'
            };
            document.getElementById('wikiContentBox').innerHTML = `
                <h3 style="font-size:15px;color:var(--ink);margin:10px 0 8px;border-bottom:1px solid var(--border);padding-bottom:6px;">${titleMap[type]}</h3>
                ${type === 'rule' ? sanitizeHtml(data.html) : data.map(item => `
                    <div class="wiki-term">
                        <h4>${item.name}</h4>
                        <p>${item.desc}</p>
                    </div>
                `).join('')}
            `;
            document.querySelectorAll('.wiki-catalog-item').forEach(el => {
                el.classList.toggle('active', el.dataset.wiki === type);
            });
        }
        function renderFaq() {
            document.getElementById('faqBox').innerHTML = appData.faq.map((item, index) => `
                <div class="collapse-panel">
                    <div class="panel-head" data-panel="faq${index+1}">
                        <span>${item.question}</span>
                        <span class="arrow">▶</span>
                    </div>
                    <div class="panel-body" id="faq${index+1}">${item.answer}</div>
                </div>
            `).join('');
        }
// 统一的人物卡渲染：跳过数据中缺失的 key，避免单个缺项中断整块渲染
        function peopleCard(key) {
            const p = appData.people[key];
            if (!p) return '';
            return `
                <div class="people-card" data-id="${key}">
                    <img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzUiIGhlaWdodD0iNzUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9Ijc1IiBoZWlnaHQ9Ijc1IiBmaWxsPSIjZjZmMWU0Ii8+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtc2l6ZT0iMjgiIGZpbGw9IiNhNjFiMjkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJTaW1TdW4iPuW8gjwvdGV4dD48L3N2Zz4=';this.onerror=null;">
                    <div class="people-name">${p.name}</div>
                    <div class="people-desc">${p.post}</div>
                </div>
            `;
        }
        function renderCorePeople() {
            const coreKeys = ['juan', 'youke', 'qingxuan', 'keng'];
            document.getElementById('corePeopleBox').innerHTML = coreKeys.map(peopleCard).join('');
        }
        function renderRetiredPeople() {
            const retiredKeys = ['suan_cai', 'yujie'];
            document.getElementById('retiredPeopleBox').innerHTML = retiredKeys.map(peopleCard).join('');
        }
        function renderOldPeople() {
            const oldKeys = ['bingguo', 'kangnaixin', 'valery', 'tangyueyue', 'dongfeng', 'ya', 'sablin', 'tor', 'xiaokongmiao', 'lubai', 'lanmao', 'weisidalin', 'napolun_gz', 'yugongzhiliang', 'yang', 'tangmian', 'qinwangchan', 'lunai', 'yun', 'fafa'];
            document.getElementById('oldPeopleBox').innerHTML = oldKeys.map(peopleCard).join('');
        }
        function renderStaffPeople() {
            const staffKeys = ['xiaoyu', 'ermiao', 'wu', 'hutao', 'yu', 'zhou_tianzi'];
            document.getElementById('staffPeopleBox').innerHTML = staffKeys.map(peopleCard).join('');
        }
        function renderCommonPeople() {
            const commonKeys = ['desan', 'luxiya', 'hhhhhh', 'csx', 'langmanrugu', 'lym', 'xiaofeiyu', 'xianyu', 'yueyun', 'laplata', 'sigmacat', 'wuchen',
                'youling', 'changfeng', 'spgspgdfl', 'huaixuqing', 'iypai', 'xiangbudao', 'dian', 'deao', 'zhu_youjian', 'xinghen'];
            document.getElementById('commonPeopleBox').innerHTML = commonKeys.map(peopleCard).join('');
        }
        function renderZones() {
            const zoneOrder = ['1','2','3','4','5','5b','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','qmy','tcy','tbc','qcs','qws','shumi','qws_old','ziyou'];
            document.getElementById('zonesBox').innerHTML = zoneOrder.map(key => {
                const z = appData.zones[key];
                if (!z) return '';
                const statusClass = z.status === 'open' ? '' : z.status;
                return `<div class="zone-item ${statusClass}" data-zone="${key}">${z.name.replace(/（.*）/g, '')}<br>${z.desc}</div>`;
            }).join('');
        }
        // 维基式编辑入口：每个板块右上角挂一个「✎ 编辑」，直达后台对应文件
        function initEditLinks() {
            document.querySelectorAll('[data-edit]').forEach(function (card) {
                if (card.querySelector('.edit-link')) return;
                var a = document.createElement('a');
                a.className = 'edit-link';
                a.href = 'admin/panel.html?file=' + card.dataset.edit;
                a.title = '编辑这一节（需登录）';
                a.textContent = '✎ 编辑';
                card.appendChild(a);
            });
        }
        // 编辑成员：从 /api/members 拉取（后端不可用时静默隐藏）
        function renderMembers() {
            const box = document.getElementById('memberBox');
            if (!box) return;
            fetch('api/members').then(r => r.ok ? r.json() : null).then(d => {
                const list = (d && d.members) || [];
                const cnt = document.getElementById('memberCount');
                if (cnt) cnt.textContent = list.length ? list.length + ' 位' : '暂无';
                if (!list.length) {
                    box.innerHTML = '<div class="loading-placeholder">暂无编辑成员，欢迎申请</div>';
                    return;
                }
                const roleName = r => r === 'super' ? '超级管理员' : r === 'viewer' ? '只读' : '编辑';
                box.innerHTML = list.map(m => {
                    const d0 = new Date(m.joined || Date.now());
                    const date = d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0');
                    return `<div class="mem-card tone-${m.role}">
                        <span class="mem-avatar">${(m.username || '?').slice(0, 1).toUpperCase()}</span>
                        <span class="mem-name">${m.username}</span>
                        <span class="mem-role">${roleName(m.role)}</span>
                        <span class="mem-since">${date} 加入</span>
                    </div>`;
                }).join('');
            }).catch(() => {
                box.innerHTML = '<div class="loading-placeholder">成员数据暂不可用</div>';
            });
        }
        function adaptMobileSidebar() {
            if (window.innerWidth > 768) return;
            const rightSide = document.querySelector('.right-side');
            const leftMain = document.querySelector('.left-main');
            if (!rightSide || !leftMain) return;
            let clone = document.getElementById('mobile-sidebar-clone');
            if (clone) clone.remove();
            clone = document.createElement('div');
            clone.id = 'mobile-sidebar-clone';
            clone.innerHTML = rightSide.innerHTML;
            leftMain.appendChild(clone);
        }
        function initPage() {
            initBanner();
            initSideCollapse();
            initCollapsePanels();
            initWikiCatalog();
            initModal();
            initBackTop();
            initNavScroll();
            initSearch();
            initHashAnchor();
        }
        function initSideCollapse() {
            const btn = document.getElementById('sideCollapseBtn');
            const container = document.getElementById('mainContainer');
            if (!btn) return;
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                container.classList.toggle('collapse-side');
                btn.textContent = container.classList.contains('collapse-side') ? '展开侧边' : '收起侧边';
            });
        }
        function initBanner() {
            const list = document.getElementById('bannerBox');
            const items = list.children;
            const dotsBox = document.getElementById('bannerDots');
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            let current = 0;
            let timer = null;
            dotsBox.innerHTML = '';
            [...items].forEach((_, i) => {
                const dot = document.createElement('div');
                dot.className = 'banner-dot' + (i === 0 ? ' active' : '');
                dot.addEventListener('click', () => { current = i; updateBanner(); });
                dotsBox.appendChild(dot);
            });
            function updateBanner() {
                list.style.transform = `translateX(-${current * 100}%)`;
                [...dotsBox.children].forEach((dot, i) => dot.classList.toggle('active', i === current));
            }
            function startBannerTimer() {
                stopBannerTimer();
                timer = setInterval(() => {
                    current = (current + 1) % items.length;
                    updateBanner();
                }, 4500);
            }
            function stopBannerTimer() {
                if (timer) clearInterval(timer);
            }
            prevBtn.addEventListener('click', () => {
                current = (current - 1 + items.length) % items.length;
                updateBanner();
                startBannerTimer();
            });
            nextBtn.addEventListener('click', () => {
                current = (current + 1) % items.length;
                updateBanner();
                startBannerTimer();
            });
            const wrap = document.querySelector('.banner-wrap');
            wrap.addEventListener('mouseenter', stopBannerTimer);
            wrap.addEventListener('mouseleave', startBannerTimer);
            let touchStartX = 0;
            wrap.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; stopBannerTimer(); }, { passive: true });
            wrap.addEventListener('touchend', (e) => {
                const dx = e.changedTouches[0].clientX - touchStartX;
                if (dx > 40) { current = (current - 1 + items.length) % items.length; updateBanner(); }
                else if (dx < -40) { current = (current + 1) % items.length; updateBanner(); }
                startBannerTimer();
            }, { passive: true });
            updateBanner();
            startBannerTimer();
        }
        function initCollapsePanels() {
            document.addEventListener('click', (e) => {
                const head = e.target.closest('.panel-head');
                if (!head) return;
                const body = document.getElementById(head.dataset.panel);
                if (!body) return;
                const isOpen = body.classList.contains('open');
                head.classList.toggle('open', !isOpen);
                body.classList.toggle('open', !isOpen);
                if (!isOpen && head.dataset.panel.startsWith('full-vol')) {
                    const index = parseInt(head.dataset.panel.replace('full-vol', ''), 10) - 1;
                    if (!body.innerHTML.trim()) renderVolumeInto(body, index, 'public');
                }
            });
        }
        function initWikiCatalog() {
            document.querySelectorAll('.wiki-catalog-item').forEach(item => {
                item.addEventListener('click', () => renderWiki(item.dataset.wiki));
            });
        }
        function initModal() {
            const modal = document.getElementById('commonModal');
            const modalImg = document.getElementById('modalImg');
            const modalName = document.getElementById('modalName');
            const modalPost = document.getElementById('modalPost');
            const modalText = document.getElementById('modalText');
            const modalClose = document.getElementById('modalClose');
            const modalHead = document.getElementById('modalHead');
            const modalActionBtn = document.getElementById('modalActionBtn');
            function openModal(data, showImg = true) {
                modalHead.style.display = showImg ? 'flex' : 'none';
                if (showImg) modalImg.src = data.img;
                modalName.textContent = data.name;
                modalPost.textContent = data.post || data.desc || '';
                modalText.innerHTML = sanitizeHtml(data.text || data.detail || '');
                if (data.status === 'open' && data.url) {
                    modalActionBtn.classList.remove('disabled');
                    modalActionBtn.textContent = '立即加群';
                    modalActionBtn.style.display = 'inline-block';
                    modalActionBtn.onclick = () => window.open(data.url, '_blank');
                } else if (data.status === 'disabled') {
                    modalActionBtn.classList.add('disabled');
                    modalActionBtn.textContent = '暂不开放';
                    modalActionBtn.style.display = 'inline-block';
                    modalActionBtn.onclick = null;
                } else if (data.status === 'canceled') {
                    modalActionBtn.classList.add('disabled');
                    modalActionBtn.textContent = '已取消编号';
                    modalActionBtn.style.display = 'inline-block';
                    modalActionBtn.onclick = null;
                } else if (data.status === 'banned') {
                    modalActionBtn.classList.add('disabled');
                    modalActionBtn.textContent = '已封禁';
                    modalActionBtn.style.display = 'inline-block';
                    modalActionBtn.onclick = null;
                } else if (data.status === 'paralyzed') {
                    modalActionBtn.classList.add('disabled');
                    modalActionBtn.textContent = '职能瘫痪';
                    modalActionBtn.style.display = 'inline-block';
                    modalActionBtn.onclick = null;
                } else if (data.status === 'emergency') {
                    modalActionBtn.classList.add('disabled');
                    modalActionBtn.textContent = '紧急状态已终结';
                    modalActionBtn.style.display = 'inline-block';
                    modalActionBtn.onclick = null;
                } else {
                    modalActionBtn.style.display = 'none';
                }
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
                modalClose.focus();
            }
            function closeModal() {
                modal.classList.remove('show');
                document.body.style.overflow = '';
            }
            document.addEventListener('click', (e) => {
                const peopleCard = e.target.closest('.people-card');
                if (peopleCard) {
                    const key = peopleCard.dataset.id;
                    openModal(appData.people[key], true);
                    return;
                }
                const zoneItem = e.target.closest('.zone-item');
                if (zoneItem) {
                    const key = zoneItem.dataset.zone;
                    openModal(appData.zones[key], false);
                    return;
                }
            });
            modalClose.addEventListener('click', closeModal);
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
            });
            window.__openDetailModal = openModal;
        }
        function layoutNavSearch() {
            const search = document.querySelector('.nav-search');
            const nav = document.querySelector('nav');
            const navMain = document.getElementById('navMain');
            if (!search || !nav || !navMain) return;
            if (window.matchMedia('(max-width: 768px)').matches) {
                if (!search.classList.contains('in-menu')) {
                    search.classList.add('in-menu');
                    navMain.insertBefore(search, navMain.firstChild);
                }
            } else if (search.classList.contains('in-menu')) {
                search.classList.remove('in-menu');
                nav.insertBefore(search, document.getElementById('themeToggle'));
            }
        }
        function initHamburger() {
            const btn = document.getElementById('hamburgerBtn');
            const navMain = document.getElementById('navMain');
            document.querySelectorAll('.nav-item').forEach(item => {
                if (item.querySelector('.sub-nav')) item.classList.add('has-sub');
            });
            btn.setAttribute('aria-expanded', 'false');
            const isMobile = () => window.innerWidth <= 768;
            function setMenu(open) {
                navMain.classList.toggle('open', open);
                btn.setAttribute('aria-expanded', open ? 'true' : 'false');
                btn.classList.toggle('active', open);
                btn.textContent = open ? '✕' : '☰';
                if (!open) {
                    navMain.querySelectorAll('.nav-item.open').forEach(item => item.classList.remove('open'));
                }
            }
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                setMenu(!navMain.classList.contains('open'));
            });
            navMain.querySelectorAll('.nav-item > a').forEach(link => {
                const item = link.closest('.nav-item');
                link.addEventListener('click', (e) => {
                    if (!isMobile()) return;
                    if (item.classList.contains('has-sub')) {
                        e.preventDefault();
                        const wasOpen = item.classList.contains('open');
                        navMain.querySelectorAll('.nav-item.open').forEach(other => {
                            if (other !== item) other.classList.remove('open');
                        });
                        item.classList.toggle('open', !wasOpen);
                    } else {
                        setTimeout(() => setMenu(false), 120);
                    }
                });
            });
            navMain.querySelectorAll('.sub-nav a').forEach(link => {
                link.addEventListener('click', () => {
                    if (isMobile()) setTimeout(() => setMenu(false), 120);
                });
            });
            document.addEventListener('click', (e) => {
                if (navMain.classList.contains('open') && !e.target.closest('nav')) setMenu(false);
            });
        }
        function initBackTop() {
            const btn = document.getElementById('backTopBtn');
            window.addEventListener('scroll', throttle(() => {
                btn.style.display = window.scrollY > 400 ? 'block' : 'none';
            }, 150));
            btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        }
        function initNavScroll() {
            const navItems = document.querySelectorAll('.nav-item');
            const floatCatalog = document.getElementById('floatCatalog');
            const catalogItems = document.querySelectorAll('#catalogList li');
            const sections = [...catalogItems].map(item => document.getElementById(item.dataset.target)).filter(Boolean);
            const updateActive = throttle(() => {
                floatCatalog.classList.toggle('show', window.scrollY > 300);
                let currentSection = sections[0];
                sections.forEach(sec => {
                    if (sec.getBoundingClientRect().top <= 100) currentSection = sec;
                });
                if (!currentSection) return;
                navItems.forEach(item => item.classList.remove('active'));
                const matchedNav = [...navItems].find(item => item.querySelector('a')?.getAttribute('href') === '#' + currentSection.id);
                if (matchedNav) matchedNav.classList.add('active');
                catalogItems.forEach(item => item.classList.toggle('active', item.dataset.target === currentSection.id));
            }, 100);
            window.addEventListener('scroll', updateActive);
            catalogItems.forEach(item => {
                item.addEventListener('click', () => {
                    document.getElementById(item.dataset.target).scrollIntoView({ behavior: 'smooth' });
                    setCatalog(false);
                })
            })
            // 圆钮开合
            const toggle = document.getElementById('catalogToggle');
            const setCatalog = open => {
                if (!toggle) return;
                floatCatalog.classList.toggle('open', open);
                toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
                toggle.textContent = open ? '✕' : '☰';
            };
            if (toggle) {
                toggle.addEventListener('click', e => {
                    e.stopPropagation();
                    setCatalog(!floatCatalog.classList.contains('open'));
                });
                // 点面板外部或按 Esc 收起
                document.addEventListener('click', e => {
                    if (!floatCatalog.classList.contains('open')) return;
                    if (!floatCatalog.contains(e.target)) setCatalog(false);
                });
                document.addEventListener('keydown', e => {
                    if (e.key === 'Escape') setCatalog(false);
                });
            }
            updateActive();
        }
        function initSearch() {
            const searchInput = document.getElementById('searchInput');
            const searchResult = document.getElementById('searchResult');
            function renderSearchResults(keyword) {
                if (!keyword.trim()) {
                    searchResult.classList.remove('show');
                    return;
                }
                keyword = keyword.trim();
                let html = '';
                let personMatch = [];
                for (const key in appData.people) {
                    const p = appData.people[key];
                    if (p.name.includes(keyword) || p.post.includes(keyword)) {
                        personMatch.push({ key, ...p });
                    }
                }
                if (personMatch.length > 0) {
                    html += '<div class="search-group">人物</div>';
                    personMatch.forEach(p => {
                        html += `<div class="search-item" data-type="person" data-key="${p.key}">${p.name} · ${p.post}</div>`;
                    });
                }
                let zoneMatch = [];
                for (const key in appData.zones) {
                    const z = appData.zones[key];
                    if (z.name.includes(keyword) || z.fullName?.includes(keyword)) {
                        zoneMatch.push({ key, ...z });
                    }
                }
                if (zoneMatch.length > 0) {
                    html += '<div class="search-group">分区</div>';
                    zoneMatch.forEach(z => {
                        html += `<div class="search-item" data-type="zone" data-key="${z.key}">${z.name}</div>`;
                    });
                }
                let eventMatch = [];
                for (const key in appData.events) {
                    const e = appData.events[key];
                    if (e.name.includes(keyword) || e.text.includes(keyword)) {
                        eventMatch.push({ key, ...e });
                    }
                }
                if (eventMatch.length > 0) {
                    html += '<div class="search-group">历史事件</div>';
                    eventMatch.forEach(e => {
                        html += `<div class="search-item" data-type="event" data-key="${e.key}">${e.name}</div>`;
                    });
                }
                let wikiMatch = [];
                ['base', 'org', 'duty'].forEach(type => {
                    (appData.wiki[type] || []).forEach(w => {
                        if (w.name.includes(keyword) || w.desc.includes(keyword)) {
                            wikiMatch.push(w);
                        }
                    })
                })
                if (wikiMatch.length > 0) {
                    html += '<div class="search-group">百科词条</div>';
                    wikiMatch.forEach(w => {
                        html += `<div class="search-item" data-type="wiki" data-name="${w.name}">${w.name} · ${w.desc}</div>`;
                    });
                }
                const arch = appData.archive || {};
                let archHits = [];
                (arch.bulletins || []).forEach(b => {
                    if ((b.title || '').includes(keyword) || (b.body || '').includes(keyword) || (b.issuer || '').includes(keyword)) {
                        archHits.push({ label: '公报 · ' + b.title, anchor: '#bulletins' });
                    }
                });
                (arch.rules || []).forEach(r => {
                    (r.points || []).forEach(pt => {
                        if ((r.name || '').includes(keyword) || (pt.text || '').includes(keyword)) {
                            archHits.push({ label: '群规 · ' + r.name + ' ' + (pt.no || ''), anchor: '#rules' });
                        }
                    });
                });
                (arch.today || []).forEach(e => {
                    if ((e.t || '').includes(keyword) || (e.x || '').includes(keyword) || (e.d || '').includes(keyword)) {
                        archHits.push({ label: '历史今天 · ' + e.x, anchor: '#today' });
                    }
                });
                (arch.newcomer || []).forEach(sc => {
                    const plain = (sc.html || '').replace(/<[^>]+>/g, '') + ((sc.items || []).join(''));
                    if ((sc.h || '').includes(keyword) || plain.includes(keyword)) {
                        archHits.push({ label: '新人须知 · ' + sc.h, anchor: '#newcomers' });
                    }
                });
                if (archHits.length > 0) {
                    html += '<div class="search-group">档案原文 · 史料规章馆</div>';
                    archHits.slice(0, 8).forEach(h => {
                        html += `<div class="search-item" data-type="archive" data-href="plus.html${h.anchor}">${h.label}</div>`;
                    });
                }
                let newsMatch = appData.news.filter(n => n.name.includes(keyword));
                if (newsMatch.length > 0) {
                    html += '<div class="search-group">公告</div>';
                    newsMatch.forEach(n => {
                        html += `<div class="search-item" data-type="news" data-name="${n.name}">${n.name}</div>`;
                    });
                }
                if (!html) html = '<div class="search-empty">未找到相关内容</div>';
                searchResult.innerHTML = html;
                searchResult.classList.add('show');
                searchResult.querySelectorAll('.search-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const type = item.dataset.type;
                        const key = item.dataset.key;
                        searchResult.classList.remove('show');
                        searchInput.value = '';
                        if (type === 'person') {
                            window.__openDetailModal(appData.people[key], true);
                        } else if (type === 'zone') {
                            window.__openDetailModal(appData.zones[key], false);
                        } else if (type === 'event') {
                            document.getElementById('events-special').scrollIntoView({ behavior: 'smooth' });
                        } else if (type === 'wiki') {
                            document.getElementById('wiki').scrollIntoView({ behavior: 'smooth' });
                        } else if (type === 'news') {
                            document.getElementById('notice').scrollIntoView({ behavior: 'smooth' });
                        } else if (type === 'archive') {
                            window.location.href = item.dataset.href;
                        }
                    })
                })
            }
            searchInput.addEventListener('input', (e) => renderSearchResults(e.target.value));
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !searchResult.contains(e.target)) {
                    searchResult.classList.remove('show');
                }
            })
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const firstItem = searchResult.querySelector('.search-item');
                    if (firstItem) firstItem.click();
                }
            })
        }
        function initHashAnchor() {
            const hash = window.location.hash.slice(1);
            if (hash && document.getElementById(hash)) {
                // 锚点落在百科目录项上时，顺带把对应词条切换出来
                if (hash.indexOf('wiki-') === 0) {
                    const t = hash.replace('wiki-', '');
                    if (['base', 'org', 'duty', 'rule'].indexOf(t) >= 0) renderWiki(t);
                }
                setTimeout(() => {
                    document.getElementById(hash).scrollIntoView({ behavior: 'smooth' });
                }, 300);
            }
            // 页面内点击百科目录锚点（如顶栏「规章文库」）时同样切换词条
            document.querySelectorAll('a[href^="#wiki-"]').forEach(a => {
                a.addEventListener('click', () => {
                    const t = a.getAttribute('href').replace('#wiki-', '');
                    if (['base', 'org', 'duty', 'rule'].indexOf(t) >= 0) renderWiki(t);
                });
            });
        }
        document.addEventListener('DOMContentLoaded', () => {
            // 主题由 assets/js/theme.js 统一初始化
            initHamburger();
            layoutNavSearch();
            window.matchMedia('(max-width: 768px)').addEventListener('change', layoutNavSearch);
            loadAllData();
        });
