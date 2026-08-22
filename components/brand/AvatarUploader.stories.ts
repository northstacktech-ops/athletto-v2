import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import AvatarUploader from './AvatarUploader.vue'

const meta = {
  title: 'Brand/AvatarUploader',
  component: AvatarUploader,
  tags: ['autodocs'],
  argTypes: {
    shape: { control: 'select', options: ['square', 'circle'] },
  },
} satisfies Meta<typeof AvatarUploader>

export default meta
type Story = StoryObj<typeof meta>

export const Vazio: Story = {
  args: { modelValue: null, label: 'Foto do atleta', shape: 'circle', size: 96, placeholderIniciais: 'JS' },
}

export const ComImagem: Story = {
  args: {
    modelValue: 'https://i.pravatar.cc/240?img=12',
    label: 'Logo do clube',
    shape: 'square',
    size: 96,
    allowRemove: true,
  },
}

export const Enviando: Story = {
  args: { modelValue: null, label: 'Foto do atleta', shape: 'circle', size: 96, uploading: true },
}
