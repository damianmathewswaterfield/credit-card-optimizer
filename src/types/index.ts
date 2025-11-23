// Core type definitions

export interface CycleWindow {
  startMonth: number // 1-12
  startDay: number // 1-31
  endMonth: number
  endDay: number
}

export interface BenefitCycleDefinition {
  type: 'single' | 'multiple_windows'
  windows?: CycleWindow[] // For semiannual or custom cycles
}

export interface NextExpiryResult {
  nextResetDate: Date
  nextExpiryDate: Date
  daysUntilExpiry: number
  currentCycleEnd: Date
}

export interface ValueAtRisk {
  benefitId: string
  benefitName: string
  totalValue: number
  usedValue: number
  remainingValue: number
  expiryDate: Date
  daysUntilExpiry: number
}
