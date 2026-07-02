<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/60"/>
      <div class="relative w-full sm:max-w-xl bg-white dark:bg-surface-elevated-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div class="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07]">
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ editando ? 'Editar turma' : 'Nova turma' }}</h2>
        </div>
        <form class="px-6 py-5 space-y-4 overflow-y-auto" @submit.prevent="salvar">
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
            <input v-model="form.nome" required maxlength="60" class="form-input" placeholder="Ex: Sub-12 Manhã"/>
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
            <textarea v-model="form.descricao" rows="2" maxlength="200" class="form-input"/>
          </div>

          <!-- Identidade visual -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Identidade da turma</label>
            <div class="flex items-center gap-3">
              <TurmasTurmaIcone :icone="form.icone" :cor="form.cor" size="lg"/>
              <div class="flex-1 space-y-2">
                <!-- Ícones -->
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="ic in TURMA_ICONES"
                    :key="ic.key"
                    type="button"
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-lg border transition-colors"
                    :class="form.icone === ic.key
                      ? 'border-brand-500 ring-2 ring-brand-400/30 bg-brand-50 dark:bg-brand-500/10'
                      : 'border-gray-200 dark:border-white/[0.10] hover:bg-gray-50 dark:hover:bg-white/[0.05]'"
                    :title="ic.label"
                    @click="form.icone = ic.key"
                  >{{ ic.emoji }}</button>
                </div>
                <!-- Cores -->
                <div class="flex items-center gap-2">
                  <button
                    v-for="c in TURMA_CORES"
                    :key="c.key"
                    type="button"
                    class="w-6 h-6 rounded-full transition-transform"
                    :class="[c.swatch, form.cor === c.key ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-surface-elevated-dark scale-110' : '']"
                    :title="c.label"
                    @click="form.cor = c.key"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Dias da semana *</label>
            <div class="flex gap-1.5">
              <button
                v-for="(d, i) in dias"
                :key="i"
                type="button"
                class="flex-1 py-2 rounded-lg text-xs font-bold transition-colors border"
                :class="form.dias_semana.includes(i)
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white dark:bg-surface-canvas-dark text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/[0.10] hover:bg-gray-50 dark:hover:bg-white/[0.05]'"
                @click="toggleDia(i)"
              >{{ d }}</button>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Início *</label>
              <input v-model="form.horario_inicio" type="time" required class="form-input"/>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Fim *</label>
              <input v-model="form.horario_fim" type="time" required class="form-input"/>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Local</label>
            <input v-model="form.local" maxlength="80" class="form-input" placeholder="Campo Principal, Quadra 2..."/>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Mensalidade padrão *
            </label>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-500 font-semibold">R$</span>
              <input
                v-model.number="form.valor_mensalidade_padrao"
                type="number"
                min="0"
                step="10"
                required
                class="form-input max-w-[180px]"
                placeholder="0,00"
              />
              <span class="text-xs text-gray-400">/mês por atleta</span>
            </div>
            <p class="text-xs text-gray-500 mt-1">Atletas podem ter valor individual diferente (bolsa, desconto).</p>
          </div>
        </form>

        <div class="px-6 py-3 border-t border-gray-100 dark:border-white/[0.07] flex justify-between gap-3 bg-gray-50 dark:bg-white/[0.02]">
          <button v-if="editando && turma?.ativo" type="button" class="text-xs font-semibold text-red-500 hover:text-red-700" @click="desativar">
            Desativar turma
          </button>
          <span v-else/>
          <div class="flex gap-2">
            <button type="button" class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100" @click="$emit('close')">Cancelar</button>
            <button type="button" :disabled="!podeSalvar || loading" class="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 bg-brand-600 hover:bg-brand-700 transition-colors" @click="salvar">
              {{ loading ? 'Salvando...' : (editando ? 'Salvar' : 'Criar turma') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import type { Turma } from '~/types'

const props = defineProps<{ turma?: Turma | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'salvo'): void }>()

const turmasComp = useTurmas()
const toast = useToast()
const { clube } = useAuth()
const { TURMA_ICONES, TURMA_CORES } = useTurmaVisual()

const editando = computed(() => !!props.turma)
const loading = ref(false)
const dias = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

const form = reactive({
  nome: props.turma?.nome ?? '',
  descricao: props.turma?.descricao ?? '',
  dias_semana: [...(props.turma?.dias_semana ?? [])] as number[],
  horario_inicio: (props.turma?.horario_inicio ?? '09:00').slice(0, 5),
  horario_fim: (props.turma?.horario_fim ?? '10:30').slice(0, 5),
  local: props.turma?.local ?? '',
  icone: props.turma?.icone ?? 'whistle',
  cor: props.turma?.cor ?? 'brand',
  valor_mensalidade_padrao: props.turma?.valor_mensalidade_padrao ?? 200,
})

const podeSalvar = computed(
  () =>
    form.nome.trim().length >= 2 &&
    form.dias_semana.length > 0 &&
    form.horario_inicio < form.horario_fim,
)

function toggleDia(i: number) {
  const idx = form.dias_semana.indexOf(i)
  if (idx >= 0) form.dias_semana.splice(idx, 1)
  else form.dias_semana.push(i)
  form.dias_semana.sort()
}

async function salvar() {
  if (!podeSalvar.value || !clube.value) return
  loading.value = true
  try {
    const payload = {
      clube_id: clube.value.id,
      nome: form.nome.trim(),
      descricao: form.descricao || null,
      dias_semana: [...form.dias_semana].sort(),
      horario_inicio: form.horario_inicio + ':00',
      horario_fim: form.horario_fim + ':00',
      local: form.local || null,
      icone: form.icone,
      cor: form.cor,
      ativo: true,
      valor_mensalidade_padrao: form.valor_mensalidade_padrao || 0,
    }
    if (editando.value && props.turma) {
      await turmasComp.atualizar(props.turma.id, payload)
      toast.success('Turma atualizada')
    } else {
      await turmasComp.criar(payload)
      toast.success('Turma criada')
    }
    emit('salvo')
  } catch (err: any) {
    toast.error('Falha ao salvar', err?.message ?? '')
  } finally {
    loading.value = false
  }
}

async function desativar() {
  if (!props.turma) return
  if (!window.confirm(`Desativar ${props.turma.nome}? Atletas vinculados serão desvinculados.`)) return
  loading.value = true
  try {
    await turmasComp.desativar(props.turma.id)
    toast.success('Turma desativada', 'Os dados históricos permanecem salvos.')
    emit('salvo')
  } catch (err: any) {
    toast.error('Falha ao desativar turma', err?.message ?? '')
  } finally {
    loading.value = false
  }
}
</script>

