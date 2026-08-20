/**
 * Traduz erros crus de gateway de pagamento (ValidaPay) pra mensagens que um
 * gestor não-técnico entende — sem URL, sem "409 Conflict", sem stack trace,
 * sem jargão de infraestrutura (cabeçalho, hash, etc.).
 *
 * A 1ª versão disso tentava BLOQUEAR padrões técnicos conhecidos (ex.: o
 * formato genérico do ofetch `[POST] "https://...": 409`) e deixar passar
 * qualquer coisa que não batesse — mas isso vazou um erro real de
 * infraestrutura ("Invalid key=value pair... in Authorization header...")
 * porque ele não batia com o único padrão bloqueado. Lista de bloqueio nunca
 * cobre tudo. Agora é o oposto: LISTA DE PERMISSÃO — só repassamos a
 * mensagem original quando ela bate com o único padrão de validação real
 * que já vimos a ValidaPay devolver ("O campo X é obrigatório..."). Tudo
 * que não bate vira mensagem fixa por status, por padrão.
 */

function pareceMensagemDeValidacao(msg: unknown): msg is string {
  return typeof msg === 'string' && /^o campo\b/i.test(msg.trim())
}

// Só os status abaixo têm uma mensagem universal boa o bastante pra valer em
// qualquer tela (fila/limite/indisponibilidade). Os demais (400, 401, 403,
// 404, 422, 500...) variam demais por contexto — usar "revise o formulário"
// numa tela de extrato/consulta, que não tem formulário nenhum, seria tão
// confuso quanto o erro cru. Nesses casos vale mais a mensagem específica
// que cada chamador já passa em `contextoFallback`.
const FALLBACK_UNIVERSAL_POR_STATUS: Record<number, string> = {
  409: 'Já existe uma solicitação em andamento para esses dados. Aguarde a conclusão antes de tentar de novo.',
  429: 'Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.',
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

  if (status && FALLBACK_UNIVERSAL_POR_STATUS[status]) return FALLBACK_UNIVERSAL_POR_STATUS[status]

  // Sem status (rede caiu, DNS, timeout de conexão) — não é erro de negócio.
  if (!status) return 'Não conseguimos conectar ao sistema de pagamentos. Verifique sua internet e tente novamente.'

  return contextoFallback
}
