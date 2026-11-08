# ByDoor EXPRESS – MERN delivery website

## Requirements
- Node.js 18+ (https://nodejs.org)
- MongoDB: either MongoDB Community running locally, OR a free MongoDB Atlas link
  (put the Atlas link in `backend/.env` as MONGO_URI)

## Run in VS Code
1. File > Open Folder > select the `bydoor` folder.
2. Open the terminal (Ctrl + `) and run:
       npm run setup      (installs root, server and client packages – once)
       npm run dev        (starts API on :5000 and website on :5173)
3. Open http://localhost:5173

## Admin panel (hidden)
- Open http://localhost:5173/bd-admin
- Default login (from backend/.env): admin@bydoor.com / ChangeMe@123
- Change email and password in Admin > Account, and change JWT_SECRET in backend/.env before going live.
- If you change ADMIN_EMAIL/ADMIN_PASSWORD in .env later, it only applies to a fresh database; use the Account tab instead.

## Folders
- backend/  Express + MongoDB API (server.js, models, routes, middleware)
- frontend/  React + Vite website (src/pages/Home.jsx public page, src/pages/Admin.jsx admin panel, src/assets/styles.css theme)

## Deploy on Vercel (one project: website + API)
1. Create a free MongoDB Atlas cluster. Database Access: add a user. Network Access: allow 0.0.0.0/0.
   Copy the connection string, e.g. mongodb+srv://USER:PASS@cluster.mongodb.net/bydoor
2. Push this folder to GitHub, then Vercel > Add New > Project > import the repo.
   Leave Root Directory as the repo root. Framework Preset: Other (vercel.json sets everything).
3. Project > Settings > Environment Variables, add:
     MONGO_URI        your Atlas connection string
     JWT_SECRET       a long random string (32+ characters)
     ADMIN_EMAIL      your admin email
     ADMIN_PASSWORD   a strong password (first login only; change later in Admin > Account)
4. Deploy. Public site: your-app.vercel.app   Admin: your-app.vercel.app/bd-admin
Do not set PORT. The frontend calls /api on the same domain, so no other variables are needed.
