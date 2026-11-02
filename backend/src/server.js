import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import { pool } from './db.js'
import { hashPassword, verifyPassword } from './password.js'

const app = express()
app.use(cors())
app.use(express.json())

const sign = (u) => jwt.sign({ id: u.id, role: u.role, name: u.name }, process.env.JWT_SECRET, { expiresIn: '8h' })
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET); next() }
  catch { res.status(401).json({ error: 'Please log in' }) }
}

app.get('/api/health', (_, res) => res.json({ ok: true }))

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role = 'sales' } = req.body
  if (!name || !email || !password || password.length < 8) return res.status(400).json({ error: 'Name, email and a password of 8+ characters are required' })
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id,name,role',
      [name, email.toLowerCase(), await hashPassword(password), role === 'manager' ? 'manager' : 'sales'])
    res.status(201).json({ token: sign(rows[0]), user: rows[0] })
  } catch (e) { res.status(e.code === '23505' ? 409 : 500).json({ error: e.code === '23505' ? 'Email already registered' : 'Server error' }) }
})

app.post('/api/auth/login', async (req, res) => {
  const { email = '', password = '' } = req.body
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1 AND active', [email.toLowerCase()])
  const u = rows[0]
  if (!u || !(await verifyPassword(password, u.password_hash))) return res.status(401).json({ error: 'Wrong email or password' })
  res.json({ token: sign(u), user: { id: u.id, name: u.name, role: u.role } })
})

// Leads: high priority and high value first
app.get('/api/leads', auth, async (req, res) => {
  const mine = req.user.role === 'sales' ? 'AND assigned_to = $1' : 'AND ($1::int IS NULL OR true)'
  const { rows } = await pool.query(
    `SELECT * FROM leads WHERE status NOT IN ('won','lost') ${mine}
     ORDER BY CASE priority WHEN 'hot' THEN 0 WHEN 'warm' THEN 1 ELSE 2 END, est_value DESC, created_at`,
    [req.user.role === 'sales' ? req.user.id : null])
  res.json(rows)
})

app.listen(process.env.PORT || 4000, () => console.log('API running on', process.env.PORT || 4000))
