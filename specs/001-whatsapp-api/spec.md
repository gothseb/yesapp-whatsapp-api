# Feature Specification: API WhatsApp Auto-hébergeable

**Feature Branch**: `001-whatsapp-api`  
**Created**: 2025-11-14  
**Status**: Draft  
**Input**: User description: "je veux crée une application en docker qui est une API HTTP / REST auto-hébergeable qui permet d'envoyer et de recevoir des messages via WhatsApp"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Déploiement et Connexion WhatsApp (Priority: P1)

En tant qu'utilisateur, je veux déployer l'application via Docker et connecter mon compte WhatsApp pour commencer à utiliser l'API.

**Why this priority**: C'est le point d'entrée obligatoire du système. Sans cette fonctionnalité de base, aucune autre fonctionnalité ne peut être utilisée. C'est le MVP minimal qui prouve que le concept fonctionne.

**Independent Test**: Peut être testé en déployant le conteneur Docker, accédant au dashboard, et vérifiant que le QR code WhatsApp s'affiche et permet la connexion. Délivre la valeur de base : une session WhatsApp fonctionnelle accessible via API.

**Acceptance Scenarios**:

1. **Given** Docker est installé sur ma machine, **When** j'exécute la commande de déploiement (docker-compose up), **Then** le conteneur démarre sans erreur et l'API est accessible sur le port configuré
2. **Given** l'API est en cours d'exécution, **When** j'accède au dashboard web, **Then** je vois l'interface de création de session avec un QR code WhatsApp
3. **Given** un QR code est affiché, **When** je le scanne avec mon application WhatsApp mobile, **Then** la session se connecte avec succès et affiche "Connecté" dans le dashboard
4. **Given** une session connectée, **When** je redémarre le conteneur, **Then** la session se reconnecte automatiquement sans nécessiter un nouveau scan de QR code

---

### User Story 2 - Envoi de Messages via API (Priority: P1)

En tant que développeur, je veux envoyer des messages WhatsApp en appelant un endpoint REST pour automatiser la communication.

**Why this priority**: C'est la fonctionnalité de base de l'API. L'envoi de messages est le cas d'usage le plus critique et le plus fréquent. Avec P1 et cette story, on a un système fonctionnel et utilisable.

**Independent Test**: Peut être testé en effectuant un appel POST vers l'endpoint d'envoi avec un numéro et un message, puis en vérifiant dans WhatsApp mobile que le message est bien reçu.

**Acceptance Scenarios**:

1. **Given** une session WhatsApp connectée, **When** j'envoie une requête POST à `/api/v1/sessions/{sessionId}/messages` avec un numéro de téléphone et un texte, **Then** le message est envoyé avec succès et je reçois une réponse 200 avec l'ID du message
2. **Given** une session non connectée, **When** j'envoie une requête d'envoi de message, **Then** je reçois une erreur 503 avec le message "Session not connected"
3. **Given** un numéro de téléphone invalide, **When** j'envoie une requête, **Then** je reçois une erreur 400 avec le message "Invalid phone number format"
4. **Given** un message texte valide avec emojis, **When** j'envoie le message, **Then** les emojis sont correctement transmis et affichés dans WhatsApp

---

### User Story 3 - Réception de Messages via Webhooks (Priority: P2)

En tant que développeur, je veux recevoir des notifications en temps réel quand un message WhatsApp arrive pour réagir automatiquement.

**Why this priority**: Permet l'interactivité bidirectionnelle, essentielle pour les bots et les conversations automatisées. Sans cela, l'API est unidirectionnelle.

**Independent Test**: Peut être testé en configurant une URL de webhook, envoyant un message au numéro WhatsApp connecté, et vérifiant que le webhook reçoit bien la notification.

**Acceptance Scenarios**:

1. **Given** une URL de webhook configurée pour une session, **When** un message est reçu sur WhatsApp, **Then** un POST HTTP est envoyé au webhook avec les détails du message (expéditeur, texte, timestamp)
2. **Given** le webhook est temporairement inaccessible, **When** un message arrive, **Then** le système réessaie l'envoi 3 fois avec un délai exponentiel
3. **Given** plusieurs messages arrivent rapidement, **When** ils sont traités, **Then** les webhooks sont envoyés dans l'ordre de réception des messages
4. **Given** un message contenant une image est reçu, **When** le webhook est appelé, **Then** l'URL de téléchargement de l'image est incluse dans la notification

