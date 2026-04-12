---
name: WP Credentials
description: WordPress app-passwords för alla kunder — läses av mobil-Claude direkt
type: credentials
---

# WordPress Credentials

> Skyddas av identitetsverifiering (memory/identity.md).
> Uppdatera här OCH i SSM om lösenord byts.

| Site-ID | URL | Username | App-password |
|---------|-----|----------|--------------|
| smalandskontorsmobler | https://smalandskontorsmobler.se | searchboost | ySlF 8pM4 AAS3 i8aB dK9g g51C |
| mobelrondellen | https://mobelrondellen.se | Mickedanne | Dpaf 3CkT Gyhx YUSJ bQt4 bpE4 |
| jelmtech | https://jelmtech.se | mikael_searchboost | Y63T k99j dfxc sUKC NPop ZhEe |
| searchboost | https://searchboost.se | mikael@searchboost.se | UB2t Tbni tHpw R3GW kBrl 1rnh |
| traficator | https://traficator.se | mikael | V7gn HAb6 p9Yn 85BZ ujMi OINQ |
| humanpower | https://humanpower.se | sbadmin | QMg6 NFuF zUtW awbi xnkw 5ETd |
| nordicsnusonline | https://nordicsnusonline.com | mikael | nHmn 3xeN onyp UMBI 5doo 5FUq |
| tobler | https://tobler.se | mikael | mxln FGug xkKb eZo6 VKFy SzHm |

## Användning — WP REST API

```bash
# Exempel: hämta sidor på SMK
curl -su "searchboost:ySlF 8pM4 AAS3 i8aB dK9g g51C" \
  "https://smalandskontorsmobler.se/wp-json/wp/v2/pages?per_page=5"

# Uppdatera en sida (POST)
curl -su "searchboost:ySlF 8pM4 AAS3 i8aB dK9g g51C" \
  -X POST "https://smalandskontorsmobler.se/wp-json/wp/v2/pages/9311" \
  -H "Content-Type: application/json" \
  -d '{"content": "..."}'
```
