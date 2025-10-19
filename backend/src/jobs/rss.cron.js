const cron = require("node-cron");
const { fetchNews } = require("../services/rss/fetcher");

// Schedule RSS fetching every 5 minutes
function startRSSCron() {
  cron.schedule("*/5 * * * *", () => {
    console.log("⏰ Zamanlanmış RSS güncellemesi başladı...");
    fetchNews();
  });
  
  console.log("📡 RSS beslemeleri her 5 dakikada bir güncellenecek");
}

module.exports = { startRSSCron };

