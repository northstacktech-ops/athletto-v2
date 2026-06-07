import { defineEventHandler, getMethod, setResponseStatus, setHeader } from 'h3'

/**
 * CORS + preflight para os endpoints do app mobile (/api/app/*).
 *
 * Os handlers são `.post.ts` / `.get.ts`, então o Nitro só os registra para o
 * método correspondente. O preflight OPTIONS do navegador não casa com nenhuma
 * rota e cairia no render da página (redirect para /login) — o que faz o browser
 * recusar a requisição ("Redirect is not allowed for a preflight request").
 *
 * Este middleware roda antes do roteamento: aplica os headers de CORS em toda
 * resposta de /api/app/* e responde o OPTIONS com 204, sem deixar vazar para o
 * render da SPA.
 *
 * App nativo (mobile) não faz preflight, mas manter o CORS aqui é correto e
 * inofensivo — e necessário para rodar/testar o app na web.
 */
export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/app/')) return

  setHeader(event, 'Access-Control-Allow-Origin', '*')
  setHeader(event, 'Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  setHeader(event, 'Access-Control-Allow-Headers', 'Authorization, Content-Type')
  setHeader(event, 'Access-Control-Max-Age', '86400')

  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204)
    return ''
  }
})
