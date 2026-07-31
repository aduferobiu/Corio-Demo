import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/branch-officer')({
  beforeLoad: ({ context }) => {
    if (context.user!.role !== 'branch_officer') {
      throw redirect({ to: '/' })
    }
  },
  component: () => <Outlet />,
})
