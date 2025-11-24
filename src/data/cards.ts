// Static card and benefit data (no database required)

export interface Card {
  id: string
  issuer: string
  productName: string
  network: string
  annualFee: number
  active: boolean
  benefits: Benefit[]
  welcomeBonus?: WelcomeBonus
}

export interface Benefit {
  id: string
  name: string
  type: 'RECURRING_CREDIT' | 'MULTIPLIER'
  nominalValue: number | null
  currency: string
  program?: string | null
  cycleType: 'MONTHLY' | 'CALENDAR_YEAR' | 'CARDMEMBER_YEAR' | 'SEMIANNUAL_CALENDAR' | 'ONE_TIME'
  cycleDefinition: string // JSON string
  usageLimitPerCycle: number | null
  triggerDescription: string
  exclusionsSummary: string
  priorityScore: number
  officialUrl: string
  active: boolean
}

export interface WelcomeBonus {
  id: string
  requiredSpend: number
  spendWindowStart: string
  spendWindowEnd: string
  earned: boolean
  earnedDate?: string | null
  expectedPoints: number
  actualPoints?: number | null
  program: string
}

// Static card data
export const CARDS: Card[] = [
  // ============================================================================
  // 1. Chase Sapphire Reserve
  // ============================================================================
  {
    id: 'csr',
    issuer: 'CHASE',
    productName: 'Chase Sapphire Reserve',
    network: 'VISA',
    annualFee: 795,
    active: true,
    benefits: [
      {
        id: 'csr-dining-credit',
        name: '$300 Annual Dining Credit at Sapphire Reserve Exclusive Tables',
        type: 'RECURRING_CREDIT',
        nominalValue: 300,
        currency: 'USD',
        cycleType: 'SEMIANNUAL_CALENDAR',
        cycleDefinition: JSON.stringify({
          type: 'multiple_windows',
          windows: [
            { startMonth: 1, startDay: 1, endMonth: 6, endDay: 30 },
            { startMonth: 7, startDay: 1, endMonth: 12, endDay: 31 },
          ],
        }),
        usageLimitPerCycle: 150,
        triggerDescription:
          'Dine at participating restaurants in the Sapphire Reserve Exclusive Tables program on OpenTable. Charges must post to your card within the window.',
        exclusionsSummary:
          'Only specific restaurants in the Exclusive Tables program qualify. Not all OpenTable restaurants are eligible.',
        priorityScore: 95,
        officialUrl: 'https://account.chase.com/sapphire/reserve/benefits',
        active: true,
      },
      {
        id: 'csr-10x-travel',
        name: '10X Ultimate Rewards on Hotels and Car Rentals via Chase Travel',
        type: 'MULTIPLIER',
        nominalValue: null,
        currency: 'POINTS',
        program: 'UR',
        cycleType: 'ONE_TIME',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: null,
        triggerDescription:
          'Book hotels and car rentals through Chase Ultimate Rewards travel portal.',
        exclusionsSummary: 'Must book via Chase portal; third-party sites do not qualify.',
        priorityScore: 75,
        officialUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve',
        active: true,
      },
      {
        id: 'csr-3x-dining',
        name: '3X Ultimate Rewards on Dining and Travel',
        type: 'MULTIPLIER',
        nominalValue: null,
        currency: 'POINTS',
        program: 'UR',
        cycleType: 'ONE_TIME',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: null,
        triggerDescription:
          'Earn 3X points on dining (restaurants, eligible delivery services) and travel purchases (airlines, hotels, car rentals, cruises, travel agencies).',
        exclusionsSummary: 'Excludes gift cards and some third-party purchases.',
        priorityScore: 80,
        officialUrl: 'https://creditcards.chase.com/rewards-credit-cards/sapphire/reserve',
        active: true,
      },
    ],
    welcomeBonus: {
      id: 'csr-wb',
      requiredSpend: 6000,
      spendWindowStart: '2025-11-10',
      spendWindowEnd: '2026-02-10', // Correct deadline: Feb 10, 2026
      earned: false,
      expectedPoints: 125000,
      program: 'UR',
    },
  },
  // ============================================================================
  // 2. Citi Custom Cash
  // ============================================================================
  {
    id: 'citi-custom-cash',
    issuer: 'CITI',
    productName: 'Citi Custom Cash',
    network: 'MASTERCARD',
    annualFee: 0,
    active: true,
    benefits: [
      {
        id: 'citi-5-percent',
        name: '5% Cash Back on Top Eligible Category (up to $500/month)',
        type: 'MULTIPLIER',
        nominalValue: 25,
        currency: 'USD',
        cycleType: 'MONTHLY',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: 500,
        triggerDescription:
          'Auto-optimized: Earn 5% cash back on first $500 in your highest eligible category each billing cycle. Categories: restaurants, gas, grocery, travel, transit, streaming, drugstores, home improvement, fitness, live entertainment.',
        exclusionsSummary: 'After $500/month, purchases earn 1%. Category is auto-selected.',
        priorityScore: 85,
        officialUrl: 'https://www.citi.com/credit-cards/citi-custom-cash-credit-card',
        active: true,
      },
      {
        id: 'citi-4x-travel',
        name: '4X ThankYou Points on Citi Travel (Hotels, Cars, Attractions)',
        type: 'MULTIPLIER',
        nominalValue: null,
        currency: 'POINTS',
        program: 'TY',
        cycleType: 'ONE_TIME',
        cycleDefinition: JSON.stringify({
          type: 'single',
          expiryDate: '2026-06-30',
        }),
        usageLimitPerCycle: null,
        triggerDescription: 'Book hotels, car rentals, and attractions via Citi Travel portal.',
        exclusionsSummary: 'Offer valid through June 30, 2026. Must book via Citi Travel.',
        priorityScore: 60,
        officialUrl: 'https://www.citi.com/credit-cards/citi-custom-cash-credit-card',
        active: true,
      },
    ],
    welcomeBonus: {
      id: 'citi-wb',
      requiredSpend: 1500,
      spendWindowStart: '2024-06-10',
      spendWindowEnd: '2024-12-10',
      earned: true,
      earnedDate: '2024-11-15',
      expectedPoints: 20000,
      actualPoints: 20000,
      program: 'TY',
    },
  },
  // ============================================================================
  // 3. American Express Gold Card
  // ============================================================================
  {
    id: 'amex-gold',
    issuer: 'AMEX',
    productName: 'American Express Gold Card',
    network: 'AMEX',
    annualFee: 325,
    active: true,
    benefits: [
      {
        id: 'amex-uber-cash',
        name: '$120 Annual Uber Cash ($10/month)',
        type: 'RECURRING_CREDIT',
        nominalValue: 120,
        currency: 'USD',
        cycleType: 'MONTHLY',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: 10,
        triggerDescription:
          'Add your Amex Gold to your Uber account. Automatically receive $10 Uber Cash each calendar month for Uber rides or Uber Eats orders in the U.S.',
        exclusionsSummary:
          'Must enroll card in Uber app. Credits reset on 1st of each month and do not roll over.',
        priorityScore: 90,
        officialUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
        active: true,
      },
      {
        id: 'amex-resy',
        name: '$100 Annual Resy Credit ($50 semi-annually)',
        type: 'RECURRING_CREDIT',
        nominalValue: 100,
        currency: 'USD',
        cycleType: 'SEMIANNUAL_CALENDAR',
        cycleDefinition: JSON.stringify({
          type: 'multiple_windows',
          windows: [
            { startMonth: 1, startDay: 1, endMonth: 6, endDay: 30 },
            { startMonth: 7, startDay: 1, endMonth: 12, endDay: 31 },
          ],
        }),
        usageLimitPerCycle: 50,
        triggerDescription:
          'Enroll and use your Amex Gold for eligible purchases at U.S. Resy restaurants or other Resy purchases.',
        exclusionsSummary: 'Enrollment required. Credits reset semi-annually and do not roll over.',
        priorityScore: 85,
        officialUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
        active: true,
      },
      {
        id: 'amex-dining-partners',
        name: '$120 Annual Dining Partners Credit ($10/month)',
        type: 'RECURRING_CREDIT',
        nominalValue: 120,
        currency: 'USD',
        cycleType: 'MONTHLY',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: 10,
        triggerDescription:
          'Earn up to $10 in statement credits each month for purchases at participating dining partners: Grubhub, The Cheesecake Factory, Goldbelly, Wine.com, Five Guys.',
        exclusionsSummary: 'Credits reset monthly. Not all locations/purchases may qualify.',
        priorityScore: 80,
        officialUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
        active: true,
      },
      {
        id: 'amex-dunkin',
        name: "$84 Annual Dunkin' Credit ($7/month)",
        type: 'RECURRING_CREDIT',
        nominalValue: 84,
        currency: 'USD',
        cycleType: 'MONTHLY',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: 7,
        triggerDescription:
          "Enroll and earn up to $7 in statement credits each month for eligible purchases at U.S. Dunkin' locations.",
        exclusionsSummary: 'Enrollment required. Credits reset monthly and do not roll over.',
        priorityScore: 70,
        officialUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
        active: true,
      },
      {
        id: 'amex-4x-restaurants',
        name: '4X Membership Rewards on Restaurants (up to $50k/year)',
        type: 'MULTIPLIER',
        nominalValue: null,
        currency: 'POINTS',
        program: 'MR',
        cycleType: 'CALENDAR_YEAR',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: 50000,
        triggerDescription:
          'Earn 4X points at restaurants worldwide, plus takeout and delivery in the U.S., on up to $50,000 in purchases per calendar year.',
        exclusionsSummary: 'After $50k spend, 1X points. Some delivery services may not qualify.',
        priorityScore: 90,
        officialUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
        active: true,
      },
      {
        id: 'amex-4x-supermarkets',
        name: '4X Membership Rewards on U.S. Supermarkets (up to $25k/year)',
        type: 'MULTIPLIER',
        nominalValue: null,
        currency: 'POINTS',
        program: 'MR',
        cycleType: 'CALENDAR_YEAR',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: 25000,
        triggerDescription:
          'Earn 4X points at U.S. supermarkets, on up to $25,000 in purchases per calendar year.',
        exclusionsSummary:
          'After $25k spend, 1X points. Excludes Target, Walmart Supercenters, and warehouse clubs.',
        priorityScore: 85,
        officialUrl: 'https://www.americanexpress.com/us/credit-cards/card/gold-card/',
        active: true,
      },
    ],
  },
  // ============================================================================
  // 4. Capital One Venture X
  // ============================================================================
  {
    id: 'venture-x',
    issuer: 'CAPITAL_ONE',
    productName: 'Capital One Venture X',
    network: 'VISA',
    annualFee: 395,
    active: true,
    benefits: [
      {
        id: 'venture-travel-credit',
        name: '$300 Annual Travel Credit',
        type: 'RECURRING_CREDIT',
        nominalValue: 300,
        currency: 'USD',
        cycleType: 'CARDMEMBER_YEAR',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: 300,
        triggerDescription:
          'Use toward purchases made through Capital One Travel. Credit expires on account anniversary.',
        exclusionsSummary:
          'Must book via Capital One Travel portal. Credit does not roll over to next year.',
        priorityScore: 95,
        officialUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
        active: true,
      },
      {
        id: 'venture-anniversary-miles',
        name: '10,000 Anniversary Bonus Miles',
        type: 'RECURRING_CREDIT',
        nominalValue: 100,
        currency: 'MILES',
        program: 'VENTURE',
        cycleType: 'CARDMEMBER_YEAR',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: 10000,
        triggerDescription:
          'Automatically receive 10,000 bonus miles each account anniversary starting after your first year.',
        exclusionsSummary: 'First anniversary bonus arrives after 1 year of account opening.',
        priorityScore: 75,
        officialUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
        active: true,
      },
      {
        id: 'venture-precheck',
        name: '$120 TSA PreCheck / Global Entry Credit',
        type: 'RECURRING_CREDIT',
        nominalValue: 120,
        currency: 'USD',
        cycleType: 'ONE_TIME',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: 120,
        triggerDescription:
          'Statement credit for TSA PreCheck or Global Entry application fee (every 4-5 years).',
        exclusionsSummary: 'Valid for renewal fees; not annual.',
        priorityScore: 60,
        officialUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
        active: true,
      },
      {
        id: 'venture-10x-hotels',
        name: '10X Miles on Hotels & Car Rentals via Capital One Travel',
        type: 'MULTIPLIER',
        nominalValue: null,
        currency: 'MILES',
        program: 'VENTURE',
        cycleType: 'ONE_TIME',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: null,
        triggerDescription: 'Book hotels and car rentals through Capital One Travel portal.',
        exclusionsSummary: 'Must book via Capital One Travel.',
        priorityScore: 80,
        officialUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
        active: true,
      },
      {
        id: 'venture-5x-flights',
        name: '5X Miles on Flights via Capital One Travel',
        type: 'MULTIPLIER',
        nominalValue: null,
        currency: 'MILES',
        program: 'VENTURE',
        cycleType: 'ONE_TIME',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: null,
        triggerDescription: 'Book flights through Capital One Travel portal.',
        exclusionsSummary: 'Must book via Capital One Travel.',
        priorityScore: 75,
        officialUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
        active: true,
      },
      {
        id: 'venture-2x-all',
        name: '2X Miles on All Other Purchases',
        type: 'MULTIPLIER',
        nominalValue: null,
        currency: 'MILES',
        program: 'VENTURE',
        cycleType: 'ONE_TIME',
        cycleDefinition: JSON.stringify({ type: 'single' }),
        usageLimitPerCycle: null,
        triggerDescription: 'Earn 2X miles on all purchases not in other bonus categories.',
        exclusionsSummary: 'No exclusions.',
        priorityScore: 70,
        officialUrl: 'https://www.capitalone.com/credit-cards/venture-x/',
        active: true,
      },
    ],
    welcomeBonus: {
      id: 'venture-wb',
      requiredSpend: 10000,
      spendWindowStart: '2024-08-01',
      spendWindowEnd: '2025-02-01',
      earned: false,
      expectedPoints: 100000,
      program: 'VENTURE',
    },
  },
]
