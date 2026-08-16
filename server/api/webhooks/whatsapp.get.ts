import { defineEventHandler, getQuery, createError } from 'h3'

/**
 * GET /api/webhooks/whatsapp
 *
 * Handshake de verificação que a Meta faz uma vez ao cadastrar a URL do
 * webhook no painel do BSP: manda hub.mode=subscribe, hub.verify_token e
 * hub.challenge; espera receber hub.challenge de volta em texto puro se o
 * token bater com WHATSAPP_VERIFY_TOKEN.
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started
 */
export default defineEventHandler((event) => {
  const query = getQuery(event)
  const mode = query['hub.mode']
  const token = query['hub.verify_token']
  const challenge = query['hub.challenge']

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN
  if (mode === 'subscribe' && verifyToken && token === verifyToken) {
    return challenge
  }

  throw createError({ statusCode: 403, statusMessage: 'Verificação de webhook falhou.' })
})
