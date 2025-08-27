# Turkish News Backend

A high-performance Node.js backend service for aggregating and serving Turkish news from multiple RSS feeds with intelligent caching, hierarchical archiving, and real-time updates.

## 🚀 Features

- **RSS Feed Aggregation**: Automatically fetches news from multiple Turkish news sources
- **Smart Caching System**: Multi-layer caching for optimal performance
- **Hierarchical Archives**: Organized news storage by year/month/day structure
- **Real-time Updates**: Scheduled RSS fetching every 5 minutes
- **RESTful API**: Comprehensive endpoints for news retrieval and management
- **Image Extraction**: Automatic image extraction from RSS content
- **Duplicate Prevention**: Hash-based duplicate detection
- **Sitemap Generation**: Automatic XML sitemap generation
- **Performance Monitoring**: Cache status and statistics endpoints

## 📋 Supported News Sources

The backend aggregates news from various Turkish news sources including:

- **TRT Haber**: Manşet, Son Dakika, Gündem, Ekonomi, Spor
- **Habertürk**: Genel, Manşet, Ekonomi, Spor, Magazin, Medya, Kadın, Siyaset, Tatil
- **And more...** (configurable via `rss-feeds.json`)

## 🏗️ Architecture

```
backend/
├── server.js          # Main server application
├── package.json       # Dependencies and scripts
├── data/             # Data storage directory
│   ├── news.json     # Main news database
│   ├── rss-feeds.json # RSS feed configuration
│   └── archives/     # Hierarchical archive structure
│       ├── 2025/     # Year-based organization
│       ├── 2024/     # Month-based subdirectories
│       └── ...       # Day-based JSON files
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure RSS feeds** (optional)
   - Edit `data/rss-feeds.json` to add/remove news sources
   - Set `aktif: true/false` to enable/disable feeds
   - Adjust `priority` values for feed processing order

4. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## ⚙️ Configuration

### Environment Variables
- `PORT`: Server port (default: 3001)

### RSS Feed Configuration
The `rss-feeds.json` file controls which news sources are active:

```json
{
  "kaynak": "TRT Haber",
  "kategori": "Manşet",
  "url": "https://www.trthaber.com/manset_articles.rss",
  "aktif": true,
  "priority": 1
}
```

- `kaynak`: News source name
- `kategori`: News category
- `url`: RSS feed URL
- `aktif`: Whether the feed is active
- `priority`: Processing priority (lower numbers = higher priority)

## 📡 API Endpoints

### News Retrieval
- `GET /api/news` - Get paginated news with filtering
- `GET /api/news?source=TRT%20Haber` - Filter by source
- `GET /api/news?year=2025&month=01&day=15` - Filter by date
- `GET /api/news?page=2&limit=20` - Pagination support

### Metadata
- `GET /api/sources` - Get available news sources
- `GET /api/years` - Get available years
- `GET /api/months/:year` - Get months for a specific year
- `GET /api/days/:year/:month` - Get days for a specific month

### Statistics & Monitoring
- `GET /api/stats` - General statistics
- `GET /api/cache-status` - Cache performance metrics

### Management
- `POST /api/refresh` - Manually refresh RSS feeds
- `POST /api/clear-cache` - Clear all caches
- `GET /api/rss-feeds` - Get RSS feed configuration
- `POST /api/reload-feeds` - Reload RSS feed configuration

### SEO & Sitemaps
- `GET /sitemap.xml` - XML sitemap for search engines

## 🧠 Caching System

The backend implements a sophisticated multi-layer caching system:

- **Today's News Cache**: 5-minute TTL for current day news
- **API Response Cache**: 2-minute TTL for API responses
- **Archive Cache**: 30-minute TTL for archive data
- **Metadata Cache**: 10-minute TTL for sources, years, etc.

### Cache Management
- Automatic cache invalidation when new news arrives
- Scheduled cache cleanup every hour
- Manual cache clearing via API endpoint
- Real-time cache status monitoring

## 📁 Archive Structure

News is automatically organized into a hierarchical archive structure:

```
archives/
├── 2025/
│   ├── 01/           # January
│   │   ├── 15.json   # January 15th news
│   │   ├── 16.json   # January 16th news
│   │   └── summary.json
│   ├── 02/           # February
│   └── summary.json  # Year summary
├── 2024/
└── ...
```

Each month includes a `summary.json` with metadata about available days and news counts.

## 🔄 Scheduled Tasks

- **RSS Fetching**: Every 5 minutes (`*/5 * * * *`)
- **Cache Cleanup**: Every hour (`0 * * * *`)
- **Initial Fetch**: 5 seconds after server startup

## 📊 Performance Features

- **Smart Duplicate Detection**: MD5 hash-based content deduplication
- **Efficient Filtering**: Optimized news filtering and pagination
- **Memory Management**: Automatic cleanup of expired cache entries
- **File Watching**: Optional RSS feed configuration monitoring

## 🚨 Error Handling

- Graceful RSS feed error handling
- Automatic retry mechanisms
- Comprehensive error logging
- Fallback to cached data when feeds fail

## 📈 Monitoring & Debugging

### Cache Status
```bash
GET /api/cache-status
```

### Statistics
```bash
GET /api/stats
```

### Manual Operations
```bash
# Refresh RSS feeds
POST /api/refresh

# Clear cache
POST /api/clear-cache

# Reload RSS configuration
POST /api/reload-feeds
```

## 🔧 Development

### Scripts
- `npm start`: Start production server
- `npm run dev`: Start development server with nodemon

### Dependencies
- **express**: Web framework
- **cors**: Cross-origin resource sharing
- **rss-parser**: RSS feed parsing
- **node-cron**: Scheduled task management
- **nodemon**: Development auto-reload (dev dependency)

## 🌐 Production Deployment

1. **Set environment variables**
   ```bash
   export PORT=3001
   ```

2. **Start the server**
   ```bash
   npm start
   ```

3. **Monitor logs** for RSS feed status and cache performance

4. **Use process manager** (PM2, Docker, etc.) for production deployment

## 📝 Data Format

### News Article Structure
```json
{
  "id": 1704067200000.123,
  "title": "Article Title",
  "link": "https://example.com/article",
  "description": "Article description...",
  "pubDate": "2025-01-01T00:00:00.000Z",
  "source": "TRT Haber",
  "category": "Manşet",
  "content_hash": "md5_hash",
  "created_at": "2025-01-01T00:00:00.000Z",
  "date_key": "2025-01-01",
  "hour_key": "2025-01-01T00",
  "image": "https://example.com/image.jpg"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC License

## 🆘 Support

For issues and questions:
1. Check the API endpoints documentation
2. Review server logs for error messages
3. Check cache status via `/api/cache-status`
4. Verify RSS feed configuration in `data/rss-feeds.json`

---

**Built with ❤️ for Turkish news aggregation**
