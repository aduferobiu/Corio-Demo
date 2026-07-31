import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill in your Postgres connection string.')
}

// `prepare: false` is required when connecting through Supabase's transaction
// pooler (port 6543), which doesn't support prepared statements.
const client = postgres(process.env.DATABASE_URL, { prepare: false })

export const db = drizzle(client, { schema })
