const express = require("express");
const cors = require("cors");
const Parser = require("rss-parser");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cron = require("node-cron");

const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Data storage paths
const DATA_DIR = "./data";
const ARCHIVES_DIR = path.join(DATA_DIR, "archives");
const NEWS_FILE = path.join(DATA_DIR, "news.json");
const RSS_FEEDS_FILE = path.join(DATA_DIR, "rss-feeds.json");

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(ARCHIVES_DIR)) {
  fs.mkdirSync(ARCHIVES_DIR, { recursive: true });
}

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

// Türkçe karakterleri koruyan slug oluşturma fonksiyonu
function createTurkishSlug(text) {
  const turkishCharMap = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'I': 'I',
    'İ': 'I', 'i': 'i',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U'
  };
  
  let slug = text;
  
  // Türkçe karakterleri değiştir
  Object.keys(turkishCharMap).forEach(char => {
    slug = slug.replace(new RegExp(char, 'g'), turkishCharMap[char]);
  });
  
  // Küçük harfe çevir ve URL-friendly yap
  return slug
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// In-memory data storage
let newsData = [];
let lastUpdate = new Date();

// 🚀 SMART CACHE SYSTEM
const cache = {
  // Today's news cache
  todayNews: {
    data: null,
    lastUpdate: null,
    key: null, // today's date key for validation
  },

  // API responses cache
  responses: new Map(),

  // Archive cache
  archives: new Map(),

  // Metadata cache
  metadata: {
    sources: null,
    years: null,
    dates: null,
    lastUpdate: null,
  },
};

// Cache configuration
const CACHE_CONFIG = {
  TODAY_TTL: 5 * 60 * 1000, // 5 minutes for today's news
  API_TTL: 2 * 60 * 1000, // 2 minutes for API responses
  ARCHIVE_TTL: 30 * 60 * 1000, // 30 minutes for archives
  METADATA_TTL: 10 * 60 * 1000, // 10 minutes for metadata
};

// Helper functions
function generateHash(title, link) {
  return crypto
    .createHash("md5")
    .update(title + link)
    .digest("hex");
}

function getDateKey(date) {
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

function getHourKey(date) {
  const iso = date.toISOString();
  return iso.split(":")[0]; // YYYY-MM-DDTHH
}

function cleanText(text) {
  if (!text) return "";
  
  // HTML entity'leri decode et
  let cleanedText = text
    .replace(/<[^>]*>/g, "") // HTML tag'leri kaldır
    .replace(/\s+/g, " ") // Fazla boşlukları tek boşluğa çevir
    .trim();
  
  // Yaygın HTML entity'leri decode et
  const htmlEntities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '(c)',
    '&reg;': '(R)',
    '&trade;': '(TM)',
    '&hellip;': '...',
    '&mdash;': '--',
    '&ndash;': '-',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&laquo;': '<<',
    '&raquo;': '>>',
    '&times;': 'x',
    '&divide;': '/',
    '&plusmn;': '+/-',
    '&deg;': 'deg',
    '&micro;': 'u',
    '&para;': 'P',
    '&sect;': 'S',
    '&bull;': '*',
    '&middot;': '.',
    '&prime;': "'",
    '&Prime;': '"',
    '&infin;': 'inf',
    '&asymp;': '~',
    '&ne;': '!=',
    '&le;': '<=',
    '&ge;': '>=',
    '&sum;': 'sum',
    '&prod;': 'prod',
    '&radic;': 'sqrt',
    '&int;': 'int',
    '&part;': 'd',
    '&nabla;': 'nabla',
    '&isin;': 'in',
    '&notin;': 'not in',
    '&ni;': 'ni',
    '&empty;': 'empty',
    '&cap;': 'cap',
    '&cup;': 'cup',
    '&sub;': 'sub',
    '&sup;': 'sup',
    '&sube;': 'sube',
    '&supe;': 'supe',
    '&oplus;': 'oplus',
    '&otimes;': 'otimes',
    '&perp;': 'perp',
    '&sdot;': '.',
    '&lceil;': '[',
    '&rceil;': ']',
    '&lfloor;': '[',
    '&rfloor;': ']',
    '&lang;': '<',
    '&rang;': '>',
    '&larr;': '<-',
    '&uarr;': '^',
    '&rarr;': '->',
    '&darr;': 'v',
    '&harr;': '<->',
    '&crarr;': 'enter',
    '&lArr;': '<=',
    '&uArr;': '^',
    '&rArr;': '=>',
    '&dArr;': 'v',
    '&hArr;': '<=>',
    '&forall;': 'forall',
    '&exist;': 'exists',
    '&and;': 'and',
    '&or;': 'or',
    '&there4;': 'therefore',
    '&sim;': '~',
    '&cong;': 'cong',
    '&equiv;': 'equiv',
    '&nsub;': 'not sub',
    '&loz;': 'diamond',
    '&spades;': 'spades',
    '&hearts;': 'hearts',
    '&diams;': 'diamonds',
    '&clubs;': 'clubs'
  };
  
  // HTML entity'leri decode et
  Object.keys(htmlEntities).forEach(entity => {
    cleanedText = cleanedText.replace(new RegExp(entity, 'g'), htmlEntities[entity]);
  });
  
  // Numeric HTML entity'leri de decode et (&#39; gibi)
  cleanedText = cleanedText.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });
  
  // Hexadecimal HTML entity'leri de decode et (&#x27; gibi)
  cleanedText = cleanedText.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  return cleanedText;
}

