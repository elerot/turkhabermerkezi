import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye, Lock, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: 'Gizlilik Politikası - SaatDakika.com',
  description: 'SaatDakika.com gizlilik politikası ve kişisel veri işleme süreçleri hakkında detaylı bilgi.',
  robots: { index: true, follow: true }
};

export default function GizlilikPolitikasi() {
  const lastUpdate = "15 Ocak 2025";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Gizlilik Politikası</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Kişisel verilerinizin korunması bizim için önemlidir. Bu politika, verilerinizi nasıl topladığımız, 
            kullandığımız ve koruduğumuz hakkında bilgi verir.
          </p>
          <Badge variant="outline" className="mt-4">
            Son Güncelleme: {lastUpdate}
          </Badge>
        </div>

        <div className="space-y-6">
          {/* Veri Sorumlusu */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                Veri Sorumlusu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">SaatDakika.com</h4>
                <p className="text-gray-600 text-sm">
                  6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu sıfatıyla 
                  kişisel verilerinizi işlemekteyiz.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Toplanan Veriler */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-green-600" />
                Toplanan Kişisel Veriler
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">Otomatik Olarak Toplanan Veriler:</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li><strong>Teknik Veriler:</strong> IP adresi, tarayıcı bilgileri, işletim sistemi</li>
                  <li><strong>Kullanım Verileri:</strong> Ziyaret edilen sayfalar, kalış süresi, tıklama verileri</li>
                  <li><strong>Çerez Verileri:</strong> Oturum çerezleri, tercih çerezleri, analitik çerezler</li>
                  <li><strong>Konum Verileri:</strong> Genel konum bilgisi (ülke/şehir seviyesi)</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Üçüncü Taraf Servisleri:</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                  <li><strong>Google Analytics:</strong> Site kullanım istatistikleri</li>
                  <li><strong>Yandex Metrica:</strong> Kullanıcı davranış analizi</li>
                  <li><strong>Google AdSense:</strong> Reklam gösterimi ve optimizasyonu</li>
                  <li><strong>Yandex RTB:</strong> Reklam ağı hizmetleri</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Veri İşleme Amaçları */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-purple-600" />
                Veri İşleme Amaçları ve Hukuki Dayanaklar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-900">Hizmet Sunumu</h4>
                  <p className="text-sm text-gray-600">
                    Haber içeriklerini sunmak, site işlevselliğini sağlamak
                    <br /><em>Hukuki Dayanak: Meşru menfaat</em>
                  </p>
                </div>
                
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-900">Analitik ve İyileştirme</h4>
                  <p className="text-sm text-gray-600">
                    Site performansını analiz etmek, kullanıcı deneyimini iyileştirmek
                    <br /><em>Hukuki Dayanak: Açık rıza</em>
                  </p>
                </div>
                
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-semibold text-orange-900">Reklam Hizmetleri</h4>
                  <p className="text-sm text-gray-600">
                    İlgi alanlarınıza uygun reklamlar göstermek
                    <br /><em>Hukuki Dayanak: Açık rıza</em>
                  </p>
                </div>
                
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-red-900">Güvenlik</h4>
                  <p className="text-sm text-gray-600">
                    Site güvenliğini sağlamak, kötüye kullanımı önlemek
                    <br /><em>Hukuki Dayanak: Meşru menfaat</em>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Veri Saklama */}
          <Card>
            <CardHeader>
              <CardTitle>Veri Saklama Süreleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">Çerez Verileri</span>
                  <span className="text-gray-600">En fazla 24 ay</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">Analitik Veriler</span>
                  <span className="text-gray-600">En fazla 26 ay</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="font-medium">Log Kayıtları</span>
                  <span className="text-gray-600">En fazla 6 ay</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Reklam Verileri</span>
                  <span className="text-gray-600">En fazla 13 ay</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Haklarınız */}
          <Card>
            <CardHeader>
              <CardTitle>KVKK Kapsamındaki Haklarınız</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-blue-900">✅ Bilgi Alma Hakkı</h4>
                  <p className="text-sm text-gray-600">Verilerinizin işlenip işlenmediğini öğrenme</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-900">🔍 Erişim Hakkı</h4>
                  <p className="text-sm text-gray-600">İşlenen verilerinize erişim talep etme</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-orange-900">✏️ Düzeltme Hakkı</h4>
                  <p className="text-sm text-gray-600">Hatalı verilerin düzeltilmesini isteme</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-900">🗑️ Silme Hakkı</h4>
                  <p className="text-sm text-gray-600">Verilerinizin silinmesini talep etme</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-purple-900">🚫 İtiraz Hakkı</h4>
                  <p className="text-sm text-gray-600">Veri işlemeye itiraz etme</p>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold text-indigo-900">📤 Aktarım Hakkı</h4>
                  <p className="text-sm text-gray-600">Verilerinizi başka yere taşıma</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">📧 İletişim</h4>
                <p className="text-sm text-blue-800">
                  KVKK haklarınızı kullanmak için: <br />
                  <strong>E-posta:</strong> kvkk@saatdakika.com <br />
                  <strong>Başvuru Formu:</strong> Kimlik doğrulama gereklidir
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Güvenlik Önlemleri */}
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Önlemleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">SSL/TLS Şifreleme</h4>
                    <p className="text-sm text-gray-600">Tüm veri iletişimi şifrelenir</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Erişim Kontrolü</h4>
                    <p className="text-sm text-gray-600">Yetkisiz erişim engellenir</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium">Düzenli Güvenlik Denetimleri</h4>
                    <p className="text-sm text-gray-600">Sistemler düzenli olarak kontrol edilir</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Değişiklikler */}
          <Card>
            <CardHeader>
              <CardTitle>Politika Değişiklikleri</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Bu gizlilik politikası gerektiğinde güncellenebilir. Önemli değişiklikler site üzerinden 
                duyurulacaktır. Güncel versiyonu düzenli olarak kontrol etmenizi öneririz.
              </p>
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p className="text-xs text-gray-500">
                  <strong>Son Güncelleme:</strong> {lastUpdate} <br />
                  <strong>Versiyon:</strong> 1.0 <br />
                  <strong>Yürürlük Tarihi:</strong> 15 Ocak 2025
                </p>
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
            <a href="/cerez-politikasi" className="text-blue-600 hover:text-blue-800 underline">
              Çerez Politikası
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
