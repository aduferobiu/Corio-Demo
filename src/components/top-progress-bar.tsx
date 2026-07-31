import { useRouterState } from '@tanstack/react-router'

// Lives in the root shell (always mounted) so it overlays whatever page is
// currently showing instead of blanking it out while the next route's loader
// is still in flight.
export function TopProgressBar() {
  const isNavigating = useRouterState({ select: (s) => s.isLoading })

  if (!isNavigating) return null

  return (
    <div className="fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden bg-[var(--corio-blue-500)]/15">
      <div className="h-full w-1/3 animate-[corio-progress-bar_1.1s_ease-in-out_infinite] rounded-full bg-[var(--corio-blue-500)]" />
    </div>
  )
}
