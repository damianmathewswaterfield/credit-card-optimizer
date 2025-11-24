'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown, CheckCircle } from 'lucide-react'
import { calculateNextExpiry } from '@/lib/benefits/expiry'
import { format, formatDistanceToNow } from 'date-fns'
import { CARDS } from '@/data/cards'
import { enrichCardWithUserData, getBenefitUsage, type EnrichedCard } from '@/lib/storage'
import { useState, useEffect } from 'react'

export default function ActionCenterPage() {
  const [cards, setCards] = useState<EnrichedCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const enrichedCards = CARDS.map(enrichCardWithUserData)
    setCards(enrichedCards)
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-600">Loading...</p>
      </div>
    )
  }

  const today = new Date()

  // Helper to get cycle label
  const getCycleLabel = (cycleType: string) => {
    const labels: Record<string, string> = {
      MONTHLY: '/month',
      CALENDAR_YEAR: '/year',
      CARDMEMBER_YEAR: '/year',
      SEMIANNUAL_CALENDAR: '/6 months',
      ONE_TIME: '',
    }
    return labels[cycleType] || ''
  }

  // Helper to get cycle dates
  const getCycleDates = (cycleType: string, card: EnrichedCard) => {
    const year = today.getFullYear()
    const month = today.getMonth()

    switch (cycleType) {
      case 'MONTHLY':
        return {
          start: new Date(year, month, 1).toISOString().split('T')[0],
          end: new Date(year, month + 1, 0).toISOString().split('T')[0],
        }
      case 'CALENDAR_YEAR':
        return {
          start: `${year}-01-01`,
          end: `${year}-12-31`,
        }
      default:
        return { start: `${year}-01-01`, end: `${year}-12-31` }
    }
  }

  // Section 1: Expiring Soon
  const expiringBenefits: Array<{
    benefit: any
    card: EnrichedCard
    daysUntilExpiry: number
    expiryDate: Date
    valueAtRisk: number
    cycleLabel: string
  }> = []

  for (const card of cards) {
    for (const benefit of card.benefits) {
      if (benefit.type === 'RECURRING_CREDIT' && benefit.usageLimitPerCycle && benefit.currency === 'USD') {
        try {
          const expiryInfo = calculateNextExpiry(
            benefit.cycleType,
            benefit.cycleDefinition,
            today,
            card.renewalMonthDay
          )

          if (expiryInfo.daysUntilExpiry <= 60) {
            // Check if benefit has been fully used
            const cycleDates = getCycleDates(benefit.cycleType, card)
            const usageData = getBenefitUsage(benefit.id, cycleDates.start, cycleDates.end)
            const hasRemainingValue = !usageData || usageData.totalUsed < benefit.usageLimitPerCycle

            // Only show if there's remaining value to lose
            if (hasRemainingValue) {
              expiringBenefits.push({
                benefit,
                card,
                daysUntilExpiry: expiryInfo.daysUntilExpiry,
                expiryDate: expiryInfo.nextExpiryDate,
                valueAtRisk: benefit.usageLimitPerCycle,
                cycleLabel: getCycleLabel(benefit.cycleType),
              })
            }
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
    .filter((card) => card.welcomeBonus && !card.welcomeBonus.earned)
    .map((card) => {
      const welcomeBonus = card.welcomeBonus!
      const daysLeft = Math.max(
        0,
        Math.ceil(
          (new Date(welcomeBonus.spendWindowEnd).getTime() - today.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )

      const remaining = welcomeBonus.requiredSpend - welcomeBonus.currentSpend
      const progress = (welcomeBonus.currentSpend / welcomeBonus.requiredSpend) * 100

      const requiredDaily = daysLeft > 0 ? remaining / daysLeft : 0
      const requiredWeekly = requiredDaily * 7

      return {
        card,
        welcomeBonus,
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
        (b: any) =>
          b.type === 'RECURRING_CREDIT' &&
          b.cycleType === 'MONTHLY' &&
          b.nominalValue &&
          b.currency === 'USD'
      )
      .map((benefit: any) => ({ card, benefit }))
  )

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Opportunities</h1>
        <p className="text-neutral-600 mt-2">
          Benefits ready to use and maximize
        </p>
      </div>

      {/* Section 1: Ready to Use */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h2 className="text-xl font-semibold text-neutral-900">Ready to Use</h2>
          <span className="badge-primary">{expiringBenefits.length}</span>
        </div>

        {expiringBenefits.length > 0 ? (
          <div className="space-y-3">
            {expiringBenefits.map((item) => {
              return (
                <div
                  key={`${item.card.id}-${item.benefit.id}`}
                  className="card border-primary-200 bg-primary-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-neutral-900">{item.benefit.name}</h3>
                      </div>
                      <p className="text-sm text-neutral-600 mb-3">
                        {item.card.productName} • Renews{' '}
                        {formatDistanceToNow(item.expiryDate, { addSuffix: true })} on{' '}
                        {format(item.expiryDate, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary-700">
                        ${item.valueAtRisk.toFixed(0)}{item.cycleLabel}
                      </p>
                      <p className="text-xs text-neutral-600">available</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-primary-200">
                    <p className="text-sm font-medium text-neutral-900 mb-1">Quick Action:</p>
                    <p className="text-sm text-neutral-700">{item.benefit.triggerDescription}</p>
                  </div>

                  <Link
                    href={`/benefit/${item.benefit.id}`}
                    className="mt-3 inline-block px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                  >
                    Log Usage →
                  </Link>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card text-center py-8">
            <CheckCircle className="w-8 h-8 text-success-600 mx-auto mb-2" />
            <p className="text-neutral-600">
              You're all caught up! Check back soon.
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
              {monthlyCredits.map((item: any) => (
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
