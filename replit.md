# HappiKid - Childcare Provider Directory

## Overview
HappiKid is a full-stack web application designed to connect parents with childcare providers across the tri-state area (NY, NJ, CT). Its primary purpose is to enable parents to efficiently search, compare, and review childcare services, while empowering providers to manage their profiles and respond to inquiries. The platform is a trust-first marketplace, leveraging AI-powered search capabilities and government verification to simplify the childcare search process. It now features **4,871+ providers** with **85.3% government verification**, offering the most comprehensive directory of licensed childcare, education, and enrichment programs in the Northeast.

## Recent Changes (November 2025)
- **Provider Gamification & Optimization System**: Implemented comprehensive profile optimization scoring and achievement badges to incentivize high-quality provider profiles through utility-based rewards:
  - **Scoring Algorithm**: LinkedIn-style weighted scoring with Completeness (40%), Engagement (30%), Verification (20%), and Freshness (10%) components. Fair baseline points ensure new providers can reach competitive scores (82-85) with perfect profiles.
  - **Achievement Badges**: Professional badge system (Top Rated, Quick Responder, Rising Star, Government Verified, Complete Profile) maintaining Navy/Mint/Coral brand aesthetic. Badges displayed on provider cards and search results to build trust.
  - **Search Ranking Integration**: Search results prioritize optimization score (PRIMARY), rating (SECONDARY), and review count (TERTIARY), creating direct incentive for profile improvement and rewarding quality with better visibility.
  - **Provider Dashboard**: ProfileOptimizationCard displays score breakdown, actionable improvement checklist with point values, category comparison, and earned badges. Authenticated-only access with 1-hour caching prevents abuse.
  - **Type Safety**: End-to-end TypeScript type safety with ProviderWithScore type, Drizzle ORM getTableColumns projections, and zero type casts throughout frontend/backend.
  - **Database Schema**: New provider_scores table stores score breakdown, achievement dates, and historical data for trend tracking. Left joins enable efficient ranking without N+1 queries.
