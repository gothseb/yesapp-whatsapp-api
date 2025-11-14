# YesApp WhatsApp API Constitution

## Core Principles

### I. API-First Architecture
L'API REST est le cœur du système. Tous les composants (dashboard, intégrations externes) consomment l'API.
- Endpoints RESTful suivant les conventions HTTP standards (GET, POST, PUT, DELETE)
- Documentation OpenAPI/Swagger obligatoire et toujours à jour
- Versioning de l'API (v1, v2) pour garantir la rétrocompatibilité
- Réponses JSON structurées avec codes HTTP appropriés
- Rate limiting et pagination pour tous les endpoints de liste

### II. Multi-Session & Isolation
Support natif de multiples sessions WhatsApp sur un seul serveur.
- Chaque session WhatsApp est isolée et identifiée par un ID unique
- Gestion indépendante des connexions, authentifications et états
- Pas d'interférence entre sessions (messages, contacts, médias)
- API CRUD complète pour gérer le cycle de vie des sessions (create, start, stop, delete)
- Persistance des sessions pour survivre aux redémarrages

### III. Container-First Deployment
Docker est la méthode de déploiement principale et privilégiée.
- Une seule image Docker contenant tous les composants (API, Dashboard, Dependencies)
- Configuration via variables d'environnement (12-factor app)
- Volumes Docker pour la persistance (sessions, médias, logs)
- Support docker-compose pour déploiement simplifié
- Image optimisée (multi-stage build, taille minimale)
- Health checks intégrés pour orchestration

### IV. Sécurité & Authentication
La sécurité est non-négociable pour une application WhatsApp auto-hébergée.
- Authentication requise pour tous les endpoints (API Keys, JWT, ou OAuth2)
- HTTPS obligatoire en production (TLS/SSL)
- Validation et sanitization de toutes les entrées
- Protection contre les attaques courantes (injection, XSS, CSRF)
- Secrets jamais hardcodés (variables d'environnement, secrets management)
- Audit logs pour les opérations sensibles

### V. Observabilité & Monitoring
Visibilité complète sur l'état du système et des sessions WhatsApp.
- Logging structuré (JSON) avec niveaux appropriés (DEBUG, INFO, WARN, ERROR)
- Métriques exposées (nombre de sessions, messages envoyés/reçus, erreurs)
- Dashboard temps réel montrant l'état de chaque session
- Endpoints de santé (/health, /ready) pour monitoring externe
- Traces des erreurs WhatsApp et reconnexions automatiques
- Alertes sur événements critiques (déconnexion, échecs répétés)

### VI. Gestion d'État Robuste
Les sessions WhatsApp doivent être fiables et résilientes.
- Sauvegarde automatique de l'état d'authentification (QR code, credentials)
- Reconnexion automatique en cas de déconnexion
- Gestion des timeouts et retry avec backoff exponentiel
- Synchronisation des messages et contacts
- Nettoyage des sessions expirées ou invalides
- Support de la restauration après crash

### VII. Developer Experience
L'API doit être facile à utiliser et à tester.
- Documentation Swagger UI interactive accessible via navigateur
- Exemples de code pour langages populaires (curl, JavaScript, Python)
- Webhooks pour notifications asynchrones (messages reçus, changements d'état)
- Environnement de test/sandbox si possible
- Messages d'erreur clairs et actionnables
- Logs détaillés en mode debug

## Architecture & Stack Technique

### Technologies Principales
- **Backend**: Node.js avec Express.js ou NestJS pour structure modulaire
- **WhatsApp Library**: whatsapp-web.js ou baileys (libraries populaires)
- **Base de données**: PostgreSQL ou SQLite pour persistance
- **Container**: Docker + Docker Compose
- **Documentation**: Swagger/OpenAPI 3.0
- **Frontend Dashboard**: React ou Vue.js avec UI moderne

### Structure du Projet
```
yesapp/
├── src/
│   ├── api/          # Routes et contrôleurs REST
│   ├── services/     # Logique métier (WhatsApp, sessions)
│   ├── models/       # Modèles de données
│   ├── middleware/   # Auth, validation, logging
│   ├── dashboard/    # Interface web
│   └── config/       # Configuration
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
├── docs/             # Documentation additionnelle
├── tests/            # Tests unitaires et intégration
└── data/             # Volume pour persistance
```

### Contraintes Techniques
- Support des webhooks pour notifications temps réel
- Gestion des médias (images, vidéos, documents)
- Rate limiting pour éviter le ban WhatsApp
- Queue system pour messages en masse (optionnel mais recommandé)
- Support multi-plateforme (Linux, macOS, Windows via Docker)

## Standards de Qualité

### Testing
- Tests unitaires pour la logique métier critique
- Tests d'intégration pour les endpoints API
- Tests E2E pour les flows principaux (créer session, envoyer message)
- Couverture de code minimale: 70%
- CI/CD pour exécution automatique des tests

### Code Quality
- Linting avec ESLint (JavaScript/TypeScript)
- Formatage automatique avec Prettier
- TypeScript recommandé pour type safety
- Code review obligatoire avant merge
- Pas de code commenté ou de TODOs en production

### Documentation
- README.md complet avec quickstart
- ARCHITECTURE.md expliquant les choix techniques
- API_REFERENCE.md généré depuis OpenAPI
- DEPLOYMENT.md pour instructions Docker
- Commentaires dans le code pour logique complexe uniquement

## Governance

### Principes de Gouvernance
- Cette constitution définit les règles non-négociables du projet
- Toute modification de l'architecture doit être justifiée et documentée
- Les pull requests doivent respecter tous les principes énoncés
- En cas de conflit, la sécurité et la stabilité priment sur les fonctionnalités

### Processus de Décision
- Les changements breaking de l'API nécessitent un versioning
- Les nouvelles dépendances doivent être validées (licence, maintenance)
- Les modifications de la structure Docker doivent être testées
- Performance et sécurité sont des critères de validation systématiques

### Évolution
- Révision trimestrielle de la constitution
- Feedback utilisateurs intégré dans la roadmap
- Veille technologique sur les libraries WhatsApp (mises à jour, alternatives)
- Migration progressive si changement de stack majeur

**Version**: 1.0.0 | **Ratified**: 2025-11-14 | **Last Amended**: 2025-11-14
