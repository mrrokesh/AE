import bcrypt from 'bcrypt'
import crypto from 'node:crypto'

// bcrypt generates a unique random salt per password and embeds it in the hash.
// The pepper is a secret kept outside the database (env var). We HMAC the password
// with it first, so a stolen DB alone can't be cracked. HMAC output is fixed-length,
// which also avoids bcrypt's 72-byte input limit.
const ROUNDS = 12
const pepper = () => {
  if (!process.env.PASSWORD_PEPPER) throw new Error('PASSWORD_PEPPER is not set')
  return process.env.PASSWORD_PEPPER
}
const peppered = (plain) =>
  crypto.createHmac('sha256', pepper()).update(plain).digest('base64')

export const hashPassword = (plain) => bcrypt.hash(peppered(plain), ROUNDS)
export const verifyPassword = (plain, hash) => bcrypt.compare(peppered(plain), hash)
