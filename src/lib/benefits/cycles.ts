import {
  addMonths,
  addYears,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
  isWithinInterval,
  parseISO,
} from 'date-fns'
import type { CycleWindow, BenefitCycleDefinition } from '@/types'

export type CycleType =
  | 'MONTHLY'
  | 'CALENDAR_YEAR'
  | 'CARDMEMBER_YEAR'
  | 'SEMIANNUAL_CALENDAR'
  | 'ONE_TIME'
  | 'PER_TRIP'

/**
 * Parse cycle definition JSON string to typed object
 */
export function parseCycleDefinition(cycleDefJson: string): BenefitCycleDefinition {
  return JSON.parse(cycleDefJson) as BenefitCycleDefinition
}

/**
 * Get the current cycle window for a semiannual calendar benefit
 */
export function getCurrentSemiannualWindow(
  today: Date,
  windows: CycleWindow[]
): CycleWindow | null {
  const currentYear = today.getFullYear()

  for (const window of windows) {
    const windowStart = new Date(currentYear, window.startMonth - 1, window.startDay)
    const windowEnd = new Date(currentYear, window.endMonth - 1, window.endDay, 23, 59, 59)

    if (isWithinInterval(today, { start: windowStart, end: windowEnd })) {
      return window
    }
  }

  return null
}

/**
 * Get the next cycle window for a semiannual calendar benefit
 */
export function getNextSemiannualWindow(
  today: Date,
  windows: CycleWindow[]
): { window: CycleWindow; year: number } | null {
  const currentYear = today.getFullYear()

  // Check remaining windows this year
  for (const window of windows) {
    const windowStart = new Date(currentYear, window.startMonth - 1, window.startDay)

    if (isAfter(windowStart, today)) {
      return { window, year: currentYear }
    }
  }

  // If no windows left this year, return first window of next year
  if (windows.length > 0) {
    return { window: windows[0], year: currentYear + 1 }
  }

  return null
}

/**
 * Calculate the end date of the current cycle for a benefit
 */
export function getCurrentCycleEnd(
  cycleType: CycleType,
  cycleDefinition: BenefitCycleDefinition,
  today: Date,
  cardRenewalMonthDay?: string | null
): Date {
  switch (cycleType) {
    case 'MONTHLY': {
      return endOfMonth(today)
    }

    case 'CALENDAR_YEAR': {
      return new Date(today.getFullYear(), 11, 31, 23, 59, 59) // Dec 31
    }

    case 'CARDMEMBER_YEAR': {
      if (!cardRenewalMonthDay) {
        throw new Error('Card renewal month/day required for CARDMEMBER_YEAR cycle')
      }

      const [month, day] = cardRenewalMonthDay.split('-').map(Number)
      const currentYear = today.getFullYear()
      const thisYearRenewal = new Date(currentYear, month - 1, day, 23, 59, 59)

      // If renewal date hasn't passed this year, that's the cycle end
      if (isAfter(thisYearRenewal, today) || thisYearRenewal.getTime() === today.getTime()) {
        return thisYearRenewal
      }

      // Otherwise, next year's renewal
      return new Date(currentYear + 1, month - 1, day, 23, 59, 59)
    }

    case 'SEMIANNUAL_CALENDAR': {
      if (!cycleDefinition.windows || cycleDefinition.windows.length === 0) {
        throw new Error('Windows required for SEMIANNUAL_CALENDAR cycle')
      }

      const currentWindow = getCurrentSemiannualWindow(today, cycleDefinition.windows)

      if (currentWindow) {
        const currentYear = today.getFullYear()
        return new Date(
          currentYear,
          currentWindow.endMonth - 1,
          currentWindow.endDay,
          23,
          59,
          59
        )
      }

      // If not in any window, find the next window start and return its end
      const nextWindow = getNextSemiannualWindow(today, cycleDefinition.windows)
      if (nextWindow) {
        return new Date(
          nextWindow.year,
          nextWindow.window.endMonth - 1,
          nextWindow.window.endDay,
          23,
          59,
          59
        )
      }

      throw new Error('Could not determine cycle end for semiannual benefit')
    }

    case 'ONE_TIME': {
      // For one-time benefits, there's no cycle end in the traditional sense
      // Return a far future date or handle specially
      return new Date(2099, 11, 31)
    }

    case 'PER_TRIP': {
      // Per-trip benefits don't have a fixed cycle
      return new Date(2099, 11, 31)
    }

    default: {
      throw new Error(`Unsupported cycle type: ${cycleType}`)
    }
  }
}

/**
 * Calculate the next reset date (start of next cycle)
 */
export function getNextResetDate(
  cycleType: CycleType,
  cycleDefinition: BenefitCycleDefinition,
  today: Date,
  cardRenewalMonthDay?: string | null
): Date {
  const currentCycleEnd = getCurrentCycleEnd(
    cycleType,
    cycleDefinition,
    today,
    cardRenewalMonthDay
  )

  switch (cycleType) {
    case 'MONTHLY': {
      // First day of next month
      return startOfMonth(addMonths(currentCycleEnd, 1))
    }

    case 'CALENDAR_YEAR': {
      // Jan 1 of next year
      return new Date(today.getFullYear() + 1, 0, 1, 0, 0, 0)
    }

    case 'CARDMEMBER_YEAR': {
      // Next day after cycle end (anniversary + 1 day)
      const nextDay = new Date(currentCycleEnd)
      nextDay.setDate(nextDay.getDate() + 1)
      nextDay.setHours(0, 0, 0, 0)
      return nextDay
    }

    case 'SEMIANNUAL_CALENDAR': {
      if (!cycleDefinition.windows || cycleDefinition.windows.length === 0) {
        throw new Error('Windows required for SEMIANNUAL_CALENDAR cycle')
      }

      const nextWindow = getNextSemiannualWindow(today, cycleDefinition.windows)
      if (nextWindow) {
        return new Date(
          nextWindow.year,
          nextWindow.window.startMonth - 1,
          nextWindow.window.startDay,
          0,
          0,
          0
        )
      }

      throw new Error('Could not determine next reset for semiannual benefit')
    }

    case 'ONE_TIME':
    case 'PER_TRIP': {
      // No reset for one-time or per-trip benefits
      return new Date(2099, 11, 31)
    }

    default: {
      throw new Error(`Unsupported cycle type: ${cycleType}`)
    }
  }
}
