# 🔧 Docker Troubleshooting Guide

Guide de résolution des problèmes courants avec Docker.

---

## 🏥 Health Checks - État "Unhealthy"

### Comprendre les Health Checks

Les health checks Docker vérifient périodiquement si vos conteneurs fonctionnent correctement.

**États possibles**:
- ✅ **healthy** - Tout fonctionne
- ⏳ **starting** - Période de démarrage (normal)
- ❌ **unhealthy** - Le check échoue
- ⚪ **none** - Pas de health check configuré

---

## 🔍 Diagnostic des Problèmes

### 1. Vérifier l'État des Conteneurs

```bash
# Voir l'état de santé
docker compose ps

# Détails d'un conteneur
docker inspect yesapp-backend | grep -A 10 Health

# Logs du health check
docker inspect yesapp-backend --format='{{json .State.Health}}' | jq
```

### 2. Vérifier les Logs

```bash
# Logs en temps réel
docker compose logs -f backend
docker compose logs -f dashboard

# Dernières erreurs
docker compose logs backend | grep -i error
```

---

## ⚡ Solutions Rapides

### Solution 1: Utiliser la Config Simplifiée (SANS Health Checks)

```bash
# Arrêter les services actuels
docker compose down

# Démarrer avec la config simplifiée
docker compose -f docker-compose.simple.yml up -d

# Vérifier
docker compose -f docker-compose.simple.yml ps
```

Cette configuration fonctionne sans health checks - parfait pour le développement!

---

### Solution 2: Augmenter le Temps de Démarrage

Si le backend met du temps à démarrer:

**Modifier `docker-compose.yml`**:
```yaml
healthcheck:
  test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 5
  start_period: 120s  # ⬅️ Augmenter à 2 minutes
```

Puis:
```bash
docker compose down
docker compose up -d
```

---

### Solution 3: Tester Manuellement le Health Check

```bash
# Entrer dans le conteneur backend
docker compose exec backend sh

# Tester le endpoint /health
wget -O- http://localhost:3000/health

# Si ça ne fonctionne pas, vérifier que le serveur écoute
netstat -tuln | grep 3000

# Sortir
exit
```

---

### Solution 4: Désactiver Temporairement les Health Checks

**Commenter les health checks dans `docker-compose.yml`**:

```yaml
backend:
  # ... autres configs ...
  # healthcheck:
  #   test: ["CMD", "wget", ...]
  #   interval: 30s
  #   ...
```

Puis:
```bash
docker compose down
docker compose up -d
```

---

## 🐛 Problèmes Courants et Solutions

### Backend Unhealthy - Port 3000 non accessible

**Cause**: Le serveur Node.js n'a pas démarré correctement

**Solution**:
```bash
# Voir les logs
docker compose logs backend

# Vérifier les erreurs communes:
# - Erreur de base de données
# - Erreur de dépendances npm
# - Erreur de configuration .env

# Rebuilder si nécessaire
docker compose build backend
docker compose up -d backend
```

---

### Dashboard Unhealthy - Nginx 404

**Cause**: Les fichiers buildés n'existent pas

**Solution**:
```bash
# Rebuild le dashboard
docker compose build --no-cache dashboard
docker compose up -d dashboard

# Vérifier les fichiers
docker compose exec dashboard ls -la /usr/share/nginx/html/
```

---

### Health Check Timeout

**Cause**: Le health check prend trop de temps

**Solution**: Augmenter le timeout
```yaml
healthcheck:
  timeout: 30s  # Au lieu de 10s
```

---

### Conteneur Redémarre en Boucle

**Symptôme**:
```bash
docker compose ps
# Status: Restarting (X) 
```

**Solution**:
```bash
# Voir pourquoi il crash
docker compose logs backend --tail=50

# Causes communes:
# 1. Erreur dans le code
# 2. Port déjà utilisé
# 3. Volume permissions

# Tester sans restart automatique
docker compose up backend  # Sans -d pour voir les erreurs
```

---

## 🔧 Commandes de Diagnostic Avancées

