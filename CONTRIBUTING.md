# Bidra till Babylovesgrowth

Tack för ditt intresse att bidra! Så här kommer du igång.

## Hur du bidrar

1. Forka repot
2. Skapa en feature-branch (`git checkout -b feature/min-funktion`)
3. Gör dina ändringar
4. Kör testerna (`npm test`)
5. Committa (`git commit -m "Lägg till min funktion"`)
6. Pusha (`git push origin feature/min-funktion`)
7. Öppna en Pull Request

## Utvecklingsmiljö

```bash
git clone https://github.com/smalandsmobler/Babylovesgrowth.git
cd Babylovesgrowth
npm install
npm run dev   # Startar med --watch
```

## Lägga till en ny route

1. Skapa en ny fil i `src/routes/`
2. Skapa tillhörande modell i `src/models/`
3. Registrera routen i `src/index.js`
4. Lägg till tester i `tests/`

## Kodstil

- ES-moduler (`import`/`export`)
- Följ befintliga namnkonventioner
- Håll funktioner fokuserade och små

## Rapportera buggar

Öppna ett issue med:
- Tydlig beskrivning av buggen
- Steg för att återskapa
- Förväntat vs faktiskt beteende

## Föreslå funktioner

Öppna ett issue som beskriver:
- Användningsfallet
- Föreslagen funktionalitet
- Eventuella alternativ
