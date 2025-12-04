# UM6P Campus Map - Backend API

Modern REST API built with **Fastify**, **Prisma**, and **PostgreSQL** following clean architecture principles.

## 📁 Project Structure

```
server/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.ts               # Database seeding
├── src/
│   ├── config/               # Configuration files
│   │   ├── env.ts           # Environment variables
│   │   └── database.ts      # Prisma client
│   ├── middleware/           # Middleware functions
│   │   ├── auth.ts          # Authentication & authorization
│   │   ├── errorHandler.ts  # Global error handling
│   │   └── audit.ts         # Audit logging
│   ├── utils/               # Utility functions
│   │   ├── errors.ts        # Custom error classes
│   │   ├── logger.ts        # Logging utility
│   │   ├── password.ts      # Password hashing
│   │   └── jwt.ts           # JWT utilities
│   ├── repositories/        # Database access layer
│   │   ├── userRepository.ts
│   │   ├── campusRepository.ts
│   │   ├── buildingRepository.ts
│   │   ├── eventRepository.ts
│   │   └── reservationRepository.ts
│   ├── services/            # Business logic layer
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── campusService.ts
│   │   ├── buildingService.ts
│   │   ├── eventService.ts
│   │   └── reservationService.ts
│   ├── controllers/         # Request handlers
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── campusController.ts
│   │   ├── buildingController.ts
│   │   ├── eventController.ts
│   │   └── reservationController.ts
│   ├── routes/              # API routes
│   │   ├── authRoutes.ts
│   │   ├── userRoutes.ts
│   │   ├── campusRoutes.ts
│   │   ├── buildingRoutes.ts
│   │   ├── eventRoutes.ts
│   │   ├── reservationRoutes.ts
│   │   └── index.ts
│   ├── models/              # TypeScript types & DTOs
│   │   ├── user.dto.ts
│   │   ├── campus.dto.ts
│   │   └── ...
│   └── index.ts             # Server entry point
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## 🏗️ Architecture Pattern

### **Controller → Service → Repository**

1. **Controllers**: Handle HTTP requests/responses, validate input, call services
2. **Services**: Business logic, orchestrate multiple repositories
3. **Repositories**: Direct database operations via Prisma

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- npm or yarn

### Installation

```bash
# Install dependencies
cd server
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Database Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed

# Open Prisma Studio
npm run prisma:studio
```

### Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📚 API Documentation

### Authentication

```
POST   /api/auth/register       - Register new user
POST   /api/auth/login          - Login user
POST   /api/auth/refresh        - Refresh access token
POST   /api/auth/logout         - Logout user
POST   /api/auth/forgot-password - Request password reset
POST   /api/auth/reset-password  - Reset password
```

### Users

```
GET    /api/users               - Get all users (Admin)
GET    /api/users/:id           - Get user by ID
POST   /api/users               - Create user (Admin)
PUT    /api/users/:id           - Update user
DELETE /api/users/:id           - Delete user (Admin)
GET    /api/users/me            - Get current user profile
PUT    /api/users/me            - Update current user profile
```

### Campuses

```
GET    /api/campuses            - Get all campuses
GET    /api/campuses/:id        - Get campus by ID
POST   /api/campuses            - Create campus (Admin)
PUT    /api/campuses/:id        - Update campus (Admin)
DELETE /api/campuses/:id        - Delete campus (Admin)
```

### Buildings

```
GET    /api/buildings           - Get all buildings
GET    /api/buildings/:id       - Get building by ID
POST   /api/buildings           - Create building (Admin)
PUT    /api/buildings/:id       - Update building (Admin)
DELETE /api/buildings/:id       - Delete building (Admin)
GET    /api/campuses/:id/buildings - Get buildings by campus
```

### Events

```
GET    /api/events              - Get all events
GET    /api/events/:id          - Get event by ID
POST   /api/events              - Create event (Staff/Admin)
PUT    /api/events/:id          - Update event (Creator/Admin)
DELETE /api/events/:id          - Delete event (Creator/Admin)
GET    /api/events/upcoming     - Get upcoming events
GET    /api/events/happening-now - Get events happening now
```

### Reservations

```
GET    /api/reservations        - Get all reservations
GET    /api/reservations/:id    - Get reservation by ID
POST   /api/reservations        - Create reservation
PUT    /api/reservations/:id    - Update reservation (Creator/Admin)
DELETE /api/reservations/:id    - Cancel reservation
POST   /api/reservations/:id/approve - Approve reservation (Admin)
POST   /api/reservations/:id/reject  - Reject reservation (Admin)
GET    /api/reservations/pending     - Get pending reservations (Admin)
GET    /api/reservations/my          - Get my reservations
```

## 🔒 Authentication & Authorization

### JWT Tokens

- **Access Token**: Short-lived (7 days default), sent with each request
- **Refresh Token**: Long-lived (30 days default), used to get new access tokens

### Headers

```
Authorization: Bearer <access_token>
```

### User Roles

- `SUPER_ADMIN`: Full system access
- `ADMIN`: Campus-level administration
- `STAFF`: Create events, manage resources
- `STUDENT`: Basic access, create reservations
- `GUEST`: Limited read-only access
- `TEMPORARY`: Time-limited guest access

## 🛡️ Security Features

- Password hashing with bcrypt
- JWT authentication
- CSRF protection
- Rate limiting
- Helmet.js security headers
- CORS configuration
- Input validation with Zod
- SQL injection protection (Prisma)
- Audit logging

## 📊 Database Models

Key entities:
- **User**: Authentication, profiles, roles
- **Campus**: University campuses
- **Building**: Campus buildings with 3D models
- **Location**: Rooms, offices, facilities
- **Event**: Campus events and sessions
- **Reservation**: Space booking requests
- **POI**: Points of interest
- **AccessRequest**: Guest access management

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run test coverage
npm run test:coverage
```

## 📝 Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## 🔧 Environment Variables

See `.env.example` for all available configuration options.

## 📦 Dependencies

### Core
- **fastify**: Fast web framework
- **@prisma/client**: Database ORM
- **zod**: Schema validation

### Security
- **bcrypt**: Password hashing
- **@fastify/jwt**: JWT authentication
- **@fastify/helmet**: Security headers
- **@fastify/cors**: CORS handling
- **@fastify/rate-limit**: Rate limiting

### Utilities
- **dotenv**: Environment variables
- **nanoid**: ID generation

## 🤝 Contributing

1. Follow the established architecture
2. Add comments to all functions (Purpose, Inputs, Outputs)
3. Write tests for new features
4. Update documentation

## 📄 License

MIT
