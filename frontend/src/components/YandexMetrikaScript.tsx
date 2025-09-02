"use client";
import Script from "next/script";

export default function YandexMetrikaScript() {
  return (
    <Script
      src="https://mc.yandex.ru/metrika/watch.js"
      strategy="afterInteractive"
      onLoad={() => {
        // Script yüklendikten sonra Yandex Metrika'yı initialize et
        if (typeof window !== 'undefined') {
          const windowWithYm = window as Window & { 
            ym?: (id: number, action: string, options: Record<string, boolean>) => void 
          };
          if (windowWithYm.ym) {
            windowWithYm.ym(98576207, "init", {
              clickmap: true,
              trackLinks: true,
              accurateTrackBounce: true,
              webvisor: true
            });
          }
        }
      }}
      onError={(e) => {
        console.warn('Yandex Metrika script yüklenemedi:', e);
      }}
    />
  );
}
