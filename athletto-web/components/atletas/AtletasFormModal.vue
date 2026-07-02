<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-black/60"/>
      <div class="relative w-full sm:max-w-2xl bg-white dark:bg-surface-elevated-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <div class="px-6 py-4 border-b border-gray-100 dark:border-white/[0.07] flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ editando ? 'Editar atleta' : 'Novo atleta' }}
            </h2>
            <p class="text-sm text-gray-500 mt-0.5">Dados do atleta e responsável</p>
          </div>
          <button class="p-1 text-gray-400 hover:text-gray-600" @click="$emit('close')">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <form class="px-6 py-5 space-y-4 overflow-y-auto" @submit.prevent="salvar">

          <!-- Foto do atleta -->
          <div class="flex items-center gap-4 pb-1">
            <BrandAvatarUploader
              :model-value="fotoUrl"
              label="Foto do atleta"
              shape="circle"
              :size="84"
              :uploading="uploadingFoto"
              :placeholder-iniciais="iniciaisAtleta"
              hide-meta
              @confirm="onFotoConfirm"
            />
            <div class="text-xs text-gray-500 dark:text-white/50 max-w-[220px]">
              <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">Foto do atleta</p>
              <p class="mt-0.5">PNG ou JPEG. Será recortada e salva em 512x512.</p>
            </div>
          </div>

          <!-- Nome -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Nome completo *</label>
            <input v-model="form.nome" type="text" required maxlength="120" class="form-input"/>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Apelido</label>
              <input v-model="form.apelido" type="text" maxlength="40" class="form-input"/>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Data nasc.</label>
              <input v-model="form.data_nascimento" type="date" class="form-input"/>
            </div>
          </div>

          <!-- CPF -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">CPF *</label>
            <input
              v-model="cpfMascarado"
              type="text"
              required
              maxlength="14"
              placeholder="000.000.000-00"
              class="form-input"
              :class="erroCpf ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10' : ''"
              @blur="validarCpfBlur"
            />
            <p v-if="erroCpf" class="mt-1 text-xs text-red-500">{{ erroCpf }}</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Posição</label>
              <input v-model="form.posicao" type="text" maxlength="40" class="form-input" placeholder="Ex: Meia, Atacante..."/>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Número da camisa</label>
              <input v-model="form.numero_camisa" type="text" maxlength="3" class="form-input"/>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select v-model="form.status" class="form-input">
                <option value="novato">Novato</option>
                <option value="titular">Titular</option>
                <option value="selecionado">Selecionado</option>
                <option value="afastado">Afastado</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Saúde</label>
              <select v-model="form.saude" class="form-input">
                <option value="saudavel">Saudável</option>
                <option value="lesionado">Lesionado</option>
                <option value="em_recuperacao">Em recuperação</option>
              </select>
            </div>
          </div>

          <!-- Contato responsável -->
          <div class="border-t border-gray-100 dark:border-white/[0.06] pt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Responsável & contato</p>
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Telefone do responsável</label>
                <input v-model="form.telefone_responsavel" type="tel" maxlength="20" placeholder="(11) 99999-9999" class="form-input"/>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Telefone do atleta</label>
                  <input v-model="form.telefone" type="tel" maxlength="20" class="form-input"/>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Tipo sanguíneo</label>
                  <select v-model="form.tipo_sanguineo" class="form-input">
                    <option :value="null">—</option>
                    <option v-for="t in ['A+','A-','B+','B-','AB+','AB-','O+','O-']" :key="t" :value="t">{{ t }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Turmas -->
          <div v-if="turmas.length > 0" class="border-t border-gray-100 dark:border-white/[0.06] pt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Vincular a turmas</p>
            <div class="space-y-1.5">
              <label v-for="t in turmas" :key="t.id" class="flex items-center gap-2 cursor-pointer">
                <input v-model="form.turmasIds" type="checkbox" :value="t.id" class="rounded w-4 h-4"/>
                <span class="text-sm text-gray-700 dark:text-gray-300">{{ t.nome }}</span>
                <span class="text-xs text-gray-400">· {{ formatDiasSemana(t.dias_semana) }} · R$ {{ (t.valor_mensalidade_padrao ?? 0).toFixed(0) }}/mês</span>
              </label>
            </div>
          </div>

          <!-- Mensalidade -->
          <div class="border-t border-gray-100 dark:border-white/[0.06] pt-4">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Mensalidade</p>
            <label class="flex items-center gap-2 cursor-pointer mb-2">
              <input v-model="mensalidadeCustom" type="checkbox" class="rounded w-4 h-4"/>
              <span class="text-sm text-gray-700 dark:text-gray-300">Valor personalizado (bolsa, desconto, etc.)</span>
            </label>
            <div v-if="mensalidadeCustom" class="flex items-center gap-2">
              <span class="text-sm text-gray-500 font-semibold">R$</span>
              <input
                v-model.number="form.valor_mensalidade"
                type="number"
                min="0"
                step="10"
                class="form-input max-w-[140px]"
                placeholder="0,00"
              />
              <span class="text-xs text-gray-400">/mês</span>
            </div>
            <p v-else class="text-xs text-gray-500">Será cobrado o valor padrão das turmas vinculadas.</p>
          </div>

          <!-- Observações médicas -->
          <div>
            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Observações médicas</label>
            <textarea v-model="form.observacoes_medicas" rows="2" maxlength="500" class="form-input"/>
          </div>

        </form>

        <div class="px-6 py-3 border-t border-gray-100 dark:border-white/[0.07] flex justify-between items-center gap-3 bg-gray-50 dark:bg-white/[0.02]">
          <button
            v-if="editando && atleta?.ativo"
            type="button"
            class="text-xs font-semibold text-red-500 hover:text-red-700"
            @click="desativar"
          >
            Desativar atleta
          </button>
          <span v-else/>
          <div class="flex gap-2">
            <button type="button" class="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-100" @click="$emit('close')">Cancelar</button>
            <button type="button" :disabled="!podeSalvar || loading" class="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 bg-brand-600 hover:bg-brand-700 transition-colors" @click="salvar">
              {{ loading ? 'Salvando...' : (editando ? 'Salvar alterações' : 'Cadastrar atleta') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { formatCpf, validarCpf, formatDiasSemana, formatHorario, getIniciais } from '~/utils/format'
import type { Atleta, AtletaStatus, AtletaSaude, Turma } from '~/types'

const props = defineProps<{
  atleta?: Atleta | null
  turmas: Turma[]
}>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'salvo'): void }>()

const atletasComp = useAtletas()
const toast = useToast()
const { clube } = useAuth()
const { uploadToBucket } = useImageUpload()

const editando = computed(() => !!props.atleta)
const loading = ref(false)
const erroCpf = ref<string | null>(null)

// ── Foto do atleta (mesmo caminho do app: {clube_id}/atletas/{atleta_id}.png) ──
const fotoUrl = ref<string | null>(props.atleta?.foto_url ?? null)
const fotoFile = ref<File | null>(null) // pendente p/ atleta novo (sem id ainda)
const uploadingFoto = ref(false)
const iniciaisAtleta = computed(() => getIniciais(form.nome || props.atleta?.nome || 'A'))

const cpfMascarado = ref(props.atleta?.cpf ? formatCpf(props.atleta.cpf) : '')

watch(cpfMascarado, (v) => {
  const onlyDigits = v.replace(/\D/g, '').slice(0, 11)
  let masked = onlyDigits
  if (onlyDigits.length > 3) masked = onlyDigits.slice(0, 3) + '.' + onlyDigits.slice(3)
  if (onlyDigits.length > 6) masked = onlyDigits.slice(0, 3) + '.' + onlyDigits.slice(3, 6) + '.' + onlyDigits.slice(6)
  if (onlyDigits.length > 9) masked = onlyDigits.slice(0, 3) + '.' + onlyDigits.slice(3, 6) + '.' + onlyDigits.slice(6, 9) + '-' + onlyDigits.slice(9, 11)
  if (masked !== v) cpfMascarado.value = masked
  form.cpf = onlyDigits
  if (onlyDigits.length === 11) erroCpf.value = validarCpf(onlyDigits) ? null : 'CPF inválido'
  else erroCpf.value = null
})

const mensalidadeCustom = ref(
  props.atleta?.valor_mensalidade !== null && props.atleta?.valor_mensalidade !== undefined,
)

const form = reactive({
  nome: props.atleta?.nome ?? '',
  apelido: props.atleta?.apelido ?? '',
  cpf: props.atleta?.cpf ?? '',
  data_nascimento: props.atleta?.data_nascimento ?? '',
  telefone: props.atleta?.telefone ?? '',
  telefone_responsavel: props.atleta?.telefone_responsavel ?? '',
  posicao: props.atleta?.posicao ?? '',
  numero_camisa: props.atleta?.numero_camisa ?? '',
  status: (props.atleta?.status ?? 'novato') as AtletaStatus,
  saude: (props.atleta?.saude ?? 'saudavel') as AtletaSaude,
  tipo_sanguineo: props.atleta?.tipo_sanguineo ?? null,
  observacoes_medicas: props.atleta?.observacoes_medicas ?? '',
  valor_mensalidade: (props.atleta?.valor_mensalidade ?? null) as number | null,
  turmasIds: [] as string[],
})

// Pre-load turmas vinculadas em modo edição
onMounted(async () => {
  if (props.atleta) {
    const { data } = await atletasComp.listarTurmas(props.atleta.id)
    if (data) form.turmasIds = data.map((d: any) => d.turma_id)
  }
})

const podeSalvar = computed(
  () => form.nome.trim().length >= 3 && validarCpf(form.cpf),
)

// Sobe a foto para o bucket `avatares` (caminho determinístico = foto única)
// e persiste a URL com cache-bust em atletas.foto_url.
async function subirFoto(atletaId: string, file: File): Promise<string> {
  if (!clube.value) throw new Error('Sem clube no contexto')
  const path = `${clube.value.id}/atletas/${atletaId}.png`
  const { url, error } = await uploadToBucket('avatares', path, file)
  if (error || !url) throw error ?? new Error('Falha no upload da foto')
  const { error: updErr } = await atletasComp.atualizar(atletaId, { foto_url: url })
  if (updErr) throw updErr
  return url
}

async function onFotoConfirm(file: File) {
  // Edição: sobe direto (já temos id). Novo: guarda p/ depois do cadastro.
  if (editando.value && props.atleta) {
    uploadingFoto.value = true
    try {
      fotoUrl.value = await subirFoto(props.atleta.id, file)
      toast.success('Foto atualizada')
    } catch (err: any) {
      toast.error('Falha no upload', err?.message ?? '')
    } finally {
      uploadingFoto.value = false
    }
  } else {
    fotoFile.value = file
    fotoUrl.value = URL.createObjectURL(file)
  }
}

function validarCpfBlur() {
  if (form.cpf.length === 11) {
    erroCpf.value = validarCpf(form.cpf) ? null : 'CPF inválido'
  } else if (form.cpf.length > 0) {
    erroCpf.value = 'CPF incompleto'
  }
}

async function salvar() {
  if (!podeSalvar.value || !clube.value) return
  loading.value = true
  try {
    if (editando.value && props.atleta) {
      const { error: updErr } = await atletasComp.atualizar(props.atleta.id, {
        nome: form.nome.trim(),
        apelido: form.apelido || null,
        cpf: form.cpf,
        data_nascimento: form.data_nascimento || null,
        telefone: form.telefone || null,
        telefone_responsavel: form.telefone_responsavel || null,
        posicao: form.posicao || null,
        numero_camisa: form.numero_camisa || null,
        status: form.status,
        saude: form.saude,
        tipo_sanguineo: form.tipo_sanguineo,
        observacoes_medicas: form.observacoes_medicas || null,
        valor_mensalidade: mensalidadeCustom.value ? (form.valor_mensalidade ?? 0) : null,
      })
      if (updErr) throw updErr
      await sincronizarTurmas(props.atleta.id)
      toast.success('Atleta atualizado')
    } else {
      const { data, error } = await atletasComp.criar({
        clube_id: clube.value.id,
        nome: form.nome.trim(),
        apelido: form.apelido || null,
        cpf: form.cpf,
        data_nascimento: form.data_nascimento || null,
        telefone: form.telefone || null,
        telefone_responsavel: form.telefone_responsavel || null,
        email: null,
        foto_url: null,
        posicao: form.posicao || null,
        numero_camisa: form.numero_camisa || null,
        status: form.status,
        saude: form.saude,
        tipo_sanguineo: form.tipo_sanguineo,
        historico_lesoes: [],
        observacoes_medicas: form.observacoes_medicas || null,
        data_entrada: new Date().toISOString().slice(0, 10),
        ativo: true,
        app_primeiro_acesso: true,
        valor_mensalidade: mensalidadeCustom.value ? (form.valor_mensalidade ?? 0) : null,
      })
      if (error || !data) throw error ?? new Error('Não foi possível cadastrar o atleta')
      await sincronizarTurmas(data.id)
      // Foto pendente: agora temos o id → sobe e grava foto_url.
      if (fotoFile.value) {
        try {
          await subirFoto(data.id, fotoFile.value)
        } catch (errFoto: any) {
          toast.error('Atleta criado, mas a foto falhou', errFoto?.message ?? '')
        }
      }
      toast.success('Atleta cadastrado')
    }
    emit('salvo')
  } catch (err: any) {
    toast.error('Falha ao salvar', err?.message ?? '')
  } finally {
    loading.value = false
  }
}

async function sincronizarTurmas(atletaId: string) {
  // Aplica as diferenças (adicionar/remover) e PROPAGA qualquer erro, para que
  // o usuário veja a falha em vez de um "sucesso" falso.
  const { data: atuais } = await atletasComp.listarTurmas(atletaId)
  const atuaisIds = new Set((atuais ?? []).map((d: any) => d.turma_id))
  const desejados = new Set(form.turmasIds)

  for (const id of form.turmasIds) {
    if (!atuaisIds.has(id)) {
      const { error } = await atletasComp.vincularTurma(atletaId, id)
      if (error) throw error
    }
  }
  for (const id of atuaisIds) {
    if (!desejados.has(id)) {
      const { error } = await atletasComp.desvincularTurma(atletaId, id)
      if (error) throw error
    }
  }
}

async function desativar() {
  if (!props.atleta) return
  if (!window.confirm(`Desativar ${props.atleta.nome}? Você pode reativar depois.`)) return
  loading.value = true
  try {
    await atletasComp.desativar(props.atleta.id)
    toast.success('Atleta desativado', 'O histórico fica preservado.')
    emit('salvo')
  } catch (err: any) {
    toast.error('Falha ao desativar', err?.message ?? '')
  } finally {
    loading.value = false
  }
}
</script>

