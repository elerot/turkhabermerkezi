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

// In-memory data storage - only for today's news and recent cache
let todayNews = [];
let lastUpdate = new Date();

// 🚀 SMART CACHE SYSTEM
const cache = {
  // Today's news cache
  todayNews: {
    data: null,
    lastUpdate: null,
    key: null, // today's date key for validation
    hits: 0,
    misses: 0,
  },

  // API responses cache
  responses: new Map(),
  apiStats: {
    hits: 0,
    misses: 0,
  },

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
    cache.todayNews.hits++;
    console.log(`📦 Cache HIT: Today news from cache (hits: ${cache.todayNews.hits})`);
    return cache.todayNews.data;
  }

  // Generate today's news from memory or archive file
  cache.todayNews.misses++;
  console.log(`🔄 Cache MISS: Generating today news cache (misses: ${cache.todayNews.misses})`);
  let todayNewsData = todayNews; // Use in-memory today's news

  // If no in-memory data, try to load from archive file
  if (todayNewsData.length === 0) {
    const [year, month, day] = todayKey.split("-");
    const todayArchiveFile = path.join(
      ARCHIVES_DIR,
      year,
      month,
      `${day}.json` // Sadece gün numarası
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

  // DON'T clear today's cache - let it be updated with new data instead
  // cache.todayNews = {
  //   data: null,
  //   lastUpdate: null,
  //   key: null,
  // };

  // Clear API responses cache (but keep stats)
  cache.responses.clear();

  // Clear metadata cache
  cache.metadata = {
    sources: null,
    years: null,
    dates: null,
    lastUpdate: null,
  };

  // Keep archive cache (less likely to change)
  console.log("✅ Cache invalidated successfully (today's cache preserved)");
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
    archiveFile: path.join(monthDir, `${day}.json`), // Sadece gün numarası
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

// Load today's news from archive files
function loadTodayNews() {
  try {
    const todayKey = getTodayKey();
    const [year, month, day] = todayKey.split("-");
    const todayArchiveFile = path.join(
      ARCHIVES_DIR,
      year,
      month,
      `${day}.json` // Sadece gün numarası
    );

    if (fs.existsSync(todayArchiveFile)) {
      const data = fs.readFileSync(todayArchiveFile, "utf8");
      todayNews = JSON.parse(data);
      console.log(`✅ Bugün için ${todayNews.length} haber yüklendi`);
    } else {
      todayNews = [];
      console.log("🆕 Bugün için henüz haber yok");
    }

    // 🚀 Initialize cache with loaded data
    cache.todayNews = {
      data: [...todayNews], // Copy the data
      lastUpdate: Date.now(),
      key: todayKey,
      hits: 0,
      misses: 0,
    };

    console.log(`📦 Today's cache initialized: ${todayNews.length} news, key: ${todayKey}`);
  } catch (error) {
    console.error("❌ Bugünün haberlerini yükleme hatası:", error);
    todayNews = [];
    
    // Initialize empty cache
    const todayKey = getTodayKey();
    cache.todayNews = {
      data: [],
      lastUpdate: Date.now(),
      key: todayKey,
      hits: 0,
      misses: 0,
    };
  }
}

// Save article to archive file
function saveArticleToArchive(article) {
  try {
    const date = new Date(article.date_key + "T00:00:00Z");
    const { archiveFile } = createArchiveStructure(date);

    // Read existing articles for this date
    let existingArticles = [];
    if (fs.existsSync(archiveFile)) {
      const data = fs.readFileSync(archiveFile, "utf8");
      existingArticles = JSON.parse(data);
    }

    // Check if article already exists (by content_hash)
    const exists = existingArticles.some(existing => existing.content_hash === article.content_hash);
    if (exists) {
      return false; // Article already exists
    }

    // Add new article
    existingArticles.push(article);
    
    // Sort by created_at (newest first)
    existingArticles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Save to archive file
    fs.writeFileSync(archiveFile, JSON.stringify(existingArticles, null, 2));

    // Update summary files
    updateArchiveSummaries(article.date_key);

    return true; // Article was added
  } catch (error) {
    console.error("Error saving article to archive:", error);
    return false;
  }
}

// Update archive summary files for a specific date
function updateArchiveSummaries(dateKey) {
  try {
    const [year, month] = dateKey.split("-");
    const yearMonth = `${year}-${month}`;

    // Update month summary
    const monthDir = path.join(ARCHIVES_DIR, year, month);
    if (fs.existsSync(monthDir)) {
      // Read all daily files in this month to count news
      const days = fs.readdirSync(monthDir)
        .filter(file => file.endsWith('.json') && file !== 'summary.json')
        .map(file => {
          const day = file.replace('.json', '');
          return day.padStart(2, "0"); // "3" -> "03" formatına çevir
        })
        .sort();

      let totalNews = 0;
      const allNews = [];

      days.forEach(day => {
        const dayFile = path.join(monthDir, `${day}.json`);
        if (fs.existsSync(dayFile)) {
          const dayData = JSON.parse(fs.readFileSync(dayFile, "utf8"));
          totalNews += dayData.length;
          allNews.push(...dayData);
        }
      });

      const monthSummary = {
        year: parseInt(year),
        month: parseInt(month),
        monthName: new Date(
          parseInt(year),
          parseInt(month) - 1,
          1
        ).toLocaleDateString("tr-TR", { month: "long" }),
        days: days,
        totalNews: totalNews,
        topSources: getTopSources(allNews),
        generated: new Date().toISOString(),
      };

      fs.writeFileSync(
        path.join(monthDir, "summary.json"),
        JSON.stringify(monthSummary, null, 2)
      );
    }

    // Update year summary
    const yearDir = path.join(ARCHIVES_DIR, year);
    if (fs.existsSync(yearDir)) {
      const months = fs.readdirSync(yearDir)
        .filter(dir => fs.statSync(path.join(yearDir, dir)).isDirectory())
        .sort();

      let yearTotalNews = 0;
      months.forEach(month => {
        const monthSummaryFile = path.join(yearDir, month, "summary.json");
        if (fs.existsSync(monthSummaryFile)) {
          const monthSummary = JSON.parse(fs.readFileSync(monthSummaryFile, "utf8"));
          yearTotalNews += monthSummary.totalNews || 0;
        }
      });

      const yearSummary = {
        year: parseInt(year),
        months: months,
        totalNews: yearTotalNews,
        generated: new Date().toISOString(),
      };

      fs.writeFileSync(
        path.join(yearDir, "summary.json"),
        JSON.stringify(yearSummary, null, 2)
      );
    }
  } catch (error) {
    console.error("Error updating summaries:", error);
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

// 🔄 ENHANCED FETCH WITH ARCHIVE STORAGE
async function fetchNews() {
  console.log("📡 RSS haberleri çekiliyor...");
  let totalNew = 0;
  let todayNew = 0;

  for (const feed of feeds) {
    try {
      console.log(`🔄 ${feed.name} kontrol ediliyor...`);
      const rss = await parser.parseURL(feed.url);

      for (const item of rss.items) {
        if (!item.title || !item.link) continue;

        const hash = generateHash(item.title, item.link);
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

        // RSS item'ından kategori bilgisini al, yoksa feed'den al
        let articleCategory = feed.category;
        if (item.categories && item.categories.length > 0) {
          articleCategory = item.categories[0];
        } else if (item.category) {
          articleCategory = item.category;
        }

        // Haber başlığına göre kategori tahmin et
        const title = cleanText(item.title).toLowerCase();
        const descriptionText = cleanText(item.description || item.contentSnippet || "").toLowerCase();
        const content = (title + " " + descriptionText).toLowerCase();

        // Spor kategorisi
        if (content.includes('futbol') || content.includes('basketbol') || content.includes('voleybol') || 
            content.includes('tenis') || content.includes('spor') || content.includes('maç') || 
            content.includes('galatasaray') || content.includes('fenerbahçe') || content.includes('beşiktaş') ||
            content.includes('trabzonspor') || content.includes('başakşehir') || content.includes('antrenman') ||
            content.includes('şampiyon') || content.includes('lig') || content.includes('kup') ||
            content.includes('gol') || content.includes('asist') || content.includes('kart') ||
            content.includes('transfer') || content.includes('oyuncu') || content.includes('teknik direktör')) {
          articleCategory = "Spor";
        }
        // Ekonomi kategorisi
        else if (content.includes('ekonomi') || content.includes('borsa') || content.includes('dolar') || 
                 content.includes('euro') || content.includes('altın') || content.includes('enflasyon') ||
                 content.includes('faiz') || content.includes('kredi') || content.includes('yatırım') ||
                 content.includes('şirket') || content.includes('piyasa') || content.includes('finans') ||
                 content.includes('bankacılık') || content.includes('kripto') || content.includes('bitcoin')) {
          articleCategory = "Ekonomi";
        }
        // Teknoloji kategorisi
        else if (content.includes('teknoloji') || content.includes('yapay zeka') || content.includes('ai') ||
                 content.includes('yazılım') || content.includes('donanım') || content.includes('telefon') ||
                 content.includes('bilgisayar') || content.includes('internet') || content.includes('siber') ||
                 content.includes('dijital') || content.includes('uygulama') || content.includes('app') ||
                 content.includes('startup') || content.includes('inovasyon') || content.includes('robot')) {
          articleCategory = "Teknoloji";
        }
        // Sağlık kategorisi
        else if (content.includes('sağlık') || content.includes('hastane') || content.includes('doktor') ||
                 content.includes('hasta') || content.includes('ilaç') || content.includes('tedavi') ||
                 content.includes('virüs') || content.includes('covid') || content.includes('pandemi') ||
                 content.includes('aşı') || content.includes('ameliyat') || content.includes('kanser') ||
                 content.includes('kalp') || content.includes('beyin') || content.includes('organ')) {
          articleCategory = "Sağlık";
        }
        // Siyaset kategorisi
        else if (content.includes('siyaset') || content.includes('bakan') || content.includes('milletvekili') ||
                 content.includes('parti') || content.includes('seçim') || content.includes('oy') ||
                 content.includes('meclis') || content.includes('hükümet') || content.includes('cumhurbaşkanı') ||
                 content.includes('başbakan') || content.includes('belediye') || content.includes('vali') ||
                 content.includes('kaymakam') || content.includes('müsteşar') || content.includes('genel müdür')) {
          articleCategory = "Siyaset";
        }
        // Dünya kategorisi
        else if (content.includes('dünya') || content.includes('amerika') || content.includes('avrupa') ||
                 content.includes('rusya') || content.includes('çin') || content.includes('almanya') ||
                 content.includes('fransa') || content.includes('ingiltere') || content.includes('japonya') ||
                 content.includes('kore') || content.includes('hindistan') || content.includes('brezilya') ||
                 content.includes('mısır') || content.includes('iran') || content.includes('israil') ||
                 content.includes('filistin') || content.includes('ukrayna') || content.includes('suriye')) {
          articleCategory = "Dünya";
        }
        // Kültür Sanat kategorisi
        else if (content.includes('kültür') || content.includes('sanat') || content.includes('müzik') ||
                 content.includes('film') || content.includes('dizi') || content.includes('kitap') ||
                 content.includes('yazar') || content.includes('şarkıcı') || content.includes('oyuncu') ||
                 content.includes('türkü') || content.includes('konser') || content.includes('sergi') ||
                 content.includes('tiyatro') || content.includes('opera') || content.includes('bale')) {
          articleCategory = "Kültür Sanat";
        }
        // Eğitim kategorisi
        else if (content.includes('eğitim') || content.includes('okul') || content.includes('üniversite') ||
                 content.includes('öğrenci') || content.includes('öğretmen') || content.includes('ders') ||
                 content.includes('sınav') || content.includes('yks') || content.includes('ales') ||
                 content.includes('kpss') || content.includes('dgs') || content.includes('yök') ||
                 content.includes('meb') || content.includes('öğretim') || content.includes('akademik')) {
          articleCategory = "Eğitim";
        }

        const article = {
          id: Date.now() + Math.random(),
          title: cleanText(item.title),
          link: item.link,
          description,
          pubDate: pubDate.toISOString(),
          source: feed.name,
          category: articleCategory,
          content_hash: hash,
          created_at: new Date().toISOString(),
          date_key: dateKey,
          hour_key: hourKey,
          image: imageUrl,
        };

        // Save article to archive file
        const wasAdded = saveArticleToArchive(article);
        if (wasAdded) {
          totalNew++;
          
          // If it's today's news, add to todayNews array
          if (dateKey === getTodayKey()) {
            todayNews.push(article);
            todayNew++;
          }
        }
      }
    } catch (error) {
      console.error(`❌ ${feed.name} hatası:`, error.message);
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
    invalidateCache();

    lastUpdate = new Date();
    console.log(
      `✅ RSS tamamlandı. Yeni haber: ${totalNew} (bugün: ${todayNew}) - Today's cache updated`
    );
  } else {
    console.log(`✅ RSS tamamlandı. Yeni haber: ${totalNew} - Cache preserved`);
  }
}

// 🚀 CACHED API ROUTES

// Get news with smart caching from archive files
app.get("/api/news", (req, res) => {
  const startTime = Date.now();
  const cacheKey = generateCacheKey(req);

  // Check cache first
  if (cache.responses.has(cacheKey)) {
    const cached = cache.responses.get(cacheKey);
    if (isCacheValid(cached, CACHE_CONFIG.API_TTL)) {
      cache.apiStats.hits++;
      console.log(`📦 Cache HIT: API response [${Date.now() - startTime}ms] (hits: ${cache.apiStats.hits})`);
      return res.json(cached.data);
    } else {
      cache.responses.delete(cacheKey);
    }
  }

  cache.apiStats.misses++;
  console.log(`🔄 Cache MISS: Generating API response [${cacheKey}] (misses: ${cache.apiStats.misses})`);

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
    // If specific month is requested
    else if (month && month !== "all" && year && year !== "all") {
      const monthPadded = month.padStart(2, "0");
      const monthDir = path.join(ARCHIVES_DIR, year, monthPadded);
      
      if (fs.existsSync(monthDir)) {
        const dayFiles = fs.readdirSync(monthDir)
          .filter(file => file.endsWith('.json') && file !== 'summary.json')
          .sort()
          .reverse(); // Newest first
        
        for (const dayFile of dayFiles) {
          const day = dayFile.replace('.json', '');
          const dateKey = `${year}-${monthPadded}-${day.padStart(2, "0")}`;
          
          // If it's today's date, use cache
          if (dateKey === getTodayKey()) {
            filteredNews.push(...getTodayNewsFromCache());
          } else {
            // For other dates, load from archive file
            const dayData = JSON.parse(fs.readFileSync(path.join(monthDir, dayFile), "utf8"));
            filteredNews.push(...dayData);
          }
        }
      }
    }
    // If specific year is requested
    else if (year && year !== "all") {
      const yearDir = path.join(ARCHIVES_DIR, year);
      
      if (fs.existsSync(yearDir)) {
        const months = fs.readdirSync(yearDir)
          .filter(dir => fs.statSync(path.join(yearDir, dir)).isDirectory())
          .sort()
          .reverse(); // Newest first
        
        for (const monthDir of months) {
          const monthPath = path.join(yearDir, monthDir);
          const dayFiles = fs.readdirSync(monthPath)
            .filter(file => file.endsWith('.json') && file !== 'summary.json')
            .sort()
            .reverse();
          
          for (const dayFile of dayFiles) {
            const day = dayFile.replace('.json', '');
            const dateKey = `${year}-${monthDir}-${day.padStart(2, "0")}`;
            
            // If it's today's date, use cache
            if (dateKey === getTodayKey()) {
              filteredNews.push(...getTodayNewsFromCache());
            } else {
              // For other dates, load from archive file
              const dayData = JSON.parse(fs.readFileSync(path.join(monthPath, dayFile), "utf8"));
              filteredNews.push(...dayData);
            }
          }
        }
      }
    }
    // If no specific date filters, use today's news + recent days (last 30 days)
    else {
      // Start with today's news from cache
      filteredNews = [...getTodayNewsFromCache()];
      
      // Add recent days (last 30 days)
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
          `${day}.json` // Sadece gün numarası
        );
        
        if (fs.existsSync(archiveFile)) {
          const dayData = JSON.parse(fs.readFileSync(archiveFile, "utf8"));
          filteredNews.push(...dayData);
        }
      }
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

    // Cache the response
    cache.responses.set(cacheKey, {
      data: response,
      lastUpdate: Date.now(),
    });

    console.log(
      `✅ API response generated and cached [${Date.now() - startTime}ms]`
    );
    res.json(response);
  } catch (error) {
    console.error("❌ Error in /api/news:", error);
    res.status(500).json({ error: "Haberler yüklenirken hata oluştu" });
  }
});

// Get available years (cached)
app.get("/api/years", (req, res) => {
  const metadata = getMetadataFromCache();
  res.json(metadata.years);
});

// Get available months for a year (cached)
app.get("/api/months/:year", (req, res) => {
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
});

// Get available days for a year/month (cached)
app.get("/api/days/:year/:month", (req, res) => {
  const { year, month } = req.params;
  const monthPadded = month.padStart(2, "0");
  
  try {
    const monthDir = path.join(ARCHIVES_DIR, year, monthPadded);
    let days = [];
    
    if (fs.existsSync(monthDir)) {
      days = fs.readdirSync(monthDir)
        .filter(file => file.endsWith('.json') && file !== 'summary.json')
        .map(file => {
          // Dosya adı artık sadece gün numarası (örn: "03.json" -> "3")
          const dayPart = file.replace('.json', '');
          return parseInt(dayPart).toString(); // "03" -> "3"
        })
        .sort((a, b) => parseInt(b) - parseInt(a));
    }

    res.json(days);
  } catch (error) {
    console.error("Error getting days:", error);
    res.status(500).json({ error: "Günler yüklenirken hata oluştu" });
  }
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
      `${dayPadded}.json` // Sadece gün numarası
    );

    let data;
    if (fs.existsSync(archiveFile)) {
      data = JSON.parse(fs.readFileSync(archiveFile, "utf8"));
    } else {
      data = []; // No fallback data needed
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
      data = {
        year: parseInt(year),
        month: parseInt(month),
        totalNews: 0,
        news: [],
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
      data = {
        year: parseInt(year),
        totalNews: 0,
        news: [],
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

// Categories endpoint - reads from RSS feeds file
app.get("/api/categories", (req, res) => {
  try {
    // Get unique categories from active RSS feeds
    const activeCategories = feeds
      .map(feed => feed.category) // feed.category kullan
      .filter((category, index, arr) => arr.indexOf(category) === index) // Remove duplicates
      .sort();
    
    console.log("📡 Categories endpoint: Returning", activeCategories.length, "active categories from RSS feeds");
    console.log("📡 Active categories:", activeCategories.slice(0, 10)); // İlk 10 kategoriyi log'la
    res.json(activeCategories);
  } catch (error) {
    console.error("❌ Error in /api/categories:", error);
    res.status(500).json({ error: "Categories yüklenirken hata oluştu" });
  }
});

app.get("/api/dates", (req, res) => {
  const metadata = getMetadataFromCache();
  res.json(metadata.dates);
});

app.get("/api/hours/:date", (req, res) => {
  const date = req.params.date;
  
  try {
    const [year, month, day] = date.split("-");
    const archiveFile = path.join(ARCHIVES_DIR, year, month, `${day}.json`); // Sadece gün numarası
    
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
});

// Manual fetch trigger
app.post("/api/fetch", async (req, res) => {
  try {
    await fetchNews();
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
});

// Cache status endpoint (for monitoring)
app.get("/api/cache-status", (req, res) => {
  const now = Date.now();
  const todayKey = getTodayKey();

  res.json({
    cache_health: {
      today_news: {
        cached: !!cache.todayNews.data,
        key: cache.todayNews.key,
        expected_key: todayKey,
        key_match: cache.todayNews.key === todayKey,
        count: cache.todayNews.data ? cache.todayNews.data.length : 0,
        age_ms: cache.todayNews.lastUpdate
          ? now - cache.todayNews.lastUpdate
          : null,
        valid: isCacheValid(cache.todayNews, CACHE_CONFIG.TODAY_TTL),
        ttl_ms: CACHE_CONFIG.TODAY_TTL,
        hits: cache.todayNews.hits || 0,
        misses: cache.todayNews.misses || 0,
        hit_rate: cache.todayNews.hits && cache.todayNews.misses 
          ? (cache.todayNews.hits / (cache.todayNews.hits + cache.todayNews.misses) * 100).toFixed(2) + '%'
          : '0%',
        last_access: cache.todayNews.lastUpdate ? new Date(cache.todayNews.lastUpdate).toISOString() : null
      },
      api_responses: {
        count: cache.responses.size,
        keys: Array.from(cache.responses.keys()).slice(0, 5), // Show first 5 keys
        hits: cache.apiStats.hits || 0,
        misses: cache.apiStats.misses || 0,
        hit_rate: cache.apiStats.hits && cache.apiStats.misses 
          ? (cache.apiStats.hits / (cache.apiStats.hits + cache.apiStats.misses) * 100).toFixed(2) + '%'
          : '0%',
        ttl_ms: CACHE_CONFIG.API_TTL,
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

// Test cache behavior endpoint (for debugging)
app.get("/api/test-cache", (req, res) => {
  const todayKey = getTodayKey();
  
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

// Clear cache endpoint (admin)
app.post("/api/clear-cache", (req, res) => {
  const { type } = req.body;

  try {
    switch (type) {
      case "all":
        invalidateCache();
        break;
      case "today":
        cache.todayNews = { data: null, lastUpdate: null, key: null, hits: 0, misses: 0 };
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
        sitemap += `  <url>
    <loc>https://saatdakika.com/${year}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
`;

        // Aylar (/2025/08, /2025/07, etc.) - sadece son 2 yıl için
        const currentYear = new Date().getFullYear();
        if (parseInt(year) >= currentYear - 1) {
          const yearDir = path.join(ARCHIVES_DIR, year);
          if (fs.existsSync(yearDir)) {
            const months = fs.readdirSync(yearDir)
              .filter(dir => fs.statSync(path.join(yearDir, dir)).isDirectory())
              .sort()
              .reverse();

            months.forEach((month) => {
              sitemap += `  <url>
    <loc>https://saatdakika.com/${year}/${month}</loc>
    <lastmod>${currentDate}</lastmod>
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
                const monthDir = path.join(yearDir, month);
                if (fs.existsSync(monthDir)) {
                  const days = fs.readdirSync(monthDir)
                    .filter(file => file.endsWith('.json') && file !== 'summary.json')
                    .map(file => {
                      const day = file.replace('.json', '');
                      return day.padStart(2, "0"); // "3" -> "03" formatına çevir
                    })
                    .sort()
                    .reverse();

                  days.forEach((day) => {
                    // Ana günlük sayfa
                    sitemap += `  <url>
    <loc>https://saatdakika.com/${year}/${month}/${day}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
`;

                    // Pagination sayfaları (varsayılan olarak 2-5 sayfa ekle)
                    for (let page = 2; page <= 5; page++) {
                      sitemap += `  <url>
    <loc>https://saatdakika.com/${year}/${month}/${day}/${page}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.7</priority>
  </url>
`;
                    }
                  });
                }
              }
            });
          }
        }
      });
    }

    // Kaynak bazlı URL'ler (/source/sabah-gazetesi/2025/08/15)
    // Sadece son 7 güne ait ve popüler kaynaklar için
    const popularSources = feeds.slice(0, 10).map(feed => feed.name); // İlk 10 kaynak

    popularSources.forEach((source) => {
      const sourceSlug = createTurkishSlug(source);

      // Son 7 günü ekle
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = getDateKey(date);
        const [year, month, day] = dateKey.split("-");

        sitemap += `  <url>
    <loc>https://saatdakika.com/source/${sourceSlug}/${year}/${month}/${day}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
`;

        // Kaynak pagination (varsayılan olarak 2-3 sayfa ekle)
        for (let page = 2; page <= 3; page++) {
          sitemap += `  <url>
    <loc>https://saatdakika.com/source/${sourceSlug}/${year}/${month}/${day}/${page}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.6</priority>
  </url>
`;
        }
      }
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
loadTodayNews(); // Load today's news from archive files
loadRSSFeeds(); // Load feeds on startup

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

