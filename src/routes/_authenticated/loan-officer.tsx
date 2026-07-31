import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/loan-officer')({
  beforeLoad: ({ context }) => {
    if (context.user!.role !== 'loan_officer') {
      throw redirect({ to: '/' })
    }
  },
  component: () => <Outlet />,
})