---

### User Story 4 - Gestion Multi-Sessions (Priority: P2)

En tant qu'administrateur, je veux gérer plusieurs comptes WhatsApp simultanément sur le même serveur pour utiliser l'API avec différents numéros.

**Why this priority**: Permet d'utiliser l'application à plus grande échelle et de servir plusieurs clients ou cas d'usage sur une seule instance. Important pour la rentabilité mais pas critique pour le MVP initial.

**Independent Test**: Peut être testé en créant 2 sessions différentes, les connectant à 2 numéros WhatsApp distincts, et vérifiant que les messages envoyés via chaque session utilisent le bon compte.

**Acceptance Scenarios**:

1. **Given** l'API en cours d'exécution, **When** je crée une nouvelle session via POST `/api/v1/sessions`, **Then** je reçois un ID de session unique et un QR code pour connexion
2. **Given** deux sessions actives (session-A et session-B), **When** j'envoie un message via session-A, **Then** le message part du compte WhatsApp lié à session-A uniquement
3. **Given** plusieurs sessions, **When** j'accède au dashboard, **Then** je vois la liste de toutes les sessions avec leur statut (connecté, déconnecté, en attente)
4. **Given** une session existante, **When** je la supprime via DELETE `/api/v1/sessions/{sessionId}`, **Then** la session est déconnectée et ses données sont effacées

---

### User Story 5 - Envoi de Médias (Priority: P3)

En tant que développeur, je veux envoyer des images, vidéos et documents via l'API pour enrichir la communication.

**Why this priority**: Améliore considérablement l'expérience utilisateur mais n'est pas critique pour le MVP. Les messages texte couvrent 80% des cas d'usage initiaux.

**Independent Test**: Peut être testé en uploadant un fichier image via un appel multipart/form-data et vérifiant que l'image arrive bien dans WhatsApp avec sa légende.

**Acceptance Scenarios**:

1. **Given** une session connectée, **When** j'envoie une requête POST avec une image en base64 ou multipart, **Then** l'image est envoyée avec succès dans WhatsApp
2. **Given** un fichier PDF, **When** je l'envoie via l'API, **Then** le document est reçu et téléchargeable dans WhatsApp
3. **Given** un fichier supérieur à 16MB, **When** j'essaie de l'envoyer, **Then** je reçois une erreur 413 "File too large"
4. **Given** une vidéo avec une légende, **When** je l'envoie, **Then** la vidéo et la légende s'affichent correctement dans WhatsApp

---

### User Story 6 - Dashboard de Monitoring (Priority: P3)

En tant qu'administrateur, je veux visualiser l'état de mes sessions et les statistiques d'utilisation dans un dashboard web pour surveiller le système.

**Why this priority**: Améliore l'observabilité et facilite la gestion, mais le système peut fonctionner sans interface graphique (tout via API). Nice-to-have pour l'expérience opérationnelle.

**Independent Test**: Peut être testé en accédant au dashboard et vérifiant que toutes les métriques (nombre de messages envoyés, statut des sessions, logs récents) sont affichées correctement.

**Acceptance Scenarios**:

1. **Given** plusieurs sessions actives, **When** j'accède au dashboard, **Then** je vois les métriques en temps réel (messages envoyés/reçus, uptime, dernière activité)
2. **Given** une session qui se déconnecte, **When** je consulte le dashboard, **Then** le statut change immédiatement à "Déconnecté" avec un badge rouge
3. **Given** les logs système, **When** j'accède à l'onglet logs du dashboard, **Then** je vois les 100 derniers événements avec filtres par niveau (info, warning, error)
4. **Given** une erreur d'envoi de message, **When** je consulte les logs, **Then** je vois le détail de l'erreur avec le stack trace et le contexte

---

### Edge Cases

