const { ALLOWED_ORIGINS } = require("./constants");

// CORS güvenliği
const corsOptions = {
  origin: function (origin, callback) {
    // Origin yoksa (Postman, curl gibi) veya izin verilen listede ise kabul et
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`🚫 CORS blocked request from: ${origin}`);
      callback(new Error('CORS policy violation: Origin not allowed'));
    }
  },
  credentials: true, // Cookie ve authorization header'ları için
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// SEO endpoints için açık CORS
const seoCorsOptions = {
  origin: true, // Tüm originlere izin ver
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
};

module.exports = {
  corsOptions,
  seoCorsOptions,
};

