import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import Topbar from './Topbar.vue'

// Sem props — lê clube/tema/busca global via composables. Sem sessão real no
// Storybook mostra "Athletto" como nome de fallback do clube.
const meta = {
  title: 'Layout/Topbar',
  component: Topbar,
  tags: ['autodocs'],
} satisfies Meta<typeof Topbar>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
