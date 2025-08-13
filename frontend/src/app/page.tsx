/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Clock, ExternalLink, Filter, RefreshCw, Newspaper, ImageIcon, CalendarDays, Archive } from 'lucide-react';
import { ChevronDown } from "lucide-react";
import { ChevronLeft, ChevronRight, /* diğer importlar */ } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';

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

export default function NewsApp() {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sources, setSources] = useState<string[]>([]);
  
  // Hierarchical date filters
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [availableMonths, setAvailableMonths] = useState<MonthInfo[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');
  const [selectedHour, setSelectedHour] = useState('all');
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({} as Pagination);
  const [stats, setStats] = useState<Stats>({} as Stats);
  const [fetching, setFetching] = useState(false);

  // Fetch functions
  const fetchNews = async (page = 1) => {
    setLoading(true);
    try {
      let url = `${API_BASE}/news?page=${page}&limit=30`;
      if (selectedSource !== 'all') url += `&source=${encodeURIComponent(selectedSource)}`;
      if (selectedYear !== 'all') url += `&year=${selectedYear}`;
      if (selectedMonth !== 'all') url += `&month=${selectedMonth}`;
      if (selectedDay !== 'all') url += `&day=${selectedDay}`;
      if (selectedHour !== 'all') url += `&hour=${selectedHour}`;
      
      const response = await fetch(url);
      const data = await response.json();
      setNews(data.news || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error('Error fetching news:', error);
      setNews([]);
    }
    setLoading(false);
  };

  const fetchSources = async () => {
    try {
      const response = await fetch(`${API_BASE}/sources`);
      const data = await response.json();
      setSources(data);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const fetchYears = async () => {
    try {
      const response = await fetch(`${API_BASE}/years`);
      const data = await response.json();
      setAvailableYears(data);
    } catch (error) {
      console.error('Error fetching years:', error);
    }
  };

  const fetchMonths = async (year: string) => {
    if (year === 'all') {
      setAvailableMonths([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/months/${year}`);
      const data = await response.json();
      setAvailableMonths(data);
    } catch (error) {
      console.error('Error fetching months:', error);
      setAvailableMonths([]);
    }
  };

  const fetchDays = async (year: string, month: string) => {
    if (year === 'all' || month === 'all') {
      setAvailableDays([]);
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/days/${year}/${month}`);
      const data = await response.json();
      setAvailableDays(data);
    } catch (error) {
      console.error('Error fetching days:', error);
      setAvailableDays([]);
    }
  };

  const fetchHours = async () => {
    if (selectedYear === 'all' || selectedMonth === 'all' || selectedDay === 'all') {
      setAvailableHours([]);
      return;
    }
    
    try {
      const monthPadded = selectedMonth.padStart(2, '0');
      const dayPadded = selectedDay.padStart(2, '0');
      const dateKey = `${selectedYear}-${monthPadded}-${dayPadded}`;
      
      const response = await fetch(`${API_BASE}/hours/${dateKey}`);
      const data = await response.json();
      setAvailableHours(data);
    } catch (error) {
      console.error('Error fetching hours:', error);
      setAvailableHours([]);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const triggerFetch = async () => {
    setFetching(true);
    try {
      await fetch(`${API_BASE}/fetch`, { method: 'POST' });
      await fetchNews();
      await fetchStats();
      await fetchYears();
    } catch (error) {
      console.error('Error triggering fetch:', error);
    }
    setFetching(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatHour = (hourKey: string) => {
    const date = new Date(hourKey + ':00:00Z');
    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit'
    }) + ':00';
  };

  const clearAllFilters = () => {
    setSelectedSource('all');
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedDay('all');
    setSelectedHour('all');
  };

  const setQuickDateFilter = (type: 'today' | 'yesterday' | 'thisMonth' | 'thisYear') => {
    const now = new Date();
    
    console.log('Quick filter triggered:', type);
    
    // Clear all selections first
    setSelectedYear('all');
    setSelectedMonth('all');
    setSelectedDay('all');
    setSelectedHour('all');
    
    switch (type) {
      case 'today':
        const todayYear = now.getFullYear().toString();
        const todayMonth = (now.getMonth() + 1).toString();
        const todayDay = now.getDate().toString();
        
        console.log('Setting today values:', { todayYear, todayMonth, todayDay });
        
        // Set values directly and let useEffect handle the cascade
        setSelectedYear(todayYear);
        setTimeout(() => {
          setSelectedMonth(todayMonth);
          setTimeout(() => {
            setSelectedDay(todayDay);
          }, 300);
        }, 300);
        break;
        
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yYear = yesterday.getFullYear().toString();
        const yMonth = (yesterday.getMonth() + 1).toString();
        const yDay = yesterday.getDate().toString();
        
        console.log('Setting yesterday values:', { yYear, yMonth, yDay });
        
        setSelectedYear(yYear);
        setTimeout(() => {
          setSelectedMonth(yMonth);
          setTimeout(() => {
            setSelectedDay(yDay);
          }, 300);
        }, 300);
        break;
        
      case 'thisMonth':
        const tmYear = now.getFullYear().toString();
        const tmMonth = (now.getMonth() + 1).toString();
        
        console.log('Setting this month values:', { tmYear, tmMonth });
        
        setSelectedYear(tmYear);
        setTimeout(() => {
          setSelectedMonth(tmMonth);
        }, 300);
        break;
        
      case 'thisYear':
        const tyYear = now.getFullYear().toString();
        
        console.log('Setting this year value:', { tyYear });
        
        setSelectedYear(tyYear);
        break;
    }
  };

  // Add ad placement logic
  const shouldShowAd = (index: number) => {
    // Show ad after every 3rd news item (positions 3, 6, 9, etc.)
    return (index + 1) % 3 === 0;
  };

  // Demo reklam verileri
const DEMO_ADS = [
  {
    title: "Teknoloji Haberleri",
    description: "En güncel teknoloji haberlerini kaçırmayın!",
    image: "https://via.placeholder.com/400x200/3B82F6/FFFFFF?text=DEMO+REKLAM+1",
    link: "#",
    company: "TechNews Pro"
  },
  {
    title: "Ekonomi Analizi", 
    description: "Uzman görüşleri ve piyasa analizleri",
    image: "https://via.placeholder.com/400x200/10B981/FFFFFF?text=DEMO+REKLAM+2",
    link: "#",
    company: "Finans Merkezi"
  },
  {
    title: "Spor Haberleri",
    description: "Canlı skorlar ve transfer haberleri", 
    image: "https://via.placeholder.com/400x200/F59E0B/FFFFFF?text=DEMO+REKLAM+3",
    link: "#",
    company: "Spor Arena"
  }
];

// Demo reklam component'i
const DemoAdCard = ({ position }: { position: number }) => {
  const ad = DEMO_ADS[position % DEMO_ADS.length];

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden border-2 border-green-400 bg-green-50">
      {/* Demo reklam görseli */}
      <div className="relative h-48 w-full">
        <img 
          src={ad.image} 
          alt={ad.title}
          className="w-full h-full object-cover rounded-t-lg"
        />
        
        {/* Demo badge */}
        <div className="absolute top-2 left-2">
          <Badge className="bg-green-600 text-white text-xs">
            DEMO REKLAM
          </Badge>
        </div>
        
        {/* Position badge */}
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className="bg-white text-green-800 text-xs">
            AD-{position}
          </Badge>
        </div>
      </div>

      <CardHeader className="pb-2">
        <CardTitle className="text-lg leading-tight text-green-800">
          {ad.title}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col pt-0">
        <CardDescription className="flex-1 text-sm text-green-700 mb-4">
          {ad.description}
        </CardDescription>
        
        <div className="mt-auto space-y-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-green-400 text-green-700 hover:bg-green-100"
            onClick={() => {
              console.log(`Demo reklam ${position} tıklandı!`);
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
const ProductionAdCard = ({ position }: { position: number }) => {
  useEffect(() => {
    try {
      // AdSense script'i yükle
      if (typeof window !== 'undefined' && !(window as any).adsbygoogle) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }
      
      // AdSense reklam push
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
      <div className="relative h-48 w-full bg-gray-100">
        <ins
          className="adsbygoogle"
          style={{ 
            display: 'block', 
            width: '100%', 
            height: '100%',
            backgroundColor: '#f5f5f5'
          }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
          data-ad-slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        
        {/* Production indicator */}
        <div className="absolute top-2 right-2">
          <Badge className="bg-blue-600 text-white text-xs">
            REKLAM
          </Badge>
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
    
    console.log('Environment:', env);
    console.log('Hostname:', hostname);
    
    setIsProduction(env === 'production' && hostname !== 'localhost');
  }, []);
  if (isProduction) {
    return <ProductionAdCard position={position} />;
  } else {
    return <DemoAdCard position={position} />;
  }
};

  const getFilterSummary = () => {
    const filters = [];
    if (selectedSource !== 'all') filters.push(selectedSource);
    if (selectedYear !== 'all') {
      let dateFilter = selectedYear;
      if (selectedMonth !== 'all') {
        const monthName = availableMonths.find(m => m.value === selectedMonth)?.name || selectedMonth;
        dateFilter += ` ${monthName}`;
        if (selectedDay !== 'all') {
          dateFilter += ` ${selectedDay}`;
        }
      }
      filters.push(dateFilter);
    }
    return filters.join(' • ');
  };

  // Effects
  useEffect(() => {
    fetchNews();
    fetchSources();
    fetchYears();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchNews(1);
    setCurrentPage(1);
  }, [selectedSource, selectedYear, selectedMonth, selectedDay, selectedHour]);

  useEffect(() => {
    fetchMonths(selectedYear);
    setSelectedMonth('all');
    setSelectedDay('all');
  }, [selectedYear]);

  useEffect(() => {
    fetchDays(selectedYear, selectedMonth);
    setSelectedDay('all');
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchHours();
    setSelectedHour('all');
  }, [selectedYear, selectedMonth, selectedDay]);

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
          <Badge variant="secondary" className="text-xs md:text-sm hidden sm:flex">
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
              <ChevronDown className={`h-4 w-4 transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 ${mobileFiltersOpen ? 'block' : 'hidden md:grid'}`}>
            {/* Source Filter - Full width on left */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Haber Kaynağı
              </label>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Kaynak seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kaynaklar</SelectItem>
                  {sources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Filters - Compact right side */}
            <div className="flex justify-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
                  <CalendarDays className="h-4 w-4 inline mr-1" />
                  Tarih Seçimi
                </label>
                <div className="flex gap-2">
                  {/* Year Filter */}
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-40 text-sm">
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
                    onValueChange={setSelectedMonth}
                    disabled={selectedYear === 'all'}
                  >
                    <SelectTrigger className="w-40 text-sm">
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
                    onValueChange={setSelectedDay}
                    disabled={selectedYear === 'all' || selectedMonth === 'all'}
                  >
                    <SelectTrigger className="w-32 text-sm">
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
                    onClick={clearAllFilters}
                    className="px-3 ml-1"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Date Filters */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Hızlı Tarih Seçimi:</span>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateFilter('today')}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <Calendar className="h-3 w-3 mr-1" />
                Bugün
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateFilter('yesterday')}
                className="hover:bg-blue-50 hover:border-blue-300"
              >
                <Clock className="h-3 w-3 mr-1" />
                Dün
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateFilter('thisMonth')}
                className="hover:bg-green-50 hover:border-green-300"
              >
                <CalendarDays className="h-3 w-3 mr-1" />
                Bu Ay
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuickDateFilter('thisYear')}
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
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {pagination.count > 0 ? (
                  <>
                    <strong>{pagination.count}</strong> haber bulundu
                    {getFilterSummary() && (
                      <span> • Filtre: <strong>{getFilterSummary()}</strong></span>
                    )}
                  </>
                ) : (
                  'Seçilen kriterlerde haber bulunamadı'
                )}
              </div>
              {pagination.count > 0 && (
                <div className="text-sm text-gray-500">
                  Sayfa {pagination.current} / {pagination.total}
                </div>
              )}
            </div>
          </div>
        )}

        {/* News Grid */}
        {news.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600">Seçilen kriterlerde haber bulunamadı.</p>
            <p className="text-sm text-gray-500 mt-2">Filtreleri değiştirmeyi deneyin veya daha geniş tarih aralığı seçin.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
              {news.map((article, index) => {
                const items = [];
                
                // Add the news card
                items.push(
                  <Card key={article.id} className="h-full flex flex-col hover:shadow-lg transition-shadow overflow-hidden">
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
                          <span className="block sm:hidden">{article.source.split(' ')[0]}</span>
                          <span className="hidden sm:block">{article.source}</span>
                        </Badge>
                      </div>
                      
                      {/* Date overlay */}
                      <div className="absolute top-3 right-3">
                        <div className="flex items-center text-xs text-white bg-black/60 backdrop-blur-sm px-2 py-1 rounded">
                          <Clock className="h-3 w-3 mr-1" />
                          {new Date(article.pubDate).toLocaleDateString('tr-TR')}
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
                          <Button variant="outline" size="sm" className="w-full">
                            Detaylı Oku
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            {/* Large image in modal */}
                            {article.image && (
                              <div className="mb-4 -mx-6 -mt-6">
                                <img 
                                  src={article.image} 
                                  alt={article.title}
                                  className="w-full h-64 object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="outline">{article.source}</Badge>
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
              }).flat()}
            </div>

            {/* Pagination */}
            {pagination.total > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => {
                    setCurrentPage(currentPage - 1);
                    fetchNews(currentPage - 1);
                  }}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Önceki
                </Button>
                
                <div className="flex flex-col sm:flex-row items-center gap-2 text-sm text-gray-600">
                  <span>Sayfa {pagination.current} / {pagination.total}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>({pagination.count} haber)</span>
                </div>
                
                <Button
                  variant="outline"
                  disabled={currentPage === pagination.total}
                  onClick={() => {
                    setCurrentPage(currentPage + 1);
                    fetchNews(currentPage + 1);
                  }}
                  size="sm"
                  className="w-full sm:w-auto"
                >
                  Sonraki
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}