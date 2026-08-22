import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import UserMenu from './UserMenu.vue'

// Depende de useAuth()/useTheme()/useAdminAuth()/useTrial() — sem sessão real
// no Storybook, mostra o estado "Gestor" genérico em vez dos dados reais.
const meta = {
  title: 'Layout/UserMenu',
  component: UserMenu,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['topbar', 'sidebar'] },
  },
} satisfies Meta<typeof UserMenu>

export default meta
type Story = StoryObj<typeof meta>

export const NaTopbar: Story = {
  args: { variant: 'topbar' },
}

export const NaSidebar: Story = {
  args: { variant: 'sidebar' },
  render: (args) => ({
    components: { UserMenu },
    setup() {
      return { args }
    },
    template: `<div class="bg-slate-900 p-3 w-64"><UserMenu v-bind="args" /></div>`,
  }),
}
