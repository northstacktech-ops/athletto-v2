<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/60"/>
      <div class="relative w-full sm:max-w-xl bg-white dark:bg-surface-elevated-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-center justify-between gap-2">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ editando ? 'Editar evento' : 'Novo evento' }}</h2>
          <button class="p-1 text-gray-400 hover:text-gray-600" @click="$emit('close')">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form class="px-6 py-5 space-y-4 overflow-y-auto" @submit.prevent="salvar">
          <div>
            <label class="block text-sm font-semibold mb-1">Tipo</label>
            <div class="flex gap-2">
              <button
                type="button"
                v-for="t in (['treino', 'evento'] as const)"
                :key="t"
                class="flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors"
                :class="form.tipo === t
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-surface-canvas-dark text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/[0.10]'"
                @click="form.tipo = t"
              >
                {{ t === 'treino' ? 'Treino' : 'Evento / Jogo' }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-1">Título *</label>
            <input v-model="form.titulo" required maxlength="80" class="form-input" placeholder="Ex: Jogo amistoso vs ABC FC"/>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div class="col-span-2">
              <label class="block text-sm font-semibold mb-1">Data *</label>
              <input v-model="form.data" type="date" required class="form-input"/>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">Início</label>
              <input v-model="form.horaInicio" type="time" class="form-input"/>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-1">Hora fim (opcional)</label>
            <input v-model="form.horaFim" type="time" class="form-input"/>
          </div>

          <!-- ── Turmas vinculadas (multi) ───────────────────────────── -->
          <div>
            <label class="block text-sm font-semibold mb-1.5">
              Turmas vinculadas
              <span v-if="form.turma_ids.length" class="text-xs font-medium text-slate-400">· {{ form.turma_ids.length }} selecionada(s)</span>
            </label>
            <div v-if="turmas.length === 0" class="text-xs text-slate-400">Nenhuma turma cadastrada.</div>
            <div v-else class="flex flex-wrap gap-1.5">
              <button
                v-for="t in turmas"
                :key="t.id"
                type="button"
                class="px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors"
                :class="form.turma_ids.includes(t.id)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-surface-canvas-dark text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.10] hover:border-brand-400'"
                @click="toggleTurma(t.id)"
              >
                {{ t.nome }}
              </button>
            </div>
          </div>

          <!-- ── Atletas vinculados (multi) ──────────────────────────── -->
          <div>
            <label class="block text-sm font-semibold mb-1.5">
              Atletas vinculados
              <span v-if="form.atleta_ids.length" class="text-xs font-medium text-slate-400">· {{ form.atleta_ids.length }} selecionado(s)</span>
            </label>

            <div class="relative mb-2">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input v-model="buscaAtleta" type="text" placeholder="Buscar atleta..." class="form-input pl-9 w-full"/>
            </div>

            <div v-if="atletas.length === 0" class="text-xs text-slate-400">Nenhum atleta cadastrado.</div>
            <div v-else class="max-h-44 overflow-y-auto rounded-lg border border-slate-200 dark:border-white/[0.08] divide-y divide-slate-100 dark:divide-white/[0.06]">
              <label
                v-for="a in atletasFiltrados"
                :key="a.id"
                class="flex items-center gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.03]"
              >
                <input
                  type="checkbox"
                  class="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  :checked="form.atleta_ids.includes(a.id)"
                  @change="toggleAtleta(a.id)"
                />
                <UiAvatar :nome="a.nome" :src="a.foto_url" :numero="a.numero_camisa" size="xs"/>
                <span class="text-sm text-slate-700 dark:text-slate-200 truncate">{{ a.nome }}</span>
                <span v-if="a.posicao" class="ml-auto text-xs text-slate-400 shrink-0">{{ a.posicao }}</span>
              </label>
              <p v-if="atletasFiltrados.length === 0" class="px-3 py-3 text-xs text-slate-400 text-center">Nenhum atleta encontrado.</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold mb-1">Descrição</label>
            <textarea v-model="form.descricao" rows="2" maxlength="300" class="form-input"/>
          </div>
        </form>

        <div class="px-6 py-3 border-t border-slate-100 dark:border-white/[0.07] flex justify-between gap-3 bg-slate-50 dark:bg-white/[0.02] shrink-0">
          <button v-if="editando" type="button" class="text-xs font-semibold text-red-500 hover:text-red-700" @click="excluir">
            Excluir evento
          </button>
          <span v-else/>
          <div class="flex gap-2">
            <button type="button" class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors" @click="$emit('close')">Cancelar</button>
            <button type="button" :disabled="!podeSalvar || loading" class="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 bg-brand-600 hover:bg-brand-700 transition-colors" @click="salvar">
              {{ loading ? 'Salvando...' : (editando ? 'Salvar' : 'Criar evento') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { EventoCalendario, Turma, Atleta } from '~/types'

const props = defineProps<{
  evento?: EventoCalendario | null
  dataInicial?: string | null
  turmas: Turma[]
  atletas: Atleta[]
}>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'salvo'): void; (e: 'excluido'): void }>()

const calComp = useCalendario()
const { clube } = useAuth()
const toast = useToast()

const editando = computed(() => !!props.evento && !props.evento.id.startsWith('treino-'))
const loading = ref(false)
const buscaAtleta = ref('')

function splitIso(iso: string | null | undefined): { data: string; hora: string } {
  if (!iso) return { data: '', hora: '' }
  return { data: iso.slice(0, 10), hora: iso.includes('T') ? iso.slice(11, 16) : '' }
}

const inicial = splitIso(props.evento?.data_inicio)
const final = splitIso(props.evento?.data_fim)

// Turmas iniciais: usa o array novo; cai pro turma_id antigo se existir.
const turmasIniciais = props.evento?.turma_ids?.length
  ? [...props.evento.turma_ids]
  : (props.evento?.turma_id ? [props.evento.turma_id] : [])

const form = reactive({
  tipo: (props.evento?.tipo ?? 'evento') as 'treino' | 'evento',
  titulo: props.evento?.titulo ?? '',
  data: inicial.data || props.dataInicial || new Date().toISOString().slice(0, 10),
  horaInicio: inicial.hora || '',
  horaFim: final.hora || '',
  turma_ids: turmasIniciais as string[],
  atleta_ids: (props.evento?.atleta_ids ? [...props.evento.atleta_ids] : []) as string[],
  descricao: props.evento?.descricao ?? '',
})

const atletasFiltrados = computed(() => {
  if (!buscaAtleta.value) return props.atletas
  const q = buscaAtleta.value.toLowerCase()
  return props.atletas.filter(
    (a) => a.nome.toLowerCase().includes(q) || (a.apelido ?? '').toLowerCase().includes(q),
  )
})

function toggleTurma(id: string) {
  const i = form.turma_ids.indexOf(id)
  if (i === -1) form.turma_ids.push(id)
  else form.turma_ids.splice(i, 1)
}

function toggleAtleta(id: string) {
  const i = form.atleta_ids.indexOf(id)
  if (i === -1) form.atleta_ids.push(id)
  else form.atleta_ids.splice(i, 1)
}

const podeSalvar = computed(() => form.titulo.trim().length >= 2 && !!form.data)

async function salvar() {
  if (!podeSalvar.value || !clube.value) return
  loading.value = true
  try {
    const inicio = form.horaInicio ? `${form.data}T${form.horaInicio}:00` : `${form.data}T00:00:00`
    const fim = form.horaFim ? `${form.data}T${form.horaFim}:00` : null

    const payload = {
      titulo: form.titulo.trim(),
      descricao: form.descricao || null,
      tipo: form.tipo,
      data_inicio: inicio,
      data_fim: fim,
      turma_id: form.turma_ids[0] ?? null, // compat
      turma_ids: [...form.turma_ids],
      atleta_ids: [...form.atleta_ids],
    }

    if (editando.value && props.evento) {
      await calComp.atualizar(props.evento.id, payload)
      toast.success('Evento atualizado')
    } else {
      await calComp.criar({ clube_id: clube.value.id, ...payload })
      toast.success('Evento criado')
    }
    emit('salvo')
  } catch (err: any) {
    toast.error('Falha ao salvar', err?.message ?? '')
  } finally {
    loading.value = false
  }
}

async function excluir() {
  if (!props.evento || !editando.value) return
  if (!window.confirm(`Excluir "${props.evento.titulo}"?`)) return
  loading.value = true
  try {
    await calComp.excluir(props.evento.id)
    toast.success('Evento excluído')
    emit('excluido')
  } catch (err: any) {
    toast.error('Falha ao excluir evento', err?.message ?? '')
  } finally {
    loading.value = false
  }
}
</script>
