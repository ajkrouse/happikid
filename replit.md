# HappiKid - Childcare Provider Directory

## Overview
HappiKid is a full-stack web application designed to connect parents with childcare providers in the New York City metropolitan area. Its primary purpose is to enable parents to efficiently search, compare, and review childcare services, while empowering providers to manage their profiles and respond to inquiries. The platform aims to be a trust-first marketplace, leveraging AI-powered search capabilities to simplify the childcare search process. It now features **630 verified providers** across 23+ counties in NY, NJ, and CT, with comprehensive coverage in key commuter areas including Jersey City downtown (07302), Hoboken, and Heights neighborhoods.

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
- **Search and Filtering**: Advanced search capabilities with criteria such as provider type, location (borough/county), age range, price, and amenities. Includes real-time search with debouncing and pagination.
- **Provider Management**: Comprehensive profiles for providers, allowing management of basic information, location, services, pricing, amenities, and photo galleries, accessible via a dedicated dashboard.
- **Data Flow**: Defined flows for user authentication, search operations, and provider-parent interactions (inquiries, favoriting).
- **UI/UX Decisions**: Focus on a clean, user-friendly interface with consistent styling, sticky navigation, and improved responsiveness. Dynamic display of provider details, including pricing, age ranges, and license status. Onboarding flows are designed for clarity and ease of use for both parents and providers.
- **Homepage Display**: Features prominently displayed total provider count (630+ verified providers) with real-time database updates, building trust and showcasing platform scale.

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