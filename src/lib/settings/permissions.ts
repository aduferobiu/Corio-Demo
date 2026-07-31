export type PermissionGroup = {
  key: string
  label: string
  permissions: { key: string; label: string }[]
}

// Loan-domain permission catalog used by the Roles & Permissions screen.
// These are stored against a role for reference/documentation purposes and
// are not individually enforced — actual access control is driven by the
// fixed system role (loan_officer / branch_officer / credit_officer / md / admin).
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: 'customers',
    label: 'Customer Management',
    permissions: [
      { key: 'customers.view', label: 'View customer profiles' },
      { key: 'customers.edit', label: 'Edit customer profiles' },
      { key: 'customers.create', label: 'Create new customers' },
      { key: 'customers.suspend', label: 'Suspend or restore customer accounts' },
    ],
  },
  {
    key: 'loans',
    label: 'Loan Applications',
    permissions: [
      { key: 'loans.view', label: 'View all applications' },
      { key: 'loans.create', label: 'Create loan applications' },
      { key: 'loans.query', label: 'Raise or respond to queries' },
      { key: 'loans.decide', label: 'Approve or reject applications' },
    ],
  },
  {
    key: 'team',
    label: 'Team & Roles',
    permissions: [
      { key: 'team.view', label: 'View team members' },
      { key: 'team.manage', label: 'Add or remove team members' },
      { key: 'roles.manage', label: 'Create or edit roles' },
      { key: 'roles.assign', label: 'Assign roles to team members' },
    ],
  },
  {
    key: 'reports',
    label: 'Reports & Dashboards',
    permissions: [
      { key: 'reports.dashboards', label: 'View dashboards' },
      { key: 'reports.bank-statement', label: 'View bank statement analysis' },
      { key: 'reports.export', label: 'Export reports' },
      { key: 'reports.overdue', label: 'View overdue alerts' },
    ],
  },
]

export const ALL_PERMISSION_KEYS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key))
