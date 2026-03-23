import { axios } from '@/lib/client.ts'

export type TwoFaGenerateResponse = {
  otpauthUrl: string
  base32: string
}

export async function generateTwoFa() {
  const res = await axios.post<TwoFaGenerateResponse>('/users/2fa/generate')
  return res.data
}

export async function enableTwoFa(code: string) {
  const res = await axios.post<{ message: string }>('/users/2fa/enable', {
    code,
  })
  return res.data
}

export async function disableTwoFa(code: string) {
  const res = await axios.post<{ message: string }>('/users/2fa/disable', {
    code,
  })
  return res.data
}

export type TwoFaVerifyPayload = {
  token: string
  twoFaSessionId: string
  userId: string
}

export async function verifyTwoFaLogin(payload: TwoFaVerifyPayload) {
  const res = await axios.post<{ token: string }>('/auth/2fa/verify', payload)
  return res.data
}
