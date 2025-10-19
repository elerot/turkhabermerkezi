const express = require("express");
const router = express.Router();
const { getNews } = require("../controllers/news.controller");

// Get news with filters
router.get("/", getNews);

module.exports = router;

