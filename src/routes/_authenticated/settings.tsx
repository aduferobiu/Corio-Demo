import { createFileRoute } from '@tanstack/react-router'

import { AppHeader } from '#/components/loans/app-header'
import { Sidebar } from '#/components/loans/sidebar'
import { PasswordTab } from '#/components/settings/password-tab'
import { PersonalDetailsTab } from '#/components/settings/personal-details-tab'
import { RolesTab } from '#/components/settings/roles-tab'
import { TeamsTab } from '#/components/settings/teams-tab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { listRolesFn } from '#/lib/settings/roles.functions'
import { listTeamMembersFn } from '#/lib/settings/teams.functions'

export const Route = createFileRoute('/_authenticated/settings')({
  loader: async ({ context }) => {
    const canManageTeam = context.user!.role === 'md' || context.user!.role === 'admin'
    if (!canManageTeam) return { canManageTeam: false as const }

    const [team, roles] = await Promise.all([listTeamMembersFn(), listRolesFn()])
    return { canManageTeam: true as const, team, roles }
  },
  component: SettingsPage,
})

function SettingsPage() {
  const data = Route.useLoaderData()
  const { user } = Route.useRouteContext()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user!} active="Settings" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AppHeader title="Settings" />
        <main className="flex flex-1 flex-col overflow-y-auto px-8 py-6">
          <Tabs defaultValue="personal-details">
            <TabsList variant="line" className="h-9 gap-5 border-b border-[var(--corio-neutral-100)] p-0">
              <TabsTrigger value="personal-details" className="px-1">
                Personal Details
              </TabsTrigger>
              <TabsTrigger value="password" className="px-1">
                Password
              </TabsTrigger>
              {data.canManageTeam && (
                <>
                  <TabsTrigger value="teams" className="px-1">
                    Teams
                  </TabsTrigger>
                  <TabsTrigger value="roles" className="px-1">
                    Roles &amp; Permissions
                  </TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="personal-details" className="pt-6">
              <PersonalDetailsTab user={user!} />
            </TabsContent>

            <TabsContent value="password" className="pt-6">
              <PasswordTab />
            </TabsContent>

            {data.canManageTeam && (
              <>
                <TabsContent value="teams" className="pt-6">
                  <TeamsTab initialMembers={data.team} currentUserId={user!.id} />
                </TabsContent>

                <TabsContent value="roles" className="pt-6">
                  <RolesTab initialRoles={data.roles} />
                </TabsContent>
              </>
            )}
          </Tabs>
        </main>
      </div>
    </div>
  )
}
