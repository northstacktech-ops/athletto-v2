import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import Avatar from './Avatar.vue'

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

export const ComIniciais: Story = {
  args: { nome: 'João Pedro Silva', size: 'md' },
}

export const ComFoto: Story = {
  args: {
    nome: 'João Pedro Silva',
    src: 'https://i.pravatar.cc/160?img=12',
    size: 'md',
  },
}

export const ComNumero: Story = {
  args: { nome: 'Maria Souza', size: 'md', numero: 10 },
}

export const Tamanhos: Story = {
  args: { nome: 'Carlos Eduardo' },
  render: (args) => ({
    components: { Avatar },
    setup() {
      return { args, sizes: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const }
    },
    template: `
      <div class="flex items-end gap-3">
        <Avatar v-for="s in sizes" :key="s" v-bind="args" :size="s" />
      </div>
    `,
  }),
}
