const fs = require("fs");
const path = require("path");
const { ARCHIVES_DIR } = require("../config/constants");
const { getMetadataFromCache } = require("../services/cache/manager");
const { getFeeds } = require("../services/rss/feeds");
const { createTurkishSlug } = require("../utils/slugify");
const { getDateKey } = require("../utils/dateHelper");

// Robots.txt
function getRobotsTxt(req, res) {
  res.set("Content-Type", "text/plain");
  res.send(`User-agent: *
Allow: /

Sitemap: https://www.saatdakika.com/api/sitemap.xml`);
}

// Dynamic sitemap.xml generator
function getSitemapXml(req, res) {
  try {
    console.log(`🔄 sitemap.xml yaratılıyor...`);
    const currentDate = new Date().toISOString().split("T")[0];
    const metadata = getMetadataFromCache();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <!-- Ana sayfa (bugüne redirect) -->
  <url>
    <loc>https://www.saatdakika.com</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
`;

    // Yıllar (/2025, /2024, etc.)
    if (metadata.years) {
      metadata.years.forEach((year) => {
        sitemap += `  <url>
    <loc>https://www.saatdakika.com/${year}</loc>
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
    <loc>https://www.saatdakika.com/${year}/${month}</loc>
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
                      return day.padStart(2, "0");
                    })
                    .sort()
                    .reverse();

                  days.forEach((day) => {
                    // Ana günlük sayfa
                    sitemap += `  <url>
    <loc>https://www.saatdakika.com/${year}/${month}/${day}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
`;

                    // Pagination sayfaları (varsayılan olarak 2-5 sayfa ekle)
                    for (let page = 2; page <= 5; page++) {
                      sitemap += `  <url>
    <loc>https://www.saatdakika.com/${year}/${month}/${day}/${page}</loc>
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
    const feeds = getFeeds();
    const popularSources = feeds.slice(0, 10).map(feed => feed.name);

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
    <loc>https://www.saatdakika.com/source/${sourceSlug}/${year}/${month}/${day}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
`;

        // Kaynak pagination (varsayılan olarak 2-3 sayfa ekle)
        for (let page = 2; page <= 3; page++) {
          sitemap += `  <url>
    <loc>https://www.saatdakika.com/source/${sourceSlug}/${year}/${month}/${day}/${page}</loc>
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
}

module.exports = {
  getRobotsTxt,
  getSitemapXml,
};

