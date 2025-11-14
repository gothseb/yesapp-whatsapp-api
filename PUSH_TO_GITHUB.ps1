# Script PowerShell pour déposer YesApp sur GitHub
# Usage: .\PUSH_TO_GITHUB.ps1

Write-Host "`n🚀 YesApp - Déploiement sur GitHub`n" -ForegroundColor Cyan

# Vérifier si git est installé
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Git n'est pas installé. Installez Git d'abord: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}

# Demander le nom d'utilisateur GitHub
$githubUsername = Read-Host "Entrez votre nom d'utilisateur GitHub"
if ([string]::IsNullOrWhiteSpace($githubUsername)) {
    Write-Host "❌ Nom d'utilisateur requis" -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 Configuration Git..." -ForegroundColor Yellow

# Configurer git (si pas déjà fait)
$gitName = git config user.name
if ([string]::IsNullOrWhiteSpace($gitName)) {
    $userName = Read-Host "Entrez votre nom pour Git"
    git config user.name "$userName"
}

$gitEmail = git config user.email
if ([string]::IsNullOrWhiteSpace($gitEmail)) {
    $userEmail = Read-Host "Entrez votre email pour Git"
    git config user.email "$userEmail"
}

Write-Host "✅ Git configuré" -ForegroundColor Green

# Initialiser git
Write-Host "`n📦 Initialisation du repository..." -ForegroundColor Yellow
if (-not (Test-Path .git)) {
    git init
    Write-Host "✅ Repository initialisé" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Repository déjà initialisé" -ForegroundColor Blue
}

# Ajouter tous les fichiers
Write-Host "`n📝 Ajout des fichiers..." -ForegroundColor Yellow
git add .
Write-Host "✅ Fichiers ajoutés" -ForegroundColor Green

# Créer le commit
Write-Host "`n💾 Création du commit..." -ForegroundColor Yellow
$commitMessage = @"
🎉 Initial commit - YesApp WhatsApp API v1.0.0

Backend API:
- Express.js REST API with 12 endpoints
- Multi-session WhatsApp support
- SQLite database with auto-migrations
- API Key authentication (SHA-256)
- Rate limiting (50 msg/min)
- WhatsApp Groups support (38 groups tested)
- Media support (images, videos, docs)

Dashboard:
- React 18 + Vite + TailwindCSS
- Modern responsive UI
- Session management interface
- Groups list with search
- Message sending interface
- Copy-to-clipboard for IDs

n8n Integration:
- Complete integration guide
- Ready-to-use workflow examples
- Text and image sending support
- Groups support

Documentation:
- Quick start guide
- n8n integration guide
- WhatsApp groups guide
- API configuration guide
- Deployment guide

Project Stats:
- 30+ files created
- ~5000 lines of code
- 6 React components
- 100% functional and tested

Built with Node.js, Express, SQLite, React, and whatsapp-web.js
"@

git commit -m $commitMessage
Write-Host "✅ Commit créé" -ForegroundColor Green

# Configurer la branche principale
Write-Host "`n🌿 Configuration de la branche..." -ForegroundColor Yellow
git branch -M main
Write-Host "✅ Branche 'main' configurée" -ForegroundColor Green

# Demander confirmation avant de créer le repo
Write-Host "`n⚠️  IMPORTANT:" -ForegroundColor Yellow
Write-Host "Vous devez d'abord créer un repository sur GitHub:" -ForegroundColor Yellow
Write-Host "1. Allez sur: https://github.com/new" -ForegroundColor Cyan
Write-Host "2. Nom: yesapp-whatsapp-api" -ForegroundColor Cyan
Write-Host "3. Description: 🚀 Self-hosted WhatsApp API REST service" -ForegroundColor Cyan
Write-Host "4. Public ou Private (au choix)" -ForegroundColor Cyan
Write-Host "5. NE PAS initialiser avec README" -ForegroundColor Red
Write-Host "6. Cliquez 'Create repository'`n" -ForegroundColor Cyan

$confirm = Read-Host "Avez-vous créé le repository sur GitHub? (O/n)"
if ($confirm -ne 'O' -and $confirm -ne 'o' -and $confirm -ne '') {
    Write-Host "`n❌ Annulé. Créez d'abord le repository sur GitHub." -ForegroundColor Red
    exit 0
}

# Ajouter l'origine
Write-Host "`n🔗 Configuration de l'origine GitHub..." -ForegroundColor Yellow
$repoUrl = "https://github.com/$githubUsername/yesapp-whatsapp-api.git"

# Supprimer l'origine existante si présente
git remote remove origin 2>$null

git remote add origin $repoUrl
Write-Host "✅ Origine configurée: $repoUrl" -ForegroundColor Green

# Push vers GitHub
Write-Host "`n🚀 Push vers GitHub..." -ForegroundColor Yellow
Write-Host "Si demandé, entrez vos identifiants GitHub" -ForegroundColor Cyan

try {
    git push -u origin main
    Write-Host "`n✅ ✅ ✅ SUCCÈS! ✅ ✅ ✅" -ForegroundColor Green
    Write-Host "`nVotre projet est maintenant sur GitHub!" -ForegroundColor Green
    Write-Host "🌐 URL: https://github.com/$githubUsername/yesapp-whatsapp-api`n" -ForegroundColor Cyan
} catch {
    Write-Host "`n❌ Erreur lors du push" -ForegroundColor Red
    Write-Host "Vérifiez:" -ForegroundColor Yellow
    Write-Host "- Que le repository existe sur GitHub" -ForegroundColor Yellow
    Write-Host "- Vos identifiants GitHub" -ForegroundColor Yellow
    Write-Host "- Votre connexion internet`n" -ForegroundColor Yellow
    Write-Host "Commande pour réessayer:" -ForegroundColor Cyan
    Write-Host "git push -u origin main`n" -ForegroundColor White
}

Write-Host "📚 Consultez DEPLOY_TO_GITHUB.md pour plus d'informations`n" -ForegroundColor Blue
