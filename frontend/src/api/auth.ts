import { axios } from "../query/client";

export type LoginRequest = { email: string; password: string };
export type LoginResponse =
  | { token: string }
  | { requires2FA: true; twoFaSession: string };

export async function login(values: LoginRequest): Promise<LoginResponse> {
  const res = await axios.post<LoginResponse>("/auth/login", values);
  return res.data
}

export type RegisterRequest = { email: string; password: string };
export type RegisterResponse = { token: string };

export async function register(values: RegisterRequest): Promise<RegisterResponse>{
  const res = await axios.post<RegisterResponse>("/auth/register", values);
  return res.data
}

