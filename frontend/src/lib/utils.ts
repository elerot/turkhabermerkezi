import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// HTML entity'leri decode etmek için fonksiyon
export function decodeHtmlEntities(text: string): string {
  if (!text) return text;
  
  // HTML entity'leri decode et
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

// Alternatif olarak, server-side rendering için
export function decodeHtmlEntitiesServer(text: string): string {
  if (!text) return text;
  
  // Yaygın HTML entity'leri decode et
  const htmlEntities: { [key: string]: string } = {
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
    '&notin;': 'notin',
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
    '&sdot;': 'dot',
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
    '&crarr;': 'cr',
    '&lArr;': '<=',
    '&uArr;': '^',
    '&rArr;': '=>',
    '&dArr;': 'v',
    '&hArr;': '<=>',
    '&forall;': 'forall',
    '&exist;': 'exists',
    '&minus;': '-',
    '&lowast;': '*',
    '&prop;': 'prop',
    '&ang;': 'ang',
    '&and;': 'and',
    '&or;': 'or',
    '&there4;': 'therefore',
    '&sim;': '~',
    '&cong;': 'cong',
    '&equiv;': 'equiv',
    '&nsub;': 'nsub'
  };

  let decodedText = text;

  // HTML entity'leri decode et
  Object.keys(htmlEntities).forEach(entity => {
    decodedText = decodedText.replace(new RegExp(entity, 'g'), htmlEntities[entity]);
  });

  // Numeric HTML entity'leri de decode et (&#39; gibi)
  decodedText = decodedText.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });

  // Hexadecimal HTML entity'leri de decode et (&#x27; gibi)
  decodedText = decodedText.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decodedText;
}
