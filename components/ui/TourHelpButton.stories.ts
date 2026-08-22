import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import TourHelpButton from './TourHelpButton.vue'
import GuidedTourOverlay from './GuidedTourOverlay.vue'
import { useGuidedTour } from '~/composables/useGuidedTour'

const meta = {
  title: 'UI/TourHelpButton',
  component: TourHelpButton,
  tags: ['autodocs'],
} satisfies Meta<typeof TourHelpButton>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  render: () => ({
    components: { TourHelpButton, GuidedTourOverlay },
    setup() {
      const tour = useGuidedTour('storybook_demo_tour_button', [
        { tourId: 'demo-help', title: 'Rever dicas', description: 'Clicar neste botão sempre reabre o tour, mesmo já tendo sido visto.' },
      ])
      return { tour }
    },
    template: `
      <div class="p-8 flex items-center gap-4">
        <TourHelpButton :tour="tour" />
        <div data-tour="demo-help" class="card-base px-4 py-3 text-sm">Painel de exemplo</div>
        <GuidedTourOverlay :tour="tour" />
      </div>
    `,
  }),
}
