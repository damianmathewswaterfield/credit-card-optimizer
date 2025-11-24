'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
} from 'date-fns'

export interface CalendarEvent {
  id: string
  date: Date
  title: string
  type: 'expiring' | 'reset' | 'deadline' | 'anniversary'
  value?: string
  cardName: string
  cardId: string
}

interface CalendarGridProps {
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
}

export function CalendarGrid({ events, onEventClick }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(event.date, day))
  }

  const getEventColor = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'expiring':
        return 'bg-danger-500 hover:bg-danger-600'
      case 'reset':
        return 'bg-primary-500 hover:bg-primary-600'
      case 'deadline':
        return 'bg-warning-500 hover:bg-warning-600'
      case 'anniversary':
        return 'bg-success-500 hover:bg-success-600'
    }
  }

  const getEventIcon = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'expiring':
        return '⚠️'
      case 'reset':
        return '🔄'
      case 'deadline':
        return '⏰'
      case 'anniversary':
        return '🎉'
    }
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-neutral-900">
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 rounded-lg hover:bg-neutral-100 transition-colors text-sm font-medium text-neutral-700"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-danger-500"></div>
          <span className="text-neutral-600">Expiring Credits</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary-500"></div>
          <span className="text-neutral-600">Credit Resets</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-warning-500"></div>
          <span className="text-neutral-600">Bonus Deadlines</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success-500"></div>
          <span className="text-neutral-600">Anniversary Events</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card p-0 overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-neutral-50 border-b border-neutral-200">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-sm font-semibold text-neutral-700"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {days.map((day, dayIdx) => {
            const dayEvents = getEventsForDay(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isCurrentDay = isToday(day)

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[120px] border-r border-b border-neutral-200 p-2 ${
                  !isCurrentMonth ? 'bg-neutral-50' : 'bg-white'
                } ${dayIdx % 7 === 6 ? 'border-r-0' : ''}`}
              >
                <div
                  className={`text-sm font-medium mb-2 ${
                    isCurrentDay
                      ? 'w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center'
                      : isCurrentMonth
                      ? 'text-neutral-900'
                      : 'text-neutral-400'
                  }`}
                >
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map((event) => (
                    <Link
                      key={event.id}
                      href={`/cards/${event.cardId}`}
                      className={`block w-full text-left px-2 py-1 rounded text-xs font-medium text-white truncate transition-colors ${getEventColor(
                        event.type
                      )}`}
                      title={`${event.title} - ${event.cardName}`}
                    >
                      <span className="mr-1">{getEventIcon(event.type)}</span>
                      {event.title}
                    </Link>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-neutral-600 px-2">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
