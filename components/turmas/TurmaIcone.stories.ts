import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import TurmaIcone from './TurmaIcone.vue'

const meta = {
  title: 'Turmas/TurmaIcone',
  component: TurmaIcone,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    cor: { control: 'select', options: ['brand', 'emerald', 'amber', 'rose', 'violet'] },
    icone: { control: 'select', options: ['whistle', 'soccer', 'volleyball', 'basketball', 'swimming', 'tennis', 'running', 'fight', 'gym', 'cycling'] },
  },
} satisfies Meta<typeof TurmaIcone>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  args: { icone: 'soccer', cor: 'brand', size: 'md' },
}

export const TodosOsIcones: Story = {
  args: {},
  render: () => ({
    components: { TurmaIcone },
    setup() {
      const icones = ['whistle', 'soccer', 'volleyball', 'basketball', 'swimming', 'tennis', 'running', 'fight', 'gym', 'cycling']
      const cores = ['brand', 'emerald', 'amber', 'rose', 'violet']
      return { icones, cores }
    },
    template: `
      <div class="flex flex-wrap gap-2">
        <TurmaIcone v-for="(ic, i) in icones" :key="ic" :icone="ic" :cor="cores[i % cores.length]" />
      </div>
    `,
  }),
}
