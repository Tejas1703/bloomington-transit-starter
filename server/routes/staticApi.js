const express = require('express');
const router = express.Router();
const gtfs = require('../services/gtfsStaticService');

router.get('/routes', (req, res) => {
  res.json(gtfs.getRoutes());
});

router.get('/stops', (req, res) => {
  const { routeId } = req.query;
  res.json(gtfs.getStops(routeId));
});

router.get('/shapes/:routeId', (req, res) => {
  const points = gtfs.getShapeForRoute(req.params.routeId);
  res.json({ routeId: req.params.routeId, points });
});

router.get('/schedule/:routeId', (req, res) => {
  const route = gtfs.getRoutes().find(r => r.routeId === req.params.routeId);
  const trips = gtfs.getSchedule(req.params.routeId);
  res.json({
    routeId: req.params.routeId,
    routeName: route ? route.routeName : req.params.routeId,
    trips,
  });
});

module.exports = router;
