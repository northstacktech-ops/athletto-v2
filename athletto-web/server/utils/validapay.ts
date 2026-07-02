/**
 * Cliente da API ValidaPay (server-only).
 *
 * Modelo Athletto: cada CLUBE é uma SUBCONTA (Seller) da conta Master da
 * Athletto. Mensalidades são cobradas na subconta do clube (o clube recebe
 * direto), sem split/taxa. A conta Master só orquestra (criar subconta + gerar
 * cobrança via API).
 *
 * Auth: OAuth2 client_credentials (host separado oauth2(-sandbox)).
 * Credenciais vêm de env (nunca do client):
 *   VALIDAPAY_CLIENT_ID, VALIDAPAY_CLIENT_SECRET, VALIDAPAY_ENV ('sandbox'|'production')
 *
 * Docs: https://docs.validapay.com.br
 */

const SCOPES_PADRAO =
  'pix.cob/write pix.cob/read proposals/write proposals/read subaccounts/read wallet/read wallet/write'

function ambiente() {
  return (process.env.VALIDAPAY_ENV ?? 'sandbox').toLowerCase() === 'production'
    ? 'production'
    : 'sandbox'
}

function urls() {
  return ambiente() === 'production'
    ? { oauth: 'https://oauth2.validapay.com.br', api: 'https://api.validapay.com.br' }
    : { oauth: 'https://oauth2-sandbox.validapay.com.br', api: 'https://sandbox.validapay.com.br' }
}

export function validapayConfigurada(): boolean {
  return !!(process.env.VALIDAPAY_CLIENT_ID && process.env.VALIDAPAY_CLIENT_SECRET)
}

// ── Token (cache em memória por expiração) ───────────────────────────────────
let tokenCache: { token: string; exp: number } | null = null

async function getToken(): Promise<string> {
  const agora = Date.now()
  if (tokenCache && tokenCache.exp - 60_000 > agora) return tokenCache.token

  const clientId = process.env.VALIDAPAY_CLIENT_ID
  const clientSecret = process.env.VALIDAPAY_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('ValidaPay sem credenciais (VALIDAPAY_CLIENT_ID/SECRET).')

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: SCOPES_PADRAO,
  })

  const resp = await $fetch<{ access_token: string; expires_in: number }>(
    `${urls().oauth}/auth/token`,
    { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString() },
  )
  tokenCache = { token: resp.access_token, exp: agora + (resp.expires_in ?? 3600) * 1000 }
  return tokenCache.token
}

