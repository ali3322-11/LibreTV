/* ========== Netflix 风首页：Hero + 横滑行 ========== */

(function () {
    var heroData = null; // 当前 hero 的影片数据

    // 安全转义
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // 代理图片 URL（复用豆瓣的代理逻辑）
    async function proxiedCover(url) {
        try {
            var base = (typeof PROXY_URL !== 'undefined' ? PROXY_URL : '/proxy/') + encodeURIComponent(url);
            if (window.ProxyAuth && window.ProxyAuth.addAuthToProxyUrl) {
                return await window.ProxyAuth.addAuthToProxyUrl(base);
            }
            return base;
        } catch (e) { return url; }
    }

    // 拉豆瓣一类数据
    async function fetchSubjects(type, tag, limit) {
        var url = 'https://movie.douban.com/j/search_subjects?type=' + type +
            '&tag=' + encodeURIComponent(tag) + '&sort=recommend&page_limit=' + (limit || 12) + '&page_start=0';
        if (typeof fetchDoubanData === 'function') {
            var data = await fetchDoubanData(url);
            return (data && data.subjects) || [];
        }
        return [];
    }

    var heroList = [];   // 今日推荐的 5-6 部
    var heroIdx = 0;
    var heroTimer = null;

    // 按日期算一个偏移，每天换一批推荐（同一天内稳定）
    function dayOffset(len) {
        var d = new Date();
        var dayNum = Math.floor(d.getTime() / 86400000);
        return len ? (dayNum % len) : 0;
    }

    // 渲染 hero（5-6 部高分轮换）
    async function renderHero() {
        var hero = document.getElementById('netflixHero');
        if (!hero) return;
        try {
            var subjects = await fetchSubjects('movie', '热门', 30);
            if (!subjects.length) { hero.classList.add('hidden'); return; }
            // 按评分排序，取前 12，再按日期偏移取 6 部（每天不同）
            var sorted = subjects.slice().sort(function (a, b) {
                return parseFloat(b.rate || 0) - parseFloat(a.rate || 0);
            }).slice(0, 12);
            var off = dayOffset(sorted.length);
            heroList = [];
            for (var i = 0; i < 6 && i < sorted.length; i++) {
                heroList.push(sorted[(off + i) % sorted.length]);
            }
            heroIdx = 0;
            showHero(0);
            renderHeroDots();
            hero.classList.remove('hidden');
            // 8 秒自动轮换
            if (heroTimer) clearInterval(heroTimer);
            heroTimer = setInterval(function () {
                showHero((heroIdx + 1) % heroList.length);
            }, 8000);
        } catch (e) {
            hero.classList.add('hidden');
        }
    }

    function showHero(i) {
        heroIdx = i;
        var pick = heroList[i];
        if (!pick) return;
        heroData = pick;
        var self = this;
        proxiedCover(pick.cover).then(function (cover) {
            document.getElementById('nfHeroBg').style.backgroundImage = 'url("' + cover + '")';
        });
        document.getElementById('nfHeroTitle').textContent = pick.title || '';
        document.getElementById('nfHeroMeta').innerHTML =
            '<span class="rate">★ ' + esc(pick.rate || '暂无') + '</span>' +
            '<span>电影</span><span>' + (i + 1) + ' / ' + heroList.length + '</span>';
        document.getElementById('nfHeroDesc').textContent = '豆瓣高分推荐，点击立即播放或搜索此片。';
        renderHeroDots();
    }

    function renderHeroDots() {
        var box = document.getElementById('nfHeroDots');
        if (!box) return;
        box.innerHTML = '';
        for (var i = 0; i < heroList.length; i++) {
            (function (idx) {
                var d = document.createElement('span');
                d.className = 'nf-dot' + (idx === heroIdx ? ' active' : '');
                d.onclick = function () {
                    if (heroTimer) clearInterval(heroTimer);
                    showHero(idx);
                    heroTimer = setInterval(function () {
                        showHero((heroIdx + 1) % heroList.length);
                    }, 8000);
                };
                box.appendChild(d);
            })(i);
        }
    }
    window.nfHeroGo = function (i) { showHero(i); };

    // 渲染一行
    async function renderRow(rowId, type, tag) {
        var box = document.getElementById(rowId);
        if (!box) return;
        // 骨架屏
        box.innerHTML = '';
        for (var i = 0; i < 6; i++) {
            var sk = document.createElement('div');
            sk.className = 'nf-card-loading';
            box.appendChild(sk);
        }
        try {
            var subjects = await fetchSubjects(type, tag, 12);
            box.innerHTML = '';
            if (!subjects.length) {
                box.innerHTML = '<div style="color:#888;font-size:13px;padding:20px">暂无数据</div>';
                return;
            }
            for (var j = 0; j < subjects.length; j++) {
                await appendCard(box, subjects[j]);
            }
        } catch (e) {
            box.innerHTML = '<div style="color:#888;font-size:13px;padding:20px">加载失败，稍后再试</div>';
        }
    }

    async function appendCard(box, item) {
        var safeTitle = esc(item.title);
        var cover = await proxiedCover(item.cover);
        var card = document.createElement('div');
        card.className = 'nf-card';
        card.innerHTML =
            '<img loading="lazy" src="' + cover + '" alt="' + safeTitle + '" onerror="this.style.opacity=0.25">' +
            '<div class="t">' + safeTitle + '</div>' +
            '<div class="r">★ ' + esc(item.rate || '暂无') + '</div>';
        card.onclick = function () {
            // 点卡片 → 用标题搜索
            if (typeof fillAndSearch === 'function') fillAndSearch(item.title);
            else if (typeof window.fillAndSearch === 'function') window.fillAndSearch(item.title);
        };
        box.appendChild(card);
    }

    // Hero 按钮：立即播放（搜片名进播放流程）
    window.nfHeroPlayClick = function () {
        if (heroData && heroData.title) {
            if (typeof fillAndSearch === 'function') fillAndSearch(heroData.title);
        }
    };
    window.nfHeroSearch = function () {
        if (heroData && heroData.title) {
            var input = document.getElementById('searchInput');
            if (input) {
                input.value = heroData.title;
                if (typeof search === 'function') search();
            }
        }
    };

    // 显示/隐藏 Netflix 首页（搜索时隐藏，回家时显示）
    window.nfHomeShow = function (show) {
        var hero = document.getElementById('netflixHero');
        var rows = document.getElementById('netflixRows');
        var doubanArea = document.getElementById('doubanArea');
        if (show) {
            if (hero) hero.classList.remove('hidden');
            if (rows) rows.classList.remove('hidden');
            if (doubanArea) doubanArea.classList.add('hidden');
            // 懒加载一次
            if (!window._nfLoaded) {
                window._nfLoaded = true;
                renderHero();
                renderRow('nfRow-movie', 'movie', '热门');
                renderRow('nfRow-tv', 'tv', '热门');
                renderRow('nfRow-variety', 'tv', '综艺');
                renderRow('nfRow-anime', 'tv', '日本动画');
            }
        } else {
            if (hero) hero.classList.add('hidden');
            if (rows) rows.classList.add('hidden');
        }
    };

    // 页面加载后自动显示 Netflix 首页
    document.addEventListener('DOMContentLoaded', function () {
        setTimeout(function () {
            // 只有豆瓣启用时才显示
            try {
                if (localStorage.getItem('doubanEnabled') === 'true') window.nfHomeShow(true);
            } catch (e) { window.nfHomeShow(true); }
        }, 600);
    });
})();

