const fs = require("fs");
const path = require("path");
const { ARCHIVES_DIR } = require("../config/constants");
const { getTodayKey, getDateKey } = require("../utils/dateHelper");
const { getMetadataFromCache, getTodayNewsFromCache } = require("../services/cache/manager");
const { getFeeds } = require("../services/rss/feeds");

// Get available years
function getYears(req, res) {
  const metadata = getMetadataFromCache();
  res.json(metadata.years);
}

// Get available months for a year
function getMonths(req, res) {
  const year = req.params.year;
  
  try {
    const yearDir = path.join(ARCHIVES_DIR, year);
    let months = [];
    
    if (fs.existsSync(yearDir)) {
      months = fs.readdirSync(yearDir)
        .filter(dir => fs.statSync(path.join(yearDir, dir)).isDirectory())
        .sort()
        .reverse();
    }

    const monthsWithNames = months.map((month) => ({
      value: month,
      name: new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(
        "tr-TR",
        { month: "long" }
      ),
    }));

    res.json(monthsWithNames);
  } catch (error) {
    console.error("Error getting months:", error);
    res.status(500).json({ error: "Aylar yüklenirken hata oluştu" });
  }
}

// Get available days for a year/month
function getDays(req, res) {
  const { year, month } = req.params;
  const monthPadded = month.padStart(2, "0");
  
  try {
    const monthDir = path.join(ARCHIVES_DIR, year, monthPadded);
    let days = [];
    
    if (fs.existsSync(monthDir)) {
      days = fs.readdirSync(monthDir)
        .filter(file => file.endsWith('.json') && file !== 'summary.json')
        .map(file => {
          const dayPart = file.replace('.json', '');
          return parseInt(dayPart).toString();
        })
        .sort((a, b) => parseInt(b) - parseInt(a));
    }

    res.json(days);
  } catch (error) {
    console.error("Error getting days:", error);
    res.status(500).json({ error: "Günler yüklenirken hata oluştu" });
  }
}

// Get available sources
function getSources(req, res) {
  try {
    const feeds = getFeeds();
    const activeSources = feeds
      .map(feed => feed.name)
      .filter((source, index, arr) => arr.indexOf(source) === index)
      .sort();
    
    console.log("📡 Sources endpoint: Returning", activeSources.length, "active sources from RSS feeds");
    console.log("📡 Active sources:", activeSources.slice(0, 5));
    res.json(activeSources);
  } catch (error) {
    console.error("❌ Error in /api/sources:", error);
    res.status(500).json({ error: "Sources yüklenirken hata oluştu" });
  }
}

// Get available categories
function getCategories(req, res) {
  try {
    const categories = new Set();
    
    // Start with today's news
    const todayNews = getTodayNewsFromCache();
    todayNews.forEach(article => {
      if (article.category) {
        categories.add(article.category);
      }
    });
    
    // Add categories from recent archive files (last 30 days)
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = getDateKey(date);
      const [year, month, day] = dateKey.split("-");
      const archiveFile = path.join(
        ARCHIVES_DIR,
        year,
        month,
        `${day}.json`
      );
      
      if (fs.existsSync(archiveFile)) {
        try {
          const dayData = JSON.parse(fs.readFileSync(archiveFile, "utf8"));
          dayData.forEach(article => {
            if (article.category) {
              categories.add(article.category);
            }
          });
        } catch (error) {
          console.warn(`Error reading archive file: ${archiveFile}`, error);
        }
      }
    }
    
    const activeCategories = Array.from(categories).sort();
    
    console.log("📡 Categories endpoint: Returning", activeCategories.length, "categories from actual news data");
    console.log("📡 Active categories:", activeCategories.slice(0, 10));
    res.json(activeCategories);
  } catch (error) {
    console.error("❌ Error in /api/categories:", error);
    res.status(500).json({ error: "Categories yüklenirken hata oluştu" });
  }
}

// Get available dates
function getDates(req, res) {
  const metadata = getMetadataFromCache();
  res.json(metadata.dates);
}

// Get hours for a specific date
function getHours(req, res) {
  const date = req.params.date;
  
  try {
    const [year, month, day] = date.split("-");
    const archiveFile = path.join(ARCHIVES_DIR, year, month, `${day}.json`);
    
    let hours = [];
    if (fs.existsSync(archiveFile)) {
      const data = JSON.parse(fs.readFileSync(archiveFile, "utf8"));
      hours = [...new Set(data.map((article) => article.hour_key))]
        .sort()
        .reverse();
    }
    
    res.json(hours);
  } catch (error) {
    console.error("Error getting hours:", error);
    res.status(500).json({ error: "Saatler yüklenirken hata oluştu" });
  }
}

module.exports = {
  getYears,
  getMonths,
  getDays,
  getSources,
  getCategories,
  getDates,
  getHours,
};