function getTodayKey() {
  return getDateKey(new Date());
}

// 🧠 CACHE MANAGEMENT FUNCTIONS

// Generate cache key for API requests
function generateCacheKey(req) {
  const {
    page = 1,
    limit = 30,
    source,
    year,
    month,
    day,
    date,
    hour,
    search,
    q,
  } = req.query;
  const searchQuery = search || q || "all";
  return `api_${page}_${limit}_${source || "all"}_${year || "all"}_${
    month || "all"
  }_${day || "all"}_${date || "all"}_${hour || "all"}_${searchQuery}`;
}

// Check if cache is valid
function isCacheValid(cacheEntry, ttl) {
  if (!cacheEntry || !cacheEntry.lastUpdate) return false;
  return Date.now() - cacheEntry.lastUpdate < ttl;
}

// Get today's news from cache or generate
function getTodayNewsFromCache() {
  const todayKey = getTodayKey();

  // Check if today's cache is valid
  if (
    cache.todayNews.data &&
    cache.todayNews.key === todayKey &&
    isCacheValid(cache.todayNews, CACHE_CONFIG.TODAY_TTL)
  ) {
    console.log("📦 Cache HIT: Today news from cache");
    return cache.todayNews.data;
  }

  // Generate today's news
  console.log("🔄 Cache MISS: Generating today news cache");
  const todayNews = newsData.filter((article) => article.date_key === todayKey);

  // Update cache
  cache.todayNews = {
    data: todayNews,
    lastUpdate: Date.now(),
    key: todayKey,
  };

  return todayNews;
}

// Get metadata from cache or generate
function getMetadataFromCache() {
  if (isCacheValid(cache.metadata, CACHE_CONFIG.METADATA_TTL)) {
    console.log("📦 Cache HIT: Metadata from cache");
    return cache.metadata;
  }

  console.log("🔄 Cache MISS: Generating metadata cache");

  // Generate metadata
  const sources = [
    ...new Set(newsData.map((article) => article.source)),
  ].sort();
  const years = [
    ...new Set(newsData.map((article) => article.date_key.split("-")[0])),
  ]
    .sort()
    .reverse();
  const dates = [...new Set(newsData.map((article) => article.date_key))]
    .sort()
    .reverse();

  // Update cache
  cache.metadata = {
    sources,
    years,
    dates,
    lastUpdate: Date.now(),
  };

  return cache.metadata;
}

// Clear relevant caches when new news arrive
function invalidateCache() {
  console.log("🧹 Cache invalidation triggered");

  // Clear today's cache (new news might be from today)
  cache.todayNews = {
    data: null,
    lastUpdate: null,
    key: null,
  };

  // Clear API responses cache
  cache.responses.clear();

  // Clear metadata cache
  cache.metadata = {
    sources: null,
    years: null,
    dates: null,
    lastUpdate: null,
  };

  // Keep archive cache (less likely to change)
  console.log("✅ Cache invalidated successfully");
}

// Create hierarchical archive structure
function createArchiveStructure(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  const yearDir = path.join(ARCHIVES_DIR, year.toString());
  const monthDir = path.join(yearDir, month);

  if (!fs.existsSync(monthDir)) {
    fs.mkdirSync(monthDir, { recursive: true });
  }

  return {
    yearDir,
    monthDir,
    year,
    month,
    day,
    dateKey: `${year}-${month}-${day}`,
    archiveFile: path.join(monthDir, `${year}-${month}-${day}.json`),
  };
}

