import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import NovoModal from './NovoModal.vue'

const meta = {
  title: 'Atletas/NovoModal',
  component: NovoModal,
  tags: ['autodocs'],
} satisfies Meta<typeof NovoModal>

export default meta
type Story = StoryObj<typeof meta>

export const Escolha: Story = {
  args: { open: true, slug: 'athletto-fc' },
}

export const SemSlugConfigurado: Story = {
  args: { open: true, slug: undefined },
  render: (args) => ({
    components: { NovoModal },
    setup() {
      return { args }
    },
    template: `<NovoModal v-bind="args" />`,
  }),
}
