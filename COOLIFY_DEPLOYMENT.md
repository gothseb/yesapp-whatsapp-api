# 🚀 Déploiement YesApp sur Coolify

Guide pour déployer YesApp WhatsApp API sur Coolify avec HTTPS automatique.

---

## 📋 Prérequis

- Compte Coolify configuré
- Accès à votre serveur Coolify
- Repository GitHub: https://github.com/gothseb/yesapp-whatsapp-api

---

## 🎯 Déploiement Rapide

### Étape 1: Créer les Services dans Coolify

#### Service 1: Backend API

1. **Nouveau Service** → **Docker Compose**
2. **Source**: GitHub Repository
3. **Repository**: `https://github.com/gothseb/yesapp-whatsapp-api`
4. **Branch**: `main`
5. **Docker Compose File**: `docker-compose.yml`
6. **Service à déployer**: `backend`

**Configuration**:
- **Port interne**: 3000
- **Domaine**: Généré automatiquement par Coolify (ex: `bgg0kgo8kc448os8wg4c4cg4.sebapp-lab.com`)
- **HTTPS**: ✅ Activé automatiquement

**Variables d'Environnement** (dans Coolify):
```env
PORT=3000
NODE_ENV=production
DATABASE_PATH=/app/data/db.sqlite
SESSIONS_PATH=/app/data/sessions
```

#### Service 2: Dashboard

1. **Nouveau Service** → **Docker Compose**
2. **Source**: Même repository
3. **Service à déployer**: `dashboard`

**Configuration**:
- **Port interne**: 80
- **Domaine**: Généré automatiquement (ex: `fokwgc8wgosko08g0s80osco.sebapp-lab.com`)
- **HTTPS**: ✅ Activé automatiquement

**Variables d'Environnement** (dans Coolify):
```env
VITE_API_URL=https://VOTRE_BACKEND_URL.sebapp-lab.com/api/v1
VITE_API_KEY=SERA_GENERE_APRES_PREMIER_DEMARRAGE
```

---

### Étape 2: Configuration des Variables

#### Backend (.env dans Coolify)

Vos variables actuelles sont correctes:
```env
SERVICE_FQDN_BACKEND=bgg0kgo8kc448os8wg4c4cg4.sebapp-lab.com
SERVICE_FQDN_DASHBOARD=fokwgc8wgosko08g0s80osco.sebapp-lab.com
SERVICE_URL_BACKEND=https://bgg0kgo8kc448os8wg4c4cg4.sebapp-lab.com
SERVICE_URL_DASHBOARD=https://fokwgc8wgosko08g0s80osco.sebapp-lab.com
DATABASE_PATH=/app/data/db.sqlite
NODE_ENV=production
PORT=3000
SESSIONS_PATH=/app/data/sessions
```

✅ **C'est parfait!**

#### Dashboard (.env dans Coolify)

```env
VITE_API_URL=https://bgg0kgo8kc448os8wg4c4cg4.sebapp-lab.com/api/v1
VITE_API_KEY=VOTRE_API_KEY_ICI
```

---

### Étape 3: Récupérer l'API Key

Une fois le backend démarré:

1. **Dans Coolify**, allez dans votre service Backend
2. **Logs** → Cherchez "API Key generated"
3. **Copiez la clé** générée

Ou via terminal Coolify:
```bash
# Accéder aux logs du backend
docker logs CONTAINER_ID | grep "API Key"
```

4. **Mettez à jour** la variable `VITE_API_KEY` du Dashboard
5. **Redéployez** le Dashboard

---

## 🎨 Configuration Coolify Spécifique

### docker-compose.coolify.yml

