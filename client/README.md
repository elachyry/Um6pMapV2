# UM6P Map - Frontend Client

React + TypeScript + Vite frontend for the UM6P Map application.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
client/
├── src/
│   ├── api/              # API client functions
│   ├── components/       # Reusable UI components
│   │   └── ui/          # Base UI components (shadcn/ui)
│   ├── hooks/           # Custom React hooks
│   ├── pages/           # Page components
│   ├── stores/          # State management (Zustand)
│   ├── constants/       # Constants and configurations
│   ├── App.tsx          # Main app component
│   └── main.tsx         # Entry point
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── tsconfig.json        # TypeScript configuration
```

## 🛠️ Tech Stack

- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **State Management:** Zustand
- **Routing:** React Router v6
- **HTTP Client:** Fetch API

## 🔌 API Configuration

The frontend connects to the backend API at:
- **Development:** `http://localhost:3000/api`
- **Production:** Set via `VITE_API_URL` environment variable

## 📝 Available Scripts

- `npm run dev` - Start development server (port 5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎨 UI Components

This project uses shadcn/ui for base components. Components are located in `src/components/ui/`.

## 📡 API Integration

All API calls are centralized in `src/api/`:
- `client.ts` - Base API client with auth
- `campusApi.ts` - Campus management endpoints
- `roleApi.ts` - Role and permission endpoints
- `buildingApi.ts` - Building management endpoints

## 🔐 Authentication

- JWT tokens stored in localStorage
- Refresh token in HTTP-only cookies
- Automatic token refresh on API calls
- Protected routes with authentication check

## 🎯 Key Features

- Campus Management
- Building Management
- Role-Based Access Control (RBAC)
- Event Management
- QR Code Generation
- Route Planning
- User Management
- Reservation System

## 🌐 Environment Variables

Create a `.env` file:

```env
VITE_API_URL=http://localhost:3000/api
```

## 📦 Dependencies

Key dependencies:
- `react` & `react-dom` - UI framework
- `react-router-dom` - Routing
- `zustand` - State management
- `tailwindcss` - Styling
- `lucide-react` - Icons
- `date-fns` - Date utilities

## 🔧 Development

1. Make sure backend server is running on port 3000
2. Start frontend dev server: `npm run dev`
3. Open http://localhost:5173

## 🚢 Deployment

```bash
# Build
npm run build

# Output will be in dist/ directory
# Deploy dist/ to your static hosting service
```

## 📚 Documentation

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
