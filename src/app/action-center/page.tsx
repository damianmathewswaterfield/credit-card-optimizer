import Link from 'next/link'
import { AlertCircle, TrendingDown, CheckCircle } from 'lucide-react'
import { prisma } from '@/lib/db'
import { calculateNextExpiry } from '@/lib/benefits/expiry'
import { format, formatDistanceToNow } from 'date-fns'

// Force dynamic rendering - database queries run at request time, not build time
export const dynamic = 'force-dynamic'

export default async function ActionCenterPage() {
  const cards = await prisma.card.findMany({
    where: { active: true },
    include: {
      benefits: {
        where: { active: true },
      },
      welcomeBonuses: true,
    },
  })

  const today = new Date()

  // Section 1: Expiring Soon
  const expiringBenefits: Array<{
    benefit: (typeof cards)[0]['benefits'][0]
    card: (typeof cards)[0]
    daysUntilExpiry: number
    expiryDate: Date
    valueAtRisk: number
  }> = []

  for (const card of cards) {
    for (const benefit of card.benefits) {
      if (benefit.type === 'RECURRING_CREDIT' && benefit.nominalValue && benefit.currency === 'USD') {
        try {
          const expiryInfo = calculateNextExpiry(
            benefit.cycleType,
            benefit.cycleDefinition,
            today,
            card.renewalMonthDay
          )

          if (expiryInfo.daysUntilExpiry <= 60) {
            expiringBenefits.push({
              benefit,
              card,
              daysUntilExpiry: expiryInfo.daysUntilExpiry,
              expiryDate: expiryInfo.nextExpiryDate,
              valueAtRisk: benefit.usageLimitPerCycle || benefit.nominalValue,
            })
          }
        } catch (e) {
          // Skip
        }
      }
    }
  }

  expiringBenefits.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)

  // Section 2: Incomplete Welcome Bonuses
  const activeWelcomeBonuses = cards
    .flatMap((card) =>
      card.welcomeBonuses.filter((wb) => !wb.earned).map((wb) => ({ card, welcomeBonus: wb }))
    )
    .map((item) => {
      const daysLeft = Math.max(
        0,
        Math.ceil(
          (new Date(item.welcomeBonus.spendWindowEnd).getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )

      const remaining = item.welcomeBonus.requiredSpend - item.welcomeBonus.currentSpend
      const progress = (item.welcomeBonus.currentSpend / item.welcomeBonus.requiredSpend) * 100

      const requiredDaily = daysLeft > 0 ? remaining / daysLeft : 0
      const requiredWeekly = requiredDaily * 7

      return {
        ...item,
        daysLeft,
        remaining,
        progress,
        requiredDaily,
        requiredWeekly,
      }
    })

  // Section 3: Underused Recurring Benefits (simplified - just show monthly credits)
  const monthlyCredits = cards.flatMap((card) =>
    card.benefits
      .filter(
        (b) =>
          b.type === 'RECURRING_CREDIT' &&
          b.cycleType === 'MONTHLY' &&
          b.nominalValue &&
          b.currency === 'USD'
      )
      .map((benefit) => ({ card, benefit }))
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Action Center</h1>
        <p className="text-neutral-600 mt-2">
          Prioritized actions to maximize your credit card value
        </p>
      </div>

      {/* Section 1: Expiring Soon */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-danger-600" />
          <h2 className="text-xl font-semibold text-neutral-900">Expiring Soon</h2>
          <span className="badge-danger">{expiringBenefits.length}</span>
        </div>

        {expiringBenefits.length > 0 ? (
          <div className="space-y-3">
            {expiringBenefits.map((item) => {
              const urgency =
                item.daysUntilExpiry <= 7 ? 'critical' : item.daysUntilExpiry <= 30 ? 'high' : 'medium'

              return (
                <div
                  key={`${item.card.id}-${item.benefit.id}`}
                  className={`card ${
                    urgency === 'critical'
                      ? 'border-danger-300 bg-danger-50'
                      : urgency === 'high'
                      ? 'border-warning-300 bg-warning-50'
                      : 'border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-neutral-900">{item.benefit.name}</h3>
                        <span
                          className={
                            urgency === 'critical'
                              ? 'badge-danger'
                              : urgency === 'high'
                              ? 'badge-warning'
                              : 'badge-neutral'
                          }
                        >
                          {urgency === 'critical'
                            ? 'URGENT'
                            : urgency === 'high'
                            ? 'High Priority'
                            : 'Medium Priority'}
                        </span>
                      </div>
                      <p className="text-sm text-neutral-600 mb-3">
                        {item.card.productName} • Expires{' '}
                        {formatDistanceToNow(item.expiryDate, { addSuffix: true })} on{' '}
                        {format(item.expiryDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-danger-700">
                        ${item.valueAtRisk.toFixed(0)}
                      </p>
                      <p className="text-xs text-neutral-600">at risk</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-neutral-200">
                    <p className="text-sm font-medium text-neutral-900 mb-1">Quick Action:</p>
                    <p className="text-sm text-neutral-700">{item.benefit.triggerDescription}</p>
                  </div>

                  <Link
                    href={`/cards/${item.card.id}`}
                    className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View card details →
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card text-center py-8">
            <CheckCircle className="w-8 h-8 text-success-600 mx-auto mb-2" />
            <p className="text-neutral-600">
              No credits expiring in the next 60 days. You're all set!
            </p>
          </div>
        )}
      </div>

      {/* Section 2: Incomplete Welcome Bonuses */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-warning-600" />
          <h2 className="text-xl font-semibold text-neutral-900">Welcome Bonus Progress</h2>
          {activeWelcomeBonuses.length > 0 && (
            <span className="badge-warning">{activeWelcomeBonuses.length}</span>
          )}
        </div>

        {activeWelcomeBonuses.length > 0 ? (
          <div className="space-y-3">
            {activeWelcomeBonuses.map((item) => (
              <div key={item.welcomeBonus.id} className="card border-warning-300">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      {item.card.productName}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      Earn {item.welcomeBonus.expectedPoints.toLocaleString()}{' '}
                      {item.welcomeBonus.program} points
                    </p>
                  </div>
                  <span className="badge-warning">{item.daysLeft} days left</span>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-neutral-600">Progress</span>
                    <span className="font-medium text-neutral-900">
                      ${item.welcomeBonus.currentSpend.toLocaleString()} / $
                      {item.welcomeBonus.requiredSpend.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(100, item.progress)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200">
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Remaining spend</p>
                    <p className="font-semibold text-neutral-900">
                      ${item.remaining.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600 mb-1">Suggested pace</p>
                    <p className="font-semibold text-neutral-900">
                      ${Math.ceil(item.requiredWeekly).toLocaleString()}/week
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-primary-50 rounded-lg border border-primary-200">
                  <p className="text-sm text-primary-900">
                    <strong>Action:</strong> Spend approximately $
                    {Math.ceil(item.requiredDaily).toLocaleString()}/day on this card to meet the
                    bonus requirement by {format(new Date(item.welcomeBonus.spendWindowEnd), 'MMM d')}.
                  </p>
                </div>

                <Link
                  href={`/cards/${item.card.id}`}
                  className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View card details →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="card text-center py-8">
            <CheckCircle className="w-8 h-8 text-success-600 mx-auto mb-2" />
            <p className="text-neutral-600">
              No active welcome bonuses. All bonuses have been earned!
            </p>
          </div>
        )}
      </div>

      {/* Section 3: Monthly Credits Reminder */}
      {monthlyCredits.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-neutral-900">Monthly Credits</h2>
            <span className="badge-neutral">{monthlyCredits.length}</span>
          </div>

          <div className="card bg-primary-50 border-primary-200">
            <p className="text-sm text-primary-900 mb-3">
              <strong>Reminder:</strong> These credits reset on the 1st of each month. Make sure to
              use them before they expire.
            </p>

            <div className="space-y-2">
              {monthlyCredits.map((item) => (
                <div
                  key={`${item.card.id}-${item.benefit.id}`}
                  className="flex items-center justify-between py-2 border-b border-primary-200 last:border-0"
                >
                  <div>
                    <p className="font-medium text-primary-900">{item.benefit.name}</p>
                    <p className="text-sm text-primary-700">{item.card.productName}</p>
                  </div>
                  <p className="font-semibold text-primary-900">
                    ${item.benefit.usageLimitPerCycle?.toFixed(0)}/mo
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
