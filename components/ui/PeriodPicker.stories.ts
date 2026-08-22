import { ref } from 'vue'
import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import PeriodPicker from './PeriodPicker.vue'

const meta = {
  title: 'UI/PeriodPicker',
  component: PeriodPicker,
  tags: ['autodocs'],
} satisfies Meta<typeof PeriodPicker>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {
  args: { modelValue: '90d' },
  render: (args) => ({
    components: { PeriodPicker },
    setup() {
      const value = ref(args.modelValue)
      return { args, value }
    },
    template: `<PeriodPicker v-bind="args" v-model="value" />`,
  }),
}
