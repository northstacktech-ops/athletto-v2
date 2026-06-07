<template>
  <div class="min-h-screen bg-gray-50 dark:bg-surface-canvas-dark py-10 px-4">
    <div class="max-w-5xl mx-auto space-y-4 animate-fade-in">

    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="page-title">Ajuda e Suporte</h1>
        <p class="page-description">Como podemos ajudar?</p>
      </div>
      <NuxtLink to="/" class="shrink-0 text-xs font-semibold text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 pt-1">
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
        Voltar
      </NuxtLink>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">

      <!-- COLUNA PRINCIPAL (2/3) -->
      <div class="lg:col-span-2 space-y-4">

        <!-- FAQ -->
        <div class="card-base shadow-card overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between">
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Perguntas frequentes</h2>
            <span class="text-xs text-slate-400">{{ faqFiltrado.length }} de {{ faq.length }} tópicos</span>
          </div>

          <!-- Filtros por categoria -->
          <div class="px-5 pt-3 pb-2 border-b border-slate-100 dark:border-white/[0.06] flex flex-wrap gap-1.5">
            <button
              v-for="cat in categorias"
              :key="cat.id"
              class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border"
              :class="categoriaAtiva === cat.id
                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white'
                : 'border-slate-200 dark:border-white/[0.10] text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/[0.20]'"
              @click="categoriaAtiva = cat.id"
            >
              {{ cat.label }}
            </button>
          </div>

          <!-- Busca -->
          <div class="relative px-5 py-2.5 border-b border-slate-100 dark:border-white/[0.06]">
            <svg class="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="busca" type="text" placeholder="Buscar pergunta..." class="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-600/10"/>
          </div>

          <!-- Lista de perguntas -->
          <div class="divide-y divide-slate-100 dark:divide-white/[0.06]">
            <details v-for="(f, i) in faqFiltrado" :key="i" class="group">
              <summary class="px-5 py-3.5 cursor-pointer list-none flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                <div class="flex-1 min-w-0 pt-0.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-semibold text-slate-900 dark:text-white">{{ f.q }}</span>
                    <span class="shrink-0 text-xs font-bold px-1.5 py-0.5 rounded" :class="catBadge(f.cat)">{{ catLabel(f.cat) }}</span>
                  </div>
                </div>
                <svg class="shrink-0 mt-0.5 w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <div class="px-5 pb-4 pt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{{ f.a }}</div>
            </details>
            <p v-if="faqFiltrado.length === 0" class="px-5 py-8 text-sm text-slate-400 text-center italic">
              Nenhuma pergunta encontrada. <button class="underline ml-1" @click="busca = ''; categoriaAtiva = 'todos'">Limpar filtros</button>
            </p>
          </div>
        </div>

        <!-- Formulário de chamado -->
        <div class="card-base shadow-card overflow-hidden">
          <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07]">
            <h2 class="text-base font-bold text-slate-900 dark:text-white">Abrir um chamado</h2>
            <p class="text-xs text-slate-500 mt-0.5">Não achou a resposta acima? Descreva o problema e nossa equipe responde em até 1h útil.</p>
          </div>
          <form class="px-5 py-4 space-y-4" @submit.prevent="enviarChamado">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Assunto *</label>
                <select v-model="chamado.assunto" required class="form-input">
                  <option value="">Selecione...</option>
                  <option value="atletas">Atletas / cadastro</option>
                  <option value="turmas">Turmas</option>
                  <option value="frequencia">Frequência / presença</option>
                  <option value="financeiro">Financeiro / cobranças</option>
                  <option value="calendario">Calendário</option>
                  <option value="conta">Conta / assinatura</option>
                  <option value="bug">Bug / erro inesperado</option>
                  <option value="sugestao">Sugestão de melhoria</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Urgência</label>
                <select v-model="chamado.urgencia" class="form-input">
                  <option value="baixa">Baixa — dúvida geral</option>
                  <option value="media">Média — funcionalidade afetada</option>
                  <option value="alta">Alta — bloqueio total</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descreva o problema *</label>
              <textarea v-model="chamado.descricao" rows="5" required maxlength="2000" class="form-input" placeholder="Conte o que tentou fazer, o que esperava acontecer e o que aconteceu de fato..."/>
              <p class="text-right text-xs text-slate-400 mt-1">{{ chamado.descricao.length }}/2000</p>
            </div>
            <div class="flex justify-end">
              <button :disabled="!podeEnviar || enviando" class="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 transition-colors">
                {{ enviando ? 'Enviando...' : 'Enviar chamado' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- LATERAL (1/3) -->
      <aside class="space-y-3">
        <a :href="whatsappLink" target="_blank" class="block rounded-xl p-4 bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24z"/></svg>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold">WhatsApp do suporte</p>
              <p class="text-xs text-white/80">Resposta em até 1h</p>
            </div>
          </div>
        </a>

        <a href="mailto:athletto.empresa@gmail.com" class="block card-base p-4 shadow-card hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-500/15 flex items-center justify-center shrink-0">
              <svg class="w-5 h-5 text-brand-700 dark:text-brand-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-slate-900 dark:text-white">E-mail</p>
              <p class="text-xs text-slate-500 truncate">athletto.empresa@gmail.com</p>
            </div>
          </div>
        </a>

        <!-- Privacidade & direitos LGPD -->
        <div class="card-base p-5 shadow-card">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Privacidade & seus dados (LGPD)</p>
          <p class="text-sm text-slate-600 dark:text-slate-300">
            Você pode solicitar acesso, correção, exclusão/anonimização ou
            portabilidade dos seus dados, além de revogar consentimentos.
          </p>
          <p class="text-sm text-slate-600 dark:text-slate-300 mt-2">
            Para exercer qualquer direito, escreva para
            <a href="mailto:athletto.empresa@gmail.com" class="font-semibold text-brand-600 hover:text-brand-700">athletto.empresa@gmail.com</a>.
          </p>
          <NuxtLink to="/privacidade" class="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-brand-600 hover:text-brand-700">
            Ler a Política de Privacidade
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </NuxtLink>
        </div>

        <div class="card-base p-5 shadow-card">
          <p class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Horário de atendimento</p>
          <ul class="text-sm space-y-1.5">
            <li class="flex justify-between"><span class="text-slate-600 dark:text-slate-300">Seg–Sex</span><span class="font-bold text-slate-900 dark:text-white">8h–20h</span></li>
            <li class="flex justify-between"><span class="text-slate-600 dark:text-slate-300">Sábado</span><span class="font-bold text-slate-900 dark:text-white">9h–14h</span></li>
            <li class="flex justify-between"><span class="text-slate-600 dark:text-slate-300">Domingo</span><span class="font-semibold text-slate-400">Fechado</span></li>
          </ul>
          <p class="text-xs text-slate-400 mt-3">Fora desse horário, abra um chamado pelo formulário ao lado — respondemos assim que possível.</p>
        </div>

        <div class="card-base p-5 shadow-card text-center">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>
            Sistemas operacionais
          </div>
          <p class="text-xs text-slate-400 mt-2">
            Detalhes em <a href="https://status.athletto.com.br" target="_blank" class="underline hover:text-slate-600">status.athletto.com.br</a>
          </p>
        </div>
      </aside>
    </div>
    </div>
    <UiToastContainer />
  </div>
</template>

<script setup lang="ts">
import { gerarLinkWhatsApp } from '~/utils/format'

// Página pública (acessível pelo rodapé do login) — sem layout do painel.
definePageMeta({ layout: false })
useHead({ title: 'Suporte — Athletto' })

const toast = useToast()
const whatsappLink = gerarLinkWhatsApp('(11) 99999-0000', 'Oi, preciso de ajuda com o Athletto!')

const busca = ref('')
const categoriaAtiva = ref('todos')
const enviando = ref(false)

const chamado = reactive({
  assunto: '',
  urgencia: 'media' as 'baixa' | 'media' | 'alta',
  descricao: '',
})
const podeEnviar = computed(() => chamado.assunto.length > 0 && chamado.descricao.trim().length >= 10)

async function enviarChamado() {
  if (!podeEnviar.value) return
  enviando.value = true
  await new Promise((r) => setTimeout(r, 700))
  enviando.value = false
  chamado.descricao = ''
  chamado.assunto = ''
  toast.success('Chamado enviado!', 'Você receberá uma resposta por e-mail em até 1h útil.')
}

// ── Categorias ───────────────────────────────────────────────────────────────
type Categoria = 'todos' | 'atletas' | 'turmas' | 'frequencia' | 'financeiro' | 'calendario' | 'conta'

const categorias: { id: Categoria; label: string }[] = [
  { id: 'todos',      label: 'Todos' },
  { id: 'atletas',    label: 'Atletas' },
  { id: 'turmas',     label: 'Turmas' },
  { id: 'frequencia', label: 'Frequência' },
  { id: 'financeiro', label: 'Financeiro' },
  { id: 'calendario', label: 'Calendário' },
  { id: 'conta',      label: 'Conta & Plano' },
]

function catLabel(cat: Categoria) {
  return categorias.find((c) => c.id === cat)?.label ?? cat
}

function catBadge(cat: Categoria) {
  const map: Record<Categoria, string> = {
    todos:      '',
    atletas:    'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
    turmas:     'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
    frequencia: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    financeiro: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    calendario: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
    conta:      'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300',
  }
  return map[cat] ?? ''
}

// ── FAQ — perguntas reais do gestor ──────────────────────────────────────────
const faq: { cat: Categoria; q: string; a: string }[] = [
  // Atletas
  {
    cat: 'atletas',
    q: 'Como cadastro um novo atleta?',
    a: 'Acesse Atletas → clique em "Novo atleta" no canto superior direito. Preencha os dados (nome, CPF, data de nascimento, posição, status de saúde) e salve. O atleta já aparece na lista e pode ser vinculado a uma turma imediatamente.',
  },
  {
    cat: 'atletas',
    q: 'Como vinculo um atleta a uma turma?',
    a: 'Abra a ficha do atleta (clique nele na lista) → aba "Turmas" → clique em "Vincular turma" e escolha na lista de turmas ativas. O atleta já começa a aparecer nos registros de frequência daquela turma.',
  },
  {
    cat: 'atletas',
    q: 'Posso inativar um atleta temporariamente sem perder os dados?',
    a: 'Sim. Na ficha do atleta, clique em "Desativar". O atleta some das listas de frequência e financeiro mas todo o histórico (pagamentos, presenças, lesões) fica preservado. Você pode reativá-lo a qualquer momento.',
  },
  {
    cat: 'atletas',
    q: 'Como configuro um valor de mensalidade diferente para um atleta?',
    a: 'Abra a ficha do atleta → aba "Financeiro" → clique em "Alterar". Você pode definir um valor personalizado fixo (ex: bolsa de 50%), isentar o atleta (R$ 0) ou voltar ao valor padrão da turma. Essa configuração vale permanentemente, em qualquer planejamento que inclua esse atleta.',
  },

  // Turmas
  {
    cat: 'turmas',
    q: 'Como crio uma turma e defino os dias e horários de treino?',
    a: 'Vá em Turmas → clique em "Nova turma". Informe o nome, selecione os dias da semana (ex: Seg, Qua, Sex), o horário de início e fim, o local e o valor padrão de mensalidade. Após salvar, a turma já aparece no calendário automático.',
  },
  {
    cat: 'turmas',
    q: 'Como edito o valor de mensalidade da turma?',
    a: 'Na página de detalhe da turma, clique em "Editar turma" (botão no topo). Altere o campo "Mensalidade padrão". Esse valor passa a ser a base para novos planejamentos — atletas com valor personalizado não são afetados.',
  },
  {
    cat: 'turmas',
    q: 'Como vejo e edito a mensalidade individual de cada atleta dentro de uma turma?',
    a: 'Acesse a turma → aba "Financeiro" → seção "Mensalidades por atleta". Cada linha mostra o valor atual do atleta e um botão de edição (ícone de lápis). Você pode alterar o valor, isentar ou restaurar o padrão da turma diretamente ali.',
  },

  // Frequência
  {
    cat: 'frequencia',
    q: 'Como registro a presença de uma turma no dia do treino?',
    a: 'Acesse Frequência → aba "Registrar" → selecione a turma e a data → marque quem está presente. Clique em "Salvar registro". O histórico é atualizado imediatamente e os percentuais de presença recalculados.',
  },
  {
    cat: 'frequencia',
    q: 'O que é o alerta de evasão e como funciona?',
    a: 'O sistema detecta automaticamente atletas com 3 faltas consecutivas e cria um alerta. Você os vê em Frequência → aba "Alertas". Cada alerta tem um botão de WhatsApp pré-formatado para você entrar em contato com o responsável do atleta em um clique.',
  },

  // Financeiro
  {
    cat: 'financeiro',
    q: 'O que é um planejamento e como crio o primeiro?',
    a: 'Um planejamento é um ciclo de cobrança (ex: "Mensalidade Junho 2026"). Acesse Cobranças → clique em "Novo planejamento". Defina nome, valor padrão, tipo (recorrente ou único) e selecione as turmas. Na etapa de revisão, ajuste os valores individuais. Salve como rascunho ou ative as cobranças diretamente.',
  },
  {
    cat: 'financeiro',
    q: 'O que são caixinhas e para que servem?',
    a: 'Caixinhas separam o dinheiro do clube por finalidade (mensalidade, uniforme, viagem, etc.). Cada planejamento ativo gera uma caixinha. Você acompanha quanto cada caixinha arrecadou, quantas cobranças estão pendentes e pode transferir saldo entre elas.',
  },
  {
    cat: 'financeiro',
    q: 'Como registro uma entrada ou saída manual?',
    a: 'Na tela de Cobranças, clique em "Entrada manual" (verde) ou "Saída manual" (laranja). Informe o valor, a descrição e a caixinha de destino/origem. Essa movimentação aparece no extrato e afeta o saldo da caixinha.',
  },
  {
    cat: 'financeiro',
    q: 'Como o atleta (ou responsável) paga a mensalidade?',
    a: 'Quando um planejamento é ativado, o sistema gera um link de Pix via AbacatePay para cada atleta. O responsável recebe o link pelo app ou WhatsApp, paga via Pix e o status da cobrança atualiza automaticamente para "Pago" — sem ação manual sua.',
  },

  // Calendário
  {
    cat: 'calendario',
    q: 'Como crio um evento ou treino no calendário?',
    a: 'Acesse Calendário → clique em "Novo evento" ou clique diretamente em um dia na grade. Informe o título, tipo (treino, jogo, reunião, evento), data e hora de início e fim. O evento aparece na visão semanal e mensal, e atletas com o app conseguem visualizá-lo.',
  },
  {
    cat: 'calendario',
    q: 'Os treinos das turmas aparecem automaticamente no calendário?',
    a: 'Sim. Ao criar uma turma com dias da semana definidos, os treinos recorrentes são exibidos automaticamente no calendário. Eventos avulsos (como jogos fora da grade semanal) você adiciona manualmente.',
  },

  // Conta & Plano
  {
    cat: 'conta',
    q: 'Posso ter mais de um gestor no meu clube?',
    a: 'Sim. O plano Básico permite até 2 gestores, Intermediário até 4 e Profissional até 6. Adicione gestores em Configurações → aba "Gestores" → "Convidar gestor". O convidado recebe um e-mail com link de acesso.',
  },
  {
    cat: 'conta',
    q: 'Esqueci minha senha. Como recupero?',
    a: 'Na tela de login, clique em "Esqueci minha senha". Informe seu e-mail e você receberá um link para criar uma nova senha. O link expira em 1 hora. Se não aparecer na caixa de entrada, verifique o spam.',
  },
  {
    cat: 'conta',
    q: 'Posso cancelar minha assinatura? O que acontece com os meus dados?',
    a: 'Sim, cancele a qualquer momento em Configurações → aba "Assinatura". Você continua usando o Athletto até o fim do período já pago. Após o encerramento, seus dados ficam preservados por 90 dias — caso queira reativar. Depois disso, os dados pessoais são anonimizados conforme a LGPD.',
  },
  {
    cat: 'conta',
    q: 'Os dados dos meus atletas são meus?',
    a: 'Sim. Você pode exportar tudo em CSV a qualquer momento via Configurações. Seguimos a LGPD à risca: nunca compartilhamos seus dados com terceiros para fins comerciais. Os únicos terceiros que processam dados são os operadores técnicos (Supabase para banco, AbacatePay para Pix), todos sob acordo de processamento de dados.',
  },
]

const faqFiltrado = computed(() => {
  let lista = faq
  if (categoriaAtiva.value !== 'todos') {
    lista = lista.filter((f) => f.cat === categoriaAtiva.value)
  }
  if (busca.value.trim()) {
    const q = busca.value.toLowerCase()
    lista = lista.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
  }
  return lista
})
</script>
