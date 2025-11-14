# Getting Started - YesApp WhatsApp API

Guide pas-à-pas pour commencer l'implémentation.

---

## Étape 1: Préparer l'Environnement

### Prérequis
- Node.js 20 LTS installé
- Docker et Docker Compose installés
- Git installé
- Éditeur de code (VS Code recommandé)

### Vérifier les installations
```bash
node --version    # v20.x.x
npm --version     # 10.x.x
docker --version  # 24.x.x
git --version     # 2.x.x
```

---

## Étape 2: Créer la Structure du Projet

```bash
# Se positionner dans le dossier du projet
cd N:\windsurf\yesapp\yesapp

# Créer la structure backend
mkdir -p backend\src\api
mkdir -p backend\src\services
mkdir -p backend\src\models
mkdir -p backend\src\middleware
mkdir -p backend\src\database\migrations
mkdir -p backend\src\utils
mkdir -p backend\src\config

# Créer la structure dashboard
mkdir -p dashboard\src\components
mkdir -p dashboard\src\api
mkdir -p dashboard\src\styles

# Créer les dossiers Docker et docs
mkdir -p docker
mkdir -p docs
mkdir -p data

# Créer le dossier tests
mkdir -p backend\tests
```

---

## Étape 3: Initialiser les Packages

### Backend

```bash
cd backend

# Initialiser package.json
npm init -y

# Installer dépendances production
npm install express@^4.18.2
npm install whatsapp-web.js@^1.23.0
npm install better-sqlite3@^9.2.0
npm install qrcode@^1.5.3
npm install express-rate-limit@^7.1.5
npm install helmet@^7.1.0
npm install cors@^2.8.5
npm install dotenv@^16.3.1
npm install winston@^3.11.0
npm install uuid@^9.0.1
npm install multer@^1.4.5-lts.1
npm install swagger-ui-express@^5.0.0
npm install swagger-jsdoc@^6.2.8

# Installer dépendances dev
npm install --save-dev nodemon@^3.0.2
npm install --save-dev eslint@^8.56.0
npm install --save-dev prettier@^3.1.1
```

### Dashboard

```bash
cd ..\dashboard

# Créer projet Vite + React
npm create vite@latest . -- --template react

# Installer dépendances
npm install

# Installer Axios
npm install axios@^1.6.5

# Installer TailwindCSS
npm install -D tailwindcss@^3.4.1 autoprefixer@^10.4.16 postcss@^8.4.33

# Initialiser Tailwind
npx tailwindcss init -p
```

---

## Étape 4: Configuration de Base

### Backend package.json - Ajouter scripts

Éditer `backend/package.json`:
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "echo \"Tests TODO\" && exit 0"
  },
  "type": "module"
}
```

### Créer backend/.env.example
```bash
cd backend
```

Créer le fichier `.env.example`:
```env
NODE_ENV=development
PORT=3000
API_KEY=
DATABASE_PATH=../data/db.sqlite
SESSIONS_PATH=../data/sessions
MEDIA_PATH=../data/media
LOG_LEVEL=debug
RATE_LIMIT_MESSAGES=50
WEBHOOK_TIMEOUT=5000
WEBHOOK_RETRIES=3
SESSION_INACTIVE_DAYS=30
MEDIA_RETENTION_DAYS=90
```

Copier vers `.env`:
```bash
copy .env.example .env
```

### Dashboard - Configurer Tailwind

Éditer `dashboard/tailwind.config.js`:
```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Éditer `dashboard/src/styles/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Étape 5: Créer le Point d'Entrée Backend

### backend/src/index.js

```javascript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';

// Charger variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de sécurité
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes de base
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', (req, res) => {
  res.json({ 
    ready: true,
    checks: {
      server: true,
      database: false, // TODO: check DB
      whatsapp: false  // TODO: check WhatsApp
    }
  });
});

// Route API v1 placeholder
app.get('/api/v1/status', (req, res) => {
  res.json({ 
    message: 'YesApp WhatsApp API v1',
    version: '1.0.0'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'INTERNAL_ERROR',
    message: 'Something went wrong!'
  });
});

// Démarrage serveur
app.listen(PORT, () => {
  console.log(`🚀 YesApp WhatsApp API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV}`);
});
```

---

## Étape 6: Tester le Backend

```bash
cd backend

# Mode développement (avec auto-reload)
npm run dev

