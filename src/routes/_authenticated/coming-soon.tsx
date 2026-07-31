import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/coming-soon')({
  component: ComingSoon,
})

function ComingSoon() {
  const { user } = Route.useRouteContext()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-xl font-semibold">
        {user?.role.replace('_', ' ')} dashboard is coming soon
      </h1>
      <p className="text-sm text-muted-foreground">Signed in as {user?.name} ({user?.email})</p>
    </div>
  )
}
