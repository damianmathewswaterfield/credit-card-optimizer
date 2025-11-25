'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, CreditCard, Award, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { CARDS } from '@/data/cards'
import { enrichCardWithUserData } from '@/lib/storage'
import {
  calculateAllCardsValue,
  getCurrentYearCycleDates,
  type CardValue,
} from '@/lib/valueCalculations'

export default function ValuePage() {
  const [cardValues, setCardValues] = useState<CardValue[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'value' | 'roi' | 'name'>('value')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const loadValues = () => {
    const enrichedCards = CARDS.map(enrichCardWithUserData)
    const cycleDates = getCurrentYearCycleDates()
    const values = calculateAllCardsValue(enrichedCards, cycleDates.start, cycleDates.end)
    setCardValues(values)
    setLoading(false)
    setIsRefreshing(false)
  }

  useEffect(() => {
    loadValues()

    // Reload data when window gains focus
    const handleFocus = () => {
      loadValues()
    }
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadValues()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-neutral-600">Loading value analytics...</p>
      </div>
    )
  }

  const totalValueExtracted = cardValues.reduce((sum, cv) => sum + cv.totalValueExtracted, 0)
  const totalAnnualFees = cardValues.reduce((sum, cv) => sum + cv.annualFee, 0)
  const totalNetValue = totalValueExtracted - totalAnnualFees
  const portfolioROI = totalAnnualFees > 0 ? ((totalNetValue / totalAnnualFees) * 100) : 0

  // Sort cards
  const sortedCards = [...cardValues].sort((a, b) => {
    switch (sortBy) {
      case 'value':
        return b.totalValueExtracted - a.totalValueExtracted
      case 'roi':
        return b.roi - a.roi
      case 'name':
        return a.cardName.localeCompare(b.cardName)
      default:
        return 0
    }
  })

  const getROIColor = (roi: number) => {
    if (roi >= 100) return 'text-success-700'
    if (roi >= 50) return 'text-warning-700'
    return 'text-danger-700'
  }

  const getROIBgColor = (roi: number) => {
    if (roi >= 100) return 'bg-success-50 border-success-200'
    if (roi >= 50) return 'bg-warning-50 border-warning-200'
    return 'bg-danger-50 border-danger-200'
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Value Analytics</h1>
          <p className="text-neutral-600 mt-2">
            Track the total value you're extracting from your credit cards
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="card text-center">
          <TrendingUp className="w-4 h-4 text-primary-600 mx-auto mb-1" />
          <p className="text-xs text-neutral-600">Value</p>
          <p className="text-base font-bold text-neutral-900">
            ${totalValueExtracted.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="card text-center">
          <CreditCard className="w-4 h-4 text-neutral-600 mx-auto mb-1" />
          <p className="text-xs text-neutral-600">Fees</p>
          <p className="text-base font-bold text-neutral-900">
            ${totalAnnualFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="card text-center">
          <DollarSign className={`w-4 h-4 ${totalNetValue >= 0 ? 'text-success-600' : 'text-danger-600'} mx-auto mb-1`} />
          <p className="text-xs text-neutral-600">Net</p>
          <p className={`text-base font-bold ${totalNetValue >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
            ${totalNetValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>

        <div className="card text-center">
          <Award className={`w-4 h-4 ${portfolioROI >= 100 ? 'text-success-600' : portfolioROI >= 50 ? 'text-warning-600' : 'text-danger-600'} mx-auto mb-1`} />
          <p className="text-xs text-neutral-600">ROI</p>
          <p className={`text-base font-bold ${getROIColor(portfolioROI)}`}>
            {portfolioROI.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-600">Sort by:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('value')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              sortBy === 'value'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Value Extracted
          </button>
          <button
            onClick={() => setSortBy('roi')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              sortBy === 'roi'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            ROI
          </button>
          <button
            onClick={() => setSortBy('name')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              sortBy === 'name'
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            Card Name
          </button>
        </div>
      </div>

      {/* Card Value Breakdown */}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Card Breakdown</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {sortedCards.map((cardValue) => (
          <div key={cardValue.cardId} className={`card border ${getROIBgColor(cardValue.roi)} text-center`}>
            <h3 className="text-sm font-semibold text-neutral-900 mb-1 line-clamp-1">
              {cardValue.cardName}
            </h3>
            <p className="text-xs text-neutral-600 mb-2">
              Fee: ${cardValue.annualFee.toFixed(0)}
            </p>

            <p className="text-xl font-bold text-neutral-900 mb-1">
              ${cardValue.totalValueExtracted.toFixed(0)}
            </p>
            <p className={`text-xs font-medium mb-2 ${getROIColor(cardValue.roi)}`}>
              {cardValue.roi.toFixed(0)}% ROI
            </p>

            <div className="pt-2 border-t border-neutral-200">
              <p className="text-xs text-neutral-600">Net Value</p>
              <p className={`text-sm font-bold ${cardValue.netValue >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                ${cardValue.netValue.toFixed(0)}
              </p>
            </div>
          </div>
        ))}
        </div>
      </div>

      {/* Empty State */}
      {totalValueExtracted === 0 && (
        <div className="card text-center py-12">
          <TrendingUp className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No value tracked yet</h3>
          <p className="text-neutral-600 mb-4">
            Start logging your benefit usage to see the value you're extracting from your cards.
          </p>
          <a
            href="/cards"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            View Cards
          </a>
        </div>
      )}
    </div>
  )
}