- **Déconnexion WhatsApp**: Que se passe-t-il si WhatsApp Web détecte une activité suspecte et déconnecte la session ? Le système doit détecter la déconnexion, marquer la session comme "disconnected", et tenter une reconnexion automatique avec backoff exponentiel.

- **Rate Limiting WhatsApp**: Comment éviter le ban par WhatsApp pour envoi massif ? Le système doit implémenter un rate limiter configurable (ex: max 50 messages/minute par session) et mettre en queue les messages excédentaires.

- **Conteneur redémarré pendant l'envoi**: Si le conteneur redémarre alors qu'un message est en cours d'envoi, le système doit persister les messages en attente dans la base de données et les renvoyer après reconnexion.

- **Numéro non enregistré sur WhatsApp**: Si l'utilisateur essaie d'envoyer un message à un numéro qui n'existe pas sur WhatsApp, le système doit retourner une erreur 404 "Phone number not registered on WhatsApp".

- **Stockage des médias**: Que se passe-t-il si l'espace disque est plein lors de la réception d'un média ? Le système doit rejeter le téléchargement, envoyer une alerte au webhook avec l'erreur, et logger l'incident.

- **Session concurrente**: Si deux clients API essaient d'envoyer des messages via la même session simultanément, le système doit gérer la file d'attente et s'assurer que les messages sont envoyés séquentiellement sans collision.

- **Expiration de session**: Après combien de temps d'inactivité une session doit-elle être considérée comme expirée ? Assumption: après 30 jours d'inactivité, la session est marquée comme inactive mais peut être réactivée manuellement.

## Requirements *(mandatory)*

### Functional Requirements

#### Déploiement et Configuration

- **FR-001**: Le système DOIT être déployable via une seule commande Docker Compose sans configuration manuelle complexe
- **FR-002**: Le système DOIT permettre la configuration via variables d'environnement (port API, URL base, secrets, chemins de stockage)
- **FR-003**: Le système DOIT persister les données critiques (sessions, authentifications WhatsApp) dans des volumes Docker montés
- **FR-004**: Le système DOIT exposer des endpoints de health check (`/health`, `/ready`) pour monitoring et orchestration
- **FR-005**: Le système DOIT supporter la persistance après redémarrage sans perte de sessions actives

#### Gestion des Sessions

- **FR-006**: Le système DOIT permettre la création de nouvelles sessions WhatsApp via API (POST `/api/v1/sessions`)
- **FR-007**: Le système DOIT générer un QR code unique pour chaque session non connectée
- **FR-008**: Le système DOIT détecter automatiquement quand une session se connecte ou se déconnecte
- **FR-009**: Le système DOIT permettre la suppression d'une session et le nettoyage de ses données
- **FR-010**: Le système DOIT isoler complètement les sessions entre elles (pas de partage de messages ou contacts)
- **FR-011**: Le système DOIT permettre de lister toutes les sessions avec leur statut via GET `/api/v1/sessions`
- **FR-012**: Le système DOIT tenter une reconnexion automatique en cas de déconnexion inattendue (max 5 tentatives avec backoff exponentiel)

#### Envoi de Messages

- **FR-013**: Le système DOIT permettre l'envoi de messages texte via POST `/api/v1/sessions/{sessionId}/messages`
- **FR-014**: Le système DOIT valider le format des numéros de téléphone avant envoi (format international E.164)
- **FR-015**: Le système DOIT retourner un identifiant unique pour chaque message envoyé
- **FR-016**: Le système DOIT supporter l'envoi de messages à des contacts individuels
- **FR-017**: Le système DOIT supporter l'envoi de messages à des groupes WhatsApp (via group ID)
- **FR-018**: Le système DOIT supporter les caractères spéciaux et emojis dans les messages
- **FR-019**: Le système DOIT implémenter un rate limiting configurable pour éviter le ban WhatsApp (par défaut: 50 messages/minute/session)
- **FR-020**: Le système DOIT mettre en queue les messages excédant le rate limit et les envoyer progressivement

#### Envoi de Médias

