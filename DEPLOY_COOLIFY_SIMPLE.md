# 🚀 Déploiement YesApp sur Coolify - Guide Simplifié

## ✅ État du Projet

Votre projet est **COMPLET** et **FONCTIONNEL**. Il contient:

- ✅ Backend API (Node.js + Express + WhatsApp Web)
- ✅ Dashboard (React + TailwindCSS)
- ✅ Configuration Docker unifiée
- ✅ Tout sur le port 3000

---

## 🎯 Le Problème Actuel

**Symptôme:** Vous voyez `{"error":"NOT_FOUND","message":"Route GET / not found"}`

**Cause:** Coolify expose le service **backend** au lieu du service **unified**

**Le backend seul ne sert QUE l'API** (`/api/v1/*`, `/health`)
**Le service unified sert** le Dashboard (`/`) **ET** proxifie l'API (`/api/v1/*`)

---

## 📊 Architecture Correcte

```
Port 3000 PUBLIC
      ↓
Service UNIFIED (Nginx) ← DOIT ÊTRE EXPOSÉ
      ├─ / → Dashboard
      └─ /api/v1/* → Backend
            ↓
      Backend (interne)
```

**Architecture actuelle (INCORRECTE):**
```
Port 3000 PUBLIC
      ↓
Backend directement ← PAS BON
```

---

## 🔧 Solution: Déploiement Correct

### Option 1: Déploiement Complet (Recommandé)

**Supprimez les anciens services et repartez de zéro:**

#### Étape 1: Nouveau Service dans Coolify

1. **+ New Service** → **Docker Compose**
2. **Repository:** `https://github.com/gothseb/yesapp-whatsapp-api`
3. **Branch:** `main`
4. **Docker Compose File:** `docker-compose.unified.debian.yml`

#### Étape 2: Variables d'Environnement

```env
VITE_API_KEY=VOTRE_CLE_API
NODE_ENV=production
PORT=3000
DATABASE_PATH=/app/data/db.sqlite
SESSIONS_PATH=/app/data/sessions
```

**Note:** La `VITE_API_KEY` sera générée après le premier démarrage du backend.

#### Étape 3: Configuration des Ports

**Dans Coolify:**
- **Service exposé:** `unified` (PAS backend!)
- **Port container:** 80
- **Port public:** 3000

#### Étape 4: Domaine

```
sebapp-lab.com:3000
```

ou utilisez le domaine auto-généré de Coolify pour le service **unified**.

#### Étape 5: Deploy!

1. Sauvegardez la configuration
2. Cliquez sur **"Deploy"**
3. Attendez 3-5 minutes

---

## 🔑 Récupérer l'API Key

**Une fois le backend démarré:**

### Méthode 1: Logs

**Coolify → Backend Container → Logs:**

Cherchez:
```
🔑 API Key generated: xxx...
```

### Méthode 2: Terminal Backend

```bash
cd /app
node create-api-key.js
```

### Méthode 3: Command Direct

```bash
cat /app/data/db.sqlite | strings | grep -E '[a-f0-9]{64}'
```

---

## 🔄 Reconfigurer le Dashboard avec l'API Key

**Une fois l'API Key récupérée:**

1. **Coolify → Service Unified → Environment Variables**
2. **Modifiez:** `VITE_API_KEY=LA_VRAIE_CLE`
3. **Force Rebuild** (Important!)
4. Attendez 2-3 minutes

---

## ✅ Tests de Vérification

### Test 1: Dashboard

```bash
curl http://sebapp-lab.com:3000/
```

**Attendu:** Code HTML du dashboard (pas JSON!)

### Test 2: API Health

```bash
curl http://sebapp-lab.com:3000/health
```

**Attendu:** `{"status":"healthy",...}`

### Test 3: API Status

```bash
curl http://sebapp-lab.com:3000/api/v1/status
```

**Attendu:** `{"message":"YesApp WhatsApp API v1",...}`

---

## 🐛 Troubleshooting

### Problème 1: JSON Error au lieu du Dashboard

**Symptôme:**
```json
{"error":"NOT_FOUND","message":"Route GET / not found"}
```

**Cause:** Le backend est exposé au lieu du unified

**Solution:**
1. Vérifiez dans Coolify quel service est exposé sur le port 3000
2. Ça devrait être **unified**, pas **backend**
3. Dans le docker-compose, seul `unified` a `ports: - "3000:80"`

---

### Problème 2: Cannot Connect to API

**Symptôme:** Dashboard chargé mais erreur de connexion API

**Cause:** `VITE_API_KEY` pas configurée ou incorrecte

**Solution:**
1. Récupérez la vraie API Key du backend
2. Configurez `VITE_API_KEY` dans les variables
3. **Force Rebuild** du service unified
4. Vérifiez les logs de build: `RUN cat .env` devrait montrer la vraie clé

---

### Problème 3: Les Deux Services Se Battent

**Symptôme:** Parfois ça marche, parfois pas

**Cause:** Backend et Unified tous deux exposés sur le port 3000

**Solution:**
1. Dans Coolify, **SEUL le service unified** doit avoir un port public exposé
2. Le backend doit être interne uniquement (pas de port mapping public)

---

## 📋 Checklist de Déploiement

- [ ] Coolify: Nouveau service Docker Compose créé
- [ ] Repository: `https://github.com/gothseb/yesapp-whatsapp-api`
- [ ] Fichier: `docker-compose.unified.debian.yml`
- [ ] Variables d'environnement configurées (au moins `NODE_ENV`, `PORT`)
- [ ] Service déployé (2 containers: backend + unified)
- [ ] Backend logs montrent le démarrage réussi
- [ ] API Key récupérée depuis les logs backend
- [ ] `VITE_API_KEY` configurée dans les variables unified
- [ ] Force Rebuild du service unified effectué
- [ ] Test: `curl http://sebapp-lab.com:3000/` retourne HTML ✅
- [ ] Test: Dashboard accessible dans le navigateur ✅
- [ ] Création de session WhatsApp possible ✅

---

## 🎯 Résumé Simple

**Pour que ça marche, vous devez:**

1. **Déployer** le fichier `docker-compose.unified.debian.yml`
2. **Exposer** le service **unified** sur le port 3000 (PAS le backend!)
3. **Récupérer** l'API Key du backend
4. **Configurer** `VITE_API_KEY` dans unified
5. **Force Rebuild** unified

**C'est tout!** 🎉

---

## 📞 Commandes Rapides

### Vérifier quel service est exposé

```bash
# Dans Coolify, regardez les containers
docker ps | grep yesapp

# Vous devriez voir:
# yesapp-backend   (pas de port public)
# yesapp-unified   0.0.0.0:3000->80/tcp
```

### Récupérer l'API Key

```bash
# Méthode la plus simple
docker exec yesapp-backend node /app/create-api-key.js
```

### Tester depuis le serveur

```bash
# Test interne
curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/status
```

---

## 🎉 Succès!

**Vous saurez que tout fonctionne quand:**

1. `http://sebapp-lab.com:3000/` affiche le **Dashboard React**
2. Vous pouvez **créer une session** WhatsApp
3. Un **QR code** s'affiche
4. Après scan, vous pouvez **envoyer des messages**

---

**Bon déploiement!** 🚀
