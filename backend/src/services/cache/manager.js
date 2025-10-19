const fs = require("fs");
const path = require("path");
const cache = require("../../config/cache");
const { CACHE_CONFIG, ARCHIVES_DIR } = require("../../config/constants");
const { getTodayKey, getDateKey } = require("../../utils/dateHelper");
const { getFeeds } = require("../rss/feeds");

// Check if cache is valid
function isCacheValid(cacheEntry, ttl) {
  if (!cacheEntry || !cacheEntry.lastUpdate) return false;
  return Date.now() - cacheEntry.lastUpdate < ttl;
}

// Get today's news from cache or generate
function getTodayNewsFromCache() {
  const todayKey = getTodayKey();

  // Check if day has changed and clear cache if needed
  if (cache.todayNews.key && cache.todayNews.key !== todayKey) {
    console.log(`📅 Gün değişti! Cache temizleniyor. Önceki: ${cache.todayNews.key}, Yeni: ${todayKey}`);
    cache.todayNews = {
      data: null,
      lastUpdate: null,
      key: null,
      hits: 0,
      misses: 0,
    };
  }

  // Check if today's cache is valid
  if (
    cache.todayNews.data &&
    cache.todayNews.key === todayKey &&
    isCacheValid(cache.todayNews, CACHE_CONFIG.TODAY_TTL)
  ) {
    cache.todayNews.hits++;
    console.log(`📦 Cache HIT: Today news from cache (hits: ${cache.todayNews.hits})`);
    return cache.todayNews.data;
  }

  // Generate today's news from memory or archive file
  cache.todayNews.misses++;
  console.log(`🔄 Cache MISS: Generating today news cache (misses: ${cache.todayNews.misses})`);
  
  const { getTodayNews } = require("../rss/fetcher");
  let todayNewsData = getTodayNews();

  // If no in-memory data, try to load from archive file
  if (todayNewsData.length === 0) {
    const [year, month, day] = todayKey.split("-");
    const todayArchiveFile = path.join(
      ARCHIVES_DIR,
      year,
      month,
      `${day}.json`
    );

    if (fs.existsSync(todayArchiveFile)) {
      try {
        const data = fs.readFileSync(todayArchiveFile, "utf8");
        todayNewsData = JSON.parse(data);
        console.log(`📁 Loaded ${todayNewsData.length} news from archive file`);
      } catch (error) {
        console.error("Error loading today's news from archive:", error);
        todayNewsData = [];
      }
    }
  }

  // Update cache with fresh data
  cache.todayNews = {
    data: [...todayNewsData], // Copy the data
    lastUpdate: Date.now(),
    key: todayKey,
    hits: cache.todayNews.hits || 0,
    misses: cache.todayNews.misses || 0,
  };

  console.log(`📦 Today's cache updated: ${todayNewsData.length} news, key: ${todayKey}`);
  return todayNewsData;
}

// Get metadata from cache or generate from summary files
function getMetadataFromCache() {
  if (isCacheValid(cache.metadata, CACHE_CONFIG.METADATA_TTL)) {
    console.log("📦 Cache HIT: Metadata from cache");
    return cache.metadata;
  }

  console.log("🔄 Cache MISS: Generating metadata cache from summary files");

  try {
    // Get sources from RSS feeds
    const feeds = getFeeds();
    const sources = feeds.map(feed => feed.name).sort();

    // Get years from archive directories
    const years = [];
    if (fs.existsSync(ARCHIVES_DIR)) {
      const yearDirs = fs.readdirSync(ARCHIVES_DIR)
        .filter(dir => fs.statSync(path.join(ARCHIVES_DIR, dir)).isDirectory())
        .sort()
        .reverse();
      years.push(...yearDirs);
    }

    // Get dates from summary files
    const dates = [];
    years.forEach(year => {
      const yearDir = path.join(ARCHIVES_DIR, year);
      if (fs.existsSync(yearDir)) {
        const monthDirs = fs.readdirSync(yearDir)
          .filter(dir => fs.statSync(path.join(yearDir, dir)).isDirectory())
          .sort()
          .reverse();
        
        monthDirs.forEach(month => {
          const monthDir = path.join(yearDir, month);
          const summaryFile = path.join(monthDir, "summary.json");
          if (fs.existsSync(summaryFile)) {
            try {
              const summary = JSON.parse(fs.readFileSync(summaryFile, "utf8"));
              if (summary.days) {
                dates.push(...summary.days);
              }
            } catch (error) {
              console.warn(`Error reading summary file: ${summaryFile}`, error);
            }
          }
        });
      }
    });

    // Update cache
    cache.metadata = {
      sources,
      years,
      dates: dates.sort().reverse(),
      lastUpdate: Date.now(),
    };

    return cache.metadata;
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      sources: [],
      years: [],
      dates: [],
      lastUpdate: Date.now(),
    };
  }
}

// Clear relevant caches when new news arrive
function invalidateCache() {
  console.log("🧹 Cache invalidation triggered");

  // Clear API responses cache (LRU clear method)
  cache.responses.clear();
  console.log("  ✓ API responses cache cleared");

  // Clear metadata cache
  cache.metadata = {
    sources: null,
    years: null,
    dates: null,
    lastUpdate: null,
  };
  console.log("  ✓ Metadata cache cleared");

  console.log("✅ Cache invalidated successfully (today's cache preserved, archives kept with TTL)");
}

// 🔥 CACHE WARMING - Startup'ta popüler dataları preload et
async function warmupCache() {
  console.log('🔥 Cache warming başladı...');
  const startTime = Date.now();
  
  try {
    // 1. Bugünün haberlerini cache'le
    getTodayNewsFromCache();
    console.log('  ✓ Bugünün haberleri cache\'lendi');
    
    // 2. Son 7 günün haberlerini parallel olarak preload et
    const today = new Date();
    const recentDaysPromises = [];
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = getDateKey(date);
      const [year, month, day] = dateKey.split("-");
      const archiveFile = path.join(ARCHIVES_DIR, year, month, `${day}.json`);
      
      if (fs.existsSync(archiveFile)) {
        const cacheKey = `archive_${year}_${month}_${day}`;
        const readPromise = fs.promises.readFile(archiveFile, "utf8")
          .then(data => {
            const parsedData = JSON.parse(data);
            cache.archives.set(cacheKey, parsedData);
            return parsedData.length;
          })
          .catch(err => {
            console.warn(`  ⚠️ ${archiveFile} okunamadı:`, err.message);
            return 0;
          });
        recentDaysPromises.push(readPromise);
      }
    }
    
    const results = await Promise.all(recentDaysPromises);
    const totalNewsPreloaded = results.reduce((sum, count) => sum + count, 0);
    console.log(`  ✓ Son 7 gün cache'lendi (${totalNewsPreloaded} haber)`);
    
    // 3. Metadata cache'i initialize et
    getMetadataFromCache();
    console.log('  ✓ Metadata cache\'lendi');
    
    const duration = Date.now() - startTime;
    console.log(`✅ Cache warming tamamlandı (${duration}ms)`);
    console.log(`📊 Cache durumu: Archives=${cache.archives.size}, API Responses=${cache.responses.size}`);
  } catch (error) {
    console.error('❌ Cache warming hatası:', error);
  }
}

module.exports = {
  isCacheValid,
  getTodayNewsFromCache,
  getMetadataFromCache,
  invalidateCache,
  warmupCache,
};