Créez ce fichier pour Coolify (déjà adapté):

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    restart: unless-stopped
    volumes:
      - backend-data:/app/data
    environment:
      - PORT=${PORT:-3000}
      - NODE_ENV=${NODE_ENV:-production}
      - DATABASE_PATH=${DATABASE_PATH:-/app/data/db.sqlite}
      - SESSIONS_PATH=${SESSIONS_PATH:-/app/data/sessions}
      - SERVICE_FQDN_BACKEND=${SERVICE_FQDN_BACKEND}
      - SERVICE_URL_BACKEND=${SERVICE_URL_BACKEND}
    labels:
      - "coolify.managed=true"
    ports:
      - "3000:3000"

  dashboard:
    build:
      context: .
      dockerfile: Dockerfile.dashboard
      args:
        - VITE_API_URL=${VITE_API_URL}
        - VITE_API_KEY=${VITE_API_KEY}
    restart: unless-stopped
    environment:
      - SERVICE_FQDN_DASHBOARD=${SERVICE_FQDN_DASHBOARD}
      - SERVICE_URL_DASHBOARD=${SERVICE_URL_DASHBOARD}
    labels:
      - "coolify.managed=true"
    ports:
      - "80:80"

volumes:
  backend-data:
    driver: local
```

---

## 🔧 Dockerfile Adapté pour Coolify

### Dockerfile.dashboard (avec build args)

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Build args pour les variables d'environnement
ARG VITE_API_URL
ARG VITE_API_KEY

COPY dashboard/package*.json ./
RUN npm install --legacy-peer-deps

COPY dashboard/ .

# Créer le .env pour le build
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env && \
    echo "VITE_API_KEY=${VITE_API_KEY}" >> .env

RUN npm run build

FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 🌐 Accès aux Services

Après déploiement:

- **Backend API**: https://bgg0kgo8kc448os8wg4c4cg4.sebapp-lab.com
- **Dashboard**: https://fokwgc8wgosko08g0s80osco.sebapp-lab.com
- **Health Check**: https://bgg0kgo8kc448os8wg4c4cg4.sebapp-lab.com/health

---

## 🔒 HTTPS Automatique

Coolify gère automatiquement:
- ✅ Certificats SSL Let's Encrypt
- ✅ Renouvellement automatique
- ✅ Redirection HTTP → HTTPS
- ✅ Proxy reverse Traefik

**Vous n'avez rien à configurer!** 🎉

---

## 📊 Vérifications

### 1. Backend Fonctionne

```bash
# Test health check
curl https://bgg0kgo8kc448os8wg4c4cg4.sebapp-lab.com/health

# Test API
curl https://bgg0kgo8kc448os8wg4c4cg4.sebapp-lab.com/api/v1/status
```

### 2. Dashboard Accessible

```bash
# Test dashboard
curl https://fokwgc8wgosko08g0s80osco.sebapp-lab.com/
```

### 3. Logs dans Coolify

- Accédez à chaque service
- Cliquez sur "Logs"
- Vérifiez qu'il n'y a pas d'erreurs

---

## 🔄 Workflow de Mise à Jour

### Méthode 1: Auto-Deploy depuis GitHub

1. Configurez le **GitHub Webhook** dans Coolify
2. Chaque push sur `main` redéploie automatiquement
3. ✅ CI/CD automatique!

### Méthode 2: Deploy Manuel

1. Dans Coolify → Votre service
2. Cliquez sur **"Deploy"**
3. Coolify pull la dernière version et redéploie

---

## 💾 Données Persistantes

### Backend Data

Coolify monte automatiquement un volume pour `/app/data`:
- Base de données SQLite
- Sessions WhatsApp
- Logs

**Backup automatique** possible via Coolify!

### Configuration Backup

Dans Coolify:
1. Service Backend → **Backups**
2. Activer **Automatic Backups**
3. Configurer la fréquence (ex: quotidien)

---

## 🐛 Troubleshooting

### Backend ne démarre pas

**Dans Coolify**:
1. Service Backend → **Logs**
2. Cherchez les erreurs
3. Vérifiez les variables d'environnement

**Causes communes**:
- Variables mal configurées
- Build échoué
- Manque de ressources

### Dashboard page blanche

**Vérifier**:
1. `VITE_API_URL` pointe vers le bon backend
2. `VITE_API_KEY` est correcte
3. CORS configuré (déjà OK dans le code)

**Solution**:
```bash
# Dans Coolify, mettre à jour les variables du Dashboard
VITE_API_URL=https://bgg0kgo8kc448os8wg4c4cg4.sebapp-lab.com/api/v1
VITE_API_KEY=votre_api_key_ici

