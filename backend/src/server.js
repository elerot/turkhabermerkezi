const app = require("./app");
const { PORT } = require("./config/constants");
const cache = require("./config/cache");

// Import services
const { loadRSSFeeds } = require("./services/rss/feeds");
const { fetchNews, getTodayNews, setTodayNews } = require("./services/rss/fetcher");
const { loadTodayNewsFromArchive } = require("./services/archive/loader");
const { warmupCache } = require("./services/cache/manager");
const { getTodayKey } = require("./utils/dateHelper");

// Import jobs
const { startRSSCron } = require("./jobs/rss.cron");
const { startCacheStatsCron, startDailyCacheCron } = require("./jobs/cache.cron");
const { startMemoryMonitoring } = require("./jobs/monitoring.cron");

// Initialize data loading
function initializeApp() {
  console.log("🚀 Backend başlatılıyor...");
  
  // Load today's news from archive files
  const todayNewsData = loadTodayNewsFromArchive();
  setTodayNews(todayNewsData);
  
  // 🚀 Initialize cache with loaded data
  const todayKey = getTodayKey();
  cache.todayNews = {
    data: [...todayNewsData],
    lastUpdate: Date.now(),
    key: todayKey,
    hits: 0,
    misses: 0,
  };
  console.log(`📦 Today's cache initialized: ${todayNewsData.length} news, key: ${todayKey}`);
  
  // Load RSS feeds on startup
  loadRSSFeeds();
  
  // 🔥 Cache warming - startup sonrası popüler dataları preload et
  setTimeout(() => {
    warmupCache();
  }, 1000); // 1 saniye sonra başlat (sistem stabilize olduktan sonra)
  
  // Initial fetch on startup
  setTimeout(() => {
    fetchNews();
  }, 5000);
}

// Start cron jobs
function startCronJobs() {
  startRSSCron();
  startCacheStatsCron();
  startDailyCacheCron();
  startMemoryMonitoring();
}

// Graceful shutdown
function setupGracefulShutdown() {
  process.on("SIGINT", () => {
    console.log("💾 Kapatılıyor...");
    
    // Cache statistics on shutdown
    console.log("📊 Final cache stats:", {
      today_news: cache.todayNews.data ? cache.todayNews.data.length : 0,
      today_cache_hits: cache.todayNews.hits,
      today_cache_misses: cache.todayNews.misses,
      api_responses: cache.responses.size,
      api_hits: cache.apiStats.hits,
      api_misses: cache.apiStats.misses,
      archives: cache.archives.size,
      metadata_cached: !!cache.metadata.sources,
    });
    
    console.log("✅ Tüm veriler zaten archive dosyalarına kaydedildi");
    console.log("👋 Güle güle!");

    process.exit(0);
  });
}

// Start server
function startServer() {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server ${PORT} portunda çalışıyor`);
    console.log("📡 RSS beslemeleri her 5 dakikada bir güncellenecek");
    console.log("🧠 Smart cache system aktif");
    console.log("⚡ Performance monitoring: /api/cache-status");
  });
}

// Bootstrap application
initializeApp();
startCronJobs();
setupGracefulShutdown();
startServer();