// Extract image from RSS item
function extractImageFromRSS(item) {
  let imageUrl = null;

  try {
    // Method 1: RSS enclosure
    if (
      item.enclosure &&
      item.enclosure.url &&
      (item.enclosure.type?.includes("image") ||
        item.enclosure.url.match(/\.(jpg|jpeg|png|gif|webp)$/i))
    ) {
      imageUrl = item.enclosure.url;
    }

    // Method 2: MediaRSS content
    if (
      !imageUrl &&
      item["media:content"] &&
      item["media:content"]["$"] &&
      item["media:content"]["$"].url
    ) {
      imageUrl = item["media:content"]["$"].url;
    }

    // Method 3: MediaRSS thumbnail
    if (
      !imageUrl &&
      item["media:thumbnail"] &&
      item["media:thumbnail"]["$"] &&
      item["media:thumbnail"]["$"].url
    ) {
      imageUrl = item["media:thumbnail"]["$"].url;
    }

    // Method 4: Direct image field
    if (!imageUrl && item.image) {
      if (typeof item.image === "string") {
        imageUrl = item.image;
      } else if (item.image.url) {
        imageUrl = item.image.url;
      }
    }

    // Method 5: Extract from content
    if (!imageUrl && item.content) {
      const imgMatch = item.content.match(/<img[^>]+src=["']([^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      }
    }

    // Method 6: Extract from content:encoded
    if (!imageUrl && item["content:encoded"]) {
      const imgMatch = item["content:encoded"].match(
        /<img[^>]+src=["']([^"']+)["']/i
      );
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      }
    }

    // Clean up relative URLs
    if (imageUrl) {
      if (imageUrl.startsWith("//")) {
        imageUrl = "https:" + imageUrl;
      } else if (imageUrl.startsWith("/")) {
        imageUrl = null;
      }
    }
  } catch (error) {
    console.error("Error extracting image:", error);
  }

  return imageUrl;
}

// Load existing data
function loadNewsData() {
  try {
    if (fs.existsSync(NEWS_FILE)) {
      const data = fs.readFileSync(NEWS_FILE, "utf8");
      newsData = JSON.parse(data);
      console.log(`✅ ${newsData.length} haber yüklendi`);

      // Initialize today's cache
      getTodayNewsFromCache();
    } else {
      newsData = [];
      console.log("🆕 Boş veri ile başlatıldı");
    }
  } catch (error) {
    console.error("❌ Veri yükleme hatası:", error);
    newsData = [];
  }
}

// Save data to file
function saveNewsData() {
  try {
    // if (newsData.length > 10000) {
    //   newsData = newsData.slice(-10000);
    // }
    fs.writeFileSync(NEWS_FILE, JSON.stringify(newsData, null, 2));
    console.log(`💾 ${newsData.length} haber kaydedildi`);
  } catch (error) {
    console.error("❌ Veri kaydetme hatası:", error);
  }
}

// Generate hierarchical archive files
function generateHierarchicalArchives() {
  try {
    // Group news by date
    const dateGroups = {};
    newsData.forEach((article) => {
      if (!dateGroups[article.date_key]) {
        dateGroups[article.date_key] = [];
      }
      dateGroups[article.date_key].push(article);
    });

    // Create hierarchical archive files
    Object.keys(dateGroups).forEach((dateKey) => {
      const date = new Date(dateKey + "T00:00:00Z");
      const { archiveFile } = createArchiveStructure(date);

      // Save daily archive
      fs.writeFileSync(
        archiveFile,
        JSON.stringify(dateGroups[dateKey], null, 2)
      );
    });

    // Generate year/month summary files
    generateArchiveSummaries();

    console.log("📁 Hierarchical archive files generated");
  } catch (error) {
    console.error("Error generating archives:", error);
  }
}

// Generate archive summary files
function generateArchiveSummaries() {
  try {
    const years = new Set();
    const monthsInYear = {};
    const daysInMonth = {};

    newsData.forEach((article) => {
      const [year, month] = article.date_key.split("-");
      const yearMonth = `${year}-${month}`;

      years.add(year);

      if (!monthsInYear[year]) {
        monthsInYear[year] = new Set();
      }
      monthsInYear[year].add(month);

      if (!daysInMonth[yearMonth]) {
        daysInMonth[yearMonth] = new Set();
      }
      daysInMonth[yearMonth].add(article.date_key);
    });

    // Generate year summaries
    years.forEach((year) => {
      const yearDir = path.join(ARCHIVES_DIR, year);
      const yearSummary = {
        year: parseInt(year),
        months: Array.from(monthsInYear[year]).sort(),
        totalNews: newsData.filter((n) => n.date_key.startsWith(year)).length,
        generated: new Date().toISOString(),
      };

      if (fs.existsSync(yearDir)) {
        fs.writeFileSync(
          path.join(yearDir, "summary.json"),
          JSON.stringify(yearSummary, null, 2)
        );
      }
    });

    // Generate month summaries
    Object.keys(daysInMonth).forEach((yearMonth) => {
      const [year, month] = yearMonth.split("-");
      const monthDir = path.join(ARCHIVES_DIR, year, month);
      const monthNews = newsData.filter((n) =>
        n.date_key.startsWith(yearMonth)
      );

      const monthSummary = {
        year: parseInt(year),
        month: parseInt(month),
        monthName: new Date(
          parseInt(year),
          parseInt(month) - 1,
          1
        ).toLocaleDateString("tr-TR", { month: "long" }),
        days: Array.from(daysInMonth[yearMonth]).sort(),
        totalNews: monthNews.length,
        topSources: getTopSources(monthNews),
        generated: new Date().toISOString(),
      };

      if (fs.existsSync(monthDir)) {
        fs.writeFileSync(
          path.join(monthDir, "summary.json"),
          JSON.stringify(monthSummary, null, 2)
        );
      }
    });
  } catch (error) {
    console.error("Error generating summaries:", error);
  }
}

// Get top sources for a news array
function getTopSources(newsArray) {
  const sourceCounts = {};
  newsArray.forEach((news) => {
    sourceCounts[news.source] = (sourceCounts[news.source] || 0) + 1;
  });

  return Object.entries(sourceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));
}

