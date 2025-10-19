const express = require("express");
const router = express.Router();
const cors = require("cors");
const { seoCorsOptions } = require("../config/cors");
const { getRobotsTxt, getSitemapXml } = require("../controllers/seo.controller");

// Robots.txt - Herkese açık
router.get("/robots.txt", cors(seoCorsOptions), getRobotsTxt);

// Sitemap.xml - Herkese açık
router.get("/sitemap.xml", cors(seoCorsOptions), getSitemapXml);

module.exports = router;

