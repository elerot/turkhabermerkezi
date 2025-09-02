"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Cookie, Settings, Shield, X } from "lucide-react";

// Google Analytics gtag function type
type GtagFunction = (
  command: 'consent',
  action: 'update',
  parameters: {
    analytics_storage?: 'granted' | 'denied';
    ad_storage?: 'granted' | 'denied';
    ad_user_data?: 'granted' | 'denied';
    ad_personalization?: 'granted' | 'denied';
  }
) => void;

// Yandex Metrica ym function type
type YmFunction = (
  id: number,
  action: string,
  options?: {
    clickmap?: boolean;
    trackLinks?: boolean;
    accurateTrackBounce?: boolean;
    webvisor?: boolean;
  }
) => void;

// Window object extensions
declare global {
  interface Window {
    gtag?: GtagFunction;
    ym?: YmFunction;
  }
}

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
  functional: boolean;
}

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true, // Her zaman true
    analytics: false,
    advertising: false,
    functional: false,
  });

  // Component mount olduğunda çerez durumunu kontrol et
  useEffect(() => {
    const checkCookieConsent = () => {
      if (typeof window === "undefined") return;

      const savedConsent = localStorage.getItem("cookieConsent");
      const consentDate = localStorage.getItem("cookieConsentDate");
      
      if (!savedConsent || !consentDate) {
        // Hiç onay verilmemişse banner'ı göster
        setShowBanner(true);
      } else {
        // Önceki onayı yükle
        try {
          const parsedConsent = JSON.parse(savedConsent);
          setConsent(parsedConsent);
          
          // 6 ay sonra tekrar sor (KVKK önerisi)
          const consentTimestamp = parseInt(consentDate);
          const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
          
          if (consentTimestamp < sixMonthsAgo) {
            setShowBanner(true);
          } else {
            // Mevcut onaya göre scriptleri yükle
            loadScripts(parsedConsent);
          }
        } catch (error) {
          console.warn("Çerez onayı parse edilemedi:", error);
          setShowBanner(true);
        }
      }
    };

    // Kısa gecikme ile kontrol et (hydration hatalarını önlemek için)
    setTimeout(checkCookieConsent, 1000);
  }, []);

  // Scriptleri yükle/kaldır
  const loadScripts = (consentData: CookieConsent) => {
    if (typeof window === "undefined") return;

    // Google Analytics
    if (consentData.analytics) {
      // GA script zaten layout.tsx'de yüklü, sadece config'i çalıştır
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'granted'
        });
      }
    } else {
      if (window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: 'denied'
        });
      }
    }

    // Yandex Metrica
    if (consentData.analytics) {
      if (window.ym) {
        window.ym(98576207, 'init', {
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
          webvisor: true
        });
      }
    }

    // Reklam onayı
    if (consentData.advertising) {
      // AdSense ve Yandex RTB için onay ver
      if (window.gtag) {
        window.gtag('consent', 'update', {
          ad_storage: 'granted',
          ad_user_data: 'granted',
          ad_personalization: 'granted'
        });
      }
    } else {
      if (window.gtag) {
        window.gtag('consent', 'update', {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied'
        });
      }
    }
  };

  // Onayları kaydet
  const saveConsent = (consentData: CookieConsent) => {
    if (typeof window === "undefined") return;

    localStorage.setItem("cookieConsent", JSON.stringify(consentData));
    localStorage.setItem("cookieConsentDate", Date.now().toString());
    
    setConsent(consentData);
    loadScripts(consentData);
    setShowBanner(false);
    setShowSettings(false);
  };

  // Hepsini kabul et
  const acceptAll = () => {
    const fullConsent: CookieConsent = {
      necessary: true,
      analytics: true,
      advertising: true,
      functional: true,
    };
    saveConsent(fullConsent);
  };

  // Sadece gerekli çerezler
  const acceptNecessaryOnly = () => {
    const minimalConsent: CookieConsent = {
      necessary: true,
      analytics: false,
      advertising: false,
      functional: false,
    };
    saveConsent(minimalConsent);
  };

  // Özel ayarları kaydet
  const saveCustomSettings = () => {
    saveConsent(consent);
  };

  // Banner'ı kapat (reddet)
  const closeBanner = () => {
    acceptNecessaryOnly();
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Ana Çerez Banner'ı */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-lg">
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Cookie className="h-6 w-6 text-blue-600 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    🍪 Çerezleri Kabul Edin
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Sitemizi geliştirmek, analiz yapmak ve size daha iyi hizmet sunmak için çerezler kullanıyoruz. 
                    <span className="font-medium"> KVKK</span> kapsamında onayınız gereklidir.
                    {" "}
                    <button 
                      onClick={() => setShowSettings(true)}
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      Detayları görüntüle
                    </button>
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  onClick={acceptAll}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  Hepsini Kabul Et
                </Button>
                <Button
                  onClick={() => setShowSettings(true)}
                  variant="outline"
                  className="px-4"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Ayarlar
                </Button>
                <Button
                  onClick={closeBanner}
                  variant="ghost"
                  size="sm"
                  className="px-3"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Çerez Ayarları Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Çerez Ayarları ve Gizlilik
            </DialogTitle>
            <DialogDescription>
              Hangi çerez türlerinin kullanılmasına izin vereceğinizi seçebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Gerekli Çerezler */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Gerekli Çerezler</h4>
                  <p className="text-sm text-gray-600">
                    Sitenin temel işlevlerini sağlar. Devre dışı bırakılamaz.
                  </p>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Her Zaman Aktif
                </Badge>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                Oturum yönetimi, güvenlik, temel site işlevleri
              </div>
            </div>

            {/* Analitik Çerezler */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Analitik Çerezler</h4>
                  <p className="text-sm text-gray-600">
                    Site kullanımını analiz etmek için Google Analytics ve Yandex Metrica kullanır.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.analytics}
                    onChange={(e) => setConsent({...consent, analytics: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                Google Analytics (G-HV62F5XDP1), Yandex Metrica (98576207)
              </div>
            </div>

            {/* Reklam Çerezleri */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Reklam Çerezleri</h4>
                  <p className="text-sm text-gray-600">
                    Size uygun reklamlar göstermek için Google AdSense ve Yandex RTB kullanır.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.advertising}
                    onChange={(e) => setConsent({...consent, advertising: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                Google AdSense, Yandex RTB - Kişiselleştirilmiş reklamlar
              </div>
            </div>

            {/* Fonksiyonel Çerezler */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">Fonksiyonel Çerezler</h4>
                  <p className="text-sm text-gray-600">
                    Gelişmiş özellikler ve kişiselleştirme için kullanılır.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.functional}
                    onChange={(e) => setConsent({...consent, functional: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
                Tema tercihleri, dil ayarları, kullanıcı deneyimi iyileştirmeleri
              </div>
            </div>

            {/* KVKK Bilgilendirmesi */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <h5 className="font-semibold text-blue-900 mb-2">📋 KVKK Bilgilendirmesi</h5>
              <p className="text-sm text-blue-800 mb-3">
                Kişisel verileriniz 6698 sayılı KVKK kapsamında işlenmektedir. 
                Çerez politikamız ve veri işleme süreçlerimiz hakkında detaylı bilgi için:
              </p>
              <div className="space-y-1">
                <a href="/gizlilik-politikasi" className="text-sm text-blue-700 hover:text-blue-900 underline block">
                  🔒 Gizlilik Politikası
                </a>
                <a href="/cerez-politikasi" className="text-sm text-blue-700 hover:text-blue-900 underline block">
                  🍪 Çerez Politikası
                </a>
                <a href="/kvkk-aydinlatma-metni" className="text-sm text-blue-700 hover:text-blue-900 underline block">
                  📝 KVKK Aydınlatma Metni
                </a>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={acceptAll}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Hepsini Kabul Et
            </Button>
            <Button
              onClick={saveCustomSettings}
              variant="outline"
              className="flex-1"
            >
              Seçimlerimi Kaydet
            </Button>
            <Button
              onClick={acceptNecessaryOnly}
              variant="ghost"
              className="flex-1"
            >
              Sadece Gerekli
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CookieConsent;
