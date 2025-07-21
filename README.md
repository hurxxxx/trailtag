# TrailTag

📚 Learning Program Participation Tracking System with QR Code Integration

[![React](https://img.shields.io/badge/React-19.1.0-blue.svg)](https://reactjs.org/)
[![Material-UI](https://img.shields.io/badge/MUI-7.2.0-blue.svg)](https://mui.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📋 Overview

TrailTag is a web application for tracking learning program participation using QR codes. It supports admin, student, and parent roles for managing programs, attendance, and monitoring activities.

### ✨ Features

- 📱 QR code check-in system
- 👥 Multi-role user management (Admin, Student, Parent)
- 🌍 Internationalization (English, Korean, Japanese)
- 📊 Participation tracking and statistics
- 🔐 JWT authentication

## 👥 User Roles

### 🔧 Administrator
- Create and manage learning programs
- Generate QR codes for programs
- Monitor student participation
- Manage user accounts
- View analytics and reports

### 🎓 Student
- Check-in to programs via QR code scanning
- View participation history
- Track progress across programs
- Access program information

### 👨‍👩‍👧‍👦 Parent
- Monitor child's activities and participation
- View attendance reports
- Track multiple children's progress

## 🛠️ Technology Stack

### Frontend
- React 19.1.0
- Material-UI (MUI) 7.2.0
- React Router DOM 7.7.0
- Vite
- i18next

### Backend
- Node.js
- Express 5.1.0
- SQLite (better-sqlite3)
- JWT
- bcrypt

### QR Code
- html5-qrcode (scanning)
- qrcode (generation)

## 🚀 Installation

### 📋 Prerequisites
- Node.js 18+
- npm

### 📦 Setup

1. Clone the repository
```bash
git clone https://github.com/hurxxxx/trailtag.git
cd trailtag
```

2. Install dependencies
```bash
npm install
```

### 🔧 Development

#### HTTP Mode (Default)
```bash
npm run start
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

#### HTTPS Mode (Mobile QR Testing)
```bash
npm run start:https
```
- Frontend: https://localhost:5173
- Backend API: http://localhost:3001

📱 Note: HTTPS is required for camera access on mobile browsers.

### 🏗️ Production

#### Build and Deploy
```bash
npm run build:prod
npm run server:prod
```

Or use the combined command:
```bash
npm run deploy
```

Production server: http://localhost:9883

## 🔐 Default Admin Account

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

⚠️ Change the default password in production environments.

## ⚙️ Configuration

### Environment Files
- `.env` - Development configuration
- `.env.production` - Production configuration

### API URL Configuration
```bash
# Development
VITE_API_URL=http://localhost:3001/api

# Production
VITE_API_URL=/api
```

## 📚 Usage

### Getting Started
1. Login with the default admin account
2. Create your first learning program
3. QR codes are automatically generated for each program
4. Add student and parent accounts
5. Students can check in by scanning QR codes

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run start` | Start development server (HTTP) |
| `npm run start:https` | Start development server (HTTPS) |
| `npm run build:prod` | Build for production |
| `npm run server:prod` | Start production server |
| `npm run deploy` | Build and deploy |
| `npm run i18n:extract` | Extract translation keys |

### 🌍 Internationalization

Supported languages:
- English (en)
- Korean (ko)
- Japanese (ja)

Translation files: `public/locales/{language}/translation.json`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/NewFeature`)
3. Commit your changes (`git commit -m 'Add NewFeature'`)
4. Push to the branch (`git push origin feature/NewFeature`)
5. Open a Pull Request

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.
