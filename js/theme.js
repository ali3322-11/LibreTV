// LibreTV 主题切换（影院/浅色），偏好存 localStorage，默认影院
(function () {
    var KEY = 'libretv-theme';
    function getTheme() {
        try {
            var t = localStorage.getItem(KEY);
            // 迁移：老用户存的 dark 一律转为 cinema
            if (!t || t === 'dark') return 'cinema';
            return t;
        } catch (e) { return 'cinema'; }
    }
    function applyIcon() {
        var isCinema = getTheme() === 'cinema';
        document.querySelectorAll('.icon-sun').forEach(function (el) { el.style.display = isCinema ? 'block' : 'none'; });
        document.querySelectorAll('.icon-moon').forEach(function (el) { el.style.display = isCinema ? 'none' : 'block'; });
    }
    window.toggleTheme = function () {
        var next = getTheme() === 'cinema' ? 'light' : 'cinema';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem(KEY, next); } catch (e) {}
        applyIcon();
    };
    // DOM 就绪后校准图标（head 内联脚本已提前设置好主题，避免闪烁）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyIcon);
    } else {
        applyIcon();
    }
})();
