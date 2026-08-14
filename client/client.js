/* dsh-balance-float client half (hand-authored bundle). */
window.__ModuleLoader__.load({ id: 'dsh-balance-float', factory: (require) => {
  var module = { exports: {} };
  var exports = module.exports;
  (function (exports, module) {
    'use strict';

    exports.name = 'dsh-balance-float';
    exports.inject = [];

    var CSS = [
      "[data-balance-float]{position:fixed;top:12px;right:16px;z-index:2147483000;",
      "display:flex;align-items:center;gap:8px;padding:7px 12px;border-radius:999px;",
      "background:rgba(18,28,52,.78);border:1px solid rgba(140,190,245,.35);",
      "box-shadow:0 4px 16px rgba(10,20,40,.30), inset 0 1px 0 rgba(255,255,255,.14);",
      "backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);",
      "color:#EAF1FC;font-size:12px;line-height:16px;font-family:inherit;",
      "cursor:pointer;user-select:none;transition:box-shadow .2s ease;}",
      "[data-balance-float]:hover{box-shadow:0 4px 20px rgba(10,20,40,.4),0 0 10px rgba(140,190,245,.4),inset 0 1px 0 rgba(255,255,255,.2);}",
      "[data-balance-float] .bf-dot{width:8px;height:8px;border-radius:50%;background:#5BE3A0;box-shadow:0 0 8px rgba(91,227,160,.8);flex:none;}",
      "[data-balance-float] .bf-dot.bf-err{background:#F08AA5;box-shadow:0 0 8px rgba(240,138,165,.8);}",
      "[data-balance-float] .bf-val{font-weight:600;letter-spacing:.02em;white-space:nowrap;}",
      "[data-balance-float] .bf-btn{flex:none;width:18px;height:18px;border:none;border-radius:50%;",
      "background:rgba(255,255,255,.12);color:#B9CFF2;font-size:11px;line-height:18px;text-align:center;",
      "cursor:pointer;padding:0;}",
      "[data-balance-float] .bf-btn:hover{background:rgba(255,255,255,.25);color:#fff;}",
      "[data-balance-float] .bf-power.bf-active{background:rgba(224,80,90,.85);color:#fff;box-shadow:0 0 10px rgba(224,80,90,.6);}",
      ".bf-exit-pop{position:fixed;top:60px;right:16px;z-index:2147483001;width:250px;padding:14px 16px;border-radius:14px;",
      "background:rgba(18,28,52,.96);border:1px solid rgba(240,138,165,.55);box-shadow:0 12px 32px rgba(10,20,40,.5),0 0 18px rgba(224,80,90,.25);",
      "color:#EAF1FC;font-size:13px;line-height:19px;user-select:none;}",
      ".bf-exit-pop .bf-exit-title{font-weight:700;color:#FFD9E0;margin-bottom:6px;}",
      ".bf-exit-pop .bf-exit-desc{color:#B9CFF2;}",
      ".bf-exit-pop .bf-exit-actions{display:flex;gap:8px;margin-top:12px;}",
      ".bf-exit-pop .bf-exit-actions button{flex:1;border:none;border-radius:8px;padding:7px 0;font-size:12px;cursor:pointer;font-family:inherit;}",
      ".bf-exit-pop .bf-exit-yes{background:rgba(224,80,90,.9);color:#fff;}",
      ".bf-exit-pop .bf-exit-yes:hover{background:#F0646F;}",
      ".bf-exit-pop .bf-exit-no{background:rgba(255,255,255,.14);color:#C7D6F0;}",
      ".bf-exit-pop .bf-exit-no:hover{background:rgba(255,255,255,.25);}",
      ".bf-exit-pop .bf-exit-hint{display:block;margin-top:10px;color:#8FA8D8;font-size:11px;}",
      ".bf-exit-overlay{position:fixed;inset:0;z-index:2147483002;background:rgba(8,12,24,.92);display:flex;align-items:center;",
      "justify-content:center;color:#EAF1FC;font-size:15px;letter-spacing:.02em;}",
      "[data-balance-float] .bf-pop{display:none;position:absolute;top:calc(100% + 8px);right:0;",
      "padding:10px 14px;border-radius:12px;background:rgba(18,28,52,.92);border:1px solid rgba(140,190,245,.35);",
      "box-shadow:0 8px 24px rgba(10,20,40,.4);color:#C7D6F0;font-size:12px;line-height:20px;white-space:nowrap;}",
      "[data-balance-float].bf-open .bf-pop{display:block;}",
"@media (max-width: 700px) {",
"  /* 手机窄屏：下移到会话头部工具栏下方，避免与右上角按钮重叠 */",
"  [data-balance-float]{top:60px;right:10px;padding:5px 10px;gap:6px;font-size:11px;}",
"  [data-balance-float] .bf-btn{width:16px;height:16px;font-size:10px;line-height:16px;}",
"  .bf-exit-pop{top:100px;right:10px;}",
"}",
    ].join('');

    var POLL_MS = 60 * 1000;

    exports.apply = function (ctx) {
      try {
        if (!document || !document.body || document.querySelector('[data-balance-float]')) return;

        var style = document.createElement('style');
        style.textContent = CSS;
        document.head.appendChild(style);

        var host = document.createElement('div');
        host.setAttribute('data-balance-float', '');
        host.innerHTML =
          '<span class="bf-dot"></span>' +
          '<span class="bf-val">余额 —</span>' +
          '<button class="bf-btn" type="button" title="刷新">↻</button>' +
          '<button class="bf-btn bf-power" type="button" title="退出">⏻</button>' +
          '<div class="bf-pop"><div class="bf-line">—</div><div class="bf-line">—</div><div class="bf-line">—</div></div>';
        document.body.appendChild(host);

        var val = host.querySelector('.bf-val');
        var dot = host.querySelector('.bf-dot');
        var btn = host.querySelector('.bf-btn');
        var power = host.querySelector('.bf-power');
        var pop = host.querySelector('.bf-pop');
        var lines = pop ? pop.querySelectorAll('.bf-line') : [];

        var fmtTime = function (t) {
          var d = new Date(t);
          var p = function (n) { return (n < 10 ? '0' : '') + n; };
          return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
        };

        var refresh = function () {
          fetch('/api/dsh-balance', { headers: { Accept: 'application/json' } })
            .then(function (r) { return r.json(); })
            .then(function (j) {
              if (!val) return;
              if (!j || !j.ok) {
                val.textContent = '余额 获取失败';
                if (dot) dot.className = 'bf-dot bf-err';
                if (lines[0]) lines[0].textContent = (j && j.error) ? j.error : '未知错误';
                if (lines[1]) lines[1].textContent = '';
                if (lines[2]) lines[2].textContent = '';
                return;
              }
              var info = (j.balance_infos && j.balance_infos[0]) || {};
              val.textContent = '余额 ¥' + (info.total_balance || '—');
              if (dot) dot.className = 'bf-dot';
              if (lines[0]) lines[0].textContent = '总余额 ¥' + (info.total_balance || '—') + '  ' + (info.currency || '');
              if (lines[1]) lines[1].textContent = '赠送 ¥' + (info.granted_balance || '—') + ' · 充值 ¥' + (info.topped_up_balance || '—');
              if (lines[2]) lines[2].textContent = '更新于 ' + fmtTime(j.at || Date.now());
            })
            .catch(function (e) {
              if (!val) return;
              val.textContent = '余额 离线';
              if (dot) dot.className = 'bf-dot bf-err';
              if (lines[0]) lines[0].textContent = '网络错误';
              if (lines[1]) lines[1].textContent = String(e && e.message || e).slice(0, 60);
              if (lines[2]) lines[2].textContent = '';
            });
        };

        var exitPop = null;
        var exiting = false;

        var onHostClick = function (ev) {
          if (ev.target === btn) { ev.stopPropagation(); refresh(); return; }
          if (ev.target === power) { return; }
          host.classList.toggle('bf-open');
        };

        var hideExitPop = function () {
          if (exitPop) { exitPop.remove(); exitPop = null; }
          if (power) power.classList.remove('bf-active');
        };

        var doExit = function () {
          if (exiting) return;
          exiting = true;
          hideExitPop();
          var ov = document.createElement('div');
          ov.className = 'bf-exit-overlay';
          ov.innerHTML = '正在退出 DeepSeek Harness…';
          document.body.appendChild(ov);
          try { fetch('/api/dsh-exit', { method: 'POST' }).catch(function () {}); } catch (e) {}
          try { window.close(); } catch (e) {}
          setTimeout(function () {
            ov.innerHTML = '已发送退出指令。若此页面未自动关闭，请手动关闭标签页。';
          }, 1500);
        };

        var onExitKey = function (ev) {
          if (!exitPop || exiting) return;
          var k = ev && ev.key;
          if (k === 'y' || k === 'Y') {
            if (ev.preventDefault) ev.preventDefault();
            if (ev.stopPropagation) ev.stopPropagation();
            doExit();
          } else if (k === 'n' || k === 'N' || k === 'Escape') {
            if (ev.preventDefault) ev.preventDefault();
            if (ev.stopPropagation) ev.stopPropagation();
            hideExitPop();
          }
        };

        var showExitPop = function () {
          if (exitPop || exiting) return;
          exitPop = document.createElement('div');
          exitPop.className = 'bf-exit-pop';
          exitPop.innerHTML =
            '<div class="bf-exit-title">⏻ 退出 DeepSeek Harness？</div>' +
            '<div class="bf-exit-desc">将关闭本地服务与网页（127.0.0.1:3080）。</div>' +
            '<div class="bf-exit-actions">' +
            '<button type="button" class="bf-exit-yes">Y · 退出</button>' +
            '<button type="button" class="bf-exit-no">N · 取消</button>' +
            '</div>' +
            '<span class="bf-exit-hint">键盘：Y 确认 · N / Esc 取消</span>';
          document.body.appendChild(exitPop);
          exitPop.querySelector('.bf-exit-yes').addEventListener('click', function (ev) { ev.stopPropagation(); doExit(); });
          exitPop.querySelector('.bf-exit-no').addEventListener('click', function (ev) { ev.stopPropagation(); hideExitPop(); });
          if (power) power.classList.add('bf-active');
        };

        var onPower = function (ev) {
          ev.stopPropagation();
          if (exiting) return;
          if (exitPop) { hideExitPop(); return; }
          showExitPop();
        };

        host.addEventListener('click', onHostClick);
        btn.addEventListener('click', onHostClick);
        power.addEventListener('click', onPower);
        window.addEventListener('keydown', onExitKey, true);

        refresh();
        var timer = setInterval(refresh, POLL_MS);

        if (ctx && typeof ctx.effect === 'function') {
          ctx.effect(function () { return function () {
            clearInterval(timer);
            host.removeEventListener('click', onHostClick);
            btn.removeEventListener('click', onHostClick);
            power.removeEventListener('click', onPower);
            window.removeEventListener('keydown', onExitKey, true);
            hideExitPop();
            host.remove();
            style.remove();
          }; }, 'dsh-balance-float: widget');
        }
      } catch (err) {
        // Never crash the loader entry: log and degrade silently.
        if (typeof console !== 'undefined' && console.error) {
          console.error('[dsh-balance-float]', err);
        }
      }
    };
  })(module.exports, module);
  return module.exports;
}});
