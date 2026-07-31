import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/md')({
  beforeLoad: ({ context }) => {
    if (context.user!.role !== 'md') {
      throw redirect({ to: '/' })
    }
  },
  component: () => <Outlet />,
})
