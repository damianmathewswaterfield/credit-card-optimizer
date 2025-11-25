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
    <div className="space-y-3">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Opportunities</h1>
        <p className="text-neutral-600 mt-2">
          Benefits ready to use and maximize
        </p>
      </div>

      {/* Section 1: Ready to Use */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          <h2 className="text-xl font-semibold text-neutral-900">Ready to Use</h2>
          <span className="badge-primary">{expiringBenefits.length}</span>
        </div>

        {expiringBenefits.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {expiringBenefits.map((item) => {
              return (
                <Link
                  key={`${item.card.id}-${item.benefit.id}`}
                  href={`/benefit/${item.benefit.id}`}
                  className="card border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  <div className="text-center mb-2">
                    <p className="text-base font-bold text-primary-700">
                      ${item.valueAtRisk.toFixed(0)}
                    </p>
                    <p className="text-xs text-neutral-600">{item.cycleLabel}</p>
                  </div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-1 line-clamp-2">
                    {item.benefit.name}
                  </h3>
                  <p className="text-xs text-neutral-600 mb-1">{item.card.productName}</p>
                  <p className="text-xs text-neutral-500">
                    Renews {formatDistanceToNow(item.expiryDate, { addSuffix: true })}
                  </p>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="card text-center py-3">
            <CheckCircle className="w-8 h-8 text-success-600 mx-auto mb-2" />
            <p className="text-neutral-600">
              You're all caught up! Check back soon.
            </p>
          </div>
        )}
      </div>

      {/* Section 2: Incomplete Welcome Bonuses */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-warning-600" />
          <h2 className="text-xl font-semibold text-neutral-900">Welcome Bonus Progress</h2>
          {activeWelcomeBonuses.length > 0 && (
            <span className="badge-warning">{activeWelcomeBonuses.length}</span>
          )}
        </div>

        {activeWelcomeBonuses.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {activeWelcomeBonuses.map((item) => (
              <Link
                key={item.welcomeBonus.id}
                href={`/cards/${item.card.id}`}
                className="card border-warning-300 hover:bg-warning-50 transition-colors"
              >
                <h3 className="text-sm font-semibold text-neutral-900 mb-1 line-clamp-1">
                  {item.card.productName}
                </h3>
                <p className="text-xs text-neutral-600 mb-2">
                  {item.welcomeBonus.expectedPoints.toLocaleString()} {item.welcomeBonus.program} pts
                </p>

                <div className="w-full bg-neutral-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-warning-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, item.progress)}%` }}
                  />
                </div>

                <div className="flex justify-between text-xs mb-1">
                  <span className="text-neutral-600">{item.progress.toFixed(0)}%</span>
                  <span className="text-neutral-900 font-medium">{item.daysLeft}d left</span>
                </div>

                <p className="text-xs text-neutral-600">
                  ${Math.ceil(item.requiredWeekly).toLocaleString()}/wk
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card text-center py-3">
            <CheckCircle className="w-8 h-8 text-success-600 mx-auto mb-2" />
            <p className="text-neutral-600">
              No active welcome bonuses. All bonuses have been earned!
            </p>
          </div>
        )}
      </div>

      {/* Section 3: Monthly Credits Reminder */}
      {monthlyCredits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary-600" />
            <h2 className="text-xl font-semibold text-neutral-900">Monthly Credits</h2>
            <span className="badge-neutral">{monthlyCredits.length}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {monthlyCredits.map((item: any) => (
              <div
                key={`${item.card.id}-${item.benefit.id}`}
                className="card bg-primary-50 border-primary-200 text-center"
              >
                <p className="text-base font-bold text-primary-900">
                  ${item.benefit.usageLimitPerCycle?.toFixed(0)}
                </p>
                <p className="text-xs text-neutral-600 mb-1">/month</p>
                <p className="text-sm font-medium text-primary-900 line-clamp-2">{item.benefit.name}</p>
                <p className="text-xs text-primary-700">{item.card.productName}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
