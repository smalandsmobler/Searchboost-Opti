-- ============================================================
-- Kompetensutveckla.se — Meta-titel & beskrivningsoptimering
-- Datum: 2026-02-15
-- Syfte: Optimera CTR pa top-8 sokord (forvantat +80-130 klick/man)
-- VIKTIGT: Ta backup innan! Kor mot kompetens_wp168.www_postmeta
-- ============================================================

-- 1. AFS-huvudsidan (ID 2349, slug: afs)
-- Sokord: "afs" — pos 2.9, 1156 visn/man, 0 klick
-- Nuvarande: "Arbetsmiljoverketsforeskrifter (komplett li..."
UPDATE www_postmeta SET meta_value = 'AFS 2026 — Alla foreskrifter fran Arbetsmiljoverket | Lista'
WHERE post_id = 2349 AND meta_key = 'rank_math_title';

UPDATE www_postmeta SET meta_value = 'Komplett lista over alla AFS-foreskrifter fran Arbetsmiljoverket. Hitta ratt foreskrift, las sammanfattningar och ladda ner PDF. Uppdaterad 2026.'
WHERE post_id = 2349 AND meta_key = 'rank_math_description';

-- 2. BAM-huvudsidan (ID 8370, slug: bam)
-- Sokord: "bam" — pos 3.5, 288 visn/man, 1 klick
-- Nuvarande: "BAM - Battre Arbetsmiljo ar en grundutbildning i a..."
UPDATE www_postmeta SET meta_value = 'BAM Utbildning 2026 — Online & klassrum fran 2 495 kr'
WHERE post_id = 8370 AND meta_key = 'rank_math_title';

UPDATE www_postmeta SET meta_value = 'Boka BAM - Battre Arbetsmiljo. Valj mellan webbutbildning, lararlett online eller klassrum. Over 40 orter. Fran 2 495 kr exkl moms. Certifikat ingar.'
WHERE post_id = 8370 AND meta_key = 'rank_math_description';

-- 3. BAM 2 dagar (ID 320, slug: bam-battre-arbetsmiljo-2-dagar)
-- Sokord: "bam utbildning" — pos ~5, hog sokvolym
UPDATE www_postmeta SET meta_value = 'BAM Utbildning 2 Dagar — Klassrum pa 40+ orter | Boka 2026'
WHERE post_id = 320 AND meta_key = 'rank_math_title';

UPDATE www_postmeta SET meta_value = 'BAM - Battre Arbetsmiljo, 2 dagars klassrumsutbildning. Certifierad grundkurs i arbetsmiljo for chefer och skyddsombud. Boka plats idag.'
WHERE post_id = 320 AND meta_key = 'rank_math_description';

-- 4. Sakra Lyft (ID 5762, slug: sakra-lyft)
-- Sokord: "sakra lyft utbildning" — pos 3.3, 273 visn, 1 klick
-- Nuvarande titel: "Sakra Lyft Utbildning — Webbutbildning | Boka onli..."
-- Nuvarande desc: "Sakra lyft utbildning online. Lar dig korrekt lyft..."
UPDATE www_postmeta SET meta_value = 'Sakra Lyft Utbildning Online 2026 — Certifikat pa 1 dag'
WHERE post_id = 5762 AND meta_key = 'rank_math_title';

UPDATE www_postmeta SET meta_value = 'Sakra lyft webbutbildning — lar dig korrekt lyftteknik och riskbedomning. 1 dags lararlett utbildning online. Certifikat ingar. Boka idag.'
WHERE post_id = 5762 AND meta_key = 'rank_math_description';

-- 5. KEDS (ID 5478, slug: keds)
-- Sokord: "keds tolkning" — pos 1.2, 70 visn, 3 klick (redan pos 1!)
-- Nuvarande titel: "Keds — Vad det ar, regler & tips | Kompetensutveck..."
-- Nuvarande desc: "Allt du behover veta om keds. Gratis guide med che..."
UPDATE www_postmeta SET meta_value = 'KEDS — Tolkning, poangskala & gratis test | Guide 2026'
WHERE post_id = 5478 AND meta_key = 'rank_math_title';

UPDATE www_postmeta SET meta_value = 'Komplett guide till KEDS (Karolinska Exhaustion Disorder Scale). Sa tolkar du resultatet, poangskala, atgarder vid hog poang. Gratis KEDS-test online.'
WHERE post_id = 5478 AND meta_key = 'rank_math_description';

-- 5b. KEDS-TEST (ID 13040, slug: keds-test) — stodjer "keds test" sokord
-- Nuvarande titel: "Keds-test, ett verktyg for att tidigt upptacka tec..."
-- Nuvarande desc: "Hur nara ar du att drabbas av utmattning? Fa en vi..."
UPDATE www_postmeta SET meta_value = 'KEDS-test Online — Gratis utmattningstest | Resultat direkt'
WHERE post_id = 13040 AND meta_key = 'rank_math_title';

UPDATE www_postmeta SET meta_value = 'Gor KEDS-testet gratis online. 9 fragor som mater din risk for utmattningssyndrom. Fa ditt resultat direkt med tolkning och rekommenderade atgarder.'
WHERE post_id = 13040 AND meta_key = 'rank_math_description';

-- 6. Friskfaktorer (ID 565, slug: friskfaktorer)
-- Sokord: "friskfaktorer" — pos 3.3, 193 visn, 3 klick
-- Nuvarande titel: "Friskfaktorer — 8 nycklar till hallbar arbetsmiljo"
-- Nuvarande desc: "Vad ar friskfaktorer och hur anvander du dem? Las ..."
UPDATE www_postmeta SET meta_value = 'Friskfaktorer — 8 nycklar till hallbar arbetsmiljo | Guide 2026'
WHERE post_id = 565 AND meta_key = 'rank_math_title';

