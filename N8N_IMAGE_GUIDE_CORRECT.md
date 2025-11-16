# 📸 Guide n8n - Envoi d'Images WhatsApp (CORRIGÉ)

**⚠️ IMPORTANT:** L'API YesApp nécessite les images en **base64**, pas en URL!

---

## 🎯 Format Correct de l'API

### Requis pour les Images

```json
{
  "to": "+33612345678",
  "text": "Légende optionnelle",
  "media": {
    "type": "image",           // REQUIS
    "data": "base64_string",   // REQUIS - Image en base64
    "mimetype": "image/jpeg",  // REQUIS
    "filename": "photo.jpg"    // Optionnel
  }
}
```

---

## ✅ Workflow n8n Correct (2 Nœuds)

### Nœud 1: Télécharger l'Image

**Node Type:** HTTP Request

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HTTP Request - Download Image
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Method: GET

URL: https://picsum.photos/800/600
(ou votre URL d'image)

━━━ Response ━━━
Response Format: File ✓

━━━ Download File ━━━
☑ Binary Property: data
```

**Résultat:** L'image est stockée dans `$binary.data`

---

### Nœud 2: Envoyer à WhatsApp

**Node Type:** HTTP Request

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HTTP Request - Send to WhatsApp
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Method: POST

URL: https://l8g04s04scsw0so8ss8ckcoc.yourdomain.com/api/v1/sessions/YOUR_SESSION_ID/messages

━━━ Headers ━━━
☑ Send Headers
  ├─ Name: X-API-Key
  │  Value: 0dbcbe012f8e37a1313263e60ff215c51bf40863d4ece233be50a78d0a5e2a66
  │
  └─ Name: Content-Type
     Value: application/json

━━━ Body ━━━
☑ Send Body
Body Content Type: JSON

{
  "to": "33612345678",
  "text": "Voici votre image",
  "media": {
    "type": "image",
    "mimetype": "image/jpeg",
    "data": "{{ $binary.data.toString('base64') }}",
    "filename": "image.jpg"
  }
}
```

---

## 📋 Configuration Pas à Pas

### Étape 1: Créer le Workflow

1. **Nouveau Workflow** dans n8n
2. Ajoutez un **Manual Trigger**

---

### Étape 2: Nœud "Download Image"

1. Ajoutez un nœud **HTTP Request**
2. Renommez-le "Download Image"
3. **Configuration:**
   - **Method:** GET
   - **URL:** `https://picsum.photos/800/600` (exemple)
   - **Options → Response:**
     - ✅ Response Format: **File**

**Test:** Exécutez ce nœud → Vous devez voir les données binaires

---

### Étape 3: Nœud "Send to WhatsApp"

1. Ajoutez un nœud **HTTP Request**
2. Renommez-le "Send to WhatsApp"
3. **Configuration:**

**Method & URL:**
```
Method: POST
URL: https://l8g04s04scsw0so8ss8ckcoc.yourdomain.com/api/v1/sessions/SESSION_ID/messages
```

**Headers:**
```
☑ Send Headers

[+] Add Parameter
  Name: X-API-Key
  Value: 0dbcbe012f8e37a1313263e60ff215c51bf40863d4ece233be50a78d0a5e2a66

[+] Add Parameter  
  Name: Content-Type
  Value: application/json
```

**Body:**
```
☑ Send Body
Body Content Type: JSON

Copiez-collez ce JSON:
```

```json
{
  "to": "33612345678",
  "text": "Voici votre image",
  "media": {
    "type": "image",
    "mimetype": "image/jpeg",
    "data": "{{ $binary.data.toString('base64') }}",
    "filename": "image.jpg"
  }
}
```

**⚠️ IMPORTANT:** L'expression `{{ $binary.data.toString('base64') }}` convertit l'image téléchargée en base64

---

## 🎨 Exemples Pratiques

### Exemple 1: Image depuis URL Publique

**Workflow:**
```
Manual Trigger
    ↓
HTTP Request (GET https://example.com/photo.jpg)
    Response Format: File
    ↓
HTTP Request (POST YesApp API)
    Body: { "to": "...", "media": { "data": "{{ $binary.data.toString('base64') }}" } }
```

---

### Exemple 2: Image depuis Google Drive

**1. Télécharger depuis Drive:**
```
HTTP Request
  Method: GET
  URL: https://drive.google.com/uc?export=download&id=FILE_ID
  Response Format: File
```

**2. Envoyer:**
```json
{
  "to": "33612345678",
  "text": "Document depuis Drive",
  "media": {
    "type": "image",
    "mimetype": "image/png",
    "data": "{{ $binary.data.toString('base64') }}"
  }
}
```

---

### Exemple 3: Image Générée par AI (OpenAI DALL-E)

**Workflow:**
```
Manual Trigger
    ↓
OpenAI (Generate Image)
    ↓
HTTP Request (Download generated image)
    URL: {{ $json.data[0].url }}
    Response Format: File
    ↓
HTTP Request (Send to WhatsApp)
    Body: { "media": { "data": "{{ $binary.data.toString('base64') }}" } }
```

---

## 🔍 Différents Types d'Images

### JPEG
```json
{
  "media": {
    "type": "image",
    "mimetype": "image/jpeg",
    "data": "{{ $binary.data.toString('base64') }}",
    "filename": "photo.jpg"
  }
}
```

### PNG
```json
{
  "media": {
    "type": "image",
    "mimetype": "image/png",
    "data": "{{ $binary.data.toString('base64') }}",
    "filename": "screenshot.png"
  }
}
```

### GIF
```json
{
  "media": {
    "type": "image",
    "mimetype": "image/gif",
    "data": "{{ $binary.data.toString('base64') }}",
    "filename": "animation.gif"
  }
}
```

### WEBP
```json
{
  "media": {
    "type": "image",
    "mimetype": "image/webp",
    "data": "{{ $binary.data.toString('base64') }}",
    "filename": "modern.webp"
  }
}
```

---

## 🐛 Troubleshooting

### ❌ Erreur: "Media requires type and data (base64)"

**Cause:** Format incorrect

**✅ Solution:**
```json
{
  "media": {
    "type": "image",        ← REQUIS
    "data": "base64...",    ← REQUIS
    "mimetype": "image/jpeg"
  }
}
```

---

### ❌ Erreur: "Invalid base64"

**Cause:** L'expression n8n est incorrecte

**✅ Solution:**
```
Correct: {{ $binary.data.toString('base64') }}
Wrong:   {{ $binary.data }}
Wrong:   {{ $json.data }}
```

---

### ❌ L'image ne s'affiche pas dans WhatsApp

**Causes possibles:**
1. Mimetype incorrect
2. Image trop grande (max 16MB)
3. Format non supporté

**✅ Solution:**
- Utilisez JPEG pour les photos
- Compressez l'image si > 5MB
- Vérifiez le mimetype correspond au fichier

---

### ❌ Erreur: "Session not connected"

**Cause:** Session WhatsApp non active

**✅ Solution:**
1. Ouvrez le dashboard
2. Scannez le QR code
3. Attendez "Connected"
4. Réessayez l'envoi

---

## 📊 Workflow Complet Annoté

```
┌──────────────────┐
│  Manual Trigger  │ ← Déclenche le workflow
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ HTTP Request     │ ← Télécharge l'image
│ GET image.jpg    │   Response Format: File
│                  │   → Stocke dans $binary.data
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ HTTP Request     │ ← POST vers YesApp API
│ POST /messages   │
│                  │   Headers: X-API-Key
│ Body:            │   
│ {                │   Body: Convert $binary.data
│   "to": "...",   │         vers base64
│   "media": {     │
│     "data": "{{  │
│       $binary... │
│     }}"          │
│   }              │
│ }                │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│    Response      │ ← Retourne messageId
│ { success: true }│
└──────────────────┘
```

---

## ✅ Checklist Envoi d'Image

- [ ] Node 1: HTTP Request configuré (GET)
- [ ] Response Format = File ✓
- [ ] Node 2: HTTP Request configuré (POST)
- [ ] Header X-API-Key ajouté
- [ ] Body contient `media.type` = "image"
- [ ] Body contient `media.data` = `{{ $binary.data.toString('base64') }}`
- [ ] Body contient `media.mimetype` (ex: "image/jpeg")
- [ ] `to` au format international (ex: 33612345678)
- [ ] SESSION_ID remplacé par votre ID réel
- [ ] Session WhatsApp connectée
- [ ] Test réussi

---

## 🚀 Template n8n Importable

**Fichier:** `n8n-examples/send-image-correct.json`

**Pour importer:**
1. n8n → Workflows → Import from File
2. Sélectionnez `send-image-correct.json`
3. Remplacez SESSION_ID
4. Remplacez le numéro de téléphone
5. Testez!

---

## 📚 Ressources

- [Documentation API](../README.md)
- [Guide Complet n8n](../N8N_INTEGRATION_GUIDE.md)
- [Troubleshooting](../DOCKER_TROUBLESHOOTING.md)

---

**Besoin d'aide?** Le format `media.url` n'est PAS supporté - utilisez toujours base64!
