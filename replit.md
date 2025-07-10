# HappiKid - Childcare Provider Directory

## Overview

HappiKid is a full-stack web application that connects parents with childcare providers in New York City. The platform allows parents to search, compare, and review childcare services while enabling providers to manage their profiles and respond to inquiries. Built with modern web technologies and focused on user experience.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express session with PostgreSQL store

### Project Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   └── replitAuth.ts       # Authentication logic
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema definitions
└── migrations/             # Database migration files
```

## Key Components

### Database Schema
- **users**: User profiles with role-based access (parent/provider)
- **providers**: Childcare provider profiles with detailed information
- **reviews**: User reviews and ratings for providers
- **inquiries**: Communication between parents and providers
- **favorites**: User bookmarking system
- **sessions**: Session storage for authentication

### Authentication System
- Integrated Replit Auth using OpenID Connect
- Role-based access control (parent vs provider)
- Session-based authentication with PostgreSQL storage
- Automatic user profile creation on first login

### Search and Filtering
- Advanced search with multiple filter criteria:
  - Provider type (daycare, afterschool, camp, school)
  - Borough/location
  - Age range compatibility
  - Price range
  - Special features and amenities
- Real-time search with debouncing
- Pagination support

### Provider Management
- Comprehensive provider profiles with:
  - Basic information (name, description, contact)
  - Location and service area
  - Age ranges served
  - Pricing information
  - Features and amenities
  - Photo galleries
- Provider dashboard for profile management
- Inquiry management system

## Data Flow

### User Authentication Flow
1. User clicks login/signup
2. Redirected to Replit Auth provider
3. OAuth flow completion
4. User profile created/updated in database
5. Session established with role-based permissions

### Search Flow
1. User enters search criteria
2. Frontend sends API request with filters
3. Backend queries database with optimized filters
4. Results returned with pagination
5. Frontend displays provider cards with key information

### Provider Interaction Flow
1. Parent views provider details
2. Can favorite provider for later reference
3. Can submit inquiry through contact form
4. Provider receives inquiry notification
5. Provider can respond through dashboard

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle ORM**: Type-safe database operations
- **connect-pg-simple**: PostgreSQL session store

### Authentication
- **Replit Auth**: OAuth 2.0 / OpenID Connect provider
- **Passport.js**: Authentication middleware
- **openid-client**: OpenID Connect client library

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Lucide React**: Icon library
- **TanStack Query**: Data fetching and caching

### Development Tools
- **TypeScript**: Static type checking
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **ESBuild**: Fast JavaScript bundling

## Deployment Strategy

### Build Process
- Frontend: Vite builds React app to `dist/public`
- Backend: ESBuild bundles Node.js app to `dist/index.js`
- Static assets served from Express in production

### Environment Configuration
- Development: Vite dev server with HMR
- Production: Express serves static files and API
- Database: Environment-specific connection strings
- Authentication: Replit-specific OAuth configuration

### Database Management
- Schema migrations handled by Drizzle Kit
- Push-based schema updates for development
- Connection pooling for production scalability

## Changelog
- July 01, 2025: Initial setup
- July 01, 2025: Updated to MVP version based on new PRD requirements
  - Fixed search button styling consistency between logged-in and non-logged-in states
  - Implemented unique provider-specific images for each brand
  - Added sticky navigation header for better UX
  - Added rotating childcare type text in hero section with smooth scrolling animation (Daycare, After-School Program, Camp, Private School)
  - Updated provider data with accurate real-world information from public sources
- July 03, 2025: Unified comparison and favorite groups for simplified UX
  - Combined comparison groups and favorite groups into single "My Groups" system
  - Updated UI language throughout - "Compare & Save", "My Groups" instead of separate concepts
  - Fixed tooltip positioning for data source icons with improved z-index and arrow design
  - Added automatic group refresh when comparison modal opens
  - Simplified user mental model from two-tier saving to unified group management
  - Fixed tooltip positioning to render to the right of icons to prevent clipping
  - Added confirmation dialog before deleting entire groups in favorites manager
  - Fixed Save Comparison button to properly save groups using unified system
  - Added clickable group headers that load saved groups directly into comparison tool
  - Updated group display with "Click to compare" badges for better user guidance
  - Enhanced user instructions to include group comparison functionality
- July 03, 2025: Provider Experience Implementation
  - Added comprehensive provider onboarding with step-by-step guided setup
  - Implemented provider dashboard with analytics overview and recommendations
  - Added profile completeness tracking with percentage indicators
  - Created visibility recommendations engine with actionable insights
  - Implemented premium features teasing with upgrade prompts
  - Added provider-specific database schema fields for analytics and onboarding
  - Created provider authentication and profile management API endpoints
  - Added provider navigation routes and protected route handling
  - Implemented basic analytics display with mock data for demonstration
  - Added profile verification status and visibility controls
- July 03, 2025: Provider Onboarding UX Improvements
  - Updated provider setup to use consistent Navigation header across all pages
  - Restructured layout with clean top progress tracker instead of sidebar approach
  - Added age conversion display (months to years/months) for better user experience
  - Implemented compact premium features card that fits without scrollbars
  - Enhanced step-by-step progress tracking with tooltips and visual indicators
  - Added navigation warning for incomplete profiles to prevent data loss
  - Fixed celebration page routing after profile completion
  - Improved responsive design with better mobile compatibility
- July 10, 2025: Enhanced Pricing Display & About Page
  - Fixed pricing display logic to prevent $0.00 from appearing inappropriately
  - Updated $$ meter calculation to use midpoint of estimated cost ranges for accuracy
  - Made pricing display more compact with tighter spacing and "mo" abbreviation
  - Added borough-based pricing adjustments (Manhattan premium, others adjusted)
  - Implemented clear $$ meter thresholds: $1500=1$, $2200=2$, $2900=3$, $3600=4$, above=5$
  - Enhanced About page with comprehensive mission, values, and how-it-works sections
  - Added engaging statistics and call-to-action elements to About page
  - Replaced map visualization with modern animated coverage network showing NYC as central hub
  - Created orbital animation for 5 boroughs with extended coverage areas (Long Island, Westchester, NJ)
  - Added dotted connection patterns and coverage statistics for professional tech aesthetic

## User Preferences

Preferred communication style: Simple, everyday language.