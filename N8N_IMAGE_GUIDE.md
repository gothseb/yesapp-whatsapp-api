# Guide n8n - Envoi d'Images WhatsApp

Guide complet pour envoyer des images via YesApp API avec n8n.

## 📋 Table des Matières

- [Méthode 1: Image depuis URL (Simple)](#méthode-1-image-depuis-url-simple)
- [Méthode 2: Image Base64 (Avancée)](#méthode-2-image-base64-avancée)
- [Configuration des Headers](#configuration-des-headers)
- [Exemples Pratiques](#exemples-pratiques)
- [Troubleshooting](#troubleshooting)

---

## Méthode 1: Image depuis URL (Simple)

### ✅ Avantages
- Simple et rapide
- Pas de traitement d'image nécessaire
- Économise de la bande passante

### 📝 Configuration HTTP Request

**Paramètres de Base:**
```
Method: POST
URL: https://l8g04s04scsw0so8ss8ckcoc.yourdomain.com/api/v1/sessions/YOUR_SESSION_ID/messages
```

**Headers:**
| Name | Value |
|------|-------|
| X-API-Key | `0dbcbe012f8e37a1313263e60ff215c51bf40863d4ece233be50a78d0a5e2a66` |
| Content-Type | `application/json` |

**Body (JSON):**
```json
{
  "to": "33612345678",
  "text": "Légende de l'image (optionnel)",
  "media": {
    "url": "https://example.com/image.jpg"
  }
}
```

### 🎯 Exemple avec Variables n8n

```json
{
  "to": "{{ $json.phoneNumber }}",
  "text": "{{ $json.caption }}",
  "media": {
    "url": "{{ $json.imageUrl }}"
  }
}
```

---

## Méthode 2: Image Base64 (Avancée)

### ✅ Avantages
- Fonctionne avec des images locales
- Permet de modifier l'image avant l'envoi
- Contrôle total sur le contenu

### 📝 Workflow en 2 Étapes

#### Étape 1: Télécharger l'Image

**Nœud: HTTP Request**
```
Method: GET
URL: https://example.com/image.jpg
Response Format: File
Binary Property: data
```

#### Étape 2: Envoyer via WhatsApp

**Nœud: HTTP Request**

**Headers:**
| Name | Value |
|------|-------|
| X-API-Key | `0dbcbe012f8e37a1313263e60ff215c51bf40863d4ece233be50a78d0a5e2a66` |
| Content-Type | `application/json` |

**Body (JSON):**
```json
{
  "to": "33612345678",
  "text": "Voici votre image",
  "media": {
    "mimetype": "image/jpeg",
    "data": "{{ $binary.data.toString('base64') }}"
  }
}
```

---

## Configuration des Headers

### Dans n8n HTTP Request Node

**Option 1: Headers Section**
1. Activez "Send Headers"
2. Ajoutez:
   - Name: `X-API-Key`
   - Value: `0dbcbe012f8e37a1313263e60ff215c51bf40863d4ece233be50a78d0a5e2a66`

**Option 2: Authentication (Generic Credential)**
1. Authentication: `Generic Credential Type`
2. Generic Auth Type: `Header Auth`
3. Credential for Header Auth:
   - Name: `X-API-Key`
   - Value: `0dbcbe012f8e37a1313263e60ff215c51bf40863d4ece233be50a78d0a5e2a66`

---

## Exemples Pratiques

### Exemple 1: Image Simple

```json
{
  "to": "33612345678",
  "media": {
    "url": "https://picsum.photos/800/600"
  }
}
```

### Exemple 2: Image avec Légende

```json
{
  "to": "33612345678",
  "text": "🎉 Nouvelle promotion !",
  "media": {
    "url": "https://example.com/promo.jpg"
  }
}
```

### Exemple 3: Image depuis Google Drive (Public)

```json
{
  "to": "33612345678",
  "text": "Document ci-joint",
  "media": {
    "url": "https://drive.google.com/uc?export=download&id=FILE_ID"
  }
}
```

### Exemple 4: Image Générée par AI

**Workflow:**
1. **OpenAI Node** → Génère une image
2. **HTTP Request** → Envoie l'image via YesApp

```json
{
  "to": "{{ $json.recipient }}",
  "text": "Votre image générée par IA",
  "media": {
    "url": "{{ $node['OpenAI'].json.data[0].url }}"
  }
}
```

---

## Types de Médias Supportés

| Type | Extension | Mimetype |
|------|-----------|----------|
| Image | .jpg, .jpeg | image/jpeg |
| Image | .png | image/png |
| Image | .gif | image/gif |
| Image | .webp | image/webp |

---

## Variables n8n Utiles

### Accéder aux Données Précédentes

```javascript
// Node précédent
{{ $json.fieldName }}

// Node spécifique
{{ $node['NodeName'].json.fieldName }}

// Données binaires en base64
{{ $binary.data.toString('base64') }}

// Premier élément d'un array
{{ $json.items[0].imageUrl }}
```

---

## Troubleshooting

### ❌ Erreur: Invalid media URL

**Cause:** URL non accessible ou format invalide

**Solution:**
- Vérifiez que l'URL est publique
- Testez l'URL dans un navigateur
- Assurez-vous que l'extension est supportée

### ❌ Erreur: 401 Unauthorized

**Cause:** API Key manquante ou invalide

**Solution:**
```json
Headers:
  X-API-Key: 0dbcbe012f8e37a1313263e60ff215c51bf40863d4ece233be50a78d0a5e2a66
```

### ❌ Erreur: Image trop grande

**Cause:** WhatsApp limite la taille des images

**Solution:**
- Maximum: 16MB
- Résolution recommandée: 1920x1080
- Compressez l'image avant l'envoi

### ❌ Erreur: Base64 invalide

**Cause:** Encodage incorrect

**Solution:**
```javascript
// Correct
{{ $binary.data.toString('base64') }}

// Incorrect
{{ $binary.data }}
```

---

## 🎯 Template Complet n8n

### Nœud HTTP Request - Configuration Complète

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HTTP Request Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Method: POST

URL: https://l8g04s04scsw0so8ss8ckcoc.yourdomain.com/api/v1/sessions/{{ $json.sessionId }}/messages

Authentication: None

━━━ Headers ━━━
☑ Send Headers
  ├─ Name: X-API-Key
  └─ Value: 0dbcbe012f8e37a1313263e60ff215c51bf40863d4ece233be50a78d0a5e2a66

━━━ Body ━━━
☑ Send Body
Body Content Type: JSON

{
  "to": "{{ $json.phoneNumber }}",
  "text": "{{ $json.message }}",
  "media": {
    "url": "{{ $json.imageUrl }}"
  }
}

━━━ Options ━━━
Response Format: JSON
Timeout: 30000
```

---

## 📊 Workflow Complet Exemple

```
┌─────────────┐
│   Webhook   │ ← Reçoit: phoneNumber, imageUrl, message
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ HTTP Request│ ← POST vers YesApp API
│ (Send Image)│
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Response  │ ← Retourne: messageId, status
└─────────────┘
```

---

## 🔐 Sécurité

### Stocker l'API Key

**Option 1: Credential n8n**
1. Credentials → New
2. Header Auth
3. Name: `YesApp-API-Key`
4. Header Name: `X-API-Key`
5. Header Value: `0dbc...2a66`

**Option 2: Environment Variable**
```javascript
{{ $env.YESAPP_API_KEY }}
```

---

## 📚 Ressources

- [Documentation YesApp API](../README.md)
- [Exemples de Workflows](../n8n-examples/)
- [Guide d'Intégration n8n](../N8N_INTEGRATION_GUIDE.md)

---

## ✅ Checklist

- [ ] API Key configurée
- [ ] Session WhatsApp active
- [ ] URL d'image accessible
- [ ] Headers correctement configurés
- [ ] Format JSON valide
- [ ] Numéro au format international
- [ ] Test effectué

---

**Besoin d'aide?** Consultez le [guide de troubleshooting](../DOCKER_TROUBLESHOOTING.md)
