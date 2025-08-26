# HappiKid - Childcare Provider Directory

## Overview
HappiKid is a full-stack web application designed to connect parents with childcare providers across the tri-state area (NY, NJ, CT). Its primary purpose is to enable parents to efficiently search, compare, and review childcare services, while empowering providers to manage their profiles and respond to inquiries. The platform is a trust-first marketplace, leveraging AI-powered search capabilities and government verification to simplify the childcare search process. It now features **4,834+ providers** with **85% government verification**, offering the most comprehensive directory of licensed childcare, education, and enrichment programs in the Northeast.

## Recent Changes (August 2025)
- **MAJOR DATABASE EXPANSION**: Successfully imported **4,116 government-verified NJ DCF licensed childcare centers**, growing total providers from 718 to **4,834 (+573% growth)**
- **Government Verification Integration**: All NJ providers are officially verified by the New Jersey Department of Children and Families with license numbers and audit trails
- **Geographic Expansion**: Now covers comprehensive tri-state area with NY (453), NJ (4,351), and CT (30) providers
- **NJ DCF Data Import System**: Built complete automated import infrastructure with PDF extraction, data normalization, geocoding, and database upsert capabilities
- **Trust Enhancement**: Platform now features majority government-verified providers (85% verification rate) for increased parent confidence
- **Scalable Import Framework**: Ready-to-use system for future state childcare licensing database imports (PA, CT, etc.)

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
- **Database Schema**: Manages user profiles (parent/provider), detailed provider information, reviews, inquiries, and favorites.
- **Authentication**: Role-based access control (parent vs. provider) via Replit Auth, with session management and automatic user profile creation.
- **Search and Filtering**: Advanced search capabilities with hierarchical location filtering (county → city), provider type, age range, price, and amenities. Features real-time search with debouncing, pagination, and authentic provider counts for each location.
- **Provider Management**: Comprehensive profiles for providers, allowing management of basic information, location, services, pricing, amenities, and photo galleries, accessible via a dedicated dashboard.
- **Data Flow**: Defined flows for user authentication, search operations, and provider-parent interactions (inquiries, favoriting).
- **UI/UX Decisions**: Focus on a clean, user-friendly interface with hierarchical location filtering that shows counties first, then expands to specific cities with provider counts. Radio button age range selection, sticky navigation, and improved responsiveness. Dynamic display of provider details, including pricing, age ranges, and license status. Onboarding flows are designed for clarity and ease of use for both parents and providers.
- **Homepage Display**: Features prominently displayed total provider count with messaging "We've done the homework — 4,834+ trusted care & enrichment programs across NY, NJ & CT… and counting." Real-time database updates build trust and showcase platform scale.
- **Comprehensive Program Coverage**: Now includes daycare (4,420), schools (195), afterschool programs (188), and summer camps (31) spanning gymnastics, martial arts, coding/STEM, theatre, tutoring, language immersion, art studios, soccer programs, and elite private institutions.

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