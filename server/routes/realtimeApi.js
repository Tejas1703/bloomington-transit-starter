const express = require('express');
const router = express.Router();
const realtime = require('../services/realtimeService');
const gtfs = require('../services/gtfsStaticService');

router.get('/vehicles', (req, res) => {
  const { vehicles, lastUpdated } = realtime.getVehicles();
  res.json({ vehicles, lastUpdated });
});

router.get('/arrivals/:stopId', (req, res) => {
  const stopId = req.params.stopId;
  const allStops = gtfs.getStops();
  const stopInfo = allStops.find(s => s.stopId === stopId);

  const arrivals = realtime.getArrivalsForStop(stopId, gtfs);

  res.json({
    stopId,
    stopName: stopInfo ? stopInfo.stopName : stopId,
    arrivals,
  });
});

router.get('/alerts', (req, res) => {
  res.json(realtime.getAlerts());
});

module.exports = router;
