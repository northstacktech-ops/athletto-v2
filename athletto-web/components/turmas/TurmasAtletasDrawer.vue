<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50">
      <!-- Overlay clicável -->
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="$emit('close')"/>

      <aside class="absolute right-0 top-0 bottom-0 w-full sm:max-w-md bg-white dark:bg-surface-elevated-dark shadow-2xl flex flex-col h-full" @click.stop>

        <div class="px-6 pt-5 pb-4 border-b border-slate-100 dark:border-white/[0.07]">
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold text-slate-900 dark:text-white">Vincular atletas</h2>
              <p class="text-sm text-slate-500 mt-0.5">{{ turma.nome }} · {{ vinculadosAgora.length }} vinculado(s)</p>
            </div>
            <button class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.05]" @click="$emit('close')">
              <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="relative mt-3">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input v-model="busca" type="text" placeholder="Buscar atleta..." class="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-surface-canvas-dark text-sm"/>
          </div>
        </div>

        <div v-if="loading" class="p-5 space-y-2">
          <div v-for="i in 6" :key="i" class="skeleton h-12 rounded-lg"/>
        </div>

        <UiEmptyState v-else-if="filtrados.length === 0" title="Nenhum atleta" description="Cadastre atletas primeiro." size="sm"/>

        <ul v-else class="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.07]">
          <li v-for="a in filtrados" :key="a.id" class="flex items-center gap-3 px-5 py-2.5">
            <input
              type="checkbox"
              class="w-4 h-4 rounded"
              :checked="vinculados.has(a.id)"
              @change="toggle(a.id)"
            />
            <UiAvatar :src="a.foto_url" :nome="a.nome" size="sm" />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">{{ a.nome }}</p>
              <p class="text-xs text-slate-400 truncate">{{ a.posicao ?? 'Sem posição' }}</p>
            </div>
          </li>
        </ul>

        <div class="px-6 py-3 border-t border-slate-100 dark:border-white/[0.07] bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
          <p class="text-xs text-slate-500">
            <span class="font-bold text-slate-900 dark:text-white">{{ vinculados.size }}</span> selecionado(s)
          </p>
          <button :disabled="salvando" class="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 bg-brand-600 hover:bg-brand-700 transition-colors" @click="salvar">
            {{ salvando ? 'Salvando...' : 'Salvar vínculos' }}
          </button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Atleta, Turma } from '~/types'

const props = defineProps<{ turma: Turma }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'atualizado'): void }>()

const atletasComp = useAtletas()
const toast = useToast()

const loading = ref(true)
const salvando = ref(false)
const atletas = ref<Atleta[]>([])
const vinculados = ref<Set<string>>(new Set())
const vinculadosOriginais = ref<Set<string>>(new Set())
const busca = ref('')

const vinculadosAgora = computed(() => Array.from(vinculados.value))

async function carregar() {
  loading.value = true
  const { data: lista } = await atletasComp.listar()
  atletas.value = (lista ?? []).filter((a) => a.ativo)

  // Pega vínculos atuais
  const supabase = useSupabaseClient()
  const { data } = await supabase
    .from('atleta_turma')
    .select('atleta_id')
    .eq('turma_id', props.turma.id)
    .eq('ativo', true)
  const set = new Set((data ?? []).map((r: any) => r.atleta_id as string))
  vinculados.value = new Set(set)
  vinculadosOriginais.value = new Set(set)
  loading.value = false
}
onMounted(carregar)

const filtrados = computed(() => {
  if (!busca.value) return atletas.value
  const q = busca.value.toLowerCase()
  return atletas.value.filter(
    (a) =>
      a.nome.toLowerCase().includes(q) ||
      (a.apelido ?? '').toLowerCase().includes(q),
  )
})

function toggle(id: string) {
  if (vinculados.value.has(id)) vinculados.value.delete(id)
  else vinculados.value.add(id)
  vinculados.value = new Set(vinculados.value)
}

async function salvar() {
  salvando.value = true
  try {
    const para_adicionar = [...vinculados.value].filter((id) => !vinculadosOriginais.value.has(id))
    const para_remover = [...vinculadosOriginais.value].filter((id) => !vinculados.value.has(id))

    for (const id of para_adicionar) await atletasComp.vincularTurma(id, props.turma.id)
    for (const id of para_remover) await atletasComp.desvincularTurma(id, props.turma.id)

    toast.success('Vínculos atualizados', `+${para_adicionar.length} / −${para_remover.length}`)
    emit('atualizado')
  } catch (err: any) {
    toast.error('Falha ao salvar', err?.message ?? '')
  } finally {
    salvando.value = false
  }
}
</script>
