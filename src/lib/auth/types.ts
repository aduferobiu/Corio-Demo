export const ROLES = ['loan_officer', 'branch_officer', 'credit_officer', 'md', 'admin'] as const
export type Role = (typeof ROLES)[number]

export type AuthUser = {
  id: string
  name: string
  email: string
  role: Role
  branch: string | null
  avatarUrl: string | null
}
