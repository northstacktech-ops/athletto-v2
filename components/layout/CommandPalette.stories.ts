import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import CommandPalette from './CommandPalette.vue'
import { useCommandPalette } from '~/composables/useCommandPalette'

// O palette é controlado por um estado global (useCommandPalette) — a story
// abre ele já ao montar, pra mostrar a busca/resultados de ações e navegação.
const meta = {
  title: 'Layout/CommandPalette',
  component: CommandPalette,
  tags: ['autodocs'],
} satisfies Meta<typeof CommandPalette>

export default meta
type Story = StoryObj<typeof meta>

export const Aberto: Story = {
  render: () => ({
    components: { CommandPalette },
    setup() {
      const { show } = useCommandPalette()
      show()
      return {}
    },
    template: `<CommandPalette />`,
  }),
}
