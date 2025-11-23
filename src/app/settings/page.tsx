import { prisma } from '@/lib/db'
import { UserPreferencesForm } from '@/components/settings/UserPreferencesForm'
import { CardManagement } from '@/components/settings/CardManagement'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const user = await prisma.user.findFirst()
  const cards = await prisma.card.findMany({
    where: { active: true },
    include: {
      welcomeBonuses: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  if (!user) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
          <p className="text-neutral-600 mt-2">Configure your preferences</p>
        </div>
        <div className="card">
          <p className="text-danger-700">No user found. Please run database seed.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
        <p className="text-neutral-600 mt-2">
          Configure your preferences and manage your credit cards
        </p>
      </div>

      {/* User Preferences */}
      <div className="card">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">User Preferences</h2>
        <UserPreferencesForm
          initialData={{
            timezone: user.timezone,
            defaultReminderDays: user.defaultReminderDays,
            valuePerPointRules: user.valuePerPointRules,
          }}
        />
      </div>

      {/* Card Management */}
      <div className="card">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">Card Management</h2>
        <p className="text-sm text-neutral-600 mb-6">
          Update card open dates, renewal dates, and welcome bonus progress. This ensures accurate
          benefit cycle calculations.
        </p>
        <CardManagement cards={cards} />
      </div>

      {/* Help Text */}
      <div className="card bg-primary-50 border-primary-200">
        <h3 className="font-semibold text-primary-900 mb-2">Important Notes</h3>
        <ul className="text-sm text-primary-800 space-y-1 list-disc list-inside">
          <li>
            <strong>Open Date:</strong> The date you opened/activated the card (used for some
            benefit calculations)
          </li>
          <li>
            <strong>Renewal Date (MM-DD):</strong> Your cardmember year anniversary for annual fee
            and cardmember-year benefits
          </li>
          <li>
            <strong>Current Spend:</strong> Update this regularly to track welcome bonus progress
            accurately
          </li>
          <li>
            <strong>Points Value:</strong> Adjust based on your typical redemption strategy
            (transfers, portal, cash back)
          </li>
        </ul>
      </div>
    </div>
  )
}