// 🔄 ENHANCED FETCH WITH CACHE INVALIDATION
async function fetchNews() {
  console.log("📡 RSS haberleri çekiliyor...");
  let totalNew = 0;
  const existingHashes = new Set(
    newsData.map((article) => article.content_hash)
  );

  for (const feed of feeds) {
    try {
      console.log(`🔄 ${feed.name} kontrol ediliyor...`);
      const rss = await parser.parseURL(feed.url);

      for (const item of rss.items) {
        if (!item.title || !item.link) continue;

        const hash = generateHash(item.title, item.link);
        if (existingHashes.has(hash)) continue;

        const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();
        const dateKey = getDateKey(pubDate);
        const hourKey = getHourKey(pubDate);

        let description = cleanText(
          item.contentSnippet || item.content || item.description || ""
        );
        if (description.length > 300) {
          description = description.substring(0, 300) + "...";
        }

        const imageUrl = extractImageFromRSS(item);

        const article = {
          id: Date.now() + Math.random(),
          title: cleanText(item.title),
          link: item.link,
          description,
          pubDate: pubDate.toISOString(),
          source: feed.name,
          content_hash: hash,
          created_at: new Date().toISOString(),
          date_key: dateKey,
          hour_key: hourKey,
          image: imageUrl,
        };

        newsData.push(article);
        existingHashes.add(hash);
        totalNew++;
      }
    } catch (error) {
      console.error(`❌ ${feed.name} hatası:`, error.message);
    }
  }

  if (totalNew > 0) {
    newsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    saveNewsData();
    generateHierarchicalArchives();

    // 🚀 INVALIDATE CACHE WHEN NEW NEWS ARRIVE
    invalidateCache();

    lastUpdate = new Date();
    console.log(
      `✅ RSS tamamlandı. Yeni haber: ${totalNew} - Cache invalidated`
    );
  } else {
    console.log(`✅ RSS tamamlandı. Yeni haber: ${totalNew} - Cache preserved`);
  }
}

// 🚀 CACHED API ROUTES

