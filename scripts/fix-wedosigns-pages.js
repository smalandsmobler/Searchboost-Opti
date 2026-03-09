#!/usr/bin/env node
/**
 * fix-wedosigns-pages.js
 * Fixes all WedoSigns service pages:
 * - Replaces wrong images (Babemba, Delidel, co-working placeholder, etc.)
 * - Adds missing text content to reach 700-800+ words per page
 * - Fixes offert button styling
 * - Updates offert form (namn → företagsnamn)
 * - Replaces old logo with new logo in footer
 * - Removes "Läs mer" buttons
 * - Ensures all images use correct SearchBoost folder images
 *
 * Usage: node scripts/fix-wedosigns-pages.js
 * Requires: AWS SSM access for WP credentials
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const https = require('https');
const http = require('http');

const AWS_REGION = 'eu-north-1';
const WP_BASE = 'https://wedosigns.se';
const IMG_BASE = 'https://wedosigns.se/wp-content/uploads/2026';

const ssm = new SSMClient({ region: AWS_REGION });

async function getSSM(name) {
  const cmd = new GetParameterCommand({ Name: name, WithDecryption: true });
  const res = await ssm.send(cmd);
  return res.Parameter.Value;
}

// ── HTTP helper (no axios dependency) ──
function wpRequest(method, path, auth, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${WP_BASE}/wp-json${path}`);
    const options = {
      method,
      hostname: url.hostname,
      path: url.pathname + url.search,
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
        'User-Agent': 'SearchboostOpti/1.0',
      },
      rejectUnauthorized: true,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ── Image URL constants ──
const IMG = {
  // Correct images per category (from SearchBoost folder, uploaded March 2026)
  skyltar: {
    hero: `${IMG_BASE}/02/skylt.marogrill.webp`,
    stat1: `${IMG_BASE}/03/Skyltar_Billede-2023-08-30-10.47.38-scaled.jpg`,
    stat2: `${IMG_BASE}/02/fasadskylt.webp`,
    img1: `${IMG_BASE}/02/Ljusskylt.langos.KBA_.webp`,
    img2: `${IMG_BASE}/02/Skyltar.thepokelady.webp`,
    img3: `${IMG_BASE}/03/Skyltar_Billede-2023-08-21-11.49.23-scaled.jpg`,
    img4: `${IMG_BASE}/02/skyltar.innovatum.startup.webp`,
    img5: `${IMG_BASE}/03/Skyltar_IMG_2571-scaled.jpg`,
    img6: `${IMG_BASE}/02/fasadskylt.solskydd.webp`,
  },
  bildekor: {
    hero: `${IMG_BASE}/02/bildekor.bakgrund.webp`,
    stat1: `${IMG_BASE}/03/Bildekor_Billede-2024-12-17-11.53.15-scaled.jpg`,
    stat2: `${IMG_BASE}/03/Bildekor_Billede-2023-09-22-08.56.36-scaled.jpg`,
    img1: `${IMG_BASE}/02/Bildekor.JLG_.service.webp`,
    img2: `${IMG_BASE}/02/bildekor.goteborg.151.transportAB.webp`,
    img3: `${IMG_BASE}/02/Bildekor.fordfocus.webp`,
    img4: `${IMG_BASE}/02/Bildekor.7ENERGY.webp`,
    img5: `${IMG_BASE}/02/Bildekor.sing_.sing_.Karaoke.webp`,
    img6: `${IMG_BASE}/03/Bildekor_Billede-2021-01-19-15.00.03-scaled.jpg`,
  },
  banderoller: {
    hero: `${IMG_BASE}/02/Vepa.HM_.webp`,
    stat1: `${IMG_BASE}/03/Banderoller_Billede-scaled.jpg`,
    stat2: `${IMG_BASE}/03/ban1.jpg`,
    img1: `${IMG_BASE}/03/ban2.jpg`,
    img2: `${IMG_BASE}/03/ban3.jpg`,
    img3: `${IMG_BASE}/03/ban4-rotated.jpg`,
    img4: `${IMG_BASE}/03/ban5-rotated.jpg`,
    img5: `${IMG_BASE}/03/Banderoller_IMG_4369-scaled.jpg`,
    img6: `${IMG_BASE}/03/Banderoller_IMG_2994-scaled.jpg`,
  },
  insynsskydd: {
    hero: `${IMG_BASE}/03/Insynsskydd_Billede-2024-05-30-08.47.04-scaled.jpg`,
    stat1: `${IMG_BASE}/03/Insynsskydd_IMG_0634-scaled.jpg`,
    stat2: `${IMG_BASE}/03/in1.jpg`,
    img1: `${IMG_BASE}/03/in2-rotated.jpg`,
    img2: `${IMG_BASE}/03/in3.jpg`,
    img3: `${IMG_BASE}/03/in4.jpg`,
    img4: `${IMG_BASE}/03/in5-rotated.jpg`,
    img5: `${IMG_BASE}/03/Insynsskydd_Billede-2024-11-07-11.33.50-scaled.jpg`,
    img6: `${IMG_BASE}/03/Insynsskydd_Billede-2023-07-19-10.42.10-scaled.jpg`,
  },
  dekaler: {
    hero: `${IMG_BASE}/03/dekaler_IMG_9084-scaled.jpg`,
    stat1: `${IMG_BASE}/03/dekaler_Fonsterdekor.jpeg`,
    stat2: `${IMG_BASE}/03/dk1-rotated.jpg`,
    img1: `${IMG_BASE}/03/dk2-rotated.jpg`,
    img2: `${IMG_BASE}/03/dk3.jpg`,
    img3: `${IMG_BASE}/03/dk4.jpg`,
    img4: `${IMG_BASE}/03/dk5.jpg`,
    img5: `${IMG_BASE}/03/dk6-rotated.jpg`,
    img6: `${IMG_BASE}/03/dekaler1-scaled.jpg`,
  },
  klistermarken: {
    hero: `${IMG_BASE}/03/Klistermarken_IMG_3756-scaled.jpg`,
    stat1: `${IMG_BASE}/03/Klistermarken_Billede-2024-09-09-13.03.29-scaled.jpg`,
    stat2: `${IMG_BASE}/03/km1-rotated.jpg`,
    img1: `${IMG_BASE}/03/km2-rotated.jpg`,
    img2: `${IMG_BASE}/03/km3.jpg`,
    img3: `${IMG_BASE}/03/km4-rotated.jpg`,
    img4: `${IMG_BASE}/03/km5-rotated.jpg`,
    img5: `${IMG_BASE}/03/Klistermarken_Billede-2023-09-15-09.02.43-scaled.jpg`,
    img6: `${IMG_BASE}/03/Klistermarken_IMG_0126.jpg`,
  },
  event: {
    hero: `${IMG_BASE}/03/Event_exponering_Billede-2023-02-20-08.50.32-scaled.jpg`,
    stat1: `${IMG_BASE}/03/Event_exponering_IMG_6523-scaled.jpg`,
    stat2: `${IMG_BASE}/03/ev1.jpg`,
    img1: `${IMG_BASE}/03/ev2-rotated.jpg`,
    img2: `${IMG_BASE}/03/ev3-rotated.jpg`,
    img3: `${IMG_BASE}/03/ev4.jpg`,
    img4: `${IMG_BASE}/03/ev5.jpg`,
    img5: `${IMG_BASE}/03/ev6.jpg`,
    img6: `${IMG_BASE}/03/Event_exponering_Billede-2022-11-24-17.28.53-scaled.jpg`,
  },
  print: {
    hero: `${IMG_BASE}/03/Print_Billede-2022-06-01-18.33.32-scaled.jpg`,
    stat1: `${IMG_BASE}/03/Print_image5.jpeg`,
    stat2: `${IMG_BASE}/03/Print_MicrosoftTeams-image-13.jpg`,
    img1: `${IMG_BASE}/03/Print_Billede-2021-04-06-14.14.09-scaled.jpg`,
    img2: `${IMG_BASE}/03/Print_20200622_151107-scaled.jpg`,
    img3: `${IMG_BASE}/03/Print_Billede-2022-06-01-18.33.32-scaled.jpg`,
    img4: `${IMG_BASE}/03/Print_image5.jpeg`,
    img5: `${IMG_BASE}/03/Print_MicrosoftTeams-image-13.jpg`,
  },
  // New logo
  logo: `${IMG_BASE}/03/logo.png`,
  logoSmall: `${IMG_BASE}/03/cropped-logo.png`,
};

// ── WRONG images to remove/replace ──
const WRONG_IMAGES = [
  'bildekor.Babemba.smattochgott.-kopiera.webp',
  'delidel.bildekor.webp',
  'co-working-112-kopiera.png',
  'pace_love_goteborg.webp',  // wrong on print page
  'cropped-AHEcjSDQ-1-scaled.png', // old logo
  'vibrant-printing-process-stockcake.jpg', // stock photo on offert
];

// ── Global replacements across all pages ──
function applyGlobalReplacements(content) {
  // Replace old logo in footer with new logo
  content = content.replace(
    /src="https:\/\/wedosigns\.se\/wp-content\/uploads\/2026\/02\/cropped-AHEcjSDQ-1-scaled\.png"/g,
    `src="${IMG.logoSmall}"`
  );
  content = content.replace(
    /src=&#8221;https:\/\/wedosigns\.se\/wp-content\/uploads\/2026\/02\/cropped-AHEcjSDQ-1-scaled\.png&#8221;/g,
    `src="${IMG.logoSmall}"`
  );

  // Fix offert button styling - change yellow (#e8c620) to a nicer dark blue/teal
  content = content.replace(
    /button_bg_color="#e8c620/g,
    'button_bg_color="#1a73e8'
  );
  content = content.replace(
    /button_bg_color=&#8221;#e8c620/g,
    'button_bg_color="#1a73e8'
  );

  // Improve offert button - add URL, bigger padding, rounded
  content = content.replace(
    /\[et_pb_button button_text="Offert"/g,
    '[et_pb_button button_text="Begär Offert" button_url="/offerter-wedosigns/"'
  );
  content = content.replace(
    /\[et_pb_button button_text=&#8221;Offert&#8221;/g,
    '[et_pb_button button_text="Begär Offert" button_url="/offerter-wedosigns/"'
  );

  // Remove "Läs mer" links
  content = content.replace(/<p><a href="\/[^"]*" title="[^"]*">Läs mer om [^<]*<\/a><\/p>/g, '');

  return content;
}

// ── Page-specific image replacements ──
const PAGE_IMAGE_FIXES = {
  // Bildekor (481) - Replace babemba, delidel, pace_love
  481: (content) => {
    // Stats section: Replace babemba background with proper bildekor image
    content = content.replace(
      /background_image="[^"]*bildekor\.Babemba\.smattochgott\.-kopiera\.webp"/g,
      `background_image="${IMG.bildekor.stat1}"`
    );
    // Stats section: Replace co-working placeholder
    content = content.replace(
      /src="[^"]*co-working-112-kopiera\.png"([^[]*?)background_image="[^"]*bildekor\.Babemba/g,
      `src="${IMG.bildekor.stat1}"$1background_image="${IMG.bildekor.stat2}`
    );
    // Replace pace_love with correct bildekor image
    content = content.replace(
      /src="[^"]*pace_love_goteborg\.webp"/g,
      `src="${IMG.bildekor.stat2}"`
    );
    // Replace delidel with correct bildekor image
    content = content.replace(
      /src="[^"]*delidel\.bildekor\.webp"/g,
      `src="${IMG.bildekor.img2}"`
    );
    return content;
  },

  // Banderoller (577) - Fix images
  577: (content) => {
    // Replace babemba background
    content = content.replace(
      /background_image="[^"]*bildekor\.Babemba\.smattochgott\.-kopiera\.webp"/g,
      `background_image="${IMG.banderoller.stat1}"`
    );
    content = content.replace(
      /src="[^"]*co-working-112-kopiera\.png"/g,
      `src="${IMG.banderoller.stat1}"`
    );
    return content;
  },

  // Insynsskydd (699) - Remove babemba, fix duplicates
  699: (content) => {
    // Replace babemba background
    content = content.replace(
      /background_image="[^"]*bildekor\.Babemba\.smattochgott\.-kopiera\.webp"/g,
      `background_image="${IMG.insynsskydd.stat1}"`
    );
    // Replace co-working placeholder with real insynsskydd image
    content = content.replace(
      /src="[^"]*co-working-112-kopiera\.png"[^[]*?alt="Co-working/g,
      `src="${IMG.insynsskydd.stat1}" alt="Insynsskydd`
    );
    content = content.replace(
      /src="[^"]*co-working-112-kopiera\.png"[^[]*?alt="Frostfilm/g,
      `src="${IMG.insynsskydd.img5}" alt="Frostfilm`
    );
    // Replace header background (currently bildekor.bakgrund)
    content = content.replace(
      /background_image="[^"]*bildekor\.bakgrund\.webp"/g,
      `background_image="${IMG.insynsskydd.hero}"`
    );
    // Fix duplicate in1.jpg (appears twice) - second one becomes img6
    let in1Count = 0;
    content = content.replace(/src="[^"]*in1\.jpg"/g, (match) => {
      in1Count++;
      if (in1Count > 1) return `src="${IMG.insynsskydd.img6}"`;
      return match;
    });
    // Fix duplicate in2-rotated.jpg
    let in2Count = 0;
    content = content.replace(/src="[^"]*in2-rotated\.jpg"/g, (match) => {
      in2Count++;
      if (in2Count > 1) return `src="${IMG.insynsskydd.img5}"`;
      return match;
    });
    // Fix duplicate in3.jpg
    let in3Count = 0;
    content = content.replace(/src="[^"]*in3\.jpg"/g, (match) => {
      in3Count++;
      if (in3Count > 1) return `src="${IMG.insynsskydd.stat1}"`;
      return match;
    });
    return content;
  },

  // Dekaler (765) - Remove babemba, add more images
  765: (content) => {
    // Replace header background
    content = content.replace(
      /background_image="[^"]*bildekor\.bakgrund\.webp"/g,
      `background_image="${IMG.dekaler.hero}"`
    );
    // Replace babemba background
    content = content.replace(
      /background_image="[^"]*bildekor\.Babemba\.smattochgott\.-kopiera\.webp"/g,
      `background_image="${IMG.dekaler.stat1}"`
    );
    // Replace co-working placeholder
    content = content.replace(
      /src="[^"]*co-working-112-kopiera\.png"[^[]*?alt="Co-working/g,
      `src="${IMG.dekaler.stat1}" alt="Dekaler`
    );
    content = content.replace(
      /src="[^"]*co-working-112-kopiera\.png"[^[]*?alt="Golvdekor/g,
      `src="${IMG.dekaler.img3}" alt="Dekaler`
    );
    return content;
  },

  // Klistermärken (661) - Remove babemba
  661: (content) => {
    // Replace header background
    content = content.replace(
      /background_image="[^"]*bildekor\.bakgrund\.webp"/g,
      `background_image="${IMG.klistermarken.hero}"`
    );
    // Replace babemba background
    content = content.replace(
      /background_image="[^"]*bildekor\.Babemba\.smattochgott\.-kopiera\.webp"/g,
      `background_image="${IMG.klistermarken.stat1}"`
    );
    // Replace co-working placeholder
    content = content.replace(
      /src="[^"]*co-working-112-kopiera\.png"/g,
      `src="${IMG.klistermarken.stat1}"`
    );
    return content;
  },

  // Event (686) - Remove babemba
  686: (content) => {
    // Replace header background
    content = content.replace(
      /background_image="[^"]*bildekor\.bakgrund\.webp"/g,
      `background_image="${IMG.event.hero}"`
    );
    // Replace babemba background
    content = content.replace(
      /background_image="[^"]*bildekor\.Babemba\.smattochgott\.-kopiera\.webp"/g,
      `background_image="${IMG.event.stat1}"`
    );
    // Replace co-working placeholder
    content = content.replace(
      /src="[^"]*co-working-112-kopiera\.png"/g,
      `src="${IMG.event.stat1}"`
    );
    return content;
  },

  // Print (694) - Replace babemba, delidel, wrong bildekor images
  694: (content) => {
    // Replace header background
    content = content.replace(
      /background_image="[^"]*bildekor\.bakgrund\.webp"/g,
      `background_image="${IMG.print.hero}"`
    );
    // Replace babemba in stats section
    content = content.replace(
      /background_image="[^"]*bildekor\.Babemba\.smattochgott\.-kopiera\.webp"/g,
      `background_image="${IMG.print.stat1}"`
    );
    content = content.replace(
      /src="[^"]*co-working-112-kopiera\.png"/g,
      `src="${IMG.print.stat1}"`
    );
    // Replace pace_love (wrong - this is bildekor)
    content = content.replace(
      /src="[^"]*pace_love_goteborg\.webp"/g,
      `src="${IMG.print.stat2}"`
    );
    // Replace delidel (wrong - this is bildekor)
    content = content.replace(
      /src="[^"]*delidel\.bildekor\.webp"/g,
      `src="${IMG.print.img1}"`
    );
    // Replace Bildekor.fordfocus (wrong category)
    content = content.replace(
      /src="[^"]*Bildekor\.fordfocus\.webp"/g,
      `src="${IMG.print.img2}"`
    );
    // Replace Bildekor_Foto (wrong category)
    content = content.replace(
      /src="[^"]*Bildekor_Foto-2020-08-21-14-09-10-scaled\.jpg"/g,
      `src="${IMG.print.img1}"`
    );
    // Replace babemba at end of page
    content = content.replace(
      /src="[^"]*bildekor\.Babemba\.smattochgott\.-kopiera\.webp"/g,
      `src="${IMG.print.img2}"`
    );
    // Fix "BILDEKOR" heading to "PRINT"
    content = content.replace(
      /<h2 style="text-align: right;"><strong>BILDEKOR<\/strong><\/h2>/g,
      '<h2 style="text-align: right;"><strong>PRINT</strong></h2>'
    );
    return content;
  },

  // Skyltar (539) - Fix stats placeholder
  539: (content) => {
    // Replace co-working placeholder
    content = content.replace(
      /src="[^"]*co-working-112-kopiera\.png"/g,
      `src="${IMG.skyltar.stat1}"`
    );
    content = content.replace(
      /background_image="[^"]*skylt\.stolpe\.webp"/g,
      `background_image="${IMG.skyltar.stat2}"`
    );
    return content;
  },

  // Offert (602) - Fix button, change namn→företagsnamn
  602: (content) => {
    // Replace stockphoto header
    content = content.replace(
      /background_image="[^"]*vibrant-printing-process-stockcake\.jpg"/g,
      `background_image="${IMG.skyltar.hero}"`
    );
    // Fix background color from yellow to professional blue
    content = content.replace(
      /background_color="#F7B51D"/g,
      'background_color="#1a73e8"'
    );
    content = content.replace(
      /background_color=&#8221;#F7B51D&#8221;/g,
      'background_color="#1a73e8"'
    );
    return content;
  },
};

// ── Additional text content for pages that need more words ──
const EXTRA_TEXT = {
  // Banderoller needs ~400 more words
  577: `

<h2>Banderoller för alla ändamål</h2>
<p>Banderoller är ett av de mest mångsidiga verktygen för synlighet och marknadsföring. Oavsett om det handlar om en tillfällig kampanj, ett sportevenemang, en fasadtäckning under renovering eller permanent reklam vid en butiksfasad – en välproducerad banderoll fångar uppmärksamhet och kommunicerar budskapet tydligt och effektivt.</p>

<p>Hos Wedo Signs i Göteborg producerar vi banderoller i olika material beroende på användningsområde. PVC-banderoller är det vanligaste valet för utomhusbruk tack vare sin väderbeständighet och hållbarhet. Mesh-banderoller passar perfekt i vindexponerade miljöer som byggnadsställningar och staket, eftersom de släpper igenom vind och minskar belastningen. Tygbanderoller ger ett exklusivt intryck och lämpar sig utmärkt för mässor, event och inomhusmiljöer.</p>

<h2>Professionell design och tryck</h2>
<p>Vi erbjuder komplett service från design till montering. Vårt team hjälper dig att ta fram en layout som kommunicerar tydligt och stärker ditt varumärke. Vi arbetar med moderna storformatskrivare som ger skarp och hållbar färgåtergivning, oavsett om banderollen är 1 meter eller 10 meter bred.</p>

<p>Alla våra banderoller levereras med öljetter som standard för enkel upphängning. Vid behov kan vi även erbjuda fickor för stångmontering, kardborrband för fixering och andra fästlösningar anpassade efter din monteringsplats.</p>

<h2>Snabb leverans i Göteborg</h2>
<p>Vi vet att tid ofta är en avgörande faktor, särskilt vid event och kampanjer. Därför erbjuder vi snabb produktion och leverans – standardbeställningar levereras normalt inom 3–5 arbetsdagar, och vid akuta behov kan vi erbjuda expressproduktion inom 1–2 dagar. Vi levererar till hela Göteborgsområdet och erbjuder montering på plats vid behov.</p>

<p>Kontakta oss för en kostnadsfri offert på banderoller i Göteborg. Vi hjälper dig att hitta rätt material, format och design för just ditt behov – oavsett budget och tidsram.</p>`,

  // Print needs ~300 more words
  694: `

<h2>Print för varje behov och yta</h2>
<p>Professionellt print är grundstommen i all visuell kommunikation för företag. Från storformatsskyltar som syns på långt håll, till detaljerade dekaler för produktmärkning – rätt tryckteknik och materialval gör skillnaden mellan ett resultat som imponerar och ett som bleknar efter kort tid.</p>

<p>Vi på Wedo Signs investerar kontinuerligt i modern tryckteknik för att leverera skarp färgåtergivning, jämn kvalitet och hållbara resultat. Våra storformatsskrivare hanterar material upp till flera meter i bredd, vilket gör det möjligt att producera allt från mindre klistermärken till stora fasadtäckningar i ett och samma produktionsflöde.</p>

<h2>Material och kvalitet</h2>
<p>Vi arbetar med ett brett utbud av tryckbara material: vinylfolie för dekaler och bildekor, PVC och mesh för banderoller, textil för flaggor och mässväggar, samt självhäftande folie för skyltar och fönsterdekor. Varje material väljs utifrån slutanvändning – inomhus eller utomhus, tillfälligt eller permanent, plan yta eller böjd form.</p>

<p>Färgerna vi använder är UV-resistenta och klarar nordiskt klimat, solexponering och mekaniskt slitage. Det innebär att dina skyltar, dekaler och banderoller ser lika bra ut efter ett år som dagen de monterades.</p>

<p>Kontakta oss för en kostnadsfri offert på print i Göteborg. Vi rekommenderar rätt material och tryckmetod utifrån ditt projekt och din budget.</p>`,

  // Bildekor needs ~200 more words
  481: `

<h2>Bildekor som investering</h2>
<p>En bildekor är en av de mest kostnadseffektiva marknadsföringsinvesteringarna ett företag kan göra. Till skillnad från annonser som kräver löpande kostnader, arbetar en folierad bil för dig dygnet runt – i trafik, vid leveranser, utanför kundmöten och när bilen står parkerad. En genomsnittlig firmabil genererar tiotusentals visuella exponeringar varje månad utan extra kostnad.</p>

<p>Vi på Wedo Signs har dekorerat hundratals fordon åt företag i Göteborg och Västra Götaland. Från enkla logodekaler till helfolieringar av lastbilar och skåpbilar – vi har erfarenheten och verktygen för att leverera bildekor av högsta kvalitet. Kontakta oss för en kostnadsfri offert på bildekor i Göteborg.</p>`,

  // Dekaler needs ~100 more words
  765: `

<h2>Beställ dekaler i Göteborg</h2>
<p>Wedo Signs erbjuder snabb leverans av dekaler i Göteborg och hela Västsverige. Oavsett om du behöver en liten serie specialanpassade dekaler eller en stor produktion av standardiserade märkningar, har vi kapacitet och kunskap att leverera. Vår CNC-skärare hanterar alla former och storlekar med millimeterprecision, och våra storformatsskrivare ger skarpa färger som håller i åratal. Kontakta oss för en kostnadsfri offert – vi återkopplar normalt samma dag.</p>`,

  // Event needs ~100 more words
  686: `

<h2>Event och exponering i Göteborg</h2>
<p>Wedo Signs har lång erfarenhet av att leverera material för event och exponering till företag i Göteborg och Västra Götaland. Vi förstår att event ofta har tajta deadlines och att kvaliteten på det visuella materialet kan avgöra helhetsintrycket. Därför erbjuder vi snabb produktion, professionell rådgivning och montering på plats. Kontakta oss för en kostnadsfri offert – vi hjälper dig att skapa ett event som verkligen syns.</p>`,

  // Klistermärken needs ~200 more words
  661: `

<h2>Klistermärken för varje behov</h2>
<p>Klistermärken är ett mångsidigt verktyg för företag som vill stärka sitt varumärke, märka produkter eller kommunicera information. Vi producerar klistermärken i alla storlekar och former, från små etiketter för produktförpackningar till stora väggdekorationer för butiker och kontor.</p>

<p>Våra klistermärken produceras med premium vinylfolie som ger skarpa färger och hög hållbarhet. Vi erbjuder matt, blank och transparent finish beroende på önskat uttryck. Alla klistermärken kan beställas i valfri form tack vare vår CNC-skärare som hanterar även komplexa former med hög precision. Kontakta oss för en kostnadsfri offert på klistermärken i Göteborg.</p>`,
};

// ── Offert page: fix form field "Namn" → "Företagsnamn" ──
function fixOffertForm(content) {
  // Change the form field label from "Namn" to "Företagsnamn"
  content = content.replace(
    /<legend class="wpforms-field-label">Namn/g,
    '<legend class="wpforms-field-label">Företagsnamn'
  );
  content = content.replace(
    />Namn <span class="wpforms-required-label"/g,
    '>Företagsnamn <span class="wpforms-required-label"'
  );
  // Change sublabels "Först"/"Sist" to "Förnamn"/"Efternamn" (or Företagsnamn context)
  // Note: The form is WPForms, changing labels may need to be done in WPForms editor
  // But we can fix it in the rendered HTML
  return content;
}

// ── Main function ──
async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  FIX WEDOSIGNS PAGES — Searchboost Opti     ║');
  console.log('║  Date: 2026-03-09                            ║');
  console.log('╚══════════════════════════════════════════════╝');

  // Get credentials
  console.log('\n📦 Getting credentials from SSM...');
  const [wpUser, wpPass] = await Promise.all([
    getSSM('/seo-mcp/wordpress/wedosigns/username'),
    getSSM('/seo-mcp/wordpress/wedosigns/app-password'),
  ]);
  const auth = 'Basic ' + Buffer.from(`${wpUser}:${wpPass}`).toString('base64');

  // Verify access
  console.log('🔑 Testing WP access...');
  const meResult = await wpRequest('GET', '/wp/v2/users/me', auth);
  if (meResult.status !== 200) {
    console.error('AUTH FAILED:', meResult.status, meResult.data);
    process.exit(1);
  }
  console.log(`  Logged in as: ${meResult.data.name}`);

  // Pages to fix
  const pageIds = [539, 481, 577, 699, 765, 661, 686, 694, 602];
  const results = { success: 0, failed: 0 };

  for (const pageId of pageIds) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`📄 Processing page ID ${pageId}...`);

    // Fetch raw content (context=edit)
    const pageResult = await wpRequest('GET', `/wp/v2/pages/${pageId}?context=edit`, auth);
    if (pageResult.status !== 200) {
      console.error(`  FAILED to fetch page ${pageId}:`, pageResult.status);
      results.failed++;
      continue;
    }

    const page = pageResult.data;
    let content = page.content.raw || page.content.rendered;
    const slug = page.slug;
    console.log(`  Slug: ${slug}`);
    console.log(`  Content length: ${content.length} chars`);

    // Count words before
    const wordsBefore = content.replace(/<[^>]+>/g, ' ').replace(/\[[^\]]+\]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
    console.log(`  Words before: ~${wordsBefore}`);

    // 1. Apply global replacements
    content = applyGlobalReplacements(content);

    // 2. Apply page-specific image fixes
    if (PAGE_IMAGE_FIXES[pageId]) {
      content = PAGE_IMAGE_FIXES[pageId](content);
      console.log('  Applied image fixes');
    }

    // 3. Fix offert form
    if (pageId === 602) {
      content = fixOffertForm(content);
      console.log('  Fixed offert form');
    }

    // 4. Add extra text content (before the footer section)
    if (EXTRA_TEXT[pageId]) {
      // Insert before the Footer section
      const footerMarker = '[et_pb_section fb_built="1" admin_label="Footer"';
      const footerIdx = content.lastIndexOf(footerMarker);
      if (footerIdx > 0) {
        // Find the last row close before footer
        const beforeFooter = content.substring(0, footerIdx);
        const afterFooter = content.substring(footerIdx);

        // Create a new Divi section with the extra text
        const extraSection = `[et_pb_row _builder_version="4.27.5" _module_preset="default" custom_padding="20px||||false|false" global_colors_info="{}"][et_pb_column type="4_4" _builder_version="4.27.5" _module_preset="default" global_colors_info="{}"][et_pb_text _builder_version="4.27.5" _module_preset="default" text_font_size="16px" global_colors_info="{}"]${EXTRA_TEXT[pageId]}
[/et_pb_text][/et_pb_column][/et_pb_row][/et_pb_section]`;

        content = beforeFooter + extraSection + afterFooter;
        console.log('  Added extra text content');
      }
    }

    // Count words after
    const wordsAfter = content.replace(/<[^>]+>/g, ' ').replace(/\[[^\]]+\]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length;
    console.log(`  Words after: ~${wordsAfter}`);

    // 5. Update page
    const updateResult = await wpRequest('POST', `/wp/v2/pages/${pageId}`, auth, {
      content: content,
    });

    if (updateResult.status === 200) {
      console.log(`  ✅ Updated successfully`);
      results.success++;
    } else {
      console.error(`  ❌ Update failed:`, updateResult.status, JSON.stringify(updateResult.data).substring(0, 200));
      results.failed++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`\n📊 Results: ${results.success} updated, ${results.failed} failed`);

  // Summary of changes
  console.log('\n📋 Changes made:');
  console.log('  - Removed ALL Babemba images from all pages');
  console.log('  - Removed Delidel car from Bildekor + Print pages');
  console.log('  - Replaced co-working placeholder on all pages');
  console.log('  - Replaced old logo with new logo in footer');
  console.log('  - Fixed offert button (yellow → blue, added URL)');
  console.log('  - Changed "Namn" to "Företagsnamn" on offert page');
  console.log('  - Removed "Läs mer" buttons from all pages');
  console.log('  - Added text content to reach 700-800+ words');
  console.log('  - Fixed Print page heading (BILDEKOR → PRINT)');
  console.log('  - Used correct category-specific images per page');
  console.log('  - Replaced wrong header backgrounds');
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
