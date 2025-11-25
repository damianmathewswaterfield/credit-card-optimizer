'use client'

import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { CARDS } from '@/data/cards'
import { enrichCardWithUserData, type EnrichedCard } from '@/lib/storage'
import { useState, useEffect } from 'react'

export default function CardsPage() {
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

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">My Cards</h1>
        <p className="text-neutral-600 mt-2">
          View and manage your {cards.length} active credit cards
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {cards.map((card) => {
          return (
            <Link key={card.id} href={`/cards/${card.id}`} className="card-hover group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary-50 group-hover:bg-primary-100 transition-colors">
                    <CreditCard className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-neutral-900">
                      {card.productName}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {card.network} • {card.issuer}
                    </p>
                  </div>
                </div>
                <span className="badge-success">Active</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-600 mb-1">Annual Fee</p>
                    <p className="font-semibold text-neutral-900">
                      ${card.annualFee.toFixed(0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-600 mb-1">Benefits Tracked</p>
                    <p className="font-semibold text-neutral-900">{card.benefits.length}</p>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {cards.length === 0 && (
        <div className="card text-center py-12">
          <CreditCard className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No cards yet</h3>
          <p className="text-neutral-600">No cards configured.</p>
        </div>
      )}
    </div>
  )
}
