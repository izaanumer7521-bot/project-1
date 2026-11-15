import 'dotenv/config';
import dns from 'node:dns'; dns.setServers(['8.8.8.8', '1.1.1.1']); // needed on this network for MongoDB Atlas
import app from './app.js'; import connectDB from './config/db.js'; import seed from './utils/seed.js';
connectDB().then(seed).then(() => app.listen(process.env.PORT || 5000, () => console.log('ByDoor API running on port ' + (process.env.PORT || 5000))))
  .catch(e => { console.error('Startup failed:', e.message); process.exit(1); });
