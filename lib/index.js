/**
 * dsh-balance-float — host half.
 *
 * Registers two HTTP routes on the DSH web server:
 *   GET  /api/dsh-balance  → DeepSeek account balance (60s cache; never leaks the API key)
 *   POST /api/dsh-exit     → graceful shutdown of the dsh process (SIGINT, 6s hard-exit fallback)
 *
 * API key lookup order:
 *   1. DEEPSEEK_API_KEY env var
 *   2. $DSH_HOME/.credentials.yaml
 *   3. %USERPROFILE%/.dsh/.credentials.yaml (Windows)
 *   4. $HOME/.dsh/.credentials.yaml
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const name = 'dsh-balance-float'
export const inject = ['webServer']

const BALANCE_URL = 'https://api.deepseek.com/user/balance'
const TTL_MS = 60_000
let cache = null

function homeCandidates() {
  const list = []
  if (process.env.DSH_HOME) list.push(process.env.DSH_HOME)
  if (process.env.USERPROFILE) list.push(join(process.env.USERPROFILE, '.dsh'))
  if (process.env.HOME) list.push(join(process.env.HOME, '.dsh'))
  return list
}

function readApiKey() {
  if (process.env.DEEPSEEK_API_KEY) return process.env.DEEPSEEK_API_KEY
  for (const home of homeCandidates()) {
    try {
      const text = readFileSync(join(home, '.credentials.yaml'), 'utf8')
      const m = text.match(/^DEEPSEEK_API_KEY:\s*(.+)$/m)
      if (m) return m[1].trim()
    } catch {
      /* try next candidate */
    }
  }
  return ''
}

function registerExitRoute(hostCtx) {
  hostCtx.effect(() => hostCtx.webServer.register({
    kind: 'exact',
    path: '/api/dsh-exit',
    handler: (req, res) => {
      if (req.method !== 'POST') {
        res.writeHead(405)
        res.end()
        return
      }
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ ok: true }))
      // Let the response flush, then ask dsh to shut down gracefully.
      // Windows note: self-delivered SIGINT is unreliable outside a real console,
      // so a short hard-exit fallback guarantees the button always works.
      setTimeout(() => { try { process.kill(process.pid, 'SIGINT') } catch { /* ignore */ } }, 150)
      setTimeout(() => process.exit(0), 2000) // hard fallback if graceful shutdown stalls
    },
  }), 'dsh-balance-float: exit route')
}

function registerBalanceRoute(hostCtx) {
  hostCtx.effect(() => hostCtx.webServer.register({
    kind: 'exact',
    path: '/api/dsh-balance',
    handler: async (_req, res) => {
      const reply = (payload) => {
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(payload))
      }
      try {
        const now = Date.now()
        if (!cache || now - cache.at > TTL_MS) {
          const key = readApiKey()
          if (!key) throw new Error('DEEPSEEK_API_KEY not found in env or credentials')
          const r = await fetch(BALANCE_URL, { headers: { Authorization: 'Bearer ' + key } })
          if (!r.ok) throw new Error('balance http ' + r.status)
          const j = await r.json()
          cache = { at: now, data: j }
        }
        reply({ ok: true, at: cache.at, ...cache.data })
      } catch (e) {
        reply({ ok: false, error: String((e && e.message) || e), at: Date.now() })
      }
    },
  }), 'dsh-balance-float: balance route')
}

export function apply(ctx) {
  ctx.inject(['webServer'], (hostCtx) => {
    registerExitRoute(hostCtx)
    registerBalanceRoute(hostCtx)
  })
}
