'use client'

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Search } from 'lucide-react'
import { format } from 'date-fns'
import { CARDS } from '@/data/cards'
import { enrichCardWithUserData } from '@/lib/storage'
import { useState, useEffect } from 'react'
import { BenefitCard } from '@/components/benefits/BenefitCard'

export default function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [card, setCard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resolvedId, setResolvedId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    params.then((p) => {
      setResolvedId(p.id)
      const foundCard = CARDS.find((c) => c.id === p.id)
      if (foundCard) {
        setCard(enrichCardWithUserData(foundCard))
      }
      setLoading(false)
    })
  }, [params, refreshKey])

  const handleUsageUpdate = () => {
    setRefreshKey((prev) => prev + 1)
  }

  // Calculate cycle dates for benefits
  const getCycleDates = (cycleType: string) => {
    const today = new Date()
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
      case 'CARDMEMBER_YEAR':
        if (card?.renewalMonthDay) {
          const [renewalMonth, renewalDay] = card.renewalMonthDay.split('-').map(Number)
          const renewalDate = new Date(year, renewalMonth - 1, renewalDay)
          if (today < renewalDate) {
            return {
              start: new Date(year - 1, renewalMonth - 1, renewalDay).toISOString().split('T')[0],
              end: new Date(year, renewalMonth - 1, renewalDay - 1).toISOString().split('T')[0],
            }
          } else {
            return {
              start: new Date(year, renewalMonth - 1, renewalDay).toISOString().split('T')[0],
              end: new Date(year + 1, renewalMonth - 1, renewalDay - 1).toISOString().split('T')[0],
            }
          }
        }
        return { start: `${year}-01-01`, end: `${year}-12-31` }
      default:
        return { start: `${year}-01-01`, end: `${year}-12-31` }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-600">Loading...</p>
      </div>
    )
  }

  if (!card) {
    notFound()
  }

  const today = new Date()

  // Filter benefits by search query
  const filteredBenefits = card.benefits.filter((b: any) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.triggerDescription?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group benefits by type
  const recurringCredits = filteredBenefits.filter((b: any) => b.type === 'RECURRING_CREDIT')
  const multipliers = filteredBenefits.filter((b: any) => b.type === 'MULTIPLIER')
  const otherBenefits = filteredBenefits.filter(
    (b: any) => b.type !== 'RECURRING_CREDIT' && b.type !== 'MULTIPLIER'
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/cards"
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cards
        </Link>

        <h1 className="text-3xl font-bold text-neutral-900">{card.productName}</h1>
        <p className="text-neutral-600 mt-2">
          {card.network} • {card.issuer} • Annual Fee: ${card.annualFee.toFixed(0)}
        </p>
      </div>

      {/* Search Benefits */}
      {card.benefits.length > 5 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search benefits..."
            className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      )}

      {/* Welcome Bonuses */}
      {card.welcomeBonus && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">Welcome Bonus</h2>
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-neutral-900">
                  {card.welcomeBonus.expectedPoints.toLocaleString()} {card.welcomeBonus.program}{' '}
                  Points
                </h3>
                <p className="text-sm text-neutral-600">
                  Spend ${card.welcomeBonus.requiredSpend.toLocaleString()} by{' '}
                  {format(new Date(card.welcomeBonus.spendWindowEnd), 'MMM d, yyyy')}
                </p>
              </div>
              {card.welcomeBonus.earned ? (
                <span className="badge-success">Earned</span>
              ) : (
                <span className="badge-warning">In Progress</span>
              )}
            </div>

            {!card.welcomeBonus.earned && (
              <>
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-600">Progress</span>
                    <span className="font-medium text-neutral-900">
                      ${card.welcomeBonus.currentSpend.toLocaleString()} / $
                      {card.welcomeBonus.requiredSpend.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          (card.welcomeBonus.currentSpend / card.welcomeBonus.requiredSpend) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">
                    {Math.max(
                      0,
                      Math.ceil(
                        (new Date(card.welcomeBonus.spendWindowEnd).getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}{' '}
                    days remaining • $
                    {(
                      card.welcomeBonus.requiredSpend - card.welcomeBonus.currentSpend
                    ).toLocaleString()}{' '}
                    left to spend
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Recurring Credits */}
      {recurringCredits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">Recurring Credits</h2>
          <div className="grid grid-cols-1 gap-4">
            {recurringCredits.map((benefit: any) => {
              const cycleDates = getCycleDates(benefit.cycleType)
              return (
                <BenefitCard
                  key={benefit.id}
                  benefit={benefit}
                  cardId={card.id}
                  cycleStart={cycleDates.start}
                  cycleEnd={cycleDates.end}
                  onUsageUpdate={handleUsageUpdate}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Multipliers */}
      {multipliers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">Earning Multipliers</h2>
          <div className="grid grid-cols-1 gap-4">
            {multipliers.map((benefit: any) => {
              const cycleDates = getCycleDates(benefit.cycleType)
              return (
                <BenefitCard
                  key={benefit.id}
                  benefit={benefit}
                  cardId={card.id}
                  cycleStart={cycleDates.start}
                  cycleEnd={cycleDates.end}
                  onUsageUpdate={handleUsageUpdate}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Other Benefits */}
      {otherBenefits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">Other Benefits</h2>
          <div className="grid grid-cols-1 gap-4">
            {otherBenefits.map((benefit: any) => {
              const cycleDates = getCycleDates(benefit.cycleType)
              return (
                <BenefitCard
                  key={benefit.id}
                  benefit={benefit}
                  cardId={card.id}
                  cycleStart={cycleDates.start}
                  cycleEnd={cycleDates.end}
                  onUsageUpdate={handleUsageUpdate}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
