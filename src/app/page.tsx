'use client'

import { CreditCard, Calendar, AlertCircle, TrendingUp, Activity } from 'lucide-react'
import Link from 'next/link'
import { calculateNextExpiry, isExpiringSoon } from '@/lib/benefits/expiry'
import { formatDistanceToNow, format } from 'date-fns'
import { CARDS } from '@/data/cards'
import { enrichCardWithUserData, getBenefitUsage, getAllBenefitUsage, type EnrichedCard } from '@/lib/storage'
import { useState, useEffect } from 'react'

export default function DashboardPage() {
  const [cards, setCards] = useState<EnrichedCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load cards with user data from localStorage
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

  // Calculate expiring benefits
  const expiringBenefits: Array<{
    benefit: any
    card: EnrichedCard
    daysUntilExpiry: number
    expiryDate: Date
  }> = []

  for (const card of cards) {
    for (const benefit of card.benefits) {
      if (benefit.type === 'RECURRING_CREDIT' && benefit.usageLimitPerCycle) {
        try {
          const expiryInfo = calculateNextExpiry(
            benefit.cycleType,
            benefit.cycleDefinition,
            today,
            card.renewalMonthDay
          )

          if (isExpiringSoon(expiryInfo, 60)) {
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
              })
            }
          }
        } catch (e) {
          // Skip benefits with calculation errors
        }
      }
    }
  }

  // Sort by days until expiry
  expiringBenefits.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)

  // In-progress welcome bonuses
  const activeWelcomeBonuses = cards
    .filter((card) => card.welcomeBonus && !card.welcomeBonus.earned)
    .map((card) => ({ card, welcomeBonus: card.welcomeBonus! }))

  // Count upcoming deadlines (expiring soon + welcome bonuses)
  const upcomingDeadlines =
    expiringBenefits.filter((eb) => eb.daysUntilExpiry <= 30).length + activeWelcomeBonuses.length

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Dashboard</h1>
        <p className="text-neutral-600 mt-2">Your credit card benefits overview</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <div className="card text-center">
          <CreditCard className="w-4 h-4 text-primary-600 mx-auto mb-1" />
          <p className="text-xs text-neutral-600">Cards</p>
          <p className="text-lg font-bold text-neutral-900">{cards.length}</p>
        </div>

        <div className="card text-center">
          <TrendingUp className="w-4 h-4 text-primary-600 mx-auto mb-1" />
          <p className="text-xs text-neutral-600">Ready</p>
          <p className="text-lg font-bold text-neutral-900">
            {expiringBenefits.filter((eb) => eb.daysUntilExpiry <= 30).length}
          </p>
        </div>

        <div className="card text-center">
          <Calendar className="w-4 h-4 text-primary-600 mx-auto mb-1" />
          <p className="text-xs text-neutral-600">Actions</p>
          <p className="text-lg font-bold text-neutral-900">{upcomingDeadlines}</p>
        </div>
      </div>

      {/* Ready to claim */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-900">Ready to Claim</h2>
          <Link
            href="/action-center"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View all →
          </Link>
        </div>

        <div className="space-y-3">
          {expiringBenefits.slice(0, 3).map((item) => {
            return (
              <Link
                key={`${item.card.id}-${item.benefit.id}`}
                href={`/benefit/${item.benefit.id}`}
                className="flex items-start gap-3 p-4 rounded-lg border bg-primary-50 border-primary-200 hover:bg-primary-100 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-primary-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-primary-900">
                    {item.benefit.name.replace(/\$\d+\s*(Annual|Yearly|Year)/gi, '').trim()}
                  </p>
                  <p className="text-sm mt-1 text-primary-700">
                    ${item.benefit.usageLimitPerCycle.toFixed(0)}{getCycleLabel(item.benefit.cycleType)} available •{' '}
                    {item.card.productName} • Renews{' '}
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
                className="flex items-start gap-3 p-4 rounded-lg bg-primary-50 border border-primary-200 hover:bg-primary-100 transition-colors"
              >
                <TrendingUp className="w-5 h-5 text-primary-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-primary-900">
                    Welcome bonus in progress
                  </p>
                  <p className="text-sm text-primary-700 mt-1">
                    {item.card.productName}: ${remaining.toLocaleString()} more to earn{' '}
                    {item.welcomeBonus.expectedPoints.toLocaleString()}{' '}
                    {item.welcomeBonus.program} points • {daysLeft} days left
                  </p>
                </div>
              </Link>
            )
          })}

          {expiringBenefits.length === 0 && activeWelcomeBonuses.length === 0 && (
            <div className="text-center py-3 text-neutral-600">
              <p>You're all caught up! Check back soon for new opportunities.</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      {(() => {
        const allUsage = getAllBenefitUsage()
        const recentEntries: Array<{
          entry: any
          benefit: any
          card: any
        }> = []

        for (const usage of allUsage) {
          const card = cards.find((c) => c.id === usage.cardId)
          if (!card) continue
          const benefit = card.benefits.find((b: any) => b.id === usage.benefitId)
          if (!benefit) continue

          for (const entry of usage.usages) {
            recentEntries.push({ entry, benefit, card })
          }
        }

        recentEntries.sort(
          (a, b) => new Date(b.entry.date).getTime() - new Date(a.entry.date).getTime()
        )

        return recentEntries.length > 0 ? (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" />
                <h2 className="text-xl font-semibold text-neutral-900">Recent Activity</h2>
              </div>
              <Link
                href="/usage-history"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                View all →
              </Link>
            </div>

            <div className="space-y-2">
              {recentEntries.slice(0, 5).map((item) => (
                <div
                  key={item.entry.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-neutral-900">
                      {item.benefit.name.replace(/\$\d+\s*(Annual|Yearly|Year)/gi, '').trim()}
                    </p>
                    <p className="text-sm text-neutral-600">{item.card.productName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">${item.entry.amount.toFixed(2)}</p>
                    <p className="text-xs text-neutral-600">
                      {format(new Date(item.entry.date), 'MMM d')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null
      })()}

      {/* Quick links */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        <Link href="/cards" className="card-hover text-center">
          <CreditCard className="w-5 h-5 text-primary-600 mx-auto mb-1" />
          <p className="text-xs font-medium text-neutral-900">Cards</p>
        </Link>

        <Link href="/calendar" className="card-hover text-center">
          <Calendar className="w-5 h-5 text-primary-600 mx-auto mb-1" />
          <p className="text-xs font-medium text-neutral-900">Calendar</p>
        </Link>

        <Link href="/action-center" className="card-hover text-center">
          <AlertCircle className="w-5 h-5 text-primary-600 mx-auto mb-1" />
          <p className="text-xs font-medium text-neutral-900">Actions</p>
        </Link>

        <Link href="/value" className="card-hover text-center">
          <TrendingUp className="w-5 h-5 text-primary-600 mx-auto mb-1" />
          <p className="text-xs font-medium text-neutral-900">Value</p>
        </Link>

        <Link href="/usage-history" className="card-hover text-center">
          <Activity className="w-5 h-5 text-primary-600 mx-auto mb-1" />
          <p className="text-xs font-medium text-neutral-900">History</p>
        </Link>

        <Link href="/settings" className="card-hover text-center">
          <CreditCard className="w-5 h-5 text-primary-600 mx-auto mb-1" />
          <p className="text-xs font-medium text-neutral-900">Settings</p>
        </Link>
      </div>
    </div>
  )
}
