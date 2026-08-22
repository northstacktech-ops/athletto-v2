import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import SettingsField from './SettingsField.vue'

const meta = {
  title: 'UI/SettingsField',
  component: SettingsField,
  tags: ['autodocs'],
} satisfies Meta<typeof SettingsField>

export default meta
type Story = StoryObj<typeof meta>

export const ComInput: Story = {
  args: {
    label: 'Nome do clube',
    descricao: 'Aparece no cabeçalho e nos comprovantes de pagamento.',
  },
  render: (args) => ({
    components: { SettingsField },
    setup() {
      return { args }
    },
    template: `
      <SettingsField v-bind="args">
        <input type="text" class="form-input" value="Athletto FC" />
      </SettingsField>
    `,
  }),
}

export const SemDescricao: Story = {
  args: { label: 'E-mail de contato' },
  render: (args) => ({
    components: { SettingsField },
    setup() {
      return { args }
    },
    template: `
      <SettingsField v-bind="args">
        <input type="email" class="form-input" value="contato@athletto.com" />
      </SettingsField>
    `,
  }),
}
