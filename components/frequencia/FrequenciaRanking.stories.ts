import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import FrequenciaRanking from './FrequenciaRanking.vue'

// Ranking real via useFrequencia().ranking() ao montar — sem sessão real,
// mostra "Sem dados de frequência".
const meta = {
  title: 'Frequencia/FrequenciaRanking',
  component: FrequenciaRanking,
  tags: ['autodocs'],
} satisfies Meta<typeof FrequenciaRanking>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
