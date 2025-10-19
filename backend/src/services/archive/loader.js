const fs = require("fs");
const path = require("path");
const { ARCHIVES_DIR } = require("../../config/constants");
const { getTodayKey } = require("../../utils/dateHelper");

// Load today's news from archive files
function loadTodayNewsFromArchive() {
  try {
    const todayKey = getTodayKey();
    const [year, month, day] = todayKey.split("-");
    const todayArchiveFile = path.join(
      ARCHIVES_DIR,
      year,
      month,
      `${day}.json`
    );

    if (fs.existsSync(todayArchiveFile)) {
      const data = fs.readFileSync(todayArchiveFile, "utf8");
      const todayNews = JSON.parse(data);
      console.log(`✅ Bugün için ${todayNews.length} haber yüklendi`);
      return todayNews;
    } else {
      console.log("🆕 Bugün için henüz haber yok");
      return [];
    }
  } catch (error) {
    console.error("❌ Bugünün haberlerini yükleme hatası:", error);
    return [];
  }
}

module.exports = {
  loadTodayNewsFromArchive,
};

