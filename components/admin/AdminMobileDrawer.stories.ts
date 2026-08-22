import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import AdminMobileDrawer from './AdminMobileDrawer.vue'
import { useState } from '#imports'

const meta = {
  title: 'Admin/AdminMobileDrawer',
  component: AdminMobileDrawer,
  tags: ['autodocs'],
} satisfies Meta<typeof AdminMobileDrawer>

export default meta
type Story = StoryObj<typeof meta>

export const Aberto: Story = {
  render: () => ({
    components: { AdminMobileDrawer },
    setup() {
      const open = useState('admin_drawer_open', () => false)
      open.value = true
      return {}
    },
    template: `<AdminMobileDrawer />`,
  }),
}
