import type { Meta, StoryObj } from '@storybook-vue/nuxt'

import ToastContainer from './ToastContainer.vue'
import { useToast } from '~/composables/useToast'

// ToastContainer não recebe props — ele lê a fila global de useToast() e
// renderiza via Teleport para <body>. A story dispara toasts reais clicando
// nos botões, já que não há como "passar" um toast como prop.
const meta = {
  title: 'UI/ToastContainer',
  component: ToastContainer,
  tags: ['autodocs'],
} satisfies Meta<typeof ToastContainer>

export default meta
type Story = StoryObj<typeof meta>

export const Interativo: Story = {
  render: () => ({
    components: { ToastContainer },
    setup() {
      const toast = useToast()
      return { toast }
    },
    template: `
      <div>
        <p class="text-sm text-slate-500 mb-3">Clique para disparar um toast (aparece no canto inferior direito):</p>
        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-primary" @click="toast.success('Salvo!', 'As alterações foram salvas com sucesso.')">Sucesso</button>
          <button type="button" class="btn-primary" @click="toast.error('Erro ao salvar', 'Tente novamente em instantes.')">Erro</button>
          <button type="button" class="btn-primary" @click="toast.warning('Atenção', 'Alguns campos precisam de revisão.')">Aviso</button>
          <button type="button" class="btn-primary" @click="toast.info('Nova versão', 'Atualize a página para ver as novidades.')">Info</button>
        </div>
        <ToastContainer />
      </div>
    `,
  }),
}
