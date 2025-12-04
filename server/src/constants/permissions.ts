/**
 * Permission Constants
 * Purpose: Define all available permissions in the system
 * Inputs: None
 * Outputs: Permission constants and role definitions
 */

// Permission categories
export const PERMISSIONS = {
  // Campus Management
  CAMPUS_VIEW: 'campus:view',
  CAMPUS_CREATE: 'campus:create',
  CAMPUS_UPDATE: 'campus:update',
  CAMPUS_DELETE: 'campus:delete',
  
  // Building Management
  BUILDING_VIEW: 'building:view',
  BUILDING_CREATE: 'building:create',
  BUILDING_UPDATE: 'building:update',
  BUILDING_DELETE: 'building:delete',
  
  // User Management
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Role Management
  ROLE_VIEW: 'role:view',
  ROLE_CREATE: 'role:create',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_ASSIGN: 'role:assign',
  
  // Event Management
  EVENT_VIEW: 'event:view',
  EVENT_CREATE: 'event:create',
  EVENT_UPDATE: 'event:update',
  EVENT_DELETE: 'event:delete',
  
  // Reservation Management
  RESERVATION_VIEW: 'reservation:view',
  RESERVATION_CREATE: 'reservation:create',
  RESERVATION_UPDATE: 'reservation:update',
  RESERVATION_DELETE: 'reservation:delete',
  
  // Map Management
  MAP_VIEW: 'map:view',
  MAP_EDIT: 'map:edit',
  
  // QR Code Management
  QR_VIEW: 'qr:view',
  QR_CREATE: 'qr:create',
  
  // Route Generation
  ROUTE_VIEW: 'route:view',
  ROUTE_GENERATE: 'route:generate',
  
  // Access Requests
  ACCESS_REQUEST_VIEW: 'access_request:view',
  ACCESS_REQUEST_CREATE: 'access_request:create',
  ACCESS_REQUEST_APPROVE: 'access_request:approve',
  
  // Settings
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  
  // Database Backup
  BACKUP_VIEW: 'backup:view',
  BACKUP_CREATE: 'backup:create',
  BACKUP_RESTORE: 'backup:restore',
} as const

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS]

// Role definitions with their permissions
export const ROLE_PERMISSIONS = {
  SuperAdmin: {
    scope: 'GLOBAL',
    permissions: Object.values(PERMISSIONS), // All permissions
    description: 'Full system access across all campuses',
  },
  
  CampusSuperAdmin: {
    scope: 'CAMPUS',
    permissions: [
      // Buildings
      PERMISSIONS.BUILDING_VIEW,
      PERMISSIONS.BUILDING_CREATE,
      PERMISSIONS.BUILDING_UPDATE,
      PERMISSIONS.BUILDING_DELETE,
      
      // Users (campus-scoped)
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_UPDATE,
      PERMISSIONS.USER_DELETE,
      
      // Events
      PERMISSIONS.EVENT_VIEW,
      PERMISSIONS.EVENT_CREATE,
      PERMISSIONS.EVENT_UPDATE,
      PERMISSIONS.EVENT_DELETE,
      
      // Reservations
      PERMISSIONS.RESERVATION_VIEW,
      PERMISSIONS.RESERVATION_CREATE,
      PERMISSIONS.RESERVATION_UPDATE,
      PERMISSIONS.RESERVATION_DELETE,
      
      // Map
      PERMISSIONS.MAP_VIEW,
      PERMISSIONS.MAP_EDIT,
      
      // QR Codes
      PERMISSIONS.QR_VIEW,
      PERMISSIONS.QR_CREATE,
      
      // Routes
      PERMISSIONS.ROUTE_VIEW,
      PERMISSIONS.ROUTE_GENERATE,
      
      // Access Requests
      PERMISSIONS.ACCESS_REQUEST_VIEW,
      PERMISSIONS.ACCESS_REQUEST_APPROVE,
      
      // Settings
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_UPDATE,
      
      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,
      
      // Backup
      PERMISSIONS.BACKUP_VIEW,
      PERMISSIONS.BACKUP_CREATE,
      PERMISSIONS.BACKUP_RESTORE,
    ],
    description: 'Full access to one campus',
  },
  
  Admin: {
    scope: 'CAMPUS',
    permissions: [
      // Buildings
      PERMISSIONS.BUILDING_VIEW,
      PERMISSIONS.BUILDING_CREATE,
      PERMISSIONS.BUILDING_UPDATE,
      PERMISSIONS.BUILDING_DELETE,
      
      // Users (limited)
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.USER_CREATE,
      PERMISSIONS.USER_UPDATE,
      
      // Events
      PERMISSIONS.EVENT_VIEW,
      PERMISSIONS.EVENT_CREATE,
      PERMISSIONS.EVENT_UPDATE,
      PERMISSIONS.EVENT_DELETE,
      
      // Reservations
      PERMISSIONS.RESERVATION_VIEW,
      PERMISSIONS.RESERVATION_CREATE,
      PERMISSIONS.RESERVATION_UPDATE,
      PERMISSIONS.RESERVATION_DELETE,
      
      // Map
      PERMISSIONS.MAP_VIEW,
      PERMISSIONS.MAP_EDIT,
      
      // Access Requests
      PERMISSIONS.ACCESS_REQUEST_VIEW,
      PERMISSIONS.ACCESS_REQUEST_APPROVE,
      
      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,
    ],
    description: 'Manage campus resources except campuses and roles',
  },
  
  CampusEventManager: {
    scope: 'CAMPUS',
    permissions: [
      // Events
      PERMISSIONS.EVENT_VIEW,
      PERMISSIONS.EVENT_CREATE,
      PERMISSIONS.EVENT_UPDATE,
      PERMISSIONS.EVENT_DELETE,
      
      // Reservations
      PERMISSIONS.RESERVATION_VIEW,
      PERMISSIONS.RESERVATION_CREATE,
      PERMISSIONS.RESERVATION_UPDATE,
      PERMISSIONS.RESERVATION_DELETE,
      
      // QR Codes
      PERMISSIONS.QR_VIEW,
      PERMISSIONS.QR_CREATE,
      
      // Routes
      PERMISSIONS.ROUTE_VIEW,
      PERMISSIONS.ROUTE_GENERATE,
      
      // Map (read-only)
      PERMISSIONS.MAP_VIEW,
      
      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,
    ],
    description: 'Manage events, reservations, and QR codes',
  },
  
  Staff: {
    scope: 'CAMPUS',
    permissions: [
      // Access Requests
      PERMISSIONS.ACCESS_REQUEST_VIEW,
      PERMISSIONS.ACCESS_REQUEST_CREATE,
      
      // Reservations
      PERMISSIONS.RESERVATION_VIEW,
      PERMISSIONS.RESERVATION_CREATE,
      
      // Map (read-only)
      PERMISSIONS.MAP_VIEW,
      
      // Events (read-only)
      PERMISSIONS.EVENT_VIEW,
      
      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,
    ],
    description: 'Access requests and reservations',
  },
  
  Student: {
    scope: 'CAMPUS',
    permissions: [
      // Access Requests
      PERMISSIONS.ACCESS_REQUEST_VIEW,
      PERMISSIONS.ACCESS_REQUEST_CREATE,
      
      // Map (read-only)
      PERMISSIONS.MAP_VIEW,
      
      // Events (read-only)
      PERMISSIONS.EVENT_VIEW,
      
      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,
    ],
    description: 'View and request access',
  },
  
  Visitor: {
    scope: 'CAMPUS',
    permissions: [
      // Map (read-only)
      PERMISSIONS.MAP_VIEW,
      
      // Events (read-only, restricted)
      PERMISSIONS.EVENT_VIEW,
      
      // Dashboard
      PERMISSIONS.DASHBOARD_VIEW,
    ],
    description: 'View only access',
  },
} as const

