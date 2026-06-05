import type {
  AbacatePixPayment,
  AbacateCreatePixRequest,
} from '~/types/abacatepay'

/**
 * Cliente AbacatePay — só roda no SERVER (Edge Function ou /server/api/*).
 * NÃO chamar do client: a API key fica em variável de ambiente protegida.
 *
 * No client, usar o composable `useCobranca` (que vai apontar para
 * /server/api/cobrancas/* via $fetch).
 *
 * Em modo mock ou sem credenciais, retorna stubs determinísticos para
 * permitir testar o fluxo de UI sem chamar AbacatePay real.
 */
export function useAbacatePay() {
  const config = useRuntimeConfig()
  const apiUrl = config.abacatepayApiUrl as string | undefined
  const apiKey = config.abacatepayApiKey as string | undefined
  const ambiente = (config.abacatepayEnv as string | undefined) ?? 'sandbox'

  const configurado = !!(apiUrl && apiKey)

  async function criarPix(req: AbacateCreatePixRequest): Promise<AbacatePixPayment> {
    if (!configurado) {
      return stubPix(req)
    }
    return await $fetch<AbacatePixPayment>(`${apiUrl}/pixQrCode/create`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: req,
    })
  }

  async function consultarPix(id: string): Promise<AbacatePixPayment> {
    if (!configurado) {
      return stubPix({ amount: 0, description: '', customer: { name: '' } })
    }
    return await $fetch<AbacatePixPayment>(`${apiUrl}/pixQrCode/check`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${apiKey}` },
      params: { id },
    })
  }

  async function cancelarPix(id: string): Promise<{ id: string; status: string }> {
    if (!configurado) {
      return { id, status: 'cancelled' }
    }
    return await $fetch(`${apiUrl}/pixQrCode/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: { id },
    })
  }

  return {
    configurado,
    ambiente,
    criarPix,
    consultarPix,
    cancelarPix,
  }
}

// ── Stubs para dev sem credenciais ─────────────────────────────────────────────

function stubPix(req: AbacateCreatePixRequest): AbacatePixPayment {
  const now = new Date()
  const id = `pay_stub_${now.getTime()}`
  return {
    id,
    status: 'pending',
    amount: req.amount,
    description: req.description ?? null,
    customer: {
      name: req.customer.name,
      cellphone: req.customer.cellphone ?? null,
      email: req.customer.email ?? null,
      tax_id: req.customer.tax_id ?? null,
    },
    pix_qr_code: '00020126...stub',
    pix_qr_code_url: 'https://placehold.co/300x300/png?text=Pix+QR',
    pix_copy_paste: '00020126360014BR.GOV.BCB.PIX...STUB',
    expires_at: new Date(now.getTime() + (req.expires_in ?? 3600) * 1000).toISOString(),
    paid_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    metadata: req.metadata ?? {},
  }
}
