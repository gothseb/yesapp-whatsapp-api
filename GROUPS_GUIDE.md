# 📱 Guide - Envoyer des Messages dans les Groupes WhatsApp

Guide complet pour envoyer des messages dans les groupes WhatsApp avec YesApp API.

---

## 🔍 Comprendre les IDs de Groupes WhatsApp

### Format des IDs

WhatsApp utilise deux types d'identifiants:

- **Contacts individuels**: `33612345678@c.us` (se termine par `@c.us`)
- **Groupes**: `120363XXXXXXXXXX@g.us` (se termine par `@g.us`)

**Important**: Les IDs de groupes WhatsApp commencent généralement par `120363` et sont suivis de chiffres aléatoires.

---

## 📋 Étape 1: Obtenir l'ID d'un Groupe

### Option A: Via l'API (Route à Ajouter)

```bash
# Liste tous les groupes de la session
curl -X GET http://localhost:3000/api/v1/sessions/YOUR_SESSION_ID/groups \
  -H "X-API-Key: YOUR_API_KEY"
```

**Réponse**:
```json
{
  "success": true,
  "groups": [
    {
      "id": "120363023412345678@g.us",
      "name": "Ma Famille",
      "participants": 15,
      "isAdmin": true
    },
    {
      "id": "120363098765432109@g.us",
      "name": "Équipe Projet",
      "participants": 8,
      "isAdmin": false
    }
  ]
}
```

### Option B: Via le Code (Console)

Ajoutez temporairement ce code dans votre backend:

```javascript
// Dans backend/list-groups.js
import { getSessionService } from './src/services/session.service.js';

const sessionId = 'VOTRE_SESSION_ID';
const sessionService = getSessionService();
const client = sessionService.getWhatsAppClient(sessionId);

if (client) {
  const chats = await client.getChats();
  const groups = chats.filter(chat => chat.isGroup);
  
  console.log('\n📱 Groupes disponibles:\n');
  groups.forEach(group => {
    console.log(`Name: ${group.name}`);
    console.log(`ID: ${group.id._serialized}`);
    console.log(`Participants: ${group.participants.length}`);
    console.log('---');
  });
}
```

Exécutez:
```bash
cd backend
node list-groups.js
```

### Option C: Depuis WhatsApp Web

1. Ouvrez WhatsApp Web dans votre navigateur
2. Ouvrez le groupe
3. Dans la console développeur (F12):
```javascript
// Récupérer l'ID du groupe actuel
Store.Chat.models.find(c => c.isGroup && c.id._serialized)
```

---

## 📤 Étape 2: Envoyer un Message dans un Groupe

### Méthode 1: Format Complet (Recommandé)

Utilisez directement l'ID du groupe avec `@g.us`:

```bash
curl -X POST http://localhost:3000/api/v1/sessions/YOUR_SESSION_ID/messages \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "120363023412345678@g.us",
    "text": "Bonjour à tous! 👋"
  }'
```

### Méthode 2: Avec Numéro de Groupe

Si vous connaissez le numéro du groupe (sans @g.us):

```bash
curl -X POST http://localhost:3000/api/v1/sessions/YOUR_SESSION_ID/messages \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "120363023412345678",
    "isGroup": true,
    "text": "Message pour le groupe!"
  }'
```

---

## 🔧 Étape 3: Configuration n8n pour Groupes

### Workflow Simple - Message Texte

```json
{
  "nodes": [
    {
      "name": "Set Group Config",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": [
            {
              "name": "sessionId",
              "value": "YOUR_SESSION_ID"
            },
            {
              "name": "groupId",
              "value": "120363023412345678@g.us"
            },
            {
              "name": "message",
              "value": "Message automatique depuis n8n! 🤖"
            },
            {
              "name": "apiKey",
              "value": "YOUR_API_KEY"
            }
          ]
        }
      }
    },
    {
      "name": "Send to WhatsApp Group",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "=http://localhost:3000/api/v1/sessions/{{$json.sessionId}}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "={{$json.apiKey}}"
            },
            {
              "name": "Content-Type",
              "value": "application/json"
            }
          ]
        },
        "sendBody": true,
        "bodyContentType": "json",
        "body": "={\"to\": \"{{$json.groupId}}\", \"text\": \"{{$json.message}}\"}"
      }
    }
  ]
}
```

### Workflow Avancé - Message avec Mention

```json
{
  "to": "120363023412345678@g.us",
  "text": "@33612345678 Salut! Voici une notification importante.",
  "mentions": ["33612345678@c.us"]
}
```

---

## 📸 Envoyer une Image dans un Groupe

### Via n8n

```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/v1/sessions/SESSION_ID/messages",
  "headers": {
    "X-API-Key": "YOUR_KEY",
    "Content-Type": "application/json"
  },
  "body": {
    "to": "120363023412345678@g.us",
    "text": "Voici l'image demandée!",
    "media": {
      "type": "image",
      "mimetype": "image/jpeg",
      "data": "BASE64_IMAGE_DATA",
      "filename": "photo.jpg"
    }
  }
}
```

---

## 🛠️ Modification du Backend (Support Groupes)

### 1. Mettre à jour la Validation

```@N:\windsurf\yesapp\yesapp\backend\src\middleware\validation.middleware.js```

Ajoutez la validation pour les IDs de groupes:

