# Babylovesgrowth

En app för att följa ditt barns tillväxt och utveckling — vikt, längd, huvudomfång, milstolpar och dagliga rutiner.

## Funktioner

- Registrera vikt, längd och huvudomfång över tid
- Logga utvecklingsmilstolpar (första leendet, krypa, gå, prata)
- Visualisera tillväxtkurvor mot WHO-percentiler
- Följa matning, sömn och blöjbyten
- Exportera data för att dela med BVC/barnläkare

## Kom igång

### Förutsättningar

- Node.js v18+
- npm

### Installation

```bash
git clone https://github.com/smalandsmobler/Babylovesgrowth.git
cd Babylovesgrowth
npm install
```

### Starta servern

```bash
npm start
```

Servern startar på `http://localhost:3000`.

### API-endpoints

| Metod | Endpoint | Beskrivning |
|-------|----------|-------------|
| GET | `/api/babies` | Lista alla barn |
| POST | `/api/babies` | Lägg till nytt barn |
| GET | `/api/babies/:id` | Hämta barn med ID |
| POST | `/api/babies/:id/growth` | Registrera tillväxtdata |
| GET | `/api/babies/:id/growth` | Hämta tillväxthistorik |
| POST | `/api/babies/:id/milestones` | Logga milstolpe |
| GET | `/api/babies/:id/milestones` | Hämta milstolpar |
| GET | `/api/babies/:id/growth/chart` | Tillväxtkurva med percentiler |

## Projektstruktur

```
Babylovesgrowth/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── package.json
├── src/
│   ├── index.js              # Express-server
│   ├── routes/
│   │   ├── babies.js         # Baby CRUD
│   │   ├── growth.js         # Tillväxtdata
│   │   └── milestones.js     # Milstolpar
│   ├── models/
│   │   ├── Baby.js
│   │   ├── Growth.js
│   │   └── Milestone.js
│   └── data/
│       └── who-percentiles.js  # WHO-tillväxtdata
├── docs/
│   ├── kostnadsanalys.md
│   └── forutsattningar.md
└── tests/
```

## Bidra

Se [CONTRIBUTING.md](CONTRIBUTING.md) för riktlinjer.

## Licens

MIT — se [LICENSE](LICENSE).
