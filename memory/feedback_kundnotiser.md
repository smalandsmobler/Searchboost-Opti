---
name: Stäng av tekniska notiser till kunder
description: SOP — stäng av alla automatiska notiser som annars bombarderar kund (GSC, Wordfence, WP core, WC, Rank Math, plugins)
type: feedback
---

# 🔕 SOP — Stäng av tekniska notiser till kunder

## Varför

Kunder ska INTE få tekniska notifieringar från deras egen sajt. Det skapar oro, förtroendeförlust och supportärenden.

**Konkret trigger (Ilmonte 2026-04-18)**: Peter fick ett mail från Dajana som fått "Säljaruppgifter – strukturerad data"-alert från Google Search Console. Peter tyckte inte hon skulle få sånt — det är VÅR jobb att upptäcka och åtgärda.

Vi agerar som teknisk ägare. Alla alerts ska landa hos oss (mikael.searchboost@gmail.com, mikael@searchboost.se) så vi kan agera innan kund märker något.

## Notis-källor + lösning per kund

### 1. Google Search Console (GSC)

**Mekanism**: GSC skickar automatiskt alerts till alla verifierade användare/ägare på propertyn.

**Lösning**:
- Logga in GSC som verifierad ägare (Peter eller motsvarande)
- Property → Inställningar → Användare och behörigheter
- För varje kund-användare: klicka kugghjulet → **Ta bort användare** ELLER
- Alternativ: Användaren kvar men inställningar → **Meddelanden** → stäng av alla notiser (per-användare-inställning men kräver att användaren själv gör det)
- I praktiken: **ta bort kund-användare från GSC helt**. Lägg till dem igen bara på uttrycklig begäran.
- VÅRA användare behålls: `mikael.searchboost@gmail.com` + SA `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com`

### 2. Wordfence

**Mekanism**: Wordfence skickar alerts till alla adresser i `Alerts → Alert emails`.

**Lösning (WP-admin → Wordfence → All Options → Email Alert Preferences)**:
- `Where to email alerts`: **endast** mikael.searchboost@gmail.com (eller kundspecifik searchboost-alias)
- Avmarkera alert-typer som kund inte behöver se:
  - ❌ "Alert when someone is locked out from login"
  - ❌ "Alert when the 'lost password' form is used"
  - ❌ "Alert on critical problems" (VI får dessa, inte kund)
  - ❌ "Alert on warnings"
  - ❌ "Alert when an IP address is blocked"
  - ❌ "Alert when someone has a successful login from an admin"
- Aktivera bara: scan-sammanfattning (valfritt, bara till oss)

### 3. WordPress core (admin email)

**Mekanism**: `Settings → General → Administration Email Address` — core skickar till denna (nya users, auto-updates, plugin-kritiska events).

**Lösning**:
- Ändra till mikael.searchboost@gmail.com ELLER en no-reply-alias på kundens domän som vidarebefordras till oss
- Behåll kundens e-post som "Site Owner" om det finns sånt fält (Rank Math har det) — men INTE som admin-email

### 4. WooCommerce

**Mekanism**: WC skickar order-mail till kund (OK — det ska de få) OCH admin-mail till `admin email` (vill vi ha).

**Lösning (WP-admin → WooCommerce → Inställningar → E-post)**:
- "Ny beställning" mottagare: `order@ilmonte.se` (kunden behöver dessa)
- "Avbruten beställning" / "Misslyckad beställning": ÄVEN till order@kundens-domän.se
- INTE: dubblettmottagare som personliga kund-mailadresser (Peter, Dajana osv.) — det drunknar dem i mail

### 5. Rank Math

**Mekanism**: Rank Math skickar vecko-sammanfattning "SEO Insights" + alerts om schema-fel.

**Lösning (WP-admin → Rank Math → General Settings → Misc)**:
- "Use Content AI?" och "Send SEO weekly email": **stäng av** ELLER rikta till mikael.searchboost@gmail.com
- Om kund vill ha rapporter → VI genererar egen månadsrapport, inte Rank Maths auto-mail

### 6. WP Mail SMTP

**Mekanism**: SMTP-fel (leverans misslyckades) skickas till admin-email.

**Lösning**:
- `WP Mail SMTP → Settings → General → Alert Email`: mikael.searchboost@gmail.com
- Kund ska aldrig få SMTP-fel-notiser

### 7. Plugin-specifika (per-plugin)

**Vanliga plugins som spammar**:
- **CookieYes**: Weekly consent-rapport → stäng av i plugin-inställningar
- **Yoast (om aktivt)**: Weekly summary → stäng av
- **WP Rocket**: Cache-cleared alerts → stäng av
- **UpdraftPlus**: Backup-notiser → rikta till searchboost, inte kund
- **Wordfence Live Traffic**: ALLTID stäng av notiser

**Regel**: När vi onboardar ny kund, gå igenom ALLA installerade plugins och stäng av deras auto-notiser. Standard-setting "alerts till admin-email" räcker inte — det blir ofta kundens e-post fortfarande.

## Gmail-filter-fallback

Om kund ändå får något slinker igenom: be kunden skapa Gmail-filter:
```
from:(*@ilmonte.se OR noreply@google.com OR alert@wordfence.com OR *@ilmonte.se)
subject:(wordfence OR search console OR "structured data")
→ Skip inbox, mark as read, apply label "Teknik/Searchboost sköter"
```

Men DETTA är nödplan. Första prioritet: stäng av källan.

## Onboarding-checklista (ny kund)

När vi tar över en ny kund, kör dessa på första besök:

- [ ] GSC: Ta bort kund-användare (behåll bara våra + SA)
- [ ] Wordfence: Alert-e-post **endast** searchboost
- [ ] WP admin email: searchboost-alias
- [ ] Rank Math: stäng av weekly email
- [ ] WP Mail SMTP: alert email = searchboost
- [ ] Gå igenom alla plugin-notiser
- [ ] WC: kontrollera att order-mail går rätt väg (kund får order-kopia, inte allt)

## Referens

- Ilmonte 2026-04-18: Dajana Tolic fick "Säljaruppgifter"-alert från GSC, Peter klagade → trigger för denna SOP
