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

## 📄 License
This project is [MIT Licensed](LICENSE).

---

<p align="center">
	<b>Unleash your team's creativity with SyncSketch!</b>
</p>

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build
yarn dlx turbo build
pnpm exec turbo build
```

You can build a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo build --filter=docs

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo build --filter=docs
yarn exec turbo build --filter=docs
pnpm exec turbo build --filter=docs
```

### Develop

To develop all apps and packages, run the following command:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev
yarn exec turbo dev
pnpm exec turbo dev
```

You can develop a specific package by using a [filter](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters):

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo dev --filter=web

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo dev --filter=web
yarn exec turbo dev --filter=web
pnpm exec turbo dev --filter=web
```

### Remote Caching

> [!TIP]
> Vercel Remote Cache is free for all plans. Get started today at [vercel.com](https://vercel.com/signup?/signup?utm_source=remote-cache-sdk&utm_campaign=free_remote_cache).

Turborepo can use a technique known as [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching) to share cache artifacts across machines, enabling you to share build caches with your team and CI/CD pipelines.

By default, Turborepo will cache locally. To enable Remote Caching you will need an account with Vercel. If you don't have an account you can [create one](https://vercel.com/signup?utm_source=turborepo-examples), then enter the following commands:

```
cd my-turborepo

# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo login

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo login
yarn exec turbo login
pnpm exec turbo login
```

This will authenticate the Turborepo CLI with your [Vercel account](https://vercel.com/docs/concepts/personal-accounts/overview).

Next, you can link your Turborepo to your Remote Cache by running the following command from the root of your Turborepo:

```
# With [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation) installed (recommended)
turbo link

# Without [global `turbo`](https://turborepo.com/docs/getting-started/installation#global-installation), use your package manager
npx turbo link
yarn exec turbo link
pnpm exec turbo link
```

## Useful Links

Learn more about the power of Turborepo:

- [Tasks](https://turborepo.com/docs/crafting-your-repository/running-tasks)
- [Caching](https://turborepo.com/docs/crafting-your-repository/caching)
- [Remote Caching](https://turborepo.com/docs/core-concepts/remote-caching)
- [Filtering](https://turborepo.com/docs/crafting-your-repository/running-tasks#using-filters)
- [Configuration Options](https://turborepo.com/docs/reference/configuration)
- [CLI Usage](https://turborepo.com/docs/reference/command-line-reference)
