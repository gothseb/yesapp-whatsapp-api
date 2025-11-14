# 🐳 Déploiement Docker de YesApp

Guide complet pour déployer YesApp WhatsApp API sur un serveur avec Docker.

---

## 📋 Prérequis

### Sur Votre Serveur

- **Docker** 20.10+ installé
- **Docker Compose** 2.0+ installé
- **Ports disponibles**: 3000 (API) et 8080 (Dashboard)
- **Ressources minimales**: 1 CPU, 2GB RAM, 10GB disque

### Installation Docker (Ubuntu/Debian)

```bash
# Mettre à jour les packages
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Installer Docker Compose
sudo apt install docker-compose-plugin -y

# Vérifier l'installation
docker --version
docker compose version
```

---

## 🚀 Déploiement Rapide

### Étape 1: Cloner le Projet

```bash
# Sur votre serveur
cd /opt
sudo git clone https://github.com/gothseb/yesapp-whatsapp-api.git
cd yesapp-whatsapp-api
```

### Étape 2: Configuration

```bash
# Copier et éditer le fichier .env backend
cp backend/.env.example backend/.env
nano backend/.env
```

**backend/.env**:
```env
# Port (ne pas changer si vous utilisez docker-compose)
PORT=3000

# Environment
NODE_ENV=production

# Database (chemin Docker)
DATABASE_PATH=/app/data/db.sqlite

# Sessions (chemin Docker)
SESSIONS_PATH=/app/data/sessions

# Optionnel: Webhook URL
# WEBHOOK_URL=https://your-webhook.com/webhook
```

**dashboard/.env** (à créer):
```bash
nano dashboard/.env
```

```env
# URL de l'API (depuis le navigateur du client)
VITE_API_URL=http://VOTRE_SERVEUR_IP:3000/api/v1

# API Key (sera générée au premier démarrage)
VITE_API_KEY=SERA_GENERE_AU_PREMIER_DEMARRAGE
```

### Étape 3: Build et Démarrage

```bash
# Build les images Docker
sudo docker compose build

# Démarrer les services
sudo docker compose up -d

# Vérifier les logs
sudo docker compose logs -f backend
```

### Étape 4: Récupérer l'API Key

```bash
# Attendre 10 secondes que le backend démarre
sleep 10

# Récupérer l'API Key depuis les logs
sudo docker compose logs backend | grep "API Key"

# Ou depuis la base de données
sudo docker compose exec backend node -e "
const db = require('./src/database/db');
const apiKeys = db.prepare('SELECT key FROM api_keys').all();
console.log('API Key:', apiKeys[0]?.key);
"
```

### Étape 5: Configurer le Dashboard

```bash
# Éditer le .env du dashboard avec l'API Key récupérée
nano dashboard/.env

# Ajouter:
# VITE_API_KEY=votre_api_key_ici

# Rebuild le dashboard
sudo docker compose build dashboard
sudo docker compose up -d dashboard
```

---

## 🌐 Accès aux Services

Après le déploiement:

- **Backend API**: http://VOTRE_IP:3000
- **Dashboard**: http://VOTRE_IP:8080
- **Health Check**: http://VOTRE_IP:3000/health
- **API Status**: http://VOTRE_IP:3000/api/v1/status

---

## 🔒 Sécurisation avec Nginx + SSL (Production)

### Installer Nginx et Certbot

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

### Configuration Nginx

**Créer `/etc/nginx/sites-available/yesapp`**:

```nginx
# API Backend
server {
    listen 80;
    server_name api.votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Dashboard
server {
    listen 80;
    server_name dashboard.votre-domaine.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Activer et Sécuriser avec SSL

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/yesapp /etc/nginx/sites-enabled/

# Tester la config
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx

# Obtenir les certificats SSL
sudo certbot --nginx -d api.votre-domaine.com -d dashboard.votre-domaine.com
```

### Mettre à jour dashboard/.env avec HTTPS

```env
VITE_API_URL=https://api.votre-domaine.com/api/v1
```

---

## 📊 Gestion des Services

### Commandes Docker Compose

```bash
# Démarrer
sudo docker compose up -d

# Arrêter
sudo docker compose down

# Redémarrer
sudo docker compose restart

# Voir les logs
sudo docker compose logs -f

# Logs d'un service spécifique
sudo docker compose logs -f backend
sudo docker compose logs -f dashboard

# Statut
sudo docker compose ps

# Rebuild après modifications
sudo docker compose build
sudo docker compose up -d
```

### Mise à Jour de l'Application

