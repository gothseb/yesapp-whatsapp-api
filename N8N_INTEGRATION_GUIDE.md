# 🔗 Guide d'Intégration n8n - YesApp WhatsApp API

Guide complet pour utiliser l'API YesApp avec n8n via des nodes HTTP Request.

---

## 📋 Prérequis

1. **Backend YesApp** opérationnel sur `http://localhost:3000`
2. **Session WhatsApp** créée et connectée (badge vert dans le dashboard)
3. **API Key** disponible (voir `backend/create-api-key.js`)

---

## 🔑 Configuration Globale n8n

### Créer une Credential pour l'API Key

1. Dans n8n, allez dans **Settings** → **Credentials**
2. Créez une nouvelle credential de type **Header Auth**
3. Configurez:
   - **Name**: `YesApp WhatsApp API`
   - **Header Name**: `X-API-Key`
   - **Header Value**: `votre-api-key-ici`

**OU** utilisez directement le header dans chaque node HTTP Request.

---

## 📤 1. ENVOYER UN MESSAGE TEXTE

### Configuration du Node HTTP Request

```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/v1/sessions/{{$json.sessionId}}/messages",
  "authentication": "headerAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "X-API-Key",
        "value": "b55c6b026c40893309c4a4058cdb6bbdaff2e5b1c49315bbf297f4b360242043"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "bodyParameters": {
    "parameters": [
      {
        "name": "to",
        "value": "={{$json.phoneNumber}}"
      },
      {
        "name": "text",
        "value": "={{$json.message}}"
      }
    ]
  }
}
```

### Exemple de Données d'Entrée

```json
{
  "sessionId": "votre-session-id-ici",
  "phoneNumber": "+33612345678",
  "message": "Bonjour depuis n8n!"
}
```

### JSON Body Complet (Alternative)

Si vous préférez utiliser le mode JSON Body:

```json
{
  "to": "+33612345678",
  "text": "Bonjour depuis n8n! 🚀"
}
```

**URL**: `http://localhost:3000/api/v1/sessions/YOUR_SESSION_ID/messages`

---

## 📸 2. ENVOYER UNE IMAGE

### Configuration du Node HTTP Request

```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/v1/sessions/{{$json.sessionId}}/messages",
  "authentication": "headerAuth",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "X-API-Key",
        "value": "b55c6b026c40893309c4a4058cdb6bbdaff2e5b1c49315bbf297f4b360242043"
      },
      {
        "name": "Content-Type",
        "value": "application/json"
      }
    ]
  },
  "sendBody": true,
  "bodyContentType": "json",
  "body": {
    "to": "={{$json.phoneNumber}}",
    "text": "={{$json.caption}}",
    "media": {
      "type": "image",
      "mimetype": "image/jpeg",
      "data": "={{$json.imageBase64}}",
      "filename": "image.jpg"
    }
  }
}
```

### Exemple avec Image Base64

```json
{
  "to": "+33612345678",
  "text": "Voici une image!",
  "media": {
    "type": "image",
    "mimetype": "image/jpeg",
    "data": "/9j/4AAQSkZJRgABAQEAYABgAAD...",
    "filename": "photo.jpg"
  }
}
```

**Note**: Le champ `data` doit contenir l'image encodée en Base64 (sans le préfixe `data:image/jpeg;base64,`)

---

## 🔄 3. WORKFLOW n8n COMPLET - MESSAGE TEXTE

### Workflow Simple

