/**
 * CinePop TV 遥控器导航
 * 方向键在可聚焦元素之间做空间导航，OK 确认，返回键后退。
 * 播放页（player.html）已有方向键功能（快进/音量），本脚本自动跳过。
 */
(function () {
    'use strict';

    // 播放页跳过：方向键已有用途（快进/快退/音量）
    if (/player\.html/.test(location.pathname)) return;

    var FOCUS_CLASS = 'tv-focused';
    var current = null;

    // 可聚焦选择器
    var SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), ' +
        'select:not([disabled]), textarea:not([disabled]), ' +
        '[tabindex]:not([tabindex="-1"]), .movie-card, .tv-card, .card';

    function isVisible(el) {
        var r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        var s = window.getComputedStyle(el);
        return s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
    }

    function getFocusables() {
        var list = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
        return list.filter(isVisible);
    }

    function center(el) {
        var r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2, el: el, rect: r };
    }

    // 空间导航：找指定方向上最近且对齐最好的元素
    function findNext(dir) {
        var items = getFocusables();
        if (!items.length) return null;
        if (!current || !document.contains(current)) {
            return items[0];
        }
        var c = center(current);
        var best = null, bestScore = Infinity;

        items.forEach(function (el) {
            if (el === current) return;
            var t = center(el);
            var dx = t.x - c.x, dy = t.y - c.y;
            var primary, secondary;

            if (dir === 'up') { if (dy >= -4) return; primary = -dy; secondary = Math.abs(dx); }
            else if (dir === 'down') { if (dy <= 4) return; primary = dy; secondary = Math.abs(dx); }
            else if (dir === 'left') { if (dx >= -4) return; primary = -dx; secondary = Math.abs(dy); }
            else { if (dx <= 4) return; primary = dx; secondary = Math.abs(dy); }

            // 评分：主轴距离 + 2.5 倍侧轴偏移（偏爱正对的元素）
            var score = primary + secondary * 2.5;
            if (score < bestScore) { bestScore = score; best = el; }
        });
        return best;
    }

    function setFocus(el) {
        if (current) current.classList.remove(FOCUS_CLASS);
        current = el;
        if (el) {
            el.classList.add(FOCUS_CLASS);
            try { el.focus({ preventScroll: true }); } catch (e) { try { el.focus(); } catch (_) {} }
            el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
    }

    // 初始焦点：搜到第一个可见可聚焦元素
    function initFocus() {
        if (current && document.contains(current)) return;
        var items = getFocusables();
        // 优先聚焦搜索框，其次第一个卡片
        var search = document.querySelector('#searchInput, input[type="search"], input[placeholder*="搜索"]');
        if (search && isVisible(search)) setFocus(search);
        else if (items.length) setFocus(items[0]);
    }

    document.addEventListener('keydown', function (e) {
        // 输入框里打字时：只处理返回键，其余放行
        var inInput = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
        if (inInput && e.key !== 'Escape' && e.key !== 'Backspace') return;

        var dir = null;
        if (e.key === 'ArrowUp') dir = 'up';
        else if (e.key === 'ArrowDown') dir = 'down';
        else if (e.key === 'ArrowLeft') dir = 'left';
        else if (e.key === 'ArrowRight') dir = 'right';

        if (dir) {
            e.preventDefault();
            initFocus();
            var next = findNext(dir);
            if (next) setFocus(next);
            return;
        }

        if (e.key === 'Enter' && current) {
            // OK 键：激活当前焦点
            e.preventDefault();
            current.click();
            return;
        }

        if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'BrowserBack' || e.keyCode === 461) {
            // 返回键：先关弹窗，否则后退
            var modal = document.querySelector('.modal.open, .modal.show, [id="detailModal"]:not(.hidden)');
            if (modal) { e.preventDefault(); modal.classList.add('hidden'); return; }
            if (!inInput) { e.preventDefault(); history.back(); }
        }
    });

    // 点击后同步焦点（鼠标/触屏操作不破坏遥控器状态）
    document.addEventListener('click', function (e) {
        var t = e.target.closest(SELECTOR);
        if (t && isVisible(t)) setFocus(t);
    }, true);

    // DOM 变化后修正焦点（搜索出结果、切分类等）
    var mo = new MutationObserver(function () {
        if (!current || !document.contains(current) || !isVisible(current)) {
            current = null;
        }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // 页面加载后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { setTimeout(initFocus, 500); });
    } else {
        setTimeout(initFocus, 500);
    }
})();
