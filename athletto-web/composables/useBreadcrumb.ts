/**
 * Mapa de rotas para breadcrumb / título da página.
 * Usado pela Topbar pra montar as migalhas dinamicamente.
 */
type RouteMeta = {
  label: string
  parent?: string
}

const ROUTE_MAP: Record<string, RouteMeta> = {
  '/':              { label: 'Painel' },
  '/atletas':       { label: 'Atletas' },
  '/turmas':        { label: 'Turmas' },
  '/frequencia':    { label: 'Frequência' },
  '/calendario':    { label: 'Calendário' },
  '/financeiro':    { label: 'Financeiro' },
  '/configuracoes': { label: 'Configurações' },
}

export function useBreadcrumb() {
  const route = useRoute()

  const crumbs = computed<{ label: string; to?: string }[]>(() => {
    const path = route.path
    const parts = path.split('/').filter(Boolean)

    // Root → só "Painel"
    if (parts.length === 0) return [{ label: 'Painel' }]

    const result: { label: string; to?: string }[] = []

    // Sempre começa com Painel
    result.push({ label: 'Painel', to: '/' })

    // Tenta achar o match completo
    let acc = ''
    for (let i = 0; i < parts.length; i++) {
      acc += '/' + parts[i]
      const meta = ROUTE_MAP[acc]
      if (meta) {
        result.push({ label: meta.label, to: i < parts.length - 1 ? acc : undefined })
      } else {
        // Fallback: parte da URL com primeira letra maiúscula
        const fallback = parts[i].charAt(0).toUpperCase() + parts[i].slice(1)
        result.push({ label: fallback })
      }
    }

    return result
  })

  const currentTitle = computed(() => crumbs.value[crumbs.value.length - 1]?.label ?? 'Painel')

  return { crumbs, currentTitle }
}
