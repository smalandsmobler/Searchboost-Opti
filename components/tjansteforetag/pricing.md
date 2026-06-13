# Pricing — Tjänsteföretag (B2B)

## Description

Three-tier pricing table with feature lists. The middle tier is highlighted as recommended ("Populärast"). Each tier has a CTA button. Clean comparison layout lets B2B buyers quickly understand what they get at each level. Works for monthly subscriptions, project packages and retainer models.

Use this component when:
- A B2B client wants to show transparent pricing (increases conversion and qualifies leads)
- Building a pricing page or a pricing section on the homepage
- The client has three distinct service tiers or packages

---

## 21st.dev Prompt

```
Create a three-tier pricing table for a Swedish B2B professional services company. Requirements:

Section wrapper:
- White background (#FFFFFF), padding 80px 0 on desktop, 48px 0 on mobile
- Section headline: "Välj rätt paket" — centered, dark (#141414), font-size 1.875rem, font-weight 700, margin-bottom 8px
- Subtext: centered, font-size 1rem, color #666, margin-bottom 16px
- Toggle row (optional): monthly/yearly switch using CSS + hidden checkbox, "Månadsvis" and "Årsvis" labels, accent color #0AB3FF, margin-bottom 48px

Pricing cards grid:
- Three cards in a flex row on desktop, single column on mobile, gap 24px, align-items: stretch
- Cards have equal width, middle card is taller (scale or padding)

Card layout — Basic tier (left):
- White background, border 1px solid #E0E0E0, border-radius 12px, padding 36px 28px
- Tier label: "Bas" — font-size 0.75rem, font-weight 700, letter-spacing 0.12em, text-transform uppercase, color #777
- Price: large, font-size 2.5rem, font-weight 800, color #141414, margin-top 8px
- Price unit: "/mån" in font-size 1rem, color #999, font-weight 400, aligned to bottom of number
- Short description: 1 sentence, font-size 0.875rem, color #666, margin-top 8px, margin-bottom 24px
- Feature list: <ul> with <li> items. Each: checkmark SVG (#22B573 green, 16px) + feature text in #333, font-size 0.875rem, line-height 1.8. Excluded features: muted with ✗ in #CCC and text in #BBB
- CTA button: full width, border 2px solid #0AB3FF, color #0AB3FF, background transparent, border-radius 6px, padding 13px, font-weight 600, hover: fill solid blue
- No "Populärast" badge

Card layout — Standard tier (middle, highlighted):
- Background: #0D1B2A (dark), border-radius: 14px (slightly larger), padding 44px 28px (extra top/bottom)
- Box-shadow: 0 16px 48px rgba(10,179,255,0.2)
- "Populärast" badge: absolute top -16px, centered, pill shape, background linear-gradient(90deg, #0AB3FF, #00E5D4), text white, font-size 0.75rem, font-weight 700, padding 6px 16px, border-radius 20px
- Tier label, price, description: all white variants
- Feature list: checkmarks in #0AB3FF, text in #C0CDD8, no excluded features (all included)
- CTA button: solid #0AB3FF background, text #0D1B2A, border-radius 6px, same padding, hover lighten

Card layout — Premium tier (right):
- Same style as Basic but border 2px solid #E8E4DF, background #FAFAFA
- Tier label: "Premium"
- All features included, plus extras
- CTA button: solid #141414, white text, hover #333

Below cards:
- Centered small text: "Alla priser exkl. moms. Årsabonnemang ger 2 månader gratis." in #999, font-size 0.8125rem
- "Inte säker på vilket paket som passar? " + link "Kontakta oss →" in #0AB3FF

Semantic HTML: <section>, <div> grid, <ul> feature lists, <a> for CTAs (link to contact/checkout)
Relative position on middle card wrapper for the badge
```

---

## Swedish text suggestions

**Sektionsrubrik:** Välj rätt paket
**Alternativ:** Priser som passar din verksamhet · Transparent prissättning

**Undertext:**
> Inga dolda avgifter. Byt paket när du vill. Startavgift: 0 kr.

**Paket Bas:**
- Namn: Bas
- Pris: 4 990 kr/mån
- Beskrivning: För mindre företag som vill komma igång snabbt.
- Inkluderat: Grundsetup, E-postsupport, Månadsrapport, Upp till 5 användare
- Ej inkluderat: Prioritetssupport, Dedikerad kontakt, Custom integrationer

**Paket Standard (rekommenderat):**
- Namn: Standard
- Pris: 9 990 kr/mån
- Beskrivning: Vårt mest valda paket för medelstora företag.
- Inkluderat: Allt i Bas + Prioritetssupport, Dedikerad kontakt, Upp till 20 användare, Månadsmöte, 2 custom integrationer

**Paket Premium:**
- Namn: Premium
- Pris: 19 990 kr/mån
- Beskrivning: Full service för företag med komplexa behov.
- Inkluderat: Allt i Standard + Obegränsat antal användare, SLA-garanti 99.9%, Anpassad onboarding, API-access, Dedikerat supportteam

**Fotnot:** Alla priser exkl. moms. Årsabonnemang ger 2 månader gratis.
**Hjälptext:** Inte säker på vilket paket som passar? Kontakta oss →

---

## Design notes

- Det mörka mitterkortet skapar en stark visuell hierarki — ögat dras automatiskt dit
- "Populärast"-badge (gradient) förstärker socialt bevis och leder beslutet
- Priset ska vara omöjligt att missa — font-size 2.5rem räcker, lägg inte till decimaler
- Uteslutna features (✗) i Bas-paketet påminner besökaren om vad de missar — skapar subtil upgrade-motivation
- Mobilvy: korten staplas i ordningen Premium → Standard → Bas (bäst sist) ELLER Standard → Bas → Premium (bäst i mitten men svårt med stapelordning — testa)

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| GeneratePress | Bra | Custom HTML block med inline CSS |
| Kadence | Bra | Pricing table block i Kadence Blocks Pro |
| Flatsome | Möjligt | Pricing Table widget finns men är begränsad — custom HTML bättre |
| Plain HTML | Alltid | Bäst för detta komponent p.g.a. mörkt mittkort och badge-positionering |

**Rekommenderat konverteringsmål:** `/convert html` — absolut positionerad badge och dark middle card kräver full CSS-kontroll.
