'use client'

import { useState } from 'react'
import { X, Upload, Check, PartyPopper, Sparkles } from 'lucide-react'
import type { Benefit, TrackingType } from '@/data/cards'
import { addBenefitUsage, setBenefitActivation, getBenefitUsage } from '@/lib/storage'

interface LogUsageModalProps {
  isOpen: boolean
  onClose: () => void
  benefit: Benefit
  cardId: string
  cycleStart: string
  cycleEnd: string
  onSuccess?: () => void
}

export function LogUsageModal({
  isOpen,
  onClose,
  benefit,
  cardId,
  cycleStart,
  cycleEnd,
  onSuccess,
}: LogUsageModalProps) {
  const [amount, setAmount] = useState('')
  const [count, setCount] = useState('1')
  const [merchant, setMerchant] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isActivated, setIsActivated] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [loggedValue, setLoggedValue] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      if (benefit.trackingType === 'BOOLEAN') {
        // Handle activation toggle
        setBenefitActivation(benefit.id, cardId, isActivated, date)
        setLoggedValue(isActivated ? 'Activated' : 'Deactivated')
      } else if (benefit.trackingType === 'SPENDING') {
        // Handle spending entry
        const amountNum = parseFloat(amount)
        if (isNaN(amountNum) || amountNum <= 0) {
          setMessage('Please enter a valid amount')
          setIsLoading(false)
          return
        }

        addBenefitUsage(benefit.id, cardId, cycleStart, cycleEnd, {
          date,
          amount: amountNum,
          merchant: merchant || undefined,
          notes: notes || undefined,
        })
        setLoggedValue(`$${amountNum.toFixed(2)}`)
      } else if (benefit.trackingType === 'COUNTER') {
        // Handle counter entry
        const countNum = parseInt(count)
        if (isNaN(countNum) || countNum <= 0) {
          setMessage('Please enter a valid count')
          setIsLoading(false)
          return
        }

        addBenefitUsage(benefit.id, cardId, cycleStart, cycleEnd, {
          date,
          amount: 0,
          count: countNum,
          merchant: merchant || undefined,
          notes: notes || undefined,
        })
        setLoggedValue(`${countNum}x`)
      }

      // Show success screen
      setShowSuccess(true)
      onSuccess?.()
    } catch (error) {
      setMessage('Failed to log usage. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onClose()
    // Reset form after a brief delay
    setTimeout(() => {
      setAmount('')
      setCount('1')
      setMerchant('')
      setNotes('')
      setDate(new Date().toISOString().split('T')[0])
      setIsActivated(false)
      setMessage('')
      setShowSuccess(false)
      setLoggedValue('')
    }, 300)
  }

  const renderFormFields = () => {
    switch (benefit.trackingType) {
      case 'BOOLEAN':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Activation Status
              </label>
              <button
                type="button"
                onClick={() => setIsActivated(!isActivated)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${
                  isActivated
                    ? 'border-success-500 bg-success-50'
                    : 'border-neutral-300 bg-white hover:border-neutral-400'
                }`}
              >
                <span className={isActivated ? 'text-success-900 font-medium' : 'text-neutral-700'}>
                  {isActivated ? 'Activated' : 'Not Activated'}
                </span>
                {isActivated && <Check className="w-5 h-5 text-success-600" />}
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Activation Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        )

      case 'SPENDING':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Amount Spent ($) <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Merchant (optional)
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g., Whole Foods"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional details..."
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>
          </div>
        )

      case 'COUNTER':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Count <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={count}
                onChange={(e) => setCount(e.target.value)}
                placeholder="1"
                required
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {benefit.eventLimit && (
                <p className="text-xs text-neutral-600 mt-1">
                  Limit: {benefit.eventLimit} per cycle
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description (optional)
              </label>
              <input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                placeholder="e.g., Flat tire on highway"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional details..."
                rows={3}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center py-8 text-neutral-600">
            This benefit does not require usage tracking.
          </div>
        )
    }
  }

  // Success screen
  if (showSuccess) {
    const usageData = benefit.trackingType !== 'NONE'
      ? getBenefitUsage(benefit.id, cycleStart, cycleEnd)
      : null

    const progress = usageData && benefit.usageLimitPerCycle
      ? Math.min(100, (usageData.totalUsed / benefit.usageLimitPerCycle) * 100)
      : 0

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-success-600" />
          </div>

          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            Nice! 🎉
          </h2>

          <p className="text-lg text-neutral-700 mb-4">
            You logged <span className="font-semibold text-primary-600">{loggedValue}</span> for{' '}
            <span className="font-semibold">{benefit.name}</span>
          </p>

          {progress > 0 && (
            <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-sm text-primary-900 mb-2">
                <span className="font-semibold">{progress.toFixed(0)}%</span> used this cycle
              </p>
              <div className="w-full bg-primary-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleClose}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-200">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">
              Log Usage
            </h2>
            <p className="text-sm text-neutral-600 line-clamp-2">{benefit.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {renderFormFields()}

          {message && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                message.includes('success')
                  ? 'bg-success-50 text-success-900 border border-success-200'
                  : 'bg-danger-50 text-danger-900 border border-danger-200'
              }`}
            >
              {message}
            </div>
          )}
        </form>

        {/* Footer */}
        {benefit.trackingType !== 'NONE' && (
          <div className="flex items-center gap-3 p-6 border-t border-neutral-200 bg-neutral-50">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg font-medium text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : 'Log Usage'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
