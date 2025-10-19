const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { corsOptions } = require("./config/cors");
const { DATA_DIR, ARCHIVES_DIR } = require("./config/constants");

// Import routes
const newsRoutes = require("./routes/news.routes");
const metadataRoutes = require("./routes/metadata.routes");
const archiveRoutes = require("./routes/archive.routes");
const adminRoutes = require("./routes/admin.routes");
const seoRoutes = require("./routes/seo.routes");

// Initialize Express app
const app = express();

// Middleware - CORS güvenliği
app.use(cors(corsOptions));
app.use(express.json());

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(ARCHIVES_DIR)) {
  fs.mkdirSync(ARCHIVES_DIR, { recursive: true });
}

// Mount routes
app.use("/api/news", newsRoutes);
app.use("/api", metadataRoutes);
app.use("/api/archive", archiveRoutes);
app.use("/api", adminRoutes);
app.use("/api", seoRoutes);

// Test cache behavior endpoint (for debugging)
app.get("/api/test-cache", (req, res) => {
  const cache = require("./config/cache");
  const { getTodayKey } = require("./utils/dateHelper");
  const { getTodayNews, getLastUpdate } = require("./services/rss/fetcher");
  const { isCacheValid } = require("./services/cache/manager");
  const { CACHE_CONFIG } = require("./config/constants");
  
  const todayKey = getTodayKey();
  const todayNews = getTodayNews();
  const lastUpdate = getLastUpdate();
  
  res.json({
    test_info: {
      current_time: new Date().toISOString(),
      today_key: todayKey,
      cache_behavior: {
        today_cache_exists: !!cache.todayNews.data,
        today_cache_key: cache.todayNews.key,
        today_cache_count: cache.todayNews.data ? cache.todayNews.data.length : 0,
        api_cache_count: cache.responses.size,
        api_stats: cache.apiStats,
      },
      memory_data: {
        todayNews_length: todayNews.length,
        lastUpdate: lastUpdate.toISOString(),
      }
    },
    cache_status: {
      today_news: {
        cached: !!cache.todayNews.data,
        key: cache.todayNews.key,
        expected_key: todayKey,
        key_match: cache.todayNews.key === todayKey,
        count: cache.todayNews.data ? cache.todayNews.data.length : 0,
        valid: isCacheValid(cache.todayNews, CACHE_CONFIG.TODAY_TTL),
        hits: cache.todayNews.hits || 0,
        misses: cache.todayNews.misses || 0,
      },
      api_responses: {
        count: cache.responses.size,
        hits: cache.apiStats.hits || 0,
        misses: cache.apiStats.misses || 0,
        hit_rate: cache.apiStats.hits && cache.apiStats.misses 
          ? (cache.apiStats.hits / (cache.apiStats.hits + cache.apiStats.misses) * 100).toFixed(2) + '%'
          : '0%',
      }
    }
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;

