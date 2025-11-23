# Credit Card Benefits Optimizer

A production-quality personal web app that helps you extract maximum value from your credit cards by tracking benefits, expiry dates, and generating actionable recommendations.

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)
![Prisma](https://img.shields.io/badge/Prisma-6-2d3748)

## ✨ Features

### Smart Benefit Tracking
- **Live benefit data** for Chase Sapphire Reserve, Amex Gold, Citi Custom Cash, and Capital One Venture X
- **Accurate temporal modeling** with support for:
  - Monthly resets (Amex Uber Cash, dining credits)
  - Semi-annual calendar windows (CSR $150 H1 + $150 H2 dining credit)
  - Calendar year cycles (annual credits)
  - Cardmember year cycles (Venture X travel credit)

### Intelligent Insights
- **Dashboard** with real-time stats and top 3 urgent actions
- **Expiry tracking** with color-coded urgency (red for <7 days, yellow for <30 days)
- **Value-at-risk calculations** showing exactly how much $ is about to expire
- **Welcome bonus progress** with suggested daily/weekly spend rates

### Actionable Recommendations
- **Action Center** prioritizing:
  - Expiring credits (next 60 days)
  - Welcome bonus deadlines with progress tracking
  - Monthly use-it-or-lose-it reminders
- Clear, plain-English instructions for using each benefit

### Visual Calendar
- **Month view calendar** showing all benefit events
- Color-coded events (expiring credits, resets, deadlines, anniversaries)
- Next 30 days timeline with countdown
- Easy navigation between months

### Comprehensive Settings
- **User preferences**: Timezone, reminder thresholds, value-per-point assumptions
- **Card management**: Edit open dates, renewal dates
- **Welcome bonus tracking**: Update current spend and deadlines
- All settings persist and affect benefit calculations in real-time

### Polished UI
- Framer-quality design with Tailwind CSS
- Fully responsive (desktop, tablet, mobile)
- Smooth transitions and hover states
- Intuitive navigation with mobile menu
- Consistent design system throughout

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/damianmathewswaterfield/credit-card-optimizer.git
   cd credit-card-optimizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Current Cards & Benefits

### Chase Sapphire Reserve
- **Annual Fee:** $795
- **Key Benefits:**
  - $300 dining credit ($150 Jan-Jun, $150 Jul-Dec) at Sapphire Reserve Exclusive Tables
  - 10X UR points on hotels/cars via Chase Travel
  - 3X UR points on dining and travel

### American Express Gold Card
- **Annual Fee:** $325
- **Key Benefits:**
  - $120/year Uber Cash ($10/month)
  - $100/year Resy credit ($50 semi-annually)
  - $120/year dining partners credit ($10/month)
  - $84/year Dunkin' credit ($7/month)
  - 4X MR on restaurants (up to $50k/year)
  - 4X MR on US supermarkets (up to $25k/year)

### Citi Custom Cash
- **Annual Fee:** $0
- **Key Benefits:**
  - 5% cash back on first $500/month in highest eligible category (auto-optimized)
  - Categories: restaurants, gas, grocery, travel, transit, streaming, drugstores, home improvement, fitness, live entertainment
  - 4X TY points on Citi Travel (through June 30, 2026)

### Capital One Venture X
- **Annual Fee:** $395
- **Key Benefits:**
  - $300 annual travel credit via Capital One Travel
  - 10,000 anniversary bonus miles ($100 value)
  - $120 TSA PreCheck/Global Entry credit
  - 10X miles on hotels/cars, 5X on flights via portal
  - 2X miles on all other purchases

## 🏗️ Architecture

### Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 4
- **Database:** Prisma + SQLite (dev) / Postgres (prod ready)
- **Date handling:** date-fns with timezone support

### Project Structure
```
src/
├── app/                      # Next.js pages
│   ├── page.tsx             # Dashboard
│   ├── cards/               # Card management
│   ├── action-center/       # Prioritized actions
│   ├── calendar/            # Visual calendar with events
│   └── settings/            # User preferences & card management
├── components/              # React components
│   ├── ui/                  # Design system primitives
│   └── layout/              # Navigation, headers
├── lib/
│   ├── benefits/            # Benefit calculation engine
│   │   ├── cycles.ts        # Cycle computation
│   │   ├── expiry.ts        # Expiry calculations
│   │   └── value.ts         # Value-at-risk analysis
│   └── db.ts                # Prisma client
└── types/                   # TypeScript definitions

prisma/
├── schema.prisma            # Database schema
└── seed.ts                  # Initial data with all 4 cards
```

### Data Model
- **User:** Timezone, reminder preferences, value-per-point assumptions
- **Card:** Issuer, product, fees, renewal dates
- **Benefit:** Type, value, cycle rules, usage limits, triggers, exclusions
- **BenefitUsage:** Usage tracking per cycle
- **WelcomeBonus:** Spend requirements, progress, deadlines
- **ReminderSettings:** Per-benefit or global reminder configuration

## 🔧 Customization

All customization is now done through the **Settings page** (no code editing required!):

### Using the Settings Page

1. **Navigate to Settings** from the main navigation
2. **User Preferences Section:**
   - Choose your timezone (affects expiry calculations)
   - Set default reminder lead time (3, 7, 14, or 30 days)
   - Adjust points value assumptions based on your redemption strategy:
     - Chase Ultimate Rewards (e.g., 0.015 = 1.5 cents per point)
     - Amex Membership Rewards (e.g., 0.016 = 1.6 cents per point)
     - Capital One Venture Miles (e.g., 0.012 = 1.2 cents per mile)
     - Citi ThankYou Points (e.g., 0.013 = 1.3 cents per point)

3. **Card Management Section:**
   - Click the edit icon (✏️) on any card to update:
     - **Open Date:** When you opened/activated the card
     - **Renewal Date (MM-DD):** Your cardmember year anniversary
   - These dates ensure accurate benefit cycle calculations

4. **Welcome Bonus Tracking:**
   - Click the edit icon on any welcome bonus to update:
     - **Current Spend:** Your actual spending progress (update regularly!)
     - **Start/End Dates:** Adjust if your terms differ from defaults

All changes save instantly and affect calculations across the entire app.

## 📝 Database Commands

```bash
# View/edit data in Prisma Studio
npm run db:studio

# Re-seed database after schema changes
npm run db:seed

# Push schema changes to database
npm run db:push

# Generate Prisma client after schema changes
npx prisma generate
```

## 🚧 Roadmap

### Phase 5: Plan Generator
- 12-month spending recommendations
- Category optimization across cards
- Welcome bonus prioritization
- Annual fee justification analysis

### Future Enhancements
- Calendar view with visual timeline
- Settings page for preferences
- Usage logging UI
- ROI analytics dashboard
- Email/push notifications
- Transaction import via Plaid (optional)
- Multi-user support

## 🔒 Security & Privacy

This app is designed for **single-user, self-hosted** use:
- No third-party analytics
- No external API calls (except during initial benefit research)
- SQLite database stored locally
- No credit card numbers or sensitive financial data stored
- All benefit tracking is manual input

For production deployment, consider:
- Moving to Postgres with encryption at rest
- Adding authentication (NextAuth.js)
- Setting up automated backups

## 📚 Resources

### Official Benefit Documentation
- [Chase Sapphire Reserve Benefits](https://account.chase.com/sapphire/reserve/benefits)
- [American Express Gold Card](https://www.americanexpress.com/us/credit-cards/card/gold-card/)
- [Citi Custom Cash](https://www.citi.com/credit-cards/citi-custom-cash-credit-card)
- [Capital One Venture X](https://www.capitalone.com/credit-cards/venture-x/)

### Development
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📄 License

This is a personal project. Feel free to fork and adapt for your own use.

## 🤖 Built With

Generated with [Claude Code](https://claude.com/claude-code)

---

**Note:** This app provides information and recommendations based on publicly available credit card terms. Always verify benefit details with your card issuer's official documentation. This is not financial advice.
