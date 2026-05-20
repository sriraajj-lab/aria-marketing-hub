/**
 * Denials Doctor — Database Connection with Turso/libSQL Support
 *
 * Supports two modes:
 * 1. Turso (remote): Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN for persistent cloud storage
 * 2. SQLite (local): Set DATABASE_URL to file:./path for local development
 *
 * On Vercel/serverless: Turso is required for data persistence.
 * On self-hosted/VPS: Local SQLite works fine.
 */

import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  // Priority: Turso credentials > DATABASE_URL
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN
  const databaseUrl = process.env.DATABASE_URL || 'file:./db/custom.db'
  const isTurso = !!tursoUrl || databaseUrl.startsWith('libsql://') || databaseUrl.startsWith('https://')

  if (isTurso) {
    // Turso / libSQL remote — persistent on serverless (Vercel, Netlify, etc.)
    const url = tursoUrl || databaseUrl
    const libsql = createClient({
      url,
      authToken: tursoToken || process.env.DATABASE_AUTH_TOKEN || undefined,
    })

    const adapter = new PrismaLibSQL(libsql)

    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }

  // Local SQLite — for development / self-hosted VPS
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
