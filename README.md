# HappiKid - Childcare Provider Directory

A comprehensive React-based platform connecting NYC tri-state area families with trusted childcare providers through an intelligent, data-driven search and recommendation system.

## 🌟 Features

### For Parents
- **Smart Search & Filtering**: Advanced search with multiple criteria (type, location, age range, features, pricing)
- **Provider Comparison**: Side-by-side comparison tool with personalized match scores
- **Favorites & Groups**: Save and organize providers into custom groups
- **Detailed Provider Profiles**: Comprehensive information including photos, reviews, pricing, and amenities
- **Review System**: Read and contribute authentic parent reviews
- **Inquiry Management**: Direct communication with providers

### For Providers
- **Comprehensive Onboarding**: Step-by-step guided setup with profile completeness tracking
- **Multi-Location Support**: Manage multiple facility locations with detailed information
- **Flexible Pricing System**: Support for various pricing models (hourly, daily, weekly, monthly, yearly)
- **Dynamic Amenities**: Customizable features and amenities based on provider type
- **License Verification**: Integrated license confirmation system
- **Analytics Dashboard**: Performance insights and recommendations
- **Inquiry Management**: Respond to parent inquiries and manage communications

## 🏗️ Architecture

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

### Database Schema
- **Users**: Parent and provider profiles with role-based access
- **Providers**: Comprehensive childcare provider information
- **Provider Locations**: Multiple facility locations per provider
- **Provider Programs**: Flexible pricing and program offerings
- **Provider Amenities**: Dynamic features based on provider type
- **Reviews**: Parent feedback and ratings system
- **Inquiries**: Communication between parents and providers
- **Favorites**: User bookmarking and group management

## 🚀 Getting Started

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
   REPLIT_AUTH_CLIENT_ID=your_replit_auth_client_id
   REPLIT_AUTH_CLIENT_SECRET=your_replit_auth_client_secret
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

## 📁 Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   └── lib/            # Utility functions
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Database operations
│   ├── replitAuth.ts       # Authentication logic
│   └── index.ts            # Server entry point
├── shared/                 # Shared types and schemas
│   └── schema.ts           # Database schema definitions
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate database migrations

## 🎯 Key Components

### Search & Filtering
- Real-time search with debouncing
- Multi-criteria filtering (type, location, age, features, price)
- Pagination support for large result sets

### Provider Comparison
- Side-by-side comparison of up to 5 providers
- Personalized match scores based on user preferences
- Save comparison groups for future reference

### Authentication System
- Role-based access (parent vs provider)
- OAuth 2.0 integration with Replit Auth
- Session management with PostgreSQL storage

### Provider Management
- Guided onboarding process
- Profile completeness tracking
- Multi-location and program management
- License verification system

## 📊 Database Coverage

The platform includes **55 diverse childcare providers** across the NYC tri-state area:

- **21 Daycare Centers** (6 months - 6 years)
- **15 Private Schools** (3 years - 18 years)
- **10 Summer Camps** (4 years - 17 years)
- **9 After-School Programs** (6 years - 15 years)

**Geographic Coverage:**
- All 5 NYC boroughs
- Long Island (Nassau, Suffolk counties)
- Westchester, Rockland, Orange, Putnam, Dutchess counties (NY)
- Bergen, Hudson, Essex, Morris, Somerset, Union counties (NJ)
- Fairfield County (CT)

## 🔐 Security Features

- **License Verification**: Only confirmed licensed providers shown publicly
- **Data Validation**: Comprehensive input validation using Zod schemas
- **Session Security**: Secure session management with PostgreSQL storage
- **Role-based Access Control**: Separate permissions for parents and providers

## 🎨 Design System

- **Consistent Pricing Display**: Full price ranges across all components
- **12-hour Time Format**: User-friendly time display throughout
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Accessibility**: ARIA labels and keyboard navigation support

## 📱 Mobile Optimization

- Responsive grid layouts
- Touch-friendly interfaces
- Optimized for mobile search and browsing
- Progressive Web App capabilities

## 🔄 Data Flow

1. **User Authentication**: OAuth flow with Replit Auth
2. **Search Process**: Real-time filtering with optimized database queries
3. **Provider Interaction**: Favorites, inquiries, and reviews
4. **Provider Management**: Onboarding, profile updates, and analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please contact the development team or open an issue in the GitHub repository.

## 🏆 Acknowledgments

- Built with modern web technologies for optimal performance
- Designed with user experience and accessibility in mind
- Comprehensive data coverage across the NYC tri-state area
- Real provider data for authentic user experience

---

**Last Updated**: February 10, 2026
**Version**: 0.1.0 (Alpha)
**Status**: Alpha Development