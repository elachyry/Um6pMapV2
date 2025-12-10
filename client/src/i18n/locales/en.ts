export default {
  "sidebar": {
    "dashboard": "Dashboard",
    "events": "Events",
    "qrCodes": "QR Codes",
    "userManagement": "User Management",
    "temporaryUsers": "Temporary Users",
    "permanentUsers": "Permanent Users",
    "accessRequests": "Access Requests",
    "roleManagement": "Role Management",
    "operations": "Operations",
    "routeGeneration": "Route Generation",
    "mapManagement": "Map Management",
    "reservations": "Reservations",
    "system": "System",
    "databaseBackup": "Database Backup",
    "campusManagement": "Campus Management"
  },
  "header": {
    "search": "Search",
    "switchToLight": "Switch to light mode",
    "switchToDark": "Switch to dark mode"
  },
  "dashboard": {
    "title": "Dashboard",
    "subtitle": "Overview of your admin dashboard",
    "stats": {
      "totalUsers": "Total Users",
      "activeEvents": "Active Events",
      "pendingRequests": "Pending Requests",
      "totalRevenue": "Total Revenue"
    },
    "charts": {
      "userActivity": "User Activity",
      "eventsTrend": "Events Trend"
    },
    "recentActivity": "Recent Activity"
  },
  "temporaryUsers": {
    "title": "Temporary Users",
    "subtitle": "Manage time-limited user accounts",
    "stats": {
      "total": "Total",
      "active": "Active",
      "pending": "Pending",
      "expired": "Expired"
    },
    "actions": {
      "createUser": "Create User",
      "importUsers": "Import Users",
      "bulkDelete": "Bulk Delete",
      "bulkExtend": "Bulk Extend",
      "export": "Export"
    },
    "table": {
      "name": "Name",
      "email": "Email",
      "expiresOn": "Expires On",
      "status": "Status",
      "actions": "Actions"
    }
  },
  "permanentUsers": {
    "title": "Permanent Users",
    "subtitle": "Manage permanent user accounts",
    "stats": {
      "total": "Total",
      "active": "Active",
      "inactive": "Inactive"
    },
    "actions": {
      "createUser": "Create User",
      "bulkActivate": "Bulk Activate",
      "bulkDeactivate": "Bulk Deactivate",
      "export": "Export"
    },
    "table": {
      "name": "Name",
      "email": "Email",
      "role": "Role",
      "status": "Status",
      "actions": "Actions"
    }
  },
  "accessRequests": {
    "title": "Access Requests",
    "subtitle": "Review and manage access requests",
    "stats": {
      "total": "Total",
      "accepted": "Accepted",
      "pending": "Pending",
      "rejected": "Rejected"
    },
    "filters": {
      "all": "All Requests",
      "pending": "Pending",
      "approved": "Approved",
      "rejected": "Rejected"
    },
    "actions": {
      "approve": "Approve",
      "reject": "Reject"
    }
  },
  "events": {
    "title": "Events",
    "subtitle": "Manage campus events and sessions",
    "stats": {
      "total": "Total Events",
      "happeningNow": "Happening Now",
      "upcoming": "Upcoming",
      "completed": "Completed"
    },
    "actions": {
      "createEvent": "Create Event"
    },
    "details": {
      "attendees": "Attendees",
      "sessions": "Sessions"
    }
  },
  "qrCodes": {
    "title": "QR Codes",
    "subtitle": "Generate and manage QR codes for event check-ins",
    "slideshow": {
      "title": "Slideshow Mode",
      "description": "Display multiple QR codes in rotation",
      "start": "Start Slideshow",
      "stop": "Stop Slideshow",
      "interval": "Interval (seconds)",
      "active": "Slideshow is active. QR codes will rotate every {interval} seconds."
    },
    "actions": {
      "generate": "Generate QR Code",
      "exportAll": "Export All",
      "download": "Download",
      "regenerate": "Regenerate"
    },
    "details": {
      "created": "Created",
      "totalScans": "Total Scans"
    }
  },
  "roleManagement": {
    "title": "Role Management",
    "subtitle": "Manage user roles and permissions (RBAC)",
    "actions": {
      "createRole": "Create Role",
      "createCustomRole": "Create Custom Role",
      "edit": "Edit",
      "assign": "Assign"
    },
    "permissions": {
      "title": "Permission Matrix",
      "description": "Overview of permissions across all roles"
    }
  },
  "routeGeneration": {
    "title": "Route Generation",
    "subtitle": "Generate navigation links and QR codes for wayfinding",
    "stats": {
      "totalRoutes": "Total Routes",
      "activePOIs": "Active POIs",
      "qrGenerated": "QR Codes Generated"
    },
    "generator": {
      "title": "Quick Route Generator",
      "description": "Generate a route between two points of interest",
      "startingPoint": "Starting Point",
      "destination": "Destination",
      "routeName": "Route Name",
      "type": "Type",
      "generate": "Generate"
    },
    "allRoutes": "All Routes",
    "poi": {
      "title": "Points of Interest (POI)",
      "description": "Manage waypoints and landmarks"
    }
  },
  "mapManagement": {
    "title": "Map Management",
    "subtitle": "Manage buildings, locations, and 3D models",
    "stats": {
      "buildings": "Buildings",
      "openSpaces": "Open Spaces",
      "models3D": "3D Models",
      "categories": "Categories"
    },
    "layers": {
      "title": "Map Layers Configuration",
      "description": "Configure visible layers and map settings"
    },
    "buildings": {
      "title": "Buildings & Locations",
      "description": "Manage campus buildings and their configurations",
      "floors": "floors"
    },
    "categories": {
      "title": "Location Categories",
      "description": "Manage and organize location categories"
    },
    "upload": {
      "title": "Upload 3D Building Model",
      "description": "Drag and drop or click to upload GLB, GLTF, or OBJ files",
      "selectFiles": "Select Files"
    },
    "actions": {
      "uploadModel": "Upload 3D Model",
      "addLocation": "Add Location",
      "addCategory": "Add New Category",
      "editDetails": "Edit Details",
      "uploadModelBtn": "Upload Model"
    }
  },
  "reservations": {
    "title": "Reservations",
    "subtitle": "Manage space reservations and approvals",
    "stats": {
      "total": "Total Reservations",
      "approved": "Approved",
      "pending": "Pending",
      "rejected": "Rejected"
    },
    "allReservations": "All Reservations",
    "description": "Review and manage space reservations",
    "details": {
      "reservedBy": "Reserved by",
      "purpose": "Purpose"
    },
    "actions": {
      "approve": "Approve",
      "reject": "Reject"
    }
  },
  "databaseBackup": {
    "title": "Database Backup",
    "subtitle": "Create and manage database backups",
    "stats": {
      "totalBackups": "Total Backups",
      "totalSize": "Total Size",
      "lastBackup": "Last Backup"
    },
    "schedule": {
      "title": "Automatic Backup Schedule",
      "description": "Configure automated backup settings",
      "daily": "Daily Backup",
      "time": "Every day at 9:30 AM",
      "active": "Active",
      "configure": "Configure Schedule",
      "runNow": "Run Now"
    },
    "history": {
      "title": "Backup History",
      "description": "View and manage existing backups"
    },
    "actions": {
      "createBackup": "Create Backup",
      "download": "Download",
      "restore": "Restore"
    },
    "types": {
      "manual": "Manual",
      "automatic": "Automatic"
    }
  },
  "campusManagement": {
    "title": "Campus Management",
    "subtitle": "Manage multiple campus locations and settings",
    "actions": {
      "addCampus": "Add Campus",
      "addNewCampus": "Add New Campus",
      "edit": "Edit",
      "viewDetails": "View Details"
    },
    "details": {
      "buildings": "Buildings",
      "totalArea": "Total Area"
    }
  },
  "common": {
    "search": "Search",
    "edit": "Edit",
    "delete": "Delete",
    "save": "Save",
    "cancel": "Cancel",
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "approved": "Approved",
    "rejected": "Rejected",
    "status": "Status",
    "actions": "Actions",
    "copyright": "© 2025 UM6P"
  }
}
