import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Coins, CreditCard as CreditCardIcon, Shield, Gift } from 'lucide-react'
import { prisma } from '@/lib/db'
import { calculateNextExpiry } from '@/lib/benefits/expiry'
import { format, formatDistanceToNow } from 'date-fns'

export default async function CardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const card = await prisma.card.findUnique({
    where: { id: resolvedParams.id },
    include: {
      benefits: {
        orderBy: { priorityScore: 'desc' },
      },
      welcomeBonuses: true,
    },
  })

  if (!card) {
    notFound()
  }

  const today = new Date()

  // Group benefits by type
  const recurringCredits = card.benefits.filter((b) => b.type === 'RECURRING_CREDIT')
  const multipliers = card.benefits.filter((b) => b.type === 'MULTIPLIER')
  const otherBenefits = card.benefits.filter(
    (b) => b.type !== 'RECURRING_CREDIT' && b.type !== 'MULTIPLIER'
  )

  const getBenefitIcon = (type: string) => {
    switch (type) {
      case 'RECURRING_CREDIT':
        return <Gift className="w-4 h-4" />
      case 'MULTIPLIER':
        return <Coins className="w-4 h-4" />
      case 'INSURANCE':
      case 'LOUNGE':
        return <Shield className="w-4 h-4" />
      default:
        return <CreditCardIcon className="w-4 h-4" />
    }
  }

  const getBenefitTypeBadge = (type: string) => {
    const badges: Record<string, string> = {
      RECURRING_CREDIT: 'badge-success',
      MULTIPLIER: 'badge-neutral',
      LOUNGE: 'badge-neutral',
      INSURANCE: 'badge-neutral',
      OTHER: 'badge-neutral',
    }
    return badges[type] || 'badge-neutral'
  }

  const formatBenefitValue = (benefit: typeof card.benefits[0]) => {
    if (!benefit.nominalValue) return 'N/A'

    if (benefit.currency === 'USD') {
      return `$${benefit.nominalValue.toFixed(0)}`
    } else if (benefit.currency === 'POINTS' || benefit.currency === 'MILES') {
      return `${benefit.nominalValue.toFixed(0)} ${benefit.currency.toLowerCase()}`
    }

    return benefit.nominalValue.toString()
  }

  const getCycleLabel = (cycleType: string) => {
    const labels: Record<string, string> = {
      CALENDAR_YEAR: 'Calendar Year',
      CARDMEMBER_YEAR: 'Cardmember Year',
      MONTHLY: 'Monthly',
      SEMIANNUAL_CALENDAR: 'Semi-Annual',
      ONE_TIME: 'One Time',
      PER_TRIP: 'Per Trip',
    }
    return labels[cycleType] || cycleType
  }

  const renderBenefitCard = (benefit: typeof card.benefits[0]) => {
    let expiryInfo
    try {
      expiryInfo = calculateNextExpiry(
        benefit.cycleType,
        benefit.cycleDefinition,
        today,
        card.renewalMonthDay
      )
    } catch (e) {
      expiryInfo = null
    }

    return (
      <div key={benefit.id} className="card">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-neutral-100">{getBenefitIcon(benefit.type)}</div>
            <div className="flex-1">
              <h3 className="font-semibold text-neutral-900 mb-1">{benefit.name}</h3>
              <p className="text-sm text-neutral-600">{benefit.triggerDescription}</p>
            </div>
          </div>
          <span className={getBenefitTypeBadge(benefit.type)}>
            {benefit.type.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-neutral-200 text-sm">
          <div>
            <p className="text-neutral-600 mb-1">Value</p>
            <p className="font-medium text-neutral-900">{formatBenefitValue(benefit)}</p>
          </div>
          <div>
            <p className="text-neutral-600 mb-1">Cycle</p>
            <p className="font-medium text-neutral-900">{getCycleLabel(benefit.cycleType)}</p>
          </div>
          {expiryInfo && expiryInfo.daysUntilExpiry < 365 && (
            <div>
              <p className="text-neutral-600 mb-1">Expires</p>
              <p
                className={`font-medium ${
                  expiryInfo.daysUntilExpiry <= 30
                    ? 'text-danger-700'
                    : expiryInfo.daysUntilExpiry <= 60
                    ? 'text-warning-700'
                    : 'text-neutral-900'
                }`}
              >
                {formatDistanceToNow(expiryInfo.nextExpiryDate, { addSuffix: true })}
              </p>
            </div>
          )}
        </div>

        {benefit.exclusionsSummary && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <p className="text-xs text-neutral-600">
              <strong>Important:</strong> {benefit.exclusionsSummary}
            </p>
          </div>
        )}

        {benefit.officialUrl && (
          <div className="mt-3">
            <a
              href={benefit.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              View official terms <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    )
  }

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

      {/* Welcome Bonuses */}
      {card.welcomeBonuses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">Welcome Bonuses</h2>
          {card.welcomeBonuses.map((bonus) => {
            const progress = (bonus.currentSpend / bonus.requiredSpend) * 100
            const daysLeft = Math.max(
              0,
              Math.ceil(
                (new Date(bonus.spendWindowEnd).getTime() - today.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            )

            return (
              <div key={bonus.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-neutral-900">
                      {bonus.expectedPoints.toLocaleString()} {bonus.program} Points
                    </h3>
                    <p className="text-sm text-neutral-600">
                      Spend ${bonus.requiredSpend.toLocaleString()} by{' '}
                      {format(new Date(bonus.spendWindowEnd), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {bonus.earned ? (
                    <span className="badge-success">Earned</span>
                  ) : (
                    <span className="badge-warning">In Progress</span>
                  )}
                </div>

                {!bonus.earned && (
                  <>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-600">Progress</span>
                        <span className="font-medium text-neutral-900">
                          ${bonus.currentSpend.toLocaleString()} / $
                          {bonus.requiredSpend.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">
                        {daysLeft} days remaining • $
                        {(bonus.requiredSpend - bonus.currentSpend).toLocaleString()} left to spend
                      </span>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Recurring Credits */}
      {recurringCredits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">Recurring Credits</h2>
          <div className="grid grid-cols-1 gap-4">{recurringCredits.map(renderBenefitCard)}</div>
        </div>
      )}

      {/* Multipliers */}
      {multipliers.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">Earning Multipliers</h2>
          <div className="grid grid-cols-1 gap-4">{multipliers.map(renderBenefitCard)}</div>
        </div>
      )}

      {/* Other Benefits */}
      {otherBenefits.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-neutral-900">Other Benefits</h2>
          <div className="grid grid-cols-1 gap-4">{otherBenefits.map(renderBenefitCard)}</div>
        </div>
      )}
    </div>
  )
}