```bash
# Pull les dernières modifications
cd /opt/yesapp-whatsapp-api
sudo git pull

# Rebuild et redémarrer
sudo docker compose build
sudo docker compose up -d

# Vérifier
sudo docker compose ps
```

---

## 💾 Sauvegardes

### Sauvegarder les Données

```bash
# Créer un backup
sudo tar -czf yesapp-backup-$(date +%Y%m%d).tar.gz data/

# Ou copier uniquement la DB
sudo cp data/db.sqlite data/db.sqlite.backup
```

### Restaurer les Données

```bash
# Arrêter les services
sudo docker compose down

# Restaurer
sudo tar -xzf yesapp-backup-YYYYMMDD.tar.gz

# Redémarrer
sudo docker compose up -d
```

---

## 🔍 Monitoring et Logs

### Voir les Logs en Temps Réel

```bash
# Tous les services
sudo docker compose logs -f

# Backend uniquement
sudo docker compose logs -f backend

# Dashboard uniquement
sudo docker compose logs -f dashboard

# Dernières 100 lignes
sudo docker compose logs --tail=100
```

### Vérifier la Santé des Conteneurs

```bash
# Statut
sudo docker compose ps

# Health checks
sudo docker inspect yesapp-backend --format='{{.State.Health.Status}}'
sudo docker inspect yesapp-dashboard --format='{{.State.Health.Status}}'
```

---

## 🐛 Troubleshooting

### Backend ne démarre pas

```bash
# Voir les erreurs
sudo docker compose logs backend

# Vérifier les permissions
sudo chown -R 1000:1000 data/

# Rebuilder
sudo docker compose build backend
sudo docker compose up -d backend
```

### Dashboard ne se connecte pas à l'API

1. Vérifiez que `VITE_API_URL` est correct dans `dashboard/.env`
2. Vérifiez que l'API Key est correcte
3. Vérifiez les CORS (devrait être configuré pour accepter toutes origines en dev)

```bash
# Rebuild le dashboard
sudo docker compose build dashboard
sudo docker compose up -d dashboard
```

### Sessions WhatsApp se déconnectent

```bash
# Vérifier que le volume data est bien monté
sudo docker compose exec backend ls -la /app/data/sessions/

# Redémarrer proprement
sudo docker compose restart backend
```

### Manque de Mémoire

```bash
# Vérifier l'utilisation
sudo docker stats

# Limiter la mémoire dans docker-compose.yml
# Ajouter sous chaque service:
    deploy:
      resources:
        limits:
          memory: 512M
```

---

## ⚡ Optimisations Production

### 1. Utiliser un Reverse Proxy (Traefik)

**docker-compose.traefik.yml**:

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    command:
      - --api.insecure=true
      - --providers.docker=true
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.email=votre@email.com
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - yesapp-network

  backend:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.votre-domaine.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"

  dashboard:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dashboard.rule=Host(`dashboard.votre-domaine.com`)"
      - "traefik.http.routers.dashboard.entrypoints=websecure"
      - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
```

### 2. Ajouter Redis pour le Cache (Optionnel)

```yaml
  redis:
    image: redis:7-alpine
    container_name: yesapp-redis
    restart: unless-stopped
    networks:
      - yesapp-network
```

### 3. Monitoring avec Prometheus + Grafana (Optionnel)

Voir documentation séparée pour le monitoring avancé.

---

## 📝 Checklist de Déploiement

- [ ] Docker et Docker Compose installés
- [ ] Repository cloné sur le serveur
- [ ] Fichier `.env` configuré pour backend
- [ ] Fichier `.env` configuré pour dashboard (après récup API Key)
- [ ] Build des images Docker réussi
- [ ] Services démarrés (`docker compose up -d`)
- [ ] Health checks passent (vert)
- [ ] API accessible via http://IP:3000/health
- [ ] Dashboard accessible via http://IP:8080
- [ ] Session WhatsApp créée et QR code scanné
- [ ] Message test envoyé avec succès
- [ ] Sauvegardes configurées
- [ ] SSL configuré (production)
- [ ] Monitoring en place (optionnel)

---

## 🆘 Support

### Logs Utiles

```bash
# Tout voir
sudo docker compose logs -f

# Erreurs uniquement
sudo docker compose logs | grep -i error

# Performance
sudo docker stats
```

### Redémarrage Complet

```bash
sudo docker compose down
sudo docker compose up -d
sudo docker compose logs -f
```

---

## 📞 Ressources

- **Docker Hub**: (Peut publier vos images)
- **GitHub**: https://github.com/gothseb/yesapp-whatsapp-api
- **Documentation**: Voir README.md

---

**🐳 Votre application YesApp est maintenant Dockerisée et prête pour la production!**
