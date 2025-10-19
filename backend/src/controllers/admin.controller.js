const fs = require("fs");
const path = require("path");
const cache = require("../config/cache");
const { CACHE_CONFIG, ARCHIVES_DIR } = require("../config/constants");
const { getTodayKey } = require("../utils/dateHelper");
const { isCacheValid } = require("../services/cache/manager");
const { fetchNews, getTodayNews, getLastUpdate } = require("../services/rss/fetcher");
const { reloadRSSFeeds, getFeeds } = require("../services/rss/feeds");
const { invalidateCache } = require("../services/cache/manager");

// Manual fetch trigger
async function manualFetch(req, res) {
  try {
    await fetchNews();
    const todayNews = getTodayNews();
    const lastUpdate = getLastUpdate();
    
    res.json({
      message: "Haberler başarıyla güncellendi",
      total: todayNews.length,
      lastUpdate: lastUpdate.toISOString(),
      cacheStatus: {
        todayCache: cache.todayNews.key,
        apiResponsesCount: cache.responses.size,
        archivesCount: cache.archives.size,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Reload RSS feeds from file
function reloadFeeds(req, res) {
  try {
    const updatedFeeds = reloadRSSFeeds();
    
    // Invalidate cache since sources might have changed
    invalidateCache();
    
    res.json({
      message: "RSS feeds başarıyla yeniden yüklendi",
      total_feeds: updatedFeeds.length,
      feeds: updatedFeeds.map(feed => ({
        name: feed.name,
        category: feed.category,
        priority: feed.priority
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get current RSS feeds info
function getFeeds_endpoint(req, res) {
  try {
    const feeds = getFeeds();
    res.json({
      total_feeds: feeds.length,
      feeds: feeds.map(feed => ({
        name: feed.name,
        category: feed.category,
        priority: feed.priority,
        url: feed.url
      })),
      last_reload: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Stats endpoint with cache info
function getStats(req, res) {
  const { getMetadataFromCache } = require("../services/cache/manager");
  const metadata = getMetadataFromCache();
  const todayNews = getTodayNews();
  const lastUpdate = getLastUpdate();

  // Calculate total news from summary files
  let totalNews = 0;
  let firstNews = null;
  let latestNews = null;

  try {
    if (fs.existsSync(ARCHIVES_DIR)) {
      const yearDirs = fs.readdirSync(ARCHIVES_DIR)
        .filter(dir => fs.statSync(path.join(ARCHIVES_DIR, dir)).isDirectory());

      yearDirs.forEach(year => {
        const yearDir = path.join(ARCHIVES_DIR, year);
        const monthDirs = fs.readdirSync(yearDir)
          .filter(dir => fs.statSync(path.join(yearDir, dir)).isDirectory());

        monthDirs.forEach(month => {
          const monthDir = path.join(yearDir, month);
          const summaryFile = path.join(monthDir, "summary.json");
          if (fs.existsSync(summaryFile)) {
            try {
              const summary = JSON.parse(fs.readFileSync(summaryFile, "utf8"));
              totalNews += summary.totalNews || 0;
            } catch (error) {
              console.warn(`Error reading summary file: ${summaryFile}`, error);
            }
          }
        });
      });
    }
  } catch (error) {
    console.error("Error calculating total news:", error);
  }

  res.json({
    total_news: totalNews,
    total_sources: metadata.sources?.length || 0,
    total_days: metadata.dates?.length || 0,
    first_news: firstNews,
    latest_news: latestNews,
    last_update: lastUpdate.toISOString(),
    cache_stats: {
      today_news_cached: cache.todayNews.data ? cache.todayNews.data.length : 0,
      today_cache_key: cache.todayNews.key,
      api_responses_cached: cache.responses.size,
      archives_cached: cache.archives.size,
      metadata_cached: !!cache.metadata.sources,
    },
  });
}

// Cache status endpoint
function getCacheStatus(req, res) {
  const now = Date.now();
  const todayKey = getTodayKey();
  const uptime = process.uptime();
  const memory = process.memoryUsage();

  // Helper function to format time
  const formatTime = (ms) => {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  // Helper function to format bytes
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate cache efficiency
  const todayTotal = (cache.todayNews.hits || 0) + (cache.todayNews.misses || 0);
  const apiTotal = (cache.apiStats.hits || 0) + (cache.apiStats.misses || 0);
  
  const todayHitRate = todayTotal > 0 ? ((cache.todayNews.hits || 0) / todayTotal * 100).toFixed(1) : 0;
  const apiHitRate = apiTotal > 0 ? ((cache.apiStats.hits || 0) / apiTotal * 100).toFixed(1) : 0;

  // Calculate system health score (0-100)
  const healthScore = (() => {
    let score = 100;
    
    if (!isCacheValid(cache.todayNews, CACHE_CONFIG.TODAY_TTL)) score -= 20;
    if (!isCacheValid(cache.metadata, CACHE_CONFIG.METADATA_TTL)) score -= 10;
    
    if (todayHitRate < 50) score -= 15;
    if (apiHitRate < 30) score -= 10;
    
    const memoryUsagePercent = (memory.heapUsed / memory.heapTotal) * 100;
    if (memoryUsagePercent > 80) score -= 20;
    else if (memoryUsagePercent > 60) score -= 10;
    
    return Math.max(0, score);
  })();

  const healthStatus = healthScore >= 80 ? '🟢 Excellent' : 
                      healthScore >= 60 ? '🟡 Good' : 
                      healthScore >= 40 ? '🟠 Fair' : '🔴 Poor';

  res.json({
    system: {
      status: healthStatus,
      health_score: healthScore,
      uptime: {
        seconds: Math.floor(uptime),
        formatted: formatTime(uptime * 1000),
        started_at: new Date(Date.now() - uptime * 1000).toISOString()
      },
      memory: {
        used: formatBytes(memory.heapUsed),
        total: formatBytes(memory.heapTotal),
        usage_percent: ((memory.heapUsed / memory.heapTotal) * 100).toFixed(1) + '%',
        external: formatBytes(memory.external),
        rss: formatBytes(memory.rss)
      }
    },
    cache_performance: {
      overall_efficiency: {
        today_news_hit_rate: todayHitRate + '%',
        api_responses_hit_rate: apiHitRate + '%',
        total_cache_requests: todayTotal + apiTotal,
        total_hits: (cache.todayNews.hits || 0) + (cache.apiStats.hits || 0),
        total_misses: (cache.todayNews.misses || 0) + (cache.apiStats.misses || 0)
      },
      today_news: {
        status: cache.todayNews.data ? '✅ Active' : '❌ Empty',
        key_match: cache.todayNews.key === todayKey ? '✅ Match' : '❌ Mismatch',
        article_count: cache.todayNews.data ? cache.todayNews.data.length : 0,
        age: cache.todayNews.lastUpdate ? formatTime(now - cache.todayNews.lastUpdate) : 'N/A',
        valid: isCacheValid(cache.todayNews, CACHE_CONFIG.TODAY_TTL) ? '✅ Valid' : '❌ Expired',
        ttl: formatTime(CACHE_CONFIG.TODAY_TTL),
        hits: cache.todayNews.hits || 0,
        misses: cache.todayNews.misses || 0,
        hit_rate: todayHitRate + '%',
        last_updated: cache.todayNews.lastUpdate ? new Date(cache.todayNews.lastUpdate).toISOString() : 'Never'
      },
      api_responses: {
        cached_count: cache.responses.size,
        sample_keys: Array.from(cache.responses.keys()).slice(0, 3),
        hits: cache.apiStats.hits || 0,
        misses: cache.apiStats.misses || 0,
        hit_rate: apiHitRate + '%'
      },
      archives: {
        cached_count: cache.archives.size,
        sample_keys: Array.from(cache.archives.keys()).slice(0, 3)
      },
      metadata: {
        status: cache.metadata.sources ? '✅ Cached' : '❌ Not cached',
        age: cache.metadata.lastUpdate ? formatTime(now - cache.metadata.lastUpdate) : 'N/A',
        valid: isCacheValid(cache.metadata, CACHE_CONFIG.METADATA_TTL) ? '✅ Valid' : '❌ Expired',
        sources_count: cache.metadata.sources ? cache.metadata.sources.length : 0
      }
    }
  });
}

// Clear cache endpoint
function clearCache(req, res) {
  const { type } = req.body;
  const { getTodayNews, setTodayNews } = require("../services/rss/fetcher");

  try {
    switch (type) {
      case "all":
        invalidateCache();
        break;
      case "today":
        cache.todayNews = { data: null, lastUpdate: null, key: null, hits: 0, misses: 0 };
        const todayNews = getTodayNews();
        todayNews.length = 0;
        break;
      case "api":
        cache.responses.clear();
        cache.apiStats = { hits: 0, misses: 0 };
        break;
      case "archives":
        cache.archives.clear();
        break;
      case "metadata":
        cache.metadata = {
          sources: null,
          years: null,
          dates: null,
          lastUpdate: null,
        };
        break;
      case "daily":
        const todayNews2 = getTodayNews();
        todayNews2.length = 0;
        cache.todayNews = { data: null, lastUpdate: null, key: null, hits: 0, misses: 0 };
        cache.responses.clear();
        cache.apiStats = { hits: 0, misses: 0 };
        break;
      default:
        return res.status(400).json({ error: "Invalid cache type" });
    }

    res.json({ message: `Cache ${type} cleared successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  manualFetch,
  reloadFeeds,
  getFeeds: getFeeds_endpoint,
  getStats,
  getCacheStatus,
  clearCache,
};

