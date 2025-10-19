const Parser = require("rss-parser");
const { cleanText } = require("../../utils/textCleaner");
const { generateHash } = require("../../utils/hash");
const { getDateKey, getHourKey } = require("../../utils/dateHelper");
const { extractImageFromRSS } = require("../../utils/imageExtractor");
const { classifyCategory } = require("../category/classifier");

const parser = new Parser();

// Parse single RSS feed
async function parseFeed(feed) {
  try {
    console.log(`🔄 ${feed.name} kontrol ediliyor...`);
    const rss = await parser.parseURL(feed.url);
    
    if (!rss || !rss.items) {
      console.warn(`⚠️ ${feed.name}: RSS items bulunamadı`);
      return [];
    }

    const articles = [];

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
      const articleCategory = classifyCategory(item, feed.category);

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

      articles.push(article);
    }

    return articles;
  } catch (error) {
    console.error(`❌ ${feed.name} hatası:`, error.message);
    return [];
  }
}

module.exports = { parseFeed };

