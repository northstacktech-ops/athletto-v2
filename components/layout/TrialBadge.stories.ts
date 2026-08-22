import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import TrialBadge from './TrialBadge.vue'

// Lê o estado do trial via useTrial() (composable ligado à sessão/Supabase).
// Sem uma sessão real logada no Storybook, o badge não aparece (isTrial fica
// false) — a story documenta o componente tal como ele existe no app.
const meta = {
  title: 'Layout/TrialBadge',
  component: TrialBadge,
  tags: ['autodocs'],
} satisfies Meta<typeof TrialBadge>

export default meta
type Story = StoryObj<typeof meta>

export const Padrao: Story = {}
