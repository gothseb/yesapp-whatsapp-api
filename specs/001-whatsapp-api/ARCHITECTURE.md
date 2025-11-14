# Architecture Détaillée: YesApp WhatsApp API

**Version**: 1.0  
**Date**: 2025-11-14

---

## Vue d'Ensemble

YesApp est une API REST auto-hébergeable permettant d'envoyer et recevoir des messages WhatsApp. L'architecture privilégie la simplicité et le déploiement facile via Docker.

---

## Principes Architecturaux

### 1. Single Container Architecture
Tout tourne dans un seul conteneur Docker pour simplifier le déploiement.

### 2. Stateless API + Stateful Storage
- API Express = stateless (scalable horizontalement si besoin)
- État WhatsApp = stocké dans volumes Docker persistants

### 3. Synchronous + Asynchronous
- API endpoints = synchrones (request/response)
- Webhooks = asynchrones (fire-and-forget avec retry)

---

## Composants Principaux

### 1. Express REST API
**Responsabilité**: Point d'entrée HTTP pour toutes les opérations

**Technologies**:
- Express.js 4.x
- Helmet (sécurité headers)
- CORS (cross-origin)
- Express-rate-limit (throttling)

**Middlewares Chain**:
```
Request → CORS → Helmet → Auth → Validation → Rate Limit → Route Handler → Error Handler → Response
```

### 2. WhatsApp Service Layer
**Responsabilité**: Gestion des clients WhatsApp Web

**Implémentation**:
- whatsapp-web.js (puppeteer-based)
- 1 client WhatsApp par session
- Map<sessionId, WhatsAppClient> en mémoire
- Reconnexion automatique via events

**Cycle de Vie Session**:
```
Create → Init Client → Generate QR → 
Scan → Authenticated → Ready → 
(Disconnect?) → Auto Reconnect
```

### 3. Database Layer (SQLite)
**Responsabilité**: Persistance données structurées

**Choix SQLite**:
- Fichier unique = backup simple
- Transactions ACID
- Performance suffisante (<100k messages)
- Pas de serveur = déploiement simplifié

**Migrations**:
- Gérées via scripts SQL numérotés
- Exécution au démarrage si besoin
- Idempotentes

### 4. Message Queue (In-Memory)
**Responsabilité**: Rate limiting + ordering

**Implémentation**:
- Queue simple par session (Array FIFO)
- Worker qui consomme à rate configurable
- Backpressure si queue > 1000 messages

### 5. Webhook Service
**Responsabilité**: Notification événements externes

**Retry Strategy**:
```
Tentative 1: immédiat
Tentative 2: +1s (backoff)
Tentative 3: +2s (backoff)
Échec final: log + abandon
```

### 6. React Dashboard
**Responsabilité**: Interface utilisateur web

**Features**:
- Création sessions
- Display QR codes (polling status)
- Liste messages
- Configuration webhooks
- Logs système

---

## Flux de Données Détaillés

### Flux 1: Créer Session
```
User → POST /api/v1/sessions {name}
  ↓
API: Valide Auth
  ↓
Service: Génère UUID
  ↓
DB: INSERT session (status=pending)
  ↓
WhatsApp: Init client + QR listener
  ↓
QR Ready: UPDATE session SET qr_code=...
  ↓
Response: {id, qrCode, status}
  ↓
Dashboard: Affiche QR (polling /sessions/{id})
  ↓
User: Scan QR mobile
  ↓
Event: authenticated
  ↓
DB: UPDATE session SET status=connected, phone_number=...
  ↓
Dashboard: Status change (polling détecte)
```

### Flux 2: Envoyer Message
```
User → POST /api/v1/sessions/{id}/messages {to, text}
  ↓
Middleware: Valide API Key
  ↓
Middleware: Valide phone format (E.164)
  ↓
Middleware: Rate limit check (50/min)
  ↓
Service: Session active?
  ↓ Yes
DB: INSERT message (status=pending)
  ↓
Queue: Enqueue message
  ↓
Response: {messageId, status=pending}
  ↓
Worker: Dequeue when slot available
  ↓
WhatsApp Client: sendMessage(to, text)
  ↓ Success
DB: UPDATE message SET status=sent
  ↓
(Later) WhatsApp Event: message_ack
  ↓
DB: UPDATE message SET status=delivered/read
```

### Flux 3: Recevoir Message
```
WhatsApp: Incoming message event
  ↓
Listener: Capture event
  ↓
DB: INSERT message (direction=inbound, status=received)
  ↓
Webhook Service: Session has webhook_url?
  ↓ Yes
HTTP POST: webhook_url
  Body: {
    messageId, from, text, timestamp, 
    sessionId, type
  }
  ↓ Success (200-299)
DB: INSERT webhook_log (success=1)
  ↓ Failure
Retry: Exponential backoff (3x)
  ↓ Final failure
DB: INSERT webhook_log (success=0, error=...)
Log: ERROR webhook failed after 3 attempts
```

---

## Stratégies de Persistance

### Sessions WhatsApp
**Stockage**: Filesystem `/app/data/sessions/{sessionId}/`
- `.wwebjs_auth/` (credentials WhatsApp)
- `.wwebjs_cache/` (cache local)

**Backup**: Copier ce dossier = restaurer session

### Messages & Metadata
**Stockage**: SQLite `/app/data/db.sqlite`
- Indexé par session_id, timestamp
- Cleanup messages > 90 jours (configurable)

