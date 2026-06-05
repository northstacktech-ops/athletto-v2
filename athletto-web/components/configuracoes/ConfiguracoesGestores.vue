<template>
  <div class="space-y-4">
    <div class="card-base shadow-card overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-900 dark:text-white">Gestores do clube</h2>
          <p class="text-xs text-slate-500 mt-0.5">
            {{ gestoresAdicionais.length }}{{ limiteEval.limite !== null ? ` / ${limiteEval.limite}` : '' }} gestores adicionais no plano {{ clube?.plano ?? '—' }}
          </p>
        </div>
        <button disabled class="px-3 py-2 rounded-lg text-sm font-semibold text-white opacity-50 cursor-not-allowed inline-flex items-center gap-1.5 bg-brand-600" title="Disponível na Sprint 4">
          + Convidar gestor
        </button>
      </div>

      <ul class="divide-y divide-slate-100 dark:divide-white/[0.07]">
        <li v-if="gestor" class="flex items-center gap-3 px-5 py-3">
          <UiAvatar :nome="gestor.nome" size="sm" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ gestor.nome }} <span class="text-slate-400 font-normal">(você)</span></p>
            <p class="text-xs text-slate-500 truncate">{{ gestor.email }} · {{ gestor.role === 'principal' ? 'Gestor principal' : 'Adicional' }}</p>
          </div>
          <span class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 shrink-0">
            Ativo
          </span>
        </li>
      </ul>
    </div>

    <p class="text-xs text-slate-400 text-center">Convite e remoção de gestores adicionais liberado na Sprint 4.</p>
  </div>
</template>

<script setup lang="ts">
const { gestor, clube } = useAuth()
const planos = usePlanoLimites()

const gestoresAdicionais = ref<unknown[]>([])
const limiteEval = computed(() => planos.avaliarGestores(gestoresAdicionais.value.length))
</script>
