const cron = require("node-cron");
const cache = require("../config/cache");
const { getTodayKey, getDateKey } = require("../utils/dateHelper");
const { warmupCache } = require("../services/cache/manager");

// Cache statistics logging every 30 minutes
function startCacheStatsCron() {
  cron.schedule("*/30 * * * *", () => {
    console.log("📊 Cache istatistikleri:");
    console.log(`  - API Responses: ${cache.responses.size} entry`);
    console.log(`  - Archives: ${cache.archives.size} entry`);
    console.log(`  - API Hit Rate: ${cache.apiStats.hits}/${cache.apiStats.hits + cache.apiStats.misses} (${((cache.apiStats.hits / (cache.apiStats.hits + cache.apiStats.misses || 1)) * 100).toFixed(1)}%)`);
    console.log(`  - Today News Hit Rate: ${cache.todayNews.hits}/${cache.todayNews.hits + cache.todayNews.misses} (${((cache.todayNews.hits / (cache.todayNews.hits + cache.todayNews.misses || 1)) * 100).toFixed(1)}%)`);
  });
}

// Daily cache cleanup at midnight (00:00)
function startDailyCacheCron() {
  cron.schedule("0 0 * * *", () => {
    console.log("🌅 Günlük cache temizleme başladı...");
    
    const todayKey = getTodayKey();
    const previousDay = new Date();
    previousDay.setDate(previousDay.getDate() - 1);
    const previousDayKey = getDateKey(previousDay);
    
    // Get today's news array
    const { getTodayNews } = require("../services/rss/fetcher");
    const todayNews = getTodayNews();
    
    // Clear today's news array and cache
    todayNews.length = 0;
    cache.todayNews = {
      data: null,
      lastUpdate: null,
      key: null,
      hits: 0,
      misses: 0,
    };
    
    // LRU cache'leri clear et (yeni gün için fresh start)
    cache.responses.clear();
    cache.archives.clear();
    cache.apiStats = { hits: 0, misses: 0 };
    
    // Clear metadata cache
    cache.metadata = {
      sources: null,
      years: null,
      dates: null,
      lastUpdate: null,
    };
    
    console.log(`✅ Günlük cache temizleme tamamlandı. Yeni gün: ${todayKey}, Önceki gün: ${previousDayKey}`);
    console.log(`📊 Cache durumu: todayNews=${todayNews.length}, API responses=${cache.responses.size}, Archives=${cache.archives.size}`);
    
    // Yeni gün için cache warming yap
    setTimeout(() => {
      warmupCache();
    }, 5000); // 5 saniye sonra
  });
}

module.exports = {
  startCacheStatsCron,
  startDailyCacheCron,
};

