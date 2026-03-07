import { axios } from '@/lib/client.ts'

export type LoginRequest = { email: string; password: string }
export type LoginResponse = {
  requires2FA?: true
  twoFaSession?: {
    twoFaSessionId: string
  }
  userId?: string
}

export async function login(values: LoginRequest): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>('/auth/login', values)
  return res.data
}

export type RegisterRequest = {
  username: string
  email: string
  password: string
}
export type RegisterResponse = {}

export async function register(
  values: RegisterRequest,
): Promise<RegisterResponse> {
  const res = await axios.post<RegisterResponse>('/auth/register', values)
  return res.data
}