### Vérifier les Ports

```bash
# Ports exposés
docker compose port backend 3000
docker compose port dashboard 80

# Vérifier si occupés sur l'hôte
netstat -tuln | grep 3000
netstat -tuln | grep 5173
```

### Vérifier les Volumes

```bash
# Lister les volumes
docker volume ls

# Inspecter le volume data
docker volume inspect yesapp_data

# Vérifier les permissions
docker compose exec backend ls -la /app/data/
```

### Vérifier le Réseau

```bash
# Lister les réseaux
docker network ls

# Inspecter le réseau yesapp
docker network inspect yesapp-network

# Tester la connectivité entre conteneurs
docker compose exec dashboard ping backend
```

---

## 📊 Monitoring en Temps Réel

### Voir les Ressources Utilisées

```bash
# Stats en temps réel
docker stats

# Filtrer pour yesapp
docker stats yesapp-backend yesapp-dashboard
```

### Logs Structurés

```bash
# Logs avec timestamps
docker compose logs -t -f

# Logs depuis les 5 dernières minutes
docker compose logs --since 5m

# Logs jusqu'à une certaine date
docker compose logs --until 2024-01-01T12:00:00
```

---

## 🔄 Reset Complet

Si rien ne fonctionne, reset complet:

```bash
# 1. Tout arrêter et supprimer
docker compose down -v  # -v supprime aussi les volumes

# 2. Nettoyer Docker
docker system prune -a  # Supprimer images non utilisées

# 3. Sauvegarder vos données d'abord!
cp -r data/ data.backup/

# 4. Rebuilder from scratch
docker compose build --no-cache

# 5. Redémarrer
docker compose up -d

# 6. Suivre les logs
docker compose logs -f
```

---

## 📝 Checklist de Diagnostic

Suivez cette checklist pour diagnostiquer:

- [ ] Logs du conteneur vérifiés (`docker compose logs`)
- [ ] Ports non en conflit (`netstat -tuln`)
- [ ] Fichiers .env présents et corrects
- [ ] Permissions des volumes OK (`ls -la data/`)
- [ ] Images buildées récemment (`docker compose build`)
- [ ] Réseau Docker OK (`docker network ls`)
- [ ] Ressources suffisantes (RAM, CPU, disque)
- [ ] Health checks timing approprié (60s+ pour backend)

---

## 🆘 Configurations Alternatives

### Config 1: Sans Health Checks (Simple)

```bash
docker compose -f docker-compose.simple.yml up -d
```

### Config 2: Development (avec hot reload)

Créer `docker-compose.dev.yml`:
```yaml
services:
  backend:
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev
```

Utiliser:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

---

## 💡 Bonnes Pratiques

### 1. Toujours Vérifier les Logs

```bash
# Premier réflexe
docker compose logs -f
```

### 2. Rebuilder Après Modifications

```bash
docker compose build
docker compose up -d
```

### 3. Tester le Health Check Manuellement

```bash
# Backend
curl http://localhost:3000/health

# Dashboard
curl http://localhost:5173/
```

### 4. Utiliser --no-cache Si Problème de Cache

```bash
docker compose build --no-cache
```

---

## 📞 Ressources Utiles

- **Docker Docs**: https://docs.docker.com/
- **Health Checks**: https://docs.docker.com/engine/reference/builder/#healthcheck
- **Compose Docs**: https://docs.docker.com/compose/

---

## 🎯 Exemple de Workflow de Debug

```bash
# 1. Vérifier l'état
docker compose ps

# 2. Voir les logs
docker compose logs backend --tail=100

# 3. Tester manuellement
docker compose exec backend wget -O- http://localhost:3000/health

# 4. Si erreur, rebuilder
docker compose build backend

# 5. Redémarrer
docker compose up -d backend

# 6. Suivre les logs
docker compose logs -f backend

# 7. Tester depuis l'hôte
curl http://localhost:3000/health
```

---

**En cas de doute, utilisez `docker-compose.simple.yml` qui fonctionne sans health checks!** ✅
