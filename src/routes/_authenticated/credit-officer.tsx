import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/credit-officer')({
  beforeLoad: ({ context }) => {
    if (context.user!.role !== 'credit_officer') {
      throw redirect({ to: '/' })
    }
  },
  component: () => <Outlet />,
})
