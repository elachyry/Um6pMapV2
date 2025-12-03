# UM6P Admin Dashboard

A modern, beautiful admin dashboard for the UM6P Map system with dark mode support and comprehensive management features.

## Features

- 🎨 **Modern UI/UX**: Clean design inspired by YouTube's interface
- 🌓 **Dark Mode**: Full dark mode support with theme toggle
- 📱 **Responsive**: Mobile-first design that works on all devices
- 🔐 **RBAC**: Role-based access control system
- 📊 **Analytics**: Comprehensive statistics and visualizations
- 🗺️ **Map Management**: Advanced 3D map and location management
- 📅 **Event Management**: Create and manage campus events
- 👥 **User Management**: Handle temporary and permanent users
- 🎫 **QR Codes**: Generate and manage QR codes for check-ins
- 💾 **Database Backup**: Automated backup system

## Tech Stack

- **React** 18.2
- **TypeScript** 5.2
- **Vite** 5.0
- **TailwindCSS** 3.3
- **React Router** 6.20
- **Recharts** 2.10 (for charts)
- **Lucide React** (for icons)
- **Zustand** (for state management)

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Development

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (Button, Card, etc.)
│   ├── Layout.tsx      # Main layout wrapper
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── Header.tsx      # Top header with search and theme toggle
│   └── StatCard.tsx    # Statistics card component
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── TemporaryUsers.tsx
│   ├── PermanentUsers.tsx
│   ├── AccessRequests.tsx
│   ├── Events.tsx
│   ├── QRCodes.tsx
│   ├── RoleManagement.tsx
│   ├── RouteGeneration.tsx
│   ├── MapManagement.tsx
│   ├── Reservations.tsx
│   ├── DatabaseBackup.tsx
│   └── CampusManagement.tsx
├── stores/             # Zustand stores
│   └── themeStore.ts   # Theme state management
├── lib/                # Utilities
│   └── utils.ts        # Helper functions
├── App.tsx             # Main app component with routing
├── main.tsx            # Application entry point
└── index.css           # Global styles

## Dashboard Sections

### 1. **Dashboard** (`/dashboard`)
Overview with statistics, charts, and recent activity

### 2. **Temporary Users** (`/temporary-users`)
- Manage time-limited user accounts
- Bulk import and single user creation
- Statistics: total, active, pending, expired

### 3. **Permanent Users** (`/permanent-users`)
- Manage permanent accounts (faculty, staff)
- Bulk operations (activate/deactivate/delete)
- Statistics: total, active, inactive

### 4. **Access Requests** (`/access-requests`)
- Review guest access requests
- Approve/reject pending requests
- Statistics: total, accepted, pending, rejected

### 5. **Events** (`/events`)
- Create and manage campus events
- Event sessions and schedules
- Statistics: total, happening now, upcoming, completed

### 6. **QR Codes** (`/qr-codes`)
- Generate QR codes for event check-ins
- Slideshow mode for displaying codes
- Regenerate codes with custom intervals

### 7. **Role Management** (`/roles`)
- RBAC system for user permissions
- Create/edit/delete custom roles
- Assign roles to users

### 8. **Route Generation** (`/route-generation`)
- Generate navigation links to POIs
- Create QR codes for wayfinding
- Manage waypoints and routes

### 9. **Map Management** (`/map-management`)
- Manage buildings and locations
- Upload and configure 3D models
- Category management for locations

### 10. **Reservations** (`/reservations`)
- Manage space reservations
- Approve/reject reservation requests
- View reservation statistics

### 11. **Database Backup** (`/database-backup`)
- Create manual database backups
- Automated backup scheduling
- Restore from existing backups

### 12. **Campus Management** (`/campus`)
- Manage multiple campus locations
- Configure campus settings
- Switch between campuses

## Theme System

The dashboard supports light and dark modes. Toggle between themes using the button in the header.

Theme state is persisted in localStorage and automatically applied on page load.

## Customization

### Colors

Edit `tailwind.config.js` and `src/index.css` to customize the color scheme.

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add a route in `src/App.tsx`
3. Add navigation link in `src/components/Sidebar.tsx`

## License

MIT

## Author

UM6P Development Team
# Um6pMapV2
