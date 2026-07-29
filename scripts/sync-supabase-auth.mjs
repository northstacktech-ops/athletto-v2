/**
 * Sincroniza redirect URLs do GoTrue via Supabase Management API.
 * O plugin MCP do Cursor não expõe PATCH /config/auth; este script substitui essa necessidade.
 *
 * Pré-requisitos no .env (raiz do athletto-web):
 *   SUPABASE_ACCESS_TOKEN=sbp_...   (PAT em https://supabase.com/dashboard/account/tokens)
 *   SUPABASE_URL ou SUPABASE_PROJECT_REF (ref = subdomínio antes de .supabase.co)
 *
 * Uso: npm run supabase:sync-auth
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadDotenv() {
  const p = join(root, '.env')
  if (!existsSync(p)) return
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const k = t.slice(0, eq).trim()
    let v = t.slice(eq + 1).trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1)
    if (process.env[k] === undefined) process.env[k] = v
  }
}

function projectRefFromUrl(url) {
  if (!url) return null
  try {
    const h = new URL(url).hostname
    const m = h.match(/^([^.]+)\.supabase\.co$/i)
    return m ? m[1] : null
  } catch {
    return null
  }
}

function uniqJoin(urls) {
  return [...new Set(urls.map((u) => u.trim()).filter(Boolean))].join(',')
}

loadDotenv()

const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_MANAGEMENT_ACCESS_TOKEN
const ref =
  process.env.SUPABASE_PROJECT_REF ||
  projectRefFromUrl(process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL)

if (!token || !ref) {
  if (!token) {
    console.error('Falta SUPABASE_ACCESS_TOKEN no .env (PAT em https://supabase.com/dashboard/account/tokens)')
  }
  if (!ref) {
    console.error('Falta SUPABASE_URL (ou SUPABASE_PROJECT_REF) no .env')
  }
  process.exit(1)
}

/** URLs sempre necessárias para o dev local (Nuxt em 4000). */
const REQUIRED = [
  'http://localhost:4000',
  'http://localhost:4000/**',
  'http://127.0.0.1:4000',
  'http://127.0.0.1:4000/**',
]

const base = 'https://api.supabase.com/v1'
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

const getRes = await fetch(`${base}/projects/${ref}/config/auth`, { headers })
if (!getRes.ok) {
  console.error('GET config/auth:', getRes.status, await getRes.text())
  process.exit(1)
}
const current = await getRes.json()
const existing = (current.uri_allow_list || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const merged = uniqJoin([...existing, ...REQUIRED])

const body = { uri_allow_list: merged }

/** Opcional: definir site padrão (ex.: produção). Só envia se existir no .env. */
const siteUrl = process.env.SUPABASE_AUTH_SITE_URL
if (siteUrl) body.site_url = siteUrl

const patchRes = await fetch(`${base}/projects/${ref}/config/auth`, {
  method: 'PATCH',
  headers,
  body: JSON.stringify(body),
})

if (!patchRes.ok) {
  console.error('PATCH config/auth:', patchRes.status, await patchRes.text())
  process.exit(1)
}

const out = await patchRes.json()
console.log('Auth sincronizado com sucesso.')
console.log('  site_url:      ', out.site_url ?? current.site_url ?? '(inalterado)')
const listStr = String(out.uri_allow_list || merged)
console.log('  uri_allow_list:', listStr.length > 220 ? `${listStr.slice(0, 220)}…` : listStr)
