# 🚀 Déploiement Unifié - API + Dashboard sur le même port

Configuration pour avoir l'API et le Dashboard accessible sur le **même port 3000**.

---

## 🎯 Architecture

```
┌─────────────────────────────────────────┐
│         Port 3000 (HTTPS)               │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Nginx (Container unified)       │ │
│  │                                   │ │
│  │   /              → Dashboard     │ │
│  │   /api/*         → Backend API   │ │
│  │   /health        → Backend       │ │
│  └───────────────────────────────────┘ │
│               ↓                         │
│  ┌───────────────────────────────────┐ │
│  │   Backend (Internal :3000)        │ │
│  │   Node.js + Express               │ │
│  │   whatsapp-web.js                 │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Avantages:**
- ✅ Un seul domaine/port pour tout
- ✅ Pas de problèmes CORS
- ✅ Configuration SSL simplifiée
- ✅ API relative `/api/v1/*`

---

## 📋 Configuration Coolify

### Étape 1: Variables d'Environnement

**Dans Coolify - Service Unifié:**

```env
# API Key (récupérée du backend)
VITE_API_KEY=votre_api_key_ici

# L'URL API est relative (pas besoin de domaine complet)
# VITE_API_URL=/api/v1  (défini dans le Dockerfile)

# Backend (variables existantes)
NODE_ENV=production
PORT=3000
DATABASE_PATH=/app/data/db.sqlite
SESSIONS_PATH=/app/data/sessions
```

---

### Étape 2: Déploiement

**Option A: Docker Compose dans Coolify**

1. **Nouveau Service** → **Docker Compose**
2. **Repository**: `https://github.com/gothseb/yesapp-whatsapp-api`
3. **Docker Compose File**: `docker-compose.unified.yml`
4. **Variables d'environnement**: (voir ci-dessus)
5. **Port**: 3000
6. **Domaine**: `votre-domaine.com` ou auto-généré

**Option B: Deux services séparés avec Nginx**

Gardez backend et créez un service unified qui expose 3000.

---

### Étape 3: Accès Unique

Une fois déployé:

```
https://votre-domaine.com           → Dashboard
https://votre-domaine.com/api/v1/*  → API Backend
https://votre-domaine.com/health    → Health Check
```

**Exemple:**
```bash
# Dashboard
curl https://bgg0kgo8kc448os8wg4c4cg4.yourdomain.com/

# API
curl https://bgg0kgo8kc448os8wg4c4cg4.yourdomain.com/api/v1/status

# Health
curl https://bgg0kgo8kc448os8wg4c4cg4.yourdomain.com/health
```

---

## 🔧 Build et Test en Local

```bash
# 1. Récupérer l'API Key du backend
docker compose up -d backend
docker compose logs backend | grep "API Key"

# 2. Configurer la variable
export VITE_API_KEY="votre_api_key_ici"

# 3. Build avec la config unifiée
docker compose -f docker-compose.unified.yml build

# 4. Démarrer
docker compose -f docker-compose.unified.yml up -d

# 5. Tester
curl http://localhost:3000/              # Dashboard
curl http://localhost:3000/api/v1/status # API
curl http://localhost:3000/health        # Health
```

---

## 🌐 Configuration Dashboard

Le dashboard sera automatiquement configuré pour utiliser l'**API relative**:

**Avant (2 domaines):**
```env
VITE_API_URL=https://bgg0kgo8kc448os8wg4c4cg4.yourdomain.com/api/v1
```

**Maintenant (même domaine):**
```env
VITE_API_URL=/api/v1
```

Nginx proxyfie `/api/*` vers `http://backend:3000/api/*` automatiquement! 🎉

---

## 📊 Flux des Requêtes

### Requête Dashboard
```
Navigateur → https://domaine.com/
           ↓
         Nginx (port 80 interne)
           ↓
         Fichiers statiques (/usr/share/nginx/html)
           ↓
         Dashboard React affiché
```

### Requête API
```
Dashboard → fetch('/api/v1/sessions')
          ↓
        Nginx reçoit /api/v1/sessions
          ↓
        proxy_pass http://backend:3000/api/v1/sessions
          ↓
        Backend traite la requête
          ↓
        Réponse JSON
```

---

## 🔒 SSL/HTTPS avec Coolify

Coolify gère automatiquement SSL pour le port 3000:

```
Internet → HTTPS (443)
         ↓
       Traefik (Coolify)
         ↓
       Container unified (80)
         ↓
       Nginx → Backend
```

**Vous configurez:** Port 3000 externe
**Coolify gère:** SSL/TLS automatique ✅

---

## 🐛 Troubleshooting

### API ne répond pas

**Vérifier le réseau Docker:**
```bash
docker compose -f docker-compose.unified.yml exec unified ping backend
```

**Vérifier les logs Nginx:**
```bash
docker compose -f docker-compose.unified.yml logs unified
```

### Dashboard page blanche

**Vérifier que les fichiers sont buildés:**
```bash
docker compose -f docker-compose.unified.yml exec unified ls -la /usr/share/nginx/html/
```

**Tester directement Nginx:**
```bash
docker compose -f docker-compose.unified.yml exec unified wget -O- http://localhost/
```

---

## 📝 Checklist Déploiement Unifié

- [ ] Backend démarré et API Key récupérée
- [ ] Variable `VITE_API_KEY` configurée
- [ ] Build du container unified réussi
- [ ] Container unified démarré (port 3000)
- [ ] Dashboard accessible sur `/`
- [ ] API accessible sur `/api/v1/*`
- [ ] Health check sur `/health` OK
- [ ] SSL/HTTPS configuré par Coolify
- [ ] Session WhatsApp créée
- [ ] Tests de messages OK

---

## 🎯 Commandes Utiles

```bash
# Voir tous les services
docker compose -f docker-compose.unified.yml ps

# Logs du service unifié
docker compose -f docker-compose.unified.yml logs -f unified

# Logs du backend
docker compose -f docker-compose.unified.yml logs -f backend

# Redémarrer le service unifié
docker compose -f docker-compose.unified.yml restart unified

# Rebuild après modifications
docker compose -f docker-compose.unified.yml build unified
docker compose -f docker-compose.unified.yml up -d unified
```

---

## ✅ Avantages de cette Configuration

1. **Un seul domaine/port** - Plus simple à gérer
2. **Pas de CORS** - Même origine pour tout
3. **SSL simplifié** - Un seul certificat
4. **URL relative** - `/api/v1/*` au lieu de domaine complet
5. **Déploiement facile** - Un seul service à exposer
6. **Moins de ressources** - Traefik gère un seul endpoint

---

## 🚀 Pour Coolify

**Configuration recommandée:**

```yaml
Service Name: yesapp
Port: 3000
Docker Compose File: docker-compose.unified.yml
Environment Variables:
  - VITE_API_KEY=xxx
  - NODE_ENV=production
  - DATABASE_PATH=/app/data/db.sqlite
  - SESSIONS_PATH=/app/data/sessions
Domain: votre-domaine.com
SSL: Auto (Let's Encrypt)
```

**Accès:**
- Dashboard: `https://votre-domaine.com`
- API: `https://votre-domaine.com/api/v1/*`

**C'est tout!** 🎉
