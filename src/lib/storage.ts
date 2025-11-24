// localStorage wrapper for user preferences and card data

export interface UserPreferences {
  timezone: string
  defaultReminderDays: number
  valuePerPointRules: {
    UR: number
    MR: number
    VENTURE: number
    TY: number
  }
}

export interface CardData {
  openDate: string | null
  renewalMonthDay: string | null
}

export interface WelcomeBonusData {
  currentSpend: number
  spendWindowStart: string
  spendWindowEnd: string
}

export interface Deal {
  id: string
  cardId: string
  merchant: string
  cashbackPercent: number
  category: string
  validFrom: string
  validTo: string
  link?: string
  notes?: string
  createdAt: string
}

export interface BenefitUsageEntry {
  id: string
  date: string
  amount: number              // For SPENDING tracking
  count?: number              // For COUNTER tracking
  merchant?: string
  notes?: string
  receiptUrl?: string         // Optional receipt upload
}

export interface BenefitUsage {
  benefitId: string
  cardId: string
  cycleStart: string
  cycleEnd: string
  usages: BenefitUsageEntry[]
  totalUsed: number           // Total amount or count
  // For BOOLEAN tracking (subscriptions, status)
  activated?: boolean
  activationDate?: string
  // For THRESHOLD tracking
  progressToThreshold?: number
}

const STORAGE_KEYS = {
  USER_PREFERENCES: 'cardOptimizer_userPreferences',
  CARD_DATA: 'cardOptimizer_cardData',
  WELCOME_BONUS_DATA: 'cardOptimizer_welcomeBonusData',
  DEALS: 'cardOptimizer_deals',
  BENEFIT_USAGE: 'cardOptimizer_benefitUsage',
}

// Default values
const DEFAULT_USER_PREFERENCES: UserPreferences = {
  timezone: 'America/New_York',
  defaultReminderDays: 7,
  valuePerPointRules: {
    UR: 0.015,
    MR: 0.016,
    VENTURE: 0.012,
    TY: 0.013,
  },
}

// Helper to check if we're in browser
const isBrowser = typeof window !== 'undefined'

// ============================================================================
// User Preferences
// ============================================================================

export function getUserPreferences(): UserPreferences {
  if (!isBrowser) return DEFAULT_USER_PREFERENCES

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load user preferences:', error)
  }

  return DEFAULT_USER_PREFERENCES
}

export function setUserPreferences(prefs: Partial<UserPreferences>): void {
  if (!isBrowser) return

  try {
    const current = getUserPreferences()
    const updated = { ...current, ...prefs }
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save user preferences:', error)
  }
}

// ============================================================================
// Card Data (open dates, renewal dates)
// ============================================================================

export function getCardData(cardId: string): CardData {
  if (!isBrowser) return { openDate: null, renewalMonthDay: null }

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CARD_DATA)
    if (stored) {
      const allCardData = JSON.parse(stored)
      return allCardData[cardId] || { openDate: null, renewalMonthDay: null }
    }
  } catch (error) {
    console.error('Failed to load card data:', error)
  }

  return { openDate: null, renewalMonthDay: null }
}

export function setCardData(cardId: string, data: Partial<CardData>): void {
  if (!isBrowser) return

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CARD_DATA)
    const allCardData = stored ? JSON.parse(stored) : {}

    allCardData[cardId] = {
      ...allCardData[cardId],
      ...data,
    }

    localStorage.setItem(STORAGE_KEYS.CARD_DATA, JSON.stringify(allCardData))
  } catch (error) {
    console.error('Failed to save card data:', error)
  }
}

// ============================================================================
// Welcome Bonus Data (current spend, dates)
// ============================================================================

export function getWelcomeBonusData(bonusId: string): WelcomeBonusData | null {
  if (!isBrowser) return null

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WELCOME_BONUS_DATA)
    if (stored) {
      const allBonusData = JSON.parse(stored)
      return allBonusData[bonusId] || null
    }
  } catch (error) {
    console.error('Failed to load welcome bonus data:', error)
  }

  return null
}

