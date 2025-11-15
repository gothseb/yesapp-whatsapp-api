# 📸 Guide Simple - Envoi d'Images via URL

**🎉 NOUVEAU:** Le backend télécharge automatiquement les images depuis une URL!

Plus besoin de workflow complexe avec 2 nœuds - **juste 1 nœud suffit!**

---

## ✅ Configuration Simple (1 Seul Nœud)

### HTTP Request Node - Configuration

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HTTP Request - Send Image
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Method: POST

URL: https://l8g04s04scsw0so8ss8ckcoc.sebapp-lab.com/api/v1/sessions/YOUR_SESSION_ID/messages

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
    "url": "https://example.com/image.jpg"
  }
}
```

**C'est tout!** Le backend s'occupe de:
1. Télécharger l'image depuis l'URL
2. Convertir en base64
3. Détecter le type (JPEG, PNG, etc.)
4. Envoyer à WhatsApp

---

## 🎯 Exemples Pratiques

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
  "text": "🎉 Nouvelle promotion!",
  "media": {
    "url": "https://example.com/promo.jpg"
  }
}
```

### Exemple 3: Image depuis Google Drive

```json
{
  "to": "33612345678",
  "text": "Document ci-joint",
  "media": {
    "url": "https://drive.google.com/uc?export=download&id=FILE_ID"
  }
}
```

### Exemple 4: Image Générée par IA

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

### Exemple 5: Avec Variables n8n

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

## 📋 Format Accepté

### Option 1: URL (Simple - Recommandé)

```json
{
  "to": "+33612345678",
  "media": {
    "url": "https://example.com/image.jpg"
  }
}
```

Le backend détecte automatiquement:
- Type de fichier (JPEG, PNG, GIF, WEBP)
- Mimetype
- Nom du fichier

### Option 2: Base64 (Avancé)

```json
{
  "to": "+33612345678",
  "media": {
    "type": "image",
    "data": "base64_string_here",
    "mimetype": "image/jpeg"
  }
}
```

Pour les cas où vous avez déjà l'image en base64.

---

## 🎨 Types d'Images Supportés

| Format | Extension | Détection Auto |
|--------|-----------|----------------|
| JPEG | .jpg, .jpeg | ✅ |
| PNG | .png | ✅ |
| GIF | .gif | ✅ |
| WEBP | .webp | ✅ |

---

## ⚡ Avantages de la Méthode URL

### ✅ Simplicité
- **1 seul nœud** au lieu de 2
- Pas de conversion base64 à gérer
- Configuration minimale

### ✅ Performance
- Le backend optimise le téléchargement
- Cache possible (futur)
- Timeout géré automatiquement

### ✅ Flexibilité
- Fonctionne avec n'importe quelle URL publique
- Compatible avec CDN, Google Drive, Dropbox, etc.
- Supporte les redirections

---

## 🔍 Limitations

### Taille Maximum
- **16 MB** par image (limite WhatsApp)
- Le backend vérifie automatiquement

### Timeout
- **30 secondes** pour télécharger
- Si dépassé, erreur retournée

### URL Publiques Uniquement
- L'URL doit être accessible sans authentification
- HTTPS recommandé (HTTP accepté)

---

## 🐛 Troubleshooting

### ❌ Erreur: "Invalid media URL"

**Cause:** URL invalide ou non accessible

**✅ Solution:**
- Vérifiez que l'URL commence par `http://` ou `https://`
- Testez l'URL dans un navigateur
- Assurez-vous qu'elle est publique

### ❌ Erreur: "Image download timeout"

**Cause:** L'image met trop de temps à télécharger

**✅ Solution:**
- Utilisez une image plus petite
- Hébergez l'image sur un CDN rapide
- Compressez l'image avant l'upload

### ❌ Erreur: "Image not found (404)"

**Cause:** L'URL ne pointe pas vers une image valide

**✅ Solution:**
- Vérifiez l'URL dans un navigateur
- Assurez-vous que le fichier existe
- Vérifiez les permissions

### ❌ Erreur: "Access forbidden (403)"

**Cause:** L'URL nécessite une authentification

**✅ Solution:**
- Rendez l'image publique
- Ou utilisez la méthode base64 en téléchargeant l'image côté n8n

---

## 📊 Workflow Complet

```
┌─────────────┐
│   Trigger   │ ← Webhook, Schedule, etc.
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Set Data  │ ← Prépare to, text, imageUrl
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ HTTP Request│ ← POST vers YesApp API
│             │   Body: { "media": { "url": "..." } }
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Response   │ ← { "success": true, "messageId": "..." }
└─────────────┘
```

**3 nœuds seulement!**

---

## 🔐 URLs Supportées

### ✅ Fonctionnent

- `https://example.com/image.jpg`
- `https://picsum.photos/800/600`
- `https://i.imgur.com/abc123.png`
- `https://drive.google.com/uc?export=download&id=...`
- `https://cdn.example.com/photos/image.jpg`
- `http://example.com/public/image.jpg`

### ❌ Ne Fonctionnent Pas

- URLs privées nécessitant login
- URLs avec authentification Bearer/OAuth
- URLs expirées ou temporaires
- URLs de Google Drive sans `export=download`
- URLs redirigées vers une page HTML

---

## ✅ Checklist

- [ ] URL de l'image publique et accessible
- [ ] Header `X-API-Key` configuré
- [ ] `SESSION_ID` remplacé par votre ID réel
- [ ] `to` au format international (sans +)
- [ ] Session WhatsApp connectée
- [ ] URL testée dans un navigateur
- [ ] Image < 16 MB

---

## 🚀 Template n8n Importable

```json
{
  "nodes": [
    {
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger"
    },
    {
      "name": "Send Image",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://l8g04s04scsw0so8ss8ckcoc.sebapp-lab.com/api/v1/sessions/SESSION_ID/messages",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "0dbcbe012f8e37a1313263e60ff215c51bf40863d4ece233be50a78d0a5e2a66"
            }
          ]
        },
        "sendBody": true,
        "specifyBody": "json",
        "jsonBody": "={\n  \"to\": \"33612345678\",\n  \"text\": \"Voici votre image\",\n  \"media\": {\n    \"url\": \"https://picsum.photos/800/600\"\n  }\n}"
      }
    }
  ]
}
```

---

## 📚 Comparaison: URL vs Base64

| Critère | URL (Simple) | Base64 (Avancé) |
|---------|-------------|-----------------|
| Nœuds n8n | 1 | 2 |
| Complexité | Faible | Moyenne |
| Performance | Rapide | Rapide |
| Flexibilité | Haute | Haute |
| Cas d'usage | Images publiques | Images privées/locales |

---

**Utilisez l'URL pour 95% des cas!** 🎉

Utilisez base64 seulement si:
- L'image est privée/protégée
- Vous voulez modifier l'image avant l'envoi
- L'image est générée localement

---

## 🎯 Exemple Complet avec Variables

```json
{
  "to": "{{ $json.customer.phone }}",
  "text": "{{ $json.message.text }}",
  "media": {
    "url": "{{ $json.product.imageUrl }}"
  }
}
```

**Le backend gère tout le reste automatiquement!** ✨
