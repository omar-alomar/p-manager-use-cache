# Development Guide

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Git
- Redis server (for caching)
- SQLite (development) or PostgreSQL (production)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd p-manager-use-cache
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   DATABASE_URL="file:./dev.db"
   REDIS_URL="redis://localhost:6379"
   SESSION_SECRET="your-development-session-secret"
   NODE_ENV="development"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start Redis server**
   ```bash
   # macOS
   brew services start redis
   
   # Ubuntu/Debian
   sudo systemctl start redis-server
   
   # Or run directly
   redis-server
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── admin/             # Admin pages
│   ├── clients/           # Client management
│   ├── login/             # Authentication
│   ├── projects/          # Project management
│   ├── tasks/             # Task management
│   ├── users/             # User profiles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── admin/             # Admin components
│   ├── auth/              # Authentication components
│   ├── navigation/        # Navigation components
│   └── ...                # Feature components
├── auth/                  # Authentication logic
│   ├── currentUser.ts     # User session management
│   ├── passwordHasher.ts  # Password utilities
│   └── session.ts         # Session handling
├── db/                    # Database utilities
│   ├── db.ts              # Prisma client
│   ├── projects.ts        # Project queries
│   ├── users.ts           # User queries
│   └── ...                # Other data access
├── redis/                 # Redis utilities
│   └── redis.ts           # Redis client
├── schemas/               # Zod validation schemas
│   ├── project.ts         # Project validation
│   ├── user.ts            # User validation
│   └── ...                # Other schemas
├── utils/                 # Utility functions
│   ├── dateUtils.ts       # Date formatting
│   └── ...                # Other utilities
└── contexts/              # React contexts
    └── AuthContext.tsx    # Authentication context
```

## Development Workflow

### 1. Feature Development

1. **Create a feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make your changes**
   - Write code following the project conventions
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run test
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/new-feature
   ```

### 2. Database Changes

1. **Update Prisma schema**
   ```prisma
   // prisma/schema.prisma
   model NewModel {
     id        Int      @id @default(autoincrement())
     name      String
     createdAt DateTime @default(now())
   }
   ```

2. **Generate and apply migration**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Update seed data if needed**
   ```bash
   npx prisma db seed
   ```

### 3. Component Development

#### Creating a New Component
```typescript
// src/components/NewComponent.tsx
"use client"

import { useState } from "react"

interface NewComponentProps {
  title: string
  onAction?: () => void
}

export function NewComponent({ title, onAction }: NewComponentProps) {
  const [state, setState] = useState("")
  
  return (
    <div className="new-component">
      <h2>{title}</h2>
      {/* Component content */}
    </div>
  )
}
```

#### Component Guidelines
- Use TypeScript interfaces for props
- Include JSDoc comments for complex components
- Follow the existing naming conventions
- Use CSS classes from the global stylesheet

### 4. API Route Development

#### Creating an API Route
```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = schema.parse(body)
    
    // Process the request
    const result = await processData(validatedData)
    
    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )
  }
}
```

#### API Guidelines
- Always validate input with Zod schemas
- Use proper HTTP status codes
- Include error handling
- Add JSDoc comments for complex endpoints

## Code Style & Conventions

### TypeScript
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper return types for functions
- Avoid `any` type unless absolutely necessary

### React
- Use functional components with hooks
- Prefer `useState` and `useEffect` over class components
- Use proper dependency arrays in `useEffect`
- Extract custom hooks for reusable logic

### CSS
- Use CSS modules or global classes
- Follow BEM naming convention for complex components
- Use CSS custom properties for theming
- Keep styles organized and maintainable

### File Naming
- Use PascalCase for components: `UserProfile.tsx`
- Use camelCase for utilities: `dateUtils.ts`
- Use kebab-case for pages: `user-profile/page.tsx`
- Use descriptive names that indicate purpose

## Testing

### Running Tests
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests
```typescript
// __tests__/components/UserProfile.test.tsx
import { render, screen } from '@testing-library/react'
import { UserProfile } from '@/components/UserProfile'

