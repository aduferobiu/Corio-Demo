import { FileCheck2, FileUp, MessageSquareText, TrendingUp } from 'lucide-react'

import type { listNotificationsFn } from '#/lib/notifications/notifications.functions'

type Notification = Awaited<ReturnType<typeof listNotificationsFn>>[number]

export const NOTIFICATION_ICONS: Record<Notification['type'], typeof MessageSquareText> = {
  query_raised: MessageSquareText,
  query_response: MessageSquareText,
  document_upload_request: FileUp,
  document_decision: FileCheck2,
  loan_activity: TrendingUp,
}
