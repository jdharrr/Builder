# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Builder is a full-stack expense tracking application with a React frontend and C# (.NET 9) backend that migrated from PHP (see commit 9740b00). The application provides expense management, categorization, payment tracking, and dashboard visualizations.

## Architecture

### Backend (C# .NET 9)

The backend follows a layered architecture pattern with dependency injection:

**BuilderApi** - ASP.NET Core Web API (main entry point)
- Controllers: `AuthenticationController`, `ExpenseController`, `UserController`
- Middleware: `UserContextMiddleware` extracts user ID from JWT claims and populates `UserContext`
- Service registration in `ServiceCollectionExtensions.cs` and `Program.cs`
- JWT authentication with Bearer tokens
- Swagger UI available in development mode
- CORS configured for `localhost:5173` and `localhost:5174`

**DatabaseServices** - Database access layer
- `DatabaseService`: Core database connection/query execution
- DTOs: `UserDto`, `ExpenseDto`, `ExpensePaymentDto`, `UserSettingsDto`
- Configuration via `DatabaseSettings` (MySQL/MariaDB)

**AuthenticationServices** - Authentication & authorization
- `AuthenticationService`: Login, registration, password reset
- `TokenService`: JWT token generation/validation
- Custom exceptions: `AuthenticationException`

**BuilderRepositories** - Data access repositories
- `UserRepository`, `ExpenseRepository`, `ExpensePaymentRepository`, `ExpenseCategoryRepository`, `UserSettingsRepository`
- Custom exceptions: `GenericException`

**BuilderServices** - Business logic layer
- `UserService`, `ExpenseService`, `ExpenseCategoryService`, `ExpensePaymentService`
- Enums for expense operations: `ExpenseSearchColumn`, `ExpenseSortOptions`, `ExpenseTableActions`, `ExpenseTableBatchAction`, `CategoryChartRangeOptions`

**EmailServices** - Email functionality
- `EmailService` for notifications/password resets

### Frontend (React + Vite)

**Structure:**
- `src/api.jsx`: Centralized API client using axios, all endpoints communicate with `https://localhost:7245`
- `src/BuilderApp.jsx`: Main app component with routing and authentication state
- `src/components/`: Reusable UI components (modals, forms, cards, etc.)
- `src/pages/`: Page components for dashboard, expenses, totals, login
- `src/layouts/`: Layout wrapper (`BuilderLayout`)
- `src/providers/`: React context providers

**Key patterns:**
- React Query (`@tanstack/react-query`) for data fetching/caching with 60s stale time for user data
- React Router for navigation with `PrivateRoute` wrapper for protected routes
- Lazy loading with `React.lazy()` and `Suspense` for pages
- JWT tokens stored in cookies via `js-cookie`
- Bootstrap + React Bootstrap for UI
- Chart.js with react-chartjs-2 for visualizations

## Development Commands

### Backend (from repository root)

Build the solution:
```bash
dotnet build Builder.sln
```

Run the API server:
```bash
cd server/BuilderApi
dotnet run
```

The API will run on `https://localhost:7245` (configured in the client's api.jsx)

### Frontend (from client directory)

Install dependencies:
```bash
cd client
npm install
```

Run development server (typically runs on `localhost:5173` or `localhost:5174`):
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

Lint:
```bash
npm run lint
```

Preview production build:
```bash
npm run preview
```

## Configuration

### Backend Configuration (appsettings.json)

The `server/BuilderApi/appsettings.json` contains:
- `DatabaseSettings.ConnectionString`: MySQL connection string
- `JwtSettings`: JWT issuer, audience, expiry times, and secret
- `EmailSettings`: SMTP configuration for email services

### Database

The application uses MySQL/MariaDB. Connection configured in appsettings.json with database name "builder".

## Authentication Flow

1. User logs in via `POST /api/auth/login`
2. Backend validates credentials via `AuthenticationService`
3. `TokenService` generates JWT with user ID in "sub" claim
4. Frontend stores token in cookie
5. `UserContextMiddleware` extracts user ID from JWT on each authenticated request
6. Controllers access current user via injected `UserContext`

## Key Middleware Pipeline (in order)

1. HTTPS redirection
2. CORS (`AllowBuilderApp` policy)
3. Authentication
4. `UserContextMiddleware` (populates UserContext)
5. Authorization
6. Controller routing

## Recent Migration Notes

The codebase was recently migrated from PHP to C# (commits 87a3ea5, 9740b00). The frontend remained largely the same but now communicates with the new C# API.