export function setWelcomeBonusData(bonusId: string, data: Partial<WelcomeBonusData>): void {
  if (!isBrowser) return

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.WELCOME_BONUS_DATA)
    const allBonusData = stored ? JSON.parse(stored) : {}

    allBonusData[bonusId] = {
      ...allBonusData[bonusId],
      ...data,
    }

    localStorage.setItem(STORAGE_KEYS.WELCOME_BONUS_DATA, JSON.stringify(allBonusData))
  } catch (error) {
    console.error('Failed to save welcome bonus data:', error)
  }
}

// ============================================================================
// Helpers to merge static data with user data
// ============================================================================

export interface EnrichedCard {
  id: string
  issuer: string
  productName: string
  network: string
  annualFee: number
  active: boolean
  openDate: string | null
  renewalMonthDay: string | null
  benefits: any[]
  welcomeBonus?: EnrichedWelcomeBonus
}

export interface EnrichedWelcomeBonus {
  id: string
  requiredSpend: number
  spendWindowStart: string
  spendWindowEnd: string
  earned: boolean
  earnedDate?: string | null
  expectedPoints: number
  actualPoints?: number | null
  program: string
  currentSpend: number
}

export function enrichCardWithUserData(card: any): EnrichedCard {
  const cardData = getCardData(card.id)

  let welcomeBonus: EnrichedWelcomeBonus | undefined
  if (card.welcomeBonus) {
    const bonusData = getWelcomeBonusData(card.welcomeBonus.id)
    welcomeBonus = {
      ...card.welcomeBonus,
      currentSpend: bonusData?.currentSpend ?? 0,
      spendWindowStart: bonusData?.spendWindowStart ?? card.welcomeBonus.spendWindowStart,
      spendWindowEnd: bonusData?.spendWindowEnd ?? card.welcomeBonus.spendWindowEnd,
    }
  }

  return {
    ...card,
    openDate: cardData.openDate,
    renewalMonthDay: cardData.renewalMonthDay,
    welcomeBonus,
  }
}

// ============================================================================
// Deals (cashback offers)
// ============================================================================

export function getDeals(): Deal[] {
  if (!isBrowser) return []

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DEALS)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load deals:', error)
  }

  return []
}

export function addDeal(deal: Omit<Deal, 'id' | 'createdAt'>): Deal {
  if (!isBrowser) throw new Error('Cannot add deal outside browser')

  const newDeal: Deal = {
    ...deal,
    id: `deal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    createdAt: new Date().toISOString(),
  }

  try {
    const deals = getDeals()
    deals.push(newDeal)
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals))
    return newDeal
  } catch (error) {
    console.error('Failed to add deal:', error)
    throw error
  }
}

export function updateDeal(dealId: string, updates: Partial<Omit<Deal, 'id' | 'createdAt'>>): void {
  if (!isBrowser) return

  try {
    const deals = getDeals()
    const dealIndex = deals.findIndex((d) => d.id === dealId)

    if (dealIndex === -1) {
      throw new Error(`Deal with id ${dealId} not found`)
    }

    deals[dealIndex] = {
      ...deals[dealIndex],
      ...updates,
    }

    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(deals))
  } catch (error) {
    console.error('Failed to update deal:', error)
    throw error
  }
}

export function deleteDeal(dealId: string): void {
  if (!isBrowser) return

  try {
    const deals = getDeals()
    const filtered = deals.filter((d) => d.id !== dealId)
    localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to delete deal:', error)
    throw error
  }
}

// ============================================================================
// Benefit Usage Tracking
// ============================================================================

export function getBenefitUsage(benefitId: string, cycleStart: string, cycleEnd: string): BenefitUsage | null {
  if (!isBrowser) return null

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BENEFIT_USAGE)
    if (stored) {
      const allUsage: BenefitUsage[] = JSON.parse(stored)
      return allUsage.find(
        (u) => u.benefitId === benefitId && u.cycleStart === cycleStart && u.cycleEnd === cycleEnd
      ) || null
    }
  } catch (error) {
    console.error('Failed to load benefit usage:', error)
  }

  return null
}

export function getAllBenefitUsage(): BenefitUsage[] {
  if (!isBrowser) return []

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BENEFIT_USAGE)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Failed to load all benefit usage:', error)
  }

  return []
}

export function addBenefitUsage(
  benefitId: string,
  cardId: string,
  cycleStart: string,
  cycleEnd: string,
  entry: Omit<BenefitUsageEntry, 'id'>
): void {
  if (!isBrowser) return

  try {
    const allUsage = getAllBenefitUsage()

    // Find or create usage record for this benefit and cycle
    let usageRecord = allUsage.find(
      (u) => u.benefitId === benefitId && u.cycleStart === cycleStart && u.cycleEnd === cycleEnd
    )

    const newEntry: BenefitUsageEntry = {
      ...entry,
      id: `usage_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    }

    if (usageRecord) {
      // Add to existing record
      usageRecord.usages.push(newEntry)
      usageRecord.totalUsed += entry.amount
    } else {
      // Create new record
      usageRecord = {
        benefitId,
        cardId,
        cycleStart,
        cycleEnd,
        usages: [newEntry],
        totalUsed: entry.amount,
      }
      allUsage.push(usageRecord)
    }

    localStorage.setItem(STORAGE_KEYS.BENEFIT_USAGE, JSON.stringify(allUsage))
  } catch (error) {
    console.error('Failed to add benefit usage:', error)
    throw error
  }
}

