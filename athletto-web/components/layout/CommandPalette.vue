<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center px-4 pt-[12vh]"
        @click.self="hide"
      >
        <div
          class="w-full max-w-xl rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-surface-overlay-dark overflow-hidden animate-scale-in"
        >
          <!-- Search input -->
          <div class="flex items-center gap-3 px-4 h-14 border-b border-gray-100 dark:border-white/[0.06]">
            <svg class="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Busque atletas, turmas, ações..."
              class="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none"
              @keydown="onKeydown"
            />
            <kbd class="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400">
              ESC
            </kbd>
          </div>

          <!-- Results -->
          <div class="max-h-[60vh] overflow-y-auto scrollbar-slim py-2">
            <div v-if="results.length === 0" class="py-10 text-center">
              <p class="text-sm text-gray-400 dark:text-gray-500">Nada encontrado para "{{ query }}"</p>
            </div>

            <template v-for="(section, si) in results" :key="si">
              <div class="px-4 pt-3 pb-1.5">
                <span class="section-label text-gray-400 dark:text-gray-500">{{ section.label }}</span>
              </div>
              <ul>
                <li
                  v-for="(item, idx) in section.items"
                  :key="item.id"
                  :data-index="getGlobalIndex(si, idx)"
                  class="px-2"
                >
                  <button
                    type="button"
                    class="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors"
                    :class="getGlobalIndex(si, idx) === selectedIndex
                      ? 'bg-brand-50 dark:bg-brand-500/15'
                      : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'"
                    @click="executeItem(item)"
                    @mouseenter="selectedIndex = getGlobalIndex(si, idx)"
                  >
                    <div
                      class="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                      :class="getGlobalIndex(si, idx) === selectedIndex
                        ? 'bg-brand-600 text-white'
                        : 'bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400'"
                    >
                      <svg v-if="item.icon === 'arrow'" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M5 12h14M13 5l7 7-7 7"/>
                      </svg>
                      <svg v-else-if="item.icon === 'user'" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 3a4 4 0 110 8 4 4 0 010-8z"/>
                      </svg>
                      <svg v-else-if="item.icon === 'plus'" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 5v14M5 12h14"/>
                      </svg>
                      <svg v-else-if="item.icon === 'check'" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      <svg v-else-if="item.icon === 'money'" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                      </svg>
                      <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/>
                      </svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ item.label }}</p>
                      <p v-if="item.hint" class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ item.hint }}</p>
                    </div>
                    <kbd v-if="item.shortcut" class="text-xs font-mono font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-gray-400">
                      {{ item.shortcut }}
                    </kbd>
                  </button>
                </li>
              </ul>
            </template>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-white/[0.06] text-xs text-gray-400 dark:text-gray-500">
            <div class="flex items-center gap-3">
              <span class="flex items-center gap-1">
                <kbd class="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] font-mono">↑↓</kbd>
                navegar
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1 py-0.5 rounded bg-gray-100 dark:bg-white/[0.06] font-mono">↵</kbd>
                selecionar
              </span>
            </div>
            <span class="hidden sm:block">{{ totalItems }} resultado(s)</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
type CmdItem = {
  id: string
  label: string
  hint?: string
  icon?: string
  shortcut?: string
  to?: string
  action?: () => void
}

type CmdSection = {
  label: string
  items: CmdItem[]
}

const { open, hide } = useCommandPalette()
const router = useRouter()
const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const selectedIndex = ref(0)

// ── Data sources ──────────────────────────────────────────────
const atletas = ref<any[]>([])
const turmas = ref<any[]>([])
const dashboard = useDashboard()

async function loadData() {
  const [a, t] = await Promise.all([
    dashboard.atletasRecentes(50),
    dashboard.turmasHoje(),
  ])
  if (a.data) atletas.value = a.data
  if (t.data) turmas.value = t.data as any[]
}

watch(open, (isOpen) => {
  if (isOpen) {
    query.value = ''
    selectedIndex.value = 0
    loadData()
    nextTick(() => inputRef.value?.focus())
  }
})

// ── Search + sections ─────────────────────────────────────────
const allActions = computed<CmdItem[]>(() => [
  { id: 'a1', label: 'Cadastrar novo atleta', hint: 'Atletas', icon: 'plus', to: '/atletas' },
  { id: 'a2', label: 'Criar nova turma', hint: 'Turmas', icon: 'plus', to: '/turmas' },
  { id: 'a3', label: 'Registrar presença', hint: 'Frequência', icon: 'check', to: '/frequencia' },
  { id: 'a4', label: 'Nova cobrança', hint: 'Financeiro', icon: 'money', to: '/financeiro' },
])

const allNav = computed<CmdItem[]>(() => [
  { id: 'n1', label: 'Painel', icon: 'arrow', to: '/' },
  { id: 'n2', label: 'Atletas', icon: 'arrow', to: '/atletas' },
  { id: 'n3', label: 'Turmas', icon: 'arrow', to: '/turmas' },
  { id: 'n4', label: 'Frequência', icon: 'arrow', to: '/frequencia' },
  { id: 'n5', label: 'Calendário', icon: 'arrow', to: '/calendario' },
  { id: 'n6', label: 'Financeiro', icon: 'arrow', to: '/financeiro' },
  { id: 'n7', label: 'Configurações', icon: 'arrow', to: '/configuracoes' },
])

const results = computed<CmdSection[]>(() => {
  const q = query.value.trim().toLowerCase()
  const sections: CmdSection[] = []

  // Atletas (only when querying)
  if (q.length > 0) {
    const matchedAtletas = atletas.value
      .filter(a => a.nome?.toLowerCase().includes(q) || a.apelido?.toLowerCase().includes(q))
      .slice(0, 5)
      .map(a => ({
        id: `at-${a.id}`,
        label: a.nome,
        hint: a.apelido ? `@${a.apelido}` : 'Atleta',
        icon: 'user',
        to: `/atletas`,
      }))
    if (matchedAtletas.length > 0) sections.push({ label: 'Atletas', items: matchedAtletas })

    const matchedTurmas = turmas.value
      .filter(t => t.nome?.toLowerCase().includes(q))
      .slice(0, 5)
      .map(t => ({
        id: `tu-${t.id}`,
        label: t.nome,
        hint: 'Turma',
        icon: 'arrow',
        to: '/turmas',
      }))
    if (matchedTurmas.length > 0) sections.push({ label: 'Turmas', items: matchedTurmas })
  }

  // Actions
  const matchedActions = allActions.value.filter(a =>
    q === '' || a.label.toLowerCase().includes(q) || a.hint?.toLowerCase().includes(q),
  )
  if (matchedActions.length > 0) sections.push({ label: 'Ações rápidas', items: matchedActions })

  // Navigation
  const matchedNav = allNav.value.filter(n =>
    q === '' || n.label.toLowerCase().includes(q),
  )
  if (matchedNav.length > 0) sections.push({ label: 'Navegação', items: matchedNav })

  return sections
})

const flatItems = computed(() => results.value.flatMap(s => s.items))
const totalItems = computed(() => flatItems.value.length)

function getGlobalIndex(sectionIdx: number, itemIdx: number) {
  let acc = 0
  for (let i = 0; i < sectionIdx; i++) acc += results.value[i].items.length
  return acc + itemIdx
}

watch(query, () => { selectedIndex.value = 0 })

function executeItem(item: CmdItem) {
  if (item.action) item.action()
  if (item.to) router.push(item.to)
  hide()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') { hide(); return }
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, totalItems.value - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = flatItems.value[selectedIndex.value]
    if (item) executeItem(item)
  }
}
</script>
