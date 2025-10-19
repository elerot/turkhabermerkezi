const { LRUCache } = require("lru-cache");
const { LRU_CONFIG } = require("./constants");

// 🚀 SMART CACHE SYSTEM - WITH LRU
const cache = {
  // Today's news cache
  todayNews: {
    data: null,
    lastUpdate: null,
    key: null, // today's date key for validation
    hits: 0,
    misses: 0,
  },

  // API responses cache - LRU optimized
  responses: new LRUCache({
    ...LRU_CONFIG.API_RESPONSES,
    dispose: (value, key) => {
      console.log(`🗑️ API Cache evicted: ${key.substring(0, 50)}...`);
    }
  }),
  
  apiStats: {
    hits: 0,
    misses: 0,
  },

  // Archive cache - LRU optimized with size limit
  archives: new LRUCache({
    ...LRU_CONFIG.ARCHIVES,
    sizeCalculation: (value) => {
      return JSON.stringify(value).length;
    },
    dispose: (value, key) => {
      console.log(`🗑️ Archive Cache evicted: ${key}`);
    }
  }),

  // Metadata cache
  metadata: {
    sources: null,
    years: null,
    dates: null,
    lastUpdate: null,
  },
};

module.exports = cache;

