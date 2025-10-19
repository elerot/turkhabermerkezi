const express = require("express");
const router = express.Router();
const {
  getYears,
  getMonths,
  getDays,
  getSources,
  getCategories,
  getDates,
  getHours,
} = require("../controllers/metadata.controller");

// Get available years
router.get("/years", getYears);

// Get available months for a year
router.get("/months/:year", getMonths);

// Get available days for a year/month
router.get("/days/:year/:month", getDays);

// Get available sources
router.get("/sources", getSources);

// Get available categories
router.get("/categories", getCategories);

// Get available dates
router.get("/dates", getDates);

// Get hours for a specific date
router.get("/hours/:date", getHours);

module.exports = router;

