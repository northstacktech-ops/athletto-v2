/**
 * Traduz erros crus de gateway de pagamento (ValidaPay) pra mensagens que um
 * gestor não-técnico entende — sem URL, sem "409 Conflict", sem stack trace.
 *
 * Erros vindos de `$fetch` (ofetch) sem corpo de resposta parseável caem no
 * formato genérico `[POST] "https://...": 409 Conflict`, que é exatamente o
 * que NÃO pode chegar no toast do usuário. Regra: só repassamos a mensagem
 * original quando ela parece um texto de validação de verdade (não bate com
 * o padrão `[MÉTODO] "url"`); todo o resto vira uma mensagem fixa por status.
 */

const PADRAO_OFETCH = /^\[[A-Z]+\]\s+"https?:\/\//i

function pareceMensagemDeValidacao(msg: unknown): msg is string {
  return typeof msg === 'string' && msg.trim().length > 0 && !PADRAO_OFETCH.test(msg)
}

const FALLBACK_POR_STATUS: Record<number, string> = {
  400: 'Alguns dados não foram aceitos. Revise o formulário e tente novamente.',
  401: 'Falha ao autenticar com o sistema de pagamentos. Nossa equipe já foi avisada.',
  403: 'Falha ao autenticar com o sistema de pagamentos. Nossa equipe já foi avisada.',
  404: 'Não encontramos esse registro no sistema de pagamentos.',
  409: 'Já existe uma solicitação em andamento para esses dados. Aguarde a conclusão antes de tentar de novo.',
  422: 'Alguns dados não foram aceitos pelo sistema de pagamentos. Revise e tente novamente.',
  429: 'Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.',
  500: 'O sistema de pagamentos teve um problema interno. Tente novamente em alguns minutos.',
  502: 'Não conseguimos falar com o sistema de pagamentos agora. Tente novamente em alguns minutos.',
  503: 'O sistema de pagamentos está indisponível no momento. Tente novamente em alguns minutos.',
  504: 'O sistema de pagamentos demorou demais pra responder. Tente novamente.',
}

/**
 * @param err erro capturado (de `$fetch`/ofetch ou genérico)
 * @param contextoFallback mensagem padrão quando nada específico se aplica
 */
export function mensagemErroGateway(err: any, contextoFallback: string): string {
  const status: number | undefined = err?.statusCode ?? err?.response?.status ?? err?.status
  const msgUpstream = err?.data?.message ?? err?.data?.error

  if (pareceMensagemDeValidacao(msgUpstream)) return msgUpstream

  if (status && FALLBACK_POR_STATUS[status]) return FALLBACK_POR_STATUS[status]

  // Sem status (rede caiu, DNS, timeout de conexão) — não é erro de negócio.
  if (!status) return 'Não conseguimos conectar ao sistema de pagamentos. Verifique sua internet e tente novamente.'

  return contextoFallback
}
