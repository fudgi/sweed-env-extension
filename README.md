# EnvSwitcher

A Chrome extension (Manifest V3) for quickly opening **Sweed** web apps in the right **environment** with the right **store** and **feature** parameters. The popup remembers your last choices and keeps a **history** of opened URLs (with optional **favourites**).

## Features

- **Environments** — Development: Feature, Stage, Dev, Demo, Pilot. Live: Production, Prime, Curaleaf.
- **Feature mode** — When Feature is selected, enter **Project** and **Ticket** (feature number); those values are required before opening apps.
- **Store** — Store ID is used for shop, cashier, kiosk, and second-screen URLs (defaults are applied where the UI does).
- **Shortcuts** — Portal, Cashier, Shop, Kiosk 2.0, Second Screen: each builds the correct host/path for the selected environment.
- **Persistence** — Selected environment, project, ticket, store, and last sidebar tab are saved with `chrome.storage.local`.
- **History** — Every opened URL is recorded (up to 50 entries). From the History tab you can:
  - Open an entry again
  - **Star** an item to mark it as a favourite; click again to remove. Favourites appear at the top of the list.
  - Remove a single entry or clear all history.

## Requirements

- Node.js (for building)
- Chromium-based browser (Chrome, Edge, Brave, etc.)

## Development

```bash
npm install
```

| Command        | Description                                      |
| -------------- | ------------------------------------------------ |
| `npm run build` | One-off production build into `dist/`           |
| `npm run dev`   | Rebuild on file changes (`vite build --watch`)  |
| `npm run server` | Vite dev server (optional; extension loads from built files) |

Source lives under `src/` (popup HTML/JS/CSS). Static assets and `manifest.json` are in `public/` and are copied into `dist/` on build.

## Install the unpacked extension

1. Run `npm run build`.
2. Open `chrome://extensions` (or your browser’s extensions page).
3. Enable **Developer mode**.
4. Click **Load unpacked** and choose the **`dist`** folder (not the repo root).

After code changes, run `build` again (or keep `npm run dev` running) and use **Reload** on the extension card.

## Project layout

```
public/          # manifest.json, icon.png (copied to dist)
src/             # popup UI and logic (Vite entry: popup.html)
dist/            # Build output — load this folder in the browser
```

## Permissions

- **`storage`** — Save form state, history, favourites, and last active tab.
