const fs = require("fs");
const { RSS_FEEDS_FILE } = require("../../config/constants");

// RSS Feeds - Load from JSON file
let feeds = [];

// Load RSS feeds from JSON file
function loadRSSFeeds() {
  try {
    if (fs.existsSync(RSS_FEEDS_FILE)) {
      const data = fs.readFileSync(RSS_FEEDS_FILE, "utf8");
      const feedsData = JSON.parse(data);
      
      // Filter only active feeds
      feeds = feedsData
        .filter(feed => feed.aktif === true)
        .sort((a, b) => (a.priority || 999) - (b.priority || 999))
        .map(feed => ({
          url: feed.url,
          name: feed.kaynak,
          category: feed.kategori,
          priority: feed.priority || 999
        }));
      
      console.log(`✅ ${feeds.length} aktif RSS feed yüklendi`);
    } else {
      console.log("⚠️ RSS feeds dosyası bulunamadı, varsayılan feed'ler kullanılıyor");
      // Fallback feeds if file doesn't exist
      feeds = [
        { url: "https://www.trthaber.com/manset_articles.rss", name: "TRT Haber", category: "Manşet", priority: 1 },
        { url: "https://www.haberturk.com/rss/manset.xml", name: "Habertürk", category: "Manşet", priority: 1 }
      ];
    }
  } catch (error) {
    console.error("❌ RSS feeds yükleme hatası:", error);
    // Fallback feeds on error
    feeds = [
      { url: "https://www.trthaber.com/manset_articles.rss", name: "TRT Haber", category: "Manşet", priority: 1 },
      { url: "https://www.haberturk.com/rss/manset.xml", name: "Habertürk", category: "Manşet", priority: 1 }
    ];
  }
}

// Reload RSS feeds from file
function reloadRSSFeeds() {
  console.log("🔄 RSS feeds yeniden yükleniyor...");
  loadRSSFeeds();
  return feeds;
}

// Get current feeds
function getFeeds() {
  return feeds;
}

module.exports = {
  loadRSSFeeds,
  reloadRSSFeeds,
  getFeeds,
};

