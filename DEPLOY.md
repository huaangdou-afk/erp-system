# SimpleERP Backend Deployment Guide

## Recommended Platform: Railway

Railway is the best free hosting option for this backend because:
- **Persistent disk storage** (512 MB free) — SQLite DB file survives restarts
- **Native Node.js support** — zero config required for most apps
- **No cold start fees** — stays responsive unlike Render's free tier
- **$5/month credit free** — enough for a small production app

Render and Fly.io are alternatives but have drawbacks for SQLite:
- **Render free tier**: spins down after 15 min inactivity, ephemeral disk (DB resets)
- **Fly.io**: ephemeral filesystem by default, requires volume setup, more complex

---

## Step-by-Step: Deploy to Railway

### Prerequisites
- [GitHub account](https://github.com) with the repo pushed
- [Railway account](https://railway.app) (sign up with GitHub)

### Step 1: Connect Repo to Railway

1. Go to [https://railway.app](https://railway.app) and log in
2. Click **New Project** → **Deploy from GitHub repo**
3. Authorize GitHub and select the `erp-system` repository
4. Railway will auto-detect Node.js and run `npm install`

### Step 2: Configure Start Command

Railway needs to know to run only the backend server:

1. In the Railway dashboard, go to **Settings** for your deployment
2. Under **Start Command**, set:
   ```
   node src/server/index.js
   ```
   Or use the `Railway.toml` file committed to the repo (see below)

### Step 3: Set Port Environment Variable

Railway assigns a random port via the `PORT` environment variable. The server must use it:

The `src/server/index.js` uses `process.env.PORT || 3001` so it works on both.

If Railway still shows an error, add a custom environment variable in the Railway dashboard:
- Key: `PORT`
- Value: `3001`

### Step 4: Mount a Persistent Volume (Required for SQLite)

By default Railway's filesystem is ephemeral — the DB resets on every deploy. To persist the SQLite file:

1. In Railway dashboard → **Storage** tab → **Add Persistent Disk**
2. Name it `erp-data` (or any name)
3. Mount it to path: `/data` (or any path)
4. Reference the volume mount path in `Railway.toml`:

```toml
[deploys]
volumeMount = "/data"

[deployments]
[startCommand = "node src/server/index.js"]
```

**Important**: You also need to update the database path in `src/server/db/database.js` to point to the mounted volume. Replace the `DB_PATH` line with:

```javascript
// Use Railway persistent volume mount path, fallback to local dev path
const DB_PATH = process.env.RAILWAY_VOLUME_MOUNT
  ? `${process.env.RAILWAY_VOLUME_MOUNT}/erp.db`
  : path.join(__dirname, '../../db/erp.db');
```

> **Note**: For a quick start without persistent storage (data resets on redeploy), skip the volume step. The app will work but data will be lost on each restart.

### Step 5: Get Your Backend URL

1. After deployment, Railway shows a URL like `https://erp-system.up.railway.app`
2. Or go to **Settings** → **Networking** → **Public Networking** → copy the **https URL**
3. Your API base URL is:
   ```
   https://<your-app-name>.up.railway.app/api
   ```
4. Test it:
   ```
   curl https://<your-app-name>.up.railway.app/api/health
   ```
   Expected response: `{"success":true,"message":"SimpleERP server is running"}`

---

## Connecting Frontend to Deployed Backend

Update the frontend API base URL in `src/client/src/api/index.js` (or wherever your Axios/fetch calls are made):

```javascript
const API_BASE = 'https://<your-app-name>.up.railway.app/api';
```

Or set a `VITE_API_BASE_URL` environment variable in the frontend.

---

## Files Created for Deployment

### `Railway.toml`
Configures the Railway deployment (start command, port).

### `package.json` (updated)
- Added `"start": "node src/server/index.js"` script
- Added `"engines": {"node": ">=18"}` to ensure compatible Node version

---

## Troubleshooting

### "Cannot find module 'sql.js'"
Run `npm install` manually or check that Railway's build log shows `npm install` completed.

### Database file not found on restart
Ensure a persistent volume is mounted and `RAILWAY_VOLUME_MOUNT` path is used in `database.js`.

### CORS errors in browser
The backend already has `cors` middleware enabled. If issues persist, set the frontend origin explicitly:
```javascript
app.use(cors({ origin: 'https://your-frontend-url.com' }));
```

### Cold start / slow first request
Railway spins down after 5 min of inactivity on free tier. First request after idle may take ~30s.

---

## Alternative: Render (Free Tier)

If using Render instead:

1. Create a **Web Service**
2. Connect GitHub repo
3. Set:
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server/index.js`
   - **Instance Type**: Free
4. Add environment variable `PORT` = `3001`
5. **Important**: Render free tier has **ephemeral disk** — the SQLite DB will reset to empty on every deploy. Use Render PostgreSQL add-on for real persistence, or accept data loss.

---

## Alternative: Fly.io (Free Tier)

1. Install [flyctl](https://fly.io/docs/flyctl/)
2. `fly launch` in the repo root — select Node.js
3. `fly secrets set PORT=3001`
4. For SQLite persistence, create a volume:
   ```bash
   fly volumes create erp_data --size 1
   ```
5. Add to `fly.toml`:
   ```toml
   [mounts]
   source = "erp_data"
   destination = "/data"
   ```
6. Update `database.js` to use `/data/erp.db`
7. `fly deploy`
