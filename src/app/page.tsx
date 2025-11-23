import { CreditCard, Calendar, AlertCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { calculateNextExpiry, isExpiringSoon } from '@/lib/benefits/expiry'
import { formatDistanceToNow } from 'date-fns'

export default async function DashboardPage() {
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

  // Calculate expiring benefits
  const expiringBenefits: Array<{
    benefit: (typeof cards)[0]['benefits'][0]
    card: (typeof cards)[0]
    daysUntilExpiry: number
    expiryDate: Date
  }> = []

  for (const card of cards) {
    for (const benefit of card.benefits) {
      if (benefit.type === 'RECURRING_CREDIT' && benefit.nominalValue) {
        try {
          const expiryInfo = calculateNextExpiry(
            benefit.cycleType,
            benefit.cycleDefinition,
            today,
            card.renewalMonthDay
          )

          if (isExpiringSoon(expiryInfo, 60)) {
            expiringBenefits.push({
              benefit,
              card,
              daysUntilExpiry: expiryInfo.daysUntilExpiry,
              expiryDate: expiryInfo.nextExpiryDate,
            })
          }
        } catch (e) {
          // Skip benefits with calculation errors
        }
      }
    }
  }

  // Sort by days until expiry
  expiringBenefits.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)

  // Calculate total potential value
  const totalPotentialValue = cards.reduce((sum, card) => {
    const cardCredits = card.benefits
      .filter((b) => b.type === 'RECURRING_CREDIT' && b.nominalValue && b.currency === 'USD')
      .reduce((s, b) => s + (b.nominalValue || 0), 0)
    return sum + cardCredits
  }, 0)

  // In-progress welcome bonuses
  const activeWelcomeBonuses = cards.flatMap((card) =>
    card.welcomeBonuses.filter((wb) => !wb.earned).map((wb) => ({ card, welcomeBonus: wb }))
  )

  // Count upcoming deadlines (expiring soon + welcome bonuses)
  const upcomingDeadlines = expiringBenefits.filter((eb) => eb.daysUntilExpiry <= 30).length + activeWelcomeBonuses.length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-2">Your credit card benefits overview</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-50">
              <CreditCard className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Active Cards</p>
              <p className="text-2xl font-bold text-neutral-900">{cards.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning-50">
              <AlertCircle className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-neutral-900">
                {expiringBenefits.filter((eb) => eb.daysUntilExpiry <= 30).length}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success-50">
              <TrendingUp className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Potential Value</p>
              <p className="text-2xl font-bold text-neutral-900">
                ${totalPotentialValue.toFixed(0)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-50">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-600">Upcoming Deadlines</p>
              <p className="text-2xl font-bold text-neutral-900">{upcomingDeadlines}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Urgent actions */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Top Urgent Actions</h2>
          <Link
            href="/action-center"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all →
          </Link>
        </div>

        <div className="space-y-3">
          {expiringBenefits.slice(0, 3).map((item) => {
            const urgencyLevel =
              item.daysUntilExpiry <= 7
                ? 'danger'
                : item.daysUntilExpiry <= 30
                ? 'warning'
                : 'neutral'

            const bgColor =
              urgencyLevel === 'danger'
                ? 'bg-danger-50 border-danger-200'
                : urgencyLevel === 'warning'
                ? 'bg-warning-50 border-warning-200'
                : 'bg-neutral-50 border-neutral-200'

            const textColor =
              urgencyLevel === 'danger'
                ? 'text-danger-900'
                : urgencyLevel === 'warning'
                ? 'text-warning-900'
                : 'text-neutral-900'

            const iconColor =
              urgencyLevel === 'danger'
                ? 'text-danger-600'
                : urgencyLevel === 'warning'
                ? 'text-warning-600'
                : 'text-neutral-600'

            return (
              <Link
                key={`${item.card.id}-${item.benefit.id}`}
                href={`/cards/${item.card.id}`}
                className={`flex items-start gap-3 p-4 rounded-lg border ${bgColor} hover:opacity-90 transition-opacity`}
              >
                <AlertCircle className={`w-5 h-5 ${iconColor} mt-0.5`} />
                <div className="flex-1">
                  <p className={`font-medium ${textColor}`}>{item.benefit.name}</p>
                  <p className={`text-sm mt-1 ${iconColor}`}>
                    ${item.benefit.nominalValue?.toFixed(0)} at stake •{' '}
                    {item.card.productName} • Expires{' '}
                    {formatDistanceToNow(item.expiryDate, { addSuffix: true })}
                  </p>
                </div>
              </Link>
            )
          })}

          {activeWelcomeBonuses.slice(0, 2).map((item) => {
            const daysLeft = Math.max(
              0,
              Math.ceil(
                (new Date(item.welcomeBonus.spendWindowEnd).getTime() - today.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )

            const remaining = item.welcomeBonus.requiredSpend - item.welcomeBonus.currentSpend

            return (
              <Link
                key={item.welcomeBonus.id}
                href={`/cards/${item.card.id}`}
                className="flex items-start gap-3 p-4 rounded-lg bg-warning-50 border border-warning-200 hover:opacity-90 transition-opacity"
              >
                <AlertCircle className="w-5 h-5 text-warning-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-warning-900">
                    Welcome bonus deadline approaching
                  </p>
                  <p className="text-sm text-warning-700 mt-1">
                    {item.card.productName}: ${remaining.toLocaleString()} more spend needed in{' '}
                    {daysLeft} days to earn {item.welcomeBonus.expectedPoints.toLocaleString()}{' '}
                    {item.welcomeBonus.program} points
                  </p>
                </div>
              </Link>
            )
          })}

          {expiringBenefits.length === 0 && activeWelcomeBonuses.length === 0 && (
            <div className="text-center py-8 text-neutral-600">
              <p>No urgent actions at the moment. You're all caught up!</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/cards" className="card-hover text-center">
          <CreditCard className="w-8 h-8 text-primary-600 mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">View All Cards</h3>
          <p className="text-sm text-neutral-600">Manage your {cards.length} credit cards</p>
        </Link>

        <Link href="/calendar" className="card-hover text-center">
          <Calendar className="w-8 h-8 text-primary-600 mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">Calendar View</h3>
          <p className="text-sm text-neutral-600">See all upcoming resets and deadlines</p>
        </Link>

        <Link href="/action-center" className="card-hover text-center">
          <AlertCircle className="w-8 h-8 text-primary-600 mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-900 mb-1">Action Center</h3>
          <p className="text-sm text-neutral-600">View detailed recommendations</p>
        </Link>
      </div>
    </div>
  )
}
