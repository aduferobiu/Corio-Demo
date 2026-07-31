import { eq } from 'drizzle-orm'
import { getRequestHeader, setResponseHeader } from '@tanstack/react-start/server'
import bcrypt from 'bcryptjs'

import { db } from '#/db/client'
import { sessions, users } from '#/db/schema'
import type { AuthUser } from './types'

const SESSION_COOKIE = 'corio_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 days
// DUMMY hash so a login against a non-existent email takes the same time as a wrong password.
const DUMMY_PASSWORD_HASH = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8L6Fh8p8yYFtM8UbY/lJn0Rq9x0m8O'

function isSecure() {
  return process.env.SESSION_COOKIE_SECURE !== 'false'
}

function setSessionCookie(token: string) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    'HttpOnly',
    'SameSite=Lax',
    'Path=/',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ]
  if (isSecure()) parts.push('Secure')
  setResponseHeader('Set-Cookie', parts.join('; '))
}

export function clearSessionCookie() {
  const parts = [`${SESSION_COOKIE}=`, 'HttpOnly', 'SameSite=Lax', 'Path=/', 'Max-Age=0']
  if (isSecure()) parts.push('Secure')
  setResponseHeader('Set-Cookie', parts.join('; '))
}

function readSessionToken(): string | null {
  const header = getRequestHeader('cookie')
  if (!header) return null
  for (const part of header.split(/;\s*/)) {
    const eq = part.indexOf('=')
    if (eq === -1) continue
    if (part.slice(0, eq) === SESSION_COOKIE) return part.slice(eq + 1)
  }
  return null
}

function toAuthUser(user: typeof users.$inferSelect): AuthUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role, branch: user.branch, avatarUrl: user.avatarUrl }
}

export async function verifyPassword(email: string, password: string): Promise<AuthUser | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  const hashToCheck = user?.passwordHash ?? DUMMY_PASSWORD_HASH
  const matches = await bcrypt.compare(password, hashToCheck)
  if (!user || !matches) return null
  return toAuthUser(user)
}

export async function createSession(userId: string) {
  await db.delete(sessions).where(eq(sessions.userId, userId))
  const token = crypto.randomUUID()
  await db.insert(sessions).values({ id: token, userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) })
  await db.update(users).set({ status: 'active', lastActivityAt: new Date() }).where(eq(users.id, userId))
  setSessionCookie(token)
}

export async function destroySession() {
  const token = readSessionToken()
  if (token) await db.delete(sessions).where(eq(sessions.id, token))
  clearSessionCookie()
}

export async function getSessionUser(): Promise<AuthUser | null> {
  const token = readSessionToken()
  if (!token) return null

  const [row] = await db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.id, token))
    .limit(1)

  if (!row || row.expiresAt.getTime() < Date.now()) return null
  return toAuthUser(row.user)
}
