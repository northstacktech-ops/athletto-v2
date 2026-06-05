// ─── Clube ────────────────────────────────────────────────────────────────────

export interface Clube {
  id: string
  nome: string
  slug: string
  modalidade: string | null
  cnpj: string | null
  telefone: string | null
  email: string | null
  logo_url: string | null
  plano: 'basico' | 'intermediario' | 'profissional'
  plano_ativo: boolean
  criado_em: string
  atualizado_em: string
}

// ─── Gestor ───────────────────────────────────────────────────────────────────

export interface Gestor {
  id: string
  clube_id: string
  nome: string
  cpf: string
  email: string
  email_verificado: boolean
  foto_url: string | null
  telefone: string | null
  role: 'principal' | 'adicional'
  permissoes: Record<string, boolean>
  ativo: boolean
  criado_em: string
  atualizado_em: string
}

// ─── Atleta ───────────────────────────────────────────────────────────────────

export type AtletaStatus = 'titular' | 'novato' | 'selecionado' | 'afastado'
export type AtletaSaude = 'saudavel' | 'lesionado' | 'em_recuperacao'

export interface Atleta {
  id: string
  clube_id: string
  nome: string
  apelido: string | null
  cpf: string
  data_nascimento: string | null
  telefone: string | null
  telefone_responsavel: string | null
  email: string | null
  foto_url: string | null
  numero_camisa: string | null
  posicao: string | null
  status: AtletaStatus
  saude: AtletaSaude
  tipo_sanguineo: string | null
  historico_lesoes: { descricao: string; data: string }[]
  observacoes_medicas: string | null
  data_entrada: string
  ativo: boolean
  app_primeiro_acesso: boolean
  /** Mensalidade personalizada do atleta. Se null/undefined, usa o valor padrão da turma. */
  valor_mensalidade?: number | null
  criado_em: string
  atualizado_em: string
}

// ─── Turma ────────────────────────────────────────────────────────────────────

export interface Turma {
  id: string
  clube_id: string
  nome: string
  descricao: string | null
  dias_semana: number[]
  horario_inicio: string
  horario_fim: string
  local: string | null
  ativo: boolean
  /** Mensalidade padrão cobrada pra atletas dessa turma (centavos não — número decimal em R$). */
  valor_mensalidade_padrao?: number
  criado_em: string
  atualizado_em: string
  // relações
  total_atletas?: number
}

// ─── Frequência ───────────────────────────────────────────────────────────────

export interface Frequencia {
  id: string
  clube_id: string
  turma_id: string
  atleta_id: string
  data: string
  presente: boolean
  registrado_por: string | null
  criado_em: string
}

export interface AlertaEvasao {
  id: string
  clube_id: string
  atleta_id: string
  turma_id: string
  faltas_consecutivas: number
  data_deteccao: string
  dispensado: boolean
  dispensado_por: string | null
  dispensado_em: string | null
  criado_em: string
  // relações
  atleta?: Pick<Atleta, 'id' | 'nome' | 'apelido' | 'foto_url' | 'telefone_responsavel'>
  turma?: Pick<Turma, 'id' | 'nome'>
}

// ─── Evento Calendário ────────────────────────────────────────────────────────

export interface EventoCalendario {
  id: string
  clube_id: string
  titulo: string
  descricao: string | null
  tipo: 'treino' | 'evento'
  data_inicio: string
  data_fim: string | null
  turma_id: string | null
  /** Turmas vinculadas ao evento (múltiplas). `turma_id` permanece para compat. */
  turma_ids?: string[] | null
  /** Atletas vinculados individualmente ao evento. */
  atleta_ids?: string[] | null
  criado_por: string | null
  criado_em: string
}

// ─── Financeiro ───────────────────────────────────────────────────────────────

export type PlanejamentoStatus = 'inativo' | 'ativo' | 'encerrado'
export type PlanejamentoTipo = 'recorrente' | 'unico'
export type Periodicidade = 'mensal' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'

export interface Planejamento {
  id: string
  clube_id: string
  nome: string
  descricao: string | null
  tipo: PlanejamentoTipo
  valor: number
  periodicidade: Periodicidade | null
  dia_vencimento: number | null
  data_vencimento: string | null
  status: PlanejamentoStatus
  ativado_em: string | null
  encerrado_em: string | null
  criado_em: string
  atualizado_em: string
  // relações
  total_atletas?: number
}

export interface Caixinha {
  id: string
  clube_id: string
  planejamento_id: string
  nome: string
  saldo_arrecadado: number
  total_previsto: number
  total_pendente: number
  total_pago: number
  criada_em: string
  // relações
  planejamento?: Planejamento
  total_cobranças?: number
  cobranças_pagas?: number
  cobranças_pendentes?: number
  cobranças_isentas?: number
}

