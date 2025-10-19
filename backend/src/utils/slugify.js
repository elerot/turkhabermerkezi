// Türkçe karakterleri koruyan slug oluşturma fonksiyonu
function createTurkishSlug(text) {
  const turkishCharMap = {
    'ç': 'c', 'Ç': 'C',
    'ğ': 'g', 'Ğ': 'G',
    'ı': 'i', 'I': 'I',
    'İ': 'I', 'i': 'i',
    'ö': 'o', 'Ö': 'O',
    'ş': 's', 'Ş': 'S',
    'ü': 'u', 'Ü': 'U'
  };
  
  let slug = text;
  
  // Türkçe karakterleri değiştir
  Object.keys(turkishCharMap).forEach(char => {
    slug = slug.replace(new RegExp(char, 'g'), turkishCharMap[char]);
  });
  
  // Küçük harfe çevir ve URL-friendly yap
  return slug
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

module.exports = { createTurkishSlug };

