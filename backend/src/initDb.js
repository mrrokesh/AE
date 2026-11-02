import fs from 'node:fs'
import { pool } from './db.js'
await pool.query(fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'))
console.log('Schema ready')
await pool.end()
