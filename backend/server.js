import 'dotenv/config';
import app from './app.js'; import connectDB from './config/db.js'; import seed from './utils/seed.js';
connectDB().then(seed).then(() => app.listen(process.env.PORT || 5000, () => console.log('ByDoor API running on port ' + (process.env.PORT || 5000))))
  .catch(e => { console.error('Startup failed:', e.message); process.exit(1); });
