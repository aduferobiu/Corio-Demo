import { HeadContent, Scripts, createRootRouteWithContext } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Toaster } from 'sonner'

import { TopProgressBar } from '#/components/top-progress-bar'
import { getCurrentUserFn } from '#/lib/auth/auth.functions'
import type { AuthUser } from '#/lib/auth/types'
import appCss from '../styles.css?url'

export const Route = createRootRouteWithContext<{ user: AuthUser | null }>()({
  beforeLoad: async () => {
    const user = await getCurrentUserFn()
    return { user }
  },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Corio · Microfinance lending, simplified.' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <TopProgressBar />
        {children}
        <Toaster richColors position="top-right" />
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[{ name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> }]}
        />
        <Scripts />
      </body>
    </html>
  )
}