// Get news with smart caching
app.get("/api/news", (req, res) => {
  const startTime = Date.now();
  const cacheKey = generateCacheKey(req);

  // Check cache first
  if (cache.responses.has(cacheKey)) {
    const cached = cache.responses.get(cacheKey);
    if (isCacheValid(cached, CACHE_CONFIG.API_TTL)) {
      console.log(`📦 Cache HIT: API response [${Date.now() - startTime}ms]`);
      return res.json(cached.data);
    } else {
      cache.responses.delete(cacheKey);
    }
  }

  console.log(`🔄 Cache MISS: Generating API response [${cacheKey}]`);

  const {
    page = 1,
    limit = 30,
    source,
    year,
    month,
    day,
    date,
    hour,
  } = req.query;
  const offset = (page - 1) * limit;

  let filteredNews = [...newsData];

  // Legacy date support
  if (date && date !== "all") {
    filteredNews = filteredNews.filter((article) => article.date_key === date);
  }

  // New hierarchical date filtering
  if (year && year !== "all") {
    filteredNews = filteredNews.filter((article) =>
      article.date_key.startsWith(year)
    );
  }

  if (month && month !== "all") {
    const monthPadded = month.padStart(2, "0");
    filteredNews = filteredNews.filter((article) => {
      const [articleYear, articleMonth] = article.date_key.split("-");
      return year === "all" || articleYear === year
        ? articleMonth === monthPadded
        : false;
    });
  }

  if (day && day !== "all") {
    const dayPadded = day.padStart(2, "0");
    filteredNews = filteredNews.filter((article) => {
      const [articleYear, articleMonth, articleDay] =
        article.date_key.split("-");
      return articleDay === dayPadded;
    });
  }

  if (source && source !== "all") {
    // Hem tam eşleşme hem de slug eşleşmesi kontrol et
    filteredNews = filteredNews.filter((article) => {
      // Tam eşleşme kontrolü
      if (article.source === source) return true;
      
      // Slug eşleşmesi kontrolü
      const articleSlug = createTurkishSlug(article.source);
      const searchSlug = createTurkishSlug(source);
      return articleSlug === searchSlug;
    });
  }

  if (hour && hour !== "all") {
    filteredNews = filteredNews.filter((article) => article.hour_key === hour);
  }

  // Text search functionality - search in title and description
  const { search, q } = req.query;
  const searchQuery = search || q; // Support both 'search' and 'q' parameters
  
  if (searchQuery && searchQuery.trim() !== "") {
    const searchTerm = searchQuery.trim().toLowerCase();
    filteredNews = filteredNews.filter((article) => {
      // Search in title
      const titleMatch = article.title && article.title.toLowerCase().includes(searchTerm);
      
      // Search in description
      const descriptionMatch = article.description && article.description.toLowerCase().includes(searchTerm);
      
      // Search in source name
      const sourceMatch = article.source && article.source.toLowerCase().includes(searchTerm);
      
      return titleMatch || descriptionMatch || sourceMatch;
    });
  }

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

  // Cache the response
  cache.responses.set(cacheKey, {
    data: response,
    lastUpdate: Date.now(),
  });

  console.log(
    `✅ API response generated and cached [${Date.now() - startTime}ms]`
  );
  res.json(response);
});

// Get available years (cached)
app.get("/api/years", (req, res) => {
  const metadata = getMetadataFromCache();
  res.json(metadata.years);
});

// Get available months for a year (cached)
app.get("/api/months/:year", (req, res) => {
  const year = req.params.year;
  const months = [
    ...new Set(
      newsData
        .filter((article) => article.date_key.startsWith(year))
        .map((article) => article.date_key.split("-")[1])
    ),
  ]
    .sort()
    .reverse();

  const monthsWithNames = months.map((month) => ({
    value: month,
    name: new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString(
      "tr-TR",
      { month: "long" }
    ),
  }));

  res.json(monthsWithNames);
});

// Get available days for a year/month (cached)
app.get("/api/days/:year/:month", (req, res) => {
  const { year, month } = req.params;
  const monthPadded = month.padStart(2, "0");
  const yearMonth = `${year}-${monthPadded}`;

  const days = [
    ...new Set(
      newsData
        .filter((article) => article.date_key.startsWith(yearMonth))
        .map((article) => article.date_key.split("-")[2])
    ),
  ].sort((a, b) => parseInt(b) - parseInt(a));

  res.json(days);
});

