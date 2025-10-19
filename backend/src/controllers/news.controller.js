const fs = require("fs");
const path = require("path");
const cache = require("../config/cache");
const { ARCHIVES_DIR } = require("../config/constants");
const { getTodayKey, getDateKey } = require("../utils/dateHelper");
const { getTodayNewsFromCache } = require("../services/cache/manager");
const { generateCacheKey } = require("../utils/hash");
const { createTurkishSlug } = require("../utils/slugify");

// Get news with smart caching from archive files - LRU OPTIMIZED + PARALLEL READING
async function getNews(req, res) {
  const startTime = Date.now();
  const cacheKey = generateCacheKey(req);

  // Check LRU cache first (otomatik TTL yönetimi)
  const cached = cache.responses.get(cacheKey);
  if (cached) {
    cache.apiStats.hits++;
    console.log(`📦 Cache HIT: API response [${Date.now() - startTime}ms] (hits: ${cache.apiStats.hits})`);
    return res.json(cached);
  }

  cache.apiStats.misses++;
  console.log(`🔄 Cache MISS: Generating API response [${cacheKey.substring(0, 50)}...] (misses: ${cache.apiStats.misses})`);

  const {
    page = 1,
    limit = 30,
    source,
    category,
    year,
    month,
    day,
    date,
    hour,
  } = req.query;
  const offset = (page - 1) * limit;

  // Load news from archive files based on filters
  let filteredNews = [];

  try {
    // If specific day is requested
    if (day && day !== "all" && month && month !== "all" && year && year !== "all") {
      const dayPadded = day.padStart(2, "0");
      const monthPadded = month.padStart(2, "0");
      const dateKey = `${year}-${monthPadded}-${dayPadded}`;
      
      // If it's today's date, use cache
      if (dateKey === getTodayKey()) {
        filteredNews = [...getTodayNewsFromCache()];
      } else {
        // For other dates, load from archive file
        const archiveFile = path.join(ARCHIVES_DIR, year, monthPadded, `${dayPadded}.json`);
        
        if (fs.existsSync(archiveFile)) {
          const data = fs.readFileSync(archiveFile, "utf8");
          filteredNews = JSON.parse(data);
        }
      }
    }
    // If specific month is requested - PARALLEL FILE READING
    else if (month && month !== "all" && year && year !== "all") {
      const monthPadded = month.padStart(2, "0");
      const monthDir = path.join(ARCHIVES_DIR, year, monthPadded);
      
      if (fs.existsSync(monthDir)) {
        const dayFiles = fs.readdirSync(monthDir)
          .filter(file => file.endsWith('.json') && file !== 'summary.json')
          .sort()
          .reverse(); // Newest first
        
        // Parallel okuma için promises dizisi oluştur
        const fileReadPromises = dayFiles.map(async (dayFile) => {
          const day = dayFile.replace('.json', '');
          const dateKey = `${year}-${monthPadded}-${day.padStart(2, "0")}`;
          
          // If it's today's date, use cache
          if (dateKey === getTodayKey()) {
            return getTodayNewsFromCache();
          } else {
            // For other dates, load from archive file (async)
            const filePath = path.join(monthDir, dayFile);
            const data = await fs.promises.readFile(filePath, "utf8");
            return JSON.parse(data);
          }
        });
        
        // Tüm dosyaları paralel oku
        const results = await Promise.all(fileReadPromises);
        filteredNews = results.flat();
      }
    }
    // If specific year is requested - PARALLEL FILE READING
    else if (year && year !== "all") {
      const yearDir = path.join(ARCHIVES_DIR, year);
      
      if (fs.existsSync(yearDir)) {
        const months = fs.readdirSync(yearDir)
          .filter(dir => fs.statSync(path.join(yearDir, dir)).isDirectory())
          .sort()
          .reverse(); // Newest first
        
        // Tüm ay ve günler için parallel okuma
        const allFilePromises = [];
        
        for (const monthDir of months) {
          const monthPath = path.join(yearDir, monthDir);
          const dayFiles = fs.readdirSync(monthPath)
            .filter(file => file.endsWith('.json') && file !== 'summary.json')
            .sort()
            .reverse();
          
          dayFiles.forEach(dayFile => {
            const day = dayFile.replace('.json', '');
            const dateKey = `${year}-${monthDir}-${day.padStart(2, "0")}`;
            
            const readPromise = (async () => {
              // If it's today's date, use cache
              if (dateKey === getTodayKey()) {
                return getTodayNewsFromCache();
              } else {
                // For other dates, load from archive file (async)
                const filePath = path.join(monthPath, dayFile);
                const data = await fs.promises.readFile(filePath, "utf8");
                return JSON.parse(data);
              }
            })();
            
            allFilePromises.push(readPromise);
          });
        }
        
        // Tüm dosyaları paralel oku
        const results = await Promise.all(allFilePromises);
        filteredNews = results.flat();
      }
    }
    // If no specific date filters, use today's news + recent days (last 30 days) - PARALLEL
    else {
      // Start with today's news from cache
      filteredNews = [...getTodayNewsFromCache()];
      
      // Add recent days (last 30 days) - parallel okuma
      const today = new Date();
      const recentDaysPromises = [];
      
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
          const readPromise = fs.promises.readFile(archiveFile, "utf8")
            .then(data => JSON.parse(data))
            .catch(err => {
              console.warn(`Error reading ${archiveFile}:`, err.message);
              return [];
            });
          recentDaysPromises.push(readPromise);
        }
      }
      
      // Tüm dosyaları paralel oku
      const recentDaysData = await Promise.all(recentDaysPromises);
      recentDaysData.forEach(dayData => {
        filteredNews.push(...dayData);
      });
    }

    // Legacy date support
    if (date && date !== "all") {
      filteredNews = filteredNews.filter((article) => article.date_key === date);
    }

    // Source filtering
    if (source && source !== "all") {
      filteredNews = filteredNews.filter((article) => {
        // Tam eşleşme kontrolü
        if (article.source === source) return true;
        
        // Slug eşleşmesi kontrolü
        const articleSlug = createTurkishSlug(article.source);
        const searchSlug = createTurkishSlug(source);
        return articleSlug === searchSlug;
      });
    }

    // Category filtering
    if (category && category !== "all") {
      filteredNews = filteredNews.filter((article) => {
        // Tam eşleşme kontrolü
        if (article.category === category) return true;
        
        // Slug eşleşmesi kontrolü
        const articleSlug = createTurkishSlug(article.category);
        const searchSlug = createTurkishSlug(category);
        return articleSlug === searchSlug;
      });
    }

    // Hour filtering
    if (hour && hour !== "all") {
      filteredNews = filteredNews.filter((article) => article.hour_key === hour);
    }

    // Text search functionality
    const { search, q } = req.query;
    const searchQuery = search || q;
    
    if (searchQuery && searchQuery.trim() !== "") {
      const searchTerm = searchQuery.trim().toLowerCase();
      filteredNews = filteredNews.filter((article) => {
        const titleMatch = article.title && article.title.toLowerCase().includes(searchTerm);
        const descriptionMatch = article.description && article.description.toLowerCase().includes(searchTerm);
        const sourceMatch = article.source && article.source.toLowerCase().includes(searchTerm);
        
        return titleMatch || descriptionMatch || sourceMatch;
      });
    }

    // Sort by created_at (newest first)
    filteredNews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const totalCount = filteredNews.length;
    const paginatedNews = filteredNews.slice(offset, offset + parseInt(limit));

    const response = {
      news: paginatedNews,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(totalCount / limit),
        count: totalCount,
      },
    };

    // Cache the response (LRU otomatik TTL yönetimi yapar)
    cache.responses.set(cacheKey, response);

    console.log(
      `✅ API response generated and cached [${Date.now() - startTime}ms]`
    );
    res.json(response);
  } catch (error) {
    console.error("❌ Error in /api/news:", error);
    res.status(500).json({ error: "Haberler yüklenirken hata oluştu" });
  }
}

module.exports = {
  getNews,
};

