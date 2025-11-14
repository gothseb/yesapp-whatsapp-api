# 🚀 YesApp WhatsApp API - Quick Start Guide

## Démarrage en 3 minutes ⏱️

### 1️⃣ Démarrer le Backend

```bash
cd backend
npm run dev
```

**Important**: Lors du premier démarrage, une **API Key** sera générée et affichée **une seule fois** dans les logs:

```
🔑 API Key Generated (SAVE THIS - IT WILL NOT BE SHOWN AGAIN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   abc123def456...votre-clé-complète...xyz789

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**⚠️ COPIEZ cette clé immédiatement!**

---

### 2️⃣ Configurer le Dashboard

**Option A - Script automatique (Windows):**
```powershell
.\setup-dashboard.ps1
```
Le script vous demandera votre API Key et configurera automatiquement le dashboard.

**Option B - Manuelle:**
```bash
cd dashboard
echo "VITE_API_KEY=votre-api-key-ici" > .env
```

---

### 3️⃣ Démarrer le Dashboard

```bash
cd dashboard
npm run dev
```

Ouvrez: **http://localhost:5173**

---

## 🎯 Utilisation

### Créer une Session WhatsApp

1. Dans le dashboard, cliquez sur **"Create New Session"**
2. Entrez un nom (ex: "Mon WhatsApp")
3. Cliquez sur **Create**
4. Le **QR code** s'affichera automatiquement

### Connecter WhatsApp

1. Ouvrez **WhatsApp** sur votre téléphone
2. Menu (⋮) → **Appareils connectés**
3. **Lier un appareil**
4. **Scannez le QR code** affiché dans le dashboard
5. ✅ La session passera à "Connected" (badge vert)

### Envoyer un Message

1. Sélectionnez une session **connectée**
2. Entrez un numéro au **format international**: `+33612345678`
3. Tapez votre message
4. Cliquez sur **"Send Message"**
5. 🎉 Le message est envoyé via WhatsApp!

---

## 🔑 Problème avec l'API Key?

### Générer une nouvelle API Key

```bash
# 1. Arrêter le backend (Ctrl+C)

# 2. Supprimer la base de données
rm data/db.sqlite

# 3. Redémarrer le backend
cd backend
npm run dev

# 4. La nouvelle API Key s'affiche dans les logs - COPIEZ-LA!

# 5. Reconfigurer le dashboard avec la nouvelle clé
.\setup-dashboard.ps1
```

---

## 📡 API Endpoints (pour développeurs)

### Sessions
- `POST /api/v1/sessions` - Créer session
- `GET /api/v1/sessions` - Liste sessions
- `GET /api/v1/sessions/:id` - Détails session
- `GET /api/v1/sessions/:id/qr` - Obtenir QR code
- `DELETE /api/v1/sessions/:id` - Supprimer session

### Messages
- `POST /api/v1/sessions/:id/messages` - Envoyer message
- `GET /api/v1/sessions/:id/messages` - Liste messages

**Authentification**: Header `X-API-Key: votre-clé`

**Exemple curl:**
```bash
curl -X POST http://localhost:3000/api/v1/sessions \
  -H "X-API-Key: votre-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Session"}'
```

---

## 🐛 Troubleshooting

### Le dashboard affiche "Cannot connect to API"
- ✅ Vérifiez que le backend est démarré (`npm run dev` dans `backend/`)
- ✅ Backend doit être sur `http://localhost:3000`

### Erreur 401 "UNAUTHORIZED"
- ❌ API Key invalide ou manquante
- ✅ Vérifiez `dashboard/.env` contient `VITE_API_KEY=...`
- ✅ Redémarrez le dashboard après modification du `.env`

### QR code ne s'affiche pas
- ⏳ Attendez 5-10 secondes (génération en cours)
- 🔄 Rafraîchissez la page
- 📱 Vérifiez que Chromium/Chrome est installé (requis par whatsapp-web.js)

### Session reste "pending"
- ⏱️ Le QR code expire après ~1 minute
- 🔄 Créez une nouvelle session si le QR est expiré

---

## 📚 Documentation Complète

- **Spécification**: `specs/001-whatsapp-api/spec.md`
- **Architecture**: `specs/001-whatsapp-api/ARCHITECTURE.md`
- **Plan**: `specs/001-whatsapp-api/plan.md`

---

## ⚡ Résumé en 30 secondes

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# → Copier l'API Key affichée

# Terminal 2 - Dashboard  
cd dashboard
echo "VITE_API_KEY=<api-key-copiée>" > .env
npm run dev
# → Ouvrir http://localhost:5173

# Dans le dashboard:
# 1. Create Session
# 2. Scan QR avec WhatsApp mobile
# 3. Send Message!
```

---

**🎉 C'est prêt! Vous pouvez maintenant envoyer des messages WhatsApp via l'API!**

**Support**: Consultez `specs/001-whatsapp-api/` pour plus de détails
