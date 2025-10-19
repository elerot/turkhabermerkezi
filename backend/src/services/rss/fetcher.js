const { getFeeds } = require("./feeds");
const { parseFeed } = require("./parser");
const { saveArticleToArchive } = require("../archive/storage");
const { getTodayKey } = require("../../utils/dateHelper");
const cache = require("../../config/cache");

// In-memory data storage - only for today's news
let todayNews = [];
let lastUpdate = new Date();

// Get today's news array
function getTodayNews() {
  return todayNews;
}

// Set today's news array
function setTodayNews(news) {
  todayNews = news;
}

// Get last update time
function getLastUpdate() {
  return lastUpdate;
}

// 🔄 ENHANCED FETCH WITH ARCHIVE STORAGE
async function fetchNews() {
  try {
    console.log("📡 RSS haberleri çekiliyor...");
    
    // Check if day has changed and clear today's news if needed
    const currentTodayKey = getTodayKey();
    if (cache.todayNews.key && cache.todayNews.key !== currentTodayKey) {
      console.log(`📅 Gün değişti! Önceki gün: ${cache.todayNews.key}, Yeni gün: ${currentTodayKey}`);
      console.log("🧹 Bugünün haberleri temizleniyor...");
      
      // Clear today's news array and cache
      todayNews.length = 0;
      cache.todayNews = {
        data: null,
        lastUpdate: null,
        key: null,
        hits: 0,
        misses: 0,
      };
      
      // Clear API responses cache since they might contain old data
      cache.responses.clear();
      cache.apiStats = { hits: 0, misses: 0 };
      
      console.log("✅ Bugünün haberleri temizlendi");
    }
    
    let totalNew = 0;
    let todayNew = 0;
    const feeds = getFeeds();

    for (const feed of feeds) {
      const articles = await parseFeed(feed);

      for (const article of articles) {
        // Save article to archive file
        const wasAdded = saveArticleToArchive(article);
        if (wasAdded) {
          totalNew++;
          
          // If it's today's news, add to todayNews array
          if (article.date_key === getTodayKey()) {
            todayNews.push(article);
            todayNew++;
          }
        }
      }
    }

    if (totalNew > 0) {
      // Sort today's news by created_at (newest first)
      todayNews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // 🚀 UPDATE TODAY'S CACHE WITH NEW DATA
      const todayKey = getTodayKey();
      cache.todayNews = {
        data: [...todayNews], // Copy of today's news
        lastUpdate: Date.now(),
        key: todayKey,
        hits: cache.todayNews.hits || 0,
        misses: cache.todayNews.misses || 0,
      };

      // 🚀 INVALIDATE OTHER CACHES WHEN NEW NEWS ARRIVE
      const { invalidateCache } = require("../cache/manager");
      invalidateCache();

      lastUpdate = new Date();
      console.log(
        `✅ RSS tamamlandı. Yeni haber: ${totalNew} (bugün: ${todayNew}) - Today's cache updated`
      );
    } else {
      console.log(`✅ RSS tamamlandı. Yeni haber: ${totalNew} - Cache preserved`);
    }
  } catch (error) {
    console.error("❌ RSS fetch hatası:", error);
    console.error("Stack:", error.stack);
    // Don't throw, just log the error
  }
}

module.exports = {
  fetchNews,
  getTodayNews,
  setTodayNews,
  getLastUpdate,
};

