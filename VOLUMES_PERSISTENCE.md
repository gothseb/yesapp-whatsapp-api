# 💾 Guide de Persistance des Sessions WhatsApp

## 🎯 Objectif

Assurer que les **sessions WhatsApp restent actives** même après un redéploiement du serveur.

---

## 📌 Principe de Persistance

Les sessions WhatsApp sont stockées dans `/app/data/sessions` à l'intérieur du container. Pour qu'elles survivent aux redéploiements, ce dossier doit être monté sur un **volume Docker persistant**.

---

## ✅ Configuration Docker Compose

### Volumes Nommés (Recommandé pour Production)

Les fichiers docker-compose sont maintenant configurés avec des volumes nommés :

```yaml
services:
  backend:
    volumes:
      - backend-data:/app/data  # ✅ Volume persistant

volumes:
  backend-data:
    driver: local
```

**Avantages:**
- ✅ Persiste entre les redéploiements
- ✅ Géré automatiquement par Docker
- ✅ Compatible avec Coolify et tous les orchestrateurs

---

## 🚀 Déploiement sur Coolify

### Configuration Automatique

Coolify gère automatiquement les volumes nommés définis dans votre `docker-compose.yml`. **Vous n'avez rien à configurer manuellement!**

### Vérification

1. **Déployez votre application** sur Coolify
2. **Créez une session WhatsApp** et scannez le QR code
3. **Redéployez l'application** (git push ou bouton Deploy)
4. **Vérifiez** que la session est toujours connectée ✅

---

## 📊 Structure des Données Persistantes

```
/app/data/
├── db.sqlite              # Base de données (API keys, etc.)
└── sessions/
    ├── session-id-1/      # Session WhatsApp 1
    │   ├── Default/
    │   └── ...
    └── session-id-2/      # Session WhatsApp 2
        ├── Default/
        └── ...
```

**Ce qui est sauvegardé:**
- ✅ Authentification WhatsApp (pas besoin de rescanner le QR)
- ✅ Base de données SQLite (API keys)
- ✅ Historique des sessions

---

## 🔧 Commandes Utiles

### Vérifier le Volume

```bash
# Lister les volumes
docker volume ls | grep backend-data

# Inspecter le volume
docker volume inspect <project>_backend-data
```

### Backup Manuel

```bash
# Créer un backup
docker run --rm \
  -v <project>_backend-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/backup-$(date +%Y%m%d).tar.gz -C /data .

# Restaurer un backup
docker run --rm \
  -v <project>_backend-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/backup-20241116.tar.gz -C /data
```

---

## 🐛 Troubleshooting

### Session Perdue Après Redéploiement

**Symptôme:** Après un redéploiement, il faut rescanner le QR code.

**Causes Possibles:**
1. Le volume n'est pas persistant
2. Le container utilise un chemin différent
3. Le volume a été supprimé

**Solutions:**

#### 1. Vérifier la Configuration du Volume

```bash
# Dans docker-compose.yml
volumes:
  - backend-data:/app/data  # ✅ Volume nommé
  # PAS: ./data:/app/data    # ❌ Bind mount local
```

#### 2. Vérifier que le Volume Existe

```bash
docker volume ls | grep backend-data
```

Si le volume n'existe pas, il sera créé au premier déploiement.

#### 3. Vérifier les Logs

```bash
docker logs yesapp-backend | grep "Sessions path"
```

Devrait afficher:
```
📱 WhatsApp Service initialized
   Sessions path: /app/data/sessions
```

---

## 🔒 Coolify - Configuration Avancée

### Volumes Persistants dans Coolify

Coolify gère automatiquement les volumes nommés, mais vous pouvez aussi:

#### Option 1: Volumes Automatiques (Recommandé)
- Coolify détecte les volumes dans docker-compose
- Les volumes sont créés automatiquement
- Ils persistent entre les déploiements ✅

#### Option 2: Backup Automatique dans Coolify

1. **Dashboard Coolify** → Votre Service → **Backups**
2. **Enable Backups** ✅
3. **Fréquence**: Daily/Weekly
4. **Destination**: S3, Local, etc.

---

## 📈 Monitoring de la Persistance

### Vérifier que la Session est Sauvegardée

```bash
# Accéder au container
docker exec -it yesapp-backend sh

# Vérifier les sessions
ls -la /app/data/sessions/

# Devrait afficher les dossiers de session
```

### API pour Vérifier les Sessions

```bash
curl -H "X-API-Key: YOUR_KEY" \
  https://yourdomain.com/api/v1/sessions
```

Retourne la liste des sessions avec leur statut de connexion.

---

## 🎯 Checklist de Persistance

- [ ] `docker-compose.yml` utilise un volume nommé `backend-data:/app/data`
- [ ] Variable `SESSIONS_PATH=/app/data/sessions` configurée
- [ ] Session WhatsApp créée et QR code scanné
- [ ] Application redéployée (test)
- [ ] Session toujours connectée après redéploiement ✅
- [ ] Backup automatique configuré (optionnel)

---

## 💡 Bonnes Pratiques

### 1. Ne Jamais Supprimer le Volume Manuellement

```bash
# ❌ DANGER: Supprime toutes les sessions
docker volume rm <project>_backend-data
```

### 2. Backup Régulier

Configurez des backups automatiques via Coolify ou scripts cron.

### 3. Monitoring

Surveillez l'espace disque du volume:

```bash
docker system df -v | grep backend-data
```

---

## 📚 Ressources

- [Docker Volumes Documentation](https://docs.docker.com/storage/volumes/)
- [Coolify Volume Management](https://coolify.io/docs/knowledge-base/docker/volumes)
- [whatsapp-web.js Sessions](https://github.com/pedroslopez/whatsapp-web.js)

---

## ✅ Résumé

**Avec la configuration actuelle:**

✅ **Les sessions WhatsApp persistent automatiquement entre les redéploiements**

✅ **Vous n'avez pas besoin de rescanner le QR code après un redéploiement**

✅ **Coolify gère automatiquement les volumes persistants**

**Il suffit de déployer et d'utiliser!** 🎉