- **FR-021**: Le système DOIT permettre l'envoi d'images (JPEG, PNG, GIF, WebP)
- **FR-022**: Le système DOIT permettre l'envoi de documents (PDF, DOC, XLSX, ZIP, etc.)
- **FR-023**: Le système DOIT permettre l'envoi de vidéos (MP4, AVI, MOV)
- **FR-024**: Le système DOIT permettre l'envoi de fichiers audio (MP3, WAV, OGG)
- **FR-025**: Le système DOIT accepter les médias en base64 ou en multipart/form-data
- **FR-026**: Le système DOIT rejeter les fichiers dépassant 16MB (limite WhatsApp)
- **FR-027**: Le système DOIT permettre d'ajouter une légende (caption) aux médias

#### Réception de Messages

- **FR-028**: Le système DOIT permettre la configuration d'une URL de webhook par session
- **FR-029**: Le système DOIT envoyer une notification webhook (POST) pour chaque message reçu
- **FR-030**: Le webhook DOIT inclure : ID message, ID expéditeur, nom expéditeur, texte, timestamp, type de message
- **FR-031**: Le système DOIT réessayer l'envoi du webhook 3 fois en cas d'échec avec délai exponentiel (1s, 2s, 4s)
- **FR-032**: Le système DOIT logger les échecs de webhook après épuisement des tentatives
- **FR-033**: Le système DOIT permettre la récupération des messages via GET `/api/v1/sessions/{sessionId}/messages` (pagination)
- **FR-034**: Le système DOIT télécharger automatiquement les médias reçus et fournir une URL d'accès dans le webhook

#### Sécurité et Authentification

- **FR-035**: Le système DOIT exiger une authentification pour tous les endpoints API (API Key via header `X-API-Key`)
- **FR-036**: Le système DOIT générer une API key par défaut au premier démarrage et la logger dans les logs
- **FR-037**: Le système DOIT permettre la configuration de multiples API keys via variable d'environnement
- **FR-038**: Le système DOIT valider et sanitizer toutes les entrées utilisateur pour prévenir les injections
- **FR-039**: Le système DOIT logger toutes les tentatives d'authentification échouées
- **FR-040**: Le système DOIT supporter HTTPS/TLS en production (via reverse proxy ou configuration directe)

#### Documentation et API

- **FR-041**: Le système DOIT exposer une documentation Swagger UI interactive à `/api/docs`
- **FR-042**: La documentation DOIT inclure tous les endpoints avec exemples de requêtes/réponses
- **FR-043**: Le système DOIT suivre les conventions REST (GET pour lecture, POST pour création, PUT/PATCH pour modification, DELETE pour suppression)
- **FR-044**: Le système DOIT versionner l'API (préfixe `/api/v1/`)
- **FR-045**: Le système DOIT retourner des réponses JSON structurées avec codes HTTP appropriés (200, 201, 400, 401, 404, 500, 503)
- **FR-046**: Les erreurs DOIVENT inclure un message clair et un code d'erreur machine-readable

#### Observabilité

- **FR-047**: Le système DOIT logger tous les événements au format JSON structuré
- **FR-048**: Les logs DOIVENT inclure les niveaux : DEBUG, INFO, WARN, ERROR, FATAL
- **FR-049**: Le système DOIT exposer des métriques Prometheus à `/metrics` (optionnel) : nombre de sessions actives, messages envoyés/reçus, erreurs
- **FR-050**: Le système DOIT afficher un dashboard web montrant l'état de toutes les sessions en temps réel
- **FR-051**: Le dashboard DOIT permettre la visualisation des logs récents avec filtrage par niveau

### Key Entities

- **Session**: Représente une connexion WhatsApp unique. Attributs : ID unique, nom/label, statut (pending/connected/disconnected), timestamp de création, timestamp dernière activité, URL webhook configurée, QR code (si non connecté), numéro WhatsApp connecté.

- **Message**: Représente un message envoyé ou reçu. Attributs : ID unique, ID session, direction (inbound/outbound), ID expéditeur, ID destinataire, texte, type (text/image/video/document/audio), URL média (si applicable), statut (pending/sent/delivered/read/failed), timestamp, métadonnées (caption, filename pour médias).

