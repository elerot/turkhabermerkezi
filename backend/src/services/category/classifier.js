const { cleanText } = require("../../utils/textCleaner");

// Haber başlığına göre kategori tahmin et
function classifyCategory(item, feedCategory) {
  // RSS item'ından kategori bilgisini al, yoksa feed'den al
  let articleCategory = feedCategory;
  
  if (item.categories && item.categories.length > 0) {
    articleCategory = item.categories[0];
  } else if (item.category) {
    articleCategory = item.category;
  }

  const title = cleanText(item.title).toLowerCase();
  const descriptionText = cleanText(item.description || item.contentSnippet || "").toLowerCase();
  const content = (title + " " + descriptionText).toLowerCase();

  // Spor kategorisi
  if (content.includes('futbol') || content.includes('basketbol') || content.includes('voleybol') || 
      content.includes('tenis') || content.includes('spor') || content.includes('maç') || 
      content.includes('galatasaray') || content.includes('fenerbahçe') || content.includes('beşiktaş') ||
      content.includes('trabzonspor') || content.includes('başakşehir') || content.includes('antrenman') ||
      content.includes('şampiyon') || content.includes('lig') || content.includes('kup') ||
      content.includes('gol') || content.includes('asist') || content.includes('kart') ||
      content.includes('transfer') || content.includes('oyuncu') || content.includes('teknik direktör')) {
    articleCategory = "Spor";
  }
  // Ekonomi kategorisi
  else if (content.includes('ekonomi') || content.includes('borsa') || content.includes('dolar') || 
           content.includes('euro') || content.includes('altın') || content.includes('enflasyon') ||
           content.includes('faiz') || content.includes('kredi') || content.includes('yatırım') ||
           content.includes('şirket') || content.includes('piyasa') || content.includes('finans') ||
           content.includes('bankacılık') || content.includes('kripto') || content.includes('bitcoin')) {
    articleCategory = "Ekonomi";
  }
  // Teknoloji kategorisi
  else if (content.includes('teknoloji') || content.includes('yapay zeka') || content.includes('ai') ||
           content.includes('yazılım') || content.includes('donanım') || content.includes('telefon') ||
           content.includes('bilgisayar') || content.includes('internet') || content.includes('siber') ||
           content.includes('dijital') || content.includes('uygulama') || content.includes('app') ||
           content.includes('startup') || content.includes('inovasyon') || content.includes('robot')) {
    articleCategory = "Teknoloji";
  }
  // Sağlık kategorisi
  else if (content.includes('sağlık') || content.includes('hastane') || content.includes('doktor') ||
           content.includes('hasta') || content.includes('ilaç') || content.includes('tedavi') ||
           content.includes('virüs') || content.includes('covid') || content.includes('pandemi') ||
           content.includes('aşı') || content.includes('ameliyat') || content.includes('kanser') ||
           content.includes('kalp') || content.includes('beyin') || content.includes('organ')) {
    articleCategory = "Sağlık";
  }
  // Siyaset kategorisi
  else if (content.includes('siyaset') || content.includes('bakan') || content.includes('milletvekili') ||
           content.includes('parti') || content.includes('seçim') || content.includes('oy') ||
           content.includes('meclis') || content.includes('hükümet') || content.includes('cumhurbaşkanı') ||
           content.includes('başbakan') || content.includes('belediye') || content.includes('vali') ||
           content.includes('kaymakam') || content.includes('müsteşar') || content.includes('genel müdür')) {
    articleCategory = "Siyaset";
  }
  // Dünya kategorisi
  else if (content.includes('dünya') || content.includes('amerika') || content.includes('avrupa') ||
           content.includes('rusya') || content.includes('çin') || content.includes('almanya') ||
           content.includes('fransa') || content.includes('ingiltere') || content.includes('japonya') ||
           content.includes('kore') || content.includes('hindistan') || content.includes('brezilya') ||
           content.includes('mısır') || content.includes('iran') || content.includes('israil') ||
           content.includes('filistin') || content.includes('ukrayna') || content.includes('suriye')) {
    articleCategory = "Dünya";
  }
  // Kültür Sanat kategorisi
  else if (content.includes('kültür') || content.includes('sanat') || content.includes('müzik') ||
           content.includes('film') || content.includes('dizi') || content.includes('kitap') ||
           content.includes('yazar') || content.includes('şarkıcı') || content.includes('oyuncu') ||
           content.includes('türkü') || content.includes('konser') || content.includes('sergi') ||
           content.includes('tiyatro') || content.includes('opera') || content.includes('bale')) {
    articleCategory = "Kültür Sanat";
  }
  // Eğitim kategorisi
  else if (content.includes('eğitim') || content.includes('okul') || content.includes('üniversite') ||
           content.includes('öğrenci') || content.includes('öğretmen') || content.includes('ders') ||
           content.includes('sınav') || content.includes('yks') || content.includes('ales') ||
           content.includes('kpss') || content.includes('dgs') || content.includes('yök') ||
           content.includes('meb') || content.includes('öğretim') || content.includes('akademik')) {
    articleCategory = "Eğitim";
  }

  return articleCategory;
}

module.exports = { classifyCategory };