- **Professional Design Transformation**: Completely redesigned the platform to eliminate "AI-generated" appearance and establish a professional, investor-ready brand identity:
  - **Brand Foundation**: Established professional color palette (Navy #1F3A5F primary, Mint #3BB273 secondary, Coral #F26B5B accent) replacing playful blues/yellows. Implemented DM Serif Display for headlines paired with Inter for UI text, creating elegant typography hierarchy.
  - **Hero Section Redesign**: Removed rotating animated text, eliminated all emojis from buttons and CTAs, replaced gradient backgrounds with clean neutral grays, consolidated to single powerful headline emphasizing trust and verification.
  - **Navigation Overhaul**: Removed all emoji decorations, eliminated gradient logo/buttons, replaced with simple Heart icon + serif wordmark, professional neutral styling with subtle borders instead of heavy shadows.
  - **Component Standardization**: Replaced playful rounded-full buttons with standard rounded-md, removed transform:scale hover effects, updated all cards to use consistent shadow-sm/shadow-lg hierarchy, modernized star ratings to use Lucide icons instead of hard-coded glyphs.
  - **Trust Metrics Prominence**: Created dedicated metrics bar showcasing 4,871+ providers, 85.3% government verification rate, and tri-state coverage with professional badge styling.
- **Mobile Responsiveness Overhaul**: Comprehensive mobile-first design improvements across all pages:
  - Landing page: Fixed rotating text overflow, responsive provider count bar, stacking after-school directory card on mobile
  - Navigation: Mobile hamburger menu with Sheet component for seamless mobile navigation
  - Responsive typography and touch targets throughout application
  - All pages verified mobile-friendly with proper viewport scaling
- **NYC Manhattan Provider Expansion**: Added **644+ government-verified NYC DOHMH childcare providers** from Manhattan, expanding coverage to downtown NYC with providers from Tribeca, SoHo, Chelsea, East Village, West Village, and more
- **After-School Programs Taxonomy**: Implemented comprehensive after-school program categorization system with **9 main categories** and **55 subcategories**, including Academic Enrichment, Creative & Performing Arts, Sports & Fitness, Technology & Innovation, and more. Features full-text search capabilities and keyword-based filtering. Accessible via dedicated browse page at `/after-school-programs` with accordion UI and search links for each subcategory.
- **Interactive Map View**: Added Leaflet-based map visualization for providers with proximity search, radius filtering, location detection, and clickable markers showing provider details
- **MAJOR DATABASE EXPANSION**: Successfully imported **4,116 government-verified NJ DCF licensed childcare centers**, growing total providers from 718 to **4,871 (+578% growth)**
- **NJ Summer Youth Camps Integration**: Added **37 government-verified NJ Department of Health summer camps** with official inspection reports and evaluations
- **Government Verification Integration**: All NJ providers are officially verified by state agencies (DCF for childcare centers, DOH for summer camps) with license numbers and audit trails
- **Geographic Expansion**: Now covers comprehensive tri-state area with NY (453+), NJ (4,388), and CT (30) providers
- **Bergen County Camps**: Successfully imported **24 summer camps from Bergen County** through automated PDF processing system (largest county collection)
- **Hudson County Camps**: Successfully imported **8 summer camps from Hudson County** through manual PDF processing of official DOH inspection reports
- **Automated & Manual Import Systems**: Built complete infrastructure for both automated bulk imports and manual processing of government inspection PDFs
- **Trust Enhancement**: Platform now features **85.3% government verification rate** (4,153 verified providers) for maximum parent confidence
- **Scalable Import Framework**: Ready-to-use systems for future state licensing database imports (PA, CT camps, etc.)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS with shadcn/ui
- **State Management**: TanStack Query
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM (hosted on Neon)
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express session

### Core Features
- **Database Schema**: Manages user profiles (parent/provider), detailed provider information, reviews, inquiries, and favorites. Includes dedicated after-school programs taxonomy with hierarchical categories and subcategories.
- **Authentication**: Role-based access control (parent vs. provider) via Replit Auth, with session management and automatic user profile creation.
- **Search and Filtering**: Advanced search capabilities with hierarchical location filtering (county → city), provider type, age range, price, and amenities. Features real-time search with debouncing, pagination, and authentic provider counts for each location. Includes map view with proximity-based filtering.
- **After-School Programs Taxonomy**: Comprehensive categorization system with 9 main categories (Academic Enrichment, Creative & Performing Arts, Sports & Fitness, Technology & Innovation, etc.) and 55 subcategories. Full-text search enabled with keywords and example providers for each subcategory.
- **Interactive Map View**: Leaflet-based map visualization showing provider locations with proximity search, radius controls, location detection, and interactive markers. Toggle between list, grid, and map views.
- **Provider Management**: Comprehensive profiles for providers, allowing management of basic information, location, services, pricing, amenities, and photo galleries, accessible via a dedicated dashboard.
- **Data Flow**: Defined flows for user authentication, search operations, and provider-parent interactions (inquiries, favoriting).
- **UI/UX Decisions**: Focus on a clean, user-friendly interface with hierarchical location filtering that shows counties first, then expands to specific cities with provider counts. Radio button age range selection, sticky navigation, and improved responsiveness. Dynamic display of provider details, including pricing, age ranges, and license status. Onboarding flows are designed for clarity and ease of use for both parents and providers.
- **Homepage Display**: Features prominently displayed total provider count with messaging "We've done the homework — 5,500+ trusted care & enrichment programs across NY, NJ & CT… and counting." Real-time database updates build trust and showcase platform scale.
- **Comprehensive Program Coverage**: Now includes daycare (4,420), schools (195), afterschool programs (188), and summer camps (68) spanning gymnastics, martial arts, coding/STEM, theatre, tutoring, language immersion, art studios, soccer programs, elite private institutions, and government-inspected youth camps.

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: Type-safe database interactions.
- **connect-pg-simple**: PostgreSQL session store.

### Authentication
- **Replit Auth**: OAuth 2.0 / OpenID Connect provider.
- **Passport.js**: Authentication middleware.
- **openid-client**: OpenID Connect client library.

### UI/UX Libraries
- **Radix UI**: Accessible component primitives.
- **shadcn/ui**: Pre-built component library.
- **Lucide React**: Icon library.
- **TanStack Query**: Data fetching and caching.

### Development Tools
- **TypeScript**: Static type checking.
- **Vite**: Build tool and dev server.
- **Tailwind CSS**: Utility-first CSS framework.
- **ESBuild**: Fast JavaScript bundling.