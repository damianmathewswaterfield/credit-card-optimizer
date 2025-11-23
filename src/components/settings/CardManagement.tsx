'use client'

import { useState } from 'react'
import { Card, WelcomeBonus } from '@prisma/client'
import { Edit2, Save, X } from 'lucide-react'

interface CardWithBonus extends Card {
  welcomeBonuses: WelcomeBonus[]
}

interface CardManagementProps {
  cards: CardWithBonus[]
}

export function CardManagement({ cards: initialCards }: CardManagementProps) {
  const [cards, setCards] = useState(initialCards)
  const [editingCard, setEditingCard] = useState<string | null>(null)
  const [editingBonus, setEditingBonus] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const handleUpdateCard = async (cardId: string, data: Partial<Card>) => {
    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const updated = await response.json()
        setCards((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, ...updated } : c))
        )
        setEditingCard(null)
        setMessage('Card updated successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('Failed to update card')
    }
  }

  const handleUpdateBonus = async (bonusId: string, data: Partial<WelcomeBonus>) => {
    try {
      const response = await fetch(`/api/welcome-bonus/${bonusId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const updated = await response.json()
        setCards((prev) =>
          prev.map((c) => ({
            ...c,
            welcomeBonuses: c.welcomeBonuses.map((wb) =>
              wb.id === bonusId ? { ...wb, ...updated } : wb
            ),
          }))
        )
        setEditingBonus(null)
        setMessage('Welcome bonus updated successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('Failed to update welcome bonus')
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.includes('success')
              ? 'bg-success-50 text-success-900 border border-success-200'
              : 'bg-danger-50 text-danger-900 border border-danger-200'
          }`}
        >
          {message}
        </div>
      )}

      {cards.map((card) => (
        <div key={card.id} className="card">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-900">{card.productName}</h3>
              <p className="text-sm text-neutral-600">
                {card.network} • {card.issuer}
              </p>
            </div>
            <button
              onClick={() => setEditingCard(editingCard === card.id ? null : card.id)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              {editingCard === card.id ? (
                <X className="w-4 h-4 text-neutral-600" />
              ) : (
                <Edit2 className="w-4 h-4 text-neutral-600" />
              )}
            </button>
          </div>

          {editingCard === card.id ? (
            <div className="space-y-4 pt-4 border-t border-neutral-200">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Card Open Date
                  </label>
                  <input
                    type="date"
                    defaultValue={card.openDate || ''}
                    onChange={(e) =>
                      handleUpdateCard(card.id, { openDate: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Renewal Date (MM-DD)
                  </label>
                  <input
                    type="text"
                    placeholder="01-15"
                    defaultValue={card.renewalMonthDay || ''}
                    onChange={(e) =>
                      handleUpdateCard(card.id, { renewalMonthDay: e.target.value || null })
                    }
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="text-xs text-neutral-600 mt-1">
                    For cardmember year benefits
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-neutral-600">Open Date: </span>
                <span className="font-medium text-neutral-900">
                  {card.openDate || 'Not set'}
                </span>
              </div>
              <div>
                <span className="text-neutral-600">Renewal: </span>
                <span className="font-medium text-neutral-900">
                  {card.renewalMonthDay || 'Not set'}
                </span>
              </div>
            </div>
          )}

          {/* Welcome Bonuses */}
          {card.welcomeBonuses.length > 0 && (
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">Welcome Bonuses</h4>
              {card.welcomeBonuses.map((bonus) => (
                <div key={bonus.id} className="p-4 bg-neutral-50 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-medium text-neutral-900">
                        {bonus.expectedPoints.toLocaleString()} {bonus.program} Points
                      </p>
                      <p className="text-sm text-neutral-600">
                        ${bonus.requiredSpend.toLocaleString()} spend required
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        setEditingBonus(editingBonus === bonus.id ? null : bonus.id)
                      }
                      className="p-1 rounded hover:bg-neutral-200 transition-colors"
                    >
                      {editingBonus === bonus.id ? (
                        <X className="w-4 h-4 text-neutral-600" />
                      ) : (
                        <Edit2 className="w-4 h-4 text-neutral-600" />
                      )}
                    </button>
                  </div>

                  {editingBonus === bonus.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">
                          Current Spend ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={bonus.currentSpend}
                          onBlur={(e) =>
                            handleUpdateBonus(bonus.id, {
                              currentSpend: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-1">
                            Start Date
                          </label>
                          <input
                            type="date"
                            defaultValue={bonus.spendWindowStart}
                            onChange={(e) =>
                              handleUpdateBonus(bonus.id, { spendWindowStart: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-neutral-700 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            defaultValue={bonus.spendWindowEnd}
                            onChange={(e) =>
                              handleUpdateBonus(bonus.id, { spendWindowEnd: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Current spend:</span>
                        <span className="font-medium text-neutral-900">
                          ${bonus.currentSpend.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Deadline:</span>
                        <span className="font-medium text-neutral-900">
                          {new Date(bonus.spendWindowEnd).toLocaleDateString()}
                        </span>
                      </div>
                      {!bonus.earned && (
                        <div className="w-full bg-neutral-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                (bonus.currentSpend / bonus.requiredSpend) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
