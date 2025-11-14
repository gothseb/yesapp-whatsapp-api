# Plan d'Implémentation: API WhatsApp Auto-hébergeable

**Feature**: 001-whatsapp-api  
**Created**: 2025-11-14  
**Status**: Ready for Implementation

---

## Stack Technologique (Optimisé Simplicité)

### Choix & Justifications

**Backend**: Node.js 20 LTS + Express.js 4.x
- ✅ Simplicité maximale pour API REST
- ✅ Parfait pour I/O intensif (messaging)

**WhatsApp**: whatsapp-web.js 1.23+
- ✅ Library la plus stable
- ✅ QR code + reconnexion auto intégrés

**Database**: SQLite 3 (better-sqlite3)
- ✅ ZÉRO config (pas de serveur DB)
- ✅ Fichier unique facile à backup

**Dashboard**: React 18 + Vite + TailwindCSS
- ✅ Setup ultra-rapide
- ✅ UI moderne sans CSS custom

**Documentation**: Swagger UI Express + OpenAPI 3.0

**Auth**: API Key simple (suffisant pour auto-hébergement)

---

## Architecture

```
┌─── DOCKER CONTAINER ───────────────────────────┐
│                                                 │
│  Dashboard (React) ←→ Express API ←→ WhatsApp  │
│         ↓                   ↓            ↓      │
│      Port 3000          SQLite      Sessions   │
│                                                 │
└─────────────────────────────────────────────────┘
                    ↓
            Docker Volumes
         (db, sessions, media)
```

---

## Structure Projet

```
yesapp/
├── docker/
│   ├── Dockerfile              # Multi-stage build
│   └── docker-compose.yml
│
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── config/            # env, database
│   │   ├── api/               # routes (sessions, messages, health)
│   │   ├── services/          # whatsapp, session, message, webhook
│   │   ├── models/            # session, message, webhook
│   │   ├── middleware/        # auth, validation, ratelimit, error
│   │   ├── database/          # migrations SQL
│   │   └── utils/             # logger, phone, crypto
│   └── package.json
│
├── dashboard/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/        # SessionList, QRCode, MessageLog
│   │   └── api/client.js
│   └── package.json
│
├── data/                      # Volume Docker
│   ├── db.sqlite
│   ├── sessions/
│   └── media/
│
└── docs/
    ├── README.md
    ├── API_REFERENCE.md
    └── DEPLOYMENT.md
```

---

## Base de Données SQLite

```sql
-- Sessions
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL,          -- pending|connected|disconnected
    phone_number TEXT,
    qr_code TEXT,
    webhook_url TEXT,
    created_at INTEGER NOT NULL,
    last_activity INTEGER NOT NULL
);

-- Messages
CREATE TABLE messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    direction TEXT NOT NULL,        -- inbound|outbound
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,
    content TEXT,
    media_type TEXT,
    status TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Webhook Logs
CREATE TABLE webhook_logs (
    id INTEGER PRIMARY KEY,
    session_id TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    status_code INTEGER,
    attempts INTEGER DEFAULT 1,
    success INTEGER DEFAULT 0,
    timestamp INTEGER NOT NULL
);

-- API Keys
CREATE TABLE api_keys (
    key_hash TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    permissions TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
```

---

## API Endpoints

**Base**: `http://localhost:3000/api/v1`
**Auth**: Header `X-API-Key: <key>`

### Sessions
- `POST /sessions` - Créer session → `{id, qrCode}`
- `GET /sessions` - Liste sessions
- `GET /sessions/{id}` - Détails session
- `DELETE /sessions/{id}` - Supprimer
- `GET /sessions/{id}/qr` - Obtenir QR code

### Messages
- `POST /sessions/{id}/messages` - Envoyer message
  ```json
  {
    "to": "+33612345678",
    "text": "Hello",
    "media": { "type": "image", "data": "base64..." }
  }
  ```
- `GET /sessions/{id}/messages?limit=50` - Liste messages

### Webhooks
- `PUT /sessions/{id}/webhook` - Configurer → `{"url": "..."}`
- `DELETE /sessions/{id}/webhook` - Supprimer

### Monitoring
- `GET /health` - Health check
- `GET /ready` - Readiness
- `GET /api/v1/stats` - Statistiques
- `GET /api/docs` - Swagger UI

---

## Docker Configuration

### Dockerfile (Multi-stage)
```dockerfile
FROM node:20-alpine AS frontend-build
WORKDIR /app/dashboard
COPY dashboard/package*.json ./
RUN npm ci
COPY dashboard/ ./
RUN npm run build

FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --production

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY backend/ ./
COPY --from=frontend-build /app/dashboard/dist ./public
RUN mkdir -p /app/data/sessions /app/data/media
EXPOSE 3000
CMD ["node", "src/index.js"]
```