### Médias
**Stockage**: Filesystem `/app/data/media/{messageId}.{ext}`
- URL publique: `/api/v1/media/{messageId}`
- Cleanup médias > 90 jours

---

## Sécurité

### Authentification
```
Header: X-API-Key: sha256_hash
  ↓
Middleware: Hash incoming key
  ↓
DB: SELECT FROM api_keys WHERE key_hash=?
  ↓ Found
Continue
  ↓ Not found
401 Unauthorized
```

### Génération API Key
```
Startup: DB vide?
  ↓ Yes
Generate: crypto.randomBytes(32).toString('hex')
Hash: SHA256(key)
DB: INSERT api_keys (key_hash, name=default)
Log: "🔑 API Key: <plaintext>" (1 fois seulement)
  ↓
User: Copier key → .env ou config
```

### Protection Endpoints
- Helmet: CSP, HSTS, X-Frame-Options
- CORS: Whitelist origins (default: localhost)
- Rate limiting: Global 100 req/min + endpoint-specific

---

## Scalabilité

### Scaling Vertical (Phase 1)
- 1 conteneur = 10-20 sessions confortablement
- Limité par RAM (100MB/session) et CPU (puppeteer)

### Scaling Horizontal (Future)
Si >20 sessions nécessaires:
```
┌─── Load Balancer (nginx) ───┐
│                              │
├─► Container 1 (sessions 1-10)
├─► Container 2 (sessions 11-20)
└─► Container 3 (sessions 21-30)
```

**Contraintes**:
- Sessions = sticky (session affinity requise)
- SQLite → PostgreSQL (shared DB)
- Filesystem → S3/NFS (shared storage)

---

## Monitoring & Observabilité

### Logs Structurés (JSON)
```json
{
  "timestamp": "2025-11-14T16:00:00.000Z",
  "level": "info",
  "message": "Message sent successfully",
  "sessionId": "uuid",
  "messageId": "uuid",
  "to": "+33612345678",
  "duration": 145
}
```

### Métriques Exposées (Optionnel Prometheus)
- `yesapp_sessions_total` (gauge)
- `yesapp_sessions_active` (gauge)
- `yesapp_messages_sent_total` (counter)
- `yesapp_messages_received_total` (counter)
- `yesapp_webhook_failures_total` (counter)
- `yesapp_http_request_duration_seconds` (histogram)

### Health Checks
```
GET /health
→ {status: "healthy", uptime: 12345}

GET /ready
→ {
  ready: true,
  checks: {
    database: true,
    whatsapp: true,
    storage: true
  }
}
```

---

## Gestion des Erreurs

### Stratégie Globale
```
Try-Catch dans handlers → 
Error middleware → 
Log error + stack → 
Response standardisée:
{
  error: "ERROR_CODE",
  message: "Human readable",
  details: {...}
}
```

### Codes d'Erreur
- `SESSION_NOT_FOUND` (404)
- `SESSION_NOT_CONNECTED` (503)
- `INVALID_PHONE_NUMBER` (400)
- `RATE_LIMIT_EXCEEDED` (429)
- `UNAUTHORIZED` (401)
- `INTERNAL_ERROR` (500)

---

## Performance Optimizations

### Database
- Index sur `messages.session_id`, `messages.timestamp`
- Pagination par défaut (limit=50)
- Prepared statements (better-sqlite3)

### WhatsApp Clients
- Lazy initialization (créé uniquement si utilisé)
- Auto-disconnect après 24h inactivité
- Cache contacts/groupes en mémoire

### API Responses
- Compression gzip (express middleware)
- ETag pour ressources statiques
- Cache headers appropriés

---

## Déploiement Production

### Recommandations

#### Reverse Proxy (nginx)
```nginx
server {
  listen 443 ssl http2;
  server_name api.example.com;
  
  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
  }
}
```

#### Variables d'Environnement Production
```bash
NODE_ENV=production
LOG_LEVEL=warn
API_KEY=<strong-random-key>
RATE_LIMIT_MESSAGES=30  # Plus conservateur
```

#### Backup Strategy
```bash
# Backup complet
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Restauration
docker-compose down
tar -xzf backup-YYYYMMDD.tar.gz
docker-compose up
```

---

## Limitations Connues

1. **1 session = 1 numéro WhatsApp**
   - Impossible de partager un numéro entre multiples sessions

2. **Sessions non migrables**
   - Session liée au serveur qui l'a créée (QR code unique)

3. **Rate limits WhatsApp**
   - Risque de ban si trop de messages/jour (limite non documentée)

4. **Puppeteer overhead**
   - Chromium = ~100MB RAM par session

5. **SQLite concurrency**
   - Limite ~1000 write/sec (suffisant pour usage normal)

---

## Évolution Future

### V2 (Post-MVP)
- [ ] Support groupes WhatsApp (envoi/réception)
- [ ] Templates messages (variables dynamiques)
- [ ] Scheduling messages (cron-like)
- [ ] Analytics dashboard (charts)
- [ ] Multi-utilisateurs (user management)
- [ ] Postgres support (scaling)

### V3 (Long terme)
- [ ] Chatbot framework intégré
- [ ] NLP pour messages (intents)
- [ ] CRM integration (webhooks bidirectionnels)
- [ ] Message templates WhatsApp Business API
- [ ] Cloud deployment (AWS/GCP/Azure)
