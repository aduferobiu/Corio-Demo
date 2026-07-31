export const DASHBOARD_RANGE_PRESETS = ['12m', '30d', '7d', 'custom'] as const
export type DashboardRangePreset = (typeof DASHBOARD_RANGE_PRESETS)[number]

export type DashboardRangeInput = {
  range?: DashboardRangePreset
  from?: string
  to?: string
}

const PRESET_DAYS: Record<Exclude<DashboardRangePreset, 'custom'>, number> = {
  '12m': 365,
  '30d': 30,
  '7d': 7,
}

// Resolves a dashboard filter (preset or explicit custom dates) into concrete
// [from, to) bounds used to scope every dashboard query by `createdAt`.
export function resolveDashboardRange(input: DashboardRangeInput | undefined): { from: Date; to: Date } {
  if (input?.range === 'custom' && input.from) {
    const from = new Date(input.from)
    const to = input.to ? new Date(input.to) : new Date()
    to.setHours(23, 59, 59, 999)
    return { from, to }
  }

  const preset = input?.range && input.range !== 'custom' ? input.range : '30d'
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - PRESET_DAYS[preset])
  return { from, to }
}

// Reads the dashboard range filter out of the URL search params — shared
// `validateSearch` for every dashboard route so the filter is bookmarkable
// and survives navigation/reload.
export function validateDashboardRangeSearch(search: Record<string, unknown>): DashboardRangeInput {
  const range =
    typeof search.range === 'string' && (DASHBOARD_RANGE_PRESETS as readonly string[]).includes(search.range)
      ? (search.range as DashboardRangePreset)
      : undefined
  return {
    range,
    from: typeof search.from === 'string' ? search.from : undefined,
    to: typeof search.to === 'string' ? search.to : undefined,
  }
}
