# HappiKid

A comprehensive React-based platform connecting NYC tri-state area families with trusted childcare providers through an intelligent, data-driven search and recommendation system.

The project is in **pre-MVP development stage**. The following describes its current capabilities and future plans.

## Database Coverage

The platform includes **5,588+ diverse childcare and enrichment providers** across the NYC tri-state area:

- **Daycare Centers** — Infant through pre-K programs (0–6 years)
- **Preschools & Schools** — Private, Montessori, faith-based, and progressive programs (2–18 years)
- **Summer Camps** — Day camps, specialty camps, and outdoor programs (4–17 years)
- **After-School & Enrichment Programs** — Arts, sports, STEM, indoor play, therapy, and more (0–18 years)

**85%+ of providers are government-verified** with trust badges displayed on profiles.

**Geographic Coverage:**
- All 5 NYC boroughs (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
- Northern New Jersey (Jersey City, Hoboken, Bergen, Hudson, Essex, Morris, Somerset, Union counties)
- Long Island (Nassau, Suffolk counties)
- Hudson Valley (Westchester, Rockland, Orange, Putnam, Dutchess counties)
- Connecticut (Fairfield County)

## Current Features

### For Parents
- **Smart Search & Filtering** — Advanced search with multiple criteria including provider type, location (county to city), age range, amenities, and pricing
- **AI-Powered Conversational Search** — Ask questions in plain English and get provider recommendations powered by GPT-4o-mini
- **Interactive Map View** — Leaflet-based map with proximity search, radius filtering, and location detection
- **Provider Profiles** — Comprehensive information including photos, reviews, pricing, amenities, and verification status
- **Parent-Provider Messaging** — Contact providers directly with pre-built templates for tour requests, availability checks, and rate inquiries
- **Family Profiles** — Build a family profile capturing children's ages, location preferences, schedule needs, budget, and must-have features
- **Favorites** — Save and organize providers for easy access
- **Review System** — Read and contribute authentic parent reviews
- **Subsidy Eligibility Filtering** — Find providers that accept childcare subsidies
- **After-School Programs Directory** — Browse 9 categories and 55+ subcategories of enrichment programs

### For Providers
- **Provider Dashboard** — Manage profile information, location, services, pricing, amenities, and photo galleries
- **Profile Optimization Score** — LinkedIn-style scoring based on completeness, engagement, verification, and freshness
- **Achievement Badges** — Earn badges like Top Rated and Quick Responder displayed on provider cards
- **Inquiry Management** — View and respond to parent messages and tour requests
- **Claim & Verify** — Providers can claim their listing and verify their credentials

## Planned Features
- **AI-Powered Matching** — Personalized provider recommendations based on family profiles
- **Provider Comparison** — Side-by-side comparison tool with personalized match scores
- **Favorites Groups** — Organize saved providers into custom groups
- **Enhanced Analytics** — Performance insights and recommendations for providers
- **Multi-Location Support** — Manage multiple facility locations from one dashboard
- **Community Features** — Social interaction for parents to connect and share recommendations

## Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Wouter** for lightweight client-side routing
- **Tailwind CSS** + **shadcn/ui** for modern, responsive design
- **TanStack Query** for efficient server state management
- **Vite** for fast development and optimized builds

### Backend
- **Node.js** with **Express.js** framework
- **PostgreSQL** database with **Drizzle ORM**
- **Neon** serverless PostgreSQL hosting
- **Replit Auth** with OpenID Connect for authentication
- **Session-based authentication** with PostgreSQL storage
- **OpenAI GPT-4o-mini** via Replit AI Integrations for conversational search

### Database Schema
- **Users** — Parent and provider profiles with role-based access
- **Providers** — Comprehensive childcare provider information with optimization scoring
- **Reviews** — Parent feedback and ratings
- **Provider Inquiries** — Messaging between parents and providers
- **Favorites** — User bookmarking
- **Family Profiles** — Parent preferences for AI-powered matching
- **After-School Taxonomy** — Categories and subcategories for enrichment programs

## Design System

HappiKid uses a **"Botanical"** design aesthetic — professional, data-driven, and trust-focused:

- **Deep Evergreen** `#1A4D3E` — Navigation, headings, primary text
- **Sage** `#E8F1ED` — Section backgrounds
- **Coral Clay** `#E07A5F` — Primary action buttons, logo accent
- **Trust Teal** `#3D9990` — Verified badges, active states
- **Sand** `#F4F1EA` — Secondary inputs, warm neutral areas

Typography: DM Serif Display for headlines, Inter for UI text. Rounded cards, soft shadows, and mobile-first responsive approach.

## Getting Started

### Prerequisites
- Node.js 18 or higher
- PostgreSQL database
- Replit account (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/happikid.git
   cd happikid
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

## Project Structure

```
client/                     # Frontend React application
  src/
    components/             # Reusable React components
    pages/                  # Route components
    hooks/                  # Custom React hooks
    lib/                    # Utility functions
server/                     # Backend Express application
  routes.ts                 # API route definitions
  storage.ts                # Database operations
  replitAuth.ts             # Authentication logic
  index.ts                  # Server entry point
shared/                     # Shared types and schemas
  schema.ts                 # Database schema definitions
scripts/                    # Data import scripts
README.md
```

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run db:push` — Push schema changes to database

## Security Features

- **Government Verification** — 85%+ of providers verified against licensing databases
- **Data Validation** — Comprehensive input validation using Zod schemas
- **Session Security** — Secure session management with PostgreSQL storage
- **Role-Based Access Control** — Separate permissions for parents and providers

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Last Updated:** February 2026
**Version:** 0.9.0
**Status:** Pre-MVP Development
