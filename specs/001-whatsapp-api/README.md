# YesApp WhatsApp API - Quick Start Guide

**Status**: Planning Complete ✅  
**Next**: Ready for Implementation

---

## 📋 Documents Disponibles

1. **[spec.md](./spec.md)** - Spécification fonctionnelle complète
   - 6 User Stories priorisées
   - 51 Exigences fonctionnelles
   - 10 Critères de succès mesurables

2. **[plan.md](./plan.md)** - Plan d'implémentation technique
   - Stack technologique choisi
   - Architecture système
   - Plan de développement (4 phases)
   - Configuration Docker

3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture détaillée
   - Composants système
   - Flux de données
   - Stratégies de persistance
   - Monitoring & sécurité

4. **[checklists/requirements.md](./checklists/requirements.md)** - Validation qualité
   - Tous critères ✅ validés

---

## 🎯 Objectif du Projet

Créer une API REST auto-hébergeable en Docker permettant d'envoyer et recevoir des messages WhatsApp, avec:
- ✅ Déploiement en 1 commande (`docker-compose up`)
- ✅ Multi-sessions (plusieurs comptes WhatsApp sur 1 serveur)
- ✅ Dashboard web pour gestion
- ✅ Documentation Swagger interactive
- ✅ Webhooks pour notifications temps réel

---

## 🏗️ Stack Technique (Choix Simplicité)

| Composant | Technologie | Pourquoi |
|-----------|-------------|----------|
| **Backend** | Node.js 20 + Express.js | Simplicité maximale |
| **WhatsApp** | whatsapp-web.js | Stable + QR code intégré |
| **Database** | SQLite 3 | Zéro config, fichier unique |
| **Dashboard** | React 18 + Vite + Tailwind | Setup rapide, UI moderne |
| **Documentation** | Swagger UI | Standard industrie |
| **Auth** | API Key simple | Suffisant pour auto-hébergement |

---

## 📦 Ce Qui Sera Livré

### MVP (Phase 1) - 3-4 jours
- Déploiement Docker fonctionnel
- Connexion WhatsApp via QR code
- Envoi messages texte via API
- Dashboard basique
- Rate limiting (50 msg/min)

### Phase 2 - 2-3 jours
- Réception messages
- Webhooks avec retry automatique
- Dashboard interactif

### Phase 3 - 2-3 jours
- Multi-sessions optimisé
- Support médias (images, vidéos, documents)
- Dashboard avancé

### Phase 4 - 2-3 jours
- Swagger UI complet
- Observabilité (logs structurés)
- Documentation exhaustive
- Tests automatisés

**Total**: 9-13 jours de développement

---

## 🚀 Utilisation Prévue

### 1. Déploiement
```bash
# Cloner le repo
git clone <repo>
cd yesapp

# Démarrer
docker-compose up --build

# L'API Key s'affiche dans les logs
```

### 2. Accès
- **Dashboard**: http://localhost:3000
- **Swagger**: http://localhost:3000/api/docs
- **Health**: http://localhost:3000/health

### 3. Créer Session WhatsApp
```bash
curl -X POST http://localhost:3000/api/v1/sessions \
  -H "X-API-Key: <votre-key>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Ma Session"}'
```

Response:
```json
{
  "id": "uuid",
  "status": "pending",
  "qrCode": "data:image/png;base64,..."
}
```

### 4. Scanner QR Code
- Ouvrir le dashboard
- Scanner le QR avec WhatsApp mobile
- Attendre "Connecté"

### 5. Envoyer Message
```bash
curl -X POST http://localhost:3000/api/v1/sessions/{id}/messages \
  -H "X-API-Key: <votre-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+33612345678",
    "text": "Hello from API!"
  }'
```

---

## 📐 Architecture Simplifiée

```
┌──────────────────────────────────────┐
│      DOCKER CONTAINER                │
│                                      │
│  Dashboard  ←→  Express API  ←→  WhatsApp
│  (React)       (Node.js)       (whatsapp-web.js)
│     │              │                │
│     └──────┬───────┴────────────────┘
│            ▼
│        SQLite DB
│            │
└────────────┼────────────────────────┘
             ▼
       Docker Volumes
       (db, sessions, media)
```

---

## 🎯 Critères de Succès

Les 10 critères mesurables de la spec:

- [ ] **SC-001**: Déploiement en < 5 minutes
- [ ] **SC-002**: 100 messages/min sans erreur
- [ ] **SC-003**: Webhooks livrés en < 2 secondes (99%)
- [ ] **SC-004**: Reconnexion auto en < 30 secondes (95%)
- [ ] **SC-005**: 10 sessions simultanées sur 2 CPU / 4GB RAM
- [ ] **SC-006**: Premier appel API en < 10 minutes
- [ ] **SC-007**: Persistance 100% après redémarrage
- [ ] **SC-008**: Intégration en < 30 minutes (90% devs)
- [ ] **SC-009**: Dashboard affiche status en < 3 secondes
- [ ] **SC-010**: Logs diagnostiquent 95% des problèmes

---

## 🛠️ Prochaines Étapes

### Démarrer l'Implémentation

1. **Créer la structure de base**
   ```bash
   mkdir -p backend/src/{api,services,models,middleware,database,utils}
   mkdir -p dashboard/src/{components,api}
   mkdir -p docker docs data
   ```

2. **Initialiser les packages**
   ```bash
   # Backend
   cd backend
   npm init -y
   npm install express whatsapp-web.js better-sqlite3 qrcode \
     express-rate-limit helmet cors winston uuid

   # Dashboard
   cd ../dashboard
   npm create vite@latest . -- --template react
   npm install axios
   npm install -D tailwindcss autoprefixer postcss
   ```

3. **Créer les fichiers Docker**
   - Copier `Dockerfile` et `docker-compose.yml` depuis le plan

4. **Commencer Phase 1**
   - Suivre les tâches détaillées dans [plan.md](./plan.md#phase-1-mvp-core-p1---3-4-jours-)

---

## 📚 Ressources

### Documentation Externe
- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js)
- [Express.js](https://expressjs.com/)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [React](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)

### API Reference (Future)
Sera généré automatiquement via Swagger en Phase 4

---

## ⚠️ Notes Importantes

### Limitations WhatsApp
- Risque de ban si envoi massif (respecter rate limit 50/min)
- 1 numéro = 1 session (pas de partage)
- Sessions non migrables entre serveurs

### Sécurité
- API Key requise pour tous les endpoints
- HTTPS obligatoire en production (via reverse proxy)
- Dashboard doit être protégé si exposé publiquement

### Performance
- 1 conteneur = ~10-20 sessions confortablement
- ~100MB RAM par session WhatsApp
- SQLite suffisant pour <100k messages

---

## 📞 Support

Pour questions ou problèmes:
1. Consulter [ARCHITECTURE.md](./ARCHITECTURE.md) pour détails techniques
2. Vérifier les logs: `docker-compose logs -f`
3. Tester health check: `curl http://localhost:3000/health`

---

**Status**: Documentation complète ✅  
**Next**: Commencer Phase 1 - MVP Core  
**Durée estimée**: 9-13 jours de développement
