# Single Port Access ✅ (localhost:3000)

**Final Setup:**
- Frontend: **Port 3000** (vite.config.ts) 
- Backend/DB: Port 5000 (proxied)
- API calls: `/api` → auto proxies to backend (services/api.ts + vite proxy)

**One-command:** `npm run dev` starts both!

**Open:** http://localhost:3000 (frontend + all APIs/DB via proxy)

**Admin:** admin@gyanastu.com / password

Database/backend transparent - single port experience!