```json
{
  "nodes": [
    {
      "parameters": {
        "values": {
          "string": [
            {
              "name": "sessionId",
              "value": "4e6d01f2-d9c9-4041-8625-7c23f5048069"
            },
            {
              "name": "phoneNumber",
              "value": "+33612345678"
            },
            {
              "name": "message",
              "value": "Test depuis n8n!"
            }
          ]
        }
      },
      "name": "Set Variables",
      "type": "n8n-nodes-base.set",
      "position": [250, 300]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "=http://localhost:3000/api/v1/sessions/{{$node['Set Variables'].json.sessionId}}/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "b55c6b026c40893309c4a4058cdb6bbdaff2e5b1c49315bbf297f4b360242043"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "to",
              "value": "={{$json.phoneNumber}}"
            },
            {
              "name": "text",
              "value": "={{$json.message}}"
            }
          ]
        }
      },
      "name": "Send WhatsApp Message",
      "type": "n8n-nodes-base.httpRequest",
      "position": [450, 300]
    }
  ],
  "connections": {
    "Set Variables": {
      "main": [
        [
          {
            "node": "Send WhatsApp Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

---

## 🖼️ 4. WORKFLOW n8n - ENVOYER IMAGE DEPUIS URL

### Étapes du Workflow

1. **Download Image** (HTTP Request)
2. **Convert to Base64** (Code Node)
3. **Send to WhatsApp** (HTTP Request)

### Node 1: Download Image

```json
{
  "name": "Download Image",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "GET",
    "url": "https://example.com/image.jpg",
    "responseFormat": "file"
  }
}
```

### Node 2: Convert to Base64

```javascript
// Code Node (JavaScript)
const binaryData = items[0].binary.data;
const base64String = binaryData.data;

return [
  {
    json: {
      imageBase64: base64String,
      phoneNumber: "+33612345678",
      caption: "Image envoyée depuis n8n!",
      sessionId: "votre-session-id"
    }
  }
];
```

### Node 3: Send WhatsApp Message

```json
{
  "name": "Send WhatsApp Image",
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "=http://localhost:3000/api/v1/sessions/{{$json.sessionId}}/messages",
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "X-API-Key",
          "value": "b55c6b026c40893309c4a4058cdb6bbdaff2e5b1c49315bbf297f4b360242043"
        },
        {
          "name": "Content-Type",
          "value": "application/json"
        }
      ]
    },
    "sendBody": true,
    "bodyContentType": "json",
    "body": "={\"to\": \"{{$json.phoneNumber}}\", \"text\": \"{{$json.caption}}\", \"media\": {\"type\": \"image\", \"mimetype\": \"image/jpeg\", \"data\": \"{{$json.imageBase64}}\", \"filename\": \"image.jpg\"}}"
  }
}
```

---

## 📝 5. EXEMPLES CURL (pour tester)

### Message Texte

```bash
curl -X POST http://localhost:3000/api/v1/sessions/YOUR_SESSION_ID/messages \
  -H "X-API-Key: b55c6b026c40893309c4a4058cdb6bbdaff2e5b1c49315bbf297f4b360242043" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+33612345678",
    "text": "Bonjour depuis curl!"
  }'
```

### Message avec Image

```bash
curl -X POST http://localhost:3000/api/v1/sessions/YOUR_SESSION_ID/messages \
  -H "X-API-Key: b55c6b026c40893309c4a4058cdb6bbdaff2e5b1c49315bbf297f4b360242043" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+33612345678",
    "text": "Voici une image",
    "media": {
      "type": "image",
      "mimetype": "image/jpeg",
      "data": "VOTRE_BASE64_ICI",
      "filename": "photo.jpg"
    }
  }'
