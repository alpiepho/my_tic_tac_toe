# My Tic-Tac-Toe

A Progressive Web App (PWA) for the classic Tic-Tac-Toe game.

🎮 **Live Demo:** https://alpiepho.github.io/my_tic_tac_toe/

---

## Features

- **Dark / Light mode** — toggle in the header, persisted across sessions
- **1-Player vs Computer** — three AI difficulty levels:
  - Easy: random moves
  - Medium: wins when possible, blocks your wins, otherwise random
  - Hard: unbeatable minimax AI with alpha-beta pruning
- **2-Player** — local hot-seat multiplayer
- **Editable player names** — set your names in Settings, saved automatically
- **Persistent stats** — Wins / Losses / Draws tracked per mode (1P and 2P separately), stored in `localStorage`
- **Reset options** — Reset the current game or wipe all settings & stats
- **Info page** — QR code + Copy Link pointing to the deployed app
- **Creative win/lose/draw notifications** — confetti, animations, and difficulty-aware quips
- **PWA** — installable on mobile & desktop, works offline after first load

---

## Project Structure

```
my_tic_tac_toe/
├── index.html      # App shell + all modals
├── style.css       # Responsive styles, dark/light themes, animations
├── app.js          # Game logic, AI, state management, service worker registration
├── manifest.json   # PWA manifest
├── sw.js           # Service worker (offline caching)
├── icon.svg        # App icon
└── README.md       # This file
```

---

## Local Development

No build tools required — this is plain HTML, CSS, and JavaScript.

### Option 1 — VS Code Live Server (recommended)

1. Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
2. Open the project folder in VS Code
3. Click **Go Live** in the status bar
4. Opens at `http://127.0.0.1:5500`

### Option 2 — Python HTTP server

```bash
# Python 3
python3 -m http.server 8080
# then open http://localhost:8080
```

### Option 3 — Node `serve`

```bash
npx serve .
```

> **Note:** Opening `index.html` directly as a `file://` URL will work for basic gameplay but the Service Worker (offline support) requires an HTTP server.

---

## Deployment — GitHub Pages

### First-time setup

1. Create a new repository on GitHub named **`my_tic_tac_toe`**

2. Initialize and push from this folder:

```bash
cd /path/to/my_tic_tac_toe

git init
git add .
git commit -m "Initial release: My Tic-Tac-Toe PWA"
git branch -M main
git remote add origin git@github.com:alpiepho/my_tic_tac_toe.git
git push -u origin main
```

3. Enable GitHub Pages:
   - Go to the repo on GitHub → **Settings** → **Pages**
   - Source: **Deploy from a branch**
   - Branch: `main` / `/ (root)`
   - Click **Save**

4. After ~60 seconds the app is live at:
   `https://alpiepho.github.io/my_tic_tac_toe/`

### Updating the app

```bash
git add .
git commit -m "Your change description"
git push
```

GitHub Pages redeploys automatically on every push to `main`.

---

## PWA Installation

Once deployed (or on a local HTTPS server):

- **iOS Safari:** Share → Add to Home Screen
- **Android Chrome:** Menu → Add to Home Screen (or install banner)
- **Desktop Chrome/Edge:** Install icon in the address bar

The app caches all assets on first load and works fully offline thereafter.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 (custom properties, grid, keyframe animations) |
| Logic | Vanilla JavaScript (ES2020) |
| AI | Minimax with alpha-beta pruning |
| Offline | Service Worker (Cache API) |
| PWA | Web App Manifest |
| QR Code | [QRCode.js](https://github.com/davidshimjs/qrcodejs) (CDN, cached offline) |

No frameworks, no build step, no dependencies to install.
