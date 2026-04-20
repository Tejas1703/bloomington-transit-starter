const express = require('express');
const cors = require('cors');
const config = require('./config');
const gtfs = require('./services/gtfsStaticService');
const realtime = require('./services/realtimeService');

const staticApi = require('./routes/staticApi');
const realtimeApi = require('./routes/realtimeApi');
const nearestApi = require('./routes/nearestApi');

const app = express();
app.use(cors());
app.use(express.json());

// health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'bloom-transit-api' });
});

// mount routes
app.use('/api', staticApi);
app.use('/api', realtimeApi);
app.use('/api', nearestApi);

// startup sequence
async function boot() {
  try {
    await gtfs.loadGTFS();
    realtime.startPolling();

    app.listen(config.PORT, () => {
      console.log(`server running on port ${config.PORT}`);
    });
  } catch (err) {
    console.error('failed to start:', err);
    process.exit(1);
  }
}

boot();
