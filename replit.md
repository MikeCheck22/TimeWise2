# Overview

This is a comprehensive workforce management system built for technical teams, featuring time tracking, invoice management, material requests, tool registry, vacation planning, and vehicle management. The application uses a modern full-stack architecture with React frontend, Express backend, and PostgreSQL database.

# User Preferences

Preferred communication style: Simple, everyday language.
Priority focus: Timesheet registration functionality is the most critical feature.
Dashboard layout: Quick Actions should appear first, followed by metrics cards. User prefers the original dashboard design over new layouts. Quick Actions now feature Predictive Intelligence with smart suggestions based on user patterns and context.
Mobile responsiveness: All features must work on mobile devices with hamburger menu navigation.
Calendar feature: User requested a calendar view on timesheet page showing filled days in green and clickable to view registered information.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with Tailwind CSS styling
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **Authentication**: Context-based auth with protected routes

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Session Management**: Passport.js with local strategy for authentication
- **File Uploads**: Multer for handling file uploads (images, PDFs)
- **Database ORM**: Drizzle ORM for type-safe database operations
- **API Design**: RESTful endpoints with proper error handling

## Database Design
- **Primary Database**: PostgreSQL with Neon serverless
- **Schema Management**: Drizzle migrations for version control
- **Session Storage**: PostgreSQL-backed session store
- **Data Models**: Comprehensive schema covering users, projects, timesheets, invoices, suppliers, material requests, tools, vacation requests, and vehicles

## Authentication & Authorization
- **Strategy**: Session-based authentication with Passport.js
- **Role System**: Admin and technician roles with appropriate permissions
- **Protected Routes**: Client-side route protection based on authentication status
- **Session Persistence**: PostgreSQL session store for scalability

## File Management
- **Upload Handling**: Multer middleware for processing file uploads
- **File Types**: Support for images (JPEG, PNG) and documents (PDF)
- **Storage**: Local file system storage with configurable limits
- **Validation**: File type and size validation on upload

## Development Tools
- **Build System**: Vite for fast development and optimized production builds
- **Type Safety**: Full TypeScript coverage across frontend and backend
- **Code Quality**: ESLint and Prettier for consistent code formatting
- **Development Server**: Hot module replacement for rapid development

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Connection Management**: @neondatabase/serverless for optimized database connections

## UI Components & Styling
- **Radix UI**: Comprehensive component library for accessible UI elements
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe CSS class variants

## Development & Build Tools
- **Vite**: Next-generation frontend build tool with React plugin
- **TypeScript**: Static type checking for enhanced developer experience
- **PostCSS**: CSS processing with Tailwind integration
- **Replit Integration**: Specialized plugins for Replit development environment

## Authentication & Security
- **Passport.js**: Mature authentication middleware with local strategy
- **Express Session**: Session management with PostgreSQL backing
- **Crypto**: Node.js built-in crypto for secure password hashing

## Data Management
- **Drizzle ORM**: Type-safe ORM with PostgreSQL dialect
- **Zod**: Runtime type validation for forms and API endpoints
- **TanStack Query**: Powerful data fetching and caching solution
- **React Hook Form**: Performant form library with validation integration

## File Processing
- **Multer**: Express middleware for multipart/form-data handling
- **File System**: Node.js fs module for file operations
- **Path Utilities**: Node.js path module for cross-platform file paths

## Date & Time
- **date-fns**: Modern date utility library with internationalization support
- **Portuguese Locale**: Specific locale support for Portuguese formatting