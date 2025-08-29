/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect, useRef } from "react";
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
  const [iframeLoadingStates, setIframeLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [iframeErrorStates, setIframeErrorStates] = useState<{ [key: string]: boolean }>({});



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

    // Source seçildiğinde source segment'ini ekle
    if (source !== "all") {
      const sourceSlug = createTurkishSlug(source);
      url = `/source/${sourceSlug}`;
    }

    // Tarih parametrelerini ekle (source'dan bağımsız olarak)
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

    return url || "/";
  };

  // Türkçe karakterleri koruyan slug oluşturma fonksiyonu
  const createTurkishSlug = (text: string) => {
    const turkishCharMap: { [key: string]: string } = {
      'ç': 'c', 'Ç': 'C',
      'ğ': 'g', 'Ğ': 'G',
      'ı': 'i', 'I': 'I',
      'İ': 'I', 'i': 'i',
      'ö': 'o', 'Ö': 'O',
      'ş': 's', 'Ş': 'S',
      'ü': 'u', 'Ü': 'U'
    };

    let slug = text;

    // Türkçe karakterleri değiştir
    Object.keys(turkishCharMap).forEach(char => {
      slug = slug.replace(new RegExp(char, 'g'), turkishCharMap[char]);
    });

    // Küçük harfe çevir ve URL-friendly yap
    return slug
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
  };

  // Handle fonksiyonları
  const handleSourceChange = (source: string) => {
    setSelectedSource(source);
    setCurrentPage(1);
    setSourceSearch(""); // Search'i temizle
    // Yeni source değerini kullan, diğerleri mevcut state'ten al
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
    // NaN kontrolü
    const safePage = isNaN(page) || page < 1 ? 1 : page;

    setCurrentPage(safePage);
    const url = buildUrl(
      selectedSource,
      selectedYear,
      selectedMonth,
      selectedDay,
      safePage
    );
    router.push(url);
    //fetchNews(safePage); // Sadece page parametresi geç, diğerleri state'ten alınır
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

  const handleIframeLoad = (articleId: string) => {
    setIframeLoadingStates(prev => ({
      ...prev,
      [articleId]: false
    }));
  };

  const handleIframeError = (articleId: string) => {
    setIframeLoadingStates(prev => ({
      ...prev,
      [articleId]: false
    }));
    setIframeErrorStates(prev => ({
      ...prev,
      [articleId]: true
    }));
  };

  const handleIframeOpen = (articleId: string) => {
    setIframeLoadingStates(prev => ({
      ...prev,
      [articleId]: true
    }));
    setIframeErrorStates(prev => ({
      ...prev,
      [articleId]: false
    }));

    // 15 saniye sonra hala loading ise error olarak işaretle
    setTimeout(() => {
      setIframeLoadingStates(prev => {
        if (prev[articleId]) {
          setIframeErrorStates(prevError => ({
            ...prevError,
            [articleId]: true
          }));
          return { ...prev, [articleId]: false };
        }
        return prev;
      });
    }, 15000);
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
  const fetchNews = async (page = 1) => {
    // NaN kontrolü - page NaN ise 1 kullan
    const safePage = isNaN(page) || page < 1 ? 1 : page;

    setLoading(true);
    try {
      let url = `${API_BASE}/news?page=${safePage}&limit=30`;
      if (selectedSource !== "all") url += `&source=${encodeURIComponent(selectedSource)}`;
      if (selectedYear !== "all") url += `&year=${selectedYear}`;
      if (selectedMonth !== "all") url += `&month=${selectedMonth}`;
      if (selectedDay !== "all") url += `&day=${selectedDay}`;



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

  // Production reklam component'i
  const ProductionAdCard = () => {
    const [adLoaded, setAdLoaded] = useState(false);
    const [adError, setAdError] = useState(false);
    const adContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      // Check if AdSense is properly configured
      if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT) {
        console.warn("AdSense client ID not configured");
        setAdError(true);
        return;
      }

      if (!process.env.NEXT_PUBLIC_ADSENSE_SLOT) {
        console.warn("AdSense slot ID not configured");
        setAdError(true);
        return;
      }

      let timeoutId: NodeJS.Timeout;
      let retryCount = 0;
      const maxRetries = 5;

      const initializeAd = () => {
        try {
          // DOM container'ın hazır olduğundan emin ol
          if (!adContainerRef.current) {
            console.warn("Ad container not ready, retrying...");
            if (retryCount < maxRetries) {
              retryCount++;
              timeoutId = setTimeout(initializeAd, 1000);
            } else {
              setAdError(true);
            }
            return;
          }

          // Wait for AdSense to be available
          if (typeof window !== "undefined" && (window as any).adsbygoogle) {
            try {
              // Container'ı temizle ve yeniden oluştur
              if (adContainerRef.current) {
                adContainerRef.current.innerHTML = `
                  <ins class="adsbygoogle"
                       style="display:block"
                       data-ad-client="${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}"
                       data-ad-slot="${process.env.NEXT_PUBLIC_ADSENSE_SLOT}"
                       data-ad-format="auto"
                       data-full-width-responsive="true"></ins>
                `;

                // Push the ad with proper error handling
                ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                setAdLoaded(true);
              }
            } catch (err) {
              console.error("AdSense push error:", err);
              if (retryCount < maxRetries) {
                retryCount++;
                timeoutId = setTimeout(initializeAd, 2000);
              } else {
                setAdError(true);
              }
            }
          } else {
            console.warn("AdSense not available, retrying...");
            if (retryCount < maxRetries) {
              retryCount++;
              timeoutId = setTimeout(initializeAd, 1000);
            } else {
              setAdError(true);
            }
          }
        } catch (err) {
          console.error("Ad initialization error:", err);
          if (retryCount < maxRetries) {
            retryCount++;
            timeoutId = setTimeout(initializeAd, 2000);
          } else {
            setAdError(true);
          }
        }
      };

      // DOM hazır olduktan sonra başlat
      const startInitialization = () => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initializeAd);
        } else {
          initializeAd();
        }
      };

      startInitialization();

      // Cleanup function
      return () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        document.removeEventListener('DOMContentLoaded', initializeAd);
      };
    }, []);

    // If there's an error, show a fallback
    if (adError) {
      const isConfigError = !process.env.NEXT_PUBLIC_ADSENSE_CLIENT || !process.env.NEXT_PUBLIC_ADSENSE_SLOT;
      return (
        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
          <div className="relative h-48 w-full bg-gray-100 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-gray-500 text-sm mb-2">
                {isConfigError ? "AdSense yapılandırılmamış" : "Reklam yüklenemedi"}
              </div>
              <Badge variant="outline" className="text-xs">
                {isConfigError ? "Yapılandırma Hatası" : "Teknik Sorun"}
              </Badge>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
        <div className="relative h-48 w-full bg-gray-100">
          {/* AdSense container - ref ile kontrol ediliyor */}
          <div
            ref={adContainerRef}
            className="w-full h-full"
            style={{
              backgroundColor: "#f5f5f5",
              minHeight: "192px" // 48 * 4 = 192px (h-48)
            }}
          />

          {/* Production indicator */}
          <div className="absolute top-2 right-2">
            <Badge className="bg-blue-600 text-white text-xs">
              {adLoaded ? "REKLAM" : "YÜKLENİYOR..."}
            </Badge>
          </div>
        </div>
      </Card>
    );
  };

  // Yandex reklam component'i
  const YandexAdCard = ({ onError }: { onError?: () => void }) => {
    const [adLoaded, setAdLoaded] = useState(false);
    const [adError, setAdError] = useState(false);

    useEffect(() => {
      // Yandex RTB script'ini yükle
      const loadYandexScript = () => {
        if (typeof window === "undefined") return;

        // Check if Yandex script is already loaded
        if ((window as any).Ya && (window as any).Ya.Context) {
          initializeYandexAd();
          return;
        }

        // Load Yandex RTB script
        const script = document.createElement('script');
        script.src = 'https://yandex.ru/ads/system/context.js';
        script.async = true;
        script.onload = () => {
          // Initialize yaContextCb if it doesn't exist
          if (!(window as any).yaContextCb) {
            (window as any).yaContextCb = [];
          }

          // Add our callback to the queue
          (window as any).yaContextCb.push(() => {
            initializeYandexAd();
          });
        };
        script.onerror = () => {
          console.error("Yandex RTB script yüklenemedi");
          setAdError(true);
          onError?.();
        };

        document.head.appendChild(script);
      };

      const initializeYandexAd = () => {
        try {
          if ((window as any).Ya && (window as any).Ya.Context && (window as any).Ya.Context.AdvManager) {
            (window as any).Ya.Context.AdvManager.render({
              "blockId": "R-A-17002789-1",
              "renderTo": "yandex_rtb_R-A-17002789-1"
            });
            setAdLoaded(true);
          } else {
            console.warn("Yandex Context not available");
            setAdError(true);
          }
        } catch (err) {
          console.error("Yandex ad initialization error:", err);
          setAdError(true);
        }
      };

      loadYandexScript();
    }, [onError]);

    // If there's an error, show a fallback
    if (adError) {
      return (
        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
          <div className="relative h-48 w-full bg-gray-100 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-gray-500 text-sm mb-2">
                Yandex reklam yüklenemedi
              </div>
              <div className="text-gray-400 text-xs mb-2">
                Reklam geçici olarak kullanılamıyor
              </div>
              <Badge variant="outline" className="text-xs">
                Teknik Sorun
              </Badge>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
        <div className="relative h-48 w-full bg-gray-100">
          {/* Yandex RTB container */}
          <div
            id="yandex_rtb_R-A-17002789-1"
            className="w-full h-full"
            style={{
              backgroundColor: "#f5f5f5",
              minHeight: "192px" // 48 * 4 = 192px (h-48)
            }}
          />

          {/* Yandex indicator */}
          <div className="absolute top-2 right-2">
            <Badge className="bg-red-600 text-white text-xs">
              {adLoaded ? "YANDEX" : "YÜKLENİYOR..."}
            </Badge>
          </div>
        </div>
      </Card>
    );
  };

  // Reklam gösterim mantığı
  const shouldShowAd = (index: number) => {
    // İlk 4 haberden sonra (index === 4) Google reklamı göster
    // Sonra 4 haber daha geçip (index === 8) Yandex reklamını göster
    return index === 4 || index === 8;
  };

  // Hangi reklam türünü göstereceğini belirle
  const getAdType = (index: number) => {
    if (index === 4) return "google"; // İlk 4 haberden sonra
    if (index === 8) return "yandex"; // Sonra 4 haber daha geçip
    return null;
  };

  // Ana reklam component'i (environment'a göre production seçer)
  const AdCard = ({ adType }: { adType: string }) => {
    const [isProduction, setIsProduction] = useState(false);
    const [yandexFailed, setYandexFailed] = useState(false);

    useEffect(() => {
      // Environment kontrolü
      const env = process.env.NEXT_PUBLIC_ENVIRONMENT;
      setIsProduction(env === "production");
    }, []);

    // Production mode'da reklam türüne göre göster
    if (isProduction) {
      if (adType === "google") {
        return <ProductionAdCard />;
      } else if (adType === "yandex") {
        // Yandex başarısız olursa Google AdSense'e geç
        if (yandexFailed) {
          return <ProductionAdCard />;
        }
        return <YandexAdCard onError={() => setYandexFailed(true)} />;
      }
    }

    // Development mode'da reklam gösterme
    return null;
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
    // NaN kontrolü ve default değerler
    const safePage = isNaN(initialPage) || initialPage < 1 ? 1 : initialPage;
    const safeSource = initialSource || "all";
    const safeYear = initialYear || "all";
    const safeMonth = initialMonth || "all";
    const safeDay = initialDay || "all";

    setSelectedSource(safeSource);
    setSelectedYear(safeYear);
    setSelectedMonth(safeMonth);
    setSelectedDay(safeDay);
    setCurrentPage(safePage);

    // Direkt fetch et - timeout yok
    fetchNews(safePage);
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
                <span className="block md:hidden cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push('/')}>
                  Haber Merkezi
                </span>
                <span className="hidden md:block cursor-pointer hover:text-blue-600 transition-colors" onClick={() => router.push('/')}>
                  Haber Merkezi
                </span>
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
                      .filter(source => {
                        // Hem tam eşleşme hem de slug eşleşmesi kontrol et
                        const sourceLower = source.toLowerCase();
                        const searchLower = sourceSearch.toLowerCase();

                        // Tam eşleşme kontrolü
                        if (sourceLower.includes(searchLower)) return true;

                        // Slug eşleşmesi kontrolü
                        const sourceSlug = createTurkishSlug(source);
                        const searchSlug = createTurkishSlug(sourceSearch);
                        return sourceSlug.includes(searchSlug);
                      })
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
                      {/* Image Section - Sadece resim varsa göster */}
                      {article.image && (
                        <div className="relative h-32 sm:h-40 md:h-48 w-full bg-gray-200">
                          {article.image && (
                            <img
                              src={article.image}
                              alt={article.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Hide image on error
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
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
                      )}

                      {/* Source badge ve Date - Resim yoksa üstte göster */}
                      {!article.image && (
                        <div className="relative pt-2 px-3 md:px-6 flex items-center justify-between">
                          <Badge className="text-xs bg-gray-100 text-gray-800 px-2 py-1">
                            <span className="block sm:hidden">
                              {article.source.split(" ")[0]}
                            </span>
                            <span className="hidden sm:block">
                              {article.source}
                            </span>
                          </Badge>

                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {new Date(article.pubDate).toLocaleDateString("tr-TR")}
                          </div>
                        </div>
                      )}

                      <CardHeader className="pb-2 px-3 md:px-6">
                        <CardTitle className="text-sm md:text-lg leading-tight line-clamp-2 md:line-clamp-3">
                          {article.title}
                        </CardTitle>
                      </CardHeader>

                      <CardContent className="flex-1 flex flex-col pt-0 px-3 md:px-6">
                        <CardDescription className="flex-1 text-xs md:text-sm text-gray-600 mb-3 md:mb-4 line-clamp-2 md:line-clamp-3">
                          {article.description}
                        </CardDescription>

                        <Dialog onOpenChange={(open) => {
                          if (open) {
                            handleIframeOpen(article.id);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                            >
                              Detaylı Oku
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] xl:max-w-[90vw] 2xl:max-w-[85vw] max-h-[95vh] overflow-hidden p-0">
                            <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 bg-white border-b">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                                <Badge variant="outline" className="text-xs sm:text-sm w-fit">
                                  {article.source}
                                </Badge>
                                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  {formatDate(article.pubDate)}
                                </div>
                              </div>
                              <DialogTitle className="text-lg sm:text-xl leading-tight">
                                {article.title}
                              </DialogTitle>
                            </DialogHeader>

                            <div className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Haber kaynağından yükleniyor...
                                </p>
                                <Button asChild size="sm" variant="outline">
                                  <a
                                    href={article.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Yeni Sekmede Aç
                                  </a>
                                </Button>
                              </div>

                              {/* Iframe ile haber kaynağını göster */}
                              <div className="relative w-full h-[70vh] sm:h-[75vh] lg:h-[80vh] xl:h-[85vh] border rounded-lg overflow-hidden">
                                {iframeErrorStates[article.id] ? (
                                  /* Error fallback */
                                  <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                                    <div className="text-center p-4 sm:p-6">
                                      <ImageIcon className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                                        Haber yüklenemedi
                                      </h3>
                                      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                                        Haber kaynağı iframe içinde gösterilemiyor.
                                        Bu genellikle güvenlik politikaları nedeniyle olur.
                                      </p>
                                      <Button asChild>
                                        <a
                                          href={article.link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center"
                                        >
                                          <ExternalLink className="h-4 w-4 mr-2" />
                                          Haberi Yeni Sekmede Aç
                                        </a>
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Iframe content */
                                  <>
                                    <iframe
                                      src={article.link}
                                      title={`${article.title} - ${article.source}`}
                                      className="w-full h-full"
                                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
                                      loading="lazy"
                                      onLoad={() => handleIframeLoad(article.id)}
                                      onError={() => handleIframeError(article.id)}
                                      referrerPolicy="no-referrer"
                                    />

                                    {/* Loading overlay */}
                                    {iframeLoadingStates[article.id] && (
                                      <div className="absolute inset-0 bg-white flex items-center justify-center">
                                        <div className="text-center">
                                          <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-2 text-blue-600" />
                                          <p className="text-xs sm:text-sm text-gray-600">Haber kaynağı yükleniyor...</p>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  );

                  // Add ad card after specific news items
                  if (shouldShowAd(index)) {
                    const adType = getAdType(index);
                    if (adType) { // Type guard to ensure adType is not null
                      items.push(
                        <AdCard key={`ad-${index}-${adType}`} adType={adType} />
                      );
                    }
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
