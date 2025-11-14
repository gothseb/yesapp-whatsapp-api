# Tasks: API WhatsApp Auto-hébergeable

**Feature**: 001-whatsapp-api | **Created**: 2025-11-14 | **Status**: Ready

**References**: [spec.md](./spec.md) | [plan.md](./plan.md) | [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## Légende
- 🔴 P1 (MVP) | 🟡 P2 (Production) | 🟢 P3 (Polish)
- ⏱️ Estimation | 🔗 Dépendances
- Status: ⬜ Todo | 🔄 In Progress | ✅ Done

---

# PHASE 1: MVP CORE (3-4 jours) 🔴

## Infrastructure (4h)

### T1.1 - Setup Projet ⏱️ 2h
**Priority**: 🔴 P1 | **Dependencies**: Aucune
- Créer structure dossiers (backend, dashboard, docker, docs)
- Initialiser packages (npm init, install deps)
- Configurer ESLint, Prettier, .gitignore
- Créer entry points backend (index.js) et dashboard (App.jsx)

**Acceptance**: `npm run dev` démarre backend + dashboard

---

### T1.2 - Configuration Base ⏱️ 2h  
**Priority**: 🔴 P1 | **Dependencies**: T1.1
- Créer .env.example avec variables
- Setup Express (helmet, cors, json middleware)
- Routes /health et /ready
- Logger basique Winston
- Tests: curl health endpoint OK

---

## Database (6h)

### T1.3 - Schema & Migrations ⏱️ 2h
**Priority**: 🔴 P1 | **Dependencies**: T1.2
- Créer migrations/001_initial.sql (sessions, messages, webhook_logs, api_keys)
- Ajouter index (idx_messages_session, idx_sessions_status)
- Module db.js (connexion SQLite + auto-migration)

**Fichiers**: `database/migrations/001_initial.sql`, `database/db.js`

---

### T1.4 - Modèles Données ⏱️ 4h
**Priority**: 🔴 P1 | **Dependencies**: T1.3
- Session.model.js (create, findById, findAll, update, delete)
- Message.model.js (create, findBySession, updateStatus)
- APIKey.model.js (create, verify)
- Tests unitaires pour chaque modèle

**Fichiers**: `models/session.model.js`, `models/message.model.js`, `models/apikey.model.js`

---

## Auth & Security (4h)

### T1.5 - Middleware Auth ⏱️ 2h
**Priority**: 🔴 P1 | **Dependencies**: T1.4
- Extraire X-API-Key header
- Hash SHA256 + vérifier en DB
- Retourner 401 si invalide
- Attacher permissions à req.auth

**Fichier**: `middleware/auth.middleware.js`

---

### T1.6 - Génération API Key ⏱️ 1h
**Priority**: 🔴 P1 | **Dependencies**: T1.5
- Vérifier DB vide au démarrage
- Générer random key (32 bytes hex)
- Logger plaintext UNE fois: "🔑 API Key: abc123..."
- Hash + sauvegarder

**Fichier**: `utils/crypto.js`

---

### T1.7 - Validation Middleware ⏱️ 1h
**Priority**: 🔴 P1 | **Dependencies**: T1.2
- validatePhoneNumber (E.164 format)
- validateSessionId (UUID)
- validate(schema) generic
- Retourner 400 avec message clair

**Fichier**: `middleware/validation.middleware.js`

---

## Sessions WhatsApp (8h)

### T1.8 - Service WhatsApp ⏱️ 4h
**Priority**: 🔴 P1 | **Dependencies**: T1.4
- Map<sessionId, WhatsAppClient>
- initClient(sessionId) + setup events
- Event listeners: qr, authenticated, ready, disconnected
- Sauvegarder QR code en DB
- Update status automatiquement

**Fichier**: `services/whatsapp.service.js`

---

### T1.9 - Service Session ⏱️ 2h
**Priority**: 🔴 P1 | **Dependencies**: T1.8
- createSession(name) → DB + init WhatsApp
- getSession(id), listSessions()
- deleteSession(id) → cleanup + destroy client
- getQRCode(id)

**Fichier**: `services/session.service.js`

---

### T1.10 - Routes Sessions API ⏱️ 2h
**Priority**: 🔴 P1 | **Dependencies**: T1.9, T1.5
- POST /api/v1/sessions → create + return QR
- GET /api/v1/sessions → list all
- GET /api/v1/sessions/:id → details
- DELETE /api/v1/sessions/:id → delete
- GET /api/v1/sessions/:id/qr → get QR
- Protéger avec auth middleware

**Fichier**: `api/sessions.js`

**Test**: `curl -X POST http://localhost:3000/api/v1/sessions -H "X-API-Key: <key>"`

---

## Message Sending (6h)

### T1.11 - Service Messages ⏱️ 3h
**Priority**: 🔴 P1 | **Dependencies**: T1.8
- sendMessage(sessionId, to, text)
- Vérifier session active
- Sauvegarder DB (status=pending)
- client.sendMessage() WhatsApp
- Update status (sent/failed)
- Gestion erreurs

**Fichier**: `services/message.service.js`

---

### T1.12 - Rate Limiter ⏱️ 2h
**Priority**: 🔴 P1 | **Dependencies**: T1.2
- Limite: 50 msg/min par session
- Queue en mémoire (Map<sessionId, Queue>)
- Worker consomme queue
- Retourner 429 si dépassé

**Fichier**: `middleware/ratelimit.middleware.js`

---

### T1.13 - Routes Messages API ⏱️ 1h
**Priority**: 🔴 P1 | **Dependencies**: T1.11, T1.12, T1.7
- POST /api/v1/sessions/:id/messages → send
- Body: {to, text}
- Response: {messageId, status}
- Rate limit + validation

**Fichier**: `api/messages.js`

**Test**: Envoyer message → vérifier dans WhatsApp mobile

---

## Dashboard (6h)

### T1.14 - API Client ⏱️ 1h
**Priority**: 🔴 P1 | **Dependencies**: T1.1
- Axios instance + baseURL
- Interceptor API Key header
- Méthodes: getSessions, createSession, sendMessage

**Fichier**: `dashboard/src/api/client.js`

---

### T1.15 - Composant SessionList ⏱️ 2h
**Priority**: 🔴 P1 | **Dependencies**: T1.14
- Fetch sessions (polling 3s)
- Afficher: nom, statut, téléphone
- Badge: vert=connected, jaune=pending, rouge=disconnected
- Bouton "Créer Session"

**Fichier**: `dashboard/src/components/SessionList.jsx`

---

### T1.16 - Composant QRCodeDisplay ⏱️ 1h
**Priority**: 🔴 P1 | **Dependencies**: T1.14
- Afficher QR en base64
- Refresh 5s si pending
- Masquer si connected
- Instructions utilisateur

**Fichier**: `dashboard/src/components/QRCodeDisplay.jsx`

---

### T1.17 - Composant SendMessage ⏱️ 2h
**Priority**: 🔴 P1 | **Dependencies**: T1.14
- Form: input téléphone + textarea message
- Validation E.164
- Bouton "Envoyer"
- Toast notification succès/erreur

**Fichier**: `dashboard/src/components/SendMessage.jsx`

---

### T1.18 - Assembler Dashboard ⏱️ 30min
**Priority**: 🔴 P1 | **Dependencies**: T1.15, T1.16, T1.17
- Layout: header + grid (SessionList | QRCode + SendMessage)
- Styling Tailwind responsive
- Intégrer tous composants dans App.jsx

---

## Docker (4h)

### T1.19 - Dockerfile Multi-stage ⏱️ 2h
**Priority**: 🔴 P1 | **Dependencies**: T1.1
- Stage 1: build frontend
- Stage 2: install backend deps
- Stage 3: Node Alpine + Chromium
- Copier frontend build → backend/public
- Health check

**Fichier**: `docker/Dockerfile`

---

### T1.20 - docker-compose.yml ⏱️ 1h
**Priority**: 🔴 P1 | **Dependencies**: T1.19
- Service yesapp-api
- Port 3000:3000
- Variables env (API_KEY, DATABASE_PATH, etc.)
- Volume ./data:/app/data
- Restart policy + health check

**Fichier**: `docker/docker-compose.yml`

---

### T1.21 - Test Déploiement Docker ⏱️ 1h
**Priority**: 🔴 P1 | **Dependencies**: T1.20
1. `docker-compose up --build`
2. Vérifier health check OK
3. Créer session + scanner QR
4. Envoyer message
5. Restart + vérifier persistance

**Acceptance**: SC-001 validé (déploiement < 5 min) ✅

---

## Documentation (2h)

### T1.22 - README.md ⏱️ 1h
**Priority**: 🔴 P1 | **Dependencies**: T1.21
- Quick start (docker-compose up)
- Récupérer API Key
- Exemples curl
- Troubleshooting

**Fichier**: `README.md`

---

### T1.23 - Test Fresh Install ⏱️ 1h
**Priority**: 🔴 P1 | **Dependencies**: T1.22
- Clone sur machine vierge
- Suivre README étape par étape
- Chronométrer
- Noter blocages

**Acceptance**: Temps < 5 min ✅

---

# PHASE 2: WEBHOOKS (2-3 jours) 🟡

## Message Reception (4h)

### T2.1 - Event Listener Messages Reçus ⏱️ 2h
**Priority**: 🟡 P2 | **Dependencies**: T1.8
- Event `message` listener
- Sauvegarder DB (direction=inbound)
- Télécharger médias si présent

**Fichier**: `services/whatsapp.service.js`

---

### T2.2 - Route GET Messages ⏱️ 2h
**Priority**: 🟡 P2 | **Dependencies**: T2.1
- GET /api/v1/sessions/:id/messages?limit=50&offset=0&direction=all
- Pagination + filtres
- Retourner {messages, total, limit, offset}

---

## Webhook Service (6h)

### T2.3 - Service Webhook ⏱️ 3h
**Priority**: 🟡 P2 | **Dependencies**: T2.1
- sendWebhook(sessionId, messageData) → POST HTTP
- Retry: 0s, 1s, 2s (3 tentatives)
- Log webhook_logs
- Timeout 5s

**Payload**: {event, sessionId, messageId, from, text, timestamp, mediaUrl}

**Acceptance**: SC-003 validé (< 2s) ✅

---

### T2.4 - Intégrer Webhooks ⏱️ 1h
**Priority**: 🟡 P2 | **Dependencies**: T2.3
- Appeler webhook après message reçu
- Async (non-blocking)
- Vérifier webhook_url configurée

---

### T2.5 - Routes Webhook Config ⏱️ 2h
**Priority**: 🟡 P2 | **Dependencies**: T2.3
- PUT /api/v1/sessions/:id/webhook → configure URL
- DELETE /api/v1/sessions/:id/webhook → remove
- Validation URL

---

## Dashboard Updates (4h)

### T2.6 - Composant MessageLog ⏱️ 2h
**Priority**: 🟡 P2 | **Dependencies**: T2.2
- Fetch messages (polling 3s)
- Afficher: direction, from, to, text, timestamp
- Scroll auto vers dernier
- Filtres: inbound/outbound/all

**Fichier**: `dashboard/src/components/MessageLog.jsx`

---

### T2.7 - Composant WebhookConfig ⏱️ 2h
**Priority**: 🟡 P2 | **Dependencies**: T2.5
- Input URL webhook
- Boutons: Sauvegarder / Supprimer
- Afficher derniers logs webhook (success/failed)

**Fichier**: `dashboard/src/components/WebhookConfig.jsx`

---

## Tests E2E (2h)

### T2.8 - Tests Webhooks ⏱️ 2h
**Priority**: 🟡 P2 | **Dependencies**: T2.7
1. Configurer webhook (webhook.site)
2. Envoyer message au numéro
3. Vérifier webhook reçu + payload
4. Tester retry (URL invalide)
5. Vérifier logs

**Acceptance**: SC-003 validé (99% < 2s) ✅

---

# PHASE 3: MULTI-SESSION & MEDIAS (2-3 jours) 🟡

## Multi-Session (4h)

### T3.1 - Optimisation Mémoire ⏱️ 2h
**Priority**: 🟡 P2 | **Dependencies**: T1.8
- Gestion mémoire multiples clients
- Lazy loading clients
- Auto-disconnect après 24h inactivité

---

### T3.2 - Tests Charge ⏱️ 2h
**Priority**: 🟡 P2 | **Dependencies**: T3.1
- Créer 10 sessions simultanées
- Envoyer 100 msg/min par session
- Mesurer RAM, CPU
- Vérifier isolation complète

**Acceptance**: SC-005 validé (10 sessions OK) ✅

---

## Support Médias (6h)

### T3.3 - Upload Médias ⏱️ 3h
**Priority**: 🟡 P2 | **Dependencies**: T1.13
- Multer middleware (multipart/form-data)
- Validation taille (16MB max)
- Support: image, video, document, audio
- Storage local /app/data/media
- POST /messages avec media: {type, data, caption}

---

### T3.4 - Download Médias Reçus ⏱️ 2h
**Priority**: 🟡 P2 | **Dependencies**: T2.1
- Télécharger média automatiquement
- Sauvegarder /app/data/media/{messageId}.{ext}
- Retourner URL dans webhook
- Route: GET /api/v1/media/:messageId

---

### T3.5 - Tests Médias ⏱️ 1h
**Priority**: 🟡 P2 | **Dependencies**: T3.4
- Envoyer image, PDF, vidéo
- Vérifier réception WhatsApp
- Tester fichier > 16MB (erreur 413)

---

## Dashboard Avancé (4h)

### T3.6 - Galerie Médias ⏱️ 2h
**Priority**: 🟢 P3 | **Dependencies**: T3.4
- Preview images/vidéos dans MessageLog
- Download button pour documents
- Lightbox pour images

---

### T3.7 - Statistiques ⏱️ 2h
**Priority**: 🟢 P3 | **Dependencies**: T2.6
- Endpoint: GET /api/v1/stats
- Afficher: total sessions, messages sent/received 24h, uptime
- Charts (optionnel)

**Fichier**: `dashboard/src/components/StatsPanel.jsx`

---

# PHASE 4: DOCUMENTATION & MONITORING (2-3 jours) 🟢

## Swagger (4h)

### T4.1 - Setup Swagger UI ⏱️ 2h
**Priority**: 🟢 P3 | **Dependencies**: T1.2
- swagger-jsdoc + swagger-ui-express
- Route: GET /api/docs
- Configuration OpenAPI 3.0

---

### T4.2 - Annotations Endpoints ⏱️ 2h
**Priority**: 🟢 P3 | **Dependencies**: T4.1
- Annoter tous endpoints (sessions, messages, webhooks)
- Exemples requêtes/réponses
- Schémas de données

**Acceptance**: SC-006 validé (premier appel < 10 min) ✅

---

## Observabilité (4h)

### T4.3 - Logger Structuré ⏱️ 2h
**Priority**: 🟢 P3 | **Dependencies**: T1.2
- Winston JSON format
- Niveaux: DEBUG, INFO, WARN, ERROR
- Transports: console + file (/app/data/logs)

**Acceptance**: SC-010 validé (diagnostic 95%) ✅

---

### T4.4 - Dashboard Logs ⏱️ 2h
**Priority**: 🟢 P3 | **Dependencies**: T4.3
- Endpoint: GET /api/v1/logs?level=error&limit=100
- Composant: afficher logs + filtres niveau
- Refresh temps réel

---

## Documentation (3h)

### T4.5 - API_REFERENCE.md ⏱️ 1h
**Priority**: 🟢 P3 | **Dependencies**: T4.2
- Documenter tous endpoints
- Exemples curl complets
- Codes erreur

---

### T4.6 - DEPLOYMENT.md ⏱️ 1h
**Priority**: 🟢 P3 | **Dependencies**: T1.21
- Guide production (reverse proxy, HTTPS)
- Backup strategy
- Scaling tips

---

### T4.7 - ARCHITECTURE.md Update ⏱️ 1h
**Priority**: 🟢 P3 | **Dependencies**: T4.6
- Finaliser documentation architecture
- Diagrammes à jour
- Limitations connues

---

## Tests (3h)

### T4.8 - Tests Unitaires ⏱️ 2h
**Priority**: 🟢 P3 | **Dependencies**: T1.4
- Tests modèles (Session, Message, APIKey)
- Tests services (WhatsApp, Session, Message)
- Coverage > 70%

---

### T4.9 - Tests E2E Complets ⏱️ 1h
**Priority**: 🟢 P3 | **Dependencies**: T4.8
- Scénario complet: déploiement → connexion → envoi → réception
- Vérifier tous SC validés (SC-001 à SC-010)
- Documentation résultats

**Acceptance**: Tous SC validés ✅✅✅

---

# RÉSUMÉ

## Temps Total Estimé
- Phase 1 (MVP): 40h → 3-4 jours
- Phase 2 (Webhooks): 16h → 2 jours
- Phase 3 (Médias): 14h → 2 jours
- Phase 4 (Docs): 14h → 2 jours
**TOTAL**: 84h → 9-13 jours

## Critères de Succès
- ✅ SC-001: Déploiement < 5 min (T1.21, T1.23)
- ✅ SC-002: 100 msg/min (T1.12)
- ✅ SC-003: Webhooks < 2s (T2.3, T2.8)
- ✅ SC-004: Reconnexion < 30s (T1.8)
- ✅ SC-005: 10 sessions (T3.2)
- ✅ SC-006: Premier appel < 10 min (T4.2)
- ✅ SC-007: Persistance 100% (T1.21)
- ✅ SC-008: Intégration < 30 min (T4.2)
- ✅ SC-009: Dashboard < 3s (T1.15)
- ✅ SC-010: Diagnostic 95% (T4.3)

## Dépendances Critiques
- T1.4 (Modèles) → bloque T1.5-T1.10
- T1.8 (Service WhatsApp) → bloque T1.9-T1.11
- T1.21 (Docker OK) → livrable Phase 1
- T2.3 (Webhooks) → livrable Phase 2

**Ready to Start Implementation!** 🚀