- **Webhook**: Représente la configuration de notification pour une session. Attributs : URL, événements activés (message_received, session_status_change), secret pour signature (optionnel), nombre de tentatives, dernier statut d'envoi.

- **Media**: Représente un fichier média envoyé ou reçu. Attributs : ID unique, type (image/video/document/audio), taille, mimetype, chemin de stockage local, URL d'accès publique (si applicable), message associé.

- **APIKey**: Représente une clé d'authentification pour l'API. Attributs : valeur hashée, nom/description, date de création, date d'expiration (optionnelle), permissions (read/write/admin).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un utilisateur doit pouvoir déployer l'application et connecter une session WhatsApp fonctionnelle en moins de 5 minutes (du clone du repo au premier message envoyé)

- **SC-002**: Le système doit permettre l'envoi d'au moins 100 messages texte par minute par session sans erreur ni dégradation de performance

- **SC-003**: Les webhooks de notification doivent être délivrés dans les 2 secondes suivant la réception d'un message WhatsApp dans 99% des cas

- **SC-004**: Une session WhatsApp déconnectée doit se reconnecter automatiquement dans les 30 secondes sans intervention manuelle dans 95% des cas

- **SC-005**: Le système doit supporter au minimum 10 sessions WhatsApp simultanées sur un serveur avec 2 CPU cores et 4GB RAM sans dégradation

- **SC-006**: La documentation Swagger doit permettre à un développeur de réussir son premier appel API (envoi de message) en moins de 10 minutes

- **SC-007**: Les données de session doivent persister à travers les redémarrages du conteneur avec 100% de fiabilité (aucune perte de connexion requérant un nouveau scan QR)

- **SC-008**: 90% des développeurs doivent réussir à intégrer l'API dans leur application en moins de 30 minutes selon les tests utilisateurs

- **SC-009**: Le dashboard doit afficher le changement de statut d'une session (connecté/déconnecté) dans les 3 secondes suivant le changement réel

- **SC-010**: Les logs système doivent permettre de diagnostiquer 95% des problèmes d'envoi de messages sans nécessiter de debugging code

## Assumptions *(documented for reference)*

- **Assumption-001**: L'utilisateur a des connaissances de base en Docker et Docker Compose
- **Assumption-002**: L'utilisateur dispose d'un smartphone avec WhatsApp pour scanner les QR codes
- **Assumption-003**: Le système est déployé sur un réseau avec accès internet stable pour connexion WhatsApp Web
- **Assumption-004**: L'authentification par API Key est suffisante pour un système auto-hébergé (pas de SSO/OAuth dans le MVP)
- **Assumption-005**: Les médias reçus seront stockés localement et accessibles via URL (pas de cloud storage dans le MVP)
- **Assumption-006**: Le rate limiting par défaut de 50 messages/minute est adapté pour éviter le ban WhatsApp (basé sur les pratiques communautaires)
- **Assumption-007**: Les webhooks sont appelés en mode "fire-and-forget" après les 3 tentatives (pas de queue persistante pour les webhooks échoués)
- **Assumption-008**: Une session inactive pendant 30 jours peut être considérée comme abandonnée et candidate à la suppression manuelle

## Dependencies & Constraints

### External Dependencies
- Dépendance à WhatsApp Web Protocol (risque de changement par Meta/WhatsApp)
- Nécessite une connexion internet stable pour maintenir les sessions WhatsApp actives
- Limité par les rate limits imposés par WhatsApp (risque de ban si dépassement)

### Technical Constraints
- Les sessions WhatsApp ne peuvent pas être migrées entre serveurs (liées au QR code initial)
- Impossibilité de se connecter à un même numéro WhatsApp sur plusieurs serveurs simultanément
- Limite WhatsApp de 16MB par média doit être respectée
- Le format de numéro de téléphone doit être international (E.164) pour compatibilité WhatsApp

### Operational Constraints
- Nécessite des volumes persistants correctement configurés pour éviter la perte de sessions
- Requiert un reverse proxy (nginx, traefik) pour HTTPS en production
- Le dashboard web doit être protégé par authentification si exposé publiquement
