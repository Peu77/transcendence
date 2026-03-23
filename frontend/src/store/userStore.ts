import { Store } from '@tanstack/store'
import type { User } from '@/api/user.ts'

export const userStore = new Store<User | null>(null)