export type CobrancaStatus = 'pendente' | 'pago' | 'isento' | 'cancelado'

export interface Cobranca {
  id: string
  clube_id: string
  caixinha_id: string
  atleta_id: string
  valor: number
  status: CobrancaStatus
  data_vencimento: string
  data_pagamento: string | null
  abacatepay_payment_id: string | null
  abacatepay_link: string | null
  gerado_em: string
  atualizado_em: string
  // relações
  atleta?: Pick<Atleta, 'id' | 'nome' | 'apelido' | 'foto_url' | 'telefone_responsavel'>
  caixinha?: Pick<Caixinha, 'id' | 'nome'>
}

export type TransacaoTipo = 'entrada' | 'saida'
export type TransacaoOrigem = 'manual' | 'webhook'

export interface Transacao {
  id: string
  clube_id: string
  tipo: TransacaoTipo
  valor: number
  descricao: string | null
  categoria: string | null
  data: string
  cobranca_id: string | null
  caixinha_id: string | null
  atleta_id: string | null
  origem: TransacaoOrigem
  registrado_por: string | null
  criado_em: string
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardMetrics {
  total_atletas: number
  total_turmas: number
  receita_mes: number
  despesas_mes: number
  saldo_mes: number
  cobranças_pendentes: number
  cobranças_atraso: number
  atletas_saudaveis: number
  atletas_lesionados: number
  atletas_em_recuperacao: number
}

export interface GraficoFinanceiro {
  mes: string
  receita: number
  despesa: number
}

// ─── Plano ────────────────────────────────────────────────────────────────────

export interface PlanoLimites {
  atletas: number | null
  turmas: number
  gestores_adicionais: number
  planejamentos_ativos: number
  historico_financeiro_meses: number | null
}

export const PLANO_LIMITES: Record<Clube['plano'], PlanoLimites> = {
  basico: {
    atletas: 40,
    turmas: 5,
    gestores_adicionais: 1,
    planejamentos_ativos: 3,
    historico_financeiro_meses: 6,
  },
  intermediario: {
    atletas: 80,
    turmas: 20,
    gestores_adicionais: 3,
    planejamentos_ativos: 10,
    historico_financeiro_meses: 12,
  },
  profissional: {
    atletas: null,
    turmas: 20,
    gestores_adicionais: 5,
    planejamentos_ativos: 20,
    historico_financeiro_meses: null,
  },
}

// ─── Assinatura ───────────────────────────────────────────────────────────────

export type AssinaturaStatus = 'trial' | 'ativa' | 'inadimplente' | 'cancelada' | 'suspensa'

export interface Assinatura {
  id: string
  clube_id: string
  plano: Clube['plano']
  status: AssinaturaStatus
  trial_inicio: string
  trial_fim: string
  ativada_em: string | null
  proxima_cobranca: string | null
  valor_mensal: number
  cancelada_em: string | null
  motivo_cancelamento: string | null
  dias_voucher_aplicados: number
  criado_em: string
  atualizado_em: string
  // relações
  clube?: Pick<Clube, 'id' | 'nome' | 'slug' | 'logo_url' | 'plano'>
}

// ─── Voucher ──────────────────────────────────────────────────────────────────

export type VoucherTipo = 'trial' | 'extensao' | 'upgrade' | 'cortesia'
export type VoucherStatus = 'ativo' | 'consumido' | 'expirado' | 'revogado'

export interface Voucher {
  id: string
  clube_id: string
  emitido_por: string // superadmin_id
  tipo: VoucherTipo
  dias_concedidos: number
  plano_concedido: Clube['plano'] | null
  motivo: string
  observacoes: string | null
  status: VoucherStatus
  aplicado_em: string
  expira_em: string | null
  revogado_em: string | null
  revogado_por: string | null
  motivo_revogacao: string | null
  criado_em: string
  // relações
  clube?: Pick<Clube, 'id' | 'nome' | 'slug' | 'logo_url'>
  emissor?: Pick<SuperAdmin, 'id' | 'nome'>
}

// ─── Indicação ────────────────────────────────────────────────────────────────

export type IndicacaoStatus = 'pendente' | 'aprovada' | 'rejeitada' | 'expirada'

export interface Indicacao {
  id: string
  clube_indicador_id: string
  clube_indicado_id: string | null
  email_indicado: string
  nome_indicado: string | null
  telefone_indicado: string | null
  status: IndicacaoStatus
  dias_recompensa: number
  voucher_emitido_id: string | null
  aprovada_em: string | null
  aprovada_por: string | null
  rejeitada_em: string | null
  rejeitada_por: string | null
  motivo_rejeicao: string | null
  criado_em: string
  // relações
  indicador?: Pick<Clube, 'id' | 'nome' | 'slug' | 'logo_url'>
  indicado?: Pick<Clube, 'id' | 'nome' | 'slug' | 'logo_url'>
}

// ─── SuperAdmin ───────────────────────────────────────────────────────────────

export type SuperAdminRole = 'owner' | 'admin' | 'suporte' | 'financeiro'

export interface SuperAdmin {
  id: string
  nome: string
  email: string
  foto_url: string | null
  role: SuperAdminRole
  ativo: boolean
  ultimo_acesso: string | null
  criado_em: string
  atualizado_em: string
}

// ─── Webhook log (idempotência AbacatePay etc.) ───────────────────────────────

export type WebhookOrigem = 'abacatepay' | 'outro'
export type WebhookStatus = 'recebido' | 'processado' | 'erro' | 'ignorado'

export interface WebhookLog {
  id: string
  origem: WebhookOrigem
  evento: string
  payment_id: string | null
  cobranca_id: string | null
  payload: Record<string, unknown>
  hmac_valido: boolean
  status: WebhookStatus
  erro: string | null
  recebido_em: string
  processado_em: string | null
}

// ─── Log de auditoria (toda ação de superadmin) ───────────────────────────────

export type AuditoriaAcao =
  | 'login'
  | 'clube_criado'
  | 'clube_suspenso'
  | 'clube_reativado'
  | 'clube_excluido'
  | 'voucher_emitido'
  | 'voucher_revogado'
  | 'indicacao_aprovada'
  | 'indicacao_rejeitada'
  | 'plano_alterado'
  | 'gestor_criado'
  | 'gestor_excluido'
  | 'config_alterada'
  | 'transacao_manual'

export interface LogAuditoria {
  id: string
  superadmin_id: string | null
  acao: AuditoriaAcao
  entidade: string // 'clube' | 'voucher' | 'indicacao' | 'gestor' | etc.
  entidade_id: string | null
  detalhes: Record<string, unknown>
  ip: string | null
  user_agent: string | null
  criado_em: string
  // relações
  superadmin?: Pick<SuperAdmin, 'id' | 'nome' | 'foto_url'>
}

// ─── Configuração global do sistema ───────────────────────────────────────────

export interface ConfiguracaoSistema {
  id: string
  // Trial / planos
  trial_dias_padrao: number
  // Convide e ganhe
  indicacao_dias_recompensa: number
  indicacao_aprovacao_automatica: boolean
  indicacao_minimo_atletas_indicado: number
  // AbacatePay
  abacatepay_ambiente: 'sandbox' | 'production'
  abacatepay_webhook_secret_configurado: boolean
  // Limites globais
  rate_limit_login_tentativas: number
  // Status
  manutencao_ativa: boolean
  manutencao_mensagem: string | null
  atualizado_em: string
  atualizado_por: string | null
}

// ─── Métricas do admin (dashboard global) ─────────────────────────────────────

export interface AdminMetrics {
  total_clubes: number
  clubes_ativos: number
  clubes_trial: number
  clubes_inadimplentes: number
  clubes_cancelados: number
  total_atletas: number
  total_gestores: number
  mrr: number // monthly recurring revenue
  arr: number
  receita_mes: number
  receita_pendente: number
  churn_mes_percent: number
  vouchers_ativos: number
  indicacoes_pendentes: number
  webhooks_falhos_24h: number
}

export interface AdminGraficoCrescimento {
  mes: string
  novos_clubes: number
  cancelamentos: number
  mrr: number
}

// ─── Movimentação financeira do próprio sistema Athletto ──────────────────────

export type SistemaMovTipo = 'mensalidade_recebida' | 'reembolso' | 'taxa_gateway' | 'despesa_operacional'

export interface MovimentacaoFinanceiraSistema {
  id: string
  assinatura_id: string | null
  clube_id: string | null
  tipo: SistemaMovTipo
  valor: number
  descricao: string
  data: string
  payment_id: string | null
  registrado_por: string | null
  criado_em: string
  // relações
  clube?: Pick<Clube, 'id' | 'nome' | 'slug'>
}

// ─── Utilitários ─────────────────────────────────────────────────────────────

export type Nullable<T> = T | null
export type Optional<T> = T | undefined

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
}

export interface ApiError {
  message: string
  code?: string
}
