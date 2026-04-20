const express = require('express');
const router = express.Router();
const realtime = require('../services/realtimeService');
const gtfs = require('../services/gtfsStaticService');

router.get('/nearest', (req, res) => {
  const userLat = parseFloat(req.query.lat);
  const userLng = parseFloat(req.query.lng);

  if (isNaN(userLat) || isNaN(userLng)) {
    return res.status(400).json({ error: 'need lat and lng query params' });
  }

  // Implementation removed for public release.
  // Finds the nearest bus and nearest stop to the user's coordinates
  // using haversine distance, then returns upcoming arrivals.
  res.json({
    nearestBus: null,
    nearestStop: null,
  });
});

module.exports = router;