UPDATE www_postmeta SET meta_value = 'Las om de 8 friskfaktorerna som bygger en hallbar arbetsmiljo. Konkreta exempel, checklistor och tips for att implementera friskfaktorer pa din arbetsplats.'
WHERE post_id = 565 AND meta_key = 'rank_math_description';

-- 7. SAM — Systematiskt Arbetsmiljoarbete (ID 183, slug: sam-systematiskt-arbetsmiljoarbete)
-- Sokord: "sam utbildning" — hog relevans
-- Nuvarande titel: "SAM-utbildning — Systematiskt arbetsmiljoarbete (1..."
-- Nuvarande desc: "SAM-utbildning i systematiskt arbetsmiljoarbete. W..."
-- OBS: ID 8115 (slug: sam, page) har NULL rm_title/rm_desc — SKAPA nya rader
UPDATE www_postmeta SET meta_value = 'SAM Utbildning 2026 — Systematiskt Arbetsmiljoarbete | 1 dag'
WHERE post_id = 183 AND meta_key = 'rank_math_title';

UPDATE www_postmeta SET meta_value = 'SAM-utbildning i systematiskt arbetsmiljoarbete. 1 dags lararlett kurs online eller klassrum. For chefer och skyddsombud. Certifikat ingar.'
WHERE post_id = 183 AND meta_key = 'rank_math_description';

-- 7b. SAM huvudsida (ID 8115, slug: sam) — saknar Rank Math-meta, BEHOVER INSERT
-- Kor denna SELECT for att se om det redan finns rader:
-- SELECT * FROM www_postmeta WHERE post_id = 8115 AND meta_key IN ('rank_math_title','rank_math_description');
-- Om inga rader: kor INSERT istallet:
INSERT INTO www_postmeta (post_id, meta_key, meta_value) VALUES
(8115, 'rank_math_title', 'SAM — Systematiskt Arbetsmiljoarbete | Utbildningar & guide'),
(8115, 'rank_math_description', 'Allt om SAM - Systematiskt Arbetsmiljoarbete. Utbildningar online och klassrum, mallar, checklistor och lagkrav. Boka SAM-utbildning fran 2 495 kr.');

-- 8. OSA — Organisatorisk och Social Arbetsmiljo (ID 9903, slug: osa)
-- Sokord: "osa utbildning" — hog relevans
-- Nuvarande titel: "OSA ar lika viktiga som den fysiska arbetsmiljon f..."
-- Nuvarande desc: "OSA ar en viktigt for att sakerstalla att arbetsta..."
UPDATE www_postmeta SET meta_value = 'OSA Utbildning 2026 — Organisatorisk & Social Arbetsmiljo'
WHERE post_id = 9903 AND meta_key = 'rank_math_title';

UPDATE www_postmeta SET meta_value = 'Utbildningar i OSA - Organisatorisk och Social Arbetsmiljo. Online och klassrum. Uppfyll AFS 2015:4. For chefer, HR och skyddsombud. Boka idag.'
WHERE post_id = 9903 AND meta_key = 'rank_math_description';

-- 8b. OSA Online (ID 5066, slug: osa-online)
-- Nuvarande titel: "OSA Online - Organisatorisk och Social Arbetsmiljo..."
-- Nuvarande desc: "OSA Online – En lararlett onlineutbildning i Organ..."
UPDATE www_postmeta SET meta_value = 'OSA Online Utbildning 2026 — Lararlett webbutbildning | 1 dag'
WHERE post_id = 5066 AND meta_key = 'rank_math_title';

UPDATE www_postmeta SET meta_value = 'OSA utbildning online — lararlett webbutbildning i organisatorisk och social arbetsmiljo. 1 dag, certifikat ingar. Uppfyll AFS 2015:4. Boka nu.'
WHERE post_id = 5066 AND meta_key = 'rank_math_description';

-- 9. Kompetensutveckling-sidan (ID 9003, slug: kompetensutveckling)
-- Sokord: "kompetensutveckling" — 880 visn/man, hog konkurrens
-- Nuvarande titel: "Kompetensutveckling — Guide for foretag | Tips &am..."
-- Nuvarande desc: "Allt om kompetensutveckling for foretag och anstal..."
UPDATE www_postmeta SET meta_value = 'Kompetensutveckling 2026 — Guide, tips & utbildningar for foretag'
WHERE post_id = 9003 AND meta_key = 'rank_math_title';

UPDATE www_postmeta SET meta_value = 'Komplett guide till kompetensutveckling for foretag. Strategier, bidrag, utbildningsformer och konkreta tips for att utveckla dina medarbetare. Uppdaterad 2026.'
WHERE post_id = 9003 AND meta_key = 'rank_math_description';

-- ============================================================
-- SAMMANFATTNING — 11 sidor, 23 UPDATE + 1 INSERT
-- ============================================================
-- ID 2349: AFS
-- ID 8370: BAM (huvudsida)
-- ID 320:  BAM 2 dagar
-- ID 5762: Sakra Lyft
-- ID 5478: KEDS
-- ID 13040: KEDS-test
-- ID 565:  Friskfaktorer
-- ID 183:  SAM (utbildningssida)
-- ID 8115: SAM (huvudsida) — INSERT, saknade Rank Math-meta
-- ID 9903: OSA (huvudsida)
-- ID 5066: OSA Online
-- ID 9003: Kompetensutveckling
--
-- Forvantat resultat: +80-130 extra klick/manad fran forbattrad CTR
-- ============================================================
