/**
 * Cliente da API oficial do WhatsApp (Meta Cloud API, via BSP — server-only).
 *
 * Credenciais vêm de env (nunca do client):
 *   WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID — obrigatórias pra enviar.
 *   WHATSAPP_APP_SECRET — obrigatória pra validar assinatura do webhook.
 *   WHATSAPP_VERIFY_TOKEN — usada só no handshake GET de verificação do webhook.
 *
 * Sem BSP contratado ainda (ver checklist do plano) — `whatsappConfigurado()`
 * retorna false até esses envs existirem. `enviarTemplateWhatsApp` não lança
 * nesse caso, só devolve `{ ok: false, motivo: 'nao_configurado' }` — quem
 * chama (a régua de cobrança) já trata isso como "loga a tentativa, não
 * quebra o fluxo", mesmo espírito do modo mock do webhook da ValidaPay.
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const GRAPH_VERSION = 'v20.0'

export function whatsappConfigurado(): boolean {
  return !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)
}

export interface EnviarTemplateResult {
  ok: boolean
  messageId?: string
  motivo?: 'nao_configurado' | 'telefone_invalido' | 'erro_envio'
  erro?: string
}

/**
 * Envia uma mensagem de template aprovado (categoria Utilidade) pro número
 * informado. `parametros` preenche as variáveis posicionais {{1}}, {{2}}...
 * do corpo do template, na ordem.
 */
export async function enviarTemplateWhatsApp(
  telefone: string,
  template: string,
  parametros: string[] = [],
): Promise<EnviarTemplateResult> {
  if (!whatsappConfigurado()) {
    return { ok: false, motivo: 'nao_configurado' }
  }

  // E.164 sem o "+": só dígitos, com DDI. Assume BR (55) se vier sem DDI.
  const digitos = telefone.replace(/\D/g, '')
  const numero = digitos.length === 11 || digitos.length === 10 ? `55${digitos}` : digitos
  if (numero.length < 12) {
    return { ok: false, motivo: 'telefone_invalido' }
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const token = process.env.WHATSAPP_ACCESS_TOKEN

  try {
    const resp = await $fetch<{ messages?: { id: string }[] }>(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: {
          messaging_product: 'whatsapp',
          to: numero,
          type: 'template',
          template: {
            name: template,
            language: { code: 'pt_BR' },
            ...(parametros.length > 0
              ? { components: [{ type: 'body', parameters: parametros.map((texto) => ({ type: 'text', text: texto })) }] }
              : {}),
          },
        },
      },
    )
    const messageId = resp?.messages?.[0]?.id
    if (!messageId) return { ok: false, motivo: 'erro_envio', erro: 'Resposta sem message id' }
    return { ok: true, messageId }
  } catch (err: any) {
    const msg = err?.data?.error?.message || err?.message || String(err)
    return { ok: false, motivo: 'erro_envio', erro: msg }
  }
}
