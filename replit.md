# HappiKid - Childcare Provider Directory

## Overview
HappiKid is a full-stack web application connecting parents with childcare providers across NY, NJ, and CT. It enables parents to search, compare, and review childcare services, while empowering providers to manage profiles and respond to inquiries. The platform emphasizes trust, utilizing AI-powered search and government verification. It features over 4,871 providers, with 85.3% government verification, offering a comprehensive directory of licensed childcare, education, and enrichment programs in the Northeast.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The platform features a warm, sophisticated design with an earth-toned color palette (terracotta, sage, mustard, deep coral, amber, teal-blue) and warm neutrals. Design elements include rounded cards, soft shadows, tactile textures, and asymmetric layouts. Typography uses DM Serif Display for headlines and Inter for UI text. All border radii are standardized (e.g., `rounded-lg` for buttons/inputs, `rounded-2xl` for cards). The search results page mirrors this aesthetic with a warm ivory background, sage-themed accents, and coral call-to-actions. Mobile responsiveness is a core design principle, with a mobile-first approach implemented across all pages, including a responsive navigation and adjusted typography.

### Technical Implementations
- **Frontend**: React 18 with TypeScript, Wouter for routing, Tailwind CSS with shadcn/ui for styling, TanStack Query for state management, and Vite as the build tool.
- **Backend**: Node.js with Express.js, PostgreSQL with Drizzle ORM (hosted on Neon), Replit Auth with OpenID Connect for authentication, and Express session for session management.

### Feature Specifications
- **Search and Filtering**: Advanced search capabilities include hierarchical location filtering (county → city), provider type, age range, price, and amenities. Features real-time search with debouncing, pagination, and authentic provider counts.
- **Interactive Map View**: Leaflet-based map visualization with proximity search, radius filtering, location detection, and clickable markers, allowing toggling between list, grid, and map views.
- **Provider Management**: Comprehensive profiles for providers, allowing management of basic information, location, services, pricing, amenities, and photo galleries via a dedicated dashboard.
- **Authentication**: Role-based access control (parent vs. provider) via Replit Auth, with session management and automatic user profile creation.
- **After-School Programs Taxonomy**: A comprehensive categorization system with 9 main categories and 55 subcategories, accessible via a dedicated browse page with full-text search and keyword-based filtering.
- **Provider Gamification & Optimization**: Implemented a LinkedIn-style scoring algorithm based on Completeness, Engagement, Verification, and Freshness. Achievement badges (e.g., Top Rated, Quick Responder) incentivize high-quality profiles and are displayed on provider cards. Search results prioritize this optimization score for ranking.

### System Design Choices
The system is designed for scalability, particularly with database imports. It supports both automated bulk imports and manual processing of government inspection PDFs. A focus on trust is paramount, with a high government verification rate (85.3%) and prominent display of trust metrics. The database schema manages user profiles, detailed provider information, reviews, inquiries, and favorites, including a dedicated after-school programs taxonomy.

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
- **Leaflet**: Interactive map visualization.

### Development Tools
- **TypeScript**: Static type checking.
- **Vite**: Build tool and dev server.
- **Tailwind CSS**: Utility-first CSS framework.
- **ESBuild**: Fast JavaScript bundling.