import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import BrandMark from './BrandMark.vue'

const meta = {
  title: 'Marca/BrandMark',
  component: BrandMark,
  tags: ['autodocs'],
} satisfies Meta<typeof BrandMark>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  render: () => ({
    components: { BrandMark },
    template: `<BrandMark class="w-16 h-16 text-brand-600" />`,
  }),
}

export const SobreFundoEscuro: Story = {
  render: () => ({
    components: { BrandMark },
    template: `
      <div class="bg-slate-900 p-6 rounded-xl inline-block">
        <BrandMark class="w-16 h-16 text-accent" />
      </div>
    `,
  }),
}
