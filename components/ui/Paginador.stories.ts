import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import Paginador from './Paginador.vue'

const meta = {
  title: 'UI/Paginador',
  component: Paginador,
  tags: ['autodocs'],
} satisfies Meta<typeof Paginador>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  args: { modelValue: 3, totalPaginas: 10 },
  render: (args) => ({
    components: { Paginador },
    setup() {
      const page = ref(args.modelValue)
      return { args, page }
    },
    template: `<Paginador v-bind="args" v-model="page" />`,
  }),
}

export const PrimeiraPagina: Story = {
  args: { modelValue: 1, totalPaginas: 5 },
  render: (args) => ({
    components: { Paginador },
    setup() {
      const page = ref(args.modelValue)
      return { args, page }
    },
    template: `<Paginador v-bind="args" v-model="page" />`,
  }),
}

export const UltimaPagina: Story = {
  args: { modelValue: 5, totalPaginas: 5 },
  render: (args) => ({
    components: { Paginador },
    setup() {
      const page = ref(args.modelValue)
      return { args, page }
    },
    template: `<Paginador v-bind="args" v-model="page" />`,
  }),
}
