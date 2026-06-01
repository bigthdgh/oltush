# Oltush Project Notes

## Frontend
- Stack: React 18 + Vite + Tailwind CSS + framer-motion + lucide-react
- Build command: `cd frontend && npm run build`
- Dev command: `cd frontend && npm run dev` (port 3000, proxies /api to localhost:8080)
- Design system: "Oltush Forest" — cream/mesh background, glass morphism cards, forest + wood gradients

## Backend
- Go server on port 8080
- API base: `/api`
- Vite dev proxy: `/api -> http://localhost:8080`

## Telegram Mini App
- WebApp script loaded in index.html
- useTelegram hook handles: ready/expand, haptic feedback, back/main buttons, theme matching, openLink
- Supports dark mode via Telegram colorScheme
