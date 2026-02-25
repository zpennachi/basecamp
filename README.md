# Basecamp — 3D Particle System

An interactive, responsive 3D particle system built with **Three.js**, **Vite**, and **lil-gui**.
Runs entirely in the browser — no backend required.

**Live demo:** https://zpennachi.github.io/basecamp/

---

## Features

- GPU-driven particles via custom GLSL vertex/fragment shaders
- Real-time FBM (fractal Brownian motion) noise turbulence
- Post-processing bloom/glow (Three.js `UnrealBloomPass`)
- 6 color palettes: Galaxy, Fire, Ocean, Neon, Mono, Sunset
- Full parameter UI (lil-gui): count, size, speed, turbulence, color, bloom, background, camera
- Orbit controls (drag to rotate, scroll to zoom)
- Responsive: full-bleed canvas; UI docks to bottom on mobile and auto-collapses; particle count auto-reduced on small screens

---

## Local development

**Requirements:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (hot-reload)
npm run dev
```

Open http://localhost:5173/ in your browser.

---

## Build for production

```bash
npm run build       # outputs to dist/
npm run preview     # preview the production build locally
```

The build sets `base: '/basecamp/'` for GitHub Pages.
To serve from a different path, edit `vite.config.js`.

---

## GitHub Pages deployment

Deployment is automated via **GitHub Actions** on every push to `main`.

### Manual setup (one-time, per repo)

1. Go to **Settings → Pages** in the GitHub repo.
2. Under **Source**, select **GitHub Actions**.
3. Push to `main` — the workflow at `.github/workflows/deploy.yml` builds and deploys automatically.

The live site will be available at:
```
https://<your-username>.github.io/basecamp/
```

### Workflow overview

| Step | Action |
|------|--------|
| Trigger | Push to `main` (or manual dispatch) |
| Build | `npm install` + `npm run build` (Node 20) |
| Deploy | `actions/deploy-pages@v4` → GitHub Pages |

---

## Project structure

```
basecamp/
├── .github/workflows/deploy.yml   GitHub Actions Pages deploy
├── public/
│   └── .nojekyll                  Disable Jekyll processing
├── src/
│   ├── main.js                    Scene, renderer, animation loop
│   ├── ParticleSystem.js          Particle geometry + GLSL shaders
│   ├── gui.js                     lil-gui control panel
│   └── style.css                  Responsive layout & theming
├── index.html
├── package.json
└── vite.config.js
```

---

## Notes

- This repo is intended to be driven via headless CLI agents (e.g., Claude Code).
- Legacy script: `python3 hello.py`
