import { ref, watch, type Ref } from 'vue'

/**
 * Retorna um ref "atrasado" que só reflete o valor de `source` após `delayMs`
 * sem novas mudanças. Útil para buscas: o input continua instantâneo, mas o
 * filtro/consulta só dispara quando o usuário pausa a digitação (~400ms).
 */
export function useDebouncedRef<T>(source: Ref<T>, delayMs = 400): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | null = null

  watch(source, (val) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      debounced.value = val
    }, delayMs)
  })

  return debounced
}
