# Searchboost.se — Divi CSS Installation

## 1. Lagg till Orbitron-font

**Divi -> Theme Options -> Integration -> Add code to the head:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Orbitron:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
```

## 2. Klistra in CSS

**Divi -> Theme Options -> General -> Custom CSS:**

Klistra in HELA innehallet fran `config/searchboost-divi-custom.css`

## 3. Rensa cache

1. **Divi -> Theme Options -> Builder -> Advanced -> Static CSS File Generation -> Clear**
2. Om du har cacheplugin (WP Super Cache, W3TC, LiteSpeed): rensa dar ocksa
3. Oppna sajten i inkognito (Ctrl+Shift+N) for att se andringarna

## 4. Verifiera

- [x] Mork bakgrund med lila gradient
- [x] Rubriker i Orbitron med neon-glow
- [x] Knappar med rosa/lila gradient + hover-glow
- [x] Glassmorphism pa kort/blurbs
- [x] Vit brodtext, lasbar
- [x] Ingen babyrosa/pastell kvar
- [x] Footer mork med rosa accenter
- [x] Responsivt pa mobil

## Fargpalett — Referens

| Anvandning | Farg | Hex |
|-----------|------|-----|
| Bakgrund | Mork indigo | #0A0A1A |
| Bakgrund gradient | Djup lila | #120A1F |
| Text | Vit | #FFFFFF |
| Brodtext | Ljus lavendel | #E0D8F0 |
| Accent 1 | Hot pink | #FF69B4 |
| Accent 2 | Magenta-lila | #D946EF |
| Accent 3 | Ljus lila | #A78BFA |
| Accent 4 | Rosa | #F472B6 |
| Muted | Gra | #666666 |

## Bilder

Alla bilder pa sajten ska ha 2026 i alt-text och caption dar det ar relevant.
Kontrollera sarskilt:
- Hero-bilder (ingen hardkodad artal i bilden)
- Case study-bilder
- Footer copyright-text
