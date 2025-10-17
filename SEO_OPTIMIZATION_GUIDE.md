# SEO Optimizasyon Rehberi - SaatDakika.com

## 🎯 Tespit Edilen Sorun

Google'da eski tarihli haberler (örn: 10 Eylül) indexlenmiş görünüyor ancak bu linklere tıklandığında bugünün tarihine (17 Ekim) yönlendiriliyor. Bu, indexlerin işe yaramadığı ve SEO performansını ciddi şekilde olumsuz etkilediği anlamına geliyor.

## 🔍 Sorunun Kök Nedenleri

### 1. **Cache ve Dynamic Rendering Eksikliği**
- Tarih bazlı route'larda (`/[year]/[month]/[day]`) `force-dynamic` ayarı eksikti
- Next.js bu sayfaları **static** olarak build ediyordu
- Build time'da bugünün tarihiyle oluşturulan sayfalar, tüm tarihli URL'lerde gösteriliyordu

### 2. **Canonical URL Eksikliği**
- Hiçbir sayfada canonical URL tanımlı değildi
- Google hangi URL'nin "asıl" olduğunu bilemiyordu

### 3. **SEO Meta Tag'leri Eksikliği**
- OpenGraph URL'leri eksikti
- robots ve googleBot direktifleri eksikti
- Cache-Control header'ları yanlış yapılandırılmıştı

### 4. **Domain Tutarsızlığı**
- Backend sitemap ve robots.txt: `saatdakika.com`
- Frontend canonical URL'ler: `www.saatdakika.com`
- Bu tutarsızlık Google'ı karıştırıyordu

## ✅ Uygulanan Çözümler

### 1. **Tüm Route'lara Force-Dynamic Eklendi**

Güncellenen dosyalar:
```
✅ frontend/src/app/[year]/page.tsx
✅ frontend/src/app/[year]/[month]/page.tsx
✅ frontend/src/app/[year]/[month]/[day]/page.tsx
✅ frontend/src/app/[year]/[month]/[day]/[page]/page.tsx
✅ frontend/src/app/source/[source]/page.tsx
✅ frontend/src/app/source/[source]/[year]/[month]/[day]/page.tsx
✅ frontend/src/app/source/[source]/[year]/[month]/[day]/[page]/page.tsx
```

Her dosyaya eklenen ayarlar:
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
export const runtime = 'nodejs'
```

**Sonuç:** Artık her sayfa her istekte fresh olarak render edilecek.

### 2. **Canonical URL'ler Eklendi**

Her route için doğru canonical URL tanımlandı:

```typescript
// Gün sayfası için
const canonicalUrl = `https://www.saatdakika.com/${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`

// Ay sayfası için
const canonicalUrl = `https://www.saatdakika.com/${year}/${month.padStart(2, '0')}`

// Yıl sayfası için
const canonicalUrl = `https://www.saatdakika.com/${year}`