# Dans un autre terminal, tester
curl http://localhost:3000/health
curl http://localhost:3000/api/v1/status
```

Vous devriez voir:
```
🚀 YesApp WhatsApp API running on port 3000
📊 Health check: http://localhost:3000/health
🔧 Environment: development
```

---

## Étape 7: Créer le Dashboard de Base

### dashboard/src/App.jsx

```jsx
import { useState, useEffect } from 'react';
import './styles/index.css';

function App() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3000/health')
      .then(res => res.json())
      .then(data => setHealth(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          YesApp WhatsApp API
        </h1>
        
        {health ? (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">API Status</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Status:</span> {health.status}</p>
              <p><span className="font-medium">Uptime:</span> {Math.floor(health.uptime)}s</p>
              <p><span className="font-medium">Timestamp:</span> {health.timestamp}</p>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">Connecting to API...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
```

### dashboard/src/main.jsx

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

---

## Étape 8: Tester le Dashboard

```bash
cd dashboard

# Démarrer en mode dev
npm run dev
```

Ouvrir http://localhost:5173 dans le navigateur.

Vous devriez voir le dashboard afficher le statut de l'API.

---

## Étape 9: Créer le Dockerfile

### docker/Dockerfile

```dockerfile
# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/dashboard
COPY dashboard/package*.json ./
RUN npm ci
COPY dashboard/ ./
RUN npm run build

# Stage 2: Backend Dependencies
FROM node:20-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --production

# Stage 3: Production
FROM node:20-alpine
WORKDIR /app

# Install Chromium for whatsapp-web.js
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer env
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Copy backend
COPY --from=backend-deps /app/backend/node_modules ./node_modules
COPY backend/ ./

# Copy frontend build (sera servi par Express)
COPY --from=frontend-build /app/dashboard/dist ./public

# Create data directories
RUN mkdir -p /app/data/sessions /app/data/media

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start
CMD ["node", "src/index.js"]
```

### docker/docker-compose.yml

```yaml
version: '3.8'

services:
  yesapp-api:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    container_name: yesapp-whatsapp-api
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - API_KEY=${API_KEY:-}
      - DATABASE_PATH=/app/data/db.sqlite
      - SESSIONS_PATH=/app/data/sessions
      - MEDIA_PATH=/app/data/media
      - LOG_LEVEL=info
      - RATE_LIMIT_MESSAGES=50
    volumes:
      - ../data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

volumes:
  data:
```

---

## Étape 10: Tester Docker

```bash
# Revenir à la racine
cd N:\windsurf\yesapp\yesapp

# Builder et démarrer
docker-compose -f docker/docker-compose.yml up --build

# Tester
curl http://localhost:3000/health
```

---

## Étape 11: Créer .gitignore

Créer à la racine:
```gitignore
# Node
node_modules/
npm-debug.log*
package-lock.json

# Environment
.env
.env.local

# Data
data/
*.sqlite
*.sqlite-journal

# Logs
logs/
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build
dist/
build/
.cache/

# WhatsApp sessions
.wwebjs_auth/
.wwebjs_cache/
```

---

## Étape 12: Commit Initial

```bash
git add .
git commit -m "feat: initial project structure and basic setup

- Backend Express.js with health checks
- Dashboard React + Vite + TailwindCSS
- Docker multi-stage build
- Development environment ready

Refs: 001-whatsapp-api"
```

---

## ✅ Validation

Vous avez maintenant:
- ✅ Structure projet complète
- ✅ Backend Express fonctionnel
- ✅ Dashboard React fonctionnel
- ✅ Docker configuration prête
- ✅ Environnement de développement opérationnel

---

## 🚀 Prochaines Étapes

Suivre le **[plan.md](./plan.md)** - Phase 1:

1. **Database & Models** (jour 1)
   - Créer migrations SQLite
   - Modèles Session, Message, APIKey

2. **Authentication** (jour 1)
   - Middleware API Key
   - Génération API Key

3. **Session Management** (jours 2-3)
   - Routes CRUD sessions
   - Intégration whatsapp-web.js
   - QR code generation

4. **Message Sending** (jour 3)
   - POST /messages endpoint
   - Rate limiting
   - Queue management

5. **Dashboard MVP** (jour 4)
   - Liste sessions
   - Display QR codes
   - Send messages form

---

Bon développement! 🎉
