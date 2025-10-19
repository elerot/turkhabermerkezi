const express = require("express");
const router = express.Router();
const {
  getArchiveByDay,
  getArchiveByMonth,
  getArchiveByYear,
} = require("../controllers/archive.controller");

// Get archive by day
router.get("/:year/:month/:day", getArchiveByDay);

// Get archive by month
router.get("/:year/:month", getArchiveByMonth);

// Get archive by year
router.get("/:year", getArchiveByYear);

module.exports = router;

