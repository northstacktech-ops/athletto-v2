import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin({
  name: 'preline',
  enforce: 'post',
  setup() {
    if (import.meta.client) {
      import('preline').then(() => {
        const win = window as any
        if (win.HSStaticMethods?.autoInit) {
          win.HSStaticMethods.autoInit()
        }
      })
    }
  },
})
