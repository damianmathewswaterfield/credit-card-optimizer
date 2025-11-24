'use client'

import { useState, useEffect } from 'react'
import { notFound, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, DollarSign, CheckCircle, AlertCircle } from 'lucide-react'
import { CARDS } from '@/data/cards'
import { enrichCardWithUserData, getBenefitUsage, getAllBenefitUsage, addBenefitUsage, setBenefitActivation } from '@/lib/storage'
import { getBenefitIcon } from '@/lib/benefitIcons'
import { Toast } from '@/components/ui/Toast'
import type { Benefit } from '@/data/cards'

export default function BenefitPage({ params }: { params: Promise<{ id: string }> }) {
  const [resolvedId, setResolvedId] = useState<string | null>(null)
  const [benefit, setBenefit] = useState<Benefit | null>(null)
  const [card, setCard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [quickLogAmount, setQuickLogAmount] = useState('')
  const [isLogging, setIsLogging] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)
  const [usageData, setUsageData] = useState<any>(null)
  const [allUsageData, setAllUsageData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    params.then((p) => {
      setResolvedId(p.id)

      // Find benefit and card
      for (const rawCard of CARDS) {
        const enrichedCard = enrichCardWithUserData(rawCard)
        const foundBenefit = enrichedCard.benefits.find((b: any) => b.id === p.id)
        if (foundBenefit) {
          setBenefit(foundBenefit)
          setCard(enrichedCard)

          // Try to load last logged amount from localStorage, fallback to cycle limit
          const lastAmountKey = `lastLoggedAmount_${p.id}`
          const lastAmount = localStorage.getItem(lastAmountKey)

          if (lastAmount) {
            setQuickLogAmount(lastAmount)
          } else if (foundBenefit.usageLimitPerCycle) {
            setQuickLogAmount(foundBenefit.usageLimitPerCycle.toString())
          }
          break
        }
      }
      setLoading(false)
    })
  }, [params])

  // Load usage data
  const loadUsageData = () => {
    if (!benefit || !card) return

    const cycleDates = getCycleDates()
    if (benefit.trackingType !== 'NONE') {
      setUsageData(getBenefitUsage(benefit.id, cycleDates.start, cycleDates.end))
    }
    if (benefit.trackingType === 'BOOLEAN') {
      setAllUsageData(getAllBenefitUsage().find((u) => u.benefitId === benefit.id))
    }
  }

  useEffect(() => {
    loadUsageData()
  }, [benefit, card])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-600">Loading...</p>
      </div>
    )
  }

  if (!benefit || !card) {
    notFound()
  }

  // Calculate cycle dates
  const getCycleDates = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    switch (benefit.cycleType) {
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

  const cycleDates = getCycleDates()

  const getProgress = () => {
    if (!usageData || !benefit.usageLimitPerCycle) return 0
    return Math.min(100, (usageData.totalUsed / benefit.usageLimitPerCycle) * 100)
  }

  const BenefitIcon = getBenefitIcon(benefit)

  const handleQuickLog = async () => {
    if (isLogging) return
    setIsLogging(true)

    try {
      const amount = parseFloat(quickLogAmount)
      if (isNaN(amount) || amount <= 0) {
        setToast({ message: 'Please enter a valid amount', type: 'error' })
        setIsLogging(false)
        return
      }

      addBenefitUsage(benefit.id, card.id, cycleDates.start, cycleDates.end, {
        date: new Date().toISOString().split('T')[0],
        amount,
      })

      // Remember this amount for next time
      localStorage.setItem(`lastLoggedAmount_${benefit.id}`, amount.toString())

      setToast({ message: `Successfully logged $${amount.toFixed(2)}!`, type: 'success' })
      loadUsageData()
    } catch (error) {
      setToast({ message: 'Failed to log usage. Please try again.', type: 'error' })
    } finally {
      setIsLogging(false)
    }
  }

  const handleToggleActivation = async () => {
    const newStatus = !allUsageData?.activated
    setBenefitActivation(benefit.id, card.id, newStatus, new Date().toISOString())
    setToast({ message: `Benefit ${newStatus ? 'activated' : 'deactivated'}!`, type: 'success' })
    loadUsageData()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Back Button */}
      <Link
        href={`/cards/${card.id}`}
        className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {card.productName}
      </Link>

      {/* Benefit Header */}
      <div className="card">
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-xl bg-primary-100">
            <BenefitIcon className="w-8 h-8 text-primary-700" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">{benefit.name}</h1>
            <p className="text-neutral-600">{benefit.triggerDescription}</p>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-4 text-sm text-neutral-600">
          <span className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {benefit.cycleType.replace(/_/g, ' ')}
          </span>
          {benefit.usageLimitPerCycle && (
            <span className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              ${benefit.usageLimitPerCycle.toFixed(0)} limit
            </span>
          )}
        </div>
      </div>

      {/* Current Status */}
      {benefit.trackingType === 'SPENDING' && benefit.usageLimitPerCycle && (
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Current Progress</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-neutral-600">Used this cycle</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-neutral-900">
                  ${usageData?.totalUsed.toFixed(2) || '0.00'}
                </span>
                <span className="text-lg font-medium text-neutral-600 ml-2">
                  ({getProgress().toFixed(0)}%)
                </span>
              </div>
            </div>
            <div className="relative w-full bg-neutral-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all flex items-center justify-center text-xs font-medium text-white ${
                  getProgress() >= 100 ? 'bg-success-600' : 'bg-primary-600'
                }`}
                style={{ width: `${Math.min(100, getProgress())}%` }}
              >
                {getProgress() >= 15 && `${getProgress().toFixed(0)}%`}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">${(usageData?.totalUsed || 0).toFixed(2)} used</span>
              <span className={`font-medium ${
                benefit.usageLimitPerCycle - (usageData?.totalUsed || 0) <= 0
                  ? 'text-success-600'
                  : 'text-neutral-900'
              }`}>
                ${Math.max(0, benefit.usageLimitPerCycle - (usageData?.totalUsed || 0)).toFixed(2)} remaining
              </span>
            </div>
          </div>
        </div>
      )}

      {benefit.trackingType === 'BOOLEAN' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Activation Status</h2>
          <button
            onClick={handleToggleActivation}
            className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
              allUsageData?.activated
                ? 'border-success-500 bg-success-50'
                : 'border-neutral-300 bg-white hover:border-primary-500'
            }`}
          >
            <span className={`font-semibold ${allUsageData?.activated ? 'text-success-900' : 'text-neutral-700'}`}>
              {allUsageData?.activated ? 'Activated' : 'Not Activated'}
            </span>
            {allUsageData?.activated ? (
              <CheckCircle className="w-6 h-6 text-success-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-neutral-400" />
            )}
          </button>
          {allUsageData?.activationDate && (
            <p className="text-sm text-neutral-600 mt-2">
              Activated on {new Date(allUsageData.activationDate).toLocaleDateString()}
            </p>
          )}
        </div>
      )}

      {/* Quick Log */}
      {benefit.trackingType === 'SPENDING' && (
        <div className="card bg-primary-50 border-primary-200">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Quick Log</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={quickLogAmount}
                onChange={(e) => setQuickLogAmount(e.target.value)}
                className="w-full px-4 py-3 text-lg border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>
            <button
              onClick={handleQuickLog}
              disabled={isLogging}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 text-lg bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-5 h-5" />
              {isLogging ? 'Logging...' : 'Log Usage'}
            </button>
          </div>
        </div>
      )}

      {/* Usage History */}
      {usageData && usageData.usages.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Usage History ({usageData.usages.length})
          </h2>
          <div className="space-y-2">
            {usageData.usages
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((usage) => (
                <div
                  key={usage.id}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                >
                  <div>
                    <p className="font-medium text-neutral-900">${usage.amount.toFixed(2)}</p>
                    {usage.merchant && (
                      <p className="text-sm text-neutral-600">{usage.merchant}</p>
                    )}
                  </div>
                  <span className="text-sm text-neutral-600">
                    {new Date(usage.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
