import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import SettingsSection from './SettingsSection.vue'
import SettingsField from './SettingsField.vue'

const meta = {
  title: 'UI/SettingsSection',
  component: SettingsSection,
  tags: ['autodocs'],
} satisfies Meta<typeof SettingsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  args: {
    titulo: 'Dados do clube',
    descricao: 'Informações usadas nos comprovantes e na página pública.',
  },
  render: (args) => ({
    components: { SettingsSection, SettingsField },
    setup() {
      return { args }
    },
    template: `
      <SettingsSection v-bind="args">
        <SettingsField label="Nome do clube">
          <input type="text" class="form-input" value="Athletto FC" />
        </SettingsField>
        <SettingsField label="CNPJ">
          <input type="text" class="form-input" value="12.345.678/0001-90" />
        </SettingsField>
      </SettingsSection>
    `,
  }),
}

export const ComAcao: Story = {
  args: {
    titulo: 'Plano e cobrança',
    descricao: 'Seu plano atual e a forma de pagamento da assinatura.',
  },
  render: (args) => ({
    components: { SettingsSection, SettingsField },
    setup() {
      return { args }
    },
    template: `
      <SettingsSection v-bind="args">
        <template #actions>
          <button type="button" class="text-sm font-semibold text-brand-600 hover:text-brand-700">Ver histórico</button>
        </template>
        <SettingsField label="Plano atual" descricao="Renovação automática via Pix.">
          <span class="text-sm font-semibold text-slate-900 dark:text-white">Profissional</span>
        </SettingsField>
      </SettingsSection>
    `,
  }),
}