describe('UserProfile', () => {
  test('renders user name', () => {
    render(<UserProfile name="John Doe" />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
```

### Test Guidelines
- Write unit tests for utility functions
- Write integration tests for API routes
- Write component tests for UI components
- Aim for high test coverage (>80%)

## Debugging

### Development Tools
- **React Developer Tools**: Browser extension
- **Prisma Studio**: Database GUI
- **Redis Commander**: Redis GUI
- **Next.js DevTools**: Built-in debugging

### Common Debugging Techniques

1. **Console Logging**
   ```typescript
   console.log('Debug info:', { user, data })
   ```

2. **React DevTools**
   - Inspect component state
   - Profile performance
   - Debug hooks

3. **Network Tab**
   - Monitor API requests
   - Check response data
   - Debug authentication

4. **Database Debugging**
   ```bash
   npx prisma studio
   ```

### Debugging Authentication
```typescript
// Add to your component
const { user, loading, error } = useAuth()
console.log('Auth state:', { user, loading, error })
```

## Performance Optimization

### React Optimizations
- Use `React.memo` for expensive components
- Use `useMemo` and `useCallback` for expensive calculations
- Implement proper key props for lists
- Avoid unnecessary re-renders

### Next.js Optimizations
- Use `next/image` for images
- Implement proper caching strategies
- Use dynamic imports for code splitting
- Optimize bundle size

### Database Optimizations
- Use proper indexes
- Implement query optimization
- Use connection pooling
- Cache frequently accessed data

## Environment Management

### Cookie and Session Isolation

The application implements environment-specific cookie and session isolation to prevent collisions between production and staging environments when they share the same domain but use different subdomains.

#### Cookie Isolation Strategy
- **Cookie Names**: Environment-specific prefixes (`prod-session-id`, `staging-session-id`, `dev-session-id`)
- **Redis Keys**: Environment-specific prefixes (`prod:session:`, `staging:session:`, `dev:session:`)
- **Redis Databases**: Separate Redis databases (prod=0, staging=1, dev=2)
- **Domain Scoping**: Optional `COOKIE_DOMAIN` environment variable for subdomain-specific cookies

#### Configuration Examples

**For subdomain isolation (recommended):**
```env
# Production
NODE_ENV=production
COOKIE_DOMAIN="prod.yourdomain.com"
REDIS_URL="redis://redis:6379/0"

# Staging  
NODE_ENV=staging
COOKIE_DOMAIN="staging.yourdomain.com"
REDIS_URL="redis://redis:6379/1"
```

**For shared Redis with different databases:**
```env
# Production
NODE_ENV=production
REDIS_URL="redis://shared-redis:6379/0"

# Staging
NODE_ENV=staging  
REDIS_URL="redis://shared-redis:6379/1"
```

### Development Environment
```env
NODE_ENV=development
DATABASE_URL="file:./dev.db"
REDIS_URL="redis://localhost:6379"
SESSION_SECRET="dev-secret-key"
```

### Staging Environment
```env
NODE_ENV=staging
DATABASE_URL="postgresql://user:pass@staging-db:5432/mildenberg"
REDIS_URL="redis://staging-redis:6379/1"
SESSION_SECRET="staging-secret-key"
COOKIE_DOMAIN="staging.yourdomain.com"
```

### Production Environment
```env
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@prod-db:5432/mildenberg"
REDIS_URL="redis://prod-redis:6379/0"
SESSION_SECRET="production-secret-key"
COOKIE_DOMAIN="prod.yourdomain.com"
```

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check if database is running
   npx prisma db push
   
   # Reset database
   npx prisma db reset
   ```

2. **Redis Connection Errors**
   ```bash
   # Check Redis status
   redis-cli ping
   
   # Start Redis
   redis-server
   ```

3. **Build Errors**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **TypeScript Errors**
   ```bash
   # Check TypeScript configuration
   npx tsc --noEmit
   ```

### Getting Help
- Check the project documentation
- Review existing issues on GitHub
- Ask questions in team chat
- Create a new issue with detailed information

## Contributing

### Pull Request Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Update documentation
6. Submit a pull request

### Code Review Guidelines
- Review code for correctness
- Check for security issues
- Ensure tests are included
- Verify documentation updates
- Test the changes locally

### Commit Message Format
```
type(scope): description

feat(auth): add password reset functionality
fix(ui): resolve mobile navigation issue
docs(api): update authentication endpoints
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`