// Kaynak sayfası için
const canonicalUrl = `https://www.saatdakika.com/source/${source}/${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`
```

### 3. **Kapsamlı SEO Meta Tag'leri**

Her sayfaya eklenen meta tag'ler:

```typescript
return {
  title: '...',
  description: '...',
  keywords: '...',
  alternates: {
    canonical: canonicalUrl
  },
  openGraph: {
    title: '...',
    description: '...',
    type: 'website',
    url: canonicalUrl
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  other: {
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
  }
}
```

### 4. **Domain Tutarlılığı Sağlandı**

Tüm URL'ler `www.saatdakika.com` ile tutarlı hale getirildi:

**Frontend:**
```
✅ frontend/public/robots.txt
✅ Tüm canonical URL'ler
```

**Backend:**
```
✅ backend/server.js - robots.txt endpoint
✅ backend/server.js - sitemap.xml tüm URL'leri
✅ backend/server.js - CORS ayarları
```

## 📊 Beklenen İyileştirmeler

### Kısa Vadede (1-2 Hafta)
1. ✅ **Doğru İçerik Sunumu**: Eski tarihli URL'ler artık doğru içeriği gösterecek
2. ✅ **Fresh Content**: Her sayfa her istekte güncel veriyle render edilecek
3. ✅ **Canonical URL'ler**: Google duplicate content sorunlarını çözemeyecek

### Orta Vadede (2-4 Hafta)
1. 📈 **İndexleme Hızı**: Google yeni sayfaları daha hızlı indexleyecek
2. 📈 **Crawl Budget**: Google botu zamanını daha verimli kullanacak
3. 📈 **SERP Konumları**: Mevcut indexler doğru içerikle güncellenecek

### Uzun Vadede (1-3 Ay)
1. 📈 **Organik Trafik**: Doğru içerik sunumu sayesinde trafik artacak
2. 📈 **Click-Through Rate (CTR)**: Kullanıcılar beklediği içeriği görecek
3. 📈 **Bounce Rate Düşüşü**: Doğru sayfa = daha az geri dönüş

## 🔄 Sonraki Adımlar

### 1. **Deploy ve Test**
```bash
# Frontend'i deploy et
cd frontend
npm run build
npm start

# Backend'i restart et
cd backend
npm start
```

### 2. **Google Search Console**

**Hemen Yapılması Gerekenler:**

1. **Sitemap'i Yeniden Gönderin**
   - Google Search Console → Sitemaps
   - URL: `https://www.saatdakika.com/api/sitemap.xml`
   - "Submit" butonuna basın

2. **URL Inspection**
   - Birkaç eski tarihli URL seçin (örn: `/2025/09/10`)
   - URL Inspection tool ile kontrol edin
   - "Request Indexing" yapın

3. **Performance Monitoring**
   - Search Console → Performance
   - Önümüzdeki 2 haftada impression ve click metriklerini takip edin

### 3. **Google Analytics**

Kontrol edilmesi gerekenler:
- Landing pages raporu
- Exit pages raporu
- Bounce rate değişimleri
- Average session duration

### 4. **Manual Testing**

Test adımları:
1. Eski tarihli bir URL'ye gidin: `https://www.saatdakika.com/2025/09/10`
2. Sayfada gösterilen tarihin 10 Eylül olduğunu doğrulayın
3. Haberlerin o güne ait olduğunu kontrol edin
4. Browser developer tools → Network → Response headers
5. `Cache-Control` header'ını kontrol edin
6. View Page Source → `<link rel="canonical"` tag'ini kontrol edin

## 🎯 KPI'lar (Takip Edilecek Metrikler)

### SEO Metrikleri
- [ ] **Indexed Pages**: Artmalı (Search Console)
- [ ] **Coverage Issues**: Azalmalı (Search Console)
- [ ] **Average Position**: İyileşmeli (Search Console)
- [ ] **Impression**: Artmalı (Search Console)
- [ ] **CTR**: İyileşmeli (Search Console)

### User Experience Metrikleri
- [ ] **Bounce Rate**: Azalmalı (Analytics)
- [ ] **Average Session Duration**: Artmalı (Analytics)
- [ ] **Pages per Session**: Artmalı (Analytics)
- [ ] **Return Visitor Rate**: Artmalı (Analytics)

## 🔧 Teknik Detaylar

### Cache Strategy

**Yeni Strateji:**
```
- force-dynamic: Her request'te fresh render
- revalidate: 0 (cache yok)
- Cache-Control: public, s-maxage=300, stale-while-revalidate=600
```

**Açıklama:**
- Server-side: Her istekte fresh render
- CDN/Edge: 5 dakika cache (s-maxage=300)
- Stale content: 10 dakika daha servis edilebilir (stale-while-revalidate=600)
- Bu sayede hem performans hem de güncellik dengesi

### URL Yapısı

```
Ana Sayfa:         /                          → Bugüne redirect
Yıl:               /2025                      → 2025 haberleri
Ay:                /2025/10                   → Ekim 2025 haberleri
Gün:               /2025/10/17                → 17 Ekim 2025 haberleri
Sayfalama:         /2025/10/17/2              → 17 Ekim sayfa 2
Kaynak:            /source/trt-haber          → TRT Haber tüm haberler
Kaynak + Tarih:    /source/trt-haber/2025/10/17 → TRT Haber 17 Ekim
```

Tüm URL'ler:
- ✅ Doğru canonical URL'e sahip
- ✅ Force-dynamic render
- ✅ Kapsamlı meta tag'ler
- ✅ OpenGraph desteği

## 📝 Notlar

### Önemli Uyarılar

1. **Deploy Sonrası:**
   - İlk 24-48 saat içinde Google'ın yeni ayarları tanıması beklenir
   - Bazı eski cache'ler 1-2 hafta daha görülebilir

2. **Monitoring:**
   - İlk 2 hafta günlük Search Console kontrolü önerilir
   - Analytics'te ani düşüş varsa hemen müdahale edin

3. **Sitemap:**
   - Sitemap her istekte dinamik olarak oluşturulur
   - Son 2 yılın tüm tarihleri sitemap'te
   - Popüler kaynakların son 7 günü sitemap'te

### İletişim ve Destek

Sorularınız için:
- Google Search Console: [search.google.com/search-console](https://search.google.com/search-console)
- Next.js Docs: [nextjs.org/docs](https://nextjs.org/docs)
- SEO Best Practices: [developers.google.com/search](https://developers.google.com/search)

---

**Oluşturulma Tarihi:** 17 Ekim 2025
**Son Güncelleme:** 17 Ekim 2025
**Versiyon:** 1.0

