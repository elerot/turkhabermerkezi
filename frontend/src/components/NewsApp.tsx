/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar,
  Clock,
  ExternalLink,
  Filter,
  RefreshCw,
  Newspaper,
  ImageIcon,
  CalendarDays,
  Archive,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api";

interface NewsItem {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  created_at: string;
  date_key: string;
  hour_key: string;
  image?: string;
}

interface MonthInfo {
  value: string;
  name: string;
}

interface Pagination {
  current: number;
  total: number;
  count: number;
}

interface Stats {
  total_news: number;
  total_sources: number;
  total_days: number;
  first_news?: string;
  latest_news?: string;
  last_update: string;
}

interface NewsAppProps {
  initialSource?: string;
  initialYear?: string;
  initialMonth?: string;
  initialDay?: string;
  initialPage?: number;
}

export default function NewsApp({
  initialSource = "all",
  initialYear = "all",
  initialMonth = "all",
  initialDay = "all",
  initialPage = 1,
}: NewsAppProps) {
  const router = useRouter();

  // State
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<string[]>([]);
  const [sourceSearch, setSourceSearch] = useState<string>("");
  


  // Hierarchical date filters
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<MonthInfo[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);

  const [selectedSource, setSelectedSource] = useState(initialSource);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [currentPage, setCurrentPage] = useState(initialPage);

  const [pagination, setPagination] = useState<Pagination>({} as Pagination);
  const [stats, setStats] = useState<Stats>({} as Stats);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // URL oluşturma fonksiyonu
  const buildUrl = (
    source: string,
    year: string,
    month: string,
    day: string,
    page: number = 1
  ) => {
    let url = "";

    if (source !== "all") {
      const sourceSlug = source
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      url = `/source/${sourceSlug}`;

      if (year !== "all") {
        url += `/${year}`;
        if (month !== "all") {
          url += `/${month.padStart(2, "0")}`;
          if (day !== "all") {
            url += `/${day.padStart(2, "0")}`;
            if (page > 1) url += `/${page}`;
          }
        }
      }
    } else {
      if (year !== "all") {
        url = `/${year}`;
        if (month !== "all") {
          url += `/${month.padStart(2, "0")}`;
          if (day !== "all") {
            url += `/${day.padStart(2, "0")}`;
            if (page > 1) url += `/${page}`;
          }
        }
      }
    }

    return url || "/";
  };

  // Handle fonksiyonları
  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    setCurrentPage(1);
    setSourceSearch(""); // Search'i temizle
    const url = buildUrl(source, selectedYear, selectedMonth, selectedDay, 1);
    router.push(url);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedMonth("all");
    setSelectedDay("all");
    setCurrentPage(1);
    const url = buildUrl(selectedSource, year, "all", "all", 1);
    router.push(url);
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    setSelectedDay("all");
    setCurrentPage(1);
    const url = buildUrl(selectedSource, selectedYear, month, "all", 1);
    router.push(url);
  };

  const handleDayChange = (day: string) => {
    setSelectedDay(day);
    setCurrentPage(1);
    const url = buildUrl(selectedSource, selectedYear, selectedMonth, day, 1);
    router.push(url);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const url = buildUrl(
      selectedSource,
      selectedYear,
      selectedMonth,
      selectedDay,
      page
    );
    router.push(url);
    fetchNews(page, selectedSource, selectedYear, selectedMonth, selectedDay); // Parametreleri explicit geç
  };

  const handleClearAllFilters = () => {
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = (today.getMonth() + 1).toString();
    const day = today.getDate().toString();

    setSelectedSource("all");
    setSelectedYear(year);
    setSelectedMonth(month);
    setSelectedDay(day);
    setCurrentPage(1);
    setSourceSearch(""); // Search'i temizle

    const url = buildUrl("all", year, month, day, 1);
    router.push(url);
  };

  const handleQuickDateFilter = (
    type: "today" | "yesterday" | "thisMonth" | "thisYear"
  ) => {
    const now = new Date();

    switch (type) {
      case "today":
        const todayYear = now.getFullYear().toString();
        const todayMonth = (now.getMonth() + 1).toString();
        const todayDay = now.getDate().toString();

        setSelectedSource("all");
        setSelectedYear(todayYear);
        setSelectedMonth(todayMonth);
        setSelectedDay(todayDay);
        setCurrentPage(1);
        setSourceSearch(""); // Search'i temizle

        const todayUrl = buildUrl("all", todayYear, todayMonth, todayDay, 1);
        router.push(todayUrl);
        break;

      case "yesterday":
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yYear = yesterday.getFullYear().toString();
        const yMonth = (yesterday.getMonth() + 1).toString();
        const yDay = yesterday.getDate().toString();

        setSelectedSource("all");
        setSelectedYear(yYear);
        setSelectedMonth(yMonth);
        setSelectedDay(yDay);
        setCurrentPage(1);
        setSourceSearch(""); // Search'i temizle

        const yesterdayUrl = buildUrl("all", yYear, yMonth, yDay, 1);
        router.push(yesterdayUrl);
        break;

      case "thisMonth":
        const tmYear = now.getFullYear().toString();
        const tmMonth = (now.getMonth() + 1).toString();

        setSelectedSource("all");
        setSelectedYear(tmYear);
        setSelectedMonth(tmMonth);
        setSelectedDay("all");
        setCurrentPage(1);
        setSourceSearch(""); // Search'i temizle

        const monthUrl = buildUrl("all", tmYear, tmMonth, "all", 1);
        router.push(monthUrl);
        break;

      case "thisYear":
        const tyYear = now.getFullYear().toString();

        setSelectedSource("all");
        setSelectedYear(tyYear);
        setSelectedMonth("all");
        setSelectedDay("all");
        setCurrentPage(1);
        setSourceSearch(""); // Search'i temizle

        const yearUrl = buildUrl("all", tyYear, "all", "all", 1);
        router.push(yearUrl);
        break;
    }
  };

  // Fetch functions
  const fetchNews = async (
    page = 1,
    source = selectedSource,
    year = selectedYear,
    month = selectedMonth,
    day = selectedDay
  ) => {
    setLoading(true);
    try {
      let url = `${API_BASE}/news?page=${page}&limit=30`;
      if (source !== "all") url += `&source=${encodeURIComponent(source)}`;
      if (year !== "all") url += `&year=${year}`;
      if (month !== "all") url += `&month=${month}`;
      if (day !== "all") url += `&day=${day}`;

      console.log("🔍 Fetching news with URL:", url);
      console.log("🔍 Current filters:", { source, year, month, day, page });

      const response = await fetch(url);
      const data = await response.json();
      setNews(data.news || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error("Error fetching news:", error);
    }
    setLoading(false);
  };

  const fetchSources = async () => {
    try {
      const response = await fetch(`${API_BASE}/sources`);
      const data = await response.json();
      setSources(data);
    } catch (error) {
      console.error("❌ Error fetching sources:", error);
    }
  };

  const fetchYears = async () => {
    try {
      const response = await fetch(`${API_BASE}/years`);
      const data = await response.json();
      setAvailableYears(data);
    } catch (error) {
      console.error("Error fetching years:", error);
    }
  };

  const fetchMonths = async (year: string) => {
    if (year === "all") {
      setAvailableMonths([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/months/${year}`);
      const data = await response.json();
      setAvailableMonths(data);
    } catch (error) {
      console.error("Error fetching months:", error);
      setAvailableMonths([]);
    }
  };

  const fetchDays = async (year: string, month: string) => {
    if (year === "all" || month === "all") {
      setAvailableDays([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/days/${year}/${month}`);
      const data = await response.json();
      setAvailableDays(data);
    } catch (error) {
      console.error("Error fetching days:", error);
      setAvailableDays([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };



  // Utility functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFilterSummary = () => {
    const filters = [];
    if (selectedSource !== "all") filters.push(selectedSource);
    if (selectedYear !== "all") {
      let dateFilter = selectedYear;
      if (selectedMonth !== "all") {
        const monthName =
          availableMonths.find((m) => m.value === selectedMonth)?.name ||
          selectedMonth;
        dateFilter += ` ${monthName}`;
        if (selectedDay !== "all") {
          dateFilter += ` ${selectedDay}`;
        }
      }
      filters.push(dateFilter);
    }
    return filters.join(" • ");
  };

  const shouldShowAd = (index: number) => {
    //return (index + 1) % 3 === 0;
    return index === 4; // 0-indexed, yani 5. haber
  };

  // Demo reklam verileri
  const DEMO_ADS = [
    {
      title: "Teknoloji Haberleri",
      description: "En güncel teknoloji haberlerini kaçırmayın!",
      image:
        "https://via.placeholder.com/400x200/3B82F6/FFFFFF?text=DEMO+REKLAM+1",
      link: "#",
      company: "TechNews Pro",
    },
    {
      title: "Ekonomi Analizi",
      description: "Uzman görüşleri ve piyasa analizleri",
      image:
        "https://via.placeholder.com/400x200/10B981/FFFFFF?text=DEMO+REKLAM+2",
      link: "#",
      company: "Finans Merkezi",
    },
    {
      title: "Spor Haberleri",
      description: "Canlı skorlar ve transfer haberleri",
      image:
        "https://via.placeholder.com/400x200/F59E0B/FFFFFF?text=DEMO+REKLAM+3",
      link: "#",
      company: "Spor Arena",
    },
  ];
  // Pagination component'ini tanımla (NewsApp component'inin içinde)
  const PaginationControls = () => {
    if (pagination.total <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <Button
          variant="outline"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          size="sm"
          className="w-full sm:w-auto"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Önceki
        </Button>

        <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-gray-600">
          <span>
            Sayfa {currentPage} / {pagination.total}
          </span>
          <span className="hidden sm:inline">•</span>
          <span>({pagination.count} haber)</span>
        </div>

        <Button
          variant="outline"
          disabled={currentPage === pagination.total}
          onClick={() => handlePageChange(currentPage + 1)}
          size="sm"
          className="w-full sm:w-auto"
        >
          Sonraki
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  };
  // Demo reklam component'i
  const DemoAdCard = ({ position }: { position: number }) => {
    const ad = DEMO_ADS[position % DEMO_ADS.length];

    return (
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden border-2 border-green-400 bg-green-50">
        <div className="relative h-32 sm:h-40 md:h-48 w-full">
          <img
            src={ad.image}
            alt={ad.title}
            className="w-full h-full object-cover rounded-t-lg"
          />

          <div className="absolute top-2 left-2">
            <Badge className="bg-green-600 text-white text-xs">
              DEMO REKLAM
            </Badge>
          </div>

          <div className="absolute top-2 right-2">
            <Badge
              variant="outline"
              className="bg-white text-green-800 text-xs"
            >
              AD-{position}
            </Badge>
          </div>
        </div>

        <CardHeader className="pb-2 px-3 md:px-6">
          <CardTitle className="text-sm md:text-lg leading-tight text-green-800">
            {ad.title}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col pt-0 px-3 md:px-6">
          <CardDescription className="flex-1 text-xs md:text-sm text-green-700 mb-3 md:mb-4">
            {ad.description}
          </CardDescription>

          <div className="mt-auto space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-green-400 text-green-700 hover:bg-green-100"
              onClick={() => {
                alert(`${ad.company} reklamı tıklandı!`);
              }}
            >
              {ad.company} →
            </Button>

            <div className="text-center p-2 bg-green-100 rounded text-xs text-green-600">
              🎯 Localhost Demo | Production&apos;da gerçek reklam gösterilecek
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Production reklam component'i (ileride kullanılacak)
  // Production reklam component'i
  const ProductionAdCard = () => {//{ position }: { position: number }) => {
    useEffect(() => {
      try {
        // AdSense script'i yükle
        if (typeof window !== "undefined" && !(window as any).adsbygoogle) {
          const script = document.createElement("script");
          script.async = true;
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`;
          script.crossOrigin = "anonymous";
          document.head.appendChild(script);
        }

        // AdSense reklam push
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push(
          {}
        );
      } catch (err) {
        console.error("AdSense error:", err);
      }
    }, []);

    return (
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
        <div className="relative h-48 w-full bg-gray-100">
          <ins
            className="adsbygoogle"
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              backgroundColor: "#f5f5f5",
            }}
            data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
            data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />

          {/* Production indicator */}
          <div className="absolute top-2 right-2">
            <Badge className="bg-blue-600 text-white text-xs">REKLAM</Badge>
          </div>
        </div>
      </Card>
    );
  };

  // Ana reklam component'i (environment'a göre demo/production seçer)
  const AdCard = ({ position }: { position: number }) => {
    const [isProduction, setIsProduction] = useState(false);

    useEffect(() => {
      // Environment kontrolü
      const env = process.env.NEXT_PUBLIC_ENVIRONMENT;
      const hostname = window.location.hostname;

      //console.log("Environment:", env);
      //console.log("Hostname:", hostname);

      setIsProduction(env === "production" && hostname !== "localhost");
    }, []);
    if (isProduction) {
      return <ProductionAdCard />//position={position} />;
    } else {
      return <ProductionAdCard />//position={position} />;
    }
  };

  useEffect(() => {
    // İlk yüklemede sadece metadata'ları çek
    fetchSources();
    fetchYears();
    fetchStats();
    // fetchNews burada YOK - props useEffect'i çekecek
  }, []);

  useEffect(() => {
    // Ay listesini güncelle
    fetchMonths(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    // Gün listesini güncelle
    fetchDays(selectedYear, selectedMonth);
  }, [selectedYear, selectedMonth]);

  // Basit çözüm - her props değişiminde haberleri çek
  useEffect(() => {
    console.log("🔍 Props changed, updating state and fetching news:", {
      initialSource,
      initialYear,
      initialMonth,
      initialDay,
      initialPage,
    });

    setSelectedSource(initialSource);
    setSelectedYear(initialYear);
    setSelectedMonth(initialMonth);
    setSelectedDay(initialDay);
    setCurrentPage(initialPage);

    // Direkt fetch et - timeout yok
    console.log("🔍 Fetching news immediately");
    fetchNews(
      initialPage,
      initialSource,
      initialYear,
      initialMonth,
      initialDay
    );
  }, [initialSource, initialYear, initialMonth, initialDay, initialPage]);

  // Loading state
  if (loading && news.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Haberler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 md:space-x-4">
              <Newspaper className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              <h1 className="text-lg md:text-2xl font-bold text-gray-900">
                <span className="block md:hidden">Haberler</span>
                <span className="hidden md:block">Haber Merkezi</span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 md:space-x-4">
              <Button
                onClick={() => fetchNews(1)}
                disabled={loading}
                size="sm"
                className="flex items-center space-x-1 md:space-x-2"
              >
                {loading ? (
                  <RefreshCw className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 md:h-4 md:w-4" />
                )}
                <span className="hidden sm:inline">Güncelle</span>
              </Button>
              
              {stats.total_news && (
                <Badge
                  variant="secondary"
                  className="text-xs md:text-sm hidden sm:flex"
                >
                  {stats.total_news} Haber
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Enhanced Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Filtreler</h2>
            </div>
            {getFilterSummary() && (
              <Badge variant="outline" className="text-sm">
                <Archive className="h-3 w-3 mr-1" />
                {getFilterSummary()}
              </Badge>
            )}
          </div>

          {/* Mobile collapse filter */}
          <div className="block md:hidden mb-4">
            <Button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              variant="outline"
              className="w-full flex items-center justify-between"
            >
              <span className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filtreler {getFilterSummary() && `(${getFilterSummary()})`}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${mobileFiltersOpen ? "rotate-180" : ""
                  }`}
              />
            </Button>
          </div>

          <div
            className={`grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 ${mobileFiltersOpen ? "block" : "hidden md:grid"
              }`}
          >
            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Haber Kaynağı
              </label>
              <Select value={selectedSource} onValueChange={handleSourceChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kaynak seçin" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <input
                      type="text"
                      placeholder="Kaynak ara..."
                      value={sourceSearch}
                      onChange={(e) => setSourceSearch(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <SelectItem value="all">Tümü</SelectItem>
                  {sources.length === 0 ? (
                    <SelectItem value="loading" disabled>
                      Kaynaklar yükleniyor... ({sources.length})
                    </SelectItem>
                  ) : (
                    sources
                      .filter(source => 
                        source.toLowerCase().includes(sourceSearch.toLowerCase())
                      )
                      .map((source) => (
                        <SelectItem key={source} value={source}>
                          {source}
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tarih Filtreleri
              </label>
              <div className="flex space-x-2">
                {/* Year Filter */}
                <Select
                  value={selectedYear}
                  onValueChange={handleYearChange}
                  disabled={sources.length === 0}
                >
                  <SelectTrigger className="w-20 text-sm">
                    <SelectValue placeholder="Yıl" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {availableYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Month Filter */}
                <Select
                  value={selectedMonth}
                  onValueChange={handleMonthChange}
                  disabled={selectedYear === "all"}
                >
                  <SelectTrigger className="w-32 text-sm">
                    <SelectValue placeholder="Ay" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {availableMonths.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Day Filter */}
                <Select
                  value={selectedDay}
                  onValueChange={handleDayChange}
                  disabled={selectedYear === "all" || selectedMonth === "all"}
                >
                  <SelectTrigger className="w-20 text-sm">
                    <SelectValue placeholder="Gün" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {availableDays.map((day) => (
                      <SelectItem key={day} value={day}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Clear Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearAllFilters}
                  className="px-3"
                >
                  ✕
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Date Filters */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                Hızlı Tarih Seçimi:
              </span>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateFilter("today")}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Bugün
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateFilter("yesterday")}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <Clock className="h-3 w-3 mr-1" />
                Dün
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateFilter("thisMonth")}
                className="hover:bg-green-50 hover:border-green-300"
              >
                <CalendarDays className="h-3 w-3 mr-1" />
                Bu Ay
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateFilter("thisYear")}
                className="hover:bg-purple-50 hover:border-purple-300"
              >
                <Archive className="h-3 w-3 mr-1" />
                Bu Yıl
              </Button>
            </div>
          </div>
        </div>

        {/* News Results Summary */}
        {!loading && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                {pagination.count > 0 ? (
                  <>
                    <strong>{pagination.count}</strong> haber bulundu
                    {getFilterSummary() && (
                      <span>
                        {" "}
                        • Filtre: <strong>{getFilterSummary()}</strong>
                      </span>
                    )}
                  </>
                ) : (
                  "Seçilen kriterlerde haber bulunamadı"
                )}
              </div>

              {pagination.count > 0 && (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="text-sm text-gray-500">
                    Sayfa {currentPage} / {pagination.total}
                  </div>

                  {/* ÜST PAGİNATİON - kompakt versiyon */}
                  {pagination.total > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => handlePageChange(currentPage - 1)}
                        size="sm"
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="outline"
                        disabled={currentPage === pagination.total}
                        onClick={() => handlePageChange(currentPage + 1)}
                        size="sm"
                        className="h-8 px-2"
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* News Grid */}
        {news.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">
              Seçilen kriterlerde haber bulunamadı.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Filtreleri değiştirmeyi deneyin veya daha geniş tarih aralığı
              seçin.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
              {news
                .map((article, index) => {
                  const items = [];

                  // Add the news card
                  items.push(
                    <Card
                      key={article.id}
                      className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden"
                    >
                      {/* Image Section */}
                      <div className="relative h-32 sm:h-40 md:h-48 w-full bg-gray-200">
                        {article.image ? (
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center bg-gray-100">
                                  <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                                  </svg>
                                </div>
                              `;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}

                        {/* Source badge overlay */}
                        <div className="absolute top-2 left-2">
                          <Badge className="text-xs bg-white/90 backdrop-blur-sm text-gray-800 px-1 py-0.5">
                            <span className="block sm:hidden">
                              {article.source.split(" ")[0]}
                            </span>
                            <span className="hidden sm:block">
                              {article.source}
                            </span>
                          </Badge>
                        </div>

                        {/* Date overlay */}
                        <div className="absolute top-2 right-2">
                          <div className="flex items-center text-xs text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(article.pubDate).toLocaleDateString(
                              "tr-TR"
                            )}
                          </div>
                        </div>
                      </div>

                      <CardHeader className="pb-2 px-3 md:px-6">
                        <CardTitle className="text-sm md:text-lg leading-tight line-clamp-2 md:line-clamp-3">
                          {article.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="flex-1 flex flex-col pt-0 px-3 md:px-6">
                        <CardDescription className="flex-1 text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2 md:line-clamp-3">
                          {article.description}
                        </CardDescription>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              Detaylı Oku
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              {article.image && (
                                <div className="mb-4 -mx-6 -mt-6">
                                  <img
                                    src={article.image}
                                    alt={article.title}
                                    className="w-full h-64 object-cover"
                                    onError={(e) => {
                                      const target =
                                        e.target as HTMLImageElement;
                                      target.style.display = "none";
                                    }}
                                  />
                                </div>
                              )}

                              <div className="flex items-center justify-between mb-3">
                                <Badge variant="outline">
                                  {article.source}
                                </Badge>
                                <div className="flex items-center text-sm text-gray-500">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(article.pubDate)}
                                </div>
                              </div>
                              <DialogTitle className="text-xl leading-tight">
                                {article.title}
                              </DialogTitle>
                            </DialogHeader>

                            <div className="space-y-4">
                              <p className="text-gray-700 leading-relaxed">
                                {article.description}
                              </p>

                              <div className="border-t pt-4">
                                <Button asChild className="w-full">
                                  <a
                                    href={article.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Orijinal Haberi Oku
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  );

                  // Add ad card after every 3rd news item
                  if (shouldShowAd(index)) {
                    const adPosition = Math.floor((index + 1) / 3);
                    items.push(
                      <AdCard key={`ad-${adPosition}`} position={adPosition} />
                    );
                  }

                  return items;
                })
                .flat()}
            </div>

            {/* ALT PAGINATION */}
            <PaginationControls />
          </>
        )}
      </div>
    </div>
  );
}
