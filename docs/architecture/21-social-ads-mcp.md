# 21 — Social + Ads MCP-server

> Scaffold-status 2026-05-31. Verktygsdefinitioner och BQ-loggning klart, per-plattform-impl kvar.

## Mål

En enda MCP-server som ger Claude följande verktygskatalog över alla kanaler:

### Posting
- `schedule_linkedin_post`
- `schedule_facebook_post`
- `schedule_instagram_post`
- `post_x`

### Ads
- `list_google_ads_campaigns`
- `pause_google_ads_campaign`
- `set_google_ads_budget`
- `list_meta_ads_campaigns`
- `pause_meta_ads_campaign`

### Uniform performance-read
- `get_channel_performance` — samma shape oavsett kanal

## Varför en gemensam MCP

Tidigare hade vi separata Lambdas (`social-poster`, `google-ads-optimizer`, `social-scheduler`) som var schemalagda men inte conversation-styrda. Att gå via MCP betyder att Mikael (eller Claude på Mikaels uppdrag) kan säga "pausa Google Ads-kampanjen för Möbelrondellen" och få det gjort direkt, plus att alla åtgärder loggas i `social_ads_actions_log` så vi vet vad som hände när.

## Filer

- `tools/social-ads-mcp/src/index.js` — server + verktygsdefinitioner
- `tools/social-ads-mcp/package.json` — deps (@modelcontextprotocol/sdk, @aws-sdk/client-ssm, @google-cloud/bigquery, axios)
- `.mcp.json` har `"social-ads"`-server registrerad

## Credentials (SSM)

Per kund, under `/seo-mcp/integrations/<customer_id>/`:

| Nyckel | För |
|--------|-----|
| `linkedin-access-token` | LinkedIn Marketing API |
| `linkedin-company-id` | LinkedIn (vilken sida vi postar till) |
| `facebook-page-token` | FB Graph API |
| `facebook-page-id` | FB Page |
| `instagram-business-id` | IG Business-konto (länkad till FB Page) |
| `twitter-bearer` | X API v2 Bearer-token |
| `google-ads-customer-id` | Google Ads customer-ID (format `123-456-7890`) |
| `google-ads-refresh-token` | OAuth refresh token för API-access |
| `meta-access-token` | Meta Ads (samma som FB Page-token om Business-konto) |
| `meta-ad-account-id` | Meta Ads account-ID (`act_<id>`) |

Saknas en cred → verktyget returnerar `{ error: "Saknar X-creds för Y" }` och en länk till SSM-pathen.

## BQ-loggning

Alla åtgärder loggar till `seo-aouto.seo_data.social_ads_actions_log`:

```sql
CREATE TABLE social_ads_actions_log (
  timestamp TIMESTAMP NOT NULL,
  customer_id STRING NOT NULL,
  channel STRING NOT NULL,
  action STRING NOT NULL,
  status STRING NOT NULL,
  payload STRING,
  result STRING
) PARTITION BY DATE(timestamp)
CLUSTER BY customer_id, channel
```

Detta är spindeln för "vad gjorde Mikael/Claude för kund X i april" — varje schedule_post, pause_campaign, set_budget hamnar här.

## Postningsregler (hård-kodade)

- **LinkedIn:** max 3/vecka per kund, sön/tis/tors enbart (regel från `feedback_linkedin_schedule.md`)
- **Facebook:** ingen hård gräns idag — sätts per kund i `customer_channels.next_action`
- **Instagram:** kräver image_url + Business-konto (annars 400)
- **X:** 280 tecken max, trådning för längre innehåll

## GÖR vs BORDE GÖRA

| Område | GÖR idag | BORDE GÖRA (gap) |
|--------|----------|-------------------|
| Verktygsdefinitioner | ✅ 11 verktyg | — |
| BQ-loggning av scaffold-anrop | ✅ | — |
| LinkedIn Marketing API impl | ❌ | POST /v2/ugcPosts + bild-upload via /v2/assets |
| FB Graph API impl | ❌ | POST /<page-id>/feed + scheduled_publish_time |
| IG Graph API impl | ❌ | Två-stegs: media-container + /media_publish |
| X API impl | ❌ | POST /2/tweets |
| Google Ads API v17 impl | ❌ | google-ads-node SDK, search + mutate operations |
| Meta Marketing API impl | ❌ | facebook-nodejs-business-sdk |
| Per-kund-budget-guards | ❌ | Stoppa budget-höjning > +50% utan Mikaels OK |
| Approval-loop för posts | ❌ | LinkedIn-posts > 200 tecken triggar Mikael-mail innan publicering |
| Webhook-mottagare för ads-händelser | ❌ | FB/Google Ads conversion-pings → BQ direkt |

## Säkerhet

- Tokens i SSM (SecureString) — aldrig i kod
- Verktyg returnerar aldrig token-värdet i sina svar
- Audit-trail i BQ — vi vet alltid vem (Claude/Mikael) gjorde vad och när
- "scaffold"-status på alla impls just nu — Claude kan inte råka skicka ett verkligt LinkedIn-post tills impl är klar

## Nästa steg (prioritet)

1. **LinkedIn impl** — Mikael har redan tokens för humanpower + ilmonte i SSM, snabbt att aktivera
2. **Google Ads list + pause** — Mikael behöver kunna pausa kampanjer åt Möbelrondellen via prompt
3. **FB Page posts** — Tobler kör meta_ads aktivt
4. **IG + X** — om kunderna efterfrågar
