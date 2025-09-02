import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Scale, Users, Database } from "lucide-react";

export const metadata: Metadata = {
  title: 'KVKK Aydınlatma Metni - SaatDakika.com',
  description: 'SaatDakika.com KVKK aydınlatma metni - Kişisel veri işleme süreçleri ve haklarınız.',
  robots: { index: true, follow: true }
};

export default function KVKKAydinlatmaMetni() {
  const lastUpdate = "15 Ocak 2025";

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileText className="h-8 w-8 text-red-600" />
            <h1 className="text-3xl font-bold text-gray-900">KVKK Aydınlatma Metni</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında kişisel verilerinizin 
            işlenmesi hakkında aydınlatma metni.
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
                <Users className="h-5 w-5 text-blue-600" />
                Veri Sorumlusu Kimliği
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">📍 Veri Sorumlusu</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Unvan:</strong> SaatDakika.com</div>
                    <div><strong>Faaliyet Alanı:</strong> Haber portalı ve dijital medya hizmetleri</div>
                    <div><strong>Web Sitesi:</strong> www.saatdakika.com</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">📧 İletişim Bilgileri</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>KVKK E-posta:</strong> kvkk@saatdakika.com</div>
                    <div><strong>Genel İletişim:</strong> iletisim@saatdakika.com</div>
                    <div><strong>Çerez Soruları:</strong> cerez@saatdakika.com</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kişisel Verilerin İşlenme Amacı */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                Kişisel Verilerin İşlenme Amaçları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-blue-900 mb-2">🌐 Hizmet Sunumu</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Haber içeriklerinin sunulması</li>
                    <li>• Web sitesi işlevselliğinin sağlanması</li>
                    <li>• Kullanıcı deneyiminin iyileştirilmesi</li>
                    <li>• Teknik destek hizmetlerinin verilmesi</li>
                  </ul>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold text-green-900 mb-2">📊 Analitik ve İstatistik</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Site kullanım istatistiklerinin oluşturulması</li>
                    <li>• Kullanıcı davranış analizlerinin yapılması</li>
                    <li>• İçerik performansının ölçülmesi</li>
                    <li>• Site optimizasyonu çalışmalarının yürütülmesi</li>
                  </ul>
                </div>

                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold text-purple-900 mb-2">🎯 Pazarlama ve Reklam</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Kişiselleştirilmiş reklam gösteriminin sağlanması</li>
                    <li>• Reklam performansının ölçülmesi</li>
                    <li>• Hedefli pazarlama faaliyetlerinin yürütülmesi</li>
                    <li>• Reklam gelirlerinin optimize edilmesi</li>
                  </ul>
                </div>

                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold text-red-900 mb-2">🔒 Güvenlik ve Uyumluluk</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Siber güvenlik önlemlerinin alınması</li>
                    <li>• Kötüye kullanım ve dolandırıcılığın önlenmesi</li>
                    <li>• Yasal yükümlülüklerin yerine getirilmesi</li>
                    <li>• Teknik güvenlik kontrollerinin yapılması</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* İşlenen Veri Türleri */}
          <Card>
            <CardHeader>
              <CardTitle>İşlenen Kişisel Veri Türleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-blue-900">🔍 Otomatik Toplanan Veriler</h4>
                  <div className="space-y-2 text-sm">
                    <div className="bg-blue-50 p-3 rounded">
                      <strong>Teknik Veriler:</strong>
                      <br />• IP adresi
                      <br />• Tarayıcı türü ve versiyonu
                      <br />• İşletim sistemi bilgileri
                      <br />• Ekran çözünürlüğü
                    </div>
                    <div className="bg-green-50 p-3 rounded">
                      <strong>Kullanım Verileri:</strong>
                      <br />• Ziyaret edilen sayfalar
                      <br />• Sayfa görüntüleme süreleri
                      <br />• Tıklama verileri
                      <br />• Oturum bilgileri
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 text-purple-900">📍 Konum ve Tercih Verileri</h4>
                  <div className="space-y-2 text-sm">
                    <div className="bg-purple-50 p-3 rounded">
                      <strong>Konum Verileri:</strong>
                      <br />• Ülke bilgisi
                      <br />• Şehir bilgisi (yaklaşık)
                      <br />• Saat dilimi
                      <br />• Dil tercihi
                    </div>
                    <div className="bg-orange-50 p-3 rounded">
                      <strong>Tercih Verileri:</strong>
                      <br />• Çerez tercihleri
                      <br />• Tema ayarları
                      <br />• Bildirim tercihleri
                      <br />• İlgi alanları (anonim)
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Hukuki Dayanaklar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-indigo-600" />
                Veri İşlemenin Hukuki Dayanakları
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded p-4">
                    <h4 className="font-semibold text-green-900 mb-2">✅ Açık Rıza</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Aşağıdaki durumlarda açık rızanıza dayanılır:
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• Analitik çerezlerin kullanılması</li>
                      <li>• Reklam çerezlerin yerleştirilmesi</li>
                      <li>• Kişiselleştirilmiş reklam gösterimi</li>
                      <li>• Pazarlama amaçlı veri işleme</li>
                    </ul>
                  </div>

                  <div className="border rounded p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">⚖️ Meşru Menfaat</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Aşağıdaki durumlarda meşru menfaate dayanılır:
                    </p>
                    <ul className="text-xs text-gray-500 space-y-1">
                      <li>• Hizmet sunumu ve site işletimi</li>
                      <li>• Güvenlik önlemlerinin alınması</li>
                      <li>• Teknik sorunların çözülmesi</li>
                      <li>• Site performansının iyileştirilmesi</li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                  <h4 className="font-semibold text-yellow-900 mb-2">📋 Yasal Yükümlülük</h4>
                  <p className="text-sm text-yellow-800">
                    Bazı durumlarda yasal yükümlülüklerin yerine getirilmesi için kişisel verileriniz işlenebilir. 
                    Bu durumlar arasında vergi mevzuatı, elektronik ticaret mevzuatı ve diğer yasal düzenlemeler yer alır.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Veri Aktarımı */}
          <Card>
            <CardHeader>
              <CardTitle>Kişisel Verilerin Aktarıldığı Taraflar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4">
                  <div className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Google LLC</h4>
                      <Badge className="bg-blue-100 text-blue-800 text-xs">ABD</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Amaç:</strong> Analytics ve AdSense hizmetleri
                    </p>
                    <p className="text-xs text-gray-500">
                      Google Analytics ve AdSense hizmetleri kapsamında veriler ABD'ye aktarılmaktadır. 
                      Google, AB-ABD Veri Gizliliği Çerçevesi sertifikasına sahiptir.
                    </p>
                  </div>

                  <div className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Yandex N.V.</h4>
                      <Badge className="bg-green-100 text-green-800 text-xs">Hollanda</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Amaç:</strong> Metrica ve RTB reklam hizmetleri
                    </p>
                    <p className="text-xs text-gray-500">
                      Yandex Metrica ve RTB hizmetleri kapsamında veriler AB içerisinde işlenmektedir. 
                      GDPR uyumlu veri işleme garantisi mevcuttur.
                    </p>
                  </div>

                  <div className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Teknik Hizmet Sağlayıcılar</h4>
                      <Badge className="bg-gray-100 text-gray-800 text-xs">Çeşitli</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Amaç:</strong> Hosting, CDN, güvenlik hizmetleri
                    </p>
                    <p className="text-xs text-gray-500">
                      Site altyapısı ve güvenlik hizmetleri için çeşitli teknik hizmet sağlayıcılarla 
                      veri işleme sözleşmeleri yapılmıştır.
                    </p>
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded">
                  <h4 className="font-semibold text-red-900 mb-2">🌍 Yurtdışı Veri Aktarımı</h4>
                  <p className="text-sm text-red-800">
                    Verilerinizin bir kısmı, hizmet sağlayıcılarımız aracılığıyla yurtdışına aktarılmaktadır. 
                    Bu aktarımlar, Avrupa Birliği tarafından kabul edilen uygun güvenlik önlemleri ile yapılmaktadır.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saklama Süreleri */}
          <Card>
            <CardHeader>
              <CardTitle>Kişisel Verilerin Saklama Süreleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="border rounded p-3">
                    <h4 className="font-semibold mb-2">🍪 Çerez Verileri</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>• Oturum çerezleri: Oturum süresi</div>
                      <div>• Kalıcı çerezler: En fazla 24 ay</div>
                      <div>• Analitik çerezler: En fazla 26 ay</div>
                      <div>• Reklam çerezleri: En fazla 13 ay</div>
                    </div>
                  </div>

                  <div className="border rounded p-3">
                    <h4 className="font-semibold mb-2">📊 Log Kayıtları</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>• Erişim logları: 6 ay</div>
                      <div>• Hata logları: 3 ay</div>
                      <div>• Güvenlik logları: 12 ay</div>
                      <div>• Performans logları: 1 ay</div>
                    </div>
                  </div>

                  <div className="border rounded p-3">
                    <h4 className="font-semibold mb-2">📈 Analitik Veriler</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>• Google Analytics: 26 ay</div>
                      <div>• Yandex Metrica: 24 ay</div>
                      <div>• İç analitik: 12 ay</div>
                      <div>• Performans metrikleri: 6 ay</div>
                    </div>
                  </div>

                  <div className="border rounded p-3">
                    <h4 className="font-semibold mb-2">🎯 Reklam Verileri</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div>• AdSense verileri: 13 ay</div>
                      <div>• RTB verileri: 12 ay</div>
                      <div>• Reklam performansı: 6 ay</div>
                      <div>• Tıklama verileri: 3 ay</div>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded text-sm">
                  <strong>📅 Otomatik Silme:</strong> Saklama süresi dolan veriler otomatik olarak silinir veya anonimleştirilir. 
                  Yasal yükümlülük gerektiren durumlar haricinde veriler belirlenen sürelerden daha uzun saklanmaz.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Veri Sahibinin Hakları */}
          <Card>
            <CardHeader>
              <CardTitle>Veri Sahibi Olarak Haklarınız</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <h4 className="font-semibold text-blue-900">🔍 Bilgi Alma Hakkı</h4>
                    <p className="text-xs text-gray-600">
                      Kişisel verilerinizin işlenip işlenmediğini öğrenme hakkınız vardır.
                    </p>
                  </div>

                  <div className="border-l-4 border-green-500 pl-3">
                    <h4 className="font-semibold text-green-900">📋 Erişim Hakkı</h4>
                    <p className="text-xs text-gray-600">
                      İşlenen kişisel verileriniz hakkında bilgi talep etme hakkınız vardır.
                    </p>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-3">
                    <h4 className="font-semibold text-orange-900">✏️ Düzeltme Hakkı</h4>
                    <p className="text-xs text-gray-600">
                      Hatalı veya eksik verilerin düzeltilmesini isteme hakkınız vardır.
                    </p>
                  </div>

                  <div className="border-l-4 border-red-500 pl-3">
                    <h4 className="font-semibold text-red-900">🗑️ Silme Hakkı</h4>
                    <p className="text-xs text-gray-600">
                      Belirli şartlar altında verilerinizin silinmesini talep edebilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="border-l-4 border-purple-500 pl-3">
                    <h4 className="font-semibold text-purple-900">🚫 İtiraz Hakkı</h4>
                    <p className="text-xs text-gray-600">
                      Veri işleme faaliyetlerine itiraz etme hakkınız vardır.
                    </p>
                  </div>

                  <div className="border-l-4 border-indigo-500 pl-3">
                    <h4 className="font-semibold text-indigo-900">📤 Taşınabilirlik Hakkı</h4>
                    <p className="text-xs text-gray-600">
                      Verilerinizi yapılandırılmış bir formatta alma hakkınız vardır.
                    </p>
                  </div>

                  <div className="border-l-4 border-yellow-500 pl-3">
                    <h4 className="font-semibold text-yellow-900">⏸️ Sınırlama Hakkı</h4>
                    <p className="text-xs text-gray-600">
                      Belirli şartlar altında veri işlemenin sınırlanmasını isteyebilirsiniz.
                    </p>
                  </div>

                  <div className="border-l-4 border-gray-500 pl-3">
                    <h4 className="font-semibold text-gray-900">📞 Başvuru Hakkı</h4>
                    <p className="text-xs text-gray-600">
                      Veri Koruma Kurulu'na başvuru yapma hakkınız vardır.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
                <h4 className="font-semibold text-green-900 mb-2">📝 Başvuru Süreci</h4>
                <div className="text-sm text-green-800 space-y-1">
                  <div><strong>1.</strong> kvkk@saatdakika.com adresine yazılı başvuru yapın</div>
                  <div><strong>2.</strong> Kimlik doğrulama için gerekli belgeleri ekleyin</div>
                  <div><strong>3.</strong> Başvurunuz en geç 30 gün içerisinde değerlendirilir</div>
                  <div><strong>4.</strong> Sonuç size yazılı olarak bildirilir</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* İletişim */}
          <Card>
            <CardHeader>
              <CardTitle>İletişim ve Başvuru</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3">📧 KVKK Başvuruları</h4>
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <div className="space-y-1">
                      <div><strong>E-posta:</strong> kvkk@saatdakika.com</div>
                      <div><strong>Konu:</strong> "KVKK Başvurusu" yazınız</div>
                      <div><strong>Gerekli Belgeler:</strong> Kimlik fotokopisi</div>
                      <div><strong>Cevap Süresi:</strong> En fazla 30 gün</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">🏛️ Veri Koruma Kurulu</h4>
                  <div className="bg-red-50 p-3 rounded text-sm">
                    <div className="space-y-1">
                      <div><strong>Başvuru:</strong> kvkk.gov.tr</div>
                      <div><strong>Telefon:</strong> 0312 216 50 50</div>
                      <div><strong>Adres:</strong> Ankara - Çankaya</div>
                      <div><strong>Not:</strong> Önce bize başvuru yapmalısınız</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="bg-gray-100 p-4 rounded-lg mb-6">
            <p className="text-sm text-gray-600">
              Bu aydınlatma metni 6698 sayılı KVKK'nın 10. maddesi gereğince hazırlanmıştır.
            </p>
            <div className="mt-2 text-xs text-gray-500">
              <strong>Yürürlük Tarihi:</strong> {lastUpdate} • <strong>Versiyon:</strong> 1.0
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <a href="/" className="text-blue-600 hover:text-blue-800 underline">
              Ana Sayfa
            </a>
            <a href="/gizlilik-politikasi" className="text-blue-600 hover:text-blue-800 underline">
              Gizlilik Politikası
            </a>
            <a href="/cerez-politikasi" className="text-blue-600 hover:text-blue-800 underline">
              Çerez Politikası
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
