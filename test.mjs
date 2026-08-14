// dsh-balance-float 回归测试：node test.mjs
// 覆盖：宿主路由注册 + 余额查询（fetch 桩，离线可跑）+ 退出路由守卫（GET 405 / POST 200）；
//       客户端 jsdom 渲染 + 一键弹窗 + Y/N/Esc 快捷键交互。
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'

const localReq = createRequire(import.meta.url)
let JSDOM
try {
  JSDOM = localReq('jsdom').JSDOM // npm i -D jsdom 后可用
} catch {
  JSDOM = createRequire('D:\\deepseek-harness\\package.json')('jsdom').JSDOM // 本地开发机回退
}

let failures = 0
const check = (label, ok, extra) => {
  console.log((ok ? '✅' : '❌') + ' ' + label + (extra ? ' | ' + extra : ''))
  if (!ok) failures++
}

// ── 宿主 ──
const realFetch = globalThis.fetch
globalThis.fetch = async () => ({
  ok: true,
  json: async () => ({
    is_available: true,
    balance_infos: [{ currency: 'CNY', total_balance: '9.98', granted_balance: '0.00', topped_up_balance: '9.98' }],
  }),
})

const hostMod = await import(pathToFileURL(fileURLToPath(new URL('./lib/index.js', import.meta.url))).href + '?t=' + Date.now())
const routes = []
const fakeCtx = { inject: (_deps, cb) => cb({ webServer: { register: (r) => { routes.push(r); return () => {} } }, effect: (fn) => { fn(); return () => {}; } }) }
hostMod.apply(fakeCtx)
check('宿主注册两条路由', routes.length === 2, routes.map(r => r.path).join(', '))

let status = 0, body = ''
await routes.find(r => r.path === '/api/dsh-balance').handler({ method: 'GET' }, { writeHead: (s) => { status = s }, end: (b) => { body = b } })
check('余额路由返回 200 且 ok', status === 200 && JSON.parse(body).ok === true, body.slice(0, 80))
check('余额响应不含 API Key', !/sk-[A-Za-z0-9]|api_key|Bearer/i.test(body))

let exitStatus = 0
await routes.find(r => r.path === '/api/dsh-exit').handler({ method: 'GET' }, { writeHead: (s) => { exitStatus = s }, end: () => {} })
check('退出路由 GET 返回 405（守卫）', exitStatus === 405)

const exitStub = process.exit
process.kill = () => {} // 桩掉自杀调用，防止误杀测试进程（退出路由有 150ms 延迟 SIGINT）
process.exit = () => {}
let postStatus = 0, postBody = ''
await routes.find(r => r.path === '/api/dsh-exit').handler({ method: 'POST' }, { writeHead: (s) => { postStatus = s }, end: (b) => { postBody = b } })
check('退出路由 POST 返回 200 ok', postStatus === 200 && JSON.parse(postBody).ok === true)

globalThis.fetch = realFetch

// ── 客户端（jsdom 实际运行） ──
const dom = new JSDOM('<html><head></head><body></body></html>', { runScripts: 'outside-only', url: 'http://127.0.0.1:3080/' })
const w = dom.window
const registered = {}
w.__ModuleLoader__ = { load: (o) => { registered[o.id] = o } }
const fetchCalls = []
w.fetch = (url, opts) => {
  fetchCalls.push(String(url))
  if (String(url).includes('dsh-exit')) return Promise.resolve({ ok: true })
  return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true, at: Date.now(), balance_infos: [{ currency: 'CNY', total_balance: '9.98', granted_balance: '0.00', topped_up_balance: '9.98' }] }) })
}
w.eval(readFileSync(new URL('./client/client.js', import.meta.url), 'utf8'))
const exp = registered['@dsh-external/dsh-balance-float'].factory(() => {})
check('客户端 apply 导出', typeof exp.apply === 'function')

const fx = []
exp.apply({ effect: (fn) => { const d = fn(); fx.push(d); return () => {} } })
const widget = w.document.querySelector('[data-balance-float]')
check('悬浮窗渲染', !!widget)
check('电源键存在', !!widget?.querySelector('.bf-power'))

await new Promise(res => setTimeout(res, 80))
check('余额文本正确', w.document.querySelector('.bf-val')?.textContent === '余额 ¥9.98', w.document.querySelector('.bf-val')?.textContent)

const power = widget.querySelector('.bf-power')
const click = (el) => el.dispatchEvent(new w.MouseEvent('click', { bubbles: true }))
const key = (k) => w.dispatchEvent(new w.KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
click(power)
const exitPop = w.document.querySelector('.bf-exit-pop')
check('一击弹出确认框', !!exitPop, exitPop && exitPop.querySelector('.bf-exit-title').textContent)
check('确认框含 Y/N 按钮', !!exitPop?.querySelector('.bf-exit-yes') && !!exitPop?.querySelector('.bf-exit-no'))
key('n')
check('按 N 取消弹窗', !w.document.querySelector('.bf-exit-pop'))
check('取消未发退出请求', !fetchCalls.some(u => u.includes('dsh-exit')))
click(power)
check('再击可重新弹出', !!w.document.querySelector('.bf-exit-pop'))
key('Escape')
check('按 Esc 取消弹窗', !w.document.querySelector('.bf-exit-pop'))
w.close = () => {} // 真实浏览器对非脚本打开的标签页是静默无效；jsdom 会销毁 DOM，故打桩
click(power)
key('y')
check('按 Y 发送退出请求', fetchCalls.some(u => u.includes('dsh-exit')))
check('退出后弹窗消失', !w.document.querySelector('.bf-exit-pop'))

fx.forEach(d => typeof d === 'function' && d())
check('卸载后移除悬浮窗', !w.document.querySelector('[data-balance-float]'))
dom.window.close()

console.log(failures === 0 ? '\n✅ 全部通过' : '\n❌ 有 ' + failures + ' 项失败')
process.exit = exitStub // 恢复 exit（kill 保持桩状态即可，退出路由的延迟 SIGINT 不应作用于测试进程）
process.exit(failures === 0 ? 0 : 1)
