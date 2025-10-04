export interface UserRow {
  id: string;
  email: string;
  password: string;
  twoFaEnabled: number;
  twoFaSecret: string | null;
  createdAt: string;
}

export interface TwoFARow {
  id: string;
  userId: string;
  secret: string;
  createdAt: string;
  expiredAt: string;
}
