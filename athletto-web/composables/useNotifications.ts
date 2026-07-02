/**
 * Notificações — Supabase + Realtime.
 *
 * Mapeamento DB → tipo local:
 *   titulo     → title
 *   descricao  → description
 *   link       → to
 *   tipo       → type
 *   lida       → read
 *   criada_em  → created_at
 */

export type Notification = {
  id: string
  title: string
  description?: string
  to?: string
  type: 'info' | 'warning' | 'danger' | 'success'
  read: boolean
  created_at: string
}

function dbRowToNotification(row: any): Notification {
  return {
    id: row.id,
    title: row.titulo,
    description: row.descricao ?? undefined,
    to: row.link ?? undefined,
    type: row.tipo as Notification['type'],
    read: row.lida,
    created_at: row.criada_em,
  }
}

export function useNotifications() {
  const { gestor } = useAuth()

  const items = useState<Notification[]>('notifications', () => [])
  const loaded = useState('notifications_loaded', () => false)

  const unreadCount = computed(() => items.value.filter((n) => !n.read).length)

  function markAllRead() {
    _markAllReadReal()
  }

  function markRead(id: string) {
    _markReadReal(id)
  }

  function add(n: Omit<Notification, 'id' | 'read' | 'created_at'>) {
    items.value = [
      {
        ...n,
        id: `n${Date.now()}`,
        read: false,
        created_at: new Date().toISOString(),
      },
      ...items.value,
    ]
  }

  async function carregar() {
    if (loaded.value) return

    const supabase = useSupabaseClient()
    const clubeId = gestor.value?.clube_id
    if (!clubeId) return

    const { data } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('clube_id', clubeId)
      .eq('audience', 'gestor')
      .order('criada_em', { ascending: false })
      .limit(50)

    if (data) {
      items.value = data.map(dbRowToNotification)
      loaded.value = true
    }
  }

  async function _markReadReal(id: string) {
    // Otimismo: atualiza local imediatamente
    items.value = items.value.map((n) =>
      n.id === id ? { ...n, read: true } : n,
    )
    const supabase = useSupabaseClient()
    await supabase
      .from('notificacoes')
      .update({ lida: true, lida_em: new Date().toISOString() })
      .eq('id', id)
  }

  async function _markAllReadReal() {
    items.value = items.value.map((n) => ({ ...n, read: true }))
    const supabase = useSupabaseClient()
    const clubeId = gestor.value?.clube_id ?? null
    await supabase.rpc('marcar_todas_notificacoes_lidas', {
      p_clube_id: clubeId,
    })
  }

  // Inicia Realtime e carrega ao montar (só no cliente)
  function iniciarRealtime() {
    if (!process.client) return

    const supabase = useSupabaseClient()
    const clubeId = gestor.value?.clube_id
    if (!clubeId) return

    supabase
      .channel(`notificacoes:${clubeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `clube_id=eq.${clubeId}`,
        },
        (payload) => {
          const nova = dbRowToNotification(payload.new)
          items.value = [nova, ...items.value]
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notificacoes',
          filter: `clube_id=eq.${clubeId}`,
        },
        (payload) => {
          const atualizada = dbRowToNotification(payload.new)
          items.value = items.value.map((n) =>
            n.id === atualizada.id ? atualizada : n,
          )
        },
      )
      .subscribe()
  }

  return { items, unreadCount, markAllRead, markRead, add, carregar, iniciarRealtime }
}
