# 🚀 YesApp - WhatsApp API REST

Self-hosted WhatsApp API with multi-session support, modern React dashboard, and seamless n8n integration.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![React](https://img.shields.io/badge/react-18.3.1-blue)](https://reactjs.org/)

---

## ✨ Features

### Backend API
- 🔐 **Secure API Key Authentication** - SHA-256 hashed keys
- 📱 **Multi-Session Management** - Handle multiple WhatsApp accounts
- 👥 **WhatsApp Groups Support** - List and send messages to groups
- 📤 **Send Messages** - Text and media (images, videos, documents)
- ⚡ **Rate Limiting** - 50 messages/min with anti-spam protection
- 🔄 **Auto-Reconnection** - Sessions automatically reconnect
- 💾 **SQLite Database** - Lightweight, portable, with auto-migrations
- ✅ **Input Validation** - E.164 phone numbers, UUIDs, content validation

### Dashboard
- 🎨 **Modern UI** - Built with React 18 + TailwindCSS
- 📊 **Session Management** - Create, monitor, and delete sessions
- 📱 **QR Code Display** - Easy WhatsApp connection
- 💬 **Message Interface** - Send messages directly from dashboard
- 👥 **Groups List** - View all groups with searchable interface
- 📋 **Copy IDs** - One-click copy for Session ID, Group ID, API Key
- 🔄 **Real-time Updates** - Auto-refresh with polling
- 📱 **Responsive Design** - Works on desktop and mobile

### n8n Integration
- 🤖 **Complete Documentation** - Step-by-step guides
- 📝 **Ready Workflows** - Import and use immediately
- 🖼️ **Image Support** - Send images from URLs with Base64 conversion
- 👥 **Groups Support** - Full group messaging capabilities
- ⚡ **Examples** - curl, PowerShell, and n8n examples included

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20 LTS or higher
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/yesapp-whatsapp-api.git
cd yesapp-whatsapp-api

# Install backend dependencies
cd backend
npm install

# Install dashboard dependencies
cd ../dashboard
npm install
```

### Configuration

```bash
# Backend configuration
cd backend
cp .env.example .env
# Edit .env if needed (defaults work for development)

# Dashboard configuration will be done after first backend start
```

### Start the Application

```bash
# Terminal 1 - Start Backend
cd backend
npm run dev
# Backend running on http://localhost:3000

# Terminal 2 - Start Dashboard
cd dashboard
npm run dev
# Dashboard running on http://localhost:5173
```

### First Connection

1. **Backend starts** and generates an API Key (shown in console)
2. **Copy the API Key** from backend logs
3. **Configure dashboard**:
   ```bash
   cd dashboard
   echo "VITE_API_KEY=your-api-key-here" > .env
   ```
4. **Restart dashboard**: Ctrl+C then `npm run dev`
5. **Open dashboard**: http://localhost:5173
6. **Create a session** and scan the QR code with WhatsApp
7. **Start automating!** 🎉

---

## 📖 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Complete setup instructions
- **[n8n Integration Guide](N8N_INTEGRATION_GUIDE.md)** - Automate with n8n
- **[Groups Guide](GROUPS_GUIDE.md)** - Work with WhatsApp groups
- **[Project Summary](PROJECT_SUMMARY.md)** - Architecture and features
- **[Deploy to GitHub](DEPLOY_TO_GITHUB.md)** - Publish your project

---

## 📡 API Endpoints

### Sessions
- `GET /api/v1/sessions` - List all sessions
- `POST /api/v1/sessions` - Create a new session
- `GET /api/v1/sessions/:id` - Get session details
- `DELETE /api/v1/sessions/:id` - Delete a session
- `GET /api/v1/sessions/:id/qr` - Get QR code
- `POST /api/v1/sessions/:id/reconnect` - Reconnect session

### Messages
- `POST /api/v1/sessions/:id/messages` - Send a message
- `GET /api/v1/sessions/:id/messages` - Get messages (paginated)
- `GET /api/v1/sessions/:id/messages/:messageId` - Get message details

### Groups
- `GET /api/v1/sessions/:id/groups` - List all groups
- `GET /api/v1/sessions/:id/groups/:groupId` - Get group details

---

## 🛠️ Tech Stack

### Backend
- **Node.js 20 LTS** - Runtime
- **Express.js** - Web framework
- **SQLite (better-sqlite3)** - Database
- **whatsapp-web.js** - WhatsApp integration
- **Puppeteer** - Browser automation

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Axios** - HTTP client

### Integration
- **n8n** - Workflow automation
- **REST API** - Standard HTTP/JSON

---

## 💡 Usage Examples

### Send a Text Message (curl)

```bash
curl -X POST http://localhost:3000/api/v1/sessions/SESSION_ID/messages \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+33612345678",
    "text": "Hello from YesApp!"
  }'
```

### Send to a WhatsApp Group

```bash
curl -X POST http://localhost:3000/api/v1/sessions/SESSION_ID/messages \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "120363XXXXX@g.us",
    "text": "Hello group!"
  }'
```

### List Groups

```bash
curl -X GET http://localhost:3000/api/v1/sessions/SESSION_ID/groups \
  -H "X-API-Key: YOUR_API_KEY"
```

---

## 📸 Screenshots

### Dashboard - Session Management
![Dashboard](docs/screenshots/dashboard.png)

### Groups List
![Groups](docs/screenshots/groups.png)

### n8n Integration
![n8n](docs/screenshots/n8n.png)

---

## 🔒 Security

- API Keys are SHA-256 hashed in database
- Environment variables for sensitive data
- Input validation on all endpoints
- Rate limiting to prevent abuse
- CORS enabled for dashboard
- Helmet.js security headers

---

## 🐛 Troubleshooting

### Backend won't start
- Check Node.js version: `node --version` (should be 20+)
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Dashboard shows "Cannot connect to API"
- Ensure backend is running on port 3000
- Check `.env` file in dashboard has correct API Key
- Restart dashboard after updating `.env`

### WhatsApp won't connect
- Ensure QR code is scanned within 60 seconds
- Check that WhatsApp isn't already connected on 4 devices
- Try reconnecting from dashboard

See [QUICK_START.md](QUICK_START.md) for more troubleshooting tips.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ⚠️ Disclaimer

This project is not affiliated, associated, authorized, endorsed by, or in any way officially connected with WhatsApp or any of its subsidiaries or its affiliates. The official WhatsApp website can be found at https://whatsapp.com.

Use this software responsibly and in accordance with WhatsApp's Terms of Service.

---

## 🙏 Acknowledgments

- [whatsapp-web.js](https://github.com/pedroslopez/whatsapp-web.js) - WhatsApp Web API client
- [n8n](https://n8n.io/) - Workflow automation platform
- [React](https://reactjs.org/) - UI framework
- [TailwindCSS](https://tailwindcss.com/) - CSS framework

---

## 📞 Support

- 📖 Documentation: See guides in the project
- 🐛 Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/yesapp-whatsapp-api/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/YOUR_USERNAME/yesapp-whatsapp-api/discussions)

---

**Made with ❤️ for automation enthusiasts**

⭐ **Star this repo** if you find it useful!
