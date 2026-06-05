export function useTheme() {
  const isDark = useState<boolean>('theme_dark', () => false)

  function apply(dark: boolean) {
    if (process.client) {
      document.documentElement.classList.toggle('dark', dark)
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    }
  }

  function toggle() {
    isDark.value = !isDark.value
    apply(isDark.value)
  }

  function init() {
    if (!process.client) return
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    isDark.value = stored === 'dark' || (!stored && prefersDark)
    apply(isDark.value)
  }

  return { isDark, toggle, init }
}
