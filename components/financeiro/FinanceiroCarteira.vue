<template>
  <div class="space-y-5 animate-fade-in">

    <!-- Subconta não aprovada -->
    <div v-if="subcontaAprovada === false" class="card-base p-6 flex gap-4">
      <div class="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-5 h-5 text-amber-600"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>
      <div>
        <p class="font-semibold text-slate-900 dark:text-white text-sm">Conta de recebimento não configurada</p>
        <p class="text-xs text-slate-500 mt-1">Configure sua subconta ValidaPay em <strong>Configurações → Pagamentos</strong> para receber pagamentos e acessar sua carteira.</p>
      </div>
    </div>

    <template v-else>

      <!-- Card de Saldo -->
      <div class="card-base overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between">
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Saldo disponível</h2>
          <button
            class="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            :disabled="carregandoSaldo"
            @click="recarregarSaldo"
          >
            <svg :class="carregandoSaldo ? 'animate-spin' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
            Atualizar
          </button>
        </div>

        <div class="px-5 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
          <div class="flex-1">
            <template v-if="carregandoSaldo">
              <div class="h-9 w-48 rounded-lg bg-slate-100 dark:bg-white/[0.06] animate-pulse" />
            </template>
            <template v-else-if="erroSaldo">
              <p class="text-sm text-red-500">{{ erroSaldo }}</p>
              <p class="text-xs text-slate-400 mt-0.5">Tente atualizar novamente.</p>
            </template>
            <template v-else>
              <p class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {{ saldo !== null ? formatCurrency(saldo) : '—' }}
              </p>
              <p class="text-xs text-slate-400 mt-1">{{ saldo !== null ? 'Atualizado agora' : 'Não foi possível carregar o saldo.' }}</p>
            </template>
          </div>

          <button
            v-if="podeGestorSacar"
            class="shrink-0 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition-colors"
            @click="modalSaque = true"
          >
            Solicitar saque
          </button>
        </div>
      </div>

      <!-- Histórico de saques -->
      <div class="card-base overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07]">
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Histórico de saques</h2>
        </div>

        <div v-if="carregandoSaques" class="p-5 space-y-3">
          <div v-for="i in 2" :key="i" class="h-12 rounded-lg bg-slate-100 dark:bg-white/[0.06] animate-pulse" />
        </div>

        <div v-else-if="saques.length === 0" class="px-5 py-8 text-center">
          <p class="text-sm text-slate-400">Nenhum saque solicitado ainda.</p>
        </div>

        <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <li v-for="s in saques" :key="s.id" class="px-5 py-3.5 flex items-center gap-3">
            <div
              :class="{
                'bg-amber-100 dark:bg-amber-500/10 text-amber-600': s.status === 'pendente' || s.status === 'processando',
                'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600': s.status === 'concluido',
                'bg-red-100 dark:bg-red-500/10 text-red-600': s.status === 'recusado',
              }"
              class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4">
                <path v-if="s.status === 'concluido'" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                <path v-else-if="s.status === 'recusado'" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                <path v-else d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>

            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 dark:text-white">{{ formatCurrency(s.valor) }}</p>
              <p class="text-xs text-slate-400 truncate">
                {{ s.tipo === 'pix' ? `Pix · ${s.chave_pix ?? ''}` : `TED · ${s.banco ?? ''}` }}
                · {{ formatarData(s.solicitado_em) }}
              </p>
              <p v-if="s.ultimo_erro && s.status === 'recusado'" class="text-xs text-red-500 mt-0.5 truncate">{{ s.ultimo_erro }}</p>
            </div>

            <span
              :class="{
                'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300': s.status === 'pendente' || s.status === 'processando',
                'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300': s.status === 'concluido',
                'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-300': s.status === 'recusado',
              }"
              class="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize"
            >
              {{ s.status === 'processando' ? 'Processando' : s.status === 'pendente' ? 'Pendente' : s.status === 'concluido' ? 'Concluído' : 'Recusado' }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Extrato ValidaPay -->
      <div class="card-base overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Extrato da subconta</h2>
            <p class="text-xs text-slate-400 mt-0.5">Entradas e saídas registradas pela ValidaPay</p>
          </div>
          <div class="flex gap-2">
            <button v-if="paginaExtrato > 1" class="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" @click="carregarExtrato(paginaExtrato - 1)">← Anterior</button>
            <button class="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300" @click="carregarExtrato(paginaExtrato + 1)">Próxima →</button>
          </div>
        </div>

        <div v-if="carregandoExtrato" class="p-5 space-y-3">
          <div v-for="i in 3" :key="i" class="h-12 rounded-lg bg-slate-100 dark:bg-white/[0.06] animate-pulse" />
        </div>

        <div v-else-if="erroExtrato" class="px-5 py-8 text-center">
          <p class="text-sm text-slate-400">{{ erroExtrato }}</p>
          <p class="text-xs text-slate-400 mt-1">Este recurso estará disponível em breve.</p>
        </div>

        <div v-else-if="extrato.length === 0" class="px-5 py-8 text-center">
          <p class="text-sm text-slate-400">Nenhuma transação encontrada.</p>
        </div>

        <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.06]">
          <li v-for="t in extrato" :key="t.id" class="px-5 py-3.5 flex items-center gap-3">
            <div class="w-2 h-2 rounded-full shrink-0" :class="t.tipo === 'entrada' || t.tipo === 'credit' ? 'bg-emerald-500' : 'bg-slate-300'" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-900 dark:text-white truncate">{{ t.descricao || 'Transação' }}</p>
              <p class="text-xs text-slate-400">{{ t.data ? formatarData(t.data) : '' }}</p>
            </div>
            <span :class="t.tipo === 'entrada' || t.tipo === 'credit' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'"
              class="text-sm font-semibold shrink-0">
              {{ (t.tipo === 'entrada' || t.tipo === 'credit') ? '+' : '−' }} {{ formatCurrency(t.valor) }}
            </span>
          </li>
        </ul>
      </div>

    </template>

    <!-- Modal de saque -->
    <FinanceiroSaqueModal
      v-if="modalSaque"
      :saldo-disponivel="saldo"
      @close="modalSaque = false"
      @confirmado="onSaqueConfirmado"
    />
  </div>
</template>

<script setup lang="ts">
import { formatCurrency } from '~/utils/format'

const { gestor } = useAuth()
const podeGestorSacar = computed(() => gestor.value?.role === 'principal')

const carteira = useCarteira()
const { saldo, subcontaAprovada, erroSaldo, carregandoSaldo, extrato, erroExtrato, carregandoExtrato, paginaExtrato, saques, carregandoSaques } = carteira

const modalSaque = ref(false)

onMounted(async () => {
  await Promise.all([
    carteira.carregarSaldo(),
    carteira.carregarSaques(),
    carteira.carregarExtrato(),
  ])
})

async function recarregarSaldo() {
  await carteira.carregarSaldo()
}

async function carregarExtrato(pagina: number) {
  await carteira.carregarExtrato(pagina)
}

async function onSaqueConfirmado() {
  modalSaque.value = false
  await Promise.all([carteira.carregarSaldo(), carteira.carregarSaques()])
}

function formatarData(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}
</script>
