# Tauri + React Starter Template

A modern, production-ready starter template for building desktop applications with Tauri, React, TypeScript, and a comprehensive tech stack.

## Features

- **Tauri 2.0** - Build smaller, faster, and more secure desktop applications
- **React 19** - Latest React with modern hooks and concurrent features
- **TypeScript** - Full type safety across frontend and backend
- **TanStack Router** - Type-safe routing with file-based routing
- **TanStack Query** - Powerful data fetching and state management
- **TanStack Table** - Headless table with sorting, filtering, and pagination
- **SQLite Database** - Built-in local database with Tauri plugin
- **Tailwind CSS 4** - Utility-first CSS framework
- **DaisyUI** - Beautiful component library for Tailwind
- **Vertical Slice Architecture** - Organized by features, not layers
- **ESLint + Prettier** - Code quality and formatting out of the box
- **Lucide Icons** - Beautiful, consistent icon set

## Prerequisites

- **Node.js** 18+ or **Bun** (recommended)
- **Rust** 1.70+
- **pnpm** / **npm** / **bun** - Package manager

### Platform-Specific Requirements

**Windows:**
- [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (usually pre-installed on Windows 10/11)

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`

**Linux:**
- [Tauri Linux prerequisites](https://v2.tauri.app/start/prerequisites/#linux)

## Quick Start

### 1. Use This Template

Click **"Use this template"** on GitHub, or:

```bash
# Using GitHub CLI
gh repo create my-app --template yourusername/tauri-starter

# Or clone directly
git clone https://github.com/yourusername/tauri-starter.git my-app
cd my-app
```

### 2. Run Setup Script

```bash
# With Node.js
node setup.js

# Or with Bun
bun setup.js
```

This will:
- Copy environment variable templates
- Install dependencies
- Initialize the database

### 3. Start Development

```bash
# Using npm
npm run tauri dev

# Using pnpm
pnpm tauri dev

# Using bun
bun tauri dev
```
### 3. Start Development on android

```bash
# Using bun
bun tauri android init
bun tauri android dev

```

## Manual Setup

If you prefer manual setup:

```bash
# 1. Install dependencies
bun install

# 2. Copy environment files
cp .env.example .env
cp src-tauri/.env.example src-tauri/.env

# 3. Start development
bun tauri dev
```

## Project Structure

```
tauri-starter/
├── src/
│   ├── slices/              # Feature slices (Vertical Slice Architecture)
│   │   └── todos/           # Example: Todos feature
│   │       ├── list-todos/
│   │       ├── create-todo/
│   │       ├── update-todo/
│   │       └── shared/
│   ├── core/                # Shared infrastructure
│   │   ├── components/      # Reusable UI components
│   │   ├── database/        # Database client
│   │   └── ui/              # Layout components
│   ├── routes/              # TanStack Router routes
│   └── config/              # App configuration
├── src-tauri/               # Rust backend
│   ├── src/
│   └── Cargo.toml
├── scripts/
│   └── create-slice.js      # Slice generator
└── package.json
```

## Available Scripts

### Development

```bash
npm run dev              # Start Vite dev server
npm run tauri dev        # Start Tauri + Vite in dev mode
```

### Building

```bash
npm run build            # Build for production
npm run tauri build      # Build Tauri app for production
```

### Code Quality

```bash
npm run lint             # Check for linting errors
npm run lint:fix         # Auto-fix linting errors
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # Run TypeScript type checking
```

### Code Generation

```bash
# Generate a new feature slice
npm run slice:create <feature> <use-case-1> [use-case-2...]

# Example: Create a users feature with CRUD operations
npm run slice:create users list create update delete

# Or run directly with Node
node scripts/create-slice.js users list create update delete
```

## Architecture

This template uses **Vertical Slice Architecture** for maximum modularity:

- Each feature is self-contained in its own slice
- Minimal shared code - only truly global utilities in `core/`
- Easy to add and remove features without affecting others
- Perfect for AI-assisted development and junior developers

**Learn more:** See [ARCHITECTURE.md](./ARCHITECTURE.md)

## Tech Stack Details

### Frontend

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Tailwind CSS 4** - Styling
- **DaisyUI** - Component library

### State Management & Data Fetching

- **TanStack Router** - Type-safe routing
- **TanStack Query** - Server state management
- **TanStack Table** - Headless table component
- **TanStack Form** - Form state management

### Backend

- **Tauri 2.0** - Desktop app framework
- **Rust** - Backend language
- **SQLite** - Local database via `tauri-plugin-sql`

### Development Tools

- **ESLint 9** - Linting with flat config
- **Prettier** - Code formatting
- **TypeScript ESLint** - TypeScript linting rules
- **Lucide React** - Icon library

## Environment Variables

### Frontend (`.env`)

```env
VITE_ENABLE_DEVTOOLS=true     # Enable TanStack Query devtools
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=My App
```

Access in code:
```typescript
const devtools = import.meta.env.VITE_ENABLE_DEVTOOLS === 'true'
```

### Backend (`src-tauri/.env`)

```env
DATABASE_URL=sqlite:./data.db  # SQLite database path
APP_NAME=My App
LOG_LEVEL=info
```

Access in Rust:
```rust
use std::env;
let db_url = env::var("DATABASE_URL").unwrap_or_default();
```

## Creating Your First Feature

### 1. Generate the Slice

```bash
npm run slice:create products list create update delete
```

### 2. Add Database Table

Edit [src/core/database/client.ts](./src/core/database/client.ts):

```typescript
await db.execute(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`)
```

### 3. Add to Navigation

Edit [src/config/nav-items.ts](./src/config/nav-items.ts):

```typescript
import { productsConfig } from '../slices/products/config'

export const navItems: NavItem[] = [
  todosConfig,
  productsConfig, // Add your new feature here
]
```

### 4. Implement Your Logic

The generator creates templates - now fill in your business logic in:
- `src/slices/products/shared/database.ts` - Database operations
- `src/slices/products/list-products/ListProducts.tsx` - UI components
- `src/slices/products/list-products/useListProducts.ts` - React Query hooks

## Building for Production

```bash
# Development build (faster, includes debug info)
npm run tauri build

# Production build (optimized)
npm run tauri build -- --config src-tauri/tauri.conf.json
```

Outputs:
- **Windows**: `.exe` installer in `src-tauri/target/release/bundle/`
- **macOS**: `.dmg` in `src-tauri/target/release/bundle/`
- **Linux**: `.deb`, `.AppImage` in `src-tauri/target/release/bundle/`

## Documentation

- [SETUP.md](./SETUP.md) - Detailed setup and configuration guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture patterns and best practices
- [Tauri Docs](https://v2.tauri.app/) - Official Tauri documentation
- [TanStack Router](https://tanstack.com/router) - Router documentation
- [TanStack Query](https://tanstack.com/query) - Query documentation

## Common Issues

### `sqlite3` Error on Build

If you see SQLite-related errors, make sure the `tauri-plugin-sql` dependency is correctly installed:

```bash
bun install
```

### WebView2 Not Found (Windows)

Install [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

### Build Fails on macOS

Make sure Xcode Command Line Tools are installed:

```bash
xcode-select --install
```

## Contributing

This is a template repository. Feel free to customize it for your needs!

## License

MIT License - feel free to use this template for any project.

---

**Built with:**
- [Tauri](https://tauri.app/)
- [React](https://react.dev/)
- [TanStack](https://tanstack.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [DaisyUI](https://daisyui.com/)

---

Happy coding! If you find this template useful, please give it a star.