// ── Request helper ───────────────────────────────────────────────────────────
async function vp<T>(
  path: string,
  opts: { method?: 'GET' | 'POST'; body?: any; accountId?: string } = {},
): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
  // accountId direciona a operação para a SUBCONTA do clube (ex.: gerar
  // cobrança na conta do clube, consultar saldo/extrato dela).
  if (opts.accountId) headers.accountId = opts.accountId

  return await $fetch<T>(`${urls().api}${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body,
  })
}

// ── Subcontas (cada clube vira uma) ──────────────────────────────────────────
export interface SubcontaPF {
  documentNumber: string
  phoneNumber: string
  email: string
  motherName: string
  fullName: string
  socialName?: string
  birthDate: string // DD-MM-YYYY
  address: { postalCode: string; street: string; number: string; addressComplement?: string; neighborhood: string; city: string; state: string }
  isPoliticallyExposedPerson: boolean
  financialDetails: { declaredIncome: number; occupation: string; netWorth: number }
  webhookUrl?: string
}

export interface SubcontaPJOwner {
  ownerType: string // ex.: 'SOCIO'
  documentNumber: string
  fullName: string
  phoneNumber: string // E.164
  email: string
  motherName: string
  birthDate: string // DD-MM-YYYY (owners usam este formato)
  isPoliticallyExposedPerson: boolean
  address: SubcontaPF['address']
  financialOwnerDetails: { ownerDeclaredIncome: string | number; ownerDeclaredRevenue: string | number }
}

export interface SubcontaPJ {
  documentNumber: string // CNPJ
  businessName: string
  tradingName?: string
  businessEmail: string
  contactNumber: string // E.164: +55XXXXXXXXXX
  companyType: 'PJ'
  businessAddress: SubcontaPF['address']
  financialCompanyDetails: { declaredCompanyRevenue: string | number }
  owner?: SubcontaPJOwner[]
  webhookUrl?: string
}

export async function criarSubcontaPF(dados: SubcontaPF) {
  return vp<{ status: string; message: string; formId: string }>('/v1/proposals', { method: 'POST', body: dados })
}

export async function criarSubcontaPJ(dados: SubcontaPJ) {
  return vp<{ status: string; message: string; formId: string }>('/v1/proposals', { method: 'POST', body: dados })
}

export async function statusSubconta(formId: string) {
  return vp<any>(`/v1/proposals/${formId}`)
}

export async function listarSubcontas() {
  return vp<any>('/v1/accounts/subaccounts')
}

export async function saldoSubconta(accountIds: string) {
  // accountIds: um ou vários separados por vírgula (header accountId).
  return vp<any>('/v1/wallet/balance', { accountId: accountIds })
}

export async function extratoSubconta(accountId: string, pagina = 1) {
  return vp<any>(`/v1/wallet/statement?page=${pagina}&limit=20`, { accountId })
}

export interface SaqueDados {
  amount: number
  pixKey?: string
  bankCode?: string
  agency?: string
  accountNumber?: string
  accountType?: string
  description?: string
}

export async function solicitarSaque(accountId: string, dados: SaqueDados) {
  return vp<any>('/v1/wallet/withdrawals', { method: 'POST', body: dados, accountId })
}

// ── Split ────────────────────────────────────────────────────────────────────
// Divisão do pagamento entre contas (doc: campo `split[]` dentro da cobrança).
// `type` = 'percentage' (amount = % ex.: 5 = 5%) ou 'fixed' (amount em centavos).
export interface SplitItem {
  type: 'percentage' | 'fixed'
  accountNumber: string
  amount: number
}

// ── Cobrança Pix ─────────────────────────────────────────────────────────────
// Endpoint real: POST /v1/charges com paymentMethod 'pix' (a doc descreve
// `paymentMethod`, `amount`, `title`, `description`, `customer`, `split[]`).
// Sem accountId → cobra na conta Master. Com accountId → cobra na SUBCONTA do
// clube. `split` opcional divide o valor (ex.: taxa Athletto).
//
// ⚠️ Os nomes dos campos de RESPOSTA do Pix (id da charge, EMV copia-e-cola,
// QR base64) não constam na doc pública — confirmar na Collection Postman /
// no 1º teste sandbox. Por isso o parsing abaixo é defensivo.
export interface CobrancaPixInput {
  amount: number
  accountId?: string
  title?: string
  description?: string
  // customer é OBRIGATÓRIO na ValidaPay. documentNumber (CPF/CNPJ) e email também são obrigatórios.
  customer?: { name?: string; documentNumber?: string; email?: string; cellphone?: string }
  split?: SplitItem[]
}

export interface CobrancaPixResult {
  chargeId: string
  emv: string
  qrCodeBase64?: string
  raw: any
}

export async function criarCobrancaPix(input: CobrancaPixInput): Promise<CobrancaPixResult> {
  const { accountId, customer, ...rest } = input
  // ValidaPay exige customer com name, documentNumber (CPF/CNPJ) e email obrigatórios.
  const customerFinal = {
    name: customer?.name || 'Cliente',
    documentNumber: customer?.documentNumber || '00000000000',
    email: customer?.email || 'financeiro@athletto.com.br',
    ...(customer?.cellphone ? { phone: customer.cellphone } : {}),
  }
  const body: Record<string, any> = { paymentMethod: 'pix', customer: customerFinal, ...rest }
  // remove chaves undefined para não enviar lixo
  Object.keys(body).forEach((k) => body[k] === undefined && delete body[k])

  const resp = await vp<any>('/v1/charges', { method: 'POST', body, accountId })

  // Parsing defensivo (travar nomes exatos no teste sandbox):
  const chargeId =
    resp?.id ?? resp?.chargeId ?? resp?.charge?.id ?? resp?.data?.id ?? ''
  const emv =
    resp?.pix?.emv ?? resp?.emv ?? resp?.brCode ?? resp?.pix?.brCode ??
    resp?.qrCode?.emv ?? resp?.payload ?? ''
  // qrCode é data URI completo ("data:image/png;base64,...") — adicionar antes dos fallbacks
  const qrCodeBase64 =
    resp?.qrCode ?? resp?.pix?.qrCodeBase64 ?? resp?.qrCodeBase64 ?? resp?.qrCode?.base64 ?? undefined

  return { chargeId, emv, qrCodeBase64, raw: resp }
}

export async function statusCobranca(chargeId: string, accountId?: string) {
  return vp<any>(`/v1/charges/${chargeId}`, { accountId })
}

// ── Webhook (registro via API) ───────────────────────────────────────────────
// Doc: POST /v1/users/webhooks { url, events?, authToken? }. `authToken` é o
// jeito nativo de autenticar o webhook (melhor que segredo na query string).
export async function registrarWebhook(url: string, events?: string[], authToken?: string) {
  return vp<any>('/v1/users/webhooks', { method: 'POST', body: { url, events, authToken } })
}

export async function listarWebhooks() {
  return vp<any>('/v1/users/webhooks')
}

// Sandbox: dispara um evento de teste de webhook (POST /v1/users/webhooks/test).
// `entity` = tipo do evento (ex.: 'payment.success').
export async function testarWebhook(params: { webhookId?: string; url?: string; entity: string }) {
  if (ambiente() === 'production') throw new Error('testarWebhook só faz sentido em sandbox.')
  return vp<any>('/v1/users/webhooks/test', { method: 'POST', body: params })
}
