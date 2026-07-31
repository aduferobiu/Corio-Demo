import { useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Eye, EyeOff } from 'lucide-react'
import { z } from 'zod'

import { loginFn } from '#/lib/auth/auth.functions'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({ redirect: z.string().optional() }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = Route.useSearch()
  const navigate = useNavigate()
  const router = useRouter()
  const login = useServerFn(loginFn)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      await login({ data: { email, password } })
      await router.invalidate()
      await navigate({ to: redirect ?? '/' })
    } catch {
      setError('Invalid email or password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#f5f5f5]">
      <header className="flex h-[70px] w-full items-center justify-center border-b border-[var(--corio-neutral-100)] bg-white">
        <span className="font-['Inter_Display:SemiBold'] text-lg font-semibold text-[var(--corio-blue-500)]">Corio</span>
      </header>

      <div className="flex min-h-[calc(100vh-70px)] items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="flex w-[426px] max-w-full flex-col gap-8 rounded-2xl bg-white p-8"
        >
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-0.5 text-center">
              <h1 className="text-2xl font-medium text-[var(--corio-neutral-900)]">Welcome back</h1>
              <p className="text-sm text-[var(--corio-neutral-400)]">Sign in to your Corio account</p>
            </div>

            <div className="flex w-full flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <span className="text-xs font-medium text-[var(--corio-neutral-500)] underline">Forgot Password ?</span>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute top-1/2 right-3.5 -translate-y-1/2 text-[var(--corio-neutral-400)]"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && <p className="-mt-4 text-center text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-4">
            <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </Button>
            <p className="text-center text-xs font-medium text-[var(--corio-neutral-400)]">Microfinance lending, simplified.</p>
          </div>
        </form>
      </div>
    </div>
  )
}
