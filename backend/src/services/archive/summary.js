const fs = require("fs");
const path = require("path");
const { ARCHIVES_DIR } = require("../../config/constants");

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
          try {
            const dayData = JSON.parse(fs.readFileSync(dayFile, "utf8"));
            totalNews += dayData.length;
            allNews.push(...dayData);
          } catch (parseError) {
            console.warn(`⚠️ Skipping corrupt file in summary: ${dayFile}`);
          }
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
          try {
            const monthSummary = JSON.parse(fs.readFileSync(monthSummaryFile, "utf8"));
            yearTotalNews += monthSummary.totalNews || 0;
          } catch (parseError) {
            console.warn(`⚠️ Skipping corrupt summary: ${monthSummaryFile}`);
          }
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

module.exports = {
  getTopSources,
  updateArchiveSummaries,
};

