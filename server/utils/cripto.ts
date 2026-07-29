import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto'

/**
 * Criptografia simétrica (AES-256-GCM) para guardar segredos por clube no banco.
 * A chave vem de `ATHLETTO_ENC_KEY` (env, server-only) — o banco guarda só o
 * texto cifrado, inútil sem essa env.
 *
 * Formato do payload cifrado: "iv:tag:ciphertext" (cada parte em base64).
 *
 * NOTA (2026-07): sem uso ativo desde a remoção do AbacatePay (era usado pra
 * cifrar a chave de API por clube em `clube_credenciais`, tabela removida).
 * Mantido porque é genérico — reaproveitar se algum segredo por clube
 * precisar ser guardado cifrado no futuro.
 */

function getKey(): Buffer | null {
  const secret = process.env.ATHLETTO_ENC_KEY
  if (!secret) return null
  // Deriva 32 bytes determinísticos a partir do segredo (qualquer string serve).
  return createHash('sha256').update(secret).digest()
}

export function encConfigurada(): boolean {
  return !!process.env.ATHLETTO_ENC_KEY
}

export function cifrar(plain: string): string | null {
  const key = getKey()
  if (!key) return null
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join(':')
}

export function decifrar(payload: string | null | undefined): string | null {
  const key = getKey()
  if (!key || !payload) return null
  try {
    const [ivB, tagB, encB] = payload.split(':')
    if (!ivB || !tagB || !encB) return null
    const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB, 'base64'))
    decipher.setAuthTag(Buffer.from(tagB, 'base64'))
    return Buffer.concat([decipher.update(Buffer.from(encB, 'base64')), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}