// Archive routes with caching
app.get("/api/archive/:year/:month/:day", (req, res) => {
  const { year, month, day } = req.params;
  const cacheKey = `archive_${year}_${month}_${day}`;

  // Check cache
  if (cache.archives.has(cacheKey)) {
    const cached = cache.archives.get(cacheKey);
    if (isCacheValid(cached, CACHE_CONFIG.ARCHIVE_TTL)) {
      console.log(`📦 Cache HIT: Archive ${cacheKey}`);
      return res.json(cached.data);
    }
  }

  try {
    const monthPadded = month.padStart(2, "0");
    const dayPadded = day.padStart(2, "0");
    const dateKey = `${year}-${monthPadded}-${dayPadded}`;
    const archiveFile = path.join(
      ARCHIVES_DIR,
      year,
      monthPadded,
      `${dateKey}.json`
    );

    let data;
    if (fs.existsSync(archiveFile)) {
      data = JSON.parse(fs.readFileSync(archiveFile, "utf8"));
    } else {
      data = newsData.filter((article) => article.date_key === dateKey);
    }

    // Cache the result
    cache.archives.set(cacheKey, {
      data,
      lastUpdate: Date.now(),
    });

    console.log(`✅ Archive generated and cached: ${cacheKey}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/archive/:year/:month", (req, res) => {
  const { year, month } = req.params;
  const cacheKey = `archive_${year}_${month}`;

  // Check cache
  if (cache.archives.has(cacheKey)) {
    const cached = cache.archives.get(cacheKey);
    if (isCacheValid(cached, CACHE_CONFIG.ARCHIVE_TTL)) {
      console.log(`📦 Cache HIT: Archive ${cacheKey}`);
      return res.json(cached.data);
    }
  }

  try {
    const monthPadded = month.padStart(2, "0");
    const summaryFile = path.join(
      ARCHIVES_DIR,
      year,
      monthPadded,
      "summary.json"
    );

    let data;
    if (fs.existsSync(summaryFile)) {
      data = JSON.parse(fs.readFileSync(summaryFile, "utf8"));
    } else {
      const monthNews = newsData.filter((article) =>
        article.date_key.startsWith(`${year}-${monthPadded}`)
      );
      data = {
        year: parseInt(year),
        month: parseInt(month),
        totalNews: monthNews.length,
        news: monthNews,
      };
    }

    // Cache the result
    cache.archives.set(cacheKey, {
      data,
      lastUpdate: Date.now(),
    });

    console.log(`✅ Archive generated and cached: ${cacheKey}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/archive/:year", (req, res) => {
  const { year } = req.params;
  const cacheKey = `archive_${year}`;

  // Check cache
  if (cache.archives.has(cacheKey)) {
    const cached = cache.archives.get(cacheKey);
    if (isCacheValid(cached, CACHE_CONFIG.ARCHIVE_TTL)) {
      console.log(`📦 Cache HIT: Archive ${cacheKey}`);
      return res.json(cached.data);
    }
  }

  try {
    const summaryFile = path.join(ARCHIVES_DIR, year, "summary.json");

    let data;
    if (fs.existsSync(summaryFile)) {
      data = JSON.parse(fs.readFileSync(summaryFile, "utf8"));
    } else {
      const yearNews = newsData.filter((article) =>
        article.date_key.startsWith(year)
      );
      data = {
        year: parseInt(year),
        totalNews: yearNews.length,
        news: yearNews,
      };
    }

    // Cache the result
    cache.archives.set(cacheKey, {
      data,
      lastUpdate: Date.now(),
    });

    console.log(`✅ Archive generated and cached: ${cacheKey}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sources endpoint - now reads from RSS feeds file
app.get("/api/sources", (req, res) => {
  try {
    // Get unique source names from active RSS feeds
    const activeSources = feeds
      .map(feed => feed.name) // feed.name kullan (feed.kaynak değil)
      .filter((source, index, arr) => arr.indexOf(source) === index) // Remove duplicates
      .sort();
    
    console.log("📡 Sources endpoint: Returning", activeSources.length, "active sources from RSS feeds");
    console.log("📡 Active sources:", activeSources.slice(0, 5)); // İlk 5 kaynağı log'la
    res.json(activeSources);
  } catch (error) {
    console.error("❌ Error in /api/sources:", error);
    res.status(500).json({ error: "Sources yüklenirken hata oluştu" });
  }
});

app.get("/api/dates", (req, res) => {
  const metadata = getMetadataFromCache();
  res.json(metadata.dates);
});

app.get("/api/hours/:date", (req, res) => {
  const date = req.params.date;
  const hours = [
    ...new Set(
      newsData
        .filter((article) => article.date_key === date)
        .map((article) => article.hour_key)
    ),
  ]
    .sort()
    .reverse();
  res.json(hours);
});

// Manual fetch trigger
app.post("/api/fetch", async (req, res) => {
  try {
    await fetchNews();
    res.json({
      message: "Haberler başarıyla güncellendi",
      total: newsData.length,
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
});

// Reload RSS feeds from file
app.post("/api/reload-feeds", (req, res) => {
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
});

// Get current RSS feeds info
app.get("/api/feeds", (req, res) => {
  try {
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
});

// Stats endpoint with cache info
app.get("/api/stats", (req, res) => {
  const metadata = getMetadataFromCache();

  let firstNews = null;
  let latestNews = null;

  if (newsData.length > 0) {
    const sortedByCreated = [...newsData].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    firstNews = sortedByCreated[0].created_at;
    latestNews = sortedByCreated[sortedByCreated.length - 1].created_at;
  }

  res.json({
    total_news: newsData.length,
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
});

// Cache status endpoint (for monitoring)
app.get("/api/cache-status", (req, res) => {
  const now = Date.now();

  res.json({
    cache_health: {
      today_news: {
        cached: !!cache.todayNews.data,
        key: cache.todayNews.key,
        count: cache.todayNews.data ? cache.todayNews.data.length : 0,
        age_ms: cache.todayNews.lastUpdate
          ? now - cache.todayNews.lastUpdate
          : null,
        valid: isCacheValid(cache.todayNews, CACHE_CONFIG.TODAY_TTL),
      },
      api_responses: {
        count: cache.responses.size,
        keys: Array.from(cache.responses.keys()).slice(0, 5), // Show first 5 keys
      },
      archives: {
        count: cache.archives.size,
        keys: Array.from(cache.archives.keys()).slice(0, 5),
      },
      metadata: {
        cached: !!cache.metadata.sources,
        age_ms: cache.metadata.lastUpdate
          ? now - cache.metadata.lastUpdate
          : null,
        valid: isCacheValid(cache.metadata, CACHE_CONFIG.METADATA_TTL),
      },
    },
    memory_usage: process.memoryUsage(),
    uptime: process.uptime(),
  });
});

// Clear cache endpoint (admin)
app.post("/api/clear-cache", (req, res) => {
  const { type } = req.body;

  try {
    switch (type) {
      case "all":
        invalidateCache();
        break;
      case "today":
        cache.todayNews = { data: null, lastUpdate: null, key: null };
        break;
      case "api":
        cache.responses.clear();
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
      default:
        return res.status(400).json({ error: "Invalid cache type" });
    }

    res.json({ message: `Cache ${type} cleared successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dynamic sitemap.xml generator - UPDATED for new URL structure
app.get("/api/sitemap.xml", (req, res) => {
  try {
    console.log(`🔄 sitemap.xml yaratılıyor...`);
    const currentDate = new Date().toISOString().split("T")[0];
    const metadata = getMetadataFromCache();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <!-- Ana sayfa (bugüne redirect) -->
  <url>
    <loc>https://saatdakika.com</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
`;

    // Yıllar (/2025, /2024, etc.)
    if (metadata.years) {
      metadata.years.forEach((year) => {
        const yearNews = newsData.filter((article) =>
          article.date_key.startsWith(year)
        );
        const yearLastMod =
          yearNews.length > 0
            ? new Date(Math.max(...yearNews.map((n) => new Date(n.created_at))))
                .toISOString()
                .split("T")[0]
            : currentDate;

        sitemap += `  <url>
    <loc>https://saatdakika.com/${year}</loc>
    <lastmod>${yearLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

        // Aylar (/2025/08, /2025/07, etc.) - sadece son 2 yıl için
        const currentYear = new Date().getFullYear();
        if (parseInt(year) >= currentYear - 1) {
          const months = [
            ...new Set(
              newsData
                .filter((article) => article.date_key.startsWith(year))
                .map((article) => article.date_key.split("-")[1])
            ),
          ]
            .sort()
            .reverse();

          months.forEach((month) => {
            const monthKey = `${year}-${month}`;
            const monthNews = newsData.filter((article) =>
              article.date_key.startsWith(monthKey)
            );
            const monthLastMod =
              monthNews.length > 0
                ? new Date(
                    Math.max(...monthNews.map((n) => new Date(n.created_at)))
                  )
                    .toISOString()
                    .split("T")[0]
                : currentDate;

            sitemap += `  <url>
    <loc>https://saatdakika.com/${year}/${month.padStart(2, "0")}</loc>
    <lastmod>${monthLastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`;

            // Günler (/2025/08/15, /2025/08/14, etc.) - sadece son 3 ay için
            const now = new Date();
            const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
            const monthsAgo =
              (now.getFullYear() - monthDate.getFullYear()) * 12 +
              (now.getMonth() - monthDate.getMonth());

            if (monthsAgo <= 3) {
              const days = [
                ...new Set(
                  newsData
                    .filter((article) => article.date_key.startsWith(monthKey))
                    .map((article) => article.date_key.split("-")[2])
                ),
              ]
                .sort()
                .reverse();

              days.forEach((day) => {
                const dateKey = `${year}-${month.padStart(
                  2,
                  "0"
                )}-${day.padStart(2, "0")}`;
                const dayNews = newsData.filter(
                  (article) => article.date_key === dateKey
                );
                const dayLastMod =
                  dayNews.length > 0
                    ? new Date(
                        Math.max(...dayNews.map((n) => new Date(n.created_at)))
                      )
                        .toISOString()
                        .split("T")[0]
                    : currentDate;

                // Ana günlük sayfa
                sitemap += `  <url>
    <loc>https://saatdakika.com/${year}/${month.padStart(
                  2,
                  "0"
                )}/${day.padStart(2, "0")}</loc>
    <lastmod>${dayLastMod}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
`;

                // Pagination sayfaları (eğer 30'dan fazla haber varsa)
                if (dayNews.length > 30) {
                  const totalPages = Math.ceil(dayNews.length / 30);
                  for (let page = 2; page <= Math.min(totalPages, 10); page++) {
                    // Max 10 sayfa
                    sitemap += `  <url>
    <loc>https://saatdakika.com/${year}/${month.padStart(
                      2,
                      "0"
                    )}/${day.padStart(2, "0")}/${page}</loc>
    <lastmod>${dayLastMod}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.7</priority>
  </url>
`;
                  }
                }
              });
            }
          });
        }
      });
    }

    // Kaynak bazlı URL'ler (/source/sabah-gazetesi/2025/08/15)
    // Sadece son 30 güne ait ve popüler kaynaklar için
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const last30DaysKey = getDateKey(last30Days);

    const sources = [...new Set(newsData.map((article) => article.source))];
    const popularSources = sources.slice(0, 10); // İlk 10 kaynak

    popularSources.forEach((source) => {
      const sourceSlug = createTurkishSlug(source);

      // Son 30 gündeki bu kaynağın haberlerini al
      const sourceNews = newsData.filter(
        (article) =>
          article.source === source && article.date_key >= last30DaysKey
      );

      // Tarihleri grupla
      const sourceDates = [
        ...new Set(sourceNews.map((article) => article.date_key)),
      ]
        .sort()
        .reverse();

      // Son 7 günü ekle
      sourceDates.slice(0, 7).forEach((dateKey) => {
        const [year, month, day] = dateKey.split("-");
        const dateNews = sourceNews.filter(
          (article) => article.date_key === dateKey
        );
        const dateLastMod =
          dateNews.length > 0
            ? new Date(Math.max(...dateNews.map((n) => new Date(n.created_at))))
                .toISOString()
                .split("T")[0]
            : currentDate;

        sitemap += `  <url>
    <loc>https://saatdakika.com/source/${sourceSlug}/${year}/${month}/${day}</loc>
    <lastmod>${dateLastMod}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
`;

        // Kaynak pagination (eğer 30'dan fazla haber varsa)
        if (dateNews.length > 30) {
          const totalPages = Math.ceil(dateNews.length / 30);
          for (let page = 2; page <= Math.min(totalPages, 5); page++) {
            // Max 5 sayfa
            sitemap += `  <url>
    <loc>https://saatdakika.com/source/${sourceSlug}/${year}/${month}/${day}/${page}</loc>
    <lastmod>${dateLastMod}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.6</priority>
  </url>
`;
          }
        }
      });
    });

    sitemap += `</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(sitemap);
    console.log(
      `✅ sitemap.xml yaratıldı. Toplam URL sayısı: ${
        (sitemap.match(/<url>/g) || []).length
      }`
    );
  } catch (error) {
    console.error(`❌ sitemap.xml yaratma hatası:`, error.message);
    res.status(500).send("Sitemap generation error");
  }
});

// Initialize data loading
loadNewsData();
loadRSSFeeds(); // Load feeds on startup

// Generate initial archives if data exists
if (newsData.length > 0) {
  generateHierarchicalArchives();
}

// Schedule RSS fetching every 5 minutes
cron.schedule("*/5 * * * *", () => {
  console.log("⏰ Zamanlanmış RSS güncellemesi başladı...");
  fetchNews();
});

// Cache cleanup every hour (remove expired entries)
cron.schedule("0 * * * *", () => {
  console.log("🧹 Cache cleanup başladı...");

  // Clean expired API responses
  const now = Date.now();
  for (const [key, value] of cache.responses.entries()) {
    if (!isCacheValid(value, CACHE_CONFIG.API_TTL)) {
      cache.responses.delete(key);
    }
  }

  // Clean expired archives
  for (const [key, value] of cache.archives.entries()) {
    if (!isCacheValid(value, CACHE_CONFIG.ARCHIVE_TTL)) {
      cache.archives.delete(key);
    }
  }

  console.log(
    `✅ Cache cleanup tamamlandı. API: ${cache.responses.size}, Archives: ${cache.archives.size}`
  );
});

// Initial fetch on startup
setTimeout(() => {
  fetchNews();
}, 5000);

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("💾 Kapatılıyor, veriler kaydediliyor...");
  saveNewsData();

  // Cache statistics on shutdown
  console.log("📊 Final cache stats:", {
    today_news: cache.todayNews.data ? cache.todayNews.data.length : 0,
    api_responses: cache.responses.size,
    archives: cache.archives.size,
    metadata_cached: !!cache.metadata.sources,
  });

  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server ${PORT} portunda çalışıyor`);
  console.log("📡 RSS beslemeleri her 5 dakikada bir güncellenecek");
  console.log(`📁 Veriler şuraya kaydediliyor: ${DATA_DIR}`);
  console.log(`📂 Arşiv yapısı: ${ARCHIVES_DIR}`);
  console.log("🧠 Smart cache system aktif");
  console.log("⚡ Performance monitoring: /api/cache-status");
});
