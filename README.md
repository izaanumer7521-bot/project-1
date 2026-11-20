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

## Rider on orders, search page, shop timing
- **Rider info:** in Admin > Orders every order has a "Rider" box (name + phone). The customer sees only that name and phone number on the order receipt, in My Orders and in Notifications (tap to call). Set a *Default rider* in Admin > Settings and every new order gets it automatically; change it on any order when needed. Vendors see the rider on their orders too.
- **Search page:** tapping the home search bar opens a full Search page (category chips, recent + popular searches, store count, sort, filter, favourite stores). Edit the popular words in `POPULAR` in `frontend/src/pages/Home.jsx`.
- **Shop timing:** Admin > Vendors (add / edit) and the vendor's own Orders page have "Opens at / Closes at" (any time, e.g. 9 AM to 10 PM; 6 PM to 12:30 AM also works). Times are Pakistan time. Outside the timing the store shows CLOSED and the server refuses orders, on top of the manual Open/Close switch. "No timing" = open whenever the switch is on.

## Bike / rickshaw booking
- The existing **Rickshaw Pick & Drop** category now opens a booking page (Bike or Rickshaw, pick-up place, destination, optional note, "use my current location" / "from my house"). To use another category for this, tick **Ride booking** on it in Admin > Categories.
- No price is shown: the rider calls the customer and agrees the fare. Admin writes the agreed fare on the ride (Admin > Rides).
- **One ride at a time per vehicle:** while a ride is Requested / Accepted / On the way, that vehicle shows "Busy" and nobody else can book it (the database enforces this too). It becomes free when you press **Ride complete** (or Cancel) in Admin > Rides. The customer can also cancel before the ride starts.
- Admin phones get a push alert for every new ride request.
