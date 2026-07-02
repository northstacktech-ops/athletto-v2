/**
 * Middleware de permissão por módulo (camada de aplicação).
 *
 * Gestor principal tem acesso total. Gestor adicional só acessa as rotas dos
 * módulos onde tem ao menos nível 'ver' (mapa `gestores.permissoes`). Quem tenta
 * abrir uma rota sem permissão — inclusive digitando a URL direto — é levado de
 * volta ao Painel (`/`), que é sempre visível.
 *
 * Observação: este é um bloqueio de UX/aplicação. O bloqueio forte de dados é
 * responsabilidade do RLS por módulo (item #5(b)), que age independentemente.
 */

// Prefixo de rota → módulo correspondente. A ordem não importa (sem sobreposição).
const ROTA_MODULO: Array<{ prefix: string; modulo: string }> = [
  { prefix: '/atletas', modulo: 'atletas' },
  { prefix: '/turmas', modulo: 'turmas' },
  { prefix: '/frequencia', modulo: 'frequencia' },
  { prefix: '/calendario', modulo: 'calendario' },
  { prefix: '/financeiro', modulo: 'financeiro' },
  { prefix: '/configuracoes', modulo: 'configuracoes' },
]

function moduloDaRota(path: string): string | null {
  const match = ROTA_MODULO.find(({ prefix }) => path === prefix || path.startsWith(prefix + '/'))
  return match?.modulo ?? null
}

export default defineNuxtRouteMiddleware(async (to) => {
  const modulo = moduloDaRota(to.path)
  if (!modulo) return

  const user = useSupabaseUser()
  if (!user.value) return // auth.global.ts já trata usuário não autenticado

  const { gestor, temPermissao, carregarPerfil } = useAuth()

  // Em hard reload o middleware roda antes do layout: garante o perfil carregado
  // para não redirecionar o gestor principal por engano.
  if (!gestor.value) await carregarPerfil()
  if (!gestor.value) return // sem perfil → layout encaminha p/ onboarding

  if (!temPermissao(modulo)) {
    return navigateTo('/')
  }
})
