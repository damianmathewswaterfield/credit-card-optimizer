import { prisma } from '@/lib/db'
import { calculateNextExpiry } from '@/lib/benefits/expiry'
import { CalendarGrid, CalendarEvent } from '@/components/calendar/CalendarGrid'
import { addMonths } from 'date-fns'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const cards = await prisma.card.findMany({
    where: { active: true },
    include: {
      benefits: {
        where: { active: true },
      },
      welcomeBonuses: {
        where: { earned: false },
      },
    },
  })

  const today = new Date()
  const threeMonthsOut = addMonths(today, 3)

  // Build calendar events
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
              value: benefit.nominalValue ? `$${benefit.nominalValue.toFixed(0)}` : undefined,
              cardName: card.productName,
              cardId: card.id,
            })

            // Reset event (next cycle start)
            if (expiryInfo.nextResetDate <= threeMonthsOut) {
              events.push({
                id: `reset-${benefit.id}`,
                date: expiryInfo.nextResetDate,
                title: `${benefit.name} resets`,
                type: 'reset',
                cardName: card.productName,
                cardId: card.id,
              })
            }
          }
        } catch (e) {
          // Skip benefits with calculation errors
        }
      }
    }

    // Welcome bonus deadlines
    for (const bonus of card.welcomeBonuses) {
      const deadlineDate = new Date(bonus.spendWindowEnd)
      if (deadlineDate <= threeMonthsOut && deadlineDate >= today) {
        events.push({
          id: `bonus-${bonus.id}`,
          date: deadlineDate,
          title: `${bonus.expectedPoints.toLocaleString()} ${bonus.program} deadline`,
          type: 'deadline',
          value: `$${(bonus.requiredSpend - bonus.currentSpend).toLocaleString()} left`,
          cardName: card.productName,
          cardId: card.id,
        })
      }
    }

    // Card anniversary events (if renewal date is set)
    if (card.renewalMonthDay) {
      const [month, day] = card.renewalMonthDay.split('-').map(Number)
      const currentYear = today.getFullYear()

      // Check this year and next year
      for (let yearOffset = 0; yearOffset <= 1; yearOffset++) {
        const anniversaryDate = new Date(currentYear + yearOffset, month - 1, day)
        if (anniversaryDate >= today && anniversaryDate <= threeMonthsOut) {
          events.push({
            id: `anniversary-${card.id}-${yearOffset}`,
            date: anniversaryDate,
            title: `${card.productName} anniversary`,
            type: 'anniversary',
            cardName: card.productName,
            cardId: card.id,
          })
        }
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
          Track all benefit resets, expiry dates, and important deadlines
        </p>
      </div>

      <CalendarGrid events={events} />

      {/* Upcoming Events List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-neutral-900">Next 30 Days</h2>
        <div className="space-y-2">
          {events
            .filter((e) => {
              const daysUntil = Math.ceil(
                (e.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              )
              return daysUntil >= 0 && daysUntil <= 30
            })
            .slice(0, 10)
            .map((event) => {
              const daysUntil = Math.ceil(
                (event.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
              )

              const typeColors = {
                expiring: 'border-danger-300 bg-danger-50',
                reset: 'border-primary-300 bg-primary-50',
                deadline: 'border-warning-300 bg-warning-50',
                anniversary: 'border-success-300 bg-success-50',
              }

              const typeLabels = {
                expiring: 'Expiring',
                reset: 'Resetting',
                deadline: 'Deadline',
                anniversary: 'Anniversary',
              }

              return (
                <div key={event.id} className={`card ${typeColors[event.type]}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="badge-neutral">{typeLabels[event.type]}</span>
                        <span className="text-sm text-neutral-600">{event.cardName}</span>
                      </div>
                      <h3 className="font-semibold text-neutral-900">{event.title}</h3>
                      {event.value && (
                        <p className="text-sm text-neutral-600 mt-1">{event.value}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-900">
                        {daysUntil === 0
                          ? 'Today'
                          : daysUntil === 1
                          ? 'Tomorrow'
                          : `In ${daysUntil} days`}
                      </p>
                      <p className="text-xs text-neutral-600">
                        {event.date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}

          {events.filter((e) => {
            const daysUntil = Math.ceil((e.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            return daysUntil >= 0 && daysUntil <= 30
          }).length === 0 && (
            <div className="card text-center py-8 text-neutral-600">
              No events in the next 30 days
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
