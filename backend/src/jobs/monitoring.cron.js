const cron = require("node-cron");

// Memory monitoring every minute
function startMemoryMonitoring() {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    if (memMB > 500) { // 500MB'den fazla ise uyar
      console.warn(`⚠️ High memory usage: ${memMB}MB`);
    }
  }, 60000); // Her dakika kontrol et
}

module.exports = {
  startMemoryMonitoring,
};

