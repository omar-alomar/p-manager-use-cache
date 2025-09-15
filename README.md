# Mildenberg Project Platform

A comprehensive project management platform built with Next.js 15, React 19, and Prisma. This application provides project tracking, task management, client management, and team collaboration features for the Mildenberg team.

## 🚀 Features

### Core Functionality
- **Project Management**: Create, edit, and track projects with detailed information
- **Task Management**: Assign and track tasks across projects and team members
- **Client Management**: Manage client information and project associations
- **Team Management**: User profiles, roles, and permissions
- **Milestone Tracking**: APFO (milestone) tracking with color-coded urgency indicators
- **Real-time Updates**: Live editing of project details, comments, and assignments

### Key Features
- **Advanced Search & Filtering**: Search across projects, clients, managers, MBA numbers, and Co Files
- **Smart Sorting**: Sort projects by milestones with intelligent date handling
- **Role-based Access**: Admin and user roles with appropriate permissions
- **Responsive Design**: Mobile-friendly interface with adaptive navigation
- **Caching**: Redis-based caching for improved performance
- **Authentication**: Secure session-based authentication with password hashing

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **CSS Modules** - Styling

### Backend
- **Next.js API Routes** - Server-side API
- **Prisma** - Database ORM
- **SQLite** - Database (development)
- **Redis** - Caching layer
- **Zod** - Schema validation

### Authentication
- **Session-based Auth** - Secure cookie-based sessions
- **Password Hashing** - bcrypt-style password security
- **Role-based Access Control** - Admin and user roles

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── clients/           # Client management
│   ├── login/             # Authentication
│   ├── projects/          # Project management
│   ├── tasks/             # Task management
│   ├── users/             # User profiles
│   └── my-tasks/          # Personal task view
├── components/            # React components
│   ├── admin/             # Admin-specific components
│   ├── auth/              # Authentication components
│   ├── navigation/        # Navigation components
│   └── ...                # Feature components
├── auth/                  # Authentication logic
├── db/                    # Database utilities
├── redis/                 # Redis caching
├── schemas/               # Zod validation schemas
└── utils/                 # Utility functions
```

## 🗄️ Database Schema

### Core Models

#### User
- `id` - Primary key
- `email` - Unique email address
- `name` - Display name
- `password` - Hashed password (nullable for OAuth)
- `salt` - Password salt (nullable for OAuth)
- `role` - User role (user/admin)
- `createdAt` - Account creation timestamp

#### Project
- `id` - Primary key
- `title` - Project name
- `clientId` - Associated client (nullable)
- `body` - Project description/comments
- `userId` - Project manager
- `apfo` - Main milestone date (nullable)
- `mbaNumber` - MBA reference number
- `coFileNumbers` - Co file references
- `dldReviewer` - DLD reviewer assignment
- `createdAt` - Project creation timestamp

#### Task
- `id` - Primary key
- `title` - Task description
- `completed` - Completion status
- `userId` - Assigned user
- `projectId` - Associated project
- `createdAt` - Task creation timestamp
- `updatedAt` - Last update timestamp

#### Client
- `id` - Primary key
- `name` - Client name
- `companyName` - Company name (nullable)
- `email` - Contact email
- `phone` - Contact phone (nullable)
- `address` - Client address (nullable)
- `createdAt` - Client creation timestamp
- `updatedAt` - Last update timestamp

#### Apfo (Milestone)
- `id` - Primary key
- `date` - Milestone date
- `item` - Milestone description
- `projectId` - Associated project
- `createdAt` - Milestone creation timestamp

#### Comment
- `id` - Primary key
- `email` - Commenter email
- `body` - Comment content
- `projectId` - Associated project
- `userId` - Commenter user
- `createdAt` - Comment timestamp

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Redis server (for caching)

### Installation

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
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL="file:./dev.db"
   REDIS_URL="redis://localhost:6379"
   SESSION_SECRET="your-session-secret-here"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start Redis server**
   ```bash
   redis-server
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

## 📱 Pages & Features

### Public Pages
- **Login** (`/login`) - User authentication
- **Sign Up** (`/signup`) - User registration

### Authenticated Pages
- **Projects** (`/projects`) - Main project dashboard
- **Project Details** (`/projects/[id]`) - Individual project view
- **New Project** (`/projects/new`) - Create new project
- **Clients** (`/clients`) - Client management
- **Tasks** (`/tasks`) - All tasks view
- **My Tasks** (`/my-tasks`) - Personal task view
- **Team** (`/users`) - User profiles
- **User Profile** (`/users/[id]`) - Individual user profile

### Admin Pages
- **Admin Dashboard** (`/admin`) - System administration
  - User management
  - Project management
  - Task management
  - Client management
  - System statistics

## 🔧 Key Components

### ProjectsPageClient
The main project dashboard component featuring:
- Advanced search and filtering
- Sortable columns (especially milestone dates)
- Real-time editing of project details
- Color-coded milestone urgency indicators
- Responsive table design

### Authentication System
- Session-based authentication
- Password hashing with salt
- Role-based access control
- Automatic session management

### Caching System
- Redis-based caching for improved performance
- Intelligent cache invalidation
- Optimized database queries

## 🎨 UI/UX Features

### Responsive Design
- Mobile-first approach
- Adaptive navigation (desktop/mobile)
- Touch-friendly interfaces

### Smart Filtering
- Real-time search across multiple fields
- Project manager filtering
- Milestone-based sorting

### Visual Indicators
- Color-coded milestone urgency:
  - 🔴 Red: Within 2 weeks (urgent)
  - 🟡 Yellow: Within 1 month (warning)
  - 🟢 Green: More than 1 month (safe)

## 🔒 Security Features

- **Password Security**: bcrypt-style hashing with salt
- **Session Management**: Secure cookie-based sessions
- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Prisma ORM
- **XSS Protection**: React's built-in protections

## 🚀 Performance Optimizations

- **React Caching**: Intelligent component caching
- **Database Optimization**: Efficient queries with Prisma
- **Redis Caching**: Fast data retrieval
- **Code Splitting**: Next.js automatic code splitting
- **Image Optimization**: Next.js image optimization

## 📊 Admin Features

### System Statistics
- Total users, projects, tasks, and clients
- Recent activity metrics
- System health indicators

### Management Tools
- User role management
- Project oversight
- Task assignment tools
- Client data management

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Management
- `npx prisma studio` - Open Prisma Studio
- `npx prisma db push` - Push schema changes
- `npx prisma generate` - Generate Prisma client
- `npx prisma db seed` - Seed database

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software for the Mildenberg team.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Version**: Alpha 1.0  
**Last Updated**: 2024  
**Team**: Mildenberg Development Team


