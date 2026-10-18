// LibreTV 主题切换（浅色/深色），偏好存 localStorage，默认浅色
(function () {
    var KEY = 'libretv-theme';
    function getTheme() {
        try { return localStorage.getItem(KEY) || 'light'; } catch (e) { return 'light'; }
    }
    function applyIcon() {
        var isLight = getTheme() === 'light';
        document.querySelectorAll('.icon-sun').forEach(function (el) { el.style.display = isLight ? 'none' : 'block'; });
        document.querySelectorAll('.icon-moon').forEach(function (el) { el.style.display = isLight ? 'block' : 'none'; });
    }
    window.toggleTheme = function () {
        var next = getTheme() === 'light' ? 'dark' : 'light';
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
