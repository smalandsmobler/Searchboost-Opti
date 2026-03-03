<?php
/**
 * Plugin Name: SB WeDoSigns Schema
 * Description: LocalBusiness + Service + FAQ schema för wedosigns.se
 * Version: 1.1
 * Author: Searchboost
 */

// === 1. LocalBusiness schema på startsidan ===
add_filter('rank_math/json_ld', 'sb_wedosigns_localbusiness', 99, 2);
function sb_wedosigns_localbusiness($data, $jsonld) {
    if (!is_front_page()) return $data;

    $data['LocalBusiness'] = array(
        '@type'           => 'LocalBusiness',
        '@id'             => 'https://wedosigns.se/#localbusiness',
        'name'            => 'Wedo Signs',
        'alternateName'   => 'WeDoSigns',
        'description'     => 'Skyltföretag i Göteborg. Tillverkar plåtskyltar, ljusskyltar, bildekor, folie, banderoller och trycksaker för företag.',
        'url'             => 'https://wedosigns.se/',
        'telephone'       => '+46793020787',
        'email'           => 'info@wedosigns.se',
        'address'         => array(
            '@type'           => 'PostalAddress',
            'streetAddress'   => 'Datavägen 14B',
            'addressLocality' => 'Askim',
            'postalCode'      => '436 32',
            'addressRegion'   => 'Västra Götaland',
            'addressCountry'  => 'SE',
        ),
        'geo' => array(
            '@type'     => 'GeoCoordinates',
            'latitude'  => 57.6322,
            'longitude' => 11.9628,
        ),
        'priceRange'         => '$$',
        'currenciesAccepted' => 'SEK',
        'paymentAccepted'    => 'Faktura, Kort, Swish',
        'areaServed' => array(
            '@type' => 'City',
            'name'  => 'Göteborg',
        ),
        'openingHoursSpecification' => array(
            array(
                '@type'     => 'OpeningHoursSpecification',
                'dayOfWeek' => array('Monday','Tuesday','Wednesday','Thursday','Friday'),
                'opens'     => '08:00',
                'closes'    => '17:00',
            ),
        ),
    );

    return $data;
}

// === 2. Service schema på alla tjänstesidor ===
add_filter('rank_math/json_ld', 'sb_wedosigns_service_schema', 99, 2);
function sb_wedosigns_service_schema($data, $jsonld) {
    if (!is_singular('page') || is_front_page()) return $data;

    $services = array(
        'skyltar-goteborg'          => array('Skyltar i Göteborg', 'Professionell skyltproduktion — plåtskyltar, ljusskyltar, flaggskyltar och fasadskyltar i Göteborg.', 'Skyltproduktion'),
        'platskyltar-goteborg'      => array('Plåtskyltar i Göteborg', 'Hållbara plåtskyltar för fasad, entré och vägvisning. Pulverlackerade med lång livslängd.', 'Plåtskyltar'),
        'ljusskyltar-goteborg'      => array('Ljusskyltar i Göteborg', 'LED-belysta ljusskyltar för fasad och skyltfönster. Energieffektiva med hög synlighet.', 'Ljusskyltar'),
        'namnskyltar-goteborg'      => array('Namnskyltar i Göteborg', 'Namnskyltar i aluminium, akryl och mässing för kontor, dörrar och reception.', 'Namnskyltar'),
        'flaggskylt-fasad-goteborg' => array('Flaggskyltar i Göteborg', 'Flaggskyltar och fasadskyltar med dubbelsidig profil för maximal synlighet.', 'Flaggskyltar'),
        'klistermarken-goteborg'    => array('Klistermarken i Göteborg', 'Klistermärken och dekaler för alla ändamål — produktmärkning, reklam och dekoration.', 'Klistermärken'),
        'folie-dekor-goteborg'      => array('Foliedekor i Göteborg', 'Foliedekor för fönster, väggar och fordon. Skräddarsydda lösningar för företag.', 'Foliedekor'),
        'golvdekor-goteborg'        => array('Golvdekor i Göteborg', 'Golvdekor och golvgrafik för butiker, mässor och kontor. Halkfria laminat.', 'Golvdekor'),
        'frost-film-goteborg'       => array('Frostat glas film i Göteborg', 'Frostad glasfilm för insynsskydd och dekoration. Ger ett elegant frostat uttryck.', 'Frostad glasfilm'),
        'insynsskydd-goteborg'      => array('Insynsskydd i Göteborg', 'Insynsskydd med fönsterfolie för kontor och butik. Bevarar ljusinsläpp.', 'Insynsskydd'),
        'solfilm-goteborg'          => array('Solfilm i Göteborg', 'Solfilm som reducerar värme och UV-strålning. Professionell montering.', 'Solfilm'),
        'print-goteborg-2'          => array('Print & tryck i Göteborg', 'Storformatstryck, affischer, roll-ups och mässmaterial med hög kvalitet.', 'Trycktjänster'),
        'print-goteborg'            => array('Print & tryck i Göteborg', 'Storformatstryck, affischer, roll-ups och mässmaterial med hög kvalitet.', 'Trycktjänster'),
        'event-exponering-goteborg' => array('Event & exponering i Göteborg', 'Mässmaterial, roll-ups, banderoller och eventproduktion för företagsevent.', 'Eventmaterial'),
        'banderoller-goteborg'      => array('Banderoller i Göteborg', 'Banderoller i PVC och mesh för fasad, event och marknadsföring.', 'Banderoller'),
        'bildekor-goteborg'         => array('Bildekor i Göteborg', 'Fordonsdekor och bilfoliering för personbilar, skåpbilar och lastbilar.', 'Bildekor'),
        'dekaler-goteborg'          => array('Dekaler i Göteborg', 'Skräddarsydda dekaler för företag — bildekaler, fönsterdekaler, produktetiketter och kampanjdekaler.', 'Dekalproduktion'),
    );

    $current_slug = get_post_field('post_name', get_the_ID());
    if (!isset($services[$current_slug])) return $data;

    $s = $services[$current_slug];
    $data['Service'] = array(
        '@type'       => 'Service',
        'name'        => $s[0],
        'description' => $s[1],
        'serviceType' => $s[2],
        'provider'    => array('@id' => 'https://wedosigns.se/#localbusiness'),
        'areaServed'  => array(
            '@type' => 'City',
            'name'  => 'Göteborg',
        ),
        'url' => get_permalink(),
    );

    return $data;
}

