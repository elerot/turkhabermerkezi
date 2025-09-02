import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import YandexMetrikaScript from "@/components/YandexMetrikaScript";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'SaatDakika.com',
  description: 'Tüm Haber Kaynaklarının Toplanma Merkezi',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <head>
        {/* Google AdSense Script (Production'da aktif olacak) */}
        {process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' && process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}

        <script async src="https://www.googletagmanager.com/gtag/js?id=G-HV62F5XDP1"></script>
        <script>
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments)}
            gtag('js', new Date());

            // Varsayılan olarak çerezleri reddet (kullanıcı onayına kadar)
            gtag('consent', 'default', {
              analytics_storage: 'denied',
              ad_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied'
            });

            gtag('config', 'G-HV62F5XDP1');
          `}
        </script>
        {/*<!-- Yandex.RTB -->*/}
        <script dangerouslySetInnerHTML={{
          __html: `window.yaContextCb=window.yaContextCb||[]`
        }} />
        <script src="https://yandex.ru/ads/system/context.js" async crossOrigin="anonymous"></script>
        
        {/*<!-- Yandex.Metrica -->*/}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
            m[i].l=1*new Date();
            for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
            k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
            (window, document, "script", "https://mc.yandex.ru/metrika/watch.js", "ym");
            
            ym(98576207, "init", {
              clickmap:true,
              trackLinks:true,
              accurateTrackBounce:true,
              webvisor:true
            });
          `
        }} />
        
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <CookieConsent />
        <YandexMetrikaScript />
      </body>
    </html>
  );
}
