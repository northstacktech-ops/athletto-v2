<template>
  <div class="space-y-4">
    <!-- Lista de gestores -->
    <div class="card-base shadow-card overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-bold text-slate-900 dark:text-white">Gestores do clube</h2>
          <p class="text-xs text-slate-500 mt-0.5">{{ gestores.length }} / 3 gestores ativos</p>
        </div>
        <button
          v-if="ehPrincipal"
          :disabled="gestores.length >= 3"
          class="px-3 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
          :title="gestores.length >= 3 ? 'Limite de 3 gestores atingido' : ''"
          @click="abrirConvite = true"
        >
          + Convidar gestor
        </button>
      </div>

      <div v-if="loading" class="p-5 space-y-2">
        <div v-for="i in 2" :key="i" class="skeleton h-14 rounded-lg"/>
      </div>
      <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.07]">
        <li v-for="g in gestores" :key="g.id" class="flex items-center gap-3 px-5 py-3">
          <UiAvatar :nome="g.nome" :src="g.foto_url" size="sm"/>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {{ g.nome }}<span v-if="g.id === gestor?.id" class="text-slate-400 font-normal"> (você)</span>
            </p>
            <p class="text-xs text-slate-500 truncate">{{ g.email }} · {{ g.role === 'principal' ? 'Gestor principal' : 'Adicional' }}</p>
          </div>
          <span
            class="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
            :class="g.precisa_definir_senha
              ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'"
          >
            {{ g.precisa_definir_senha ? 'Aguardando 1º acesso' : 'Ativo' }}
          </span>
          <button
            v-if="ehPrincipal && g.role !== 'principal'"
            class="text-xs font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0"
            :disabled="removendo === g.id"
            @click="remover(g)"
          >
            {{ removendo === g.id ? '...' : 'Remover' }}
          </button>
        </li>
      </ul>
    </div>

    <p v-if="!ehPrincipal" class="text-xs text-slate-400 text-center">
      Só o gestor principal pode convidar ou remover gestores.
    </p>

    <!-- Logs de gestão -->
    <div class="card-base shadow-card overflow-hidden">
      <div class="px-5 py-4 border-b border-slate-100 dark:border-white/[0.07]">
        <h2 class="text-base font-bold text-slate-900 dark:text-white">Logs de gestão</h2>
        <p class="text-xs text-slate-500 mt-0.5">Ações recentes da equipe neste clube</p>
      </div>
      <div v-if="logs.length === 0" class="px-5 py-6 text-sm text-slate-400 italic text-center">
        Nenhuma ação registrada ainda.
      </div>
      <ul v-else class="divide-y divide-slate-100 dark:divide-white/[0.07] max-h-80 overflow-y-auto">
        <li v-for="l in logs" :key="l.id" class="px-5 py-2.5 text-sm flex items-center gap-3">
          <span class="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0"/>
          <span class="flex-1 min-w-0 truncate text-slate-700 dark:text-slate-200">
            <b>{{ l.gestor_nome ?? 'Alguém' }}</b> — {{ rotuloAcao(l.acao) }}
            <span v-if="l.entidade" class="text-slate-400">({{ l.entidade }})</span>
          </span>
          <span class="text-xs text-slate-400 shrink-0">{{ formatDate(l.criado_em.slice(0,10)) }}</span>
        </li>
      </ul>
    </div>

    <!-- Modal convite -->
    <Teleport to="body">
      <div v-if="abrirConvite" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" @click.self="abrirConvite = false">
        <div class="absolute inset-0 bg-black/60"/>
        <div class="relative w-full sm:max-w-lg bg-white dark:bg-surface-elevated-dark rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
          <div class="px-6 py-4 border-b border-slate-100 dark:border-white/[0.07]">
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Convidar gestor</h3>
            <p class="text-sm text-slate-500 mt-0.5">Ele acessa em <b>/primeiro-acesso</b> com o e-mail e cria a própria senha. Sem e-mail/SMS.</p>
          </div>
          <div class="px-6 py-5 space-y-4 overflow-y-auto">
            <div>
              <label class="block text-sm font-semibold mb-1">Nome *</label>
              <input v-model="form.nome" maxlength="120" class="form-input" placeholder="Nome do gestor"/>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-1">E-mail *</label>
              <input v-model="form.email" type="email" class="form-input" placeholder="email@exemplo.com"/>
            </div>
            <div>
              <label class="block text-sm font-semibold mb-2">Permissões por módulo</label>
              <div class="space-y-1.5">
                <div v-for="m in MODULOS" :key="m.key" class="flex items-center justify-between gap-2">
                  <span class="text-sm text-slate-700 dark:text-slate-300">{{ m.label }}</span>
                  <div class="inline-flex rounded-lg overflow-hidden border border-slate-200 dark:border-white/[0.10]">
                    <button
                      v-for="opt in NIVEIS"
                      :key="opt.key"
                      type="button"
                      class="px-2.5 py-1 text-xs font-semibold transition-colors"
                      :class="(form.permissoes[m.key] ?? 'nenhum') === opt.key
                        ? 'bg-brand-600 text-white'
                        : 'bg-white dark:bg-surface-canvas-dark text-slate-500 hover:bg-slate-50 dark:hover:bg-white/[0.05]'"
                      @click="setNivel(m.key, opt.key)"
                    >{{ opt.label }}</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="px-6 py-3 border-t border-slate-100 dark:border-white/[0.07] flex justify-end gap-2 bg-slate-50 dark:bg-white/[0.02]">
            <button class="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100" @click="abrirConvite = false">Cancelar</button>
            <button :disabled="!podeConvidar || enviando" class="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50" @click="convidar">
              {{ enviando ? 'Convidando...' : 'Convidar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/utils/format'
import type { Gestor } from '~/types'

const { gestor } = useAuth()
const equipe = useEquipe()
const toast = useToast()

const MODULOS = [
  { key: 'atletas', label: 'Atletas' },
  { key: 'turmas', label: 'Turmas' },
  { key: 'frequencia', label: 'Frequência' },
  { key: 'financeiro', label: 'Financeiro' },
  { key: 'calendario', label: 'Calendário' },
  { key: 'configuracoes', label: 'Configurações' },
]
const NIVEIS = [
  { key: 'nenhum', label: 'Sem acesso' },
  { key: 'ver', label: 'Ver' },
  { key: 'editar', label: 'Editar' },
]

const ehPrincipal = computed(() => gestor.value?.role === 'principal')
const loading = ref(true)
const gestores = ref<Gestor[]>([])
const logs = ref<any[]>([])
const removendo = ref<string | null>(null)

const abrirConvite = ref(false)
const enviando = ref(false)
const form = reactive<{ nome: string; email: string; permissoes: Record<string, string> }>({
  nome: '',
  email: '',
  permissoes: { atletas: 'ver', turmas: 'ver', frequencia: 'ver', financeiro: 'nenhum', calendario: 'ver', configuracoes: 'nenhum' },
})

const podeConvidar = computed(() => form.nome.trim().length >= 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))

function setNivel(modulo: string, nivel: string) {
  form.permissoes[modulo] = nivel
}

function rotuloAcao(a: string) {
  return ({
    convidou_gestor: 'convidou um gestor',
    removeu_gestor: 'removeu um gestor',
  } as Record<string, string>)[a] ?? a.replace(/_/g, ' ')
}

async function carregar() {
  loading.value = true
  const [{ data: gs }, { data: lg }] = await Promise.all([equipe.listarGestores(), equipe.listarLogs()])
  gestores.value = (gs ?? []).filter((g) => g.ativo)
  logs.value = lg ?? []
  loading.value = false
}
onMounted(carregar)

async function convidar() {
  if (!podeConvidar.value) return
  enviando.value = true
  // Remove módulos "nenhum" antes de enviar.
  const permissoes: Record<string, string> = {}
  for (const [k, v] of Object.entries(form.permissoes)) if (v && v !== 'nenhum') permissoes[k] = v
  const { error } = await equipe.convidar({ nome: form.nome.trim(), email: form.email.trim().toLowerCase(), permissoes })
  enviando.value = false
  if (error) {
    toast.error('Falha ao convidar', String(error))
    return
  }
  toast.success('Gestor convidado', 'Ele acessa em /primeiro-acesso para criar a senha.')
  abrirConvite.value = false
  form.nome = ''
  form.email = ''
  await carregar()
}

async function remover(g: Gestor) {
  if (!window.confirm(`Remover ${g.nome}? Ele perde o acesso ao clube.`)) return
  removendo.value = g.id
  const { error } = await equipe.remover(g.id)
  removendo.value = null
  if (error) {
    toast.error('Falha ao remover', String(error))
    return
  }
  toast.success('Gestor removido')
  await carregar()
}
</script>
