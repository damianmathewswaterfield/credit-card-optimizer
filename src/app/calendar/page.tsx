'use client'

import { useState, useEffect } from 'react'
import { CARDS } from '@/data/cards'
import { enrichCardWithUserData, type EnrichedCard } from '@/lib/storage'
import { CalendarGrid, CalendarEvent } from '@/components/calendar/CalendarGrid'
import { calculateNextExpiry } from '@/lib/benefits/expiry'
import { addMonths } from 'date-fns'

export default function CalendarPage() {
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

  // Build calendar events
  const today = new Date()
  const threeMonthsOut = addMonths(today, 3)
  const events: CalendarEvent[] = []

  for (const card of cards) {
    // Benefit expiry and reset events
    for (const benefit of card.benefits) {
      if (benefit.type === 'RECURRING_CREDIT' && benefit.nominalValue) {
        try {
          const expiryInfo = calculateNextExpiry(
            benefit.cycleType,
            benefit.cycleDefinition,
            today,
            card.renewalMonthDay
          )

          // Only show events within next 3 months
          if (expiryInfo.nextExpiryDate <= threeMonthsOut) {
            // Expiry event
            events.push({
              id: `expiry-${benefit.id}`,
              date: expiryInfo.nextExpiryDate,
              title: `${benefit.name} expires`,
              type: 'expiring',
              value: benefit.usageLimitPerCycle ? `$${benefit.usageLimitPerCycle.toFixed(0)}` : undefined,
              cardName: card.productName,
              cardId: card.id,
              benefitId: benefit.id,
            })

            // Reset event (day after expiry)
            const resetDate = new Date(expiryInfo.nextExpiryDate)
            resetDate.setDate(resetDate.getDate() + 1)
            if (resetDate <= threeMonthsOut) {
              events.push({
                id: `reset-${benefit.id}`,
                date: resetDate,
                title: `${benefit.name} resets`,
                type: 'reset',
                value: benefit.usageLimitPerCycle ? `$${benefit.usageLimitPerCycle.toFixed(0)}` : undefined,
                cardName: card.productName,
                cardId: card.id,
                benefitId: benefit.id,
              })
            }
          }
        } catch (e) {
          // Skip benefits with calculation errors
        }
      }
    }

    // Welcome bonus deadline
    if (card.welcomeBonus && !card.welcomeBonus.earned) {
      const deadlineDate = new Date(card.welcomeBonus.spendWindowEnd)
      if (deadlineDate <= threeMonthsOut) {
        events.push({
          id: `deadline-${card.welcomeBonus.id}`,
          date: deadlineDate,
          title: 'Welcome bonus deadline',
          type: 'deadline',
          value: `${card.welcomeBonus.expectedPoints.toLocaleString()} ${card.welcomeBonus.program}`,
          cardName: card.productName,
          cardId: card.id,
        })
      }
    }

    // Card anniversary (if we have renewal date)
    if (card.renewalMonthDay) {
      try {
        const [month, day] = card.renewalMonthDay.split('-').map(Number)
        const currentYear = today.getFullYear()
        let anniversaryDate = new Date(currentYear, month - 1, day)

        // If anniversary already passed this year, show next year's
        if (anniversaryDate < today) {
          anniversaryDate = new Date(currentYear + 1, month - 1, day)
        }

        if (anniversaryDate <= threeMonthsOut) {
          events.push({
            id: `anniversary-${card.id}`,
            date: anniversaryDate,
            title: 'Card anniversary',
            type: 'anniversary',
            value: `$${card.annualFee.toFixed(0)} fee`,
            cardName: card.productName,
            cardId: card.id,
          })
        }
      } catch (e) {
        // Skip if renewal date is invalid
      }
    }
  }

  // Sort events by date
  events.sort((a, b) => a.date.getTime() - b.date.getTime())

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Calendar</h1>
        <p className="text-neutral-600 mt-2">
          Visual timeline of all benefit resets and deadlines
        </p>
      </div>

      <CalendarGrid events={events} />
    </div>
  )
}
