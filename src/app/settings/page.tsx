'use client'

import { useState, useEffect } from 'react'
import { UserPreferencesForm } from '@/components/settings/UserPreferencesForm'
import { CardManagement } from '@/components/settings/CardManagement'
import { CARDS } from '@/data/cards'
import { enrichCardWithUserData } from '@/lib/storage'

export default function SettingsPage() {
  const [cards, setCards] = useState<any[]>([])
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
        <p className="text-neutral-600 mt-2">
          Configure your preferences and manage your credit cards
        </p>
      </div>

      {/* User Preferences */}
      <div className="card">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">User Preferences</h2>
        <UserPreferencesForm />
      </div>

      {/* Card Management */}
      <div className="card">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">Card Management</h2>
        <p className="text-sm text-neutral-600 mb-6">
          Update card open dates, renewal dates, and welcome bonus progress. This ensures accurate
          benefit cycle calculations.
        </p>
        <CardManagement cards={cards} />
      </div>

      {/* Help Text */}
      <div className="card bg-primary-50 border-primary-200">
        <h3 className="font-semibold text-primary-900 mb-2">Important Notes</h3>
        <ul className="text-sm text-primary-800 space-y-1 list-disc list-inside">
          <li>
            <strong>Open Date:</strong> The date you opened/activated the card (used for some
            benefit calculations)
          </li>
          <li>
            <strong>Renewal Date (MM-DD):</strong> Your cardmember year anniversary for annual fee
            and cardmember-year benefits
          </li>
          <li>
            <strong>Current Spend:</strong> Update this regularly to track welcome bonus progress
            accurately
          </li>
          <li>
            <strong>Points Value:</strong> Adjust based on your typical redemption strategy
            (transfers, portal, cash back)
          </li>
        </ul>
      </div>
    </div>
  )
}
