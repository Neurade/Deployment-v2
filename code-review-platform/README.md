# Code Review Platform - Clean Architecture Refactor

This project has been refactored using Clean Architecture principles to provide a scalable, maintainable, and well-structured Next.js frontend codebase.

## 🏗️ Architecture Overview

### Directory Structure

```
├── app/                          # Next.js App Router pages
│   ├── login/                    # Authentication pages
│   ├── signup/
│   └── [userID]/                # Dynamic user routes
│       ├── course/              # Course management
│       ├── profile/             # User profile
│       └── dashboard/           # User dashboard
├── components/                   # Reusable UI components
│   └── ui/                      # Base UI components
├── features/                    # Feature-based modules
│   ├── auth/                    # Authentication feature
│   │   ├── hooks/              # Auth-specific hooks
│   │   ├── services/           # Auth API services
│   │   └── types/              # Auth type definitions
│   ├── courses/                 # Course management feature
│   │   ├── hooks/              # Course-specific hooks
│   │   ├── services/           # Course API services
│   │   └── types/              # Course type definitions
│   └── profile/                 # Profile management feature
├── lib/                         # Shared utilities
│   ├── axios.ts                # HTTP client configuration
│   └── utils.ts                # Utility functions
├── services/                    # Legacy services (to be migrated)
└── types/                       # Global type definitions
```

## 🎯 Clean Architecture Principles

### 1. Separation of Concerns
- **UI Layer**: Components in `/components` are presentational only
- **Business Logic**: Hooks in `/features/[feature]/hooks` handle state and API calls
- **Data Layer**: Services in `/features/[feature]/services` handle API communication
- **Types**: Feature-specific types in `/features/[feature]/types`

### 2. Feature-Based Organization
Each feature is self-contained with its own:
- Types (`/types`)
- Services (`/services`)
- Hooks (`/hooks`)

### 3. Dependency Inversion
- Components depend on hooks
- Hooks depend on services
- Services depend on the HTTP client
- No circular dependencies

## 🚀 Key Features

### Authentication System
- **Login Page**: `/login` - User authentication
- **Signup Page**: `/signup` - User registration
- **Auth Hook**: `useAuth` - Manages authentication state
- **Auth Service**: `AuthService` - Handles auth API calls

### Course Management
- **Course List**: `/[userID]/course` - Display user's courses
- **Course Creation**: `/[userID]/course/new` - Create new courses
- **Course Detail**: `/[userID]/course/[courseID]` - Course details and assignments
- **Courses Hook**: `useCourses` - Manages course state
- **Course Service**: `CourseService` - Handles course API calls

### Profile Management
- **Profile Page**: `/[userID]/profile` - User profile management
- **Profile Updates**: Edit user information and preferences

## 🛠️ Technical Implementation

### HTTP Client Configuration
```typescript
// lib/axios.ts
- Custom axios instance with interceptors
- Automatic token management
- Error handling and redirects
- TypeScript support
```

### Reusable Components
```typescript
// components/ui/
- Button: Multiple variants, loading states
- Input: Labels, validation, error handling
- Card: Flexible card components with headers, content, footers
```

### Custom Hooks
```typescript
// features/[feature]/hooks/
- useAuth: Authentication state management
- useCourses: Course data and operations
- Proper error handling and loading states
```

### Type Safety
```typescript
// features/[feature]/types/
- Feature-specific type definitions
- Shared across components, hooks, and services
- Strict TypeScript enforcement
```

## 📱 Implemented Routes

| Route | Description | Status |
|-------|-------------|--------|
| `/login` | User login page | ✅ Complete |
| `/signup` | User registration page | ✅ Complete |
| `/[userID]/course` | Course list for user | ✅ Complete |
| `/[userID]/profile` | Profile management | ✅ Complete |
| `/[userID]/course/new` | Create new course | ✅ Complete |
| `/[userID]/course/[courseID]` | Course detail with assignments | ✅ Complete |

## 🔧 Development Guidelines

### Adding New Features
1. Create feature directory: `/features/[featureName]/`
2. Add types: `/types/index.ts`
3. Add services: `/services/[featureName]Service.ts`
4. Add hooks: `/hooks/use[FeatureName].ts`
5. Add components: `/components/[featureName]/`
6. Add pages: `/app/[featureName]/`

### Component Guidelines
- Keep components presentational
- Use custom hooks for business logic
- Implement proper TypeScript types
- Follow consistent naming conventions

### Service Guidelines
- Use the shared axios instance
- Implement proper error handling
- Return typed responses
- Handle loading states

## 🎨 UI/UX Features

### Modern Design
- Clean, minimalist interface
- Responsive design
- Consistent spacing and typography
- Accessible components

### User Experience
- Loading states for all async operations
- Error handling with user-friendly messages
- Form validation with real-time feedback
- Smooth navigation between pages

## 🔒 Security Features

### Authentication
- JWT token management
- Automatic token refresh
- Secure logout functionality
- Protected routes

### Data Protection
- Input validation
- XSS prevention
- CSRF protection via axios interceptors

## 📦 Dependencies

### Core Dependencies
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Lucide React (Icons)

### Development Dependencies
- ESLint
- Prettier
- TypeScript strict mode

## 🚀 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 🧪 Testing

The refactored codebase is designed to be easily testable:
- Components are pure and presentational
- Business logic is isolated in hooks
- Services are easily mockable
- Type safety reduces runtime errors

## 📈 Benefits of Clean Architecture

1. **Maintainability**: Clear separation of concerns
2. **Scalability**: Feature-based organization
3. **Testability**: Isolated business logic
4. **Type Safety**: Full TypeScript implementation
5. **Reusability**: Shared components and utilities
6. **Performance**: Optimized rendering and state management

## 🔄 Migration Notes

The refactoring maintains backward compatibility while introducing:
- New feature-based structure
- Enhanced type safety
- Improved error handling
- Better user experience
- Modern UI components

This refactored codebase provides a solid foundation for future development while maintaining clean, maintainable, and scalable code. 