/**
 * Estado global do Command Palette (Cmd+K).
 * Singleton via useState pra ser controlado de qualquer lugar.
 */
export function useCommandPalette() {
  const open = useState<boolean>('cmdk:open', () => false)

  function show()   { open.value = true }
  function hide()   { open.value = false }
  function toggle() { open.value = !open.value }

  return { open, show, hide, toggle }
}
