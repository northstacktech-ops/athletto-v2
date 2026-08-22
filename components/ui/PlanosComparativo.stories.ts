import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import PlanosComparativo from './PlanosComparativo.vue'

const meta = {
  title: 'UI/PlanosComparativo',
  component: PlanosComparativo,
  tags: ['autodocs'],
} satisfies Meta<typeof PlanosComparativo>

export default meta
type Story = StoryObj<typeof meta>

export const Selecionavel: Story = {
  args: {
    modelValue: 'intermediario',
    selecionavel: true,
  },
  render: (args) => ({
    components: { PlanosComparativo },
    setup() {
      const value = ref(args.modelValue)
      return { args, value }
    },
    template: `<PlanosComparativo v-bind="args" v-model="value" />`,
  }),
}

export const AssinaturaComPlanoAtual: Story = {
  args: {
    assinavel: true,
    planoAtual: 'basico',
    jaAssinante: true,
  },
}

export const EmTrial: Story = {
  args: {
    assinavel: true,
    planoAtual: 'intermediario',
    trialAtivo: true,
  },
}
