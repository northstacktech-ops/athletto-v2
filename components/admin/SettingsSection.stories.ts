import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import SettingsSection from './SettingsSection.vue'
import SettingsField from './SettingsField.vue'

// Wrapper fino de UiSettingsSection, usado nas telas do admin.
const meta = {
  title: 'Admin/SettingsSection',
  component: SettingsSection,
  tags: ['autodocs'],
} satisfies Meta<typeof SettingsSection>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  args: { titulo: 'Convide e ganhe', descricao: 'Parâmetros globais do programa de indicação.' },
  render: (args) => ({
    components: { SettingsSection, SettingsField },
    setup() {
      return { args }
    },
    template: `
      <SettingsSection v-bind="args">
        <SettingsField label="Dias de recompensa">
          <input type="number" class="form-input max-w-[120px]" value="30" />
        </SettingsField>
      </SettingsSection>
    `,
  }),
}
