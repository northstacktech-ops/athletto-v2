<template>
  <div v-if="loading" class="space-y-4 animate-fade-in">
    <div class="skeleton h-10 w-40 rounded-lg" />
    <div class="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
      <div class="skeleton h-[420px] rounded-xl" />
      <div class="skeleton h-[420px] rounded-xl" />
    </div>
  </div>

  <UiEmptyState
    v-else-if="!atleta"
    title="Atleta não encontrado"
    description="Verifique o link ou volte à lista."
  />

  <div v-else class="space-y-4 animate-fade-in">
    <!-- Breadcrumb / back + menu de ações (3 pontos) -->
    <div class="flex items-center gap-2 text-sm">
      <NuxtLink to="/atletas" class="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium inline-flex items-center gap-1">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        Atletas
      </NuxtLink>
      <span class="text-slate-300">/</span>
      <span class="text-slate-900 dark:text-white font-semibold truncate">{{ atleta.nome }}</span>

      <!-- Menu de ajustes -->
      <div v-if="podeEditar" class="ml-auto relative">
        <button
          class="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
          aria-label="Ações"
          @click.stop="menuAberto = !menuAberto"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
        </button>
        <div v-if="menuAberto" class="fixed inset-0 z-10" @click="menuAberto = false" />
        <div
          v-if="menuAberto"
          class="absolute right-0 mt-1 w-44 bg-white dark:bg-surface-elevated-dark border border-slate-200 dark:border-white/[0.10] rounded-xl shadow-lg py-1 z-20"
        >
          <button
            class="w-full text-left px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/[0.05] inline-flex items-center gap-2"
            @click="menuAberto = false; abrirEdicao = true"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar atleta
          </button>
          <button
            v-if="atleta.ativo"
            class="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 inline-flex items-center gap-2"
            @click="menuAberto = false; desativar()"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            Desativar
          </button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">

      <!-- ── Sidebar esquerda ────────────────────────────────────── -->
      <aside class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] p-5 shadow-card lg:sticky lg:top-[80px] self-start">
        <div class="flex flex-col items-center text-center">
          <UiAvatar
            :src="atleta.foto_url"
            :nome="atleta.nome"
            :numero="atleta.numero_camisa"
            size="2xl"
          />
          <h1 class="mt-3 text-lg font-bold text-slate-900 dark:text-white">{{ atleta.nome }}</h1>
          <p v-if="atleta.apelido" class="text-sm text-slate-500">"{{ atleta.apelido }}"</p>
          <p class="text-sm text-slate-500 mt-0.5">
            {{ atleta.posicao ?? 'Sem posição' }}
            <template v-if="idade !== null"> · {{ idade }} anos</template>
          </p>

          <div class="mt-3 flex items-center gap-2 flex-wrap justify-center">
            <span class="px-2 py-0.5 rounded-md text-xs font-semibold capitalize" :class="statusCor">{{ atleta.status }}</span>
            <span class="inline-flex items-center gap-1 text-xs font-medium" :class="saudeTexto">
              <span class="w-1.5 h-1.5 rounded-full" :class="saudeDot"/>
              {{ saudeLabel }}
            </span>
            <span v-if="!atleta.ativo" class="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-200 text-slate-600">Inativo</span>
          </div>
        </div>

        <!-- Métricas (linha discreta) -->
        <div class="mt-5 grid grid-cols-3 gap-3 border-y border-slate-100 dark:border-white/[0.06] py-3">
          <div class="text-center">
            <p class="text-xs text-slate-500 dark:text-slate-400">Frequência</p>
            <p class="text-sm font-semibold mt-0.5" :class="freqColor">{{ presencaPct === null ? '—' : `${presencaPct}%` }}</p>
          </div>
          <div class="text-center border-x border-slate-100 dark:border-white/[0.06]">
            <p class="text-xs text-slate-500 dark:text-slate-400">Turmas</p>
            <p class="text-sm font-semibold mt-0.5 text-slate-900 dark:text-white">{{ turmasVinculadas.length }}</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-slate-500 dark:text-slate-400">No clube</p>
            <p class="text-sm font-semibold mt-0.5 text-slate-900 dark:text-white">{{ tempoNoClube }}</p>
          </div>
        </div>

        <!-- Ações rápidas -->
        <div v-if="telefoneResponsavelWhatsApp" class="mt-5">
          <a
            :href="telefoneResponsavelWhatsApp"
            target="_blank"
            class="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
          >
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24z"/></svg>
            WhatsApp do responsável
          </a>
        </div>

        <!-- Metadados -->
        <div class="mt-5 text-xs space-y-2">
          <div class="flex justify-between">
            <span class="text-slate-500">Entrou em</span>
            <span class="font-medium text-slate-900 dark:text-white">{{ formatDate(atleta.data_entrada) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">CPF</span>
            <span class="font-medium text-slate-900 dark:text-white">{{ formatCpf(atleta.cpf) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">App</span>
            <span class="font-medium text-slate-900 dark:text-white">{{ atleta.app_primeiro_acesso ? 'Aguarda 1º acesso' : 'Já acessou' }}</span>
          </div>
        </div>
      </aside>

      <!-- ── Conteúdo principal ──────────────────────────────────── -->
      <div class="bg-white dark:bg-surface-elevated-dark rounded-xl border border-slate-200 dark:border-white/[0.10] shadow-card overflow-hidden">
        <!-- Tabs -->
        <div class="px-4 pt-4">
          <UiTabsPill v-model="aba" :tabs="tabs" />
        </div>

        <!-- Conteúdo das abas -->
        <div class="p-6">
          <!-- VISÃO GERAL -->
          <div v-if="aba === 'visao'" class="space-y-6">
            <section>
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Dados pessoais</h3>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div class="flex items-start gap-2.5">
                  <svg class="w-4 h-4 mt-0.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <div>
                    <dt class="text-slate-400 text-xs">Nome completo</dt>
                    <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.nome }}</dd>
                  </div>
                </div>
                <div v-if="atleta.apelido" class="flex items-start gap-2.5">
                  <svg class="w-4 h-4 mt-0.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                  <div>
                    <dt class="text-slate-400 text-xs">Apelido</dt>
                    <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.apelido }}</dd>
                  </div>
                </div>
                <div v-if="atleta.data_nascimento" class="flex items-start gap-2.5">
                  <svg class="w-4 h-4 mt-0.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <div>
                    <dt class="text-slate-400 text-xs">Data de nascimento</dt>
                    <dd class="font-semibold text-slate-900 dark:text-white">{{ formatDate(atleta.data_nascimento) }}</dd>
                  </div>
                </div>
                <div v-if="atleta.posicao" class="flex items-start gap-2.5">
                  <svg class="w-4 h-4 mt-0.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                  <div>
                    <dt class="text-slate-400 text-xs">Posição</dt>
                    <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.posicao }}</dd>
                  </div>
                </div>
                <div v-if="atleta.numero_camisa" class="flex items-start gap-2.5">
                  <svg class="w-4 h-4 mt-0.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>
                  <div>
                    <dt class="text-slate-400 text-xs">Número da camisa</dt>
                    <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.numero_camisa }}</dd>
                  </div>
                </div>
                <div v-if="atleta.tipo_sanguineo" class="flex items-start gap-2.5">
                  <svg class="w-4 h-4 mt-0.5 text-red-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 11-11.31 0z"/></svg>
                  <div>
                    <dt class="text-slate-400 text-xs">Tipo sanguíneo</dt>
                    <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.tipo_sanguineo }}</dd>
                  </div>
                </div>
              </dl>
            </section>

            <section>
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Contato</h3>
              <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div v-if="atleta.telefone_responsavel">
                  <dt class="text-slate-400 text-xs">Telefone do responsável</dt>
                  <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.telefone_responsavel }}</dd>
                </div>
                <div v-if="atleta.telefone">
                  <dt class="text-slate-400 text-xs">Telefone do atleta</dt>
                  <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.telefone }}</dd>
                </div>
                <div v-if="atleta.email">
                  <dt class="text-slate-400 text-xs">E-mail</dt>
                  <dd class="font-semibold text-slate-900 dark:text-white">{{ atleta.email }}</dd>
                </div>
              </dl>
            </section>

            <section v-if="atleta.observacoes_medicas" class="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-4">
              <p class="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 mb-1">Atenção médica</p>
              <p class="text-sm text-amber-900 dark:text-amber-200">{{ atleta.observacoes_medicas }}</p>
            </section>

            <section v-if="atleta.historico_lesoes.length > 0">
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Histórico de lesões</h3>
              <ul class="space-y-2">
                <li v-for="(l, i) in atleta.historico_lesoes" :key="i" class="border-l-2 border-slate-200 dark:border-white/[0.10] pl-3">
                  <p class="text-xs text-slate-500">{{ formatDate(l.data) }}</p>
                  <p class="text-sm text-slate-700 dark:text-slate-300">{{ l.descricao }}</p>
                </li>
              </ul>
            </section>
          </div>

          <!-- TURMAS -->
          <div v-else-if="aba === 'turmas'">
            <div v-if="turmasVinculadas.length === 0" class="text-center py-12">
              <p class="text-sm text-slate-400">Atleta não está vinculado a nenhuma turma.</p>
              <button v-if="podeEditar" class="mt-3 text-sm font-bold text-brand-700 dark:text-brand-400 hover:underline" @click="abrirEdicao = true">Vincular a uma turma</button>
            </div>
            <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
              <li v-for="t in turmasVinculadas" :key="t.id" class="py-3 flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-brand-50 dark:bg-brand-500/10 shrink-0">
                  <svg class="w-5 h-5 text-brand-700 dark:text-brand-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2"/></svg>
                </div>
                <div class="flex-1 min-w-0">
                  <NuxtLink :to="`/turmas/${t.id}`" class="text-sm font-bold text-slate-900 dark:text-white hover:underline truncate block">{{ t.nome }}</NuxtLink>
                  <p class="text-xs text-slate-500">
                    {{ formatDiasSemana(t.dias_semana) }} · {{ formatHorario(t.horario_inicio, t.horario_fim) }}
                    <template v-if="t.local"> · {{ t.local }}</template>
                  </p>
                </div>
                <span class="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">R$ {{ (t.valor_mensalidade_padrao ?? 0).toFixed(0) }}/mês</span>
              </li>
            </ul>
          </div>

          <!-- FREQUÊNCIA -->
          <div v-else-if="aba === 'frequencia'" class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <UiKpiPastel
                :tone="freqTone"
                label="Presença geral"
                :value="presencaPct === null ? '—' : `${presencaPct}%`"
                :delta="presencaPct === null ? 'Sem dados' : 'Últimos 90 dias'"
              />
              <UiKpiPastel
                tone="brand"
                label="Total de treinos"
                :value="totalTreinos"
                delta="Registros encontrados"
              />
              <UiKpiPastel
                tone="emerald"
                label="Presenças"
                :value="totalPresencas"
                :delta="`${totalTreinos - totalPresencas} faltas`"
              />
            </div>

            <div>
              <div class="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Histórico de frequência</h3>
                <div class="flex items-center gap-2 text-xs text-slate-500">
                  <span>{{ historico.length }} registros</span>
                  <select v-model.number="freqPorPagina" class="form-input form-input-sm w-auto py-1">
                    <option :value="20">20</option>
                    <option :value="30">30</option>
                    <option :value="50">50</option>
                  </select>
                  <span>por página</span>
                </div>
              </div>
              <div v-if="historico.length === 0" class="text-sm text-slate-400 italic">Nenhum registro encontrado.</div>
              <template v-else>
                <ul class="divide-y divide-slate-100 dark:divide-white/[0.06]">
                  <li v-for="h in historicoPaginado" :key="h.id" class="py-2 flex items-center gap-3 text-sm">
                    <span class="w-2 h-2 rounded-full shrink-0" :class="h.presente ? 'bg-emerald-500' : 'bg-red-500'"/>
                    <span class="font-medium text-slate-900 dark:text-white">{{ formatDate(h.data) }}</span>
                    <span class="text-slate-500 flex-1">{{ turmaNome(h.turma_id) }}</span>
                    <span class="text-xs font-bold" :class="h.presente ? 'text-emerald-600' : 'text-red-600'">{{ h.presente ? 'Presente' : 'Falta' }}</span>
                  </li>
                </ul>
                <UiPaginador
                  v-if="freqTotalPaginas > 1"
                  v-model="freqPagina"
                  :total-paginas="freqTotalPaginas"
                  class="mt-3"
                />
              </template>
            </div>
          </div>

          <!-- FINANCEIRO -->
          <div v-else-if="aba === 'financeiro'" class="space-y-6">
            <section>
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white mb-3">Mensalidade</h3>

              <!-- Visualização -->
              <div v-if="!editandoMensalidade" class="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] rounded-xl p-5 flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm text-slate-500">Valor mensal cobrado</p>
                  <p class="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                    R$ {{ mensalidadeAtual.toFixed(2).replace('.', ',') }}
                  </p>
                  <div class="flex items-center gap-2 mt-1.5">
                    <span v-if="atleta.valor_mensalidade === 0"
                      class="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
                      Bolsa integral
                    </span>
                    <span v-else-if="atleta.valor_mensalidade !== null && atleta.valor_mensalidade !== undefined"
                      class="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300 border border-violet-200 dark:border-violet-500/20">
                      Taxa personalizada
                    </span>
                    <span v-else class="text-xs text-slate-500">Valor padrão das turmas vinculadas</span>
                  </div>
                </div>
                <button
                  v-if="podeEditar"
                  class="px-3 py-2 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 transition-colors"
                  @click="abrirFormMensalidade">
                  Alterar
                </button>
              </div>

              <!-- Edição inline -->
              <div v-else class="bg-white dark:bg-white/[0.02] border border-brand-300 dark:border-brand-500/40 ring-1 ring-brand-400/20 rounded-xl p-5 space-y-4">
                <p class="text-sm font-semibold text-slate-900 dark:text-white">Configurar mensalidade</p>

                <!-- Input de valor -->
                <div>
                  <label class="block text-xs font-medium text-slate-500 mb-1.5">Valor personalizado</label>
                  <div class="relative max-w-[180px]">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium pointer-events-none">R$</span>
                    <input
                      v-model.number="novoValorMensalidade"
                      type="number" min="0" step="0.01"
                      class="form-input pl-9"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <!-- Atalhos -->
                <div class="flex flex-wrap gap-2">
                  <button type="button"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-white/[0.10] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors"
                    :disabled="savingMensalidade"
                    @click="salvarMensalidade('padrao')">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h7"/></svg>
                    Usar padrão da turma
                  </button>
                  <button type="button"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    :disabled="savingMensalidade"
                    @click="salvarMensalidade('isento')">
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Isentar (R$ 0)
                  </button>
                </div>

                <!-- Ações -->
                <div class="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/[0.06]">
                  <button type="button"
                    class="px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 transition-colors"
                    :disabled="savingMensalidade"
                    @click="salvarMensalidade('valor')">
                    {{ savingMensalidade ? 'Salvando...' : 'Salvar' }}
                  </button>
                  <button type="button"
                    class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                    :disabled="savingMensalidade"
                    @click="editandoMensalidade = false">
                    Cancelar
                  </button>
                </div>
              </div>
            </section>

            <section>
              <div class="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Histórico de cobranças</h3>
                <div class="flex items-center gap-2 text-xs text-slate-500">
                  <span>{{ cobrancas.length }} registros</span>
                  <select v-model.number="cobrPorPagina" class="form-input form-input-sm w-auto py-1">
                    <option :value="20">20</option>
                    <option :value="30">30</option>
                    <option :value="50">50</option>
                  </select>
                  <span>por página</span>
                </div>
              </div>
              <div v-if="cobrancas.length === 0" class="text-sm text-slate-500 italic py-6 text-center">Nenhuma cobrança registrada.</div>
              <template v-else>
                <table class="w-full text-sm">
                  <thead class="text-left text-xs text-slate-500 border-b border-slate-200 dark:border-white/[0.06]">
                    <tr>
                      <th class="py-2 font-medium">Vencimento</th>
                      <th class="py-2 font-medium">Valor</th>
                      <th class="py-2 font-medium">Status</th>
                      <th class="py-2 font-medium text-right">Pago em</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-white/[0.06]">
                    <tr v-for="c in cobrancasPaginadas" :key="c.id">
                      <td class="py-2.5 font-medium text-slate-900 dark:text-white">{{ formatDate(c.data_vencimento) }}</td>
                      <td class="py-2.5 font-semibold text-slate-900 dark:text-white">{{ formatCurrency(c.valor) }}</td>
                      <td class="py-2.5">
                        <UiStatusBadge :variant="cobrancaVariant(c)" />
                      </td>
                      <td class="py-2.5 text-right text-slate-500 text-xs">{{ c.data_pagamento ? formatDate(c.data_pagamento) : '—' }}</td>
                    </tr>
                  </tbody>
                </table>
                <UiPaginador
                  v-if="cobrTotalPaginas > 1"
                  v-model="cobrPagina"
                  :total-paginas="cobrTotalPaginas"
                  class="mt-3"
                />
              </template>
            </section>
          </div>

          <!-- ACESSO AO APP -->
          <div v-else-if="aba === 'acesso'" class="space-y-6">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4">
                <p class="text-xs uppercase tracking-wider text-slate-400">Situação</p>
                <p class="text-sm font-bold mt-1" :class="appStatus.cor">{{ appStatus.label }}</p>
              </div>
              <div class="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4">
                <p class="text-xs uppercase tracking-wider text-slate-400">Último acesso</p>
                <p class="text-sm font-bold mt-1 text-slate-900 dark:text-white">{{ atleta.app_ultimo_acesso ? formatDate(atleta.app_ultimo_acesso) : '—' }}</p>
              </div>
              <div class="bg-slate-50 dark:bg-white/[0.03] rounded-xl p-4">
                <p class="text-xs uppercase tracking-wider text-slate-400">Usando há</p>
                <p class="text-sm font-bold mt-1 text-slate-900 dark:text-white">{{ tempoDeApp }}</p>
              </div>
            </div>

            <div class="rounded-xl border border-slate-200 dark:border-white/[0.08] p-5">
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white">Acesso e senha</h3>
              <p class="text-sm text-slate-500 mt-1 leading-relaxed">
                {{ atleta.app_primeiro_acesso
                  ? 'O atleta ainda não definiu a senha. Gere um código para ele criar a senha e acessar o app.'
                  : 'Para redefinir a senha (esqueceu / trocar), gere um novo código de acesso. Ele cria uma nova senha no app.' }}
              </p>
              <button
                v-if="podeEditar"
                class="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-brand-200 dark:border-brand-500/30 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors disabled:opacity-60"
                :disabled="gerandoCodigo"
                @click="gerarCodigoAcesso"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                {{ gerandoCodigo ? 'Gerando…' : (atleta.app_primeiro_acesso ? 'Gerar código de acesso' : 'Resetar senha (gerar código)') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: código de acesso ao app -->
    <div v-if="codigoAcesso" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="codigoAcesso = null" />
      <div class="relative w-full max-w-sm bg-white dark:bg-surface-elevated-dark rounded-2xl shadow-2xl p-6 text-center animate-fade-in">
        <div class="mx-auto w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-500/10 flex items-center justify-center mb-3">
          <svg class="w-6 h-6 text-brand-600 dark:text-brand-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h3 class="text-base font-bold text-slate-900 dark:text-white">Código de acesso ao app</h3>
        <p class="text-3xl font-extrabold tracking-[0.3em] text-brand-700 dark:text-brand-300 my-4 select-all">{{ codigoAcesso }}</p>
        <p class="text-sm text-slate-500 leading-relaxed">Passe este código para o atleta. Vale 24h. Ele usa no app para criar a senha.</p>
        <button class="mt-5 w-full px-4 py-2 rounded-lg text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors" @click="codigoAcesso = null">Fechar</button>
      </div>
    </div>

    <AtletasFormModal
      v-if="abrirEdicao"
      :atleta="atleta"
      :turmas="turmas"
      @close="abrirEdicao = false"
      @salvo="onSalvo"
    />
  </div>
</template>

<script setup lang="ts">
import { formatCpf, formatDate, formatDiasSemana, formatHorario, formatCurrency, gerarLinkWhatsApp } from '~/utils/format'
import type { Atleta, Turma, Frequencia, Cobranca } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const router = useRouter()

const atletasComp = useAtletas()
const turmasComp = useTurmas()
const freqComp = useFrequencia()
const finComp = useFinanceiro()
const toast = useToast()
const { temPermissao } = useAuth()

// Gestor adicional sem nível 'editar' em atletas só visualiza o detalhe.
const podeEditar = computed(() => temPermissao('atletas', 'editar'))

const atletaId = computed(() => route.params.id as string)

const loading = ref(true)
const atleta = ref<Atleta | null>(null)
const turmas = ref<Turma[]>([])
const turmasVinculadas = ref<Turma[]>([])
const presencaPct = ref<number | null>(null)
const historico = ref<Frequencia[]>([])
const cobrancas = ref<Cobranca[]>([])
const abrirEdicao = ref(false)
const menuAberto = ref(false)
const supabase = useSupabaseClient()

// ── Paginação: frequência ────────────────────────────────────────────────────
const freqPagina = ref(1)
const freqPorPagina = ref(20)
const freqTotalPaginas = computed(() => Math.max(1, Math.ceil(historico.value.length / freqPorPagina.value)))
const historicoPaginado = computed(() => {
  const ini = (freqPagina.value - 1) * freqPorPagina.value
  return historico.value.slice(ini, ini + freqPorPagina.value)
})
watch(freqPorPagina, () => { freqPagina.value = 1 })

// ── Paginação: cobranças ─────────────────────────────────────────────────────
const cobrPagina = ref(1)
const cobrPorPagina = ref(20)
const cobrTotalPaginas = computed(() => Math.max(1, Math.ceil(cobrancas.value.length / cobrPorPagina.value)))
const cobrancasPaginadas = computed(() => {
  const ini = (cobrPagina.value - 1) * cobrPorPagina.value
  return cobrancas.value.slice(ini, ini + cobrPorPagina.value)
})
watch(cobrPorPagina, () => { cobrPagina.value = 1 })

// ── Acesso ao app ────────────────────────────────────────────────────────────
const gerandoCodigo = ref(false)
const codigoAcesso = ref<string | null>(null)

const appStatus = computed(() => {
  if (!atleta.value) return { label: '—', cor: 'text-slate-400' }
  if (atleta.value.app_primeiro_acesso) return { label: 'Aguardando 1º acesso', cor: 'text-amber-600 dark:text-amber-400' }
  return { label: 'Ativo', cor: 'text-emerald-600 dark:text-emerald-400' }
})
const tempoDeApp = computed(() => {
  const desde = atleta.value?.app_senha_definida_em
  if (!desde) return '—'
  const dias = Math.floor((Date.now() - new Date(desde).getTime()) / (24 * 60 * 60 * 1000))
  if (dias < 1) return 'Hoje'
  if (dias < 30) return `${dias} dia${dias === 1 ? '' : 's'}`
  const meses = Math.floor(dias / 30)
  if (meses < 12) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  return `${anos} ano${anos === 1 ? '' : 's'}`
})

async function gerarCodigoAcesso() {
  if (!atleta.value || gerandoCodigo.value) return
  gerandoCodigo.value = true
  try {
    const { data, error } = await supabase.rpc('app_gerar_codigo_acesso', { p_atleta_id: atleta.value.id })
    if (error) throw error
    const res = data as { ok?: boolean; codigo?: string; erro?: string } | null
    if (!res?.ok || !res.codigo) {
      toast.error('Não foi possível gerar o código', res?.erro ?? 'Tente novamente.')
      return
    }
    codigoAcesso.value = res.codigo
  } catch (e: any) {
    toast.error('Erro ao gerar código', e?.message ?? 'Tente novamente.')
  } finally {
    gerandoCodigo.value = false
  }
}

// ── Edição inline de mensalidade ─────────────────────────────────────────────
const editandoMensalidade = ref(false)
const novoValorMensalidade = ref(0)
const savingMensalidade = ref(false)

function abrirFormMensalidade() {
  novoValorMensalidade.value = atleta.value?.valor_mensalidade ?? mensalidadeAtual.value
  editandoMensalidade.value = true
}

async function salvarMensalidade(tipo: 'valor' | 'isento' | 'padrao') {
  if (!atleta.value) return
  savingMensalidade.value = true
  try {
    const novoValor = tipo === 'valor' ? novoValorMensalidade.value
      : tipo === 'isento' ? 0
      : null
    await atletasComp.atualizar(atleta.value.id, { valor_mensalidade: novoValor })
    atleta.value = { ...atleta.value, valor_mensalidade: novoValor }
    const mensagem = tipo === 'padrao' ? 'Usando valor padrão da turma'
      : tipo === 'isento' ? 'Atleta isento (R$ 0,00)'
      : `Mensalidade atualizada para R$ ${novoValor!.toFixed(2)}`
    toast.success('Mensalidade atualizada', mensagem)
    editandoMensalidade.value = false
  } catch (err: any) {
    toast.error('Erro ao salvar', err?.message ?? '')
  } finally {
    savingMensalidade.value = false
  }
}

const tabs = [
  { value: 'visao' as const, label: 'Visão geral' },
  { value: 'turmas' as const, label: 'Turmas' },
  { value: 'frequencia' as const, label: 'Frequência' },
  { value: 'financeiro' as const, label: 'Financeiro' },
  { value: 'acesso' as const, label: 'Acesso ao app' },
]
type TabValue = typeof tabs[number]['value']
const hashToTab: Record<string, TabValue> = {
  '#visao': 'visao', '#turmas': 'turmas', '#frequencia': 'frequencia',
  '#financeiro': 'financeiro', '#acesso': 'acesso',
}
const aba = ref<TabValue>(hashToTab[route.hash] ?? 'visao')
watch(aba, (v) => router.replace({ hash: `#${v}` }))

async function carregar() {
  loading.value = true
  try {
    // Todas as queries do detalhe dependem só do ID da rota (não do objeto
    // atleta), então rodam numa ÚNICA leva paralela — antes eram 2 ondas
    // sequenciais (2 + 4), o que dobrava a latência de rede.
    const id = atletaId.value
    const [aRes, tRes, presRes, vinRes, histRes, cobRes] = await Promise.all([
      atletasComp.buscarPorId(id),
      turmasComp.listar(true),
      freqComp.calcularPresenca(id),
      atletasComp.listarTurmas(id),
      freqComp.historicoPorAtleta(id),
      finComp.listarCobranças({ atleta_id: id }),
    ])

    atleta.value = aRes.data
    turmas.value = tRes.data ?? []
    if (atleta.value) {
      useHead({ title: `${atleta.value.nome} — Atletto` })
    }
    presencaPct.value = typeof presRes.data === 'number' ? presRes.data : null
    const ids = new Set((vinRes.data ?? []).map((d: any) => d.turma_id))
    turmasVinculadas.value = turmas.value.filter((t) => ids.has(t.id))
    historico.value = (histRes.data ?? []) as Frequencia[]
    cobrancas.value = (cobRes.data ?? []) as Cobranca[]
  } finally {
    loading.value = false
  }
}
onMounted(carregar)

const idade = computed(() => {
  if (!atleta.value?.data_nascimento) return null
  const nasc = new Date(atleta.value.data_nascimento)
  return Math.floor((Date.now() - nasc.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
})

const tempoNoClube = computed(() => {
  if (!atleta.value) return '—'
  const entrada = new Date(atleta.value.data_entrada)
  const meses = Math.floor((Date.now() - entrada.getTime()) / (30 * 24 * 60 * 60 * 1000))
  if (meses < 1) return '< 1m'
  if (meses < 12) return `${meses}m`
  const anos = Math.floor(meses / 12)
  const mr = meses % 12
  return mr === 0 ? `${anos}a` : `${anos}a${mr}m`
})

const telefoneResponsavelWhatsApp = computed(() => {
  if (!atleta.value?.telefone_responsavel) return null
  return gerarLinkWhatsApp(
    atleta.value.telefone_responsavel,
    `Oi! Sou do clube, queria conversar sobre o(a) ${atleta.value.nome}.`,
  )
})

const mensalidadeAtual = computed(() => {
  if (!atleta.value) return 0
  if (atleta.value.valor_mensalidade !== null && atleta.value.valor_mensalidade !== undefined) {
    return atleta.value.valor_mensalidade
  }
  if (turmasVinculadas.value.length === 0) return 0
  const total = turmasVinculadas.value.reduce((s, t) => s + (t.valor_mensalidade_padrao ?? 0), 0)
  return total / turmasVinculadas.value.length
})

const totalTreinos = computed(() => historico.value.length)
const totalPresencas = computed(() => historico.value.filter((h) => h.presente).length)

const freqColor = computed(() => {
  const v = presencaPct.value
  if (v === null) return 'text-slate-400'
  if (v >= 80) return 'text-emerald-600'
  if (v >= 60) return 'text-amber-500'
  return 'text-red-500'
})

const freqTone = computed<'emerald' | 'amber' | 'rose' | 'slate'>(() => {
  const v = presencaPct.value
  if (v === null) return 'slate'
  if (v >= 80) return 'emerald'
  if (v >= 60) return 'amber'
  return 'rose'
})

const statusCor = computed(() => {
  if (!atleta.value) return ''
  switch (atleta.value.status) {
    case 'titular': return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
    case 'novato': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
    case 'selecionado': return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
    case 'afastado': return 'bg-slate-100 text-slate-600 dark:bg-white/[0.06] dark:text-slate-300'
  }
})
const saudeLabel = computed(() => {
  if (!atleta.value) return ''
  return ({
    saudavel: 'Saudável', lesionado: 'Lesionado', em_recuperacao: 'Em recuperação',
  } as const)[atleta.value.saude]
})
const saudeDot = computed(() => {
  if (!atleta.value) return ''
  return ({
    saudavel: 'bg-emerald-500', lesionado: 'bg-red-500', em_recuperacao: 'bg-amber-400',
  } as const)[atleta.value.saude]
})
const saudeTexto = computed(() => {
  if (!atleta.value) return ''
  return ({
    saudavel: 'text-emerald-600 dark:text-emerald-400',
    lesionado: 'text-red-600 dark:text-red-400',
    em_recuperacao: 'text-amber-600 dark:text-amber-400',
  } as const)[atleta.value.saude]
})

function turmaNome(id: string) {
  return turmas.value.find((t) => t.id === id)?.nome ?? '—'
}

function cobrancaVariant(c: Cobranca): 'pago' | 'overdue' | 'pendente' | 'cancelado' {
  const hoje = new Date().toISOString().slice(0, 10)
  if (c.status === 'pago') return 'pago'
  if (c.status === 'pendente' && c.data_vencimento < hoje) return 'overdue'
  if (c.status === 'cancelado') return 'cancelado'
  return 'pendente'
}

async function desativar() {
  if (!atleta.value) return
  if (!window.confirm(`Desativar ${atleta.value.nome}?`)) return
  try {
    await atletasComp.desativar(atleta.value.id)
    toast.success('Atleta desativado', 'O histórico fica preservado.')
    await carregar()
  } catch (err: any) {
    toast.error('Falha ao desativar', err?.message ?? '')
  }
}

async function onSalvo() {
  abrirEdicao.value = false
  await carregar()
}
</script>
