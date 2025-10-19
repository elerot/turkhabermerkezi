const express = require("express");
const router = express.Router();
const {
  manualFetch,
  reloadFeeds,
  getFeeds,
  getStats,
  getCacheStatus,
  clearCache,
} = require("../controllers/admin.controller");

// Manual fetch trigger
router.post("/fetch", manualFetch);

// Reload RSS feeds from file
router.post("/reload-feeds", reloadFeeds);

// Get current RSS feeds info
router.get("/feeds", getFeeds);

// Stats endpoint
router.get("/stats", getStats);

// Cache status endpoint
router.get("/cache-status", getCacheStatus);

// Clear cache endpoint
router.post("/clear-cache", clearCache);

module.exports = router;

