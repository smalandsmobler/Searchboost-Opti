# SMK Abicart — Analytics Fix

**Problem**: `analytics_storage` är "denied" som standard → GA4 spårar ingen data förrän besökaren aktivt accepterar cookie-bannern.

**Rotorsak**: `"defaultConsent":false` i temainställningarna → Abicart sätter `analytics_storage: "denied"` INNAN GTM ens laddar.

---

## Snabbfix (30 sekunder i Abicart admin)

1. Öppna: https://admin.abicart.se/sv/editor/66230/theme/196883
2. Klicka **Tillägg** (tredje fliken i vänster sidopanel)
3. Klicka **Cookies** i undermenyn
4. Slå PÅ "Standard samtycke" (toggle → grön)
5. Klicka **Spara**

Det ändrar `defaultConsent` från `false` → `true`, vilket gör att GA4 börjar spåra direkt (opt-out-modell).

---

## OBS — GDPR

`defaultConsent:true` = analytics-spårning sker automatiskt, besökaren kan aktivt opt-outa.  
`defaultConsent:false` = analytics-spårning kräver aktivt godkännande (opt-in — stricter GDPR).

Sverige/EU kräver tekniskt opt-in för analytics-cookies, men opt-out är vanligare i praktiken.  
Välj baserat på vad kunden föredrar.

---

## Alternativ: Kräv inget val alls (GTM-approach)

Om man vill behålla `defaultConsent:false` men ändå få grundläggande analytics:

1. Öppna GTM (container GTM-KRMVQ6FQ)
2. Skapa ny tag: Custom HTML
3. Innehåll:
```html
<script>
  window.gtag('consent', 'update', {analytics_storage: 'granted'});
</script>
```
4. Trigger: Consent Initialization — All Pages
5. Publicera

Detta åsidosätter Abicarts "denied"-standard direkt när GTM laddar.

---

## Teknisk verifiering (efter fix)

Kontrollera i `www.smalandskontorsmobler.se` källkod:
```
"defaultConsent":true   ← ska vara true efter fix
```

Eller i Chrome DevTools Console:
```javascript
dataLayer.filter(e => e.event === 'default_consent')
```

Datum: 2026-03-13
