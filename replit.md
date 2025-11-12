# Rutas del Eje Cafetero

## Overview

A tourism platform for the Colombian Coffee Region (Eje Cafetero) that allows users to discover, browse, and book authentic coffee tourism routes. The application features route listings, user authentication, booking management, and an admin panel for managing routes and reservations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Tooling**
- React 18 with TypeScript using Vite as the build tool
- Client-side routing via Wouter for lightweight navigation
- Component library: shadcn/ui with Radix UI primitives
- Styling: TailwindCSS with custom theme configuration
- State management: TanStack Query (React Query) for server state

**Design System**
- Typography: Montserrat (primary) and Merriweather (secondary) fonts from Google Fonts
- Color scheme: Warm, organic tones inspired by Colombian coffee culture with neutral base colors
- Layout: Card-based design inspired by Airbnb and Booking.com patterns
- Responsive breakpoints managed through Tailwind's default system

**UI Component Strategy**
- All UI components are located in `client/src/components/ui/` following shadcn/ui conventions
- Custom business components in `client/src/components/` (CardRuta, Hero, Navbar, Footer, etc.)
- Component examples available in `client/src/components/examples/` for development reference
- Design guidelines documented in `design_guidelines.md` for consistency

**Page Structure**
- Home: Hero section with search, featured routes, benefits section, and CTA
- Routes Listing: Filterable grid of available routes with destination and difficulty filters
- Route Detail: Individual route information with booking form
- Reservations: User's booking history and status
- Admin Panel: Route and reservation management (admin-only)
- Authentication: Separate login and register pages

### Backend Architecture

**Server Framework**
- Node.js with Express.js handling HTTP requests
- TypeScript for type safety across the stack
- Vite integration for development with HMR support

**API Design**
- RESTful endpoints under `/api` prefix
- Authentication endpoints: `/api/auth/register`, `/api/auth/login`
- Resource endpoints: `/api/rutas`, `/api/reservas`
- Protected routes using JWT middleware authentication
- Role-based authorization (admin vs usuario) via middleware

**Authentication & Security**
- JWT tokens for stateless authentication
- bcryptjs for password hashing (10 salt rounds)
- Tokens stored in localStorage on client-side
- Authorization header pattern: `Bearer <token>`
- Middleware functions: `authenticate()` and `authorizeRole()` for route protection
- JWT secret configurable via environment variable (defaults provided for development)

**Data Layer**
- Drizzle ORM for type-safe database queries
- Schema-first approach with Zod validation
- Shared schema definitions in `shared/schema.ts` used by both client and server
- Storage abstraction layer (`server/storage.ts`) implementing IStorage interface
- Database migrations managed in `/migrations` directory

**Request Flow**
1. Request logging middleware captures method, path, status, duration
2. JSON body parsing with raw body preservation for webhooks
3. Route handlers validate input using Zod schemas
4. Business logic executes through storage layer
5. Responses formatted as JSON with appropriate status codes
6. Error handling returns structured error objects

### Database Schema

**PostgreSQL with Drizzle ORM**

**Users Table**
- UUID primary key (auto-generated)
- Fields: nombre, email (unique), password (hashed), rol (enum: admin/usuario)
- User roles determine access to admin features

**Rutas Table**
- UUID primary key
- Fields: nombre, descripcion, destino, dificultad (enum: Fácil/Moderado/Avanzado)
- Additional fields: duracion, precio, imagenUrl, cupoMaximo
- Rating system: rating (decimal 2,1) and resenas count

**Reservas Table**
- UUID primary key with foreign keys to users and rutas
- Fields: fechaRuta, cantidadPersonas, totalPagado
- Status tracking: estado (enum: pendiente/confirmada/cancelada)
- Timestamp: createdAt for booking history

**Schema Management**
- Schema defined in TypeScript with Drizzle Kit
- Zod schemas auto-generated from Drizzle tables using drizzle-zod
- Insert schemas omit auto-generated fields (id, timestamps)
- Type exports shared between client and server for end-to-end type safety

### Asset Management

**Static Assets**
- Images stored in `attached_assets/generated_images/`
- Vite alias `@assets` points to `attached_assets` directory
- Image imports resolve through Vite's asset handling
- Featured route images: Salento, Valle de Cocora, coffee farms, etc.

## External Dependencies

### Core Dependencies

**Frontend Libraries**
- @tanstack/react-query: Server state management and caching
- wouter: Lightweight client-side routing
- react-hook-form: Form state management
- @hookform/resolvers: Zod schema validation for forms
- zod: Runtime type validation and schema definition
- date-fns: Date formatting and manipulation with Spanish locale support

**UI Component Libraries**
- @radix-ui/*: Comprehensive set of accessible UI primitives (accordion, dialog, dropdown, select, etc.)
- class-variance-authority: Type-safe variant management for components
- clsx & tailwind-merge: Utility for conditional className composition
- cmdk: Command palette component
- lucide-react: Icon library

**Backend Libraries**
- drizzle-orm: TypeScript ORM for PostgreSQL
- @neondatabase/serverless: Serverless PostgreSQL driver (though package.json shows postgres as well)
- bcryptjs: Password hashing
- jsonwebtoken: JWT token generation and verification
- express: Web server framework
- connect-pg-simple: PostgreSQL session store (included but may not be actively used with JWT)

### Development Tools

**Build & Development**
- vite: Frontend build tool and dev server
- tsx: TypeScript execution for server-side code
- esbuild: Server bundling for production
- @vitejs/plugin-react: React support in Vite
- @replit/vite-plugin-*: Replit-specific development plugins

**Type Safety**
- TypeScript compiler with strict mode enabled
- drizzle-zod: Auto-generate Zod schemas from Drizzle tables
- Shared types between client and server via `@shared` alias

### External Services

**Database**
- PostgreSQL database (configured via DATABASE_URL environment variable)
- Supports Neon serverless PostgreSQL or standard PostgreSQL
- Connection pooling handled by postgres.js driver

**Font Services**
- Google Fonts CDN for Montserrat and Merriweather typefaces
- Preconnect hints in HTML for performance optimization

### Environment Configuration

**Required Environment Variables**
- `DATABASE_URL`: PostgreSQL connection string (required)
- `JWT_SECRET`: Secret key for JWT signing (has default fallback)
- `NODE_ENV`: Environment mode (development/production)

**Build & Deployment**
- Production build: Vite builds client to `dist/public`, esbuild bundles server to `dist`
- Static file serving: Express serves built React app in production
- Development: Vite middleware integrated with Express for HMR