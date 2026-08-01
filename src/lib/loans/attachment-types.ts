// The same document categories offered during application creation
// (src/routes/_authenticated/loan-officer/new.tsx), reused so attachments added
// later follow the same format instead of free-text labels.
export const ATTACHMENT_TYPES = [
  'National ID Card',
  'International Passport',
  "Driver's License",
  'Employment Letter',
  'Payslip for the last 10 months',
  'Car Papers',
  'Land Papers',
] as const

export type AttachmentType = (typeof ATTACHMENT_TYPES)[number]