```

---

## 🔍 6. OBTENIR VOTRE SESSION ID

### Via n8n HTTP Request

```json
{
  "method": "GET",
  "url": "http://localhost:3000/api/v1/sessions",
  "sendHeaders": true,
  "headerParameters": {
    "parameters": [
      {
        "name": "X-API-Key",
        "value": "b55c6b026c40893309c4a4058cdb6bbdaff2e5b1c49315bbf297f4b360242043"
      }
    ]
  }
}
```

**Réponse**:
```json
{
  "success": true,
  "sessions": [
    {
      "id": "4e6d01f2-d9c9-4041-8625-7c23f5048069",
      "name": "Mon WhatsApp",
      "status": "connected",
      "phone_number": "+33612345678"
    }
  ]
}
```

Utilisez le `id` dans vos workflows!

---

## ⚡ 7. WORKFLOW AVANCÉ - Envoi en Masse

### Workflow avec Boucle

1. **Spreadsheet/Database** → Liste de contacts
2. **Split In Batches** → Traitement par lots
3. **HTTP Request** → Envoi WhatsApp
4. **Wait** → Pause 2 secondes (respect rate limit)

```json
{
  "nodes": [
    {
      "name": "Google Sheets",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "read",
        "sheetId": "your-sheet-id",
        "range": "A:B"
      }
    },
    {
      "name": "Split In Batches",
      "type": "n8n-nodes-base.splitInBatches",
      "parameters": {
        "batchSize": 1
      }
    },
    {
      "name": "Wait 2 seconds",
      "type": "n8n-nodes-base.wait",
      "parameters": {
        "amount": 2
      }
    },
    {
      "name": "Send WhatsApp",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://localhost:3000/api/v1/sessions/YOUR_SESSION_ID/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "YOUR_API_KEY"
            }
          ]
        },
        "bodyContentType": "json",
        "body": "={\"to\": \"{{$json.phone}}\", \"text\": \"{{$json.message}}\"}"
      }
    }
  ]
}
```

---

## 🛡️ 8. GESTION DES ERREURS

### Codes de Réponse

| Code | Signification | Action |
|------|---------------|--------|
| 200 | Succès | Message envoyé ✅ |
| 400 | Validation error | Vérifier format numéro (E.164) |
| 401 | Unauthorized | Vérifier API Key |
| 404 | Session not found | Vérifier Session ID |
| 429 | Rate limit | Attendre, ralentir envois |
| 503 | Service unavailable | Session déconnectée |

### Exemple de Gestion d'Erreur dans n8n

Ajoutez un node **IF** après l'HTTP Request:

```json
{
  "name": "Check Success",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "boolean": [
        {
          "value1": "={{$json.success}}",
          "value2": true
        }
      ]
    }
  }
}
```

---

## 📊 9. VARIABLES D'ENVIRONNEMENT n8n

Pour faciliter la maintenance, utilisez des variables:

```javascript
// Dans un Code Node au début du workflow
const config = {
  apiKey: 'b55c6b026c40893309c4a4058cdb6bbdaff2e5b1c49315bbf297f4b360242043',
  baseUrl: 'http://localhost:3000/api/v1',
  sessionId: '4e6d01f2-d9c9-4041-8625-7c23f5048069'
};

return [{ json: { config } }];
```

Puis utilisez `{{$node["Config"].json.config.apiKey}}` dans vos nodes.

---

## ✅ 10. CHECKLIST DE DÉMARRAGE

- [ ] Backend YesApp démarré (`npm run dev` dans `backend/`)
- [ ] Session WhatsApp créée et connectée (via dashboard)
- [ ] API Key notée
- [ ] Session ID récupéré (via dashboard ou API `/sessions`)
- [ ] Credential n8n créée (optionnel)
- [ ] Premier workflow testé avec message texte
- [ ] Workflow image testé (si besoin)

---

## 🎯 EXEMPLE RAPIDE - COPIER-COLLER

### Configuration HTTP Request n8n (Message Texte)

**Method**: POST  
**URL**: `http://localhost:3000/api/v1/sessions/4e6d01f2-d9c9-4041-8625-7c23f5048069/messages`

**Headers**:
```
X-API-Key: b55c6b026c40893309c4a4058cdb6bbdaff2e5b1c49315bbf297f4b360242043
Content-Type: application/json
```

**Body (JSON)**:
```json
{
  "to": "+33612345678",
  "text": "Message test depuis n8n!"
}
```

**Remplacez**:
- `4e6d01f2-d9c9-4041-8625-7c23f5048069` → Votre Session ID
- `b55c6b026c40893309c4a4058cdb6bbdaff2e5b1c49315bbf297f4b360242043` → Votre API Key
- `+33612345678` → Numéro destinataire

---

## 💡 CONSEILS

1. **Rate Limiting**: L'API limite à 50 messages/minute. Ajoutez des pauses entre envois.
2. **Format Numéro**: Toujours utiliser le format E.164 (`+33612345678`)
3. **Session Status**: Vérifiez que la session est "connected" avant d'envoyer
4. **Images**: Limitez la taille (< 5 MB recommandé)
5. **Test**: Testez d'abord avec curl avant de créer le workflow n8n

---

## 🆘 Support

- **API Documentation**: Consultez `QUICK_START.md`
- **Dashboard**: http://localhost:5173
- **API Health**: http://localhost:3000/health
- **Sessions List**: http://localhost:3000/api/v1/sessions

---

**Prêt à automatiser vos messages WhatsApp avec n8n!** 🚀
