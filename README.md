# 🌹 Hamsafer Web

**Together, Always** — A romantic, invite-only video calling web application designed for couples.

## ✨ Features

- **🎥 Crystal-Clear Video Calls** — WebRTC-powered peer-to-peer video and audio with echo cancellation, noise suppression, and auto gain control
- **🔒 Invite-Only Rooms** — Private 2-person rooms with unique 6-character codes
- **📺 Synchronized Watch Party** — Watch YouTube videos together with perfectly synced playback
- **🖥️ Screen Sharing** — Share your screen while keeping your facecam visible
- **💕 Romantic UI** — Beautiful glassmorphic design with floating hearts and warm color palette
- **📱 Fully Responsive** — Works on desktop and mobile browsers

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express, Socket.io |
| Media | Native WebRTC (RTCPeerConnection) |
| Icons | Lucide React |
| Animations | CSS Animations, Canvas Confetti |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/hamsafer-web.git
cd hamsafer-web
```

### 2. Start the Signaling Server
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:3001`

### 3. Start the Frontend
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:5173`

### 4. Use the App
1. Open `http://localhost:5173` in your browser
2. Enter your name and click **Create Room**
3. Share the 6-character room code with your partner
4. Your partner opens the same URL, enters the code, and joins
5. Enjoy your private video call! 💕

## 📁 Project Structure
```
hamsafer-web/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── Room.jsx
│   │   │   ├── VideoChat.jsx
│   │   │   ├── WatchParty.jsx
│   │   │   ├── ScreenShare.jsx
│   │   │   ├── CallControls.jsx
│   │   │   └── FloatingHearts.jsx
│   │   ├── hooks/           # Custom React hooks
│   │   │   ├── useSocket.js
│   │   │   └── useWebRTC.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── server/                  # Node.js signaling server
│   ├── index.js
│   └── package.json
├── .gitignore
└── README.md
```

## 📋 Available Scripts

### Server
| Command | Description |
|---------|-------------|
| `npm run dev` | Start with hot reload (nodemon) |
| `npm start` | Start production server |

### Client
| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## 🔧 Configuration

- **Server Port**: Set `PORT` environment variable (default: `3001`)
- **STUN Servers**: Configured with Google's public STUN servers for NAT traversal

## 📄 License

MIT

---

*Made with 💕 for couples who want to stay connected*