/* ========== 最近搜索下拉框：聚焦显示，失焦/搜索后隐藏 ========== */
(function () {
    function dropdown() { return document.getElementById('recentSearches'); }
    function input() { return document.getElementById('searchInput'); }

    window.showRecentDropdown = function () {
        var d = dropdown();
        if (d && d.innerHTML.trim()) d.style.display = 'block';
    };
    window.hideRecentDropdown = function () {
        var d = dropdown();
        if (d) d.style.display = 'none';
    };

    document.addEventListener('DOMContentLoaded', function () {
        var inp = input();
        if (!inp) return;
        inp.addEventListener('focus', function () { window.showRecentDropdown(); });
        inp.addEventListener('blur', function () {
            // 延迟隐藏，让点击下拉项有时间触发
            setTimeout(window.hideRecentDropdown, 220);
        });
        // 点页面其他地方也隐藏
        document.addEventListener('click', function (e) {
            var d = dropdown();
            if (d && d.style.display === 'block' &&
                !d.contains(e.target) && e.target !== inp && !inp.contains(e.target)) {
                window.hideRecentDropdown();
            }
        });
    });

    // 劫持 renderSearchHistory：渲染后保持隐藏（除非输入框聚焦）
    var origRender = window.renderSearchHistory;
    if (typeof origRender === 'function') {
        window.renderSearchHistory = function () {
            origRender();
            var inp = input();
            if (document.activeElement !== inp) window.hideRecentDropdown();
        };
    }
})();
