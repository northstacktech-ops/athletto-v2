import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import GuidedTourOverlay from './GuidedTourOverlay.vue'
import TourHelpButton from './TourHelpButton.vue'
import { useGuidedTour } from '~/composables/useGuidedTour'

// GuidedTourOverlay recebe uma instância viva de useGuidedTour() — não dá pra
// simular via `args` simples. A story monta uma cena de exemplo com dois
// alvos reais (`data-tour`) e usa o próprio TourHelpButton para iniciar.
const meta = {
  title: 'UI/GuidedTourOverlay',
  component: GuidedTourOverlay,
  tags: ['autodocs'],
} satisfies Meta<typeof GuidedTourOverlay>

export default meta
type Story = StoryObj<typeof meta>

export const Demonstracao: Story = {
  render: () => ({
    components: { GuidedTourOverlay, TourHelpButton },
    setup() {
      const tour = useGuidedTour('storybook_demo_tour', [
        { tourId: 'demo-a', title: 'Passo 1', description: 'Este é o primeiro elemento destacado do tour.' },
        { tourId: 'demo-b', title: 'Passo 2', description: 'E este é o segundo — o tooltip escolhe o lado com mais espaço.' },
      ])
      return { tour }
    },
    template: `
      <div class="p-8 flex items-center gap-6">
        <TourHelpButton :tour="tour" />
        <button data-tour="demo-a" type="button" class="btn-primary">Alvo 1</button>
        <button data-tour="demo-b" type="button" class="btn-primary">Alvo 2</button>
        <GuidedTourOverlay :tour="tour" />
      </div>
    `,
  }),
}
