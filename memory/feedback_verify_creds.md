---
name: Verifiera ALLTID credentials innan jag säger "saknas/blockerad"
description: Kör live-test av credentials innan jag rapporterar att de saknas eller är blockerade
type: feedback
---

## Regel

**Innan jag rapporterar att en kunds credentials saknas, är ogiltiga, eller blockerar en uppgift — VERIFIERA LIVE genom att faktiskt testa dem mot API:t.**

**Why:** 2026-04-09 sa jag till Mikael att Traficator var "blockerad av `rest_cannot_create`" och behövde admin app-password — både i Traficator-omsigneringsbriefen och i task-filen. Jag baserade det på en gammal kommentar i memory. När jag senare på kvällen faktiskt testade, visade det sig att `mikael`-användaren i Traficators SSM hade full admin access, edit_posts + publish_posts + manage_options, och kunde skapa posts via REST utan problem. Hela dagen förlorad för artikelproduktion på Traficator, och briefen för omsigneringen 10:30 innehöll felaktig info som underminerade vår trovärdighet. Mikael sa: "Du sa det senast idag med traficator fastän du har det."

**How to apply:**

1. När jag läser en task-fil eller memory-fil som säger "credentials saknas / ogiltiga / blockerad" — behandla det som HYPOTES, inte fakta.

2. Innan jag rapporterar blockering till Mikael, kör ALLTID:
   ```
   URL=$(ssm get /seo-mcp/wordpress/$kund/url)
   USR=$(ssm get /seo-mcp/wordpress/$kund/username)
   APP=$(ssm get /seo-mcp/wordpress/$kund/app-password)
   curl -H "Authorization: Basic $(base64 USR:APP)" "$URL/wp-json/wp/v2/users/me?context=edit"
   → verifiera roles innehåller 'administrator' eller minst 'editor'
   → verifiera capabilities.edit_posts + publish_posts
   ```

3. Om blockering FAKTISKT finns: skriv i rapporten EXAKT vad jag testade och vad som failade (URL, error code, error message). Inte "troligen saknas".

4. Session-start rutin för kunder jag ska jobba på: kör `cred_check.py` (se `system.md`) som rapporterar per kund: URL, user, role, can_write, can_manage_options. Filen sparas i `/tmp/sbs_cred_check_{date}.json` och läses innan jag rapporterar status.

5. Uppdatera task-filer OMEDELBART när verifieringen motsäger dem. Gammal missvisande info får inte ligga kvar.

**Gäller också för:**
- Shopify access tokens (test: GET /admin/api/.../shop.json)
- GSC service account access (test: search-analytics query)
- BigQuery (test: SELECT 1)
- Alla andra externa API:er med credentials i SSM
