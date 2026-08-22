import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import AdminTopbar from './AdminTopbar.vue'

const meta = {
  title: 'Admin/AdminTopbar',
  component: AdminTopbar,
  tags: ['autodocs'],
} satisfies Meta<typeof AdminTopbar>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
