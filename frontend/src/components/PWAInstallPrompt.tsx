'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Service Worker'ı kaydet
    if ('serviceWorker' in navigator) {
      // Önce mevcut service worker'ları temizle
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });

      // Yeni service worker'ı kaydet
      navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })
        .then((registration) => {
          console.log('Service Worker kaydedildi:', registration);
          
          // Service worker güncellemelerini kontrol et
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Yeni service worker mevcut, sayfayı yenile
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('Service Worker kaydı başarısız:', error);
        });
    }

    // PWA zaten yüklenmiş mi kontrol et
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator as Navigator & { standalone?: boolean }).standalone === true) {
        setIsInstalled(true);
        return;
      }
      setIsInstalled(false);
    };

    checkIfInstalled();

    // beforeinstallprompt olayını yakala
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    // appinstalled olayını yakala
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
      setShowInstallDialog(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      setShowInstallDialog(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('Kullanıcı PWA yüklemeyi kabul etti');
      } else {
        console.log('Kullanıcı PWA yüklemeyi reddetti');
      }
      
      setDeferredPrompt(null);
      setShowInstallButton(false);
    } catch (error) {
      console.error('PWA yükleme hatası:', error);
    }
  };



  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        size="sm"
      >
        <Download className="w-4 h-4 mr-2" />
        Ana Ekrana Ekle
      </Button>

      <Dialog open={showInstallDialog} onOpenChange={setShowInstallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Ana Ekrana Ekle
            </DialogTitle>
            <DialogDescription className="text-left">
              <div className="space-y-3">
                <p>
                  Bu sayfayı telefonunuzun ana menüsüne kısayol olarak ekleyebilirsiniz. 
                  Bu sayede uygulamaya daha hızlı erişebilirsiniz.
                </p>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-semibold mb-2">Nasıl eklenir:</h4>
                  <ul className="text-sm space-y-1">
                    <li><strong>Android:</strong> Tarayıcı menüsünden "Ana ekrana ekle" seçeneğini kullanın</li>
                    <li><strong>iPhone:</strong> Safari'de paylaş butonuna basın ve "Ana Ekrana Ekle" seçin</li>
                  </ul>
                </div>
                
                <p className="text-sm text-gray-600">
                  Bu işlem sadece bir kısayol oluşturur ve kişisel verilerinizi etkilemez.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowInstallDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Kapat
            </Button>
            <Button onClick={handleInstallClick} className="bg-blue-600 hover:bg-blue-700">
              <Download className="w-4 h-4 mr-2" />
              Ekle
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
