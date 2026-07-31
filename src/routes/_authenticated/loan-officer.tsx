import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/loan-officer')({
  beforeLoad: ({ context }) => {
    if (!['loan_officer', 'admin'].includes(context.user!.role)) {
      throw redirect({ to: '/' })
    }
  },
  component: () => <Outlet />,
})
