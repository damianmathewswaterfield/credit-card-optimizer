'use client'

import { useState } from 'react'
import { Plus, TrendingUp, Calendar, DollarSign, Hash, CheckCircle, AlertCircle } from 'lucide-react'
import type { Benefit } from '@/data/cards'
import { LogUsageModal } from './LogUsageModal'
import { getBenefitUsage, getAllBenefitUsage } from '@/lib/storage'

interface BenefitCardProps {
  benefit: Benefit
  cardId: string
  cycleStart: string
  cycleEnd: string
  onUsageUpdate?: () => void
}

export function BenefitCard({ benefit, cardId, cycleStart, cycleEnd, onUsageUpdate }: BenefitCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  // Get usage data
  const usageData = benefit.trackingType !== 'NONE'
    ? getBenefitUsage(benefit.id, cycleStart, cycleEnd)
    : null

  const allUsage = benefit.trackingType === 'BOOLEAN'
    ? getAllBenefitUsage().find((u) => u.benefitId === benefit.id)
    : null

  // Calculate progress
  const getProgress = () => {
    if (!usageData || !benefit.usageLimitPerCycle) return 0
    return Math.min(100, (usageData.totalUsed / benefit.usageLimitPerCycle) * 100)
  }

  const getRemainingValue = () => {
    if (!benefit.usageLimitPerCycle) return null
    const used = usageData?.totalUsed || 0
    const remaining = benefit.usageLimitPerCycle - used
    return Math.max(0, remaining)
  }

  const getStatusColor = () => {
    if (benefit.trackingType === 'NONE') return 'neutral'

    if (benefit.trackingType === 'BOOLEAN') {
      return allUsage?.activated ? 'success' : 'warning'
    }

    const progress = getProgress()
    if (progress >= 100) return 'success'
    if (progress >= 75) return 'warning'
    return 'primary'
  }

  const statusColor = getStatusColor()
  const statusColors = {
    success: 'bg-success-50 border-success-200 text-success-700',
    warning: 'bg-warning-50 border-warning-200 text-warning-700',
    primary: 'bg-primary-50 border-primary-200 text-primary-700',
    neutral: 'bg-neutral-50 border-neutral-200 text-neutral-700',
  }

  const iconMap: Record<string, React.ReactNode> = {
    '✈️': '✈️',
    '🍔': '🍔',
    '🍽️': '🍽️',
    '🎫': '🎫',
    '🏨': '🏨',
    '🚗': '🚗',
    '🍎': '🍎',
    '💳': '💳',
    '💰': '💰',
    '🛡️': '🛡️',
    '✨': '✨',
    '⭐': '⭐',
    '💎': '💎',
    '🛫': '🛫',
    '⏰': '⏰',
    '🧳': '🧳',
    '📦': '📦',
    '🔒': '🔒',
    '📊': '📊',
    '🛒': '🛒',
    '🍴': '🍴',
    '☕': '☕',
    '🍕': '🍕',
  }

  return (
    <>
      <div className={`card border ${statusColors[statusColor]}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            {benefit.icon && (
              <span className="text-2xl flex-shrink-0">{iconMap[benefit.icon] || benefit.icon}</span>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-neutral-900 mb-1">{benefit.name}</h3>
              <p className="text-sm text-neutral-600 line-clamp-2">{benefit.triggerDescription}</p>
            </div>
          </div>
        </div>

        {/* Tracking Type Badge */}
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-neutral-100 text-neutral-700">
            {benefit.type.replace(/_/g, ' ')}
          </span>
          {benefit.category && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-neutral-100 text-neutral-700">
              {benefit.category}
            </span>
          )}
        </div>

        {/* Progress Bar for SPENDING/COUNTER */}
        {(benefit.trackingType === 'SPENDING' || benefit.trackingType === 'COUNTER') && benefit.usageLimitPerCycle && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-600">
                {benefit.trackingType === 'SPENDING' ? 'Spent' : 'Used'}:
              </span>
              <span className="font-medium text-neutral-900">
                {benefit.trackingType === 'SPENDING' ? '$' : ''}
                {usageData?.totalUsed.toFixed(benefit.trackingType === 'SPENDING' ? 2 : 0) || '0'}
                {' / '}
                {benefit.trackingType === 'SPENDING' ? '$' : ''}
                {benefit.usageLimitPerCycle.toFixed(benefit.trackingType === 'SPENDING' ? 2 : 0)}
              </span>
            </div>
            <div className="w-full bg-neutral-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  statusColor === 'success'
                    ? 'bg-success-500'
                    : statusColor === 'warning'
                    ? 'bg-warning-500'
                    : 'bg-primary-500'
                }`}
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            {getRemainingValue() !== null && (
              <p className="text-xs text-neutral-600 mt-1">
                {benefit.trackingType === 'SPENDING' ? '$' : ''}
                {getRemainingValue()?.toFixed(benefit.trackingType === 'SPENDING' ? 2 : 0)} remaining
              </p>
            )}
          </div>
        )}

        {/* Activation Status for BOOLEAN */}
        {benefit.trackingType === 'BOOLEAN' && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm">
              {allUsage?.activated ? (
                <>
                  <CheckCircle className="w-4 h-4 text-success-600" />
                  <span className="text-success-700 font-medium">Activated</span>
                  {allUsage.activationDate && (
                    <span className="text-neutral-600">
                      on {new Date(allUsage.activationDate).toLocaleDateString()}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-warning-600" />
                  <span className="text-warning-700 font-medium">Not Activated</span>
                </>
              )}
            </div>
            {benefit.requiresEnrollment && !allUsage?.activated && (
              <p className="text-xs text-neutral-600 mt-2">
                Requires enrollment to activate benefit
              </p>
            )}
          </div>
        )}

        {/* Value Information */}
        {benefit.nominalValue && (
          <div className="flex items-center gap-2 mb-4 text-sm">
            <DollarSign className="w-4 h-4 text-neutral-500" />
            <span className="text-neutral-600">Value:</span>
            <span className="font-semibold text-neutral-900">
              ${benefit.nominalValue.toLocaleString()} {benefit.currency}
            </span>
          </div>
        )}

        {/* Cycle Information */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Calendar className="w-4 h-4 text-neutral-500" />
          <span className="text-neutral-600">Cycle:</span>
          <span className="font-medium text-neutral-900">
            {benefit.cycleType.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Usage History */}
        {usageData && usageData.usages.length > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              {showHistory ? 'Hide' : 'Show'} Usage History ({usageData.usages.length})
            </button>
            {showHistory && (
              <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                {usageData.usages.map((usage) => (
                  <div
                    key={usage.id}
                    className="p-2 bg-neutral-50 rounded border border-neutral-200 text-sm"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-neutral-900">
                        {benefit.trackingType === 'SPENDING' ? `$${usage.amount.toFixed(2)}` : ''}
                        {benefit.trackingType === 'COUNTER' ? `${usage.count}x` : ''}
                      </span>
                      <span className="text-xs text-neutral-600">
                        {new Date(usage.date).toLocaleDateString()}
                      </span>
                    </div>
                    {usage.merchant && (
                      <p className="text-xs text-neutral-600">{usage.merchant}</p>
                    )}
                    {usage.notes && (
                      <p className="text-xs text-neutral-600 mt-1">{usage.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Button */}
        {benefit.trackingType !== 'NONE' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Log Usage
          </button>
        )}

        {benefit.trackingType === 'NONE' && (
          <div className="text-center py-2 text-sm text-neutral-500">
            No tracking required
          </div>
        )}
      </div>

      <LogUsageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        benefit={benefit}
        cardId={cardId}
        cycleStart={cycleStart}
        cycleEnd={cycleEnd}
        onSuccess={() => {
          onUsageUpdate?.()
          setIsModalOpen(false)
        }}
      />
    </>
  )
}
