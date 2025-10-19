const path = require("path");

// Data storage paths
const DATA_DIR = "./data";
const ARCHIVES_DIR = path.join(DATA_DIR, "archives");
const RSS_FEEDS_FILE = path.join(DATA_DIR, "rss-feeds.json");

// Cache configuration
const CACHE_CONFIG = {
  TODAY_TTL: 5 * 60 * 1000, // 5 minutes for today's news
  METADATA_TTL: 10 * 60 * 1000, // 10 minutes for metadata
  API_TTL: 2 * 60 * 1000, // 2 minutes for API responses (LRU içinde)
  ARCHIVE_TTL: 30 * 60 * 1000, // 30 minutes for archives (LRU içinde)
};

// LRU Cache configuration
const LRU_CONFIG = {
  API_RESPONSES: {
    max: 500, // Maksimum 500 farklı API sorgusu
    ttl: 1000 * 60 * 2, // 2 dakika TTL
    updateAgeOnGet: true,
    allowStale: false,
  },
  ARCHIVES: {
    max: 1000, // Maksimum 1000 farklı archive sorgusu
    ttl: 1000 * 60 * 30, // 30 dakika TTL
    maxSize: 100 * 1024 * 1024, // 100MB maksimum boyut
    updateAgeOnGet: true,
    allowStale: false,
  },
};

// Server configuration
const PORT = process.env.PORT || 3001;

// Domain configuration
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001', 
  'https://www.saatdakika.com',
  'https://saatdakika.com'
];

module.exports = {
  DATA_DIR,
  ARCHIVES_DIR,
  RSS_FEEDS_FILE,
  CACHE_CONFIG,
  LRU_CONFIG,
  PORT,
  ALLOWED_ORIGINS,
};