# Redéployer
```

### API Key non trouvée

```bash
# Dans Coolify, accéder au terminal du backend
docker exec -it CONTAINER_ID sh

# Lister les API Keys
node -e "
const db = require('./src/database/db');
const keys = db.prepare('SELECT key FROM api_keys').all();
console.log(keys[0].key);
"
```

---

## 📈 Monitoring

### Coolify Dashboard

- CPU, RAM, Disque en temps réel
- Logs centralisés
- Alertes automatiques

### Healthchecks

Coolify vérifie automatiquement:
- Backend sur `/health`
- Dashboard sur `/`

---

## 🎯 Configuration Optimale pour Production

### Resources Limits

Dans Coolify, configurez:

**Backend**:
- CPU: 1 core
- RAM: 1 GB
- Disk: 10 GB

**Dashboard**:
- CPU: 0.5 core
- RAM: 512 MB
- Disk: 2 GB

### Auto-Restart

✅ Déjà configuré avec `restart: unless-stopped`

### SSL/TLS

✅ Géré automatiquement par Coolify

---

## 📝 Checklist Déploiement

- [ ] Backend déployé dans Coolify
- [ ] Dashboard déployé dans Coolify
- [ ] Variables d'environnement configurées
- [ ] API Key récupérée et configurée dans Dashboard
- [ ] Backend accessible via HTTPS
- [ ] Dashboard accessible via HTTPS
- [ ] Health check backend passe
- [ ] Session WhatsApp créée et connectée
- [ ] Message test envoyé avec succès
- [ ] Backup automatique configuré (optionnel)
- [ ] GitHub webhook configuré (optionnel)

---

## 🎉 Votre Configuration Actuelle

Vos variables sont **parfaitement configurées** pour Coolify:

```env
✅ SERVICE_FQDN_BACKEND=bgg0kgo8kc448os8wg4c4cg4.sebapp-lab.com
✅ SERVICE_FQDN_DASHBOARD=fokwgc8wgosko08g0s80osco.sebapp-lab.com
✅ SERVICE_URL_BACKEND=https://bgg0kgo8kc448os8wg4c4cg4.sebapp-lab.com
✅ SERVICE_URL_DASHBOARD=https://fokwgc8wgosko08g0s80osco.sebapp-lab.com
✅ DATABASE_PATH=/app/data/db.sqlite
✅ NODE_ENV=production
✅ PORT=3000
✅ SESSIONS_PATH=/app/data/sessions
```

**Il ne vous manque plus que**:
1. Récupérer l'API Key du backend
2. La configurer dans le Dashboard
3. Redéployer le Dashboard

---

## 🚀 Prochaine Étape

1. **Vérifiez que le backend a démarré**:
   ```bash
   curl https://bgg0kgo8kc448os8wg4c4cg4.sebapp-lab.com/health
   ```

2. **Récupérez l'API Key** depuis les logs Coolify

3. **Configurez le Dashboard**:
   ```env
   VITE_API_URL=https://bgg0kgo8kc448os8wg4c4cg4.sebapp-lab.com/api/v1
   VITE_API_KEY=votre_api_key_recuperee
   ```

4. **Redéployez le Dashboard**

5. **Accédez au Dashboard**: https://fokwgc8wgosko08g0s80osco.sebapp-lab.com

6. **Créez votre session WhatsApp** et commencez à automatiser! 🎉

---

**Coolify + YesApp = Déploiement en 5 minutes!** ⚡
