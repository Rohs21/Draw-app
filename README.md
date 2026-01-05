<p align="center">
	<img width="1897" height="964" alt="image" src="https://github.com/user-attachments/assets/97ed73a6-60eb-415b-b187-91aa488949d0" />
</p>

# 🎨 SyncSketch: Real-Time Collaborative Drawing App

Welcome to **SyncSketch** – the next-generation collaborative whiteboard and sketching platform! Effortlessly brainstorm, wireframe, and create with your team in real time. Save your work to the cloud, invite collaborators instantly, and enjoy a seamless, blazing-fast drawing experience.

## 🚀 Why SyncSketch?
- **Real-Time Collaboration:** Draw together with your team, see live cursors, and sync changes instantly.
- **Cloud Storage:** Save and access your sketches from anywhere, anytime.
- **No Sign-Up Required for Guests:** Share a link and start collaborating in seconds.
- **Smart Shapes & Tools:** Sketch rough shapes and watch them transform into perfect geometry.
- **Flexible Export:** Download your work as PNG, SVG, or JSON.
- **Cross-Platform:** Works beautifully on desktop, tablet, and mobile.
- **Open Source:** Support and contribute to a growing creative community.

---

## 🛠️ Getting Started

Follow these steps to set up SyncSketch locally:

### 1. Clone the Repository
```bash
git clone https://github.com/Rohs21/Draw-app.git
cd Draw-app
```

### 2. Install Dependencies
We use [pnpm](https://pnpm.io/) for fast, efficient monorepo management:
```bash
pnpm install
```

### 3. Set Up the Database (Optional)
If you want to enable cloud saving and authentication features, set up the database:
```bash
cd packages/db
pnpm prisma migrate dev
```

### 4. Start the Development Servers
Start all apps (frontend, backend, websocket, etc.) with Turbo:
```bash
pnpm run dev
```
Or start individual apps:
```bash
cd apps/excalidraw-frontend
pnpm run dev
```

### 5. Open in Your Browser
Visit [http://localhost:3000](http://localhost:3000) to start drawing!

---

## 📁 Monorepo Structure
- `apps/` – Frontend, backend, and websocket services
- `packages/` – Shared code, types, and database
- `ui/` – Reusable UI components
- `common/` – Shared types and utilities

---

## ✨ Features
- Real-time collaborative canvas
- Guest access with no sign-up
- Smart shape recognition
- Export to PNG, SVG, JSON
- Cloud storage & authentication
- Responsive, modern UI
- Open source & community-driven

---

## 🤝 Contributing
We welcome contributions! Please open issues or pull requests for features, bug fixes, or suggestions.

---