// === 3. FAQ schema (injiceras via post meta om faq_data finns) ===
add_filter('rank_math/json_ld', 'sb_wedosigns_faq_schema', 99, 2);
function sb_wedosigns_faq_schema($data, $jsonld) {
    if (!is_singular('page')) return $data;

    // Hämta FAQ-data från custom field (JSON-format)
    $faq_json = get_post_meta(get_the_ID(), 'sb_faq_data', true);
    if (empty($faq_json)) return $data;

    $faqs = json_decode($faq_json, true);
    if (!is_array($faqs) || empty($faqs)) return $data;

    $items = array();
    foreach ($faqs as $faq) {
        $items[] = array(
            '@type' => 'Question',
            'name'  => $faq['q'],
            'acceptedAnswer' => array(
                '@type' => 'Answer',
                'text'  => $faq['a'],
            ),
        );
    }

    $data['FAQPage'] = array(
        '@type'      => 'FAQPage',
        'mainEntity' => $items,
    );

    return $data;
}

// === 4. OG locale fix ===
add_filter('rank_math/opengraph/locale', function() {
    return 'sv_SE';
});

// === 5. Remove Article schema from service pages (use Service instead) ===
add_filter('rank_math/json_ld', 'sb_wedosigns_cleanup_schema', 100, 2);
function sb_wedosigns_cleanup_schema($data, $jsonld) {
    if (!is_singular('page')) return $data;

    $service_slugs = array(
        'skyltar-goteborg', 'platskyltar-goteborg', 'ljusskyltar-goteborg',
        'namnskyltar-goteborg', 'flaggskylt-fasad-goteborg', 'klistermarken-goteborg',
        'folie-dekor-goteborg', 'golvdekor-goteborg', 'frost-film-goteborg',
        'insynsskydd-goteborg', 'solfilm-goteborg', 'print-goteborg-2',
        'print-goteborg', 'event-exponering-goteborg', 'banderoller-goteborg',
        'bildekor-goteborg', 'dekaler-goteborg',
    );

    $current_slug = get_post_field('post_name', get_the_ID());
    if (in_array($current_slug, $service_slugs)) {
        // Ta bort Article-schema på tjänstesidor — Service räcker
        unset($data['Article']);
    }

    return $data;
}