### docker-compose.yml
```yaml
version: '3.8'
services:
  yesapp-whatsapp-api:
    build:
      context: .
      dockerfile: docker/Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - API_KEY=${API_KEY:-}
      - DATABASE_PATH=/app/data/db.sqlite
      - RATE_LIMIT_MESSAGES=50
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

---

## Plan Développement (4 Phases)

### Phase 1: MVP Core (P1) - 3-4 jours ⭐
**Objectif**: Déploiement + Connexion WhatsApp + Envoi messages

**Tâches**:
1. Setup projet (Express + SQLite + React)
2. Database & migrations
3. Auth middleware (API Key)
4. Session management (CRUD)
5. Intégration whatsapp-web.js + QR code
6. POST /messages (texte uniquement)
7. Rate limiting (50/min)
8. Dashboard MVP (liste sessions + QR + envoi)
9. Docker multi-stage
10. README.md

**Livrables**:
- ✅ `docker-compose up` fonctionne
- ✅ Connexion WhatsApp OK
- ✅ Envoi messages texte via API
- ✅ Dashboard basique

---

### Phase 2: Réception & Webhooks (P2) - 2-3 jours
**Objectif**: Communication bidirectionnelle

**Tâches**:
1. Event listener messages reçus
2. Sauvegarde messages DB
3. GET /messages (pagination)
4. Service webhooks + retry (3x backoff)
5. Logging webhooks
6. Dashboard: log messages + config webhook

**Livrables**:
- ✅ Réception messages
- ✅ Webhooks avec retry
- ✅ Tests E2E

---

### Phase 3: Multi-Session & Médias (P2-P3) - 2-3 jours
**Objectif**: Fonctionnalités avancées

**Tâches**:
1. Optimisation multi-sessions
2. Upload médias (base64 + multipart)
3. Validation 16MB max
4. Storage local médias
5. Download médias reçus
6. Dashboard: galerie médias + stats

**Livrables**:
- ✅ 10+ sessions simultanées
- ✅ Support images/videos/docs

---

### Phase 4: Documentation & Monitoring (P3) - 2-3 jours
**Objectif**: Production-ready

**Tâches**:
1. Swagger UI + annotations OpenAPI
2. Logger JSON structuré (Winston)
3. Dashboard logs avec filtres
4. Documentation complète (README, API_REFERENCE, DEPLOYMENT)
5. Tests unitaires + intégration (70% coverage)

**Livrables**:
- ✅ Swagger complet
- ✅ Observabilité
- ✅ Docs exhaustive

---

## Variables d'Environnement

```bash
NODE_ENV=production
PORT=3000
API_KEY=                        # Auto-généré si vide
DATABASE_PATH=/app/data/db.sqlite
SESSIONS_PATH=/app/data/sessions
MEDIA_PATH=/app/data/media
RATE_LIMIT_MESSAGES=50          # msg/min/session
WEBHOOK_TIMEOUT=5000
WEBHOOK_RETRIES=3
LOG_LEVEL=info
SESSION_INACTIVE_DAYS=30
```

---

## Dépendances NPM

**Backend**:
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "whatsapp-web.js": "^1.23.0",
    "better-sqlite3": "^9.2.0",
    "qrcode": "^1.5.3",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "cors": "^2.8.5",
    "winston": "^3.11.0",
    "uuid": "^9.0.1",
    "multer": "^1.4.5-lts.1",
    "swagger-ui-express": "^5.0.0"
  }
}
```

**Dashboard**:
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.10",
    "tailwindcss": "^3.4.1"
  }
}
```

---

## Quick Start

```bash
# 1. Cloner
git clone <repo>
cd yesapp

# 2. Démarrer
docker-compose up --build

# 3. Accéder
# Dashboard: http://localhost:3000
# Swagger: http://localhost:3000/api/docs

# 4. Récupérer API Key (logs)
docker-compose logs | grep "API Key"

# 5. Tester
curl -H "X-API-Key: <key>" http://localhost:3000/api/v1/sessions
```

---

## Critères de Succès (Spec)

- [ ] Déploiement < 5 min (SC-001)
- [ ] 100 msg/min sans erreur (SC-002)
- [ ] Webhooks < 2s (99%) (SC-003)
- [ ] Reconnexion auto < 30s (95%) (SC-004)
- [ ] 10 sessions simultanées (SC-005)
- [ ] Premier appel API < 10 min (SC-006)
- [ ] Persistance 100% (SC-007)
- [ ] Intégration < 30 min (90%) (SC-008)
- [ ] Dashboard status < 3s (SC-009)
- [ ] Logs diagnostic 95% (SC-010)

---

## Risques & Mitigations

**Risque**: Changement WhatsApp Protocol
- **Mitigation**: whatsapp-web.js (communauté active), version pinning, monitoring

**Risque**: Ban WhatsApp
- **Mitigation**: Rate limiting strict (50/min), délais aléatoires, warnings docs

**Risque**: Performance multi-sessions
- **Mitigation**: SQLite optimisé, tests charge Phase 1, scaling horizontal si >20

---

## Estimation Totale

- **Durée**: 9-13 jours
- **LOC**: ~5000-6000
- **Image Docker**: ~500MB
- **RAM**: 100MB par session (~1.5GB pour 10 sessions)