export type RoleName = keyof typeof ROLE_PERMISSIONS
export type RoleScope = 'GLOBAL' | 'CAMPUS'

// Navbar items with required permissions
export const NAVBAR_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    requiredPermission: PERMISSIONS.DASHBOARD_VIEW,
  },
  {
    id: 'campus',
    label: 'Campus Management',
    path: '/campus',
    requiredPermissions: [PERMISSIONS.CAMPUS_VIEW, PERMISSIONS.CAMPUS_CREATE],
    requiresAny: true, // User needs any of these permissions
  },
  {
    id: 'map-management',
    label: 'Map Management',
    path: '/map-management',
    requiredPermissions: [PERMISSIONS.MAP_VIEW, PERMISSIONS.BUILDING_VIEW],
    requiresAny: true,
  },
  {
    id: 'events',
    label: 'Events',
    path: '/events',
    requiredPermission: PERMISSIONS.EVENT_VIEW,
  },
  {
    id: 'reservations',
    label: 'Reservations',
    path: '/reservations',
    requiredPermission: PERMISSIONS.RESERVATION_VIEW,
  },
  {
    id: 'access-requests',
    label: 'Access Requests',
    path: '/access-requests',
    requiredPermission: PERMISSIONS.ACCESS_REQUEST_VIEW,
  },
  {
    id: 'qr-codes',
    label: 'QR Codes',
    path: '/qr-codes',
    requiredPermission: PERMISSIONS.QR_VIEW,
  },
  {
    id: 'route-generation',
    label: 'Route Generation',
    path: '/route-generation',
    requiredPermission: PERMISSIONS.ROUTE_VIEW,
  },
  {
    id: 'permanent-users',
    label: 'Permanent Users',
    path: '/permanent-users',
    requiredPermission: PERMISSIONS.USER_VIEW,
  },
  {
    id: 'temporary-users',
    label: 'Temporary Users',
    path: '/temporary-users',
    requiredPermission: PERMISSIONS.USER_VIEW,
  },
  {
    id: 'roles',
    label: 'Role Management',
    path: '/roles',
    requiredPermission: PERMISSIONS.ROLE_VIEW,
  },
  {
    id: 'database-backup',
    label: 'Database Backup',
    path: '/database-backup',
    requiredPermission: PERMISSIONS.BACKUP_VIEW,
  },
] as const
