import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import ImageCropperModal from './ImageCropperModal.vue'

// O modal sempre abre na etapa de escolha de arquivo (drag-and-drop) — o
// passo de recorte só aparece depois que o usuário efetivamente escolhe uma
// imagem local, então não dá pra pré-carregar via args/props.
const meta = {
  title: 'Brand/ImageCropperModal',
  component: ImageCropperModal,
  tags: ['autodocs'],
} satisfies Meta<typeof ImageCropperModal>

export default meta
type Story = StoryObj<typeof meta>

export const EscolherArquivo: Story = {
  args: { open: true, title: 'Recortar logo do clube', circle: false, outputSize: 512 },
}

export const Circular: Story = {
  args: { open: true, title: 'Recortar foto do atleta', circle: true, outputSize: 512 },
}
