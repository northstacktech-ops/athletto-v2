import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import ManualMovModal from './ManualMovModal.vue'

const meta = {
  title: 'Admin/ManualMovModal',
  component: ManualMovModal,
  tags: ['autodocs'],
} satisfies Meta<typeof ManualMovModal>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
