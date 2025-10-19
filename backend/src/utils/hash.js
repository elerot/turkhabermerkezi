const crypto = require("crypto");

// Generate MD5 hash from title and link
function generateHash(title, link) {
  return crypto
    .createHash("md5")
    .update(title + link)
    .digest("hex");
}

// Generate optimized cache key for API requests - HASH BASED
function generateCacheKey(req) {
  // Sort query parameters for consistent hashing
  const params = { ...req.query };
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
  
  // Create MD5 hash (32 karakter) - çok daha kısa ve hızlı
  const paramsString = JSON.stringify(sortedParams);
  const hash = crypto.createHash('md5').update(paramsString).digest('hex');
  
  // Debugging için readable prefix ekle (isteğe bağlı)
  const readablePrefix = `p${params.page || 1}_l${params.limit || 30}`;
  
  return `${readablePrefix}_${hash}`;
}

module.exports = {
  generateHash,
  generateCacheKey,
};

