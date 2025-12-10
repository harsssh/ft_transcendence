import { createHash } from 'node:crypto'

export const hashPassword = (password: string) =>
  createHash('sha256').update(password).digest('hex')

export const isValidPassword = (hash: string, password: string) =>
  hash === hashPassword(password)
