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
import { Input } from "@/components/ui/input";
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
  Search,
  X,
} from "lucide-react";
import { decodeHtmlEntitiesServer } from "@/lib/utils";

const API_BASE = (() => {
  // Production'da veya NEXT_PUBLIC_API_BASE tanımlanmışsa onu kullan
  if (process.env.NEXT_PUBLIC_API_BASE) {
    console.log('🔧 API_BASE from env:', process.env.NEXT_PUBLIC_API_BASE);
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  
  // Development'ta browser'daysa dinamik olarak current host'u kullan
  if (typeof window !== 'undefined') {
    // Browser environment - current host'u kullan
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // Eğer localhost ise port 3001 kullan, değilse standard port'u kullan
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const apiBase = `${protocol}//${hostname}:3001/api`;
      console.log('🔧 API_BASE for localhost:', apiBase);
      return apiBase;
    } else {
      // Production domain'de ise backend'in aynı domain'de olduğunu varsay
      const apiBase = `${protocol}//${hostname}/api`;
      console.log('🔧 API_BASE for production domain:', apiBase);
      return apiBase;
    }
  }
  
  // Server-side rendering için fallback
  console.log('🔧 API_BASE fallback: /api');
  return "/api";
})();

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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [iframeLoadingStates, setIframeLoadingStates] = useState<{ [key: string]: boolean }>({});
  const [iframeErrorStates, setIframeErrorStates] = useState<{ [key: string]: boolean }>({});
  const [adPositions, setAdPositions] = useState<number[]>([]); // Yandex reklam pozisyonları



  // Hierarchical date filters
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<MonthInfo[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);

  const [selectedSource, setSelectedSource] = useState<string>(initialSource || "all");
  const [selectedYear, setSelectedYear] = useState<string>(initialYear || "all");
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth || "all");
  const [selectedDay, setSelectedDay] = useState<string>(initialDay || "all");
  const [currentPage, setCurrentPage] = useState<number>(initialPage || 1);

  const [pagination, setPagination] = useState<Pagination>({
    current: 1,
    total: 1,
    count: 0
  });
  const [stats, setStats] = useState<Stats>({
    total_news: 0,
    total_sources: 0,
    total_days: 0,
    last_update: ""
  });
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
    if (source && source !== "all") {
      const sourceSlug = createTurkishSlug(source);
      url = `/source/${sourceSlug}`;
    }

    // Tarih parametrelerini ekle (source'dan bağımsız olarak)
    if (year && year !== "all") {
      url += `/${year}`;
      if (month && month !== "all") {
        url += `/${month.padStart(2, "0")}`;
        if (day && day !== "all") {
          url += `/${day.padStart(2, "0")}`;
          if (page > 1) url += `/${page}`;
        }
      }
    }

    return url || "/";
  };

  // Türkçe karakterleri koruyan slug oluşturma fonksiyonu
  const createTurkishSlug = (text: string) => {
    if (!text) return "";
    
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
    if (!source) return;
    setSelectedSource(source);
    setCurrentPage(1);
    setSourceSearch(""); // Search'i temizle
    // Yeni source değerini kullan, diğerleri mevcut state'ten al
    const url = buildUrl(source, selectedYear || "all", selectedMonth || "all", selectedDay || "all", 1);
    router.push(url);
  };

  const handleYearChange = (year: string) => {
    if (!year) return;
    setSelectedYear(year);
    setSelectedMonth("all");
    setSelectedDay("all");
    setCurrentPage(1);
    const url = buildUrl(selectedSource || "all", year, "all", "all", 1);
    router.push(url);
  };

  const handleMonthChange = (month: string) => {
    if (!month) return;
    setSelectedMonth(month);
    setSelectedDay("all");
    setCurrentPage(1);
    const url = buildUrl(selectedSource || "all", selectedYear || "all", month, "all", 1);
    router.push(url);
  };

  const handleDayChange = (day: string) => {
    if (!day) return;
    setSelectedDay(day);
    setCurrentPage(1);
    const url = buildUrl(selectedSource || "all", selectedYear || "all", selectedMonth || "all", day, 1);
    router.push(url);
  };

  const handlePageChange = (page: number) => {
    // NaN kontrolü
    const safePage = isNaN(page) || page < 1 ? 1 : page;

    setCurrentPage(safePage);
    const url = buildUrl(
      selectedSource || "all",
      selectedYear || "all",
      selectedMonth || "all",
      selectedDay || "all",
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
    setSearchQuery(""); // Arama sorgusunu temizle

    const url = buildUrl("all", year, month, day, 1);
    router.push(url);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Arama yapılırken sayfa 1'e dön
  };

  const handleSearchSubmit = () => {
    fetchNews(1); // Arama yapıldığında haberleri yeniden çek
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setCurrentPage(1);
    fetchNews(1); // Arama temizlendiğinde haberleri yeniden çek
  };

  const handleIframeLoad = (articleId: string) => {
    if (!articleId) return;
    setIframeLoadingStates(prev => ({
      ...prev,
      [articleId]: false
    }));
  };

  const handleIframeError = (articleId: string) => {
    if (!articleId) return;
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
    if (!articleId) return;
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
        setSearchQuery(""); // Arama sorgusunu temizle

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
        setSearchQuery(""); // Arama sorgusunu temizle

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
        setSearchQuery(""); // Arama sorgusunu temizle

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
        setSearchQuery(""); // Arama sorgusunu temizle

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
      if (selectedSource && selectedSource !== "all") url += `&source=${encodeURIComponent(selectedSource)}`;
      if (selectedYear && selectedYear !== "all") url += `&year=${selectedYear}`;
      if (selectedMonth && selectedMonth !== "all") url += `&month=${selectedMonth}`;
      if (selectedDay && selectedDay !== "all") url += `&day=${selectedDay}`;
      if (searchQuery && searchQuery.trim() !== "") url += `&search=${encodeURIComponent(searchQuery.trim())}`;

      console.log('🔄 Fetching news from:', url);
      
      const response = await fetch(url);
      
      console.log('📡 API Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 API Response data:', {
        newsCount: data.news?.length || 0,
        pagination: data.pagination
      });
      
      setNews(data.news || []);
      setPagination(data.pagination || {
        current: 1,
        total: 1,
        count: 0
      });
      
      // Haberler yüklendikten sonra reklam pozisyonlarını oluştur
      if (data.news && data.news.length > 0) {
        const newAdPositions = generateAdPositions(data.news.length);
        setAdPositions(newAdPositions);
      }
    } catch (error) {
      console.error("❌ Error fetching news:", error);
      console.error("❌ API_BASE used:", API_BASE);
      console.error("❌ Current hostname:", typeof window !== 'undefined' ? window.location.hostname : 'server');
      setNews([]);
      setPagination({
        current: 1,
        total: 1,
        count: 0
      });
      setAdPositions([]);
    }
    setLoading(false);
  };

  const fetchSources = async () => {
    try {
      const url = `${API_BASE}/sources`;
      console.log('🔄 Fetching sources from:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('📊 Sources fetched:', data?.length || 0);
      setSources(data || []);
    } catch (error) {
      console.error("❌ Error fetching sources:", error);
      console.error("❌ API_BASE used:", API_BASE);
      setSources([]);
    }
  };

  const fetchYears = async () => {
    try {
      const response = await fetch(`${API_BASE}/years`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAvailableYears(data || []);
    } catch (error) {
      console.error("Error fetching years:", error);
      setAvailableYears([]);
    }
  };

  const fetchMonths = async (year: string) => {
    if (!year || year === "all") {
      setAvailableMonths([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/months/${year}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAvailableMonths(data || []);
    } catch (error) {
      console.error("Error fetching months:", error);
      setAvailableMonths([]);
    }
  };

  const fetchDays = async (year: string, month: string) => {
    if (!year || !month || year === "all" || month === "all") {
      setAvailableDays([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/days/${year}/${month}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAvailableDays(data || []);
    } catch (error) {
      console.error("Error fetching days:", error);
      setAvailableDays([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats(data || {
        total_news: 0,
        total_sources: 0,
        total_days: 0,
        last_update: ""
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({
        total_news: 0,
        total_sources: 0,
        total_days: 0,
        last_update: ""
      });
    }
  };

  // Random reklam pozisyonları oluştur - Sadece 2 adet
  const generateAdPositions = React.useCallback((newsCount: number) => {
    if (newsCount < 8) return []; // Çok az haber varsa reklam gösterme
    
    const positions: number[] = [];
    const minGap = 4; // Reklamlar arası minimum boşluk
    
    // İlk reklam için pozisyon (3-6 arası)
    const firstAd = Math.floor(Math.random() * 4) + 3;
    positions.push(firstAd);
    
    // İkinci reklam için pozisyon (ilk reklamdan sonra minGap kadar uzak)
    const secondStart = firstAd + minGap;
    const secondEnd = newsCount - 3;
    if (secondEnd >= secondStart) {
      const secondAd = Math.floor(Math.random() * (secondEnd - secondStart + 1)) + secondStart;
      positions.push(secondAd);
    }
    
    return positions;
  }, []);

  // Utility functions
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "Geçersiz tarih";
      }
      return date.toLocaleString("tr-TR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Tarih hatası";
    }
  };

  const getFilterSummary = () => {
    const filters = [];
    if (selectedSource && selectedSource !== "all") filters.push(selectedSource);
    if (selectedYear && selectedYear !== "all") {
      let dateFilter = selectedYear;
      if (selectedMonth && selectedMonth !== "all") {
        const monthName =
          availableMonths.find((m) => m.value === selectedMonth)?.name ||
          selectedMonth;
        dateFilter += ` ${monthName || selectedMonth}`;
        if (selectedDay && selectedDay !== "all") {
          dateFilter += ` ${selectedDay}`;
        }
      }
      filters.push(dateFilter);
    }
    if (searchQuery && searchQuery.trim() !== "") {
      filters.push(`"${searchQuery.trim()}"`);
    }
    return filters.join(" • ");
  };

  // Arama sonuçlarını vurgulamalı gösterme fonksiyonu
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <mark key={index} className="bg-yellow-200 px-1 rounded">
            {part}
          </mark>
        );
      }
      return part;
    });
  };


  // Pagination component'ini tanımla (NewsApp component'inin içinde)
  const PaginationControls = () => {
    if (!pagination || pagination.total <= 1) return null;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <Button
          variant="outline"
          disabled={!currentPage || currentPage === 1}
          onClick={() => handlePageChange((currentPage || 1) - 1)}
          size="sm"
          className="w-full sm:w-auto"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Önceki
        </Button>

        <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-gray-600">
          <span>
            Sayfa {currentPage || 1} / {pagination.total || 1}
          </span>
          <span className="hidden sm:inline">•</span>
          <span>({pagination.count || 0} haber)</span>
        </div>

        <Button
          variant="outline"
          disabled={!currentPage || !pagination.total || currentPage === pagination.total}
          onClick={() => handlePageChange((currentPage || 1) + 1)}
          size="sm"
          className="w-full sm:w-auto"
        >
          Sonraki
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    );
  };



  // Yandex reklam component'i
  const YandexAdCard = ({ onError, adIndex }: { onError?: () => void; adIndex?: number }) => {
    const [adLoaded, setAdLoaded] = useState(false);
    const [adError, setAdError] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    
    // Her reklam için sabit ID oluştur - sadece 1 ve 2 kullan
    const adNumber = adIndex !== undefined ? (adPositions.indexOf(adIndex) + 1) : 1;
    const uniqueId = `yandex_rtb_R-A-17002789-${adNumber}`;

    useEffect(() => {
      // Mobil cihaz kontrolü
      const checkMobile = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isMobileViewport = window.innerWidth <= 768;
        setIsMobile(isMobileDevice || isMobileViewport);
      };

      checkMobile();
      window.addEventListener('resize', checkMobile);

      // Basit Yandex script yükleme
      const loadYandexScript = () => {
        if (typeof window === "undefined") return;

        // Eğer Yandex zaten yüklü ise direkt initialize et
        if ((window as any).Ya && (window as any).Ya.Context) {
          // DOM hazır olana kadar bekle
          setTimeout(() => initializeYandexAd(), 500);
          return;
        }

        // Script zaten var mı kontrol et
        const existingScript = document.querySelector('script[src="https://yandex.ru/ads/system/context.js"]');
        if (existingScript) {
          // Biraz bekle ve initialize et
          setTimeout(() => initializeYandexAd(), 1000);
          return;
        }

        // Yeni script yükle
        const script = document.createElement('script');
        script.src = 'https://yandex.ru/ads/system/context.js';
        script.async = true;
        script.onload = () => {
          if (!(window as any).yaContextCb) {
            (window as any).yaContextCb = [];
          }

          (window as any).yaContextCb.push(() => {
            // DOM'un hazır olduğundan emin olmak için gecikme
            setTimeout(() => {
              initializeYandexAd();
            }, 800);
          });
        };
        script.onerror = () => {
          console.warn("Yandex RTB script yüklenemedi");
          setAdError(true);
          onError?.();
        };

        document.head.appendChild(script);
      };

      const initializeYandexAd = () => {
        try {
          // DOM element'inin hazır olduğundan emin ol
          const containerElement = document.getElementById(uniqueId);
          if (!containerElement) {
            console.warn(`Container element with id "${uniqueId}" not found, skipping...`);
            setAdError(true);
            return;
          }

          // Container zaten içerik varsa, tekrar initialize etme
          if (containerElement.children.length > 0 || containerElement.innerHTML.trim() !== '') {
            console.log(`Container ${uniqueId} already has content, skipping...`);
            setAdLoaded(true);
            return;
          }

          if ((window as any).Ya && (window as any).Ya.Context && (window as any).Ya.Context.AdvManager) {
            // Basit reklam konfigürasyonu
            const adConfig: any = {
              "blockId": "R-A-17002789-1",
              "renderTo": uniqueId
            };

            (window as any).Ya.Context.AdvManager.render(adConfig);
            setAdLoaded(true);
          } else {
            console.warn("Yandex Context not available");
            setAdError(true);
          }
        } catch (err) {
          console.warn("Yandex ad initialization error:", err);
          setAdError(true);
        }
      };

      loadYandexScript();

      return () => {
        window.removeEventListener('resize', checkMobile);
        // Basit cleanup
        const container = document.getElementById(uniqueId);
        if (container) {
          container.innerHTML = '';
        }
      };
    }, [onError, isMobile]);

    // If there's an error, show a fallback
    if (adError) {
      return (
        <div className="h-full bg-gray-100 rounded-lg border flex items-center justify-center shadow-sm">
          <div className="text-center p-4">
            <div className="text-gray-500 text-sm mb-2">
              Yandex reklam yüklenemedi
            </div>
            <div className="text-gray-400 text-xs mb-2">
              Reklam geçici olarak kullanılamıyor
            </div>
            <Badge className="bg-red-600 text-white text-xs">
              Teknik Sorun
            </Badge>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full bg-gray-100 rounded-lg border relative overflow-hidden shadow-sm flex flex-col">
        {/* Yandex RTB container - haber kartı yüksekliğinde */}
        <div
          id={uniqueId}
          className="w-full flex-1"
          style={{
            backgroundColor: "#f5f5f5",
            minHeight: "200px", // Haber kartları ile uyumlu minimum yükseklik
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        />

        {/* Yandex indicator */}
        <div className="absolute top-2 right-2">
          <Badge className="bg-red-600 text-white text-xs">
            {adLoaded ? "YANDEX" : "YÜKLENİYOR..."}
          </Badge>
        </div>
      </div>
    );
  };

       // Reklam gösterim mantığı - 4 adet Yandex reklamını random pozisyonlara yerleştir
  const shouldShowAd = (index: number) => {
    return adPositions.includes(index);
  };

  // Hangi reklam türünü göstereceğini belirle - artık sadece Yandex
  const getAdType = (index: number) => {
    if (adPositions.includes(index)) {
      return "yandex";
    }
    return null;
  };



     useEffect(() => {
     // İlk yüklemede sadece metadata'ları çek
     fetchSources();
     fetchYears();
     fetchStats();
     // fetchNews burada YOK - props useEffect'i çekecek

     // Google AdSense Banner'ı initialize et (üst)
     if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' && process.env.NEXT_PUBLIC_ADSENSE_CLIENT) {
       const initializeGoogleBanner = () => {
         if ((window as any).adsbygoogle) {
           try {
             const bannerElement = document.getElementById('google-adsense-banner');
             if (bannerElement) {
               bannerElement.innerHTML = '';
               
               const adElement = document.createElement('ins');
               adElement.className = 'adsbygoogle';
               adElement.style.display = 'block';
               adElement.setAttribute('data-ad-client', process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '');
               adElement.setAttribute('data-ad-slot', process.env.NEXT_PUBLIC_ADSENSE_SLOT || '');
               adElement.setAttribute('data-ad-format', 'auto');
               adElement.setAttribute('data-full-width-responsive', 'true');
               
               bannerElement.appendChild(adElement);
               
               setTimeout(() => {
                 try {
                   (window as any).adsbygoogle.push({});
                 } catch (err) {
                   console.warn("Google Banner AdSense push failed:", err);
                 }
               }, 100);
             }
           } catch (err) {
             console.warn("Google Banner initialization failed:", err);
           }
         }
       };



       // Wait for AdSense to be ready
       if ((window as any).adsbygoogle) {
         setTimeout(() => {
           initializeGoogleBanner();
         }, 500);
       } else {
         const checkInterval = setInterval(() => {
           if ((window as any).adsbygoogle) {
             clearInterval(checkInterval);
             initializeGoogleBanner();
           }
         }, 1000);
         
         // Timeout after 10 seconds
         setTimeout(() => {
           clearInterval(checkInterval);
         }, 10000);
       }
     }

     // Global AdSense error handler to prevent "no_div" errors from breaking the page
     if (typeof window !== "undefined") {
       const originalError = window.console.error;
       window.console.error = (...args) => {
         // Filter out AdSense "no_div" errors
         if (args[0] && typeof args[0] === 'string' && args[0].includes('no_div')) {
           console.warn('AdSense no_div error suppressed:', args[0]);
           return;
         }
         // Log other errors normally
         originalError.apply(window.console, args);
       };

       // Cleanup function
       return () => {
         window.console.error = originalError;
       };
     }
   }, []);

  useEffect(() => {
    // Ay listesini güncelle
    if (selectedYear && selectedYear !== "all") {
      fetchMonths(selectedYear);
    } else {
      setAvailableMonths([]);
    }
  }, [selectedYear]);

  useEffect(() => {
    // Gün listesini güncelle
    if (selectedYear && selectedYear !== "all" && selectedMonth && selectedMonth !== "all") {
      fetchDays(selectedYear, selectedMonth);
    } else {
      setAvailableDays([]);
    }
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

  // Sayfa yenilendiğinde ve ekran boyutu değiştiğinde reklam pozisyonlarını yeniden oluştur
  useEffect(() => {
    if (news && news.length > 0) {
      const newAdPositions = generateAdPositions(news.length);
      setAdPositions(newAdPositions);
    }
  }, [news, generateAdPositions]);



  // Loading state
  if (loading && (!news || news.length === 0)) {
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

              {stats && stats.total_news && stats.total_news > 0 && (
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
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center space-x-2 mb-2">
            <Search className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Arama</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Başlık, açıklama veya kaynak adında ara..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSubmit();
                  }
                }}
                className="pr-8"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearchSubmit}
              disabled={loading}
              className="flex items-center space-x-2 min-w-fit"
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span>Ara</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">Filtreler</h2>
            </div>
            {getFilterSummary() && getFilterSummary().trim() !== "" && (
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
                Filtreler {getFilterSummary() && getFilterSummary().trim() !== "" && `(${getFilterSummary()})`}
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
                              <Select value={selectedSource || "all"} onValueChange={handleSourceChange}>
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
                  {!sources || sources.length === 0 ? (
                    <SelectItem value="loading" disabled>
                      Kaynaklar yükleniyor... ({sources ? sources.length : 0})
                    </SelectItem>
                  ) : (
                    sources
                      .filter(source => {
                        // Hem tam eşleşme hem de slug eşleşmesi kontrol et
                        if (!source) return false;
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
                  value={selectedYear || "all"}
                  onValueChange={handleYearChange}
                  disabled={!sources || sources.length === 0}
                >
                  <SelectTrigger className="w-20 text-sm">
                    <SelectValue placeholder="Yıl" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {availableYears && availableYears.length > 0 && availableYears.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Month Filter */}
                <Select
                  value={selectedMonth || "all"}
                  onValueChange={handleMonthChange}
                  disabled={!selectedYear || selectedYear === "all"}
                >
                  <SelectTrigger className="w-32 text-sm">
                    <SelectValue placeholder="Ay" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {availableMonths && availableMonths.length > 0 && availableMonths.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                                  {/* Day Filter */}
                  <Select
                    value={selectedDay || "all"}
                    onValueChange={handleDayChange}
                    disabled={!selectedYear || !selectedMonth || selectedYear === "all" || selectedMonth === "all"}
                  >
                    <SelectTrigger className="w-20 text-sm">
                      <SelectValue placeholder="Gün" />
                  </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tümü</SelectItem>
                      {availableDays && availableDays.length > 0 && availableDays.map((day) => (
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
                {pagination && pagination.count > 0 ? (
                  <>
                    <strong>{pagination.count}</strong> haber bulundu
                    {getFilterSummary() && getFilterSummary().trim() !== "" && (
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

              {pagination && pagination.count > 0 && pagination.total > 0 && (
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="text-sm text-gray-500">
                    Sayfa {currentPage || 1} / {pagination.total || 1}
                  </div>

                  {/* ÜST PAGİNATİON - kompakt versiyon */}
                  {pagination.total > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        disabled={!currentPage || currentPage === 1}
                        onClick={() => handlePageChange((currentPage || 1) - 1)}
                        size="sm"
                        className="h-8 px-2"
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>

                      <Button
                        variant="outline"
                        disabled={!currentPage || !pagination.total || currentPage === pagination.total}
                        onClick={() => handlePageChange((currentPage || 1) + 1)}
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

                 {/* Google AdSense Banner - En üstte tek satır */}
         {process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' && process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
           <div className="mb-6">
             <div className="w-full h-20 sm:h-24 bg-gray-100 rounded-lg border relative overflow-hidden shadow-sm">
               <div
                 id="google-adsense-banner"
                 className="w-full h-full"
                 style={{ backgroundColor: "#f5f5f5", minHeight: "80px" }}
               />
               <div className="absolute top-2 right-2">
                 <Badge className="bg-blue-600 text-white text-xs">
                   REKLAM
                 </Badge>
               </div>
             </div>
           </div>
         )}

         {/* News Grid */}
         {!news || news.length === 0 ? (
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
                             {news && news.length > 0 && news
                 .map((article, index) => {
                   // Safety check for article object
                   if (!article || !article.id) {
                     return null;
                   }
                   
                   // Reklam gösterimi kontrolü
                   if (shouldShowAd(index)) {
                     const adType = getAdType(index);
                     if (adType === "yandex") {
                       return (
                         <div key={`ad-${index}`} className="h-full">
                           <YandexAdCard adIndex={index} />
                         </div>
                       );
                     }
                   }
                   
                   return (
                     <Card
                       key={article.id}
                       className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden"
                     >
                      {/* Image Section - Sadece resim varsa göster */}
                      {article.image && article.image.trim() !== "" && (
                        <div className="relative h-32 sm:h-40 md:h-48 w-full bg-gray-200">
                          {article.image && article.image.trim() !== "" && (
                            <img
                              src={article.image || ""}
                              alt={decodeHtmlEntitiesServer(article.title) || "Haber görseli"}
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
                                {searchQuery && searchQuery.trim() !== "" 
                                  ? highlightSearchTerm((article.source || "Kaynak").split(" ")[0], searchQuery.trim())
                                  : (article.source || "Kaynak").split(" ")[0]
                                }
                              </span>
                              <span className="hidden sm:block">
                                {searchQuery && searchQuery.trim() !== "" 
                                  ? highlightSearchTerm(article.source || "Kaynak", searchQuery.trim())
                                  : article.source || "Kaynak"
                                }
                              </span>
                            </Badge>
                            </div>

                          {/* Date overlay */}
                          <div className="absolute top-2 right-2">
                            <div className="flex items-center text-xs text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
                              <Clock className="h-3 w-3 mr-1" />
                              {article.pubDate ? new Date(article.pubDate).toLocaleDateString("tr-TR") : "Tarih yok"}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Source badge ve Date - Resim yoksa üstte göster */}
                      {(!article.image || article.image.trim() === "") && (
                        <div className="relative pt-2 px-3 md:px-6 flex items-center justify-between">
                          <Badge className="text-xs bg-gray-100 text-gray-800 px-2 py-1">
                            <span className="block sm:hidden">
                              {searchQuery && searchQuery.trim() !== "" 
                                ? highlightSearchTerm((article.source || "Kaynak").split(" ")[0], searchQuery.trim())
                                : (article.source || "Kaynak").split(" ")[0]
                              }
                            </span>
                            <span className="hidden sm:block">
                              {searchQuery && searchQuery.trim() !== "" 
                                ? highlightSearchTerm(article.source || "Kaynak", searchQuery.trim())
                                : article.source || "Kaynak"
                              }
                            </span>
                          </Badge>

                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {article.pubDate ? new Date(article.pubDate).toLocaleDateString("tr-TR") : "Tarih yok"}
                          </div>
                        </div>
                      )}

                                             <CardHeader className="pb-2 px-3 md:px-6">
                                                 <CardTitle className="text-sm md:text-lg leading-tight">
                          {searchQuery && searchQuery.trim() !== "" 
                            ? highlightSearchTerm(decodeHtmlEntitiesServer(article.title) || "Başlık bulunamadı", searchQuery.trim())
                            : decodeHtmlEntitiesServer(article.title) || "Başlık bulunamadı"
                          }
                        </CardTitle>
                       </CardHeader>

                       <CardContent className="flex-1 flex flex-col pt-0 px-3 md:px-6">
                                                 <CardDescription className="text-xs md:text-sm text-gray-600 mb-3 md:mb-4">
                          {searchQuery && searchQuery.trim() !== "" 
                            ? highlightSearchTerm(decodeHtmlEntitiesServer(article.description) || "Açıklama bulunamadı", searchQuery.trim())
                            : decodeHtmlEntitiesServer(article.description) || "Açıklama bulunamadı"
                          }
                        </CardDescription>

                        <Dialog onOpenChange={(open) => {
                          if (open && article.id) {
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
                          <DialogContent className="max-w-[98vw] max-h-[95vh] w-[98vw] h-[90vh] overflow-hidden p-0 sm:w-[95vw] sm:h-[85vh] md:w-[92vw] md:h-[80vh] lg:w-[88vw] lg:h-[85vh] xl:w-[85vw] xl:h-[85vh]">
                            <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 bg-white border-b">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-2 sm:mb-3">
                                <Badge variant="outline" className="text-xs sm:text-sm w-fit">
                                  {article.source || "Kaynak"}
                                </Badge>
                                <div className="flex items-center text-xs sm:text-sm text-gray-500">
                                  <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  {article.pubDate ? formatDate(article.pubDate) : "Tarih yok"}
                                </div>
                              </div>
                              <DialogTitle className="text-lg sm:text-xl leading-tight">
                                {decodeHtmlEntitiesServer(article.title) || "Başlık bulunamadı"}
                              </DialogTitle>
                            </DialogHeader>

                            <div className="p-4 sm:p-6">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Haber kaynağından yükleniyor...
                                </p>
                                <Button asChild size="sm" variant="outline">
                                  <a
                                    href={article.link || "#"}
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
                              <div className="relative w-full h-[calc(90vh-180px)] sm:h-[calc(85vh-180px)] md:h-[calc(80vh-180px)] lg:h-[calc(85vh-180px)] border rounded-lg overflow-hidden">
                                {article.id && iframeErrorStates[article.id] === true ? (
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
                                          href={article.link || "#"}
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
                                      src={article.link || "#"}
                                      title={`${decodeHtmlEntitiesServer(article.title) || "Haber"} - ${article.source || "Kaynak"}`}
                                      className="w-full h-full"
                                      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation"
                                      loading="lazy"
                                                                             onLoad={() => {
                                         if (article.id) {
                                           handleIframeLoad(article.id);
                                         }
                                       }}
                                       onError={() => {
                                         if (article.id) {
                                           handleIframeError(article.id);
                                         }
                                       }}
                                      referrerPolicy="no-referrer"
                                    />

                                    {/* Loading overlay */}
                                    {article.id && iframeLoadingStates[article.id] === true && (
                                      <div className="absolute inset-0 bg-white flex items-center justify-center">
                                        <div className="text-center">
                                          <RefreshCw className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto mb-2 text-blue-600" />
                                          <div className="text-xs sm:text-sm text-gray-600">Haber kaynağı yükleniyor...</div>
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
                })
                .filter(Boolean)}
            </div>



            {/* ALT PAGINATION */}
            <PaginationControls />
          </>
        )}
      </div>
    </div>
  );
}
