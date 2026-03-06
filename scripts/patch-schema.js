#!/usr/bin/env node
/**
 * patch-schema.js
 * Lägger till saknad strukturerad data i HTML-filer som redan har ld+json.
 * Kör: node scripts/patch-schema.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, '..', 'content-pages');

const ORG_BLOCK = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Searchboost",
    "url": "https://searchboost.se/",
    "logo": "https://searchboost.se/wp-content/uploads/searchboost-logo.png",
    "description": "Sveriges SEO-byrå för småföretag. Vi hjälper lokala företag att synas på Google.",
    "email": "mikael@searchboost.se",
    "areaServed": "SE",
    "sameAs": [
      "https://www.linkedin.com/company/searchboost",
      "https://www.facebook.com/searchboostse"
    ]
  }
  </script>`;

// FAQ för case-studies (generisk men relevant)
function caseFaqBlock(title, url) {
  return `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Hur lång tid tog det att se resultat?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "I det här case studyt syntes tydliga förbättringar inom 3-4 månader. Generellt ser de flesta kunder mätbara resultat i organisk trafik och sökordspositioner inom 2-4 månader av aktivt SEO-arbete."
        }
      },
      {
        "@type": "Question",
        "name": "Vilka SEO-åtgärder hade störst effekt?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Teknisk SEO-grund (laddningstid, mobilanpassning), optimerade title tags och meta descriptions kombinerat med målgruppsanpassat innehåll och intern länkstruktur gav störst genomslag."
        }
      },
      {
        "@type": "Question",
        "name": "Kan Searchboost leverera liknande resultat för mitt företag?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Resultat varierar beroende på bransch, konkurrens och nuvarande SEO-status. Vi erbjuder alltid en kostnadsfri SEO-analys innan vi påbörjar arbetet så att vi kan ge realistiska förväntningar. Kontakta oss på mikael@searchboost.se."
        }
      }
    ]
  }
  </script>`;
}

function hasType(html, type) {
  return html.includes(`"@type": "${type}"`);
}

function injectBeforeClosingHead(html, block) {
  return html.replace('</head>', `${block}\n</head>`);
}

let patched = 0;
let skipped = 0;

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  const name = path.basename(filePath);

  // 1. Lägg till Organization om den saknas (alla filer utom lokala som har LocalBusiness)
  const isLokal = filePath.includes('/lokala/');
  if (!hasType(html, 'Organization') && !isLokal) {
    html = injectBeforeClosingHead(html, ORG_BLOCK);
    changed = true;
    console.log(`  + Organization → ${name}`);
  }

  // 2. Lägg till FAQPage på case-studies om den saknas
  const isCaseStudy = filePath.includes('/case-studies/');
  if (isCaseStudy && !hasType(html, 'FAQPage')) {
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : name;
    const canonicalMatch = html.match(/rel="canonical" href="([^"]+)"/i);
    const url = canonicalMatch ? canonicalMatch[1] : '';
    html = injectBeforeClosingHead(html, caseFaqBlock(title, url));
    changed = true;
    console.log(`  + FAQPage → ${name}`);
  }

  // 3. seo-ordlista saknar FAQPage — lägg till en med ordliste-frågor
  if (name === 'seo-ordlista.html' && !hasType(html, 'FAQPage')) {
    const faqOrdlista = `
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Vad är SEO?",
        "acceptedAnswer": { "@type": "Answer", "text": "SEO (Search Engine Optimization) är processen att optimera en webbplats för att ranka högre i Googles organiska sökresultat och därigenom öka relevant trafik." }
      },
      {
        "@type": "Question",
        "name": "Vad är en backlink?",
        "acceptedAnswer": { "@type": "Answer", "text": "En backlink är en inkommande länk från en annan webbplats. Google ser backlinks som rekommendationer — fler kvalitativa backlinks ökar din domänauktoritet och rankning." }
      },
      {
        "@type": "Question",
        "name": "Vad betyder SERP?",
        "acceptedAnswer": { "@type": "Answer", "text": "SERP (Search Engine Results Page) är den sida Google visar efter en sökning. Den innehåller organiska resultat, annonser, featured snippets, Local Pack och andra sökfunktioner." }
      },
      {
        "@type": "Question",
        "name": "Vad är Core Web Vitals?",
        "acceptedAnswer": { "@type": "Answer", "text": "Core Web Vitals är Googles mätetal för användarupplevelse: LCP (laddningstid), INP (interaktivitet) och CLS (layoutstabilitet). Dessa är direkta rankingfaktorer sedan 2021." }
      }
    ]
  }
  </script>`;
    html = injectBeforeClosingHead(html, faqOrdlista);
    changed = true;
    console.log(`  + FAQPage (ordlista) → ${name}`);
  }

  if (changed) {
    fs.writeFileSync(filePath, html, 'utf8');
    patched++;
  } else {
    skipped++;
  }
}

// Kör på alla HTML-filer rekursivt
function walkDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(full);
    else if (entry.name.endsWith('.html')) processFile(full);
  }
}

console.log('=== patch-schema.js ===\n');
walkDir(CONTENT_DIR);
console.log(`\nKlar — patchade: ${patched}, oförändrade: ${skipped}`);
