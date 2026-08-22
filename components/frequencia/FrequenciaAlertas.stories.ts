import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import FrequenciaAlertas from './FrequenciaAlertas.vue'

// Alertas reais via useFrequencia().listarAlertas() ao montar — sem sessão
// real, mostra "Tudo em dia".
const meta = {
  title: 'Frequencia/FrequenciaAlertas',
  component: FrequenciaAlertas,
  tags: ['autodocs'],
} satisfies Meta<typeof FrequenciaAlertas>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
