// HTML entity'leri decode et
function cleanText(text) {
  if (!text) return "";
  
  // HTML entity'leri decode et
  let cleanedText = text
    .replace(/<[^>]*>/g, "") // HTML tag'leri kaldır
    .replace(/\s+/g, " ") // Fazla boşlukları tek boşluğa çevir
    .trim();
  
  // Yaygın HTML entity'leri decode et
  const htmlEntities = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '(c)',
    '&reg;': '(R)',
    '&trade;': '(TM)',
    '&hellip;': '...',
    '&mdash;': '--',
    '&ndash;': '-',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"',
    '&laquo;': '<<',
    '&raquo;': '>>',
    '&times;': 'x',
    '&divide;': '/',
    '&plusmn;': '+/-',
    '&deg;': 'deg',
    '&micro;': 'u',
    '&para;': 'P',
    '&sect;': 'S',
    '&bull;': '*',
    '&middot;': '.',
    '&prime;': "'",
    '&Prime;': '"',
    '&infin;': 'inf',
    '&asymp;': '~',
    '&ne;': '!=',
    '&le;': '<=',
    '&ge;': '>=',
    '&sum;': 'sum',
    '&prod;': 'prod',
    '&radic;': 'sqrt',
    '&int;': 'int',
    '&part;': 'd',
    '&nabla;': 'nabla',
    '&isin;': 'in',
    '&notin;': 'not in',
    '&ni;': 'ni',
    '&empty;': 'empty',
    '&cap;': 'cap',
    '&cup;': 'cup',
    '&sub;': 'sub',
    '&sup;': 'sup',
    '&sube;': 'sube',
    '&supe;': 'supe',
    '&oplus;': 'oplus',
    '&otimes;': 'otimes',
    '&perp;': 'perp',
    '&sdot;': '.',
    '&lceil;': '[',
    '&rceil;': ']',
    '&lfloor;': '[',
    '&rfloor;': ']',
    '&lang;': '<',
    '&rang;': '>',
    '&larr;': '<-',
    '&uarr;': '^',
    '&rarr;': '->',
    '&darr;': 'v',
    '&harr;': '<->',
    '&crarr;': 'enter',
    '&lArr;': '<=',
    '&uArr;': '^',
    '&rArr;': '=>',
    '&dArr;': 'v',
    '&hArr;': '<=>',
    '&forall;': 'forall',
    '&exist;': 'exists',
    '&and;': 'and',
    '&or;': 'or',
    '&there4;': 'therefore',
    '&sim;': '~',
    '&cong;': 'cong',
    '&equiv;': 'equiv',
    '&nsub;': 'not sub',
    '&loz;': 'diamond',
    '&spades;': 'spades',
    '&hearts;': 'hearts',
    '&diams;': 'diamonds',
    '&clubs;': 'clubs'
  };
  
  // HTML entity'leri decode et
  Object.keys(htmlEntities).forEach(entity => {
    cleanedText = cleanedText.replace(new RegExp(entity, 'g'), htmlEntities[entity]);
  });
  
  // Numeric HTML entity'leri de decode et (&#39; gibi)
  cleanedText = cleanedText.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });
  
  // Hexadecimal HTML entity'leri de decode et (&#x27; gibi)
  cleanedText = cleanedText.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  return cleanedText;
}

module.exports = { cleanText };

