export default {
  "sidebar": {
    "dashboard": "Tableau de bord",
    "events": "Événements",
    "qrCodes": "Codes QR",
    "userManagement": "Gestion des utilisateurs",
    "temporaryUsers": "Utilisateurs temporaires",
    "permanentUsers": "Utilisateurs permanents",
    "accessRequests": "Demandes d'accès",
    "roleManagement": "Gestion des rôles",
    "operations": "Opérations",
    "routeGeneration": "Génération d'itinéraires",
    "mapManagement": "Gestion des cartes",
    "reservations": "Réservations",
    "system": "Système",
    "databaseBackup": "Sauvegarde de la base de données",
    "campusManagement": "Gestion du campus"
  },
  "header": {
    "search": "Rechercher",
    "switchToLight": "Passer en mode clair",
    "switchToDark": "Passer en mode sombre"
  },
  "dashboard": {
    "title": "Tableau de bord",
    "subtitle": "Aperçu de votre tableau de bord admin",
    "stats": {
      "totalUsers": "Total utilisateurs",
      "activeEvents": "Événements actifs",
      "pendingRequests": "Demandes en attente",
      "totalRevenue": "Revenu total"
    },
    "charts": {
      "userActivity": "Activité des utilisateurs",
      "eventsTrend": "Tendance des événements"
    },
    "recentActivity": "Activité récente"
  },
  "temporaryUsers": {
    "title": "Utilisateurs temporaires",
    "subtitle": "Gérer les comptes utilisateurs à durée limitée",
    "stats": {
      "total": "Total",
      "active": "Actifs",
      "pending": "En attente",
      "expired": "Expirés"
    },
    "actions": {
      "createUser": "Créer un utilisateur",
      "importUsers": "Importer des utilisateurs",
      "bulkDelete": "Supprimer en masse",
      "bulkExtend": "Prolonger en masse",
      "export": "Exporter"
    },
    "table": {
      "name": "Nom",
      "email": "E-mail",
      "expiresOn": "Expire le",
      "status": "Statut",
      "actions": "Actions"
    }
  },
  "permanentUsers": {
    "title": "Utilisateurs permanents",
    "subtitle": "Gérer les comptes utilisateurs permanents",
    "stats": {
      "total": "Total",
      "active": "Actifs",
      "inactive": "Inactifs"
    },
    "actions": {
      "createUser": "Créer un utilisateur",
      "bulkActivate": "Activer en masse",
      "bulkDeactivate": "Désactiver en masse",
      "export": "Exporter"
    },
    "table": {
      "name": "Nom",
      "email": "E-mail",
      "role": "Rôle",
      "status": "Statut",
      "actions": "Actions"
    }
  },
  "accessRequests": {
    "title": "Demandes d'accès",
    "subtitle": "Examiner et gérer les demandes d'accès",
    "stats": {
      "total": "Total",
      "accepted": "Acceptées",
      "pending": "En attente",
      "rejected": "Rejetées"
    },
    "filters": {
      "all": "Toutes les demandes",
      "pending": "En attente",
      "approved": "Approuvées",
      "rejected": "Rejetées"
    },
    "actions": {
      "approve": "Approuver",
      "reject": "Rejeter"
    }
  },
  "events": {
    "title": "Événements",
    "subtitle": "Gérer les événements et sessions du campus",
    "stats": {
      "total": "Total événements",
      "happeningNow": "En cours",
      "upcoming": "À venir",
      "completed": "Terminés"
    },
    "actions": {
      "createEvent": "Créer un événement"
    },
    "details": {
      "attendees": "Participants",
      "sessions": "Sessions"
    }
  },
  "qrCodes": {
    "title": "Codes QR",
    "subtitle": "Générer et gérer les codes QR pour les enregistrements d'événements",
    "slideshow": {
      "title": "Mode diaporama",
      "description": "Afficher plusieurs codes QR en rotation",
      "start": "Démarrer le diaporama",
      "stop": "Arrêter le diaporama",
      "interval": "Intervalle (secondes)",
      "active": "Le diaporama est actif. Les codes QR tourneront toutes les {interval} secondes."
    },
    "actions": {
      "generate": "Générer un code QR",
      "exportAll": "Tout exporter",
      "download": "Télécharger",
      "regenerate": "Régénérer"
    },
    "details": {
      "created": "Créé",
      "totalScans": "Total scans"
    }
  },
  "roleManagement": {
    "title": "Gestion des rôles",
    "subtitle": "Gérer les rôles et permissions des utilisateurs (RBAC)",
    "actions": {
      "createRole": "Créer un rôle",
      "createCustomRole": "Créer un rôle personnalisé",
      "edit": "Modifier",
      "assign": "Attribuer"
    },
    "permissions": {
      "title": "Matrice des permissions",
      "description": "Aperçu des permissions pour tous les rôles"
    }
  },
  "routeGeneration": {
    "title": "Génération d'itinéraires",
    "subtitle": "Générer des liens de navigation et codes QR pour l'orientation",
    "stats": {
      "totalRoutes": "Total itinéraires",
      "activePOIs": "POI actifs",
      "qrGenerated": "Codes QR générés"
    },
    "generator": {
      "title": "Générateur d'itinéraire rapide",
      "description": "Générer un itinéraire entre deux points d'intérêt",
      "startingPoint": "Point de départ",
      "destination": "Destination",
      "routeName": "Nom de l'itinéraire",
      "type": "Type",
      "generate": "Générer"
    },
    "allRoutes": "Tous les itinéraires",
    "poi": {
      "title": "Points d'intérêt (POI)",
      "description": "Gérer les points de repère et jalons"
    }
  },
  "mapManagement": {
    "title": "Gestion des cartes",
    "subtitle": "Gérer les bâtiments, emplacements et modèles 3D",
    "stats": {
      "buildings": "Bâtiments",
      "openSpaces": "Espaces ouverts",
      "models3D": "Modèles 3D",
      "categories": "Catégories"
    },
    "layers": {
      "title": "Configuration des couches de carte",
      "description": "Configurer les couches visibles et paramètres de carte"
    },
    "buildings": {
      "title": "Bâtiments et emplacements",
      "description": "Gérer les bâtiments du campus et leurs configurations",
      "floors": "étages"
    },
    "categories": {
      "title": "Catégories d'emplacement",
      "description": "Gérer et organiser les catégories d'emplacement"
    },
    "upload": {
      "title": "Télécharger un modèle 3D de bâtiment",
      "description": "Glisser-déposer ou cliquer pour télécharger des fichiers GLB, GLTF ou OBJ",
      "selectFiles": "Sélectionner des fichiers"
    },
    "actions": {
      "uploadModel": "Télécharger un modèle 3D",
      "addLocation": "Ajouter un emplacement",
      "addCategory": "Ajouter une nouvelle catégorie",
      "editDetails": "Modifier les détails",
      "uploadModelBtn": "Télécharger le modèle"
    }
  },
  "reservations": {
    "title": "Réservations",
    "subtitle": "Gérer les réservations d'espace et les approbations",
    "stats": {
      "total": "Total réservations",
      "approved": "Approuvées",
      "pending": "En attente",
      "rejected": "Rejetées"
    },
    "allReservations": "Toutes les réservations",
    "description": "Examiner et gérer les réservations d'espace",
    "details": {
      "reservedBy": "Réservé par",
      "purpose": "Objectif"
    },
    "actions": {
      "approve": "Approuver",
      "reject": "Rejeter"
    }
  },
  "databaseBackup": {
    "title": "Sauvegarde de la base de données",
    "subtitle": "Créer et gérer les sauvegardes de la base de données",
    "stats": {
      "totalBackups": "Total sauvegardes",
      "totalSize": "Taille totale",
      "lastBackup": "Dernière sauvegarde"
    },
    "schedule": {
      "title": "Planification de sauvegarde automatique",
      "description": "Configurer les paramètres de sauvegarde automatisée",
      "daily": "Sauvegarde quotidienne",
      "time": "Tous les jours à 9h30",
      "active": "Actif",
      "configure": "Configurer la planification",
      "runNow": "Exécuter maintenant"
    },
    "history": {
      "title": "Historique des sauvegardes",
      "description": "Voir et gérer les sauvegardes existantes"
    },
    "actions": {
      "createBackup": "Créer une sauvegarde",
      "download": "Télécharger",
      "restore": "Restaurer"
    },
    "types": {
      "manual": "Manuel",
      "automatic": "Automatique"
    }
  },
  "campusManagement": {
    "title": "Gestion du campus",
    "subtitle": "Gérer plusieurs emplacements de campus et paramètres",
    "actions": {
      "addCampus": "Ajouter un campus",
      "addNewCampus": "Ajouter un nouveau campus",
      "edit": "Modifier",
      "viewDetails": "Voir les détails"
    },
    "details": {
      "buildings": "Bâtiments",
      "totalArea": "Superficie totale"
    }
  },
  "common": {
    "search": "Rechercher",
    "edit": "Modifier",
    "delete": "Supprimer",
    "save": "Enregistrer",
    "cancel": "Annuler",
    "active": "Actif",
    "inactive": "Inactif",
    "pending": "En attente",
    "approved": "Approuvé",
    "rejected": "Rejeté",
    "status": "Statut",
    "actions": "Actions",
    "copyright": "© 2024 UM6P Admin"
  }
}