```javascript
// Valider le destinataire (contact ou groupe)
validateRecipient(req, res, next) {
  const { to, isGroup } = req.body;

  if (!to) {
    return res.status(400).json({
      success: false,
      error: 'Recipient "to" is required',
    });
  }

  // Si c'est un groupe (se termine par @g.us)
  if (to.includes('@g.us')) {
    // Format groupe valide
    const groupRegex = /^\d+@g\.us$/;
    if (!groupRegex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid group ID format. Expected: 120363XXXXX@g.us',
      });
    }
  } 
  // Sinon, valider comme numéro de téléphone
  else if (!to.includes('@c.us')) {
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    if (!e164Regex.test(to)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number. Use E.164 format (e.g., +33612345678)',
      });
    }
  }

  next();
}
```

### 2. Mettre à jour le Service de Messages

```@N:\windsurf\yesapp\yesapp\backend\src\services\message.service.js```

Modifiez la fonction `sendMessage`:

```javascript
async sendMessage(sessionId, to, text) {
  // ... (code existant) ...

  // Déterminer si c'est un groupe ou un contact
  let formattedRecipient;
  
  if (to.includes('@g.us')) {
    // C'est déjà un ID de groupe
    formattedRecipient = to;
  } else if (to.includes('@c.us')) {
    // C'est déjà un ID de contact
    formattedRecipient = to;
  } else {
    // C'est un numéro de téléphone, ajouter @c.us
    formattedRecipient = to.replace('+', '') + '@c.us';
  }

  console.log(`   📍 Sending to: ${formattedRecipient}`);

  // Envoyer via WhatsApp
  const sentMessage = await client.sendMessage(formattedRecipient, text);
  
  // ... (reste du code) ...
}
```

### 3. Ajouter une Route pour Lister les Groupes

Créez ```backend/src/api/groups.js```:

```javascript
import express from 'express';
import { getSessionService } from '../services/session.service.js';

const router = express.Router();
const sessionService = getSessionService();

// GET /sessions/:sessionId/groups - Liste les groupes
router.get('/:sessionId/groups', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const client = sessionService.getWhatsAppClient(sessionId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or not connected',
      });
    }

    // Récupérer tous les chats
    const chats = await client.getChats();
    
    // Filtrer uniquement les groupes
    const groups = chats
      .filter(chat => chat.isGroup)
      .map(group => ({
        id: group.id._serialized,
        name: group.name,
        participants: group.participants.length,
        isAdmin: group.participants.find(p => p.id._serialized === client.info.wid._serialized)?.isAdmin || false,
        timestamp: group.timestamp,
      }));

    res.json({
      success: true,
      count: groups.length,
      groups,
    });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
```

Puis dans ```backend/src/index.js```, ajoutez:

```javascript
import groupsRoutes from './api/groups.js';

// ... autres routes ...
app.use('/api/v1/sessions', groupsRoutes);
```

---

## 🎯 Exemples Pratiques

### Exemple 1: Notification Quotidienne dans un Groupe

```javascript
// n8n workflow: Cron → HTTP Request
{
  "to": "120363023412345678@g.us",
  "text": "📅 Rappel quotidien: N'oubliez pas la réunion à 14h!"
}
```

### Exemple 2: Partager une Image dans un Groupe

```javascript
{
  "to": "120363023412345678@g.us",
  "text": "📸 Photo de l'événement d'hier",
  "media": {
    "type": "image",
    "mimetype": "image/jpeg",
    "data": "...", // Base64
    "filename": "event.jpg"
  }
}
```

### Exemple 3: Message avec Mentions

```javascript
{
  "to": "120363023412345678@g.us",
  "text": "@33612345678 @33698765432 Merci pour votre aide!",
  "mentions": [
    "33612345678@c.us",
    "33698765432@c.us"
  ]
}
```

---

## ⚠️ Limitations et Bonnes Pratiques

### Limitations WhatsApp

1. **Envoi en masse**: Évitez d'envoyer trop de messages trop rapidement
2. **Spam**: WhatsApp peut bloquer votre compte si vous spammez
3. **Permissions**: Vous devez être membre du groupe pour y envoyer des messages
4. **Mentions**: Les mentions ne fonctionnent que dans les groupes

### Bonnes Pratiques

1. **Rate Limiting**: Espacez vos messages (2-3 secondes entre chaque)
2. **Vérification**: Vérifiez que vous êtes membre du groupe avant d'envoyer
3. **Gestion d'erreurs**: Gérez les cas où le groupe n'existe plus
4. **Logs**: Loguez tous les envois pour le debugging

---

## 🆘 Dépannage

### Erreur: "Group not found"
- Vérifiez que l'ID du groupe est correct
- Assurez-vous que vous êtes toujours membre du groupe
- Le groupe n'a peut-être pas été supprimé

### Erreur: "Forbidden"
- Vous n'êtes plus membre du groupe
- Ou vous avez été banni du groupe

### Message non reçu
- Vérifiez que le groupe existe
- Vérifiez votre connexion WhatsApp
- Attendez quelques secondes et réessayez

---

## ✅ Checklist de Configuration

- [ ] Backend modifié pour supporter les groupes
- [ ] Validation mise à jour (groupes + contacts)
- [ ] Route `/groups` ajoutée
- [ ] Liste des groupes récupérée via API
- [ ] ID de groupe copié
- [ ] Test d'envoi réussi dans un groupe
- [ ] Workflow n8n configuré pour les groupes

---

## 📚 Ressources

- **Documentation API**: `N8N_INTEGRATION_GUIDE.md`
- **Guide Général**: `QUICK_START.md`
- **Exemples n8n**: `n8n-examples/`

---

**Vous pouvez maintenant automatiser vos messages dans les groupes WhatsApp!** 🚀
