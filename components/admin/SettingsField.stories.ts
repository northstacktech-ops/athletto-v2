import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import SettingsField from './SettingsField.vue'

// Wrapper fino de UiSettingsField (mesma API), usado nas telas do admin.
const meta = {
  title: 'Admin/SettingsField',
  component: SettingsField,
  tags: ['autodocs'],
} satisfies Meta<typeof SettingsField>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  args: { label: 'Dias de trial padrão', descricao: 'Aplicado a todo clube novo cadastrado.' },
  render: (args) => ({
    components: { SettingsField },
    setup() {
      return { args }
    },
    template: `
      <SettingsField v-bind="args">
        <input type="number" class="form-input max-w-[120px]" value="14" />
      </SettingsField>
    `,
  }),
}
