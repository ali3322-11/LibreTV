
/* ========== YouTube 式布局交互 ========== */

// 侧边栏折叠/展开
window.toggleSidebar = function () {
    var sidebar = document.getElementById('ytSidebar');
    if (!sidebar) return;
    // 移动端：用 open 类做抽屉
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('open');
    } else {
        sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed');
    }
};

// 侧边栏导航
window.sidebarNav = function (type, el) {
    // 更新激活态
    document.querySelectorAll('.yt-nav-item').forEach(function (b) { b.classList.remove('active'); });
    if (el && el.classList) el.classList.add('active');
    document.querySelectorAll('.yt-chip').forEach(function (b) { b.classList.remove('active'); });

    // 移动端点击后收起侧边栏
    if (window.innerWidth <= 768) {
        var sidebar = document.getElementById('ytSidebar');
        if (sidebar) sidebar.classList.remove('open');
    }

    if (type === 'home') {
        if (typeof resetToHome === 'function') resetToHome();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // 确保豆瓣区可见，隐藏 Netflix 首页
    var doubanArea = document.getElementById('doubanArea');
    if (doubanArea) doubanArea.classList.remove('hidden');
    if (typeof window.nfHomeShow === 'function' && type !== 'home') window.nfHomeShow(false);

    // 切换电影/电视剧 tab + 标签：直接设置状态，不模拟点击（更可靠）
    // 电影 → 电影tab/热门；电视剧 → 电视剧tab/热门；综艺 → 电视剧tab/综艺；动漫 → 电视剧tab/日本动画
    var wantTv = (type === 'tv' || type === 'variety' || type === 'anime');
    var targetTab = wantTv ? 'tv' : 'movie';
    var targetTag = type === 'variety' ? '综艺' : (type === 'anime' ? '日本动画' : '热门');

    try {
        // 1. 切换 tab（更新全局状态 + 按钮样式）
        var movieToggle = document.getElementById('douban-movie-toggle');
        var tvToggle = document.getElementById('douban-tv-toggle');
        if (typeof doubanMovieTvCurrentSwitch !== 'undefined') {
            doubanMovieTvCurrentSwitch = targetTab;
        }
        if (movieToggle && tvToggle) {
            if (targetTab === 'movie') {
                movieToggle.classList.add('bg-pink-600', 'text-white');
                movieToggle.classList.remove('text-gray-300');
                tvToggle.classList.remove('bg-pink-600', 'text-white');
                tvToggle.classList.add('text-gray-300');
            } else {
                tvToggle.classList.add('bg-pink-600', 'text-white');
                tvToggle.classList.remove('text-gray-300');
                movieToggle.classList.remove('bg-pink-600', 'text-white');
                movieToggle.classList.add('text-gray-300');
            }
        }
        // 2. 设置标签并加载
        if (typeof doubanCurrentTag !== 'undefined') doubanCurrentTag = targetTag;
        if (typeof doubanPageStart !== 'undefined') doubanPageStart = 0;
        if (typeof renderDoubanTags === 'function') renderDoubanTags();
        if (typeof renderRecommend === 'function' && typeof doubanPageSize !== 'undefined') {
            // 只有豆瓣启用时才加载
            try {
                if (localStorage.getItem('doubanEnabled') === 'true') {
                    renderRecommend(targetTag, doubanPageSize, 0);
                }
            } catch (e) { renderRecommend(targetTag, doubanPageSize, 0); }
        }
        if (typeof setupDoubanRefreshBtn === 'function') setupDoubanRefreshBtn();
    } catch (e) {
        // 降级：模拟点击 toggle
        var toggleBtn = document.getElementById(wantTv ? 'douban-tv-toggle' : 'douban-movie-toggle');
        if (toggleBtn) toggleBtn.click();
    }

    // 滚到豆瓣区
    setTimeout(function () {
        if (doubanArea) doubanArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
};

// 点击页面空白处关闭移动端侧边栏
document.addEventListener('click', function (e) {
    if (window.innerWidth > 768) return;
    var sidebar = document.getElementById('ytSidebar');
    if (!sidebar || !sidebar.classList.contains('open')) return;
    if (!sidebar.contains(e.target) && !e.target.closest('[onclick*="toggleSidebar"]')) {
        sidebar.classList.remove('open');
    }
});
