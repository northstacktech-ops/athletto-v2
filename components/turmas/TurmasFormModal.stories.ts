import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import TurmasFormModal from './TurmasFormModal.vue'

const meta = {
  title: 'Turmas/TurmasFormModal',
  component: TurmasFormModal,
  tags: ['autodocs'],
} satisfies Meta<typeof TurmasFormModal>

export default meta
type Story = StoryObj<typeof meta>

export const NovaTurma: Story = {
  args: { turma: null },
}