export function setBenefitActivation(
  benefitId: string,
  cardId: string,
  activated: boolean,
  activationDate?: string
): void {
  if (!isBrowser) return

  try {
    const allUsage = getAllBenefitUsage()

    // Find or create usage record
    let usageRecord = allUsage.find((u) => u.benefitId === benefitId)

    if (usageRecord) {
      usageRecord.activated = activated
      if (activationDate) {
        usageRecord.activationDate = activationDate
      }
    } else {
      // Create new record for activation tracking
      usageRecord = {
        benefitId,
        cardId,
        cycleStart: '',
        cycleEnd: '',
        usages: [],
        totalUsed: 0,
        activated,
        activationDate: activationDate || new Date().toISOString(),
      }
      allUsage.push(usageRecord)
    }

    localStorage.setItem(STORAGE_KEYS.BENEFIT_USAGE, JSON.stringify(allUsage))
  } catch (error) {
    console.error('Failed to set benefit activation:', error)
    throw error
  }
}

export function updateBenefitUsageEntry(
  benefitId: string,
  entryId: string,
  updates: Partial<Omit<BenefitUsageEntry, 'id'>>
): void {
  if (!isBrowser) return

  try {
    const allUsage = getAllBenefitUsage()

    allUsage.forEach((usageRecord) => {
      if (usageRecord.benefitId === benefitId) {
        const entryIndex = usageRecord.usages.findIndex((e) => e.id === entryId)
        if (entryIndex !== -1) {
          const oldEntry = usageRecord.usages[entryIndex]
          const oldAmount = oldEntry.amount || 0

          // Update the entry
          usageRecord.usages[entryIndex] = {
            ...oldEntry,
            ...updates,
          }

          // Recalculate totalUsed if amount changed
          if (updates.amount !== undefined) {
            usageRecord.totalUsed = usageRecord.totalUsed - oldAmount + updates.amount
          }
        }
      }
    })

    localStorage.setItem(STORAGE_KEYS.BENEFIT_USAGE, JSON.stringify(allUsage))
  } catch (error) {
    console.error('Failed to update benefit usage entry:', error)
    throw error
  }
}

export function deleteBenefitUsageEntry(benefitId: string, entryId: string): void {
  if (!isBrowser) return

  try {
    const allUsage = getAllBenefitUsage()

    allUsage.forEach((usageRecord) => {
      if (usageRecord.benefitId === benefitId) {
        const entryIndex = usageRecord.usages.findIndex((e) => e.id === entryId)
        if (entryIndex !== -1) {
          const deletedEntry = usageRecord.usages[entryIndex]
          usageRecord.totalUsed -= deletedEntry.amount
          usageRecord.usages.splice(entryIndex, 1)
        }
      }
    })

    localStorage.setItem(STORAGE_KEYS.BENEFIT_USAGE, JSON.stringify(allUsage))
  } catch (error) {
    console.error('Failed to delete benefit usage entry:', error)
    throw error
  }
}
