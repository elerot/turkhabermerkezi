const fs = require("fs");
const path = require("path");
const cache = require("../config/cache");
const { ARCHIVES_DIR } = require("../config/constants");

// Get archive by day
function getArchiveByDay(req, res) {
  const { year, month, day } = req.params;
  const cacheKey = `archive_${year}_${month}_${day}`;

  // Check LRU cache (otomatik TTL)
  const cached = cache.archives.get(cacheKey);
  if (cached) {
    console.log(`📦 Cache HIT: Archive ${cacheKey}`);
    return res.json(cached);
  }

  try {
    const monthPadded = month.padStart(2, "0");
    const dayPadded = day.padStart(2, "0");
    const dateKey = `${year}-${monthPadded}-${dayPadded}`;
    const archiveFile = path.join(
      ARCHIVES_DIR,
      year,
      monthPadded,
      `${dayPadded}.json`
    );

    let data;
    if (fs.existsSync(archiveFile)) {
      try {
        data = JSON.parse(fs.readFileSync(archiveFile, "utf8"));
      } catch (parseError) {
        console.error(`⚠️ Corrupt archive file: ${archiveFile}`, parseError.message);
        data = [];
      }
    } else {
      data = [];
    }

    // Cache the result (LRU otomatik TTL)
    cache.archives.set(cacheKey, data);

    console.log(`✅ Archive generated and cached: ${cacheKey}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get archive by month
function getArchiveByMonth(req, res) {
  const { year, month } = req.params;
  const cacheKey = `archive_${year}_${month}`;

  // Check LRU cache (otomatik TTL)
  const cached = cache.archives.get(cacheKey);
  if (cached) {
    console.log(`📦 Cache HIT: Archive ${cacheKey}`);
    return res.json(cached);
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
      try {
        data = JSON.parse(fs.readFileSync(summaryFile, "utf8"));
      } catch (parseError) {
        console.error(`⚠️ Corrupt summary file: ${summaryFile}`, parseError.message);
        data = {
          year: parseInt(year),
          month: parseInt(month),
          totalNews: 0,
          news: [],
        };
      }
    } else {
      data = {
        year: parseInt(year),
        month: parseInt(month),
        totalNews: 0,
        news: [],
      };
    }

    // Cache the result (LRU otomatik TTL)
    cache.archives.set(cacheKey, data);

    console.log(`✅ Archive generated and cached: ${cacheKey}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Get archive by year
function getArchiveByYear(req, res) {
  const { year } = req.params;
  const cacheKey = `archive_${year}`;

  // Check LRU cache (otomatik TTL)
  const cached = cache.archives.get(cacheKey);
  if (cached) {
    console.log(`📦 Cache HIT: Archive ${cacheKey}`);
    return res.json(cached);
  }

  try {
    const summaryFile = path.join(ARCHIVES_DIR, year, "summary.json");

    let data;
    if (fs.existsSync(summaryFile)) {
      try {
        data = JSON.parse(fs.readFileSync(summaryFile, "utf8"));
      } catch (parseError) {
        console.error(`⚠️ Corrupt year summary: ${summaryFile}`, parseError.message);
        data = {
          year: parseInt(year),
          totalNews: 0,
          news: [],
        };
      }
    } else {
      data = {
        year: parseInt(year),
        totalNews: 0,
        news: [],
      };
    }

    // Cache the result (LRU otomatik TTL)
    cache.archives.set(cacheKey, data);

    console.log(`✅ Archive generated and cached: ${cacheKey}`);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getArchiveByDay,
  getArchiveByMonth,
  getArchiveByYear,
};

