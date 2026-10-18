
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

    // 确保豆瓣区可见
    var doubanArea = document.getElementById('doubanArea');
    if (doubanArea) doubanArea.classList.remove('hidden');

    // 切换电影/电视剧 tab
    var wantTv = (type === 'tv' || type === 'variety');
    var toggleBtn = document.getElementById(wantTv ? 'douban-tv-toggle' : 'douban-movie-toggle');
    if (toggleBtn) toggleBtn.click();

    // 综艺/动漫：尝试点对应标签
    var tagName = type === 'variety' ? '综艺' : (type === 'anime' ? '动漫' : null);
    if (tagName) {
        setTimeout(function () {
            var tags = document.querySelectorAll('#douban-tags button');
            for (var i = 0; i < tags.length; i++) {
                if (tags[i].textContent.trim() === tagName) { tags[i].click(); break; }
            }
        }, 350);
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
