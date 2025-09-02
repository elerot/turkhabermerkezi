import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cookie, Settings, BarChart3, Target } from "lucide-react";

export const metadata: Metadata = {
  title: 'Çerez Politikası - SaatDakika.com',
  description: 'SaatDakika.com çerez kullanımı, türleri ve yönetimi hakkında detaylı bilgi.',
  robots: { index: true, follow: true }
};

export default function CerezPolitikasi() {
  const lastUpdate = "15 Ocak 2025";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Cookie className="h-8 w-8 text-orange-600" />
            <h1 className="text-3xl font-bold text-gray-900">Çerez Politikası</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Sitemizde kullanılan çerezler, türleri ve nasıl yönetebileceğiniz hakkında 
            detaylı bilgi edinin.
          </p>
          <Badge variant="outline" className="mt-4">
            Son Güncelleme: {lastUpdate}
          </Badge>
        </div>

        <div className="space-y-6">
          {/* Çerez Nedir */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5 text-orange-600" />
                Çerez Nedir?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Çerezler, web sitelerini ziyaret ettiğinizde tarayıcınız tarafından cihazınıza 
                kaydedilen küçük metin dosyalarıdır. Bu dosyalar, site işlevselliğini artırmak, 
                kullanıcı deneyimini iyileştirmek ve analitik veriler toplamak için kullanılır.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📋 KVKK Uyarısı</h4>
                <p className="text-sm text-blue-800">
                  6698 sayılı KVKK kapsamında, çerez kullanımı için açık rızanız gerekmektedir. 
                  Bu rızayı istediğiniz zaman geri çekebilirsiniz.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Çerez Türleri */}
          <Card>
            <CardHeader>
              <CardTitle>Kullandığımız Çerez Türleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Gerekli Çerezler */}
                <div className="border-l-4 border-green-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">Gerekli Çerezler</h3>
                    <Badge className="bg-green-100 text-green-800 text-xs">Her Zaman Aktif</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Sitenin temel işlevlerini sağlamak için zorunlu olan çerezlerdir. 
                    Bu çerezler olmadan site düzgün çalışmaz.
                  </p>
                  <div className="bg-green-50 p-3 rounded text-xs">
                    <strong>Örnekler:</strong> Oturum yönetimi, güvenlik token'ları, dil tercihleri, 
                    temel site ayarları
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Saklama Süresi:</strong> Oturum süresi veya en fazla 1 yıl
                  </div>
                </div>

                {/* Analitik Çerezler */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">Analitik Çerezler</h3>
                    <Badge variant="outline" className="text-xs">Rıza Gerekli</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Site kullanımını analiz etmek, performansı ölçmek ve kullanıcı deneyimini 
                    iyileştirmek için kullanılır.
                  </p>
                  <div className="bg-blue-50 p-3 rounded text-xs space-y-2">
                    <div>
                      <strong>Google Analytics (G-HV62F5XDP1):</strong>
                      <br />• Sayfa görüntülemeleri, oturum süresi
                      <br />• Trafik kaynakları, kullanıcı davranışları
                      <br />• Demografik veriler (anonim)
                    </div>
                    <div>
                      <strong>Yandex Metrica (98576207):</strong>
                      <br />• Isı haritaları, tıklama verileri
                      <br />• Oturum kayıtları (anonim)
                      <br />• Dönüşüm analizi
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Saklama Süresi:</strong> En fazla 26 ay
                  </div>
                </div>

                {/* Reklam Çerezleri */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-purple-900">Reklam Çerezleri</h3>
                    <Badge variant="outline" className="text-xs">Rıza Gerekli</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Size daha uygun reklamlar göstermek ve reklam performansını ölçmek için kullanılır.
                  </p>
                  <div className="bg-purple-50 p-3 rounded text-xs space-y-2">
                    <div>
                      <strong>Google AdSense:</strong>
                      <br />• Kişiselleştirilmiş reklamlar
                      <br />• Reklam performans ölçümü
                      <br />• Reklam dolandırıcılığı önleme
                    </div>
                    <div>
                      <strong>Yandex RTB:</strong>
                      <br />• Reklam gösterim optimizasyonu
                      <br />• Kullanıcı ilgi alanları
                      <br />• Frekans kontrolü
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Saklama Süresi:</strong> En fazla 13 ay
                  </div>
                </div>

                {/* Fonksiyonel Çerezler */}
                <div className="border-l-4 border-orange-500 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-orange-900">Fonksiyonel Çerezler</h3>
                    <Badge variant="outline" className="text-xs">İsteğe Bağlı</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Site deneyiminizi kişiselleştirmek ve gelişmiş özellikleri sunmak için kullanılır.
                  </p>
                  <div className="bg-orange-50 p-3 rounded text-xs">
                    <strong>Örnekler:</strong> Tema tercihleri, font boyutu ayarları, 
                    favori haberler, bildirim tercihleri
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    <strong>Saklama Süresi:</strong> En fazla 12 ay
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Çerez Yönetimi */}
          <Card>
            <CardHeader>
              <CardTitle>Çerez Yönetimi ve Kontrolü</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">🎛️ Site Üzerinden Yönetim</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Çerez tercihlerinizi istediğiniz zaman değiştirebilirsiniz:
                  </p>
                  <div className="bg-gray-50 p-3 rounded text-sm">
                    <strong>Çerez Ayarları:</strong> Sayfanın alt kısmındaki çerez simgesine tıklayın 
                    veya tarayıcınızın ayarlar menüsünden çerez tercihlerinizi yönetin.
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">🌐 Tarayıcı Ayarları</h4>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="bg-blue-50 p-3 rounded">
                      <strong>Chrome:</strong>
                      <br />Ayarlar → Gizlilik ve güvenlik → Çerezler
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <strong>Firefox:</strong>
                      <br />Ayarlar → Gizlilik ve güvenlik → Çerezler
                    </div>
                    <div className="bg-purple-50 p-3 rounded">
                      <strong>Safari:</strong>
                      <br />Tercihler → Gizlilik → Çerezleri yönet
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <strong>Edge:</strong>
                      <br />Ayarlar → Site izinleri → Çerezler
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ Önemli Not</h4>
                  <p className="text-sm text-yellow-800">
                    Çerezleri tamamen devre dışı bırakırsanız, site bazı özellikleri düzgün çalışmayabilir. 
                    Özellikle gerekli çerezlerin engellenmesi site işlevselliğini etkileyecektir.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Üçüncü Taraf Çerezleri */}
          <Card>
            <CardHeader>
              <CardTitle>Üçüncü Taraf Çerezleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Sitemizde kullanılan bazı çerezler, üçüncü taraf hizmet sağlayıcılar tarafından 
                  yerleştirilir. Bu çerezler için ayrıca onay gereklidir.
                </p>
                
                <div className="grid gap-4">
                  <div className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Google (Analytics & AdSense)</h4>
                      <Badge variant="outline" className="text-xs">Üçüncü Taraf</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Google'ın gizlilik politikası ve çerez kullanımı hakkında:
                    </p>
                    <a 
                      href="https://policies.google.com/privacy" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      Google Gizlilik Politikası →
                    </a>
                  </div>
                  
                  <div className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Yandex (Metrica & RTB)</h4>
                      <Badge variant="outline" className="text-xs">Üçüncü Taraf</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Yandex'in gizlilik politikası ve çerez kullanımı hakkında:
                    </p>
                    <a 
                      href="https://yandex.com/legal/confidential/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      Yandex Gizlilik Politikası →
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* İletişim */}
          <Card>
            <CardHeader>
              <CardTitle>İletişim ve Sorular</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Çerez politikamız hakkında sorularınız varsa bizimle iletişime geçebilirsiniz:
              </p>
              <div className="bg-blue-50 p-4 rounded">
                <div className="space-y-2 text-sm">
                  <div><strong>E-posta:</strong> cerez@saatdakika.com</div>
                  <div><strong>KVKK Başvuruları:</strong> kvkk@saatdakika.com</div>
                  <div><strong>Çerez Ayarları:</strong> Sayfanın altındaki çerez yönetimi paneli</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Güncellemeler */}
          <Card>
            <CardHeader>
              <CardTitle>Politika Güncellemeleri</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Bu çerez politikası gerektiğinde güncellenebilir. Önemli değişiklikler 
                site üzerinden duyurulacaktır.
              </p>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-xs text-gray-500 space-y-1">
                  <div><strong>Son Güncelleme:</strong> {lastUpdate}</div>
                  <div><strong>Versiyon:</strong> 1.0</div>
                  <div><strong>Yürürlük Tarihi:</strong> 15 Ocak 2025</div>
                  <div><strong>Bir Sonraki İnceleme:</strong> 15 Temmuz 2025</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 text-center">
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="/" className="text-blue-600 hover:text-blue-800 underline">
              Ana Sayfa
            </a>
            <a href="/gizlilik-politikasi" className="text-blue-600 hover:text-blue-800 underline">
              Gizlilik Politikası
            </a>
            <a href="/kvkk-aydinlatma-metni" className="text-blue-600 hover:text-blue-800 underline">
              KVKK Aydınlatma Metni
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
