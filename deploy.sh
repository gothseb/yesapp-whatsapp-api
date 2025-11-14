#!/bin/bash

# Script de déploiement automatique YesApp sur serveur
# Usage: ./deploy.sh

set -e

echo "🐳 YesApp - Déploiement Docker"
echo "================================"
echo ""

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé"
    echo "Installation: curl -fsSL https://get.docker.com | sh"
    exit 1
fi

echo "✅ Docker installé: $(docker --version)"

# Vérifier Docker Compose
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé"
    exit 1
fi

echo "✅ Docker Compose installé: $(docker compose version)"
echo ""

# Créer le fichier .env backend s'il n'existe pas
if [ ! -f backend/.env ]; then
    echo "📝 Création de backend/.env..."
    cat > backend/.env << EOF
PORT=3000
NODE_ENV=production
DATABASE_PATH=/app/data/db.sqlite
SESSIONS_PATH=/app/data/sessions
EOF
    echo "✅ backend/.env créé"
else
    echo "ℹ️  backend/.env existe déjà"
fi
echo ""

# Créer le répertoire data
mkdir -p data/sessions
echo "✅ Répertoire data/ créé"
echo ""

# Build les images
echo "🔨 Build des images Docker..."
if docker compose build; then
    echo "✅ Images buildées"
else
    echo "❌ Erreur lors du build des images"
    echo "Vérifiez les logs ci-dessus"
    exit 1
fi
echo ""

# Démarrer les services
echo "🚀 Démarrage des services..."
docker compose up -d
echo "✅ Services démarrés"
echo ""

# Attendre que le backend soit prêt
echo "⏳ Attente du backend (30 secondes)..."
sleep 30

# Récupérer l'API Key
echo ""
echo "🔑 Récupération de l'API Key..."
API_KEY=$(docker compose exec -T backend node -e "
const db = require('./src/database/db');
try {
  const apiKeys = db.prepare('SELECT key FROM api_keys LIMIT 1').all();
  if (apiKeys.length > 0) {
    console.log(apiKeys[0].key);
  }
} catch(e) {
  console.error('Error:', e.message);
}
" 2>/dev/null | grep -v "Error" | head -1)

if [ -n "$API_KEY" ]; then
    echo "✅ API Key récupérée: $API_KEY"
    echo ""
    
    # Créer le .env du dashboard
    echo "📝 Configuration du dashboard..."
    SERVER_IP=$(hostname -I | awk '{print $1}')
    cat > dashboard/.env << EOF
VITE_API_URL=http://${SERVER_IP}:3000/api/v1
VITE_API_KEY=${API_KEY}
EOF
    echo "✅ dashboard/.env créé avec IP: $SERVER_IP"
    echo ""
    
    # Rebuild le dashboard
    echo "🔨 Rebuild du dashboard avec la configuration..."
    docker compose build dashboard
    docker compose up -d dashboard
    echo "✅ Dashboard reconfiguré"
else
    echo "⚠️  API Key non trouvée, récupérez-la manuellement:"
    echo "   docker compose logs backend | grep 'API Key'"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DÉPLOIEMENT TERMINÉ!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Accès aux services:"
echo "   Backend:    http://${SERVER_IP:-localhost}:3000"
echo "   Dashboard:  http://${SERVER_IP:-localhost}:5173"
echo "   Health:     http://${SERVER_IP:-localhost}:3000/health"
echo ""
if [ -n "$API_KEY" ]; then
    echo "🔑 API Key: $API_KEY"
    echo ""
fi
echo "📊 Commandes utiles:"
echo "   Logs:       docker compose logs -f"
echo "   Status:     docker compose ps"
echo "   Arrêter:    docker compose down"
echo "   Redémarrer: docker compose restart"
echo ""
echo "📖 Documentation: DOCKER_DEPLOYMENT.md"
echo ""
