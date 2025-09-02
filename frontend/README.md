# Turkish News Frontend

A modern, responsive news aggregation frontend built with Next.js, TypeScript, and Tailwind CSS. This application serves as the frontend for SaatDakika.com, a Turkish news aggregation platform that collects and displays news from multiple RSS sources.

## 🚀 Features

- **News Aggregation**: Collects news from multiple RSS feeds and displays them in a unified interface
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **Advanced Filtering**: Filter news by source, date (year/month/day), and category
- **Pagination**: Efficient news browsing with paginated results
- **Real-time Updates**: Dynamic content with no-cache strategy for fresh news
- **SEO Optimized**: Built-in SEO features with dynamic metadata generation
- **Analytics Integration**: Google Analytics and Google AdSense support
- **Modern UI Components**: Built with shadcn/ui components and Lucide icons

## 🛠️ Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom CSS variables
- **UI Components**: shadcn/ui component library
- **Icons**: Lucide React
- **State Management**: React hooks (useState, useEffect)
- **Build Tool**: Vite (configured for Next.js)
- **Linting**: ESLint with TypeScript support

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [year]/            # Dynamic year routes
│   │   ├── [month]/           # Dynamic month routes
│   │   ├── [day]/             # Dynamic day routes
│   │   ├── source/            # Source-based news routes
│   │   ├── globals.css        # Global styles and Tailwind config
│   │   ├── layout.tsx         # Root layout component
│   │   └── page.tsx           # Homepage with auto-redirect
│   ├── components/
│   │   ├── NewsApp.tsx        # Main news application component
│   │   └── ui/                # shadcn/ui components
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       └── tabs.tsx
│   └── lib/
│       └── utils.ts           # Utility functions
├── public/                     # Static assets
├── components.json             # shadcn/ui configuration
├── next.config.ts             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd turkish-news-project/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the frontend directory:
   ```env
   NEXT_PUBLIC_ENVIRONMENT=development
   NEXT_PUBLIC_ADSENSE_CLIENT=your-adsense-client-id
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## 🎨 UI Components

The project uses shadcn/ui components for consistent design:

- **Card**: News article display
- **Button**: Interactive elements
- **Badge**: Category and source labels
- **Dialog**: Modal windows for detailed views
- **Select**: Dropdown filters
- **Tabs**: Organized content sections
- **Input**: Search and form inputs

## 🔧 Configuration

### Tailwind CSS
Custom CSS variables and design tokens are defined in `globals.css` with support for:
- Light/dark theme variants
- Custom color palette
- Responsive breakpoints
- Component-specific styling

### shadcn/ui
Configured with:
- New York style variant
- Slate base color
- CSS variables enabled
- Custom component aliases

### TypeScript
Strict mode enabled with:
- ES2017 target
- Next.js plugin support
- Path aliases (`@/*` for `src/*`)
- JSON module resolution

## 🌐 API Integration

The frontend connects to a backend API for news data:
- **Base URL**: `http://localhost:3001/api`
- **Endpoints**: News articles, statistics, filtering
- **Data Format**: JSON with pagination support

## 📊 Features in Detail

### News Display
- Article cards with title, description, and metadata
- Source attribution and publication dates
- External link handling
- Image support (when available)

### Filtering System
- **Source Filter**: Filter by specific news sources
- **Date Filter**: Year/month/day hierarchical filtering
- **Category Filter**: News categorization
- **Search**: Text-based article search

### Pagination
- Configurable page sizes
- Navigation controls
- Current page indicators
- Total count display

### Statistics Dashboard
- Total news count
- Today's news count
- Active sources count
- Last update timestamp

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run preview
```

### Environment Variables for Production
```env
NEXT_PUBLIC_ENVIRONMENT=production
NEXT_PUBLIC_ADSENSE_CLIENT=your-production-adsense-id
```

## 🔍 SEO Features

- Dynamic metadata generation
- Turkish language support (`lang="tr"`)
- Open Graph tags
- Robots meta directives
- Cache control headers

## 📱 Responsive Design

- Mobile-first approach
- Responsive breakpoints
- Touch-friendly interactions
- Adaptive layouts for all screen sizes

## 🧪 Development

### Code Quality
- ESLint configuration for React and TypeScript
- Prettier formatting (recommended)
- TypeScript strict mode
- Component-based architecture

### Performance
- Dynamic imports
- Image optimization
- CSS-in-JS with Tailwind
- Bundle optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run linting: `npm run lint`
5. Submit a pull request

## 📄 License

This project is part of the Turkish News Project. See the main project README for license information.

## 🆘 Support

For support and questions:
- Check the main project documentation
- Review the backend API documentation
- Open an issue in the repository

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
